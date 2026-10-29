"""Raster: turns a RegionSpec into read-only cell grids (height, material, paths, stairs)."""
from dataclasses import dataclass
import numpy as np
from . import shape

VOID = -1
GRASS, ASH = 0, 1
MATERIALS = {"grass": GRASS, "ash": ASH}


def _ro(a):
    a = a.copy()
    a.setflags(write=False)
    return a


@dataclass(frozen=True)
class StairCell:
    terrace: str
    level: int      # level of the plateau the stair climbs onto
    col: int        # 0..w-1 across the stair
    width: int
    row: int        # 0 = lip row, 1..2 = face rows, 3 = loose stones at the foot
    material: int


@dataclass(frozen=True)
class Grids:
    w: int
    h: int
    height: np.ndarray        # top level per cell, -1 = sky
    region: np.ndarray        # index into region_ids, -1 = none
    region_ids: tuple
    mat_by_level: tuple       # one int grid per level: material of that level's surface
    path: np.ndarray          # bool: dirt/cobble path cell
    stairs: dict              # (x, y) -> StairCell
    bridges: tuple            # ((x, y0, y1), ...)
    max_level: int
    cuts: tuple = ()
    jogs: tuple = ()

    def region_mask(self, level):
        return self.height >= level


def _fill(grid, rects, value):
    for x0, y0, x1, y1 in rects:
        grid[y0:y1, x0:x1] = value


