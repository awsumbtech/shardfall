// Seeded battle parity. Recorded on v0.4.27 (main's battle.js) and compared
// after the module split. Outcomes, turn counts, damage logs, and rewards
// must match run for run. Presentation timing is not part of the snapshot.
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";

const baselinePath = path.join("tools", "battle-parity-baseline.json");
const record = process.argv.includes("--record");

const CORE = [
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
  "js/vaultgate.js",
  "js/grapple.js"
];

const BATTLE = [
  "js/battle/events.js",
  "js/battle/formula.js",
  "js/battle/state.js",
  "js/battle/timeline.js",
  "js/battle/ai.js",
  "js/battle/rewards.js",
  "js/battle/feel.js",
  "js/battle/resolver.js",
  "js/battle/battle.js"
];

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

function loadSF() {
  const context = {};
  context.window = context;
  context.console = console;
  const store = new Map();
  context.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k)
  };
  context.document = {
    readyState: "complete",
    getElementById: () => null,
    addEventListener() {},
    createElement() { return { getContext: () => null, width: 0, height: 0 }; }
  };
  vm.createContext(context);
  CORE.concat(BATTLE).forEach((file) => {
    if (!fs.existsSync(file)) return;
    vm.runInContext(fs.readFileSync(file, "utf8"), context, { filename: file });
  });
  if (!context.SF || !context.SF.Battle || !context.SF.Battle.start) fail("battle runtime did not load");
  return context.SF;
}

function sorted(obj) {
  const out = {};
  Object.keys(obj || {}).sort().forEach((k) => { out[k] = obj[k]; });
  return out;
}

function prep(SF, setup) {
  const s = SF.fresh();
  s.mode = "play";
  SF.ensureParty(s);
  if (setup.party) {
    s.flags.party_kestrel = true;
    s.flags.party_tamsin = true;
  }
  const level = setup.level || 1;
  if (level > 1) {
    SF.activeParty(s).forEach((id) => {
      s.party.members[id].level = 1;
      s.party.members[id].xp = SF.xpForLevel(level);
      SF.levelMemberToXp(s, id);
    });
  }
  SF.activeParty(s).forEach((id) => {
    const st = SF.memberStats(s, id);
    s.party.members[id].hp = st.maxHp;
    s.party.members[id].sp = st.maxSp;
  });
  s.inventory = Object.assign({}, setup.items || {});
  s.gold = setup.gold || 0;
  SF.syncFieldVitals(s);
  s.mode = "play";
  return s;
}

function actorSnap(a) {
  return {
    id: a.id,
    hp: a.hp,
    sp: a.sp,
    alive: !!a.alive,
    ct: a.ct,
    phase: a.phase || 1
  };
}

function resultSnap(row) {
  if (!row) return null;
  return {
    win: !!row.win,
    fled: !!row.fled,
    xp: row.xp || 0,
    gold: row.gold || 0,
    items: (row.items || []).slice(),
    levels: (row.levels || []).map((lv) => ({
      name: lv.name,
      level: lv.level,
      skill: lv.skill || "",
      hp: lv.hp,
      sp: lv.sp,
      atk: lv.atk,
      def: lv.def,
      mag: lv.mag,
      spd: lv.spd
    }))
  };
}

function finishSnap(s) {
  const w = s.party.members.wayfarer;
  return {
    gold: s.gold || 0,
    xp: w.xp,
    level: w.level,
    hp: w.hp,
    sp: w.sp,
    inventory: sorted(s.inventory),
    known: sorted(s.known)
  };
}

function runAuto(SF, setup, encounter, seed) {
  const s = prep(SF, setup);
  SF.state = s;
  SF.Battle.instant = true;
  SF.Battle.rngSeed = seed;
  const opts = { zoneLevel: setup.zoneLevel, bg: "emberhold_meadow" };
  if (!SF.Battle.start(encounter, opts)) fail("start failed " + encounter + " seed " + seed);
  const b0 = s.battle;
  const start = {
    order: (b0.order || []).slice(),
    actorId: b0.actorId,
    actors: b0.actors.map(actorSnap)
  };
  let steps = 0;
  while (s.battle && s.battle.phase !== "result" && steps < 160) {
    SF.Battle.autoPick();
    steps += 1;
  }
  const b = s.battle;
  const end = b ? {
    phase: b.phase,
    turnCount: b.turnCount,
    log: (b.log || []).slice(),
    actors: b.actors.map(actorSnap),
    result: resultSnap(b.result)
  } : null;
  let outcome = "timeout";
  if (b && b.phase === "result") {
    outcome = b.result && b.result.win && !b.result.fled ? "win" : (b.result && b.result.fled ? "fled" : "lose");
    SF.Battle.confirmResult();
  }
  return {
    kind: "auto",
    setup: setup.name,
    encounter: encounter,
    seed: seed,
    outcome: outcome,
    steps: steps,
    start: start,
    end: end,
    after: finishSnap(s)
  };
}

