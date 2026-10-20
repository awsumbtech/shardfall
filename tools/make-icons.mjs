// Rasterize the Wayfarer and the shard from the in-game pixel art into
// the home-screen PNGs. No canvas dependency: the art is palette grids.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import zlib from "node:zlib";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

const context = { console };
context.window = context;
context.globalThis = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, "js/art/core.js"), "utf8"), context, { filename: "js/art/core.js" });
vm.runInContext(fs.readFileSync(path.join(root, "js/art/actors.js"), "utf8"), context, { filename: "js/art/actors.js" });

const Art = context.Art;
const hero = Art._makers.wayfarer("walk", "down", 0);
if (!hero || !hero.w) throw new Error("wayfarer sprite did not bake");

const RGB = Art.RGB;
const C = Art.C;
const THEME = [0x14, 0x0c, 0x28, 255];

function rgba(index, alpha) {
  const col = RGB[index];
  if (!col) return [0, 0, 0, 0];
  return [col[0], col[1], col[2], alpha == null ? 255 : alpha];
}

function encodePNG(width, height, data) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const row = y * (width * 4 + 1);
    raw[row] = 0;
    data.copy(raw, row + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function fill(data, size, color) {
  for (let i = 0; i < size * size; i++) {
    const o = i * 4;
    data[o] = color[0];
    data[o + 1] = color[1];
    data[o + 2] = color[2];
    data[o + 3] = color[3];
  }
}

function plot(data, size, x, y, color) {
  if (x < 0 || y < 0 || x >= size || y >= size) return;
  const o = (y * size + x) * 4;
  const a = color[3] / 255;
  if (a >= 1) {
    data[o] = color[0];
    data[o + 1] = color[1];
    data[o + 2] = color[2];
    data[o + 3] = 255;
    return;
  }
  const inv = 1 - a;
  data[o] = Math.round(color[0] * a + data[o] * inv);
  data[o + 1] = Math.round(color[1] * a + data[o + 1] * inv);
  data[o + 2] = Math.round(color[2] * a + data[o + 2] * inv);
  data[o + 3] = 255;
}

function block(data, size, x, y, step, color) {
  for (let yy = 0; yy < step; yy++) {
    for (let xx = 0; xx < step; xx++) plot(data, size, x + xx, y + yy, color);
  }
}

function diamond(data, size, cx, cy, radius, step) {
  const ink = rgba(C.voidD);
  const edge = rgba(C.shard);
  const mid = rgba(C.shardH);
  const core = rgba(C.gold);
  for (let y = cy - radius; y < cy + radius; y += step) {
    for (let x = cx - radius; x < cx + radius; x += step) {
      const nx = (x + step / 2 - cx) / radius;
      const ny = (y + step / 2 - cy) / radius;
      const e = Math.abs(nx) + Math.abs(ny);
      if (e > 1.08) continue;
      let color = ink;
      if (e <= 1) {
        if (e < 0.34) color = core;
        else if (e < 0.62) color = mid;
        else color = edge;
      }
      block(data, size, x, y, step, color);
    }
  }
}

function blit(data, size, sprite, dx, dy, scale) {
  for (let y = 0; y < sprite.h; y++) {
    for (let x = 0; x < sprite.w; x++) {
      const p = sprite.d[y * sprite.w + x];
      if (!p) continue;
      const color = rgba(p);
      for (let yy = 0; yy < scale; yy++) {
        for (let xx = 0; xx < scale; xx++) plot(data, size, dx + x * scale + xx, dy + y * scale + yy, color);
      }
    }
  }
}

function fitScale(size, maxH, maxW) {
  let scale = Math.floor(maxH / hero.h);
  while (scale > 1 && (hero.h * scale > maxH || hero.w * scale > maxW)) scale--;
  return Math.max(1, scale);
}

function compose(size, maskable) {
  const data = Buffer.alloc(size * size * 4);
  fill(data, size, THEME);
  // Maskable icons are cropped to a circle (safe zone ~80% of the diameter).
  const scale = maskable
    ? fitScale(size, size * 0.66, size * 0.48)
    : fitScale(size, size * 0.86, size * 0.72);
  const sw = hero.w * scale;
  const sh = hero.h * scale;
  const dx = Math.round((size - sw) / 2);
  const dy = Math.round((size - sh) / 2);
  const radius = Math.round(size * (maskable ? 0.26 : 0.32));
  diamond(data, size, Math.round(size / 2), dy + Math.round(sh * 0.36), radius, scale);
  blit(data, size, hero, dx, dy, scale);
  return data;
}

const outDir = path.join(root, "icons");
fs.mkdirSync(outDir, { recursive: true });

const files = [
  ["icon-192.png", 192, false],
  ["icon-512.png", 512, false],
  ["icon-maskable-512.png", 512, true],
  ["apple-touch-icon.png", 180, false]
];

for (const [name, size, maskable] of files) {
  const png = encodePNG(size, size, compose(size, maskable));
  fs.writeFileSync(path.join(outDir, name), png);
  console.log(name, size + "x" + size, png.length + " bytes");
}
