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
  await page.evaluate(() => { if (SF.flushSheets) SF.flushSheets(); });
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
  const queued = (SF.state.toast && SF.state.toast.text) || (SF.state.toasts && SF.state.toasts[0] && SF.state.toasts[0].text) || "";
  window.__stone = { x: stone.x, y: stone.y, px: p.x, py: p.y, d: Math.hypot(p.x - stone.x, p.y - stone.y), toast: queued };
});
const beside = await page.evaluate(() => window.__stone);
check(beside.d >= 40 && beside.py > beside.y, "vault-stone respawn stands in front of the post (" + beside.d.toFixed(1) + ")");
check(beside.toast === "Back to the vault stone. The party is at half HP.", "vault-stone defeat toast (" + beside.toast + ")");
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
  const box = (el) => {
    const r = el.getBoundingClientRect();
    return { l: r.left, t: r.top, r: r.right, b: r.bottom };
  };
  const rows = Array.from(document.querySelectorAll("#sail-list button")).map((b) => ({
    text: b.textContent,
    disabled: b.disabled,
    id: b.dataset.sail,
    ...box(b)
  }));
  const chartEl = document.getElementById("sail-chart");
  const chartBox = box(chartEl);
  const pins = Array.from(document.querySelectorAll(".chart-isle")).map((b) => ({
    text: b.textContent,
    disabled: b.disabled,
    id: b.dataset.sail,
    ...box(b)
  }));
  const scroll = document.querySelector("#sail .menu-scroll").getBoundingClientRect();
  let overlap = false;
  let clipped = false;
  for (let i = 0; i < pins.length; i++) {
    const a = pins[i];
    if (a.l < chartBox.l - 0.5 || a.t < chartBox.t - 0.5 || a.r > chartBox.r + 0.5 || a.b > chartBox.b + 0.5) clipped = true;
    for (let j = i + 1; j < pins.length; j++) {
      const b = pins[j];
      if (a.r > b.l + 0.5 && b.r > a.l + 0.5 && a.b > b.t + 0.5 && b.b > a.t + 0.5) overlap = true;
    }
  }
  const cinder = rows.find((r) => r.id === "cinderveil");
  return {
    quest: window.__quest,
    rows,
    pins,
    mode: SF.state.mode,
    overlap,
    clipped,
    cinderVisible: !!(cinder && cinder.t >= scroll.top - 0.5 && cinder.b <= scroll.bottom + 0.5)
  };
});
check(chart.quest === "Act 1 is done. Open the sail chart.", "Act 1 quest text on Emberhold");
["gullrock", "drift", "saltmere", "highspire"].forEach((id) => {
  const row = chart.rows.find((r) => r.id === id);
  const pin = chart.pins.find((r) => r.id === id);
  check(!!row && row.disabled && row.text.indexOf("Coming soon") !== -1, id + " chart row is locked Coming soon");
  check(!!pin && pin.disabled && pin.text.indexOf("Coming soon") !== -1, id + " chart tile is dimmed Coming soon");
});
check(!chart.overlap && !chart.clipped, "sail tiles do not overlap or clip");
check(chart.cinderVisible, "Cinderveil row is fully visible");
await shot(page, "15-sail-chart-coming-soon.png");
const lockedBtn = page.locator(".chart-isle[data-sail='highspire']");
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
async function tapDialogue() {
  const box = await page.locator("#dialogue").boundingBox();
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height * 0.55, id: 1 }]
  });
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await page.waitForTimeout(80);
}
await tapDialogue();
await page.waitForFunction(() => SF.state.dialogue && SF.state.dialogue.id === "cinderveil.act1.finale", null, { timeout: 3000 });
const early = await page.evaluate(() => {
  const d = SF.state.dialogue;
  d.lock = 0;
  d.done = true;
  d.shown = (d.full || "").length;
  if (SF._depart) SF._depart.t = SF._depart.dur;
  SF.advanceDialogue();
  const openedAt = Date.now();
  const el = document.getElementById("endcard");
  function fire(type) {
    const Ctor = type === "click" ? MouseEvent : PointerEvent;
    el.dispatchEvent(new Ctor(type, {
      bubbles: true,
      cancelable: true,
      clientX: 80,
      clientY: 80,
      pointerId: 1,
      pointerType: "touch"
    }));
  }
  fire("pointerdown");
  fire("click");
  return {
    finale: !!(SF.state.dialogue && SF.state.dialogue.id === "cinderveil.act1.finale"),
    shown: !el.hidden,
    left: (SF.state.endcardLock || 0) - openedAt,
    mode: SF.state.mode
  };
});
check(early.finale && early.shown && early.left > 200, "a tap in the same turn as the end card stays locked (finale=" + early.finale + " shown=" + early.shown + " " + early.left + "ms)");
await shot(page, "16-endcard-mobile-locked.png");
const gone = await page.evaluate(() => {
  if (SF.state) {
    SF.state.endcardLock = Date.now() - 1;
    SF.state.endcardHold = false;
  }
  const el = document.getElementById("endcard");
  function fire(type) {
    const Ctor = type === "click" ? MouseEvent : PointerEvent;
    el.dispatchEvent(new Ctor(type, {
      bubbles: true,
      cancelable: true,
      clientX: 80,
      clientY: 80,
      pointerId: 1,
      pointerType: "touch"
    }));
  }
  fire("pointerdown");
  fire("click");
  return document.getElementById("endcard").hidden && SF.state.mode === "play";
});
check(gone, "a tap after the lockout dismisses the end card");

