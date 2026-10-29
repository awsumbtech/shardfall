// One job: place frames on shared atlas pages. A key stays on one page.
// Shelf packing, with a gap of `padding` pixels. Shuffle is a fixed order.

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(list, rng) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = list[i];
    list[i] = list[j];
    list[j] = tmp;
  }
  return list;
}

export class Packer {
  constructor(opts) {
    opts = opts || {};
    this.padding = opts.padding > 0 ? opts.padding : 0;
    this.maxSize = opts.maxSize > 0 ? opts.maxSize : 1024;
    this.shuffle = !!opts.shuffle;
    this.seed = opts.seed >>> 0;
  }

  // frames: { key, w, h, ... }. Returns pages of { index, width, height, placements }.
  pack(frames) {
    if (!frames || !frames.length) throw new Error("nothing to pack");
    const byKey = new Map();
    const keyOrder = [];
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      if (!byKey.has(frame.key)) {
        byKey.set(frame.key, []);
        keyOrder.push(frame.key);
      }
      byKey.get(frame.key).push(frame);
    }
    const rng = mulberry32(this.seed || 1);
    const keys = keyOrder.slice();
    if (this.shuffle) shuffle(keys, rng);
    const groups = [];
    let current = [];
    for (let i = 0; i < keys.length; i++) {
      const group = byKey.get(keys[i]);
      if (!this.layout(group)) throw new Error(keys[i] + " does not fit on one atlas");
      if (current.length && !this.layout(current.concat(group))) {
        groups.push(current);
        current = group.slice();
      } else {
        current = current.concat(group);
      }
    }
    if (current.length) groups.push(current);
    const pages = [];
    for (let i = 0; i < groups.length; i++) {
      const stable = groups[i];
      const ordered = stable.slice();
      if (this.shuffle) shuffle(ordered, rng);
      const laid = this.layout(ordered) || this.layout(stable);
      if (!laid) throw new Error("atlas page " + i + " did not pack");
      pages.push({
        index: i,
        width: laid.width,
        height: laid.height,
        placements: laid.placements
      });
    }
    return pages;
  }

  // Null when the shelf runs past maxSize. The page is cropped to what was used.
  layout(frames) {
    const pad = this.padding;
    const max = this.maxSize;
    const placements = [];
    let x = pad;
    let y = pad;
    let rowH = 0;
    let usedW = pad;
    let usedH = pad;
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      const w = frame.w;
      const h = frame.h;
      if (!(w > 0) || !(h > 0)) return null;
      if (w + pad * 2 > max || h + pad * 2 > max) return null;
      if (x > pad && x + w + pad > max) {
        x = pad;
        y += rowH + pad;
        rowH = 0;
      }
      if (y + h + pad > max) return null;
      placements.push({ frame, x, y });
      if (x + w + pad > usedW) usedW = x + w + pad;
      if (y + h + pad > usedH) usedH = y + h + pad;
      x += w + pad;
      if (h > rowH) rowH = h;
    }
    if (!placements.length) return null;
    return { width: usedW, height: usedH, placements };
  }
}
