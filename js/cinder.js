"use strict";

var SF = window.SF || {};
window.SF = SF;

// Cinderveil sits in its own coordinates. Emberhold's objects are captured
// here, before any island swap, so travel can put them back.
SF.ISLANDS = {
  emberhold: {
    wake: SF.WAKE,
    lamp: SF.LAMP,
    walk: SF.WALK,
    npcs: SF.NPCS,
    texts: SF.TEXTS,
    pickups: SF.PICKUPS,
    spawns: SF.SPAWNS,
    props: SF.PROPS,
    paths: SF.PATHS,
    hooks: [],
    extras: []
  }
};

SF.DOCKS = {
  emberhold: { x: 16, y: 470 },
  cinderveil: { x: 20, y: 90 }
};

SF.ISLANDS.cinderveil = {
  wake: { x: 20, y: 90 },
  lamp: { x: 1450, y: -20 },
  walk: {
    circles: [
      { id: "quay", name: "Lowmoor Quay", group: "quay", x: 0, y: 0, r: 160 },
      { id: "workshop", name: "Tamsin's Workshop", group: "quay", x: -120, y: -70, r: 64 },
      { id: "ash-link", name: "The Ashfields", group: "ash", x: 180, y: 20, r: 70 },
      { id: "ash", name: "The Ashfields", group: "ash", x: 360, y: 20, r: 160 },
      { id: "ashnook", name: "The Cold Nook", group: "ash", x: 360, y: -170, r: 52 },
      { id: "ash-lip", name: "The Ashfields", group: "ash", x: 560, y: 40, r: 72 },
      { id: "vault-lip", name: "Ember Vault", group: "vault", x: 840, y: 40, r: 64 },
      { id: "vault-yard", name: "Ember Vault", group: "vault", x: 980, y: 20, r: 120 },
      { id: "vault-heart", name: "The Ember Vault", group: "vault", x: 1380, y: 20, r: 150 }
    ],
    rects: []
  },
  npcs: [
    { id: "kestrel", name: "Kestrel Vane", x: -10, y: 120 },
    { id: "tamsin", name: "Tamsin Reed", x: -110, y: -50 },
    { id: "hesk", name: "Brother Hesk", x: 80, y: 50 },
    { id: "ilsa", name: "Warden Ilsa", x: 900, y: 60 },
    { id: "cantor", name: "The Cantor", x: 1340, y: 90, when: "cinderLit", until: "cantorGone" }
  ],
  texts: [
    { id: "quay-sign", x: 70, y: -20, speaker: "Quay Sign", node: "inspect.lowmoor_sign" },
    { id: "quay-bell", x: 40, y: -50, speaker: "Quay Bell", node: "inspect.quay_bell" },
    { id: "ash-path", x: 300, y: 70, speaker: "Path Lamps", node: "inspect.ember_path" },
    { id: "ash-cog", x: 430, y: 10, speaker: "Cog", node: "inspect.ash_cog" },
    { id: "hesk-crate", x: 110, y: 70, speaker: "Hesk's Hideout", node: "inspect.choir_crate" },
    { id: "ilsa-order", x: 860, y: 80, speaker: "Posted Order", node: "inspect.ilsa_order" },
    { id: "vault-seal", x: 1250, y: 20, speaker: "Vault Door", node: "inspect.vault_seal" },
    { id: "maw-mouth", x: 1320, y: 20, speaker: "The Cinder Maw", node: "cinderveil.maw.prefight" },
    { id: "maw-tooth", x: 1280, y: -40, speaker: "Maw Tooth", node: "inspect.maw_tooth" }
  ],
  pickups: [
    { id: "cog-link", kind: "cog", x: 200, y: 40 },
    { id: "cog-ash", kind: "cog", x: 400, y: -30 },
    { id: "cog-lip", kind: "cog", x: 500, y: 70 },
    { id: "shard-workshop", kind: "shard", x: -130, y: -30 },
    { id: "shard-ash-nook", kind: "shard", x: 360, y: -180, secret: true },
    { id: "bloom-ash-nook", kind: "bloom", x: 390, y: -160, secret: true }
  ],
  spawns: [
    { id: "ashmite-west", kind: "ashmite", x: 320, y: 80 },
    { id: "ashmite-north", kind: "ashmite", x: 430, y: -60 },
    { id: "soot-east", kind: "sootwing", x: 450, y: 90 },
    { id: "brute-cog", kind: "cinderbrute", x: 470, y: 10 },
    { id: "brute-yard", kind: "cinderbrute", x: 1020, y: -20 },
    { id: "maw", kind: "maw", x: 1380, y: 20, dormant: true }
  ],
  props: [
    { kind: "airship", x: -50, y: 155 },
    { kind: "cottage", x: -140, y: -95 },
    { kind: "rock", x: 250, y: 50, s: 1 },
    { kind: "rock", x: 520, y: 20, s: 1.1 },
    { kind: "rock", x: 800, y: 55, s: 0.8 },
    { kind: "stones", x: 1080, y: 50, s: 0.9 },
    { kind: "stake", x: 60, y: 20 },
    { kind: "stake", x: 860, y: 20 },
    { kind: "flower", x: -20, y: 40, c: "#e7a070" },
    { kind: "flower", x: 140, y: -20, c: "#c8beb4" },
    { kind: "ruin", x: 1100, y: -10 }
  ],
  paths: [
    [20, 90, 180, 20, 360, 20, 540, 40],
    [20, 40, -80, -20]
  ],
  hooks: [
    { id: "ash-post", x: 620, y: 40 },
    { id: "vault-post", x: 790, y: 40 },
    { id: "yard-post", x: 1080, y: 20, needs: "vault" },
    { id: "heart-post", x: 1250, y: 20, needs: "vault" }
  ],
  extras: [
    { id: "bench", kind: "bench", name: "Tamsin's bench", x: -80, y: -20, node: "inspect.tamsin_bench" },
    { id: "vault-stone", kind: "checkpoint", name: "the vault stone", x: 1080, y: 40 }
  ]
};

SF.islandId = "emberhold";
SF.HOOKS = [];
SF.EXTRAS = [];

