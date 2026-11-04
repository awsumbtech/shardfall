"use strict";

// SkyLayer: the sky gradient, the drifting cloud sheet, and the hush lip.

SF.drawSky = function (ctx, w, h, s) {
  var lit = SF.lampIsLit ? SF.lampIsLit(s) : !!(s.flags && s.flags.lampLit);
  var isle = SF.islandId || "emberhold";
  var key = isle + (lit ? "L" : "D") + ":" + w + "x" + h;
  if (SF._skyKey !== key) {
    var skies = SF.SKY || {};
    var row = skies[isle] || skies.emberhold || { dusk: ["#1a1038", "#4c356c", "#e39a8c", "#f0c6ae"], lit: ["#2a1860", "#6a4a86", "#f0b59a", "#f8d7b4"] };
    var stops = (lit && row.lit) ? row.lit : row.dusk;
    var g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, stops[0]);
    g.addColorStop(0.42, stops[1]);
    g.addColorStop(0.72, stops[2]);
    g.addColorStop(1, stops[3]);
    SF._skyGrad = g;
    SF._skyKey = key;
  }
  ctx.fillStyle = SF._skyGrad;
  ctx.fillRect(0, 0, w, h);

  var t = SF.anim;
  var i, x, y, puff;
  ctx.save();
  for (i = 0; i < 7; i++) {
    x = ((t * (10 + i * 4) + i * 190) % (w + 280)) - 140;
    y = h * (0.08 + (i % 4) * 0.16);
    puff = i % 2 ? SF.blobs.mist : SF.blobs.cloud;
    ctx.globalAlpha = 0.28;
    ctx.drawImage(puff, x, y, 220 + (i % 3) * 40, 90);
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = (SF.calm && SF.calm()) ? 0.28 : (lit ? 0.55 : 0.34);
  ctx.strokeStyle = "#fff4d2";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w * 0.12, h * 0.07);
  ctx.lineTo(w * 0.28, h * 0.13);
  ctx.lineTo(w * 0.36, h * 0.05);
  ctx.lineTo(w * 0.52, h * 0.15);
  ctx.lineTo(w * 0.66, h * 0.04);
  ctx.lineTo(w * 0.84, h * 0.11);
  ctx.stroke();
  ctx.restore();
};

SF.cloudStamp = function () {
  var clouds = SF.clouds;
  if (!clouds || !clouds.length) return "0";
  var a = clouds[0];
  var b = clouds[clouds.length - 1];
  return clouds.length + ":" + a.x + ":" + a.y + ":" + b.x + ":" + b.y;
};

