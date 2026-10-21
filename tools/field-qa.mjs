// Field QA for the v0.4.14 bug pass. Real touch on a phone-shaped page,
// plus a keyboard pass for the Act 1 end card.
import fs from "fs";
import path from "path";

const pw = await import("playwright").catch(() => import("/tmp/pwfield/node_modules/playwright/index.mjs"));
const chromium = pw.chromium;

const base = process.env.SF_URL || "http://127.0.0.1:4173/";
const outDir = process.env.SF_SHOTS || "/opt/cursor/artifacts/field-qa";
fs.mkdirSync(outDir, { recursive: true });

const errors = [];
function check(ok, msg) {
  if (!ok) {
    errors.push(msg);
    console.error("FAIL " + msg);
  } else {
    console.log("ok   " + msg);
  }
}

async function shot(page, name) {
  const file = path.join(outDir, name);
  await page.screenshot({ path: file });
  console.log("shot " + file);
  return file;
}

async function waitMode(page, mode, ms) {
  await page.waitForFunction((want) => window.SF && SF.state && SF.state.mode === want, mode, { timeout: ms || 4000 });
}

const phone = {
  viewport: { width: 915, height: 412 },
  deviceScaleFactor: 3,
  hasTouch: true,
  isMobile: true
};

async function stick(session, page, dirx, diry, ms) {
  const box = await page.locator("#stick").boundingBox();
  if (!box) throw new Error("stick missing");
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const dx = dirx * box.width * 0.34;
  const dy = diry * box.height * 0.34;
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: cx, y: cy, id: 1 }]
  });
  await session.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: cx + dx, y: cy + dy, id: 1 }]
  });
  await page.waitForTimeout(ms);
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
}

async function tapSel(page, sel) {
  const loc = page.locator(sel).first();
  await loc.tap({ timeout: 3000 });
}

async function place(page, x, y, fx, fy) {
  await page.evaluate(({ x, y, fx, fy }) => {
    const s = SF.state;
    s.mode = "play";
    s.dialogue = null;
    s.pendingTalk = null;
    s.player.x = x;
    s.player.y = y;
    s.player.safeX = x;
    s.player.safeY = y;
    s.player.px = x;
    s.player.py = y;
    s.player.fx = fx;
    s.player.fy = fy;
    s.player.fall = 0;
    s.player.dashT = 0;
    s.player.grappleT = 0;
    s.player.hx = 0;
    s.player.hy = 0;
    s.camX = x;
    s.camY = y;
    s.encounterGrace = 100000;
  }, { x, y, fx, fy });
  await page.waitForTimeout(40);
}

async function pos(page) {
  return page.evaluate(() => ({ x: SF.state.player.x, y: SF.state.player.y, island: SF.islandId, mode: SF.state.mode }));
}

const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: ["--no-sandbox", "--touch-events=enabled", "--disable-background-timer-throttling", "--disable-renderer-backgrounding"]
});

const phoneCtx = await browser.newContext(phone);
const page = await phoneCtx.newPage();
const session = await phoneCtx.newCDPSession(page);
await page.goto(base, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => window.SF && SF.state && SF.state.mode === "title");

await tapSel(page, "#newgame");
await page.waitForFunction(() => SF.state.mode === "dialogue" || SF.state.mode === "play");
for (let i = 0; i < 24 && await page.evaluate(() => SF.state.mode === "dialogue"); i++) {
  await page.evaluate(() => {
    const d = SF.state.dialogue;
    if (!d) return;
    d.lock = 0;
    if (d.phase !== "choice") {
      d.done = true;
      d.shown = (d.full || "").length;
    }
  });
  const choice = page.locator("#dlg-choices button").first();
  if (await choice.count() && await choice.isVisible()) await choice.tap();
  else await tapSel(page, "#dialogue");
  await page.waitForTimeout(60);
}
check(await page.evaluate(() => SF.state.mode === "play"), "new game reaches the field");

