"use strict";

// WalkOverlay shades the live map: green where the sim will let you stand,
// red where it will not, and yellow where collision is open outside the
// island mask. It is its own draw. It does not retouch sky, terrain, or props.
// Nothing is installed unless the address has ?dev=1.
var SF = window.SF || {};
window.SF = SF;

SF.WalkOverlay = {
  owner: "WalkOverlay",
  on: false,
  _attached: false,
  _dev: false,

  attach: function () {
    if (SF.WalkOverlay._attached) return;
    SF.WalkOverlay._attached = true;
    if (!SF.TuningConfig || !SF.TuningConfig.devOn || !SF.TuningConfig.devOn()) return;
    SF.WalkOverlay._dev = true;
    if (!SF.TuningDrawer || !SF.TuningDrawer.addTab) return;
    SF.TuningDrawer.addTab("map", "Map", function (host) {
      var button = document.createElement("button");
      button.className = "tune-bool";
      button.setAttribute("type", "button");
      button.setAttribute("id", "tune-walk");
      function paint() {
        button.setAttribute("aria-pressed", SF.WalkOverlay.on ? "true" : "false");
        button.textContent = "Walk overlay: " + (SF.WalkOverlay.on ? "On" : "Off");
      }
      button.addEventListener("click", function () {
        if (!SF.WalkOverlay._dev) return;
        SF.WalkOverlay.on = !SF.WalkOverlay.on;
        paint();
      });
      paint();
      host.appendChild(button);
    });
  },

  // collisionOpen and outsideMask come from the tile map the sim adopted.
  // walkable is SF.walkable at the cell center, after height, mask, and props.
  classify: function (cell) {
    if (!cell) return "blocked";
    if (cell.collisionOpen && cell.outsideMask) return "stray";
    if (cell.walkable) return "walk";
    return "blocked";
  },

  sample: function (x, y) {
    var map = SF.tileMap;
    var walkable = !!(SF.walkable && SF.walkable(x, y));
    var collisionOpen = walkable;
    var outsideMask = false;
    var tile = 16;
    if (map && map.tile) tile = map.tile;
    if (map && map.blocked && map.w) {
      var tx = Math.floor(x / tile);
      var ty = Math.floor(y / tile);
      if (tx >= 0 && ty >= 0 && tx < map.w && ty < map.h) {
        collisionOpen = map.blocked[ty * map.w + tx] !== 1;
        if (collisionOpen && SF.skyMaskBlocks && map._skyMask) {
          outsideMask = !!SF.skyMaskBlocks(map, x, y);
        } else if (collisionOpen && map.height && map.height[ty * map.w + tx] < 0) {
          outsideMask = true;
        }
      }
    }
    return SF.WalkOverlay.classify({
      collisionOpen: collisionOpen,
      outsideMask: outsideMask,
      walkable: walkable
    });
  },

  paint: function (ctx) {
    if (!SF.WalkOverlay._dev || !SF.WalkOverlay.on || !ctx || !SF.state) return;
    var s = SF.state;
    if (s.mode === "battle" || s.mode === "title") return;
    var zoom = SF.zoom || 1;
    var viewW = SF.viewW || 0;
    var viewH = SF.viewH || 0;
    if (!(viewW > 0) || !(viewH > 0) || !(zoom > 0)) return;
    var map = SF.tileMap;
    var tile = map && map.tile ? map.tile : 16;
    var halfW = viewW / zoom / 2 + tile;
    var halfH = viewH / zoom / 2 + tile;
    var x0 = Math.floor(((s.camX || 0) - halfW) / tile);
    var y0 = Math.floor(((s.camY || 0) - halfH) / tile);
    var x1 = Math.ceil(((s.camX || 0) + halfW) / tile);
    var y1 = Math.ceil(((s.camY || 0) + halfH) / tile);
    var colors = {
      walk: "rgba(40, 220, 90, 0.5)",
      blocked: "rgba(220, 32, 48, 0.42)",
      stray: "rgba(255, 214, 40, 0.88)"
    };
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    var tx, ty, kind;
    for (ty = y0; ty <= y1; ty++) {
      for (tx = x0; tx <= x1; tx++) {
        kind = SF.WalkOverlay.sample(tx * tile + tile / 2, ty * tile + tile / 2);
        ctx.fillStyle = colors[kind] || colors.blocked;
        ctx.fillRect(tx * tile, ty * tile, tile, tile);
        if (kind === "stray") {
          ctx.strokeStyle = "#fff4b0";
          ctx.lineWidth = 2;
          ctx.strokeRect(tx * tile + 1, ty * tile + 1, tile - 2, tile - 2);
        }
      }
    }
    ctx.restore();
  }
};
