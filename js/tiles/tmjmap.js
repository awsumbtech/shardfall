"use strict";

// One job: read the hand-authored Emberhold map and answer the world from it.
// Indices only. It does not draw.
(function () {
  var SF = window.SF || {};
  window.SF = SF;

  var GID_MASK = 0x1fffffff;

  function TmjMap(doc) {
    if (!doc || !doc.width || !doc.height || !doc.layers) throw new Error("tile map is empty");
    this.w = doc.width;
    this.h = doc.height;
    this.tile = doc.tilewidth || 16;
    this.chunk = 16;
    var n = this.w * this.h;
    this.blocked = new Uint8Array(n);
    this.height = new Int8Array(n);
    this.stair = new Uint8Array(n);
    this.path = new Uint8Array(n);
    this.layers = [];
    this.faces = [];
    this.overlay = [];
    this.zones = [];
    this.markers = [];
    this.frames = {};
    this.needed = [];
    this._index(doc.tilesets || []);
    this._layers(doc.layers);
    this._collect();
  }

  function sheetKey(name) {
    if (name === "kenmi-fx") return "ground.fx";
    if (name === "meta") return null;
    if (name.indexOf("kenmi-") === 0) return "kenmi.tile." + name.slice(6);
    return null;
  }

  TmjMap.prototype._index = function (tilesets) {
    var list = tilesets.slice().sort(function (a, b) { return a.firstgid - b.firstgid; });
    var i, tileset, key, cols, first, local, gid, c, r;
    this._ranges = [];
    for (i = 0; i < list.length; i++) {
      tileset = list[i];
      key = sheetKey(tileset.name);
      cols = tileset.columns || 1;
      first = tileset.firstgid;
      this._ranges.push({
        first: first,
        last: first + (tileset.tilecount || 0),
        cols: cols,
        key: key,
        meta: tileset.name === "meta" ? first : 0
      });
      if (!key) continue;
      for (local = 0; local < (tileset.tilecount || 0); local++) {
        gid = first + local;
        c = local % cols;
        r = (local / cols) | 0;
        this.frames[gid] = { key: key, frame: "r" + r + "c" + c };
      }
    }
  };

  TmjMap.prototype._metaFirst = function () {
    var i;
    for (i = 0; i < this._ranges.length; i++) if (this._ranges[i].meta) return this._ranges[i].meta;
    return 0;
  };

  function walkLayers(layers, visit) {
    var i, layer;
    for (i = 0; i < layers.length; i++) {
      layer = layers[i];
      if (layer.type === "group") walkLayers(layer.layers || [], visit);
      else visit(layer);
    }
  }

  function roleOf(layer) {
    var props = layer.properties || [];
    var i;
    for (i = 0; i < props.length; i++) if (props[i].name === "role") return props[i].value;
    return "";
  }

  TmjMap.prototype._layers = function (layers) {
    var self = this;
    var meta = this._metaFirst();
    walkLayers(layers, function (layer) {
      if (layer.type === "objectgroup" && layer.name === "zones") {
        (layer.objects || []).forEach(function (obj) {
          self.zones.push({
            id: obj.name,
            x: obj.x,
            y: obj.y,
            w: obj.width,
            h: obj.height
          });
        });
        return;
      }
      if (layer.type === "objectgroup" && layer.name === "markers") {
        (layer.objects || []).forEach(function (obj) {
          self.markers.push({ kind: obj.type, name: obj.name, x: obj.x, y: obj.y });
        });
        return;
      }
      if (layer.type !== "tilelayer" || !layer.data) return;
      if (layer.name === "collision") {
        var i;
        for (i = 0; i < layer.data.length; i++) self.blocked[i] = layer.data[i] ? 1 : 0;
        return;
      }
      if (layer.name === "height") {
        var g, v;
        for (g = 0; g < layer.data.length; g++) {
          v = layer.data[g] & GID_MASK;
          if (!v) self.height[g] = -1;
          else if (meta && v === meta + 5) self.stair[g] = 1;
          else if (meta && v >= meta + 1 && v <= meta + 4) self.height[g] = v - (meta + 1);
          else self.height[g] = 0;
        }
        return;
      }
      var data = new Uint16Array(layer.data.length);
      var role = roleOf(layer);
      var group = "level";
      var p, gid;
      for (p = 0; p < layer.data.length; p++) {
        gid = layer.data[p] & GID_MASK;
        data[p] = gid;
        if (gid && self.frames[gid]) self.needed.push(self.frames[gid]);
        if (gid && layer.name.slice(-5) === "/path") self.path[p] = 1;
      }
      self.layers.push({ name: layer.name, role: role, group: group, data: data });
    });
    var seen = {};
    var need = [];
    var k, spec;
    for (k = 0; k < this.needed.length; k++) {
      spec = this.needed[k];
      var id = spec.key + "\n" + spec.frame;
      if (seen[id]) continue;
      seen[id] = 1;
      need.push(spec);
    }
    this.needed = need;
  };

  TmjMap.prototype._collect = function () {
    var self = this;
    var tile = this.tile;
    this.layers.forEach(function (layer) {
      var cliff = layer.role === "cliffs";
      var over = layer.name === "bridges" || layer.name.indexOf("overlay") === 0;
      if (!cliff && !over) return;
      var i, gid, x, y, cell;
      for (i = 0; i < layer.data.length; i++) {
        gid = layer.data[i];
        if (!gid || !self.frames[gid]) continue;
        x = (i % self.w) * tile;
        y = ((i / self.w) | 0) * tile;
        cell = {
          x: x,
          y: y,
          gid: gid,
          sort: over ? y : y + tile - 0.25
        };
        if (over) self.overlay.push(cell);
        else self.faces.push(cell);
      }
    });
  };

  TmjMap.prototype.framesReady = function (registry) {
    if (!registry || typeof registry.lookup !== "function" || !this.needed.length) return false;
    var i, spec, desc;
    for (i = 0; i < this.needed.length; i++) {
      spec = this.needed[i];
      try { desc = registry.lookup(spec.key, { name: spec.frame }); }
      catch (err) { return false; }
      if (!desc || !desc.ready || !desc.image || !desc.frame) return false;
    }
    return true;
  };

  TmjMap.prototype._cell = function (x, y) {
    var tx = Math.floor(x / this.tile);
    var ty = Math.floor(y / this.tile);
    if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) return -1;
    return ty * this.w + tx;
  };

  TmjMap.prototype.isWalkable = function (x, y) {
    var i = this._cell(x, y);
    if (i < 0) return false;
    return !this.blocked[i];
  };

  TmjMap.prototype.heightAt = function (x, y) {
    var i = this._cell(x, y);
    if (i < 0 || this.height[i] < 0) return 0;
    return this.height[i];
  };

  TmjMap.prototype.zoneAt = function (x, y) {
    var best = null;
    var bestA = Infinity;
    var i, zone, area;
    for (i = 0; i < this.zones.length; i++) {
      zone = this.zones[i];
      if (!zone.id || zone.id.indexOf("terrace:") === 0) continue;
      if (x < zone.x || y < zone.y || x >= zone.x + zone.w || y >= zone.y + zone.h) continue;
      area = zone.w * zone.h;
      if (area < bestA) {
        bestA = area;
        best = zone;
      }
    }
    if (!best) return { id: "hush", name: "The Hush" };
    return { id: best.id, name: best.id };
  };

  TmjMap.prototype.badFooting = function (x, y) {
    var i = this._cell(x, y);
    if (i < 0) return true;
    return !!(this.blocked[i] || this.stair[i] || this.path[i]);
  };

  // Open cells reached by walking from a tile. Dash gaps stay separate.
  TmjMap.prototype.reachableFrom = function (tx, ty) {
    var w = this.w;
    var h = this.h;
    var seen = new Uint8Array(w * h);
    tx = tx | 0;
    ty = ty | 0;
    if (tx < 0 || ty < 0 || tx >= w || ty >= h || this.blocked[ty * w + tx]) return seen;
    var q = [ty * w + tx];
    var qi = 0;
    seen[q[0]] = 1;
    var i, x, y, n;
    while (qi < q.length) {
      i = q[qi++];
      x = i % w;
      y = (i / w) | 0;
      if (x + 1 < w) {
        n = i + 1;
        if (!seen[n] && !this.blocked[n]) { seen[n] = 1; q.push(n); }
      }
      if (x > 0) {
        n = i - 1;
        if (!seen[n] && !this.blocked[n]) { seen[n] = 1; q.push(n); }
      }
      if (y + 1 < h) {
        n = i + w;
        if (!seen[n] && !this.blocked[n]) { seen[n] = 1; q.push(n); }
      }
      if (y > 0) {
        n = i - w;
        if (!seen[n] && !this.blocked[n]) { seen[n] = 1; q.push(n); }
      }
    }
    return seen;
  };

  TmjMap.load = function (doc) {
    return new TmjMap(doc);
  };

  SF.TmjMap = TmjMap;
})();