const spawn = await page.evaluate(() => {
  const p = SF.state.player;
  const near = SF.nearestInteract();
  const tx = near && near.ref ? near.ref.x : null;
  const ty = near && near.ref ? near.ref.y : null;
  const d = tx == null ? null : Math.hypot(tx - p.x, ty - p.y);
  const hand = document.getElementById("hand-meter");
  return {
    near: near && near.kind,
    id: near && near.ref && near.ref.id,
    d,
    handHidden: !!(hand && hand.hidden),
    handText: hand ? hand.textContent : ""
  };
});
check(spawn.handHidden, "Hand counter hidden before the lamp");
check(spawn.id === "wake-stone" && spawn.d > 22, "wake-stone ring is off the hero (" + spawn.d + ")");
await shot(page, "01-spawn-rings-hand-hidden.png");

async function shove(label, x, y, dirx, diry) {
  await place(page, x, y, dirx, diry);
  const before = await pos(page);
  await stick(session, page, dirx, diry, 700);
  const after = await pos(page);
  return { before, after };
}

const maren = await page.evaluate(() => {
  const n = SF.NPCS.find((npc) => npc.id === "maren");
  return { x: n.x, y: n.y };
});
const npcMove = await shove("maren", maren.x, maren.y + 36, 0, -1);
const npcDist = Math.hypot(npcMove.after.x - maren.x, npcMove.after.y - maren.y);
check(npcMove.after.mode === "play" && npcDist >= 18, "hero cannot walk through Maren (" + npcDist.toFixed(1) + ")");
await shot(page, "02-npc-solid.png");

const lamp = await page.evaluate(() => ({ x: SF.LAMP.x, y: SF.LAMP.y }));
const lampMove = await shove("lamp", lamp.x, lamp.y + 36, 0, -1);
const lampDist = Math.hypot(lampMove.after.x - lamp.x, lampMove.after.y - lamp.y);
check(lampMove.after.mode === "play" && lampDist >= 16, "hero cannot walk through the lamp (" + lampDist.toFixed(1) + ")");
await shot(page, "03-lamp-solid.png");

const hook = await page.evaluate(() => {
  const h = (SF.HOOKS || []).find((row) => !SF.hookLive || SF.hookLive(row));
  return h ? { x: h.x, y: h.y, id: h.id } : null;
});
check(!!hook, "emberhold has a live hook");
if (hook) {
  const hookMove = await shove("hook", hook.x, hook.y + 32, 0, -1);
  const hookDist = Math.hypot(hookMove.after.x - hook.x, hookMove.after.y - hook.y);
  check(hookMove.after.mode === "play" && hookDist >= 12, "hero cannot walk through a hook post (" + hookDist.toFixed(1) + ")");
  await shot(page, "04-hook-post-solid.png");
}

const priority = await page.evaluate(() => {
  const k = SF.NPCS.find((n) => n.id === "kestrel");
  const patch = (SF.TEXTS || []).find((t) => t.id === "sail-patch");
  return {
    x: (k.x + patch.x) / 2,
    y: (k.y + patch.y) / 2,
    kx: k.x,
    ky: k.y
  };
});
await place(page, priority.x, priority.y, priority.kx - priority.x, priority.ky - priority.y);
const faced = await page.evaluate(() => {
  const near = SF.nearestInteract();
  return near && { kind: near.kind, id: near.ref && near.ref.id };
});
check(faced && faced.kind === "npc" && faced.id === "kestrel", "NPC outranks the sail-patch inspect");
await tapSel(page, "#btn-interact");
await page.waitForTimeout(80);
const talked = await page.evaluate(() => ({
  mode: SF.state.mode,
  id: SF.state.dialogue && SF.state.dialogue.id
}));
check(talked.mode === "dialogue" && talked.id && talked.id.indexOf("kestrel") !== -1, "tapping Talk speaks to Kestrel (" + talked.id + ")");
await shot(page, "05-interact-kestrel.png");
await page.evaluate(() => { SF.state.mode = "play"; SF.state.dialogue = null; });

const chestSpot = await page.evaluate(() => {
  const chest = (SF.EXTRAS || []).find((ex) => ex.id === "chest-orchard");
  return { x: chest.x, y: chest.y };
});
await place(page, chestSpot.x, chestSpot.y, 0, 1);
await tapSel(page, "#btn-interact");
await page.waitForTimeout(120);
const knife = await page.evaluate(() => {
  const rows = (SF.state.chestLoot && SF.state.chestLoot.rows) || [];
  return { mode: SF.state.mode, lines: rows.map((row) => row.line) };
});
check(knife.mode === "chest" && knife.lines.some((line) => line.indexOf("Kestrel can use this") !== -1), "orchard chest says Kestrel can use the Knife");
await shot(page, "06-knife-chest.png");
await page.waitForTimeout(360);
await tapSel(page, "#chest");