SF.mountIsland = function (id) {
  var pack = SF.ISLANDS[id] || SF.ISLANDS.emberhold;
  SF.islandId = SF.ISLANDS[id] ? id : "emberhold";
  SF.WAKE = pack.wake;
  SF.LAMP = pack.lamp;
  SF.WALK = pack.walk;
  SF.NPCS = pack.npcs;
  SF.TEXTS = pack.texts;
  SF.PICKUPS = pack.pickups;
  SF.SPAWNS = pack.spawns;
  SF.PROPS = pack.props;
  SF.PATHS = pack.paths;
  SF.HOOKS = pack.hooks || [];
  SF.EXTRAS = pack.extras || [];
  SF.bounds = pack.bounds || null;
  if (SF.buildWorld) SF.buildWorld();
};

SF.npcHidden = function (n) {
  if (!n) return false;
  var flags = SF.state && SF.state.flags;
  if (n.until && flags && flags[n.until]) return true;
  if (!n.when) return false;
  return !(flags && flags[n.when]);
};

SF.npcById = function (id) {
  var i;
  for (i = 0; i < SF.NPCS.length; i++) if (SF.NPCS[i].id === id) return SF.NPCS[i];
  return null;
};

SF.lampIsLit = function (s) {
  if (SF.islandId === "cinderveil") return !!(s && s.flags && s.flags.cinderLit);
  return !!(s && s.flags && s.flags.lampLit);
};

SF.hookLive = function (hook) {
  if (!hook) return false;
  if (hook.needs === "vault") return !!(SF.state && SF.state.flags && SF.state.flags.vaultOpen);
  return true;
};

SF.snapshotEnemies = function () {
  var s = SF.state;
  if (!s) return;
  if (!s.enemySave) s.enemySave = {};
  s.enemySave[SF.islandId] = s.enemies.map(function (e) {
    return { id: e.id, alive: e.alive && e.dying <= 0, hp: e.hp, dormant: !!e.dormant };
  });
};

SF.loadEnemies = function () {
  var s = SF.state;
  var made = SF.makeEnemies();
  var saved = (s.enemySave && s.enemySave[SF.islandId]) || [];
  var byId = {};
  saved.forEach(function (e) { byId[e.id] = e; });
  made.forEach(function (e) {
    var row = byId[e.id];
    if (!row) return;
    e.alive = !!row.alive;
    e.hp = row.alive ? row.hp : 0;
    if (row.dormant != null && e.kind === "maw" && !s.flags.mawFight) e.dormant = !!row.dormant;
  });
  if (s.flags && s.flags.mawDead) {
    made.forEach(function (e) {
      if (e.kind === "maw") {
        e.alive = false;
        e.hp = 0;
        e.dormant = false;
      }
    });
  }
  s.enemies = made;
  s.projectiles = [];
  s.pools = [];
};

SF.travelTo = function (island) {
  var s = SF.state;
  if (!s || !SF.ISLANDS[island]) return;
  if (SF.islandId === island) {
    if (s.mode !== "dialogue" && s.mode !== "pause") s.mode = "play";
    return;
  }
  SF.snapshotEnemies();
  s.island = island;
  SF.mountIsland(island);
  SF.loadEnemies();
  var dock = SF.DOCKS[island];
  s.player.x = dock.x;
  s.player.y = dock.y;
  s.player.safeX = dock.x;
  s.player.safeY = dock.y;
  s.player.px = dock.x;
  s.player.py = dock.y;
  s.player.fall = 0;
  s.player.dashT = 0;
  s.player.grappleT = 0;
  s.camX = dock.x;
  s.camY = dock.y;
  s.mode = "play";
  s.voyage = null;
  s.voyageTalk = false;
  s.pendingTalk = null;
  var arrival = {
    emberhold: ["Emberhold", "Emberhold, under the old lamp."],
    cinderveil: ["Cinderveil", "Lowmoor Quay takes the line."],
    saltmere: ["Saltmere", "A stilt town. The lamp is dim."],
    highspire: ["Lowgate", "The road up to the gate."],
    gullrock: ["Gullrock", "A small rock."],
    drift: ["Drift Market", "The Drift Market."]
  };
  var line = arrival[island] || [island, ""];
  SF.pushBanner(line[0], line[1], 2.4);
  if (SF.cuePlaceMusic) SF.cuePlaceMusic(s);
  SF.saveGame({ silent: true });
};

SF.openSailMenu = function () {
  var s = SF.state;
  if (!s) return;
  if (!s.flags.sailUnlocked) {
    SF.pushToast("The hull is not ready for Cinderveil. Light Emberhold's lamp first.", 2.4);
    return;
  }
  SF.releaseHolds();
  s.mode = "sailmenu";
};

SF.startVoyage = function (island) {
  var s = SF.state;
  if (!s || !SF.ISLANDS[island]) return;
  if (SF.islandId === island) {
    s.mode = "play";
    SF.pushToast("You are already on this island.", 1.6);
    return;
  }
  if (island === "cinderveil" && !s.flags.sailUnlocked) return;
  if (window.Music) Music.play("sail");
  if (window.Sfx) Sfx.play("whoosh");
  if (island === "cinderveil" && !s.flags.metCinderKestrel && SF.startDialogue) {
    s.voyage = { t: 0, to: island, from: SF.islandId, talk: true };
    s.voyageTalk = true;
    SF.startDialogue("cinderveil.sail.depart");
    return;
  }
  s.voyageTalk = false;
  s.voyage = { t: 0, to: island, from: SF.islandId };
  s.mode = "voyage";
};

SF.cuePlaceMusic = function (s) {
  if (!window.Music) return;
  s = s || SF.state;
  if (s && s.flags && s.flags.mawFight && !s.flags.mawDead) {
    Music.play("boss");
    return;
  }
  if (s && (s.mode === "voyage" || s.voyageTalk)) {
    Music.play("sail");
    return;
  }
  Music.play(SF.islandId === "cinderveil" ? "cinderveil" : "emberhold");
};

SF.updateVoyage = function (dt) {
  var s = SF.state;
  if (!s.voyage) return;
  s.voyage.t += dt;
  if (s.voyage.t > 3.2) SF.finishVoyage();
};

SF.finishVoyage = function () {
  var s = SF.state;
  if (!s.voyage || s.voyage.talk) return;
  var to = s.voyage.to;
  SF.travelTo(to);
};

