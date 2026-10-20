"use strict";

var SF = window.SF || {};
window.SF = SF;

var MUSIC_FADE = 1.2;

function hz(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function at(bpm, beats) {
  return beats * (60 / bpm);
}

function toneNote(bpm, beat, durBeats, midi, type, gain, attack, extra) {
  var note = {
    t: at(bpm, beat),
    d: at(bpm, durBeats),
    f: hz(midi),
    type: type || "sine",
    g: gain,
    a: attack || 0.02
  };
  if (extra) {
    if (extra.slide != null) note.slide = hz(extra.slide);
    if (extra.harm) note.harm = extra.harm;
    if (extra.harmG) note.harmG = extra.harmG;
    if (extra.echo) note.echo = extra.echo;
  }
  return note;
}

function chordChanges(bpm, chords, index, add) {
  var out = [];
  var i;
  add = add || 0;
  for (i = 0; i < chords.length; i++) {
    out.push({ t: at(bpm, i * 8), f: hz(chords[i][index] + add) });
  }
  return out;
}

function buildEmberhold() {
  var bpm = 74;
  var chords = [[55, 59, 62], [50, 54, 57], [52, 55, 59], [48, 52, 55]];
  var notes = [];
  var b, chord, tone;
  for (b = 0; b < 32; b++) {
    chord = chords[Math.floor(b / 8)];
    tone = chord[b % 3] + 12;
    notes.push(toneNote(bpm, b, 0.42, tone, "sine", 0.016, 0.02));
    if (b % 4 === 0) notes.push(toneNote(bpm, b, 0.55, chord[0] - 12, "sine", 0.046, 0.012));
    if (b % 4 === 2) notes.push(toneNote(bpm, b, 0.32, chord[2] - 12, "sine", 0.028, 0.012));
  }
  var melody = [
    [4, 1.05, 71], [5.2, 0.95, 74], [6.3, 0.5, 71], [6.9, 0.55, 69], [7.6, 1.3, 67],
    [9.2, 0.95, 66], [10.3, 0.95, 69], [11.4, 0.45, 67], [12, 0.55, 66], [12.7, 1.15, 64], [14.1, 1.55, 62],
    [16.2, 0.95, 67], [17.3, 0.95, 71], [18.4, 0.45, 69], [19, 0.55, 67], [19.7, 1.15, 64], [21.1, 1.7, 67],
    [24.2, 0.95, 64], [25.3, 0.95, 67], [26.4, 0.95, 69], [27.5, 0.45, 67], [28.1, 0.55, 64], [28.8, 1.1, 62], [30.15, 1.45, 67]
  ];
  var i, m;
  for (i = 0; i < melody.length; i++) {
    m = melody[i];
    notes.push(toneNote(bpm, m[0], m[1], m[2], "triangle", 0.04, 0.03, { harm: 2, harmG: 0.16, echo: 0.13 }));
  }
  return {
    bpm: bpm,
    loop: at(bpm, 32),
    notes: notes,
    drones: [
      { type: "triangle", g: 0.026, changes: chordChanges(bpm, chords, 0, 0) },
      { type: "sine", g: 0.02, changes: chordChanges(bpm, chords, 2, 0) },
      { type: "sine", g: 0.014, changes: chordChanges(bpm, chords, 1, 12) }
    ]
  };
}

function buildCinderveil() {
  var bpm = 102;
  var chords = [[50, 53, 57], [46, 53, 58], [41, 48, 53], [48, 52, 55]];
  var notes = [];
  var ost = [62, 65, 69, 65, 62, 65, 67, 65];
  var b, step, chord;
  for (b = 0; b < 32; b++) {
    notes.push({
      t: at(bpm, b),
      d: b % 2 === 0 ? 0.14 : 0.08,
      f: b % 2 === 0 ? 130 : 90,
      slide: 48,
      type: "sine",
      g: b % 4 === 0 ? 0.07 : 0.04,
      a: 0.004
    });
    chord = chords[Math.floor(b / 8)];
    if (b % 4 === 0) notes.push(toneNote(bpm, b, 0.4, chord[0] - 12, "triangle", 0.04, 0.01));
  }
  for (step = 0; step < 64; step++) {
    notes.push(toneNote(bpm, step * 0.5, 0.22, ost[step % ost.length], "triangle", step % 4 === 0 ? 0.03 : 0.02, 0.012));
  }
  var embers = [[2, 81], [10, 77], [18, 84], [26, 79]];
  for (b = 0; b < embers.length; b++) {
    notes.push(toneNote(bpm, embers[b][0], 0.7, embers[b][1], "sine", 0.016, 0.01, { harm: 2, harmG: 0.2 }));
  }
  return {
    bpm: bpm,
    loop: at(bpm, 32),
    filter: 1900,
    notes: notes,
    bed: { kind: "ash", g: 0.03, lfo: 0.09, lfoAmt: 240 },
    drones: [
      { type: "sine", g: 0.03, changes: chordChanges(bpm, chords, 0, 0) },
      { type: "triangle", g: 0.018, changes: chordChanges(bpm, chords, 2, 0) }
    ]
  };
}

function buildSail() {
  var bpm = 90;
  var chords = [[57, 61, 64], [52, 56, 59], [54, 57, 61], [50, 54, 57]];
  var notes = [];
  var b, chord, wave;
  for (b = 0; b < 32; b++) {
    chord = chords[Math.floor(b / 8)];
    wave = [0, 2, 1, 2][b % 4];
    notes.push(toneNote(bpm, b, 0.55, chord[wave] + 12, "sine", 0.02, 0.03));
    notes.push(toneNote(bpm, b + 0.5, 0.4, chord[(wave + 1) % 3] + 24, "sine", 0.012, 0.02));
    if (b % 4 === 0) notes.push(toneNote(bpm, b, 0.7, chord[0] - 12, "triangle", 0.04, 0.02));
  }
  var melody = [
    [0.25, 0.7, 76], [1, 0.7, 81], [1.75, 0.5, 85], [2.4, 1.2, 81],
    [4.25, 0.7, 80], [5, 0.7, 78], [5.75, 0.5, 76], [6.4, 1.3, 73],
    [8.25, 0.7, 76], [9, 0.7, 78], [9.75, 0.7, 81], [10.6, 1.2, 85],
    [12.25, 0.7, 83], [13, 0.7, 81], [13.75, 0.6, 78], [14.5, 1.2, 76],
    [16.25, 0.7, 73], [17, 0.7, 76], [17.75, 0.7, 78], [18.6, 1.2, 81],
    [20.25, 0.7, 78], [21, 0.7, 76], [21.75, 0.6, 73], [22.5, 1.2, 69],
    [24.25, 0.7, 74], [25, 0.7, 76], [25.75, 0.7, 78], [26.6, 1.1, 81],
    [28.25, 0.8, 76], [29.2, 0.8, 73], [30.1, 1.5, 69]
  ];
  var i, m;
  for (i = 0; i < melody.length; i++) {
    m = melody[i];
    notes.push(toneNote(bpm, m[0], m[1], m[2], "triangle", 0.034, 0.025, { harm: 2, harmG: 0.12, echo: 0.16 }));
  }
  return {
    bpm: bpm,
    loop: at(bpm, 32),
    notes: notes,
    bed: { kind: "wind", g: 0.026, lfo: 0.06, lfoAmt: 180 },
    drones: [
      { type: "sine", g: 0.024, changes: chordChanges(bpm, chords, 0, 0) },
      { type: "sine", g: 0.016, changes: chordChanges(bpm, chords, 2, 0) }
    ]
  };
}

function buildBoss() {
  var bpm = 112;
  var chords = [[52, 55, 59], [48, 52, 55], [43, 47, 50], [47, 50, 54]];
  var notes = [];
  var ost = [64, 67, 71, 67, 64, 67, 69, 67];
  var b, step, chord;
  for (b = 0; b < 32; b++) {
    notes.push({
      t: at(bpm, b),
      d: 0.11,
      f: b % 2 === 0 ? 150 : 110,
      slide: 46,
      type: "sine",
      g: b % 4 === 0 ? 0.075 : 0.045,
      a: 0.004
    });
    chord = chords[Math.floor(b / 8)];
    if (b % 2 === 0) notes.push(toneNote(bpm, b, 0.28, chord[0] - 12, "triangle", 0.042, 0.008));
  }
  for (step = 0; step < 64; step++) {
    notes.push(toneNote(bpm, step * 0.5, 0.18, ost[step % ost.length], "sawtooth", step % 4 === 0 ? 0.022 : 0.014, 0.008));
  }
  var melody = [
    [0, 1, 76], [1.5, 0.5, 74], [2, 1, 71], [4, 1, 74], [5.5, 0.5, 71], [6, 1.4, 67],
    [8, 1, 72], [9.5, 0.5, 71], [10, 1, 67], [12, 1, 69], [13.5, 0.5, 67], [14, 1.4, 64],
    [16, 1, 71], [18, 1, 74], [20, 1, 76], [22, 1.5, 74],
    [24, 1, 71], [26, 1, 67], [28, 1, 64], [30, 1.6, 59]
  ];
  var i, m;
  for (i = 0; i < melody.length; i++) {
    m = melody[i];
    notes.push(toneNote(bpm, m[0], m[1], m[2], "triangle", 0.03, 0.02, { harm: 2, harmG: 0.1 }));
  }
  return {
    bpm: bpm,
    loop: at(bpm, 32),
    filter: 1500,
    notes: notes,
    bed: { kind: "rumble", g: 0.02, lfo: 0.15, lfoAmt: 40 },
    drones: [
      { type: "sine", g: 0.034, changes: chordChanges(bpm, chords, 0, 0) },
      { type: "triangle", g: 0.016, changes: chordChanges(bpm, chords, 2, 0) }
    ]
  };
}

function buildTitle() {
  var bpm = 60;
  var notes = [];
  var bells = [
    [0, 2.4, 74], [2.2, 2.1, 81], [4.4, 2.3, 78],
    [8, 1.3, 74], [9.2, 1.3, 78], [10.6, 2.4, 81],
    [16, 2.2, 74], [18.4, 2, 69], [20.6, 2.2, 74],
    [24, 1.4, 78], [26, 1.6, 81], [28.2, 2.6, 74]
  ];
  var i, b;
  for (i = 0; i < bells.length; i++) {
    b = bells[i];
    notes.push(toneNote(bpm, b[0], b[1], b[2], "sine", 0.036, 0.015, { harm: 2, harmG: 0.22, echo: 0.22 }));
  }
  notes.push(toneNote(bpm, 12, 1.2, 86, "sine", 0.014, 0.02));
  notes.push(toneNote(bpm, 22, 1.4, 83, "sine", 0.012, 0.02));
  return {
    bpm: bpm,
    loop: at(bpm, 32),
    notes: notes,
    drones: [
      { type: "sine", g: 0.022, changes: [{ t: 0, f: hz(50) }] },
      { type: "sine", g: 0.016, changes: [{ t: 0, f: hz(57) }] },
      { type: "triangle", g: 0.01, changes: [{ t: 0, f: hz(66) }] }
    ]
  };
}

function buildBattle() {
  var bpm = 128;
  var chords = [[55, 59, 62], [50, 53, 57], [48, 52, 55], [53, 57, 60]];
  var notes = [];
  var ost = [67, 70, 74, 70, 67, 70, 72, 70];
  var b, step, chord;
  for (b = 0; b < 32; b++) {
    notes.push({
      t: at(bpm, b * 0.5),
      d: 0.08,
      f: b % 2 === 0 ? 180 : 120,
      slide: 70,
      type: "square",
      g: b % 4 === 0 ? 0.045 : 0.028,
      a: 0.004
    });
    chord = chords[Math.floor(b / 8)];
    if (b % 2 === 0) notes.push(toneNote(bpm, b, 0.22, chord[0] - 12, "triangle", 0.04, 0.008));
  }
  for (step = 0; step < 32; step++) {
    notes.push(toneNote(bpm, step, 0.28, ost[step % ost.length], "square", step % 4 === 0 ? 0.03 : 0.018, 0.01));
  }
  var lead = [0, 4, 8, 12, 16, 20, 24, 28];
  var tones = [79, 77, 74, 72, 76, 74, 70, 67];
  for (b = 0; b < lead.length; b++) {
    notes.push(toneNote(bpm, lead[b], 1.4, tones[b], "square", 0.028, 0.015, { harm: 2, harmG: 0.12 }));
  }
  return {
    bpm: bpm,
    loop: at(bpm, 32),
    filter: 2200,
    notes: notes,
    drones: [
      { type: "triangle", g: 0.03, changes: chordChanges(bpm, chords, 0, 0) },
      { type: "square", g: 0.012, changes: chordChanges(bpm, chords, 2, 0) }
    ]
  };
}

var THEMES = {
  emberhold: buildEmberhold(),
  cinderveil: buildCinderveil(),
  sail: buildSail(),
  boss: buildBoss(),
  battle: buildBattle(),
  title: buildTitle()
};

var noiseBuffer = null;

function sharedNoise(ctx) {
  if (noiseBuffer && noiseBuffer.sampleRate === ctx.sampleRate) return noiseBuffer;
  var len = ctx.sampleRate * 2;
  noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
  var data = noiseBuffer.getChannelData(0);
  var i;
  for (i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return noiseBuffer;
}

function playNote(ctx, dest, when, n) {
  if (!n || !n.f || n.f < 20) return;
  var dur = Math.max(0.04, n.d || 0.1);
  var attack = n.a != null ? n.a : 0.02;
  if (attack < 0.004) attack = 0.004;
  if (dur < attack + 0.02) dur = attack + 0.02;
  var peak = Math.max(0.0002, n.g || 0.02);
  var osc = ctx.createOscillator();
  var g = ctx.createGain();
  osc.type = n.type || "sine";
  osc.frequency.setValueAtTime(n.f, when);
  if (n.slide && n.slide > 20) {
    osc.frequency.exponentialRampToValueAtTime(n.slide, when + dur * 0.86);
  }
  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(peak, when + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  osc.connect(g);
  g.connect(dest);
  osc.start(when);
  osc.stop(when + dur + 0.03);
  if (n.harm) {
    playNote(ctx, dest, when, { f: n.f * n.harm, d: dur, g: peak * (n.harmG || 0.2), type: "sine", a: attack });
  }
  if (n.echo) {
    playNote(ctx, dest, when + n.echo, { f: n.f, d: dur * 0.8, g: peak * 0.22, type: n.type, a: attack });
  }
}

function makeDrone(ctx, dest, spec, when) {
  var osc = ctx.createOscillator();
  var g = ctx.createGain();
  var first = spec.changes && spec.changes.length ? spec.changes[0].f : 220;
  osc.type = spec.type || "sine";
  osc.frequency.setValueAtTime(first, when);
  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, spec.g || 0.02), when + 0.45);
  osc.connect(g);
  g.connect(dest);
  osc.start(when);
  return {
    osc: osc,
    set: function (freq, time) {
      if (!freq || freq < 20) return;
      try {
        osc.frequency.cancelScheduledValues(time);
        osc.frequency.setValueAtTime(Math.max(20, osc.frequency.value), time);
        osc.frequency.exponentialRampToValueAtTime(freq, time + 0.14);
      } catch (err) {
        osc.frequency.value = freq;
      }
    },
    stop: function (time) {
      try { osc.stop(time + 0.05); } catch (err) { /* already stopped */ }
    }
  };
}

function makeBed(ctx, dest, bed, when) {
  var src = ctx.createBufferSource();
  var filter = ctx.createBiquadFilter();
  var g = ctx.createGain();
  var lfo = null;
  src.buffer = sharedNoise(ctx);
  src.loop = true;
  if (bed.kind === "wind") {
    filter.type = "bandpass";
    filter.frequency.value = 520;
    filter.Q.value = 0.45;
  } else if (bed.kind === "rumble") {
    filter.type = "lowpass";
    filter.frequency.value = 220;
    filter.Q.value = 0.4;
  } else {
    filter.type = "bandpass";
    filter.frequency.value = 640;
    filter.Q.value = 0.55;
  }
  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, bed.g || 0.02), when + 0.7);
  if (bed.lfo) {
    lfo = ctx.createOscillator();
    var lg = ctx.createGain();
    lfo.frequency.value = bed.lfo;
    lg.gain.value = bed.lfoAmt || 80;
    lfo.connect(lg);
    lg.connect(filter.frequency);
    lfo.start(when);
  }
  src.connect(filter);
  filter.connect(g);
  g.connect(dest);
  src.start(when);
  return {
    stop: function (time) {
      try { src.stop(time + 0.02); } catch (err) { /* already stopped */ }
      if (lfo) try { lfo.stop(time + 0.02); } catch (err2) { /* already stopped */ }
    }
  };
}

