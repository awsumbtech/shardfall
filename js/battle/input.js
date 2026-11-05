"use strict";

// BattleInput: pointer, keyboard, and pad.
// Kept window hook: keydown and keyup use window.addEventListener, because
// that is the browser target for battle keys. Smoke allows only
// window.addEventListener and window.removeEventListener in the renderer files.

(function () {
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
    var actor = SF.BattleGfx.actorOf(b, b.actorId);
    return (actor ? actor.skills : []).filter(function (id) { return SF.SKILLS[id]; }).map(function (id) {
      return "skill:" + id;
    });
  }
  if (b.phase === "items") return SF.BattleHud.battleItems(b).map(function (it) { return "item:" + it.id; });
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
  // A confirm key already down when the menu appeared is not a fresh press.
  if (b._confirmHeldAtMenu) return;
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
  if (SF.DrawDeps.sfx()) SF.DrawDeps.sfx().play("ui");
  if (b.phase === "readout") {
    b._gestureSkipped = true;
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
    if (SF.DrawDeps.sfx()) SF.DrawDeps.sfx().play("ui");
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
  // Arm hold-to-skip only on a fresh A press during an enemy or system readout.
  if (i.padAEdge && SF.Battle.enemyReadout(b)) {
    b.padHoldSince = SF.BattleFeel && SF.BattleFeel.now ? SF.BattleFeel.now() : Date.now();
  }
  if (!i.padA) {
    b.padHoldSince = 0;
    b._padAHeldAtMenu = false;
  }
  if (i.padAEdge) {
    i.padAEdge = false;
    if (b.phase === "result" || b.phase === "readout" || !b._padAHeldAtMenu) SF.Battle.confirm();
  }
  if (i.padBEdge || i.padXEdge) {
    i.padBEdge = false;
    i.padXEdge = false;
    SF.Battle.cancel();
  }
};


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
      drag.began = SF.BattleFeel && SF.BattleFeel.now ? SF.BattleFeel.now() : Date.now();
      drag.beganReadout = b.phase === "readout";
      b._holdSkips = 0;
      if (SF.Battle.enemyReadout && SF.Battle.enemyReadout(b)) {
        b.pointerHoldSince = drag.began;
      } else {
        b.pointerHoldSince = 0;
      }
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
    if (s.battle) {
      s.battle.pointerHoldSince = 0;
      s.battle._holdSkips = 0;
    }
    if (moved) return;
    var b = s.battle;
    // Still in the readout this finger started on: skip, and do not press whatever appears.
    if (start.beganReadout) {
      if (b && b.phase === "readout") SF.Battle.onPointer(pt.x, pt.y);
      return;
    }
    // This press began before the command menu, or in the first 250ms. The lift does not act.
    // The result screen's Continue button is not part of that menu.
    if (b && b.phase !== "result" && SF.Battle.pointerPressIgnored(b, start.began)) return;
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
    if (confirm) {
      s.battle._confirmDown = true;
      if (SF.Battle.enemyReadout && SF.Battle.enemyReadout(s.battle)) {
        if (!s.battle.keyHoldSince) s.battle.keyHoldSince = SF.BattleFeel && SF.BattleFeel.now ? SF.BattleFeel.now() : Date.now();
      } else {
        s.battle.keyHoldSince = 0;
      }
    }
    if (e.repeat && !arrow) return;
    if (arrow) SF.Battle.moveSel(code === "ArrowUp" || code === "ArrowLeft" ? -1 : 1);
    else if (confirm) {
      if (s.battle._confirmHeldAtMenu) return;
      SF.Battle.confirm();
    }
    else if (cancel) SF.Battle.cancel();
  }, true);
  window.addEventListener("keyup", function (e) {
    var s = SF.state;
    var b = s && s.battle;
    if (!b) return;
    var code = e.code;
    if (code === "Enter" || code === "Space" || code === "KeyE" || code === "KeyZ") {
      b._confirmDown = false;
      b._confirmHeldAtMenu = false;
      b.keyHoldSince = 0;
    }
  }, true);
}
  SF.BattleInput = {
    pick: pick,
    currentActor: currentActor,
    menuCount: menuCount,
    livingTargets: livingTargets,
    listIds: listIds,
    bindBattlePointer: bindBattlePointer
  };
})();
