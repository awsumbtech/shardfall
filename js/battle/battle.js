"use strict";

// Public battle entry points. Field code calls Battle.start, Battle.applyLoss,
// and the auto-battle helpers. The work lives in the modules beside this file.
var SF = window.SF || {};
window.SF = SF;

SF.Battle = SF.Battle || {};
SF.Battle.instant = false;
SF.Battle.rngSeed = 1;
// Frame freeze on a hit, in milliseconds. 0 disables it. prefers-reduced-motion
// forces 0 inside BattleFeel.hitPauseMs even when this stays at 60.
SF.Battle.hitPauseMs = 60;

SF.Battle.flow = {
  rng: function (seed) {
    var next = SF.mulberry32 ? SF.mulberry32(seed || 1) : Math.random;
    return function () { return next(); };
  },
  now: function () {
    return SF.BattleFeel && SF.BattleFeel.now ? SF.BattleFeel.now() : Date.now();
  },
  // A hold skips only an enemy or system readout, and only after the press
  // began during that readout. The confirm that starts your own hit does not.
  enemyReadout: function (b) {
    if (!b || b.phase !== "readout") return false;
    var id = (b.art && b.art.id) || b.actorId;
    var actor = SF.BattleState.actorById(b, id);
    if (!actor) return true;
    return actor.side !== "party";
  },
  // True when this pointerdown started before the menu, or within
  // MENU_LOCK_MS after it. Lift time does not matter.
  pointerPressIgnored: function (b, beganAt) {
    if (!b || beganAt == null || b.menuAppearedAt == null) return false;
    var grace = SF.BattleFeel && SF.BattleFeel.MENU_LOCK_MS != null ? SF.BattleFeel.MENU_LOCK_MS : 250;
    return beganAt < b.menuAppearedAt + grace;
  },
  holdAge: function (b) {
    var now = SF.Battle.flow.now();
    var best = 0;
    ["pointerHoldSince", "keyHoldSince", "padHoldSince"].forEach(function (key) {
      if (!b[key]) return;
      var age = now - b[key];
      if (age > best) best = age;
    });
    return best;
  },
  holdingLong: function (b) {
    if (!SF.Battle.flow.enemyReadout(b)) return false;
    var need = SF.BattleFeel && SF.BattleFeel.HOLD_SKIP_MS != null ? SF.BattleFeel.HOLD_SKIP_MS : 180;
    return SF.Battle.flow.holdAge(b) >= need;
  },
  fastForward: function (b) {
    var guard = 0;
    while (b && SF.Battle.flow.holdingLong(b) && guard < 16) {
      guard += 1;
      b._holdSkips = (b._holdSkips || 0) + 1;
      b._gestureSkipped = true;
      b.hitPause = 0;
      SF.Battle.skipReadout();
    }
  },
  lowest: function (list) {
    return list.slice().sort(function (a, c) { return a.hp / a.maxHp - c.hp / c.maxHp; })[0];
  }
};

SF.Battle.pointerPressIgnored = function (b, beganAt) {
  return SF.Battle.flow.pointerPressIgnored(b, beganAt);
};
SF.Battle.enemyReadout = function (b) { return SF.Battle.flow.enemyReadout(b); };

SF.Battle.makePartyActor = function (s, id, index) {
  return SF.BattleState.makePartyActor(s, id, index);
};

SF.Battle.makeFoe = function (kind, n, revealed) {
  return SF.BattleState.makeFoe(kind, n, revealed);
};

SF.Battle.forecast = function (b, count) {
  return SF.BattleTimeline.forecast(b, count);
};

SF.Battle.applyAction = function (b, actor, action) {
  return SF.ActionResolver.apply(b, actor, action);
};

SF.Battle.foeAction = function (b, actor) {
  return SF.EnemyAI.choose(b, actor);
};

SF.Battle.resolve = function (b, actor, action) {
  if (SF.BattleEvents) SF.BattleEvents.emit("action", { actorId: actor && actor.id, action: action });
  SF.ActionResolver.resolve(b, actor, action);
};

SF.Battle.afterReadout = function (b) {
  SF.ActionResolver.afterReadout(b);
};

SF.Battle.playerAct = function (action) {
  var s = SF.state;
  var b = s && s.battle;
  if (!b || b.phase === "result" || b.phase === "readout" || b.phase === "done") return false;
  var actor = SF.BattleState.actorById(b, b.actorId);
  if (!actor || actor.side !== "party") return false;
  if (action.type === "menu") {
    b.phase = action.menu;
    return true;
  }
  SF.Battle.resolve(b, actor, action);
  return true;
};

SF.Battle.flow.finish = function (win) {
  var s = SF.state;
  var b = s.battle;
  if (!b || b.closed) return;
  b.closed = true;
  b.phase = "done";
  var fieldId = b.fieldId;
  var onWin = b.onWin;
  var onLose = b.onLose;
  var fledOut = b.result && b.result.fled;
  s.battle = null;
  s.touchCd = 0.7;
  s.encounterGrace = 10;
  s.stepAcc = 0;
  s.mode = "play";
  if (SF.inputState) {
    SF.inputState.interactEdge = false;
    SF.inputState.padAEdge = false;
  }
  if (!win && b.id === "boss_cinder_maw") {
    s.flags.mawFight = false;
    (s.enemies || []).forEach(function (e) {
      if (e.kind !== "maw") return;
      e.alive = true;
      e.dying = 0;
      e.hp = e.maxHp;
      e.dormant = true;
      e.x = e.homeX;
      e.y = e.homeY;
    });
  }
  if (win && !fledOut) {
    if (SF.BattleEvents) SF.BattleEvents.emit("battle-win", { id: b.id });
    if (fieldId) {
      var foe = null;
      s.enemies.forEach(function (e) { if (e.id === fieldId) foe = e; });
      if (foe && foe.alive && SF.defeatFieldFoe) SF.defeatFieldFoe(foe);
    }
    if (onWin) onWin();
  } else if (!win) {
    SF.Battle.applyLoss(s);
    if (onLose) onLose();
  } else if (fledOut && fieldId) {
    SF.Battle.shoveOff(s, fieldId);
  }
  if (s.mode === "play" && SF.cuePlaceMusic) SF.cuePlaceMusic(s);
  if (SF.releaseHolds) SF.releaseHolds();
  SF.saveGame({ silent: true });
};

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

