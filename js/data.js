"use strict";

var SF = window.SF || {};
window.SF = SF;

SF.VERSION = "0.1.1";
SF.SAVE_KEY = "shardfall.v1";
SF.MUTE_KEY = "shardfall.mute";
SF.FLASH_KEY = "shardfall.reduceFlash";
SF.reduceFlash = true;
SF.QUEST_SHARDS = 5;
SF.WALK_MARGIN = 6;
SF.DASH_TIME = 0.16;
SF.DASH_SPEED = 760;
SF.DASH_SPEED_PLUS = 980;
SF.DASH_CD = 1.15;
SF.DASH_CD_PLUS = 0.78;
SF.STRIKE_REACH = 58;
SF.STRIKE_ARC = 0.28;
SF.XP_NEED = [0, 24, 70, 110];

SF.WHATS_NEW = [
  "The screen stays steady. Flashes are softer, and Reduce flashing is on until you turn it off.",
  "Your next step stays on screen. The button changes to Talk, Place shards, or Inspect when you are close enough.",
  "A marker points the way. The first minute teaches the buttons once, and a missed gap says to try Dash."
];

SF.WAKE = { x: -50, y: 45 };
SF.LAMP = { x: 230, y: -200 };

SF.WALK = {
  circles: [
    { id: "meadow", name: "Emberhold", group: "ember", x: 0, y: 20, r: 210 },
    { id: "lamp", name: "The Lamp Hill", group: "ember", x: 160, y: -155, r: 150 },
    { id: "grove", name: "Maren's Grove", group: "ember", x: -175, y: -30, r: 120 },
    { id: "step1", name: "The West Ledge", group: "ember", x: -270, y: -5, r: 54 },
    { id: "step2", name: "The West Ledge", group: "ember", x: -345, y: 15, r: 48 },
    { id: "hollow", name: "Whisper Hollow", group: "ember", x: -410, y: 20, r: 76 },
    { id: "scar", name: "The Scar", group: "ember", x: 50, y: 130, r: 115 },
    { id: "dock", name: "The Dock", group: "ember", x: -30, y: 250, r: 100 },
    { id: "span", name: "The Broken Span", group: "span", x: 268, y: -100, r: 40 },
    { id: "gap", name: "The Broken Span", group: "span", x: 430, y: -70, r: 30 },
    { id: "cinder", name: "Cinderstep", group: "cinder", x: 520, y: -28, r: 122 },
    { id: "alcove", name: "The Wrong Sky", group: "cinder", x: 600, y: -150, r: 56 },
    { id: "perch", name: "Vane's Perch", group: "perch", x: -20, y: 500, r: 112 }
  ],
  rects: [
    { id: "bridge", name: "The Rope Bridge", x: -54, y: 310, w: 68, h: 110 }
  ]
};

SF.NPCS = [
  { id: "maren", name: "Old Maren", x: 145, y: -70 },
  { id: "kestrel", name: "Kestrel Vane", x: -8, y: 485 },
  { id: "cantor", name: "The Cantor", x: -400, y: 28 }
];

SF.TEXTS = [
  {
    id: "wake-stone",
    x: -82,
    y: 88,
    speaker: "Waking Stones",
    lines: [
      "Fell in the first night. Rose with a shard for a pulse.",
      "If you wake: the lamp is up the hill. Talk to Old Maren at the cottage."
    ]
  },
  {
    id: "scar-stone",
    x: 125,
    y: 168,
    speaker: "The Scar",
    lines: [
      "Here the meadow tore. Do not follow the lights down.",
      "Under that, almost worn away: Maren says the lights are only weather that learned a grudge."
    ]
  },
  {
    id: "hull",
    x: -78,
    y: 540,
    speaker: "Nameplate",
    lines: [
      "QUICKMERCY.",
      "Patched. Opinionated. Still afloat. Someone has polished the letters and left the dents."
    ]
  }
];

