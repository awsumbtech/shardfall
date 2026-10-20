"use strict";

var SF = window.SF || {};
window.SF = SF;

// Shops buy by these ids. price is the buy cost in marks. sell is half, unless set.
// slot: weapon, armor, charm. users limits who can equip. Omit users for anyone.
function item(row) {
  row.sell = row.sell != null ? row.sell : Math.floor((row.price || 0) / 2);
  return row;
}

SF.ITEMS = {
  tonic: item({ id: "tonic", name: "Tonic", kind: "item", price: 30, hp: 40, target: "ally", desc: "Restores 40 HP." }),
  hi_tonic: item({ id: "hi_tonic", name: "Hi-Tonic", kind: "item", price: 90, hp: 120, target: "ally", desc: "Restores 120 HP." }),
  ether: item({ id: "ether", name: "Ether", kind: "item", price: 60, sp: 20, target: "ally", desc: "Restores 20 SP." }),
  phoenix_shard: item({ id: "phoenix_shard", name: "Phoenix Shard", kind: "item", price: 220, revive: 0.4, target: "ally", desc: "Revives one ally at 40% HP." }),
  smoke_bomb: item({ id: "smoke_bomb", name: "Smoke Bomb", kind: "item", price: 40, flee: true, battleOnly: true, target: "none", desc: "Leaves a fight. Does not work on a boss." }),
  ember_salt: item({ id: "ember_salt", name: "Ember Salt", kind: "item", price: 45, dmg: 26, element: "ember", battleOnly: true, target: "foe", desc: "Deals 26 Ember damage to one foe." }),
  tide_vial: item({ id: "tide_vial", name: "Tide Vial", kind: "item", price: 45, dmg: 26, element: "tide", battleOnly: true, target: "foe", desc: "Deals 26 Tide damage to one foe." }),
  gale_powder: item({ id: "gale_powder", name: "Gale Powder", kind: "item", price: 45, dmg: 26, element: "gale", battleOnly: true, target: "foe", desc: "Deals 26 Gale damage to one foe." }),
  shard_dust: item({ id: "shard_dust", name: "Shard Dust", kind: "item", price: 70, dmg: 34, element: "shard", battleOnly: true, target: "foe", desc: "Deals 34 Shard damage to one foe." }),

  shard_focus: item({ id: "shard_focus", name: "Shard Focus", kind: "equip", slot: "weapon", users: ["wayfarer"], atk: 2, mag: 4, element: "shard", price: 80, desc: "Attack +2, Magic +4. Attacks deal Shard." }),
  knife: item({ id: "knife", name: "Knife", kind: "equip", slot: "weapon", users: ["kestrel"], atk: 5, price: 60, desc: "Attack +5." }),
  coil_tool: item({ id: "coil_tool", name: "Coil Tool", kind: "equip", slot: "weapon", users: ["tamsin"], atk: 1, mag: 5, element: "ember", price: 70, desc: "Attack +1, Magic +5. Attacks deal Ember." }),
  ember_knife: item({ id: "ember_knife", name: "Ember Knife", kind: "equip", slot: "weapon", atk: 6, element: "ember", price: 110, desc: "Attack +6. Attacks deal Ember." }),
  tide_edge: item({ id: "tide_edge", name: "Tide Edge", kind: "equip", slot: "weapon", atk: 5, mag: 2, element: "tide", price: 120, desc: "Attack +5, Magic +2. Attacks deal Tide." }),
  gale_pistol: item({ id: "gale_pistol", name: "Gale Pistol", kind: "equip", slot: "weapon", users: ["kestrel"], atk: 8, spd: 1, element: "gale", price: 150, desc: "Attack +8, Speed +1. Attacks deal Gale." }),
  shard_rod: item({ id: "shard_rod", name: "Shard Rod", kind: "equip", slot: "weapon", users: ["wayfarer"], mag: 9, element: "shard", price: 160, desc: "Magic +9. Attacks deal Shard." }),
  spark_wrench: item({ id: "spark_wrench", name: "Spark Wrench", kind: "equip", slot: "weapon", users: ["tamsin"], atk: 3, mag: 7, element: "ember", price: 140, desc: "Attack +3, Magic +7. Attacks deal Ember." }),
  choir_blade: item({ id: "choir_blade", name: "Choir Blade", kind: "equip", slot: "weapon", atk: 10, price: 180, desc: "Attack +10." }),

  cloth_wrap: item({ id: "cloth_wrap", name: "Cloth Wrap", kind: "equip", slot: "armor", def: 3, price: 50, desc: "Defense +3." }),
  ash_coat: item({ id: "ash_coat", name: "Ash Coat", kind: "equip", slot: "armor", def: 6, hp: 8, price: 120, desc: "Defense +6, HP +8." }),
  quay_coat: item({ id: "quay_coat", name: "Quay Coat", kind: "equip", slot: "armor", def: 5, spd: 1, price: 110, desc: "Defense +5, Speed +1." }),
  vault_plate: item({ id: "vault_plate", name: "Vault Plate", kind: "equip", slot: "armor", def: 10, hp: 12, price: 200, desc: "Defense +10, HP +12." }),
  salt_cloak: item({ id: "salt_cloak", name: "Salt Cloak", kind: "equip", slot: "armor", def: 7, mag: 2, price: 150, desc: "Defense +7, Magic +2." }),

  speed_charm: item({ id: "speed_charm", name: "Speed Charm", kind: "equip", slot: "charm", spd: 3, price: 100, desc: "Speed +3." }),
  heart_charm: item({ id: "heart_charm", name: "Heart Charm", kind: "equip", slot: "charm", hp: 20, price: 110, desc: "HP +20." }),
  mage_charm: item({ id: "mage_charm", name: "Mage Charm", kind: "equip", slot: "charm", mag: 4, price: 120, desc: "Magic +4." }),
  thief_charm: item({ id: "thief_charm", name: "Thief Charm", kind: "equip", slot: "charm", users: ["kestrel"], spd: 2, price: 130, desc: "Speed +2." })
};

SF.itemById = function (id) {
  return SF.ITEMS[id] || null;
};

SF.giveItem = function (id, n) {
  var s = SF.state;
  if (!s || !SF.ITEMS[id]) return false;
  if (!s.inventory) s.inventory = {};
  s.inventory[id] = (s.inventory[id] || 0) + (n || 1);
  return true;
};

SF.takeItem = function (id, n) {
  var s = SF.state;
  n = n || 1;
  if (!s || !s.inventory || (s.inventory[id] || 0) < n) return false;
  s.inventory[id] -= n;
  if (s.inventory[id] <= 0) delete s.inventory[id];
  return true;
};

SF.itemCount = function (id) {
  var s = SF.state;
  if (!s || !s.inventory) return 0;
  return s.inventory[id] || 0;
};

SF.shopBuy = function (id) {
  var s = SF.state;
  var it = SF.ITEMS[id];
  if (!s || !it || it.price == null) return false;
  if ((s.gold || 0) < it.price) return false;
  s.gold -= it.price;
  SF.giveItem(id, 1);
  return true;
};

SF.shopSell = function (id) {
  var s = SF.state;
  var it = SF.ITEMS[id];
  if (!s || !it) return false;
  if (!SF.takeItem(id, 1)) return false;
  s.gold = (s.gold || 0) + (it.sell || 0);
  return true;
};
