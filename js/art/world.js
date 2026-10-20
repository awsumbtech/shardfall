"use strict";

// Tiles, props, and the Hush cloud stamps. Patterns are 16×16 and repeat
// 1:1 in world space when the terrain sheet is baked at one texel per unit.
(function () {
  var C = Art.C;
  var plot = Art.plot;
  var fill = Art.fill;

  function prop(id, maker, scale, field) {
    Art.add(id, function () {
      var s = maker();
      Art.outline(s);
      return s;
    }, scale == null ? 2 : scale, field == null ? (scale == null ? 2 : scale) : field);
  }

  function tile(name, maker) {
    Art.add("tile_" + name, function () {
      return maker();
    }, 1, 1);
  }

  prop("chest", function () {
    var s = Art.spr(16, 14);
    fill(s, 2, 4, 12, 8, C.wood);
    fill(s, 2, 4, 12, 3, C.woodL);
    fill(s, 2, 7, 12, 1, C.gold);
    fill(s, 7, 7, 2, 3, C.goldD);
    fill(s, 3, 11, 2, 2, C.woodD);
    fill(s, 11, 11, 2, 2, C.woodD);
    s.ax = 8;
    s.ay = 12;
    return s;
  });

  prop("chest_open", function () {
    var s = Art.spr(16, 16);
    fill(s, 2, 2, 12, 4, C.woodL);
    fill(s, 3, 3, 10, 2, C.woodD);
    fill(s, 2, 7, 12, 6, C.wood);
    fill(s, 4, 8, 8, 3, C.gold);
    plot(s, 6, 9, C.shardH);
    plot(s, 9, 9, C.warm);
    s.ax = 8;
    s.ay = 14;
    return s;
  });

  function lamp(lit) {
    var s = Art.spr(16, 32);
    fill(s, 7, 14, 2, 14, C.woodD);
    fill(s, 4, 26, 8, 3, C.stone);
    fill(s, 6, 10, 4, 4, C.wood);
    var gem = lit ? C.gold : C.violet;
    var hot = lit ? C.lite : C.core;
    plot(s, 8, 4, hot);
    plot(s, 6, 7, gem);
    plot(s, 8, 6, gem);
    plot(s, 10, 7, gem);
    plot(s, 8, 9, lit ? C.goldD : C.violetD);
    plot(s, 7, 7, hot);
    plot(s, 9, 7, gem);
    s.ax = 8;
    s.ay = 30;
    return s;
  }
  prop("lamp_lit", function () { return lamp(true); }, 2, 2);
  prop("lamp_cold", function () { return lamp(false); }, 2, 2);

  prop("shard", function () {
    var s = Art.spr(11, 15);
    plot(s, 5, 2, C.lite);
    plot(s, 4, 4, C.shardH);
    plot(s, 5, 4, C.white);
    plot(s, 6, 4, C.shardH);
    plot(s, 3, 6, C.shard);
    plot(s, 5, 6, C.shardH);
    plot(s, 7, 6, C.shard);
    plot(s, 2, 8, C.shardD);
    plot(s, 5, 8, C.shard);
    plot(s, 8, 8, C.shardD);
    plot(s, 4, 10, C.shard);
    plot(s, 5, 10, C.shardD);
    plot(s, 6, 10, C.shard);
    plot(s, 5, 12, C.shardD);
    s.ax = 5;
    s.ay = 13;
    return s;
  }, 2, 2);

  prop("cog", function () {
    var s = Art.spr(16, 16);
    fill(s, 4, 4, 8, 8, C.goldD);
    fill(s, 6, 6, 4, 4, C.woodD);
    fill(s, 7, 2, 2, 2, C.gold);
    fill(s, 7, 12, 2, 2, C.gold);
    fill(s, 2, 7, 2, 2, C.gold);
    fill(s, 12, 7, 2, 2, C.gold);
    plot(s, 3, 3, C.gold);
    plot(s, 12, 3, C.gold);
    plot(s, 3, 12, C.gold);
    plot(s, 12, 12, C.gold);
    plot(s, 7, 7, C.emberH);
    s.ax = 8;
    s.ay = 14;
    return s;
  }, 2, 2);

  prop("sign", function () {
    var s = Art.spr(16, 20);
    fill(s, 2, 2, 12, 9, C.woodL);
    fill(s, 3, 4, 8, 1, C.woodD);
    fill(s, 3, 6, 6, 1, C.woodD);
    fill(s, 7, 11, 2, 7, C.wood);
    s.ax = 8;
    s.ay = 18;
    return s;
  }, 2, 2);

  prop("tree", function () {
    var s = Art.spr(24, 36);
    fill(s, 11, 18, 3, 14, C.wood);
    fill(s, 10, 30, 5, 2, C.woodD);
    disc(s, 12, 14, 7, C.leaf);
    disc(s, 7, 16, 5, C.leafD);
    disc(s, 16, 15, 5, C.green);
    disc(s, 10, 10, 3, C.leafL);
    s.ax = 12;
    s.ay = 34;
    return s;
  }, 2, 2);

  prop("tree_bare", function () {
    var s = Art.spr(24, 36);
    fill(s, 11, 16, 3, 16, C.woodD);
    plot(s, 8, 14, C.wood);
    plot(s, 6, 12, C.woodD);
    plot(s, 15, 13, C.wood);
    plot(s, 17, 10, C.ash);
    plot(s, 12, 8, C.wood);
    plot(s, 12, 6, C.ashD);
    s.ax = 12;
    s.ay = 34;
    return s;
  }, 2, 2);

  prop("rock", function () {
    var s = Art.spr(16, 12);
    disc(s, 8, 6, 5, C.stone);
    disc(s, 6, 7, 3, C.stoneD);
    plot(s, 5, 5, C.stoneL);
    plot(s, 9, 4, C.stoneL);
    s.ax = 8;
    s.ay = 10;
    return s;
  }, 2, 2);

  function house(wall, wallD, roof, door, win) {
    var s = Art.spr(40, 32);
    fill(s, 6, 14, 28, 14, wall);
    fill(s, 6, 14, 4, 14, wallD);
    fill(s, 4, 10, 32, 6, roof);
    fill(s, 8, 6, 24, 5, roof);
    fill(s, 14, 4, 12, 3, C.woodD);
    fill(s, 17, 20, 6, 8, door);
    fill(s, 9, 18, 5, 4, win);
    fill(s, 26, 18, 5, 4, win);
    plot(s, 10, 19, C.lite);
    plot(s, 27, 19, C.lite);
    fill(s, 30, 8, 3, 8, C.stoneD);
    plot(s, 31, 6, C.ash);
    s.ax = 20;
    s.ay = 30;
    return s;
  }
  prop("cottage", function () { return house(C.cream, C.sand, C.shawl, C.wood, C.shard); }, 2, 2);
  prop("workshop", function () { return house(C.ashL, C.ash, C.vestD, C.woodD, C.warm); }, 2, 2);

  prop("stones", function () {
    var s = Art.spr(26, 22);
    fill(s, 3, 8, 4, 12, C.stone);
    fill(s, 10, 3, 5, 17, C.stoneL);
    fill(s, 18, 7, 4, 13, C.stoneD);
    fill(s, 11, 3, 2, 5, C.paper);
    fill(s, 4, 8, 1, 4, C.stoneL);
    s.ax = 13;
    s.ay = 20;
    return s;
  }, 2, 2);

  prop("ruin", function () {
    var s = Art.spr(22, 18);
    fill(s, 2, 6, 5, 10, C.stone);
    fill(s, 8, 3, 6, 13, C.stoneD);
    fill(s, 15, 8, 4, 8, C.stone);
    plot(s, 10, 6, C.ember);
    plot(s, 9, 10, C.stoneL);
    s.ax = 11;
    s.ay = 16;
    return s;
  }, 2, 2);

  prop("plank", function () {
    var s = Art.spr(18, 6);
    fill(s, 1, 2, 16, 2, C.woodL);
    plot(s, 4, 2, C.woodD);
    plot(s, 9, 3, C.woodD);
    plot(s, 13, 2, C.wood);
    s.ax = 9;
    s.ay = 4;
    return s;
  }, 2, 2);

  prop("flower", function () {
    var s = Art.spr(8, 10);
    fill(s, 3, 6, 1, 3, C.leaf);
    plot(s, 2, 3, C.bloom);
    plot(s, 4, 3, C.bloom);
    plot(s, 3, 2, C.bloom);
    plot(s, 3, 4, C.bloom);
    plot(s, 3, 3, C.gold);
    s.ax = 3;
    s.ay = 9;
    return s;
  }, 2, 2);

  prop("flower_gold", function () {
    var s = Art.spr(8, 10);
    fill(s, 3, 6, 1, 3, C.leafD);
    plot(s, 2, 3, C.warm);
    plot(s, 4, 3, C.gold);
    plot(s, 3, 2, C.warm);
    plot(s, 3, 4, C.goldD);
    plot(s, 3, 3, C.lite);
    s.ax = 3;
    s.ay = 9;
    return s;
  }, 2, 2);

  prop("flower_tide", function () {
    var s = Art.spr(8, 10);
    fill(s, 3, 6, 1, 3, C.weed);
    plot(s, 2, 3, C.tideL);
    plot(s, 4, 3, C.foam);
    plot(s, 3, 2, C.tide);
    plot(s, 3, 4, C.tideL);
    plot(s, 3, 3, C.lite);
    s.ax = 3;
    s.ay = 9;
    return s;
  }, 2, 2);

  prop("blossom", function () {
    var s = Art.spr(10, 12);
    fill(s, 4, 7, 1, 4, C.leaf);
    plot(s, 4, 3, C.bloom);
    plot(s, 2, 5, C.bloom);
    plot(s, 6, 5, C.bloom);
    plot(s, 3, 6, C.hp);
    plot(s, 5, 6, C.hp);
    plot(s, 4, 5, C.gold);
    s.ax = 4;
    s.ay = 11;
    return s;
  }, 2, 2);

  prop("bench", function () {
    var s = Art.spr(22, 12);
    fill(s, 2, 4, 18, 3, C.woodL);
    fill(s, 3, 7, 2, 3, C.woodD);
    fill(s, 17, 7, 2, 3, C.wood);
    fill(s, 2, 3, 18, 1, C.wood);
    s.ax = 11;
    s.ay = 10;
    return s;
  }, 2, 2);

  prop("skiff", function () {
    var s = Art.spr(48, 30);
    fill(s, 6, 14, 36, 8, C.wood);
    fill(s, 4, 16, 40, 4, C.woodD);
    fill(s, 10, 12, 16, 6, C.woodL);
    fill(s, 18, 8, 2, 14, C.woodD);
    plot(s, 20, 6, C.shardH);
    plot(s, 22, 10, C.paper);
    plot(s, 26, 14, C.shard);
    plot(s, 20, 16, C.cream);
    plot(s, 24, 12, C.gold);
    fill(s, 8, 15, 4, 2, C.teal);
    fill(s, 34, 15, 5, 2, C.scarf);
    plot(s, 14, 18, C.goldD);
    plot(s, 30, 18, C.woodL);
    s.ax = 24;
    s.ay = 24;
    return s;
  }, 2, 2);

  prop("hut", function () {
    var s = Art.spr(28, 24);
    var i;
    fill(s, 4, 12, 20, 9, C.sand);
    fill(s, 6, 14, 4, 3, C.gold);
    fill(s, 16, 14, 4, 3, C.woodD);
    fill(s, 11, 15, 6, 6, C.wood);
    for (i = 0; i < 7; i++) fill(s, 3 + i, 11 - i, 22 - i * 2, 1, i % 2 ? C.tealD : C.teal);
    fill(s, 12, 2, 3, 4, C.woodD);
    s.ax = 14;
    s.ay = 22;
    return s;
  });

  prop("stilt", function () {
    var s = Art.spr(22, 28);
    fill(s, 3, 10, 2, 16, C.woodD);
    fill(s, 16, 10, 2, 16, C.wood);
    fill(s, 1, 8, 20, 3, C.woodL);
    fill(s, 3, 6, 16, 2, C.tide);
    fill(s, 5, 4, 12, 2, C.wood);
    plot(s, 7, 5, C.foam);
    plot(s, 13, 5, C.gold);
    s.ax = 11;
    s.ay = 26;
    return s;
  });

  prop("stall", function () {
    var s = Art.spr(28, 22);
    fill(s, 6, 16, 2, 4, C.woodD);
    fill(s, 20, 16, 2, 4, C.wood);
    fill(s, 3, 12, 22, 5, C.wood);
    fill(s, 5, 13, 6, 3, C.gold);
    fill(s, 14, 13, 7, 3, C.scarf);
    fill(s, 2, 6, 24, 6, C.red);
    fill(s, 4, 7, 20, 2, C.redD);
    fill(s, 2, 11, 24, 1, C.woodD);
    s.ax = 14;
    s.ay = 20;
    return s;
  });

  prop("wreckhull", function () {
    var s = Art.spr(36, 24);
    fill(s, 4, 12, 26, 7, C.woodD);
    fill(s, 2, 16, 32, 4, C.rock);
    fill(s, 8, 6, 3, 12, C.wood);
    fill(s, 20, 4, 2, 12, C.bone);
    fill(s, 6, 13, 12, 2, C.ash);
    plot(s, 24, 14, C.tide);
    plot(s, 26, 15, C.weed);
    plot(s, 12, 8, C.goldD);
    plot(s, 14, 15, C.foam);
    s.ax = 18;
    s.ay = 21;
    return s;
  });

  prop("gatearch", function () {
    var s = Art.spr(32, 28);
    fill(s, 2, 8, 6, 16, C.stone);
    fill(s, 24, 8, 6, 16, C.stoneD);
    fill(s, 2, 4, 28, 6, C.stoneL);
    fill(s, 8, 10, 16, 14, C.woodD);
    fill(s, 10, 12, 12, 2, C.goldD);
    fill(s, 15, 12, 2, 10, C.gold);
    plot(s, 16, 6, C.gold);
    plot(s, 8, 6, C.stone);
    s.ax = 16;
    s.ay = 26;
    return s;
  });

  prop("raft", function () {
    var s = Art.spr(40, 18);
    var x;
    fill(s, 2, 8, 36, 6, C.wood);
    fill(s, 2, 12, 36, 2, C.woodD);
    for (x = 4; x < 36; x += 6) fill(s, x, 8, 1, 6, C.woodD);
    fill(s, 6, 4, 8, 5, C.woodL);
    fill(s, 24, 3, 8, 6, C.violetD);
    plot(s, 26, 5, C.gold);
    plot(s, 30, 5, C.gold);
    s.ax = 20;
    s.ay = 16;
    return s;
  });

  prop("signpost", function () {
    var s = Art.spr(18, 20);
    fill(s, 8, 8, 2, 10, C.woodD);
    fill(s, 2, 2, 14, 8, C.paper);
    fill(s, 3, 3, 12, 6, C.sand);
    plot(s, 5, 5, C.ink);
    plot(s, 7, 5, C.ink);
    plot(s, 9, 6, C.ink);
    plot(s, 11, 5, C.ink);
    s.ax = 9;
    s.ay = 18;
    return s;
  });

  prop("inn", function () {
    var s = Art.spr(14, 24);
    fill(s, 6, 10, 2, 12, C.woodD);
    fill(s, 3, 20, 8, 2, C.wood);
    fill(s, 4, 3, 6, 7, C.gold);
    fill(s, 5, 4, 4, 5, C.warm);
    plot(s, 6, 6, C.lite);
    plot(s, 3, 8, C.goldD);
    plot(s, 10, 8, C.goldD);
    s.ax = 7;
    s.ay = 22;
    return s;
  });

  prop("bell", function () {
    var s = Art.spr(12, 18);
    fill(s, 5, 2, 2, 3, C.wood);
    fill(s, 3, 5, 6, 7, C.gold);
    fill(s, 2, 10, 8, 2, C.goldD);
    plot(s, 6, 13, C.gold);
    s.ax = 6;
    s.ay = 16;
    return s;
  }, 2, 2);

  function disc(s, cx, cy, r, c) {
    var y, x;
    for (y = -r; y <= r; y++) {
      for (x = -r; x <= r; x++) {
        if (x * x + y * y <= r * r + r) plot(s, cx + x, cy + y, c);
      }
    }
  }

  function noiseTile(name, a, b, c, d, accent) {
    tile(name, function () {
      var s = Art.spr(16, 16);
      var y, x, n, h;
      for (y = 0; y < 16; y++) {
        for (x = 0; x < 16; x++) {
          h = (x * 13 + y * 7 + (x * y) % 5) % 7;
          n = h < 2 ? a : (h < 4 ? b : (h < 6 ? c : d));
          plot(s, x, y, n);
        }
      }
      if (accent) {
        plot(s, 3, 5, accent);
        plot(s, 11, 12, accent);
        plot(s, 8, 2, a);
      }
      s.ax = 8;
      s.ay = 8;
      return s;
    });
  }

  noiseTile("grass", C.grass, C.grassD, C.grassL, C.grassX, C.leafL);
  noiseTile("grass_light", C.grassL, C.grass, C.leafL, C.grassD, C.warm);
  noiseTile("grass_dark", C.grassD, C.grassX, C.grass, C.leafD, C.grassX);
  noiseTile("cliff", C.cliff, C.cliffD, C.cliffL, C.cliffX, C.cliffL);
  noiseTile("shore", C.tide, C.leaf, C.tideL, C.tideD, C.foam);
  noiseTile("shore_light", C.tideL, C.foam, C.grassL, C.tide, C.lite);
  noiseTile("gold", C.goldD, C.sand, C.warm, C.wood, C.gold);
  noiseTile("gold_light", C.warm, C.gold, C.sand, C.goldD, C.lite);
  noiseTile("ash", C.ash, C.ashD, C.rock, C.ashL, C.ember);
  noiseTile("ash_light", C.ashL, C.ash, C.sand, C.ember, C.emberH);
  noiseTile("stone", C.stone, C.stoneD, C.stoneL, C.armorD, C.stoneL);
  noiseTile("stone_light", C.stoneL, C.stone, C.paper, C.stoneD, C.warm);
  noiseTile("vault", C.rock, C.ashD, C.cliffX, C.void, C.ember);
  noiseTile("path", C.path, C.pathD, C.pathL, C.wood, C.pathL);
  noiseTile("cobble", C.stone, C.ash, C.stoneD, C.tideD, C.stoneL);
  noiseTile("plank", C.wood, C.woodD, C.woodL, C.woodD, C.woodL);
  noiseTile("dock", C.tide, C.wood, C.tideD, C.woodD, C.foam);
  noiseTile("pier", C.woodL, C.wood, C.tide, C.woodD, C.foam);
  noiseTile("sand", C.sand, C.gold, C.warm, C.goldD, C.foam);
  noiseTile("hold", C.woodD, C.rock, C.ashD, C.void, C.bone);
  noiseTile("wood", C.woodL, C.wood, C.woodD, C.goldD, C.woodL);

  Art.pattern = function (name) {
    if (!Art._patterns) Art._patterns = {};
    if (Art._patterns[name]) return Art._patterns[name];
    var frame = Art.frameOf("tile_" + name, "walk", "down", 0);
    Art._patterns[name] = frame;
    return frame;
  };

  Art.fillPattern = function (ctx, name) {
    var tileCanvas = Art.pattern(name);
    if (!tileCanvas) return;
    var pat = ctx.createPattern(tileCanvas, "repeat");
    if (!pat) return;
    ctx.fillStyle = pat;
    ctx.fill();
  };

  function cloud(w, h, colors) {
    var s = Art.spr(w, h);
    var y, x, cy, dx, dy;
    cy = (h / 2) | 0;
    for (y = 0; y < h; y++) {
      for (x = 0; x < w; x++) {
        dx = (x - w / 2) / (w / 2);
        dy = (y - cy) / (h / 2);
        if (dx * dx + dy * dy > 1) continue;
        var band = (x + y * 3) % colors.length;
        plot(s, x, y, colors[band]);
      }
    }
    // puff bumps
    disc(s, (w * 0.3) | 0, cy, (h * 0.45) | 0, colors[0]);
    disc(s, (w * 0.62) | 0, cy - 1, (h * 0.4) | 0, colors[1] || colors[0]);
    Art.outline(s);
    return Art.raster(s);
  }

  Art.clouds = function () {
    if (Art._cloudSprites) return Art._cloudSprites;
    Art._cloudSprites = [
      cloud(28, 14, [C.cloudW, C.cloud, C.hushP]),
      cloud(36, 16, [C.cloud, C.hushL, C.cloudW]),
      cloud(22, 12, [C.hushP, C.cloud, C.hushL]),
      cloud(40, 18, [C.cloudW, C.hushP, C.cloud])
    ];
    return Art._cloudSprites;
  };

  Art.islandCard = function (biome, width) {
    width = width || 96;
    var key = biome + "|" + width;
    if (!Art._isles) Art._isles = {};
    if (Art._isles[key]) return Art._isles[key];
    var grass = "grass";
    var cliff = "cliff";
    if (biome === "gold") grass = "gold";
    else if (biome === "shore") grass = "shore";
    else if (biome === "salt") { grass = "dock"; cliff = "pier"; }
    else if (biome === "ash") grass = "ash";
    else if (biome === "stone" || biome === "gull") { grass = "stone"; cliff = "stone"; }
    else if (biome === "drift") { grass = "plank"; cliff = "pier"; }
    else if (biome === "hs") { grass = "cobble"; cliff = "stone"; }
    else if (biome === "wreck") { grass = "hold"; cliff = "hold"; }
    var h = Math.round(width * 0.72);
    var canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = h;
    var g = canvas.getContext("2d");
    g.imageSmoothingEnabled = false;
    function blobAt(y0, name, rx, ry) {
      g.save();
      g.beginPath();
      g.ellipse(width / 2, y0, rx, ry, 0, 0, Math.PI * 2);
      g.clip();
      g.fillStyle = g.createPattern(Art.pattern(name), "repeat");
      g.fillRect(0, 0, width, h);
      g.restore();
    }
    blobAt(h * 0.62, cliff, width * 0.42, h * 0.22);
    blobAt(h * 0.48, grass, width * 0.38, h * 0.16);
    // tiny tree
    var tree = Art.frameOf("tree", "walk", "down", 0);
    g.drawImage(tree, width * 0.32, h * 0.22, 16, 24);
    if (biome === "ash") {
      var bare = Art.frameOf("tree_bare", "walk", "down", 0);
      g.drawImage(bare, width * 0.55, h * 0.24, 14, 22);
    } else {
      var lamp = Art.frameOf(biome === "gold" ? "lamp_cold" : "lamp_lit", "walk", "down", 0);
      g.drawImage(lamp, width * 0.58, h * 0.18, 10, 20);
    }
    Art._isles[key] = canvas;
    return canvas;
  };
})();