await page.evaluate(() => {
  SF.mountIsland("cinderveil");
  SF.state.island = "cinderveil";
  SF.state.mode = "play";
  SF.state.dialogue = null;
  SF.state.battle = null;
  SF.ensureParty(SF.state);
  const stone = (SF.EXTRAS || []).find((ex) => ex.kind === "checkpoint");
  const way = SF.state.party.members.wayfarer;
  way.hp = 1;
  way.sp = 0;
  SF.state.player.hp = 1;
  SF.activeParty(SF.state).forEach((id) => {
    const m = SF.state.party.members[id];
    if (!m) return;
    m.hp = 1;
    m.sp = 0;
  });
  SF.state.toast = null;
  SF.state.toasts = [];
  window.__stoneRest = { x: stone.x, y: stone.y + 40 };
});
const restFrom = await page.evaluate(() => window.__stoneRest);
await place(page, restFrom.x, restFrom.y, 0, -1);
await shot(page, "18-rest-before.png");
await tapSel(page, "#btn-interact");
await page.waitForTimeout(200);
const rested = await page.evaluate(() => {
  const s = SF.state;
  const rows = SF.activeParty(s).map((id) => {
    const m = s.party.members[id];
    const st = SF.memberStats(s, id);
    return { id, hp: m.hp, maxHp: st.maxHp, sp: m.sp, maxSp: st.maxSp };
  });
  return {
    toast: (s.toast && s.toast.text) || "",
    rows,
    mode: s.mode
  };
});
check(rested.mode === "play" && rested.toast === "Rested. HP and SP are full.", "vault rest toast (" + rested.toast + ")");
check(rested.rows.every((row) => row.hp === row.maxHp && row.sp === row.maxSp), "vault rest fills HP and SP " + JSON.stringify(rested.rows));
await shot(page, "19-rest-after.png");

for (const who of [
  { id: "kestrel", quest: "sail" },
  { id: "tamsin", quest: "quay" },
  { id: "ilsa", quest: "vault" }
]) {
  const spot = await page.evaluate((id) => {
    SF.mountIsland("cinderveil");
    SF.state.island = "cinderveil";
    SF.state.mode = "play";
    SF.state.dialogue = null;
    SF.state.quest = id === "kestrel" ? "sail" : id === "tamsin" ? "quay" : "vault";
    SF.state.flags.vaultOpen = false;
    const n = SF.NPCS.find((npc) => npc.id === id);
    const feet = SF.actorFeet(n);
    return { x: feet.x, y: feet.y, name: n.name };
  }, who.id);
  await place(page, spot.x, spot.y + 80, 0, -1);
  await page.waitForTimeout(80);
  await shot(page, "20-arrow-" + who.id + ".png");
  const marker = await page.evaluate(() => {
    const s = SF.state;
    const goal = SF.objectivePoint(s);
    const p = s.player;
    const list = SF.entityList(s);
    let heroAt = -1;
    let npcAt = -1;
    const n = SF.NPCS.find((npc) => SF.objectivePoint(s) && Math.hypot(SF.actorFeet(npc).x - goal.x, SF.actorFeet(npc).y - goal.y) < 8);
    list.forEach((ent, i) => {
      if (Math.abs(ent.y - (p.y + 0.01)) < 0.02) heroAt = i;
      if (n && Math.abs(ent.y - SF.actorFeet(n).y) < 0.02) npcAt = i;
    });
    const feet = n ? SF.actorFeet(n) : null;
    const lift = goal && feet ? SF.guideLift(goal, p) : 0;
    const markY = goal ? goal.y - lift : 0;
    return {
      goal,
      heroAt,
      npcAt,
      heroSouth: p.y > (feet ? feet.y : p.y),
      pinned: !!(feet && lift >= 58 && lift <= 64 && lift - 7 >= 46 && Math.abs((goal.y - markY) - lift) < 0.1),
      onX: !!(feet && Math.abs(goal.x - feet.x) < 2)
    };
  });
  check(marker.pinned && marker.onX && marker.heroSouth && marker.heroAt > marker.npcAt, who.id + " marker sits above the head and the hero sorts in front");
  const shoveNpc = await shove(who.id, spot.x, spot.y + 48, 0, -1);
  const gap = Math.hypot(shoveNpc.after.x - spot.x, shoveNpc.after.y - spot.y);
  check(gap >= 30, who.id + " blocks the hero (" + gap.toFixed(1) + ")");
  await shot(page, "21-solid-" + who.id + ".png");
}

