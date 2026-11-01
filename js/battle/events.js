"use strict";

// BattleEvents is the only channel from combat rules to the screen, audio,
// haptics, and the later effects module. Listeners must not change HP or the
// turn queue. crit-ready is reserved for a later timing window; this version
// has no crits, so the rules never emit it.
var SF = window.SF || {};
window.SF = SF;

SF.BattleEvents = (function () {
  var TYPES = {
    hit: "hit",
    "crit-ready": "crit-ready",
    weak: "weak",
    resist: "resist",
    kill: "kill",
    phase: "phase",
    heal: "heal",
    "turn-start": "turn-start",
    "hit-pause": "hit-pause"
  };
  var listeners = {};

  function bucket(type) {
    if (!listeners[type]) listeners[type] = [];
    return listeners[type];
  }

  return {
    TYPES: TYPES,
    on: function (type, fn) {
      if (!type || typeof fn !== "function") return function () {};
      var list = bucket(type);
      list.push(fn);
      return function () {
        var i = list.indexOf(fn);
        if (i >= 0) list.splice(i, 1);
      };
    },
    off: function (type, fn) {
      var list = listeners[type];
      if (!list) return;
      var i = list.indexOf(fn);
      if (i >= 0) list.splice(i, 1);
    },
    emit: function (type, payload) {
      var list = listeners[type];
      if (!list || !list.length) return;
      var copy = list.slice();
      var i;
      for (i = 0; i < copy.length; i++) copy[i](payload || {}, type);
    },
    clear: function () {
      listeners = {};
    }
  };
})();
