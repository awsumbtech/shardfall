"use strict";

// One job: the composition root. It keeps a live reference to the existing
// SF state, holds the canvas and viewport bootstrap, runs the frame loop,
// and registers child objects. window.SF stays the compatibility alias.
// The constructor and the SF.game root are published in js/main.js.
// attach does not write the root. game.state / game.sf accessors live there
// too, as counted write-through to the compatibility bag.
(function () {
  var Game = window.SF && window.SF.Game;
  if (typeof Game !== "function") {
    throw new Error("Game constructor missing");
  }

  Game.prototype.init = function () {
    this.parent = null;
    this._attached = false;
    this._entries = [];
    this._seq = 0;
    this._lastFrame = 0;
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
    return this;
  };

  Game.prototype.attach = function (parent) {
    if (!parent || this._attached) return this;
    this.parent = parent;
    this._attached = true;
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
    this._lastFrame = performance.now();
    requestAnimationFrame(function tick(now) {
      game.frame(now);
      requestAnimationFrame(tick);
    });
    return this;
  };

  Game.prototype.frame = function (now) {
    var last = this._lastFrame || now;
    var dt = Math.min(0.05, (now - last) / 1000);
    this._lastFrame = now;
    var SF = window.SF;
    if (this.portraitLock) {
      SF.draw();
      SF.syncUI();
      if (SF.noteOverlayPaint) SF.noteOverlayPaint();
      return this;
    }
    SF.update(dt);
    if (SF.feel) {
      try { SF.feel(dt); } catch (err) { /* a sound cue must not stop the frame */ }
    }
    this._resizeTick = (this._resizeTick || 0) + 1;
    if (this._resizeTick % 30 === 0 && SF.resize) SF.resize();
    SF.draw();
    SF.syncUI();
    if (SF.noteOverlayPaint) SF.noteOverlayPaint();
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
})();
