"use strict";

// Field actors are 24×38 from the front and 36×38 from the side. Feet sit on
// the baseline (ay). Battle poses reuse the side view at that same native
// height, except the Cinder Maw and the Tidewyrm, whose battle frames are
// taller. Read the size with Art.nativeSize(id, pose, facing). Field scale
// stays 2 so a 412px-wide phone still shows a person, not a giant.
(function () {
  var C = Art.C;
  var plot = Art.plot;
  var fill = Art.fill;

  var FW = 24;
  var FH = 38;
  var FAX = 11;
  var FAY = 36;
  var SW = 36;
  var SH = 38;
  var SAX = 14;
  var SAY = 36;

  function sprF() {
    var s = Art.spr(FW, FH);
    s.ax = FAX;
    s.ay = FAY;
    return s;
  }

  function sprS() {
    var s = Art.spr(SW, SH);
    s.ax = SAX;
    s.ay = SAY;
    return s;
  }

  function hairHi(d) {
    if (d.hairL) return d.hairL;
    if (d.hair === C.hairK || d.hair === C.ink || d.hair === C.void) return C.hair;
    if (d.hair === C.hair) return C.path;
    if (d.hair === C.hairR) return C.emberH;
    if (d.hair === C.hairW || d.hair === C.hairWD) return C.paper;
    if (d.hair === C.weed) return C.tideL;
    return d.clothL || d.hair;
  }

  function shadeDisc(s, cx, cy, rx, ry, dark, mid, lite) {
    var y, x, nx, ny, e, c;
    rx = Math.max(1, rx);
    ry = Math.max(1, ry);
    for (y = -ry; y <= ry; y++) {
      for (x = -rx; x <= rx; x++) {
        nx = x / rx;
        ny = y / ry;
        e = nx * nx + ny * ny;
        if (e > 1) continue;
        c = mid;
        if (nx > 0.42 || ny > 0.5 || e > 0.8) c = dark;
        else if (nx < -0.28 && ny < -0.15 && e < 0.55) c = lite;
        plot(s, cx + x, cy + y, c);
      }
    }
  }

  function shaded(s, x, y, w, h, lite, mid, dark) {
    var row, col, c, k;
    if (w < 1 || h < 1) return;
    for (row = 0; row < h; row++) {
      for (col = 0; col < w; col++) {
        k = col / Math.max(1, w - 1);
        c = mid;
        if (k < 0.28) c = lite;
        else if (k > 0.7) c = dark;
        if (row === 0 && c === mid) c = lite;
        if (row === h - 1) c = dark;
        plot(s, x + col, y + row, c);
      }
    }
  }

  function gait(frame) {
    frame = ((frame % 4) + 4) % 4;
    if (frame === 0) return { bob: 0, liftL: 0, liftR: 2, reachL: -1, reachR: 1, armL: 1, armR: -1 };
    if (frame === 1) return { bob: -1, liftL: 1, liftR: 1, reachL: 0, reachR: 0, armL: 0, armR: 0 };
    if (frame === 2) return { bob: 0, liftL: 2, liftR: 0, reachL: 1, reachR: -1, armL: -1, armR: 1 };
    return { bob: -1, liftL: 1, liftR: 1, reachL: 0, reachR: 0, armL: 0, armR: 0 };
  }

  function floatBob(d, bob) {
    return d.nofeet ? bob - 1 : bob;
  }

  function leg(s, x, hip, lift, reach, boot, lite) {
    var len = 7 - lift;
    var top = hip + lift;
    if (len < 3) len = 3;
    fill(s, x, top, 3, len, boot);
    plot(s, x, top, lite || boot);
    plot(s, x + 2, top + 1, boot);
    fill(s, x + reach, top + len, 4, 2, boot);
    plot(s, x + 1 + reach, top + len, lite || boot);
  }

  function armColumn(s, x, y, swing, cloth, hand, skinD) {
    var dy = swing > 0 ? -1 : (swing < 0 ? 1 : 0);
    fill(s, x, y + dy, 3, 7, cloth);
    plot(s, x, y + dy, cloth);
    fill(s, x, y + dy + 6, 3, 2, hand);
    plot(s, x + 1, y + dy + 6, skinD || hand);
    plot(s, x, y + dy + 7, hand);
  }

  function solidDisc(s, cx, cy, rx, ry, c) {
    var y, x;
    rx = Math.max(1, rx);
    ry = Math.max(1, ry);
    for (y = -ry; y <= ry; y++) {
      for (x = -rx; x <= rx; x++) {
        if ((x / rx) * (x / rx) + (y / ry) * (y / ry) <= 1) plot(s, cx + x, cy + y, c);
      }
    }
  }

  function drawHeadFront(s, cx, y, d, eyes) {
    var hi = hairHi(d);
    var metal = d.metal || C.armor;
    var metalD = d.metalD || C.armorD;
    solidDisc(s, cx, y + 7, 7, 8, d.hairD);
    solidDisc(s, cx, y + 6, 6, 7, d.hair);
    plot(s, cx - 2, y + 2, hi);
    plot(s, cx - 1, y + 3, hi);
    plot(s, cx - 3, y + 4, hi);
    if (d.style === "bun") {
      solidDisc(s, cx, y + 1, 3, 3, d.hair);
      solidDisc(s, cx, y, 2, 2, hi);
    }
    if (d.style === "pony" || d.style === "tail") {
      fill(s, cx + 6, y + 8, 2, 10, d.hair);
      fill(s, cx + 7, y + 10, 2, 7, d.hairD);
      plot(s, cx + 6, y + 9, d.tie || C.scarf);
      plot(s, cx + 7, y + 13, hi);
    }
    if (d.style === "bob") {
      fill(s, cx - 7, y + 6, 3, 10, d.hairD);
      fill(s, cx + 5, y + 6, 3, 10, d.hair);
    }
    if (d.style === "mask") {
      solidDisc(s, cx, y + 9, 5, 5, d.maskC || C.mask);
      fill(s, cx + 3, y + 8, 2, 6, d.maskD || C.maskD);
      fill(s, cx - 3, y + 8, 2, 2, C.void);
      fill(s, cx + 2, y + 8, 2, 2, C.void);
      plot(s, cx - 3, y + 8, d.hem || C.hem);
      if (d.hem) {
        plot(s, cx, y + 6, d.hem);
        plot(s, cx, y + 7, C.gold);
        plot(s, cx + 1, y + 10, d.hem);
      }
    } else {
      solidDisc(s, cx, y + 9, 5, 5, d.skin);
      fill(s, cx + 2, y + 8, 3, 7, d.skinD);
      plot(s, cx - 1, y + 6, C.lite);
      fill(s, cx - 6, y + 8, 2, 3, d.skinD);
      fill(s, cx + 5, y + 8, 2, 3, d.skin);
      if (d.goggles) {
        fill(s, cx - 5, y + 7, 11, 1, C.frame);
        fill(s, cx - 4, y + 8, 4, 2, C.lens);
        fill(s, cx + 1, y + 8, 4, 2, C.lens);
        plot(s, cx - 4, y + 8, C.white);
        plot(s, cx + 1, y + 8, C.lite);
        plot(s, cx, y + 8, C.metal);
      } else if (eyes === "shut") {
        fill(s, cx - 4, y + 8, 3, 1, d.skinDeep);
        fill(s, cx + 2, y + 8, 3, 1, d.skinDeep);
      } else {
        var brow = d.stern ? d.hairD : (d.hair || d.skinDeep);
        fill(s, cx - 4, y + 7, 3, 1, brow);
        fill(s, cx + 2, y + 7, 3, 1, brow);
        if (d.worried) {
          plot(s, cx - 4, y + 6, d.hair);
          plot(s, cx + 4, y + 6, d.hair);
        }
        fill(s, cx - 4, y + 8, 3, 2, C.white);
        fill(s, cx + 2, y + 8, 3, 2, C.white);
        plot(s, cx - 3, y + 9, C.eye);
        plot(s, cx - 2, y + 9, C.eye);
        plot(s, cx + 3, y + 9, C.eye);
        plot(s, cx + 4, y + 9, C.eye);
        plot(s, cx - 4, y + 8, C.lite);
        plot(s, cx + 2, y + 8, C.lite);
      }
      plot(s, cx, y + 11, d.skinD);
      if (d.old) {
        plot(s, cx - 4, y + 10, d.skinD);
        plot(s, cx + 4, y + 10, d.skinD);
        fill(s, cx - 2, y + 13, 5, 1, d.skinDeep);
      } else if (eyes === "shut") {
        fill(s, cx - 2, y + 13, 4, 1, d.skinDeep);
      } else {
        fill(s, cx - 2, y + 13, d.young ? 5 : 4, 1, C.lip);
      }
      if (d.young) {
        plot(s, cx - 3, y + 11, d.skinDeep);
        plot(s, cx + 3, y + 12, d.skinD);
      }
    }
    if (d.style === "short" || d.style === "pony" || d.style === "tail" || !d.style) {
      fill(s, cx - 4, y + 5, 8, 2, d.hair);
      plot(s, cx - 3, y + 5, hi);
      plot(s, cx + 2, y + 6, d.hairD);
    }
    if (d.style === "cap") {
      fill(s, cx - 6, y + 1, 13, 3, d.cap || d.cloth);
      fill(s, cx - 7, y + 4, 15, 2, d.capD || d.clothD);
      plot(s, cx - 4, y + 2, hi);
    }
    if (d.style === "brim") {
      fill(s, cx - 5, y, 11, 3, d.cap || d.cloth);
      fill(s, cx - 8, y + 3, 17, 2, d.capD || C.gold);
      plot(s, cx - 2, y + 1, hi);
    }
    if (d.style === "hood" || d.style === "mask") {
      fill(s, cx - 7, y + 2, 3, 9, d.hairD);
      fill(s, cx + 5, y + 2, 3, 9, d.hair);
      fill(s, cx - 5, y + 2, 11, 2, d.hair);
      plot(s, cx - 3, y + 3, hi);
    }
    if (d.style === "helm") {
      fill(s, cx - 7, y, 15, 5, metal);
      fill(s, cx - 5, y + 1, 4, 2, C.armorL);
      fill(s, cx - 8, y + 4, 3, 8, metalD);
      fill(s, cx + 6, y + 4, 3, 8, metal);
      fill(s, cx - 5, y + 5, 11, 2, metalD);
      fill(s, cx + 6, y - 3, 2, 5, d.plume || C.plume);
      plot(s, cx + 7, y - 4, d.plume || C.plume);
      plot(s, cx - 3, y + 1, C.lite);
    }
    if (d.femme && d.style !== "helm" && d.style !== "hood" && d.style !== "mask") {
      plot(s, cx - 5, y + 12, d.hair);
      plot(s, cx + 5, y + 12, d.hairD);
    }
    fill(s, cx - 1, y + 14, 3, 2, d.style === "mask" ? (d.maskC || C.mask) : d.skinD);
  }

  function extrasFront(s, d, y, x, w) {
    if (d.apron) {
      fill(s, 9, y + 3, 6, 7, C.cream);
      plot(s, 9, y + 3, C.goldD);
      plot(s, 14, y + 4, C.gold);
      plot(s, 11, y + 6, C.paper);
    }
    if (d.coil) {
      plot(s, 3, y + 4, C.goldD);
      plot(s, 2, y + 5, C.wood);
      plot(s, 3, y + 6, C.gold);
      plot(s, 4, y + 5, C.woodD);
      plot(s, 3, y + 7, C.goldD);
    }
    if (d.mug) {
      fill(s, x + w, y + 4, 2, 3, C.cream);
      plot(s, x + w + 2, y + 5, C.gold);
      plot(s, x + w, y + 4, C.lite);
    }
    if (d.hook) {
      plot(s, 20, y + 5, C.metal);
      plot(s, 21, y + 6, C.metalD);
      plot(s, 21, y + 7, C.metal);
      plot(s, 20, y + 8, C.lite);
    }
    if (d.lantern) {
      fill(s, 20, y + 4, 2, 1, C.wood);
      plot(s, 20, y + 5, C.gold);
      plot(s, 21, y + 6, C.warm);
      plot(s, 20, y + 7, C.goldD);
      plot(s, 21, y + 5, C.lite);
    }
    if (d.net) {
      plot(s, 2, y + 1, C.sand);
      plot(s, 1, y + 2, C.paper);
      plot(s, 3, y + 2, C.wood);
      plot(s, 2, y + 3, C.sand);
      plot(s, 1, y + 4, C.paper);
      plot(s, 3, y + 4, C.sand);
    }
    if (d.satchel) {
      shaded(s, 2, y + 4, 4, 5, C.gold, C.goldD, C.woodD);
      plot(s, 3, y + 5, C.violet);
      plot(s, 4, y + 6, C.gold);
    }
    if (d.pistol) {
      fill(s, 18, y + 6, 3, 2, C.metalD);
      plot(s, 18, y + 5, C.wood);
      plot(s, 20, y + 6, C.metal);
    }
    if (d.core) {
      plot(s, 11, y + 4, d.core);
      plot(s, 10, y + 4, d.coreD || C.violetD);
      plot(s, 12, y + 5, C.lite);
    }
  }

  function paintDown(d, frame) {
    var g = gait(frame);
    var bob = floatBob(d, g.bob);
    var s = sprF();
    var cx = 11;
    var y = 3 + bob;
    drawHeadFront(s, cx, y, d, "open");
    var tw = d.broad ? 14 : 12;
    var tx = cx - (tw >> 1);
    var th = (d.coat || d.robe || d.skirt) ? 10 : 8;
    var by = 18 + bob;
    shaded(s, tx, by, tw, th, d.clothL, d.cloth, d.clothD);
    fill(s, cx, by + 2, 1, th - 4, d.clothD);
    plot(s, cx - 3, by + 2, d.clothL);
    plot(s, cx - 2, by + 3, d.clothL);
    plot(s, cx + 2, by + 4, d.clothD);
    if (d.shirt) {
      fill(s, cx - 2, by + 1, 5, 4, d.shirt);
      plot(s, cx - 1, by + 2, C.lite);
      plot(s, cx + 1, by + 3, d.skinD);
    }
    if (d.stole) {
      fill(s, cx - 1, by, 3, th, d.stole);
      plot(s, cx, by + 2, C.white);
    }
    if (d.scarf) {
      fill(s, tx, by, tw, 3, C.scarf);
      fill(s, tx + 1, by, tw - 4, 1, C.gold);
      fill(s, tx + tw - 2, by + 2, 2, 5, C.scarfD);
    }
    if (d.armor) {
      shaded(s, tx - 1, by, 4, 3, C.armorL, C.armor, C.armorD);
      shaded(s, tx + tw - 3, by, 4, 3, C.armorL, C.armor, C.armorD);
      plot(s, cx, by + 3, C.gold);
      plot(s, cx, by + 5, C.metal);
    }
    if (d.belt) {
      fill(s, tx, by + th - 2, tw, 2, C.belt);
      plot(s, cx - 1, by + th - 2, C.metal);
      plot(s, cx, by + th - 2, C.gold);
      plot(s, cx + 1, by + th - 1, C.metalD);
    }
    var hand = d.style === "mask" ? d.clothD : d.skin;
    armColumn(s, tx - 3, by + 1, g.armL, d.armor ? C.armorD : d.clothD, hand, d.skinD);
    armColumn(s, tx + tw, by + 1, g.armR, d.armor ? C.armor : d.cloth, hand, d.skinD);
    if (d.shard) {
      var hx = tx + tw + 1;
      plot(s, hx, by + 7, C.shardH);
      plot(s, hx + 1, by + 7, C.white);
      plot(s, hx, by + 8, C.shard);
      plot(s, hx + 1, by + 8, C.shardD);
    } else if (d.wrench) {
      fill(s, tx + tw + 1, by + 6, 1, 3, C.metalD);
      plot(s, tx + tw, by + 8, C.metal);
      plot(s, tx + tw + 2, by + 8, C.metal);
    }
    extrasFront(s, d, by, tx, tw);
    if (d.robe && d.nofeet) {
      shaded(s, 5, 26, 14, 8, d.clothL, d.cloth, d.clothD);
      fill(s, 11, 27, 1, 6, d.clothD);
      fill(s, 7, 28, 1, 4, d.clothL);
      fill(s, 5, 33, 14, 2, d.hem || C.hem);
      plot(s, 8, 33, C.gold);
      plot(s, 15, 34, C.goldD);
    } else if (d.robe || d.skirt) {
      shaded(s, 6, 26, 12, 5, d.clothL, d.cloth, d.clothD);
      fill(s, 11, 27, 1, 4, d.clothD);
      fill(s, 8, 28, 1, 2, d.clothL);
      if (d.hem) fill(s, 6, 30, 12, 1, d.hem);
      leg(s, 7, 30, g.liftL, g.reachL, d.boot, d.clothL);
      leg(s, 13, 30, g.liftR, g.reachR, d.boot, d.cloth);
    } else {
      leg(s, 7, 27, g.liftL, g.reachL, d.boot, d.clothL);
      leg(s, 13, 27, g.liftR, g.reachR, d.boot, d.cloth);
    }
    if (d.staff) {
      fill(s, 21, 6 + bob, 1, 28, C.woodD);
      fill(s, 21, 8 + bob, 1, 24, C.wood);
      shaded(s, 20, 4 + bob, 3, 3, C.gold, C.gold, C.goldD);
      plot(s, 21, 5 + bob, C.shardH);
    }
    if (d.spear) {
      fill(s, 21, 3 + bob, 1, 30, C.metalD);
      plot(s, 21, 6 + bob, C.metal);
      fill(s, 20, 2 + bob, 3, 2, C.armorL);
      plot(s, 21, 2 + bob, C.lite);
    }
    return s;
  }

  function paintUp(d, frame) {
    var g = gait(frame);
    var bob = floatBob(d, g.bob);
    var s = sprF();
    var cx = 11;
    var y = 3 + bob;
    var hi = hairHi(d);
    if (d.style === "helm") {
      fill(s, cx - 6, y + 1, 13, 8, d.metalD || C.armorD);
      fill(s, cx - 4, y + 2, 5, 3, d.metal || C.armorL);
      fill(s, cx + 6, y - 2, 2, 5, d.plume || C.plume);
    } else if (d.style === "hood" || d.style === "mask") {
      shadeDisc(s, cx, y + 6, 7, 8, d.hairD, d.hair, hi);
    } else if (d.style === "bun") {
      shadeDisc(s, cx, y + 1, 3, 3, d.hairD, d.hair, hi);
      shadeDisc(s, cx, y + 6, 6, 5, d.hairD, d.hair, d.hair);
    } else if (d.style === "pony" || d.style === "tail") {
      shadeDisc(s, cx, y + 5, 6, 5, d.hairD, d.hair, hi);
      fill(s, cx - 1, y + 10, 3, 8, d.hair);
      fill(s, cx, y + 12, 2, 5, d.hairD);
      plot(s, cx, y + 11, d.tie || C.scarf);
    } else if (d.style === "bob") {
      shadeDisc(s, cx, y + 6, 7, 7, d.hairD, d.hair, hi);
    } else if (d.style === "cap") {
      fill(s, cx - 6, y + 1, 13, 3, d.cap || d.cloth);
      fill(s, cx - 7, y + 4, 15, 2, d.capD || d.clothD);
      shadeDisc(s, cx, y + 7, 6, 4, d.hairD, d.hair, hi);
    } else if (d.style === "brim") {
      fill(s, cx - 4, y, 9, 3, d.cap || d.cloth);
      fill(s, cx - 8, y + 3, 17, 2, d.capD || C.gold);
      shadeDisc(s, cx, y + 7, 6, 4, d.hairD, d.hair, hi);
    } else {
      shadeDisc(s, cx, y + 5, 6, 6, d.hairD, d.hair, hi);
      plot(s, cx - 2, y + 3, hi);
    }
    var tw = d.broad ? 14 : 12;
    var tx = cx - (tw >> 1);
    var th = (d.coat || d.robe || d.skirt) ? 10 : 8;
    var by = 18 + bob;
    shaded(s, tx, by, tw, th, d.clothD, d.cloth, d.clothD);
    fill(s, cx, by + 2, 1, th - 3, d.clothD);
    plot(s, cx - 2, by + 2, d.clothL);
    if (d.scarf) fill(s, tx + 1, by, tw - 2, 2, C.scarfD);
    if (d.stole) fill(s, cx - 1, by, 3, th, d.stole);
    if (d.belt) fill(s, tx, by + th - 2, tw, 2, C.belt);
    if (d.armor) {
      fill(s, tx - 1, by, 3, 3, C.armorD);
      fill(s, tx + tw - 2, by, 3, 3, C.armor);
    }
    armColumn(s, tx - 3, by + 1, g.armL, d.clothD, d.clothD, d.clothD);
    armColumn(s, tx + tw, by + 1, g.armR, d.cloth, d.cloth, d.cloth);
    if (d.robe && d.nofeet) {
      shaded(s, 5, 26, 14, 8, d.clothD, d.cloth, d.clothD);
      fill(s, 5, 33, 14, 2, d.hem || C.hem);
    } else if (d.robe || d.skirt) {
      shaded(s, 6, 26, 12, 5, d.clothD, d.cloth, d.clothD);
      leg(s, 7, 30, g.liftL, g.reachL, d.boot, d.clothD);
      leg(s, 13, 30, g.liftR, g.reachR, d.boot, d.boot);
    } else {
      leg(s, 7, 27, g.liftL, g.reachL, d.boot, d.clothD);
      leg(s, 13, 27, g.liftR, g.reachR, d.boot, d.boot);
    }
    if (d.staff) {
      fill(s, 2, 6 + bob, 1, 28, C.wood);
      shaded(s, 1, 4 + bob, 3, 3, C.gold, C.gold, C.goldD);
      plot(s, 2, 5 + bob, C.shardH);
    }
    if (d.spear) {
      fill(s, 2, 3 + bob, 1, 30, C.metalD);
      fill(s, 1, 2 + bob, 3, 2, C.armorL);
    }
    if (d.satchel) shaded(s, 3, by + 4, 4, 5, C.gold, C.goldD, C.woodD);
    if (d.shard) {
      plot(s, tx - 2, by + 7, C.shardH);
      plot(s, tx - 1, by + 8, C.shard);
    }
    return s;
  }

  function spark(s, x, y, d, frame) {
    var c = d.cast || (d.shard ? C.shardH : (d.core || C.gold));
    var dcol = d.castD || C.shard;
    plot(s, x, y, c);
    plot(s, x + 1, y + 1, C.lite);
    plot(s, x - 1, y + 1, dcol);
    plot(s, x + 2, y + 2, c);
    if (frame % 2) {
      plot(s, x + 1, y - 1, C.white);
      plot(s, x - 2, y + 2, c);
      plot(s, x + 3, y, C.lite);
    }
  }

  function weaponSide(s, x, y, d, mode, frame) {
    var big = mode === "strike";
    var up = mode === "up";
    if (d.shard) {
      if (up) {
        fill(s, x, y, 2, 7, C.shard);
        plot(s, x, y, C.white);
        plot(s, x + 1, y + 1, C.shardH);
        plot(s, x, y + 3, C.shardD);
      } else if (big) {
        fill(s, x, y, 8, 2, C.shard);
        plot(s, x + 1, y, C.white);
        plot(s, x + 4, y - 1, C.shardH);
        plot(s, x + 7, y, C.lite);
        plot(s, x, y + 1, C.shardD);
        if (frame % 2) plot(s, x + 8, y - 1, C.white);
      } else {
        plot(s, x, y, C.shardH);
        plot(s, x + 1, y, C.white);
        plot(s, x, y + 1, C.shard);
        plot(s, x + 1, y + 1, C.shardD);
      }
      return;
    }
    if (d.pistol) {
      var len = big ? 7 : 4;
      fill(s, x, y, len, 2, C.metalD);
      plot(s, x, y, C.wood);
      plot(s, x + 2, y, C.metal);
      plot(s, x + 1, y + 1, C.woodD);
      if (big) {
        plot(s, x + len, y, frame % 2 ? C.white : C.warm);
        plot(s, x + len, y - 1, C.gold);
      }
      return;
    }
    if (d.wrench) {
      if (up) {
        fill(s, x, y, 1, 6, C.metalD);
        plot(s, x - 1, y, C.metal);
        plot(s, x + 1, y, C.metal);
        plot(s, x, y + 1, C.lite);
      } else if (big) {
        fill(s, x, y, 6, 1, C.metal);
        fill(s, x, y + 2, 6, 1, C.metal);
        fill(s, x, y, 1, 3, C.metalD);
        plot(s, x + 5, y, C.lite);
      } else {
        fill(s, x, y, 1, 4, C.metalD);
        plot(s, x - 1, y + 3, C.metal);
        plot(s, x + 1, y + 3, C.metal);
      }
      return;
    }
    if (d.staff) {
      if (up) {
        fill(s, x, y, 1, 12, C.wood);
        shaded(s, x - 1, y, 3, 3, C.gold, C.gold, C.goldD);
        plot(s, x, y + 1, C.shardH);
      } else if (big) {
        fill(s, x, y + 2, 8, 1, C.wood);
        shaded(s, x + 6, y + 1, 3, 3, C.gold, C.gold, C.goldD);
        plot(s, x + 7, y + 2, C.shardH);
      }
      return;
    }
    if (d.spear) {
      if (up) {
        fill(s, x, y, 1, 14, C.metalD);
        fill(s, x - 1, y, 3, 2, C.armorL);
        plot(s, x, y, C.lite);
      } else if (big) {
        fill(s, x, y + 1, 9, 1, C.metalD);
        fill(s, x + 7, y, 3, 2, C.armorL);
        plot(s, x + 8, y, C.lite);
        plot(s, x + 2, y + 1, C.metal);
      }
      return;
    }
    if (d.knife) {
      fill(s, x, y, big ? 6 : 3, 1, C.metal);
      plot(s, x, y + 1, C.woodD);
      if (big) plot(s, x + 5, y, C.lite);
      return;
    }
    if (d.core) {
      plot(s, x, y, d.core);
      plot(s, x + 1, y + 1, C.lite);
      if (big) {
        plot(s, x + 3, y, C.core);
        plot(s, x + 4, y + 1, C.white);
        plot(s, x + 2, y - 1, d.coreD || C.violet);
      }
      return;
    }
    if (big) {
      fill(s, x, y, 3, 3, d.skin);
      plot(s, x, y, C.lite);
      plot(s, x + 2, y + 1, d.skinD);
    }
  }

  function drawHeadSide(s, x, y, d, eyes) {
    var hi = hairHi(d);
    var metal = d.metal || C.armor;
    solidDisc(s, x + 7, y + 7, 6, 7, d.hairD);
    solidDisc(s, x + 8, y + 6, 5, 6, d.hair);
    plot(s, x + 5, y + 2, hi);
    plot(s, x + 6, y + 3, hi);
    if (d.style === "pony" || d.style === "tail") {
      fill(s, x, y + 5, 3, 11, d.hair);
      fill(s, x - 1, y + 9, 2, 7, d.hairD);
      plot(s, x + 1, y + 6, d.tie || C.scarf);
      plot(s, x, y + 12, hi);
    } else if (d.style === "bun") {
      solidDisc(s, x + 7, y, 3, 3, d.hair);
      plot(s, x + 7, y - 1, hi);
    } else if (d.style === "bob") {
      fill(s, x + 1, y + 6, 3, 8, d.hairD);
    }
    if (d.style === "mask") {
      solidDisc(s, x + 8, y + 8, 5, 5, d.maskC || C.mask);
      fill(s, x + 10, y + 7, 2, 2, C.void);
      plot(s, x + 11, y + 7, d.hem || C.hem);
      plot(s, x + 13, y + 9, d.maskD || C.maskD);
      if (d.hem) {
        plot(s, x + 9, y + 5, d.hem);
        plot(s, x + 10, y + 6, C.gold);
      }
    } else {
      solidDisc(s, x + 9, y + 8, 5, 6, d.skin);
      fill(s, x + 12, y + 7, 2, 6, d.skinD);
      fill(s, x + 13, y + 8, 2, 2, d.skin);
      plot(s, x + 14, y + 9, d.skinD);
      plot(s, x + 6, y + 5, C.lite);
      if (d.goggles) {
        fill(s, x + 8, y + 6, 7, 3, C.frame);
        fill(s, x + 9, y + 7, 4, 2, C.lens);
        plot(s, x + 9, y + 7, C.white);
        plot(s, x + 11, y + 7, C.lite);
      } else if (eyes === "shut") {
        fill(s, x + 9, y + 7, 3, 1, d.skinDeep);
      } else {
        fill(s, x + 8, y + 6, 4, 1, d.stern ? d.hairD : d.hair);
        fill(s, x + 9, y + 7, 3, 2, C.white);
        plot(s, x + 10, y + 8, C.eye);
        plot(s, x + 11, y + 8, C.eye);
        plot(s, x + 9, y + 7, C.lite);
      }
      if (d.old) {
        plot(s, x + 9, y + 9, d.skinD);
        fill(s, x + 11, y + 12, 3, 1, d.skinDeep);
      } else if (eyes === "shut") {
        fill(s, x + 11, y + 12, 3, 1, d.skinDeep);
      } else {
        fill(s, x + 11, y + 12, 3, 1, C.lip);
        plot(s, x + 10, y + 12, d.skinD);
      }
      if (d.young) plot(s, x + 8, y + 10, d.skinDeep);
    }
    if (d.style === "cap") {
      fill(s, x + 4, y + 1, 10, 3, d.cap || d.cloth);
      fill(s, x + 3, y + 4, 12, 2, d.capD || d.clothD);
      plot(s, x + 6, y + 2, hi);
    } else if (d.style === "brim") {
      fill(s, x + 4, y, 10, 3, d.cap || d.cloth);
      fill(s, x, y + 3, 16, 2, d.capD || C.gold);
    } else if (d.style === "hood" || d.style === "mask") {
      fill(s, x + 2, y + 2, 4, 8, d.hairD);
      fill(s, x + 5, y + 2, 8, 3, d.hair);
      plot(s, x + 6, y + 3, hi);
    } else if (d.style === "helm") {
      fill(s, x + 4, y, 10, 5, metal);
      fill(s, x + 5, y + 1, 4, 2, C.armorL);
      fill(s, x + 3, y + 4, 3, 6, d.metalD || C.armorD);
      fill(s, x + 11, y + 4, 3, 3, metal);
      fill(s, x, y + 1, 4, 4, d.plume || C.plume);
      plot(s, x - 1, y, d.plume || C.plume);
      plot(s, x + 1, y + 2, C.lite);
    } else if (d.style !== "mask") {
      fill(s, x + 6, y + 4, 5, 2, d.hair);
      plot(s, x + 7, y + 4, hi);
    }
    if (d.style !== "mask") fill(s, x + 8, y + 14, 4, 3, d.skinD);
    else fill(s, x + 8, y + 14, 4, 2, d.maskC || C.mask);
  }

  function paintSide(d, frame, pose) {
    pose = pose || "walk";
    var g = gait(frame);
    var bob = pose === "walk" ? g.bob : 0;
    var lean = 0;
    var eyes = "open";
    if (pose === "idle") bob = frame % 2 ? -1 : 0;
    if (pose === "hurt") {
      bob = 1;
      lean = -2;
      eyes = "shut";
    }
    if (pose === "attack") lean = frame % 2 ? 2 : 1;
    if (pose === "cast") bob = frame % 2 ? -1 : 0;
    if (pose === "victory") bob = frame % 2 ? -3 : -2;
    bob = floatBob(d, bob);
    var s = sprS();
    var x = 6 + lean;
    var y = 4 + bob;
    var boot = d.boot || d.clothD;
    if (!(d.robe && d.nofeet)) {
      var hip = (d.robe || d.skirt) ? 28 + bob : 26 + bob;
      var liftB = pose === "walk" ? (frame === 2 ? 0 : (frame % 2 ? 1 : 2)) : (pose === "attack" ? 1 : 0);
      var liftF = pose === "walk" ? (frame === 0 ? 0 : (frame % 2 ? 1 : 2)) : (pose === "hurt" ? 1 : 0);
      var reach = pose === "attack" ? 2 : (pose === "walk" && frame === 0 ? 2 : (frame === 2 ? -1 : 0));
      fill(s, x + 2, hip + liftB, 3, Math.max(3, 7 - liftB), boot);
      fill(s, x + 6, hip + liftF, 3, Math.max(3, 7 - liftF), boot);
      fill(s, x + 6 + reach, hip + liftF + Math.max(3, 7 - liftF), 4, 2, boot);
      plot(s, x + 7 + reach, hip + liftF + Math.max(3, 7 - liftF), d.clothL || boot);
    }
    if (d.coat) fill(s, x, 22 + bob, 3, 7, d.clothD);
    if (pose !== "attack" && pose !== "victory") {
      if (d.spear) {
        fill(s, x, y, 1, 32, C.metalD);
        fill(s, x - 1, y, 3, 2, C.armorL);
        plot(s, x, y, C.lite);
        plot(s, x, y + 8, C.metal);
      } else if (d.staff) {
        fill(s, x, y + 4, 1, 28, C.wood);
        fill(s, x, y + 6, 1, 22, C.woodL);
        shaded(s, x - 1, y + 2, 3, 3, C.gold, C.gold, C.goldD);
        plot(s, x, y + 3, C.shardH);
      }
    }
    var bw = d.broad ? 12 : 10;
    var by = 16 + bob;
    shaded(s, x + 2, by, bw, 10, d.clothL, d.cloth, d.clothD);
    fill(s, x + 2, by + 1, 2, 8, d.clothD);
    fill(s, x + bw - 1, by + 2, 2, 5, d.clothL);
    plot(s, x + 5, by + 3, d.clothD);
    plot(s, x + 6, by + 5, d.clothD);
    plot(s, x + 4, by + 2, d.clothL);
    if (d.shirt) {
      fill(s, x + 5, by + 2, 4, 4, d.shirt);
      plot(s, x + 6, by + 3, C.lite);
    }
    if (d.scarf) {
      fill(s, x + 3, by, 8, 3, C.scarf);
      fill(s, x + 4, by, 4, 1, C.gold);
      fill(s, x, by + 2, 3, 4, C.scarfD);
    }
    if (d.armor) {
      shaded(s, x + 3, by, 7, 4, C.armorL, C.armor, C.armorD);
      plot(s, x + 6, by + 4, C.gold);
      plot(s, x + 8, by + 2, C.lite);
    }
    if (d.belt) {
      fill(s, x + 2, by + 8, bw, 2, C.belt);
      plot(s, x + 8, by + 8, C.gold);
      plot(s, x + 6, by + 9, C.metal);
    }
    if (d.stole) {
      fill(s, x + 5, by, 2, 10, d.stole);
      plot(s, x + 5, by + 2, C.white);
    }
    if (d.apron) {
      fill(s, x + 5, by + 3, 4, 7, C.cream);
      plot(s, x + 5, by + 3, C.goldD);
    }
    if (d.core) {
      plot(s, x + 7, by + 4, d.core);
      plot(s, x + 8, by + 5, C.lite);
    }
    fill(s, x + 1, by + 2, 2, 6, d.clothD);
    drawHeadSide(s, x + 2, y, d, eyes);
    var hand = d.style === "mask" ? d.clothD : d.skin;
    var ax = x + 10;
    var ay = by + 2;
    if (pose === "attack") {
      fill(s, ax, ay + 1, 8, 3, d.cloth);
      plot(s, ax, ay + 1, d.clothL);
      fill(s, ax + 7, ay + 1, 3, 3, hand);
      plot(s, ax + 8, ay + 2, d.skinD || hand);
      weaponSide(s, ax + 9, ay + 1, d, "strike", frame);
    } else if (pose === "cast") {
      fill(s, ax + 1, ay - 6, 3, 8, d.cloth);
      fill(s, ax + 1, ay - 8, 3, 3, hand);
      spark(s, ax + 2, ay - 11, d, frame);
      weaponSide(s, ax + 3, ay - 2, d, false, frame);
    } else if (pose === "victory") {
      fill(s, ax, ay - 8, 3, 9, d.clothL);
      fill(s, ax, ay - 10, 3, 3, hand);
      weaponSide(s, ax + 1, ay - 16, d, "up", frame);
      plot(s, ax + 4, ay - 12, C.gold);
    } else if (pose === "hurt") {
      fill(s, ax - 1, ay + 1, 3, 6, d.clothD);
      fill(s, ax - 2, ay + 6, 3, 2, hand);
    } else {
      var swing = pose === "walk" ? (frame === 0 ? 1 : (frame === 2 ? -1 : 0)) : (frame % 2 ? -1 : 0);
      fill(s, ax, ay + swing, 3, 7, d.clothD);
      plot(s, ax, ay + swing, d.clothL);
      fill(s, ax, ay + 6 + swing, 3, 2, hand);
      plot(s, ax + 1, ay + 6 + swing, d.skinD || hand);
      weaponSide(s, ax + 2, ay + 6 + swing, d, false, frame);
    }
    if (d.robe && d.nofeet) {
      shaded(s, x + 1, 24 + bob, 12, 9, d.clothL, d.cloth, d.clothD);
      fill(s, x + 3, 26 + bob, 1, 6, d.clothD);
      fill(s, x + 8, 27 + bob, 1, 4, d.clothL);
      fill(s, x, 33 + bob, 14, 2, d.hem || C.hem);
      plot(s, x + 3, 33 + bob, C.gold);
    } else if (d.robe || d.skirt) {
      shaded(s, x + 2, 24 + bob, bw, 5, d.clothL, d.cloth, d.clothD);
      fill(s, x + 4, 26 + bob, 1, 3, d.clothD);
    }
    if (d.pistol && pose !== "attack") {
      fill(s, x + 12, by + 6, 4, 2, C.metalD);
      plot(s, x + 12, by + 5, C.wood);
      plot(s, x + 15, by + 6, C.metal);
    }
    if (d.satchel) shaded(s, x - 1, by + 4, 4, 5, C.gold, C.goldD, C.woodD);
    if (d.hook) {
      plot(s, x + 13, by + 6, C.metal);
      plot(s, x + 14, by + 7, C.metalD);
      plot(s, x + 14, by + 8, C.metal);
    }
    if (d.lantern) {
      plot(s, x + 13, by + 5, C.gold);
      plot(s, x + 14, by + 6, C.warm);
      plot(s, x + 13, by + 7, C.lite);
    }
    if (d.mug) {
      fill(s, x + 13, by + 5, 2, 3, C.cream);
      plot(s, x + 15, by + 6, C.gold);
    }
    if (d.coil) {
      plot(s, x, by + 5, C.goldD);
      plot(s, x - 1, by + 6, C.wood);
      plot(s, x, by + 7, C.gold);
    }
    if (d.net) {
      plot(s, x - 1, by, C.sand);
      plot(s, x - 2, by + 1, C.paper);
      plot(s, x, by + 2, C.wood);
      plot(s, x - 1, by + 3, C.sand);
    }
    return s;
  }

  function finish(s) {
    Art.outline(s);
    return s;
  }

  function person(d, scale, fieldScale) {
    var cache = {};
    function bake(dir, frame) {
      var k = "f|" + dir + "|" + frame;
      if (cache[k]) return cache[k];
      var s;
      if (dir === "up") s = paintUp(d, frame);
      else if (dir === "right" || dir === "left") s = paintSide(d, frame, "walk");
      else s = paintDown(d, frame);
      finish(s);
      if (dir === "left") s = Art.mirror(s);
      cache[k] = s;
      return s;
    }
    function bakeBattle(pose, facing, frame) {
      var k = "b|" + pose + "|" + facing + "|" + frame;
      if (cache[k]) return cache[k];
      var s = paintSide(d, frame, pose);
      finish(s);
      if (facing === "left") s = Art.mirror(s);
      cache[k] = s;
      return s;
    }
    Art.add(d.id, function (pose, facing, frame) {
      frame = ((frame % 4) + 4) % 4;
      if (pose === "walk") {
        var dir = facing;
        if (dir !== "up" && dir !== "down" && dir !== "left" && dir !== "right") dir = "down";
        return Art.clone(bake(dir, frame));
      }
      var face = facing === "left" ? "left" : "right";
      return Art.clone(bakeBattle(pose, face, frame % 2));
    }, scale, 1);
    Art.addPortrait(d.id, function () { return portrait(d); });
  }

  function portrait(d) {
    var s = Art.spr(32, 32);
    var hi = hairHi(d);
    fill(s, 0, 0, 32, 32, d.bg || C.coatD);
    shadeDisc(s, 16, 27, 14, 8, d.clothD, d.cloth, d.clothL);
    fill(s, 8, 24, 16, 2, d.clothL);
    if (d.shirt) fill(s, 12, 23, 8, 4, d.shirt);
    if (d.scarf) {
      fill(s, 8, 21, 16, 3, C.scarf);
      plot(s, 10, 21, C.gold);
    }
    if (d.armor) {
      shaded(s, 4, 22, 8, 6, C.armorL, C.armor, C.armorD);
      shaded(s, 20, 22, 8, 6, C.armorL, C.armor, C.armorD);
      plot(s, 16, 25, C.gold);
    }
    if (d.belt) {
      fill(s, 8, 28, 16, 2, C.belt);
      plot(s, 15, 28, C.gold);
      plot(s, 17, 29, C.metal);
    }
    if (d.stole) fill(s, 13, 22, 6, 8, d.stole);
    if (d.apron) fill(s, 12, 24, 8, 7, C.cream);
    fill(s, 13, 20, 6, 3, d.style === "mask" ? (d.maskC || C.mask) : d.skinD);
    if (d.style === "mask") {
      shadeDisc(s, 16, 12, 10, 11, d.hairD, d.hair, hi);
      shadeDisc(s, 16, 14, 7, 8, d.maskD || C.maskD, d.maskC || C.mask, C.cloud);
      fill(s, 11, 13, 3, 3, C.void);
      fill(s, 18, 13, 3, 3, C.void);
      plot(s, 12, 13, C.hem);
      plot(s, 20, 14, d.hem || C.voidL);
      if (d.hem) {
        plot(s, 16, 10, d.hem);
        plot(s, 16, 12, C.gold);
        plot(s, 17, 15, d.hem);
        plot(s, 16, 18, C.goldD);
      }
      fill(s, 10, 29, 12, 2, d.hem || C.hem);
    } else {
      if (d.style === "hood") shadeDisc(s, 16, 12, 12, 12, d.hairD, d.hair, hi);
      else shadeDisc(s, 16, 8, 10, 8, d.hairD, d.hair, hi);
      shadeDisc(s, 16, 15, 8, 8, d.skinDeep, d.skin, d.skin);
      plot(s, 14, 11, C.lite);
      plot(s, 9, 16, d.skinD);
      plot(s, 22, 16, d.skin);
      if (d.style === "bun") {
        shadeDisc(s, 16, 4, 5, 4, d.hairD, d.hair, hi);
        plot(s, 16, 2, C.lite);
      } else if (d.style === "pony" || d.style === "tail") {
        fill(s, 22, 10, 6, 12, d.hair);
        fill(s, 26, 14, 3, 8, d.hairD);
        plot(s, 23, 12, d.tie || C.scarf);
        plot(s, 24, 16, hi);
      } else if (d.style === "bob") {
        fill(s, 6, 12, 4, 10, d.hairD);
        fill(s, 22, 12, 4, 10, d.hair);
      } else if (d.style === "hood") {
        fill(s, 6, 8, 4, 10, d.hairD);
        fill(s, 22, 8, 4, 10, d.hair);
        fill(s, 10, 8, 12, 3, d.hair);
      } else if (d.style === "helm") {
        fill(s, 7, 5, 18, 6, d.metal || C.armor);
        fill(s, 8, 6, 6, 2, C.armorL);
        fill(s, 6, 10, 4, 6, d.metalD || C.armorD);
        fill(s, 22, 10, 4, 6, d.metal || C.armor);
        fill(s, 24, 3, 4, 7, d.plume || C.plume);
        plot(s, 26, 2, d.plume || C.plume);
        plot(s, 10, 6, C.lite);
      } else if (d.style === "cap") {
        fill(s, 7, 5, 18, 4, d.cap || d.cloth);
        fill(s, 5, 9, 22, 2, d.capD || d.clothD);
        plot(s, 10, 6, hi);
      } else if (d.style === "brim") {
        fill(s, 8, 3, 16, 4, d.cap || d.cloth);
        fill(s, 3, 7, 26, 2, d.capD || C.gold);
        plot(s, 12, 4, hi);
      } else {
        fill(s, 10, 10, 5, 2, d.hair);
        fill(s, 17, 10, 5, 2, d.hairD);
        plot(s, 13, 6, hi);
      }
      if (d.goggles) {
        fill(s, 9, 13, 14, 4, C.frame);
        fill(s, 10, 14, 5, 2, C.lens);
        fill(s, 17, 14, 5, 2, C.lens);
        plot(s, 11, 14, C.white);
        plot(s, 18, 14, C.lite);
      } else {
        var brow = d.stern ? d.hairD : d.hair;
        fill(s, 9, 12, 5, 1, brow);
        fill(s, 18, 12, 5, 1, brow);
        if (d.worried) {
          plot(s, 9, 11, d.hair);
          plot(s, 22, 11, d.hair);
        }
        fill(s, 10, 13, 4, 3, C.white);
        fill(s, 18, 13, 4, 3, C.white);
        fill(s, 11, 14, 2, 2, C.eye);
        fill(s, 19, 14, 2, 2, C.eye);
        plot(s, 10, 13, C.lite);
        plot(s, 18, 13, C.lite);
      }
      plot(s, 16, 17, d.skinD);
      plot(s, 15, 18, d.skinDeep);
      plot(s, 17, 18, d.skinD);
      if (d.old) {
        plot(s, 11, 16, d.skinD);
        plot(s, 20, 16, d.skinD);
        plot(s, 12, 19, d.skinDeep);
        plot(s, 19, 19, d.skinDeep);
        fill(s, 14, 20, 4, 1, d.skinDeep);
        plot(s, 27, 15, C.gold);
      } else {
        plot(s, 13, 20, C.lip);
        plot(s, 14, 21, C.lip);
        plot(s, 15, 20, d.young ? C.lip : d.skinD);
        plot(s, 16, 21, C.lip);
        plot(s, 17, 20, C.lip);
        plot(s, 18, 21, C.lip);
      }
      plot(s, 11, 18, d.skinD);
      plot(s, 20, 18, d.skinD);
      if (d.young) {
        plot(s, 12, 17, d.skinDeep);
        plot(s, 21, 18, d.skinD);
      }
      if (d.femme && d.style !== "hood" && d.style !== "helm") {
        plot(s, 9, 19, d.hair);
        plot(s, 22, 19, d.hair);
      }
    }
    if (d.shard) {
      plot(s, 26, 26, C.shardD);
      plot(s, 27, 25, C.shardH);
      plot(s, 27, 27, C.shard);
      plot(s, 28, 26, C.white);
    }
    if (d.core) {
      plot(s, 16, 26, d.core);
      plot(s, 17, 27, C.lite);
    }
    if (d.lantern) {
      plot(s, 26, 24, C.gold);
      plot(s, 27, 25, C.warm);
      plot(s, 26, 26, C.lite);
    }
    if (d.hook) {
      plot(s, 26, 25, C.metal);
      plot(s, 27, 26, C.metalD);
      plot(s, 26, 27, C.metal);
    }
    if (d.satchel) shaded(s, 2, 24, 5, 6, C.gold, C.goldD, C.woodD);
    s.ax = 16;
    s.ay = 31;
    return s;
  }

  person({
    id: "wayfarer", bg: C.coatD,
    skin: C.skin, skinD: C.skinD, skinDeep: C.skinDeep,
    hair: C.hairK, hairD: C.ink, style: "short",
    cloth: C.coat, clothD: C.coatD, clothL: C.coatL,
    boot: C.coatD, shard: true
  }, 2, 2);

  person({
    id: "kestrel", bg: C.tealD,
    skin: C.skin, skinD: C.skinD, skinDeep: C.skinDeep,
    hair: C.hair, hairD: C.hairD, style: "pony", tie: C.scarf,
    cloth: C.teal, clothD: C.tealD, clothL: C.tealL,
    boot: C.tealD, scarf: true, goggles: true, coat: true, pistol: true, femme: true
  }, 2, 2);

  person({
    id: "tamsin", bg: C.vestD,
    skin: C.skin, skinD: C.skinD, skinDeep: C.skinDeep,
    hair: C.hairR, hairD: C.hairRD, style: "tail", tie: C.gold,
    cloth: C.vest, clothD: C.vestD, clothL: C.vestL, shirt: C.cream,
    boot: C.vestD, belt: true, wrench: true, young: true
  }, 2, 2);

  person({
    id: "maren", bg: C.shawlD,
    skin: C.skin, skinD: C.skinD, skinDeep: C.skinDeep,
    hair: C.hairW, hairD: C.hairWD, hairL: C.paper, style: "bun",
    cloth: C.shawl, clothD: C.shawlD, clothL: C.shawlL,
    boot: C.shawlD, skirt: true, staff: true, old: true
  }, 2, 2);

  person({
    id: "hesk", bg: C.robeD,
    skin: C.pale, skinD: C.paleD, skinDeep: C.skinD,
    hair: C.robeD, hairD: C.void, style: "hood",
    cloth: C.robe, clothD: C.robeD, clothL: C.robeL, stole: C.stole,
    boot: C.robeD, robe: true, worried: true
  }, 2, 2);

  person({
    id: "ilsa", bg: C.armorD,
    skin: C.skinD, skinD: C.skinDeep, skinDeep: C.skinDeep,
    hair: C.hairK, hairD: C.ink, style: "helm",
    cloth: C.armorD, clothD: C.ink, clothL: C.armor,
    metal: C.armor, metalD: C.armorD, plume: C.plume,
    boot: C.armorD, armor: true, spear: true, broad: true, stern: true
  }, 2, 2);

  person({
    id: "cantor", bg: C.void,
    skin: C.mask, skinD: C.maskD, skinDeep: C.maskD,
    hair: C.void, hairD: C.voidD, style: "mask",
    maskC: C.mask, maskD: C.maskD,
    cloth: C.void, clothD: C.voidD, clothL: C.voidL,
    hem: C.hem, robe: true, nofeet: true, cast: C.hem, castD: C.gold
  }, 2, 2);

  person({
    id: "villager_a", bg: C.greenD,
    skin: C.skin, skinD: C.skinD, skinDeep: C.skinDeep,
    hair: C.hair, hairD: C.hairD, style: "cap", cap: C.green, capD: C.greenD,
    cloth: C.green, clothD: C.greenD, clothL: C.leafL,
    boot: C.woodD
  }, 2, 2);

  person({
    id: "villager_b", bg: C.redD,
    skin: C.skin, skinD: C.skinD, skinDeep: C.skinDeep,
    hair: C.hairK, hairD: C.ink, style: "bob",
    cloth: C.red, clothD: C.redD, clothL: C.cream,
    boot: C.redD, skirt: true, femme: true
  }, 2, 2);

  person({
    id: "brenna", bg: C.tealD,
    skin: C.skin, skinD: C.skinD, skinDeep: C.skinDeep,
    hair: C.hairK, hairD: C.ink, style: "cap", cap: C.tealD, capD: C.ink,
    cloth: C.teal, clothD: C.tealD, clothL: C.tealL,
    boot: C.woodD, coat: true, femme: true, stern: true, coil: true
  }, 2, 2);

  person({
    id: "osric", bg: C.woodD,
    skin: C.skin, skinD: C.skinD, skinDeep: C.skinDeep,
    hair: C.hairW, hairD: C.hairWD, hairL: C.paper, style: "short",
    cloth: C.vest, clothD: C.woodD, clothL: C.cream, shirt: C.cream,
    boot: C.woodD, apron: true, old: true, mug: true, broad: true
  }, 2, 2);

  person({
    id: "nessa", bg: C.vestD,
    skin: C.skin, skinD: C.skinD, skinDeep: C.skinDeep,
    hair: C.hair, hairD: C.hairD, style: "pony", tie: C.gold,
    cloth: C.sand, clothD: C.woodD, clothL: C.gold, shirt: C.cream,
    boot: C.woodD, belt: true, hook: true, femme: true
  }, 2, 2);

  person({
    id: "sera", bg: C.shawlD,
    skin: C.pale, skinD: C.paleD, skinDeep: C.skinD,
    hair: C.hairW, hairD: C.hairWD, style: "bob",
    cloth: C.shawl, clothD: C.shawlD, clothL: C.shawlL,
    boot: C.shawlD, skirt: true, worried: true, femme: true, lantern: true
  }, 2, 2);

  person({
    id: "pip", bg: C.greenD,
    skin: C.skin, skinD: C.skinD, skinDeep: C.skinDeep,
    hair: C.hairR, hairD: C.hairRD, style: "cap", cap: C.green, capD: C.greenD,
    cloth: C.green, clothD: C.greenD, clothL: C.leafL,
    boot: C.woodD, young: true
  }, 2, 2);

  person({
    id: "lark", bg: C.redD,
    skin: C.skin, skinD: C.skinD, skinDeep: C.skinDeep,
    hair: C.hair, hairD: C.hairD, style: "bob",
    cloth: C.red, clothD: C.redD, clothL: C.cream,
    boot: C.redD, young: true, femme: true, skirt: true, scarf: true
  }, 2, 2);

  person({
    id: "jory", bg: C.tideD,
    skin: C.skinD, skinD: C.skinDeep, skinDeep: C.skinDeep,
    hair: C.hairK, hairD: C.ink, style: "cap", cap: C.tideD, capD: C.sea,
    cloth: C.tide, clothD: C.tideD, clothL: C.tideL,
    boot: C.woodD, coat: true, net: true, stern: true
  }, 2, 2);

  person({
    id: "brant", bg: C.stoneD,
    skin: C.skin, skinD: C.skinD, skinDeep: C.skinDeep,
    hair: C.hairK, hairD: C.ink, style: "helm",
    cloth: C.stoneD, clothD: C.ink, clothL: C.stone,
    metal: C.stoneL, metalD: C.stoneD, plume: C.gold,
    boot: C.armorD, armor: true, spear: true, broad: true, stern: true
  }, 2, 2);

  person({
    id: "dorrie", bg: C.woodD,
    skin: C.skin, skinD: C.skinD, skinDeep: C.skinDeep,
    hair: C.hairWD, hairD: C.hairK, hairL: C.paper, style: "bun",
    cloth: C.wood, clothD: C.woodD, clothL: C.sand, shirt: C.cream,
    boot: C.woodD, apron: true, old: true, femme: true, skirt: true
  }, 2, 2);

  person({
    id: "maud", bg: C.goldD,
    skin: C.skin, skinD: C.skinD, skinDeep: C.skinDeep,
    hair: C.hair, hairD: C.hairD, hairL: C.gold, style: "bun",
    cloth: C.goldD, clothD: C.woodD, clothL: C.warm, shirt: C.cream,
    boot: C.woodD, apron: true, broad: true, femme: true, mug: true
  }, 2, 2);

  person({
    id: "ellis", bg: C.coatD,
    skin: C.skin, skinD: C.skinD, skinDeep: C.skinDeep,
    hair: C.hair, hairD: C.hairD, style: "short",
    cloth: C.coat, clothD: C.coatD, clothL: C.coatL,
    boot: C.coatD, young: true, coat: true
  }, 2, 2);

  person({
    id: "sile", bg: C.violetD,
    skin: C.skin, skinD: C.skinD, skinDeep: C.skinDeep,
    hair: C.hairK, hairD: C.ink, style: "brim", cap: C.violetD, capD: C.gold,
    cloth: C.violet, clothD: C.violetD, clothL: C.core,
    boot: C.woodD, coat: true, belt: true, satchel: true
  }, 2, 2);

  Art.addPortrait("pip_lark", function () {
    var s = Art.spr(32, 32);
    fill(s, 0, 0, 32, 32, C.tideD);
    shadeDisc(s, 8, 26, 8, 7, C.greenD, C.green, C.leafL);
    fill(s, 3, 6, 11, 3, C.green);
    fill(s, 2, 9, 13, 2, C.greenD);
    shadeDisc(s, 8, 16, 5, 6, C.skinDeep, C.skin, C.skin);
    fill(s, 5, 14, 3, 2, C.white);
    fill(s, 10, 14, 3, 2, C.white);
    plot(s, 6, 15, C.eye);
    plot(s, 11, 15, C.eye);
    plot(s, 5, 14, C.lite);
    plot(s, 7, 18, C.lip);
    plot(s, 9, 18, C.lip);
    shadeDisc(s, 23, 26, 8, 7, C.redD, C.red, C.cream);
    fill(s, 18, 20, 10, 2, C.scarf);
    shadeDisc(s, 23, 12, 6, 6, C.hairD, C.hair, C.path);
    shadeDisc(s, 23, 16, 5, 6, C.skinDeep, C.skin, C.skin);
    fill(s, 20, 15, 3, 2, C.white);
    fill(s, 25, 15, 3, 2, C.white);
    plot(s, 21, 16, C.eye);
    plot(s, 26, 16, C.eye);
    plot(s, 22, 19, C.lip);
    plot(s, 24, 19, C.lip);
    s.ax = 16;
    s.ay = 31;
    return s;
  });

  person({
    id: "choirling", bg: C.violetD,
    skin: C.mask, skinD: C.maskD, skinDeep: C.maskD,
    hair: C.violetD, hairD: C.void, style: "mask",
    maskC: C.mask, cloth: C.violetD, clothD: C.void, clothL: C.violet,
    boot: C.void, robe: true, core: C.core, coreD: C.violet, cast: C.core
  }, 2, 2);

  person({
    id: "choir_soldier", bg: C.violetD,
    skin: C.skinD, skinD: C.skinDeep, skinDeep: C.skinDeep,
    hair: C.void, hairD: C.ink, style: "helm", metal: C.armor, plume: C.violet,
    cloth: C.violetD, clothD: C.void, clothL: C.violet,
    boot: C.armorD, armor: true, spear: true, broad: true, stern: true, core: C.core
  }, 2, 2);

  person({
    id: "hush_raider", bg: C.hushD,
    skin: C.skin, skinD: C.skinD, skinDeep: C.skinDeep,
    hair: C.hairK, hairD: C.ink, style: "cap", cap: C.hush, capD: C.hushD,
    cloth: C.hushD, clothD: C.void, clothL: C.hush,
    boot: C.woodD, coat: true, knife: true, scarf: false
  }, 2, 2);

  person({
    id: "drowned", bg: C.tideD,
    skin: C.pale, skinD: C.paleD, skinDeep: C.sea,
    hair: C.weed, hairD: C.weedD, style: "bob",
    cloth: C.tideD, clothD: C.sea, clothL: C.tide,
    boot: C.tideD, old: true
  }, 2, 2);

  function anchor(s, ax, ay) {
    Art.outline(s);
    s.ax = ax;
    s.ay = ay;
    return s;
  }

  function mirrorIf(s, facing) {
    if (facing === "left") return Art.mirror(s);
    return s;
  }

  function wisp(body, lite, hot, dark, pose, frame) {
    var s = Art.spr(22, 24);
    var bob = pose === "hurt" ? 2 : ((frame % 2) ? -1 : 0);
    var sway = frame % 2 ? 1 : 0;
    shadeDisc(s, 11 + sway, 12 + bob, pose === "hurt" ? 5 : 6, pose === "hurt" ? 5 : 7, dark, body, lite);
    shadeDisc(s, 7, 15 + bob, 3, 3, dark, body, lite);
    shadeDisc(s, 15, 10 + bob, 3, 4, dark, lite, hot);
    fill(s, 10, 18 + bob, 2, 3, dark);
    plot(s, 9, 20 + bob, body);
    plot(s, 12, 21 + bob, lite);
    plot(s, 6, 8 + bob, lite);
    plot(s, 16, 14 + bob, hot);
    if (pose === "hurt") {
      plot(s, 8, 11 + bob, dark);
      plot(s, 9, 12 + bob, dark);
      plot(s, 13, 11 + bob, dark);
      plot(s, 14, 12 + bob, dark);
    } else {
      fill(s, 8, 11 + bob, 2, 2, C.white);
      fill(s, 13, 11 + bob, 2, 2, C.white);
      plot(s, 9, 12 + bob, C.eye);
      plot(s, 14, 12 + bob, C.eye);
      plot(s, 8, 11 + bob, C.lite);
    }
    var core = pose === "hurt" ? dark : hot;
    shadeDisc(s, 11, 14 + bob, pose === "attack" || pose === "cast" ? 3 : 2, 2, dark, core, C.white);
    if (pose === "attack") {
      fill(s, 16, 12, 5, 2, hot);
      plot(s, 20, 12, C.white);
      plot(s, 18, 11, lite);
    }
    if (pose === "cast") {
      plot(s, 11, 4, hot);
      plot(s, 9, 6, lite);
      plot(s, 13, 5, C.white);
    }
    return anchor(s, 11, 22);
  }

  function floater(id, body, lite, hot, dark) {
    Art.add(id, function (pose, facing, frame) {
      var s = wisp(body, lite, hot, dark, pose, frame);
      if (facing === "left") s = Art.mirror(s);
      return s;
    }, 2, 2);
  }

  floater("wisp", C.violet, C.core, C.lite, C.violetD);
  floater("saltwisp", C.tide, C.tideL, C.foam, C.tideD);

  function brume(pose, facing, frame) {
    var s = Art.spr(32, 30);
    var bob = pose === "hurt" ? 1 : ((frame % 2) ? -1 : 0);
    shadeDisc(s, 16, 16 + bob, 10, 8, C.void, C.hushD, C.hush);
    shadeDisc(s, 16, 18 + bob, 6, 5, C.hushD, C.hush, C.hushL);
    fill(s, 8, 8 + bob, 3, 7, C.goldD);
    fill(s, 21, 8 + bob, 3, 7, C.gold);
    plot(s, 9, 7 + bob, C.gold);
    plot(s, 22, 6 + bob, C.gold);
    plot(s, 8, 6 + bob, C.lite);
    plot(s, 23, 9 + bob, C.goldD);
    if (facing === "up") {
      fill(s, 12, 12 + bob, 8, 4, C.hushD);
    } else if (pose === "hurt") {
      fill(s, 11, 14 + bob, 3, 1, C.void);
      fill(s, 18, 14 + bob, 3, 1, C.void);
    } else {
      fill(s, 11, 14 + bob, 3, 2, C.white);
      fill(s, 18, 14 + bob, 3, 2, C.white);
      plot(s, 12, 15 + bob, C.eye);
      plot(s, 19, 15 + bob, C.eye);
      plot(s, 11, 14 + bob, C.lite);
      plot(s, 15, 17 + bob, C.hushD);
      plot(s, 16, 18 + bob, C.void);
      plot(s, 17, 17 + bob, C.hushD);
    }
    var belly = pose === "hurt" ? C.goldD : (pose === "attack" || pose === "cast" ? C.emberH : C.ember);
    shadeDisc(s, 16, 20 + bob, pose === "attack" ? 4 : 3, 3, C.vestD, belly, C.warm);
    plot(s, 15, 19 + bob, C.lite);
    fill(s, 10, 24, 4, 3, C.hushD);
    fill(s, 18, 24, 4, frame === 1 || frame === 3 ? 2 : 3, C.void);
    plot(s, 11, 26, C.goldD);
    plot(s, 20, 26, C.goldD);
    if (pose === "attack") {
      fill(s, 24, 16, 6, 3, C.gold);
      plot(s, 29, 17, C.emberH);
      plot(s, 27, 15, C.lite);
    }
    if (pose === "cast") {
      plot(s, 16, 4, C.emberH);
      plot(s, 14, 6, C.ember);
      plot(s, 18, 5, C.gold);
      plot(s, 16, 3, C.lite);
    }
    return anchor(mirrorIf(s, facing), 16, 27);
  }

  Art.add("brumekin", function (pose, facing, frame) {
    return brume(pose, facing, frame);
  }, 2, 2);

  function ashling(pose, facing, frame) {
    var s = Art.spr(22, 22);
    var bob = pose === "hurt" ? 1 : ((frame % 2) ? -1 : 0);
    shadeDisc(s, 11, 10 + bob, 6, 5, C.rock, C.ash, C.ashL);
    shadeDisc(s, 7, 12 + bob, 3, 3, C.ashD, C.rock, C.ash);
    plot(s, 8, 6 + bob, C.ashL);
    plot(s, 13, 7 + bob, C.ashD);
    if (pose === "hurt") {
      plot(s, 8, 9 + bob, C.ashD);
      plot(s, 9, 10 + bob, C.ashD);
      plot(s, 13, 9 + bob, C.ashD);
      plot(s, 14, 10 + bob, C.ashD);
    } else {
      plot(s, 8, 9 + bob, C.ember);
      plot(s, 9, 9 + bob, C.emberH);
      plot(s, 13, 9 + bob, C.emberH);
      plot(s, 14, 9 + bob, C.warm);
      plot(s, 8, 8 + bob, C.lite);
    }
    fill(s, 5, 14 + bob, 2, 3, C.ashD);
    fill(s, 15, 14 + bob, 2, 3, C.rock);
    var step = frame === 1 || frame === 3 ? 1 : 0;
    fill(s, 7, 16, 3, 3 - step, C.ashD);
    fill(s, 12, 16, 3, 3 - (step ? 0 : 1), C.rock);
    plot(s, 8, 18, C.ink);
    plot(s, 13, 18, C.ink);
    if (pose === "attack") {
      fill(s, 16, 10, 5, 2, C.ember);
      plot(s, 20, 10, C.emberH);
      plot(s, 18, 9, C.warm);
    }
    if (pose === "cast") {
      plot(s, 11, 3, C.emberH);
      plot(s, 9, 4, C.ember);
      plot(s, 13, 4, C.lite);
    }
    return anchor(mirrorIf(s, facing), 11, 20);
  }

  Art.add("ashling", function (pose, facing, frame) {
    return ashling(pose, facing, frame);
  }, 2, 2);

  Art.add("sootwing", function (pose, facing, frame) {
    var s = Art.spr(34, 20);
    var flap = 0;
    if (!(Art.calm() && pose === "walk")) flap = (pose === "attack" || frame % 2) ? -2 : 1;
    if (pose === "hurt") flap = 2;
    shadeDisc(s, 16, 11, 4, 3, C.rock, C.ashD, C.ash);
    fill(s, 12, 10, 8, 3, C.ash);
    plot(s, 22, 11, C.emberH);
    plot(s, 21, 10, C.ember);
    fill(s, 14, 12, 2, 2, C.eye);
    shaded(s, 4, 8 + flap, 10, 3, C.ashL, C.rock, C.ashD);
    shaded(s, 18, 7 + flap, 12, 3, C.ash, C.ashD, C.rock);
    plot(s, 3, 9 + flap, C.ashL);
    plot(s, 29, 8 + flap, C.ember);
    fill(s, 15, 14, 2, 3, C.ashD);
    if (pose === "cast" || pose === "attack") {
      plot(s, 24, 9, C.emberH);
      plot(s, 26, 8, C.warm);
    }
    s.ax = 16;
    s.ay = 17;
    Art.outline(s);
    if (facing === "left") s = Art.mirror(s);
    return s;
  }, 2, 2);

  function hound(pose, facing, frame) {
    var side = facing === "left" || facing === "right" || facing === "side" || pose !== "walk";
    var s = Art.spr(40, 26);
    var bob = pose === "hurt" ? 1 : ((frame % 2) ? -1 : 0);
    if (!side || facing === "down" || facing === "up") {
      shadeDisc(s, 20, 12 + bob, 8, 6, C.void, C.ashD, C.ash);
      fill(s, 12, 8 + bob, 16, 3, pose === "hurt" ? C.ashD : C.ember);
      plot(s, 14, 8 + bob, C.emberH);
      plot(s, 18, 7 + bob, C.warm);
      if (facing !== "up") {
        plot(s, 16, 12 + bob, C.eye);
        plot(s, 22, 12 + bob, C.eye);
        plot(s, 15, 12 + bob, C.lite);
        plot(s, 19, 14 + bob, pose === "hurt" ? C.ashD : C.emberH);
      }
      fill(s, 14, 18, 3, frame === 1 ? 3 : 4, C.void);
      fill(s, 22, 18, 3, frame === 3 ? 3 : 4, C.rock);
      fill(s, 18, 19, 3, 3, C.ashD);
      if (pose === "attack") fill(s, 26, 12, 6, 2, C.tooth);
    } else {
      shadeDisc(s, 16, 13 + bob, 8, 5, C.void, C.ashD, C.ash);
      fill(s, 20, 12 + bob, 10, 5, C.ash);
      fill(s, 28, 13 + bob, 6, 4, C.rock);
      fill(s, 10, 8 + bob, 14, 3, pose === "hurt" ? C.ashD : C.ember);
      plot(s, 12, 8 + bob, C.emberH);
      plot(s, 16, 7 + bob, C.warm);
      plot(s, 20, 8 + bob, C.lite);
      plot(s, 30, 14 + bob, pose === "hurt" ? C.ashD : C.emberH);
      fill(s, 31, 15 + bob, 2, 2, C.eye);
      plot(s, 31, 15 + bob, C.lite);
      fill(s, 8, 10 + bob, 4, 3, C.ember);
      plot(s, 7, 12 + bob, C.ashD);
      var a = frame === 1 || frame === 0 ? 0 : 1;
      fill(s, 12, 17, 3, 4 - a, C.void);
      fill(s, 18, 17, 3, 3 + a, C.void);
      fill(s, 24, 17, 3, 4 - a, C.rock);
      fill(s, 30, 18, 2, 3, C.rock);
      if (pose === "attack") {
        fill(s, 33, 14, 5, 2, C.tooth);
        plot(s, 37, 14, C.white);
        plot(s, 35, 13, C.emberH);
      }
      if (pose === "hurt") fill(s, 14, 14, 12, 2, C.ashD);
    }
    if (pose === "cast") {
      plot(s, 18, 4, C.emberH);
      plot(s, 16, 5, C.ember);
      plot(s, 20, 5, C.warm);
    }
    s.ax = 20;
    s.ay = 23;
    Art.outline(s);
    if (facing === "left") s = Art.mirror(s);
    return s;
  }

  Art.add("cinderhound", function (pose, facing, frame) {
    return hound(pose, facing, frame);
  }, 2, 2);

  function mawWalk(pose, facing, frame) {
    var s = Art.spr(48, 36);
    shadeDisc(s, 24, 18, 16, 10, C.void, C.ashD, C.ash);
    shadeDisc(s, 14, 14, 6, 5, C.rock, C.ashD, C.ashL);
    shadeDisc(s, 34, 13, 5, 4, C.ashD, C.ash, C.ashL);
    fill(s, 10, 8, 6, 4, C.rock);
    plot(s, 12, 7, C.ember);
    fill(s, 32, 7, 5, 4, C.ash);
    plot(s, 35, 6, C.emberH);
    var shut = pose === "hurt";
    fill(s, 12, 16, 24, shut ? 5 : 8, C.void);
    var i;
    for (i = 0; i < 6; i++) {
      fill(s, 14 + i * 3, 16, 2, 2, C.tooth);
      plot(s, 15 + i * 3, shut ? 20 : 22, C.bone);
    }
    shadeDisc(s, 24, shut ? 19 : 21, pose === "cast" ? 4 : 3, 3, C.vestD, pose === "hurt" ? C.goldD : C.emberH, C.lite);
    fill(s, 16, 26, 5, 5, C.rock);
    fill(s, 26, 27, 5, 4, C.ashD);
    plot(s, 18, 30, C.ink);
    plot(s, 28, 30, C.ink);
    if (pose === "attack") {
      fill(s, 36, 16, 8, 4, C.ember);
      plot(s, 43, 17, C.emberH);
      plot(s, 40, 15, C.warm);
    }
    if ((frame % 2) && pose === "walk") plot(s, 24, 20, C.warm);
    return anchor(mirrorIf(s, facing), 24, 33);
  }

  function mawBattle(pose, facing, frame) {
    var s = Art.spr(52, 70);
    var shut = pose === "hurt";
    shadeDisc(s, 18, 40, 12, 14, C.void, C.ashD, C.ash);
    shadeDisc(s, 16, 28, 7, 8, C.rock, C.ashD, C.ashL);
    fill(s, 8, 16, 5, 16, C.rock);
    fill(s, 12, 10, 4, 12, C.ash);
    plot(s, 10, 12, C.ember);
    plot(s, 13, 8, C.emberH);
    plot(s, 9, 18, C.ashL);
    shadeDisc(s, 32, 32, 14, 16, pose === "hurt" ? C.rock : C.ashD, C.ash, C.ashL);
    plot(s, 40, 22, pose === "hurt" ? C.ashD : C.emberH);
    fill(s, 42, 24, 2, 2, C.void);
    plot(s, 42, 24, C.lite);
    fill(s, 24, shut ? 30 : 24, 20, shut ? 8 : 18, C.void);
    var i;
    for (i = 0; i < 5; i++) {
      fill(s, 26 + i * 3, shut ? 30 : 24, 2, 3, i % 2 ? C.bone : C.tooth);
      plot(s, 27 + i * 3, shut ? 37 : 40, C.bone);
    }
    shadeDisc(s, 34, shut ? 34 : 36, pose === "cast" ? 5 : 4, 4, C.vestD, pose === "hurt" ? C.goldD : C.emberH, C.white);
    if (frame % 2 && pose !== "hurt") plot(s, 34, shut ? 34 : 35, C.warm);
    shaded(s, 10, 52, 8, 12, C.ashL, C.rock, C.void);
    shaded(s, 20, 56, 8, 8, C.ash, C.ashD, C.rock);
    shaded(s, 30, 54, 8, 10, C.ashL, C.rock, C.ashD);
    plot(s, 14, 62, C.ink);
    plot(s, 34, 62, C.ink);
    if (pose === "attack") {
      fill(s, 42, 30, 8, 6, C.ember);
      plot(s, 48, 32, C.emberH);
      plot(s, 46, 29, C.white);
      plot(s, 44, 34, C.warm);
    }
    if (pose === "cast") {
      plot(s, 40, 12, C.emberH);
      plot(s, 43, 14, C.ember);
      plot(s, 38, 16, C.gold);
      plot(s, 42, 10, C.lite);
    }
    if (pose === "victory") plot(s, 36, 18, C.emberH);
    return anchor(mirrorIf(s, facing), 26, 66);
  }

  Art.add("cinder_maw", function (pose, facing, frame) {
    if (pose === "walk") return mawWalk(pose, facing, frame);
    return mawBattle(pose, facing);
  }, 2, 1);

  function gull(pose, facing, frame) {
    var s = Art.spr(34, 22);
    var flap = 0;
    if (!(Art.calm() && pose === "walk")) flap = (frame % 2 || pose === "attack") ? -3 : 2;
    if (pose === "hurt") flap = 3;
    shadeDisc(s, 16, 12, 5, 3, C.stoneD, C.stoneL, C.cloud);
    fill(s, 20, 11, 7, 3, C.gold);
    plot(s, 26, 12, C.goldD);
    plot(s, 25, 11, C.lite);
    fill(s, 14, 11, 2, 2, C.white);
    plot(s, 15, 12, C.eye);
    shaded(s, 2, 9 + flap, 12, 3, C.cloud, C.stone, C.stoneD);
    shaded(s, 16, 8 + flap, 12, 3, C.white, C.cloud, C.stone);
    plot(s, 1, 10 + flap, C.stoneL);
    plot(s, 27, 9 + flap, C.lite);
    fill(s, 15, 15, 2, 3, C.goldD);
    fill(s, 18, 16, 2, 2, C.gold);
    if (pose === "attack") fill(s, 26, 12, 5, 2, C.gold);
    if (pose === "cast") plot(s, 22, 6, C.lite);
    return anchor(mirrorIf(s, facing), 16, 19);
  }

  Art.add("stormgull", function (pose, facing, frame) {
    return gull(pose, facing, frame);
  }, 2, 2);

  function wyrmWalk(pose, facing, frame) {
    var s = Art.spr(64, 36);
    var phase = (frame % 2) ? 1 : 0;
    if (pose === "hurt") phase = 0;
    var i, x, y, col, lite;
    for (i = 0; i < 7; i++) {
      x = 8 + i * 7;
      y = 18 + (((i + phase) % 2) ? -3 : 3);
      col = i % 2 ? C.tide : C.tideD;
      lite = i % 2 ? C.tideL : C.foam;
      shadeDisc(s, x, y, 5, 4, C.sea, col, lite);
      plot(s, x - 1, y - 3, C.foam);
    }
    shadeDisc(s, 54, 14, 7, 6, C.tideD, C.sea, C.tideL);
    fill(s, 56, 8, 3, 5, C.bone);
    plot(s, 57, 8, C.white);
    plot(s, 52, 13, pose === "hurt" ? C.tideD : C.eye);
    plot(s, 51, 13, C.lite);
    plot(s, 58, 16, C.tooth);
    plot(s, 60, 17, C.tooth);
    shadeDisc(s, 24, 18, pose === "cast" ? 4 : 3, 3, C.tideD, pose === "hurt" ? C.goldD : C.foam, C.white);
    if (pose === "attack") {
      fill(s, 58, 16, 5, 2, C.tooth);
      plot(s, 62, 16, C.white);
    }
    if (pose === "cast") plot(s, 24, 10, C.lite);
    return anchor(mirrorIf(s, facing), 32, 30);
  }

  function wyrmBattle(pose, facing, frame) {
    var s = Art.spr(44, 68);
    var phase = (frame % 2) ? 1 : 0;
    if (pose === "hurt") phase = 0;
    var coils = [
      [14, 58, 7, C.tideD],
      [18, 48, 7, C.tide],
      [14, 38, 6, C.tideD],
      [22, 30, 7, C.tide],
      [28, 22, 7, C.sea],
      [32, 14, 8, C.tideL]
    ];
    var i, c, y;
    for (i = 0; i < coils.length; i++) {
      c = coils[i];
      y = c[1] + (pose === "hurt" ? 2 : ((i + phase) % 2 ? -1 : 1));
      shadeDisc(s, c[0], y, c[2], c[2] - 1, C.sea, c[3], C.foam);
      plot(s, c[0] - 1, y - c[2] + 2, C.white);
    }
    shadeDisc(s, 32, 12, 8, 7, C.tideD, C.sea, C.tideL);
    fill(s, 34, 4, 3, 7, C.bone);
    plot(s, 35, 4, C.white);
    plot(s, 28, 11, pose === "hurt" ? C.tideD : C.eye);
    plot(s, 27, 11, C.lite);
    plot(s, 36, 15, C.tooth);
    plot(s, 38, 16, C.tooth);
    shadeDisc(s, 16, 40, pose === "cast" ? 4 : 3, 3, C.tideD, pose === "hurt" ? C.goldD : C.foam, C.white);
    if (pose === "attack") fill(s, 36, 15, 6, 2, C.tooth);
    if (pose === "cast") {
      plot(s, 24, 18, C.lite);
      plot(s, 22, 20, C.foam);
      plot(s, 26, 16, C.white);
    }
    return anchor(mirrorIf(s, facing), 22, 64);
  }

  Art.add("tidewyrm", function (pose, facing, frame) {
    if (pose === "walk") return wyrmWalk(pose, facing, frame);
    return wyrmBattle(pose, facing, frame);
  }, 2, 1);

  function sentinel(pose, facing, frame) {
    var s = Art.spr(26, 42);
    var bob = (pose === "walk" && frame % 2) ? -1 : 0;
    if (pose === "hurt") bob = 1;
    shaded(s, 8, 16 + bob, 10, 16, C.stoneL, C.stone, C.stoneD);
    fill(s, 10, 18 + bob, 2, 12, C.stoneL);
    fill(s, 15, 20 + bob, 2, 8, C.stoneD);
    shaded(s, 5, 18 + bob, 4, 8, C.armorL, C.armor, C.armorD);
    shaded(s, 17, 18 + bob, 4, 8, C.stoneL, C.stone, C.stoneD);
    shadeDisc(s, 13, 10 + bob, 6, 6, C.stoneD, C.stoneL, C.cloud);
    fill(s, 9, 8 + bob, 8, 4, pose === "hurt" ? C.stoneD : C.hush);
    plot(s, 11, 9 + bob, pose === "hurt" ? C.stoneD : C.lite);
    plot(s, 14, 9 + bob, pose === "hurt" ? C.stoneD : C.shardH);
    plot(s, 12, 8 + bob, C.white);
    fill(s, 10, 32, 3, 6, C.stoneD);
    fill(s, 15, 32, 3, frame % 2 && pose === "walk" ? 5 : 6, C.stone);
    plot(s, 11, 37, C.ink);
    plot(s, 16, 37, C.gold);
    if (pose === "attack") {
      fill(s, 20, 22, 5, 2, C.gold);
      plot(s, 24, 22, C.lite);
    }
    if (pose === "cast") {
      plot(s, 13, 2, C.shardH);
      plot(s, 11, 3, C.shard);
      plot(s, 15, 3, C.lite);
    }
    return anchor(mirrorIf(s, facing), 13, 39);
  }

  Art.add("sentinel", function (pose, facing, frame) {
    return sentinel(pose, facing, frame);
  }, 2, 2);

  function badge(bg, draw) {
    var s = Art.spr(32, 32);
    fill(s, 0, 0, 32, 32, bg);
    draw(s);
    Art.outline(s);
    s.ax = 16;
    s.ay = 31;
    return s;
  }

  function iconPortrait(id, bg, draw) {
    Art.addPortrait(id, function () { return badge(bg, draw); });
  }

  iconPortrait("wisp", C.violetD, function (s) {
    shadeDisc(s, 16, 18, 9, 8, C.violetD, C.violet, C.core);
    shadeDisc(s, 16, 18, 4, 4, C.violet, C.core, C.white);
    fill(s, 11, 15, 2, 2, C.white);
    fill(s, 18, 15, 2, 2, C.white);
    plot(s, 12, 16, C.eye);
    plot(s, 19, 16, C.eye);
    plot(s, 11, 15, C.lite);
  });
  iconPortrait("saltwisp", C.sea, function (s) {
    shadeDisc(s, 16, 18, 9, 8, C.tideD, C.tide, C.tideL);
    shadeDisc(s, 16, 18, 4, 4, C.tide, C.foam, C.white);
    fill(s, 11, 15, 2, 2, C.white);
    fill(s, 18, 15, 2, 2, C.white);
    plot(s, 12, 16, C.eye);
  });
  iconPortrait("brumekin", C.hushD, function (s) {
    shadeDisc(s, 16, 18, 10, 8, C.void, C.hush, C.hushL);
    fill(s, 7, 8, 3, 8, C.goldD);
    fill(s, 22, 8, 3, 8, C.gold);
    plot(s, 8, 7, C.lite);
    fill(s, 11, 15, 3, 2, C.white);
    fill(s, 18, 15, 3, 2, C.white);
    plot(s, 12, 16, C.eye);
    plot(s, 19, 16, C.eye);
    shadeDisc(s, 16, 21, 3, 3, C.vestD, C.ember, C.warm);
  });
  iconPortrait("ashling", C.ashD, function (s) {
    shadeDisc(s, 16, 16, 8, 7, C.rock, C.ash, C.ashL);
    plot(s, 12, 14, C.ember);
    plot(s, 13, 14, C.emberH);
    plot(s, 19, 14, C.emberH);
    plot(s, 12, 13, C.lite);
    fill(s, 10, 24, 3, 4, C.ashD);
    fill(s, 18, 24, 3, 4, C.rock);
  });
  iconPortrait("sootwing", C.rock, function (s) {
    shadeDisc(s, 16, 18, 5, 4, C.ashD, C.ash, C.ashL);
    shaded(s, 3, 14, 10, 3, C.ashL, C.rock, C.ashD);
    shaded(s, 18, 12, 11, 3, C.ash, C.ashD, C.rock);
    plot(s, 22, 16, C.emberH);
  });
  iconPortrait("cinderhound", C.rock, function (s) {
    shadeDisc(s, 14, 18, 8, 6, C.void, C.ashD, C.ash);
    fill(s, 18, 16, 8, 5, C.ash);
    fill(s, 8, 12, 12, 4, C.ember);
    plot(s, 10, 12, C.emberH);
    plot(s, 24, 17, C.eye);
    fill(s, 24, 20, 4, 2, C.tooth);
  });
  iconPortrait("cinder_maw", C.rock, function (s) {
    shadeDisc(s, 16, 18, 11, 10, C.void, C.ashD, C.ash);
    fill(s, 8, 16, 16, 8, C.void);
    fill(s, 10, 14, 2, 4, C.tooth);
    fill(s, 14, 14, 2, 4, C.tooth);
    fill(s, 18, 14, 2, 4, C.bone);
    shadeDisc(s, 16, 20, 3, 3, C.vestD, C.emberH, C.lite);
  });
  iconPortrait("stormgull", C.stoneD, function (s) {
    shadeDisc(s, 16, 18, 5, 4, C.stoneD, C.stoneL, C.cloud);
    fill(s, 20, 16, 6, 3, C.gold);
    shaded(s, 3, 14, 12, 3, C.cloud, C.stone, C.stoneD);
    shaded(s, 16, 12, 12, 3, C.white, C.cloud, C.stone);
    plot(s, 14, 17, C.eye);
  });
  iconPortrait("tidewyrm", C.sea, function (s) {
    var i;
    for (i = 0; i < 5; i++) shadeDisc(s, 6 + i * 5, 18 + (i % 2 ? -3 : 3), 4, 3, C.sea, i % 2 ? C.tide : C.tideD, C.foam);
    shadeDisc(s, 24, 14, 6, 5, C.tideD, C.tideL, C.white);
    plot(s, 26, 13, C.eye);
    plot(s, 28, 16, C.tooth);
  });
  iconPortrait("sentinel", C.stoneD, function (s) {
    shaded(s, 10, 14, 12, 12, C.stoneL, C.stone, C.stoneD);
    shadeDisc(s, 16, 10, 6, 5, C.stoneD, C.stoneL, C.cloud);
    fill(s, 12, 8, 8, 3, C.hush);
    plot(s, 14, 9, C.shardH);
    plot(s, 18, 9, C.lite);
  });

  Art.addPortrait("maw", function () {
    return badge(C.rock, function (s) {
      shadeDisc(s, 16, 18, 10, 9, C.void, C.ashD, C.ash);
      fill(s, 8, 16, 16, 8, C.void);
      fill(s, 10, 14, 2, 3, C.tooth);
      fill(s, 14, 14, 2, 3, C.tooth);
      fill(s, 18, 14, 2, 3, C.tooth);
      fill(s, 20, 14, 2, 3, C.bone);
      shadeDisc(s, 16, 20, 3, 3, C.vestD, C.emberH, C.lite);
    });
  });

  Art.addPortrait("unknown", function () {
    return badge(C.winD, function (s) {
      shadeDisc(s, 16, 16, 6, 8, C.winM, C.shard, C.shardH);
      plot(s, 16, 16, C.lite);
      plot(s, 16, 8, C.white);
    });
  });

  iconPortrait("stones", C.stoneD, function (s) {
    shaded(s, 6, 14, 5, 12, C.stoneL, C.stone, C.stoneD);
    shaded(s, 13, 8, 6, 18, C.cloud, C.stoneL, C.stone);
    shaded(s, 21, 12, 5, 14, C.stoneL, C.stone, C.stoneD);
    fill(s, 15, 8, 2, 6, C.paper);
  });
  iconPortrait("lamp", C.winD, function (s) {
    fill(s, 14, 16, 4, 12, C.wood);
    fill(s, 15, 16, 1, 10, C.woodL);
    fill(s, 10, 26, 12, 3, C.stone);
    shadeDisc(s, 16, 12, 4, 4, C.goldD, C.gold, C.lite);
    plot(s, 16, 12, C.white);
  });
  iconPortrait("ship", C.tideD, function (s) {
    shaded(s, 6, 18, 20, 6, C.woodL, C.wood, C.woodD);
    fill(s, 8, 22, 16, 3, C.woodD);
    fill(s, 15, 8, 2, 12, C.woodD);
    plot(s, 16, 8, C.woodL);
    plot(s, 17, 10, C.shardH);
    plot(s, 20, 14, C.paper);
    plot(s, 22, 16, C.shard);
  });
  iconPortrait("scar", C.cliffX, function (s) {
    shaded(s, 4, 18, 24, 8, C.cliffL, C.cliff, C.cliffD);
    plot(s, 8, 16, C.violet);
    plot(s, 12, 13, C.core);
    plot(s, 16, 17, C.violetD);
    plot(s, 22, 12, C.hushL);
    plot(s, 14, 14, C.lite);
  });
  iconPortrait("core", C.rock, function (s) {
    shadeDisc(s, 16, 16, 9, 9, C.vestD, C.ember, C.emberH);
    shadeDisc(s, 16, 16, 4, 4, C.ember, C.emberH, C.white);
  });
  iconPortrait("sign", C.woodD, function (s) {
    shaded(s, 8, 6, 16, 12, C.woodL, C.wood, C.woodD);
    fill(s, 15, 18, 2, 10, C.wood);
    fill(s, 10, 9, 10, 1, C.woodD);
    fill(s, 10, 12, 8, 1, C.woodD);
  });
  iconPortrait("crate", C.wood, function (s) {
    shaded(s, 6, 10, 20, 16, C.woodL, C.wood, C.woodD);
    fill(s, 14, 8, 4, 18, C.woodD);
    plot(s, 8, 12, C.gold);
  });
  iconPortrait("ash", C.ashD, function (s) {
    shadeDisc(s, 10, 18, 4, 3, C.rock, C.ash, C.ashL);
    shadeDisc(s, 16, 14, 3, 3, C.vestD, C.ember, C.emberH);
    shadeDisc(s, 22, 20, 4, 3, C.ashD, C.rock, C.ash);
  });
  iconPortrait("blossom", C.hushD, function (s) {
    plot(s, 16, 10, C.bloom);
    plot(s, 13, 13, C.bloom);
    plot(s, 19, 13, C.bloom);
    plot(s, 12, 17, C.bloom);
    plot(s, 20, 17, C.bloom);
    plot(s, 16, 15, C.gold);
    plot(s, 16, 14, C.lite);
    fill(s, 16, 20, 1, 6, C.leaf);
  });
  iconPortrait("bridge", C.woodD, function (s) {
    shaded(s, 6, 8, 3, 16, C.woodL, C.wood, C.woodD);
    shaded(s, 23, 8, 3, 16, C.woodL, C.wood, C.woodD);
    fill(s, 8, 18, 16, 2, C.woodL);
    fill(s, 8, 22, 16, 2, C.woodL);
  });
  iconPortrait("vault", C.rock, function (s) {
    shaded(s, 8, 14, 16, 12, C.stoneL, C.stoneD, C.ink);
    shadeDisc(s, 16, 12, 6, 5, C.stoneD, C.stone, C.ashL);
    plot(s, 16, 18, C.emberH);
    plot(s, 16, 17, C.lite);
  });
  iconPortrait("bell", C.stoneD, function (s) {
    shaded(s, 12, 8, 8, 10, C.gold, C.gold, C.goldD);
    fill(s, 10, 16, 12, 3, C.goldD);
    plot(s, 16, 22, C.gold);
    fill(s, 16, 4, 1, 4, C.wood);
    plot(s, 14, 10, C.lite);
  });
  iconPortrait("hush", C.hushD, function (s) {
    shadeDisc(s, 10, 16, 5, 5, C.hushD, C.hush, C.hushL);
    shadeDisc(s, 18, 14, 6, 5, C.hush, C.hushL, C.cloud);
    shadeDisc(s, 16, 20, 4, 4, C.violetD, C.hushP, C.hushL);
    plot(s, 16, 8, C.lite);
    plot(s, 20, 6, C.shard);
  });
})();
