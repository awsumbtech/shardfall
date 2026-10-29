"use strict";

// One job: find a frame on one image, either by a named rect or by a grid cell.
(function () {
  var SF = window.SF || {};
  window.SF = SF;

  function gridName(names, row, col, cols) {
    if (!names) return "r" + row + "c" + col;
    var cell = names[row];
    if (cell && typeof cell !== "string" && typeof cell[col] === "string") return cell[col];
    var flat = names[row * cols + col];
    if (typeof flat === "string") return flat;
    return "r" + row + "c" + col;
  }

  function SpriteSheet(image, spec) {
    this.image = image || null;
    this.frames = {};
    this.order = [];
    if (spec) this.add(spec);
  }

  SpriteSheet.prototype._put = function (frame) {
    if (!frame || !(frame.w > 0) || !(frame.h > 0)) return null;
    var rect = {
      name: frame.name ? String(frame.name) : ("f" + this.order.length),
      x: frame.x || 0,
      y: frame.y || 0,
      w: frame.w,
      h: frame.h
    };
    if (typeof frame.ox === "number") rect.ox = frame.ox;
    if (typeof frame.oy === "number") rect.oy = frame.oy;
    this.frames[rect.name] = rect;
    this.order.push(rect);
    return rect;
  };

  SpriteSheet.prototype.add = function (spec) {
    if (!spec) return this;
    var frames = spec.frames || [];
    var i;
    for (i = 0; i < frames.length; i++) this._put(frames[i]);
    var grid = spec.grid;
    if (grid && grid.cols > 0 && grid.rows > 0 && grid.w > 0 && grid.h > 0) {
      var row, col;
      for (row = 0; row < grid.rows; row++) {
        for (col = 0; col < grid.cols; col++) {
          this._put({
            name: gridName(grid.names, row, col, grid.cols | 0),
            x: (grid.x || 0) + col * grid.w,
            y: (grid.y || 0) + row * grid.h,
            w: grid.w,
            h: grid.h
          });
        }
      }
    }
    return this;
  };

  // A number picks by order. A string picks by name. Null picks the first frame.
  SpriteSheet.prototype.frame = function (nameOrIndex) {
    if (typeof nameOrIndex === "number") return this.order[nameOrIndex] || null;
    if (nameOrIndex == null || nameOrIndex === "") return this.order[0] || null;
    return this.frames[nameOrIndex] || null;
  };

  SpriteSheet.prototype.count = function () {
    return this.order.length;
  };

  SF.SpriteSheet = SpriteSheet;
})();
