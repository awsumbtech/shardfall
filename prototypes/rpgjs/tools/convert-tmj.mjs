// Turn js/content/maps/emberhold.tmj into the TMX + external TSX files
// @rpgjs/tiledmap actually fetches. The tmj stays the source. This does not
// invent tiles, collision flags, or height. Missing Kenmi images stay missing.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const tmjPath = join(root, "maps", "emberhold.tmj");
const tiledDir = join(root, "src", "tiled");
const tilesetDir = join(tiledDir, "tilesets");
const doc = JSON.parse(readFileSync(tmjPath, "utf8"));

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function imageSlot(tileset) {
  if (tileset.image === "art/fx-tiles.png") {
    return { file: "images/fx-tiles.png", present: true };
  }
  if (tileset.image === "art/meta-tiles.png") {
    return { file: "images/meta-tiles.png", present: true };
  }
  return { file: `images/missing/${tileset.name}.png`, present: false };
}

function propsXml(properties, indent) {
  if (!properties || !properties.length) return "";
  const rows = properties.map((prop) => {
    const type = prop.type || "string";
    return `${indent}  <property name="${esc(prop.name)}" type="${esc(type)}" value="${esc(prop.value)}"/>`;
  });
  return `${indent}<properties>\n${rows.join("\n")}\n${indent}</properties>\n`;
}

function csv(data, width) {
  // A newline with no comma in front of it is deleted by the XML parser and
  // glues two gids into one number. A comma before the break stays a separator
  // whether or not the newline survives. The last row has no trailing comma,
  // so a final empty cell is not invented.
  const lines = [];
  const height = Math.floor(data.length / width);
  for (let y = 0; y < height; y += 1) {
    const row = [];
    for (let x = 0; x < width; x += 1) row.push(data[y * width + x] | 0);
    lines.push(row.join(",") + (y === height - 1 ? "" : ","));
  }
  return lines.join("\n");
}

function objectXml(obj, indent) {
  const attrs = [
    `id="${obj.id}"`,
    obj.name ? `name="${esc(obj.name)}"` : "",
    obj.type ? `type="${esc(obj.type)}"` : "",
    `x="${obj.x}"`,
    `y="${obj.y}"`,
  ];
  if (!obj.point) {
    attrs.push(`width="${obj.width || 0}"`, `height="${obj.height || 0}"`);
  }
  const open = `${indent}<object ${attrs.filter(Boolean).join(" ")}>`;
  const inner = [
    propsXml(obj.properties, indent + " "),
    obj.point ? `${indent}  <point/>\n` : "",
  ].join("");
  return `${open}\n${inner}${indent}</object>`;
}

function layerXml(layer, indent) {
  const visible = layer.visible === false ? "0" : "1";
  if (layer.type === "group") {
    const children = (layer.layers || []).map((child) => layerXml(child, indent + " ")).join("\n");
    return `${indent}<group id="${layer.id}" name="${esc(layer.name)}" visible="${visible}">\n${propsXml(layer.properties, indent + " ")}${children}\n${indent}</group>`;
  }
  if (layer.type === "objectgroup") {
    const objects = (layer.objects || []).map((obj) => objectXml(obj, indent + " ")).join("\n");
    return `${indent}<objectgroup id="${layer.id}" name="${esc(layer.name)}" visible="${visible}">\n${propsXml(layer.properties, indent + " ")}${objects}\n${indent}</objectgroup>`;
  }
  if (layer.type !== "tilelayer") return "";
  const body = csv(layer.data || [], layer.width);
  return `${indent}<layer id="${layer.id}" name="${esc(layer.name)}" width="${layer.width}" height="${layer.height}" visible="${visible}">\n${propsXml(layer.properties, indent + " ")}${indent} <data encoding="csv">\n${body}\n${indent} </data>\n${indent}</layer>`;
}

rmSync(tilesetDir, { recursive: true, force: true });
mkdirSync(tilesetDir, { recursive: true });

const manifestTilesets = doc.tilesets.map((tileset) => {
  const slot = imageSlot(tileset);
  return {
    name: tileset.name,
    firstgid: tileset.firstgid,
    tilecount: tileset.tilecount,
    columns: tileset.columns,
    lastgid: tileset.firstgid + tileset.tilecount - 1,
    tsx: `tilesets/${tileset.name}.tsx`,
    image: slot.file,
    original: tileset.image,
    present: slot.present,
  };
});

