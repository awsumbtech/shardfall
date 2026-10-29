"use strict";

// One job: draw the shard in the hero's right palm. It does not pick a frame
// or stack clothes. Facing up hides it, because that hand is behind him.
// Left is the side-view hand, mirrored.
(function () {
  var SF = window.SF || {};
  window.SF = SF;

  // Offsets are source pixels from the foot anchor, measured on the base body.
  // Down uses his right hand (screen left). Side uses the forward hand of the
  // right-facing row, so a left facing mirror stays on the forward hand.
  var IDLE_DOWN = [[-5, -9], [-5, -9], [-5, -8], [-5, -8], [-5, -9], [-5, -9]];
  var WALK_DOWN = [[-5, -11], [-5, -10], [-5, -9], [-5, -5], [-5, -10], [-5, -9]];
  var IDLE_SIDE = [[3, -8], [3, -8], [3, -7], [3, -7], [3, -8], [3, -8]];
  var WALK_SIDE = [[3, -5], [3, -9], [3, -8], [3, -5], [3, -9], [3, -8]];

  function HandCrystal() {}

  HandCrystal.prototype.offset = function (picked) {
    if (!picked || picked.dir === "up" || picked.facing === "up") return null;
    var side = picked.dir === "side" || picked.facing === "left" || picked.facing === "right";
    var walk = picked.clip === "walk";
    var row = side ? (walk ? WALK_SIDE : IDLE_SIDE) : (walk ? WALK_DOWN : IDLE_DOWN);
    var frame = picked.frame | 0;
    if (frame < 0) frame = 0;
    var cell = row[frame % row.length];
    var flip = side && (!!picked.flip || picked.facing === "left");
    return { x: flip ? -cell[0] : cell[0], y: cell[1] };
  };

  // 2×3 cyan pixels, plus a soft glow. Whole pixels, so the shard stays crisp.
  HandCrystal.prototype.draw = function (ctx, x, y, picked) {
    if (!ctx || !picked) return false;
    var off = this.offset(picked);
    if (!off) return false;
    var px = Math.round(x + off.x);
    var py = Math.round(y + off.y);
    var calm = SF.calm && SF.calm();
    var glow = calm ? 0.42 : (0.38 + Math.sin((SF.anim || 0) * 5) * 0.12);
    ctx.save();
    if (SF.blobs && SF.blobs.cyan) {
      ctx.globalAlpha = glow;
      ctx.drawImage(SF.blobs.cyan, px - 5, py - 5, 10, 10);
    } else {
      ctx.globalAlpha = glow * 0.7;
      ctx.fillStyle = "#7ef0ff";
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fill();
    }
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
