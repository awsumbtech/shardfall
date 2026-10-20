"use strict";

var SF = window.SF || {};
window.SF = SF;

var GAUGE = 1000;

function battleRng(seed) {
  var next = SF.mulberry32 ? SF.mulberry32(seed || 1) : Math.random;
  return function () { return next(); };
}

function elementName(id) {
  if (id === "ember") return "Ember";
  if (id === "tide") return "Tide";
  if (id === "gale") return "Gale";
  if (id === "shard") return "Shard";
  return "";
}

function actorById(b, id) {
  var i;
  for (i = 0; i < b.actors.length; i++) if (b.actors[i].id === id) return b.actors[i];
  return null;
}

function living(b, side) {
  return b.actors.filter(function (a) { return a.alive && a.side === side; });
}

function effSpd(a) {
  return Math.max(1, Math.round(a.spd * (a.mods.spd > 0 ? 1.3 : 1)));
}

function effDef(a) {
  return Math.max(0, Math.round(a.def * (a.mods.def > 0 ? 1.3 : 1)));
}

SF.Battle = {
  instant: false,
  rngSeed: 1
};

SF.Battle.makePartyActor = function (s, id, index) {
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
};

SF.Battle.makeFoe = function (kind, n, revealed) {
  var def = SF.FOES[kind];
  var name = def.name;
  return {
    id: "f-" + kind + "-" + n,
    key: kind,
    side: "foe",
    name: name,
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
};

function stampNames(foes) {
  var counts = {};
  foes.forEach(function (f) { counts[f.key] = (counts[f.key] || 0) + 1; });
  var seen = {};
  foes.forEach(function (f) {
    if (counts[f.key] < 2) return;
    seen[f.key] = (seen[f.key] || 0) + 1;
    f.name = f.name + " " + seen[f.key];
  });
}

function primeCt(actors) {
  var fastest = 1;
  actors.forEach(function (a) { if (a.spd > fastest) fastest = a.spd; });
  actors.forEach(function (a, i) {
    a.ct = Math.round((a.spd / fastest) * GAUGE - i);
  });
}

SF.Battle.forecast = function (b, count) {
  var sim = b.actors.map(function (a) {
    return { id: a.id, ct: a.ct, spd: effSpd(a), alive: a.alive };
  });
  var out = [];
  var guard = 0;
  var current = null;
  if (b.actorId) {
    out.push(b.actorId);
    sim.forEach(function (a) { if (a.id === b.actorId) current = a; });
    if (current) current.ct -= GAUGE;
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
    ready.sort(function (a, c) { return c.ct - a.ct || c.spd - a.spd; });
    out.push(ready[0].id);
    ready[0].ct -= GAUGE;
  }
  return out.slice(0, count);
};

function nextActor(b) {
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
      var need = (GAUGE - a.ct) / effSpd(a);
      if (need < step) step = need;
    });
    if (!(step > 0)) break;
    alive.forEach(function (a) { a.ct += effSpd(a) * step; });
  }
  return null;
}

function pushLog(b, text) {
  if (!text) return;
  b.log.push(text);
  if (b.log.length > 24) b.log.shift();
}

function targetsFor(b, actor, skill) {
  var target = skill.target;
  if (target === "self") return [actor];
  if (target === "ally" || target === "all-allies") {
    var allies = living(b, actor.side);
    if (skill.revive) return b.actors.filter(function (a) { return a.side === actor.side; });
    return allies;
  }
  var other = actor.side === "party" ? "foe" : "party";
  return living(b, other);
}

function healAmount(actor, skill) {
  return skill.heal + Math.round((actor.mag || 0) / 6);
}

function dealDamage(b, actor, target, skill, powerScale) {
  var power = (skill.power || 10) * (powerScale || 1);
  var atk = skill.mag ? actor.mag : actor.atk;
  var raw = Math.round(atk * power / 10 - effDef(target) * 0.45);
  var element = skill.element || (!skill.mag && skill.id === "attack" ? actor.element : "");
  var note = "";
  if (element && target.weak && element === target.weak) {
    raw = Math.round(raw * 1.5);
    note = "weak";
  } else if (element && target.resist && element === target.resist) {
    raw = Math.round(raw * 0.5);
    note = "resist";
  }
  if (target.guard) raw = Math.round(raw * 0.5);
  raw = Math.max(1, raw);
  target.hp -= raw;
  if (target.hp <= 0) {
    target.hp = 0;
    target.alive = false;
  }
  if (target.side === "foe" && (note === "weak" || skill.scan)) target.revealed = true;
  if (skill.id === "attack" || (skill.power && !skill.scan)) target.revealed = true;
  return { dmg: raw, element: element, note: note, dead: !target.alive };
}

