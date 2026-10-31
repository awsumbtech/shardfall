// One job: cut a rectangle out of a PNG and extrude its edge pixels.
// Each cut is trimmed to the opaque pixels, plus `pad` pixels of margin.
import fs from "node:fs";
import { PNG } from "pngjs";

export class FrameExtractor {
  constructor(extrude, pad) {
    this.extrude = extrude > 0 ? extrude : 0;
    this.pad = pad > 0 ? pad : 0;
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

  // Opaque box inside a cell, in cell-local pixels. Null when the cell is empty.
  opaqueBounds(png, sx, sy, sw, sh) {
    let minX = sw;
    let minY = sh;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < sh; y++) {
      const row = (sy + y) * png.width + sx;
      for (let x = 0; x < sw; x++) {
        if (png.data[(row + x) * 4 + 3] === 0) continue;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
    if (maxX < 0) return null;
    return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
  }

  // Foot line of the given cells: center of the bottom opaque row, median across cells.
  footLine(file, rects) {
    const png = this.sheet(file);
    const bottoms = [];
    const centers = [];
    for (let i = 0; i < rects.length; i++) {
      const rect = rects[i];
      const bounds = this.opaqueBounds(png, rect.x | 0, rect.y | 0, rect.w | 0, rect.h | 0);
      if (!bounds) continue;
      const localBottom = bounds.y + bounds.h - 1;
      bottoms.push(localBottom);
      const y = (rect.y | 0) + localBottom;
      let sum = 0;
      let n = 0;
      for (let x = 0; x < bounds.w; x++) {
        const sx = (rect.x | 0) + bounds.x + x;
        if (png.data[(y * png.width + sx) * 4 + 3] === 0) continue;
        sum += bounds.x + x;
        n += 1;
      }
      if (n) centers.push(sum / n);
    }
    if (!bottoms.length) throw new Error("no opaque pixels to measure a foot line");
    bottoms.sort((a, b) => a - b);
    centers.sort((a, b) => a - b);
    const mid = (list) => list[(list.length / 2) | 0];
    return [Math.round(mid(centers)), mid(bottoms)];
  }

  // Returns the extruded bitmap of the trimmed cell.
  // ox/oy is the trim's top-left inside the declared cell, so a cell-space anchor stays put.
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
    const bounds = this.opaqueBounds(png, sx0, sy0, sw, sh);
    let ox;
    let oy;
    let cw;
    let ch;
    let empty = false;
    if (!bounds) {
      empty = true;
      const ax = rect.anchor ? Math.max(0, Math.min(sw - 1, rect.anchor[0] | 0)) : 0;
      const ay = rect.anchor ? Math.max(0, Math.min(sh - 1, rect.anchor[1] | 0)) : 0;
      ox = ax;
      oy = ay;
      cw = 1;
      ch = 1;
    } else {
      const pad = this.pad;
      ox = Math.max(0, bounds.x - pad);
      oy = Math.max(0, bounds.y - pad);
      const x1 = Math.min(sw, bounds.x + bounds.w + pad);
      const y1 = Math.min(sh, bounds.y + bounds.h + pad);
      cw = x1 - ox;
      ch = y1 - oy;
    }
    const w = cw + e * 2;
    const h = ch + e * 2;
    const data = Buffer.alloc(w * h * 4);
    const originX = sx0 + ox;
    const originY = sy0 + oy;
    for (let y = -e; y < ch + e; y++) {
      const sy = originY + Math.max(0, Math.min(ch - 1, y));
      for (let x = -e; x < cw + e; x++) {
        const sx = originX + Math.max(0, Math.min(cw - 1, x));
        const si = (sy * png.width + sx) * 4;
        const di = ((y + e) * w + (x + e)) * 4;
        png.data.copy(data, di, si, si + 4);
      }
    }
    const dim = rect && rect.dim;
    if (typeof dim === "number" && dim !== 1) {
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.max(0, Math.min(255, Math.round(data[i] * dim)));
        data[i + 1] = Math.max(0, Math.min(255, Math.round(data[i + 1] * dim)));
        data[i + 2] = Math.max(0, Math.min(255, Math.round(data[i + 2] * dim)));
      }
    }
    return {
      w, h, data, extrude: e, innerW: cw, innerH: ch, ox, oy, empty, source: png
    };
  }
}
