#!/usr/bin/env node
// OoAudit counts code-drawn visual call sites and non-object signals.
// One job: report those counts and fail when any of them rises.
// Lifecycle: create → attach(process) → run(argv) → destroy.
// Single attach point: this file's main attaches one OoAudit to the Node process.
// It reads source text only. It does not load the game and it does not draw.
//
// Visual call sites (js/, css/, index.html), after tools/oo-audit-allow.json:
//   Canvas: fillRect, strokeRect, rect, arc, arcTo, ellipse, beginPath, moveTo,
//   lineTo, bezierCurveTo, quadraticCurveTo, closePath, clip, fill(), stroke(),
//   createLinearGradient, createRadialGradient, createConicGradient, createPattern,
//   shadowBlur (not 0), globalCompositeOperation (not "source-over"),
//   ctx.filter (not "none"), putImageData, createImageData.
//   Computed calls count too: ctx["fillRect"](...).
//   JS assignments to style.background, style.backgroundImage, style.boxShadow,
//   and style.cssText count when they install a gradient, shadow, or clip-path.
//   Everything under js/art/: those calls, plus every other call that is not a
//   language/runtime helper (Math, array methods, DOM bookkeeping, text APIs,
//   drawImage). Gallery lines and the missing-sprite placeholder are allowlisted.
//   CSS in css/: gradients, box-shadow, clip-path, and filter, except none.
//   index.html: those CSS forms plus SVG shape tags (path, polygon, polyline,
//   circle, ellipse, rect, line).
// Plain text (fillText), text-shadow, and allowlisted diagnostics are not counted.
//
// Non-object signals:
//   leaked: top-level var bindings and function declarations that become window
//   properties in a classic script (var inside a block still counts; a function
//   inside a block or an IIFE does not), plus window.Name = at script depth.
//   sfAssigns: SF.name = (and += and the rest) assignment sites, including
//   SF[name] = wraps driven by a string list (js/input.js).
//   sfMembers: distinct SF names assigned.
//   redefined: SF functions (= function, or a string-list wrap) defined in
//   more than one file.
//
// OO-AUDIT total = visual + leaked + sfAssigns + redefined.
// The goal is 0. A count that goes down still passes; re-run --write-baseline.
// --write-baseline refuses to record a rise.

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ALLOW_PATH = path.join(ROOT, "tools", "oo-audit-allow.json");
const BASELINE_PATH = path.join(ROOT, "tools", "oo-baseline.json");

const CANVAS_CALLS = new Set([
  "fillRect", "strokeRect", "rect", "arc", "arcTo", "ellipse",
  "beginPath", "moveTo", "lineTo", "bezierCurveTo", "quadraticCurveTo", "closePath",
  "clip", "fill", "stroke",
  "createLinearGradient", "createRadialGradient", "createConicGradient", "createPattern",
  "putImageData", "createImageData"
]);

const SKIP_OBJECTS = new Set([
  "Math", "JSON", "Object", "console", "document", "window", "Array", "Number",
  "String", "Date", "RegExp", "Promise", "Error", "Uint8Array", "Int8Array",
  "Uint16Array", "Int16Array", "Uint32Array", "Int32Array", "Float32Array",
  "Float64Array", "Map", "Set", "WeakMap", "WeakSet"
]);

const SKIP_CALLEES = new Set([
  "abs", "acos", "asin", "atan", "atan2", "ceil", "clz32", "cos", "exp", "floor",
  "fround", "hypot", "imul", "log", "max", "min", "pow", "random", "round", "sign",
  "sin", "sqrt", "tan", "trunc",
  "push", "pop", "shift", "unshift", "splice", "slice", "concat", "join", "sort",
  "reverse", "forEach", "map", "filter", "reduce", "reduceRight", "some", "every",
  "find", "findIndex", "includes", "indexOf", "lastIndexOf", "flat", "flatMap",
  "charAt", "charCodeAt", "fromCharCode", "toString", "valueOf", "hasOwnProperty",
  "keys", "values", "entries", "assign", "freeze", "create", "defineProperty",
  "isArray", "from", "of",
  "toLowerCase", "toUpperCase", "trim", "replace", "split", "match", "search",
  "substring", "substr", "padStart", "padEnd", "startsWith", "endsWith", "repeat",
  "test", "exec",
  "getElementById", "createElement", "createElementNS", "createTextNode",
  "querySelector", "querySelectorAll", "appendChild", "removeChild", "replaceChild",
  "insertBefore", "setAttribute", "getAttribute", "addEventListener",
  "removeEventListener", "setInterval", "clearInterval", "setTimeout", "clearTimeout",
  "requestAnimationFrame", "cancelAnimationFrame", "preventDefault", "stopPropagation",
  "closest", "focus", "blur", "click", "remove", "append", "prepend",
  "getContext", "getImageData", "drawImage", "clearRect", "save", "restore",
  "translate", "scale", "rotate", "transform", "setTransform", "resetTransform",
  "measureText", "fillText", "strokeText", "setLineDash", "getLineDash",
  "parseInt", "parseFloat", "isNaN", "isFinite", "now", "getTime",
  "apply", "call", "bind", "then", "catch", "finally",
  "log", "warn", "error", "info", "debug", "trace"
]);

