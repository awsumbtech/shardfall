"use strict";

// One job: a solid rectangle in world pixels. The door point is recorded
// so a later island can see the approach; the rectangle itself does not cover it.
(function () {
  var SF = window.SF || {};
  window.SF = SF;

  function RectFootprint(rect, door) {
    this.x = rect[0];
    this.y = rect[1];
    this.w = rect[2];
    this.h = rect[3];
    this.door = door || null;
  }

  RectFootprint.prototype.blocks = function (x, y) {
    return x >= this.x && y >= this.y && x < this.x + this.w && y < this.y + this.h;
  };

  // A rectangle in the dash list. Ray tests read rect, not a radius.
  RectFootprint.prototype.solid = function () {
    return { x: this.x, y: this.y, w: this.w, h: this.h, rect: true, kind: "prop" };
  };

  SF.footprintBlocks = function (x, y) {
    var rects = SF.propFootprints;
    var i;
    if (!rects) return false;
    for (i = 0; i < rects.length; i++) {
      if (rects[i] && rects[i].blocks(x, y)) return true;
    }
    return false;
  };

  SF.RectFootprint = RectFootprint;
})();
