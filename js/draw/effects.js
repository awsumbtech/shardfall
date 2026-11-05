"use strict";

// EffectLayer: field projectiles, the vignette, and the scene wash.

SF.drawFx = function (ctx, s) {
  s.projectiles.forEach(function (shot) {
    ctx.drawImage(SF.blobs.violet, shot.x - 10, shot.y - 10, 20, 20);
    ctx.fillStyle = "#f6e9ff";
    ctx.beginPath();
    ctx.arc(shot.x, shot.y, 3, 0, Math.PI * 2);
    ctx.fill();
  });
  s.particles.forEach(function (part) {
    var fade = Math.max(0, part.life / part.max);
    ctx.fillStyle = part.color;
    if (part.px) {
      ctx.globalAlpha = fade > 0.66 ? 1 : (fade > 0.33 ? 0.65 : 0.35);
      var sz = Math.max(1, Math.min(3, part.size | 0));
      ctx.fillRect(Math.round(part.x), Math.round(part.y), sz, sz);
    } else {
      ctx.globalAlpha = fade;
      ctx.beginPath();
      ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  ctx.globalAlpha = 1;
  if (s.ring) {
    var u = 1 - s.ring.life / 0.9;
    ctx.save();
    ctx.globalAlpha = Math.max(0, s.ring.life);
    ctx.strokeStyle = "#ffe7a8";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(s.ring.x, s.ring.y, 12 + u * s.ring.max, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  ctx.save();
  ctx.font = "700 13px \"Avenir Next\", \"Segoe UI\", system-ui, sans-serif";
  ctx.textAlign = "center";
  s.floaters.forEach(function (f) {
    ctx.globalAlpha = Math.max(0, f.life / 0.75);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
  });
  ctx.restore();
  ctx.globalAlpha = 1;
  SF.drawGuide(ctx, s);

  var near = null;
  var nx = 0;
  var ny = 0;
  if (s.mode === "play") near = SF.nearestInteract();
  if (near && s.player) {
    nx = near.kind === "lamp" ? SF.LAMP.x : near.ref.x;
    ny = near.kind === "lamp" ? SF.LAMP.y : near.ref.y;
    if (Math.hypot(nx - s.player.x, ny - s.player.y) < 22) near = null;
  }
  if (near) {
    nx = near.kind === "lamp" ? SF.LAMP.x : near.ref.x;
    ny = near.kind === "lamp" ? SF.LAMP.y : near.ref.y;
    var calm = SF.calm && SF.calm();
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = "#fff4d2";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(nx, ny, calm ? 20 : (19 + Math.sin(SF.anim * 1.6) * 1), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  if (SF.drawGrappleFx) SF.drawGrappleFx(ctx, s);
};

SF.drawVignette = function (ctx, w, h, s) {
  var lit = SF.lampIsLit ? SF.lampIsLit(s) : !!(s.flags && s.flags.lampLit);
  var cinder = SF.islandId === "cinderveil";
  var key = (SF.islandId || "emberhold") + (lit ? "1" : "0") + ":" + w + "x" + h;
  if (SF._vigKey !== key) {
    var sheet = document.createElement("canvas");
    sheet.width = Math.max(1, Math.round(w * 0.5));
    sheet.height = Math.max(1, Math.round(h * 0.5));
    var gctx = sheet.getContext("2d");
    var g = gctx.createRadialGradient(sheet.width / 2, sheet.height / 2, Math.min(sheet.width, sheet.height) * 0.35, sheet.width / 2, sheet.height / 2, Math.max(sheet.width, sheet.height) * 0.72);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, cinder ? (lit ? "rgba(48,18,8,0.30)" : "rgba(28,10,8,0.5)") : (lit ? "rgba(20,8,40,0.28)" : "rgba(12,6,28,0.48)"));
    gctx.fillStyle = g;
    gctx.fillRect(0, 0, sheet.width, sheet.height);
    SF._vig = sheet;
    SF._vigKey = key;
  }
  ctx.drawImage(SF._vig, 0, 0, w, h);
};

SF.drawSceneWash = function (ctx, w, h) {
  var veil = SF._veil && SF._veil.a;
  if (veil > 0.004) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, veil));
    ctx.fillStyle = "#07060f";
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
};

SF.EffectLayer = {
  fx: function (ctx, s) { SF.drawFx(ctx, s); },
  vignette: function (ctx, w, h, s) { SF.drawVignette(ctx, w, h, s); },
  wash: function (ctx, w, h) { SF.drawSceneWash(ctx, w, h); }
};
