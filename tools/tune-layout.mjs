// Drawer layout at 844x390 and the portrait rotate gate.
// Measures real boxes. A CSS string that mentions 44px is not a pass.
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
  console.error("tune layout: playwright-core is not installed");
  process.exit(1);
}

const pw = loadPlaywright();
const { chromium } = pw.default || pw;
const chrome = process.env.CHROME || "/usr/bin/google-chrome";
if (!fs.existsSync(chrome)) {
  console.error("tune layout: chrome not found at " + chrome);
  process.exit(1);
}

let failed = false;
function fail(msg) {
  console.error("FAIL " + msg);
  failed = true;
}

function inside(box, host, slop) {
  const pad = slop == null ? 1 : slop;
  return box.top >= host.top - pad && box.bottom <= host.bottom + pad &&
    box.left >= host.left - pad && box.right <= host.right + pad;
}

function overlaps(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".tmj": "application/json"
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

async function boot(width, height) {
  const context = await browser.newContext({
    viewport: { width: width, height: height },
    deviceScaleFactor: 1,
    hasTouch: true,
    isMobile: true
  });
  await context.addInitScript(() => {
    const stub = {
      controller: null,
      addEventListener() {},
      removeEventListener() {},
      register() { return Promise.resolve({}); },
      ready: Promise.resolve({ active: null })
    };
    try {
      Object.defineProperty(navigator, "serviceWorker", { configurable: true, get() { return stub; } });
    } catch (err) {}
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (err) => errors.push(String(err)));
  await page.goto(origin + "/index.html?dev=1", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.SF && SF.resize && document.getElementById("tune-toggle"));
  await page.evaluate(() => SF.resize());
  await page.waitForTimeout(60);
  return { context, page, errors };
}

function boxScript() {
  function rect(el) {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      top: r.top, left: r.left, right: r.right, bottom: r.bottom,
      width: r.width, height: r.height,
      display: cs.display, visibility: cs.visibility
    };
  }
  return rect;
}

const land = await boot(844, 390);
if (land.errors.length) fail("844x390 page error " + land.errors[0]);
const page = land.page;
const closed = await page.evaluate(() => {
  function rect(el) {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      top: r.top, left: r.left, right: r.right, bottom: r.bottom,
      width: r.width, height: r.height, display: cs.display
    };
  }
  const toggle = document.getElementById("tune-toggle");
  return {
    view: { top: 0, left: 0, right: innerWidth, bottom: innerHeight, w: innerWidth, h: innerHeight },
    toggle: rect(toggle),
    portrait: document.body.dataset.portrait
  };
});
console.log("tune-layout closed " + JSON.stringify(closed));
if (closed.view.w !== 844 || closed.view.h !== 390) fail("viewport is " + closed.view.w + "x" + closed.view.h);
if (closed.toggle.width < 44 || closed.toggle.height < 44) {
  fail("Tune is " + closed.toggle.width + "x" + closed.toggle.height + ", under 44px");
}
if (!inside(closed.toggle, closed.view, 1)) fail("Tune is outside the viewport " + JSON.stringify(closed.toggle));

await page.click("#tune-toggle");
await page.waitForFunction(() => document.getElementById("tune-drawer") && !document.getElementById("tune-drawer").hidden);
await page.evaluate(() => {
  if (SF.state) SF.state.mode = "play";
  document.body.dataset.touch = "1";
  document.body.dataset.mode = "play";
  if (SF.syncUI) SF.syncUI();
});

const open = await page.evaluate(() => {
  function rect(el) {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      top: r.top, left: r.left, right: r.right, bottom: r.bottom,
      width: r.width, height: r.height, display: cs.display, overflow: cs.overflowY
    };
  }
  const drawer = document.getElementById("tune-drawer");
  const panel = document.getElementById("tune-panel-feel");
  const ranges = Array.from(document.querySelectorAll("#tune-fields input[type=range]"));
  return {
    view: { top: 0, left: 0, right: innerWidth, bottom: innerHeight },
    drawer: rect(drawer),
    panel: rect(panel),
    scroll: panel ? { client: panel.clientHeight, scroll: panel.scrollHeight, top: panel.scrollTop } : null,
    ranges: ranges.map((el) => rect(el)),
    stick: rect(document.getElementById("stick")),
    dash: rect(document.getElementById("btn-dash")),
    interact: rect(document.getElementById("btn-interact")),
    hp: rect(document.getElementById("hp")),
    map: rect(document.getElementById("mapwrap"))
  };
});
console.log("tune-layout open " + JSON.stringify(open));
if (!open.drawer || open.drawer.display === "none") fail("drawer did not open");
if (!inside(open.drawer, open.view, 1)) fail("drawer is outside the viewport " + JSON.stringify(open.drawer));
if (!open.panel || !inside(open.panel, open.drawer, 1)) fail("feel panel is outside the drawer " + JSON.stringify(open.panel));
if (!(open.scroll && open.scroll.scroll > open.scroll.client + 2)) {
  fail("feel panel does not scroll (" + JSON.stringify(open.scroll) + ")");
}
const leaks = await page.evaluate(() => {
  const drawer = document.getElementById("tune-drawer").getBoundingClientRect();
  const ranges = Array.from(document.querySelectorAll("#tune-fields input[type=range]"));
  const hits = [];
  ranges.forEach((el, i) => {
    const r = el.getBoundingClientRect();
    const x = Math.round((r.left + r.right) / 2);
    const y = Math.round(drawer.bottom + 8);
    if (r.bottom <= drawer.bottom + 1) return;
    const hit = document.elementFromPoint(x, y);
    hits.push({
      i: i,
      x: x,
      y: y,
      id: hit ? (hit.id || hit.className || hit.tagName) : "none",
      paints: !!(hit && (hit === el || el.contains(hit) || hit.closest("#tune-fields")))
    });
  });
  return hits;
});
console.log("tune-layout clip " + JSON.stringify(leaks));
leaks.forEach((hit) => {
  if (hit.paints) fail("slider " + hit.i + " paints outside the drawer at " + hit.x + "," + hit.y + " (" + hit.id + ")");
});
if (!leaks.length) fail("no slider extended past the drawer, so clipping was not measured");