await page.evaluate(() => {
  SF.mountIsland("cinderveil");
  SF.state.island = "cinderveil";
  SF.state.mode = "play";
  SF.state.dialogue = null;
  SF.state.flags.mawDead = true;
  SF.state.quest = "relight";
  SF.state.shardsHeld = 3;
  SF.state.flags.cinderLit = false;
});
const stair = await page.evaluate(() => {
  const x = 41 * 16;
  const samples = [];
  for (let y = 128; y <= 520; y += 16) samples.push({ y, ok: SF.walkable(x, y) });
  const blocked = !SF.walkable(x + 80, 280);
  const goal = SF.objectivePoint(SF.state);
  return { samples, blocked, goal, lamp: { x: SF.LAMP.x, y: SF.LAMP.y } };
});
check(stair.samples.every((row) => row.ok), "south stair is walkable (" + stair.samples.filter((row) => !row.ok).map((row) => row.y).join(",") + ")");
check(stair.blocked, "the cliff beside the stair still blocks");
await place(page, 41 * 16, 36 * 16, 0, -1);
await page.waitForTimeout(80);
const stairGoal = await page.evaluate(() => {
  const goal = SF.objectivePoint(SF.state);
  const open = SF.segmentOpen(SF.state.player.x, SF.state.player.y, goal.x, goal.y);
  return { goal, open, lampY: SF.LAMP.y };
});
check(stairGoal.open, "lamp arrow follows a walkable line (" + stairGoal.goal.x + "," + stairGoal.goal.y + ")");
const offsetGoal = await page.evaluate(() => {
  SF.state.player.x = 520;
  SF.state.player.y = 560;
  const goal = SF.objectivePoint(SF.state);
  return { goal, open: SF.segmentOpen(520, 560, goal.x, goal.y), direct: SF.segmentOpen(520, 560, SF.LAMP.x, SF.LAMP.y) };
});
check(!offsetGoal.direct && offsetGoal.open, "offset south approach aims along the stair (" + offsetGoal.goal.x + "," + offsetGoal.goal.y + ")");
await place(page, 41 * 16, 36 * 16, 0, -1);
await shot(page, "22-stair-foot.png");
for (let frame = 0; frame < 4; frame++) {
  await stick(session, page, 0, -1, 420);
  await shot(page, "23-stair-step-" + frame + ".png");
}
const climbed = await page.evaluate(() => {
  const p = SF.state.player;
  const front = SF.rampFrontY(p.x, p.y);
  const list = SF.entityList(SF.state);
  let heroAt = -1;
  let faceAt = -1;
  list.forEach((ent, i) => {
    if (Math.abs(ent.y - (p.y + 0.01)) < 0.02 || (front != null && Math.abs(ent.y - (front + 0.5 + 0.01)) < 0.02)) heroAt = i;
  });
  (SF.TERRACES.cinderveil || []).forEach((t) => {
    if (!t.block || t._southBase == null) return;
    list.forEach((ent, i) => {
      if (Math.abs(ent.y - t._southBase) < 0.2) faceAt = i;
    });
  });
  return { x: p.x, y: p.y, walk: SF.walkable(p.x, p.y), front, heroAt, faceAt };
});
check(climbed.walk && climbed.y < 36 * 16 - 20, "the stick climbs the south stair (" + climbed.y.toFixed(1) + ")");
check(climbed.front == null || climbed.heroAt > climbed.faceAt, "hero draws in front of the cliff face");
await shot(page, "24-stair-top.png");

await page.evaluate(() => {
  SF.mountIsland("cinderveil");
  SF.state.island = "cinderveil";
  SF.state.mode = "play";
  SF.state.dialogue = null;
  SF.state.battle = null;
  SF.state.flags.vaultOpen = true;
  SF.state.flags.mawDead = false;
  SF.state.flags.mawFight = false;
  SF.state.quest = "seal";
  const mouth = (SF.TEXTS || []).find((t) => t.id === "maw-mouth");
  window.__mouth = { x: mouth.x, y: mouth.y + 24 };
});
const mouthAt = await page.evaluate(() => window.__mouth);
await place(page, mouthAt.x, mouthAt.y, 0, -1);
await tapSel(page, "#btn-interact");
for (let i = 0; i < 8; i++) {
  const phase = await page.evaluate(() => SF.state.dialogue && SF.state.dialogue.phase);
  if (phase === "choice") break;
  const box = await page.locator("#dialogue").boundingBox();
  if (!box) break;
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height * 0.7, id: 1 }]
  });
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await page.waitForTimeout(90);
  await page.evaluate(() => {
    const d = SF.state.dialogue;
    if (!d || d.phase === "choice") return;
    d.lock = 0;
    d.done = true;
    d.shown = (d.full || "").length;
  });
}
await page.waitForFunction(() => SF.state.dialogue && SF.state.dialogue.phase === "choice", null, { timeout: 3000 }).catch(() => {});
const ask = await page.evaluate(() => {
  const d = SF.state.dialogue;
  return {
    line: d && d.full,
    choices: d && d.phase === "choice" ? d.choices.map((c) => c.text) : [],
    fight: !!SF.state.flags.mawFight,
    mode: SF.state.mode
  };
});
check(ask.line === "Fight the Cinder Maw?" && ask.choices.join("/") === "Yes/Not yet" && !ask.fight, "Maw asks before the fight (" + ask.line + " " + ask.choices.join("/") + ")");
await shot(page, "25-maw-confirm.png");
const notYet = page.locator("#dlg-choices button", { hasText: "Not yet" });
await notYet.tap();
await page.waitForTimeout(120);
const declined = await page.evaluate(() => ({
  mode: SF.state.mode,
  fight: !!SF.state.flags.mawFight,
  battle: !!SF.state.battle
}));
check(declined.mode === "play" && !declined.fight && !declined.battle, "Not yet leaves the Maw");
await shot(page, "26-maw-not-yet.png");
await tapSel(page, "#btn-interact");
for (let i = 0; i < 8; i++) {
  const phase = await page.evaluate(() => SF.state.dialogue && SF.state.dialogue.phase);
  if (phase === "choice") break;
  await page.evaluate(() => {
    const d = SF.state.dialogue;
    if (!d || d.phase === "choice") return;
    d.lock = 0;
    d.done = true;
    d.shown = (d.full || "").length;
    SF.advanceDialogue();
  });
  await page.waitForTimeout(40);
}
const yes = page.locator("#dlg-choices button", { hasText: "Yes" });
await yes.tap();
await page.waitForTimeout(200);
const accepted = await page.evaluate(() => ({
  mode: SF.state.mode,
  fight: !!SF.state.flags.mawFight,
  battle: SF.state.battle && SF.state.battle.id
}));
check(accepted.fight && accepted.mode === "battle" && accepted.battle === "boss_cinder_maw", "Yes starts the Cinder Maw (" + accepted.mode + " " + accepted.battle + ")");
await shot(page, "27-maw-yes.png");
await page.evaluate(() => {
  SF.state.mode = "play";
  SF.state.battle = null;
  SF.state.dialogue = null;
});

