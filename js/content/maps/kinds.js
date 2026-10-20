"use strict";

var SF = window.SF || {};
window.SF = SF;

// Field bodies for the v0.3 encounters. Battle stats live with BATTLE;
// these numbers only keep the overworld token moving until a fight starts.
SF.KINDS.saltwisp = { hp: 22, dmg: 6, speed: 68, aggro: 116, xp: 12, r: 13, drops: false, leash: 140 };
SF.KINDS.drowned = { hp: 46, dmg: 8, speed: 40, aggro: 124, xp: 20, r: 16, drops: false, leash: 150 };
SF.KINDS.stormgull = { hp: 26, dmg: 6, speed: 92, aggro: 150, xp: 14, r: 12, drops: false, leash: 170, ranged: true };
SF.KINDS.tidewyrm = { hp: 180, dmg: 14, speed: 34, aggro: 200, xp: 80, r: 34, drops: false, leash: 180, big: true, boss: true };
SF.KINDS.choir_soldier = { hp: 40, dmg: 8, speed: 48, aggro: 140, xp: 22, r: 14, drops: false, leash: 160 };
SF.KINDS.sentinel = { hp: 96, dmg: 12, speed: 30, aggro: 130, xp: 36, r: 20, drops: false, leash: 140, big: true };
SF.KINDS.hush_raider = { hp: 36, dmg: 8, speed: 64, aggro: 140, xp: 18, r: 14, drops: false, leash: 150 };

// sprite: Art.sprite id. body/core: fallback colors when Art is absent.
SF.FOE_LOOK = {
  wisp: { sprite: "wisp" },
  brumekin: { sprite: "brumekin" },
  choirling: { sprite: "choirling" },
  ashmite: { sprite: "ashling" },
  sootwing: { sprite: "ashling" },
  cinderbrute: { sprite: "cinderhound" },
  maw: { sprite: "cinder_maw", big: true },
  saltwisp: { sprite: "saltwisp", body: "#7ec8c4", core: "#f4ffff" },
  drowned: { sprite: "drowned", body: "#3e5c68", core: "#9ad0d8" },
  stormgull: { sprite: "stormgull", body: "#d8d2c4", core: "#f0c24b" },
  tidewyrm: { sprite: "tidewyrm", body: "#1e6e78", core: "#b8fff0", big: true },
  choir_soldier: { sprite: "choir_soldier", body: "#3a2458", core: "#e7c6ff" },
  sentinel: { sprite: "sentinel", body: "#6a5438", core: "#ffd37a", big: true },
  hush_raider: { sprite: "hush_raider", body: "#5a3048", core: "#ffb15a" }
};