function checkPhases(target) {
  if (!target.phases || !target.phases.length) return "";
  var ratio = target.maxHp ? target.hp / target.maxHp : 1;
  var step = 1;
  target.phases.forEach(function (ph, i) {
    if (ratio <= ph.at) step = i + 2;
  });
  if (step === target.phase) return "";
  var ph = target.phases[step - 2];
  if (!ph) return "";
  target.phase = step;
  if (ph.def) target.def = Math.max(1, Math.round(target.baseDef * ph.def));
  if (ph.atk) target.atk = Math.max(1, Math.round(target.baseAtk * ph.atk));
  if (ph.skill && target.skills.indexOf(ph.skill) < 0) target.skills.push(ph.skill);
  return ph.log || "";
}

function writeBackParty(s, b) {
  b.actors.forEach(function (a) {
    if (a.side !== "party") return;
    var m = s.party.members[a.key];
    if (!m) return;
    m.hp = a.alive ? a.hp : 0;
    m.sp = a.sp;
  });
  var way = actorById(b, "p-wayfarer");
  if (way && s.player) {
    s.player.hp = Math.max(0, way.hp);
    s.player.maxHp = way.maxHp;
  }
  SF.syncFieldVitals(s);
}

function finishBattle(win) {
  var s = SF.state;
  var b = s.battle;
  if (!b || b.closed) return;
  b.closed = true;
  b.phase = "done";
  var fieldId = b.fieldId;
  var onWin = b.onWin;
  var onLose = b.onLose;
  var fled = b.result && b.result.fled;
  s.battle = null;
  s.touchCd = 0.7;
  s.mode = "play";
  if (win && !fled) {
    if (window.Sfx) Sfx.play("fanfare");
    if (fieldId) {
      var foe = null;
      s.enemies.forEach(function (e) { if (e.id === fieldId) foe = e; });
      if (foe && foe.alive && SF.defeatFieldFoe) SF.defeatFieldFoe(foe);
    }
    if (onWin) onWin();
  } else if (!win) {
    SF.Battle.applyLoss(s);
    if (onLose) onLose();
  } else if (fled && fieldId) {
    SF.Battle.shoveOff(s, fieldId);
  }
  if (s.mode === "play" && SF.cuePlaceMusic) SF.cuePlaceMusic(s);
  if (SF.releaseHolds) SF.releaseHolds();
  SF.saveGame({ silent: true });
}

SF.Battle.applyLoss = function (s) {
  SF.activeParty(s).forEach(function (id) {
    var m = s.party.members[id];
    var st = SF.memberStats(s, id);
    m.hp = Math.max(1, Math.ceil(st.maxHp * 0.5));
    m.sp = Math.max(m.sp || 0, Math.ceil(st.maxSp * 0.5));
  });
  var back = s.checkpoint;
  if (back && back.island && back.island !== SF.islandId && SF.travelTo) {
    s.pendingTalk = null;
    SF.travelTo(back.island);
    s.pendingTalk = null;
  }
  var p = s.player;
  if (back && back.x != null && (!back.island || back.island === SF.islandId || SF.islandId === back.island)) {
    p.x = back.x;
    p.y = back.y;
  } else if (SF.WAKE) {
    p.x = SF.WAKE.x;
    p.y = SF.WAKE.y;
  }
  p.safeX = p.x;
  p.safeY = p.y;
  p.px = p.x;
  p.py = p.y;
  p.fall = 0;
  p.dashT = 0;
  p.hp = s.party.members.wayfarer.hp;
  SF.syncFieldVitals(s);
  if (SF.islandId === "emberhold" && !(back && back.island === "cinderveil")) {
    SF.pushToast("Back to the waking stones. The party is at half HP.");
  } else {
    SF.pushToast("Back to the last lamp. The party is at half HP.");
  }
};

SF.Battle.shoveOff = function (s, fieldId) {
  var foe = null;
  s.enemies.forEach(function (e) { if (e.id === fieldId) foe = e; });
  if (!foe) return;
  var p = s.player;
  var dx = p.x - foe.x;
  var dy = p.y - foe.y;
  var d = Math.hypot(dx, dy) || 1;
  var nx = foe.x + (dx / d) * (foe.r + p.r + 28);
  var ny = foe.y + (dy / d) * (foe.r + p.r + 28);
  if (SF.walkable(nx, ny)) {
    p.x = nx;
    p.y = ny;
  } else if (SF.walkable(p.x, ny)) {
    p.y = ny;
  } else if (SF.walkable(nx, p.y)) {
    p.x = nx;
  }
  p.safeX = p.x;
  p.safeY = p.y;
};

function openResult(b, row) {
  b.result = row;
  b.phase = "result";
  b.actorId = null;
  if (row.levels && row.levels.length && window.Sfx) Sfx.play("level");
}

