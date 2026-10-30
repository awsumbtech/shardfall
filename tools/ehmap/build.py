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


def _stamp_ashpatch(layers):
    """Scar and Cinderstep low-ash cracks, copied from the approved map.

    Regenerating the cracks shifts the whole field. The shardstep ledge keeps
    the cracks the generator just placed, because that islet was moved on purpose.
    """
    cells = {layer.name: layer for layer in layers}["L0/ashpatch"].cells
    h, w = cells.shape
    for y in range(h):
        for x in range(min(140, w)):
            cells[y, x] = None
    path = os.path.join(HERE, "ashpatch-approved.json")
    with open(path) as f:
        saved = json.load(f)
    for item in saved:
        cells[item["y"], item["x"]] = item["tile"]


def _stamp_hook(layers):
    """Approved hook tufts, shifted north by 2 tiles with the whole ledge.

    The autotile hash is tied to coordinates, so a rigid move would otherwise
    regrow the tufts. These cells are the approved block, translated by (0, -2).
    """
    by = {layer.name: layer for layer in layers}
    ground = by["L0/ground"].cells
    ground[29, 128] = "grass_tuft_a"
    ground[29, 129] = "grass_tuft_b"
    ground[31, 128] = "grass"
    ground[31, 129] = "grass"
    ground[33, 127] = "grass_tuft_c"
    ground[33, 128] = "grass_tuft_a"
    ground[33, 129] = "grass_tuft_b"
    by["L0/decor"].cells[30, 127] = "d_tuft_d"


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
    _stamp_hook(layers)
    _stamp_ashpatch(layers)
    blocked = collision.build(g)
    path_mask = np.zeros((g.h, g.w), bool)
    for level_paths in at.paths:
        path_mask |= level_paths
    zones = [(l.id, l.rects) for l in sp.land]
    zones += [(z.id, z.rects) for z in sp.zones]
    zones += [("terrace:" + t.id, t.rects) for t in sp.terraces]
    out = os.path.join(repo, "js", "content", "maps", "emberhold.tmj")
    TmjWriter(ts, out).write(out, g, layers, blocked, zones, sp.markers, path_mask,
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
