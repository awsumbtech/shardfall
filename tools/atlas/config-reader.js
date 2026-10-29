// One job: read the declarative frame list. It does not open images.
import fs from "node:fs";

function whole(value, fallback) {
  if (value == null) return fallback;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0) throw new Error("atlas config has a bad number");
  return n;
}

function anchorOf(raw) {
  if (!raw) return null;
  if (Array.isArray(raw) && raw.length >= 2) return [raw[0] | 0, raw[1] | 0];
  if (typeof raw.x === "number" && typeof raw.y === "number") return [raw.x | 0, raw.y | 0];
  throw new Error("atlas config has a bad anchor");
}

export class ConfigReader {
  constructor(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new Error("atlas config is empty");
    }
    this.padding = whole(data.padding, 1);
    this.extrude = whole(data.extrude, 1);
    this.maxSize = whole(data.maxSize, 1024);
    if (this.maxSize < 1) throw new Error("atlas config maxSize is too small");
    this.shuffle = data.shuffle !== false;
    this.seed = whole(data.seed, 1);
    this.atlas = typeof data.atlas === "string" && data.atlas ? data.atlas : "field";
    if (!/^[a-z0-9-]+$/.test(this.atlas)) throw new Error("atlas name must be a short slug");
    this.entries = Array.isArray(data.entries) ? data.entries : null;
    if (!this.entries || !this.entries.length) throw new Error("atlas config has no entries");
  }

  static fromFile(file) {
    let raw;
    try {
      raw = JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (err) {
      throw new Error("could not read atlas config " + file);
    }
    return new ConfigReader(raw);
  }

  frames() {
    const out = [];
    const seen = new Set();
    for (let i = 0; i < this.entries.length; i++) {
      const entry = this.entries[i];
      if (!entry || typeof entry.key !== "string" || !entry.key) {
        throw new Error("atlas entry " + i + " has no key");
      }
      if (seen.has(entry.key)) throw new Error("duplicate atlas key " + entry.key);
      seen.add(entry.key);
      const file = typeof entry.path === "string" ? entry.path : "";
      if (!file || file.includes("\0")) throw new Error(entry.key + " has no pack path");
      const code = typeof entry.code === "string" && entry.code ? entry.code : entry.key;
      const anchor = anchorOf(entry.anchor);
      const before = out.length;
      if (Array.isArray(entry.rects)) this._rects(out, entry, file, code, anchor);
      if (entry.grid) this._grid(out, entry, file, code, anchor);
      if (out.length === before) throw new Error(entry.key + " declares no frames");
    }
    return out;
  }

  _push(out, entry, file, code, anchor, name, x, y, w, h) {
    if (!name) throw new Error(entry.key + " has a frame with no name");
    if (!(w > 0) || !(h > 0)) throw new Error(entry.key + " frame " + name + " has no size");
    out.push({
      key: entry.key,
      file,
      code,
      anchor,
      name: String(name),
      x: x | 0,
      y: y | 0,
      w: w | 0,
      h: h | 0,
      order: out.length
    });
  }

  _rects(out, entry, file, code, anchor) {
    for (let i = 0; i < entry.rects.length; i++) {
      const rect = entry.rects[i];
      if (!rect) throw new Error(entry.key + " has an empty rect");
      this._push(out, entry, file, code, anchor, rect.name, rect.x || 0, rect.y || 0, rect.w, rect.h);
    }
  }

  _grid(out, entry, file, code, anchor) {
    const grid = entry.grid;
    const cell = whole(grid.cell, 0);
    const gw = whole(grid.w, cell);
    const gh = whole(grid.h, cell);
    if (!(gw > 0) || !(gh > 0)) throw new Error(entry.key + " grid has no cell size");
    const originX = whole(grid.x, 0);
    const originY = whole(grid.y, 0);
    const clips = Array.isArray(grid.clips) ? grid.clips : null;
    if (!clips || !clips.length) throw new Error(entry.key + " grid has no clips");
    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i];
      const count = whole(clip && clip.count, 0);
      const row = whole(clip && clip.row, -1);
      if (!clip || typeof clip.name !== "string" || !clip.name || count < 1 || row < 0) {
        throw new Error(entry.key + " has a bad grid clip");
      }
      for (let col = 0; col < count; col++) {
        this._push(
          out, entry, file, code, anchor,
          clip.name + "." + col,
          originX + col * gw,
          originY + row * gh,
          gw, gh
        );
      }
    }
  }
}