function victory(b) {
  var s = SF.state;
  writeBackParty(s, b);
  var levels = SF.grantPartyXp(s, b.xp || 0);
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
  SF.syncFieldVitals(s);
  if (levels.length) SF.emit && SF.emit("level");
  openResult(b, {
    win: true,
    fled: false,
    xp: b.xp || 0,
    gold: b.gold || 0,
    items: found,
    levels: levels
  });
}

function defeat(b) {
  writeBackParty(SF.state, b);
  openResult(b, { win: false, fled: false, xp: 0, gold: 0, items: [], levels: [] });
}

function fled(b) {
  writeBackParty(SF.state, b);
  openResult(b, { win: true, fled: true, xp: 0, gold: 0, items: [], levels: [] });
}

function checkEnd(b) {
  if (!living(b, "foe").length) {
    victory(b);
    return true;
  }
  if (!living(b, "party").length) {
    defeat(b);
    return true;
  }
  return false;
}

function spendTurn(actor, kind) {
  actor.guard = false;
  if (actor.mods.def > 0) actor.mods.def -= 1;
  if (actor.mods.spd > 0) actor.mods.spd -= 1;
  actor.ct = kind === "defend" ? 320 : 0;
}

function hitLog(actor, target, hit, skill) {
  var lines = [];
  var verb = skill && skill.name && skill.id !== "attack" ? " uses " + skill.name + "." : " attacks!";
  if (skill && skill.hits > 1) verb = " uses " + skill.name + ".";
  lines.push(actor.name + (skill && skill.id !== "attack" ? " uses " + skill.name + "." : " attacks!"));
  if (target.core) lines[lines.length - 1] = actor.name + " attacks the core!";
  if (skill && skill.id !== "attack") lines[0] = actor.name + " uses " + skill.name + ".";
  lines.push(target.name + " takes " + hit.dmg + " damage.");
  if (hit.note === "weak" && hit.element) lines.push(target.name + " is weak to " + elementName(hit.element) + ".");
  if (hit.note === "resist" && hit.element) lines.push(target.name + " resists " + elementName(hit.element) + ".");
  if (hit.dead) lines.push(target.name + " is defeated.");
  return lines;
}

