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

let failed = false;
function fail(msg) {
  console.error("FAIL " + msg);
  failed = true;
}

function fontStackProblems(file, src) {
  const problems = [];
  src.split("\n").forEach((line, i) => {
    if (!/font-family|ctx\.font|\.font\s*=/.test(line)) return;
    const masked = line.replace(/sans-serif/g, "SANSSERIF").replace(/--serif/g, "SERIFVAR");
    if (/\bserif\b/.test(masked) || /\bTimes(?: New Roman)?\b/.test(line)) {
      problems.push(file + ":" + (i + 1) + " " + line.trim());
    }
  });
  return problems;
}

function collectSources(dir, acc) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) collectSources(full, acc);
    else if (/\.(css|js|mjs|html)$/.test(name)) acc.push(full);
  }
  return acc;
}

const sources = collectSources(path.join(root, "css"), [])
  .concat(collectSources(path.join(root, "js"), []))
  .concat([path.join(root, "index.html")]);
sources.forEach((file) => {
  const problems = fontStackProblems(path.relative(root, file), fs.readFileSync(file, "utf8"));
  problems.forEach((line) => fail("font stack has a bare serif or Times: " + line));
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
    const sheetFonts = await page.evaluate(() => {
      function lastGeneric(family) {
        const parts = [];
        let cur = "";
        let quote = "";
        for (let i = 0; i < family.length; i++) {
          const ch = family[i];
          if (quote) {
            if (ch === quote) quote = "";
            else cur += ch;
            continue;
          }
          if (ch === '"' || ch === "'") { quote = ch; continue; }
          if (ch === ",") { parts.push(cur.trim()); cur = ""; continue; }
          cur += ch;
        }
        parts.push(cur.trim());
        return (parts[parts.length - 1] || "").toLowerCase();
      }
      function visibleText(root, label) {
        const found = [];
        let seen = 0;
        if (!root) return { seen: 0, found: [label + " is missing"] };
        const list = [root].concat(Array.from(root.querySelectorAll("*")));
        list.forEach((el) => {
          if (el.closest("[hidden]")) return;
          const cs = getComputedStyle(el);
          if (cs.display === "none" || cs.visibility === "hidden" || Number(cs.opacity) === 0) return;
          if (!el.getClientRects().length) return;
          let text = "";
          el.childNodes.forEach((node) => { if (node.nodeType === 3) text += node.textContent; });
          text = text.replace(/\s+/g, " ").trim();
          if (!text) return;
          seen += 1;
          if (lastGeneric(cs.fontFamily) === "serif") {
            found.push(label + " " + (el.id || el.className || el.tagName) + ' "' + text.slice(0, 40) + '" ' + cs.fontFamily);
          }
        });
        if (!seen) found.push(label + " had no visible text");
        return { seen: seen, found: found };
      }
      function press(label) {
        const btn = Array.from(document.querySelectorAll("#field-body button")).find((el) => el.textContent.trim() === label);
        if (!btn) return false;
        btn.click();
        return true;
      }
      const bad = [];
      const counts = [];
      function take(root, label) {
        const result = visibleText(root, label);
        counts.push(label + ":" + result.seen);
        bad.push.apply(bad, result.found);
      }
      document.getElementById("settings").hidden = true;
      SF.uiModal = null;
      SF.state.mode = "title";
      SF.syncUI();
      take(document.body, "title");
      document.getElementById("settings").hidden = false;
      take(document.getElementById("settings"), "settings");
      document.getElementById("settings").hidden = true;
      SF.state.mode = "pause";
      SF.syncUI();
      take(document.getElementById("pause"), "pause");
      SF.state.mode = "title";
      SF.syncUI();
      SF.openNews();
      take(document.getElementById("modal"), "news");
      SF.closeModal();
      SF.state.mode = "play";
      SF.syncUI();
      SF.openFieldMenu();
      take(document.getElementById("fieldmenu"), "field:root");
      ["Party", "Items", "Equip", "Skills", "More"].forEach((label) => {
        if (!press(label)) bad.push("field missing " + label);
        else take(document.getElementById("fieldmenu"), "field:" + label);
        const back = document.getElementById("field-back");
        if (back) back.click();
      });
      if (press("More") && press("Hints")) take(document.getElementById("fieldmenu"), "field:Hints");
      else bad.push("field missing Hints");
      return { bad: bad, counts: counts };
    });
    sheetFonts.bad.forEach((line) => fail(line));
    if (!sheetFonts.counts.some((line) => line.indexOf("settings:") === 0 && !line.endsWith(":0"))) {
      fail("settings font walk did not see the sheet");
    }
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
