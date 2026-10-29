// One job: run the packer from the command line. It does not talk to the network.
import fs from "node:fs";
import path from "node:path";
import { ConfigReader } from "./config-reader.js";
import { FrameExtractor } from "./frame-extractor.js";
import { Packer } from "./packer.js";
import { AtlasWriter } from "./atlas-writer.js";

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  if (i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--")) return process.argv[i + 1];
  return fallback;
}

function die(msg) {
  console.error("atlas: " + msg);
  process.exit(1);
}

function inside(root, file) {
  const rel = path.relative(root, file);
  return rel !== "" && !rel.startsWith(".." + path.sep) && rel !== ".." && !path.isAbsolute(rel);
}

const configPath = arg("--config", "art/atlas.config.json");
const assets = arg("--assets", process.env.ASSETS_DIR || "");
const outDir = arg("--out", "assets/atlas");
let shuffle = null;
if (process.argv.includes("--shuffle")) shuffle = true;
if (process.argv.includes("--no-shuffle")) shuffle = false;

if (!assets) die("set ASSETS_DIR or pass --assets");
const assetsRoot = path.resolve(assets);
if (!fs.existsSync(assetsRoot) || !fs.statSync(assetsRoot).isDirectory()) {
  die("assets dir not found: " + assets);
}

let config;
try {
  config = ConfigReader.fromFile(configPath);
} catch (err) {
  die(err.message);
}
if (shuffle != null) config.shuffle = shuffle;

let requests;
try {
  requests = config.frames();
} catch (err) {
  die(err.message);
}

const extractor = new FrameExtractor(config.extrude);
const packed = [];
const sources = [];
try {
  for (let i = 0; i < requests.length; i++) {
    const req = requests[i];
    const file = path.resolve(assetsRoot, req.file);
    if (!inside(assetsRoot, file)) die("path escapes the assets dir: " + req.file);
    if (!fs.existsSync(file)) die("missing " + req.file + " for " + req.key);
    const cut = extractor.cut(file, req);
    if (!sources.includes(cut.source)) sources.push(cut.source);
    packed.push({
      key: req.key,
      name: req.name,
      code: req.code,
      anchor: req.anchor,
      order: req.order,
      file: req.file,
      w: cut.w,
      h: cut.h,
      cut
    });
  }
  const packer = new Packer({
    padding: config.padding,
    maxSize: config.maxSize,
    shuffle: config.shuffle,
    seed: config.seed
  });
  const pages = packer.pack(packed);
  const writer = new AtlasWriter(outDir, "assets/atlas");
  const manifest = writer.write(pages, sources);
  const names = fs.readdirSync(outDir);
  for (let i = 0; i < names.length; i++) {
    if (names[i] === "manifest.json" || /^field-\d+\.png$/.test(names[i])) continue;
    die("unexpected file in atlas output: " + names[i]);
  }
  console.log("atlas: " + manifest.entries.length + " keys, " + pages.length + " images -> " + outDir);
} catch (err) {
  die(err.message || String(err));
}
