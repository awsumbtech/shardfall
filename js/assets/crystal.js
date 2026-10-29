"use strict";

// One job: draw the shard at the measured sleeve tip. It does not pick a
// frame or stack clothes. Down and right-facing paint it in front. Left
// uses the mirrored back hand, and up uses the screen-right hand; both of
// those sit behind the body, so only a faint glow is drawn first.
(function () {
  var SF = window.SF || {};
  window.SF = SF;

  // [dx, dy] source pixels from the foot anchor. The third flag is the
  // measurer's note and is not a separate hand position.
  var TABLE = {
    idle: {
      down: [[-4, -4], [-4, -4], [-4, -4], [-4, -4], [-4, -4], [-4, -4]],
      side_front: [[-3, -4], [-3, -4], [-3, -4], [-3, -4], [-3, -4], [-3, -4]],
      side_back: [[1, -4, false], [1, -4, false], [1, -4, false], [1, -4, false], [1, -4, false], [1, -4, false]],
      up: [[2, -4, true], [2, -4, true], [2, -4, true], [2, -4, true], [2, -4, true], [2, -4, true]]
    },
    walk: {
      down: [[-4, -6], [-4, -5], [-4, -4], [-4, -6], [-4, -5], [-4, -4]],
      side_front: [[-2, -7], [-2, -5], [-3, -4], [-3, -7], [-3, -6], [-3, -5]],
      side_back: [[1, -7, false], [1, -5, false], [1, -4, false], [1, -7, false], [1, -6, false], [1, -5, false]],
      up: [[2, -6, true], [2, -6, true], [2, -4, true], [2, -6, true], [2, -5, true], [2, -4, true]]
    }
  };

  // One source pixel under the sleeve tip, so the shard reads as held.
  var PALM_DROP = 1;

  function HandCrystal() {}

  HandCrystal.TABLE = TABLE;
  HandCrystal.PALM_DROP = PALM_DROP;

  function cellAt(row, frame) {
    var i = frame | 0;
    if (i < 0) i = 0;
    return row[i % row.length];
  }

  // { x, y } is the table point, before the palm drop. behind means the
  // glow is painted under the doll and the hard shard stays off.
  HandCrystal.prototype.place = function (picked) {
    if (!picked) return null;
    var clip = picked.clip === "walk" ? "walk" : "idle";
    var book = TABLE[clip];
    if (!book) return null;
    var frame = picked.frame | 0;
    var facing = picked.facing;
    var dir = picked.dir;
    var left = facing === "left" || (dir === "side" && !!picked.flip && facing !== "right");
    var up = dir === "up" || facing === "up";
    var cell;
    var behind = false;
    var mirror = false;
    if (up) {
      cell = cellAt(book.up, frame);
      behind = true;
    } else if (left) {
      cell = cellAt(book.side_back, frame);
      behind = true;
      mirror = true;
    } else if (dir === "side" || facing === "right") {
      cell = cellAt(book.side_front, frame);
    } else {
      cell = cellAt(book.down, frame);
    }
    if (!cell) return null;
    return {
      x: mirror ? -cell[0] : cell[0],
      y: cell[1],
      behind: behind
    };
  };

  HandCrystal.prototype.offset = function (picked) {
    return this.place(picked);
  };

  function glow(ctx, px, py, alpha, size) {
    ctx.save();
    ctx.globalAlpha = alpha;
    if (SF.blobs && SF.blobs.cyan) {
      ctx.drawImage(SF.blobs.cyan, px - size / 2, py - size / 2, size, size);
    } else {
      ctx.fillStyle = "#7ef0ff";
      ctx.beginPath();
      ctx.arc(px, py, size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Centers the 2×3 shard on the sleeve tip, one pixel below it.
  HandCrystal.prototype.draw = function (ctx, x, y, picked) {
    if (!ctx || !picked) return false;
    var spot = this.place(picked);
    if (!spot) return false;
    var px = Math.round(x + spot.x);
    var py = Math.round(y + spot.y + PALM_DROP);
    var calm = SF.calm && SF.calm();
    if (spot.behind) {
      glow(ctx, px, py, calm ? 0.16 : 0.22, 8);
      return true;
    }
    glow(ctx, px, py, calm ? 0.4 : (0.36 + Math.sin((SF.anim || 0) * 5) * 0.1), 10);
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#1a6878";
    ctx.fillRect(px - 1, py - 1, 2, 3);
    ctx.fillStyle = "#7ef0ff";
    ctx.fillRect(px - 1, py - 1, 2, 2);
    ctx.fillStyle = "#e7fcff";
    ctx.fillRect(px - 1, py - 1, 1, 1);
    ctx.restore();
    return true;
  };

  SF.HandCrystal = HandCrystal;
  SF.handCrystal = new HandCrystal();
})();
