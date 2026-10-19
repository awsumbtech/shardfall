"use strict";

var SF = window.SF || {};
window.SF = SF;

SF.fresh = function () {
  var enemies = SF.SPAWNS.map(function (sp) {
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
      stun: 0
    };
  });
  return {
    mode: "title",
    pausedFrom: "play",
    playTime: 0,
    autosave: 0,
    quest: "awaken",
    shardsHeld: 0,
    picked: {},
    drops: {},
    flags: {
      metMaren: false,
      metKestrel: false,
      metCantor: false,
      lampLit: false,
      kestrelHint: false,
      kestrelAfter: false,
      heardChoir: false,
      shardstep: false
    },
    discovered: { cinder: false, hollow: false },
    stats: { foes: 0, shardsEver: 0 },
    hints: { strike: false, span: false, talk: false, moved: false, dash: false },
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
      trail: 0
    },
    enemies: enemies,
    projectiles: [],
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
    savedFlash: 0
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
  SF.PICKUPS.forEach(function (p) {
    if (!s.picked[p.id]) list.push(p);
  });
  Object.keys(s.drops).forEach(function (id) {
    if (!s.picked[id]) list.push({ id: id, kind: "shard", x: s.drops[id].x, y: s.drops[id].y, dropped: true });
  });
  return list;
};

SF.secretVisible = function (pickup) {
  if (!pickup.secret) return true;
  var s = SF.state;
  if (pickup.id === "shard-alcove") return !!(s.flags.kestrelHint || s.discovered.cinder);
  return true;
};

SF.damageEnemy = function (e, dmg, kx, ky, kb) {
  if (!e.alive || e.dying > 0) return;
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
    p.x = SF.WAKE.x;
    p.y = SF.WAKE.y;
    p.safeX = p.x;
    p.safeY = p.y;
    p.iFrames = 1.5;
    p.hx = 0;
    p.hy = 0;
    p.fall = 0;
    p.dashT = 0;
    SF.pushToast("The shard flares and hauls you back to the stones.");
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
  SF.state.enemies.forEach(function (e) {
    if (!e.alive || e.dying > 0 || e.dashed === p.dashId) return;
    if (SF.dist(p.x, p.y, e.x, e.y) > e.r + 16) return;
    e.dashed = p.dashId;
    SF.damageEnemy(e, 8, p.fx, p.fy, 0.65);
  });
};

SF.releaseHolds = function () {
  if (!SF.inputState) return;
  SF.inputState.attack = false;
  SF.inputState.attackKey = false;
  SF.inputState.dashEdge = false;
};

SF.openDialogue = function (talk) {
  if (!talk || talk.cutscene) return;
  SF.releaseHolds();
  var s = SF.state;
  s.dialogue = {
    speaker: talk.speaker,
    lines: talk.lines,
    i: 0,
    lock: 0.22,
    after: talk.after || "note"
  };
  s.mode = "dialogue";
  SF.emit("talk");
};

SF.advanceDialogue = function () {
  var s = SF.state;
  var d = s.dialogue;
  if (!d || s.mode !== "dialogue" || d.lock > 0) return;
  d.i += 1;
  if (d.i >= d.lines.length) {
    var after = d.after;
    s.dialogue = null;
    s.mode = "play";
    SF.onDialogueEnd(after);
  } else {
    d.lock = 0.05;
    SF.emit("talk");
  }
};

SF.onDialogueEnd = function (after) {
  var s = SF.state;
  var p = s.player;
  if (after === "maren_first" || after === "maren_heal") {
    if (after === "maren_first") s.flags.metMaren = true;
    if (s.quest === "awaken") s.quest = "gather";
    p.hp = p.maxHp;
    SF.saveGame({ silent: true });
  }
  if (after === "kestrel_first") {
    s.flags.metKestrel = true;
    s.flags.kestrelHint = true;
    SF.pushToast("Kestrel's note: the span is too wide to walk. Dash from the lip.");
    SF.saveGame({ silent: true });
  }
  if (after === "kestrel_sail") {
    s.flags.kestrelAfter = true;
    s.quest = "hooked";
    SF.pushToast("The route to Cinderveil is real. Not today — but real.");
    SF.saveGame({ silent: true });
  }
  if (after === "cantor_first") {
    s.flags.metCantor = true;
    s.flags.heardChoir = true;
    s.discovered.hollow = true;
    SF.saveGame({ silent: true });
  }
};

