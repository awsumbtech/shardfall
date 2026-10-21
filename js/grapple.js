"use strict";

var SF = window.SF || {};
window.SF = SF;

SF.GRAPPLE_RANGE = 220;
SF.GRAPPLE_RANGE_PLUS = 270;
SF.GRAPPLE_SPEED = 700;
SF.GRAPPLE_CD = 1.05;
SF.GRAPPLE_CD_PLUS = 0.68;

SF.grappleRange = function (p) {
  var s = SF.state;
  if (s && s.upgrades && s.upgrades.quickhook) return SF.GRAPPLE_RANGE_PLUS;
  return SF.GRAPPLE_RANGE;
};

SF.aimVector = function (p, move) {
  if (move && Math.hypot(move.x, move.y) > 0.2) {
    var m = Math.hypot(move.x, move.y);
    return { x: move.x / m, y: move.y / m };
  }
  return { x: p.fx || 1, y: p.fy || 0 };
};

SF.grappleCandidates = function (p) {
  var s = SF.state;
  var list = [];
  (SF.HOOKS || []).forEach(function (hook) {
    if (!SF.hookLive(hook)) return;
    list.push({ kind: "hook", x: hook.x, y: hook.y, ref: hook, pull: "self" });
  });
  s.enemies.forEach(function (e) {
    if (!e.alive || e.dying > 0 || e.dormant) return;
    var kind = SF.KINDS[e.kind];
    if (!kind) return;
    list.push({
      kind: "foe",
      x: e.x,
      y: e.y,
      ref: e,
      pull: kind.big ? "self" : "yank"
    });
  });
  return list;
};

SF.bestGrapple = function (p, aim) {
  var range = SF.grappleRange(p);
  var best = null;
  var bestScore = -Infinity;
  SF.grappleCandidates(p).forEach(function (target) {
    var dx = target.x - p.x;
    var dy = target.y - p.y;
    var d = Math.hypot(dx, dy);
    if (d < 28 || d > range) return;
    var dot = (dx / d) * aim.x + (dy / d) * aim.y;
    if (dot < 0.34) return;
    var score = dot * 800 - d;
    if (score > bestScore) {
      bestScore = score;
      best = target;
      best.d = d;
    }
  });
  return best;
};

SF.fireGrapple = function (p, move) {
  var s = SF.state;
  if (!p.grapple) {
    SF.pushToast("The hand does not hook yet.", 1.4);
    return false;
  }
  if (p.grappleCd > 0.08 || p.grappleT > 0) {
    if (p.grappleCd > 0.08) SF.pushToast("The hook is still coming back.", 1.1);
    return false;
  }
  var aim = SF.aimVector(p, move);
  p.fx = aim.x;
  p.fy = aim.y;
  var target = SF.bestGrapple(p, aim);
  if (!target) {
    SF.pushToast("Nothing to hook that way.", 1.2);
    return false;
  }
  s.hints.hook = true;
  p.grappleT = Math.max(0.12, target.d / SF.GRAPPLE_SPEED);
  p.grappleMax = p.grappleT;
  p.gtx = target.x;
  p.gty = target.y;
  p.grapplePull = target.pull;
  p.grappleFoe = target.kind === "foe" ? target.ref : null;
  p.grappleCd = (s.upgrades && s.upgrades.quickhook) ? SF.GRAPPLE_CD_PLUS : SF.GRAPPLE_CD;
  if (target.pull === "yank" && target.ref) target.ref.stun = Math.max(target.ref.stun, 0.4);
  if (window.Sfx) {
    Sfx.play("grapple");
    Sfx.play("pull");
  }
  return true;
};

