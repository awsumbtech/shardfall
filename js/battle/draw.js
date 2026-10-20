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
  return Math.round(scale * 4) / 4;
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

function button(ctx, x, y, w, h, label, on, dim) {
  ctx.save();
  if (dim) ctx.globalAlpha = 0.55;
  artWindow(ctx, x, y, w, h);
  if (on) {
    ctx.strokeStyle = "#ffd37a";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);
  }
  ctx.fillStyle = "#f4f7ff";
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

function contentDockH(rows, maxH) {
  var btnH = 48;
  var gap = 6;
  var backH = 48;
  var body = rows > 0 ? rows * (btnH + gap) - gap : 36;
  var h = body + gap + backH;
  if (maxH > 0 && h > maxH) h = maxH;
  return Math.max(backH, h);
}

function listRowCount(b) {
  if (!b) return 0;
  if (b.phase === "skills") {
    var actor = actorOf(b, b.actorId);
    var skills = actor && actor.skills ? actor.skills : [];
    var n = 0;
    skills.forEach(function (id) { if (SF.SKILLS && SF.SKILLS[id]) n += 1; });
    return n;
  }
  if (b.phase === "items") {
    var count = 0;
    var inv = (SF.state && SF.state.inventory) || {};
    Object.keys(inv).forEach(function (id) {
      var it = SF.ITEMS && SF.ITEMS[id];
      if (it && it.kind === "item" && inv[id] > 0) count += 1;
    });
    return count;
  }
  return 0;
}

