"use strict";

// Act 1 structures. Sprites are 1:1 with the field (Art.fieldScale is 1).
// The hero is about 20×28. Maren's cottage rises about three of those
// (ridge to feet ~84px, chimney cap included ~89px).
// Cottage and workshop chimneys sit on the smoke point in draw.js:
// world (prop.x + 30, prop.y - 86) → sprite (ax + 30, ay - 86).
// The great lamp is a short iron post. Its crystal center is local y = 18
// (ay 70). Drawn at lamp.y + 10, that is lamp.y - Art.lampCrystalDy.
(function () {
  var C = Art.C;
  var plot = Art.plot;
  var fill = Art.fill;

  function shadeFeet(s, rx, c, edge) {
    var cx = s.ax;
    var cy = Math.min(s.h - 2, s.ay - 1);
    var ry = 3;
    var y, x, nx, ny, e;
    for (y = -ry; y <= ry; y++) {
      for (x = -rx; x <= rx; x++) {
        nx = x / rx;
        ny = y / ry;
        e = nx * nx + ny * ny;
        if (e > 1) continue;
        if (cx + x < 0 || cy + y < 0 || cx + x >= s.w || cy + y >= s.h) continue;
        if (s.d[(cy + y) * s.w + (cx + x)]) continue;
        plot(s, cx + x, cy + y, e > 0.62 ? (edge || C.greenD) : c);
      }
    }
  }

  function prop(id, maker) {
    Art.add(id, function (pose, facing, frame) {
      var s = maker(frame | 0);
      Art.outline(s);
      if (id === "cottage" || id === "hut") shadeFeet(s, 28, C.grassX);
      else if (id === "workshop") shadeFeet(s, 28, C.void);
      else if (id === "great_lamp" || id === "great_lamp_lit") shadeFeet(s, 12, C.grassX);
      else if (id === "skiff") shadeFeet(s, 22, C.tideD);
      else if (id === "lamp_lit" || id === "lamp_cold") shadeFeet(s, 6, C.grassX);
      else if (id === "stall") shadeFeet(s, 16, C.grassX);
      else if (id === "ruin") shadeFeet(s, 18, C.grassX);
      else if (id === "inn") shadeFeet(s, 8, C.grassX);
      else if (id === "vault_door") shadeFeet(s, 12, C.void, C.rock);
      return s;
    }, 2, 1);
  }

  function line(s, x0, y0, x1, y1, c) {
    var n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) | 0;
    var i;
    if (!n) {
      plot(s, x0, y0, c);
      return;
    }
    for (i = 0; i <= n; i++) {
      plot(s, Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), c);
    }
  }

  function disc(s, cx, cy, r, c) {
    var y, x;
    for (y = -r; y <= r; y++) {
      for (x = -r; x <= r; x++) {
        if (x * x + y * y <= r * r + r * 0.35) plot(s, cx + x, cy + y, c);
      }
    }
  }

  function fillPoly(s, pts, cFn) {
    var i, y, minY = 9999, maxY = -9999;
    for (i = 0; i < pts.length; i++) {
      if (pts[i][1] < minY) minY = pts[i][1];
      if (pts[i][1] > maxY) maxY = pts[i][1];
    }
    for (y = Math.ceil(minY); y <= Math.floor(maxY); y++) {
      var nodes = [];
      var j = pts.length - 1;
      for (i = 0; i < pts.length; i++) {
        var yi = pts[i][1], yj = pts[j][1];
        var xi = pts[i][0], xj = pts[j][0];
        if ((yi <= y && yj > y) || (yj <= y && yi > y)) {
          nodes.push(xi + (y - yi) * (xj - xi) / (yj - yi));
        }
        j = i;
      }
      nodes.sort(function (a, b) { return a - b; });
      var n, x, x0, x1, c;
      for (n = 0; n + 1 < nodes.length; n += 2) {
        x0 = Math.ceil(nodes[n]);
        x1 = Math.floor(nodes[n + 1]);
        for (x = x0; x <= x1; x++) {
          c = typeof cFn === "function" ? cFn(x, y) : cFn;
          if (c) plot(s, x, y, c);
        }
      }
    }
  }

  function spanAt(y, peak, left, right) {
    if (y < peak[1] || y > left[1]) return null;
    var t = (y - peak[1]) / (left[1] - peak[1] || 1);
    return [
      peak[0] + (left[0] - peak[0]) * t,
      peak[0] + (right[0] - peak[0]) * t
    ];
  }

  function roofCap(s, peak, left, right, thick, colorFn) {
    var y, y1 = left[1];
    for (y = peak[1]; y <= y1; y++) {
      var span = spanAt(y, peak, left, right);
      if (!span) continue;
      var x, x0 = Math.ceil(span[0]), x1 = Math.floor(span[1]);
      for (x = x0; x <= x1; x++) {
        var edge = Math.min(x - span[0], span[1] - x);
        var base = y1 - y;
        if (edge > thick && base > thick) continue;
        plot(s, x, y, colorFn(x, y, edge, base));
      }
    }
  }

  function thatchTone(x, y, cx) {
    var row = Math.floor(y / 3);
    var shift = (row & 1) ? 3 : 0;
    var along = (x + shift) % 6;
    var right = x > cx + 8;
    if (along === 5 || y % 3 === 2) return right ? C.woodD : C.wood;
    if (right) return (x + row) % 2 ? C.pathD : C.goldD;
    return (x + row) % 2 ? C.pathL : C.sand;
  }

  function shingleTone(x, y, cx) {
    var row = (y % 4) === 0;
    var course = Math.floor((x + (Math.floor(y / 4) & 1 ? 3 : 0)) / 5);
    var right = x > cx + 2;
    if (row) return right ? C.ink : C.stoneD;
    if ((course + y) % 5 === 0) return right ? C.ashD : C.ash;
    return right ? C.stoneD : (course % 2 ? C.stone : C.stoneL);
  }

  function stoneCourses(s, x, y, w, h, lite, mid, dark) {
    var row, col, yy, xx, shade;
    for (yy = 0; yy < h; yy++) {
      row = Math.floor(yy / 4);
      for (xx = 0; xx < w; xx++) {
        col = xx + (row & 1 ? 2 : 0);
        shade = mid;
        if (yy % 4 === 0) shade = dark;
        else if (col % 7 === 0) shade = dark;
        else if (xx < 2 || yy % 4 === 1) shade = lite;
        plot(s, x + xx, y + yy, shade);
      }
    }
  }

  function timberPost(s, x, y, h, lite, mid, dark) {
    fill(s, x, y, 3, h, mid);
    fill(s, x, y, 1, h, lite);
    fill(s, x + 2, y, 1, h, dark);
  }

  function timberBeam(s, x, y, w) {
    fill(s, x, y, w, 3, C.wood);
    fill(s, x, y, w, 1, C.woodL);
    fill(s, x, y + 2, w, 1, C.woodD);
  }

  function windowLit(s, x, y, w, h, warm) {
    fill(s, x - 1, y - 1, w + 2, h + 2, C.woodD);
    fill(s, x, y, w, h, warm ? C.goldD : C.winD);
    fill(s, x, y, w, 1, C.wood);
    fill(s, x, y, 1, h, C.wood);
    var glass = warm ? C.warm : C.win;
    var hot = warm ? C.lite : C.winL;
    fill(s, x + 1, y + 1, Math.floor(w / 2) - 1, Math.floor(h / 2) - 1, hot);
    fill(s, x + Math.floor(w / 2) + 1, y + 1, Math.floor(w / 2) - 2, Math.floor(h / 2) - 1, glass);
    fill(s, x + 1, y + Math.floor(h / 2) + 1, w - 2, Math.floor(h / 2) - 2, warm ? C.gold : C.winM);
    fill(s, x + Math.floor(w / 2), y, 1, h, C.woodD);
    fill(s, x, y + Math.floor(h / 2), w, 1, C.woodD);
    if (warm) plot(s, x + 2, y + 2, C.white);
  }

  function flowerBox(s, x, y, w) {
    fill(s, x, y, w, 4, C.wood);
    fill(s, x, y, w, 1, C.woodL);
    fill(s, x, y + 3, w, 1, C.woodD);
    plot(s, x + 2, y - 1, C.leaf);
    plot(s, x + 3, y - 2, C.bloom);
    plot(s, x + 5, y - 1, C.hp);
    plot(s, x + 7, y - 2, C.gold);
    plot(s, x + 8, y - 1, C.leafL);
    plot(s, x + w - 3, y - 1, C.bloom);
  }

  function bloomAt(s, x, y, petal) {
    plot(s, x, y, petal);
    plot(s, x - 1, y, petal);
    plot(s, x + 1, y, petal);
    plot(s, x, y - 1, petal);
    plot(s, x, y + 1, C.gold);
    plot(s, x, y + 2, C.leafD);
    plot(s, x, y + 3, C.leaf);
  }

  function door(s, x, y, w, h, openGlow) {
    fill(s, x - 1, y, w + 2, h, C.woodD);
    var i;
    for (i = 0; i < w; i += 4) fill(s, x + i, y + 1, 3, h - 2, i % 8 ? C.wood : C.woodL);
    fill(s, x, y + Math.floor(h * 0.45), w, 1, C.woodD);
    plot(s, x + w - 3, y + Math.floor(h * 0.48), C.gold);
    plot(s, x + w - 3, y + Math.floor(h * 0.48) + 1, C.goldD);
    fill(s, x - 2, y + h - 2, w + 4, 2, C.stone);
    if (openGlow) {
      fill(s, x + 2, y + 3, w - 4, h - 8, C.ember);
      fill(s, x + 4, y + 6, w - 8, h - 14, C.emberH);
      plot(s, x + Math.floor(w / 2), y + 8, C.white);
    }
  }

  // Mouth of the flue is the smoke origin. mx/my are sprite pixels.
  function chimney(s, mx, my, lit, frame) {
    var x = mx - 5;
    var y = my - 3;
    stoneCourses(s, x, y + 6, 10, 26, C.stoneL, C.stone, C.stoneD);
    fill(s, x - 1, y + 2, 12, 4, C.stoneD);
    fill(s, x, y + 3, 10, 2, C.stone);
    fill(s, x + 2, y + 1, 6, 3, C.void);
    plot(s, mx, my, lit ? ((frame & 1) ? C.emberH : C.ember) : C.ashD);
    plot(s, mx - 1, my, C.ashD);
    plot(s, mx + 1, my, C.ink);
    plot(s, mx, my + 1, lit ? C.emberH : C.ash);
  }

  function ivy(s, x, y0, y1) {
    var y;
    for (y = y0; y <= y1; y += 3) {
      plot(s, x, y, C.leafD);
      plot(s, x + ((y >> 1) & 1 ? 1 : -1), y + 1, C.leaf);
      if ((y % 6) === 0) plot(s, x + 1, y, C.leafL);
    }
  }

  function massRoof(s, peak, left, right, tone) {
    var y, x, span, x0, x1, drop;
    for (y = peak[1]; y <= left[1] + 3; y++) {
      span = spanAt(Math.min(y, left[1]), peak, left, right);
      if (!span) continue;
      drop = y > left[1] ? y - left[1] : 0;
      x0 = Math.ceil(span[0]) - 3 + drop;
      x1 = Math.floor(span[1]) + 3 - drop;
      for (x = x0; x <= x1; x++) {
        if (drop && ((x + y) % 5 === 0)) continue;
        plot(s, x, y, tone(x, y, x <= span[0] + 1 || x >= span[1] - 1));
      }
    }
  }

  function dwelling(kind, frame) {
    var home = kind === "home";
    var s = Art.spr(128, 98);
    var ax = 62;
    var ay = 92;
    var wall = home ? C.cream : C.ashL;
    var wallD = home ? C.sand : C.ash;
    var side = home ? C.path : C.ash;
    var peak = [62, 8];
    var eaveL = [10, 46];
    var eaveR = [114, 46];

    // Receding side wall, then the front under the eave. The gable is roof.
    fillPoly(s, [[6, 56], [22, 48], [22, ay - 2], [10, ay - 2]], function (x) {
      return x < 12 ? C.stoneD : side;
    });
    fill(s, 22, 48, 54, 42, wall);
    fill(s, 70, 48, 40, 42, wallD);
    fill(s, 22, 48, 88, 3, home ? C.pathD : C.ink);

    massRoof(s, peak, eaveL, eaveR, function (x, y, edge) {
      if (edge) return C.woodD;
      return home ? thatchTone(x, y, 62) : shingleTone(x, y, 62);
    });
    timberPost(s, 8, 56, 32, C.woodD, C.woodD, C.ink);
    timberBeam(s, 6, 54, 14);

    if (home) windowLit(s, 52, 22, 12, 10, true);

    stoneCourses(s, 18, 82, 92, 10, C.stoneL, C.stone, C.stoneD);
    stoneCourses(s, 8, 88, 14, 4, C.stone, C.stoneD, C.ink);
    timberPost(s, 24, 50, 32, C.woodL, C.wood, C.woodD);
    timberPost(s, 42, 62, 20, C.woodL, C.wood, C.woodD);
    timberPost(s, 86, 62, 20, C.wood, C.woodD, C.ink);
    timberPost(s, 104, 50, 32, C.wood, C.woodD, C.ink);
    timberBeam(s, 24, 50, 82);
    timberBeam(s, 24, 78, 82);
    line(s, 28, 76, 38, 52, C.woodD);
    line(s, 100, 76, 90, 52, C.wood);

    if (home) {
      windowLit(s, 28, 58, 12, 12, true);
      windowLit(s, 88, 58, 12, 12, true);
      flowerBox(s, 26, 71, 16);
      flowerBox(s, 86, 71, 16);
    } else {
      windowLit(s, 28, 60, 12, 10, false);
      fill(s, 88, 56, 14, 12, C.ashD);
      plot(s, 91, 60, C.ink);
      plot(s, 96, 63, C.ember);
      plot(s, 99, 58, C.rock);
    }

    massRoof(s, [62, 66], [40, 74], [86, 74], function (x, y, edge) {
      if (edge) return C.woodD;
      return home ? thatchTone(x, y, 62) : shingleTone(x, y, 62);
    });
    timberPost(s, 40, 74, 14, C.woodL, C.wood, C.woodD);
    timberPost(s, 82, 74, 14, C.wood, C.woodD, C.ink);
    door(s, 56, 74, 12, 16, !home);
    if (home) {
      fill(s, 61, 70, 1, 3, C.woodD);
      fill(s, 59, 72, 5, 3, C.gold);
      plot(s, 60, 73, C.white);
      plot(s, 62, 73, C.warm);
    }

    fill(s, 16, 45, 92, 2, C.woodD);
    chimney(s, ax + 30, ay - 86, true, frame | 0);
    ivy(s, 20, 68, 88);

    if (home) {
      fill(s, 10, 78, 6, 12, C.wood);
      fill(s, 10, 78, 6, 1, C.woodL);
      fill(s, 10, 82, 6, 1, C.metalD);
      fill(s, 10, 86, 6, 1, C.metal);
      bloomAt(s, 16, 86, C.bloom);
      bloomAt(s, 112, 86, C.hp);
      bloomAt(s, 120, 88, C.gold);
      plot(s, 6, 90, C.leaf);
      plot(s, 7, 89, C.leafL);
      plot(s, 122, 90, C.leafD);
      plot(s, 34, 91, C.stone);
      plot(s, 40, 90, C.stoneL);
      plot(s, 46, 91, C.stoneD);
    } else {
      fill(s, 12, 84, 12, 6, C.metalD);
      fill(s, 14, 82, 8, 3, C.metal);
      plot(s, 16, 83, C.paper);
      fill(s, 108, 76, 10, 14, C.woodD);
      fill(s, 108, 76, 10, 1, C.wood);
      fill(s, 111, 70, 2, 6, C.wood);
      plot(s, 114, 74, C.metal);
      plot(s, 16, 90, C.ember);
      plot(s, 120, 90, C.ash);
    }

    s.ax = ax;
    s.ay = ay;
    return s;
  }

  function diamond(s, cx, cy, rx, ry, cFn) {
    var y, x, w;
    for (y = -ry; y <= ry; y++) {
      w = Math.round(rx * (1 - Math.abs(y) / (ry + 0.01)));
      for (x = -w; x <= w; x++) plot(s, cx + x, cy + y, cFn(x, y, w));
    }
  }

  var LAMP_PAL = {
    lit: { glass: C.goldD, glassHi: C.warm, hot: C.white, mid: C.lite, edge: C.gold, deep: C.goldD, catch: C.warm },
    cold: { glass: C.violetD, glassHi: C.violet, hot: C.core, mid: C.violet, edge: C.hush, deep: C.violetD, catch: C.core }
  };

  // Ornate iron lamppost. The lantern is the mass; the post is short.
  // Crystal center is local y 16, feet ay 60. See Art.lampCrystalDy.
  function greatLamp(lit, frame) {
    var s = Art.spr(40, 64);
    var ax = 20;
    var ay = 60;
    var cy = 16;
    var pal = lit ? LAMP_PAL.lit : LAMP_PAL.cold;
    stoneCourses(s, 8, 52, 24, 6, C.stoneL, C.stone, C.stoneD);
    fill(s, 6, 57, 28, 3, C.stoneD);
    fill(s, 12, 49, 16, 4, C.stone);
    fill(s, 17, 30, 6, 22, C.metalD);
    fill(s, 17, 30, 2, 22, C.metal);
    fill(s, 21, 30, 2, 22, C.ink);
    fill(s, 13, 34, 14, 4, C.metal);
    fill(s, 13, 34, 14, 1, C.paper);
    plot(s, 15, 36, lit ? C.gold : C.stoneL);
    plot(s, 24, 36, C.goldD);
    plot(s, 19, 35, C.metal);
    line(s, 17, 48, 10, 54, C.metal);
    line(s, 16, 48, 9, 54, C.metalD);
    line(s, 23, 48, 30, 54, C.metalD);
    line(s, 24, 48, 31, 54, C.ink);
    fill(s, 10, 28, 20, 3, C.metalD);
    fill(s, 12, 28, 16, 1, C.metal);
    line(s, 12, 22, 6, 28, C.metal);
    line(s, 13, 23, 7, 29, C.metalD);
    line(s, 28, 22, 33, 28, C.metalD);
    line(s, 27, 23, 32, 29, C.ink);
    plot(s, 6, 28, lit ? C.gold : C.violet);
    plot(s, 33, 28, lit ? C.warm : C.violetD);
    fill(s, 7, 8, 26, 20, C.metalD);
    fill(s, 9, 10, 22, 16, pal.deep);
    fill(s, 9, 10, 2, 16, C.metal);
    fill(s, 29, 10, 2, 16, C.ink);
    fill(s, 19, 10, 2, 16, C.metalD);
    fill(s, 9, 17, 22, 1, C.metal);
    fillPoly(s, [[8, 10], [20, 2], [32, 10]], function (x, y) {
      if (y < 4) return C.paper;
      return x < ax ? C.metal : C.metalD;
    });
    plot(s, ax, 1, lit ? C.lite : C.violet);
    plot(s, ax, 0, C.paper);
    diamond(s, ax, cy, 7, 8, function (x, y) {
      var m = Math.abs(x) * 0.65 + Math.abs(y);
      if (m <= 2) return pal.hot;
      if (m <= 4.2) return pal.mid;
      if (x > 2) return pal.deep;
      if (x < -1) return pal.glassHi;
      return pal.edge;
    });
    if (lit) {
      var hot = (frame & 1) ? C.white : C.lite;
      plot(s, ax, cy, hot);
      plot(s, ax - 2, cy - 1, hot);
      plot(s, ax + 3, cy + 1, (frame & 2) ? C.warm : C.gold);
      plot(s, 5, cy, C.gold);
      plot(s, 34, cy + 1, C.warm);
      plot(s, ax, 3, C.lite);
      plot(s, 11, 22, (frame & 1) ? C.lite : C.gold);
      plot(s, 28, 12, (frame & 2) ? C.warm : C.gold);
    } else {
      plot(s, ax, cy, C.core);
      plot(s, ax - 2, cy + 1, C.violet);
      plot(s, ax + 2, cy - 1, C.violetD);
    }
    s.ax = ax;
    s.ay = ay;
    return s;
  }

  function pathLamp(lit, frame) {
    var s = Art.spr(18, 40);
    var pal = lit ? LAMP_PAL.lit : LAMP_PAL.cold;
    fill(s, 4, 34, 10, 4, C.stone);
    fill(s, 3, 37, 12, 1, C.stoneD);
    fill(s, 8, 20, 2, 15, C.woodD);
    fill(s, 8, 20, 1, 15, C.wood);
    fill(s, 5, 10, 8, 12, C.metalD);
    fill(s, 6, 11, 6, 10, pal.glass);
    fill(s, 6, 11, 1, 10, C.metal);
    fill(s, 11, 11, 1, 10, C.metalD);
    fill(s, 5, 8, 8, 3, C.metal);
    fill(s, 5, 8, 8, 1, C.paper);
    plot(s, 8, 6, C.metal);
    plot(s, 8, 5, lit ? C.lite : C.violet);
    diamond(s, 9, 15, 3, 5, function (x, y) {
      if (Math.abs(x) + Math.abs(y) <= 1) return pal.hot;
      return x < 0 ? pal.glassHi : pal.edge;
    });
    if (lit) plot(s, 9, 14, (frame & 1) ? C.white : C.lite);
    if (lit && (frame & 2)) plot(s, 8, 16, C.warm);
    s.ax = 9;
    s.ay = 38;
    return s;
  }

  function hut() {
    var s = Art.spr(56, 72);
    var ax = 28;
    var ay = 66;
    var peak = [28, 12];
    var eaveL = [8, 32];
    var eaveR = [48, 32];
    fillPoly(s, [peak, eaveL, eaveR], C.sand);
    fill(s, 12, 32, 28, 28, C.sand);
    fill(s, 32, 32, 12, 28, C.pathD);
    roofCap(s, peak, eaveL, eaveR, 7, function (x, y, edge) {
      if (edge < 1.2) return C.woodD;
      return thatchTone(x, y, 28);
    });
    fill(s, 8, 32, 40, 2, C.woodD);
    stoneCourses(s, 10, 54, 36, 12, C.stoneL, C.stone, C.stoneD);
    timberPost(s, 12, 34, 20, C.woodL, C.wood, C.woodD);
    timberPost(s, 40, 34, 20, C.wood, C.woodD, C.ink);
    timberBeam(s, 12, 34, 30);
    windowLit(s, 16, 38, 8, 10, true);
    door(s, 28, 42, 8, 20, false);
    line(s, 42, 38, 50, 46, C.paper);
    line(s, 44, 38, 52, 46, C.sand);
    line(s, 42, 42, 50, 40, C.paper);
    line(s, 44, 44, 50, 42, C.woodL);
    stoneCourses(s, 36, 6, 8, 14, C.stoneL, C.stone, C.stoneD);
    fill(s, 35, 4, 10, 3, C.stoneD);
    fill(s, 38, 5, 4, 2, C.void);
    bloomAt(s, 8, 62, C.gold);
    s.ax = ax;
    s.ay = ay;
    return s;
  }

  function skiff(frame) {
    var s = Art.spr(78, 52);
    var bob = (frame & 1) ? 1 : 0;
    var y, x, strake;
    fillPoly(s, [[6, 30], [14, 22], [58, 22], [70, 28], [72, 36], [62, 42], [12, 42], [4, 34]], function (x, y) {
      strake = Math.floor((y - 22) / 4);
      if (y > 38) return C.woodD;
      if (y % 4 === 2) return C.woodD;
      if (x > 56) return strake % 2 ? C.tealD : C.wood;
      if (x < 18) return strake % 2 ? C.pathD : C.woodL;
      if ((x + strake * 5) % 11 === 0) return C.goldD;
      return strake % 2 ? C.wood : C.path;
    });
    fill(s, 14, 22, 48, 2, C.woodL);
    for (x = 16; x < 64; x += 7) plot(s, x, 30, C.metalD);
    line(s, 44, 32, 60, 38, C.ink);
    plot(s, 58, 39, C.woodD);
    plot(s, 16, 40, C.tide);
    plot(s, 24, 41, C.stoneL);
    plot(s, 34, 40, C.tideD);
    plot(s, 48, 41, C.foam);
    fill(s, 32, 4, 2, 22, C.woodD);
    fill(s, 32, 4, 1, 22, C.wood);
    fill(s, 20, 6, 26, 2, C.wood);
    fillPoly(s, [[34, 8], [58, 14], [56, 30], [34, 28]], function (x, y) {
      if (x > 50 && y > 18 && y < 26) return C.shard;
      if ((x + y) % 9 === 0) return C.sand;
      return (y % 5 === 0) ? C.paper : C.cream;
    });
    line(s, 40, 12, 48, 24, C.sand);
    plot(s, 52, 20, C.shardH);
    plot(s, 53, 22, C.lite);
    plot(s, 35, 8, C.scarf);
    plot(s, 36, 9, C.gold);
    plot(s, 37, 8, C.scarf);
    disc(s, 22, 32, 3, C.path);
    plot(s, 22, 32, C.woodD);
    line(s, 8, 24, 2, 16, C.pathD);
    disc(s, 2, 14, 2, C.tide);
    plot(s, 2, 14, C.foam);
    if (bob) {
      var lifted = new Uint8Array(s.d);
      s.d.fill(0);
      var yy, xx, c;
      for (yy = 1; yy < s.h; yy++) {
        for (xx = 0; xx < s.w; xx++) {
          c = lifted[yy * s.w + xx];
          if (c) s.d[(yy - 1) * s.w + xx] = c;
        }
      }
    }
    s.ax = 38;
    s.ay = 44;
    return s;
  }

  function stilt() {
    var s = Art.spr(36, 52);
    fill(s, 4, 18, 3, 28, C.woodD);
    fill(s, 16, 16, 3, 32, C.wood);
    fill(s, 28, 18, 3, 28, C.woodD);
    fill(s, 4, 38, 3, 8, C.tideD);
    fill(s, 16, 40, 3, 8, C.tide);
    fill(s, 28, 38, 3, 8, C.weedD);
    plot(s, 5, 37, C.weed);
    plot(s, 17, 39, C.foam);
    plot(s, 29, 37, C.tideL);
    line(s, 6, 26, 17, 32, C.woodD);
    line(s, 29, 26, 18, 32, C.wood);
    var x;
    fill(s, 2, 12, 32, 6, C.wood);
    for (x = 4; x < 32; x += 4) fill(s, x, 12, 1, 6, C.woodD);
    fill(s, 2, 12, 32, 1, C.woodL);
    fill(s, 2, 17, 32, 1, C.woodD);
    plot(s, 8, 14, C.metalD);
    plot(s, 18, 15, C.metal);
    plot(s, 26, 14, C.metalD);
    fill(s, 22, 9, 6, 3, C.woodL);
    disc(s, 8, 20, 2, C.path);
    plot(s, 10, 14, C.goldD);
    s.ax = 18;
    s.ay = 48;
    return s;
  }

  function stall() {
    var s = Art.spr(48, 44);
    var x;
    fillPoly(s, [[4, 14], [24, 5], [44, 14]], function (x, y) {
      var stripe = Math.floor(x / 4) % 2;
      if (y < 7) return stripe ? C.shawlD : C.woodD;
      return stripe ? C.shawl : C.cream;
    });
    for (x = 6; x <= 38; x += 6) {
      fill(s, x, 13, 4, 4, ((x / 6) & 1) ? C.shawl : C.cream);
      plot(s, x + 1, 16, C.shawlD);
    }
    timberPost(s, 4, 12, 26, C.woodL, C.wood, C.woodD);
    timberPost(s, 40, 12, 26, C.wood, C.woodD, C.ink);
    fill(s, 6, 28, 36, 6, C.wood);
    fill(s, 6, 28, 36, 1, C.woodL);
    fill(s, 6, 32, 36, 2, C.woodD);
    fill(s, 6, 33, 36, 1, C.gold);
    fill(s, 9, 23, 7, 5, C.sand);
    fill(s, 10, 22, 5, 2, C.pathL);
    plot(s, 12, 24, C.goldD);
    fill(s, 18, 21, 5, 7, C.tideD);
    fill(s, 19, 22, 3, 4, C.foam);
    plot(s, 20, 23, C.lite);
    fill(s, 26, 24, 8, 4, C.scarf);
    fill(s, 27, 24, 3, 2, C.shawlL);
    plot(s, 36, 25, C.red);
    plot(s, 38, 26, C.hp);
    plot(s, 37, 24, C.leaf);
    fill(s, 21, 14, 5, 6, C.goldD);
    fill(s, 22, 15, 3, 4, C.warm);
    plot(s, 23, 16, C.white);
    fill(s, 8, 35, 7, 5, C.woodD);
    fill(s, 8, 35, 7, 1, C.wood);
    fill(s, 33, 36, 7, 4, C.path);
    fill(s, 34, 36, 5, 1, C.pathL);
    s.ax = 24;
    s.ay = 40;
    return s;
  }

  function raft() {
    var s = Art.spr(56, 28);
    var x, y;
    fill(s, 4, 10, 48, 10, C.wood);
    for (x = 6; x < 50; x += 5) fill(s, x, 10, 1, 10, C.woodD);
    fill(s, 4, 10, 48, 1, C.woodL);
    fill(s, 4, 19, 48, 1, C.woodD);
    fill(s, 8, 14, 10, 1, C.pathL);
    fill(s, 34, 13, 12, 1, C.goldD);
    plot(s, 12, 15, C.metalD);
    plot(s, 24, 16, C.metal);
    plot(s, 40, 14, C.metalD);
    for (y = 10; y <= 18; y += 3) {
      plot(s, 8, y, C.path);
      plot(s, 46, y, C.pathD);
    }
    fill(s, 14, 5, 8, 6, C.woodL);
    fill(s, 34, 4, 12, 7, C.violetD);
    plot(s, 36, 6, C.gold);
    plot(s, 42, 7, C.goldD);
    plot(s, 18, 20, C.tide);
    plot(s, 30, 21, C.foam);
    s.ax = 28;
    s.ay = 22;
    return s;
  }

  function wreckhull() {
    var s = Art.spr(56, 40);
    fillPoly(s, [[6, 20], [16, 14], [40, 16], [50, 24], [44, 32], [8, 32]], C.woodD);
    var x;
    for (x = 12; x < 44; x += 4) fill(s, x, 16, 1, 14, C.ink);
    fill(s, 14, 20, 16, 2, C.ash);
    fill(s, 8, 30, 36, 3, C.rock);
    fill(s, 18, 6, 3, 16, C.wood);
    fill(s, 32, 4, 2, 18, C.bone);
    plot(s, 32, 4, C.stoneL);
    plot(s, 20, 26, C.tide);
    plot(s, 28, 28, C.weed);
    plot(s, 36, 27, C.foam);
    plot(s, 22, 18, C.goldD);
    line(s, 6, 18, 20, 10, C.wood);
    s.ax = 28;
    s.ay = 34;
    return s;
  }

  function gatearch() {
    var s = Art.spr(52, 80);
    stoneCourses(s, 4, 22, 12, 52, C.stoneL, C.stone, C.stoneD);
    stoneCourses(s, 36, 22, 12, 52, C.stone, C.stoneD, C.ink);
    stoneCourses(s, 4, 10, 44, 14, C.stoneL, C.stone, C.stoneD);
    fill(s, 16, 24, 20, 48, C.void);
    var y;
    for (y = 28; y < 68; y += 6) {
      fill(s, 18, y, 16, 1, C.metalD);
      plot(s, 20, y, C.metal);
    }
    fill(s, 24, 24, 2, 46, C.metal);
    fill(s, 10, 16, 4, 6, C.gold);
    fill(s, 38, 16, 4, 6, C.goldD);
    plot(s, 11, 18, C.lite);
    plot(s, 39, 18, C.warm);
    plot(s, 26, 14, C.gold);
    s.ax = 26;
    s.ay = 74;
    return s;
  }

  function ruin() {
    var s = Art.spr(52, 48);
    var y;
    stoneCourses(s, 4, 18, 16, 24, C.stoneL, C.stone, C.stoneD);
    stoneCourses(s, 6, 12, 12, 8, C.stoneL, C.stone, C.stoneD);
    stoneCourses(s, 8, 6, 6, 8, C.stoneL, C.stone, C.stoneD);
    plot(s, 14, 5, C.stoneL);
    plot(s, 16, 8, C.stoneD);
    stoneCourses(s, 32, 22, 16, 20, C.stone, C.stoneD, C.ink);
    stoneCourses(s, 36, 14, 8, 10, C.stoneL, C.stone, C.stoneD);
    plot(s, 42, 12, C.stone);
    plot(s, 44, 16, C.stoneD);
    fill(s, 8, 24, 6, 8, C.void);
    fill(s, 9, 25, 4, 6, C.night);
    plot(s, 9, 25, C.stoneL);
    fill(s, 4, 40, 44, 4, C.stoneD);
    fill(s, 4, 40, 44, 1, C.stone);
    stoneCourses(s, 20, 34, 10, 8, C.stoneL, C.stone, C.stoneD);
    stoneCourses(s, 24, 38, 8, 4, C.stone, C.stoneD, C.ink);
    for (y = 20; y < 40; y += 3) {
      plot(s, 5, y, C.leafD);
      plot(s, 6, y + 1, C.leaf);
      plot(s, 4, y + 2, C.green);
    }
    plot(s, 7, 16, C.leafL);
    plot(s, 8, 15, C.leaf);
    plot(s, 9, 17, C.leafD);
    plot(s, 38, 18, C.leaf);
    plot(s, 39, 19, C.leafL);
    plot(s, 34, 20, C.leafD);
    plot(s, 18, 36, C.ashL);
    s.ax = 26;
    s.ay = 44;
    return s;
  }

  function lair() {
    var s = Art.spr(96, 72);
    var cx = 48;
    var y, x, dx, dy, dist, band, col;
    for (y = 8; y <= 64; y++) {
      for (x = 6; x <= 90; x++) {
        dx = x - cx;
        dy = (y - 48) * 1.05;
        dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 40 || dist < 8 && y > 60) continue;
        if (dist < 22 && y < 60) {
          if (dist < 8) col = C.ember;
          else if (dist < 13) col = C.vestD;
          else col = C.void;
        } else {
          band = (x * 2 + y) % 9;
          col = band < 2 ? C.stoneL : (band > 6 ? C.stoneD : C.stone);
          if (y < 18) col = band > 5 ? C.ashD : C.rock;
          if (dist > 34) col = C.stoneD;
        }
        plot(s, x, y, col);
      }
    }
    fillPoly(s, [[34, 58], [40, 40], [46, 58]], C.bone);
    fillPoly(s, [[52, 58], [58, 42], [64, 58]], C.stoneL);
    plot(s, 41, 46, C.paper);
    plot(s, 57, 48, C.stone);
    fill(s, 28, 18, 40, 3, C.ashD);
    plot(s, 36, 16, C.ember);
    plot(s, 60, 15, C.vestD);
    stoneCourses(s, 16, 60, 64, 6, C.stone, C.stoneD, C.ink);
    s.ax = 48;
    s.ay = 66;
    return s;
  }

  function vaultDoor() {
    var s = Art.spr(40, 68);
    stoneCourses(s, 2, 10, 8, 48, C.stoneL, C.stone, C.stoneD);
    stoneCourses(s, 30, 10, 8, 48, C.stone, C.stoneD, C.ink);
    stoneCourses(s, 2, 4, 36, 8, C.stoneL, C.stone, C.stoneD);
    fill(s, 10, 10, 20, 46, C.rock);
    fill(s, 10, 14, 3, 40, C.stone);
    fill(s, 27, 14, 3, 40, C.ink);
    fill(s, 10, 50, 20, 4, C.stoneD);
    fill(s, 10, 22, 20, 3, C.metalD);
    fill(s, 10, 22, 20, 1, C.metal);
    fill(s, 10, 40, 20, 3, C.metal);
    fill(s, 10, 40, 20, 1, C.paper);
    fill(s, 18, 16, 3, 36, C.metalD);
    fill(s, 18, 16, 1, 36, C.metal);
    plot(s, 12, 23, C.gold);
    plot(s, 26, 23, C.goldD);
    plot(s, 12, 41, C.gold);
    plot(s, 26, 41, C.goldD);
    plot(s, 19, 18, C.metal);
    plot(s, 19, 48, C.metalD);
    disc(s, 20, 32, 4, C.metal);
    disc(s, 20, 32, 2, C.goldD);
    plot(s, 20, 32, C.ink);
    plot(s, 19, 31, C.warm);
    line(s, 12, 16, 16, 20, C.ashD);
    line(s, 28, 46, 24, 50, C.ink);
    fill(s, 6, 56, 28, 3, C.stone);
    fill(s, 4, 59, 32, 3, C.stoneD);
    s.ax = 20;
    s.ay = 62;
    return s;
  }

  function bench() {
    var s = Art.spr(32, 16);
    fill(s, 2, 4, 28, 4, C.woodL);
    fill(s, 2, 7, 28, 1, C.wood);
    fill(s, 2, 4, 28, 1, C.pathL);
    var x;
    for (x = 6; x < 28; x += 5) plot(s, x, 6, C.woodD);
    fill(s, 3, 8, 2, 5, C.woodD);
    fill(s, 27, 8, 2, 5, C.wood);
    fill(s, 14, 8, 2, 4, C.woodD);
    s.ax = 16;
    s.ay = 14;
    return s;
  }

  function fallenPlank() {
    var s = Art.spr(28, 12);
    fill(s, 2, 3, 22, 5, C.wood);
    fill(s, 2, 3, 22, 1, C.woodL);
    fill(s, 2, 7, 22, 1, C.woodD);
    plot(s, 6, 5, C.metalD);
    plot(s, 12, 6, C.metal);
    plot(s, 18, 5, C.woodD);
    plot(s, 23, 4, C.woodL);
    plot(s, 24, 6, C.woodD);
    plot(s, 8, 4, C.goldD);
    s.ax = 14;
    s.ay = 8;
    return s;
  }

  function innLantern() {
    var s = Art.spr(24, 44);
    fill(s, 11, 20, 3, 16, C.wood);
    fill(s, 11, 20, 1, 16, C.woodL);
    fill(s, 13, 20, 1, 16, C.woodD);
    fill(s, 6, 34, 12, 4, C.woodD);
    fill(s, 5, 37, 14, 2, C.ink);
    fill(s, 7, 6, 10, 2, C.metal);
    fill(s, 15, 4, 2, 10, C.metalD);
    fill(s, 5, 6, 12, 1, C.paper);
    fill(s, 6, 8, 10, 12, C.metalD);
    fill(s, 7, 9, 8, 10, C.gold);
    fill(s, 8, 10, 3, 8, C.lite);
    fill(s, 11, 9, 1, 10, C.metalD);
    fill(s, 7, 13, 8, 1, C.metal);
    plot(s, 9, 11, C.white);
    plot(s, 8, 12, C.warm);
    plot(s, 10, 3, C.gold);
    plot(s, 10, 2, C.lite);
    fill(s, 2, 22, 20, 10, C.woodL);
    fill(s, 2, 22, 20, 2, C.sand);
    fill(s, 2, 30, 20, 2, C.woodD);
    fill(s, 3, 24, 18, 6, C.cream);
    fill(s, 7, 25, 6, 4, C.goldD);
    fill(s, 8, 26, 4, 2, C.warm);
    plot(s, 13, 26, C.gold);
    plot(s, 14, 27, C.goldD);
    plot(s, 6, 25, C.ink);
    plot(s, 16, 28, C.ink);
    s.ax = 12;
    s.ay = 40;
    return s;
  }

  function quayBell() {
    var s = Art.spr(18, 40);
    fill(s, 8, 14, 2, 20, C.woodD);
    fill(s, 3, 30, 12, 3, C.wood);
    fill(s, 2, 8, 14, 2, C.wood);
    fill(s, 8, 4, 2, 6, C.metalD);
    fill(s, 4, 10, 10, 10, C.gold);
    fill(s, 4, 10, 3, 8, C.warm);
    fill(s, 11, 12, 3, 8, C.goldD);
    fill(s, 3, 18, 12, 2, C.goldD);
    plot(s, 9, 20, C.metal);
    plot(s, 9, 14, C.lite);
    s.ax = 9;
    s.ay = 36;
    return s;
  }

  function ropeBridgeSprite(w, h) {
    var s = Art.spr(w, h);
    function ropeAt(y, side) {
      var t = (y - 4) / (h - 8);
      var sag = Math.sin(Math.max(0, Math.min(1, t)) * Math.PI) * Math.max(3, w * 0.08);
      return side < 0 ? 3 + sag : w - 4 - sag;
    }
    var y, x, py, lx, rx, shorten;
    for (y = 2; y < h - 2; y++) {
      lx = ropeAt(y, -1) | 0;
      rx = ropeAt(y, 1) | 0;
      plot(s, lx, y, C.woodD);
      plot(s, lx + 1, y, C.path);
      plot(s, lx + 2, y, C.wood);
      plot(s, rx, y, C.woodD);
      plot(s, rx - 1, y, C.pathD);
      plot(s, rx - 2, y, C.woodD);
    }
    for (y = 6; y < h - 8; y += 8) {
      lx = (ropeAt(y, -1) | 0) + 4;
      rx = (ropeAt(y, 1) | 0) - 4;
      shorten = (y % 24) === 16 ? 3 : 0;
      for (py = 0; py < 4; py++) {
        for (x = lx + shorten; x <= rx; x++) {
          var c = py === 0 ? C.woodL : (py === 3 ? C.woodD : ((x % 7 === 0) ? C.woodD : C.wood));
          if ((x + y) % 17 === 0) c = C.goldD;
          plot(s, x, y + py, c);
        }
      }
      plot(s, lx + 1, y + 1, C.metalD);
      plot(s, rx - 2, y + 2, C.metal);
    }
    fill(s, 1, 1, 4, 8, C.woodD);
    fill(s, w - 5, 1, 4, 8, C.wood);
    fill(s, 1, h - 9, 4, 8, C.woodD);
    fill(s, w - 5, h - 9, 4, 8, C.wood);
    plot(s, 2, 3, C.metal);
    plot(s, w - 3, 3, C.metalD);
    s.ax = 0;
    s.ay = 0;
    return s;
  }

  function dockDeckSprite(w, h) {
    var s = Art.spr(w, h);
    var y, x, row, shade, joint;
    for (y = 0; y < h; y++) {
      row = Math.floor(y / 6);
      for (x = 0; x < w; x++) {
        joint = (x + (row & 1 ? 10 : 0)) % 22 === 0;
        if (y % 6 === 0) shade = C.ink;
        else if (joint) shade = C.woodD;
        else if (y % 6 === 1) shade = C.sand;
        else if (y % 6 === 5) shade = C.woodD;
        else if ((x + row * 5) % 13 === 0) shade = C.goldD;
        else shade = (row & 1) ? C.wood : C.path;
        if (x < 3 || x > w - 4) shade = y % 8 < 5 ? C.woodD : C.tideD;
        plot(s, x, y, shade);
      }
    }
    for (y = 4; y < h; y += 16) {
      plot(s, 6, y, C.metalD);
      plot(s, w - 7, y, C.metal);
    }
    if (w > 40 && h > 20) {
      disc(s, 18, h - 10, 3, C.path);
      plot(s, 18, h - 10, C.woodD);
      fill(s, w - 28, 8, 10, 6, C.woodL);
      plot(s, w - 24, 10, C.gold);
    }
    s.ax = 0;
    s.ay = 0;
    return s;
  }

  var bridgeCache = {};
  Art.ropeBridge = function (w, h) {
    w = w | 0;
    h = h | 0;
    var key = w + "x" + h;
    if (bridgeCache[key]) return bridgeCache[key];
    bridgeCache[key] = Art.raster(ropeBridgeSprite(w, h));
    return bridgeCache[key];
  };

  var dockCache = {};
  Art.dockDeck = function (w, h) {
    w = w | 0;
    h = h | 0;
    var key = w + "x" + h;
    if (dockCache[key]) return dockCache[key];
    dockCache[key] = Art.raster(dockDeckSprite(w, h));
    return dockCache[key];
  };

  prop("lamp_lit", function (frame) { return pathLamp(true, frame); });
  prop("lamp_cold", function (frame) { return pathLamp(false, frame); });
  prop("great_lamp", function (frame) { return greatLamp(false, frame); });
  prop("great_lamp_lit", function (frame) { return greatLamp(true, frame); });
  prop("cottage", function (frame) { return dwelling("home", frame); });
  prop("workshop", function (frame) { return dwelling("forge", frame); });
  prop("hut", hut);
  prop("skiff", skiff);
  prop("stilt", stilt);
  prop("stall", stall);
  prop("raft", raft);
  prop("wreckhull", wreckhull);
  prop("gatearch", gatearch);
  prop("ruin", ruin);
  prop("lair", lair);
  prop("vault_door", vaultDoor);
  prop("bench", bench);
  prop("plank", fallenPlank);
  prop("inn", innLantern);
  // greatLamp feet ay 60, crystal local y 16, sprite drawn at lamp.y + 10.
  Art.lampCrystalDy = 34;
  prop("bell", quayBell);

  Art.landmarkDraws = function () {
    var out = [];
    if (!window.SF || SF.islandId !== "cinderveil") return out;
    (SF.TEXTS || []).forEach(function (t) {
      if (t.id === "maw-mouth") {
        out.push({
          y: t.y - 6,
          draw: function (ctx) { Art.sprite(ctx, "lair", t.x, t.y, { scale: 1 }); }
        });
      } else if (t.id === "vault-seal") {
        out.push({
          y: t.y - 6,
          draw: function (ctx) { Art.sprite(ctx, "vault_door", t.x, t.y, { scale: 1 }); }
        });
      }
    });
    return out;
  };
})();