await page.evaluate(() => {
  SF.mountIsland("emberhold");
  SF.state.island = "emberhold";
  SF.state.mode = "play";
  const boat = (SF.PROPS || []).find((p) => p.kind === "airship");
  window.__boat = { x: boat.x, y: boat.y };
});
const emberBoat = await page.evaluate(() => window.__boat);
await place(page, emberBoat.x, emberBoat.y - 90, 0, 1);
await shot(page, "28-skiff-ember-water.png");
await page.evaluate(() => {
  SF.mountIsland("cinderveil");
  SF.state.island = "cinderveil";
  SF.state.mode = "play";
  const boat = (SF.PROPS || []).find((p) => p.kind === "airship");
  const fences = (SF.PROPS || []).filter((p) => p.kind === "fence" || p.kind === "fence_burnt");
  window.__quay = { x: boat.x, y: boat.y + (SF.SKIFF_DROP || 0), fences: fences.length };
});
const quay = await page.evaluate(() => window.__quay);
check(quay.fences >= 8, "burnt fences stay connected (" + quay.fences + ")");
await place(page, quay.x, quay.y - 110, 0, 1);
await shot(page, "29-skiff-cinder-water.png");
await place(page, 36 * 16, 76 * 16, 0, -1);
await shot(page, "30-fences-connected.png");

const fenceJoin = await page.evaluate(() => {
  function loose(list) {
    let n = 0;
    list.forEach((p) => {
      const vertical = p.kind === "fence_up" || p.kind === "fence_burnt_up";
      let nearest = Infinity;
      list.forEach((q) => {
        if (q === p) return;
        const across = vertical ? Math.abs(q.x - p.x) : Math.abs(q.y - p.y);
        const along = vertical ? Math.abs(q.y - p.y) : Math.abs(q.x - p.x);
        if (across <= 6 && along > 0 && along < nearest) nearest = along;
      });
      if (!(nearest <= 36)) n += 1;
    });
    return n;
  }
  const out = {};
  ["emberhold", "cinderveil"].forEach((id) => {
    SF.mountIsland(id);
    const fences = (SF.PROPS || []).filter((p) => String(p.kind).indexOf("fence") === 0);
    out[id] = {
      n: fences.length,
      spin: fences.filter((p) => p.spin).length,
      loose: loose(fences),
      up: fences.filter((p) => p.kind === "fence_up" || p.kind === "fence_burnt_up").length
    };
  });
  return out;
});
check(fenceJoin.emberhold.n >= 4 && fenceJoin.emberhold.spin === 0 && fenceJoin.emberhold.loose === 0 && fenceJoin.emberhold.up >= 4, "ember fences join (" + JSON.stringify(fenceJoin.emberhold) + ")");
check(fenceJoin.cinderveil.n >= 8 && fenceJoin.cinderveil.spin === 0 && fenceJoin.cinderveil.loose === 0, "cinder fences join (" + JSON.stringify(fenceJoin.cinderveil) + ")");
await page.evaluate(() => {
  SF.mountIsland("emberhold");
  SF.state.island = "emberhold";
  SF.state.mode = "play";
  const fence = (SF.PROPS || []).find((p) => p.kind === "fence_up");
  SF.state.player.x = fence.x + 36;
  SF.state.player.y = fence.y;
  SF.state.camX = fence.x;
  SF.state.camY = fence.y;
});
await page.waitForTimeout(80);
await shot(page, "36-fence-vertical.png");