SF.stepGrapple = function (p, dt) {
  if (p.grappleT <= 0) return false;
  var s = SF.state;
  p.grappleT -= dt;
  if (p.grapplePull === "yank" && p.grappleFoe && p.grappleFoe.alive) {
    var foe = p.grappleFoe;
    var dx = p.x - foe.x;
    var dy = p.y - foe.y;
    var d = Math.hypot(dx, dy) || 1;
    var step = Math.min(d - (foe.r + 18), SF.GRAPPLE_SPEED * dt);
    if (step > 0) {
      var nx = foe.x + (dx / d) * step;
      var ny = foe.y + (dy / d) * step;
      if (SF.walkable(nx, ny)) {
        foe.x = nx;
        foe.y = ny;
      }
    }
    if (p.grappleT <= 0 || d < foe.r + 22) {
      foe.stun = Math.max(foe.stun, 0.7);
      if (foe.alive) SF.damageEnemy(foe, 4, (foe.x - p.x) / (d || 1), (foe.y - p.y) / (d || 1), 0.4);
      if (window.Sfx) Sfx.play("latch");
      p.grappleT = 0;
      p.grappleFoe = null;
    }
    return true;
  }
  var tx = p.gtx;
  var ty = p.gty;
  if (p.grappleFoe && p.grappleFoe.alive) {
    var away = p.grappleFoe.r + 22;
    var fdx = p.x - p.grappleFoe.x;
    var fdy = p.y - p.grappleFoe.y;
    var fd = Math.hypot(fdx, fdy) || 1;
    tx = p.grappleFoe.x + (fdx / fd) * away;
    ty = p.grappleFoe.y + (fdy / fd) * away;
  }
  var px = tx - p.x;
  var py = ty - p.y;
  var pd = Math.hypot(px, py) || 1;
  var move = Math.min(pd, SF.GRAPPLE_SPEED * dt);
  p.x += (px / pd) * move;
  p.y += (py / pd) * move;
  p.fx = px / pd;
  p.fy = py / pd;
  if (!(SF.calm && SF.calm()) && s.ghosts.length < 6) {
    s.ghosts.push({ x: p.x, y: p.y, fx: p.fx, fy: p.fy, a: 0.35 });
  }
  if (pd < 20 || p.grappleT <= 0) {
    if (SF.walkable(tx, ty)) {
      p.x = tx;
      p.y = ty;
    }
    if (p.grappleFoe && p.grappleFoe.alive) {
      SF.damageEnemy(p.grappleFoe, 6, p.fx, p.fy, 0.8);
    }
    if (window.Sfx) Sfx.play("latch");
    p.grappleT = 0;
    p.grappleFoe = null;
    if (!SF.walkable(p.x, p.y)) {
      SF.rescue(p);
      SF.pushToast("The hook did not hold.", 1.4);
    }
  }
  return true;
};

SF.wakeMaw = function () {
  var s = SF.state;
  s.enemies.forEach(function (e) {
    if (e.kind !== "maw") return;
    e.dormant = false;
    e.alive = true;
    if (e.hp <= 0) {
      e.hp = e.maxHp;
    }
    e.tell = 0;
    e.tellKind = "";
    e.phaseN = 1;
  });
  s.pools = [];
};

SF.resetMaw = function () {
  var s = SF.state;
  s.flags.mawFight = true;
  s.pools = [];
  s.enemies.forEach(function (e) {
    if (e.kind !== "maw") return;
    e.alive = true;
    e.dying = 0;
    e.hp = e.maxHp;
    e.dormant = false;
    e.x = e.homeX;
    e.y = e.homeY;
    e.tell = 0.9;
    e.tellKind = "slam";
    e.phaseN = 1;
    e.stun = 0.4;
  });
};

SF.onMawDead = function () {
  var s = SF.state;
  if (s.flags.mawDead) return;
  s.flags.mawDead = true;
  s.flags.mawFight = false;
  s.quest = "relight";
  s.pools = [];
  SF.pushBanner("The Cinder Maw", "The core is cracked and dim, but whole.");
  if (window.Music) Music.play("cinderveil");
  SF.saveGame({ silent: true });
  if (SF.startDialogue) SF.startDialogue("cinderveil.maw.defeated");
};

SF.updatePools = function (dt) {
  var s = SF.state;
  if (!s.pools) return;
  var p = s.player;
  s.pools.forEach(function (pool) {
    pool.life -= dt;
    pool.arm -= dt;
    if (pool.arm > 0 || pool.life <= 0 || s.mode !== "play") return;
    pool.tick -= dt;
    if (pool.tick > 0) return;
    if (SF.dist(p.x, p.y, pool.x, pool.y) < pool.r + p.r * 0.4) {
      pool.tick = 0.45;
      SF.hurtPlayer(4, 0, 0, "The ember under you is still hot.");
    }
  });
  s.pools = s.pools.filter(function (pool) { return pool.life > 0; });
};

