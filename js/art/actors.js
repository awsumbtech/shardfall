"use strict";

// Battle poses, portraits, and everyone outside the Act 1 field cast.
// Map walk and idle for that cast live in js/art/characters.js, which
// replaces pose "walk" and pose "stand" after this file registers them.
// Party battle poses (Wayfarer, Kestrel, Tamsin) are replaced there too.
// Feet sit on the baseline (ay). Other battle poses reuse the side view.
// The Cinder Maw and the Tidewyrm are taller in battle. Field scale is 1.
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

  // Enemy and boss battle sprites. Party and NPC painters above stay as they are.
  // Regular foes share a 38px canvas so they scale together; bosses are taller.
  // Feet (or a floater's ground anchor) sit on the last row. Outline is exterior only.

  function eGrid(w, h) {
    this.w = w;
    this.h = h;
    this.g = [];
    var y, x;
    for (y = 0; y < h; y++) {
      this.g[y] = [];
      for (x = 0; x < w; x++) this.g[y][x] = ".";
    }
  }
  eGrid.prototype.plot = function (x, y, ch) {
    x = x | 0;
    y = y | 0;
    if (!ch || x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.g[y][x] = ch;
  };
  eGrid.prototype.fill = function (x, y, w, h, ch) {
    var yy, xx;
    for (yy = 0; yy < h; yy++) {
      for (xx = 0; xx < w; xx++) this.plot(x + xx, y + yy, ch);
    }
  };
  eGrid.prototype.disc = function (cx, cy, rx, ry, ch) {
    var y, x, nx, ny;
    rx = Math.max(1, rx);
    ry = Math.max(1, ry);
    for (y = -ry; y <= ry; y++) {
      for (x = -rx; x <= rx; x++) {
        nx = x / rx;
        ny = y / ry;
        if (nx * nx + ny * ny <= 1) this.plot(cx + x, cy + y, ch);
      }
    }
  };
  eGrid.prototype.tri = function (x0, y0, x1, y1, x2, y2, ch) {
    var minX = Math.min(x0, x1, x2);
    var maxX = Math.max(x0, x1, x2);
    var minY = Math.min(y0, y1, y2);
    var maxY = Math.max(y0, y1, y2);
    var y, x, d, a, b, c;
    for (y = minY; y <= maxY; y++) {
      for (x = minX; x <= maxX; x++) {
        d = (y1 - y2) * (x0 - x2) + (x2 - x1) * (y0 - y2);
        if (!d) continue;
        a = ((y1 - y2) * (x - x2) + (x2 - x1) * (y - y2)) / d;
        b = ((y2 - y0) * (x - x2) + (x0 - x2) * (y - y2)) / d;
        c = 1 - a - b;
        if (a >= -0.001 && b >= -0.001 && c >= -0.001) this.plot(x, y, ch);
      }
    }
  };
  eGrid.prototype.line = function (x0, y0, x1, y1, ch) {
    var n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    var i, t;
    if (!n) {
      this.plot(x0, y0, ch);
      return;
    }
    for (i = 0; i <= n; i++) {
      t = i / n;
      this.plot(Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t), ch);
    }
  };
  eGrid.prototype.rows = function () {
    var y, out = [];
    for (y = 0; y < this.h; y++) out.push(this.g[y].join(""));
    return out;
  };

  function ePair(w, h) {
    this.w = w;
    this.h = h;
    this.m = new eGrid(w, h);
    this.d = new eGrid(w, h);
  }

  var EYE = {
    e: C.eye, w: C.white, l: C.lite, y: C.warm, o: C.emberH, r: C.ember,
    g: C.gold, q: C.goldD, n: C.void, b: C.bone, u: C.foam, c: C.core,
    s: C.shardH, t: C.tooth, m: C.tideL, k: C.violetD, p: C.pale, f: C.shard
  };

  function eEye(d, x, y, w, h, look) {
    d.fill(x, y, w, h, "w");
    var px = x + Math.max(0, Math.min(w - 1, look));
    var py = y + (h > 2 ? 1 : 0);
    d.plot(px, py, "e");
    if (h > 2) d.plot(px, Math.min(y + h - 1, py + 1), "e");
    d.plot(x, y, "l");
    if (w > 2) d.plot(x + 1, y, "l");
  }
  function eShut(d, x, y, w) {
    var i;
    for (i = 0; i < w; i++) d.plot(x + i, y, "e");
  }
  function eBrows(d, x, y, w, angry) {
    d.line(x, y + (angry ? 1 : 0), x + w - 1, y, "n");
  }

  function eShade(mat, x, y, left, right, top, bot) {
    var span = right - left;
    var tall = bot - top;
    var u = span <= 0 ? 0.5 : (x - left) / span;
    var v = tall <= 0 ? 0.5 : (y - top) / tall;
    var edgeR = x === right;
    var edgeL = x === left;
    var edgeT = y === top;
    var edgeB = y === bot;
    if (span <= 1) return v < 0.35 ? (mat.s || mat.l) : (v > 0.7 ? mat.d : mat.m);
    if (edgeB || edgeR) return mat.d;
    if (edgeT && u < 0.75) return mat.l;
    if (edgeL && v < 0.42) return mat.l;
    if (u < 0.3 && v < 0.38 && span > 3) return mat.s || mat.l;
    if (u < 0.46 && v < 0.6) return mat.l;
    if (u > 0.7 || v > 0.74) return mat.d;
    return mat.m;
  }

  function ePaint(s, mask, det, mats, ox, oy) {
    var h = mask.length;
    var w = mask[0].length;
    var y, x, ch, left, right, top, bot, mat;
    for (y = 0; y < h; y++) {
      for (x = 0; x < w; x++) {
        ch = mask[y].charAt(x);
        if (ch === "." || !mats[ch]) continue;
        left = x;
        while (left > 0 && mask[y].charAt(left - 1) === ch) left--;
        right = x;
        while (right + 1 < w && mask[y].charAt(right + 1) === ch) right++;
        top = y;
        while (top > 0 && mask[top - 1].charAt(x) === ch) top--;
        bot = y;
        while (bot + 1 < h && mask[bot + 1].charAt(x) === ch) bot++;
        mat = mats[ch];
        plot(s, x + ox, y + oy, eShade(mat, x, y, left, right, top, bot));
      }
    }
    if (!det) return;
    for (y = 0; y < det.length; y++) {
      for (x = 0; x < det[y].length; x++) {
        ch = det[y].charAt(x);
        if (ch === "." || !EYE[ch]) continue;
        plot(s, x + ox, y + oy, EYE[ch]);
      }
    }
  }

  function eFlash(s) {
    var i, c;
    for (i = 0; i < s.d.length; i++) {
      c = s.d[i];
      if (!c || c === C.eye) continue;
      s.d[i] = C.lite;
    }
  }
  function eDissolve(s) {
    var x, y, i;
    for (y = 0; y < s.h; y++) {
      for (x = 0; x < s.w; x++) {
        i = y * s.w + x;
        if (!s.d[i]) continue;
        if (((x * 3 + y * 5) % 5) === 0) s.d[i] = 0;
        else if (((x + y * 2) % 4) === 0) s.d[i] = C.void;
      }
    }
  }