SF.nearestInteract = function (range) {
  var s = SF.state;
  var p = s.player;
  var best = null;
  var bestD = range || 54;
  function consider(kind, ref, x, y) {
    var d = SF.dist(p.x, p.y, x, y);
    if (d < bestD) {
      bestD = d;
      best = { kind: kind, ref: ref, d: d };
    }
  }
  SF.NPCS.forEach(function (n) { consider("npc", n, n.x, n.y); });
  SF.TEXTS.forEach(function (t) { consider("text", t, t.x, t.y); });
  consider("lamp", SF.LAMP, SF.LAMP.x, SF.LAMP.y);
  return best;
};

SF.actionFor = function (s, near) {
  if (!near) return { label: "Talk", name: "", prompt: "" };
  if (near.kind === "lamp") {
    var place = !s.flags.lampLit && s.shardsHeld >= SF.QUEST_SHARDS;
    var label = place ? "Place shards" : "Inspect";
    return { label: label, name: "the great lamp", prompt: label + " — the great lamp" };
  }
  if (near.kind === "text") {
    return { label: "Inspect", name: near.ref.speaker, prompt: "Inspect — " + near.ref.speaker };
  }
  return { label: "Talk", name: near.ref.name, prompt: "Talk — " + near.ref.name };
};

SF.objectivePoint = function (s) {
  if (!s || s.mode === "title") return null;
  if (s.quest === "awaken") {
    var maren = SF.NPCS[0];
    return { x: maren.x, y: maren.y };
  }
  if (s.quest === "gather") {
    if (s.shardsHeld >= SF.QUEST_SHARDS) return { x: SF.LAMP.x, y: SF.LAMP.y };
    var best = null;
    var bestD = Infinity;
    SF.activePickups().forEach(function (item) {
      if (item.kind !== "shard") return;
      if (item.secret && !SF.secretVisible(item)) return;
      var d = SF.dist(s.player.x, s.player.y, item.x, item.y);
      if (d < bestD) {
        bestD = d;
        best = item;
      }
    });
    if (!best) {
      s.enemies.forEach(function (e) {
        if (!e.alive || !SF.KINDS[e.kind].drops) return;
        var d = SF.dist(s.player.x, s.player.y, e.x, e.y);
        if (d < bestD) {
          bestD = d;
          best = e;
        }
      });
    }
    if (best) return { x: best.x, y: best.y };
    return { x: SF.LAMP.x, y: SF.LAMP.y };
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
  if (!near && !h.strike) {
    var foe = s.enemies.some(function (e) {
      return e.alive && SF.dist(e.x, e.y, p.x, p.y) < 150;
    });
    if (foe) return "Strike the core — blade button, or J.";
  }
  var nearSpan = SF.dist(p.x, p.y, 300, -88) < 155;
  if (!near && nearSpan && !h.span) {
    return h.dash
      ? "This gap is too wide to walk. Dash from the lip."
      : "Dash crosses gaps — dash button, or K. Do not walk the span.";
  }
  if (!near && !h.dash && s.playTime < 40) return "Dash crosses gaps — dash button, or K.";
  return "";
};

SF.tryLamp = function () {
  var talk = SF.talkLamp(SF.state);
  if (talk.cutscene) SF.beginCutscene();
  else SF.openDialogue(talk);
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
  if (near.kind === "npc") {
    var n = near.ref;
    if (n.id === "maren") SF.openDialogue(SF.talkMaren(s));
    else if (n.id === "kestrel") SF.openDialogue(SF.talkKestrel(s));
    else SF.openDialogue(SF.talkCantor(s));
    return;
  }
  SF.openDialogue({ speaker: near.ref.speaker, lines: near.ref.lines, after: "note" });
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
  SF.pushBanner("The lamp remembers", "Shardstep awakens — farther, sooner, and it singes.");
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
    var sub = "The lamp on the hill needs " + SF.QUEST_SHARDS + ".";
    if (s.quest === "awaken") sub = "Talk to Old Maren, up the hill.";
    else if (got >= SF.QUEST_SHARDS) sub = "Bring them to the lamp. Press Place shards.";
    SF.pushBanner("Sky-shard " + got + " of " + SF.QUEST_SHARDS, sub, 2.6);
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

  if (e.kind === "brumekin") {
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
  } else if (e.kind === "choirling") {
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
  var list = SF.state.enemies.filter(function (e) { return e.alive && e.dying <= 0; });
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
  SF.updateFx(dt);
};

SF.updateFx = function (dt) {
  var s = SF.state;
  s.particles.forEach(function (part) {
    part.life -= dt;
    part.x += part.vx * dt;
    part.y += part.vy * dt;
    part.vy += 12 * dt;
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
  p.iFrames = Math.max(0, p.iFrames - dt);
  p.hurt = Math.max(0, p.hurt - dt);
  p.px = p.x;
  p.py = p.y;

  if ((SF.consumeDash || function () { return false; })()) {
    if (SF.startDash(p)) SF.noteHint("dash");
    else if (p.dashCd > 0.08) SF.pushToast("Dash is still cooling.", 1.2);
  }
  if ((SF.consumeAttack || function () { return false; })()) SF.startSwing(p);
  if ((SF.consumeInteract || function () { return false; })()) {
    SF.tryInteract();
    if (s.mode !== "play") return;
  }

  if (p.swinging) {
    p.swingT += dt;
    if (p.swingT >= 0.04 && p.swingT <= 0.15) SF.applySwing(p);
    if (p.swingT >= 0.2) p.swinging = false;
  }

  if (p.dashT > 0) {
    var step = Math.min(dt, p.dashT);
    p.dashT -= step;
    p.x += p.dvx * step;
    p.y += p.dvy * step;
    p.trail -= step;
    if (p.trail <= 0) {
      p.trail = 0.025;
      SF.spawnParticle(p.x, p.y, p.shardstep ? "#fff1b8" : "#9af6ff", 20, 0.28, 3);
      if (s.ghosts.length < 7) s.ghosts.push({ x: p.x, y: p.y, fx: p.fx, fy: p.fy, a: 0.45 });
    }
    SF.dashSing(p);
  } else {
    var mag = Math.hypot(move.x, move.y);
    if (mag > 0.12) {
      var nx = move.x / mag;
      var ny = move.y / mag;
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
    if (!SF.walkable(p.x, p.y)) {
      if (SF.walkable(p.x, p.py)) p.y = p.py;
      else if (SF.walkable(p.px, p.y)) p.x = p.px;
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
  } else if (p.dashT <= 0) {
    p.fall += dt;
    if (p.fall > 0.24) SF.rescue(p);
  }

  var zone = SF.zoneAt(p.x, p.y);
  if (zone.id === "cinder" || zone.id === "alcove" || zone.id === "gap") {
    s.discovered.cinder = true;
    SF.noteHint("span");
  }
  if (zone.id === "hollow") s.discovered.hollow = true;
  if (!s.hints.moved && SF.dist(p.x, p.y, SF.WAKE.x, SF.WAKE.y) > 28) SF.noteHint("moved");
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
  } else {
    targetX = s.player.x + s.player.fx * 26;
    targetY = s.player.y + s.player.fy * 18;
  }
  var k = SF.reduceMotion ? 1 : 1 - Math.exp(-5.2 * dt);
  s.camX += (targetX - s.camX) * k;
  s.camY += (targetY - s.camY) * k;
  s.shake *= Math.exp(-6 * dt);
};

SF.pumpMessages = function (dt) {
  var s = SF.state;
  if (s.toast) {
    s.toast.ttl -= dt;
    if (s.toast.ttl <= 0) s.toast = null;
  }
  if (!s.toast && s.toasts.length) s.toast = s.toasts.shift();
  if (s.banner) {
    s.banner.ttl -= dt;
    if (s.banner.ttl <= 0) s.banner = null;
  }
  if (!s.banner && s.banners.length) s.banner = s.banners.shift();
  s.savedFlash = Math.max(0, (s.savedFlash || 0) - dt);
};

SF.update = function (dt) {
  var s = SF.state;
  if (!s) return;
  SF.anim = (SF.anim || 0) + dt;
  if (s.mode !== "pause") SF.pumpMessages(dt);
  if (s.mode === "title") {
    SF.updateCamera(dt);
    return;
  }
  if (s.mode === "pause") return;
  if (s.mode === "dialogue") {
    if (s.dialogue) s.dialogue.lock = Math.max(0, s.dialogue.lock - dt);
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
