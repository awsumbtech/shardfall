"use strict";

// One job: a pixel mask of drawn sky, grown by the foot clearance.
// terrainOpen refuses any foot point that lands inside it.
// Built once from the loaded atlas and cached on the map.
(function () {
  var SF = window.SF || {};
  window.SF = SF;

  var CLEAR = 5;
  var BRIDGE_CLEAR = 3;

  function stamp(near, w, h, x, y, radius, radius2) {
    var y0 = y - radius;
    var y1 = y + radius;
    var x0 = x - radius;
    var x1 = x + radius;
    if (y0 < 0) y0 = 0;
    if (x0 < 0) x0 = 0;
    if (y1 >= h) y1 = h - 1;
    if (x1 >= w) x1 = w - 1;
    var yy, xx, dy, dx, row;
    for (yy = y0; yy <= y1; yy++) {
      dy = yy - y;
      row = yy * w;
      for (xx = x0; xx <= x1; xx++) {
        dx = xx - x;
        if (dx * dx + dy * dy <= radius2) near[row + xx] = 1;
      }
    }
  }

  // ground is 1 where paint is opaque. Sky (0) grows by 5px, and by 3px
  // into a second mask so bridge planks can keep their narrower clearance.
  SF.growSkyMask = function (ground, w, h) {
    var n = w * h;
    var near5 = new Uint8Array(n);
    var near3 = new Uint8Array(n);
    var i, x, y, dx, dy, xx, yy, edge;
    for (i = 0; i < n; i++) {
      if (ground[i]) continue;
      near5[i] = 1;
      near3[i] = 1;
    }
    for (y = 0; y < h; y++) {
      for (x = 0; x < w; x++) {
        i = y * w + x;
        if (ground[i]) continue;
        edge = false;
        for (dy = -1; dy <= 1 && !edge; dy++) {
          for (dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            xx = x + dx;
            yy = y + dy;
            if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
            if (ground[yy * w + xx]) { edge = true; break; }
          }
        }
        if (!edge) continue;
        stamp(near5, w, h, x, y, CLEAR, CLEAR * CLEAR);
        stamp(near3, w, h, x, y, BRIDGE_CLEAR, BRIDGE_CLEAR * BRIDGE_CLEAR);
      }
    }
    return { near5: near5, near3: near3 };
  };

  function canvas() {
    var doc = typeof document !== "undefined" ? document : null;
    if (!doc || typeof doc.createElement !== "function") return null;
    var el = doc.createElement("canvas");
    if (!el || typeof el.getContext !== "function") return null;
    return el;
  }

  // Trimmed atlas frames sit at (ox, oy) inside the 16px cell, not at the origin.
  function readFrame(image, frame, scratch, tile) {
    if (!image || !(frame.w > 0) || !(frame.h > 0)) return null;
    scratch.width = tile;
    scratch.height = tile;
    var g = scratch.getContext("2d", { willReadFrequently: true });
    if (!g) return null;
    g.clearRect(0, 0, tile, tile);
    try {
      g.drawImage(image, frame.x, frame.y, frame.w, frame.h, frame.ox || 0, frame.oy || 0, frame.w, frame.h);
      var data = g.getImageData(0, 0, tile, tile).data;
      var alpha = new Uint8Array(tile * tile);
      var i;
      for (i = 0; i < alpha.length; i++) alpha[i] = data[i * 4 + 3];
      return alpha;
    } catch (err) {
      return null;
    }
  }

  function skyAlpha() {
    return SF.SKY_ALPHA == null ? 64 : SF.SKY_ALPHA;
  }

  function paint(acc, src) {
    var i;
    for (i = 0; i < acc.length && i < src.length; i++) {
      if (src[i] > acc[i]) acc[i] = src[i];
    }
  }

  SF.buildSkyMask = function (map) {
    if (!map || !map.layers || map._skyMask) return !!map._skyMask;
    if (!SF.assets || !map.framesReady || !map.framesReady(SF.assets)) return false;
    var scratch = canvas();
    if (!scratch) return false;
    var tile = map.tile || 16;
    var frames = {};
    var gid, spec, desc, alpha, read = 0;
    for (gid in map.frames) {
      if (!Object.prototype.hasOwnProperty.call(map.frames, gid)) continue;
      spec = map.frames[gid];
      try { desc = SF.assets.lookup(spec.key, { name: spec.frame }); }
      catch (err) { desc = null; }
      if (!desc || !desc.ready || !desc.image || !desc.frame) continue;
      alpha = readFrame(desc.image, desc.frame, scratch, tile);
      if (!alpha) continue;
      frames[gid] = alpha;
      read++;
    }
    if (read < 8) return false;
    var pw = map.w * tile;
    var ph = map.h * tile;
    var ground = new Uint8Array(pw * ph);
    var alphaPlane = new Uint8Array(pw * ph);
    var x, y, i, li, layer, src, acc, p, ox, oy;
    for (y = 0; y < map.h; y++) {
      for (x = 0; x < map.w; x++) {
        i = y * map.w + x;
        acc = new Uint8Array(tile * tile);
        for (li = 0; li < map.layers.length; li++) {
          layer = map.layers[li];
          if (layer.name === "bridges") continue;
          gid = layer.data[i];
          src = gid && frames[gid];
          if (src) paint(acc, src);
        }
        if (map.bridge && map.bridge[i]) {
          for (p = 0; p < acc.length; p++) acc[p] = 255;
        }
        ox = x * tile;
        oy = y * tile;
        for (p = 0; p < acc.length; p++) {
          var di = oy * pw + ox + (p % tile) + ((p / tile) | 0) * pw;
          if (acc[p] > alphaPlane[di]) alphaPlane[di] = acc[p];
          if (acc[p] > skyAlpha()) ground[di] = 1;
        }
      }
    }
    var grown = SF.growSkyMask(ground, pw, ph);
    map._skyMask = {
      w: pw,
      h: ph,
      tile: tile,
      alpha: alphaPlane,
      ground: ground,
      near5: grown.near5,
      near3: grown.near3
    };
    return true;
  };

  // True when this foot pixel sits on drawn sky or inside the clearance.
  SF.skyMaskBlocks = function (map, x, y) {
    var mask = map && map._skyMask;
    if (!mask) return false;
    var ix = Math.floor(x);
    var iy = Math.floor(y);
    if (ix < 0 || iy < 0 || ix >= mask.w || iy >= mask.h) return true;
    var i = iy * mask.w + ix;
    if (map.onBridge && map.onBridge(x, y)) return mask.near3[i] === 1;
    return mask.near5[i] === 1;
  };
})();