function livingFoe(b) {
  return b.actors.filter((a) => a.side === "foe" && a.alive)[0];
}

function runScript(SF, seed) {
  const setup = { name: "script", level: 1, zoneLevel: 3, items: {} };
  const s = prep(SF, setup);
  SF.state = s;
  SF.Battle.instant = true;
  SF.Battle.rngSeed = seed;
  if (!SF.Battle.start("em_wisps", { zoneLevel: 3, bg: "emberhold_meadow" })) fail("script start");
  const log = [];
  function act(action) {
    if (!s.battle || s.battle.phase === "result") return;
    if (s.battle.phase !== "menu") return;
    SF.Battle.playerAct(action);
    log.push(action.type + ":" + (action.skillId || action.itemId || ""));
  }
  const foe = livingFoe(s.battle);
  act({ type: "skill", skillId: "attack", targetId: foe && foe.id });
  const foe2 = s.battle && livingFoe(s.battle);
  act({ type: "skill", skillId: "shard_bolt", targetId: foe2 && foe2.id });
  act({ type: "defend" });
  if (s.battle && s.battle.phase !== "result") {
    SF.giveItem("tonic", 1);
    SF.giveItem("ember_salt", 1);
    const hero = s.battle.actors.find((a) => a.side === "party");
    if (hero) hero.hp = Math.max(1, hero.hp - 12);
    act({ type: "item", itemId: "tonic", targetId: hero && hero.id });
    const foe3 = livingFoe(s.battle);
    act({ type: "item", itemId: "ember_salt", targetId: foe3 && foe3.id });
  }
  let steps = 0;
  while (s.battle && s.battle.phase !== "result" && steps < 80) {
    SF.Battle.autoPick();
    steps += 1;
  }
  const b = s.battle;
  let outcome = "timeout";
  const end = b ? {
    phase: b.phase,
    turnCount: b.turnCount,
    log: (b.log || []).slice(),
    actors: b.actors.map(actorSnap),
    result: resultSnap(b.result),
    script: log
  } : null;
  if (b && b.phase === "result") {
    outcome = b.result && b.result.win && !b.result.fled ? "win" : "lose";
    SF.Battle.confirmResult();
  }
  return {
    kind: "script",
    setup: "script",
    encounter: "em_wisps",
    seed: seed,
    outcome: outcome,
    steps: steps,
    end: end,
    after: finishSnap(s)
  };
}

const SETUPS = [
  { name: "fresh", level: 1, zoneLevel: 3, items: {} },
  { name: "geared", level: 4, zoneLevel: 4, items: { tonic: 4, ether: 2, hi_tonic: 1 } }
];

const ENCOUNTERS = [
  "em_wisps",
  "em_brumekin",
  "em_brume_wisp",
  "em_choirling",
  "cv_ashlings",
  "boss_cinder_maw"
];

const PARTY_ENCOUNTERS = ["cv_mixed", "boss_cinder_maw"];

function collect(SF) {
  const cases = [];
  let seed;
  for (seed = 1; seed <= 20; seed++) {
    SETUPS.forEach((setup) => {
      ENCOUNTERS.forEach((id) => {
        cases.push(runAuto(SF, setup, id, seed));
      });
    });
    cases.push(runScript(SF, seed));
  }
  for (seed = 1; seed <= 5; seed++) {
    PARTY_ENCOUNTERS.forEach((id) => {
      cases.push(runAuto(SF, {
        name: "party",
        level: 7,
        zoneLevel: 6,
        party: true,
        items: { tonic: 4, ether: 2, hi_tonic: 1 }
      }, id, seed));
    });
  }
  return cases;
}

function diff(a, b, path) {
  if (a === b) return "";
  if (typeof a !== typeof b) return path + " type " + typeof a + " vs " + typeof b;
  if (a == null || b == null) return path + " " + JSON.stringify(a) + " vs " + JSON.stringify(b);
  if (typeof a !== "object") return path + " " + JSON.stringify(a) + " vs " + JSON.stringify(b);
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b)) return path + " array mismatch";
    if (a.length !== b.length) return path + " length " + a.length + " vs " + b.length;
    let i;
    for (i = 0; i < a.length; i++) {
      const inner = diff(a[i], b[i], path + "[" + i + "]");
      if (inner) return inner;
    }
    return "";
  }
  const keys = Object.keys(a).concat(Object.keys(b)).filter((k, i, arr) => arr.indexOf(k) === i);
  let k;
  for (k = 0; k < keys.length; k++) {
    const key = keys[k];
    if (!Object.prototype.hasOwnProperty.call(a, key)) return path + "." + key + " missing on new";
    if (!Object.prototype.hasOwnProperty.call(b, key)) return path + "." + key + " missing on baseline";
    const inner = diff(a[key], b[key], path + "." + key);
    if (inner) return inner;
  }
  return "";
}

