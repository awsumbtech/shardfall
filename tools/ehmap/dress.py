"""Dressing: grass colour patches, ash crack patches, seeded small decor, ash shadows.
Reads the grids and the base autotile layers; writes new layers only. All seeded, so stable."""
import numpy as np
from .raster import GRASS, ASH
from .autotile import Layer, Mask, DIRS, _hash

PLAIN = {"grass", "grass_tuft_a", "grass_tuft_b", "grass_tuft_c"}


def value_noise(w, h, scale, seed):
    rng = np.random.default_rng(seed)
    gw, gh = w // scale + 3, h // scale + 3
    g = rng.random((gh, gw))
    ys, xs = np.mgrid[0:h, 0:w] / scale
    x0, y0 = xs.astype(int), ys.astype(int)
    fx, fy = xs - x0, ys - y0
    fx, fy = fx * fx * (3 - 2 * fx), fy * fy * (3 - 2 * fy)
    a = g[y0, x0] * (1 - fx) + g[y0, x0 + 1] * fx
    b = g[y0 + 1, x0] * (1 - fx) + g[y0 + 1, x0 + 1] * fx
    return a * (1 - fy) + b * fy


def open2(m):
    """Keep only cells that belong to some full 2x2 block (removes 1-wide spurs)."""
    blk = np.zeros_like(m)
    blk[:-1, :-1] = m[:-1, :-1] & m[1:, :-1] & m[:-1, 1:] & m[1:, 1:]
    out = blk.copy()
    out[1:, :] |= blk[:-1, :]
    out[:, 1:] |= blk[:, :-1]
    out[1:, 1:] |= blk[:-1, :-1]
    return out & m


def patch_name(nb):
    """13-piece patch picker; None = cell can't be drawn (caller drops it)."""
    n, s, e, w = nb["n"], nb["s"], nb["e"], nb["w"]
    if (not n and not s) or (not e and not w):
        return None
    if not n:
        if nb["se"] if not w else nb["sw"] if not e else (nb["sw"] and nb["se"]):
            return "nw" if not w else "ne" if not e else "n"
        return None
    if not s:
        if nb["ne"] if not w else nb["nw"] if not e else (nb["nw"] and nb["ne"]):
            return "sw" if not w else "se" if not e else "s"
        return None
    if not w:
        return "w" if nb["ne"] and nb["se"] else None
    if not e:
        return "e" if nb["nw"] and nb["sw"] else None
    miss = [d for d in ("nw", "ne", "sw", "se") if not nb[d]]
    if len(miss) > 1:
        return None
    return "in_" + miss[0] if miss else "mid"


def settle(mask):
    m = mask.copy()
    for _ in range(12):
        m = open2(m)
        mk = Mask(m)
        bad = [(x, y) for y, x in zip(*np.nonzero(m)) if patch_name(mk.nb(x, y)) is None]
        if not bad:
            break
        for x, y in bad:
            m[y, x] = False
    return m


