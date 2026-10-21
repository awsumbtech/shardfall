"use strict";

var SF = window.SF || {};
window.SF = SF;

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

SF._terraceList = function () {
  return (SF.TERRACES && SF.TERRACES[SF.islandId]) || [];
};

SF._ellipseGap = function (t, wx, wy) {
  return SF.terraceMetrics(t, wx, wy);
};

SF._rockPixel = function (tone, t, wx, gap, block) {
  var colId = Math.floor(wx / 8);
  var h = SF._thash(colId, ((t.seed || 1) * 4) | 0);
  var depth = gap / Math.max(8, block);
  if (depth < 0) depth = 0;
  if (depth > 1) depth = 1;
  var col = SF._lerpRgb(tone.hi, tone.mid, Math.min(1, depth * 0.8));
  col = SF._lerpRgb(col, tone.lo, depth * depth * 0.8);
  if (h % 4 === 0) col = SF._lerpRgb(col, tone.lo, 0.22);
  else if (h % 4 === 1) col = SF._lerpRgb(col, tone.hi, 0.12);
  var g = gap | 0;
  if (g % 10 === 8) col = SF._lerpRgb(col, tone.lo, 0.14);
  if (g >= block - 2) col = tone.out;
  else if (g >= block - 5) col = SF._lerpRgb(col, tone.out, 0.4);
  return col;
};

SF._topColor = function (t) {
  var lv = t.level || 1;
  if (t.kind === "grass") return [72, 152, 98];
  if (SF.islandId === "cinderveil") return lv >= 2 ? [178, 156, 126] : [156, 134, 110];
  if (t.id === "scar") return [206, 172, 110];
  if (lv >= 3) return [222, 226, 140];
  if (lv >= 2) return [198, 214, 116];
  return [174, 200, 98];
};

SF._mossColor = function (t) {
  if (SF.islandId === "cinderveil") return [114, 130, 72];
  if (t.id === "scar") return [128, 142, 70];
  return [90, 152, 62];
};

SF._rockTones = function (t) {
  if (t.kind === "grass") {
    return {
      hi: [168, 206, 112],
      mid: [86, 150, 72],
      lo: [42, 96, 48],
      out: [28, 64, 34],
      step: [128, 108, 72],
      stepHi: [186, 164, 112]
    };
  }
  if (SF.islandId === "cinderveil") {
    return {
      hi: [168, 142, 118],
      mid: [118, 96, 78],
      lo: [74, 58, 46],
      out: [42, 32, 26],
      step: [132, 108, 82],
      stepHi: [176, 152, 122]
    };
  }
  if (t.id === "scar") {
    return {
      hi: [186, 140, 96],
      mid: [140, 96, 64],
      lo: [88, 58, 40],
      out: [48, 32, 24],
      step: [150, 112, 74],
      stepHi: [198, 160, 112]
    };
  }
  return {
    hi: [214, 176, 136],
    mid: [168, 120, 84],
    lo: [108, 72, 50],
    out: [62, 40, 30],
    step: [146, 112, 76],
    stepHi: [196, 164, 120]
  };
};

SF._paintElevation = function (data, mask, minX, minY, w, h) {
  var list = SF._terraceList();
  var ti, t, tone, reach, x0, y0, x1, y1, x, y, idx, pix, m, cur, col;
  var face, block, lv, top, rd, wx, wy, band, along, stepH, hang, moss, u, shadow, kind, ramp, lip, drop, above;
  var period, ax, ay, ddx, ddy, sz, reachH, fall;
  for (ti = 0; ti < list.length; ti++) {
    t = list[ti];
    tone = SF._rockTones(t);
    face = t.face || t.block || 0;
    block = t.block || 0;
    lv = t.level || 1;
    top = SF._topColor(t);
    reach = 1.48;
    shadow = 22 + lv * 6;
    ramp = t.ramp || 20;
    x0 = Math.max(0, Math.floor(t.x - t.rx * reach - 16 - minX));
    y0 = Math.max(0, Math.floor(t.y - t.ry * reach - 16 - minY));
    x1 = Math.min(w - 1, Math.ceil(t.x + t.rx * reach + 16 - minX));
    y1 = Math.min(h - 1, Math.ceil(t.y + t.ry * reach + face + shadow + 8 - minY));
    for (y = y0; y <= y1; y++) {
      for (x = x0; x <= x1; x++) {
        idx = y * w + x;
        kind = mask[idx];
        if (kind !== 1 && kind !== 3) continue;
        wx = minX + x;
        wy = minY + y;
        m = SF.terraceMetrics(t, wx, wy);
        pix = idx * 4;
        cur = [data[pix], data[pix + 1], data[pix + 2]];
        if (m.gap <= 0) {
          if (kind === 3) continue;
          col = SF._lerpRgb(cur, top, 0.1 + lv * 0.06);
          SF._writePx(data, pix, col);
          continue;
        }
        lip = SF.terraceSouthLip(t, wx);
        if (lip == null) continue;
        drop = wy - lip;
        if (drop <= 0) continue;
        if (block && drop < block && t.kind !== "grass") {
          rd = SF.routeApproach(wx, wy);
          if (rd.cross && rd.d < ramp + 8) {
            rd = rd.d;
            if (rd < ramp - 2) {
              stepH = 7;
              band = Math.floor(drop / stepH);
              along = drop - band * stepH;
              if (along < 1.4) col = tone.stepHi;
              else if (along > stepH - 1.7) col = tone.out;
              else col = band % 2 ? tone.step : SF._lerpRgb(tone.stepHi, tone.step, 0.35);
              if (rd > ramp - 6) col = SF._lerpRgb(col, tone.lo, ((rd - (ramp - 6)) / 4) * 0.55);
            } else {
              col = SF._rockPixel(tone, t, wx, drop, block);
              col = SF._lerpRgb(col, tone.out, 0.45);
              if (rd < ramp + 1.5) col = SF._lerpRgb(tone.hi, tone.stepHi, 0.55);
            }
            SF._writePx(data, pix, col);
            continue;
          }
          col = SF._rockPixel(tone, t, wx, drop, block);
          if (drop > 1 && drop < 8) {
            hang = SF._thash((wx / 8) | 0, ((t.seed || 1) * 17) | 0);
            reachH = 2 + (hang % 5);
            if (drop < reachH && hang % 3 === 0) {
              moss = SF._mossColor(t);
              col = SF._lerpRgb(col, moss, 0.55);
            }
          }
          SF._writePx(data, pix, col);
          continue;
        }
        if (!block && drop < face) {
          if (kind === 3) continue;
          u = drop / face;
          col = SF._lerpRgb(cur, [36, 90, 48], 0.18 + u * 0.35);
          SF._writePx(data, pix, col);
          continue;
        }
        var foot = block || face;
        if (drop < foot + 8) {
          u = (drop - foot) / 8;
          if (u < 0) u = 0;
          fall = (1 - u) * (1 - u);
          col = SF._lerpRgb(cur, [cur[0] * 0.55, cur[1] * 0.6, cur[2] * 0.5], 0.35 * fall);
          SF._writePx(data, pix, col);
        }
      }
    }
  }
};

SF.drawTerraceFront = function (ctx, t) {
  if (!t.block || !SF._terrain || !SF._terrainBox || !SF.terraceLipChain) return;
  var chain = SF.terraceLipChain(t);
  if (!chain || chain.length < 6) return;
  var strips = [];
  var cur = null;
  var ramp = (t.ramp || 20) + 1;
  var i, x, y, rd, st, n, p;
  for (i = 0; i < chain.length; i += 2) {
    x = chain[i];
    y = chain[i + 1];
    rd = SF.routeApproach(x, y + t.block * 0.45);
    if (rd.cross && rd.d < ramp) {
      if (cur && cur.length > 4) strips.push(cur);
      cur = null;
      continue;
    }
    if (!cur) cur = [];
    cur.push(x, y);
  }
  if (cur && cur.length > 4) strips.push(cur);
  if (!strips.length) return;
  ctx.save();
  ctx.beginPath();
  for (p = 0; p < strips.length; p++) {
    st = strips[p];
    n = st.length;
    ctx.moveTo(st[0], st[1]);
    for (i = 2; i < n; i += 2) ctx.lineTo(st[i], st[i + 1]);
    for (i = n - 2; i >= 0; i -= 2) ctx.lineTo(st[i], st[i + 1] + t.block);
    ctx.closePath();
  }
  ctx.clip();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(SF._terrain, SF._terrainBox.minX, SF._terrainBox.minY);
  ctx.restore();
};

SF.drawLands = function (ctx, s) {
  SF.paintActGround(ctx, s);
};

SF.drawGround = function () {};

SF.paintActGround = function (ctx, s) {
  if (!SF.WALK || !SF.groups) return;
  var lit = SF.lampIsLit ? SF.lampIsLit(s) : !!(s && s.flags && s.flags.lampLit);
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
  var g = sheet.getContext("2d", { willReadFrequently: true });
  var img = g.createImageData(w, h);
  var data = img.data;
  var mask = new Uint8Array(w * h);
  SF._paintField(data, mask, minX, minY, w, h, lit);
  SF._paintDetails(data, mask, minX, minY, w, h);
  SF._paintPaths(data, mask, minX, minY, w, h);
  SF._paintElevation(data, mask, minX, minY, w, h);
  g.putImageData(img, 0, 0);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(sheet, minX, minY);
  ctx.restore();
};