for (const innId of ["ember-hearth", "quay-bunk"]) {
  const inn = await page.evaluate((id) => {
    const island = id === "ember-hearth" ? "emberhold" : "cinderveil";
    SF.mountIsland(island);
    SF.state.island = island;
    SF.state.mode = "play";
    SF.state.dialogue = null;
    const spot = (SF.EXTRAS || []).find((ex) => ex.id === id);
    const way = SF.state.party.members.wayfarer;
    way.hp = 1;
    SF.state.player.hp = 1;
    SF.state.player.x = spot.x;
    SF.state.player.y = spot.y + 40;
    SF.restAtInn(spot);
    const here = SF.checkpointHere();
    return {
      inn: { x: spot.x, y: spot.y },
      here,
      dist: Math.hypot(here.x - spot.x, here.y - spot.y),
      walk: SF.walkable(here.x, here.y),
      kind: here.kind,
      south: here.y > spot.y
    };
  }, innId);
  check(inn.kind === "inn" && inn.dist >= 16 && inn.walk && inn.south, innId + " rest stands in front of the door (" + inn.dist.toFixed(1) + " at " + inn.here.x + "," + inn.here.y + ")");
  await place(page, inn.here.x, inn.here.y, 0, -1);
  await shot(page, innId === "ember-hearth" ? "37-inn-ember.png" : "38-inn-cinder.png");
}

const kestrelMark = await page.evaluate(() => {
  SF.mountIsland("emberhold");
  SF.state.island = "emberhold";
  SF.state.mode = "play";
  SF.state.quest = "stirring";
  SF.state.dialogue = null;
  SF.state.encounterGrace = 100000;
  const n = SF.NPCS.find((npc) => npc.id === "kestrel");
  const feet = SF.actorFeet(n);
  const talk = SF.TALK_RANGE || 54;
  // 3 tiles (48) is still inside talk range, so the diamond stays hidden there.
  // The centered mark is checked outside talk range, which is still 3 or more tiles.
  const far = Math.max(4 * 16, talk + 8);
  const dirs = {
    N: [0, -1], NE: [1, -1], E: [1, 0], SE: [1, 1],
    S: [0, 1], SW: [-1, 1], W: [-1, 0], NW: [-1, -1]
  };
  const nearDists = [35, 45, 48, talk - 1];
  const rows = { talk, far, near: {}, shown: {}, slide: typeof SF.guideAnchor === "function" || typeof SF.nameTag === "function" };
  function stand(dir, dist) {
    const mag = Math.hypot(dir[0], dir[1]) || 1;
    const p = SF.state.player;
    p.x = feet.x + (dir[0] / mag) * dist;
    p.y = feet.y + (dir[1] / mag) * dist;
    const goal = SF.objectivePoint(SF.state);
    const mark = SF.guideMark(goal, p);
    return {
      dist: Math.round(Math.hypot(p.x - feet.x, p.y - feet.y) * 10) / 10,
      hidden: !mark,
      x: mark ? Math.round(mark.x * 10) / 10 : null,
      lift: mark ? mark.lift : 0,
      centered: !!(mark && Math.abs(mark.x - feet.x) < 2 && mark.lift >= 58 && mark.lift <= 64 && mark.lift - 7 >= 46)
    };
  }
  Object.keys(dirs).forEach((key) => {
    rows.near[key] = nearDists.map((dist) => stand(dirs[key], dist));
    rows.shown[key] = stand(dirs[key], far);
  });
  const north = stand([0, -1], 35);
  rows.place = {
    close: { x: feet.x, y: feet.y - 35 },
    ne: { x: feet.x + 35 / Math.SQRT2, y: feet.y - 35 / Math.SQRT2 },
    nw: { x: feet.x - 35 / Math.SQRT2, y: feet.y - 35 / Math.SQRT2 },
    south: { x: feet.x, y: feet.y + 40 },
    far: { x: feet.x, y: feet.y - far },
    north
  };
  return rows;
});
check(!kestrelMark.slide, "the objective mark is not slid beside the hero");
Object.keys(kestrelMark.near).forEach((key) => {
  const bad = kestrelMark.near[key].filter((row) => !row.hidden);
  check(bad.length === 0, "no Kestrel diamond within talk range from the " + key + " (" + JSON.stringify(kestrelMark.near[key]) + ")");
});
Object.keys(kestrelMark.shown).forEach((key) => {
  const row = kestrelMark.shown[key];
  check(row && row.centered && row.dist >= 48 && row.dist > kestrelMark.talk,
    "centered Kestrel diamond from 3 or more tiles, " + key + " (" + JSON.stringify(row) + ")");
});
await place(page, kestrelMark.place.close.x, kestrelMark.place.close.y, 0, 1);
await shot(page, "39-kestrel-north.png");
await place(page, kestrelMark.place.ne.x, kestrelMark.place.ne.y, -1, 1);
await shot(page, "42-kestrel-ne.png");
await place(page, kestrelMark.place.nw.x, kestrelMark.place.nw.y, 1, 1);
await shot(page, "43-kestrel-nw.png");
await place(page, kestrelMark.place.south.x, kestrelMark.place.south.y, 0, -1);
await shot(page, "44-kestrel-south.png");
await place(page, kestrelMark.place.far.x, kestrelMark.place.far.y, 0, 1);
await shot(page, "45-kestrel-far.png");