SF.Battle.confirmResult = function () {
  var s = SF.state;
  var b = s && s.battle;
  if (!b || b.phase !== "result") return;
  var win = b.result && b.result.win && !b.result.fled;
  var fledOut = b.result && b.result.fled;
  SF._lastResult = b.result;
  if (fledOut) SF.Battle.flow.finish(true);
  else SF.Battle.flow.finish(!!win);
};

SF.Battle.skipReadout = function () {
  var b = SF.state && SF.state.battle;
  if (!b || b.phase !== "readout") return;
  b.hitPause = 0;
  b.readoutT = 0;
  SF.Battle.afterReadout(b);
};

SF.Battle.update = function (dt) {
  var b = SF.state && SF.state.battle;
  if (!b) return;
  if (b.hitPause > 0) {
    b.hitPause -= dt;
    if (b.hitPause > 0) dt = 0;
    else {
      dt = -b.hitPause;
      b.hitPause = 0;
    }
  }
  if (dt > 0) b.t += dt;
  if (SF.Battle.readPad) SF.Battle.readPad(b);
  if (SF.Battle.flow.holdingLong(b)) {
    SF.Battle.flow.fastForward(b);
    return;
  }
  if (b.phase === "readout" && dt > 0) {
    b.readoutT -= dt;
    if (b.readoutT <= 0) SF.Battle.afterReadout(b);
  }
  if (b.phase === "result" && b.corpseT > 0 && dt > 0) {
    b.corpseT -= dt;
    if (b.corpseT < 0) b.corpseT = 0;
  }
};


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
  var actor = SF.BattleState.actorById(b, b.actorId);
  if (!actor) return;
  var allies = SF.BattleState.living(b, "party");
  var hurt = SF.Battle.flow.lowest(allies);
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
  var foes = SF.BattleState.living(b, "foe");
  var foe = SF.Battle.flow.lowest(foes);
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
    zoneLevel: opts.zoneLevel != null ? opts.zoneLevel : null,
    fixed: !!opts.fixed,
    carrier: !!opts.carrier,
    carrierRegion: opts.carrierRegion || null,
    onWin: opts.onWin || null,
    onLose: opts.onLose || null,
    rng: SF.Battle.flow.rng(SF.Battle.rngSeed++),
    actors: [],
    log: [],
    phase: "menu",
    sel: 0,
    listScroll: 0,
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
  SF.BattleState.stampNames(b.actors.filter(function (a) { return a.side === "foe"; }));
  SF.BattleTimeline.prime(b.actors);
  s.battle = b;
  s.mode = "battle";
  if (SF.releaseHolds) SF.releaseHolds();
  SF.BattleState.log(b, b.boss ? b.name + " attacks." : b.name + ".");
  if (SF.BattleEvents) SF.BattleEvents.emit("battle-start", { boss: !!b.boss, id: b.id });
  SF.ActionResolver.beginTurn(b);
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
  e.alive = false;
  e.dying = 0.45;
  e.hp = 0;
  s.stats.foes = (s.stats.foes || 0) + 1;
  if (e.kind === "maw" && SF.spawnParticle) {
    var spark, bit;
    for (spark = 0; spark < 7; spark++) {
      SF.spawnParticle(e.x + (Math.random() - 0.5) * 16, e.y - 10, "#ffe9a8", 28, 0.2 + Math.random() * 0.1, 2);
      bit = s.particles && s.particles[s.particles.length - 1];
      if (bit) {
        bit.px = 1;
        bit.size = 2;
        bit.vx = (Math.random() - 0.5) * 28;
        bit.vy = -12 - Math.random() * 18;
      }
    }
  } else if (SF.burst) SF.burst(e.x, e.y, "#ffe9a8", 10, 70);
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
  if (data && data.v >= 3 && data.party && data.party.members) {
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

SF.Battle.flow.install = function () {
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
      if (!e.ash) e.dying -= dt;
      return;
    }
    if (!e.alive || e.dormant) return;
    e.hurt = Math.max(0, e.hurt - dt);
    if (e.kind === "tidewyrm" && s.mode === "play" && SF.dist(e.x, e.y, s.player.x, s.player.y) < e.r + s.player.r) {
      SF.touchFoe(e);
    }
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
      // Hit pause freezes the battle clock, including the pose frame.
      if (!(s.battle && s.battle.hitPause > 0)) SF.anim = (SF.anim || 0) + dt;
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

SF.Battle.flow.install();

SF.Battle.Events = SF.BattleEvents;
SF.Battle.State = SF.BattleState;
SF.Battle.Formula = SF.BattleFormula;
SF.Battle.AI = SF.EnemyAI;
SF.Battle.Rewards = SF.BattleRewards;
SF.Battle.Feel = SF.BattleFeel;
window.Battle = SF.Battle;
