"use strict";

// GuideLayer: quest marks, the lamp guide, and the arrow when the goal is off screen.

SF.goalPrecise = function (goal) {
  return !goal || goal.kind !== "shard" || goal.precise !== false;
};

SF.GUIDE_NEAR = 18;
SF.GUIDE_HEAD = 60;
SF.LAMP_NEAR = 24;
// Talk range, plus a short margin so the name and diamond clear his sprite
// and the foot ring. A few pixels of hysteresis keep the edge from flickering.
SF.MARK_NEAR = (SF.TALK_RANGE || 54) + 18;
SF.MARK_HYST = 4;

SF.guideActor = function (goal) {
  var i, n, feet;
  if (!goal) return null;
  for (i = 0; i < (SF.NPCS || []).length; i++) {
    n = SF.NPCS[i];
    if (SF.npcHidden && SF.npcHidden(n)) continue;
    feet = SF.actorFeet ? SF.actorFeet(n) : n;
    if (feet && Math.hypot(feet.x - goal.x, feet.y - goal.y) < 8) {
      return { x: feet.x, y: feet.y, id: n.id };
    }
  }
  return null;
};

// One threshold for every NPC name and for the objective diamond.
// Hidden inside MARK_NEAR. Once hidden, it stays hidden until MARK_NEAR + MARK_HYST.
SF.markHidden = function (id, dist) {
  var key = id || "";
  if (!SF._markHold) SF._markHold = {};
  var near = SF.MARK_NEAR || 72;
  var hyst = SF.MARK_HYST || 4;
  var hidden = !!SF._markHold[key];
  hidden = hidden ? dist < near + hyst : dist <= near;
  SF._markHold[key] = hidden;
  return hidden;
};

// Ease toward the hold so the tag does not pop. A second call in the same
// instant does not step again.
SF.markAlpha = function (id, dist) {
  var target = SF.markHidden(id, dist) ? 0 : 1;
  if (!SF._markFade) SF._markFade = {};
  var key = id || "";
  var now = performance.now();
  var rec = SF._markFade[key];
  if (!rec) {
    SF._markFade[key] = { a: target, t: now };
    return target;
  }
  var dt = Math.max(0, Math.min(0.05, (now - rec.t) / 1000));
  rec.t = now;
  if (dt > 0 && rec.a !== target) {
    var step = dt / 0.08;
    if (step > 1) step = 1;
    rec.a += (target - rec.a) * step;
    if (Math.abs(rec.a - target) < 0.02) rec.a = target;
  }
  return rec.a;
};

SF.actorMarkHidden = function (goal, hero) {
  var actor = SF.guideActor(goal);
  if (!actor || !hero) return false;
  return SF.markHidden(actor.id, Math.hypot(hero.x - actor.x, hero.y - actor.y));
};

// Centered on the NPC. Null while the hero is close enough to talk.
SF.guideMark = function (goal, hero) {
  var actor = SF.guideActor(goal);
  if (!actor || SF.actorMarkHidden(goal, hero)) return null;
  var lift = SF.GUIDE_HEAD || 42;
  return { x: actor.x, y: actor.y - lift, lift: lift };
};

SF.guideLift = function (goal, hero) {
  var mark = SF.guideMark(goal, hero);
  if (mark) return mark.lift;
  if (SF.guideActor(goal)) return 0;
  return 28;
};

SF.lampClose = function (s) {
  if (!s || !s.player || !SF.LAMP || SF.islandId !== "cinderveil") return false;
  return Math.hypot(s.player.x - SF.LAMP.x, s.player.y - SF.LAMP.y) <= (SF.LAMP_NEAR || 24);
};

SF.goalOnScreen = function (goal, s, w, h) {
  if (!goal || !s || !w || !h) return false;
  var zoom = SF.zoom || 1;
  function hit(x, y) {
    var sx = (x - s.camX) * zoom + w / 2;
    var sy = (y - s.camY) * zoom + h / 2;
    return sx >= 0 && sx <= w && sy >= 0 && sy <= h;
  }
  return hit(goal.x, goal.y) || hit(goal.x, goal.y - 32);
};

