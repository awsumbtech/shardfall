"use strict";

// Palette-indexed pixel art. Sprites are painted into grids, rasterized once,
// and blitted with nearest-neighbor integer scaling.
var Art = window.Art || {};
window.Art = Art;

var HEX = [
  null,
  "#1c1424", "#f2c2a4", "#d89878", "#b87458", "#fff4ec", "#241810", "#e09080",
  "#3a2a22", "#5c4030", "#f3eadc", "#cfc4b4", "#8a3820", "#5c2414", "#1a1618",
  "#2c4a9a", "#1a2e68", "#6a8ad4", "#7ef0ff", "#e7fcff", "#1a6878",
  "#178078", "#0c4c4c", "#6ecfc0", "#f0c84c", "#b08828", "#d7f6ff", "#1c3038",
  "#e07028", "#a04418", "#f0a060", "#3a2818", "#d0d6dc", "#7c868e",
  "#c05048", "#7a3030", "#e88878", "#f0d078", "#a88438",
  "#4c4474", "#2a2448", "#7c74a4", "#c8b8f0",
  "#8e8678", "#4a443c", "#d2caba", "#8a2430",
  "#1a1224", "#0e0a16", "#3a3050", "#f4efe6", "#d4cdc2", "#e6c56a",
  "#5a8a3c", "#3a5c28", "#d05848", "#8a3028", "#f0e2c4",
  "#3e9a44", "#2c7434", "#8ed45c", "#1e5828",
  "#c47858", "#8a4634", "#efb898", "#5e3428",
  "#c8a474", "#8c6844", "#ead4a8",
  "#6a5888", "#8e7aaa", "#d0c0e0", "#3a2858",
  "#f0d0c4", "#f8ece4",
  "#b0a49c", "#6e6460", "#ddd4cc", "#e06828", "#ffb15a", "#5a4038",
  "#3a8a98", "#1a5868", "#8ad4d4", "#e4f6f4",
  "#8a5a34", "#5c3820", "#c49868",
  "#9a928a", "#6a625c", "#ddd6ce",
  "#f6f2ea", "#201810", "#ff6a78", "#ffe08a",
  "#c6b0ff", "#7a58aa", "#3a2458", "#ffd0e4", "#ffffff", "#101820",
  "#2a5ea8", "#163878", "#0a1848", "#8ec8f0",
  "#6a8a48", "#2e5a30", "#a8d46a", "#d8c4a8", "#4a6a78",
  "#f0c8b0", "#c8a898", "#3a6a58", "#1e4038", "#c84848", "#f4e0a0", "#e8d8c8"
];

var RGB = HEX.map(function (h) {
  if (!h) return null;
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
});

Art.HEX = HEX;
Art.RGB = RGB;
Art.C = {
  ink: 1, skin: 2, skinD: 3, skinDeep: 4, lite: 5, eye: 6, lip: 7,
  hairD: 8, hair: 9, hairW: 10, hairWD: 11, hairR: 12, hairRD: 13, hairK: 14,
  coat: 15, coatD: 16, coatL: 17, shard: 18, shardH: 19, shardD: 20,
  teal: 21, tealD: 22, tealL: 23, scarf: 24, scarfD: 25, lens: 26, frame: 27,
  vest: 28, vestD: 29, vestL: 30, belt: 31, metal: 32, metalD: 33,
  shawl: 34, shawlD: 35, shawlL: 36, gold: 37, goldD: 38,
  robe: 39, robeD: 40, robeL: 41, stole: 42,
  armor: 43, armorD: 44, armorL: 45, plume: 46,
  void: 47, voidD: 48, voidL: 49, mask: 50, maskD: 51, hem: 52,
  green: 53, greenD: 54, red: 55, redD: 56, cream: 57,
  grass: 58, grassD: 59, grassL: 60, grassX: 61,
  cliff: 62, cliffD: 63, cliffL: 64, cliffX: 65,
  path: 66, pathD: 67, pathL: 68,
  hush: 69, hushL: 70, hushP: 71, hushD: 72,
  cloud: 73, cloudW: 74,
  ash: 75, ashD: 76, ashL: 77, ember: 78, emberH: 79, rock: 80,
  tide: 81, tideD: 82, tideL: 83, foam: 84,
  wood: 85, woodD: 86, woodL: 87,
  stone: 88, stoneD: 89, stoneL: 90,
  paper: 91, dark: 92, hp: 93, warm: 94,
  core: 95, violet: 96, violetD: 97, bloom: 98, white: 99, night: 100,
  win: 101, winM: 102, winD: 103, winL: 104,
  leaf: 105, leafD: 106, leafL: 107, sand: 108, sea: 109,
  pale: 110, paleD: 111, weed: 112, weedD: 113, sash: 114, bone: 115, tooth: 116
};

