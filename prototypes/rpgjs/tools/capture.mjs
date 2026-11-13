// Drive the built spike in headless Chrome and save the requested screenshots.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const base = process.env.SPIKE_URL || "http://127.0.0.1:4173/";
const out = process.env.SPIKE_SHOTS || join(dirname(fileURLToPath(import.meta.url)), "..", "evidence");
mkdirSync(out, { recursive: true });

const runs = [];
const lines = [];
function logLine(...parts) {
  const line = parts.map((part) => (typeof part === "string" ? part : JSON.stringify(part))).join(" ");
  lines.push(line);
  console.log(line);
}

const chrome = process.env.CHROME || "/usr/bin/google-chrome-stable";

function logPage(page, label) {
  page.on("console", (msg) => {
    const text = msg.text();
    if (msg.type() === "error" || msg.type() === "warning") console.log(`[${label} ${msg.type()}] ${text}`);
  });
  page.on("pageerror", (error) => console.log(`[${label} pageerror] ${error.message}`));
  page.on("requestfailed", (request) => {
    const url = request.url();
    if (url.includes("missing/") || url.includes("wayfarer") || url.includes("npc-maren") || url.includes(".tmx") || url.includes(".tsx")) {
      console.log(`[${label} failed] ${request.failure()?.errorText} ${url}`);
    }
  });
  page.on("response", (response) => {
    const url = response.url();
    if (response.status() >= 400 && (url.includes("/map/") || url.includes("wayfarer") || url.includes("npc-maren"))) {
      console.log(`[${label} ${response.status()}] ${url}`);
    }
  });
}

async function wayfarerView(page, viewport) {
  return page.evaluate((view) => {
    const root = window.__engine?.canvasApp?.stage;
    if (!root) return { present: false, drawn: false, reason: "no stage" };
    let match = null;
    const walk = (node) => {
      if (!node || match) return;
      const width = node.texture?.width || 0;
      const height = node.texture?.height || 0;
      if (node.label === "Sprite" && width === 112 && height === 112) match = node;
      (node.children || []).forEach(walk);
    };
    walk(root);
    if (!match) return { present: false, drawn: false, reason: "no 112 sprite" };
    const bounds = match.getBounds();
    const box = {
      x: Math.round(bounds.x),
      y: Math.round(bounds.y),
      w: Math.round(bounds.width),
      h: Math.round(bounds.height),
    };
    const onScreen = box.w > 0 && box.h > 0
      && box.x < view.width && box.y < view.height
      && box.x + box.w > 0 && box.y + box.h > 0;
    let ancestorHidden = false;
    let node = match;
    while (node) {
      if (node.visible === false || node.renderable === false) ancestorHidden = true;
      node = node.parent;
    }
    const sprite = Object.values(window.__engine.sceneMap?.players?.() || {})[0];
    const graphics = sprite && (typeof sprite.graphics === "function" ? sprite.graphics() : sprite.graphics);
    return {
      present: true,
      sheet: 112,
      graphics: graphics || null,
      box,
      onScreen,
      ancestorHidden,
      drawn: !ancestorHidden && onScreen && match.alpha > 0,
    };
  }, viewport);
}

