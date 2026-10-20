import fs from "node:fs";
import vm from "node:vm";

const context = {};
context.window = context;
context.console = console;
const store = new Map();
context.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k)
};
vm.createContext(context);
for (const file of [
  "js/data.js",
  "js/content/dialogue/emberhold.js",
  "js/content/dialogue/cinderveil.js",
  "js/dialogue.js",
  "js/audio.js",
  "js/music.js",
  "js/sfx.js",
  "js/save.js",
  "js/sim.js",
  "js/cinder.js",
  "js/grapple.js"
]) {
  vm.runInContext(fs.readFileSync(file, "utf8"), context, { filename: file });
}

const SF = context.SF;
const issues = SF.audit();
if (issues.length) {
  console.error(issues.join("\n"));
  process.exit(1);
}
const cinderIssues = SF.auditCinder();
if (cinderIssues.length) {
  console.error(cinderIssues.join("\n"));
  process.exit(1);
}
if (SF.islandId !== "emberhold") {
  console.error("auditCinder did not restore Emberhold");
  process.exit(1);
}

SF.readMove = () => ({ x: 0, y: 0 });
SF.consumeDash = () => false;
SF.consumeAttack = () => false;
SF.consumeInteract = () => false;

function freshPlay() {
  const s = SF.fresh();
  s.mode = "play";
  SF.state = s;
  return s;
}

const s = freshPlay();
s.quest = "gather";
s.shardsHeld = 4;
s.player.x = 12;
s.player.y = 24;
s.player.safeX = 12;
s.player.safeY = 24;
s.flags.kestrelHint = true;
s.flags.cantor_choice = "refuse";
s.flags.asked_maren = "hand";
s.enemies[0].alive = false;
s.enemies[0].hp = 0;
const encoded = JSON.parse(JSON.stringify(SF.exportState(s)));
const restored = SF.fresh();
if (!SF.applySave(restored, encoded)) {
  console.error("applySave rejected a v1 save");
  process.exit(1);
}
if (restored.quest !== "gather" || restored.shardsHeld !== 4 || restored.flags.kestrelHint !== true) {
  console.error("save fields did not round-trip", restored.quest, restored.shardsHeld);
  process.exit(1);
}
if (restored.flags.cantor_choice !== "refuse" || restored.flags.asked_maren !== "hand") {
  console.error("dialogue flags did not round-trip", restored.flags.cantor_choice, restored.flags.asked_maren);
  process.exit(1);
}
if (Math.abs(restored.player.x - 12) > 0.01 || restored.enemies[0].alive !== false) {
  console.error("position or enemy alive did not round-trip");
  process.exit(1);
}
if (SF.applySave(SF.fresh(), { v: 99 })) {
  console.error("bad save version was accepted");
  process.exit(1);
}

SF.saveGame({ silent: true });
const fromDisk = SF.readSave();
if (!fromDisk || fromDisk.shardsHeld !== 4) {
  console.error("localStorage round-trip failed");
  process.exit(1);
}

const fight = freshPlay();
const wisp = fight.enemies[0];
const before = wisp.hp;
fight.player.x = wisp.x - 28;
fight.player.y = wisp.y;
fight.player.fx = 1;
fight.player.fy = 0;
SF.startSwing(fight.player);
for (let i = 0; i < 12; i++) SF.update(0.016);
if (wisp.hp >= before) {
  console.error("strike did not damage the wisp", wisp.hp);
  process.exit(1);
}

const brume = fight.enemies.find((e) => e.kind === "brumekin");
SF.damageEnemy(brume, brume.hp, 1, 0, 1);
if (brume.alive || !fight.drops["drop-" + brume.id]) {
  console.error("brumekin death did not leave a shard");
  process.exit(1);
}
if (fight.player.xp < SF.KINDS.brumekin.xp) {
  console.error("xp was not granted");
  process.exit(1);
}

const talk = freshPlay();
talk.player.x = SF.NPCS[0].x;
talk.player.y = SF.NPCS[0].y;
SF.tryInteract();
if (talk.mode !== "dialogue" || talk.dialogue.speaker !== "Old Maren") {
  console.error("Maren did not speak");
  process.exit(1);
}
let guard = 0;
while (talk.mode === "dialogue" && guard < 24) {
  talk.dialogue.lock = 0;
  if (talk.dialogue.phase === "choice") {
    const hand = talk.dialogue.choices.findIndex((c) => c.setFlags && c.setFlags.asked_maren === "hand");
    if (hand < 0) {
      console.error("Maren did not offer the hand question");
      process.exit(1);
    }
    SF.chooseDialogue(hand);
  } else SF.advanceDialogue();
  guard += 1;
}
if (talk.quest !== "gather" || !talk.flags.metMaren || talk.flags.asked_maren !== "hand") {
  console.error("quest did not start", talk.quest, talk.flags);
  process.exit(1);
}