SF.Battle.applyAction = function (b, actor, action) {
  var lines = [];
  var skill, list, i, hit, item, healed, before;
  if (action.type === "defend") {
    actor.guard = true;
    actor.sp = Math.min(actor.maxSp, actor.sp + 3);
    lines.push(actor.name + " defends.");
    spendTurn(actor, "defend");
    return lines;
  }
  if (action.type === "flee") {
    if (!b.canFlee) {
      lines.push("Cannot flee.");
      spendTurn(actor, "flee");
      return lines;
    }
    var partySpd = 0;
    var foeSpd = 0;
    var pc = 0;
    var fc = 0;
    b.actors.forEach(function (a) {
      if (!a.alive) return;
      if (a.side === "party") { partySpd += effSpd(a); pc += 1; }
      else { foeSpd += effSpd(a); fc += 1; }
    });
    partySpd = pc ? partySpd / pc : 1;
    foeSpd = fc ? foeSpd / fc : 1;
    var chance = Math.max(0.25, Math.min(0.9, 0.45 + (partySpd - foeSpd) * 0.03));
    if (action.item) chance = 1;
    b.fleeChance = chance;
    if (b.rng() <= chance) {
      lines.push(actor.name + " flees.");
      b._fled = true;
    } else {
      lines.push("Could not flee.");
    }
    spendTurn(actor, "flee");
    return lines;
  }
  if (action.type === "item") {
    item = SF.ITEMS[action.itemId];
    if (!item || !SF.takeItem(action.itemId, 1)) {
      lines.push("No item.");
      spendTurn(actor, "item");
      return lines;
    }
    if (item.flee) {
      lines.push(actor.name + " uses a Smoke Bomb.");
      if (!b.canFlee) lines.push("Cannot flee.");
      else {
        lines.push("The party flees.");
        b._fled = true;
      }
      if (!b._fled) SF.giveItem(action.itemId, 1);
      spendTurn(actor, "item");
      return lines;
    }
    var target = action.targetId ? actorById(b, action.targetId) : null;
    lines.push(actor.name + " uses " + item.name + ".");
    if (item.hp && target && target.alive) {
      before = target.hp;
      target.hp = Math.min(target.maxHp, target.hp + item.hp);
      lines.push(target.name + " recovers " + (target.hp - before) + " HP.");
    }
    if (item.sp && target && target.alive) {
      before = target.sp;
      target.sp = Math.min(target.maxSp, target.sp + item.sp);
      lines.push(target.name + " recovers " + (target.sp - before) + " SP.");
    }
    if (item.revive && target && !target.alive) {
      target.alive = true;
      target.hp = Math.max(1, Math.ceil(target.maxHp * item.revive));
      lines.push(target.name + " is back.");
    }
    if (item.dmg && target && target.alive) {
      var dmg = item.dmg;
      var note = "";
      if (item.element && target.weak === item.element) {
        dmg = Math.round(dmg * 1.5);
        note = "weak";
      } else if (item.element && target.resist === item.element) {
        dmg = Math.max(1, Math.round(dmg * 0.5));
        note = "resist";
      }
      if (target.guard) dmg = Math.max(1, Math.round(dmg * 0.5));
      target.hp -= dmg;
      target.revealed = true;
      if (target.hp <= 0) {
        target.hp = 0;
        target.alive = false;
      }
      lines.push(target.name + " takes " + dmg + " damage.");
      if (note === "weak") lines.push(target.name + " is weak to " + elementName(item.element) + ".");
      if (note === "resist") lines.push(target.name + " resists " + elementName(item.element) + ".");
      if (!target.alive) lines.push(target.name + " is defeated.");
      var itemPhase = checkPhases(target);
      if (itemPhase) lines.push(itemPhase);
    }
    spendTurn(actor, "item");
    return lines;
  }
  skill = SF.skillById(action.skillId || "attack");
  if (!skill) skill = SF.SKILLS.attack;
  if (skill.sp && actor.sp < skill.sp) {
    lines.push("Not enough SP.");
    spendTurn(actor, "skill");
    return lines;
  }
  if (skill.sp) actor.sp -= skill.sp;
  if (skill.scan) {
    b.actors.forEach(function (a) { if (a.side === "foe") a.revealed = true; });
    lines.push(actor.name + " uses Scan.");
    lines.push("Weakness shown.");
    spendTurn(actor, "skill");
    return lines;
  }
  if (skill.steal) {
    var mark = action.targetId ? actorById(b, action.targetId) : living(b, "foe")[0];
    lines.push(actor.name + " uses Steal.");
    if (mark && mark.steal && !mark.stolen && b.rng() < 0.75) {
      mark.stolen = true;
      SF.giveItem(mark.steal, 1);
      var stolenName = SF.ITEMS[mark.steal].name;
      b.stolen.push(stolenName);
      lines.push(actor.name + " steals a " + stolenName + ".");
    } else {
      lines.push("Nothing to steal.");
    }
    spendTurn(actor, "skill");
    return lines;
  }
  list = action.targetId && skill.target !== "all-foes" && skill.target !== "all-allies"
    ? [actorById(b, action.targetId)]
    : targetsFor(b, actor, skill);
  list = list.filter(function (t) { return !!t && (t.alive || skill.revive); });
  if (!list.length) {
    lines.push(actor.name + " acts.");
    spendTurn(actor, "skill");
    return lines;
  }
  if (skill.heal || skill.defUp || skill.spdUp) {
    lines.push(actor.name + " uses " + skill.name + ".");
    list.forEach(function (t) {
      if (skill.heal) {
        before = t.hp;
        healed = healAmount(actor, skill);
        t.hp = Math.min(t.maxHp, t.hp + healed);
        lines.push(t.name + " recovers " + (t.hp - before) + " HP.");
      }
      if (skill.defUp) {
        t.mods.def = skill.defUp;
        lines.push(t.name + " Defense up.");
      }
      if (skill.spdUp) {
        t.mods.spd = skill.spdUp;
        lines.push(t.name + " Speed up.");
      }
    });
    spendTurn(actor, "skill");
    return lines;
  }
  var hits = skill.hits || 1;
  var announced = false;
  list.forEach(function (t) {
    for (i = 0; i < hits; i++) {
      if (!t.alive) break;
      hit = dealDamage(b, actor, t, skill.id === "attack" ? { id: "attack", power: 10, element: actor.element } : skill);
      if (window.Sfx) Sfx.play(t.side === "party" ? "hurt" : "impact");
      if (window.Haptics) Haptics.pulse(12);
      if (!announced) {
        if (t.core && (skill.id === "attack" || !skill.element)) lines.push(actor.name + " attacks the core!");
        else if (skill.id === "attack") lines.push(actor.name + " attacks!");
        else lines.push(actor.name + " uses " + skill.name + ".");
        announced = true;
      }
      lines.push(t.name + " takes " + hit.dmg + " damage.");
      if (hit.note === "weak" && hit.element) lines.push(t.name + " is weak to " + elementName(hit.element) + ".");
      if (hit.note === "resist" && hit.element) lines.push(t.name + " resists " + elementName(hit.element) + ".");
      if (hit.dead) lines.push(t.name + " is defeated.");
      if (t.boss) {
        var phaseLine = checkPhases(t);
        if (phaseLine) lines.push(phaseLine);
      }
      if (sKnown) remember(t);
    }
  });
  spendTurn(actor, skill.id === "attack" ? "attack" : "skill");
  return lines;
};

