// PREVIEW ONLY (box-local). Prototype of the PR 5 prop registry + dense decor layer.
// Kenmi PNGs load from the local server (/kenmi/...). Never ship this file.
(function () {
  var SF = window.SF, Art = window.Art;
  var BASE = "/kenmi/";
  var SHEETS = {
    bigOak: "Trees/Big_Oak_Tree.png",
    bigSpruce: "Trees/Big_Spruce_tree.png",
    medOak: "Trees/Medium_Oak_Tree.png",
    medSpruce: "Trees/Medium_Spruce_Tree.png",
    fruit: "Trees/Big_Fruit_Tree.png",
    medFruit: "Trees/Medium_Fruit_Tree.png",
    apple: "Crops/Apple_Tree.png",
    decor: "Outdoor decoration/Outdoor_Decor.png",
    fences: "Outdoor decoration/Fences.png",
    house: "Buildings/Buildings/Houses/Wood/House_1_Wood_Base_Red.png",
    lamps: "Outdoor decoration/Lanter_Posts.png",
    chest: "Buildings/House_Decor/Chest_Anim.png",
    boat: "Outdoor decoration/Boat.png",
    smoke: "Buildings/House_Decor/Chimney_smoke_Anim.png",
    flowers: "Outdoor decoration/Flowers.png"
  };

  // One entry per art id. r = source rect [x,y,w,h]; a = foot anchor in that rect.
  // frames: n frames stepping dx px to the right; rate = frames per second.
  var ENTRIES = {
    tree_oak:     { s: "bigOak",    r: [64, 0, 64, 80], a: [32, 63], canopy: true, flip: true },
    tree_broad:   { s: "bigOak",    r: [64, 0, 64, 80], a: [32, 63], canopy: true, flip: true },
    tree_oak_b:   { s: "medOak",    r: [32, 0, 32, 48], a: [16, 31], canopy: true, flip: true },
    tree_broad_b: { s: "medOak",    r: [32, 0, 32, 48], a: [16, 31], canopy: true, flip: true },
    tree_pine:    { s: "bigSpruce", r: [64, 0, 64, 80], a: [32, 63], canopy: true, flip: true },
    tree_pine_b:  { s: "medSpruce", r: [32, 0, 32, 48], a: [16, 31], canopy: true, flip: true },
    tree_birch:   { s: "fruit",     r: [32, 0, 32, 64], a: [15, 47], canopy: true, flip: true },
    tree_birch_b: { s: "medFruit",  r: [32, 0, 32, 64], a: [15, 47], canopy: true, flip: true },
    tree_apple:   { s: "apple",     r: [0, 0, 32, 64],  a: [15, 47], canopy: true },
    bush:         { s: "decor", r: [80, 80, 16, 16],  a: [8, 14], flip: true },
    bush_b:       { s: "decor", r: [80, 144, 16, 16], a: [8, 14], flip: true },
    rock:         { s: "decor", r: [96, 96, 16, 16],  a: [8, 13], flip: true },
    rock_b:       { s: "decor", r: [48, 96, 16, 16],  a: [8, 13], flip: true },
    stump:        { s: "decor", r: [16, 96, 16, 16],  a: [8, 13] },
    log:          { s: "decor", r: [64, 112, 32, 16], a: [16, 13], flip: true },
    tuft:         { s: "decor", r: [32, 32, 16, 16],  a: [8, 13], flip: true },
    tuft_b:       { s: "decor", r: [0, 32, 16, 16],   a: [8, 13], flip: true },
    tuft_bloom:   { s: "decor", r: [96, 32, 16, 16],  a: [8, 13], flip: true },
    flower:       { s: "decor", r: [48, 16, 16, 16],  a: [8, 12], flip: true },
    flower_gold:  { s: "decor", r: [48, 32, 16, 16],  a: [8, 12], flip: true },
    flower_tide:  { s: "decor", r: [0, 0, 16, 16],    a: [8, 12], flip: true },
    blossom:      { s: "decor", r: [48, 0, 16, 16],   a: [8, 12], flip: true },
    // ---- dense layer rows (Outdoor_Decor + Flowers) ----
    tuft_c:          { s: "decor", r: [16, 32, 16, 16],  a: [8, 13], flip: true },
    flower_tide_b:   { s: "decor", r: [16, 0, 16, 16],   a: [8, 12], flip: true },
    flower_tide_c:   { s: "decor", r: [32, 0, 16, 16],   a: [8, 12], flip: true },
    daisy:           { s: "decor", r: [64, 0, 16, 16],   a: [8, 12], flip: true },
    daisy_b:         { s: "decor", r: [80, 0, 16, 16],   a: [8, 12], flip: true },
    flower_white:    { s: "decor", r: [16, 16, 16, 16],  a: [8, 12], flip: true },
    flower_white_b:  { s: "decor", r: [32, 16, 16, 16],  a: [8, 12], flip: true },
    flower_pink:     { s: "decor", r: [64, 16, 16, 16],  a: [8, 12], flip: true },
    flower_pink_b:   { s: "decor", r: [80, 16, 16, 16],  a: [8, 12], flip: true },
    flower_gold_b:   { s: "decor", r: [64, 32, 16, 16],  a: [8, 12], flip: true },
    flower_gold_c:   { s: "decor", r: [80, 32, 16, 16],  a: [8, 12], flip: true },
    bud_red:         { s: "decor", r: [96, 16, 16, 16],  a: [8, 12] },
    bud_purple:      { s: "decor", r: [112, 16, 16, 16], a: [8, 12] },
    bud_blue:        { s: "decor", r: [128, 16, 16, 16], a: [8, 12] },
    fern:            { s: "decor", r: [96, 32, 16, 16],  a: [8, 13], flip: true },
    fern_b:          { s: "decor", r: [96, 48, 16, 16],  a: [8, 13], flip: true },
    mushroom_tan:    { s: "decor", r: [112, 32, 16, 16], a: [8, 13], flip: true },
    mushroom_tan_sm: { s: "decor", r: [128, 32, 16, 16], a: [8, 13], flip: true },
    mushroom_red:    { s: "decor", r: [0, 48, 16, 16],   a: [8, 12] },
    mushroom_purple: { s: "decor", r: [16, 48, 16, 16],  a: [8, 12] },
    mushroom_blue:   { s: "decor", r: [32, 48, 16, 16],  a: [8, 12] },
    mushroom_tiny_red:    { s: "decor", r: [0, 64, 16, 16],  a: [8, 10] },
    mushroom_tiny_purple: { s: "decor", r: [16, 64, 16, 16], a: [8, 10] },
    mushroom_pair:   { s: "decor", r: [32, 80, 16, 16],  a: [8, 12], flip: true },
    rock_moss_sm:    { s: "decor", r: [0, 80, 16, 16],   a: [8, 13], flip: true },
    rock_moss_sm_b:  { s: "decor", r: [16, 80, 16, 16],  a: [8, 13], flip: true },
    rock_c:          { s: "decor", r: [64, 96, 16, 16],  a: [8, 13], flip: true },
    pebble:          { s: "decor", r: [112, 96, 16, 16], a: [8, 13], flip: true },
    rock_cluster:    { s: "decor", r: [128, 96, 16, 16], a: [8, 13], flip: true },
    rock_round:      { s: "decor", r: [64, 144, 16, 16], a: [8, 13], flip: true },
    boulder:         { s: "decor", r: [64, 176, 32, 32], a: [16, 28], flip: true },
    bush_c:          { s: "decor", r: [48, 144, 16, 16], a: [8, 14], flip: true },
    bush_d:          { s: "decor", r: [96, 144, 16, 16], a: [8, 14], flip: true },
    bush_e:          { s: "decor", r: [112, 144, 16, 16], a: [8, 14], flip: true },
    stump_b:         { s: "decor", r: [32, 144, 16, 16], a: [8, 13] },
    log_b:           { s: "decor", r: [0, 112, 32, 16],  a: [16, 13], flip: true },
    wild_red:        { s: "flowers", r: [0, 64, 16, 16],  a: [8, 14], flip: true },
    wild_pink:       { s: "flowers", r: [32, 64, 16, 16], a: [8, 14], flip: true },
    wild_violet:     { s: "flowers", r: [48, 64, 16, 16], a: [8, 14], flip: true },
    wild_gold:       { s: "flowers", r: [32, 80, 16, 16], a: [8, 14], flip: true },
    wild_blue:       { s: "flowers", r: [64, 80, 16, 16], a: [8, 14], flip: true },
    wild_pair_red:   { s: "flowers", r: [0, 96, 16, 16],  a: [8, 14], flip: true },
    wild_pair_pink:  { s: "flowers", r: [32, 96, 16, 16], a: [8, 14], flip: true },
    wild_pair_violet:{ s: "flowers", r: [48, 96, 16, 16], a: [8, 14], flip: true },
    wild_pair_gold:  { s: "flowers", r: [32, 112, 16, 16], a: [8, 14], flip: true },
    wild_pair_blue:  { s: "flowers", r: [64, 112, 16, 16], a: [8, 14], flip: true },
    cottage:      { s: "house", r: [0, 0, 96, 128],   a: [48, 112], smoke: [20, -92] },
    lamp_lit:     { s: "lamps", r: [0, 144, 16, 48],  a: [8, 46], frames: 6, dx: 16, rate: 6 },
    lamp_cold:    { s: "lamps", r: [0, 144, 16, 48],  a: [8, 46], cold: true },
    chest:        { s: "chest", r: [0, 0, 16, 16],    a: [8, 13] },
    chest_open:   { s: "chest", r: [48, 0, 16, 16],   a: [8, 13] },
    skiff:        { s: "boat",  r: [0, 0, 48, 48],    a: [22, 42], dry: true }
  };
  // Kinds that stay code art in this PR (gaps): stones, inn/hearth, great lamp,
  // hook posts, signs/marks (TEXTS), rope bridge and dock decks.
  var OPT = window.__kenmiOpt || {};
  if (OPT.skiff !== true) delete ENTRIES.skiff; // default: keep code-art skiff (gap)

  function load(src) {
    return new Promise(function (res) {
      var im = new Image();
      im.onload = function () { res(im); };
      im.onerror = function () { res(null); };
      im.src = BASE + src.split("/").map(encodeURIComponent).join("/");
    });
  }
  function canvasOf(im) {
    var c = document.createElement("canvas"); c.width = im.width; c.height = im.height;
    var g = c.getContext("2d"); g.drawImage(im, 0, 0); return c;
  }
  // Unlit lamp: the glass goes cold blue-grey. Same pixels, recoloured once at load.
  function coldCopy(img, r) {
    var c = document.createElement("canvas"); c.width = r[2]; c.height = r[3];
    var g = c.getContext("2d"); g.drawImage(img, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]);
    var d = g.getImageData(0, 0, c.width, c.height), p = d.data, i, R, G, B;
    for (i = 0; i < p.length; i += 4) {
      R = p[i]; G = p[i + 1]; B = p[i + 2];
      if (p[i + 3] && R > 150 && R > B + 60 && G > 40) { var v = (R + G + B) / 3; p[i] = v * 0.55; p[i + 1] = v * 0.62; p[i + 2] = v * 0.78; }
    }
    g.putImageData(d, 0, 0); return c;
  }
  // Boat on dry dock: drop the baked water ripple (blue pixels) so it sits on planks/grass.
  function dryCopy(img, r) {
    var c = document.createElement("canvas"); c.width = r[2]; c.height = r[3];
    var g = c.getContext("2d"); g.drawImage(img, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]);
    var d = g.getImageData(0, 0, c.width, c.height), p = d.data, i;
    for (i = 0; i < p.length; i += 4) if (p[i + 2] > p[i] + 40 && p[i + 2] > 120) p[i + 3] = 0;
    g.putImageData(d, 0, 0); return c;
  }

  function mix(x, y) { var h = (x * 73856093) ^ (y * 19349663); h = (h ^ (h >>> 13)) >>> 0; return h; }

  function PropRegistry(entries, images) { this.entries = entries; this.images = images; }
  PropRegistry.prototype.idFor = function (prop, lit) {
    var k = prop.kind;
    if (prop.art) return prop.art; // data-driven decor rows name their art id directly
    if (k === "airship") return "skiff";
    if (k === "stake") return lit ? "lamp_lit" : "lamp_cold";
    if (k === "flower") {
      var c = prop.c || "";
      return (c.indexOf("9af") !== -1 || c.indexOf("c8be") !== -1) ? "flower_tide" : (c.indexOf("ffb") !== -1 || c.indexOf("ffe") !== -1 || c.indexOf("e7a") !== -1 ? "flower_gold" : ((c.indexOf("c6b6") !== -1 || c.indexOf("d8c6") !== -1) ? "blossom" : "flower"));
    }
    if (Art.fieldProp) return Art.fieldProp(prop, SF.islandId);
    return k;
  };
  PropRegistry.prototype.get = function (id) {
    var e = this.entries[id];
    if (!e) return null;
    if (!e.img) {
      var im = this.images[e.s]; if (!im) return null;
      e.img = e.cold ? coldCopy(im, e.r) : (e.dry ? dryCopy(im, e.r) : im);
      e.local = !!(e.cold || e.dry);
    }
    return e;
  };

  function PropRenderer(reg) { this.reg = reg; }
  PropRenderer.prototype.draw = function (ctx, id, x, y, opts) {
    var e = this.reg.get(id); if (!e) return false;
    opts = opts || {};
    var sx = e.local ? 0 : e.r[0], sy = e.local ? 0 : e.r[1], w = e.r[2], h = e.r[3];
    if (e.frames && !SF.reduceMotion) sx += (Math.floor((SF.anim || 0) * e.rate) % e.frames) * e.dx;
    var flip = e.flip && (mix(Math.round(x), Math.round(y)) & 1);
    var fade = e.canopy && canopyHidesHero(e, x, y);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (fade) ctx.globalAlpha *= 0.4;
    var dx = Math.round(x), dy = Math.round(y);
    if (flip) { ctx.translate(dx, 0); ctx.scale(-1, 1); ctx.drawImage(e.img, sx, sy, w, h, -(w - e.a[0]), dy - e.a[1], w, h); }
    else ctx.drawImage(e.img, sx, sy, w, h, dx - e.a[0], dy - e.a[1], w, h);
    ctx.restore();
    return true;
  };
  function canopyHidesHero(e, x, y) {
    var p = SF.state && SF.state.player; if (!p || !(y > p.y)) return false;
    var left = x - e.a[0], top = y - e.a[1], right = left + e.r[2], canopyBottom = top + e.r[3] * 0.72;
    return left < p.x + 13 && right > p.x - 13 && top < p.y - 2 && canopyBottom > p.y - 36;
  }

  // Vertical fence run: each fence_up prop draws the Kenmi rail strip for its own
  // span [y - SPAN, y] so per-instance y-sorting and spacing are unchanged.
  function FenceStrip(img) { this.img = img; }
  FenceStrip.prototype.draw = function (ctx, prop) {
    var list = (SF.PROPS || []).filter(function (q) { return q.kind === prop.kind && Math.abs(q.x - prop.x) < 2; });
    var ys = list.map(function (q) { return q.y; }).sort(function (a, b) { return a - b; });
    var i = ys.indexOf(prop.y), span = ys.length > 1 ? (ys[ys.length - 1] - ys[0]) / (ys.length - 1) : 16;
    var top = i === 0 ? prop.y - span : ys[i - 1];
    var x = Math.round(prop.x) - 8, y0 = Math.round(top), y1 = Math.round(prop.y);
    ctx.save(); ctx.imageSmoothingEnabled = false;
    var y, srcY;
    for (y = y0; y < y1; y++) {
      // world-aligned 32px rail pattern (two middle tiles) so joins line up.
      srcY = 16 + (((y - y0) % 32) + 32) % 32;
      ctx.drawImage(this.img, 0, srcY, 16, 1, x, y, 16, 1);
    }
    if (i === 0) ctx.drawImage(this.img, 0, 0, 16, 12, x, y0 - 12, 16, 12);
    if (i === ys.length - 1) ctx.drawImage(this.img, 0, 48, 16, 14, x, y1 - 6, 16, 14);
    ctx.restore();
    return true;
  };


  // Dense decor layer: data rows {type, variant, x, y, block} become SF.PROPS entries
  // (kind=type, art=variant). Idempotent: re-applied if the island pack is rebuilt.
  function DecorLayer(rows) {
    this.props = rows.map(function (r) { return { kind: r.type, art: r.variant, x: r.x, y: r.y, block: r.block || 0, dense: true }; });
  }
  DecorLayer.prototype.ensure = function () {
    if (SF.islandId !== "emberhold" || !SF.PROPS || SF.PROPS.__dense) return;
    if (!SF.PROPS.some(function (p) { return p.dense; })) Array.prototype.push.apply(SF.PROPS, this.props);
    SF.PROPS.__dense = true;
  };
  // Rect footprint for a prop (the cottage). Preview wraps walkable + dashInside;
  // the PR would teach propBlocks/dashCircles about rects instead.
  function RectFootprint(kind, rel) { this.kind = kind; this.rel = rel; }
  RectFootprint.prototype.blocks = function (x, y) {
    if (SF.islandId !== "emberhold" || !SF.PROPS) return false;
    for (var i = 0; i < SF.PROPS.length; i++) {
      var p = SF.PROPS[i]; if (p.kind !== this.kind) continue;
      var r = this.rel;
      if (x >= p.x + r[0] && x < p.x + r[0] + r[2] && y >= p.y + r[1] && y < p.y + r[1] + r[3]) return true;
    }
    return false;
  };
  var DENSE = window.__denseProps ? new DecorLayer(window.__denseProps) : null;
  var COTRECT = OPT.cottageRect === false ? null : new RectFootprint("cottage", OPT.cottageRect || [-38, -80, 76, 76]);
  if (DENSE || COTRECT) {
    var ow = SF.walkable, odi = SF.dashInside;
    SF.walkable = function (x, y) {
      if (DENSE) DENSE.ensure();
      if (COTRECT && COTRECT.blocks(x, y)) return false;
      return ow.apply(this, arguments);
    };
    if (odi) SF.dashInside = function (x, y) { if (COTRECT && COTRECT.blocks(x, y)) return true; return odi.apply(this, arguments); };
    if (DENSE) DENSE.ensure();
    window.__kenmiLayer = { dense: DENSE, cottageRect: COTRECT };
  }

  var origPropArt = SF.drawPropArt, origChest = SF.drawChest;
  Promise.all(Object.keys(SHEETS).map(function (k) { return load(SHEETS[k]).then(function (im) { return [k, im]; }); }))
    .then(function (pairs) {
      var images = {}; pairs.forEach(function (p) { images[p[0]] = p[1]; });
      var reg = new PropRegistry(ENTRIES, images), ren = new PropRenderer(reg);
      var fence = images.fences ? new FenceStrip(images.fences) : null;
      window.__kenmi = { reg: reg, ren: ren, missing: pairs.filter(function (p) { return !p[1]; }).map(function (p) { return p[0]; }) };
      SF.drawPropArt = function (ctx, prop, lit) {
        if (SF.islandId === "emberhold") {
          if (prop.kind === "fence_up" && fence) return fence.draw(ctx, prop);
          var id = reg.idFor(prop, lit);
          if (id === "") return true; // same thinning as code art
          if (reg.get(id)) {
            ren.draw(ctx, id, prop.x, prop.y);
            var e = reg.get(id);
            if (e.smoke && images.smoke) {
              var f = SF.reduceMotion ? 0 : Math.floor((SF.anim || 0) * 6) % 5;
              ctx.save(); ctx.imageSmoothingEnabled = false;
              ctx.drawImage(images.smoke, f * 32, 0, 32, 32, Math.round(prop.x + e.smoke[0] - 16), Math.round(prop.y + e.smoke[1] - 20), 32, 32);
              ctx.restore();
            }
            return true;
          }
        }
        return origPropArt(ctx, prop, lit);
      };
      SF.drawChest = function (ctx, extra) {
        if (SF.islandId !== "emberhold") return origChest(ctx, extra);
        var u = SF.chestOpenT ? SF.chestOpenT(extra.id) : 0;
        var id = u >= 0.5 ? "chest_open" : "chest";
        if (!reg.get(id)) return origChest(ctx, extra);
        if (u > 0 && u < 1) {
          var e = reg.get("chest"); var fr = Math.min(3, Math.floor(u * 4));
          ctx.save(); ctx.imageSmoothingEnabled = false;
          ctx.drawImage(e.img, fr * 16, 0, 16, 16, Math.round(extra.x) - 8, Math.round(extra.y) - 13, 16, 16);
          ctx.restore(); return;
        }
        ren.draw(ctx, id, extra.x, extra.y);
      };
      window.__kenmiReady = true;
    });
})();
