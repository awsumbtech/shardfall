"use strict";

// One job: draw one prop from the atlas, whole pixels, scale 1.
// Canopy fade, chimney smoke, the lantern flicker, chest frames, and the
// fence strip live here. A missing sheet returns false so today's code art runs.
(function () {
  var SF = window.SF || {};
  window.SF = SF;

  function flipBit(x, y) {
    var h = (Math.round(x) * 73856093) ^ (Math.round(y) * 19349663);
    h = (h ^ (h >>> 13)) >>> 0;
    return h & 1;
  }

  // Unlit glass: the warm pixels go cool grey. Same test the preview used.
  function recolorCold(data) {
    var i, r, g, b, v;
    for (i = 0; i < data.length; i += 4) {
      r = data[i];
      g = data[i + 1];
      b = data[i + 2];
      if (data[i + 3] && r > 150 && r > b + 60 && g > 40) {
        v = (r + g + b) / 3;
        data[i] = v * 0.55;
        data[i + 1] = v * 0.62;
        data[i + 2] = v * 0.78;
      }
    }
    return data;
  }

  function coldCanvas(image, frame) {
    if (typeof document === "undefined" || !document.createElement) return null;
    var canvas = document.createElement("canvas");
    canvas.width = frame.w;
    canvas.height = frame.h;
    var g = canvas.getContext("2d");
    if (!g || !g.getImageData) return null;
    g.drawImage(image, frame.x, frame.y, frame.w, frame.h, 0, 0, frame.w, frame.h);
    var pixels = g.getImageData(0, 0, canvas.width, canvas.height);
    recolorCold(pixels.data);
    g.putImageData(pixels, 0, 0);
    return canvas;
  }

  function canopyHides(row, x, y) {
    if (!row.canopy) return false;
    var player = SF.state && SF.state.player;
    if (!player || !(y > player.y)) return false;
    var ax = row.anchor[0];
    var ay = row.anchor[1];
    var w = row.rect[2];
    var h = row.rect[3];
    var left = x - ax;
    var top = y - ay;
    var right = left + w;
    var canopyBottom = top + h * 0.72;
    return left < player.x + 13 && right > player.x - 13 && top < player.y - 2 && canopyBottom > player.y - 36;
  }

  function PropRenderer(registry) {
    this.registry = registry;
    this.coldCache = [];
    this.fence = new FenceStrip(this);
  }

  PropRenderer.prototype.forIsland = function (id) {
    var cfg = SF.PROP_ISLANDS && SF.PROP_ISLANDS[id];
    return !!(cfg && cfg.art === "kenmi");
  };

  PropRenderer.prototype.frameIndex = function (row) {
    var n = row.frames || 1;
    if (n < 2) return 0;
    if (SF.reduceMotion) return 0;
    var rate = row.rate || 6;
    var index = Math.floor((SF.anim || 0) * rate) % n;
    if (index < 0) index += n;
    return index;
  };

  PropRenderer.prototype.lookup = function (row, index, flip) {
    if (!row || !SF.assets || typeof SF.assets.lookup !== "function") return null;
    var desc;
    try {
      desc = SF.assets.lookup(row.key, { index: index || 0, flip: !!flip });
    } catch (err) {
      return null;
    }
    if (!desc || !desc.ready || !desc.image || !desc.frame) return null;
    return desc;
  };

  PropRenderer.prototype.coldDesc = function (desc) {
    var i, hit;
    for (i = 0; i < this.coldCache.length; i++) {
      hit = this.coldCache[i];
      if (hit.image === desc.image && hit.frame === desc.frame) return hit.desc;
    }
    var canvas = coldCanvas(desc.image, desc.frame);
    if (!canvas) return null;
    var frame = desc.frame;
    var copy = {
      key: desc.key,
      image: canvas,
      anchor: desc.anchor,
      flip: desc.flip,
      frame: { name: frame.name, x: 0, y: 0, w: frame.w, h: frame.h }
    };
    this.coldCache.push({ image: desc.image, frame: frame, desc: copy });
    return copy;
  };

  PropRenderer.prototype.paint = function (ctx, desc, x, y) {
    if (!SF.spriteRenderer || typeof SF.spriteRenderer.drawFrame !== "function") return false;
    SF.spriteRenderer.drawFrame(ctx, desc, x, y, { scale: 1 });
    return true;
  };

  PropRenderer.prototype.drawAt = function (ctx, row, x, y, index) {
    if (!row) return false;
    var frame = index == null ? this.frameIndex(row) : index;
    var flip = !!(row.flip && flipBit(x, y));
    var desc = this.lookup(row, frame, flip);
    if (!desc) return false;
    if (row.cold) {
      desc = this.coldDesc(desc);
      if (!desc) return false;
    }
    var fade = canopyHides(row, x, y);
    var dx = Math.round(x);
    var dy = Math.round(y);
    var ok = false;
    if (fade) ctx.save();
    try {
      if (fade) ctx.globalAlpha *= 0.4;
      ok = this.paint(ctx, desc, dx, dy);
    } catch (err) {
      ok = false;
    } finally {
      if (fade) ctx.restore();
    }
    return ok;
  };

  PropRenderer.prototype.drawSmoke = function (ctx, prop, row) {
    var smoke = this.registry.get("smoke");
    if (!smoke || !row.smoke) return;
    var ax = smoke.anchor[0];
    var ay = smoke.anchor[1];
    var footX = Math.round(prop.x + row.smoke[0] - ax) + ax;
    var footY = Math.round(prop.y + row.smoke[1] - ay) + ay;
    this.drawAt(ctx, smoke, footX, footY, this.frameIndex(smoke));
  };

  PropRenderer.prototype.draw = function (ctx, prop, lit) {
    if (!ctx || !prop) return false;
    if (prop.dense && SF.worldSource !== "tiles") return true;
    if (!this.forIsland(SF.islandId)) return !!prop.dense;
    if (prop.kind === "fence_up") {
      if (this.fence.draw(ctx, prop)) return true;
      return false;
    }
    var id = this.registry.idFor(prop, lit);
    if (id === "") return true;
    var row = this.registry.get(id);
    if (!row) return false;
    var index = row.cold ? 0 : null;
    if (!this.drawAt(ctx, row, prop.x, prop.y, index)) return false;
    if (row.smoke) this.drawSmoke(ctx, prop, row);
    return true;
  };

  PropRenderer.prototype.drawChest = function (ctx, extra) {
    if (!ctx || !extra || !this.forIsland(SF.islandId)) return false;
    var row = this.registry.get("chest");
    if (!row) return false;
    var u = SF.chestOpenT ? SF.chestOpenT(extra.id) : 0;
    var index = 0;
    if (u > 0 && u < 1) index = Math.min(3, Math.floor(u * 4));
    else if (u >= 0.5) index = Math.min(3, (row.frames || 4) - 1);
    return this.drawAt(ctx, row, extra.x, extra.y, index);
  };

  // Each fence post paints the Kenmi rail for its own span, so y-sort stays per post.
  function FenceStrip(renderer) {
    this.renderer = renderer;
    this.epoch = -1;
    this.list = null;
  }

  FenceStrip.prototype.fences = function () {
    var epoch = SF.propEpoch || 0;
    if (this.epoch === epoch && this.list) return this.list;
    var props = SF.PROPS || [];
    var list = [];
    var i;
    for (i = 0; i < props.length; i++) {
      if (props[i].kind === "fence_up") list.push(props[i]);
    }
    this.epoch = epoch;
    this.list = list;
    return list;
  };

  FenceStrip.prototype.draw = function (ctx, prop) {
    var row = this.renderer.registry.get("fence");
    var desc = this.renderer.lookup(row, 0, false);
    if (!desc) return false;
    var all = this.fences();
    var ys = [];
    var i;
    for (i = 0; i < all.length; i++) {
      if (Math.abs(all[i].x - prop.x) < 2) ys.push(all[i].y);
    }
    if (!ys.length) ys.push(prop.y);
    ys.sort(function (a, b) { return a - b; });
    var at = ys.indexOf(prop.y);
    if (at < 0) at = 0;
    var span = ys.length > 1 ? (ys[ys.length - 1] - ys[0]) / (ys.length - 1) : 16;
    var top = at === 0 ? prop.y - span : ys[at - 1];
    var x = Math.round(prop.x) - 8;
    var y0 = Math.round(top);
    var y1 = Math.round(prop.y);
    var image = desc.image;
    var ox = desc.frame.x;
    var oy = desc.frame.y;
    var y, srcY;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    for (y = y0; y < y1; y++) {
      srcY = 16 + (((y - y0) % 32) + 32) % 32;
      ctx.drawImage(image, ox, oy + srcY, 16, 1, x, y, 16, 1);
    }
    if (at === 0) ctx.drawImage(image, ox, oy, 16, 12, x, y0 - 12, 16, 12);
    if (at === ys.length - 1) ctx.drawImage(image, ox, oy + 48, 16, 14, x, y1 - 6, 16, 14);
    ctx.restore();
    return true;
  };

  SF.recolorCold = recolorCold;
  SF.PropRenderer = PropRenderer;
  SF.FenceStrip = FenceStrip;
})();