SF.setCheckpoint = function (x, y) {
  if (SF.rememberCheckpoint) {
    SF.rememberCheckpoint(x, y, { kind: "post" });
    return;
  }
  var s = SF.state;
  s.checkpoint = { x: x, y: y, island: SF.islandId, kind: "post" };
  SF.pushToast("Checkpoint. The vault stone has you.", 2.2);
  SF.saveGame({ silent: true });
};

SF.openHand = function () {
  var s = SF.state;
  if (!s) return;
  if (!s.flags.lampLit && !s.player.grapple) {
    SF.pushToast("The hand has nothing spare to spend yet.", 1.8);
    return;
  }
  SF.releaseHolds();
  s.pausedFrom = "play";
  s.mode = "hand";
};

SF.closeHand = function () {
  var s = SF.state;
  if (!s || s.mode !== "hand") return;
  s.mode = "play";
};

SF.buyUpgrade = function (id) {
  var s = SF.state;
  var def = null;
  SF.HAND_UPGRADES.forEach(function (u) { if (u.id === id) def = u; });
  if (!def || !s) return;
  if (s.upgrades[id]) return;
  if (def.needs === "grapple" && !s.player.grapple) {
    SF.pushToast("The hook is not fitted yet.", 1.6);
    return;
  }
  if (def.needs === "shardstep" && !s.player.shardstep) {
    SF.pushToast("Shardstep has to wake first.", 1.6);
    return;
  }
  var spare = SF.spareShards ? SF.spareShards(s) : s.shardsHeld;
  if (s.shardsHeld >= def.cost && spare < def.cost) {
    SF.pushToast("Saved for the lamp.", 1.6);
    return;
  }
  if (spare < def.cost) {
    SF.pushToast("Not enough spare shards.", 1.6);
    return;
  }
  s.shardsHeld -= def.cost;
  s.upgrades[id] = true;
  if (id === "brightedge") s.player.atk += 3;
  if (id === "deepheart") {
    s.player.maxHp += 14;
    s.player.hp += 14;
  }
  SF.pushToast(def.name + " settles into the hand.", 1.8);
  SF.saveGame({ silent: true });
};

SF.noteZone = function (zone) {
  var s = SF.state;
  if (!s || !zone) return;
  if (zone.id === "nook" || zone.id === "ashnook") s.discovered.ashnook = true;
  if (zone.id === "vault" || zone.id === "vault-heart" || zone.id === "vault-yard") s.discovered.vault = true;
  if ((zone.id === "vault" || zone.id === "vault-heart") && s.flags.vaultOpen && s.quest === "trial") s.quest = "seal";
};

SF.cinderQuestText = function (s) {
  var q = s.quest;
  var here = SF.islandId;
  if (q === "hooked") q = "sail";
  if ((q === "road" || q === "sail") && here !== "emberhold" && q === "road") {
    return "Sail back to Emberhold. Kestrel is at the skiff.";
  }
  if (q === "road") return "Talk to Kestrel. The skiff can sail.";
  if (q === "sail") {
    if (here === "cinderveil") return "You made the crossing. Talk to Tamsin Reed.";
    return "Sail to Cinderveil.";
  }
  if (q === "act1") return "Act 1 is done. Open the sail chart.";
  if (q === "quay" || q === "cogs" || q === "vault" || q === "trial" || q === "seal" || q === "maw" || q === "relight" || q === "cantor") {
    if (here !== "cinderveil") return "Sail to Cinderveil. Kestrel has the line.";
  }
  if (q === "quay") return "Talk to Tamsin Reed at Lowmoor Quay.";
  if (q === "cogs") {
    var n = s.cogs || 0;
    if (n >= 3) return "Bring 3 cogs to Tamsin (3/3).";
    return "Find 3 cogs in the Ashfields (" + n + "/3).";
  }
  if (q === "vault") return "Grapple across to the Ember Vault.";
  if (q === "trial") return s.flags.vaultOpen ? "Grapple Ilsa's gap, into the vault." : "Talk to Warden Ilsa.";
  if (q === "seal") return "Speak to the Cinder Maw.";
  if (q === "maw") return "Face the Cinder Maw.";
  if (q === "relight") {
    var need = SF.CINDER_SHARDS || 3;
    var held = s.shardsHeld || 0;
    return "Place " + need + " shards on the hurt core (" + held + "/" + need + ").";
  }
  if (q === "cantor") return "The Cantor is on the ridge. Spare, Listen, or Refuse.";
  return null;
};

SF.cinderObjective = function (s) {
  if (!s) return undefined;
  var q = s.quest === "hooked" ? "sail" : s.quest;
  var emberSteps = { awaken: 1, gather: 1, stirring: 1 };
  if (emberSteps[q]) return undefined;
  if (q === "act1") return null;
  if ((q === "road" || q === "sail" || q === "quay" || q === "cogs" || q === "vault" || q === "trial" || q === "seal" || q === "maw" || q === "relight" || q === "cantor") && SF.questIsland(q) !== SF.islandId) {
    var boat = SF.npcById("kestrel");
    return boat ? { x: boat.x, y: boat.y } : { x: SF.DOCKS[SF.islandId].x, y: SF.DOCKS[SF.islandId].y };
  }
  if (q === "road" || q === "sail") {
    var k = SF.npcById("kestrel");
    return k ? { x: k.x, y: k.y } : undefined;
  }
  if (q === "quay") {
    var t = SF.npcById("tamsin");
    return t ? { x: t.x, y: t.y } : undefined;
  }
  if (q === "cogs") {
    if ((s.cogs || 0) >= 3) {
      var back = SF.npcById("tamsin");
      return back ? { x: back.x, y: back.y } : undefined;
    }
    var best = null;
    var bestD = Infinity;
    SF.activePickups().forEach(function (item) {
      if (item.kind !== "cog") return;
      var d = SF.dist(s.player.x, s.player.y, item.x, item.y);
      if (d < bestD) {
        bestD = d;
        best = item;
      }
    });
    if (best) return { x: best.x, y: best.y };
    var tamsin = SF.npcById("tamsin");
    return tamsin ? { x: tamsin.x, y: tamsin.y } : undefined;
  }
  if (q === "vault" || (q === "trial" && !s.flags.vaultOpen)) {
    var ilsa = SF.npcById("ilsa");
    return ilsa ? { x: ilsa.x, y: ilsa.y } : undefined;
  }
  if (q === "trial" || q === "seal" || q === "maw") {
    var mouth = null;
    (SF.TEXTS || []).forEach(function (t) { if (t.id === "maw-mouth") mouth = t; });
    if (mouth) return { x: mouth.x, y: mouth.y };
    var spot = SF.spot && SF.spot("maw");
    return spot || { x: 0, y: 0 };
  }
  if (q === "relight") {
    var needRelight = SF.CINDER_SHARDS || 3;
    if ((s.shardsHeld || 0) >= needRelight) {
      if (SF.lampRoutePoint) return SF.lampRoutePoint(s);
      return { x: SF.LAMP.x, y: SF.LAMP.y };
    }
    return SF.shardGoal ? SF.shardGoal(s) : null;
  }
  if (q === "cantor") {
    var c = SF.npcById("cantor");
    return c ? { x: c.x, y: c.y } : { x: 1340, y: 90 };
  }
  return undefined;
};

