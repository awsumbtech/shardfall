#!/usr/bin/env node
// Proves the ratchet cannot be raised inside one tree.
// Builds a temp git repo, then checks three cases:
//   1. a hand-edited baseline that is above main exits non-zero
//   2. a new fillRect in a temp js file exits non-zero
//   3. deleting that file passes again

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const AUDIT = path.join(HERE, "oo-audit.mjs");

function fail(message) {
  console.error("oo-audit-tamper: " + message);
  process.exit(1);
}

function git(cwd, args) {
  const result = spawnSync("git", args, { cwd: cwd, encoding: "utf8" });
  if (result.status !== 0) {
    fail("git " + args.join(" ") + "\n" + (result.stderr || result.stdout || ""));
  }
  return result.stdout || "";
}

function write(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

function runAudit(cwd, args) {
  return spawnSync(process.execPath, [path.join(cwd, "tools", "oo-audit.mjs")].concat(args), {
    cwd: cwd,
    encoding: "utf8"
  });
}

function show(title, result) {
  console.log("=== " + title + " ===");
  if (result.stdout) process.stdout.write(result.stdout.endsWith("\n") ? result.stdout : result.stdout + "\n");
  if (result.stderr) process.stderr.write(result.stderr.endsWith("\n") ? result.stderr : result.stderr + "\n");
  console.log("exit=" + (result.status === null ? 1 : result.status));
  console.log("");
}

function expectFail(title, result) {
  show(title, result);
  if (result.status === 0) fail(title + " exited 0");
  const text = (result.stdout || "") + (result.stderr || "");
  if (!/count rose|working baseline is above|live counts are above/.test(text)) {
    fail(title + " did not report a rise");
  }
}

function expectPass(title, result) {
  show(title, result);
  if (result.status !== 0) fail(title + " exited " + result.status);
}

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "oo-tamper-"));
git(dir, ["init", "-b", "main"]);
git(dir, ["config", "user.email", "oo-audit@example.com"]);
git(dir, ["config", "user.name", "oo-audit"]);

write(path.join(dir, "tools", "oo-audit.mjs"), fs.readFileSync(AUDIT));
write(path.join(dir, "tools", "oo-audit-allow.json"), JSON.stringify({
  entries: [{
    file: "js/keep.js",
    start: 1,
    end: 1,
    doc: "tamper fixture",
    reason: "Line kept so the allowlist has one real file."
  }]
}, null, 2) + "\n");
write(path.join(dir, "js", "keep.js"), "\"use strict\";\nvar kept = 1;\n");
write(path.join(dir, "index.html"), "<!DOCTYPE html><html><body></body></html>\n");
write(path.join(dir, "css", "style.css"), "/* fixture */\n");

const seeded = runAudit(dir, ["--write-baseline"]);
if (seeded.status !== 0) {
  show("seed baseline", seeded);
  fail("could not write the fixture baseline");
}
git(dir, ["add", "."]);
git(dir, ["commit", "-m", "fixture baseline"]);

const baselinePath = path.join(dir, "tools", "oo-baseline.json");
const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
const committed = fs.readFileSync(baselinePath, "utf8");
baseline.files["js/keep.js"] = baseline.files["js/keep.js"] || {};
baseline.files["js/keep.js"].visual = (baseline.files["js/keep.js"].visual || 0) + 3;
baseline.totals.visual += 3;
baseline.totals.total += 3;
fs.writeFileSync(baselinePath, JSON.stringify(baseline, null, 2) + "\n");
expectFail("raised baseline", runAudit(dir, ["--against-ref", "main"]));

fs.writeFileSync(baselinePath, committed);
write(path.join(dir, "js", "cheat.js"), "\"use strict\";\nfunction cheat(ctx) {\n  ctx.fillRect(0, 0, 1, 1);\n}\n");
expectFail("added fillRect", runAudit(dir, ["--against-ref", "main"]));

fs.unlinkSync(path.join(dir, "js", "cheat.js"));
expectPass("revert", runAudit(dir, ["--against-ref", "main"]));

console.log("oo-audit-tamper: PASS");
