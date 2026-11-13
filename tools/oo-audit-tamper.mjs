#!/usr/bin/env node
// OoAuditTamper proves the ratchet cannot be raised inside one tree.
// One job: build a temp git repo and require three outcomes.
//   1. a hand-edited baseline that is above main exits non-zero
//   2. a new fillRect in a temp js file exits non-zero
//   3. deleting that file passes again
// Lifecycle: create → attach(process) → run() → destroy.
// Single attach point: this file's main attaches one OoAuditTamper to the Node process.

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

function OoAuditTamper() {
  this.parent = null;
  this.here = path.dirname(fileURLToPath(import.meta.url));
  this.audit = path.join(this.here, "oo-audit.mjs");
}

OoAuditTamper.prototype.attach = function (parent) {
  if (this.parent) throw new Error("OoAuditTamper attaches once");
  if (!parent || typeof parent.argv === "undefined" || typeof parent.exit !== "function") {
    throw new Error("OoAuditTamper attaches to the Node process");
  }
  this.parent = parent;
};

OoAuditTamper.prototype.destroy = function () {
  this.parent = null;
};

OoAuditTamper.prototype.fail = function (message) {
  console.error("oo-audit-tamper: " + message);
  const err = new Error(message);
  err.tamper = true;
  throw err;
};

OoAuditTamper.prototype.git = function (cwd, args) {
  const result = spawnSync("git", args, { cwd: cwd, encoding: "utf8" });
  if (result.status !== 0) {
    this.fail("git " + args.join(" ") + "\n" + (result.stderr || result.stdout || ""));
  }
  return result.stdout || "";
};

OoAuditTamper.prototype.write = function (file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
};

OoAuditTamper.prototype.runAudit = function (cwd, args) {
  return spawnSync(process.execPath, [path.join(cwd, "tools", "oo-audit.mjs")].concat(args), {
    cwd: cwd,
    encoding: "utf8"
  });
};

OoAuditTamper.prototype.show = function (title, result) {
  console.log("=== " + title + " ===");
  if (result.stdout) process.stdout.write(result.stdout.endsWith("\n") ? result.stdout : result.stdout + "\n");
  if (result.stderr) process.stderr.write(result.stderr.endsWith("\n") ? result.stderr : result.stderr + "\n");
  console.log("exit=" + (result.status === null ? 1 : result.status));
  console.log("");
};

OoAuditTamper.prototype.expectFail = function (title, result) {
  this.show(title, result);
  if (result.status === 0) this.fail(title + " exited 0");
  const text = (result.stdout || "") + (result.stderr || "");
  if (!/count rose|working baseline is above|live counts are above/.test(text)) {
    this.fail(title + " did not report a rise");
  }
};

OoAuditTamper.prototype.expectPass = function (title, result) {
  this.show(title, result);
  if (result.status !== 0) this.fail(title + " exited " + result.status);
};

OoAuditTamper.prototype.run = function () {
  if (!this.parent) throw new Error("OoAuditTamper.run before attach");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "oo-tamper-"));
  this.git(dir, ["init", "-b", "main"]);
  this.git(dir, ["config", "user.email", "oo-audit@example.com"]);
  this.git(dir, ["config", "user.name", "oo-audit"]);

  this.write(path.join(dir, "tools", "oo-audit.mjs"), fs.readFileSync(this.audit));
  this.write(path.join(dir, "tools", "oo-audit-allow.json"), JSON.stringify({
    entries: [{
      file: "js/keep.js",
      start: 1,
      end: 1,
      doc: "tamper fixture",
      reason: "Line kept so the allowlist has one real file."
    }]
  }, null, 2) + "\n");
  this.write(path.join(dir, "js", "keep.js"), "\"use strict\";\nvar kept = 1;\n");
  this.write(path.join(dir, "index.html"), "<!DOCTYPE html><html><body></body></html>\n");
  this.write(path.join(dir, "css", "style.css"), "/* fixture */\n");

  const seeded = this.runAudit(dir, ["--write-baseline"]);
  if (seeded.status !== 0) {
    this.show("seed baseline", seeded);
    this.fail("could not write the fixture baseline");
  }
  this.git(dir, ["add", "."]);
  this.git(dir, ["commit", "-m", "fixture baseline"]);

  const baselinePath = path.join(dir, "tools", "oo-baseline.json");
  const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
  const committed = fs.readFileSync(baselinePath, "utf8");
  baseline.files["js/keep.js"] = baseline.files["js/keep.js"] || {};
  baseline.files["js/keep.js"].visual = (baseline.files["js/keep.js"].visual || 0) + 3;
  baseline.totals.visual += 3;
  baseline.totals.total += 3;
  fs.writeFileSync(baselinePath, JSON.stringify(baseline, null, 2) + "\n");
  this.expectFail("raised baseline", this.runAudit(dir, ["--against-ref", "main"]));

  fs.writeFileSync(baselinePath, committed);
  this.write(path.join(dir, "js", "cheat.js"), "\"use strict\";\nfunction cheat(ctx) {\n  ctx.fillRect(0, 0, 1, 1);\n}\n");
  this.expectFail("added fillRect", this.runAudit(dir, ["--against-ref", "main"]));

  fs.unlinkSync(path.join(dir, "js", "cheat.js"));
  this.expectPass("revert", this.runAudit(dir, ["--against-ref", "main"]));

  console.log("oo-audit-tamper: PASS");
  return 0;
};

const entry = process.argv[1];
if (entry && import.meta.url === pathToFileURL(entry).href) {
  const tamper = new OoAuditTamper();
  let code = 1;
  try {
    tamper.attach(process);
    code = tamper.run();
  } catch (err) {
    if (!err || !err.tamper) throw err;
    code = 1;
  } finally {
    tamper.destroy();
  }
  process.exit(code);
}

export { OoAuditTamper };
