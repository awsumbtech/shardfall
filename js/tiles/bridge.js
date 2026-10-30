"use strict";

// One job: ease the hero onto the rope bridge.
// A stick within about 20 degrees of the bridge axis, at either mouth,
// is steered toward the plank centre. Straighter approaches slide on.
// Wider angles are left alone so the cliff lip still walks as a lip.
(function () {
  var SF = window.SF || {};
  window.SF = SF;

  var MOUTH = 48;
  var AIM = 20 * Math.PI / 180;
  var CATCH = 28;

  function approach(span, y, ny) {
    if (ny > 0.2 && y >= span.y0 - MOUTH && y <= span.y0 + 12) return true;
    if (ny < -0.2 && y >= span.y1 - 12 && y <= span.y1 + MOUTH) return true;
    return false;
  }

  SF.guideRope = function (x, y, nx, ny) {
    var map = SF.tileMap;
    var span = map && map.bridgeSpan;
    if (!span || SF.worldSource !== "tiles" || SF.islandId !== "emberhold") return null;
    if (Math.atan2(Math.abs(nx), Math.abs(ny)) > AIM) return null;
    if (!approach(span, y, ny)) return null;
    if (Math.abs(x - span.cx) > CATCH) return null;
    var pull = (span.cx - x) / 18;
    if (pull > 0.55) pull = 0.55;
    else if (pull < -0.55) pull = -0.55;
    var sy = ny < 0 ? -1 : 1;
    var ay = sy * Math.sqrt(Math.max(0, 1 - pull * pull));
    return { x: pull, y: ay };
  };
})();