def _path_cells(path, w, h, route=None):
    m = np.zeros((h, w), bool)
    lo = -((path.width - 1) // 2) if path.width % 2 else -(path.width // 2)
    hi = lo + path.width - 1
    pts = route or path.route
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        if x0 != x1 and y0 != y1:
            raise ValueError("path %s has a diagonal run %s->%s" % (path.id, (x0, y0), (x1, y1)))
        xa, xb = sorted((x0, x1))
        ya, yb = sorted((y0, y1))
        m[ya + lo: yb + hi + 1, xa + lo: xb + hi + 1] = True
    return m


def build(spec):
    w, h = spec.width, spec.height
    height = np.full((h, w), VOID, int)
    region = np.full((h, w), -1, int)
    ids = tuple(l.id for l in spec.land)
    for i, land in enumerate(spec.land):
        _fill(height, land.rects, 0)
        _fill(region, land.rects, i)
    max_level = max(t.level for t in spec.terraces)
    mats = []
    base = np.full((h, w), GRASS, int)
    for patch in spec.materials:
        _fill(base, patch.rects, MATERIALS[patch.material])
        for rid in patch.regions:
            base[region == ids.index(rid)] = MATERIALS[patch.material]
    base = _jitter_seam(base, height)
    for t in spec.terraces:
        for x0, y0, x1, y1 in t.rects:
            blk = height[y0:y1, x0:x1]
            blk[blk < t.level] = t.level
    for level in range(max_level + 1):
        m = base.copy()
        for t in sorted(spec.terraces, key=lambda t: t.level):
            if t.level <= level:
                _fill(m, t.rects, MATERIALS[t.material])
        mats.append(_ro(m))
    stairs = {}
    for s in spec.stairs:
        t = spec.terrace(s.terrace)
        mat = MATERIALS[t.material]
        # Ash stairs used to be one column and disappeared into the basalt.
        # Every stair is the same 3-wide stone flight as the earth terraces.
        width = 3
        lip = _lip_row(height, t, s.x, width)
        for c in range(width):
            for r in range(4):
                stairs[(s.x + c, lip + r)] = StairCell(t.id, t.level, c, width, r, mat)
    stair_band = np.zeros((h, w), bool)
    for (x, y), st in stairs.items():
        if st.row < 3:
            stair_band[y, x] = True
    path = np.zeros((h, w), bool)
    jogs = []
    for p in spec.paths:
        cells, ok = _jogged(p, w, h, height, stair_band)
        path |= cells
        jogs += ok
    _fill(path, spec.plazas, True)
    path |= _landings(stairs, path, w, h)
    keep = path | stair_band
    for (x, y), st in stairs.items():
        keep[y, x] = True
    for _, _, mx, my in spec.markers:
        keep[max(0, int(my) - 2): int(my) + 3, max(0, int(mx) - 2): int(mx) + 3] = True
    for b in spec.bridges:
        keep[max(0, b.y0 - 2): b.y1 + 3, b.x - 2: b.x + 3] = True
    height, cuts = shape.round_corners(height, keep)
    region[height < 0] = -1
    path &= height >= 0
    return Grids(w, h, _ro(height), _ro(region), ids, tuple(mats), _ro(path), dict(stairs),
                 tuple((b.x, b.y0, b.y1) for b in spec.bridges), max_level,
                 tuple(cuts), tuple(jogs))


def _lip_row(height, t, x, width):
    rows = set()
    for c in range(width):
        col = height[:, x + c] >= t.level
        ys = [y for y in range(height.shape[0] - 1) if col[y] and not col[y + 1]
              and any(r[0] <= x + c < r[2] and r[1] <= y < r[3] for r in t.rects)]
        if not ys:
            raise ValueError("stair %s@%d: no south lip" % (t.id, x))
        rows.add(max(ys))
    if len(rows) != 1:
        raise ValueError("stair %s@%d straddles a step in the lip %s" % (t.id, x, sorted(rows)))
    return rows.pop()


def _jogged(p, w, h, height, stair_band):
    """Path cells with one-tile jogs on long runs; a jog is dropped if it would leave its level,
    touch a rim (any neighbour at another height) or enter a stair."""
    base = _path_cells(p, w, h)

    cells = base.copy()
    ok = []
    pts = p.route
    for i, (a, b) in enumerate(zip(pts, pts[1:])):
        jr = shape.jog_route("%s:%d" % (p.id, i), (a, b))
        if len(jr) == 2:
            continue
        m = _path_cells(p, w, h, jr)
        new = m & ~base
        ys, xs = np.nonzero(new)
        lvl = height[a[1], a[0]]
        good = len(xs) > 0
        for x, y in zip(xs, ys):
            blk = height[max(0, y - 2): y + 3, max(0, x - 2): x + 3]
            if (blk != lvl).any() or stair_band[max(0, y - 1): y + 2, max(0, x - 1): x + 2].any():
                good = False
                break
        if good:
            # the jog shifts the band: cells of the straight run that the bump vacated go back to grass
            seg = _path_cells(p, w, h, (a, b))
            cells = (cells & ~(seg & ~m)) | m
            ok.append((p.id, i, jr[1:-1]))
    return cells, ok


def _landings(stairs, path, w, h):
    """Where a 2-wide path meets a 3-wide stair, flare it to the stair width for two rows."""
    out = np.zeros((h, w), bool)
    tops = {}
    for (x, y), st in stairs.items():
        if st.row == 0:
            tops.setdefault((st.terrace, y), []).append(x)
    for (tid, lip), xs in tops.items():
        x0, x1 = min(xs), max(xs)
        below = path[lip + 3: lip + 6, x0: x1 + 1].any()
        above = path[max(0, lip - 3): lip, x0: x1 + 1].any()
        if below:
            out[lip + 3: lip + 5, x0: x1 + 1] = True
        if above:
            out[lip - 1: lip, x0: x1 + 1] = True
    return out


def _jitter_seam(base, height, seed=0x5EA):
    """Break the straight grass/ash rect seam into an organic edge (cells within 2 of it flip by noise),
    then clean 1-wide slivers so the hole-set rims can draw every cell."""
    from .dress import value_noise, open2
    h, w = base.shape
    ash = base == ASH
    land = height >= 0
    near = np.zeros_like(ash)
    for dy in range(-2, 3):
        for dx in range(-2, 3):
            sh = np.roll(np.roll(ash, dy, 0), dx, 1)
            sl = np.roll(np.roll(land, dy, 0), dx, 1)
            near |= (sh != ash) & sl
    # only near a land-land seam, never along the island's sky edge
    edge = np.zeros_like(ash)
    for dy in range(-2, 3):
        for dx in range(-2, 3):
            edge |= ~np.roll(np.roll(land, dy, 0), dx, 1)
    near &= ~edge
    n = value_noise(w, h, 3, seed)
    new = ash.copy()
    new[near & ~ash & (n > 0.62) & land] = True
    new[near & ash & (n < 0.38) & land] = False
    for _ in range(3):
        new = open2(new)
        new = ~open2(~new)
    out = base.copy()
    out[new] = ASH
    out[~new & (base == ASH)] = GRASS
    return out
