// Settings on a short sideways phone: the dialog stays inside the viewport,
// and every control sits inside the sheet's scroll area (title and Close stay put).
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
  console.error("menu fit: playwright-core is not installed");
  process.exit(1);
}

const pw = loadPlaywright();
const { chromium } = pw.default || pw;
const chrome = process.env.CHROME || "/usr/bin/google-chrome";
if (!fs.existsSync(chrome)) {
  console.error("menu fit: chrome not found at " + chrome);
  process.exit(1);
}

const css = fs.readFileSync(path.join(root, "css/style.css"), "utf8");
const jsFiles = [
  "js/draw.js",
  "js/grapple.js",
  "js/art/gallery.js",
  "js/art/scenes.js",
  "js/battle/draw.js"
];
let failed = false;
function fail(msg) {
  console.error("FAIL " + msg);
  failed = true;
}

if (/,\s*serif\b/.test(css)) fail("a CSS font stack still ends with generic serif");
jsFiles.forEach((file) => {
  const src = fs.readFileSync(path.join(root, file), "utf8");
  if (/,\s*serif\b/.test(src)) fail(file + " still ends a font stack with generic serif");
});

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

function inside(box, host, slop) {
  const pad = slop == null ? 1 : slop;
  return box.top >= host.top - pad && box.bottom <= host.bottom + pad &&
    box.left >= host.left - pad && box.right <= host.right + pad;
}

async function boot(width, height) {
  const context = await browser.newContext({
    viewport: { width: width, height: height },
    deviceScaleFactor: 1,
    hasTouch: width < 1100,
    isMobile: width < 1100
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
  await page.goto(origin + "/index.html", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.SF && SF.state && SF.resize);
  await page.evaluate(() => SF.resize());
  await page.waitForTimeout(80);
  return { context, page, errors };
}

const sizes = [[844, 390], [915, 412], [390, 844], [375, 667], [1440, 900]];

for (const [width, height] of sizes) {
  const session = await boot(width, height);
  const page = session.page;
  if (session.errors.length) fail(width + "x" + height + " page error " + session.errors[0]);
  await page.evaluate(() => {
    document.getElementById("settings").hidden = false;
    const scroll = document.querySelector("#settings .menu-scroll");
    if (scroll) scroll.scrollTop = 0;
    if (SF.markScrollers) SF.markScrollers();
  });
  const report = await page.evaluate(() => {
    function rect(el) {
      const r = el.getBoundingClientRect();
      return { top: r.top, left: r.left, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
    }
    const card = document.querySelector("#settings .card");
    const scroll = document.querySelector("#settings .menu-scroll");
    const controls = Array.from(scroll.querySelectorAll("button, input, label, p"));
    return {
      view: { top: 0, left: 0, right: window.innerWidth, bottom: window.innerHeight },
      card: rect(card),
      scroll: rect(scroll),
      scrollGap: scroll.scrollHeight - scroll.clientHeight,
      controls: controls.map((el) => ({
        id: el.id || el.className || el.tagName,
        box: rect(el)
      })),
      fonts: {
        title: getComputedStyle(document.querySelector("h1")).fontFamily,
        tag: getComputedStyle(document.querySelector(".tag")).fontFamily,
        rotate: getComputedStyle(document.querySelector("#rotate")).fontFamily,
        button: getComputedStyle(document.querySelector("#newgame")).fontFamily
      }
    };
  });
  const label = width + "x" + height;
  if (!inside(report.card, report.view, 1)) {
    fail(label + " settings dialog is outside the viewport " + JSON.stringify(report.card));
  }
  if (width === 844 && height === 390) {
    report.controls.forEach((control) => {
      if (!inside(control.box, report.scroll, 1)) {
        fail("844x390 " + control.id + " is outside the settings scroll area");
      }
    });
    if (report.scrollGap > 2) {
      fail("844x390 settings still scrolls (" + report.scrollGap + "px) with a control cut off");
    }
    const fonts = report.fonts;
    ["title", "tag", "rotate"].forEach((key) => {
      if (/,\s*serif\s*$/.test(fonts[key]) || fonts[key] === "serif") {
        fail(key + " font stack still ends with generic serif: " + fonts[key]);
      }
    });
    const rendered = await page.evaluate(() => {
      function widthOf(family, size) {
        const ctx = document.createElement("canvas").getContext("2d");
        ctx.font = size + " " + family;
        return ctx.measureText("Shardfall sideways").width;
      }
      const size = "46px";
      const title = getComputedStyle(document.querySelector("h1")).fontFamily;
      const button = getComputedStyle(document.querySelector("#newgame")).fontFamily;
      const tag = getComputedStyle(document.querySelector(".tag")).fontFamily;
      const rotate = getComputedStyle(document.querySelector("#rotate")).fontFamily;
      return {
        title: widthOf(title, size),
        tag: widthOf(tag, size),
        rotate: widthOf(rotate, size),
        button: widthOf(button, size),
        generic: widthOf("serif", size)
      };
    });
    ["title", "tag", "rotate"].forEach((key) => {
      const matchesSerif = Math.abs(rendered[key] - rendered.generic) < 0.6;
      const matchesButtons = Math.abs(rendered[key] - rendered.button) < 0.6;
      if (matchesSerif && !matchesButtons) fail(key + " still renders a generic serif");
    });
  }
  await session.context.close();
}

if (failed) {
  await browser.close();
  server.close();
  process.exit(1);
}

await browser.close();
server.close();
console.log("menu fit ok");
