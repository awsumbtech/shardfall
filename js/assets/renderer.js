"use strict";

// One job: draw one registry entry. A loaded sheet frame is scaled in whole
// pixels with nearest-neighbor sampling. Anything else draws the code-art fallback.
(function () {
  var SF = window.SF || {};
  window.SF = SF;

  function SpriteRenderer(registry) {
    this.registry = registry || null;
  }

  function queryFor(opts) {
    opts = opts || {};
    var query = {
      pose: opts.pose,
      facing: opts.facing,
      index: opts.frame,
      name: opts.name || null,
      flip: !!opts.flip
    };
    if (opts.clip && opts.time != null && SF.animator && typeof SF.animator.frame === "function") {
      var picked = SF.animator.frame(opts.clip, opts.time, opts.facing);
      query.name = picked.name;
      query.index = picked.frame;
      query.flip = picked.flip;
      query.facing = opts.facing;
    }
    return query;
  }

  SpriteRenderer.prototype.drawCode = function (ctx, id, x, y, opts) {
    if (!ctx || !id || !window.Art || typeof Art.sprite !== "function") return false;
    Art.sprite(ctx, id, x, y, opts || {});
    return true;
  };

  // Same whole-pixel rule as Art.blit, with a source rect and an optional side flip.
  SpriteRenderer.prototype.blit = function (ctx, image, sx, sy, sw, sh, x, y, dw, dh, flip) {
    if (!ctx || !image || dw < 1 || dh < 1 || sw < 1 || sh < 1) return;
    var smooth = ctx.imageSmoothingEnabled;
    function paint(dx, dy, ddw, ddh) {
      ctx.imageSmoothingEnabled = false;
      if (!flip) {
        ctx.drawImage(image, sx, sy, sw, sh, dx, dy, ddw, ddh);
        return;
      }
      ctx.save();
      ctx.translate(Math.round(dx + ddw), Math.round(dy));
      ctx.scale(-1, 1);
      ctx.drawImage(image, sx, sy, sw, sh, 0, 0, ddw, ddh);
      ctx.restore();
    }
    try {
      if (ctx.getTransform && ctx.setTransform) {
        var t = ctx.getTransform();
        if (t && t.b === 0 && t.c === 0 && t.a !== 0 && t.d !== 0) {
          var px = t.a * x + t.e;
          var py = t.d * y + t.f;
          var isx = Math.max(1, Math.round(Math.abs(t.a * dw) / sw));
          var isy = Math.max(1, Math.round(Math.abs(t.d * dh) / sh));
          ctx.save();
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          paint(Math.round(px), Math.round(py), sw * isx, sh * isy);
          ctx.restore();
          return;
        }
      }
      paint(x, y, dw, dh);
    } finally {
      ctx.imageSmoothingEnabled = smooth;
    }
  };

  SpriteRenderer.prototype.drawFrame = function (ctx, desc, x, y, opts) {
    var frame = desc.frame;
    var scale = opts && opts.scale != null ? opts.scale : 1;
    if (!(scale > 0)) scale = 1;
    var anchor = opts && opts.anchor;
    var ax;
    var ay;
    if (anchor === "center") {
      ax = frame.w / 2;
      ay = frame.h / 2;
    } else if (anchor === "top") {
      ax = frame.w / 2;
      ay = 0;
    } else if (desc.anchor) {
      ax = desc.anchor.x - (frame.ox || 0);
      ay = desc.anchor.y - (frame.oy || 0);
      // A trimmed frame is not centered in the cell. Mirror around the foot,
      // not around the unflipped offset, or left-facing layers shift by a pixel.
      if (desc.flip) ax = frame.w - ax;
    } else {
      ax = (frame.w / 2) | 0;
      ay = frame.h - 1;
    }
    this.blit(
      ctx,
      desc.image,
      frame.x, frame.y, frame.w, frame.h,
      x - ax * scale, y - ay * scale,
      frame.w * scale, frame.h * scale,
      !!desc.flip
    );
  };

  SpriteRenderer.prototype.draw = function (ctx, key, x, y, opts) {
    if (!ctx || !key) return false;
    opts = opts || {};
    var reg = this.registry || SF.assets;
    if (!reg || typeof reg.lookup !== "function") return this.drawCode(ctx, key, x, y, opts);
    var desc;
    try {
      desc = reg.lookup(key, queryFor(opts));
    } catch (err) {
      desc = null;
    }
    if (desc && desc.ready && desc.image && desc.frame) {
      try {
        this.drawFrame(ctx, desc, x, y, opts);
        return true;
      } catch (err2) {
        /* a bad frame falls through to the code sprite */
      }
    }
    return this.drawCode(ctx, (desc && desc.codeId) || key, x, y, opts);
  };

  SF.SpriteRenderer = SpriteRenderer;
})();
