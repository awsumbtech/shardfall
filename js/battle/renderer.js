"use strict";

// BattleRenderer turns combat events into the presentation record on the
// battle (pops, hurt ids, WEAK/RESIST tags, the flash list, hit pause).
// It never reads HP. BattleUI draws that record. Rules emit "action"
// before they apply a command; this module opens the record.
var SF = window.SF || {};
window.SF = SF;

(function () {
function battle() {
  return SF.state && SF.state.battle;
}

function artOf() {
  var b = battle();
  if (!b || !b.art) return null;
  return b.art;
}

SF.BattleRenderer = {
  // Opens a clean record when the rules emit "action", before the hits.
  begin: function (b, actor, action) {
    if (!b) return;
    var skill = null;
    if (action && action.skillId) skill = SF.skillById(action.skillId);
    else if (action && (action.type === "skill" || action.type === "attack")) skill = SF.skillById("attack");
    var pose = "attack";
    if (action && (action.type === "defend" || action.type === "flee")) pose = "idle";
    else if (skill && (skill.mag || skill.heal || skill.scan || skill.defUp || skill.spdUp)) pose = "cast";
    else if (action && action.type === "item") pose = "cast";
    var element = (skill && skill.element) || "";
    if (!element && action && action.itemId && SF.ITEMS && SF.ITEMS[action.itemId]) {
      element = SF.ITEMS[action.itemId].element || "";
    }
    b.art = {
      id: actor && actor.id,
      pose: pose,
      hurt: [],
      element: element,
      pops: [],
      tags: [],
      flash: []
    };
  },

  install: function () {
    if (SF.BattleRenderer._installed || !SF.BattleEvents) return;
    SF.BattleRenderer._installed = true;
    var ev = SF.BattleEvents;
    ev.on("hit", function (p) {
      var art = artOf();
      if (!art || !p || !p.tgt) return;
      if (art.hurt.indexOf(p.tgt) < 0) art.hurt.push(p.tgt);
      if (art.flash.indexOf(p.tgt) < 0) art.flash.push(p.tgt);
      if (p.element) art.element = p.element;
      art.pops.push({ id: p.tgt, text: p.amount, heal: false });
    });
    ev.on("weak", function (p) {
      var art = artOf();
      if (!art || !p || !p.tgt) return;
      art.tags.push({ id: p.tgt, text: "WEAK" });
    });
    ev.on("resist", function (p) {
      var art = artOf();
      if (!art || !p || !p.tgt) return;
      art.tags.push({ id: p.tgt, text: "RESIST" });
    });
    ev.on("heal", function (p) {
      var art = artOf();
      if (!art || !p || !p.tgt || !(p.amount > 0)) return;
      if (p.kind === "sp") return;
      art.pops.push({ id: p.tgt, text: p.amount, heal: true });
    });
    ev.on("hit-pause", function (p) {
      var b = battle();
      if (!b || !p) return;
      if (SF.Battle && SF.Battle.instant) return;
      b.hitPause = Math.max(0, (p.ms || 0) / 1000);
    });
    ev.on("action", function (p) {
      var b = battle();
      if (!b || !p) return;
      var actor = SF.BattleState.actorById(b, p.actorId);
      SF.BattleRenderer.begin(b, actor, p.action);
    });
  }
};

SF.BattleRenderer.install();
  SF.Battle = SF.Battle || {};
  SF.Battle.Renderer = SF.BattleRenderer;
  SF.Battle.screen = { battle: battle, artOf: artOf };
})();
