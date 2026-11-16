// BattleBackdrop check (OO-04). Boots the real page and proves the
// object loads, picks the four layer paths per battle area, cover-fits
// so plate Y 124 lands on the canvas horizon, keeps today's backdrop
// path when an area is not marked ready, and throws when an area marked
// as having art is missing a manifest entry or a layer image.
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const toolRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = path.resolve(process.env.SF_SITE_ROOT || toolRoot);
const skipPairProof = process.env.SF_SKIP_PAIR_PROOF === "1";


function attachCatalogPaths(info) {
  info.precache = info.precache || (info.catalog && info.catalog.precache) || [];
  info.areaVersion = function (id) {
    const catalog = info.catalog;
    const row = catalog && catalog.areas && catalog.areas[id];
    return (row && row.version) || (catalog && catalog.version) || "v1";
  };
  info.areaAssetDir = function (id) {
    const catalog = info.catalog;
    const row = catalog && catalog.areas && catalog.areas[id];
    if (row && row.dir) return row.dir;
    return "assets/battle/backdrops/" + id + "/" + info.areaVersion(id) + "/";
  };
  info.areaKitDir = function (id) {
    const catalog = info.catalog;
    const row = catalog && catalog.areas && catalog.areas[id];
    if (row && row.kit) return row.kit;
    return "shardfall/battle/backdrops/" + id + "/" + info.areaVersion(id) + "/";
  };
  info.areaLayerPath = function (id, layer) {
    const catalog = info.catalog;
    const row = catalog && catalog.areas && catalog.areas[id];
    if (row && row.layers && row.layers[layer] && row.layers[layer].path) return row.layers[layer].path;
    return info.areaAssetDir(id) + layer + ".png";
  };
  info.expectedPrecache = function () {
    const layers = ((info.catalog.layers) || []).map((spec) => spec.id);
    const expected = [];
    info.readyIds.forEach((id) => {
      layers.forEach((layer) => expected.push(info.areaLayerPath(id, layer)));
    });
    return expected;
  };
  info.precacheMismatches = function () {
    const expected = info.expectedPrecache();
    const precache = info.precache || [];
    return {
      expected,
      extra: precache.filter((p) => expected.indexOf(p) < 0),
      missing: expected.filter((p) => precache.indexOf(p) < 0)
    };
  };
  return info;
}

function provePrecacheRejectsExtraV1(readCatalog, failFn, siteRoot) {
  const extra = "assets/battle/backdrops/saltmere_wreck/v1/mid.png";
  const dest = fs.mkdtempSync(path.join(os.tmpdir(), "oo08-precache-"));
  const destData = path.join(dest, "js/data");
  fs.mkdirSync(destData, { recursive: true });
  const src = fs.readFileSync(path.join(siteRoot, "js/data/battle-backdrops.js"), "utf8");
  fs.writeFileSync(path.join(destData, "battle-backdrops.js"), src + "\n" +
    "(function (root) {\n" +
    "  var data = (root.SF || {}).BattleBackdropData;\n" +
    "  if (data && data.precache) data.precache.push(\"" + extra + "\");\n" +
    "})(typeof window !== \"undefined\" ? window : self);\n");
  const tainted = readCatalog(dest);
  const mismatch = tainted.precacheMismatches();
  try { fs.rmSync(dest, { recursive: true, force: true }); } catch (err) {}
  if (mismatch.extra.indexOf(extra) < 0) {
    failFn("precache exact check did not catch a re-added wreck v1 path");
  }
}

function loadCatalog(siteRoot) {
  const dataFile = path.join(siteRoot, "js/data/battle-backdrops.js");
  if (!fs.existsSync(dataFile)) {
    console.error("FAIL missing " + dataFile);
    process.exit(1);
  }
  const box = { window: null, self: null };
  box.window = box;
  box.self = box;
  vm.runInContext(fs.readFileSync(dataFile, "utf8"), vm.createContext(box), { filename: dataFile });
  const catalog = box.SF && box.SF.BattleBackdropData;
  if (!catalog || !Array.isArray(catalog.ids) || !catalog.ids.length) {
    console.error("FAIL catalog lists no areas");
    process.exit(1);
  }
  const readyIds = [];
  const unreadyIds = [];
  for (let i = 0; i < catalog.ids.length; i++) {
    const id = catalog.ids[i];
    const row = catalog.areas && catalog.areas[id];
    if (row && row.ready) readyIds.push(id);
    else unreadyIds.push(id);
  }
  return attachCatalogPaths({ catalog, readyIds, unreadyIds, defaultId: catalog.defaultId, precache: catalog.precache || [] });
}

