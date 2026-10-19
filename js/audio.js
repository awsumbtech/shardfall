"use strict";

var SF = window.SF || {};
window.SF = SF;

SF.sfx = {
  ctx: null,
  master: null,
  muted: false,
  pad: null,

  ensure: function () {
    if (this.muted) return null;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      if (!this.ctx) {
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.2;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
      return this.ctx;
    } catch (err) {
      return null;
    }
  },

  tone: function (freq, dur, type, gain, slide) {
    var ctx = this.ensure();
    if (!ctx || !this.master) return;
    var t = ctx.currentTime;
    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, t);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  },

  noise: function (dur, gain) {
    var ctx = this.ensure();
    if (!ctx || !this.master) return;
    var n = Math.floor(ctx.sampleRate * dur);
    var buffer = ctx.createBuffer(1, n, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var src = ctx.createBufferSource();
    src.buffer = buffer;
    var filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 900;
    var g = ctx.createGain();
    g.gain.value = gain;
    src.connect(filter);
    filter.connect(g);
    g.connect(this.master);
    src.start();
  },

  swing: function () {
    this.noise(0.08, 0.15);
    this.tone(520, 0.09, "triangle", 0.05, 240);
  },

  hit: function () {
    this.tone(680, 0.07, "square", 0.04, 180);
  },

  hurt: function () {
    this.tone(180, 0.16, "sawtooth", 0.05, 70);
  },

  dash: function () {
    this.tone(240, 0.14, "sine", 0.06, 720);
  },

  pickup: function () {
    this.tone(660, 0.08, "sine", 0.05);
    var self = this;
    setTimeout(function () { self.tone(880, 0.12, "sine", 0.05); }, 70);
  },

  lamp: function () {
    this.tone(392, 0.4, "sine", 0.06);
    this.tone(494, 0.5, "sine", 0.04);
    this.tone(587, 0.7, "triangle", 0.04);
  },

  level: function () {
    this.tone(523, 0.1, "triangle", 0.05);
    var self = this;
    setTimeout(function () { self.tone(659, 0.1, "triangle", 0.05); }, 90);
    setTimeout(function () { self.tone(784, 0.18, "triangle", 0.05); }, 180);
  },

  talk: function () {
    this.tone(740, 0.04, "sine", 0.03);
  },

  death: function () {
    this.tone(300, 0.25, "sine", 0.05, 90);
  },

  ui: function () {
    this.tone(500, 0.05, "sine", 0.03);
  },

  setMuted: function (muted) {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : 0.2;
    try {
      window.localStorage.setItem(SF.MUTE_KEY, muted ? "1" : "0");
    } catch (err) {
      /* private mode */
    }
  },

  loadMute: function () {
    try {
      this.muted = window.localStorage.getItem(SF.MUTE_KEY) === "1";
    } catch (err) {
      this.muted = false;
    }
  }
};

SF.emit = function (name) {
  var fn = SF.sfx[name];
  if (typeof fn === "function") {
    try {
      fn.call(SF.sfx);
    } catch (err) {
      /* audio is optional */
    }
  }
};
