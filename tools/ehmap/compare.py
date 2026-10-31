"""before-after.png: live main (left) vs the new tilemap (right), same 915x412 world framing."""
import os, sys
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main(live=os.path.join(HERE, "live", "live-frame.png"), new=os.path.join(HERE, "meadow-preview.png"), scale=1.5):
    a, b = Image.open(live).convert("RGB"), Image.open(new).convert("RGB")
    w, h = int(915 * scale), int(412 * scale)
    a, b = a.resize((w, h), Image.LANCZOS), b.resize((w, h), Image.LANCZOS)
    pad, top = 12, 44
    out = Image.new("RGB", (w * 2 + pad * 3, h + top + pad), (24, 24, 30))
    out.paste(a, (pad, top)); out.paste(b, (w + pad * 2, top))
    d = ImageDraw.Draw(out)
    try:
        f = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 22)
    except OSError:
        f = ImageFont.load_default()
    d.text((pad, 10), "LIVE main (v0.4.25) - camera (1456, 298)", fill=(235, 235, 235), font=f)
    d.text((w + pad * 2, 10), "NEW Kenmi tilemap - same framing", fill=(235, 235, 235), font=f)
    out.save(os.path.join(HERE, "before-after.png"))


if __name__ == "__main__":
    main()
