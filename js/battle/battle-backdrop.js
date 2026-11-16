"use strict";

// One job: draw one real four-layer battle backdrop per area from the
// catalog filled by js/data/battle-backdrops.js (id -> sky, far, mid, floor
// image paths). Until an area is marked ready, it keeps today's existing
// backdrop path (Art.battleBg via BattleGfx.paintBg). This file never
// paints with tints, recolors, gradients, or code-drawn art. An unknown
// id falls back to the catalog's defaultId.
// The constructor is published as a counted BattleBackdrop constructor assign in
// js/main.js. Game.init creates the one instance as game.battleBackdrop.
// The battle screen drawer is the single attach point.
(function () {
  var sf = window.SF;
  var BattleBackdrop = sf && sf.BattleBackdrop;
  if (typeof BattleBackdrop !== "function") {
    throw new Error("BattleBackdrop constructor missing");
  }

  // Catalog fields come from js/data/battle-backdrops.js via adopt().
  BattleBackdrop.IDS = [];
  BattleBackdrop.LAYERS = [];
  BattleBackdrop.PARALLAX = {};
  BattleBackdrop.KIT = "";
  BattleBackdrop.DIR = "";
  BattleBackdrop.VERSION = "";
  BattleBackdrop.SIZE = { w: 0, h: 0 };
  BattleBackdrop.HORIZON = 0;
  BattleBackdrop.DEFAULT_ID = "";
  BattleBackdrop.MANIFEST = {};

  // Reads one catalog. A later adopt replaces the previous one.
  BattleBackdrop.adopt = function (data) {
    var empty = { w: 0, h: 0 };
    BattleBackdrop.DATA = data || null;
    BattleBackdrop.IDS = [];
    BattleBackdrop.LAYERS = [];
    BattleBackdrop.PARALLAX = {};
    BattleBackdrop.KIT = "";
    BattleBackdrop.DIR = "";
    BattleBackdrop.VERSION = "";
    BattleBackdrop.SIZE = empty;
    BattleBackdrop.HORIZON = 0;
    BattleBackdrop.DEFAULT_ID = "";
    BattleBackdrop.MANIFEST = {};
    if (!data) return BattleBackdrop;
    var i, spec, name, order, a, b;
    BattleBackdrop.DEFAULT_ID = data.defaultId || "";
    BattleBackdrop.KIT = data.kit || "";
    BattleBackdrop.DIR = data.dir || "";
    BattleBackdrop.VERSION = data.version || "";
    BattleBackdrop.SIZE = data.size ? { w: data.size.w, h: data.size.h } : empty;
    BattleBackdrop.HORIZON = data.horizon || 0;
    order = (data.layers || []).slice();
    for (i = 0; i < order.length; i++) {
      a = i;
      for (b = i + 1; b < order.length; b++) {
        if ((order[b].z || 0) < (order[a].z || 0)) a = b;
      }
      spec = order[i];
      order[i] = order[a];
      order[a] = spec;
    }
    for (i = 0; i < order.length; i++) {
      name = order[i].id;
      BattleBackdrop.LAYERS.push(name);
      BattleBackdrop.PARALLAX[name] = order[i].parallax;
    }
    BattleBackdrop.IDS = (data.ids && data.ids.length) ? data.ids.slice() : [];
    if (!BattleBackdrop.IDS.length && data.areas) BattleBackdrop.IDS = Object.keys(data.areas);
    BattleBackdrop.MANIFEST = data.areas || {};
    return BattleBackdrop;
  };

  BattleBackdrop.entry = function (id) {
    var manifest = BattleBackdrop.MANIFEST;
    if (!manifest || !Object.prototype.hasOwnProperty.call(manifest, id)) return null;
    return manifest[id];
  };

  BattleBackdrop.resolveId = function (id) {
    return BattleBackdrop.entry(id) ? id : BattleBackdrop.DEFAULT_ID;
  };

  BattleBackdrop.hasArt = function (id) {
    var row = BattleBackdrop.entry(id);
    return !!(row && row.ready);
  };

  // Same horizon seam the battle floor and the code plate use
  // (js/art/scenes.js:74-76, js/battle/stage.js backdropFloor).
  BattleBackdrop.canvasHorizon = function (w, h) {
    return Math.round(h * (h > w ? 0.47 : 0.46));
  };

  // Cover-fit at a uniform integer scale, no uneven stretch. Anchored so
  // plate Y 124 lands on the canvas horizon. Designed for the 844x390
  // landscape target; other aspect ratios use the same cover rule.
  BattleBackdrop.fit = function (w, h, id) {
    var row = id ? BattleBackdrop.entry(BattleBackdrop.resolveId(id)) : null;
    var size = (row && row.size) || BattleBackdrop.SIZE;
    var plateY = (row && row.horizon != null) ? row.horizon : BattleBackdrop.HORIZON;
    var pw = size.w;
    var ph = size.h;
    var below = ph - plateY;
    var horizon = BattleBackdrop.canvasHorizon(w, h);
    var need = w / pw;
    if (plateY > 0) need = Math.max(need, horizon / plateY);
    if (below > 0) need = Math.max(need, (h - horizon) / below);
    var scale = Math.max(1, Math.ceil(need - 1e-9));
    var dw = pw * scale;
    var dh = ph * scale;
    return {
      scale: scale,
      x: Math.round((w - dw) / 2),
      y: Math.round(horizon - plateY * scale),
      w: dw,
      h: dh,
      horizon: horizon
    };
  };

  BattleBackdrop.imageOk = function (image) {
    var VisualObject = sf && sf.VisualObject;
    if (VisualObject && typeof VisualObject.imageSize === "function") {
      return !!VisualObject.imageSize(image);
    }
    if (!image || typeof image !== "object") return false;
    if (image.complete === false) return false;
    if (typeof image.naturalWidth === "number" && !(image.naturalWidth > 0)) return false;
    var width = typeof image.naturalWidth === "number" ? image.naturalWidth : image.width;
    var height = typeof image.naturalHeight === "number" ? image.naturalHeight : image.height;
    return width > 0 && height > 0;
  };

  BattleBackdrop.prototype.init = function () {
    this.parent = null;
    this._attached = false;
    this.images = {};
    this.fallback = null;
    return this;
  };

  // Single attach point, called from the battle screen drawer.
  // A second attach is ignored. The parent is the Game root so the
  // backdrop can register on it.
  BattleBackdrop.prototype.attach = function (scene) {
    if (!scene || this._attached) return this;
    this.parent = scene;
    this._attached = true;
    if (typeof scene.register === "function") scene.register(this);
    if (!this.fallback) {
      var sf = window.SF;
      var gfx = sf && sf.BattleGfx;
      if (gfx && typeof gfx.paintBg === "function") this.fallback = gfx.paintBg;
    }
    return this;
  };

  BattleBackdrop.prototype.pathFor = function (id, layer) {
    var resolved = BattleBackdrop.resolveId(id);
    var row = BattleBackdrop.entry(resolved);
    if (!row) return null;
    if (layer) return row.layers && row.layers[layer] ? row.layers[layer].path : null;
    return row.dir || null;
  };

  BattleBackdrop.prototype.pathsFor = function (id) {
    var resolved = BattleBackdrop.resolveId(id);
    var row = BattleBackdrop.entry(resolved);
    var out = {};
    if (!row || !row.layers) return out;
    BattleBackdrop.LAYERS.forEach(function (layer) {
      out[layer] = row.layers[layer] && row.layers[layer].path ? row.layers[layer].path : null;
    });
    return out;
  };

  BattleBackdrop.prototype.setLayer = function (id, layer, image) {
    if (!id || !layer) return this;
    if (!this.images[id]) this.images[id] = {};
    if (BattleBackdrop.imageOk(image)) this.images[id][layer] = image;
    else delete this.images[id][layer];
    return this;
  };

  BattleBackdrop.prototype.layersReady = function (id) {
    var resolved = BattleBackdrop.resolveId(id);
    if (!BattleBackdrop.hasArt(resolved)) return false;
    var stored = this.images[resolved] || {};
    var i, layer;
    for (i = 0; i < BattleBackdrop.LAYERS.length; i++) {
      layer = BattleBackdrop.LAYERS[i];
      if (!BattleBackdrop.imageOk(stored[layer])) return false;
    }
    return true;
  };

  // Load every ready area's four layer images through AssetLoader.
  // A missing loader or a failed fetch leaves the area unready to blit;
  // draw then keeps today's backdrop path for that frame.
  BattleBackdrop.prototype.loadReady = function () {
    var self = this;
    var loader = sf && sf.AssetLoader;
    var ids = [];
    for (var i = 0; i < BattleBackdrop.IDS.length; i++) {
      var readyId = BattleBackdrop.IDS[i];
      if (BattleBackdrop.hasArt(readyId)) ids.push(readyId);
    }
    if (!ids.length || !loader || typeof loader.image !== "function") {
      return typeof Promise === "function" ? Promise.resolve(self) : self;
    }
    var jobs = [];
    ids.forEach(function (id) {
      BattleBackdrop.LAYERS.forEach(function (layer) {
        var path = self.pathFor(id, layer);
        jobs.push(loader.image(path).then(function (image) {
          if (image) self.setLayer(id, layer, image);
          return image;
        }));
      });
    });
    return Promise.all(jobs).then(function () { return self; });
  };

  BattleBackdrop.prototype.setLayers = function (id, images) {
    var self = this;
    if (!id || !images) return this;
    BattleBackdrop.LAYERS.forEach(function (layer) {
      if (Object.prototype.hasOwnProperty.call(images, layer)) self.setLayer(id, layer, images[layer]);
    });
    return this;
  };

  // Picks the four layer images for an area. Throws when that area is
  // marked as having art but the manifest entry, a layer path, or a
  // loaded layer image is missing.
  BattleBackdrop.prototype.imagesFor = function (id) {
    var resolved = BattleBackdrop.resolveId(id);
    var stored = this.images[resolved] || {};
    if (!BattleBackdrop.hasArt(resolved)) return stored;
    var row = BattleBackdrop.entry(resolved);
    if (!row || !row.layers) {
      throw new Error("BattleBackdrop missing manifest entry for " + resolved);
    }
    var out = {};
    var i, layer, spec;
    for (i = 0; i < BattleBackdrop.LAYERS.length; i++) {
      layer = BattleBackdrop.LAYERS[i];
      spec = row.layers[layer];
      if (!spec || !spec.path) {
        throw new Error("BattleBackdrop missing manifest entry for " + resolved);
      }
      if (!BattleBackdrop.imageOk(stored[layer])) {
        throw new Error("BattleBackdrop missing art for " + resolved);
      }
      out[layer] = stored[layer];
    }
    return out;
  };

  // Draws the four ready layers with a cover-fit, or keeps today's
  // existing backdrop path through the fallback. Never paints a new
  // code-drawn stand-in. Returns true only when the real layers were blitted.
  BattleBackdrop.prototype.draw = function (ctx, areaId, w, h, t) {
    if (!this._attached) throw new Error("BattleBackdrop is not attached");
    if (!ctx || typeof ctx.drawImage !== "function" || !(w > 0) || !(h > 0)) return false;
    var id = BattleBackdrop.resolveId(areaId);
    if (BattleBackdrop.hasArt(id)) {
      if (!this.layersReady(id)) {
        if (typeof this.fallback === "function") this.fallback(ctx, id, w, h, t || 0);
        return false;
      }
      var layers = this.imagesFor(id);
      var fit = BattleBackdrop.fit(w, h, id);
      ctx.imageSmoothingEnabled = false;
      BattleBackdrop.LAYERS.forEach(function (layer) {
        ctx.drawImage(layers[layer], fit.x, fit.y, fit.w, fit.h);
      });
      return true;
    }
    if (typeof this.fallback === "function") this.fallback(ctx, id, w, h, t || 0);
    return false;
  };

  BattleBackdrop.prototype.detach = function () {
    var parent = this.parent;
    this.parent = null;
    this._attached = false;
    if (parent && typeof parent.unregister === "function") parent.unregister(this);
    return this;
  };

  if (sf && sf.BattleBackdropData && sf.BattleBackdropData.ids) {
    BattleBackdrop.adopt(sf.BattleBackdropData);
  }
})();
