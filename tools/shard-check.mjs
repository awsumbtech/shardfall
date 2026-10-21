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
SF.readMove = () => ({ x: 0, y: 0 });
SF.consumeDash = () => false;
SF.consumeAttack = () => false;
SF.consumeInteract = () => false;

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

function finishTalk(state) {
  let guard = 0;
  while (state.mode === "dialogue" && guard < 40) {
    if (!state.dialogue) break;
    state.dialogue.lock = 0;
    if (state.dialogue.phase === "choice") {
      const go = state.dialogue.choices.findIndex((c) => c.text === "I'll get them.");
      SF.chooseDialogue(go >= 0 ? go : 0);
    } else SF.advanceDialogue();
    guard += 1;
  }
  if (state.mode === "dialogue") fail("talk did not finish");
}

function openShards() {
  return SF.PICKUPS.filter((p) => p.kind === "shard" && !p.secret && SF.shardReachable(p));
}

function nearestProp(x, y) {
  let best = Infinity;
  let kind = "";
  (SF.PROPS || []).forEach((p) => {
    const d = Math.hypot(p.x - x, p.y - y);
    if (d < best) {
      best = d;
      kind = p.kind;
    }
  });
  return { d: best, kind };
}

function findPath(sx, sy, gx, gy) {
  const step = 8;
  const snap = (v) => Math.round(v / step);
  let x0 = snap(sx);
  let y0 = snap(sy);
  if (!SF.walkable(x0 * step, y0 * step)) {
    let found = false;
    for (let r = 1; r <= 6 && !found; r++) {
      for (let a = 0; a < 16; a++) {
        const nx = snap(sx + Math.cos((a / 16) * Math.PI * 2) * r * step);
        const ny = snap(sy + Math.sin((a / 16) * Math.PI * 2) * r * step);
        if (SF.walkable(nx * step, ny * step)) {
          x0 = nx;
          y0 = ny;
          found = true;
          break;
        }
      }
    }
    if (!found) return null;
  }
  const key = (x, y) => x + "," + y;
  const parent = new Map();
  const q = [[x0, y0]];
  parent.set(key(x0, y0), null);
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  let head = 0;
  let end = null;
  while (head < q.length && head < 200000) {
    const [x, y] = q[head++];
    const wx = x * step;
    const wy = y * step;
    if (Math.hypot(wx - gx, wy - gy) <= 20) {
      end = [x, y];
      break;
    }
    for (let i = 0; i < dirs.length; i++) {
      const nx = x + dirs[i][0];
      const ny = y + dirs[i][1];
      const k = key(nx, ny);
      if (parent.has(k)) continue;
      if (!SF.walkable(nx * step, ny * step)) continue;
      parent.set(k, [x, y]);
      q.push([nx, ny]);
    }
  }
  if (!end) return null;
  const path = [];
  let cur = end;
  const seen = new Set();
  while (cur && !seen.has(key(cur[0], cur[1]))) {
    seen.add(key(cur[0], cur[1]));
    path.push({ x: cur[0] * step, y: cur[1] * step });
    cur = parent.get(key(cur[0], cur[1]));
  }
  path.reverse();
  return path;
}

function place(s, x, y) {
  s.player.x = x;
  s.player.y = y;
  s.player.px = x;
  s.player.py = y;
  s.player.safeX = x;
  s.player.safeY = y;
}

function walk(s, path) {
  let prev = null;
  path.forEach((p) => {
    if (!SF.walkable(p.x, p.y)) fail("path left the ground at " + p.x + "," + p.y);
    if (prev && Math.hypot(p.x - prev.x, p.y - prev.y) > 12) fail("path jumped");
    place(s, p.x, p.y);
    prev = p;
  });
}

function takeShard(s, item) {
  const before = s.shardsHeld;
  if (!SF.walkable(item.x, item.y)) fail(item.id + " is not walkable");
  const prop = nearestProp(item.x, item.y);
  if (prop.d < 30) fail(item.id + " is hidden beside a " + prop.kind + " (" + prop.d.toFixed(0) + "px)");
  place(s, item.x, item.y);
  SF.updatePickups();
  if (!s.picked[item.id] || s.shardsHeld !== before + 1) fail("could not pick up " + item.id);
}

function pathTo(s, x, y, label) {
  const path = findPath(s.player.x, s.player.y, x, y);
  if (!path || !path.length) fail("no path to " + label);
  walk(s, path);
  return path;
}

const early = SF.fresh();
early.mode = "play";
early.quest = "gather";
early.flags.shard_sense = true;
early.flags.kestrelHint = false;
early.flags.carriers = { scar: true, cinderstep: true };
early.shardsHeld = 4;
early.picked["shard-meadow"] = true;
early.picked["shard-grove"] = true;
early.player.grapple = false;
early.player.shardstep = false;
place(early, SF.WAKE.x, SF.WAKE.y);
SF.state = early;
SF.mountIsland("emberhold");
const earlyGoal = SF.objectivePoint(early);
if (!earlyGoal || earlyGoal.kind !== "shard" || Math.hypot(earlyGoal.x - SF.LAMP.x, earlyGoal.y - SF.LAMP.y) < 8) {
  fail("four shards still sent the arrow to the lamp");
}
if (SF.handMeter(early) !== "Hand ✦✦✦✦◇ 4/5") fail("hand meter at 4 was " + SF.handMeter(early));
if (SF.SHARD_GLINT !== 96) fail("six tiles is not the glint range");

const play = SF.fresh();
play.mode = "play";
SF.state = play;
place(play, SF.NPCS[0].x, SF.NPCS[0].y);
SF.tryInteract();
finishTalk(play);
if (play.quest !== "gather" || !play.flags.shard_sense) fail("the lamp reveal did not wake shard sense");
if (play.shardsHeld !== 0) fail("the reveal handed out shards");