function ThemePlayer(spec) {
  this.spec = spec;
  this.drones = [];
  this.bed = null;
  this.timer = 0;
  this.stopped = false;
  this.bus = null;
  this.origin = 0;
  this.scheduledUntil = 0;
}

ThemePlayer.prototype.start = function (when) {
  var ctx = SF.audio.ctx;
  var spec = this.spec;
  this.bus = ctx.createGain();
  this.bus.gain.setValueAtTime(0.0001, when);
  this.bus.gain.exponentialRampToValueAtTime(1, when + MUSIC_FADE);
  if (spec.filter) {
    var filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = spec.filter;
    filter.Q.value = 0.5;
    this.bus.connect(filter);
    filter.connect(SF.audio.music);
  } else {
    this.bus.connect(SF.audio.music);
  }
  this.origin = when;
  this.scheduledUntil = when;
  var self = this;
  var i;
  this.drones = [];
  if (spec.drones) {
    for (i = 0; i < spec.drones.length; i++) this.drones.push(makeDrone(ctx, this.bus, spec.drones[i], when));
  }
  if (spec.bed) this.bed = makeBed(ctx, this.bus, spec.bed, when);
  this.pump();
  this.timer = setInterval(function () { self.pump(); }, 80);
};

ThemePlayer.prototype.pump = function () {
  if (this.stopped || !SF.audio.ctx) return;
  var ctx = SF.audio.ctx;
  var now = ctx.currentTime;
  if (this.scheduledUntil < now - 0.05) this.scheduledUntil = now;
  var ahead = now + 0.32;
  if (this.scheduledUntil >= ahead) return;
  var spec = this.spec;
  var loop = spec.loop;
  var startLoop = Math.floor((this.scheduledUntil - this.origin) / loop);
  var endLoop = Math.floor((ahead - this.origin) / loop);
  var k, i, base, when, note, drone, change;
  if (startLoop < 0) startLoop = 0;
  for (k = startLoop; k <= endLoop; k++) {
    base = this.origin + k * loop;
    for (i = 0; i < spec.notes.length; i++) {
      note = spec.notes[i];
      when = base + note.t;
      if (when < this.scheduledUntil || when >= ahead) continue;
      playNote(ctx, this.bus, when, note);
    }
    for (i = 0; i < this.drones.length; i++) {
      drone = spec.drones[i];
      if (!drone.changes) continue;
      for (var c = 0; c < drone.changes.length; c++) {
        change = drone.changes[c];
        when = base + change.t;
        if (when <= this.origin + 0.001) continue;
        if (when < this.scheduledUntil || when >= ahead) continue;
        this.drones[i].set(change.f, when);
      }
    }
  }
  this.scheduledUntil = ahead;
};