SF._terrainLooks = {
  meadow: {
    base: [72, 158, 78], alt: [62, 146, 70],
    tuft: [34, 112, 48], tip: [118, 190, 98],
    pebble: [142, 126, 102],
    soil: [46, 96, 50],
    cliffHi: [214, 170, 132], cliff: [176, 122, 90], cliffLo: [118, 76, 56], cliffOut: [72, 44, 34],
    path: [168, 124, 78], pathMid: [150, 112, 72], pathEdge: [134, 108, 74]
  },
  grove: {
    base: [48, 128, 82], alt: [40, 116, 74],
    tuft: [22, 86, 52], tip: [86, 158, 100],
    pebble: [86, 104, 82],
    soil: [28, 78, 50],
    cliffHi: [150, 120, 96], cliff: [114, 86, 70], cliffLo: [74, 54, 46], cliffOut: [44, 32, 28],
    path: [118, 88, 60], pathMid: [104, 80, 56], pathEdge: [90, 78, 58]
  },
  lamp: {
    base: [138, 176, 74], alt: [126, 164, 66],
    tuft: [90, 132, 44], tip: [186, 210, 112],
    pebble: [176, 154, 112],
    soil: [98, 122, 46],
    cliffHi: [226, 186, 136], cliff: [188, 144, 100], cliffLo: [126, 90, 62], cliffOut: [80, 54, 38],
    path: [186, 150, 98], pathMid: [168, 136, 90], pathEdge: [150, 128, 88]
  },
  quay: {
    base: [154, 162, 160], alt: [142, 152, 150],
    tuft: [118, 126, 124], tip: [186, 192, 188],
    pebble: [108, 118, 120],
    soil: [96, 104, 102],
    cliffHi: [168, 172, 168], cliff: [124, 130, 128], cliffLo: [82, 88, 86], cliffOut: [46, 50, 50],
    path: [120, 124, 120], pathMid: [132, 136, 132], pathEdge: [144, 150, 148],
    foam: [236, 244, 238]
  },
  ash: {
    base: [156, 134, 114], alt: [144, 122, 104],
    tuft: [96, 82, 70], tip: [184, 170, 152],
    pebble: [90, 74, 62],
    soil: [78, 64, 54],
    cliffHi: [164, 142, 122], cliff: [120, 100, 86], cliffLo: [76, 62, 52], cliffOut: [44, 36, 30],
    path: [104, 74, 50], pathMid: [122, 92, 66], pathEdge: [142, 118, 96]
  },
  grey: {
    base: [122, 118, 114], alt: [112, 108, 104],
    tuft: [84, 80, 78], tip: [158, 154, 148],
    pebble: [78, 74, 70],
    soil: [70, 66, 64],
    cliffHi: [146, 140, 132], cliff: [104, 98, 92], cliffLo: [66, 62, 58], cliffOut: [36, 34, 32],
    path: [92, 86, 78], pathMid: [74, 70, 64], pathEdge: [56, 52, 48]
  },
  charcoal: {
    base: [70, 60, 54], alt: [60, 52, 48],
    tuft: [42, 36, 32], tip: [108, 96, 86],
    pebble: [48, 40, 36],
    soil: [36, 30, 28],
    cliffHi: [102, 86, 74], cliff: [68, 56, 48], cliffLo: [42, 34, 30], cliffOut: [22, 18, 16],
    path: [78, 62, 50], pathMid: [58, 46, 38], pathEdge: [40, 32, 28]
  },
  cinder: {
    base: [196, 162, 84], alt: [184, 148, 72],
    tuft: [140, 108, 48], tip: [224, 196, 124],
    pebble: [150, 116, 72],
    soil: [120, 88, 44],
    cliffHi: [212, 162, 112], cliff: [168, 114, 74], cliffLo: [110, 70, 46], cliffOut: [68, 42, 30],
    path: [164, 120, 68], pathMid: [136, 98, 54], pathEdge: [106, 76, 44]
  },
  span: {
    base: [176, 150, 130], alt: [164, 138, 120],
    tuft: [128, 104, 90], tip: [206, 184, 164],
    pebble: [116, 96, 84],
    soil: [100, 78, 66],
    cliffHi: [186, 158, 138], cliff: [140, 110, 94], cliffLo: [90, 68, 58], cliffOut: [52, 38, 34],
    path: [148, 116, 90], pathMid: [122, 94, 74], pathEdge: [94, 72, 58]
  },
  perch: {
    base: [92, 176, 154], alt: [80, 164, 142],
    tuft: [48, 128, 114], tip: [156, 214, 196],
    pebble: [186, 168, 126],
    soil: [42, 104, 98],
    cliffHi: [198, 176, 140], cliff: [150, 122, 94], cliffLo: [96, 76, 60], cliffOut: [52, 40, 34],
    path: [190, 168, 122], pathMid: [160, 138, 98], pathEdge: [124, 104, 76],
    foam: [236, 246, 240]
  },
  scar: {
    base: [168, 132, 78], alt: [156, 120, 68],
    tuft: [120, 92, 52], tip: [206, 176, 118],
    pebble: [110, 86, 58],
    soil: [96, 70, 42],
    cliffHi: [196, 150, 104], cliff: [150, 104, 68], cliffLo: [96, 64, 42], cliffOut: [58, 38, 28],
    path: [150, 108, 64], pathMid: [126, 88, 52], pathEdge: [98, 70, 42]
  },
  ridge: {
    base: [132, 108, 92], alt: [120, 96, 82],
    tuft: [86, 70, 58], tip: [168, 146, 124],
    pebble: [78, 62, 50],
    soil: [64, 50, 42],
    cliffHi: [150, 124, 102], cliff: [108, 86, 70], cliffLo: [70, 54, 44], cliffOut: [40, 30, 26],
    path: [96, 70, 50], pathMid: [78, 58, 42], pathEdge: [58, 44, 34]
  }
};

SF._regionById = {
  meadow: "meadow", wake: "meadow", "wake-path": "meadow", cottage: "meadow", dock: "meadow", west: "meadow",
  grove: "grove", hollow: "grove",
  hill: "lamp",
  scar: "scar",
  cinder: "cinder", ledge: "cinder", hookledge: "span",
  perch: "perch", rope: "perch",
  span: "span", gap: "span", lip: "span",
  ash: "ash", nook: "ash", nw: "ash", cliff: "ash", "ash-link": "ash",
  quay: "quay", pier: "quay",
  vault: "grey", vledge: "grey",
  maw: "charcoal",
  ridge: "ridge", rubble: "ridge", down: "ridge"
};

SF._regionByGroup = {
  ember: "meadow", perch: "perch", cinder: "cinder", span: "span",
  quay: "quay", ash: "ash", vault: "grey", ridge: "ridge", scar: "scar"
};

SF._regionOf = function (sh) {
  if (sh.id && SF._regionById[sh.id]) return SF._regionById[sh.id];
  return SF._regionByGroup[sh.group] || "meadow";
};

SF._lookOf = function (sh) {
  return SF._terrainLooks[SF._regionOf(sh)] || SF._terrainLooks.meadow;
};

SF._thash = function (x, y) {
  var n = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return (n ^ (n >>> 16)) >>> 0;
};

SF._writePx = function (data, pix, color) {
  data[pix] = color[0] + 0.5 | 0;
  data[pix + 1] = color[1] + 0.5 | 0;
  data[pix + 2] = color[2] + 0.5 | 0;
  data[pix + 3] = 255;
};

SF._lerpRgb = function (a, b, t) {
  if (t <= 0) return a;
  if (t >= 1) return b;
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t
  ];
};

SF._shapeMetrics = function (sh, wx, wy) {
  var dx, dy, dist, rx, ry, rDir, gap, deep, half, qx, qy, cx, cy;
  if (sh.k === "r" || (sh.w != null && sh.rx == null)) {
    cx = sh.x + sh.w / 2;
    cy = sh.y + sh.h / 2;
    if (wx >= sh.x && wx <= sh.x + sh.w && wy >= sh.y && wy <= sh.y + sh.h) {
      deep = Math.min(wx - sh.x, sh.x + sh.w - wx, wy - sh.y, sh.y + sh.h - wy);
      half = Math.max(8, Math.min(sh.w, sh.h) / 2);
      dist = Math.hypot(wx - cx, wy - cy) || 1;
      return { gap: -deep, deep: deep, depth: deep / half, ny: (wy - cy) / dist };
    }
    qx = Math.max(sh.x, Math.min(wx, sh.x + sh.w));
    qy = Math.max(sh.y, Math.min(wy, sh.y + sh.h));
    dx = wx - qx;
    dy = wy - qy;
    gap = Math.hypot(dx, dy) || 0.001;
    dist = Math.hypot(wx - cx, wy - cy) || 1;
    return { gap: gap, deep: 0, depth: 0, ny: (wy - cy) / dist };
  }
  rx = sh.rx || sh.r || 8;
  ry = sh.ry || sh.r || rx;
  dx = wx - sh.x;
  dy = wy - sh.y;
  dist = Math.hypot(dx, dy) || 0.001;
  rDir = (rx * ry) / (Math.hypot(ry * dx / dist, rx * dy / dist) || 0.001);
  gap = dist - rDir;
  if (gap <= 0) {
    deep = -gap;
    return { gap: gap, deep: deep, depth: deep / rDir, ny: dy / dist };
  }
  return { gap: gap, deep: 0, depth: 0, ny: dy / dist };
};

SF._isTrail = function (sh) {
  return !!(sh.id && String(sh.id).indexOf("trail-") === 0);
};

SF._mixAmount = function (best, second) {
  if (!best || !second) return 0;
  var diff = best.depth - second.depth;
  var band = 0.42;
  if (diff >= band) return 0;
  var u = (1 - diff / band) * 0.5;
  if (u < 0.08) return 0;
  if (u < 0.18) return 0.16;
  if (u < 0.28) return 0.28;
  if (u < 0.4) return 0.4;
  return 0.5;
};

SF._cliffReach = function (ny) {
  return 4 + Math.max(0, ny) * 22;
};

