"use strict";

// startDialogue(id) plays SF.dialogueNodes[id].
// Node: { id, speaker, portrait?, lines, choices?, next?, onEnd? }
// Choice: { text, next?, setFlags?, requires? }
// onEnd fires, in order, when the conversation closes (after any next nodes).
// Hook with SF.onDialogueEvent(name, fn), or the window event "sf:dialogue".
// An unknown id plays one placeholder line and does not throw.

var SF = window.SF || {};
window.SF = SF;

SF.dialogueNodes = SF.dialogueNodes || {};
SF.dialogueRouters = SF.dialogueRouters || [];
SF._dlgListeners = SF._dlgListeners || {};
SF._dlgEvents = SF._dlgEvents || [];
SF._dialogueUi = typeof document !== "undefined" && !!document.getElementById;
SF._portraitKey = null;

SF.routeDialogue = function (who, s) {
  var i, id;
  for (i = 0; i < SF.dialogueRouters.length; i++) {
    id = SF.dialogueRouters[i](who, s);
    if (id) return id;
  }
  return "";
};

SF.onDialogueEvent = function (name, fn) {
  if (!name || typeof fn !== "function") return;
  if (!SF._dlgListeners[name]) SF._dlgListeners[name] = [];
  SF._dlgListeners[name].push(fn);
};

function linesInstant() {
  if (!SF._dialogueUi) return true;
  if (typeof SF.calm === "function") return !!SF.calm();
  return !!SF.reduceFlash;
}

function fillLine(line, s) {
  var count = s && typeof s.shardsHeld === "number" ? s.shardsHeld : 0;
  return String(line == null ? "" : line).replace(/\{shards\}/g, String(count));
}

function choiceAllowed(choice, flags) {
  var req = choice && choice.requires;
  if (!req) return true;
  var k;
  for (k in req) {
    if (Object.prototype.hasOwnProperty.call(req, k) && flags[k] !== req[k]) return false;
  }
  return true;
}

function writeFlags(map) {
  var s = SF.state;
  if (!s || !map) return;
  if (!s.flags) s.flags = {};
  var k;
  for (k in map) {
    if (Object.prototype.hasOwnProperty.call(map, k)) s.flags[k] = map[k];
  }
  if (SF.saveGame) SF.saveGame({ silent: true });
}

function placeholder(id) {
  var label = id ? String(id) : "unknown";
  return {
    id: label,
    speaker: "A voice on the wind",
    portrait: "unknown",
    lines: ["That line is still out on the Hush. (" + label + ")"]
  };
}

function lookup(id) {
  var node = id && SF.dialogueNodes ? SF.dialogueNodes[id] : null;
  if (!node || !node.lines) return placeholder(id);
  return node;
}

function fireEvent(name) {
  var list = SF._dlgListeners[name] || [];
  var i;
  for (i = 0; i < list.length; i++) list[i](name);
  try {
    if (typeof window !== "undefined" && typeof window.dispatchEvent === "function" && typeof CustomEvent === "function") {
      window.dispatchEvent(new CustomEvent("sf:dialogue", { detail: { event: name } }));
    }
  } catch (err) {
    /* the listener list already ran */
  }
}

function flushEvents() {
  var events = SF._dlgEvents.splice(0, SF._dlgEvents.length);
  var i;
  for (i = 0; i < events.length; i++) fireEvent(events[i]);
}

function showNode(id) {
  var s = SF.state;
  if (!s) return;
  var node = lookup(id);
  var lines = node.lines && node.lines.length ? node.lines : ["..."];
  var full = fillLine(lines[0], s);
  var instant = linesInstant();
  s.dialogue = {
    id: node.id || String(id || ""),
    node: node,
    speaker: node.speaker || "Someone",
    portrait: node.portrait || "unknown",
    lines: lines,
    i: 0,
    full: full,
    shown: instant ? full.length : 0,
    done: instant || full.length === 0,
    acc: 0,
    phase: "line",
    choices: [],
    lock: 0.2
  };
  s.mode = "dialogue";
  SF._portraitKey = null;
  if (SF.releaseHolds) SF.releaseHolds();
  if (SF.emit) SF.emit("talk");
  if (SF.syncUI) SF.syncUI();
}