async function clientPos(page) {
  return page.evaluate(() => {
    const sprites = window.__engine?.sceneMap?.players?.() || {};
    const sprite = Object.values(sprites)[0];
    if (!sprite) return null;
    const num = (value) => (typeof value === "function" ? value() : value);
    const x = num(sprite.x);
    const y = num(sprite.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    return { x, y };
  });
}

async function readout(page) {
  return page.$eval("#readout", (el) => ({
    text: el.textContent,
    x: el.dataset.x,
    y: el.dataset.y,
    serverX: el.dataset.serverX,
    serverY: el.dataset.serverY,
    keptX: el.dataset.keptX,
    keptY: el.dataset.keptY,
    note: el.dataset.note,
  }));
}

async function dismissDialog(page) {
  for (let i = 0; i < 3; i += 1) {
    const open = await page.$(".rpg-ui-dialog");
    if (!open) return;
    await page.keyboard.press("Enter");
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
}

async function waitNote(page, pred, ms = 15000) {
  const start = Date.now();
  let last = null;
  while (Date.now() - start < ms) {
    last = await readout(page);
    if (pred(last)) return last;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`timeout waiting for readout, last ${JSON.stringify(last)}`);
}

async function shot(page, name) {
  const file = join(out, name);
  await page.screenshot({ path: file });
  const state = await readout(page);
  logLine(`shot ${name} ${JSON.stringify(state)}`);
  return file;
}

async function hold(page, key, ms) {
  await page.keyboard.down(key);
  await new Promise((resolve) => setTimeout(resolve, ms));
  await page.keyboard.up(key);
}

async function openChoices(page) {
  await page.evaluate(() => window.__engine.processAction({ action: "action" }));
  await page.waitForSelector(".rpg-ui-dialog", { timeout: 4000 });
  await new Promise((resolve) => setTimeout(resolve, 350));
  let count = await page.$$eval(".rpg-ui-dialog-choice", (nodes) => nodes.length);
  if (count < 3) {
    await page.keyboard.press("Enter");
    await new Promise((resolve) => setTimeout(resolve, 400));
    count = await page.$$eval(".rpg-ui-dialog-choice", (nodes) => nodes.length);
  }
  if (count < 3) {
    const text = await page.evaluate(() => document.body.innerText.replace(/\s+/g, " ").slice(0, 400));
    throw new Error(`choices did not open. body: ${text}`);
  }
  return count;
}

async function clickChoice(page, valueText) {
  const clicked = await page.evaluate((needle) => {
    const el = [...document.querySelectorAll(".rpg-ui-dialog-choice")].find((node) => (node.textContent || "").includes(needle));
    if (!el) return "";
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    return el.textContent || "";
  }, valueText);
  if (!clicked) throw new Error(`choice not found: ${valueText}`);
  return clicked;
}

async function run(viewport, prefix) {
  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-webgl",
    ],
  });
  const page = await browser.newPage();
  try {
  logPage(page, prefix);
  await page.setViewport(viewport);
  await page.goto(base, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.evaluate(() => localStorage.removeItem("shardfall-rpgjs-spike"));
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => {
    const engine = window.__engine;
    if (!engine || !engine.activeKeyboardControls) return false;
    const controls = engine.activeKeyboardControls();
    return !!controls;
  }, { timeout: 15000 });
  const loaded = await waitNote(page, (state) => state.note === "map" || (state.note || "").startsWith("map error"));
  logLine(prefix, "loaded", loaded);
  await page.click("canvas");
  await shot(page, `${prefix}_map_loaded.png`);

  const directions = [
    ["ArrowDown", "s"],
    ["ArrowRight", "e"],
    ["ArrowLeft", "w"],
    ["ArrowUp", "n"],
  ];
  for (const [key, name] of directions) {
    const before = await readout(page);
    await page.keyboard.down(key);
    await new Promise((resolve) => setTimeout(resolve, 160));
    await shot(page, `${prefix}_walk_${name}.png`);
    await page.keyboard.up(key);
    await new Promise((resolve) => setTimeout(resolve, 140));
    const after = await readout(page);
    logLine(prefix, "walk", name, before.x, before.y, "->", after.x, after.y);
  }

  await hold(page, "ArrowUp", 220);
  await new Promise((resolve) => setTimeout(resolve, 160));
  const choices = await openChoices(page);
  logLine(prefix, "choices", choices);
  await shot(page, `${prefix}_npc_choice.png`);
  await clickChoice(page, "Keep this place");
  await waitNote(page, (state) => state.note === "saved", 8000);
  const savedReadout = await readout(page);
  const savedPos = await clientPos(page);
  logLine(prefix, "saved", { readout: savedReadout, client: savedPos });
  if (!savedPos) throw new Error(`${prefix} had no client sprite at save`);
  await page.evaluate(() => document.querySelector(".rpg-ui-close-button")?.click());
  await dismissDialog(page);

  // Leave the saved spot. Do not walk back before Load: that made the old
  // check pass while the client was already next to the saved y.
  await page.evaluate(() => {
    window.__engine.activeKeyboardControls().keyboard.applyKeyDown("down");
  });
  const walkStart = Date.now();
  let awayPos = await clientPos(page);
  while ((!awayPos || Math.abs(awayPos.y - savedPos.y) < 48) && Date.now() - walkStart < 5000) {
    await new Promise((resolve) => setTimeout(resolve, 50));
    awayPos = await clientPos(page);
  }
  await page.evaluate(() => {
    window.__engine.activeKeyboardControls().keyboard.applyKeyUp("down");
  });
  await new Promise((resolve) => setTimeout(resolve, 250));
  awayPos = await clientPos(page);
  const awayDy = awayPos ? Math.abs(awayPos.y - savedPos.y) : 0;
  logLine(prefix, "walked away", { savedY: savedPos.y, away: awayPos, clientDy: awayDy });
  if (!awayPos || awayDy < 48) {
    runs.push({ viewport: prefix, saved: savedPos, away: awayPos, awayDy, restored: null, restoreDy: null, loadOk: false, pass: false });
    throw new Error(`${prefix} client y did not move 48px: saved ${savedPos.y}, away ${awayPos ? awayPos.y : "none"}, dy ${awayDy}`);
  }

  const awayReadout = await readout(page);
  // Direct player.load. Maren's "Return to the kept place" choice is not clicked.
  const loadResult = await page.evaluate(async () => {
    const player = window.__spike?.player;
    if (!player || typeof player.load !== "function") return { ok: false, error: "no player.load" };
    const loaded = await player.load(0, { reason: "load", source: "capture" }, { changeMap: true });
    return { ok: !!(loaded && loaded.ok), via: "player.load" };
  });
  const restoreStart = Date.now();
  let restoredPos = null;
  while (Date.now() - restoreStart < 3000) {
    restoredPos = await clientPos(page);
    if (restoredPos && Math.abs(restoredPos.y - savedPos.y) <= 2) break;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  const restoreDy = restoredPos ? Math.abs(restoredPos.y - savedPos.y) : null;
  const positionPass = restoreDy != null && restoreDy <= 2;
  const afterReadout = await readout(page);
  const view = await wayfarerView(page, viewport);
  const pass = positionPass && view.drawn === true;
  const record = {
    viewport: prefix,
    saved: savedPos,
    savedServerY: Number(savedReadout.serverY),
    away: awayPos,
    awayDy,
    awayServerY: Number(awayReadout.serverY),
    restored: restoredPos,
    restoreDy,
    afterServerY: Number(afterReadout.serverY),
    loadOk: loadResult.ok,
    loadVia: loadResult.via,
    wayfarer: view,
    positionPass,
    pass,
  };
  runs.push(record);
  logLine(prefix, "after load", record);
  await new Promise((resolve) => setTimeout(resolve, 400));
  await shot(page, `${prefix}_save_load.png`);
  if (!view.drawn) {
    throw new Error(`${prefix} Wayfarer is not drawn after load: ${JSON.stringify(view)}`);
  }
  if (!positionPass) {
    throw new Error(`${prefix} load did not restore client y within 2px: saved ${savedPos.y}, away ${awayPos.y} (dy ${awayDy}), after load ${restoredPos ? restoredPos.y : "none"} (dy ${restoreDy}), loadOk ${loadResult.ok}`);
  }
  } finally {
    await browser.close();
  }
}