SF.questIsland = function (q) {
  if (q === "road" || q === "sail") return "emberhold";
  if (q === "quay" || q === "cogs" || q === "vault" || q === "trial" || q === "seal" || q === "maw" || q === "relight" || q === "cantor") return "cinderveil";
  return SF.islandId;
};

SF.auditCinder = function () {
  var issues = [];
  var prev = SF.islandId;
  SF.mountIsland("cinderveil");
  function check(label, x, y) {
    if (!SF.walkable(x, y)) issues.push(label + " not walkable (" + x + "," + y + ")");
  }
  check("dock", SF.DOCKS.cinderveil.x, SF.DOCKS.cinderveil.y);
  SF.NPCS.forEach(function (n) { if (!n.when) check(n.id, n.x, n.y); });
  SF.PICKUPS.forEach(function (p) { check(p.id, p.x, p.y); });
  SF.HOOKS.forEach(function (h) { check(h.id, h.x, h.y); });
  check("cantor spot", 1340, 90);
  check("lamp", SF.LAMP.x, SF.LAMP.y);
  SF.samplePath("quay to cogs", [
    SF.DOCKS.cinderveil,
    { x: 180, y: 20 },
    { x: 200, y: 40 },
    { x: 360, y: 20 },
    { x: 400, y: -30 },
    { x: 500, y: 70 },
    { x: 620, y: 40 }
  ], issues);
  SF.samplePath("vault yard", [
    { x: 790, y: 40 },
    { x: 900, y: 60 },
    { x: 1080, y: 20 }
  ], issues);
  if (SF.walkable(700, 40)) issues.push("the ash gap can be walked");
  if (SF.walkable(1160, 20)) issues.push("Ilsa's gap can be walked");
  var dash = SF.DASH_SPEED * SF.DASH_TIME;
  if (SF.dist(620, 40, 790, 40) > 230) issues.push("first hook is out of grapple range");
  if (SF.dist(620, 40, 790, 40) < dash) issues.push("first gap is short enough to dash");
  if (SF.dist(1080, 20, 1250, 20) > 230) issues.push("vault hook is out of grapple range");
  if (SF.dist(1080, 20, 1250, 20) < dash) issues.push("Ilsa's gap is short enough to dash");
  var yardBrute = null;
  SF.SPAWNS.forEach(function (sp) { if (sp.id === "brute-yard") yardBrute = sp; });
  if (yardBrute && SF.dist(yardBrute.x, yardBrute.y, 20, 90) < SF.KINDS.cinderbrute.aggro + 40) {
    issues.push("the vault brute can see the quay");
  }
  SF.mountIsland(prev);
  return issues;
};

(function installCinder() {
  var baseQuest = SF.questText;
  SF.questText = function (s) {
    var line = SF.cinderQuestText(s);
    if (line) return line;
    return baseQuest(s);
  };
  var baseObjective = SF.objectivePoint;
  SF.objectivePoint = function (s) {
    var point = SF.cinderObjective(s);
    if (point !== undefined) return point;
    return baseObjective(s);
  };
  var baseSecret = SF.secretVisible;
  SF.secretVisible = function (pickup) {
    if (!pickup) return false;
    if (pickup.id === "shard-ash-nook" || pickup.id === "bloom-ash-nook") {
      return !!(SF.state && SF.state.flags && SF.state.flags.cogsStarted);
    }
    return baseSecret(pickup);
  };
  var baseCoach = SF.coachLine;
  SF.coachLine = function (s) {
    if (s && s.player && s.player.grapple && !s.hints.hook && s.mode === "play") {
      return "Hold HOOK, aim with the stick, then let go.";
    }
    if (s && SF.islandId === "cinderveil" && s.mode === "play" && !s.player.grapple && SF.dist(s.player.x, s.player.y, 620, 40) < 80) {
      return "This gap is too wide. Tamsin's hook will cross it.";
    }
    var line = baseCoach(s);
    if (SF.islandId === "cinderveil" && line && (line.indexOf("span") !== -1 || line.indexOf("Dash from the lip") !== -1)) return "";
    return line;
  };
})();

SF.CINDER_SHARDS = 3;

