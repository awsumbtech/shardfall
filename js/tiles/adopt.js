"use strict";

// One job: pick a single Emberhold world once the atlas load has settled.
// Tiles and the old shapes are never both in charge.
(function () {
  var SF = window.SF || {};
  window.SF = SF;

  var shapeWalk = null;
  var shapeZone = null;

  function propBlocks(x, y) {
    var props = SF.PROPS;
    var i, p, r, dx, dy;
    if (!props) return false;
    for (i = 0; i < props.length; i++) {
      p = props[i];
      r = p.block;
      if (!r) continue;
      dx = x - p.x;
      dy = y - p.y;
      if (dx * dx + dy * dy < r * r) return true;
    }
    return false;
  }

  function installWraps() {
    if (shapeWalk) return;
    shapeWalk = SF.walkable;
    shapeZone = SF.zoneAt;
    SF.walkable = function (x, y) {
      if (SF.worldSource === "tiles" && SF.islandId === "emberhold" && SF.tileMap) {
        if (!SF.tileMap.isWalkable(x, y)) return false;
        if (propBlocks(x, y)) return false;
        return true;
      }
      return shapeWalk ? shapeWalk(x, y) : false;
    };
    SF.zoneAt = function (x, y) {
      if (SF.worldSource === "tiles" && SF.islandId === "emberhold" && SF.tileMap) {
        return SF.tileMap.zoneAt(x, y);
      }
      return shapeZone ? shapeZone(x, y) : { id: "hush", name: "The Hush" };
    };
    SF.heightAt = function (x, y) {
      if (SF.worldSource === "tiles" && SF.islandId === "emberhold" && SF.tileMap) {
        return SF.tileMap.heightAt(x, y);
      }
      return 0;
    };
  }

  function byId(list, id) {
    var i;
    if (!list) return null;
    for (i = 0; i < list.length; i++) {
      if (list[i].id === id || list[i].name === id) return list[i];
    }
    return null;
  }

  function place(list, id, x, y) {
    var item = byId(list, id);
    if (!item) return;
    item.x = x;
    item.y = y;
  }

  SF.applyTileMarkers = function (map) {
    if (!map) return;
    var i, mark, pack;
    pack = SF.ISLANDS && SF.ISLANDS.emberhold;
    for (i = 0; i < map.markers.length; i++) {
      mark = map.markers[i];
      if (mark.kind === "npc") place(SF.NPCS, mark.name, mark.x, mark.y);
      else if (mark.kind === "shard" || mark.kind === "pickup") place(SF.PICKUPS, mark.name, mark.x, mark.y);
      else if (mark.kind === "text") place(SF.TEXTS, mark.name, mark.x, mark.y);
      else if (mark.kind === "hook") place(SF.HOOKS, mark.name, mark.x, mark.y);
      else if (mark.kind === "checkpoint") {
        if (mark.name === "wake" && SF.WAKE) { SF.WAKE.x = mark.x; SF.WAKE.y = mark.y; }
        else if (mark.name === "lamp" && SF.LAMP) { SF.LAMP.x = mark.x; SF.LAMP.y = mark.y; }
        else if (mark.name === "dock" && SF.DOCKS && SF.DOCKS.emberhold) {
          SF.DOCKS.emberhold.x = mark.x;
          SF.DOCKS.emberhold.y = mark.y;
        } else place(SF.EXTRAS, mark.name, mark.x, mark.y);
      } else if (mark.kind === "prop" && mark.name === "cottage") {
        place(SF.PROPS, "cottage", mark.x, mark.y);
      }
      if (pack) {
        if (mark.kind === "checkpoint" && mark.name === "wake" && pack.wake) {
          pack.wake.x = mark.x;
          pack.wake.y = mark.y;
        }
        if (mark.kind === "checkpoint" && mark.name === "lamp" && pack.lamp) {
          pack.lamp.x = mark.x;
          pack.lamp.y = mark.y;
        }
      }
    }
  };

  function parseMoves(preview) {
    var out = [];
    var list = preview && preview.props || [];
    var i, why, found, fromX, fromY;
    for (i = 0; i < list.length; i++) {
      why = list[i].why || "";
      found = /at \((\d+),\s*(\d+)\)\s*->\s*\((\d+),\s*(\d+)\)/.exec(why);
      if (!found) continue;
      fromX = +found[1];
      fromY = +found[2];
      out.push({ fx: fromX, fy: fromY, x: list[i].x, y: list[i].y });
    }
    return out;
  }

  function nearestOpen(map, x, y) {
    var tile = map.tile;
    var tx = Math.floor(x / tile);
    var ty = Math.floor(y / tile);
    var r, dx, dy, cx, cy, px, py, best, bestD, d;
    best = null;
    bestD = Infinity;
    for (r = 0; r <= 8; r++) {
      for (dy = -r; dy <= r; dy++) {
        for (dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          cx = tx + dx;
          cy = ty + dy;
          px = cx * tile + tile / 2;
          py = cy * tile + tile / 2;
          if (map.badFooting(px, py)) continue;
          d = (px - x) * (px - x) + (py - y) * (py - y);
          if (d < bestD) {
            bestD = d;
            best = { x: px, y: py };
          }
        }
      }
      if (best) return best;
    }
    return null;
  }

  SF.nudgeProps = function (map, preview) {
    if (!map || !SF.PROPS) return;
    var moves = parseMoves(preview);
    var i, p, k, move, spot, tx, ty;
    for (i = 0; i < SF.PROPS.length; i++) {
      p = SF.PROPS[i];
      if (p.kind !== "tree" && p.kind !== "rock") continue;
      tx = Math.round(p.x / map.tile);
      ty = Math.round(p.y / map.tile);
      move = null;
      for (k = 0; k < moves.length; k++) {
        if (moves[k].used) continue;
        if (moves[k].fx === tx && moves[k].fy === ty) { move = moves[k]; break; }
      }
      if (move) {
        p.x = move.x;
        p.y = move.y;
        move.used = 1;
      }
      if (map.badFooting(p.x, p.y)) {
        spot = nearestOpen(map, p.x, p.y);
        if (spot) { p.x = spot.x; p.y = spot.y; }
      }
    }
  };

  SF.snapToWalkable = function (x, y) {
    if (SF.walkable && SF.walkable(x, y)) return { x: x, y: y };
    var map = SF.tileMap;
    if (!map) {
      var dock = SF.DOCKS && SF.DOCKS.emberhold;
      return dock ? { x: dock.x, y: dock.y } : { x: x, y: y };
    }
    var tile = map.tile;
    var tx = Math.floor(x / tile);
    var ty = Math.floor(y / tile);
    var r, dx, dy, px, py, best, bestD, d;
    best = null;
    bestD = Infinity;
    for (r = 1; r <= 48; r++) {
      for (dy = -r; dy <= r; dy++) {
        for (dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          px = (tx + dx) * tile + tile / 2;
          py = (ty + dy) * tile + tile / 2;
          if (!SF.walkable(px, py)) continue;
          d = (px - x) * (px - x) + (py - y) * (py - y);
          if (d < bestD) { bestD = d; best = { x: px, y: py }; }
        }
      }
      if (best) return best;
    }
    return { x: x, y: y };
  };

  SF.adoptTileWorld = function (map, preview) {
    if (SF.worldSource) return SF.worldSource;
    installWraps();
    if (!map || !map.framesReady || !map.framesReady(SF.assets)) {
      SF.worldSource = "code";
      return SF.worldSource;
    }
    map.stamp = "emberhold";
    SF.tileMap = map;
    SF._pendingMap = map;
    SF.worldSource = "tiles";
    SF.applyTileMarkers(map);
    SF.nudgeProps(map, preview);
    var player = SF.state && SF.state.player;
    if (player && SF.islandId === "emberhold" && SF.walkable && !SF.walkable(player.x, player.y)) {
      var spot = SF.snapToWalkable(player.x, player.y);
      player.x = spot.x;
      player.y = spot.y;
      player.px = spot.x;
      player.py = spot.y;
      player.safeX = spot.x;
      player.safeY = spot.y;
    }
    return SF.worldSource;
  };

  SF.noteTileSources = function (map, atlasDone) {
    if (map) SF._pendingMap = map;
    if (atlasDone) SF._atlasSettled = true;
    if (SF._mapSettled && SF._atlasSettled) {
      SF.adoptTileWorld(SF._pendingMap, SF._propPreview || null);
    }
  };

  var mount = SF.mountIsland;
  if (typeof mount === "function") {
    SF.mountIsland = function (id) {
      mount(id);
      if (SF.worldSource === "tiles" && id === "emberhold" && SF.tileMap) {
        SF.applyTileMarkers(SF.tileMap);
        SF.nudgeProps(SF.tileMap, SF._propPreview || null);
      }
    };
  }

  installWraps();
})();