function layoutBattle(w, h, phase, nParty, listRows) {
  var land = w > h;
  var short = h <= 400;
  var margin = short ? 6 : 8;
  var gap = short ? 4 : 6;
  var stripH = short ? 36 : 50;
  var btnH = short ? 36 : 48;
  var promptH = phase === "target" ? (short ? 22 : 28) : 0;
  var cardH = short ? (nParty > 1 ? 56 : 64) : (nParty > 1 ? 78 : 84);
  var logH = short ? 40 : 52;
  var cmdH = btnH * 3 + gap * 2;
  listRows = listRows || 0;
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
      var maxDock = bottom - (card.y + cardH + gap);
      var dockH = contentDockH(listRows, maxDock);
      var dock = { x: rx, y: card.y + cardH + gap, w: rw, h: dockH };
      return { land: true, strip: strip, stage: stage, card: card, dock: dock, log: null, prompt: null, commands: null };
    }
    var log = { x: rx, y: card.y + cardH + gap, w: rw, h: logH };
    var prompt = { x: rx, y: log.y + logH + (promptH ? gap : 0), w: rw, h: promptH };
    var cmdY = (promptH ? prompt.y + promptH : log.y + logH) + gap;
    var commands = { x: rx, y: cmdY, w: rw, h: cmdH, btnH: btnH, gap: gap };
    if (commands.y + cmdH > bottom) {
      var overflow = commands.y + cmdH - bottom;
      var take = Math.min(overflow, Math.max(0, log.h - 36));
      log.h -= take;
      prompt.y -= take;
      commands.y -= take;
      overflow -= take;
      if (overflow > 0) {
        var takeCard = Math.min(overflow, Math.max(0, card.h - 68));
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
    var maxDock = Math.max(96, room - stageMin);
    var dockH = contentDockH(listRows, maxDock);
    var dockP = { x: margin, y: h - margin - dockH, w: w - margin * 2, h: dockH };
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
    var fromLog = Math.min(short, Math.max(0, logP.h - 36));
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
  var lay = layoutBattle(w, h, b.phase, party.length, listRowCount(b));
  drawStrip(ctx, b, lay.strip.x, lay.strip.y, lay.strip.w, lay.strip.h);
  drawStage(ctx, b, foes, party, lay.stage, h);
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
  brumekin: "Brume",
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
  brumekin: "Brume",
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

function drawStrip(ctx, b, x, y, w, h) {
  artWindow(ctx, x, y, w, h);
  var order = b.order && b.order.length ? b.order : SF.Battle.forecast(b, 8);
  var n = Math.min(8, order.length || 1);
  var inset = 12;
  var slot = Math.floor((w - inset * 2) / n);
  var face = Math.max(18, Math.min(24, slot - 8, h - 26));
  var i, id, actor, ox, label, gx, box;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  for (i = 0; i < n; i++) {
    id = order[i];
    actor = actorOf(b, id);
    if (!actor) continue;
    ox = x + inset + i * slot + Math.max(0, Math.floor((slot - face) / 2));
    box = face + 4;
    gx = ox - 2;
    if (gx < x + 10) {
      ox += x + 10 - gx;
      gx = ox - 2;
    }
    if (gx + box > x + w - 8) box = Math.max(face, x + w - 8 - gx);
    if (i === 0) {
      ctx.strokeStyle = "#ffd37a";
      ctx.lineWidth = 2;
      ctx.strokeRect(gx, y + 6, box, box);
    }
    drawPortrait(ctx, actor.sprite, ox, y + 8, face);
    var slotX = x + inset + i * slot;
    label = pickFitting(ctx, labelChoices(actor, b, false), Math.max(12, slot - 4), 12, 9);
    if (!label.text) continue;
    ctx.save();
    ctx.beginPath();
    ctx.rect(slotX, y + h - 16, slot, 15);
    ctx.clip();
    ctx.fillStyle = i === 0 ? "#ffd37a" : "#d5def2";
    ctx.font = "700 " + label.size + "px system-ui, sans-serif";
    ctx.fillText(label.text, slotX + slot / 2, y + h - 6);
    ctx.restore();
  }
}

function formationCells(n, zone) {
  var cols = n <= 1 ? 1 : 2;
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

function placeActors(actors, zone, side, groundY) {
  var n = actors.length;
  if (!n || !zone || zone.w < 8 || zone.h < 8) return [];
  var labelH = side === "foe" ? 40 : 0;
  var cells = formationCells(n, zone);
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
  while (guard < 5) {
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
      placed[i].scale = Math.max(0.5, Math.round(placed[i].scale * 0.82 * 4) / 4);
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

function drawFoeLabel(ctx, spot, battle) {
  var f = spot.actor;
  var box = spot.label;
  var hp = f.hp + "/" + f.maxHp;
  var tag = "";
  if (f.core) tag = "Core";
  else if (f.revealed && f.weak) tag = weakLabel(f.weak);
  var name = pickFitting(ctx, labelChoices(f, battle, true), Math.max(8, box.w - 2), 14, 11);
  ctx.save();
  ctx.beginPath();
  ctx.rect(box.x, box.y, box.w, box.h);
  ctx.clip();
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillStyle = "#f6f2ea";
  ctx.font = "700 " + name.size + "px system-ui, sans-serif";
  ctx.fillText(name.text, box.x, box.y + 1);
  ctx.font = "700 13px system-ui, sans-serif";
  ctx.fillStyle = "#ffd5dc";
  var hpW = ctx.measureText(hp).width;
  ctx.fillText(hp, box.x, box.y + 18);
  if (tag && hpW + 8 + ctx.measureText(tag).width <= box.w - 2) {
    ctx.fillStyle = "#ffd37a";
    ctx.fillText(tag, box.x + hpW + 8, box.y + 18);
  }
  ctx.restore();
  bar(ctx, box.x, box.y + 33, box.w, 4, f.maxHp ? f.hp / f.maxHp : 0, f.alive ? "#e15b6a" : "#665");
}

function drawStage(ctx, b, foes, party, stage, canvasH) {
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
  var groundY = Math.round((canvasH || (stage.y + stage.h)) * 0.68);
  var foeSpots = placeActors(foes, foeZone, "foe", groundY);
  var partySpots = placeActors(party, partyZone, "party", groundY);
  if (foeSpots.length && partySpots.length) {
    var ground = foeSpots[0].feet;
    var pi;
    for (pi = 1; pi < foeSpots.length; pi++) if (foeSpots[pi].feet > ground) ground = foeSpots[pi].feet;
    partySpots.forEach(function (spot) {
      var delta = ground - spot.feet;
      spot.feet += delta;
      spot.hit.y += delta;
    });
  }
  var aiming = b.phase === "target";
  var aimFoe = aiming && b.aim !== "ally";
  var aimAlly = aiming && b.aim === "ally";
  var spots = [];
  foeSpots.forEach(function (spot) {
    var f = spot.actor;
    var nudge = actorNudge(b, f);
    var pose = battlePose(b, f);
    var canTap = aimFoe && f.alive;
    ctx.save();
    if (!f.alive) ctx.globalAlpha = 0.35;
    else if (aiming && !canTap) ctx.globalAlpha = 0.4;
    drawSprite(ctx, f.sprite, spot.x + nudge.x, spot.feet + nudge.y, spot.scale, pose, "right");
    ctx.restore();
    drawFoeLabel(ctx, spot, b);
    if (canTap) {
      ctx.save();
      ctx.strokeStyle = "#ffd37a";
      ctx.lineWidth = 3;
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
    if (pose === "victory") nudge.y -= 10;
    ctx.save();
    if (!a.alive) ctx.globalAlpha = 0.35;
    drawSprite(ctx, a.sprite, spot.x + nudge.x, spot.feet + nudge.y, spot.scale, pose, "left");
    ctx.restore();
    if (aimAlly && a.alive) {
      ctx.save();
      ctx.strokeStyle = "#ffd37a";
      ctx.lineWidth = 3;
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
    var rise = calm ? 16 : Math.round(22 + 30 * p);
    var alpha = calm ? 1 : (p > 0.78 ? Math.max(0, 1 - (p - 0.78) / 0.22) : 1);
    var top = spot.top == null ? spot.y - 96 : spot.top;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = pop.heal ? "#7dffa8" : "#ffd37a";
    ctx.font = "700 28px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText((pop.heal ? "+" : "") + pop.text, spot.x, top - 18 - rise);
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
    var textX = cx + portrait + 18;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = b.actorId === a.id ? "#ffd37a" : "#f6f2ea";
    ctx.font = "700 16px Palatino, Georgia, serif";
    ctx.fillText(a.name, textX, y + 6);
    var barW = Math.max(36, cx + bw - 12 - textX);
    ctx.font = "700 14px system-ui, sans-serif";
    ctx.fillStyle = "#d7e6ff";
    ctx.fillText("HP " + a.hp + "/" + a.maxHp, textX, y + 26);
    bar(ctx, textX, y + 44, barW, 6, a.maxHp ? a.hp / a.maxHp : 0, "#ef6d7a");
    ctx.fillText("SP " + a.sp + "/" + a.maxSp, textX, y + 54);
    bar(ctx, textX, y + h - 12, barW, 5, a.maxSp ? a.sp / a.maxSp : 0, "#7eb6ff");
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
  ctx.save();
  ctx.beginPath();
  ctx.rect(x + 8, y + 6, Math.max(8, w - 16), Math.max(8, h - 12));
  ctx.clip();
  ctx.fillStyle = "#f6f2ea";
  ctx.font = "700 14px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  lines.forEach(function (line, i) {
    ctx.fillText(line, x + 12, y + 8 + i * 20);
  });
  ctx.restore();
}

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
  ctx.fillText(b.aim === "ally" ? "Tap an ally." : "Tap a foe.", rect.x + rect.w / 2, rect.y + rect.h / 2);
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
    button(ctx, box.x, cy, box.w, box.btnH, b.canFlee ? "Flee" : "Cannot flee", b.sel === 4, false);
    addHit("cmd:flee", box.x, cy, box.w, box.btnH);
  }
}

function drawListPanel(ctx, dock, rows, emptyText, idOf, labelOf) {
  var btnH = 48;
  var gap = 6;
  var backH = 48;
  var x = dock.x;
  var btnW = dock.w;
  var y = dock.y;
  var body = rows.length ? rows.length * (btnH + gap) - gap : 36;
  var backY = y + body + gap;
  if (backY + backH > dock.y + dock.h) backY = dock.y + dock.h - backH;
  if (!rows.length) {
    ctx.fillStyle = "#f4f7ff";
    ctx.font = "700 16px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(emptyText, x + btnW / 2, y + 18);
  }
  rows.forEach(function (row, i) {
    var cy = y + i * (btnH + gap);
    if (cy + btnH > backY - 4) return;
    button(ctx, x, cy, btnW, btnH, labelOf(row), false, false);
    addHit(idOf(row), x, cy, btnW, btnH);
  });
  button(ctx, x, backY, btnW, backH, "Back", false, false);
  addHit("back", x, backY, btnW, backH);
}

function drawSkillList(ctx, b, dock) {
  var actor = actorOf(b, b.actorId);
  var skills = (actor ? actor.skills : []).map(function (id) { return SF.SKILLS[id]; }).filter(Boolean);
  drawListPanel(ctx, dock, skills, "No skills.", function (sk) { return "skill:" + sk.id; }, function (sk) {
    return sk.name + "  " + sk.sp + " SP";
  });
}

function drawItemList(ctx, b, dock) {
  var rows = [];
  var inv = (SF.state && SF.state.inventory) || {};
  Object.keys(inv).forEach(function (id) {
    var it = SF.ITEMS[id];
    if (it && it.kind === "item" && inv[id] > 0) rows.push(it);
  });
  drawListPanel(ctx, dock, rows, "No items.", function (it) { return "item:" + it.id; }, function (it) {
    return it.name + " x" + (SF.state.inventory[it.id] || 0);
  });
}

function drawResult(ctx, b, panel) {
  var row = b.result || {};
  var x = panel.x;
  var y = panel.y;
  var panelW = panel.w;
  var panelH = Math.max(48, panel.h);
  var btnH = panel.btnH || 48;
  var by = y + panelH + 8;
  artWindow(ctx, x, y, panelW, panelH);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x + 8, y + 6, panelW - 16, panelH - 12);
  ctx.clip();
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  var compact = panelH < 210;
  var titleSize = compact ? 22 : 26;
  var bodySize = compact ? 15 : 16;
  var step = compact ? 18 : 22;
  ctx.fillStyle = "#ffd37a";
  ctx.font = "700 " + titleSize + "px system-ui, sans-serif";
  var title = row.fled ? "Fled." : (row.win ? "Victory." : "Defeat.");
  var ly = y + 10;
  var limit = y + panelH - 8;
  function line(text, color, size, gapAfter) {
    if (ly + size > limit) return false;
    ctx.fillStyle = color;
    ctx.font = (size >= 20 ? "700 " : "700 ") + size + "px system-ui, sans-serif";
    ctx.fillText(text, x + 14, ly);
    ly += gapAfter;
    return true;
  }
  line(title, "#ffd37a", titleSize, titleSize + 8);
  if (row.win && !row.fled) {
    line("XP +" + (row.xp || 0), "#f4f7ff", bodySize, step);
    line("Marks +" + (row.gold || 0), "#f4f7ff", bodySize, step);
    (row.items || []).forEach(function (name) { line(name, "#f4f7ff", bodySize, step); });
  }
  (row.levels || []).forEach(function (lv) {
    if (!line("Level up!", "#ffd37a", bodySize, step)) return;
    line(lv.name + " is level " + lv.level + ".", "#f4f7ff", bodySize, step);
    line("HP " + lv.hp[0] + " to " + lv.hp[1], "#f4f7ff", bodySize, step);
    line("Attack " + lv.atk[0] + " to " + lv.atk[1], "#f4f7ff", bodySize, step);
    line("Magic " + lv.mag[0] + " to " + lv.mag[1], "#f4f7ff", bodySize, step);
    if (lv.skill) line("Learned " + lv.skill + ".", "#f4f7ff", bodySize, step);
  });
  if (!row.win) line("The party is at half HP.", "#f4f7ff", bodySize, step);
  ctx.restore();
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
  if (id === "back" || id === "cancel") {
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
