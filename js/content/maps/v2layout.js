"use strict";

// Act 1 v2 islands. Tile boxes come from the approved map plan.
// World position is tile * 16. A few gates are nudged so Dash, Shardstep,
// and the hook stay in the ranges the plan describes.
var SF = window.SF || {};
window.SF = SF;

(function () {
  var T = 16;

  function P(tx, ty) {
    return { x: tx * T, y: ty * T };
  }

  function ell(id, name, group, box, extra) {
    var o = {
      id: id,
      name: name,
      group: group,
      k: "e",
      x: (box[0] + box[2]) / 2 * T,
      y: (box[1] + box[3]) / 2 * T,
      rx: (box[2] - box[0]) / 2 * T,
      ry: (box[3] - box[1]) / 2 * T
    };
    o.r = Math.max(o.rx, o.ry);
    if (extra) {
      var k;
      for (k in extra) if (Object.prototype.hasOwnProperty.call(extra, k)) o[k] = extra[k];
    }
    return o;
  }

  function rec(id, name, group, box, extra) {
    var o = {
      id: id,
      name: name,
      group: group,
      k: "r",
      x: box[0] * T,
      y: box[1] * T,
      w: (box[2] - box[0]) * T,
      h: (box[3] - box[1]) * T
    };
    if (extra) {
      var k;
      for (k in extra) if (Object.prototype.hasOwnProperty.call(extra, k)) o[k] = extra[k];
    }
    return o;
  }

  function flat(trails) {
    return trails.map(function (pts) {
      var row = [];
      pts.forEach(function (p) {
        row.push(p[0] * T, p[1] * T);
      });
      return row;
    });
  }

  function shapeOpen(sh, flags) {
    if (!sh.opens) return true;
    return !!(flags && flags[sh.opens]);
  }

  function inside(sh, x, y, margin) {
    var m = margin || 0;
    if (sh.k === "r" || (sh.w != null && sh.rx == null)) {
      return x >= sh.x + m && y >= sh.y + m && x <= sh.x + sh.w - m && y <= sh.y + sh.h - m;
    }
    var rx = (sh.rx || sh.r) - m;
    var ry = (sh.ry || sh.rx || sh.r) - m;
    if (rx <= 1 || ry <= 1) return false;
    var dx = (x - sh.x) / rx;
    var dy = (y - sh.y) / ry;
    return dx * dx + dy * dy <= 1;
  }

  function areaOf(sh) {
    if (sh.k === "r" || (sh.w != null && sh.rx == null)) return sh.w * sh.h;
    var rx = sh.rx || sh.r || 1;
    var ry = sh.ry || sh.r || 1;
    return Math.PI * rx * ry;
  }

  function allShapes() {
    return (SF.WALK.circles || []).concat(SF.WALK.rects || []);
  }

  SF.walkable = function (x, y) {
    var flags = SF.state && SF.state.flags;
    var list = allShapes();
    var i;
    for (i = 0; i < list.length; i++) {
      if (!shapeOpen(list[i], flags)) continue;
      if (inside(list[i], x, y, SF.WALK_MARGIN)) return true;
    }
    return false;
  };

  SF.zoneAt = function (x, y) {
    var flags = SF.state && SF.state.flags;
    var list = allShapes();
    var best = null;
    var bestA = Infinity;
    var i, sh, a;
    for (i = 0; i < list.length; i++) {
      sh = list[i];
      if (sh.zone === false) continue;
      if (!shapeOpen(sh, flags)) continue;
      if (!inside(sh, x, y, 0)) continue;
      a = areaOf(sh);
      if (a < bestA) {
        bestA = a;
        best = sh;
      }
    }
    return best || { id: "hush", name: "The Hush" };
  };

  SF.circle = function (id) {
    var list = allShapes();
    var i;
    for (i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  };

  var emberCircles = [
    ell("grove", "Maren's Grove", "ember", [38, 16, 66, 58]),
    ell("meadow", "The Meadow", "ember", [62, 28, 106, 68]),
    ell("hill", "Lamp Hill", "ember", [84, 4, 118, 38]),
    ell("scar", "The Scar", "scar", [102, 38, 134, 70]),
    ell("cinder", "Cinderstep", "cinder", [127, 2, 151, 28]),
    ell("ledge", "Shardstep", "cinder", [140.2, 52, 149.2, 61]),
    ell("hookledge", "The Under Span", "ember", [123.5, 32, 131.5, 39]),
    ell("hollow", "Whisper Hollow", "ember", [2, 34, 20, 52]),
    ell("wake", "The Waking Stones", "ember", [44, 56, 62, 74]),
    ell("perch", "Vane's Perch", "perch", [70, 89, 104, 104]),
    {
      id: "span", name: "The Broken Span", group: "span", k: "e", zone: false,
      x: 120 * T, y: 18 * T, r: 4 * T, rx: 4 * T, ry: 4 * T
    },
    {
      id: "gap", name: "The Broken Span", group: "span", k: "e", zone: false,
      x: 131 * T, y: 18 * T, r: 4 * T, rx: 4 * T, ry: 4 * T
    }
  ];

  var emberRects = [
    rec("west", "The West Ledge", "ember", [19, 41, 42, 45]),
    rec("lip", "The Broken Span", "span", [116, 16, 124, 20]),
    rec("dock", "The Dock Trail", "ember", [78, 66, 96, 83]),
    rec("rope", "The Rope Bridge", "perch", [85, 82, 89, 92]),
    rec("cottage", "Maren's Cottage", "ember", [60, 10, 86, 28]),
    rec("wake-path", "The Meadow", "ember", [58, 56, 74, 68])
  ];

  var cinderCircles = [
    ell("ash", "The Ashfields", "ash", [20, 26, 76, 78]),
    ell("nook", "The Cold Nook", "ash", [2, 44, 18, 60]),
    ell("nw", "The Hook Ledge", "ash", [8, 18, 20, 30]),
    ell("cliff", "Ilsa's Cliff", "ash", [72, 46, 106, 74]),
    ell("maw", "Maw Chamber", "vault", [118, 0, 156, 26]),
    ell("ridge", "The Ridge", "ridge", [24, 0, 72, 24], { opens: "mawDead" })
  ];

  var cinderRects = [
    rec("ash-link", "The Ashfields", "ash", [14, 50, 24, 54]),
    rec("vault", "Ember Vault", "vault", [78, 2, 120, 22]),
    rec("rubble", "The Ridge", "ridge", [70, 9, 80, 14], { opens: "mawDead" }),
    rec("down", "The Ridge Path", "ridge", [38, 22, 44, 34], { opens: "mawDead" }),
    rec("vledge", "Vault Ledge", "vault", [84, 30, 112, 38]),
    rec("quay", "Lowmoor Quay", "quay", [26, 74, 92, 98]),
    rec("pier", "The Pier", "quay", [54, 98, 68, 107])
  ];

  // Region ellipses kiss at a point, so the drawn trails need a walkable ribbon.
  // Radius stays under half a gate, so Dash, Shardstep, and hook gaps stay open.
  function stampTrail(circles, pts, group, extra) {
    var r = 20;
    var step = 12;
    var i, x0, y0, x1, y1, len, d, t, x, y, o, k;
    for (i = 0; i < pts.length - 1; i++) {
      x0 = pts[i][0] * T;
      y0 = pts[i][1] * T;
      x1 = pts[i + 1][0] * T;
      y1 = pts[i + 1][1] * T;
      len = Math.hypot(x1 - x0, y1 - y0);
      for (d = 0; d <= len; d += step) {
        t = len ? d / len : 0;
        x = x0 + (x1 - x0) * t;
        y = y0 + (y1 - y0) * t;
        o = {
          id: "trail-" + circles.length,
          name: "Path",
          group: group,
          k: "e",
          zone: false,
          x: x,
          y: y,
          r: r,
          rx: r,
          ry: r
        };
        if (extra) for (k in extra) if (Object.prototype.hasOwnProperty.call(extra, k)) o[k] = extra[k];
        circles.push(o);
      }
    }
  }

  [
    [[[53, 64], [66, 56], [84, 48]], "ember"],
    [[[84, 48], [76, 34], [73, 20]], "ember"],
    [[[84, 48], [64, 44], [50, 40], [40, 43], [12, 43]], "ember"],
    [[[84, 48], [104, 52], [117, 52]], "ember"],
    [[[84, 48], [87, 66], [87, 86], [87, 94]], "ember"],
    [[[84, 48], [96, 34], [100, 22], [101, 13]], "ember"],
    [[[101, 22], [112, 18], [123, 18]], "span"],
    [[[128, 18], [135, 14], [144, 10]], "cinder"]
  ].forEach(function (row) { stampTrail(emberCircles, row[0], row[1]); });

  [
    [[[58, 104], [58, 86], [48, 80], [46, 60], [46, 44]], "quay"],
    [[[46, 44], [30, 40]], "ash"],
    [[[46, 44], [66, 36]], "ash"],
    [[[46, 60], [40, 70]], "ash"],
    [[[46, 52], [74, 56], [92, 56]], "ash"],
    [[[30, 52], [10, 52]], "ash"],
    [[[96, 34], [90, 34]], "vault"],
    [[[118, 12], [128, 13]], "vault"],
    [[[34, 86], [84, 90]], "quay"]
  ].forEach(function (row) { stampTrail(cinderCircles, row[0], row[1]); });
  [
    [[90, 12], [75, 12], [52, 10], [41, 8]],
    [[41, 14], [41, 30]]
  ].forEach(function (pts) { stampTrail(cinderCircles, pts, "ridge", { opens: "mawDead" }); });

  function placeExtra(pack, id, tx, ty) {
    (pack.extras || []).forEach(function (ex) {
      if (ex.id === id) {
        ex.x = tx * T;
        ex.y = ty * T;
      }
    });
  }

  var ember = SF.ISLANDS.emberhold;
  ember.wake = P(53, 65);
  ember.lamp = P(101, 12);
  ember.walk = { circles: emberCircles, rects: emberRects };
  ember.npcs = [
    { id: "maren", name: "Old Maren", x: 68 * T, y: 18 * T },
    { id: "kestrel", name: "Kestrel Vane", x: 97 * T, y: 95 * T },
    { id: "cantor", name: "The Cantor", x: 8 * T, y: 41 * T }
  ];
  ember.texts = [
    { id: "wake-stone", x: 53 * T, y: 64 * T, speaker: "Waking Stones", node: "inspect.waking_stones" },
    { id: "scar-stone", x: 118 * T, y: 58 * T, speaker: "The Scar", node: "inspect.scar" },
    { id: "hull", x: 82 * T, y: 98 * T, speaker: "The Quickmercy", node: "inspect.quickmercy" },
    { id: "wrong-sky", x: 140 * T, y: 9 * T, speaker: "Standing Stones", node: "inspect.wrong_sky" },
    { id: "heartblossom", x: 76 * T, y: 22 * T, speaker: "Heartblossom", node: "inspect.heartblossom" },
    { id: "rope-bridge", x: 87 * T, y: 86 * T, speaker: "Rope Bridge", node: "inspect.rope_bridge" },
    { id: "span-planks", x: 120 * T, y: 18 * T, speaker: "Broken Span", node: "inspect.span_planks" },
    { id: "sail-patch", x: 94 * T, y: 97 * T, speaker: "Sail Patch", node: "inspect.sail_patch" }
  ];
  ember.pickups = [
    { id: "shard-meadow", kind: "shard", x: 94 * T, y: 44 * T },
    { id: "shard-grove", kind: "shard", x: 46 * T, y: 28 * T },
    { id: "shard-alcove", kind: "shard", x: 146.5 * T, y: 11 * T, secret: true },
    { id: "shard-step", kind: "shard", x: 143.5 * T, y: 56.5 * T },
    { id: "shard-hook", kind: "shard", x: 125 * T, y: 33.5 * T },
    { id: "bloom-meadow", kind: "bloom", x: 78 * T, y: 52 * T },
    { id: "bloom-hollow", kind: "bloom", x: 10 * T, y: 44 * T, secret: true }
  ];
  ember.spawns = [];
  ember.hooks = [
    { id: "hook-hill", x: 116 * T, y: 28 * T },
    { id: "hook-ledge", x: 126 * T, y: 35 * T }
  ];
  ember.paths = flat([
    [[53, 64], [66, 56], [84, 48]],
    [[84, 48], [76, 34], [73, 20]],
    [[84, 48], [64, 44], [50, 40], [40, 43], [12, 43]],
    [[84, 48], [104, 52], [117, 52]],
    [[84, 48], [87, 66], [87, 86], [87, 94]],
    [[84, 48], [96, 34], [100, 22], [101, 13]],
    [[101, 22], [112, 18], [123, 18]],
    [[128, 18], [135, 14], [144, 10]]
  ]);
  ember.props = [
    { kind: "stones", x: 53 * T, y: 64 * T },
    { kind: "cottage", x: 73 * T, y: 16 * T },
    { kind: "stones", x: 140 * T, y: 9 * T },
    { kind: "airship", x: 80 * T, y: 100 * T },
    { kind: "tree", x: 48 * T, y: 30 * T },
    { kind: "tree", x: 44 * T, y: 42 * T },
    { kind: "tree", x: 56 * T, y: 36 * T },
    { kind: "tree", x: 42 * T, y: 24 * T },
    { kind: "tree", x: 90 * T, y: 50 * T },
    { kind: "rock", x: 112 * T, y: 56 * T },
    { kind: "rock", x: 124 * T, y: 50 * T },
    { kind: "stake", x: 88 * T, y: 46 * T },
    { kind: "stake", x: 70 * T, y: 40 * T },
    { kind: "flower", x: 80 * T, y: 46 * T, c: "#ffd0e8" },
    { kind: "flower", x: 70 * T, y: 50 * T, c: "#ffe08a" },
    { kind: "flower", x: 100 * T, y: 24 * T, c: "#ffe08a" },
    { kind: "flower", x: 12 * T, y: 46 * T, c: "#c6b6ff" }
  ];
  placeExtra(ember, "chest-orchard", 50, 34);
  placeExtra(ember, "chest-meadow", 80, 50);
  placeExtra(ember, "chest-perch", 90, 96);
  placeExtra(ember, "ember-hearth", 76, 20);
  ember.bounds = { x: 0, y: 0, w: 152 * T, h: 104 * T };

  var cinder = SF.ISLANDS.cinderveil;
  cinder.wake = P(58, 101);
  cinder.lamp = P(41, 8);
  cinder.walk = { circles: cinderCircles, rects: cinderRects };
  cinder.npcs = [
    { id: "kestrel", name: "Kestrel Vane", x: 58 * T, y: 104 * T },
    { id: "tamsin", name: "Tamsin Reed", x: 29 * T, y: 89 * T },
    { id: "hesk", name: "Brother Hesk", x: 84 * T, y: 90 * T },
    { id: "ilsa", name: "Warden Ilsa", x: 92 * T, y: 56 * T },
    { id: "cantor", name: "The Cantor", x: 53 * T, y: 8 * T, when: "cinderLit", until: "cantorGone" }
  ];
  cinder.texts = [
    { id: "quay-sign", x: 40 * T, y: 88 * T, speaker: "Quay Sign", node: "inspect.lowmoor_sign" },
    { id: "quay-bell", x: 50 * T, y: 90 * T, speaker: "Quay Bell", node: "inspect.quay_bell" },
    { id: "ash-path", x: 46 * T, y: 60 * T, speaker: "Path Lamps", node: "inspect.ember_path" },
    { id: "ash-cog", x: 40 * T, y: 48 * T, speaker: "Cog", node: "inspect.ash_cog" },
    { id: "hesk-crate", x: 78 * T, y: 88 * T, speaker: "Hesk's Hideout", node: "inspect.choir_crate" },
    { id: "ilsa-order", x: 86 * T, y: 60 * T, speaker: "Posted Order", node: "inspect.ilsa_order" },
    { id: "vault-seal", x: 100 * T, y: 12 * T, speaker: "Vault Door", node: "inspect.vault_seal" },
    { id: "maw-mouth", x: 130 * T, y: 14 * T, speaker: "The Cinder Maw", node: "cinderveil.maw.prefight" },
    { id: "maw-tooth", x: 142 * T, y: 16 * T, speaker: "Maw Tooth", node: "inspect.maw_tooth" }
  ];
  cinder.pickups = [
    { id: "cog-link", kind: "cog", x: 30 * T, y: 40 * T },
    { id: "cog-ash", kind: "cog", x: 66 * T, y: 36 * T },
    { id: "cog-lip", kind: "cog", x: 38 * T, y: 71 * T },
    { id: "shard-workshop", kind: "shard", x: 38 * T, y: 92 * T },
    { id: "shard-ash-nook", kind: "shard", x: 9 * T, y: 50 * T, secret: true },
    { id: "shard-nw", kind: "shard", x: 12 * T, y: 19 * T },
    { id: "bloom-ash-nook", kind: "bloom", x: 12 * T, y: 54 * T, secret: true }
  ];
  cinder.spawns = [
    { id: "maw", kind: "maw", x: 137 * T, y: 12 * T, dormant: true, encounter: "boss_cinder_maw", boss: true }
  ];
  cinder.hooks = [
    { id: "hook1-ledge", x: 96 * T, y: 37 * T, needs: "vault" },
    { id: "hook1-cliff", x: 96 * T, y: 49 * T, needs: "vault" },
    { id: "hook2-vault", x: 98 * T, y: 20 * T, needs: "vault" },
    { id: "hook2-ledge", x: 98 * T, y: 32 * T, needs: "vault" },
    { id: "hook-spare-ash", x: 28 * T, y: 35 * T },
    { id: "hook-spare-ledge", x: 18.2 * T, y: 27.2 * T }
  ];
  cinder.paths = flat([
    [[58, 104], [58, 86], [48, 80], [46, 60], [46, 44]],
    [[46, 44], [30, 40]],
    [[46, 44], [66, 36]],
    [[46, 60], [40, 70]],
    [[46, 52], [74, 56], [92, 56]],
    [[30, 52], [10, 52]],
    [[96, 34], [90, 34]],
    [[90, 12], [75, 12], [52, 10], [41, 8]],
    [[41, 14], [41, 30]],
    [[118, 12], [128, 13]],
    [[34, 86], [84, 90]]
  ]);
  cinder.props = [
    { kind: "airship", x: 60 * T, y: 105 * T },
    { kind: "cottage", x: 34 * T, y: 86 * T },
    { kind: "hut", x: 72 * T, y: 84 * T },
    { kind: "stall", x: 46 * T, y: 84 * T },
    { kind: "tree", x: 40 * T, y: 48 * T },
    { kind: "tree", x: 58 * T, y: 55 * T },
    { kind: "rock", x: 70 * T, y: 50 * T },
    { kind: "rock", x: 88 * T, y: 62 * T },
    { kind: "stones", x: 98 * T, y: 34 * T },
    { kind: "stake", x: 48 * T, y: 70 * T },
    { kind: "flower", x: 36 * T, y: 90 * T, c: "#e7a070" },
    { kind: "flower", x: 60 * T, y: 88 * T, c: "#c8beb4" }
  ];
  placeExtra(cinder, "lowmoor-shop", 46, 84);
  placeExtra(cinder, "quay-bunk", 72, 84);
  placeExtra(cinder, "chest-ash", 40, 50);
  placeExtra(cinder, "chest-vault", 100, 12);
  placeExtra(cinder, "bench", 32, 88);
  placeExtra(cinder, "vault-stone", 98, 34);
  cinder.bounds = { x: 0, y: 0, w: 156 * T, h: 108 * T };

  function segDist(px, py, x0, y0, x1, y1) {
    var dx = x1 - x0;
    var dy = y1 - y0;
    var len2 = dx * dx + dy * dy || 1;
    var t = ((px - x0) * dx + (py - y0) * dy) / len2;
    if (t < 0) t = 0;
    else if (t > 1) t = 1;
    return Math.hypot(px - (x0 + dx * t), py - (y0 + dy * t));
  }

  function dressIsland(pack, seed, jobs, fences) {
    var s = seed >>> 0;
    function rnd() {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      return s / 4294967296;
    }
    var paths = pack.paths || [];
    var avoid = [];
    function remember(list, pad) {
      (list || []).forEach(function (p) {
        if (p && p.x != null) avoid.push({ x: p.x, y: p.y, pad: pad });
      });
    }
    remember(pack.npcs, 44);
    remember(pack.texts, 32);
    remember(pack.pickups, 30);
    remember(pack.hooks, 40);
    remember(pack.spawns, 44);
    remember(pack.extras, 32);
    if (pack.lamp) avoid.push({ x: pack.lamp.x, y: pack.lamp.y, pad: 72 });
    if (pack.wake) avoid.push({ x: pack.wake.x, y: pack.wake.y, pad: 48 });
    (pack.props || []).forEach(function (p) {
      avoid.push({ x: p.x, y: p.y, pad: p.kind === "cottage" || p.kind === "airship" || p.kind === "hut" || p.kind === "stall" ? 56 : 24 });
    });
    function pathDist(x, y) {
      var best = 1e9;
      var i, p;
      for (p = 0; p < paths.length; p++) {
        for (i = 0; i < paths[p].length - 2; i += 2) {
          best = Math.min(best, segDist(x, y, paths[p][i], paths[p][i + 1], paths[p][i + 2], paths[p][i + 3]));
        }
      }
      return best;
    }
    function onLand(x, y) {
      var shapes = (pack.walk.circles || []).concat(pack.walk.rects || []);
      var i, sh;
      for (i = 0; i < shapes.length; i++) {
        sh = shapes[i];
        if (sh.id && String(sh.id).indexOf("trail-") === 0) continue;
        if (sh.group === "span") continue;
        if (inside(sh, x, y, 16)) return true;
      }
      return false;
    }
    function clear(x, y, pathPad) {
      if (!onLand(x, y)) return false;
      if (pathDist(x, y) < pathPad) return false;
      var i, a, need;
      for (i = 0; i < avoid.length; i++) {
        a = avoid[i];
        need = a.pad;
        if (Math.hypot(x - a.x, y - a.y) < need) return false;
      }
      return true;
    }
    function put(kind, x, y, extra) {
      var o = { kind: kind, x: Math.round(x), y: Math.round(y) };
      var k;
      if (extra) for (k in extra) if (Object.prototype.hasOwnProperty.call(extra, k)) o[k] = extra[k];
      pack.props.push(o);
      avoid.push({ x: o.x, y: o.y, pad: o.block ? 28 : 16 });
    }
    (jobs || []).forEach(function (job) {
      var placed = 0;
      var tries = 0;
      var box = job.box;
      var cx = (box[0] + box[2]) / 2 * T;
      var cy = (box[1] + box[3]) / 2 * T;
      var rx = (box[2] - box[0]) / 2 * T;
      var ry = (box[3] - box[1]) / 2 * T;
      var limit = job.n * 50;
      while (placed < job.n && tries < limit) {
        tries += 1;
        var ang = rnd() * Math.PI * 2;
        var rad = job.rim ? (0.62 + rnd() * 0.34) : Math.sqrt(rnd()) * 0.92;
        var x = cx + Math.cos(ang) * rx * rad;
        var y = cy + Math.sin(ang) * ry * rad;
        var block = job.block || 0;
        var pathPad = block ? block + 12 : 16;
        if (!clear(x, y, pathPad)) continue;
        var extra = {};
        if (block) extra.block = block;
        if (job.colors) extra.c = job.colors[(rnd() * job.colors.length) | 0];
        put(job.kind, x, y, extra);
        placed += 1;
      }
    });
    (fences || []).forEach(function (f) {
      var i, x, y, n;
      n = f.n || 3;
      for (i = 0; i < n; i++) {
        x = f.x0 + (f.x1 - f.x0) * (n === 1 ? 0 : i / (n - 1));
        y = f.y0 + (f.y1 - f.y0) * (n === 1 ? 0 : i / (n - 1));
        if (!clear(x, y, 18)) continue;
        put(f.kind, x, y, null);
      }
    });
    (pack.props || []).forEach(function (p) {
      if (p.block) return;
      if (p.kind !== "tree" && p.kind !== "bush") return;
      var r = p.kind === "tree" ? 8 : 6;
      if (pathDist(p.x, p.y) <= r + 12) return;
      var spots = []
        .concat(pack.npcs || [], pack.texts || [], pack.pickups || [], pack.hooks || [], pack.spawns || [], pack.extras || []);
      if (pack.lamp) spots.push(pack.lamp);
      if (pack.wake) spots.push(pack.wake);
      var i, q;
      for (i = 0; i < spots.length; i++) {
        q = spots[i];
        if (q && Math.hypot(p.x - q.x, p.y - q.y) < r + 8) return;
      }
      for (i = 0; i < pack.props.length; i++) {
        q = pack.props[i];
        if (q === p) continue;
        if (Math.hypot(p.x - q.x, p.y - q.y) < r + 14) return;
      }
      p.block = r;
    });
  }

  var bloom = ["#ffd0e8", "#ffe08a", "#c6b6ff"];
  dressIsland(ember, 0x5f17, [
    { kind: "tree", box: [38, 16, 66, 58], n: 26, block: 8 },
    { kind: "bush", box: [38, 16, 66, 58], n: 16, block: 6 },
    { kind: "tuft", box: [38, 16, 66, 58], n: 18 },
    { kind: "flower", box: [38, 16, 66, 58], n: 10, colors: bloom },
    { kind: "stump", box: [38, 16, 66, 58], n: 3 },
    { kind: "log", box: [38, 16, 66, 58], n: 2 },
    { kind: "tree", box: [62, 28, 106, 68], n: 10, block: 8, rim: true },
    { kind: "bush", box: [62, 28, 106, 68], n: 14, block: 6, rim: true },
    { kind: "flower", box: [62, 28, 106, 68], n: 16, colors: bloom },
    { kind: "tuft", box: [62, 28, 106, 68], n: 24 },
    { kind: "rock", box: [62, 28, 106, 68], n: 5, rim: true },
    { kind: "stump", box: [62, 28, 106, 68], n: 2 },
    { kind: "log", box: [62, 28, 106, 68], n: 2 },
    { kind: "tree", box: [84, 4, 118, 38], n: 6, block: 8, rim: true },
    { kind: "bush", box: [84, 4, 118, 38], n: 5, block: 6, rim: true },
    { kind: "rock", box: [84, 4, 118, 38], n: 7, rim: true },
    { kind: "tuft", box: [84, 4, 118, 38], n: 12 },
    { kind: "flower", box: [84, 4, 118, 38], n: 4, colors: bloom },
    { kind: "rock", box: [102, 38, 134, 70], n: 10 },
    { kind: "tree", box: [102, 38, 134, 70], n: 4, block: 8, rim: true },
    { kind: "stump", box: [102, 38, 134, 70], n: 3 },
    { kind: "tuft", box: [102, 38, 134, 70], n: 8 },
    { kind: "bush", box: [44, 56, 62, 74], n: 3, block: 6 },
    { kind: "flower", box: [44, 56, 62, 74], n: 4, colors: bloom },
    { kind: "bush", box: [70, 89, 104, 104], n: 4, block: 6 },
    { kind: "tuft", box: [2, 34, 20, 52], n: 6 },
    { kind: "bush", box: [2, 34, 20, 52], n: 3, block: 6 }
  ], [
    { kind: "fence", x0: 64 * T, y0: 14 * T, x1: 64 * T, y1: 19 * T, n: 3 },
    { kind: "fence", x0: 82 * T, y0: 14 * T, x1: 82 * T, y1: 19 * T, n: 3 }
  ]);
  dressIsland(cinder, 0xc1ad, [
    { kind: "tree", box: [20, 26, 76, 78], n: 16, block: 7 },
    { kind: "bush", box: [20, 26, 76, 78], n: 10, block: 5 },
    { kind: "rock", box: [20, 26, 76, 78], n: 14 },
    { kind: "stump", box: [20, 26, 76, 78], n: 6 },
    { kind: "log", box: [20, 26, 76, 78], n: 4 },
    { kind: "tuft", box: [20, 26, 76, 78], n: 16 },
    { kind: "tree", box: [72, 46, 106, 74], n: 5, block: 7, rim: true },
    { kind: "rock", box: [72, 46, 106, 74], n: 8 },
    { kind: "stump", box: [72, 46, 106, 74], n: 3 },
    { kind: "tuft", box: [2, 44, 18, 60], n: 4 },
    { kind: "tree", box: [8, 18, 20, 30], n: 2, block: 7 },
    { kind: "rock", box: [24, 0, 72, 24], n: 6, rim: true },
    { kind: "tree", box: [24, 0, 72, 24], n: 3, block: 7, rim: true },
    { kind: "tuft", box: [26, 74, 92, 98], n: 6 }
  ], [
    { kind: "fence_burnt", x0: 30 * T, y0: 76 * T, x1: 42 * T, y1: 76 * T, n: 4 },
    { kind: "fence_burnt", x0: 70 * T, y0: 76 * T, x1: 88 * T, y1: 76 * T, n: 4 },
    { kind: "fence_burnt", x0: 30 * T, y0: 82 * T, x1: 40 * T, y1: 82 * T, n: 3 }
  ]);

  // Ground shards the player can walk to after the lamp reveal, without the
  // secret alcove, Shardstep, or the hook. Emberhold's lamp costs 5, so there
  // are extras. Cinderveil's lamp costs 3, so the same.
  ember.pickups.push(
    { id: "shard-dock", kind: "shard", x: 90 * T, y: 74 * T },
    { id: "shard-west", kind: "shard", x: 28 * T, y: 43 * T },
    { id: "shard-perch", kind: "shard", x: 76 * T, y: 96 * T },
    { id: "shard-scar", kind: "shard", x: 130 * T, y: 60 * T },
    { id: "shard-hill", kind: "shard", x: 100 * T, y: 32 * T }
  );
  cinder.pickups.push(
    { id: "shard-ash", kind: "shard", x: 50 * T, y: 58 * T },
    { id: "shard-quay", kind: "shard", x: 66 * T, y: 92 * T },
    { id: "shard-cliff", kind: "shard", x: 80 * T, y: 66 * T },
    { id: "shard-rise", kind: "shard", x: 54 * T, y: 40 * T }
  );

  // Upper surfaces are lumpy, not circles. `block` is the south cliff
  // that stops walking (px). `face` continues past it as grass and shadow.
  // Ramps follow SF.PATHS so every authored route stays open.
  function terrace(id, tx, ty, rx, ry, block, face, level, kind, seed, amp) {
    return {
      id: id,
      x: tx * T,
      y: ty * T,
      rx: rx * T,
      ry: ry * T,
      block: block,
      face: face,
      level: level,
      kind: kind || "rock",
      ramp: 20,
      seed: seed,
      amp: amp
    };
  }

  SF.TERRACES = {
    emberhold: [
      terrace("hill-1", 99, 19.0, 11.6, 7.0, 48, 64, 1, "rock", 1.2, 0.24),
      terrace("hill-2", 100.2, 14.8, 8.2, 4.6, 42, 56, 2, "rock", 2.7, 0.22),
      terrace("hill-3", 101, 10.4, 5.4, 3.2, 36, 50, 3, "rock", 4.4, 0.2),
      terrace("cottage", 72.2, 17.0, 9.4, 6.6, 32, 46, 1, "rock", 0.7, 0.05),
      terrace("grove", 51, 23.0, 8.4, 5.2, 0, 36, 1, "grass", 3.1, 0.2),
      terrace("scar", 118.2, 42.6, 9.4, 4.2, 32, 46, 1, "rock", 5.5, 0.2)
    ],
    cinderveil: [
      terrace("ridge-1", 44, 12.8, 11.2, 3.8, 48, 62, 1, "rock", 1.9, 0.24),
      terrace("ridge-2", 41.2, 8.0, 6.4, 2.7, 40, 54, 2, "rock", 6.2, 0.2)
    ]
  };

  SF.terraceWobble = function (t, ang) {
    var s = t.seed || 1;
    var amp = Math.min(t.amp == null ? 0.05 : t.amp, 0.07);
    var w = Math.sin(ang * 2 + s) * 0.72 + Math.sin(ang + s * 0.6) * 0.28;
    return 1 + amp * w;
  };

  SF.terraceRadius = function (t, ang) {
    var wob = SF.terraceWobble(t, ang);
    var rx = t.rx * wob;
    var ry = t.ry * wob;
    var c = Math.cos(ang);
    var s = Math.sin(ang);
    return (rx * ry) / (Math.hypot(ry * c, rx * s) || 0.001);
  };

  SF.terraceMetrics = function (t, wx, wy) {
    var dx = wx - t.x;
    var dy = wy - t.y;
    var dist = Math.hypot(dx, dy) || 0.001;
    var ang = Math.atan2(dy, dx);
    var rDir = SF.terraceRadius(t, ang);
    var gap = dist - rDir;
    return { gap: gap, ny: dy / dist, deep: gap < 0 ? -gap : 0, ang: ang };
  };

  function distToSeg(px, py, x0, y0, x1, y1) {
    var dx = x1 - x0;
    var dy = y1 - y0;
    var len2 = dx * dx + dy * dy || 1;
    var u = ((px - x0) * dx + (py - y0) * dy) / len2;
    if (u < 0) u = 0;
    else if (u > 1) u = 1;
    return Math.hypot(px - (x0 + dx * u), py - (y0 + dy * u));
  }

  SF.routeApproach = function (x, y) {
    var paths = SF.PATHS || [];
    var best = 96;
    var cross = false;
    var p, i, x0, y0, x1, y1, d, sdx, sdy;
    for (p = 0; p < paths.length; p++) {
      for (i = 0; i < paths[p].length - 2; i += 2) {
        x0 = paths[p][i];
        y0 = paths[p][i + 1];
        x1 = paths[p][i + 2];
        y1 = paths[p][i + 3];
        if (x < Math.min(x0, x1) - best || x > Math.max(x0, x1) + best) continue;
        if (y < Math.min(y0, y1) - best || y > Math.max(y0, y1) + best) continue;
        d = distToSeg(x, y, x0, y0, x1, y1);
        if (d < best) {
          best = d;
          sdx = x1 - x0;
          sdy = y1 - y0;
          cross = Math.abs(sdy) > Math.abs(sdx) * 0.4;
        }
      }
    }
    return { d: best, cross: cross };
  };

  SF.routeDistance = function (x, y) {
    return SF.routeApproach(x, y).d;
  };

  SF.nearRoute = function (x, y, pad) {
    return SF.routeDistance(x, y) < (pad == null ? 28 : pad);
  };

  // South edge of a terrace, as a height curtain: lip y for each world x.
  // The face then drops straight down, so the rise reads as land rather than a ring.
  SF.terraceSouthLip = function (t, wx) {
    var lip = t._lip;
    if (!lip) {
      var minX = Math.floor(t.x - t.rx * 1.55 - 12);
      var maxX = Math.ceil(t.x + t.rx * 1.55 + 12);
      var n = Math.max(1, maxX - minX + 1);
      var arr = new Float32Array(n);
      var i;
      for (i = 0; i < n; i++) arr[i] = -1e9;
      var a, r, x, y, x0, y0, steps, s, xx, yy, idx, south;
      x0 = null;
      south = -1e9;
      for (a = 0.15; a <= Math.PI - 0.15; a += 0.008) {
        if (Math.sin(a) < 0.42) {
          x0 = null;
          continue;
        }
        r = SF.terraceRadius(t, a);
        x = t.x + Math.cos(a) * r;
        y = t.y + Math.sin(a) * r;
        if (y > south) south = y;
        if (x0 != null) {
          steps = Math.max(1, Math.ceil(Math.abs(x - x0)));
          for (s = 0; s <= steps; s++) {
            xx = x0 + (x - x0) * (s / steps);
            yy = y0 + (y - y0) * (s / steps);
            idx = Math.round(xx) - minX;
            if (idx >= 0 && idx < n && yy > arr[idx]) arr[idx] = yy;
          }
        }
        x0 = x;
        y0 = y;
      }
      var smooth = new Float32Array(n);
      var k, sum, cnt, j;
      for (i = 0; i < n; i++) {
        if (arr[i] < -1e8) {
          smooth[i] = arr[i];
          continue;
        }
        sum = 0;
        cnt = 0;
        for (k = -5; k <= 5; k++) {
          j = i + k;
          if (j < 0 || j >= n || arr[j] < -1e8) continue;
          if (Math.abs(arr[j] - arr[i]) > 14) continue;
          sum += arr[j];
          cnt++;
        }
        smooth[i] = cnt ? sum / cnt : arr[i];
      }
      var chain = [];
      var run = false;
      for (i = 0; i < n; i++) {
        if (smooth[i] < -1e8) {
          run = false;
          continue;
        }
        if (!run || (i % 3) === 0) chain.push(minX + i, smooth[i]);
        run = true;
      }
      t._lip = { minX: minX, maxX: maxX, y: smooth };
      t._chain = chain;
      t._southBase = south + (t.block || t.face || 0);
      lip = t._lip;
    }
    i = Math.round(wx) - lip.minX;
    if (i < 0 || i >= lip.y.length || lip.y[i] < -1e8) return null;
    return lip.y[i];
  };

  SF.terraceLipChain = function (t) {
    if (!t._lip) SF.terraceSouthLip(t, t.x);
    return t._chain || [];
  };

  SF.cliffBlocks = function (x, y) {
    var list = (SF.TERRACES && SF.TERRACES[SF.islandId]) || [];
    var i, t, m, lip, drop, reach;
    for (i = 0; i < list.length; i++) {
      t = list[i];
      if (!t.block) continue;
      reach = 1.55;
      if (x < t.x - t.rx * reach - 12 || x > t.x + t.rx * reach + 12) continue;
      if (y < t.y - 8 || y > t.y + t.ry * reach + t.block + 12) continue;
      m = SF.terraceMetrics(t, x, y);
      if (m.gap <= 0) continue;
      lip = SF.terraceSouthLip(t, x);
      if (lip == null) continue;
      drop = y - lip;
      if (drop <= 0.5 || drop >= t.block) continue;
      if (SF.nearRoute(x, y, t.ramp)) continue;
      return true;
    }
    return false;
  };

  var landWalkable = SF.walkable;
  SF.walkable = function (x, y) {
    if (!landWalkable(x, y)) return false;
    var props = SF.PROPS;
    var i, p, r, dx, dy;
    if (props) {
      for (i = 0; i < props.length; i++) {
        p = props[i];
        r = p.block;
        if (!r) continue;
        dx = x - p.x;
        dy = y - p.y;
        if (dx * dx + dy * dy < r * r) return false;
      }
    }
    if (SF.cliffBlocks(x, y)) return false;
    return true;
  };
  cinder.spots = {
    vledge: P(98, 34),
    maw: P(137, 12),
    lamp: P(41, 8),
    cantor: P(53, 8),
    pier: P(58, 101)
  };

  SF.DOCKS.emberhold = P(88, 98);
  SF.DOCKS.cinderveil = P(58, 101);

  ["saltmere", "highspire", "gullrock"].forEach(function (id) {
    var pack = SF.ISLANDS[id];
    if (!pack || !pack.spawns) return;
    pack.spawns = pack.spawns.filter(function (sp) {
      return sp.boss || sp.kind === "tidewyrm" || sp.kind === "maw";
    });
  });

  Object.keys(SF.ISLANDS).forEach(function (id) {
    (SF.ISLANDS[id].extras || []).forEach(function (ex) {
      if (ex.kind === "inn" && ex.blurb) {
        ex.blurb = ex.blurb.replace(/, and field enemies come back/, "");
      }
    });
  });

  SF.spot = function (name) {
    var pack = SF.ISLANDS[SF.islandId] || {};
    var spots = pack.spots || {};
    return spots[name] || null;
  };

  var meadowForms = [
    { id: "em_wisp1", w: 40 },
    { id: "em_wisps", w: 50 },
    { id: "em_brumekin", w: 10 }
  ];
  var groveForms = [
    { id: "em_wisps", w: 60 },
    { id: "em_wisp1", w: 30 },
    { id: "em_brumekin", w: 10 }
  ];
  var hillForms = [
    { id: "em_wisps", w: 70 },
    { id: "em_brumekin", w: 30 }
  ];
  var scarForms = [
    { id: "em_brumekin", w: 50, carrier: true },
    { id: "em_wisps", w: 30 },
    { id: "em_brume_wisp", w: 20, carrier: true }
  ];
  var dockForms = [
    { id: "em_wisp1", w: 60 },
    { id: "em_wisps", w: 40 }
  ];
  var cinderForms = [
    { id: "em_brumekin", w: 40 },
    { id: "em_wisps", w: 30 },
    { id: "em_choirling", w: 30 }
  ];
  var ashForms = [
    { id: "cv_ashlings", w: 45 },
    { id: "cv_ash1", w: 20 },
    { id: "cv_mixed", w: 25, carrier: true },
    { id: "cv_cinderhound", w: 10, carrier: true }
  ];
  var nookForms = [
    { id: "cv_ashlings", w: 50 },
    { id: "cv_mixed", w: 50 }
  ];
  var cliffForms = [
    { id: "cv_mixed", w: 50 },
    { id: "cv_cinderhound", w: 50 }
  ];
  var vaultForms = [
    { id: "cv_cinderhound", w: 40, carrier: true },
    { id: "cv_mixed", w: 40, carrier: true },
    { id: "cv_hounds", w: 20, carrier: true }
  ];

  function zone(rate, level, bg, forms, extra) {
    var o = { rate: rate, level: level, bg: bg, forms: forms || [] };
    if (extra) {
      var k;
      for (k in extra) if (Object.prototype.hasOwnProperty.call(extra, k)) o[k] = extra[k];
    }
    return o;
  }

  SF.ZONES = {
    wake: zone(40, 3, "emberhold_meadow", meadowForms, { safeUntil: "metMaren" }),
    "wake-path": zone(40, 3, "emberhold_meadow", meadowForms),
    grove: zone(35, 3, "emberhold_meadow", groveForms),
    meadow: zone(40, 3, "emberhold_meadow", meadowForms),
    hill: zone(40, 4, "emberhold_meadow", hillForms, { safeWhen: "lampLit" }),
    lip: zone(40, 4, "emberhold_meadow", hillForms, { safeWhen: "lampLit" }),
    scar: zone(25, 5, "emberhold_scar", scarForms, { carrierRegion: "scar" }),
    dock: zone(45, 3, "emberhold_meadow", dockForms),
    rope: zone(45, 3, "emberhold_meadow", dockForms),
    cinder: zone(30, 5, "emberhold_scar", cinderForms),
    ledge: zone(30, 5, "emberhold_scar", cinderForms),
    hookledge: zone(40, 4, "emberhold_meadow", hillForms),
    west: zone(35, 4, "emberhold_meadow", [{ id: "em_wisps", w: 100 }]),
    hollow: { safe: true },
    cottage: { safe: true },
    perch: { safe: true },
    ash: zone(30, 7, "cinderveil_ash", ashForms, { carrierRegion: "ash" }),
    "ash-link": zone(30, 7, "cinderveil_ash", ashForms, { carrierRegion: "ash" }),
    nook: zone(30, 7, "cinderveil_ash", nookForms),
    nw: zone(30, 7, "cinderveil_ash", nookForms),
    cliff: zone(35, 8, "cinderveil_ash", cliffForms),
    vault: zone(25, 8, "ember_vault", vaultForms, { carrierRegion: "vault" }),
    maw: { safe: true },
    ridge: { safe: true, opens: "mawDead" },
    rubble: { safe: true, opens: "mawDead" },
    down: { safe: true, opens: "mawDead" },
    vledge: { safe: true },
    quay: { safe: true },
    pier: { safe: true },
    "sm-town": { safe: true },
    "sm-lip": { safe: true },
    "sm-arena": { safe: true },
    "sm-shore": zone(40, 10, "saltmere_shore", [
      { id: "sm_saltwisps", w: 40 },
      { id: "sm_gulls", w: 30 },
      { id: "sm_mixed", w: 30 }
    ]),
    "sm-shore-link": zone(40, 10, "saltmere_shore", [
      { id: "sm_saltwisps", w: 50 },
      { id: "sm_gulls", w: 50 }
    ]),
    "sm-deck": zone(40, 11, "saltmere_wreck", [
      { id: "sm_drowned", w: 70 },
      { id: "sm_mixed", w: 30 }
    ]),
    "sm-hold": zone(40, 11, "saltmere_wreck", [{ id: "sm_drowned", w: 100 }]),
    "sm-islet": zone(40, 11, "saltmere_wreck", [{ id: "sm_drowned", w: 100 }]),
    "hs-town": { safe: true },
    "hs-gate": { safe: true },
    "hs-road-1": zone(35, 12, "highspire_road", [
      { id: "hs_choir_patrol", w: 60 },
      { id: "hs_sentinel", w: 40 }
    ]),
    "hs-road-2": zone(35, 12, "highspire_road", [
      { id: "hs_choir_patrol", w: 60 },
      { id: "hs_sentinel", w: 40 }
    ]),
    "hs-road-3": zone(35, 12, "highspire_road", [
      { id: "hs_choir_patrol", w: 50 },
      { id: "hs_sentinel", w: 50 }
    ]),
    "hs-road-4": zone(35, 12, "highspire_road", [
      { id: "hs_sentinel", w: 60 },
      { id: "hs_choir_patrol", w: 40 }
    ]),
    "gr-rock": zone(40, 11, "saltmere_shore", [{ id: "sm_mixed", w: 100 }])
  };

  SF.ENC_KEY = "shardfall.encounters";

  SF.encounterMul = function () {
    var v = "normal";
    try {
      var store = SF.storage ? SF.storage() : null;
      if (store) v = store.getItem(SF.ENC_KEY) || "normal";
    } catch (err) { /* keep normal */ }
    if (v === "fewer") return 0.5;
    if (v === "more") return 1.5;
    return 1;
  };

  SF.setEncounterRate = function (v) {
    var store = SF.storage ? SF.storage() : null;
    if (store) store.setItem(SF.ENC_KEY, v === "fewer" || v === "more" ? v : "normal");
  };

  function pickForm(forms, rand) {
    var total = 0;
    var i;
    for (i = 0; i < forms.length; i++) total += forms[i].w;
    var roll = (rand ? rand() : Math.random()) * total;
    var acc = 0;
    for (i = 0; i < forms.length; i++) {
      acc += forms[i].w;
      if (roll <= acc) return forms[i];
    }
    return forms[forms.length - 1];
  }

  SF.zoneSpec = function (zoneId) {
    return SF.ZONES[zoneId] || null;
  };

  function lampSlows(zoneId) {
    var s = SF.state;
    if (!s || !s.flags) return false;
    if (zoneId === "scar") return false;
    if (SF.islandId === "emberhold" && s.flags.lampLit) return true;
    if (SF.islandId === "cinderveil" && s.flags.cinderLit) return true;
    return false;
  }

  SF.encounterRateFor = function (zoneId, flags) {
    var spec = SF.ZONES[zoneId];
    flags = flags || (SF.state && SF.state.flags) || {};
    if (!spec || spec.safe || !spec.rate) return 0;
    if (spec.opens && !flags[spec.opens]) return 0;
    if (spec.safeUntil && !flags[spec.safeUntil]) return 0;
    if (spec.safeWhen && flags[spec.safeWhen]) return 0;
    if (SF.islandId === "emberhold" && !flags.metMaren && zoneId !== "scar") return 0;
    var rate = spec.rate;
    if (zoneId !== "scar") {
      if (SF.islandId === "emberhold" && flags.lampLit) rate *= 3;
      if (SF.islandId === "cinderveil" && flags.cinderLit) rate *= 3;
    }
    return rate;
  };

  SF.rollEncounter = function (s, zone, rand) {
    if (!s || s.mode !== "play" || !zone) return false;
    if ((s.encounterGrace || 0) > 0) {
      s.encounterGrace -= 1;
      return false;
    }
    var rate = SF.encounterRateFor(zone.id, s.flags);
    if (!rate) return false;
    var roll = rand ? rand() : Math.random();
    if (roll > SF.encounterMul() / rate) return false;
    var spec = SF.ZONES[zone.id];
    var form = pickForm(spec.forms, rand);
    if (!form || !SF.Battle) return false;
    var started = SF.Battle.start(form.id, {
      bg: spec.bg,
      zoneLevel: spec.level,
      carrier: !!form.carrier,
      carrierRegion: form.carrier ? spec.carrierRegion : null,
      fixed: false,
      canFlee: true
    });
    if (started) s.encounterGrace = 10;
    return started;
  };

  SF.noteTravel = function (s, x0, y0, x1, y1, zone) {
    if (!s || s.mode !== "play") return;
    var dist = Math.hypot(x1 - x0, y1 - y0);
    if (dist < 0.01) return;
    if (zone && zone.id !== s.zoneId) {
      var prev = s.zoneId;
      s.zoneId = zone.id;
      if (prev) s.encounterGrace = Math.max(s.encounterGrace || 0, 10);
      if (zone.id !== "cinder") s._choirlingArmed = false;
      if (zone.id === "cinder" && s.flags.shard_sense && !s.flags.choirlingDown && !s._choirlingArmed) {
        s._choirlingArmed = true;
        if (SF.Battle && SF.Battle.start("em_choirling", {
          canFlee: false,
          fixed: true,
          carrier: true,
          carrierRegion: "cinderstep",
          bg: "emberhold_scar",
          zoneLevel: 5
        })) {
          s.encounterGrace = 10;
          return;
        }
      }
    }
    s.stepAcc = (s.stepAcc || 0) + dist;
    while (s.stepAcc >= T && s.mode === "play") {
      s.stepAcc -= T;
      SF.rollEncounter(s, zone);
    }
  };

  SF.simulateEncounterRate = function (zoneId, steps, seed, flags) {
    var rand = SF.mulberry32(seed >>> 0);
    var spec = SF.ZONES[zoneId];
    var n = 0;
    var grace = 10;
    var i, rate, form;
    flags = flags || { metMaren: true };
    if (!spec || !spec.rate) return 0;
    var prevIsland = SF.islandId;
    if (zoneId.indexOf("sm-") === 0 || zoneId === "gr-rock") SF.islandId = zoneId.indexOf("sm-") === 0 ? "saltmere" : "gullrock";
    else if (zoneId.indexOf("hs-") === 0) SF.islandId = "highspire";
    else if (zoneId === "ash" || zoneId === "vault" || zoneId === "cliff" || zoneId === "nook") SF.islandId = "cinderveil";
    else SF.islandId = "emberhold";
    for (i = 0; i < steps; i++) {
      if (grace > 0) {
        grace -= 1;
        continue;
      }
      rate = spec.rate;
      if (spec.safeUntil && !flags[spec.safeUntil]) continue;
      if (spec.safeWhen && flags[spec.safeWhen]) continue;
      if (SF.islandId === "emberhold" && !flags.metMaren && zoneId !== "scar") continue;
      if (zoneId !== "scar" && flags.lampLit && SF.islandId === "emberhold") rate *= 3;
      if (rand() <= 1 / rate) {
        n += 1;
        grace = 10;
        form = pickForm(spec.forms, rand);
        if (form) { /* formation chosen, not started */ }
      }
    }
    SF.islandId = prevIsland;
    return n;
  };

  SF.lampReserve = function (s) {
    if (!s || !s.flags) return 0;
    if (!s.flags.lampLit && s.quest === "gather") return SF.QUEST_SHARDS || 5;
    if (!s.flags.cinderLit && s.quest === "relight") return SF.CINDER_SHARDS || 3;
    return 0;
  };

  SF.shardReachable = function (item) {
    if (!item) return false;
    var p = SF.state && SF.state.player;
    if (item.id === "shard-step") return !!(p && p.shardstep);
    if (item.id === "shard-hook" || item.id === "shard-nw") return !!(p && p.grapple);
    return true;
  };

  SF.carrierAim = function (s) {
    if (!s || !s.flags || !s.player) return null;
    var got = s.flags.carriers || {};
    var options = [];
    function push(id, zoneId, ok) {
      if (got[id] || !ok) return;
      var sh = SF.circle(zoneId);
      if (sh) options.push(sh);
    }
    if (!s.flags.lampLit && s.quest === "gather") {
      push("scar", "scar", true);
      push("cinderstep", "cinder", true);
    }
    if (!s.flags.cinderLit && s.quest === "relight") {
      push("ash", "ash", true);
      push("vault", "vault", !!(s.player.grapple));
    }
    if (!options.length) return null;
    var best = options[0];
    var bestD = Infinity;
    var i, d;
    for (i = 0; i < options.length; i++) {
      d = SF.dist(s.player.x, s.player.y, options[i].x, options[i].y);
      if (d < bestD) {
        bestD = d;
        best = options[i];
      }
    }
    return { x: best.x, y: best.y };
  };

  SF.spareShards = function (s) {
    if (!s) return 0;
    return Math.max(0, (s.shardsHeld || 0) - SF.lampReserve(s));
  };

  SF.handMeter = function (s) {
    if (!s) return "Hand ◇◇◇◇◇ 0/5";
    var cost = 0;
    if (!s.flags.lampLit) cost = 5;
    else if (!s.flags.cinderLit && (SF.islandId === "cinderveil" || s.quest === "quay" || s.quest === "cogs" || s.quest === "vault" || s.quest === "trial" || s.quest === "seal" || s.quest === "maw" || s.quest === "relight" || s.quest === "cantor")) cost = 3;
    if (!cost) return "✦ " + SF.spareShards(s) + " spare";
    var n = Math.max(0, Math.min(cost, s.shardsHeld || 0));
    var glyphs = "";
    var i;
    for (i = 0; i < cost; i++) glyphs += i < n ? "✦" : "◇";
    return "Hand " + glyphs + " " + n + "/" + cost;
  };

  SF.armReveal = function (text) {
    var s = SF.state;
    if (!s || !text) return;
    if (String(text).indexOf("Maren points up the hill") === 0) {
      s.revealPan = { t: 0, dur: 5.2 };
    }
  };

  SF.audit = function () {
    var issues = [];
    var prev = SF.islandId;
    var saved = SF.state;
    SF.mountIsland("emberhold");
    SF.state = saved || { flags: {} };
    function check(label, x, y) {
      if (!SF.walkable(x, y)) issues.push(label + " not walkable (" + Math.round(x) + "," + Math.round(y) + ")");
    }
    check("wake", SF.WAKE.x, SF.WAKE.y);
    check("lamp", SF.LAMP.x, SF.LAMP.y);
    SF.NPCS.forEach(function (n) { check(n.id, n.x, n.y); });
    SF.TEXTS.forEach(function (t) { check(t.id, t.x, t.y); });
    SF.PICKUPS.forEach(function (p) { check(p.id, p.x, p.y); });
    (SF.EXTRAS || []).forEach(function (ex) { check(ex.id, ex.x, ex.y); });
    (SF.HOOKS || []).forEach(function (h) { check(h.id, h.x, h.y); });
    var span = SF.circle("span");
    var gap = SF.circle("gap");
    var dx = gap.x - span.x;
    var dy = gap.y - span.y;
    var len = Math.hypot(dx, dy) || 1;
    var ux = dx / len;
    var uy = dy / len;
    var lipX = span.x + ux * (span.r - SF.WALK_MARGIN);
    var lipY = span.y + uy * (span.r - SF.WALK_MARGIN);
    var dash = SF.DASH_SPEED * SF.DASH_TIME;
    var plus = SF.DASH_SPEED_PLUS * SF.DASH_TIME;
    if (!SF.walkable(lipX, lipY)) issues.push("dash lip not walkable");
    if (SF.walkable(lipX + ux * 36, lipY + uy * 36)) issues.push("broken span can be walked");
    if (!SF.walkable(lipX + ux * dash, lipY + uy * dash)) issues.push("base dash from the lip misses Cinderstep");
    if (SF.walkable(lipX + ux * (dash * 1.2) * 0 + ux * (dash - 28), lipY)) { /* keep */ }
    var midX = (span.x + gap.x) / 2;
    var midY = (span.y + gap.y) / 2;
    if (SF.walkable(midX, midY)) issues.push("span midpoint is walkable");
    var scar = SF.circle("scar");
    var ledge = SF.circle("ledge");
    var sx = ledge.x - scar.x;
    var sy = ledge.y - scar.y;
    var sl = Math.hypot(sx, sy) || 1;
    var sux = sx / sl;
    var suy = sy / sl;
    var scarLip = pointOn(scar, sux, suy, true);
    if (!scarLip || SF.walkable(scarLip.x + sux * dash, scarLip.y + suy * dash)) issues.push("base dash crosses Shardstep");
    if (!scarLip || SF.walkable(scarLip.x + sux * dash * 1.2, scarLip.y + suy * dash * 1.2)) issues.push("Long Step crosses Shardstep");
    if (!scarLip || !SF.walkable(scarLip.x + sux * plus, scarLip.y + suy * plus)) issues.push("Shardstep misses the ledge");
    var screenL = 66 * T;
    var screenT = 4 * T;
    var screenR = screenL + 40 * T;
    var screenB = screenT + 22 * T;
    var maren = SF.NPCS[0];
    if (maren.x < screenL || maren.x > screenR || maren.y < screenT || maren.y > screenB) issues.push("Maren is outside the lamp screen");
    if (SF.LAMP.x < screenL || SF.LAMP.x > screenR || SF.LAMP.y < screenT || SF.LAMP.y > screenB) issues.push("the lamp is outside Maren's screen");
    SF.samplePath("to lamp", [SF.WAKE, P(66, 56), P(84, 48), P(76, 34), P(73, 20), maren, P(73, 20), P(76, 34), P(84, 48), P(96, 34), P(100, 22), P(101, 13), SF.LAMP], issues);
    SF.samplePath("to kestrel", [P(84, 48), P(87, 66), P(87, 86), P(87, 94), SF.NPCS[1]], issues);
    SF.samplePath("to hollow", [P(84, 48), P(64, 44), P(50, 40), P(40, 43), P(12, 43), SF.NPCS[2]], issues);
    SF.mountIsland(prev || "emberhold");
    SF.state = saved;
    return issues;

    function pointOn(sh, ux2, uy2, outward) {
      var step;
      var x = sh.x;
      var y = sh.y;
      for (step = 0; step < 400; step++) {
        x = sh.x + ux2 * step;
        y = sh.y + uy2 * step;
        if (!inside(sh, x, y, SF.WALK_MARGIN)) {
          return { x: sh.x + ux2 * (step - 1), y: sh.y + uy2 * (step - 1) };
        }
      }
      return outward ? { x: x, y: y } : null;
    }
  };

  SF.auditCinder = function () {
    var issues = [];
    var prev = SF.islandId;
    var saved = SF.state;
    SF.mountIsland("cinderveil");
    SF.state = { flags: { mawDead: true, vaultOpen: true, cinderLit: true } };
    function check(label, x, y) {
      if (!SF.walkable(x, y)) issues.push(label + " not walkable (" + Math.round(x) + "," + Math.round(y) + ")");
    }
    check("dock", SF.DOCKS.cinderveil.x, SF.DOCKS.cinderveil.y);
    check("lamp", SF.LAMP.x, SF.LAMP.y);
    SF.NPCS.forEach(function (n) { check(n.id, n.x, n.y); });
    SF.TEXTS.forEach(function (t) { check(t.id, t.x, t.y); });
    SF.PICKUPS.forEach(function (p) { check(p.id, p.x, p.y); });
    (SF.EXTRAS || []).forEach(function (ex) { check(ex.id, ex.x, ex.y); });
    (SF.HOOKS || []).forEach(function (h) { check(h.id, h.x, h.y); });
    SF.samplePath("quay to ilsa", [P(58, 104), P(58, 86), P(48, 80), P(46, 60), P(46, 52), P(74, 56), P(92, 56)], issues);
    SF.samplePath("quay to ash", [P(48, 86), P(48, 80), P(46, 60), P(46, 44)], issues);
    var plus = SF.DASH_SPEED_PLUS * SF.DASH_TIME;
    function gap(a, b, label) {
      var d = SF.dist(a.x, a.y, b.x, b.y);
      var mx = (a.x + b.x) / 2;
      var my = (a.y + b.y) / 2;
      if (d > SF.GRAPPLE_RANGE) issues.push(label + " is out of grapple range " + d.toFixed(0));
      if (d < plus) issues.push(label + " is short enough to shardstep " + d.toFixed(0));
      if (SF.walkable(mx, my)) issues.push(label + " midpoint is walkable");
    }
    var hooks = {};
    SF.HOOKS.forEach(function (h) { hooks[h.id] = h; });
    gap(hooks["hook1-cliff"], hooks["hook1-ledge"], "hook 1");
    gap(hooks["hook2-ledge"], hooks["hook2-vault"], "hook 2");
    gap(hooks["hook-spare-ash"], hooks["hook-spare-ledge"], "spare hook");
    SF.state = { flags: {} };
    if (SF.walkable(SF.LAMP.x, SF.LAMP.y)) issues.push("the ridge is open before the Maw");
    if (SF.walkable(41 * T, 24 * T)) issues.push("the path down is open before the Maw");
    SF.state = { flags: { mawDead: true } };
    if (!SF.walkable(SF.LAMP.x, SF.LAMP.y)) issues.push("the ridge stayed shut after the Maw");
    if (!SF.walkable(41 * T, 24 * T)) issues.push("the path down stayed shut after the Maw");
    SF.mountIsland(prev || "emberhold");
    SF.state = saved;
    return issues;
  };

  SF.mountIsland("emberhold");

  var debugOn = true;
  try {
    debugOn = typeof location === "undefined" || !location || /(?:^|[?&])debug=1(?:&|$)/.test(location.search || "");
  } catch (err) {
    debugOn = true;
  }
  if (!debugOn) return;

  SF.debug = {
    goTile: function (tx, ty) {
      var s = SF.state;
      if (!s) return null;
      var x = tx * T;
      var y = ty * T;
      var found = SF.walkable(x, y);
      var r, a, nx, ny;
      if (!found) {
        for (r = 1; r <= 6 && !found; r++) {
          for (a = 0; a < 8; a++) {
            nx = x + Math.cos(a) * r * T;
            ny = y + Math.sin(a) * r * T;
            if (SF.walkable(nx, ny)) {
              x = nx;
              y = ny;
              found = true;
              break;
            }
          }
        }
      }
      s.player.x = x;
      s.player.y = y;
      s.player.safeX = x;
      s.player.safeY = y;
      s.player.px = x;
      s.player.py = y;
      s.player.fall = 0;
      s.camX = x;
      s.camY = y;
      s.encounterGrace = Math.max(s.encounterGrace || 0, 10);
      s.zoneId = null;
      return { x: x, y: y, zone: SF.zoneAt(x, y).id };
    },
    flag: function (name, value) {
      var s = SF.state;
      if (!s) return;
      s.flags[name] = value !== false;
    },
    shards: function (n) {
      if (SF.state) SF.state.shardsHeld = n;
    },
    sense: function () {
      if (SF.state) SF.state.flags.shard_sense = true;
    },
    fight: function (id, opts) {
      return SF.Battle && SF.Battle.start(id, opts || {});
    },
    win: function () {
      return SF.Battle && SF.Battle.autoResolve(80);
    },
    talk: function (id) {
      if (SF.startDialogue) SF.startDialogue(id);
    },
    skipTalk: function () {
      var s = SF.state;
      var guard = 0;
      while (s && s.mode === "dialogue" && guard < 40) {
        if (s.dialogue) s.dialogue.lock = 0;
        if (s.dialogue && s.dialogue.phase === "choice" && s.dialogue.choices && s.dialogue.choices.length) SF.chooseDialogue(0);
        else if (SF.advanceDialogue) SF.advanceDialogue();
        guard += 1;
      }
      return s && s.mode;
    },
    steps: function (n) {
      var s = SF.state;
      if (!s) return 0;
      var zone = SF.zoneAt(s.player.x, s.player.y);
      var i;
      var fights = 0;
      for (i = 0; i < n; i++) {
        if (s.mode !== "play") break;
        var before = s.mode;
        SF.noteTravel(s, s.player.x, s.player.y, s.player.x + T, s.player.y, zone);
        if (s.mode !== before) fights += 1;
      }
      return fights;
    },
    cam: function (tx, ty) {
      SF.debugCam = { x: tx * T, y: ty * T };
      if (SF.state) {
        SF.state.camX = tx * T;
        SF.state.camY = ty * T;
      }
    },
    overview: function (on) {
      SF.debugOverview = !!on;
      if (SF.resize) SF.resize();
    }
  };
})();
