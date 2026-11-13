"use strict";

// SlashTrail records a physical swing and parents that record to the attacker.
// A spell, a heal, an item, or a non-attack command does not get one.
// The record is removed when the swing time ends.
// There is no slash-arc image in this repo. art/fx-tiles.png is a flat shadow
// stamp and art/meta-tiles.png is solid debug color. Neither is a slash.
// This object does not stroke, plot, or build a bitmap in its place.
// Reduced motion: the record stays, and its stored alpha is lower.

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

  function isPhysical(action) {
    if (!action) return false;
    if (action.type === "item" || action.type === "defend" || action.type === "flee" || action.type === "menu") {
      return false;
    }
    if (action.type !== "attack" && action.type !== "skill") return false;
    var skill = null;
    if (action.skillId && SF.skillById) skill = SF.skillById(action.skillId);
    else if (SF.skillById) skill = SF.skillById("attack");
    if (!skill) return action.type === "attack";
    if (skill.mag || skill.heal || skill.scan || skill.defUp || skill.spdUp || skill.steal) return false;
    if (!(skill.power > 0) && skill.id !== "attack") return false;
    return true;
  }

  SF.SlashTrail = {
    owner: "SlashTrail",
    live: [],
    timers: [],
    reduced: false,
    _attached: false,

    isPhysical: isPhysical,

    attach: function () {
      if (SF.SlashTrail._attached) return;
      SF.SlashTrail._attached = true;
      var self = SF.SlashTrail;
      if (SF.BattleEvents) {
        SF.BattleEvents.on("action", function (p) { self.onAction(p); });
        SF.BattleEvents.on("battle-start", function () { self.clear(); });
      }
      self.hookFinish();
      self.hookStage();
    },

    hookFinish: function () {
      if (!SF.Battle || !SF.Battle.flow || SF.SlashTrail._finish) return;
      SF.SlashTrail._finish = true;
      var inner = SF.Battle.flow.finish;
      SF.Battle.flow.finish = function (win) {
        SF.SlashTrail.clear();
        return inner.apply(this, arguments);
      };
    },

    hookStage: function () {
      if (!SF.BattleStage || !SF.BattleStage.drawStage || SF.SlashTrail._stage) return;
      SF.SlashTrail._stage = true;
      var inner = SF.BattleStage.drawStage;
      SF.BattleStage.drawStage = function (ctx, b) {
        var laid = inner.apply(this, arguments);
        if (laid) SF.SlashTrail.paint(ctx, b, laid.foes, laid.party);
        return laid;
      };
    },

    onAction: function (p) {
      var action = p && p.action;
      if (!isPhysical(action)) {
        SF.SlashTrail.clear();
        return;
      }
      SF.SlashTrail.spawn(p.actorId);
    },

    spawn: function (actorId) {
      if (!actorId) return;
      var calm = reduced();
      var f = feel();
      SF.SlashTrail.reduced = calm;
      SF.SlashTrail.live.length = 0;
      SF.SlashTrail.live.push({
        actorId: actorId,
        born: now(),
        frames: f.SLASH_FRAMES || 12,
        alpha: calm ? (f.SLASH_REDUCED_ALPHA != null ? f.SLASH_REDUCED_ALPHA : 0.34) : (f.SLASH_ALPHA != null ? f.SLASH_ALPHA : 0.92),
        reduced: calm
      });
    },

    sweep: function () {
      var ms = frameMs();
      var t = now();
      var i = SF.SlashTrail.live.length;
      while (i--) {
        var row = SF.SlashTrail.live[i];
        var n = Math.floor((t - row.born) / ms + 1e-6);
        if (n >= row.frames) SF.SlashTrail.live.splice(i, 1);
      }
    },

    // The swing is still attached to the attacker id on the live record.
    // Painting waits on a real slash sprite. None is in the tree.
    paint: function () {
      SF.SlashTrail.sweep();
    },

    clear: function () {
      SF.SlashTrail.live.length = 0;
      SF.SlashTrail.timers.length = 0;
    }
  };
})();
