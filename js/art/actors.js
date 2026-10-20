"use strict";

// Field actors are 17×26 (front/back) or 21×26 (side). Battle poses are the
// side view with a weapon, a flinch, or a raised hand. Feet sit on the baseline.
(function () {
  var C = Art.C;
  var plot = Art.plot;
  var fill = Art.fill;

  function box(s, x, y, w, h, c, bob) {
    fill(s, x, y + (bob || 0), w, h, c);
  }

  function bootLeg(s, x, top, toeY, c, toe) {
    if (toeY <= top) return;
    fill(s, x, top, 2, toeY - top, c);
    plot(s, x + (toe || 0), toeY, c);
    plot(s, x + 1 + (toe || 0), toeY, c);
  }

  function legsDown(s, frame, boot, skirt) {
    var top = skirt ? 20 : 18;
    var ground = 23;
    if (frame === 2) {
      bootLeg(s, 7, top, ground, boot, 0);
      bootLeg(s, 9, top, ground, boot, 0);
      return;
    }
    var liftL = frame === 1 ? 0 : (frame === 3 ? 2 : 0);
    var liftR = frame === 3 ? 0 : (frame === 1 ? 2 : 0);
    var toeL = frame === 1 ? -1 : 0;
    var toeR = frame === 3 ? 1 : 0;
    bootLeg(s, 6, top, ground - liftL, boot, toeL);
    bootLeg(s, 10, top, ground - liftR, boot, toeR);
  }

  function legsSide(s, frame, boot) {
    if (frame === 0 || frame === 2) {
      fill(s, 8, 18, 3, 5, boot);
      plot(s, 10, 23, boot);
      plot(s, 11, 23, boot);
      return;
    }
    if (frame === 1) {
      fill(s, 7, 18, 2, 4, boot);
      fill(s, 11, 18, 2, 5, boot);
      plot(s, 12, 23, boot);
      plot(s, 13, 23, boot);
      return;
    }
    fill(s, 11, 18, 2, 3, boot);
    fill(s, 7, 18, 2, 5, boot);
    plot(s, 6, 23, boot);
    plot(s, 7, 23, boot);
  }

  function hairDown(s, d, bob) {
    var hair = d.hair;
    var hairD = d.hairD;
    var y = bob;
    if (d.style === "helm") {
      box(s, 4, 2, 9, 4, d.metal || C.armor, y);
      box(s, 13, 1, 2, 3, d.plume || C.plume, y);
      plot(s, 15, 2 + y, d.plume || C.plume);
      return;
    }
    if (d.style === "hood" || d.style === "mask") {
      box(s, 4, 1, 9, 4, hair, y);
      box(s, 3, 4, 2, 6, hairD, y);
      box(s, 12, 4, 2, 6, hair, y);
      return;
    }
    if (d.style === "bun") {
      box(s, 6, 2, 5, 2, hair, y);
      box(s, 7, 1, 3, 1, d.hairL || hair, y);
      box(s, 5, 3, 7, 2, hair, y);
      return;
    }
    if (d.style === "pony" || d.style === "tail") {
      box(s, 5, 2, 7, 3, hair, y);
      box(s, 12, 3, 2, 8, hair, y);
      plot(s, 14, 6 + y, d.tie || C.scarf);
      plot(s, 14, 9 + y, hairD);
      return;
    }
    if (d.style === "bob") {
      box(s, 4, 2, 9, 3, hair, y);
      box(s, 3, 5, 2, 5, hairD, y);
      box(s, 12, 5, 2, 5, hair, y);
      return;
    }
    if (d.style === "cap") {
      box(s, 4, 2, 9, 2, d.cap || d.cloth, y);
      box(s, 3, 4, 11, 1, d.capD || d.clothD, y);
      box(s, 5, 5, 7, 1, hair, y);
      return;
    }
    box(s, 5, 2, 7, 3, hair, y);
    box(s, 4, 4, 2, 3, hairD, y);
    box(s, 11, 4, 2, 3, hair, y);
  }

  function faceDown(s, d, bob) {
    var y = bob;
    if (d.style === "mask") {
      box(s, 5, 5, 7, 6, d.maskC || C.mask, y);
      box(s, 6, 7, 2, 1, C.void, y);
      box(s, 9, 7, 2, 1, C.void, y);
      plot(s, 8, 9 + y, d.maskD || C.maskD);
      plot(s, 7, 6 + y, C.hem);
      return;
    }
    box(s, 5, 5, 7, 6, d.skin, y);
    plot(s, 4, 7 + y, d.skinD);
    plot(s, 12, 7 + y, d.skin);
    if (d.goggles) {
      box(s, 5, 6, 7, 2, C.frame, y);
      plot(s, 6, 7 + y, C.lens);
      plot(s, 7, 7 + y, C.lite);
      plot(s, 9, 7 + y, C.lens);
      plot(s, 10, 7 + y, C.lite);
      plot(s, 7, 10 + y, C.lip);
      plot(s, 9, 10 + y, C.lip);
    } else {
      plot(s, 6, 7 + y, C.eye);
      plot(s, 10, 7 + y, C.eye);
      if (d.old) {
        plot(s, 6, 6 + y, d.skinD);
        plot(s, 10, 6 + y, d.skinD);
        plot(s, 6, 8 + y, d.skinD);
        plot(s, 10, 8 + y, d.skinD);
      }
    }
    plot(s, 8, 8 + y, d.skinD);
    if (d.young) {
      plot(s, 6, 9 + y, d.skinD);
      plot(s, 10, 9 + y, d.skinD);
      plot(s, 7, 10 + y, C.lip);
      plot(s, 9, 10 + y, C.lip);
    } else if (d.old) {
      plot(s, 6, 10 + y, d.skinDeep);
      plot(s, 8, 10 + y, d.skinDeep);
      plot(s, 10, 10 + y, d.skinDeep);
    } else if (!d.goggles) {
      plot(s, 7, 10 + y, d.skinD);
      plot(s, 9, 10 + y, d.skinD);
    }
  }

  function torsoDown(s, d, bob) {
    var cloth = d.cloth;
    var clothD = d.clothD;
    var clothL = d.clothL;
    var long = d.coat || d.robe || d.skirt;
    var tw = d.broad ? 11 : (d.robe ? 11 : 9);
    var tx = 8 - ((tw / 2) | 0);
    var th = long ? 7 : 5;
    box(s, tx, 12, tw, th, cloth, bob);
    box(s, tx + 1, 13, Math.max(1, tw - 3), 1, clothL, bob);
    if (d.shirt) box(s, tx + 2, 13, tw - 4, 2, d.shirt, bob);
    if (d.stole) box(s, 7, 12, 3, th, d.stole, bob);
    if (d.scarf) {
      box(s, tx, 12, tw, 2, C.scarf, bob);
      box(s, tx + tw - 2, 14, 2, 3, C.scarfD, bob);
    }
    if (d.armor) {
      box(s, tx - 1, 12, 3, 2, C.armorL, bob);
      box(s, tx + tw - 2, 12, 3, 2, C.armor, bob);
      plot(s, 8, 14 + bob, C.gold);
    }
    if (d.belt) {
      box(s, tx, 12 + th - 2, tw, 1, C.belt, bob);
      plot(s, tx + 1, 12 + th - 2 + bob, C.metal);
      plot(s, tx + 3, 12 + th - 2 + bob, C.metalD);
      plot(s, tx + tw - 3, 12 + th - 2 + bob, C.gold);
    }
    box(s, tx - 2, 13, 2, 4, d.armor ? C.armorD : clothD, bob);
    box(s, tx + tw, 13, 2, 4, d.armor ? C.armor : cloth, bob);
    if (!d.robe) {
      var hand = d.style === "mask" ? clothD : d.skin;
      box(s, tx - 2, 17, 2, 1, hand, bob);
      box(s, tx + tw, 17, 2, 1, hand, bob);
    }
    if (d.core) {
      plot(s, 8, 15 + bob, d.core);
      plot(s, 7, 15 + bob, d.coreD || C.violetD);
      plot(s, 9, 15 + bob, d.core);
    }
    if (d.shard) {
      var hx = tx + tw;
      plot(s, hx, 16 + bob, C.shardH);
      plot(s, hx + 1, 16 + bob, C.shard);
      plot(s, hx, 17 + bob, C.shard);
      plot(s, hx + 1, 17 + bob, C.shardD);
    }
    if (d.wrench) {
      var wx = tx + tw;
      plot(s, wx, 16 + bob, C.metal);
      plot(s, wx, 17 + bob, C.metalD);
      plot(s, wx - 1, 18 + bob, C.metal);
      plot(s, wx + 1, 18 + bob, C.metal);
    }
    if (d.knife) {
      plot(s, tx + tw, 16 + bob, C.metalL || C.metal);
      plot(s, tx + tw + 1, 17 + bob, C.metal);
    }
    return { tx: tx, tw: tw, th: th };
  }

  function paintDown(d, frame) {
    var s = Art.spr(17, 26);
    var bob = (frame === 1 || frame === 3) ? -1 : 0;
    hairDown(s, d, bob);
    faceDown(s, d, bob);
    if (d.style !== "mask") box(s, 7, 11, 3, 1, d.skinD, bob);
    else box(s, 7, 11, 3, 1, d.maskC || C.mask, bob);
    torsoDown(s, d, bob);
    if (d.robe && d.nofeet) {
      box(s, 3, 18, 11, 5, d.cloth, 0);
      box(s, 4, 22, 9, 1, d.clothD, 0);
      box(s, 3, 23, 11, 1, d.hem || C.hem, 0);
    } else if (d.robe || d.skirt) {
      box(s, 4, 17, 9, 4, d.cloth, 0);
      box(s, 4, 20, 9, 1, d.clothD, 0);
      if (d.hem) box(s, 4, 21, 9, 1, d.hem, 0);
      legsDown(s, frame, d.boot || d.clothD, true);
    } else {
      legsDown(s, frame, d.boot || d.clothD, false);
    }
    if (d.staff) {
      fill(s, 15, 6, 1, 17, C.wood);
      fill(s, 14, 4, 3, 3, C.gold);
      plot(s, 15, 5, C.shardH);
    }
    if (d.spear) {
      fill(s, 15, 4, 1, 18, C.metalD);
      plot(s, 14, 3, C.armorL);
      plot(s, 15, 3, C.metal);
      plot(s, 16, 3, C.armorL);
    }
    s.ax = 8;
    s.ay = 24;
    return s;
  }

  function paintUp(d, frame) {
    var s = Art.spr(17, 26);
    var bob = (frame === 1 || frame === 3) ? -1 : 0;
    var hair = d.hair;
    var hairD = d.hairD;
    if (d.style === "helm") {
      box(s, 4, 2, 9, 6, d.metal || C.armorD, bob);
      box(s, 13, 1, 2, 3, d.plume || C.plume, bob);
    } else if (d.style === "hood" || d.style === "mask") {
      box(s, 4, 1, 9, 8, hair, bob);
      box(s, 3, 4, 2, 6, hairD, bob);
      box(s, 12, 4, 2, 6, hair, bob);
    } else if (d.style === "bun") {
      box(s, 6, 0, 5, 2, hair, bob);
      box(s, 4, 2, 9, 6, hairD, bob);
    } else if (d.style === "pony" || d.style === "tail") {
      box(s, 4, 2, 9, 5, hair, bob);
      box(s, 7, 7, 3, 6, hairD, bob);
      plot(s, 8, 8 + bob, d.tie || C.scarf);
    } else if (d.style === "bob") {
      box(s, 3, 2, 11, 8, hair, bob);
    } else if (d.style === "cap") {
      box(s, 4, 2, 9, 3, d.cap || d.cloth, bob);
      box(s, 3, 4, 11, 1, d.capD || d.clothD, bob);
      box(s, 4, 5, 9, 3, hair, bob);
    } else {
      box(s, 4, 2, 9, 6, hair, bob);
      box(s, 5, 7, 7, 2, hairD, bob);
    }
    var tw = d.broad || d.robe ? 11 : 9;
    var tx = 8 - ((tw / 2) | 0);
    var th = (d.coat || d.robe || d.skirt) ? 7 : 5;
    box(s, tx, 12, tw, th, d.clothD, bob);
    box(s, tx + 2, 13, tw - 4, th - 2, d.cloth, bob);
    if (d.stole) box(s, 7, 12, 3, th, d.stole, bob);
    if (d.scarf) box(s, tx + 1, 12, tw - 2, 2, C.scarf, bob);
    if (d.belt) box(s, tx, 12 + th - 2, tw, 1, C.belt, bob);
    box(s, tx - 2, 13, 2, 4, d.clothD, bob);
    box(s, tx + tw, 13, 2, 4, d.cloth, bob);
    if (d.shard) {
      plot(s, tx + tw, 16 + bob, C.shardH);
      plot(s, tx + tw + 1, 17 + bob, C.shard);
    }
    if (d.robe && d.nofeet) {
      box(s, 3, 18, 11, 5, d.clothD, 0);
      box(s, 3, 23, 11, 1, d.hem || C.hem, 0);
    } else if (d.skirt || d.robe) {
      box(s, 4, 17, 9, 4, d.clothD, 0);
      legsDown(s, frame, d.boot || d.clothD, true);
    } else {
      legsDown(s, frame, d.boot || d.clothD, false);
    }
    if (d.staff) {
      fill(s, 1, 6, 1, 17, C.wood);
      fill(s, 0, 4, 3, 3, C.gold);
      plot(s, 1, 5, C.shardH);
    }
    s.ax = 8;
    s.ay = 24;
    return s;
  }

  function paintSide(d, frame) {
    var s = Art.spr(21, 26);
    var bob = (frame === 1 || frame === 3) ? -1 : 0;
    var hair = d.hair;
    var hairD = d.hairD;
    if (d.style === "pony" || d.style === "tail") {
      box(s, 1, 5, 3, 8, hair, bob);
      plot(s, 2, 6 + bob, d.tie || C.scarf);
    } else if (d.style === "bun") {
      box(s, 4, 1, 4, 2, hair, bob);
    } else if (d.style === "bob") {
      box(s, 3, 4, 3, 7, hairD, bob);
    }
    if (d.style === "helm") {
      box(s, 5, 2, 8, 5, d.metal || C.armor, bob);
      box(s, 3, 3, 3, 3, d.plume || C.plume, bob);
      box(s, 6, 6, 6, 3, d.metalD || C.armorD, bob);
    } else if (d.style === "hood" || d.style === "mask") {
      box(s, 4, 2, 9, 5, hair, bob);
      box(s, 3, 6, 3, 5, hairD, bob);
    } else if (d.style === "cap") {
      box(s, 5, 2, 8, 2, d.cap || d.cloth, bob);
      box(s, 4, 4, 10, 1, d.capD || d.clothD, bob);
      box(s, 6, 5, 6, 2, hair, bob);
    } else {
      box(s, 5, 2, 7, 4, hair, bob);
      box(s, 4, 5, 2, 3, hairD, bob);
    }
    if (d.style === "mask") {
      box(s, 7, 6, 6, 6, d.maskC || C.mask, bob);
      plot(s, 12, 8 + bob, d.maskC || C.mask);
      box(s, 9, 8, 2, 1, C.void, bob);
      plot(s, 11, 9 + bob, C.hem);
    } else {
      box(s, 7, 6, 5, 6, d.skin, bob);
      plot(s, 12, 8 + bob, d.skin);
      plot(s, 13, 9 + bob, d.skinD);
      if (d.goggles) {
        box(s, 8, 7, 5, 2, C.frame, bob);
        plot(s, 10, 8 + bob, C.lens);
        plot(s, 11, 8 + bob, C.lite);
      } else {
        plot(s, 10, 8 + bob, C.eye);
        if (d.old) plot(s, 10, 9 + bob, d.skinD);
      }
      plot(s, 11, 11 + bob, d.young ? C.lip : d.skinD);
    }
    var th = (d.coat || d.robe) ? 7 : 6;
    box(s, 6, 12, 7, th, d.cloth, bob);
    box(s, 7, 13, 4, 1, d.clothL, bob);
    if (d.shirt) box(s, 8, 13, 3, 2, d.shirt, bob);
    if (d.scarf) {
      box(s, 6, 12, 6, 2, C.scarf, bob);
      box(s, 3, 13, 3, 2, C.scarfD, bob);
    }
    if (d.coat) box(s, 4, 16, 3, 4, d.clothD, bob);
    if (d.armor) {
      box(s, 5, 12, 3, 3, C.armorL, bob);
      plot(s, 9, 15 + bob, C.gold);
    }
    if (d.belt) {
      box(s, 6, 16, 6, 1, C.belt, bob);
      plot(s, 8, 16 + bob, C.metal);
      plot(s, 10, 16 + bob, C.gold);
    }
    if (d.stole) box(s, 8, 12, 2, th, d.stole, bob);
    box(s, 11, 13, 3, 3, d.armor ? C.armor : d.clothD, bob);
    if (d.style !== "mask") box(s, 13, 16, 2, 2, d.skin, bob);
    else box(s, 13, 16, 2, 2, d.clothD, bob);
    if (d.core) {
      plot(s, 9, 15 + bob, d.core);
      plot(s, 10, 15 + bob, d.coreD || C.violet);
    }
    if (d.shard) {
      plot(s, 15, 15 + bob, C.shardH);
      plot(s, 16, 16 + bob, C.shard);
      plot(s, 15, 17 + bob, C.shardD);
      plot(s, 16, 15 + bob, C.shard);
    }
    if (d.wrench) {
      plot(s, 15, 15 + bob, C.metal);
      plot(s, 15, 16 + bob, C.metalD);
      plot(s, 14, 17 + bob, C.metal);
      plot(s, 16, 17 + bob, C.metal);
    }
    if (d.knife) {
      plot(s, 15, 16 + bob, C.metal);
      plot(s, 16, 16 + bob, C.lite);
    }
    if (d.robe && d.nofeet) {
      box(s, 5, 17, 8, 6, d.cloth, 0);
      box(s, 5, 22, 8, 1, d.clothD, 0);
      box(s, 4, 23, 10, 1, d.hem || C.hem, 0);
    } else if (d.robe || d.skirt) {
      box(s, 6, 16, 7, 4, d.cloth, 0);
      legsSide(s, frame, d.boot || d.clothD);
    } else {
      legsSide(s, frame, d.boot || d.clothD);
    }
    if (d.staff) {
      fill(s, 16, 5, 1, 18, C.wood);
      fill(s, 15, 3, 3, 3, C.gold);
      plot(s, 16, 4, C.shardH);
    }
    if (d.spear) {
      fill(s, 17, 3, 1, 18, C.metalD);
      plot(s, 16, 2, C.armorL);
      plot(s, 17, 2, C.metal);
      plot(s, 18, 2, C.armorL);
    }
    s.ax = 10;
    s.ay = 24;
    return s;
  }

  function recolor(s, from, to) {
    var i;
    for (i = 0; i < s.d.length; i++) if (s.d[i] === from) s.d[i] = to;
  }

  function weapon(s, d, attack) {
    if (d.shard) {
      fill(s, 15, 12, 2, 2, C.shardH);
      plot(s, 17, 13, C.shard);
      if (attack) {
        fill(s, 16, 11, 4, 2, C.shard);
        plot(s, 19, 10, C.shardH);
        plot(s, 18, 12, C.lite);
      }
    } else if (d.pistol) {
      fill(s, 14, 14, attack ? 6 : 3, 2, C.metalD);
      plot(s, 14, 13, C.wood);
      plot(s, 16, 14, C.metal);
      if (attack) plot(s, 20, 14, C.warm);
    } else if (d.wrench) {
      fill(s, 15, 12, 1, 5, C.metalD);
      plot(s, 14, 16, C.metal);
      plot(s, 16, 16, C.metal);
      if (attack) {
        fill(s, 16, 11, 4, 1, C.metal);
        fill(s, 16, 14, 4, 1, C.metal);
      }
    } else if (d.staff) {
      fill(s, 16, 3, 1, 18, C.wood);
      fill(s, 15, 2, 3, 3, C.gold);
      plot(s, 16, 3, C.shardH);
      if (attack) fill(s, 17, 8, 3, 1, C.gold);
    } else if (d.spear) {
      fill(s, 17, 4, 1, 14, C.metalD);
      fill(s, 16, 3, 3, 2, C.armorL);
      if (attack) fill(s, 18, 6, 2, 1, C.metal);
    } else if (d.knife) {
      fill(s, 15, 14, attack ? 5 : 3, 1, C.metal);
      plot(s, 14, 15, C.woodD);
      if (attack) plot(s, 20, 14, C.lite);
    } else if (d.core) {
      plot(s, 18, 12, d.core);
      plot(s, 19, 13, C.lite);
    }
  }

  function battleOf(d, pose, frame) {
    var s = paintSide(d, 0);
    if (pose === "idle") {
      if ((frame % 2) === 1) s = Art.shift(s, 0, -1);
      return s;
    }
    if (pose === "hurt") {
      s = Art.shift(s, -2, 1);
      recolor(s, C.eye, d.skin || C.skin);
      recolor(s, C.shardH, C.shardD);
      return s;
    }
    if (pose === "attack") {
      s = Art.shift(s, frame % 2 ? 2 : 1, 0);
      weapon(s, d, true);
      return s;
    }
    if (pose === "cast") {
      weapon(s, d, false);
      var spark = d.cast || (d.shard ? C.shardH : (d.core || C.gold));
      plot(s, 14, 2, spark);
      plot(s, 15, 3, spark);
      plot(s, 13, 3, d.castD || C.shard);
      plot(s, 16, 4, spark);
      plot(s, 14, 4, C.lite);
      return s;
    }
    return s;
  }

  function person(d, scale, fieldScale) {
    var cache = {};
    function bake(dir, frame) {
      var k = "f|" + dir + "|" + frame;
      if (cache[k]) return cache[k];
      var s;
      if (dir === "up") s = paintUp(d, frame);
      else if (dir === "right") s = paintSide(d, frame);
      else if (dir === "left") s = Art.mirror(paintSide(d, frame));
      else s = paintDown(d, frame);
      Art.outline(s);
      cache[k] = s;
      return s;
    }
    function bakeBattle(pose, facing, frame) {
      var k = "b|" + pose + "|" + facing + "|" + frame;
      if (cache[k]) return cache[k];
      var s = battleOf(d, pose, frame);
      Art.outline(s);
      if (d.shard) {
        // Keep the shard brighter than the outline that grew around it.
        var i;
        for (i = 0; i < s.d.length; i++) if (s.d[i] === C.shard) s.d[i] = C.shard;
      }
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
    }, scale, fieldScale);
    Art.addPortrait(d.id, function () { return portrait(d); });
  }

  function portrait(d) {
    var s = Art.spr(32, 32);
    fill(s, 0, 0, 32, 32, d.bg || C.coatD);
    fill(s, 2, 22, 28, 10, d.clothD);
    fill(s, 6, 23, 20, 8, d.cloth);
    fill(s, 8, 23, 16, 3, d.clothL);
    if (d.scarf) fill(s, 8, 22, 16, 3, C.scarf);
    if (d.armor) {
      fill(s, 2, 22, 8, 4, C.armor);
      fill(s, 22, 22, 8, 4, C.armorL);
      plot(s, 16, 26, C.gold);
      plot(s, 16, 27, C.goldD);
    }
    if (d.belt) {
      fill(s, 8, 28, 16, 2, C.belt);
      plot(s, 12, 28, C.metal);
      plot(s, 18, 28, C.gold);
      plot(s, 20, 29, C.metalD);
    }
    if (d.stole) fill(s, 13, 23, 6, 8, d.stole);
    fill(s, 13, 20, 6, 4, d.style === "mask" ? (d.maskC || C.mask) : d.skinD);
    if (d.style === "mask") {
      fill(s, 8, 6, 16, 16, d.hair);
      fill(s, 10, 8, 12, 14, d.maskC || C.mask);
      fill(s, 12, 13, 3, 2, C.void);
      fill(s, 18, 13, 3, 2, C.void);
      plot(s, 16, 9, C.hem);
      plot(s, 17, 11, C.hem);
      plot(s, 16, 13, C.hem);
      plot(s, 15, 16, C.hem);
      plot(s, 16, 18, C.hem);
      fill(s, 10, 29, 12, 2, d.hem || C.hem);
    } else {
      fill(s, 8, 5, 16, 14, d.hair);
      if (d.style === "bun") {
        fill(s, 11, 2, 10, 4, d.hair);
        fill(s, 13, 1, 6, 2, d.hairL || d.hair);
      } else if (d.style === "pony" || d.style === "tail") {
        fill(s, 22, 8, 6, 12, d.hair);
        plot(s, 24, 10, d.tie || C.scarf);
      } else if (d.style === "bob") {
        fill(s, 6, 8, 4, 10, d.hairD);
        fill(s, 22, 8, 4, 10, d.hair);
      } else if (d.style === "hood") {
        fill(s, 6, 4, 20, 8, d.hair);
        fill(s, 5, 10, 4, 8, d.hairD);
        fill(s, 23, 10, 4, 8, d.hair);
      } else if (d.style === "helm") {
        fill(s, 7, 4, 18, 6, d.metal || C.armor);
        fill(s, 24, 3, 4, 6, d.plume || C.plume);
        fill(s, 8, 8, 16, 3, d.metalD || C.armorD);
      } else if (d.style === "cap") {
        fill(s, 7, 4, 18, 4, d.cap || d.cloth);
        fill(s, 6, 8, 20, 2, d.capD || d.clothD);
      }
      fill(s, 10, 9, 12, 12, d.skin);
      fill(s, 9, 12, 2, 6, d.skinD);
      fill(s, 21, 12, 2, 5, d.skin);
      if (d.femme) {
        plot(s, 10, 19, d.hair);
        plot(s, 21, 19, d.hair);
      }
      if (d.goggles) {
        fill(s, 10, 13, 12, 4, C.frame);
        fill(s, 11, 14, 4, 2, C.lens);
        fill(s, 17, 14, 4, 2, C.lens);
        plot(s, 12, 14, C.white);
        plot(s, 18, 14, C.white);
      } else {
        fill(s, 11, 13, 4, 3, C.white);
        fill(s, 17, 13, 4, 3, C.white);
        fill(s, 13, 14, 2, 2, C.eye);
        fill(s, 18, 14, 2, 2, C.eye);
        plot(s, 12, 13, C.white);
        plot(s, 17, 13, C.white);
        if (d.stern) {
          fill(s, 11, 12, 4, 1, d.hairD);
          fill(s, 17, 12, 4, 1, d.hairD);
        } else if (d.worried) {
          plot(s, 11, 12, d.hair);
          plot(s, 14, 13, d.hair);
          plot(s, 20, 12, d.hair);
          plot(s, 17, 13, d.hair);
        }
      }
      plot(s, 16, 17, d.skinD);
      if (d.old) {
        plot(s, 12, 15, d.skinD);
        plot(s, 19, 15, d.skinD);
        plot(s, 12, 18, d.skinDeep);
        plot(s, 19, 18, d.skinDeep);
        fill(s, 14, 20, 4, 1, d.skinDeep);
        plot(s, 27, 14, C.gold);
      } else if (d.young) {
        plot(s, 12, 17, d.skinD);
        plot(s, 19, 17, d.skinD);
        plot(s, 16, 18, d.skinD);
        plot(s, 14, 20, C.lip);
        plot(s, 15, 21, C.lip);
        plot(s, 16, 21, C.lip);
        plot(s, 17, 20, C.lip);
      } else if (!d.goggles) {
        fill(s, 14, 20, 4, 1, C.lip);
      } else {
        fill(s, 14, 20, 4, 1, C.lip);
      }
    }
    if (d.shard) {
      plot(s, 26, 25, C.shardD);
      plot(s, 27, 26, C.shard);
      plot(s, 26, 27, C.shardH);
      plot(s, 25, 26, C.shard);
    }
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
    hem: C.hem, robe: true, nofeet: true
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

  function disc(s, cx, cy, r, c) {
    var y, x;
    for (y = -r; y <= r; y++) {
      for (x = -r; x <= r; x++) {
        if (x * x + y * y <= r * r + (r > 2 ? r : 0)) plot(s, cx + x, cy + y, c);
      }
    }
  }

  function puff(pose, frame, body, lite, hot, dark) {
    var s = Art.spr(16, 16);
    var bob = (pose === "hurt") ? 1 : ((frame % 2) ? -1 : 0);
    var squash = pose === "hurt" ? 1 : 0;
    disc(s, 8, 8 + bob, 5 - squash, body);
    disc(s, 5, 10 + bob, 3, dark);
    disc(s, 11, 8 + (frame > 1 ? 1 : 0), 3, lite);
    if (pose === "attack" || pose === "cast") disc(s, 8, 8 + bob, 3, hot);
    Art.outline(s);
    var core = pose === "hurt" ? dark : hot;
    fill(s, 7, 7 + bob, 2, 2, core);
    if (pose !== "hurt") plot(s, 7, 7 + bob, C.lite);
    s.ax = 8;
    s.ay = 14;
    return s;
  }

  function floater(id, body, lite, hot, dark, scale, field) {
    Art.add(id, function (pose, facing, frame) {
      var s = puff(pose, frame, body, lite, hot, dark);
      if (facing === "left") s = Art.mirror(s);
      return s;
    }, scale, field);
  }

  floater("wisp", C.violet, C.core, C.lite, C.violetD, 2, 2);
  floater("saltwisp", C.tide, C.tideL, C.foam, C.tideD, 2, 2);

  function brume(pose, facing, frame) {
    var s = Art.spr(24, 22);
    var bob = (frame % 2) ? -1 : 0;
    if (pose === "hurt") bob = 1;
    disc(s, 12, 12 + bob, 7, C.hushD);
    disc(s, 12, 13 + bob, 5, C.hush);
    fill(s, 6, 6 + bob, 2, 5, C.goldD);
    fill(s, 16, 6 + bob, 2, 5, C.gold);
    plot(s, 6, 5 + bob, C.gold);
    plot(s, 17, 5 + bob, C.gold);
    if (facing !== "up") {
      plot(s, 9, 11 + bob, C.eye);
      plot(s, 14, 11 + bob, C.eye);
    }
    var core = pose === "hurt" ? C.goldD : (pose === "attack" || pose === "cast" ? C.emberH : C.ember);
    disc(s, 12, 14 + bob, pose === "attack" ? 3 : 2, core);
    fill(s, 8, 18, 3, 3, C.hushD);
    fill(s, 14, 18, 3, 3, C.void);
    if (pose === "attack") {
      fill(s, 18, 12, 5, 3, C.gold);
      plot(s, 22, 13, C.emberH);
    }
    if (pose === "cast") {
      plot(s, 12, 4, C.emberH);
      plot(s, 11, 5, C.ember);
      plot(s, 13, 5, C.gold);
    }
    Art.outline(s);
    s.ax = 12;
    s.ay = 20;
    if (facing === "left") s = Art.mirror(s);
    return s;
  }
  Art.add("brumekin", function (pose, facing, frame) {
    return brume(pose, facing, frame);
  }, 2, 2);

  function ashling(pose, facing, frame) {
    var s = Art.spr(16, 14);
    var bob = (frame % 2) ? -1 : 0;
    disc(s, 8, 8 + bob, 4, pose === "hurt" ? C.ashD : C.ash);
    disc(s, 5, 9 + bob, 2, C.ashD);
    disc(s, 11, 8 + bob, 2, C.rock);
    plot(s, 6, 7 + bob, pose === "hurt" ? C.ashD : C.ember);
    plot(s, 10, 7 + bob, pose === "hurt" ? C.ashD : C.emberH);
    fill(s, 5, 11, 2, 2, C.ashD);
    fill(s, 9, 11, 2, frame === 1 ? 1 : 2, C.rock);
    if (pose === "attack") fill(s, 12, 8, 3, 2, C.ember);
    if (pose === "cast") plot(s, 8, 3, C.emberH);
    Art.outline(s);
    s.ax = 8;
    s.ay = 12;
    if (facing === "left") s = Art.mirror(s);
    return s;
  }
  Art.add("ashling", function (pose, facing, frame) { return ashling(pose, facing, frame); }, 2, 2);
  Art.add("sootwing", function (pose, facing, frame) {
    var s = Art.spr(22, 14);
    var flap = (pose === "attack" || frame % 2) ? -2 : 1;
    if (Art.calm() && pose === "walk") flap = 0;
    disc(s, 11, 8, 3, C.ashD);
    fill(s, 8, 7, 8, 3, C.ash);
    plot(s, 15, 8, C.emberH);
    fill(s, 4, 6 + flap, 6, 2, C.rock);
    fill(s, 14, 5 + flap, 6, 2, C.ashD);
    fill(s, 2, 7 + flap, 3, 1, C.ash);
    if (pose === "hurt") fill(s, 6, 9, 10, 2, C.ashD);
    if (pose === "cast" || pose === "attack") plot(s, 16, 6, C.ember);
    Art.outline(s);
    s.ax = 11;
    s.ay = 12;
    if (facing === "left") s = Art.mirror(s);
    return s;
  }, 2, 2);

  function hound(pose, facing, frame) {
    var s = Art.spr(28, 18);
    var bob = pose === "hurt" ? 1 : ((frame % 2) ? -1 : 0);
    disc(s, 12, 10 + bob, 5, C.rock);
    fill(s, 6, 8 + bob, 14, 5, C.ashD);
    fill(s, 16, 9 + bob, 6, 4, C.ash);
    fill(s, 8, 6 + bob, 8, 2, pose === "hurt" ? C.ashD : C.ember);
    plot(s, 20, 10 + bob, pose === "hurt" ? C.ashD : C.emberH);
    plot(s, 21, 11 + bob, C.eye);
    fill(s, 4, 8 + bob, 3, 2, C.ember);
    fill(s, 7, 14, 2, frame === 1 ? 2 : 3, C.void);
    fill(s, 12, 14, 2, frame === 3 ? 2 : 3, C.void);
    fill(s, 16, 14, 2, 3, C.rock);
    if (pose === "attack") {
      fill(s, 21, 10, 5, 2, C.tooth);
      plot(s, 25, 11, C.emberH);
    }
    if (pose === "cast") plot(s, 14, 4, C.emberH);
    Art.outline(s);
    s.ax = 14;
    s.ay = 16;
    if (facing === "up") fill(s, 18, 9, 4, 3, C.ashD);
    if (facing === "left") s = Art.mirror(s);
    return s;
  }
  Art.add("cinderhound", function (pose, facing, frame) { return hound(pose, facing, frame); }, 2, 2);

  function maw(pose, facing, frame) {
    var s = Art.spr(48, 36);
    var shut = pose === "idle" || pose === "hurt";
    disc(s, 24, 20, 14, pose === "hurt" ? C.rock : C.ashD);
    disc(s, 16, 16, 6, C.rock);
    disc(s, 34, 16, 5, C.ash);
    fill(s, 12, 18, 24, shut ? 6 : 10, C.void);
    var i;
    for (i = 0; i < 6; i++) {
      plot(s, 14 + i * 3, 18, C.tooth);
      plot(s, 15 + i * 3, shut ? 22 : 26, C.bone);
    }
    var r = pose === "cast" ? 5 : (pose === "hurt" || pose === "idle" ? 2 : 3);
    disc(s, 24, shut ? 21 : 23, r, pose === "hurt" ? C.goldD : C.emberH);
    plot(s, 24, shut ? 21 : 23, C.lite);
    fill(s, 10, 30, 6, 4, C.rock);
    fill(s, 32, 30, 6, 4, C.ashD);
    if (pose === "attack") fill(s, 38, 18, 8, 4, C.ember);
    if ((frame % 2) && pose === "walk") plot(s, 24, 22, C.warm);
    Art.outline(s);
    s.ax = 24;
    s.ay = 34;
    if (facing === "left") s = Art.mirror(s);
    return s;
  }
  Art.add("cinder_maw", function (pose, facing, frame) { return maw(pose, facing, frame); }, 2, 1);

  function gull(pose, facing, frame) {
    var s = Art.spr(26, 16);
    var flap = 0;
    if (!(Art.calm() && pose === "walk")) flap = (frame % 2 || pose === "attack") ? -3 : 2;
    if (pose === "hurt") flap = 3;
    fill(s, 10, 7, 8, 4, C.stoneL);
    fill(s, 16, 8, 5, 2, C.gold);
    plot(s, 21, 8, C.goldD);
    plot(s, 12, 8, C.eye);
    fill(s, 2, 6 + flap, 10, 2, C.stone);
    fill(s, 14, 5 + flap, 8, 2, C.cloud);
    fill(s, 0, 7 + flap, 3, 1, C.stoneL);
    fill(s, 8, 12, 2, 2, C.goldD);
    if (pose === "cast") plot(s, 18, 4, C.lite);
    Art.outline(s);
    s.ax = 13;
    s.ay = 14;
    if (facing === "left") s = Art.mirror(s);
    return s;
  }
  Art.add("stormgull", function (pose, facing, frame) { return gull(pose, facing, frame); }, 2, 2);

  function wyrm(pose, facing, frame) {
    var s = Art.spr(56, 32);
    var phase = (frame % 2) ? 1 : 0;
    if (pose === "hurt") phase = 0;
    var i, x, y;
    for (i = 0; i < 7; i++) {
      x = 6 + i * 7;
      y = 16 + (((i + phase) % 2) ? -3 : 3);
      disc(s, x, y, 4, i % 2 ? C.tide : C.tideD);
      plot(s, x, y - 3, C.tideL);
    }
    disc(s, 48, 12, 6, C.sea);
    fill(s, 50, 8, 3, 4, C.bone);
    plot(s, 46, 12, pose === "hurt" ? C.tideD : C.eye);
    plot(s, 44, 14, C.tooth);
    var core = pose === "hurt" ? C.goldD : C.foam;
    disc(s, 20, 16, pose === "cast" ? 3 : 2, core);
    if (pose === "attack") fill(s, 50, 14, 5, 2, C.tooth);
    if (pose === "cast") plot(s, 20, 10, C.lite);
    Art.outline(s);
    s.ax = 28;
    s.ay = 28;
    if (facing === "left") s = Art.mirror(s);
    return s;
  }
  Art.add("tidewyrm", function (pose, facing, frame) { return wyrm(pose, facing, frame); }, 2, 1);

  function sentinel(pose, facing, frame) {
    var s = Art.spr(20, 32);
    var bob = (pose === "walk" && frame % 2) ? -1 : 0;
    if (pose === "hurt") bob = 1;
    fill(s, 6, 10 + bob, 8, 16, C.stone);
    fill(s, 7, 12 + bob, 6, 12, C.stoneD);
    fill(s, 4, 14 + bob, 3, 6, C.stoneL);
    fill(s, 13, 14 + bob, 3, 6, C.armor);
    fill(s, 5, 2 + bob, 10, 8, C.stoneL);
    fill(s, 7, 4 + bob, 6, 4, pose === "hurt" ? C.stoneD : C.hush);
    plot(s, 9, 5 + bob, pose === "hurt" ? C.stoneD : C.lite);
    plot(s, 11, 5 + bob, pose === "hurt" ? C.stoneD : C.shardH);
    fill(s, 8, 26, 4, 4, C.stoneD);
    if (pose === "attack") fill(s, 15, 16, 4, 2, C.gold);
    if (pose === "cast") {
      plot(s, 10, 1, C.shardH);
      plot(s, 9, 2, C.shard);
    }
    Art.outline(s);
    s.ax = 10;
    s.ay = 30;
    if (facing === "left") s = Art.mirror(s);
    return s;
  }
  Art.add("sentinel", function (pose, facing, frame) { return sentinel(pose, facing, frame); }, 2, 2);

  function badge(bg, draw) {
    var s = Art.spr(32, 32);
    fill(s, 0, 0, 32, 32, bg);
    draw(s);
    Art.outline(s);
    s.ax = 16;
    s.ay = 31;
    return s;
  }

  Art.addPortrait("maw", function () {
    return badge(C.rock, function (s) {
      disc(s, 16, 18, 10, C.ashD);
      fill(s, 8, 16, 16, 8, C.void);
      fill(s, 10, 14, 2, 3, C.tooth);
      fill(s, 14, 14, 2, 3, C.tooth);
      fill(s, 18, 14, 2, 3, C.tooth);
      fill(s, 20, 14, 2, 3, C.bone);
      disc(s, 16, 20, 3, C.emberH);
      plot(s, 16, 20, C.lite);
    });
  });

  Art.addPortrait("unknown", function () {
    return badge(C.winD, function (s) {
      plot(s, 16, 6, C.shardH);
      plot(s, 12, 16, C.shard);
      plot(s, 16, 26, C.shardH);
      plot(s, 20, 16, C.shard);
      plot(s, 16, 16, C.lite);
    });
  });

  function iconPortrait(id, bg, draw) {
    Art.addPortrait(id, function () { return badge(bg, draw); });
  }

  iconPortrait("stones", C.stoneD, function (s) {
    fill(s, 6, 14, 4, 12, C.stone);
    fill(s, 13, 8, 5, 18, C.stoneL);
    fill(s, 21, 12, 4, 14, C.stone);
    fill(s, 14, 8, 2, 6, C.paper);
  });
  iconPortrait("lamp", C.winD, function (s) {
    fill(s, 14, 16, 4, 12, C.wood);
    fill(s, 10, 26, 12, 3, C.stone);
    plot(s, 16, 8, C.gold);
    plot(s, 14, 12, C.warm);
    plot(s, 16, 12, C.lite);
    plot(s, 18, 12, C.gold);
    plot(s, 16, 14, C.goldD);
  });
  iconPortrait("ship", C.tideD, function (s) {
    fill(s, 6, 18, 20, 6, C.wood);
    fill(s, 8, 22, 16, 3, C.woodD);
    fill(s, 15, 8, 2, 12, C.woodD);
    plot(s, 17, 10, C.shardH);
    plot(s, 20, 14, C.paper);
    plot(s, 22, 16, C.shard);
    plot(s, 17, 16, C.paper);
  });
  iconPortrait("scar", C.cliffX, function (s) {
    fill(s, 4, 20, 24, 6, C.cliff);
    plot(s, 8, 18, C.violet);
    plot(s, 12, 14, C.core);
    plot(s, 16, 18, C.violetD);
    plot(s, 22, 12, C.hushL);
  });
  iconPortrait("core", C.rock, function (s) {
    disc(s, 16, 16, 8, C.ember);
    disc(s, 16, 16, 4, C.emberH);
    plot(s, 16, 16, C.lite);
  });
  iconPortrait("sign", C.woodD, function (s) {
    fill(s, 8, 6, 16, 12, C.woodL);
    fill(s, 15, 18, 2, 10, C.wood);
    fill(s, 10, 9, 10, 1, C.woodD);
    fill(s, 10, 12, 8, 1, C.woodD);
  });
  iconPortrait("crate", C.wood, function (s) {
    fill(s, 6, 10, 20, 16, C.woodL);
    fill(s, 6, 10, 20, 4, C.wood);
    fill(s, 14, 8, 4, 18, C.woodD);
  });
  iconPortrait("ash", C.ashD, function (s) {
    disc(s, 10, 18, 3, C.ash);
    disc(s, 16, 14, 2, C.ember);
    disc(s, 22, 20, 3, C.rock);
  });
  iconPortrait("blossom", C.hushD, function (s) {
    plot(s, 16, 10, C.bloom);
    plot(s, 13, 14, C.bloom);
    plot(s, 19, 14, C.bloom);
    plot(s, 12, 18, C.bloom);
    plot(s, 20, 18, C.bloom);
    plot(s, 16, 16, C.gold);
    fill(s, 16, 20, 1, 6, C.leaf);
  });
  iconPortrait("bridge", C.woodD, function (s) {
    fill(s, 6, 8, 3, 16, C.wood);
    fill(s, 23, 8, 3, 16, C.wood);
    fill(s, 8, 18, 16, 2, C.woodL);
    fill(s, 8, 22, 16, 2, C.woodL);
  });
  iconPortrait("vault", C.rock, function (s) {
    fill(s, 8, 14, 16, 12, C.stoneD);
    fill(s, 10, 8, 12, 8, C.stone);
    plot(s, 16, 18, C.emberH);
  });
  iconPortrait("bell", C.stoneD, function (s) {
    fill(s, 12, 8, 8, 10, C.gold);
    fill(s, 10, 16, 12, 3, C.goldD);
    plot(s, 16, 22, C.gold);
    fill(s, 16, 4, 1, 4, C.wood);
  });
  iconPortrait("hush", C.hushD, function (s) {
    disc(s, 10, 16, 5, C.hush);
    disc(s, 18, 14, 6, C.hushL);
    disc(s, 16, 20, 4, C.hushP);
    plot(s, 16, 8, C.lite);
    plot(s, 20, 6, C.shard);
  });
})();
