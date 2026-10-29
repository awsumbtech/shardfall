"""Preview-only props (not in the .tmj): Kenmi House_1, a lantern post on Lamp Hill and Kenmi trees
where live has trees. Positions are validated against the new grids and nudged if they'd sit on a
path, rim, cliff face, stair or marker. Output: props-preview.json (sprite, frame box, anchor px)."""
import json, os
import numpy as np
from .raster import GRASS

_assets = os.environ.get("ASSETS_DIR", "")
KEN = os.path.join(_assets, "vendor", "kenmi", "") if _assets else os.path.join("vendor", "kenmi", "")
SPRITES = {
    # name: (sheet, crop box, anchor x, anchor y inside the crop)
    "house": ("Cute_Fantasy/Buildings/Buildings/Houses/Wood/House_1_Wood_Base_Red.png", (0, 0, 96, 128), 40, 112),
    "lantern": ("Cute_Fantasy/Outdoor decoration/Lanter_Posts.png", (32, 144, 48, 192), 8, 45),
    "big_oak": ("Cute_Fantasy/Trees/Big_Oak_Tree.png", (64, 0, 128, 80), 32, 58),
    "big_spruce": ("Cute_Fantasy/Trees/Big_Spruce_tree.png", (64, 0, 128, 80), 32, 58),
    "med_oak": ("Cute_Fantasy/Trees/Medium_Oak_Tree.png", (32, 0, 64, 48), 16, 29),
    "med_spruce": ("Cute_Fantasy/Trees/Medium_Spruce_Tree.png", (32, 0, 64, 48), 16, 29),
    "med_birch": ("Cute_Fantasy/Trees/Medium_Birch_Tree.png", (32, 0, 64, 48), 16, 29),
    "fence_top": ("Cute_Fantasy/Outdoor decoration/Fences.png", (0, 0, 16, 16), 8, 16),
    "fence_mid": ("Cute_Fantasy/Outdoor decoration/Fences.png", (0, 16, 16, 32), 8, 16),
    "fence_bot": ("Cute_Fantasy/Outdoor decoration/Fences.png", (0, 32, 16, 48), 8, 16),
}
# extra seeded tree scatter (box in tiles, count) where live dresses the island with trees
EXTRA = (((84, 4, 124, 38), 9, "med"), ((62, 28, 106, 68), 5, "med"), ((63, 11, 82, 24), 3, "med"),
         ((102, 38, 134, 70), 2, "med"), ((0, 34, 22, 52), 3, "med"), ((68, 88, 106, 104), 3, "med"))
# trunk footprint (tiles, around the anchor cell) and canopy extent upward for clearance checks
FOOT = {"big_oak": 1, "big_spruce": 1, "med_oak": 0, "med_spruce": 0, "med_birch": 0}


def _h(x, y, s):
    v = (x * 73856093) ^ (y * 19349663) ^ (s * 83492791)
    return (v & 0xFFFF) / 65535.0


