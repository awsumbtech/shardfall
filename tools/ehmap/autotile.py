"""Autotile: picks a Kenmi tile name for every cell of every layer from the grids.

Each rule family is its own class with one job. Nothing here draws pixels.
Layer order per level L (bottom to top): ground, ash, path, shadow, cliff.
"""
from dataclasses import dataclass
import numpy as np
from .raster import GRASS, ASH
from .collision import skirt_rows

DIRS = {"n": (0, -1), "s": (0, 1), "e": (1, 0), "w": (-1, 0),
        "ne": (1, -1), "nw": (-1, -1), "se": (1, 1), "sw": (-1, 1)}


def _hash(x, y, salt=0):
    v = (x * 73856093) ^ (y * 19349663) ^ (salt * 83492791)
    return (v & 0xFFFF) / 65535.0


class Mask:
    """Read-only bool grid with out-of-bounds = False."""
    def __init__(self, a):
        self._a = a

    def __call__(self, x, y):
        h, w = self._a.shape
        return 0 <= x < w and 0 <= y < h and bool(self._a[y, x])

    def nb(self, x, y):
        return {k: self(x + dx, y + dy) for k, (dx, dy) in DIRS.items()}


class Issues:
    def __init__(self):
        self._items = []

    def add(self, kind, x, y, note=""):
        self._items.append((kind, x, y, note))

    @property
    def items(self):
        return tuple(self._items)


class EarthTops:
    """Grass plateau top with Kenmi's dirt rim; south lip carries the face top."""
    def pick(self, n, issues, x, y):
        if (not n["n"] and not n["s"]) or (not n["e"] and not n["w"]):
            issues.add("thin", x, y)
        if not n["n"]:
            return "top_nw" if not n["w"] else "top_ne" if not n["e"] else "top_n"
        if not n["s"]:
            return "lip_sw" if not n["w"] else "lip_se" if not n["e"] else "lip_s"
        if not n["w"]:
            return "top_w"
        if not n["e"]:
            return "top_e"
        miss = [d for d in ("nw", "ne", "sw", "se") if not n[d]]
        if len(miss) > 1:
            issues.add("pinch", x, y, ",".join(miss))
        return "in_" + miss[0] if miss else None


class AshTops:
    """Volcano ash ground: hole-set rims for edges, island corners, cobble lip on south.
    Raised ash (level >= 1) is a cobbled basalt platform: opaque cobble everywhere, basalt face below."""
    def pick(self, n, issues, x, y, level=0, outer=False):
        if level >= 1 and not (outer and n["s"]):
            if not n["s"]:
                return "ash_lip_w" if not n["w"] else "ash_lip_e" if not n["e"] else "ash_lip"
            return "ash_lip" if _hash(x, y, 9) < 0.5 else "ash_cob_a"
        if (not n["n"] and not n["s"]) or (not n["e"] and not n["w"]):
            issues.add("thin-ash", x, y)
        if not n["s"]:
            return "ash_lip_w" if not n["w"] else "ash_lip_e" if not n["e"] else "ash_lip"
        if not n["n"]:
            return "ash_nw" if not n["w"] else "ash_ne" if not n["e"] else "ash_n"
        if not n["w"]:
            return "ash_w"
        if not n["e"]:
            return "ash_e"
        miss = [d for d in ("nw", "ne", "sw", "se") if not n[d]]
        if miss:
            return "ash_in_" + miss[0]
        return "ash_%d" % int(_hash(x, y, 3) * 9)


class PathEdges:
    """Grass cell beside dirt: Kenmi grass-over-dirt set (edges, outer and inner corners)."""
    SIDE = {("s",): "pe_s", ("n",): "pe_n", ("e",): "pe_e", ("w",): "pe_w",
            ("n", "w"): "pe_nw", ("e", "n"): "pe_ne", ("s", "w"): "pe_sw", ("e", "s"): "pe_se"}

    def pick(self, d):
        sides = tuple(sorted(k for k in ("n", "s", "e", "w") if d[k]))
        if sides:
            return self.SIDE.get(sides)
        diag = [k for k in ("se", "sw", "ne", "nw") if d[k]]
        if len(diag) == 1:
            return "pe_in_" + diag[0]
        return None if not diag else False


