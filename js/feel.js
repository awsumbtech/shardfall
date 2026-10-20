"use strict";

var SF = window.SF || {};
window.SF = SF;

var foeSeen = null;
var stepFromX = null;
var stepFromY = null;
var stepAcc = 0;

function cueMusic(s) {
  if (!window.Music) return;
  var cur = Music.current();
  if (s.mode === "title") {
    if (cur !== "title") Music.play("title");
    return;
  }
  if (s.mode === "pause") return;
  if (!cur || cur === "title") Music.play("emberhold");
}

function watchFoes(s) {
  if (!s.enemies || !window.Sfx) return;
  var i, e, alive, died;
  if (!foeSeen) {
    foeSeen = {};
    for (i = 0; i < s.enemies.length; i++) {
      e = s.enemies[i];
      foeSeen[e.id] = !!(e.alive && e.dying <= 0);
    }
    return;
  }
  died = false;
  for (i = 0; i < s.enemies.length; i++) {
    e = s.enemies[i];
    alive = !!(e.alive && e.dying <= 0);
    if (foeSeen[e.id] && !alive) died = true;
    foeSeen[e.id] = alive;
  }
  if (died) Sfx.play("enemyDeath");
}

function stepSounds(s) {
  var p = s.player;
  if (!p || !window.Sfx) return;
  if (stepFromX == null) {
    stepFromX = p.x;
    stepFromY = p.y;
    return;
  }
  var dist = Math.hypot(p.x - stepFromX, p.y - stepFromY);
  stepFromX = p.x;
  stepFromY = p.y;
  if (s.mode !== "play" || p.dashT > 0 || p.fall > 0 || dist < 0.35) {
    if (dist < 0.2) stepAcc = 0;
    return;
  }
  stepAcc += dist;
  if (stepAcc >= 40) {
    stepAcc = 0;
    Sfx.play("footstep");
  }
}

SF.feel = function () {
  var s = SF.state;
  if (!s) return;
  cueMusic(s);
  watchFoes(s);
  stepSounds(s);
};
