"use strict";

var SF = window.SF || {};
window.SF = SF;

SF.VERSION = "0.4.21";
SF.SAVE_KEY = "shardfall.v1";
SF.MUTE_KEY = "shardfall.mute";
SF.FLASH_KEY = "shardfall.reduceFlash";
SF.reduceFlash = true;
SF.QUEST_SHARDS = 5;
SF.WALK_MARGIN = 6;
SF.DASH_TIME = 0.16;
SF.DASH_SPEED = 500;
SF.DASH_SPEED_PLUS = 780;
SF.DASH_CD = 1.15;
SF.DASH_CD_PLUS = 0.78;
SF.STRIKE_REACH = 58;
SF.STRIKE_ARC = 0.28;
SF.XP_NEED = [0, 24, 70, 110];

SF.WHATS_NEW = [
  "Chests open when you mean to open them, and you can see what was inside.",
  "Trees, flowers, rocks, and lamps look new. Cottages, stalls, and ruins were rebuilt.",
  "You and the townspeople have new looks.",
  "New enemies are on the road, including a boss.",
  "Fights have new backgrounds.",
  "Menus fit your phone screen, with Close always in reach.",
  "Defend really blocks now, and battle lists scroll and work with keys and a controller.",
  "The vault chest opens, the End of Act 1 card closes, and the sail chart shows only the islands you can reach.",
  "Act 1 scenes now match the story: the Maw crumbles to ash, Ilsa walks up to the ridge, and the skiff sails away at the end.",
  "In battle the whole party stands on the ground, lists show more rows, and the Cinder Maw is a fairer fight.",
  "Menus and the sail chart stay open after you tap, and the stick no longer sticks when you open a menu with a second finger.",
  "Act 1 dialogue is clearer: one name for the lamp, side questions return to your choices, and Kestrel always introduces herself."
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
  { id: "wake-stone", x: -82, y: 88, speaker: "Waking Stones", node: "inspect.waking_stones" },
  { id: "scar-stone", x: 125, y: 168, speaker: "The Scar", node: "inspect.scar" },
  { id: "hull", x: -78, y: 540, speaker: "The Quickmercy", node: "inspect.quickmercy" },
  { id: "wrong-sky", x: 500, y: -50, speaker: "Standing Stones", node: "inspect.wrong_sky" },
  { id: "heartblossom", x: 170, y: -50, speaker: "Heartblossom", node: "inspect.heartblossom" },
  { id: "rope-bridge", x: -20, y: 365, speaker: "Rope Bridge", node: "inspect.rope_bridge" },
  { id: "span-planks", x: 250, y: -100, speaker: "Broken Span", node: "inspect.span_planks" },
  { id: "sail-patch", x: -48, y: 530, speaker: "Sail Patch", node: "inspect.sail_patch" }
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
  choirling: { hp: 32, dmg: 7, speed: 42, aggro: 200, xp: 32, r: 14, drops: true, ranged: true, leash: 200 },
  ashmite: { hp: 16, dmg: 4, speed: 88, aggro: 108, xp: 8, r: 11, drops: false, leash: 140, small: true },
  sootwing: { hp: 26, dmg: 6, speed: 48, aggro: 160, xp: 16, r: 13, drops: false, leash: 180, small: true, ranged: true },
  cinderbrute: { hp: 64, dmg: 11, speed: 36, aggro: 118, xp: 28, r: 24, drops: true, leash: 150, big: true },
  maw: { hp: 140, dmg: 10, speed: 44, aggro: 420, xp: 80, r: 30, drops: false, leash: 200, big: true, boss: true }
};

SF.LEVELS = {
  2: { hp: 10, atk: 0, title: "Level 2", sub: "The hand steadies. +10 heart." },
  3: { hp: 8, atk: 2, title: "Level 3", sub: "A brighter strike. +2 attack, +8 heart." },
  4: { hp: 12, atk: 2, title: "Level 4", sub: "The shard burns steady. +2 attack, +12 heart." }
};

SF.HAND_UPGRADES = [
  { id: "longstep", name: "Long Step", branch: "Dash", cost: 2, blurb: "Dash reaches farther." },
  { id: "quickhook", name: "Quick Hook", branch: "Grapple", cost: 2, blurb: "The hook flies farther and returns sooner.", needs: "grapple" },
  { id: "brightedge", name: "Bright Edge", branch: "Strike", cost: 2, blurb: "+3 strike." },
  { id: "deepheart", name: "Deep Heart", branch: "Health", cost: 2, blurb: "+14 heart." },
  { id: "singe", name: "Singe Line", branch: "Dash", cost: 3, blurb: "A dash burns harder.", needs: "shardstep" }
];

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