await page.evaluate(() => {
  SF.state.player.grapple = true;
  SF.state.flags.grapple = true;
  SF.state.player.grappleCd = 0;
});
const aimFrom = await page.evaluate(() => {
  const h = SF.HOOKS[0];
  return { x: h.x - 80, y: h.y, hx: h.x, hy: h.y };
});
await place(page, aimFrom.x, aimFrom.y, 1, 0);
const aimBefore = await pos(page);
const gbox = await page.locator("#btn-grapple").boundingBox();
const sbox = await page.locator("#stick").boundingBox();
const gx = gbox.x + gbox.width / 2;
const gy = gbox.y + gbox.height / 2;
const sx = sbox.x + sbox.width / 2;
const sy = sbox.y + sbox.height / 2;
await session.send("Input.dispatchTouchEvent", {
  type: "touchStart",
  touchPoints: [{ x: gx, y: gy, id: 1 }, { x: sx, y: sy, id: 2 }]
});
await session.send("Input.dispatchTouchEvent", {
  type: "touchMove",
  touchPoints: [{ x: gx, y: gy, id: 1 }, { x: sx + sbox.width * 0.34, y: sy, id: 2 }]
});
await page.waitForTimeout(500);
const aimHold = await pos(page);
await shot(page, "07-grapple-aim-holds.png");
await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
const aimDrift = Math.hypot(aimHold.x - aimBefore.x, aimHold.y - aimBefore.y);
check(aimDrift < 6, "aiming the hook does not walk (" + aimDrift.toFixed(1) + "px)");

await place(page, aimFrom.x, aimFrom.y, 1, 0);
await page.evaluate(() => { SF.state.player.grappleCd = 0; SF.state.player.grappleT = 0; });
await tapSel(page, "#btn-grapple");
await page.waitForFunction(() => SF.state.player.grappleT > 0 || SF.state.mode !== "play", null, { timeout: 1500 }).catch(() => {});
await page.waitForFunction(() => (SF.state.player.grappleT || 0) <= 0, null, { timeout: 3000 }).catch(() => {});
const landed = await page.evaluate(() => {
  const p = SF.state.player;
  const list = SF.entityList(SF.state);
  let hookAt = -1;
  let heroAt = -1;
  list.forEach((ent, i) => {
    if (Math.abs(ent.y - p.y) < 0.2 && heroAt < 0 && ent.y > p.y) heroAt = i;
  });
  const hook = (SF.HOOKS || []).find((h) => Math.hypot(h.x - p.x, h.y - p.y) < 24);
  list.forEach((ent, i) => {
    if (hook && Math.abs(ent.y - hook.y) < 0.001) hookAt = i;
    if (Math.abs(ent.y - (p.y + 0.01)) < 0.001) heroAt = i;
  });
  return {
    x: p.x,
    y: p.y,
    hook: hook && { x: hook.x, y: hook.y, id: hook.id },
    hookAt,
    heroAt,
    mode: SF.state.mode
  };
});
check(landed.mode === "play" && landed.hook && landed.heroAt > landed.hookAt, "hook post sorts behind the hero after landing");
await shot(page, "08-hook-landing-ysort.png");

await page.evaluate(() => {
  SF.mountIsland("emberhold");
  SF.state.island = "emberhold";
  SF.state.quest = "gather";
  SF.state.shardsHeld = 5;
  SF.state.flags.lampLit = false;
  SF.state.flags.metMaren = true;
  SF.state.mode = "play";
  SF.state.dialogue = null;
});
const emberLamp = await page.evaluate(() => ({ x: SF.LAMP.x, y: SF.LAMP.y }));
await place(page, emberLamp.x, emberLamp.y + 20, 0, -1);
await tapSel(page, "#btn-interact");
await page.waitForFunction(() => SF.state.flags.lampLit === true, null, { timeout: 15000 }).catch(() => {});
await page.waitForTimeout(200);
const revealed = await page.evaluate(() => ({
  lit: !!SF.state.flags.lampLit,
  hidden: document.getElementById("hand-meter").hidden,
  text: document.getElementById("hand-meter").textContent
}));
check(revealed.lit && !revealed.hidden, "Hand counter appears at the lamp reveal (" + (revealed.text || "").trim() + ")");
await shot(page, "09-hand-revealed.png");

