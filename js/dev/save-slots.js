"use strict";

// DevSaves keeps quick slots apart from the real save, and can export or
// import a save as JSON. A bad import is refused and does not touch the
// real save key. Nothing is installed unless the address has ?dev=1.
var SF = window.SF || {};
window.SF = SF;

SF.DevSaves = {
  owner: "DevSaves",
  slots: 3,
  prefix: "shardfall.devsave.",
  _attached: false,
  _dev: false,

  attach: function () {
    if (SF.DevSaves._attached) return;
    SF.DevSaves._attached = true;
    if (!SF.TuningConfig || !SF.TuningConfig.devOn || !SF.TuningConfig.devOn()) return;
    SF.DevSaves._dev = true;
    if (!SF.TuningDrawer || !SF.TuningDrawer.addTab) return;
    SF.TuningDrawer.addTab("saves", "Saves", function (host) {
      SF.DevSaves.fill(host);
    });
  },

  storage: function () {
    try {
      if (typeof localStorage === "undefined") return null;
      return localStorage;
    } catch (err) {
      return null;
    }
  },

  validate: function (data) {
    if (!data || typeof data !== "object") return "That is not a save.";
    if (data.v !== 1 && data.v !== 2 && data.v !== 3 && data.v !== 4) return "That save version is not one Shardfall can read.";
    if (!data.player || typeof data.player.x !== "number" || typeof data.player.y !== "number") return "That save has no position.";
    return "";
  },

  saveSlot: function (n) {
    var store, data;
    if (!SF.DevSaves._dev || !SF.state || !SF.exportState) return false;
    store = SF.DevSaves.storage();
    if (!store) return false;
    data = SF.exportState(SF.state);
    try { store.setItem(SF.DevSaves.prefix + n, JSON.stringify(data)); }
    catch (err) { return false; }
    return true;
  },

  loadSlot: function (n) {
    var store, raw;
    if (!SF.DevSaves._dev) return { ok: false, error: "Dev mode is off." };
    store = SF.DevSaves.storage();
    if (!store) return { ok: false, error: "No storage." };
    try { raw = store.getItem(SF.DevSaves.prefix + n); }
    catch (err) { return { ok: false, error: "Could not read that slot." }; }
    if (!raw) return { ok: false, error: "That slot is empty." };
    return SF.DevSaves.importText(raw);
  },

  exportText: function () {
    if (!SF.state || !SF.exportState) return "";
    return JSON.stringify(SF.exportState(SF.state), null, 2);
  },

  importText: function (text) {
    var data, error, applied;
    try { data = JSON.parse(text); }
    catch (err) { return { ok: false, error: "That text is not JSON." }; }
    error = SF.DevSaves.validate(data);
    if (error) return { ok: false, error: error };
    if (!SF.DevSaves._dev) return { ok: false, error: "Dev mode is off." };
    if (!SF.state || !SF.applySave) return { ok: false, error: "No game is running." };
    applied = SF.applySave(SF.state, data);
    if (!applied) return { ok: false, error: "The game rejected that save." };
    if (SF.syncUI) SF.syncUI();
    return { ok: true };
  },

  download: function (name, text) {
    var link, url;
    if (typeof document === "undefined" || !document.createElement) return text;
    link = document.createElement("a");
    url = "data:application/json;charset=utf-8," + encodeURIComponent(text || "");
    link.setAttribute("href", url);
    link.setAttribute("download", name);
    link.setAttribute("id", "tune-save-download");
    document.body.appendChild(link);
    if (link.click) link.click();
    if (link.parentNode) link.parentNode.removeChild(link);
    return text;
  },

  fill: function (host) {
    var n, row, save, load, box, file, paste, note, actions, exp, imp;
    function status(text) {
      note.hidden = false;
      note.textContent = text;
    }
    for (n = 1; n <= SF.DevSaves.slots; n++) {
      row = document.createElement("div");
      row.className = "tune-actions";
      save = document.createElement("button");
      load = document.createElement("button");
      save.className = "tune-bool";
      load.className = "tune-bool";
      save.setAttribute("type", "button");
      load.setAttribute("type", "button");
      save.setAttribute("id", "tune-slot-save-" + n);
      load.setAttribute("id", "tune-slot-load-" + n);
      save.textContent = "Save " + n;
      load.textContent = "Load " + n;
      save.addEventListener("click", (function (slot) {
        return function () {
          status(SF.DevSaves.saveSlot(slot) ? "Saved slot " + slot + "." : "Could not save slot " + slot + ".");
        };
      })(n));
      load.addEventListener("click", (function (slot) {
        return function () {
          var result = SF.DevSaves.loadSlot(slot);
          status(result.ok ? "Loaded slot " + slot + "." : result.error);
        };
      })(n));
      row.appendChild(save);
      row.appendChild(load);
      host.appendChild(row);
    }
    box = document.createElement("textarea");
    box.setAttribute("id", "tune-save-text");
    box.setAttribute("aria-label", "Save JSON");
    actions = document.createElement("div");
    actions.className = "tune-actions";
    exp = document.createElement("button");
    imp = document.createElement("button");
    file = document.createElement("input");
    note = document.createElement("p");
    exp.className = "tune-bool";
    imp.className = "tune-bool";
    exp.setAttribute("type", "button");
    imp.setAttribute("type", "button");
    exp.setAttribute("id", "tune-save-export");
    imp.setAttribute("id", "tune-save-import");
    exp.textContent = "Copy save";
    imp.textContent = "Import text";
    file.setAttribute("type", "file");
    file.setAttribute("id", "tune-save-file");
    file.setAttribute("accept", "application/json,.json");
    note.setAttribute("id", "tune-save-note");
    note.className = "tune-note-line";
    note.hidden = true;
    exp.addEventListener("click", function () {
      var text = SF.DevSaves.exportText();
      box.value = text;
      SF.DevSaves.download("shardfall-save.json", text);
      var clip = typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText;
      if (clip) clip.call(navigator.clipboard, text);
      status("Copied the save.");
    });
    imp.addEventListener("click", function () {
      var result = SF.DevSaves.importText(box.value || "");
      status(result.ok ? "Imported." : result.error);
    });
    file.addEventListener("change", function () {
      var picked = file.files && file.files[0];
      if (!picked || !picked.text) {
        status("Choose a .json save.");
        return;
      }
      picked.text().then(function (text) {
        box.value = text;
        var result = SF.DevSaves.importText(text);
        status(result.ok ? "Imported." : result.error);
      });
    });
    actions.appendChild(exp);
    actions.appendChild(imp);
    host.appendChild(box);
    host.appendChild(actions);
    host.appendChild(file);
    host.appendChild(note);
  }
};
