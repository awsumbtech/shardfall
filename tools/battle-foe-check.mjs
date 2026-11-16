// BattleFoeSprite check (OO-08). Boots the real page and proves the
// object loads a ready foe's sheet, draws a real frame for each
// animation state, keeps today's Art.sprite path when a foe is not
// marked ready, and that an 8th catalog row plus a copied sheet works
// with zero object or sw.js edits. Precache must match the ready rows
// exactly.
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const toolRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = path.resolve(process.env.SF_SITE_ROOT || toolRoot);
const skipPairProof = process.env.SF_SKIP_PAIR_PROOF === "1";

function attachCatalogPaths(info) {
  info.precache = info.precache || (info.catalog && info.catalog.precache) || [];
  info.foeVersion = function (id) {
    const catalog = info.catalog;
    const row = catalog && catalog.foes && catalog.foes[id];
    return (row && row.version) || (catalog && catalog.version) || "v1";
  };
  info.foeAssetDir = function (id) {
    const catalog = info.catalog;
    const row = catalog && catalog.foes && catalog.foes[id];
    if (row && row.dir) return row.dir;
    return "assets/battle/foes/" + id + "/" + info.foeVersion(id) + "/";
  };
  info.foePath = function (id) {
    const catalog = info.catalog;
    const row = catalog && catalog.foes && catalog.foes[id];
    if (row && row.path) return row.path;
    return info.foeAssetDir(id) + id + ".png";
  };
  info.expectedPrecache = function () {
    const expected = [];
    info.readyIds.forEach((id) => expected.push(info.foePath(id)));
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

function provePrecacheRejectsExtra(readCatalog, failFn, siteRoot) {
  const extra = "assets/battle/foes/wisp/v0/wisp.png";
  const dest = fs.mkdtempSync(path.join(os.tmpdir(), "oo08-foe-precache-"));
  const destData = path.join(dest, "js/data");
  fs.mkdirSync(destData, { recursive: true });
  const src = fs.readFileSync(path.join(siteRoot, "js/data/battle-foes.js"), "utf8");
  fs.writeFileSync(path.join(destData, "battle-foes.js"), src + "\n" +
    "(function (root) {\n" +
    "  var data = (root.SF || {}).BattleFoeData;\n" +
    "  if (data && data.precache) data.precache.push(\"" + extra + "\");\n" +
    "})(typeof window !== \"undefined\" ? window : self);\n");
  const tainted = readCatalog(dest);
  const mismatch = tainted.precacheMismatches();
  try { fs.rmSync(dest, { recursive: true, force: true }); } catch (err) {}
  if (mismatch.extra.indexOf(extra) < 0) {
    failFn("precache exact check did not catch an extra foe path");
  }
}

function loadCatalog(siteRoot) {
  const dataFile = path.join(siteRoot, "js/data/battle-foes.js");
  if (!fs.existsSync(dataFile)) {
    console.error("FAIL missing " + dataFile);
    process.exit(1);
  }
  const box = { window: null, self: null };
  box.window = box;
  box.self = box;
  vm.runInContext(fs.readFileSync(dataFile, "utf8"), vm.createContext(box), { filename: dataFile });
  const catalog = box.SF && box.SF.BattleFoeData;
  if (!catalog || !Array.isArray(catalog.ids) || !catalog.ids.length) {
    console.error("FAIL catalog lists no foes");
    process.exit(1);
  }
  const readyIds = [];
  const unreadyIds = [];
  for (let i = 0; i < catalog.ids.length; i++) {
    const id = catalog.ids[i];
    const row = catalog.foes && catalog.foes[id];
    if (row && row.ready) readyIds.push(id);
    else unreadyIds.push(id);
  }
  return attachCatalogPaths({ catalog, readyIds, unreadyIds, precache: catalog.precache || [] });
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

const catalogInfo = loadCatalog(root);
{
  const mismatch = catalogInfo.precacheMismatches();
  if (mismatch.extra.length || mismatch.missing.length || (catalogInfo.precache || []).length !== mismatch.expected.length) {
    console.error("FAIL catalog precache was not exactly the ready rows' active paths (extra " +
      mismatch.extra.join(", ") + "; missing " + mismatch.missing.join(", ") + ")");
    process.exit(1);
  }
  if (catalogInfo.readyIds.length !== 6) {
    console.error("FAIL ready foe count was " + catalogInfo.readyIds.length + ", expected 6");
    process.exit(1);
  }
  if (catalogInfo.readyIds.indexOf("sootwing") >= 0) {
    console.error("FAIL sootwing was marked ready");
    process.exit(1);
  }
  if (catalogInfo.unreadyIds.indexOf("sootwing") < 0) {
    console.error("FAIL sootwing was not catalogued as unready");
    process.exit(1);
  }
  if ((catalogInfo.precache || []).indexOf(catalogInfo.foePath("sootwing")) >= 0) {
    console.error("FAIL sootwing sheet was in the precache");
    process.exit(1);
  }
}
if (!skipPairProof) {
  provePrecacheRejectsExtra(loadCatalog, function (msg) {
    console.error("FAIL " + msg);
    process.exit(1);
  }, root);
  console.log("precache exact-match ok, caught an extra foe path");
}

const objectFile = path.join(root, "js/battle/battle-foe-sprite.js");
if (!fs.existsSync(objectFile)) {
  console.error("FAIL missing js/battle/battle-foe-sprite.js");
  process.exit(1);
}
{
  const src = fs.readFileSync(objectFile, "utf8");
  if (/\bSF\./.test(src)) {
    console.error("FAIL battle-foe-sprite.js has an SF.* site");
    process.exit(1);
  }
  const worker = fs.readFileSync(path.join(root, "sw.js"), "utf8");
  if (!worker.includes('importScripts("js/data/battle-foes.js")')) {
    console.error("FAIL sw.js does not read foe art from the catalog");
    process.exit(1);
  }
  catalogInfo.readyIds.forEach((id) => {
    const rel = catalogInfo.foePath(id);
    if (!fs.existsSync(path.join(root, rel))) {
      console.error("FAIL missing " + rel);
      process.exit(1);
    }
    if (worker.includes('"' + rel + '"')) {
      console.error("FAIL sw.js hard-codes " + rel);
      process.exit(1);
    }
  });
}

function loadPlaywright() {
  const candidates = [
    "playwright-core",
    "/tmp/pw/node_modules/playwright-core"
  ];
  for (const name of candidates) {
    try { return require(name); } catch (err) { /* try the next */ }
  }
  console.error("battle foe: playwright-core is not installed");
  process.exit(1);
}

const pw = loadPlaywright();
const { chromium } = pw.default || pw;
const chrome = process.env.CHROME || "/usr/bin/google-chrome";
if (!fs.existsSync(chrome)) {
  console.error("battle foe: chrome not found at " + chrome);
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

async function boot(context, urlOrigin) {
  await context.addInitScript(() => {
    try {
      Object.defineProperty(navigator, "serviceWorker", { configurable: true, get() { return undefined; } });
    } catch (err) {}
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (err) => errors.push(String(err)));
  await page.goto((urlOrigin || origin) + "/index.html?debug=1", { waitUntil: "domcontentloaded" });
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
  const data = SF.BattleFoeData;
  const sprite = SF.game && SF.game.battleFoeSprite;
  if (!data || !data.ids || !sprite || typeof sprite.sheetReady !== "function") return false;
  for (let i = 0; i < data.ids.length; i++) {
    const id = data.ids[i];
    const row = data.foes && data.foes[id];
    if (row && row.ready && !sprite.sheetReady(id)) return false;
  }
  return true;
}, null, { timeout: 8000 });

const POSES = ["idle", "attack", "hurt", "death", "cast"];
const UNREADY = "saltwisp";

const report = await page.evaluate(({ poses, unreadyId }) => {
  const problems = [];
  const data = SF.BattleFoeData;
  if (!data || !Array.isArray(data.ids) || !data.ids.length) problems.push("catalog lists no foes");
  const ids = (data && data.ids) || [];
  const readyIds = [];
  const unreadyIds = [];
  for (let i = 0; i < ids.length; i++) {
    const row = data && data.foes && data.foes[ids[i]];
    if (row && row.ready) readyIds.push(ids[i]);
    else unreadyIds.push(ids[i]);
  }
  const sprite = SF.game && SF.game.battleFoeSprite;
  if (!(sprite instanceof SF.BattleFoeSprite)) problems.push("game.battleFoeSprite is not a BattleFoeSprite");
  if (!sprite) return { problems, readyIds, frames: {} };

  if (sprite._attached) problems.push("BattleFoeSprite was attached before the battle screen");
  let threwEarly = false;
  try { sprite.draw({ drawImage() {} }, readyIds[0], 40, 60, "idle"); } catch (err) { threwEarly = true; }
  if (!threwEarly) problems.push("an unattached BattleFoeSprite did not throw");
  sprite.attach(SF.game);
  if (!sprite._attached || sprite.parent !== SF.game) problems.push("BattleFoeSprite did not attach to the Game root");
  const firstParent = sprite.parent;
  sprite.attach({ register() { problems.push("second attach was not ignored"); } });
  if (sprite.parent !== firstParent) problems.push("second attach changed the parent");

  const kinds = data.kinds || {};
  ["ashmite", "cinderbrute", "maw"].forEach((kind) => {
    const mapped = kinds[kind];
    if (!mapped) problems.push("kinds map missing " + kind);
    else if (!SF.BattleFoeSprite.hasArt(kind)) problems.push(kind + " did not resolve to a ready catalog row");
  });

  if (readyIds.length !== 6) problems.push("ready foe count was " + readyIds.length + ", expected 6");
  if (readyIds.indexOf("sootwing") >= 0) problems.push("sootwing was treated as ready");
  if (unreadyIds.indexOf("sootwing") < 0) problems.push("sootwing was not on the unready list");

  if (SF.BattleFoeSprite.hasArt(unreadyId)) problems.push(unreadyId + " was treated as ready");
  if (sprite.draw({ drawImage() { problems.push(unreadyId + " used drawImage"); } }, unreadyId, 40, 60, "idle") !== false) {
    problems.push(unreadyId + " did not keep today's sprite path");
  }
  unreadyIds.forEach((id) => {
    if (SF.BattleFoeSprite.hasArt(id)) problems.push(id + " unready row was treated as ready");
    if (sprite.draw({ drawImage() { problems.push(id + " used drawImage"); } }, id, 40, 60, "idle") !== false) {
      problems.push(id + " did not keep today's sprite path");
    }
  });

  // Confirm the old BattleGfx path still runs for an unready id, including sootwing.
  function proveOldPath(id) {
    let oldPath = false;
    const art = SF.DrawDeps && SF.DrawDeps.art && SF.DrawDeps.art();
    const prevSprite = art && art.sprite;
    if (art) {
      art.sprite = function () { oldPath = true; if (typeof prevSprite === "function") return prevSprite.apply(this, arguments); };
    }
    const probe = document.createElement("canvas");
    probe.width = 64;
    probe.height = 64;
    const probeCtx = probe.getContext("2d");
    if (SF.BattleGfx && typeof SF.BattleGfx.drawSprite === "function") {
      SF.BattleGfx.drawSprite(probeCtx, id, 32, 60, 2, "idle", "right");
    }
    if (art) art.sprite = prevSprite;
    if (!oldPath) problems.push(id + " did not use today's Art.sprite path");
  }
  proveOldPath(unreadyId);
  proveOldPath("sootwing");

  readyIds.forEach((id) => {
    if (!SF.FOES || !SF.FOES[id]) problems.push(id + " has no SF.FOES row");
    const encs = SF.ENCOUNTERS || {};
    const encIds = Object.keys(encs);
    let encId = null;
    for (let i = 0; i < encIds.length; i++) {
      const foes = encs[encIds[i]].foes || [];
      if (foes.indexOf(id) >= 0) { encId = encIds[i]; break; }
    }
    if (!encId) problems.push(id + " has no real encounter that starts a fight with it through Battle.start");
  });

  // A throwing ready draw must fail closed: log, draw nothing, never Art.sprite.
  (function () {
    const readyId = readyIds[0];
    if (!readyId || !SF.BattleGfx || typeof SF.BattleGfx.drawSprite !== "function") return;
    const prevDraw = sprite.draw;
    const art = SF.DrawDeps && SF.DrawDeps.art && SF.DrawDeps.art();
    const prevSprite = art && art.sprite;
    let artCalled = false;
    sprite.draw = function () { throw new Error("forced ready draw throw"); };
    if (art) art.sprite = function () { artCalled = true; };
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");
    try {
      SF.BattleGfx.drawSprite(ctx, readyId, 16, 28, 2, "idle", "right");
    } catch (err) {
      problems.push("throwing ready draw escaped: " + err);
    }
    if (artCalled) problems.push("throwing ready draw called Art.sprite");
    sprite.draw = prevDraw;
    if (art) art.sprite = prevSprite;
  })();

  const frames = {};
  readyIds.forEach((id) => {
    const row = SF.BattleFoeSprite.entry(id);
    const ver = (row && row.version) || (data && data.version) || "v1";
    const expected = "assets/battle/foes/" + id + "/" + ver + "/" + id + ".png";
    if (!row || row.path !== expected) problems.push(id + " path was " + (row && row.path));
    if (!row || row.kit !== "shardfall/battle/foes/" + id + "/" + ver + "/") {
      problems.push(id + " kit path was " + (row && row.kit));
    }
    if (!sprite.sheetReady(id)) problems.push(id + " sheet did not load");
    if (!SF.BattleFoeSprite.hasArt(id)) problems.push(id + " was not ready");
    const size = sprite.sourceSize(id);
    if (!size || size.w !== row.cell.w || size.h !== row.cell.h || size.ax !== row.pivot.x || size.ay !== row.pivot.y) {
      problems.push(id + " sourceSize did not match the catalog");
    }
    if (sprite.scaleFor(id) !== 2) problems.push(id + " scale was " + sprite.scaleFor(id));
    const cell = row.cell;
    const canvas = document.createElement("canvas");
    canvas.width = cell.w * 2 + 8;
    canvas.height = cell.h * 2 + 8;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    frames[id] = {};
    poses.forEach((pose) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = false;
      const actor = { id: "probe-" + id + "-" + pose };
      let drew = false;
      try { drew = sprite.draw(ctx, id, Math.floor(canvas.width / 2), canvas.height - 4, pose, actor); } catch (err) {
        problems.push(id + " " + pose + " threw: " + err);
        return;
      }
      if (drew !== true) problems.push(id + " " + pose + " did not blit a real frame");
      const pix = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let opaque = 0;
      for (let i = 3; i < pix.length; i += 4) if (pix[i] > 0) opaque += 1;
      frames[id][pose] = opaque;
      if (!(opaque > 0)) problems.push(id + " " + pose + " drew no opaque pixels");
    });
  });

  return { problems, readyIds, unreadyIds, frames };
}, { poses: POSES, unreadyId: UNREADY });

for (const p of report.problems) fail(p);
for (const e of booted.errors.filter((line) => line.indexOf("controller") < 0)) fail("page error: " + e);

await page.evaluate(async () => {
  const frames = (n) => new Promise((resolve) => {
    let left = n;
    function step() { left -= 1; if (left <= 0) resolve(); else requestAnimationFrame(step); }
    requestAnimationFrame(step);
  });
  SF.beginNew();
  let guard = 0;
  while (SF.state.mode === "dialogue" && guard < 400) {
    SF.advanceDialogue();
    const pick = document.querySelector("#dlg-choices button");
    if (pick && SF.state.mode === "dialogue") pick.click();
    guard += 1;
    await frames(2);
  }
});
await page.waitForFunction(() => SF.state && SF.state.mode === "play", null, { timeout: 10000 });

const startReport = await page.evaluate((readyIds) => {
  const problems = [];
  function encounterFor(id) {
    const encs = SF.ENCOUNTERS || {};
    const encIds = Object.keys(encs);
    for (let i = 0; i < encIds.length; i++) {
      const foes = encs[encIds[i]].foes || [];
      if (foes.indexOf(id) >= 0) return encIds[i];
    }
    return null;
  }
  readyIds.forEach((id) => {
    const s = SF.state;
    if (s.battle) {
      s.battle = null;
      s.mode = "play";
      if (SF.game && SF.game.scenes) SF.game.scenes.go("play", s);
    }
    if (!SF.FOES || !SF.FOES[id]) problems.push(id + " has no SF.FOES row");
    const encId = encounterFor(id);
    if (!encId) {
      problems.push(id + " has no real encounter that starts a fight with it through Battle.start");
      return;
    }
    const ok = !!(SF.Battle && SF.Battle.start(encId));
    if (!ok) {
      problems.push(id + " Battle.start(" + encId + ") failed");
      return;
    }
    const actors = (SF.state.battle && SF.state.battle.actors) || [];
    let found = false;
    for (let i = 0; i < actors.length; i++) {
      if (actors[i].side === "foe" && (actors[i].sprite === id || actors[i].key === id)) found = true;
    }
    if (!found) problems.push(id + " was not in the fight started by " + encId);
  });
  return { problems };
}, report.readyIds);

for (const p of startReport.problems) fail(p);

if (!skipPairProof) {
  const eighthId = "oo08_fixture";
  const eighthRoot = fs.mkdtempSync(path.join(os.tmpdir(), "oo08-eighth-"));
  copySite(eighthRoot);
  const dataFile = path.join(eighthRoot, "js/data/battle-foes.js");
  let catalogSrc = fs.readFileSync(dataFile, "utf8");
  catalogSrc = addIdToCatalogSrc(catalogSrc, eighthId);
  catalogSrc = catalogSrc && markReadyInCatalogSrc(catalogSrc, eighthId);
  if (!catalogSrc || catalogSrc.indexOf('"' + eighthId + '"') < 0 || catalogSrc.indexOf(eighthId + ": true") < 0) {
    fail("temp catalog was not patched with " + eighthId);
  } else {
    fs.writeFileSync(dataFile, catalogSrc);
    const donorId = catalogInfo.readyIds.indexOf("brumekin") >= 0 ? "brumekin" : catalogInfo.readyIds[0];
    const destDir = path.join(eighthRoot, "assets/battle/foes/" + eighthId + "/v1");
    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(path.join(eighthRoot, catalogInfo.foePath(donorId)), path.join(destDir, eighthId + ".png"));

    const eighthServer = http.createServer((req, res) => {
      const url = new URL(req.url, "http://127.0.0.1");
      let rel = decodeURIComponent(url.pathname);
      if (rel === "/") rel = "/index.html";
      const file = path.normalize(path.join(eighthRoot, rel));
      if (!file.startsWith(eighthRoot) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
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
    await new Promise((resolve) => eighthServer.listen(0, "127.0.0.1", resolve));
    const eighthOrigin = "http://127.0.0.1:" + eighthServer.address().port;
    const eighthContext = await browser.newContext({
      viewport: { width: 844, height: 390 },
      deviceScaleFactor: 3,
      hasTouch: true,
      isMobile: true
    });
    const eighthBoot = await boot(eighthContext, eighthOrigin);
    await eighthBoot.page.waitForFunction(() => SF.game && SF.game.scenes && SF.game.scenes.current() === "title");
    await eighthBoot.page.waitForFunction((id) => {
      const sprite = SF.game && SF.game.battleFoeSprite;
      return !!(sprite && typeof sprite.sheetReady === "function" && sprite.sheetReady(id));
    }, eighthId, { timeout: 8000 });

    const eighthReport = await eighthBoot.page.evaluate((eighthId) => {
      const problems = [];
      const sprite = SF.game && SF.game.battleFoeSprite;
      if (!(sprite instanceof SF.BattleFoeSprite)) problems.push("eighth boot has no BattleFoeSprite");
      if (!SF.BattleFoeSprite.hasArt(eighthId)) problems.push("eighth id was not ready from the data file");
      const row = SF.BattleFoeSprite.entry(eighthId);
      const ver = (row && row.version) || (SF.BattleFoeData && SF.BattleFoeData.version) || "v1";
      const expected = "assets/battle/foes/" + eighthId + "/" + ver + "/" + eighthId + ".png";
      if (!row || row.path !== expected) problems.push("eighth path was " + (row && row.path));
      if (SF.BattleFoeSprite.IDS.indexOf(eighthId) < 0) problems.push("eighth id was not in the catalog");
      if (sprite && !sprite._attached) sprite.attach(SF.game);
      const canvas = document.createElement("canvas");
      canvas.width = 160;
      canvas.height = 160;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      let drew = false;
      try { drew = sprite.draw(ctx, eighthId, 80, 150, "idle", { id: "eighth-idle" }); } catch (err) {
        problems.push("eighth draw threw: " + err);
      }
      if (drew !== true) problems.push("eighth foe did not blit a real frame");
      const pix = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let opaque = 0;
      for (let i = 3; i < pix.length; i += 4) if (pix[i] > 0) opaque += 1;
      if (!(opaque > 0)) problems.push("eighth foe drew no opaque pixels");
      return { problems, opaque, path: row && row.path };
    }, eighthId);

    for (const p of eighthReport.problems) fail(p);
    for (const e of eighthBoot.errors.filter((line) => line.indexOf("controller") < 0)) fail("eighth page error: " + e);
    await eighthContext.close();
    eighthServer.close();
  }
  try { fs.rmSync(eighthRoot, { recursive: true, force: true }); } catch (err) {}
}

await phone.close();
await browser.close();
server.close();

if (process.exitCode) {
  console.error("battle foe check failed");
  process.exit(process.exitCode);
}
console.log("battle foe check ok, " + catalogInfo.readyIds.length + " ready, " +
  catalogInfo.unreadyIds.length + " unready, eighth-entry ok, precache exact");