const KEYWORDS = new Set([
  "if", "else", "for", "while", "do", "switch", "case", "default", "break",
  "continue", "return", "function", "var", "let", "const", "catch", "try",
  "finally", "throw", "new", "typeof", "void", "delete", "in", "instanceof",
  "of", "with", "yield", "await", "class", "extends", "super", "import",
  "export", "debugger", "this", "null", "true", "false", "undefined"
]);

const FILL_RULES = new Set(["evenodd", "nonzero"]);

function OoAudit() {
  this.parent = null;
  this.root = ROOT;
}

OoAudit.prototype.attach = function (parent) {
  if (this.parent) throw new Error("OoAudit attaches once");
  if (!parent || typeof parent.argv === "undefined" || typeof parent.exit !== "function") {
    throw new Error("OoAudit attaches to the Node process");
  }
  this.parent = parent;
};

OoAudit.prototype.destroy = function () {
  this.parent = null;
};

OoAudit.prototype.run = function (argv) {
  if (!this.parent) throw new Error("OoAudit.run before attach");
  const opts = parseArgs(argv);
  if (opts.help) {
    console.log("Usage: node tools/oo-audit.mjs [--write-baseline] [--against-ref <ref>] [--verbose]");
    console.log("Fails when any visual, leaked-name, SF assignment, or redefinition count rises.");
    console.log("--against-ref loads <ref>:tools/oo-baseline.json and also fails when the");
    console.log("working baseline or the live counts are above that ref. A ref with no");
    console.log("baseline file yet is the first baseline and is allowed.");
    console.log("OO-AUDIT total = visual + leaked + sfAssigns + redefined. Goal: 0.");
    return 0;
  }
  const allow = loadAllow();
  const current = collect(allow);
  const baseline = readBaseline();
  const report = formatReport(current, allow, opts.verbose);
  console.log(report);
  if (opts.writeBaseline) return writeBaseline(current, baseline);
  if (!baseline) {
    console.error("oo-audit: no baseline at tools/oo-baseline.json");
    console.error("hint: node tools/oo-audit.mjs --write-baseline");
    console.log("OO-AUDIT: " + current.totals.total + " remaining");
    return 1;
  }
  const diff = compare(current, baseline);
  printDiff(diff);
  let code = diff.rises.length ? 1 : 0;
  if (!diff.rises.length && diff.falls.length) {
    console.log("hint: counts fell; re-run node tools/oo-audit.mjs --write-baseline");
  }
  if (opts.againstRef) {
    const held = holdAgainstRef(opts.againstRef, current, baseline);
    if (held !== 0) code = held;
  }
  console.log("OO-AUDIT: " + current.totals.total + " remaining");
  return code;
};

function parseArgs(argv) {
  const opts = { writeBaseline: false, verbose: false, help: false, againstRef: "" };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--write-baseline") opts.writeBaseline = true;
    else if (arg === "--verbose") opts.verbose = true;
    else if (arg === "--help" || arg === "-h") opts.help = true;
    else if (arg === "--against-ref") {
      opts.againstRef = argv[i + 1];
      i += 1;
      if (!opts.againstRef || opts.againstRef.startsWith("--")) {
        console.error("oo-audit: --against-ref needs a git ref");
        process.exit(1);
      }
    } else {
      console.error("oo-audit: unknown argument " + arg);
      process.exit(1);
    }
  }
  return opts;
}

function holdAgainstRef(ref, current, baseline) {
  const loaded = readBaselineFromRef(ref);
  if (loaded.error) return 1;
  if (loaded.missing) {
    console.log("oo-audit: " + ref + " has no tools/oo-baseline.json; first baseline is allowed");
    return 0;
  }
  const baseDiff = compare(baseline, loaded.baseline);
  const liveDiff = compare(current, loaded.baseline);
  let code = 0;
  if (baseDiff.rises.length) {
    console.error("oo-audit: working baseline is above " + ref);
    for (const row of baseDiff.rises) console.error("  " + row);
    code = 1;
  }
  if (liveDiff.rises.length) {
    console.error("oo-audit: live counts are above " + ref);
    for (const row of liveDiff.rises) console.error("  " + row);
    code = 1;
  }
  if (!code) console.log("oo-audit: counts are within " + ref);
  return code;
}

function readBaselineFromRef(ref) {
  const show = spawnSync("git", ["show", ref + ":tools/oo-baseline.json"], {
    cwd: ROOT,
    encoding: "utf8"
  });
  if (show.status === 0) {
    try {
      return { baseline: JSON.parse(show.stdout), missing: false, error: false };
    } catch (err) {
      console.error("oo-audit: " + ref + ":tools/oo-baseline.json is not JSON");
      return { error: true };
    }
  }
  const err = ((show.stderr || "") + (show.stdout || "")).trim();
  if (/does not exist in|exists on disk, but not in|Path 'tools\/oo-baseline\.json' does not exist/i.test(err)) {
    return { baseline: null, missing: true, error: false };
  }
  console.error("oo-audit: git show " + ref + ":tools/oo-baseline.json failed");
  if (err) console.error(err);
  return { error: true };
}

