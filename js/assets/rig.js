"use strict";

// One job: stack ordered paper-doll layers on one foot point. It does not
// choose the pose. If any layer is missing, it draws nothing so the caller
// can fall back to the code sprite.
(function () {
  var SF = window.SF || {};
  window.SF = SF;

  function wholeScale(scale) {
    var n = Math.round(scale);
    if (!(n >= 1)) return 1;
    return n;
  }

  function LayeredSprite(registry, keys, renderer) {
    this.registry = registry || null;
    this.renderer = renderer || null;
    this.keys = [];
    var list = keys || [];
    var i;
    for (i = 0; i < list.length; i++) if (list[i]) this.keys.push(list[i]);
  }

  // Idle body is 20px tall, 18px of it above the foot anchor. Today's field
  // hero is 29px tall. Scale 2 is 40px, taller than that hero, so the field
  // draws at 1. The view then scales by a whole number, nearest neighbor.
  LayeredSprite.FIELD_SCALE = 1;

  // Draw order is the sheet's order: body, then pants, shoes, shirt, hair.
  LayeredSprite.HERO = [
    "kenmi.hero.base",
    "kenmi.hero.pants",
    "kenmi.hero.shoes",
    "kenmi.hero.shirt",
    "kenmi.hero.hair"
  ];

  LayeredSprite.prototype.draw = function (ctx, x, y, opts) {
    if (!ctx || !this.registry || !this.renderer || !this.keys.length) return false;
    if (typeof this.registry.lookup !== "function" || typeof this.renderer.drawFrame !== "function") return false;
    opts = opts || {};
    var scale = wholeScale(opts.scale != null ? opts.scale : LayeredSprite.FIELD_SCALE);
    var query = {
      name: opts.name || null,
      index: opts.frame,
      facing: opts.facing,
      flip: !!opts.flip,
      pose: opts.clip || opts.pose
    };
    var ready = [];
    var i, desc;
    for (i = 0; i < this.keys.length; i++) {
      try {
        desc = this.registry.lookup(this.keys[i], query);
      } catch (err) {
        return false;
      }
      if (!desc || !desc.ready || !desc.image || !desc.frame) return false;
      ready.push(desc);
    }
    for (i = 0; i < ready.length; i++) {
      this.renderer.drawFrame(ctx, ready[i], x, y, { scale: scale });
    }
    return true;
  };

  SF.LayeredSprite = LayeredSprite;
})();
