"use strict";

// ShakeFx shakes the battle view when a hit deals damage.
// A killing blow replaces that shake with a larger one.
// The rules do not emit a crit, so there is no crit shake.
// It settles to rest and removes itself. It does not change damage,
// turn order, the soft tint, or the hit-pause clock.
// Reduced motion: the shake does not spawn.

(function () {
  // Crit shake is not implemented. Formula and the resolver never emit a
  // crit, and crit-ready stays reserved with no sender. Listening for it
  // would be a dead path. A kill still outranks a normal hit.
  var RANK = { hit: 1, kill: 2 };

  function feel() { return SF.BattleFeel || {}; }

  function now() {
    return feel().now ? feel().now() : Date.now();
  }

  function reduced() {
    return !!(feel().prefersReducedMotion && feel().prefersReducedMotion());
  }

  function frameMs() {
    return feel().FRAME_MS > 0 ? feel().FRAME_MS : 1000 / 60;
  }

  function spec(kind) {
    var f = feel();
    if (kind === "kill") return { px: f.SHAKE_KILL_PX || 8, frames: f.SHAKE_KILL_FRAMES || 14 };
    return { px: f.SHAKE_PX || 3, frames: f.SHAKE_FRAMES || 10 };
  }

  SF.ShakeFx = {
    owner: "ShakeFx",
    live: [],
    timers: [],
    reduced: false,
    _attached: false,

    attach: function () {
      if (SF.ShakeFx._attached) return;
      SF.ShakeFx._attached = true;
      var self = SF.ShakeFx;
      if (SF.BattleEvents) {
        SF.BattleEvents.on("hit", function (p) { self.onHit(p); });
        SF.BattleEvents.on("kill", function () { self.spawn("kill"); });
        SF.BattleEvents.on("battle-start", function () { self.clear(); });
      }
      self.hookFinish();
      self.hookDraw();
    },

    hookFinish: function () {
      if (!SF.Battle || !SF.Battle.flow || SF.ShakeFx._finish) return;
      SF.ShakeFx._finish = true;
      var inner = SF.Battle.flow.finish;
      SF.Battle.flow.finish = function (win) {
        SF.ShakeFx.clear();
        return inner.apply(this, arguments);
      };
    },

    // One screen shift for the whole battle draw. The next frame's
    // setTransform clears it. The HUD moves with the picture, by a few pixels.
    hookDraw: function () {
      if (!SF.drawBattle || SF.ShakeFx._draw) return;
      SF.ShakeFx._draw = true;
      var inner = SF.drawBattle;
      SF.drawBattle = function (ctx) {
        if (!ctx || !ctx.setTransform) return inner.apply(this, arguments);
        var orig = ctx.setTransform;
        ctx.setTransform = function () {
          var result = orig.apply(ctx, arguments);
          var off = SF.ShakeFx.sample();
          if (off && (off.x || off.y) && ctx.translate) ctx.translate(off.x, off.y);
          return result;
        };
        try {
          return inner.apply(this, arguments);
        } finally {
          ctx.setTransform = orig;
        }
      };
    },

    onHit: function (p) {
      if (!p || !(p.amount > 0)) return;
      SF.ShakeFx.spawn("hit");
    },

    spawn: function (kind) {
      if (reduced()) {
        SF.ShakeFx.reduced = true;
        return;
      }
      SF.ShakeFx.reduced = false;
      if (!RANK[kind]) kind = "hit";
      var cur = SF.ShakeFx.live[0];
      if (cur && RANK[cur.kind] > RANK[kind]) return;
      var row = spec(kind);
      SF.ShakeFx.live.length = 0;
      SF.ShakeFx.live.push({
        kind: kind,
        px: row.px,
        frames: row.frames,
        born: now()
      });
    },

    sweep: function () {
      var ms = frameMs();
      var t = now();
      var i = SF.ShakeFx.live.length;
      while (i--) {
        var row = SF.ShakeFx.live[i];
        var n = Math.floor((t - row.born) / ms + 1e-6);
        if (n >= row.frames) SF.ShakeFx.live.splice(i, 1);
      }
    },

    sample: function () {
      SF.ShakeFx.sweep();
      var top = SF.ShakeFx.live[0];
      if (!top) return { x: 0, y: 0 };
      var ms = frameMs();
      var n = Math.floor((now() - top.born) / ms + 1e-6);
      if (n < 0) n = 0;
      if (n >= top.frames) {
        SF.ShakeFx.live.shift();
        return SF.ShakeFx.sample();
      }
      var amp = top.px * (1 - n / top.frames);
      var mag = Math.round(amp);
      if (!(mag > 0)) return { x: 0, y: 0 };
      var sx = n % 2 === 0 ? 1 : -1;
      var sy = n % 4 === 1 || n % 4 === 2 ? 1 : -1;
      var y = mag === 1 ? 0 : sy * Math.max(1, Math.round(mag * 0.5));
      return { x: sx * mag, y: y };
    },

    clear: function () {
      SF.ShakeFx.live.length = 0;
      SF.ShakeFx.timers.length = 0;
    }
  };
})();