(function wireCinderTalk() {
  var arrive = SF.dialogueNodes && SF.dialogueNodes["cinderveil.kestrel.arrive"];
  if (arrive && !arrive.onEnd) arrive.onEnd = "cinder_land";
  var hesk = SF.dialogueNodes && SF.dialogueNodes["cinderveil.hesk.rumor"];
  if (hesk && !hesk.onEnd) hesk.onEnd = "meet_hesk";

  SF.cinderNode = function (who, s) {
    if (SF.islandId !== "cinderveil" || !who) return "";
    var f = (s && s.flags) || {};
    if (who === "kestrel") {
      if (!f.metCinderKestrel) return "cinderveil.kestrel.arrive";
      if (f.cantor_choice && !f.epilogueHeard) return "cinderveil.kestrel.epilogue_" + f.cantor_choice;
      return "";
    }
    if (who === "tamsin") {
      if (s && s.player && s.player.grapple) return "bark.tamsin.bench";
      if (f.cogsStarted && s && (s.cogs || 0) >= 3) return "cinderveil.tamsin.grapple_gift";
      if (f.cogsStarted) return "cinderveil.tamsin.cogs_waiting";
      return "cinderveil.tamsin.cogs_start";
    }
    if (who === "hesk") return f.metHesk ? "bark.hesk.crate" : "cinderveil.hesk.rumor";
    if (who === "ilsa") {
      if (!s || !s.player || !s.player.grapple) return "bark.ilsa.no_grapple";
      if (!f.vaultOpen) return "cinderveil.ilsa.trial";
      return "";
    }
    if (who === "cantor") {
      if (f.cantor_choice || f.act1 || f.cantorGone) return "";
      return "cinderveil.cantor.confront";
    }
    return "";
  };
  if (SF.dialogueRouters) SF.dialogueRouters.unshift(SF.cinderNode);

  SF.onDialogueEvent("quest_cogs_start", function () {
    var s = SF.state;
    if (!s) return;
    s.flags.metTamsin = true;
    if (s.flags.cogsStarted) return;
    s.flags.cogsStarted = true;
    if (!s.player.grapple) s.quest = "cogs";
    SF.saveGame({ silent: true });
  });

  SF.onDialogueEvent("grant_grapple", function () {
    var s = SF.state;
    if (!s) return;
    s.flags.metTamsin = true;
    if (s.player.grapple) return;
    s.player.grapple = true;
    s.flags.grapple = true;
    if (s.quest === "cogs" || s.quest === "quay") s.quest = "vault";
    SF.pushBanner("The grapple", "Aim at a hook point. Don't let go over the Hush.");
    SF.saveGame({ silent: true });
  });

  SF.onDialogueEvent("vault_open", function () {
    var s = SF.state;
    if (!s || s.flags.vaultOpen) return;
    s.flags.metIlsa = true;
    s.flags.vaultOpen = true;
    if (s.quest === "vault" || s.quest === "cogs") s.quest = "trial";
    var ledge = SF.spot ? SF.spot("vledge") : null;
    var lx = ledge ? ledge.x : 98 * 16;
    var ly = ledge ? ledge.y : 34 * 16;
    if (SF.setCheckpoint) SF.setCheckpoint(lx, ly);
    else s.checkpoint = { x: lx, y: ly, island: "cinderveil" };
    SF.pushToast("The gap is yours.", 2.2);
    SF.saveGame({ silent: true });
  });

  SF.onDialogueEvent("boss_start", function () {
    var s = SF.state;
    if (!s || s.flags.mawDead) return;
    if (s.mode === "battle") return;
    s.flags.mawFight = true;
    s.quest = "maw";
    var ledge = SF.spot ? SF.spot("vledge") : null;
    var lx = ledge ? ledge.x : 98 * 16;
    var ly = ledge ? ledge.y : 34 * 16;
    if (SF.setCheckpoint) SF.setCheckpoint(lx, ly);
    else s.checkpoint = { x: lx, y: ly, island: "cinderveil" };
    if (SF.wakeMaw) SF.wakeMaw();
    SF.pushBanner("The Cinder Maw", "A bright point of light pulses in the middle of its chest.");
    SF.saveGame({ silent: true });
    if (s.mode === "dialogue") {
      s.dialogue = null;
      s.mode = "play";
    }
    if (SF.Battle) SF.Battle.start("boss_cinder_maw", {
      boss: true,
      canFlee: false,
      fixed: true,
      fieldId: "maw",
      zoneLevel: 8,
      bg: "ember_vault"
    });
  });

  SF.onDialogueEvent("quest_cinder_lamp_done", function () {
    var s = SF.state;
    if (!s || s.flags.cinderLit) return;
    var need = SF.CINDER_SHARDS || 3;
    s.shardsHeld = Math.max(0, (s.shardsHeld || 0) - need);
    s.flags.cinderLit = true;
    s.quest = "cantor";
    if (SF.rememberCheckpoint && SF.LAMP) SF.rememberCheckpoint(SF.LAMP.x, SF.LAMP.y, { quiet: true, kind: "lamp" });
    if (SF.emit) SF.emit("lamp");
    SF.saveGame({ silent: true });
    if (!s.flags.cantor_choice && !s.flags.act1) {
      SF.beginCantorApproach();
      if (SF.startDialogue) SF.startDialogue("cinderveil.cantor.confront");
    }
  });

  SF.onDialogueEvent("act1_end", function () {
    var s = SF.state;
    if (!s) return;
    s.flags.act1 = true;
    s.flags.metCantor = true;
    s.flags.cantorGone = true;
    s.quest = "act1";
    if (SF.parkCantor && s.approach) SF.parkCantor();
    s.approach = null;
    if (!s.flags.epilogueHeard) {
      s.flags.needsEpilogue = true;
      var id = s.dialogue && s.dialogue.id ? String(s.dialogue.id) : "";
      if (id.indexOf("epilogue") < 0 && id.indexOf("act1.finale") < 0) SF.playEpilogue();
    }
    SF.saveGame({ silent: true });
  });

  SF.onDialogueEvent("epilogue_done", function () {
    var s = SF.state;
    if (!s) return;
    s.flags.epilogueHeard = true;
    s.flags.needsEpilogue = false;
    s.quest = "act1";
    SF.saveGame({ silent: true });
  });

  SF.onDialogueEvent("cinder_land", function () {
    var s = SF.state;
    if (!s) return;
    s.voyageTalk = false;
    if (s.voyage) s.voyage.talk = false;
    s.voyage = null;
    var first = !s.flags.metCinderKestrel;
    s.flags.metCinderKestrel = true;
    if (SF.islandId !== "cinderveil" && SF.travelTo) SF.travelTo("cinderveil");
    if (first && (s.quest === "hooked" || s.quest === "sail" || s.quest === "road" || s.quest === "stirring")) s.quest = "quay";
    SF.saveGame({ silent: true });
  });

  SF.onDialogueEvent("meet_hesk", function () {
    var s = SF.state;
    if (!s) return;
    s.flags.metHesk = true;
    s.discovered.vault = true;
    SF.saveGame({ silent: true });
  });
})();