const nameNudge = await page.evaluate(() => {
  const n = SF.NPCS.find((npc) => npc.id === "kestrel");
  const feet = SF.actorFeet(n);
  const ctx = SF.ctx;
  ctx.font = "600 12px Palatino, Georgia, serif";
  const contact = 35;
  const side = contact / Math.SQRT2;
  function at(dx, dy) {
    const tag = SF.nameAnchor(ctx, feet.x, feet.y - 34, n.name, { x: feet.x + dx, y: feet.y + dy });
    return {
      dx: Math.round((tag.x - feet.x) * 10) / 10,
      dy: Math.round((tag.y - (feet.y - 34)) * 10) / 10
    };
  }
  return {
    n: at(0, -contact),
    ne: at(side, -side),
    nw: at(-side, -side),
    s: at(0, contact),
    e: at(contact, 0),
    far: at(0, -80)
  };
});
check(nameNudge.n.dx > 8, "north contact moves Kestrel's name off the hero (" + JSON.stringify(nameNudge.n) + ")");
check(nameNudge.ne.dx < -8, "northeast contact moves her name away from the hero (" + JSON.stringify(nameNudge.ne) + ")");
check(nameNudge.nw.dx > 8, "northwest contact moves her name away from the hero (" + JSON.stringify(nameNudge.nw) + ")");
check(nameNudge.s.dx === 0 && nameNudge.s.dy === 0, "south contact leaves the name tag (" + JSON.stringify(nameNudge.s) + ")");
check(nameNudge.e.dx === 0 && nameNudge.e.dy === 0 && nameNudge.far.dx === 0 && nameNudge.far.dy === 0, "east and far leave the name tag (" + JSON.stringify(nameNudge) + ")");

const lampNear = await page.evaluate(() => {
  SF.mountIsland("cinderveil");
  SF.state.island = "cinderveil";
  SF.state.mode = "play";
  SF.state.quest = "relight";
  SF.state.shardsHeld = 3;
  SF.state.flags.mawDead = true;
  SF.state.flags.cinderLit = false;
  const spots = [[656, 147], [638, 122], [674, 134], [650, 146], [662, 150], [641, 146], [670, 142]];
  const rows = spots.map(([x, y]) => {
    SF.state.player.x = x;
    SF.state.player.y = y;
    const goal = SF.objectivePoint(SF.state);
    return {
      x, y,
      walk: SF.walkable(x, y) && !SF.blocksFoot(x, y),
      lamp: Math.hypot(goal.x - SF.LAMP.x, goal.y - SF.LAMP.y),
      down: goal.y > y + 8
    };
  });
  return { rows, lamp: { x: SF.LAMP.x, y: SF.LAMP.y } };
});
const lampBad = lampNear.rows.filter((row) => !row.walk || row.lamp > 8 || row.down);
check(lampBad.length === 0, "tiles within 1.5 of the lamp count as arrived (" + JSON.stringify(lampBad) + ")");
await place(page, 656, 147, 0, -1);
await shot(page, "40-lamp-close.png");

const sense = await page.evaluate(() => {
  SF.mountIsland("emberhold");
  SF.state.island = "emberhold";
  SF.state.mode = "play";
  SF.state.quest = "gather";
  SF.state.flags.shard_sense = true;
  SF.state.shardsHeld = 0;
  SF.state.picked = {};
  const shard = (SF.PICKUPS || []).find((item) => item.kind === "shard" && !item.secret);
  SF.state.player.x = shard.x - 160;
  SF.state.player.y = shard.y;
  SF.state.camX = SF.state.player.x;
  SF.state.camY = SF.state.player.y;
  SF.zoom = 1;
  const goal = SF.objectivePoint(SF.state);
  const dist = Math.hypot(goal.x - SF.state.player.x, goal.y - SF.state.player.y);
  const w = SF.viewW || 915;
  const h = SF.viewH || 412;
  return {
    sensed: goal.kind === "shard" && goal.precise === false,
    dist,
    onScreen: SF.goalOnScreen(goal, SF.state, w, h),
    shown: !SF.hideEdgeArrow(goal, SF.state, w, h),
    x: SF.state.player.x,
    y: SF.state.player.y
  };
});
check(sense.sensed && sense.dist > 96 && sense.onScreen && sense.shown, "a far shard still on screen keeps the pale sense arrow (" + JSON.stringify(sense) + ")");
await place(page, sense.x, sense.y, 1, 0);
await shot(page, "41-sense-arrow.png");

