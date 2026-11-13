#!/usr/bin/env node
// Checks a GitHub Pages _site tree:
//   1. Every assets/ui file the game loads is present and non-empty.
//   2. Nothing under assets/ other than assets/ui/ and assets/atlas/ was published.
// Kenmi source art stays private. Atlas files come from the packer, not this tree.
//
//   node tools/check-site.mjs --assemble --workflow
//     Assemble a local _site the same way the Pages workflow does, then check it.
//   node tools/check-site.mjs --site _site
//     Inspect an existing _site directory (used in CI after assembly).
//   node tools/check-site.mjs --site _site --workflow
//     Also assert pages.yml still copies assets/ui/ and runs this check.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REQUIRED = [
  "assets/ui/choicebox-panel.png",
  "assets/ui/choice-cursor.png"
];
const ALLOWED_ASSET_DIRS = ["assets/ui", "assets/atlas"];
const ASSET_REF = /(?:["'`])(assets\/ui\/[^"'`\s?]+)/g;
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

function fail(message) {
  console.error("check-site: " + message);
  process.exitCode = 1;
}

function parseArgs(argv) {
  const opts = { site: null, assemble: false, workflow: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--assemble") opts.assemble = true;
    else if (arg === "--workflow") opts.workflow = true;
    else if (arg === "--site") {
      opts.site = argv[++i];
      if (!opts.site) {
        fail("--site needs a directory");
        process.exit(1);
      }
    } else if (arg === "--help" || arg === "-h") {
      opts.help = true;
    } else {
      fail("unknown argument " + arg);
      process.exit(1);
    }
  }
  return opts;
}

function walkFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, acc);
    else if (entry.isFile()) acc.push(full);
  }
  return acc;
}

function collectGameUiAssets() {
  const found = new Set(REQUIRED);
  const roots = [
    path.join(ROOT, "js"),
    path.join(ROOT, "css"),
    path.join(ROOT, "index.html"),
    path.join(ROOT, "sw.js")
  ];
  const files = [];
  for (const start of roots) {
    const stat = fs.statSync(start);
    if (stat.isDirectory()) walkFiles(start, files);
    else files.push(start);
  }
  for (const file of files) {
    if (!/\.(js|css|html|mjs)$/.test(file) && path.basename(file) !== "sw.js") continue;
    const text = fs.readFileSync(file, "utf8");
    ASSET_REF.lastIndex = 0;
    let match;
    while ((match = ASSET_REF.exec(text))) found.add(match[1]);
  }
  return [...found].sort();
}

function assembleSite(dest) {
  // Mirrors the "Assemble site" step in .github/workflows/pages.yml.
  // Does not pack private atlases; those land in assets/atlas/ later in CI.
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });
  for (const file of ["index.html", "sw.js", "manifest.webmanifest"]) {
    fs.copyFileSync(path.join(ROOT, file), path.join(dest, file));
  }
  for (const dir of ["css", "js", "icons"]) {
    fs.cpSync(path.join(ROOT, dir), path.join(dest, dir), { recursive: true });
  }
  const uiSrc = path.join(ROOT, "assets", "ui");
  const uiDest = path.join(dest, "assets", "ui");
  if (!fs.existsSync(uiSrc)) {
    fail("source assets/ui/ is missing; cannot assemble the site");
    return;
  }
  fs.mkdirSync(uiDest, { recursive: true });
  fs.cpSync(uiSrc, uiDest, { recursive: true });
  console.log("check-site: assembled " + dest);
}

function checkSite(dest) {
  const site = path.resolve(dest);
  if (!fs.existsSync(site) || !fs.statSync(site).isDirectory()) {
    fail("site directory is missing: " + dest);
    return;
  }

  const needed = collectGameUiAssets();
  console.log("check-site: game UI assets: " + needed.join(", "));
  for (const rel of needed) {
    const file = path.join(site, rel);
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
      fail("missing published file " + rel);
      continue;
    }
    const stat = fs.statSync(file);
    if (stat.size <= 0) {
      fail("published file is empty " + rel);
      continue;
    }
    if (rel.endsWith(".png")) {
      const fd = fs.openSync(file, "r");
      const buf = Buffer.alloc(4);
      fs.readSync(fd, buf, 0, 4, 0);
      fs.closeSync(fd);
      if (!buf.equals(PNG_MAGIC)) fail("published file is not a PNG " + rel);
    }
    console.log("check-site: ok " + rel + " (" + stat.size + " bytes)");
  }

  const assetsRoot = path.join(site, "assets");
  if (fs.existsSync(assetsRoot)) {
    const published = walkFiles(assetsRoot);
    for (const file of published) {
      const rel = path.relative(site, file).split(path.sep).join("/");
      const allowed = ALLOWED_ASSET_DIRS.some((dir) => rel === dir || rel.startsWith(dir + "/"));
      if (!allowed) fail("published asset outside assets/ui/ and assets/atlas/: " + rel);
    }
    for (const entry of fs.readdirSync(assetsRoot, { withFileTypes: true })) {
      const rel = "assets/" + entry.name;
      if (entry.isDirectory() && !ALLOWED_ASSET_DIRS.includes(rel)) {
        fail("published asset folder outside assets/ui/ and assets/atlas/: " + rel);
      }
      if (entry.isFile()) fail("published asset outside assets/ui/ and assets/atlas/: " + rel);
    }
  }
}

function checkWorkflow() {
  const file = path.join(ROOT, ".github/workflows/pages.yml");
  if (!fs.existsSync(file)) {
    fail("missing .github/workflows/pages.yml");
    return;
  }
  const yaml = fs.readFileSync(file, "utf8");
  if (!/mkdir -p _site\/assets\/ui/.test(yaml) || !/cp -r assets\/ui\/\. _site\/assets\/ui\//.test(yaml)) {
    fail("pages.yml Assemble site does not copy assets/ui/ into _site/assets/ui/");
  } else {
    console.log("check-site: pages.yml copies assets/ui/");
  }
  // The copy must not be a broader assets/ copy that would publish Kenmi art.
  const copyLines = yaml.split("\n").filter((line) => /cp\s/.test(line) && /assets/.test(line));
  for (const line of copyLines) {
    if (/assets\/ui/.test(line)) continue;
    if (/assets\/atlas/.test(line)) continue;
    if (/--assets/.test(line)) continue; // packer input, not a site copy
    fail("pages.yml copies more of assets/ than assets/ui/: " + line.trim());
  }
  if (!/node tools\/check-site\.mjs/.test(yaml)) {
    fail("pages.yml does not run tools/check-site.mjs after assembly");
  } else {
    console.log("check-site: pages.yml runs tools/check-site.mjs");
  }
}

function main() {
  process.chdir(ROOT);
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log("Usage: node tools/check-site.mjs [--assemble] [--site DIR] [--workflow]");
    return;
  }
  const dest = opts.site ? path.resolve(opts.site) : path.join(ROOT, "_site");
  if (opts.assemble) assembleSite(dest);
  else if (!opts.site && !opts.workflow) {
    fail("pass --assemble, --site DIR, and/or --workflow");
    process.exit(1);
  }
  if (opts.assemble || opts.site) checkSite(dest);
  if (opts.workflow) checkWorkflow();
  if (process.exitCode) {
    console.error("check-site: FAIL");
    process.exit(process.exitCode);
  }
  console.log("check-site: PASS");
}

main();