function finishNode(choice) {
  var s = SF.state;
  var d = s && s.dialogue;
  if (!d) return;
  var node = d.node;
  if (choice && choice.setFlags) writeFlags(choice.setFlags);
  if (node && node.onEnd) SF._dlgEvents.push(node.onEnd);
  var nextId = (choice && choice.next) || (node && node.next) || "";
  if (nextId) {
    showNode(nextId);
    return;
  }
  s.dialogue = null;
  if (s.mode === "dialogue") s.mode = "play";
  SF._portraitKey = null;
  if (SF.saveGame) SF.saveGame({ silent: true });
  if (SF.syncUI) SF.syncUI();
  flushEvents();
}

function enterChoice() {
  var s = SF.state;
  var d = s.dialogue;
  var node = d.node || {};
  var flags = s.flags || {};
  var visible = [];
  var list = node.choices || [];
  var i;
  for (i = 0; i < list.length; i++) {
    if (choiceAllowed(list[i], flags)) visible.push(list[i]);
  }
  if (!visible.length) {
    finishNode(null);
    return;
  }
  d.phase = "choice";
  d.choices = visible;
  d.done = true;
  d.lock = 0.08;
}

SF.startDialogue = function (id) {
  if (!SF.state) return;
  if (SF.state.dialogue && SF._dlgEvents.length) flushEvents();
  showNode(id == null ? "" : String(id));
};

window.startDialogue = SF.startDialogue;

SF.advanceDialogue = function () {
  var s = SF.state;
  var d = s && s.dialogue;
  if (!d || s.mode !== "dialogue" || d.lock > 0) return;
  if (d.phase === "choice") return;
  if (!d.done) {
    d.shown = d.full.length;
    d.done = true;
    d.acc = 0;
    return;
  }
  if (d.i < d.lines.length - 1) {
    d.i += 1;
    d.full = fillLine(d.lines[d.i], s);
    var instant = linesInstant();
    d.shown = instant ? d.full.length : 0;
    d.done = instant || !d.full.length;
    d.acc = 0;
    d.lock = 0.05;
    if (SF.emit) SF.emit("talk");
    return;
  }
  enterChoice();
};

SF.chooseDialogue = function (index) {
  var s = SF.state;
  var d = s && s.dialogue;
  if (!d || s.mode !== "dialogue" || d.phase !== "choice" || d.lock > 0) return;
  var choice = d.choices[index];
  if (!choice) return;
  if (SF.emit) SF.emit("ui");
  finishNode(choice);
};

SF.tickDialogue = function (dt) {
  var d = SF.state && SF.state.dialogue;
  if (!d || d.phase === "choice" || d.done) return;
  if (linesInstant()) {
    d.shown = d.full.length;
    d.done = true;
    d.acc = 0;
    return;
  }
  d.acc = (d.acc || 0) + (dt || 0);
  var step = 0.026;
  if (!d.shown) d.blipAt = 0;
  while (d.acc >= step && d.shown < d.full.length) {
    d.acc -= step;
    d.shown += 1;
    if (d.shown - (d.blipAt || 0) >= 6) {
      d.blipAt = d.shown;
      if (window.Sfx) Sfx.play("blip", { speaker: d.speaker });
    }
  }
  if (d.shown >= d.full.length) {
    d.shown = d.full.length;
    d.done = true;
  }
};

