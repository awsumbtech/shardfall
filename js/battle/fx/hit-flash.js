"use strict";

// HitFlash records a damaging hit on the target for a couple of frames.
// It does not read FLASH_TINT, and it does not change that tint.
// A white-flash sprite is not in this repo. This object does not recolor
// the actor and does not fill a rectangle in its place.
// A heal does not flash. Reduced motion keeps the record at a lower alpha.

(function () {
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

  SF.HitFlash = {
    owner: "HitFlash",
    live: [],
    timers: [],
    reduced: false,
    _scratch: null,
    _attached: false,

    attach: function () {
      if (SF.HitFlash._attached) return;
      SF.HitFlash._attached = true;
      var self = SF.HitFlash;
      if (SF.BattleEvents) {
        SF.BattleEvents.on("hit", function (p) { self.onHit(p); });
        SF.BattleEvents.on("battle-start", function () { self.clear(); });
      }
      self.hookFinish();
      self.hookStage();
    },

    hookFinish: function () {
      if (!SF.Battle || !SF.Battle.flow || SF.HitFlash._finish) return;
      SF.HitFlash._finish = true;
      var inner = SF.Battle.flow.finish;
      SF.Battle.flow.finish = function (win) {
        SF.HitFlash.clear();
        return inner.apply(this, arguments);
      };
    },

    // Wraps the stage after SlashTrail so the white sits on top of the arc.
    hookStage: function () {
      if (!SF.BattleStage || !SF.BattleStage.drawStage || SF.HitFlash._stage) return;
      SF.HitFlash._stage = true;
      var inner = SF.BattleStage.drawStage;
      SF.BattleStage.drawStage = function (ctx, b) {
        var laid = inner.apply(this, arguments);
        if (laid) SF.HitFlash.paint(ctx, b, laid.foes, laid.party);
        return laid;
      };
    },

    onHit: function (p) {
      if (!p || !(p.amount > 0) || !p.tgt) return;
      SF.HitFlash.spawn(p.tgt);
    },

    spawn: function (id) {
      var calm = reduced();
      var f = feel();
      var alpha = calm ? (f.HIT_FLASH_REDUCED_ALPHA != null ? f.HIT_FLASH_REDUCED_ALPHA : 0.42) : (f.HIT_FLASH_ALPHA != null ? f.HIT_FLASH_ALPHA : 1);
      var frames = f.HIT_FLASH_FRAMES || 2;
      SF.HitFlash.reduced = calm;
      var next = [];
      var i;
      for (i = 0; i < SF.HitFlash.live.length; i++) {
        if (SF.HitFlash.live[i].id !== id) next.push(SF.HitFlash.live[i]);
      }
      next.push({ id: id, born: now(), frames: frames, alpha: alpha, reduced: calm });
      SF.HitFlash.live = next;
    },

    sweep: function () {
      var ms = frameMs();
      var t = now();
      var next = [];
      var i;
      for (i = 0; i < SF.HitFlash.live.length; i++) {
        var row = SF.HitFlash.live[i];
        var n = Math.floor((t - row.born) / ms + 1e-6);
        if (n < row.frames) next.push(row);
      }
      SF.HitFlash.live = next;
    },

    // The flash record stays on the target id. Painting waits on a real
    // flash sprite. None is in the tree, so this does not touch the canvas.
    paint: function () {
      SF.HitFlash.sweep();
    },

    clear: function () {
      SF.HitFlash.live.length = 0;
      SF.HitFlash.timers.length = 0;
    }
  };
})();
