"use strict";

// BattleHud: turn strip, party cards, log, commands, lists, and the result card.

(function () {
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
    // The strip is not drawn on the result, so the card can use that height.
    strip = { x: margin, y: margin, w: w - margin * 2, h: 0 };
    y0 = margin;
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
    var actor = SF.BattleGfx.actorOf(b, order[i]);
    if (!actor) continue;
    if (actor.side === "party" && actor.id === lastId) continue;
    out.push(order[i]);
    lastId = actor.side === "party" ? actor.id : "";
    if (out.length >= 5) break;
  }
  return out.length ? out : order.slice(0, 1);
}

function drawStrip(ctx, b, x, y, w, h) {
  SF.BattleGfx.artWindow(ctx, x, y, w, h);
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
    actor = SF.BattleGfx.actorOf(b, id);
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
    SF.BattleGfx.drawPortrait(ctx, actor.sprite, ox, portraitY, face);
    var slotX = x + inset + i * slot;
    label = SF.BattleGfx.pickFitting(ctx, SF.BattleGfx.labelChoices(actor, b, true), Math.max(12, slot - 2), 11, 8);
    if (!label.text) continue;
    ctx.fillStyle = i === 0 ? "#ffd37a" : "#d5def2";
    ctx.font = "700 " + label.size + "px system-ui, sans-serif";
    ctx.fillText(label.text, slotX + slot / 2, portraitY + face + nameH - 1);
  }
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
  if (barW >= 8) SF.BattleGfx.bar(ctx, x + tw + 4, mid - 3, barW, 5, max ? cur / max : 0, fill);
}

