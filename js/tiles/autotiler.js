"use strict";

// One job: pick the tile name for one cell from its neighbors.
// Bits, least neighbor first: N E S W NE SE SW NW. A set bit means that
// neighbor connects. The grid is not changed.
(function () {
  var SF = window.SF || {};
  window.SF = SF;

  var NEIGHBORS = [
    [0, -1, 1],
    [1, 0, 2],
    [0, 1, 4],
    [-1, 0, 8],
    [1, -1, 16],
    [1, 1, 32],
    [-1, 1, 64],
    [-1, -1, 128]
  ];

  function at(grid, x, y) {
    if (!grid || y < 0 || x < 0 || y >= grid.length) return null;
    var row = grid[y];
    if (!row || x >= row.length) return null;
    return row[x] || null;
  }

  function connects(self, other) {
    if (!self || !other) return false;
    if (self.t === "grass") {
      return other.t === "grass" || other.t === "path" || other.t === "cliff" || other.t === "stair";
    }
    if (self.t === "path") return other.t === "path" || other.t === "stair" || other.t === "cliff";
    if (self.t === "cliff") return other.t === "cliff" && other.g === self.g;
    if (self.t === "stair") return other.t === "stair";
    return false;
  }

  function maskOf(grid, x, y) {
    var self = at(grid, x, y);
    if (!self) return 0;
    var bits = 0;
    var i, step;
    for (i = 0; i < NEIGHBORS.length; i++) {
      step = NEIGHBORS[i];
      if (connects(self, at(grid, x + step[0], y + step[1]))) bits |= step[2];
    }
    return bits;
  }

  function surfaceName(prefix, bits) {
    var n = !!(bits & 1);
    var e = !!(bits & 2);
    var s = !!(bits & 4);
    var w = !!(bits & 8);
    if (n && e && s && w) {
      if (!(bits & 16)) return prefix + "corner.in.ne";
      if (!(bits & 32)) return prefix + "corner.in.se";
      if (!(bits & 64)) return prefix + "corner.in.sw";
      if (!(bits & 128)) return prefix + "corner.in.nw";
      return prefix + "center";
    }
    if (!n && !e && !s && !w) return prefix + "center";
    if (!n && !s && e && w) return prefix + "center";
    if (!e && !w && n && s) return prefix + "center";
    if (!n && !w) return prefix + "corner.nw";
    if (!n && !e) return prefix + "corner.ne";
    if (!s && !w) return prefix + "corner.sw";
    if (!s && !e) return prefix + "corner.se";
    if (!n) return prefix + "edge.n";
    if (!s) return prefix + "edge.s";
    if (!w) return prefix + "edge.w";
    if (!e) return prefix + "edge.e";
    return prefix + "center";
  }

  function cliffName(bits) {
    var n = !!(bits & 1);
    var e = !!(bits & 2);
    var s = !!(bits & 4);
    var w = !!(bits & 8);
    var side = !w && e ? ".w" : (!e && w ? ".e" : "");
    if (!n) return "cliff.top.n" + side;
    if (!s) return "cliff.face.s.foot" + side;
    return "cliff.face.s" + side;
  }

  function pick(grid, x, y) {
    var self = at(grid, x, y);
    if (!self || self.t === "stair") return "";
    var bits = maskOf(grid, x, y);
    if (self.t === "cliff") return cliffName(bits);
    if (self.t === "path") return surfaceName("path.", bits);
    if (self.t === "grass") return surfaceName("grass.", bits);
    return "";
  }

  SF.AutoTiler = {
    mask: maskOf,
    pick: pick
  };
})();
