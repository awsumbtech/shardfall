import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import { spawnSync } from "node:child_process";

const shotDir = process.env.SF_SHOTS || fs.mkdtempSync(path.join(os.tmpdir(), "shardfall-smoke-"));
fs.mkdirSync(shotDir, { recursive: true });
const childEnv = Object.assign({}, process.env, { SF_SHOTS: shotDir });

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
  "js/data/skills.js",
  "js/data/items.js",
  "js/data/party.js",
  "js/data/enemies.js",
  "js/data/encounters.js",
  "js/content/dialogue/emberhold.js",
  "js/content/dialogue/cinderveil.js",
  "js/content/dialogue/world.js",
  "js/dialogue.js",
  "js/audio.js",
  "js/music.js",
  "js/sfx.js",
  "js/save.js",
  "js/sim.js",
  "js/cinder.js",
  "js/content/maps/kinds.js",
  "js/content/maps/chart.js",
  "js/content/maps/emberhold.js",
  "js/content/maps/cinderveil.js",
  "js/content/maps/saltmere.js",
  "js/content/maps/highspire.js",
  "js/content/maps/gullrock.js",
  "js/content/maps/drift.js",
  "js/content/maps/v2layout.js",
  "js/grapple.js",
  "js/battle/battle.js",
  "js/menu/field.js",
  "js/world.js"
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
if (s.enemies[0]) {
  s.enemies[0].alive = false;
  s.enemies[0].hp = 0;
}
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
if (!SF.walkable(restored.player.x, restored.player.y)) {
  console.error("restored position is not walkable", restored.player.x, restored.player.y);
  process.exit(1);
}
if (restored.enemies[0] && restored.enemies[0].alive !== false) {
  console.error("enemy alive did not round-trip");
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
if (SF.startSwing(fight.player)) {
  console.error("the field strike still starts");
  process.exit(1);
}
for (let i = 0; i < 12; i++) SF.update(0.016);
if (fight.mode === "battle") {
  console.error("standing still started a fight");
  process.exit(1);
}
SF.Battle.start("em_wisps", { zoneLevel: 3, bg: "emberhold_meadow" });
if (fight.mode !== "battle" || !fight.battle || fight.battle.id !== "em_wisps") {
  console.error("a meadow fight did not start", fight.mode, fight.battle && fight.battle.id);
  process.exit(1);
}
fight.battle = null;
fight.mode = "play";

const talk = freshPlay();
talk.player.x = SF.NPCS[0].x;
talk.player.y = SF.NPCS[0].y;
SF.tryInteract();
if (talk.mode !== "dialogue" || talk.dialogue.speaker !== "Old Maren") {
  console.error("Maren did not speak");
  process.exit(1);
}
let guard = 0;
let askedHand = false;
let returned = false;
while (talk.mode === "dialogue" && guard < 24) {
  talk.dialogue.lock = 0;
  if (talk.dialogue.phase === "choice") {
    const hand = talk.dialogue.choices.findIndex((c) => c.setFlags && c.setFlags.asked_maren === "hand");
    if (hand >= 0) {
      askedHand = true;
      SF.chooseDialogue(hand);
    } else if (!askedHand) {
      console.error("Maren did not offer the hand question");
      process.exit(1);
    } else {
      returned = true;
      const go = talk.dialogue.choices.findIndex((c) => c.next === "emberhold.maren.intro_go");
      if (go < 0) {
        console.error("Maren did not return to the shard offer");
        process.exit(1);
      }
      const hush = talk.dialogue.choices.findIndex((c) => c.setFlags && c.setFlags.asked_maren === "hush");
      if (hush < 0) {
        console.error("Maren dropped the question that was not asked");
        process.exit(1);
      }
      SF.chooseDialogue(go);
    }
  } else SF.advanceDialogue();
  guard += 1;
}
if (!returned) {
  console.error("Maren's question did not return to the choices");
  process.exit(1);
}
if (talk.quest !== "gather" || !talk.flags.metMaren || !talk.flags.shard_sense || talk.flags.asked_maren !== "hand") {
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
  console.error("the waking stones did not stay safe", calm.player.hp);
  process.exit(1);
}
if (calm.mode === "battle") {
  console.error("the waking stones rolled a fight");
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
const spanC = SF.circle("span");
const gapC = SF.circle("gap");
fall.player.x = (spanC.x + gapC.x) / 2;
fall.player.y = (spanC.y + gapC.y) / 2;
fall.player.px = fall.player.x;
fall.player.py = fall.player.y;
fall.player.safeX = spanC.x;
fall.player.safeY = spanC.y;
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
  "cinderveil.maw.prefight": null,
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
const mawAsk = SF.dialogueNodes["cinderveil.maw.prefight"];
const mawLast = SF.lineText(mawAsk.lines[mawAsk.lines.length - 1]);
if (mawLast !== "Fight the Cinder Maw?") {
  console.error("maw confirm line", mawLast);
  process.exit(1);
}
const mawNarr = mawAsk.lines.map((line) => SF.lineText(line)).join(" ");
if (mawNarr.indexOf("That's where to hit it") >= 0 || mawNarr.indexOf("A bright point of light pulses in the middle of its chest.") < 0) {
  console.error("maw narration", mawNarr);
  process.exit(1);
}
const mawChoices = (mawAsk.choices || []).map((c) => c.text + ":" + (c.event || ""));
if (mawChoices.join(",") !== "Yes:boss_start,Not yet:" || mawAsk.onEnd) {
  console.error("maw choices", mawChoices, mawAsk.onEnd);
  process.exit(1);
}
const cantorChoices = SF.dialogueNodes["cinderveil.cantor.confront"].choices.map((c) => c.setFlags.cantor_choice);
if (cantorChoices.join(",") !== "spare,listen,refuse") {
  console.error("cantor choices", cantorChoices);
  process.exit(1);
}
const script = fs.readFileSync("docs/script/act1.md", "utf8");
function norm(text) {
  return String(text || "").replace(/\*/g, "").toLowerCase();
}
const scriptNorm = norm(script);
for (const node of Object.values(SF.dialogueNodes)) {
  for (const line of node.lines) {
    const text = SF.lineText ? SF.lineText(line) : (typeof line === "string" ? line : line.text);
    if (text === "(Script pending)") continue;
    const shown = norm(text);
    if (shown.includes("the camera")) {
      console.error("stage direction on screen", node.id, text);
      process.exit(1);
    }
    const parts = shown.split(/(?<=[.!?])\s+/).filter(Boolean);
    const covered = scriptNorm.includes(shown) || (parts.length > 1 && parts.every((part) => scriptNorm.includes(part)));
    if (!covered) {
      console.error("script missing line from", node.id, text);
      process.exit(1);
    }
  }
  for (const choice of node.choices || []) {
    if (!scriptNorm.includes(norm(choice.text))) {
      console.error("script missing choice from", node.id, choice.text);
      process.exit(1);
    }
  }
}
if (!SF.dialogueNodes["bark.ilsa.no_grapple"]) {
  console.error("missing bark.ilsa.no_grapple");
  process.exit(1);
}
["spare", "listen", "refuse"].forEach((choice) => {
  const epi = SF.dialogueNodes["cinderveil.kestrel.epilogue_" + choice];
  const finale = SF.dialogueNodes["cinderveil.act1.finale"];
  if (!epi || epi.next !== "cinderveil.act1.finale" || epi.onEnd !== "epilogue_done") {
    console.error("epilogue is not wired", choice, epi && epi.next, epi && epi.onEnd);
    process.exit(1);
  }
  if (!finale || !norm(SF.lineText(finale.lines[0])).includes("highspire")) {
    console.error("finale does not name Highspire");
    process.exit(1);
  }
});

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
while (ending.mode === "dialogue" && guard < 40) {
  ending.dialogue.lock = 0;
  if (ending.dialogue.phase === "choice") {
    const listen = ending.dialogue.choices.findIndex((c) => c.setFlags && c.setFlags.cantor_choice === "listen");
    SF.chooseDialogue(listen);
  } else SF.advanceDialogue();
  guard += 1;
}
if (ending.flags.cantor_choice !== "listen" || ending.mode !== "play" || !ending.flags.epilogueHeard || ending.quest !== "act1") {
  console.error("cantor choice did not land", ending.flags.cantor_choice, ending.mode, ending.quest, ending.flags.epilogueHeard);
  process.exit(1);
}
SF.saveGame({ silent: true });
const kept = SF.readSave();
if (!kept || kept.flags.cantor_choice !== "listen") {
  console.error("cantor choice did not save");
  process.exit(1);
}

function heardLines(state) {
  const heard = [];
  let steps = 0;
  while (state.mode === "dialogue" && state.dialogue && state.dialogue.phase !== "choice" && steps < 24) {
    heard.push(state.dialogue.full);
    state.dialogue.lock = 0;
    SF.advanceDialogue();
    steps += 1;
  }
  return heard.join("\n");
}
const thanks = freshPlay();
thanks.flags.asked_maren = "hush";
SF.startDialogue("emberhold.maren.lamp_lit");
const hushText = heardLines(thanks);
if (!hushText.includes("pulling back from the cliffs") || hushText.includes("I still can't tell you")) {
  console.error("lamp thanks ignored the hush flag", hushText);
  process.exit(1);
}
if (thanks.mode !== "play" || (thanks.dialogue && thanks.dialogue.choices && thanks.dialogue.choices.length)) {
  console.error("lamp thanks should close without a reply");
  process.exit(1);
}
const handThanks = freshPlay();
handThanks.flags.asked_maren = "hand";
SF.startDialogue("emberhold.maren.lamp_lit");
const handText = heardLines(handThanks);
if (!handText.includes("I still can't tell you") || handText.includes("pulling back from the cliffs")) {
  console.error("lamp thanks ignored the hand flag", handText);
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

const askSail = freshPlay();
askSail.flags.lampLit = true;
askSail.flags.met_cantor = true;
SF.startDialogue("emberhold.kestrel.offer_sail");
guard = 0;
let askedWaiting = false;
let sailBack = false;
while (askSail.mode === "dialogue" && guard < 24) {
  askSail.dialogue.lock = 0;
  if (askSail.dialogue.phase === "choice") {
    const waiting = askSail.dialogue.choices.findIndex((c) => c.next === "emberhold.kestrel.sail_what");
    const letsGo = askSail.dialogue.choices.findIndex((c) => c.next === "emberhold.kestrel.sail_yes");
    if (!askedWaiting && waiting >= 0) {
      askedWaiting = true;
      if (letsGo < 0) {
        console.error("Let's go was missing beside What's waiting");
        process.exit(1);
      }
      SF.chooseDialogue(waiting);
    } else if (askedWaiting && letsGo >= 0 && waiting < 0) {
      sailBack = true;
      SF.chooseDialogue(letsGo);
    } else {
      console.error("Kestrel's offer did not keep Let's go", askSail.dialogue.choices.map((c) => c.text));
      process.exit(1);
    }
  } else SF.advanceDialogue();
  guard += 1;
}
if (!sailBack || askSail.flags.sail_answer !== "yes" || !askSail.flags.sail_asked) {
  console.error("What's waiting skipped Let's go", askSail.flags);
  process.exit(1);
}
const firstMeet = askSail.dialogueNodes ? null : SF.dialogueNodes["emberhold.kestrel.offer_sail"].lines[0];
if (!firstMeet || !String(firstMeet.text || firstMeet).includes("Kestrel Vane")) {
  console.error("offer_sail lost Kestrel's introduction");
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
  while (state.mode === "dialogue" && guard < 80) {
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
if (road.quest !== "cogs" || !road.flags.cogsStarted) fail("cogs did not start");
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

const ilsaFirst = SF.npcById("ilsa");
road.player.x = ilsaFirst.x;
road.player.y = ilsaFirst.y;
SF.tryInteract();
finishTalk(road);
if (!road.flags.vaultOpen || road.quest !== "trial") fail("Ilsa did not open the vault");
needMarker("trial");

const cliffHook = SF.HOOKS.find((h) => h.id === "hook1-cliff");
const ledgeHook = SF.HOOKS.find((h) => h.id === "hook1-ledge");
road.player.x = cliffHook.x;
road.player.y = cliffHook.y;
road.player.fx = 0;
road.player.fy = -1;
road.player.grappleCd = 0;
road.player.safeX = cliffHook.x;
road.player.safeY = cliffHook.y;
const heardSfx = [];
const origSfx = context.Sfx.play.bind(context.Sfx);
context.Sfx.play = (name, opts) => {
  heardSfx.push(name);
  return origSfx(name, opts);
};
if (!SF.fireGrapple(road.player, { x: 0, y: -1 })) fail("first hook did not fire");
if (heardSfx.indexOf("grapple") < 0 || heardSfx.indexOf("pull") < 0) fail("the hook was silent");
let hops = 0;
while (road.player.grappleT > 0 && hops < 40) {
  SF.update(0.02);
  hops += 1;
}
if (!SF.walkable(road.player.x, road.player.y) || SF.dist(road.player.x, road.player.y, ledgeHook.x, ledgeHook.y) > 36) {
  fail("first hook missed the vault lip " + road.player.x + "," + road.player.y);
}
if (heardSfx.indexOf("latch") < 0) fail("the hook did not latch");

const upHook = SF.HOOKS.find((h) => h.id === "hook2-ledge");
const vaultHook = SF.HOOKS.find((h) => h.id === "hook2-vault");
road.player.x = upHook.x;
road.player.y = upHook.y;
road.player.fx = 0;
road.player.fy = -1;
road.player.grappleCd = 0;
road.player.safeX = upHook.x;
road.player.safeY = upHook.y;
road.player.hp = road.player.maxHp;
if (!SF.fireGrapple(road.player, { x: 0, y: -1 })) fail("vault hook did not fire");
hops = 0;
while (road.player.grappleT > 0 && hops < 40) {
  SF.update(0.02);
  hops += 1;
}
if (!SF.walkable(road.player.x, road.player.y) || SF.dist(road.player.x, road.player.y, vaultHook.x, vaultHook.y) > 36) {
  fail("vault hook missed the heart " + road.player.x + "," + road.player.y);
}
SF.update(0.02);
if (road.quest !== "seal") fail("the heart did not become the seal step");
needMarker("seal");

const mouth = SF.TEXTS.find((t) => t.id === "maw-mouth");
road.party.members.wayfarer.xp = SF.xpForLevel(8);
SF.levelMemberToXp(road, "wayfarer");
SF.syncFieldVitals(road);
road.player.hp = road.player.maxHp;
road.inventory.tonic = (road.inventory.tonic || 0) + 4;
road.player.x = mouth.x;
road.player.y = mouth.y;
SF.tryInteract();
if (!road.dialogue || road.dialogue.id !== "cinderveil.maw.prefight") fail("the Maw did not speak");
finishTalk(road);
const maw = road.enemies.find((e) => e.kind === "maw");
if (!road.flags.mawFight || !maw || maw.dormant || road.quest !== "maw") fail("the Maw did not wake");
if (context.Music.current() !== "boss") fail("the Maw did not take the boss theme");
needMarker("maw");
if (!road.battle || road.battle.id !== "boss_cinder_maw" || road.battle.canFlee) fail("the Maw talk did not start a locked fight");
if (SF.FOES.cinder_maw.hp !== 620 || SF.FOES.cinder_maw.atk !== 12 || SF.FOES.cinder_maw.mag !== 11 || SF.FOES.cinder_maw.def !== 13) {
  fail("Cinder Maw stats drifted from the Act 1 tune");
}
SF.Battle.instant = true;
const storyMaw = SF.Battle.autoResolve(120);
if (storyMaw !== "win") fail("the Maw did not fall (" + storyMaw + ")");
if (!road.flags.mawDead || road.quest !== "relight") fail("the Maw win did not continue");
if (!road.dialogue || road.dialogue.id !== "cinderveil.maw.defeated") {
  fail("the Maw did not fall");
}
finishTalk(road);
needMarker("relight");

road.shardsHeld = 2;
road.player.x = SF.LAMP.x;
road.player.y = SF.LAMP.y;
SF.tryInteract();
if (!road.dialogue || road.dialogue.id !== "inspect.cinder_lamp") fail("two shards should only inspect the lamp");
finishTalk(road);
if (road.flags.cinderLit) fail("two shards lit the core");
road.shardsHeld = 3;
SF.tryInteract();
if (!road.dialogue || road.dialogue.id !== "cinderveil.lamp.relit") fail("the core did not relight");
finishTalk(road);
if (!road.flags.cinderLit || road.shardsHeld !== 0) fail("the lamp did not take its shards");
if (road.flags.cantor_choice !== "spare" || road.quest !== "act1" || !road.flags.epilogueHeard || road.mode !== "play") {
  fail("Spare did not play through to the quay " + road.quest + " " + road.mode + " " + road.flags.cantor_choice);
}
if (SF.objectivePoint(road)) fail("Act 1 should rest without a marker");
if (SF.islandId !== "cinderveil") fail("the epilogue left Cinderveil");

const yanked = freshPlay();
SF.mountIsland("emberhold");
yanked.island = "emberhold";
yanked.enemies = [{
  id: "yank-wisp", kind: "wisp", x: yanked.player.x + 80, y: yanked.player.y,
  alive: true, dying: 0, dormant: false, hp: 10, maxHp: 10, r: 13, homeX: 0, homeY: 0
}];
yanked.player.grapple = true;
yanked.player.fx = 1;
yanked.player.fy = 0;
yanked.player.grappleCd = 0;
if (!SF.fireGrapple(yanked.player, { x: 1, y: 0 })) fail("could not hook a small foe");
if (yanked.player.grapplePull !== "yank") fail("small foe was not pulled");
SF.mountIsland("emberhold");

const gate = freshPlay();
SF.mountIsland("cinderveil");
gate.island = "cinderveil";
gate.enemies = SF.makeEnemies();
gate.player.grapple = false;
gate.player.x = SF.npcById("ilsa").x;
gate.player.y = SF.npcById("ilsa").y;
SF.tryInteract();
if (!gate.dialogue || gate.dialogue.id !== "bark.ilsa.no_grapple") fail("Ilsa let someone cross without a grapple");
SF.mountIsland("emberhold");

const past = SF.fresh();
if (!SF.applySave(past, {
  v: 2,
  quest: "cantor",
  island: "cinderveil",
  shardsHeld: 0,
  flags: {
    lampLit: true,
    shardstep: true,
    mawDead: true,
    cinderLit: true,
    vaultOpen: true,
    grapple: true,
    metCantor: true,
    heardChoir: true
  },
  discovered: { hollow: true },
  player: Object.assign({}, body, { x: 1450, y: -20, grapple: true, shardstep: true }),
  enemies: []
})) fail("past-boss save was rejected");
if (!past.flags.met_cantor) fail("a hollow meeting was not kept");
past.mode = "play";
SF.state = past;
SF.update(0.05);
if (!past.dialogue || past.dialogue.id !== "cinderveil.cantor.confront" || !past.approach) {
  fail("a save past the Maw did not bring the Cantor up");
}
const greeted = past.dialogue.lines.map((line) => SF.lineText(line)).join("\n");
if (!greeted.includes("Hello again") || greeted.includes("I've wanted to meet you")) {
  fail("the Cantor did not remember the hollow " + greeted);
}
const opening = past.dialogue.full;
SF.advanceDialogue();
if (!past.dialogue || past.dialogue.full !== opening || past.dialogue.i !== 0 || !past.approach) {
  fail("a tap cut the Cantor off while they were walking");
}
past.approach.t = past.approach.dur;
SF.update(0.2);
if (past.approach || !past.dialogue || past.dialogue.i !== 0 || past.dialogue.full !== opening) {
  fail("the walk skipped the Cantor's entrance");
}

const mid = SF.fresh();
if (!SF.applySave(mid, {
  v: 2,
  quest: "cantor",
  island: "cinderveil",
  flags: { lampLit: true, mawDead: true, cinderLit: true, cantor_choice: "listen" },
  player: Object.assign({}, body, { x: 20, y: 90 }),
  enemies: []
})) fail("mid-reply save was rejected");
mid.mode = "play";
SF.state = mid;
SF.update(0.05);
if (!mid.dialogue || mid.dialogue.id !== "cinderveil.cantor.listen") fail("a half-heard reply did not resume");

const quay = SF.fresh();
if (!SF.applySave(quay, {
  v: 2,
  quest: "act1",
  island: "cinderveil",
  flags: { lampLit: true, mawDead: true, cinderLit: true, act1: true, cantor_choice: "refuse", needsEpilogue: true },
  player: Object.assign({}, body, { x: 20, y: 90 }),
  enemies: []
})) fail("epilogue save was rejected");
quay.mode = "play";
SF.state = quay;
SF.update(0.05);
if (!quay.dialogue || quay.dialogue.id !== "cinderveil.kestrel.epilogue_refuse") fail("the quay epilogue did not resume");

const done = SF.fresh();
if (!SF.applySave(done, {
  v: 1,
  quest: "act1",
  flags: { lampLit: true, mawDead: true, cinderLit: true, act1: true, cantor_choice: "spare", metCantor: true },
  player: Object.assign({}, body, { x: 20, y: 90 }),
  enemies: []
})) fail("finished v1 save was rejected");
if (!done.flags.cantorGone || done.island !== "cinderveil") fail("a finished act did not stay finished");
done.mode = "play";
SF.state = done;
SF.update(0.05);
if (done.dialogue || done.mode !== "play") fail("a finished act started the Cantor again");

["spare", "listen", "refuse"].forEach((choice) => {
  const branch = freshPlay();
  SF.mountIsland("cinderveil");
  branch.island = "cinderveil";
  SF.startDialogue("cinderveil.cantor.confront");
  let steps = 0;
  let sawEpilogue = false;
  let sawFinale = false;
  while (branch.mode === "dialogue" && steps < 40) {
    if (branch.dialogue.id.indexOf("epilogue_" + choice) >= 0) sawEpilogue = true;
    if (branch.dialogue.id === "cinderveil.act1.finale") sawFinale = true;
    branch.dialogue.lock = 0;
    if (branch.dialogue.phase === "choice") {
      const pick = branch.dialogue.choices.findIndex((c) => c.setFlags && c.setFlags.cantor_choice === choice);
      SF.chooseDialogue(pick);
    } else SF.advanceDialogue();
    steps += 1;
  }
  if (!sawEpilogue || !sawFinale || branch.mode !== "play" || branch.flags.cantor_choice !== choice || !branch.flags.epilogueHeard) {
    fail(choice + " did not reach its epilogue and the end of the act");
  }
  if (!branch.flags.party_kestrel || !branch.flags.party_tamsin) {
    fail(choice + " did not add the party at the end of Act 1");
  }
  const joined = []
    .concat(branch.banner ? [branch.banner] : [])
    .concat(branch.banners || [])
    .map((row) => row.title);
  if (joined.indexOf("Kestrel joined the party.") < 0 || joined.indexOf("Tamsin joined the party.") < 0) {
    fail(choice + " did not announce both companions " + joined.join(" | "));
  }
});
SF.mountIsland("emberhold");

const ids = [
  "em_wisps", "em_brumekin", "em_choirling",
  "cv_ashlings", "cv_cinderhound", "cv_mixed", "boss_cinder_maw",
  "sm_saltwisps", "sm_drowned", "sm_gulls", "sm_mixed", "boss_tidewyrm",
  "hs_choir_patrol", "hs_sentinel", "sea_hush_raiders"
];
ids.forEach((id) => {
  const enc = SF.ENCOUNTERS[id];
  if (!enc || !enc.foes || !enc.foes.length || !enc.bg) fail("missing encounter " + id);
  enc.foes.forEach((kind) => {
    if (!SF.FOES[kind]) fail("encounter " + id + " uses unknown foe " + kind);
  });
});
if (SF.ENCOUNTERS.boss_cinder_maw.canFlee !== false || SF.ENCOUNTERS.boss_tidewyrm.canFlee !== false) {
  fail("boss encounters can be fled");
}
["tonic", "hi_tonic", "ether", "phoenix_shard", "smoke_bomb", "ember_salt", "tide_vial", "gale_powder", "shard_dust"].forEach((id) => {
  if (!SF.ITEMS[id]) fail("missing item " + id);
});

const battle = freshPlay();
SF.Battle.instant = true;
SF.Battle.start("em_wisps", { zoneLevel: 3, bg: "emberhold_meadow" });
if (!battle.battle || battle.battle.id !== "em_wisps") fail("meadow fight was not em_wisps");
const soloParty = battle.battle.actors.filter((a) => a.side === "party");
if (soloParty.length !== 1 || soloParty[0].key !== "wayfarer") fail("Act 1 battle was not solo");
if (context.Music.current() !== "battle") fail("battle music did not start");
const order = battle.battle.order || [];
if (order.length < 4) fail("turn strip is short " + order.length);
const actor = battle.battle.actors.find((a) => a.id === battle.battle.actorId);
if (!actor || actor.side !== "party") fail("the first ready actor was not the party");
const foe = battle.battle.actors.find((a) => a.side === "foe" && a.alive);
const hp0 = foe.hp;
SF.Battle.playerAct({ type: "skill", skillId: "attack", targetId: foe.id });
const struck = battle.battle && battle.battle.actors.find((a) => a.id === foe.id);
if (!struck || struck.hp >= hp0) fail("attack did not damage");
if (!struck.revealed || struck.weak !== "shard") fail("a hit did not show the Shard weakness");
if (!battle.battle.log.some((line) => line.indexOf("attacks") >= 0)) fail("attack log missing");
SF.Battle.playerAct({ type: "menu", menu: "skills" });
if (battle.battle.phase !== "skills") fail("skill menu did not open");
const beforeSp = battle.battle.actors.find((a) => a.key === "wayfarer").sp;
SF.Battle.playerAct({ type: "skill", skillId: "shard_bolt", targetId: foe.id });
const afterSp = battle.battle.actors.find((a) => a.key === "wayfarer");
if (!afterSp || afterSp.sp >= beforeSp) fail("Shard Bolt did not spend SP");
if (!SF.giveItem("tonic", 1)) fail("could not give a tonic");
const hurt = battle.battle.actors.find((a) => a.key === "wayfarer");
hurt.hp = Math.max(1, hurt.hp - 20);
const hpBefore = hurt.hp;
SF.Battle.playerAct({ type: "item", itemId: "tonic", targetId: hurt.id });
const healed = battle.battle.actors.find((a) => a.key === "wayfarer");
if (!healed || healed.hp <= hpBefore) fail("tonic did not heal");
SF.Battle.playerAct({ type: "defend" });
if (!battle.battle.log.some((line) => line.indexOf("defends") >= 0)) fail("defend log missing");
const goldBefore = battle.gold;
const outcome = SF.Battle.autoResolve(40);
if (outcome !== "win") fail("wisps were not defeated " + outcome);
if (battle.player.xp < 1) fail("xp was not shared");
if (battle.gold < goldBefore) fail("marks were not awarded");
if (battle.mode === "battle") fail("battle did not return to the field");

const guardTest = freshPlay();
SF.Battle.instant = true;
SF.Battle.start("cv_ash1");
const g = guardTest.battle;
const guardHero = g.actors.find((a) => a.side === "party");
const ash = g.actors.find((a) => a.side === "foe");
guardHero.hp = guardHero.maxHp;
guardHero.alive = true;
ash.hp = ash.maxHp;
ash.alive = true;
guardHero.guard = false;
SF.Battle.applyAction(g, ash, { type: "skill", skillId: "attack", targetId: guardHero.id });
const fullHit = guardHero.maxHp - guardHero.hp;
guardHero.hp = guardHero.maxHp;
guardHero.alive = true;
SF.Battle.applyAction(g, guardHero, { type: "defend" });
if (!guardHero.guard) fail("defend cleared guard before damage");
const guardedBefore = guardHero.hp;
SF.Battle.applyAction(g, ash, { type: "skill", skillId: "attack", targetId: guardHero.id });
const halfHit = guardedBefore - guardHero.hp;
if (!(fullHit > 0) || !(halfHit > 0) || Math.abs(halfHit * 2 - fullHit) > 1) {
  fail("guard damage " + halfHit + " vs full " + fullHit);
}
if (!guardHero.guard) fail("guard dropped when the hit landed");
guardHero.ct = 1000;
ash.ct = 0;
g.phase = "readout";
g.readoutT = 0;
SF.Battle.afterReadout(g);
if (g.actorId !== guardHero.id) fail("defender did not take the next turn");
if (guardHero.guard) fail("guard lasted into the defender's next turn");
console.log("defend halves " + fullHit + " to " + halfHit);

const turn = freshPlay();
SF.Battle.instant = false;
SF.Battle.start("em_wisps");
let spins = 0;
while (turn.battle && turn.battle.phase !== "menu") {
  if (turn.battle.phase !== "readout") fail("wisps did not reach a menu, phase " + turn.battle.phase);
  SF.Battle.skipReadout();
  if (++spins > 12) fail("hero turn never started");
}
const turnHero = turn.battle.actors.find((a) => a.side === "party");
const turnFoes = turn.battle.actors.filter((a) => a.side === "foe" && a.alive);
if (turn.battle.actorId !== turnHero.id) fail("defend test was not the hero's turn");
const openingHits = turn.battle.log.map((line) => {
  const hit = /takes (\d+) damage/.exec(line);
  return hit ? Number(hit[1]) : 0;
}).filter((n) => n > 0);
if (!openingHits.length) fail("wisps never hit before the hero's turn");
const unguarded = openingHits[0];
function queueFrom(heroCt) {
  const rows = turn.battle.actors.map((a) => ({
    name: a.name,
    ct: a.id === turnHero.id ? heroCt : a.ct,
    spd: a.spd,
    alive: a.alive
  }));
  let steps = 0;
  while (steps++ < 40) {
    const ready = rows.filter((r) => r.alive && r.ct >= 1000);
    if (ready.length) {
      ready.sort((a, c) => c.ct - a.ct);
      return ready[0].name + " @ " + rows.map((r) => r.name + " " + Math.round(r.ct)).join(", ");
    }
    let step = Infinity;
    rows.forEach((r) => {
      if (!r.alive) return;
      const need = (1000 - r.ct) / r.spd;
      if (need < step) step = need;
    });
    rows.forEach((r) => { if (r.alive) r.ct += r.spd * step; });
  }
  return "none";
}
const beforeQueue = queueFrom(320);
const afterPlan = queueFrom(0);
if (!SF.Battle.playerAct({ type: "defend" })) fail("defend did not spend the turn");
if (!turnHero.guard) fail("defend did not raise guard");
if (turnHero.ct > 0) fail("defend gave a head start " + turnHero.ct);
const ctAfterDefend = turnHero.ct;
const barIds = (turn.battle.order || []).slice();
const barNames = barIds.map((id) => {
  const who = turn.battle.actors.find((a) => a.id === id);
  return who ? who.name : id;
});
const future = barIds.slice(1);
const heroAgain = future.indexOf(turnHero.id);
turnFoes.forEach((foe) => {
  const at = future.indexOf(foe.id);
  if (at < 0 || (heroAgain >= 0 && at > heroAgain)) {
    fail("turn bar after defend is " + barNames.join(" > "));
  }
});
const ctLine = turn.battle.actors.map((a) => a.name + " " + Math.round(a.ct)).join(", ");
const guardedHits = [];
const predicted = future.filter((id) => turnFoes.some((foe) => foe.id === id)).slice(0, turnFoes.length);
predicted.forEach((id) => {
  const foe = turnFoes.find((a) => a.id === id);
  if (!turnHero.guard) fail("guard dropped before " + foe.name + " acted");
  const hpBefore = turnHero.hp;
  if (turn.battle.phase !== "readout") fail("expected a readout before " + foe.name);
  SF.Battle.skipReadout();
  const dealt = hpBefore - turnHero.hp;
  if (turn.battle.actorId !== foe.id) fail("bar promised " + foe.name + " but " + turn.battle.actorId + " acted");
  if (!(dealt > 0)) fail(foe.name + " did not hit through guard");
  if (Math.abs(dealt * 2 - unguarded) > 1) fail(foe.name + " hit for " + dealt + " instead of half of " + unguarded);
  if (!turnHero.guard) fail("guard cleared when " + foe.name + " attacked");
  guardedHits.push(foe.name + " " + dealt);
});
if (turn.battle.phase !== "readout") fail("hero turn did not wait for a readout");
SF.Battle.skipReadout();
if (turn.battle.phase !== "menu" || turn.battle.actorId !== turnHero.id) {
  fail("defender's next turn was " + turn.battle.phase + " " + turn.battle.actorId);
}
if (turnHero.guard) fail("guard stayed up into the defender's next turn");
console.log("defend queue before (ct 320): " + beforeQueue);
console.log("defend queue after (ct " + ctAfterDefend + ", " + ctLine + "): " + afterPlan);
console.log("defend bar: " + barNames.join(" > "));
console.log("defend hits: unguarded " + unguarded + ", guarded " + guardedHits.join(", "));

const slow = freshPlay();
SF.Battle.instant = false;
SF.Battle.start("em_brumekin");
spins = 0;
while (slow.battle && slow.battle.phase !== "menu") {
  if (slow.battle.phase !== "readout") fail("brumekin did not reach a menu");
  SF.Battle.skipReadout();
  if (++spins > 8) fail("brumekin hero turn never started");
}
const slowHero = slow.battle.actors.find((a) => a.side === "party");
const slowFoe = slow.battle.actors.find((a) => a.side === "foe");
slowFoe.ct = 0;
if (!SF.Battle.playerAct({ type: "defend" })) fail("slow-foe defend failed");
if (!(slowHero.ct < 0)) fail("a faster defender still stood at ct " + slowHero.ct + " ahead of a foe at 0");
const slowCt = slowHero.ct;
if (!slowHero.guard) fail("slow-foe defend dropped guard");
const slowHp = slowHero.hp;
SF.Battle.skipReadout();
const slowDealt = slowHp - slowHero.hp;
if (slow.battle.actorId !== slowFoe.id) fail("slow foe did not act before the defender");
if (!(slowDealt > 0) || !slowHero.guard) fail("slow foe hit without guard " + slowDealt);
console.log("defend waits at ct " + slowCt + " so Brumekin hits for " + slowDealt + " while guard is up");

const loss = freshPlay();
loss.gold = 40;
SF.giveItem("ether", 1);
const heldItems = Object.assign({}, loss.inventory);
SF.Battle.instant = true;
SF.Battle.start("em_brumekin");
loss.battle.actors.forEach((a) => { if (a.side === "party") a.hp = 1; });
const brute = loss.battle.actors.find((a) => a.side === "foe");
SF.Battle.playerAct({ type: "skill", skillId: "attack", targetId: brute.id });
while (loss.battle && loss.battle.phase !== "result" && loss.mode === "battle") {
  loss.battle.actors.forEach((a) => { if (a.side === "party") { a.hp = 0; a.alive = false; } });
  if (loss.battle.phase === "menu") SF.Battle.playerAct({ type: "defend" });
  else SF.Battle.skipReadout();
}
if (!loss.battle || loss.battle.phase !== "result" || loss.battle.result.win) fail("a wiped party did not lose");
SF.Battle.confirmResult();
if (loss.mode !== "play") fail("defeat did not return to the field");
if (Math.hypot(loss.player.x - SF.WAKE.x, loss.player.y - SF.WAKE.y) > 2) fail("defeat did not return to the waking stones");
const half = SF.memberStats(loss, "wayfarer").maxHp / 2;
if (loss.player.hp < half - 1 || loss.player.hp > half + 1) fail("defeat HP was not half " + loss.player.hp);
if (loss.gold !== 40) fail("defeat lost marks");
if ((loss.inventory.ether || 0) < (heldItems.ether || 0)) fail("defeat lost an item");

const flee = freshPlay();
SF.Battle.instant = true;
SF.giveItem("smoke_bomb", 1);
SF.Battle.start("em_wisps", { canFlee: true });
SF.Battle.playerAct({ type: "item", itemId: "smoke_bomb" });
if (!flee.battle || flee.battle.phase !== "result" || !flee.battle.result.fled) fail("smoke bomb did not flee");
SF.Battle.confirmResult();
if (flee.mode !== "play") fail("flee did not return to the field");
if ((flee.encounterGrace || 0) < 10) fail("flee did not grant grace steps");

const levels = freshPlay();
SF.Battle.instant = true;
levels.party.members.wayfarer.xp = SF.XP_NEED[1] - 1;
SF.syncFieldVitals(levels);
SF.Battle.start("em_wisps");
const winLv = SF.Battle.autoResolve(40);
if (winLv !== "win") fail("level-up fight did not win");
if (levels.party.members.wayfarer.level < 2) fail("did not level up");
if (!SF._lastResult.levels.length || SF._lastResult.levels[0].name !== "Wayfarer") fail("level-up result missing");
const lvRow = SF._lastResult.levels[0];
["hp", "sp", "atk", "def", "mag", "spd"].forEach((key) => {
  if (!lvRow[key] || lvRow[key].length !== 2) fail("level-up omitted " + key);
});
if (!SF.skillsAt("wayfarer", levels.party.members.wayfarer.level).includes("scan") && levels.party.members.wayfarer.level < 2) {
  fail("scan learn check broke");
}

const shop = freshPlay();
shop.gold = 100;
if (!SF.shopBuy("tonic") || shop.gold !== 70 || (shop.inventory.tonic || 0) < 1) fail("shop buy failed");
const beforeSell = shop.inventory.tonic;
if (!SF.shopSell("tonic") || shop.inventory.tonic === beforeSell) fail("shop sell failed");
if (!SF.giveItem("cloth_wrap", 1)) fail("no cloth wrap");
const def0 = SF.memberStats(shop, "wayfarer").def;
if (!SF.equipItem("wayfarer", "armor", "cloth_wrap")) fail("could not equip");
if (SF.memberStats(shop, "wayfarer").def !== def0 + 3) fail("armor did not add defense");
if (SF.equipItem("wayfarer", "weapon", "gale_pistol")) fail("Kestrel's pistol equipped on the Wayfarer");

const old = SF.fresh();
const oldBody = { x: 12, y: 24, fx: 1, fy: 0, hp: 20, maxHp: 40, xp: 110, level: 4, atk: 16, shardstep: true };
if (!SF.applySave(old, {
  v: 2,
  quest: "quay",
  island: "cinderveil",
  flags: { lampLit: true, metCinderKestrel: true, grapple: true },
  player: Object.assign({}, oldBody, { grapple: true }),
  enemies: []
})) fail("v0.2 save was rejected");
if (old.flags.party_kestrel || old.flags.party_tamsin) fail("a mid-Act 1 save joined the party");
const finishedAct = SF.fresh();
if (!SF.applySave(finishedAct, {
  v: 2,
  quest: "act1",
  island: "cinderveil",
  flags: { lampLit: true, mawDead: true, act1: true, epilogueHeard: true, cantor_choice: "spare" },
  player: Object.assign({}, oldBody, { x: 20, y: 90 }),
  enemies: []
})) fail("finished Act 1 save was rejected");
if (!finishedAct.flags.party_kestrel || !finishedAct.flags.party_tamsin) fail("a finished Act 1 did not add the party");
const finishedTitles = (finishedAct.banners || []).map((row) => row.title);
if (finishedTitles.indexOf("Kestrel joined the party.") < 0 || finishedTitles.indexOf("Tamsin joined the party.") < 0) {
  fail("a finished Act 1 did not announce the party " + finishedTitles.join(" | "));
}
if (finishedAct.party.members.kestrel.level !== finishedAct.party.members.wayfarer.level) {
  fail("Kestrel did not match the Wayfarer's level");
}
const again = SF.fresh();
finishedAct.mode = "play";
const dumpedAct = JSON.parse(JSON.stringify(SF.exportState(finishedAct)));
if (!SF.applySave(again, dumpedAct)) fail("a finished Act 1 did not save");
const againTitles = (again.banners || []).map((row) => row.title);
if (againTitles.indexOf("Kestrel joined the party.") >= 0) fail("the join banner repeated on the next load");
if (old.party.members.wayfarer.level < 4 || old.party.members.wayfarer.level > 6) {
  fail("v0.2 xp did not become a sensible level " + old.party.members.wayfarer.level);
}
if (!old.inventory.tonic || old.gold == null) fail("migrated save has no pack");
const round = SF.fresh();
round.mode = "play";
SF.state = round;
round.gold = 15;
round.inventory = { ether: 2 };
round.party.members.wayfarer.xp = 40;
SF.levelMemberToXp(round, "wayfarer");
SF.syncFieldVitals(round);
const dumped = JSON.parse(JSON.stringify(SF.exportState(round)));
if (dumped.v !== 4 || dumped.gold !== 15) fail("v4 export dropped marks");
const loaded = SF.fresh();
if (!SF.applySave(loaded, dumped)) fail("v3 save was rejected");
if (loaded.gold !== 15 || (loaded.inventory.ether || 0) !== 2) fail("v3 inventory did not round-trip");
if (loaded.party.members.wayfarer.level !== round.party.members.wayfarer.level) fail("v3 level did not round-trip");

const roadFight = freshPlay();
SF.Battle.instant = true;
SF.mountIsland("emberhold");
roadFight.island = "emberhold";
roadFight.flags.metMaren = true;
roadFight.flags.shard_sense = true;
["em_wisps", "em_wisps", "em_wisp1", "em_brumekin", "em_wisps", "em_brume_wisp", "em_choirling", "em_wisps"].forEach((id) => {
  SF.Battle.start(id, { zoneLevel: id === "em_choirling" || id === "em_brume_wisp" ? 5 : 3, fixed: id === "em_choirling", carrier: id === "em_brume_wisp", carrierRegion: id === "em_brume_wisp" ? "scar" : null });
  const end = SF.Battle.autoResolve(50);
  if (end !== "win") fail("could not win " + id + " (" + end + ")");
});
const emberLevel = roadFight.party.members.wayfarer.level;
if (emberLevel < 4 || emberLevel > 6) fail("Emberhold fights landed at level " + emberLevel);
if (roadFight.flags.party_kestrel || roadFight.flags.party_tamsin) fail("Emberhold joined a companion");
roadFight.flags.sailUnlocked = true;
SF.startVoyage("cinderveil");
if (roadFight.flags.party_kestrel || roadFight.flags.party_tamsin) fail("the first sail joined the party");
(SF._dlgListeners.grant_grapple || []).forEach((fn) => fn("grant_grapple"));
if (roadFight.flags.party_tamsin || roadFight.flags.party_kestrel) fail("the grapple gift joined the party");
roadFight.mode = "play";
roadFight.dialogue = null;
SF.mountIsland("cinderveil");
roadFight.island = "cinderveil";
["cv_ashlings", "cv_ash1", "cv_mixed", "cv_cinderhound", "cv_ashlings", "cv_mixed", "cv_ashlings", "cv_ash1", "cv_mixed", "cv_cinderhound", "cv_ashlings", "cv_mixed", "cv_hounds", "cv_cinderhound"].forEach((id) => {
  SF.Battle.start(id, { zoneLevel: id === "cv_hounds" || id === "cv_cinderhound" ? 8 : 7 });
  const partyNow = roadFight.battle.actors.filter((a) => a.side === "party");
  if (partyNow.length !== 1) fail("a Cinderveil fight was not solo");
  const end = SF.Battle.autoResolve(60);
  if (end !== "win") fail("could not win " + id + " (" + end + ") lv " + roadFight.party.members.wayfarer.level);
});
const preMaw = roadFight.party.members.wayfarer.level;
if (preMaw < 7 || preMaw > 9) fail("Act 1 was not about level 8 before the Maw (" + preMaw + ")");
roadFight.enemies = SF.makeEnemies();
const mawFoe = roadFight.enemies.find((e) => e.kind === "maw");
if (!mawFoe) fail("the Maw is not on the map");
mawFoe.dormant = false;
roadFight.flags.mawFight = true;
roadFight.touchCd = 0;
if (!SF.touchFoe(mawFoe)) fail("could not touch the Maw");
const mawParty = roadFight.battle && roadFight.battle.actors.filter((a) => a.side === "party");
if (!mawParty || mawParty.length !== 1 || mawParty[0].key !== "wayfarer") fail("the Maw was not a solo fight");
if (!roadFight.battle.order || roadFight.battle.order.length < 4) fail("the solo Maw hid the turn strip");
if (!roadFight.battle || roadFight.battle.id !== "boss_cinder_maw" || roadFight.battle.canFlee) {
  fail("the Maw fight was not a locked boss");
}
if (context.Music.current() !== "boss") fail("the Maw did not use the boss theme");
const mawEnd = SF.Battle.autoResolve(80);
if (mawEnd !== "win") fail("the party could not beat the Maw at level " + preMaw);
if (!roadFight.flags.mawDead || roadFight.quest !== "relight") fail("the Maw win did not continue Act 1");
const seenPhase = SF._lastResult && roadFight.flags.mawDead;
if (!seenPhase) fail("maw result missing");

SF.mountIsland("emberhold");

const worldIssues = SF.auditWorld();
if (worldIssues.length) {
  console.error(worldIssues.join("\n"));
  process.exit(1);
}
if (SF.islandId !== "emberhold") fail("auditWorld did not restore Emberhold");

SF.seaFightChance = 0;
const locked = freshPlay();
locked.flags.sailUnlocked = true;
locked.flags.lampLit = true;
locked.flags.act1 = false;
SF.startVoyage("saltmere");
if (SF.islandId !== "emberhold" || locked.voyage) fail("Saltmere opened before Act 1");
SF.startVoyage("highspire");
if (locked.voyage) fail("Highspire opened before Act 1");
if (SF.destinationOpen("gullrock") || SF.destinationOpen("drift")) fail("optional islets opened before Act 1");
SF.startVoyage("gullrock");
if (locked.voyage) fail("Gullrock opened before Act 1");
SF.startVoyage("drift");
if (locked.voyage) fail("the Drift Market opened before Act 1");

const trip = freshPlay();
trip.flags.sailUnlocked = true;
trip.flags.act1 = true;
trip.flags.lampLit = true;
trip.flags.metCinderKestrel = true;
SF.startVoyage("saltmere");
if (trip.mode === "voyage" || trip.voyage) fail("Saltmere sailed during the hold");
if (SF.destinationOpen("gullrock") || SF.destinationOpen("drift") || SF.destinationOpen("saltmere") || SF.destinationOpen("highspire")) {
  fail("Act 2 islands opened during the hold");
}
["gullrock", "drift", "saltmere", "highspire"].forEach((id) => {
  if (SF.destinationLockText(id) !== "Coming soon") fail(id + " was not marked Coming soon");
});
SF.mountIsland("saltmere");
trip.island = "saltmere";
if (!SF.walkable(SF.DOCKS.saltmere.x, SF.DOCKS.saltmere.y)) fail("Saltmere dock is not walkable");
if (SF.zoneAt(SF.DOCKS.saltmere.x, SF.DOCKS.saltmere.y).name !== "Saltmere") fail("Saltmere did not name the town");

const holt = SF.npcById("holt");
trip.player.x = holt.x;
trip.player.y = holt.y;
trip.mode = "play";
SF.tryInteract();
if (trip.dialogue || trip.mode === "dialogue") fail("Holt's pending line was reachable");
finishTalk(trip);

const worldNpcs = [];
["saltmere", "highspire", "drift"].forEach((id) => {
  SF.ISLANDS[id].npcs.forEach((n) => worldNpcs.push(n));
});
if (worldNpcs.length !== 12) fail("expected 12 new speaking NPCs, saw " + worldNpcs.length);
worldNpcs.forEach((n) => {
  const node = SF.dialogueNodes[n.node];
  const speaker = n.node === "saltmere.kids" ? "Pip and Lark" : n.name;
  if (!node || node.speaker !== speaker || node.lines.length !== 1 || node.lines[0] !== "(Script pending)") {
    fail("placeholder missing for " + (n && n.node));
  }
});

const chest = SF.EXTRAS.find((ex) => ex.id === "chest-sm-town");
trip.player.x = chest.x;
trip.player.y = chest.y;
SF.tryInteract();
if (SF.itemCount("tonic") !== 1 || SF.itemCount("ether") !== 1 || !trip.picked[chest.id]) {
  fail("town chest did not give its items");
}
SF.tryInteract();
if (SF.itemCount("tonic") !== 1) fail("chest paid twice");
const chestSave = JSON.parse(JSON.stringify(SF.exportState(trip)));
const chestBack = SF.fresh();
if (!SF.applySave(chestBack, chestSave) || chestSave.v !== 4) fail("chest save was rejected");
if (!chestBack.picked[chest.id] || (chestBack.inventory.tonic || 0) !== 1) fail("chest did not stay open in the save");
SF.state = trip;

SF.mountIsland("saltmere");
trip.island = "saltmere";
SF.state = trip;
trip.enemies = SF.makeEnemies();
trip.gold = 200;
const stall = SF.EXTRAS.find((ex) => ex.id === "sm-shop");
SF.openShop(stall);
if (trip.mode !== "shop") fail("shop did not open");
if (!SF.buyFromShop("tonic")) fail("could not buy a tonic");
if (trip.gold !== 170 || SF.itemCount("tonic") !== 2) fail("buy did not charge the catalog price " + trip.gold);
trip.gold = 0;
if (SF.buyFromShop("ether")) fail("bought an ether with no marks");
if (SF.shopBuy("ether")) fail("shopBuy took an ether with no marks");
if (!SF.sellToShop("tonic")) fail("could not sell a tonic");
if (trip.gold !== 15 || SF.itemCount("tonic") !== 1) fail("sell price was wrong " + trip.gold);
SF.closeWorldPanel();

const inn = SF.EXTRAS.find((ex) => ex.id === "sm-inn");
const wyrm = trip.enemies.find((e) => e.kind === "tidewyrm");
if (!wyrm) fail("the Tidewyrm is missing");
if (trip.enemies.some((e) => e.encounter === "sm_saltwisps")) fail("Saltmere still has field trash");
wyrm.alive = false;
wyrm.hp = 0;
trip.flags.tidewyrmDead = true;
trip.player.hp = 4;
trip.player.x = inn.x;
trip.player.y = inn.y;
SF.tryInteract();
if (trip.mode !== "inn") fail("inn prompt did not open");
SF.restAtInn(inn);
if (trip.player.hp !== trip.player.maxHp) fail("rest did not fill heart");
if (trip.mode !== "play") fail("rest left the inn open");
const wyrmBack = trip.enemies.find((e) => e.kind === "tidewyrm");
if (wyrmBack.alive || !trip.flags.tidewyrmDead) fail("the Tidewyrm respawned");
const innSave = SF.readSave();
if (!innSave || innSave.v !== 4 || innSave.player.hp !== trip.player.maxHp) fail("inn did not save");

const hooked = freshPlay();
hooked.flags.act1 = true;
hooked.flags.sailUnlocked = true;
hooked.player.grapple = true;
SF.mountIsland("saltmere");
hooked.island = "saltmere";
hooked.enemies = SF.makeEnemies();
hooked.player.x = -242;
hooked.player.y = 30;
hooked.player.fx = -1;
hooked.player.fy = 0;
hooked.player.grappleCd = 0;
hooked.player.safeX = -242;
hooked.player.safeY = 30;
if (!SF.fireGrapple(hooked.player, { x: -1, y: 0 })) fail("wreck hook did not fire");
let pulls = 0;
while (hooked.player.grappleT > 0 && pulls < 40) {
  SF.update(0.02);
  pulls += 1;
}
if (!SF.walkable(hooked.player.x, hooked.player.y) || hooked.player.x > -400) {
  fail("wreck hook missed the Holdfast " + hooked.player.x + "," + hooked.player.y);
}

SF.mountIsland("highspire");
const gateState = freshPlay();
gateState.flags.act1 = true;
gateState.flags.sailUnlocked = true;
SF.mountIsland("highspire");
gateState.island = "highspire";
gateState.enemies = SF.makeEnemies();
const gateSign = SF.EXTRAS.find((ex) => ex.id === "hs-gate-sign");
gateState.player.x = gateSign.x;
gateState.player.y = gateSign.y;
SF.tryInteract();
if (gateState.mode !== "notice" || !gateState.notice || gateState.notice.text !== "The gate is shut.") {
  fail("the gate scene opened before Saltmere's lamp was lit");
}
SF.closeWorldPanel();
gateState.flags.saltmere_lamp = "lit";
SF.tryInteract();
if (gateState.mode !== "notice" || !gateState.notice || gateState.notice.text !== "Story continues in Act 2") {
  fail("the Highspire gate did not say Act 2 is closed");
}

const sea = freshPlay();
sea.flags.sailUnlocked = true;
sea.flags.act1 = true;
sea.flags.metCinderKestrel = true;
SF.seaFightChance = 1;
SF.startVoyage("cinderveil");
SF.update(1.2);
if (!sea.battle || sea.battle.id !== "sea_hush_raiders" || sea.battle.bg !== "hush_deck" || sea.battle.canFlee !== true || sea.battle.boss) {
  fail("sea fight did not call sea_hush_raiders");
}
sea.battle = null;
sea.voyage = null;
sea.mode = "play";
SF.seaFightChance = 0;

const touch = freshPlay();
touch.flags.act1 = true;
SF.mountIsland("saltmere");
touch.island = "saltmere";
touch.mode = "play";
touch.enemies = SF.makeEnemies();
touch.touchCd = 0;
if (touch.enemies.some((e) => e.id === "sm-wisp-shore")) fail("Saltmere still places a field wisp");
if (!SF.Battle.start("sm_saltwisps", { bg: "saltmere_shore", zoneLevel: 10, canFlee: true })) fail("saltwisp encounter did not start");
if (!touch.battle || touch.battle.id !== "sm_saltwisps" || touch.battle.bg !== "saltmere_shore" || touch.battle.canFlee !== true) {
  fail("saltwisp fight was not sm_saltwisps");
}
touch.battle = null;
touch.mode = "play";
touch.touchCd = 0;
const boss = touch.enemies.find((e) => e.encounter === "boss_tidewyrm");
if (!SF.touchFoe(boss)) fail("Tidewyrm touch did not start a fight");
if (!touch.battle || touch.battle.id !== "boss_tidewyrm" || touch.battle.bg !== "saltmere_wreck" || touch.battle.canFlee !== false || !touch.battle.boss || touch.battle.fieldId !== boss.id) {
  fail("Tidewyrm did not start boss_tidewyrm");
}
if (touch.battle.onWin) touch.battle.onWin();
touch.battle = null;
touch.mode = "play";
if (touch.flags.tidewyrm_dead !== true || touch.flags.tidewyrmDead !== true) fail("the Tidewyrm win did not set tidewyrm_dead");
touch.player.x = SF.LAMP.x;
touch.player.y = SF.LAMP.y;
SF.tryInteract();
if (touch.flags.saltmere_lamp !== "lit") fail("the Saltmere lamp did not light after the Tidewyrm");
SF.seaFightChance = null;
SF.mountIsland("emberhold");

if (SF.xpForFight(11, 3, 3, false) !== 11) fail("even-level XP " + SF.xpForFight(11, 3, 3, false));
if (SF.xpForFight(11, 1, 3, false) !== Math.round(11 * 1.25)) fail("under-level XP");
if (SF.xpForFight(11, 4, 3, false) !== Math.round(11 * 0.5)) fail("gap 1 XP");
if (SF.xpForFight(11, 5, 3, false) !== Math.round(11 * 0.25)) fail("gap 2 XP");
if (SF.xpForFight(11, 6, 3, false) !== Math.max(1, Math.round(11 * 0.1))) fail("gap 3 XP");
if (SF.xpForFight(11, 7, 3, false) !== 1) fail("gap 4 XP");
if (SF.xpForFight(20, 9, 3, true) !== 20) fail("fixed XP was scaled");
const meadowN = SF.simulateEncounterRate("meadow", 800, 1, { metMaren: true });
const litN = SF.simulateEncounterRate("meadow", 800, 1, { metMaren: true, lampLit: true });
if (meadowN < 8 || meadowN > 28) fail("meadow rate felt wrong " + meadowN);
if (litN >= meadowN || litN > 12) fail("a lit lamp did not slow the meadow " + litN + " vs " + meadowN);
if (SF.simulateEncounterRate("cottage", 400, 1, { metMaren: true }) !== 0) fail("the cottage rolled a fight");
if (SF.simulateEncounterRate("meadow", 400, 2, {}) !== 0) fail("the meadow fought before Maren");
const scarEarly = SF.simulateEncounterRate("scar", 500, 3, {});
if (scarEarly < 6 || scarEarly > 28) fail("the Scar was quiet before Maren " + scarEarly);

function pngSize(file) {
  const buf = fs.readFileSync(file);
  if (buf[0] !== 0x89 || buf.toString("ascii", 1, 4) !== "PNG") return null;
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

const manifest = JSON.parse(fs.readFileSync("manifest.webmanifest", "utf8"));
if (manifest.name !== "Shardfall" || manifest.short_name !== "Shardfall") fail("manifest name");
if (manifest.start_url !== "./" || manifest.scope !== "./" || manifest.id !== "/shardfall/") fail("manifest scope");
if (manifest.display !== "fullscreen") fail("manifest display");
if (!manifest.display_override || manifest.display_override[0] !== "fullscreen" || manifest.display_override[1] !== "standalone") {
  fail("manifest display_override");
}
if (manifest.orientation !== "any") fail("manifest orientation");
if (manifest.background_color !== "#140c28" || manifest.theme_color !== "#140c28") fail("manifest colors");
const iconSizes = {};
for (const icon of manifest.icons) {
  const size = pngSize(icon.src);
  const expected = icon.sizes.split("x").map(Number);
  if (!size || size.w !== expected[0] || size.h !== expected[1]) fail("icon size " + icon.src);
  iconSizes[icon.purpose + ":" + icon.sizes] = true;
}
if (!iconSizes["any:192x192"] || !iconSizes["any:512x512"] || !iconSizes["maskable:512x512"]) fail("manifest icons");
const apple = pngSize("icons/apple-touch-icon.png");
if (!apple || apple.w !== 180 || apple.h !== 180) fail("apple touch icon");

const html = fs.readFileSync("index.html", "utf8");
if (!html.includes('rel="manifest" href="manifest.webmanifest"')) fail("manifest link");
if (!html.includes('rel="apple-touch-icon" href="icons/apple-touch-icon.png"')) fail("apple touch link");
if (!html.includes('src="js/pwa.js"')) fail("pwa script");
if (!html.includes('id="chest"') || !html.includes('id="chest-list"') || !html.includes('id="chest-ok"')) {
  fail("chest popup is missing from the page");
}
const chestCss = fs.readFileSync("css/style.css", "utf8");
if (!chestCss.includes("#chest") || !chestCss.includes(".loot-line")) fail("chest popup has no style");
const sw = fs.readFileSync("sw.js", "utf8");
if (!sw.includes('CACHE = "shardfall-v0.4.25"')) fail("cache version");
if (sw.includes('"assets/atlas/')) fail("an atlas path is in the precache list");
if (sw.includes("isRuntimeAtlas")) fail("atlas requests have a separate fetch branch");
if (!sw.includes("function cacheFirst") || !sw.includes("caches.match(request)")) fail("runtime cache is not cache-first");
if (!sw.includes("response.ok")) fail("a missing file would be cached");
if (!sw.includes("skipWaiting")) fail("skipWaiting");
if (!sw.includes('cache: "reload"') || !sw.includes("no-store")) fail("install cache bypass");
const refs = [...html.matchAll(/\b(?:src|href)="([^"]+)"/g)].map((m) => m[1]).filter((href) => !/^[a-z]+:/i.test(href));
for (const href of refs.concat(manifest.icons.map((icon) => icon.src))) {
  if (!fs.existsSync(href)) fail("missing asset " + href);
  if (!sw.includes('"' + href + '"')) fail("not precached " + href);
}
if (!sw.includes('"js/pwa.js"')) fail("pwa.js not precached");
if (!sw.includes('"js/content/maps/v2layout.js"')) fail("v2layout not precached");

SF.mountIsland("emberhold");
const spare = SF.fresh();
spare.flags.lampLit = true;
spare.flags.cinderLit = false;
spare.quest = "stirring";
spare.shardsHeld = 1;
spare.player.x = SF.WAKE.x;
spare.player.y = SF.WAKE.y;
SF.state = spare;
if (SF.handMeter(spare) !== "✦ 1 spare") fail("spare meter " + SF.handMeter(spare));
if (SF.lampReserve(spare) !== 0) fail("spare reserve " + SF.lampReserve(spare));

const gather = SF.fresh();
gather.mode = "play";
gather.quest = "gather";
gather.flags.shard_sense = true;
gather.flags.lampLit = false;
gather.flags.carriers = {};
gather.shardsHeld = 2;
gather.player.grapple = false;
gather.player.shardstep = false;
gather.player.x = 84 * 16;
gather.player.y = 48 * 16;
gather.picked["shard-meadow"] = true;
gather.picked["shard-grove"] = true;
SF.state = gather;
SF.mountIsland("emberhold");
const aim = SF.objectivePoint(gather);
const hook = SF.PICKUPS.find((p) => p.id === "shard-hook");
const step = SF.PICKUPS.find((p) => p.id === "shard-step");
if (!aim) fail("gather aim missing");
if (SF.LAMP && Math.hypot(aim.x - SF.LAMP.x, aim.y - SF.LAMP.y) < 8) fail("gather aim pointed at the lamp early");
if (hook && Math.hypot(aim.x - hook.x, aim.y - hook.y) < 8) fail("aim pointed at shard-hook");
if (step && Math.hypot(aim.x - step.x, aim.y - step.y) < 8) fail("aim pointed at shard-step");
let nearShard = null;
let nearD = Infinity;
SF.PICKUPS.forEach((p) => {
  if (p.kind !== "shard" || p.secret || gather.picked[p.id] || !SF.shardReachable(p)) return;
  const d = Math.hypot(gather.player.x - p.x, gather.player.y - p.y);
  if (d < nearD) {
    nearD = d;
    nearShard = p;
  }
});
if (!nearShard || Math.hypot(aim.x - nearShard.x, aim.y - nearShard.y) > 8) {
  fail("gather aim was not the nearest shard " + (aim && aim.x) + "," + (aim && aim.y));
}
if (nearD > SF.SHARD_GLINT && aim.precise !== false) fail("a far shard should be an edge hint");
if (SF.shardReachable(hook)) fail("shard-hook reachable before grapple");
gather.player.grapple = true;
if (!SF.shardReachable(hook)) fail("shard-hook stayed shut after grapple");

const act1Chests = [
  ["emberhold", "chest-orchard", [
    "Found: Tonic \u00d71. Restores 40 HP.",
    "Found: Cloth Wrap \u00d71. Defense +3.",
    "Found: Knife \u00d71. Attack +5. Kestrel can use this.",
    "Found: 20 marks. Spend them in shops."
  ]],
  ["emberhold", "chest-meadow", ["Found: Ether \u00d71. Restores 20 SP."]],
  ["emberhold", "chest-perch", ["Found: Smoke Bomb \u00d71. Leaves a fight. Does not work on a boss."]],
  ["cinderveil", "chest-ash", ["Found: Hi-Tonic \u00d71. Restores 120 HP."]],
  ["cinderveil", "chest-vault", [
    "Found: Phoenix Shard \u00d71. Revives one ally at 40% HP.",
    "Found: Quay Coat \u00d71. Defense +5, Speed +1."
  ]]
];
act1Chests.forEach((spec, index) => {
  const island = spec[0];
  const id = spec[1];
  const lines = spec[2];
  const box = freshPlay();
  SF.mountIsland(island);
  box.island = island;
  box.gold = 0;
  box.inventory = {};
  box.banners = [];
  box.banner = null;
  const chest = (SF.EXTRAS || []).find((ex) => ex.id === id && ex.kind === "chest");
  if (!chest) fail(id + " is missing on " + island);
  box.player.x = chest.x;
  box.player.y = chest.y;
  const px = box.player.x;
  const py = box.player.y;
  const near = SF.nearestInteract();
  if (near && near.kind === "chest" && near.ref && near.ref.id === id) SF.tryInteract();
  else SF.openChest(chest);
  if (box.mode !== "chest" || !box.chestLoot || box.chestLoot.id !== id) fail(id + " did not open a popup");
  const got = (box.chestLoot.rows || []).map((row) => row.line);
  if (got.length !== lines.length || got.some((line, i) => line !== lines[i])) {
    fail(id + " popup was: " + got.join(" | "));
  }
  const fromRows = SF.chestRows(chest).map((row) => row.line);
  if (fromRows.some((line, i) => line !== got[i])) fail(id + " rows drifted from the popup");
  (chest.items || []).forEach((it) => {
    if (SF.itemCount(it.id) !== (it.n || 1)) fail(id + " gave the wrong amount of " + it.id);
  });
  if ((box.gold || 0) !== (chest.marks || 0)) fail(id + " marks were " + box.gold);
  if (!box.picked[id]) fail(id + " did not stay open");
  if (!box.chestAnim || box.chestAnim.id !== id || !(box.chestAnim.dur > 0)) fail(id + " did not play an open animation");
  if ((box.banners || []).some((b) => b.title === "Chest") || (box.banner && box.banner.title === "Chest")) {
    fail(id + " still used a banner");
  }
  const time = box.playTime;
  SF.readMove = () => ({ x: 1, y: 0 });
  SF.update(0.5);
  SF.readMove = () => ({ x: 0, y: 0 });
  if (box.mode !== "chest" || box.player.x !== px || box.player.y !== py || box.playTime !== time) {
    fail(id + " did not pause the game");
  }
  box.chestAnim.start = Date.now() - 1000;
  if (SF.chestOpenT(id) < 1) fail(id + " did not finish opening");
  if (index === 0) {
    SF.reduceMotion = true;
    box.chestAnim.start = Date.now();
    if (SF.chestOpenT(id) !== 1) fail("reduced motion should show the chest open");
    SF.reduceMotion = false;
  }
  SF.closeChest();
  if (box.mode !== "play" || box.chestLoot) fail(id + " popup did not close");
  if (!box.picked[id]) fail(id + " closed the chest sprite");
  SF.openChest(chest);
  if (box.mode === "chest") fail(id + " opened twice");
  (chest.items || []).forEach((it) => {
    if (SF.itemCount(it.id) !== (it.n || 1)) fail(id + " paid twice");
  });
  if ((box.gold || 0) !== (chest.marks || 0)) fail(id + " paid marks twice");
});
SF.mountIsland("emberhold");

{
  const layout = {};
  layout.window = layout;
  layout.console = console;
  layout.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
  layout.document = {
    readyState: "complete",
    getElementById: () => null,
    addEventListener() {},
    createElement() { return { getContext: () => null, width: 0, height: 0 }; }
  };
  layout.Art = { battleBg() {}, calm() { return true; } };
  vm.createContext(layout);
  for (const file of [
    "js/data.js", "js/data/skills.js", "js/data/items.js", "js/data/party.js",
    "js/data/enemies.js", "js/data/encounters.js", "js/dialogue.js",
    "js/audio.js", "js/music.js", "js/sfx.js", "js/save.js", "js/sim.js",
    "js/battle/battle.js", "js/battle/draw.js"
  ]) {
    vm.runInContext(fs.readFileSync(file, "utf8"), layout, { filename: file });
  }
  const L = layout.SF;
  const fake = {
    setTransform() {}, save() {}, restore() {}, beginPath() {}, moveTo() {}, lineTo() {},
    arcTo() {}, closePath() {}, fill() {}, stroke() {}, rect() {}, clip() {},
    fillRect() {}, strokeRect() {}, fillText() {}, translate() {}, ellipse() {}, arc() {},
    measureText(t) { return { width: String(t || "").length * 7 }; },
    imageSmoothingEnabled: false
  };
  const play = L.fresh();
  play.mode = "play";
  L.state = play;
  L.ensureParty(play);
  play.flags.party_kestrel = true;
  play.flags.party_tamsin = true;
  ["wayfarer", "kestrel", "tamsin"].forEach((id) => {
    play.party.members[id].level = 1;
    play.party.members[id].xp = L.xpForLevel(4);
    L.levelMemberToXp(play, id);
    const st = L.memberStats(play, id);
    play.party.members[id].hp = st.maxHp;
    play.party.members[id].sp = st.maxSp;
  });
  play.inventory = { tonic: 4, ether: 2, hi_tonic: 1, ember_salt: 1, tide_vial: 1, gale_powder: 1, phoenix_shard: 1 };
  L.syncFieldVitals(play);
  L.Battle.instant = true;
  if (!L.Battle.start("em_wisps")) fail("layout battle did not start");
  const views = [[915, 412], [412, 915], [640, 360]];
  const bgs = ["emberhold_meadow", "cinderveil_ash", "ember_vault", "saltmere_shore", "highspire_road", "hush_deck"];
  views.forEach(([w, h]) => {
    bgs.forEach((bg) => {
      play.battle.bg = bg;
      play.battle.phase = "menu";
      L.drawBattle(fake, w, h, 1);
      const boxes = L.Battle.partyBoxes || [];
      const stand = L.Battle.stand || {};
      if (boxes.length !== 3) fail("party stand count " + boxes.length + " at " + w + "x" + h);
      const feet = boxes.map((box) => box.feet);
      if (feet.some((f) => f !== feet[0])) fail("party feet split at " + w + "x" + h + " " + bg + " " + feet.join(","));
      if (!(feet[0] > stand.horizon)) fail("party stands above the floor at " + w + "x" + h + " " + bg);
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i];
          const b = boxes[j];
          const hit = a.x < b.x + b.w - 0.5 && a.x + a.w > b.x + 0.5 && a.y < b.y + b.h - 0.5 && a.y + a.h > b.y + 0.5;
          if (hit) fail("party sprites overlap at " + w + "x" + h + " " + bg);
        }
      }
    });
  });
  L.drawBattle(fake, 915, 412, 1);
  if (!(L.Battle.stripFace >= 44)) fail("turn icons still tiny at phone width (" + L.Battle.stripFace + ")");
  const kes = play.battle.actors.find((a) => a.key === "kestrel");
  play.battle.phase = "skills";
  play.battle.actorId = kes.id;
  play.battle.sel = 0;
  play.battle.listScroll = 0;
  L.drawBattle(fake, 915, 412, 1);
  if (!play.battle._rows || play.battle._rows.indexOf("skill:steal") < 0) fail("Kestrel's Steal is missing");
  if (play.battle._rows.indexOf("skill:steal") >= play.battle._visible && !play.battle._moreBelow) {
    fail("Steal is hidden with no scroll hint");
  }
  if (!(play.battle._visible >= 2)) fail("skill list shows " + play.battle._visible);
  if (!play.battle._descBox) fail("skill description has no panel");
  play.battle.phase = "items";
  play.battle.listScroll = 0;
  L.drawBattle(fake, 915, 412, 1);
  if (!(play.battle._visible >= 4)) fail("item list only shows " + play.battle._visible);
  if (play.battle._rows.length > play.battle._visible && !play.battle._moreBelow) fail("item list hides rows with no hint");
}

await runAssetChecks();

const shardCheck = spawnSync(process.execPath, ["tools/shard-check.mjs"], { stdio: "inherit", env: childEnv });
if (shardCheck.status !== 0) process.exit(shardCheck.status || 1);

const stickFingers = spawnSync(process.execPath, ["tools/stick-two-finger.mjs"], { stdio: "inherit", env: childEnv });
if (stickFingers.status !== 0) process.exit(stickFingers.status || 1);

const tapLeak = spawnSync(process.execPath, ["tools/tap-leak.mjs"], { stdio: "inherit", env: childEnv });
if (tapLeak.status !== 0) process.exit(tapLeak.status || 1);

async function runAssetChecks() {
  const dataJs = fs.readFileSync("js/data.js", "utf8");
  if (!dataJs.includes('SF.VERSION = "0.4.25"')) fail("version was not bumped");
  if (!dataJs.includes("Behind the scenes: new art system groundwork, no visible change")) fail("whats new");
  if (!dataJs.includes("Behind the scenes: packed art is ready for the site, with no visible change.")) {
    fail("whats new atlas line");
  }
  if (!dataJs.includes("New hero sprite on the map.")) fail("whats new hero line");
  if (!html.includes("v0.4.25")) fail("html version");
  const drawJs = fs.readFileSync("js/draw.js", "utf8");
  if (!drawJs.includes('id === "wayfarer"') || !drawJs.includes("SF.spriteRenderer")) {
    fail("the field hero is not routed through the asset registry");
  }
  const assetFiles = [
    "js/assets/manifest.js",
    "js/assets/loader.js",
    "js/assets/sheet.js",
    "js/assets/animator.js",
    "js/assets/registry.js",
    "js/assets/renderer.js",
    "js/assets/rig.js",
    "js/assets/crystal.js"
  ];
  for (const file of assetFiles) {
    if (!fs.existsSync(file)) fail("missing " + file);
    if (!html.includes('src="' + file + '"')) fail("page omits " + file);
    if (!sw.includes('"' + file + '"')) fail("precache omits " + file);
  }

  const asset = {
    console,
    setTimeout,
    clearTimeout,
    Promise,
    AbortController
  };
  asset.window = asset;
  asset.Art = {
    frames: [],
    spriteCalls: [],
    frameOf(id, pose, facing, frame) {
      this.frames.push([id, pose, facing, frame]);
      return { id, pose, facing, frame, width: 10, height: 12, _ax: 5, _ay: 11 };
    },
    sprite(ctx, id, x, y, opts) {
      this.spriteCalls.push({ id, x, y, opts });
    }
  };
  vm.createContext(asset);
  for (const file of assetFiles) {
    vm.runInContext(fs.readFileSync(file, "utf8"), asset, { filename: file });
  }
  const A = asset.SF;

  const anim = new A.Animator();
  const down = anim.frame("walk", 0, "down");
  if (down.frame !== 0 || down.dir !== "down" || down.row !== 0 || down.flip || down.name !== "walk.down.0") {
    fail("walk down frame 0 was " + JSON.stringify(down));
  }
  const step = anim.frame("walk", 0.2, "down");
  if (step.frame !== 1 || step.col !== 1) fail("walk at 0.2s was frame " + step.frame);
  const left = anim.frame("walk", 0, "left");
  const right = anim.frame("idle", 0, "right");
  const up = anim.frame("idle", 0.5, "up");
  if (!left.flip || left.dir !== "side" || left.row !== 1 || left.facing !== "left") fail("left was not a flipped side");
  if (right.flip || right.dir !== "side" || right.row !== 1) fail("right was not the side row");
  if (up.dir !== "up" || up.row !== 2 || up.frame !== 3 || up.flip) fail("idle up was " + JSON.stringify(up));
  if (anim.frame("walk", 0.75, "down").frame !== 0) fail("walk did not loop");
  const held = anim.frame("death", 100, "up");
  if (held.frame !== 5 || held.dir !== "up" || held.flip) fail("death did not hold the last up frame");
  if (anim.frame("no-such-clip", 0, "down").clip !== "idle") fail("a missing clip did not fall back to idle");
  const named = new A.Animator({
    walk: {
      fps: 4,
      loop: true,
      names: { down: ["a", "b"], side: ["c"], up: ["d"] }
    }
  });
  const namedFrame = named.frame("walk", 0, "side");
  if (namedFrame.name !== "c" || namedFrame.flip || namedFrame.dir !== "side") {
    fail("named side frame was " + namedFrame.name);
  }

  const sheet = new A.SpriteSheet(null, {
    frames: [{ name: "walk.down.0", x: 1, y: 2, w: 3, h: 4 }],
    grid: { cols: 2, rows: 2, w: 8, h: 8, names: ["a", "b", "c", "d"] }
  });
  if (!sheet.frame("walk.down.0") || sheet.frame("walk.down.0").w !== 3) fail("rect lookup");
  const cell = sheet.frame("c");
  if (!cell || cell.x !== 0 || cell.y !== 8 || cell.w !== 8) fail("grid lookup " + JSON.stringify(cell));
  if (sheet.frame(2).name !== "b") fail("grid order");

  const empty = new A.AssetRegistry(new A.AssetManifest());
  const missed = empty.lookup("wayfarer", { pose: "stand", facing: "left", index: 1 });
  if (missed.ready || missed.codeId !== "wayfarer") fail("empty registry did not fall back");
  const code = empty.codeCanvas(missed);
  if (!code || code.id !== "wayfarer" || asset.Art.frames[0].join("|") !== "wayfarer|stand|left|1") {
    fail("fallback did not ask Art for the code sprite");
  }

  const declared = A.AssetManifest.fromData({
    entries: [{
      key: "hero.field",
      atlas: "assets/atlas/field.png",
      code: "wayfarer",
      anchor: [16, 31],
      frames: [{ name: "walk.down.0", x: 0, y: 0, w: 32, h: 32 }]
    }]
  });
  if (declared.atlasList().join(",") !== "assets/atlas/field.png") fail("atlas list");
  const pending = new A.AssetRegistry(declared);
  const unloaded = pending.lookup("hero.field", { pose: "walk", facing: "down", index: 0 });
  if (unloaded.ready || unloaded.codeId !== "wayfarer") fail("a missing image was treated as loaded");
  pending.noteImage("assets/atlas/field.png", { width: 32, height: 32 });
  const loaded = pending.lookup("hero.field", { name: "walk.down.0" });
  if (!loaded.ready || !loaded.frame || loaded.frame.w !== 32 || loaded.anchor.y !== 31) {
    fail("loaded frame was " + JSON.stringify(loaded.frame));
  }
  const stillCode = pending.lookup("maren");
  if (stillCode.ready || stillCode.codeId !== "maren") fail("an unknown key stopped falling back");

  const renderer = new A.SpriteRenderer(empty);
  const fakeCtx = { imageSmoothingEnabled: true };
  renderer.draw(fakeCtx, "wayfarer", 12, 24, { pose: "stand", facing: "right", frame: 0, scale: 1 });
  const call = asset.Art.spriteCalls[0];
  if (!call || call.id !== "wayfarer" || call.x !== 12 || call.y !== 24 || call.opts.pose !== "stand" || call.opts.scale !== 1) {
    fail("renderer fallback did not call Art.sprite");
  }
  const sheetCtx = {
    imageSmoothingEnabled: true,
    draws: [],
    save() {},
    restore() {},
    translate() {},
    scale() {},
    drawImage(...args) { this.draws.push(args); }
  };
  const sheetRenderer = new A.SpriteRenderer(pending);
  const beforeCalls = asset.Art.spriteCalls.length;
  sheetRenderer.draw(sheetCtx, "hero.field", 0, 0, { scale: 1, frame: 0 });
  if (!sheetCtx.draws.length || sheetCtx.draws[0][1] !== 0 || sheetCtx.draws[0][3] !== 32) {
    fail("sheet frame was not drawn");
  }
  if (asset.Art.spriteCalls.length !== beforeCalls) fail("a loaded frame also drew the code sprite");

  if (A.Animator.rateFor(1) !== 12) fail("full stick was " + A.Animator.rateFor(1) + " fps");
  if (A.Animator.rateFor(0.5) !== 7) fail("half stick was not floored at 7");
  if (A.Animator.rateFor(0) !== 7) fail("walk floor was " + A.Animator.rateFor(0));
  if (A.Animator.rateFor(4) !== 12) fail("a dash magnitude was not capped at the walk rate");
  function walkSeq(hz, seconds, magnitude) {
    const clock = new A.Animator();
    const dt = 1 / hz;
    const ticks = Math.round(hz * seconds);
    const seq = [];
    for (let n = 0; n < ticks; n++) {
      seq.push(clock.pose({
        moving: true,
        facing: "right",
        dt: dt,
        magnitude: magnitude == null ? 1 : magnitude,
        advance: true
      }).frame);
    }
    return seq;
  }
  function walkChanges(seq) {
    let n = 0;
    for (let i = 1; i < seq.length; i++) if (seq[i] !== seq[i - 1]) n++;
    return n;
  }
  function assertNoSkip(seq, label) {
    for (let i = 1; i < seq.length; i++) {
      const step = (seq[i] - seq[i - 1] + 6) % 6;
      if (step !== 0 && step !== 1) fail(label + " skipped " + seq[i - 1] + " to " + seq[i]);
    }
  }
  const at12 = walkSeq(12, 1, 1);
  if (at12.join(",") !== "0,1,2,3,4,5,0,1,2,3,4,5") fail("12 Hz walk was " + at12.join(","));
  for (const hz of [30, 60, 120]) {
    const seq = walkSeq(hz, 2, 1);
    assertNoSkip(seq, hz + " Hz");
    const rate = walkChanges(seq) / 2;
    if (rate < 10.5 || rate > 12.5) fail(hz + " Hz walked at " + rate + " fps");
  }
  const half = walkSeq(60, 2, 0.5);
  assertNoSkip(half, "half stick");
  const halfRate = walkChanges(half) / 2;
  if (halfRate < 6 || halfRate > 8) fail("half stick walked at " + halfRate + " fps");
  const restarted = new A.Animator();
  const contact = restarted.pose({ moving: true, facing: "down", dt: 0, magnitude: 1, advance: true });
  if (contact.frame !== 0) fail("a walk started on frame " + contact.frame);
  restarted.pose({ moving: true, facing: "down", dt: 1 / 12, magnitude: 1, advance: true });
  restarted.pose({ moving: false, facing: "down", advance: true, time: 0 });
  const again = restarted.pose({ moving: true, facing: "down", dt: 0, magnitude: 1, advance: true });
  if (again.frame !== 3) fail("a restart began on frame " + again.frame);
  const pose = new A.Animator();
  function expectPose(state, name, flip) {
    const got = pose.pose(state);
    if (got.name !== name || !!got.flip !== !!flip) {
      fail("pose " + JSON.stringify(state) + " was " + got.name + " flip " + got.flip);
    }
    return got;
  }
  expectPose({ moving: false, facing: "down", time: 0 }, "idle.down.0", false);
  expectPose({ moving: false, facing: "left", time: 0 }, "idle.side.0", true);
  expectPose({ moving: false, facing: "right", time: 0 }, "idle.side.0", false);
  expectPose({ moving: false, facing: "up", time: 0 }, "idle.up.0", false);
  expectPose({ moving: true, facing: "down", distance: 0 }, "walk.down.0", false);
  expectPose({ moving: true, facing: "left", distance: 0 }, "walk.side.0", true);
  expectPose({ moving: true, facing: "right", distance: 0 }, "walk.side.0", false);
  expectPose({ moving: true, facing: "up", distance: 0 }, "walk.up.0", false);
  expectPose({ moving: true, fx: -1, fy: 0, distance: 0 }, "walk.side.0", true);
  expectPose({ moving: true, fx: 1, fy: 0.2, distance: 0 }, "walk.side.0", false);
  expectPose({ moving: true, fx: 0, fy: -1, distance: 0 }, "walk.up.0", false);
  expectPose({ moving: true, fx: 0.2, fy: 1, distance: 0 }, "walk.down.0", false);
  if (pose.pose({ moving: false, facing: "down", time: 0.5 }).frame !== 3) fail("idle at 0.5s");
  if (pose.pose({ moving: false, facing: "down", time: 10, hold: true }).frame !== 0) fail("held idle moved");

  const layers = A.LayeredSprite.HERO.slice();
  if (layers.join(",") !== "kenmi.hero.base,kenmi.hero.pants,kenmi.hero.shoes,kenmi.hero.shirt,kenmi.hero.hair") {
    fail("hero layers are " + layers.join(","));
  }
  if (A.LayeredSprite.FIELD_SCALE !== 1) fail("field hero scale is not 1");
  const clipNames = [];
  ["idle", "walk"].forEach((clip) => {
    ["down", "side", "up"].forEach((dir) => {
      for (let n = 0; n < 6; n++) clipNames.push(clip + "." + dir + "." + n);
    });
  });
  const standEntries = layers.map((key, layer) => ({
    key,
    atlas: "assets/atlas/field-0.png",
    code: "wayfarer",
    anchor: [32, 39],
    frames: clipNames.map((name, n) => ({
      name,
      x: layer * 40 + n,
      y: layer,
      w: 10,
      h: 12,
      ox: 24 + layer,
      oy: 22
    }))
  }));
  const standImage = { width: 240, height: 20 };
  const standManifest = A.AssetManifest.fromData({ entries: standEntries });
  const standReg = new A.AssetRegistry(standManifest);
  standReg.noteImage("assets/atlas/field-0.png", standImage);
  const rig = new A.LayeredSprite(standReg, layers, new A.SpriteRenderer(standReg));
  function paintCtx() {
    return {
      imageSmoothingEnabled: true,
      ops: [],
      save() { this.ops.push(["save"]); },
      restore() { this.ops.push(["restore"]); },
      translate(x, y) { this.ops.push(["translate", x, y]); },
      scale(x, y) { this.ops.push(["scale", x, y]); },
      beginPath() {},
      fill() {},
      arc() { this.ops.push(["glow"]); },
      fillRect() { this.ops.push(["shard"]); },
      drawImage(...args) { this.ops.push(["draw", args]); }
    };
  }
  const stacked = paintCtx();
  if (!rig.draw(stacked, 80, 90, { name: "walk.down.0", flip: false, scale: 1 })) fail("stand-in rig did not draw");
  const layerDraws = stacked.ops.filter((op) => op[0] === "draw").map((op) => op[1]);
  if (layerDraws.length !== layers.length) fail("rig drew " + layerDraws.length + " layers");
  const downIndex = clipNames.indexOf("walk.down.0");
  for (let i = 0; i < layers.length; i++) {
    const args = layerDraws[i];
    if (args[0] !== standImage || args[1] !== i * 40 + downIndex || args[2] !== i || args[3] !== 10) {
      fail("layer " + layers[i] + " blit " + args.slice(1, 4).join(","));
    }
    if (args[5] !== 72 + i || args[6] !== 73 || args[7] !== 10 || args[8] !== 12) {
      fail("layer " + i + " feet dest " + args.slice(5).join(","));
    }
  }
  if (stacked.imageSmoothingEnabled !== true) fail("smoothing was left on");
  const mirrored = paintCtx();
  if (!rig.draw(mirrored, 80, 90, { name: "walk.side.0", flip: true, scale: 1 })) fail("left rig did not draw");
  const mirrors = mirrored.ops.filter((op) => op[0] === "scale");
  if (mirrors.length !== 5 || mirrors.some((op) => op[1] !== -1 || op[2] !== 1)) fail("left did not mirror the side row");
  const shifts = mirrored.ops.filter((op) => op[0] === "translate");
  for (let i = 0; i < shifts.length; i++) {
    if (shifts[i][1] !== 88 - i || shifts[i][2] !== 73) fail("left foot moved to " + shifts[i].slice(1).join(","));
  }
  const grown = paintCtx();
  rig.draw(grown, 0, 0, { name: "idle.down.0", scale: 2 });
  const grownDraw = grown.ops.find((op) => op[0] === "draw");
  if (!grownDraw || grownDraw[1][7] !== 20 || grownDraw[1][8] !== 24) fail("2x was not a whole-pixel scale");
  const fractional = paintCtx();
  rig.draw(fractional, 0, 0, { name: "idle.down.0", scale: 1.2 });
  const fractionalDraw = fractional.ops.find((op) => op[0] === "draw");
  if (!fractionalDraw || fractionalDraw[1][7] !== 10) fail("a fractional scale was drawn");
  const bare = paintCtx();
  const baseOnly = new A.LayeredSprite(
    new A.AssetRegistry(A.AssetManifest.fromData({ entries: [standEntries[0]] })),
    layers,
    new A.SpriteRenderer(null)
  );
  baseOnly.registry.noteImage("assets/atlas/field-0.png", standImage);
  if (baseOnly.draw(bare, 0, 0, { name: "idle.down.0", scale: 1 })) fail("a missing layer still drew");
  if (bare.ops.some((op) => op[0] === "draw")) fail("a partial doll was painted");

  vm.runInContext(fs.readFileSync("js/draw.js", "utf8"), asset, { filename: "js/draw.js" });
  asset.Art.fieldScale = function () { return 1; };
  asset.Art.fieldCast = { wayfarer: 1 };
  asset.SF.calm = function () { return false; };
  asset.SF.assets = new A.AssetRegistry(new A.AssetManifest());
  asset.SF.spriteRenderer = new A.SpriteRenderer(asset.SF.assets);
  asset.SF._heroRig = null;
  asset.SF.heroAnimator = null;
  asset.SF.heroTravel = 0;
  asset.SF._heroTravelToken = null;
  asset.SF.anim = 0.5;
  asset.Art.spriteCalls = [];
  const quiet = {
    save() {},
    restore() {},
    globalAlpha: 1,
    imageSmoothingEnabled: false,
    translate() {},
    scale() {},
    drawImage() {}
  };
  asset.SF.drawActor(quiet, "wayfarer", 40, 70, 0, 1, false, 1, 0);
  const idleCall = asset.Art.spriteCalls[asset.Art.spriteCalls.length - 1];
  if (!idleCall || idleCall.id !== "wayfarer" || idleCall.x !== 40 || idleCall.y !== 70 ||
      idleCall.opts.pose !== "stand" || idleCall.opts.frame !== 1 || idleCall.opts.facing !== "down" ||
      idleCall.opts.scale !== 1) {
    fail("missing atlas did not keep the code hero " + JSON.stringify(idleCall));
  }
  asset.SF.anim = 0.3;
  asset.Art.spriteCalls = [];
  asset.SF.drawActor(quiet, "wayfarer", 40, 70, -1, 0, true, 1, 0);
  const walkCall = asset.Art.spriteCalls.pop();
  if (!walkCall || walkCall.opts.pose !== "walk" || walkCall.opts.facing !== "left" ||
      walkCall.opts.frame !== 2 || walkCall.opts.scale !== 1 || walkCall.x !== 40 || walkCall.y !== 70) {
    fail("moving fallback was " + JSON.stringify(walkCall && walkCall.opts));
  }
  asset.Art.spriteCalls = [];
  asset.SF.drawActor(quiet, "maren", 3, 4, 1, 0, false, 1, 0);
  const npcCall = asset.Art.spriteCalls.pop();
  if (!npcCall || npcCall.id !== "maren" || npcCall.x !== 3 || npcCall.y !== 4) fail("an npc used the hero rig");

  asset.SF.assets.setManifest(A.AssetManifest.fromData({ entries: [standEntries[0]] }));
  asset.SF.assets.noteImage("assets/atlas/field-0.png", standImage);
  asset.SF._heroRig = null;
  asset.SF.anim = 0;
  asset.Art.spriteCalls = [];
  const partialCtx = paintCtx();
  asset.SF.drawActor(partialCtx, "wayfarer", 10, 20, 0, 1, false, 1, 0);
  if (partialCtx.ops.some((op) => op[0] === "draw")) fail("a partial hero was drawn before fallback");
  const partialCall = asset.Art.spriteCalls.pop();
  if (!partialCall || partialCall.id !== "wayfarer" || partialCall.opts.pose !== "stand" || partialCall.opts.scale !== 1) {
    fail("partial atlas did not fall back to the code hero");
  }

  asset.SF.assets.setManifest(standManifest);
  asset.SF.assets.noteImage("assets/atlas/field-0.png", standImage);
  asset.SF._heroRig = null;
  asset.SF.heroTravel = 0;
  asset.Art.spriteCalls = [];
  const live = paintCtx();
  asset.SF.drawActor(live, "wayfarer", 80, 90, 1, 0, true, 1, 0);
  if (asset.Art.spriteCalls.length) fail("a loaded hero also drew the code sprite");
  const liveDraws = live.ops.filter((op) => op[0] === "draw").map((op) => op[1]);
  if (liveDraws.length !== 5) fail("field hero drew " + liveDraws.length + " layers");
  const sideIndex = clipNames.indexOf("walk.side.0");
  for (let i = 0; i < liveDraws.length; i++) {
    if (liveDraws[i][1] !== i * 40 + sideIndex || liveDraws[i][5] !== 72 + i) {
      fail("field layer " + i + " was " + liveDraws[i].slice(1).join(","));
    }
  }
  asset.Art.spriteCalls = [];
  const leftLive = paintCtx();
  asset.SF.drawActor(leftLive, "wayfarer", 80, 90, -1, 0, true, 1, 0);
  const leftScales = leftLive.ops.filter((op) => op[0] === "scale");
  if (asset.Art.spriteCalls.length || leftScales.length !== 5 || leftScales.some((op) => op[1] !== -1)) {
    fail("the field hero did not mirror left");
  }

  const namedOnly = A.AssetManifest.fromData({
    entries: [{
      key: "kenmi.hero.hair",
      atlas: "assets/atlas/field-0.png",
      code: "wayfarer",
      anchor: [32, 39],
      frames: [0, 1, 2, 3, 4, 5].map((n) => ({ name: "idle.down." + n, x: n, y: 0, w: 4, h: 4 }))
    }]
  });
  const namedReg = new A.AssetRegistry(namedOnly);
  namedReg.noteImage("assets/atlas/field-0.png", standImage);
  const missedName = namedReg.lookup("kenmi.hero.hair", { name: "walk.up.2", index: 2 });
  if (missedName.ready || (missedName.frame && missedName.frame.name === "idle.down.2")) {
    fail("a missing walk frame was taken by list position");
  }
  const incomplete = namedReg.lookup("kenmi.hero.hair", {
    name: "idle.down.0",
    names: new A.Animator().clipFrames("walk")
  });
  if (incomplete.ready) fail("a clip missing walk frames was ready");
  const gappyHair = standEntries.map((entry) => {
    if (entry.key !== "kenmi.hero.hair") return entry;
    return {
      key: entry.key,
      atlas: entry.atlas,
      code: entry.code,
      anchor: entry.anchor,
      frames: entry.frames.filter((frame) => frame.name !== "walk.up.2")
    };
  });
  asset.SF.assets.setManifest(A.AssetManifest.fromData({ entries: gappyHair }));
  asset.SF.assets.noteImage("assets/atlas/field-0.png", standImage);
  asset.SF._heroRig = null;
  asset.SF.heroAnimator = null;
  asset.Art.spriteCalls = [];
  const gappyCtx = paintCtx();
  asset.SF.anim = 0;
  asset.SF.drawActor(gappyCtx, "wayfarer", 10, 20, 0, 1, true, 1, 0);
  if (gappyCtx.ops.some((op) => op[0] === "draw")) fail("a partial clip drew a layer");
  const gappyCall = asset.Art.spriteCalls.pop();
  if (!gappyCall || gappyCall.id !== "wayfarer" || gappyCall.opts.pose !== "walk") {
    fail("a partial clip did not fall back to the code hero");
  }
  asset.SF.assets.setManifest(standManifest);
  asset.SF.assets.noteImage("assets/atlas/field-0.png", standImage);
  asset.SF._heroRig = null;
  asset.SF.heroAnimator = null;
  asset.SF.state = { player: { x: 5, y: 6, px: 0, py: 6, fx: 1, fy: 0, dashT: 0 } };
  asset.SF.stepDt = 1 / 12;
  asset.SF.readMove = () => ({ x: 1, y: 0 });
  asset.SF.drawWayfarer(quiet, 5, 6, 1, 0, 1, false);
  const started = asset.SF.heroAnimator.walkFrame;
  if (started !== 0) fail("the field walk started on frame " + started);
  asset.SF.drawWayfarer(quiet, 99, 99, -1, 0, 0.4, false);
  if (asset.SF.heroAnimator.walkFrame !== 0 || asset.SF.heroAnimator.walking !== true) {
    fail("a ghost moved the walk clock");
  }
  asset.SF.state.player.px = 0;
  asset.SF.drawWayfarer(quiet, 5, 6, 1, 0, 1, false);
  if (asset.SF.heroAnimator.walkFrame !== 1) fail("12 Hz did not step one cell, frame " + asset.SF.heroAnimator.walkFrame);
  const handTable = JSON.parse(fs.readFileSync("js/assets/hand-table.json", "utf8"));
  const crystal = new A.HandCrystal();
  ["idle", "walk"].forEach((clip) => {
    for (let frame = 0; frame < 6; frame++) {
      const down = crystal.place({ clip: clip, dir: "down", facing: "down", flip: false, frame: frame });
      const downCell = handTable[clip].down[frame];
      if (!down || down.behind || down.x !== downCell[0] || down.y !== downCell[1]) {
        fail(clip + " down " + frame + " crystal was " + JSON.stringify(down));
      }
      const right = crystal.place({ clip: clip, dir: "side", facing: "right", flip: false, frame: frame });
      const front = handTable[clip].side_front[frame];
      if (!right || right.behind || right.x !== front[0] || right.y !== front[1]) {
        fail(clip + " side front " + frame + " crystal was " + JSON.stringify(right));
      }
      const left = crystal.place({ clip: clip, dir: "side", facing: "left", flip: true, frame: frame });
      const back = handTable[clip].side_back[frame];
      if (!left || !left.behind || left.x !== -back[0] || left.y !== back[1]) {
        fail(clip + " side back " + frame + " crystal was " + JSON.stringify(left));
      }
      const up = crystal.place({ clip: clip, dir: "up", facing: "up", flip: false, frame: frame });
      const upCell = handTable[clip].up[frame];
      if (!up || !up.behind || up.x !== upCell[0] || up.y !== upCell[1]) {
        fail(clip + " up " + frame + " crystal was " + JSON.stringify(up));
      }
    }
  });
  if (A.HandCrystal.PALM_DROP !== 1) fail("the shard is not one pixel under the sleeve");
  asset.SF._heroTick = false;
  const frontCtx = paintCtx();
  if (asset.SF.drawFieldHero(frontCtx, 40, 70, { facing: "down" }, false, true) !== true) {
    fail("the front crystal had no doll");
  }
  const frontOps = frontCtx.ops.map((op) => op[0]);
  if (frontOps.indexOf("draw") < 0 || frontOps.indexOf("shard") < frontOps.indexOf("draw")) {
    fail("the down crystal was not painted after the body");
  }
  const backCtx = paintCtx();
  if (asset.SF.drawFieldHero(backCtx, 40, 70, { facing: "left" }, false, true) !== true) {
    fail("the back crystal had no doll");
  }
  const backOps = backCtx.ops.map((op) => op[0]);
  if (backOps.indexOf("glow") < 0 || backOps.indexOf("glow") > backOps.indexOf("draw") || backOps.indexOf("shard") >= 0) {
    fail("the left crystal was not a glow behind the body");
  }

  if (SF.fresh().player.r !== 12) fail("hero collision radius changed");
  if (!drawJs.includes("SF.drawShadow(ctx, p.x, p.y,")) fail("hero shadow left the feet");
  if (!drawJs.includes("kenmi ? 7 : 11")) fail("the foot ring does not follow the sprite");
  if (!drawJs.includes("ringR * 0.45")) fail("the foot ring lost its shape");
  if (!drawJs.includes("ctx.fillText(n.name, nx, ny - 34)")) fail("name tag moved");
  if (!drawJs.includes("SF.GUIDE_HEAD = 60")) fail("quest diamond moved");
  if (fs.readFileSync("js/battle/draw.js", "utf8").includes("LayeredSprite")) fail("battle draws the field rig");

  const missingManifest = await A.AssetManifest.load("assets/atlas/manifest.json", () => null);
  if (missingManifest.keys().length) fail("a missing manifest was not empty");
  const thrownManifest = await A.AssetManifest.load("assets/atlas/manifest.json", () => {
    throw new Error("gone");
  });
  if (thrownManifest.keys().length) fail("a thrown manifest read escaped");
  const badManifest = await A.AssetManifest.load("assets/atlas/manifest.json", () => Promise.reject(new Error("nope")));
  if (badManifest.keys().length) fail("a rejected manifest read escaped");

  asset.fetch = () => Promise.reject(new Error("offline"));
  if (await A.AssetLoader.json("assets/atlas/manifest.json", 200) !== null) fail("a failed json load rejected");
  asset.fetch = () => Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({ entries: [{ key: "x" }] }) });
  if (await A.AssetLoader.json("assets/atlas/manifest.json", 200) !== null) fail("a 404 was treated as a manifest");
  asset.fetch = () => new Promise(() => {});
  if (await A.AssetLoader.json("assets/atlas/manifest.json", 30) !== null) fail("a hung json load did not time out");

  function FakeImage() {}
  FakeImage.prototype = {
    set src(url) {
      const img = this;
      Promise.resolve().then(() => {
        if (String(url).indexOf("missing") >= 0) {
          if (img.onerror) img.onerror();
        } else if (img.onload) {
          img.naturalWidth = 8;
          img.naturalHeight = 8;
          img.onload();
        }
      });
    }
  };
  asset.Image = FakeImage;
  const images = await A.AssetLoader.images(["assets/atlas/field.png", "assets/atlas/missing.png"], 200);
  if (!images["assets/atlas/field.png"] || images["assets/atlas/missing.png"]) {
    fail("image batch did not keep the good file and drop the bad one");
  }
  function HungImage() {}
  HungImage.prototype = { set src(_) {} };
  asset.Image = HungImage;
  if (await A.AssetLoader.image("assets/atlas/field.png", 30) !== null) fail("a hung image load did not time out");

  console.log("asset checks ok");
  await runAtlasChecks();
}

async function runAtlasChecks() {
  const { PNG } = await import("pngjs");
  const { ConfigReader } = await import("./atlas/config-reader.js");
  const { FrameExtractor } = await import("./atlas/frame-extractor.js");
  const { Packer } = await import("./atlas/packer.js");
  const manifestVm = { console, setTimeout, clearTimeout, Promise };
  manifestVm.window = manifestVm;
  vm.createContext(manifestVm);
  vm.runInContext(fs.readFileSync("js/assets/manifest.js", "utf8"), manifestVm, { filename: "js/assets/manifest.js" });
  const Manifest = manifestVm.SF.AssetManifest;
  const atlasSrc = fs.readdirSync("tools/atlas").filter((name) => name.endsWith(".js")).map((name) => {
    return fs.readFileSync(path.join("tools/atlas", name), "utf8");
  }).join("\n");
  if (/\bfetch\s*\(|\bhttps?:\/\//.test(atlasSrc)) fail("atlas tools make a network call");
  for (const name of ["config-reader.js", "frame-extractor.js", "packer.js", "atlas-writer.js", "cli.js"]) {
    if (!fs.existsSync(path.join("tools/atlas", name))) fail("missing atlas module " + name);
  }

  const declared = JSON.parse(fs.readFileSync("art/atlas.config.json", "utf8"));
  const gameFiles = [];
  function walkJs(dir) {
    for (const name of fs.readdirSync(dir)) {
      const file = path.join(dir, name);
      if (fs.statSync(file).isDirectory()) walkJs(file);
      else if (name.endsWith(".js")) gameFiles.push(file);
    }
  }
  walkJs("js");
  const rigText = fs.readFileSync("js/assets/rig.js", "utf8");
  let layerAt = -1;
  for (const part of ["base", "pants", "shoes", "shirt", "hair"]) {
    const at = rigText.indexOf("kenmi.hero." + part);
    if (at < 0 || at < layerAt) fail("hero layers are out of order in the rig");
    layerAt = at;
  }
  if (!declared.entries || declared.entries.length < 2) fail("atlas config needs more than one sheet");
  const packPaths = {
    "kenmi.hero.base": "vendor/kenmi/Cute_Fantasy/Player/Player_Base/Player_Base_animations.png",
    "kenmi.hero.hair": "vendor/kenmi/Cute_Fantasy/Player/Head/Hair_1/Hair_1_Brown.png",
    "kenmi.hero.shirt": "vendor/kenmi/Cute_Fantasy/Player/Chest/Royal_Shirt/Royal_Shirt_1_Blue.png",
    "kenmi.hero.pants": "vendor/kenmi/Cute_Fantasy/Player/Legs/OG_Pants/Pants_1_Brown.png",
    "kenmi.hero.shoes": "vendor/kenmi/Cute_Fantasy/Player/Feet/Shoes_1_Brown.png"
  };
  function wellFormedPackPath(packPath) {
    if (typeof packPath !== "string" || !packPath.endsWith(".png")) return false;
    if (packPath.startsWith("/") || packPath.includes("\\") || packPath.includes("\0")) return false;
    const parts = packPath.split("/");
    if (parts.length < 4 || parts[0] !== "vendor" || parts[1] !== "kenmi") return false;
    if (!parts[2] || parts[2] === "Cute_Fantasy_Free") return false;
    if (parts.some((part) => !part || part === "." || part === "..")) return false;
    return true;
  }
  const packs = new Set();
  for (const entry of declared.entries) {
    if (!entry.key || !entry.key.startsWith("kenmi.hero.")) fail("packed key is visible to the game: " + entry.key);
    if (!rigText.includes(entry.key)) fail("the field rig does not draw " + entry.key);
    for (const file of gameFiles) {
      if (file === "js/assets/rig.js") continue;
      if (fs.readFileSync(file, "utf8").includes(entry.key)) fail(file + " references " + entry.key);
    }
    if (!wellFormedPackPath(entry.path)) fail("pack path is not well-formed: " + entry.path);
    if (packPaths[entry.key] !== entry.path) fail("pack path for " + entry.key + " is " + entry.path);
    if (!entry.anchor || entry.anchor[0] !== 32 || entry.anchor[1] !== 39) fail(entry.key + " foot anchor is not the measured foot line");
    packs.add(entry.path.split("/")[2]);
    if (entry.path.includes("Cute_Fantasy_Free")) fail("the free pack is non-commercial");
    const clips = entry.grid && entry.grid.clips || [];
    const names = clips.map((clip) => clip.name).sort().join(",");
    if (names !== "idle.down,idle.side,idle.up,walk.down,walk.side,walk.up") {
      fail(entry.key + " is not idle and walk in three directions");
    }
  }
  const reader = new ConfigReader(declared);
  const planned = reader.frames();
  if (![...packs].includes("Cute_Fantasy")) fail("hero frames are not from Cute_Fantasy");
  if (planned.length !== declared.entries.length * 36) fail("hero clip did not expand to 36 frames");
  const packer = new Packer({
    padding: reader.padding,
    maxSize: reader.maxSize,
    shuffle: true,
    seed: reader.seed
  });
  const plannedPages = packer.pack(planned.map((frame) => ({
    key: frame.key,
    file: frame.file,
    w: frame.w + reader.extrude * 2,
    h: frame.h + reader.extrude * 2
  })));
  if (plannedPages.reduce((n, page) => n + page.placements.length, 0) !== planned.length) {
    fail("a declared hero frame was dropped");
  }
  if (!plannedPages.some((page) => new Set(page.placements.map((p) => p.frame.file)).size > 1)) {
    fail("atlas pages did not mix source sheets");
  }
  let badPathThrew = false;
  try {
    new ConfigReader({ entries: [{ key: "x", path: "vendor/kenmi/Cute_Fantasy/../secret.png", rects: [{ name: "a", x: 0, y: 0, w: 1, h: 1 }] }] }).frames();
  } catch (err) {
    badPathThrew = /not well-formed/.test(err.message);
  }
  if (!badPathThrew) fail("a path with .. was accepted");
  const straight = new Packer({ padding: 1, maxSize: 64, shuffle: false, seed: 1 });
  const mixedUp = new Packer({ padding: 1, maxSize: 64, shuffle: true, seed: 1 });
  const tiles = [0, 1, 2].map((n) => ({ key: "k" + n, w: 4, h: 4, n }));
  const a = straight.pack(tiles)[0].placements.map((p) => p.frame.n + "@" + p.x);
  const b = mixedUp.pack(tiles)[0].placements.map((p) => p.frame.n + "@" + p.x);
  if (a.join(",") === b.join(",")) fail("shuffle did not move frames");

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "shardfall-atlas-"));
  const packA = path.join(dir, "pack-a");
  const packB = path.join(dir, "pack-b");
  fs.mkdirSync(packA, { recursive: true });
  fs.mkdirSync(packB, { recursive: true });
  function paint(file, width, height, fill) {
    const png = new PNG({ width, height });
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const rgba = fill(x, y);
        png.data[i] = rgba[0];
        png.data[i + 1] = rgba[1];
        png.data[i + 2] = rgba[2];
        png.data[i + 3] = rgba[3];
      }
    }
    fs.writeFileSync(file, PNG.sync.write(png));
  }
  paint(path.join(packA, "sheet.png"), 8, 4, (x, y) => [20 + x * 20, y * 40, 10, 255]);
  paint(path.join(packB, "sheet.png"), 4, 4, () => [0, 80, 200, 255]);
  const cfg = {
    atlas: "field",
    maxSize: 64,
    padding: 1,
    extrude: 1,
    shuffle: true,
    seed: 3,
    entries: [
      {
        key: "kenmi.hero.base",
        path: "pack-a/sheet.png",
        code: "wayfarer",
        anchor: [1, 3],
        rects: [{ name: "idle.down.0", x: 1, y: 1, w: 2, h: 2 }]
      },
      {
        key: "kenmi.hero.hair",
        path: "pack-b/sheet.png",
        code: "wayfarer",
        anchor: [1, 3],
        grid: { cell: 2, clips: [{ name: "walk.side", row: 0, count: 2 }] }
      }
    ]
  };
  const cfgFile = path.join(dir, "atlas.config.json");
  const outDir = path.join(dir, "out");
  fs.writeFileSync(cfgFile, JSON.stringify(cfg));
  const missing = spawnSync(process.execPath, [
    "tools/atlas/cli.js", "--config", cfgFile, "--assets", path.join(dir, "nope"), "--out", outDir
  ], { encoding: "utf8" });
  if (missing.status === 0) fail("the packer succeeded without an assets dir");
  const packed = spawnSync(process.execPath, [
    "tools/atlas/cli.js", "--config", cfgFile, "--assets", dir, "--out", outDir
  ], { encoding: "utf8" });
  if (packed.status !== 0) fail("packer failed: " + (packed.stderr || packed.stdout));
  const names = fs.readdirSync(outDir).sort();
  if (names.some((name) => name !== "manifest.json" && !/^field-\d+\.png$/.test(name))) {
    fail("atlas output was not just pngs and a manifest: " + names.join(","));
  }
  const manifest = JSON.parse(fs.readFileSync(path.join(outDir, "manifest.json"), "utf8"));
  const loaded = Manifest.fromData(manifest);
  if (loaded.keys().sort().join(",") !== "kenmi.hero.base,kenmi.hero.hair") fail("manifest keys");
  const hair = loaded.get("kenmi.hero.hair");
  const base = loaded.get("kenmi.hero.base");
  if (!hair || hair.frames.length !== 2 || hair.frames[0].name !== "walk.side.0" || hair.frames[0].w !== 2) {
    fail("grid frames were not written for the manifest");
  }
  if (!base || base.code !== "wayfarer" || !base.anchor || base.anchor.y !== 3 || base.frames[0].name !== "idle.down.0") {
    fail("rect frame was not written for the manifest");
  }
  if (base.frames[0].ox !== 0 || base.frames[0].oy !== 0 || base.frames[0].w !== 2) {
    fail("a full opaque cell was trimmed");
  }
  if (base.atlas !== hair.atlas) fail("frames from two packs did not share an atlas");
  const atlasPng = PNG.sync.read(fs.readFileSync(path.join(outDir, path.basename(base.atlas))));
  const srcA = PNG.sync.read(fs.readFileSync(path.join(packA, "sheet.png")));
  const srcB = PNG.sync.read(fs.readFileSync(path.join(packB, "sheet.png")));
  if (atlasPng.data.equals(srcA.data) || atlasPng.data.equals(srcB.data)) fail("a raw pack sheet was written");
  if (atlasPng.width === srcA.width && atlasPng.height === srcA.height) fail("atlas kept a source sheet's size");
  const frame = base.frames[0];
  const sample = (png, x, y) => {
    const i = (y * png.width + x) * 4;
    return [png.data[i], png.data[i + 1], png.data[i + 2], png.data[i + 3]];
  };
  const got = sample(atlasPng, frame.x, frame.y);
  const want = sample(srcA, 1, 1);
  if (got.join(",") !== want.join(",")) fail("packed pixel was " + got.join(",") + " not " + want.join(","));
  const edge = sample(atlasPng, frame.x - 1, frame.y);
  if (edge.join(",") !== want.join(",")) fail("extruded edge did not copy the frame");
  if (sample(atlasPng, 0, 0)[3] !== 0) fail("padding pixel was not empty");
  const extractor = new FrameExtractor(1);
  const cut = extractor.cut(path.join(packA, "sheet.png"), { name: "idle.down.0", x: 1, y: 1, w: 2, h: 2 });
  if (cut.w !== 4 || cut.h !== 4) fail("extrusion did not grow the frame");
  if (cut.data[((1 * cut.w) + 1) * 4] !== srcA.data[(1 * srcA.width + 1) * 4]) fail("inner pixel changed");

  paint(path.join(dir, "sparse.png"), 8, 8, () => [0, 0, 0, 0]);
  const sparse = PNG.sync.read(fs.readFileSync(path.join(dir, "sparse.png")));
  for (let y = 4; y <= 5; y++) {
    for (let x = 3; x <= 4; x++) {
      const i = (y * 8 + x) * 4;
      sparse.data[i] = 200;
      sparse.data[i + 1] = 10;
      sparse.data[i + 2] = 10;
      sparse.data[i + 3] = 255;
    }
  }
  fs.writeFileSync(path.join(dir, "sparse.png"), PNG.sync.write(sparse));
  const trimCfg = {
    atlas: "field",
    maxSize: 64,
    padding: 1,
    extrude: 1,
    shuffle: false,
    entries: [{
      key: "kenmi.hero.base",
      path: "sparse.png",
      code: "wayfarer",
      anchor: [4, 5],
      rects: [{ name: "idle.down.0", x: 0, y: 0, w: 8, h: 8 }]
    }]
  };
  const trimCfgFile = path.join(dir, "trim.config.json");
  const trimOut = path.join(dir, "trim-out");
  fs.writeFileSync(trimCfgFile, JSON.stringify(trimCfg));
  const trimmed = spawnSync(process.execPath, [
    "tools/atlas/cli.js", "--config", trimCfgFile, "--assets", dir, "--out", trimOut, "--no-shuffle"
  ], { encoding: "utf8" });
  if (trimmed.status !== 0) fail("trim pack failed: " + (trimmed.stderr || trimmed.stdout));
  const trimManifest = JSON.parse(fs.readFileSync(path.join(trimOut, "manifest.json"), "utf8"));
  const trimLoaded = Manifest.fromData(trimManifest);
  const trimFrame = trimLoaded.get("kenmi.hero.base").frames[0];
  if (trimFrame.ox !== 2 || trimFrame.oy !== 3 || trimFrame.w !== 4 || trimFrame.h !== 4) {
    fail("trimmed frame was " + JSON.stringify(trimFrame));
  }
  if (trimFrame.w * trimFrame.h >= 8 * 8) fail("trim left the empty cell");
  const trimPng = PNG.sync.read(fs.readFileSync(path.join(trimOut, "field-0.png")));
  const blob = sample(trimPng, trimFrame.x + 1, trimFrame.y + 1);
  if (blob.join(",") !== "200,10,10,255") fail("trimmed pixel moved");
  const foot = extractor.footLine(path.join(dir, "sparse.png"), [{ x: 0, y: 0, w: 8, h: 8 }]);
  if (foot[0] !== 4 || foot[1] !== 5) fail("foot line measured " + foot.join(","));

  const drawVm = { console, setTimeout, clearTimeout, Promise };
  drawVm.window = drawVm;
  vm.createContext(drawVm);
  vm.runInContext(fs.readFileSync("js/assets/renderer.js", "utf8"), drawVm, { filename: "js/assets/renderer.js" });
  const draws = [];
  const trimRenderer = new drawVm.SF.SpriteRenderer(null);
  trimRenderer.drawFrame({
    imageSmoothingEnabled: false,
    drawImage(...args) { draws.push(args); }
  }, {
    image: { width: 4, height: 4 },
    anchor: { x: 4, y: 5 },
    frame: trimFrame,
    flip: false
  }, 100, 80, { scale: 1 });
  if (!draws.length || draws[0][5] !== 100 - (4 - trimFrame.ox) || draws[0][6] !== 80 - (5 - trimFrame.oy)) {
    fail("trimmed anchor was not offset, dest " + (draws[0] && draws[0].slice(5, 7).join(",")));
  }

  function blankSheet(width, height) {
    const png = new PNG({ width, height });
    png.data.fill(0);
    return png;
  }
  function putPixel(png, x, y, rgba) {
    const i = (y * png.width + x) * 4;
    png.data[i] = rgba[0];
    png.data[i + 1] = rgba[1];
    png.data[i + 2] = rgba[2];
    png.data[i + 3] = rgba[3];
  }
  const cellW = 16;
  const cellH = 14;
  const mirrorFoot = [6, 11];
  const bodyPx = [[2, 8], [3, 8], [4, 8], [3, 9], [4, 9], [5, 9], [4, 10], [5, 10]];
  const hairPx = [[4, 2], [5, 2], [6, 2], [5, 3], [6, 3], [7, 3]];
  const bodySheet = blankSheet(cellW, cellH);
  const hairSheet = blankSheet(cellW, cellH);
  bodyPx.forEach(([x, y]) => putPixel(bodySheet, x, y, [20, 70, 210, 255]));
  hairPx.forEach(([x, y]) => putPixel(hairSheet, x, y, [120, 60, 30, 255]));
  fs.writeFileSync(path.join(dir, "body.png"), PNG.sync.write(bodySheet));
  fs.writeFileSync(path.join(dir, "hair.png"), PNG.sync.write(hairSheet));
  const mirrorCfg = {
    atlas: "field",
    maxSize: 64,
    padding: 1,
    extrude: 1,
    shuffle: false,
    entries: [
      {
        key: "kenmi.hero.base",
        path: "body.png",
        code: "wayfarer",
        anchor: mirrorFoot,
        rects: [{ name: "idle.side.0", x: 0, y: 0, w: cellW, h: cellH }]
      },
      {
        key: "kenmi.hero.hair",
        path: "hair.png",
        code: "wayfarer",
        anchor: mirrorFoot,
        rects: [{ name: "idle.side.0", x: 0, y: 0, w: cellW, h: cellH }]
      }
    ]
  };
  const mirrorOut = path.join(dir, "mirror-out");
  fs.writeFileSync(path.join(dir, "mirror.config.json"), JSON.stringify(mirrorCfg));
  const mirrored = spawnSync(process.execPath, [
    "tools/atlas/cli.js", "--config", path.join(dir, "mirror.config.json"),
    "--assets", dir, "--out", mirrorOut, "--no-shuffle"
  ], { encoding: "utf8" });
  if (mirrored.status !== 0) fail("mirror pack failed: " + (mirrored.stderr || mirrored.stdout));
  const mirrorManifest = Manifest.fromData(JSON.parse(fs.readFileSync(path.join(mirrorOut, "manifest.json"), "utf8")));
  const atlasImages = {};
  for (const name of fs.readdirSync(mirrorOut)) {
    if (name.endsWith(".png")) atlasImages[name] = PNG.sync.read(fs.readFileSync(path.join(mirrorOut, name)));
  }
  function softwareCtx(width, height) {
    const data = Buffer.alloc(width * height * 4, 0);
    const stack = [];
    let m = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
    function multiply(n) {
      m = {
        a: m.a * n.a + m.c * n.b,
        b: m.b * n.a + m.d * n.b,
        c: m.a * n.c + m.c * n.d,
        d: m.b * n.c + m.d * n.d,
        e: m.a * n.e + m.c * n.f + m.e,
        f: m.b * n.e + m.d * n.f + m.f
      };
    }
    return {
      data,
      width,
      height,
      imageSmoothingEnabled: false,
      save() { stack.push({ a: m.a, b: m.b, c: m.c, d: m.d, e: m.e, f: m.f }); },
      restore() { m = stack.pop(); },
      translate(x, y) { multiply({ a: 1, b: 0, c: 0, d: 1, e: x, f: y }); },
      scale(x, y) { multiply({ a: x, b: 0, c: 0, d: y, e: 0, f: 0 }); },
      getTransform() { return { a: m.a, b: m.b, c: m.c, d: m.d, e: m.e, f: m.f }; },
      setTransform(a, b, c, d, e, f) { m = { a, b, c, d, e, f }; },
      drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh) {
        for (let j = 0; j < sh; j++) {
          for (let i = 0; i < sw; i++) {
            const si = ((sy + j) * img.width + (sx + i)) * 4;
            if (img.data[si + 3] === 0) continue;
            const x0 = dx + (i * dw) / sw;
            const y0 = dy + (j * dh) / sh;
            const x1 = dx + ((i + 1) * dw) / sw;
            const y1 = dy + ((j + 1) * dh) / sh;
            const pts = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]];
            let minX = Infinity;
            let minY = Infinity;
            for (let p = 0; p < pts.length; p++) {
              const sx2 = m.a * pts[p][0] + m.c * pts[p][1] + m.e;
              const sy2 = m.b * pts[p][0] + m.d * pts[p][1] + m.f;
              if (sx2 < minX) minX = sx2;
              if (sy2 < minY) minY = sy2;
            }
            const px = Math.floor(minX + 1e-6);
            const py = Math.floor(minY + 1e-6);
            if (px < 0 || py < 0 || px >= width || py >= height) continue;
            const di = (py * width + px) * 4;
            data[di] = img.data[si];
            data[di + 1] = img.data[si + 1];
            data[di + 2] = img.data[si + 2];
            data[di + 3] = img.data[si + 3];
          }
        }
      }
    };
  }
  const mirrorView = 48;
  const feetX = 24;
  const feetY = 28;
  const flipped = softwareCtx(mirrorView, mirrorView);
  const mirrorRenderer = new drawVm.SF.SpriteRenderer(null);
  for (const key of ["kenmi.hero.base", "kenmi.hero.hair"]) {
    const entry = mirrorManifest.get(key);
    const image = atlasImages[path.basename(entry.atlas)];
    mirrorRenderer.drawFrame(flipped, {
      image,
      anchor: entry.anchor,
      frame: entry.frames[0],
      flip: true
    }, feetX, feetY, { scale: 1 });
  }
  const expectMirror = Buffer.alloc(mirrorView * mirrorView * 4, 0);
  function plotMirror(sheet) {
    for (let cy = 0; cy < sheet.height; cy++) {
      for (let cx = 0; cx < sheet.width; cx++) {
        const si = (cy * sheet.width + cx) * 4;
        if (sheet.data[si + 3] === 0) continue;
        const wx = feetX + (mirrorFoot[0] - cx) - 1;
        const wy = feetY - mirrorFoot[1] + cy;
        if (wx < 0 || wy < 0 || wx >= mirrorView || wy >= mirrorView) fail("mirror pixel fell outside the test");
        const di = (wy * mirrorView + wx) * 4;
        expectMirror[di] = sheet.data[si];
        expectMirror[di + 1] = sheet.data[si + 1];
        expectMirror[di + 2] = sheet.data[si + 2];
        expectMirror[di + 3] = sheet.data[si + 3];
      }
    }
  }
  plotMirror(bodySheet);
  plotMirror(hairSheet);
  let mirrorMiss = 0;
  for (let i = 0; i < expectMirror.length; i += 4) {
    if (flipped.data[i] !== expectMirror[i] || flipped.data[i + 1] !== expectMirror[i + 1] || flipped.data[i + 2] !== expectMirror[i + 2] || flipped.data[i + 3] !== expectMirror[i + 3]) {
      mirrorMiss += 1;
    }
  }
  if (mirrorMiss) fail("flipped trimmed layers were not a mirror of the source (" + mirrorMiss + " pixels)");

  if (process.env.ASSETS_DIR) {
    const assetsDir = process.env.ASSETS_DIR;
    if (!fs.existsSync(assetsDir) || !fs.statSync(assetsDir).isDirectory()) {
      fail("ASSETS_DIR is set but missing: " + assetsDir);
    }
    const live = new FrameExtractor(0, 0);
    const byFile = new Map();
    for (const frame of planned) {
      const abs = path.resolve(assetsDir, frame.file);
      if (!fs.existsSync(abs)) fail("missing pack file " + frame.file);
      if (!byFile.has(frame.file)) byFile.set(frame.file, []);
      byFile.get(frame.file).push(frame);
    }
    for (const [rel, frames] of byFile) {
      const abs = path.resolve(assetsDir, rel);
      let opaque = 0;
      for (const frame of frames) {
        const piece = live.cut(abs, frame);
        if (!piece.empty) opaque += 1;
      }
      if (!opaque) fail(rel + " yielded no opaque frame");
    }
    const baseRel = packPaths["kenmi.hero.base"];
    const down = planned.filter((frame) => frame.key === "kenmi.hero.base" && frame.name.startsWith("idle.down."));
    const measured = live.footLine(path.resolve(assetsDir, baseRel), down);
    const declaredFoot = declared.entries.find((entry) => entry.key === "kenmi.hero.base").anchor;
    if (Math.abs(measured[0] - declaredFoot[0]) > 2 || Math.abs(measured[1] - declaredFoot[1]) > 2) {
      fail("foot line measured " + measured.join(",") + " but the config anchor is " + declaredFoot.join(","));
    }
    console.log("atlas files ok, foot " + measured.join(","));
  }

  fs.rmSync(dir, { recursive: true, force: true });
  console.log("atlas checks ok");
}

console.log("smoke ok");
