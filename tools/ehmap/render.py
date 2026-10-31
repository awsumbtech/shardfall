"""TmjRenderer: composes a .tmj with the real Kenmi pixels. Reads only the map file."""
import json, os
from PIL import Image

SKY_TOP = (196, 200, 222)
SKY_BOTTOM = (226, 222, 232)


class TmjRenderer:
    def __init__(self, tmj_path):
        with open(tmj_path) as f:
            self.doc = json.load(f)
        self.base = os.path.dirname(os.path.abspath(tmj_path))
        self.size = self.doc["tilewidth"]
        self._sheets = []
        for ts in self.doc["tilesets"]:
            p = ts["image"] if os.path.isabs(ts["image"]) else os.path.join(self.base, ts["image"])
            self._sheets.append((ts["firstgid"], ts["columns"], Image.open(p).convert("RGBA"), ts["name"]))
        self._sheets.sort(key=lambda s: s[0])
        self._cache = {}

    def tile(self, gid):
        if gid not in self._cache:
            for first, cols, im, name in reversed(self._sheets):
                if gid >= first:
                    i = gid - first
                    s = self.size
                    self._cache[gid] = im.crop(((i % cols) * s, (i // cols) * s, (i % cols) * s + s, (i // cols) * s + s))
                    break
        return self._cache[gid]

    def draw_layers(self):
        def walk(layers):
            for l in layers:
                if l["type"] == "group" and l.get("visible", True):
                    yield from walk(l["layers"])
                elif l["type"] == "tilelayer" and l.get("visible", True):
                    yield l
        return list(walk(self.doc["layers"]))

    def sky(self, w, h):
        im = Image.new("RGBA", (w, h))
        px = im.load()
        for y in range(h):
            t = y / max(1, h - 1)
            c = tuple(int(a + (b - a) * t) for a, b in zip(SKY_TOP, SKY_BOTTOM)) + (255,)
            for x in range(w):
                px[x, y] = c
        return im

    def render(self, box=None):
        """box = (x0, y0, x1, y1) in tiles; returns a 1x RGBA image."""
        W, H = self.doc["width"], self.doc["height"]
        x0, y0, x1, y1 = box or (0, 0, W, H)
        s = self.size
        im = self.sky((x1 - x0) * s, (y1 - y0) * s)
        for layer in self.draw_layers():
            data = layer["data"]
            for y in range(max(0, y0), min(H, y1)):
                row = y * W
                for x in range(max(0, x0), min(W, x1)):
                    gid = data[row + x]
                    if gid:
                        im.alpha_composite(self.tile(gid), ((x - x0) * s, (y - y0) * s))
        return im