SF.buildCloudSheet = function () {
  var clouds = SF.clouds || [];
  var minX = Infinity;
  var minY = Infinity;
  var maxX = -Infinity;
  var maxY = -Infinity;
  var i, c, reach;
  for (i = 0; i < clouds.length; i++) {
    c = clouds[i];
    reach = c.s * 1.7;
    if (c.x - reach < minX) minX = c.x - reach;
    if (c.x + reach > maxX) maxX = c.x + reach;
    if (c.y - reach < minY) minY = c.y - reach;
    if (c.y + reach > maxY) maxY = c.y + reach;
  }
  if (!isFinite(minX)) {
    minX = -400;
    minY = -400;
    maxX = 400;
    maxY = 400;
  }
  var worldW = Math.max(1, maxX - minX);
  var worldH = Math.max(1, maxY - minY);
  var ppm = 1;
  var maxDim = 4096;
  if (worldW > maxDim) ppm = maxDim / worldW;
  if (worldH * ppm > maxDim) ppm = Math.min(ppm, maxDim / worldH);
  var sheet = document.createElement("canvas");
  sheet.width = Math.max(1, Math.ceil(worldW * ppm));
  sheet.height = Math.max(1, Math.ceil(worldH * ppm));
  var g = sheet.getContext("2d");
  g.setTransform(ppm, 0, 0, ppm, -minX * ppm, -minY * ppm);
  g.imageSmoothingEnabled = true;
  if ("imageSmoothingQuality" in g) g.imageSmoothingQuality = "high";
  function softDisc(inner, mid, edge) {
    var cnv = document.createElement("canvas");
    cnv.width = 256;
    cnv.height = 256;
    var gg = cnv.getContext("2d");
    var rg = gg.createRadialGradient(128, 128, 0, 128, 128, 128);
    rg.addColorStop(0, inner);
    rg.addColorStop(0.28, inner);
    rg.addColorStop(0.55, mid);
    rg.addColorStop(0.82, edge);
    rg.addColorStop(1, "rgba(255,255,255,0)");
    gg.fillStyle = rg;
    gg.fillRect(0, 0, 256, 256);
    return cnv;
  }
  var sea = softDisc("rgba(255,236,244,0.90)", "rgba(236,214,226,0.40)", "rgba(220,198,214,0.08)");
  var mist = softDisc("rgba(214,226,255,0.75)", "rgba(196,214,244,0.32)", "rgba(186,204,236,0.06)");
  var dusk = softDisc("rgba(255,214,196,0.70)", "rgba(244,186,170,0.28)", "rgba(232,170,160,0.05)");
  function layer(blob, x, y, rx, ry, alpha) {
    g.save();
    g.globalAlpha = alpha;
    g.drawImage(blob, x - rx, y - ry, rx * 2, ry * 2);
    g.restore();
  }
  for (i = 0; i < clouds.length; i++) {
    c = clouds[i];
    var top = c.kind === "dusk" ? dusk : (c.kind === "mist" ? mist : sea);
    layer(mist, c.x, c.y + c.s * 0.05, c.s * 1.85, c.s * 0.78, 0.55);
    layer(sea, c.x - c.s * 0.18, c.y - c.s * 0.06, c.s * 1.2, c.s * 0.52, 0.7);
    layer(top, c.x + c.s * 0.16, c.y + c.s * 0.04, c.s * 0.72, c.s * 0.34, 0.8);
  }
  g.globalAlpha = 1;
  SF._cloudSheet = sheet;
  SF._cloudBox = { minX: minX, minY: minY };
  SF._cloudPpm = ppm;
  SF._cloudStamp = SF.cloudStamp();
};

SF.blitCloudSheet = function (ctx, sheet, ppm, srcLeft, srcTop, destLeft, destTop, vw, vh, originX, originY) {
  var srcX = (srcLeft - originX) * ppm;
  var srcY = (srcTop - originY) * ppm;
  var srcW = vw * ppm;
  var srcH = vh * ppm;
  var destX = destLeft;
  var destY = destTop;
  var destW = vw;
  var destH = vh;
  var cut;
  if (srcX < 0) {
    cut = -srcX;
    srcX = 0;
    srcW -= cut;
    destX += cut / ppm;
    destW -= cut / ppm;
  }
  if (srcY < 0) {
    cut = -srcY;
    srcY = 0;
    srcH -= cut;
    destY += cut / ppm;
    destH -= cut / ppm;
  }
  if (srcX + srcW > sheet.width) {
    cut = srcX + srcW - sheet.width;
    srcW -= cut;
    destW -= cut / ppm;
  }
  if (srcY + srcH > sheet.height) {
    cut = srcY + srcH - sheet.height;
    srcH -= cut;
    destH -= cut / ppm;
  }
  if (srcW < 1 || srcH < 1 || destW <= 0 || destH <= 0) return;
  var smooth = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = true;
  if ("imageSmoothingQuality" in ctx) ctx.imageSmoothingQuality = "high";
  ctx.drawImage(sheet, srcX, srcY, srcW, srcH, destX, destY, destW, destH);
  ctx.imageSmoothingEnabled = smooth;
};

SF.drawClouds = function (ctx, s) {
  if (!SF.clouds || !SF.clouds.length || !SF.blobs) return;
  if (!SF._cloudSheet || SF._cloudStamp !== SF.cloudStamp()) SF.buildCloudSheet();
  var z = SF.zoom || 1;
  var pad = 48;
  var left = s.camX - SF.viewW / (2 * z) - pad;
  var top = s.camY - SF.viewH / (2 * z) - pad;
  var vw = SF.viewW / z + pad * 2;
  var vh = SF.viewH / z + pad * 2;
  var drift = Math.sin(SF.anim * 0.07) * 18;
  var b = SF._cloudBox;
  SF.blitCloudSheet(ctx, SF._cloudSheet, SF._cloudPpm, left - s.camX * 0.12 - drift, top - s.camY * 0.12, left, top, vw, vh, b.minX, b.minY);
};

