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
  if (window.Art && Art.spriteSize) {
    var sz = Art.spriteSize(id, "idle", facing || "right");
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
  if (window.Art && Art.spriteSize) {
    var sz = Art.spriteSize("wisp", "idle", "right");
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

function stripHeight(w, h, nParty) {
  var base = w >= 700 ? 78 : (h <= 400 ? 60 : 72);
  // Solo used to give about a fifth of a phone screen to four copies of "You".
  if ((nParty == null ? 1 : nParty) <= 1) return h <= 430 ? 50 : 56;
  return base;
}

function layoutBattle(w, h, phase, nParty) {
  var land = w > h;
  var short = h <= 400;
  var margin = short ? 6 : 8;
  var gap = short ? 4 : 6;
  var stripH = stripHeight(w, h, nParty);
  var btnH = short ? 44 : 48;
  var promptH = phase === "target" ? (short ? 20 : 28) : 0;
  var cardH = short ? 72 : (nParty > 1 ? 78 : 84);
  var logH = short ? 36 : 52;
  var cmdH = btnH * 3 + gap * 2;
  var strip = { x: margin, y: margin, w: w - margin * 2, h: stripH };
  var y0 = strip.y + stripH + gap;

  if (phase === "result") {
    if (land) {
      var rightW = Math.max(260, Math.min(340, Math.round(w * 0.38)));
      var stageW = w - rightW - margin * 3;
      return {
        land: true,
        strip: strip,
        stage: { x: margin, y: y0, w: stageW, h: h - y0 - margin },
        result: {
          x: margin + stageW + margin,
          y: y0,
          w: rightW,
          h: h - y0 - margin - btnH - gap,
          btnH: btnH
        }
      };
    }
    var pBtn = 48;
    var stageH = Math.max(120, Math.round(h * 0.34));
    var panelY = y0 + stageH + gap;
    return {
      land: false,
      strip: strip,
      stage: { x: 0, y: y0, w: w, h: stageH },
      result: {
        x: margin,
        y: panelY,
        w: w - margin * 2,
        h: h - margin - pBtn - gap - panelY,
        btnH: pBtn
      }
    };
  }

  var submenu = phase === "skills" || phase === "items";
  if (land) {
    var colW = Math.max(268, Math.min(360, Math.round(w * 0.4)));
    var leftW = w - colW - margin * 3;
    var stage = { x: margin, y: y0, w: leftW, h: h - y0 - margin };
    var rx = margin + leftW + margin;
    var rw = colW;
    var bottom = h - margin;
    var card = { x: rx, y: y0, w: rw, h: cardH };
    if (submenu) {
      var maxDock = Math.max(96, bottom - (card.y + cardH + gap));
      var dock = { x: rx, y: card.y + cardH + gap, w: rw, h: maxDock };
      return { land: true, strip: strip, stage: stage, card: card, dock: dock, log: null, prompt: null, commands: null };
    }
    var log = { x: rx, y: card.y + cardH + gap, w: rw, h: logH };
    var prompt = { x: rx, y: log.y + logH + (promptH ? gap : 0), w: rw, h: promptH };
    var cmdY = (promptH ? prompt.y + promptH : log.y + logH) + gap;
    var commands = { x: rx, y: cmdY, w: rw, h: cmdH, btnH: btnH, gap: gap };
    if (commands.y + cmdH > bottom) {
      var overflow = commands.y + cmdH - bottom;
      var take = Math.min(overflow, Math.max(0, log.h - 32));
      log.h -= take;
      prompt.y -= take;
      commands.y -= take;
      overflow -= take;
      if (overflow > 0) {
        var takeCard = Math.min(overflow, Math.max(0, card.h - 64));
        card.h -= takeCard;
        log.y -= takeCard;
        prompt.y -= takeCard;
        commands.y -= takeCard;
      }
      commands.y = Math.min(commands.y, bottom - cmdH);
    }
    return { land: true, strip: strip, stage: stage, card: card, log: log, prompt: prompt, commands: commands, dock: null };
  }

  var commandsP = { x: margin, y: h - margin - cmdH, w: w - margin * 2, h: cmdH, btnH: btnH, gap: gap };
  if (submenu) {
    var room = h - margin - y0 - cardH - gap * 2;
    var stageMin = 120;
    var maxDock = Math.max(120, room - stageMin);
    var dockP = { x: margin, y: h - margin - maxDock, w: w - margin * 2, h: maxDock };
    var cardP = { x: margin, y: dockP.y - gap - cardH, w: w - margin * 2, h: cardH };
    var stageP = { x: 0, y: y0, w: w, h: Math.max(80, cardP.y - gap - y0) };
    return { land: false, strip: strip, stage: stageP, card: cardP, dock: dockP, log: null, prompt: null, commands: null };
  }
  var promptP = { x: margin, y: commandsP.y - (promptH ? promptH + gap : 0), w: w - margin * 2, h: promptH };
  var above = promptH ? promptP.y : commandsP.y;
  var logP = { x: margin, y: above - gap - logH, w: w - margin * 2, h: logH };
  var cardPo = { x: margin, y: logP.y - gap - cardH, w: w - margin * 2, h: cardH };
  var stagePo = { x: 0, y: y0, w: w, h: cardPo.y - gap - y0 };
  if (stagePo.h < 150) {
    var short = 150 - stagePo.h;
    var fromLog = Math.min(short, Math.max(0, logP.h - 32));
    logP.h -= fromLog;
    logP.y += fromLog;
    cardPo.y += fromLog;
    stagePo.h += fromLog;
    short -= fromLog;
    if (short > 0) {
      var fromCard = Math.min(short, Math.max(0, cardPo.h - 70));
      cardPo.h -= fromCard;
      cardPo.y += fromCard;
      logP.y += fromCard;
      stagePo.h += fromCard;
    }
  }
  return { land: false, strip: strip, stage: stagePo, card: cardPo, log: logP, prompt: promptP, commands: commandsP, dock: null };
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
  var foes = b.actors.filter(function (a) { return a.side === "foe"; });
  var party = b.actors.filter(function (a) { return a.side === "party"; });
  var lay = layoutBattle(w, h, b.phase, party.length);
  if (b.phase !== "result") drawStrip(ctx, b, lay.strip.x, lay.strip.y, lay.strip.w, lay.strip.h);
  drawStage(ctx, b, foes, party, lay.stage, w, h);
  if (b.phase === "result") {
    drawResult(ctx, b, lay.result);
    return;
  }
  if (lay.card) drawPartyCards(ctx, b, party, lay.card.x, lay.card.y, lay.card.w, lay.card.h);
  if (lay.log) drawLog(ctx, b, lay.log.x, lay.log.y, lay.log.w, lay.log.h);
  if (b.phase === "target" && lay.prompt) drawAimLine(ctx, b, lay.prompt);
  if ((b.phase === "menu" || b.phase === "target") && lay.commands) drawCommands(ctx, b, lay.commands);
  if (b.phase === "skills" && lay.dock) drawSkillList(ctx, b, lay.dock);
  if (b.phase === "items" && lay.dock) drawItemList(ctx, b, lay.dock);
  if (b.phase === "readout") addHit("skip", 0, 0, w, h);
};

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

// The forecast stays at 8 for the turn machine. A solo strip collapses
// back-to-back copies of the hero so the label "You" is not painted four times.
function displayOrder(b) {
  var order = b.order && b.order.length ? b.order : SF.Battle.forecast(b, 8);
  var party = 0;
  var i;
  for (i = 0; i < b.actors.length; i++) if (b.actors[i].side === "party") party += 1;
  if (party !== 1) return order.slice(0, 8);
  var out = [];
  var lastId = "";
  for (i = 0; i < order.length; i++) {
    var actor = actorOf(b, order[i]);
    if (!actor) continue;
    if (actor.side === "party" && actor.id === lastId) continue;
    out.push(order[i]);
    lastId = actor.side === "party" ? actor.id : "";
    if (out.length >= 5) break;
  }
  return out.length ? out : order.slice(0, 1);
}

function drawStrip(ctx, b, x, y, w, h) {
  artWindow(ctx, x, y, w, h);
  var order = displayOrder(b);
  var n = Math.min(8, order.length || 1);
  var inset = 8;
  var slot = Math.floor((w - inset * 2) / n);
  var nameH = 15;
  var faceCap = w >= 700 ? 52 : 40;
  var faceRoom = h - nameH - 12;
  var face = Math.max(22, Math.min(faceCap, slot - 4, faceRoom));
  SF.Battle.stripFace = face;
  var i, id, actor, ox, label, gx, box;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  for (i = 0; i < n; i++) {
    id = order[i];
    actor = actorOf(b, id);
    if (!actor) continue;
    ox = x + inset + i * slot + Math.max(0, Math.floor((slot - face) / 2));
    box = face + 2;
    gx = ox - 1;
    if (gx < x + 6) {
      ox += x + 6 - gx;
      gx = ox - 1;
    }
    if (gx + box > x + w - 6) box = Math.max(face, x + w - 6 - gx);
    var portraitY = y + 6;
    if (i === 0) {
      ctx.strokeStyle = "#ffd37a";
      ctx.lineWidth = 2;
      ctx.strokeRect(gx, portraitY - 1, box, box);
    }
    drawPortrait(ctx, actor.sprite, ox, portraitY, face);
    var slotX = x + inset + i * slot;
    label = pickFitting(ctx, labelChoices(actor, b, true), Math.max(12, slot - 2), 11, 8);
    if (!label.text) continue;
    ctx.fillStyle = i === 0 ? "#ffd37a" : "#d5def2";
    ctx.font = "700 " + label.size + "px system-ui, sans-serif";
    ctx.fillText(label.text, slotX + slot / 2, portraitY + face + nameH - 1);
  }
}

function formationCells(n, zone, cols) {
  if (!(cols > 0)) cols = n <= 1 ? 1 : 2;
  cols = Math.max(1, Math.min(n, cols));
  var rows = Math.ceil(n / cols);
  var gapX = n > 1 ? 10 : 0;
  var gapY = rows > 1 ? 8 : 0;
  var cellW = (zone.w - gapX * (cols - 1)) / cols;
  var cellH = (zone.h - gapY * (rows - 1)) / rows;
  var cells = [];
  var i, row, rowCount, rowW, rowX, col;
  for (i = 0; i < n; i++) {
    row = Math.floor(i / cols);
    col = i - row * cols;
    rowCount = row === rows - 1 ? n - row * cols : cols;
    rowW = rowCount * cellW + (rowCount - 1) * gapX;
    rowX = zone.x + (zone.w - rowW) / 2;
    cells.push({
      x: rowX + col * (cellW + gapX),
      y: zone.y + row * (cellH + gapY),
      w: cellW,
      h: cellH
    });
  }
  return cells;
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w - 0.5 && a.x + a.w > b.x + 0.5 && a.y < b.y + b.h - 0.5 && a.y + a.h > b.y + 0.5;
}

function labelBox(cell, cx, top, labelH) {
  if (!labelH) return { x: cell.x, y: top, w: cell.w, h: 0 };
  var labelW = Math.max(36, cell.w - 4);
  var labelX = cell.x + 2;
  return { x: labelX, y: top - labelH, w: labelW, h: labelH };
}

function placeActors(actors, zone, side, groundY, foeCap) {
  var n = actors.length;
  if (!n || !zone || zone.w < 8 || zone.h < 8) return [];
  var labelH = side === "foe" ? 40 : 0;
  var cells = formationCells(n, zone, side === "party" ? n : 0);
  var placed = [];
  var i, actor, cell, scale, src, sw, sh, ax, ay, cx, feet, top, hit;
  var tallest = 0;
  var specs = [];
  for (i = 0; i < n; i++) {
    actor = actors[i];
    cell = cells[i];
    scale = battleScale(actor, n, zone.h, cell.w, Math.min(cell.h, zone.h), labelH);
    src = sourceSize(actor.sprite, side === "party" ? "left" : "right");
    sh = src.h * scale;
    if (sh > tallest) tallest = sh;
    specs.push({ actor: actor, cell: cell, scale: scale, src: src, sh: sh });
  }
  if (side === "party" && specs.length) {
    var tallSrc = specs[0].src.h;
    for (i = 1; i < specs.length; i++) if (specs[i].src.h > tallSrc) tallSrc = specs[i].src.h;
    var shared = partyBattleScale(tallSrc, foeCap || 0);
    var fitAll = shared;
    for (i = 0; i < specs.length; i++) {
      var cellW = Math.max(16, specs[i].cell.w - 4);
      var cellH = Math.max(16, specs[i].cell.h - 4);
      var fit = fitAll;
      while (fit > 1 && (fit * specs[i].src.w > cellW || fit * specs[i].src.h > cellH)) fit -= 1;
      if (fit < fitAll) fitAll = fit;
    }
    tallest = 0;
    for (i = 0; i < specs.length; i++) {
      specs[i].scale = fitAll;
      specs[i].sh = specs[i].src.h * fitAll;
      if (specs[i].sh > tallest) tallest = specs[i].sh;
    }
  }
  var minFeet = zone.y + labelH + tallest + 4;
  var maxFeet = zone.y + zone.h - 6;
  var feetLine = maxFeet;
  if (groundY) feetLine = Math.min(maxFeet, Math.max(minFeet, groundY));
  for (i = 0; i < n; i++) {
    actor = specs[i].actor;
    cell = specs[i].cell;
    scale = specs[i].scale;
    src = specs[i].src;
    sw = src.w * scale;
    sh = specs[i].sh;
    ax = src.ax * scale;
    ay = src.ay * scale;
    cx = cell.x + cell.w / 2;
    if (cx - ax < cell.x + 2) cx = cell.x + 2 + ax;
    if (cx - ax + sw > cell.x + cell.w - 2) cx = cell.x + cell.w - 2 - (sw - ax);
    feet = feetLine;
    top = feet - ay;
    if (labelH && top - labelH < zone.y + 2) {
      var shift = zone.y + 2 - (top - labelH);
      feet += shift;
      top += shift;
    }
    hit = { x: cx - ax, y: top, w: sw, h: sh };
    placed.push({
      actor: actor,
      scale: scale,
      src: src,
      x: cx,
      feet: feet,
      hit: hit,
      label: labelBox(cell, cx, top, labelH)
    });
  }
  var guard = 0;
  while (guard < 8) {
    var overlap = false;
    for (i = 0; i < placed.length; i++) {
      var j;
      for (j = i + 1; j < placed.length; j++) {
        if (rectsOverlap(placed[i].hit, placed[j].hit)) overlap = true;
      }
    }
    if (!overlap) break;
    guard += 1;
    for (i = 0; i < placed.length; i++) {
      var prevScale = placed[i].scale;
      placed[i].scale = Math.max(1, Math.round(prevScale * 0.82));
      if (placed[i].scale >= prevScale) placed[i].scale = Math.max(1, prevScale - 1);
      src = placed[i].src;
      scale = placed[i].scale;
      sw = src.w * scale;
      sh = src.h * scale;
      ax = src.ax * scale;
      ay = src.ay * scale;
      feet = placed[i].feet;
      top = feet - ay;
      placed[i].hit = { x: placed[i].x - ax, y: top, w: sw, h: sh };
      placed[i].label = labelBox(cells[i], placed[i].x, top, labelH);
    }
  }
  return placed;
}

// A soft ground shadow pins every fighter to the battle floor. It stays on
// the floor line even when the sprite lunges, hops, or recoils.
function drawGroundShadow(ctx, spot, dx, alpha) {
  // Stepped (pixel-art) ellipse: flat bands, no anti-aliased edge.
  // A boss plants a wider, heavier shadow so the bulk reads as weight.
  var boss = spot.actor && (spot.actor.boss || spot.actor.sprite === "cinder_maw" || spot.actor.sprite === "tidewyrm");
  var w = Math.max(12, Math.round(spot.hit.w * (boss ? 0.92 : 0.62)));
  var band = boss ? 4 : 3;
  var rows = boss ? [0.48, 0.74, 1, 0.74, 0.48] : [0.62, 1, 0.62];
  var cx = Math.round(spot.x + dx);
  var cy = Math.round(spot.feet);
  ctx.save();
  ctx.globalAlpha = alpha == null ? 1 : alpha;
  ctx.fillStyle = boss ? "rgba(8, 4, 16, 0.42)" : "rgba(10, 6, 24, 0.30)";
  var i, rw, top;
  top = cy - Math.floor(rows.length / 2) * band;
  for (i = 0; i < rows.length; i++) {
    rw = Math.round(w * rows[i] / 2) * 2;
    ctx.fillRect(cx - rw / 2, top + i * band, rw, band);
  }
  ctx.restore();
}

function drawFoeLabel(ctx, spot, battle) {
  var f = spot.actor;
  var box = spot.label;
  var hp = f.hp + "/" + f.maxHp;
  var tag = "";
  if (f.core) tag = "Core";
  else if (f.revealed && f.weak) tag = weakLabel(f.weak);
  var name = pickFitting(ctx, labelChoices(f, battle, true), Math.max(8, box.w - 2), 14, 11);
  ctx.save();
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.font = "700 " + name.size + "px system-ui, sans-serif";
  var nameW = ctx.measureText(name.text).width;
  ctx.font = "700 13px system-ui, sans-serif";
  var hpW = ctx.measureText(hp).width;
  var tagW = tag ? ctx.measureText(tag).width : 0;
  var lineW = hpW + (tag && hpW + 8 + tagW <= box.w - 2 ? 8 + tagW : 0);
  var plateW = Math.min(box.w, Math.max(nameW, lineW, 36) + 10);
  var plateX = Math.round(box.x - 4);
  var plateY = Math.round(box.y - 2);
  ctx.fillStyle = "rgba(8, 6, 16, 0.78)";
  ctx.fillRect(plateX, plateY, Math.round(plateW + 6), 40);
  ctx.beginPath();
  ctx.rect(box.x, box.y, box.w, box.h);
  ctx.clip();
  ctx.fillStyle = "#f6f2ea";
  ctx.font = "700 " + name.size + "px system-ui, sans-serif";
  ctx.fillText(name.text, box.x, box.y + 1);
  ctx.font = "700 13px system-ui, sans-serif";
  ctx.fillStyle = "#ffd5dc";
  ctx.fillText(hp, box.x, box.y + 18);
  if (tag && hpW + 8 + tagW <= box.w - 2) {
    ctx.fillStyle = "#ffd37a";
    ctx.fillText(tag, box.x + hpW + 8, box.y + 18);
  }
  ctx.restore();
  bar(ctx, box.x, box.y + 33, plateW, 4, f.maxHp ? f.hp / f.maxHp : 0, f.alive ? "#e15b6a" : "#665");
}

// The battle plate paints its floor from the same horizon as scenes.js.
// Feet go on the near floor, below that seam, and never up in the sky band.
function backdropFloor(canvasW, canvasH, stage) {
  var portrait = canvasH > canvasW;
  var horizon = Math.round(canvasH * (portrait ? 0.47 : 0.46));
  var span = Math.max(1, canvasH - horizon);
  var near = horizon + Math.round(span * 0.62);
  var low = stage.y + stage.h - 8;
  var feet = Math.min(near, low);
  if (feet <= horizon && low > horizon + 8) feet = low;
  feet = Math.max(stage.y + 16, Math.min(low, feet));
  return { horizon: horizon, feet: Math.round(feet) };
}

function fitStandingHeight(spots, minTop) {
  var i, spot, src, scale, ay, top;
  for (i = 0; i < spots.length; i++) {
    spot = spots[i];
    src = spot.src;
    scale = spot.scale;
    while (scale > 1 && spot.feet - src.ay * scale < minTop) scale -= 1;
    ay = src.ay * scale;
    top = spot.feet - ay;
    spot.scale = scale;
    spot.hit.x = spot.x - src.ax * scale;
    spot.hit.y = top;
    spot.hit.w = src.w * scale;
    spot.hit.h = src.h * scale;
  }
}

function plantFeet(spots, feet) {
  var i, spot, src, scale, ax, ay;
  for (i = 0; i < spots.length; i++) {
    spot = spots[i];
    src = spot.src;
    scale = spot.scale;
    ax = src.ax * scale;
    ay = src.ay * scale;
    spot.feet = feet;
    spot.hit.x = spot.x - ax;
    spot.hit.y = feet - ay;
    spot.hit.w = src.w * scale;
    spot.hit.h = src.h * scale;
    if (spot.label && spot.label.h) spot.label.y = spot.hit.y - spot.label.h;
  }
}

// Nameplates used to sit above the head, in the trees. Park any plate that
// crosses the sky line on the lower body instead, under the horizon.
function seatFoeLabels(spots, horizon) {
  var sky = (horizon || 0) + 4;
  spots.forEach(function (spot) {
    if (!spot.label || !spot.label.h) return;
    // Always sit the plate on the lower body. Above the head it covers the trees.
    var y = spot.hit.y + Math.round(spot.hit.h * 0.62);
    if (y < sky) y = sky;
    if (y + spot.label.h > spot.feet - 2) y = Math.max(spot.hit.y + 4, spot.feet - spot.label.h - 2);
    spot.label.y = y;
  });
}

function hitFlashAlpha(b, actor) {
  if (!b.art || !b.art.flash || b.art.flash.indexOf(actor.id) < 0) return 0;
  // Reduce flashing keeps the core glow steady and skips the white hit flash.
  if (SF.calm && SF.calm()) return 0;
  if (b.hitPause > 0) return 0.78;
  var p = animP(b);
  if (p > 0.28) return 0;
  return 0.78 * (1 - p / 0.28);
}

function drawHitFlash(ctx, b, actor, spot, nudge) {
  var alpha = hitFlashAlpha(b, actor);
  if (!(alpha > 0)) return;
  // A glint on the body. The sprite's box is mostly empty, so filling it
  // reads as a white panel instead of a hit.
  var cx = Math.round(spot.x + nudge.x);
  var cy = Math.round(spot.hit.y + spot.hit.h * 0.42 + nudge.y);
  var s = Math.max(6, Math.round(Math.min(spot.hit.w, spot.hit.h) * 0.16));
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#fff";
  ctx.fillRect(cx - s, cy - Math.round(s / 2), s * 2, s);
  ctx.fillRect(cx - Math.round(s / 2), cy - s, s, s * 2);
  ctx.restore();
}

function drawStage(ctx, b, foes, party, stage, canvasW, canvasH) {
  if (!stage) return;
  var split = party.length > 1 ? 0.56 : 0.62;
  var foeZone = {
    x: stage.x + 4,
    y: stage.y + 2,
    w: Math.max(40, Math.round(stage.w * split) - 8),
    h: Math.max(40, stage.h - 4)
  };
  var partyZone = {
    x: foeZone.x + foeZone.w + 8,
    y: stage.y + 2,
    w: Math.max(40, stage.x + stage.w - (foeZone.x + foeZone.w + 12)),
    h: foeZone.h
  };
  var floor = backdropFloor(canvasW || stage.w, canvasH || (stage.y + stage.h), stage);
  var groundY = floor.feet;
  var foeSpots = placeActors(foes, foeZone, "foe", groundY);
  var foeCap = 0;
  var smallCap = 0;
  foeSpots.forEach(function (spot) {
    var h = spot.src.h * spot.scale;
    if (!(h > 0)) return;
    if (!foeCap || h < foeCap) foeCap = h;
    if (!isBoss(spot.actor) && (!smallCap || h < smallCap)) smallCap = h;
  });
  // Boss-only fights have no wisp to measure. Use the meadow wisp height
  // so the party keeps the same scale and the same gaps as a normal battle.
  var partyRef = smallCap || meadowFoeHeight(foeZone.w, foeZone.h);
  var partySpots = placeActors(party, partyZone, "party", groundY, partyRef);
  plantFeet(foeSpots, groundY);
  plantFeet(partySpots, groundY);
  fitStandingHeight(partySpots, stage.y + 4);
  seatFoeLabels(foeSpots, floor.horizon);
  SF.Battle.partyBoxes = partySpots.map(function (spot) {
    return {
      id: spot.actor.id,
      alive: spot.actor.alive,
      x: spot.hit.x,
      y: spot.hit.y,
      w: spot.hit.w,
      h: spot.hit.h,
      feet: spot.feet
    };
  });
  SF.Battle.stand = {
    horizon: floor.horizon,
    floor: groundY,
    feet: partySpots.map(function (spot) { return spot.feet; }),
    bg: b.bg
  };
  var aiming = b.phase === "target";
  var aimFoe = aiming && b.aim !== "ally";
  var aimAlly = aiming && b.aim === "ally";
  var spots = [];
  foeSpots.forEach(function (spot) {
    var f = spot.actor;
    var nudge = actorNudge(b, f);
    var pose = battlePose(b, f);
    var canTap = aimFoe && f.alive;
    if (!f.alive && b.phase === "result") return;
    drawGroundShadow(ctx, spot, nudge.x, !f.alive ? 0.35 : (aiming && !canTap ? 0.4 : 1));
    ctx.save();
    if (!f.alive) ctx.globalAlpha = 0.35;
    else if (aiming && !canTap) ctx.globalAlpha = 0.4;
    drawSprite(ctx, f.sprite, spot.x + nudge.x, spot.feet + nudge.y, spot.scale, pose, "right");
    ctx.restore();
    drawHitFlash(ctx, b, f, spot, nudge);
    drawFoeLabel(ctx, spot, b);
    if (canTap) {
      var foePick = 0;
      foes.forEach(function (other) { if (other.alive && other !== f && foes.indexOf(other) < foes.indexOf(f)) foePick += 1; });
      var foeOn = foePick === (b.sel || 0);
      ctx.save();
      ctx.strokeStyle = foeOn ? "#ffd37a" : "rgba(255, 211, 122, 0.45)";
      ctx.lineWidth = foeOn ? 4 : 2;
      ctx.strokeRect(Math.round(spot.hit.x) - 2, Math.round(spot.hit.y) - 2, Math.round(spot.hit.w) + 4, Math.round(spot.hit.h) + 4);
      ctx.restore();
      addHit("foe:" + f.id, spot.hit.x, spot.hit.y, spot.hit.w, spot.hit.h);
    }
    spots.push({
      actor: f,
      x: spot.x + nudge.x,
      y: spot.feet + nudge.y,
      top: spot.hit.y + nudge.y
    });
  });
  partySpots.forEach(function (spot) {
    var a = spot.actor;
    var nudge = actorNudge(b, a);
    var pose = battlePose(b, a);
    // Victory used to lift the hero 10px for the whole results screen, which
    // left him hovering over the floor. The victory pose already raises the arm.
    drawGroundShadow(ctx, spot, nudge.x, a.alive ? 1 : 0.35);
    ctx.save();
    if (!a.alive) ctx.globalAlpha = 0.35;
    drawSprite(ctx, a.sprite, spot.x + nudge.x, spot.feet + nudge.y, spot.scale, pose, "left");
    ctx.restore();
    drawHitFlash(ctx, b, a, spot, nudge);
    if (aimAlly && a.alive) {
      var allyPick = 0;
      party.forEach(function (other) {
        if (other.alive && party.indexOf(other) < party.indexOf(a)) allyPick += 1;
      });
      var allyOn = allyPick === (b.sel || 0);
      ctx.save();
      ctx.strokeStyle = allyOn ? "#ffd37a" : "rgba(255, 211, 122, 0.45)";
      ctx.lineWidth = allyOn ? 4 : 2;
      ctx.strokeRect(Math.round(spot.hit.x) - 2, Math.round(spot.hit.y) - 2, Math.round(spot.hit.w) + 4, Math.round(spot.hit.h) + 4);
      ctx.restore();
      addHit("ally:" + a.id, spot.hit.x, spot.hit.y, spot.hit.w, spot.hit.h);
    }
    spots.push({
      actor: a,
      x: spot.x + nudge.x,
      y: spot.feet + nudge.y,
      top: spot.hit.y + nudge.y
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
  if (b.phase === "result") return;
  var p = animP(b);
  if (!p) return;
  var calm = SF.calm && SF.calm();
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
  if (b.phase === "result") return;
  // The sprite box has empty sky above the drawn body. Anchor callouts
  // on the body so the number sits on the target, not in the trees.
  function calloutBody(spot) {
    var feet = spot.y;
    var top = spot.top == null ? feet - 64 : spot.top;
    return top + (feet - top) * 0.42;
  }
  function paintCallout(text, x, y, fill, size) {
    ctx.font = "700 " + size + "px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillStyle = "rgba(12, 8, 20, 0.92)";
    ctx.fillText(text, x - 1, y);
    ctx.fillText(text, x + 1, y);
    ctx.fillText(text, x, y - 1);
    ctx.fillText(text, x, y + 1);
    ctx.fillStyle = fill;
    ctx.fillText(text, x, y);
  }
  var seenTag = {};
  (art.tags || []).forEach(function (tag) {
    if (!tag || seenTag[tag.id]) return;
    seenTag[tag.id] = true;
    var spot = byId[tag.id];
    if (!spot) return;
    var body = calloutBody(spot);
    var rise = calm ? 2 : Math.round(2 + 10 * p);
    var alpha = calm ? 1 : (p > 0.82 ? Math.max(0, 1 - (p - 0.82) / 0.18) : 1);
    var numSize = calm ? 34 : 40;
    ctx.save();
    ctx.globalAlpha = alpha;
    paintCallout(tag.text, spot.x, body - 6 - rise - numSize, tag.text === "WEAK" ? "#ffd37a" : "#b9d6ff", calm ? 16 : 18);
    ctx.restore();
  });
  (art.pops || []).forEach(function (pop, index) {
    var spot = byId[pop.id];
    if (!spot) return;
    var rise = calm ? 2 : Math.round(2 + 12 * p);
    var alpha = calm ? 1 : (p > 0.78 ? Math.max(0, 1 - (p - 0.78) / 0.22) : 1);
    var body = calloutBody(spot);
    var size = calm ? 34 : (p < 0.16 ? 46 : 40);
    var stack = pop.heal ? 0 : index * 6;
    ctx.save();
    ctx.globalAlpha = alpha;
    paintCallout((pop.heal ? "+" : "") + pop.text, spot.x, body - 4 - rise - stack, pop.heal ? "#7dffa8" : "#ffd37a", size);
    ctx.restore();
  });
}

function drawStatRow(ctx, tag, cur, max, x, y, w, rowH, fill, labelColor) {
  var size = Math.min(12, Math.max(9, rowH - 3));
  var text = tag + " " + cur + "/" + max;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = labelColor || "#d7e6ff";
  var mid = Math.round(y + rowH / 2);
  ctx.font = "700 " + size + "px system-ui, sans-serif";
  while (size > 9 && ctx.measureText(text).width > w - 20) {
    size -= 1;
    ctx.font = "700 " + size + "px system-ui, sans-serif";
  }
  if (ctx.measureText(text).width > w - 16) text = tag + " " + cur;
  if (ctx.measureText(text).width > w - 14) text = tag;
  var tw = Math.ceil(ctx.measureText(text).width);
  ctx.fillText(text, x, mid);
  var barW = w - tw - 4;
  if (barW >= 8) bar(ctx, x + tw + 4, mid - 3, barW, 5, max ? cur / max : 0, fill);
}

function drawPartyCards(ctx, b, party, x, y, w, h) {
  var n = party.length || 1;
  var gap = n > 2 ? 4 : 6;
  var bw = Math.floor((w - gap * (n - 1)) / n);
  party.forEach(function (a, i) {
    var cx = x + i * (bw + gap);
    artWindow(ctx, cx, y, bw, h);
    ctx.save();
    ctx.beginPath();
    ctx.rect(cx + 3, y + 3, Math.max(4, bw - 6), Math.max(4, h - 6));
    ctx.clip();
    var sideBySide = bw >= 168;
    if (sideBySide) {
      var portrait = Math.min(48, h - 16);
      drawPortrait(ctx, a.sprite, cx + 10, y + Math.round((h - portrait) / 2), portrait);
      var textX = cx + portrait + 18;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = b.actorId === a.id ? "#ffd37a" : "#f6f2ea";
      ctx.font = "700 15px Palatino, Georgia, serif";
      ctx.fillText(a.name, textX, y + 4);
      var barW = Math.max(36, cx + bw - 12 - textX);
      var labelW = Math.min(78, Math.round(barW * 0.46));
      ctx.font = "700 13px system-ui, sans-serif";
      ctx.fillStyle = "#ffd5dc";
      ctx.fillText("HP " + a.hp + "/" + a.maxHp, textX, y + 22);
      bar(ctx, textX + labelW, y + 24, Math.max(20, barW - labelW), 6, a.maxHp ? a.hp / a.maxHp : 0, "#ef6d7a");
      ctx.fillStyle = "#7eb6ff";
      ctx.fillText("SP " + a.sp + "/" + a.maxSp, textX, y + 42);
      bar(ctx, textX + labelW, y + 44, Math.max(20, barW - labelW), 6, a.maxSp ? a.sp / a.maxSp : 0, "#7eb6ff");
    } else {
      var pad = 4;
      var face = Math.max(16, Math.min(26, h - 38, bw - 40));
      drawPortrait(ctx, a.sprite, cx + pad, y + pad, face);
      var nameX = cx + pad + face + 4;
      var nameW = Math.max(12, cx + bw - pad - nameX);
      var choices = [a.name].concat(labelChoices(a, b, true));
      var name = pickFitting(ctx, choices, nameW, 13, 9);
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillStyle = b.actorId === a.id ? "#ffd37a" : "#f6f2ea";
      ctx.font = "700 " + name.size + "px Palatino, Georgia, serif";
      ctx.fillText(name.text, nameX, y + pad + face / 2);
      var statTop = y + pad + face + 2;
      var statH = Math.max(11, Math.floor((y + h - pad - statTop) / 2));
      drawStatRow(ctx, "HP", a.hp, a.maxHp, cx + pad, statTop, bw - pad * 2, statH, "#ef6d7a", "#ffd5dc");
      drawStatRow(ctx, "SP", a.sp, a.maxSp, cx + pad, statTop + statH, bw - pad * 2, statH, "#7eb6ff", "#7eb6ff");
    }
    ctx.restore();
    if (b.phase === "target" && b.aim === "ally" && a.alive) {
      ctx.strokeStyle = "#ffd37a";
      ctx.lineWidth = 3;
      ctx.strokeRect(cx + 3, y + 3, bw - 6, h - 6);
      addHit("ally:" + a.id, cx, y, bw, h);
    }
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
  var lineH = Math.max(12, Math.floor((h - 8) / Math.max(1, lines.length)));
  var fontPx = Math.min(14, Math.max(11, lineH - 1));
  ctx.save();
  ctx.beginPath();
  ctx.rect(x + 6, y + 3, Math.max(8, w - 12), Math.max(8, h - 6));
  ctx.clip();
  ctx.fillStyle = "#f6f2ea";
  ctx.font = "700 " + fontPx + "px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  lines.forEach(function (line, i) {
    ctx.fillText(line, x + 8, y + 4 + i * lineH);
  });
  ctx.restore();
}

function aimPrompt(b) {
  var touch = false;
  if (SF.touchPrimary && SF.touchPrimary()) touch = true;
  else if (typeof document !== "undefined" && document.body && document.body.dataset.touch === "1") touch = true;
  if (b && b.aim === "ally") return touch ? "Tap an ally." : "Choose an ally.";
  return touch ? "Tap a foe." : "Choose a target.";
}
SF.Battle.aimLine = aimPrompt;

function drawAimLine(ctx, b, rect) {
  if (!rect || rect.h < 8) return;
  ctx.save();
  ctx.fillStyle = "rgba(8, 16, 40, 0.82)";
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeStyle = "rgba(255, 211, 122, 0.9)";
  ctx.lineWidth = 2;
  ctx.strokeRect(rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2);
  ctx.fillStyle = "#ffd37a";
  ctx.font = "700 14px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(aimPrompt(b), rect.x + rect.w / 2, rect.y + rect.h / 2);
  ctx.restore();
}

function drawCommands(ctx, b, box) {
  var dim = b.phase === "target";
  var labels = [
    ["attack", "Attack"],
    ["skill", "Skill"],
    ["item", "Item"],
    ["defend", "Defend"]
  ];
  var colW = Math.floor((box.w - box.gap) / 2);
  var i, cx, cy;
  for (i = 0; i < 4; i++) {
    cx = box.x + (i % 2) * (colW + box.gap);
    cy = box.y + Math.floor(i / 2) * (box.btnH + box.gap);
    button(ctx, cx, cy, colW, box.btnH, labels[i][1], !dim && b.sel === i, dim);
    if (!dim) addHit("cmd:" + labels[i][0], cx, cy, colW, box.btnH);
  }
  cy = box.y + 2 * (box.btnH + box.gap);
  if (dim) {
    button(ctx, box.x, cy, box.w, box.btnH, "Cancel", true, false);
    addHit("cancel", box.x, cy, box.w, box.btnH);
  } else {
    button(ctx, box.x, cy, box.w, box.btnH, b.canFlee ? "Flee" : "Cannot flee", b.canFlee && b.sel === 4, !b.canFlee);
    if (b.canFlee) addHit("cmd:flee", box.x, cy, box.w, box.btnH);
  }
}

function fitLine(ctx, text, maxW) {
  var t = text || "";
  if (ctx.measureText(t).width <= maxW) return t;
  while (t.length > 1 && ctx.measureText(t + "…").width > maxW) t = t.slice(0, -1);
  return t ? t + "…" : "";
}

function chevron(ctx, cx, cy, dir) {
  ctx.beginPath();
  if (dir > 0) {
    ctx.moveTo(cx - 10, cy - 4);
    ctx.lineTo(cx + 10, cy - 4);
    ctx.lineTo(cx, cy + 7);
  } else {
    ctx.moveTo(cx - 10, cy + 4);
    ctx.lineTo(cx + 10, cy + 4);
    ctx.lineTo(cx, cy - 7);
  }
  ctx.closePath();
  ctx.fill();
}

function drawScrollCue(ctx, box, up, down) {
  var cx = Math.round(box.x + box.w / 2);
  ctx.save();
  if (up) {
    ctx.fillStyle = "rgba(8, 16, 40, 0.82)";
    ctx.fillRect(box.x + 6, box.y + 4, box.w - 12, 18);
    ctx.fillStyle = "#ffd37a";
    chevron(ctx, cx, box.y + 13, -1);
  }
  if (down) {
    ctx.fillStyle = "rgba(8, 16, 40, 0.86)";
    ctx.fillRect(box.x + 6, box.y + box.h - 22, box.w - 12, 18);
    ctx.fillStyle = "#ffd37a";
    chevron(ctx, cx, box.y + box.h - 13, 1);
  }
  ctx.restore();
}

function drawListPanel(ctx, b, dock, rows, emptyText, idOf, labelOf, rowDim, descOf) {
  var gap = 4;
  var backH = 42;
  var x = dock.x;
  var btnW = dock.w;
  var showDesc = typeof descOf === "function" && rows.length > 0;
  var descH = showDesc ? 34 : 0;
  var backY = dock.y + dock.h - backH;
  var plateBottom = backY - gap;
  var descY = showDesc ? plateBottom - descH : plateBottom;
  var listTop = dock.y;
  var listH = Math.max(36, (showDesc ? descY : plateBottom) - listTop);
  var minBtn = 32;
  var maxBtn = 46;
  var btnH = minBtn;
  if (rows.length) {
    var fitAtMin = Math.max(1, Math.floor((listH + gap) / (minBtn + gap)));
    if (rows.length <= fitAtMin) {
      var roomy = Math.floor((listH - gap * Math.max(0, rows.length - 1)) / rows.length);
      btnH = Math.max(minBtn, Math.min(maxBtn, roomy));
    }
  }
  var stride = btnH + gap;
  var visible = Math.max(1, Math.floor((listH + gap) / stride));
  if (rows.length) visible = Math.min(visible, rows.length);
  var maxScroll = Math.max(0, rows.length - visible);
  var sel = b.sel || 0;
  if (sel < 0) sel = 0;
  if (rows.length && sel > rows.length - 1) sel = rows.length - 1;
  b.sel = sel;
  var scroll = b.listScroll || 0;
  if (b._followSel) {
    if (rows.length && sel < scroll) scroll = sel;
    if (rows.length && sel >= scroll + visible) scroll = sel - visible + 1;
    b._followSel = false;
  }
  if (scroll < 0) scroll = 0;
  if (scroll > maxScroll) scroll = maxScroll;
  b.listScroll = scroll;
  b._visible = visible;
  b._rows = rows.map(idOf);
  b._stride = stride;
  b._listBox = { x: x, y: listTop, w: btnW, h: listH };
  b._moreAbove = scroll > 0;
  b._moreBelow = scroll + visible < rows.length;
  b._empty = rows.length ? "" : emptyText;
  b._desc = "";
  var plateH = Math.max(36, plateBottom - listTop);
  artWindow(ctx, x, listTop, btnW, plateH);
  if (!rows.length) {
    ctx.save();
    ctx.fillStyle = "#f4f7ff";
    ctx.font = "700 16px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(emptyText, x + btnW / 2, listTop + Math.max(18, listH / 2));
    ctx.restore();
  }
  ctx.save();
  ctx.beginPath();
  ctx.rect(x + 4, listTop + 4, Math.max(8, btnW - 8), Math.max(8, listH - 8));
  ctx.clip();
  var i;
  for (i = 0; i < rows.length; i++) {
    if (i < scroll || i >= scroll + visible) continue;
    var cy = listTop + (i - scroll) * stride;
    var dim = rowDim ? !!rowDim(rows[i]) : false;
    button(ctx, x + 8, cy + 2, btnW - 16, Math.max(28, btnH - 2), labelOf(rows[i]), i === sel, dim);
    addHit(idOf(rows[i]), x + 8, cy + 2, btnW - 16, Math.max(28, btnH - 2));
  }
  ctx.restore();
  if (b._moreAbove || b._moreBelow) drawScrollCue(ctx, b._listBox, b._moreAbove, b._moreBelow);
  if (showDesc) {
    var picked = rows[sel];
    var desc = picked ? (descOf(picked) || "") : "";
    b._desc = desc;
    b._descBox = { x: x, y: descY, w: btnW, h: descH };
    ctx.save();
    ctx.strokeStyle = "rgba(196, 220, 255, 0.45)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 12, descY);
    ctx.lineTo(x + btnW - 12, descY);
    ctx.stroke();
    ctx.fillStyle = "#d7e6ff";
    ctx.font = "700 13px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(fitLine(ctx, desc, btnW - 24), x + 12, descY + descH / 2);
    ctx.restore();
  }
  button(ctx, x, backY, btnW, backH, "Back", false, false);
  addHit("back", x, backY, btnW, backH);
}

function drawSkillList(ctx, b, dock) {
  var actor = actorOf(b, b.actorId);
  var skills = (actor ? actor.skills : []).map(function (id) { return SF.SKILLS[id]; }).filter(Boolean);
  drawListPanel(ctx, b, dock, skills, "No skills.", function (sk) { return "skill:" + sk.id; }, function (sk) {
    return sk.name + "  " + sk.sp + " SP";
  }, function (sk) {
    return !!(sk.sp && actor && actor.sp < sk.sp);
  }, function (sk) {
    return sk.desc || "";
  });
}

function battleItems(b) {
  var rows = [];
  var inv = (SF.state && SF.state.inventory) || {};
  var hideFlee = !!(b && (b.boss || b.canFlee === false));
  Object.keys(inv).forEach(function (id) {
    var it = SF.ITEMS[id];
    if (!it || it.kind !== "item" || !(inv[id] > 0)) return;
    if (hideFlee && it.flee) return;
    rows.push(it);
  });
  return rows;
}

function drawItemList(ctx, b, dock) {
  var rows = battleItems(b);
  drawListPanel(ctx, b, dock, rows, "No items.", function (it) { return "item:" + it.id; }, function (it) {
    return it.name + " x" + (SF.state.inventory[it.id] || 0);
  }, null, null);
}

function resultLines(row) {
  var lines = [];
  if (row.fled) {
    lines.push({ text: "Back on the road.", color: "#f4f7ff" });
    return lines;
  }
  if (!row.win) {
    lines.push({ text: "The party is at half HP.", color: "#f4f7ff" });
    return lines;
  }
  lines.push({ text: "+" + (row.xp || 0) + " XP    +" + (row.gold || 0) + " Marks", color: "#f4f7ff" });
  (row.items || []).forEach(function (name) {
    lines.push({ text: name, color: "#f4f7ff" });
  });
  (row.levels || []).forEach(function (lv) {
    lines.push({ text: lv.name + " reached Lv " + lv.level, color: "#ffd37a" });
    if (lv.skill) lines.push({ text: "Learned " + lv.skill, color: "#f4f7ff" });
  });
  return lines;
}

function drawResult(ctx, b, panel) {
  var row = b.result || {};
  var x = panel.x;
  var y = panel.y;
  var panelW = panel.w;
  var panelH = Math.max(48, panel.h);
  var btnH = panel.btnH || 48;
  var lines = resultLines(row);
  var title = row.fled ? "Got away" : (row.win ? "Victory" : "Defeat");
  var titleSize = 28;
  var bodySize = 16;
  var cardH = 18 + titleSize + 8 + lines.length * 24 + 12;
  if (cardH > panelH) cardH = panelH;
  if (cardH < 72) cardH = Math.min(panelH, 72);
  artWindow(ctx, x, y, panelW, cardH);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x + 8, y + 6, panelW - 16, cardH - 12);
  ctx.clip();
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#ffd37a";
  ctx.font = "700 " + titleSize + "px system-ui, sans-serif";
  ctx.fillText(title, x + 16, y + 12);
  var ly = y + 12 + titleSize + 6;
  var limit = y + cardH - 8;
  lines.forEach(function (line) {
    if (ly + bodySize > limit) return;
    ctx.fillStyle = line.color;
    ctx.font = "700 " + bodySize + "px system-ui, sans-serif";
    ctx.fillText(line.text, x + 16, ly);
    ly += 24;
  });
  ctx.restore();
  // Continue stays at the bottom of the column so a thumb can reach it.
  var by = y + panelH + 8;
  button(ctx, x, by, panelW, btnH, "Continue", true, false);
  addHit("result", x, by, panelW, btnH);
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

function menuCount(b) {
  return b && b.canFlee ? 5 : 4;
}

function livingTargets(b) {
  var side = b && b.aim === "ally" ? "party" : "foe";
  var out = [];
  if (!b) return out;
  b.actors.forEach(function (a) {
    if (a.side === side && a.alive) out.push(a);
  });
  return out;
}

function listIds(b) {
  if (!b) return [];
  if (b.phase === "skills") {
    var actor = actorOf(b, b.actorId);
    return (actor ? actor.skills : []).filter(function (id) { return SF.SKILLS[id]; }).map(function (id) {
      return "skill:" + id;
    });
  }
  if (b.phase === "items") return battleItems(b).map(function (it) { return "item:" + it.id; });
  return [];
}

SF.Battle.moveSel = function (dir) {
  var b = SF.state && SF.state.battle;
  if (!b || b.phase === "readout" || b.phase === "result" || b.phase === "done") return;
  var n = 0;
  if (b.phase === "menu") n = menuCount(b);
  else if (b.phase === "skills" || b.phase === "items") n = listIds(b).length;
  else if (b.phase === "target") n = livingTargets(b).length;
  if (n < 1) return;
  var sel = (b.sel || 0) + dir;
  sel = ((sel % n) + n) % n;
  b.sel = sel;
  b._followSel = true;
};

SF.Battle.confirm = function () {
  var b = SF.state && SF.state.battle;
  if (!b) return;
  if (b.phase === "readout") {
    SF.Battle.skipReadout();
    return;
  }
  if (b.phase === "result") {
    SF.Battle.confirmResult();
    return;
  }
  if (b.phase === "menu") {
    var cmds = ["attack", "skill", "item", "defend", "flee"];
    var i = b.sel || 0;
    if (i < 0 || i >= menuCount(b)) return;
    var hits = SF.Battle.hits || [];
    var want = "cmd:" + cmds[i];
    var found = null;
    hits.forEach(function (h) { if (h.id === want) found = h; });
    if (found) SF.Battle.onPointer(found.x + 4, found.y + 4);
    else SF.Battle.activate(want);
    return;
  }
  if (b.phase === "skills" || b.phase === "items") {
    var rows = listIds(b);
    var sel = b.sel || 0;
    if (sel < 0 || sel >= rows.length) return;
    SF.Battle.activate(rows[sel]);
    return;
  }
  if (b.phase === "target") {
    var list = livingTargets(b);
    var t = list[b.sel || 0];
    if (!t) return;
    SF.Battle.activate((b.aim === "ally" ? "ally:" : "foe:") + t.id);
  }
};

SF.Battle.cancel = function () {
  var b = SF.state && SF.state.battle;
  if (!b) return;
  if (b.phase === "skills" || b.phase === "items" || b.phase === "target") {
    b.phase = "menu";
    b.pending = null;
    b.sel = 0;
    b.listScroll = 0;
  }
};

SF.Battle.activate = function (id) {
  var s = SF.state;
  var b = s && s.battle;
  if (!b || !id) return;
  if (window.Sfx) Sfx.play("ui");
  if (b.phase === "readout") {
    SF.Battle.skipReadout();
    return;
  }
  if (b.phase === "result") {
    if (id === "result" || id === "skip") SF.Battle.confirmResult();
    return;
  }
  if (id === "back" || id === "cancel") {
    SF.Battle.cancel();
    return;
  }
  if (b.phase === "menu" && id.indexOf("cmd:") === 0) {
    var cmd = id.slice(4);
    if (cmd === "attack") {
      b.pending = { type: "skill", skillId: "attack" };
      b.aim = "foe";
      b.phase = "target";
      b.sel = 0;
    } else if (cmd === "skill") {
      b.phase = "skills";
      b.sel = 0;
      b.listScroll = 0;
    } else if (cmd === "item") {
      b.phase = "items";
      b.sel = 0;
      b.listScroll = 0;
    } else if (cmd === "defend") SF.Battle.playerAct({ type: "defend" });
    else if (cmd === "flee" && b.canFlee) SF.Battle.playerAct({ type: "flee" });
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
    b.sel = 0;
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
    b.sel = 0;
    return;
  }
  if (b.phase === "target") {
    var tid = "";
    if (b.aim === "ally" && id.indexOf("ally:") === 0) tid = id.slice(5);
    if (b.aim !== "ally" && id.indexOf("foe:") === 0) tid = id.slice(4);
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

SF.Battle.onPointer = function (x, y) {
  var s = SF.state;
  var b = s && s.battle;
  if (!b) return;
  var id = pick(x, y);
  if (b.phase === "readout") {
    if (window.Sfx) Sfx.play("ui");
    SF.Battle.skipReadout();
    return;
  }
  if (!id) return;
  SF.Battle.activate(id);
};

SF.Battle.readPad = function (b) {
  if (!b || !SF.pollGamepad || !SF.inputState) return;
  var mode = SF.state && SF.state.mode;
  if (mode !== "battle" && mode !== "results") return;
  SF.pollGamepad();
  var i = SF.inputState;
  var ax = i.padX || 0;
  var ay = i.padY || 0;
  var vert = ay < -0.45 ? -1 : (ay > 0.45 ? 1 : 0);
  var horiz = ax < -0.45 ? -1 : (ax > 0.45 ? 1 : 0);
  if (vert && vert !== b._padV) SF.Battle.moveSel(vert);
  if (horiz && horiz !== b._padH) SF.Battle.moveSel(horiz);
  b._padV = vert;
  b._padH = horiz;
  if (i.padA) {
    if (!b.padHoldSince) b.padHoldSince = SF.BattleFeel && SF.BattleFeel.now ? SF.BattleFeel.now() : Date.now();
  } else {
    b.padHoldSince = 0;
  }
  if (i.padAEdge) {
    i.padAEdge = false;
    SF.Battle.confirm();
  }
  if (i.padBEdge || i.padXEdge) {
    i.padBEdge = false;
    i.padXEdge = false;
    SF.Battle.cancel();
  }
};

SF.Battle.itemRows = battleItems;

function bindBattlePointer() {
  if (typeof document === "undefined") return;
  var view = document.getElementById("view");
  if (!view || view.dataset.battleBound) return;
  view.dataset.battleBound = "1";
  var drag = null;
  function toView(e) {
    var rect = view.getBoundingClientRect();
    var sx = rect.width ? (SF.viewW || rect.width) / rect.width : 1;
    var sy = rect.height ? (SF.viewH || rect.height) / rect.height : 1;
    return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
  }
  view.addEventListener("pointerdown", function (e) {
    var s = SF.state;
    if (!s || (s.mode !== "battle" && s.mode !== "results")) return;
    if (e.button != null && e.button !== 0) return;
    var pt = toView(e);
    var b = s.battle;
    var box = b && b._listBox;
    drag = {
      x: pt.x,
      y: pt.y,
      pointerId: e.pointerId,
      scroll: b ? (b.listScroll || 0) : 0,
      list: !!(box && pt.x >= box.x && pt.y >= box.y && pt.x <= box.x + box.w && pt.y <= box.y + box.h),
      moved: false
    };
    if (b) {
      b.pointerHoldSince = SF.BattleFeel && SF.BattleFeel.now ? SF.BattleFeel.now() : Date.now();
      b._holdSkips = 0;
    }
    try { view.setPointerCapture(e.pointerId); } catch (err) { /* canvas may already own it */ }
    e.preventDefault();
  });
  view.addEventListener("pointermove", function (e) {
    if (!drag || e.pointerId !== drag.pointerId || !drag.list) return;
    var s = SF.state;
    var b = s && s.battle;
    if (!b) return;
    var pt = toView(e);
    var dy = pt.y - drag.y;
    if (Math.abs(dy) > 8 || Math.abs(pt.x - drag.x) > 8) drag.moved = true;
    var stride = b._stride || 48;
    var next = drag.scroll - Math.round(dy / stride);
    if (next < 0) next = 0;
    b.listScroll = next;
    b._followSel = false;
    e.preventDefault();
  });
  function endDrag(e) {
    if (!drag || (e && drag.pointerId != null && e.pointerId !== drag.pointerId)) return;
    var start = drag;
    drag = null;
    var s = SF.state;
    if (!s || (s.mode !== "battle" && s.mode !== "results") || !e) return;
    var pt = toView(e);
    var moved = start.moved || Math.abs(pt.y - start.y) > 10 || Math.abs(pt.x - start.x) > 10;
    var skips = 0;
    if (s.battle) {
      skips = s.battle._holdSkips || 0;
      s.battle.pointerHoldSince = 0;
      s.battle._holdSkips = 0;
    }
    // A hold already fast-forwarded the readout. Don't also tap whatever is under the finger now.
    if (moved || skips) return;
    SF.Battle.onPointer(pt.x, pt.y);
  }
  view.addEventListener("pointerup", endDrag);
  view.addEventListener("pointercancel", function () {
    drag = null;
    var s = SF.state;
    if (s && s.battle) s.battle.pointerHoldSince = 0;
  });
  window.addEventListener("keydown", function (e) {
    var s = SF.state;
    if (!s || (s.mode !== "battle" && s.mode !== "results") || !s.battle) return;
    var code = e.code;
    var confirm = code === "Enter" || code === "Space" || code === "KeyE" || code === "KeyZ";
    var cancel = code === "Escape" || code === "KeyX";
    var arrow = code === "ArrowUp" || code === "ArrowDown" || code === "ArrowLeft" || code === "ArrowRight";
    if (!confirm && !cancel && !arrow && code.indexOf("Digit") !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    if (confirm && !s.battle.keyHoldSince) {
      s.battle.keyHoldSince = SF.BattleFeel && SF.BattleFeel.now ? SF.BattleFeel.now() : Date.now();
    }
    if (e.repeat && !arrow) return;
    if (arrow) SF.Battle.moveSel(code === "ArrowUp" || code === "ArrowLeft" ? -1 : 1);
    else if (confirm) SF.Battle.confirm();
    else if (cancel) SF.Battle.cancel();
  }, true);
  window.addEventListener("keyup", function (e) {
    var s = SF.state;
    var b = s && s.battle;
    if (!b) return;
    var code = e.code;
    if (code === "Enter" || code === "Space" || code === "KeyE" || code === "KeyZ") b.keyHoldSince = 0;
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

// BattleUI draws from the event record. It does not wrap resolve or diff HP.
SF.BattleUI = {
  draw: function (ctx, w, h, dpr) { SF.drawBattle(ctx, w, h, dpr); }
};

bindBattlePointer();
if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bindBattlePointer);
}
})();