function remember(target) {
  var s = SF.state;
  if (!s.known) s.known = {};
  if (!target.revealed || !target.weak) return;
  s.known[target.key] = { weak: target.weak, resist: target.resist || "" };
}

var sKnown = true;

function beginActorTurn(b) {
  if (checkEnd(b)) return;
  var actor = nextActor(b);
  if (!actor) {
    defeat(b);
    return;
  }
  b.actorId = actor.id;
  b.order = SF.Battle.forecast(b, 8);
  if (actor.side === "foe") {
    var action = SF.Battle.foeAction(b, actor);
    SF.Battle.resolve(b, actor, action);
    return;
  }
  b.phase = "menu";
  b.pending = null;
}

SF.Battle.foeAction = function (b, actor) {
  var skills = actor.skills || [];
  var pick = null;
  if (skills.length && (b.turnCount + actor.index) % 3 === 2) pick = skills[(b.turnCount + actor.index) % skills.length];
  var target = living(b, "party").slice().sort(function (a, c) { return a.hp / a.maxHp - c.hp / c.maxHp; })[0];
  b.turnCount += 1;
  if (pick) return { type: "skill", skillId: pick, targetId: target ? target.id : null };
  return { type: "skill", skillId: "attack", targetId: target ? target.id : null };
};

SF.Battle.resolve = function (b, actor, action) {
  var lines = SF.Battle.applyAction(b, actor, action);
  lines.forEach(function (line) { pushLog(b, line); });
  b.actors.forEach(function (a) {
    if (a.side === "foe" && a.revealed) remember(a);
  });
  if (b._fled) {
    fled(b);
    return;
  }
  if (checkEnd(b)) return;
  b.phase = "readout";
  b.readoutT = SF.Battle.instant ? 0 : ((SF.calm && SF.calm()) ? 0.2 : 0.42);
  b.order = SF.Battle.forecast(b, 8);
  if (b.readoutT <= 0) SF.Battle.afterReadout(b);
};

SF.Battle.afterReadout = function (b) {
  if (!b || b.phase === "result" || b.phase === "done") return;
  b.phase = "between";
  beginActorTurn(b);
};

SF.Battle.playerAct = function (action) {
  var s = SF.state;
  var b = s && s.battle;
  if (!b || b.phase === "result" || b.phase === "readout" || b.phase === "done") return false;
  var actor = actorById(b, b.actorId);
  if (!actor || actor.side !== "party") return false;
  if (action.type === "menu") {
    b.phase = action.menu;
    return true;
  }
  SF.Battle.resolve(b, actor, action);
  return true;
};

SF.Battle.confirmResult = function () {
  var s = SF.state;
  var b = s && s.battle;
  if (!b || b.phase !== "result") return;
  var win = b.result && b.result.win && !b.result.fled;
  var fledOut = b.result && b.result.fled;
  SF._lastResult = b.result;
  if (fledOut) finishBattle(true);
  else finishBattle(!!win);
};

SF.Battle.skipReadout = function () {
  var b = SF.state && SF.state.battle;
  if (!b || b.phase !== "readout") return;
  b.readoutT = 0;
  SF.Battle.afterReadout(b);
};

SF.Battle.update = function (dt) {
  var b = SF.state && SF.state.battle;
  if (!b) return;
  b.t += dt;
  if (b.phase === "readout") {
    b.readoutT -= dt;
    if (b.readoutT <= 0) SF.Battle.afterReadout(b);
  }
};

function lowest(list) {
  return list.slice().sort(function (a, c) { return a.hp / a.maxHp - c.hp / c.maxHp; })[0];
}

