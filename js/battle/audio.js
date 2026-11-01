"use strict";

// Audio and haptics for combat. Rules emit events. This adapter plays them.
// crit-ready stays reserved on BattleEvents and is not subscribed here.
var SF = window.SF || {};
window.SF = SF;

(function () {
  if (!SF.BattleEvents || SF.BattleEvents._audio) return;
  SF.BattleEvents._audio = true;
  var ev = SF.BattleEvents;

  ev.on("battle-start", function (p) {
    if (window.Music) Music.play(p && p.boss ? "boss" : "battle");
    if (p && p.boss && window.Sfx) Sfx.play("roar");
  });

  ev.on("hit", function (p) {
    if (!p || !p.cue) return;
    if (window.Sfx) Sfx.play(p.tgtSide === "party" ? "hurt" : "impact");
    if (window.Haptics) Haptics.pulse(12);
  });

  ev.on("levelup", function () {
    if (window.Sfx) Sfx.play("level");
  });

  ev.on("battle-win", function () {
    if (window.Sfx) Sfx.play("fanfare");
  });

  SF.Battle = SF.Battle || {};
  SF.Battle.Audio = { installed: true };
})();