def close_paths(path, region, max_iter=8):
    """Grow dirt into grass cells Kenmi's 13-piece set can't draw (dirt on opposite sides,
    three sides, or two diagonals). Returns a new read-only grid."""
    p = path.copy()
    pe = PathEdges()
    h, w = p.shape
    for _ in range(max_iter):
        changed = False
        m = Mask(p)
        for y in range(h):
            for x in range(w):
                if p[y, x] or not region[y, x]:
                    continue
                d = m.nb(x, y)
                if any(d.values()) and pe.pick(d) in (None, False) and any(d[k] for k in DIRS):
                    p[y, x] = True
                    changed = True
        if not changed:
            break
    p.setflags(write=False)
    return p


@dataclass(frozen=True)
class Layer:
    name: str
    level: int
    cells: np.ndarray   # object grid of tile names / None


class Autotiler:
    def __init__(self, grids):
        self.g = grids
        self.issues = Issues()
        self.earth = EarthTops()
        self.ash = AshTops()
        self.pe = PathEdges()

    def _grid(self):
        return np.full((self.g.h, self.g.w), None, object)

    def build(self):
        g = self.g
        layers = []
        paths = []
        for L in range(g.max_level + 1):
            reg = g.height >= L
            onlvl = g.path & (g.height == L)
            onlvl &= ~np.array([[(x, y) in g.stairs and g.stairs[(x, y)].row < 3 for x in range(g.w)] for y in range(g.h)])
            paths.append(close_paths(onlvl, reg & (g.height == L)))
        self.paths = tuple(paths)
        for L in range(g.max_level + 1):
            layers.extend(self._level(L))
        layers.append(Layer("bridges", 9, self._bridges()))
        return tuple(layers)

    def _level(self, L):
        g = self.g
        reg = Mask(g.height >= L)
        mat = g.mat_by_level[L]
        ashm = Mask((g.height >= L) & (mat == ASH))
        path = Mask(self.paths[L])
        land0 = Mask(g.height >= 0)
        ground, ash, pathl, shade, cliff = (self._grid() for _ in range(5))
        for y in range(g.h):
            for x in range(g.w):
                if not reg(x, y):
                    continue
                n = reg.nb(x, y)
                if mat[y, x] == ASH:
                    ash[y, x] = self.ash.pick(ashm.nb(x, y), self.issues, x, y, L,
                                              not all(land0.nb(x, y).values()))
                    near_grass = any(reg(x + dx, y + dy) and mat[y + dy, x + dx] == GRASS
                                     for dx, dy in DIRS.values() if 0 <= x + dx < g.w and 0 <= y + dy < g.h)
                    if all(n.values()) and near_grass:
                        ground[y, x] = "grass"
                    if path(x, y):
                        pathl[y, x] = "ash_cob_a" if _hash(x, y, 5) < 0.5 else "ash_cob_b"
                    continue
                t = self.earth.pick(n, self.issues, x, y)
                if t is None:
                    if path(x, y):
                        ground[y, x] = "path"
                        r = _hash(x, y, 7)
                        if r < 0.10:
                            pathl[y, x] = ("pebbles_a", "pebbles_b", "pebbles_c")[int(r * 30) % 3]
                    else:
                        e = self.pe.pick(path.nb(x, y))
                        if e:
                            ground[y, x] = e
                        else:
                            r = _hash(x, y, 1)
                            ground[y, x] = ("grass_tuft_a" if r < 0.03 else "grass_tuft_b" if r < 0.06
                                            else "grass_tuft_c" if r < 0.08 else "grass")
                else:
                    ground[y, x] = t
                    if path(x, y):
                        self.issues.add("path-on-rim", x, y, "L%d" % L)
                    elif any(path.nb(x, y).values()) and not self._near_stair(x, y):
                        self.issues.add("path-touches-rim", x, y, "L%d" % L)
        self._faces(L, reg, mat, cliff, shade, ash)
        return [Layer("L%d/ground" % L, L, ground), Layer("L%d/ash" % L, L, ash),
                Layer("L%d/path" % L, L, pathl), Layer("L%d/shadow" % L, L, shade),
                Layer("L%d/cliff" % L, L, cliff)]

    def _near_stair(self, x, y):
        return any((x + dx, y + dy) in self.g.stairs for dx in (-1, 0, 1) for dy in (-1, 0, 1))

    def _faces(self, L, reg, mat, cliff, shade, ashl):
        g = self.g
        if L == 0:
            land = Mask(g.height >= 0)
        else:
            land = Mask(g.height >= 0)
        for y in range(g.h):
            for x in range(g.w):
                if not reg(x, y) or reg(x, y + 1):
                    continue
                isb = lambda xx: reg(xx, y) and not reg(xx, y + 1)
                west_end = not isb(x - 1)
                east_end = not isb(x + 1)
                st = g.stairs.get((x, y))
                if st and st.level != L:
                    st = None
                basalt = mat[y, x] == ASH
                # Island skirt: level-0 earth over open sky gets a taller face.
                # skirt_rows agrees with collision, including the hook ledge's even base.
                rows = skirt_rows(g, x, y, basalt, L)
                for r in range(1, rows + 1):
                    yy = y + r
                    if yy >= g.h:
                        break
                    if reg(x, yy):
                        self.issues.add("face-hits-plateau", x, yy, "L%d" % L)
                        break
                    if L > 0 and g.height[yy, x] >= 0 and g.height[yy, x] < L - 1:
                        self.issues.add("face-over-lower", x, yy, "L%d" % L)
                    if st and basalt:
                        cliff[yy, x] = self._ash_stair(st, r)
                    elif st:
                        cliff[yy, x] = self._stair_name(st, min(r, 3))
                    elif basalt:
                        cliff[yy, x] = ("bas_w%d" if (x % 2 == 0 and not east_end) or west_end else "bas_e%d") % (r - 1)
                    else:
                        part = "face" if r < rows else "foot"
                        cliff[yy, x] = part + ("_w" if west_end else "_e" if east_end else "")
                if st and basalt:
                    # Volcano lip stays ash cobble. No meadow-stone cap, no dark foot block.
                    pass
                elif st:
                    cliff[y, x] = self._stair_name(st, 0)
                    if y + 3 < g.h and land(x, y + 3):
                        shade[y + 3, x] = self._stair_name(st, 3)
                elif not basalt and y + 3 < g.h and land(x, y + 3) and not reg(x, y + 3):
                    shade[y + 3, x] = "shade" + ("_w" if west_end else "_e" if east_end else "")

    def _stair_name(self, st, r):
        part = ("t", "m", "b", "r")[r]
        side = "w" if st.col == 0 else "e" if st.col == st.width - 1 else ""
        return "stair_" + part + side

    def _ash_stair(self, st, r):
        """The drawn tread only. Cheek columns are the ordinary basalt face, not steps."""
        idx = min(max(r, 1), 3) - 1
        if st.width == 1:
            return "bas_stair_%d" % idx
        if st.col == 0:
            return "bas_w%d" % idx
        if st.col == st.width - 1:
            return "bas_e%d" % idx
        return "bas_stair_%d" % idx

    def _bridges(self):
        out = self._grid()
        for x, y0, y1 in self.g.bridges:
            for y in range(y0, y1 + 1):
                out[y, x] = "bridge_v_top" if y == y0 else "bridge_v_bot" if y == y1 else "bridge_v_mid"
        return out
