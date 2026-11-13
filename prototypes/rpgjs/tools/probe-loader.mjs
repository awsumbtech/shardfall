// Ask the installed @canvasengine/tiled parser what it does with the tmj,
// with an embedded-tileset TMX, and with the generated external-tileset TMX.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { TiledParser } from "@canvasengine/tiled";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const tiledPkg = require("@canvasengine/tiled/package.json");
const clientBundle = readFileSync(join(root, "node_modules/@rpgjs/tiledmap/dist/client/index8.js"), "utf8");

function walk(layers, visit, depth = 0) {
  for (const layer of layers || []) {
    visit(layer, depth);
    if (layer.layers) walk(layer.layers, visit, depth + 1);
    if (layer.type === "group" && layer.layers) continue;
  }
}

function flat(layers) {
  const out = [];
  walk(layers, (layer) => out.push(layer));
  return out;
}

function propMap(properties) {
  if (!properties) return {};
  if (Array.isArray(properties)) {
    const out = {};
    for (const prop of properties) out[prop.name] = prop.value;
    return out;
  }
  return properties;
}

function sum(data) {
  if (!Array.isArray(data)) return null;
  let total = 0;
  for (const value of data) total += value | 0;
  return total;
}

function tryParse(label, xml) {
  try {
    const parsed = new TiledParser(xml).parseMap();
    return { label, ok: true, parsed };
  } catch (error) {
    return {
      label,
      ok: false,
      error: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
    };
  }
}

const tmjText = readFileSync(join(root, "maps", "emberhold.tmj"), "utf8");
const tmj = JSON.parse(tmjText);
const tmjAttempt = tryParse("emberhold.tmj", tmjText);

const embedded = `<?xml version="1.0" encoding="UTF-8"?>
<map version="1.10" orientation="orthogonal" renderorder="right-down" width="1" height="1" tilewidth="16" tileheight="16">
 <tileset firstgid="1" name="meta" tilewidth="16" tileheight="16" tilecount="1" columns="1">
  <image source="images/meta-tiles.png" width="16" height="16"/>
 </tileset>
 <layer id="1" name="ground" width="1" height="1">
  <data encoding="csv">1</data>
 </layer>
</map>`;
const embeddedAttempt = tryParse("embedded-tileset.tmx", embedded);

const tmxText = readFileSync(join(root, "src", "tiled", "emberhold-full.tmx"), "utf8");
const tmxAttempt = tryParse("emberhold-full.tmx", tmxText);
const playText = readFileSync(join(root, "src", "tiled", "emberhold.tmx"), "utf8");
const playAttempt = tryParse("emberhold.tmx", playText);
const manifest = JSON.parse(readFileSync(join(root, "src", "tiled", "manifest.json"), "utf8"));

