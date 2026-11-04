"use strict";

// BattleGfx: plates, sprites, bars, and the name-fitting shared by the stage and the HUD.

(function () {
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
  if (SF.DrawDeps.art() && typeof SF.DrawDeps.art().window === "function") {
    try {
      SF.DrawDeps.art().window(ctx, x, y, w, h, {});
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
  if (SF.DrawDeps.art() && typeof SF.DrawDeps.art().battleBg === "function") {
    try {
      SF.DrawDeps.art().battleBg(ctx, id, w, h, t || 0);
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
  if (!actor.alive) return "ko";
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
  if (SF.DrawDeps.art() && SF.DrawDeps.art().spriteSize) {
    var sz = SF.DrawDeps.art().spriteSize(id, "idle", facing || "right");
    if (sz && sz.w && sz.h) {
      return {
        w: sz.w,
        h: sz.h,
        ax: sz.ax != null ? sz.ax : sz.w / 2,
        ay: sz.ay != null ? sz.ay : sz.h - 1
      };
    }
  }
  if (id === "cinder_maw") return { w: 48, h: 36, ax: 24, ay: 35 };
  if (id === "tidewyrm") return { w: 56, h: 32, ax: 28, ay: 31 };
  if (id === "wisp" || id === "saltwisp" || id === "ashling" || id === "sootwing") return { w: 16, h: 16, ax: 8, ay: 15 };
  return { w: 21, h: 26, ax: 10, ay: 25 };
}

function isBoss(actor) {
  return !!(actor && (actor.boss || actor.sprite === "cinder_maw" || actor.sprite === "tidewyrm"));
}

function targetPixelHeight(actor, count, stageH) {
  var boss = isBoss(actor);
  var tall = stageH >= 260;
  if (boss) return tall ? Math.min(200, Math.round(stageH * 0.62)) : Math.min(160, Math.round(stageH * 0.5));
  if (actor.side === "party") {
    var hero = count > 2 ? 110 : count > 1 ? 118 : 124;
    return tall ? hero : Math.min(hero, Math.round(stageH * 0.42));
  }
  var foe = count >= 4 ? 90 : count === 3 ? 100 : count === 2 ? 110 : 116;
  return tall ? foe : Math.min(foe, Math.round(stageH * 0.38));
}

function battleScale(actor, count, stageH, slotW, slotH, labelH) {
  var facing = actor.side === "party" ? "left" : "right";
  var src = sourceSize(actor.sprite, facing);
  var target = targetPixelHeight(actor, count, stageH);
  var scale = target / src.h;
  var maxH = Math.max(28, (slotH || stageH) - (labelH || 0) - 6);
  var maxW = Math.max(20, (slotW || 160) - 8);
  scale = Math.min(scale, maxH / src.h, maxW / src.w);
  if (!(scale > 0) || !isFinite(scale)) scale = 2;
  if (actor.side === "party") return partyBattleScale(src.h, 0);
  var whole = Math.max(1, Math.round(scale));
  while (whole > 1 && (whole * src.h > maxH + 0.01 || whole * src.w > maxW + 0.01)) whole -= 1;
  return whole;
}

// Height a pair of wisps would stand in this zone. Bosses are far taller;
// sizing the party off the Maw made the heroes about twice a meadow fight.
function meadowFoeHeight(zoneW, zoneH) {
  var srcW = 22;
  var srcH = 24;
  if (SF.DrawDeps.art() && SF.DrawDeps.art().spriteSize) {
    var sz = SF.DrawDeps.art().spriteSize("wisp", "idle", "right");
    if (sz && sz.h) {
      srcH = sz.h;
      if (sz.w) srcW = sz.w;
    }
  }
  var cellW = Math.max(20, (zoneW - 10) / 2);
  var target = zoneH >= 260 ? 110 : Math.min(110, Math.round(zoneH * 0.38));
  var scale = target / srcH;
  var maxH = Math.max(28, zoneH - 46);
  var maxW = Math.max(20, cellW - 8);
  scale = Math.min(scale, maxH / srcH, maxW / srcW);
  if (!(scale > 0) || !isFinite(scale)) scale = 2;
  return srcH * (Math.round(scale * 4) / 4);
}

// Party fighters land near 80% of a normal foe, on a whole scale.
// A 1.5 step can never resample the sprite.
function partyBattleScale(srcH, foeH) {
  var options = [2, 3, 4];
  var target = foeH > 0 ? foeH * 0.8 : srcH * 3;
  var best = 3;
  var bestScore = Infinity;
  var i, s, h, ratio, inBand, score;
  for (i = 0; i < options.length; i++) {
    s = options[i];
    h = srcH * s;
    ratio = foeH > 0 ? h / foeH : 1;
    inBand = foeH > 0 && ratio >= 0.75 && ratio <= 0.85;
    score = Math.abs(h - target) + (inBand ? 0 : 1000);
    if (score < bestScore) {
      bestScore = score;
      best = s;
    }
  }
  return best;
}

function animP(b) {
  if (!b.art || (b.phase !== "readout" && b.phase !== "between")) return 0;
  // Hit pause holds the impact frame instead of freezing on the windup.
  if (b.hitPause > 0) return 0.2;
  var dur = b.readoutDur || 0.55;
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
  // A short nudge, not a lunge. Reduce flashing holds it nearly still.
  var knock = (calm ? 8 : 12) * swing;
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

function drawSprite(ctx, id, x, y, scale, pose, facing) {
  pose = pose || "idle";
  facing = facing || "right";
  ctx.imageSmoothingEnabled = false;
  if (SF.DrawDeps.art() && typeof SF.DrawDeps.art().sprite === "function") {
    try {
      SF.DrawDeps.art().sprite(ctx, id, x, y, {
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
  if (SF.DrawDeps.art() && typeof SF.DrawDeps.art().portrait === "function") {
    try {
      SF.DrawDeps.art().portrait(ctx, id, x, y, size);
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

function button(ctx, x, y, w, h, label, on, dim) {
  ctx.save();
  artWindow(ctx, x, y, w, h);
  if (dim) {
    ctx.fillStyle = "rgba(8, 12, 28, 0.72)";
    ctx.fillRect(x + 4, y + 4, Math.max(1, w - 8), Math.max(1, h - 8));
  }
  if (on && !dim) {
    ctx.strokeStyle = "#ffd37a";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);
  }
  ctx.fillStyle = dim ? "#8d97ad" : "#f4f7ff";
  var size = 18;
  ctx.font = "700 " + size + "px system-ui, sans-serif";
  while (size > 13 && ctx.measureText(label).width > w - 16) {
    size -= 1;
    ctx.font = "700 " + size + "px system-ui, sans-serif";
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, Math.round(x + w / 2), Math.round(y + h / 2));
  ctx.restore();
}

var UNIT_SHORT = {
  wayfarer: "You",
  kestrel: "Kestrel",
  tamsin: "Tamsin",
  wisp: "Wisp",
  brumekin: "Brumekin",
  choirling: "Choir",
  ashling: "Ashling",
  cinderhound: "Hound",
  cinder_maw: "Maw",
  saltwisp: "Salt",
  drowned: "Drowned",
  stormgull: "Gull",
  tidewyrm: "Wyrm",
  choir_soldier: "Soldier",
  sentinel: "Sentinel",
  hush_raider: "Raider"
};

var UNIT_TIGHT = {
  ashling: "Ash",
  kestrel: "Kes",
  tamsin: "Tam",
  sentinel: "Sentry",
  choir_soldier: "Choir",
  brumekin: "Brumekin",
  drowned: "Drowned",
  stormgull: "Gull"
};

function unitKey(actor) {
  if (!actor) return "";
  if (actor.key) return actor.key;
  if (actor.id === "p-wayfarer" || actor.sprite === "wayfarer") return "wayfarer";
  return actor.sprite || "";
}

function isHero(actor) {
  var key = unitKey(actor);
  return key === "wayfarer" || (actor && actor.id === "p-wayfarer");
}

function duplicateMark(actor, battle) {
  if (!actor || !battle || !battle.actors || isHero(actor)) return "";
  var key = unitKey(actor);
  var same = 0;
  var i;
  for (i = 0; i < battle.actors.length; i++) {
    var other = battle.actors[i];
    if (other.side === actor.side && unitKey(other) === key) same += 1;
  }
  if (same < 2) return "";
  if (actor.side === "foe") return String(actor.index || 1);
  return String((actor.index || 0) + 1);
}

function shortBase(actor) {
  if (isHero(actor)) return "You";
  var key = unitKey(actor);
  if (UNIT_SHORT[key]) return UNIT_SHORT[key];
  var name = ((actor && actor.name) || "").replace(/\s+\d+$/, "");
  var words = name.split(" ").filter(Boolean);
  return words.length ? words[words.length - 1] : "Foe";
}

function tightBase(actor) {
  var key = unitKey(actor);
  return UNIT_TIGHT[key] || shortBase(actor);
}

function labelChoices(actor, battle, includeFull) {
  var opts = [];
  function add(text) {
    if (text && opts.indexOf(text) < 0) opts.push(text);
  }
  if (isHero(actor)) return ["You"];
  if (includeFull) add((actor && actor.name) || "");
  var mark = duplicateMark(actor, battle);
  var primary = shortBase(actor);
  var tight = tightBase(actor);
  if (mark) {
    add(primary + " " + mark);
    add(tight + " " + mark);
  }
  add(primary);
  add(tight);
  return opts;
}

function pickFitting(ctx, options, maxW, maxSize, minSize) {
  var i, size;
  for (i = 0; i < options.length; i++) {
    for (size = maxSize; size >= minSize; size--) {
      ctx.font = "700 " + size + "px system-ui, sans-serif";
      if (ctx.measureText(options[i]).width <= maxW) return { text: options[i], size: size };
    }
  }
  var last = options.length ? options[options.length - 1] : "";
  ctx.font = "700 " + minSize + "px system-ui, sans-serif";
  return { text: last, size: minSize };
}
  SF.BattleGfx = {
    roundRect: roundRect,
    artWindow: artWindow,
    paintBg: paintBg,
    battlePose: battlePose,
    battleFrame: battleFrame,
    sourceSize: sourceSize,
    isBoss: isBoss,
    targetPixelHeight: targetPixelHeight,
    battleScale: battleScale,
    meadowFoeHeight: meadowFoeHeight,
    partyBattleScale: partyBattleScale,
    animP: animP,
    actorNudge: actorNudge,
    drawSprite: drawSprite,
    drawPortrait: drawPortrait,
    bar: bar,
    actorOf: actorOf,
    addHit: addHit,
    button: button,
    unitKey: unitKey,
    isHero: isHero,
    duplicateMark: duplicateMark,
    shortBase: shortBase,
    tightBase: tightBase,
    labelChoices: labelChoices,
    pickFitting: pickFitting
  };
})();