Art.spr = function (w, h) {
  return { w: w, h: h, d: new Uint8Array(w * h), ax: (w / 2) | 0, ay: h - 1 };
};

Art.plot = function (s, x, y, c) {
  x = x | 0;
  y = y | 0;
  if (!c || x < 0 || y < 0 || x >= s.w || y >= s.h) return;
  s.d[y * s.w + x] = c;
};

Art.fill = function (s, x, y, w, h, c) {
  var yy, xx;
  for (yy = 0; yy < h; yy++) {
    for (xx = 0; xx < w; xx++) Art.plot(s, x + xx, y + yy, c);
  }
};

Art.outline = function (s, c) {
  var w = s.w;
  var h = s.h;
  var src = s.d;
  var copy = new Uint8Array(src);
  var x, y, k, nx, ny;
  var dirs = [1, 0, -1, 0, 0, 1, 0, -1];
  c = c || 1;
  for (y = 0; y < h; y++) {
    for (x = 0; x < w; x++) {
      if (copy[y * w + x]) continue;
      for (k = 0; k < 8; k += 2) {
        nx = x + dirs[k];
        ny = y + dirs[k + 1];
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        if (copy[ny * w + nx]) {
          src[y * w + x] = c;
          break;
        }
      }
    }
  }
  return s;
};

Art.mirror = function (s) {
  var o = Art.spr(s.w, s.h);
  var x, y;
  for (y = 0; y < s.h; y++) {
    for (x = 0; x < s.w; x++) o.d[y * s.w + (s.w - 1 - x)] = s.d[y * s.w + x];
  }
  o.ax = s.w - 1 - s.ax;
  o.ay = s.ay;
  return o;
};

Art.clone = function (s) {
  var o = Art.spr(s.w, s.h);
  o.d.set(s.d);
  o.ax = s.ax;
  o.ay = s.ay;
  return o;
};

Art.shift = function (s, dx, dy) {
  var o = Art.spr(s.w, s.h);
  var x, y, c;
  for (y = 0; y < s.h; y++) {
    for (x = 0; x < s.w; x++) {
      c = s.d[y * s.w + x];
      if (c) Art.plot(o, x + dx, y + dy, c);
    }
  }
  o.ax = s.ax;
  o.ay = s.ay;
  return o;
};

Art.glyph = function (rows, map, ax, ay) {
  var h = rows.length;
  var w = rows[0].length;
  var s = Art.spr(w, h);
  var y, x, ch;
  for (y = 0; y < h; y++) {
    for (x = 0; x < w; x++) {
      ch = rows[y].charAt(x);
      if (map[ch]) Art.plot(s, x, y, map[ch]);
    }
  }
  s.ax = ax == null ? (w / 2) | 0 : ax;
  s.ay = ay == null ? h - 1 : ay;
  return s;
};

