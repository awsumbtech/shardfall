"use strict";

var SF = window.SF || {};
window.SF = SF;

var noiseBuffer = null;
var stepSide = 0;

function noise(ctx) {
  if (noiseBuffer && noiseBuffer.sampleRate === ctx.sampleRate) return noiseBuffer;
  var len = Math.floor(ctx.sampleRate * 1.5);
  noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
  var data = noiseBuffer.getChannelData(0);
  var i;
  for (i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return noiseBuffer;
}

function envGain(ctx, dest, when, dur, peak, attack) {
  var g = ctx.createGain();
  if (attack < 0.003) attack = 0.003;
  if (dur < attack + 0.02) dur = attack + 0.02;
  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), when + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  g.connect(dest);
  return g;
}

function tone(ctx, dest, when, freq, dur, type, peak, slide, attack) {
  if (!freq || freq < 20) return;
  var osc = ctx.createOscillator();
  var g = envGain(ctx, dest, when, dur, peak, attack == null ? 0.012 : attack);
  osc.type = type || "sine";
  osc.frequency.setValueAtTime(freq, when);
  if (slide && slide > 20) osc.frequency.exponentialRampToValueAtTime(slide, when + Math.max(0.04, dur * 0.85));
  osc.connect(g);
  osc.start(when);
  osc.stop(when + dur + 0.03);
}

function burst(ctx, dest, when, dur, peak, kind, rate) {
  var src = ctx.createBufferSource();
  var filter = ctx.createBiquadFilter();
  var g = envGain(ctx, dest, when, dur, peak, 0.004);
  src.buffer = noise(ctx);
  src.playbackRate.setValueAtTime(rate || (0.85 + Math.random() * 0.4), when);
  if (kind === "low") {
    filter.type = "lowpass";
    filter.frequency.value = 420;
  } else if (kind === "mid") {
    filter.type = "bandpass";
    filter.frequency.value = 900;
    filter.Q.value = 0.6;
  } else if (kind === "ash") {
    filter.type = "bandpass";
    filter.frequency.value = 280;
    filter.Q.value = 0.5;
  } else {
    filter.type = "highpass";
    filter.frequency.value = 1400;
  }
  src.connect(filter);
  filter.connect(g);
  src.start(when);
  src.stop(when + dur + 0.02);
}

var SPEAKERS = {
  "Old Maren": { f: 494, type: "sine", d: 0.05 },
  "Kestrel Vane": { f: 587, type: "triangle", d: 0.045 },
  "The Cantor": { f: 349, type: "sine", d: 0.07 },
  "Tamsin Reed": { f: 740, type: "triangle", d: 0.04 },
  "Brother Hesk": { f: 466, type: "sine", d: 0.035 },
  "Warden Ilsa": { f: 392, type: "triangle", d: 0.05 },
  "Cinder Maw": { f: 196, type: "sine", d: 0.08 },
  "The Cinder Maw": { f: 196, type: "sine", d: 0.08 },
  "Waking Stones": { f: 440, type: "sine", d: 0.055 },
  "The Waking Stones": { f: 415, type: "sine", d: 0.06 },
  "Cinderveil's Lamp": { f: 370, type: "sine", d: 0.07 },
  "A voice on the wind": { f: 330, type: "triangle", d: 0.06 },
  "The Scar": { f: 415, type: "triangle", d: 0.05 },
  "Nameplate": { f: 523, type: "sine", d: 0.04 },
  "Great Lamp": { f: 392, type: "sine", d: 0.06 }
};

function speakerVoice(name) {
  if (SPEAKERS[name]) return SPEAKERS[name];
  var scale = [392, 440, 494, 523, 587, 659, 698, 784];
  var h = 0;
  var s = String(name || "");
  var i;
  for (i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) >>> 0;
  return { f: scale[h % scale.length], type: "sine", d: 0.045 };
}

var HAPTIC = {
  impact: 12,
  hurt: 18,
  pickup: 10,
  lamp: [12, 36, 16]
};

