"use strict";

var SF = window.SF || {};
window.SF = SF;

// WORLD places these ids on field spawns (spawn.encounter) or calls Battle.start(id).
SF.ENCOUNTERS = {
  em_wisps: { id: "em_wisps", name: "Wisps", bg: "emberhold_meadow", foes: ["wisp", "wisp"], xp: 22, gold: 8, drops: [{ id: "tonic", chance: 0.4 }] },
  em_brumekin: { id: "em_brumekin", name: "Brumekin", bg: "emberhold_scar", foes: ["brumekin"], xp: 32, gold: 14, drops: [{ id: "tonic", chance: 1 }] },
  em_choirling: { id: "em_choirling", name: "Choirling", bg: "emberhold_meadow", foes: ["choirling"], xp: 40, gold: 16, drops: [{ id: "ether", chance: 1 }] },
  cv_ashlings: { id: "cv_ashlings", name: "Ashlings", bg: "cinderveil_ash", foes: ["ashling", "ashling"], xp: 28, gold: 12, drops: [{ id: "ember_salt", chance: 0.5 }] },
  cv_cinderhound: { id: "cv_cinderhound", name: "Cinderhound", bg: "cinderveil_ash", foes: ["cinderhound"], xp: 42, gold: 18, drops: [{ id: "hi_tonic", chance: 1 }] },
  cv_mixed: { id: "cv_mixed", name: "Ash and Hound", bg: "cinderveil_ash", foes: ["ashling", "cinderhound"], xp: 36, gold: 16, drops: [{ id: "tonic", chance: 1 }] },
  boss_cinder_maw: { id: "boss_cinder_maw", name: "Cinder Maw", bg: "ember_vault", foes: ["cinder_maw"], xp: 90, gold: 80, boss: true, canFlee: false, drops: [{ id: "phoenix_shard", chance: 1 }, { id: "hi_tonic", chance: 1 }] },
  sm_saltwisps: { id: "sm_saltwisps", name: "Saltwisps", bg: "saltmere_shore", foes: ["saltwisp", "saltwisp"], xp: 48, gold: 20, drops: [{ id: "tide_vial", chance: 0.5 }] },
  sm_drowned: { id: "sm_drowned", name: "Drowned", bg: "saltmere_wreck", foes: ["drowned", "drowned"], xp: 56, gold: 24, drops: [{ id: "tonic", chance: 1 }] },
  sm_gulls: { id: "sm_gulls", name: "Stormgulls", bg: "saltmere_shore", foes: ["stormgull", "stormgull"], xp: 52, gold: 22, drops: [{ id: "gale_powder", chance: 0.5 }] },
  sm_mixed: { id: "sm_mixed", name: "Shore Mix", bg: "saltmere_shore", foes: ["saltwisp", "drowned", "stormgull"], xp: 70, gold: 30, drops: [{ id: "hi_tonic", chance: 0.5 }] },
  boss_tidewyrm: { id: "boss_tidewyrm", name: "Tidewyrm", bg: "saltmere_shore", foes: ["tidewyrm"], xp: 120, gold: 100, boss: true, canFlee: false, drops: [{ id: "phoenix_shard", chance: 1 }] },
  hs_choir_patrol: { id: "hs_choir_patrol", name: "Choir Patrol", bg: "highspire_road", foes: ["choir_soldier", "choir_soldier"], xp: 64, gold: 26, drops: [{ id: "ether", chance: 0.5 }] },
  hs_sentinel: { id: "hs_sentinel", name: "Sentinel", bg: "highspire_road", foes: ["sentinel"], xp: 72, gold: 32, drops: [{ id: "hi_tonic", chance: 1 }] },
  sea_hush_raiders: { id: "sea_hush_raiders", name: "Hush Raiders", bg: "hush_deck", foes: ["hush_raider", "hush_raider"], xp: 60, gold: 28, drops: [{ id: "smoke_bomb", chance: 0.5 }] }
};

SF.SPAWN_ENCOUNTER = {
  "wisp-meadow": "em_wisps",
  "wisp-grove": "em_wisps",
  "wisp-dock": "em_wisps",
  "brume-scar": "em_brumekin",
  "brume-span": "em_brumekin",
  "choir-cinder": "em_choirling",
  "ashmite-west": "cv_ashlings",
  "ashmite-north": "cv_ashlings",
  "soot-east": "cv_mixed",
  "brute-cog": "cv_cinderhound",
  "brute-yard": "cv_cinderhound",
  maw: "boss_cinder_maw"
};

SF.KIND_ENCOUNTER = {
  wisp: "em_wisps",
  brumekin: "em_brumekin",
  choirling: "em_choirling",
  ashmite: "cv_ashlings",
  ashling: "cv_ashlings",
  sootwing: "cv_mixed",
  cinderbrute: "cv_cinderhound",
  cinderhound: "cv_cinderhound",
  maw: "boss_cinder_maw",
  cinder_maw: "boss_cinder_maw",
  saltwisp: "sm_saltwisps",
  drowned: "sm_drowned",
  stormgull: "sm_gulls",
  tidewyrm: "boss_tidewyrm",
  choir_soldier: "hs_choir_patrol",
  sentinel: "hs_sentinel",
  hush_raider: "sea_hush_raiders"
};

SF.encounterForSpawn = function (sp) {
  if (!sp) return null;
  if (sp.encounter && SF.ENCOUNTERS[sp.encounter]) return sp.encounter;
  if (sp.id && SF.SPAWN_ENCOUNTER[sp.id]) return SF.SPAWN_ENCOUNTER[sp.id];
  if (sp.kind && SF.KIND_ENCOUNTER[sp.kind]) return SF.KIND_ENCOUNTER[sp.kind];
  return null;
};
