"""CLI: spec + tileset -> emberhold.tmj, report.json, tileset-check.png. python3 -m ehmap.build"""
import json, os, sys
from . import spec as spec_mod, raster, collision, validate
from .tileset import Tileset
from .autotile import Autotiler, Layer
from .tmj import TmjWriter
from .dress import Dresser
from .props import PropPlanner
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))


def dress(g, base, paths, sp, prop_cells):
    d = Dresser(g, base, paths, sp.markers)
    byname = {l.name: l for l in base}
    mk = np.zeros((g.h, g.w), bool)
    for _, _, mx, my in sp.markers:
        mk[max(0, int(my) - 1): int(my) + 2, max(0, int(mx) - 1): int(mx) + 2] = True
    out = []
    for L in range(g.max_level + 1):
        plain = d.plain(L)
        patch, _ = d.grass_patches(L, plain)
        avoid = mk | prop_cells
        deco = d.decor(L, plain, None, avoid)
        cracks, adeco, fx = d.ash(L, avoid)
        seam = d.seam(L, avoid | (deco != None))
        foot = d.foot_shadows(L)
        Lr = lambda n, c: Layer("L%d/%s" % (L, n), L, c)
        out += [byname["L%d/ground" % L], Lr("patch", patch), byname["L%d/ash" % L], Lr("ashpatch", cracks),
                Lr("fx", fx), byname["L%d/path" % L], Lr("decor", deco), Lr("ashdecor", adeco), Lr("seam", seam),
                byname["L%d/shadow" % L], Lr("footfx", foot), byname["L%d/cliff" % L]]
    out += [l for l in base if l.level == 9]
    return tuple(_dim_low_ash(l, g) for l in out)


def _stamp_ashpatch(layers, grids):
    """Approved ash cracks, with nothing regenerated on top.

    A crack that sits on an islet the spec moved is translated with that islet.
    Every other cell stays on its approved coordinate.
    """
    by = {layer.name: layer for layer in layers}
    path = os.path.join(HERE, "ashpatch-approved.json")
    with open(path) as f:
        saved = json.load(f)
    for name in ("L0/ashpatch", "L1/ashpatch"):
        layer = by.get(name)
        if layer is not None:
            layer.cells[:, :] = None
    off = []
    for item in saved["cells"]:
        x, y = item["x"], item["y"]
        for move in saved.get("moves", []):
            if move["x0"] <= x < move["x1"] and move["y0"] <= y < move["y1"]:
                x += move["dx"]
                y += move["dy"]
                break
        layer = by.get(item["layer"])
        if layer is None or not (0 <= x < grids.w and 0 <= y < grids.h):
            continue
        if grids.height[y, x] < 0:
            off.append((item["layer"], x, y, item["tile"]))
            continue
        layer.cells[y, x] = item["tile"]
    if off:
        print("ashpatch off land:", off)


def _stamp_hook(layers, grids):
    """Approved hook block, translated as one unit.

    The autotile hash is tied to coordinates, so a move would otherwise regrow
    the tufts and the centre patch. Overlap with another islet is reported
    and left in place.
    """
    by = {layer.name: layer for layer in layers}
    path = os.path.join(HERE, "hook-approved.json")
    with open(path) as f:
        saved = json.load(f)
    dx, dy = int(saved["dx"]), int(saved["dy"])
    overlaps = []
    for item in saved["cells"]:
        x, y = item["x"] + dx, item["y"] + dy
        layer = by.get(item["layer"])
        if layer is None or not (0 <= x < grids.w and 0 <= y < grids.h):
            continue
        rid = int(grids.region[y, x])
        hook = rid >= 0 and grids.region_ids[rid] == "hookledge"
        foreign = grids.height[y, x] >= 0 and not hook
        if foreign:
            overlaps.append((item["layer"], x, y, item["tile"],
                             grids.region_ids[rid] if rid >= 0 else "raised"))
            continue
        layer.cells[y, x] = None if item["tile"] == "." else item["tile"]
    if overlaps:
        print("hook overlaps:", overlaps)
    return overlaps


