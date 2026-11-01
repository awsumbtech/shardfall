"use strict";

// Rewards pays a won fight: XP, marks, drops, stolen names, and the one-time
// carrier shard. It uses the battle RNG in the same order as v0.4.27.
// Loss and flee pay nothing. The caller writes party HP back first.
var SF = window.SF || {};
window.SF = SF;

SF.BattleRewards = {
  grant: function (s, b) {
    var xpOpts = {};
    if (b.zoneLevel != null) {
      xpOpts.zoneLevel = b.zoneLevel;
      xpOpts.fixed = !!b.fixed || !!b.boss;
      xpOpts.base = b.xp || 0;
    }
    var levels = SF.grantPartyXp(s, b.xp || 0, xpOpts);
    s.gold = (s.gold || 0) + (b.gold || 0);
    var found = [];
    (b.drops || []).forEach(function (drop) {
      var roll = b.rng();
      if (roll <= drop.chance) {
        SF.giveItem(drop.id, 1);
        found.push(SF.ITEMS[drop.id].name);
      }
    });
    (b.stolen || []).forEach(function (name) {
      if (found.indexOf(name) < 0) found.push(name);
    });
    if (b.carrier && b.carrierRegion && s.flags && s.flags.shard_sense) {
      s.flags.carriers = s.flags.carriers || {};
      if (!s.flags.carriers[b.carrierRegion]) {
        s.flags.carriers[b.carrierRegion] = true;
        s.shardsHeld = (s.shardsHeld || 0) + 1;
        if (!s.stats) s.stats = { foes: 0, shardsEver: 0 };
        s.stats.shardsEver = (s.stats.shardsEver || 0) + 1;
        found.push("Sky-shard");
      }
    }
    if (b.carrierRegion === "cinderstep" && s.flags) s.flags.choirlingDown = true;
    SF.syncFieldVitals(s);
    if (levels.length && SF.emit) SF.emit("level");
    return {
      win: true,
      fled: false,
      xp: b.xp || 0,
      gold: b.gold || 0,
      items: found,
      levels: levels
    };
  }
};