ThemePlayer.prototype.fadeOut = function (dur) {
  if (this.stopped || !this.bus || !SF.audio.ctx) {
    this.dispose();
    return;
  }
  var ctx = SF.audio.ctx;
  var now = ctx.currentTime;
  var g = this.bus.gain;
  var current = g.value;
  if (!(current > 0.0001)) current = 0.0001;
  try {
    g.cancelScheduledValues(now);
    g.setValueAtTime(current, now);
    g.exponentialRampToValueAtTime(0.0001, now + dur);
  } catch (err) {
    g.value = 0;
  }
  var self = this;
  setTimeout(function () { self.dispose(); }, Math.ceil(dur * 1000) + 60);
};

ThemePlayer.prototype.dispose = function () {
  if (this.stopped) return;
  this.stopped = true;
  if (this.timer) clearInterval(this.timer);
  this.timer = 0;
  var when = SF.audio.ctx ? SF.audio.ctx.currentTime : 0;
  var i;
  for (i = 0; i < this.drones.length; i++) this.drones[i].stop(when);
  if (this.bed) this.bed.stop(when);
  this.drones = [];
  this.bed = null;
};

var Music = {
  names: ["title", "emberhold", "cinderveil", "sail", "boss", "battle"],
  _want: null,
  _live: null,
  _player: null,

  play: function (name) {
    if (!THEMES[name]) return;
    if (!SF.audio) return;
    if (this._want === name && (this._live === name || !SF.audio.unlocked)) return;
    this._want = name;
    if (!SF.audio.unlocked) return;
    if (this._live === name) return;
    this._go(name);
  },

  _go: function (name) {
    if (!THEMES[name]) return;
    var ctx = SF.audio.context();
    if (!ctx) return;
    this._want = name;
    this._live = name;
    var prev = this._player;
    var player = new ThemePlayer(THEMES[name]);
    this._player = player;
    try {
      player.start(ctx.currentTime + 0.02);
    } catch (err) {
      player.dispose();
      this._player = prev;
      this._live = null;
      return;
    }
    if (prev) prev.fadeOut(MUSIC_FADE);
  },

  stop: function () {
    this._want = null;
    this._live = null;
    if (this._player) this._player.fadeOut(0.45);
    this._player = null;
  },

  current: function () {
    return this._want || this._live || null;
  },

  setVolume: function (v) {
    SF.audio.setMusicVolume(v);
  }
};

window.Music = Music;
SF.Music = Music;