SF.mountIsland("emberhold");
const emberShards = openShards();
if (emberShards.length < 6) fail("Emberhold only has " + emberShards.length + " reachable shards");
emberShards.forEach((item) => {
  if (!findPath(SF.WAKE.x, SF.WAKE.y, item.x, item.y)) fail(item.id + " cannot be walked from the stones");
});

let checkedShort = false;
while (play.shardsHeld < SF.QUEST_SHARDS) {
  if (play.shardsHeld === 4 && !checkedShort) {
    SF.tryLamp();
    if (play.mode === "cutscene" || play.flags.lampLit) fail("the lamp lit at 4 shards");
    const queued = (play.toast && play.toast.text) || (play.toasts[0] && play.toasts[0].text) || "";
    if (queued.indexOf("needs 5") < 0 || queued.indexOf("have 4") < 0) fail("short lamp toast was " + queued);
    finishTalk(play);
    if (play.flags.lampLit) fail("inspecting a short lamp lit it");
    checkedShort = true;
  }
  const goal = SF.objectivePoint(play);
  if (!goal || goal.kind !== "shard") fail("arrow left the shards at " + play.shardsHeld);
  if (Math.hypot(goal.x - SF.LAMP.x, goal.y - SF.LAMP.y) < 8) fail("arrow pointed at the lamp at " + play.shardsHeld);
  const dist = Math.hypot(play.player.x - goal.x, play.player.y - goal.y);
  if (dist > SF.SHARD_GLINT && goal.precise !== false) fail("a shard beyond 6 tiles was marked on the ground");
  if (dist <= SF.SHARD_GLINT && goal.precise === false) fail("a shard within 6 tiles was only an edge hint");
  const item = emberShards.find((p) => !play.picked[p.id] && Math.hypot(p.x - goal.x, p.y - goal.y) < 8);
  if (!item) fail("arrow did not name a shard at " + play.shardsHeld);
  pathTo(play, item.x, item.y, item.id);
  const close = SF.objectivePoint(play);
  if (!close || close.precise !== true) fail(item.id + " stayed an edge hint up close");
  takeShard(play, item);
}

if (play.shardsHeld !== 5) fail("held " + play.shardsHeld + " after five shards");
if (SF.handMeter(play) !== "Hand ✦✦✦✦✦ 5/5") fail("full hand meter was " + SF.handMeter(play));
const lampGoal = SF.objectivePoint(play);
if (!lampGoal || Math.hypot(lampGoal.x - SF.LAMP.x, lampGoal.y - SF.LAMP.y) > 8) fail("the arrow did not turn to the lamp at 5");
pathTo(play, SF.LAMP.x, SF.LAMP.y, "lamp");
place(play, SF.LAMP.x, SF.LAMP.y);
SF.tryLamp();
if (play.mode !== "cutscene") fail("five shards did not light the lamp");
SF.update(3.4);
if (!play.flags.lampLit || play.quest !== "stirring" || play.shardsHeld !== 0) {
  fail("the lamp did not take 5 shards " + play.flags.lampLit + " " + play.quest + " " + play.shardsHeld);
}

const spare = emberShards.filter((p) => !play.picked[p.id]);
if (emberShards.length - spare.length !== 5) fail("the lamp path did not leave the extra shards");
spare.forEach((item) => {
  pathTo(play, item.x, item.y, item.id);
  takeShard(play, item);
});
if (play.shardsHeld !== spare.length) fail("spare shards did not pick up");

SF.mountIsland("cinderveil");
const cinder = play;
cinder.flags.cinderLit = false;
cinder.quest = "relight";
cinder.shardsHeld = 0;
cinder.player.grapple = false;
cinder.picked = {};
place(cinder, SF.WAKE.x, SF.WAKE.y);
const cinderShards = openShards();
if (cinderShards.length < 4) fail("Cinderveil only has " + cinderShards.length + " reachable shards");
cinderShards.forEach((item) => {
  if (!findPath(SF.DOCKS.cinderveil.x, SF.DOCKS.cinderveil.y, item.x, item.y)) {
    fail(item.id + " cannot be walked from the quay");
  }
});
cinderShards.forEach((item) => {
  if (cinder.shardsHeld < SF.CINDER_SHARDS) {
    const goal = SF.objectivePoint(cinder);
    if (!goal || Math.hypot(goal.x - SF.LAMP.x, goal.y - SF.LAMP.y) < 8) {
      fail("Cinderveil arrow pointed at the lamp at " + cinder.shardsHeld);
    }
  }
  pathTo(cinder, item.x, item.y, item.id);
  takeShard(cinder, item);
  if (cinder.shardsHeld >= SF.CINDER_SHARDS) {
    const goal = SF.objectivePoint(cinder);
    const atLamp = goal && Math.hypot(goal.x - SF.LAMP.x, goal.y - SF.LAMP.y) <= 8;
    const toward = goal
      && SF.segmentOpen(cinder.player.x, cinder.player.y, goal.x, goal.y)
      && Math.hypot(goal.x - SF.LAMP.x, goal.y - SF.LAMP.y) < Math.hypot(cinder.player.x - SF.LAMP.x, cinder.player.y - SF.LAMP.y) - 8;
    if (!atLamp && !toward) {
      fail("Cinderveil arrow did not turn to the lamp at " + cinder.shardsHeld + " (" + (goal && goal.x) + "," + (goal && goal.y) + ")");
    }
  }
});
if (SF.handMeter(cinder) !== "Hand ✦✦✦ 3/3") fail("cinder meter was " + SF.handMeter(cinder));

console.log("shard check ok — Emberhold " + emberShards.length + ", Cinderveil " + cinderShards.length);