def _edge_insets(g):
    """Shore insets live in the map, so a later edit moves them with the tiles.

    Cinderstep's west shore is 6px: enough for the feet to stop on the drawn
    edge. The hook's two top corners stay at 8px. The Lamp Hill lip that
    faces the hook uses 3px so that approach stays a normal dash.
    """
    h, w = g.h, g.w
    ids = g.region_ids
    out = []
    cin = ids.index("cinder") if "cinder" in ids else -1
    west = []
    for y in range(h):
        for x in range(w):
            if cin < 0 or int(g.region[y, x]) != cin or g.height[y, x] < 0:
                continue
            if x > 0 and g.height[y, x - 1] >= 0:
                continue
            west.append((x, y))
    west.sort()
    i = 0
    while i < len(west):
        x, y0 = west[i]
        y1 = y0
        while i + 1 < len(west) and west[i + 1] == (x, y1 + 1):
            i += 1
            y1 = west[i][1]
        out.append({"name": "cinder-west", "x": x, "y": y0, "w": 1, "h": y1 - y0 + 1,
                    "inset": 6, "side": "w", "sky": True})
        i += 1
    hook = ids.index("hookledge") if "hookledge" in ids else -1
    cells = [(x, y) for y in range(h) for x in range(w)
             if hook >= 0 and int(g.region[y, x]) == hook and g.height[y, x] >= 0]
    if cells:
        top = min(y for x, y in cells)
        row = [x for x, y in cells if y == top]
        out.append({"name": "hook-nw", "x": min(row), "y": top, "w": 1, "h": 1,
                    "inset": 8, "side": "nw", "sky": True})
        out.append({"name": "hook-ne", "x": max(row), "y": top, "w": 1, "h": 1,
                    "inset": 8, "side": "ne", "sky": True})
        # The new south lip of Lamp Hill, only where it faces this ledge.
        face = []
        for x in range(min(row) - 6, max(row) + 1):
            for y in range(max(0, top - 4), top):
                if not (0 <= x < w and 0 <= y < h):
                    continue
                if g.height[y, x] <= 0 or y + 1 >= h or g.height[y + 1, x] >= g.height[y, x]:
                    continue
                face.append((x, y))
        face.sort()
        j = 0
        while j < len(face):
            x, y0 = face[j]
            y1 = y0
            while j + 1 < len(face) and face[j + 1] == (x, y1 + 1):
                j += 1
                y1 = face[j][1]
            out.append({"name": "hill-approach", "x": x, "y": y0, "w": 1, "h": y1 - y0 + 1,
                        "inset": 3, "side": "s", "sky": False})
            j += 1
    return out


def _dim_low_ash(layer, g):
    """Low (level-0) ash uses Volcano_Tiles darkened by tileset.DIM so the raised platform reads."""
    if layer.level != 0 or layer.name.split("/")[-1] not in ("ash", "ashpatch"):
        return layer
    c = layer.cells.copy()
    for y, x in zip(*np.nonzero(c != None)):
        v = c[y, x]
        if (v.startswith("ash") or v[:3] in ("lc_", "cc_", "kc_")) and g.mat_by_level[0][y, x] == 1:
            c[y, x] = v + "~d"
    return Layer(layer.name, layer.level, c)


def main():
    ts = Tileset(os.path.join(HERE, "tileset.json"))
    sp = spec_mod.load(os.path.join(HERE, "emberhold.spec.json"))
    g = raster.build(sp)
    at = Autotiler(g)
    base = at.build()
    repo = os.path.abspath(os.path.join(HERE, "..", ".."))
    preview_path = os.path.join(repo, "js", "content", "maps", "props-preview.json")
    pp = PropPlanner(g, base, sp, os.path.join(HERE, "live", "live-frame.json"))
    if os.path.exists(preview_path):
        with open(preview_path) as f:
            props = json.load(f)["props"]
    else:
        props = pp.plan(at.paths)
    layers = dress(g, base, at.paths, sp, pp.footprint(props))
    _stamp_hook(layers, g)
    _stamp_ashpatch(layers, g)
    blocked = collision.build(g)
    insets = _edge_insets(g)
    path_mask = np.zeros((g.h, g.w), bool)
    for level_paths in at.paths:
        path_mask |= level_paths
    zones = [(l.id, l.rects) for l in sp.land]
    zones += [(z.id, z.rects) for z in sp.zones]
    zones += [("terrace:" + t.id, t.rects) for t in sp.terraces]
    out = os.path.join(repo, "js", "content", "maps", "emberhold.tmj")
    TmjWriter(ts, out).write(out, g, layers, blocked, zones, sp.markers, path_mask, insets,
                              [{"name": "island", "type": "string", "value": "emberhold"},
                               {"name": "private", "type": "string", "value": "Kenmi Cute Fantasy, do not redistribute"}])
    rep = validate.report(sp, g, blocked, at.issues)
    with open(os.path.join(HERE, "report.json"), "w") as f:
        json.dump(rep, f, indent=1)
    print("issues:", {k: len(v) for k, v in rep["issues"].items()})
    for k, v in rep["issues"].items():
        print(" ", k, v[:12])
    print("blocked markers:", [(m["name"], m["at"], m.get("nearest_open")) for m in rep["markers"] if not m["open"]])
    print("path dev:", [(p["id"], p["max_dev_tiles"]) for p in rep["paths"]])
    print("walk lost/gained cells:", rep["walk_lost"], rep["walk_gained"])


if __name__ == "__main__":
    main()