function loadAllow() {
  if (!fs.existsSync(ALLOW_PATH)) {
    console.error("oo-audit: missing tools/oo-audit-allow.json");
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(ALLOW_PATH, "utf8"));
  if (!data || !Array.isArray(data.entries) || !data.entries.length) {
    console.error("oo-audit: allowlist needs an entries array");
    process.exit(1);
  }
  for (const entry of data.entries) {
    if (!entry || typeof entry.file !== "string" || !entry.file) failAllow("file");
    if (typeof entry.doc !== "string" || !entry.doc.trim()) failAllow("doc for " + entry.file);
    if (typeof entry.reason !== "string" || !entry.reason.trim()) failAllow("reason for " + entry.file);
    const abs = path.join(ROOT, entry.file);
    if (!fs.existsSync(abs)) {
      console.error("oo-audit: allowlist cites a missing file " + entry.file);
      process.exit(1);
    }
    if (isScanned(entry.file)) {
      if (!Number.isInteger(entry.start) || !Number.isInteger(entry.end) || entry.start < 1 || entry.end < entry.start) {
        console.error("oo-audit: allowlist line range for " + entry.file);
        process.exit(1);
      }
    }
  }
  return data.entries;
}

function failAllow(what) {
  console.error("oo-audit: allowlist entry needs " + what);
  process.exit(1);
}

function isScanned(rel) {
  if (rel === "index.html") return true;
  if (rel.startsWith("js/") && rel.endsWith(".js")) return true;
  if (rel.startsWith("css/") && rel.endsWith(".css")) return true;
  return false;
}

function allowed(entries, file, line) {
  for (const entry of entries) {
    if (entry.file !== file) continue;
    if (entry.start == null) return true;
    if (line >= entry.start && line <= entry.end) return true;
  }
  return false;
}

function walk(dir, pred, acc) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, pred, acc);
    else if (pred(full)) acc.push(full);
  }
  return acc;
}

function relPath(full) {
  return path.relative(ROOT, full).split(path.sep).join("/");
}

function gameVersion() {
  const file = path.join(ROOT, "js", "data.js");
  if (!fs.existsSync(file)) return "";
  const text = fs.readFileSync(file, "utf8");
  const match = text.match(/SF\.VERSION = "([^"]+)"/);
  return match ? match[1] : "";
}

function collect(allow) {
  const files = {};
  const sfFiles = new Map();
  const visualHits = [];
  let excluded = 0;

  function noteFile(rel) {
    if (!files[rel]) {
      files[rel] = { visual: 0, leaked: new Set(), sfMembers: new Set(), sfAssigns: 0, hits: [] };
    }
    return files[rel];
  }

  function addVisual(rel, line, kind) {
    if (allowed(allow, rel, line)) {
      excluded += 1;
      return;
    }
    const row = noteFile(rel);
    row.visual += 1;
    row.hits.push(line + " " + kind);
    visualHits.push(rel + ":" + line + " " + kind);
  }

  function addAssign(rel, name, isFn) {
    const row = noteFile(rel);
    row.sfAssigns += 1;
    row.sfMembers.add(name);
    if (!sfFiles.has(name)) sfFiles.set(name, { files: new Set(), fnFiles: new Set() });
    const bag = sfFiles.get(name);
    bag.files.add(rel);
    if (isFn) bag.fnFiles.add(rel);
  }

  const jsFiles = walk(path.join(ROOT, "js"), (full) => full.endsWith(".js"), []);
  jsFiles.sort();
  for (const full of jsFiles) {
    const rel = relPath(full);
    const text = fs.readFileSync(full, "utf8");
    const scanned = scanJs(text, rel.startsWith("js/art/"));
    if (!scanned.balanced) {
      console.error("oo-audit: brace mismatch in " + rel);
      process.exit(1);
    }
    const row = noteFile(rel);
    for (const name of scanned.leaked) row.leaked.add(name);
    for (const hit of scanned.visual) addVisual(rel, hit.line, hit.kind);
    for (const assign of scanned.assigns) addAssign(rel, assign.name, assign.isFn);
    for (const name of dynamicFunctionNames(text)) addAssign(rel, name, true);
    if (row.visual === 0 && row.leaked.size === 0 && row.sfAssigns === 0) delete files[rel];
  }

  const cssFiles = walk(path.join(ROOT, "css"), (full) => full.endsWith(".css"), []);
  cssFiles.sort();
  for (const full of cssFiles) {
    const rel = relPath(full);
    for (const hit of scanCss(fs.readFileSync(full, "utf8"))) addVisual(rel, hit.line, hit.kind);
  }

  const htmlPath = path.join(ROOT, "index.html");
  if (fs.existsSync(htmlPath)) {
    const html = fs.readFileSync(htmlPath, "utf8");
    for (const hit of scanCss(html)) addVisual("index.html", hit.line, hit.kind);
    for (const hit of scanSvg(html)) addVisual("index.html", hit.line, hit.kind);
    for (const chunk of inlineScripts(html)) {
      const scanned = scanJs(chunk.text, false);
      for (const hit of scanned.visual) {
        addVisual("index.html", chunk.line + hit.line - 1, hit.kind);
      }
    }
  }

  const perFile = {};
  let visual = 0;
  let leaked = 0;
  let sfAssigns = 0;
  const memberNames = new Set();
  for (const rel of Object.keys(files).sort()) {
    const row = files[rel];
    visual += row.visual;
    leaked += row.leaked.size;
    sfAssigns += row.sfAssigns;
    for (const name of row.sfMembers) memberNames.add(name);
    const item = {};
    if (row.visual) item.visual = row.visual;
    if (row.leaked.size) item.leaked = row.leaked.size;
    if (row.sfMembers.size) item.sfMembers = row.sfMembers.size;
    if (row.sfAssigns) item.sfAssigns = row.sfAssigns;
    if (Object.keys(item).length) perFile[rel] = item;
    row.leakedList = [...row.leaked].sort();
  }

  const redefined = {};
  const names = [...sfFiles.keys()].sort();
  for (const name of names) {
    const fnFiles = [...sfFiles.get(name).fnFiles].sort();
    if (fnFiles.length > 1) redefined[name] = fnFiles;
  }

  const redefinedCount = Object.keys(redefined).length;
  const totals = {
    visual: visual,
    leaked: leaked,
    sfMembers: memberNames.size,
    sfAssigns: sfAssigns,
    redefined: redefinedCount,
    total: visual + leaked + sfAssigns + redefinedCount
  };

  return {
    version: gameVersion(),
    totals: totals,
    files: perFile,
    redefined: redefined,
    detail: files,
    visualHits: visualHits,
    excluded: excluded
  };
}

