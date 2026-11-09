"use strict";

// DevSeed pins encounters and battle rolls to one mulberry32 stream.
// The hooks are installed only after a seed is set, and only in ?dev=1.
// Clearing the seed puts Math.random and the battle RNG back.
var SF = window.SF || {};
window.SF = SF;

SF.DevSeed = {
  owner: "DevSeed",
  seed: null,
  _attached: false,
  _dev: false,
  _rand: null,
  _origRandom: null,
  _origFlow: null,

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
    if (SF.DevSeed._origRandom) {
      Math.random = SF.DevSeed._origRandom;
      SF.DevSeed._origRandom = null;
    }
    if (SF.DevSeed._origFlow && SF.Battle && SF.Battle.flow) {
      SF.Battle.flow.rng = SF.DevSeed._origFlow;
      SF.DevSeed._origFlow = null;
    }
  },

  _install: function () {
    if (!SF.DevSeed._origRandom) {
      SF.DevSeed._origRandom = Math.random;
      Math.random = function () {
        if (SF.DevSeed._rand) return SF.DevSeed._rand();
        return SF.DevSeed._origRandom();
      };
    } else {
      SF.DevSeed._rand = SF.mulberry32(SF.DevSeed.seed);
    }
    if (SF.Battle && SF.Battle.flow && !SF.DevSeed._origFlow) {
      SF.DevSeed._origFlow = SF.Battle.flow.rng;
      SF.Battle.flow.rng = function (seed) {
        if (SF.DevSeed._rand) return SF.mulberry32(SF.DevSeed.seed);
        return SF.DevSeed._origFlow(seed);
      };
    }
  }
};
