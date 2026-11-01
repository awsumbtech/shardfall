"use strict";

// One job: answer prop collision and "what is on screen" without walking
// every prop. A phone frame should only touch the cells around the hero.
(function () {
  var SF = window.SF || {};
  window.SF = SF;

  function PropGrid(cell) {
    this.cell = cell || 64;
    this.dirty = true;
    this.props = null;
    this.rects = null;
    this.count = 0;
    this.buckets = {};
    this.blockers = [];
    this.maxR = 0;
  }

  PropGrid.prototype.ensure = function () {
    var props = SF.PROPS || [];
    var rects = SF.propFootprints || [];
    if (!this.dirty && this.props === props && this.count === props.length && this.rects === rects) return;
    this.rebuild(props, rects);
  };

  PropGrid.prototype.rebuild = function (props, rects) {
    var cell = this.cell;
    var buckets = {};
    var blockers = [];
    var maxR = 0;
    var i, p, r, cx, cy, key, list;
    props = props || [];
    for (i = 0; i < props.length; i++) {
      p = props[i];
      cx = Math.floor(p.x / cell);
      cy = Math.floor(p.y / cell);
      key = cx + "," + cy;
      list = buckets[key];
      if (!list) buckets[key] = list = [];
      list.push(p);
      r = p.block;
      if (!r) continue;
      blockers.push(p);
      if (r > maxR) maxR = r;
    }
    this.props = props;
    this.rects = rects || [];
    this.count = props.length;
    this.buckets = buckets;
    this.blockers = blockers;
    this.maxR = maxR;
    this.dirty = false;
  };

  // Dense props are invisible without their sheet, so they must not block.
  // The cottage rectangle is not a dense prop and always counts.
  function denseVisible(prop) {
    if (!prop.dense) return true;
    return SF.worldSource === "tiles" && SF.propAtlasReady && SF.propAtlasReady();
  }

  SF.propAtlasReady = function () {
    var reg = SF.assets;
    var desc = null;
    if (!reg || typeof reg.lookup !== "function") return false;
    try { desc = reg.lookup("kenmi.prop.cottage", { index: 0 }); } catch (err) { return false; }
    return !!(desc && desc.ready && desc.image && desc.frame);
  };

  PropGrid.prototype.blocks = function (x, y) {
    this.ensure();
    var rects = this.rects;
    var i, rect, p, dx, dy, r, list;
    for (i = 0; i < rects.length; i++) {
      rect = rects[i];
      if (rect && rect.blocks(x, y)) return true;
    }
    var cell = this.cell;
    var maxR = this.maxR;
    var x0 = Math.floor((x - maxR) / cell);
    var x1 = Math.floor((x + maxR) / cell);
    var y0 = Math.floor((y - maxR) / cell);
    var y1 = Math.floor((y + maxR) / cell);
    var cx, cy;
    for (cy = y0; cy <= y1; cy++) {
      for (cx = x0; cx <= x1; cx++) {
        list = this.buckets[cx + "," + cy];
        if (!list) continue;
        for (i = 0; i < list.length; i++) {
          p = list[i];
          r = p.block;
          if (!r || !denseVisible(p)) continue;
          dx = x - p.x;
          dy = y - p.y;
          if (dx * dx + dy * dy < r * r) return true;
        }
      }
    }
    return false;
  };

  PropGrid.prototype.near = function (l, t, r, b) {
    this.ensure();
    var cell = this.cell;
    var x0 = Math.floor(l / cell);
    var x1 = Math.floor(r / cell);
    var y0 = Math.floor(t / cell);
    var y1 = Math.floor(b / cell);
    var out = [];
    var cx, cy, list, i;
    for (cy = y0; cy <= y1; cy++) {
      for (cx = x0; cx <= x1; cx++) {
        list = this.buckets[cx + "," + cy];
        if (!list) continue;
        for (i = 0; i < list.length; i++) out.push(list[i]);
      }
    }
    return out;
  };

  PropGrid.prototype.appendCircles = function (list) {
    this.ensure();
    var i, p, rect;
    for (i = 0; i < this.blockers.length; i++) {
      p = this.blockers[i];
      if (!denseVisible(p)) continue;
      list.push({ x: p.x, y: p.y, r: p.block, kind: "prop" });
    }
    for (i = 0; i < this.rects.length; i++) {
      rect = this.rects[i];
      if (rect && typeof rect.solid === "function") list.push(rect.solid());
    }
    return list;
  };

  SF.PropGrid = PropGrid;
  if (!SF.propGrid) SF.propGrid = new PropGrid(64);
  SF.propFootprints = SF.propFootprints || [];
})();