["stick", "dash", "interact", "hp", "map"].forEach((key) => {
  if (!open[key] || open[key].width < 1 || open[key].height < 1) {
    fail("#" + key + " has no box in play, so overlap was not measured " + JSON.stringify(open[key]));
    return;
  }
  if (overlaps(open.drawer, open[key])) {
    fail("drawer overlaps #" + key + " " + JSON.stringify(open[key]));
  }
});

const shotDir = process.env.TUNE_SHOTS;
if (shotDir) {
  fs.mkdirSync(shotDir, { recursive: true });
  await page.screenshot({ path: path.join(shotDir, "drawer-open-844x390.png") });
}

const scrolled = await page.evaluate(() => {
  function rect(el) {
    const r = el.getBoundingClientRect();
    return { top: r.top, left: r.left, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
  }
  const panel = document.getElementById("tune-panel-feel");
  const drawer = document.getElementById("tune-drawer");
  const ranges = Array.from(document.querySelectorAll("#tune-fields input[type=range]"));
  const placed = [];
  ranges.forEach((el, i) => {
    const pr = panel.getBoundingClientRect();
    const er = el.getBoundingClientRect();
    panel.scrollTop += er.top - pr.top - (panel.clientHeight - el.offsetHeight) / 2;
    placed.push({ i: i, box: rect(el) });
  });
  panel.scrollTop = panel.scrollHeight;
  const copy = document.getElementById("tune-copy");
  const reset = document.getElementById("tune-reset");
  return {
    view: { top: 0, left: 0, right: innerWidth, bottom: innerHeight },
    drawer: rect(drawer),
    panel: rect(panel),
    ranges: placed,
    copy: rect(copy),
    reset: rect(reset),
    scrollTop: panel.scrollTop,
    scrollHeight: panel.scrollHeight,
    clientHeight: panel.clientHeight
  };
});
console.log("tune-layout scrolled " + JSON.stringify(scrolled));
scrolled.ranges.forEach((row) => {
  if (!inside(row.box, scrolled.drawer, 2)) {
    fail("slider " + row.i + " is outside the drawer " + JSON.stringify(row.box));
  }
  if (!inside(row.box, scrolled.view, 2)) {
    fail("slider " + row.i + " is outside the viewport " + JSON.stringify(row.box));
  }
  if (row.box.height < 44) fail("slider " + row.i + " is " + row.box.height + "px tall");
});
if (shotDir) {
  await page.screenshot({ path: path.join(shotDir, "drawer-scrolled-844x390.png") });
}

["copy", "reset"].forEach((key) => {
  const box = scrolled[key];
  if (box.height < 44) fail(key + " is " + box.height + "px tall");
  if (!inside(box, scrolled.view, 1)) fail(key + " is outside the viewport " + JSON.stringify(box));
  if (!inside(box, scrolled.drawer, 1)) fail(key + " is outside the drawer " + JSON.stringify(box));
  if (!inside(box, scrolled.panel, 1)) fail(key + " is outside the feel scrollport " + JSON.stringify(box));
});

await land.context.close();

const port = await boot(390, 844);
if (port.errors.length) fail("390x844 page error " + port.errors[0]);
const gate = await port.page.evaluate(() => {
  function info(id) {
    const el = document.getElementById(id);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      display: cs.display, visibility: cs.visibility,
      width: r.width, height: r.height, top: r.top, left: r.left
    };
  }
  return {
    portrait: document.body.dataset.portrait,
    view: { w: innerWidth, h: innerHeight },
    rotate: info("rotate"),
    toggle: info("tune-toggle"),
    drawer: info("tune-drawer")
  };
});
console.log("tune-layout portrait " + JSON.stringify(gate));
if (shotDir) {
  await port.page.screenshot({ path: path.join(shotDir, "portrait-390x844.png") });
}
if (gate.portrait !== "1") fail("portrait dataset is " + gate.portrait);
if (!gate.rotate || gate.rotate.display !== "flex") fail("rotate gate display is " + (gate.rotate && gate.rotate.display));
if (gate.rotate.width < 380 || gate.rotate.height < 800) {
  fail("rotate gate box is " + gate.rotate.width + "x" + gate.rotate.height);
}
if (!gate.toggle || gate.toggle.display !== "none") fail("Tune is visible in portrait " + JSON.stringify(gate.toggle));
if (!gate.drawer || gate.drawer.display !== "none") fail("drawer is visible in portrait " + JSON.stringify(gate.drawer));

await port.context.close();
await browser.close();
server.close();

if (failed) {
  console.error("tune layout failed");
  process.exit(1);
}
console.log("tune layout ok");