SF.buildHushLip = function () {
  var b = SF.terrainBounds();
  var minX = Math.floor(b.minX);
  var minY = Math.floor(b.minY);
  var w = Math.max(1, Math.ceil(b.maxX) - minX);
  var h = Math.max(1, Math.ceil(b.maxY) - minY);
  if (w > 4096) w = 4096;
  if (h > 4096) h = 4096;
  var sheet = document.createElement("canvas");
  sheet.width = w;
  sheet.height = h;
  var g = sheet.getContext("2d");
  g.imageSmoothingEnabled = true;
  if ("imageSmoothingQuality" in g) g.imageSmoothingQuality = "high";
  g.setTransform(1, 0, 0, 1, -minX, -minY);
  var cinder = SF.islandId === "cinderveil";
  var mist = cinder ? "rgba(255, 220, 204, 0.92)" : "rgba(255, 236, 246, 0.92)";
  var shapes = [];
  var names = Object.keys(SF.groups || {});
  var ni, list, i, sh;
  for (ni = 0; ni < names.length; ni++) {
    list = SF.groups[names[ni]] || [];
    for (i = 0; i < list.length; i++) {
      if (!SF._isTrail(list[i])) shapes.push(list[i]);
    }
  }
  function eachShape(inset, draw) {
    for (i = 0; i < shapes.length; i++) {
      sh = shapes[i];
      g.beginPath();
      if (sh.k === "r" || (sh.w != null && sh.rx == null)) {
        g.rect(sh.x + inset, sh.y + inset, Math.max(2, sh.w - inset * 2), Math.max(2, sh.h - inset * 2));
      } else {
        var rx = Math.max(4, (sh.rx || sh.r || 8) - inset);
        var ry = Math.max(4, (sh.ry || sh.r || rx) - inset);
        g.ellipse(sh.x, sh.y, rx, ry, 0, 0, Math.PI * 2);
      }
      draw();
    }
  }
  // Mist only in the void. Punch every ground shape, trails included, a few
  // pixels past its edge so inner region borders do not keep a ring.
  g.save();
  g.shadowColor = mist;
  g.shadowBlur = 18;
  g.fillStyle = mist;
  g.globalAlpha = 0.85;
  eachShape(-4, function () { g.fill(); });
  g.restore();
  g.globalCompositeOperation = "destination-out";
  g.shadowBlur = 0;
  g.globalAlpha = 1;
  g.fillStyle = "#000";
  var all = shapes;
  shapes = [];
  for (ni = 0; ni < names.length; ni++) {
    list = SF.groups[names[ni]] || [];
    for (i = 0; i < list.length; i++) shapes.push(list[i]);
  }
  eachShape(-8, function () { g.fill(); });
  shapes = all;
  g.globalCompositeOperation = "source-over";
  SF._hushLip = sheet;
  SF._hushLipBox = { minX: minX, minY: minY };
  SF._hushLipKey = SF.islandId || "";
};

SF.drawHushLip = function (ctx) {
  if (!SF.groups || !SF.WALK) return;
  var key = SF.islandId || "";
  if (!SF._hushLip || SF._hushLipKey !== key) SF.buildHushLip();
  var b = SF._hushLipBox;
  var s = SF.state;
  if (!s) return;
  var z = SF.zoom || 1;
  var pad = 40;
  var left = s.camX - SF.viewW / (2 * z) - pad;
  var top = s.camY - SF.viewH / (2 * z) - pad;
  var vw = SF.viewW / z + pad * 2;
  var vh = SF.viewH / z + pad * 2;
  SF.blitCloudSheet(ctx, SF._hushLip, 1, left, top, left, top, vw, vh, b.minX, b.minY);
};

SF.SkyLayer = {
  draw: function (ctx, w, h, s) { SF.drawSky(ctx, w, h, s); },
  clouds: function (ctx, s) { SF.drawClouds(ctx, s); },
  hush: function (ctx) { SF.drawHushLip(ctx); }
};