await page.evaluate(() => {
  SF.mountIsland("cinderveil");
  SF.state.island = "cinderveil";
  SF.state.flags.vaultOpen = true;
  SF.state.mode = "play";
  SF.state.dialogue = null;
  SF.state.picked = {};
});
const vault = await page.evaluate(() => {
  const chest = (SF.EXTRAS || []).find((ex) => ex.id === "chest-vault");
  const seal = (SF.TEXTS || []).find((t) => t.id === "vault-seal");
  return {
    chest: { x: chest.x, y: chest.y },
    seal: { x: seal.x, y: seal.y },
    gap: Math.hypot(chest.x - seal.x, chest.y - seal.y)
  };
});
check(vault.gap > 54, "vault chest and seal are outside each other's reach (" + vault.gap.toFixed(1) + ")");
await place(page, vault.chest.x, vault.chest.y, 0, 1);
await tapSel(page, "#btn-interact");
await page.waitForTimeout(120);
const opened = await page.evaluate(() => ({ mode: SF.state.mode, id: SF.state.chestLoot && SF.state.chestLoot.id, near: (SF.nearestInteract() || {}).kind }));
check(opened.mode === "chest" && opened.id === "chest-vault", "vault chest opens from its own tile");
await shot(page, "10-vault-chest.png");
await page.waitForTimeout(360);
await tapSel(page, "#chest");
await place(page, vault.seal.x, vault.seal.y, 0, 1);
await tapSel(page, "#btn-interact");
await page.waitForTimeout(100);
const sealed = await page.evaluate(() => ({
  mode: SF.state.mode,
  id: SF.state.dialogue && SF.state.dialogue.id
}));
check(sealed.mode === "dialogue" && sealed.id === "inspect.vault_seal", "vault seal still inspects from its own tile");
await shot(page, "11-vault-seal.png");
await page.evaluate(() => { SF.state.mode = "play"; SF.state.dialogue = null; });

await page.evaluate(() => {
  SF.ensureParty(SF.state);
  SF.mountIsland("cinderveil");
  SF.state.island = "cinderveil";
  const stone = (SF.EXTRAS || []).find((ex) => ex.id === "vault-stone");
  SF.state.checkpoints = {};
  SF.state.checkpoint = { x: stone.x, y: stone.y, island: "cinderveil", kind: "post" };
  SF.state.banners = [];
  SF.state.banner = null;
  SF.state.toasts = [];
  SF.state.toast = null;
  SF.mountIsland("highspire");
  SF.state.island = "highspire";
  SF.state.mode = "play";
  SF.state.player.x = SF.DOCKS.highspire.x;
  SF.state.player.y = SF.DOCKS.highspire.y;
  SF.Battle.applyLoss(SF.state);
});
await page.waitForTimeout(250);
const loss = await page.evaluate(() => {
  const p = SF.state.player;
  const lamp = SF.LAMP;
  const toast = (SF.state.toast && SF.state.toast.text) || (SF.state.toasts[0] && SF.state.toasts[0].text) || "";
  const banner = SF.state.banner;
  const queued = (SF.state.banners || []).map((b) => b.title + " " + (b.sub || "")).join("|");
  return {
    island: SF.islandId,
    dist: Math.hypot(p.x - lamp.x, p.y - lamp.y),
    y: p.y,
    lampY: lamp.y,
    toast,
    bannerTitle: banner && banner.title,
    bannerSub: banner && banner.sub,
    queued,
    bannerHidden: document.getElementById("banner").hidden
  };
});
check(loss.island === "highspire", "defeat stays on Highspire");
check(loss.dist > 16 && loss.dist < 80 && loss.y > loss.lampY, "Highspire respawn stands beside the lamp, not inside it");
check(loss.toast === "Back to the last lamp. The party is at half HP.", "Highspire defeat toast (" + loss.toast + ")");
check(!loss.bannerTitle && !loss.queued && loss.bannerHidden, "no Lowmoor arrival banner");
await shot(page, "12-defeat-highspire.png");

