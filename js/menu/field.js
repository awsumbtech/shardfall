"use strict";

var SF = window.SF || {};
window.SF = SF;

SF.fieldScreen = "root";
SF.fieldNote = "";
SF.fieldMember = "wayfarer";
SF.fieldSlot = "weapon";
SF._fieldSig = "";

function joined(s) {
  return SF.activeParty(s);
}

SF.equipItem = function (memberId, slot, itemId) {
  var s = SF.state;
  if (!s || !s.party) return false;
  var m = s.party.members[memberId];
  var it = itemId ? SF.ITEMS[itemId] : null;
  if (itemId && (!it || it.slot !== slot)) return false;
  if (it && it.users && it.users.indexOf(memberId) < 0) return false;
  if (itemId && !SF.takeItem(itemId, 1)) return false;
  var prev = m.equip[slot];
  if (prev) SF.giveItem(prev, 1);
  m.equip[slot] = itemId || null;
  SF.syncFieldVitals(s);
  SF.saveGame({ silent: true });
  return true;
};

SF.useFieldItem = function (itemId, memberId) {
  var s = SF.state;
  var it = SF.ITEMS[itemId];
  if (!s || !it || it.kind !== "item") return false;
  if (it.battleOnly) return false;
  var m = s.party.members[memberId];
  if (!m) return false;
  if (!SF.takeItem(itemId, 1)) return false;
  var st = SF.memberStats(s, memberId);
  if (it.revive && m.hp <= 0) m.hp = Math.max(1, Math.ceil(st.maxHp * it.revive));
  if (it.hp && m.hp > 0) m.hp = Math.min(st.maxHp, m.hp + it.hp);
  if (it.sp && m.hp > 0) m.sp = Math.min(st.maxSp, (m.sp || 0) + it.sp);
  if (memberId === "wayfarer") s.player.hp = m.hp;
  SF.syncFieldVitals(s);
  SF.saveGame({ silent: true });
  return true;
};

SF.openFieldMenu = function () {
  var s = SF.state;
  if (!s || s.mode === "title" || s.mode === "battle") return;
  if (s.mode === "fieldmenu") return;
  SF.releaseHolds && SF.releaseHolds();
  s.pausedFrom = s.mode === "fieldmenu" ? "play" : s.mode;
  if (s.pausedFrom === "pause") s.pausedFrom = "play";
  s.mode = "fieldmenu";
  SF.fieldScreen = "root";
  SF.fieldNote = "";
  SF._fieldSig = "";
  SF.saveGame({ silent: true });
  if (SF.syncUI) SF.syncUI();
};

SF.closeFieldMenu = function () {
  var s = SF.state;
  if (!s || s.mode !== "fieldmenu") return;
  s.mode = "play";
  SF.fieldNote = "";
  if (SF.syncUI) SF.syncUI();
};

function faceRow(parent, id) {
  var row = document.createElement("div");
  row.className = "field-face";
  var canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  if (window.Art && Art.portrait) {
    var g = canvas.getContext("2d");
    g.imageSmoothingEnabled = false;
    Art.portrait(g, id, 0, 0, 64);
  }
  row.appendChild(canvas);
  var name = document.createElement("span");
  name.textContent = (SF.PARTY[id] && SF.PARTY[id].name) || id;
  row.appendChild(name);
  parent.appendChild(row);
}

function statLine(s, id) {
  var m = s.party.members[id];
  var st = SF.memberStats(s, id);
  var gear = ["weapon", "armor", "charm"].map(function (slot) {
    var it = SF.ITEMS[m.equip[slot]];
    return (slot[0].toUpperCase() + slot.slice(1)) + ": " + (it ? it.name : "Empty");
  }).join(" · ");
  return "Lv " + m.level +
    "\nHP " + m.hp + "/" + st.maxHp + "   SP " + (m.sp || 0) + "/" + st.maxSp +
    "\nAttack " + st.atk + "   Defense " + st.def + "   Magic " + st.mag + "   Speed " + st.spd +
    "\n" + gear;
}

