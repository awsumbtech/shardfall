"use strict";

var SF = window.SF || {};
window.SF = SF;

// Highspire outskirts. Lowgate, the switchback, and a gate that stays shut.
// The ending line is system text, and only after saltmere_lamp is "lit":
// "Story continues in Act 2".
SF.ISLANDS.highspire = {
  dock: { x: 0, y: 330 },
  wake: { x: 0, y: 330 },
  lamp: { x: -30, y: 210 },
  lampNote: "A road lamp. The city gate is shut.",
  walk: {
    circles: [
      { id: "hs-town", name: "Lowgate", group: "hs", x: 0, y: 240, r: 150 },
      { id: "hs-road-1", name: "Switchback", group: "road", x: 0, y: 70, r: 78 },
      { id: "hs-road-2", name: "Switchback", group: "road", x: 100, y: -10, r: 74 },
      { id: "hs-road-3", name: "Switchback", group: "road", x: 40, y: -90, r: 76 },
      { id: "hs-road-4", name: "Switchback", group: "road", x: 110, y: -180, r: 72 },
      { id: "hs-gate", name: "The Gate", group: "hs", x: 40, y: -310, r: 108 }
    ],
    rects: []
  },
  npcs: [
    { id: "brant", name: "Warden Brant", x: -16, y: -248, node: "highspire.captain", sprite: "brant", role: "warden at the gate" },
    { id: "dorrie", name: "Dorrie Fen", x: 100, y: 200, node: "highspire.shopkeeper", sprite: "dorrie", role: "shopkeeper" },
    { id: "maud", name: "Maud Keel", x: -90, y: 240, node: "highspire.innkeeper", sprite: "maud", role: "inn keeper at the Switchback" },
    { id: "ellis", name: "Ellis Ward", x: 40, y: 150, node: "highspire.ellis", sprite: "ellis", role: "townsman" }
  ],
  texts: [],
  pickups: [],
  spawns: [
    { id: "hs-patrol-1", kind: "choir_soldier", x: 100, y: -10, encounter: "hs_choir_patrol", bg: "highspire_road" },
    { id: "hs-patrol-2", kind: "choir_soldier", x: 20, y: -70, encounter: "hs_choir_patrol", bg: "highspire_road" },
    { id: "hs-sentinel", kind: "sentinel", x: 150, y: -200, encounter: "hs_sentinel", bg: "highspire_road" }
  ],
  props: [
    { kind: "hut", x: 40, y: 250 },
    { kind: "hut", x: -80, y: 200, s: 0.9 },
    { kind: "stall", x: 90, y: 250 },
    { kind: "airship", x: 20, y: 340 },
    { kind: "gatearch", x: 40, y: -380 },
    { kind: "rock", x: 130, y: -40, s: 0.9 },
    { kind: "rock", x: -10, y: -140, s: 0.7 }
  ],
  paths: [
    [0, 330, 0, 240, 0, 70, 100, -10, 40, -90, 110, -180, 40, -310, 40, -380]
  ],
  hooks: [],
  extras: [
    { id: "hs-skiff", kind: "skiff", name: "the Quickmercy", x: 0, y: 330 },
    {
      id: "hs-shop",
      kind: "shop",
      name: "Lowgate shop",
      title: "Lowgate shop",
      x: 120,
      y: 270,
      stock: [
        { id: "tonic" },
        { id: "hi_tonic" },
        { id: "ether" },
        { id: "phoenix_shard" },
        { id: "smoke_bomb" },
        { id: "shard_focus" },
        { id: "vault_plate" },
        { id: "choir_blade" },
        { id: "mage_charm" }
      ]
    },
    {
      id: "hs-inn",
      kind: "inn",
      name: "the Switchback",
      title: "the Switchback",
      x: -120,
      y: 310,
      blurb: "Rest at the Switchback? Heart returns to full, the journey is saved, and field enemies come back."
    },
    {
      id: "chest-hs-town",
      kind: "chest",
      name: "chest",
      x: -10,
      y: 120,
      items: [{ id: "speed_charm", n: 1 }]
    },
    {
      id: "chest-hs-road",
      kind: "chest",
      name: "chest",
      x: 70,
      y: -120,
      items: [{ id: "shard_rod", n: 1 }]
    },
    {
      id: "hs-gate-sign",
      kind: "gate",
      name: "Highspire gate",
      x: 40,
      y: -390,
      title: "Highspire gate",
      lockedText: "The gate is shut.",
      text: "Story continues in Act 2"
    }
  ]
};

SF.DOCKS.highspire = SF.ISLANDS.highspire.dock;