await page.evaluate(() => {
  SF.mountIsland("emberhold");
  SF.state.island = "emberhold";
  SF.state.checkpoints = {};
  SF.state.checkpoint = { x: 1568, y: 544, island: "cinderveil", kind: "post" };
  SF.state.banners = [];
  SF.state.banner = null;
  SF.state.toasts = [];
  SF.state.toast = null;
  SF.state.mode = "play";
  SF.ensureParty(SF.state);
  SF.Battle.applyLoss(SF.state);
});
await page.waitForTimeout(200);
const wakeLoss = await page.evaluate(() => {
  const p = SF.state.player;
  const toast = (SF.state.toast && SF.state.toast.text) || (SF.state.toasts[0] && SF.state.toasts[0].text) || "";
  return {
    island: SF.islandId,
    dist: Math.hypot(p.x - SF.WAKE.x, p.y - SF.WAKE.y),
    toast,
    banner: SF.state.banner && SF.state.banner.title
  };
});
check(wakeLoss.island === "emberhold" && wakeLoss.dist < 72, "emberhold defeat returns to the waking stones");
check(wakeLoss.toast === "Back to the waking stones. The party is at half HP.", "waking-stone defeat toast");
check(!wakeLoss.banner, "emberhold defeat does not sail");
await shot(page, "13-defeat-waking-stones.png");

await page.evaluate(() => {
  SF.mountIsland("cinderveil");
  SF.state.island = "cinderveil";
  const stone = (SF.EXTRAS || []).find((ex) => ex.kind === "checkpoint");
  SF.state.checkpoints = {};
  SF.state.checkpoint = { x: stone.x, y: stone.y, island: "cinderveil", kind: "post" };
  SF.state.toasts = [];
  SF.state.toast = null;
  SF.state.banners = [];
  SF.state.banner = null;
  SF.ensureParty(SF.state);
  SF.Battle.applyLoss(SF.state);
  const p = SF.state.player;
  window.__stone = { x: stone.x, y: stone.y, px: p.x, py: p.y, d: Math.hypot(p.x - stone.x, p.y - stone.y) };
});
const beside = await page.evaluate(() => window.__stone);
check(beside.d > 14 && beside.py > beside.y, "vault-stone respawn stands in front of the post");
await shot(page, "14-defeat-beside-post.png");

await page.evaluate(() => {
  SF.mountIsland("emberhold");
  SF.state.island = "emberhold";
  SF.state.flags.sailUnlocked = true;
  SF.state.flags.act1 = true;
  SF.state.flags.lampLit = true;
  SF.state.quest = "act1";
  SF.state.mode = "play";
  const q = SF.questText(SF.state);
  window.__quest = q;
  SF.openSailMenu();
});
await page.waitForTimeout(80);
const chart = await page.evaluate(() => {
  const rows = Array.from(document.querySelectorAll("#sail-list button")).map((b) => ({
    text: b.textContent,
    disabled: b.disabled,
    id: b.dataset.sail
  }));
  return { quest: window.__quest, rows, mode: SF.state.mode };
});
check(chart.quest === "Act 1 is done. Open the sail chart.", "Act 1 quest text on Emberhold");
["gullrock", "drift", "saltmere", "highspire"].forEach((id) => {
  const row = chart.rows.find((r) => r.id === id);
  check(!!row && row.disabled && row.text.indexOf("Coming soon") !== -1, id + " chart row is locked Coming soon");
});
await shot(page, "15-sail-chart-coming-soon.png");
const lockedBtn = page.locator("#sail-list button[data-sail='highspire']");
const box = await lockedBtn.boundingBox();
if (box) {
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: box.x + box.width / 2, y: box.y + 8, id: 1 }]
  });
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await page.waitForTimeout(80);
}
const sailed = await page.evaluate(() => ({ mode: SF.state.mode, voyage: SF.state.voyage, island: SF.islandId }));
check(sailed.mode === "sailmenu" && !sailed.voyage && sailed.island === "emberhold", "tapping Highspire does not sail");
const pending = await page.evaluate(() => {
  SF.startDialogue("saltmere.harbormaster");
  const d = SF.state.dialogue;
  const text = d ? (d.full || "") : "";
  return { mode: SF.state.mode, text };
});
check(pending.mode !== "dialogue" && pending.text.indexOf("Script pending") === -1, "script-pending lines cannot be opened");

