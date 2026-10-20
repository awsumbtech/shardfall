"use strict";

var SF = window.SF || {};
window.SF = SF;

// Cumulative XP to reach level index. XP_NEED[1] is the XP for level 2.
// Length 30 means level 30 is the cap (see SF.levelFor).
SF.XP_NEED = (function () {
  var need = [0];
  var total = 0;
  var lv, cost;
  for (lv = 1; lv <= 29; lv++) {
    cost = Math.round(18 + 4.2 * lv + 0.55 * lv * lv);
    total += cost;
    need.push(total);
  }
  return need;
})();

SF.PARTY = {
  wayfarer: {
    id: "wayfarer",
    name: "Wayfarer",
    sprite: "wayfarer",
    base: { hp: 54, sp: 16, atk: 13, def: 7, mag: 16, spd: 11 },
    growth: { hp: 8, sp: 2, atk: 2, def: 1, mag: 3, spd: 1 },
    weapon: "shard_focus",
    skills: [
      { id: "shard_bolt", level: 1 },
      { id: "scan", level: 2 },
      { id: "mend", level: 4 },
      { id: "lampflare", level: 8 },
      { id: "shard_ward", level: 14 },
      { id: "skybreak", level: 20 }
    ]
  },
  kestrel: {
    id: "kestrel",
    name: "Kestrel",
    sprite: "kestrel",
    base: { hp: 46, sp: 12, atk: 16, def: 6, mag: 8, spd: 16 },
    growth: { hp: 7, sp: 2, atk: 3, def: 1, mag: 1, spd: 2 },
    weapon: "knife",
    skills: [
      { id: "quickshot", level: 1 },
      { id: "steal", level: 4 },
      { id: "twin_cut", level: 8 },
      { id: "gale_shot", level: 12 },
      { id: "smoke_step", level: 16 },
      { id: "killing_shot", level: 20 }
    ]
  },
  tamsin: {
    id: "tamsin",
    name: "Tamsin",
    sprite: "tamsin",
    base: { hp: 48, sp: 18, atk: 10, def: 6, mag: 15, spd: 12 },
    growth: { hp: 6, sp: 3, atk: 1, def: 1, mag: 3, spd: 1 },
    weapon: "coil_tool",
    skills: [
      { id: "spark_coil", level: 1 },
      { id: "patch_up", level: 4 },
      { id: "overclock", level: 8 },
      { id: "tonic_spray", level: 12 },
      { id: "tide_filter", level: 16 },
      { id: "field_kit", level: 20 }
    ]
  }
};

SF.PARTY_ORDER = ["wayfarer", "kestrel", "tamsin"];

SF.skillsAt = function (id, level) {
  var def = SF.PARTY[id];
  var out = [];
  if (!def) return out;
  def.skills.forEach(function (row) {
    if (row.level <= level) out.push(row.id);
  });
  return out;
};

SF.skillLearnLevel = function (id, skillId) {
  var def = SF.PARTY[id];
  var i;
  if (!def) return 0;
  for (i = 0; i < def.skills.length; i++) {
    if (def.skills[i].id === skillId) return def.skills[i].level;
  }
  return 0;
};

function blankMember(id) {
  var def = SF.PARTY[id];
  return {
    id: id,
    level: 1,
    xp: 0,
    hp: def.base.hp,
    sp: def.base.sp,
    equip: { weapon: def.weapon, armor: null, charm: null }
  };
}

SF.ensureParty = function (s) {
  if (!s.party) {
    s.party = {
      members: {
        wayfarer: blankMember("wayfarer"),
        kestrel: blankMember("kestrel"),
        tamsin: blankMember("tamsin")
      }
    };
  }
  SF.PARTY_ORDER.forEach(function (id) {
    if (!s.party.members[id]) s.party.members[id] = blankMember(id);
    var m = s.party.members[id];
    if (!m.equip) m.equip = { weapon: SF.PARTY[id].weapon, armor: null, charm: null };
    if (m.level < 1) m.level = 1;
    if (m.level > 30) m.level = 30;
  });
  if (!s.inventory) s.inventory = { tonic: 4, ether: 2 };
  if (s.gold == null) s.gold = 0;
  if (!s.known) s.known = {};
  return s;
};

SF.activeParty = function (s) {
  s = s || SF.state;
  var list = ["wayfarer"];
  if (s && s.flags && s.flags.party_kestrel) list.push("kestrel");
  if (s && s.flags && s.flags.party_tamsin) list.push("tamsin");
  return list;
};