function buildRoot(s) {
  return [
    { id: "party", label: "Party" },
    { id: "items", label: "Items" },
    { id: "equip", label: "Equip" },
    { id: "skills", label: "Skills" },
    { id: "save", label: "Save" },
    { id: "more", label: "More" }
  ];
}

function buildMore(s) {
  return [
    { id: "settings", label: "Settings" },
    { id: "hints", label: "Hints" },
    { id: "news", label: "What's new in v" + (SF.VERSION || "0.3") },
    { id: "install", label: "Install" },
    { id: "load", label: "Load", ghost: true },
    { id: "hand", label: "The hand", ghost: true },
    { id: "calm", label: "Reduce flashing: " + (SF.reduceFlash ? "On" : "Off"), ghost: true },
    { id: "title", label: "Title", ghost: true }
  ];
}

function paint(s) {
  var body = document.getElementById("field-body");
  var title = document.getElementById("field-title");
  var gold = document.getElementById("field-gold");
  var note = document.getElementById("field-note");
  var back = document.getElementById("field-back");
  if (!body) return;
  if (gold) gold.textContent = "Marks: " + (s.gold || 0);
  if (note) note.textContent = SF.fieldNote || "";
  if (back) {
    back.hidden = false;
    back.textContent = SF.fieldScreen === "root" ? "Resume" : "Back";
  }
  var sig = SF.fieldScreen + "|" + SF.fieldMember + "|" + SF.fieldSlot + "|" + (s.gold || 0) + "|" + JSON.stringify(s.inventory || {}) + "|" + joined(s).join(",") + "|" + (SF.reduceFlash ? 1 : 0);
  joined(s).forEach(function (id) {
    var m = s.party.members[id];
    sig += "|" + id + m.level + m.hp + (m.equip.weapon || "") + (m.equip.armor || "") + (m.equip.charm || "");
  });
  if (sig === SF._fieldSig) return;
  SF._fieldSig = sig;
  body.innerHTML = "";
  if (SF.fieldScreen === "root") title.textContent = "Menu";
  if (SF.fieldScreen === "more") title.textContent = "More";
  if (SF.fieldScreen === "party") title.textContent = "Party";
  if (SF.fieldScreen === "skills") title.textContent = "Skills";
  if (SF.fieldScreen === "items" || SF.fieldScreen === "item-who") title.textContent = "Items";
  if (SF.fieldScreen === "equip" || SF.fieldScreen === "equip-pick") title.textContent = "Equip";
  if (SF.fieldScreen === "hints") title.textContent = "Hints";

  if (SF.fieldScreen === "root") {
    buildRoot(s).forEach(function (row) { addButton(body, row.label, row.ghost, function () { onRoot(row.id); }); });
    return;
  }
  if (SF.fieldScreen === "more") {
    buildMore(s).forEach(function (row) { addButton(body, row.label, row.ghost, function () { onRoot(row.id); }); });
    return;
  }
  if (SF.fieldScreen === "hints") {
    [
      "Move with the stick on the left.",
      "Dash crosses a short gap.",
      "When someone is close, the button on the right names what you can do. It stays dim when nobody is near.",
      "Hold HOOK, aim with the stick, then let go.",
      "Rest at an inn to refill HP and save.",
      "A lit lamp quiets that island."
    ].forEach(function (line) {
      var p = document.createElement("p");
      p.className = "field-stat";
      p.textContent = line;
      body.appendChild(p);
    });
    return;
  }
  if (SF.fieldScreen === "party") {
    joined(s).forEach(function (id) {
      faceRow(body, id);
      var p = document.createElement("p");
      p.className = "field-stat";
      p.textContent = statLine(s, id);
      body.appendChild(p);
    });
    return;
  }
  if (SF.fieldScreen === "skills") {
    joined(s).forEach(function (id) {
      faceRow(body, id);
      SF.skillsAt(id, s.party.members[id].level).forEach(function (skillId) {
        var sk = SF.SKILLS[skillId];
        var p = document.createElement("p");
        p.className = "field-stat";
        p.textContent = sk.name + " — " + sk.sp + " SP. " + sk.desc;
        body.appendChild(p);
      });
    });
    return;
  }
  if (SF.fieldScreen === "items") {
    var keys = Object.keys(s.inventory || {});
    if (!keys.length) {
      var empty = document.createElement("p");
      empty.className = "field-stat";
      empty.textContent = "No items.";
      body.appendChild(empty);
    }
    keys.forEach(function (id) {
      var it = SF.ITEMS[id];
      if (!it) return;
      var label = it.name + " x" + s.inventory[id] + ". " + it.desc;
      addButton(body, label, false, function () {
        if (it.battleOnly) {
          SF.fieldNote = "Use in battle.";
          SF._fieldSig = "";
          paint(SF.state);
          return;
        }
        if (it.kind !== "item") {
          SF.fieldNote = "Equip this from Equip.";
          SF._fieldSig = "";
          paint(SF.state);
          return;
        }
        SF.fieldItem = id;
        SF.fieldScreen = "item-who";
        SF._fieldSig = "";
        paint(SF.state);
      });
    });
    return;
  }
  if (SF.fieldScreen === "item-who") {
    var using = SF.ITEMS[SF.fieldItem];
    var head = document.createElement("p");
    head.className = "field-stat";
    head.textContent = using ? using.name : "";
    body.appendChild(head);
    joined(s).forEach(function (id) {
      addButton(body, SF.PARTY[id].name, false, function () {
        if (SF.useFieldItem(SF.fieldItem, id)) SF.fieldNote = "Used.";
        else SF.fieldNote = "Could not use that.";
        SF.fieldScreen = "items";
        SF._fieldSig = "";
        paint(SF.state);
      });
    });
    return;
  }
  if (SF.fieldScreen === "equip") {
    faceRow(body, SF.fieldMember);
    if (joined(s).length > 1) {
      joined(s).forEach(function (id) {
        addButton(body, SF.PARTY[id].name, SF.fieldMember !== id, function () {
          SF.fieldMember = id;
          SF._fieldSig = "";
          paint(SF.state);
        });
      });
    }
    var who = s.party.members[SF.fieldMember];
    ["weapon", "armor", "charm"].forEach(function (slot) {
      var worn = SF.ITEMS[who.equip[slot]];
      var label = slot[0].toUpperCase() + slot.slice(1) + ": " + (worn ? worn.name : "Empty");
      addButton(body, label, false, function () {
        SF.fieldSlot = slot;
        SF.fieldScreen = "equip-pick";
        SF._fieldSig = "";
        paint(SF.state);
      });
    });
    var summary = document.createElement("p");
    summary.className = "field-stat";
    summary.textContent = statLine(s, SF.fieldMember);
    body.appendChild(summary);
    return;
  }
  if (SF.fieldScreen === "equip-pick") {
    addButton(body, "Empty", !s.party.members[SF.fieldMember].equip[SF.fieldSlot], function () {
      SF.equipItem(SF.fieldMember, SF.fieldSlot, null);
      SF.fieldNote = "Unequipped.";
      SF.fieldScreen = "equip";
      SF._fieldSig = "";
      paint(SF.state);
    });
    Object.keys(s.inventory || {}).forEach(function (id) {
      var it = SF.ITEMS[id];
      if (!it || it.slot !== SF.fieldSlot || !s.inventory[id]) return;
      if (it.users && it.users.indexOf(SF.fieldMember) < 0) return;
      addButton(body, it.name + ". " + it.desc, false, function () {
        if (SF.equipItem(SF.fieldMember, SF.fieldSlot, id)) SF.fieldNote = "Equipped.";
        else SF.fieldNote = "Could not equip that.";
        SF.fieldScreen = "equip";
        SF._fieldSig = "";
        paint(SF.state);
      });
    });
  }
}