SF.parkCantor = function () {
  var s = SF.state;
  if (!s || !s.approach) return;
  s.cantorAt = { x: s.approach.toX, y: s.approach.toY };
  s.approach = null;
  if (s.dialogue && s.dialogue.holdForApproach) {
    s.dialogue.holdForApproach = false;
    s.dialogue.lock = 0;
  }
};

SF.cantorWorldPos = function () {
  var s = SF.state;
  if (!s) return null;
  if (s.approach && s.approach.kind === "cantor") {
    var a = s.approach;
    var u = a.dur <= 0 ? 1 : Math.max(0, Math.min(1, a.t / a.dur));
    var k = u * u * (3 - 2 * u);
    return {
      x: a.fromX + (a.toX - a.fromX) * k,
      y: a.fromY + (a.toY - a.fromY) * k
    };
  }
  if (s.cantorAt) return { x: s.cantorAt.x, y: s.cantorAt.y };
  return null;
};

SF.beginCantorApproach = function () {
  var s = SF.state;
  if (!s || s.approach) return;
  if (s.flags.cantor_choice || s.flags.act1 || s.flags.cantorGone) return;
  if (SF.islandId === "cinderveil" && SF.LAMP && SF.walkable(SF.LAMP.x, SF.LAMP.y)) {
    if (SF.dist(s.player.x, s.player.y, SF.LAMP.x, SF.LAMP.y) > 220) {
      s.player.x = SF.LAMP.x;
      s.player.y = SF.LAMP.y;
      s.player.safeX = SF.LAMP.x;
      s.player.safeY = SF.LAMP.y;
      s.player.px = SF.LAMP.x;
      s.player.py = SF.LAMP.y;
      s.camX = SF.LAMP.x;
      s.camY = SF.LAMP.y;
    }
  }
  s.approach = {
    kind: "cantor",
    t: 0,
    dur: 3.1,
    fromX: SF.LAMP ? SF.LAMP.x + 48 : 0,
    fromY: SF.LAMP ? SF.LAMP.y : 0,
    toX: (SF.npcById("cantor") || SF.LAMP || { x: 0, y: 0 }).x,
    toY: (SF.npcById("cantor") || SF.LAMP || { x: 0, y: 0 }).y
  };
};

SF.ilsaStand = function () {
  var lamp = SF.LAMP;
  if (!lamp) return { x: 0, y: 0 };
  var p = SF.state && SF.state.player;
  var baseX = lamp.x + 2;
  var y = lamp.y + 8;
  var side = p && p.x > baseX ? -1 : 1;
  var x = baseX + side * 84;
  if (p && Math.hypot(p.x - x, p.y - y) < 36) x = baseX - side * 80;
  return { x: x, y: y };
};

SF.beginIlsaApproach = function () {
  var s = SF.state;
  if (!s || !SF.LAMP || SF.islandId !== "cinderveil") return;
  if (s.ilsaAt || s.ilsaWalk) return;
  var stand = SF.ilsaStand();
  var lamp = SF.LAMP;
  var center = lamp.x;
  var p = s.player;
  var side = stand.x < center ? -1 : 1;
  // The cut is only ~32px wide. Pick a side of it before the climb.
  var climbX = center + side * 12;
  if (p && Math.abs(p.x - climbX) < 24) {
    var otherX = center - side * 12;
    if (Math.abs(p.x - otherX) >= 24) climbX = otherX;
    else climbX = center + (p.x <= center ? 12 : -12);
  }
  // Shoulders stay open beside the upper cliff. The shelf between the
  // cliffs is the cross below the lamp, clear of whoever stands at the top.
  var shoulder = side < 0 ? center - 76 : center + 88;
  if (p && Math.abs(p.x - shoulder) < 28) shoulder += side * 24;
  var crossY = 248;
  var below = lamp.y + 56;
  var hh = (SF.viewH || 720) / 2;
  var fromY = Math.max(crossY + 120, (s.camY || crossY) + hh + 28);
  var pts = [
    { x: climbX, y: fromY },
    { x: climbX, y: crossY },
    { x: shoulder, y: crossY },
    { x: shoulder, y: below },
    { x: stand.x, y: below },
    { x: stand.x, y: stand.y }
  ];
  var length = 0;
  var i;
  for (i = 0; i < pts.length - 1; i++) length += Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);
  s.ilsaWalk = {
    t: 0,
    dur: Math.max(2.4, Math.min(3.6, length / 150)),
    pts: pts,
    toX: stand.x,
    toY: stand.y,
    face: "up"
  };
};

SF.ensureIlsaOnRidge = function () {
  var s = SF.state;
  if (!s || !SF.LAMP || SF.islandId !== "cinderveil") return;
  if (s.ilsaAt || s.ilsaWalk) return;
  s.ilsaAt = SF.ilsaStand();
};

SF.parkIlsa = function () {
  var s = SF.state;
  if (!s || !s.ilsaWalk) return;
  s.ilsaAt = { x: s.ilsaWalk.toX, y: s.ilsaWalk.toY };
  s.ilsaWalk = null;
};

SF.ilsaWorldPos = function () {
  var s = SF.state;
  if (!s) return null;
  var a = s.ilsaWalk;
  if (a && a.pts && a.pts.length > 1) {
    var pts = a.pts;
    var lens = [];
    var total = 0;
    var i, len;
    for (i = 0; i < pts.length - 1; i++) {
      len = Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);
      lens.push(len);
      total += len;
    }
    var u = a.dur <= 0 ? 1 : Math.max(0, Math.min(1, a.t / a.dur));
    var remain = u * total;
    for (i = 0; i < lens.length; i++) {
      if (remain <= lens[i] || i === lens.length - 1) {
        var k = lens[i] ? Math.max(0, Math.min(1, remain / lens[i])) : 1;
        var dx = pts[i + 1].x - pts[i].x;
        var dy = pts[i + 1].y - pts[i].y;
        a.face = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "left" : "right") : (dy < 0 ? "up" : "down");
        return { x: pts[i].x + dx * k, y: pts[i].y + dy * k };
      }
      remain -= lens[i];
    }
  }
  if (s.ilsaAt) return { x: s.ilsaAt.x, y: s.ilsaAt.y };
  return null;
};

