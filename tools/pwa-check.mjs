// Installability check for the /shardfall/ subpath.
// Serves the static game, then asks Chrome (CDP Page.getInstallabilityErrors)
// whether the manifest, icons, and service worker qualify, and reloads offline.
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const PREFIX = "/shardfall";
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml"
};

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, "http://127.0.0.1");
      let pathname = decodeURIComponent(url.pathname);
      if (pathname === PREFIX) pathname = PREFIX + "/";
      if (!pathname.startsWith(PREFIX + "/")) {
        res.writeHead(404);
        res.end("not found");
        return;
      }
      let rel = pathname.slice(PREFIX.length + 1);
      if (rel === "") rel = "index.html";
      const file = path.normalize(path.join(root, rel));
      if (!file.startsWith(root) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("missing " + rel);
        return;
      }
      const ext = path.extname(file);
      res.writeHead(200, {
        "Content-Type": TYPES[ext] || "application/octet-stream",
        "Cache-Control": "no-cache"
      });
      fs.createReadStream(file).pipe(res);
    });
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

const server = await startServer();
const port = server.address().port;
const origin = "http://127.0.0.1:" + port + PREFIX + "/";
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "shardfall-chrome-"));
const context = await chromium.launchPersistentContext(profile, {
  channel: "chrome",
  args: ["--allow-insecure-localhost"]
});

const report = { origin, errors: null, manifest: null, offline: null };
try {
  const page = context.pages()[0] || await context.newPage();
  const client = await context.newCDPSession(page);
  const failed = [];
  page.on("requestfailed", (req) => failed.push(req.url() + " " + req.failure().errorText));
  page.on("console", (msg) => {
    if (msg.type() === "error") failed.push("console: " + msg.text());
  });

  await page.goto(origin, { waitUntil: "networkidle" });
  await page.waitForFunction(async () => {
    if (!("serviceWorker" in navigator)) return false;
    const reg = await navigator.serviceWorker.ready;
    return !!(reg && reg.active && navigator.serviceWorker.controller);
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForFunction(() => navigator.serviceWorker.controller != null);

  const parsed = await client.send("Page.getAppManifest");
  report.resolved = parsed.manifest || parsed.parsed || null;
  let install = null;
  for (let i = 0; i < 8; i++) {
    install = await client.send("Page.getInstallabilityErrors");
    const list = install.installabilityErrors || install.errors || [];
    if (!list.length) break;
    await page.waitForTimeout(400);
  }
  report.manifestErrors = parsed.errors || [];
  report.parsed = parsed.data ? JSON.parse(parsed.data) : null;
  report.manifestUrl = parsed.url;
  report.errors = install.installabilityErrors || install.errors || install;
  report.scope = await page.evaluate(() => navigator.serviceWorker.controller && navigator.serviceWorker.controller.scriptURL);
  report.installButton = await page.evaluate(() => {
    if (window.SF && SF.state) {
      SF.state.mode = "play";
      if (SF.openFieldMenu) SF.openFieldMenu();
    }
    const body = document.getElementById("field-body");
    const more = body && [...body.querySelectorAll("button")].find((b) => b.textContent === "More");
    if (more) more.click();
    const installBtn = body && [...body.querySelectorAll("button")].find((b) => b.textContent === "Install");
    if (installBtn) installBtn.click();
    const note = document.getElementById("field-note");
    return {
      hasInstall: !!installBtn,
      note: note ? note.textContent : "",
      menu: document.getElementById("field-title") ? document.getElementById("field-title").textContent : ""
    };
  });

  await context.setOffline(true);
  const offlineNav = await page.evaluate(async () => {
    const res = await fetch("index.html");
    const main = await fetch("js/main.js");
    const text = await main.text();
    return { index: res.status, main: main.status, hasBoot: text.includes("SF.boot") };
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  report.offline = {
    fetch: offlineNav,
    title: await page.title(),
    canvas: await page.locator("#view").count(),
    controlled: await page.evaluate(() => !!(navigator.serviceWorker.controller))
  };
  report.requestFailures = failed.filter((line) => !line.includes("net::ERR_INTERNET_DISCONNECTED") && !line.includes("Failed to fetch"));
} finally {
  await context.close();
  await new Promise((resolve) => server.close(resolve));
  fs.rmSync(profile, { recursive: true, force: true });
}

console.log(JSON.stringify(report, null, 2));
const errors = Array.isArray(report.errors) ? report.errors : [];
if (errors.length) process.exit(1);
if (!report.offline || report.offline.title !== "Shardfall" || !report.offline.controlled || !report.offline.fetch.hasBoot) {
  process.exit(1);
}
if (!report.installButton || !report.installButton.hasInstall) process.exit(1);