const crossings = await page.evaluate(async () => {
  function screenAt(dx, dy) {
    const c = SF.view;
    const x = Math.max(0, Math.min(c.width - 1, Math.floor(c.width / 2 + dx)));
    const y = Math.max(0, Math.min(c.height - 1, Math.floor(c.height / 2 + dy)));
    const px = SF.ctx.getImageData(x, y, 1, 1).data;
    return [px[0], px[1], px[2]];
  }
  function sheetAt(wx, wy) {
    const sheet = SF._terrain;
    const box = SF._terrainBox;
    const ppm = SF._terrainPpm || 1;
    if (!sheet || !box) return null;
    const sx = Math.floor((wx - box.minX) * ppm);
    const sy = Math.floor((wy - box.minY) * ppm);
    if (sx < 1 || sy < 1 || sx >= sheet.width - 1 || sy >= sheet.height - 1) return null;
    const px = sheet.getContext("2d").getImageData(sx, sy, 1, 1).data;
    return [px[0], px[1], px[2]];
  }
  function close(a, b) {
    return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) <= 48;
  }
  const offsets = [[0, 0], [180, 40], [-160, 80], [40, -180], [-80, -120]];
  let watch = null;
  const orig = SF.draw;
  SF.draw = function () {
    orig.call(SF);
    if (!watch) return;
    const s = SF.state;
    const mode = s.mode;
    const island = SF.islandId;
    const key = SF._terrainKey || "";
    const cover = SF._landCover || 0;
    const scale = Math.max(1, Math.round((SF.dpr || 1) * (SF.zoom || 1)));
    let hits = 0;
    let seen = 0;
    offsets.forEach((pair) => {
      const dx = pair[0];
      const dy = pair[1];
      const stale = watch.at(s.camX + dx / scale, s.camY + dy / scale);
      if (!stale) return;
      seen++;
      const now = screenAt(dx, dy);
      const dark = now[0] < 28 && now[1] < 28 && now[2] < 40;
      if (!dark && close(now, stale)) hits++;
    });
    const keyOk = key.indexOf(watch.dest + ":") === 0;
    const covered = cover >= 0.45 || mode === "voyage" || mode === "title" || mode === "dialogue";
    const stalePixels = !covered && seen >= 3 && hits >= 3 && !keyOk;
    const wrongSheet = mode === "play" && cover < 0.45 && key && key.indexOf(island + ":") !== 0;
    if (stalePixels || wrongSheet) {
      watch.bad.push({ mode: mode, island: island, key: key, cover: cover, hits: hits, seen: seen, px: screenAt(0, 0) });
    }
    watch.frames++;
    if (mode === "voyage") watch.voyage++;
    if (mode === "play" && island === watch.dest) watch.landed++;
  };
  function arm(dest) {
    const dock = SF.DOCKS[dest];
    const scale = Math.max(1, Math.round((SF.dpr || 1) * (SF.zoom || 1)));
    const frozen = offsets.map((pair) => ({
      x: dock.x + pair[0] / scale,
      y: dock.y + pair[1] / scale,
      px: sheetAt(dock.x + pair[0] / scale, dock.y + pair[1] / scale)
    }));
    watch = {
      dest: dest,
      frames: 0,
      voyage: 0,
      landed: 0,
      bad: [],
      at: function (wx, wy) {
        let best = null;
        let bestD = 1e9;
        frozen.forEach((row) => {
          const d = Math.hypot(wx - row.x, wy - row.y);
          if (d < bestD) {
            bestD = d;
            best = row.px;
          }
        });
        return bestD < 4 ? best : null;
      }
    };
    return frozen.filter((row) => row.px).length;
  }
  SF.state.flags.sailUnlocked = true;
  SF.state.flags.lampLit = true;
  SF.state.flags.metCinderKestrel = true;
  SF.state.mode = "play";
  SF.state.dialogue = null;
  SF.state.voyage = null;
  SF.state.voyageTalk = false;
  const ready = () => SF.islandId === "emberhold" && (SF._landCover || 0) < 0.05 && SF._terrainKey && SF._terrainKey.indexOf("emberhold:") === 0;
  if (!ready() && SF.islandId !== "emberhold") SF.travelTo("emberhold");
  const t0 = performance.now();
  while (!ready() && performance.now() - t0 < 8000) {
    await new Promise((r) => setTimeout(r, 50));
  }
  const primed = ready();
  const travelKnown = arm("cinderveil");
  const travelWatch = watch;
  SF.travelTo("cinderveil");
  await new Promise((r) => setTimeout(r, 5000));
  const travel = {
    frames: travelWatch.frames,
    badN: travelWatch.bad.length,
    bad: travelWatch.bad.slice(0, 3),
    known: travelKnown,
    primed: primed,
    landed: travelWatch.landed
  };
  const sailKnown = arm("emberhold");
  const sailWatch = watch;
  SF.seaFightChance = 0;
  SF.startVoyage("emberhold");
  await new Promise((r) => setTimeout(r, 8000));
  const sail = {
    frames: sailWatch.frames,
    voyage: sailWatch.voyage,
    landed: sailWatch.landed,
    badN: sailWatch.bad.length,
    bad: sailWatch.bad.slice(0, 3),
    known: sailKnown,
    island: SF.islandId,
    cover: SF._landCover || 0
  };
  SF.draw = orig;
  return { travel: travel, sail: sail };
});
check(crossings.travel.primed && crossings.travel.frames > 10 && crossings.travel.landed > 0 && crossings.travel.badN === 0,
  "Travel shows no previous-island frame (" + JSON.stringify(crossings.travel) + ")");
