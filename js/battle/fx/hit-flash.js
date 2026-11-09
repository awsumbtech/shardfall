"use strict";

// HitFlash turns the target pure white for a couple of frames.
// It is a second layer on top of the soft tint in BattleStage.
// It does not read FLASH_TINT, and it does not change that tint.
// A heal does not flash. Reduced motion keeps the flash at a lower alpha.

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

  function findSpot(list, id) {
    var i;
    if (!list) return null;
    for (i = 0; i < list.length; i++) {
      if (list[i].actor && list[i].actor.id === id) return list[i];
    }
    return null;
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

    paint: function (ctx, b, foes, party) {
      SF.HitFlash.sweep();
      if (!ctx || !SF.HitFlash.live.length || !b) return;
      var i;
      for (i = 0; i < SF.HitFlash.live.length; i++) {
        SF.HitFlash.paintOne(ctx, b, SF.HitFlash.live[i], foes, party);
      }
    },

    paintOne: function (ctx, b, row, foes, party) {
      var spot = findSpot(foes, row.id) || findSpot(party, row.id);
      if (!spot || !spot.actor || !spot.hit) return;
      var actor = spot.actor;
      var nudge = SF.BattleGfx && SF.BattleGfx.actorNudge ? SF.BattleGfx.actorNudge(b, actor) : { x: 0, y: 0 };
      if (SF.HitFlash.paintSprite(ctx, b, spot, actor, nudge, row.alpha)) return;
      if (!ctx.fillRect) return;
      ctx.save();
      ctx.globalAlpha = row.alpha;
      ctx.fillStyle = "#fff";
      ctx.fillRect(
        Math.round(spot.hit.x + nudge.x),
        Math.round(spot.hit.y + nudge.y),
        Math.max(1, Math.round(spot.hit.w)),
        Math.max(1, Math.round(spot.hit.h))
      );
      ctx.restore();
    },

    // Redraws the target into a scratch and keeps only its opaque pixels,
    // filled white. The soft tint underneath is a different draw.
    paintSprite: function (ctx, b, spot, actor, nudge, alpha) {
      if (!ctx || !ctx.drawImage || typeof document === "undefined" || !document.createElement) return false;
      var hit = spot.hit;
      if (!(hit.w > 0) || !(hit.h > 0)) return false;
      var pad = 2;
      var w = Math.ceil(hit.w) + pad * 2;
      var h = Math.ceil(hit.h) + pad * 2;
      if (w > 800 || h > 800) return false;
      var scratch = SF.HitFlash._scratch;
      if (!scratch) {
        scratch = document.createElement("canvas");
        SF.HitFlash._scratch = scratch;
      }
      if (!scratch || !scratch.getContext) return false;
      if (scratch.width !== w) scratch.width = w;
      if (scratch.height !== h) scratch.height = h;
      var sctx = scratch.getContext("2d");
      if (!sctx || !sctx.setTransform || !sctx.clearRect || !sctx.fillRect) return false;
      sctx.setTransform(1, 0, 0, 1, 0, 0);
      sctx.globalCompositeOperation = "source-over";
      sctx.globalAlpha = 1;
      sctx.clearRect(0, 0, w, h);
      sctx.imageSmoothingEnabled = false;
      var pose = SF.BattleGfx.battlePose(b, actor);
      var facing = actor.side === "party" ? "left" : "right";
      SF.BattleGfx.drawSprite(
        sctx,
        actor.sprite,
        spot.x - hit.x + pad,
        spot.feet - hit.y + pad,
        spot.scale,
        pose,
        facing
      );
      sctx.globalCompositeOperation = "source-in";
      sctx.fillStyle = "#fff";
      sctx.fillRect(0, 0, w, h);
      sctx.globalCompositeOperation = "source-over";
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.drawImage(scratch, Math.round(hit.x + nudge.x - pad), Math.round(hit.y + nudge.y - pad));
      ctx.restore();
      return true;
    },

    clear: function () {
      SF.HitFlash.live.length = 0;
      SF.HitFlash.timers.length = 0;
    }
  };
})();