SF.drawGuide = function (ctx, s) {
  if (!s || s.mode !== "play" || !SF.objectivePoint) return;
  var goal = SF.objectivePoint(s);
  if (!goal || !SF.goalPrecise(goal)) return;
  var p = s.player;
  var dx = goal.x - p.x;
  var dy = goal.y - p.y;
  var d = Math.hypot(dx, dy);
  if (d <= (SF.GUIDE_NEAR || 18)) return;
  if (SF.lampClose && SF.lampClose(s) && SF.LAMP && Math.hypot(goal.x - SF.LAMP.x, goal.y - SF.LAMP.y) <= 8) return;
  var actor = SF.guideActor(goal);
  if (d > 96) {
    var ang = Math.atan2(dy, dx);
    var cx = p.x + Math.cos(ang) * 34;
    var cy = p.y + Math.sin(ang) * 34 - 22;
    var onTarget = Math.hypot(cx - goal.x, cy - (goal.y - 20)) < 40;
    var crowded = SF.actorNear && SF.actorNear(cx, cy + 22, 28);
    if (!onTarget && !crowded) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(ang);
      ctx.fillStyle = "rgba(255, 211, 122, 0.95)";
      ctx.strokeStyle = "rgba(20, 10, 30, 0.55)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(9, 0);
      ctx.lineTo(-7, 5);
      ctx.lineTo(-3, 0);
      ctx.lineTo(-7, -5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }
  if (actor) {
    var fade = SF.markAlpha(actor.id, Math.hypot(p.x - actor.x, p.y - actor.y));
    if (fade > 0.02) {
      ctx.save();
      ctx.globalAlpha = fade;
      SF.drawBobber(ctx, actor.x, actor.y, SF.GUIDE_HEAD || 60);
      ctx.restore();
    }
  } else if (d > 40) SF.drawBobber(ctx, goal.x, goal.y, 28);
};

SF.hideEdgeArrow = function (goal, s, w, h) {
  if (!goal) return true;
  if (goal.kind === "shard" && goal.precise === false) return false;
  var pd = s && s.player ? Math.hypot(goal.x - s.player.x, goal.y - s.player.y) : Infinity;
  if (pd <= (SF.GUIDE_NEAR || 18)) return true;
  if (SF.lampClose && SF.lampClose(s) && SF.LAMP && Math.hypot(goal.x - SF.LAMP.x, goal.y - SF.LAMP.y) <= 8) return true;
  return !!(SF.goalOnScreen && SF.goalOnScreen(goal, s, w, h));
};

SF.drawEdgeArrow = function (ctx, w, h, s) {
  if (!s || s.mode !== "play" || !SF.objectivePoint) return;
  var goal = SF.objectivePoint(s);
  if (!goal || SF.hideEdgeArrow(goal, s, w, h)) return;
  var sensed = goal.kind === "shard" && goal.precise === false;
  var zoom = SF.zoom || 1;
  var sx = (goal.x - s.camX) * zoom + w / 2;
  var sy = (goal.y - s.camY) * zoom + h / 2;
  var left = 28;
  var right = w - 28;
  var top = 88;
  var bottom = h - 150;
  var cx = w / 2;
  var cy = h / 2;
  var dx = sx - cx;
  var dy = sy - cy;
  if (!dx && !dy) return;
  var t = Infinity;
  if (dx > 0) t = Math.min(t, (right - cx) / dx);
  else if (dx < 0) t = Math.min(t, (left - cx) / dx);
  if (dy > 0) t = Math.min(t, (bottom - cy) / dy);
  else if (dy < 0) t = Math.min(t, (top - cy) / dy);
  if (!isFinite(t) || t < 0) t = 1;
  ctx.save();
  ctx.translate(cx + dx * t, cy + dy * t);
  ctx.rotate(Math.atan2(dy, dx));
  if (sensed) ctx.globalAlpha = 0.55 + Math.sin((SF.anim || 0) * 5) * 0.4;
  ctx.fillStyle = sensed ? "#9af6ff" : "#ffd37a";
  ctx.strokeStyle = "rgba(20, 10, 30, 0.7)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(12, 0);
  ctx.lineTo(-8, 8);
  ctx.lineTo(-3, 0);
  ctx.lineTo(-8, -8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
};

SF.GuideLayer = {
  mark: function (ctx, s) { SF.drawGuide(ctx, s); },
  edge: function (ctx, w, h, s) { SF.drawEdgeArrow(ctx, w, h, s); }
};