async function captureFullMap() {
  const full = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "dist", "map", "emberhold-full.tmx"));
  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl"],
  });
  const page = await browser.newPage();
  const misses = [];
  page.on("response", (response) => {
    const url = response.url();
    if (response.status() >= 400 && url.includes("/map/")) misses.push(`${response.status()} ${url}`);
  });
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    if (request.url().includes("/map/emberhold.tmx")) {
      request.respond({ status: 200, contentType: "application/xml", body: full });
      return;
    }
    request.continue();
  });
  await page.setViewport(landscape);
  await page.goto(base, { waitUntil: "domcontentloaded", timeout: 30000 });
  await new Promise((resolve) => setTimeout(resolve, 2500));
  await shot(page, "landscape_844x390_full_map_missing_kenmi.png");
  logLine("full map misses", misses.slice(0, 6));
  await browser.close();
}

const landscape = { width: 844, height: 390, deviceScaleFactor: 1 };
const portrait = { width: 390, height: 844, deviceScaleFactor: 1 };
const failures = [];
try {
  await captureFullMap();
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
  logLine("full map FAILED", error instanceof Error ? error.message : String(error));
}
for (const [viewport, prefix] of [[landscape, "landscape_844x390"], [portrait, "portrait_390x844"]]) {
  try {
    await run(viewport, prefix);
  } catch (error) {
    failures.push(error instanceof Error ? error.message : String(error));
    logLine(prefix, "FAILED", error instanceof Error ? error.message : String(error));
  }
}
const log = { runs, failures };
writeFileSync(join(out, "capture-log.json"), `${JSON.stringify(log, null, 2)}\n`);
writeFileSync(join(out, "capture-log.txt"), `${lines.join("\n")}\n`);
logLine("shots in", out);
if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