function writeTilesets(list) {
  const tags = [];
  for (const tileset of doc.tilesets) {
    const meta = list.find((item) => item.name === tileset.name);
    if (!meta) continue;
    const tileTags = (tileset.tiles || []).map((tile) => {
      const type = tile.type ? ` type="${esc(tile.type)}"` : "";
      const props = propsXml(tile.properties, "  ");
      if (!props) return ` <tile id="${tile.id}"${type}/>`;
      return ` <tile id="${tile.id}"${type}>\n${props} </tile>`;
    }).join("\n");
    const tsx = `<?xml version="1.0" encoding="UTF-8"?>
<tileset version="1.10" tiledversion="${esc(doc.tiledversion || "")}" name="${esc(tileset.name)}" tilewidth="${tileset.tilewidth}" tileheight="${tileset.tileheight}" tilecount="${tileset.tilecount}" columns="${tileset.columns}">
 <image source="${esc(meta.image)}" width="${tileset.imagewidth}" height="${tileset.imageheight}"/>
${tileTags}
</tileset>
`;
    writeFileSync(join(tilesetDir, `${tileset.name}.tsx`), tsx);
    tags.push(` <tileset firstgid="${tileset.firstgid}" source="tilesets/${tileset.name}.tsx"/>`);
  }
  return tags;
}

function mapXml(tilesetTags, dropMissing) {
  const missing = manifestTilesets.filter((tileset) => !tileset.present);
  const sourceLayers = dropMissing ? stripMissing(doc.layers, missing) : doc.layers;
  return `<?xml version="1.0" encoding="UTF-8"?>
<map version="1.10" tiledversion="${esc(doc.tiledversion || "")}" orientation="${esc(doc.orientation)}" renderorder="${esc(doc.renderorder)}" width="${doc.width}" height="${doc.height}" tilewidth="${doc.tilewidth}" tileheight="${doc.tileheight}" infinite="0" nextlayerid="${doc.nextlayerid}" nextobjectid="${doc.nextobjectid}">
${propsXml(doc.properties, " ")}
${tilesetTags.join("\n")}
${sourceLayers.map((layer) => layerXml(layer, " ")).join("\n")}
</map>
`;
}

function stripMissing(layers, missing) {
  const kept = [];
  for (const layer of layers) {
    if (layer.type === "group") {
      const children = stripMissing(layer.layers || [], missing);
      if (children.length) kept.push({ ...layer, layers: children });
      continue;
    }
    if (layer.type === "objectgroup") {
      // RPG-JS draws players and events inside every object layer, and it
      // hides that whole layer when Tiled marks it invisible. Markers is the
      // layer that holds Maren. One visible copy is enough; the other object
      // layers would stack extra copies of the same sprites.
      if (layer.name === "markers") kept.push({ ...layer, visible: true });
      continue;
    }
    if (layer.type !== "tilelayer" || !layer.data) continue;
    // The client tile component rebuilds every nonzero cell on every frame and
    // does not look at layer.visible. The invisible collision/height/paths
    // layers are thousands of meta tiles, so the running map leaves them in
    // emberhold-full.tmx only. Kenmi gids are cleared because those images
    // are not in the repo.
    if (layer.visible === false) continue;
    const data = layer.data.map((raw) => {
      const gid = raw & 0x1fffffff;
      if (!gid) return 0;
      const hit = missing.find((tileset) => gid >= tileset.firstgid && gid <= tileset.lastgid);
      return hit ? 0 : raw;
    });
    if (data.some((gid) => gid)) kept.push({ ...layer, data });
  }
  return kept;
}

const fullTags = writeTilesets(manifestTilesets);
const fullXml = mapXml(fullTags, false);
writeFileSync(join(tiledDir, "emberhold-full.tmx"), fullXml);

const present = manifestTilesets.filter((tileset) => tileset.present);
const playTags = writeTilesets(present);
const playXml = mapXml(playTags, true);
writeFileSync(join(tiledDir, "emberhold.tmx"), playXml);

writeFileSync(join(tiledDir, "manifest.json"), JSON.stringify({
  source: "maps/emberhold.tmj",
  copiedFrom: "js/content/maps/emberhold.tmj",
  full: "src/tiled/emberhold-full.tmx",
  playable: "src/tiled/emberhold.tmx",
  note: "emberhold-full.tmx keeps every layer and tileset. Its Kenmi images are not in the repo; the client stops before drawing if the first tileset 404s. emberhold.tmx is the map the scene actually runs: Kenmi gids cleared, missing tilesets omitted, empty layers dropped, and the invisible collision/height/paths layers left only in the full file because the renderer repaints every nonzero tile every frame.",
  tilesets: manifestTilesets,
}, null, 2));

const missing = manifestTilesets.filter((tileset) => !tileset.present).map((tileset) => tileset.name);
console.log(`full ${fullXml.length} bytes, playable ${playXml.length} bytes, missing images: ${missing.join(", ")}`);
