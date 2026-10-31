"use strict";

// One job: measure how far drawn sky reaches into each ground tile.
// The feet then stay SKY_CLEAR pixels inside the opaque paint.
// Art is read from the loaded atlas. No tile coordinates are named here.
(function () {
  var SF = window.SF || {};
  window.SF = SF;

  var ALPHA = 16;

  function solid(alpha, i) {
    return alpha[i] > ALPHA;
  }

  // How far empty pixels reach in from one side. A row or column that is
  // empty all the way across belongs to the other axis, so it is skipped.
  function run(alpha, w, h, side) {
    var max = 0;
    var y, x, n, xx, yy, any;
    if (side === "w" || side === "e") {
      for (y = 0; y < h; y++) {
        any = false;
        for (x = 0; x < w; x++) if (solid(alpha, y * w + x)) { any = true; break; }
        if (!any) continue;
        n = 0;
        for (x = 0; x < w; x++) {
          xx = side === "w" ? x : w - 1 - x;
          if (solid(alpha, y * w + xx)) break;
          n++;
        }
        if (n > max) max = n;
      }
      return max;
    }
    for (x = 0; x < w; x++) {
      any = false;
      for (y = 0; y < h; y++) if (solid(alpha, y * w + x)) { any = true; break; }
      if (!any) continue;
      n = 0;
      for (y = 0; y < h; y++) {
        yy = side === "n" ? y : h - 1 - y;
        if (solid(alpha, yy * w + x)) break;
        n++;
      }
      if (n > max) max = n;
    }
    return max;
  }

  // alpha is one byte per pixel, row-major. Returns [west, east, north, south].
  SF.skyDepths = function (alpha, w, h) {
    w = w || 0;
    h = h || 0;
    if (!alpha || w < 1 || h < 1) return [0, 0, 0, 0];
    return [run(alpha, w, h, "w"), run(alpha, w, h, "e"), run(alpha, w, h, "n"), run(alpha, w, h, "s")];
  };

  function canvas() {
    var doc = typeof document !== "undefined" ? document : null;
    if (!doc || typeof doc.createElement !== "function") return null;
    var el = doc.createElement("canvas");
    if (!el || typeof el.getContext !== "function") return null;
    return el;
  }

  function readFrame(image, frame, scratch) {
    var w = frame.w || 0;
    var h = frame.h || 0;
    if (!image || w < 1 || h < 1) return null;
    scratch.width = w;
    scratch.height = h;
    var g = scratch.getContext("2d", { willReadFrequently: true });
    if (!g) return null;
    g.clearRect(0, 0, w, h);
    try {
      g.drawImage(image, frame.x, frame.y, w, h, 0, 0, w, h);
      var data = g.getImageData(0, 0, w, h).data;
      var alpha = new Uint8Array(w * h);
      var i;
      for (i = 0; i < alpha.length; i++) alpha[i] = data[i * 4 + 3];
      return alpha;
    } catch (err) {
      return null;
    }
  }

  function neighborBlocked(map, tx, ty, sx, sy) {
    var nx = tx + sx;
    var ny = ty + sy;
    if (nx < 0 || ny < 0 || nx >= map.w || ny >= map.h) return true;
    return map.blocked[ny * map.w + nx] === 1;
  }

  // Fill map._sky for open cells that touch a blocked neighbour.
  // Returns false when the atlas pixels cannot be read.
  SF.buildSkyEdges = function (map) {
    if (!map || !map.layers || !SF.assets || !map.framesReady || !map.framesReady(SF.assets)) return false;
    var scratch = canvas();
    if (!scratch) return false;
    var tile = map.tile || 16;
    var frames = {};
    var gid, spec, desc, alpha, li, layer;
    for (gid in map.frames) {
      if (!Object.prototype.hasOwnProperty.call(map.frames, gid)) continue;
      spec = map.frames[gid];
      try { desc = SF.assets.lookup(spec.key, { name: spec.frame }); }
      catch (err) { desc = null; }
      if (!desc || !desc.ready || !desc.image || !desc.frame) continue;
      alpha = readFrame(desc.image, desc.frame, scratch);
      if (alpha) frames[gid] = { a: alpha, w: desc.frame.w, h: desc.frame.h };
    }
    if (!Object.keys(frames).length) return false;
    var sky = new Array(map.w * map.h);
    var i, x, y, acc, p, src, painted;
    for (y = 0; y < map.h; y++) {
      for (x = 0; x < map.w; x++) {
        i = y * map.w + x;
        if (map.blocked[i]) continue;
        if (!neighborBlocked(map, x, y, -1, 0) && !neighborBlocked(map, x, y, 1, 0) &&
            !neighborBlocked(map, x, y, 0, -1) && !neighborBlocked(map, x, y, 0, 1)) continue;
        acc = new Uint8Array(tile * tile);
        painted = false;
        for (li = 0; li < map.layers.length; li++) {
          layer = map.layers[li];
          if (layer.name === "bridges") continue;
          gid = layer.data[i];
          src = gid && frames[gid];
          if (!src) continue;
          for (p = 0; p < acc.length && p < src.a.length; p++) {
            if (src.a[p] > ALPHA) acc[p] = src.a[p];
          }
          painted = true;
        }
        if (painted) sky[i] = SF.skyDepths(acc, tile, tile);
      }
    }
    map._sky = sky;
    return true;
  };
})();