SF.updateMaw = function (e, dt) {
  var s = SF.state;
  var p = s.player;
  if (e.dormant || !s.flags.mawFight || s.flags.mawDead) return;
  var kind = SF.KINDS.maw;
  var ratio = e.hp / e.maxHp;
  e.phaseN = ratio > 0.6 ? 1 : (ratio > 0.3 ? 2 : 3);
  e.hurt = Math.max(0, e.hurt - dt);
  e.hitCd = Math.max(0, e.hitCd - dt);
  e.stun = Math.max(0, e.stun - dt);
  if (e.stun > 0) return;
  var dx = p.x - e.x;
  var dy = p.y - e.y;
  var d = Math.hypot(dx, dy) || 1;
  if (e.tell > 0) {
    e.tell -= dt;
    if (e.tellKind === "charge") {
      e.aimX = e.lockX;
      e.aimY = e.lockY;
    }
    if (e.tell <= 0) {
      if (e.tellKind === "slam") {
        var step = 78;
        var nx = e.x + (dx / d) * step;
        var ny = e.y + (dy / d) * step;
        if (SF.walkable(nx, ny)) {
          e.x = nx;
          e.y = ny;
        }
        if (SF.dist(e.x, e.y, p.x, p.y) < e.r + 16) {
          SF.hurtPlayer(kind.dmg, (p.x - e.x) / d, (p.y - e.y) / d);
        }
      } else if (e.tellKind === "charge") {
        e.charging = 0.38;
      }
      e.tellKind = "";
      e.recover = e.phaseN === 3 ? 0.7 : 0.85;
    }
    return;
  }
  if (e.charging > 0) {
    e.charging -= dt;
    var cx = e.x + e.aimX * 460 * dt;
    var cy = e.y + e.aimY * 460 * dt;
    if (SF.walkable(cx, cy)) {
      e.x = cx;
      e.y = cy;
    } else e.charging = 0;
    if (e.hitCd <= 0 && SF.dist(e.x, e.y, p.x, p.y) < e.r + 8) {
      e.hitCd = 0.6;
      SF.hurtPlayer(kind.dmg, e.aimX, e.aimY);
    }
    if (e.charging <= 0) e.recover = 0.75;
    return;
  }
  if (e.recover > 0) {
    e.recover -= dt;
    return;
  }
  var homeD = SF.dist(e.x, e.y, e.homeX, e.homeY);
  if (homeD > kind.leash) {
    SF.steer(e, e.homeX, e.homeY, kind.speed, dt);
    return;
  }
  if (d > e.r + 36) SF.steer(e, p.x, p.y, kind.speed * 0.85, dt);
  e.shotCd = Math.max(0, (e.shotCd || 0) - dt);
  if (e.shotCd > 0) return;
  e.shotCd = e.phaseN === 3 ? 1.7 : 2.05;
  if (e.phaseN === 3 && Math.random() < 0.55) {
    e.tellKind = "charge";
    e.tell = 0.9;
    e.lockX = dx / d;
    e.lockY = dy / d;
    e.aimX = e.lockX;
    e.aimY = e.lockY;
  } else {
    e.tellKind = "slam";
    e.tell = e.phaseN === 1 ? 0.85 : 0.7;
    e.markX = p.x;
    e.markY = p.y;
    if (e.phaseN >= 2) {
      if (!s.pools) s.pools = [];
      s.pools.push({ x: p.x, y: p.y, r: 28, life: 2.4, arm: 0.65, tick: 0 });
    }
  }
};