function scanJs(src, inArt) {
  const leaked = new Set();
  const visual = [];
  const assigns = [];
  const braces = [];
  const n = src.length;
  let i = 0;
  let line = 1;
  let functionDepth = 0;
  let blockDepth = 0;
  let parenDepth = 0;
  let bracketDepth = 0;
  let prevKind = "start";
  let prevText = "";
  let prevIdent = "";
  let callObject = "";
  let decl = null;
  let sawFunction = false;
  let fnNameTaken = false;
  let fnDecl = false;
  let wantFnBody = false;
  let armFnBody = 0;
  let pendingFn = false;
  let member = null;
  let waitForFn = null;
  let styleProp = null;
  let computedName = "";
  let computedObject = "";

  function bump(ch) {
    if (ch === "\n") line += 1;
  }

  function skipSpace() {
    while (i < n) {
      const c = src[i];
      if (c === " " || c === "\t" || c === "\r" || c === "\n") {
        bump(c);
        i += 1;
        continue;
      }
      if (c === "/" && src[i + 1] === "/") {
        while (i < n && src[i] !== "\n") i += 1;
        continue;
      }
      if (c === "/" && src[i + 1] === "*") {
        i += 2;
        while (i < n && !(src[i] === "*" && src[i + 1] === "/")) {
          bump(src[i]);
          i += 1;
        }
        i = Math.min(n, i + 2);
        continue;
      }
      break;
    }
  }

  function statementPosition() {
    return prevKind === "start" || prevKind === "semi" || prevKind === "brace" || prevText === "else" || prevText === "do";
  }

  function mark(kind, text) {
    prevKind = kind;
    prevText = text || "";
  }

  function readRegex() {
    let j = i + 1;
    let klass = false;
    while (j < n) {
      const c = src[j];
      if (c === "\n") return -1;
      if (c === "\\") {
        j += 2;
        continue;
      }
      if (c === "[") klass = true;
      else if (c === "]" && klass) klass = false;
      else if (c === "/" && !klass) {
        j += 1;
        while (j < n && /[a-z]/i.test(src[j])) j += 1;
        return j;
      }
      j += 1;
    }
    return -1;
  }

  function readString(quote) {
    i += 1;
    let word = "";
    while (i < n) {
      const ch = src[i];
      if (ch === "\\") {
        bump(ch);
        if (i + 1 < n) {
          bump(src[i + 1]);
          word += src[i + 1];
        }
        i += 2;
        continue;
      }
      bump(ch);
      i += 1;
      if (ch === quote) break;
      word += ch;
    }
    return word;
  }

  function readNumber() {
    if (src[i] === "0" && (src[i + 1] === "x" || src[i + 1] === "X")) {
      i += 2;
      while (i < n && /[0-9a-fA-F]/.test(src[i])) i += 1;
      return;
    }
    while (i < n && /[0-9]/.test(src[i])) i += 1;
    if (src[i] === "." && /[0-9]/.test(src[i + 1] || "")) {
      i += 1;
      while (i < n && /[0-9]/.test(src[i])) i += 1;
    }
    if (src[i] === "e" || src[i] === "E") {
      let j = i + 1;
      if (src[j] === "+" || src[j] === "-") j += 1;
      if (/[0-9]/.test(src[j] || "")) {
        i = j;
        while (i < n && /[0-9]/.test(src[i])) i += 1;
      }
    }
  }

  function argShape(parenAt) {
    let j = parenAt + 1;
    while (j < n && (src[j] === " " || src[j] === "\t" || src[j] === "\n" || src[j] === "\r")) j += 1;
    if (src[j] === ")") return "empty";
    const q = src[j];
    if (q === "\"" || q === "'") {
      let k = j + 1;
      let word = "";
      while (k < n && src[k] !== q && src[k] !== "\n") {
        if (src[k] === "\\") {
          word += src[k + 1] || "";
          k += 2;
          continue;
        }
        word += src[k];
        k += 1;
      }
      let m = k + 1;
      while (m < n && (src[m] === " " || src[m] === "\t" || src[m] === "\n" || src[m] === "\r")) m += 1;
      if (src[m] === ")" && FILL_RULES.has(word)) return "rule";
    }
    return "args";
  }

  function classify(callee, object, parenAt) {
    if (SKIP_OBJECTS.has(object) || SKIP_CALLEES.has(callee) || KEYWORDS.has(callee)) return null;
    if (CANVAS_CALLS.has(callee)) {
      if (callee === "fill" || callee === "stroke") {
        const shape = argShape(parenAt);
        if (shape === "empty" || shape === "rule") return callee;
        if (inArt) return "paint";
        return null;
      }
      return callee;
    }
    if (inArt) return "paint";
    return null;
  }

  function peekValue(from) {
    let j = from;
    while (j < n && (src[j] === " " || src[j] === "\t" || src[j] === "\n" || src[j] === "\r")) j += 1;
    const q = src[j];
    if (q === "\"" || q === "'") {
      let k = j + 1;
      let word = "";
      while (k < n && src[k] !== q && src[k] !== "\n") {
        if (src[k] === "\\") {
          word += src[k + 1] || "";
          k += 2;
          continue;
        }
        word += src[k];
        k += 1;
      }
      return word;
    }
    if (/[0-9]/.test(q) || (q === "." && /[0-9]/.test(src[j + 1] || ""))) {
      let k = j;
      while (k < n && /[0-9.]/.test(src[k])) k += 1;
      return src.slice(j, k);
    }
    return "";
  }

  function noteStyle(op, from) {
    if (!styleProp || op !== "=") {
      styleProp = null;
      return;
    }
    const value = peekValue(from);
    const kind = styleProp.kind;
    const prop = styleProp.prop || "";
    const at = styleProp.line;
    styleProp = null;
    if (kind === "shadowBlur") {
      if (value !== "0" && value !== "0.0") visual.push({ line: at, kind: "shadowBlur" });
    } else if (kind === "globalCompositeOperation") {
      if (value !== "source-over") visual.push({ line: at, kind: "globalCompositeOperation" });
    } else if (kind === "filter") {
      if (value !== "none") visual.push({ line: at, kind: "filter" });
    } else if (kind === "cssArt") {
      if (prop === "boxShadow") {
        if (value && value !== "none") visual.push({ line: at, kind: "boxShadow" });
      } else if (/(?:linear|radial|conic)-gradient\s*\(|box-shadow\s*:|clip-path\s*:/.test(value)) {
        visual.push({ line: at, kind: prop || "cssText" });
      }
    }
  }

  function divisionBeforeSlash() {
    return prevKind === "ident" || prevKind === "num" || prevKind === "str" || prevKind === "paren-end" || prevKind === "brack-end" || prevText === "++" || prevText === "--";
  }

  while (i < n) {
    skipSpace();
    if (i >= n) break;
    const c = src[i];

    if (waitForFn && c !== " " ) {
      // decided on the first real token below
    }

    if (c === "\"" || c === "'" || c === "`") {
      if (member && !member.counted) member = null;
      if (waitForFn) waitForFn = null;
      styleProp = null;
      const text = readString(c);
      if ((c === "\"" || c === "'") && bracketDepth > 0 && CANVAS_CALLS.has(text)) computedName = text;
      mark("str", "");
      continue;
    }

    if (c === "/") {
      if (!divisionBeforeSlash()) {
        const end = readRegex();
        if (end > 0) {
          if (member && !member.counted) member = null;
          if (waitForFn) waitForFn = null;
          styleProp = null;
          i = end;
          mark("str", "");
          continue;
        }
      }
      if (member && !member.counted) member = null;
      if (waitForFn) waitForFn = null;
      styleProp = null;
      if (src[i + 1] === "=") {
        i += 2;
        mark("op", "/=");
        continue;
      }
      i += 1;
      mark("op", "/");
      continue;
    }

    if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(src[i + 1] || ""))) {
      if (member && !member.counted) member = null;
      if (waitForFn) waitForFn = null;
      styleProp = null;
      readNumber();
      mark("num", "");
      continue;
    }

    if (/[A-Za-z_$]/.test(c)) {
      const start = i;
      i += 1;
      while (i < n && /[\w$]/.test(src[i])) i += 1;
      const word = src.slice(start, i);
      const object = prevKind === "dot" ? prevIdent : "";
      const atLine = line;
      const isKw = KEYWORDS.has(word);

      if (waitForFn) {
        if (word === "function") waitForFn.isFn = true;
        waitForFn = null;
      }
      if (member && !member.counted) member = null;
      styleProp = null;

      if (word === "function") {
        fnDecl = statementPosition();
        sawFunction = true;
        fnNameTaken = false;
        mark("kw", word);
        continue;
      }

      if (sawFunction && !fnNameTaken && !isKw) {
        if (fnDecl && functionDepth === 0 && blockDepth === 0) leaked.add(word);
        fnNameTaken = true;
      }

      if (word === "var" && functionDepth === 0) {
        decl = { fn: functionDepth, paren: parenDepth, bracket: bracketDepth, block: blockDepth, expect: true };
        mark("kw", word);
        continue;
      }

      if (decl && decl.expect && functionDepth === decl.fn && !sawFunction && !isKw) {
        leaked.add(word);
        decl.expect = false;
      }

      if (prevKind === "dot" && prevIdent === "SF" && !isKw) {
        member = { name: word, line: atLine, isFn: false, counted: false };
      }

      if (prevKind === "dot" && prevIdent === "window" && functionDepth === 0 && !isKw && lookaheadAssign(src, i)) {
        leaked.add(word);
      }

      if (prevKind === "dot" && (word === "shadowBlur" || word === "globalCompositeOperation" || word === "filter")) {
        styleProp = { kind: word, line: atLine };
      }
      if (prevKind === "dot" && (word === "background" || word === "backgroundImage" || word === "boxShadow" || word === "cssText")) {
        styleProp = { kind: "cssArt", prop: word, line: atLine };
      }

      callObject = object;
      prevIdent = word;
      mark(isKw ? "kw" : "ident", word);
      continue;
    }

    if (c === ".") {
      if (member && !member.counted) member = null;
      if (waitForFn) waitForFn = null;
      styleProp = null;
      i += 1;
      mark("dot", ".");
      continue;
    }

    if (c === "(") {
      if (member && !member.counted) member = null;
      if (waitForFn) waitForFn = null;
      styleProp = null;
      if (prevKind === "brack-end" && computedName) {
        const kind = classify(computedName, computedObject, i);
        if (kind) visual.push({ line: line, kind: kind });
        computedName = "";
      } else if (sawFunction) {
        fnNameTaken = true;
        sawFunction = false;
        wantFnBody = true;
        armFnBody = parenDepth;
      } else if (prevKind === "ident") {
        const kind = classify(prevText, callObject, i);
        if (kind) visual.push({ line: line, kind: kind });
      }
      parenDepth += 1;
      i += 1;
      mark("paren", "(");
      continue;
    }

    if (c === ")") {
      parenDepth = Math.max(0, parenDepth - 1);
      if (wantFnBody && parenDepth === armFnBody) {
        pendingFn = true;
        wantFnBody = false;
      }
      i += 1;
      mark("paren-end", ")");
      continue;
    }

    if (c === "[") {
      if (member && !member.counted) member = null;
      if (waitForFn) waitForFn = null;
      styleProp = null;
      computedObject = prevKind === "ident" ? prevIdent : "";
      computedName = "";
      bracketDepth += 1;
      i += 1;
      mark("brack", "[");
      continue;
    }

    if (c === "]") {
      bracketDepth = Math.max(0, bracketDepth - 1);
      i += 1;
      mark("brack-end", "]");
      let j = i;
      while (j < n && (src[j] === " " || src[j] === "\t" || src[j] === "\n" || src[j] === "\r")) j += 1;
      if (src[j] !== "(") computedName = "";
      continue;
    }

    if (c === "{") {
      if (member && !member.counted) member = null;
      if (waitForFn) waitForFn = null;
      styleProp = null;
      if (pendingFn) {
        functionDepth += 1;
        pendingFn = false;
        braces.push("fn");
      } else {
        blockDepth += 1;
        braces.push("block");
      }
      i += 1;
      mark("brace", "{");
      continue;
    }

    if (c === "}") {
      const kind = braces.pop() || "block";
      if (kind === "fn") functionDepth = Math.max(0, functionDepth - 1);
      else blockDepth = Math.max(0, blockDepth - 1);
      i += 1;
      mark("brace", "}");
      continue;
    }

    if (c === ";") {
      if (decl && functionDepth === decl.fn && parenDepth === decl.paren && blockDepth === decl.block) decl = null;
      if (member && !member.counted) member = null;
      if (waitForFn) waitForFn = null;
      styleProp = null;
      i += 1;
      mark("semi", ";");
      continue;
    }

    if (c === ",") {
      if (decl && functionDepth === decl.fn && parenDepth === decl.paren && bracketDepth === decl.bracket && blockDepth === decl.block) {
        decl.expect = true;
      }
      if (member && !member.counted) member = null;
      if (waitForFn) waitForFn = null;
      styleProp = null;
      i += 1;
      mark("comma", ",");
      continue;
    }

    const assignOp = readAssignOp(src, i);
    if (assignOp && c === assignOp[0]) {
      if (member && !member.counted) {
        member.counted = true;
        assigns.push(member);
        waitForFn = member;
        member = null;
      }
      noteStyle(assignOp, i + assignOp.length);
      i += assignOp.length;
      mark("op", assignOp);
      continue;
    }

    if (c === "=" || c === "!" || c === "<" || c === ">") {
      if (member && !member.counted) member = null;
      if (waitForFn) waitForFn = null;
      styleProp = null;
      let j = i + 1;
      if (src[j] === "=") j += 1;
      if (src[j] === "=") j += 1;
      if ((c === "<" || c === ">") && src[i + 1] === c) {
        j = i + 2;
        if (src[j] === "=") j += 1;
        if (c === ">" && src[i + 1] === ">" && src[i + 2] === ">") {
          j = i + 3;
          if (src[j] === "=") j += 1;
        }
      }
      i = j;
      mark("op", src.slice(i, j));
      continue;
    }

    if ("+-*%&|^~?:".includes(c)) {
      if (member && !member.counted) member = null;
      if (waitForFn) waitForFn = null;
      styleProp = null;
      let op = c;
      if ((c === "+" || c === "-" || c === "&" || c === "|" || c === "?") && src[i + 1] === c) {
        op = c + c;
        if ((c === "|" || c === "&" || c === "?") && src[i + 2] === "=") op += "=";
      } else if (src[i + 1] === "=") op = c + "=";
      i += op.length;
      mark("op", op);
      continue;
    }

    if (member && !member.counted) member = null;
    if (waitForFn) waitForFn = null;
    styleProp = null;
    i += 1;
    mark("op", c);
  }

  return {
    leaked: leaked,
    visual: visual,
    assigns: assigns,
    balanced: functionDepth === 0 && blockDepth === 0 && braces.length === 0 && parenDepth === 0
  };
}

