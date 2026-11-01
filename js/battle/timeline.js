"use strict";

// Timeline is the charge-time gauge. GAUGE 1000, the same step and the same
// tie breaks as v0.4.27. delay() is not implemented here; nothing pushes CT yet.
var SF = window.SF || {};
window.SF = SF;

var GAUGE = 1000;

SF.BattleTimeline = {
  GAUGE: GAUGE,

  effSpd: function (actor) {
    return Math.max(1, Math.round(actor.spd * (actor.mods.spd > 0 ? 1.3 : 1)));
  },

  prime: function (actors) {
    var fastest = 1;
    actors.forEach(function (a) { if (a.spd > fastest) fastest = a.spd; });
    actors.forEach(function (a, i) {
      a.ct = Math.round((a.spd / fastest) * GAUGE - i);
    });
  },

  // No head start. ct stays at 0 unless that would still lap a living foe,
  // in which case the defender waits until that foe's gauge fills first.
  defendCt: function (b, actor) {
    var spd = SF.BattleTimeline.effSpd(actor);
    var wait = 0;
    SF.BattleState.living(b, "foe").forEach(function (f) {
      var t = (GAUGE - f.ct) / SF.BattleTimeline.effSpd(f);
      if (t > wait) wait = t;
    });
    if (!(wait > 0)) return 0;
    var ct = Math.floor(GAUGE - wait * spd - 1);
    if (!(ct < 0)) return 0;
    return ct;
  },

  forecast: function (b, count) {
    var sim = b.actors.map(function (a) {
      return { id: a.id, ct: a.ct, spd: SF.BattleTimeline.effSpd(a), alive: a.alive, side: a.side };
    });
    var out = [];
    var guard = 0;
    var current = null;
    if (b.actorId) {
      out.push(b.actorId);
      sim.forEach(function (a) { if (a.id === b.actorId) current = a; });
      // A full gauge means this turn has not been spent yet. Readout already
      // stored the post-action ct, so subtracting again would lie about the queue.
      if (current && current.ct > GAUGE - 1) current.ct -= GAUGE;
    }
    while (out.length < count && guard < 500) {
      guard += 1;
      var ready = sim.filter(function (a) { return a.alive && a.ct >= GAUGE; });
      if (!ready.length) {
        var alive = sim.filter(function (a) { return a.alive; });
        if (!alive.length) break;
        var step = Infinity;
        alive.forEach(function (a) {
          var need = (GAUGE - a.ct) / a.spd;
          if (need < step) step = need;
        });
        if (!(step > 0) || step === Infinity) break;
        alive.forEach(function (a) { a.ct += a.spd * step; });
        continue;
      }
      ready.sort(function (a, c) {
        if (c.ct !== a.ct) return c.ct - a.ct;
        if (a.side !== c.side) return a.side === "party" ? -1 : 1;
        return c.spd - a.spd;
      });
      out.push(ready[0].id);
      ready[0].ct -= GAUGE;
    }
    return out.slice(0, count);
  },

  next: function (b) {
    var guard = 0;
    while (guard < 400) {
      guard += 1;
      var ready = b.actors.filter(function (a) { return a.alive && a.ct >= GAUGE; });
      if (ready.length) {
        ready.sort(function (a, c) {
          if (c.ct !== a.ct) return c.ct - a.ct;
          if (a.side !== c.side) return a.side === "party" ? -1 : 1;
          return c.spd - a.spd;
        });
        return ready[0];
      }
      var alive = b.actors.filter(function (a) { return a.alive; });
      if (!alive.length) return null;
      var step = Infinity;
      alive.forEach(function (a) {
        var need = (GAUGE - a.ct) / SF.BattleTimeline.effSpd(a);
        if (need < step) step = need;
      });
      if (!(step > 0)) break;
      alive.forEach(function (a) { a.ct += SF.BattleTimeline.effSpd(a) * step; });
    }
    return null;
  }
};