SF._paintField = function (data, mask, minX, minY, w, h, lit) {
  var shapes = [];
  var names = Object.keys(SF.groups || {});
  var ni, list, i;
  for (ni = 0; ni < names.length; ni++) {
    list = SF.groups[names[ni]] || [];
    for (i = 0; i < list.length; i++) shapes.push(list[i]);
  }
  var n = shapes.length;
  var looks = new Array(n);
  var regions = new Array(n);
  var trails = new Array(n);
  var foams = new Array(n);
  var boxes = new Array(n);
  for (i = 0; i < n; i++) {
    regions[i] = SF._regionOf(shapes[i]);
    looks[i] = SF._terrainLooks[regions[i]] || SF._terrainLooks.meadow;
    trails[i] = SF._isTrail(shapes[i]);
    foams[i] = looks[i].foam || null;
    if (shapes[i].k === "r" || (shapes[i].w != null && shapes[i].rx == null)) {
      boxes[i] = {
        x0: shapes[i].x - 4,
        y0: shapes[i].y - 4,
        x1: shapes[i].x + shapes[i].w + 4,
        y1: shapes[i].y + shapes[i].h + 24
      };
    } else {
      var rx = shapes[i].rx || shapes[i].r || 8;
      var ry = shapes[i].ry || shapes[i].r || rx;
      boxes[i] = {
        x0: shapes[i].x - rx - 4,
        y0: shapes[i].y - ry - 4,
        x1: shapes[i].x + rx + 4,
        y1: shapes[i].y + ry + 24
      };
    }
  }
  var CELL = 64;
  var cells = new Map();
  var ci, box, cx0, cy0, cx1, cy1, cx, cy, key, bucket;
  for (ci = 0; ci < n; ci++) {
    box = boxes[ci];
    cx0 = Math.floor((box.x0 - 24) / CELL);
    cy0 = Math.floor((box.y0 - 8) / CELL);
    cx1 = Math.floor((box.x1 + 24) / CELL);
    cy1 = Math.floor((box.y1 + 8) / CELL);
    for (cy = cy0; cy <= cy1; cy++) {
      for (cx = cx0; cx <= cx1; cx++) {
        key = cx + "," + cy;
        bucket = cells.get(key);
        if (!bucket) {
          bucket = [];
          cells.set(key, bucket);
        }
        bucket.push(ci);
      }
    }
  }
  var y, x, wx, wy, m, gap, reach, score, pix, best, second, trailBest, cliff, hit;
  var color, mix, cell;
  for (y = 0; y < h; y++) {
    wy = minY + y;
    cy = Math.floor(wy / CELL);
    for (x = 0; x < w; x++) {
      wx = minX + x;
      bucket = cells.get(Math.floor(wx / CELL) + "," + cy);
      if (!bucket) continue;
      best = null;
      second = null;
      trailBest = null;
      cliff = null;
      for (i = 0; i < bucket.length; i++) {
        ci = bucket[i];
        box = boxes[ci];
        if (wx < box.x0 || wx > box.x1 || wy < box.y0 || wy > box.y1 + 2) continue;
        m = SF._shapeMetrics(shapes[ci], wx, wy);
        if (m.gap <= 0) {
          hit = { i: ci, depth: m.depth, deep: m.deep, ny: m.ny, gap: m.gap };
          if (trails[ci]) {
            if (!trailBest || hit.depth > trailBest.depth) trailBest = hit;
          } else if (!best || hit.depth > best.depth) {
            second = best;
            best = hit;
          } else if (!second || hit.depth > second.depth) second = hit;
        } else if (!trails[ci]) {
          reach = SF._cliffReach(m.ny);
          if (m.gap < reach) {
            score = reach - m.gap;
            if (!cliff || score > cliff.score) cliff = { score: score, i: ci, ny: m.ny, gap: m.gap, reach: reach };
          }
        }
      }
      pix = (y * w + x) * 4;
      if (best) {
        color = looks[best.i].base;
        mix = 0;
        if (second && regions[second.i] !== regions[best.i]) {
          mix = SF._mixAmount(best, second);
          if (mix > 0) color = SF._lerpRgb(color, looks[second.i].base, mix);
        }
        if (mix === 0) {
          cell = SF._thash(wx >> 4, wy >> 4);
          if (cell % 8 === 0) color = looks[best.i].alt;
        }
        if (shapes[best.i].id === "hollow") color = SF._lerpRgb(color, [104, 90, 146], 0.16);
        if (lit && SF.LAMP) {
          var ld = Math.hypot(wx - SF.LAMP.x, wy - SF.LAMP.y);
          if (ld < 220) color = SF._lerpRgb(color, [228, 204, 146], (1 - ld / 220) * (1 - ld / 220) * 0.14);
        }
        if (best.deep < 2.6 && (!second || second.deep < 2)) {
          color = best.deep < 1.15 ? looks[best.i].soil : SF._lerpRgb(color, looks[best.i].soil, best.ny > 0.1 ? 0.45 : 0.2);
        }
        SF._writePx(data, pix, color);
        mask[y * w + x] = 1;
      } else if (trailBest) {
        color = looks[trailBest.i].base;
        if (trailBest.deep < 2.2) color = SF._lerpRgb(color, looks[trailBest.i].soil, 0.55);
        SF._writePx(data, pix, color);
        mask[y * w + x] = 1;
      } else if (cliff) {
        var look = looks[cliff.i];
        var t = cliff.gap / cliff.reach;
        var col;
        if (t > 0.82) col = look.cliffOut;
        else if (cliff.ny <= 0.2) col = cliff.gap < 1.2 ? look.soil : look.cliffOut;
        else if (foams[cliff.i] && cliff.ny > 0.45 && t > 0.55 && t < 0.86 && (((wx >> 1) + (wy >> 2)) % 3 === 0)) col = foams[cliff.i];
        else if (t < 0.22) col = look.cliffHi;
        else if (t > 0.62) col = look.cliffLo;
        else if ((Math.floor(cliff.gap) % 5) === 4) col = look.cliffLo;
        else col = look.cliff;
        SF._writePx(data, pix, col);
        mask[y * w + x] = 2;
      }
    }
  }
};

SF._paintDetails = function (data, mask, minX, minY, w, h) {
  var shapes = [];
  var names = Object.keys(SF.groups || {});
  var ni, list, i;
  for (ni = 0; ni < names.length; ni++) {
    list = SF.groups[names[ni]] || [];
    for (i = 0; i < list.length; i++) if (!SF._isTrail(list[i])) shapes.push(list[i]);
  }
  var x0 = minX >> 4;
  var y0 = minY >> 4;
  var x1 = (minX + w) >> 4;
  var y1 = (minY + h) >> 4;
  var cx, cy, hsh, wx, wy, idx, look, k, pix;
  for (cy = y0; cy <= y1; cy++) {
    for (cx = x0; cx <= x1; cx++) {
      hsh = SF._thash(cx, cy);
      if (hsh % 7 !== 0) continue;
      wx = (cx << 4) + 4 + (hsh % 5);
      wy = (cy << 4) + 6 + ((hsh >> 3) % 6);
      if (wx < minX || wy < minY || wx >= minX + w || wy >= minY + h) continue;
      idx = (wy - minY) * w + (wx - minX);
      if (mask[idx] !== 1) continue;
      look = null;
      for (i = 0; i < shapes.length; i++) {
        if (SF._shapeMetrics(shapes[i], wx, wy).gap <= 0) {
          look = SF._lookOf(shapes[i]);
          break;
        }
      }
      if (!look) continue;
      pix = idx * 4;
      if ((hsh >> 8) % 3 === 0) {
        SF._writePx(data, pix, look.pebble);
        if (wx + 1 < minX + w && mask[idx + 1] === 1) SF._writePx(data, pix + 4, look.pebble);
      } else {
        SF._writePx(data, pix, look.tip);
        k = idx + w;
        if (wy + 1 < minY + h && mask[k] === 1) SF._writePx(data, k * 4, look.tuft);
        if (wy + 2 < minY + h && mask[k + w] === 1) SF._writePx(data, (k + w) * 4, look.tuft);
      }
    }
  }
};

SF._pathColors = function (wx, wy) {
  var shapes = (SF.WALK.circles || []).concat(SF.WALK.rects || []);
  var best = null;
  var second = null;
  var i, m, hit, sh;
  for (i = 0; i < shapes.length; i++) {
    sh = shapes[i];
    if (SF._isTrail(sh)) continue;
    m = SF._shapeMetrics(sh, wx, wy);
    if (m.gap > 0) continue;
    hit = { i: i, depth: m.depth };
    if (!best || hit.depth > best.depth) {
      second = best;
      best = hit;
    } else if (!second || hit.depth > second.depth) second = hit;
  }
  if (!best) {
    for (i = 0; i < shapes.length; i++) {
      if (!SF._isTrail(shapes[i])) continue;
      m = SF._shapeMetrics(shapes[i], wx, wy);
      if (m.gap <= 0) return SF._lookOf(shapes[i]);
    }
    return null;
  }
  var a = SF._lookOf(shapes[best.i]);
  if (!second || SF._regionOf(shapes[second.i]) === SF._regionOf(shapes[best.i])) return a;
  var mix = SF._mixAmount(best, second);
  if (mix <= 0) return a;
  var b = SF._lookOf(shapes[second.i]);
  return {
    path: SF._lerpRgb(a.path, b.path, mix),
    pathMid: SF._lerpRgb(a.pathMid, b.pathMid, mix),
    pathEdge: SF._lerpRgb(a.pathEdge, b.pathEdge, mix),
    pebble: SF._lerpRgb(a.pebble, b.pebble, mix)
  };
};

SF._stampPath = function (wx, wy, radius, colors, mask, data, minX, minY, w, h) {
  var x0 = Math.floor(wx - radius - 2);
  var y0 = Math.floor(wy - radius - 2);
  var x1 = Math.ceil(wx + radius + 2);
  var y1 = Math.ceil(wy + radius + 2);
  var x, y, dx, dy, d, lim, idx, bite, col;
  for (y = y0; y <= y1; y++) {
    for (x = x0; x <= x1; x++) {
      if (x < minX || y < minY || x >= minX + w || y >= minY + h) continue;
      idx = (y - minY) * w + (x - minX);
      if (mask[idx] !== 1 && mask[idx] !== 3) continue;
      dx = x - wx;
      dy = y - wy;
      d = Math.hypot(dx, dy);
      bite = SF._thash(x >> 1, y >> 1);
      lim = radius + ((bite % 3) - 1) * 0.45;
      if (d > lim + 1.6) continue;
      if (d > lim) {
        if (bite % 4 === 0) continue;
        col = colors.pathEdge;
      } else if (d > lim * 0.72) col = colors.pathMid;
      else col = colors.path;
      SF._writePx(data, idx * 4, col);
      mask[idx] = 3;
    }
  }
};

SF._pullWalkable = function (sx, sy, px, py) {
  if (!SF.walkable || SF.walkable(px, py)) return { x: px, y: py };
  var lo = 0;
  var hi = 1;
  var t, ax, ay, i;
  for (i = 0; i < 8; i++) {
    t = (lo + hi) * 0.5;
    ax = sx + (px - sx) * t;
    ay = sy + (py - sy) * t;
    if (SF.walkable(ax, ay)) lo = t;
    else hi = t;
  }
  return { x: sx + (px - sx) * lo, y: sy + (py - sy) * lo };
};

SF._meander = function (path) {
  var pts = [];
  var i, x0, y0, x1, y1, len, steps, s, along, nx, ny, amp, weave, phase, px, py, waves, pulled;
  for (i = 0; i < path.length - 2; i += 2) {
    x0 = path[i];
    y0 = path[i + 1];
    x1 = path[i + 2];
    y1 = path[i + 3];
    len = Math.hypot(x1 - x0, y1 - y0) || 1;
    steps = Math.max(2, Math.round(len / 5));
    nx = -(y1 - y0) / len;
    ny = (x1 - x0) / len;
    phase = (SF._thash(x0 | 0, y0 | 0) & 1) ? 1 : -1;
    waves = len > 96 ? 2 : 1;
    amp = Math.min(28, Math.max(8, len * 0.16));
    if (len < 72) amp = Math.min(amp, Math.max(4, len * 0.1));
    for (s = 0; s <= steps; s++) {
      if (i > 0 && s === 0) continue;
      along = s / steps;
      weave = phase * Math.sin(along * Math.PI * waves);
      px = x0 + (x1 - x0) * along + nx * weave * amp;
      py = y0 + (y1 - y0) * along + ny * weave * amp;
      pulled = SF._pullWalkable(x0 + (x1 - x0) * along, y0 + (y1 - y0) * along, px, py);
      pts.push(pulled.x, pulled.y);
    }
  }
  return pts;
};

