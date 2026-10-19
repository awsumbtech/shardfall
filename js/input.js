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
  interactEdge: false
};

SF.readMove = function () {
  var i = SF.inputState;
  var x = i.stickX + i.keysX;
  var y = i.stickY + i.keysY;
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

  document.getElementById("btn-pause").addEventListener("pointerdown", function (e) {
    e.preventDefault();
    SF.sfx.ensure();
    if (SF.state && SF.state.mode === "pause") SF.resumeGame();
    else SF.pauseGame();
  });
  document.getElementById("btn-mute").addEventListener("pointerdown", function (e) {
    e.preventDefault();
    SF.toggleMute();
  });
  document.getElementById("btn-patch").addEventListener("pointerdown", function (e) {
    e.preventDefault();
    SF.openNews();
  });

  window.addEventListener("keydown", function (e) {
    var s = SF.state;
    if (!s) return;
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(e.code) !== -1) e.preventDefault();
    SF.sfx.ensure();
    if (e.repeat) return;
    SF.inputState.keys.add(e.code);
    SF.syncKeyAxes();
    if (SF.uiModal) {
      if (e.code === "Escape") SF.closeModal();
      return;
    }
    if (s.mode === "title") return;
    if (s.mode === "dialogue" || s.mode === "cutscene") {
      if (e.code === "Space" || e.code === "Enter" || e.code === "KeyE") SF.inputState.interactEdge = true;
      if (e.code === "Escape" && s.mode === "dialogue") SF.pauseGame();
      return;
    }
    if (e.code === "KeyJ" || e.code === "KeyZ") SF.inputState.attackKey = true;
    if (e.code === "KeyK" || e.code === "Space") SF.inputState.dashEdge = true;
    if (e.code === "KeyE" || e.code === "Enter") SF.inputState.interactEdge = true;
    if (e.code === "Escape") {
      if (s.mode === "pause") SF.resumeGame();
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
  });

  window.addEventListener("blur", function () {
    SF.inputState.attack = false;
    SF.inputState.attackKey = false;
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
    return e.target && e.target.closest && e.target.closest(".scroll");
  }
  document.addEventListener("touchmove", function (e) {
    if (!allowScroll(e)) e.preventDefault();
  }, { passive: false });
  document.addEventListener("gesturestart", function (e) { e.preventDefault(); });
  document.addEventListener("gesturechange", function (e) { e.preventDefault(); });
  document.addEventListener("wheel", function (e) {
    if (!allowScroll(e)) e.preventDefault();
  }, { passive: false });
  document.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  document.addEventListener("selectstart", function (e) {
    if (!allowScroll(e)) e.preventDefault();
  });
};
