"use strict";

var SF = window.SF || {};
window.SF = SF;

SF.uiModal = null;
SF._yes = null;
SF.pauseNote = "";

SF.loadCalm = function () {
  SF.reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var store = SF.storage();
  var stored = store ? store.getItem(SF.FLASH_KEY) : null;
  SF.reduceFlash = stored == null ? true : stored !== "0";
};

SF.calm = function () {
  return !!(SF.reduceFlash || SF.reduceMotion);
};

SF.setReduceFlash = function (on) {
  SF.reduceFlash = !!on;
  var store = SF.storage();
  if (store) store.setItem(SF.FLASH_KEY, SF.reduceFlash ? "1" : "0");
  SF.syncUI();
};

SF.toggleMute = function () {
  SF.sfx.setMuted(!SF.sfx.muted);
  SF.sfx.ensure();
  SF.emit("ui");
  SF.syncUI();
};

SF.settingsOpen = function () {
  var el = document.getElementById("settings");
  return !!(el && !el.hidden);
};

SF.openSettings = function () {
  var el = document.getElementById("settings");
  if (!el) return;
  el.hidden = false;
  document.body.dataset.settings = "1";
  SF.syncUI();
};

SF.closeSettings = function () {
  var el = document.getElementById("settings");
  if (el) el.hidden = true;
  document.body.dataset.settings = "0";
  SF.emit("ui");
  SF.syncUI();
};

SF.pauseGame = function () {
  var s = SF.state;
  if (!s || s.mode === "title" || s.mode === "pause") return;
  SF.releaseHolds();
  s.pausedFrom = s.mode;
  s.mode = "pause";
  SF.pauseNote = "";
  SF.saveGame({ silent: true });
};

SF.resumeGame = function () {
  var s = SF.state;
  if (!s || s.mode !== "pause") return;
  if (SF.uiModal) return;
  s.mode = s.pausedFrom || "play";
  if (s.mode === "pause" || s.mode === "title") s.mode = "play";
  SF.pauseNote = "";
};

SF.openNews = function () {
  var s = SF.state;
  var resume = false;
  if (s && (s.mode === "play" || s.mode === "dialogue" || s.mode === "cutscene")) {
    SF.pauseGame();
    resume = true;
  }
  SF.uiModal = { kind: "news", resume: resume };
  SF.syncUI();
};

SF.ask = function (text, yesLabel, yes) {
  SF._yes = yes;
  SF.uiModal = { kind: "confirm", text: text, yesLabel: yesLabel || "Yes" };
  SF.syncUI();
};

SF.closeModal = function () {
  var modal = SF.uiModal;
  SF.uiModal = null;
  SF._yes = null;
  if (modal && modal.resume) SF.resumeGame();
  SF.syncUI();
};

SF.beginNew = function () {
  SF.uiModal = null;
  SF._yes = null;
  SF.state = SF.fresh();
  var s = SF.state;
  s.mode = "play";
  s.camX = s.player.x;
  s.camY = s.player.y;
  SF.saveGame({ silent: true });
  SF.sfx.ensure();
  if (SF.startDialogue) SF.startDialogue("emberhold.wake");
  SF.syncUI();
};

SF.beginContinue = function () {
  var data = SF.readSave();
  if (!data) return;
  SF.uiModal = null;
  var s = SF.fresh();
  if (!SF.applySave(s, data)) return;
  s.mode = "play";
  s.camX = s.player.x;
  s.camY = s.player.y;
  SF.state = s;
  SF.pushToast("The island kept your place.");
  SF.sfx.ensure();
  SF.syncUI();
};

