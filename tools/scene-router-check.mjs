// SceneRouter check (OO-03). Boots the real page and walks title -> field
// -> battle -> field. Every step must go through SF.game.scenes: the router
// history records each transition, and the router picks the screen that
// paints (title, field, or battle). Nothing here draws.
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
  console.error("scene router: playwright-core is not installed");
  process.exit(1);
}

const pw = loadPlaywright();
const { chromium } = pw.default || pw;
const chrome = process.env.CHROME || "/usr/bin/google-chrome";
if (!fs.existsSync(chrome)) {
  console.error("scene router: chrome not found at " + chrome);
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


const phone = await browser.newContext({
  viewport: { width: 844, height: 390 },
  deviceScaleFactor: 3,
  hasTouch: true,
  isMobile: true
});
const booted = await boot(phone);
const page = booted.page;
await page.waitForFunction(() => SF.game && SF.game.scenes && SF.game.scenes.current() === "title");

const report = await page.evaluate(async () => {
  const problems = [];
  const router = SF.game.scenes;
  const frames = (n) => new Promise((resolve) => {
    let left = n;
    function step() { left -= 1; if (left <= 0) resolve(); else requestAnimationFrame(step); }
    requestAnimationFrame(step);
  });
  const painted = { title: 0, field: 0, battle: 0 };
  const realTitle = SF.drawTitleScene;
  const realField = SF.drawField;
  const realBattle = SF.drawBattle;
  SF.drawTitleScene = function () { painted.title += 1; return realTitle.apply(this, arguments); };
  SF.drawField = function () { painted.field += 1; return realField.apply(this, arguments); };
  SF.drawBattle = function () { painted.battle += 1; return realBattle.apply(this, arguments); };
  function reset() { painted.title = 0; painted.field = 0; painted.battle = 0; }
  function seen(label, screen) {
    const others = Object.keys(painted).filter((k) => k !== screen && painted[k] > 0);
    if (!(painted[screen] > 0)) problems.push(label + ": " + screen + " screen did not paint");
    if (others.length) problems.push(label + ": " + others.join(",") + " also painted");
  }
  if (!(router instanceof SF.SceneRouter)) problems.push("game.scenes is not a SceneRouter");
  if (router.game !== SF.game) problems.push("router is not attached to the Game root");
  if (typeof SF.draw !== "undefined") problems.push("SF.draw patch chain still exists");

  reset();
  await frames(4);
  seen("title", "title");

  const start = router.history.length;
  SF.beginNew();
  let guard = 0;
  while (SF.state.mode === "dialogue" && guard < 400) {
    SF.advanceDialogue();
    const pick = document.querySelector("#dlg-choices button");
    if (pick && SF.state.mode === "dialogue") pick.click();
    guard += 1;
    await frames(2);
  }
  if (SF.state.mode !== "play") problems.push("title -> field ended in " + SF.state.mode);
  const toField = router.history.slice(start).map((h) => h.from + ">" + h.to);
  if (toField[0] !== "title>play") problems.push("title -> field history was " + toField.join(" "));
  if (router.current() !== "play") problems.push("router.current() was " + router.current());
  reset();
  await frames(4);
  seen("field", "field");

  const beforeFight = router.history.length;
  SF.Battle.instant = true;
  if (!SF.Battle.start("em_wisps")) problems.push("battle did not start");
  if (router.current() !== "battle") problems.push("field -> battle ended in " + router.current());
  if (router.screenFor(SF.state) !== "battle") problems.push("router did not pick the battle screen");
  reset();
  await frames(4);
  seen("battle", "battle");

  SF.Battle.flow.finish(true);
  if (router.current() !== "play") problems.push("battle -> field ended in " + router.current());
  const fight = router.history.slice(beforeFight).map((h) => h.from + ">" + h.to);
  if (fight.join(" ") !== "play>battle battle>play") problems.push("battle history was " + fight.join(" "));
  reset();
  await frames(4);
  seen("field after battle", "field");

  const last = router.history[router.history.length - 1];
  if (!last || last.to !== SF.state.mode) problems.push("router history does not end at the live mode");

  SF.drawTitleScene = realTitle;
  SF.drawField = realField;
  SF.drawBattle = realBattle;
  return { problems, toField, fight, changes: router.changes };
});

for (const p of report.problems) fail(p);
// The harness hides navigator.serviceWorker, so js/pwa.js throws on
// .controller. The other page checks filter the same line.
for (const e of booted.errors.filter((line) => line.indexOf("controller") < 0)) fail("page error: " + e);
await browser.close();
server.close();
if (!process.exitCode) {
  console.log("scene router ok, title>field " + report.toField.join(" ") + ", fight " + report.fight.join(" ") + ", changes " + report.changes);
}
