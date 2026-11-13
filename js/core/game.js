"use strict";

// One job: the composition root. It keeps a live reference to the existing
// SF state, holds the canvas and viewport bootstrap, runs the frame loop,
// and registers child objects. window.SF stays the compatibility alias.
(function () {
  var SF = window.SF || {};
  window.SF = SF;

  function Game() {
    this.parent = null;
    this._attached = false;
    this._entries = [];
    this._seq = 0;
    // Canvas and viewport bootstrap. These lived as scattered SF.* members.
    this.view = null;
    this.map = null;
    this.ctx = null;
    this.portraitLock = false;
    this._resizeTick = 0;
    this.resizeWrites = 0;
    this.pixelScale = 1;
    this.BASE_W = 640;
    this.BASE_H = 360;
    this.ASPECT_MIN = 4 / 3;
    this.ASPECT_MAX = 21 / 9;
  }

  function bag() {
    return window.SF || null;
  }

  // Same object SF.state already points at. Reading and writing go through
  // the compatibility alias, so a later SF.state = fresh() stays visible here.
  Object.defineProperty(Game.prototype, "sf", {
    enumerable: true,
    configurable: true,
    get: function () {
      return bag();
    }
  });

  Object.defineProperty(Game.prototype, "state", {
    enumerable: true,
    configurable: true,
    get: function () {
      var host = bag();
      return host ? host.state : undefined;
    },
    set: function (value) {
      var host = bag();
      if (host) host.state = value;
    }
  });

  Game.prototype.attach = function (parent) {
    if (!parent || this._attached) return this;
    this.parent = parent;
    this._attached = true;
    var host = bag();
    if (host) host.game = this;
    return this;
  };

  Game.prototype.register = function (obj) {
    if (!obj) return this;
    var i;
    for (i = 0; i < this._entries.length; i++) {
      if (this._entries[i].obj === obj) return this;
    }
    this._entries.push({ obj: obj, order: this._seq });
    this._seq += 1;
    return this;
  };

  Game.prototype.unregister = function (obj) {
    var i;
    for (i = 0; i < this._entries.length; i++) {
      if (this._entries[i].obj === obj) {
        this._entries.splice(i, 1);
        break;
      }
    }
    return this;
  };

  Game.prototype.objects = function () {
    var out = [];
    var i;
    for (i = 0; i < this._entries.length; i++) out.push(this._entries[i].obj);
    return out;
  };

  // Low z first. Equal z keeps registration order.
  Game.prototype.ordered = function () {
    var copy = this._entries.slice();
    copy.sort(function (a, b) {
      var az = typeof a.obj.z === "number" ? a.obj.z : 0;
      var bz = typeof b.obj.z === "number" ? b.obj.z : 0;
      if (az !== bz) return az - bz;
      return a.order - b.order;
    });
    var out = [];
    var i;
    for (i = 0; i < copy.length; i++) out.push(copy[i].obj);
    return out;
  };

  // The page frame loop. It still calls the existing SF.update / SF.draw
  // path. Child VisualObjects are not walked from here yet.
  Game.prototype.startLoop = function () {
    var game = this;
    var last = performance.now();
    function frame(now) {
      var dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (game.portraitLock) {
        SF.draw();
        SF.syncUI();
        if (SF.noteOverlayPaint) SF.noteOverlayPaint();
        requestAnimationFrame(frame);
        return;
      }
      SF.update(dt);
      if (SF.feel) {
        try { SF.feel(dt); } catch (err) { /* a sound cue must not stop the frame */ }
      }
      game._resizeTick = (game._resizeTick || 0) + 1;
      if (game._resizeTick % 30 === 0 && SF.resize) SF.resize();
      SF.draw();
      SF.syncUI();
      if (SF.noteOverlayPaint) SF.noteOverlayPaint();
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    return this;
  };

  // Not called from the frame loop. Present so a later step can walk children.
  Game.prototype.update = function (dt) {
    var list = this.ordered();
    var i;
    for (i = 0; i < list.length; i++) {
      if (typeof list[i].update === "function") list[i].update(dt);
    }
    return this;
  };

  Game.prototype.draw = function (ctx) {
    var list = this.ordered();
    var i;
    for (i = 0; i < list.length; i++) {
      if (typeof list[i].draw === "function") list[i].draw(ctx);
    }
    return this;
  };

  if (typeof SF.defineGame === "function") SF.defineGame(Game);
})();
