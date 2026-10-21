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
  function shade(from, to, n) {
    var a = parse(from);
    var b = parse(to);
    var out = [];
    var i, t;
    for (i = 0; i < n; i++) {
      t = n === 1 ? 0 : i / (n - 1);
      out.push("rgb(" +
        ((a[0] + (b[0] - a[0]) * t) | 0) + "," +
        ((a[1] + (b[1] - a[1]) * t) | 0) + "," +
        ((a[2] + (b[2] - a[2]) * t) | 0) + ")");
    }
    return out;
  }

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

  // A cloud sea: wide banks with a lit rim, a body, and a shadowed belly.
  // Gaps keep the sky from turning into one solid bar.
  function cloudBank(sc, y, hy, colors, seed) {
    var x, wave, gap, top, depth, yy;
    for (x = 0; x < sc.w; x++) {
      gap = hash(x >> 3, seed);
      if (gap > 0.78) continue;
      wave = Math.sin((x + seed * 17) * 0.07) * 2.2 + Math.sin((x + seed * 5) * 0.19) * 1.4;
      if (hash(x >> 1, seed + 2) > 0.92) wave -= 2;
      top = Math.round(y + wave);
      depth = 4 + ((hash(x >> 2, seed + 1) * 3) | 0);
      if (top < 1) top = 1;
      if (top + depth >= hy) depth = hy - top - 1;
      if (depth < 2) continue;
      sc.rect(x, top, 1, 1, colors.light);
      for (yy = 1; yy < depth - 1; yy++) {
        sc.rect(x, top + yy, 1, 1, yy < 2 && gap > 0.45 ? colors.light : colors.mid);
      }
      sc.rect(x, top + depth - 1, 1, 1, colors.dark);
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
      Math.round(hy * 0.58),
      Math.round(sc.w * 0.08) + 8,
      Math.round(hy * 0.16) + 4,
      style.top, style.body, style.shade
    );
    island(
      sc,
      Math.round(sc.w * (wide(sc) ? 0.4 : 0.62)),
      Math.round(hy * 0.8),
      Math.round(sc.w * 0.14) + 10,
      Math.round(hy * 0.2) + 5,
      style.top, style.body, style.shade
    );
    island(
      sc,
      Math.round(sc.w * 0.72),
      Math.round(hy * 0.64),
      Math.round(sc.w * 0.07) + 6,
      Math.round(hy * 0.13) + 3,
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

  function forge(sc, cx, hy) {
    var r = Math.max(9, Math.round(Math.min(hy * 0.42, sc.w * 0.09)));
    var cy = hy - 1;
    var y, x, dx, dy, dist, half, inner;
    sc.rect(cx - r - 4, cy - r - 3, r * 2 + 8, r + 5, hex(C.void));
    for (y = cy - r; y <= cy; y++) {
      dy = cy - y;
      half = Math.round(Math.sqrt(Math.max(0, r * r - dy * dy)));
      inner = Math.max(1, half - 2);
      sc.rect(cx - inner, y, inner * 2, 1, y > cy - 3 ? hex(C.ember) : hex(C.emberH));
      if (y < cy - 2 && inner > 3) sc.rect(cx - inner + 2, y, Math.max(1, (inner - 2) * 2), 1, hex(C.warm));
    }
    for (y = cy - r - 1; y <= cy + 1; y++) {
      for (x = cx - r - 2; x <= cx + r + 2; x++) {
        dx = x - cx;
        dy = cy - y;
        if (dy < -1) continue;
        dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= r + 1.2 && dist >= r - 1.3) {
          sc.rect(x, y, 1, 1, (x + y) % 3 === 0 ? hex(C.stoneL) : hex(C.stoneD));
        }
      }
    }
    sc.rect(cx - r + 2, cy - 1, (r - 2) * 2, 2, hex(C.emberH));
    sc.rect(cx - 2, cy - r - 2, 4, 2, hex(C.stoneL));
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

  // Depth is a short ramp of palette colors, light at the horizon and darker
  // toward the camera. Patches are a few ragged clumps, not a field of dots.
  function floorPlane(sc, y0, ramp, hi, lo) {
    var span = Math.max(1, sc.h - y0);
    var y, t, idx, i, x, w, k, focus, mid;
    for (y = y0; y < sc.h; y++) {
      if (y < y0 + 2) {
        sc.rect(0, y, sc.w, 1, ramp[ramp.length - 1]);
        continue;
      }
      t = (y - y0 - 2) / span;
      idx = Math.min(ramp.length - 1, Math.floor(t * ramp.length));
      sc.rect(0, y, sc.w, 1, ramp[idx]);
    }
    focus = wide(sc) ? 0.32 : 0.5;
    for (i = 0; i < 8; i++) {
      y = y0 + 4 + Math.floor(hash(i, 11) * Math.max(1, span - 6));
      x = Math.floor(hash(i, 19) * (sc.w - 12));
      t = (y - y0) / span;
      mid = Math.abs(x / sc.w - focus);
      if (mid < 0.16 && t > 0.38) continue;
      w = 7 + Math.floor(hash(i, 29) * 14);
      for (k = 0; k < w; k++) {
        if (hash(x + k, y) < 0.28) continue;
        sc.rect(x + k, y, 1, 1, hash(i, 31) > 0.5 ? hi : lo);
        if (hash(x + k, y + 3) > 0.62) sc.rect(x + k, y + 1, 1, 1, lo);
      }
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
  var GRASS_RAMP = shade(mixHex(hex(C.leaf), hex(C.pathL), 0.4), hex(C.grassX), 5);
  var ASH_RAMP = shade(hex(C.ash), hex(C.hairD), 5);
  var STONE_RAMP = shade(mixHex(hex(C.stone), hex(C.ember), 0.22), hex(C.void), 5);
  var SAND_RAMP = shade(hex(C.sand), hex(C.pathD), 5);
  var PLANK_RAMP = shade(hex(C.woodL), hex(C.cliffX), 5);
  var DECK_RAMP = shade(hex(C.wood), hex(C.void), 4);

  function openSky(sc, hy, colors, sea, isles) {
    sc.bands(0, hy, colors);
    if (isles) islets(sc, hy, isles);
    cloudBank(sc, Math.round(hy * 0.62), hy, sea.back || HUSH_DEEP, 4);
    cloudBank(sc, Math.round(hy * 0.78), hy, sea.front || HUSH, 11);
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
    floorPlane(sc, hy, GRASS_RAMP, hex(C.leaf), hex(C.grassX));
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
    floorPlane(sc, hy, shade(hex(C.grassD), hex(C.void), 4), hex(C.grass), hex(C.voidD));
  }

  function ash(sc) {
    var hy = horizonY(sc);
    sc.bands(0, hy, ASH_SKY);
    islets(sc, hy, { top: hex(C.ember), body: hex(C.rock), shade: hex(C.hairD) });
    cloudBank(sc, Math.round(hy * 0.6), hy, SMOKE, 5);
    cloudBank(sc, Math.round(hy * 0.78), hy, SMOKE, 13);
    ridge(sc, hy, hex(C.hairD), hex(C.rock));
    var xs = edges(sc);
    snag(sc, xs[0], hy, 24);
    snag(sc, xs[xs.length - 1], hy, 20);
    if (xs.length > 2) snag(sc, xs[1], hy, 15);
    crag(sc, xs[0] + 12, hy, 11, 12, hex(C.rock), hex(C.ash), hex(C.hairD));
    crag(sc, xs[xs.length - 1] - 10, hy, 13, 14, hex(C.cliffD), hex(C.ashD), hex(C.void));
    floorPlane(sc, hy, ASH_RAMP, hex(C.ash), hex(C.hairD));
    var i, x, y, len;
    for (i = 0; i < 3; i++) {
      x = Math.round(sc.w * (i === 1 ? 0.9 : 0.06));
      y = hy + 3 + i * 3;
      len = 6 + i * 2;
      sc.rect(x, y, len, 1, hex(C.ember));
      sc.rect(x + 1, y, Math.max(2, len - 4), 1, hex(C.emberH));
    }
  }

  function vault(sc) {
    var hy = horizonY(sc);
    sc.bands(0, sc.h, VAULT_SKY);
    var xs = edges(sc);
    var i;
    for (i = 0; i < xs.length; i++) column(sc, xs[i], hy, 8);
    forge(sc, Math.round(sc.w * (wide(sc) ? 0.38 : 0.5)), hy);
    floorPlane(sc, hy, STONE_RAMP, hex(C.stoneL), hex(C.void));
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
    cloudBank(sc, Math.round(waterTop * 0.78), waterTop, HUSH, 6);
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
    floorPlane(sc, hy, SAND_RAMP, hex(C.foam), hex(C.pathD));
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
    cloudBank(sc, Math.round(waterTop * 0.7), waterTop, HUSH_DEEP, 8);
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
    floorPlane(sc, hy, DECK_RAMP, hex(C.woodL), hex(C.voidD));
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
    floorPlane(sc, hy, shade(hex(C.stone), hex(C.rock), 5), hex(C.stoneL), hex(C.void));
    courses(sc, hy, hex(C.rock));
  }

  function deck(sc) {
    var hy = horizonY(sc);
    sc.bands(0, hy, MEADOW_SKY);
    cloudBank(sc, Math.round(hy * 0.5), hy, HUSH_DEEP, 3);
    islets(sc, hy, MEADOW_ISLE);
    cloudBank(sc, Math.round(hy * 0.7), hy, HUSH, 9);
    cloudBank(sc, Math.round(hy * 0.86), hy, HUSH, 15);
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
    floorPlane(sc, hy, PLANK_RAMP, hex(C.pathL), hex(C.void));
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
      var i, x, k;
      for (i = 0; i < 3; i++) {
        x = (Math.round(pw * (0.12 + i * 0.3)) - drift + pw * 2) % pw;
        for (k = 0; k < 18; k++) {
          if (hash(i + k, 4) > 0.35) sc.rect(x + k, 4 + (i % 2) * 3, 1, 1, colors.light);
          sc.rect(x + k, 5 + (i % 2) * 3, 1, 2, colors.mid);
        }
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
    if (!Art.calm()) Art.blit(ctx, motionOverlay(pw, ph, id, t || 0), 0, 0, w, h);
    ctx.restore();
  };

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