SF._paintPaths = function (data, mask, minX, minY, w, h) {
  var paths = SF.PATHS || [];
  if (!paths.length) return;
  var joints = [];
  var pi, path, i, raw, used, a, b, cluster, count, weight;
  for (pi = 0; pi < paths.length; pi++) {
    path = paths[pi];
    for (i = 0; i < path.length; i += 2) {
      weight = (i > 0 && i < path.length - 2) ? 2 : 1;
      joints.push({ x: path[i], y: path[i + 1], n: weight });
    }
  }
  used = [];
  for (a = 0; a < joints.length; a++) {
    if (used[a]) continue;
    cluster = { x: joints[a].x, y: joints[a].y, n: joints[a].n };
    count = 1;
    used[a] = 1;
    for (b = a + 1; b < joints.length; b++) {
      if (used[b]) continue;
      if (Math.hypot(joints[b].x - joints[a].x, joints[b].y - joints[a].y) < 36) {
        used[b] = 1;
        cluster.x += joints[b].x;
        cluster.y += joints[b].y;
        cluster.n += joints[b].n;
        count++;
      }
    }
    cluster.x /= count;
    cluster.y /= count;
    if (cluster.n < 2 && count < 2) continue;
    var look = SF._pathColors(cluster.x, cluster.y);
    if (!look) continue;
    var blob = 11 + Math.min(5, cluster.n);
    var phase = (SF._thash(cluster.x | 0, cluster.y | 0) % 628) / 100;
    var steps = 8;
    var s, ang, rad, px, py;
    for (s = 0; s < steps; s++) {
      ang = (s / steps) * Math.PI * 2;
      rad = blob * (0.8 + 0.2 * Math.sin(ang * 3 + phase));
      px = cluster.x + Math.cos(ang) * rad * 0.4;
      py = cluster.y + Math.sin(ang) * rad * 0.4;
      SF._stampPath(px, py, rad * 0.7, look, mask, data, minX, minY, w, h);
    }
  }
  for (pi = 0; pi < paths.length; pi++) {
    raw = SF._meander(paths[pi]);
    if (raw.length < 4) continue;
    var dist = 0;
    var phase2 = (SF._thash(raw[0] | 0, raw[1] | 0) % 500) / 80;
    var x0, y0, x1, y1, len, steps2, t, px2, py2, width, cols;
    for (i = 0; i < raw.length - 2; i += 2) {
      x0 = raw[i];
      y0 = raw[i + 1];
      x1 = raw[i + 2];
      y1 = raw[i + 3];
      len = Math.hypot(x1 - x0, y1 - y0) || 1;
      steps2 = Math.max(1, Math.ceil(len / 2));
      for (t = 0; t <= steps2; t++) {
        px2 = x0 + (x1 - x0) * (t / steps2);
        py2 = y0 + (y1 - y0) * (t / steps2);
        width = 8.4 + Math.sin(dist * 0.06 + phase2) * 1.4;
        cols = SF._pathColors(px2, py2);
        if (cols) SF._stampPath(px2, py2, width, cols, mask, data, minX, minY, w, h);
        dist += len / steps2;
      }
    }
  }
};

SF.terrainKey = function (lit) {
  return (SF.islandId || "emberhold") + ":" + (lit ? "1" : "0") + ":" + SF.WALK.circles.length + ":" + (SF.specks ? SF.specks.length : 0) + ":" + SF.WALK.rects.length;
};

SF.terrainBounds = function () {
  var minX = Infinity;
  var minY = Infinity;
  var maxX = -Infinity;
  var maxY = -Infinity;
  function add(x, y) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  var i, c, r, circles, rects;
  circles = SF.WALK.circles;
  for (i = 0; i < circles.length; i++) {
    c = circles[i];
    var f = SF.foot(c);
    add(f.x - f.rx * 1.2 - 8, f.y - f.ry - 16);
    add(f.x + f.rx * 1.2 + 8, f.y + f.ry * 1.3 + 24);
  }
  rects = SF.WALK.rects;
  for (i = 0; i < rects.length; i++) {
    r = rects[i];
    add(r.x - 16, r.y - 16);
    add(r.x + r.w + 16, r.y + r.h + 16);
  }
  if (SF.LAMP) {
    add(SF.LAMP.x - 360, SF.LAMP.y - 360);
    add(SF.LAMP.x + 360, SF.LAMP.y + 360);
  }
  return { minX: minX, minY: minY, maxX: maxX, maxY: maxY };
};

SF.buildTerrainSheet = function (lit) {
  var b = SF.terrainBounds();
  var worldW = Math.max(1, b.maxX - b.minX);
  var worldH = Math.max(1, b.maxY - b.minY);
  var ppm = 1;
  var maxDim = 4096;
  if (worldW * ppm > maxDim || worldH * ppm > maxDim) ppm = 1;
  var sheet = document.createElement("canvas");
  sheet.width = Math.max(1, Math.ceil(worldW * ppm));
  sheet.height = Math.max(1, Math.ceil(worldH * ppm));
  var bctx = sheet.getContext("2d");
  bctx.imageSmoothingEnabled = false;
  bctx.setTransform(ppm, 0, 0, ppm, -b.minX * ppm, -b.minY * ppm);
  SF._landGrad = {};
  SF._baking = true;
  var fake = { flags: { lampLit: !!lit, cinderLit: SF.islandId === "cinderveil" && !!lit } };
  Object.keys(SF.groups || {}).forEach(function (name) {
    (SF.groups[name] || []).forEach(function (c) {
      if (c.id && String(c.id).indexOf("trail-") === 0) return;
      var f = SF.foot(c);
      bctx.drawImage(SF.blobs.shadow, f.x - f.rx * 1.15, f.y - f.ry * 0.45 + 22, f.rx * 2.3, f.ry * 1.35);
    });
  });
  SF.drawLands(bctx, fake);
  SF.drawBridge(bctx);
  SF.drawGround(bctx, fake);
  SF._baking = false;
  SF._terrain = sheet;
  SF._terrainBox = b;
  SF._terrainPpm = ppm;
  SF._terrainKey = SF.terrainKey(lit);
};

SF.drawTerrain = function (ctx, s) {
  if (!SF.groups || !SF.specks || !SF.blobs || !SF.WALK) return;
  var lit = SF.lampIsLit ? SF.lampIsLit(s) : !!(s.flags && s.flags.lampLit);
  var key = SF.terrainKey(lit);
  if (!SF._terrain || SF._terrainKey !== key) SF.buildTerrainSheet(lit);
  var sheet = SF._terrain;
  var b = SF._terrainBox;
  var ppm = SF._terrainPpm;
  var z = SF.zoom || 1;
  var pad = 8;
  var left = s.camX - SF.viewW / (2 * z) - pad;
  var top = s.camY - SF.viewH / (2 * z) - pad;
  var vw = SF.viewW / z + pad * 2;
  var vh = SF.viewH / z + pad * 2;
  SF.blitSheet(ctx, sheet, ppm, left, top, left, top, vw, vh, b.minX, b.minY);
};

SF.blitSheet = function (ctx, sheet, ppm, srcLeft, srcTop, destLeft, destTop, vw, vh, originX, originY) {
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
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(sheet, Math.round(srcX), Math.round(srcY), Math.round(srcW), Math.round(srcH), destX, destY, destW, destH);
  ctx.imageSmoothingEnabled = smooth;
};

SF.drawBridge = function (ctx) {
  var rects = SF.WALK.rects || [];
  if (!window.Art) return;
  var i, br, img;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  for (i = 0; i < rects.length; i++) {
    br = rects[i];
    img = null;
    if (br.id === "rope" && Art.ropeBridge) img = Art.ropeBridge(br.w, br.h);
    else if (br.id === "pier" && Art.dockDeck) img = Art.dockDeck(br.w, br.h);
    if (img) ctx.drawImage(img, br.x, br.y, br.w, br.h);
  }
  ctx.restore();
};