SF.Battle.autoPick = function () {
  var s = SF.state;
  var b = s.battle;
  if (!b) return;
  if (b.phase === "readout") {
    SF.Battle.skipReadout();
    return;
  }
  if (b.phase === "result") {
    SF.Battle.confirmResult();
    return;
  }
  var actor = actorById(b, b.actorId);
  if (!actor) return;
  var allies = living(b, "party");
  var hurt = lowest(allies);
  var dead = b.actors.filter(function (a) { return a.side === "party" && !a.alive; })[0];
  if (dead && SF.itemCount("phoenix_shard") > 0) {
    SF.Battle.playerAct({ type: "item", itemId: "phoenix_shard", targetId: dead.id });
    return;
  }
  if (hurt && hurt.hp / hurt.maxHp < 0.5) {
    if (SF.itemCount("hi_tonic") > 0 && hurt.hp / hurt.maxHp < 0.35) {
      SF.Battle.playerAct({ type: "item", itemId: "hi_tonic", targetId: hurt.id });
      return;
    }
    if (SF.itemCount("tonic") > 0 && hurt.maxHp - hurt.hp >= 30) {
      SF.Battle.playerAct({ type: "item", itemId: "tonic", targetId: hurt.id });
      return;
    }
    var heal = null;
    actor.skills.forEach(function (id) {
      var sk = SF.SKILLS[id];
      if (sk && sk.heal && actor.sp >= sk.sp) heal = id;
    });
    if (heal) {
      var skh = SF.SKILLS[heal];
      var tid = hurt.id;
      if (skh.target === "all-allies") tid = null;
      SF.Battle.playerAct({ type: "skill", skillId: heal, targetId: tid });
      return;
    }
  }
  if (actor.sp < 4 && SF.itemCount("ether") > 0 && actor.sp < actor.maxSp) {
    SF.Battle.playerAct({ type: "item", itemId: "ether", targetId: actor.id });
    return;
  }
  var foes = living(b, "foe");
  var foe = lowest(foes);
  var best = null;
  var bestPower = 9;
  actor.skills.forEach(function (id) {
    var sk = SF.SKILLS[id];
    if (!sk || !sk.power || sk.heal || sk.scan || sk.steal) return;
    if (actor.sp < sk.sp) return;
    var score = sk.power * (sk.hits || 1);
    if (sk.target === "all-foes" && foes.length > 1) score += 6;
    if (sk.element && foe && foe.weak === sk.element) score += 8;
    if (score > bestPower) {
      bestPower = score;
      best = id;
    }
  });
  if (best) {
    var skill = SF.SKILLS[best];
    SF.Battle.playerAct({
      type: "skill",
      skillId: best,
      targetId: skill.target === "all-foes" ? null : (foe ? foe.id : null)
    });
    return;
  }
  SF.Battle.playerAct({ type: "skill", skillId: "attack", targetId: foe ? foe.id : null });
};

SF.Battle.autoResolve = function (cap) {
  var i;
  cap = cap || 100;
  for (i = 0; i < cap; i++) {
    var b = SF.state && SF.state.battle;
    if (!b) return SF._lastResult && SF._lastResult.win ? "win" : "lose";
    if (b.phase === "result") {
      var win = !!(b.result && b.result.win && !b.result.fled);
      SF.Battle.confirmResult();
      return win ? "win" : "lose";
    }
    SF.Battle.autoPick();
  }
  return "timeout";
};

SF.Battle.start = function (encounterId, opts) {
  var s = SF.state;
  opts = opts || {};
  var enc = SF.ENCOUNTERS[encounterId];
  if (!s || !enc) return false;
  if (s.mode !== "play" && s.mode !== "battle") return false;
  SF.ensureParty(s);
  SF.syncFieldVitals(s);
  var b = {
    id: encounterId,
    name: enc.name,
    bg: opts.bg || enc.bg || "emberhold_meadow",
    boss: opts.boss != null ? !!opts.boss : !!enc.boss,
    canFlee: opts.canFlee != null ? !!opts.canFlee : enc.canFlee !== false && !enc.boss,
    xp: enc.xp || 0,
    gold: enc.gold || 0,
    drops: (enc.drops || []).map(function (d) { return { id: d.id, chance: d.chance }; }),
    stolen: [],
    fieldId: opts.fieldId || null,
    onWin: opts.onWin || null,
    onLose: opts.onLose || null,
    rng: battleRng(SF.Battle.rngSeed++),
    actors: [],
    log: [],
    phase: "menu",
    actorId: null,
    order: [],
    t: 0,
    readoutT: 0,
    result: null,
    turnCount: 0,
    closed: false,
    _fled: false
  };
  var party = SF.activeParty(s);
  party.forEach(function (id, i) {
    var actor = SF.Battle.makePartyActor(s, id, i);
    if (actor.hp > 0) b.actors.push(actor);
  });
  if (!b.actors.length) return false;
  var counts = {};
  enc.foes.forEach(function (kind) {
    counts[kind] = (counts[kind] || 0) + 1;
    var known = s.known && s.known[kind] && s.known[kind].weak;
    var foe = SF.Battle.makeFoe(kind, counts[kind], !!known);
    b.actors.push(foe);
  });
  stampNames(b.actors.filter(function (a) { return a.side === "foe"; }));
  primeCt(b.actors);
  s.battle = b;
  s.mode = "battle";
  if (SF.releaseHolds) SF.releaseHolds();
  pushLog(b, b.boss ? b.name + " attacks." : b.name + ".");
  if (window.Music) Music.play(b.boss ? "boss" : "battle");
  if (b.boss && window.Sfx) Sfx.play("roar");
  beginActorTurn(b);
  SF.noteHint && SF.noteHint("strike");
  return true;
};

