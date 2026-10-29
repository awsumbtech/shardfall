"use strict";

// One job: look up art by key. A key with no loaded image returns the
// code-drawn sprite from js/art. The rest of the game never sees a file path.
(function () {
  var SF = window.SF || {};
  window.SF = SF;

  function AssetRegistry(manifest) {
    this.manifest = manifest || (SF.AssetManifest ? new SF.AssetManifest() : { get: function () { return null; } });
    this.images = {};
    this.sheets = {};
  }

  AssetRegistry.prototype.setManifest = function (manifest) {
    this.manifest = manifest || new SF.AssetManifest();
    this.sheets = {};
  };

  AssetRegistry.prototype.noteImage = function (path, image) {
    if (!path || !image) return;
    this.images[path] = image;
    this.sheets = {};
  };

  AssetRegistry.prototype.noteImages = function (map) {
    if (!map) return;
    var path;
    for (path in map) {
      if (Object.prototype.hasOwnProperty.call(map, path)) this.noteImage(path, map[path]);
    }
  };

  AssetRegistry.prototype.sheetFor = function (entry) {
    if (!entry) return null;
    var image = this.images[entry.atlas];
    if (!image || !SF.SpriteSheet) return null;
    var cached = this.sheets[entry.key];
    if (cached && cached.image === image) return cached;
    var sheet = new SF.SpriteSheet(image, entry);
    this.sheets[entry.key] = sheet;
    return sheet;
  };

  // Always returns a descriptor. ready is false until that key's image is loaded.
  // codeId is the js/art sprite used in the meantime.
  AssetRegistry.prototype.lookup = function (key, query) {
    query = query || {};
    var entry = this.manifest && this.manifest.get ? this.manifest.get(key) : null;
    var codeId = entry && entry.code ? entry.code : key;
    var index = query.index;
    if (index == null) index = query.frame;
    if (index == null) index = 0;
    var desc = {
      key: key,
      codeId: codeId,
      pose: query.pose || "walk",
      facing: query.facing || "down",
      index: index | 0,
      flip: !!query.flip,
      ready: false,
      image: null,
      frame: null,
      anchor: entry && entry.anchor ? entry.anchor : null
    };
    if (!entry || !entry.atlas) return desc;
    var image = this.images[entry.atlas];
    if (!image) return desc;
    var sheet = this.sheetFor(entry);
    if (!sheet) return desc;
    var frame = null;
    if (query.name) frame = sheet.frame(query.name);
    if (!frame) frame = sheet.frame(desc.index);
    if (!frame) return desc;
    desc.ready = true;
    desc.image = image;
    desc.frame = frame;
    if (query.flip) desc.flip = true;
    return desc;
  };

  // The existing code-drawn canvas for a descriptor, or null when Art is absent.
  AssetRegistry.prototype.codeCanvas = function (desc) {
    if (!desc || !window.Art || typeof Art.frameOf !== "function") return null;
    try {
      return Art.frameOf(desc.codeId, desc.pose, desc.facing, desc.index);
    } catch (err) {
      return null;
    }
  };

  SF.AssetRegistry = AssetRegistry;
})();