SF.bindUI = function () {
  document.getElementById("continue").addEventListener("click", function () {
    SF.sfx.ensure();
    SF.emit("ui");
    SF.beginContinue();
  });
  document.getElementById("newgame").addEventListener("click", function () {
    SF.sfx.ensure();
    SF.emit("ui");
    if (SF.hasSave()) {
      SF.ask("Start over? Your saved journey on this browser will be replaced.", "Start over", SF.beginNew);
    } else SF.beginNew();
  });
  document.getElementById("title-news").addEventListener("click", function () {
    SF.sfx.ensure();
    SF.openNews();
  });
  function bindCalm(id) {
    document.getElementById(id).addEventListener("click", function () {
      SF.sfx.ensure();
      SF.emit("ui");
      SF.setReduceFlash(!SF.reduceFlash);
    });
  }
  bindCalm("title-calm");
  bindCalm("pause-calm");
  bindCalm("set-calm");
  function openSettingsFrom(id) {
    document.getElementById(id).addEventListener("click", function () {
      SF.sfx.ensure();
      SF.emit("ui");
      SF.openSettings();
    });
  }
  openSettingsFrom("title-settings");
  openSettingsFrom("pause-settings");
  document.getElementById("set-close").addEventListener("click", SF.closeSettings);
  document.getElementById("set-haptics").addEventListener("click", function () {
    SF.sfx.ensure();
    SF.emit("ui");
    if (window.Haptics) {
      Haptics.setEnabled(!Haptics.enabled);
      if (Haptics.enabled) Haptics.pulse(12);
    }
    SF.syncUI();
  });
  function bindRange(id, numId, apply) {
    var el = document.getElementById(id);
    var num = document.getElementById(numId);
    el.addEventListener("input", function () {
      SF.sfx.ensure();
      if (num) num.textContent = el.value;
      apply(Number(el.value) / 100);
    });
  }
  bindRange("music-vol", "music-vol-num", function (v) { SF.audio.setMusicVolume(v); });
  bindRange("sfx-vol", "sfx-vol-num", function (v) { SF.audio.setSfxVolume(v); });
  document.getElementById("title-reset").addEventListener("click", function () {
    SF.sfx.ensure();
    SF.ask("Erase the saved journey from this browser?", "Erase", function () {
      SF.wipeSave();
      SF.uiModal = null;
      SF.state = SF.fresh();
      SF.state.mode = "title";
      SF.syncUI();
    });
  });
  document.getElementById("resume").addEventListener("click", function () {
    SF.emit("ui");
    SF.resumeGame();
  });
  document.getElementById("pause-news").addEventListener("click", SF.openNews);
  document.getElementById("pause-save").addEventListener("click", function () {
    if (SF.saveGame({ silent: true })) SF.pauseNote = "Saved.";
    SF.syncUI();
  });
  document.getElementById("pause-load").addEventListener("click", function () {
    var data = SF.readSave();
    if (!data) {
      SF.pauseNote = "No saved journey yet.";
      SF.syncUI();
      return;
    }
    var s = SF.fresh();
    if (!SF.applySave(s, data)) return;
    s.mode = "play";
    s.camX = s.player.x;
    s.camY = s.player.y;
    SF.state = s;
    SF.pushToast("Journey restored.");
    SF.syncUI();
  });
  document.getElementById("pause-reset").addEventListener("click", function () {
    SF.ask("Erase the saved journey from this browser?", "Erase", function () {
      SF.wipeSave();
      SF.uiModal = null;
      SF.state = SF.fresh();
      SF.state.mode = "title";
      SF.syncUI();
    });
  });
  document.getElementById("pause-title").addEventListener("click", function () {
    SF.saveGame({ silent: true });
    SF.state.mode = "title";
    SF.state.camX = 190;
    SF.state.camY = -170;
    SF.syncUI();
  });
  document.getElementById("dialogue").addEventListener("pointerdown", function (e) {
    if (e.target.closest && e.target.closest("#dlg-choices button")) return;
    e.preventDefault();
    SF.advanceDialogue();
  });
  document.getElementById("skip").addEventListener("pointerdown", function (e) {
    e.preventDefault();
    if (SF.state && SF.state.mode === "voyage" && SF.finishVoyage) SF.finishVoyage();
    else SF.skipCutscene();
  });
  var sailClose = document.getElementById("sail-close");
  if (sailClose && !SF.bindWorldUI) {
    sailClose.addEventListener("click", function () {
      if (SF.state && SF.state.mode === "sailmenu") SF.state.mode = "play";
      SF.syncUI();
    });
  }
  document.getElementById("hand-close").addEventListener("click", function () {
    SF.closeHand();
    SF.syncUI();
  });
  document.getElementById("pause-hand").addEventListener("click", function () {
    SF.emit("ui");
    if (SF.state) SF.state.mode = "play";
    SF.openHand();
    SF.syncUI();
  });
  document.getElementById("modal-close").addEventListener("click", SF.closeModal);
  document.getElementById("modal-yes").addEventListener("click", function () {
    var yes = SF._yes;
    SF.uiModal = null;
    SF._yes = null;
    if (yes) yes();
    SF.syncUI();
  });
  document.getElementById("modal-no").addEventListener("click", SF.closeModal);

  var news = document.getElementById("news-body");
  SF.WHATS_NEW.forEach(function (line) {
    var p = document.createElement("p");
    p.textContent = line;
    news.appendChild(p);
  });
};

