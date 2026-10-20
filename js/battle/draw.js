"use strict";

(function () {
var SF = window.SF || {};
window.SF = SF;

var COL = {
  wayfarer: "#7ee7ff",
  kestrel: "#3ecfb2",
  tamsin: "#f0a35a",
  wisp: "#c9a6ff",
  brumekin: "#e0a15a",
  choirling: "#b9a0e8",
  ashling: "#c47a52",
  cinderhound: "#d2653a",
  cinder_maw: "#8a4030",
  saltwisp: "#9ad7ff",
  drowned: "#6e8e98",
  stormgull: "#d5e4ef",
  tidewyrm: "#3c7ea8",
  choir_soldier: "#c8b07a",
  sentinel: "#9aa3b5",
  hush_raider: "#c46a62"
};

var BG = {
  emberhold_meadow: ["#1c1440", "#6a3a58", "#c47a62"],
  emberhold_scar: ["#241820", "#6a4038", "#a86848"],
  cinderveil_ash: ["#2a1614", "#6a3428", "#c46a40"],
  ember_vault: ["#1a1018", "#4a2430", "#e07a3a"],
  saltmere_shore: ["#142033", "#3d6d86", "#d7c39a"],
  saltmere_wreck: ["#101820", "#2c4a55", "#6d8490"],
  highspire_road: ["#1a1830", "#4a4868", "#b9a07a"],
  hush_deck: ["#162033", "#3a5870", "#8fb4c4"]
};

function roundRect(ctx, x, y, w, h, r) {
  var rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function artWindow(ctx, x, y, w, h) {
  if (window.Art && typeof Art.window === "function") {
    try {
      Art.window(ctx, x, y, w, h, {});
      return;
    } catch (err) { /* fall through */ }
  }
  ctx.fillStyle = "rgba(10, 28, 72, 0.94)";
  ctx.strokeStyle = "rgba(196, 220, 255, 0.95)";
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 12);
  ctx.fill();
  ctx.stroke();
}

function paintBg(ctx, id, w, h, t) {
  if (window.Art && typeof Art.battleBg === "function") {
    try {
      Art.battleBg(ctx, id, w, h, t || 0);
      return;
    } catch (err) { /* fall through */ }
  }
  var key = id + "|" + w + "|" + h;
  if (!SF._bgCache) SF._bgCache = {};
  if (!SF._bgCache[key]) {
    var c = document.createElement("canvas");
    c.width = Math.max(1, w);
    c.height = Math.max(1, h);
    var gctx = c.getContext("2d");
    var cols = BG[id] || BG.emberhold_meadow;
    var g = gctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, cols[0]);
    g.addColorStop(0.55, cols[1]);
    g.addColorStop(1, cols[2]);
    gctx.fillStyle = g;
    gctx.fillRect(0, 0, w, h);
    gctx.fillStyle = "rgba(0,0,0,0.18)";
    var i;
    for (i = 0; i < 18; i++) {
      gctx.fillRect((i * 97) % w, Math.floor(h * 0.62) + (i % 5) * 8, 28, 6);
    }
    SF._bgCache[key] = c;
  }
  ctx.drawImage(SF._bgCache[key], 0, 0, w, h);
}

function battlePose(b, actor) {
  if (b.phase === "result" && b.result && b.result.win && !b.result.fled && actor.side === "party" && actor.alive) return "victory";
  if (!actor.alive) return "hurt";
  var art = b.art;
  if (art && (b.phase === "readout" || b.phase === "between")) {
    if (actor.id === art.id) return art.pose || "attack";
    if (art.hurt && art.hurt.indexOf(actor.id) >= 0) return "hurt";
  }
  return "idle";
}

function battleFrame(pose) {
  if (SF.calm && SF.calm()) return 0;
  var speed = pose === "idle" ? 1.6 : 6;
  return Math.floor((SF.anim || 0) * speed) % 2;
}

function sourceSize(id, facing) {
  if (window.Art && Art.spriteSize) {
    var sz = Art.spriteSize(id, "idle", facing || "right");
    if (sz && sz.w && sz.h) return sz;
  }
  if (id === "cinder_maw") return { w: 48, h: 36 };
  if (id === "tidewyrm") return { w: 56, h: 32 };
  if (id === "wisp" || id === "saltwisp" || id === "ashling" || id === "sootwing") return { w: 16, h: 16 };
  return { w: 21, h: 26 };
}

function battleScale(actor, count, stageW, stageH) {
  var boss = actor.boss || actor.sprite === "cinder_maw" || actor.sprite === "tidewyrm";
  var src = sourceSize(actor.sprite, actor.side === "party" ? "left" : "right");
  var want;
  if (boss) want = 6;
  else if (actor.side === "party") want = count === 1 ? 9 : 5.5;
  else if (src.h < 20) want = count >= 3 ? 8 : 10;
  else if (src.h >= 30) want = count >= 3 ? 5.5 : 7;
  else want = count >= 3 ? 6 : 8;
  var zone = actor.side === "foe"
    ? (count > 2 ? 0.28 : count > 1 ? 0.38 : 0.5)
    : (count > 1 ? 0.22 : 0.48);
  var maxW = stageW * zone / src.w;
  var maxH = Math.max(80, stageH - 28) / src.h;
  var scale = Math.min(want, maxW, maxH);
  if (!(scale > 0)) scale = 2;
  return Math.round(scale * 2) / 2;
}

function animP(b) {
  if (!b.art || (b.phase !== "readout" && b.phase !== "between")) return 0;
  var dur = b.readoutDur || 0.9;
  if (!(dur > 0)) return 1;
  return Math.max(0, Math.min(1, 1 - (b.readoutT || 0) / dur));
}

function actorNudge(b, actor) {
  var art = b.art;
  var p = animP(b);
  if (!art || !p) return { x: 0, y: 0 };
  var calm = SF.calm && SF.calm();
  var swing = calm ? (p > 0.12 && p < 0.88 ? 1 : 0.35) : Math.sin(p * Math.PI);
  var step = (calm ? 28 : 52) * swing;
  var knock = (calm ? 14 : 26) * swing;
  var dx = 0;
  var dy = 0;
  if (actor.id === art.id && (art.pose === "attack" || art.pose === "cast")) {
    var reach = art.pose === "cast" ? step * 0.45 : step;
    dx = actor.side === "party" ? -reach : reach;
    if (art.pose === "victory") dy = -4;
  }
  if (art.hurt && art.hurt.indexOf(actor.id) >= 0) {
    dx += actor.side === "party" ? knock : -knock;
    dy += calm ? 2 : 4 * swing;
  }
  return { x: Math.round(dx), y: Math.round(dy) };
}

function commandBox(w, h) {
  var gap = 8;
  var btnH = h < 700 ? 48 : 56;
  var btnW = Math.min(380, w - 16);
  var x = Math.round((w - btnW) / 2);
  var block = btnH * 3 + gap * 2;
  return {
    x: x,
    y: h - 10 - block,
    w: btnW,
    btnH: btnH,
    gap: gap,
    colW: Math.floor((btnW - gap) / 2)
  };
}

function drawSprite(ctx, id, x, y, scale, pose, facing) {
  pose = pose || "idle";
  facing = facing || "right";
  if (window.Art && typeof Art.sprite === "function") {
    try {
      Art.sprite(ctx, id, x, y, {
        pose: pose,
        frame: battleFrame(pose),
        facing: facing,
        scale: scale || 2
      });
      return;
    } catch (err) { /* fall through */ }
  }
  var col = COL[id] || "#d7e2f0";
  var s = scale || 1;
  var calm = SF.calm && SF.calm();
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.ellipse(0, 8 * s, 18 * s, 6 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = col;
  ctx.fillRect(Math.round(-12 * s), Math.round(-28 * s), Math.round(24 * s), Math.round(32 * s));
  ctx.fillStyle = "#1a120c";
  ctx.fillRect(Math.round(-8 * s), Math.round(-20 * s), Math.round(5 * s), Math.round(5 * s));
  ctx.fillRect(Math.round(3 * s), Math.round(-20 * s), Math.round(5 * s), Math.round(5 * s));
  if (id === "cinder_maw" || id === "tidewyrm") {
    ctx.fillStyle = id === "tidewyrm" ? "#16384c" : "#3a201c";
    ctx.beginPath();
    ctx.ellipse(0, -6 * s, 46 * s, 32 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = calm ? "#ffb15a" : "#ffb15a";
    ctx.beginPath();
    ctx.arc(0, -2 * s, 10 * s, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawPortrait(ctx, id, x, y, size) {
  if (window.Art && typeof Art.portrait === "function") {
    try {
      Art.portrait(ctx, id, x, y, size);
      return;
    } catch (err) { /* fall through */ }
  }
  ctx.fillStyle = COL[id] || "#9ab";
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = "#1a120c";
  ctx.fillRect(x + size * 0.25, y + size * 0.3, size * 0.15, size * 0.12);
  ctx.fillRect(x + size * 0.6, y + size * 0.3, size * 0.15, size * 0.12);
}

function bar(ctx, x, y, w, h, pct, fill) {
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, Math.max(0, Math.round(w * Math.max(0, Math.min(1, pct)))), h);
}

function actorOf(b, id) {
  var i;
  for (i = 0; i < b.actors.length; i++) if (b.actors[i].id === id) return b.actors[i];
  return null;
}

function addHit(id, x, y, w, h) {
  SF.Battle.hits.push({ id: id, x: x, y: y, w: w, h: h });
}

function button(ctx, x, y, w, h, label, on) {
  artWindow(ctx, x, y, w, h);
  if (on) {
    ctx.save();
    ctx.strokeStyle = "#ffd37a";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);
    ctx.restore();
  }
  ctx.fillStyle = "#f4f7ff";
  ctx.font = "700 18px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, Math.round(x + w / 2), Math.round(y + h / 2));
}

SF.drawBattle = function (ctx, w, h, dpr) {
  var s = SF.state;
  var b = s && s.battle;
  if (!ctx || !b || !w || !h) return;
  dpr = dpr || 1;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
  SF.Battle.hits = [];
  paintBg(ctx, b.bg, w, h, b.t || 0);
  var top = 6;
  var stripH = 54;
  drawStrip(ctx, b, 8, top, w - 16, stripH);
  var foes = b.actors.filter(function (a) { return a.side === "foe"; });
  var party = b.actors.filter(function (a) { return a.side === "party"; });
  if (b.phase === "result") {
    var stageTopR = top + stripH + 4;
    var stageBotR = Math.round(h * 0.46);
    drawStage(ctx, b, foes, party, w, stageTopR, stageBotR);
    drawResult(ctx, b, w, h, stageBotR + 8);
    return;
  }
  var submenu = b.phase === "skills" || b.phase === "items";
  var box = commandBox(w, h);
  var gap = 6;
  var logH = submenu ? 0 : 68;
  var cardH = submenu ? 0 : (party.length <= 1 ? 92 : 84);
  var stageTop = top + stripH + 4;
  var stageBot = submenu ? Math.min(stageTop + 210, box.y - 8) : (box.y - gap - logH - gap - cardH - 4);
  if (stageBot < stageTop + 120) stageBot = stageTop + 120;
  drawStage(ctx, b, foes, party, w, stageTop, stageBot);
  if (!submenu) {
    drawPartyCards(ctx, b, party, 8, stageBot + 4, w - 16, cardH);
    drawLog(ctx, b, 8, stageBot + 4 + cardH + gap, w - 16, logH);
  }
  if (b.phase === "menu" || b.phase === "target") drawCommands(ctx, b, w, h);
  if (b.phase === "skills") drawSkillList(ctx, b, w, h, stageBot + 8);
  if (b.phase === "items") drawItemList(ctx, b, w, h, stageBot + 8);
  if (b.phase === "readout") addHit("skip", 0, 0, w, h);
  if (b.phase === "target") {
    ctx.fillStyle = "#ffd37a";
    ctx.font = "700 16px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(b.aim === "ally" ? "Tap an ally." : "Tap a foe.", w / 2, box.y - 8);
  }
};

function drawStrip(ctx, b, x, y, w, h) {
  artWindow(ctx, x, y, w, h);
  var order = b.order && b.order.length ? b.order : SF.Battle.forecast(b, 8);
  var n = Math.min(8, order.length || 1);
  var slot = Math.min(44, Math.floor((w - 16) / n));
  var face = Math.max(22, Math.min(32, slot - 6));
  var i, id, actor, ox;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  for (i = 0; i < n; i++) {
    id = order[i];
    actor = actorOf(b, id);
    if (!actor) continue;
    ox = x + 10 + i * slot;
    if (i === 0) {
      ctx.strokeStyle = "#ffd37a";
      ctx.lineWidth = 2;
      ctx.strokeRect(ox - 2, y + 5, face + 4, face + 4);
    }
    drawPortrait(ctx, actor.sprite, ox, y + 7, face);
    ctx.fillStyle = i === 0 ? "#ffd37a" : "#d5def2";
    ctx.font = "700 10px system-ui, sans-serif";
    ctx.fillText(actor.name.split(" ")[0].slice(0, 7), ox + face / 2, y + h - 5);
  }
}

function foePlace(i, count, w, stageH) {
  if (count <= 1) return { x: Math.round(w * 0.26), lift: 0 };
  if (count === 2) {
    return i === 0
      ? { x: Math.round(w * 0.16), lift: Math.round(stageH * 0.34) }
      : { x: Math.round(w * 0.32), lift: 0 };
  }
  var table = [
    { x: 0.15, lift: 0.4 },
    { x: 0.3, lift: 0.18 },
    { x: 0.2, lift: 0 }
  ];
  var t = table[Math.min(i, table.length - 1)];
  return { x: Math.round(w * t.x), lift: Math.round(stageH * t.lift) };
}

function drawStage(ctx, b, foes, party, w, top, bottom) {
  var ground = bottom - 2;
  var stageH = Math.max(80, bottom - top);
  var nF = Math.max(1, foes.length);
  var nP = Math.max(1, party.length);
  var leftLimit = Math.round(w * 0.5);
  var right0 = Math.round(w * 0.52);
  var right1 = w - 8;
  var spots = [];
  foes.forEach(function (f, i) {
    var scale = battleScale(f, nF, w, stageH);
    var src = sourceSize(f.sprite, "right");
    var half = src.w * scale / 2;
    var place = foePlace(i, nF, w, stageH);
    var x = Math.max(Math.round(half + 2), Math.min(Math.round(leftLimit - half * 0.35), place.x));
    var feet = ground - place.lift;
    var nudge = actorNudge(b, f);
    var pose = battlePose(b, f);
    ctx.save();
    ctx.globalAlpha = f.alive ? 1 : 0.35;
    drawSprite(ctx, f.sprite, x + nudge.x, feet + nudge.y, scale, pose, "right");
    ctx.restore();
    var spriteTop = feet - src.h * scale;
    var labelY = Math.max(top + 14, spriteTop - 30);
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#f6f2ea";
    ctx.font = "700 14px Palatino, Georgia, serif";
    ctx.fillText(f.name, x, labelY);
    bar(ctx, x - 34, labelY + 6, 68, 6, f.maxHp ? f.hp / f.maxHp : 0, f.alive ? "#e15b6a" : "#665");
    ctx.font = "12px system-ui, sans-serif";
    ctx.fillStyle = "#f6f2ea";
    ctx.fillText(f.hp + "/" + f.maxHp, x, labelY + 24);
    if (f.revealed && f.weak) {
      ctx.fillStyle = "#ffd37a";
      ctx.fillText("Weak: " + weakLabel(f.weak), x, labelY + 38);
    }
    if (f.core) {
      ctx.fillStyle = "#ffd37a";
      ctx.font = "700 12px system-ui, sans-serif";
      ctx.fillText("Core", x, labelY + (f.revealed && f.weak ? 52 : 38));
    }
    spots.push({
      actor: f,
      x: x + nudge.x,
      y: feet + nudge.y,
      top: spriteTop + nudge.y
    });
    if (f.alive) addHit("foe:" + f.id, x - half, spriteTop - 36, Math.max(48, half * 2), feet - spriteTop + 40);
  });
  party.forEach(function (a, i) {
    var span = right1 - right0;
    var scale = battleScale(a, nP, w, stageH);
    var src = sourceSize(a.sprite, "left");
    var half = src.w * scale / 2;
    var x = nP === 1 ? Math.round(w * 0.78) : Math.round(right0 + span * (i + 0.5) / nP);
    x = Math.max(Math.round(right0 + half * 0.4), Math.min(Math.round(right1 - half), x));
    var nudge = actorNudge(b, a);
    var pose = battlePose(b, a);
    if (pose === "victory") nudge.y -= 10;
    ctx.save();
    ctx.globalAlpha = a.alive ? 1 : 0.35;
    drawSprite(ctx, a.sprite, x + nudge.x, ground + nudge.y, scale, pose, "left");
    ctx.restore();
    spots.push({
      actor: a,
      x: x + nudge.x,
      y: ground + nudge.y,
      top: ground - src.h * scale + nudge.y
    });
  });
  drawBattleFx(ctx, b, spots);
}

var FX = {
  ember: ["#e07a30", "#ffb15a", "#a33a18"],
  tide: ["#2a9aa8", "#7ee0d8", "#1a5c78"],
  gale: ["#d7e2b8", "#8ec8a0", "#c8b07a"],
  shard: ["#3ec8e8", "#7ee7ff", "#2a6ad4"]
};

function drawElement(ctx, element, x, y, p, calm) {
  var cols = FX[element];
  if (!cols) return;
  var n = calm ? 7 : 10;
  var i, ang, rad, px, py, col;
  for (i = 0; i < n; i++) {
    ang = (i / n) * Math.PI * 2 + (calm ? 0.6 : p * 1.1);
    rad = 16 + (i % 3) * 10 + (calm ? 12 : p * 28);
    px = Math.round(x + Math.cos(ang) * rad);
    py = Math.round(y - Math.sin(Math.abs(ang)) * rad * 0.55 - (calm ? 6 : p * 14));
    col = cols[i % cols.length];
    ctx.fillStyle = col;
    if (element === "gale") ctx.fillRect(px, py, 12, 3);
    else if (element === "tide") ctx.fillRect(px, py, 4, 9);
    else if (element === "shard") {
      ctx.fillRect(px, py, 5, 5);
      ctx.fillRect(px - 3, py + 2, 11, 2);
    } else ctx.fillRect(px, py, 6, 6);
  }
}

function drawBattleFx(ctx, b, spots) {
  var art = b.art;
  if (!art || !spots) return;
  var p = b.phase === "result" ? 0.62 : animP(b);
  if (!p) return;
  var calm = (SF.calm && SF.calm()) || b.phase === "result";
  var byId = {};
  spots.forEach(function (spot) { byId[spot.actor.id] = spot; });
  function bodyY(spot) {
    var top = spot.top == null ? spot.y - 80 : spot.top;
    return Math.round(top + (spot.y - top) * 0.42);
  }
  if (art.element && art.hurt && art.hurt.length) {
    art.hurt.forEach(function (id) {
      var spot = byId[id];
      if (spot) drawElement(ctx, art.element, spot.x, bodyY(spot), p, calm);
    });
  }
  (art.pops || []).forEach(function (pop) {
    var spot = byId[pop.id];
    if (!spot) return;
    var rise = calm ? 18 : Math.round(42 * p);
    var alpha = calm ? 1 : (p > 0.78 ? Math.max(0, 1 - (p - 0.78) / 0.22) : 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = pop.heal ? "#7dffa8" : "#ffd37a";
    ctx.font = "700 28px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText((pop.heal ? "+" : "") + pop.text, spot.x, bodyY(spot) - 16 - rise);
    ctx.restore();
  });
}

function drawPartyCards(ctx, b, party, x, y, w, h) {
  var n = party.length || 1;
  var gap = 6;
  var bw = Math.floor((w - gap * (n - 1)) / n);
  party.forEach(function (a, i) {
    var cx = x + i * (bw + gap);
    artWindow(ctx, cx, y, bw, h);
    var portrait = Math.min(48, h - 16);
    drawPortrait(ctx, a.sprite, cx + 10, y + Math.round((h - portrait) / 2), portrait);
    var textX = cx + portrait + 22;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = b.actorId === a.id ? "#ffd37a" : "#f6f2ea";
    ctx.font = "700 " + (n === 1 ? 18 : 14) + "px Palatino, Georgia, serif";
    ctx.fillText(a.name, textX, y + 8);
    var barW = Math.max(36, cx + bw - 12 - textX);
    ctx.font = "13px system-ui, sans-serif";
    ctx.fillStyle = "#d7e6ff";
    ctx.fillText("HP " + a.hp + "/" + a.maxHp, textX, y + 30);
    bar(ctx, textX, y + 46, barW, 7, a.maxHp ? a.hp / a.maxHp : 0, "#ef6d7a");
    if (h >= 78) {
      ctx.fillText("SP " + a.sp + "/" + a.maxSp, textX, y + 56);
      bar(ctx, textX, y + h - 14, barW, 6, a.maxSp ? a.sp / a.maxSp : 0, "#7eb6ff");
    }
    addHit("ally:" + a.id, cx, y, bw, h);
  });
}

function weakLabel(id) {
  if (id === "ember") return "Ember";
  if (id === "tide") return "Tide";
  if (id === "gale") return "Gale";
  if (id === "shard") return "Shard";
  return id;
}

function drawLog(ctx, b, x, y, w, h) {
  artWindow(ctx, x, y, w, h);
  var lines = b.log.slice(-2);
  ctx.fillStyle = "#f6f2ea";
  ctx.font = "15px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  lines.forEach(function (line, i) {
    ctx.fillText(line, x + 14, y + 14 + i * 22);
  });
}

function drawCommands(ctx, b, w, h) {
  var labels = [
    ["attack", "Attack"],
    ["skill", "Skill"],
    ["item", "Item"],
    ["defend", "Defend"],
    ["flee", b.canFlee ? "Flee" : "Cannot flee"]
  ];
  var box = commandBox(w, h);
  var i;
  for (i = 0; i < 4; i++) {
    var cx = box.x + (i % 2) * (box.colW + box.gap);
    var cy = box.y + Math.floor(i / 2) * (box.btnH + box.gap);
    button(ctx, cx, cy, box.colW, box.btnH, labels[i][1], b.sel === i);
    addHit("cmd:" + labels[i][0], cx, cy, box.colW, box.btnH);
  }
  button(ctx, box.x, box.y + 2 * (box.btnH + box.gap), box.w, box.btnH, labels[4][1], b.sel === 4);
  addHit("cmd:flee", box.x, box.y + 2 * (box.btnH + box.gap), box.w, box.btnH);
}

function drawSkillList(ctx, b, w, h, y0) {
  var actor = actorOf(b, b.actorId);
  var skills = actor ? actor.skills : [];
  var btnH = 48;
  var gap = 6;
  var btnW = Math.min(380, w - 16);
  var x = Math.round((w - btnW) / 2);
  var backY = h - 10 - 52;
  var y = y0 || 280;
  skills.forEach(function (id, i) {
    var sk = SF.SKILLS[id];
    if (!sk) return;
    var cy = y + i * (btnH + gap);
    if (cy + btnH > backY - 8) return;
    button(ctx, x, cy, btnW, btnH, sk.name + "  " + sk.sp + " SP", false);
    addHit("skill:" + id, x, cy, btnW, btnH);
  });
  if (!skills.length) {
    ctx.fillStyle = "#f4f7ff";
    ctx.font = "16px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("No skills.", w / 2, y + 20);
  }
  button(ctx, x, backY, btnW, 52, "Back", false);
  addHit("back", x, backY, btnW, 52);
}

function drawItemList(ctx, b, w, h, y0) {
  var rows = [];
  var inv = (SF.state && SF.state.inventory) || {};
  Object.keys(inv).forEach(function (id) {
    var it = SF.ITEMS[id];
    if (it && it.kind === "item" && inv[id] > 0) rows.push(it);
  });
  var btnH = 48;
  var gap = 6;
  var btnW = Math.min(380, w - 16);
  var x = Math.round((w - btnW) / 2);
  var backY = h - 10 - 52;
  var y = y0 || 280;
  if (!rows.length) {
    ctx.fillStyle = "#f4f7ff";
    ctx.font = "16px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("No items.", w / 2, y + 20);
  }
  rows.forEach(function (it, i) {
    var cy = y + i * (btnH + gap);
    if (cy + btnH > backY - 8) return;
    button(ctx, x, cy, btnW, btnH, it.name + " x" + (SF.state.inventory[it.id] || 0), false);
    addHit("item:" + it.id, x, cy, btnW, btnH);
  });
  button(ctx, x, backY, btnW, 52, "Back", false);
  addHit("back", x, backY, btnW, 52);
}

function drawResult(ctx, b, w, h, y0) {
  var row = b.result || {};
  var panelW = Math.min(380, w - 24);
  var x = Math.round((w - panelW) / 2);
  var y = y0 || Math.round(h * 0.42);
  var panelH = Math.max(180, h - y - 12);
  artWindow(ctx, x, y, panelW, panelH);
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#ffd37a";
  ctx.font = "700 28px system-ui, sans-serif";
  var title = row.fled ? "Fled." : (row.win ? "Victory." : "Defeat.");
  ctx.fillText(title, x + 16, y + 16);
  ctx.fillStyle = "#f4f7ff";
  ctx.font = "18px system-ui, sans-serif";
  var ly = y + 58;
  if (row.win && !row.fled) {
    ctx.fillText("XP +" + (row.xp || 0), x + 16, ly);
    ly += 26;
    ctx.fillText("Marks +" + (row.gold || 0), x + 16, ly);
    ly += 26;
    (row.items || []).forEach(function (name) {
      ctx.fillText(name, x + 16, ly);
      ly += 24;
    });
  }
  (row.levels || []).forEach(function (lv) {
    if (ly > y + panelH - 36) return;
    ctx.fillStyle = "#ffd37a";
    ctx.font = "700 18px system-ui, sans-serif";
    ctx.fillText("Level up!", x + 16, ly);
    ly += 24;
    ctx.fillStyle = "#f4f7ff";
    ctx.font = "16px system-ui, sans-serif";
    ctx.fillText(lv.name + " is level " + lv.level + ".", x + 16, ly);
    ly += 22;
    ctx.fillText("HP " + lv.hp[0] + " to " + lv.hp[1], x + 16, ly);
    ly += 20;
    ctx.fillText("Attack " + lv.atk[0] + " to " + lv.atk[1], x + 16, ly);
    ly += 20;
    ctx.fillText("Magic " + lv.mag[0] + " to " + lv.mag[1], x + 16, ly);
    ly += 20;
    if (lv.skill) {
      ctx.fillText("Learned " + lv.skill + ".", x + 16, ly);
      ly += 22;
    }
    ly += 6;
  });
  if (!row.win) {
    ctx.fillText("The party is at half HP.", x + 16, ly);
  }
  var btnW = panelW;
  var by = h - 20 - 64;
  button(ctx, x, by, btnW, 64, "Continue", true);
  addHit("result", x, by, btnW, 64);
}

function pick(x, y) {
  var hits = SF.Battle.hits || [];
  var i;
  for (i = hits.length - 1; i >= 0; i--) {
    var h = hits[i];
    if (x >= h.x && y >= h.y && x <= h.x + h.w && y <= h.y + h.h) return h.id;
  }
  return "";
}

function currentActor(b) {
  var i;
  for (i = 0; i < b.actors.length; i++) if (b.actors[i].id === b.actorId) return b.actors[i];
  return null;
}

SF.Battle.onPointer = function (x, y) {
  var s = SF.state;
  var b = s && s.battle;
  if (!b) return;
  if (window.Sfx) Sfx.play("ui");
  var id = pick(x, y);
  if (b.phase === "readout") {
    SF.Battle.skipReadout();
    return;
  }
  if (b.phase === "result") {
    if (id === "result" || id === "skip") SF.Battle.confirmResult();
    return;
  }
  if (id === "back") {
    b.phase = "menu";
    b.pending = null;
    return;
  }
  if (b.phase === "menu" && id.indexOf("cmd:") === 0) {
    var cmd = id.slice(4);
    if (cmd === "attack") {
      b.pending = { type: "skill", skillId: "attack" };
      b.aim = "foe";
      b.phase = "target";
    } else if (cmd === "skill") b.phase = "skills";
    else if (cmd === "item") b.phase = "items";
    else if (cmd === "defend") SF.Battle.playerAct({ type: "defend" });
    else if (cmd === "flee") SF.Battle.playerAct({ type: "flee" });
    return;
  }
  if (b.phase === "skills" && id.indexOf("skill:") === 0) {
    var skill = SF.SKILLS[id.slice(6)];
    if (!skill) return;
    var actor = currentActor(b);
    if (actor && actor.sp < skill.sp) {
      b.log.push("Not enough SP.");
      return;
    }
    b.pending = { type: "skill", skillId: skill.id };
    if (skill.target === "all-foes" || skill.target === "all-allies" || skill.target === "self" || skill.scan) {
      var selfId = skill.target === "self" && actor ? actor.id : null;
      SF.Battle.playerAct({ type: "skill", skillId: skill.id, targetId: selfId });
      return;
    }
    b.aim = skill.target === "ally" ? "ally" : "foe";
    b.phase = "target";
    return;
  }
  if (b.phase === "items" && id.indexOf("item:") === 0) {
    var item = SF.ITEMS[id.slice(5)];
    if (!item) return;
    b.pending = { type: "item", itemId: item.id };
    if (item.flee || item.target === "none") {
      SF.Battle.playerAct({ type: "item", itemId: item.id });
      return;
    }
    b.aim = item.target === "foe" ? "foe" : "ally";
    b.phase = "target";
    return;
  }
  if (b.phase === "target") {
    var tid = "";
    if (id.indexOf("foe:") === 0) tid = id.slice(4);
    if (id.indexOf("ally:") === 0) tid = id.slice(5);
    if (!tid || !b.pending) return;
    var action = {
      type: b.pending.type,
      skillId: b.pending.skillId,
      itemId: b.pending.itemId,
      targetId: tid
    };
    b.pending = null;
    SF.Battle.playerAct(action);
  }
};

function bindBattlePointer() {
  if (typeof document === "undefined") return;
  var view = document.getElementById("view");
  if (!view || view.dataset.battleBound) return;
  view.dataset.battleBound = "1";
  view.addEventListener("pointerdown", function (e) {
    var s = SF.state;
    if (!s || (s.mode !== "battle" && s.mode !== "results")) return;
    var rect = view.getBoundingClientRect();
    SF.Battle.onPointer(e.clientX - rect.left, e.clientY - rect.top);
    e.preventDefault();
  });
  window.addEventListener("keydown", function (e) {
    var s = SF.state;
    if (!s || (s.mode !== "battle" && s.mode !== "results") || !s.battle) return;
    if (e.code === "Enter" || e.code === "Space" || e.code === "Escape" || e.code.indexOf("Digit") === 0) {
      e.preventDefault();
      e.stopPropagation();
    }
    var b = s.battle;
    if (e.code === "Enter" || e.code === "Space") {
      if (b.phase === "readout") SF.Battle.skipReadout();
      else if (b.phase === "result") SF.Battle.confirmResult();
      else if (b.phase === "menu") {
        var cmds = ["attack", "skill", "item", "defend", "flee"];
        SF.Battle.onPointer = SF.Battle.onPointer;
        var fake = { attack: "cmd:attack", skill: "cmd:skill", item: "cmd:item", defend: "cmd:defend", flee: "cmd:flee" };
        b._key = fake[cmds[b.sel || 0]];
        var hits = SF.Battle.hits || [];
        var found = null;
        hits.forEach(function (h) { if (h.id === b._key) found = h; });
        if (found) SF.Battle.onPointer(found.x + 4, found.y + 4);
      }
    }
    if (e.code === "Escape") {
      if (b.phase === "skills" || b.phase === "items" || b.phase === "target") b.phase = "menu";
    }
    if (e.code === "ArrowDown" || e.code === "ArrowRight") b.sel = ((b.sel || 0) + 1) % 5;
    if (e.code === "ArrowUp" || e.code === "ArrowLeft") b.sel = ((b.sel || 0) + 4) % 5;
  }, true);
}

var baseDraw = SF.draw;
SF.draw = function () {
  var s = SF.state;
  if (s && s.battle && (s.mode === "battle" || s.mode === "results") && SF.view && SF.ctx) {
    SF.drawBattle(SF.ctx, SF.viewW || 1, SF.viewH || 1, SF.dpr || 1);
    return;
  }
  if (baseDraw) baseDraw();
};

var prevResolve = SF.Battle.resolve;
SF.Battle.resolve = function (b, actor, action) {
  var before = {};
  if (b && b.actors) b.actors.forEach(function (a) { before[a.id] = a.hp; });
  prevResolve(b, actor, action);
  var skill = null;
  if (action && action.skillId) skill = SF.skillById(action.skillId);
  else if (action && (action.type === "skill" || action.type === "attack")) skill = SF.skillById("attack");
  var pose = "attack";
  if (action && (action.type === "defend" || action.type === "flee")) pose = "idle";
  else if (skill && (skill.mag || skill.heal || skill.scan || skill.defUp || skill.spdUp)) pose = "cast";
  else if (action && action.type === "item") pose = "cast";
  var hurt = [];
  var pops = [];
  if (b && b.actors) {
    b.actors.forEach(function (a) {
      if (before[a.id] == null) return;
      if (a.hp < before[a.id]) {
        hurt.push(a.id);
        pops.push({ id: a.id, text: before[a.id] - a.hp, heal: false });
      } else if (a.hp > before[a.id]) {
        pops.push({ id: a.id, text: a.hp - before[a.id], heal: true });
      }
    });
  }
  var element = (skill && skill.element) || "";
  if (!element && action && action.itemId && SF.ITEMS && SF.ITEMS[action.itemId]) element = SF.ITEMS[action.itemId].element || "";
  if (b && b.phase === "readout" && !SF.Battle.instant) {
    var dur = (SF.calm && SF.calm()) ? 0.7 : 1.05;
    b.readoutT = dur;
    b.readoutDur = dur;
  }
  if (b) b.art = { id: actor && actor.id, pose: pose, hurt: hurt, element: element, pops: pops };
};

bindBattlePointer();
if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bindBattlePointer);
}
})();
