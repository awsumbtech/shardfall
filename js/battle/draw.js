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

function drawSprite(ctx, id, x, y, scale, frame) {
  if (window.Art && typeof Art.sprite === "function") {
    try {
      Art.sprite(ctx, id, x, y, { frame: frame || 0, facing: 1, scale: scale || 1 });
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
    ctx.lineWidth = 3;
    roundRect(ctx, x + 2, y + 2, w - 4, h - 4, 10);
    ctx.stroke();
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
  var top = 28;
  drawStrip(ctx, b, 12, top, w - 24, 78);
  if (b.phase === "result") {
    drawResult(ctx, b, w, h);
    return;
  }
  var foes = b.actors.filter(function (a) { return a.side === "foe"; });
  var party = b.actors.filter(function (a) { return a.side === "party"; });
  var submenu = b.phase === "skills" || b.phase === "items";
  drawFoes(ctx, b, foes, w, submenu ? 108 : 118, submenu ? 150 : 250);
  drawParty(ctx, b, party, w, submenu ? 250 : 360, submenu);
  if (!submenu) drawLog(ctx, b, 12, h - 24 - 64 * 3 - 16 - 78, w - 24, 70);
  if (b.phase === "menu" || b.phase === "target") drawCommands(ctx, b, w, h);
  if (b.phase === "skills") drawSkillList(ctx, b, w, h);
  if (b.phase === "items") drawItemList(ctx, b, w, h);
  if (b.phase === "readout") addHit("skip", 0, 0, w, h);
  if (b.phase === "target") {
    ctx.fillStyle = "#ffd37a";
    ctx.font = "700 16px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(b.aim === "ally" ? "Tap an ally." : "Tap a foe.", w / 2, h - 24 - 64 * 3 - 28);
  }
};

function drawStrip(ctx, b, x, y, w, h) {
  artWindow(ctx, x, y, w, h);
  var order = b.order && b.order.length ? b.order : SF.Battle.forecast(b, 8);
  var n = Math.min(8, order.length || 1);
  var slot = Math.min(46, Math.floor((w - 16) / 8));
  var i, id, actor, ox;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (i = 0; i < n; i++) {
    id = order[i];
    actor = actorOf(b, id);
    if (!actor) continue;
    ox = x + 8 + i * slot;
    if (i === 0) {
      ctx.strokeStyle = "#ffd37a";
      ctx.lineWidth = 2;
      ctx.strokeRect(ox, y + 8, slot - 4, slot - 4);
    }
    drawPortrait(ctx, actor.sprite, ox + 2, y + 10, slot - 10);
    ctx.fillStyle = i === 0 ? "#ffd37a" : "#d5def2";
    ctx.font = "700 12px system-ui, sans-serif";
    ctx.fillText(actor.name.split(" ")[0].slice(0, 6), ox + (slot - 4) / 2, y + h - 14);
  }
}

function drawFoes(ctx, b, foes, w, y, height) {
  var n = foes.length || 1;
  var gap = w / (n + 1);
  var boss = foes.some(function (f) { return f.boss; });
  foes.forEach(function (f, i) {
    var x = gap * (i + 1);
    var scale = boss ? 2.1 : 1.35;
    var sy = y + (boss ? height * 0.55 : height * 0.45);
    ctx.globalAlpha = f.alive ? 1 : 0.35;
    drawSprite(ctx, f.sprite, x, sy, scale, 0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#f4f7ff";
    ctx.font = "700 16px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(f.name, x, y + 4);
    bar(ctx, x - 36, y + 16, 72, 8, f.hp / f.maxHp, f.alive ? "#e15b6a" : "#665");
    ctx.font = "14px system-ui, sans-serif";
    ctx.fillStyle = "#f4f7ff";
    ctx.fillText(f.hp + "/" + f.maxHp, x, y + 38);
    if (f.revealed && f.weak) {
      ctx.fillStyle = "#ffd37a";
      ctx.fillText("Weak: " + weakLabel(f.weak), x, y + 56);
    }
    if (f.core) {
      ctx.fillStyle = "#ffd37a";
      ctx.font = "700 14px system-ui, sans-serif";
      ctx.fillText("Core", x, sy + 28);
    }
    if (f.alive) addHit("foe:" + f.id, x - 50, y, 100, height);
  });
}

function weakLabel(id) {
  if (id === "ember") return "Ember";
  if (id === "tide") return "Tide";
  if (id === "gale") return "Gale";
  if (id === "shard") return "Shard";
  return id;
}

function drawParty(ctx, b, party, w, y, compact) {
  var n = party.length || 1;
  var solo = n === 1;
  var bw = solo ? Math.min(300, w - 32) : Math.min(124, Math.floor((w - 24) / n) - 8);
  var total = n * bw + (n - 1) * 8;
  var x0 = Math.round((w - total) / 2);
  party.forEach(function (a, i) {
    var x = x0 + i * (bw + 8);
    var h = compact ? 78 : 120;
    var portrait = compact ? 28 : (solo ? 48 : 36);
    artWindow(ctx, x, y, bw, h);
    drawPortrait(ctx, a.sprite, x + 10, y + 10, portrait);
    var textX = solo ? x + portrait + 22 : x + (compact ? 40 : 50);
    ctx.fillStyle = b.actorId === a.id ? "#ffd37a" : "#f4f7ff";
    ctx.font = "700 " + (solo ? 20 : 14) + "px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(a.name, textX, y + 10);
    ctx.font = (solo ? 16 : 13) + "px system-ui, sans-serif";
    ctx.fillStyle = "#d5def2";
    var barX = solo ? textX : x + 8;
    var barW = Math.max(48, x + bw - 12 - barX);
    ctx.fillText("HP " + a.hp + "/" + a.maxHp, barX, y + (compact ? 40 : (solo ? 40 : 52)));
    bar(ctx, barX, y + (compact ? 60 : (solo ? 62 : 70)), barW, solo ? 10 : 8, a.hp / a.maxHp, "#ef6d7a");
    if (!compact) {
      ctx.fillText("SP " + a.sp + "/" + a.maxSp, barX, y + (solo ? 78 : 84));
      bar(ctx, barX, y + (solo ? 100 : 102), barW, solo ? 10 : 8, a.maxSp ? a.sp / a.maxSp : 0, "#7eb6ff");
    }
    addHit("ally:" + a.id, x, y, bw, h);
  });
}

function drawLog(ctx, b, x, y, w, h) {
  artWindow(ctx, x, y, w, h);
  var lines = b.log.slice(-3);
  ctx.fillStyle = "#f4f7ff";
  ctx.font = "16px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  lines.forEach(function (line, i) {
    ctx.fillText(line, x + 12, y + 10 + i * 20);
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
  var gap = 8;
  var btnH = h < 700 ? 52 : 64;
  var btnW = Math.min(380, w - 28);
  var x = Math.round((w - btnW) / 2);
  var y = h - 20 - (btnH * 3 + gap * 2);
  var colW = Math.floor((btnW - gap) / 2);
  var i;
  for (i = 0; i < 4; i++) {
    var cx = x + (i % 2) * (colW + gap);
    var cy = y + Math.floor(i / 2) * (btnH + gap);
    button(ctx, cx, cy, colW, btnH, labels[i][1], b.sel === i);
    addHit("cmd:" + labels[i][0], cx, cy, colW, btnH);
  }
  button(ctx, x, y + 2 * (btnH + gap), btnW, btnH, labels[4][1], b.sel === 4);
  addHit("cmd:flee", x, y + 2 * (btnH + gap), btnW, btnH);
}

function drawSkillList(ctx, b, w, h) {
  var actor = actorOf(b, b.actorId);
  var skills = actor ? actor.skills : [];
  var btnH = 56;
  var gap = 8;
  var btnW = Math.min(380, w - 28);
  var x = Math.round((w - btnW) / 2);
  var backY = h - 20 - 64;
  var y = 340;
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
  button(ctx, x, backY, btnW, 64, "Back", false);
  addHit("back", x, backY, btnW, 64);
}

function drawItemList(ctx, b, w, h) {
  var rows = [];
  var inv = (SF.state && SF.state.inventory) || {};
  Object.keys(inv).forEach(function (id) {
    var it = SF.ITEMS[id];
    if (it && it.kind === "item" && inv[id] > 0) rows.push(it);
  });
  var btnH = 56;
  var gap = 8;
  var btnW = Math.min(380, w - 28);
  var x = Math.round((w - btnW) / 2);
  var backY = h - 20 - 64;
  var y = 340;
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
  button(ctx, x, backY, btnW, 64, "Back", false);
  addHit("back", x, backY, btnW, 64);
}

function drawResult(ctx, b, w, h) {
  var row = b.result || {};
  var panelW = Math.min(380, w - 24);
  var x = Math.round((w - panelW) / 2);
  var y = 120;
  var panelH = Math.min(h - 220, 520);
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

bindBattlePointer();
if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bindBattlePointer);
}
})();
