"""TmjWriter: layers + data grids -> Tiled-compatible JSON (.tmj). One tileset per Kenmi sheet.

Sheet headers (paths, pixel sizes, first gids) are copied from the map already in the
game. Rebuilding does not open Kenmi images and does not need Pillow.
"""
import json, os
import numpy as np
from .tileset import DIM

META_TILES = ("blocked", "h0", "h1", "h2", "h3", "stair")


class TmjWriter:
    def __init__(self, tileset, proto_path):
        self.ts = tileset
        with open(proto_path) as f:
            proto = json.load(f)
        self.tilesets = proto["tilesets"]
        self.firstgid = {}
        self.meta_gid = 0
        for header in self.tilesets:
            name = header["name"]
            if name == "meta":
                self.meta_gid = header["firstgid"]
            elif name.startswith("kenmi-"):
                self.firstgid[name[len("kenmi-"):]] = (header["firstgid"], header["columns"])
            if name == "kenmi-volcanoDim":
                props = header.setdefault("properties", [])
                if not any(p.get("name") == "dim" for p in props):
                    props.append({"name": "dim", "type": "float", "value": DIM})
        missing = [sid for sid in tileset.sheets if sid not in self.firstgid]
        if missing or not self.meta_gid:
            raise RuntimeError("tile map is missing sheet headers: " + ", ".join(missing))

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

    def write(self, path, grids, layers, collision, zones, markers, path_mask, insets, props):
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
        pdata = [mg if path_mask[y, x] else 0 for y in range(h) for x in range(w)]
        out_layers.append(self._tilelayer(lid, "paths", w, h, pdata, visible=False,
                                          props=[{"name": "legend", "type": "string",
                                                  "value": "nonzero = path cell; decor must not sit here"}])); lid += 1
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
        iobjs = []
        for box in insets or []:
            props_i = [{"name": "inset", "type": "int", "value": int(box["inset"])},
                       {"name": "side", "type": "string", "value": box["side"]},
                       {"name": "sky", "type": "bool", "value": bool(box.get("sky"))}]
            iobjs.append({"id": oid, "name": box["name"], "type": "inset",
                          "x": box["x"] * 16, "y": box["y"] * 16,
                          "width": box["w"] * 16, "height": box["h"] * 16,
                          "rotation": 0, "visible": True, "properties": props_i})
            oid += 1
        out_layers.append({"id": lid, "name": "edge-insets", "type": "objectgroup", "draworder": "topdown",
                           "opacity": 1, "visible": False, "x": 0, "y": 0, "objects": iobjs,
                           "properties": [{"name": "legend", "type": "string",
                                           "value": "walk inset in pixels; side is w/e/n/s/nw/ne; sky limits it to open sky"}]})
        lid += 1
        doc = {"type": "map", "version": "1.10", "tiledversion": "1.10.2", "orientation": "orthogonal",
               "renderorder": "right-down", "width": w, "height": h, "tilewidth": 16, "tileheight": 16,
               "infinite": False, "nextlayerid": lid, "nextobjectid": oid, "layers": out_layers,
               "tilesets": self.tilesets, "properties": props}
        with open(path, "w") as f:
            json.dump(doc, f, separators=(",", ":"))
        return doc