SF.PICKUPS = [
  { id: "shard-meadow", kind: "shard", x: 55, y: -40 },
  { id: "shard-grove", kind: "shard", x: -230, y: -85 },
  { id: "shard-alcove", kind: "shard", x: 628, y: -168, secret: true },
  { id: "bloom-meadow", kind: "bloom", x: -15, y: 120 },
  { id: "bloom-hollow", kind: "bloom", x: -448, y: 0, secret: true }
];

SF.SPAWNS = [
  { id: "wisp-meadow", kind: "wisp", x: 78, y: 118 },
  { id: "wisp-grove", kind: "wisp", x: -198, y: -58 },
  { id: "wisp-dock", kind: "wisp", x: -8, y: 236 },
  { id: "brume-scar", kind: "brumekin", x: 118, y: 178 },
  { id: "brume-span", kind: "brumekin", x: 280, y: -100 },
  { id: "choir-cinder", kind: "choirling", x: 560, y: 5 }
];

SF.KINDS = {
  wisp: { hp: 18, dmg: 5, speed: 72, aggro: 118, xp: 10, r: 13, drops: false, leash: 150 },
  brumekin: { hp: 50, dmg: 9, speed: 46, aggro: 128, xp: 24, r: 18, drops: true, leash: 170 },
  choirling: { hp: 32, dmg: 7, speed: 42, aggro: 200, xp: 32, r: 14, drops: true, ranged: true, leash: 200 }
};

SF.LEVELS = {
  2: { hp: 10, atk: 0, title: "Level 2", sub: "The hand steadies. +10 heart." },
  3: { hp: 8, atk: 2, title: "Level 3", sub: "A brighter strike. +2 attack, +8 heart." },
  4: { hp: 12, atk: 2, title: "Level 4", sub: "The shard burns steady. +2 attack, +12 heart." }
};

SF.PROPS = [
  { kind: "stones", x: -78, y: 86, s: 1 },
  { kind: "cottage", x: 108, y: -150 },
  { kind: "stones", x: 498, y: -62, s: 1.15, face: -2.4 },
  { kind: "airship", x: -62, y: 548 },
  { kind: "ruin", x: 145, y: 188 },
  { kind: "tree", x: -150, y: -72, s: 1.15 },
  { kind: "tree", x: -205, y: 8, s: 0.9 },
  { kind: "tree", x: -118, y: -18, s: 1 },
  { kind: "tree", x: -188, y: -48, s: 0.75 },
  { kind: "tree", x: 24, y: -8, s: 1.05 },
  { kind: "tree", x: -96, y: -18, s: 0.85 },
  { kind: "tree", x: 18, y: 96, s: 0.95 },
  { kind: "tree", x: 545, y: -48, s: 0.8 },
  { kind: "tree", x: 575, y: 18, s: 0.7 },
  { kind: "tree", x: -78, y: 470, s: 0.85 },
  { kind: "rock", x: 78, y: 148, s: 1.2 },
  { kind: "rock", x: 132, y: 108, s: 0.8 },
  { kind: "rock", x: 250, y: -78, s: 0.9 },
  { kind: "rock", x: 300, y: -128, s: 0.7 },
  { kind: "plank", x: 352, y: -98, rot: 0.5 },
  { kind: "plank", x: 378, y: -76, rot: -0.35 },
  { kind: "stake", x: 8, y: -18 },
  { kind: "stake", x: 78, y: -95 },
  { kind: "stake", x: 8, y: 168 },
  { kind: "stake", x: -28, y: 300 },
  { kind: "flower", x: -40, y: 8, c: "#ffd0e8" },
  { kind: "flower", x: 30, y: 48, c: "#ffe08a" },
  { kind: "flower", x: -20, y: 70, c: "#d8c6ff" },
  { kind: "flower", x: 170, y: -40, c: "#ffe08a" },
  { kind: "flower", x: -150, y: 20, c: "#ffd0e8" },
  { kind: "flower", x: 500, y: 20, c: "#ffb37a" },
  { kind: "flower", x: 40, y: 470, c: "#9af0d8" },
  { kind: "flower", x: -455, y: 40, c: "#c6b6ff" }
];

