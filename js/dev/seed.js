"use strict";

// DevSeed pins encounter rolls and battle rolls to one mulberry32 seed.
// The hooks are installed only after a seed is set, and only in ?dev=1.
// Math.random is left alone, so particles, sound, and music stay on the
// page's own generator. Clearing the seed puts the encounter roll and the
// battle RNG back.
var SF = window.SF || {};
window.SF = SF;

SF.DevSeed = {
  owner: "DevSeed",
  seed: null,
  _attached: false,
  _dev: false,
  _rand: null,
  _roll: null,
  _wrappedRoll: null,
  _origFlow: null,
  _wrappedFlow: null,

  attach: function () {
    if (SF.DevSeed._attached) return;
    SF.DevSeed._attached = true;
    if (!SF.TuningConfig || !SF.TuningConfig.devOn || !SF.TuningConfig.devOn()) return;
    SF.DevSeed._dev = true;
    if (!SF.TuningDrawer || !SF.TuningDrawer.addTab) return;
    SF.TuningDrawer.addTab("seed", "Seed", function (host) {
      var input = document.createElement("input");
      var set = document.createElement("button");
      var clear = document.createElement("button");
      var note = document.createElement("p");
      input.setAttribute("id", "tune-seed");
      input.setAttribute("type", "number");
      input.setAttribute("aria-label", "Fixed seed");
      input.className = "tune-seed";
      set.className = "tune-bool";
      clear.className = "tune-bool";
      set.setAttribute("type", "button");
      clear.setAttribute("type", "button");
      set.setAttribute("id", "tune-seed-set");
      clear.setAttribute("id", "tune-seed-clear");
      set.textContent = "Set seed";
      clear.textContent = "Clear seed";
      note.setAttribute("id", "tune-seed-note");
      note.hidden = true;
      set.addEventListener("click", function () {
        var n = Number(input.value);
        if (input.value === "" || n !== n) {
          SF.DevSeed.clear();
          note.hidden = false;
          note.textContent = "Seed cleared.";
          return;
        }
        SF.DevSeed.set(n);
        note.hidden = false;
        note.textContent = "Seed " + SF.DevSeed.seed + ".";
      });
      clear.addEventListener("click", function () {
        input.value = "";
        SF.DevSeed.clear();
        note.hidden = false;
        note.textContent = "Seed cleared.";
      });
      host.appendChild(input);
      host.appendChild(set);
      host.appendChild(clear);
      host.appendChild(note);
    });
  },

  active: function () {
    return !!(SF.DevSeed._dev && SF.DevSeed._rand);
  },

  set: function (n) {
    if (!SF.DevSeed._dev || !SF.mulberry32) return false;
    SF.DevSeed.seed = n >>> 0;
    SF.DevSeed._rand = SF.mulberry32(SF.DevSeed.seed);
    SF.DevSeed._install();
    return true;
  },

  clear: function () {
    SF.DevSeed.seed = null;
    SF.DevSeed._rand = null;
    if (SF.DevSeed._roll && SF.rollEncounter === SF.DevSeed._wrappedRoll) {
      SF.rollEncounter = SF.DevSeed._roll;
    }
    SF.DevSeed._roll = null;
    SF.DevSeed._wrappedRoll = null;
    if (SF.DevSeed._origFlow && SF.Battle && SF.Battle.flow && SF.Battle.flow.rng === SF.DevSeed._wrappedFlow) {
      SF.Battle.flow.rng = SF.DevSeed._origFlow;
    }
    SF.DevSeed._origFlow = null;
    SF.DevSeed._wrappedFlow = null;
  },

  _install: function () {
    if (SF.rollEncounter && !SF.DevSeed._roll) {
      SF.DevSeed._roll = SF.rollEncounter;
      SF.DevSeed._wrappedRoll = function (s, zone, rand) {
        if (SF.DevSeed.seed != null && rand == null && SF.DevSeed._rand) {
          return SF.DevSeed._roll.call(SF, s, zone, SF.DevSeed._rand);
        }
        return SF.DevSeed._roll.call(SF, s, zone, rand);
      };
      SF.rollEncounter = SF.DevSeed._wrappedRoll;
    } else if (SF.DevSeed.seed != null) {
      SF.DevSeed._rand = SF.mulberry32(SF.DevSeed.seed);
    }
    if (SF.Battle && SF.Battle.flow && !SF.DevSeed._origFlow) {
      SF.DevSeed._origFlow = SF.Battle.flow.rng;
      SF.DevSeed._wrappedFlow = function (seed) {
        if (SF.DevSeed.seed != null) return SF.mulberry32(SF.DevSeed.seed);
        return SF.DevSeed._origFlow(seed);
      };
      SF.Battle.flow.rng = SF.DevSeed._wrappedFlow;
    }
  }
};