function eFinish(s, ax, ay) {
  Art.outline(s, C.ink);
  s.ax = ax;
  s.ay = ay == null ? s.h - 1 : ay;
  return s;
}
function eBake(part, pose, frame, ax) {
  var ox = 0;
  var oy = 0;
  var f = frame % 2;
  if (pose === "idle" && f && part.bob !== false) oy = -2;
  if (pose === "attack") ox = f ? 3 : 1;
  if (pose === "hurt") {
    ox = -1;
    oy = 1;
  }
  if (pose === "cast") oy = f ? -2 : -1;
  if (pose === "victory") oy = f ? -3 : -2;
  if (pose === "ko") oy = 2;
  // Extra pixels keep the lunge, bob, and flinch inside the canvas, plus one
  // row for the exterior outline. The foot anchor does not move with the pose,
  // so every frame still stands on the same ground line.
  var padL = ox < 0 ? -ox + 1 : 0;
  var padR = ox > 0 ? ox + 1 : 0;
  var padT = oy < 0 ? -oy + 1 : 0;
  var padB = oy > 0 ? oy + 1 : 0;
  var s = Art.spr(part.w + padL + padR, part.h + padT + padB);
  ePaint(s, part.mask, part.det, part.mats, ox + padL, oy + padT);
  if (pose === "ko") eDissolve(s);
  if (pose === "hurt" && f) eFlash(s);
  return eFinish(s, (ax == null ? (part.w >> 1) : ax) + padL, (part.h - 1) + padT);
}

  function ePortrait(id, bg, focus) {
    Art.addPortrait(id, function () {
      var src = Art._makers[id]("idle", "right", 0);
      var minX = src.w;
      var minY = src.h;
      var maxX = 0;
      var maxY = 0;
      var x, y, c, bw, bh, win, cx, cy, x0, y0, s, ox, oy;
      for (y = 0; y < src.h; y++) {
        for (x = 0; x < src.w; x++) {
          if (!src.d[y * src.w + x]) continue;
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
      bw = Math.max(1, maxX - minX + 1);
      bh = Math.max(1, maxY - minY + 1);
      win = 26;
      cx = focus && focus.x != null ? focus.x : (minX + maxX) / 2;
      cy = focus && focus.y != null ? focus.y : minY + bh * 0.4;
      x0 = Math.round(cx - win / 2);
      y0 = Math.round(cy - win / 2);
      if (x0 < minX) x0 = minX;
      if (y0 < minY) y0 = minY;
      if (x0 + win > maxX) x0 = Math.max(minX, maxX - win + 1);
      if (y0 + win > maxY) y0 = Math.max(minY, maxY - win + 1);
      s = Art.spr(32, 32);
      fill(s, 0, 0, 32, 32, bg);
      ox = 3;
      oy = 3;
      for (y = 0; y < win; y++) {
        for (x = 0; x < win; x++) {
          if (y0 + y >= src.h || x0 + x >= src.w || y0 + y < 0 || x0 + x < 0) continue;
          c = src.d[(y0 + y) * src.w + (x0 + x)];
          if (c) plot(s, ox + x, oy + y, c);
        }
      }
      s.ax = 16;
      s.ay = 31;
      return s;
    });
  }

  function eBind(id, build, ax, scale) {
    Art.add(id, function (pose, facing, frame) {
      frame = ((frame % 4) + 4) % 4;
      var battle = pose !== "walk" && pose !== "stand";
      var view = "side";
      var usePose = battle ? pose : "idle";
      if (!battle) {
        if (facing === "up") view = "back";
        else if (facing === "down") view = "front";
        else view = "side";
      }
      var part = build(view, frame % 2, usePose);
      var s = eBake(part, usePose, frame % 2, part.ax != null ? part.ax : ax);
      if (!battle && facing === "left") return Art.mirror(s);
      if (battle && facing === "left") return Art.mirror(s);
      return s;
    }, scale || 2, 1);
  }

  var MAT = {
    violet: { d: C.violetD, m: C.violet, l: C.core, s: C.white },
    core: { d: C.violet, m: C.core, l: C.white, s: C.lite },
    tide: { d: C.tideD, m: C.tide, l: C.tideL, s: C.foam },
    foam: { d: C.tide, m: C.foam, l: C.white, s: C.lite },
    gold: { d: C.goldD, m: C.gold, l: C.warm, s: C.lite },
    hush: { d: C.void, m: C.hushD, l: C.hush, s: C.hushL },
    ember: { d: C.vestD, m: C.ember, l: C.emberH, s: C.warm },
    ash: { d: C.rock, m: C.ashD, l: C.ash, s: C.ashL },
    rock: { d: C.void, m: C.rock, l: C.ashD, s: C.ash },
    mask: { d: C.maskD, m: C.mask, l: C.cloud, s: C.white },
    robe: { d: C.voidD, m: C.void, l: C.violetD, s: C.violet },
    armor: { d: C.armorD, m: C.armor, l: C.armorL, s: C.cloud },
    plume: { d: C.violetD, m: C.violet, l: C.core, s: C.white },
    skin: { d: C.skinDeep, m: C.skinD, l: C.skin, s: C.lite },
    pale: { d: C.sea, m: C.paleD, l: C.pale, s: C.cloud },
    weed: { d: C.weedD, m: C.weed, l: C.green, s: C.leafL },
    cloth: { d: C.hushD, m: C.hush, l: C.hushL, s: C.cloud },
    gull: { d: C.stoneD, m: C.stone, l: C.stoneL, s: C.cloud },
    wing: { d: C.stone, m: C.cloud, l: C.white, s: C.lite },
    bone: { d: C.ash, m: C.bone, l: C.tooth, s: C.white },
    sea: { d: C.sea, m: C.tideD, l: C.tide, s: C.tideL },
    metal: { d: C.metalD, m: C.metal, l: C.cloud, s: C.white },
    voidm: { d: C.voidD, m: C.void, l: C.void, s: C.violetD },
    stone: { d: C.stoneD, m: C.stone, l: C.stoneL, s: C.cloud }
  };

  function eSeat(p) {
    var y, x, low = -1, ny;
    var nm, nd;
    for (y = p.h - 1; y >= 0; y--) {
      for (x = 0; x < p.w; x++) {
        if (p.m.g[y][x] !== ".") {
          low = y;
          break;
        }
      }
      if (low >= 0) break;
    }
    if (low < 0) return;
    var dy = (p.h - 2) - low;
    if (dy === 0) return;
    nm = new eGrid(p.w, p.h);
    nd = new eGrid(p.w, p.h);
    for (y = 0; y < p.h; y++) {
      ny = y + dy;
      if (ny < 0 || ny >= p.h) continue;
      for (x = 0; x < p.w; x++) {
        nm.g[ny][x] = p.m.g[y][x];
        nd.g[ny][x] = p.d.g[y][x];
      }
    }
    p.m = nm;
    p.d = nd;
  }

  function eOut(p, mats, ax, bob, seat) {
    if (seat) eSeat(p);
    return { w: p.w, h: p.h, mask: p.m.rows(), det: p.d.rows(), mats: mats, ax: ax, bob: bob };
  }

  function buildWisp(view, frame, pose) {
    var p = new ePair(34, 38);
    var m = p.m;
    var lean = frame ? 1 : 0;
    var rows = [
      [16, 2], [15, 4], [14, 6], [13, 8], [12, 10], [11, 12],
      [10, 14], [9, 15], [9, 14], [10, 13], [12, 10], [14, 7], [15, 4]
    ];
    var i, sp;
    for (i = 0; i < rows.length; i++) {
      sp = rows[i];
      m.fill(sp[0] + (i < 3 ? lean : 0), 4 + i, sp[1], 1, "v");
    }
    m.fill(7, 12, 3, 2, "v");
    m.fill(24, 10, 3, 2, "v");
    m.fill(25, 12, 2, 2, "v");
    m.fill(13, 17, 3, 2, "v");
    m.fill(18, 17, 3, 2, "v");
    m.fill(11, 19, 3, 2, "v");
    m.fill(20, 19, 3, 3, "v");
    m.fill(9, 21, 2, 2, "v");
    m.fill(22, 22, 2, 2, "v");
    m.fill(8, 23, 2, 1, "v");
    m.disc(16, 13, 3, 3, "c");
    m.plot(16, 13, "c");
    if (pose === "hurt") eShut(p.d, 12, 10, 3), eShut(p.d, 19, 10, 3);
    else eEye(p.d, 11, 9, 4, 3, 2), eEye(p.d, 18, 9, 4, 3, 2);
    p.d.plot(16, 13, "y");
    p.d.plot(15, 12, "l");
    if (pose === "attack") {
      p.d.fill(27, 12, 2, 2, "y");
      p.d.plot(29, 12, "w");
      p.d.plot(30, 11, "o");
      p.d.plot(30, 13, "c");
    }
    if (pose === "cast") {
      p.d.plot(16, 2, "w");
      p.d.plot(14, 3, "c");
      p.d.plot(18, 3, "y");
    }
    return eOut(p, { v: MAT.violet, c: MAT.core }, 16, true);
  }

  function buildSalt(view, frame, pose) {
    var p = new ePair(40, 38);
    var m = p.m;
    var bob = frame ? 0 : 1;
    m.disc(20, 12 + bob, 10, 7, "t");
    m.fill(10, 14 + bob, 20, 4, "t");
    m.tri(8, 12, 6, 6, 12, 12, "g");
    m.tri(20, 8, 18, 3, 23, 9, "g");
    m.tri(30, 11, 33, 5, 28, 12, "g");
    m.fill(12, 18, 4, 2, "f");
    m.fill(18, 19, 5, 2, "f");
    m.fill(25, 18, 4, 2, "f");
    m.fill(14, 20, 2, 6, "t");
    m.fill(14, 26, 2, 2, "t");
    m.fill(22, 20, 2, 8, "t");
    m.fill(27, 20, 2, 5, "t");
    m.disc(20, 15, 2, 3, "g");
    if (pose === "hurt") eShut(p.d, 14, 12, 3), eShut(p.d, 22, 12, 3);
    else eEye(p.d, 14, 11, 4, 2, 2), eEye(p.d, 22, 11, 4, 2, 2);
    p.d.plot(20, 14, "l");
    p.d.plot(20, 16, "y");
    if (pose === "attack") {
      m.fill(32, 12, 6, 4, "f");
      p.d.fill(33, 12, 4, 2, "w");
      p.d.plot(37, 11, "y");
      p.d.plot(38, 13, "l");
      p.d.plot(36, 15, "u");
    }
    if (pose === "cast") p.d.plot(20, 4, "w"), p.d.plot(18, 5, "u");
    return eOut(p, { t: MAT.tide, g: MAT.gold, f: MAT.foam }, 20, false);
  }

  function buildBrume(view, frame, pose) {
    var p = new ePair(40, 38);
    var m = p.m;
    var step = frame ? 1 : 0;
    m.tri(12, 14, 9, 5, 16, 14, "g");
    m.tri(26, 14, 30, 4, 22, 13, "g");
    m.plot(30, 3, "g");
    m.disc(20, 20, 11, 9, "h");
    m.fill(8, 18, 5, 6, "h");
    m.fill(27, 16, 5, 7, "h");
    m.disc(20, 24, 5, 4, "e");
    m.fill(11, 30, 6, 4, "h");
    m.fill(23, 30, 6, 3 + step, "h");
    m.fill(12, 33, 5, 2, "g");
    m.fill(24, 33, 5, 2, "g");
    m.fill(6, 20, 3, 2, "h");
    m.fill(31, 18, 3, 2, "h");
    if (pose === "hurt") eShut(p.d, 14, 17, 3), eShut(p.d, 22, 17, 3);
    else {
      eBrows(p.d, 13, 16, 5, true);
      eBrows(p.d, 21, 16, 5, true);
      eEye(p.d, 14, 17, 3, 2, 2);
      eEye(p.d, 22, 17, 3, 2, 2);
    }
    p.d.fill(17, 21, 5, 1, "n");
    p.d.plot(19, 22, "b");
    p.d.plot(20, 23, "y");
    p.d.plot(18, 24, "o");
    if (pose === "attack") {
      m.fill(33, 18, 5, 4, "h");
      p.d.fill(34, 19, 3, 2, "o");
      p.d.plot(37, 19, "y");
    }
    if (pose === "cast") p.d.plot(20, 6, "y"), p.d.plot(18, 8, "o");
    return eOut(p, { h: MAT.hush, g: MAT.gold, e: MAT.ember }, 20, true, true);
  }

  function buildAsh(view, frame, pose) {
    var p = new ePair(32, 38);
    var m = p.m;
    var step = frame ? 1 : 0;
    m.disc(16, 15, 6, 5, "a");
    m.fill(12, 13, 8, 4, "a");
    m.tri(11, 13, 8, 7, 14, 13, "r");
    m.tri(21, 13, 24, 6, 18, 13, "r");
    m.tri(16, 11, 14, 6, 18, 11, "r");
    m.disc(16, 23, 6, 5, "a");
    m.fill(11, 19, 10, 7, "a");
    m.line(15, 19, 17, 26, "e");
    m.fill(7, 19, 3, 4, "a");
    m.fill(22, 18, 3, 5, "r");
    m.fill(12, 27, 3, 7, "a");
    m.fill(18, 27, 3, 6 + step, "a");
    m.fill(11, 33, 4, 3, "r");
    m.fill(18, 33, 4, 3, "r");
    if (pose === "hurt") {
      eShut(p.d, 12, 15, 3);
      eShut(p.d, 18, 15, 3);
    } else {
      p.d.fill(12, 14, 3, 2, "o");
      p.d.fill(18, 14, 3, 2, "o");
      p.d.plot(12, 14, "y");
      p.d.plot(20, 14, "y");
      p.d.plot(14, 15, "n");
      p.d.plot(19, 15, "n");
    }
    p.d.plot(16, 22, "y");
    p.d.plot(16, 24, "o");
    if (pose === "attack") {
      m.fill(25, 17, 5, 3, "e");
      p.d.fill(26, 17, 3, 2, "y");
      p.d.plot(29, 17, "w");
    }
    if (pose === "cast") {
      p.d.plot(16, 5, "y");
      p.d.plot(14, 7, "o");
    }
    return eOut(p, { a: MAT.ash, r: MAT.rock, e: MAT.ember }, 16, true, true);
  }

  function buildChoir(view, frame, pose) {
    var p = new ePair(32, 38);
    var m = p.m;
    var sway = frame ? 1 : 0;
    m.disc(15, 11, 7, 6, "k");
    m.fill(9, 12, 13, 5, "k");
    m.fill(12, 17, 8, 4, "r");
    m.tri(16, 34, 8, 20, 15, 20, "r");
    m.tri(16, 33, 22, 20, 15, 20, "r");
    m.fill(7, 22, 3, 6, "r");
    m.fill(20, 21, 3, 4, "r");
    m.plot(8, 27, "r");
    m.plot(22, 24, "r");
    m.fill(14, 20, 3, 3, "c");
    m.line(12, 8, 18, 14, ".");
    m.plot(13, 9, ".");
    m.plot(14, 10, ".");
    if (pose === "hurt") eShut(p.d, 11, 11, 3), eShut(p.d, 18, 11, 3);
    else {
      p.d.fill(11, 10, 3, 3, "n");
      p.d.fill(18, 10, 3, 3, "n");
      p.d.plot(12, 11, "g");
      p.d.plot(19, 11, "y");
    }
    p.d.plot(15, 7, "g");
    p.d.plot(15, 21, "y");
    p.d.plot(16, 21, "w");
    p.d.line(11, 9, 17, 15, "q");
    if (pose === "attack") {
      p.d.plot(26, 18, "c");
      p.d.plot(27, 17, "w");
      p.d.plot(25, 16, "y");
    }
    if (pose === "cast") p.d.plot(15, 3, "w"), p.d.plot(13, 4, "c");
    if (sway) m.plot(23, 30, "r");
    return eOut(p, { k: MAT.mask, r: MAT.robe, c: MAT.core }, 15, true);
  }

  function buildSoldier(view, frame, pose) {
    var p = new ePair(40, 38);
    var m = p.m;
    var step = frame ? 1 : 0;
    m.fill(14, 6, 12, 7, "a");
    m.fill(16, 4, 8, 3, "a");
    m.fill(24, 2, 3, 8, "p");
    m.plot(25, 1, "p");
    m.plot(26, 2, "p");
    m.fill(10, 12, 8, 5, "a");
    m.fill(22, 12, 8, 5, "a");
    m.fill(14, 16, 12, 12, "r");
    m.fill(12, 18, 3, 8, "a");
    m.fill(25, 17, 4, 8, "a");
    m.fill(15, 28, 5, 6, "a");
    m.fill(21, 28, 5, 5 + step, "a");
    m.fill(14, 33, 6, 2, "m");
    m.fill(21, 33, 6, 2, "m");
    m.line(30, 4, 30, 30, "m");
    m.tri(30, 4, 34, 8, 30, 10, "g");
    m.fill(8, 18, 4, 3, "a");
    if (pose === "attack") {
      m.line(32, 16, 37, 16, "m");
      m.tri(37, 16, 36, 14, 36, 18, "g");
    }
    p.d.fill(17, 8, 7, 2, "n");
    p.d.plot(18, 8, "s");
    p.d.plot(21, 8, "y");
    p.d.plot(22, 9, "c");
    p.d.plot(25, 3, "l");
    p.d.fill(18, 22, 4, 5, "g");
    p.d.plot(19, 23, "y");
    if (pose === "hurt") p.d.fill(17, 8, 7, 2, "e");
    if (pose === "cast") p.d.plot(20, 3, "w"), p.d.plot(18, 4, "c");
    return eOut(p, { a: MAT.armor, p: MAT.plume, r: MAT.robe, m: MAT.metal, g: MAT.gold }, 20, true, true);
  }

  function buildRaider(view, frame, pose) {
    var p = new ePair(40, 38);
    var m = p.m;
    var step = frame ? 1 : 0;
    m.fill(12, 5, 14, 3, "c");
    m.fill(10, 7, 16, 2, "c");
    m.disc(17, 12, 6, 5, "s");
    m.fill(14, 16, 10, 10, "h");
    m.tri(18, 32, 10, 20, 16, 18, "h");
    m.tri(20, 32, 26, 20, 18, 18, "h");
    m.fill(8, 18, 4, 8, "h");
    m.fill(24, 17, 4, 7, "h");
    m.fill(13, 28, 4, 6, "n");
    m.fill(21, 28, 4, 5 + step, "n");
    m.fill(12, 33, 5, 2, "m");
    m.fill(21, 33, 5, 2, "m");
    m.fill(16, 18, 6, 2, "f");
    m.line(28, 18, pose === "attack" ? 36 : 32, 16, "m");
    m.tri(pose === "attack" ? 36 : 32, 16, pose === "attack" ? 34 : 30, 14, pose === "attack" ? 34 : 30, 18, "g");
    if (pose === "hurt") eShut(p.d, 15, 11, 4);
    else {
      eBrows(p.d, 14, 10, 5, true);
      eEye(p.d, 15, 11, 3, 2, 2);
    }
    p.d.line(15, 15, 19, 15, "n");
    p.d.plot(20, 15, "r");
    p.d.plot(13, 6, "l");
    p.d.plot(22, 19, "y");
    if (pose === "cast") p.d.plot(18, 4, "y");
    return eOut(p, { c: MAT.cloth, s: MAT.skin, h: MAT.hush, n: MAT.rock, m: MAT.metal, g: MAT.gold, f: MAT.ember }, 18, true, true);
  }

  function buildDrowned(view, frame, pose) {
    var p = new ePair(40, 38);
    var m = p.m;
    var drag = frame ? 1 : 0;
    m.disc(16, 11, 6, 5, "p");
    m.tri(10, 10, 6, 4, 12, 12, "w");
    m.tri(12, 12, 8, 8, 14, 16, "w");
    m.fill(7, 14, 3, 5, "w");
    m.disc(18, 22, 9, 8, "t");
    m.fill(12, 18, 12, 8, "t");
    m.fill(8, 20, 4, 8, "p");
    m.fill(24, 16, 3, 14, "p");
    m.fill(26, 28, 4, 3, "p");
    m.plot(29, 30, "p");
    m.plot(30, 29, "p");
    m.fill(13, 28, 5, 5, "t");
    m.fill(21, 29, 5, 4 + drag, "t");
    m.fill(13, 33, 5, 2, "n");
    m.fill(21, 33, 4, 2, "n");
    m.disc(20, 24, 4, 3, "s");
    if (pose === "hurt") eShut(p.d, 16, 10, 4);
    else {
      p.d.fill(15, 10, 4, 3, "u");
      p.d.plot(17, 11, "e");
      p.d.plot(18, 11, "e");
      p.d.plot(15, 10, "l");
    }
    p.d.fill(15, 14, 4, 2, "n");
    p.d.plot(16, 15, "b");
    p.d.plot(22, 18, "g");
    p.d.plot(23, 19, "q");
    p.d.plot(14, 23, "m");
    if (pose === "attack") {
      m.fill(30, 22, 6, 3, "p");
      p.d.plot(35, 23, "n");
      p.d.plot(34, 24, "e");
    }
    if (pose === "cast") p.d.plot(18, 4, "u"), p.d.plot(16, 6, "m");
    return eOut(p, { p: MAT.pale, w: MAT.weed, t: MAT.tide, s: MAT.sea, n: MAT.rock }, 18, true, true);
  }

  function buildHound(view, frame, pose) {
    var p = new ePair(48, 38);
    var m = p.m;
    var a = frame ? 1 : 0;
    var open = pose === "attack" ? 3 : (pose === "hurt" ? 0 : 1);
    m.disc(22, 18, 12, 7, "h");
    m.fill(14, 14, 20, 8, "h");
    m.disc(34, 16, 7, 6, "h");
    m.tri(30, 12, 28, 6, 34, 12, "f");
    m.tri(36, 12, 38, 5, 40, 13, "f");
    m.fill(16, 10, 14, 4, "f");
    m.tri(18, 10, 14, 6, 22, 11, "f");
    m.tri(24, 10, 26, 4, 28, 11, "f");
    m.fill(8, 16, 6, 4, "f");
    m.tri(8, 16, 3, 14, 8, 20, "f");
    m.fill(12, 22, 3, 8 - a, "h");
    m.fill(18, 22, 3, 7 + a, "h");
    m.fill(26, 22, 3, 8 - a, "h");
    m.fill(32, 23, 3, 6 + a, "h");
    m.fill(11, 29, 4, 2, "r");
    m.fill(18, 29, 4, 2, "r");
    m.fill(25, 29, 4, 2, "r");
    m.fill(32, 29, 4, 2, "r");
    if (open) {
      m.fill(38, 16, 4, 2 + open, "k");
      m.fill(38, 16, 3, 2, "t");
      m.fill(39, 18, 2, open, "t");
    }
    if (pose === "hurt") p.d.fill(36, 14, 3, 1, "e");
    else eEye(p.d, 35, 13, 3, 2, 2);
    p.d.plot(20, 12, "y");
    p.d.plot(24, 8, "w");
    p.d.plot(17, 11, "o");
    p.d.plot(40, 17, "w");
    if (pose === "cast") p.d.plot(22, 6, "y"), p.d.plot(26, 5, "o");
    return eOut(p, { h: MAT.ash, f: MAT.ember, r: MAT.rock, k: MAT.voidm, t: MAT.bone }, 24, false, true);
  }

  function buildGull(view, frame, pose) {
    var p = new ePair(48, 38);
    var m = p.m;
    var up = frame === 0;
    m.disc(24, 16, 5, 4, "g");
    m.fill(28, 15, 5, 3, "b");
    m.tri(33, 16, pose === "attack" ? 46 : 40, 15, 33, 18, "b");
    m.tri(20, 18, 15, 21, 22, 22, "g");
    if (up) {
      m.tri(20, 16, 3, 7, 18, 18, "w");
      m.tri(20, 17, 5, 12, 16, 20, "d");
      m.tri(28, 15, 44, 6, 30, 18, "w");
      m.tri(30, 15, 42, 10, 32, 18, "d");
    } else {
      m.tri(20, 17, 2, 16, 18, 21, "w");
      m.tri(20, 18, 4, 20, 16, 23, "d");
      m.tri(28, 16, 45, 18, 30, 22, "w");
      m.tri(30, 17, 43, 21, 32, 23, "d");
    }
    m.fill(22, 20, 2, 3, "b");
    m.fill(25, 21, 2, 2, "b");
    if (pose === "hurt") p.d.fill(22, 15, 3, 1, "e");
    else eEye(p.d, 22, 14, 3, 2, 2);
    p.d.plot(30, 15, "l");
    p.d.plot(6, up ? 9 : 16, "l");
    p.d.plot(40, up ? 8 : 18, "l");
    if (pose === "attack") p.d.plot(44, 15, "y");
    if (pose === "cast") p.d.plot(24, 8, "w");
    return eOut(p, { g: MAT.gull, w: MAT.wing, d: MAT.gull, b: MAT.gold }, 24, false);
  }

  function buildSentinel(view, frame, pose) {
    var p = new ePair(32, 38);
    var m = p.m;
    var step = frame ? 1 : 0;
    m.fill(10, 6, 12, 8, "s");
    m.fill(12, 4, 8, 3, "s");
    m.plot(11, 8, ".");
    m.plot(20, 7, ".");
    m.fill(6, 13, 6, 8, "s");
    m.fill(20, 14, 6, 10, "a");
    m.fill(11, 14, 10, 14, "s");
    m.fill(12, 16, 3, 10, "m");
    m.fill(11, 28, 5, 6, "s");
    m.fill(17, 28, 5, 5 + step, "s");
    m.fill(10, 33, 6, 2, "g");
    m.fill(17, 33, 6, 2, "g");
    m.fill(13, 18, 6, 6, "g");
    if (pose === "attack") {
      m.fill(24, 16, 6, 4, "a");
      p.d.fill(26, 17, 3, 2, "y");
    }
    p.d.fill(13, 8, 8, 2, "s");
    p.d.plot(14, 8, "l");
    p.d.plot(18, 8, "w");
    p.d.plot(15, 20, "y");
    p.d.plot(16, 21, "l");
    p.d.line(14, 12, 18, 16, "n");
    if (pose === "hurt") p.d.fill(13, 8, 8, 2, "e");
    if (pose === "cast") p.d.plot(16, 2, "w"), p.d.plot(14, 3, "s");
    return eOut(p, { s: MAT.stone, a: MAT.armor, m: MAT.metal, g: MAT.gold }, 16, true, true);
  }

  function buildMawBody(frame, pose, field) {
    var w = field ? 52 : 90;
    var h = field ? 42 : 96;
    var sc = field ? 0.5 : 1;
    var p = new ePair(w, h);
    var m = p.m;
    var open = pose === "hurt" ? 0 : (pose === "attack" ? (frame ? 16 : 10) : (frame ? 12 : 8));
    if (field) open = Math.max(4, (open / 2) | 0);
    var ox = field ? 6 : 8;
    var oy = field ? 4 : 8;
    var jy = (field ? 24 : 48) + (open > 6 ? 2 : 0);
    m.tri(ox + 18, oy + 16, ox + 24, oy + 2, ox + 32, oy + 16, "r");
    m.tri(ox + 34, oy + 18, ox + 46, oy, ox + 52, oy + 18, "r");
    m.tri(ox + 8, oy + 20, ox + 4, oy + 8, ox + 16, oy + 20, "r");
    m.disc(ox + 30, oy + 24, field ? 16 : 28, field ? 12 : 16, "r");
    m.fill(ox + 10, oy + 18, field ? 28 : 48, field ? 10 : 16, "r");
    m.fill(ox + 16, jy, field ? 26 : 46, field ? 8 : 14, "r");
    m.disc(ox + 36, jy + (field ? 6 : 10), field ? 12 : 22, field ? 5 : 9, "r");
    m.fill(ox + 22, oy + 28, field ? 18 : 36, Math.max(4, (field ? open : open)), "k");
    var tooth = field ? 3 : 5;
    var i;
    for (i = 0; i < tooth; i++) {
      var tx = ox + 24 + i * (field ? 4 : 6);
      var th = (field ? 3 : 5) + (i % 2 ? 2 : 0);
      if (pose === "hurt") th = field ? 2 : 3;
      m.fill(tx, oy + 28, 2, th, "t");
      m.fill(tx, jy + (field ? 4 : 8) - (i % 2), 2, field ? 2 : 3, "t");
    }
    var cr = field ? 3 : 7;
    m.disc(ox + 32, oy + 32 + ((open / 4) | 0), cr, cr, "e");
    m.fill(ox + 14, h - (field ? 10 : 16), field ? 8 : 12, field ? 7 : 12, "r");
    m.fill(ox + 30, h - (field ? 9 : 14), field ? 8 : 14, field ? 6 : 11, "r");
    m.fill(ox + 14, h - 4, field ? 7 : 10, 2, "d");
    m.fill(ox + 32, h - 4, field ? 7 : 12, 2, "d");
    var eyeX = ox + (field ? 34 : 58);
    var eyeY = oy + (field ? 16 : 26);
    if (pose === "hurt") eShut(p.d, eyeX, eyeY, field ? 4 : 7);
    else eEye(p.d, eyeX, eyeY, field ? 5 : 8, field ? 3 : 5, field ? 3 : 5);
    eBrows(p.d, eyeX - 1, eyeY - 2, field ? 7 : 10, true);
    p.d.plot(ox + 32, oy + 32, "w");
    p.d.plot(ox + 31, oy + 31, "y");
    p.d.line(ox + 18, oy + 22, ox + 28, oy + 34, "o");
    p.d.line(ox + 40, oy + 20, ox + 48, oy + 30, "r");
    p.d.plot(ox + 26, oy + 30, "b");
    p.d.plot(ox + 44, jy + 2, "w");
    if (pose === "cast" || (pose === "idle" && frame)) p.d.plot(ox + 33, oy + 32, "l");
    if (pose === "attack" && !field) {
      p.d.fill(w - 8, oy + 36, 4, 3, "o");
      p.d.plot(w - 4, oy + 36, "y");
    }
    return eOut(p, { r: MAT.rock, k: MAT.voidm, t: MAT.bone, e: MAT.ember, d: MAT.ash }, field ? 26 : 40, true, true);
  }

  function buildWyrm(view, frame, pose) {
    return buildWyrmBody(frame, pose, false);
  }

  function buildWyrmBody(frame, pose, field) {
    var w = field ? 64 : 72;
    var h = field ? 40 : 96;
    var p = new ePair(w, h);
    var m = p.m;
    var phase = frame ? 1 : 0;
    var coils, i, c, y, fin;
    if (field) {
      coils = [[8, 22, 5], [18, 16, 5], [28, 24, 5], [38, 15, 5], [48, 22, 6]];
      for (i = 0; i < coils.length; i++) {
        c = coils[i];
        y = c[1] + ((i + phase) % 2 ? -2 : 2);
        m.disc(c[0], y, c[2], c[2] - 1, i % 2 ? "t" : "s");
        m.tri(c[0], y - c[2], c[0] - 2, y - c[2] + 2, c[0] + 2, y - c[2] + 2, "f");
      }
      m.disc(56, 16, 6, 5, "s");
      m.tri(58, 10, 62, 6, 64, 12, "f");
      m.fill(58, 16, 4, 2, "k");
      m.fill(58, 16, 3, 2, "t");
      if (pose === "hurt") eShut(p.d, 54, 14, 3);
      else eEye(p.d, 53, 13, 3, 2, 2);
      p.d.plot(28, 18, "w");
      p.d.plot(27, 17, "l");
    } else {
      coils = [[22, 84, 11], [36, 70, 11], [20, 56, 10], [38, 42, 10], [24, 28, 9]];
      for (i = 0; i < coils.length; i++) {
        c = coils[i];
        y = c[1] + (pose === "hurt" ? 2 : ((i + phase) % 2 ? -2 : 1));
        m.disc(c[0], y, c[2], c[2] - 1, i % 2 ? "t" : "s");
        fin = c[0] + (i % 2 ? c[2] : -c[2]);
        m.tri(fin, y - 2, fin + (i % 2 ? 4 : -4), y - 8, fin, y + 2, "f");
        p.d.plot(c[0] - 3, y - 3, "l");
      }
      m.disc(40, 16, 9, 8, "s");
      m.tri(36, 12, 30, 2, 42, 10, "f");
      m.tri(46, 10, 54, 4, 50, 14, "f");
      m.fill(46, 16, 6, 3, "k");
      m.fill(46, 16, 4, 2, "t");
      m.fill(48, 18, 2, 3, "t");
      m.disc(28, 56, 4, 4, "p");
      if (pose === "hurt") eShut(p.d, 38, 14, 5);
      else eEye(p.d, 36, 12, 5, 4, 3);
      p.d.plot(28, 56, "w");
      p.d.plot(27, 55, "l");
      p.d.plot(50, 17, "w");
      if (pose === "attack") {
        m.fill(54, 14, 8, 4, "s");
        m.fill(60, 15, 4, 2, "t");
        p.d.plot(64, 15, "w");
      }
      if (pose === "cast") {
        p.d.plot(30, 48, "w");
        p.d.plot(24, 52, "u");
        p.d.plot(34, 50, "l");
      }
    }
    return eOut(p, { t: MAT.tide, s: MAT.sea, f: MAT.foam, k: MAT.voidm, p: MAT.foam, b: MAT.bone }, field ? 32 : 30, false, true);
  }

  function buildSoot(view, frame, pose) {
    var p = new ePair(40, 28);
    var m = p.m;
    var up = frame === 0;
    var i, y;
    m.disc(18, 14, 5, 4, "a");
    m.fill(22, 13, 5, 3, "a");
    m.plot(26, 14, "e");
    for (i = 0; i < 10; i++) {
      y = 12 + (up ? -Math.floor(i / 2) : Math.floor(i / 3));
      m.fill(6 - i, y, 3, 2, "a");
      m.fill(24 + i, y - 1, 3, 2, "r");
    }
    if (pose !== "hurt") eEye(p.d, 16, 12, 3, 2, 2);
    else eShut(p.d, 16, 13, 3);
    p.d.plot(26, 13, "o");
    if (pose === "attack") p.d.fill(30, 13, 4, 2, "o");
    return eOut(p, { a: MAT.ash, r: MAT.rock, e: MAT.ember }, 18, false);
  }

  function eFieldWrap(battleBuild, fieldBuild, ax) {
    return function (view, frame, pose) {
      if (view === "front" || view === "back" || view === "side") {
        if (fieldBuild && pose === "idle") return fieldBuild(view, frame);
      }
      return battleBuild("battle", frame, pose);
    };
  }

  // Map tokens stay near the old footprint. Battle poses use the tall sprite.
  function bindBoss(id, battle, field, ax) {
    Art.add(id, function (pose, facing, frame) {
      frame = ((frame % 4) + 4) % 4;
      var battlePose = pose !== "walk" && pose !== "stand";
      var part = battlePose ? battle(frame % 2, pose) : field(facing, frame % 2);
      var s = eBake(part, battlePose ? pose : "idle", frame % 2, part.ax != null ? part.ax : ax);
      if (facing === "left") return Art.mirror(s);
      return s;
    }, 2, 1);
  }

  eBind("wisp", function (view, frame, pose) {
    var part = buildWisp(view, frame, pose);
    if (view === "back") part.det = part.mask.map(function (row) { return row.replace(/./g, "."); });
    return part;
  }, 16);
  eBind("saltwisp", function (view, frame, pose) { return buildSalt(view, frame, pose); }, 20);
  eBind("brumekin", function (view, frame, pose) { return buildBrume(view, frame, pose); }, 20);
  eBind("ashling", function (view, frame, pose) { return buildAsh(view, frame, pose); }, 16);
  eBind("choirling", function (view, frame, pose) { return buildChoir(view, frame, pose); }, 15);
  eBind("choir_soldier", function (view, frame, pose) { return buildSoldier(view, frame, pose); }, 20);
  eBind("hush_raider", function (view, frame, pose) { return buildRaider(view, frame, pose); }, 18);
  eBind("drowned", function (view, frame, pose) { return buildDrowned(view, frame, pose); }, 18);
  eBind("cinderhound", function (view, frame, pose) { return buildHound(view, frame, pose); }, 24);
  eBind("stormgull", function (view, frame, pose) { return buildGull(view, frame, pose); }, 26);
  eBind("sentinel", function (view, frame, pose) { return buildSentinel(view, frame, pose); }, 16);
  eBind("sootwing", function (view, frame, pose) { return buildSoot(view, frame, pose); }, 18);

  bindBoss("cinder_maw", function (frame, pose) {
    return buildMawBody(frame, pose, false);
  }, function (facing, frame) {
    return buildMawBody(frame, "idle", true);
  }, 40);
  bindBoss("tidewyrm", function (frame, pose) {
    return buildWyrmBody(frame, pose, false);
  }, function (facing, frame) {
    return buildWyrmBody(frame, "idle", true);
  }, 30);

  ePortrait("wisp", C.violetD, { x: 16, y: 12 });
  ePortrait("saltwisp", C.sea, { x: 20, y: 14 });
  ePortrait("brumekin", C.hushD, { x: 20, y: 18 });
  ePortrait("ashling", C.ashD, { x: 16, y: 18 });
  ePortrait("choirling", C.violetD, { x: 15, y: 14 });
  ePortrait("choir_soldier", C.violetD, { x: 20, y: 14 });
  ePortrait("hush_raider", C.hushD, { x: 18, y: 14 });
  ePortrait("drowned", C.tideD, { x: 18, y: 16 });
  ePortrait("cinderhound", C.rock, { x: 30, y: 16 });
  ePortrait("stormgull", C.stoneD, { x: 26, y: 16 });
  ePortrait("sentinel", C.stoneD, { x: 16, y: 14 });
  ePortrait("sootwing", C.rock, { x: 18, y: 14 });
  ePortrait("cinder_maw", C.rock, { x: 48, y: 40 });
  ePortrait("tidewyrm", C.sea, { x: 40, y: 20 });
  Art.addPortrait("maw", function () { return Art._portraits.cinder_maw(); });

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
