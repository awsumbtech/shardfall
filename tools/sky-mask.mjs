// Atlas-loaded sky mask. Node cannot read the packed frames, so this
// opens the game in Chrome and counts walkable pixels against the mask.
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
    try { return require(name); } catch (err) { /* next */ }
  }
  console.error("sky mask: playwright-core is not installed");
  process.exit(1);
}

if (!fs.existsSync(path.join(root, "assets/atlas/manifest.json"))) {
  console.error("sky mask: assets/atlas/manifest.json is not on disk");
  process.exit(1);
}

const pw = loadPlaywright();
const { chromium } = pw.default || pw;
const chrome = process.env.CHROME || "/usr/bin/google-chrome";
if (!fs.existsSync(chrome)) {
  console.error("sky mask: chrome not found at " + chrome);
  process.exit(1);
}

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml"
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

const browser = await chromium.launch({
  executablePath: chrome,
  args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"]
});
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (err) => errors.push(String(err)));
await page.goto(origin + "/index.html?debug=1", { waitUntil: "domcontentloaded" });
try {
  await page.waitForFunction(() => {
    return window.SF && SF.worldSource === "tiles" && SF.tileMap && SF.tileMap._skyMask;
  }, { timeout: 30000 });
} catch (err) {
  console.error("sky mask: atlas did not build the mask");
  if (errors.length) console.error(errors.join("\n"));
  await browser.close();
  server.close();
  process.exit(1);
}

const report = await page.evaluate(() => {
  const SF = window.SF;
  const map = SF.tileMap;
  const mask = map._skyMask;
  const limit = SF.SKY_ALPHA;
  const painted = new Uint8Array(mask.alpha.length);
  let ai;
  for (ai = 0; ai < painted.length; ai++) if (mask.alpha[ai] > limit) painted[ai] = 1;
  const grown = SF.growSkyMask(painted, mask.w, mask.h);
  let onSky = 0;
  let near = 0;
  let cornerNear = 0;
  let cornerOn = 0;
  const tx0 = 79 * mask.tile;
  const ty0 = 90 * mask.tile;
  const tx1 = tx0 + mask.tile;
  const ty1 = ty0 + mask.tile;
  let y, x, i, px, py, bridge, bad, corner;
  for (y = 0; y < mask.h; y++) {
    for (x = 0; x < mask.w; x++) {
      i = y * mask.w + x;
      px = x + 0.5;
      py = y + 0.5;
      bridge = map.onBridge(px, py);
      bad = bridge ? grown.near3[i] === 1 : grown.near5[i] === 1;
      if (!bad && painted[i]) continue;
      if (!SF.walkable(px, py)) continue;
      if (!painted[i]) onSky += 1;
      if (bad) near += 1;
      corner = x >= tx0 && x < tx1 && y >= ty0 && y < ty1;
      if (corner && !painted[i]) cornerOn += 1;
      if (corner && bad) cornerNear += 1;
    }
  }
  function shoreGap(name, inland) {
    const mark = map.markers.find((m) => m.name === name);
    const a = mark ? [mark.x, mark.y] : inland;
    const step = 4;
    const box = [1200, 0, 2500, 1200];
    const x0 = box[0];
    const y0 = box[1];
    const cols = Math.ceil((box[2] - x0) / step);
    const rows = Math.ceil((box[3] - y0) / step);
    const open = new Uint8Array(cols * rows);
    let yy, xx, r, c;
    for (yy = y0, r = 0; yy < box[3]; yy += step, r++) {
      for (xx = x0, c = 0; xx < box[2]; xx += step, c++) {
        if (SF.walkable(xx, yy)) open[r * cols + c] = 1;
      }
    }
    const comp = new Int16Array(open.length);
    comp.fill(-1);
    function flood(sx, sy, id) {
      const c0 = Math.floor((sx - x0) / step);
      const r0 = Math.floor((sy - y0) / step);
      if (c0 < 0 || r0 < 0 || c0 >= cols || r0 >= rows) return false;
      const start = r0 * cols + c0;
      if (!open[start]) return false;
      const q = [start];
      comp[start] = id;
      let qi, i2, cc, rr, k, j;
      for (qi = 0; qi < q.length; qi++) {
        i2 = q[qi];
        cc = i2 % cols;
        rr = (i2 / cols) | 0;
        const nb = [i2 + 1, i2 - 1, i2 + cols, i2 - cols];
        for (k = 0; k < 4; k++) {
          j = nb[k];
          if (j < 0 || j >= open.length) continue;
          if (Math.abs((j % cols) - cc) > 1) continue;
          if (!open[j] || comp[j] >= 0) continue;
          comp[j] = id;
          q.push(j);
        }
      }
      return true;
    }
    if (!flood(a[0], a[1], 1) || !flood(inland[0], inland[1], 2)) return null;
    const e1 = [];
    const e2 = [];
    let ei, ec, er;
    for (ei = 0; ei < open.length; ei++) {
      if (comp[ei] < 0) continue;
      ec = ei % cols;
      er = (ei / cols) | 0;
      const edge = ec === 0 || er === 0 || ec === cols - 1 || er === rows - 1 ||
        comp[ei - 1] !== comp[ei] || comp[ei + 1] !== comp[ei] || comp[ei - cols] !== comp[ei] || comp[ei + cols] !== comp[ei];
      if (!edge) continue;
      (comp[ei] === 1 ? e1 : e2).push(x0 + ec * step, y0 + er * step);
    }
    let best = Infinity;
    let p, q, dx, dy, d;
    for (p = 0; p < e1.length; p += 2) {
      for (q = 0; q < e2.length; q += 2) {
        dx = e1[p] - e2[q];
        dy = e1[p + 1] - e2[q + 1];
        if (dx > 200 || dx < -200 || dy > 200 || dy < -200) continue;
        d = Math.hypot(dx, dy);
        if (d > 0 && d < best) best = d;
      }
    }
    return best;
  }
  return {
    onSky: onSky,
    near: near,
    cornerOn: cornerOn,
    cornerNear: cornerNear,
    alpha: limit,
    clear: SF.SKY_CLEAR,
    reach: SF.DASH_REACH,
    longStep: SF.DASH_REACH * SF.LONGSTEP,
    shard: SF.DASH_REACH_PLUS,
    hook: shoreGap("shard-hook", [1848, 680]),
    cinder: shoreGap("shard-alcove", [1880, 296]),
    step: shoreGap("shard-step", [2040, 888])
  };
});

console.log("sky mask " + JSON.stringify(report));
let failed = false;
if (errors.length) {
  console.error(errors.join("\n"));
  failed = true;
}
if (report.onSky !== 0 || report.near !== 0) {
  console.error("FAIL walkable pixels sit within sky clearance: on sky " + report.onSky + ", near " + report.near);
  failed = true;
}
if (report.cornerOn !== 0 || report.cornerNear !== 0) {
  console.error("FAIL corner tile 79,90 still meets sky: on " + report.cornerOn + ", near " + report.cornerNear);
  failed = true;
}
await browser.close();
server.close();
process.exit(failed ? 1 : 0);
