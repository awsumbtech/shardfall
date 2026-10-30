"use strict";

var SF = window.SF || {};
window.SF = SF;

SF.makeEnemies = function () {
  return SF.SPAWNS.map(function (sp) {
    var kind = SF.KINDS[sp.kind];
    return {
      id: sp.id,
      kind: sp.kind,
      x: sp.x,
      y: sp.y,
      homeX: sp.x,
      homeY: sp.y,
      r: kind.r,
      hp: kind.hp,
      maxHp: kind.hp,
      alive: true,
      dying: 0,
      hurt: 0,
      hitCd: 0,
      phase: Math.random() * Math.PI * 2,
      ai: "idle",
      wind: 0,
      charge: 0,
      recover: 0,
      shotCd: 0.8,
      aimX: 1,
      aimY: 0,
      hx: 0,
      hy: 0,
      lastSwing: -1,
      dashed: -1,
      stun: 0,
      dormant: !!sp.dormant,
      encounter: sp.encounter || null,
      bg: sp.bg || null,
      boss: !!sp.boss || !!(kind && kind.boss),
      tell: 0,
      tellKind: "",
      phaseN: 1,
      markX: sp.x,
      markY: sp.y,
      charging: 0,
      lockX: 1,
      lockY: 0
    };
  });
};

SF.fresh = function () {
  if (SF.mountIsland) SF.mountIsland("emberhold");
  var enemies = SF.makeEnemies();
  return {
    mode: "title",
    pausedFrom: "play",
    playTime: 0,
    autosave: 0,
    quest: "awaken",
    island: "emberhold",
    shardsHeld: 0,
    cogs: 0,
    upgrades: {},
    checkpoint: null,
    checkpoints: {},
    enemySave: {},
    picked: {},
    drops: {},
    gold: 0,
    inventory: {},
    voyageCount: 0,
    lastRest: { island: "emberhold", x: SF.WAKE.x, y: SF.WAKE.y },
    flags: {
      metMaren: false,
      shard_sense: false,
      choirlingDown: false,
      metKestrel: false,
      metCantor: false,
      lampLit: false,
      kestrelHint: false,
      kestrelAfter: false,
      heardChoir: false,
      shardstep: false,
      sailUnlocked: false,
      cogsStarted: false,
      vaultOpen: false,
      mawFight: false,
      mawDead: false,
      cinderLit: false,
      act1: false,
      metCinderKestrel: false,
      metTamsin: false,
      metHesk: false,
      metIlsa: false,
      emberTold: false,
      grapple: false
    },
    discovered: { cinder: false, hollow: false, ashnook: false, vault: false },
    stats: { foes: 0, shardsEver: 0 },
    hints: { strike: false, span: false, talk: false, moved: false, dash: false, hook: false },
    player: {
      x: SF.WAKE.x,
      y: SF.WAKE.y,
      safeX: SF.WAKE.x,
      safeY: SF.WAKE.y,
      px: SF.WAKE.x,
      py: SF.WAKE.y,
      fx: 1,
      fy: 0,
      r: 12,
      hp: 40,
      maxHp: 40,
      xp: 0,
      level: 1,
      atk: 12,
      shardstep: false,
      iFrames: 0,
      hurt: 0,
      attackCd: 0,
      dashCd: 0,
      dashT: 0,
      dvx: 0,
      dvy: 0,
      dashId: 0,
      hx: 0,
      hy: 0,
      fall: 0,
      swinging: false,
      swingT: 0,
      swingId: 0,
      trail: 0,
      grapple: false,
      grappleCd: 0,
      grappleT: 0,
      gtx: 0,
      gty: 0,
      grapplePull: "",
      grappleFoe: null,
      grappleMax: 0
    },
    enemies: enemies,
    projectiles: [],
    pools: [],
    voyage: null,
    pendingTalk: null,
    particles: [],
    floaters: [],
    ghosts: [],
    ring: null,
    toasts: [],
    toast: null,
    banners: [],
    banner: null,
    dialogue: null,
    hitstop: 0,
    shake: 0,
    camX: 190,
    camY: -170,
    cut: null,
    savedFlash: 0,
    encounterGrace: 10,
    stepAcc: 0,
    zoneId: null
  };
};

SF.pushToast = function (text, ttl) {
  var s = SF.state;
  if (!s) return;
  if (s.toast && s.toast.text === text) return;
  if (s.toasts.some(function (t) { return t.text === text; })) return;
  s.toasts.push({ text: text, ttl: ttl || 3.1 });
};

SF.pushBanner = function (title, sub, ttl) {
  var s = SF.state;
  if (!s) return;
  s.banners.push({ title: title, sub: sub || "", ttl: ttl || 3.3 });
};

SF.addShake = function (amount, cap) {
  var s = SF.state;
  if (!s || (SF.calm && SF.calm())) return;
  s.shake = Math.min(cap || 2.2, (s.shake || 0) + amount);
};

SF.noteHint = function (key) {
  var s = SF.state;
  if (!s || !s.hints || s.hints[key]) return;
  s.hints[key] = true;
  SF.saveGame({ silent: true });
};

SF.spawnParticle = function (x, y, color, speed, life, size) {
  var s = SF.state;
  if (!s) return;
  if (s.particles.length > 140) s.particles.shift();
  var a = Math.random() * Math.PI * 2;
  var sp = speed * (0.4 + Math.random() * 0.8);
  s.particles.push({
    x: x,
    y: y,
    vx: Math.cos(a) * sp,
    vy: Math.sin(a) * sp - 8,
    life: life,
    max: life,
    color: color,
    size: size || 3
  });
};

SF.spawnAsh = function (x, y) {
  var colors = ["#efe6dc", "#c8beb4", "#8d847c", "#5e5854", "#e07a3a"];
  SF.spawnParticle(x, y, colors[(Math.random() * colors.length) | 0], 16, 0.75 + Math.random() * 0.45, 1.2 + Math.random() * 1.6);
  var s = SF.state;
  var part = s && s.particles[s.particles.length - 1];
  if (!part) return;
  part.drift = 1;
  part.px = 1;
  part.size = 1 + ((Math.random() * 3) | 0);
  part.vx = (Math.random() - 0.5) * 22;
  part.vy = -14 - Math.random() * 28;
};

SF.burst = function (x, y, color, n, speed) {
  var i;
  for (i = 0; i < n; i++) SF.spawnParticle(x, y, color, speed || 70, 0.35 + Math.random() * 0.35, 2 + Math.random() * 3);
};

SF.floater = function (x, y, text, color) {
  var s = SF.state;
  if (!s) return;
  if (s.floaters.length > 14) s.floaters.shift();
  s.floaters.push({ x: x, y: y, text: text, color: color || "#fff6d8", life: 0.75 });
};

SF.levelFor = function (xp) {
  var lv = 1;
  var i;
  for (i = 1; i < SF.XP_NEED.length; i++) if (xp >= SF.XP_NEED[i]) lv = i + 1;
  return lv;
};