const lamp = freshPlay();
lamp.shardsHeld = 5;
lamp.quest = "gather";
SF.tryLamp();
if (lamp.mode !== "cutscene") {
  console.error("lamp did not start the lighting");
  process.exit(1);
}
SF.update(3.4);
if (!lamp.flags.lampLit || !lamp.player.shardstep || lamp.quest !== "stirring" || lamp.shardsHeld !== 0) {
  console.error("lamp reward missing", lamp.flags.lampLit, lamp.player.shardstep, lamp.quest, lamp.shardsHeld);
  process.exit(1);
}

const calm = freshPlay();
for (let i = 0; i < 180; i++) SF.update(0.016);
if (calm.player.hp < calm.player.maxHp) {
  console.error("wisps reached the waking stones", calm.player.hp);
  process.exit(1);
}
const nearest = calm.enemies.reduce((best, e) => {
  const d = Math.hypot(e.x - calm.player.x, e.y - calm.player.y);
  return d < best ? d : best;
}, Infinity);
if (nearest < 70) {
  console.error("an enemy closed on the player at the stones", nearest);
  process.exit(1);
}

const span = SF.circle("span");
const gap = SF.circle("gap");
const dx = gap.x - span.x;
const dy = gap.y - span.y;
const len = Math.hypot(dx, dy);
const lip = {
  x: span.x + (dx / len) * (span.r - SF.WALK_MARGIN),
  y: span.y + (dy / len) * (span.r - SF.WALK_MARGIN)
};
const dash = freshPlay();
dash.player.x = lip.x;
dash.player.y = lip.y;
dash.player.fx = dx / len;
dash.player.fy = dy / len;
dash.player.safeX = lip.x;
dash.player.safeY = lip.y;
SF.startDash(dash.player);
let stepped = 0;
while (dash.player.dashT > 0 && stepped < 30) {
  SF.update(0.016);
  stepped += 1;
}
if (!SF.walkable(dash.player.x, dash.player.y)) {
  console.error("simulated dash from the lip did not land", dash.player.x, dash.player.y);
  process.exit(1);
}

const guide = freshPlay();
if (!SF.questText(guide).includes("Old Maren")) {
  console.error("opening objective is vague", SF.questText(guide));
  process.exit(1);
}
if (!SF.coachLine(guide).startsWith("Move:")) {
  console.error("opening lesson missing", SF.coachLine(guide));
  process.exit(1);
}
const goal = SF.objectivePoint(guide);
if (!goal || Math.hypot(goal.x - SF.NPCS[0].x, goal.y - SF.NPCS[0].y) > 1) {
  console.error("opening marker is not Maren", goal);
  process.exit(1);
}
guide.player.x = SF.LAMP.x;
guide.player.y = SF.LAMP.y;
guide.shardsHeld = 5;
guide.quest = "gather";
if (SF.actionFor(guide, SF.nearestInteract()).label !== "Place shards") {
  console.error("lamp did not offer Place shards", SF.actionFor(guide, SF.nearestInteract()));
  process.exit(1);
}
guide.shardsHeld = 1;
if (SF.actionFor(guide, SF.nearestInteract()).label !== "Inspect") {
  console.error("a cold lamp should be Inspect");
  process.exit(1);
}

const fall = freshPlay();
fall.player.x = 350;
fall.player.y = -85;
fall.player.px = 350;
fall.player.py = -85;
fall.player.safeX = 268;
fall.player.safeY = -100;
fall.player.fall = 0.3;
SF.update(0.02);
SF.update(0.02);
const fallText = (fall.toast && fall.toast.text) || (fall.toasts[0] && fall.toasts[0].text) || "";
if (fallText.indexOf("Try Dash") < 0) {
  console.error("a missed gap did not say to dash", fallText);
  process.exit(1);
}

const shard = freshPlay();
shard.quest = "gather";
SF.collectPickup({ id: "shard-meadow", kind: "shard", x: 55, y: -40 });
const banner = shard.banner || shard.banners[0];
if (!banner || banner.title.indexOf("1 of 5") < 0) {
  console.error("shard pickup was quiet", banner);
  process.exit(1);
}

