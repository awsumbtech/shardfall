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
  // A pointer press is ignored when it began before the command menu, or
  // in this window after the menu appeared. The decision uses the press
  // start, so lifting later still does not act.
  MENU_LOCK_MS: 250,
  // Share of a damaging readout spent on the impact frame. The turn
  // machine reads this. It does not read anything the renderer stored.
  IMPACT_PORTION: 0.2,
  // Soft hit tint. Alpha starts here and falls to 0 over FLASH_TINT_MS.
  // Time, not frames, so a 120Hz phone still shows it.
  FLASH_TINT: 0.35,
  FLASH_TINT_MS: 100,

  now: function () {
    if (typeof performance !== "undefined" && performance.now) return performance.now();
    return Date.now();
  },

  readoutSeconds: function () {
    return SF.BattleFeel.readoutPlan(false).shown;
  },

  // full is the animation length. shown is how much of the clock is left
  // when a hit also asks for a frame freeze. Both come from this config.
  readoutPlan: function (hitLanded) {
    var full = SF.Battle && SF.Battle.instant ? 0 : SF.BattleFeel.READOUT;
    var shown = full;
    var pause = 0;
    if (!(SF.Battle && SF.Battle.instant)) pause = SF.BattleFeel.hitPauseMs();
    if (hitLanded && pause > 0 && full > 0) {
      shown = full * (1 - SF.BattleFeel.IMPACT_PORTION);
    }
    return { full: full, shown: shown };
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
