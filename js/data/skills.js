"use strict";

var SF = window.SF || {};
window.SF = SF;

// Elements: ember, tide, gale, shard. target: foe, ally, self, all-foes, all-allies.
SF.SKILLS = {
  attack: { id: "attack", name: "Attack", target: "foe", power: 10, sp: 0, desc: "A basic attack." },
  shard_bolt: { id: "shard_bolt", name: "Shard Bolt", target: "foe", mag: true, element: "shard", power: 16, sp: 4, desc: "Shard damage to one foe." },
  scan: { id: "scan", name: "Scan", target: "foe", sp: 1, scan: true, desc: "Shows every foe's weakness." },
  mend: { id: "mend", name: "Mend", target: "ally", sp: 5, heal: 30, desc: "Restores HP to one ally." },
  lampflare: { id: "lampflare", name: "Lampflare", target: "all-foes", mag: true, element: "shard", power: 12, sp: 8, desc: "Shard damage to all foes." },
  shard_ward: { id: "shard_ward", name: "Shard Ward", target: "ally", sp: 4, defUp: 3, desc: "Raises one ally's Defense for 3 turns." },
  skybreak: { id: "skybreak", name: "Skybreak", target: "foe", mag: true, element: "shard", power: 28, sp: 10, desc: "Heavy Shard damage to one foe." },
  quickshot: { id: "quickshot", name: "Quickshot", target: "foe", power: 14, sp: 3, desc: "A fast pistol shot at one foe." },
  steal: { id: "steal", name: "Steal", target: "foe", sp: 2, steal: true, desc: "Steals an item from one foe." },
  twin_cut: { id: "twin_cut", name: "Twin Cut", target: "foe", power: 10, hits: 2, sp: 6, desc: "Two knife hits on one foe." },
  gale_shot: { id: "gale_shot", name: "Gale Shot", target: "foe", element: "gale", power: 16, sp: 5, desc: "Gale damage to one foe." },
  smoke_step: { id: "smoke_step", name: "Smoke Step", target: "self", sp: 4, spdUp: 3, desc: "Raises own Speed for 3 turns." },
  killing_shot: { id: "killing_shot", name: "Killing Shot", target: "foe", power: 26, sp: 8, desc: "Heavy damage to one foe." },
  spark_coil: { id: "spark_coil", name: "Spark Coil", target: "foe", mag: true, element: "ember", power: 15, sp: 4, desc: "Ember damage to one foe." },
  patch_up: { id: "patch_up", name: "Patch Up", target: "ally", sp: 4, heal: 34, desc: "Restores HP to one ally." },
  overclock: { id: "overclock", name: "Overclock", target: "ally", sp: 5, spdUp: 3, desc: "Raises one ally's Speed for 3 turns." },
  tonic_spray: { id: "tonic_spray", name: "Tonic Spray", target: "all-allies", sp: 8, heal: 22, desc: "Restores HP to the party." },
  tide_filter: { id: "tide_filter", name: "Tide Filter", target: "foe", mag: true, element: "tide", power: 18, sp: 6, desc: "Tide damage to one foe." },
  field_kit: { id: "field_kit", name: "Field Kit", target: "ally", sp: 8, heal: 48, defUp: 3, desc: "Restores a lot of HP and raises Defense." },
  gale_note: { id: "gale_note", name: "Gale Note", target: "foe", mag: true, element: "gale", power: 12, sp: 0, desc: "Gale damage to one foe." },
  ember_bite: { id: "ember_bite", name: "Ember Bite", target: "foe", element: "ember", power: 12, sp: 0, desc: "Ember damage to one foe." },
  ash_spit: { id: "ash_spit", name: "Ash Spit", target: "foe", mag: true, element: "ember", power: 11, sp: 0, desc: "Ember damage to one foe." },
  core_pulse: { id: "core_pulse", name: "Core Pulse", target: "foe", mag: true, element: "ember", power: 14, sp: 0, desc: "Ember damage to one foe." },
  ember_wave: { id: "ember_wave", name: "Ember Wave", target: "all-foes", mag: true, element: "ember", power: 9, sp: 0, desc: "Ember damage to the party." },
  tide_lash: { id: "tide_lash", name: "Tide Lash", target: "foe", element: "tide", power: 13, sp: 0, desc: "Tide damage to one foe." },
  drown_grip: { id: "drown_grip", name: "Drown Grip", target: "foe", power: 12, sp: 0, desc: "Damage to one foe." },
  peck: { id: "peck", name: "Peck", target: "foe", element: "gale", power: 11, sp: 0, desc: "Gale damage to one foe." },
  choir_cut: { id: "choir_cut", name: "Choir Cut", target: "foe", power: 12, sp: 0, desc: "Damage to one foe." },
  sentinel_slam: { id: "sentinel_slam", name: "Sentinel Slam", target: "foe", power: 14, sp: 0, desc: "Heavy damage to one foe." },
  raider_shot: { id: "raider_shot", name: "Raider Shot", target: "foe", element: "gale", power: 12, sp: 0, desc: "Gale damage to one foe." },
  thrash: { id: "thrash", name: "Thrash", target: "all-foes", power: 10, sp: 0, desc: "Damage to the party." }
};

SF.skillById = function (id) {
  return SF.SKILLS[id] || null;
};