const tmjLayers = flat(tmj.layers);
const tsxReports = [];
if (tmxAttempt.ok) {
  for (const tileset of tmxAttempt.parsed.tilesets || []) {
    const source = tileset.source;
    if (!source) {
      tsxReports.push({ source: null, ok: false, error: "no external source; the RPG-JS client fetch would fail" });
      continue;
    }
    const file = join(root, "src", "tiled", source);
    try {
      const parsedTileset = new TiledParser(readFileSync(file, "utf8")).parseTileset();
      const image = parsedTileset.image?.source || null;
      tsxReports.push({
        source,
        ok: true,
        name: parsedTileset.name,
        tilecount: parsedTileset.tilecount,
        columns: parsedTileset.columns,
        image,
        imageExists: image ? existsSync(join(root, "src", "tiled", image)) : false,
        tileTypes: (parsedTileset.tiles || []).map((tile) => tile.type).filter(Boolean),
      });
    } catch (error) {
      tsxReports.push({
        source,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

const report = {
  packages: {
    tiledParser: `${tiledPkg.name}@${tiledPkg.version}`,
    rpgjsClientFetch: clientBundle.includes(".tmx") ? "hardcoded .tmx" : "no .tmx literal",
    fetchesTmj: clientBundle.includes(".tmj"),
    externalTilesetLoop: clientBundle.includes("tileset.source"),
  },
  tmj: tmjAttempt.ok ? { ok: true } : { ok: false, error: tmjAttempt.error },
  embeddedTileset: embeddedAttempt.ok ? {
    ok: true,
    tilesetKeys: Object.keys(embeddedAttempt.parsed.tilesets?.[0] || {}),
    source: embeddedAttempt.parsed.tilesets?.[0]?.source ?? null,
    image: embeddedAttempt.parsed.tilesets?.[0]?.image?.source ?? null,
    loaderWouldFetchSource: Boolean(embeddedAttempt.parsed.tilesets?.[0]?.source),
  } : { ok: false, error: embeddedAttempt.error },
  tmx: null,
  playable: playAttempt.ok ? {
    ok: true,
    bytes: playText.length,
    tilesets: (playAttempt.parsed.tilesets || []).map((tileset) => tileset.source || tileset.name),
    layerCount: flat(playAttempt.parsed.layers).length,
  } : { ok: false, error: playAttempt.error },
  fidelity: null,
  tilesetFiles: tsxReports,
  images: manifest.tilesets.map((tileset) => ({
    name: tileset.name,
    original: tileset.original,
    servedAs: tileset.image,
    fileExists: existsSync(join(root, "src", "tiled", tileset.image)),
  })),
};

if (tmxAttempt.ok) {
  const parsed = tmxAttempt.parsed;
  const parsedLayers = flat(parsed.layers);
  const byName = new Map(parsedLayers.map((layer) => [layer.name, layer]));
  const layerDiffs = [];
  for (const layer of tmjLayers) {
    const got = byName.get(layer.name);
    if (!got) {
      layerDiffs.push({ name: layer.name, problem: "missing after parse" });
      continue;
    }
    const problems = [];
    if ((got.type === "tilelayer" ? "tilelayer" : got.type) !== layer.type && !(layer.type === "tilelayer" && got.type === "tilelayer")) {
      problems.push(`type ${layer.type} -> ${got.type}`);
    }
    if (Boolean(layer.visible) !== Boolean(got.visible)) problems.push(`visible ${layer.visible} -> ${got.visible}`);
    if (layer.type === "tilelayer") {
      if (sum(layer.data) !== sum(got.data)) problems.push(`gid sum ${sum(layer.data)} -> ${sum(got.data)}`);
      if ((layer.data || []).length !== (got.data || []).length) problems.push(`cell count ${(layer.data || []).length} -> ${(got.data || []).length}`);
    }
    const wantProps = propMap(layer.properties);
    const gotProps = propMap(got.properties);
    const wantKeys = Object.keys(wantProps).sort();
    const gotKeys = Object.keys(gotProps).sort();
    if (wantKeys.join() !== gotKeys.join()) problems.push(`props [${wantKeys}] -> [${gotKeys}]`);
    else {
      for (const key of wantKeys) {
        if (String(wantProps[key]) !== String(gotProps[key])) problems.push(`prop ${key} ${wantProps[key]} -> ${gotProps[key]}`);
      }
    }
    if (layer.type === "objectgroup") {
      const wantNames = (layer.objects || []).map((obj) => obj.name).join(",");
      const gotNames = (got.objects || []).map((obj) => obj.name).join(",");
      if (wantNames !== gotNames) problems.push("object names differ");
      const wantPoints = (layer.objects || []).filter((obj) => obj.point).length;
      const gotPoints = (got.objects || []).filter((obj) => obj.point).length;
      if (wantPoints !== gotPoints) problems.push(`points ${wantPoints} -> ${gotPoints}`);
    }
    if (problems.length) layerDiffs.push({ name: layer.name, type: layer.type, problems });
  }
  const maren = parsedLayers
    .filter((layer) => layer.type === "objectgroup")
    .flatMap((layer) => layer.objects || [])
    .find((obj) => obj.name === "maren");
  report.tmx = {
    ok: true,
    bytes: tmxText.length,
    width: parsed.width,
    height: parsed.height,
    tilewidth: parsed.tilewidth,
    tileheight: parsed.tileheight,
    tilesets: (parsed.tilesets || []).map((tileset) => ({
      firstgid: tileset.firstgid,
      source: tileset.source || null,
      name: tileset.name || null,
    })),
    layerCount: parsedLayers.length,
    mapProperties: propMap(parsed.properties),
    maren: maren ? { x: maren.x, y: maren.y, type: maren.type, point: maren.point === true } : null,
  };
  report.fidelity = {
    tmjLayers: tmjLayers.length,
    parsedLayers: parsedLayers.length,
    diffs: layerDiffs,
  };
} else {
  report.tmx = { ok: false, error: tmxAttempt.error };
}

writeFileSync(join(root, "loader-report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify({
  tmj: report.tmj,
  embedded: report.embeddedTileset,
  tmx: report.tmx && { ok: report.tmx.ok, layers: report.tmx.layerCount, error: report.tmx.error },
  diffs: report.fidelity ? report.fidelity.diffs.length : null,
}, null, 2));
