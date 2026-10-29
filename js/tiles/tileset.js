"use strict";

// One job: name a ground tile and say which atlas frame that name uses.
// The numbers live in the JSON. This object does not change after it is built.
(function () {
  var SF = window.SF || {};
  window.SF = SF;

  var seq = 1;

  function whole(n, label, min) {
    if (typeof n !== "number" || n !== (n | 0) || n < min) throw new Error("tileset " + label);
    return n;
  }

  function TileSet(data) {
    if (!data || !data.tiles || typeof data.tiles !== "object") throw new Error("tileset is empty");
    var tiles = {};
    var names = [];
    var key, raw, spec;
    for (key in data.tiles) {
      if (!Object.prototype.hasOwnProperty.call(data.tiles, key)) continue;
      raw = data.tiles[key];
      if (!raw || typeof raw.key !== "string" || !raw.key || typeof raw.frame !== "string" || !raw.frame) {
        throw new Error("tileset tile " + key);
      }
      spec = { key: raw.key, frame: raw.frame };
      tiles[key] = spec;
      names.push(key);
    }
    if (!names.length) throw new Error("tileset is empty");
    var stair = data.stair || {};
    this.id = seq++;
    this.tile = whole(data.tile, "tile", 1);
    this.chunk = whole(data.chunk, "chunk", 1);
    this.skirt = whole(data.skirt, "skirt", 1);
    this.pathRadius = whole(data.pathRadius, "pathRadius", 1);
    this.stair = {
      fill: String(stair.fill || ""),
      hi: String(stair.hi || ""),
      lo: String(stair.lo || ""),
      hiPx: whole(stair.hiPx || 0, "stair.hiPx", 0),
      loPx: whole(stair.loPx || 0, "stair.loPx", 0)
    };
    if (!this.stair.fill) throw new Error("tileset stair");
    this.tiles = tiles;
    this.names = names;
    Object.freeze(this.tiles);
    Object.freeze(this.names);
    Object.freeze(this.stair);
    Object.freeze(this);
  }

  TileSet.fromData = function (data) {
    return new TileSet(data);
  };

  TileSet.prototype.get = function (name) {
    return this.tiles[name] || null;
  };

  // The ground JSON is indices, not pixels. A failed read leaves the code ground up.
  SF.prepareTileSet = function () {
    if (!SF.AssetLoader || typeof SF.AssetLoader.json !== "function") return;
    SF.AssetLoader.json("js/tiles/tileset.json").then(function (data) {
      if (!data) return;
      try { SF.tileSet = new SF.TileSet(data); }
      catch (err) { SF.tileSet = null; }
    });
  };

  SF.TileSet = TileSet;
})();
