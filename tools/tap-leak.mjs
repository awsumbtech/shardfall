// The tap that opens a sheet, and the tap that leaves a battle, must not
// activate whatever appears under the finger after the finger is up.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadPlaywright() {
  const candidates = ["playwright-core", "/tmp/pw/node_modules/playwright-core"];
  for (const name of candidates) {
    try { return require(name); } catch (err) { /* try the next */ }
  }
  console.error("tap leak: playwright-core is not installed");
  process.exit(1);
}

const pw = loadPlaywright();
const { chromium } = pw.default || pw;
const chrome = process.env.CHROME || "/usr/bin/google-chrome";
if (!fs.existsSync(chrome)) {
  console.error("tap leak: chrome not found at " + chrome);
  process.exit(1);
}

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".json": "application/json"
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://127.0.0.1");
  let rel = decodeURIComponent(url.pathname);
  if (rel === "/") rel = "/index.html";
  const file = path.normalize(path.join(root, rel));
  if (!file.startsWith(root) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404);
    res.end("missing");
    return;
  }
  res.writeHead(200, {
    "Content-Type": TYPES[path.extname(file)] || "application/octet-stream",
    "Cache-Control": "no-store"
  });
  fs.createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = "http://127.0.0.1:" + server.address().port;

function fail(msg) {
  console.error("FAIL " + msg);
  process.exitCode = 1;
}

function overlaps(a, b) {
  if (!a || !b || a.width < 2 || b.width < 2 || a.height < 2 || b.height < 2) return false;
  return a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1;
}

const browser = await chromium.launch({
  executablePath: chrome,
  args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"]
});

async function boot(context) {
  await context.addInitScript(() => {
    try {
      Object.defineProperty(navigator, "serviceWorker", { configurable: true, get() { return undefined; } });
    } catch (err) {}
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (err) => errors.push(String(err)));
  await page.goto(origin + "/index.html?debug=1", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.SF && SF.state && SF.bindInput && SF.debug);
  await page.waitForTimeout(200);
  return { page, errors };
}

async function touchSession(page) {
  const cdp = await page.context().newCDPSession(page);
  const fingers = new Map();
  function points() {
    const pts = [];
    fingers.forEach((p, id) => pts.push({ x: Math.round(p.x), y: Math.round(p.y), id }));
    return pts;
  }
  return {
    async tap(id, x, y) {
      fingers.set(id, { x, y });
      await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: points() });
      fingers.delete(id);
      await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: points() });
    }
  };
}

const phone = await browser.newContext({
  viewport: { width: 915, height: 412 },
  deviceScaleFactor: 3,
  hasTouch: true,
  isMobile: true
});
const phoneBoot = await boot(phone);
const page = phoneBoot.page;
const hands = await touchSession(page);
await page.evaluate(() => {
  SF.beginNew();
  SF.state.flags.lampLit = true;
});