SF.checkLevel = function () {
  var s = SF.state;
  var p = s.player;
  while (p.level < SF.levelFor(p.xp) && SF.LEVELS[p.level + 1]) {
    p.level += 1;
    var bonus = SF.LEVELS[p.level];
    p.maxHp += bonus.hp;
    p.atk += bonus.atk;
    p.hp = p.maxHp;
    SF.pushBanner(bonus.title, bonus.sub);
    SF.emit("level");
    SF.burst(p.x, p.y, "#fff1b0", 16, 80);
  }
};

SF.activePickups = function () {
  var s = SF.state;
  var list = [];
  var sense = !!(s.flags && s.flags.shard_sense);
  SF.PICKUPS.forEach(function (p) {
    if (s.picked[p.id]) return;
    if (p.kind === "shard" && !sense) return;
    if (p.kind === "cog" && !(s.flags && s.flags.cogsStarted)) return;
    if (p.secret && SF.secretVisible && !SF.secretVisible(p)) return;
    list.push(p);
  });
  Object.keys(s.drops).forEach(function (id) {
    if (!s.picked[id]) list.push({ id: id, kind: "shard", x: s.drops[id].x, y: s.drops[id].y, dropped: true });
  });
  return list;
};

SF.secretVisible = function (pickup) {
  if (!pickup.secret) return true;
  var s = SF.state;
  if (!s || !s.flags) return false;
  if (pickup.id === "shard-alcove") return !!s.flags.kestrelHint;
  if (pickup.id === "bloom-hollow") return !!(s.discovered && s.discovered.hollow);
  return true;
};

SF.damageEnemy = function (e, dmg, kx, ky, kb) {
  if (!e.alive || e.dying > 0 || e.dormant) return;
  var s = SF.state;
  var kind = SF.KINDS[e.kind];
  var resist = e.kind === "brumekin" ? 0.55 : 1;
  e.hp -= dmg;
  e.hurt = 0.14;
  e.hx = kx * 280 * (kb == null ? 1 : kb) * resist;
  e.hy = ky * 280 * (kb == null ? 1 : kb) * resist;
  e.stun = Math.max(e.stun, 0.08);
  SF.floater(e.x, e.y - e.r - 4, String(dmg), "#fff6d8");
  SF.burst(e.x, e.y, e.kind === "choirling" ? "#e2c6ff" : "#d7fff8", 7, 60);
  s.hitstop = 0.04;
  SF.addShake(1.2, 2.2);
  SF.emit("hit");
  if (e.hp <= 0) SF.killEnemy(e);
  else if (kind) e.ai = e.ai === "charge" ? e.ai : e.ai;
};

SF.killEnemy = function (e) {
  if (!e.alive) return;
  var s = SF.state;
  var kind = SF.KINDS[e.kind];
  e.alive = false;
  e.dying = 0.45;
  e.hp = 0;
  s.stats.foes += 1;
  var dropX = e.x;
  var dropY = e.y;
  if (!SF.walkable(dropX, dropY)) {
    dropX = e.homeX;
    dropY = e.homeY;
  }
  if (kind.drops) {
    var id = "drop-" + e.id;
    if (!s.picked[id] && !s.drops[id]) s.drops[id] = { x: dropX, y: dropY };
  }
  s.player.xp += kind.xp;
  SF.floater(e.x, e.y - 18, "+" + kind.xp + " xp", "#c8f7ff");
  SF.burst(e.x, e.y, "#ffe9a8", 14, 90);
  SF.checkLevel();
  SF.saveGame({ silent: true });
  if (e.kind === "maw" && SF.onMawDead) SF.onMawDead();
};

SF.hurtPlayer = function (dmg, nx, ny, softLine) {
  var s = SF.state;
  var p = s.player;
  if (p.iFrames > 0 || s.mode !== "play") return;
  p.hp -= dmg;
  p.iFrames = 0.75;
  p.hurt = 0.28;
  if (nx || ny) {
    p.hx = nx * 260;
    p.hy = ny * 260;
  }
  SF.addShake(1.4, 2.2);
  SF.emit("hurt");
  SF.floater(p.x, p.y - 20, String(dmg), "#ffb4c4");
  if (p.hp <= 0) {
    p.hp = Math.max(1, Math.ceil(p.maxHp * 0.55));
    p.iFrames = 1.5;
    p.hx = 0;
    p.hy = 0;
    p.fall = 0;
    p.dashT = 0;
    p.grappleT = 0;
    if (SF.placeAtCheckpoint) SF.placeAtCheckpoint(s);
    else {
      p.x = SF.WAKE.x;
      p.y = SF.WAKE.y;
      p.safeX = p.x;
      p.safeY = p.y;
    }
    if ((s.quest === "maw" || (s.flags && s.flags.mawFight)) && SF.resetMaw) SF.resetMaw();
    var nearWake = SF.islandId === "emberhold" && SF.WAKE && SF.dist(p.x, p.y, SF.WAKE.x, SF.WAKE.y) < 72;
    var spotKind = s.checkpoint && s.checkpoint.kind;
    if (nearWake) SF.pushToast("The shard flares and hauls you back to the stones.");
    else if (spotKind === "post") SF.pushToast("The vault stone pulls you back.");
    else SF.pushToast("Back to the last lamp.");
    SF.emit("death");
    SF.saveGame({ silent: true });
  } else if (softLine) {
    SF.pushToast(softLine);
  }
};

SF.rescue = function (p) {
  p.x = p.safeX;
  p.y = p.safeY;
  p.fall = 0;
  p.dashT = 0;
  p.hx = 0;
  p.hy = 0;
  SF.burst(p.x, p.y, "#d9c7ff", 10, 40);
  if (p.iFrames <= 0) SF.hurtPlayer(4, 0, 0, "The gap is too wide. Try Dash.");
};

SF.startSwing = function (p) {
  if (p.attackCd > 0 || p.swinging || p.dashT > 0) return false;
  p.swinging = true;
  p.swingT = 0;
  p.swingId += 1;
  p.attackCd = 0.4;
  var lx = p.x + p.fx * 12;
  var ly = p.y + p.fy * 12;
  if (SF.walkable(lx, ly)) {
    p.x = lx;
    p.y = ly;
  }
  SF.emit("swing");
  SF.noteHint("strike");
  return true;
};

SF.applySwing = function (p) {
  var s = SF.state;
  var reach = SF.STRIKE_REACH;
  s.enemies.forEach(function (e) {
    if (!e.alive || e.dying > 0 || e.lastSwing === p.swingId) return;
    var dx = e.x - p.x;
    var dy = e.y - p.y;
    var d = Math.hypot(dx, dy) || 0.0001;
    if (d > reach + e.r) return;
    var dot = (dx * p.fx + dy * p.fy) / d;
    if (dot < SF.STRIKE_ARC) return;
    e.lastSwing = p.swingId;
    SF.damageEnemy(e, p.atk, p.fx, p.fy, 1);
  });
};

