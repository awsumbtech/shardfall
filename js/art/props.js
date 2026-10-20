"use strict";

// Natural props and small props, drawn 1:1. A person is 24×38. A tree is
// about two of those high. Feet sit on ay. The field picks a variant from
// Art.fieldProp; placement stays where the map put it.
(function () {
  var C = Art.C;
  var plot = Art.plot;
  var fill = Art.fill;

  function add(id, maker) {
    Art.add(id, function () {
      var built = maker();
      var s = built.sprite || built;
      Art.outline(s);
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
        if (rad > 0.82 && ((x * 3 + y) & 3) === 0) continue;
        light = -nx * 0.8 - ny * 0.55;
        if (light > 0.55 && ny < 0.15) c = hi;
        else if (light > 0.18) c = lite;
        else if (ny > 0.28 || light < -0.32) c = deep;
        else c = mid;
        plot(s, cx + x, cy + y, c);
      }
    }
  }

  function sprig(s, x, y, c, hi) {
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

  function oak(w, h, ax, fruit) {
    var s = spr(w, h, ax, h - 3);
    var top = fruit ? 24 : 28;
    var deep = C.leafD;
    var mid = C.green;
    var lite = C.leaf;
    var hi = C.grassL;
    puff(s, ax - 1, top - 8, 10, 8, deep, mid, lite, hi);
    puff(s, ax + 12, top - 1, 11, 9, deep, mid, lite, hi);
    puff(s, ax - 13, top + 2, 10, 8, deep, mid, lite, hi);
    puff(s, ax, top + 1, 9, 7, deep, mid, lite, hi);
    puff(s, ax + 1, top + 7, 13, 8, deep, mid, lite, hi);
    puff(s, ax - 6, top + 11, 8, 5, deep, mid, lite, hi);
    puff(s, ax + 8, top - 10, 6, 5, deep, mid, lite, hi);
    trunk(s, ax - 3, top + 6, h - 4, 7);
    roots(s, ax - 3, h - 5, 7);
    sprig(s, ax - 20, top + 1, C.leaf, C.leafL);
    sprig(s, ax + 20, top + 4, C.green, C.grassL);
    sprig(s, ax - 6, top - 14, C.leaf, C.grassL);
    sprig(s, ax + 14, top - 8, C.greenD, C.leafL);
    sprig(s, ax + 4, top + 14, C.leaf, C.leafL);
    if (fruit) {
      fill(s, ax - 10, top + 2, 2, 2, C.hp);
      fill(s, ax + 8, top + 6, 2, 2, C.red);
      fill(s, ax - 2, top - 4, 2, 2, C.gold);
      plot(s, ax - 9, top + 3, C.lite);
      plot(s, ax + 9, top + 7, C.warm);
    }
    return { sprite: s, shade: shadow(s, ax + 1, h - 5, 16, 4, C.grassX) };
  }

  function makeOak() {
    return oak(54, 74, 26, false);
  }

  function makeBirch() {
    var s = spr(36, 78, 17, 75);
    var y;
    puff(s, 16, 8, 6, 6, C.leafD, C.green, C.leaf, C.grassL);
    puff(s, 12, 16, 7, 7, C.leafD, C.green, C.leaf, C.grassL);
    puff(s, 22, 18, 6, 7, C.leafD, C.leaf, C.grassL, C.leafL);
    puff(s, 16, 26, 8, 6, C.leafD, C.green, C.leaf, C.grassL);
    puff(s, 20, 32, 5, 4, C.greenD, C.green, C.leaf, C.leafL);
    fill(s, 15, 32, 5, 42, C.sand);
    fill(s, 15, 32, 1, 42, C.stoneD);
    fill(s, 19, 32, 1, 42, C.paper);
    for (y = 36; y < 70; y += 5) {
      plot(s, 16, y, C.ink);
      plot(s, 17, y + 1, C.stoneD);
      plot(s, 18, y + 2, C.ink);
    }
    fill(s, 13, 72, 3, 3, C.woodD);
    fill(s, 19, 72, 3, 3, C.wood);
    sprig(s, 8, 14, C.leaf, C.leafL);
    sprig(s, 26, 16, C.green, C.grassL);
    sprig(s, 15, 4, C.leaf, C.grassL);
    return { sprite: s, shade: shadow(s, 18, 73, 10, 3, C.grassX) };
  }

  function makePine() {
    var s = spr(44, 80, 21, 77);
    trunk(s, 19, 56, 76, 5);
    roots(s, 19, 74, 5);
    bough(s, 20, 40, 20, 16, C.leafD, C.greenD, C.leaf);
    bough(s, 23, 28, 16, 12, C.greenD, C.green, C.leafL);
    bough(s, 19, 16, 16, 9, C.leafD, C.leaf, C.grassL);
    bough(s, 22, 6, 14, 5, C.greenD, C.green, C.leafL);
    plot(s, 21, 4, C.leafL);
    return { sprite: s, shade: shadow(s, 22, 75, 12, 3, C.grassX) };
  }

  function makeApple() {
    return oak(50, 68, 24, true);
  }

  function makeGrove() {
    var s = spr(72, 76, 36, 73);
    roots(s, 20, 70, 6);
    roots(s, 44, 70, 7);
    puff(s, 22, 28, 16, 12, C.leafD, C.green, C.leaf, C.grassL);
    puff(s, 48, 22, 15, 13, C.leafD, C.green, C.leaf, C.grassL);
    puff(s, 36, 16, 12, 10, C.greenD, C.leaf, C.grassL, C.leafL);
    puff(s, 34, 34, 18, 9, C.leafD, C.green, C.leaf, C.grassL);
    puff(s, 14, 36, 8, 6, C.leafD, C.green, C.leaf, C.leafL);
    puff(s, 58, 32, 8, 6, C.greenD, C.green, C.leaf, C.grassL);
    trunk(s, 20, 40, 72, 6);
    trunk(s, 44, 36, 72, 7);
    sprig(s, 6, 30, C.leaf, C.leafL);
    sprig(s, 64, 20, C.green, C.grassL);
    sprig(s, 34, 6, C.leaf, C.grassL);
    sprig(s, 16, 18, C.greenD, C.leafL);
    plot(s, 22, 24, C.bloom);
    plot(s, 48, 22, C.warm);
    return { sprite: s, shade: shadow(s, 36, 71, 24, 4, C.grassX) };
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
    puff(s, ax, 13, wide ? 9 : 7, 4, C.greenD, C.green, C.leaf, C.grassL);
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

  function blades(s, spec, c, hi) {
    var i, b;
    for (i = 0; i < spec.length; i++) {
      b = spec[i];
      thick(s, b[0], b[1], b[2], b[3], 1, c, c);
      plot(s, b[2], b[3], hi);
      plot(s, b[2] + (b[2] > b[0] ? 1 : -1), b[3] + 1, hi);
    }
  }

  function makeTuft(bloom) {
    var s = spr(18, 16, 9, 14);
    ellipse(s, 9, 13, 6, 2, C.leafD);
    blades(s, [
      [4, 12, 2, 5],
      [6, 13, 5, 3],
      [9, 13, 8, 2],
      [11, 13, 13, 4],
      [14, 12, 16, 6],
      [8, 13, 7, 7]
    ], C.green, C.grassL);
    if (bloom) {
      plot(s, 8, 3, C.bloom);
      plot(s, 9, 2, C.bloom);
      plot(s, 7, 4, C.hp);
      plot(s, 8, 3, C.gold);
    }
    return { sprite: s, shade: shadow(s, 9, 14, 5, 2, C.grassX) };
  }

  function makeTuftB() {
    var s = spr(16, 14, 8, 12);
    ellipse(s, 8, 11, 5, 2, C.greenD);
    blades(s, [
      [3, 11, 2, 4],
      [6, 12, 5, 2],
      [9, 12, 10, 3],
      [12, 11, 14, 5]
    ], C.leaf, C.leafL);
    return { sprite: s, shade: shadow(s, 8, 12, 4, 2, C.grassX) };
  }

  function makeTuftDead(alt) {
    var s = spr(18, 14, 9, 12);
    ellipse(s, 9, 11, 6, 2, C.rock);
    blades(s, alt ? [
      [3, 11, 2, 6],
      [7, 12, 6, 4],
      [11, 12, 12, 3],
      [14, 11, 16, 6]
    ] : [
      [4, 11, 3, 5],
      [7, 12, 6, 3],
      [10, 12, 11, 4],
      [13, 11, 15, 6]
    ], C.ashD, C.ash);
    return { sprite: s, shade: shadow(s, 9, 12, 5, 2, C.void) };
  }

  function makeFlower(petal, petalD, heart, leaf) {
    var s = spr(15, 18, 7, 16);
    fill(s, 7, 9, 1, 7, leaf);
    ellipse(s, 4, 13, 3, 2, leaf);
    ellipse(s, 11, 14, 3, 2, C.leafD);
    plot(s, 5, 12, C.leafL);
    ellipse(s, 7, 5, 3, 3, petal);
    ellipse(s, 3, 7, 3, 2, petalD);
    ellipse(s, 11, 7, 3, 2, petal);
    ellipse(s, 5, 8, 2, 2, petalD);
    ellipse(s, 9, 8, 2, 2, petal);
    ellipse(s, 7, 6, 2, 2, heart);
    plot(s, 7, 6, C.lite);
    return { sprite: s, shade: shadow(s, 7, 16, 3, 1, C.grassX) };
  }

  function makeBlossom() {
    var s = spr(16, 18, 8, 16);
    fill(s, 8, 10, 1, 6, C.leaf);
    ellipse(s, 5, 14, 3, 2, C.leafD);
    ellipse(s, 8, 5, 3, 3, C.bloom);
    ellipse(s, 4, 7, 2, 2, C.hp);
    ellipse(s, 12, 7, 2, 2, C.bloom);
    ellipse(s, 8, 8, 2, 2, C.hp);
    plot(s, 8, 6, C.gold);
    plot(s, 7, 5, C.lite);
    return { sprite: s, shade: shadow(s, 8, 16, 3, 1, C.grassX) };
  }

  function rockBody(s, rows, x0, y0, lite, mid, dark) {
    var y, x, w, row, left;
    for (y = 0; y < rows.length; y++) {
      row = rows[y];
      w = row[0];
      left = x0 + row[1];
      for (x = 0; x < w; x++) {
        var c = mid;
        if (x < 2 || y < 2) c = lite;
        if (x > w - 3 || y > rows.length - 3) c = dark;
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

  add("tree_oak", makeOak);
  add("tree", makeOak);
  add("tree_birch", makeBirch);
  add("tree_pine", makePine);
  add("tree_apple", makeApple);
  add("tree_grove", makeGrove);
  add("tree_dead", makeDead);
  add("tree_dead_lean", makeDeadLean);
  add("tree_dead_snap", makeDeadSnap);
  add("tree_bare", makeBare);
  add("bush", function () { return makeBush(false); });
  add("bush_b", function () { return makeBush(true); });
  add("bush_dead", makeBushDead);
  add("tuft", function () { return makeTuft(false); });
  add("tuft_bloom", function () { return makeTuft(true); });
  add("tuft_b", makeTuftB);
  add("tuft_dead", function () { return makeTuftDead(false); });
  add("tuft_dead_b", function () { return makeTuftDead(true); });
  add("flower", function () { return makeFlower(C.bloom, C.hp, C.gold, C.leaf); });
  add("flower_gold", function () { return makeFlower(C.warm, C.gold, C.lite, C.leafD); });
  add("flower_tide", function () { return makeFlower(C.tideL, C.tide, C.foam, C.weed); });
  add("blossom", makeBlossom);
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
    "tree_oak", "tree_birch", "tree_pine", "tree_apple",
    "tree_grove", "tree_dead", "tree_dead_lean", "tree_dead_snap",
    "tree_bare", "bush", "bush_b", "bush_dead",
    "tuft", "tuft_b", "tuft_bloom", "tuft_dead",
    "flower", "flower_gold", "flower_tide", "blossom",
    "rock", "rock_b", "basalt", "basalt_b",
    "log", "log_char", "stump", "stump_char",
    "crate", "fence", "fence_burnt", "signpost"
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
      var tx = prop.x / 16;
      var ty = prop.y / 16;
      if (tx >= 38 && tx <= 66 && ty >= 16 && ty <= 58 && (h & 1) === 0) return "tree_grove";
      return ["tree_oak", "tree_birch", "tree_pine", "tree_apple"][h % 4];
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
})();
