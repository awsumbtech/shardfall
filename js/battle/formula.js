"use strict";

// Formula is the damage math. It does not change actors. The rounding matches
// v0.4.27, including the slightly different guard rounding on items.
// There is no variance, no miss, and no crit. Bright and Broken are not inputs yet.
var SF = window.SF || {};
window.SF = SF;

SF.BattleFormula = {
  effDef: function (actor) {
    return Math.max(0, Math.round(actor.def * (actor.mods.def > 0 ? 1.3 : 1)));
  },

  elementName: function (id) {
    if (id === "ember") return "Ember";
    if (id === "tide") return "Tide";
    if (id === "gale") return "Gale";
    if (id === "shard") return "Shard";
    return "";
  },

  healAmount: function (actor, skill) {
    return skill.heal + Math.round((actor.mag || 0) / 6);
  },

  // Skill and basic attack. Guard is applied after weakness, then the hit is at least 1.
  damage: function (actor, target, skill) {
    var power = (skill.power || 10) * 1;
    var atk = skill.mag ? actor.mag : actor.atk;
    var raw = Math.round(atk * power / 10 - SF.BattleFormula.effDef(target) * 0.45);
    var element = skill.element || (!skill.mag && skill.id === "attack" ? actor.element : "");
    var note = "";
    if (element && target.weak && element === target.weak) {
      raw = Math.round(raw * 1.5);
      note = "weak";
    } else if (element && target.resist && element === target.resist) {
      raw = Math.round(raw * 0.5);
      note = "resist";
    }
    if (target.guard) raw = Math.round(raw * 0.5);
    raw = Math.max(1, raw);
    return { amount: raw, element: element || "", note: note };
  },

  // Thrown salts and the like. Resist and guard each floor at 1 on their own step.
  itemDamage: function (item, target) {
    var dmg = item.dmg;
    var note = "";
    if (item.element && target.weak === item.element) {
      dmg = Math.round(dmg * 1.5);
      note = "weak";
    } else if (item.element && target.resist === item.element) {
      dmg = Math.max(1, Math.round(dmg * 0.5));
      note = "resist";
    }
    if (target.guard) dmg = Math.max(1, Math.round(dmg * 0.5));
    return { amount: dmg, element: item.element || "", note: note };
  }
};