SF.ilsaFace = function () {
  var a = SF.state && SF.state.ilsaWalk;
  return (a && a.face) || "up";
};

SF.ilsaWalking = function () {
  return !!(SF.state && SF.state.ilsaWalk);
};

SF.quaySkiff = function () {
  var prop = null;
  (SF.PROPS || []).forEach(function (p) {
    if (!prop && (p.kind === "airship" || p.kind === "skiff")) prop = p;
  });
  return prop;
};

SF.segmentOpen = function (x0, y0, x1, y1) {
  var dx = x1 - x0;
  var dy = y1 - y0;
  var dist = Math.hypot(dx, dy);
  var steps = Math.max(1, Math.ceil(dist / 12));
  var i, u;
  for (i = 1; i <= steps; i++) {
    u = i / steps;
    if (!SF.walkable(x0 + dx * u, y0 + dy * u)) return false;
  }
  return true;
};

SF.lampRoutePoint = function (s) {
  var lamp = SF.LAMP;
  if (!lamp) return null;
  var goal = { x: lamp.x, y: lamp.y };
  var p = s && s.player;
  if (!p || SF.islandId !== "cinderveil") return goal;
  // Standing on the lamp used to skip it and aim back down the stair.
  if (SF.dist(p.x, p.y, goal.x, goal.y) <= (SF.GUIDE_NEAR || 18)) return goal;
  var tile = 16;
  var marks = [
    { x: 41 * tile, y: 33 * tile },
    { x: 41 * tile, y: 24 * tile },
    { x: 41 * tile, y: 16 * tile },
    { x: 52 * tile, y: 10 * tile },
    { x: 75 * tile, y: 12 * tile },
    { x: 90 * tile, y: 12 * tile },
    goal
  ];
  var i, mark, toLamp, best, bestLamp, dx, dy, dist, steps, u, lx, ly, last, toward;
  best = null;
  bestLamp = Infinity;
  for (i = 0; i < marks.length; i++) {
    mark = marks[i];
    if (SF.dist(p.x, p.y, mark.x, mark.y) < 24) continue;
    if (!SF.segmentOpen(p.x, p.y, mark.x, mark.y)) continue;
    toLamp = SF.dist(mark.x, mark.y, goal.x, goal.y);
    if (toLamp < bestLamp) {
      bestLamp = toLamp;
      best = mark;
    }
  }
  if (best) return best;
  toward = SF.dist(p.x, p.y, 41 * tile, 33 * tile) <= SF.dist(p.x, p.y, 90 * tile, 12 * tile)
    ? { x: 41 * tile, y: 33 * tile }
    : { x: 90 * tile, y: 12 * tile };
  dx = toward.x - p.x;
  dy = toward.y - p.y;
  dist = Math.hypot(dx, dy) || 1;
  steps = Math.max(1, Math.ceil(dist / 12));
  last = { x: p.x, y: p.y };
  for (i = 1; i <= steps; i++) {
    u = i / steps;
    lx = p.x + dx * u;
    ly = p.y + dy * u;
    if (!SF.walkable(lx, ly)) break;
    last = { x: lx, y: ly };
  }
  return last;
};

SF.SKIFF_DROP = 60;

SF.epiCamera = function () {
  var prop = SF.quaySkiff();
  var kestrel = SF.npcById && SF.npcById("kestrel");
  var boatX = prop ? prop.x : (kestrel ? kestrel.x : 960);
  var boatY = prop ? prop.y + SF.SKIFF_DROP : (kestrel ? kestrel.y + 46 : 1710);
  var peopleX = kestrel ? kestrel.x + 14 : boatX;
  var vh = SF.viewH || 412;
  var screenY = vh * 0.42;
  return { x: (peopleX + boatX) * 0.5, y: boatY - screenY + vh / 2 };
};

SF.arriveQuay = function () {
  var s = SF.state;
  if (!s || SF._quayArrived) return;
  SF._quayArrived = true;
  var kestrel = SF.npcById("kestrel");
  var x = kestrel ? kestrel.x + 28 : SF.DOCKS.cinderveil.x;
  var y = kestrel ? kestrel.y - 8 : SF.DOCKS.cinderveil.y;
  if (!SF.walkable(x, y)) {
    x = SF.DOCKS.cinderveil.x;
    y = SF.DOCKS.cinderveil.y;
  }
  s.player.x = x;
  s.player.y = y;
  s.player.safeX = x;
  s.player.safeY = y;
  s.player.px = x;
  s.player.py = y;
  s.player.fall = 0;
  s.island = "cinderveil";
  var cam = SF.epiCamera();
  SF._epiCam = cam;
  s.camX = cam.x;
  s.camY = cam.y;
};

SF.beginDepart = function () {
  var s = SF.state;
  if (!s) return;
  s.act1Card = false;
  if (!SF._quayArrived && SF.arriveQuay) SF.arriveQuay();
  if (SF._veil && SF._veil.phase === "out") {
    SF._veil = { a: 1, to: 0, rate: 2.15, hold: 0.06, phase: "in" };
  }
  var fromX = SF._epiCam ? SF._epiCam.x : s.camX;
  var fromY = SF._epiCam ? SF._epiCam.y : s.camY;
  var drift = Math.min(90, (SF.viewW || 640) * 0.08);
  SF._depart = {
    t: 0,
    dur: 1.75,
    panDur: 0.85,
    fromX: fromX,
    fromY: fromY,
    camX: fromX + drift,
    camY: fromY + 12,
    lineT: 0,
    acked: false
  };
  SF._epiCam = null;
};

SF.showActCard = function () {
  var s = SF.state;
  if (!s || s.act1Card) return;
  s.act1Card = true;
  if (SF._dialogueUi) s.endcardLock = Date.now() + (SF.ENDCARD_LOCK_MS || 400);
  if (SF.syncUI) SF.syncUI();
};

SF.endDepart = function () {
  SF._depart = null;
};

SF.boatBoard = function () {
  var d = SF._depart;
  var s = SF.state;
  if (!d || !s || !s.dialogue || s.dialogue.id !== "cinderveil.act1.finale") return 0;
  var u = Math.max(0, Math.min(1, d.t / 0.3));
  return u * u * (3 - 2 * u);
};

