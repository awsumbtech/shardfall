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
  pushRect(ember, rec("dell-lane", "Dell Row", "ember", [36, 14, 80, 32]));
  pushRect(ember, rec("green", "The Green", "ember", [64, 20, 82, 30]));
  pushRect(ember, rec("larder", "Pell's Larder", "ember", [60, 24, 70, 28]));
  pushRect(ember, rec("smithy", "Hale's Smithy", "ember", [76, 14, 86, 22]));
  pushRect(ember, rec("shrine", "Old Shrine", "ember", [74, 24, 82, 28]));
  ["lampfoot", "dell-lane", "green", "larder", "smithy", "shrine"].forEach(safe);

  // Safe green between the cottage (about y=28) and the Meadow, 60 tiles wide.
  // Together with the cottage and Dell Row this is the Lampfoot hub.
  SF.townGreenCells = [];
  (function coverGreen() {
    var y0, x0, x1, y1, id, n;
    n = 0;
    for (y0 = 28; y0 < 56; y0 += 6) {
      for (x0 = 40; x0 < 100; x0 += 8) {
        x1 = Math.min(100, x0 + 8);
        y1 = Math.min(56, y0 + 6);
        id = "green-" + n;
        n += 1;
        pushRect(ember, rec(id, "The Green", "ember", [x0, y0, x1, y1]));
        safe(id);
        SF.townGreenCells.push([x0, y0, x1, y1, id]);
      }
    }
  })();

  function feet(tx, ty) {
    return { x: tx * T + 8, y: ty * T + 8 };
  }

  ember.npcs.push(
    { id: "bram", name: "Bram Tolley", x: feet(32, 20).x, y: feet(32, 20).y, sprite: "villager_b" },
    // Off the y21 and y26 walks. Her solid ring is 34px, so a two-tile nudge
    // still clips the lane. Tile 38,18 is the nearest spot that clears both.
    { id: "wren", name: "Wren", x: feet(38, 18).x, y: feet(38, 18).y, sprite: "villager_a" },
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

  // The grove-lip stairs are the walk into Lampfoot. A solid circle on those
  // cells, or on the straight rows a stick uses, stops the push. Slide the
  // prop off by a tile or two. Kenmi props live in emberhold-dense.json.
  (function clearLipProps() {
    var lines = [21 * T + 8, 26 * T + 8];
    var x0 = 36 * T;
    var x1 = 68 * T;
    function hits(x, y, r) {
      var ty, tx, span, left, top, right, bot, nx, ny, li;
      for (ty = 20; ty <= 28; ty++) {
        for (span = 0; span < 2; span++) {
          for (tx = span === 0 ? 41 : 58; tx <= (span === 0 ? 44 : 62); tx++) {
            left = tx * T;
            top = ty * T;
            right = left + T;
            bot = top + T;
            nx = x < left ? left : (x > right ? right : x);
            ny = y < top ? top : (y > bot ? bot : y);
            if ((x - nx) * (x - nx) + (y - ny) * (y - ny) < r * r) return true;
          }
        }
      }
      if (x < x0 - r || x > x1 + r) return false;
      for (li = 0; li < lines.length; li++) {
        if (Math.abs(y - lines[li]) < r) return true;
      }
      return false;
    }
    ember.props.forEach(function (p) {
      var dist, dx, dy, nx, ny, best, d, prefer;
      if (!p.block || !hits(p.x, p.y, p.block)) return;
      best = null;
      for (dist = T; dist <= T * 4; dist += T) {
        for (dx = -1; dx <= 1; dx++) {
          for (dy = -1; dy <= 1; dy++) {
            if (!dx && !dy) continue;
            nx = Math.round(p.x + dx * dist);
            ny = Math.round(p.y + dy * dist);
            if (hits(nx, ny, p.block)) continue;
            d = Math.abs(dx * dist) + Math.abs(dy * dist);
            prefer = Math.abs(dy);
            if (!best || d < best.d || (d === best.d && prefer > best.prefer)) {
              best = { x: nx, y: ny, d: d, prefer: prefer };
            }
          }
        }
        if (best) break;
      }
      if (best) {
        p.x = best.x;
        p.y = best.y;
      }
    });
  })();

  ember.bounds = { x: 0, y: 0, w: 170 * T, h: 112 * T };
  // A wide walk through the cottage terrace lip, so a straight stick enters Lampfoot.
  ember.paths.push([78 * T, 20 * T, 28 * T, 20 * T]);
  (SF.TERRACES.emberhold || []).forEach(function (t) {
    if (t.id === "cottage") t.ramp = 96;
  });

  // Lowmoor: Upper Town is the quay band by the Ashfields gate. Lower Quay
  // is the water, the widened wings, and a short south pier. The walk from
  // the south edge to the Ashfields stays under 60 tiles.
  pushRect(cinder, rec("upper-town", "Upper Town", "quay", [26, 74, 92, 90]));
  pushRect(cinder, rec("upper-west", "Upper Town", "quay", [0, 74, 40, 100]));
  pushRect(cinder, rec("upper-east", "Upper Town", "quay", [90, 78, 146, 108]));
  pushRect(cinder, rec("lower-quay", "Lower Quay", "quay", [26, 90, 92, 110]));
  pushRect(cinder, rec("lower-south", "Lower Quay", "quay", [26, 108, 92, 112]));
  pushRect(cinder, rec("lower-west", "Lower Quay", "quay", [0, 74, 40, 112]));
  pushRect(cinder, rec("bell", "Bell Square", "quay", [40, 78, 58, 90]));
  pushRect(cinder, rec("long-stair", "Long Stair", "quay", [48, 74, 56, 112]));
  ["upper-town", "upper-west", "upper-east", "lower-quay", "lower-south", "lower-west", "bell", "long-stair"].forEach(safe);

  // Wings are walled. The Long Stair is the open walk between the two levels.
  SF.TOWN_WALLS = [
    { island: "cinderveil", x0: 8, y0: 86, x1: 24, y1: 90 },
    { island: "cinderveil", x0: 110, y0: 86, x1: 144, y1: 90 }
  ];

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

  SF.townWallBlocks = function (x, y) {
    var walls = SF.TOWN_WALLS || [];
    var i, w;
    for (i = 0; i < walls.length; i++) {
      w = walls[i];
      if (w.island && SF.islandId !== w.island) continue;
      if (x >= w.x0 * T && x < w.x1 * T && y >= w.y0 * T && y < w.y1 * T) return true;
    }
    return false;
  };

  var townWalk = SF.walkable;
  SF.walkable = function (x, y) {
    if (SF.townWallBlocks && SF.townWallBlocks(x, y)) return false;
    return townWalk ? townWalk(x, y) : false;
  };
})();
