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
  return {
    v: 1,
    game: SF.VERSION,
    savedAt: Date.now(),
    playTime: s.playTime,
    quest: s.quest,
    shardsHeld: s.shardsHeld,
    picked: s.picked,
    drops: s.drops,
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
      shardstep: !!s.player.shardstep
    },
    enemies: s.enemies.map(function (e) {
      return { id: e.id, alive: e.alive && e.dying <= 0, hp: e.hp };
    })
  };
};

SF.readSave = function () {
  var ls = SF.storage();
  if (!ls) return null;
  var raw = ls.getItem(SF.SAVE_KEY);
  if (!raw) return null;
  try {
    var data = JSON.parse(raw);
    if (!data || data.v !== 1) return null;
    return data;
  } catch (err) {
    return null;
  }
};

SF.hasSave = function () {
  return !!SF.readSave();
};

SF.applySave = function (s, data) {
  if (!data || data.v !== 1 || !data.player) return false;
  var p = s.player;
  var sp = data.player;
  s.playTime = data.playTime || 0;
  s.quest = data.quest || "awaken";
  s.shardsHeld = data.shardsHeld || 0;
  s.picked = data.picked || {};
  s.drops = data.drops || {};
  s.flags = Object.assign(s.flags, data.flags || {});
  s.discovered = Object.assign(s.discovered, data.discovered || {});
  s.stats = Object.assign(s.stats, data.stats || {});
  s.hints = Object.assign(s.hints, data.hints || {});
  p.x = sp.x;
  p.y = sp.y;
  p.fx = sp.fx || 1;
  p.fy = sp.fy || 0;
  p.hp = sp.hp;
  p.maxHp = sp.maxHp;
  p.xp = sp.xp || 0;
  p.level = sp.level || 1;
  p.atk = sp.atk || 12;
  p.shardstep = !!sp.shardstep || !!s.flags.shardstep;
  if (!SF.walkable(p.x, p.y)) {
    p.x = SF.WAKE.x;
    p.y = SF.WAKE.y;
  }
  p.safeX = p.x;
  p.safeY = p.y;
  var byId = {};
  (data.enemies || []).forEach(function (e) { byId[e.id] = e; });
  s.enemies.forEach(function (e) {
    var saved = byId[e.id];
    if (!saved) return;
    e.alive = !!saved.alive;
    e.hp = saved.alive ? saved.hp : 0;
    e.dying = 0;
    e.x = e.homeX;
    e.y = e.homeY;
  });
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
    if (!opts || !opts.silent) SF.pushToast("Saved.");
    s.savedFlash = 1.2;
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