SF.touchFoe = function (e) {
  var s = SF.state;
  if (!s || s.mode !== "play" || !e || !e.alive || e.dying > 0 || e.dormant) return false;
  if (s.touchCd > 0) return false;
  if (e.kind === "maw" && !s.flags.mawFight) return false;
  var id = e.encounter || SF.encounterForSpawn(e);
  if (!id || !SF.ENCOUNTERS[id]) return false;
  var enc = SF.ENCOUNTERS[id];
  return SF.Battle.start(id, {
    fieldId: e.id,
    boss: !!enc.boss || e.kind === "maw",
    canFlee: enc.canFlee !== false && !enc.boss && e.kind !== "maw",
    bg: enc.bg
  });
};

SF.defeatFieldFoe = function (e) {
  if (!e || !e.alive) return;
  var s = SF.state;
  var kind = SF.KINDS[e.kind];
  e.alive = false;
  e.dying = 0.45;
  e.hp = 0;
  s.stats.foes = (s.stats.foes || 0) + 1;
  if (kind && kind.drops) {
    var id = "drop-" + e.id;
    var dropX = SF.walkable(e.x, e.y) ? e.x : e.homeX;
    var dropY = SF.walkable(e.x, e.y) ? e.y : e.homeY;
    if (!s.picked[id] && !s.drops[id]) s.drops[id] = { x: dropX, y: dropY };
  }
  SF.burst && SF.burst(e.x, e.y, "#ffe9a8", 10, 70);
  if (e.kind === "maw" && SF.onMawDead) SF.onMawDead();
};

SF.joinParty = function (id, silent, state) {
  var s = state || SF.state;
  if (!s || !SF.PARTY[id] || id === "wayfarer") return false;
  SF.ensureParty(s);
  var flag = "party_" + id;
  if (s.flags[flag]) return false;
  s.flags[flag] = true;
  var w = s.party.members.wayfarer;
  var m = s.party.members[id];
  m.xp = w.xp;
  m.level = 1;
  SF.levelMemberToXp(s, id);
  var st = SF.memberStats(s, id);
  m.hp = st.maxHp;
  m.sp = st.maxSp;
  if (!silent) {
    var label = id === "kestrel" ? "Kestrel joined the party." : "Tamsin joined the party.";
    if (!s.banners) s.banners = [];
    if (s === SF.state && SF.pushBanner) SF.pushBanner(label, "");
    else s.banners.push({ title: label, sub: "", ttl: 3.3 });
    if (s === SF.state && SF.saveGame) SF.saveGame({ silent: true });
  }
  return true;
};

SF.pastAct1 = function (s) {
  if (!s) return false;
  var f = s.flags || {};
  if (f.act1 || f.epilogueHeard || f.needsEpilogue) return true;
  return s.quest === "act1";
};

SF.grantActEndParty = function (s) {
  if (!SF.pastAct1(s)) return;
  SF.joinParty("kestrel", false, s);
  SF.joinParty("tamsin", false, s);
};

SF.migrateBattleSave = function (s, data) {
  SF.ensureParty(s);
  if (data && data.v === 3 && data.party && data.party.members) {
    s.party = data.party;
    s.inventory = data.inventory || {};
    s.gold = data.gold || 0;
    s.known = data.known || {};
    SF.ensureParty(s);
    SF.syncFieldVitals(s);
    SF.grantActEndParty(s);
    return;
  }
  var oldXp = (data && data.player && data.player.xp) || s.player.xp || 0;
  var xp = Math.round(oldXp * 1.25);
  var w = s.party.members.wayfarer;
  w.xp = xp;
  w.level = 1;
  SF.levelMemberToXp(s, "wayfarer");
  var st = SF.memberStats(s, "wayfarer");
  var ratio = 1;
  if (data && data.player && data.player.maxHp) ratio = (data.player.hp || 1) / data.player.maxHp;
  w.hp = Math.max(1, Math.min(st.maxHp, Math.round(st.maxHp * ratio)));
  w.sp = st.maxSp;
  s.player.hp = w.hp;
  s.inventory = { tonic: 4, ether: 2 };
  s.gold = 20;
  SF.syncFieldVitals(s);
  SF.grantActEndParty(s);
};

