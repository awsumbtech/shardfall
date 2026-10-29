"use strict";

// One job: draw the visible ground from cached chunks.
// Chunks rebuild only when the map stamp changes. Scaling matches the
// field sprite blit: whole device pixels, nearest neighbor, shared edges.
(function () {
  var SF = window.SF || {};
  window.SF = SF;

  function TileMapRenderer(documentRef) {
    this.document = documentRef || null;
    this.chunks = {};
    this.stamp = "";
  }

  TileMapRenderer.deviceRect = function (tr, x, y, w, h) {
    var sx = Math.max(1, Math.round(Math.abs(tr.a)));
    var sy = Math.max(1, Math.round(Math.abs(tr.d)));
    return {
      x: Math.round(tr.a * x + tr.e),
      y: Math.round(tr.d * y + tr.f),
      w: w * sx,
      h: h * sy
    };
  };

  // Every ground name has to resolve. One missing frame keeps the code ground.
  TileMapRenderer.ready = function (registry, tileSet) {
    if (!registry || !tileSet || typeof registry.lookup !== "function") return false;
    if (!tileSet.names || !tileSet.names.length) return false;
    var i, spec, desc;
    for (i = 0; i < tileSet.names.length; i++) {
      spec = tileSet.tiles[tileSet.names[i]];
      if (!spec) return false;
      try {
        desc = registry.lookup(spec.key, { name: spec.frame });
      } catch (err) {
        return false;
      }
      if (!desc || !desc.ready || !desc.image || !desc.frame) return false;
    }
    return true;
  };

  function readTransform(ctx) {
    if (!ctx || !ctx.getTransform) return null;
    var t = ctx.getTransform();
    if (!t || t.b !== 0 || t.c !== 0 || !t.a || !t.d) return null;
    return t;
  }

  TileMapRenderer.prototype._canvas = function (w, h) {
    var doc = this.document;
    if (!doc && typeof document !== "undefined") doc = document;
    if (!doc || typeof doc.createElement !== "function") return null;
    var canvas = doc.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    return canvas;
  };

  TileMapRenderer.prototype._stair = function (g, stair, x, y, tile) {
    var hi = stair.hiPx;
    var lo = stair.loPx;
    if (hi > tile) hi = tile;
    if (lo > tile) lo = tile;
    g.fillStyle = stair.fill;
    g.fillRect(x, y, tile, tile);
    if (hi > 0) {
      g.fillStyle = stair.hi;
      g.fillRect(x, y, tile, hi);
    }
    if (lo > 0) {
      g.fillStyle = stair.lo;
      g.fillRect(x, y + tile - lo, tile, lo);
    }
  };

  TileMapRenderer.prototype._bake = function (map, set, cx, cy) {
    var tile = map.tile;
    var chunk = set.chunk;
    var x0 = cx * chunk;
    var y0 = cy * chunk;
    var tw = chunk;
    var th = chunk;
    if (x0 + tw > map.cols) tw = map.cols - x0;
    if (y0 + th > map.rows) th = map.rows - y0;
    if (tw < 1 || th < 1) return { empty: true };
    var ink = false;
    var x, y, idx, kind;
    for (y = 0; y < th && !ink; y++) {
      for (x = 0; x < tw; x++) {
        idx = (y0 + y) * map.cols + (x0 + x);
        if (map.kind[idx]) { ink = true; break; }
      }
    }
    if (!ink) return { empty: true };
    var canvas = this._canvas(tw * tile, th * tile);
    if (!canvas || !canvas.getContext) return null;
    var g = canvas.getContext("2d");
    if (!g) return null;
    g.imageSmoothingEnabled = false;
    var reg = SF.assets;
    var stairKind = SF.TileMap ? SF.TileMap.STAIR : 4;
    for (y = 0; y < th; y++) {
      for (x = 0; x < tw; x++) {
        idx = (y0 + y) * map.cols + (x0 + x);
        kind = map.kind[idx];
        if (!kind) continue;
        if (kind === stairKind) {
          this._stair(g, set.stair, x * tile, y * tile, tile);
          continue;
        }
        var name = map.names[idx];
        if (!name) continue;
        var spec = set.get(name);
        if (!spec || !reg) return null;
        var desc = reg.lookup(spec.key, { name: spec.frame });
        if (!desc || !desc.ready || !desc.image || !desc.frame) return null;
        var frame = desc.frame;
        g.drawImage(
          desc.image,
          frame.x, frame.y, frame.w, frame.h,
          x * tile + (frame.ox || 0),
          y * tile + (frame.oy || 0),
          frame.w, frame.h
        );
      }
    }
    return { empty: false, canvas: canvas, tw: tw, th: th };
  };

  function blit(ctx, tr, image, sx, sy, sw, sh, wx, wy, ww, wh) {
    if (!tr) {
      ctx.drawImage(image, sx, sy, sw, sh, wx, wy, ww, wh);
      return;
    }
    var rect = TileMapRenderer.deviceRect(tr, wx, wy, ww, wh);
    if (rect.w < 1 || rect.h < 1) return;
    ctx.drawImage(image, sx, sy, sw, sh, rect.x, rect.y, rect.w, rect.h);
  }

  TileMapRenderer.prototype._withDevice = function (ctx, draw) {
    var tr = readTransform(ctx);
    var smooth = ctx.imageSmoothingEnabled;
    if (!tr) {
      ctx.imageSmoothingEnabled = false;
      try { draw(null); }
      finally { ctx.imageSmoothingEnabled = smooth; }
      return;
    }
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    try { draw(tr); }
    finally {
      ctx.restore();
      ctx.imageSmoothingEnabled = smooth;
    }
  };

  TileMapRenderer.prototype.draw = function (ctx, state, map) {
    if (!ctx || !state || !map || state.camX == null || state.camY == null) return false;
    var set = SF.tileSet;
    if (!TileMapRenderer.ready(SF.assets, set)) return false;
    if (this.stamp !== map.stamp) {
      this.chunks = {};
      this.stamp = map.stamp;
    }
    var z = SF.zoom || 1;
    var viewW = SF.viewW || 0;
    var viewH = SF.viewH || 0;
    if (!(viewW > 0) || !(viewH > 0) || !(z > 0)) return false;
    var span = map.tile * set.chunk;
    var pad = span;
    var hw = viewW / (2 * z);
    var hh = viewH / (2 * z);
    var left = state.camX - hw - pad;
    var top = state.camY - hh - pad;
    var right = state.camX + hw + pad;
    var bottom = state.camY + hh + pad;
    var ncx = Math.ceil(map.cols / set.chunk);
    var ncy = Math.ceil(map.rows / set.chunk);
    var c0 = Math.floor((left - map.originX) / span);
    var c1 = Math.floor((right - map.originX) / span);
    var r0 = Math.floor((top - map.originY) / span);
    var r1 = Math.floor((bottom - map.originY) / span);
    if (c0 < 0) c0 = 0;
    if (r0 < 0) r0 = 0;
    if (c1 >= ncx) c1 = ncx - 1;
    if (r1 >= ncy) r1 = ncy - 1;
    if (c1 < c0 || r1 < r0) return true;
    var list = [];
    var cx, cy, key, rec;
    for (cy = r0; cy <= r1; cy++) {
      for (cx = c0; cx <= c1; cx++) {
        key = cx + "," + cy;
        rec = this.chunks[key];
        if (!rec) {
          rec = this._bake(map, set, cx, cy);
          if (!rec) return false;
          this.chunks[key] = rec;
        }
        if (!rec.empty) list.push({ rec: rec, cx: cx, cy: cy });
      }
    }
    this._withDevice(ctx, function (tr) {
      var i, item, canvas;
      for (i = 0; i < list.length; i++) {
        item = list[i];
        canvas = item.rec.canvas;
        blit(
          ctx, tr, canvas,
          0, 0, canvas.width, canvas.height,
          map.originX + item.cx * span,
          map.originY + item.cy * span,
          canvas.width, canvas.height
        );
      }
    });
    return true;
  };

  TileMapRenderer.prototype.drawCells = function (ctx, cells) {
    if (!ctx || !cells || !cells.length) return;
    var set = SF.tileSet;
    var reg = SF.assets;
    if (!set || !reg) return;
    this._withDevice(ctx, function (tr) {
      var i, cell, spec, desc, frame;
      for (i = 0; i < cells.length; i++) {
        cell = cells[i];
        spec = set.get(cell.name);
        if (!spec) continue;
        try { desc = reg.lookup(spec.key, { name: spec.frame }); }
        catch (err) { continue; }
        if (!desc || !desc.ready || !desc.image || !desc.frame) continue;
        frame = desc.frame;
        blit(
          ctx, tr, desc.image,
          frame.x, frame.y, frame.w, frame.h,
          cell.x + (frame.ox || 0),
          cell.y + (frame.oy || 0),
          frame.w, frame.h
        );
      }
    });
  };

  SF.tilesReady = function () {
    return TileMapRenderer.ready(SF.assets, SF.tileSet);
  };

  SF.TileMapRenderer = TileMapRenderer;
})();
