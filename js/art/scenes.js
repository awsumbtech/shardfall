"use strict";

// Battle backdrops and the blue menu window. Each backdrop is painted on a
// small pixel grid, then scaled up with nearest-neighbor. Motion is a slow
// cloud shift and stops when Reduce flashing or reduced motion is on.
(function () {
  var C = Art.C;

  function Scene(w, h) {
    this.w = w;
    this.h = h;
    this.c = document.createElement("canvas");
    this.c.width = w;
    this.c.height = h;
    this.g = this.c.getContext("2d");
    this.g.imageSmoothingEnabled = false;
  }
  Scene.prototype.rect = function (x, y, w, h, hex) {
    this.g.fillStyle = hex;
    this.g.fillRect(x | 0, y | 0, w | 0, h | 0);
  };
  Scene.prototype.bands = function (y0, y1, colors) {
    var span = Math.max(1, y1 - y0);
    var g = this.g;
    var cols = colors.map(function (hex) {
      return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
    });
    var y, t, i, local, c0, c1;
    for (y = y0; y < y1; y++) {
      t = (y - y0) / span * (cols.length - 1);
      i = Math.min(cols.length - 2, Math.floor(t));
      local = t - i;
      c0 = cols[i];
      c1 = cols[i + 1];
      g.fillStyle = "rgb(" +
        ((c0[0] + (c1[0] - c0[0]) * local) | 0) + "," +
        ((c0[1] + (c1[1] - c0[1]) * local) | 0) + "," +
        ((c0[2] + (c1[2] - c0[2]) * local) | 0) + ")";
      g.fillRect(0, y | 0, this.w, 1);
    }
  };
  Scene.prototype.stamp = function (id, x, y, scale, pose, facing, frame) {
    var canvas = Art.frameOf(id, pose || "walk", facing || "down", frame || 0);
    var sc = scale || 1;
    this.g.drawImage(canvas, x | 0, y | 0, canvas.width * sc, canvas.height * sc);
  };
  Scene.prototype.tileRow = function (name, y, scale) {
    var canvas = Art.pattern(name);
    var sc = scale || 1;
    var tw = canvas.width * sc;
    var x;
    for (x = 0; x < this.w; x += tw) this.g.drawImage(canvas, x, y, tw, canvas.height * sc);
  };
  Scene.prototype.crack = function () {};

  var DUSK = ["#140c28", "#241448", "#3a2060", "#6a4068", "#c47868", "#e8a888", "#f0c4a8"];
  var ASH = ["#1c100c", "#3a2018", "#6a3828", "#a85838", "#e08858", "#f0b088"];
  var NIGHT = ["#100818", "#1a1030", "#2a1848", "#4a3058", "#8a6070", "#c49088"];
  var VAULT = ["#140c10", "#241418", "#3a2420", "#4a3028"];

  function ground(sc, name, y) {
    var row = 0;
    while (y + row < sc.h) {
      sc.tileRow(name, y + row, 1);
      row += 16;
    }
  }

  function propTop(sc, spriteH) {
    return Math.max(2, Math.floor(sc.h * 0.28) - spriteH);
  }

  function meadow(sc) {
    sc.bands(0, Math.floor(sc.h * 0.62), DUSK);
    sc.crack(Math.floor(sc.h * 0.08));
    sc.stamp("tree", 2, propTop(sc, 36), 1);
    sc.stamp("tree", Math.max(2, sc.w - 26), Math.max(2, propTop(sc, 36) - 4), 1);
    sc.stamp("lamp_lit", Math.floor(sc.w * 0.46), propTop(sc, 32), 1);
    ground(sc, "grass", Math.floor(sc.h * 0.58));
    sc.tileRow("path", Math.floor(sc.h * 0.72), 1);
    sc.stamp("flower", 20, Math.floor(sc.h * 0.7), 1);
    sc.stamp("flower_gold", sc.w - 30, Math.floor(sc.h * 0.78), 1);
  }

  function scar(sc) {
    sc.bands(0, Math.floor(sc.h * 0.6), NIGHT);
    sc.crack(Math.floor(sc.h * 0.1));
    ground(sc, "grass_dark", Math.floor(sc.h * 0.55));
    sc.stamp("rock", 12, Math.floor(sc.h * 0.72), 1);
    sc.stamp("rock", sc.w - 40, Math.floor(sc.h * 0.76), 1);
    sc.stamp("ruin", Math.floor(sc.w * 0.5) - 10, propTop(sc, 18), 1);
  }

  function ash(sc) {
    sc.bands(0, Math.floor(sc.h * 0.58), ASH);
    sc.crack(Math.floor(sc.h * 0.14));
    ground(sc, "ash", Math.floor(sc.h * 0.55));
    sc.stamp("tree_dead", 2, propTop(sc, 36), 1);
    sc.stamp("tree_dead_snap", Math.max(2, sc.w - 26), Math.max(2, propTop(sc, 36) - 4), 1);
    sc.stamp("rock", sc.w / 2, Math.floor(sc.h * 0.7), 1);
    sc.rect(16, Math.floor(sc.h * 0.8), 28, 2, Art.hex(C.ember));
    sc.rect(sc.w - 50, Math.floor(sc.h * 0.74), 20, 2, Art.hex(C.emberH));
  }

  function vault(sc) {
    sc.bands(0, sc.h, VAULT);
    var col;
    for (col = 0; col < 4; col++) {
      sc.rect(8 + col * Math.floor(sc.w / 4), 10, 10, Math.floor(sc.h * 0.7), Art.hex(col % 2 ? C.stoneD : C.rock));
    }
    ground(sc, "vault", Math.floor(sc.h * 0.72));
    sc.stamp("lamp_lit", Math.floor(sc.w * 0.46), propTop(sc, 32), 1);
    sc.rect(sc.w / 2 - 6, Math.floor(sc.h * 0.62), 12, 8, Art.hex(C.ember));
    sc.rect(sc.w / 2 - 3, Math.floor(sc.h * 0.64), 6, 4, Art.hex(C.lite));
  }

  function shore(sc) {
    sc.bands(0, Math.floor(sc.h * 0.42), DUSK);
    sc.crack(Math.floor(sc.h * 0.1));
    sc.bands(Math.floor(sc.h * 0.42), Math.floor(sc.h * 0.62), [Art.hex(C.hushD), Art.hex(C.hush), Art.hex(C.tide), Art.hex(C.tideL)]);
    var y = Math.floor(sc.h * 0.58);
    sc.tileRow("plank", y, 1);
    sc.tileRow("plank", y + 16, 1);
    sc.rect(10, y - 28, 3, 30, Art.hex(C.woodD));
    sc.rect(sc.w - 20, y - 36, 3, 38, Art.hex(C.wood));
    sc.stamp("cottage", 18, y - 34, 1);
    sc.stamp("sign", sc.w - 36, y - 8, 1);
    sc.rect(4, y + 30, sc.w, sc.h, Art.hex(C.tideD));
  }

  function wreck(sc) {
    sc.bands(0, Math.floor(sc.h * 0.5), NIGHT);
    sc.bands(Math.floor(sc.h * 0.45), sc.h, [Art.hex(C.tideD), Art.hex(C.sea), Art.hex(C.hushD)]);
    var i;
    for (i = 0; i < 5; i++) {
      sc.rect(12 + i * 18, Math.floor(sc.h * 0.3) + (i % 2) * 8, 4, Math.floor(sc.h * 0.4), Art.hex(C.woodD));
    }
    sc.stamp("plank", 20, Math.floor(sc.h * 0.62), 1);
    sc.stamp("plank", sc.w / 2, Math.floor(sc.h * 0.7), 1);
    sc.stamp("chest", sc.w - 40, Math.floor(sc.h * 0.6), 1);
    sc.rect(sc.w / 2 - 8, Math.floor(sc.h * 0.48), 10, 6, Art.hex(C.tideL));
  }

  function road(sc) {
    sc.bands(0, Math.floor(sc.h * 0.45), DUSK);
    sc.crack(8);
    ground(sc, "stone", Math.floor(sc.h * 0.4));
    sc.rect(0, Math.floor(sc.h * 0.4), sc.w, 8, Art.hex(C.cliff));
    var step;
    for (step = 0; step < 4; step++) {
      var y = Math.floor(sc.h * 0.5) + step * 16;
      var inset = step * 8;
      sc.rect(inset, y, sc.w - inset * 2, 10, Art.hex(step % 2 ? C.path : C.stoneL));
    }
    sc.rect(sc.w / 2 - 16, 18, 32, 28, Art.hex(C.stoneD));
    sc.rect(sc.w / 2 - 6, 28, 12, 18, Art.hex(C.void));
    sc.rect(8, 16, 4, 22, Art.hex(C.stone));
    sc.rect(sc.w - 12, 12, 4, 26, Art.hex(C.stoneL));
    sc.rect(sc.w / 2 - 18, 22, 3, 10, Art.hex(C.stole));
    sc.rect(sc.w / 2 + 16, 22, 3, 10, Art.hex(C.hem));
  }

  function deck(sc) {
    sc.bands(0, Math.floor(sc.h * 0.46), DUSK);
    sc.crack(Math.floor(sc.h * 0.08));
    sc.bands(Math.floor(sc.h * 0.4), Math.floor(sc.h * 0.62), [Art.hex(C.hushP), Art.hex(C.hushL), Art.hex(C.hush), Art.hex(C.hushD)]);
    ground(sc, "plank", Math.floor(sc.h * 0.6));
    sc.rect(0, Math.floor(sc.h * 0.6), sc.w, 3, Art.hex(C.woodD));
    sc.rect(4, Math.floor(sc.h * 0.58), 3, 20, Art.hex(C.wood));
    sc.rect(sc.w - 8, Math.floor(sc.h * 0.58), 3, 20, Art.hex(C.wood));
    sc.stamp("skiff", sc.w / 2 - 24, Math.floor(sc.h * 0.28), 1);
  }

  var SCENES = {
    emberhold_meadow: meadow,
    emberhold_scar: scar,
    cinderveil_ash: ash,
    ember_vault: vault,
    saltmere_shore: shore,
    saltmere_wreck: wreck,
    highspire_road: road,
    hush_deck: deck
  };

  Art.BG_IDS = Object.keys(SCENES);

  var plates = {};
  var clouds = null;

  function cloudLayer() {
    if (clouds) return clouds;
    clouds = document.createElement("canvas");
    clouds.width = 180;
    clouds.height = 48;
    var g = clouds.getContext("2d");
    var stamps = Art.clouds();
    var i;
    for (i = 0; i < stamps.length; i++) {
      g.drawImage(stamps[i], 8 + i * 40, 8 + (i % 2) * 10);
    }
    return clouds;
  }

  function plate(id, pw, ph) {
    var key = id + "|" + pw + "|" + ph;
    if (plates[key]) return plates[key];
    var sc = new Scene(pw, ph);
    (SCENES[id] || meadow)(sc);
    plates[key] = sc.c;
    var keys = Object.keys(plates);
    if (keys.length > 24) delete plates[keys[0]];
    return sc.c;
  }

  Art.battleBg = function (ctx, bgId, w, h, t) {
    if (!ctx || !(w > 0) || !(h > 0)) return;
    var id = SCENES[bgId] ? bgId : "emberhold_meadow";
    var pix = Math.max(2, Math.round(Math.min(w, h) / 160));
    var pw = Math.max(80, Math.round(w / pix));
    var ph = Math.max(80, Math.round(h / pix));
    var src = plate(id, pw, ph);
    var calm = Art.calm();
    var drift = calm ? 0 : Math.floor((t || 0) * 6) % 48;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    ctx.clip();
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#140c28";
    ctx.fillRect(0, 0, w, h);
    Art.blit(ctx, src, 0, 0, w, h);
    if (!calm) {
      ctx.globalAlpha = 0.85;
      var layer = cloudLayer();
      var dw = Math.round(w * 0.9);
      var dh = Math.round(h * 0.16);
      Art.blit(ctx, layer, -drift, Math.round(h * 0.04), dw, dh);
      Art.blit(ctx, layer, Math.round(w * 0.42) - drift, Math.round(h * 0.01), dw, dh);
    }
    ctx.restore();
  };

  // 9-slice FF window skin, painted once.
  function skin() {
    if (Art._skin) return Art._skin;
    var s = document.createElement("canvas");
    var n = 24;
    s.width = n;
    s.height = n;
    var g = s.getContext("2d");
    g.fillStyle = "#0a1848";
    g.fillRect(0, 0, n, n);
    g.fillStyle = "#163878";
    g.fillRect(4, 4, n - 8, n - 8);
    g.fillStyle = "#1e4c98";
    g.fillRect(6, 6, n - 12, 6);
    g.fillStyle = "#f4f0e4";
    g.fillRect(0, 0, n, 2);
    g.fillRect(0, n - 2, n, 2);
    g.fillRect(0, 0, 2, n);
    g.fillRect(n - 2, 0, 2, n);
    g.fillStyle = "#07102a";
    g.fillRect(2, 2, n - 4, 2);
    g.fillRect(2, n - 4, n - 4, 2);
    g.fillRect(2, 2, 2, n - 4);
    g.fillRect(n - 4, 2, 2, n - 4);
    g.fillStyle = "#8ec8f0";
    g.fillRect(4, 4, n - 8, 1);
    g.fillRect(4, 4, 1, n - 8);
    Art._skin = s;
    return s;
  }

  Art.window = function (ctx, x, y, w, h, opts) {
    if (!ctx || w < 8 || h < 8) return { x: x, y: y, w: w, h: h };
    opts = opts || {};
    var src = skin();
    var m = 8;
    x = Math.round(x);
    y = Math.round(y);
    w = Math.round(w);
    h = Math.round(h);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    function bit(sx, sy, sw, sh, dx, dy, dw, dh) {
      ctx.drawImage(src, sx, sy, sw, sh, dx, dy, dw, dh);
    }
    bit(0, 0, m, m, x, y, m, m);
    bit(16, 0, m, m, x + w - m, y, m, m);
    bit(0, 16, m, m, x, y + h - m, m, m);
    bit(16, 16, m, m, x + w - m, y + h - m, m, m);
    bit(8, 0, 8, m, x + m, y, w - m * 2, m);
    bit(8, 16, 8, m, x + m, y + h - m, w - m * 2, m);
    bit(0, 8, m, 8, x, y + m, m, h - m * 2);
    bit(16, 8, m, 8, x + w - m, y + m, m, h - m * 2);
    bit(8, 8, 8, 8, x + m, y + m, w - m * 2, h - m * 2);
    if (opts.title) {
      ctx.font = "700 12px Palatino, Georgia, serif";
      ctx.fillStyle = "#f0d878";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(String(opts.title), x + 12, y + 8);
    }
    ctx.restore();
    var pad = opts.title ? 26 : 12;
    return { x: x + 12, y: y + pad, w: w - 24, h: h - pad - 12 };
  };

  Art.preload = (function (prev) {
    return function () {
      if (prev) prev();
      Art.clouds();
      var i;
      for (i = 0; i < Art.BG_IDS.length; i++) plate(Art.BG_IDS[i], 120, 180);
    };
  })(Art.preload);
})();
