"use strict";

// One job: draw one battle foe from the catalog filled by
// js/data/battle-foes.js (id -> sheet path, cell, pivot, hover, and the
// frames and fps per animation). Until a foe is marked ready, the battle
// stage keeps today's existing Art.sprite / BattleGfx.drawSprite path.
// This file never paints a flash, tint, or code-drawn shadow.
// The constructor is published as a counted BattleFoeSprite constructor
// assign in js/main.js. Game.init creates the one instance as
// game.battleFoeSprite. The battle screen drawer is the single attach point.
(function () {
  var sf = window.SF;
  var BattleFoeSprite = sf && sf.BattleFoeSprite;
  if (typeof BattleFoeSprite !== "function") {
    throw new Error("BattleFoeSprite constructor missing");
  }

  BattleFoeSprite.IDS = [];
  BattleFoeSprite.KINDS = {};
  BattleFoeSprite.MANIFEST = {};
  BattleFoeSprite.SCALE = 2;
  BattleFoeSprite.KIT = "";
  BattleFoeSprite.DIR = "";
  BattleFoeSprite.VERSION = "";
  BattleFoeSprite.POSES = { ko: "death", death: "death", hurt: "hurt", attack: "attack", cast: "cast", idle: "idle" };

  var nowMs = function () {
    if (typeof performance !== "undefined" && performance.now) return performance.now();
    return Date.now();
  };

  BattleFoeSprite.adopt = function (data) {
    BattleFoeSprite.DATA = data || null;
    BattleFoeSprite.IDS = [];
    BattleFoeSprite.KINDS = {};
    BattleFoeSprite.MANIFEST = {};
    BattleFoeSprite.KIT = "";
    BattleFoeSprite.DIR = "";
    BattleFoeSprite.VERSION = "";
    BattleFoeSprite.SCALE = 2;
    if (!data) return BattleFoeSprite;
    var name;
    BattleFoeSprite.KIT = data.kit || "";
    BattleFoeSprite.DIR = data.dir || "";
    BattleFoeSprite.VERSION = data.version || "";
    if (data.scale > 0) BattleFoeSprite.SCALE = data.scale;
    BattleFoeSprite.IDS = (data.ids && data.ids.length) ? data.ids.slice() : [];
    if (!BattleFoeSprite.IDS.length && data.foes) {
      for (name in data.foes) {
        if (Object.prototype.hasOwnProperty.call(data.foes, name)) BattleFoeSprite.IDS.push(name);
      }
    }
    BattleFoeSprite.KINDS = data.kinds || {};
    BattleFoeSprite.MANIFEST = data.foes || {};
    return BattleFoeSprite;
  };

  BattleFoeSprite.resolveId = function (id) {
    if (!id) return null;
    var mapped = BattleFoeSprite.KINDS[id];
    if (mapped) return mapped;
    return id;
  };

  BattleFoeSprite.entry = function (id) {
    var resolved = BattleFoeSprite.resolveId(id);
    var manifest = BattleFoeSprite.MANIFEST;
    if (!resolved || !manifest || !Object.prototype.hasOwnProperty.call(manifest, resolved)) return null;
    return manifest[resolved];
  };

  BattleFoeSprite.hasArt = function (id) {
    var row = BattleFoeSprite.entry(id);
    return !!(row && row.ready);
  };

  BattleFoeSprite.imageOk = function (image) {
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

  BattleFoeSprite.prototype.init = function () {
    this.parent = null;
    this._attached = false;
    this.images = {};
    this._anim = {};
    return this;
  };

  // Single attach point, called from the battle screen drawer.
  // A second attach is ignored. The parent is the Game root so the
  // sprite object can register on it.
  BattleFoeSprite.prototype.attach = function (scene) {
    if (!scene || this._attached) return this;
    this.parent = scene;
    this._attached = true;
    if (typeof scene.register === "function") scene.register(this);
    return this;
  };

  BattleFoeSprite.prototype.pathFor = function (id) {
    var row = BattleFoeSprite.entry(id);
    return row && row.path ? row.path : null;
  };

  BattleFoeSprite.prototype.entryFor = function (id) {
    return BattleFoeSprite.entry(id);
  };

  BattleFoeSprite.prototype.hasArt = function (id) {
    return BattleFoeSprite.hasArt(id);
  };

  BattleFoeSprite.prototype.hoverPx = function (id) {
    var row = BattleFoeSprite.entry(id);
    if (!row || !row.ready) return 0;
    return row.hover_px || 0;
  };

  BattleFoeSprite.prototype.sourceSize = function (id) {
    var row = BattleFoeSprite.entry(id);
    if (!row || !row.ready || !row.cell || !row.pivot) return null;
    return { w: row.cell.w, h: row.cell.h, ax: row.pivot.x, ay: row.pivot.y };
  };

  BattleFoeSprite.prototype.scaleFor = function (id) {
    if (!BattleFoeSprite.hasArt(id)) return 0;
    return BattleFoeSprite.SCALE;
  };

  BattleFoeSprite.prototype.setSheet = function (id, image) {
    var resolved = BattleFoeSprite.resolveId(id);
    if (!resolved) return this;
    if (BattleFoeSprite.imageOk(image)) this.images[resolved] = image;
    else delete this.images[resolved];
    return this;
  };

  BattleFoeSprite.prototype.sheetReady = function (id) {
    var resolved = BattleFoeSprite.resolveId(id);
    if (!BattleFoeSprite.hasArt(resolved)) return false;
    return BattleFoeSprite.imageOk(this.images[resolved]);
  };

  BattleFoeSprite.prototype.loadReady = function () {
    var self = this;
    var loader = sf && sf.AssetLoader;
    var ids = [];
    var i, readyId;
    for (i = 0; i < BattleFoeSprite.IDS.length; i++) {
      readyId = BattleFoeSprite.IDS[i];
      if (BattleFoeSprite.hasArt(readyId)) ids.push(readyId);
    }
    if (!ids.length || !loader || typeof loader.image !== "function") {
      return typeof Promise === "function" ? Promise.resolve(self) : self;
    }
    var jobs = [];
    for (i = 0; i < ids.length; i++) {
      (function (foeId) {
        var path = self.pathFor(foeId);
        jobs.push(loader.image(path).then(function (image) {
          if (image) self.setSheet(foeId, image);
          return image;
        }));
      })(ids[i]);
    }
    return Promise.all(jobs).then(function () { return self; });
  };

  BattleFoeSprite.prototype.poseName = function (pose) {
    var mapped = BattleFoeSprite.POSES[pose];
    if (mapped) return mapped;
    if (pose === "idle" || pose === "attack" || pose === "hurt" || pose === "death" || pose === "cast") return pose;
    return "idle";
  };

  BattleFoeSprite.prototype.frameIndex = function (id, pose, actor, at) {
    var row = BattleFoeSprite.entry(id);
    if (!row || !row.animations) return 0;
    var name = this.poseName(pose);
    var anim = row.animations[name] || row.animations.idle;
    if (!anim || !(anim.count > 0)) return 0;
    var key = (actor && actor.id) ? actor.id : BattleFoeSprite.resolveId(id);
    var t = at != null ? at : nowMs();
    var rec = this._anim[key];
    if (!rec || rec.pose !== name) {
      rec = { pose: name, started: t };
      this._anim[key] = rec;
    }
    var fps = anim.fps > 0 ? anim.fps : 6;
    var elapsed = (t - rec.started) / 1000;
    if (elapsed < 0) elapsed = 0;
    var frame;
    if (anim.loop) {
      frame = Math.floor(elapsed * fps) % anim.count;
    } else {
      frame = Math.floor(elapsed * fps);
      if (frame >= anim.count) frame = anim.count - 1;
    }
    if (frame < 0) frame = 0;
    return frame;
  };

  // Draws one catalog cell at a whole 2x, smoothing off, with the
  // catalog pivot on (x, y) and hover lifting fliers. Returns true
  // only when a real sheet cell was blitted.
  BattleFoeSprite.prototype.draw = function (ctx, id, x, y, pose, actor) {
    if (!this._attached) throw new Error("BattleFoeSprite is not attached");
    if (!ctx || typeof ctx.drawImage !== "function") return false;
    if (!BattleFoeSprite.hasArt(id)) return false;
    var row = BattleFoeSprite.entry(id);
    if (!row || !row.cell || !row.pivot) return false;
    var resolved = BattleFoeSprite.resolveId(id);
    var image = this.images[resolved];
    if (!BattleFoeSprite.imageOk(image)) return false;
    var name = this.poseName(pose);
    var anim = row.animations && (row.animations[name] || row.animations.idle);
    if (!anim) return false;
    var frame = this.frameIndex(id, name, actor);
    var cellW = row.cell.w;
    var cellH = row.cell.h;
    var scale = BattleFoeSprite.SCALE;
    var hover = (row.hover_px || 0) * scale;
    var sx = frame * cellW;
    var sy = (anim.row || 0) * cellH;
    var destX = Math.round(x - row.pivot.x * scale);
    var destY = Math.round(y - hover - row.pivot.y * scale);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, sx, sy, cellW, cellH, destX, destY, cellW * scale, cellH * scale);
    return true;
  };

  BattleFoeSprite.prototype.detach = function () {
    var parent = this.parent;
    this.parent = null;
    this._attached = false;
    if (parent && typeof parent.unregister === "function") parent.unregister(this);
    return this;
  };

  if (sf && sf.BattleFoeData && sf.BattleFoeData.ids) {
    BattleFoeSprite.adopt(sf.BattleFoeData);
  }
})();
