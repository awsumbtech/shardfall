"use strict";

var SF = window.SF || {};
window.SF = SF;

// Drift Market. Rare gear uses the catalog ids. Prices come from SF.ITEMS.
SF.ISLANDS.drift = {
  dock: { x: 0, y: 74 },
  wake: { x: 0, y: 74 },
  lamp: { x: -40, y: -20 },
  lampNote: "No lamp on the market.",
  walk: {
    circles: [
      { id: "drift-raft", name: "Drift Market", group: "drift", x: 0, y: 0, r: 108 }
    ],
    rects: []
  },
  npcs: [
    { id: "sile", name: "Sile Voss", x: 22, y: -18, node: "driftmarket.voss", sprite: "sile", role: "Drift Market trader" }
  ],
  texts: [],
  pickups: [],
  spawns: [],
  props: [
    { kind: "raft", x: 0, y: 10 },
    { kind: "stall", x: -28, y: 36 },
    { kind: "airship", x: 10, y: 86 }
  ],
  paths: [[0, 74, 0, 0]],
  hooks: [],
  extras: [
    { id: "drift-skiff", kind: "skiff", name: "the Quickmercy", x: 0, y: 74 },
    {
      id: "drift-shop",
      kind: "shop",
      name: "Drift Market",
      title: "Drift Market",
      x: -32,
      y: 28,
      stock: [
        { id: "phoenix_shard" },
        { id: "hi_tonic" },
        { id: "gale_powder" },
        { id: "gale_pistol" },
        { id: "spark_wrench" },
        { id: "thief_charm" }
      ]
    },
    {
      id: "chest-drift",
      kind: "chest",
      name: "chest",
      x: 60,
      y: -40,
      items: [{ id: "shard_dust", n: 1 }]
    }
  ]
};

SF.DOCKS.drift = SF.ISLANDS.drift.dock;
