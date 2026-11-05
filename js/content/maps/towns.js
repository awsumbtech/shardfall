"use strict";

// Lampfoot and Lowmoor growth. Shapes are added after the v2 layout so the
// approved gate boxes stay put. Emberhold's new ground is also painted into
// the tile map; these rects are the same tiles, for the code-world fallback.
(function () {
  var SF = window.SF || {};
  window.SF = SF;
  var T = 16;

  function rec(id, name, group, box) {
    return {
      id: id,
      name: name,
      group: group,
      k: "r",
      x: box[0] * T,
      y: box[1] * T,
      w: (box[2] - box[0]) * T,
      h: (box[3] - box[1]) * T
    };
  }

  function pushRect(pack, shape) {
    if (!pack.walk.rects) pack.walk.rects = [];
    pack.walk.rects.push(shape);
  }

  function safe(id) {
    SF.ZONES[id] = { safe: true };
  }

  var ember = SF.ISLANDS.emberhold;
  var cinder = SF.ISLANDS.cinderveil;

  // Dell Row sits in the sky northwest of the cottage. The lane joins it to
  // Maren's door. The Green, larder, smithy, and shrine are the cottage edge
  // between her door and the Meadow, and they stay safe.
  pushRect(ember, rec("lampfoot", "Lampfoot", "ember", [2, 2, 62, 36]));
  pushRect(ember, rec("dell-lane", "Dell Row", "ember", [52, 16, 68, 26]));
  pushRect(ember, rec("green", "The Green", "ember", [64, 20, 82, 30]));
  pushRect(ember, rec("larder", "Pell's Larder", "ember", [60, 24, 70, 28]));
  pushRect(ember, rec("smithy", "Hale's Smithy", "ember", [76, 14, 86, 22]));
  pushRect(ember, rec("shrine", "Old Shrine", "ember", [74, 24, 82, 28]));
  ["lampfoot", "dell-lane", "green", "larder", "smithy", "shrine"].forEach(safe);

  function feet(tx, ty) {
    return { x: tx * T + 8, y: ty * T + 8 };
  }

  ember.npcs.push(
    { id: "bram", name: "Bram Tolley", x: feet(32, 20).x, y: feet(32, 20).y, sprite: "villager_b" },
    { id: "wren", name: "Wren", x: feet(38, 22).x, y: feet(38, 22).y, sprite: "villager_a" },
    { id: "pell", name: "Ina Pell", x: feet(64, 26).x, y: feet(64, 26).y, sprite: "villager_a" },
    { id: "hale", name: "Dagan Hale", x: feet(80, 18).x, y: feet(80, 18).y, sprite: "villager_b" },
    { id: "sefa", name: "Old Sefa", x: feet(72, 22).x, y: feet(72, 22).y, sprite: "villager_b" }
  );

  ember.texts.push(
    { id: "lampfoot-board", x: feet(75, 26).x, y: feet(75, 26).y, speaker: "Notice Board", node: "inspect.lampfoot_board" },
    { id: "old-shrine", x: feet(76, 27).x, y: feet(76, 27).y, speaker: "Old Shrine", node: "inspect.shrine_thornwick" }
  );

  ember.extras.push(
    {
      id: "pell-larder",
      kind: "shop",
      name: "Pell's Larder",
      title: "Pell's Larder",
      x: 64 * T + 8,
      y: 26 * T + 8,
      stock: [
        { id: "tonic" },
        { id: "smoke_bomb" },
        { id: "cloth_wrap" },
        { id: "knife" }
      ]
    },
    {
      id: "hale-smithy",
      kind: "shop",
      name: "Hale's Smithy",
      title: "Hale's Smithy",
      x: 80 * T + 8,
      y: 18 * T + 8,
      stock: [
        { id: "heart_charm" },
        { id: "cloth_wrap" },
        { id: "knife" }
      ]
    },
    {
      id: "chest-goat",
      kind: "chest",
      name: "chest",
      x: 30 * T + 8,
      y: 12 * T + 8,
      items: [{ id: "ether", n: 1 }]
    }
  );

  ember.props.push(
    { kind: "cottage", x: 28 * T + 8, y: 16 * T + 8, s: 0.85 },
    { kind: "cottage", x: 36 * T + 8, y: 16 * T + 8, s: 0.85 },
    { kind: "cottage", x: 44 * T + 8, y: 14 * T + 8, s: 0.85 },
    { kind: "stall", x: 66 * T + 8, y: 26 * T + 8 },
    { kind: "workshop", x: 30 * T + 8, y: 18 * T + 8, s: 0.9 },
    { kind: "bench", x: 34 * T + 8, y: 24 * T + 8 },
    { kind: "stones", x: 78 * T + 8, y: 27 * T + 8, s: 0.7 },
    { kind: "signpost", x: 40 * T + 8, y: 26 * T + 8 }
  );

  ember.bounds = { x: 0, y: 0, w: 170 * T, h: 112 * T };

  // Lowmoor: Upper Town is the quay band by the Ashfields gate. Lower Quay
  // is the water, the widened wings, and a short south pier. The walk from
  // the south edge to the Ashfields stays under 60 tiles.
  pushRect(cinder, rec("upper-town", "Upper Town", "quay", [26, 74, 92, 90]));
  pushRect(cinder, rec("upper-west", "Upper Town", "quay", [8, 78, 26, 100]));
  pushRect(cinder, rec("upper-east", "Upper Town", "quay", [96, 78, 130, 100]));
  pushRect(cinder, rec("lower-quay", "Lower Quay", "quay", [26, 90, 92, 110]));
  pushRect(cinder, rec("lower-west", "Lower Quay", "quay", [8, 96, 26, 110]));
  pushRect(cinder, rec("bell", "Bell Square", "quay", [40, 78, 58, 90]));
  ["upper-town", "upper-west", "upper-east", "lower-quay", "lower-west", "bell"].forEach(safe);

  cinder.npcs.push(
    { id: "ada", name: "Ada Fenn", x: 44 * T, y: 82 * T, sprite: "villager_a" },
    { id: "corin", name: "Corin Fenn", x: 47 * T, y: 86 * T, sprite: "villager_b" },
    { id: "tobin", name: "Old Tobin", x: 54 * T, y: 80 * T, sprite: "villager_b" },
    { id: "marta", name: "Marta Ashcroft", x: 42 * T, y: 82 * T, sprite: "villager_a" },
    { id: "jem", name: "Jem Rook", x: 70 * T, y: 84 * T, sprite: "villager_b" },
    { id: "nell", name: "Nell Garrow", x: 16 * T, y: 96 * T, sprite: "villager_a" },
    { id: "cantor_quay", name: "The Cantor", x: 61 * T, y: 106 * T, sprite: "cantor", when: "grapple", until: "cantor_quay" }
  );

  cinder.texts.push(
    { id: "long-stair", x: 52 * T, y: 76 * T, speaker: "Long Stair", node: "inspect.long_stair" },
    { id: "ash-gate", x: 46 * T, y: 75 * T, speaker: "Ashfields Gate", node: "inspect.ash_gate" },
    { id: "duty-roster", x: 30 * T, y: 78 * T, speaker: "Duty Roster", node: "inspect.duty_roster" },
    { id: "post-order", x: 28 * T, y: 80 * T, speaker: "Posted Order", node: "inspect.ilsa_order" }
  );

  cinder.extras.push({
    id: "chest-nets",
    kind: "chest",
    name: "chest",
    x: 14 * T,
    y: 100 * T,
    items: [{ id: "ember_salt", n: 1 }]
  });

  cinder.extras.forEach(function (ex) {
    if (ex.id === "lowmoor-shop") {
      ex.name = "Ashcroft Goods";
      ex.title = "Ashcroft Goods";
      var hasHi = false;
      (ex.stock || []).forEach(function (row) { if (row.id === "hi_tonic") hasHi = true; });
      if (!hasHi) ex.stock.push({ id: "hi_tonic" });
    }
    if (ex.id === "quay-bunk") {
      ex.name = "The Cinder Cup";
      ex.title = "The Cinder Cup";
      ex.blurb = "Rooms are cheap. Half the town has gone. Rest here? Heart returns to full, and the journey is saved.";
    }
  });

  cinder.props.push(
    { kind: "bell", x: 50 * T, y: 82 * T },
    { kind: "stall", x: 18 * T, y: 94 * T },
    { kind: "stall", x: 22 * T, y: 98 * T },
    { kind: "inn", x: 74 * T, y: 84 * T },
    { kind: "workshop", x: 34 * T, y: 88 * T },
    { kind: "crate", x: 84 * T, y: 92 * T },
    { kind: "signpost", x: 46 * T, y: 75 * T },
    { kind: "hut", x: 12 * T, y: 100 * T, s: 0.8 }
  );

  cinder.bounds = { x: 0, y: 0, w: 156 * T, h: 130 * T };

  if (SF.islandId === "emberhold") SF.bounds = ember.bounds;
  else if (SF.islandId === "cinderveil") SF.bounds = cinder.bounds;

  var baseHidden = SF.npcHidden;
  SF.npcHidden = function (n) {
    if (n && n.id === "cantor_quay") {
      var flags = (SF.state && SF.state.flags) || {};
      if (flags.vaultOpen) return true;
    }
    return baseHidden ? baseHidden(n) : false;
  };
})();
