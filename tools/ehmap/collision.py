"""Collision: sky, cliff faces and rim/lip cells block; stair cells and plateau tops are open."""
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
                    rows = 3 if mat[y, x] == ASH else 2
                    for r in range(1, rows + 1):
                        if y + r < g.h and (x, y + r) not in g.stairs:
                            out.add((x, y + r))
    return frozenset(out)


def build(grids):
    g = grids
    blocked = g.height < 0
    blocked = blocked.copy()
    for (x, y) in faces(g):
        blocked[y, x] = True
    for y in range(g.h):
        for x in range(g.w):
            L = g.height[y, x]
            if L < 0 or (x, y) in g.stairs:
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)):
                xx, yy = x + dx, y + dy
                if not (0 <= xx < g.w and 0 <= yy < g.h) or g.height[yy, xx] < L:
                    if (xx, yy) not in g.stairs:
                        blocked[y, x] = True
                    break
    for x, y0, y1 in g.bridges:
        blocked[y0:y1 + 1, x - 1:x + 2] = False
    blocked.setflags(write=False)
    return blocked
