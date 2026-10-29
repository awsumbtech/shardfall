// One job: cut a rectangle out of a PNG and extrude its edge pixels.
import fs from "node:fs";
import { PNG } from "pngjs";

export class FrameExtractor {
  constructor(extrude) {
    this.extrude = extrude > 0 ? extrude : 0;
    this.sheets = new Map();
  }

  sheet(file) {
    let png = this.sheets.get(file);
    if (png) return png;
    let buf;
    try {
      buf = fs.readFileSync(file);
    } catch (err) {
      throw new Error("could not read " + file);
    }
    try {
      png = PNG.sync.read(buf);
    } catch (err) {
      throw new Error("not a png: " + file);
    }
    this.sheets.set(file, png);
    return png;
  }

  // Returns the extruded bitmap. innerW/innerH are the declared frame.
  cut(file, rect) {
    const png = this.sheet(file);
    const e = this.extrude;
    const sw = rect.w | 0;
    const sh = rect.h | 0;
    const sx0 = rect.x | 0;
    const sy0 = rect.y | 0;
    if (sw < 1 || sh < 1) throw new Error(rect.name + " has no size");
    if (sx0 < 0 || sy0 < 0 || sx0 + sw > png.width || sy0 + sh > png.height) {
      throw new Error(rect.name + " is outside " + file + " (" + png.width + "x" + png.height + ")");
    }
    const w = sw + e * 2;
    const h = sh + e * 2;
    const data = Buffer.alloc(w * h * 4);
    for (let y = -e; y < sh + e; y++) {
      const sy = sy0 + Math.max(0, Math.min(sh - 1, y));
      for (let x = -e; x < sw + e; x++) {
        const sx = sx0 + Math.max(0, Math.min(sw - 1, x));
        const si = (sy * png.width + sx) * 4;
        const di = ((y + e) * w + (x + e)) * 4;
        png.data.copy(data, di, si, si + 4);
      }
    }
    return { w, h, data, extrude: e, innerW: sw, innerH: sh, source: png };
  }
}
