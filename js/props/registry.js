"use strict";

// One job: map a prop's type and variant to an atlas key and its draw flags.
// Variant choice for the props already on the map goes through Art.fieldProp,
// so the same tuft still thins out and the same tree keeps its variant.
(function () {
  var SF = window.SF || {};
  window.SF = SF;

  function PropRegistry(rows) {
    this.byId = {};
    var list = rows || SF.PROP_ROWS || [];
    var i, row, copy;
    for (i = 0; i < list.length; i++) {
      row = list[i];
      if (!row || !row.id) continue;
      copy = {
        id: row.id,
        key: "kenmi.prop." + row.id,
        file: row.file,
        rect: row.rect,
        anchor: row.anchor,
        canopy: !!row.canopy,
        flip: !!row.flip,
        cold: !!row.cold,
        frames: row.frames || 1,
        dx: row.dx || (row.rect ? row.rect[2] : 0),
        rate: row.rate || 0,
        smoke: row.smoke || null
      };
      this.byId[copy.id] = copy;
    }
  }

  PropRegistry.prototype.get = function (id) {
    if (!id) return null;
    return this.byId[id] || null;
  };

  // Flower colour follows the same string test the field has always used.
  function flowerId(prop) {
    var c = prop.c || "";
    if (c.indexOf("9af") !== -1 || c.indexOf("c8be") !== -1) return "flower_tide";
    if (c.indexOf("ffb") !== -1 || c.indexOf("ffe") !== -1 || c.indexOf("e7a") !== -1) return "flower_gold";
    if (c.indexOf("c6b6") !== -1 || c.indexOf("d8c6") !== -1) return "blossom";
    return "flower";
  }

  PropRegistry.prototype.idFor = function (prop, lit) {
    if (!prop) return "";
    if (prop.art) return prop.art;
    var kind = prop.kind;
    if (kind === "airship") return "skiff";
    if (kind === "stake") return lit ? "lamp_lit" : "lamp_cold";
    if (kind === "flower") return flowerId(prop);
    if (window.Art && Art.fieldProp) return Art.fieldProp(prop, SF.islandId);
    return kind || "";
  };

  SF.PropRegistry = PropRegistry;
})();
