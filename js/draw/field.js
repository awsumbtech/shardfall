"use strict";

// FieldView: view math, the blob cache, and the speck, cloud, and group dress of a drift.

SF.anim = 0;
SF.zoom = 1;
SF.dpr = 1;
SF.viewW = 1;
SF.viewH = 1;

SF.zoomFor = function () {
  return 1;
};

SF.foot = function (c) {
  if (!c) return { x: 0, y: 0, rx: 8, ry: 8, rect: false };
  if (c.k === "r" || (c.w != null && c.rx == null)) {
    return { x: c.x + c.w / 2, y: c.y + c.h / 2, rx: c.w / 2, ry: c.h / 2, rect: true, sh: c };
  }
  return { x: c.x, y: c.y, rx: c.rx || c.r || 8, ry: c.ry || c.r || 8, rect: false, sh: c };
};

SF.viewRect = function (pad) {
  var zoom = SF.zoom || 1;
  var s = SF.state;
  var hw = SF.viewW / (2 * zoom) + pad;
  var hh = SF.viewH / (2 * zoom) + pad;
  return { l: s.camX - hw, r: s.camX + hw, t: s.camY - hh, b: s.camY + hh };
};

SF.makeBlob = function (size, inner, outer) {
  var c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  var g = c.getContext("2d");
  var rg = g.createRadialGradient(size / 2, size / 2, size * 0.08, size / 2, size / 2, size / 2);
  rg.addColorStop(0, inner);
  rg.addColorStop(1, outer);
  g.fillStyle = rg;
  g.fillRect(0, 0, size, size);
  return c;
};

SF.cacheSprites = function () {
  SF.blobs = {
    cloud: SF.makeBlob(256, "rgba(255,236,250,0.92)", "rgba(255,236,250,0)"),
    mist: SF.makeBlob(256, "rgba(186,214,255,0.7)", "rgba(186,214,255,0)"),
    dusk: SF.makeBlob(256, "rgba(255,176,150,0.55)", "rgba(255,176,150,0)"),
    shadow: SF.makeBlob(256, "rgba(48,24,72,0.45)", "rgba(48,24,72,0)"),
    cyan: SF.makeBlob(128, "rgba(150,250,255,0.95)", "rgba(150,250,255,0)"),
    gold: SF.makeBlob(128, "rgba(255,214,120,0.95)", "rgba(255,214,120,0)"),
    rose: SF.makeBlob(128, "rgba(255,160,190,0.9)", "rgba(255,160,190,0)"),
    violet: SF.makeBlob(128, "rgba(210,170,255,0.9)", "rgba(210,170,255,0)")
  };
};

SF.buildWorld = function () {
  var rand = SF.mulberry32(20261019);
  var specks = [];
  function sprinkle(c) {
    var f = SF.foot(c);
    var reach = Math.max(f.rx, f.ry);
    var n = Math.min(80, Math.floor((reach * reach) / 780));
    var i, a, dx, dy;
    for (i = 0; i < n; i++) {
      a = rand() * Math.PI * 2;
      dx = Math.cos(a) * Math.sqrt(rand()) * (f.rx - 8);
      dy = Math.sin(a) * Math.sqrt(rand()) * (f.ry - 8);
      specks.push({ x: f.x + dx, y: f.y + dy, k: rand(), group: c.group });
    }
  }
  SF.WALK.circles.forEach(sprinkle);
  (SF.WALK.rects || []).forEach(sprinkle);
  SF.specks = specks;
  var clouds = [];
  var minX = -900;
  var maxX = 1100;
  var minY = -700;
  var maxY = 1000;
  function growBounds(c) {
    var f = SF.foot(c);
    minX = Math.min(minX, f.x - f.rx - 180);
    maxX = Math.max(maxX, f.x + f.rx + 180);
    minY = Math.min(minY, f.y - f.ry - 180);
    maxY = Math.max(maxY, f.y + f.ry + 180);
  }
  SF.WALK.circles.forEach(growBounds);
  (SF.WALK.rects || []).forEach(growBounds);
  var gx, gy;
  for (gx = minX; gx <= maxX; gx += 170) {
    for (gy = minY; gy <= maxY; gy += 150) {
      clouds.push({
        x: gx + (rand() - 0.5) * 80,
        y: gy + (rand() - 0.5) * 70,
        s: 90 + rand() * 150,
        kind: rand() > 0.55 ? "mist" : (rand() > 0.5 ? "dusk" : "cloud"),
        drift: 6 + rand() * 10
      });
    }
  }
  SF.clouds = clouds;
  var groups = { ember: [], span: [], cinder: [], perch: [], quay: [], ash: [], vault: [], ridge: [], scar: [] };
  function pushGroup(c) {
    if (!c.group) return;
    if (!groups[c.group]) groups[c.group] = [];
    groups[c.group].push(c);
  }
  SF.WALK.circles.forEach(pushGroup);
  (SF.WALK.rects || []).forEach(pushGroup);
  SF.groups = groups;
};

SF.traceGroup = function (ctx, circles, grow) {
  ctx.beginPath();
  (circles || []).forEach(function (c) {
    var g = grow || 0;
    var f = SF.foot(c);
    if (f.rect && c.w != null) {
      ctx.rect(c.x - g, c.y - g, c.w + g * 2, c.h + g * 2);
      return;
    }
    var rx = Math.max(2, f.rx + g);
    var ry = Math.max(2, f.ry + g);
    ctx.moveTo(f.x + rx, f.y);
    if (ctx.ellipse) ctx.ellipse(f.x, f.y, rx, ry, 0, 0, Math.PI * 2);
    else ctx.arc(f.x, f.y, Math.min(rx, ry), 0, Math.PI * 2);
  });
};

SF.FieldView = {
  foot: function (c) { return SF.foot(c); },
  viewRect: function (pad) { return SF.viewRect(pad); },
  makeBlob: function (size, inner, outer) { return SF.makeBlob(size, inner, outer); },
  cacheSprites: function () { SF.cacheSprites(); },
  buildWorld: function () { SF.buildWorld(); },
  traceGroup: function (ctx, circles, grow) { SF.traceGroup(ctx, circles, grow); }
};