const required = {
  "emberhold.maren.intro": null,
  "emberhold.maren.waiting": null,
  "emberhold.maren.lamp_lit": "quest_lamp_done",
  "emberhold.kestrel.offer_sail": "open_sail_menu",
  "cinderveil.kestrel.arrive": null,
  "cinderveil.tamsin.cogs_start": "quest_cogs_start",
  "cinderveil.tamsin.cogs_waiting": null,
  "cinderveil.tamsin.grapple_gift": "grant_grapple",
  "cinderveil.hesk.rumor": null,
  "cinderveil.ilsa.trial": "vault_open",
  "cinderveil.maw.prefight": "boss_start",
  "cinderveil.maw.defeated": null,
  "cinderveil.lamp.relit": "quest_cinder_lamp_done",
  "cinderveil.cantor.confront": "act1_end"
};
for (const [id, onEnd] of Object.entries(required)) {
  const node = SF.dialogueNodes[id];
  if (!node || !node.speaker || !node.lines || !node.lines.length) {
    console.error("missing dialogue node", id);
    process.exit(1);
  }
  if (onEnd && node.onEnd !== onEnd) {
    console.error("onEnd mismatch", id, node.onEnd);
    process.exit(1);
  }
}
const cantorChoices = SF.dialogueNodes["cinderveil.cantor.confront"].choices.map((c) => c.setFlags.cantor_choice);
if (cantorChoices.join(",") !== "spare,listen,refuse") {
  console.error("cantor choices", cantorChoices);
  process.exit(1);
}
const script = fs.readFileSync("docs/script/act1.md", "utf8");
for (const node of Object.values(SF.dialogueNodes)) {
  for (const line of node.lines) {
    if (!script.includes(line)) {
      console.error("script missing line from", node.id, line);
      process.exit(1);
    }
  }
  for (const choice of node.choices || []) {
    if (!script.includes(choice.text)) {
      console.error("script missing choice from", node.id, choice.text);
      process.exit(1);
    }
  }
}

const unknown = freshPlay();
SF.startDialogue("no.such.line");
if (unknown.mode !== "dialogue" || unknown.dialogue.lines.length !== 1) {
  console.error("unknown id did not placeholder");
  process.exit(1);
}
unknown.dialogue.lock = 0;
SF.advanceDialogue();
if (unknown.mode !== "play") {
  console.error("placeholder did not close");
  process.exit(1);
}
SF.startDialogue(null);
if (!SF.state.dialogue) {
  console.error("null id crashed");
  process.exit(1);
}

const ending = freshPlay();
SF.startDialogue("cinderveil.cantor.confront");
guard = 0;
while (ending.mode === "dialogue" && guard < 30) {
  ending.dialogue.lock = 0;
  if (ending.dialogue.phase === "choice") {
    const listen = ending.dialogue.choices.findIndex((c) => c.setFlags && c.setFlags.cantor_choice === "listen");
    SF.chooseDialogue(listen);
  } else SF.advanceDialogue();
  guard += 1;
}
if (ending.flags.cantor_choice !== "listen" || ending.mode !== "play") {
  console.error("cantor choice did not land", ending.flags.cantor_choice, ending.mode);
  process.exit(1);
}
SF.saveGame({ silent: true });
const kept = SF.readSave();
if (!kept || kept.flags.cantor_choice !== "listen") {
  console.error("cantor choice did not save");
  process.exit(1);
}

const thanks = freshPlay();
thanks.flags.lampLit = true;
thanks.flags.asked_maren = "hush";
SF.startDialogue("emberhold.maren.lamp_lit");
guard = 0;
while (thanks.mode === "dialogue" && thanks.dialogue.phase !== "choice" && guard < 12) {
  thanks.dialogue.lock = 0;
  SF.advanceDialogue();
  guard += 1;
}
const thankText = thanks.dialogue.choices.map((c) => c.text).join(" | ");
if (!thankText.includes("tide") || thankText.includes("longer step")) {
  console.error("lamp thanks ignored the hush flag", thankText);
  process.exit(1);
}

const sail = freshPlay();
sail.flags.lampLit = true;
sail.quest = "stirring";
sail.player.x = SF.NPCS[1].x;
sail.player.y = SF.NPCS[1].y;
SF.tryInteract();
guard = 0;
while (sail.mode === "dialogue" && guard < 24) {
  sail.dialogue.lock = 0;
  if (sail.dialogue.phase === "choice") SF.chooseDialogue(0);
  else SF.advanceDialogue();
  guard += 1;
}
if (sail.quest !== "hooked" || !sail.flags.kestrelAfter || sail.flags.sail_answer !== "yes") {
  console.error("sail offer did not hook the quest", sail.quest, sail.flags);
  process.exit(1);
}