check(crossings.sail.voyage > 0 && crossings.sail.landed > 0 && crossings.sail.badN === 0 && crossings.sail.island === "emberhold",
  "a real sail shows no previous-island frame (" + JSON.stringify(crossings.sail) + ")");

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
await keys.evaluate(() => {
  const d = SF.state.dialogue;
  d.lock = 0;
  d.done = true;
  d.shown = (d.full || "").length;
  if (SF._depart) SF._depart.t = SF._depart.dur;
});
const keyHeld = await keys.evaluate(() => {
  SF.advanceDialogue();
  const openedAt = Date.now();
  SF.advanceDialogue();
  const el = document.getElementById("endcard");
  return {
    up: !el.hidden && SF.state.mode === "dialogue",
    left: (SF.state.endcardLock || 0) - openedAt
  };
});
check(keyHeld.up && keyHeld.left > 200, "Enter during the lockout leaves the end card up (" + keyHeld.left + "ms)");
await shot(keys, "17-endcard-keyboard.png");
await keys.evaluate(() => {
  if (SF.state) SF.state.endcardLock = Date.now() - 1;
});
await keys.keyboard.press("KeyE");
await keys.waitForFunction(() => document.getElementById("endcard").hidden && SF.state.mode === "play", null, { timeout: 2000 });
const keyGone = await keys.evaluate(() => document.getElementById("endcard").hidden && SF.state.mode === "play");
check(keyGone, "E dismisses the end card after the lockout");

await keys.evaluate(() => {
  SF.mountIsland("cinderveil");
  SF.state.island = "cinderveil";
  SF.state.mode = "play";
  SF.state.dialogue = null;
  SF.state.flags.mawDead = true;
  SF.state.quest = "relight";
  SF.state.shardsHeld = 3;
  SF.state.player.x = 41 * 16;
  SF.state.player.y = 30 * 16;
  SF.state.player.safeX = SF.state.player.x;
  SF.state.player.safeY = SF.state.player.y;
  SF.state.camX = SF.state.player.x;
  SF.state.camY = SF.state.player.y;
});
await keys.waitForTimeout(120);
await shot(keys, "31-desk-stair.png");
await keys.keyboard.down("KeyW");
await keys.waitForTimeout(500);
await shot(keys, "32-desk-stair-walk.png");
await keys.keyboard.up("KeyW");
await keys.evaluate(() => {
  SF.state.quest = "quay";
  const n = SF.NPCS.find((npc) => npc.id === "tamsin");
  const feet = SF.actorFeet(n);
  SF.state.player.x = feet.x;
  SF.state.player.y = feet.y + 70;
  SF.state.camX = feet.x;
  SF.state.camY = feet.y;
});
await keys.waitForTimeout(80);
await shot(keys, "33-desk-tamsin-arrow.png");
await keys.evaluate(() => {
  SF.mountIsland("emberhold");
  SF.state.island = "emberhold";
  const boat = (SF.PROPS || []).find((p) => p.kind === "airship");
  SF.state.player.x = boat.x;
  SF.state.player.y = boat.y - 80;
  SF.state.camX = boat.x;
  SF.state.camY = boat.y;
  const fence = (SF.PROPS || []).find((p) => p.kind === "fence_up");
  window.__deskFence = fence && { x: fence.x, y: fence.y };
});
await keys.waitForTimeout(80);
await shot(keys, "34-desk-skiff.png");
const deskFence = await keys.evaluate(() => window.__deskFence);
if (deskFence) {
  await keys.evaluate((spot) => {
    SF.state.player.x = spot.x + 40;
    SF.state.player.y = spot.y + 30;
    SF.state.camX = spot.x;
    SF.state.camY = spot.y;
  }, deskFence);
  await keys.waitForTimeout(80);
  await shot(keys, "35-desk-fence.png");
}

const deskMark = await keys.evaluate(() => {
  SF.mountIsland("emberhold");
  SF.state.island = "emberhold";
  SF.state.mode = "play";
  SF.state.quest = "stirring";
  SF.state.dialogue = null;
  const n = SF.NPCS.find((npc) => npc.id === "kestrel");
  const feet = SF.actorFeet(n);
  const talk = SF.TALK_RANGE || 54;
  const far = Math.max(4 * 16, talk + 8);
  const dirs = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
  const p = SF.state.player;
  const near = [];
  const shown = [];
  dirs.forEach((dir) => {
    const mag = Math.hypot(dir[0], dir[1]);
    [35, 45, talk - 1].forEach((dist) => {
      p.x = feet.x + (dir[0] / mag) * dist;
      p.y = feet.y + (dir[1] / mag) * dist;
      near.push(SF.guideMark(SF.objectivePoint(SF.state), p));
    });
    p.x = feet.x + (dir[0] / mag) * far;
    p.y = feet.y + (dir[1] / mag) * far;
    const mark = SF.guideMark(SF.objectivePoint(SF.state), p);
    shown.push(mark && Math.abs(mark.x - feet.x) < 2 && mark.lift >= 58 && mark.lift <= 64 && mark.lift - 7 >= 46);
  });
  return { hidden: near.every((mark) => !mark), centered: shown.every(Boolean) };
});
check(deskMark.hidden && deskMark.centered, "desktop Kestrel diamond hides in talk range and centers past it (" + JSON.stringify(deskMark) + ")");

await browser.close();

if (errors.length) {
  console.error(errors.length + " field checks failed");
  process.exit(1);
}
console.log("field qa ok");