function lookaheadAssign(src, index) {
  let j = index;
  while (j < src.length && (src[j] === " " || src[j] === "\t" || src[j] === "\n" || src[j] === "\r")) j += 1;
  if (src[j] !== "=" || src[j + 1] === "=") return false;
  return true;
}

function readAssignOp(src, index) {
  const two = src.slice(index, index + 2);
  const three = src.slice(index, index + 3);
  const four = src.slice(index, index + 4);
  if (four === ">>>=") return null;
  if (three === ">>=" || three === "<<=" || three === "||=" || three === "&&=" || three === "??=") return three;
  if (two === "+=" || two === "-=" || two === "*=" || two === "/=" || two === "%=" || two === "|=" || two === "&=" || two === "^=") return two;
  if (src[index] === "=" && src[index + 1] !== "=") return "=";
  return null;
}

function dynamicFunctionNames(src) {
  const names = [];
  const re = /\[([^\]]+)\]\s*\.forEach\(\s*function\s*\(\s*[A-Za-z_$][\w$]*\s*\)/g;
  let match;
  while ((match = re.exec(src))) {
    const body = src.slice(match.index, match.index + 2500);
    if (!/SF\[\s*[A-Za-z_$][\w$]*\s*\]\s*=/.test(body)) continue;
    const parts = match[1].match(/["']([A-Za-z_$][\w$]*)["']/g) || [];
    for (const part of parts) names.push(part.slice(1, -1));
  }
  return names;
}

function scanCss(src) {
  const masked = maskCss(src);
  const hits = [];
  const grad = /(?:repeating-)?(?:linear|radial|conic)-gradient\s*\(/g;
  const props = [
    [/box-shadow\s*:/g, "box-shadow"],
    [/clip-path\s*:/g, "clip-path"],
    [/filter\s*:/g, "filter"]
  ];
  let match;
  while ((match = grad.exec(masked))) {
    hits.push({ line: lineOf(masked, match.index), kind: "gradient" });
  }
  for (const pair of props) {
    const re = pair[0];
    const kind = pair[1];
    re.lastIndex = 0;
    while ((match = re.exec(masked))) {
      const value = cssValue(masked, match.index + match[0].length);
      if (value === "none") continue;
      hits.push({ line: lineOf(masked, match.index), kind: kind });
    }
  }
  return hits;
}

function maskCss(src) {
  let out = "";
  let i = 0;
  while (i < src.length) {
    if (src[i] === "/" && src[i + 1] === "*") {
      const start = i;
      i += 2;
      while (i < src.length && !(src[i] === "*" && src[i + 1] === "/")) i += 1;
      i = Math.min(src.length, i + 2);
      out += src.slice(start, i).replace(/[^\n]/g, " ");
      continue;
    }
    out += src[i];
    i += 1;
  }
  return out;
}

function cssValue(src, index) {
  let i = index;
  let value = "";
  let depth = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === "(") depth += 1;
    else if (c === ")" && depth) depth -= 1;
    else if (c === ";" && depth === 0) break;
    else if (c === "{" || c === "}") break;
    value += c;
    i += 1;
  }
  return value.trim().replace(/\s+/g, " ");
}

function scanSvg(src) {
  const masked = src.replace(/<!--[\s\S]*?-->/g, (block) => block.replace(/[^\n]/g, " "));
  const hits = [];
  const re = /<(?:path|polygon|polyline|circle|ellipse|rect|line)\b/g;
  let match;
  while ((match = re.exec(masked))) {
    hits.push({ line: lineOf(masked, match.index), kind: "svg" });
  }
  return hits;
}

function inlineScripts(src) {
  const chunks = [];
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = re.exec(src))) {
    if (/\bsrc\s*=/i.test(match[1])) continue;
    const before = src.slice(0, match.index).split("\n").length;
    const openLines = match[0].slice(0, match[0].indexOf(">") + 1).split("\n").length - 1;
    chunks.push({ text: match[2], line: before + openLines });
  }
  return chunks;
}

