"use strict";

// Battle foe-sprite catalog. Adding a foe is a new row here plus a sheet
// file. This file fills SF.BattleFoeData (counted assign in js/main.js).
// The BattleFoeSprite object and sw.js both read that same name.
(function (root) {
  var KIT = "shardfall/battle/foes/";
  var DIR = "assets/battle/foes/";
  var VERSION = "v1";
  var versions = {};
  var DEFAULT_CELL = { w: 64, h: 64 };
  var DEFAULT_PIVOT = { x: 32, y: 60 };
  var DEFAULT_HOVER = 0;
  var DEFAULT_ANIMS = {
    idle: { row: 0, count: 4, fps: 6, loop: true },
    attack: { row: 1, count: 8, fps: 12, loop: false },
    hurt: { row: 2, count: 4, fps: 10, loop: false },
    death: { row: 3, count: 8, fps: 9, loop: false },
    cast: { row: 4, count: 8, fps: 10, loop: false }
  };

  // Existing battle unit kinds (and field aliases) map to a catalog id
  // through this table, not an if-chain in the object.
  var kinds = {
    wisp: "wisp",
    brumekin: "brumekin",
    choirling: "choirling",
    ashling: "ashling",
    ashmite: "ashling",
    sootwing: "sootwing",
    cinderhound: "cinderhound",
    cinderbrute: "cinderhound",
    cinder_maw: "cinder_maw",
    maw: "cinder_maw"
  };

  var specs = {
    wisp: {
      cell: { w: 64, h: 64 },
      pivot: { x: 32, y: 60 },
      hover_px: 8,
      animations: {
        idle: { row: 0, count: 4, fps: 6, loop: true },
        attack: { row: 1, count: 7, fps: 12, loop: false },
        hurt: { row: 2, count: 4, fps: 10, loop: false },
        death: { row: 3, count: 8, fps: 9, loop: false, last_frame_empty: true },
        cast: { row: 4, count: 6, fps: 8, loop: false }
      }
    },
    brumekin: {},
    sootwing: { hover_px: 8 },
    cinderhound: {
      cell: { w: 80, h: 64 },
      pivot: { x: 40, y: 60 }
    },
    choirling: {
      animations: {
        idle: { row: 0, count: 4, fps: 6, loop: true },
        attack: { row: 1, count: 8, fps: 12, loop: false },
        hurt: { row: 2, count: 4, fps: 10, loop: false },
        death: { row: 3, count: 7, fps: 9, loop: false },
        cast: { row: 4, count: 8, fps: 10, loop: false }
      }
    },
    ashling: {},
    cinder_maw: {
      cell: { w: 160, h: 128 },
      pivot: { x: 80, y: 124 },
      boss: true
    }
  };

  function copyAnim(src) {
    var out = {};
    var name, srcRow, row;
    for (name in src) {
      if (!Object.prototype.hasOwnProperty.call(src, name)) continue;
      srcRow = src[name];
      row = { row: srcRow.row, count: srcRow.count, fps: srcRow.fps, loop: !!srcRow.loop };
      if (srcRow.last_frame_empty) row.last_frame_empty = true;
      out[name] = row;
    }
    return out;
  }

  function foe(id, ready) {
    var spec = specs[id] || {};
    var ver = versions[id] || VERSION;
    var dir = DIR + id + "/" + ver + "/";
    var cell = spec.cell || DEFAULT_CELL;
    var pivot = spec.pivot || DEFAULT_PIVOT;
    var hover = spec.hover_px != null ? spec.hover_px : DEFAULT_HOVER;
    return {
      id: id,
      ready: !!ready,
      version: ver,
      kit: KIT + id + "/" + ver + "/",
      dir: dir,
      path: dir + id + ".png",
      cell: { w: cell.w, h: cell.h },
      pivot: { x: pivot.x, y: pivot.y },
      hover_px: hover,
      boss: !!spec.boss,
      animations: copyAnim(spec.animations || DEFAULT_ANIMS)
    };
  }

  var ids = [
    "wisp",
    "brumekin",
    "sootwing",
    "cinderhound",
    "choirling",
    "ashling",
    "cinder_maw"
  ];
  // sootwing's sheet is in assets/battle/foes/sootwing/v1/ (delivered) but is
  // not marked ready: there is no SF.FOES.sootwing row and no encounter that
  // lists a sootwing (soot-east / KIND_ENCOUNTER.sootwing start cv_mixed).
  // Wiring it needs a FOES row and an encounter, which needs Brian's decision
  // because features are frozen.
  var ready = {
    wisp: true,
    brumekin: true,
    sootwing: false,
    cinderhound: true,
    choirling: true,
    ashling: true,
    cinder_maw: true
  };
  var foes = {};
  var precache = [];
  var i, id, row;
  for (i = 0; i < ids.length; i++) {
    id = ids[i];
    row = foe(id, !!ready[id]);
    foes[id] = row;
    if (row.ready) precache.push(row.path);
  }

  var data = {
    kit: KIT,
    dir: DIR,
    version: VERSION,
    scale: 2,
    ids: ids,
    kinds: kinds,
    foes: foes,
    precache: precache
  };

  var sf = root.SF || (root.SF = {});
  var dest = sf.BattleFoeData;
  if (!dest) dest = sf.BattleFoeData = {};
  dest.kit = data.kit;
  dest.dir = data.dir;
  dest.version = data.version;
  dest.scale = data.scale;
  dest.ids = data.ids;
  dest.kinds = data.kinds;
  dest.foes = data.foes;
  dest.precache = data.precache;
  if (sf.BattleFoeSprite && typeof sf.BattleFoeSprite.adopt === "function") {
    sf.BattleFoeSprite.adopt(data);
  }
})(typeof window !== "undefined" ? window : self);