Art.raster = function (s) {
  var canvas = document.createElement("canvas");
  canvas.width = s.w;
  canvas.height = s.h;
  var g = canvas.getContext("2d");
  var img = g.createImageData(s.w, s.h);
  var data = img.data;
  var i, p, col, o;
  for (i = 0; i < s.d.length; i++) {
    p = s.d[i];
    if (!p) continue;
    col = RGB[p];
    if (!col) continue;
    o = i * 4;
    data[o] = col[0];
    data[o + 1] = col[1];
    data[o + 2] = col[2];
    data[o + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  canvas._ax = s.ax;
  canvas._ay = s.ay;
  return canvas;
};

Art.hex = function (index) {
  return HEX[index] || "#000";
};

Art._makers = {};
Art._portraits = {};
Art._cache = {};
Art._pCache = {};
Art._scale = {};
Art._fieldScale = {};
Art._missing = null;

Art.add = function (id, maker, scale, fieldScale) {
  Art._makers[id] = maker;
  if (scale != null) Art._scale[id] = scale;
  if (fieldScale != null) Art._fieldScale[id] = fieldScale;
};

Art.addPortrait = function (id, maker) {
  Art._portraits[id] = maker;
};

Art.fieldScale = function (id) {
  if (Art._fieldScale[id] != null) return Art._fieldScale[id];
  if (Art._scale[id] != null) return Art._scale[id];
  return 2;
};

Art.defaultScale = function (id) {
  return Art._scale[id] != null ? Art._scale[id] : 2;
};

function missingSprite() {
  if (Art._missing) return Art._missing;
  var s = Art.spr(8, 8);
  var x, y;
  for (y = 0; y < 8; y++) {
    for (x = 0; x < 8; x++) Art.plot(s, x, y, ((x + y) & 1) ? 93 : 1);
  }
  s.ax = 4;
  s.ay = 7;
  Art._missing = Art.raster(s);
  return Art._missing;
}

Art.frameOf = function (id, pose, facing, frame) {
  pose = pose || "walk";
  facing = facing || "down";
  frame = frame | 0;
  var key = id + "|" + pose + "|" + facing + "|" + frame;
  if (Art._cache[key]) return Art._cache[key];
  var maker = Art._makers[id];
  var canvas;
  if (!maker) canvas = missingSprite();
  else {
    var spr = null;
    try { spr = maker(pose, facing, frame); } catch (err) { spr = null; }
    canvas = spr && spr.w ? Art.raster(spr) : missingSprite();
  }
  Art._cache[key] = canvas;
  return canvas;
};

Art.portraitCanvas = function (id) {
  if (Art._pCache[id]) return Art._pCache[id];
  var maker = Art._portraits[id] || Art._portraits.unknown;
  var spr = maker ? maker() : null;
  var canvas = spr && spr.w ? Art.raster(spr) : missingSprite();
  Art._pCache[id] = canvas;
  return canvas;
};

// Draw a pre-rastered sprite so each source pixel lands on whole device pixels.
Art.blit = function (ctx, canvas, x, y, dw, dh) {
  if (!ctx || !canvas || dw < 1 || dh < 1) return;
  var smooth = ctx.imageSmoothingEnabled;
  if (ctx.getTransform && ctx.setTransform) {
    var t = ctx.getTransform();
    if (t.b === 0 && t.c === 0 && t.a !== 0 && t.d !== 0) {
      var px = t.a * x + t.e;
      var py = t.d * y + t.f;
      var sx = Math.max(1, Math.round(Math.abs(t.a * dw) / canvas.width));
      var sy = Math.max(1, Math.round(Math.abs(t.d * dh) / canvas.height));
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(canvas, Math.round(px), Math.round(py), canvas.width * sx, canvas.height * sy);
      ctx.restore();
      return;
    }
  }
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(canvas, x, y, dw, dh);
  ctx.imageSmoothingEnabled = smooth;
};

Art.calm = function () {
  if (window.SF && typeof SF.calm === "function") return !!SF.calm();
  try {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
    var v = window.localStorage && localStorage.getItem("shardfall.reduceFlash");
    if (v == null) return true;
    return v !== "0";
  } catch (err) {
    return true;
  }
};

function normFacing(facing, fx, fy) {
  if (facing == null && (fx != null || fy != null)) {
    fx = fx || 0;
    fy = fy || 0;
    if (Math.abs(fx) >= Math.abs(fy)) return fx < 0 ? "left" : "right";
    return fy < 0 ? "up" : "down";
  }
  if (facing === 0 || facing === "s" || facing === "south") return "down";
  if (facing === 1 || facing === "w" || facing === "west") return "left";
  if (facing === 2 || facing === "n" || facing === "north") return "up";
  if (facing === 3 || facing === "e" || facing === "east") return "right";
  if (facing === "side") return "right";
  if (facing === "left" || facing === "right" || facing === "up" || facing === "down") return facing;
  return "down";
}

var POSES = { idle: 1, walk: 1, attack: 1, hurt: 1, cast: 1, victory: 1 };

// Art.sprite(ctx, id, x, y, { frame, facing, scale, pose })
// Feet (the baseline) sit on (x, y). pose "walk" is the field cycle.
// pose "idle" | "attack" | "hurt" | "cast" | "victory" are the side-view battle frames.
// A string frame is treated as the pose name.
Art.sprite = function (ctx, id, x, y, opts) {
  if (!ctx || !id) return;
  opts = opts || {};
  var pose = opts.pose || opts.anim || "walk";
  var frame = opts.frame;
  if (typeof frame === "string" && POSES[frame]) {
    pose = frame;
    frame = opts.index || 0;
  }
  if (typeof pose !== "string" || !POSES[pose]) pose = "walk";
  var facing = normFacing(opts.facing, opts.fx, opts.fy);
  var index = (frame == null ? 0 : frame) | 0;
  if (pose !== "walk" && facing !== "left" && facing !== "right") {
    facing = (opts.fx != null && opts.fx < 0) ? "left" : (facing === "left" ? "left" : "right");
  }
  var canvas = Art.frameOf(id, pose, facing, index);
  var scale = opts.scale == null ? Art.defaultScale(id) : opts.scale;
  if (!(scale > 0)) scale = 1;
  var ax = canvas._ax || 0;
  var ay = canvas._ay || canvas.height - 1;
  if (opts.anchor === "center") {
    ax = canvas.width / 2;
    ay = canvas.height / 2;
  } else if (opts.anchor === "top") {
    ax = canvas.width / 2;
    ay = 0;
  }
  Art.blit(ctx, canvas, x - ax * scale, y - ay * scale, canvas.width * scale, canvas.height * scale);
};

Art.portrait = function (ctx, id, x, y, size) {
  if (!ctx) return;
  var canvas = Art.portraitCanvas(id || "unknown");
  var s = size || canvas.width;
  Art.blit(ctx, canvas, x, y, s, s);
};

Art.tile = function (ctx, name, x, y, scale) {
  Art.sprite(ctx, "tile_" + name, x, y, { scale: scale == null ? 1 : scale, anchor: "center", pose: "walk", frame: 0, facing: "down" });
};

Art.spriteSize = function (id, pose, facing) {
  var canvas = Art.frameOf(id, pose || "walk", facing || "down", 0);
  return { w: canvas.width, h: canvas.height, ax: canvas._ax || 0, ay: canvas._ay || 0 };
};

Art.ids = function () {
  return Object.keys(Art._makers);
};

Art.portraitIds = function () {
  return Object.keys(Art._portraits);
};

Art.preload = function () {
  var ids = Art.ids();
  var dirs = ["down", "up", "left", "right"];
  var poses = ["idle", "attack", "hurt", "cast"];
  var i, d, n, p;
  for (i = 0; i < ids.length; i++) {
    if (ids[i].indexOf("tile_") === 0) {
      Art.frameOf(ids[i], "walk", "down", 0);
      continue;
    }
    for (d = 0; d < dirs.length; d++) {
      for (n = 0; n < 4; n++) Art.frameOf(ids[i], "walk", dirs[d], n);
    }
    for (p = 0; p < poses.length; p++) {
      for (n = 0; n < 2; n++) {
        Art.frameOf(ids[i], poses[p], "right", n);
        Art.frameOf(ids[i], poses[p], "left", n);
      }
    }
  }
  var ps = Art.portraitIds();
  for (i = 0; i < ps.length; i++) Art.portraitCanvas(ps[i]);
};
