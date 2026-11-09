"use strict";

// BugReport remembers the last 50 console errors and warnings, then one tap
// bundles a screenshot, where you are, the version, and the tuning overrides.
// The console hook is installed only when the address has ?dev=1.
var SF = window.SF || {};
window.SF = SF;

SF.BugReport = {
  owner: "BugReport",
  limit: 50,
  logs: [],
  _attached: false,
  _dev: false,

  attach: function () {
    if (SF.BugReport._attached) return;
    SF.BugReport._attached = true;
    if (!SF.TuningConfig || !SF.TuningConfig.devOn || !SF.TuningConfig.devOn()) return;
    SF.BugReport._dev = true;
    SF.BugReport._hookConsole();
    if (!SF.TuningDrawer || !SF.TuningDrawer.addTab) return;
    SF.TuningDrawer.addTab("bug", "Bug", function (host) {
      var capture = document.createElement("button");
      var copy = document.createElement("button");
      var save = document.createElement("button");
      var note = document.createElement("p");
      capture.className = "tune-bool";
      copy.className = "tune-bool";
      save.className = "tune-bool";
      capture.setAttribute("type", "button");
      copy.setAttribute("type", "button");
      save.setAttribute("type", "button");
      capture.setAttribute("id", "tune-bug-capture");
      copy.setAttribute("id", "tune-bug-copy");
      save.setAttribute("id", "tune-bug-download");
      capture.textContent = "Capture report";
      copy.textContent = "Copy summary";
      save.textContent = "Download report";
      note.setAttribute("id", "tune-bug-note");
      note.hidden = true;
      capture.addEventListener("click", function () {
        SF.BugReport._last = SF.BugReport.capture();
        note.hidden = false;
        note.textContent = "Report ready.";
      });
      copy.addEventListener("click", function () {
        var report = SF.BugReport._last || SF.BugReport.capture();
        var text = SF.BugReport.summary(report);
        var clip = typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText;
        if (clip) clip.call(navigator.clipboard, text);
        note.hidden = false;
        note.textContent = "Copied.";
      });
      save.addEventListener("click", function () {
        var report = SF.BugReport._last || SF.BugReport.capture();
        SF.BugReport.download(report);
        note.hidden = false;
        note.textContent = "Downloaded.";
      });
      host.appendChild(capture);
      host.appendChild(copy);
      host.appendChild(save);
      host.appendChild(note);
    });
  },

  _hookConsole: function () {
    if (SF.BugReport._hooked || typeof console === "undefined") return;
    SF.BugReport._hooked = true;
    ["error", "warn"].forEach(function (level) {
      var orig = console[level];
      if (typeof orig !== "function") return;
      console[level] = function () {
        SF.BugReport.push(level, arguments);
        return orig.apply(console, arguments);
      };
    });
  },

  push: function (level, args) {
    var parts = [];
    var i;
    for (i = 0; i < args.length; i++) parts.push(String(args[i]));
    SF.BugReport.logs.push({ level: level, text: parts.join(" ") });
    if (SF.BugReport.logs.length > SF.BugReport.limit) SF.BugReport.logs.shift();
  },

  capture: function () {
    var s = SF.state;
    var p = s && s.player;
    var png = "";
    if (SF.view && SF.view.toDataURL) {
      try { png = SF.view.toDataURL("image/png"); }
      catch (err) { png = ""; }
    }
    return {
      version: SF.VERSION || "",
      island: (s && s.island) || SF.islandId || "",
      x: p ? p.x : null,
      y: p ? p.y : null,
      mode: s ? s.mode : "",
      tune: SF.TuningConfig && SF.TuningConfig.overrides ? SF.TuningConfig.overrides() : {},
      logs: SF.BugReport.logs.slice(-SF.BugReport.limit),
      png: png
    };
  },

  summary: function (report) {
    report = report || {};
    var lines = [
      "Shardfall " + (report.version || ""),
      "Where: " + (report.island || "unknown") + " " + report.x + "," + report.y + " (" + (report.mode || "") + ")",
      "Tuning: " + JSON.stringify(report.tune || {}),
      "Recent console:"
    ];
    var logs = report.logs || [];
    var i;
    for (i = 0; i < logs.length; i++) lines.push(logs[i].level + ": " + logs[i].text);
    if (!logs.length) lines.push("(none)");
    return lines.join("\n");
  },

  bundle: function (report) {
    return JSON.stringify(report || SF.BugReport.capture());
  },

  download: function (report) {
    var text = SF.BugReport.bundle(report);
    if (typeof document === "undefined" || !document.createElement) return text;
    var link = document.createElement("a");
    link.setAttribute("href", "data:application/json;charset=utf-8," + encodeURIComponent(text));
    link.setAttribute("download", "shardfall-bug.json");
    document.body.appendChild(link);
    if (link.click) link.click();
    if (link.parentNode) link.parentNode.removeChild(link);
    return text;
  }
};
