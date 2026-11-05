"use strict";

// TerrainLayer: code-art ground, tile ground, terrace fronts, and bridges.

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

SF._paintElevation = function (data, mask, minX, minY, w, h, resume) {
  var list = SF._terraceList();
  var ti, t, tone, reach, x0, y0, x1, y1, x, y, idx, pix, m, cur, col;
  var face, block, lv, top, rd, wx, wy, band, along, stepH, hang, moss, u, shadow, kind, ramp, lip, drop, above;
  var period, ax, ay, ddx, ddy, sz, reachH, fall, yStart, ti0;
  ti0 = resume && resume.ti != null ? resume.ti : 0;
  for (ti = ti0; ti < list.length; ti++) {
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
    yStart = y0;
    if (resume && resume.y != null && ti === ti0) yStart = resume.y;
    for (y = yStart; y <= y1; y++) {
      if (resume && y !== yStart && ((y - y0) & 7) === 0 && performance.now() >= resume.deadline) {
        resume.ti = ti;
        resume.y = y;
        return false;
      }
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
    if (resume) resume.y = null;
  }
  if (resume) {
    resume.ti = 0;
    resume.y = null;
  }
  return true;
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
  var band = 0.85;
  if (diff >= band) return 0;
  var u = (1 - diff / band) * 0.5;
  if (u < 0.04) return 0;
  return u > 0.5 ? 0.5 : u;
};

SF._cliffReach = function (ny) {
  return 4 + Math.max(0, ny) * 22;
};

SF._paintField = function (data, mask, minX, minY, w, h, lit, resume) {
  var kept = resume && resume.prep;
  var shapes = kept ? kept.shapes : [];
  var names, ni, list, i;
  if (!kept) {
    names = Object.keys(SF.groups || {});
    for (ni = 0; ni < names.length; ni++) {
      list = SF.groups[names[ni]] || [];
      for (i = 0; i < list.length; i++) shapes.push(list[i]);
    }
  }
  var n = shapes.length;
  var looks = kept ? kept.looks : new Array(n);
  var regions = kept ? kept.regions : new Array(n);
  var trails = kept ? kept.trails : new Array(n);
  var foams = kept ? kept.foams : new Array(n);
  var boxes = kept ? kept.boxes : new Array(n);
  if (!kept) for (i = 0; i < n; i++) {
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
  var CELL = kept ? kept.CELL : 64;
  var cells = kept ? kept.cells : new Map();
  var ci, box, cx0, cy0, cx1, cy1, cx, cy, key, bucket;
  if (!kept) {
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
    if (resume) resume.prep = { shapes: shapes, looks: looks, regions: regions, trails: trails, foams: foams, boxes: boxes, cells: cells, CELL: CELL };
  }
  var y, x, wx, wy, m, gap, reach, score, pix, best, second, trailBest, cliff, hit;
  var color, mix, cell;
  var yStart = resume ? (resume.y || 0) : 0;
  for (y = yStart; y < h; y++) {
    if (resume && y > yStart && (y & 15) === 0 && performance.now() >= resume.deadline) {
      resume.y = y;
      return false;
    }
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
        if (!second && best.deep < 16) {
          var rim = (16 - best.deep) / 16;
          color = SF._lerpRgb(color, [22, 32, 62], rim * 0.55);
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
  if (resume) resume.y = h;
  return true;
};

SF._paintDetails = function (data, mask, minX, minY, w, h, resume) {
  var shapes = resume && resume.shapes;
  var names, ni, list, i;
  if (!shapes) {
    shapes = [];
    names = Object.keys(SF.groups || {});
    for (ni = 0; ni < names.length; ni++) {
      list = SF.groups[names[ni]] || [];
      for (i = 0; i < list.length; i++) if (!SF._isTrail(list[i])) shapes.push(list[i]);
    }
    if (resume) resume.shapes = shapes;
  }
  var x0 = minX >> 4;
  var y0 = minY >> 4;
  var x1 = (minX + w) >> 4;
  var y1 = (minY + h) >> 4;
  var cx, cy, hsh, wx, wy, idx, look, k, pix, cy0;
  cy0 = resume && resume.cy != null ? resume.cy : y0;
  for (cy = cy0; cy <= y1; cy++) {
    if (resume && cy !== cy0 && ((cy - y0) & 3) === 0 && performance.now() >= resume.deadline) {
      resume.cy = cy;
      return false;
    }
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
  if (resume) resume.cy = y1 + 1;
  return true;
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
  var open = SF.groundWalkable || SF.walkable;
  if (!open || open(px, py)) return { x: px, y: py };
  var lo = 0;
  var hi = 1;
  var t, ax, ay, i;
  for (i = 0; i < 8; i++) {
    t = (lo + hi) * 0.5;
    ax = sx + (px - sx) * t;
    ay = sy + (py - sy) * t;
    if (open(ax, ay)) lo = t;
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

SF._paintPaths = function (data, mask, minX, minY, w, h, resume) {
  var paths = SF.PATHS || [];
  if (!paths.length) return true;
  var state = resume || {};
  var deadline = resume && resume.deadline != null ? resume.deadline : Infinity;
  var yielding = !!resume;
  var pi, path, i, raw, used, a, b, cluster, count, weight, look, blob, phase, steps, s, ang, rad, px, py;
  var joints, ci, dist, phase2, seg0, x0, y0, x1, y1, len, steps2, t, px2, py2, width, cols;
  if (!state.clusters) {
    joints = [];
    state.clusters = [];
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
      state.clusters.push(cluster);
    }
    state.ci = 0;
    state.pi = 0;
  }
  ci = state.ci || 0;
  while (ci < state.clusters.length) {
    if (yielding && ci !== (state.ci || 0) && performance.now() >= deadline) {
      state.ci = ci;
      return false;
    }
    cluster = state.clusters[ci];
    look = SF._pathColors(cluster.x, cluster.y);
    if (look) {
      blob = 11 + Math.min(5, cluster.n);
      phase = (SF._thash(cluster.x | 0, cluster.y | 0) % 628) / 100;
      steps = 8;
      for (s = 0; s < steps; s++) {
        ang = (s / steps) * Math.PI * 2;
        rad = blob * (0.8 + 0.2 * Math.sin(ang * 3 + phase));
        px = cluster.x + Math.cos(ang) * rad * 0.4;
        py = cluster.y + Math.sin(ang) * rad * 0.4;
        SF._stampPath(px, py, rad * 0.7, look, mask, data, minX, minY, w, h);
      }
    }
    ci++;
  }
  state.ci = ci;
  pi = state.pi || 0;
  while (pi < paths.length) {
    if (!state.raw || state.pathN !== pi) {
      state.raw = SF._meander(paths[pi]);
      state.pathN = pi;
      state.seg = 0;
      state.dist = 0;
      state.phase2 = state.raw.length ? ((SF._thash(state.raw[0] | 0, state.raw[1] | 0) % 500) / 80) : 0;
    }
    raw = state.raw;
    if (raw.length < 4) {
      pi++;
      state.raw = null;
      state.pi = pi;
      continue;
    }
    dist = state.dist || 0;
    phase2 = state.phase2;
    seg0 = state.seg || 0;
    for (i = seg0; i < raw.length - 2; i += 2) {
      if (yielding && i !== seg0 && performance.now() >= deadline) {
        state.pi = pi;
        state.seg = i;
        state.dist = dist;
        return false;
      }
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
    pi++;
    state.raw = null;
    state.pi = pi;
    state.seg = 0;
    state.dist = 0;
  }
  return true;
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

// Kenmi ground for Emberhold only, and only when every ground frame loaded.
// Anything short of that, including a partial atlas, keeps today's code ground.
SF._drawTileGround = function (ctx, s) {
  if (SF.worldSource !== "tiles" || SF.islandId !== "emberhold" || !SF.tileMap) return false;
  if (!s || !SF.TileMapRenderer) return false;
  if (!SF.tileRenderer) SF.tileRenderer = new SF.TileMapRenderer();
  try { SF.tileRenderer.draw(ctx, s, SF.tileMap); }
  catch (err) { /* a bad frame must not bring back the code ground */ }
  SF._tileGroundOn = true;
  return true;
};

SF.drawTerrain = function (ctx, s) {
  SF._tileGroundOn = false;
  if (!SF.groups || !SF.specks || !SF.blobs || !SF.WALK) return;
  if (SF._drawTileGround(ctx, s)) return;
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
  if (!SF.DrawDeps.art()) return;
  var i, br, img;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  for (i = 0; i < rects.length; i++) {
    br = rects[i];
    img = null;
    if (br.id === "rope" && SF.DrawDeps.art().ropeBridge) img = SF.DrawDeps.art().ropeBridge(br.w, br.h);
    else if (br.id === "pier" && SF.DrawDeps.art().dockDeck) img = SF.DrawDeps.art().dockDeck(br.w, br.h);
    if (img) ctx.drawImage(img, br.x, br.y, br.w, br.h);
  }
  ctx.restore();
};

SF.TerrainLayer = {
  draw: function (ctx, s) { SF.drawTerrain(ctx, s); },
  bridge: function (ctx) { SF.drawBridge(ctx); }
};
