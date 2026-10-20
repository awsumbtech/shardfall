"use strict";

var SF = window.SF || {};
window.SF = SF;

SF.MUSIC_VOL_KEY = "shardfall.musicVol";
SF.SFX_VOL_KEY = "shardfall.sfxVol";
SF.HAPTICS_KEY = "shardfall.haptics";

function clamp01(n) {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function unitVolume(v) {
  var n = Number(v);
  if (!isFinite(n)) return null;
  if (n > 1) n = n / 100;
  return clamp01(n);
}

function rampGain(param, value, ctx) {
  var now = ctx.currentTime;
  var next = Math.max(0, value);
  try {
    param.cancelScheduledValues(now);
    param.setValueAtTime(param.value, now);
    param.linearRampToValueAtTime(next, now + 0.05);
  } catch (err) {
    param.value = next;
  }
}

SF.audio = {
  ctx: null,
  master: null,
  music: null,
  sfx: null,
  muted: false,
  unlocked: false,
  musicVol: 0.75,
  sfxVol: 0.8,

  store: function () {
    var ls = null;
    try {
      ls = SF.storage ? SF.storage() : window.localStorage;
    } catch (err) {
      ls = null;
    }
    return ls;
  },

  load: function () {
    var ls = this.store();
    if (ls) {
      this.muted = ls.getItem(SF.MUTE_KEY) === "1";
      var mv = parseFloat(ls.getItem(SF.MUSIC_VOL_KEY));
      var sv = parseFloat(ls.getItem(SF.SFX_VOL_KEY));
      if (isFinite(mv)) this.musicVol = clamp01(mv);
      if (isFinite(sv)) this.sfxVol = clamp01(sv);
    }
    if (window.Haptics && Haptics.load) Haptics.load();
    this.applyGains(true);
  },

  applyGains: function (instant) {
    if (!this.ctx) return;
    if (instant) {
      if (this.master) this.master.gain.value = this.muted ? 0 : 1;
      if (this.music) this.music.gain.value = this.musicVol;
      if (this.sfx) this.sfx.gain.value = this.sfxVol;
      return;
    }
    if (this.master) rampGain(this.master.gain, this.muted ? 0 : 1, this.ctx);
    if (this.music) rampGain(this.music.gain, this.musicVol, this.ctx);
    if (this.sfx) rampGain(this.sfx.gain, this.sfxVol, this.ctx);
  },

  context: function () {
    if (this.ctx) return this.ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      this.ctx = new AC({ latencyHint: "interactive" });
      this.master = this.ctx.createGain();
      this.music = this.ctx.createGain();
      this.sfx = this.ctx.createGain();
      this.comp = this.ctx.createDynamicsCompressor();
      this.comp.threshold.value = -10;
      this.comp.knee.value = 18;
      this.comp.ratio.value = 2.4;
      this.comp.attack.value = 0.01;
      this.comp.release.value = 0.22;
      this.music.connect(this.master);
      this.sfx.connect(this.master);
      this.master.connect(this.comp);
      this.comp.connect(this.ctx.destination);
      this.applyGains(true);
      return this.ctx;
    } catch (err) {
      this.ctx = null;
      return null;
    }
  },

  unlock: function () {
    var ctx = this.context();
    if (!ctx) return null;
    if (ctx.state === "suspended") {
      try {
        var resumed = ctx.resume();
        if (resumed && resumed.catch) resumed.catch(function () {});
      } catch (err) {
        /* autoplay can refuse until a later tap */
      }
    }
    if (!this.unlocked) {
      this.unlocked = true;
      try {
        var buf = ctx.createBuffer(1, 8, ctx.sampleRate);
        var src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(this.master);
        src.start(0);
      } catch (err2) {
        /* the resume above is the important part */
      }
      if (window.Music && Music._want) Music._go(Music._want);
    }
    return ctx;
  },

  setMuted: function (muted) {
    this.muted = !!muted;
    this.applyGains(false);
    var ls = this.store();
    if (!ls) return;
    try {
      ls.setItem(SF.MUTE_KEY, this.muted ? "1" : "0");
    } catch (err) {
      /* private mode */
    }
  },

  setMusicVolume: function (v) {
    var n = unitVolume(v);
    if (n == null) return;
    this.musicVol = n;
    this.applyGains(false);
    var ls = this.store();
    if (!ls) return;
    try {
      ls.setItem(SF.MUSIC_VOL_KEY, String(Math.round(n * 100) / 100));
    } catch (err) {
      /* private mode */
    }
  },

  setSfxVolume: function (v) {
    var n = unitVolume(v);
    if (n == null) return;
    this.sfxVol = n;
    this.applyGains(false);
    var ls = this.store();
    if (!ls) return;
    try {
      ls.setItem(SF.SFX_VOL_KEY, String(Math.round(n * 100) / 100));
    } catch (err) {
      /* private mode */
    }
  },

  onVisibility: function () {
    if (!this.ctx || !this.unlocked) return;
    if (typeof document !== "undefined" && document.hidden) {
      try { this.ctx.suspend(); } catch (err) { /* already stopped */ }
    } else {
      try {
        var resumed = this.ctx.resume();
        if (resumed && resumed.catch) resumed.catch(function () {});
      } catch (err2) {
        /* resume on the next tap */
      }
    }
  }
};

SF.sfx = {
  ensure: function () { return SF.audio.unlock(); },
  setMuted: function (muted) { SF.audio.setMuted(muted); },
  loadMute: function () { SF.audio.load(); }
};

Object.defineProperty(SF.sfx, "muted", {
  configurable: true,
  get: function () { return SF.audio.muted; },
  set: function (v) { SF.audio.setMuted(!!v); }
});

SF.emit = function (name) {
  if (!window.Sfx || !name) return;
  var map = { swing: "whoosh", hit: "impact", talk: "blip" };
  var id = map[name] || name;
  var opts = null;
  if (id === "blip" && SF.state && SF.state.dialogue && SF.state.dialogue.speaker) {
    opts = { speaker: SF.state.dialogue.speaker };
  }
  try {
    Sfx.play(id, opts);
  } catch (err) {
    /* audio is optional */
  }
};

if (typeof document !== "undefined") {
  var unlockGesture = function () { SF.audio.unlock(); };
  document.addEventListener("pointerdown", unlockGesture, true);
  document.addEventListener("keydown", unlockGesture, true);
  document.addEventListener("touchend", unlockGesture, true);
  document.addEventListener("visibilitychange", function () { SF.audio.onVisibility(); });
}
