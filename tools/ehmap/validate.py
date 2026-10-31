"""Validator: checks the authored map against the live game layout and Kenmi's tiling limits."""
import math
import numpy as np

T = 16
# Live v0.4.25 Emberhold walk shapes (tile units), copied from js/content/maps/v2layout.js.
LIVE_ELL = {"grove": (38, 16, 66, 58), "meadow": (62, 28, 106, 68), "hill": (84, 4, 118, 38),
            "scar": (102, 38, 134, 70), "cinder": (127, 2, 151, 28), "ledge": (140.2, 52, 149.2, 61),
            "hookledge": (123.5, 32, 131.5, 39), "hollow": (2, 34, 20, 52), "wake": (44, 56, 62, 74),
            "perch": (70, 89, 104, 104)}
LIVE_RECT = {"west": (19, 41, 42, 45), "lip": (116, 16, 124, 20), "dock": (78, 66, 96, 83),
             "rope": (85, 82, 89, 92), "cottage": (60, 10, 86, 28), "wake-path": (58, 56, 74, 68)}


def live_walkable(x, y):
    for x0, y0, x1, y1 in LIVE_ELL.values():
        cx, cy, rx, ry = (x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2, (y1 - y0) / 2
        if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1:
            return True
    return any(x0 <= x <= x1 and y0 <= y <= y1 for x0, y0, x1, y1 in LIVE_RECT.values())


def seg_dist(px, py, a, b):
    (x0, y0), (x1, y1) = a, b
    dx, dy = x1 - x0, y1 - y0
    l2 = dx * dx + dy * dy or 1
    u = max(0, min(1, ((px - x0) * dx + (py - y0) * dy) / l2))
    return math.hypot(px - (x0 + dx * u), py - (y0 + dy * u))


def poly_dist(p, poly):
    return min(seg_dist(p[0], p[1], a, b) for a, b in zip(poly, poly[1:]))


def path_deviation(path):
    worst = 0.0
    pts = path.route
    for a, b in zip(pts, pts[1:]):
        n = max(1, int(math.hypot(b[0] - a[0], b[1] - a[1])))
        for i in range(n + 1):
            q = (a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n)
            worst = max(worst, poly_dist(q, path.original))
    return worst


def nearest_open(blocked, x, y, r=4):
    best = None
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1):
            xx, yy = x + dx, y + dy
            if 0 <= yy < blocked.shape[0] and 0 <= xx < blocked.shape[1] and not blocked[yy, xx]:
                d = math.hypot(dx, dy)
                if best is None or d < best[0]:
                    best = (d, xx, yy)
    return best


def report(spec, grids, blocked, issues):
    out = {"markers": [], "paths": [], "issues": {}, "walk_lost": 0, "walk_gained": 0}
    for kind, name, tx, ty in spec.markers:
        if kind == "prop":
            continue
        x, y = int(math.floor(tx)), int(math.floor(ty))
        ok = not blocked[y, x]
        rec = {"kind": kind, "name": name, "at": [tx, ty], "level": int(grids.height[y, x]), "open": ok}
        if not ok:
            n = nearest_open(blocked, x, y)
            rec["nearest_open"] = None if n is None else [n[1], n[2], round(n[0], 2)]
        out["markers"].append(rec)
    for kind, name, tx, ty in spec.markers:
        if kind == "prop":
            x, y = int(tx), int(ty)
            out["markers"].append({"kind": "prop", "name": name, "at": [tx, ty],
                                   "level": int(grids.height[y, x]), "open": not blocked[y, x]})
    for p in spec.paths:
        out["paths"].append({"id": p.id, "max_dev_tiles": round(path_deviation(p), 2)})
    lost = gained = 0
    for y in range(grids.h):
        for x in range(grids.w):
            lw = live_walkable(x + 0.5, y + 0.5)
            nw = not blocked[y, x]
            lost += lw and not nw
            gained += nw and not lw
    out["walk_lost"], out["walk_gained"] = int(lost), int(gained)
    for kind, x, y, note in issues.items:
        out["issues"].setdefault(kind, []).append([x, y, note])
    return out
