// Contact sheet for the Act 1 field cast. Writes a 4× PNG plus a 1× strip.
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
vm.runInContext(fs.readFileSync(path.join(root, "js/art/characters.js"), "utf8"), context, { filename: "js/art/characters.js" });

const Art = context.Art;
const RGB = Art.RGB;
const order = Art.fieldOrder;
const dirs = ["down", "left", "right", "up"];
const cells = [];

function frameList() {
  const list = [];
  dirs.forEach((dir) => {
    for (let f = 0; f < 4; f++) list.push({ pose: "walk", dir, frame: f, label: dir + " " + f });
    for (let f = 0; f < 2; f++) list.push({ pose: "stand", dir, frame: f, label: "idle " + f });
  });
  return list;
}

const frames = frameList();
const names = {
  wayfarer: "WAYFARER",
  maren: "OLD MAREN",
  kestrel: "KESTREL",
  tamsin: "TAMSIN",
  hesk: "BROTHER HESK",
  ilsa: "WARDEN ILSA",
  cantor: "THE CANTOR"
};

let maxW = 0;
let maxH = 0;
const baked = [];
for (const id of order) {
  const row = [];
  for (const fr of frames) {
    let spr;
    try {
      spr = Art._makers[id](fr.pose, fr.dir, fr.frame);
    } catch (err) {
      console.error(id, fr.label, err);
      process.exit(1);
    }
    if (!spr || !spr.w) {
      console.error("missing", id, fr.label);
      process.exit(1);
    }
    if (spr.w > 24 || spr.h > 38) {
      console.error(id, fr.label, "too big", spr.w + "x" + spr.h);
      process.exit(1);
    }
    maxW = Math.max(maxW, spr.w);
    maxH = Math.max(maxH, spr.h);
    row.push(spr);
  }
  const battle = Art._makers[id]("idle", "right", 0);
  if (!battle || battle.h < 32) {
    console.error(id, "battle idle was replaced", battle && battle.w, battle && battle.h);
    process.exit(1);
  }
  baked.push({ id, row, battle });
  const down = row[0];
  console.log(id, "field", down.w + "x" + down.h, "ax", down.ax, "ay", down.ay, "battle", battle.w + "x" + battle.h);
}

const zoom = 4;
const pad = 8;
const labelH = 14;
const cellW = maxW * zoom + pad;
const cellH = maxH * zoom + pad;
const cols = frames.length;
const sheetW = cols * cellW + 8;
const blockH = labelH + cellH;
const sheetH = 8 + baked.length * blockH + 8 + (maxH + 16);

function rgba(index) {
  const col = RGB[index];
  if (!col) return [0, 0, 0, 0];
  return [col[0], col[1], col[2], 255];
}

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
  A: ["111", "101", "111", "101", "101"],
  B: ["110", "101", "110", "101", "110"],
  C: ["111", "100", "100", "100", "111"],
  D: ["110", "101", "101", "101", "110"],
  E: ["111", "100", "110", "100", "111"],
  F: ["111", "100", "110", "100", "100"],
  G: ["111", "100", "101", "101", "111"],
  H: ["101", "101", "111", "101", "101"],
  I: ["111", "010", "010", "010", "111"],
  J: ["001", "001", "001", "101", "111"],
  K: ["101", "110", "100", "110", "101"],
  L: ["100", "100", "100", "100", "111"],
  M: ["101", "111", "101", "101", "101"],
  N: ["110", "101", "101", "101", "101"],
  O: ["111", "101", "101", "101", "111"],
  P: ["111", "101", "111", "100", "100"],
  Q: ["111", "101", "101", "111", "001"],
  R: ["110", "101", "110", "101", "101"],
  S: ["111", "100", "111", "001", "111"],
  T: ["111", "010", "010", "010", "010"],
  U: ["101", "101", "101", "101", "111"],
  V: ["101", "101", "101", "101", "010"],
  W: ["101", "101", "101", "111", "101"],
  X: ["101", "101", "010", "101", "101"],
  Y: ["101", "101", "010", "010", "010"],
  Z: ["111", "001", "010", "100", "111"],
  " ": ["000", "000", "000", "000", "000"],
  "0": ["111", "101", "101", "101", "111"],
  "1": ["010", "110", "010", "010", "111"],
  "2": ["111", "001", "111", "100", "111"],
  "3": ["111", "001", "111", "001", "111"],
  "4": ["101", "101", "111", "001", "001"]
};

function text(x, y, str, r, g, b) {
  let cx = x;
  for (const ch of str) {
    const glyph = FONT[ch] || FONT[" "];
    for (let gy = 0; gy < glyph.length; gy++) {
      for (let gx = 0; gx < glyph[gy].length; gx++) {
        if (glyph[gy].charAt(gx) === "1") plot(cx + gx, y + gy, r, g, b, 255);
      }
    }
    cx += 4;
  }
}

function blitSpr(spr, dx, dy, scale) {
  for (let y = 0; y < spr.h; y++) {
    for (let x = 0; x < spr.w; x++) {
      const col = rgba(spr.d[y * spr.w + x]);
      if (!col[3]) continue;
      for (let sy = 0; sy < scale; sy++) {
        for (let sx = 0; sx < scale; sx++) {
          plot(dx + x * scale + sx, dy + y * scale + sy, col[0], col[1], col[2], 255);
        }
      }
    }
  }
  // Anchor tick under the feet.
  const ax = dx + spr.ax * scale + (scale >> 1);
  const ay = dy + spr.ay * scale + scale - 1;
  plot(ax, ay + 2, 255, 220, 80, 255);
}

baked.forEach((entry, i) => {
  const y0 = 8 + i * blockH;
  text(8, y0, names[entry.id] || entry.id, 255, 244, 220);
  entry.row.forEach((spr, c) => {
    const x = 8 + c * cellW;
    const y = y0 + labelH;
    if (c % 6 === 0) text(x, y0, frames[c].dir.toUpperCase(), 190, 220, 255);
    blitSpr(spr, x + 2, y + 2, zoom);
  });
});

// 1× readability strip of the down idle and a side idle, on grass.
const stripY = 8 + baked.length * blockH;
text(8, stripY, "1X  DOWN IDLE   SIDE IDLE", 255, 244, 220);
baked.forEach((entry, i) => {
  const down = entry.row[4];
  const side = entry.row[16];
  blitSpr(down, 8 + i * 46, stripY + 12, 1);
  blitSpr(side, 8 + i * 46 + 22, stripY + 12, 1);
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
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

const out = process.argv[2] || path.join(root, "art", "characters-contact.png");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, encodePNG(sheetW, sheetH, data));
console.log("wrote", out, sheetW + "x" + sheetH);
