"use strict";

// One job: draw one real four-layer battle backdrop per area from a
// manifest (id -> sky, far, mid, floor image paths). Until an area is
// marked ready, it keeps today's existing backdrop path (Art.battleBg
// via BattleGfx.paintBg). This file never paints with tints, recolors,
// gradients, or code-drawn art.
// The constructor is published as a counted BattleBackdrop constructor assign in
// js/main.js. Game.init creates the one instance as game.battleBackdrop.
// The battle screen drawer is the single attach point.
(function () {
  var sf = window.SF;
  var BattleBackdrop = sf && sf.BattleBackdrop;
  if (typeof BattleBackdrop !== "function") {
    throw new Error("BattleBackdrop constructor missing");
  }

  BattleBackdrop.IDS = [
    "emberhold_meadow",
    "emberhold_scar",
    "cinderveil_ash",
    "ember_vault",
    "saltmere_shore",
    "saltmere_wreck",
    "highspire_road",
    "hush_deck"
  ];

  // Back to front. Sky is opaque; far, mid, and floor carry alpha.
  BattleBackdrop.LAYERS = ["sky", "far", "mid", "floor"];

  // Optional parallax hints, stored for a later motion step. This object
  // does not apply a drift on its own.
  BattleBackdrop.PARALLAX = { sky: 0, far: 0.15, mid: 0.4, floor: 1 };

  // Game Art & Motion kit root and the in-game copy of that tree.
  // Kit: shardfall/battle/backdrops/<id>/v1/<layer>.png
  BattleBackdrop.KIT = "shardfall/battle/backdrops/";
  BattleBackdrop.DIR = "assets/battle/backdrops/";
  BattleBackdrop.VERSION = "v1";
  BattleBackdrop.SIZE = { w: 480, h: 270 };
  // Plate Y of the horizon seam, matching js/art/scenes.js horizonY.
  BattleBackdrop.HORIZON = 124;

  BattleBackdrop.kitDir = function (id) {
    return BattleBackdrop.KIT + id + "/" + BattleBackdrop.VERSION + "/";
  };

  BattleBackdrop.dirFor = function (id) {
    return BattleBackdrop.DIR + id + "/" + BattleBackdrop.VERSION + "/";
  };

  BattleBackdrop.pathForId = function (id, layer) {
    return BattleBackdrop.dirFor(id) + layer + ".png";
  };

  BattleBackdrop.rowFor = function (id) {
    var layers = {};
    BattleBackdrop.LAYERS.forEach(function (layer) {
      layers[layer] = {
        path: BattleBackdrop.pathForId(id, layer),
        parallax: BattleBackdrop.PARALLAX[layer]
      };
    });
    return {
      ready: false,
      kit: BattleBackdrop.kitDir(id),
      dir: BattleBackdrop.dirFor(id),
      size: { w: BattleBackdrop.SIZE.w, h: BattleBackdrop.SIZE.h },
      horizon: BattleBackdrop.HORIZON,
      layers: layers
    };
  };

  BattleBackdrop.MANIFEST = {};
  BattleBackdrop.IDS.forEach(function (id) {
    BattleBackdrop.MANIFEST[id] = BattleBackdrop.rowFor(id);
  });

  BattleBackdrop.entry = function (id) {
    var manifest = BattleBackdrop.MANIFEST;
    if (!manifest || !Object.prototype.hasOwnProperty.call(manifest, id)) return null;
    return manifest[id];
  };

  BattleBackdrop.resolveId = function (id) {
    return BattleBackdrop.entry(id) ? id : "emberhold_meadow";
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
  BattleBackdrop.fit = function (w, h) {
    var pw = BattleBackdrop.SIZE.w;
    var ph = BattleBackdrop.SIZE.h;
    var plateY = BattleBackdrop.HORIZON;
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
      var layers = this.imagesFor(id);
      var fit = BattleBackdrop.fit(w, h);
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
})();
