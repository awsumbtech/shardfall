"use strict";

// KillFreeze holds the killing blow, then eases the clock back to full speed.
// The hold is longer than the normal hit pause. It writes the existing
// hitPause field the turn machine already consumes. It does not change
// damage, turn order, or the length of an ordinary hit.
// Reduced motion: a 2-frame stop, and no slow-motion.
// Instant battles (the parity runner) are left on the normal clock.

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

  function battle() {
    return SF.state && SF.state.battle;
  }

  SF.KillFreeze = {
    owner: "KillFreeze",
    live: [],
    timers: [],
    reduced: false,
    slowing: false,
    holdFrames: 0,
    _armed: false,
    _slowStart: null,
    _attached: false,

    attach: function () {
      if (SF.KillFreeze._attached) return;
      SF.KillFreeze._attached = true;
      var self = SF.KillFreeze;
      if (SF.BattleEvents) {
        SF.BattleEvents.on("kill", function (p) { self.arm(p); });
        SF.BattleEvents.on("hit-pause", function () { self.apply(); });
        SF.BattleEvents.on("battle-start", function () { self.clear(); });
      }
      self.hookFinish();
      self.hookUpdate();
    },

    hookFinish: function () {
      if (!SF.Battle || !SF.Battle.flow || SF.KillFreeze._finish) return;
      SF.KillFreeze._finish = true;
      var inner = SF.Battle.flow.finish;
      SF.Battle.flow.finish = function (win) {
        SF.KillFreeze.clear();
        return inner.apply(this, arguments);
      };
    },

    // Scales dt only after the hold, and only while a kill ease is armed.
    // The turn machine still subtracts hitPause itself.
    hookUpdate: function () {
      if (!SF.Battle || !SF.Battle.update || SF.KillFreeze._update) return;
      SF.KillFreeze._update = true;
      var inner = SF.Battle.update;
      SF.Battle.update = function (dt) {
        var b = battle();
        var scaled = SF.KillFreeze.scale(b, dt);
        return inner.call(SF.Battle, scaled);
      };
    },

    arm: function (p) {
      var calm = reduced();
      var instant = !!(SF.Battle && SF.Battle.instant);
      var f = feel();
      var frames = calm ? (f.KILL_FREEZE_REDUCED_FRAMES || 2) : (SF.tune && typeof SF.tune.killFreeze === "number" ? SF.tune.killFreeze : (f.KILL_FREEZE_FRAMES || 9));
      SF.KillFreeze.reduced = calm;
      SF.KillFreeze.holdFrames = frames;
      SF.KillFreeze.slowing = !calm && !instant;
      SF.KillFreeze._slowStart = null;
      SF.KillFreeze._armed = true;
      SF.KillFreeze.live.length = 0;
      SF.KillFreeze.live.push({
        kind: "freeze",
        frames: frames,
        born: now(),
        tgt: p && p.tgt,
        reduced: calm,
        slow: SF.KillFreeze.slowing
      });
      SF.KillFreeze.apply();
    },

    apply: function () {
      if (!SF.KillFreeze._armed) return;
      if (SF.Battle && SF.Battle.instant) return;
      var b = battle();
      if (!b) return;
      var ms = SF.KillFreeze.holdFrames * frameMs();
      b.hitPause = Math.max(b.hitPause || 0, ms / 1000);
    },

    scale: function (b, dt) {
      SF.KillFreeze.sweep();
      if (!(dt > 0)) return dt || 0;
      if (!SF.KillFreeze.slowing) return dt;
      if (SF.Battle && SF.Battle.instant) return dt;
      if (!b) {
        SF.KillFreeze.slowing = false;
        return dt;
      }
      if (b.hitPause > 0) return dt;
      var dur = (feel().KILL_SLOW_FRAMES || 8) * frameMs();
      if (SF.KillFreeze._slowStart == null) SF.KillFreeze._slowStart = now();
      var age = now() - SF.KillFreeze._slowStart;
      if (age >= dur) {
        SF.KillFreeze.slowing = false;
        return dt;
      }
      var t = dur > 0 ? age / dur : 1;
      var eased = 1 - Math.pow(1 - t, 2);
      var from = SF.tune && typeof SF.tune.killSlow === "number" ? SF.tune.killSlow : (feel().KILL_SLOW_FROM != null ? feel().KILL_SLOW_FROM : 0.22);
      var k = from + (1 - from) * eased;
      return dt * k;
    },

    sweep: function () {
      var ms = frameMs();
      var slowFrames = feel().KILL_SLOW_FRAMES || 8;
      var t = now();
      var i = SF.KillFreeze.live.length;
      while (i--) {
        var row = SF.KillFreeze.live[i];
        var life = row.frames + (row.slow ? slowFrames : 0);
        var n = Math.floor((t - row.born) / ms + 1e-6);
        if (n >= life) SF.KillFreeze.live.splice(i, 1);
      }
      if (!SF.KillFreeze.live.length && SF.KillFreeze._slowStart != null) {
        var dur = slowFrames * ms;
        if (t - SF.KillFreeze._slowStart >= dur) SF.KillFreeze.slowing = false;
      }
    },

    clear: function () {
      SF.KillFreeze.live.length = 0;
      SF.KillFreeze.timers.length = 0;
      SF.KillFreeze.slowing = false;
      SF.KillFreeze._armed = false;
      SF.KillFreeze._slowStart = null;
      SF.KillFreeze.holdFrames = 0;
      SF.KillFreeze.reduced = false;
    }
  };
})();