function addButton(parent, label, ghost, fn) {
  var btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = label;
  if (ghost) btn.className = "ghost";
  btn.addEventListener("click", function () {
    if (window.Sfx) Sfx.play("ui");
    fn();
  });
  parent.appendChild(btn);
}

function onRoot(id) {
  var s = SF.state;
  if (id === "resume") {
    SF.closeFieldMenu();
    return;
  }
  if (id === "save") {
    SF.fieldNote = SF.saveGame() ? "Saved." : "Could not save.";
    SF._fieldSig = "";
    paint(s);
    return;
  }
  if (id === "more") {
    SF.fieldScreen = "more";
    SF.fieldNote = "";
    SF._fieldSig = "";
    paint(s);
    return;
  }
  if (id === "news") {
    if (SF.openNews) SF.openNews();
    return;
  }
  if (id === "install") {
    if (SF.promptInstall) SF.promptInstall();
    else SF.fieldNote = "Android Chrome: menu > Install app / Add to home screen.\niOS Safari: Share > Add to Home Screen.\nDesktop Chrome/Edge: install icon in the address bar.";
    SF._fieldSig = "";
    paint(s);
    return;
  }
  if (id === "settings") {
    if (SF.openSettings) SF.openSettings();
    return;
  }
  if (id === "load") {
    var data = SF.readSave();
    if (!data) {
      SF.fieldNote = "No saved journey yet.";
      SF._fieldSig = "";
      paint(s);
      return;
    }
    var next = SF.fresh();
    if (!SF.applySave(next, data)) return;
    next.mode = "play";
    next.camX = next.player.x;
    next.camY = next.player.y;
    SF.state = next;
    SF.pushToast("Journey restored.");
    return;
  }
  if (id === "hand") {
    s.mode = "play";
    if (SF.openHand) SF.openHand();
    return;
  }
  if (id === "calm") {
    SF.setReduceFlash(!SF.reduceFlash);
    SF._fieldSig = "";
    paint(SF.state);
    return;
  }
  if (id === "title") {
    SF.saveGame({ silent: true });
    s.mode = "title";
    s.camX = 190;
    s.camY = -170;
    return;
  }
  SF.fieldScreen = id;
  SF.fieldNote = "";
  SF._fieldSig = "";
  paint(s);
}

