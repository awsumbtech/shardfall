"""TmjWriter: layers + data grids -> Tiled-compatible JSON (.tmj). One tileset per Kenmi sheet."""
import json, os
import numpy as np
from PIL import Image
from .tileset import DIM

META_TILES = ("blocked", "h0", "h1", "h2", "h3", "stair")
META_COLORS = ((220, 40, 40, 160), (60, 140, 60, 120), (120, 190, 80, 120),
               (190, 220, 90, 120), (240, 240, 120, 120), (80, 160, 240, 160))


def write_meta_png(path, size=16):
    im = Image.new("RGBA", (size * len(META_TILES), size), (0, 0, 0, 0))
    for i, c in enumerate(META_COLORS):
        im.paste(Image.new("RGBA", (size, size), c), (i * size, 0))
    im.save(path)


class TmjWriter:
    def __init__(self, tileset, out_dir):
        self.ts = tileset
        self.out_dir = out_dir
        self.firstgid = {}
        self.tilesets = []
        gid = 1
        for sid in tileset.sheets:
            im = tileset.sheet_image(sid)
            cols, rows = im.width // tileset.size, im.height // tileset.size
            self.firstgid[sid] = (gid, cols)
            props = [{"name": "private", "type": "bool", "value": sid not in ("fx",)}]
            if sid == "volcanoDim":
                props.append({"name": "dim", "type": "float", "value": DIM})
            self.tilesets.append({
                "firstgid": gid, "name": "kenmi-" + sid, "image": tileset.sheet_ref(sid),
                "imagewidth": im.width, "imageheight": im.height, "tilewidth": tileset.size,
                "tileheight": tileset.size, "columns": cols, "tilecount": cols * rows, "margin": 0, "spacing": 0,
                "properties": props})
            gid += cols * rows
        self.meta_gid = gid
        meta_png = os.path.join(out_dir, "meta-tiles.png")
        write_meta_png(meta_png, tileset.size)
        self.tilesets.append({
            "firstgid": gid, "name": "meta", "image": "meta-tiles.png", "imagewidth": tileset.size * len(META_TILES),
            "imageheight": tileset.size, "tilewidth": tileset.size, "tileheight": tileset.size,
            "columns": len(META_TILES), "tilecount": len(META_TILES), "margin": 0, "spacing": 0,
            "tiles": [{"id": i, "type": n} for i, n in enumerate(META_TILES)]})

    def gid(self, name):
        if name is None:
            return 0
        t = self.ts.ref(name)
        first, cols = self.firstgid[t.sheet]
        return first + t.r * cols + t.c

    def _tilelayer(self, lid, name, w, h, data, visible=True, props=None):
        d = {"id": lid, "name": name, "type": "tilelayer", "width": w, "height": h, "x": 0, "y": 0,
             "opacity": 1, "visible": visible, "data": [int(v) for v in data]}
        if props:
            d["properties"] = props
        return d

    def write(self, path, grids, layers, collision, zones, markers, props):
        w, h = grids.w, grids.h
        lid = 1
        groups = {}
        order = []
        for layer in layers:
            gname = "level-%d" % layer.level if layer.level < 9 else "overlay"
            data = [self.gid(layer.cells[y, x]) for y in range(h) for x in range(w)]
            if not any(data):
                continue
            if gname not in groups:
                groups[gname] = {"id": 0, "name": gname, "type": "group", "opacity": 1, "visible": True,
                                 "x": 0, "y": 0, "layers": []}
                order.append(gname)
            kind = layer.name.split("/")[-1]
            role = {"ground": "ground", "ash": "ground", "path": "decor-paths",
                    "shadow": "cliffs", "cliff": "cliffs", "bridges": "decor-paths",
                    "patch": "ground", "ashpatch": "ground", "fx": "ground", "decor": "decor-paths",
                    "ashdecor": "decor-paths", "seam": "decor-paths", "footfx": "cliffs"}[kind]
            groups[gname]["layers"].append(self._tilelayer(0, layer.name, w, h, data,
                                                           props=[{"name": "role", "type": "string", "value": role}]))
        out_layers = []
        for gname in order:
            g = groups[gname]
            g["id"] = lid; lid += 1
            for sub in g["layers"]:
                sub["id"] = lid; lid += 1
            out_layers.append(g)
        mg = self.meta_gid
        coll = [mg if collision[y, x] else 0 for y in range(h) for x in range(w)]
        out_layers.append(self._tilelayer(lid, "collision", w, h, coll, visible=False)); lid += 1
        hdata = []
        for y in range(h):
            for x in range(w):
                v = grids.height[y, x]
                hdata.append(0 if v < 0 else mg + 5 if (x, y) in grids.stairs else mg + 1 + int(v))
        out_layers.append(self._tilelayer(lid, "height", w, h, hdata, visible=False,
                                          props=[{"name": "legend", "type": "string",
                                                  "value": "meta tile h0..h3 = level, stair = stair cell, 0 = sky"}]))
        lid += 1
        oid = 1
        zobjs = []
        for zid, rects in zones:
            for x0, y0, x1, y1 in rects:
                zobjs.append({"id": oid, "name": zid, "type": "zone", "x": x0 * 16, "y": y0 * 16,
                              "width": (x1 - x0) * 16, "height": (y1 - y0) * 16, "rotation": 0, "visible": True})
                oid += 1
        out_layers.append({"id": lid, "name": "zones", "type": "objectgroup", "draworder": "topdown",
                           "opacity": 1, "visible": False, "x": 0, "y": 0, "objects": zobjs}); lid += 1
        mobjs = []
        for kind, name, tx, ty in markers:
            mobjs.append({"id": oid, "name": name, "type": kind, "x": tx * 16, "y": ty * 16, "point": True,
                          "width": 0, "height": 0, "rotation": 0, "visible": True})
            oid += 1
        out_layers.append({"id": lid, "name": "markers", "type": "objectgroup", "draworder": "topdown",
                           "opacity": 1, "visible": False, "x": 0, "y": 0, "objects": mobjs}); lid += 1
        doc = {"type": "map", "version": "1.10", "tiledversion": "1.10.2", "orientation": "orthogonal",
               "renderorder": "right-down", "width": w, "height": h, "tilewidth": 16, "tileheight": 16,
               "infinite": False, "nextlayerid": lid, "nextobjectid": oid, "layers": out_layers,
               "tilesets": self.tilesets, "properties": props}
        with open(path, "w") as f:
            json.dump(doc, f, separators=(",", ":"))
        return doc