SF.PATHS = [
  [-50, 45, 20, 0, 90, -60, 150, -90, 200, -160],
  [20, 0, 10, 150, -20, 280]
];

SF.clamp = function (v, a, b) {
  return Math.max(a, Math.min(b, v));
};

SF.dist = function (ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
};

SF.mulberry32 = function (seed) {
  var a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

SF.circle = function (id) {
  for (var i = 0; i < SF.WALK.circles.length; i++) {
    if (SF.WALK.circles[i].id === id) return SF.WALK.circles[i];
  }
  return null;
};

SF.walkable = function (x, y) {
  var m = SF.WALK_MARGIN;
  var circles = SF.WALK.circles;
  var i, c, r;
  for (i = 0; i < circles.length; i++) {
    c = circles[i];
    if (Math.hypot(x - c.x, y - c.y) <= c.r - m + 0.05) return true;
  }
  for (i = 0; i < SF.WALK.rects.length; i++) {
    r = SF.WALK.rects[i];
    if (x >= r.x + m && y >= r.y + m && x <= r.x + r.w - m && y <= r.y + r.h - m) return true;
  }
  return false;
};

SF.zoneAt = function (x, y) {
  var inside = null;
  var insideD = Infinity;
  var circles = SF.WALK.circles;
  var i, c, d, rect;
  for (i = 0; i < circles.length; i++) {
    c = circles[i];
    d = Math.hypot(x - c.x, y - c.y);
    if (d <= c.r && d < insideD) {
      insideD = d;
      inside = c;
    }
  }
  for (i = 0; i < SF.WALK.rects.length; i++) {
    rect = SF.WALK.rects[i];
    if (x >= rect.x && y >= rect.y && x <= rect.x + rect.w && y <= rect.y + rect.h) inside = rect;
  }
  if (inside && inside.id === "meadow" && Math.hypot(x - SF.WAKE.x, y - SF.WAKE.y) < 58) {
    return { id: "wake", name: "The Waking Stones" };
  }
  return inside || { id: "hush", name: "The Hush" };
};

SF.questText = function (s) {
  if (s.quest === "awaken") return "Talk to Old Maren, up the hill.";
  if (s.quest === "gather") {
    if (s.shardsHeld >= SF.QUEST_SHARDS) return "Bring them to the lamp — Place shards.";
    return "Find 5 sky-shards (" + s.shardsHeld + "/5).";
  }
  if (s.quest === "stirring") return "Talk to Kestrel on Vane's Perch.";
  return "Cinderveil waits. Kestrel will sail later.";
};

SF.talkMaren = function (s) {
  if (s.flags.lampLit && !s.flags.metMaren) {
    return {
      speaker: "Old Maren",
      lines: [
        "You lit it. You, who woke up arguing with a stone.",
        "I was going to ask for five shards. You already spent them on the plinth. Good.",
        "Then I will say the part that matters. Thank you. The grass heard you.",
        "Your hand has a longer step now. Kestrel will feel the wind and pretend it was his idea."
      ],
      after: "maren_first"
    };
  }
  if (!s.flags.metMaren) {
    return {
      speaker: "Old Maren",
      lines: [
        "You're awake. I am Maren. I keep the lamp up this hill. It holds the Hush off the grass.",
        "Your hand can Dash — a quick step across gaps you cannot walk. Strike hits the things in the mist. Blade button, or J.",
        "Find 5 sky-shards. They glow on the grass. Strike a Hushborn core and some of them drop one.",
        "When you have 5, stand at the lamp and press Place shards. The button will say so. Bring them to the lamp, not to me.",
        "If you are torn, talk to me. I can mend that."
      ],
      after: "maren_first"
    };
  }
  if (s.flags.lampLit) {
    return {
      speaker: "Old Maren",
      lines: [
        "Listen. The grass remembers green.",
        "You have the lamp's thanks. That is heavier than mine, and I have plenty.",
        "If the hand aches, that is the new step settling. Use it. The Hush still has opinions."
      ],
      after: "maren_heal"
    };
  }
  if (s.shardsHeld >= SF.QUEST_SHARDS) {
    return {
      speaker: "Old Maren",
      lines: [
        "Five. I can hear them ticking against each other.",
        "Walk up to the lamp and press Place shards. The button will change when you are close. This note is yours, not mine."
      ],
      after: "maren_heal"
    };
  }
  return {
    speaker: "Old Maren",
      lines: [
        "Find 5 sky-shards. You hold " + s.shardsHeld + ".",
        "Glowing ones lie in the meadow and the grove. Strike a core in the scar and a shard spills out.",
        "The lamp is up the hill. Come back torn if you must — talk to me and I will mend you."
      ],
    after: "maren_heal"
  };
};

SF.talkKestrel = function (s) {
  if (!s.flags.kestrelHint) {
    return {
      speaker: "Kestrel Vane",
      lines: [
        "Kestrel Vane. This heap is the Quickmercy. She will not sail while the lamp up the hill is dark.",
        "East of the lamp the span is broken. The gap is too wide to walk. Dash from the lip — the dash button, or K.",
        "On the far islet, look behind the stones that face the wrong sky. A shard hides there.",
        "Light the lamp, then talk to me again. The western wind is called Cinderveil. We are not leaving today."
      ],
      after: "kestrel_first"
    };
  }
  if (s.flags.lampLit && !s.flags.kestrelAfter) {
    return {
      speaker: "Kestrel Vane",
      lines: [
        "There. You lit the lamp. That was the step.",
        "Cinderveil is west, under the bright crack. The hull is not ready, so we do not sail today.",
        "Keep the new dash — Shardstep. When the Quickmercy is ready, we follow the lamps. Not today."
      ],
      after: "kestrel_sail"
    };
  }
  if (s.flags.kestrelAfter) {
    return {
      speaker: "Kestrel Vane",
      lines: [
        "Still patching. She argues with every nail.",
        "The route is real. The hull is not ready. Both of those can be true before lunch.",
        "If you find another lamp out there someday, we will have an argument about who saw it first. I am practicing."
      ],
      after: "kestrel_note"
    };
  }
  return {
    speaker: "Kestrel Vane",
    lines: [
      "Still the wrong wind. The Quickmercy refuses to be heroic about it.",
      "Light the lamp and the west opens. Until then I am a man with a hammer and a very patient ship.",
      "Remember the stones on that islet. They face the lamp. The interesting things rarely do."
    ],
    after: "kestrel_note"
  };
};

SF.talkCantor = function (s) {
  if (!s.flags.metCantor) {
    return {
      speaker: "The Cantor",
      lines: [
        "Wayfarer. You still have a pulse in that shard. How novel.",
        "Maren keeps a lamp against a tide. We are the tide's memory. You may call us the Hollow Choir.",
        "When you tire of mending, we keep a door. Not today. Today I am only listening.",
        "Do mention to the sailor that the patches are admired. I will not wait on the dock."
      ],
      after: "cantor_first"
    };
  }
  return {
    speaker: "The Cantor",
    lines: [
      "I am still listening. You are still mending. Both can be true.",
      "The Choir does not rush a guest. The sky has already done the rushing.",
      "Go on. The lamp is a kindness. Kindness is not nothing. It is only not the end."
    ],
    after: "cantor_note"
  };
};

SF.talkLamp = function (s) {
  if (s.flags.lampLit) {
    return {
      speaker: "Great Lamp",
      lines: ["The lamp is lit. The Hush stays low. Kestrel, on the perch past the rope bridge, has the next step."],
      after: "note"
    };
  }
  if (s.quest === "awaken" && s.shardsHeld < SF.QUEST_SHARDS) {
    return {
      speaker: "Great Lamp",
      lines: ["The lamp is cold. It needs 5 sky-shards. Talk to Old Maren — her cottage is down the hill."],
      after: "note"
    };
  }
  if (s.shardsHeld < SF.QUEST_SHARDS) {
    return {
      speaker: "Great Lamp",
      lines: ["The lamp needs 5 sky-shards. You hold " + s.shardsHeld + ". Come back and press Place shards."],
      after: "note"
    };
  }
  return { cutscene: true };
};