SF.boatDeckDelta = function (who) {
  var prop = SF.quaySkiff && SF.quaySkiff();
  var s = SF.state;
  if (!prop || !s) return null;
  var deckX = prop.x;
  var deckY = prop.y + (SF.SKIFF_DROP || 32) - 10;
  if (who === "kestrel") {
    var kestrel = SF.npcById("kestrel");
    if (!kestrel) return null;
    return { x: deckX - 8 - kestrel.x, y: deckY - kestrel.y };
  }
  if (who === "player") {
    return { x: deckX + 12 - s.player.x, y: deckY - s.player.y };
  }
  return null;
};

SF.sceneActorNudge = function (who) {
  var d = SF._depart;
  var s = SF.state;
  if (!d || !s || !s.dialogue || s.dialogue.id !== "cinderveil.act1.finale") return null;
  if (who !== "player" && who !== "kestrel" && who !== "skiff") return null;
  var u = d.dur <= 0 ? 1 : Math.max(0, Math.min(1, d.t / d.dur));
  var k = u * u * (3 - 2 * u);
  var x = 980 * k;
  var y = 72 * k;
  if (who !== "skiff") {
    var deck = SF.boatDeckDelta(who);
    var board = SF.boatBoard();
    if (deck) {
      x += deck.x * board;
      y += deck.y * board;
    }
  }
  return { x: x, y: y };
};

SF.tickActVisuals = function (dt) {
  var s = SF.state;
  if (!s || !(dt > 0)) return;
  var wake = s.dialogue && s.dialogue.id === "emberhold.wake";
  if (wake) SF._duskAmt = 1;
  else if (SF._duskAmt > 0) SF._duskAmt = Math.max(0, SF._duskAmt - dt / 0.9);
  var veil = SF._veil;
  if (veil) {
    if (veil.hold > 0) veil.hold -= dt;
    else {
      var step = (veil.rate || 2) * dt;
      if (veil.a < veil.to) veil.a = Math.min(veil.to, veil.a + step);
      else if (veil.a > veil.to) veil.a = Math.max(veil.to, veil.a - step);
      if (veil.phase === "out" && veil.a >= 0.985) {
        if (SF.arriveQuay) SF.arriveQuay();
        SF._veil = { a: 1, to: 0, rate: 2.15, hold: 0.08, phase: "in" };
      } else if (veil.to === 0 && veil.a <= 0.001) SF._veil = null;
    }
  }
  if (s.ilsaWalk) {
    s.ilsaWalk.t += dt;
    if (s.ilsaWalk.t >= s.ilsaWalk.dur) SF.parkIlsa();
  }
  (s.enemies || []).forEach(function (e) {
    if (!e.ash) return;
    e.ash.t += dt;
    if (e.ash.t > 0.18 && SF.spawnAsh) {
      e.ash.acc = (e.ash.acc || 0) + dt;
      while (e.ash.acc >= 0.05) {
        e.ash.acc -= 0.05;
        SF.spawnAsh(e.x + (Math.random() - 0.5) * 28, e.y - 16 + (Math.random() - 0.5) * 18);
        if (Math.random() < 0.45) SF.spawnAsh(e.x + (Math.random() - 0.5) * 22, e.y - 10 + (Math.random() - 0.5) * 14);
      }
    }
    if (e.ash.t >= e.ash.dur) {
      e.ash = null;
      e.dying = 0;
      e.alive = false;
    }
  });
  if (SF._depart && s.dialogue && s.dialogue.id === "cinderveil.act1.finale") {
    SF._depart.t += dt;
    SF._depart.lineT = (SF._depart.lineT || 0) + dt;
    if (SF._depart.t >= SF._depart.dur) {
      SF._depart.t = SF._depart.dur;
      var read = SF._depart.acked || SF._depart.lineT >= 4.5;
      if (read && s.dialogue.done) SF.showActCard();
    }
  }
};

SF.clearLampBanner = function () {
  var s = SF.state;
  if (!s) return;
  s.lampBanner = false;
  if (s.banner && s.banner.title === "Cinderveil's lamp") s.banner = null;
  if (s.banners) {
    s.banners = s.banners.filter(function (b) { return b.title !== "Cinderveil's lamp"; });
  }
};

SF.playEpilogue = function () {
  var s = SF.state;
  if (!s || s.flags.epilogueHeard) return;
  var choice = s.flags.cantor_choice;
  if (choice !== "spare" && choice !== "listen" && choice !== "refuse") return;
  var playing = s.dialogue && s.dialogue.id ? String(s.dialogue.id) : "";
  if (playing.indexOf("epilogue_" + choice) >= 0 || playing.indexOf("act1.finale") >= 0) return;
  s.flags.cantorGone = true;
  s.flags.needsEpilogue = true;
  s.approach = null;
  s.cantorAt = null;
  s.ilsaWalk = null;
  s.ilsaAt = null;
  s.act1Card = false;
  SF._quayArrived = false;
  SF._epiCam = null;
  SF._depart = null;
  SF._veil = { a: 0, to: 1, rate: 2.7, hold: 0, phase: "out" };
  if (SF.islandId !== "cinderveil" && SF.mountIsland) SF.mountIsland("cinderveil");
  if (SF.startDialogue) SF.startDialogue("cinderveil.kestrel.epilogue_" + choice);
};

SF.maybeCantor = function () {
  var s = SF.state;
  if (!s || s.mode !== "play" || s.dialogue || s.approach) return;
  if (SF.islandId !== "cinderveil") return;
  if (s.flags.needsEpilogue && s.flags.cantor_choice && !s.flags.epilogueHeard) {
    SF.playEpilogue();
    return;
  }
  if (s.flags.cantor_choice && !s.flags.act1 && !s.flags.epilogueHeard) {
    var reply = "cinderveil.cantor." + s.flags.cantor_choice;
    if (SF.dialogueNodes && SF.dialogueNodes[reply] && SF.startDialogue) SF.startDialogue(reply);
    return;
  }
  if (!s.flags.cantor_choice && !s.flags.act1 && s.flags.cinderLit && (s.flags.mawDead || s.quest === "cantor")) {
    SF.beginCantorApproach();
    if (SF.startDialogue) SF.startDialogue("cinderveil.cantor.confront");
  }
};
