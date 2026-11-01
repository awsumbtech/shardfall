"use strict";

// BattleState builds actors from the party and the foe table. It keeps the
// battle's actor list addressable. It does not decide turns or damage.
var SF = window.SF || {};
window.SF = SF;

SF.BattleState = {
  actorById: function (b, id) {
    var i;
    if (!b || !b.actors) return null;
    for (i = 0; i < b.actors.length; i++) if (b.actors[i].id === id) return b.actors[i];
    return null;
  },

  living: function (b, side) {
    return b.actors.filter(function (a) { return a.alive && a.side === side; });
  },

  log: function (b, text) {
    if (!text || !b) return;
    b.log.push(text);
    if (b.log.length > 24) b.log.shift();
  },

  makePartyActor: function (s, id, index) {
    var def = SF.PARTY[id];
    var m = s.party.members[id];
    var st = SF.memberStats(s, id);
    m.hp = Math.max(0, Math.min(st.maxHp, m.hp == null ? st.maxHp : m.hp));
    m.sp = Math.max(0, Math.min(st.maxSp, m.sp == null ? st.maxSp : m.sp));
    return {
      id: "p-" + id,
      key: id,
      side: "party",
      name: def.name,
      sprite: def.sprite,
      hp: m.hp,
      maxHp: st.maxHp,
      sp: m.sp,
      maxSp: st.maxSp,
      atk: st.atk,
      def: st.def,
      mag: st.mag,
      spd: st.spd,
      element: st.element,
      skills: SF.skillsAt(id, m.level),
      alive: m.hp > 0,
      ct: 0,
      mods: { def: 0, spd: 0 },
      guard: false,
      index: index
    };
  },

  makeFoe: function (kind, n, revealed) {
    var def = SF.FOES[kind];
    return {
      id: "f-" + kind + "-" + n,
      key: kind,
      side: "foe",
      name: def.name,
      sprite: def.sprite,
      hp: def.hp,
      maxHp: def.hp,
      sp: 0,
      maxSp: 0,
      atk: def.atk,
      def: def.def,
      mag: def.mag,
      spd: def.spd,
      baseAtk: def.atk,
      baseDef: def.def,
      element: null,
      weak: def.weak || "",
      resist: def.resist || "",
      skills: (def.skills || []).slice(),
      steal: def.steal || "",
      stolen: false,
      boss: !!def.boss,
      core: !!def.core,
      phases: def.phases || [],
      phase: 1,
      revealed: !!revealed,
      alive: true,
      ct: 0,
      mods: { def: 0, spd: 0 },
      guard: false,
      index: n
    };
  },

  stampNames: function (foes) {
    var counts = {};
    foes.forEach(function (f) { counts[f.key] = (counts[f.key] || 0) + 1; });
    var seen = {};
    foes.forEach(function (f) {
      if (counts[f.key] < 2) return;
      seen[f.key] = (seen[f.key] || 0) + 1;
      f.name = f.name + " " + seen[f.key];
    });
  },

  writeParty: function (s, b) {
    b.actors.forEach(function (a) {
      if (a.side !== "party") return;
      var m = s.party.members[a.key];
      if (!m) return;
      m.hp = a.alive ? a.hp : 0;
      m.sp = a.sp;
    });
    var way = SF.BattleState.actorById(b, "p-wayfarer");
    if (way && s.player) {
      s.player.hp = Math.max(0, way.hp);
      s.player.maxHp = way.maxHp;
    }
    SF.syncFieldVitals(s);
  }
};
