"use strict";

var SF = window.SF || {};
window.SF = SF;

// Saltmere. Stilt town, the Shore to the east, the Holdfast under the west pier.
// Gaps between the pier and the Holdfast, the Holdfast and the side rock, and
// the Holdfast and the Tidewyrm arena are wider than a dash and inside grapple range.
SF.ISLANDS.saltmere = {
  dock: { x: 0, y: 150 },
  wake: { x: 0, y: 150 },
  lamp: { x: 0, y: -120 },
  lampNote: "The lamp is dim.",
  walk: {
    circles: [
      { id: "sm-town", name: "Saltmere", group: "salt", x: 0, y: 30, r: 168 },
      { id: "sm-shore-link", name: "The Shore", group: "shore", x: 200, y: 70, r: 64 },
      { id: "sm-shore", name: "The Shore", group: "shore", x: 340, y: 90, r: 110 },
      { id: "sm-lip", name: "West pier", group: "salt", x: -200, y: 30, r: 50 },
      { id: "sm-deck", name: "The Holdfast", group: "wreck", x: -480, y: 30, r: 80 },
      { id: "sm-hold", name: "The Holdfast", group: "wreck", x: -540, y: -40, r: 46 },
      { id: "sm-islet", name: "The Holdfast", group: "wreck", x: -700, y: 170, r: 46 },
      { id: "sm-arena", name: "Tidewyrm Arena", group: "wyrm", x: -800, y: 30, r: 100 }
    ],
    rects: []
  },
  npcs: [
    { id: "holt", name: "Brenna Holt", x: -36, y: 108, node: "saltmere.harbormaster", sprite: "brenna", role: "harbormaster" },
    { id: "osric", name: "Osric Pell", x: 96, y: -16, node: "saltmere.innkeeper", sprite: "osric", role: "inn keeper at the Stilthouse" },
    { id: "nessa", name: "Nessa Quinn", x: -108, y: -36, node: "saltmere.shopkeeper", sprite: "nessa", role: "shopkeeper at Quinn's Hooks" },
    { id: "sera", name: "Sera Dunne", x: 78, y: -96, node: "saltmere.sera", sprite: "sera", role: "lamp keeper" },
    { id: "pip", name: "Pip", x: -60, y: 16, node: "saltmere.kids", sprite: "pip", role: "dock kid" },
    { id: "lark", name: "Lark", x: 24, y: 64, node: "saltmere.kids", sprite: "lark", role: "dock kid" },
    { id: "jory", name: "Jory Hale", x: -124, y: 96, node: "saltmere.jory", sprite: "jory", role: "fisher" }
  ],
  texts: [],
  pickups: [],
  spawns: [
    { id: "sm-wisp-shore", kind: "saltwisp", x: 300, y: 120, encounter: "sm_saltwisps", bg: "saltmere_shore" },
    { id: "sm-wisp-east", kind: "saltwisp", x: 390, y: 60, encounter: "sm_saltwisps", bg: "saltmere_shore" },
    { id: "sm-gulls", kind: "stormgull", x: 360, y: 140, encounter: "sm_gulls", bg: "saltmere_shore" },
    { id: "sm-drowned", kind: "drowned", x: -510, y: 0, encounter: "sm_drowned", bg: "saltmere_wreck" },
    { id: "sm-mixed", kind: "drowned", x: 280, y: 70, encounter: "sm_mixed", bg: "saltmere_shore" },
    { id: "sm-tidewyrm", kind: "tidewyrm", x: -800, y: 30, encounter: "boss_tidewyrm", bg: "saltmere_wreck", boss: true }
  ],
  props: [
    { kind: "stilt", x: -120, y: 120 },
    { kind: "stilt", x: 120, y: 130 },
    { kind: "stilt", x: -40, y: 160 },
    { kind: "stilt", x: 50, y: 150 },
    { kind: "hut", x: -70, y: -10 },
    { kind: "hut", x: 80, y: 10, s: 0.9 },
    { kind: "hut", x: 36, y: -108, s: 0.85 },
    { kind: "stall", x: -78, y: 8 },
    { kind: "airship", x: -20, y: 168 },
    { kind: "wreckhull", x: -500, y: 20 },
    { kind: "rock", x: 300, y: 40, s: 1.1 },
    { kind: "rock", x: 400, y: 120, s: 0.8 },
    { kind: "signpost", x: 150, y: 40 }
  ],
  paths: [
    [0, 150, 0, 40, 24, -80],
    [0, 40, -200, 30],
    [0, 40, 200, 70, 340, 90]
  ],
  hooks: [
    { id: "sm-hook-lip", x: -242, y: 30 },
    { id: "sm-hook-deck", x: -412, y: 30 },
    { id: "sm-hook-deck-side", x: -537, y: 67 },
    { id: "sm-hook-islet", x: -670, y: 151 },
    { id: "sm-hook-deck-west", x: -548, y: 30 },
    { id: "sm-hook-arena", x: -712, y: 30 }
  ],
  extras: [
    { id: "sm-skiff", kind: "skiff", name: "the Quickmercy", x: 0, y: 150 },
    {
      id: "sm-shop",
      kind: "shop",
      name: "Quinn's Hooks",
      title: "Quinn's Hooks",
      x: -64,
      y: 8,
      stock: [
        { id: "tonic" },
        { id: "hi_tonic" },
        { id: "ether" },
        { id: "tide_vial" },
        { id: "smoke_bomb" },
        { id: "salt_cloak" },
        { id: "tide_edge" }
      ]
    },
    {
      id: "sm-inn",
      kind: "inn",
      name: "the Stilthouse",
      title: "the Stilthouse",
      x: 128,
      y: 48,
      blurb: "Rest at the Stilthouse? Heart returns to full, and the journey is saved."
    },
    {
      id: "sm-sign-shore",
      kind: "sign",
      name: "shore sign",
      x: 160,
      y: 48,
      title: "The Shore",
      text: "The Holdfast is under the west pier. The gap needs a hook."
    },
    {
      id: "sm-sign-wreck",
      kind: "sign",
      name: "wreck sign",
      x: -450,
      y: -10,
      title: "The Holdfast",
      text: "Chests sit past the hooks."
    },
    {
      id: "chest-sm-town",
      kind: "chest",
      name: "chest",
      x: -150,
      y: 36,
      items: [
        { id: "tonic", n: 1 },
        { id: "ether", n: 1 }
      ]
    },
    {
      id: "chest-sm-deck",
      kind: "chest",
      name: "chest",
      x: -520,
      y: 50,
      items: [{ id: "gale_powder", n: 1 }]
    },
    {
      id: "chest-sm-islet",
      kind: "chest",
      name: "chest",
      x: -700,
      y: 170,
      items: [
        { id: "hi_tonic", n: 1 },
        { id: "shard_dust", n: 1 }
      ]
    },
    {
      id: "chest-sm-arena",
      kind: "chest",
      name: "chest",
      x: -730,
      y: 90,
      items: [
        { id: "phoenix_shard", n: 1 },
        { id: "heart_charm", n: 1 }
      ]
    }
  ]
};

SF.DOCKS.saltmere = SF.ISLANDS.saltmere.dock;
