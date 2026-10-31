"""Shots: full map at 1x, the meadow phone view (1x and DPR3), and a 3x zoom crop."""
import os, sys
from PIL import Image
from .render import TmjRenderer
from . import props as props_mod
import json

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PHONE = (915, 412)


def phone_box(cx, cy):
    """Tile box (fractional) for a 915x412 CSS view at in-game scale 1 world px = 1 CSS px."""
    w, h = PHONE[0] / 16, PHONE[1] / 16
    return cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2


def load_props():
    p = os.path.join(HERE, "props-preview.json")
    return json.load(open(p))["props"] if os.path.exists(p) else []


def crop_px(r, cx, cy, wpx, hpx, props=None):
    x0, y0 = cx * 16 - wpx / 2, cy * 16 - hpx / 2
    tx0, ty0 = int(x0 // 16), int(y0 // 16)
    tx1, ty1 = int((x0 + wpx) // 16) + 1, int((y0 + hpx) // 16) + 1
    im = r.render((tx0, ty0, tx1, ty1))
    if props:
        props_mod.draw(im, props, (tx0 * 16, ty0 * 16))
    ox, oy = int(x0 - tx0 * 16), int(y0 - ty0 * 16)
    return im.crop((ox, oy, ox + wpx, oy + hpx))


def main(cx=91.0, cy=18.61, zx=100.0, zy=23.0):
    r = TmjRenderer(os.path.join(HERE, "emberhold.tmj"))
    pr = load_props()
    props_mod.draw(r.render(), pr, (0, 0)).convert("RGB").save(os.path.join(HERE, "full-map.png"))
    view = crop_px(r, cx, cy, *PHONE, props=pr).convert("RGB")
    view.save(os.path.join(HERE, "meadow-preview-1x.png"))
    view.resize((PHONE[0] * 3, PHONE[1] * 3), Image.NEAREST).save(os.path.join(HERE, "meadow-preview.png"))
    z = crop_px(r, zx, zy, 320, 200).convert("RGB")
    z.resize((960, 600), Image.NEAREST).save(os.path.join(HERE, "meadow-zoom.png"))


if __name__ == "__main__":
    main(*[float(a) for a in sys.argv[1:]])
