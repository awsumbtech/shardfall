"use strict";

var SF = window.SF || {};
window.SF = SF;

SF.inputState = {
  stickX: 0,
  stickY: 0,
  stickId: null,
  keys: new Set(),
  keysX: 0,
  keysY: 0,
  attack: false,
  attackKey: false,
  dashEdge: false,
  interactEdge: false,
  grappleHold: false,
  grappleRelease: false
};

SF.pollGamepad = function () {
  var pads = navigator.getGamepads ? navigator.getGamepads() : null;
  if (!pads) return;
  var i, pad, ax, ay, btn;
  for (i = 0; i < pads.length; i++) {
    pad = pads[i];
    if (!pad) continue;
    ax = pad.axes[0] || 0;
    ay = pad.axes[1] || 0;
    if (Math.abs(ax) < 0.2) ax = 0;
    if (Math.abs(ay) < 0.2) ay = 0;
    if (pad.buttons[14] && pad.buttons[14].pressed) ax = -1;
    if (pad.buttons[15] && pad.buttons[15].pressed) ax = 1;
    if (pad.buttons[12] && pad.buttons[12].pressed) ay = -1;
    if (pad.buttons[13] && pad.buttons[13].pressed) ay = 1;
    SF.inputState.padX = ax;
    SF.inputState.padY = ay;
    function edge(index, key) {
      btn = pad.buttons[index];
      var down = !!(btn && (btn.pressed || btn.value > 0.5));
      if (down && !SF.inputState[key]) SF.inputState[key + "Edge"] = true;
      SF.inputState[key] = down;
    }
    edge(0, "padA");
    edge(1, "padB");
    edge(2, "padX");
    edge(5, "padRB");
    edge(9, "padStart");
    if (ax || ay || (pad.buttons[0] && pad.buttons[0].pressed)) {
      SF.inputState.hideTouch = true;
      if (document.body) document.body.dataset.touch = "0";
    }
  }
};

SF.readMove = function () {
  if (SF.pollGamepad) SF.pollGamepad();
  var i = SF.inputState;
  if (i.padAEdge) { i.interactEdge = true; i.padAEdge = false; }
  if (i.padBEdge) { i.padBEdge = false; }
  if (i.padXEdge) { i.dashEdge = true; i.padXEdge = false; }
  if (i.padRB && !i.padRBWas) i.grappleHold = true;
  if (!i.padRB && i.padRBWas) { i.grappleHold = false; i.grappleRelease = true; }
  i.padRBWas = !!i.padRB;
  if (i.padStartEdge) {
    i.padStartEdge = false;
    var st = SF.state;
    if (st && st.mode === "play" && SF.openFieldMenu) SF.openFieldMenu();
    else if (st && st.mode === "fieldmenu" && SF.closeFieldMenu) SF.closeFieldMenu();
    else if (st && st.mode === "pause" && SF.resumeGame) SF.resumeGame();
    else if (st && SF.pauseGame) SF.pauseGame();
  }
  var x = i.stickX + i.keysX + (i.padX || 0);
  var y = i.stickY + i.keysY + (i.padY || 0);
  var m = Math.hypot(x, y);
  if (m > 1) {
    x /= m;
    y /= m;
  }
  return { x: x, y: y };
};

SF.consumeDash = function () {
  var v = SF.inputState.dashEdge;
  SF.inputState.dashEdge = false;
  return v;
};

SF.consumeAttack = function () {
  return SF.inputState.attack || SF.inputState.attackKey;
};

SF.consumeInteract = function () {
  var v = SF.inputState.interactEdge;
  SF.inputState.interactEdge = false;
  return v;
};

SF.consumeGrapple = function () {
  var v = SF.inputState.grappleRelease;
  SF.inputState.grappleRelease = false;
  return v;
};

SF.syncKeyAxes = function () {
  var keys = SF.inputState.keys;
  var x = 0;
  var y = 0;
  if (keys.has("KeyA") || keys.has("ArrowLeft")) x -= 1;
  if (keys.has("KeyD") || keys.has("ArrowRight")) x += 1;
  if (keys.has("KeyW") || keys.has("ArrowUp")) y -= 1;
  if (keys.has("KeyS") || keys.has("ArrowDown")) y += 1;
  SF.inputState.keysX = x;
  SF.inputState.keysY = y;
};

