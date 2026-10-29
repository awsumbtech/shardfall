"use strict";

var SF = window.SF || {};
window.SF = SF;

SF.storage = function () {
  try {
    var ls = window.localStorage;
    var k = "__sf_probe__";
    ls.setItem(k, "1");
    ls.removeItem(k);
    return ls;
  } catch (err) {
    return null;
  }
};

SF.exportState = function (s) {
  if (SF.snapshotEnemies) SF.snapshotEnemies();
  return {
    v: 4,
    game: SF.VERSION,
    savedAt: Date.now(),
    playTime: s.playTime,
    quest: s.quest,
    island: s.island || SF.islandId || "emberhold",
    shardsHeld: s.shardsHeld,
    cogs: s.cogs || 0,
    upgrades: s.upgrades || {},
    checkpoint: s.checkpoint || null,
    checkpoints: s.checkpoints || {},
    enemySave: s.enemySave || {},
    picked: s.picked,
    drops: s.drops,
    voyageCount: s.voyageCount || 0,
    lastRest: s.lastRest || null,
    flags: s.flags,
    discovered: s.discovered,
    stats: s.stats,
    hints: s.hints,
    player: {
      x: s.player.x,
      y: s.player.y,
      fx: s.player.fx,
      fy: s.player.fy,
      hp: s.player.hp,
      maxHp: s.player.maxHp,
      xp: s.player.xp,
      level: s.player.level,
      atk: s.player.atk,
      shardstep: !!s.player.shardstep,
      grapple: !!s.player.grapple
    },
    enemies: s.enemies.map(function (e) {
      return { id: e.id, alive: e.alive && e.dying <= 0, hp: e.hp, dormant: !!e.dormant };
    }),
    party: s.party || null,
    inventory: s.inventory || {},
    gold: s.gold || 0,
    known: s.known || {}
  };
};

SF.readSave = function () {
  var ls = SF.storage();
  if (!ls) return null;
  var raw = ls.getItem(SF.SAVE_KEY);
  if (!raw) return null;
  try {
    var data = JSON.parse(raw);
    if (!data || (data.v !== 1 && data.v !== 2 && data.v !== 3 && data.v !== 4)) return null;
    return data;
  } catch (err) {
    return null;
  }
};

SF.hasSave = function () {
  return !!SF.readSave();
};

SF.migrateSpot = function (s) {
  var f = s.flags || {};
  var q = s.quest || "awaken";
  var onCinder = s.island === "cinderveil" || q === "quay" || q === "cogs" || q === "vault" || q === "trial" || q === "seal" || q === "maw" || q === "relight" || q === "cantor" || q === "act1" || f.mawDead || f.cinderLit || f.metTamsin;
  var island = onCinder ? "cinderveil" : (s.island && SF.ISLANDS[s.island] ? s.island : "emberhold");
  if (island !== "emberhold" && island !== "cinderveil") {
    if (SF.mountIsland) SF.mountIsland(island);
    var dock = SF.DOCKS && SF.DOCKS[island];
    if (dock) {
      s.player.x = dock.x;
      s.player.y = dock.y;
    }
    return;
  }
  if (SF.mountIsland) SF.mountIsland(island);
  s.island = island;
  var spot = null;
  if (island === "cinderveil") {
    if (f.needsEpilogue || f.epilogueHeard || q === "act1") spot = SF.DOCKS.cinderveil;
    else if (f.mawDead || q === "relight" || q === "cantor" || f.cinderLit) spot = (SF.ISLANDS.cinderveil.spots || {}).lamp || SF.LAMP;
    else if (q === "vault" || q === "trial" || q === "seal" || q === "maw" || f.vaultOpen) spot = (SF.ISLANDS.cinderveil.spots || {}).vledge;
    else spot = SF.DOCKS.cinderveil;
  } else if (f.lampLit || q === "stirring" || q === "hooked" || q === "sail" || q === "road") {
    spot = SF.DOCKS.emberhold;
  } else if (f.metMaren || (q && q !== "awaken")) {
    var maren = null;
    (SF.NPCS || []).forEach(function (n) { if (n.id === "maren") maren = n; });
    spot = maren || SF.WAKE;
  } else spot = SF.WAKE;
  if (!spot) spot = SF.WAKE;
  s.player.x = spot.x;
  s.player.y = spot.y;
  if (f.metMaren || (q && q !== "awaken") || f.lampLit || (s.shardsHeld || 0) > 0) f.shard_sense = true;
};

