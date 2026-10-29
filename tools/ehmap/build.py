"""CLI: spec + tileset -> emberhold.tmj, report.json, tileset-check.png. python3 -m ehmap.build"""
import json, os, sys
from . import spec as spec_mod, raster, collision, validate, contact
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
    contact.render(ts, os.path.join(HERE, "tileset-check.png"))
    sp = spec_mod.load(os.path.join(HERE, "emberhold.spec.json"))
    g = raster.build(sp)
    at = Autotiler(g)
    base = at.build()
    pp = PropPlanner(g, base, sp, os.path.join(HERE, "live", "live-frame.json"))
    props = pp.plan(at.paths)
    with open(os.path.join(HERE, "props-preview.json"), "w") as f:
        json.dump({"note": "preview-only Kenmi sprites; not part of the tmj", "props": props}, f, indent=1)
    layers = dress(g, base, at.paths, sp, pp.footprint(props))
    blocked = collision.build(g)
    zones = [(l.id, l.rects) for l in sp.land] + [("terrace:" + t.id, t.rects) for t in sp.terraces]
    TmjWriter(ts, HERE).write(os.path.join(HERE, "emberhold.tmj"), g, layers, blocked, zones, sp.markers,
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
