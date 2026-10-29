"""Shape passes on the raster: rounded outer island corners, one-tile path jogs, stair landings.
All deterministic (seeded by ids / coordinates), all pure functions over numpy grids."""
import zlib
import numpy as np

VOID = -1
# NW-oriented 2-step cut: (dx, dy) cells removed from a convex corner; mirrored for the other three.
CUT = tuple((dx, dy) for dy in range(2) for dx in range(4)) + tuple((dx, dy) for dy in range(2, 4) for dx in range(2))
CORNERS = {"nw": (1, 1), "ne": (-1, 1), "sw": (1, -1), "se": (-1, -1)}   # (sx, sy) pointing into the land


def _seed(s):
    return zlib.crc32(s.encode())


def _arm(land, x, y, step, out):
    """Length of the straight edge from (x, y) along `step` while the `out` side stays open."""
    h, w = land.shape
    n = 0
    while 0 <= x < w and 0 <= y < h and land[y, x]:
        ox, oy = x + out[0], y + out[1]
        if 0 <= ox < w and 0 <= oy < h and land[oy, ox]:
            break
        n += 1
        x, y = x + step[0], y + step[1]
    return n


MINI = ((0, 0), (1, 0), (2, 0), (0, 1))


def round_corners(height, keep, min_arm=7, mini_arm=4):
    """Cut a 2-step stair into every big convex corner of the island outline: 4 then 2 cells,
    2 rows each, where both arms are >= min_arm; a 3-then-1 single-row nick where both are >= mini_arm.
    Cut cells must share one height, stay clear of `keep` (paths, stairs, markers, bridges) and of any
    cliff face (the 3 rows below a higher cell). Raised cells are only cut on north corners, so no
    terrace lip, face or stair changes. Returns (new_height, cuts)."""
    hgt = height.copy()
    land = hgt >= 0
    h, w = land.shape
    cuts = []
    inside = lambda cx, cy: 0 <= cx < w and 0 <= cy < h
    for y in range(h):
        for x in range(w):
            if not land[y, x]:
                continue
            for name, (sx, sy) in CORNERS.items():
                ox, oy = x - sx, y - sy
                if (inside(ox, y) and land[y, ox]) or (inside(x, oy) and land[oy, x]):
                    continue
                arm = min(_arm(land, x, y, (sx, 0), (0, -sy)), _arm(land, x, y, (0, sy), (-sx, 0)))
                shape_ = CUT if arm >= min_arm else MINI if arm >= mini_arm else None
                if not shape_:
                    continue
                cells = [(x + dx * sx, y + dy * sy) for dx, dy in shape_]
                if any(not inside(cx, cy) for cx, cy in cells):
                    continue
                h0 = hgt[y, x]
                if any(hgt[cy, cx] != h0 for cx, cy in cells) or (h0 > 0 and sy < 0):
                    continue
                bad = False
                for cx, cy in cells:
                    for ax in (-1, 0, 1):
                        for ay in (-1, 0, 1):
                            qx, qy = cx + ax, cy + ay
                            if inside(qx, qy) and keep[qy, qx]:
                                bad = True
                            if inside(qx, qy) and 0 <= hgt[qy, qx] < h0:
                                bad = True
                    for r in range(1, 4):
                        if inside(cx, cy - r) and hgt[cy - r, cx] > h0:
                            bad = True
                if bad:
                    continue
                cuts.append((name, x, y, len(shape_)))
    for name, x, y, n in cuts:
        sx, sy = CORNERS[name]
        for dx, dy in (CUT if n == len(CUT) else MINI):
            hgt[y + dy * sy, x + dx * sx] = VOID
    return hgt, cuts


def jog_route(pid, route, min_len=13, span=(5, 7)):
    """Insert one deterministic +-1 sideways bump into the middle of every long straight run."""
    rng = np.random.default_rng(_seed(pid))
    out = [tuple(route[0])]
    for (x0, y0), (x1, y1) in zip(route, route[1:]):
        L = abs(x1 - x0) + abs(y1 - y0)
        if L >= min_len:
            n = int(rng.integers(span[0], span[1] + 1))
            a = (L - n) // 2 + int(rng.integers(-1, 2))
            off = 1 if rng.random() < 0.5 else -1
            ux, uy = (np.sign(x1 - x0), np.sign(y1 - y0))
            px, py = (uy * off, ux * off)          # perpendicular
            p1 = (x0 + ux * a, y0 + uy * a)
            p2 = (p1[0] + px, p1[1] + py)
            p3 = (p2[0] + ux * n, p2[1] + uy * n)
            p4 = (p3[0] - px, p3[1] - py)
            out += [tuple(map(int, p)) for p in (p1, p2, p3, p4)]
        out.append((int(x1), int(y1)))
    return tuple(out)