function installHooks() {
  var baseFresh = SF.fresh;
  SF.fresh = function () {
    var s = baseFresh();
    SF.ensureParty(s);
    s.player.hp = s.party.members.wayfarer.hp;
    s.player.maxHp = SF.memberStats(s, "wayfarer").maxHp;
    s.player.hp = s.player.maxHp;
    s.party.members.wayfarer.hp = s.player.hp;
    SF.syncFieldVitals(s);
    return s;
  };

  var baseMake = SF.makeEnemies;
  SF.makeEnemies = function () {
    var list = baseMake();
    list.forEach(function (e) {
      var sp = null;
      (SF.SPAWNS || []).forEach(function (row) { if (row.id === e.id) sp = row; });
      e.encounter = SF.encounterForSpawn(sp || { id: e.id, kind: e.kind });
    });
    return list;
  };

  SF.updateEnemy = function (e, dt) {
    var s = SF.state;
    if (!s) return;
    if (e.dying > 0) {
      e.dying -= dt;
      return;
    }
    if (!e.alive || e.dormant) return;
    e.hurt = Math.max(0, e.hurt - dt);
    var p = s.player;
    if (e.kind === "maw") {
      if (s.mode === "play" && s.flags.mawFight && !s.flags.mawDead && SF.dist(e.x, e.y, p.x, p.y) < e.r + p.r + 2) {
        SF.touchFoe(e);
      }
      return;
    }
    var kind = SF.KINDS[e.kind] || { speed: 40 };
    var ang = (SF.anim || 0) * 0.65 + (e.phase || 0);
    var tx = e.homeX + Math.cos(ang) * 16;
    var ty = e.homeY + Math.sin(ang) * 12;
    if (SF.steer) SF.steer(e, tx, ty, kind.speed * 0.32, dt);
    if (s.mode === "play" && SF.dist(e.x, e.y, p.x, p.y) < e.r + p.r - 1) SF.touchFoe(e);
  };

  SF.damageEnemy = function (e, dmg) {
    if (!e || !e.alive || e.dying > 0 || e.dormant) return;
    e.hp -= dmg;
    if (e.hp <= 0) SF.defeatFieldFoe(e);
  };

  SF.killEnemy = function (e) {
    SF.defeatFieldFoe(e);
  };

  SF.startSwing = function () { return false; };
  SF.applySwing = function () {};
  SF.dashSing = function () {};

  var baseUpdate = SF.update;
  SF.update = function (dt) {
    var s = SF.state;
    if (!s) return;
    if (s.touchCd > 0) s.touchCd = Math.max(0, s.touchCd - dt);
    if (s.mode === "battle" || s.mode === "results") {
      SF.anim = (SF.anim || 0) + dt;
      if (SF.pumpMessages) SF.pumpMessages(dt);
      SF.Battle.update(dt);
      return;
    }
    if (s.mode === "fieldmenu") {
      SF.anim = (SF.anim || 0) + dt;
      if (SF.pumpMessages) SF.pumpMessages(dt);
      return;
    }
    baseUpdate(dt);
    if (s.mode === "play" && s.party) SF.syncFieldVitals(s);
  };

  var basePlayer = SF.updatePlayer;
  SF.updatePlayer = function (dt) {
    var s = SF.state;
    var p = s.player;
    var held = (SF.consumeAttack || function () { return false; })();
    if (held && !p.attackHeld) {
      p.attackHeld = true;
      var near = null;
      var nearD = 78;
      s.enemies.forEach(function (e) {
        if (!e.alive || e.dying > 0 || e.dormant) return;
        if (e.kind === "maw" && !s.flags.mawFight) return;
        var d = SF.dist(e.x, e.y, p.x, p.y);
        if (d < nearD) {
          nearD = d;
          near = e;
        }
      });
      if (near) SF.touchFoe(near);
      else SF.pushToast("Walk into a foe to fight.");
    }
    if (!held) p.attackHeld = false;
    var realConsume = SF.consumeAttack;
    SF.consumeAttack = function () { return false; };
    basePlayer(dt);
    SF.consumeAttack = realConsume;
  };

  if (SF.buyUpgrade) {
    var baseBuy = SF.buyUpgrade;
    SF.buyUpgrade = function (id) {
      var s = SF.state;
      var had = !!(s.upgrades && s.upgrades[id]);
      var atk = s.player.atk;
      var maxHp = s.player.maxHp;
      var hp = s.player.hp;
      baseBuy(id);
      if (!had && s.upgrades && s.upgrades[id]) {
        s.player.atk = atk;
        s.player.maxHp = maxHp;
        s.player.hp = hp;
        SF.syncFieldVitals(s);
      }
    };
  }

  ["meet_maren", "maren_mend", "quest_lamp_done"].forEach(function (name) {
    SF.onDialogueEvent(name, function () {
      var s = SF.state;
      if (!s || !s.party) return;
      SF.activeParty(s).forEach(function (id) {
        var st = SF.memberStats(s, id);
        s.party.members[id].hp = st.maxHp;
        s.party.members[id].sp = st.maxSp;
      });
      s.player.hp = s.player.maxHp;
      SF.syncFieldVitals(s);
    });
  });

  SF.onDialogueEvent("act1_end", function () {
    SF.grantActEndParty(SF.state);
  });
}

installHooks();

window.Battle = SF.Battle;
