"use strict";

// TuningConfig loads data/tuning.json and keeps the live numbers on SF.tune.
// The fallback below is today's game. A failed or offline fetch leaves it in
// place. The drawer is the only writer. This file does not change rules.
var SF = window.SF || {};
window.SF = SF;

SF.TuningConfig = (function () {
  // Hard-coded fallback. Keep these equal to data/tuning.json.
  var ROWS = [
    { id: "walkSpeed", label: "Walk speed", value: 150, min: 40, max: 320, step: 5 },
    { id: "dashSpeed", label: "Dash speed", value: 562.5, min: 200, max: 1200, step: 0.5 },
    { id: "hitPause", label: "Hit pause", value: 60, min: 0, max: 240, step: 5 },
    { id: "hitFlash", label: "Hit flash", value: 2, min: 0, max: 8, step: 1 },
    { id: "shakePx", label: "Shake strength", value: 3, min: 0, max: 16, step: 0.5 },
    { id: "killFreeze", label: "Kill freeze", value: 9, min: 0, max: 24, step: 1 },
    { id: "killSlow", label: "Kill slow-mo", value: 0.22, min: 0.05, max: 1, step: 0.01 },
    { id: "readout", label: "Battle readout", value: 0.55, min: 0.1, max: 1.6, step: 0.05 },
    { id: "encounterRate", label: "Encounter rate", value: 1, min: 0, max: 3, step: 0.05 },
    { id: "damageScale", label: "Damage scale", value: 1, min: 0.25, max: 3, step: 0.05 }
  ];
  var KEY = "shardfall.tune";

  function devOn() {
    var search = "";
    try { search = (typeof location !== "undefined" && location && location.search) || ""; }
    catch (err) { return false; }
    return /(?:\?|&)dev=1(?:&|$)/.test(search);
  }

  function storage() {
    try {
      if (typeof localStorage === "undefined" || !localStorage) return null;
      return localStorage;
    } catch (err) {
      return null;
    }
  }

  function rowById(id) {
    var i;
    for (i = 0; i < ROWS.length; i++) if (ROWS[i].id === id) return ROWS[i];
    return null;
  }

  function same(row, value) {
    if (!row) return false;
    if (typeof row.value === "boolean") return !!value === row.value;
    return typeof value === "number" && value === row.value;
  }

  function clamp(row, value) {
    if (!row) return value;
    if (typeof row.value === "boolean") return !!value;
    var n = typeof value === "number" ? value : Number(value);
    if (n !== n) return row.value;
    if (typeof row.min === "number") n = Math.max(row.min, n);
    if (typeof row.max === "number") n = Math.min(row.max, n);
    return n;
  }

  function applyDefaults() {
    var tune = {};
    var i;
    for (i = 0; i < ROWS.length; i++) tune[ROWS[i].id] = ROWS[i].value;
    SF.tune = tune;
  }

  function applyFile(file) {
    var list = file && file.values;
    var i, row, known;
    if (!list || !list.length) return;
    for (i = 0; i < list.length; i++) {
      known = rowById(list[i] && list[i].id);
      if (!known) continue;
      if (typeof known.value === "boolean") {
        if (typeof list[i].value === "boolean") SF.tune[known.id] = list[i].value;
        continue;
      }
      if (typeof list[i].value === "number") SF.tune[known.id] = clamp(known, list[i].value);
    }
  }

  applyDefaults();

  return {
    owner: "TuningConfig",
    key: KEY,
    rows: ROWS,
    _attached: false,
    _file: null,

    devOn: devOn,

    hookEncounter: function () {
      if (SF.TuningConfig._enc || typeof SF.encounterMul !== "function") return;
      SF.TuningConfig._enc = true;
      var inner = SF.encounterMul;
      SF.encounterMul = function () {
        var base = inner.call(SF);
        var pace = SF.tune && typeof SF.tune.encounterRate === "number" ? SF.tune.encounterRate : 1;
        return base * pace;
      };
    },

    attach: function () {
      if (SF.TuningConfig._attached) return SF.TuningConfig._pending || Promise.resolve(SF.tune);
      SF.TuningConfig._attached = true;
      var self = SF.TuningConfig;
      self.hookEncounter();
      self._pending = self.pull().then(function () {
        if (devOn()) self.applyOverrides(self.readOverrides());
        if (SF.TuningDrawer && SF.TuningDrawer.refresh) SF.TuningDrawer.refresh();
        return SF.tune;
      });
      return self._pending;
    },

    pull: function () {
      var self = this;
      if (typeof fetch !== "function") {
        applyDefaults();
        return Promise.resolve(SF.tune);
      }
      return fetch("data/tuning.json").then(function (res) {
        if (!res || !res.ok) throw new Error("tune");
        return res.json();
      }).then(function (file) {
        applyDefaults();
        self._file = file;
        applyFile(file);
        return SF.tune;
      }).catch(function () {
        self._file = null;
        applyDefaults();
        return SF.tune;
      });
    },

    readOverrides: function () {
      var store = storage();
      var raw, parsed, out, id, row;
      out = {};
      if (!store) return out;
      try { raw = store.getItem(KEY); } catch (err) { return out; }
      if (!raw) return out;
      try { parsed = JSON.parse(raw); } catch (err) { return out; }
      if (!parsed || typeof parsed !== "object") return out;
      for (id in parsed) {
        if (!Object.prototype.hasOwnProperty.call(parsed, id)) continue;
        row = rowById(id);
        if (!row) continue;
        out[id] = clamp(row, parsed[id]);
      }
      return out;
    },

    writeOverrides: function (obj) {
      var store = storage();
      var keys;
      if (!store) return;
      keys = Object.keys(obj || {});
      try {
        if (!keys.length) store.removeItem(KEY);
        else store.setItem(KEY, JSON.stringify(obj));
      } catch (err) { /* a full disk keeps the live numbers */ }
    },

    applyOverrides: function (obj) {
      var id;
      if (!obj) return;
      for (id in obj) {
        if (!Object.prototype.hasOwnProperty.call(obj, id)) continue;
        if (rowById(id)) SF.tune[id] = obj[id];
      }
    },

    overrides: function () {
      var out = {};
      var i, row;
      for (i = 0; i < ROWS.length; i++) {
        row = ROWS[i];
        if (!same(row, SF.tune[row.id])) out[row.id] = SF.tune[row.id];
      }
      return out;
    },

    set: function (id, value) {
      var row = rowById(id);
      var next, over;
      if (!row) return value;
      next = clamp(row, value);
      SF.tune[id] = next;
      over = this.readOverrides();
      if (same(row, next)) delete over[id];
      else over[id] = next;
      this.writeOverrides(over);
      return next;
    },

    reset: function () {
      this.writeOverrides({});
      applyDefaults();
      if (this._file) applyFile(this._file);
      if (SF.TuningDrawer && SF.TuningDrawer.refresh) SF.TuningDrawer.refresh();
    }
  };
})();