SF.bindInput = function () {
  var zone = document.getElementById("stick-zone");
  var stick = document.getElementById("stick");
  var knob = document.getElementById("knob");

  function moveStick(e) {
    var rect = stick.getBoundingClientRect();
    var cx = rect.left + rect.width / 2;
    var cy = rect.top + rect.height / 2;
    var dx = e.clientX - cx;
    var dy = e.clientY - cy;
    var max = rect.width * 0.36;
    var mag = Math.hypot(dx, dy);
    if (mag > max) {
      dx = dx / mag * max;
      dy = dy / mag * max;
      mag = max;
    }
    knob.style.transform = "translate(" + dx + "px," + dy + "px)";
    SF.inputState.stickX = mag < 8 ? 0 : dx / max;
    SF.inputState.stickY = mag < 8 ? 0 : dy / max;
  }

  function endStick(e) {
    if (e.pointerId !== SF.inputState.stickId) return;
    SF.inputState.stickId = null;
    SF.inputState.stickX = 0;
    SF.inputState.stickY = 0;
    knob.style.transform = "translate(0px,0px)";
  }

  zone.addEventListener("pointerdown", function (e) {
    if (SF.inputState.stickId != null) return;
    SF.inputState.stickId = e.pointerId;
    zone.setPointerCapture(e.pointerId);
    SF.sfx.ensure();
    moveStick(e);
    e.preventDefault();
  });
  zone.addEventListener("pointermove", function (e) {
    if (e.pointerId === SF.inputState.stickId) moveStick(e);
  });
  zone.addEventListener("pointerup", endStick);
  zone.addEventListener("pointercancel", endStick);

  function bindButton(id, onDown, onUp) {
    var el = document.getElementById(id);
    el.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      e.stopPropagation();
      el.setPointerCapture(e.pointerId);
      SF.sfx.ensure();
      onDown();
    });
    function up(e) {
      if (onUp) onUp(e);
    }
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  }

  bindButton("btn-attack", function () { SF.inputState.attack = true; }, function () { SF.inputState.attack = false; });
  bindButton("btn-dash", function () { SF.inputState.dashEdge = true; });
  bindButton("btn-interact", function () { SF.inputState.interactEdge = true; });
  bindButton("btn-grapple", function () { SF.inputState.grappleHold = true; }, function () {
    SF.inputState.grappleHold = false;
    SF.inputState.grappleRelease = true;
  });

  document.getElementById("btn-pause").addEventListener("pointerdown", function (e) {
    e.preventDefault();
    SF.sfx.ensure();
    SF.emit("ui");
    if (SF.state && SF.state.mode === "fieldmenu" && SF.closeFieldMenu) SF.closeFieldMenu();
    else if (SF.state && SF.state.mode === "pause") SF.resumeGame();
    else SF.pauseGame();
  });
  document.getElementById("btn-mute").addEventListener("pointerdown", function (e) {
    e.preventDefault();
    SF.toggleMute();
  });
  var mapwrap = document.getElementById("mapwrap");
  if (mapwrap) {
    mapwrap.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      e.stopPropagation();
      var open = mapwrap.classList.toggle("big");
      mapwrap.setAttribute("aria-expanded", open ? "true" : "false");
      if (SF.resize) SF.resize();
    });
  }

  window.addEventListener("keydown", function (e) {
    var s = SF.state;
    if (!s) return;
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(e.code) !== -1) e.preventDefault();
    SF.sfx.ensure();
    if (SF.settingsOpen && SF.settingsOpen()) {
      if (e.code === "Escape" && SF.closeSettings) SF.closeSettings();
      return;
    }
    if (e.repeat) return;
    SF.inputState.keys.add(e.code);
    SF.syncKeyAxes();
    if (SF.uiModal) {
      if (e.code === "Escape") SF.closeModal();
      return;
    }
    if (s.mode === "title") return;
    if (s.mode === "battle" || s.mode === "results") return;
    if (s.mode === "fieldmenu") {
      if (e.code === "Escape" && SF.closeFieldMenu) SF.closeFieldMenu();
      return;
    }
    if (s.mode === "sailmenu" || s.mode === "shop" || s.mode === "inn" || s.mode === "notice") {
      if (e.code === "Escape" && SF.closeWorldPanel) SF.closeWorldPanel();
      else if (e.code === "Escape") s.mode = "play";
      return;
    }
    if (s.mode === "hand") {
      if (e.code === "Escape" && SF.closeHand) SF.closeHand();
      return;
    }
    if (s.mode === "voyage") {
      if ((e.code === "Escape" || e.code === "Space" || e.code === "Enter" || e.code === "KeyE") && SF.finishVoyage) SF.finishVoyage();
      return;
    }
    if (s.mode === "dialogue" || s.mode === "cutscene") {
      if (e.code === "Space" || e.code === "Enter" || e.code === "KeyE") SF.inputState.interactEdge = true;
      if (e.code === "Escape" && s.mode === "dialogue") SF.pauseGame();
      return;
    }
    SF.inputState.hideTouch = true;
    if (document.body) document.body.dataset.touch = "0";
    if (e.code === "KeyK" || e.code === "ShiftLeft" || e.code === "ShiftRight") SF.inputState.dashEdge = true;
    if (e.code === "KeyG") SF.inputState.grappleHold = true;
    if (e.code === "KeyE" || e.code === "Enter" || e.code === "Space") SF.inputState.interactEdge = true;
    if (e.code === "Tab") {
      e.preventDefault();
      if (SF.openFieldMenu && s.mode === "play") SF.openFieldMenu();
      else if (s.mode === "pause") SF.resumeGame();
      else SF.pauseGame();
    }
    if (e.code === "Escape") {
      if (s.mode === "fieldmenu" && SF.closeFieldMenu) SF.closeFieldMenu();
      else if (s.mode === "pause") SF.resumeGame();
      else SF.pauseGame();
    }
    if (e.code === "KeyM") SF.toggleMute();
  });

  window.addEventListener("keyup", function (e) {
    SF.inputState.keys.delete(e.code);
    SF.syncKeyAxes();
    if (e.code === "KeyJ" || e.code === "KeyZ") {
      var keys = SF.inputState.keys;
      if (!keys.has("KeyJ") && !keys.has("KeyZ")) SF.inputState.attackKey = false;
    }
    if (e.code === "KeyG") {
      SF.inputState.grappleHold = false;
      SF.inputState.grappleRelease = true;
    }
  });

  window.addEventListener("blur", function () {
    SF.inputState.attack = false;
    SF.inputState.attackKey = false;
    SF.inputState.grappleHold = false;
    SF.inputState.stickX = 0;
    SF.inputState.stickY = 0;
    SF.inputState.stickId = null;
    var knobEl = document.getElementById("knob");
    if (knobEl) knobEl.style.transform = "translate(0px,0px)";
    if (SF.state && (SF.state.mode === "play" || SF.state.mode === "dialogue" || SF.state.mode === "cutscene")) {
      SF.pauseGame();
    }
  });

  document.addEventListener("visibilitychange", function () {
    if (document.hidden && SF.state && SF.state.mode !== "title" && SF.state.mode !== "pause") {
      SF.saveGame({ silent: true });
      SF.pauseGame();
    }
  });

  function allowScroll(e) {
    if (!e.target || !e.target.closest) return false;
    if (e.target.closest("input, textarea, select")) return true;
    return !!e.target.closest(".scroll");
  }
  document.addEventListener("touchmove", function (e) {
    if (!allowScroll(e)) e.preventDefault();
  }, { passive: false });
  document.addEventListener("gesturestart", function (e) { e.preventDefault(); });
  document.addEventListener("gesturechange", function (e) { e.preventDefault(); });
  document.addEventListener("wheel", function (e) {
    if (!allowScroll(e)) e.preventDefault();
  }, { passive: false });
  var view = document.getElementById("view");
  if (view) {
    view.addEventListener("pointerdown", function (e) {
      if (e.button === 2) {
        var st = SF.state;
        if (st && st.player && st.player.grapple) SF.inputState.grappleHold = true;
        else if (st && st.mode === "dialogue" && SF.advanceDialogue) SF.advanceDialogue();
        e.preventDefault();
        return;
      }
      if (e.button !== 0) return;
      if (e.target && e.target.closest && e.target.closest("button, .scroll, #controls")) return;
      SF.inputState.interactEdge = true;
    });
    view.addEventListener("pointerup", function (e) {
      if (e.button === 2 && SF.inputState.grappleHold) {
        SF.inputState.grappleHold = false;
        SF.inputState.grappleRelease = true;
      }
    });
  }
  document.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  document.addEventListener("selectstart", function (e) {
    if (!allowScroll(e)) e.preventDefault();
  });
};
