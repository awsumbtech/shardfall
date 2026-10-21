"use strict";

// Natural props and small props, drawn 1:1. The field hero is about 20×28.
// A living tree is a bit under twice that, with a short wide trunk. Feet sit
// on ay. The field picks a variant from Art.fieldProp; placement stays where
// the map put it.
(function () {
  var C = Art.C;
  var plot = Art.plot;
  var fill = Art.fill;

  var swayX = 0;

  function add(id, maker, ink) {
    Art.add(id, function (pose, facing, frame) {
      swayX = [0, 1, 0, -1][(frame | 0) & 3];
      var built = maker();
      var s = built.sprite || built;
      Art.outline(s, ink || 1);
      if (built.shade) built.shade(s);
      return s;
    }, 1, 1);
  }

  function spr(w, h, ax, ay) {
    var s = Art.spr(w, h);
    s.ax = ax;
    s.ay = ay;
    return s;
  }

  function ellipse(s, cx, cy, rx, ry, c) {
    var y, x, nx, ny;
    if (rx < 1 || ry < 1) return;
    for (y = -ry; y <= ry; y++) {
      for (x = -rx; x <= rx; x++) {
        nx = x / rx;
        ny = y / ry;
        if (nx * nx + ny * ny <= 1) plot(s, cx + x, cy + y, c);
      }
    }
  }

  // One foliage puff. Several of these overlap into a canopy so the
  // silhouette is a cluster, not a disc on a stick.
  function puff(s, cx, cy, rx, ry, deep, mid, lite, hi) {
    var y, x, nx, ny, rad, light, c, squash;
    if (rx < 2 || ry < 2) return;
    for (y = -ry; y <= ry; y++) {
      for (x = -rx; x <= rx; x++) {
        nx = x / rx;
        ny = y / ry;
        squash = ny > 0.4 ? (ny - 0.4) * 0.9 : 0;
        rad = nx * nx + (ny + squash) * (ny + squash);
        if (rad > 1) continue;
        if (rad > 0.84 && ((x * 3 + y) & 3) === 0) continue;
        light = -nx * 0.85 - ny * 0.6;
        if (nx < -0.15 && ny < -0.28 && rad > 0.4) c = hi;
        else if (ny > 0.12 || light < -0.32) c = deep;
        else if (light > 0.3) c = lite;
        else c = mid;
        plot(s, cx + x + (ny < -0.22 ? swayX : 0), cy + y, c);
      }
    }
  }

  function rimLight(s, hi, extra) {
    var leaf = {};
    leaf[C.leaf] = 1;
    leaf[C.leafL] = 1;
    leaf[C.leafD] = 1;
    leaf[C.green] = 1;
    leaf[C.greenD] = 1;
    leaf[C.grass] = 1;
    leaf[C.grassL] = 1;
    if (extra) extra.forEach(function (c) { leaf[c] = 1; });
    var copy = new Uint8Array(s.d);
    var y, x, i;
    for (y = 1; y < s.h; y++) {
      for (x = 1; x < s.w; x++) {
        i = y * s.w + x;
        if (!leaf[copy[i]]) continue;
        if (!extra && (copy[i] === C.leafD || copy[i] === C.greenD)) continue;
        if (copy[i - s.w - 1]) continue;
        if (!extra && y + 1 < s.h && !copy[i + s.w]) continue;
        s.d[i] = hi;
      }
    }
  }

  function sprig(s, x, y, c, hi) {
    x += swayX;
    plot(s, x, y, hi);
    plot(s, x - 1, y + 1, c);
    plot(s, x + 1, y + 1, c);
    plot(s, x, y + 1, c);
    plot(s, x, y + 2, c);
  }

  function trunk(s, x, y0, y1, w) {
    fill(s, x, y0, w, y1 - y0, C.wood);
    fill(s, x, y0, 1, y1 - y0, C.woodD);
    fill(s, x + w - 1, y0, 1, y1 - y0, C.woodL);
    plot(s, x + 2, y0 + 4, C.woodD);
    plot(s, x + 1, y0 + 8, C.woodD);
    plot(s, x + w - 2, y0 + 6, C.woodL);
  }

  function roots(s, x, y, w) {
    fill(s, x - 2, y - 2, 2, 3, C.woodD);
    fill(s, x + w, y - 2, 2, 3, C.wood);
    plot(s, x - 3, y, C.woodD);
    plot(s, x + w + 2, y, C.wood);
  }

  function disk(s, cx, cy, r, c) {
    var y, x;
    for (y = -r; y <= r; y++) {
      for (x = -r; x <= r; x++) {
        if (x * x + y * y <= r * r) plot(s, cx + x, cy + y, c);
      }
    }
  }

  function thick(s, x0, y0, x1, y1, rad, body, edge) {
    var n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    var i, t, x, y, dx, dy;
    for (i = 0; i <= n; i++) {
      t = i / n;
      x = x0 + (x1 - x0) * t;
      y = y0 + (y1 - y0) * t;
      for (dy = -rad; dy <= rad; dy++) {
        for (dx = -rad; dx <= rad; dx++) {
          if (dx * dx + dy * dy > rad * rad + 0.2) continue;
          plot(s, Math.round(x + dx), Math.round(y + dy), (dx > 0 && dy > 0) ? edge : body);
        }
      }
    }
  }

  function shadeOval(s, cx, cy, rx, ry, c) {
    var y, x, nx, ny, e, edge;
    edge = c === C.void ? C.rock : C.greenD;
    for (y = -ry; y <= ry; y++) {
      for (x = -rx; x <= rx; x++) {
        nx = x / rx;
        ny = y / ry;
        e = nx * nx + ny * ny;
        if (e > 1) continue;
        if (cx + x < 0 || cy + y < 0 || cx + x >= s.w || cy + y >= s.h) continue;
        if (s.d[(cy + y) * s.w + (cx + x)]) continue;
        plot(s, cx + x, cy + y, e > 0.62 ? edge : c);
      }
    }
  }

  function shadow(s, cx, cy, rx, ry, c) {
    return function (spr) {
      shadeOval(spr, cx, cy, rx, ry, c);
    };
  }

  function bough(s, cx, top, height, half, deep, mid, lite) {
    var y, x, span, t;
    for (y = 0; y < height; y++) {
      t = height <= 1 ? 1 : y / (height - 1);
      span = Math.max(1, Math.round(half * (0.15 + 0.85 * t)));
      for (x = -span; x <= span; x++) {
        var col = mid;
        if (x <= -span + 1 || y < 2) col = lite;
        else if (x >= span - 1 || y > height - 3) col = deep;
        plot(s, cx + x, top + y, col);
      }
    }
  }

  // Four silhouettes. `small` is a slightly shorter, hue-shifted twin so a
  // grove does not repeat one canopy. Trunks are drawn first and the clumps
  // cover their tops, leaving a short wide stub.
  var LOOK = {
    oak: {
      w: 50, h: 46, trunk: 8, trunkFrom: 2,
      pal: [C.leafD, C.leaf, C.leafL, C.grassL],
      palB: [C.greenD, C.green, C.leaf, C.leafL],
      clumps: [[-11, -2, 8, 7], [12, 1, 8, 6], [-1, -10, 6, 5], [2, 8, 8, 5], [-16, 4, 5, 4], [16, -3, 4, 4], [-4, 3, 5, 4]],
      sprigs: [[-20, 1], [19, 0], [-3, -15], [10, 11]]
    },
    broad: {
      w: 54, h: 40, trunk: 8, trunkFrom: 2,
      pal: [C.greenD, C.leaf, C.grassL, C.sand],
      palB: [C.leafD, C.green, C.leafL, C.grassL],
      clumps: [[-14, 2, 9, 5], [14, 1, 9, 5], [0, -5, 7, 4], [-2, 7, 10, 3], [-20, 1, 4, 3], [20, 0, 4, 3]],
      sprigs: [[-24, 2], [23, 1], [0, -10], [-10, 8]]
    },
    birch: {
      w: 28, h: 50, trunk: 5, trunkFrom: 4, bark: "birch",
      pal: [C.leafD, C.green, C.leaf, C.grassL],
      palB: [C.greenD, C.leaf, C.leafL, C.grassL],
      clumps: [[-1, -14, 4, 4], [4, -6, 5, 4], [-5, -1, 4, 4], [1, 6, 5, 4], [6, 1, 3, 3], [-4, 11, 4, 3]],
      sprigs: [[-9, -8], [9, -4], [0, -18], [-5, 12]]
    },
    pine: {
      w: 34, h: 52, trunk: 6, trunkFrom: 8,
      pal: [C.greenD, C.green, C.leaf, C.leafL],
      palB: [C.leafD, C.greenD, C.green, C.leaf],
      clumps: [[0, -16, 3, 3], [-2, -10, 5, 3], [3, -9, 4, 3], [-6, -3, 5, 3], [6, -2, 5, 3], [-4, 4, 6, 3], [5, 5, 5, 3], [0, 9, 4, 3]],
      sprigs: [[-11, 1], [11, 0], [0, -20], [-7, 8]]
    }
  };

  function clumpTree(kind, small, fruit) {
    var spec = LOOK[kind];
    var w = spec.w - (small ? 6 : 0);
    var h = spec.h - (small ? 4 : 0);
    var ax = w >> 1;
    var s = spr(w, h, ax, h - 3);
    var pal = small ? spec.palB : spec.pal;
    var deep = pal[0];
    var mid = pal[1];
    var lite = pal[2];
    var hi = pal[3];
    var k = small ? 0.82 : 1;
    var cy = (h * 0.38) | 0;
    var tw = Math.max(4, spec.trunk - (small ? 1 : 0));
    var tx = ax - (tw >> 1);
    var top = cy + spec.trunkFrom;
    var i, c, y, sp;
    if (top > h - 16) top = h - 16;
    trunk(s, tx, top, h - 4, tw);
    roots(s, tx, h - 5, tw);
    if (spec.bark === "birch") {
      fill(s, tx, top, tw, (h - 4) - top, C.sand);
      fill(s, tx, top, 1, (h - 4) - top, C.stoneD);
      fill(s, tx + tw - 1, top, 1, (h - 4) - top, C.paper);
      for (y = top + 3; y < h - 8; y += 5) {
        plot(s, tx + 1, y, C.ink);
        if (tw > 3) plot(s, tx + 2, y + 1, C.stoneD);
      }
    }
    for (i = 0; i < spec.clumps.length; i++) {
      c = spec.clumps[i];
      puff(s, ax + Math.round(c[0] * k), cy + Math.round(c[1] * k), Math.max(3, Math.round(c[2] * k)), Math.max(3, Math.round(c[3] * k)), deep, mid, lite, hi);
    }
    for (i = 0; i < spec.sprigs.length; i++) {
      sp = spec.sprigs[i];
      sprig(s, ax + Math.round(sp[0] * k), cy + Math.round(sp[1] * k), mid, hi);
    }
    if (fruit) {
      fill(s, ax - 8, cy, 2, 2, C.hp);
      fill(s, ax + 6, cy + 3, 2, 2, C.red);
      fill(s, ax - 1, cy - 5, 2, 2, C.gold);
      plot(s, ax - 7, cy + 1, C.lite);
      plot(s, ax + 7, cy + 4, C.warm);
    }
    rimLight(s, hi);
    return { sprite: s, shade: shadow(s, ax, h - 4, Math.max(8, (w * 0.28) | 0), 3, C.grassX) };
  }

  function taper(s, x0, y0, x1, y1, r0, r1, body, edge) {
    var n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    var len = Math.hypot(x1 - x0, y1 - y0) || 1;
    var px = -(y1 - y0) / len;
    var py = (x1 - x0) / len;
    var i, t, x, y, rad, dx, dy, rr, jag;
    for (i = 0; i <= n; i++) {
      t = i / n;
      jag = (i % 5 === 0) ? 1 : (i % 5 === 3) ? -1 : 0;
      x = x0 + (x1 - x0) * t + px * jag;
      y = y0 + (y1 - y0) * t + py * jag;
      rad = r0 + (r1 - r0) * t;
      if (i % 7 === 4) rad *= 0.82;
      rr = rad * rad + 0.2;
      for (dy = -rad; dy <= rad; dy++) {
        for (dx = -rad; dx <= rad; dx++) {
          if (dx * dx + dy * dy > rr) continue;
          plot(s, Math.round(x + dx), Math.round(y + dy), (dx > rad * 0.25) ? edge : body);
        }
      }
      if (i % 8 === 5) plot(s, Math.round(x + px), Math.round(y + py), edge);
    }
  }

  function twig(s, x, y, dx, dy, n, c) {
    var i;
    for (i = 0; i < n; i++) plot(s, x + dx * i, y + dy * i, c);
  }

  function emberCrack(s, x, y) {
    plot(s, x, y, C.ember);
    plot(s, x, y + 1, C.emberH);
    plot(s, x + 1, y + 2, C.ember);
  }

  function makeDead() {
    var s = spr(48, 72, 22, 69);
    taper(s, 22, 66, 20, 48, 4, 3, C.void, C.ashD);
    taper(s, 20, 48, 23, 32, 3, 2, C.void, C.rock);
    taper(s, 23, 32, 18, 16, 2, 1, C.rock, C.ashD);
    taper(s, 19, 30, 8, 20, 2, 1, C.ashD, C.void);
    taper(s, 8, 20, 4, 14, 1, 0.6, C.stoneD, C.void);
    twig(s, 4, 14, -1, -1, 3, C.ash);
    taper(s, 22, 24, 36, 14, 2, 1, C.stoneD, C.void);
    taper(s, 36, 14, 42, 8, 1, 0.6, C.ashD, C.rock);
    twig(s, 42, 8, 1, -1, 3, C.ash);
    taper(s, 21, 42, 10, 38, 1.5, 0.6, C.rock, C.void);
    twig(s, 10, 38, -1, 0, 3, C.ashD);
    fill(s, 14, 64, 14, 4, C.rock);
    plot(s, 13, 66, C.ashD);
    plot(s, 29, 66, C.stoneD);
    emberCrack(s, 21, 50);
    plot(s, 22, 36, C.ember);
    rimLight(s, C.ash, [C.void, C.rock, C.ashD, C.stoneD]);
    return { sprite: s, shade: shadow(s, 22, 67, 12, 3, C.void) };
  }

  function makeDeadLean() {
    var s = spr(52, 66, 26, 63);
    taper(s, 16, 62, 24, 46, 4, 3, C.rock, C.void);
    taper(s, 24, 46, 32, 30, 3, 2, C.void, C.ashD);
    taper(s, 32, 30, 40, 16, 2, 1, C.ashD, C.void);
    twig(s, 40, 16, 1, -1, 4, C.ash);
    taper(s, 28, 36, 14, 26, 2, 1, C.void, C.rock);
    taper(s, 14, 26, 8, 20, 1, 0.6, C.stoneD, C.void);
    twig(s, 8, 20, -1, -1, 3, C.ashD);
    taper(s, 22, 52, 36, 48, 1.5, 0.6, C.ashD, C.rock);
    fill(s, 12, 60, 12, 3, C.stoneD);
    emberCrack(s, 26, 40);
    plot(s, 34, 24, C.emberH);
    rimLight(s, C.ash, [C.void, C.rock, C.ashD, C.stoneD]);
    return { sprite: s, shade: shadow(s, 24, 61, 14, 3, C.void) };
  }

  function makeDeadSnap() {
    var s = spr(46, 50, 16, 47);
    taper(s, 16, 46, 15, 30, 4, 3, C.void, C.ashD);
    taper(s, 15, 30, 18, 20, 3, 2, C.rock, C.void);
    twig(s, 16, 18, -1, -1, 3, C.ash);
    twig(s, 19, 19, 1, -1, 4, C.ashL);
    twig(s, 18, 20, 0, -1, 3, C.stoneL);
    taper(s, 18, 28, 32, 34, 2, 1, C.woodD, C.rock);
    taper(s, 32, 34, 40, 38, 1, 0.6, C.ashD, C.void);
    fill(s, 10, 44, 14, 3, C.rock);
    emberCrack(s, 16, 34);
    plot(s, 38, 36, C.ember);
    rimLight(s, C.ashL, [C.void, C.rock, C.ashD, C.stoneD, C.woodD]);
    return { sprite: s, shade: shadow(s, 16, 46, 11, 3, C.void) };
  }

  function makeBare() {
    var s = spr(44, 68, 20, 65);
    taper(s, 20, 62, 18, 44, 3, 2, C.woodD, C.wood);
    taper(s, 18, 44, 21, 26, 2, 1, C.wood, C.woodL);
    taper(s, 19, 32, 8, 22, 1.5, 0.6, C.woodD, C.cliffX);
    twig(s, 8, 22, -1, -1, 3, C.wood);
    taper(s, 21, 28, 34, 16, 1.5, 0.6, C.wood, C.woodD);
    twig(s, 34, 16, 1, -1, 3, C.woodL);
    taper(s, 19, 48, 32, 42, 1, 0.6, C.woodD, C.wood);
    fill(s, 14, 60, 12, 4, C.woodD);
    return { sprite: s, shade: shadow(s, 20, 63, 11, 3, C.grassX) };
  }

  function makeBush(wide) {
    var w = wide ? 36 : 30;
    var s = spr(w, 22, w >> 1, 19);
    var ax = w >> 1;
    puff(s, ax - 4, 10, wide ? 8 : 6, 6, C.leafD, C.green, C.leaf, C.grassL);
    puff(s, ax + 6, 9, wide ? 8 : 6, 5, C.leafD, C.leaf, C.grassL, C.leafL);
    puff(s, ax, 13, wide ? 9 : 7, 4, C.greenD, C.leaf, C.leafL, C.grassL);
    rimLight(s, C.grassL);
    sprig(s, ax - 12, 8, C.leaf, C.leafL);
    sprig(s, ax + 11, 7, C.green, C.grassL);
    fill(s, ax - 4, 9, 2, 2, C.bloom);
    plot(s, ax + 3, 10, C.warm);
    return { sprite: s, shade: shadow(s, ax + 1, 18, wide ? 12 : 9, 3, C.grassX) };
  }

  function makeBushDead() {
    var s = spr(30, 20, 15, 17);
    thick(s, 15, 16, 15, 8, 1, C.woodD, C.rock);
    thick(s, 15, 12, 6, 6, 1, C.ashD, C.void);
    thick(s, 6, 6, 4, 4, 1, C.stoneD, C.ashD);
    thick(s, 15, 10, 24, 5, 1, C.rock, C.ashD);
    thick(s, 24, 5, 27, 3, 1, C.ash, C.stoneD);
    thick(s, 15, 14, 22, 12, 1, C.woodD, C.rock);
    thick(s, 12, 14, 8, 11, 1, C.ashD, C.void);
    plot(s, 14, 9, C.ember);
    return { sprite: s, shade: shadow(s, 15, 16, 8, 2, C.void) };
  }

  function blade(s, x0, y0, x1, y1, c, hi) {
    var n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    var i, x, y;
    x1 += swayX;
    for (i = 0; i <= n; i++) {
      x = Math.round(x0 + (x1 - x0) * i / n);
      y = Math.round(y0 + (y1 - y0) * i / n);
      plot(s, x, y, i < 2 ? hi : c);
    }
  }

  function makeTuft(bloom) {
    var s = spr(18, 16, 9, 14);
    ellipse(s, 9, 13, 5, 2, C.leafD);
    blade(s, 4, 12, 2, 4, C.green, C.grassL);
    blade(s, 6, 13, 5, 2, C.leaf, C.leafL);
    blade(s, 9, 13, 8, 1, C.green, C.grassL);
    blade(s, 11, 13, 13, 3, C.greenD, C.leafL);
    blade(s, 14, 12, 16, 5, C.leaf, C.grassL);
    blade(s, 8, 13, 7, 6, C.green, C.leafL);
    plot(s, 8 + swayX, 1, C.sand);
    if (bloom) {
      plot(s, 5, 2, C.bloom);
      plot(s, 6, 1, C.hp);
      plot(s, 4, 3, C.gold);
      plot(s, 13, 3, C.warm);
      plot(s, 14, 4, C.gold);
      plot(s, 13, 4, C.lite);
    }
    return { sprite: s, shade: shadow(s, 9, 14, 5, 2, C.grassX) };
  }

  function makeTuftB() {
    var s = spr(16, 12, 8, 10);
    ellipse(s, 8, 9, 5, 2, C.greenD);
    blade(s, 3, 9, 2, 6, C.leaf, C.grassL);
    blade(s, 5, 9, 4, 5, C.green, C.leafL);
    blade(s, 8, 9, 8, 4, C.green, C.grassL);
    blade(s, 11, 9, 12, 5, C.leaf, C.leafL);
    blade(s, 13, 9, 14, 6, C.greenD, C.grassL);
    plot(s, 7, 7, C.grassL);
    plot(s, 9, 8, C.leafL);
    return { sprite: s, shade: shadow(s, 8, 10, 4, 2, C.grassX) };
  }

  function makeTuftDead(alt) {
    var s = spr(18, 14, 9, 12);
    ellipse(s, 9, 11, 6, 2, C.rock);
    if (alt) {
      blade(s, 3, 11, 2, 6, C.ashD, C.ash);
      blade(s, 7, 12, 6, 4, C.ashD, C.ash);
      blade(s, 11, 12, 12, 3, C.ashD, C.ash);
      blade(s, 14, 11, 16, 6, C.ashD, C.ash);
    } else {
      blade(s, 4, 11, 3, 5, C.ashD, C.ash);
      blade(s, 7, 12, 6, 3, C.ashD, C.ash);
      blade(s, 10, 12, 11, 4, C.ashD, C.ash);
      blade(s, 13, 11, 15, 6, C.ashD, C.ash);
    }
    return { sprite: s, shade: shadow(s, 9, 12, 5, 2, C.void) };
  }

  function blob(s, x, y, c, hi) {
    fill(s, x - 1, y, 3, 3, c);
    plot(s, x, y - 1, c);
    plot(s, x, y, hi);
    plot(s, x - 1, y + 1, c);
  }

  function flowerStem(s, leaf) {
    var x = 7 + swayX;
    fill(s, 7, 11, 1, 5, leaf);
    fill(s, 4, 13, 4, 2, leaf);
    fill(s, 8, 14, 4, 2, C.leafD);
    plot(s, 4, 13, C.leafL);
    plot(s, 11, 14, C.leafL);
    return x;
  }

  function makeFlower() {
    var s = spr(15, 18, 7, 16);
    var x = flowerStem(s, C.leaf);
    blob(s, x, 3, C.bloom, C.lite);
    blob(s, x - 3, 5, C.hp, C.bloom);
    blob(s, x + 3, 5, C.bloom, C.lite);
    blob(s, x - 2, 8, C.hp, C.bloom);
    blob(s, x + 2, 8, C.bloom, C.hp);
    fill(s, x - 1, 5, 3, 3, C.gold);
    plot(s, x, 5, C.lite);
    return { sprite: s, shade: shadow(s, 7, 16, 3, 1, C.grassX) };
  }

  function makeFlowerGold() {
    var s = spr(15, 18, 7, 16);
    var x = flowerStem(s, C.leafD);
    fill(s, x - 2, 3, 5, 2, C.warm);
    fill(s, x - 3, 5, 7, 4, C.gold);
    fill(s, x - 4, 8, 9, 2, C.goldD);
    fill(s, x - 1, 4, 3, 3, C.lite);
    plot(s, x, 5, C.white);
    plot(s, x - 3, 9, C.goldD);
    plot(s, x + 3, 9, C.warm);
    plot(s, x, 10, C.gold);
    return { sprite: s, shade: shadow(s, 7, 16, 3, 1, C.grassX) };
  }

  function makeFlowerTide() {
    var s = spr(15, 18, 7, 16);
    var x = flowerStem(s, C.weed);
    fill(s, x, 1, 1, 9, C.tideL);
    fill(s, x - 1, 2, 3, 6, C.tide);
    fill(s, x - 4, 4, 9, 2, C.tideL);
    fill(s, x - 3, 5, 7, 2, C.tide);
    plot(s, x, 1, C.foam);
    plot(s, x - 4, 4, C.foam);
    plot(s, x + 4, 4, C.lite);
    fill(s, x - 1, 4, 3, 2, C.foam);
    plot(s, x, 4, C.white);
    return { sprite: s, shade: shadow(s, 7, 16, 3, 1, C.grassX) };
  }

  function makeBlossom() {
    var s = spr(16, 18, 8, 16);
    fill(s, 8, 9, 1, 7, C.leaf);
    ellipse(s, 4, 13, 3, 2, C.leafD);
    ellipse(s, 12, 14, 3, 2, C.green);
    blob(s, 5, 4, C.bloom, C.lite);
    blob(s, 11, 5, C.hp, C.bloom);
    blob(s, 8, 8, C.warm, C.gold);
    plot(s, 5, 4, C.gold);
    plot(s, 11, 5, C.lite);
    plot(s, 8, 8, C.white);
    return { sprite: s, shade: shadow(s, 8, 16, 3, 1, C.grassX) };
  }

  function rockBody(s, rows, x0, y0, lite, mid, dark) {
    var y, x, w, row, left, n, c;
    n = rows.length;
    for (y = 0; y < n; y++) {
      row = rows[y];
      w = row[0];
      left = x0 + row[1];
      for (x = 0; x < w; x++) {
        c = mid;
        if (x < w * 0.38 && y < n * 0.62) c = lite;
        else if (x > w * 0.62 || y > n * 0.72) c = dark;
        if (y === 0 || x === 0) c = lite;
        if (y === n - 1 || x === w - 1) c = dark;
        if (x === (w >> 1) + (y >> 1) || x === (w >> 1) + (y >> 1) - 1) c = dark;
        plot(s, left + x, y0 + y, c);
      }
    }
  }

  function makeRock() {
    var s = spr(20, 14, 10, 12);
    rockBody(s, [
      [8, 6],
      [12, 4],
      [16, 2],
      [18, 1],
      [18, 1],
      [16, 2],
      [14, 3],
      [10, 5]
    ], 0, 2, C.stoneL, C.stone, C.stoneD);
    plot(s, 7, 6, C.ashL);
    plot(s, 12, 8, C.stoneD);
    plot(s, 13, 9, C.rock);
    return { sprite: s, shade: shadow(s, 11, 12, 7, 2, C.grassX) };
  }

  function makeRockB() {
    var s = spr(14, 11, 7, 9);
    rockBody(s, [
      [6, 4],
      [10, 2],
      [12, 1],
      [10, 2],
      [8, 3]
    ], 0, 2, C.ashL, C.stoneD, C.rock);
    plot(s, 5, 4, C.stoneL);
    return { sprite: s, shade: shadow(s, 7, 9, 5, 2, C.grassX) };
  }

  function makeBasalt(alt) {
    var s = spr(alt ? 16 : 22, 14, alt ? 8 : 11, 12);
    rockBody(s, alt ? [
      [5, 5],
      [9, 3],
      [13, 1],
      [12, 2],
      [8, 4]
    ] : [
      [8, 6],
      [14, 3],
      [18, 1],
      [16, 2],
      [12, 4],
      [8, 6]
    ], 0, 2, C.ash, C.rock, C.void);
    plot(s, alt ? 7 : 10, 6, C.ember);
    plot(s, alt ? 8 : 11, 7, C.emberH);
    return { sprite: s, shade: shadow(s, alt ? 8 : 12, 12, alt ? 5 : 8, 2, C.void) };
  }

  function makeLog(charred) {
    var s = spr(36, 16, 18, 14);
    var body = charred ? C.rock : C.wood;
    var dark = charred ? C.void : C.woodD;
    var lite = charred ? C.ashD : C.woodL;
    var end = charred ? C.ash : C.sand;
    ellipse(s, 8, 8, 5, 5, dark);
    ellipse(s, 8, 8, 3, 3, end);
    ellipse(s, 8, 8, 1, 1, lite);
    fill(s, 8, 4, 22, 8, body);
    fill(s, 8, 4, 22, 2, lite);
    fill(s, 8, 10, 22, 2, dark);
    plot(s, 14, 7, dark);
    plot(s, 18, 8, dark);
    plot(s, 24, 6, dark);
    ellipse(s, 30, 8, 4, 5, dark);
    ellipse(s, 30, 8, 2, 3, charred ? C.ashD : C.wood);
    if (charred) {
      plot(s, 22, 8, C.ember);
      plot(s, 23, 9, C.emberH);
    } else {
      plot(s, 16, 5, C.leaf);
      plot(s, 17, 4, C.leafL);
    }
    return { sprite: s, shade: shadow(s, 18, 14, 12, 2, charred ? C.void : C.grassX) };
  }

  function makeStump(charred) {
    var s = spr(22, 16, 11, 14);
    var bark = charred ? C.void : C.woodD;
    var side = charred ? C.rock : C.wood;
    var top = charred ? C.ashD : C.sand;
    var ring = charred ? C.ash : C.woodL;
    fill(s, 4, 8, 14, 6, side);
    fill(s, 4, 8, 2, 6, bark);
    fill(s, 16, 8, 2, 6, bark);
    ellipse(s, 11, 8, 8, 4, side);
    ellipse(s, 11, 7, 6, 3, top);
    ellipse(s, 11, 7, 3, 2, ring);
    plot(s, 11, 7, bark);
    plot(s, 8, 8, bark);
    plot(s, 14, 6, bark);
    if (charred) {
      plot(s, 11, 6, C.ember);
      plot(s, 12, 7, C.emberH);
    } else {
      plot(s, 16, 5, C.leafL);
      plot(s, 17, 6, C.leaf);
      plot(s, 16, 7, C.green);
    }
    return { sprite: s, shade: shadow(s, 12, 14, 8, 2, charred ? C.void : C.grassX) };
  }

  function makeCrate() {
    var s = spr(20, 18, 10, 16);
    fill(s, 3, 6, 12, 9, C.wood);
    fill(s, 3, 6, 12, 2, C.woodL);
    fill(s, 3, 13, 12, 2, C.woodD);
    fill(s, 8, 6, 1, 9, C.woodD);
    fill(s, 3, 10, 12, 1, C.woodD);
    fill(s, 14, 4, 3, 10, C.woodD);
    fill(s, 14, 4, 3, 1, C.wood);
    fill(s, 4, 2, 11, 4, C.woodL);
    fill(s, 5, 3, 9, 1, C.sand);
    plot(s, 4, 7, C.ink);
    plot(s, 13, 7, C.ink);
    plot(s, 4, 13, C.ink);
    plot(s, 13, 13, C.ink);
    plot(s, 15, 6, C.ashD);
    plot(s, 6, 4, C.wood);
    return { sprite: s, shade: shadow(s, 10, 16, 7, 2, C.grassX) };
  }

  function makeFence(burnt) {
    var s = spr(42, 26, 21, 23);
    var post = burnt ? C.void : C.woodD;
    var postL = burnt ? C.ashD : C.wood;
    var rail = burnt ? C.rock : C.woodL;
    var railD = burnt ? C.ashD : C.wood;
    fill(s, 3, 6, 4, 16, postL);
    fill(s, 3, 6, 1, 16, post);
    fill(s, 3, 4, 4, 2, post);
    plot(s, 4, 3, postL);
    fill(s, 34, 6, 4, 16, postL);
    fill(s, 37, 6, 1, 16, post);
    fill(s, 34, 4, 4, 2, post);
    plot(s, 35, 3, burnt ? C.ash : C.woodL);
    fill(s, 6, 8, 29, 3, rail);
    fill(s, 6, 10, 29, 1, railD);
    if (burnt) {
      fill(s, 6, 16, 12, 3, rail);
      fill(s, 24, 16, 10, 3, rail);
      plot(s, 18, 17, C.ember);
      plot(s, 36, 8, C.emberH);
    } else {
      fill(s, 6, 16, 29, 3, rail);
      fill(s, 6, 18, 29, 1, railD);
    }
    plot(s, 6, 9, C.ink);
    plot(s, 33, 9, C.ink);
    plot(s, 6, 17, C.ink);
    plot(s, 33, 17, C.ink);
    return { sprite: s, shade: shadow(s, 21, 23, 16, 2, burnt ? C.void : C.grassX) };
  }

  function makeSign() {
    var s = spr(24, 34, 12, 32);
    fill(s, 10, 14, 3, 18, C.woodD);
    fill(s, 12, 14, 1, 18, C.woodL);
    fill(s, 8, 30, 7, 2, C.wood);
    fill(s, 2, 4, 20, 10, C.woodL);
    fill(s, 2, 4, 20, 2, C.wood);
    fill(s, 2, 12, 20, 2, C.woodD);
    fill(s, 3, 7, 8, 2, C.ink);
    fill(s, 12, 8, 6, 2, C.woodD);
    plot(s, 17, 7, C.ink);
    plot(s, 18, 8, C.ink);
    plot(s, 17, 9, C.ink);
    plot(s, 4, 5, C.ink);
    plot(s, 19, 5, C.ink);
    plot(s, 4, 12, C.ink);
    plot(s, 19, 12, C.ink);
    return { sprite: s, shade: shadow(s, 12, 32, 6, 2, C.grassX) };
  }

  function makeChest() {
    var s = spr(20, 16, 10, 14);
    fill(s, 2, 2, 16, 5, C.woodL);
    fill(s, 2, 2, 16, 1, C.sand);
    fill(s, 2, 6, 16, 2, C.gold);
    fill(s, 2, 6, 16, 1, C.warm);
    fill(s, 2, 8, 16, 5, C.wood);
    fill(s, 2, 8, 2, 5, C.woodL);
    fill(s, 16, 8, 2, 5, C.woodD);
    fill(s, 2, 11, 16, 2, C.woodD);
    fill(s, 2, 2, 3, 2, C.gold);
    fill(s, 15, 2, 3, 2, C.gold);
    fill(s, 2, 11, 3, 2, C.goldD);
    fill(s, 15, 11, 3, 2, C.goldD);
    fill(s, 8, 5, 4, 5, C.goldD);
    fill(s, 9, 6, 2, 3, C.gold);
    plot(s, 9, 7, C.ink);
    plot(s, 10, 7, C.gold);
    fill(s, 3, 13, 2, 2, C.woodD);
    fill(s, 15, 13, 2, 2, C.woodD);
    if (swayX === 1) {
      plot(s, 5, 3, C.white);
      plot(s, 6, 3, C.lite);
      plot(s, 5, 4, C.warm);
      plot(s, 14, 4, C.white);
    }
    return { sprite: s, shade: shadow(s, 10, 14, 8, 2, C.grassX) };
  }

  function makeChestOpen() {
    var s = spr(20, 18, 10, 16);
    fill(s, 2, 1, 16, 3, C.woodL);
    fill(s, 2, 1, 16, 1, C.sand);
    fill(s, 3, 2, 14, 1, C.woodD);
    fill(s, 2, 3, 16, 2, C.gold);
    fill(s, 2, 5, 16, 8, C.wood);
    fill(s, 2, 5, 2, 8, C.woodL);
    fill(s, 16, 5, 2, 8, C.woodD);
    fill(s, 2, 11, 16, 2, C.woodD);
    fill(s, 4, 6, 12, 4, C.gold);
    fill(s, 5, 7, 10, 2, C.goldD);
    plot(s, 7, 7, C.shardH);
    plot(s, 11, 8, C.warm);
    plot(s, 9, 8, C.white);
    fill(s, 8, 4, 4, 3, C.goldD);
    fill(s, 2, 2, 2, 2, C.gold);
    fill(s, 16, 2, 2, 2, C.gold);
    fill(s, 3, 14, 2, 2, C.woodD);
    fill(s, 15, 14, 2, 2, C.woodD);
    return { sprite: s, shade: shadow(s, 10, 16, 8, 2, C.grassX) };
  }

  function makeBarrel() {
    var s = spr(14, 16, 7, 14);
    ellipse(s, 7, 8, 5, 6, C.wood);
    ellipse(s, 5, 7, 2, 4, C.woodL);
    var bx, by, bi;
    for (by = 4; by <= 11; by++) {
      if (by !== 4 && by !== 5 && by !== 10 && by !== 11) continue;
      for (bx = 2; bx < 12; bx++) {
        bi = by * s.w + bx;
        if (!s.d[bi]) continue;
        s.d[bi] = (by === 4 || by === 10) ? (bx < 6 ? C.metal : C.metalD) : C.ashD;
      }
    }
    plot(s, 4, 6, C.woodD);
    plot(s, 4, 8, C.woodD);
    plot(s, 7, 7, C.woodD);
    plot(s, 7, 9, C.woodD);
    plot(s, 10, 6, C.woodD);
    plot(s, 10, 8, C.woodD);
    plot(s, 6, 3, C.woodL);
    plot(s, 8, 3, C.sand);
    return { sprite: s, shade: shadow(s, 7, 14, 5, 2, C.grassX) };
  }

  function regTree(id, kind, small, fruit) {
    add(id, function () { return clumpTree(kind, small, fruit); });
  }
  regTree("tree_oak", "oak", false, false);
  regTree("tree", "oak", false, false);
  regTree("tree_oak_b", "oak", true, false);
  regTree("tree_broad", "broad", false, false);
  regTree("tree_broad_b", "broad", true, false);
  regTree("tree_birch", "birch", false, false);
  regTree("tree_birch_b", "birch", true, false);
  regTree("tree_pine", "pine", false, false);
  regTree("tree_pine_b", "pine", true, false);
  regTree("tree_apple", "oak", true, true);
  regTree("tree_grove", "broad", false, false);
  add("tree_dead", makeDead);
  add("tree_dead_lean", makeDeadLean);
  add("tree_dead_snap", makeDeadSnap);
  add("tree_bare", makeBare);
  add("bush", function () { return makeBush(false); });
  add("bush_b", function () { return makeBush(true); });
  add("bush_dead", makeBushDead);
  add("tuft", function () { return makeTuft(false); }, C.greenD);
  add("tuft_bloom", function () { return makeTuft(true); }, C.greenD);
  add("tuft_b", makeTuftB, C.greenD);
  add("tuft_dead", function () { return makeTuftDead(false); }, C.ashD);
  add("tuft_dead_b", function () { return makeTuftDead(true); }, C.ashD);
  add("flower", makeFlower);
  add("flower_gold", makeFlowerGold);
  add("flower_tide", makeFlowerTide);
  add("blossom", makeBlossom);
  add("chest", makeChest);
  add("chest_open", makeChestOpen);
  add("barrel", makeBarrel);
  add("rock", makeRock);
  add("rock_b", makeRockB);
  add("basalt", function () { return makeBasalt(false); });
  add("basalt_b", function () { return makeBasalt(true); });
  add("log", function () { return makeLog(false); });
  add("log_char", function () { return makeLog(true); });
  add("stump", function () { return makeStump(false); });
  add("stump_char", function () { return makeStump(true); });
  add("crate", makeCrate);
  add("fence", function () { return makeFence(false); });
  add("fence_burnt", function () { return makeFence(true); });
  add("signpost", makeSign);

  Art.PROP_IDS = [
    "tree_oak", "tree_oak_b", "tree_broad", "tree_broad_b",
    "tree_birch", "tree_birch_b", "tree_pine", "tree_pine_b", "tree_apple",
    "tree_grove", "tree_dead", "tree_dead_lean", "tree_dead_snap",
    "tree_bare", "bush", "bush_b", "bush_dead",
    "tuft", "tuft_b", "tuft_bloom", "tuft_dead",
    "flower", "flower_gold", "flower_tide", "blossom",
    "rock", "rock_b", "basalt", "basalt_b",
    "log", "log_char", "stump", "stump_char",
    "crate", "barrel", "chest", "chest_open",
    "fence", "fence_burnt", "signpost"
  ];

  function mix(x, y, n) {
    var h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul((n | 0) + 1, 1442695041)) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
    return (h ^ (h >>> 16)) >>> 0;
  }

  function onQuay(prop) {
    return prop.y >= 74 * 16 && prop.x >= 20 * 16 && prop.x <= 96 * 16;
  }

  // Which sprite a placed prop draws. Empty string means the scatter was
  // thinned out: the spot stays, the clump is not painted.
  Art.fieldProp = function (prop, island) {
    if (!prop || !prop.kind) return "";
    var id = prop.kind;
    var h = mix(prop.x, prop.y, 5);
    var ash = island === "cinderveil" && !onQuay(prop);
    if (id === "tuft") {
      if ((h % 3) !== 0) return "";
      if (ash) return (h & 1) ? "tuft_dead_b" : "tuft_dead";
      if ((h % 5) === 0) return "tuft_bloom";
      return (h & 1) ? "tuft_b" : "tuft";
    }
    if (id === "tree") {
      if (ash) return ["tree_dead", "tree_dead_lean", "tree_dead_snap"][h % 3];
      var living = ["tree_oak", "tree_broad", "tree_birch", "tree_pine", "tree_oak_b", "tree_broad_b", "tree_birch_b", "tree_pine_b"];
      if ((h % 13) === 0) return "tree_apple";
      return living[h % 8];
    }
    if (id === "bush") {
      if (ash) return "bush_dead";
      return (h & 1) ? "bush_b" : "bush";
    }
    if (id === "rock") {
      if (ash) return (h & 1) ? "basalt_b" : "basalt";
      return (h % 3) === 0 ? "rock_b" : "rock";
    }
    if (id === "stump") return ash ? "stump_char" : "stump";
    if (id === "log") return ash ? "log_char" : "log";
    return id;
  };

  // Four cached frames. The field draw always asks for frame 0, so the
  // wind and the lamp pick a frame from the clock unless motion is reduced.
  var windRate = {
    tree: 1.5, tree_oak: 1.5, tree_oak_b: 1.5, tree_broad: 1.4, tree_broad_b: 1.4,
    tree_birch: 1.6, tree_birch_b: 1.6, tree_pine: 1.2, tree_pine_b: 1.2,
    tree_apple: 1.5, tree_grove: 1.4,
    bush: 1.8, bush_b: 1.8,
    tuft: 2.2, tuft_b: 2.2, tuft_bloom: 2.2, tuft_dead: 1.6, tuft_dead_b: 1.6,
    flower: 2, flower_gold: 2, flower_tide: 2, blossom: 2,
    skiff: 1.4,
    chest: 0.85
  };
  var canopyIds = {
    tree: 1, tree_oak: 1, tree_oak_b: 1, tree_broad: 1, tree_broad_b: 1,
    tree_birch: 1, tree_birch_b: 1, tree_pine: 1, tree_pine_b: 1,
    tree_apple: 1, tree_grove: 1
  };

  function heroUnderCanopy(id, x, y, opts) {
    if (!canopyIds[id] || !window.SF || !SF.state || !SF.state.player) return false;
    var p = SF.state.player;
    if (!(y > p.y)) return false;
    var sz = Art.spriteSize(id, "walk", "down");
    if (!sz || !sz.h) return false;
    var scale = opts && opts.scale > 0 ? opts.scale : 1;
    var left = x - sz.ax * scale;
    var top = y - sz.ay * scale;
    var right = left + sz.w * scale;
    var canopyBottom = top + sz.h * scale * 0.72;
    return left < p.x + 13 && right > p.x - 13 && top < p.y - 2 && canopyBottom > p.y - 36;
  }
  var glowRate = {
    lamp_lit: 3, great_lamp_lit: 2.2, cottage: 1.6, workshop: 1.6
  };
  var drawSprite = Art.sprite;
  Art.sprite = function (ctx, id, x, y, opts) {
    var rate = windRate[id];
    var still = !!(window.SF && SF.reduceMotion);
    if (!rate && glowRate[id]) {
      rate = glowRate[id];
      still = !!(window.SF && SF.calm && SF.calm());
    }
    if (rate && !still) {
      opts = Object.assign({}, opts || {});
      opts.frame = Math.floor(((window.SF && SF.anim) || 0) * rate) & 3;
    }
    var fade = heroUnderCanopy(id, x, y, opts);
    if (fade) {
      ctx.save();
      ctx.globalAlpha *= 0.4;
    }
    var drawn = drawSprite(ctx, id, x, y, opts);
    if (fade) ctx.restore();
    return drawn;
  };
})();