function ensureDom() {
  if (typeof document === "undefined") return;
  if (document.getElementById("fieldmenu")) return;
  var el = document.createElement("div");
  el.id = "fieldmenu";
  el.hidden = true;
  el.innerHTML = '<div class="card menu-sheet sf-window" id="field-card"><h2 id="field-title">Menu</h2><p id="field-gold"></p><p id="field-note"></p><div id="field-body" class="menu-scroll"></div><div class="menu-foot"><button id="field-back" type="button">Back</button></div></div>';
  var host = document.getElementById("chrome") || document.getElementById("app") || document.body;
  host.appendChild(el);
  el.addEventListener("pointerdown", function (e) {
    if (e.target !== el) return;
    SF.closeFieldMenu();
  });
  document.getElementById("field-back").addEventListener("click", function () {
    if (SF.fieldScreen === "root") {
      SF.closeFieldMenu();
      return;
    }
    if (SF.fieldScreen === "equip-pick") SF.fieldScreen = "equip";
    else if (SF.fieldScreen === "item-who") SF.fieldScreen = "items";
    else if (SF.fieldScreen === "more" || SF.fieldScreen === "hints") SF.fieldScreen = SF.fieldScreen === "hints" ? "more" : "root";
    else SF.fieldScreen = "root";
    SF._fieldSig = "";
    if (SF.state) paint(SF.state);
  });
}

var basePause = SF.pauseGame;
SF.pauseGame = function () {
  var s = SF.state;
  if (!s || s.mode === "title" || s.mode === "pause" || s.mode === "fieldmenu") return;
  if (s.mode === "battle" || s.mode === "results") {
    SF.saveGame({ silent: true });
    return;
  }
  if (s.mode === "play") {
    SF.openFieldMenu();
    return;
  }
  if (basePause) basePause();
};

var baseSync = SF.syncUI;
SF.syncUI = function () {
  if (baseSync) baseSync();
  var el = typeof document !== "undefined" && document.getElementById("fieldmenu");
  if (!el || !SF.state) return;
  var open = SF.state.mode === "fieldmenu";
  el.hidden = !open;
  if (open) paint(SF.state);
};

ensureDom();
if (typeof document !== "undefined" && document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", ensureDom);
}