function playNamed(ctx, dest, name, opts) {
  var now = ctx.currentTime + 0.005;
  if (name === "footstep") {
    stepSide = 1 - stepSide;
    burst(ctx, dest, now, 0.07, 0.07, "low", stepSide ? 0.75 : 1.05);
    tone(ctx, dest, now, stepSide ? 180 : 210, 0.05, "sine", 0.02, 90, 0.004);
    return;
  }
  if (name === "whoosh" || name === "swing") {
    burst(ctx, dest, now, 0.1, 0.11, "high", 1.2);
    tone(ctx, dest, now, 640, 0.11, "triangle", 0.045, 210, 0.006);
    return;
  }
  if (name === "impact" || name === "hit") {
    tone(ctx, dest, now, 168, 0.12, "sine", 0.12, 52, 0.004);
    burst(ctx, dest, now, 0.045, 0.08, "high", 1.4);
    return;
  }
  if (name === "dash") {
    burst(ctx, dest, now, 0.16, 0.07, "mid", 1.3);
    tone(ctx, dest, now, 280, 0.16, "sine", 0.05, 860, 0.01);
    return;
  }
  if (name === "grapple") {
    tone(ctx, dest, now, 420, 0.14, "triangle", 0.05, 1480, 0.004);
    tone(ctx, dest, now, 630, 0.12, "sine", 0.02, 1760, 0.004);
    burst(ctx, dest, now, 0.1, 0.04, "high", 1.6);
    return;
  }
  if (name === "latch") {
    burst(ctx, dest, now, 0.03, 0.09, "high", 1.8);
    tone(ctx, dest, now, 880, 0.07, "sine", 0.05, 0, 0.004);
    tone(ctx, dest, now + 0.045, 1320, 0.08, "sine", 0.035, 0, 0.004);
    return;
  }
  if (name === "pull") {
    tone(ctx, dest, now, 190, 0.26, "sine", 0.05, 420, 0.02);
    burst(ctx, dest, now, 0.2, 0.035, "mid", 0.8);
    return;
  }
  if (name === "pickup") {
    tone(ctx, dest, now, 880, 0.12, "sine", 0.05, 0, 0.006);
    tone(ctx, dest, now + 0.07, 1174, 0.16, "sine", 0.045, 0, 0.006);
    tone(ctx, dest, now + 0.14, 1568, 0.22, "triangle", 0.03, 0, 0.008);
    return;
  }
  if (name === "lamp") {
    tone(ctx, dest, now, 392, 1.35, "sine", 0.05, 0, 0.28);
    tone(ctx, dest, now, 494, 1.45, "sine", 0.04, 0, 0.32);
    tone(ctx, dest, now, 587, 1.6, "triangle", 0.035, 0, 0.36);
    tone(ctx, dest, now + 0.12, 784, 1.2, "sine", 0.02, 0, 0.2);
    return;
  }
  if (name === "blip" || name === "talk") {
    var speaker = (opts && opts.speaker) || (SF.state && SF.state.dialogue && SF.state.dialogue.speaker) || "";
    var voice = speakerVoice(speaker);
    tone(ctx, dest, now, voice.f, voice.d, voice.type, 0.04, 0, 0.006);
    tone(ctx, dest, now, voice.f * 2, voice.d * 0.7, "sine", 0.012, 0, 0.006);
    return;
  }
  if (name === "ui") {
    tone(ctx, dest, now, 720, 0.04, "sine", 0.035, 0, 0.004);
    return;
  }
  if (name === "hurt") {
    tone(ctx, dest, now, 210, 0.18, "sawtooth", 0.04, 70, 0.006);
    burst(ctx, dest, now, 0.1, 0.04, "low", 0.7);
    return;
  }
  if (name === "death") {
    tone(ctx, dest, now, 320, 0.42, "sine", 0.05, 80, 0.01);
    tone(ctx, dest, now, 214, 0.46, "triangle", 0.03, 60, 0.02);
    return;
  }
  if (name === "enemyHurt") {
    tone(ctx, dest, now, 150, 0.09, "square", 0.03, 70, 0.004);
    burst(ctx, dest, now, 0.05, 0.04, "mid", 1);
    return;
  }
  if (name === "enemyDeath") {
    burst(ctx, dest, now, 0.22, 0.07, "ash", 0.9);
    tone(ctx, dest, now, 420, 0.28, "sine", 0.04, 90, 0.008);
    return;
  }
  if (name === "roar") {
    burst(ctx, dest, now, 0.62, 0.08, "ash", 0.55);
    tone(ctx, dest, now, 78, 0.55, "sawtooth", 0.04, 52, 0.06);
    tone(ctx, dest, now, 118, 0.48, "triangle", 0.03, 70, 0.05);
    return;
  }
  if (name === "level") {
    tone(ctx, dest, now, 523, 0.12, "triangle", 0.045, 0, 0.008);
    tone(ctx, dest, now + 0.09, 659, 0.12, "triangle", 0.045, 0, 0.008);
    tone(ctx, dest, now + 0.18, 784, 0.2, "triangle", 0.04, 0, 0.008);
  }
}

var Sfx = {
  names: [
    "footstep", "whoosh", "impact", "dash", "grapple", "latch", "pull",
    "pickup", "lamp", "blip", "ui", "hurt", "death", "enemyHurt", "enemyDeath",
    "roar", "level"
  ],

  play: function (name, opts) {
    if (!name || !SF.audio || !SF.audio.unlocked) return;
    var ctx = SF.audio.ctx;
    if (!ctx || !SF.audio.sfx) return;
    if (ctx.state === "suspended") return;
    try {
      playNamed(ctx, SF.audio.sfx, name, opts || null);
    } catch (err) {
      return;
    }
    if (window.Haptics && HAPTIC[name] != null) Haptics.pulse(HAPTIC[name]);
  },

  setVolume: function (v) {
    SF.audio.setSfxVolume(v);
  }
};

window.Sfx = Sfx;
SF.Sfx = Sfx;
