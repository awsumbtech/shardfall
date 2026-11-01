"use strict";

// ActionResolver applies one command and emits BattleEvents. The numbers come
// from Formula and Timeline. It does not draw, and it does not call audio,
// haptics, or the renderer. Those subscribe to the events.
var SF = window.SF || {};
window.SF = SF;

(function () {

function emit(type, payload) {
  if (SF.BattleEvents) SF.BattleEvents.emit(type, payload || {});
}

function remember(target) {
  var s = SF.state;
  if (!s || !target) return;
  if (!s.known) s.known = {};
  if (!target.revealed || !target.weak) return;
  s.known[target.key] = { weak: target.weak, resist: target.resist || "" };
}

function targetsFor(b, actor, skill) {
  var target = skill.target;
  if (target === "self") return [actor];
  if (target === "ally" || target === "all-allies") {
    var allies = SF.BattleState.living(b, actor.side);
    if (skill.revive) return b.actors.filter(function (a) { return a.side === actor.side; });
    return allies;
  }
  var other = actor.side === "party" ? "foe" : "party";
  return SF.BattleState.living(b, other);
}

function spendTurn(actor) {
  if (actor.mods.def > 0) actor.mods.def -= 1;
  if (actor.mods.spd > 0) actor.mods.spd -= 1;
  actor.ct = 0;
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

function emitStrike(actor, target, hit, skill, pause, cue) {
  var payload = {
    src: actor.id,
    tgt: target.id,
    element: hit.element || "",
    amount: hit.dmg,
    weak: hit.note === "weak",
    resist: hit.note === "resist",
    skillId: skill && skill.id || "",
    dead: !!hit.dead,
    tgtSide: target.side,
    cue: !!cue
  };
  var live = SF.state && SF.state.battle;
  if (live) live._landedHit = true;
  emit("hit", payload);
  if (hit.note === "weak") emit("weak", payload);
  if (hit.note === "resist") emit("resist", payload);
  if (hit.dead) emit("kill", { src: actor.id, tgt: target.id, element: hit.element || "" });
  if (!pause.sent) {
    pause.sent = true;
    var reduced = SF.BattleFeel ? SF.BattleFeel.prefersReducedMotion() : false;
    var ms = 0;
    if (!(SF.Battle && SF.Battle.instant) && !reduced) {
      ms = SF.BattleFeel ? SF.BattleFeel.hitPauseMs() : 60;
    }
    emit("hit-pause", {
      ms: ms,
      reducedMotion: reduced,
      src: actor.id,
      tgt: target.id
    });
  }
}

function emitHeal(actor, target, before, kind) {
  var now = kind === "sp" ? target.sp : target.hp;
  emit("heal", {
    src: actor.id,
    tgt: target.id,
    amount: now - before,
    kind: kind || "hp"
  });
}

function applySkillHit(actor, target, skill) {
  var rolled = SF.BattleFormula.damage(actor, target, skill);
  target.hp -= rolled.amount;
  if (target.hp <= 0) {
    target.hp = 0;
    target.alive = false;
  }
  if (target.side === "foe" && (rolled.note === "weak" || skill.scan)) target.revealed = true;
  if (skill.id === "attack" || (skill.power && !skill.scan)) target.revealed = true;
  return { dmg: rolled.amount, element: rolled.element, note: rolled.note, dead: !target.alive };
}

function openResult(b, row) {
  b.result = row;
  b.phase = "result";
  b.actorId = null;
  // Corpses finish fading as the panel opens, and the last damage
  // numbers come down with them instead of hanging over the trees.
  b.corpseT = 0.5;
  if (b.art) {
    b.art.pose = "idle";
    b.art.pops = [];
    b.art.hurt = [];
    b.art.tags = [];
    b.art.flash = [];
    b.art.element = null;
  }
  if (row.levels && row.levels.length) emit("levelup", { levels: row.levels });
}

function victory(b) {
  var s = SF.state;
  SF.BattleState.writeParty(s, b);
  openResult(b, SF.BattleRewards.grant(s, b));
}

function defeat(b) {
  SF.BattleState.writeParty(SF.state, b);
  openResult(b, { win: false, fled: false, xp: 0, gold: 0, items: [], levels: [] });
}

function fled(b) {
  SF.BattleState.writeParty(SF.state, b);
  openResult(b, { win: true, fled: true, xp: 0, gold: 0, items: [], levels: [] });
}

function checkEnd(b) {
  if (!SF.BattleState.living(b, "foe").length) {
    victory(b);
    return true;
  }
  if (!SF.BattleState.living(b, "party").length) {
    defeat(b);
    return true;
  }
  return false;
}

function notePhase(actor, target, line) {
  if (!line) return;
  emit("phase", { src: actor ? actor.id : "", tgt: target.id, phase: target.phase, text: line });
}

SF.ActionResolver = {
  apply: function (b, actor, action) {
    var lines = [];
    var skill, list, i, hit, item, healed, before;
    var pause = { sent: false };
    if (action.type === "defend") {
      actor.guard = true;
      actor.sp = Math.min(actor.maxSp, actor.sp + 3);
      lines.push(actor.name + " defends.");
      spendTurn(actor);
      actor.ct = SF.BattleTimeline.defendCt(b, actor);
      return lines;
    }
    if (action.type === "flee") {
      if (!b.canFlee) {
        lines.push("Cannot flee.");
        spendTurn(actor);
        return lines;
      }
      var partySpd = 0;
      var foeSpd = 0;
      var pc = 0;
      var fc = 0;
      b.actors.forEach(function (a) {
        if (!a.alive) return;
        if (a.side === "party") { partySpd += SF.BattleTimeline.effSpd(a); pc += 1; }
        else { foeSpd += SF.BattleTimeline.effSpd(a); fc += 1; }
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
      spendTurn(actor);
      return lines;
    }
    if (action.type === "item") {
      item = SF.ITEMS[action.itemId];
      if (!item || !SF.takeItem(action.itemId, 1)) {
        lines.push("No item.");
        spendTurn(actor);
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
        spendTurn(actor);
        return lines;
      }
      var target = action.targetId ? SF.BattleState.actorById(b, action.targetId) : null;
      lines.push(actor.name + " uses " + item.name + ".");
      if (item.hp && target && target.alive) {
        before = target.hp;
        target.hp = Math.min(target.maxHp, target.hp + item.hp);
        lines.push(target.name + " recovers " + (target.hp - before) + " HP.");
        emitHeal(actor, target, before, "hp");
      }
      if (item.sp && target && target.alive) {
        before = target.sp;
        target.sp = Math.min(target.maxSp, target.sp + item.sp);
        lines.push(target.name + " recovers " + (target.sp - before) + " SP.");
        emitHeal(actor, target, before, "sp");
      }
      if (item.revive && target && !target.alive) {
        target.alive = true;
        before = target.hp;
        target.hp = Math.max(1, Math.ceil(target.maxHp * item.revive));
        lines.push(target.name + " is back.");
        emitHeal(actor, target, before, "revive");
      }
      if (item.dmg && target && target.alive) {
        var rolled = SF.BattleFormula.itemDamage(item, target);
        var dmg = rolled.amount;
        var note = rolled.note;
        target.hp -= dmg;
        target.revealed = true;
        if (target.hp <= 0) {
          target.hp = 0;
          target.alive = false;
        }
        lines.push(target.name + " takes " + dmg + " damage.");
        if (note === "weak") lines.push(target.name + " is weak to " + SF.BattleFormula.elementName(item.element) + ".");
        if (note === "resist") lines.push(target.name + " resists " + SF.BattleFormula.elementName(item.element) + ".");
        if (!target.alive) lines.push(target.name + " is defeated.");
        emitStrike(actor, target, { dmg: dmg, element: item.element || "", note: note, dead: !target.alive }, { id: item.id }, pause);
        var itemPhase = checkPhases(target);
        if (itemPhase) lines.push(itemPhase);
        notePhase(actor, target, itemPhase);
      }
      spendTurn(actor);
      return lines;
    }
    skill = SF.skillById(action.skillId || "attack");
    if (!skill) skill = SF.SKILLS.attack;
    if (skill.sp && actor.sp < skill.sp) {
      lines.push("Not enough SP.");
      spendTurn(actor);
      return lines;
    }
    if (skill.sp) actor.sp -= skill.sp;
    if (skill.scan) {
      b.actors.forEach(function (a) { if (a.side === "foe") a.revealed = true; });
      lines.push(actor.name + " uses Scan.");
      lines.push("Weakness shown.");
      spendTurn(actor);
      return lines;
    }
    if (skill.steal) {
      var mark = action.targetId ? SF.BattleState.actorById(b, action.targetId) : SF.BattleState.living(b, "foe")[0];
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
      spendTurn(actor);
      return lines;
    }
    list = action.targetId && skill.target !== "all-foes" && skill.target !== "all-allies"
      ? [SF.BattleState.actorById(b, action.targetId)]
      : targetsFor(b, actor, skill);
    list = list.filter(function (t) { return !!t && (t.alive || skill.revive); });
    if (!list.length) {
      lines.push(actor.name + " acts.");
      spendTurn(actor);
      return lines;
    }
    if (skill.heal || skill.defUp || skill.spdUp) {
      lines.push(actor.name + " uses " + skill.name + ".");
      list.forEach(function (t) {
        if (skill.heal) {
          before = t.hp;
          healed = SF.BattleFormula.healAmount(actor, skill);
          t.hp = Math.min(t.maxHp, t.hp + healed);
          lines.push(t.name + " recovers " + (t.hp - before) + " HP.");
          emitHeal(actor, t, before, "hp");
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
      spendTurn(actor);
      return lines;
    }
    var hits = skill.hits || 1;
    var announced = false;
    var strikeSkill = skill.id === "attack" ? { id: "attack", power: 10, element: actor.element } : skill;
    list.forEach(function (t) {
      for (i = 0; i < hits; i++) {
        if (!t.alive) break;
        hit = applySkillHit(actor, t, strikeSkill);
        if (!announced) {
          if (t.core && (skill.id === "attack" || !skill.element)) lines.push(actor.name + " attacks the core!");
          else if (skill.id === "attack") lines.push(actor.name + " attacks!");
          else lines.push(actor.name + " uses " + skill.name + ".");
          announced = true;
        }
        lines.push(t.name + " takes " + hit.dmg + " damage.");
        if (hit.note === "weak" && hit.element) lines.push(t.name + " is weak to " + SF.BattleFormula.elementName(hit.element) + ".");
        if (hit.note === "resist" && hit.element) lines.push(t.name + " resists " + SF.BattleFormula.elementName(hit.element) + ".");
        if (hit.dead) lines.push(t.name + " is defeated.");
        emitStrike(actor, t, hit, strikeSkill, pause, true);
        if (t.boss) {
          var phaseLine = checkPhases(t);
          if (phaseLine) lines.push(phaseLine);
          notePhase(actor, t, phaseLine);
        }
        remember(t);
      }
    });
    spendTurn(actor);
    return lines;
  },

  resolve: function (b, actor, action) {
    b._landedHit = false;
    var lines = SF.ActionResolver.apply(b, actor, action);
    lines.forEach(function (line) { SF.BattleState.log(b, line); });
    b.actors.forEach(function (a) {
      if (a.side === "foe" && a.revealed) remember(a);
    });
    if (b._fled) {
      fled(b);
      return;
    }
    if (checkEnd(b)) return;
    b.phase = "readout";
    var plan = SF.BattleFeel.readoutPlan(!!b._landedHit);
    b.readoutT = plan.shown;
    b.readoutDur = plan.full > 0 ? plan.full : SF.BattleFeel.READOUT;
    b.order = SF.Battle.forecast(b, 8);
    if (b.readoutT <= 0) SF.Battle.afterReadout(b);
  },

  afterReadout: function (b) {
    if (!b || b.phase === "result" || b.phase === "done") return;
    b.phase = "between";
    SF.ActionResolver.beginTurn(b);
  },

  beginTurn: function (b) {
    if (checkEnd(b)) return;
    var actor = SF.BattleTimeline.next(b);
    if (!actor) {
      defeat(b);
      return;
    }
    b.actorId = actor.id;
    actor.guard = false;
    b.sel = 0;
    b.listScroll = 0;
    b.order = SF.Battle.forecast(b, 8);
    emit("turn-start", { actorId: actor.id, side: actor.side, name: actor.name });
    if (actor.side === "foe") {
      var action = SF.Battle.foeAction(b, actor);
      SF.Battle.resolve(b, actor, action);
      return;
    }
    b.phase = "menu";
    b.pending = null;
    b.menuLockUntil = (SF.BattleFeel.now ? SF.BattleFeel.now() : Date.now()) + SF.BattleFeel.MENU_LOCK_MS;
    emit("command-menu", { actorId: actor.id });
  }
};

  SF.Battle = SF.Battle || {};
  SF.Battle.Resolver = SF.ActionResolver;
  SF.Battle.rules = {
    emit: emit,
    remember: remember,
    targetsFor: targetsFor,
    spendTurn: spendTurn,
    checkPhases: checkPhases,
    emitStrike: emitStrike,
    emitHeal: emitHeal,
    applySkillHit: applySkillHit,
    openResult: openResult,
    victory: victory,
    defeat: defeat,
    fled: fled,
    checkEnd: checkEnd,
    notePhase: notePhase
  };
})();