class PropPlanner:
    def __init__(self, grids, layers, spec, live_json=None):
        self.g = grids
        self.ground = {l.level: l.cells for l in layers if l.name.endswith("/ground")}
        self.spec = spec
        self.live = json.load(open(live_json))["props"] if live_json and os.path.exists(live_json) else []
        self.paths = None

    def ok_cell(self, x, y, r, paths):
        g = self.g
        if not (2 <= x < g.w - 2 and 6 <= y < g.h - 2):
            return False
        L = g.height[y, x]
        if L < 0 or g.mat_by_level[L][y, x] != GRASS:
            return False
        for yy in range(y - r, y + 2):
            for xx in range(x - 1 - r, x + 2 + r):
                if g.height[yy, xx] != L:
                    return False
                if paths[L][yy, xx] or (xx, yy) in g.stairs:
                    return False
                gv = self.ground[L][yy, xx]
                if gv is None or gv.startswith("lip") or gv.startswith("pe_") or gv == "path":
                    return False
        # not in a higher terrace's face/shadow band, nor just north of one (it would hide behind it)
        for yy in range(max(0, y - 4), min(g.h, y + 6)):
            for xx in range(x - 1, x + 2):
                if g.height[yy, xx] > L:
                    return False
        for _, _, mx, my in self.spec.markers:
            if abs(mx - x) < 2.5 and abs(my - y) < 2.5:
                return False
        return True

    def plan(self, paths):
        g = self.g
        out = [{"sprite": "house", "x": 74.5 * 16, "y": 20 * 16, "why": "Maren's cottage (live: cottage prop at 73,16)"}]
        lx, ly = [m[2:] for m in self.spec.markers if m[1] == "lamp"][0]
        out.append({"sprite": "lantern", "x": (lx + 1.6) * 16, "y": (ly + 0.6) * 16, "why": "Lamp Hill lantern beside the lamp checkpoint"})
        cands = [(p["x"] / 16, p["y"] / 16, "live") for p in self.live if p["k"] == "tree"]
        cands += [(m[2], m[3], m[1]) for m in self.spec.markers if m[0] == "prop" and m[1].startswith("tree")]
        trees = []
        for fx, fy, src in cands:
            x0, y0 = int(fx), int(fy)
            grove = 38 <= x0 <= 66 and 16 <= y0 <= 58
            hs = _h(x0, y0, 5)
            kind = ("big_oak" if hs < 0.6 else "big_spruce") if grove else \
                   ("med_oak" if hs < 0.55 else "med_spruce")
            best = None
            for rad in range(0, 4):
                for dy in range(-rad, rad + 1):
                    for dx in range(-rad, rad + 1):
                        if max(abs(dx), abs(dy)) != rad:
                            continue
                        x, y = x0 + dx, y0 + dy
                        if not self.ok_cell(x, y, FOOT[kind], paths):
                            continue
                        if any(abs(t[0] - x) < 3 and abs(t[1] - y) < 3 for t in trees):
                            continue
                        best = (x, y)
                        break
                    if best:
                        break
                if best:
                    break
            if not best and kind.startswith("big"):
                kind = "med_oak"
                for rad in range(0, 3):
                    for dy in range(-rad, rad + 1):
                        for dx in range(-rad, rad + 1):
                            x, y = x0 + dx, y0 + dy
                            if not best and self.ok_cell(x, y, 0, paths) and \
                                    not any(abs(t[0] - x) < 3 and abs(t[1] - y) < 3 for t in trees):
                                best = (x, y)
            if best:
                trees.append((best[0], best[1], kind, src, (x0, y0)))
        rng = np.random.default_rng(0x7EE5)
        for box, n, size in EXTRA:
            placed = 0
            for _ in range(400):
                if placed >= n:
                    break
                x = int(rng.integers(box[0], box[2])); y = int(rng.integers(box[1], box[3]))
                kind = "med_oak" if rng.random() < 0.5 else "med_spruce"
                if not self.ok_cell(x, y, 0, paths):
                    continue
                if any(abs(t[0] - x) < 4 and abs(t[1] - y) < 4 for t in trees):
                    continue
                if 71 <= x <= 78 and 11 <= y <= 21:
                    continue
                trees.append((x, y, kind, "scatter", (x, y)))
                placed += 1
        for x, y, kind, src, orig in trees:
            out.append({"sprite": kind, "x": (x + 0.5) * 16, "y": (y + 0.8) * 16,
                        "why": "%s tree at %s -> %s" % (src, orig, (x, y))})
        self.trees = trees
        return out

    def footprint(self, props):
        """Cells decor must avoid (trunks, house base, lantern)."""
        g = self.g
        m = np.zeros((g.h, g.w), bool)
        for p in props:
            x, y = int(p["x"] // 16), int(p["y"] // 16)
            if p["sprite"] == "house":
                m[13:21, 71:79] = True
            elif p["sprite"] == "lantern":
                m[y - 1:y + 1, x - 1:x + 2] = True
            elif p["sprite"].startswith("fence"):
                m[y - 1, x] = True
            else:
                r = 2 if p["sprite"].startswith("big") else 1
                m[y - r - 1:y + 1, x - r:x + r + 1] = True
        return m


def draw(im, props, origin_px):
    """Composite props (y-sorted) onto an RGBA image whose top-left is world px origin_px."""
    from PIL import Image
    cache = {}
    ox, oy = origin_px
    for p in sorted(props, key=lambda p: p["y"]):
        sheet, box, ax, ay = SPRITES[p["sprite"]]
        key = p["sprite"]
        if key not in cache:
            cache[key] = Image.open(KEN + sheet).convert("RGBA").crop(box)
        spr = cache[key]
        x, y = int(round(p["x"] - ax - ox)), int(round(p["y"] - ay - oy))
        if x > im.width or y > im.height or x + spr.width < 0 or y + spr.height < 0:
            continue
        layer = Image.new("RGBA", im.size, (0, 0, 0, 0))
        layer.paste(spr, (x, y))
        im.alpha_composite(layer)
    return im
