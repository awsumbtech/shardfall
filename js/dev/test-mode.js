"use strict";

// TestMode has two switches. No damage stops the player losing heart.
// Encounters off stops random fights. Each decision is one check.
// The hooks are installed only when the address has ?dev=1.
var SF = window.SF || {};
window.SF = SF;

SF.TestMode = {
  owner: "TestMode",
  noDamage: false,
  encountersOff: false,
  _attached: false,
  _dev: false,

  attach: function () {
    if (SF.TestMode._attached) return;
    SF.TestMode._attached = true;
    if (!SF.TuningConfig || !SF.TuningConfig.devOn || !SF.TuningConfig.devOn()) return;
    SF.TestMode._dev = true;
    SF.TestMode._hookDamage();
    SF.TestMode._hookEncounters();
    if (!SF.TuningDrawer || !SF.TuningDrawer.addTab) return;
    SF.TuningDrawer.addTab("test", "Test", function (host) {
      host.appendChild(SF.TestMode._toggle("tune-no-damage", "No damage", "noDamage"));
      host.appendChild(SF.TestMode._toggle("tune-no-encounters", "Encounters off", "encountersOff"));
    });
  },

  // The only damage check.
  blocksDamage: function () {
    return !!(SF.TestMode._dev && SF.TestMode.noDamage);
  },

  // The only encounter check.
  blocksEncounters: function () {
    return !!(SF.TestMode._dev && SF.TestMode.encountersOff);
  },

  _hookDamage: function () {
    if (SF.hurtPlayer && !SF.TestMode._hurt) {
      SF.TestMode._hurt = true;
      var hurt = SF.hurtPlayer;
      SF.hurtPlayer = function (dmg, nx, ny, softLine) {
        if (SF.TestMode.blocksDamage()) return;
        return hurt.call(SF, dmg, nx, ny, softLine);
      };
    }
    if (SF.BattleFormula && SF.BattleFormula.damage && !SF.TestMode._formula) {
      SF.TestMode._formula = true;
      var damage = SF.BattleFormula.damage;
      SF.BattleFormula.damage = function (actor, target, skill) {
        var hit = damage.call(SF.BattleFormula, actor, target, skill);
        if (target && target.side === "party" && SF.TestMode.blocksDamage()) {
          return { amount: 0, element: hit.element || "", note: hit.note || "" };
        }
        return hit;
      };
    }
  },

  _hookEncounters: function () {
    if (!SF.rollEncounter || SF.TestMode._rolls) return;
    SF.TestMode._rolls = true;
    var roll = SF.rollEncounter;
    SF.rollEncounter = function (s, zone, rand) {
      if (SF.TestMode.blocksEncounters()) return false;
      return roll.call(SF, s, zone, rand);
    };
  },

  _toggle: function (id, label, key) {
    var button = document.createElement("button");
    function paint() {
      var on = !!SF.TestMode[key];
      button.setAttribute("aria-pressed", on ? "true" : "false");
      button.textContent = label + ": " + (on ? "On" : "Off");
    }
    button.className = "tune-bool";
    button.setAttribute("type", "button");
    button.setAttribute("id", id);
    button.addEventListener("click", function () {
      if (!SF.TestMode._dev) return;
      SF.TestMode[key] = !SF.TestMode[key];
      paint();
    });
    paint();
    return button;
  }
};