function lineOf(src, index) {
  let line = 1;
  for (let i = 0; i < index && i < src.length; i += 1) if (src[i] === "\n") line += 1;
  return line;
}

function formatReport(current, allow, verbose) {
  const lines = [];
  lines.push("OoAudit");
  lines.push("total = visual + leaked + sfAssigns + redefined");
  lines.push("visual call sites: " + current.totals.visual);
  pushFiles(lines, current, "visual");
  lines.push("leaked window names: " + current.totals.leaked);
  pushFiles(lines, current, "leaked");
  lines.push("SF members assigned: " + current.totals.sfMembers + " distinct, " + current.totals.sfAssigns + " sites");
  pushFiles(lines, current, "sfAssigns");
  lines.push("SF functions defined in more than one file: " + current.totals.redefined);
  for (const name of Object.keys(current.redefined)) {
    lines.push("  " + name + "  " + current.redefined[name].join(" "));
  }
  lines.push("allowlist: " + allow.length + " entries, excluded " + current.excluded + " visual hits");
  const outside = allow.filter((entry) => !isScanned(entry.file));
  for (const entry of outside) lines.push("  not scanned: " + entry.file + " (" + entry.doc + ")");
  if (verbose) {
    lines.push("visual hits:");
    for (const hit of current.visualHits) lines.push("  " + hit);
    lines.push("leaked names:");
    for (const rel of Object.keys(current.detail).sort()) {
      const names = current.detail[rel].leakedList || [];
      if (!names.length) continue;
      lines.push("  " + rel + ": " + names.join(", "));
    }
  }
  return lines.join("\n");
}