SF.applySave = function (s, data) {
  if (!data || (data.v !== 1 && data.v !== 2 && data.v !== 3 && data.v !== 4) || !data.player) return false;
  var p = s.player;
  var sp = data.player;
  s.playTime = data.playTime || 0;
  s.quest = data.quest || "awaken";
  s.shardsHeld = data.shardsHeld || 0;
  s.cogs = data.cogs || 0;
  s.upgrades = data.upgrades || {};
  s.checkpoint = data.checkpoint || null;
  s.checkpoints = data.checkpoints || {};
  if (s.checkpoint && s.checkpoint.island && !s.checkpoints[s.checkpoint.island]) {
    s.checkpoints[s.checkpoint.island] = s.checkpoint;
  }
  s.enemySave = data.enemySave || {};
  s.picked = data.picked || {};
  s.drops = data.drops || {};
  s.gold = data.gold == null ? 0 : data.gold;
  s.inventory = data.inventory || {};
  s.voyageCount = data.voyageCount || 0;
  s.lastRest = data.lastRest || s.lastRest || null;
  s.flags = Object.assign(s.flags, data.flags || {});
  s.discovered = Object.assign(s.discovered, data.discovered || {});
  if (s.flags.metCantor && (s.flags.heardChoir || s.discovered.hollow)) s.flags.met_cantor = true;
  if (s.flags.met_cantor) s.flags.metCantor = true;
  if (s.flags.hesk_mood) s.flags.metHesk = true;
  if (s.flags.act1) s.flags.cantorGone = true;
  s.stats = Object.assign(s.stats, data.stats || {});
  s.hints = Object.assign(s.hints, data.hints || {});
  if (data.hints && data.hints.moved == null && s.playTime > 2) s.hints.moved = true;
  if (data.hints && data.hints.dash == null && s.playTime > 25) s.hints.dash = true;
  if (data.v === 1 && (s.flags.lampLit || s.quest === "hooked")) s.flags.sailUnlocked = true;
  p.grapple = !!sp.grapple || !!s.flags.grapple;
  s.flags.grapple = p.grapple || !!s.flags.grapple;
  s.island = data.island || "emberhold";
  if (!data.island && (s.flags.mawDead || s.flags.cinderLit || s.quest === "cantor" || s.quest === "relight" || s.quest === "maw" || s.quest === "act1" || s.quest === "quay" || s.quest === "cogs" || s.quest === "vault" || s.quest === "trial" || s.quest === "seal")) {
    s.island = "cinderveil";
  }
  if (SF.mountIsland) SF.mountIsland(s.island);
  if (SF.makeEnemies) s.enemies = SF.makeEnemies();
  if (data.v < 4) {
    p.x = sp.x;
    p.y = sp.y;
    SF.migrateSpot(s);
    p.x = s.player.x;
    p.y = s.player.y;
  } else {
    p.x = sp.x;
    p.y = sp.y;
  }
  p.fx = sp.fx || 1;
  p.fy = sp.fy || 0;
  p.hp = sp.hp;
  p.maxHp = sp.maxHp;
  p.xp = sp.xp || 0;
  p.level = sp.level || 1;
  p.atk = sp.atk || 12;
  p.shardstep = !!sp.shardstep || !!s.flags.shardstep;
  s.encounterGrace = 10;
  s.stepAcc = 0;
  s.zoneId = null;
  if (!SF.walkable(p.x, p.y)) {
    if (SF.worldSource === "tiles" && SF.snapToWalkable) {
      var snapped = SF.snapToWalkable(p.x, p.y);
      p.x = snapped.x;
      p.y = snapped.y;
    } else {
      var dock = SF.DOCKS && SF.DOCKS[s.island];
      p.x = dock ? dock.x : SF.WAKE.x;
      p.y = dock ? dock.y : SF.WAKE.y;
    }
  }
  p.safeX = p.x;
  p.safeY = p.y;
  p.px = p.x;
  p.py = p.y;
  var byId = {};
  var rows = data.enemies || (s.enemySave && s.enemySave[s.island]) || [];
  rows.forEach(function (e) { byId[e.id] = e; });
  s.enemies.forEach(function (e) {
    var saved = byId[e.id];
    if (!saved) return;
    e.alive = !!saved.alive;
    e.hp = saved.alive ? saved.hp : 0;
    e.dying = 0;
    e.x = e.homeX;
    e.y = e.homeY;
    if (saved.dormant != null && e.kind === "maw" && !s.flags.mawFight) e.dormant = !!saved.dormant;
  });
  if (s.flags.mawDead) {
    s.enemies.forEach(function (e) {
      if (e.kind === "maw") {
        e.alive = false;
        e.hp = 0;
      }
    });
  }
  if (SF.migrateBattleSave) SF.migrateBattleSave(s, data);
  if (SF.cuePlaceMusic) SF.cuePlaceMusic(s);
  return true;
};

SF.saveGame = function (opts) {
  var s = SF.state;
  if (!s || s.mode === "title") return false;
  var ls = SF.storage();
  if (!ls) {
    if (!SF._storageWarned) {
      SF._storageWarned = true;
      SF.pushToast("This browser will not keep a save.");
    }
    return false;
  }
  try {
    ls.setItem(SF.SAVE_KEY, JSON.stringify(SF.exportState(s)));
    if (!opts || !opts.silent) {
      SF.pushToast("Saved.");
      s.savedFlash = 1.2;
    }
    return true;
  } catch (err) {
    SF.pushToast("Could not save.");
    return false;
  }
};

SF.wipeSave = function () {
  var ls = SF.storage();
  if (!ls) return;
  try {
    ls.removeItem(SF.SAVE_KEY);
  } catch (err) {
    /* ignore */
  }
};
