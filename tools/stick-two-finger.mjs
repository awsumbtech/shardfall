// Two fingers: hold the stick, tap Pause, then lift the stick finger.
// The hero must stop, and a new stick touch must move again.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadPlaywright() {
  const candidates = [
    "playwright-core",
    "/tmp/pw/node_modules/playwright-core"
  ];
  for (const name of candidates) {
    try { return require(name); } catch (err) { /* try the next */ }
  }
  console.error("stick two-finger: playwright-core is not installed");
  process.exit(1);
}

const pw = loadPlaywright();
const { chromium } = pw.default || pw;
const chrome = process.env.CHROME || "/usr/bin/google-chrome";
if (!fs.existsSync(chrome)) {
  console.error("stick two-finger: chrome not found at " + chrome);
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
  await page.waitForFunction(() => window.SF && SF.state && SF.bindInput);
  await page.waitForTimeout(200);
  return { page, errors };
}

async function touchSession(page) {
  const cdp = await page.context().newCDPSession(page);
  const fingers = new Map();
  function pointsExcept(dropId) {
    const pts = [];
    fingers.forEach((p, id) => {
      if (id !== dropId) pts.push({ x: Math.round(p.x), y: Math.round(p.y), id });
    });
    return pts;
  }
  return {
    async start(id, x, y) {
      fingers.set(id, { x, y });
      await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: pointsExcept(null) });
    },
    async move(id, x, y) {
      fingers.set(id, { x, y });
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: pointsExcept(null) });
    },
    async end(id) {
      fingers.delete(id);
      await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: pointsExcept(null) });
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
await page.evaluate(() => {
  window.__stickUps = [];
  window.__stickCancels = [];
  const zone = document.getElementById("stick-zone");
  zone.addEventListener("pointerup", (e) => { window.__stickUps.push(e.pointerId); });
  zone.addEventListener("pointercancel", (e) => { window.__stickCancels.push(e.pointerId); });
  document.addEventListener("pointercancel", (e) => { window.__stickCancels.push(e.pointerId); }, true);
  SF.beginNew();
  SF.state.dialogue = null;
  SF.state.mode = "play";
  SF.state.player.x = SF.WAKE.x;
  SF.state.player.y = SF.WAKE.y;
  SF.syncUI();
});
await page.waitForTimeout(150);

const spots = await page.evaluate(() => {
  const stick = document.getElementById("stick-zone").getBoundingClientRect();
  const pause = document.getElementById("btn-pause").getBoundingClientRect();
  return {
    touch: document.body.dataset.touch,
    stick: { x: stick.left + stick.width * 0.5, y: stick.top + stick.height * 0.72 },
    nudge: { x: stick.left + stick.width * 0.5, y: stick.top + stick.height * 0.28 },
    pause: { x: pause.left + pause.width / 2, y: pause.top + pause.height / 2 }
  };
});
if (spots.touch !== "1") fail("stick is not on screen (data-touch=" + spots.touch + ")");

const hands = await touchSession(page);
await hands.start(1, spots.stick.x, spots.stick.y);
await hands.move(1, spots.nudge.x, spots.nudge.y);
await page.waitForTimeout(280);
const walking = await page.evaluate(() => ({
  x: SF.state.player.x,
  y: SF.state.player.y,
  sx: SF.inputState.stickX,
  sy: SF.inputState.stickY,
  id: SF.inputState.stickId,
  mode: SF.state.mode
}));
const originPos = await page.evaluate(() => ({ x: SF.WAKE.x, y: SF.WAKE.y }));
const moved = Math.hypot(walking.x - originPos.x, walking.y - originPos.y);
if (!(moved > 8) || Math.abs(walking.sy) < 0.2) {
  fail("stick finger did not walk the hero " + JSON.stringify(walking));
}

const stickPointer = walking.id;
await hands.start(2, spots.pause.x, spots.pause.y);
await page.waitForTimeout(80);
const opened = await page.evaluate(() => ({
  mode: SF.state.mode,
  sx: SF.inputState.stickX,
  sy: SF.inputState.stickY,
  id: SF.inputState.stickId
}));
if (opened.mode !== "fieldmenu") fail("second finger did not open the menu " + JSON.stringify(opened));
if (opened.sx !== 0 || opened.sy !== 0 || opened.id != null) {
  fail("opening the menu left the stick held " + JSON.stringify(opened));
}

await hands.end(2);
await page.waitForTimeout(40);
const afterPauseUp = await page.evaluate(() => SF.state.mode);
if (afterPauseUp !== "fieldmenu") fail("the finger that opened the menu also closed it (" + afterPauseUp + ")");