function pushFiles(lines, current, field) {
  const rows = [];
  for (const rel of Object.keys(current.files)) {
    const value = current.files[rel][field] || 0;
    if (value) rows.push({ rel: rel, value: value });
  }
  rows.sort((a, b) => b.value - a.value || (a.rel < b.rel ? -1 : a.rel > b.rel ? 1 : 0));
  const suffix = field === "sfAssigns" ? " sites" : "";
  for (const row of rows) lines.push("  " + row.rel + "  " + row.value + suffix);
}

function readBaseline() {
  if (!fs.existsSync(BASELINE_PATH)) return null;
  return JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8"));
}

function snapshot(current) {
  return {
    version: current.version,
    formula: "visual + leaked + sfAssigns + redefined",
    totals: current.totals,
    files: current.files,
    redefined: current.redefined
  };
}

function writeBaseline(current, previous) {
  if (previous) {
    const diff = compare(current, previous);
    if (diff.rises.length) {
      printDiff(diff);
      console.log("OO-AUDIT: " + current.totals.total + " remaining");
      console.error("oo-audit: --write-baseline refused because a count rose");
      return 1;
    }
  }
  fs.writeFileSync(BASELINE_PATH, JSON.stringify(snapshot(current), null, 2) + "\n");
  console.log("wrote tools/oo-baseline.json");
  console.log("OO-AUDIT: " + current.totals.total + " remaining");
  return 0;
}