await page.evaluate(() => {
  SF.state.mode = "play";
  SF.state.dialogue = null;
  SF.state.endcardLock = 0;
  SF.startDialogue("cinderveil.kestrel.epilogue_listen");
  const d = SF.state.dialogue;
  d.i = d.lines.length - 1;
  d.full = SF.lineText(d.lines[d.i]);
  d.shown = d.full.length;
  d.done = true;
  d.lock = 0;
});
const dlgBox = await page.locator("#dialogue").boundingBox();
await session.send("Input.dispatchTouchEvent", {
  type: "touchStart",
  touchPoints: [{ x: dlgBox.x + dlgBox.width / 2, y: dlgBox.y + dlgBox.height / 2, id: 1 }]
});
await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
const early = await page.evaluate(() => ({
  finale: !!(SF.state.dialogue && SF.state.dialogue.id === "cinderveil.act1.finale"),
  shown: !document.getElementById("endcard").hidden,
  left: (SF.state.endcardLock || 0) - Date.now()
}));
check(early.finale && early.shown && early.left > 0, "the finishing tap shows the end card (" + early.left + "ms lock left)");
const endBox = await page.locator("#endcard").boundingBox();
await session.send("Input.dispatchTouchEvent", {
  type: "touchStart",
  touchPoints: [{ x: endBox.x + endBox.width / 2, y: endBox.y + endBox.height / 2, id: 1 }]
});
await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
const held = await page.evaluate(() => ({
  up: !document.getElementById("endcard").hidden && !!(SF.state.dialogue && SF.state.dialogue.id === "cinderveil.act1.finale"),
  left: (SF.state.endcardLock || 0) - Date.now()
}));
check(held.up && held.left > 0, "a tap during the lockout does not dismiss the end card (" + held.left + "ms left)");
await shot(page, "16-endcard-mobile-locked.png");
await page.evaluate(() => { if (SF.state) SF.state.endcardLock = Date.now() - 1; });
await session.send("Input.dispatchTouchEvent", {
  type: "touchStart",
  touchPoints: [{ x: endBox.x + 48, y: endBox.y + 48, id: 1 }]
});
await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
await page.waitForTimeout(80);
const gone = await page.evaluate(() => document.getElementById("endcard").hidden && SF.state.mode === "play");
check(gone, "a tap after the lockout dismisses the end card");

await phoneCtx.close();

const desk = await browser.newContext({ viewport: { width: 1280, height: 720 }, hasTouch: false, isMobile: false });
const keys = await desk.newPage();
await keys.goto(base, { waitUntil: "domcontentloaded" });
await keys.waitForFunction(() => window.SF && SF.state && SF.state.mode === "title");
await keys.locator("#newgame").click();
await keys.waitForFunction(() => SF.state.mode === "dialogue" || SF.state.mode === "play");
await keys.evaluate(() => {
  SF.state.mode = "play";
  SF.state.dialogue = null;
  SF.startDialogue("cinderveil.kestrel.epilogue_spare");
  const d = SF.state.dialogue;
  d.i = d.lines.length - 1;
  d.full = SF.lineText(d.lines[d.i]);
  d.shown = d.full.length;
  d.done = true;
  d.lock = 0;
});
await keys.keyboard.press("Enter");
await keys.waitForFunction(() => SF.state.dialogue && SF.state.dialogue.id === "cinderveil.act1.finale");
await keys.keyboard.press("Enter");
await keys.waitForTimeout(30);
const keyHeld = await keys.evaluate(() => !document.getElementById("endcard").hidden && SF.state.mode === "dialogue");
check(keyHeld, "Enter during the lockout leaves the end card up");
await shot(keys, "17-endcard-keyboard.png");
await keys.waitForTimeout(460);
await keys.keyboard.press("KeyE");
await keys.waitForTimeout(80);
const keyGone = await keys.evaluate(() => document.getElementById("endcard").hidden && SF.state.mode === "play");
check(keyGone, "E dismisses the end card after the lockout");

await browser.close();

if (errors.length) {
  console.error(errors.length + " field checks failed");
  process.exit(1);
}
console.log("field qa ok");
