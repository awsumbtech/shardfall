"use strict";

// Battle backdrop catalog. Adding an area is a new row here plus art
// files. This file fills SF.BattleBackdropData (counted assign in js/main.js).
// The BattleBackdrop object and sw.js both read that same name.
(function (root) {
  var LAYERS = [
    { id: "sky", parallax: 0, z: 0 },
    { id: "far", parallax: 0.15, z: 1 },
    { id: "mid", parallax: 0.4, z: 2 },
    { id: "floor", parallax: 1, z: 3 }
  ];
  var KIT = "shardfall/battle/backdrops/";
  var DIR = "assets/battle/backdrops/";
  var VERSION = "v1";
  var SIZE = { w: 480, h: 270 };
  var HORIZON = 124;

  function area(id, ready) {
    var dir = DIR + id + "/" + VERSION + "/";
    var kit = KIT + id + "/" + VERSION + "/";
    var layers = {};
    var i, spec, name;
    for (i = 0; i < LAYERS.length; i++) {
      spec = LAYERS[i];
      name = spec.id;
      layers[name] = { path: dir + name + ".png", parallax: spec.parallax, z: spec.z };
    }
    return {
      id: id,
      ready: !!ready,
      kit: kit,
      dir: dir,
      size: { w: SIZE.w, h: SIZE.h },
      horizon: HORIZON,
      layers: layers
    };
  }

  var ids = [
    "emberhold_meadow",
    "emberhold_scar",
    "cinderveil_ash",
    "ember_vault",
    "saltmere_shore",
    "saltmere_wreck",
    "highspire_road",
    "hush_deck"
  ];
  var ready = { emberhold_meadow: true, emberhold_scar: true, cinderveil_ash: true, ember_vault: true, saltmere_shore: true, saltmere_wreck: true };
  var areas = {};
  var precache = [];
  var i, id, row, j, name;
  for (i = 0; i < ids.length; i++) {
    id = ids[i];
    row = area(id, !!ready[id]);
    areas[id] = row;
    if (row.ready) {
      for (j = 0; j < LAYERS.length; j++) {
        name = LAYERS[j].id;
        precache.push(row.layers[name].path);
      }
    }
  }

  var data = {
    defaultId: "emberhold_meadow",
    kit: KIT,
    dir: DIR,
    version: VERSION,
    size: SIZE,
    horizon: HORIZON,
    layers: LAYERS,
    ids: ids,
    areas: areas,
    precache: precache
  };

  var sf = root.SF || (root.SF = {});
  var dest = sf.BattleBackdropData;
  if (!dest) dest = sf.BattleBackdropData = {};
  dest.defaultId = data.defaultId;
  dest.kit = data.kit;
  dest.dir = data.dir;
  dest.version = data.version;
  dest.size = data.size;
  dest.horizon = data.horizon;
  dest.layers = data.layers;
  dest.ids = data.ids;
  dest.areas = data.areas;
  dest.precache = data.precache;
  if (sf.BattleBackdrop && typeof sf.BattleBackdrop.adopt === "function") {
    sf.BattleBackdrop.adopt(data);
  }
})(typeof window !== "undefined" ? window : self);