function clipRound(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

var FACES = {
  maren: { bg: "#6e3428", skin: "#e7b48f", hair: "#efe6da", cloth: "#a24b38", accent: "#ffd37a", ink: "#3a2418", style: "maren" },
  kestrel: { bg: "#145e5c", skin: "#e2b08a", hair: "#2c2118", cloth: "#1f8a84", accent: "#ffe08a", ink: "#1a120c", style: "kestrel" },
  tamsin: { bg: "#b84e22", skin: "#f0c3a4", hair: "#6a2d12", cloth: "#e07a3d", accent: "#8ef6ff", ink: "#3a1c10", style: "tamsin" },
  hesk: { bg: "#2c2744", skin: "#d8c2ae", hair: "#1a1628", cloth: "#3d3658", accent: "#c6b6ff", ink: "#1a1424", style: "hesk" },
  ilsa: { bg: "#6a4a28", skin: "#c9956c", hair: "#1a120c", cloth: "#8a6232", accent: "#ffe7a8", ink: "#1a120c", style: "ilsa" },
  cantor: { bg: "#140c22", skin: "#241830", hair: "#100818", cloth: "#1a1028", accent: "#e6c56a", ink: "#e6c56a", style: "cantor" },
  maw: { bg: "#3a1612", skin: "#5a2820", hair: "#2a100c", cloth: "#4a1c16", accent: "#ff8a3a", ink: "#1a0a08", style: "maw" },
  wayfarer: { bg: "#16324a", skin: "#e6b89a", hair: "#243044", cloth: "#1d4e68", accent: "#8ef6ff", ink: "#1a120c", style: "wayfarer" }
};

var BADGES = {
  stones: { bg: "#3e4c5c", fg: "#d5e2ea", glyph: "stone" },
  lamp: { bg: "#3a2858", fg: "#ffe7a8", glyph: "lamp" },
  ship: { bg: "#164852", fg: "#9af0d8", glyph: "ship" },
  scar: { bg: "#5a3828", fg: "#ffb37a", glyph: "scar" },
  core: { bg: "#4a2418", fg: "#ffb15a", glyph: "core" },
  sign: { bg: "#3a3428", fg: "#f3e6c4", glyph: "sign" },
  crate: { bg: "#4a3a28", fg: "#e6d2a8", glyph: "crate" },
  ash: { bg: "#3a3438", fg: "#ffb37a", glyph: "ash" },
  blossom: { bg: "#3a2438", fg: "#ffd0e8", glyph: "bloom" },
  bridge: { bg: "#2a3a34", fg: "#d7c6a4", glyph: "bridge" },
  vault: { bg: "#3a2a22", fg: "#ffd37a", glyph: "vault" },
  bell: { bg: "#3a3040", fg: "#e6d8c8", glyph: "bell" },
  unknown: { bg: "#241c38", fg: "#ffd37a", glyph: "mark" },
  hush: { bg: "#241838", fg: "#c6b6ff", glyph: "hush" }
};

function drawFace(ctx, face) {
  ctx.fillStyle = face.bg;
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = face.cloth;
  ctx.beginPath();
  ctx.ellipse(32, 62, 24, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  if (face.style === "kestrel") {
    ctx.fillStyle = face.accent;
    ctx.fillRect(14, 46, 36, 8);
  }
  if (face.style === "ilsa") {
    ctx.fillStyle = face.accent;
    ctx.fillRect(16, 50, 32, 4);
  }
  if (face.style === "cantor") {
    ctx.fillStyle = face.accent;
    ctx.fillRect(10, 56, 44, 3);
  }
  ctx.fillStyle = face.skin;
  ctx.beginPath();
  ctx.arc(32, 30, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = face.hair;
  if (face.style === "maren") {
    ctx.beginPath();
    ctx.arc(32, 24, 16, Math.PI, 0);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(32, 16, 7, 0, Math.PI * 2);
    ctx.fill();
  } else if (face.style === "kestrel") {
    ctx.beginPath();
    ctx.arc(32, 22, 16, Math.PI * 1.05, Math.PI * 1.95);
    ctx.fill();
  } else if (face.style === "tamsin") {
    ctx.beginPath();
    ctx.arc(32, 22, 16, Math.PI, 0);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(46, 20, 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (face.style === "hesk") {
    ctx.beginPath();
    ctx.arc(32, 28, 18, Math.PI, 0);
    ctx.lineTo(50, 40);
    ctx.lineTo(14, 40);
    ctx.fill();
  } else if (face.style === "ilsa") {
    ctx.fillRect(16, 14, 32, 10);
    ctx.fillRect(16, 14, 4, 22);
    ctx.fillRect(44, 14, 4, 22);
  } else if (face.style === "wayfarer") {
    ctx.beginPath();
    ctx.arc(32, 22, 15, Math.PI, 0);
    ctx.fill();
  } else if (face.style === "maw") {
    ctx.fillStyle = "#2a100e";
    ctx.beginPath();
    ctx.arc(32, 32, 20, 0, Math.PI * 2);
    ctx.fill();
  }

  if (face.style === "cantor") {
    ctx.fillStyle = "#1a1228";
    ctx.beginPath();
    ctx.ellipse(32, 30, 14, 17, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = face.accent;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(24, 26);
    ctx.lineTo(29, 26);
    ctx.moveTo(35, 26);
    ctx.lineTo(40, 26);
    ctx.moveTo(26, 36);
    ctx.quadraticCurveTo(32, 39, 38, 36);
    ctx.stroke();
    return;
  }

  if (face.style === "maw") {
    ctx.fillStyle = face.accent;
    ctx.beginPath();
    ctx.arc(32, 30, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f4e6d4";
    ctx.beginPath();
    ctx.moveTo(22, 40);
    ctx.lineTo(26, 34);
    ctx.lineTo(30, 42);
    ctx.lineTo(34, 34);
    ctx.lineTo(38, 42);
    ctx.lineTo(42, 34);
    ctx.lineTo(44, 40);
    ctx.fill();
    return;
  }

  ctx.fillStyle = face.ink;
  ctx.beginPath();
  ctx.arc(26, 30, 1.6, 0, Math.PI * 2);
  ctx.arc(38, 30, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = face.ink;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  if (face.style === "hesk") {
    ctx.moveTo(22, 25);
    ctx.lineTo(28, 27);
    ctx.moveTo(42, 25);
    ctx.lineTo(36, 27);
    ctx.moveTo(28, 38);
    ctx.quadraticCurveTo(32, 36, 36, 38);
  } else if (face.style === "ilsa") {
    ctx.moveTo(22, 24);
    ctx.lineTo(29, 25);
    ctx.moveTo(42, 24);
    ctx.lineTo(35, 25);
    ctx.moveTo(27, 38);
    ctx.lineTo(37, 38);
  } else if (face.style === "tamsin") {
    ctx.moveTo(27, 37);
    ctx.quadraticCurveTo(32, 42, 38, 36);
  } else {
    ctx.moveTo(27, 37);
    ctx.quadraticCurveTo(32, 41, 37, 37);
  }
  ctx.stroke();

  if (face.style === "kestrel") {
    ctx.strokeStyle = "#d8ecf2";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(26, 30, 6, 4.5, 0, 0, Math.PI * 2);
    ctx.ellipse(38, 30, 6, 4.5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = face.accent;
    ctx.beginPath();
    ctx.moveTo(32, 28);
    ctx.lineTo(32, 32);
    ctx.stroke();
  }
  if (face.style === "tamsin") {
    ctx.fillStyle = "#8a4a32";
    ctx.beginPath();
    ctx.arc(24, 34, 0.8, 0, Math.PI * 2);
    ctx.arc(40, 34, 0.8, 0, Math.PI * 2);
    ctx.arc(32, 35, 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = face.accent;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(50, 46, 5, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (face.style === "maren") {
    ctx.fillStyle = face.accent;
    ctx.beginPath();
    ctx.arc(46, 32, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  if (face.style === "ilsa") {
    ctx.fillStyle = face.accent;
    ctx.beginPath();
    ctx.moveTo(32, 48);
    ctx.lineTo(35, 54);
    ctx.lineTo(32, 58);
    ctx.lineTo(29, 54);
    ctx.fill();
  }
  if (face.style === "hesk") {
    ctx.fillStyle = face.accent;
    ctx.fillRect(22, 46, 20, 3);
  }
  if (face.style === "wayfarer") {
    ctx.fillStyle = face.accent;
    ctx.beginPath();
    ctx.moveTo(50, 50);
    ctx.lineTo(56, 56);
    ctx.lineTo(50, 62);
    ctx.lineTo(44, 56);
    ctx.fill();
  }
}

function drawBadge(ctx, badge) {
  ctx.fillStyle = badge.bg;
  ctx.fillRect(0, 0, 64, 64);
  ctx.strokeStyle = badge.fg;
  ctx.fillStyle = badge.fg;
  ctx.lineWidth = 2;
  var g = badge.glyph;
  if (g === "lamp" || g === "mark" || g === "core") {
    ctx.beginPath();
    ctx.moveTo(32, 12);
    ctx.lineTo(48, 32);
    ctx.lineTo(32, 52);
    ctx.lineTo(16, 32);
    ctx.closePath();
    if (g === "core") ctx.fill();
    else ctx.stroke();
    if (g === "core") {
      ctx.fillStyle = "#fff1d0";
      ctx.beginPath();
      ctx.arc(32, 32, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (g === "ship") {
    ctx.beginPath();
    ctx.moveTo(14, 40);
    ctx.lineTo(50, 40);
    ctx.lineTo(42, 50);
    ctx.lineTo(22, 50);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(32, 40);
    ctx.lineTo(32, 16);
    ctx.lineTo(44, 32);
    ctx.closePath();
    ctx.stroke();
  } else if (g === "stone") {
    ctx.beginPath();
    ctx.ellipse(26, 36, 12, 9, -0.2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(38, 30, 10, 8, 0.3, 0, Math.PI * 2);
    ctx.stroke();
  } else if (g === "scar") {
    ctx.beginPath();
    ctx.moveTo(16, 40);
    ctx.lineTo(26, 24);
    ctx.lineTo(34, 38);
    ctx.lineTo(48, 18);
    ctx.stroke();
  } else if (g === "sign") {
    ctx.strokeRect(16, 14, 32, 26);
    ctx.beginPath();
    ctx.moveTo(22, 22);
    ctx.lineTo(42, 22);
    ctx.moveTo(22, 28);
    ctx.lineTo(38, 28);
    ctx.moveTo(32, 40);
    ctx.lineTo(32, 52);
    ctx.stroke();
  } else if (g === "crate") {
    ctx.strokeRect(16, 20, 32, 28);
    ctx.beginPath();
    ctx.moveTo(16, 20);
    ctx.lineTo(32, 12);
    ctx.lineTo(48, 20);
    ctx.moveTo(32, 12);
    ctx.lineTo(32, 48);
    ctx.stroke();
  } else if (g === "ash") {
    ctx.beginPath();
    ctx.arc(24, 34, 3, 0, Math.PI * 2);
    ctx.arc(34, 26, 2.4, 0, Math.PI * 2);
    ctx.arc(40, 38, 3.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (g === "bloom") {
    ctx.beginPath();
    ctx.arc(32, 30, 4, 0, Math.PI * 2);
    ctx.arc(32, 20, 5, 0, Math.PI * 2);
    ctx.arc(42, 30, 5, 0, Math.PI * 2);
    ctx.arc(32, 40, 5, 0, Math.PI * 2);
    ctx.arc(22, 30, 5, 0, Math.PI * 2);
    ctx.stroke();
  } else if (g === "bridge") {
    ctx.beginPath();
    ctx.moveTo(16, 44);
    ctx.lineTo(16, 24);
    ctx.moveTo(48, 44);
    ctx.lineTo(48, 24);
    ctx.moveTo(16, 28);
    ctx.quadraticCurveTo(32, 18, 48, 28);
    ctx.moveTo(18, 40);
    ctx.lineTo(46, 40);
    ctx.stroke();
  } else if (g === "vault") {
    ctx.beginPath();
    ctx.moveTo(18, 48);
    ctx.lineTo(18, 28);
    ctx.arc(32, 28, 14, Math.PI, 0);
    ctx.lineTo(46, 48);
    ctx.stroke();
  } else if (g === "bell") {
    ctx.beginPath();
    ctx.moveTo(24, 18);
    ctx.quadraticCurveTo(32, 14, 40, 18);
    ctx.lineTo(44, 36);
    ctx.lineTo(20, 36);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(32, 40, 3, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(32, 32, 14, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawPortrait(canvas, key) {
  if (!canvas || !canvas.getContext) return;
  var dpr = 1;
  try {
    dpr = Math.min(window.devicePixelRatio || 1, 4);
  } catch (err) {
    dpr = 1;
  }
  var px = Math.max(64, Math.round(64 * dpr));
  if (canvas.width !== px) {
    canvas.width = px;
    canvas.height = px;
  }
  var ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(px / 64, 0, 0, px / 64, 0, 0);
  ctx.clearRect(0, 0, 64, 64);
  clipRound(ctx, 0, 0, 64, 64, 14);
  ctx.save();
  ctx.clip();
  if (FACES[key]) drawFace(ctx, FACES[key]);
  else drawBadge(ctx, BADGES[key] || BADGES.unknown);
  ctx.restore();
  ctx.strokeStyle = "rgba(255, 211, 122, 0.45)";
  ctx.lineWidth = 1.5;
  clipRound(ctx, 1, 1, 62, 62, 13);
  ctx.stroke();
}

SF.paintDialogue = function () {
  if (!SF._dialogueUi) return;
  var s = SF.state;
  var d = s && s.dialogue;
  var root = document.getElementById("dialogue");
  if (!root || !d || s.mode !== "dialogue") return;
  var who = document.getElementById("who");
  var line = document.getElementById("line");
  var hint = document.getElementById("dlg-hint");
  var box = document.getElementById("dlg-choices");
  var portrait = document.getElementById("dlg-portrait");
  if (!who || !line || !hint || !box) return;
  if (who.textContent !== d.speaker) who.textContent = d.speaker;
  var text = d.full ? d.full.slice(0, d.shown) : "";
  if (line.textContent !== text) line.textContent = text;
  var typing = d.phase !== "choice" && !d.done && !linesInstant();
  line.classList.toggle("typing", typing);
  var choiceKey = d.id + "|" + (d.phase === "choice" ? d.choices.map(function (c) { return c.text; }).join("|") : "");
  if (box.dataset.key !== choiceKey) {
    box.dataset.key = choiceKey;
    box.textContent = "";
    if (d.phase === "choice") {
      d.choices.forEach(function (c, i) {
        var b = document.createElement("button");
        b.type = "button";
        b.textContent = c.text;
        b.addEventListener("pointerdown", function (e) {
          e.preventDefault();
          e.stopPropagation();
          SF.chooseDialogue(i);
        });
        box.appendChild(b);
      });
    }
  }
  var hintText = d.phase === "choice" ? "Tap a reply" : (d.done ? "Tap to continue" : "Tap to finish");
  if (hint.textContent !== hintText) hint.textContent = hintText;
  if (portrait && SF._portraitKey !== d.portrait) {
    SF._portraitKey = d.portrait;
    drawPortrait(portrait, d.portrait);
  }
};

if (SF._dialogueUi) {
  document.addEventListener("keydown", function (e) {
    var s = SF.state;
    if (!s || s.mode !== "dialogue" || !s.dialogue || s.dialogue.phase !== "choice") return;
    var n = -1;
    if (e.code === "Digit1" || e.code === "Numpad1") n = 0;
    else if (e.code === "Digit2" || e.code === "Numpad2") n = 1;
    else if (e.code === "Digit3" || e.code === "Numpad3") n = 2;
    else if (e.code === "Digit4" || e.code === "Numpad4") n = 3;
    if (n < 0) return;
    e.preventDefault();
    SF.chooseDialogue(n);
  });
}