SF.startDash = function (p) {
  if (p.dashCd > 0 || p.dashT > 0) return false;
  var speed = p.shardstep ? SF.DASH_SPEED_PLUS : SF.DASH_SPEED;
  if (!p.shardstep && SF.state && SF.state.upgrades && SF.state.upgrades.longstep) speed *= 1.2;
  p.dashT = SF.DASH_TIME;
  p.dvx = p.fx * speed;
  p.dvy = p.fy * speed;
  p.dashCd = p.shardstep ? SF.DASH_CD_PLUS : SF.DASH_CD;
  p.dashId += 1;
  p.iFrames = Math.max(p.iFrames, SF.DASH_TIME);
  p.swinging = false;
  p.trail = 0;
  SF.emit("dash");
  return true;
};

SF.dashSing = function (p) {
  if (!p.shardstep) return;
  var dmg = (SF.state && SF.state.upgrades && SF.state.upgrades.singe) ? 16 : 8;
  SF.state.enemies.forEach(function (e) {
    if (!e.alive || e.dying > 0 || e.dashed === p.dashId) return;
    if (SF.dist(p.x, p.y, e.x, e.y) > e.r + 16) return;
    e.dashed = p.dashId;
    SF.damageEnemy(e, dmg, p.fx, p.fy, 0.65);
  });
};

SF.releaseHolds = function () {
  if (!SF.inputState) return;
  SF.inputState.attack = false;
  SF.inputState.attackKey = false;
  SF.inputState.dashEdge = false;
  SF.inputState.grappleHold = false;
  SF.inputState.grappleRelease = false;
};

SF.onDialogueEvent("meet_maren", function () {
  var s = SF.state;
  s.flags.metMaren = true;
  s.flags.shard_sense = true;
  if (s.quest === "awaken") s.quest = "gather";
  s.player.hp = s.player.maxHp;
  SF.saveGame({ silent: true });
});

SF.onDialogueEvent("maren_mend", function () {
  var s = SF.state;
  s.player.hp = s.player.maxHp;
  SF.saveGame({ silent: true });
});

SF.onDialogueEvent("quest_lamp_done", function () {
  var s = SF.state;
  s.flags.metMaren = true;
  s.flags.marenLampTalk = true;
  s.player.hp = s.player.maxHp;
  SF.saveGame({ silent: true });
});

SF.onDialogueEvent("kestrel_hint", function () {
  var s = SF.state;
  s.flags.metKestrel = true;
  s.flags.kestrelHint = true;
  SF.pushToast("Kestrel's note: the span is too wide to walk. Dash from the lip.");
  SF.saveGame({ silent: true });
});

SF.onDialogueEvent("open_sail_menu", function () {
  var s = SF.state;
  var first = !s.flags.kestrelAfter;
  s.flags.metKestrel = true;
  s.flags.kestrelHint = true;
  s.flags.kestrelAfter = true;
  if (s.quest === "awaken" || s.quest === "gather" || s.quest === "stirring") s.quest = "hooked";
  if (first) SF.pushToast("The route to Cinderveil is real. Hold the rail when the wind takes.");
  s.flags.sailUnlocked = true;
  SF.saveGame({ silent: true });
  if (SF.openSailMenu) SF.openSailMenu();
});

SF.onDialogueEvent("meet_cantor", function () {
  var s = SF.state;
  s.flags.metCantor = true;
  s.flags.met_cantor = true;
  s.flags.heardChoir = true;
  s.discovered.hollow = true;
  SF.saveGame({ silent: true });
});

SF.interactRank = function (kind) {
  if (kind === "npc") return 0;
  if (kind === "chest") return 1;
  if (kind === "text") return 3;
  return 2;
};

SF.TALK_RANGE = 54;

SF.nearestInteract = function (range) {
  var s = SF.state;
  var p = s.player;
  var best = null;
  var limit = range || SF.TALK_RANGE || 54;
  function consider(kind, ref, x, y) {
    var d = SF.dist(p.x, p.y, x, y);
    if (d >= limit) return;
    var dx = x - p.x;
    var dy = y - p.y;
    var face = d < 12 || ((dx * (p.fx || 0)) + (dy * (p.fy || 0))) / (d || 1) > 0.35;
    var rank = SF.interactRank(kind);
    var cand = { kind: kind, ref: ref, d: d, x: x, y: y, rank: rank, face: face };
    if (!best || rank < best.rank || (rank === best.rank && face && !best.face) || (rank === best.rank && face === best.face && d < best.d)) {
      best = cand;
    }
  }
  SF.NPCS.forEach(function (n) {
    if (SF.npcHidden && SF.npcHidden(n)) return;
    var nx = null;
    var ny = null;
    if (n.id === "cantor" && SF.cantorWorldPos) {
      var spot = SF.cantorWorldPos();
      if (spot) {
        nx = spot.x;
        ny = spot.y;
      }
    }
    if (nx == null) {
      var feet = SF.actorFeet ? SF.actorFeet(n) : null;
      nx = feet ? feet.x : n.x;
      ny = feet ? feet.y : n.y;
    }
    consider("npc", n, nx, ny);
  });
  SF.TEXTS.forEach(function (t) { consider("text", t, t.x, t.y); });
  if (SF.EXTRAS) {
    SF.EXTRAS.forEach(function (extra) { consider(extra.kind, extra, extra.x, extra.y); });
  }
  consider("lamp", SF.LAMP, SF.LAMP.x, SF.LAMP.y);
  return best;
};

SF.actionFor = function (s, near) {
  if (!near) return { label: "Talk", name: "", prompt: "" };
  if (near.kind === "lamp") {
    if (SF.islandId === "cinderveil") {
      var need = SF.CINDER_SHARDS || 3;
      var ready = s.flags.mawDead && !s.flags.cinderLit && s.shardsHeld >= need;
      var coreLabel = ready ? "Place shards" : "Inspect";
      return { label: coreLabel, name: "the lamp", prompt: coreLabel + " — the lamp" };
    }
    var place = !s.flags.lampLit && s.shardsHeld >= SF.QUEST_SHARDS;
    var label = place ? "Place shards" : "Inspect";
    return { label: label, name: "the great lamp", prompt: label + " — the great lamp" };
  }
  if (near.kind === "bench") {
    if (s.player && s.player.grapple) return { label: "Hand", name: near.ref.name, prompt: "Hand — " + near.ref.name };
    return { label: "Inspect", name: near.ref.name, prompt: "Inspect — " + near.ref.name };
  }
  if (near.kind === "checkpoint") {
    return { label: "Rest", name: near.ref.name, prompt: "Rest — " + near.ref.name };
  }
  if (near.kind === "text") {
    return { label: "Inspect", name: near.ref.speaker, prompt: "Inspect — " + near.ref.speaker };
  }
  return { label: "Talk", name: near.ref.name, prompt: "Talk — " + near.ref.name };
};

SF.SHARD_GLINT = 96;

