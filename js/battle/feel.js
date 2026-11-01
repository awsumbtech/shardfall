"use strict";

// BattleFeel is presentation timing, not rules. Readouts used to be 1.05s
// (0.70s while Reduce flashing is on) because the screen overwrote the turn
// machine after every action. They are 0.55s now. Holding past HOLD_SKIP_MS
// fast-forwards; a tap still skips one readout.
// Hit pause defaults to 60ms. prefers-reduced-motion, and SF.reduceMotion,
// skip the freeze. The event still fires so a later effect can follow it.
var SF = window.SF || {};
window.SF = SF;

SF.BattleFeel = {
  READOUT_BEFORE: 1.05,
  READOUT_BEFORE_CALM: 0.7,
  READOUT: 0.55,
  HIT_PAUSE_MS: 60,
  HOLD_SKIP_MS: 180,

  now: function () {
    if (typeof performance !== "undefined" && performance.now) return performance.now();
    return Date.now();
  },

  readoutSeconds: function () {
    if (SF.Battle && SF.Battle.instant) return 0;
    return SF.BattleFeel.READOUT;
  },

  prefersReducedMotion: function () {
    if (SF.reduceMotion) return true;
    if (typeof window === "undefined" || !window.matchMedia) return false;
    try {
      return !!window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (err) {
      return false;
    }
  },

  hitPauseMs: function () {
    if (SF.BattleFeel.prefersReducedMotion()) return 0;
    var ms = SF.Battle && SF.Battle.hitPauseMs != null ? SF.Battle.hitPauseMs : SF.BattleFeel.HIT_PAUSE_MS;
    if (!(ms >= 0)) ms = 60;
    return ms;
  }
};
