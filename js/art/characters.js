"use strict";

// Field sprites for the Act 1 cast, plus battle poses for the party
// (Wayfarer, Kestrel, Tamsin). Field walk is about 20×28. Battle frames
// are a larger 3/4 view, about two and a half heads tall, facing the
// foes. Other people and every enemy keep the battle art in actors.js.
//
// Faces: no dark brow bars, no scowls, no eye-socket shadows. Eyes are
// white with one pupil and a highlight. Smile corners sit above the mouth.
// A side nose is one pixel. Left is a mirror of right.
(function () {
  var C = Art.C;

  function cut(text) {
    var rows = text.split("\n");
    if (rows.length && rows[0] === "") rows.shift();
    if (rows.length && rows[rows.length - 1] === "") rows.pop();
    var w = rows[0].length;
    var i;
    for (i = 1; i < rows.length; i++) {
      if (rows[i].length !== w) {
        throw new Error("sprite row " + i + " is " + rows[i].length + ", expected " + w + " [" + rows[i] + "]");
      }
    }
    return rows;
  }

  function mix(a, b) {
    var o = {};
    var k;
    for (k in a) o[k] = a[k];
    for (k in b) o[k] = b[k];
    return o;
  }

  function blit(s, x, y, rows, map) {
    var r, c, ch, col;
    for (r = 0; r < rows.length; r++) {
      for (c = 0; c < rows[r].length; c++) {
        ch = rows[r].charAt(c);
        if (ch === "." || ch === " ") continue;
        col = map[ch];
        if (col) Art.plot(s, x + c, y + r, col);
      }
    }
  }

  function blank(w, h, ax, ay) {
    var s = Art.spr(w, h);
    s.ax = ax;
    s.ay = ay;
    return s;
  }

  function finish(s) {
    Art.outline(s);
    return s;
  }

  function put(s, part, off, map) {
    if (!part) return;
    var dx = off ? off.x : 0;
    var dy = off ? off.y : 0;
    blit(s, part.x + dx, part.y + dy, part.rows, part.map || map);
  }

  // Frame 0 and 2 are the contact poses. Frame 1 and 3 are the passing steps.
  // Idle is a two-frame bob on the feet-together pose.
  function gait(frame, idle) {
    var up;
    if (idle) {
      up = (frame % 2) ? -1 : 0;
      return {
        bob: up,
        ll: { x: 0, y: up },
        rl: { x: 0, y: up },
        la: { x: 0, y: up },
        ra: { x: 0, y: up },
        scarf: { x: 0, y: up },
        back: { x: 0, y: up },
        front: { x: 0, y: up },
        arm: { x: 0, y: up }
      };
    }
    frame = ((frame % 4) + 4) % 4;
    if (frame === 0) {
      return {
        bob: 0,
        ll: { x: -1, y: 0 }, rl: { x: 1, y: -3 },
        la: { x: 0, y: 1 }, ra: { x: 0, y: -1 },
        scarf: { x: -1, y: 0 },
        back: { x: -2, y: 0 }, front: { x: 2, y: -2 },
        arm: { x: 1, y: -1 }
      };
    }
    if (frame === 1) {
      return {
        bob: -1,
        ll: { x: 0, y: -1 }, rl: { x: 0, y: -1 },
        la: { x: 0, y: -1 }, ra: { x: 0, y: -1 },
        scarf: { x: 0, y: -1 },
        back: { x: -1, y: -1 }, front: { x: 1, y: -2 },
        arm: { x: 0, y: -1 }
      };
    }
    if (frame === 2) {
      return {
        bob: 0,
        ll: { x: 1, y: -3 }, rl: { x: -1, y: 0 },
        la: { x: 0, y: -1 }, ra: { x: 0, y: 1 },
        scarf: { x: 1, y: 0 },
        back: { x: 2, y: -1 }, front: { x: -2, y: 0 },
        arm: { x: -1, y: 1 }
      };
    }
    return {
      bob: -1,
      ll: { x: 0, y: -1 }, rl: { x: 0, y: -1 },
      la: { x: 1, y: -1 }, ra: { x: -1, y: -1 },
      scarf: { x: 0, y: -2 },
      back: { x: 0, y: -2 }, front: { x: 0, y: -1 },
      arm: { x: 1, y: -2 }
    };
  }

  function paintFront(spec, frame, idle, back) {
    var g = gait(frame, idle);
    var s = blank(spec.fw, spec.fh, spec.fax, spec.fay);
    var map = spec.map;
    var bob = { x: 0, y: g.bob };
    var legs = [
      { part: back ? spec.legLUp : spec.legL, off: g.ll, lift: g.ll.y < g.rl.y },
      { part: back ? spec.legRUp : spec.legR, off: g.rl, lift: g.rl.y < g.ll.y }
    ];
    legs.sort(function (a, b) { return (a.lift ? 1 : 0) - (b.lift ? 1 : 0); });
    put(s, back ? spec.cloakUp : spec.cloak, bob, map);
    put(s, legs[0].part, legs[0].off, map);
    put(s, legs[1].part, legs[1].off, map);
    put(s, back ? spec.torsoUp : spec.torso, bob, map);
    put(s, back ? spec.armLUp : spec.armL, g.la, map);
    put(s, back ? spec.armRUp : spec.armR, g.ra, map);
    put(s, back ? spec.headUp : spec.head, bob, map);
    var extras = (back ? spec.extrasUp : spec.extras) || [];
    var i, ex, off;
    for (i = 0; i < extras.length; i++) {
      ex = extras[i];
      off = ex.still ? { x: 0, y: 0 } : (ex.sway ? g.scarf : bob);
      put(s, ex, off, ex.map || map);
    }
    return finish(s);
  }

  function paintSide(spec, frame, idle) {
    var g = gait(frame, idle);
    var s = blank(spec.sw, spec.sh, spec.sax, spec.say);
    var map = spec.map;
    var bob = { x: 0, y: g.bob };
    var backLeg = { part: spec.legBack, off: g.back, lift: g.back.y < g.front.y };
    var frontLeg = { part: spec.legFront, off: g.front, lift: g.front.y < g.back.y };
    if (frontLeg.lift && !backLeg.lift) {
      put(s, backLeg.part, backLeg.off, map);
      put(s, frontLeg.part, frontLeg.off, map);
    } else {
      put(s, frontLeg.part, frontLeg.off, map);
      put(s, backLeg.part, backLeg.off, map);
    }
    put(s, spec.torsoSide, bob, map);
    put(s, spec.armSide, g.arm, map);
    put(s, spec.headSide, bob, map);
    var extras = spec.extrasSide || [];
    var i, ex, off;
    for (i = 0; i < extras.length; i++) {
      ex = extras[i];
      off = ex.still ? { x: 0, y: 0 } : (ex.sway ? g.scarf : (ex.arm ? g.arm : bob));
      put(s, ex, off, ex.map || map);
    }
    return finish(s);
  }

  var FACE = {
    S: C.skin, a: C.skinD, n: C.skinDeep,
    W: C.white, i: C.lite, E: C.eye, P: C.lip
  };

  // Shared friendly front face, 16 wide. Hair letter is D. Highlight is H.
  // Row 3 is bare forehead. Eyes are two rows, no brow.
  var FACE_FRONT = cut([
    "..DDDDDDDDDD....",
    ".DDDDDDDDDDDDD..",
    "DDHHDDDDDDHHDDDD",
    "DDSSSSSSSSSSSSDD",
    "DDSWiESSSWiESSDD",
    "DDSWWESSSWWESSDD",
    "DDPSSSSSaSSSSPDD",
    "DDSSPSSSSSSPSSDD",
    "DDSSSSPPPPSSSSDD",
    ".DSSSSSSSSSSSSD."
  ].join("\n"));

  // Side face, 12 wide, facing right. Hair stops above a skin forehead.
  // The eye is a wide white block. The nose is one pixel under the eye,
  // and the mouth corner sits higher than the front of the lip.
  var FACE_SIDE = cut([
    "..DDDDDDD...",
    ".DDDDDDDDD..",
    "DDHHDDDDDD..",
    "DDSSSSSSSS..",
    "DSWWWiESSS..",
    "DSWWWWESSS..",
    "DSSSSSSSSSS.",
    "DSSSSP.SSS..",
    "DSSSSS.PPS..",
    "DSSSSSSSS...",
    ".DSSSSSS...."
  ].join("\n"));

  var FACE_BACK = cut([
    "..DDDDDDDDDD....",
    ".DDDDDDDDDDDDD..",
    "DDHHDDDDDDHHDDDD",
    "DDDDDDDDDDDDDDDD",
    "DSDDDDDDDDDDDSDD",
    "DDDDDDDDDDDDDDDD",
    ".DDDDDDDDDDDDD..",
    "..DDDDDDDDDDDD.."
  ].join("\n"));

  function recolor(rows, from, to) {
    var out = [];
    var i, r;
    for (i = 0; i < rows.length; i++) {
      r = "";
      var c;
      for (c = 0; c < rows[i].length; c++) {
        var ch = rows[i].charAt(c);
        r += ch === from ? to : ch;
      }
      out.push(r);
    }
    return out;
  }

  function sub(rows, x, y, stamp) {
    var out = rows.slice();
    var r, c, line, ch;
    for (r = 0; r < stamp.length; r++) {
      line = out[y + r].split("");
      for (c = 0; c < stamp[r].length; c++) {
        ch = stamp[r].charAt(c);
        if (ch !== ".") line[x + c] = ch;
      }
      out[y + r] = line.join("");
    }
    return out;
  }

  var SCARF = cut([
    "YYYYYYYYYY",
    "yyyyyyyyyy"
  ].join("\n"));

  var HERO_TORSO = cut([
    "YYYYYYYYYY",
    "yyyyyyyyyy",
    "cQQQQQQQQc",
    "BBQQQQQQBB",
    "BBBBBBBBBB",
    "BcBBBBBBBc",
    "BBBBBBBBBB",
    ".bBBBBBBb."
  ].join("\n"));

  var HERO_TORSO_UP = cut([
    "yyyyyyyyyy",
    "YYYYYYYYYY",
    "bbbbbbbbbb",
    "bBBBBBBBBb",
    "BBBBBBBBBB",
    "bBBBBBBBBb",
    "BBBBBBBBBB",
    ".bBBBBBBb."
  ].join("\n"));

  var HERO_SIDE_BODY = cut([
    "YYYYYYYY",
    "yyyyyyyy",
    "cQQQQQQb",
    "BBBBBBbb",
    "BBBBBBbb",
    "bBBBBBbb",
    ".BBBBBb."
  ].join("\n"));

  var CAPE = cut([
    "KKKKKKKKKKKKKK",
    "Kkkkkkkkkkkkkk",
    ".KKKKKKKKKKKK."
  ].join("\n"));

  var CAPE_UP = cut([
    "KKKKKKKKKKKKKK",
    "kkkkkkkkkkkkkk",
    "KKKKKKKKKKKKKK",
    ".kkBBBBBBBBkk."
  ].join("\n"));

  var ARM = cut([
    "Kc",
    "BB",
    "BB",
    "BB",
    "SS",
    "SS"
  ].join("\n"));

  var ARM_SHARD = cut([
    "Kc",
    "BB",
    "BB",
    "SG",
    "gg",
    "gg"
  ].join("\n"));

  var ARM_UP = cut([
    "kk",
    "bb",
    "BB",
    "BB",
    "SS",
    "SS"
  ].join("\n"));

  var ARM_UP_SHARD = cut([
    "kk",
    "bb",
    "BB",
    "SG",
    "gg",
    ".g"
  ].join("\n"));

  var LEG = cut([
    "TTT",
    "TTT",
    "TTT",
    "uuu",
    "uuu",
    "uuu"
  ].join("\n"));

  var SIDE_LEG = cut([
    "TT",
    "TT",
    "TT",
    "uu",
    "uu",
    "uu"
  ].join("\n"));

  var SIDE_ARM = cut([
    "cB",
    "BB",
    "SG",
    "gg"
  ].join("\n"));

  var TAIL = cut([
    "YY",
    "Yy",
    "yy",
    "y."
  ].join("\n"));

  var HERO = {
    fw: 20, fh: 28, fax: 9, fay: 26,
    sw: 22, sh: 28, sax: 11, say: 26,
    map: mix(FACE, {
      H: C.hair, D: C.hairD,
      Y: C.scarf, y: C.scarfD,
      Q: C.cream, B: C.coat, b: C.coatD, c: C.coatL,
      K: C.wood, k: C.woodD,
      T: C.belt, u: C.woodL,
      G: C.shard, g: C.shardH
    }),
    head: { x: 2, y: 1, rows: FACE_FRONT },
    headUp: { x: 2, y: 2, rows: FACE_BACK },
    headSide: { x: 7, y: 1, rows: FACE_SIDE },
    cloak: { x: 3, y: 11, rows: CAPE },
    cloakUp: { x: 3, y: 11, rows: CAPE_UP },
    torso: { x: 5, y: 11, rows: HERO_TORSO },
    torsoUp: { x: 5, y: 11, rows: HERO_TORSO_UP },
    torsoSide: { x: 9, y: 11, rows: HERO_SIDE_BODY },
    armL: { x: 3, y: 13, rows: ARM_SHARD },
    armR: { x: 15, y: 13, rows: ARM },
    armLUp: { x: 3, y: 13, rows: ARM_UP },
    armRUp: { x: 15, y: 13, rows: ARM_UP_SHARD },
    armSide: { x: 13, y: 13, rows: SIDE_ARM },
    legL: { x: 6, y: 20, rows: LEG },
    legR: { x: 11, y: 20, rows: LEG },
    legLUp: { x: 6, y: 20, rows: LEG },
    legRUp: { x: 11, y: 20, rows: LEG },
    legBack: { x: 8, y: 20, rows: SIDE_LEG },
    legFront: { x: 11, y: 20, rows: SIDE_LEG },
    extras: [
      { x: 2, y: 16, rows: TAIL, sway: true }
    ],
    extrasUp: [
      { x: 8, y: 16, rows: TAIL, sway: true }
    ],
    extrasSide: [
      { x: 2, y: 12, rows: cut("YYYYY\nyyyyy\n.yyy.\n..yy."), sway: true }
    ]
  };

  // Kestrel: teal coat, yellow scarf, goggles on the hair, ponytail, hip pistol.
  var KESTREL_HEAD = sub(FACE_FRONT, 4, 2, ["mLLiLL"]);
  var KESTREL_SIDE = sub(FACE_SIDE, 4, 2, ["mLiL"]);

  var PONY = cut([
    "DD",
    "HD",
    "DD",
    "D.",
    "H.",
    "D."
  ].join("\n"));

  var PONY_SIDE = cut([
    "DDD.",
    "HDDD",
    ".DDD",
    "..DD",
    "..HD",
    "...D"
  ].join("\n"));

  var KESTREL = {
    fw: 20, fh: 28, fax: 9, fay: 26,
    sw: 24, sh: 28, sax: 12, say: 26,
    map: mix(FACE, {
      H: C.hair, D: C.hairD,
      Y: C.scarf, y: C.scarfD,
      Q: C.cream, B: C.teal, b: C.tealD, c: C.tealL,
      K: C.tealD, k: C.ink,
      T: C.woodD, u: C.wood,
      G: C.metal, g: C.metalD,
      m: C.frame, L: C.lens
    }),
    head: { x: 2, y: 1, rows: KESTREL_HEAD },
    headUp: { x: 2, y: 2, rows: FACE_BACK },
    headSide: { x: 8, y: 1, rows: KESTREL_SIDE },
    cloak: { x: 3, y: 11, rows: recolor(recolor(CAPE, "K", "b"), "k", "B") },
    cloakUp: { x: 3, y: 11, rows: recolor(recolor(CAPE_UP, "K", "b"), "k", "B") },
    torso: { x: 5, y: 11, rows: HERO_TORSO },
    torsoUp: { x: 5, y: 11, rows: HERO_TORSO_UP },
    torsoSide: { x: 11, y: 11, rows: HERO_SIDE_BODY },
    armL: { x: 3, y: 13, rows: ARM },
    armR: { x: 15, y: 13, rows: ARM },
    armLUp: { x: 3, y: 13, rows: ARM_UP },
    armRUp: { x: 15, y: 13, rows: ARM_UP },
    armSide: { x: 14, y: 13, rows: cut("cB\nBB\nBB\nSS\nS.") },
    legL: { x: 6, y: 20, rows: LEG },
    legR: { x: 11, y: 20, rows: LEG },
    legLUp: { x: 6, y: 20, rows: LEG },
    legRUp: { x: 11, y: 20, rows: LEG },
    legBack: { x: 10, y: 20, rows: SIDE_LEG },
    legFront: { x: 13, y: 20, rows: SIDE_LEG },
    extras: [
      { x: 16, y: 6, rows: PONY },
      { x: 14, y: 18, rows: cut(".m\nmm\nmT"), sway: false }
    ],
    extrasUp: [
      { x: 9, y: 8, rows: cut("DD\nHD\nDD\nD.\nH.\nD.\nD.") }
    ],
    extrasSide: [
      { x: 4, y: 6, rows: PONY_SIDE },
      { x: 5, y: 12, rows: cut("YYYY\nyyyy\n.yy."), sway: true },
      { x: 12, y: 17, rows: cut("mm\nmT\n.T"), arm: true }
    ]
  };

  // Tamsin: younger, red side-tail, orange vest, cream shirt, wrench, freckles.
  var TAMSIN_FACE = sub(recolor(recolor(FACE_FRONT, "D", "J"), "H", "j"), 6, 6, ["*", "*", "*"]);
  // The sub above stamps a 3-wide row of stars in the wrong way if stamp rows aren't equal.
  // Rebuild freckles explicitly so the cheeks stay skin.
  TAMSIN_FACE = recolor(recolor(FACE_FRONT, "D", "J"), "H", "j");
  TAMSIN_FACE = sub(TAMSIN_FACE, 4, 6, ["*S", "S*"]);

  var TAMSIN_SIDE = recolor(recolor(FACE_SIDE, "D", "J"), "H", "j");

  var VEST = cut([
    "cQQQQQQQQc",
    "OQQQQQQQOO",
    "OOOOOOOOOO",
    "OqOOOOOOqO",
    "OOOOOOOOOO",
    ".qOOOOOOq."
  ].join("\n"));

  var VEST_UP = cut([
    "qqqqqqqqqq",
    "qOOOOOOOOq",
    "OOOOOOOOOO",
    "qOOOOOOOOq",
    "OOOOOOOOOO",
    ".qOOOOOOq."
  ].join("\n"));

  var VEST_SIDE = cut([
    "cQQQQQq",
    "OOOOOOq",
    "OOOOOOq",
    "qOOOOOq",
    ".OOOOO."
  ].join("\n"));

  var WRENCH = cut([
    "mm",
    "mm",
    ".M",
    ".M",
    ".M"
  ].join("\n"));

  var TAMSIN = {
    fw: 20, fh: 28, fax: 9, fay: 26,
    sw: 22, sh: 28, sax: 11, say: 26,
    map: mix(FACE, {
      H: C.hairR, D: C.hairR, J: C.hairR, j: C.emberH,
      Q: C.cream, B: C.vest, b: C.vestD, c: C.vestL,
      O: C.vest, q: C.vestD,
      K: C.wood, k: C.woodD,
      T: C.belt, u: C.woodL,
      Y: C.gold, y: C.goldD,
      M: C.metal, m: C.metalD, G: C.metal, g: C.metal,
      "*": C.skinDeep
    }),
    head: { x: 2, y: 3, rows: TAMSIN_FACE },
    headUp: { x: 2, y: 4, rows: recolor(recolor(FACE_BACK, "D", "J"), "H", "j") },
    headSide: { x: 6, y: 3, rows: TAMSIN_SIDE },
    torso: { x: 5, y: 13, rows: VEST },
    torsoUp: { x: 5, y: 13, rows: VEST_UP },
    torsoSide: { x: 9, y: 13, rows: VEST_SIDE },
    armL: { x: 3, y: 14, rows: cut("Oq\nOO\nOO\nSS\nSS") },
    armR: { x: 15, y: 14, rows: cut("Oq\nOO\nOO\nSM\nmm") },
    armLUp: { x: 3, y: 14, rows: cut("qq\nOO\nOO\nSS\nSS") },
    armRUp: { x: 15, y: 14, rows: cut("qq\nOO\nMM\nmm\nm.") },
    armSide: { x: 13, y: 14, rows: cut("Oq\nOO\nMM\nmm") },
    legL: { x: 6, y: 20, rows: LEG },
    legR: { x: 11, y: 20, rows: LEG },
    legLUp: { x: 6, y: 20, rows: LEG },
    legRUp: { x: 11, y: 20, rows: LEG },
    legBack: { x: 8, y: 20, rows: SIDE_LEG },
    legFront: { x: 11, y: 20, rows: SIDE_LEG },
    extras: [
      { x: 16, y: 8, rows: recolor(PONY, "D", "J").map(function (row) { return row.replace(/H/g, "j"); }) },
      { x: 16, y: 17, rows: WRENCH }
    ],
    extrasUp: [
      { x: 9, y: 10, rows: cut("JJ\njJ\nJJ\nJ.\nj.\nJ.") }
    ],
    extrasSide: [
      { x: 2, y: 8, rows: recolor(recolor(PONY_SIDE, "D", "J"), "H", "j") },
      { x: 15, y: 16, rows: cut("mm\n.M\n.M"), arm: true }
    ]
  };

  // Old Maren: white bun, rust shawl, cream skirt, lantern-staff. Kind face.
  var MAREN_HEAD = recolor(recolor(FACE_FRONT, "D", "f"), "H", "p");
  MAREN_HEAD[0] = "....ffffffff....";
  MAREN_HEAD[1] = "...ffppppppff...";
  MAREN_HEAD[2] = "..ffpffffffpff..";

  var MAREN_SIDE = recolor(recolor(FACE_SIDE, "D", "f"), "H", "p");
  MAREN_SIDE[0] = "...ffff.....";
  MAREN_SIDE[1] = "..fppppff...";
  MAREN_SIDE[2] = ".ffpfffpf...";

  var MAREN_BACK = cut([
    "....ffff....",
    "...ffffff...",
    "..ffffffff..",
    ".ffppppffff.",
    "ffffffffffff",
    "ffSffffffSff",
    "ffffffffffff",
    ".ffffffffff."
  ].join("\n"));

  var SHAWL = cut([
    ".llllllllll.",
    "lRRRRRRRRRRl",
    "RRRRRRRRRRRR",
    "rRRRRRRRRRRr",
    "QQQQQQQQQQQQ",
    "QQQQQQQQQQQQ",
    "qQQQQQQQQQQq",
    ".QQQQQQQQQQ.",
    "..QQQQQQQQ..",
    "...QQQQQQ..."
  ].join("\n"));

  var SHAWL_UP = cut([
    ".rrrrrrrrrr.",
    "rRRRRRRRRRRr",
    "RRRRRRRRRRRR",
    "rRRRRRRRRRRr",
    "QQQQQQQQQQQQ",
    "qQQQQQQQQQQq",
    "QQQQQQQQQQQQ",
    ".QQQQQQQQQQ.",
    "..QQQQQQQQ..",
    "...QQQQQQ..."
  ].join("\n"));

  var SHAWL_SIDE = cut([
    "lRRRRRRr",
    "RRRRRRRr",
    "RRRRRRRr",
    "QQQQQQQq",
    "QQQQQQQq",
    "QQQQQQQ.",
    ".QQQQQQ.",
    "..QQQQQ.",
    "...QQQQ."
  ].join("\n"));

  var SHOE = cut([
    "uuu",
    "uuu"
  ].join("\n"));

  function lampStaff() {
    var rows = [".A.", "AwA", "AoA"];
    var i;
    for (i = 0; i < 16; i++) rows.push(".k.");
    return rows;
  }

  var MAREN = {
    fw: 24, fh: 28, fax: 12, fay: 26,
    sw: 24, sh: 28, sax: 12, say: 26,
    map: mix(FACE, {
      f: C.hairW, d: C.hairWD, p: C.paper,
      D: C.hairW, H: C.paper,
      R: C.shawl, r: C.shawlD, l: C.shawlL,
      Q: C.cream, q: C.skinD,
      u: C.wood, k: C.woodD,
      A: C.gold, o: C.goldD, w: C.warm,
      Y: C.gold, y: C.goldD
    }),
    head: { x: 5, y: 1, rows: MAREN_HEAD },
    headUp: { x: 6, y: 1, rows: MAREN_BACK },
    headSide: { x: 8, y: 1, rows: MAREN_SIDE },
    torso: { x: 7, y: 12, rows: SHAWL },
    torsoUp: { x: 7, y: 12, rows: SHAWL_UP },
    torsoSide: { x: 10, y: 12, rows: SHAWL_SIDE },
    legL: { x: 9, y: 24, rows: SHOE },
    legR: { x: 14, y: 24, rows: SHOE },
    legLUp: { x: 9, y: 24, rows: SHOE },
    legRUp: { x: 14, y: 24, rows: SHOE },
    legBack: { x: 10, y: 24, rows: SHOE },
    legFront: { x: 13, y: 24, rows: SHOE },
    extras: [
      { x: 1, y: 6, rows: lampStaff() }
    ],
    extrasUp: [
      { x: 20, y: 5, rows: lampStaff() }
    ],
    extrasSide: [
      { x: 19, y: 3, rows: lampStaff() }
    ]
  };

  // Brother Hesk: hood and robe, pale stole, face left open and kind.
  var HESK_HEAD = cut([
    "......UU......",
    "....UUUUUU....",
    "..UUUUUUUUUU..",
    ".UUSSSSSSSSUU.",
    "UUSWiESSSWiESU",
    "UUSWWESSSWWESU",
    "UUPSSSSSaSSSPU",
    "UUSSPSSSSSPSSU",
    "UUSSSSPPPPSSSU",
    ".UUSSSSSSSSUU."
  ].join("\n"));

  var HESK_SIDE = recolor(recolor(FACE_SIDE, "D", "U"), "H", "l");
  HESK_SIDE[0] = "....UU......";
  HESK_SIDE[1] = "..UUUUUUU...";
  HESK_SIDE[2] = "UUlUUUUUUU..";

  var HESK_BACK = cut([
    "......UU......",
    "....UUUUUU....",
    "..UUUUUUUUUU..",
    "UUUUUUUUUUUUUU",
    "UUUUUUUUUUUUUU",
    ".UUUUUUUUUUUU.",
    "..UUUUUUUUUU.."
  ].join("\n"));

  var ROBE = cut([
    ".llllllllll.",
    "lUUUUOOOOUUl",
    "UUUUOOOOUUUU",
    "UUUUOOOOUUUU",
    "uUUUOOOOUUUu",
    "UUUUOOOOUUUU",
    "UUUUOOOOUUUU",
    ".UUUUOOOOUU.",
    "..UUUOOOOU..",
    "..UUUOOOO..."
  ].join("\n"));

  var ROBE_UP = cut([
    ".uuuuuuuuuu.",
    "uUUUUUUUUUUu",
    "UUUUOOOOUUUU",
    "UUUUOOOOUUUU",
    "uUUUOOOOUUUu",
    "UUUUOOOOUUUU",
    ".UUUUOOOOUU.",
    "..UUUOOOOU..",
    "..UUUOOOO..."
  ].join("\n"));

  var ROBE_SIDE = cut([
    "lUUUUUUu",
    "UUOOOOUu",
    "UUOOOOUu",
    "UUOOOOUu",
    "UUOOOOUu",
    ".UUOOOO.",
    "..UUOOO.",
    "...UUOO.",
    "....UUU."
  ].join("\n"));

  var HESK = {
    fw: 20, fh: 28, fax: 9, fay: 26,
    sw: 22, sh: 28, sax: 10, say: 26,
    map: mix(FACE, {
      S: C.pale, a: C.paleD, n: C.skinD,
      U: C.robe, u: C.robeD, l: C.robeL,
      O: C.stole, o: C.white,
      H: C.robeL, D: C.robe
    }),
    head: { x: 2, y: 1, rows: HESK_HEAD },
    headUp: { x: 3, y: 1, rows: HESK_BACK },
    headSide: { x: 6, y: 2, rows: HESK_SIDE },
    torso: { x: 3, y: 12, rows: ROBE },
    torsoUp: { x: 3, y: 12, rows: ROBE_UP },
    torsoSide: { x: 8, y: 11, rows: ROBE_SIDE },
    legL: { x: 6, y: 24, rows: cut("uu\nuu") },
    legR: { x: 11, y: 24, rows: cut("UU\nUU") },
    legLUp: { x: 6, y: 24, rows: cut("uu\nuu") },
    legRUp: { x: 11, y: 24, rows: cut("UU\nUU") },
    legBack: { x: 8, y: 24, rows: cut("uu\nuu") },
    legFront: { x: 11, y: 24, rows: cut("UU\nUU") }
  };

  // Warden Ilsa: broad armor, open face under a helm, red plume, spear.
  var ILSA_HEAD = cut([
    "......RR......",
    ".....RRRR.....",
    "...MMMMMMMM...",
    "..MMllllllMM..",
    ".MMSSSSSSSSMM.",
    "MMSWiESSSWiESM",
    "MMSWWESSSWWESM",
    "MMPSSSSSaSSSPM",
    "MMSSPSSSSSPSSM",
    "MMSSSSPPPPSSSM",
    ".MMSSSSSSSSMM."
  ].join("\n"));

  var ILSA_SIDE = recolor(recolor(FACE_SIDE, "D", "M"), "H", "l");
  ILSA_SIDE[0] = "....RRR.....";
  ILSA_SIDE[1] = "...RRRRRM...";
  ILSA_SIDE[2] = ".MMlllllMM..";

  var ILSA_BACK = cut([
    "......RR......",
    ".....RRRR.....",
    "...MMMMMMMM...",
    ".MMMMMMMMMMMM.",
    "MMMMMMMMMMMMMM",
    "MMMlMMMMMMlMMM",
    ".MMMMMMMMMMMM.",
    "..MMMMMMMMMM.."
  ].join("\n"));

  var PLATE = cut([
    "llllllllllll",
    "lMMMMMMMMMMl",
    "MMMMMMMMMMMM",
    "mMMMMMMMMMMm",
    "MMMMMMMMMMMM",
    "mMMMMMMMMMMm",
    ".MMMMMMMMMM.",
    "..mMMMMMMm.."
  ].join("\n"));

  var PLATE_UP = cut([
    "mmmmmmmmmmmm",
    "mMMMMMMMMMMm",
    "MMMMMMMMMMMM",
    "mMMMMMMMMMMm",
    "MMMMMMMMMMMM",
    ".MMMMMMMMMM.",
    "..mMMMMMMm.."
  ].join("\n"));

  var PLATE_SIDE = cut([
    "lMMMMMm",
    "MMMMMMm",
    "MMMMMMm",
    "mMMMMMm",
    "MMMMMM.",
    ".mMMMM.",
    "..mMMM."
  ].join("\n"));

  function spear() {
    var rows = ["l", "t", "t"];
    var i;
    for (i = 0; i < 14; i++) rows.push("m");
    rows.push("T");
    return rows;
  }

  var ILSA = {
    fw: 22, fh: 28, fax: 10, fay: 26,
    sw: 24, sh: 28, sax: 12, say: 26,
    map: mix(FACE, {
      M: C.armor, m: C.armorD, l: C.armorL,
      R: C.plume, T: C.woodD, t: C.lite,
      B: C.armor, b: C.armorD, c: C.armorL,
      K: C.armorD, k: C.ink,
      u: C.armor, G: C.metal, g: C.metalD,
      H: C.armorL, D: C.armor
    }),
    head: { x: 3, y: 0, rows: ILSA_HEAD },
    headUp: { x: 4, y: 0, rows: ILSA_BACK },
    headSide: { x: 7, y: 0, rows: ILSA_SIDE },
    torso: { x: 4, y: 12, rows: PLATE },
    torsoUp: { x: 4, y: 12, rows: PLATE_UP },
    torsoSide: { x: 10, y: 12, rows: PLATE_SIDE },
    armL: { x: 2, y: 13, rows: cut("ll\nMM\nMM\nMM\nSS\nSS") },
    armR: { x: 16, y: 13, rows: cut("ll\nMM\nMM\nMM\nSS\nSS") },
    armLUp: { x: 2, y: 13, rows: cut("mm\nMM\nMM\nMM\nSS") },
    armRUp: { x: 16, y: 13, rows: cut("mm\nMM\nMM\nMM\nSS") },
    armSide: { x: 14, y: 13, rows: cut("lM\nMM\nMM\nSS") },
    legL: { x: 6, y: 20, rows: cut("mmm\nmmm\nMMM\nMMM\nmmm\nmmm") },
    legR: { x: 12, y: 20, rows: cut("mmm\nmmm\nMMM\nMMM\nmmm\nmmm") },
    legLUp: { x: 6, y: 20, rows: cut("mmm\nmmm\nMMM\nMMM\nmmm\nmmm") },
    legRUp: { x: 12, y: 20, rows: cut("mmm\nmmm\nMMM\nMMM\nmmm\nmmm") },
    legBack: { x: 9, y: 20, rows: cut(".m.\nmmm\nMMM\nmmm\nmmm\nmmm") },
    legFront: { x: 12, y: 20, rows: cut(".M.\nMMM\nMMM\nmmm\nmmm\nmmm") },
    extras: [
      { x: 19, y: 2, rows: spear() }
    ],
    extrasUp: [
      { x: 2, y: 2, rows: spear() }
    ],
    extrasSide: [
      { x: 18, y: 2, rows: spear(), arm: true }
    ]
  };

  // The Cantor: pale calm mask, short void robe, gold hem, no feet.
  var CANTOR_HEAD = cut([
    ".....VVV......",
    "...VVVVVVVV...",
    "..VVVVVVVVVV..",
    ".VVMMMMMMMMVV.",
    "VVMMWWWWWWMMVV",
    "VVMMWZWWZWMMVV",
    "VVMMMMMMMMMMVV",
    "VVMMMZZZZMMM..",
    "VVMMMMMMMMMM..",
    ".VVMMMMMMMMV.."
  ].join("\n"));

  var CANTOR_SIDE = cut([
    "...VVVV.......",
    ".VVVVVVVV.....",
    "VMMMMMMMMV....",
    "VMMMWWWMV.....",
    "VMMMMZZZV.....",
    "VMMMMMMMM.....",
    ".VMMMMM......."
  ].join("\n"));

  var CANTOR_BACK = cut([
    ".....VVV......",
    "...VVVVVVVV...",
    "..VVVVVVVVVV..",
    "VVVVVVVVVVVVVV",
    ".VVVVVVVVVVVV.",
    "..VVVVVVVVVV.."
  ].join("\n"));

  var VOID_ROBE = cut([
    ".LLLLLLLLLL.",
    "LVVVVVVVVVVL",
    "VVVVVVVVVVVV",
    "vVVVVVVVVVVv",
    "VVVVVVVVVVVV",
    "VVVVVVVVVVVV",
    "VVVVVVVVVVVV",
    "VVVVVVVVVVVV",
    ".VVVVVVVVVV.",
    "..VVVVVVVV..",
    "...VVVVVV...",
    "...VVVVVV...",
    "...VVVVVV...",
    "ZZZZZZZZZZZZ"
  ].join("\n"));

  var VOID_UP = cut([
    ".vvvvvvvvvv.",
    "vVVVVVVVVVVv",
    "VVVVVVVVVVVV",
    "vVVVVVVVVVVv",
    "VVVVVVVVVVVV",
    "VVVVVVVVVVVV",
    "VVVVVVVVVVVV",
    "VVVVVVVVVVVV",
    ".VVVVVVVVVV.",
    "..VVVVVVVV..",
    "...VVVVVV...",
    "...VVVVVV...",
    "...VVVVVV...",
    "ZZZZZZZZZZZZ"
  ].join("\n"));

  var VOID_SIDE = cut([
    "LVVVVV.",
    "VVVVVVv",
    "VVVVVVv",
    "VVVVVVv",
    "VVVVVV.",
    "VVVVVV.",
    "VVVVVV.",
    "VVVVVV.",
    "VVVVVV.",
    "VVVVVV.",
    ".VVVVV.",
    "..VVVV.",
    "...VVV.",
    "ZZZZZZZ"
  ].join("\n"));

  var CANTOR = {
    fw: 20, fh: 28, fax: 9, fay: 26,
    sw: 22, sh: 28, sax: 10, say: 26,
    map: mix(FACE, {
      V: C.void, v: C.voidD, L: C.voidL,
      M: C.mask, m: C.maskD,
      Z: C.hem, A: C.gold, n: C.goldD,
      W: C.white, H: C.hem, D: C.void
    }),
    head: { x: 2, y: 2, rows: CANTOR_HEAD },
    headUp: { x: 3, y: 2, rows: CANTOR_BACK },
    headSide: { x: 6, y: 2, rows: CANTOR_SIDE },
    torso: { x: 3, y: 12, rows: VOID_ROBE },
    torsoUp: { x: 3, y: 12, rows: VOID_UP },
    torsoSide: { x: 8, y: 12, rows: VOID_SIDE }
  };

  var SPECS = {
    wayfarer: HERO,
    kestrel: KESTREL,
    tamsin: TAMSIN,
    maren: MAREN,
    hesk: HESK,
    ilsa: ILSA,
    cantor: CANTOR
  };

  var ORDER = ["wayfarer", "maren", "kestrel", "tamsin", "hesk", "ilsa", "cantor"];
  var PARTY = { wayfarer: 1, kestrel: 1, tamsin: 1 };
  var BATTLE = { idle: 1, attack: 1, cast: 1, hurt: 1, victory: 1 };
  var cache = {};
  var battleCache = {};

  // Battle figures face left (toward the foes) in a 3/4 view.
  // About two heads tall: a big face, a short body, a weapon in the near hand.
  // The rim is a darker shade of the color it touches, not a black stroke.
  var BW = 36;
  var BH = 44;

  function box(text) {
    var rows = text.split("\n");
    if (rows.length && rows[0] === "") rows.shift();
    if (rows.length && rows[rows.length - 1] === "") rows.pop();
    var w = 0;
    var i, line;
    for (i = 0; i < rows.length; i++) if (rows[i].length > w) w = rows[i].length;
    for (i = 0; i < rows.length; i++) {
      line = rows[i];
      while (line.length < w) line += ".";
      rows[i] = line;
    }
    return rows;
  }

  function toneRim(s) {
    var dark = {};
    function pair(mid, shade) { dark[mid] = shade; }
    pair(C.skin, C.skinD);
    pair(C.skinD, C.skinDeep);
    pair(C.skinDeep, C.hairD);
    pair(C.white, C.skinD);
    pair(C.lite, C.eye);
    pair(C.eye, C.hairD);
    pair(C.lip, C.skinDeep);
    pair(C.hair, C.hairD);
    pair(C.hairD, C.hairK);
    pair(C.hairK, C.hairK);
    pair(C.hairR, C.hairRD);
    pair(C.hairRD, C.hairK);
    pair(C.emberH, C.ember);
    pair(C.ember, C.hairRD);
    pair(C.scarf, C.scarfD);
    pair(C.scarfD, C.goldD);
    pair(C.gold, C.goldD);
    pair(C.woodD, C.belt);
    pair(C.cream, C.paleD);
    pair(C.pale, C.paleD);
    pair(C.paleD, C.skinDeep);
    pair(C.coat, C.coatD);
    pair(C.coatD, C.winD);
    pair(C.coatL, C.coat);
    pair(C.wood, C.woodD);
    pair(C.woodL, C.wood);
    pair(C.belt, C.hairD);
    pair(C.shard, C.shardD);
    pair(C.shardH, C.shard);
    pair(C.shardD, C.winD);
    pair(C.teal, C.tealD);
    pair(C.tealD, C.night);
    pair(C.tealL, C.teal);
    pair(C.vest, C.vestD);
    pair(C.vestD, C.hairRD);
    pair(C.vestL, C.vest);
    pair(C.metal, C.metalD);
    pair(C.metalD, C.stoneD);
    pair(C.frame, C.hairD);
    pair(C.lens, C.tealD);
    pair(C.winD, C.night);
    pair(C.night, C.night);
    var w = s.w;
    var h = s.h;
    var src = s.d;
    var copy = new Uint8Array(src);
    var outside = new Uint8Array(w * h);
    var stack = [];
    var dirs = [1, 0, -1, 0, 0, 1, 0, -1];
    function push(x, y) {
      if (x < 0 || y < 0 || x >= w || y >= h) return;
      var i = y * w + x;
      if (copy[i] || outside[i]) return;
      outside[i] = 1;
      stack.push(x, y);
    }
    var x, y, k, nx, ny, nb;
    for (x = 0; x < w; x++) {
      push(x, 0);
      push(x, h - 1);
    }
    for (y = 0; y < h; y++) {
      push(0, y);
      push(w - 1, y);
    }
    while (stack.length) {
      y = stack.pop();
      x = stack.pop();
      for (k = 0; k < 8; k += 2) push(x + dirs[k], y + dirs[k + 1]);
    }
    for (y = 0; y < h; y++) {
      for (x = 0; x < w; x++) {
        if (!outside[y * w + x]) continue;
        nb = 0;
        for (k = 0; k < 8; k += 2) {
          nx = x + dirs[k];
          ny = y + dirs[k + 1];
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          if (copy[ny * w + nx]) {
            nb = copy[ny * w + nx];
            break;
          }
        }
        if (nb && dark[nb]) src[y * w + x] = dark[nb];
      }
    }
    return s;
  }

  // Big 3/4 head. Two tufts, a jagged bang, both eyes, smile corners up.
  var BATTLE_HEAD = box([
    "......h....h..",
    "....hhHHHHHhH.",
    "...DHHHHHHHHHh",
    "..DHHHHHHHHHHH",
    ".DHHHhhhhhHHHHH",
    ".HHSSSSSSSSSHHHH",
    "HSWWWiESSWWiESHH",
    "HSWWWWESSWWWWEaH",
    ".SSSSSSSSSSSSSaa",
    ".SPaSSSSSSSSSSSS",
    "..SSPPPPPSSSSSS.",
    "..SSSSSSSSSSSSS.",
    "...HHHHHHHHHHHH.",
    "....DHHHHHHHH...",
    ".....DHHHHHH...."
  ].join("\n"));

  var BATTLE_HURT = box([
    "......h....h..",
    "....hhHHHHHhH.",
    "...DHHHHHHHHHh",
    "..DHHHHHHHHHHH",
    ".DHHHhhhhhHHHHH",
    ".HHSSSSSSSSSHHHH",
    "HSSaSSSSSaSSSSHH",
    "HSSSSSSSSSSSSSSa",
    ".SSSSSSSSSSSSSaa",
    ".SSPaSSSSSSSSSSS",
    "..SSS.PP.SSSSS..",
    "..SSSSSSSSSSSSS.",
    "...HHHHHHHHHHHH.",
    "....DHHHHHHHH...",
    ".....DHHHHHH...."
  ].join("\n"));

  var BATTLE_CAPE = box([
    "..KKKKKKKKKK..",
    ".jKKKKKKKKKKKj",
    "Kkkkkkkkkkkkkkk",
    ".kKKKKKKKKKKKk.",
    "..k........k.."
  ].join("\n"));

  var BATTLE_BODY = box([
    ".oYYYYYYYYYo.",
    "yyyyyyyyyyyyy",
    "cQQQQQQQQQQQb",
    "BBQQQQQQQQQQb",
    "BcBBBBBBBBBBb",
    ".bBBBBBBBBBb."
  ].join("\n"));

  var BATTLE_VEST = box([
    ".SSSSSSSSS.",
    "cQQQQQQQQQc",
    "OQQQQQQQQQO",
    "OqOOOOOOOqO",
    ".qOOOOOOOq."
  ].join("\n"));

  var NEAR_LEG = box([
    "TTT",
    "TTv",
    "vvv",
    "vuu",
    "uuw",
    "www",
    ".w."
  ].join("\n"));

  var FAR_LEG = box([
    ".TT",
    ".Tv",
    ".vv",
    ".uu",
    ".uw",
    ".ww",
    ".w."
  ].join("\n"));

  // Far arm hangs clear of the coat. The hand has a thumb and two fingers.
  var FAR_ARM = box([
    "cB",
    "Bb",
    "Bb",
    "Bb",
    "Sa",
    "S.S",
    "a.a"
  ].join("\n"));

  var NEAR_ARM = box([
    "..c",
    ".Bb",
    "cBb",
    "SSa",
    "S.S",
    "a.a"
  ].join("\n"));

  // Shard Focus, the Wayfarer's weapon. Cyan crystal, gold mount, a real hand.
  var SHARD_FOCUS = box([
    "...gGg.",
    "..gGGGd",
    ".gGGGGdd",
    "aGGGGddS",
    ".SRRddSa",
    "..SRaaS.",
    "...a.a.."
  ].join("\n"));

  // Kestrel's knife. Long bright blade, dark edge, wrapped grip.
  var KNIFE = box([
    "mmmmmmm",
    "mMMMMMm",
    ".mmmmm.",
    "..rrSS.",
    "..rS.S.",
    "...a.a."
  ].join("\n"));

  // Tamsin's coil tool. A copper spiral on a short grip.
  var COIL = box([
    "..oho..",
    ".ohhho.",
    "ohemmeho",
    ".ohhho.",
    "..oSSo.",
    "...rS..",
    "....a.."
  ].join("\n"));

  var PONY_BATTLE = box([
    "DDD.",
    "hDDD",
    ".DDD",
    "..DD",
    "..hD",
    "...D"
  ].join("\n"));

  function battleMap(kind) {
    var map = {
      S: C.skin, a: C.skinD, n: C.skinDeep,
      W: C.white, i: C.lite, E: C.eye, P: C.lip,
      Y: C.scarf, y: C.scarfD, o: C.gold,
      Q: C.cream, q: C.paleD,
      T: C.belt, v: C.wood, u: C.woodL, w: C.woodD,
      R: C.gold, r: C.goldD,
      G: C.shard, g: C.shardH, d: C.shardD,
      M: C.metal, m: C.metalD,
      L: C.lens, f: C.frame,
      O: C.vest, e: C.ember
    };
    if (kind === "kestrel") {
      map.H = C.hair;
      map.D = C.hairD;
      map.h = C.woodL;
      map.B = C.teal;
      map.b = C.tealD;
      map.c = C.tealL;
      map.K = C.teal;
      map.k = C.tealD;
      map.j = C.tealL;
    } else if (kind === "tamsin") {
      map.H = C.hairR;
      map.D = C.hairRD;
      map.h = C.emberH;
      map.B = C.vest;
      map.b = C.vestD;
      map.c = C.vestL;
      map.O = C.vest;
      map.q = C.vestD;
      map.e = C.ember;
    } else {
      map.H = C.hair;
      map.D = C.hairD;
      map.h = C.woodL;
      map.B = C.coat;
      map.b = C.coatD;
      map.c = C.coatL;
      map.K = C.wood;
      map.k = C.woodD;
      map.j = C.woodL;
    }
    return map;
  }

  function kestrelHead(rows) {
    var o = rows.slice();
    o[4] = sub([o[4]], 3, 0, ["fLiLhf"])[0];
    return o;
  }

  function tamsinHead(rows) {
    return sub(rows, 3, 8, ["n.n"]);
  }

  function poseLay(pose, frame) {
    var lay = { bob: 0, lean: 0, hx: 0, hy: 22, hurt: 0, spark: 0, reach: 0 };
    if (pose === "idle") {
      lay.bob = frame ? -1 : 0;
    } else if (pose === "attack" && !frame) {
      lay.lean = 1;
      lay.hx = 26;
      lay.hy = 14;
      lay.reach = 1;
    } else if (pose === "attack") {
      lay.lean = -1;
      lay.bob = -1;
      lay.hx = 0;
      lay.hy = 16;
      lay.reach = 1;
    } else if (pose === "cast" && !frame) {
      lay.bob = -1;
      lay.hx = 0;
      lay.hy = 8;
      lay.spark = 1;
      lay.reach = 1;
    } else if (pose === "cast") {
      lay.bob = -1;
      lay.hx = 0;
      lay.hy = 5;
      lay.spark = 2;
      lay.reach = 1;
    } else if (pose === "hurt" && !frame) {
      lay.lean = 2;
      lay.hx = 1;
      lay.hy = 26;
      lay.hurt = 1;
    } else if (pose === "hurt") {
      lay.lean = 3;
      lay.bob = 1;
      lay.hx = 2;
      lay.hy = 27;
      lay.hurt = 1;
    } else if (pose === "victory" && !frame) {
      lay.bob = -1;
      lay.hx = 1;
      lay.hy = 2;
      lay.spark = 1;
      lay.reach = 1;
    } else if (pose === "victory") {
      lay.hx = 0;
      lay.hy = 1;
      lay.spark = 2;
      lay.reach = 1;
    }
    return lay;
  }

  // The raised arm stays in the gutter beside the head, then turns in at the shoulder.
  function sleeve(s, sx, sy, hx, hy, map) {
    var x, y, ax, y0, y1;
    y0 = hy + 3;
    y1 = sy;
    if (y0 > y1) {
      y = y0;
      y0 = y1;
      y1 = y;
    }
    if (hx < sx) {
      ax = hx + 2;
      if (ax > 6) ax = 6;
      for (y = y0; y <= y1; y++) {
        Art.plot(s, ax, y, map.c);
        Art.plot(s, ax + 1, y, map.B);
      }
      for (x = ax; x <= sx; x++) {
        Art.plot(s, x, sy, map.B);
        Art.plot(s, x, sy + 1, map.b);
      }
    } else {
      ax = hx;
      if (ax < 26) ax = 26;
      for (y = y0; y <= y1; y++) {
        Art.plot(s, ax, y, map.b);
        Art.plot(s, ax + 1, y, map.B);
      }
      for (x = sx; x <= ax; x++) {
        if (x > 22 && y1 < 16) continue;
        Art.plot(s, x, sy, map.B);
        Art.plot(s, x, sy + 1, map.b);
      }
    }
    Art.plot(s, hx + 3, hy + 4, map.S);
    Art.plot(s, hx + 4, hy + 5, map.a);
  }

  function paintBattle(id, pose, frame) {
    frame = frame ? 1 : 0;
    var kind = id === "kestrel" || id === "tamsin" ? id : "wayfarer";
    var map = battleMap(kind);
    var lay = poseLay(pose, frame);
    var s = blank(BW, BH, 16, 41);
    var drop = kind === "tamsin" ? 2 : 0;
    var bob = lay.bob;
    var lean = lay.lean;
    var head = lay.hurt ? BATTLE_HURT : BATTLE_HEAD;
    if (kind === "kestrel") head = kestrelHead(head);
    if (kind === "tamsin") head = tamsinHead(head);
    var weapon = kind === "kestrel" ? KNIFE : (kind === "tamsin" ? COIL : SHARD_FOCUS);
    if (kind !== "tamsin") blit(s, 9 + lean, 15 + drop + bob, BATTLE_CAPE, map);
    blit(s, 20 + lean, 30 + drop, FAR_LEG, map);
    blit(s, 14 + lean + (pose === "attack" && frame ? -1 : 0), 29 + drop, NEAR_LEG, map);
    if (kind === "tamsin") blit(s, 12 + lean, 18 + drop + bob, BATTLE_VEST, map);
    else blit(s, 11 + lean, 16 + drop + bob, BATTLE_BODY, map);
    blit(s, 25 + lean, 20 + drop + bob, FAR_ARM, map);
    blit(s, 9 + lean, 1 + drop + bob, head, map);
    if (kind === "kestrel") blit(s, 24 + lean, 7 + drop + bob, PONY_BATTLE, map);
    if (kind === "tamsin") blit(s, 24 + lean, 8 + drop + bob, recolor(PONY_BATTLE, "D", "H"), map);
    var wx = lay.hx + lean;
    var wy = lay.hy + drop + bob;
    if (lay.reach) sleeve(s, 13 + lean, 20 + drop + bob, wx + 4, wy + 3, map);
    else blit(s, 6 + lean, 21 + drop + bob, NEAR_ARM, map);
    blit(s, wx, wy, weapon, map);
    if (lay.spark) {
      var spark = kind === "tamsin" ? cut(".h.\nheh\n.h.") : (kind === "kestrel" ? cut(".i.\niWi\n.i.") : cut(".g.\ngig\n.g."));
      if (lay.spark > 1) spark = kind === "tamsin" ? cut("h.h\n.o.\nh.h") : (kind === "kestrel" ? cut("i.i\n.W.\ni.i") : cut("g.g\n.i.\ng.g"));
      blit(s, wx + 2, Math.max(1, wy - 3), spark, map);
    }
    var padded = Art.spr(s.w + 2, s.h + 2);
    var y, x, low;
    for (y = 0; y < s.h; y++) {
      for (x = 0; x < s.w; x++) padded.d[(y + 1) * padded.w + (x + 1)] = s.d[y * s.w + x];
    }
    padded.ax = s.ax + 1;
    toneRim(padded);
    low = 0;
    for (y = 0; y < padded.h; y++) {
      for (x = 0; x < padded.w; x++) if (padded.d[y * padded.w + x]) low = y;
    }
    padded.ay = low;
    return padded;
  }

  function battle(id, pose, facing, frame) {
    var face = facing === "left" ? "left" : "right";
    var f = frame ? 1 : 0;
    var key = id + "|" + pose + "|" + face + "|" + f;
    if (!battleCache[key]) {
      var s = paintBattle(id, pose, f);
      if (face === "right") s = Art.mirror(s);
      battleCache[key] = s;
    }
    return Art.clone(battleCache[key]);
  }

  function paintPortrait(kind) {
    var s = Art.spr(32, 32);
    var map = battleMap(kind);
    var bg = kind === "kestrel" ? C.tealD : (kind === "tamsin" ? C.vestD : C.coatD);
    Art.fill(s, 0, 0, 32, 32, bg);
    var head = BATTLE_HEAD;
    if (kind === "kestrel") head = kestrelHead(head);
    if (kind === "tamsin") head = tamsinHead(head);
    blit(s, 6, 1, head, map);
    if (kind === "kestrel") blit(s, 22, 8, PONY_BATTLE, map);
    if (kind === "tamsin") blit(s, 22, 9, recolor(PONY_BATTLE, "D", "H"), map);
    if (kind === "tamsin") {
      blit(s, 4, 16, box("cQQQQQQQQQQQQQQQc\nOQQQQQQQQQQQQQQQO\nOOOOOOOOOOOOOOOOO\nOqOOOOOOOOOOOOqO\n.qOOOOOOOOOOOOq."), map);
      Art.fill(s, 6, 22, 20, 9, C.vest);
      Art.fill(s, 8, 22, 16, 2, C.cream);
      Art.fill(s, 6, 28, 20, 3, C.vestD);
    } else {
      blit(s, 4, 15, box("oYYYYYYYYYYYYYYYYYo\nyyyyyyyyyyyyyyyyyyy\ncQQQQQQQQQQQQQQQQQb\nBBQQQQQQQQQQQQQQQQb"), map);
      Art.fill(s, 5, 20, 22, 8, kind === "kestrel" ? C.teal : C.coat);
      Art.fill(s, 7, 20, 18, 3, kind === "kestrel" ? C.tealL : C.coatL);
      Art.fill(s, 5, 26, 22, 5, kind === "kestrel" ? C.tealD : C.coatD);
    }
    s.ax = 16;
    s.ay = 31;
    return s;
  }

  function field(id, pose, facing, frame) {
    var dir = facing;
    if (dir !== "down" && dir !== "up" && dir !== "left" && dir !== "right") dir = "down";
    var idle = pose === "stand";
    var f = idle ? ((frame % 2) + 2) % 2 : ((frame % 4) + 4) % 4;
    var key = id + "|" + (idle ? "s" : "w") + "|" + dir + "|" + f;
    if (!cache[key]) {
      var drawDir = dir === "left" ? "right" : dir;
      var spec = SPECS[id];
      var s = drawDir === "up" ? paintFront(spec, f, idle, true)
        : (drawDir === "right" ? paintSide(spec, f, idle) : paintFront(spec, f, idle, false));
      if (dir === "left") s = Art.mirror(s);
      cache[key] = s;
    }
    return Art.clone(cache[key]);
  }

  ORDER.forEach(function (id) {
    var prev = Art._makers[id];
    Art.add(id, function (pose, facing, frame) {
      if (pose === "walk" || pose === "stand") return field(id, pose, facing, frame || 0);
      if (PARTY[id] && BATTLE[pose]) return battle(id, pose, facing, frame || 0);
      if (prev) return prev(pose, facing, frame || 0);
      return field(id, "walk", facing, 0);
    }, Art._scale[id], Art._fieldScale[id]);
  });

  ["wayfarer", "kestrel", "tamsin"].forEach(function (id) {
    Art.addPortrait(id, function () { return paintPortrait(id); });
  });

  Art.fieldCast = {};
  ORDER.forEach(function (id) { Art.fieldCast[id] = 1; });
  Art.fieldOrder = ORDER;
})();
