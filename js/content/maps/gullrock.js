"use strict";

var SF = window.SF || {};
window.SF = SF;

// Gullrock. Treasure and one optional fight. Encounter id is sm_mixed
// until BATTLE adds a gullrock-specific id; retarget `encounter` here.
SF.ISLANDS.gullrock = {
  dock: { x: 0, y: 78 },
  wake: { x: 0, y: 78 },
  lamp: { x: 0, y: -20 },
  lampNote: "No lamp on this rock.",
  walk: {
    circles: [
      { id: "gr-rock", name: "Gullrock", group: "gull", x: 0, y: 0, r: 120 }
    ],
    rects: []
  },
  npcs: [],
  texts: [],
  pickups: [],
  spawns: [
    { id: "gr-mixed", kind: "sentinel", x: -48, y: 8, encounter: "sm_mixed", bg: "saltmere_shore" }
  ],
  props: [
    { kind: "rock", x: 70, y: -30, s: 1.2 },
    { kind: "rock", x: -70, y: 40, s: 0.9 },
    { kind: "airship", x: 16, y: 90 },
    { kind: "signpost", x: 60, y: 30 }
  ],
  paths: [[0, 78, 0, 0, 36, -36]],
  hooks: [],
  extras: [
    { id: "gr-skiff", kind: "skiff", name: "the Quickmercy", x: 0, y: 78 },
    {
      id: "gr-sign",
      kind: "sign",
      name: "Gullrock sign",
      x: 62,
      y: 36,
      title: "Gullrock",
      text: "Gullrock."
    },
    {
      id: "chest-gullrock",
      kind: "chest",
      name: "chest",
      x: 40,
      y: -36,
      items: [
        { id: "phoenix_shard", n: 1 },
        { id: "smoke_bomb", n: 1 }
      ],
      marks: 40
    }
  ]
};

SF.DOCKS.gullrock = SF.ISLANDS.gullrock.dock;
