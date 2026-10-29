"""Collision: sky and cliff faces block. A cell drawn as ground stays open.

The old rim blocked every land cell with a lower neighbour, including cells
drawn as ordinary grass or ash. Those were invisible walls and they widened
every dash gap by a tile. Stairs cut through a face stay open. A bridge opens
only the column that is actually drawn.
"""
import numpy as np
from .raster import ASH


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
                    rows = 3 if mat[y, x] == ASH or _sky_skirt(g, x, y) else 2
                    for r in range(1, rows + 1):
                        yy = y + r
                        if yy >= g.h or reg[yy, x]:
                            break
                        if (x, yy) not in g.stairs:
                            out.add((x, yy))
    return frozenset(out)


def _sky_skirt(g, x, y):
    """Level-0 land over open sky wears a 3-row face, matching the autotiler."""
    if g.height[y, x] != 0:
        return False
    return all(y + r >= g.h or g.height[y + r, x] < 0 for r in (1, 2, 3))


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