function assertEvents(SF) {
  if (!SF.BattleEvents) fail("BattleEvents is missing");
  if (!SF.BattleEvents.TYPES || SF.BattleEvents.TYPES["crit-ready"] !== "crit-ready") {
    fail("crit-ready is not a battle event");
  }
  const hits = [];
  const weaks = [];
  const heals = [];
  const turns = [];
  const pauses = [];
  SF.BattleEvents.on("hit", (p) => hits.push(p));
  SF.BattleEvents.on("weak", (p) => weaks.push(p));
  SF.BattleEvents.on("heal", (p) => heals.push(p));
  SF.BattleEvents.on("turn-start", (p) => turns.push(p));
  SF.BattleEvents.on("hit-pause", (p) => pauses.push(p));
  const s = prep(SF, { name: "events", level: 1, zoneLevel: 3, items: { tonic: 1 } });
  SF.state = s;
  SF.Battle.instant = true;
  SF.Battle.rngSeed = 3;
  if (!SF.Battle.start("em_wisps", { zoneLevel: 3 })) fail("event fight did not start");
  const foe = livingFoe(s.battle);
  const before = foe.hp;
  SF.Battle.playerAct({ type: "skill", skillId: "attack", targetId: foe.id });
  const struck = s.battle.actors.find((a) => a.id === foe.id);
  const dealt = before - struck.hp;
  const hit = hits.filter((p) => p.tgt === foe.id && p.amount === dealt)[0];
  if (!hit || !hit.src) fail("hit event did not match damage " + dealt);
  const hero = s.battle.actors.find((a) => a.side === "party");
  hero.hp = Math.max(1, hero.hp - 10);
  const healsBefore = heals.length;
  SF.Battle.playerAct({ type: "item", itemId: "tonic", targetId: hero.id });
  const heal = heals.slice(healsBefore).find((p) => p.tgt === hero.id && p.kind === "hp" && p.amount > 0);
  if (!heal || !s.battle.log.some((line) => line.indexOf("recovers " + heal.amount + " HP") >= 0)) {
    fail("heal event did not match the tonic");
  }
  const boltFoe = livingFoe(s.battle);
  if (boltFoe) SF.Battle.playerAct({ type: "skill", skillId: "shard_bolt", targetId: boltFoe.id });
  if (!weaks.length) fail("weak event did not fire on a Shard hit");
  if (!turns.length) fail("turn-start did not fire");
  if (!pauses.length) fail("hit-pause hook did not fire");
  const reduced = pauses.some((p) => p.reducedMotion) || pauses.every((p) => typeof p.ms === "number");
  if (!reduced) fail("hit-pause payload has no ms");
  console.log("events ok  hits " + hits.length + "  weak " + weaks.length + "  heals " + heals.length + "  turns " + turns.length);
}

const SF = loadSF();
const cases = collect(SF);
console.log("ran " + cases.length + " seeded battles");

if (record) {
  const payload = {
    recordedFrom: "v0.4.27 main battle.js",
    note: "Headless auto-battle and a fixed script. Same seeds must match after the split.",
    count: cases.length,
    cases: cases
  };
  fs.writeFileSync(baselinePath, JSON.stringify(payload));
  console.log("wrote " + baselinePath);
  process.exit(0);
}

if (!fs.existsSync(baselinePath)) fail("missing " + baselinePath + " (run with --record on main)");
const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
if (!baseline.cases || baseline.cases.length !== cases.length) {
  fail("case count " + cases.length + " vs baseline " + (baseline.cases && baseline.cases.length));
}
let i;
let wins = 0;
let losses = 0;
let timeouts = 0;
for (i = 0; i < cases.length; i++) {
  const problem = diff(cases[i], baseline.cases[i], "case[" + i + "]");
  if (problem) {
    const row = cases[i];
    fail("parity mismatch " + row.kind + " " + row.setup + " " + row.encounter + " seed " + row.seed + "\n" + problem);
  }
  if (cases[i].outcome === "win") wins += 1;
  else if (cases[i].outcome === "lose") losses += 1;
  else timeouts += 1;
}
console.log("parity ok  " + cases.length + " cases  wins " + wins + "  losses " + losses + "  other " + timeouts);
assertEvents(SF);
