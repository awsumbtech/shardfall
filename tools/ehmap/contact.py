"""Contact sheet: every named tile, zoomed, labelled, on a checker so alpha shows."""
from PIL import Image, ImageDraw


def checker(w, h, a=(205, 205, 215), b=(235, 235, 245), step=4):
    im = Image.new("RGBA", (w, h), a + (255,))
    d = ImageDraw.Draw(im)
    for y in range(0, h, step):
        for x in range(0, w, step):
            if (x // step + y // step) % 2:
                d.rectangle([x, y, x + step - 1, y + step - 1], fill=b + (255,))
    return im


def render(tileset, out, zoom=4, cols=10):
    names = tileset.names
    s = tileset.size * zoom
    cw, ch = s + 16, s + 30
    rows = (len(names) + cols - 1) // cols
    sheet = Image.new("RGBA", (cols * cw, rows * ch), (255, 255, 255, 255))
    d = ImageDraw.Draw(sheet)
    for i, n in enumerate(names):
        x, y = (i % cols) * cw + 8, (i // cols) * ch + 4
        cell = checker(s, s)
        cell.alpha_composite(tileset.image(n).resize((s, s), Image.NEAREST))
        sheet.paste(cell, (x, y))
        t = tileset.ref(n)
        d.text((x, y + s + 2), n, fill=(0, 0, 0))
        d.text((x, y + s + 13), "%s %d,%d" % (t.sheet, t.c, t.r), fill=(90, 90, 90))
    sheet.save(out)
