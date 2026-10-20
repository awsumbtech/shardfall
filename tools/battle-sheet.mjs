// 4× contact sheet: party battle poses beside the matching field sprite.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import zlib from "node:zlib";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const context = { console };
context.window = context;
context.globalThis = context;
vm.createContext(context);
for (const file of ["js/art/core.js", "js/art/actors.js", "js/art/characters.js"]) {
  vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file });
}
const Art = context.Art;
const RGB = Art.RGB;
const ids = ["wayfarer", "kestrel", "tamsin"];
const cells = [
  { pose: "stand", frame: 0, label: "FIELD" },
  { pose: "idle", frame: 0, label: "IDLE 0" },
  { pose: "idle", frame: 1, label: "IDLE 1" },
  { pose: "attack", frame: 0, label: "ATTACK 0" },
  { pose: "attack", frame: 1, label: "ATTACK 1" },
  { pose: "cast", frame: 0, label: "CAST 0" },
  { pose: "cast", frame: 1, label: "CAST 1" },
  { pose: "hurt", frame: 0, label: "HURT KO 0" },
  { pose: "hurt", frame: 1, label: "HURT KO 1" },
  { pose: "victory", frame: 0, label: "VICTORY 0" },
  { pose: "victory", frame: 1, label: "VICTORY 1" }
];
const names = { wayfarer: "WAYFARER", kestrel: "KESTREL", tamsin: "TAMSIN" };

const baked = ids.map((id) => {
  const row = cells.map((cell) => {
    const spr = Art._makers[id](cell.pose, "right", cell.frame);
    if (!spr || !spr.w) throw new Error("missing " + id + " " + cell.label);
    return spr;
  });
  const foe = Art._makers.choirling("idle", "right", 0);
  if (!foe || foe.h !== 38) throw new Error("enemy battle art changed");
  const field = row[0];
  if (field.h > 38) throw new Error(id + " field sprite grew");
  console.log(id, "field", field.w + "x" + field.h, "battle", row[1].w + "x" + row[1].h);
  return { id, row };
});

const zoom = 4;
const pad = 10;
const labelH = 16;
let maxW = 0;
let maxH = 0;
baked.forEach((entry) => entry.row.forEach((spr) => {
  maxW = Math.max(maxW, spr.w);
  maxH = Math.max(maxH, spr.h);
}));
const cellW = maxW * zoom + pad;
const cellH = maxH * zoom + pad;
const sheetW = cells.length * cellW + 8;
const blockH = labelH + cellH;
const sheetH = 8 + baked.length * blockH + 8;
const data = Buffer.alloc(sheetW * sheetH * 4);

function plot(x, y, r, g, b, a) {
  if (x < 0 || y < 0 || x >= sheetW || y >= sheetH) return;
  const o = (y * sheetW + x) * 4;
  data[o] = r;
  data[o + 1] = g;
  data[o + 2] = b;
  data[o + 3] = a;
}
for (let y = 0; y < sheetH; y++) {
  for (let x = 0; x < sheetW; x++) {
    const check = ((x >> 3) + (y >> 3)) & 1;
    plot(x, y, check ? 0x3a : 0x2a, check ? 0x6a : 0x50, check ? 0x48 : 0x38, 255);
  }
}
const FONT = {
  A: ["111", "101", "111", "101", "101"], B: ["110", "101", "110", "101", "110"],
  C: ["111", "100", "100", "100", "111"], D: ["110", "101", "101", "101", "110"],
  E: ["111", "100", "110", "100", "111"], F: ["111", "100", "110", "100", "100"],
  G: ["111", "100", "101", "101", "111"], H: ["101", "101", "111", "101", "101"],
  I: ["111", "010", "010", "010", "111"], K: ["101", "110", "100", "110", "101"],
  L: ["100", "100", "100", "100", "111"], M: ["101", "111", "101", "101", "101"],
  N: ["110", "101", "101", "101", "101"], O: ["111", "101", "101", "101", "111"],
  R: ["110", "101", "110", "101", "101"], S: ["111", "100", "111", "001", "111"],
  T: ["111", "010", "010", "010", "010"], U: ["101", "101", "101", "101", "111"],
  V: ["101", "101", "101", "101", "010"], W: ["101", "101", "101", "111", "101"],
  Y: ["101", "101", "010", "010", "010"], " ": ["000", "000", "000", "000", "000"],
  "0": ["111", "101", "101", "101", "111"], "1": ["010", "110", "010", "010", "111"]
};
function text(x, y, str) {
  let cx = x;
  for (const glyph of str) {
    const rows = FONT[glyph] || FONT[" "];
    for (let gy = 0; gy < rows.length; gy++) {
      for (let gx = 0; gx < rows[gy].length; gx++) {
        if (rows[gy].charAt(gx) === "1") plot(cx + gx, y + gy, 255, 244, 220, 255);
      }
    }
    cx += 4;
  }
}
function blit(spr, dx, dy) {
  for (let y = 0; y < spr.h; y++) {
    for (let x = 0; x < spr.w; x++) {
      const col = RGB[spr.d[y * spr.w + x]];
      if (!col) continue;
      for (let sy = 0; sy < zoom; sy++) {
        for (let sx = 0; sx < zoom; sx++) {
          plot(dx + x * zoom + sx, dy + y * zoom + sy, col[0], col[1], col[2], 255);
        }
      }
    }
  }
}
baked.forEach((entry, i) => {
  const y0 = 8 + i * blockH;
  text(8, y0, names[entry.id]);
  entry.row.forEach((spr, c) => {
    const x = 8 + c * cellW;
    text(x, y0, cells[c].label);
    blit(spr, x + 4, y0 + labelH);
  });
});

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function chunk(type, body) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(body.length, 0);
  const typeBuf = Buffer.from(type);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, body])), 0);
  return Buffer.concat([len, typeBuf, body, crcBuf]);
}
function encodePNG(width, height, pixels) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const row = y * (width * 4 + 1);
    raw[row] = 0;
    pixels.copy(raw, row + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0))
  ]);
}
const out = process.argv[2] || "/opt/cursor/artifacts/battle-contact.png";
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, encodePNG(sheetW, sheetH, data));
console.log("wrote", out, sheetW + "x" + sheetH);