await hands.end(1);
await page.waitForTimeout(40);
const afterStickUp = await page.evaluate((stickPointer) => ({
  mode: SF.state.mode,
  sx: SF.inputState.stickX,
  sy: SF.inputState.stickY,
  id: SF.inputState.stickId,
  ups: window.__stickUps.slice(),
  cancels: window.__stickCancels.slice(),
  stickUp: window.__stickUps.indexOf(stickPointer) >= 0,
  stickCancel: window.__stickCancels.indexOf(stickPointer) >= 0
}), stickPointer);
if (afterStickUp.sx !== 0 || afterStickUp.sy !== 0 || afterStickUp.id != null) {
  fail("lifting the stick finger left it held " + JSON.stringify(afterStickUp));
}
if (!afterStickUp.stickUp) fail("stick finger never received pointerup " + JSON.stringify(afterStickUp));
if (afterStickUp.stickCancel) fail("stick finger was cancelled " + JSON.stringify(afterStickUp));

const resume = await page.evaluate(() => {
  const r = document.getElementById("field-back").getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
});
await hands.start(3, resume.x, resume.y);
await hands.end(3);
await page.waitForTimeout(80);
const closed = await page.evaluate(() => SF.state.mode);
if (closed !== "play") fail("fresh tap did not leave the menu (" + closed + ")");

const parked = await page.evaluate(() => ({ x: SF.state.player.x, y: SF.state.player.y }));
await page.waitForTimeout(350);
const stayed = await page.evaluate(() => ({ x: SF.state.player.x, y: SF.state.player.y, sx: SF.inputState.stickX, sy: SF.inputState.stickY, id: SF.inputState.stickId }));
if (Math.hypot(stayed.x - parked.x, stayed.y - parked.y) > 1.5 || stayed.sx || stayed.sy || stayed.id != null) {
  fail("hero kept walking after the stick finger lifted " + JSON.stringify({ parked, stayed }));
}

const again = await page.evaluate(() => {
  const stick = document.getElementById("stick-zone").getBoundingClientRect();
  return {
    x: stick.left + stick.width * 0.5,
    y0: stick.top + stick.height * 0.72,
    y1: stick.top + stick.height * 0.28,
    pos: { x: SF.state.player.x, y: SF.state.player.y }
  };
});
await hands.start(4, again.x, again.y0);
await hands.move(4, again.x, again.y1);
await page.waitForTimeout(280);
const rewalk = await page.evaluate((from) => ({
  x: SF.state.player.x,
  y: SF.state.player.y,
  sx: SF.inputState.stickX,
  sy: SF.inputState.stickY,
  id: SF.inputState.stickId,
  from: from
}), again.pos);
if (rewalk.id == null || Math.abs(rewalk.sy) < 0.2 || Math.hypot(rewalk.x - again.pos.x, rewalk.y - again.pos.y) < 8) {
  fail("a new stick touch did not move the hero " + JSON.stringify(rewalk));
}
await hands.end(4);
await page.waitForTimeout(40);
const released = await page.evaluate(() => ({ sx: SF.inputState.stickX, sy: SF.inputState.stickY, id: SF.inputState.stickId }));
if (released.sx || released.sy || released.id != null) fail("new stick touch did not release " + JSON.stringify(released));

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
  SF.startDialogue("emberhold.maren.intro");
  const d = SF.state.dialogue;
  d.i = d.lines.length - 1;
  d.done = true;
  d.lock = 0;
  SF.advanceDialogue();
  SF.state.dialogue.lock = 0;
  SF.syncUI();
});
await dp.waitForTimeout(80);
const hintBox = await dp.evaluate(() => {
  const hint = document.getElementById("dlg-hint").getBoundingClientRect();
  const box = document.getElementById("dialogue").getBoundingClientRect();
  const cs = getComputedStyle(document.getElementById("dialogue"));
  const border = parseFloat(cs.borderBottomWidth) || 0;
  const pad = parseFloat(cs.paddingBottom) || 0;
  return {
    text: document.getElementById("dlg-hint").textContent,
    hintTop: hint.top,
    hintBottom: hint.bottom,
    hintH: hint.height,
    boxTop: box.top,
    boxBottom: box.bottom,
    border: border,
    pad: pad,
    inside: hint.top >= box.top + border && hint.bottom <= box.bottom - border - 1 && hint.height > 10
  };
});
if (hintBox.text.indexOf("Enter") < 0) fail("choice hint missing keys " + JSON.stringify(hintBox));
if (!hintBox.inside) fail("choice hint is cut off by the dialogue box " + JSON.stringify(hintBox));
await desk.close();

await browser.close();
server.close();
if (process.exitCode) process.exit(process.exitCode);
console.log("stick two-finger ok");
