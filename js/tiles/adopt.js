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

  // Keep the hero's feet off a cliff lip. The whole ground cell stays open in
  // the map; only the last few pixels beside a blocked neighbour are refused.
  // The rope bridge is one plank tile wide, so its inset is smaller: the
  // walkable lane is the plank minus about 3px on each side.
  var FOOT_INSET = 5;
  var BRIDGE_INSET = 3;

  function footInset(map, x, y) {
    if (map.onBridge && map.onBridge(x, y)) return BRIDGE_INSET;
    return FOOT_INSET;
  }

  // Extra shore insets are rectangles on the map (edge-insets). Editing the
  // tiles without those rectangles would change the dash gaps, so the numbers
  // live next to the shore they describe. The bridge stays at 3.
  function sideHits(side, sx, sy) {
    if (side === "w") return sx < 0 && sy === 0;
    if (side === "e") return sx > 0 && sy === 0;
    if (side === "n") return sy < 0 && sx === 0;
    if (side === "s") return sy > 0 && sx === 0;
    if (side === "nw") return (sx < 0 && sy === 0) || (sy < 0 && sx === 0);
    if (side === "ne") return (sx > 0 && sy === 0) || (sy < 0 && sx === 0);
    return false;
  }

  function dirInset(map, x, y, sx, sy) {
    var base = footInset(map, x, y);
    if (base < FOOT_INSET) return base;
    var boxes = map.edgeInsets;
    if (!boxes || !boxes.length) return base;
    var tx = Math.floor(x / map.tile);
    var ty = Math.floor(y / map.tile);
    var i, box;
    for (i = 0; i < boxes.length; i++) {
      box = boxes[i];
      if (tx < box.x || ty < box.y || tx >= box.x + box.w || ty >= box.y + box.h) continue;
      if (!sideHits(box.side, sx, sy)) continue;
      if (box.sky && (!map.openSky || !map.openSky(tx + (sx || 0), ty + (sy || 0)))) continue;
      return box.inset;
    }
    return base;
  }

  function terrainOpen(map, x, y) {
    if (!map.isWalkable(x, y)) return false;
    if (!map.isWalkable(x - dirInset(map, x, y, -1, 0), y)) return false;
    if (!map.isWalkable(x + dirInset(map, x, y, 1, 0), y)) return false;
    if (!map.isWalkable(x, y - dirInset(map, x, y, 0, -1))) return false;
    if (!map.isWalkable(x, y + dirInset(map, x, y, 0, 1))) return false;
    return true;
  }

  function installWraps() {
    if (shapeWalk) return;
    shapeWalk = SF.walkable;
    shapeZone = SF.zoneAt;
    SF.walkable = function (x, y) {
      if (SF.worldSource === "tiles" && SF.islandId === "emberhold" && SF.tileMap) {
        if (!terrainOpen(SF.tileMap, x, y)) return false;
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
          if (map.stairMouth && map.stairMouth(px, py)) continue;
          if (map.onAsh && map.onAsh(px, py)) continue;
          if (map.onPath && map.onPath(px, py)) continue;
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

  function propClass(p) {
    if (!p) return "";
    if (p.kind === "tuft" || p.kind === "flower") return "decor";
    if (p.block || p.kind === "tree" || p.kind === "rock" || p.kind === "bush" || p.kind === "stump" || p.kind === "log") return "solid";
    return "";
  }

  // Meadow dressing is every prop that is not a placed structure. A new
  // scatter kind is included without extending a list of tufts and rocks.
  function isStructure(p) {
    var k = p.kind || "";
    if (k.indexOf("fence") === 0) return true;
    return k === "cottage" || k === "stones" || k === "airship" || k === "stake" ||
      k === "hut" || k === "stall" || k === "ruin" || k === "plank" || k === "skiff" ||
      k === "signpost" || k === "crate" || k === "barrel" || k === "chest" ||
      k === "chest_open" || k === "stilt" || k === "wreckhull";
  }

  function rejectProp(map, p) {
    if (isStructure(p)) return false;
    if (map.stairMouth && map.stairMouth(p.x, p.y)) return true;
    if (map.onAsh && map.onAsh(p.x, p.y)) return true;
    if (map.onPath && map.onPath(p.x, p.y)) return true;
    return false;
  }

  SF.nudgeProps = function (map, preview) {
    if (SF.worldSource !== "tiles" || !map || !SF.PROPS) return;
    var moves = parseMoves(preview);
    var keep = [];
    var i, p, k, move, spot, tx, ty, kind;
    for (i = 0; i < SF.PROPS.length; i++) {
      p = SF.PROPS[i];
      if (rejectProp(map, p)) continue;
      kind = propClass(p);
      if (kind === "decor") {
        if (map.badFooting(p.x, p.y)) continue;
        keep.push(p);
        continue;
      }
      if (kind === "solid") {
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
      keep.push(p);
    }
    SF.PROPS = keep;
    if (SF.ISLANDS && SF.ISLANDS.emberhold) SF.ISLANDS.emberhold.props = keep;
  };

  function dashReach() {
    var player = SF.state && SF.state.player;
    var flags = SF.state && SF.state.flags;
    var plus = (player && player.shardstep) || (flags && flags.shardstep);
    return (plus ? SF.DASH_SPEED_PLUS : SF.DASH_SPEED) * SF.DASH_TIME;
  }

  function buildGraph(map) {
    if (map._graph) return map._graph;
    var w = map.w;
    var h = map.h;
    var tile = map.tile;
    var label = new Int16Array(w * h);
    var n = 0;
    var x, y, i, q, qi, cx, cy, nx, ny, ni, id;
    for (i = 0; i < label.length; i++) label[i] = -1;
    for (y = 0; y < h; y++) {
      for (x = 0; x < w; x++) {
        i = y * w + x;
        if (label[i] >= 0) continue;
        if (!terrainOpen(map, x * tile + tile / 2, y * tile + tile / 2)) continue;
        id = n++;
        q = [i];
        label[i] = id;
        for (qi = 0; qi < q.length; qi++) {
          i = q[qi];
          cx = i % w;
          cy = (i / w) | 0;
          if (cx + 1 < w) {
            ni = i + 1;
            if (label[ni] < 0 && terrainOpen(map, (cx + 1) * tile + tile / 2, cy * tile + tile / 2)) {
              label[ni] = id;
              q.push(ni);
            }
          }
          if (cx > 0) {
            ni = i - 1;
            if (label[ni] < 0 && terrainOpen(map, (cx - 1) * tile + tile / 2, cy * tile + tile / 2)) {
              label[ni] = id;
              q.push(ni);
            }
          }
          if (cy + 1 < h) {
            ni = i + w;
            if (label[ni] < 0 && terrainOpen(map, cx * tile + tile / 2, (cy + 1) * tile + tile / 2)) {
              label[ni] = id;
              q.push(ni);
            }
          }
          if (cy > 0) {
            ni = i - w;
            if (label[ni] < 0 && terrainOpen(map, cx * tile + tile / 2, (cy - 1) * tile + tile / 2)) {
              label[ni] = id;
              q.push(ni);
            }
          }
        }
      }
    }
    var edges = [];
    for (id = 0; id < n; id++) edges.push([]);
    // One pixel, so a gap that clears on the foot inset is not rounded past the dash.
    var step = 1;
    var px, py;
    for (py = 0; py < h * tile; py += step) {
      for (px = 0; px < w * tile; px += step) {
        if (!terrainOpen(map, px, py)) continue;
        cx = Math.floor(px / tile);
        cy = Math.floor(py / tile);
        if (cx < 0 || cy < 0 || cx >= w || cy >= h) continue;
        id = label[cy * w + cx];
        if (id < 0) continue;
        if (terrainOpen(map, px - step, py) && terrainOpen(map, px + step, py) &&
            terrainOpen(map, px, py - step) && terrainOpen(map, px, py + step)) continue;
        edges[id].push(px, py);
      }
    }
    map._graph = { label: label, n: n, edges: edges, gaps: {}, home: {} };
    return map._graph;
  }

  function componentGap(graph, a, b) {
    var key = a < b ? a + ":" + b : b + ":" + a;
    if (graph.gaps[key] != null) return graph.gaps[key];
    var ea = graph.edges[a];
    var eb = graph.edges[b];
    var best = Infinity;
    var i, j, dx, dy, d;
    if (!ea.length || !eb.length) {
      graph.gaps[key] = Infinity;
      return Infinity;
    }
    var buckets = {};
    var bx, by, list, cell;
    for (j = 0; j < eb.length; j += 2) {
      bx = (eb[j] / 32) | 0;
      by = (eb[j + 1] / 32) | 0;
      key = bx + "," + by;
      list = buckets[key];
      if (!list) buckets[key] = list = [];
      list.push(j);
    }
    for (i = 0; i < ea.length; i += 2) {
      bx = (ea[i] / 32) | 0;
      by = (ea[i + 1] / 32) | 0;
      for (dy = -6; dy <= 6; dy++) {
        for (dx = -6; dx <= 6; dx++) {
          list = buckets[(bx + dx) + "," + (by + dy)];
          if (!list) continue;
          for (j = 0; j < list.length; j++) {
            cell = list[j];
            d = Math.hypot(eb[cell] - ea[i], eb[cell + 1] - ea[i + 1]);
            if (d < best) best = d;
          }
        }
      }
    }
    graph.gaps[a < b ? a + ":" + b : b + ":" + a] = best;
    return best;
  }

  function returnable(graph, reach) {
    var cached = graph.home[reach];
    if (cached) return cached;
    var wake = SF.WAKE || { x: 0, y: 0 };
    var map = SF.tileMap;
    var wi = map._cell(wake.x, wake.y);
    var home = wi >= 0 ? graph.label[wi] : -1;
    var ok = [];
    var i, j, id;
    if (home >= 0) ok[home] = 1;
    var grew = true;
    while (grew) {
      grew = false;
      for (i = 0; i < graph.n; i++) {
        if (ok[i]) continue;
        for (j = 0; j < graph.n; j++) {
          if (!ok[j]) continue;
          if (componentGap(graph, i, j) <= reach + 0.01) {
            ok[i] = 1;
            grew = true;
            break;
          }
        }
      }
    }
    graph.home[reach] = ok;
    return ok;
  }

  function nearestReturnable(map, graph, ok, x, y) {
    var tile = map.tile;
    var tx = Math.floor(x / tile);
    var ty = Math.floor(y / tile);
    var r, dx, dy, px, py, id, best, bestD, d;
    best = null;
    bestD = Infinity;
    for (r = 0; r <= 48; r++) {
      for (dy = -r; dy <= r; dy++) {
        for (dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          px = (tx + dx) * tile + tile / 2;
          py = (ty + dy) * tile + tile / 2;
          id = map._cell(px, py);
          if (id < 0) continue;
          id = graph.label[id];
          if (id < 0 || !ok[id]) continue;
          if (!SF.walkable(px, py)) continue;
          d = (px - x) * (px - x) + (py - y) * (py - y);
          if (d < bestD) { bestD = d; best = { x: px, y: py }; }
        }
      }
      if (best) return best;
    }
    return null;
  }

  SF.snapToWalkable = function (x, y) {
    var map = SF.tileMap;
    var tiles = SF.worldSource === "tiles" && SF.islandId === "emberhold" && map;
    if (!tiles) {
      if (SF.walkable && SF.walkable(x, y)) return { x: x, y: y };
      var dock0 = SF.DOCKS && SF.DOCKS.emberhold;
      return dock0 ? { x: dock0.x, y: dock0.y } : { x: x, y: y };
    }
    var graph = buildGraph(map);
    var ok = returnable(graph, dashReach());
    var here = map._cell(x, y);
    if (here >= 0) here = graph.label[here];
    else here = -1;
    if (here >= 0 && ok[here] && SF.walkable(x, y)) return { x: x, y: y };
    var spot = nearestReturnable(map, graph, ok, x, y);
    if (spot) return spot;
    var dock = SF.DOCKS && SF.DOCKS.emberhold;
    if (dock) return { x: dock.x, y: dock.y };
    return SF.WAKE ? { x: SF.WAKE.x, y: SF.WAKE.y } : { x: x, y: y };
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
    if (player && SF.islandId === "emberhold") {
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
