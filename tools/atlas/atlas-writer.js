// One job: write atlas PNGs and a manifest the game already knows how to read.
import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";

function blit(src, dst, dx, dy) {
  for (let y = 0; y < src.h; y++) {
    for (let x = 0; x < src.w; x++) {
      const si = (y * src.w + x) * 4;
      const di = ((dy + y) * dst.width + (dx + x)) * 4;
      dst.data[di] = src.data[si];
      dst.data[di + 1] = src.data[si + 1];
      dst.data[di + 2] = src.data[si + 2];
      dst.data[di + 3] = src.data[si + 3];
    }
  }
}

function samePixels(png, source) {
  if (!source || png.width !== source.width || png.height !== source.height) return false;
  return png.data.equals(source.data);
}

export class AtlasWriter {
  constructor(outDir, urlPrefix) {
    if (!outDir) throw new Error("atlas output directory is missing");
    this.outDir = outDir;
    this.urlPrefix = String(urlPrefix || "assets/atlas").replace(/\/$/, "");
  }

  write(pages, sources) {
    if (!pages || !pages.length) throw new Error("no atlas pages to write");
    fs.mkdirSync(this.outDir, { recursive: true });
    const byKey = new Map();
    const written = new Set();
    const sheets = sources || [];
    for (let p = 0; p < pages.length; p++) {
      const page = pages[p];
      const png = new PNG({ width: page.width, height: page.height });
      const fileName = "field-" + page.index + ".png";
      const atlas = this.urlPrefix + "/" + fileName;
      for (let i = 0; i < page.placements.length; i++) {
        const place = page.placements[i];
        const frame = place.frame;
        const cut = frame.cut;
        blit(cut, png, place.x, place.y);
        let entry = byKey.get(frame.key);
        if (!entry) {
          entry = {
            key: frame.key,
            atlas,
            code: frame.code,
            anchor: frame.anchor,
            frames: []
          };
          byKey.set(frame.key, entry);
        } else if (entry.atlas !== atlas) {
          throw new Error(frame.key + " was split across atlases");
        }
        entry.frames.push({
          name: frame.name,
          x: place.x + cut.extrude,
          y: place.y + cut.extrude,
          w: cut.innerW,
          h: cut.innerH,
          ox: cut.ox || 0,
          oy: cut.oy || 0,
          order: frame.order
        });
      }
      for (let s = 0; s < sheets.length; s++) {
        if (samePixels(png, sheets[s])) throw new Error("refusing to write a raw pack sheet");
      }
      const file = path.join(this.outDir, fileName);
      fs.writeFileSync(file, PNG.sync.write(png));
      written.add(fileName);
    }
    const entries = [];
    for (const entry of byKey.values()) {
      entry.frames.sort((a, b) => a.order - b.order);
      const frames = entry.frames.map((frame) => ({
        name: frame.name,
        x: frame.x,
        y: frame.y,
        w: frame.w,
        h: frame.h,
        ox: frame.ox,
        oy: frame.oy
      }));
      const row = { key: entry.key, atlas: entry.atlas, code: entry.code, frames };
      if (entry.anchor) row.anchor = entry.anchor;
      entries.push(row);
    }
    const manifest = { entries };
    fs.writeFileSync(path.join(this.outDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
    written.add("manifest.json");
    for (const name of fs.readdirSync(this.outDir)) {
      if (written.has(name)) continue;
      if (name.endsWith(".png") || name === "manifest.json") fs.unlinkSync(path.join(this.outDir, name));
    }
    return manifest;
  }
}
