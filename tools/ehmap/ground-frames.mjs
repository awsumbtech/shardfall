// One job: list the atlas frames the committed Emberhold map actually uses.
// It reads tile indices only. It does not open Kenmi sheets.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "..", "..");
const mapPath = path.join(repo, "js/content/maps/emberhold.tmj");
const configPath = path.join(repo, "art/atlas.config.json");

function sheetKey(name) {
  if (name === "kenmi-fx") return "ground.fx";
  if (name === "meta") return null;
  if (name.startsWith("kenmi-")) return "kenmi.tile." + name.slice("kenmi-".length);
  return null;
}

function dimOf(tileset) {
  const props = tileset.properties || [];
  for (let i = 0; i < props.length; i++) {
    if (props[i].name === "dim") return Number(props[i].value);
  }
  return null;
}

function usedGids(doc) {
  const used = new Set();
  function walk(layers) {
    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      if (layer.type === "group") walk(layer.layers || []);
        else if (layer.type === "tilelayer" && layer.name !== "collision" && layer.name !== "height" && layer.name !== "paths") {
        const data = layer.data || [];
        for (let g = 0; g < data.length; g++) {
          const gid = data[g] & 0x1fffffff;
          if (gid) used.add(gid);
        }
      }
    }
  }
  walk(doc.layers || []);
  return used;
}

export function groundEntries(doc) {
  const used = usedGids(doc);
  const tilesets = (doc.tilesets || []).slice().sort((a, b) => a.firstgid - b.firstgid);
  const groups = new Map();
  for (let i = 0; i < tilesets.length; i++) {
    const tileset = tilesets[i];
    const key = sheetKey(tileset.name);
    if (!key) continue;
    const cols = tileset.columns;
    const first = tileset.firstgid;
    const last = first + tileset.tilecount;
    for (const gid of used) {
      if (gid < first || gid >= last) continue;
      const local = gid - first;
      const c = local % cols;
      const r = (local / cols) | 0;
      const x = c * tileset.tilewidth;
      const y = r * tileset.tileheight;
      if (x + tileset.tilewidth > tileset.imagewidth || y + tileset.tileheight > tileset.imageheight) {
        throw new Error(tileset.name + " gid " + gid + " is outside the sheet");
      }
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          path: tileset.image,
          code: "ground",
          rects: [],
          dim: dimOf(tileset)
        });
      }
      groups.get(key).rects.push({
        name: "r" + r + "c" + c,
        x, y,
        w: tileset.tilewidth,
        h: tileset.tileheight
      });
    }
  }
  const entries = [];
  for (const entry of groups.values()) {
    entry.rects.sort((a, b) => (a.y - b.y) || (a.x - b.x) || a.name.localeCompare(b.name));
    if (entry.dim == null) delete entry.dim;
    entries.push(entry);
  }
  entries.sort((a, b) => a.key.localeCompare(b.key));
  return entries;
}

function main() {
  const doc = JSON.parse(fs.readFileSync(mapPath, "utf8"));
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const heroes = (config.entries || []).filter((entry) => entry.key && entry.key.startsWith("kenmi.hero."));
  config.description = "Field atlas. Hero keys are the paper doll. Ground keys are the Emberhold tile map, packed only for cells the map uses. volcanoDim frames are Volcano_Tiles darkened by the dim factor.";
  config.entries = heroes.concat(groundEntries(doc));
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n");
  const n = config.entries.reduce((sum, entry) => sum + (entry.rects ? entry.rects.length : 0), 0);
  console.log("ground frames " + n + " across " + (config.entries.length - heroes.length) + " sheets");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
