"use strict";

// SlashTrail draws the arc of a physical swing and parents it to the attacker.
// A spell, a heal, an item, or a non-attack command does not get one.
// The arc is removed when the swing time ends. It does not change damage,
// pose selection, or the elemental sparks already on the stage.
// Reduced motion: the arc stays, shorter and fainter.

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

  function findSpot(list, id) {
    var i;
    if (!list) return null;
    for (i = 0; i < list.length; i++) {
      if (list[i].actor && list[i].actor.id === id) return list[i];
    }
    return null;
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

    paint: function (ctx, b, foes, party) {
      SF.SlashTrail.sweep();
      if (!ctx || !SF.SlashTrail.live.length || !b) return;
      var i;
      for (i = 0; i < SF.SlashTrail.live.length; i++) {
        SF.SlashTrail.paintOne(ctx, b, SF.SlashTrail.live[i], foes, party);
      }
    },

    paintOne: function (ctx, b, row, foes, party) {
      var spot = findSpot(party, row.actorId) || findSpot(foes, row.actorId);
      if (!spot || !spot.actor) return;
      var ms = frameMs();
      var dur = Math.max(1, row.frames * ms);
      var p = Math.max(0, Math.min(1, (now() - row.born) / dur));
      var fade = 1 - p;
      if (!(fade > 0.02)) return;
      var actor = spot.actor;
      var nudge = SF.BattleGfx && SF.BattleGfx.actorNudge ? SF.BattleGfx.actorNudge(b, actor) : { x: 0, y: 0 };
      var forward = actor.side === "party" ? -1 : 1;
      var h = spot.hit && spot.hit.h ? spot.hit.h : 40;
      var radius = Math.max(22, h * 0.62);
      if (row.reduced) radius *= 0.55;
      var ox = spot.x + nudge.x + forward * Math.max(8, h * 0.16);
      var oy = spot.feet + nudge.y - h * 0.58;
      var steps = 7;
      var pts = [];
      var s;
      for (s = 0; s <= steps; s++) {
        var u = s / steps;
        var along = (u - 0.5) * radius * 1.35;
        var bulge = Math.sin(u * Math.PI) * radius;
        pts.push({ x: Math.round(ox + forward * bulge), y: Math.round(oy + along) });
      }
      if (!ctx.beginPath || !ctx.moveTo || !ctx.lineTo || !ctx.stroke) return;
      ctx.save();
      ctx.globalAlpha = row.alpha * fade;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (s = 1; s < pts.length; s++) ctx.lineTo(pts[s].x, pts[s].y);
      ctx.strokeStyle = "#ffe7a8";
      ctx.lineWidth = row.reduced ? 2 : 5;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (s = 1; s < pts.length; s++) ctx.lineTo(pts[s].x, pts[s].y);
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = row.reduced ? 1 : 2;
      ctx.stroke();
      ctx.restore();
    },

    clear: function () {
      SF.SlashTrail.live.length = 0;
      SF.SlashTrail.timers.length = 0;
    }
  };
})();
