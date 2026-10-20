"use strict";

var SF = window.SF || {};
window.SF = SF;

var Haptics = {
  enabled: true,

  supported: function () {
    return typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
  },

  load: function () {
    var ls = SF.audio && SF.audio.store ? SF.audio.store() : null;
    if (!ls) return;
    this.enabled = ls.getItem(SF.HAPTICS_KEY) !== "0";
  },

  setEnabled: function (on) {
    this.enabled = !!on;
    var ls = SF.audio && SF.audio.store ? SF.audio.store() : null;
    if (!ls) return;
    try {
      ls.setItem(SF.HAPTICS_KEY, this.enabled ? "1" : "0");
    } catch (err) {
      /* private mode */
    }
  },

  pulse: function (pattern) {
    if (!this.enabled || !this.supported()) return;
    try {
      navigator.vibrate(pattern);
    } catch (err) {
      /* some browsers throw if vibration is blocked */
    }
  }
};

window.Haptics = Haptics;
SF.Haptics = Haptics;
