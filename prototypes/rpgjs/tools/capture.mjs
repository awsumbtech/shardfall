// Drive the built spike in headless Chrome and save the requested screenshots.
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import puppeteer from "puppeteer-core";

const base = process.env.SPIKE_URL || "http://127.0.0.1:4173/";
const out = process.env.SPIKE_SHOTS || "/tmp/rpgjs-shots";
mkdirSync(out, { recursive: true });

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
  console.log(`shot ${name} ${JSON.stringify(state)}`);
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
  console.log(prefix, "loaded", loaded);
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
    console.log(prefix, "walk", name, before.x, before.y, "->", after.x, after.y);
  }

  await hold(page, "ArrowUp", 220);
  await new Promise((resolve) => setTimeout(resolve, 160));
  const choices = await openChoices(page);
  console.log(prefix, "choices", choices);
  await shot(page, `${prefix}_npc_choice.png`);
  await clickChoice(page, "Keep this place");
  await waitNote(page, (state) => state.note === "saved", 8000);
  const saved = await readout(page);
  console.log(prefix, "saved", saved);
  await page.evaluate(() => document.querySelector(".rpg-ui-close-button")?.click());
  await new Promise((resolve) => setTimeout(resolve, 300));
  await page.evaluate(() => {
    const keyboard = window.__engine.activeKeyboardControls().keyboard;
    keyboard.applyKeyDown("down");
    window.setTimeout(() => keyboard.applyKeyUp("down"), 280);
  });
  await new Promise((resolve) => setTimeout(resolve, 500));
  const moved = await readout(page);
  console.log(prefix, "after save walk", moved);
  if (moved.y === saved.y && moved.x === saved.x) {
    throw new Error("player did not move after save");
  }
  await page.evaluate(async () => {
    const keyboard = window.__engine.activeKeyboardControls().keyboard;
    const yOf = () => {
      const sprite = Object.values(window.__engine.sceneMap.players())[0];
      return Math.round(typeof sprite.y === "function" ? sprite.y() : sprite.y);
    };
    keyboard.applyKeyDown("up");
    const start = Date.now();
    while (yOf() > 306 && Date.now() - start < 2000) {
      await new Promise((resolve) => setTimeout(resolve, 40));
    }
    keyboard.applyKeyUp("up");
  });
  await openChoices(page);
  await clickChoice(page, "Return to the kept place");
  const restored = await waitNote(page, (state) => {
    return state.note === "loaded" && (state.y === saved.keptY || state.serverY === saved.keptY);
  }, 8000);
  console.log(prefix, "restored", restored);
  await new Promise((resolve) => setTimeout(resolve, 500));
  await shot(page, `${prefix}_save_load.png`);
  await browser.close();
}

const landscape = { width: 844, height: 390, deviceScaleFactor: 1 };
const portrait = { width: 390, height: 844, deviceScaleFactor: 1 };
await run(landscape, "landscape_844x390");
await run(portrait, "portrait_390x844");
console.log("shots in", out);
