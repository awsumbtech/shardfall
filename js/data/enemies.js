"use strict";

var SF = window.SF || {};
window.SF = SF;

// Battle foes. Field kinds still live on SF.KINDS for size and shard drops.
SF.FOES = {
  wisp: { id: "wisp", name: "Wisp", sprite: "wisp", hp: 24, atk: 9, def: 2, mag: 5, spd: 13, weak: "shard", resist: "gale", steal: "tonic", skills: [] },
  brumekin: { id: "brumekin", name: "Brumekin", sprite: "brumekin", hp: 58, atk: 13, def: 7, mag: 4, spd: 7, weak: "ember", resist: "tide", steal: "tonic", skills: ["ember_bite"] },
  choirling: { id: "choirling", name: "Choirling", sprite: "choirling", hp: 42, atk: 8, def: 4, mag: 12, spd: 11, weak: "gale", resist: "ember", steal: "ether", skills: ["gale_note"] },
  ashling: { id: "ashling", name: "Ashling", sprite: "ashling", hp: 28, atk: 11, def: 4, mag: 6, spd: 12, weak: "tide", resist: "ember", steal: "ember_salt", skills: ["ash_spit"] },
  cinderhound: { id: "cinderhound", name: "Cinderhound", sprite: "cinderhound", hp: 74, atk: 15, def: 8, mag: 6, spd: 10, weak: "tide", resist: "ember", steal: "hi_tonic", skills: ["ember_bite"] },
  cinder_maw: {
    id: "cinder_maw", name: "Cinder Maw", sprite: "cinder_maw", boss: true, core: true,
    // Lv3–4 with Kestrel and Tamsin is the fair fight. Solo Lv2 wins with Shard Bolt
    // and tonics. Six Lv6 Shard Bolts leave the core standing.
    hp: 620, atk: 12, def: 13, mag: 11, spd: 8, weak: "shard", resist: "ember", steal: "hi_tonic",
    skills: ["cinder_bite", "ash_spit", "core_pulse"],
    phases: [
      { at: 0.6, log: "The core flares.", def: 0.72, atk: 1.1 },
      { at: 0.3, log: "The core is open.", def: 0.5, atk: 1.22, skill: "ember_wave" }
    ]
  },
  saltwisp: { id: "saltwisp", name: "Saltwisp", sprite: "saltwisp", hp: 36, atk: 12, def: 3, mag: 8, spd: 13, weak: "shard", resist: "tide", steal: "tide_vial", skills: [] },
  drowned: { id: "drowned", name: "Drowned", sprite: "drowned", hp: 68, atk: 14, def: 9, mag: 5, spd: 6, weak: "ember", resist: "tide", steal: "tonic", skills: ["drown_grip"] },
  stormgull: { id: "stormgull", name: "Stormgull", sprite: "stormgull", hp: 40, atk: 13, def: 4, mag: 7, spd: 16, weak: "shard", resist: "gale", steal: "gale_powder", skills: ["peck"] },
  tidewyrm: {
    id: "tidewyrm", name: "Tidewyrm", sprite: "tidewyrm", boss: true,
    hp: 480, atk: 20, def: 12, mag: 16, spd: 9, weak: "ember", resist: "tide", steal: "hi_tonic",
    skills: ["tide_lash", "drown_grip"],
    phases: [{ at: 0.5, log: "The wyrm thrashes.", def: 0.7, atk: 1.2, skill: "thrash" }]
  },
  choir_soldier: { id: "choir_soldier", name: "Choir Soldier", sprite: "choir_soldier", hp: 66, atk: 16, def: 8, mag: 8, spd: 10, weak: "gale", resist: "shard", steal: "ether", skills: ["choir_cut"] },
  sentinel: { id: "sentinel", name: "Sentinel", sprite: "sentinel", hp: 108, atk: 18, def: 14, mag: 8, spd: 6, weak: "shard", resist: "gale", steal: "hi_tonic", skills: ["sentinel_slam"] },
  hush_raider: { id: "hush_raider", name: "Hush Raider", sprite: "hush_raider", hp: 56, atk: 15, def: 6, mag: 6, spd: 14, weak: "gale", resist: "", steal: "smoke_bomb", skills: ["raider_shot"] }
};

// Field enemy id cinder_bite is not a skill on the maw list until I add it.
SF.SKILLS.cinder_bite = SF.SKILLS.cinder_bite || { id: "cinder_bite", name: "Cinder Bite", target: "foe", element: "ember", power: 12, sp: 0, desc: "Ember damage to one foe." };