SF.shardGoal = function (s) {
  if (!s || !SF.activePickups) return null;
  var best = null;
  var bestD = Infinity;
  SF.activePickups().forEach(function (item) {
    if (item.kind !== "shard") return;
    if (SF.shardReachable && !SF.shardReachable(item)) return;
    var d = SF.dist(s.player.x, s.player.y, item.x, item.y);
    if (d < bestD) {
      bestD = d;
      best = item;
    }
  });
  if (best) {
    return {
      x: best.x,
      y: best.y,
      kind: "shard",
      precise: bestD <= (SF.SHARD_GLINT || 96)
    };
  }
  if (SF.carrierAim) {
    var zone = SF.carrierAim(s);
    if (zone) return zone;
  }
  return null;
};

SF.objectivePoint = function (s) {
  if (!s || s.mode === "title") return null;
  if (s.quest === "awaken") {
    var maren = SF.NPCS[0];
    return { x: maren.x, y: maren.y };
  }
  if (s.quest === "gather") {
    if ((s.shardsHeld || 0) >= SF.QUEST_SHARDS) return { x: SF.LAMP.x, y: SF.LAMP.y };
    return SF.shardGoal(s);
  }
  if (s.quest === "stirring") {
    var kestrel = SF.NPCS[1];
    return { x: kestrel.x, y: kestrel.y };
  }
  return null;
};

SF.coachLine = function (s) {
  if (!s || s.mode !== "play") return "";
  var h = s.hints || {};
  var p = s.player;
  if (!h.moved) return "Move: drag the stick, or press WASD.";
  var near = SF.nearestInteract();
  if (near && !h.talk) return "Press " + SF.actionFor(s, near).label + ", or E.";
  var span = SF.circle && SF.circle("span");
  var nearSpan = span && SF.islandId === "emberhold" && SF.dist(p.x, p.y, span.x, span.y) < span.r + 90;
  if (!near && nearSpan && !h.span) {
    return h.dash
      ? "This gap is too wide to walk. Dash from the lip."
      : "Dash crosses gaps — Shift or K. Do not walk the span.";
  }
  if (!near && !h.dash && s.playTime < 40) return "Dash crosses gaps — Shift or K.";
  return "";
};

SF.tryLamp = function () {
  var s = SF.state;
  if (SF.islandId === "cinderveil") {
    var need = SF.CINDER_SHARDS || 3;
    if (s.flags.mawDead && !s.flags.cinderLit && s.shardsHeld >= need) SF.startDialogue("cinderveil.lamp.relit");
    else SF.startDialogue("inspect.cinder_lamp");
    if (s.flags.mawDead && !s.flags.cinderLit && s.shardsHeld < need) {
      SF.pushToast("The lamp needs " + need + ". You have " + s.shardsHeld + ".", 2.2);
    }
    return;
  }
  if (!s.flags.lampLit && s.shardsHeld < SF.QUEST_SHARDS && s.quest === "gather") {
    SF.pushToast("The lamp needs " + SF.QUEST_SHARDS + ". You have " + s.shardsHeld + ".", 2.2);
  }
  if (!s.flags.lampLit && s.shardsHeld >= SF.QUEST_SHARDS) {
    SF.beginCutscene();
    return;
  }
  var id = SF.emberholdLampNode ? SF.emberholdLampNode(s) : "inspect.lamp_cold";
  SF.startDialogue(id);
};

SF.tryInteract = function () {
  var s = SF.state;
  if (s.mode === "cutscene") {
    SF.skipCutscene();
    return;
  }
  if (s.mode !== "play") return;
  var near = SF.nearestInteract();
  if (!near) {
    var far = SF.nearestInteract(120);
    if (far) {
      var act = SF.actionFor(s, far);
      SF.pushToast("Walk closer to " + act.name + ". Then press " + act.label + ".", 2.4);
    } else SF.pushToast("Nothing here. Follow the gold marker.", 1.8);
    return;
  }
  SF.noteHint("talk");
  if (near.kind === "lamp") {
    SF.tryLamp();
    return;
  }
  if (near.kind === "bench") {
    if (s.player.grapple && SF.openHand) SF.openHand();
    else if (SF.startDialogue) SF.startDialogue(near.ref.node || "inspect.tamsin_bench");
    return;
  }
  if (near.kind === "checkpoint") {
    if (SF.restAtPost) SF.restAtPost(near.ref.x, near.ref.y);
    else if (SF.setCheckpoint) SF.setCheckpoint(near.ref.x, near.ref.y);
    return;
  }
  if (near.kind === "npc") {
    if (SF.islandId === "cinderveil" && near.ref.id === "kestrel" && s.flags.metCinderKestrel && SF.openSailMenu) {
      if (s.flags.cantor_choice && !s.flags.epilogueHeard && SF.playEpilogue) {
        SF.playEpilogue();
        if (s.mode === "dialogue") return;
      }
      SF.openSailMenu();
      return;
    }
    var nodeId = SF.routeDialogue ? SF.routeDialogue(near.ref.id, s) : "";
    if (!nodeId) return;
    SF.startDialogue(nodeId);
    return;
  }
  if (near.ref && near.ref.node === "cinderveil.maw.prefight") {
    if (!s.flags.vaultOpen) {
      SF.pushToast("Ilsa has not opened the gap.", 1.8);
      return;
    }
    if (s.flags.mawDead) {
      SF.startDialogue("cinderveil.maw.defeated");
      return;
    }
  }
  SF.startDialogue(near.ref.node || ("inspect." + near.ref.id));
};

SF.beginCutscene = function () {
  var s = SF.state;
  SF.releaseHolds();
  s.mode = "cutscene";
  s.cut = { t: 0, applied: false, lock: 0.4 };
  s.player.dashT = 0;
  s.player.swinging = false;
};

SF.applyCutscene = function () {
  var s = SF.state;
  var cut = s.cut;
  if (!cut || cut.applied) return;
  cut.applied = true;
  s.flags.lampLit = true;
  s.shardsHeld = Math.max(0, s.shardsHeld - SF.QUEST_SHARDS);
  s.player.shardstep = true;
  s.flags.shardstep = true;
  if (s.quest === "gather" || s.quest === "awaken") s.quest = "stirring";
  SF.pushBanner("Shardstep", "Your next dash carries you twice as far.");
  s.ring = { x: SF.LAMP.x, y: SF.LAMP.y, life: 0.9, max: 480 };
  SF.burst(SF.LAMP.x, SF.LAMP.y, "#ffe39a", 26, 110);
  s.enemies.forEach(function (e) {
    if (!e.alive || e.dying > 0) return;
    if (e.kind === "wisp") {
      SF.killEnemy(e);
      return;
    }
    var dmg = Math.max(1, Math.round(e.maxHp * 0.4));
    e.hp -= dmg;
    e.hurt = 0.3;
    e.stun = 1.2;
    SF.floater(e.x, e.y - 10, String(dmg), "#ffe39a");
    if (e.hp <= 0) SF.killEnemy(e);
  });
  SF.emit("lamp");
  if (SF.rememberCheckpoint && SF.LAMP) SF.rememberCheckpoint(SF.LAMP.x, SF.LAMP.y, { quiet: true, kind: "lamp" });
  SF.saveGame({ silent: true });
};

