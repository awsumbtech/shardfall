// BattleBackdrop check (OO-04). Boots the real page and proves the
// object loads, picks the four layer paths per battle area, cover-fits
// so plate Y 124 lands on the canvas horizon, keeps today's backdrop
// path when an area is not marked ready, and throws when an area marked
// as having art is missing a manifest entry or a layer image.
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
  console.error("battle backdrop: playwright-core is not installed");
  process.exit(1);
}

const pw = loadPlaywright();
const { chromium } = pw.default || pw;
const chrome = process.env.CHROME || "/usr/bin/google-chrome";
if (!fs.existsSync(chrome)) {
  console.error("battle backdrop: chrome not found at " + chrome);
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

const report = await page.evaluate(() => {
  const problems = [];
  const ids = [
    "emberhold_meadow",
    "emberhold_scar",
    "cinderveil_ash",
    "ember_vault",
    "saltmere_shore",
    "saltmere_wreck",
    "highspire_road",
    "hush_deck"
  ];
  const layers = ["sky", "far", "mid", "floor"];
  const parallax = { sky: 0, far: 0.15, mid: 0.4, floor: 1 };
  const encounters = {
    em_wisps: "emberhold_meadow",
    em_brumekin: "emberhold_scar",
    cv_ash1: "cinderveil_ash",
    boss_cinder_maw: "ember_vault",
    sm_saltwisps: "saltmere_shore",
    sm_drowned: "saltmere_wreck",
    hs_choir_patrol: "highspire_road",
    sea_hush_raiders: "hush_deck"
  };
  const backdrop = SF.game && SF.game.battleBackdrop;
  if (!(backdrop instanceof SF.BattleBackdrop)) problems.push("game.battleBackdrop is not a BattleBackdrop");
  if (!backdrop) return { problems, paths: {}, picked: {}, fit: null };

  if (backdrop._attached) problems.push("BattleBackdrop was attached before the battle screen");
  backdrop.attach(SF.game);
  if (!backdrop._attached || backdrop.parent !== SF.game) problems.push("BattleBackdrop did not attach to the Game root");
  const firstParent = backdrop.parent;
  backdrop.attach({ register() { problems.push("second attach was not ignored"); } });
  if (backdrop.parent !== firstParent) problems.push("second attach changed the parent");

  const paths = {};
  ids.forEach((id) => {
    const row = SF.BattleBackdrop.entry(id);
    const idPaths = backdrop.pathsFor(id);
    paths[id] = idPaths;
    if (!row || row.kit !== "shardfall/battle/backdrops/" + id + "/v1/") {
      problems.push(id + " kit path was " + (row && row.kit));
    }
    if (row && row.horizon !== 124) problems.push(id + " horizon was " + (row && row.horizon));
    layers.forEach((layer) => {
      const expected = "assets/battle/backdrops/" + id + "/v1/" + layer + ".png";
      if (idPaths[layer] !== expected) problems.push(id + " " + layer + " path was " + idPaths[layer]);
      if (!row || !row.layers || !row.layers[layer] || row.layers[layer].parallax !== parallax[layer]) {
        problems.push(id + " " + layer + " parallax was wrong");
      }
    });
    if (SF.BattleBackdrop.hasArt(id)) problems.push(id + " was marked ready before art landed");
  });
  if (SF.BattleBackdrop.resolveId("not-a-real-area") !== "emberhold_meadow") {
    problems.push("unknown area did not resolve to emberhold_meadow");
  }

  function checkFit(w, h, label) {
    const fit = SF.BattleBackdrop.fit(w, h);
    const horizon = SF.BattleBackdrop.canvasHorizon(w, h);
    if (fit.horizon !== horizon) problems.push(label + " horizon was " + fit.horizon);
    if (fit.scale !== Math.floor(fit.scale) || fit.scale < 1) problems.push(label + " scale was not a positive integer");
    if (fit.w !== 480 * fit.scale || fit.h !== 270 * fit.scale) problems.push(label + " dest size was not uniform");
    if (fit.y + 124 * fit.scale !== horizon) problems.push(label + " plate Y 124 did not land on the canvas horizon");
    if (fit.x > 0 || fit.y > 0 || fit.x + fit.w < w || fit.y + fit.h < h) {
      problems.push(label + " did not cover the canvas");
    }
    return fit;
  }
  const fit = checkFit(844, 390, "844x390");
  if (fit.scale !== 2) problems.push("844x390 scale was " + fit.scale + ", expected 2");
  checkFit(640, 360, "640x360");
  checkFit(390, 844, "390x844");
  checkFit(375, 667, "375x667");

  const fallbacks = [];
  const previous = backdrop.fallback;
  backdrop.fallback = function (ctx, id, w, h, t) {
    fallbacks.push({ id: id, w: w, h: h, t: t });
  };
  const ctx = { drawImage() { problems.push("unready area used drawImage"); } };
  const usedArt = backdrop.draw(ctx, "emberhold_scar", 844, 390, 1.5);
  if (usedArt !== false) problems.push("unready area was reported as real art");
  if (fallbacks.length !== 1 || fallbacks[0].id !== "emberhold_scar" || fallbacks[0].w !== 844 || fallbacks[0].h !== 390) {
    problems.push("unready area did not keep today's backdrop path");
  }
  backdrop.fallback = previous;

  const picked = {};
  Object.keys(encounters).forEach((encId) => {
    const enc = SF.ENCOUNTERS && SF.ENCOUNTERS[encId];
    const bg = enc && enc.bg;
    picked[encId] = bg;
    if (bg !== encounters[encId]) problems.push(encId + " bg was " + bg);
    const dir = backdrop.pathFor(bg);
    if (dir !== "assets/battle/backdrops/" + encounters[encId] + "/v1/") {
      problems.push(encId + " did not pick " + encounters[encId]);
    }
  });

  const manifest = SF.BattleBackdrop.MANIFEST;
  manifest.test_missing = { ready: true };
  let threw = "";
  try { backdrop.imagesFor("test_missing"); } catch (err) { threw = String(err && err.message || err); }
  delete manifest.test_missing;
  if (threw.indexOf("missing manifest entry") < 0) {
    problems.push("missing manifest entry did not throw: " + threw);
  }

  const row = manifest.emberhold_meadow;
  const wasReady = row.ready;
  row.ready = true;
  threw = "";
  try { backdrop.imagesFor("emberhold_meadow"); } catch (err) { threw = String(err && err.message || err); }
  if (threw.indexOf("missing art") < 0) problems.push("ready area with no images did not throw: " + threw);

  const images = {};
  layers.forEach((layer) => {
    images[layer] = { width: 480, height: 270, complete: true, naturalWidth: 480, naturalHeight: 270, id: layer };
  });
  backdrop.setLayers("emberhold_meadow", images);
  const blits = [];
  const artCtx = {
    drawImage() { blits.push(Array.prototype.slice.call(arguments)); },
    set imageSmoothingEnabled(value) { this._smooth = value; }
  };
  let drewArt = false;
  const prevFallback = backdrop.fallback;
  backdrop.fallback = function () { problems.push("ready area used the old backdrop path"); };
  try { drewArt = backdrop.draw(artCtx, "emberhold_meadow", 844, 390, 0); } catch (err) {
    problems.push("ready area draw threw: " + err);
  }
  backdrop.fallback = prevFallback;
  row.ready = wasReady;
  delete backdrop.images.emberhold_meadow;
  if (drewArt !== true) problems.push("ready area did not blit the real layers");
  if (blits.length !== 4) problems.push("ready area blit count was " + blits.length);
  const expectedFit = SF.BattleBackdrop.fit(844, 390);
  layers.forEach((layer, i) => {
    const blit = blits[i];
    if (!blit || blit[0] !== images[layer] || blit[1] !== expectedFit.x || blit[2] !== expectedFit.y || blit[3] !== expectedFit.w || blit[4] !== expectedFit.h) {
      problems.push("layer " + layer + " blit was " + JSON.stringify(blit));
    }
  });

  return { problems, paths, picked, fit };
});

for (const p of report.problems) fail(p);
for (const e of booted.errors.filter((line) => line.indexOf("controller") < 0)) fail("page error: " + e);
await browser.close();
server.close();
if (!process.exitCode) {
  const fit = report.fit || {};
  console.log("battle backdrop ok, 8 areas, 4 layers, 844x390 scale " + fit.scale + " at " + fit.x + "," + fit.y);
}
