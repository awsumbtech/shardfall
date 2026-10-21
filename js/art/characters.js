"use strict";

// Chibi cast for the field and for battle. Each person keeps a short ramp
// per material (shadow, mid, highlight). The outline is the dark ink, not
// pure black, and it only wraps the silhouette. Side faces look toward the
// way they walk: a large eye, a one-pixel nose, and a smile. Left is a
// mirror of right. Battle poses are drawn at this same pixel size and the
// battle renderer scales them by a whole number.
(function () {
  var C = Art.C;
  var W = 24;
  var H = 34;

  function spr() {
    var s = Art.spr(W, H);
    s.ax = (W / 2) | 0;
    s.ay = H - 2;
    return s;
  }

  function plot(s, x, y, c) {
    if (c) Art.plot(s, x, y, c);
  }

  function fill(s, x, y, w, h, c) {
    if (c && w > 0 && h > 0) Art.fill(s, x, y, w, h, c);
  }

  function blob(s, x, y, w, h, c) {
    var yy, xx, inset;
    if (!c || w < 3 || h < 3) return;
    for (yy = 0; yy < h; yy++) {
      inset = 0;
      if (yy === 0 || yy === h - 1) inset = 2;
      else if (yy === 1 || yy === h - 2) inset = 1;
      for (xx = inset; xx < w - inset; xx++) plot(s, x + xx, y + yy, c);
    }
  }

  function shade(s, x, y, w, h, lite, mid, dark) {
    blob(s, x, y, w, h, mid);
    var yy, xx, i;
    for (yy = 0; yy < h; yy++) {
      for (xx = 0; xx < w; xx++) {
        if (y + yy < 0 || x + xx < 0 || y + yy >= s.h || x + xx >= s.w) continue;
        i = (y + yy) * s.w + (x + xx);
        if (s.d[i] !== mid) continue;
        if (xx >= w - 2 || yy >= h - 2) s.d[i] = dark;
        else if (xx <= 1 || yy <= 1) s.d[i] = lite;
      }
    }
  }

  function crop(s) {
    var y, x, minX = s.w, minY = s.h, maxX = 0, maxY = 0, c, o, yy, xx;
    for (y = 0; y < s.h; y++) {
      for (x = 0; x < s.w; x++) {
        if (!s.d[y * s.w + x]) continue;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
    if (maxX < minX) return s;
    o = Art.spr(maxX - minX + 1, maxY - minY + 1);
    for (y = minY; y <= maxY; y++) {
      for (x = minX; x <= maxX; x++) {
        c = s.d[y * s.w + x];
        if (!c) continue;
        yy = y - minY;
        xx = x - minX;
        o.d[yy * o.w + xx] = c;
      }
    }
    o.ax = ((maxX + minX) / 2) | 0;
    o.ax -= minX;
    o.ay = o.h - 1;
    return o;
  }

  function seal(s) {
    var y, x, n, k, nx, ny, dirs, seen;
    dirs = [1, 0, -1, 0, 0, 1, 0, -1];
    for (y = 1; y < s.h - 1; y++) {
      for (x = 1; x < s.w - 1; x++) {
        if (s.d[y * s.w + x]) continue;
        n = 0;
        seen = 0;
        for (k = 0; k < 8; k += 2) {
          nx = x + dirs[k];
          ny = y + dirs[k + 1];
          if (s.d[ny * s.w + nx]) {
            n++;
            if (!seen) seen = s.d[ny * s.w + nx];
          }
        }
        if (n >= 3 && seen) s.d[y * s.w + x] = seen;
      }
    }
  }

  function finish(s) {
    Art.outline(s, C.ink);
    seal(s);
    return crop(s);
  }

  function layDown(s) {
    var o = Art.spr(s.h + 2, s.w + 2);
    var x, y, c;
    for (y = 0; y < s.h; y++) {
      for (x = 0; x < s.w; x++) {
        c = s.d[y * s.w + x];
        if (!c) continue;
        Art.plot(o, y + 1, s.w - x, c);
      }
    }
    return finish(o);
  }

  function eye(s, x, y, blink, skinD) {
    if (blink) {
      fill(s, x, y + 1, 4, 1, skinD);
      return;
    }
    fill(s, x, y, 4, 3, C.white);
    plot(s, x + 2, y + 1, C.eye);
    plot(s, x + 3, y + 1, C.eye);
    plot(s, x, y, C.lite);
  }

  function hairExtra(s, x, y, p, dir) {
    var style = p.style;
    if (style === "pony" || style === "tail") {
      if (dir === "side") {
        fill(s, x - 1, y + 6, 3, 8, p.hair);
        fill(s, x - 2, y + 9, 2, 5, p.hairD);
        plot(s, x, y + 7, p.tie || C.scarf);
        plot(s, x - 1, y + 8, p.hairL);
      } else if (dir === "front") {
        fill(s, x + 8, y + 6, 3, 8, p.hair);
        fill(s, x + 9, y + 8, 2, 6, p.hairD);
        plot(s, x + 8, y + 7, p.tie || C.scarf);
        plot(s, x + 10, y + 9, p.hairL);
      } else {
        fill(s, x + 4, y + 8, 3, 7, p.hair);
        fill(s, x + 5, y + 10, 2, 5, p.hairD);
        plot(s, x + 4, y + 9, p.tie || C.scarf);
      }
    } else if (style === "bun") {
      blob(s, x + (dir === "side" ? 2 : 3), y - 3, 7, 6, p.hairD);
      blob(s, x + (dir === "side" ? 3 : 4), y - 2, 5, 4, p.hair);
      plot(s, x + (dir === "side" ? 4 : 5), y - 2, p.hairL);
    } else if (style === "bob") {
      if (dir === "front") {
        fill(s, x - 1, y + 6, 3, 7, p.hairD);
        fill(s, x + 8, y + 6, 3, 7, p.hair);
      } else if (dir === "side") {
        fill(s, x, y + 6, 3, 7, p.hairD);
      }
    } else if (style === "hood" || style === "mask") {
      if (dir !== "back") {
        fill(s, x, y + 2, 3, 8, p.hairD);
        fill(s, x + 8, y + 2, 3, 8, p.hair);
        plot(s, x + 2, y + 2, p.hairL);
      }
    } else if (style === "helm") {
      fill(s, x + 1, y, 10, 4, p.metal || C.armor);
      fill(s, x + 2, y + 1, 4, 2, C.armorL);
      if (dir === "side") {
        fill(s, x - 2, y + 1, 4, 3, p.plume || C.plume);
        plot(s, x - 2, y, p.plume || C.plume);
      } else if (dir === "front") {
        fill(s, x + 10, y - 3, 2, 5, p.plume || C.plume);
        plot(s, x + 11, y - 4, C.lite);
      } else {
        fill(s, x + 8, y - 2, 2, 4, p.plume || C.plume);
      }
    } else if (style === "cap") {
      fill(s, x + 1, y, 10, 3, p.cap || p.cloth);
      fill(s, x, y + 3, 12, 2, p.capD || p.clothD);
      plot(s, x + 3, y + 1, p.hairL);
    } else if (style === "brim") {
      fill(s, x + 2, y - 1, 9, 3, p.cap || p.cloth);
      fill(s, x - 1, y + 2, 14, 2, p.capD || C.gold);
      plot(s, x + 4, y, p.hairL);
    }
  }

  function faceFront(s, x, y, p, blink) {
    blob(s, x, y, 14, 7, p.hairD);
    blob(s, x + 1, y + 1, 12, 5, p.hair);
    plot(s, x + 3, y + 2, p.hairL);
    plot(s, x + 4, y + 1, p.hairL);
    blob(s, x + 1, y + 4, 12, 10, p.skin);
    fill(s, x + 2, y + 4, 10, 2, p.hair);
    plot(s, x + 3, y + 4, p.hairL);
    plot(s, x + 9, y + 5, p.hairD);
    if (p.goggles) {
      fill(s, x + 3, y + 4, 8, 2, C.frame);
      plot(s, x + 4, y + 4, C.lens);
      plot(s, x + 8, y + 4, C.lite);
    }
    eye(s, x + 2, y + 7, blink, p.skinD);
    eye(s, x + 8, y + 7, blink, p.skinD);
    plot(s, x + 2, y + 10, p.skinD);
    plot(s, x + 11, y + 10, p.skinD);
    if (p.freckles) {
      plot(s, x + 2, y + 10, p.skinDeep);
      plot(s, x + 11, y + 10, p.skinDeep);
    }
    if (!blink) {
      plot(s, x + 4, y + 11, C.lip);
      plot(s, x + 5, y + 12, C.lip);
      plot(s, x + 6, y + 12, C.lip);
      plot(s, x + 7, y + 12, C.lip);
      plot(s, x + 8, y + 11, C.lip);
    } else {
      fill(s, x + 5, y + 12, 4, 1, p.skinD);
    }
    if (p.old) {
      plot(s, x + 3, y + 11, p.skinD);
      plot(s, x + 9, y + 11, p.skinD);
    }
    hairExtra(s, x, y, p, "front");
    fill(s, x + 5, y + 13, 4, 2, p.skin);
  }

  function faceSide(s, x, y, p, blink) {
    // Hair behind a solid cheek. The nose is extra skin on the front edge,
    // overlapping the cheek, so the profile has no transparent notch.
    blob(s, x, y, 10, 6, p.hairD);
    blob(s, x + 1, y + 1, 8, 4, p.hair);
    plot(s, x + 3, y + 1, p.hairL);
    fill(s, x + 3, y + 4, 9, 9, p.skin);
    fill(s, x + 11, y + 7, 2, 3, p.skin);
    plot(s, x + 12, y + 8, p.skinD);
    var yy;
    for (yy = 5; yy <= 12; yy++) {
      if (s.d[(y + yy) * s.w + (x + 11)] === p.skin) s.d[(y + yy) * s.w + (x + 11)] = p.skinD;
    }
    fill(s, x + 4, y + 11, 7, 1, p.skinD);
    fill(s, x + 4, y + 4, 6, 2, p.hair);
    plot(s, x + 5, y + 4, p.hairL);
    if (p.goggles) {
      fill(s, x + 6, y + 4, 6, 2, C.frame);
      plot(s, x + 7, y + 4, C.lens);
      plot(s, x + 10, y + 4, C.lite);
    }
    if (p.style === "mask") {
      fill(s, x + 5, y + 5, 8, 7, p.mask || C.mask);
      fill(s, x + 8, y + 7, 3, 2, C.void);
      plot(s, x + 9, y + 7, p.hem || C.gold);
      plot(s, x + 12, y + 8, p.skinD);
      plot(s, x + 9, y + 11, p.hem || C.gold);
      plot(s, x + 10, y + 11, C.gold);
    } else {
      eye(s, x + 6, y + 6, blink, p.skinD);
      if (!blink) {
        plot(s, x + 8, y + 10, C.lip);
        plot(s, x + 9, y + 10, C.lip);
        plot(s, x + 10, y + 9, C.lip);
      } else {
        fill(s, x + 8, y + 10, 3, 1, p.skinD);
      }
      if (p.freckles) plot(s, x + 7, y + 9, p.skinDeep);
      if (p.old) plot(s, x + 7, y + 9, p.skinD);
    }
    hairExtra(s, x, y, p, "side");
    fill(s, x + 6, y + 13, 4, 2, p.style === "mask" ? (p.mask || C.mask) : p.skin);
    plot(s, x + 8, y + 14, p.skinD);
  }

  function faceBack(s, x, y, p) {
    blob(s, x, y, 14, 12, p.hairD);
    blob(s, x + 1, y + 1, 12, 10, p.hair);
    plot(s, x + 3, y + 2, p.hairL);
    plot(s, x + 9, y + 3, p.hairD);
    hairExtra(s, x, y, p, "back");
  }

  // Forward tip of whatever was just drawn, so a glow can sit on the
  // weapon instead of on a guessed arm offset.
  function tipOf(x, y) {
    return { x: x, y: y };
  }

  function weapon(s, x, y, p, how) {
    var kind = p.weapon;
    if (!kind) return null;
    if (kind === "shard") {
      if (how === "up") {
        fill(s, x, y, 3, 4, C.shard);
        plot(s, x, y, C.shardH);
        plot(s, x + 1, y, C.white);
        plot(s, x + 2, y + 3, C.shardD);
        return tipOf(x + 2, y);
      } else if (how === "forward") {
        fill(s, x, y, 4, 3, C.shard);
        plot(s, x, y, C.shardH);
        plot(s, x + 1, y, C.white);
        fill(s, x + 2, y + 1, 2, 2, C.shardD);
        return tipOf(x + 3, y);
      } else {
        fill(s, x, y, 3, 4, C.shard);
        plot(s, x, y, C.shardH);
        plot(s, x + 2, y + 3, C.shardD);
        return tipOf(x + 2, y);
      }
    } else if (kind === "pistol") {
      fill(s, x, y, 5, 3, C.metalD);
      fill(s, x + 1, y, 3, 2, C.metal);
      plot(s, x + 1, y, C.lite);
      plot(s, x + 4, y + 1, C.woodD);
      plot(s, x, y + 2, C.wood);
      return tipOf(x + 4, y);
    } else if (kind === "wrench") {
      fill(s, x, y, 3, 2, C.metal);
      fill(s, x + 1, y + 1, 2, 4, C.metalD);
      plot(s, x, y, C.lite);
      plot(s, x + 2, y + 4, C.metal);
      return tipOf(x + 2, y);
    } else if (kind === "staff") {
      var staffH = Math.max(8, Math.min(16, 27 - y));
      fill(s, x + 1, y, 2, staffH, C.woodD);
      fill(s, x + 1, y + 2, 1, Math.max(4, staffH - 4), C.wood);
      fill(s, x, y, 4, 3, C.gold);
      plot(s, x + 1, y, C.goldD);
      plot(s, x + 2, y + 1, C.shardH);
      return tipOf(x + 2, y);
    } else if (kind === "spear") {
      var spearH = Math.max(8, Math.min(16, 27 - y));
      fill(s, x + 1, y, 2, spearH, C.metalD);
      fill(s, x + 1, y + 4, 1, Math.max(4, spearH - 6), C.metal);
      fill(s, x, y, 4, 3, C.armorL);
      plot(s, x + 1, y, C.lite);
      return tipOf(x + 2, y);
    } else if (kind === "lantern") {
      fill(s, x, y, 3, 1, C.wood);
      fill(s, x, y + 1, 3, 3, C.gold);
      plot(s, x + 1, y + 2, C.warm);
      plot(s, x, y + 1, C.lite);
      return tipOf(x + 1, y);
    } else if (kind === "mug") {
      fill(s, x, y, 3, 3, C.cream);
      plot(s, x, y, C.lite);
      plot(s, x + 3, y + 1, C.gold);
      return tipOf(x + 2, y);
    }
    return null;
  }

  // Cyan (or ember) spark sits on empty pixels in front of the weapon tip.
  function addGlow(s, tip, hi, mid) {
    if (!tip) return;
    var spots = [[1, 0, hi], [2, 0, mid], [1, -1, mid], [2, -1, hi], [1, 1, mid]];
    var i, px, py;
    for (i = 0; i < spots.length; i++) {
      px = tip.x + spots[i][0];
      py = tip.y + spots[i][1];
      if (px < 0 || py < 0 || px >= s.w || py >= s.h) continue;
      if (s.d[py * s.w + px]) continue;
      plot(s, px, py, spots[i][2]);
    }
  }

  // The near arm. x,y is a shoulder that already overlaps the torso.
  // The hand overlaps the sleeve, and the weapon overlaps the hand.
  function arm(s, x, y, p, how, cloth, clothL, hold) {
    var tip = null;
    if (how === "forward") {
      fill(s, x, y + 2, 7, 3, cloth);
      fill(s, x, y + 2, 2, 3, clothL);
      fill(s, x + 5, y + 2, 3, 3, p.skin);
      plot(s, x + 6, y + 3, p.skinD);
      tip = weapon(s, x + 6, y + 2, p, "forward");
    } else if (how === "up") {
      fill(s, x, y - 8, 3, 10, clothL);
      fill(s, x, y - 11, 3, 4, p.skin);
      plot(s, x + 1, y - 11, C.lite);
      var wy = y - 13;
      if (wy < 0) wy = 0;
      tip = weapon(s, x + 1, wy, p, "up");
    } else if (how === "back") {
      fill(s, x, y + 1, 4, 5, cloth);
      fill(s, x + 1, y + 4, 3, 3, p.skin);
    } else {
      fill(s, x, y, 4, 6, cloth);
      fill(s, x, y, 1, 5, clothL);
      fill(s, x + 1, y + 4, 3, 3, p.skin);
      plot(s, x + 2, y + 5, p.skinD);
      if (hold !== false && (how === "low" || how === "down") && p.weapon !== "staff" && p.weapon !== "spear") {
        tip = weapon(s, x + 2, y + 5, p, "down");
      }
    }
    return tip;
  }

  function legs(s, x, hip, p, liftA, liftB, reach, front) {
    var lenA = 6 - liftA;
    var lenB = 6 - liftB;
    var bootA = p.boot;
    var bootB = p.bootD;
    if (lenA < 3) lenA = 3;
    if (lenB < 3) lenB = 3;
    fill(s, x, hip + liftB, 4, lenB, bootB);
    fill(s, x, hip + liftB + lenB, 4, 2, p.bootDark || bootB);
    fill(s, x + 5, hip + liftA, 4, lenA, front || bootA);
    fill(s, x + 5 + reach, hip + liftA + lenA, 4, 2, bootA);
    plot(s, x + 6 + reach, hip + liftA + lenA, p.bootL || bootA);
  }

  function robe(s, x, y, p, sway) {
    shade(s, x, y, 12, 12, p.clothL, p.cloth, p.clothD);
    fill(s, x + 5, y + 1, 2, 10, p.clothD);
    fill(s, x + sway, y + 10, 12, 2, p.hem || p.clothD);
    plot(s, x + 2 + sway, y + 10, p.trim || C.gold);
    plot(s, x + 8 + sway, y + 11, p.trimD || C.goldD);
    if (!p.nofeet) {
      fill(s, x + 2, y + 11, 3, 2, p.bootD);
      fill(s, x + 7, y + 11, 3, 2, p.boot);
    }
  }

  function gait(frame, idle, pose) {
    if (idle || pose === "idle" || pose === "stand") {
      return { bob: frame % 2 ? -1 : 0, liftA: 0, liftB: 0, reach: 0, arm: 0 };
    }
    if (pose === "attack") return { bob: 0, liftA: 1, liftB: 0, reach: 2, arm: "forward" };
    if (pose === "hurt") return { bob: 1, liftA: 0, liftB: 0, reach: -1, arm: "back" };
    if (pose === "victory") return { bob: 0, liftA: 0, liftB: 0, reach: 0, arm: "up" };
    if (pose === "cast") return { bob: frame % 2 ? -1 : 0, liftA: 0, liftB: 0, reach: 0, arm: "up" };
    frame = ((frame % 4) + 4) % 4;
    if (frame === 0) return { bob: 0, liftA: 0, liftB: 2, reach: 1, arm: 1 };
    if (frame === 1) return { bob: -1, liftA: 1, liftB: 1, reach: 0, arm: 0 };
    if (frame === 2) return { bob: 0, liftA: 2, liftB: 0, reach: -1, arm: -1 };
    return { bob: -1, liftA: 1, liftB: 1, reach: 0, arm: 0 };
  }

  function paintSide(p, frame, pose) {
    var idle = pose === "idle" || pose === "stand";
    var g = gait(frame, idle, pose);
    var blink = pose === "hurt";
    var s = spr();
    // Breathing and the walk bounce lift the chest only. Boots stay put.
    var bob = g.bob < 0 ? g.bob : 0;
    var x = 3;
    var hip = 21;
    var headY = 2 + bob;
    if (p.weapon === "staff" || p.weapon === "spear") weapon(s, x + 10, 8 + bob, p, "down");
    if (p.robe || p.skirt) robe(s, x + 2, hip - 6, p, 0);
    else legs(s, x + 3, hip, p, g.liftA, g.liftB, pose === "walk" ? g.reach : (pose === "attack" ? 1 : 0), p.boot);
    shade(s, x + 3, hip - 8 + bob, 10, 8, p.clothL, p.cloth, p.clothD);
    fill(s, x + 2, hip - 2 + bob, 12, 3, p.cloth);
    fill(s, x + 2, hip + bob, 12, 2, p.clothD);
    plot(s, x + 3, hip - 2 + bob, p.clothL);
    if (p.shirt) {
      fill(s, x + 6, hip - 6 + bob, 4, 4, p.shirt);
      plot(s, x + 7, hip - 5 + bob, C.lite);
    }
    if (p.scarf) {
      fill(s, x + 8, hip - 9 + bob, 6, 2, p.trim);
      fill(s, x + 9, hip - 9 + bob, 3, 1, p.trimL);
      // Short end on the chest, in front of the coat. Not a wedge on the back.
      fill(s, x + 12, hip - 7 + bob, 2, 3, p.trimD);
    }
    if (p.belt) {
      fill(s, x + 3, hip - 1 + bob, 10, 2, C.belt);
      plot(s, x + 8, hip - 1 + bob, C.gold);
    }
    if (p.armor) {
      shade(s, x + 4, hip - 8 + bob, 8, 4, C.armorL, C.armor, C.armorD);
      plot(s, x + 7, hip - 6 + bob, C.gold);
    }
    if (p.apron) {
      fill(s, x + 6, hip - 4 + bob, 5, 6, C.cream);
      plot(s, x + 6, hip - 4 + bob, C.goldD);
    }
    if (p.stole) {
      fill(s, x + 7, hip - 8 + bob, 2, 8, p.stole || C.stole);
      plot(s, x + 7, hip - 6 + bob, C.white);
    }
    faceSide(s, x + 2, headY, p, blink);
    if (p.satchel) shade(s, x + 1, hip - 5 + bob, 4, 5, C.gold, C.goldD, C.woodD);
    var how = g.arm === "forward" || g.arm === "up" || g.arm === "back" ? g.arm : "low";
    var swing = pose === "walk" ? (g.arm | 0) : 0;
    var armX = x + 8 + swing;
    var armY = hip - 6 + bob;
    if (how === "up") armX = x + 12;
    else if (how === "forward") armX = x + 7;
    else if (how === "back") armX = x + 6;
    var tip = null;
    if (p.weapon === "pistol" && how !== "up" && how !== "forward" && how !== "back") {
      arm(s, armX, armY, p, "down", p.cloth, p.clothL);
      tip = weapon(s, armX + 3, armY + 3, p, "forward");
    } else {
      tip = arm(s, armX, armY, p, how, p.cloth, p.clothL);
    }
    if (pose === "victory" || pose === "cast") {
      var hi = p.weapon === "wrench" ? C.emberH : (p.weapon === "pistol" ? C.white : C.shardH);
      var mid = p.weapon === "wrench" ? C.ember : (p.weapon === "pistol" ? C.lite : C.shard);
      addGlow(s, tip, hi, mid);
    }
    return s;
  }

  function paintFront(p, frame, pose) {
    var idle = pose === "idle" || pose === "stand";
    var g = gait(frame, idle, "walk");
    if (idle) g = gait(frame, true, "idle");
    var s = spr();
    var bob = g.bob < 0 ? g.bob : 0;
    var x = 5;
    var y = 2 + bob;
    if (p.weapon === "staff" || p.weapon === "spear") weapon(s, x + 10, 6 + bob, p, "down");
    if (p.robe || p.skirt) robe(s, x + 1, 16, p, 0);
    else legs(s, x + 3, 21, p, g.liftB, g.liftA, 0, p.boot);
    shade(s, x + 2, 14 + bob, 12, 6, p.clothL, p.cloth, p.clothD);
    fill(s, x + 1, 19 + bob, 14, 3, p.cloth);
    fill(s, x + 1, 21 + bob, 14, 1, p.clothD);
    plot(s, x + 2, 19 + bob, p.clothL);
    if (p.shirt) {
      fill(s, x + 5, 15 + bob, 6, 4, p.shirt);
      plot(s, x + 6, 16 + bob, C.lite);
    }
    if (p.scarf) {
      fill(s, x + 2, 13 + bob, 12, 2, p.trim);
      fill(s, x + 4, 13 + bob, 5, 1, p.trimL);
      fill(s, x + 12, 14 + bob, 2, 5, p.trimD);
    }
    if (p.belt) {
      fill(s, x + 2, 20 + bob, 12, 2, C.belt);
      plot(s, x + 7, 20 + bob, C.gold);
    }
    if (p.armor) {
      shade(s, x + 1, 14 + bob, 4, 4, C.armorL, C.armor, C.armorD);
      shade(s, x + 9, 14 + bob, 4, 4, C.armorL, C.armor, C.armorD);
      plot(s, x + 7, 17 + bob, C.gold);
    }
    if (p.apron) {
      fill(s, x + 5, 17 + bob, 6, 6, C.cream);
      plot(s, x + 5, 17 + bob, C.goldD);
    }
    if (p.stole) {
      fill(s, x + 6, 14 + bob, 3, 8, p.stole || C.stole);
      plot(s, x + 7, 16 + bob, C.white);
    }
    faceFront(s, x, y, p, false);
    var swing = idle ? 0 : (frame % 4 === 0 ? -1 : frame % 4 === 2 ? 1 : 0);
    arm(s, x, 15 + bob, p, "down", p.clothD, p.cloth, false);
    arm(s, x + 9, 15 + bob + swing, p, "low", p.cloth, p.clothL, true);
    return s;
  }

  function paintBack(p, frame, pose) {
    var idle = pose === "idle" || pose === "stand";
    var g = gait(frame, idle, "walk");
    if (idle) g = gait(frame, true, "idle");
    var s = spr();
    var bob = g.bob < 0 ? g.bob : 0;
    var x = 5;
    if (p.robe || p.skirt) robe(s, x + 1, 16, p, 0);
    else legs(s, x + 3, 21, p, g.liftA, g.liftB, 0, p.bootD);
    shade(s, x + 2, 14 + bob, 12, 8, p.clothL, p.clothD, p.clothD);
    fill(s, x + 7, 15 + bob, 2, 6, p.clothD);
    if (p.scarf) fill(s, x + 3, 13 + bob, 10, 3, p.trimD);
    if (p.belt) fill(s, x + 2, 20 + bob, 12, 2, C.belt);
    faceBack(s, x, 2 + bob, p);
    arm(s, x, 15 + bob, p, "down", p.clothD, p.clothD, false);
    arm(s, x + 9, 15 + bob, p, "down", p.cloth, p.cloth, false);
    return s;
  }

  function paint(p, dir, frame, pose) {
    var s;
    if (pose === "ko") return layDown(paintSide(p, 0, "hurt"));
    if (dir === "up") s = paintBack(p, frame, pose);
    else if (dir === "right" || dir === "left") s = paintSide(p, frame, pose);
    else s = paintFront(p, frame, pose);
    s = finish(s);
    if (dir === "left") s = Art.mirror(s);
    return s;
  }

  function portrait(p) {
    var body = paint(p, "left", 0, "idle");
    var s = Art.spr(32, 32);
    var bg = p.bg || p.clothD;
    var y, x, c, maxY, minX, maxX;
    Art.fill(s, 0, 0, 32, 32, bg);
    maxY = Math.min(body.h, 16);
    minX = body.w;
    maxX = 0;
    for (y = 0; y < maxY; y++) {
      for (x = 0; x < body.w; x++) {
        if (!body.d[y * body.w + x]) continue;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }
    var sw = maxX - minX + 1;
    var scale = sw > 0 && sw * 2 <= 30 ? 2 : 1;
    var dw = sw * scale;
    var dh = maxY * scale;
    var dx = ((32 - dw) / 2) | 0;
    var dy = ((32 - dh) / 2) | 0;
    for (y = 0; y < maxY; y++) {
      for (x = minX; x <= maxX; x++) {
        c = body.d[y * body.w + x];
        if (!c) continue;
        fill(s, dx + (x - minX) * scale, dy + y * scale, scale, scale, c);
      }
    }
    s.ax = 16;
    s.ay = 31;
    return s;
  }

  function P(o) {
    o.hairL = o.hairL || o.hair;
    o.clothL = o.clothL || o.cloth;
    o.clothD = o.clothD || o.cloth;
    o.skin = o.skin || C.skin;
    o.skinD = o.skinD || C.skinD;
    o.skinDeep = o.skinDeep || C.skinDeep;
    o.boot = o.boot || o.clothD;
    o.bootD = o.bootD || o.boot;
    o.bootL = o.bootL || o.boot;
    o.trim = o.trim || C.scarf;
    o.trimL = o.trimL || C.gold;
    o.trimD = o.trimD || C.scarfD;
    return o;
  }

  var CAST = [
    P({ id: "wayfarer", bg: C.coatD, style: "short", scarf: true, weapon: "shard",
      hair: C.hair, hairD: C.hairD, hairL: C.hairW,
      cloth: C.coat, clothD: C.coatD, clothL: C.coatL,
      boot: C.wood, bootD: C.woodD, bootL: C.woodL,
      trim: C.scarf, trimL: C.gold, trimD: C.scarfD }),
    P({ id: "kestrel", bg: C.tealD, style: "pony", scarf: true, weapon: "pistol", goggles: true, femme: true, tie: C.scarf,
      hair: C.hair, hairD: C.hairD, hairL: C.hairW,
      cloth: C.teal, clothD: C.tealD, clothL: C.tealL,
      boot: C.wood, bootD: C.tealD, bootL: C.woodL,
      trim: C.scarf, trimL: C.gold, trimD: C.scarfD }),
    P({ id: "tamsin", bg: C.vestD, style: "tail", weapon: "wrench", shirt: C.cream, belt: true, young: true, freckles: true, femme: true, tie: C.gold,
      hair: C.hairR, hairD: C.hairRD, hairL: C.emberH,
      cloth: C.vest, clothD: C.vestD, clothL: C.vestL,
      boot: C.woodL, bootD: C.woodD, bootL: C.sand }),
    P({ id: "maren", bg: C.shawlD, style: "bun", weapon: "staff", scarf: true, skirt: true, old: true,
      hair: C.hairW, hairD: C.hairWD, hairL: C.paper,
      cloth: C.shawl, clothD: C.shawlD, clothL: C.shawlL,
      boot: C.wood, bootD: C.shawlD, bootL: C.woodL,
      trim: C.gold, trimL: C.warm, trimD: C.goldD }),
    P({ id: "hesk", bg: C.robeD, style: "hood", robe: true, stole: C.stole,
      skin: C.pale, skinD: C.paleD,
      hair: C.robe, hairD: C.robeD, hairL: C.robeL,
      cloth: C.robe, clothD: C.robeD, clothL: C.robeL,
      boot: C.robeD, bootD: C.void }),
    P({ id: "ilsa", bg: C.armorD, style: "helm", weapon: "spear", armor: true,
      hair: C.hairK, hairD: C.ink, hairL: C.armorL,
      cloth: C.armor, clothD: C.armorD, clothL: C.armorL,
      metal: C.armor, plume: C.plume,
      boot: C.armorD, bootD: C.ink, bootL: C.armor }),
    P({ id: "cantor", bg: C.void, style: "mask", robe: true, nofeet: true,
      hair: C.void, hairD: C.voidD, hairL: C.voidL,
      cloth: C.void, clothD: C.voidD, clothL: C.voidL,
      mask: C.mask, hem: C.gold, trim: C.gold, trimD: C.goldD,
      boot: C.void }),
    P({ id: "villager_a", bg: C.greenD, style: "cap", cap: C.green, capD: C.greenD,
      hair: C.hair, hairD: C.hairD, hairL: C.hairW,
      cloth: C.green, clothD: C.greenD, clothL: C.leafL,
      boot: C.wood, bootD: C.woodD }),
    P({ id: "villager_b", bg: C.redD, style: "bob", skirt: true, femme: true,
      hair: C.hairK, hairD: C.ink, hairL: C.hair,
      cloth: C.red, clothD: C.redD, clothL: C.cream,
      boot: C.redD, bootD: C.woodD }),
    P({ id: "brenna", bg: C.tealD, style: "cap", cap: C.tealD, capD: C.ink, femme: true,
      hair: C.hairK, hairD: C.ink, hairL: C.hair,
      cloth: C.teal, clothD: C.tealD, clothL: C.tealL,
      boot: C.wood, bootD: C.woodD }),
    P({ id: "osric", bg: C.woodD, style: "short", apron: true, old: true, weapon: "mug",
      hair: C.hairW, hairD: C.hairWD, hairL: C.paper,
      cloth: C.vest, clothD: C.woodD, clothL: C.cream, shirt: C.cream,
      boot: C.wood, bootD: C.woodD }),
    P({ id: "nessa", bg: C.vestD, style: "pony", belt: true, femme: true, tie: C.gold,
      hair: C.hair, hairD: C.hairD, hairL: C.hairW,
      cloth: C.sand, clothD: C.woodD, clothL: C.gold, shirt: C.cream,
      boot: C.wood, bootD: C.woodD }),
    P({ id: "sera", bg: C.shawlD, style: "bob", skirt: true, femme: true, weapon: "lantern",
      skin: C.pale, skinD: C.paleD,
      hair: C.hairW, hairD: C.hairWD, hairL: C.paper,
      cloth: C.shawl, clothD: C.shawlD, clothL: C.shawlL,
      boot: C.shawlD, bootD: C.woodD }),
    P({ id: "pip", bg: C.greenD, style: "cap", cap: C.green, capD: C.greenD, young: true,
      hair: C.hairR, hairD: C.hairRD, hairL: C.emberH,
      cloth: C.green, clothD: C.greenD, clothL: C.leafL,
      boot: C.wood, bootD: C.woodD }),
    P({ id: "lark", bg: C.redD, style: "bob", skirt: true, scarf: true, young: true, femme: true,
      hair: C.hair, hairD: C.hairD, hairL: C.hairW,
      cloth: C.red, clothD: C.redD, clothL: C.cream,
      boot: C.redD, bootD: C.woodD,
      trim: C.scarf, trimL: C.gold, trimD: C.scarfD }),
    P({ id: "jory", bg: C.tideD, style: "cap", cap: C.tideD, capD: C.sea,
      skin: C.skinD, skinD: C.skinDeep,
      hair: C.hairK, hairD: C.ink, hairL: C.hair,
      cloth: C.tide, clothD: C.tideD, clothL: C.tideL,
      boot: C.wood, bootD: C.woodD }),
    P({ id: "brant", bg: C.stoneD, style: "helm", weapon: "spear", armor: true,
      hair: C.hairK, hairD: C.ink, hairL: C.stoneL,
      cloth: C.stone, clothD: C.stoneD, clothL: C.stoneL,
      metal: C.stoneL, plume: C.gold,
      boot: C.armorD, bootD: C.ink }),
    P({ id: "dorrie", bg: C.woodD, style: "bun", apron: true, skirt: true, old: true, femme: true,
      hair: C.hairWD, hairD: C.hairK, hairL: C.paper,
      cloth: C.wood, clothD: C.woodD, clothL: C.sand, shirt: C.cream,
      boot: C.wood, bootD: C.woodD }),
    P({ id: "maud", bg: C.goldD, style: "bun", apron: true, femme: true, weapon: "mug",
      hair: C.hair, hairD: C.hairD, hairL: C.gold,
      cloth: C.goldD, clothD: C.woodD, clothL: C.warm, shirt: C.cream,
      boot: C.wood, bootD: C.woodD }),
    P({ id: "ellis", bg: C.coatD, style: "short", young: true,
      hair: C.hair, hairD: C.hairD, hairL: C.hairW,
      cloth: C.coat, clothD: C.coatD, clothL: C.coatL,
      boot: C.coatD, bootD: C.woodD, bootL: C.coatL }),
    P({ id: "sile", bg: C.violetD, style: "brim", belt: true, satchel: true,
      hair: C.hairK, hairD: C.ink, hairL: C.core,
      cloth: C.violet, clothD: C.violetD, clothL: C.core,
      cap: C.violetD, capD: C.gold,
      boot: C.wood, bootD: C.woodD })
  ];

  var BY_ID = {};
  CAST.forEach(function (p) { BY_ID[p.id] = p; });

  var PARTY = { wayfarer: 1, kestrel: 1, tamsin: 1 };
  var BATTLE = { idle: 1, attack: 1, cast: 1, hurt: 1, victory: 1, ko: 1 };
  var cache = {};

  function bake(id, pose, facing, frame) {
    var p = BY_ID[id];
    var dir = facing;
    if (dir !== "down" && dir !== "up" && dir !== "left" && dir !== "right") dir = "down";
    var key = id + "|" + pose + "|" + dir + "|" + frame;
    if (!cache[key]) cache[key] = paint(p, dir, frame, pose);
    return Art.clone(cache[key]);
  }

  CAST.forEach(function (p) {
    var prev = Art._makers[p.id];
    Art.add(p.id, function (pose, facing, frame) {
      var f = frame | 0;
      if (pose === "stand") return bake(p.id, "stand", facing, ((f % 2) + 2) % 2);
      if (pose === "walk") return bake(p.id, "walk", facing, ((f % 4) + 4) % 4);
      if (PARTY[p.id] && BATTLE[pose]) {
        var face = facing === "left" ? "left" : "right";
        return bake(p.id, pose, face, pose === "idle" ? (f % 2) : (f % 2));
      }
      if (prev && pose !== "walk" && pose !== "stand") return prev(pose, facing, f);
      return bake(p.id, "walk", facing, 0);
    }, Art._scale[p.id] || 2, Art._fieldScale[p.id] || 1);
    Art.addPortrait(p.id, function () { return portrait(p); });
  });

  Art.fieldCast = {};
  CAST.forEach(function (p) { Art.fieldCast[p.id] = 1; });
  Art.fieldOrder = CAST.map(function (p) { return p.id; });
})();