SF.skipCutscene = function () {
  var s = SF.state;
  if (!s.cut || s.cut.lock > 0) return;
  SF.applyCutscene();
  s.cut.t = 3.4;
  s.mode = "play";
  s.cut = null;
};

SF.collectPickup = function (item) {
  var s = SF.state;
  var p = s.player;
  if (s.picked[item.id]) return;
  s.picked[item.id] = true;
  if (item.kind === "shard") {
    s.shardsHeld += 1;
    s.stats.shardsEver += 1;
    SF.floater(item.x, item.y, "+ shard", "#b9fbff");
    SF.burst(item.x, item.y, "#9af6ff", 10, 50);
    SF.emit("pickup");
    var got = s.shardsHeld;
    var onCinder = SF.islandId === "cinderveil";
    var need = onCinder ? (SF.CINDER_SHARDS || 3) : SF.QUEST_SHARDS;
    var sub = onCinder ? ("The ridge lamp needs " + need + ".") : ("The lamp on the hill needs " + need + ".");
    if (!onCinder && s.quest === "awaken") sub = "Talk to Old Maren, up the hill.";
    else if (got >= need) sub = onCinder ? "Bring them to the ridge lamp." : "Bring them to the lamp. Press Place shards.";
    SF.pushBanner("Sky-shard " + got + " of " + need, sub, 2.6);
  } else if (item.kind === "cog") {
    s.cogs = (s.cogs || 0) + 1;
    SF.floater(item.x, item.y, "+ cog", "#ffb15a");
    SF.burst(item.x, item.y, "#ffb15a", 8, 40);
    SF.emit("pickup");
    SF.pushBanner("Cog " + s.cogs + " of 3", s.cogs >= 3 ? "Bring them back to Tamsin." : "The Ashfields still hold more.", 2.4);
  } else {
    var before = p.hp;
    if (before >= p.maxHp) {
      p.maxHp += 6;
      p.hp = p.maxHp;
      SF.pushToast("The blossom settles into the shard. You feel steadier.");
    } else {
      p.hp = Math.min(p.maxHp, p.hp + 28);
      SF.pushToast("Warmth spills through your ribs.");
    }
    SF.floater(item.x, item.y, "+ bloom", "#ffd0e8");
    SF.burst(item.x, item.y, "#ffd0e8", 10, 40);
    SF.emit("pickup");
  }
  SF.saveGame({ silent: true });
};

SF.updatePickups = function () {
  var p = SF.state.player;
  SF.activePickups().forEach(function (item) {
    if (SF.dist(p.x, p.y, item.x, item.y) < 26) SF.collectPickup(item);
  });
};

SF.steer = function (e, tx, ty, speed, dt) {
  var dx = tx - e.x;
  var dy = ty - e.y;
  var d = Math.hypot(dx, dy) || 1;
  var nx = e.x + (dx / d) * speed * dt + e.hx * dt;
  var ny = e.y + (dy / d) * speed * dt + e.hy * dt;
  if (SF.walkable(nx, ny)) {
    e.x = nx;
    e.y = ny;
  } else if (SF.walkable(nx, e.y)) {
    e.x = nx;
  } else if (SF.walkable(e.x, ny)) {
    e.y = ny;
  }
  e.hx *= Math.exp(-10 * dt);
  e.hy *= Math.exp(-10 * dt);
};

SF.updateEnemy = function (e, dt) {
  var s = SF.state;
  var p = s.player;
  var kind = SF.KINDS[e.kind];
  if (e.dying > 0) {
    e.dying -= dt;
    return;
  }
  if (!e.alive) return;
  if (e.dormant) return;
  if (e.kind === "maw") {
    if (SF.updateMaw) SF.updateMaw(e, dt);
    return;
  }
  e.hurt = Math.max(0, e.hurt - dt);
  e.hitCd = Math.max(0, e.hitCd - dt);
  e.stun = Math.max(0, e.stun - dt);
  e.shotCd = Math.max(0, e.shotCd - dt);
  if (e.stun > 0) {
    e.x += e.hx * dt;
    e.y += e.hy * dt;
    e.hx *= Math.exp(-8 * dt);
    e.hy *= Math.exp(-8 * dt);
    return;
  }
  var dx = p.x - e.x;
  var dy = p.y - e.y;
  var d = Math.hypot(dx, dy) || 1;
  var aggro = d < kind.aggro && s.mode === "play";
  var homeD = SF.dist(e.x, e.y, e.homeX, e.homeY);

  var brute = e.kind === "brumekin" || e.kind === "cinderbrute";
  var ranged = e.kind === "choirling" || e.kind === "sootwing";
  if (brute) {
    if (e.ai === "wind") {
      e.wind -= dt;
      if (e.wind <= 0) {
        e.ai = "charge";
        e.charge = 0.3;
      }
    } else if (e.ai === "charge") {
      var step = Math.min(dt, e.charge);
      e.charge -= step;
      var cx = e.x + e.aimX * 300 * step;
      var cy = e.y + e.aimY * 300 * step;
      if (SF.walkable(cx, cy)) {
        e.x = cx;
        e.y = cy;
      } else e.charge = 0;
      if (e.charge <= 0) {
        e.ai = "recover";
        e.recover = 0.55;
      }
    } else if (e.ai === "recover") {
      e.recover -= dt;
      if (e.recover <= 0) e.ai = "idle";
    } else if (aggro && homeD < kind.leash) {
      if (d < 78 && e.shotCd <= 0 && homeD < kind.leash) {
        e.ai = "wind";
        e.wind = 0.5;
        e.shotCd = 1.6;
        e.aimX = dx / d;
        e.aimY = dy / d;
      } else if (d > 36) {
        SF.steer(e, p.x, p.y, kind.speed, dt);
      }
    } else {
      SF.steer(e, e.homeX, e.homeY, kind.speed * 0.7, dt);
    }
  } else if (ranged) {
    if (e.ai === "wind") {
      e.wind -= dt;
      if (e.wind <= 0) {
        e.ai = "idle";
        s.projectiles.push({
          x: e.x,
          y: e.y,
          vx: e.aimX * 165,
          vy: e.aimY * 165,
          life: 1.7,
          r: 5,
          dmg: kind.dmg
        });
      }
    } else if (aggro && homeD < kind.leash) {
      var desired = 110;
      if (d < desired - 20) SF.steer(e, e.x - dx, e.y - dy, kind.speed, dt);
      else if (d > desired + 30) SF.steer(e, p.x, p.y, kind.speed * 0.8, dt);
      if (e.shotCd <= 0 && d < 210) {
        e.ai = "wind";
        e.wind = 0.42;
        e.shotCd = 1.7;
        e.aimX = dx / d;
        e.aimY = dy / d;
      }
    } else {
      var ang = SF.anim * 0.5 + e.phase;
      SF.steer(e, e.homeX + Math.cos(ang) * 16, e.homeY + Math.sin(ang) * 16, kind.speed * 0.5, dt);
    }
  } else if (aggro && homeD < kind.leash) {
    SF.steer(e, p.x, p.y, kind.speed, dt);
  } else {
    var orbit = SF.anim * 0.7 + e.phase;
    SF.steer(e, e.homeX + Math.cos(orbit) * 22, e.homeY + Math.sin(orbit) * 18, kind.speed * 0.45, dt);
  }

  if (s.mode === "play" && e.hitCd <= 0 && SF.dist(e.x, e.y, p.x, p.y) < e.r + p.r - 1) {
    var nd = SF.dist(e.x, e.y, p.x, p.y) || 1;
    SF.hurtPlayer(kind.dmg, (p.x - e.x) / nd, (p.y - e.y) / nd);
    e.hitCd = 0.85;
  }
};