function drawPartyCards(ctx, b, party, x, y, w, h) {
  var n = party.length || 1;
  var gap = n > 2 ? 4 : 6;
  var bw = Math.floor((w - gap * (n - 1)) / n);
  party.forEach(function (a, i) {
    var cx = x + i * (bw + gap);
    SF.BattleGfx.artWindow(ctx, cx, y, bw, h);
    ctx.save();
    ctx.beginPath();
    ctx.rect(cx + 3, y + 3, Math.max(4, bw - 6), Math.max(4, h - 6));
    ctx.clip();
    var sideBySide = bw >= 168;
    if (sideBySide) {
      var portrait = Math.min(48, h - 16);
      SF.BattleGfx.drawPortrait(ctx, a.sprite, cx + 10, y + Math.round((h - portrait) / 2), portrait);
      var textX = cx + portrait + 18;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = b.actorId === a.id ? "#ffd37a" : "#f6f2ea";
      ctx.font = "700 15px \"Avenir Next\", \"Segoe UI\", system-ui, sans-serif";
      ctx.fillText(a.name, textX, y + 4);
      var barW = Math.max(36, cx + bw - 12 - textX);
      var labelW = Math.min(78, Math.round(barW * 0.46));
      ctx.font = "700 13px system-ui, sans-serif";
      ctx.fillStyle = "#ffd5dc";
      ctx.fillText("HP " + a.hp + "/" + a.maxHp, textX, y + 22);
      SF.BattleGfx.bar(ctx, textX + labelW, y + 24, Math.max(20, barW - labelW), 6, a.maxHp ? a.hp / a.maxHp : 0, "#ef6d7a");
      ctx.fillStyle = "#7eb6ff";
      ctx.fillText("SP " + a.sp + "/" + a.maxSp, textX, y + 42);
      SF.BattleGfx.bar(ctx, textX + labelW, y + 44, Math.max(20, barW - labelW), 6, a.maxSp ? a.sp / a.maxSp : 0, "#7eb6ff");
    } else {
      var pad = 4;
      var face = Math.max(16, Math.min(26, h - 38, bw - 40));
      SF.BattleGfx.drawPortrait(ctx, a.sprite, cx + pad, y + pad, face);
      var nameX = cx + pad + face + 4;
      var nameW = Math.max(12, cx + bw - pad - nameX);
      var choices = [a.name].concat(SF.BattleGfx.labelChoices(a, b, true));
      var name = SF.BattleGfx.pickFitting(ctx, choices, nameW, 13, 9);
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillStyle = b.actorId === a.id ? "#ffd37a" : "#f6f2ea";
      ctx.font = "700 " + name.size + "px \"Avenir Next\", \"Segoe UI\", system-ui, sans-serif";
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
      SF.BattleGfx.addHit("ally:" + a.id, cx, y, bw, h);
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
  SF.BattleGfx.artWindow(ctx, x, y, w, h);
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
    SF.BattleGfx.button(ctx, cx, cy, colW, box.btnH, labels[i][1], !dim && b.sel === i, dim);
    if (!dim) SF.BattleGfx.addHit("cmd:" + labels[i][0], cx, cy, colW, box.btnH);
  }
  cy = box.y + 2 * (box.btnH + box.gap);
  if (dim) {
    SF.BattleGfx.button(ctx, box.x, cy, box.w, box.btnH, "Cancel", true, false);
    SF.BattleGfx.addHit("cancel", box.x, cy, box.w, box.btnH);
  } else {
    SF.BattleGfx.button(ctx, box.x, cy, box.w, box.btnH, b.canFlee ? "Flee" : "Cannot flee", b.canFlee && b.sel === 4, !b.canFlee);
    if (b.canFlee) SF.BattleGfx.addHit("cmd:flee", box.x, cy, box.w, box.btnH);
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
  SF.BattleGfx.artWindow(ctx, x, listTop, btnW, plateH);
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
    SF.BattleGfx.button(ctx, x + 8, cy + 2, btnW - 16, Math.max(28, btnH - 2), labelOf(rows[i]), i === sel, dim);
    SF.BattleGfx.addHit(idOf(rows[i]), x + 8, cy + 2, btnW - 16, Math.max(28, btnH - 2));
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
  SF.BattleGfx.button(ctx, x, backY, btnW, backH, "Back", false, false);
  SF.BattleGfx.addHit("back", x, backY, btnW, backH);
}

function drawSkillList(ctx, b, dock) {
  var actor = SF.BattleGfx.actorOf(b, b.actorId);
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

function resultMetrics(panel, row) {
  var levels = row.levels || [];
  var items = row.win && !row.fled ? (row.items || []) : [];
  var head = 1;
  if (row.win && !row.fled) head += 1 + Math.ceil(items.length / 2);
  var metrics = { title: 26, body: 15, line: 20 };
  function height(m) {
    var block = 0;
    var i;
    for (i = 0; i < levels.length; i += 2) {
      var skill = (levels[i] && levels[i].skill) || (levels[i + 1] && levels[i + 1].skill);
      block += (skill ? m.line * 2 : m.line) + 4;
    }
    return 16 + m.title + 8 + head * m.line + block + 12;
  }
  while (height(metrics) > panel.h && metrics.body > 11) {
    metrics.body -= 1;
    metrics.line -= 1;
    if (metrics.title > 18) metrics.title -= 1;
  }
  metrics.cardH = Math.min(panel.h, Math.max(72, height(metrics)));
  return metrics;
}

function drawResult(ctx, b, panel) {
  var row = b.result || {};
  var x = panel.x;
  var y = panel.y;
  var panelW = panel.w;
  var panelH = Math.max(48, panel.h);
  var btnH = panel.btnH || 48;
  var levels = row.levels || [];
  var items = row.win && !row.fled ? (row.items || []) : [];
  var title = row.fled ? "Got away" : (row.win ? "Victory" : "Defeat");
  var metrics = resultMetrics({ h: panelH, w: panelW }, row);
  var cardH = metrics.cardH;
  var lineH = metrics.line;
  SF.BattleGfx.artWindow(ctx, x, y, panelW, cardH);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x + 6, y + 4, panelW - 12, cardH - 8);
  ctx.clip();
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#ffd37a";
  ctx.font = "700 " + metrics.title + "px system-ui, sans-serif";
  ctx.fillText(title, x + 14, y + 10);
  var ly = y + 10 + metrics.title + 6;
  var painted = [title];
  ctx.font = "700 " + metrics.body + "px system-ui, sans-serif";
  function write(text, color, maxW) {
    ctx.fillStyle = color;
    ctx.font = "700 " + metrics.body + "px system-ui, sans-serif";
    var shown = text;
    if (maxW && ctx.measureText(shown).width > maxW) shown = fitLine(ctx, shown, maxW);
    ctx.fillText(shown, x + 14, ly);
    painted.push(shown);
  }
  if (row.fled) {
    write("Back on the road.", "#f4f7ff");
  } else if (!row.win) {
    write("The party is at half HP.", "#f4f7ff");
  } else {
    write("+" + (row.xp || 0) + " XP    +" + (row.gold || 0) + " Marks", "#f4f7ff");
    ly += lineH;
    var c;
    for (c = 0; c < items.length; c += 2) {
      var leftItem = items[c];
      var rightItem = items[c + 1];
      write(rightItem ? leftItem + "    " + rightItem : leftItem, "#f4f7ff", panelW - 28);
      ly += lineH;
    }
    var colW = Math.floor((panelW - 36) / 2);
    var i;
    for (i = 0; i < levels.length; i += 2) {
      var pair = [levels[i], levels[i + 1]];
      var tall = (pair[0] && pair[0].skill) || (pair[1] && pair[1].skill);
      pair.forEach(function (lv, col) {
        if (!lv) return;
        var lx = x + 14 + col * (colW + 8);
        ctx.fillStyle = "#ffd37a";
        ctx.font = "700 " + metrics.body + "px system-ui, sans-serif";
        ctx.fillText(fitLine(ctx, lv.name + " Lv " + lv.level, colW), lx, ly);
        if (lv.skill) {
          ctx.fillStyle = "#f4f7ff";
          var learned = fitLine(ctx, "Learned " + lv.skill, colW);
          ctx.fillText(learned, lx, ly + lineH);
          painted.push(learned);
        }
      });
      ly += tall ? lineH * 2 + 4 : lineH + 4;
    }
  }
  SF.Battle.resultLines = painted;
  ctx.restore();
  var by = y + panelH + 8;
  SF.BattleGfx.button(ctx, x, by, panelW, btnH, "Continue", true, false);
  SF.BattleGfx.addHit("result", x, by, panelW, btnH);
}

  SF.Battle.itemRows = battleItems;
  SF.BattleHud = {
    stripHeight: stripHeight,
    layoutBattle: layoutBattle,
    displayOrder: displayOrder,
    drawStrip: drawStrip,
    drawStatRow: drawStatRow,
    drawPartyCards: drawPartyCards,
    weakLabel: weakLabel,
    drawLog: drawLog,
    aimPrompt: aimPrompt,
    drawAimLine: drawAimLine,
    drawCommands: drawCommands,
    fitLine: fitLine,
    chevron: chevron,
    drawScrollCue: drawScrollCue,
    drawListPanel: drawListPanel,
    drawSkillList: drawSkillList,
    battleItems: battleItems,
    drawItemList: drawItemList,
    resultMetrics: resultMetrics,
    drawResult: drawResult
  };
})();
