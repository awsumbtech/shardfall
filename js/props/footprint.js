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

  // dashCircles carries the rectangle beside the prop circles. Ray tests
  // that only understand a radius skip an entry with no r.
  RectFootprint.prototype.solid = function () {
    return { x: this.x, y: this.y, w: this.w, h: this.h, rect: true, kind: "prop" };
  };

  SF.RectFootprint = RectFootprint;
})();