SF.separateEnemies = function () {
  var list = SF.state.enemies.filter(function (e) { return e.alive && e.dying <= 0 && !e.dormant; });
  var i, j, a, b, dx, dy, d, push;
  for (i = 0; i < list.length; i++) {
    for (j = i + 1; j < list.length; j++) {
      a = list[i];
      b = list[j];
      dx = b.x - a.x;
      dy = b.y - a.y;
      d = Math.hypot(dx, dy) || 0.001;
      push = a.r + b.r - d;
      if (push > 0) {
        dx /= d;
        dy /= d;
        if (SF.walkable(a.x - dx * push * 0.5, a.y - dy * push * 0.5)) {
          a.x -= dx * push * 0.5;
          a.y -= dy * push * 0.5;
        }
        if (SF.walkable(b.x + dx * push * 0.5, b.y + dy * push * 0.5)) {
          b.x += dx * push * 0.5;
          b.y += dy * push * 0.5;
        }
      }
    }
  }
};

SF.updateWorld = function (dt, ai) {
  var s = SF.state;
  if (ai) {
    s.enemies.forEach(function (e) { SF.updateEnemy(e, dt); });
    SF.separateEnemies();
  } else {
    s.enemies.forEach(function (e) {
      if (e.dying > 0) e.dying -= dt;
      e.hurt = Math.max(0, e.hurt - dt);
    });
  }
  s.projectiles.forEach(function (shot) {
    shot.life -= dt;
    shot.x += shot.vx * dt;
    shot.y += shot.vy * dt;
    if (!SF.walkable(shot.x, shot.y)) shot.life = 0;
    var p = s.player;
    if (s.mode === "play" && shot.life > 0 && SF.dist(shot.x, shot.y, p.x, p.y) < shot.r + p.r) {
      var nd = SF.dist(shot.x, shot.y, p.x, p.y) || 1;
      SF.hurtPlayer(shot.dmg, (p.x - shot.x) / nd, (p.y - shot.y) / nd);
      shot.life = 0;
      SF.burst(shot.x, shot.y, "#e2c6ff", 6, 40);
    }
  });
  s.projectiles = s.projectiles.filter(function (shot) { return shot.life > 0; });
  if (SF.updatePools) SF.updatePools(dt);
  SF.updateFx(dt);
};

SF.updateFx = function (dt) {
  var s = SF.state;
  s.particles.forEach(function (part) {
    part.life -= dt;
    part.x += part.vx * dt;
    part.y += part.vy * dt;
    if (part.drift) {
      part.vy -= 8 * dt;
      part.vx *= 1 - Math.min(1, 0.35 * dt);
    } else part.vy += 12 * dt;
  });
  s.particles = s.particles.filter(function (part) { return part.life > 0; });
  s.floaters.forEach(function (f) {
    f.life -= dt;
    f.y -= 18 * dt;
  });
  s.floaters = s.floaters.filter(function (f) { return f.life > 0; });
  s.ghosts.forEach(function (g) { g.a -= dt * 1.6; });
  s.ghosts = s.ghosts.filter(function (g) { return g.a > 0; });
  if (s.ring) {
    s.ring.life -= dt;
    if (s.ring.life <= 0) s.ring = null;
  }
};

SF.updatePlayer = function (dt) {
  var s = SF.state;
  var p = s.player;
  var move = (SF.readMove || function () { return { x: 0, y: 0 }; })();
  p.attackCd = Math.max(0, p.attackCd - dt);
  p.dashCd = Math.max(0, p.dashCd - dt);
  p.grappleCd = Math.max(0, (p.grappleCd || 0) - dt);
  p.iFrames = Math.max(0, p.iFrames - dt);
  p.hurt = Math.max(0, p.hurt - dt);
  p.px = p.x;
  p.py = p.y;

  if ((SF.consumeDash || function () { return false; })()) {
    if (SF.startDash(p)) SF.noteHint("dash");
    else if (p.dashCd > 0.08) SF.pushToast("Dash is still cooling.", 1.2);
  }
  if ((SF.consumeAttack || function () { return false; })()) SF.startSwing(p);
  if ((SF.consumeGrapple || function () { return false; })() && SF.fireGrapple) SF.fireGrapple(p, move);
  if ((SF.consumeInteract || function () { return false; })()) {
    SF.tryInteract();
    if (s.mode !== "play") return;
  }

  if (p.swinging) {
    p.swingT += dt;
    if (p.swingT >= 0.04 && p.swingT <= 0.15) SF.applySwing(p);
    if (p.swingT >= 0.2) p.swinging = false;
  }

  var hooked = p.grappleT > 0 && SF.stepGrapple && SF.stepGrapple(p, dt);
  var aiming = !!(SF.inputState && SF.inputState.grappleHold && p.grapple && s.mode === "play");
  if (!hooked && p.dashT > 0) {
    var step = Math.min(dt, p.dashT);
    var dashX = p.x + p.dvx * step;
    var dashY = p.y + p.dvy * step;
    if (SF.occupied && SF.occupied(dashX, dashY, p.x, p.y)) {
      p.dashT = 0;
    } else {
    p.dashT -= step;
    p.x = dashX;
    p.y = dashY;
    p.trail -= step;
    if (p.trail <= 0) {
      p.trail = 0.025;
      SF.spawnParticle(p.x, p.y, p.shardstep ? "#fff1b8" : "#9af6ff", 20, 0.28, 3);
      if (s.ghosts.length < 7) s.ghosts.push({ x: p.x, y: p.y, fx: p.fx, fy: p.fy, a: 0.45 });
    }
    SF.dashSing(p);
    }
  } else if (!hooked) {
    var mag = Math.hypot(move.x, move.y);
    if (!aiming && mag > 0.12) {
      var nx = move.x / mag;
      var ny = move.y / mag;
      if (SF.guideRope) {
        var guided = SF.guideRope(p.x, p.y, nx, ny);
        if (guided) { nx = guided.x; ny = guided.y; }
      }
      var sp = 150 * Math.min(1, mag);
      if (p.swinging && p.swingT < 0.16) sp *= 0.55;
      p.x += nx * sp * dt;
      p.y += ny * sp * dt;
      p.fx = nx;
      p.fy = ny;
    }
    p.x += p.hx * dt;
    p.y += p.hy * dt;
    p.hx *= Math.exp(-9 * dt);
    p.hy *= Math.exp(-9 * dt);
    var free = SF.footFree || function (x, y) { return SF.walkable(x, y); };
    if (!free(p.x, p.y, p.px, p.py)) {
      if (free(p.x, p.py, p.px, p.py)) p.y = p.py;
      else if (free(p.px, p.y, p.px, p.py)) p.x = p.px;
      else {
        p.x = p.px;
        p.y = p.py;
      }
    }
  }

  if (SF.walkable(p.x, p.y)) {
    p.fall = 0;
    p.safeX = p.x;
    p.safeY = p.y;
  } else if (p.dashT <= 0 && (p.grappleT || 0) <= 0) {
    p.fall += dt;
    if (p.fall > 0.24) SF.rescue(p);
  }

  var zone = SF.zoneAt(p.x, p.y);
  if (zone.id === "cinder" || zone.id === "alcove" || zone.id === "gap") {
    s.discovered.cinder = true;
    SF.noteHint("span");
  }
  if (zone.id === "hollow") s.discovered.hollow = true;
  if (zone.id === "scar" && s.flags.metMaren && !s.flags.scarBark && s.mode === "play" && SF.startDialogue) {
    s.flags.scarBark = true;
    SF.startDialogue("bark.maren.scar");
  }
  if (SF.noteZone) SF.noteZone(zone);
  if (!s.hints.moved && SF.dist(p.x, p.y, SF.WAKE.x, SF.WAKE.y) > 28) SF.noteHint("moved");
  if (SF.noteTravel && s.mode === "play") SF.noteTravel(s, p.px, p.py, p.x, p.y, zone);
  if (s.flags && s.flags.shard_sense && SF.activePickups) {
    var nearShard = false;
    SF.activePickups().forEach(function (item) {
      if (item.kind === "shard" && SF.dist(p.x, p.y, item.x, item.y) <= 160) nearShard = true;
    });
    s.handNear = nearShard;
    if (nearShard) {
      s.handChime = (s.handChime || 0) + dt;
      if (s.handChime > 2.8) {
        s.handChime = 0;
        if (window.Sfx) Sfx.play("ui");
      }
    } else s.handChime = 0;
  } else if (s) s.handNear = false;
};

