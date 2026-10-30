"""Collision: sky and cliff faces block. A cell drawn as ground stays open.

The old rim blocked every land cell with a lower neighbour, including cells
drawn as ordinary grass or ash. Those were invisible walls and they widened
every dash gap by a tile. Stairs cut through a face stay open. A bridge opens
only the column that is actually drawn.
"""
import numpy as np
from .raster import ASH


def skirt_rows(g, x, y, ash, level=0):
    """Cliff rows under a south lip.

    A level-0 face over open sky is three rows (face, face, foot), including
    where a higher terrace still casts that skirt. The hook ledge shares one
    depth so every column of its face ends on the same row.
    """
    if level == 0:
        sky = all(y + r >= g.h or g.height[y + r, x] < 0 for r in (1, 2, 3))
    else:
        sky = False
    cap = 3 if ash or sky else 2
    # Stop when the next row is the same plateau or a higher one.
    # A raised lip still hangs its face over the lower ground.
    open_rows = 0
    for r in range(1, cap + 1):
        yy = y + r
        if yy >= g.h or g.height[yy, x] >= level:
            break
        open_rows += 1
    cap = open_rows
    if level == 0 and _is_hook(g, x, y):
        return _shared_free(g, x, y, cap)
    return cap


def _is_hook(g, x, y):
    if not (0 <= y < g.h and 0 <= x < g.w):
        return False
    rid = int(g.region[y, x])
    return rid >= 0 and g.region_ids[rid] == "hookledge"


def _shared_free(g, x, y, cap):
    """Shortest open run under a whole hook-ledge lip, so every column ends together."""
    x0 = x
    while x0 > 0 and _lip(g, x0 - 1, y) and _is_hook(g, x0 - 1, y):
        x0 -= 1
    x1 = x
    while x1 + 1 < g.w and _lip(g, x1 + 1, y) and _is_hook(g, x1 + 1, y):
        x1 += 1
    free = cap
    for xx in range(x0, x1 + 1):
        n = 0
        for r in range(1, cap + 1):
            yy = y + r
            if yy >= g.h or g.height[yy, xx] >= 0:
                break
            n += 1
        if n < free:
            free = n
    return free


def _lip(g, x, y):
    return g.height[y, x] >= 0 and (y + 1 >= g.h or g.height[y + 1, x] < 0)


def faces(grids):
    """Set of (x, y) covered by a cliff face of any level (stairs excluded)."""
    out = set()
    g = grids
    for L in range(g.max_level + 1):
        reg = g.height >= L
        mat = g.mat_by_level[L]
        for y in range(g.h - 1):
            for x in range(g.w):
                if reg[y, x] and not reg[y + 1, x]:
                    rows = skirt_rows(g, x, y, mat[y, x] == ASH, L)
                    for r in range(1, rows + 1):
                        yy = y + r
                        if yy >= g.h or reg[yy, x]:
                            break
                        if (x, yy) not in g.stairs:
                            out.add((x, yy))
    return frozenset(out)


def build(grids):
    g = grids
    blocked = (g.height < 0).copy()
    for (x, y) in faces(g):
        blocked[y, x] = True
    for (x, y) in g.stairs:
        if 0 <= y < g.h and 0 <= x < g.w:
            blocked[y, x] = False
    for x, y0, y1 in g.bridges:
        if 0 <= x < g.w:
            blocked[y0:y1 + 1, x] = False
    blocked.setflags(write=False)
    return blocked