if (typeof context.startDialogue !== "function") {
  console.error("startDialogue is not global");
  process.exit(1);
}

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

function finishTalk(state) {
  let guard = 0;
  while (state.mode === "dialogue" && guard < 48) {
    if (!state.dialogue) break;
    state.dialogue.lock = 0;
    if (state.dialogue.phase === "choice") SF.chooseDialogue(0);
    else SF.advanceDialogue();
    guard += 1;
  }
  if (state.mode === "dialogue") fail("talk did not finish " + (state.dialogue && state.dialogue.id));
}

function needMarker(label) {
  const goal = SF.objectivePoint(SF.state);
  if (!goal) fail("missing marker for " + label + " (" + SF.state.quest + ")");
}

const body = { x: 12, y: 24, fx: 1, fy: 0, hp: 40, maxHp: 40, xp: 0, level: 1, atk: 12, shardstep: false };
const v1Gather = SF.fresh();
if (!SF.applySave(v1Gather, { v: 1, quest: "gather", shardsHeld: 3, flags: { kestrelHint: true }, player: body, enemies: [] })) {
  fail("v1 gather save was rejected");
}
if (v1Gather.quest !== "gather" || v1Gather.flags.sailUnlocked) fail("v1 gather was migrated");

const v1Sail = SF.fresh();
if (!SF.applySave(v1Sail, { v: 1, quest: "hooked", flags: { lampLit: true }, player: Object.assign({}, body, { shardstep: true }), enemies: [] })) {
  fail("v1 hooked save was rejected");
}
if (v1Sail.quest !== "hooked" || !v1Sail.flags.sailUnlocked) fail("v1 hooked did not stay hooked with sailing open");

const v1Road = SF.fresh();
SF.applySave(v1Road, { v: 1, quest: "stirring", flags: { lampLit: true }, player: body, enemies: [] });
if (v1Road.quest !== "stirring" || !v1Road.flags.sailUnlocked) fail("v1 stirring did not keep its name");

if (SF.dialogueNodes["cinderveil.kestrel.arrive"].onEnd !== "cinder_land") fail("arrival does not land the skiff");
if (SF.dialogueNodes["cinderveil.hesk.rumor"].onEnd !== "meet_hesk") fail("Hesk is not remembered");

const road = freshPlay();
road.flags.lampLit = true;
road.player.shardstep = true;
road.quest = "stirring";
road.player.x = SF.NPCS[1].x;
road.player.y = SF.NPCS[1].y;
SF.tryInteract();
finishTalk(road);
if (road.quest !== "hooked" || !road.flags.sailUnlocked || road.mode !== "sailmenu") fail("sail menu did not open");
needMarker("sail");
SF.startVoyage("cinderveil");
if (context.Music.current() !== "sail") fail("the crossing did not take the sail theme");
if (road.mode !== "dialogue" || !road.dialogue || road.dialogue.id !== "cinderveil.sail.depart" || !road.voyageTalk) {
  fail("the crossing did not start with the sail scene");
}
finishTalk(road);
if (SF.islandId !== "cinderveil" || road.quest !== "quay" || !road.flags.metCinderKestrel || road.pendingTalk) {
  fail("landing did not reach Lowmoor Quay " + SF.islandId + " " + road.quest + " " + road.pendingTalk);
}
if (!context.Music || context.Music.current() !== "cinderveil") fail("Cinderveil did not take the theme");
needMarker("quay");

const tamsin = SF.npcById("tamsin");
road.player.x = tamsin.x;
road.player.y = tamsin.y;
SF.tryInteract();
finishTalk(road);
if (road.quest !== "cogs" || !road.flags.cogsStarted || road.flags.tamsin_mood !== "earnest") fail("cogs did not start");
needMarker("cogs");
["cog-link", "cog-ash", "cog-lip"].forEach((id) => {
  const cog = SF.PICKUPS.find((p) => p.id === id);
  SF.collectPickup(cog);
});
if (road.cogs !== 3) fail("cog count " + road.cogs);
SF.tryInteract();
finishTalk(road);
if (!road.player.grapple || road.quest !== "vault") fail("grapple was not granted");
needMarker("vault");