SF.updateCamera = function (dt) {
  var s = SF.state;
  var targetX;
  var targetY;
  if (s.mode === "title") {
    targetX = 190 + Math.sin(SF.anim * 0.12) * 34;
    targetY = -180 + Math.cos(SF.anim * 0.1) * 18;
  } else if (s.mode === "cutscene") {
    targetX = SF.LAMP.x;
    targetY = SF.LAMP.y - 8;
  } else if (s.revealPan && SF.LAMP) {
    s.revealPan.t += dt;
    var u = s.revealPan.t / s.revealPan.dur;
    var lampW = 0;
    if (u < 0.28) lampW = 0;
    else if (u < 0.46) lampW = (u - 0.28) / 0.18;
    else if (u < 0.68) lampW = 1;
    else if (u < 0.88) lampW = Math.max(0, 1 - (u - 0.68) / 0.2);
    var crystalY = SF.LAMP.y - ((window.Art && Art.lampCrystalDy) || 34);
    targetX = s.player.x + (SF.LAMP.x - s.player.x) * lampW;
    targetY = s.player.y + (crystalY - s.player.y) * lampW;
    if (u >= 1) s.revealPan = null;
  } else if (SF.debugCam) {
    targetX = SF.debugCam.x;
    targetY = SF.debugCam.y;
  } else if (SF._depart && s.dialogue && s.dialogue.id === "cinderveil.act1.finale") {
    var dep = SF._depart;
    var pu = dep.panDur <= 0 ? 1 : Math.max(0, Math.min(1, dep.t / dep.panDur));
    var pk = pu * pu * (3 - 2 * pu);
    targetX = dep.fromX + (dep.camX - dep.fromX) * pk;
    targetY = dep.fromY + (dep.camY - dep.fromY) * pk;
  } else if (SF._epiCam && s.dialogue && s.dialogue.id && s.dialogue.id.indexOf("cinderveil.kestrel.epilogue_") === 0) {
    targetX = SF._epiCam.x;
    targetY = SF._epiCam.y;
  } else if (s.approach && s.approach.kind === "cantor" && SF.cantorWorldPos) {
    var spot = SF.cantorWorldPos();
    targetX = spot ? (s.player.x + spot.x) * 0.5 : s.player.x;
    targetY = spot ? (s.player.y + spot.y) * 0.5 : s.player.y;
  } else {
    targetX = s.player.x + s.player.fx * 26;
    targetY = s.player.y + s.player.fy * 18;
  }
  var departHold = SF._depart && s.dialogue && s.dialogue.id === "cinderveil.act1.finale";
  var epiHold = SF._epiCam && s.dialogue && s.dialogue.id && s.dialogue.id.indexOf("cinderveil.kestrel.epilogue_") === 0;
  if (SF.bounds && s.mode !== "title" && !SF.debugOverview && !departHold && !epiHold) {
    var hw = (SF.viewW || 640) / 2;
    var hh = (SF.viewH || 360) / 2;
    var b = SF.bounds;
    if (b.w > hw * 2) targetX = SF.clamp(targetX, b.x + hw, b.x + b.w - hw);
    if (b.h > hh * 2) targetY = SF.clamp(targetY, b.y + hh, b.y + b.h - hh);
  }
  var k = SF.reduceMotion ? 1 : 1 - Math.exp(-5.2 * dt);
  s.camX += (targetX - s.camX) * k;
  s.camY += (targetY - s.camY) * k;
  s.shake *= Math.exp(-6 * dt);
};

SF.pumpMessages = function (dt) {
  var s = SF.state;
  if (s.lampBanner && s.banner) {
    s.banner.ttl -= dt;
    if (s.banner.ttl <= 0) {
      s.banner = null;
      s.lampBanner = false;
    }
  }
  if (s.mode === "dialogue" || s.mode === "cutscene" || s.revealPan) return;
  if (s.toast) {
    s.toast.ttl -= dt;
    if (s.toast.ttl <= 0) s.toast = null;
  }
  if (!s.toast && s.toasts.length) s.toast = s.toasts.shift();
  if (s.banner && !s.lampBanner) {
    s.banner.ttl -= dt;
    if (s.banner.ttl <= 0) s.banner = null;
  }
  if (!s.banner && s.banners.length) s.banner = s.banners.shift();
  s.savedFlash = Math.max(0, (s.savedFlash || 0) - dt);
};

