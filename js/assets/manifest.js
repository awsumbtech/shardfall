"use strict";

// One job: the declarative list of art keys. Each key names an atlas
// and the frame rects (or a grid) cut from it. The list is read from an
// optional JSON file. A missing or broken file is an empty list.
(function () {
  var SF = window.SF || {};
  window.SF = SF;

  function anchorOf(raw) {
    if (!raw) return null;
    if (typeof raw.length === "number" && raw.length >= 2 && typeof raw[0] === "number") {
      return { x: raw[0], y: raw[1] };
    }
    if (typeof raw.x === "number" && typeof raw.y === "number") return { x: raw.x, y: raw.y };
    return null;
  }

  function frameOf(raw, index) {
    if (!raw || !(raw.w > 0) || !(raw.h > 0)) return null;
    var name = raw.name || raw.id || ("f" + index);
    return {
      name: String(name),
      x: raw.x || 0,
      y: raw.y || 0,
      w: raw.w,
      h: raw.h
    };
  }

  function gridOf(raw) {
    if (!raw || !(raw.cols > 0) || !(raw.rows > 0) || !(raw.w > 0) || !(raw.h > 0)) return null;
    return {
      x: raw.x || 0,
      y: raw.y || 0,
      cols: raw.cols | 0,
      rows: raw.rows | 0,
      w: raw.w,
      h: raw.h,
      names: raw.names || null
    };
  }

  // { "entries": [ { "key", "atlas", "code", "anchor", "frames": [{ "name", "x", "y", "w", "h" }], "grid" } ] }
  // "entries" may also be a map of key -> source. "code" is the js/art id
  // used when that atlas is not loaded. It defaults to the key.
  function normalize(key, raw) {
    if (!key || !raw || typeof raw !== "object") return null;
    var atlas = typeof raw.atlas === "string" ? raw.atlas : "";
    if (!atlas) return null;
    var frames = [];
    var list = raw.frames;
    var i, frame;
    if (list && typeof list.length === "number") {
      for (i = 0; i < list.length; i++) {
        frame = frameOf(list[i], frames.length);
        if (frame) frames.push(frame);
      }
    }
    return {
      key: String(key),
      atlas: atlas,
      code: typeof raw.code === "string" && raw.code ? raw.code : String(key),
      anchor: anchorOf(raw.anchor),
      frames: frames,
      grid: gridOf(raw.grid)
    };
  }

  function AssetManifest(data) {
    this.entries = {};
    if (data) this.addAll(data);
  }

  AssetManifest.URL = "assets/atlas/manifest.json";

  AssetManifest.prototype.get = function (key) {
    return this.entries[key] || null;
  };

  AssetManifest.prototype.keys = function () {
    return Object.keys(this.entries);
  };

  AssetManifest.prototype.add = function (key, raw) {
    var entry = normalize(key, raw);
    if (!entry) return null;
    this.entries[entry.key] = entry;
    return entry;
  };

  AssetManifest.prototype.addAll = function (data) {
    var list = data;
    if (data && data.entries) list = data.entries;
    var i, key;
    if (!list || typeof list !== "object") return this;
    if (Array.isArray(list)) {
      for (i = 0; i < list.length; i++) {
        if (list[i] && list[i].key) this.add(list[i].key, list[i]);
      }
      return this;
    }
    for (key in list) {
      if (Object.prototype.hasOwnProperty.call(list, key)) this.add(key, list[key]);
    }
    return this;
  };

  AssetManifest.prototype.atlasList = function () {
    var seen = {};
    var out = [];
    var keys = this.keys();
    var i, atlas;
    for (i = 0; i < keys.length; i++) {
      atlas = this.entries[keys[i]].atlas;
      if (!atlas || seen[atlas]) continue;
      seen[atlas] = 1;
      out.push(atlas);
    }
    return out;
  };

  AssetManifest.fromData = function (data) {
    return new AssetManifest(data);
  };

  // Resolves to a manifest. A missing file, bad JSON, or a thrown read is empty.
  AssetManifest.load = function (url, read) {
    var src = url || AssetManifest.URL;
    var fetchJson = read;
    if (typeof fetchJson !== "function" && SF.AssetLoader && typeof SF.AssetLoader.json === "function") {
      fetchJson = function (file) { return SF.AssetLoader.json(file); };
    }
    if (typeof fetchJson !== "function") return Promise.resolve(new AssetManifest());
    return Promise.resolve().then(function () {
      return fetchJson(src);
    }).then(function (data) {
      if (!data || typeof data !== "object") return new AssetManifest();
      return AssetManifest.fromData(data);
    }).catch(function () {
      return new AssetManifest();
    });
  };

  SF.AssetManifest = AssetManifest;
})();