SF.drawPropArt = function (ctx, prop, lit) {
  if (!window.Art || !Art.sprite) return false;
  var id = prop.kind;
  var scale = 2;
  if (id === "airship") id = "skiff";
  else if (id === "cottage" && SF.islandId === "cinderveil") id = "workshop";
  else if (id === "stake") id = lit ? "lamp_lit" : "lamp_cold";
  else if (id === "flower") {
    var c = prop.c || "";
    id = (c.indexOf("9af") !== -1 || c.indexOf("c8be") !== -1) ? "flower_tide" : (c.indexOf("ffb") !== -1 || c.indexOf("ffe") !== -1 || c.indexOf("e7a") !== -1 ? "flower_gold" : ((c.indexOf("c6b6") !== -1 || c.indexOf("d8c6") !== -1) ? "blossom" : "flower"));
  } else if (Art.fieldProp) {
    id = Art.fieldProp(prop, SF.islandId);
    if (!id) return true;
  } else if (id === "tree" && (SF.islandId === "cinderveil")) id = "tree_dead";
  else if (id === "bush" && (SF.islandId === "cinderveil")) id = "bush_dead";
  else if (id === "rock" && (SF.islandId === "cinderveil")) id = "basalt";
  else if (id === "tuft" && (SF.islandId === "cinderveil")) id = "tuft_dead";
  if (!Art._makers[id]) return false;
  var sc = Art.fieldScale ? Art.fieldScale(id) : 1;
  Art.sprite(ctx, id, prop.x, prop.y, { scale: sc, frame: 0, facing: "down" });
  if (prop.kind === "cottage") {
    var t = SF.reduceMotion ? 0.35 : (SF.anim || 0);
    var sx = prop.x + 30;
    var sy = prop.y - 86;
    var i, puff;
    ctx.save();
    for (i = 0; i < 3; i++) {
      puff = (t * 0.28 + i * 0.34) % 1;
      ctx.globalAlpha = (1 - puff) * 0.42;
      ctx.fillStyle = "#ddd4cc";
      ctx.beginPath();
      ctx.arc(sx + Math.sin(t * 0.7 + i) * 1.5, sy - puff * 16, 1.6 + puff * 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  return true;
};

SF.drawProp = function (ctx, prop, lit) {
  if (SF.drawPropArt(ctx, prop, lit)) return;
  var x = prop.x;
  var y = prop.y;
  var s = prop.s || 1;
  ctx.save();
  ctx.translate(x, y);
  if (prop.kind === "tree") {
    ctx.fillStyle = "rgba(40,20,40,0.2)";
    ctx.beginPath();
    ctx.ellipse(0, 6, 12 * s, 5 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#6b4030";
    ctx.fillRect(-2.5 * s, -2, 5 * s, 12 * s);
    ctx.fillStyle = "#2f8f55";
    ctx.beginPath();
    ctx.arc(0, -6 * s, 13 * s, 0, Math.PI * 2);
    ctx.arc(-8 * s, -1 * s, 9 * s, 0, Math.PI * 2);
    ctx.arc(8 * s, -2 * s, 8 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(210,255,180,0.35)";
    ctx.beginPath();
    ctx.arc(-3 * s, -10 * s, 5 * s, 0, Math.PI * 2);
    ctx.fill();
  } else if (prop.kind === "rock") {
    ctx.fillStyle = "#8d7368";
    ctx.beginPath();
    ctx.ellipse(0, 0, 11 * s, 7 * s, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#cbb6aa";
    ctx.beginPath();
    ctx.ellipse(-2 * s, -2 * s, 5 * s, 3 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (prop.kind === "flower") {
    ctx.fillStyle = prop.c || "#ffd0e8";
    var i;
    for (i = 0; i < 5; i++) {
      var a = i / 5 * Math.PI * 2 + SF.anim * 0.2;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 3, Math.sin(a) * 3, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#fff4c8";
    ctx.beginPath();
    ctx.arc(0, 0, 1.6, 0, Math.PI * 2);
    ctx.fill();
  } else if (prop.kind === "cottage") {
    ctx.fillStyle = "rgba(40,20,40,0.2)";
    ctx.beginPath();
    ctx.ellipse(0, 16, 26, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#c46a55";
    ctx.beginPath();
    ctx.arc(0, 4, 20, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = "#f2d2b0";
    ctx.fillRect(-16, 4, 32, 16);
    ctx.fillStyle = "#6b3a32";
    ctx.fillRect(-4, 8, 8, 12);
    ctx.fillStyle = lit ? "#ffe08a" : "#8aa0c8";
    ctx.fillRect(-12, 8, 6, 6);
    ctx.fillRect(6, 8, 6, 6);
    ctx.fillStyle = "#8d5344";
    ctx.fillRect(10, -8, 4, 10);
  } else if (prop.kind === "airship") {
    ctx.fillStyle = "rgba(40,20,40,0.2)";
    ctx.beginPath();
    ctx.ellipse(0, 18, 34, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#8a5a3c";
    ctx.beginPath();
    ctx.ellipse(0, 8, 30, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#6b3e2c";
    ctx.fillRect(-8, -2, 16, 10);
    ctx.strokeStyle = "#3d2a24";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.lineTo(0, -18);
    ctx.stroke();
    var sail = ctx.createLinearGradient(0, -20, 18, 6);
    sail.addColorStop(0, "#d9fbff");
    sail.addColorStop(1, "#f0c24b");
    ctx.fillStyle = sail;
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(22, 4);
    ctx.lineTo(0, 4);
    ctx.fill();
    ctx.fillStyle = "#f0c24b";
    ctx.fillRect(16, -22, 2, 8);
  } else if (prop.kind === "stones") {
    ctx.rotate(prop.face || -0.4);
    ctx.fillStyle = "#d9cfc4";
    ctx.fillRect(-16, -14, 6, 22);
    ctx.fillRect(-2, -20, 7, 28);
    ctx.fillRect(12, -12, 5, 20);
    ctx.fillStyle = "#fffaf4";
    ctx.fillRect(-15, -14, 2, 8);
  } else if (prop.kind === "ruin") {
    ctx.fillStyle = "#b08978";
    ctx.fillRect(-16, -6, 10, 16);
    ctx.fillRect(-4, -12, 8, 22);
    ctx.fillRect(8, -4, 9, 14);
  } else if (prop.kind === "plank") {
    ctx.rotate(prop.rot || 0);
    ctx.fillStyle = "#a56b45";
    ctx.fillRect(-12, -3, 24, 6);
  } else if (prop.kind === "stake") {
    ctx.strokeStyle = "#6b4030";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.lineTo(0, -8);
    ctx.stroke();
    if (lit) {
      ctx.drawImage(SF.blobs.gold, -10, -22, 20, 20);
      ctx.fillStyle = "#fff6d0";
      ctx.beginPath();
      ctx.arc(0, -12, 2.4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = "#9aa4c0";
      ctx.beginPath();
      ctx.arc(0, -12, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (SF.drawWorldProp) {
    SF.drawWorldProp(ctx, prop, lit);
  }
  ctx.restore();
};

SF.drawShadow = function (ctx, x, y, rx, drop) {
  ctx.save();
  ctx.fillStyle = "rgba(30, 16, 40, 0.28)";
  ctx.beginPath();
  ctx.ellipse(x, y + (drop == null ? 8 : drop), rx, rx * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

SF.artFacing = function (fx, fy) {
  fx = fx || 0;
  fy = fy || 0;
  if (Math.abs(fx) >= Math.abs(fy)) return fx < 0 ? "left" : "right";
  return fy < 0 ? "up" : "down";
};

SF.artFrame = function (moving, phase) {
  if (!moving) return 0;
  var speed = (SF.calm && SF.calm()) ? 5 : 8;
  return Math.floor((SF.anim + (phase || 0)) * speed) % 4;
};

SF.drawActor = function (ctx, id, x, y, fx, fy, moving, alpha, phase) {
  if (!window.Art || !Art.sprite) return false;
  var calm = SF.calm && SF.calm();
  var cast = Art.fieldCast && Art.fieldCast[id];
  var pose = "walk";
  var frame = SF.artFrame(moving, phase);
  if (cast && !moving) {
    pose = "stand";
    frame = calm ? 0 : Math.floor((SF.anim + (phase || 0)) * 2) % 2;
  }
  ctx.save();
  ctx.globalAlpha = alpha == null ? 1 : alpha;
  Art.sprite(ctx, id, x, y, {
    facing: SF.artFacing(fx, fy),
    frame: frame,
    pose: pose,
    scale: Art.fieldScale(id)
  });
  ctx.restore();
  return true;
};

SF.drawWayfarer = function (ctx, x, y, fx, fy, alpha, shardstep) {
  var moving = false;
  var p = SF.state && SF.state.player;
  if (p && Math.abs(p.x - x) < 0.01 && Math.abs(p.y - y) < 0.01) {
    moving = Math.hypot(p.x - p.px, p.y - p.py) > 0.2 || p.dashT > 0;
  }
  if (SF.drawActor(ctx, "wayfarer", x, y, fx, fy, moving, alpha, shardstep ? 1 : 0)) return;
  var ang = Math.atan2(fy, fx);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#24357a";
  ctx.beginPath();
  ctx.ellipse(0, 2, 7, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

SF.drawNpc = function (ctx, id, x, y, fx, fy) {
  var moving = false;
  if (SF.drawActor(ctx, id, x, y, fx, fy, moving, 1, 0)) return;
};

SF.drawMaren = function (ctx, x, y) {
  var s = SF.state;
  var fx = s && s.player ? s.player.x - x : 0;
  var fy = s && s.player ? s.player.y - y : 1;
  if (SF.drawActor(ctx, "maren", x, y, fx, fy, false, 1, 0.2)) return;
  var bob = Math.sin(SF.anim * 2) * 1.2;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.fillStyle = "#7a3148";
  ctx.beginPath();
  ctx.ellipse(0, 4, 10, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f0c2a4";
  ctx.beginPath();
  ctx.arc(0, -8, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e4e8f0";
  ctx.beginPath();
  ctx.arc(0, -11, 6, Math.PI, 0);
  ctx.fill();
  ctx.strokeStyle = "#e8d2a4";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(10, 8);
  ctx.lineTo(10, -14);
  ctx.stroke();
  ctx.drawImage(SF.blobs.gold, 2, -26, 16, 16);
  ctx.fillStyle = "#ffc56a";
  ctx.beginPath();
  ctx.arc(10, -16, 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

SF.drawKestrel = function (ctx, x, y) {
  var s = SF.state;
  var fx = s && s.player ? s.player.x - x : 0;
  var fy = s && s.player ? s.player.y - y : 1;
  if (SF.drawActor(ctx, "kestrel", x, y, fx, fy, false, 1, 0.4)) return;
  var bob = Math.sin(SF.anim * 2.4 + 1) * 1.2;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.fillStyle = "#f0c24b";
  ctx.beginPath();
  ctx.moveTo(-4, 0);
  ctx.lineTo(-14, 6);
  ctx.lineTo(-2, 6);
  ctx.fill();
  ctx.fillStyle = "#176872";
  ctx.beginPath();
  ctx.ellipse(0, 4, 9, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e8b892";
  ctx.beginPath();
  ctx.arc(1, -8, 5.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#d7f6ff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(1, -8, 5.6, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();
  ctx.fillStyle = "#f2e2cf";
  ctx.fillRect(-1, -9, 5, 2);
  ctx.restore();
};

SF.drawCantor = function (ctx, x, y) {
  var s = SF.state;
  var calm = SF.calm && SF.calm();
  var fx = s && s.player ? s.player.x - x : 0;
  var fy = s && s.player ? s.player.y - y : 1;
  var bob = calm ? 0 : Math.sin(SF.anim * 1.2) * 1;
  if (SF.drawActor(ctx, "cantor", x, y + bob, fx, fy, false, 1, 0.6)) return;
  var bob = calm ? 0 : Math.sin(SF.anim * 1.4) * 3;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.drawImage(SF.blobs.gold, -16, -8, 32, 32);
  ctx.fillStyle = "#22182f";
  ctx.beginPath();
  ctx.ellipse(0, 8, 11, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e6c56a";
  ctx.fillRect(-11, 20, 22, 2);
  ctx.fillStyle = "#f4efe4";
  ctx.beginPath();
  ctx.ellipse(0, -10, 6, 7.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#2a2038";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(0, -8, 3.5, 0.2, Math.PI - 0.2);
  ctx.stroke();
  ctx.restore();
  if (calm) return;
  var i;
  for (i = 0; i < 3; i++) {
    var a = SF.anim * 0.8 + i * 2.1;
    ctx.fillStyle = "rgba(230,197,106,0.8)";
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * 16, y + bob + Math.sin(a) * 10, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
};

SF.drawTamsin = function (ctx, x, y) {
  var s = SF.state;
  var fx = s && s.player ? s.player.x - x : 0;
  var fy = s && s.player ? s.player.y - y : 1;
  if (SF.drawActor(ctx, "tamsin", x, y, fx, fy, false, 1, 0.8)) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#c4552a";
  ctx.beginPath();
  ctx.ellipse(0, 4, 9, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f0c2a4";
  ctx.beginPath();
  ctx.arc(0, -8, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#ffb15a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(11, 2, 6, 0.4, 4.2);
  ctx.stroke();
  ctx.restore();
};

SF.drawHesk = function (ctx, x, y) {
  var s = SF.state;
  var fx = s && s.player ? s.player.x - x : 0;
  var fy = s && s.player ? s.player.y - y : 1;
  if (SF.drawActor(ctx, "hesk", x, y, fx, fy, false, 1, 1)) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#6a5a78";
  ctx.beginPath();
  ctx.ellipse(0, 4, 8, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e6d2c0";
  ctx.beginPath();
  ctx.arc(0, -9, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#d8c4a0";
  ctx.fillRect(-7, -16, 14, 5);
  ctx.restore();
};

SF.drawIlsa = function (ctx, x, y) {
  var s = SF.state;
  var fx = s && s.player ? s.player.x - x : 0;
  var fy = s && s.player ? s.player.y - y : 1;
  if (SF.drawActor(ctx, "ilsa", x, y, fx, fy, false, 1, 1.2)) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#4a403c";
  ctx.beginPath();
  ctx.ellipse(0, 4, 11, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e7c2a4";
  ctx.beginPath();
  ctx.arc(0, -10, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#ffb15a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-12, 0);
  ctx.lineTo(12, -18);
  ctx.stroke();
  ctx.restore();
};

SF.KIND_SPRITE = {
  wisp: "wisp",
  brumekin: "brumekin",
  choirling: "choirling",
  ashmite: "ashling",
  sootwing: "sootwing",
  cinderbrute: "cinderhound",
  maw: "cinder_maw"
};

SF.drawEnemySprite = function (ctx, e) {
  var id = SF.KIND_SPRITE[e.kind];
  if (!id || !window.Art || !Art.sprite) return false;
  var s = SF.state;
  var fx = s && s.player ? s.player.x - e.x : (e.aimX || 0);
  var fy = s && s.player ? s.player.y - e.y : (e.aimY || 1);
  var moving = e.ai === "charge" || e.ai === "wind";
  var pose = (e.kind === "maw" && e.dormant) ? "idle" : "walk";
  var bob = 0;
  if (e.kind === "wisp" || e.kind === "choirling") {
    bob = (SF.calm && SF.calm()) ? 0 : Math.sin(SF.anim * 3 + (e.phase || 0)) * 1;
  }
  Art.sprite(ctx, id, e.x, e.y + bob, {
    facing: SF.artFacing(fx, fy),
    frame: SF.artFrame(moving || e.kind === "wisp" || e.kind === "sootwing", e.phase || 0),
    pose: pose,
    scale: Art.fieldScale(id)
  });
  return true;
};

SF.drawWisp = function (ctx, e) {
  if (SF.drawEnemySprite(ctx, e)) {
    if (e.hurt > 0) flash(ctx, e.x, e.y, e.r, e.hurt);
    return;
  }
  var wob = Math.sin(SF.anim * 6 + e.phase) * 2;
  ctx.save();
  ctx.globalAlpha = 0.85;
  ctx.drawImage(SF.blobs.violet, e.x - 22, e.y - 22 + wob, 44, 44);
  ctx.fillStyle = "rgba(186,160,255,0.65)";
  ctx.beginPath();
  ctx.arc(e.x, e.y + wob, e.r + wob * 0.2, 0, Math.PI * 2);
  ctx.arc(e.x - 6, e.y + 4 + wob, e.r * 0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f4fdff";
  ctx.beginPath();
  ctx.arc(e.x, e.y + wob, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (e.hurt > 0) flash(ctx, e.x, e.y + wob, e.r, e.hurt);
};

SF.drawBrume = function (ctx, e) {
  if (SF.drawEnemySprite(ctx, e)) {
    if (e.ai === "wind") {
      ctx.save();
      ctx.strokeStyle = "rgba(255,120,90,0.85)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r + 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    if (e.hurt > 0) flash(ctx, e.x, e.y, e.r, e.hurt);
    return;
  }
  ctx.save();
  ctx.translate(e.x, e.y);
  if (e.ai === "wind") ctx.scale(1.15, 0.82);
  ctx.drawImage(SF.blobs.gold, -26, -24, 52, 48);
  ctx.fillStyle = "#5c456e";
  ctx.beginPath();
  ctx.ellipse(0, 2, e.r + 2, e.r - 1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#3d2c4e";
  ctx.beginPath();
  ctx.moveTo(-10, -6);
  ctx.lineTo(-6, -16);
  ctx.lineTo(-2, -6);
  ctx.moveTo(4, -6);
  ctx.lineTo(8, -16);
  ctx.lineTo(12, -6);
  ctx.fill();
  ctx.fillStyle = "#ffb15a";
  ctx.beginPath();
  ctx.arc(0, 2, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (e.ai === "wind") {
    ctx.save();
    ctx.strokeStyle = "rgba(255,120,90,0.85)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r + 8 + (0.5 - e.wind) * 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  if (e.hurt > 0) flash(ctx, e.x, e.y, e.r, e.hurt);
};

SF.drawChoir = function (ctx, e) {
  if (SF.drawEnemySprite(ctx, e)) {
    if (e.ai === "wind") {
      ctx.save();
      ctx.strokeStyle = "rgba(220,190,255,0.8)";
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(e.x, e.y);
      ctx.lineTo(e.x + (e.aimX || 0) * 36, e.y + (e.aimY || 0) * 36);
      ctx.stroke();
      ctx.restore();
    }
    if (e.hurt > 0) flash(ctx, e.x, e.y, e.r, e.hurt);
    return;
  }
  var bob = Math.sin(SF.anim * 2 + e.phase) * 2;
  ctx.save();
  ctx.translate(e.x, e.y + bob);
  ctx.drawImage(SF.blobs.violet, -20, -28, 40, 48);
  ctx.fillStyle = "#3a2458";
  ctx.beginPath();
  ctx.ellipse(0, 4, 9, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f1e9dc";
  ctx.beginPath();
  ctx.ellipse(0, -10, 6, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#6a4a88";
  ctx.beginPath();
  ctx.moveTo(-4, -12);
  ctx.lineTo(4, -6);
  ctx.moveTo(4, -12);
  ctx.lineTo(-3, -7);
  ctx.stroke();
  ctx.fillStyle = "#e7c6ff";
  ctx.beginPath();
  ctx.arc(0, 2, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (e.ai === "wind") {
    ctx.save();
    ctx.strokeStyle = "rgba(220,190,255,0.8)";
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(e.x, e.y);
    ctx.lineTo(e.x + e.aimX * 36, e.y + e.aimY * 36);
    ctx.stroke();
    ctx.restore();
  }
  if (e.hurt > 0) flash(ctx, e.x, e.y + bob, 14, e.hurt);
};

function flash(ctx, x, y, r, hurt) {
  if (SF.calm && SF.calm()) return;
  var a = SF.clamp((hurt || 0) / 0.14, 0, 1) * 0.32;
  if (a < 0.04) return;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = "#ffe7a8";
  ctx.beginPath();
  ctx.arc(x, y, Math.max(4, r * 0.45), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

SF.drawHpPips = function (ctx, e) {
  if (e.hp >= e.maxHp && e.hurt <= 0) return;
  var w = 22;
  var x = e.x - w / 2;
  var y = e.y - Math.max(e.r + 12, 36);
  ctx.fillStyle = "rgba(20,10,30,0.65)";
  ctx.fillRect(x, y, w, 4);
  ctx.fillStyle = "#ff8ea3";
  ctx.fillRect(x, y, w * SF.clamp(e.hp / e.maxHp, 0, 1), 4);
};

SF.drawPickup = function (ctx, item, hiddenIcon) {
  var bob = Math.sin(SF.anim * 3 + item.x) * 3;
  var x = item.x;
  var y = item.y + bob;
  if (window.Art && Art.sprite && (item.kind === "shard" || item.kind === "cog" || item.kind === "bloom")) {
    var pid = item.kind === "cog" ? "cog" : (item.kind === "bloom" ? "blossom" : "shard");
    var bobY = (SF.calm && SF.calm()) ? 0 : Math.sin(SF.anim * 2 + item.x) * 2;
    Art.sprite(ctx, pid, x, y + bobY - bob, { scale: Art.fieldScale(pid), anchor: "center" });
    return;
  }
  if (item.kind === "cog") {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = "#ffb15a";
    ctx.fillStyle = "#c4552a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  } else if (item.kind === "shard") {
    if (!hiddenIcon) ctx.drawImage(SF.blobs.cyan, x - 16, y - 16, 32, 32);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(SF.anim * 0.8);
    ctx.fillStyle = "#e9fdff";
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(5, 0);
    ctx.lineTo(0, 7);
    ctx.lineTo(-5, 0);
    ctx.fill();
    ctx.restore();
  } else {
    ctx.drawImage(SF.blobs.rose, x - 12, y - 12, 24, 24);
    ctx.fillStyle = "#ffd0e8";
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
};

SF.revealU = function (s) {
  if (!s || !s.revealPan || !s.revealPan.dur) return null;
  return s.revealPan.t / s.revealPan.dur;
};

SF.palmAmt = function (s) {
  var u = SF.revealU(s);
  if (u == null || u < 0.04 || u > 0.32) return 0;
  if (u < 0.12) return (u - 0.04) / 0.08;
  if (u > 0.24) return (0.32 - u) / 0.08;
  return 1;
};

SF.lampFlareAmt = function (s) {
  var u = SF.revealU(s);
  if (u == null || u < 0.4 || u > 0.76) return 0;
  if (u < 0.5) return (u - 0.4) / 0.1;
  if (u > 0.66) return (0.76 - u) / 0.1;
  return 1;
};

SF.palmPoint = function (p) {
  var face = SF.artFacing ? SF.artFacing(p.fx || 0, p.fy || 1) : "down";
  if (face === "left") return { x: p.x - 13, y: p.y - 10 };
  if (face === "right") return { x: p.x + 13, y: p.y - 10 };
  if (face === "up") return { x: p.x - 7, y: p.y - 12 };
  return { x: p.x + 7, y: p.y - 11 };
};

SF.drawLampCrystal = function (ctx, lit) {
  var x = SF.LAMP.x;
  var y = SF.LAMP.y;
  var crystalY = y - ((window.Art && Art.lampCrystalDy) || 34);
  var flare = SF.lampFlareAmt ? SF.lampFlareAmt(SF.state) : 0;
  var showLit = lit || flare > 0.35;
  if (window.Art && Art.sprite) {
    if ((showLit || flare > 0) && SF.blobs) {
      ctx.save();
      ctx.globalAlpha = showLit ? 0.9 : 0.35 + flare * 0.6;
      var bloom = showLit ? 72 : 40 + flare * 36;
      ctx.drawImage(SF.blobs.gold, x - bloom / 2, crystalY - bloom / 2, bloom, bloom);
      ctx.restore();
    }
    var lampId = showLit ? "great_lamp_lit" : "great_lamp";
    if (!Art._makers[lampId]) lampId = showLit ? "lamp_lit" : "lamp_cold";
    Art.sprite(ctx, lampId, x, y + 10, { scale: Art.fieldScale(lampId) });
    if (!lit && SF.state && SF.state.shardsHeld >= SF.QUEST_SHARDS && SF.state.quest === "gather") {
      var calmReady = SF.calm && SF.calm();
      ctx.save();
      ctx.globalAlpha = calmReady ? 0.45 : 0.4;
      ctx.strokeStyle = "#ffe7a8";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, crystalY, 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    return;
  }
  var flick = (SF.calm && SF.calm()) ? 1 : (0.97 + Math.sin(SF.anim * 1.4) * 0.03);
  ctx.save();
  ctx.fillStyle = "#8d7368";
  ctx.fillRect(x - 10, y + 6, 20, 8);
  ctx.fillRect(x - 3, y - 2, 6, 12);
  if (lit || flare > 0) {
    var bloom = (lit ? 72 : 40 + flare * 36) * (lit ? flick : 1);
    ctx.globalAlpha = lit ? 0.9 : 0.35 + flare * 0.6;
    ctx.drawImage(SF.blobs.gold, x - bloom / 2, crystalY - bloom / 2, bloom, bloom);
    ctx.globalAlpha = 1;
  } else {
    ctx.drawImage(SF.blobs.violet, x - 16, crystalY - 16, 32, 32);
  }
  ctx.fillStyle = lit || flare > 0.35 ? "#fff8e4" : "#c9b6e8";
  ctx.beginPath();
  ctx.moveTo(x, crystalY - 8);
  ctx.lineTo(x + 7, crystalY);
  ctx.lineTo(x, crystalY + 8);
  ctx.lineTo(x - 7, crystalY);
  ctx.fill();
  ctx.restore();
  if (!lit && SF.state && SF.state.shardsHeld >= SF.QUEST_SHARDS && SF.state.quest === "gather") {
    var calm = SF.calm && SF.calm();
    var pulse = calm ? 0.4 : (0.34 + Math.sin(SF.anim * 1.4) * 0.08);
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.strokeStyle = "#ffe7a8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, crystalY, calm ? 14 : (13 + Math.sin(SF.anim * 1.4) * 1), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
};

SF.drawBobber = function (ctx, x, y) {
  var bob = (SF.calm && SF.calm()) ? 0 : Math.sin(SF.anim * 2) * 2;
  ctx.save();
  ctx.translate(x, y - 28 + bob);
  ctx.fillStyle = "#ffd37a";
  ctx.beginPath();
  ctx.moveTo(0, -5);
  ctx.lineTo(4, 0);
  ctx.lineTo(0, 5);
  ctx.lineTo(-4, 0);
  ctx.fill();
  ctx.restore();
};

SF.entityList = function (s) {
  var list = [];
  if (window.Art && Art.landmarkDraws) {
    Art.landmarkDraws().forEach(function (item) { list.push(item); });
  }
  var lit = SF.lampIsLit ? SF.lampIsLit(s) : !!s.flags.lampLit;
  SF.PROPS.forEach(function (prop) {
    list.push({ y: prop.y, draw: function (ctx) { SF.drawProp(ctx, prop, lit); } });
  });
  (SF.TEXTS || []).forEach(function (mark) {
    var sid = "";
    if (/sign|order/i.test(mark.id) || /sign/i.test(mark.speaker || "")) sid = "sign";
    else if (/bell/i.test(mark.id)) sid = "bell";
    if (!sid || !window.Art) return;
    list.push({
      y: mark.y,
      draw: function (ctx) { Art.sprite(ctx, sid, mark.x, mark.y, { scale: 1 }); }
    });
  });
  (SF.EXTRAS || []).forEach(function (extra) {
    list.push({
      y: extra.y,
      draw: function (ctx) {
        ctx.save();
        if (SF.drawExtra && SF.drawExtra(ctx, extra)) {
          ctx.restore();
          return;
        }
        if (extra.kind === "bench" && window.Art && Art.sprite) {
          Art.sprite(ctx, "bench", extra.x, extra.y, { scale: 1 });
        } else if (extra.kind === "bench") {
          ctx.fillStyle = "#6a5348";
          ctx.fillRect(extra.x - 14, extra.y - 4, 28, 6);
          ctx.fillRect(extra.x - 12, extra.y - 10, 4, 8);
          ctx.fillRect(extra.x + 8, extra.y - 10, 4, 8);
        } else if (window.Art && Art.sprite) {
          Art.sprite(ctx, "stones", extra.x, extra.y, { scale: 1 });
        } else {
          ctx.fillStyle = "#8a6860";
          ctx.beginPath();
          ctx.arc(extra.x, extra.y, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#ffb15a";
          ctx.fillRect(extra.x - 1, extra.y - 10, 2, 8);
        }
        ctx.restore();
      }
    });
  });
  SF.activePickups().forEach(function (item) {
    if (item.kind === "shard" && SF.state && SF.state.player && SF.dist(SF.state.player.x, SF.state.player.y, item.x, item.y) > 96) return;
    list.push({ y: item.y, draw: function (ctx) { SF.drawPickup(ctx, item, false); } });
  });
  list.push({ y: SF.LAMP.y, draw: function (ctx) { SF.drawLampCrystal(ctx, lit); } });
  SF.NPCS.forEach(function (n) {
    if (SF.npcHidden && SF.npcHidden(n)) return;
    var nx = n.x;
    var ny = n.y;
    if (n.id === "cantor" && SF.cantorWorldPos) {
      var spot = SF.cantorWorldPos();
      if (spot) {
        nx = spot.x;
        ny = spot.y;
      }
    }
    list.push({
      y: ny,
      draw: function (ctx) {
        SF.drawShadow(ctx, nx, ny, 10, 1);
        var drewActor = SF.drawActor && SF.drawActor(ctx, n, nx, ny);
        if (!drewActor) {
          if (n.id === "maren") SF.drawMaren(ctx, nx, ny);
          else if (n.id === "kestrel") SF.drawKestrel(ctx, nx, ny);
          else if (n.id === "tamsin") SF.drawTamsin(ctx, nx, ny);
          else if (n.id === "hesk") SF.drawHesk(ctx, nx, ny);
          else if (n.id === "ilsa") SF.drawIlsa(ctx, nx, ny);
          else SF.drawCantor(ctx, nx, ny);
        }
        var walking = n.id === "cantor" && s.approach && s.approach.kind === "cantor";
        if (walking || (s.mode === "play" && SF.dist(s.player.x, s.player.y, nx, ny) < 90)) {
          ctx.save();
          ctx.font = "600 12px Palatino, Georgia, serif";
          ctx.textAlign = "center";
          ctx.fillStyle = "#fff8ee";
          ctx.fillText(n.name, nx, ny - 34);
          ctx.restore();
        }
      }
    });
  });
  s.enemies.forEach(function (e) {
    if (!e.alive && e.dying <= 0) return;
    list.push({
      y: e.y,
      draw: function (ctx) {
        ctx.save();
        if (e.dying > 0) ctx.globalAlpha = Math.max(0, e.dying / 0.45);
        SF.drawShadow(ctx, e.x, e.y, e.r);
        var foeSprite = SF.foeSprite ? SF.foeSprite(e) : null;
        var foeScale = (window.Art && Art.fieldScale) ? Art.fieldScale(foeSprite || "wayfarer") : 1;
        var foeFrame = (SF.calm && SF.calm()) ? 0 : Math.floor((SF.anim || 0) * 4) % 4;
        var foeFacing = "down";
        if (s.player) {
          var fdx = s.player.x - e.x;
          var fdy = s.player.y - e.y;
          if (Math.abs(fdx) > 18 || Math.abs(fdy) > 18) {
            foeFacing = Math.abs(fdx) >= Math.abs(fdy) ? (fdx < 0 ? "left" : "right") : (fdy < 0 ? "up" : "down");
          }
        }
        var drewFoe = foeSprite && SF.tryArtSprite && SF.tryArtSprite(ctx, foeSprite, e.x, e.y, {
          scale: foeScale,
          frame: foeFrame,
          facing: foeFacing,
          pose: "walk"
        });
        if (!drewFoe) {
          if (e.kind === "wisp") SF.drawWisp(ctx, e);
          else if (e.kind === "brumekin") SF.drawBrume(ctx, e);
          else if (e.kind === "choirling") SF.drawChoir(ctx, e);
          else if (SF.drawWorldFoe && SF.drawWorldFoe(ctx, e)) {}
          else if (SF.drawFoe) SF.drawFoe(ctx, e);
        }
        SF.drawHpPips(ctx, e);
        ctx.restore();
      }
    });
  });
  var p = s.player;
  list.push({
    y: p.y,
    draw: function (ctx) {
      var alpha = 1;
      if (p.iFrames > 0 && !(SF.calm && SF.calm())) alpha = 0.84;
      if (!SF.walkable(p.x, p.y)) alpha *= 0.7;
      var sink = SF.walkable(p.x, p.y) ? 0 : Math.min(10, p.fall * 36);
      s.ghosts.forEach(function (g) {
        SF.drawWayfarer(ctx, g.x, g.y, g.fx, g.fy, g.a, p.shardstep);
      });
      SF.drawShadow(ctx, p.x, p.y, 11, 1);
      ctx.save();
      ctx.strokeStyle = "rgba(185, 248, 255, 0.9)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y + 1, 10, 4, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      SF.drawWayfarer(ctx, p.x, p.y + sink, p.fx, p.fy, alpha, p.shardstep);
      var palm = SF.palmAmt ? SF.palmAmt(s) : 0;
      if (palm > 0 && SF.blobs) {
        var hand = SF.palmPoint(p);
        ctx.save();
        ctx.globalAlpha = 0.4 + palm * 0.6;
        ctx.drawImage(SF.blobs.cyan, hand.x - 11, hand.y - 11, 22, 22);
        ctx.drawImage(SF.blobs.gold, hand.x - 6, hand.y - 6, 12, 12);
        ctx.restore();
      }
      if (p.swinging) {
        var ang = Math.atan2(p.fy, p.fx);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.strokeStyle = "rgba(255, 248, 220, 0.9)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, 28, ang - 1.0, ang + 1.0);
        ctx.stroke();
        ctx.restore();
      }
    }
  });
  if (SF.TERRACES && SF._terrain) {
    SF._terraceList().forEach(function (t) {
      if (!t.block) return;
      list.push({
        y: (SF.terraceSouthLip && (SF.terraceSouthLip(t, t.x), t._southBase)) || (t.y + t.ry + t.block),
        draw: function (ctx) { SF.drawTerraceFront(ctx, t); }
      });
    });
  }
  list.sort(function (a, b) { return a.y - b.y; });
  return list;
};

SF.goalPrecise = function (goal) {
  return !goal || goal.kind !== "shard" || goal.precise !== false;
};

SF.drawGuide = function (ctx, s) {
  if (!s || s.mode !== "play" || !SF.objectivePoint) return;
  var goal = SF.objectivePoint(s);
  if (!goal || !SF.goalPrecise(goal)) return;
  var p = s.player;
  var dx = goal.x - p.x;
  var dy = goal.y - p.y;
  var d = Math.hypot(dx, dy) || 1;
  if (d > 70) {
    var ang = Math.atan2(dy, dx);
    ctx.save();
    ctx.translate(p.x + Math.cos(ang) * 52, p.y + Math.sin(ang) * 52);
    ctx.rotate(ang);
    ctx.fillStyle = "rgba(255, 211, 122, 0.95)";
    ctx.strokeStyle = "rgba(20, 10, 30, 0.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(9, 0);
    ctx.lineTo(-7, 5);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-7, -5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  if (d > 40) SF.drawBobber(ctx, goal.x, goal.y);
};

SF.drawEdgeArrow = function (ctx, w, h, s) {
  if (!s || s.mode !== "play" || !SF.objectivePoint) return;
  var goal = SF.objectivePoint(s);
  if (!goal) return;
  var sensed = goal.kind === "shard" && goal.precise === false;
  var zoom = SF.zoom || 1;
  var sx = (goal.x - s.camX) * zoom + w / 2;
  var sy = (goal.y - s.camY) * zoom + h / 2;
  var left = 28;
  var right = w - 28;
  var top = 88;
  var bottom = h - 150;
  if (!sensed && sx > left && sx < right && sy > top && sy < bottom) return;
  var cx = w / 2;
  var cy = h / 2;
  var dx = sx - cx;
  var dy = sy - cy;
  if (!dx && !dy) return;
  var t = Infinity;
  if (dx > 0) t = Math.min(t, (right - cx) / dx);
  else if (dx < 0) t = Math.min(t, (left - cx) / dx);
  if (dy > 0) t = Math.min(t, (bottom - cy) / dy);
  else if (dy < 0) t = Math.min(t, (top - cy) / dy);
  if (!isFinite(t) || t < 0) t = 1;
  ctx.save();
  ctx.translate(cx + dx * t, cy + dy * t);
  ctx.rotate(Math.atan2(dy, dx));
  if (sensed) ctx.globalAlpha = 0.55 + Math.sin((SF.anim || 0) * 5) * 0.4;
  ctx.fillStyle = sensed ? "#9af6ff" : "#ffd37a";
  ctx.strokeStyle = "rgba(20, 10, 30, 0.7)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(12, 0);
  ctx.lineTo(-8, 8);
  ctx.lineTo(-3, 0);
  ctx.lineTo(-8, -8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
};

SF.drawFx = function (ctx, s) {
  s.projectiles.forEach(function (shot) {
    ctx.drawImage(SF.blobs.violet, shot.x - 10, shot.y - 10, 20, 20);
    ctx.fillStyle = "#f6e9ff";
    ctx.beginPath();
    ctx.arc(shot.x, shot.y, 3, 0, Math.PI * 2);
    ctx.fill();
  });
  s.particles.forEach(function (part) {
    ctx.globalAlpha = Math.max(0, part.life / part.max);
    ctx.fillStyle = part.color;
    ctx.beginPath();
    ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  if (s.ring) {
    var u = 1 - s.ring.life / 0.9;
    ctx.save();
    ctx.globalAlpha = Math.max(0, s.ring.life);
    ctx.strokeStyle = "#ffe7a8";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(s.ring.x, s.ring.y, 12 + u * s.ring.max, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  ctx.save();
  ctx.font = "700 13px Palatino, Georgia, serif";
  ctx.textAlign = "center";
  s.floaters.forEach(function (f) {
    ctx.globalAlpha = Math.max(0, f.life / 0.75);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
  });
  ctx.restore();
  ctx.globalAlpha = 1;
  SF.drawGuide(ctx, s);

  var near = null;
  if (s.mode === "play") near = SF.nearestInteract();
  if (near) {
    var nx = near.kind === "lamp" ? SF.LAMP.x : near.ref.x;
    var ny = near.kind === "lamp" ? SF.LAMP.y : near.ref.y;
    var calm = SF.calm && SF.calm();
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = "#fff4d2";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(nx, ny, calm ? 20 : (19 + Math.sin(SF.anim * 1.6) * 1), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  if (SF.drawGrappleFx) SF.drawGrappleFx(ctx, s);
};

SF.drawVignette = function (ctx, w, h, s) {
  var lit = SF.lampIsLit ? SF.lampIsLit(s) : !!(s.flags && s.flags.lampLit);
  var cinder = SF.islandId === "cinderveil";
  var key = (SF.islandId || "emberhold") + (lit ? "1" : "0") + ":" + w + "x" + h;
  if (SF._vigKey !== key) {
    var sheet = document.createElement("canvas");
    sheet.width = Math.max(1, Math.round(w * 0.5));
    sheet.height = Math.max(1, Math.round(h * 0.5));
    var gctx = sheet.getContext("2d");
    var g = gctx.createRadialGradient(sheet.width / 2, sheet.height / 2, Math.min(sheet.width, sheet.height) * 0.35, sheet.width / 2, sheet.height / 2, Math.max(sheet.width, sheet.height) * 0.72);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, cinder ? (lit ? "rgba(48,18,8,0.30)" : "rgba(28,10,8,0.5)") : (lit ? "rgba(20,8,40,0.28)" : "rgba(12,6,28,0.48)"));
    gctx.fillStyle = g;
    gctx.fillRect(0, 0, sheet.width, sheet.height);
    SF._vig = sheet;
    SF._vigKey = key;
  }
  ctx.drawImage(SF._vig, 0, 0, w, h);
};

SF.draw = function () {
  var canvas = SF.view;
  var ctx = SF.ctx;
  var s = SF.state;
  if (!canvas || !ctx || !s || !SF.blobs) return;
  var w = SF.viewW;
  var h = SF.viewH;
  var dpr = SF.dpr;
  if (!w || !h) return;
  if (s.mode === "title" && SF.drawTitleScene) {
    SF.drawTitleScene(ctx, w, h, dpr);
    return;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.globalAlpha = 1;
  if ((s.mode === "voyage" || s.voyageTalk) && SF.drawVoyage) {
    SF.drawVoyage(ctx, w, h, s);
    SF.drawVignette(ctx, w, h, s);
    return;
  }
  SF.drawSky(ctx, w, h, s);
  var zoom = SF.zoomFor(w, h);
  SF.zoom = zoom;
  var shake = (SF.calm && SF.calm()) ? 0 : Math.min(2.2, s.shake || 0);
  var sx = Math.sin(SF.anim * 24) * shake;
  var sy = Math.cos(SF.anim * 19) * shake;
  var pxScale = Math.max(1, Math.round(dpr * zoom));
  var camX = Math.round(s.camX);
  var camY = Math.round(s.camY);
  ctx.setTransform(
    pxScale,
    0,
    0,
    pxScale,
    Math.round(dpr * (w / 2 + sx) - camX * pxScale),
    Math.round(dpr * (h / 2 + sy) - camY * pxScale)
  );
  ctx.imageSmoothingEnabled = false;
  SF.drawClouds(ctx, s);
  SF.drawTerrain(ctx, s);
  if (SF.drawHushLip) SF.drawHushLip(ctx);
  if (SF.drawCinderCracks) SF.drawCinderCracks(ctx);
  SF.entityList(s).forEach(function (ent) { ent.draw(ctx); });
  SF.drawFx(ctx, s);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.globalAlpha = 1;
  ctx.imageSmoothingEnabled = true;
  SF.drawVignette(ctx, w, h, s);
  SF.drawEdgeArrow(ctx, w, h, s);
  SF.drawMap();
};

SF.drawMap = function () {
  var canvas = SF.map;
  var s = SF.state;
  if (!canvas || !s || s.mode === "title") return;
  if (!SF._mapCtx || SF._mapCtx.canvas !== canvas) SF._mapCtx = canvas.getContext("2d");
  var ctx = SF._mapCtx;
  var w = canvas.width;
  var h = canvas.height;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, w, h);
  var minX = Infinity;
  var minY = Infinity;
  var maxX = -Infinity;
  var maxY = -Infinity;
  function mapBound(c) {
    var f = SF.foot(c);
    minX = Math.min(minX, f.x - f.rx);
    minY = Math.min(minY, f.y - f.ry);
    maxX = Math.max(maxX, f.x + f.rx);
    maxY = Math.max(maxY, f.y + f.ry);
  }
  SF.WALK.circles.forEach(mapBound);
  (SF.WALK.rects || []).forEach(mapBound);
  var pad = 16;
  var scale = Math.min((w - pad * 2) / (maxX - minX), (h - pad * 2) / (maxY - minY));
  function mx(x) { return pad + (x - minX) * scale; }
  function my(y) { return pad + (y - minY) * scale; }
  ctx.fillStyle = "rgba(18, 12, 36, 0.2)";
  ctx.fillRect(0, 0, w, h);
  var mapColors = {
    ember: "#5cba78",
    perch: "#73cbb4",
    cinder: "#e0b15a",
    span: "#b88870",
    quay: "#8d8680",
    ash: "#a89890",
    vault: "#6e4038",
    scar: "#c45a48",
    ridge: "#7eb8c8",
    salt: "#5ec4b0",
    shore: "#e0c07a",
    wreck: "#5c6560",
    wyrm: "#1e4e58",
    hs: "#c4a070",
    road: "#b89070",
    gull: "#a8a49c",
    drift: "#8a74b0"
  };
  Object.keys(mapColors).forEach(function (name) {
    var group = SF.groups[name];
    if (!group || !group.length) return;
    ctx.beginPath();
    group.forEach(function (c) {
      var f = SF.foot(c);
      if (f.rect && c.w != null) {
        ctx.rect(mx(c.x), my(c.y), c.w * scale, c.h * scale);
        return;
      }
      ctx.moveTo(mx(f.x + f.rx), my(f.y));
      if (ctx.ellipse) ctx.ellipse(mx(f.x), my(f.y), Math.max(1, f.rx * scale), Math.max(1, f.ry * scale), 0, 0, Math.PI * 2);
      else ctx.arc(mx(f.x), my(f.y), Math.max(1, Math.min(f.rx, f.ry) * scale), 0, Math.PI * 2);
    });
    ctx.fillStyle = mapColors[name];
    ctx.fill();
  });
  SF.activePickups().forEach(function (item) {
    if (item.kind !== "cog") return;
    ctx.fillStyle = "#ffb15a";
    ctx.fillRect(mx(item.x) - 1.5, my(item.y) - 1.5, 3, 3);
  });
  s.enemies.forEach(function (e) {
    if (!e.alive) return;
    if (e.kind !== "maw" && e.kind !== "tidewyrm") return;
    ctx.fillStyle = "rgba(255,120,140,0.9)";
    ctx.beginPath();
    ctx.arc(mx(e.x), my(e.y), 2, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = (SF.lampIsLit ? SF.lampIsLit(s) : s.flags.lampLit) ? "#ffe7a8" : "#c9b6e8";
  ctx.fillRect(mx(SF.LAMP.x) - 2, my(SF.LAMP.y) - 2, 4, 4);
  var goal = SF.objectivePoint(s);
  if (goal && SF.goalPrecise(goal)) {
    ctx.globalAlpha = (SF.calm && SF.calm()) ? 0.92 : (0.8 + Math.sin(SF.anim * 1.4) * 0.12);
    ctx.fillStyle = "#ffd37a";
    ctx.beginPath();
    ctx.arc(mx(goal.x), my(goal.y), 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (goal && s.player) {
    var px = mx(s.player.x);
    var py = my(s.player.y);
    var gx = mx(goal.x) - px;
    var gy = my(goal.y) - py;
    var glen = Math.hypot(gx, gy) || 1;
    var tick = Math.min(12, glen * 0.35);
    ctx.globalAlpha = 0.55 + Math.sin((SF.anim || 0) * 5) * 0.35;
    ctx.fillStyle = "#9af6ff";
    ctx.beginPath();
    ctx.moveTo(px + gx / glen * (tick + 4), py + gy / glen * (tick + 4));
    ctx.lineTo(px + gx / glen * tick - gy / glen * 3, py + gy / glen * tick + gx / glen * 3);
    ctx.lineTo(px + gx / glen * tick + gy / glen * 3, py + gy / glen * tick - gx / glen * 3);
    ctx.closePath();
    ctx.fill();
  }
  if (s.discovered && s.discovered.vault && SF.islandId === "cinderveil") {
    var heart = null;
    SF.WALK.circles.forEach(function (c) { if (c.id === "vault-heart") heart = c; });
    if (heart) {
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "#ffb15a";
      ctx.lineWidth = 1;
      ctx.strokeRect(mx(heart.x) - 3, my(heart.y) - 3, 6, 6);
    }
  }
  if (s.discovered.hollow || s.flags.metCantor || s.flags.cinderLit) {
    var cantor = null;
    SF.NPCS.forEach(function (n) { if (n.id === "cantor") cantor = n; });
    if (cantor && !(SF.npcHidden && SF.npcHidden(cantor))) {
      var lived = SF.cantorWorldPos && SF.cantorWorldPos();
      var cx = lived ? lived.x : cantor.x;
      var cy = lived ? lived.y : cantor.y;
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#e6c56a";
      ctx.fillRect(mx(cx) - 1.5, my(cy) - 1.5, 3, 3);
    }
  }
  ctx.globalAlpha = 1;
  var p = s.player;
  ctx.save();
  ctx.translate(mx(p.x), my(p.y));
  ctx.rotate(Math.atan2(p.fy, p.fx));
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.moveTo(5, 0);
  ctx.lineTo(-3, 3);
  ctx.lineTo(-3, -3);
  ctx.fill();
  ctx.restore();
};
