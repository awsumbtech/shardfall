"use strict";

// One job: Emberhold's ground as tiles, read from the live world.
// Walk, zone, and height answer the same questions the world already answers.
// The grid is only how that land is drawn. Cinderveil is not built here.
(function () {
  var SF = window.SF || {};
  window.SF = SF;

  var VOID = 0;
  var GRASS = 1;
  var PATH = 2;
  var CLIFF = 3;
  var STAIR = 4;

  function TileMap(spec) {
    this.cols = spec.cols;
    this.rows = spec.rows;
    this.originX = spec.originX;
    this.originY = spec.originY;
    this.tile = spec.tile;
    this.kind = spec.kind;
    this.names = spec.names;
    this.faces = spec.faces;
    this.stamp = spec.stamp;
  }

  TileMap.VOID = VOID;
  TileMap.GRASS = GRASS;
  TileMap.PATH = PATH;
  TileMap.CLIFF = CLIFF;
  TileMap.STAIR = STAIR;

  TileMap.prototype.isWalkable = function (x, y) {
    return !!(SF.walkable && SF.walkable(x, y));
  };

  TileMap.prototype.zoneAt = function (x, y) {
    if (!SF.zoneAt) return { id: "hush", name: "The Hush" };
    return SF.zoneAt(x, y);
  };

  // Highest terrace top under the point. The face below a lip is not that top.
  TileMap.heightAt = function (x, y) {
    var list = (SF.TERRACES && SF.TERRACES.emberhold) || [];
    var h = 0;
    var i, t, m, lv;
    if (!SF.terraceMetrics) return 0;
    for (i = 0; i < list.length; i++) {
      t = list[i];
      m = SF.terraceMetrics(t, x, y);
      if (!m || m.gap > 0) continue;
      lv = t.level || 0;
      if (lv > h) h = lv;
    }
    return h;
  };

  TileMap.prototype.heightAt = function (x, y) {
    return TileMap.heightAt(x, y);
  };

  function shapeOpen(sh) {
    if (!sh.opens) return true;
    var flags = SF.state && SF.state.flags;
    return !!(flags && flags[sh.opens]);
  }

  function covers(sh, x, y) {
    if (sh.k === "r" || (sh.w != null && sh.rx == null)) {
      return x >= sh.x && y >= sh.y && x <= sh.x + sh.w && y <= sh.y + sh.h;
    }
    var rx = sh.rx || sh.r || 0;
    var ry = sh.ry || sh.rx || sh.r || 0;
    if (rx <= 1 || ry <= 1) return false;
    if (x < sh.x - rx || x > sh.x + rx || y < sh.y - ry || y > sh.y + ry) return false;
    var dx = (x - sh.x) / rx;
    var dy = (y - sh.y) / ry;
    return dx * dx + dy * dy <= 1;
  }

  function onLand(shapes, x, y) {
    var i;
    for (i = 0; i < shapes.length; i++) if (covers(shapes[i], x, y)) return true;
    return false;
  }

  function segDist(px, py, seg) {
    if (px < seg.minX || px > seg.maxX || py < seg.minY || py > seg.maxY) return seg.far;
    var dx = seg.x1 - seg.x0;
    var dy = seg.y1 - seg.y0;
    var len2 = dx * dx + dy * dy || 1;
    var u = ((px - seg.x0) * dx + (py - seg.y0) * dy) / len2;
    if (u < 0) u = 0;
    else if (u > 1) u = 1;
    return Math.hypot(px - (seg.x0 + dx * u), py - (seg.y0 + dy * u));
  }

  function nearPath(segs, x, y, radius) {
    var i;
    for (i = 0; i < segs.length; i++) {
      if (segDist(x, y, segs[i]) <= radius) return true;
    }
    return false;
  }

  function pathSegs(radius) {
    var paths = SF.PATHS || [];
    var out = [];
    var p, i, x0, y0, x1, y1, pad;
    pad = radius;
    for (p = 0; p < paths.length; p++) {
      for (i = 0; i < paths[p].length - 2; i += 2) {
        x0 = paths[p][i];
        y0 = paths[p][i + 1];
        x1 = paths[p][i + 2];
        y1 = paths[p][i + 3];
        out.push({
          x0: x0, y0: y0, x1: x1, y1: y1,
          minX: Math.min(x0, x1) - pad,
          maxX: Math.max(x0, x1) + pad,
          minY: Math.min(y0, y1) - pad,
          maxY: Math.max(y0, y1) + pad,
          far: pad + 1
        });
      }
    }
    return out;
  }

  function mix(x, y) {
    var n = Math.imul(x, 374761393) ^ Math.imul(y, 668265263);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return (n ^ (n >>> 16)) >>> 0;
  }

  function cellOf(kind, drop, idx) {
    if (kind[idx] === GRASS) return { t: "grass" };
    if (kind[idx] === PATH) return { t: "path" };
    if (kind[idx] === CLIFF) return { t: "cliff", g: drop[idx] };
    if (kind[idx] === STAIR) return { t: "stair" };
    return null;
  }

  TileMap.fromWorld = function (tileSet) {
    if (!tileSet || SF.islandId !== "emberhold" || !SF.WALK || !SF.ISLANDS || !SF.ISLANDS.emberhold) return null;
    var bounds = SF.ISLANDS.emberhold.bounds;
    if (!bounds || !(bounds.w > 0) || !(bounds.h > 0)) return null;
    var tile = tileSet.tile;
    var cols = Math.ceil(bounds.w / tile);
    var rows = Math.ceil(bounds.h / tile) + tileSet.skirt;
    if (cols > 512 || rows > 512) return null;
    var originX = bounds.x;
    var originY = bounds.y;
    var n = cols * rows;
    var kind = new Uint8Array(n);
    var names = new Array(n);
    var drop = new Array(n);
    var shapes = [];
    var list = (SF.WALK.circles || []).concat(SF.WALK.rects || []);
    var i, sh;
    for (i = 0; i < list.length; i++) {
      sh = list[i];
      if (shapeOpen(sh)) shapes.push(sh);
    }
    var segs = pathSegs(tileSet.pathRadius);
    var radius = tileSet.pathRadius;
    var x, y, idx, wx, wy;
    for (y = 0; y < rows; y++) {
      wy = originY + y * tile + tile / 2;
      for (x = 0; x < cols; x++) {
        wx = originX + x * tile + tile / 2;
        if (!onLand(shapes, wx, wy)) continue;
        idx = y * cols + x;
        kind[idx] = nearPath(segs, wx, wy, radius) ? PATH : GRASS;
      }
    }
    paintFaces(kind, drop, cols, rows, originX, originY, tile);
    paintSkirt(kind, drop, cols, rows, tileSet.skirt);
    var grid = [];
    var row;
    for (y = 0; y < rows; y++) {
      row = new Array(cols);
      for (x = 0; x < cols; x++) row[x] = cellOf(kind, drop, y * cols + x);
      grid.push(row);
    }
    var picked, h;
    for (y = 0; y < rows; y++) {
      for (x = 0; x < cols; x++) {
        idx = y * cols + x;
        if (!kind[idx] || kind[idx] === STAIR) {
          names[idx] = "";
          continue;
        }
        picked = SF.AutoTiler.pick(grid, x, y);
        if (picked === "path.center" && tileSet.get("path.deco.0")) {
          h = mix(x, y);
          if ((h % 4) === 0) picked = "path.deco." + (h % 3);
        }
        names[idx] = picked;
      }
    }
    return new TileMap({
      cols: cols,
      rows: rows,
      originX: originX,
      originY: originY,
      tile: tile,
      kind: kind,
      names: names,
      faces: faceRuns(kind, names, cols, rows, originX, originY, tile),
      stamp: [
        tileSet.id, tile, tileSet.chunk, tileSet.skirt, tileSet.pathRadius,
        (SF.WALK.circles || []).length, (SF.WALK.rects || []).length
      ].join(":")
    });
  };

  function paintFaces(kind, drop, cols, rows, originX, originY, tile) {
    var list = (SF.TERRACES && SF.TERRACES.emberhold) || [];
    if (!SF.terraceSouthLip) return;
    var i, t, lip, col0, col1, col, xCenter, yLip, lipRow, into, faceStart, depth, midY, rd, stair, row, idx;
    for (i = 0; i < list.length; i++) {
      t = list[i];
      if (!t.block) continue;
      SF.terraceSouthLip(t, t.x);
      lip = t._lip;
      if (!lip) continue;
      col0 = Math.floor((lip.minX - originX) / tile);
      col1 = Math.floor((lip.maxX - originX) / tile);
      if (col0 < 0) col0 = 0;
      if (col1 >= cols) col1 = cols - 1;
      depth = Math.ceil(t.block / tile);
      if (depth < 1) depth = 1;
      for (col = col0; col <= col1; col++) {
        xCenter = originX + col * tile + tile / 2;
        yLip = SF.terraceSouthLip(t, xCenter);
        if (yLip == null) continue;
        lipRow = Math.floor((yLip - originY) / tile);
        into = yLip - originY - lipRow * tile;
        faceStart = into < 0.5 ? lipRow : lipRow + 1;
        midY = originY + (faceStart + (depth - 1) / 2) * tile + tile / 2;
        rd = SF.routeApproach ? SF.routeApproach(xCenter, midY) : null;
        stair = !!(rd && rd.cross && t.ramp && rd.d < t.ramp);
        for (row = faceStart; row < faceStart + depth; row++) {
          if (row < 0 || row >= rows) continue;
          idx = row * cols + col;
          if (stair) {
            kind[idx] = STAIR;
            drop[idx] = "";
          } else {
            kind[idx] = CLIFF;
            drop[idx] = t.id;
          }
        }
      }
    }
  }

  function paintSkirt(kind, drop, cols, rows, skirt) {
    var starts = [];
    var y, x, idx, d, row, at;
    for (y = 0; y < rows; y++) {
      for (x = 0; x < cols; x++) {
        idx = y * cols + x;
        if (kind[idx] === GRASS || kind[idx] === PATH) starts.push(x, y);
      }
    }
    for (y = 0; y < starts.length; y += 2) {
      x = starts[y];
      row = starts[y + 1];
      for (d = 1; d <= skirt; d++) {
        at = row + d;
        if (at >= rows) break;
        idx = at * cols + x;
        if (kind[idx] !== VOID) break;
        kind[idx] = CLIFF;
        drop[idx] = "skirt";
      }
    }
  }

  function faceRuns(kind, names, cols, rows, originX, originY, tile) {
    var faces = [];
    var x, y, idx, run, last;
    for (x = 0; x < cols; x++) {
      run = null;
      for (y = 0; y < rows; y++) {
        idx = y * cols + x;
        if (kind[idx] === CLIFF && names[idx]) {
          if (!run) run = [];
          run.push({ x: originX + x * tile, y: originY + y * tile, name: names[idx] });
        } else if (run) {
          last = run[run.length - 1];
          faces.push({ y: last.y + tile - 0.25, cells: run });
          run = null;
        }
      }
      if (run) {
        last = run[run.length - 1];
        faces.push({ y: last.y + tile - 0.25, cells: run });
      }
    }
    return faces;
  }

  SF.emberTileMap = function () {
    var set = SF.tileSet;
    if (!set || SF.islandId !== "emberhold" || !SF.WALK) return null;
    var stamp = [
      set.id, set.tile, set.chunk, set.skirt, set.pathRadius,
      (SF.WALK.circles || []).length, (SF.WALK.rects || []).length
    ].join(":");
    if (SF._emberTileMap && SF._emberTileMap.stamp === stamp) return SF._emberTileMap;
    SF._emberTileMap = TileMap.fromWorld(set);
    return SF._emberTileMap;
  };

  SF.TileMap = TileMap;
})();
