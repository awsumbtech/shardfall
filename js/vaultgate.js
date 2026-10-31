"use strict";

// Collision gate for the Cinderveil vault. Shapes marked `seal` stay drawn
// and stay in the ground walk test. Until the named flag is set they count
// as sky for movement, zones, and saves.
var SF = window.SF || {};
window.SF = SF;

(function () {
  function holds(sh, x, y, margin) {
    var m = margin || 0;
    if (sh.k === "r" || (sh.w != null && sh.rx == null)) {
      return x >= sh.x + m && y >= sh.y + m && x <= sh.x + sh.w - m && y <= sh.y + sh.h - m;
    }
    var rx = (sh.rx || sh.r) - m;
    var ry = (sh.ry || sh.rx || sh.r) - m;
    if (rx <= 1 || ry <= 1) return false;
    var dx = (x - sh.x) / rx;
    var dy = (y - sh.y) / ry;
    return dx * dx + dy * dy <= 1;
  }

  function shapes() {
    var pack = SF.ISLANDS && SF.ISLANDS.cinderveil;
    var walk = pack && pack.walk;
    if (!walk) return [];
    return (walk.circles || []).concat(walk.rects || []);
  }

  SF.vaultSealedAt = function (x, y, island) {
    var isle = island || SF.islandId;
    if (isle !== "cinderveil") return false;
    if (SF.state && SF.state.flags && SF.state.flags.vaultOpen) return false;
    var list = shapes();
    var margin = SF.WALK_MARGIN || 0;
    var i, sh;
    for (i = 0; i < list.length; i++) {
      sh = list[i];
      if (!sh.seal) continue;
      if (SF.state && SF.state.flags && SF.state.flags[sh.seal]) continue;
      if (holds(sh, x, y, margin)) return true;
    }
    return false;
  };

  var groundWalk = SF.walkable;
  var groundZone = SF.zoneAt;
  SF.groundWalkable = groundWalk;

  SF.walkable = function (x, y) {
    if (SF.vaultSealedAt(x, y)) return false;
    return groundWalk ? groundWalk(x, y) : false;
  };

  SF.zoneAt = function (x, y) {
    var zone = groundZone ? groundZone(x, y) : { id: "hush", name: "The Hush" };
    var spec = zone && SF.ZONES ? SF.ZONES[zone.id] : null;
    var flags = (SF.state && SF.state.flags) || {};
    if (spec && spec.opens && !flags[spec.opens]) return { id: "hush", name: "The Hush" };
    return zone;
  };
})();