SF.drawFoe = function (ctx, e) {
  if (SF.drawEnemySprite && SF.drawEnemySprite(ctx, e)) {
    if (e.kind === "sootwing" && e.ai === "wind") {
      ctx.save();
      ctx.strokeStyle = "rgba(255, 150, 70, 0.8)";
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(e.x, e.y);
      ctx.lineTo(e.x + (e.aimX || 0) * 36, e.y + (e.aimY || 0) * 36);
      ctx.stroke();
      ctx.restore();
    }
    if ((e.kind === "cinderbrute") && (e.ai === "wind" || e.ai === "charge")) {
      ctx.save();
      ctx.strokeStyle = "rgba(255, 140, 60, 0.85)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r + 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    if (e.kind === "maw") SF.drawMawTell(ctx, e);
    if (e.hurt > 0 && typeof flash === "function") flash(ctx, e.x, e.y, e.r, e.hurt);
    return;
  }
  if (e.kind === "ashmite") SF.drawAshmite(ctx, e);
  else if (e.kind === "sootwing") SF.drawSootwing(ctx, e);
  else if (e.kind === "cinderbrute") SF.drawCinderbrute(ctx, e);
  else if (e.kind === "maw") SF.drawMaw(ctx, e);
};

SF.drawAshmite = function (ctx, e) {
  ctx.save();
  ctx.fillStyle = "#6e675f";
  ctx.beginPath();
  ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffb15a";
  ctx.beginPath();
  ctx.arc(e.x, e.y, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (e.hurt > 0) flash(ctx, e.x, e.y, e.r, e.hurt);
};

SF.drawSootwing = function (ctx, e) {
  ctx.save();
  ctx.fillStyle = "#5c564e";
  ctx.beginPath();
  ctx.ellipse(e.x, e.y, e.r + 6, e.r - 1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffb15a";
  ctx.beginPath();
  ctx.arc(e.x, e.y, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (e.ai === "wind") {
    ctx.save();
    ctx.strokeStyle = "rgba(255, 150, 70, 0.8)";
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(e.x, e.y);
    ctx.lineTo(e.x + e.aimX * 36, e.y + e.aimY * 36);
    ctx.stroke();
    ctx.restore();
  }
  if (e.hurt > 0) flash(ctx, e.x, e.y, e.r, e.hurt);
};

SF.drawCinderbrute = function (ctx, e) {
  ctx.save();
  ctx.fillStyle = "#4a403c";
  ctx.beginPath();
  ctx.ellipse(e.x, e.y, e.r + 2, e.r, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e07a3a";
  ctx.beginPath();
  ctx.arc(e.x, e.y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (e.ai === "wind" || e.ai === "charge") {
    ctx.save();
    ctx.strokeStyle = "rgba(255, 140, 60, 0.85)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r + 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  if (e.hurt > 0) flash(ctx, e.x, e.y, e.r, e.hurt);
};

SF.drawMawTell = function (ctx, e) {
  if (!e || e.dormant) return;
  if (e.tellKind !== "slam" && e.tellKind !== "charge") return;
  ctx.save();
  ctx.strokeStyle = "rgba(255, 150, 70, 0.9)";
  ctx.lineWidth = 2;
  if (e.tellKind === "slam") {
    ctx.beginPath();
    ctx.arc(e.markX || e.x, e.markY || e.y, 18 + (e.tell > 0 ? (0.85 - e.tell) * 20 : 26), 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(e.x, e.y);
    ctx.lineTo(e.x + (e.aimX || 1) * 150, e.y + (e.aimY || 0) * 150);
    ctx.stroke();
  }
  ctx.restore();
};

SF.drawMaw = function (ctx, e) {
  if (!e.alive && e.dying <= 0) return;
  if (SF.drawEnemySprite && SF.drawEnemySprite(ctx, e)) {
    SF.drawMawTell(ctx, e);
    return;
  }
  var calm = SF.calm && SF.calm();
  ctx.save();
  ctx.fillStyle = e.dormant ? "#3a3330" : "#2a2224";
  ctx.beginPath();
  ctx.ellipse(e.x, e.y + 4, e.r + 8, e.r, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = e.dormant ? "#6a5348" : "#e07a3a";
  ctx.beginPath();
  ctx.ellipse(e.x, e.y + 6, 10, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (!e.dormant && (e.tellKind === "slam" || e.tellKind === "charge")) {
    ctx.save();
    ctx.strokeStyle = "rgba(255, 150, 70, 0.9)";
    ctx.lineWidth = 2;
    if (e.tellKind === "slam") {
      ctx.beginPath();
      ctx.arc(e.markX || e.x, e.markY || e.y, 18 + (e.tell > 0 ? (0.85 - e.tell) * 20 : 26), 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(e.x, e.y);
      ctx.lineTo(e.x + (e.aimX || 1) * 150, e.y + (e.aimY || 0) * 150);
      ctx.stroke();
    }
    ctx.restore();
  }
  if (!e.dormant) {
    var w = 36;
    ctx.fillStyle = "rgba(20,10,16,0.7)";
    ctx.fillRect(e.x - w / 2, e.y - e.r - 16, w, 5);
    ctx.fillStyle = "#ffb15a";
    ctx.fillRect(e.x - w / 2, e.y - e.r - 16, w * SF.clamp(e.hp / e.maxHp, 0, 1), 5);
  }
  if (e.hurt > 0 && !calm) flash(ctx, e.x, e.y, 12, e.hurt * 0.5);
};

SF.drawCinderCracks = function (ctx) {
  if (SF.islandId !== "cinderveil") return;
  ctx.save();
  ctx.strokeStyle = "rgba(224, 122, 58, 0.55)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(300, 10);
  ctx.lineTo(380, 40);
  ctx.lineTo(460, 0);
  ctx.moveTo(420, 60);
  ctx.lineTo(510, 50);
  ctx.stroke();
  ctx.strokeStyle = "rgba(120, 190, 180, 0.45)";
  ctx.beginPath();
  ctx.arc(0, 0, 150, 0.2, 1.4);
  ctx.stroke();
  ctx.restore();
};

SF.drawHookPost = function (ctx, hook) {
  if (!hook || (SF.hookLive && !SF.hookLive(hook))) return;
  var calm = SF.calm && SF.calm();
  ctx.save();
  ctx.fillStyle = "#c4552a";
  ctx.fillRect(hook.x - 3, hook.y - 14, 6, 18);
  ctx.fillStyle = calm ? "#ffb15a" : "#ffc48a";
  ctx.beginPath();
  ctx.arc(hook.x, hook.y - 16, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

SF.drawGrappleFx = function (ctx, s) {
  (s.pools || []).forEach(function (pool) {
    ctx.save();
    ctx.globalAlpha = pool.arm > 0 ? 0.35 : 0.55;
    ctx.strokeStyle = "#e07a3a";
    ctx.fillStyle = "rgba(224, 122, 58, 0.28)";
    ctx.beginPath();
    ctx.arc(pool.x, pool.y, pool.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  });
  var p = s.player;
  if (p && p.grappleT > 0) {
    ctx.save();
    ctx.strokeStyle = "rgba(255, 190, 120, 0.9)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.gtx, p.gty);
    ctx.stroke();
    ctx.restore();
  } else if (p && SF.inputState && SF.inputState.grappleHold && p.grapple && s.mode === "play") {
    var move = (SF.readMove || function () { return { x: 0, y: 0 }; })();
    var aim = SF.aimVector(p, move);
    var target = SF.bestGrapple(p, aim);
    ctx.save();
    ctx.strokeStyle = target ? "rgba(255, 200, 120, 0.9)" : "rgba(255, 200, 120, 0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + aim.x * 70, p.y + aim.y * 70);
    ctx.stroke();
    if (target) {
      ctx.beginPath();
      ctx.arc(target.x, target.y, 8, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
};

SF.drawVoyage = function (ctx, w, h, s) {
  var t = (s.voyage && s.voyage.t) || 0;
  var drift = (SF.calm && SF.calm()) ? 16 : 80;
  var g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#241434");
  g.addColorStop(0.5, "#6a4a62");
  g.addColorStop(1, "#e7b89a");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  var i;
  ctx.save();
  for (i = 0; i < 6; i++) {
    var x = ((t * drift + i * 160) % (w + 200)) - 100;
    var y = h * (0.25 + (i % 3) * 0.16);
    ctx.globalAlpha = 0.35;
    if (SF.blobs) ctx.drawImage(SF.blobs.cloud, x, y, 180, 70);
  }
  ctx.restore();
  ctx.save();
  ctx.translate(w * 0.5, h * 0.62);
  if (window.Art && Art.sprite) {
    Art.sprite(ctx, "skiff", 0, 0, { scale: 3, anchor: "center" });
  } else {
    ctx.fillStyle = "#8a5a3a";
    ctx.fillRect(-28, -6, 56, 10);
    ctx.fillStyle = "#e7d2b4";
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(8, -34);
    ctx.lineTo(-8, -34);
    ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = "#ffd37a";
  ctx.font = "600 18px Palatino, Georgia, serif";
  ctx.textAlign = "center";
  var destId = s.voyage && s.voyage.to;
  var dest = destId === "cinderveil" ? "Cinderveil" : (destId === "emberhold" ? "Emberhold" : (destId || ""));
  if (destId && SF.destinationById) {
    var row = SF.destinationById(destId);
    if (row) dest = row.name;
  }
  ctx.fillText(dest, w / 2, h * 0.28);
};