road.player.x = 600;
road.player.y = 40;
road.player.fx = 1;
road.player.fy = 0;
road.player.grappleCd = 0;
road.player.safeX = 600;
road.player.safeY = 40;
const heardSfx = [];
const origSfx = context.Sfx.play.bind(context.Sfx);
context.Sfx.play = (name, opts) => {
  heardSfx.push(name);
  return origSfx(name, opts);
};
if (!SF.fireGrapple(road.player, { x: 1, y: 0 })) fail("first hook did not fire");
if (heardSfx.indexOf("grapple") < 0 || heardSfx.indexOf("pull") < 0) fail("the hook was silent");
let hops = 0;
while (road.player.grappleT > 0 && hops < 40) {
  SF.update(0.02);
  hops += 1;
}
if (!SF.walkable(road.player.x, road.player.y) || road.player.x < 760) {
  fail("first hook missed the vault lip " + road.player.x + "," + road.player.y);
}
if (heardSfx.indexOf("latch") < 0) fail("the hook did not latch");

const ilsa = SF.npcById("ilsa");
road.player.x = ilsa.x;
road.player.y = ilsa.y;
SF.tryInteract();
finishTalk(road);
if (!road.flags.vaultOpen || road.quest !== "trial") fail("Ilsa did not open the vault");
needMarker("trial");

road.player.x = 1060;
road.player.y = 20;
road.player.fx = 1;
road.player.fy = 0;
road.player.grappleCd = 0;
road.player.safeX = 1060;
road.player.safeY = 20;
road.player.hp = road.player.maxHp;
if (!SF.fireGrapple(road.player, { x: 1, y: 0 })) fail("vault hook did not fire");
hops = 0;
while (road.player.grappleT > 0 && hops < 40) {
  SF.update(0.02);
  hops += 1;
}
if (!SF.walkable(road.player.x, road.player.y) || road.player.x < 1200) {
  fail("vault hook missed the heart " + road.player.x + "," + road.player.y);
}
SF.update(0.02);
if (road.quest !== "seal") fail("the heart did not become the seal step");
needMarker("seal");

road.player.x = 1320;
road.player.y = 20;
SF.tryInteract();
if (!road.dialogue || road.dialogue.id !== "cinderveil.maw.prefight") fail("the Maw did not speak");
finishTalk(road);
const maw = road.enemies.find((e) => e.kind === "maw");
if (!road.flags.mawFight || !maw || maw.dormant || road.quest !== "maw") fail("the Maw did not wake");
if (context.Music.current() !== "boss") fail("the Maw did not take the boss theme");
needMarker("maw");
SF.damageEnemy(maw, maw.maxHp, 1, 0, 1);
if (!road.flags.mawDead || road.quest !== "relight" || !road.dialogue || road.dialogue.id !== "cinderveil.maw.defeated") {
  fail("the Maw did not fall");
}
finishTalk(road);
needMarker("relight");

road.shardsHeld = 2;
road.player.x = SF.LAMP.x;
road.player.y = SF.LAMP.y;
SF.tryInteract();
if (!road.dialogue || road.dialogue.id !== "inspect.cinder_core") fail("two shards should only inspect the core");
finishTalk(road);
if (road.flags.cinderLit) fail("two shards lit the core");
road.shardsHeld = 3;
SF.tryInteract();
if (!road.dialogue || road.dialogue.id !== "cinderveil.lamp.relit") fail("the core did not relight");
finishTalk(road);
if (!road.flags.cinderLit || road.quest !== "cantor" || road.shardsHeld !== 0) fail("the Cantor was not called");
needMarker("cantor");

const cantor = SF.npcById("cantor");
road.player.x = cantor.x;
road.player.y = cantor.y;
SF.tryInteract();
finishTalk(road);
if (road.flags.cantor_choice !== "spare" || road.quest !== "act1") fail("Spare did not end Act 1");
if (SF.objectivePoint(road)) fail("Act 1 should rest without a marker");

const yanked = freshPlay();
SF.mountIsland("cinderveil");
yanked.island = "cinderveil";
yanked.enemies = SF.makeEnemies();
yanked.player.grapple = true;
yanked.player.x = 300;
yanked.player.y = 80;
yanked.player.fx = 1;
yanked.player.fy = 0;
const mite = yanked.enemies.find((e) => e.id === "ashmite-west");
mite.x = 360;
mite.y = 80;
if (!SF.fireGrapple(yanked.player, { x: 1, y: 0 })) fail("could not hook a small foe");
if (yanked.player.grapplePull !== "yank") fail("small foe was not pulled");
SF.mountIsland("emberhold");

console.log("smoke ok");
