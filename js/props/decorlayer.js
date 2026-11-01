"use strict";

// One job: load one island's decor file and merge it onto that island's props.
// The layout path and the cottage footprint come from the island config.
// The numbers themselves stay in the layout file.
(function () {
  var SF = window.SF || {};
  window.SF = SF;

  SF.PROP_ISLANDS = {
    emberhold: {
      layout: "js/content/props/emberhold-dense.json",
      art: "kenmi",
      cottage: "cottage"
    }
  };

  function DecorLayer(islandId, config, data) {
    this.islandId = islandId;
    this.config = config || {};
    this.door = data && data.door ? data.door : null;
    this.props = [];
    this.footprints = [];
    var rows = data && data.props ? data.props : [];
    var i, row;
    for (i = 0; i < rows.length; i++) {
      row = rows[i];
      this.props.push({
        kind: row.type,
        art: row.variant,
        x: row.x,
        y: row.y,
        block: row.block || 0,
        dense: true
      });
    }
    if (this.config.cottage && data && data.cottage_rect && SF.RectFootprint) {
      this.footprints.push(new SF.RectFootprint(data.cottage_rect, data.door || null));
    }
  }

  DecorLayer.fromData = function (islandId, config, data) {
    return new DecorLayer(islandId, config, data);
  };

  DecorLayer.prototype.apply = function () {
    if (!SF.PROPS || SF.islandId !== this.islandId) return false;
    var props = SF.PROPS;
    var i, has;
    if (props.__dense !== this.islandId) {
      has = false;
      for (i = 0; i < props.length; i++) {
        if (props[i].dense) { has = true; break; }
      }
      if (!has) {
        for (i = 0; i < this.props.length; i++) props.push(this.props[i]);
      }
      props.__dense = this.islandId;
    }
    SF.propFootprints = this.footprints;
    if (SF.ISLANDS && SF.ISLANDS[this.islandId]) SF.ISLANDS[this.islandId].props = props;
    if (SF.notePropIndex) SF.notePropIndex();
    return true;
  };

  DecorLayer.load = function () {
    var islands = SF.PROP_ISLANDS || {};
    var read = SF.AssetLoader && SF.AssetLoader.json;
    var ids = Object.keys(islands);
    var jobs = [];
    if (typeof read !== "function") return Promise.resolve([]);
    ids.forEach(function (id) {
      var cfg = islands[id];
      if (!cfg || !cfg.layout) return;
      jobs.push(read(cfg.layout).then(function (data) {
        if (!data || !data.props) return null;
        if (!SF.decorLayers) SF.decorLayers = {};
        SF.decorLayers[id] = DecorLayer.fromData(id, cfg, data);
        if (SF.islandId === id) SF.decorLayers[id].apply();
        return id;
      }));
    });
    return Promise.all(jobs);
  };

  SF.syncPropLayer = function (id) {
    var layer = SF.decorLayers && SF.decorLayers[id];
    if (layer && SF.islandId === id) {
      layer.apply();
      return;
    }
    if (!layer) {
      SF.propFootprints = [];
      if (SF.notePropIndex) SF.notePropIndex();
    }
  };

  SF.installPropArt = function () {
    if (SF._propArtInstalled) return SF.propRenderer || null;
    if (!SF.PropRegistry || !SF.PropRenderer) return null;
    SF._propArtInstalled = true;
    var reg = new SF.PropRegistry(SF.PROP_ROWS || []);
    var ren = new SF.PropRenderer(reg);
    SF.propRegistry = reg;
    SF.propRenderer = ren;
    if (!SF.propGrid && SF.PropGrid) SF.propGrid = new SF.PropGrid(64);
    SF.notePropIndex = function () {
      SF.propEpoch = (SF.propEpoch || 0) + 1;
      if (SF.propGrid) SF.propGrid.dirty = true;
    };
    if (typeof SF.drawPropArt === "function") {
      var origArt = SF.drawPropArt;
      SF.drawPropArt = function (ctx, prop, lit) {
        if (ren.draw(ctx, prop, lit)) return true;
        return origArt(ctx, prop, lit);
      };
    }
    if (typeof SF.drawChest === "function") {
      var origChest = SF.drawChest;
      SF.drawChest = function (ctx, extra) {
        if (ren.drawChest(ctx, extra)) return;
        return origChest(ctx, extra);
      };
    }
    if (typeof SF.mountIsland === "function" && !SF._propMountWrapped) {
      SF._propMountWrapped = true;
      var mount = SF.mountIsland;
      SF.mountIsland = function (id) {
        var result = mount.apply(this, arguments);
        if (SF.syncPropLayer) SF.syncPropLayer(id);
        return result;
      };
    }
    DecorLayer.load();
    return ren;
  };

  SF.DecorLayer = DecorLayer;
  SF.installPropArt();
})();
