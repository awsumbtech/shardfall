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
for (const file of ["js/data.js", "js/audio.js", "js/save.js", "js/sim.js"]) {
  vm.runInContext(fs.readFileSync(file, "utf8"), context, { filename: file });
}

const SF = context.SF;
const issues = SF.audit();
if (issues.length) {
  console.error(issues.join("\n"));
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
while (talk.mode === "dialogue" && guard < 12) {
  talk.dialogue.lock = 0;
  SF.advanceDialogue();
  guard += 1;
}
if (talk.quest !== "gather" || !talk.flags.metMaren) {
  console.error("quest did not start", talk.quest);
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

console.log("smoke ok");
