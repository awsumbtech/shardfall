"use strict";

// One job: when a dash would finish off the ground, turn it a little
// toward the nearest landable spot still inside the dash.
// Wider misses are left alone, the same way the rope bridge ignores a steep aim.
(function () {
  var SF = window.SF || {};
  window.SF = SF;

  SF.guideDash = function (x, y, nx, ny, reach) {
    if (!SF.walkable || SF.worldSource !== "tiles" || SF.islandId !== "emberhold") return null;
    if (!(reach > 0)) return null;
    var maxDeg = SF.DASH_ASSIST_ANGLE == null ? 20 : SF.DASH_ASSIST_ANGLE;
    if (SF.walkable(x + nx * reach, y + ny * reach)) return null;
    var best = null;
    var bestAbs = maxDeg + 1;
    var deg, rad, c, s, rx, ry;
    for (deg = -maxDeg; deg <= maxDeg; deg += 1) {
      rad = deg * Math.PI / 180;
      c = Math.cos(rad);
      s = Math.sin(rad);
      rx = nx * c - ny * s;
      ry = nx * s + ny * c;
      if (!SF.walkable(x + rx * reach, y + ry * reach)) continue;
      if ((deg < 0 ? -deg : deg) >= bestAbs) continue;
      bestAbs = deg < 0 ? -deg : deg;
      best = { x: rx, y: ry };
    }
    return best;
  };
})();
