"use strict";

// ActorLayer: the hero rig, townspeople, foes, foot shadows, and the maw turning to ash.

SF.drawShadow = function (ctx, x, y, rx, drop) {
  ctx.save();
  ctx.fillStyle = "rgba(30, 16, 40, 0.28)";
  ctx.beginPath();
  ctx.ellipse(x, y + (drop == null ? 8 : drop), rx, rx * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

SF.artFacing = function (fx, fy) {
  fx = fx || 0;
  fy = fy || 0;
  if (Math.abs(fx) >= Math.abs(fy)) return fx < 0 ? "left" : "right";
  return fy < 0 ? "up" : "down";
};

SF.artFrame = function (moving, phase) {
  if (!moving) return 0;
  var speed = (SF.calm && SF.calm()) ? 5 : 8;
  return Math.floor((SF.anim + (phase || 0)) * speed) % 4;
};

// The rig shares the registry. Built once, then the manifest can arrive later.
SF.fieldHeroRig = function () {
  if (SF._heroRig) return SF._heroRig;
  if (!SF.LayeredSprite || !SF.assets || !SF.spriteRenderer) return null;
  if (typeof SF.spriteRenderer.draw !== "function") return null;
  SF._heroRig = new SF.LayeredSprite(SF.assets, SF.LayeredSprite.HERO, SF.spriteRenderer);
  if (!SF.heroAnimator && SF.Animator) SF.heroAnimator = new SF.Animator();
  return SF._heroRig;
};

// Stick length, 0..1. A dash reports a full stick so the cycle stays at the
// walk rate instead of speeding up with the dash.
SF.heroMagnitude = function (p) {
  if (p && p.dashT > 0) return 1;
  var move = SF.readMove ? SF.readMove() : { x: 0, y: 0 };
  var mag = Math.hypot(move.x || 0, move.y || 0);
  if (mag > 1) mag = 1;
  return mag;
};

// Both idle and walk have to be complete. A gap in either clip keeps the
// code hero, and the wide foot ring that belongs to him.
SF.kenmiFoot = function () {
  var rig = SF.fieldHeroRig();
  var anim = SF.heroAnimator;
  if (!rig || !anim || typeof rig.ready !== "function" || typeof anim.clipFrames !== "function") return false;
  return rig.ready(anim.clipFrames("idle")) && rig.ready(anim.clipFrames("walk"));
};

// True when the layered atlas hero was drawn. False means the caller draws
// the code sprite with the opts it already built.
SF.drawFieldHero = function (ctx, x, y, opts, moving, calm) {
  var rig = SF.fieldHeroRig();
  if (!rig || !SF.heroAnimator || typeof SF.heroAnimator.pose !== "function") return false;
  var scale = SF.LayeredSprite.FIELD_SCALE;
  var picked;
  try {
    picked = SF.heroAnimator.pose({
      moving: !!moving,
      facing: opts && opts.facing,
      time: SF.anim || 0,
      hold: !!calm && !moving,
      dt: SF._heroTick ? (SF.stepDt > 0 ? SF.stepDt : 0) : 0,
      magnitude: SF._heroTick ? SF._heroMag : 0,
      advance: !!SF._heroTick
    });
    var need = null;
    if (typeof SF.heroAnimator.clipFrames === "function") {
      need = SF.heroAnimator.clipFrames("idle").concat(SF.heroAnimator.clipFrames("walk"));
    }
    var spot = SF.handCrystal && SF.handCrystal.place(picked);
    var ahead = !need || (typeof rig.ready === "function" && rig.ready(need));
    if (ahead && spot && spot.behind) {
      try { SF.handCrystal.draw(ctx, x, y, picked); } catch (errGlow) { /* glow is optional */ }
    }
    if (rig.draw(ctx, x, y, {
      name: picked.name,
      names: need,
      frame: picked.frame,
      facing: opts && opts.facing,
      flip: picked.flip,
      clip: picked.clip,
      scale: scale
    }) !== true) return false;
    if (spot && !spot.behind) {
      try { SF.handCrystal.draw(ctx, x, y, picked); } catch (err2) { /* the doll is already drawn */ }
    }
    return true;
  } catch (err) {
    return false;
  }
};

SF.drawActor = function (ctx, id, x, y, fx, fy, moving, alpha, phase) {
  if (!SF.DrawDeps.art() || !SF.DrawDeps.art().sprite) return false;
  var calm = SF.calm && SF.calm();
  var cast = SF.DrawDeps.art().fieldCast && SF.DrawDeps.art().fieldCast[id];
  var pose = "walk";
  var frame = SF.artFrame(moving, phase);
  if (cast && !moving) {
    pose = "stand";
    frame = calm ? 0 : Math.floor((SF.anim + (phase || 0)) * 2) % 2;
  }
  var opts = {
    facing: SF.artFacing(fx, fy),
    frame: frame,
    pose: pose,
    scale: SF.DrawDeps.art().fieldScale(id)
  };
  ctx.save();
  ctx.globalAlpha = alpha == null ? 1 : alpha;
  // Only the field hero uses the atlas. Anyone else, and a hero with no
  // atlas, draws the code sprite with the opts above, unchanged.
  var drew = false;
  if (id === "wayfarer" && SF.spriteRenderer && typeof SF.spriteRenderer.draw === "function") {
    try { drew = SF.drawFieldHero(ctx, x, y, opts, moving, calm); }
    catch (err) { drew = false; }
  }
  if (!drew) SF.DrawDeps.art().sprite(ctx, id, x, y, opts);
  ctx.restore();
  return true;
};

SF.drawWayfarer = function (ctx, x, y, fx, fy, alpha, shardstep) {
  var moving = false;
  var p = SF.state && SF.state.player;
  var live = p && Math.abs(p.x - x) < 0.01 && Math.abs(p.y - y) < 0.01;
  if (live) {
    moving = Math.hypot(p.x - p.px, p.y - p.py) > 0.2 || p.dashT > 0;
    SF._heroTick = true;
    SF._heroMag = SF.heroMagnitude(p);
  }
  var drew = false;
  try {
    drew = SF.drawActor(ctx, "wayfarer", x, y, fx, fy, moving, alpha, shardstep ? 1 : 0);
  } finally {
    SF._heroTick = false;
  }
  if (drew) return;
  var ang = Math.atan2(fy, fx);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#24357a";
  ctx.beginPath();
  ctx.ellipse(0, 2, 7, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

SF.drawNpc = function (ctx, id, x, y, fx, fy) {
  var moving = false;
  if (SF.drawActor(ctx, id, x, y, fx, fy, moving, 1, 0)) return;
};

SF.drawMaren = function (ctx, x, y) {
  var s = SF.state;
  var fx = s && s.player ? s.player.x - x : 0;
  var fy = s && s.player ? s.player.y - y : 1;
  if (SF.drawActor(ctx, "maren", x, y, fx, fy, false, 1, 0.2)) return;
  var bob = Math.sin(SF.anim * 2) * 1.2;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.fillStyle = "#7a3148";
  ctx.beginPath();
  ctx.ellipse(0, 4, 10, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f0c2a4";
  ctx.beginPath();
  ctx.arc(0, -8, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e4e8f0";
  ctx.beginPath();
  ctx.arc(0, -11, 6, Math.PI, 0);
  ctx.fill();
  ctx.strokeStyle = "#e8d2a4";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(10, 8);
  ctx.lineTo(10, -14);
  ctx.stroke();
  ctx.drawImage(SF.blobs.gold, 2, -26, 16, 16);
  ctx.fillStyle = "#ffc56a";
  ctx.beginPath();
  ctx.arc(10, -16, 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

SF.drawKestrel = function (ctx, x, y) {
  var s = SF.state;
  var fx = s && s.player ? s.player.x - x : 0;
  var fy = s && s.player ? s.player.y - y : 1;
  if (SF.drawActor(ctx, "kestrel", x, y, fx, fy, false, 1, 0.4)) return;
  var bob = Math.sin(SF.anim * 2.4 + 1) * 1.2;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.fillStyle = "#f0c24b";
  ctx.beginPath();
  ctx.moveTo(-4, 0);
  ctx.lineTo(-14, 6);
  ctx.lineTo(-2, 6);
  ctx.fill();
  ctx.fillStyle = "#176872";
  ctx.beginPath();
  ctx.ellipse(0, 4, 9, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e8b892";
  ctx.beginPath();
  ctx.arc(1, -8, 5.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#d7f6ff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(1, -8, 5.6, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();
  ctx.fillStyle = "#f2e2cf";
  ctx.fillRect(-1, -9, 5, 2);
  ctx.restore();
};

SF.drawCantor = function (ctx, x, y) {
  var s = SF.state;
  var calm = SF.calm && SF.calm();
  var fx = s && s.player ? s.player.x - x : 0;
  var fy = s && s.player ? s.player.y - y : 1;
  var bob = calm ? 0 : Math.sin(SF.anim * 1.2) * 1;
  if (SF.drawActor(ctx, "cantor", x, y + bob, fx, fy, false, 1, 0.6)) return;
  var bob = calm ? 0 : Math.sin(SF.anim * 1.4) * 3;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.drawImage(SF.blobs.gold, -16, -8, 32, 32);
  ctx.fillStyle = "#22182f";
  ctx.beginPath();
  ctx.ellipse(0, 8, 11, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e6c56a";
  ctx.fillRect(-11, 20, 22, 2);
  ctx.fillStyle = "#f4efe4";
  ctx.beginPath();
  ctx.ellipse(0, -10, 6, 7.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#2a2038";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(0, -8, 3.5, 0.2, Math.PI - 0.2);
  ctx.stroke();
  ctx.restore();
  if (calm) return;
  var i;
  for (i = 0; i < 3; i++) {
    var a = SF.anim * 0.8 + i * 2.1;
    ctx.fillStyle = "rgba(230,197,106,0.8)";
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * 16, y + bob + Math.sin(a) * 10, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
};

SF.drawTamsin = function (ctx, x, y) {
  var s = SF.state;
  var fx = s && s.player ? s.player.x - x : 0;
  var fy = s && s.player ? s.player.y - y : 1;
  if (SF.drawActor(ctx, "tamsin", x, y, fx, fy, false, 1, 0.8)) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#c4552a";
  ctx.beginPath();
  ctx.ellipse(0, 4, 9, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f0c2a4";
  ctx.beginPath();
  ctx.arc(0, -8, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#ffb15a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(11, 2, 6, 0.4, 4.2);
  ctx.stroke();
  ctx.restore();
};

SF.drawHesk = function (ctx, x, y) {
  var s = SF.state;
  var fx = s && s.player ? s.player.x - x : 0;
  var fy = s && s.player ? s.player.y - y : 1;
  if (SF.drawActor(ctx, "hesk", x, y, fx, fy, false, 1, 1)) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#6a5a78";
  ctx.beginPath();
  ctx.ellipse(0, 4, 8, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e6d2c0";
  ctx.beginPath();
  ctx.arc(0, -9, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#d8c4a0";
  ctx.fillRect(-7, -16, 14, 5);
  ctx.restore();
};

SF.drawIlsa = function (ctx, x, y) {
  var s = SF.state;
  var fx = s && s.player ? s.player.x - x : 0;
  var fy = s && s.player ? s.player.y - y : 1;
  if (SF.drawActor(ctx, "ilsa", x, y, fx, fy, false, 1, 1.2)) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#4a403c";
  ctx.beginPath();
  ctx.ellipse(0, 4, 11, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e7c2a4";
  ctx.beginPath();
  ctx.arc(0, -10, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#ffb15a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-12, 0);
  ctx.lineTo(12, -18);
  ctx.stroke();
  ctx.restore();
};

SF.KIND_SPRITE = {
  wisp: "wisp",
  brumekin: "brumekin",
  choirling: "choirling",
  ashmite: "ashling",
  sootwing: "sootwing",
  cinderbrute: "cinderhound",
  maw: "cinder_maw"
};

SF.drawEnemySprite = function (ctx, e) {
  var id = SF.KIND_SPRITE[e.kind];
  if (!id || !SF.DrawDeps.art() || !SF.DrawDeps.art().sprite) return false;
  var s = SF.state;
  var fx = s && s.player ? s.player.x - e.x : (e.aimX || 0);
  var fy = s && s.player ? s.player.y - e.y : (e.aimY || 1);
  var moving = e.ai === "charge" || e.ai === "wind";
  var pose = (e.kind === "maw" && e.dormant) ? "idle" : "walk";
  var bob = 0;
  if (e.kind === "wisp" || e.kind === "choirling") {
    bob = (SF.calm && SF.calm()) ? 0 : Math.sin(SF.anim * 3 + (e.phase || 0)) * 1;
  }
  SF.DrawDeps.art().sprite(ctx, id, e.x, e.y + bob, {
    facing: SF.artFacing(fx, fy),
    frame: SF.artFrame(moving || e.kind === "wisp" || e.kind === "sootwing", e.phase || 0),
    pose: pose,
    scale: SF.DrawDeps.art().fieldScale(id)
  });
  return true;
};

SF.drawWisp = function (ctx, e) {
  if (SF.drawEnemySprite(ctx, e)) {
    if (e.hurt > 0) flash(ctx, e.x, e.y, e.r, e.hurt);
    return;
  }
  var wob = Math.sin(SF.anim * 6 + e.phase) * 2;
  ctx.save();
  ctx.globalAlpha = 0.85;
  ctx.drawImage(SF.blobs.violet, e.x - 22, e.y - 22 + wob, 44, 44);
  ctx.fillStyle = "rgba(186,160,255,0.65)";
  ctx.beginPath();
  ctx.arc(e.x, e.y + wob, e.r + wob * 0.2, 0, Math.PI * 2);
  ctx.arc(e.x - 6, e.y + 4 + wob, e.r * 0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f4fdff";
  ctx.beginPath();
  ctx.arc(e.x, e.y + wob, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (e.hurt > 0) flash(ctx, e.x, e.y + wob, e.r, e.hurt);
};

SF.drawBrume = function (ctx, e) {
  if (SF.drawEnemySprite(ctx, e)) {
    if (e.ai === "wind") {
      ctx.save();
      ctx.strokeStyle = "rgba(255,120,90,0.85)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r + 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    if (e.hurt > 0) flash(ctx, e.x, e.y, e.r, e.hurt);
    return;
  }
  ctx.save();
  ctx.translate(e.x, e.y);
  if (e.ai === "wind") ctx.scale(1.15, 0.82);
  ctx.drawImage(SF.blobs.gold, -26, -24, 52, 48);
  ctx.fillStyle = "#5c456e";
  ctx.beginPath();
  ctx.ellipse(0, 2, e.r + 2, e.r - 1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#3d2c4e";
  ctx.beginPath();
  ctx.moveTo(-10, -6);
  ctx.lineTo(-6, -16);
  ctx.lineTo(-2, -6);
  ctx.moveTo(4, -6);
  ctx.lineTo(8, -16);
  ctx.lineTo(12, -6);
  ctx.fill();
  ctx.fillStyle = "#ffb15a";
  ctx.beginPath();
  ctx.arc(0, 2, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (e.ai === "wind") {
    ctx.save();
    ctx.strokeStyle = "rgba(255,120,90,0.85)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r + 8 + (0.5 - e.wind) * 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  if (e.hurt > 0) flash(ctx, e.x, e.y, e.r, e.hurt);
};

SF.drawChoir = function (ctx, e) {
  if (SF.drawEnemySprite(ctx, e)) {
    if (e.ai === "wind") {
      ctx.save();
      ctx.strokeStyle = "rgba(220,190,255,0.8)";
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(e.x, e.y);
      ctx.lineTo(e.x + (e.aimX || 0) * 36, e.y + (e.aimY || 0) * 36);
      ctx.stroke();
      ctx.restore();
    }
    if (e.hurt > 0) flash(ctx, e.x, e.y, e.r, e.hurt);
    return;
  }
  var bob = Math.sin(SF.anim * 2 + e.phase) * 2;
  ctx.save();
  ctx.translate(e.x, e.y + bob);
  ctx.drawImage(SF.blobs.violet, -20, -28, 40, 48);
  ctx.fillStyle = "#3a2458";
  ctx.beginPath();
  ctx.ellipse(0, 4, 9, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f1e9dc";
  ctx.beginPath();
  ctx.ellipse(0, -10, 6, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#6a4a88";
  ctx.beginPath();
  ctx.moveTo(-4, -12);
  ctx.lineTo(4, -6);
  ctx.moveTo(4, -12);
  ctx.lineTo(-3, -7);
  ctx.stroke();
  ctx.fillStyle = "#e7c6ff";
  ctx.beginPath();
  ctx.arc(0, 2, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (e.ai === "wind") {
    ctx.save();
    ctx.strokeStyle = "rgba(220,190,255,0.8)";
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(e.x, e.y);
    ctx.lineTo(e.x + e.aimX * 36, e.y + e.aimY * 36);
    ctx.stroke();
    ctx.restore();
  }
  if (e.hurt > 0) flash(ctx, e.x, e.y + bob, 14, e.hurt);
};

function flash(ctx, x, y, r, hurt) {
  if (SF.calm && SF.calm()) return;
  var a = SF.clamp((hurt || 0) / 0.14, 0, 1) * 0.32;
  if (a < 0.04) return;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = "#ffe7a8";
  ctx.beginPath();
  ctx.arc(x, y, Math.max(4, r * 0.45), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

SF.drawHpPips = function (ctx, e) {
  if (e.hp >= e.maxHp && e.hurt <= 0) return;
  var w = 22;
  var x = e.x - w / 2;
  var y = e.y - Math.max(e.r + 12, 36);
  ctx.fillStyle = "rgba(20,10,30,0.65)";
  ctx.fillRect(x, y, w, 4);
  ctx.fillStyle = "#ff8ea3";
  ctx.fillRect(x, y, w * SF.clamp(e.hp / e.maxHp, 0, 1), 4);
};

SF.drawMawAsh = function (ctx, e, facing) {
  var ash = e.ash;
  var u = !ash || ash.dur <= 0 ? 1 : Math.max(0, Math.min(1, ash.t / ash.dur));
  if (!SF.DrawDeps.art() || !SF.DrawDeps.art().frameOf) return false;
  var canvas = SF.DrawDeps.art().frameOf("cinder_maw", "walk", facing || "down", 0);
  if (!canvas || !canvas.width) return false;
  var scale = 1;
  var ax = canvas._ax || 0;
  var ay = canvas._ay || canvas.height - 1;
  var left = e.x - ax * scale;
  var top = e.y - ay * scale;
  var strips = 6;
  var i, sy, sliceH, sh;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  for (i = 0; i < strips; i++) {
    sh = Math.ceil(canvas.height / strips);
    sy = i * sh;
    if (sy >= canvas.height) break;
    sliceH = Math.min(sh, canvas.height - sy);
    ctx.globalAlpha = Math.max(0, 1 - u * 0.95);
    ctx.drawImage(
      canvas,
      0, sy, canvas.width, sliceH,
      left + (i - 2.5) * u * 18,
      top + sy * scale - u * (8 + i * 6),
      canvas.width * scale,
      sliceH * scale
    );
  }
  ctx.restore();
  return true;
};

SF.ActorLayer = {
  shadow: function (ctx, x, y, rx, drop) { SF.drawShadow(ctx, x, y, rx, drop); },
  hero: function (ctx, x, y, opts, moving, calm) { return SF.drawFieldHero(ctx, x, y, opts, moving, calm); },
  draw: function (ctx, id, x, y, fx, fy, moving, alpha, phase) { return SF.drawActor(ctx, id, x, y, fx, fy, moving, alpha, phase); },
  foe: function (ctx, e) { return SF.drawEnemySprite(ctx, e); },
  mawAsh: function (ctx, e, facing) { return SF.drawMawAsh(ctx, e, facing); }
};
