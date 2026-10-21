"use strict";

// Battle backdrops. Each one is painted on a small pixel plate and scaled up
// with nearest-neighbor. Layers, back to front: sky, distant islets, the Hush
// (the cloud sea under the world's floating islands), a midground rooted on
// the horizon, then the fighting floor. The floor has no props. Drifting
// clouds and forge embers are a separate overlay and stop when Reduce motion
// is on.
(function () {
  var C = Art.C;
  var hex = Art.hex;

  function Scene(w, h) {
    this.w = w;
    this.h = h;
    this.c = document.createElement("canvas");
    this.c.width = w;
    this.c.height = h;
    this.g = this.c.getContext("2d");
    this.g.imageSmoothingEnabled = false;
  }
  Scene.prototype.rect = function (x, y, w, h, color) {
    if (w < 1 || h < 1) return;
    this.g.fillStyle = color;
    this.g.fillRect(x | 0, y | 0, w | 0, h | 0);
  };
  Scene.prototype.bands = function (y0, y1, colors) {
    var span = Math.max(1, y1 - y0);
    var g = this.g;
    var cols = colors.map(function (h) {
      return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    });
    var y, t, i, local, c0, c1;
    for (y = y0; y < y1; y++) {
      t = (y - y0) / span * (cols.length - 1);
      i = Math.min(cols.length - 2, Math.floor(t));
      local = t - i;
      c0 = cols[i];
      c1 = cols[i + 1];
      g.fillStyle = "rgb(" +
        ((c0[0] + (c1[0] - c0[0]) * local) | 0) + "," +
        ((c0[1] + (c1[1] - c0[1]) * local) | 0) + "," +
        ((c0[2] + (c1[2] - c0[2]) * local) | 0) + ")";
      g.fillRect(0, y | 0, this.w, 1);
    }
  };

  function hash(x, y) {
    var n = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
    n = (n ^ (n >>> 13)) | 0;
    n = Math.imul(n, 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }

  function parse(h) {
    return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  }

  // A short ramp between two palette colors. Far is the first stop (lit,
  // often hue-shifted warm) and near is the last (darker, cooler).
  function mixHex(a, b, t) {
    var A = parse(a);
    var B = parse(b);
    function byte(n) {
      var s = Math.max(0, Math.min(255, n | 0)).toString(16);
      return s.length < 2 ? "0" + s : s;
    }
    return "#" +
      byte(A[0] + (B[0] - A[0]) * t) +
      byte(A[1] + (B[1] - A[1]) * t) +
      byte(A[2] + (B[2] - A[2]) * t);
  }

  function horizonY(sc) {
    return Math.round(sc.h * (sc.h > sc.w ? 0.47 : 0.46));
  }

  function wide(sc) {
    return sc.w > sc.h;
  }

  // Props stay on the rims. On a wide frame the fighters occupy the left
  // ~58% and the menu covers the rest, so a far-right prop sits behind the menu.
  function edges(sc) {
    var xs = [Math.round(sc.w * 0.03), Math.round(sc.w * 0.97)];
    if (wide(sc)) xs.splice(1, 0, Math.round(sc.w * 0.08));
    else xs.splice(1, 0, Math.round(sc.w * 0.11), Math.round(sc.w * 0.89));
    return xs;
  }

  // One soft puff. The top is an ellipse, so neighboring puffs overlap into a
  // cloud bank instead of a broken line.
  function puff(sc, cx, cy, rx, ry, light, mid, dark, clipY) {
    var y, ny, w, row, col;
    ry = Math.max(2, ry);
    rx = Math.max(3, rx);
    for (y = -ry; y <= ry; y++) {
      ny = y / ry;
      w = Math.round(rx * Math.sqrt(Math.max(0, 1 - ny * ny)));
      if (w < 2) continue;
      row = cy + y;
      if (row < 0 || (clipY != null && row >= clipY)) continue;
      if (y < -Math.round(ry * 0.42)) col = light;
      else if (y > Math.round(ry * 0.38)) col = dark;
      else col = mid;
      sc.rect(cx - w, row, w * 2 + 1, 1, col);
    }
  }

  function cloudRow(sc, y, clipY, colors, rx0, ry, overlap) {
    var x = -Math.round(rx0 * 0.4);
    var i = 0;
    var rx;
    while (x < sc.w + rx0 && i < 28) {
      rx = rx0 + (i % 3) * 3;
      puff(sc, x, y - (i % 2), rx, ry, colors.light, colors.mid, colors.dark, clipY);
      x += Math.max(6, Math.round(rx * overlap));
      i += 1;
    }
  }

  function island(sc, cx, base, w, h, top, body, shade) {
    var y, u, half, width, x0, col;
    var crown = base - h;
    for (y = 0; y < h; y++) {
      u = y / Math.max(1, h - 1);
      if (u < 0.34) half = (w / 2) * (0.45 + u / 0.34 * 0.55);
      else half = (w / 2) * (1 - (u - 0.34) * 0.4);
      if (hash(cx + y, 3) > 0.74) half = Math.max(2, half - 1);
      width = Math.max(3, Math.round(half * 2));
      x0 = Math.round(cx - width / 2);
      col = y < 2 ? top : (u < 0.34 ? top : (u > 0.68 ? shade : body));
      sc.rect(x0, crown + y, width, 1, col);
      sc.rect(x0, crown + y, 1, 1, shade);
      sc.rect(x0 + width - 1, crown + y, 1, 1, shade);
    }
    if (w >= 16) {
      sc.rect(cx, crown - 4, 1, 4, shade);
      sc.rect(cx - 2, crown - 4, 5, 2, top);
    }
  }

  function islets(sc, hy, style) {
    island(
      sc,
      Math.round(sc.w * 0.22),
      Math.round(hy * 0.72),
      Math.round(sc.w * 0.08) + 8,
      Math.round(hy * 0.14) + 4,
      style.top, style.body, style.shade
    );
    island(
      sc,
      Math.round(sc.w * (wide(sc) ? 0.42 : 0.62)),
      Math.round(hy * 0.86),
      Math.round(sc.w * 0.13) + 10,
      Math.round(hy * 0.18) + 5,
      style.top, style.body, style.shade
    );
    island(
      sc,
      Math.round(sc.w * 0.74),
      Math.round(hy * 0.74),
      Math.round(sc.w * 0.06) + 6,
      Math.round(hy * 0.12) + 3,
      style.top, style.body, style.shade
    );
  }

  function stars(sc, hy, n) {
    var i, x, y;
    for (i = 0; i < n; i++) {
      x = Math.floor(hash(i, 2) * sc.w);
      y = 2 + Math.floor(hash(i, 5) * hy * 0.36);
      sc.rect(x, y, 1, 1, hash(i, 8) > 0.7 ? hex(C.warm) : hex(C.cloudW));
    }
  }

  function moon(sc, hy) {
    var cx = Math.round(sc.w * (wide(sc) ? 0.18 : 0.78));
    var cy = Math.round(hy * 0.4);
    var r = 4;
    var dy, dx, d;
    for (dy = -r; dy <= r; dy++) {
      for (dx = -r; dx <= r; dx++) {
        d = dx * dx + dy * dy;
        if (d > r * r || dx > 0) continue;
        sc.rect(cx + dx, cy + dy, 1, 1, d < 4 && dx < -1 ? hex(C.warm) : hex(C.cloudW));
      }
    }
  }

  function oak(sc, x, hy, h, colors) {
    var canopyH = Math.max(8, Math.round(h * 0.64));
    var top = Math.max(1, hy - h);
    var y, u, half, col, wob;
    for (y = 0; y < canopyH; y++) {
      u = y / canopyH;
      half = Math.round(h * 0.26 * Math.sin(Math.PI * u));
      half = Math.max(2, half + Math.round(Math.sin(u * 8.5) * 1.2));
      wob = hash(x, y) > 0.6 ? 1 : 0;
      col = u < 0.22 ? colors.leafL : (u > 0.72 ? colors.leafD : colors.leaf);
      sc.rect(x - half + wob, top + y, half * 2, 1, col);
      sc.rect(x - half + wob, top + y, 1, 1, colors.leafD);
    }
    var trunkTop = top + Math.round(canopyH * 0.7);
    sc.rect(x - 1, trunkTop, 3, hy - trunkTop + 2, colors.wood);
    sc.rect(x - 1, trunkTop, 1, hy - trunkTop, colors.woodL);
    sc.rect(x - 2, hy - 2, 5, 4, colors.wood);
  }

  function pine(sc, x, hy, h, colors) {
    var y, half;
    for (y = 0; y < h; y++) {
      half = Math.max(1, Math.round((h - y) * 0.42));
      if (y > 0 && y % 4 === 0) half += 1;
      sc.rect(x - half, hy - h + y, half * 2 + 1, 1, y < 2 ? colors.leafL : colors.leafD);
    }
    sc.rect(x, hy - 3, 1, 5, colors.wood);
  }

  function ridge(sc, hy, body, lip) {
    var x, lift, nx, focus;
    focus = wide(sc) ? 0.32 : 0.5;
    for (x = 0; x < sc.w; x++) {
      lift = 2 + Math.round(Math.abs(Math.sin(x * 0.09 + 0.6)) * 3);
      if (hash(x, 4) > 0.8) lift += 1;
      nx = Math.abs(x / sc.w - focus);
      if (nx < 0.2) lift = Math.max(1, Math.round(lift * 0.4));
      sc.rect(x, hy - lift, 1, lift, body);
      sc.rect(x, hy - lift, 1, 1, lip);
    }
  }

  function snag(sc, x, hy, h) {
    var top = Math.max(1, hy - h);
    var y;
    for (y = top; y <= hy + 1; y++) {
      sc.rect(x + ((y >> 3) & 1), y, 2, 1, hex(C.woodD));
      sc.rect(x + ((y >> 3) & 1), y, 1, 1, hex(C.wood));
    }
    sc.rect(x + 2, top + Math.round(h * 0.28), 5, 1, hex(C.woodD));
    sc.rect(x + 6, top + Math.round(h * 0.28) - 3, 1, 3, hex(C.wood));
    sc.rect(x - 4, top + Math.round(h * 0.55), 4, 1, hex(C.ashD));
    sc.rect(x - 1, top, 4, 2, hex(C.rock));
  }

  function crag(sc, x, hy, w, h, body, light, dark) {
    var y, u, half, width;
    for (y = 0; y < h; y++) {
      u = y / Math.max(1, h - 1);
      half = Math.round((w / 2) * Math.sin(Math.min(1, u * 1.05 + 0.05) * Math.PI / 2));
      if (hash(x + y, 11) > 0.7) half = Math.max(1, half - 1);
      width = Math.max(2, half * 2 + 1);
      sc.rect(x - (width >> 1), hy - h + y, width, 1, u < 0.14 ? light : (u > 0.78 ? dark : body));
      sc.rect(x - (width >> 1), hy - h + y, 1, 1, dark);
    }
  }

  function column(sc, x, hy, w) {
    var top = Math.max(2, Math.round(hy * 0.16));
    var y, course;
    for (y = top + 4; y <= hy - 3; y++) {
      course = Math.floor((y - top) / 5);
      sc.rect(x, y, w, 1, course % 2 ? hex(C.stone) : hex(C.stoneD));
      sc.rect(x, y, 1, 1, hex(C.stoneL));
      sc.rect(x + w - 1, y, 1, 1, hex(C.rock));
      if ((y - top) % 5 === 0) sc.rect(x + 1, y, w - 2, 1, hex(C.rock));
    }
    sc.rect(x - 1, top, w + 2, 2, hex(C.stoneL));
    sc.rect(x - 2, top + 2, w + 4, 2, hex(C.stone));
    sc.rect(x - 1, hy - 5, w + 2, 2, hex(C.stone));
    sc.rect(x - 2, hy - 3, w + 4, 2, hex(C.stoneD));
    sc.rect(x - 3, hy - 1, w + 6, 3, hex(C.rock));
  }

  // A furnace mouth: thick stone jambs, an arched opening, a grate, coals.
  function forge(sc, cx, hy) {
    var aw = Math.max(26, Math.round(sc.w * 0.2));
    var ah = Math.max(18, Math.round(hy * 0.52));
    var left = cx - (aw >> 1);
    var top = hy - ah;
    var jamb = 5;
    var y, u, inset, x0, mw, i, by;
    sc.rect(left - 3, top - 2, aw + 6, ah + 4, hex(C.void));
    sc.rect(left, top, aw, ah + 2, hex(C.stoneD));
    sc.rect(left, top, 2, ah, hex(C.stoneL));
    sc.rect(left + aw - 2, top, 2, ah, hex(C.rock));
    var mouthT = top + 7;
    for (y = mouthT; y < hy - 2; y++) {
      u = (y - mouthT) / Math.max(1, hy - 2 - mouthT);
      inset = u < 0.42 ? Math.round((0.42 - u) / 0.42 * (aw * 0.28)) : 0;
      x0 = left + jamb + inset;
      mw = aw - jamb * 2 - inset * 2;
      if (mw < 4) continue;
      if (u < 0.35) sc.rect(x0, y, mw, 1, hex(C.vestD));
      else if (u < 0.7) sc.rect(x0, y, mw, 1, hex(C.ember));
      else sc.rect(x0, y, mw, 1, hex(C.emberH));
      if (u > 0.82) sc.rect(x0 + 2, y, Math.max(1, mw - 4), 1, hex(C.warm));
    }
    sc.rect(left, mouthT - 2, jamb, hy - mouthT, hex(C.stone));
    sc.rect(left + aw - jamb, mouthT - 2, jamb, hy - mouthT, hex(C.stoneD));
    sc.rect(left - 1, top + 1, aw + 2, 3, hex(C.stoneL));
    sc.rect(left + 2, top + 4, aw - 4, 2, hex(C.stone));
    for (i = 0; i < 3; i++) {
      by = mouthT + 3 + Math.round((hy - mouthT - 8) * (0.28 + i * 0.26));
      sc.rect(left + jamb, by, aw - jamb * 2, 1, hex(C.rock));
    }
    sc.rect(cx - 4, mouthT + 2, 1, hy - mouthT - 6, hex(C.stoneD));
    sc.rect(cx + 3, mouthT + 2, 1, hy - mouthT - 6, hex(C.stoneD));
    sc.rect(left + jamb + 1, hy - 4, aw - jamb * 2 - 2, 2, hex(C.emberH));
    sc.rect(left - 2, hy - 2, aw + 4, 3, hex(C.stone));
    sc.rect(left, hy - 2, aw, 1, hex(C.stoneL));
  }

  function spire(sc, cx, hy, scale) {
    var h = Math.max(16, Math.round(hy * 0.58 * scale));
    var top = hy - h;
    var maxW = Math.max(4, Math.round(7 * scale));
    var y, u, half;
    for (y = 0; y < h; y++) {
      u = y / h;
      half = u < 0.14 ? 1 : Math.max(2, Math.round(maxW * Math.min(1, (u - 0.06) / 0.4)));
      sc.rect(cx - half, top + y, half * 2, 1, ((y + cx) % 5 === 0) ? hex(C.stoneL) : hex(C.stoneD));
      sc.rect(cx - half, top + y, 1, 1, hex(C.stoneL));
      sc.rect(cx + half - 1, top + y, 1, 1, hex(C.rock));
    }
    sc.rect(cx, top - 3, 1, 3, hex(C.stoneL));
    sc.rect(cx - 2, top + Math.round(h * 0.2), 5, 2, hex(C.stone));
    sc.rect(cx - 1, hy - Math.round(h * 0.46), 2, 3, hex(C.warm));
    sc.rect(cx - 1, hy - Math.round(h * 0.28), 2, 3, hex(C.ember));
    sc.rect(cx - maxW - 1, hy - 4, maxW * 2 + 2, 3, hex(C.stoneD));
  }

  // Per-row mix so the floor reads as a gradient, not three flat stripes.
  function floorPlane(sc, y0, from, to) {
    var a = parse(from);
    var b = parse(to);
    var span = Math.max(1, sc.h - y0 - 1);
    var y, t, u;
    for (y = y0; y < sc.h; y++) {
      t = (y - y0) / span;
      u = Math.pow(Math.max(0, Math.min(1, t)), 0.9);
      sc.rect(0, y, sc.w, 1, "rgb(" +
        ((a[0] + (b[0] - a[0]) * u) | 0) + "," +
        ((a[1] + (b[1] - a[1]) * u) | 0) + "," +
        ((a[2] + (b[2] - a[2]) * u) | 0) + ")");
    }
  }

  function inLane(sc, x, y, hy) {
    var t = (y - hy) / Math.max(1, sc.h - hy);
    var focus = wide(sc) ? 0.34 : 0.5;
    return Math.abs(x / sc.w - focus) < 0.22 && t > 0.32;
  }

  function tuft(sc, x, y, color) {
    sc.rect(x, y, 1, 2, color);
    sc.rect(x + 2, y - 1, 1, 2, color);
    sc.rect(x + 1, y + 1, 2, 1, color);
  }

  function blossom(sc, x, y, petal) {
    sc.rect(x, y, 1, 1, hex(C.warm));
    sc.rect(x - 1, y, 1, 1, petal);
    sc.rect(x + 1, y, 1, 1, petal);
    sc.rect(x, y - 1, 1, 1, petal);
    sc.rect(x, y + 1, 1, 2, hex(C.leafD));
  }

  function dirtPatch(sc, x, y, w) {
    var k;
    sc.rect(x, y, w, 2, hex(C.path));
    sc.rect(x + 1, y + 2, Math.max(2, w - 2), 1, hex(C.pathD));
    for (k = 0; k < w; k += 3) sc.rect(x + k, y, 1, 1, hex(C.pathL));
  }

  function meadowFloor(sc, hy) {
    floorPlane(sc, hy, mixHex(hex(C.leaf), hex(C.pathL), 0.22), hex(C.grassX));
    var span = Math.max(1, sc.h - hy);
    var marks = [
      [0.04, 0.22, "flower", hex(C.bloom)],
      [0.9, 0.3, "flower", hex(C.gold)],
      [0.16, 0.16, "flower", hex(C.gold)],
      [0.78, 0.18, "flower", hex(C.bloom)],
      [0.03, 0.62, "dirt"],
      [0.93, 0.55, "dirt"],
      [0.08, 0.4, "dirt"]
    ];
    var i, x, y, kind;
    for (i = 0; i < marks.length; i++) {
      x = Math.round(sc.w * marks[i][0]);
      y = hy + Math.round(span * marks[i][1]);
      if (y >= sc.h - 2 || inLane(sc, x, y, hy)) continue;
      kind = marks[i][2];
      if (kind === "flower") blossom(sc, x, y, marks[i][3]);
      else dirtPatch(sc, x, y, 6 + (i % 3));
    }
    for (i = 0; i < 14; i++) {
      x = Math.round(sc.w * (0.02 + (i * 0.07) % 0.96));
      y = hy + 4 + Math.round(span * (0.12 + (i % 5) * 0.16));
      if (y >= sc.h - 3) continue;
      if (inLane(sc, x, y, hy) && i % 2 === 0) continue;
      tuft(sc, x, y, i % 3 === 0 ? hex(C.leaf) : hex(C.grassD));
    }
  }

  // Distant flagstones only. The ground under the fighters stays a clean ramp.
  function courses(sc, y0, mortar) {
    var span = Math.max(1, sc.h - y0);
    var y = y0 + 4;
    var gap = 4;
    var x, step, top;
    while (y < sc.h && (y - y0) / span < 0.4) {
      sc.rect(0, y, sc.w, 1, mortar);
      step = 8 + Math.floor((y - y0) / 3);
      x = Math.floor(hash(0, y) * step);
      top = Math.max(y0 + 2, y - gap);
      while (x < sc.w) {
        sc.rect(x, top, 1, y - top, mortar);
        x += step;
      }
      y += gap;
      gap += 1;
    }
  }

  var MEADOW_SKY = ["#140c28", "#241448", "#3a2060", "#6a4068", "#c47868", "#e8a888", "#f0c4a8"];
  var ASH_SKY = ["#140c0c", "#3a1810", "#6a3018", "#a85830", "#e08858", "#c49880"];
  var NIGHT_SKY = ["#0e0814", "#1a1030", "#2a1848", "#4a3058", "#7a5868", "#b08880"];
  var VAULT_SKY = ["#0c080c", "#140c10", "#1c1214", "#2a1a18", "#3a2820"];
  var SHORE_SKY = ["#100818", "#1a2048", "#1a3858", "#2a5870", "#c49080", "#f0c4a8"];
  var HUSH = { light: hex(C.cloudW), mid: hex(C.hushP), dark: hex(C.hush) };
  var HUSH_DEEP = { light: hex(C.hushL), mid: hex(C.hush), dark: hex(C.hushD) };
  var SMOKE = { light: hex(C.ashD), mid: hex(C.rock), dark: hex(C.hairD) };
  var TREE = {
    leaf: hex(C.leaf),
    leafD: hex(C.leafD),
    leafL: hex(C.leafL),
    wood: hex(C.woodD),
    woodL: hex(C.woodL)
  };
  var MEADOW_ISLE = { top: hex(C.grassL), body: hex(C.cliff), shade: hex(C.cliffD) };

  function openSky(sc, hy, colors, sea, isles) {
    sc.bands(0, hy, colors);
    cloudRow(sc, Math.round(hy * 0.68), hy, sea.back || HUSH_DEEP, 12, 5, 1.35);
    if (isles) islets(sc, hy, isles);
    cloudRow(sc, Math.round(hy * 0.86), hy - 1, sea.front || HUSH, 18, 6, 1.12);
  }

  function meadow(sc) {
    var hy = horizonY(sc);
    openSky(sc, hy, MEADOW_SKY, { back: HUSH_DEEP, front: HUSH }, MEADOW_ISLE);
    stars(sc, Math.round(hy * 0.3), 8);
    ridge(sc, hy, hex(C.grassX), hex(C.leafD));
    var xs = edges(sc);
    oak(sc, xs[0], hy, 30, TREE);
    oak(sc, xs[xs.length - 1], hy, 26, TREE);
    if (xs.length > 2) pine(sc, xs[1], hy, 16, TREE);
    if (!wide(sc) && xs.length > 3) pine(sc, xs[2], hy, 14, TREE);
    meadowFloor(sc, hy);
  }

  function scar(sc) {
    var hy = horizonY(sc);
    openSky(sc, hy, NIGHT_SKY, {
      back: { light: hex(C.hush), mid: hex(C.hushD), dark: hex(C.void) },
      front: HUSH_DEEP
    }, { top: hex(C.cliff), body: hex(C.cliffD), shade: hex(C.void) });
    stars(sc, hy, 18);
    moon(sc, hy);
    ridge(sc, hy, hex(C.void), hex(C.cliffD));
    var xs = edges(sc);
    crag(sc, xs[0], hy, 18, 20, hex(C.cliff), hex(C.cliffL), hex(C.cliffD));
    crag(sc, xs[xs.length - 1], hy, 14, 16, hex(C.stoneD), hex(C.stone), hex(C.void));
    if (xs.length > 2) crag(sc, xs[1], hy, 10, 12, hex(C.cliffD), hex(C.cliff), hex(C.void));
    var archX = Math.round(sc.w * (wide(sc) ? 0.36 : 0.5));
    var archH = Math.max(8, Math.round(hy * 0.2));
    sc.rect(archX - 9, hy - archH, 3, archH + 2, hex(C.stoneD));
    sc.rect(archX + 6, hy - archH, 3, archH + 2, hex(C.stone));
    sc.rect(archX - 9, hy - archH, 18, 2, hex(C.stoneL));
    sc.rect(archX - 7, hy - archH + 2, 14, 1, hex(C.stoneD));
    floorPlane(sc, hy, hex(C.grassD), hex(C.void));
  }

  function ash(sc) {
    var hy = horizonY(sc);
    sc.bands(0, hy, ASH_SKY);
    cloudRow(sc, Math.round(hy * 0.66), hy, SMOKE, 14, 5, 1.3);
    islets(sc, hy, { top: hex(C.ember), body: hex(C.rock), shade: hex(C.hairD) });
    cloudRow(sc, Math.round(hy * 0.84), hy - 1, SMOKE, 18, 6, 1.12);
    ridge(sc, hy, hex(C.hairD), hex(C.rock));
    var xs = edges(sc);
    snag(sc, xs[0], hy, 24);
    snag(sc, xs[xs.length - 1], hy, 20);
    if (xs.length > 2) snag(sc, xs[1], hy, 15);
    crag(sc, xs[0] + 12, hy, 11, 12, hex(C.rock), hex(C.ash), hex(C.hairD));
    crag(sc, xs[xs.length - 1] - 10, hy, 13, 14, hex(C.cliffD), hex(C.ashD), hex(C.void));
    floorPlane(sc, hy, hex(C.ash), hex(C.hairD));
    var cracks = [[0.05, 0.2], [0.92, 0.28], [0.08, 0.45]];
    var i, x, y, len;
    for (i = 0; i < cracks.length; i++) {
      x = Math.round(sc.w * cracks[i][0]);
      y = hy + Math.round((sc.h - hy) * cracks[i][1]);
      len = 5 + i * 2;
      sc.rect(x, y, len, 2, hex(C.ember));
      sc.rect(x + 1, y, Math.max(2, len - 3), 1, hex(C.emberH));
    }
  }

  function vault(sc) {
    var hy = horizonY(sc);
    sc.bands(0, sc.h, VAULT_SKY);
    var xs = edges(sc);
    var i;
    for (i = 0; i < xs.length; i++) column(sc, xs[i], hy, 8);
    forge(sc, Math.round(sc.w * (wide(sc) ? 0.38 : 0.5)), hy);
    floorPlane(sc, hy, mixHex(hex(C.stone), hex(C.ember), 0.16), hex(C.void));
    courses(sc, hy, hex(C.void));
    var glow = Math.round(sc.w * (wide(sc) ? 0.38 : 0.5));
    sc.rect(glow - 10, hy, 20, 1, hex(C.ember));
    sc.rect(glow - 6, hy + 1, 12, 1, hex(C.vestD));
  }

  function shore(sc) {
    var hy = horizonY(sc);
    var waterTop = Math.round(hy * 0.62);
    sc.bands(0, waterTop + 1, SHORE_SKY);
    islets(sc, waterTop, { top: hex(C.grass), body: hex(C.cliff), shade: hex(C.cliffD) });
    cloudRow(sc, Math.round(waterTop * 0.82), waterTop, HUSH, 16, 5, 1.15);
    sc.bands(waterTop, hy, [hex(C.tideD), hex(C.sea), hex(C.tide), hex(C.tideL)]);
    wave(sc, waterTop + Math.round((hy - waterTop) * 0.38), hex(C.tideL));
    wave(sc, waterTop + Math.round((hy - waterTop) * 0.72), hex(C.foam));
    var posts = edges(sc);
    var i, px, ph;
    for (i = 0; i < posts.length; i++) {
      px = posts[i];
      ph = 14 + (i % 2) * 5;
      sc.rect(px, hy - ph, 3, ph + 2, hex(C.woodD));
      sc.rect(px, hy - ph, 1, ph, hex(C.woodL));
      sc.rect(px - 1, hy - ph, 5, 2, hex(C.wood));
    }
    foam(sc, hy - 1);
    floorPlane(sc, hy, hex(C.sand), hex(C.pathD));
    sc.rect(0, hy, sc.w, 2, hex(C.tideD));
  }

  function wave(sc, y, color) {
    var x = 0;
    var len;
    while (x < sc.w) {
      len = 4 + Math.floor(hash(x, y) * 10);
      if (hash(x, y + 1) > 0.22) sc.rect(x, y, len, 2, color);
      x += len + 3 + Math.floor(hash(x, y + 2) * 8);
    }
  }

  function foam(sc, y) {
    var x = 0;
    var len;
    while (x < sc.w) {
      len = 2 + Math.floor(hash(x, y) * 6);
      if (hash(x, y + 5) > 0.22) sc.rect(x, y, len, 1, hex(C.foam));
      x += len + 2 + Math.floor(hash(x, y + 4) * 4);
    }
  }

  function wreck(sc) {
    var hy = horizonY(sc);
    var waterTop = Math.round(hy * 0.6);
    sc.bands(0, hy, NIGHT_SKY);
    stars(sc, waterTop, 16);
    moon(sc, hy);
    cloudRow(sc, Math.round(waterTop * 0.78), waterTop, HUSH_DEEP, 16, 5, 1.2);
    sc.bands(waterTop, hy, [hex(C.void), hex(C.tideD), hex(C.sea)]);
    wave(sc, waterTop + 3, hex(C.tide));
    var hull = Math.round(sc.w * (wide(sc) ? 0.28 : 0.36));
    sc.rect(hull, hy - 8, 26, 5, hex(C.woodD));
    sc.rect(hull + 2, hy - 12, 16, 4, hex(C.wood));
    sc.rect(hull + 8, hy - 18, 2, 8, hex(C.woodL));
    sc.rect(hull + 1, hy - 6, 22, 2, hex(C.cliffX));
    var xs = edges(sc);
    var i, rh, lean, yy, xx;
    for (i = 0; i < xs.length; i++) {
      rh = 14 + (i % 3) * 6;
      lean = (i % 2 ? 1 : -1) * 4;
      for (yy = 0; yy < rh; yy++) {
        xx = xs[i] + Math.round(lean * (yy / rh));
        if (yy % 7 === 5) continue;
        sc.rect(xx, hy - rh + yy, 2, 1, yy % 4 === 0 ? hex(C.wood) : hex(C.woodD));
      }
    }
    floorPlane(sc, hy, hex(C.wood), hex(C.void));
    courses(sc, hy, hex(C.voidD));
  }

  function road(sc) {
    var hy = horizonY(sc);
    openSky(sc, hy, MEADOW_SKY, { back: HUSH_DEEP, front: HUSH }, {
      top: hex(C.stoneL), body: hex(C.stone), shade: hex(C.stoneD)
    });
    var cx = Math.round(sc.w * (wide(sc) ? 0.34 : 0.48));
    spire(sc, cx, hy, 1.05);
    spire(sc, cx + Math.round(sc.w * 0.14), hy, 0.6);
    ridge(sc, hy, hex(C.stoneD), hex(C.stone));
    var xs = edges(sc);
    var i;
    for (i = 0; i < xs.length; i++) crag(sc, xs[i], hy, 8, 8, hex(C.stoneD), hex(C.stoneL), hex(C.void));
    floorPlane(sc, hy, hex(C.stoneL), hex(C.rock));
    courses(sc, hy, hex(C.rock));
  }

  function deck(sc) {
    var hy = horizonY(sc);
    sc.bands(0, hy, MEADOW_SKY);
    cloudRow(sc, Math.round(hy * 0.55), hy, HUSH_DEEP, 14, 5, 1.3);
    islets(sc, hy, MEADOW_ISLE);
    cloudRow(sc, Math.round(hy * 0.78), hy - 1, HUSH, 18, 6, 1.12);
    var boat = Math.round(sc.w * (wide(sc) ? 0.18 : 0.66));
    var by = Math.round(hy * 0.6);
    sc.rect(boat, by, 14, 3, hex(C.wood));
    sc.rect(boat + 1, by + 3, 12, 1, hex(C.woodD));
    sc.rect(boat + 6, by - 7, 1, 7, hex(C.woodL));
    sc.rect(boat + 7, by - 6, 5, 4, hex(C.cream));
    var xs = edges(sc);
    var i;
    for (i = 0; i < xs.length; i++) {
      sc.rect(xs[i], hy - 12, 2, 14, hex(C.woodD));
      sc.rect(xs[i], hy - 12, 1, 12, hex(C.woodL));
    }
    rope(sc, xs[0], xs[1], hy - 9);
    rope(sc, xs[xs.length - 2], xs[xs.length - 1], hy - 9);
    floorPlane(sc, hy, hex(C.woodL), hex(C.cliffX));
    courses(sc, hy, hex(C.woodD));
  }

  function rope(sc, x0, x1, y) {
    var a = Math.min(x0, x1);
    var b = Math.max(x0, x1);
    var x;
    if (b - a < 2 || b - a > sc.w * 0.18) return;
    for (x = a; x <= b; x++) sc.rect(x, y + (hash(x, y) > 0.7 ? 1 : 0), 1, 1, hex(C.path));
  }

  var SCENES = {
    emberhold_meadow: meadow,
    emberhold_scar: scar,
    cinderveil_ash: ash,
    ember_vault: vault,
    saltmere_shore: shore,
    saltmere_wreck: wreck,
    highspire_road: road,
    hush_deck: deck
  };

  Art.BG_IDS = Object.keys(SCENES);

  var plates = {};

  function plate(id, pw, ph) {
    var key = id + "|" + pw + "|" + ph;
    if (plates[key]) return plates[key];
    var sc = new Scene(pw, ph);
    (SCENES[id] || meadow)(sc);
    plates[key] = sc.c;
    var keys = Object.keys(plates);
    if (keys.length > 24) delete plates[keys[0]];
    return sc.c;
  }

  var motionBuf = null;

  function motionOverlay(pw, ph, id, t) {
    if (!motionBuf || motionBuf.width !== pw || motionBuf.height !== ph) {
      motionBuf = document.createElement("canvas");
      motionBuf.width = pw;
      motionBuf.height = ph;
    }
    var g = motionBuf.getContext("2d");
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, pw, ph);
    var sc = {
      w: pw,
      h: ph,
      rect: function (x, y, w, h, color) {
        if (w < 1 || h < 1) return;
        g.fillStyle = color;
        g.fillRect(x | 0, y | 0, w | 0, h | 0);
      }
    };
    var hy = horizonY(sc);
    if (id !== "ember_vault") {
      var drift = Math.floor((t || 0) * 4) % (pw + 24);
      var colors = id === "cinderveil_ash" ? SMOKE : HUSH;
      var i, x;
      for (i = 0; i < 3; i++) {
        x = (Math.round(pw * (0.15 + i * 0.32)) - drift + pw * 2) % pw;
        puff(sc, x, 8 + (i % 2) * 4, 14, 5, colors.light, colors.mid, colors.dark, Math.round(ph * 0.28));
      }
    }
    if (id === "ember_vault" || id === "cinderveil_ash") {
      var n = id === "ember_vault" ? 12 : 8;
      var e, rise, ex, ey;
      for (e = 0; e < n; e++) {
        rise = ((t || 0) * (8 + (e % 5)) + e * 13) % (hy * 0.65);
        ey = hy - 3 - Math.floor(rise);
        ex = Math.floor(hash(e, 90) * pw);
        if (ey < 2) continue;
        sc.rect(ex, ey, 1, 1, hash(e, 91) > 0.6 ? hex(C.emberH) : hex(C.ember));
      }
    }
    return motionBuf;
  }

  Art.battleBg = function (ctx, bgId, w, h, t) {
    if (!ctx || !(w > 0) || !(h > 0)) return;
    var id = SCENES[bgId] ? bgId : "emberhold_meadow";
    var pix = Math.max(2, Math.round(Math.min(w, h) / 160));
    var pw = Math.max(80, Math.round(w / pix));
    var ph = Math.max(80, Math.round(h / pix));
    var src = plate(id, pw, ph);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    ctx.clip();
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#140c28";
    ctx.fillRect(0, 0, w, h);
    Art.blit(ctx, src, 0, 0, w, h);
    extendFloor(ctx, src, w, h);
    if (!Art.calm()) Art.blit(ctx, motionOverlay(pw, ph, id, t || 0), 0, 0, w, h);
    ctx.restore();
  };

  // Integer scaling can stop a pixel short of the frame. Stretch the floor's
  // last row into that gap so the bottom is not a dark strip.
  function extendFloor(ctx, src, w, h) {
    if (!ctx.getTransform || !src) return;
    var tr = ctx.getTransform();
    if (tr.b !== 0 || tr.c !== 0 || !tr.a || !tr.d) return;
    var sx = Math.max(1, Math.round(Math.abs(tr.a * w) / src.width));
    var sy = Math.max(1, Math.round(Math.abs(tr.d * h) / src.height));
    var drawnW = src.width * sx;
    var drawnH = src.height * sy;
    var destW = Math.round(Math.abs(tr.a * w));
    var destH = Math.round(Math.abs(tr.d * h));
    var ox = Math.round(tr.a * 0 + tr.e);
    var oy = Math.round(tr.d * 0 + tr.f);
    if (drawnH >= destH && drawnW >= destW) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    if (drawnH < destH) {
      ctx.drawImage(src, 0, src.height - 1, src.width, 1, ox, oy + drawnH, Math.max(drawnW, destW), destH - drawnH);
    }
    if (drawnW < destW) {
      ctx.drawImage(src, src.width - 1, 0, 1, src.height, ox + drawnW, oy, destW - drawnW, drawnH);
    }
    ctx.restore();
  }

  // 9-slice FF window skin, painted once.
  function skin() {
    if (Art._skin) return Art._skin;
    var s = document.createElement("canvas");
    var n = 24;
    s.width = n;
    s.height = n;
    var g = s.getContext("2d");
    g.fillStyle = "#0a1848";
    g.fillRect(0, 0, n, n);
    g.fillStyle = "#163878";
    g.fillRect(4, 4, n - 8, n - 8);
    g.fillStyle = "#1e4c98";
    g.fillRect(6, 6, n - 12, 6);
    g.fillStyle = "#f4f0e4";
    g.fillRect(0, 0, n, 2);
    g.fillRect(0, n - 2, n, 2);
    g.fillRect(0, 0, 2, n);
    g.fillRect(n - 2, 0, 2, n);
    g.fillStyle = "#07102a";
    g.fillRect(2, 2, n - 4, 2);
    g.fillRect(2, n - 4, n - 4, 2);
    g.fillRect(2, 2, 2, n - 4);
    g.fillRect(n - 4, 2, 2, n - 4);
    g.fillStyle = "#8ec8f0";
    g.fillRect(4, 4, n - 8, 1);
    g.fillRect(4, 4, 1, n - 8);
    Art._skin = s;
    return s;
  }

  Art.window = function (ctx, x, y, w, h, opts) {
    if (!ctx || w < 8 || h < 8) return { x: x, y: y, w: w, h: h };
    opts = opts || {};
    var src = skin();
    var m = 8;
    x = Math.round(x);
    y = Math.round(y);
    w = Math.round(w);
    h = Math.round(h);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    function bit(sx, sy, sw, sh, dx, dy, dw, dh) {
      ctx.drawImage(src, sx, sy, sw, sh, dx, dy, dw, dh);
    }
    bit(0, 0, m, m, x, y, m, m);
    bit(16, 0, m, m, x + w - m, y, m, m);
    bit(0, 16, m, m, x, y + h - m, m, m);
    bit(16, 16, m, m, x + w - m, y + h - m, m, m);
    bit(8, 0, 8, m, x + m, y, w - m * 2, m);
    bit(8, 16, 8, m, x + m, y + h - m, w - m * 2, m);
    bit(0, 8, m, 8, x, y + m, m, h - m * 2);
    bit(16, 8, m, 8, x + w - m, y + m, m, h - m * 2);
    bit(8, 8, 8, 8, x + m, y + m, w - m * 2, h - m * 2);
    if (opts.title) {
      ctx.font = "700 12px Palatino, Georgia, serif";
      ctx.fillStyle = "#f0d878";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(String(opts.title), x + 12, y + 8);
    }
    ctx.restore();
    var pad = opts.title ? 26 : 12;
    return { x: x + 12, y: y + pad, w: w - 24, h: h - pad - 12 };
  };

  Art.preload = (function (prev) {
    return function () {
      if (prev) prev();
      Art.clouds();
      var i;
      for (i = 0; i < Art.BG_IDS.length; i++) plate(Art.BG_IDS[i], 120, 180);
    };
  })(Art.preload);
})();
