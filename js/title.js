"use strict";

var SF = window.SF || {};
window.SF = SF;

var titleArt = null;

function blob(size, inner, outer) {
  var c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  var g = c.getContext("2d");
  var rg = g.createRadialGradient(size / 2, size / 2, size * 0.05, size / 2, size / 2, size / 2);
  rg.addColorStop(0, inner);
  rg.addColorStop(1, outer);
  g.fillStyle = rg;
  g.fillRect(0, 0, size, size);
  return c;
}

function paintIsland(size, grass, grassHi, cliff) {
  var c = document.createElement("canvas");
  var w = Math.ceil(size * 2.1);
  var h = Math.ceil(size * 1.35);
  c.width = w;
  c.height = h;
  var g = c.getContext("2d");
  g.translate(w / 2, h * 0.58);
  g.fillStyle = "rgba(36, 16, 48, 0.28)";
  g.beginPath();
  g.ellipse(size * 0.08, size * 0.28, size * 0.78, size * 0.16, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = cliff;
  g.beginPath();
  g.ellipse(0, size * 0.08, size * 0.7, size * 0.3, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "rgba(70, 32, 28, 0.45)";
  g.beginPath();
  g.ellipse(size * 0.22, size * 0.12, size * 0.32, size * 0.16, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = grass;
  g.beginPath();
  g.ellipse(-size * 0.02, -size * 0.08, size * 0.66, size * 0.26, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = grassHi;
  g.beginPath();
  g.ellipse(-size * 0.2, -size * 0.14, size * 0.24, size * 0.09, -0.4, 0, Math.PI * 2);
  g.fill();
  return c;
}

function ensureTitleArt() {
  if (titleArt) return titleArt;
  titleArt = {
    cloud: blob(128, "rgba(255, 236, 246, 0.9)", "rgba(255, 236, 246, 0)"),
    mist: blob(128, "rgba(255, 196, 170, 0.55)", "rgba(255, 196, 170, 0)"),
    haze: blob(128, "rgba(186, 214, 255, 0.45)", "rgba(186, 214, 255, 0)"),
    lamp: blob(64, "rgba(255, 220, 140, 0.95)", "rgba(255, 220, 140, 0)"),
    mote: blob(32, "rgba(255, 236, 200, 0.9)", "rgba(255, 236, 200, 0)"),
    islands: [
      paintIsland(180, "#5cba78", "rgba(230, 255, 196, 0.55)", "#a15a42"),
      paintIsland(150, "#6ed184", "rgba(236, 255, 210, 0.5)", "#8d4d3c"),
      paintIsland(120, "#e0b15a", "rgba(255, 236, 190, 0.55)", "#8a5a3c"),
      paintIsland(96, "#73cbb4", "rgba(220, 255, 244, 0.5)", "#6a5344"),
      paintIsland(78, "#8aa0e0", "rgba(230, 236, 255, 0.45)", "#5c4a68")
    ]
  };
  return titleArt;
}

var ISLANDS = [
  { sprite: 4, x: 0.16, y: 0.2, w: 86, depth: 0.85, phase: 0.4, lamp: false },
  { sprite: 3, x: 0.8, y: 0.18, w: 100, depth: 0.75, phase: 1.7, lamp: false },
  { sprite: 2, x: 0.72, y: 0.3, w: 128, depth: 0.45, phase: 2.4, lamp: true },
  { sprite: 1, x: 0.4, y: 0.28, w: 168, depth: 0.35, phase: 0.2, lamp: false },
  { sprite: 0, x: 0.22, y: 0.4, w: 210, depth: 0.15, phase: 1.1, lamp: false }
];

var CLOUDS = [
  { x: 0.05, y: 0.12, w: 220, h: 70, speed: 7, alpha: 0.28, kind: "haze" },
  { x: 0.55, y: 0.08, w: 260, h: 80, speed: 5, alpha: 0.22, kind: "cloud" },
  { x: 0.3, y: 0.46, w: 340, h: 110, speed: 11, alpha: 0.4, kind: "mist" },
  { x: 0.75, y: 0.52, w: 300, h: 100, speed: 14, alpha: 0.34, kind: "cloud" },
  { x: -0.1, y: 0.6, w: 380, h: 120, speed: 9, alpha: 0.32, kind: "mist" },
  { x: 0.4, y: 0.66, w: 420, h: 130, speed: 16, alpha: 0.38, kind: "cloud" },
  { x: 0.1, y: 0.74, w: 360, h: 120, speed: 12, alpha: 0.3, kind: "haze" },
  { x: 0.62, y: 0.82, w: 400, h: 140, speed: 18, alpha: 0.28, kind: "mist" }
];

function skySheet(w, h) {
  var key = w + "x" + h;
  if (titleArt.skyKey === key) return titleArt.sky;
  var c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  var g = c.getContext("2d");
  var grad = g.createLinearGradient(0, 0, 0, c.height);
  grad.addColorStop(0, "#120a24");
  grad.addColorStop(0.32, "#3c2464");
  grad.addColorStop(0.52, "#d98978");
  grad.addColorStop(0.7, "#f0c2a4");
  grad.addColorStop(1, "#e7b49a");
  g.fillStyle = grad;
  g.fillRect(0, 0, c.width, c.height);
  titleArt.sky = c;
  titleArt.skyKey = key;
  return c;
}

SF.drawTitleScene = function (ctx, w, h, dpr) {
  var art = ensureTitleArt();
  var still = !!(SF.reduceMotion);
  var steady = !!(SF.reduceFlash || SF.reduceMotion);
  var t = still ? 0 : (SF.anim || 0);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.globalAlpha = 1;
  ctx.drawImage(skySheet(w, h), 0, 0, w, h);

  ctx.save();
  ctx.globalAlpha = steady ? 0.22 : 0.4;
  ctx.strokeStyle = "#fff4d2";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(w * 0.08, h * 0.08);
  ctx.lineTo(w * 0.22, h * 0.13);
  ctx.lineTo(w * 0.3, h * 0.06);
  ctx.lineTo(w * 0.48, h * 0.14);
  ctx.lineTo(w * 0.62, h * 0.05);
  ctx.lineTo(w * 0.86, h * 0.12);
  ctx.stroke();
  ctx.restore();

  var i, c, x, sprite, isl, px, py, iw, ih, glow;
  ctx.save();
  for (i = 0; i < CLOUDS.length; i++) {
    c = CLOUDS[i];
    sprite = art[c.kind] || art.cloud;
    x = ((c.x * w + t * c.speed) % (w + c.w)) - c.w * 0.35;
    ctx.globalAlpha = c.alpha;
    ctx.drawImage(sprite, x, c.y * h, c.w, c.h);
  }
  ctx.restore();

  for (i = 0; i < ISLANDS.length; i++) {
    isl = ISLANDS[i];
    sprite = art.islands[isl.sprite];
    iw = isl.w;
    ih = iw * (sprite.height / sprite.width);
    px = isl.x * w + Math.sin(t * (0.08 + isl.depth * 0.05) + isl.phase) * (8 + isl.depth * 18);
    py = isl.y * h + Math.cos(t * 0.05 + isl.phase) * (3 + isl.depth * 4);
    ctx.globalAlpha = 0.92 - isl.depth * 0.18;
    ctx.drawImage(sprite, px - iw * 0.5, py - ih * 0.45, iw, ih);
    if (isl.lamp) {
      glow = steady ? 0.82 : (0.72 + Math.sin(t * 1.1) * 0.1);
      ctx.globalAlpha = glow;
      ctx.drawImage(art.lamp, px + iw * 0.08, py - ih * 0.42, iw * 0.22, iw * 0.22);
    }
  }
  ctx.globalAlpha = 1;

  if (!steady) {
    ctx.save();
    for (i = 0; i < 4; i++) {
      x = ((0.15 + i * 0.22) * w + Math.sin(t * 0.2 + i) * 12);
      py = h * (0.16 + (i % 3) * 0.08) + Math.cos(t * 0.17 + i) * 8;
      ctx.globalAlpha = 0.25 + (Math.sin(t * 0.8 + i * 1.3) * 0.5 + 0.5) * 0.35;
      ctx.drawImage(art.mote, x, py, 10, 10);
    }
    ctx.restore();
  }
  ctx.globalAlpha = 1;
};