function markReadyInCatalogSrc(src, id) {
  const readyRe = /var ready = \{([^}]*)\};/;
  const match = src.match(readyRe);
  if (!match) return null;
  if (new RegExp("(^|[,\\s])" + id + "\\s*:").test(match[1])) return src;
  const body = match[1].replace(/\s+$/, "").replace(/,\s*$/, "");
  return src.replace(readyRe, "var ready = {" + body + ", " + id + ": true };");
}

function addIdToCatalogSrc(src, id) {
  const idsRe = /var ids = \[([\s\S]*?)\];/;
  const match = src.match(idsRe);
  if (!match) return null;
  if (match[1].indexOf('"' + id + '"') >= 0) return src;
  const body = match[1].replace(/\s+$/, "").replace(/,\s*$/, "");
  return src.replace(idsRe, "var ids = [" + body + ',\n    "' + id + '"\n  ];');
}

function copyTree(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(src, dest, { recursive: true });
}

function copySite(dest) {
  fs.copyFileSync(path.join(root, "index.html"), path.join(dest, "index.html"));
  fs.copyFileSync(path.join(root, "sw.js"), path.join(dest, "sw.js"));
  if (fs.existsSync(path.join(root, "manifest.webmanifest"))) {
    fs.copyFileSync(path.join(root, "manifest.webmanifest"), path.join(dest, "manifest.webmanifest"));
  }
  for (const dir of ["css", "js", "icons"]) {
    copyTree(path.join(root, dir), path.join(dest, dir));
  }
  copyTree(path.join(root, "assets", "ui"), path.join(dest, "assets", "ui"));
  copyTree(path.join(root, "assets", "battle"), path.join(dest, "assets", "battle"));
}


function copyLayerArt(destRoot, fromId, toId, layers) {
  const destDir = path.join(destRoot, catalogInfo.areaAssetDir(toId));
  const srcDir = path.join(destRoot, catalogInfo.areaAssetDir(fromId));
  fs.mkdirSync(destDir, { recursive: true });
  for (const layer of layers) {
    fs.copyFileSync(path.join(srcDir, layer + ".png"), path.join(destDir, layer + ".png"));
  }
}

const catalogInfo = loadCatalog(root);
{
  const mismatch = catalogInfo.precacheMismatches();
  if (mismatch.extra.length || mismatch.missing.length || (catalogInfo.precache || []).length !== mismatch.expected.length) {
    console.error("FAIL catalog precache was not exactly the ready rows' active paths (extra " +
      mismatch.extra.join(", ") + "; missing " + mismatch.missing.join(", ") + ")");
    process.exit(1);
  }
}
if (!skipPairProof) {
  provePrecacheRejectsExtraV1(loadCatalog, function (msg) {
    console.error("FAIL " + msg);
    process.exit(1);
  }, root);
  console.log("precache exact-match ok, caught re-added wreck v1 path");
}


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
await page.waitForFunction(() => {
  const data = SF.BattleBackdropData;
  const b = SF.game && SF.game.battleBackdrop;
  if (!data || !data.ids || !b || typeof b.layersReady !== "function") return false;
  for (let i = 0; i < data.ids.length; i++) {
    const id = data.ids[i];
    const row = data.areas && data.areas[id];
    if (row && row.ready && !b.layersReady(id)) return false;
  }
  return true;
}, null, { timeout: 8000 });