SF.memberStats = function (s, id) {
  var def = SF.PARTY[id];
  var m = s.party.members[id];
  var lv = m.level;
  var g = def.growth;
  var b = def.base;
  var stats = {
    maxHp: b.hp + g.hp * (lv - 1),
    maxSp: b.sp + g.sp * (lv - 1),
    atk: b.atk + g.atk * (lv - 1),
    def: b.def + g.def * (lv - 1),
    mag: b.mag + g.mag * (lv - 1),
    spd: b.spd + g.spd * (lv - 1),
    element: null
  };
  ["weapon", "armor", "charm"].forEach(function (slot) {
    var it = SF.ITEMS[m.equip[slot]];
    if (!it) return;
    if (it.hp) stats.maxHp += it.hp;
    if (it.atk) stats.atk += it.atk;
    if (it.def) stats.def += it.def;
    if (it.mag) stats.mag += it.mag;
    if (it.spd) stats.spd += it.spd;
    if (slot === "weapon" && it.element) stats.element = it.element;
  });
  if (id === "wayfarer" && s.upgrades) {
    if (s.upgrades.brightedge) stats.atk += 3;
    if (s.upgrades.deepheart) stats.maxHp += 14;
  }
  stats.maxHp = Math.max(1, Math.round(stats.maxHp));
  stats.maxSp = Math.max(0, Math.round(stats.maxSp));
  stats.atk = Math.max(1, Math.round(stats.atk));
  stats.def = Math.max(0, Math.round(stats.def));
  stats.mag = Math.max(1, Math.round(stats.mag));
  stats.spd = Math.max(1, Math.round(stats.spd));
  return stats;
};

SF.xpForLevel = function (level) {
  if (level <= 1) return 0;
  if (level - 1 >= SF.XP_NEED.length) return SF.XP_NEED[SF.XP_NEED.length - 1];
  return SF.XP_NEED[level - 1];
};

SF.syncFieldVitals = function (s) {
  if (!s || !s.party || !s.player) return;
  SF.ensureParty(s);
  var m = s.party.members.wayfarer;
  var st = SF.memberStats(s, "wayfarer");
  var gain = st.maxHp - (s.player.maxHp || st.maxHp);
  s.player.maxHp = st.maxHp;
  if (gain > 0 && s.player.hp != null) s.player.hp += gain;
  if (m.hp == null) m.hp = st.maxHp;
  if (s.player.hp == null) s.player.hp = m.hp;
  s.player.hp = SF.clamp(s.player.hp, 0, st.maxHp);
  m.hp = s.player.hp;
  m.sp = Math.max(0, Math.min(st.maxSp, m.sp == null ? st.maxSp : m.sp));
  s.player.atk = st.atk;
  s.player.level = m.level;
  s.player.xp = m.xp;
};

SF.levelMemberToXp = function (s, id) {
  var m = s.party.members[id];
  var gained = [];
  var before, after, skillId, need;
  while (m.level < 30) {
    need = SF.XP_NEED[m.level];
    if (need == null || m.xp < need) break;
    before = SF.memberStats(s, id);
    m.level += 1;
    after = SF.memberStats(s, id);
    m.hp = after.maxHp;
    m.sp = after.maxSp;
    if (id === "wayfarer" && s.player) {
      s.player.maxHp = after.maxHp;
      s.player.hp = after.maxHp;
    }
    SF.PARTY[id].skills.forEach(function (row) {
      if (row.level === m.level) skillId = row.id;
    });
    gained.push({
      id: id,
      name: SF.PARTY[id].name,
      level: m.level,
      hp: [before.maxHp, after.maxHp],
      sp: [before.maxSp, after.maxSp],
      atk: [before.atk, after.atk],
      def: [before.def, after.def],
      mag: [before.mag, after.mag],
      spd: [before.spd, after.spd],
      skill: skillId ? SF.SKILLS[skillId].name : ""
    });
    skillId = "";
  }
  return gained;
};

SF.xpForFight = function (base, memberLevel, zoneLevel, fixed) {
  if (fixed) return Math.max(1, Math.round(base));
  var gap = (memberLevel || 1) - (zoneLevel || 1);
  if (gap >= 4) return 1;
  var f = gap <= -2 ? 1.25 : gap <= 0 ? 1 : [0.5, 0.25, 0.1][gap - 1];
  return Math.max(1, Math.round(base * f));
};

SF.grantPartyXp = function (s, amount, opts) {
  var levels = [];
  opts = opts || {};
  if (!amount && !opts.base) return levels;
  SF.activeParty(s).forEach(function (id) {
    var m = s.party.members[id];
    var gain = amount || 0;
    if (opts.zoneLevel != null) gain = SF.xpForFight(opts.base != null ? opts.base : amount, m.level, opts.zoneLevel, !!opts.fixed);
    if (!gain) return;
    m.xp += gain;
    levels = levels.concat(SF.levelMemberToXp(s, id));
  });
  SF.syncFieldVitals(s);
  return levels;
};
