"use strict";

// Tiles, markers, and the Hush cloud stamps. Ground patterns repeat 1:1
// in world space. Trees and plants live in js/art/props.js. Structures
// live in js/art/buildings.js.
(function () {
  var C = Art.C;
  var plot = Art.plot;
  var fill = Art.fill;

  function prop(id, maker, scale) {
    Art.add(id, function () {
      var s = maker();
      Art.outline(s);
      return s;
    }, scale == null ? 2 : scale, 1);
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

  function disc(s, cx, cy, r, c) {
    var y, x;
    for (y = -r; y <= r; y++) {
      for (x = -r; x <= r; x++) {
        if (x * x + y * y <= r * r + r) plot(s, cx + x, cy + y, c);
      }
    }
  }

  function tileHash(x, y, n) {
    var h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(n, 1442695041)) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
    return (h ^ (h >>> 16)) >>> 0;
  }

  function organicTile(name, spec) {
    tile(name, function () {
      var S = 16;
      var s = Art.spr(S, S);
      var colors = spec.colors;
      var x, y, h;
      for (y = 0; y < S; y++) {
        for (x = 0; x < S; x++) plot(s, x, y, colors[0]);
      }
      h = tileHash(spec.salt, 3, spec.salt);
      if (spec.tufts) {
        plot(s, 3 + (h % 2), 10, spec.tuft || colors[1]);
        plot(s, 4 + (h % 2), 9, spec.hi || spec.tuft || colors[2]);
        plot(s, 4 + (h % 2), 10, spec.tuft || colors[1]);
      }
      if (spec.specks && (h % 3) !== 0) plot(s, 11, 4, spec.speck || colors[2]);
      if (spec.rock && (h % 4) === 0) plot(s, 12, 12, spec.rock);
      s.ax = 0;
      s.ay = 0;
      return s;
    });
  }

  function cellTile(name, pal) {
    tile(name, function () {
      var s = Art.spr(16, 16);
      var y, x, block;
      for (y = 0; y < 16; y++) {
        for (x = 0; x < 16; x++) {
          block = ((x >> 3) + (y >> 3)) & 1;
          plot(s, x, y, block ? pal.a : pal.b);
        }
      }
      for (x = 0; x < 16; x++) {
        plot(s, x, 0, pal.grout);
        plot(s, x, 15, pal.grout);
        plot(s, x, 8, pal.grout);
      }
      for (y = 0; y < 16; y++) {
        plot(s, 0, y, pal.grout);
        plot(s, 15, y, pal.grout);
        plot(s, 8, y, pal.grout);
      }
      if (pal.tuft) {
        plot(s, 3, 3, pal.tuft);
        plot(s, 4, 3, pal.hi || pal.tuft);
        plot(s, 3, 4, pal.hi || pal.a);
        plot(s, 11, 11, pal.tuft);
        plot(s, 12, 10, pal.hi || pal.tuft);
      }
      if (pal.speck) {
        plot(s, 5, 12, pal.speck);
        plot(s, 12, 4, pal.speck);
        plot(s, 6, 6, pal.speck);
      }
      s.ax = 8;
      s.ay = 8;
      return s;
    });
  }

  organicTile("grass", { salt: 11, colors: [C.grass, C.grassD, C.grassL, C.leaf], tufts: 18, tuft: C.leaf, hi: C.leafL });
  organicTile("grass_light", { salt: 23, colors: [C.grassL, C.grass, C.grassD, C.warm], tufts: 14, tuft: C.leafL, hi: C.grassL });
  organicTile("grass_dark", { salt: 37, colors: [C.grassD, C.grassX, C.grass, C.leafD], tufts: 16, tuft: C.grass, hi: C.leaf });
  organicTile("cliff", { salt: 151, colors: [C.cliff, C.cliffD, C.cliffX, C.stoneD], specks: 8, speck: C.cliffL, rock: C.cliffX });
  organicTile("shore", { salt: 157, colors: [C.tide, C.tideD, C.sand, C.foam], tufts: 6, tuft: C.weed, hi: C.tideL, specks: 4, speck: C.foam });
  organicTile("shore_light", { salt: 163, colors: [C.tideL, C.foam, C.sand, C.tide], tufts: 4, tuft: C.grassL, specks: 3, speck: C.foam });
  organicTile("gold", { salt: 167, colors: [C.path, C.pathD, C.sand, C.stone], tufts: 5, tuft: C.grassD, specks: 4, speck: C.goldD, rock: C.stoneD });
  organicTile("gold_light", { salt: 173, colors: [C.sand, C.pathL, C.warm, C.path], tufts: 3, tuft: C.grass, specks: 3, speck: C.goldD });
  organicTile("ash", { salt: 41, colors: [C.stoneD, C.ashD, C.stone, C.rock], specks: 4, speck: C.stone, rock: C.cliffX });
  organicTile("ash_light", { salt: 53, colors: [C.ash, C.stone, C.ashD, C.stoneL], specks: 3, speck: C.ashL, rock: C.stoneD });
  organicTile("ash_rock", { salt: 67, colors: [C.rock, C.stoneD, C.cliffX, C.ashD], specks: 6, speck: C.stone, rock: C.cliffX });
  organicTile("ash_ember", { salt: 71, colors: [C.ashD, C.stoneD, C.rock, C.cliffX], specks: 5, speck: C.ember, rock: C.stoneD });
  organicTile("stone", { salt: 89, colors: [C.stone, C.stoneD, C.stoneL, C.ash], specks: 6, speck: C.stoneL, rock: C.stoneD });
  organicTile("stone_light", { salt: 97, colors: [C.stoneL, C.stone, C.ash, C.sand], specks: 4, speck: C.ashL, rock: C.stone });
  organicTile("vault", { salt: 83, colors: [C.rock, C.ashD, C.stoneD, C.void], specks: 4, speck: C.ember, rock: C.cliffX });
  organicTile("path", { salt: 103, colors: [C.path, C.pathD, C.sand, C.wood], tufts: 4, tuft: C.grassD, specks: 6, speck: C.pathL, rock: C.stone });
  organicTile("cobble", { salt: 109, colors: [C.stone, C.ash, C.stoneD, C.stoneL], specks: 5, speck: C.stoneL, rock: C.stoneD });
  organicTile("plank", { salt: 113, colors: [C.wood, C.woodD, C.woodL, C.pathD], specks: 3, speck: C.woodD });
  organicTile("dock", { salt: 127, colors: [C.wood, C.tideD, C.woodD, C.tide], specks: 4, speck: C.foam, rock: C.woodD });
  organicTile("pier", { salt: 131, colors: [C.woodL, C.wood, C.woodD, C.tide], specks: 3, speck: C.foam });
  organicTile("sand", { salt: 137, colors: [C.sand, C.goldD, C.pathL, C.foam], specks: 5, speck: C.foam, rock: C.path });
  organicTile("hold", { salt: 139, colors: [C.woodD, C.rock, C.ashD, C.void], specks: 4, speck: C.bone, rock: C.stoneD });
  organicTile("wood", { salt: 149, colors: [C.woodL, C.wood, C.woodD, C.path], specks: 3, speck: C.woodD });

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

// Structures live in js/art/buildings.js. This insert keeps that file on the
// parser's script list without a new index.html src (sw.js is left alone).
// document.write during parse runs before js/art/props.js.
if (typeof document !== "undefined" && document.readyState === "loading") {
  document.write('<script src="js/art/buildings.js"><\/script>');
}