SF.update = function (dt) {
  SF.stepDt = dt;
  var s = SF.state;
  if (!s) return;
  SF.anim = (SF.anim || 0) + dt;
  if (s.mode !== "title" && s.mode !== "pause" && SF.tickActVisuals) SF.tickActVisuals(dt);
  if (s.mode !== "pause" && s.mode !== "chest") SF.pumpMessages(dt);
  if (s.mode === "title") {
    SF.updateCamera(dt);
    return;
  }
  if (s.mode === "pause") return;
  if (s.mode === "voyage") {
    if (SF.updateVoyage) SF.updateVoyage(dt);
    SF.updateCamera(dt);
    SF.updateFx(dt);
    return;
  }
  if (s.mode === "sailmenu" || s.mode === "hand" || s.mode === "shop" || s.mode === "inn" || s.mode === "notice" || s.mode === "chest" || s.mode === "battle") return;
  if (s.mode === "dialogue") {
    if (s.voyageTalk && s.voyage) s.voyage.t += dt;
    if (s.approach && s.approach.kind === "cantor") {
      s.approach.t += dt;
      if (s.approach.t >= s.approach.dur && SF.parkCantor) SF.parkCantor();
    }
    if (s.dialogue) s.dialogue.lock = Math.max(0, s.dialogue.lock - dt);
    if (SF.tickDialogue) SF.tickDialogue(dt);
    if ((SF.consumeInteract || function () { return false; })()) SF.advanceDialogue();
    SF.updateCamera(dt);
    SF.updateFx(dt);
    return;
  }
  if (s.mode === "cutscene") {
    s.cut.t += dt;
    s.cut.lock = Math.max(0, s.cut.lock - dt);
    if (s.cut.t > 1.15) SF.applyCutscene();
    if ((SF.consumeInteract || function () { return false; })()) SF.skipCutscene();
    if (s.mode === "cutscene" && s.cut && s.cut.t > 3.25) {
      s.mode = "play";
      s.cut = null;
    }
    SF.updateWorld(dt, false);
    SF.updateCamera(dt);
    return;
  }
  if (s.pendingTalk && SF.startDialogue) {
    var pending = s.pendingTalk;
    s.pendingTalk = null;
    SF.startDialogue(pending);
    SF.updateCamera(dt);
    return;
  }
  if (SF.maybeCantor) SF.maybeCantor();
  if (s.mode !== "play") {
    SF.updateCamera(dt);
    return;
  }
  if (s.hitstop > 0) {
    s.hitstop -= dt;
    SF.updateFx(dt);
    SF.updateCamera(dt);
    return;
  }
  s.playTime += dt;
  s.autosave += dt;
  if (s.autosave > 8) {
    s.autosave = 0;
    SF.saveGame({ silent: true });
  }
  SF.updatePlayer(dt);
  if (s.mode !== "play") return;
  SF.updateWorld(dt, true);
  SF.updatePickups();
  SF.updateCamera(dt);
};

SF.samplePath = function (label, points, issues) {
  var i, a, b, d, steps, s, t, x, y;
  for (i = 0; i < points.length - 1; i++) {
    a = points[i];
    b = points[i + 1];
    d = Math.hypot(b.x - a.x, b.y - a.y);
    steps = Math.max(1, Math.ceil(d / 3));
    for (s = 0; s <= steps; s++) {
      t = s / steps;
      x = a.x + (b.x - a.x) * t;
      y = a.y + (b.y - a.y) * t;
      if (!SF.walkable(x, y)) issues.push(label + " blocked at " + x.toFixed(1) + "," + y.toFixed(1));
    }
  }
};

SF.audit = function () {
  var issues = [];
  function check(label, x, y) {
    if (!SF.walkable(x, y)) issues.push(label + " not walkable (" + x + "," + y + ")");
  }
  check("wake", SF.WAKE.x, SF.WAKE.y);
  check("lamp", SF.LAMP.x, SF.LAMP.y);
  SF.NPCS.forEach(function (n) { check(n.id, n.x, n.y); });
  SF.TEXTS.forEach(function (t) { check(t.id, t.x, t.y); });
  SF.PICKUPS.forEach(function (p) { check(p.id, p.x, p.y); });
  SF.SPAWNS.forEach(function (sp) {
    check(sp.id, sp.x, sp.y);
    var kind = SF.KINDS[sp.kind];
    if (SF.dist(sp.x, sp.y, SF.WAKE.x, SF.WAKE.y) < kind.aggro + 12) {
      issues.push(sp.id + " can see the waking stones");
    }
  });
  var spanBrume = null;
  SF.SPAWNS.forEach(function (sp) { if (sp.id === "brume-span") spanBrume = sp; });
  if (spanBrume && SF.dist(spanBrume.x, spanBrume.y, SF.NPCS[0].x, SF.NPCS[0].y) < SF.KINDS.brumekin.aggro + 10) {
    issues.push("the span brute can see Maren's door");
  }
  var maren = SF.NPCS[0];
  var kestrel = SF.NPCS[1];
  var cantor = SF.NPCS[2];
  var grove = SF.circle("grove");
  var step1 = SF.circle("step1");
  var step2 = SF.circle("step2");
  var hollow = SF.circle("hollow");
  var dock = SF.circle("dock");
  var gap = SF.circle("gap");
  var cinder = SF.circle("cinder");
  var alcove = SF.circle("alcove");
  var span = SF.circle("span");
  var secret = SF.PICKUPS.filter(function (p) { return p.id === "shard-alcove"; })[0];
  SF.samplePath("to lamp", [SF.WAKE, maren, SF.LAMP], issues);
  SF.samplePath("to kestrel", [dock, { x: -20, y: 360 }, { x: -20, y: 400 }, kestrel], issues);
  SF.samplePath("to hollow", [grove, step1, step2, hollow, cantor], issues);
  SF.samplePath("cinder secret", [gap, cinder, alcove, secret], issues);
  var dx = gap.x - span.x;
  var dy = gap.y - span.y;
  var len = Math.hypot(dx, dy);
  var ux = dx / len;
  var uy = dy / len;
  var lipX = span.x + ux * (span.r - SF.WALK_MARGIN);
  var lipY = span.y + uy * (span.r - SF.WALK_MARGIN);
  if (!SF.walkable(lipX, lipY)) issues.push("dash lip not walkable");
  if (SF.walkable(lipX + ux * 36, lipY + uy * 36)) issues.push("broken span can be walked");
  var dash = SF.DASH_SPEED * SF.DASH_TIME;
  if (!SF.walkable(lipX + ux * dash, lipY + uy * dash)) issues.push("base dash from the lip misses the far pier");
  var reach = SF.dist(span.x, span.y, gap.x, gap.y) - (gap.r - SF.WALK_MARGIN);
  if (SF.DASH_SPEED_PLUS * SF.DASH_TIME < reach) issues.push("upgraded dash is not longer than the pier-to-pier reach");
  return issues;
};