const report = await page.evaluate(() => {
  const problems = [];
  const data = SF.BattleBackdropData;
  if (!data || !Array.isArray(data.ids) || !data.ids.length) problems.push("catalog lists no areas");
  const ids = (data && data.ids) || [];
  const layerSpecs = (data && data.layers) || [];
  const layers = [];
  const parallax = {};
  for (let i = 0; i < layerSpecs.length; i++) {
    layers.push(layerSpecs[i].id);
    parallax[layerSpecs[i].id] = layerSpecs[i].parallax;
  }
  if (layers.length !== 4) problems.push("catalog layer count was " + layers.length);
  const readyIds = [];
  const unreadyIds = [];
  for (let i = 0; i < ids.length; i++) {
    const row = data && data.areas && data.areas[ids[i]];
    if (row && row.ready) readyIds.push(ids[i]);
    else unreadyIds.push(ids[i]);
  }
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
    const ver = (row && row.version) || (data && data.version) || "v1";
    if (!row || row.kit !== "shardfall/battle/backdrops/" + id + "/" + ver + "/") {
      problems.push(id + " kit path was " + (row && row.kit));
    }
    if (row && row.horizon !== 124) problems.push(id + " horizon was " + (row && row.horizon));
    layers.forEach((layer) => {
      const expected = "assets/battle/backdrops/" + id + "/" + ver + "/" + layer + ".png";
      if (idPaths[layer] !== expected) problems.push(id + " " + layer + " path was " + idPaths[layer]);
      if (!row || !row.layers || !row.layers[layer] || row.layers[layer].parallax !== parallax[layer]) {
        problems.push(id + " " + layer + " parallax was wrong");
      }
    });
    const shouldReady = readyIds.indexOf(id) >= 0;
    if (!!SF.BattleBackdrop.hasArt(id) !== shouldReady) problems.push(id + " ready was " + SF.BattleBackdrop.hasArt(id));
  });
  if (!data || !data.defaultId) problems.push("catalog has no defaultId");
  if (data && SF.BattleBackdrop.DEFAULT_ID !== data.defaultId) {
    problems.push("catalog defaultId was " + SF.BattleBackdrop.DEFAULT_ID);
  }
  if (SF.BattleBackdrop.resolveId("not-a-real-area") !== SF.BattleBackdrop.DEFAULT_ID) {
    problems.push("unknown area did not fall back to the catalog default");
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
  const probe = unreadyIds[0];
  const ctx = { drawImage() { problems.push("unready area used drawImage"); } };
  if (probe) {
    const usedArt = backdrop.draw(ctx, probe, 844, 390, 1.5);
    if (usedArt !== false) problems.push("unready area was reported as real art");
    if (fallbacks.length !== 1 || fallbacks[0].id !== probe || fallbacks[0].w !== 844 || fallbacks[0].h !== 390) {
      problems.push("unready area did not keep today's backdrop path");
    }
  }
  backdrop.fallback = previous;

  const unready = unreadyIds;
  unready.forEach((id) => {
    if (backdrop.layersReady(id)) problems.push(id + " was treated as loaded art");
    const fb = [];
    backdrop.fallback = function (c, area) { fb.push(area); };
    const drew = backdrop.draw({ drawImage() { problems.push(id + " used drawImage"); } }, id, 844, 390, 0);
    if (drew !== false || fb[0] !== id) problems.push(id + " did not keep today's backdrop path");
  });
  backdrop.fallback = previous;

  const picked = {};
  Object.keys(encounters).forEach((encId) => {
    const enc = SF.ENCOUNTERS && SF.ENCOUNTERS[encId];
    const bg = enc && enc.bg;
    picked[encId] = bg;
    if (bg !== encounters[encId]) problems.push(encId + " bg was " + bg);
    const dir = backdrop.pathFor(bg);
    const bgRow = SF.BattleBackdrop.entry(bg);
    const bgVer = (bgRow && bgRow.version) || (SF.BattleBackdropData && SF.BattleBackdropData.version) || "v1";
    if (dir !== "assets/battle/backdrops/" + encounters[encId] + "/" + bgVer + "/") {
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

  const expectedFit = SF.BattleBackdrop.fit(844, 390);
  readyIds.forEach((id) => {
    if (!backdrop.layersReady(id)) problems.push(id + " real images did not load");
    let loaded = null;
    try { loaded = backdrop.imagesFor(id); } catch (err) {
      problems.push(id + " imagesFor threw: " + err);
      return;
    }
    layers.forEach((layer) => {
      const img = loaded && loaded[layer];
      const w = img && (img.naturalWidth || img.width);
      const h = img && (img.naturalHeight || img.height);
      if (!(w === 480 && h === 270)) problems.push(id + " " + layer + " size was " + w + "x" + h);
    });
    const blits = [];
    const artCtx = {
      drawImage() { blits.push(Array.prototype.slice.call(arguments)); },
      set imageSmoothingEnabled(value) { this._smooth = value; }
    };
    let drewArt = false;
    const prevFallback = backdrop.fallback;
    backdrop.fallback = function () { problems.push(id + " used the old backdrop path"); };
    try { drewArt = backdrop.draw(artCtx, id, 844, 390, 0); } catch (err) {
      problems.push(id + " draw threw: " + err);
    }
    backdrop.fallback = prevFallback;
    if (drewArt !== true) problems.push(id + " did not blit the real layers");
    if (blits.length !== 4) problems.push(id + " blit count was " + blits.length);
    layers.forEach((layer, i) => {
      const blit = blits[i];
      if (!blit || blit[0] !== loaded[layer] || blit[1] !== expectedFit.x || blit[2] !== expectedFit.y || blit[3] !== expectedFit.w || blit[4] !== expectedFit.h) {
        problems.push(id + " " + layer + " blit was wrong");
      }
    });
  });

  return { problems, paths, picked, fit };
});

for (const p of report.problems) fail(p);
for (const e of booted.errors.filter((line) => line.indexOf("controller") < 0)) fail("page error: " + e);


if (!skipPairProof) {
// A ninth area is a data entry only: a temp copy of the site, a patched
// catalog row, and art files under the new id. No adopt/setLayers, and
// no edits to the object or sw.js. A live fight with that bg must blit
// the ninth plates.
const ninthId = "oo04_fixture";
const ninthRoot = fs.mkdtempSync(path.join(os.tmpdir(), "oo04-ninth-"));
copySite(ninthRoot);

const dataFile = path.join(ninthRoot, "js/data/battle-backdrops.js");
let catalogSrc = fs.readFileSync(dataFile, "utf8");
catalogSrc = addIdToCatalogSrc(catalogSrc, ninthId);
catalogSrc = catalogSrc && markReadyInCatalogSrc(catalogSrc, ninthId);
if (!catalogSrc || catalogSrc.indexOf('"' + ninthId + '"') < 0 || catalogSrc.indexOf(ninthId + ": true") < 0) {
  fail("temp catalog was not patched with " + ninthId);
} else {
  fs.writeFileSync(dataFile, catalogSrc);
}
const donorId = catalogInfo.readyIds[0] || catalogInfo.defaultId;
const layerIds = ((catalogInfo.catalog && catalogInfo.catalog.layers) || []).map((spec) => spec.id);
copyLayerArt(ninthRoot, donorId, ninthId, layerIds.length ? layerIds : ["sky", "far", "mid", "floor"]);

const ninthServer = http.createServer((req, res) => {
  const url = new URL(req.url, "http://127.0.0.1");
  let rel = decodeURIComponent(url.pathname);
  if (rel === "/") rel = "/index.html";
  const file = path.normalize(path.join(ninthRoot, rel));
  if (!file.startsWith(ninthRoot) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
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
await new Promise((resolve) => ninthServer.listen(0, "127.0.0.1", resolve));
const ninthOrigin = "http://127.0.0.1:" + ninthServer.address().port;

const ninthContext = await browser.newContext({
  viewport: { width: 844, height: 390 },
  deviceScaleFactor: 3,
  hasTouch: true,
  isMobile: true
});
await ninthContext.addInitScript(() => {
  try {
    Object.defineProperty(navigator, "serviceWorker", { configurable: true, get() { return undefined; } });
  } catch (err) {}
});
const ninthPage = await ninthContext.newPage();
const ninthErrors = [];
ninthPage.on("pageerror", (err) => ninthErrors.push(String(err)));
await ninthPage.goto(ninthOrigin + "/index.html?debug=1", { waitUntil: "domcontentloaded" });
await ninthPage.waitForFunction(() => window.SF && SF.state && SF.bindInput);
await ninthPage.waitForFunction(() => SF.game && SF.game.scenes && SF.game.scenes.current() === "title");
await ninthPage.waitForFunction((id) => {
  const b = SF.game && SF.game.battleBackdrop;
  return b && typeof b.layersReady === "function" && b.layersReady(id);
}, ninthId, { timeout: 8000 });

const ninthReport = await ninthPage.evaluate(async (ninthId) => {
  const problems = [];
  const frames = (n) => new Promise((resolve) => {
    let left = n;
    function step() { left -= 1; if (left <= 0) resolve(); else requestAnimationFrame(step); }
    requestAnimationFrame(step);
  });
  const backdrop = SF.game && SF.game.battleBackdrop;
  if (!backdrop) problems.push("ninth boot has no BattleBackdrop");
  if (!SF.BattleBackdrop.hasArt(ninthId)) problems.push("ninth id was not ready from the data file");
  const ninthVer = (SF.BattleBackdropData && SF.BattleBackdropData.version) || "v1";
  const expected = "assets/battle/backdrops/" + ninthId + "/" + ninthVer + "/sky.png";
  if (!backdrop || backdrop.pathFor(ninthId, "sky") !== expected) {
    problems.push("ninth sky path was " + (backdrop && backdrop.pathFor(ninthId, "sky")));
  }
  if (SF.BattleBackdrop.IDS.indexOf(ninthId) < 0) problems.push("ninth id was not in the catalog");

  SF.beginNew();
  let guard = 0;
  while (SF.state.mode === "dialogue" && guard < 400) {
    SF.advanceDialogue();
    const pick = document.querySelector("#dlg-choices button");
    if (pick && SF.state.mode === "dialogue") pick.click();
    guard += 1;
    await frames(2);
  }
  if (SF.state.mode !== "play") problems.push("ninth boot ended in " + SF.state.mode + " before the fight");
  if (!SF.Battle.start("em_wisps", { bg: ninthId })) problems.push("ninth fight did not start");
  if (!SF.state.battle || SF.state.battle.bg !== ninthId) {
    problems.push("ninth fight bg was " + (SF.state.battle && SF.state.battle.bg));
  }
  await frames(8);
  const blits = [];
  const fallbacks = [];
  const prev = backdrop.fallback;
  backdrop.fallback = function (ctx, id) { fallbacks.push(id); if (typeof prev === "function") prev.apply(this, arguments); };
  const rawDraw = backdrop.draw.bind(backdrop);
  const probe = {
    drawImage() { blits.push({ src: arguments[0] && (arguments[0].src || arguments[0].currentSrc || ""), img: arguments[0] }); },
    set imageSmoothingEnabled(value) { this._smooth = value; }
  };
  let drew = false;
  try { drew = rawDraw(probe, ninthId, 844, 390, 0); } catch (err) {
    problems.push("ninth fight draw threw: " + err);
  }
  backdrop.fallback = prev;
  if (drew !== true) problems.push("ninth fight did not blit real plates");
  if (fallbacks.length) problems.push("ninth fight used the old backdrop path");
  if (blits.length !== 4) problems.push("ninth fight blit count was " + blits.length);
  const suffix = "/assets/battle/backdrops/" + ninthId + "/" + ninthVer + "/";
  const layerIds = ((SF.BattleBackdropData && SF.BattleBackdropData.layers) || []).map((spec) => spec.id);
  (layerIds.length ? layerIds : ["sky", "far", "mid", "floor"]).forEach((layer, i) => {
    const src = String((blits[i] && blits[i].src) || "");
    if (src.indexOf(suffix + layer + ".png") < 0) {
      problems.push("ninth fight " + layer + " came from " + src);
    }
  });
  return { problems, bg: SF.state.battle && SF.state.battle.bg, blitCount: blits.length };
}, ninthId);

for (const p of ninthReport.problems) fail(p);
for (const e of ninthErrors.filter((line) => line.indexOf("controller") < 0)) fail("ninth page error: " + e);

await ninthContext.close();
ninthServer.close();
try { fs.rmSync(ninthRoot, { recursive: true, force: true }); } catch (err) {}

// Future pair: flip one catalog-unready id to ready and copy plates. The
// same check, with no edits under tools/, must treat it as a ready area.
// When every catalog id is already ready, the ninth-entry fresh-boot above
// is the same proof: a new area is a data row plus art, so there is no
// separate skip path.
if (catalogInfo.unreadyIds.length) {
  const pairRoot = fs.mkdtempSync(path.join(os.tmpdir(), "oo05-pair-"));
  copySite(pairRoot);
  const flipId = catalogInfo.unreadyIds[0];
  const pairData = path.join(pairRoot, "js/data/battle-backdrops.js");
  let pairSrc = markReadyInCatalogSrc(fs.readFileSync(pairData, "utf8"), flipId);
  if (!pairSrc || pairSrc.indexOf(flipId + ": true") < 0) {
    fail("future-pair catalog was not marked ready for " + flipId);
  } else {
    fs.writeFileSync(pairData, pairSrc);
  }
  copyLayerArt(pairRoot, donorId, flipId, layerIds.length ? layerIds : ["sky", "far", "mid", "floor"]);
  const childEnv = Object.assign({}, process.env, {
    SF_SITE_ROOT: pairRoot,
    SF_SKIP_PAIR_PROOF: "1"
  });
  const child = spawnSync(process.execPath, [fileURLToPath(import.meta.url)], {
    env: childEnv,
    stdio: "inherit"
  });
  if (child.status !== 0) fail("future-pair check failed for " + flipId + " (status " + child.status + ")");
  try { fs.rmSync(pairRoot, { recursive: true, force: true }); } catch (err) {}
}
} // !skipPairProof

await browser.close();
server.close();
if (!process.exitCode) {
  const fit = report.fit || {};
  const readyIds = catalogInfo.readyIds;
  const unreadyN = catalogInfo.unreadyIds.length;
  let proof;
  if (skipPairProof) proof = "pair-child ok";
  else if (unreadyN) proof = "ninth data entry ok, future-pair ok";
  else proof = "ninth data entry ok";
  console.log("battle backdrop ok, " + readyIds.length + " ready (" + readyIds.join(", ") + "), " + unreadyN + " unready, " + proof + ", 844x390 scale " + fit.scale + " at " + fit.x + "," + fit.y);
}