class Dresser:
    def __init__(self, grids, base_layers, paths, markers, seed=0xE3B):
        self.g = grids
        self.base = {l.name: l for l in base_layers}
        self.paths = paths
        self.markers = markers
        self.seed = seed

    def _grid(self):
        return np.full((self.g.h, self.g.w), None, object)

    def plain(self, L):
        """Interior grass cells of level L whose 8 neighbours are also plain grass of the same level."""
        g = self.g
        gr = self.base["L%d/ground" % L].cells
        p = np.vectorize(lambda v: v in PLAIN)(gr) & (g.height == L) & (g.mat_by_level[L] == GRASS)
        out = p.copy()
        h, w = p.shape
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                sh = np.zeros_like(p)
                sh[max(0, -dy):h - max(0, dy), max(0, -dx):w - max(0, dx)] = \
                    p[max(0, dy):h - max(0, -dy), max(0, dx):w - max(0, -dx)]
                out &= sh
        # nothing directly under a higher cliff face or its shadow
        for (x, y) in np.argwhere(g.height > L)[:, ::-1]:
            out[y: y + 5, x] = False
        return out

    def grass_patches(self, L, plain):
        g = self.g
        n1 = value_noise(g.w, g.h, 11, self.seed + 1)
        n2 = value_noise(g.w, g.h, 8, self.seed + 2)
        ashd = self._dist_to(g.mat_by_level[0] == ASH)
        n1 = 0.8 * n1 + 0.2 * value_noise(g.w, g.h, 4, self.seed + 5)
        if True:
            raw = (n1 > 0.6) & (L == 0)
            raw = ~self._grow(~self._grow(raw, 1), 1)      # closing: rounder blobs, no slits
            bright = settle(plain & raw)
        oraw = (n2 > 0.7) | ((ashd <= 4) & (n2 > 0.4))
        oraw = ~self._grow(~self._grow(oraw, 1), 1)
        olive = settle(plain & ~bright & oraw & (L == 0))
        olive &= ~self._grow(bright, 1)
        olive = settle(olive)
        out = self._grid()
        for m, tag in ((bright, "g2"), (olive, "g3")):
            mk = Mask(m)
            for y, x in zip(*np.nonzero(m)):
                out[y, x] = "%s_%s" % (tag, patch_name(mk.nb(x, y)))
        return out, bright | olive

    def _grow(self, m, r):
        h, w = m.shape
        out = m.copy()
        for dy in range(-r, r + 1):
            for dx in range(-r, r + 1):
                sh = np.zeros_like(m)
                sh[max(0, dy):h - max(0, -dy), max(0, dx):w - max(0, -dx)] = \
                    m[max(0, -dy):h - max(0, dy), max(0, -dx):w - max(0, dx)]
                out |= sh
        return out

    def _dist_to(self, m, cap=12):
        d = np.full(m.shape, cap, int)
        cur = m.copy()
        for r in range(cap):
            d[cur & (d == cap)] = r
            cur = self._grow(cur, 1)
        return d

    def decor(self, L, plain, patches, avoid):
        """Small Kenmi decor on free grass: flower drifts, sprouts, tufts, a few bushes and stones."""
        g = self.g
        out = self._grid()
        drift = value_noise(g.w, g.h, 6, self.seed + 7)
        gr = self.base["L%d/ground" % L].cells
        cell = np.vectorize(lambda v: v in PLAIN)(gr) & (g.height == L) & (g.mat_by_level[L] == GRASS)
        near_path = self._grow(self.paths[L], 1)
        for (x, y) in np.argwhere(g.height > L)[:, ::-1]:
            cell[y: y + 4, x] = False
        free = cell & ~near_path & ~avoid
        flowers = ["d_fl_a", "d_fl_b", "d_fl_c", "d_fl_d", "d_fl_e", "d_fl_f"]
        sprouts = ["d_sp_a", "d_sp_b", "d_sp_c"]
        tufts = ["d_tuft_a", "d_tuft_b", "d_tuft_c", "d_tuft_d"]
        bushes = ["d_bush_a", "d_bush_b", "d_clover_a", "d_clover_b", "d_clover_c"]
        stones = ["d_rock_a", "d_rock_b"]
        taken = np.zeros_like(free)
        rng = np.random.default_rng(self.seed * 7 + L)
        R, K = rng.random(free.shape), rng.random(free.shape)
        for y, x in zip(*np.nonzero(free)):
            if self.paths[L][y, x]:
                continue
            if self._grow_at(taken, x, y):
                continue
            r, k = R[y, x], K[y, x]
            dr = drift[y, x]
            t = None
            if dr > 0.55 and r < 0.30:
                t = flowers[int(k * len(flowers))] if k < 0.7 else sprouts[int((k - .7) / .3 * 3) % 3]
            elif r < 0.07:
                t = tufts[int(k * len(tufts))]
            elif r < 0.095:
                t = bushes[int(k * len(bushes))]
            elif r < 0.108:
                t = stones[int(k * 2)]
            elif r < 0.115 and dr < 0.4:
                t = "d_mush_a" if k < .5 else "d_mush_b"
            if t:
                out[y, x] = t
                taken[y, x] = True
        return out

    @staticmethod
    def _grow_at(m, x, y):
        h, w = m.shape
        return m[max(0, y - 1):y + 2, max(0, x - 1):x + 2].any()

    def ash(self, L, avoid):
        """Crack patches (cracked-ash and lava-crack sets), volcano pebbles/plants, low-ash dim."""
        g = self.g
        mat = g.mat_by_level[L]
        ashc = self.base["L%d/ash" % L].cells
        mid = np.vectorize(lambda v: isinstance(v, str) and (v.startswith("ash_") and v[4:].isdigit() or v in ("ash_cob_a", "ash_lip")))(ashc)
        mid &= (g.height == L) & (mat == ASH) & ~self.paths[L]
        core = mid.copy()
        h, w = core.shape
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                sh = np.zeros_like(core)
                sh[max(0, -dy):h - max(0, dy), max(0, -dx):w - max(0, dx)] = \
                    mid[max(0, dy):h - max(0, -dy), max(0, dx):w - max(0, -dx)]
                core &= sh
        for (x, y) in np.argwhere(g.height > L)[:, ::-1]:
            core[y: y + 5, x] = False
        cracks = self._grid()
        rng = np.random.default_rng(self.seed + 11 + L)
        used = np.zeros_like(core)
        tag = "lc" if L == 0 else "kc"
        ys, xs = np.nonzero(core)
        order = rng.permutation(len(xs))
        want = max(1, len(xs) // (22 if L == 0 else 30))
        placed = 0
        for i in order:
            if placed >= want:
                break
            x0, y0 = xs[i], ys[i]
            bw, bh = int(rng.integers(2, 5)), int(rng.integers(2, 4))
            if y0 + bh > h or x0 + bw > w:
                continue
            if not core[y0:y0 + bh, x0:x0 + bw].all() or used[max(0, y0 - 2):y0 + bh + 2, max(0, x0 - 2):x0 + bw + 2].any():
                continue
            t = tag if rng.random() < 0.6 else "cc"
            for yy in range(y0, y0 + bh):
                for xx in range(x0, x0 + bw):
                    v = "n" if yy == y0 else "s" if yy == y0 + bh - 1 else ""
                    hz = "w" if xx == x0 else "e" if xx == x0 + bw - 1 else ""
                    cracks[yy, xx] = "%s_%s" % (t, (v + hz) or "mid")
            used[y0:y0 + bh, x0:x0 + bw] = True
            placed += 1
        deco = self._grid()
        free = mid & ~used & ~avoid
        rng2 = np.random.default_rng(self.seed * 13 + L)
        R2, K2 = rng2.random(free.shape), rng2.random(free.shape)
        for y, x in zip(*np.nonzero(free)):
            if self._grow_at(deco != None, x, y):
                continue
            r, k = R2[y, x], K2[y, x]
            if r < 0.05:
                deco[y, x] = "vr_%d" % int(k * 4) if k < 0.8 else "vr_%d" % (4 + int((k - .8) * 20) % 4)
            elif r < 0.075:
                deco[y, x] = "vp_%d" % int(k * 6)
        fx = self._grid()
        return cracks, deco, fx

    def seam(self, L, avoid):
        """Rocks and pebbles on the grass side of the grass-to-ash seam, broken rhythm."""
        g = self.g
        mat = g.mat_by_level[L]
        out = self._grid()
        gr = self.base["L%d/ground" % L].cells
        rng3 = np.random.default_rng(self.seed * 17 + L)
        R3, K3 = rng3.random((g.h, g.w)), rng3.random((g.h, g.w))
        for y in range(g.h):
            for x in range(g.w):
                if g.height[y, x] != L or mat[y, x] != GRASS or avoid[y, x] or gr[y, x] not in PLAIN:
                    continue
                nb_ash = any(0 <= x + dx < g.w and 0 <= y + dy < g.h and g.height[y + dy, x + dx] == L
                             and mat[y + dy, x + dx] == ASH for dx, dy in DIRS.values())
                if not nb_ash:
                    continue
                r, k = R3[y, x], K3[y, x]
                if r < 0.75:
                    out[y, x] = ("d_rock_a", "d_rock_b", "vr_0", "vr_1", "vr_2", "vr_3", "d_tuft_c")[int(k * 7)]
        return out

    def foot_shadows(self, L):
        """Cast shadow on the ground under raised-ash basalt faces (foot row and one more, fading)."""
        g = self.g
        out = self._grid()
        cliff = self.base["L%d/cliff" % L].cells
        for y in range(g.h):
            for x in range(g.w):
                v = cliff[y, x]
                if isinstance(v, str) and (v.startswith("bas_") and v.endswith("2")) and y + 1 < g.h:
                    if g.height[y + 1, x] >= 0 and g.height[y + 1, x] < L:
                        out[y + 1, x] = "fx_foot"
                        if y + 2 < g.h and g.height[y + 2, x] >= 0 and g.height[y + 2, x] < L:
                            out[y + 2, x] = "fx_foot_soft"
        return out