for (let n = 0; n < 5; n++) {
  await page.evaluate(() => {
    SF.state.mode = "play";
    SF.state.dialogue = null;
    SF.state.battle = null;
    SF.startDialogue("emberhold.kestrel.docked");
    const d = SF.state.dialogue;
    d.i = d.lines.length - 1;
    d.done = true;
    d.lock = 0;
    SF.syncUI();
  });
  await page.waitForTimeout(40);
  const line = await page.evaluate(() => {
    const r = document.getElementById("dialogue").getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height * 0.62, mode: SF.state.mode };
  });
  if (line.mode !== "dialogue") fail("kestrel line was not up on try " + n);
  await hands.tap(1, line.x, line.y);
  await page.waitForTimeout(420);
  const stayed = await page.evaluate(() => {
    const sail = document.getElementById("sail");
    const stay = document.getElementById("sail-close");
    const box = stay.getBoundingClientRect();
    return {
      mode: SF.state.mode,
      hidden: sail.hidden,
      label: stay.textContent,
      w: box.width,
      h: box.height
    };
  });
  if (stayed.mode !== "sailmenu" || stayed.hidden || stayed.label !== "Stay" || stayed.h < 10) {
    fail("same tap closed the sail chart on try " + n + " " + JSON.stringify(stayed));
  }
  if (n === 0) {
    const shot = path.join("/opt/cursor/artifacts/overlay-input", "34-sail-stays.png");
    fs.mkdirSync(path.dirname(shot), { recursive: true });
    await page.screenshot({ path: shot });
  }
  const stayAt = await page.evaluate(() => {
    const r = document.getElementById("sail-close").getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  await hands.tap(1, stayAt.x, stayAt.y);
  await page.waitForTimeout(200);
  const closed = await page.evaluate(() => SF.state.mode);
  if (closed !== "play") fail("a later tap did not leave the sail chart on try " + n + " (" + closed + ")");
  await page.waitForTimeout(400);
}

await page.evaluate(() => {
  SF.state.mode = "play";
  SF.state.dialogue = null;
  SF.state.battle = null;
  SF.state.player.fx = 1;
  SF.state.player.fy = 0;
  SF.state.player.dashT = 0;
  SF.state.player.dashCd = 0;
  SF.debug.goTile(6, 30);
  const p = SF.state.player;
  p.fx = 1;
  p.fy = 0;
  SF.syncUI();
  SF.debug.fight("em_wisp1");
  SF.Battle.instant = true;
  let n = 0;
  while (SF.state.battle && SF.state.battle.phase !== "result" && n < 40) {
    SF.Battle.autoPick();
    n++;
  }
  SF.syncUI();
});
await page.waitForTimeout(200);
const cont = await page.evaluate(() => {
  const hits = (SF.Battle && SF.Battle.hits) || [];
  const hit = hits.filter((h) => h.id === "result")[0];
  const view = document.getElementById("view").getBoundingClientRect();
  const p = SF.state.player;
  const reach = SF.DASH_SPEED * SF.DASH_TIME;
  return {
    phase: SF.state.battle && SF.state.battle.phase,
    hit: hit || null,
    view: { l: view.left, t: view.top, sx: view.width ? (SF.viewW || view.width) / view.width : 1, sy: view.height ? (SF.viewH || view.height) / view.height : 1 },
    hero: { x: p.x, y: p.y },
    lane: !!(SF.walkable(p.x + reach, p.y) && !(SF.occupied && SF.occupied(p.x + reach, p.y, p.x, p.y)))
  };
});
if (cont.phase !== "result" || !cont.hit) fail("battle did not reach Continue " + JSON.stringify(cont));
if (!cont.lane) fail("dash lane is blocked, so a stray dash would not show " + JSON.stringify(cont.hero));
const cx = cont.view.l + (cont.hit.x + cont.hit.w / 2) / cont.view.sx;
const cy = cont.view.t + (cont.hit.y + cont.hit.h / 2) / cont.view.sy;
await hands.tap(1, cx, cy);
await page.waitForTimeout(450);
const after = await page.evaluate((from) => {
  const p = SF.state.player;
  return {
    mode: SF.state.mode,
    battle: !!SF.state.battle,
    x: p.x,
    y: p.y,
    dist: Math.hypot(p.x - from.x, p.y - from.y),
    dashT: p.dashT,
    dashEdge: SF.inputState.dashEdge
  };
}, cont.hero);
if (after.mode !== "play" || after.battle) fail("Continue did not return to the field " + JSON.stringify(after));
if (after.dist > 20 || after.dashT > 0) fail("Continue fired a dash " + JSON.stringify(after));

const phoneErr = phoneBoot.errors.filter((e) => e.indexOf("controller") < 0);
if (phoneErr.length) fail("page errors " + phoneErr.join(" | "));
await phone.close();

const desk = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 1,
  hasTouch: false,
  isMobile: false
});
const deskBoot = await boot(desk);
const dp = deskBoot.page;
await dp.evaluate(() => {
  SF.beginNew();
  SF.state.dialogue = null;
  SF.state.mode = "play";
  SF.state.flags.lampLit = true;
  SF.state.toast = { text: "The route to Cinderveil is real. Hold the rail when the wind takes.", ttl: 30 };
  SF.state.banner = { title: "Sky-shard 1 of 5", sub: "The lamp on the hill needs 5.", ttl: 30 };
  SF.syncUI();
});
await dp.waitForTimeout(80);
const plates = await dp.evaluate(() => {
  function box(id) {
    const el = document.getElementById(id);
    if (!el || el.hidden) return null;
    const r = el.getBoundingClientRect();
    return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
  }
  const title = document.getElementById("banner-title");
  const range = document.createRange();
  range.selectNodeContents(title);
  const lines = range.getClientRects();
  return {
    toast: box("toast"),
    banner: box("banner"),
    hud: box("hud"),
    map: box("mapwrap"),
    title: title.textContent,
    lineCount: lines.length,
    stack: document.getElementById("chrome").dataset.stack
  };
});
if (plates.title !== "Sky-shard 1 of 5") fail("banner title changed " + JSON.stringify(plates));
if (!plates.toast || plates.toast.height < 10 || !plates.banner || plates.banner.height < 10) {
  fail("toast or banner is not on screen " + JSON.stringify(plates));
}
if (overlaps(plates.toast, plates.banner)) fail("toast overlaps the shard banner " + JSON.stringify(plates));
if (overlaps(plates.toast, plates.hud) || overlaps(plates.banner, plates.hud)) {
  fail("toast or banner covers the HUD " + JSON.stringify(plates));
}
if (overlaps(plates.banner, plates.map) || overlaps(plates.toast, plates.map)) {
  fail("toast or banner covers the map " + JSON.stringify(plates));
}
if (plates.lineCount !== 1) fail("shard banner title wraps " + JSON.stringify(plates));
const bannerShot = path.join("/opt/cursor/artifacts/overlay-input", "35-banner-stack.png");
fs.mkdirSync(path.dirname(bannerShot), { recursive: true });
await dp.screenshot({ path: bannerShot });
const deskErr = deskBoot.errors.filter((e) => e.indexOf("controller") < 0);
if (deskErr.length) fail("desk page errors " + deskErr.join(" | "));
await desk.close();

await browser.close();
server.close();
if (process.exitCode) process.exit(process.exitCode);
console.log("tap leak ok");