function compare(current, baseline) {
  const rises = [];
  const falls = [];
  const fields = ["visual", "leaked", "sfMembers", "sfAssigns"];
  const names = new Set([...Object.keys(current.files), ...Object.keys(baseline.files || {})]);
  for (const rel of [...names].sort()) {
    const now = current.files[rel] || {};
    const was = (baseline.files && baseline.files[rel]) || {};
    for (const field of fields) {
      const a = now[field] || 0;
      const b = was[field] || 0;
      if (a > b) rises.push(rel + " " + field + " " + b + " -> " + a);
      else if (a < b) falls.push(rel + " " + field + " " + b + " -> " + a);
    }
  }
  const nowNames = current.redefined || {};
  const wasNames = baseline.redefined || {};
  const all = new Set([...Object.keys(nowNames), ...Object.keys(wasNames)]);
  for (const name of [...all].sort()) {
    const nowFiles = nowNames[name] || [];
    const wasFiles = wasNames[name] || [];
    for (const file of nowFiles) {
      if (wasFiles.indexOf(file) === -1) rises.push("redefined " + name + " added " + file);
    }
    for (const file of wasFiles) {
      if (nowFiles.indexOf(file) === -1) falls.push("redefined " + name + " removed " + file);
    }
  }
  const totalFields = ["visual", "leaked", "sfMembers", "sfAssigns", "redefined", "total"];
  for (const field of totalFields) {
    const a = current.totals[field] || 0;
    const b = (baseline.totals && baseline.totals[field]) || 0;
    if (a > b) rises.push("total " + field + " " + b + " -> " + a);
    else if (a < b) falls.push("total " + field + " " + b + " -> " + a);
  }
  return { rises: rises, falls: falls };
}

function printDiff(diff) {
  if (diff.rises.length) {
    console.error("oo-audit: count rose");
    for (const row of diff.rises) console.error("  " + row);
  }
  if (diff.falls.length) {
    console.log("oo-audit: count fell");
    for (const row of diff.falls) console.log("  " + row);
  }
}

function isMain() {
  const entry = process.argv[1];
  if (!entry) return false;
  return import.meta.url === pathToFileURL(entry).href;
}

if (isMain()) {
  const audit = new OoAudit();
  audit.attach(process);
  const code = audit.run(process.argv.slice(2));
  audit.destroy();
  process.exit(code);
}

export { OoAudit };