SF.touchPrimary = function () {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  try {
    if (window.matchMedia("(pointer: coarse)").matches) return true;
    if (window.matchMedia("(hover: none)").matches) return true;
  } catch (err) {
    return false;
  }
  return false;
};

SF.presentCoach = function (line) {
  if (!line) return "";
  if (!SF.touchPrimary()) return line;
  return String(line)
    .replace(/\s*,?\s*or press WASD/gi, "")
    .replace(/\s*,?\s*or WASD/gi, "")
    .replace(/\s*,?\s*or E\b/gi, "")
    .replace(/\s*,?\s*or K\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
};

SF.interactLabel = function (s) {
  if (!s || s.mode !== "play" || !SF.actionFor) return "Talk";
  var act = SF.actionFor(s, SF.nearestInteract());
  if (act && act.name) return act.label + "\n" + act.name;
  return (act && act.label) || "Talk";
};

function showPlaceBanner(name) {
  var el = document.getElementById("place-banner");
  if (!el) return;
  el.hidden = false;
  setText("place-banner", name);
  el.classList.remove("show");
  void el.offsetWidth;
  el.classList.add("show");
  clearTimeout(SF._placeTimer);
  SF._placeTimer = setTimeout(function () {
    el.classList.remove("show");
    el.hidden = true;
  }, (SF.calm && SF.calm()) ? 1500 : 2200);
}

SF.syncUI = function () {
  var s = SF.state;
  if (!s) return;
  document.body.dataset.mode = s.mode;
  document.body.dataset.modal = SF.uiModal ? "1" : "0";

  var title = document.getElementById("title");
  title.hidden = s.mode !== "title";
  var saved = SF.hasSave();
  document.getElementById("continue").hidden = !saved;
  document.getElementById("title-reset").hidden = !saved;

  var pause = document.getElementById("pause");
  pause.hidden = s.mode !== "pause" || !!SF.uiModal;
  if (s.mode === "pause") {
    var p = s.player;
    document.getElementById("pause-stats").textContent =
      "Lv " + p.level + "  ·  Heart " + Math.ceil(p.hp) + "/" + p.maxHp +
      "  ·  Strike " + p.atk + "  ·  Shards " + s.shardsHeld +
      "  ·  Marks " + (s.gold || 0) +
      "  ·  " + Math.floor(s.playTime / 60) + "m on the Hush";
    document.getElementById("pause-quest").textContent = SF.questText(s);
    document.getElementById("pause-note").textContent = SF.pauseNote || "";
  }

  var modal = document.getElementById("modal");
  modal.hidden = !SF.uiModal;
  if (SF.uiModal) {
    var newsMode = SF.uiModal.kind === "news";
    document.getElementById("news-body").hidden = !newsMode;
    document.getElementById("modal-title").textContent = newsMode ? "What's new in v" + SF.VERSION : "Shardfall";
    document.getElementById("modal-copy").hidden = newsMode;
    document.getElementById("modal-copy").textContent = newsMode ? "" : SF.uiModal.text;
    document.getElementById("modal-yes").hidden = newsMode;
    document.getElementById("modal-no").hidden = newsMode;
    document.getElementById("modal-close").hidden = !newsMode;
    if (!newsMode) document.getElementById("modal-yes").textContent = SF.uiModal.yesLabel || "Yes";
  }

  var dialogue = document.getElementById("dialogue");
  var showTalk = s.mode === "dialogue" && s.dialogue;
  dialogue.hidden = !showTalk;
  if (showTalk && SF.paintDialogue) SF.paintDialogue();

  var sail = document.getElementById("sail");
  if (sail) sail.hidden = s.mode !== "sailmenu";

  var hand = document.getElementById("hand");
  hand.hidden = s.mode !== "hand";
  if (s.mode === "hand" && SF.HAND_UPGRADES) {
    setText("hand-shards", "Spare shards: " + s.shardsHeld);
    var list = document.getElementById("hand-list");
    var owned = Object.keys(s.upgrades || {}).sort().join(",");
    var handSig = s.shardsHeld + "|" + owned + "|" + (s.player.grapple ? 1 : 0) + "|" + (s.player.shardstep ? 1 : 0);
    if (list.dataset.sig !== handSig) {
      list.dataset.sig = handSig;
      list.innerHTML = "";
      SF.HAND_UPGRADES.forEach(function (upgrade) {
        var row = document.createElement("button");
        row.type = "button";
        var has = !!(s.upgrades && s.upgrades[upgrade.id]);
        var locked = (upgrade.needs === "grapple" && !s.player.grapple) || (upgrade.needs === "shardstep" && !s.player.shardstep);
        row.textContent = upgrade.branch + " · " + upgrade.name + " — " + (has ? "fitted" : (upgrade.cost + " shards")) + ". " + upgrade.blurb;
        row.disabled = has || locked;
        row.addEventListener("click", function () { SF.buyUpgrade(upgrade.id); });
        list.appendChild(row);
      });
    }
  }

  var skip = document.getElementById("skip");
  skip.hidden = s.mode !== "cutscene" && s.mode !== "voyage";
  skip.textContent = s.mode === "voyage" ? "Tap to land" : "Tap to skip";

  var pstat = s.player;
  var hpPct = SF.clamp(pstat.hp / pstat.maxHp, 0, 1);
  document.getElementById("hp-fill").style.width = (hpPct * 100).toFixed(1) + "%";
  document.getElementById("hp").classList.toggle("low", hpPct < 0.3 && hpPct > 0);
  setText("hp-num", Math.max(0, Math.ceil(pstat.hp)) + "/" + pstat.maxHp);
  setText("lv", "Lv " + pstat.level);
  setText("shards", "✦ " + s.shardsHeld);
  var prev = SF.XP_NEED[pstat.level - 1] || 0;
  var next = SF.XP_NEED[pstat.level];
  var xpPct = pstat.level >= SF.XP_NEED.length ? 1 : SF.clamp((pstat.xp - prev) / ((next || prev + 1) - prev), 0, 1);
  document.getElementById("xp-fill").style.width = (xpPct * 100).toFixed(1) + "%";
  setText("questline", SF.questText(s));
  var coachRaw = SF.coachLine ? SF.coachLine(s) : "";
  var coach = SF.presentCoach ? SF.presentCoach(coachRaw) : coachRaw;
  var coachEl = document.getElementById("coach");
  if (!s.hints) s.hints = {};
  if (!s.hints.faded) s.hints.faded = {};
  if (coachEl) {
    if (!coach || s.hints.faded[coach]) {
      coachEl.hidden = true;
      coachEl.classList.remove("fading");
      s._hintText = "";
    } else {
      if (s._hintText !== coach) {
        s._hintText = coach;
        s._hintAt = SF.anim || 0;
        coachEl.classList.remove("fading");
      }
      var age = (SF.anim || 0) - (s._hintAt || 0);
      if (age > 2.4) {
        s.hints.faded[coach] = true;
        coachEl.hidden = true;
        coachEl.classList.remove("fading");
      } else {
        coachEl.hidden = false;
        setText("coach", coach);
        var calm = SF.calm && SF.calm();
        if (!calm && age > 1.6) coachEl.classList.add("fading");
        else coachEl.classList.remove("fading");
        if (calm && age > 1.7) {
          s.hints.faded[coach] = true;
          coachEl.hidden = true;
        }
      }
    }
  }
  var placeEl = document.getElementById("place-banner");
  if (s.mode === "play" && SF.zoneAt) {
    var placeName = SF.zoneAt(pstat.x, pstat.y).name || "The Hush";
    if (SF._placeName !== placeName) {
      SF._placeName = placeName;
      showPlaceBanner(placeName);
    }
  } else if (placeEl) {
    placeEl.hidden = true;
  }

  var toast = document.getElementById("toast");
  if (s.toast && s.mode !== "title") {
    toast.hidden = false;
    setText("toast", s.toast.text);
  } else toast.hidden = true;

  var banner = document.getElementById("banner");
  if (s.banner && s.mode !== "title" && s.mode !== "pause") {
    banner.hidden = false;
    setText("banner-title", s.banner.title);
    setText("banner-sub", s.banner.sub || "");
  } else banner.hidden = true;

  var hurtA = 0;
  if (s.mode === "play" && pstat.hurt > 0 && !SF.calm()) hurtA = Math.min(0.2, (pstat.hurt / 0.28) * 0.2);
  document.getElementById("hurt").style.opacity = hurtA.toFixed(3);

  var dashMax = pstat.shardstep ? SF.DASH_CD_PLUS : SF.DASH_CD;
  var dashP = dashMax <= 0 ? 0 : SF.clamp(pstat.dashCd / dashMax, 0, 1);
  var dashBtn = document.getElementById("btn-dash");
  dashBtn.style.setProperty("--p", dashP.toFixed(3));
  dashBtn.classList.toggle("plus", !!pstat.shardstep);

  var talkBtn = document.getElementById("btn-interact");
  var label = SF.interactLabel(s);
  setText("interact-label", label);
  talkBtn.setAttribute("aria-label", label.replace(/\n/g, " — "));
  talkBtn.classList.toggle("ready", s.mode === "play" && !!SF.nearestInteract());
  var calmOn = !!SF.reduceFlash;
  ["title-calm", "pause-calm", "set-calm"].forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    var text = "Reduce flashing: " + (calmOn ? "On" : "Off");
    if (el.textContent !== text) el.textContent = text;
    el.setAttribute("aria-pressed", calmOn ? "true" : "false");
  });
  document.body.dataset.calm = SF.calm() ? "1" : "0";
  document.body.dataset.grapple = pstat.grapple ? "1" : "0";
  var hookBtn = document.getElementById("btn-grapple");
  if (hookBtn && SF.GRAPPLE_CD) {
    var hookMax = (s.upgrades && s.upgrades.quickhook) ? SF.GRAPPLE_CD_PLUS : SF.GRAPPLE_CD;
    var hookP = hookMax <= 0 ? 0 : SF.clamp((pstat.grappleCd || 0) / hookMax, 0, 1);
    hookBtn.style.setProperty("--p", hookP.toFixed(3));
  }
  var hapticsOn = !(window.Haptics) || Haptics.enabled;
  var hap = document.getElementById("set-haptics");
  if (hap) {
    var hapText = "Haptics: " + (hapticsOn ? "On" : "Off");
    if (hap.textContent !== hapText) hap.textContent = hapText;
    hap.setAttribute("aria-pressed", hapticsOn ? "true" : "false");
  }
  syncRange("music-vol", "music-vol-num", SF.audio ? SF.audio.musicVol : 0.75);
  syncRange("sfx-vol", "sfx-vol-num", SF.audio ? SF.audio.sfxVol : 0.8);

  document.getElementById("btn-mute").classList.toggle("is-muted", !!SF.sfx.muted);
  document.getElementById("btn-mute").setAttribute("aria-pressed", SF.sfx.muted ? "true" : "false");
  var flash = document.getElementById("saved");
  flash.hidden = !(s.savedFlash > 0 && s.mode === "play");
};

function setText(id, text) {
  var el = document.getElementById(id);
  if (el && el.textContent !== text) el.textContent = text;
}

function syncRange(id, numId, value) {
  var el = document.getElementById(id);
  if (!el || document.activeElement === el) return;
  var pct = String(Math.round((value == null ? 0 : value) * 100));
  if (el.value !== pct) el.value = pct;
  var num = document.getElementById(numId);
  if (num && num.textContent !== pct) num.textContent = pct;
}
