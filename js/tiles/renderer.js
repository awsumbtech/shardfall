"use strict";

// One job: draw the visible Emberhold tile map.
// Ground layers sit in cached chunks. Cliff faces and the bridge overlay
// are handed back so the actor list can sort them.
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

  TileMapRenderer.prototype._paintGid = function (g, map, gid, dx, dy) {
    var spec = map.frames[gid];
    if (!spec || !SF.assets) return false;
    var desc;
    try { desc = SF.assets.lookup(spec.key, { name: spec.frame }); }
    catch (err) { return false; }
    if (!desc || !desc.ready || !desc.image || !desc.frame) return false;
    var frame = desc.frame;
    g.drawImage(
      desc.image,
      frame.x, frame.y, frame.w, frame.h,
      dx + (frame.ox || 0),
      dy + (frame.oy || 0),
      frame.w, frame.h
    );
    return true;
  };

  TileMapRenderer.prototype._bake = function (map, cx, cy) {
    var tile = map.tile;
    var chunk = map.chunk;
    var x0 = cx * chunk;
    var y0 = cy * chunk;
    var tw = Math.min(chunk, map.w - x0);
    var th = Math.min(chunk, map.h - y0);
    if (tw < 1 || th < 1) return { empty: true };
    var canvas = this._canvas(tw * tile, th * tile);
    if (!canvas || !canvas.getContext) return null;
    var g = canvas.getContext("2d");
    if (!g) return null;
    g.imageSmoothingEnabled = false;
    var ink = false;
    var li, layer, y, x, idx, gid;
    for (li = 0; li < map.layers.length; li++) {
      layer = map.layers[li];
      if (layer.name === "bridges") continue;
      for (y = 0; y < th; y++) {
        for (x = 0; x < tw; x++) {
          idx = (y0 + y) * map.w + (x0 + x);
          // Cliff art on open ground is part of the ground pass. A sorted
          // face would paint over the bridge planks and the hero.
          if (layer.role === "cliffs" && map.blocked[idx]) continue;
          gid = layer.data[idx];
          if (!gid) continue;
          if (this._paintGid(g, map, gid, x * tile, y * tile)) ink = true;
        }
      }
    }
    if (!ink) return { empty: true };
    return { empty: false, canvas: canvas };
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
    if (!map.framesReady(SF.assets)) return false;
    if (this.stamp !== map.stamp) {
      this.chunks = {};
      this.stamp = map.stamp;
    }
    var z = SF.zoom || 1;
    var viewW = SF.viewW || 0;
    var viewH = SF.viewH || 0;
    if (!(viewW > 0) || !(viewH > 0) || !(z > 0)) return false;
    var span = map.tile * map.chunk;
    var pad = span;
    var hw = viewW / (2 * z);
    var hh = viewH / (2 * z);
    var ncx = Math.ceil(map.w / map.chunk);
    var ncy = Math.ceil(map.h / map.chunk);
    var c0 = Math.floor((state.camX - hw - pad) / span);
    var c1 = Math.floor((state.camX + hw + pad) / span);
    var r0 = Math.floor((state.camY - hh - pad) / span);
    var r1 = Math.floor((state.camY + hh + pad) / span);
    if (c0 < 0) c0 = 0;
    if (r0 < 0) r0 = 0;
    if (c1 >= ncx) c1 = ncx - 1;
    if (r1 >= ncy) r1 = ncy - 1;
    var list = [];
    var cx, cy, key, rec;
    for (cy = r0; cy <= r1; cy++) {
      for (cx = c0; cx <= c1; cx++) {
        key = cx + "," + cy;
        rec = this.chunks[key];
        if (!rec) {
          rec = this._bake(map, cx, cy);
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
        blit(ctx, tr, canvas, 0, 0, canvas.width, canvas.height, item.cx * span, item.cy * span, canvas.width, canvas.height);
      }
    });
    return true;
  };

  TileMapRenderer.prototype.drawCells = function (ctx, map, cells) {
    if (!ctx || !map || !cells || !cells.length) return;
    var self = this;
    this._withDevice(ctx, function (tr) {
      var i, cell, spec, desc, frame;
      for (i = 0; i < cells.length; i++) {
        cell = cells[i];
        spec = map.frames[cell.gid];
        if (!spec || !SF.assets) continue;
        try { desc = SF.assets.lookup(spec.key, { name: spec.frame }); }
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
    var map = SF._pendingMap || SF.tileMap;
    return !!(map && map.framesReady && map.framesReady(SF.assets));
  };

  SF.TileMapRenderer = TileMapRenderer;
})();
