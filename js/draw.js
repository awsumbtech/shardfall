"use strict";

var SF = window.SF || {};
window.SF = SF;

SF.anim = 0;
SF.zoom = 1;
SF.dpr = 1;
SF.viewW = 1;
SF.viewH = 1;

SF.zoomFor = function () {
  return 1;
};

SF.foot = function (c) {
  if (!c) return { x: 0, y: 0, rx: 8, ry: 8, rect: false };
  if (c.k === "r" || (c.w != null && c.rx == null)) {
    return { x: c.x + c.w / 2, y: c.y + c.h / 2, rx: c.w / 2, ry: c.h / 2, rect: true, sh: c };
  }
  return { x: c.x, y: c.y, rx: c.rx || c.r || 8, ry: c.ry || c.r || 8, rect: false, sh: c };
};

SF.viewRect = function (pad) {
  var zoom = SF.zoom || 1;
  var s = SF.state;
  var hw = SF.viewW / (2 * zoom) + pad;
  var hh = SF.viewH / (2 * zoom) + pad;
  return { l: s.camX - hw, r: s.camX + hw, t: s.camY - hh, b: s.camY + hh };
};

SF.makeBlob = function (size, inner, outer) {
  var c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  var g = c.getContext("2d");
  var rg = g.createRadialGradient(size / 2, size / 2, size * 0.08, size / 2, size / 2, size / 2);
  rg.addColorStop(0, inner);
  rg.addColorStop(1, outer);
  g.fillStyle = rg;
  g.fillRect(0, 0, size, size);
  return c;
};

SF.cacheSprites = function () {
  SF.blobs = {
    cloud: SF.makeBlob(256, "rgba(255,236,250,0.92)", "rgba(255,236,250,0)"),
    mist: SF.makeBlob(256, "rgba(186,214,255,0.7)", "rgba(186,214,255,0)"),
    dusk: SF.makeBlob(256, "rgba(255,176,150,0.55)", "rgba(255,176,150,0)"),
    shadow: SF.makeBlob(256, "rgba(48,24,72,0.45)", "rgba(48,24,72,0)"),
    cyan: SF.makeBlob(128, "rgba(150,250,255,0.95)", "rgba(150,250,255,0)"),
    gold: SF.makeBlob(128, "rgba(255,214,120,0.95)", "rgba(255,214,120,0)"),
    rose: SF.makeBlob(128, "rgba(255,160,190,0.9)", "rgba(255,160,190,0)"),
    violet: SF.makeBlob(128, "rgba(210,170,255,0.9)", "rgba(210,170,255,0)")
  };
};

SF.buildWorld = function () {
  var rand = SF.mulberry32(20261019);
  var specks = [];
  function sprinkle(c) {
    var f = SF.foot(c);
    var reach = Math.max(f.rx, f.ry);
    var n = Math.min(80, Math.floor((reach * reach) / 780));
    var i, a, dx, dy;
    for (i = 0; i < n; i++) {
      a = rand() * Math.PI * 2;
      dx = Math.cos(a) * Math.sqrt(rand()) * (f.rx - 8);
      dy = Math.sin(a) * Math.sqrt(rand()) * (f.ry - 8);
      specks.push({ x: f.x + dx, y: f.y + dy, k: rand(), group: c.group });
    }
  }
  SF.WALK.circles.forEach(sprinkle);
  (SF.WALK.rects || []).forEach(sprinkle);
  SF.specks = specks;
  var clouds = [];
  var minX = -900;
  var maxX = 1100;
  var minY = -700;
  var maxY = 1000;
  function growBounds(c) {
    var f = SF.foot(c);
    minX = Math.min(minX, f.x - f.rx - 180);
    maxX = Math.max(maxX, f.x + f.rx + 180);
    minY = Math.min(minY, f.y - f.ry - 180);
    maxY = Math.max(maxY, f.y + f.ry + 180);
  }
  SF.WALK.circles.forEach(growBounds);
  (SF.WALK.rects || []).forEach(growBounds);
  var gx, gy;
  for (gx = minX; gx <= maxX; gx += 170) {
    for (gy = minY; gy <= maxY; gy += 150) {
      clouds.push({
        x: gx + (rand() - 0.5) * 80,
        y: gy + (rand() - 0.5) * 70,
        s: 90 + rand() * 150,
        kind: rand() > 0.55 ? "mist" : (rand() > 0.5 ? "dusk" : "cloud"),
        drift: 6 + rand() * 10
      });
    }
  }
  SF.clouds = clouds;
  var groups = { ember: [], span: [], cinder: [], perch: [], quay: [], ash: [], vault: [], ridge: [], scar: [] };
  function pushGroup(c) {
    if (!c.group) return;
    if (!groups[c.group]) groups[c.group] = [];
    groups[c.group].push(c);
  }
  SF.WALK.circles.forEach(pushGroup);
  (SF.WALK.rects || []).forEach(pushGroup);
  SF.groups = groups;
};

SF.traceGroup = function (ctx, circles, grow) {
  ctx.beginPath();
  (circles || []).forEach(function (c) {
    var g = grow || 0;
    var f = SF.foot(c);
    if (f.rect && c.w != null) {
      ctx.rect(c.x - g, c.y - g, c.w + g * 2, c.h + g * 2);
      return;
    }
    var rx = Math.max(2, f.rx + g);
    var ry = Math.max(2, f.ry + g);
    ctx.moveTo(f.x + rx, f.y);
    if (ctx.ellipse) ctx.ellipse(f.x, f.y, rx, ry, 0, 0, Math.PI * 2);
    else ctx.arc(f.x, f.y, Math.min(rx, ry), 0, Math.PI * 2);
  });
};

SF.drawSky = function (ctx, w, h, s) {
  var lit = SF.lampIsLit ? SF.lampIsLit(s) : !!(s.flags && s.flags.lampLit);
  var isle = SF.islandId || "emberhold";
  var key = isle + (lit ? "L" : "D") + ":" + w + "x" + h;
  if (SF._skyKey !== key) {
    var skies = SF.SKY || {};
    var row = skies[isle] || skies.emberhold || { dusk: ["#1a1038", "#4c356c", "#e39a8c", "#f0c6ae"], lit: ["#2a1860", "#6a4a86", "#f0b59a", "#f8d7b4"] };
    var stops = (lit && row.lit) ? row.lit : row.dusk;
    var g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, stops[0]);
    g.addColorStop(0.42, stops[1]);
    g.addColorStop(0.72, stops[2]);
    g.addColorStop(1, stops[3]);
    SF._skyGrad = g;
    SF._skyKey = key;
  }
  ctx.fillStyle = SF._skyGrad;
  ctx.fillRect(0, 0, w, h);

  var t = SF.anim;
  var i, x, y, puff;
  ctx.save();
  for (i = 0; i < 7; i++) {
    x = ((t * (10 + i * 4) + i * 190) % (w + 280)) - 140;
    y = h * (0.08 + (i % 4) * 0.16);
    puff = i % 2 ? SF.blobs.mist : SF.blobs.cloud;
    ctx.globalAlpha = 0.28;
    ctx.drawImage(puff, x, y, 220 + (i % 3) * 40, 90);
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = (SF.calm && SF.calm()) ? 0.28 : (lit ? 0.55 : 0.34);
  ctx.strokeStyle = "#fff4d2";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w * 0.12, h * 0.07);
  ctx.lineTo(w * 0.28, h * 0.13);
  ctx.lineTo(w * 0.36, h * 0.05);
  ctx.lineTo(w * 0.52, h * 0.15);
  ctx.lineTo(w * 0.66, h * 0.04);
  ctx.lineTo(w * 0.84, h * 0.11);
  ctx.stroke();
  ctx.restore();
};

SF.cloudStamp = function () {
  var clouds = SF.clouds;
  if (!clouds || !clouds.length) return "0";
  var a = clouds[0];
  var b = clouds[clouds.length - 1];
  return clouds.length + ":" + a.x + ":" + a.y + ":" + b.x + ":" + b.y;
};

SF.buildCloudSheet = function () {
  var clouds = SF.clouds;
  var minX = Infinity;
  var minY = Infinity;
  var maxX = -Infinity;
  var maxY = -Infinity;
  var i, c;
  for (i = 0; i < clouds.length; i++) {
    c = clouds[i];
    if (c.x - c.s < minX) minX = c.x - c.s;
    if (c.x + c.s > maxX) maxX = c.x + c.s;
    if (c.y - c.s < minY) minY = c.y - c.s;
    if (c.y + c.s > maxY) maxY = c.y + c.s;
  }
  var worldW = Math.max(1, maxX - minX);
  var worldH = Math.max(1, maxY - minY);
  var ppm = 1;
  var maxDim = 4096;
  if (worldW > maxDim) ppm = maxDim / worldW;
  if (worldH * ppm > maxDim) ppm = Math.min(ppm, maxDim / worldH);
  var sheet = document.createElement("canvas");
  sheet.width = Math.max(1, Math.ceil(worldW * ppm));
  sheet.height = Math.max(1, Math.ceil(worldH * ppm));
  var g = sheet.getContext("2d");
  g.setTransform(ppm, 0, 0, ppm, -minX * ppm, -minY * ppm);
  g.imageSmoothingEnabled = true;
  for (i = 0; i < clouds.length; i++) {
    c = clouds[i];
    g.globalAlpha = 0.78;
    g.drawImage(SF.blobs[c.kind] || SF.blobs.cloud, c.x - c.s, c.y - c.s * 0.42, c.s * 2, c.s * 0.9);
  }
  g.globalAlpha = 1;
  SF._cloudSheet = sheet;
  SF._cloudBox = { minX: minX, minY: minY };
  SF._cloudPpm = ppm;
  SF._cloudStamp = SF.cloudStamp();
};

SF.drawClouds = function (ctx, s) {
  if (!SF.clouds || !SF.clouds.length || !SF.blobs) return;
  if (!SF._cloudSheet || SF._cloudStamp !== SF.cloudStamp()) SF.buildCloudSheet();
  var z = SF.zoom || 1;
  var pad = 6;
  var left = s.camX - SF.viewW / (2 * z) - pad;
  var top = s.camY - SF.viewH / (2 * z) - pad;
  var vw = SF.viewW / z + pad * 2;
  var vh = SF.viewH / z + pad * 2;
  var drift = Math.sin(SF.anim * 0.07) * 36;
  var b = SF._cloudBox;
  SF.blitSheet(ctx, SF._cloudSheet, SF._cloudPpm, left - s.camX * 0.18 - drift, top - s.camY * 0.18, left, top, vw, vh, b.minX, b.minY);
};

SF.SKY = {
  emberhold: { dusk: ["#1a1038", "#4c356c", "#e39a8c", "#f0c6ae"], lit: ["#2a1860", "#6a4a86", "#f0b59a", "#f8d7b4"] },
  cinderveil: { dusk: ["#241812", "#5c4038", "#c46a55", "#d9a090"], lit: ["#3a2418", "#8a5040", "#e07a48", "#f0b090"] },
  saltmere: { dusk: ["#102438", "#1e5870", "#e0a898", "#f3d2bc"] },
  highspire: { dusk: ["#2a160c", "#6a4030", "#e0a060", "#f0d0a0"] },
  gullrock: { dusk: ["#1a1830", "#4a4868", "#c8b8a8", "#e4d4c4"] },
  drift: { dusk: ["#241430", "#5a4068", "#d0a0b8", "#f0d0c8"] }
};

SF.LANDS = {
  ember: { cliff: "#a15a42", rim: "#d5f0b0", hi: "#d4f0aa", mid: "#5cba78", lo: "#2a704c", lit: { rim: "#e7ffc4", hi: "#e4f8b8", mid: "#6ed184", lo: "#2f8a58" } },
  perch: { cliff: "#7a5344", rim: "#d8fff4", hi: "#d4fff2", mid: "#73cbb4", lo: "#2f7d78" },
  cinder: { cliff: "#a15a42", rim: "#fff0c8", hi: "#fff1c4", mid: "#e0b15a", lo: "#8a7a3e" },
  span: { cliff: "#6e5348", rim: "#f0d2bf", hi: "#ecd3c2", mid: "#b88870", lo: "#7a5a4e" },
  quay: { cliff: "#4e5c5a", rim: "#9fd4d0", hi: "#c8c2ba", mid: "#8d8680", lo: "#5c5854" },
  ash: { cliff: "#5a5048", rim: "#f0a070", hi: "#d8cfc6", mid: "#a89890", lo: "#6e625c" },
  vault: { cliff: "#3a2824", rim: "#ffb15a", hi: "#8a6860", mid: "#6e4038", lo: "#3a2824" },
  salt: { cliff: "#3e6e78", rim: "#d7fff8", hi: "#c9f6ea", mid: "#5ec4b0", lo: "#2a6e78" },
  shore: { cliff: "#c4a574", rim: "#fff0c8", hi: "#f3e2b0", mid: "#e0c07a", lo: "#a68448" },
  wreck: { cliff: "#3a403c", rim: "#b7c0b8", hi: "#8a948c", mid: "#5c6560", lo: "#2e3834" },
  wyrm: { cliff: "#1a3038", rim: "#7ec8c4", hi: "#3e6e78", mid: "#1e4e58", lo: "#102830" },
  hs: { cliff: "#6a5348", rim: "#f0e2c8", hi: "#e6d2b0", mid: "#c4a070", lo: "#7a5a40" },
  road: { cliff: "#6e5348", rim: "#ecd8c0", hi: "#e0c8a8", mid: "#b89070", lo: "#6e5040" },
  gull: { cliff: "#5a5854", rim: "#e4e0d8", hi: "#d4d0c8", mid: "#a8a49c", lo: "#6a6660" },
  drift: { cliff: "#4a3a68", rim: "#e6d8ff", hi: "#d4c4f0", mid: "#8a74b0", lo: "#4a3868" }
};

SF.cliffTile = function (group) {
  if (group === "quay" || group === "gull" || group === "hs") return "stone";
  if (group === "salt" || group === "drift") return "pier";
  if (group === "wreck") return "hold";
  if (group === "shore" || group === "wyrm") return "sand";
  return "cliff";
};

SF.landTiles = function (name, lit) {
  var map = {
    ember: lit ? ["grass_light", "grass_light"] : ["grass", "grass_light"],
    perch: ["shore", "shore_light"],
    cinder: ["ash", "ash_rock"],
    span: ["stone", "stone_light"],
    quay: ["stone", "ash"],
    ash: ["ash", "ash_rock"],
    vault: ["vault", "ash_ember"],
    scar: ["gold", "stone"],
    ridge: ["ash_ember", "ash_rock"],
    salt: ["dock", "pier"],
    shore: ["sand", "gold_light"],
    wreck: ["hold", "vault"],
    wyrm: ["shore", "shore_light"],
    hs: ["cobble", "stone_light"],
    road: ["path", "stone_light"],
    gull: ["stone", "stone_light"],
    drift: ["plank", "wood"]
  };
  return map[name] || ["grass", "grass_light"];
};

SF.drawLands = function (ctx, s) {
  var lit = SF.lampIsLit ? SF.lampIsLit(s) : !!s.flags.lampLit;
  var pixel = window.Art && Art.fillPattern;
  function solids(group) {
    return (SF.groups[group] || []).filter(function (c) {
      return !(c.id && String(c.id).indexOf("trail-") === 0);
    });
  }
  function cliff(group) {
    var shapes = solids(group);
    if (!shapes.length) return;
    ctx.save();
    ctx.translate(0, 16);
    SF.traceGroup(ctx, shapes, 3);
    if (pixel) {
      ctx.clip();
      Art.fillPattern(ctx, SF.cliffTile ? SF.cliffTile(group) : (group === "quay" ? "stone" : "cliff"));
    } else {
      var look = (SF.LANDS && SF.LANDS[group]) || { cliff: "#a15a42" };
      ctx.fillStyle = look.cliff || "#a15a42";
      ctx.fill();
    }
    ctx.restore();
  }
  function paintShapes(shapes, tileName, fallback) {
    if (!shapes || !shapes.length) return;
    ctx.save();
    SF.traceGroup(ctx, shapes, 0);
    ctx.clip();
    if (pixel) Art.fillPattern(ctx, tileName);
    else {
      ctx.fillStyle = fallback || "#5cba78";
      ctx.fillRect(-4000, -4000, 8000, 8000);
    }
    ctx.restore();
  }
  function highlight(group, light) {
    var shapes = solids(group);
    if (!shapes.length) return;
    ctx.save();
    ctx.translate(-3, -5);
    SF.traceGroup(ctx, shapes, 2);
    if (pixel) {
      ctx.clip();
      Art.fillPattern(ctx, light);
    } else {
      ctx.fillStyle = "#e7ffc4";
      ctx.fill();
    }
    ctx.restore();
  }
  var names = Object.keys(SF.groups || {});
  names.forEach(cliff);
  names.forEach(function (name) {
    var tiles = (SF.landTiles && SF.landTiles(name, lit)) || ["grass", "grass_light"];
    highlight(name, tiles[1] || tiles[0]);
  });
  names.forEach(function (name) {
    var tiles = (SF.landTiles && SF.landTiles(name, lit)) || ["grass", "grass_light"];
    paintShapes(SF.groups[name], tiles[0]);
  });
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.lineWidth = 3;
  names.forEach(function (name) {
    var shapes = solids(name);
    if (!shapes.length) return;
    SF.traceGroup(ctx, shapes, 0);
    ctx.strokeStyle = (SF.LANDS[name] && SF.LANDS[name].lo) || "#2a4030";
    ctx.stroke();
  });
  ctx.restore();
  names.forEach(function (name) {
    var tiles = (SF.landTiles && SF.landTiles(name, lit)) || ["grass", "grass_light"];
    paintShapes(SF.groups[name], tiles[0]);
  });

  var hollow = SF.circle("hollow");
  if (hollow) {
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = "#7f8cff";
    ctx.beginPath();
    ctx.arc(hollow.x, hollow.y, hollow.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  if (lit) {
    ctx.save();
    ctx.globalAlpha = 0.18;
    var glow = ctx.createRadialGradient(SF.LAMP.x, SF.LAMP.y, 20, SF.LAMP.x, SF.LAMP.y, 340);
    glow.addColorStop(0, "rgba(255, 220, 140, 0.9)");
    glow.addColorStop(1, "rgba(255, 220, 140, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(SF.LAMP.x, SF.LAMP.y, 340, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
};

SF.drawGround = function (ctx, s) {
  ctx.save();
  ctx.beginPath();
  SF.traceGroup(ctx, (SF.WALK.circles || []).concat(SF.WALK.rects || []), 0);
  ctx.clip();
  if (SF.PATHS && SF.PATHS.length) {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    SF.PATHS.forEach(function (path) {
      var i, t, steps, x0, y0, x1, y1, len, x, y, px, py, wobble, wide;
      for (i = 0; i < path.length - 2; i += 2) {
        x0 = path[i];
        y0 = path[i + 1];
        x1 = path[i + 2];
        y1 = path[i + 3];
        len = Math.hypot(x1 - x0, y1 - y0) || 1;
        steps = Math.max(1, Math.ceil(len / 6));
        px = x0;
        py = y0;
        for (t = 1; t <= steps; t++) {
          x = x0 + (x1 - x0) * (t / steps);
          y = y0 + (y1 - y0) * (t / steps);
          wobble = ((Math.imul(((x0 + y0 + i * 13) | 0) ^ (t * 17), 747796405) >>> 0) % 9);
          wide = 5 + wobble;
          if ((wobble + t) % 11 === 0) {
            px = x;
            py = y;
            continue;
          }
          ctx.strokeStyle = "rgba(96, 122, 58, 0.18)";
          ctx.lineWidth = wide + 14;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(x, y);
          ctx.stroke();
          ctx.strokeStyle = "rgba(146, 112, 66, 0.42)";
          ctx.lineWidth = wide + 6;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(x, y);
          ctx.stroke();
          ctx.strokeStyle = "rgba(164, 124, 72, 0.58)";
          ctx.lineWidth = wide;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(x, y);
          ctx.stroke();
          if ((wobble + t) % 4 === 0) {
            ctx.fillStyle = "rgba(92, 64, 38, 0.65)";
            ctx.fillRect(x - 1, y + (wobble % 3) - 1, 2, 1);
          } else if ((wobble + t) % 5 === 0) {
            ctx.fillStyle = "rgba(214, 186, 130, 0.45)";
            ctx.fillRect(x, y - 1, 1, 1);
          }
          px = x;
          py = y;
        }
      }
    });
  } else {
    ctx.strokeStyle = "rgba(126, 78, 48, 0.45)";
    ctx.lineWidth = 12;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    SF.PATHS.forEach(function (path) {
      ctx.beginPath();
      ctx.moveTo(path[0], path[1]);
      var i;
      for (i = 2; i < path.length; i += 2) ctx.lineTo(path[i], path[i + 1]);
      ctx.stroke();
    });
  }
  ctx.restore();

  var view = SF._baking ? null : SF.viewRect(24);
  var specks = SF.specks;
  var i, sp, cull;
  ctx.save();
  for (i = 0; i < specks.length; i++) {
    sp = specks[i];
    cull = view && (sp.x < view.l || sp.x > view.r || sp.y < view.t || sp.y > view.b);
    if (cull) continue;
    var ash = sp.group === "ash" || sp.group === "vault" || sp.group === "ridge" || sp.group === "cinder";
    var quay = sp.group === "quay" || sp.group === "perch";
    if (ash) {
      if (sp.k > 0.992) {
        ctx.fillStyle = "#ffb15a";
        ctx.fillRect(sp.x, sp.y, 1, 1);
        ctx.fillStyle = "#a04418";
        ctx.fillRect(sp.x + 1, sp.y, 2, 1);
      } else if (sp.k > 0.78) {
        ctx.fillStyle = "#3a342e";
        ctx.fillRect(sp.x, sp.y, 2, 1);
        ctx.fillStyle = "#6a625c";
        ctx.fillRect(sp.x, sp.y, 1, 1);
      }
    } else if (sp.k > 0.94) {
      ctx.fillStyle = quay ? "#8ad4d4" : (sp.k > 0.98 ? "#f0d078" : "#ffd0e4");
      ctx.fillRect(sp.x, sp.y, 2, 1);
    } else if (sp.k > 0.55) {
      ctx.fillStyle = quay ? "#1a5868" : "#1e5828";
      ctx.fillRect(sp.x, sp.y, 1, 2);
      ctx.fillStyle = quay ? "#8ad4d4" : "#8ed45c";
      ctx.fillRect(sp.x, sp.y, 1, 1);
    }
  }
  ctx.restore();
};

SF.terrainKey = function (lit) {
  return (SF.islandId || "emberhold") + ":" + (lit ? "1" : "0") + ":" + SF.WALK.circles.length + ":" + (SF.specks ? SF.specks.length : 0) + ":" + SF.WALK.rects.length;
};

SF.terrainBounds = function () {
  var minX = Infinity;
  var minY = Infinity;
  var maxX = -Infinity;
  var maxY = -Infinity;
  function add(x, y) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  var i, c, r, circles, rects;
  circles = SF.WALK.circles;
  for (i = 0; i < circles.length; i++) {
    c = circles[i];
    var f = SF.foot(c);
    add(f.x - f.rx * 1.2 - 8, f.y - f.ry - 16);
    add(f.x + f.rx * 1.2 + 8, f.y + f.ry * 1.3 + 24);
  }
  rects = SF.WALK.rects;
  for (i = 0; i < rects.length; i++) {
    r = rects[i];
    add(r.x - 16, r.y - 16);
    add(r.x + r.w + 16, r.y + r.h + 16);
  }
  if (SF.LAMP) {
    add(SF.LAMP.x - 360, SF.LAMP.y - 360);
    add(SF.LAMP.x + 360, SF.LAMP.y + 360);
  }
  return { minX: minX, minY: minY, maxX: maxX, maxY: maxY };
};

SF.buildTerrainSheet = function (lit) {
  var b = SF.terrainBounds();
  var worldW = Math.max(1, b.maxX - b.minX);
  var worldH = Math.max(1, b.maxY - b.minY);
  var ppm = 1;
  var maxDim = 4096;
  if (worldW * ppm > maxDim || worldH * ppm > maxDim) ppm = 1;
  var sheet = document.createElement("canvas");
  sheet.width = Math.max(1, Math.ceil(worldW * ppm));
  sheet.height = Math.max(1, Math.ceil(worldH * ppm));
  var bctx = sheet.getContext("2d");
  bctx.imageSmoothingEnabled = false;
  bctx.setTransform(ppm, 0, 0, ppm, -b.minX * ppm, -b.minY * ppm);
  SF._landGrad = {};
  SF._baking = true;
  var fake = { flags: { lampLit: !!lit, cinderLit: SF.islandId === "cinderveil" && !!lit } };
  Object.keys(SF.groups || {}).forEach(function (name) {
    (SF.groups[name] || []).forEach(function (c) {
      if (c.id && String(c.id).indexOf("trail-") === 0) return;
      var f = SF.foot(c);
      bctx.drawImage(SF.blobs.shadow, f.x - f.rx * 1.15, f.y - f.ry * 0.45 + 22, f.rx * 2.3, f.ry * 1.35);
    });
  });
  SF.drawLands(bctx, fake);
  SF.drawBridge(bctx);
  SF.drawGround(bctx, fake);
  SF._baking = false;
  SF._terrain = sheet;
  SF._terrainBox = b;
  SF._terrainPpm = ppm;
  SF._terrainKey = SF.terrainKey(lit);
};

SF.drawTerrain = function (ctx, s) {
  if (!SF.groups || !SF.specks || !SF.blobs || !SF.WALK) return;
  var lit = SF.lampIsLit ? SF.lampIsLit(s) : !!(s.flags && s.flags.lampLit);
  var key = SF.terrainKey(lit);
  if (!SF._terrain || SF._terrainKey !== key) SF.buildTerrainSheet(lit);
  var sheet = SF._terrain;
  var b = SF._terrainBox;
  var ppm = SF._terrainPpm;
  var z = SF.zoom || 1;
  var pad = 8;
  var left = s.camX - SF.viewW / (2 * z) - pad;
  var top = s.camY - SF.viewH / (2 * z) - pad;
  var vw = SF.viewW / z + pad * 2;
  var vh = SF.viewH / z + pad * 2;
  SF.blitSheet(ctx, sheet, ppm, left, top, left, top, vw, vh, b.minX, b.minY);
};

SF.blitSheet = function (ctx, sheet, ppm, srcLeft, srcTop, destLeft, destTop, vw, vh, originX, originY) {
  var srcX = (srcLeft - originX) * ppm;
  var srcY = (srcTop - originY) * ppm;
  var srcW = vw * ppm;
  var srcH = vh * ppm;
  var destX = destLeft;
  var destY = destTop;
  var destW = vw;
  var destH = vh;
  var cut;
  if (srcX < 0) {
    cut = -srcX;
    srcX = 0;
    srcW -= cut;
    destX += cut / ppm;
    destW -= cut / ppm;
  }
  if (srcY < 0) {
    cut = -srcY;
    srcY = 0;
    srcH -= cut;
    destY += cut / ppm;
    destH -= cut / ppm;
  }
  if (srcX + srcW > sheet.width) {
    cut = srcX + srcW - sheet.width;
    srcW -= cut;
    destW -= cut / ppm;
  }
  if (srcY + srcH > sheet.height) {
    cut = srcY + srcH - sheet.height;
    srcH -= cut;
    destH -= cut / ppm;
  }
  if (srcW < 1 || srcH < 1 || destW <= 0 || destH <= 0) return;
  var smooth = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(sheet, Math.round(srcX), Math.round(srcY), Math.round(srcW), Math.round(srcH), destX, destY, destW, destH);
  ctx.imageSmoothingEnabled = smooth;
};

SF.drawBridge = function (ctx) {
  var r = SF.WALK.rects[0];
  if (!r) return;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (window.Art && Art.pattern) {
    ctx.beginPath();
    ctx.rect(r.x, r.y, r.w, r.h);
    ctx.clip();
    Art.fillPattern(ctx, "plank");
    ctx.fillStyle = "#5c3820";
    ctx.fillRect(r.x, r.y, 3, r.h);
    ctx.fillRect(r.x + r.w - 3, r.y, 3, r.h);
    var y;
    for (y = r.y + 6; y < r.y + r.h; y += 8) ctx.fillRect(r.x + 3, y, r.w - 6, 1);
  } else {
    ctx.fillStyle = "#8a5436";
    roundRect(ctx, r.x, r.y, r.w, r.h, 8);
    ctx.fill();
  }
  ctx.restore();
};

function roundRect(ctx, x, y, w, h, rad) {
  var r = Math.min(rad, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

SF.drawPropArt = function (ctx, prop, lit) {
  if (!window.Art || !Art.sprite) return false;
  var id = prop.kind;
  var scale = 2;
  if (id === "airship") id = "skiff";
  else if (id === "cottage" && SF.islandId === "cinderveil") id = "workshop";
  else if (id === "stake") id = lit ? "lamp_lit" : "lamp_cold";
  else if (id === "flower") {
    var c = prop.c || "";
    id = (c.indexOf("9af") !== -1 || c.indexOf("c8be") !== -1) ? "flower_tide" : (c.indexOf("ffb") !== -1 || c.indexOf("ffe") !== -1 || c.indexOf("e7a") !== -1 ? "flower_gold" : "flower");
  }   else if (id === "tree" && (SF.islandId === "cinderveil")) id = "tree_dead";
  else if (id === "bush" && (SF.islandId === "cinderveil")) id = "bush_dead";
  else if (id === "rock" && (SF.islandId === "cinderveil")) id = "basalt";
  else if (id === "tuft" && (SF.islandId === "cinderveil")) id = "tuft_dead";
  if (!Art._makers[id]) return false;
  var sc = Art.fieldScale ? Art.fieldScale(id) : 1;
  Art.sprite(ctx, id, prop.x, prop.y, { scale: sc, frame: 0, facing: "down" });
  if (prop.kind === "cottage") {
    var t = SF.reduceMotion ? 0.35 : (SF.anim || 0);
    var sx = prop.x + 40;
    var sy = prop.y - 116;
    var i, puff;
    ctx.save();
    for (i = 0; i < 3; i++) {
      puff = (t * 0.28 + i * 0.34) % 1;
      ctx.globalAlpha = (1 - puff) * 0.42;
      ctx.fillStyle = "#ddd4cc";
      ctx.beginPath();
      ctx.arc(sx + Math.sin(t * 0.7 + i) * 1.5, sy - puff * 16, 1.6 + puff * 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  return true;
};

SF.drawProp = function (ctx, prop, lit) {
  if (SF.drawPropArt(ctx, prop, lit)) return;
  var x = prop.x;
  var y = prop.y;
  var s = prop.s || 1;
  ctx.save();
  ctx.translate(x, y);
  if (prop.kind === "tree") {
    ctx.fillStyle = "rgba(40,20,40,0.2)";
    ctx.beginPath();
    ctx.ellipse(0, 6, 12 * s, 5 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#6b4030";
    ctx.fillRect(-2.5 * s, -2, 5 * s, 12 * s);
    ctx.fillStyle = "#2f8f55";
    ctx.beginPath();
    ctx.arc(0, -6 * s, 13 * s, 0, Math.PI * 2);
    ctx.arc(-8 * s, -1 * s, 9 * s, 0, Math.PI * 2);
    ctx.arc(8 * s, -2 * s, 8 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(210,255,180,0.35)";
    ctx.beginPath();
    ctx.arc(-3 * s, -10 * s, 5 * s, 0, Math.PI * 2);
    ctx.fill();
  } else if (prop.kind === "rock") {
    ctx.fillStyle = "#8d7368";
    ctx.beginPath();
    ctx.ellipse(0, 0, 11 * s, 7 * s, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#cbb6aa";
    ctx.beginPath();
    ctx.ellipse(-2 * s, -2 * s, 5 * s, 3 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (prop.kind === "flower") {
    ctx.fillStyle = prop.c || "#ffd0e8";
    var i;
    for (i = 0; i < 5; i++) {
      var a = i / 5 * Math.PI * 2 + SF.anim * 0.2;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 3, Math.sin(a) * 3, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#fff4c8";
    ctx.beginPath();
    ctx.arc(0, 0, 1.6, 0, Math.PI * 2);
    ctx.fill();
  } else if (prop.kind === "cottage") {
    ctx.fillStyle = "rgba(40,20,40,0.2)";
    ctx.beginPath();
    ctx.ellipse(0, 16, 26, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#c46a55";
    ctx.beginPath();
    ctx.arc(0, 4, 20, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = "#f2d2b0";
    ctx.fillRect(-16, 4, 32, 16);
    ctx.fillStyle = "#6b3a32";
    ctx.fillRect(-4, 8, 8, 12);
    ctx.fillStyle = lit ? "#ffe08a" : "#8aa0c8";
    ctx.fillRect(-12, 8, 6, 6);
    ctx.fillRect(6, 8, 6, 6);
    ctx.fillStyle = "#8d5344";
    ctx.fillRect(10, -8, 4, 10);
  } else if (prop.kind === "airship") {
    ctx.fillStyle = "rgba(40,20,40,0.2)";
    ctx.beginPath();
    ctx.ellipse(0, 18, 34, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#8a5a3c";
    ctx.beginPath();
    ctx.ellipse(0, 8, 30, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#6b3e2c";
    ctx.fillRect(-8, -2, 16, 10);
    ctx.strokeStyle = "#3d2a24";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.lineTo(0, -18);
    ctx.stroke();
    var sail = ctx.createLinearGradient(0, -20, 18, 6);
    sail.addColorStop(0, "#d9fbff");
    sail.addColorStop(1, "#f0c24b");
    ctx.fillStyle = sail;
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(22, 4);
    ctx.lineTo(0, 4);
    ctx.fill();
    ctx.fillStyle = "#f0c24b";
    ctx.fillRect(16, -22, 2, 8);
  } else if (prop.kind === "stones") {
    ctx.rotate(prop.face || -0.4);
    ctx.fillStyle = "#d9cfc4";
    ctx.fillRect(-16, -14, 6, 22);
    ctx.fillRect(-2, -20, 7, 28);
    ctx.fillRect(12, -12, 5, 20);
    ctx.fillStyle = "#fffaf4";
    ctx.fillRect(-15, -14, 2, 8);
  } else if (prop.kind === "ruin") {
    ctx.fillStyle = "#b08978";
    ctx.fillRect(-16, -6, 10, 16);
    ctx.fillRect(-4, -12, 8, 22);
    ctx.fillRect(8, -4, 9, 14);
  } else if (prop.kind === "plank") {
    ctx.rotate(prop.rot || 0);
    ctx.fillStyle = "#a56b45";
    ctx.fillRect(-12, -3, 24, 6);
  } else if (prop.kind === "stake") {
    ctx.strokeStyle = "#6b4030";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.lineTo(0, -8);
    ctx.stroke();
    if (lit) {
      ctx.drawImage(SF.blobs.gold, -10, -22, 20, 20);
      ctx.fillStyle = "#fff6d0";
      ctx.beginPath();
      ctx.arc(0, -12, 2.4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = "#9aa4c0";
      ctx.beginPath();
      ctx.arc(0, -12, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (SF.drawWorldProp) {
    SF.drawWorldProp(ctx, prop, lit);
  }
  ctx.restore();
};

SF.drawShadow = function (ctx, x, y, rx) {
  ctx.save();
  ctx.fillStyle = "rgba(30, 16, 40, 0.28)";
  ctx.beginPath();
  ctx.ellipse(x, y + 8, rx, rx * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

SF.artFacing = function (fx, fy) {
  fx = fx || 0;
  fy = fy || 0;
  if (Math.abs(fx) >= Math.abs(fy)) return fx < 0 ? "left" : "right";
  return fy < 0 ? "up" : "down";
};

SF.artFrame = function (moving, phase) {
  if (!moving) return 0;
  var speed = (SF.calm && SF.calm()) ? 5 : 8;
  return Math.floor((SF.anim + (phase || 0)) * speed) % 4;
};

SF.drawActor = function (ctx, id, x, y, fx, fy, moving, alpha, phase) {
  if (!window.Art || !Art.sprite) return false;
  ctx.save();
  ctx.globalAlpha = alpha == null ? 1 : alpha;
  Art.sprite(ctx, id, x, y, {
    facing: SF.artFacing(fx, fy),
    frame: SF.artFrame(moving, phase),
    pose: "walk",
    scale: Art.fieldScale(id)
  });
  ctx.restore();
  return true;
};

SF.drawWayfarer = function (ctx, x, y, fx, fy, alpha, shardstep) {
  var moving = false;
  var p = SF.state && SF.state.player;
  if (p && Math.abs(p.x - x) < 0.01 && Math.abs(p.y - y) < 0.01) {
    moving = Math.hypot(p.x - p.px, p.y - p.py) > 0.2 || p.dashT > 0;
  }
  if (SF.drawActor(ctx, "wayfarer", x, y, fx, fy, moving, alpha, shardstep ? 1 : 0)) return;
  var ang = Math.atan2(fy, fx);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#24357a";
  ctx.beginPath();
  ctx.ellipse(0, 2, 7, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

SF.drawNpc = function (ctx, id, x, y, fx, fy) {
  var moving = false;
  if (SF.drawActor(ctx, id, x, y, fx, fy, moving, 1, 0)) return;
};

SF.drawMaren = function (ctx, x, y) {
  var s = SF.state;
  var fx = s && s.player ? s.player.x - x : 0;
  var fy = s && s.player ? s.player.y - y : 1;
  if (SF.drawActor(ctx, "maren", x, y, fx, fy, false, 1, 0.2)) return;
  var bob = Math.sin(SF.anim * 2) * 1.2;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.fillStyle = "#7a3148";
  ctx.beginPath();
  ctx.ellipse(0, 4, 10, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f0c2a4";
  ctx.beginPath();
  ctx.arc(0, -8, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e4e8f0";
  ctx.beginPath();
  ctx.arc(0, -11, 6, Math.PI, 0);
  ctx.fill();
  ctx.strokeStyle = "#e8d2a4";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(10, 8);
  ctx.lineTo(10, -14);
  ctx.stroke();
  ctx.drawImage(SF.blobs.gold, 2, -26, 16, 16);
  ctx.fillStyle = "#ffc56a";
  ctx.beginPath();
  ctx.arc(10, -16, 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

SF.drawKestrel = function (ctx, x, y) {
  var s = SF.state;
  var fx = s && s.player ? s.player.x - x : 0;
  var fy = s && s.player ? s.player.y - y : 1;
  if (SF.drawActor(ctx, "kestrel", x, y, fx, fy, false, 1, 0.4)) return;
  var bob = Math.sin(SF.anim * 2.4 + 1) * 1.2;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.fillStyle = "#f0c24b";
  ctx.beginPath();
  ctx.moveTo(-4, 0);
  ctx.lineTo(-14, 6);
  ctx.lineTo(-2, 6);
  ctx.fill();
  ctx.fillStyle = "#176872";
  ctx.beginPath();
  ctx.ellipse(0, 4, 9, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e8b892";
  ctx.beginPath();
  ctx.arc(1, -8, 5.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#d7f6ff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(1, -8, 5.6, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();
  ctx.fillStyle = "#f2e2cf";
  ctx.fillRect(-1, -9, 5, 2);
  ctx.restore();
};

SF.drawCantor = function (ctx, x, y) {
  var s = SF.state;
  var calm = SF.calm && SF.calm();
  var fx = s && s.player ? s.player.x - x : 0;
  var fy = s && s.player ? s.player.y - y : 1;
  var bob = calm ? 0 : Math.sin(SF.anim * 1.2) * 1;
  if (SF.drawActor(ctx, "cantor", x, y + bob, fx, fy, false, 1, 0.6)) return;
  var bob = calm ? 0 : Math.sin(SF.anim * 1.4) * 3;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.drawImage(SF.blobs.gold, -16, -8, 32, 32);
  ctx.fillStyle = "#22182f";
  ctx.beginPath();
  ctx.ellipse(0, 8, 11, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e6c56a";
  ctx.fillRect(-11, 20, 22, 2);
  ctx.fillStyle = "#f4efe4";
  ctx.beginPath();
  ctx.ellipse(0, -10, 6, 7.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#2a2038";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(0, -8, 3.5, 0.2, Math.PI - 0.2);
  ctx.stroke();
  ctx.restore();
  if (calm) return;
  var i;
  for (i = 0; i < 3; i++) {
    var a = SF.anim * 0.8 + i * 2.1;
    ctx.fillStyle = "rgba(230,197,106,0.8)";
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * 16, y + bob + Math.sin(a) * 10, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
};

SF.drawTamsin = function (ctx, x, y) {
  var s = SF.state;
  var fx = s && s.player ? s.player.x - x : 0;
  var fy = s && s.player ? s.player.y - y : 1;
  if (SF.drawActor(ctx, "tamsin", x, y, fx, fy, false, 1, 0.8)) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#c4552a";
  ctx.beginPath();
  ctx.ellipse(0, 4, 9, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f0c2a4";
  ctx.beginPath();
  ctx.arc(0, -8, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#ffb15a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(11, 2, 6, 0.4, 4.2);
  ctx.stroke();
  ctx.restore();
};

SF.drawHesk = function (ctx, x, y) {
  var s = SF.state;
  var fx = s && s.player ? s.player.x - x : 0;
  var fy = s && s.player ? s.player.y - y : 1;
  if (SF.drawActor(ctx, "hesk", x, y, fx, fy, false, 1, 1)) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#6a5a78";
  ctx.beginPath();
  ctx.ellipse(0, 4, 8, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e6d2c0";
  ctx.beginPath();
  ctx.arc(0, -9, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#d8c4a0";
  ctx.fillRect(-7, -16, 14, 5);
  ctx.restore();
};

SF.drawIlsa = function (ctx, x, y) {
  var s = SF.state;
  var fx = s && s.player ? s.player.x - x : 0;
  var fy = s && s.player ? s.player.y - y : 1;
  if (SF.drawActor(ctx, "ilsa", x, y, fx, fy, false, 1, 1.2)) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#4a403c";
  ctx.beginPath();
  ctx.ellipse(0, 4, 11, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e7c2a4";
  ctx.beginPath();
  ctx.arc(0, -10, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#ffb15a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-12, 0);
  ctx.lineTo(12, -18);
  ctx.stroke();
  ctx.restore();
};

SF.KIND_SPRITE = {
  wisp: "wisp",
  brumekin: "brumekin",
  choirling: "choirling",
  ashmite: "ashling",
  sootwing: "sootwing",
  cinderbrute: "cinderhound",
  maw: "cinder_maw"
};

SF.drawEnemySprite = function (ctx, e) {
  var id = SF.KIND_SPRITE[e.kind];
  if (!id || !window.Art || !Art.sprite) return false;
  var s = SF.state;
  var fx = s && s.player ? s.player.x - e.x : (e.aimX || 0);
  var fy = s && s.player ? s.player.y - e.y : (e.aimY || 1);
  var moving = e.ai === "charge" || e.ai === "wind";
  var pose = (e.kind === "maw" && e.dormant) ? "idle" : "walk";
  var bob = 0;
  if (e.kind === "wisp" || e.kind === "choirling") {
    bob = (SF.calm && SF.calm()) ? 0 : Math.sin(SF.anim * 3 + (e.phase || 0)) * 1;
  }
  Art.sprite(ctx, id, e.x, e.y + bob, {
    facing: SF.artFacing(fx, fy),
    frame: SF.artFrame(moving || e.kind === "wisp" || e.kind === "sootwing", e.phase || 0),
    pose: pose,
    scale: Art.fieldScale(id)
  });
  return true;
};

SF.drawWisp = function (ctx, e) {
  if (SF.drawEnemySprite(ctx, e)) {
    if (e.hurt > 0) flash(ctx, e.x, e.y, e.r, e.hurt);
    return;
  }
  var wob = Math.sin(SF.anim * 6 + e.phase) * 2;
  ctx.save();
  ctx.globalAlpha = 0.85;
  ctx.drawImage(SF.blobs.violet, e.x - 22, e.y - 22 + wob, 44, 44);
  ctx.fillStyle = "rgba(186,160,255,0.65)";
  ctx.beginPath();
  ctx.arc(e.x, e.y + wob, e.r + wob * 0.2, 0, Math.PI * 2);
  ctx.arc(e.x - 6, e.y + 4 + wob, e.r * 0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f4fdff";
  ctx.beginPath();
  ctx.arc(e.x, e.y + wob, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (e.hurt > 0) flash(ctx, e.x, e.y + wob, e.r, e.hurt);
};

SF.drawBrume = function (ctx, e) {
  if (SF.drawEnemySprite(ctx, e)) {
    if (e.ai === "wind") {
      ctx.save();
      ctx.strokeStyle = "rgba(255,120,90,0.85)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r + 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    if (e.hurt > 0) flash(ctx, e.x, e.y, e.r, e.hurt);
    return;
  }
  ctx.save();
  ctx.translate(e.x, e.y);
  if (e.ai === "wind") ctx.scale(1.15, 0.82);
  ctx.drawImage(SF.blobs.gold, -26, -24, 52, 48);
  ctx.fillStyle = "#5c456e";
  ctx.beginPath();
  ctx.ellipse(0, 2, e.r + 2, e.r - 1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#3d2c4e";
  ctx.beginPath();
  ctx.moveTo(-10, -6);
  ctx.lineTo(-6, -16);
  ctx.lineTo(-2, -6);
  ctx.moveTo(4, -6);
  ctx.lineTo(8, -16);
  ctx.lineTo(12, -6);
  ctx.fill();
  ctx.fillStyle = "#ffb15a";
  ctx.beginPath();
  ctx.arc(0, 2, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (e.ai === "wind") {
    ctx.save();
    ctx.strokeStyle = "rgba(255,120,90,0.85)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r + 8 + (0.5 - e.wind) * 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  if (e.hurt > 0) flash(ctx, e.x, e.y, e.r, e.hurt);
};

SF.drawChoir = function (ctx, e) {
  if (SF.drawEnemySprite(ctx, e)) {
    if (e.ai === "wind") {
      ctx.save();
      ctx.strokeStyle = "rgba(220,190,255,0.8)";
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(e.x, e.y);
      ctx.lineTo(e.x + (e.aimX || 0) * 36, e.y + (e.aimY || 0) * 36);
      ctx.stroke();
      ctx.restore();
    }
    if (e.hurt > 0) flash(ctx, e.x, e.y, e.r, e.hurt);
    return;
  }
  var bob = Math.sin(SF.anim * 2 + e.phase) * 2;
  ctx.save();
  ctx.translate(e.x, e.y + bob);
  ctx.drawImage(SF.blobs.violet, -20, -28, 40, 48);
  ctx.fillStyle = "#3a2458";
  ctx.beginPath();
  ctx.ellipse(0, 4, 9, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f1e9dc";
  ctx.beginPath();
  ctx.ellipse(0, -10, 6, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#6a4a88";
  ctx.beginPath();
  ctx.moveTo(-4, -12);
  ctx.lineTo(4, -6);
  ctx.moveTo(4, -12);
  ctx.lineTo(-3, -7);
  ctx.stroke();
  ctx.fillStyle = "#e7c6ff";
  ctx.beginPath();
  ctx.arc(0, 2, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (e.ai === "wind") {
    ctx.save();
    ctx.strokeStyle = "rgba(220,190,255,0.8)";
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(e.x, e.y);
    ctx.lineTo(e.x + e.aimX * 36, e.y + e.aimY * 36);
    ctx.stroke();
    ctx.restore();
  }
  if (e.hurt > 0) flash(ctx, e.x, e.y + bob, 14, e.hurt);
};

function flash(ctx, x, y, r, hurt) {
  if (SF.calm && SF.calm()) return;
  var a = SF.clamp((hurt || 0) / 0.14, 0, 1) * 0.32;
  if (a < 0.04) return;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = "#ffe7a8";
  ctx.beginPath();
  ctx.arc(x, y, Math.max(4, r * 0.45), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

SF.drawHpPips = function (ctx, e) {
  if (e.hp >= e.maxHp && e.hurt <= 0) return;
  var w = 22;
  var x = e.x - w / 2;
  var y = e.y - Math.max(e.r + 12, 36);
  ctx.fillStyle = "rgba(20,10,30,0.65)";
  ctx.fillRect(x, y, w, 4);
  ctx.fillStyle = "#ff8ea3";
  ctx.fillRect(x, y, w * SF.clamp(e.hp / e.maxHp, 0, 1), 4);
};

SF.drawPickup = function (ctx, item, hiddenIcon) {
  var bob = Math.sin(SF.anim * 3 + item.x) * 3;
  var x = item.x;
  var y = item.y + bob;
  if (window.Art && Art.sprite && (item.kind === "shard" || item.kind === "cog" || item.kind === "bloom")) {
    var pid = item.kind === "cog" ? "cog" : (item.kind === "bloom" ? "blossom" : "shard");
    var bobY = (SF.calm && SF.calm()) ? 0 : Math.sin(SF.anim * 2 + item.x) * 2;
    Art.sprite(ctx, pid, x, y + bobY - bob, { scale: Art.fieldScale(pid), anchor: "center" });
    return;
  }
  if (item.kind === "cog") {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = "#ffb15a";
    ctx.fillStyle = "#c4552a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  } else if (item.kind === "shard") {
    if (!hiddenIcon) ctx.drawImage(SF.blobs.cyan, x - 16, y - 16, 32, 32);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(SF.anim * 0.8);
    ctx.fillStyle = "#e9fdff";
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(5, 0);
    ctx.lineTo(0, 7);
    ctx.lineTo(-5, 0);
    ctx.fill();
    ctx.restore();
  } else {
    ctx.drawImage(SF.blobs.rose, x - 12, y - 12, 24, 24);
    ctx.fillStyle = "#ffd0e8";
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
};

SF.revealU = function (s) {
  if (!s || !s.revealPan || !s.revealPan.dur) return null;
  return s.revealPan.t / s.revealPan.dur;
};

SF.palmAmt = function (s) {
  var u = SF.revealU(s);
  if (u == null || u < 0.04 || u > 0.32) return 0;
  if (u < 0.12) return (u - 0.04) / 0.08;
  if (u > 0.24) return (0.32 - u) / 0.08;
  return 1;
};

SF.lampFlareAmt = function (s) {
  var u = SF.revealU(s);
  if (u == null || u < 0.4 || u > 0.76) return 0;
  if (u < 0.5) return (u - 0.4) / 0.1;
  if (u > 0.66) return (0.76 - u) / 0.1;
  return 1;
};

SF.palmPoint = function (p) {
  var face = SF.artFacing ? SF.artFacing(p.fx || 0, p.fy || 1) : "down";
  if (face === "left") return { x: p.x - 13, y: p.y - 10 };
  if (face === "right") return { x: p.x + 13, y: p.y - 10 };
  if (face === "up") return { x: p.x - 7, y: p.y - 12 };
  return { x: p.x + 7, y: p.y - 11 };
};

SF.drawLampCrystal = function (ctx, lit) {
  var x = SF.LAMP.x;
  var y = SF.LAMP.y;
  var crystalY = y - 126;
  var flare = SF.lampFlareAmt ? SF.lampFlareAmt(SF.state) : 0;
  var showLit = lit || flare > 0.35;
  if (window.Art && Art.sprite) {
    if ((showLit || flare > 0) && SF.blobs) {
      ctx.save();
      ctx.globalAlpha = showLit ? 0.9 : 0.35 + flare * 0.6;
      var bloom = showLit ? 72 : 40 + flare * 36;
      ctx.drawImage(SF.blobs.gold, x - bloom / 2, crystalY - bloom / 2, bloom, bloom);
      ctx.restore();
    }
    var lampId = showLit ? "great_lamp_lit" : "great_lamp";
    if (!Art._makers[lampId]) lampId = showLit ? "lamp_lit" : "lamp_cold";
    Art.sprite(ctx, lampId, x, y + 10, { scale: Art.fieldScale(lampId) });
    if (!lit && SF.state && SF.state.shardsHeld >= SF.QUEST_SHARDS && SF.state.quest === "gather") {
      var calmReady = SF.calm && SF.calm();
      ctx.save();
      ctx.globalAlpha = calmReady ? 0.45 : 0.4;
      ctx.strokeStyle = "#ffe7a8";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, crystalY, 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    return;
  }
  var flick = (SF.calm && SF.calm()) ? 1 : (0.97 + Math.sin(SF.anim * 1.4) * 0.03);
  ctx.save();
  ctx.fillStyle = "#8d7368";
  ctx.fillRect(x - 10, y + 6, 20, 8);
  ctx.fillRect(x - 3, y - 2, 6, 12);
  if (lit || flare > 0) {
    var bloom = (lit ? 72 : 40 + flare * 36) * (lit ? flick : 1);
    ctx.globalAlpha = lit ? 0.9 : 0.35 + flare * 0.6;
    ctx.drawImage(SF.blobs.gold, x - bloom / 2, crystalY - bloom / 2, bloom, bloom);
    ctx.globalAlpha = 1;
  } else {
    ctx.drawImage(SF.blobs.violet, x - 16, crystalY - 16, 32, 32);
  }
  ctx.fillStyle = lit || flare > 0.35 ? "#fff8e4" : "#c9b6e8";
  ctx.beginPath();
  ctx.moveTo(x, crystalY - 8);
  ctx.lineTo(x + 7, crystalY);
  ctx.lineTo(x, crystalY + 8);
  ctx.lineTo(x - 7, crystalY);
  ctx.fill();
  ctx.restore();
  if (!lit && SF.state && SF.state.shardsHeld >= SF.QUEST_SHARDS && SF.state.quest === "gather") {
    var calm = SF.calm && SF.calm();
    var pulse = calm ? 0.4 : (0.34 + Math.sin(SF.anim * 1.4) * 0.08);
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.strokeStyle = "#ffe7a8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, crystalY, calm ? 14 : (13 + Math.sin(SF.anim * 1.4) * 1), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
};

SF.drawBobber = function (ctx, x, y) {
  var bob = (SF.calm && SF.calm()) ? 0 : Math.sin(SF.anim * 2) * 2;
  ctx.save();
  ctx.translate(x, y - 28 + bob);
  ctx.fillStyle = "#ffd37a";
  ctx.beginPath();
  ctx.moveTo(0, -5);
  ctx.lineTo(4, 0);
  ctx.lineTo(0, 5);
  ctx.lineTo(-4, 0);
  ctx.fill();
  ctx.restore();
};

SF.entityList = function (s) {
  var list = [];
  var lit = SF.lampIsLit ? SF.lampIsLit(s) : !!s.flags.lampLit;
  SF.PROPS.forEach(function (prop) {
    list.push({ y: prop.y, draw: function (ctx) { SF.drawProp(ctx, prop, lit); } });
  });
  (SF.TEXTS || []).forEach(function (mark) {
    var sid = "";
    if (/sign|order/i.test(mark.id) || /sign/i.test(mark.speaker || "")) sid = "sign";
    else if (/bell/i.test(mark.id)) sid = "bell";
    if (!sid || !window.Art) return;
    list.push({
      y: mark.y,
      draw: function (ctx) { Art.sprite(ctx, sid, mark.x, mark.y, { scale: 1 }); }
    });
  });
  (SF.EXTRAS || []).forEach(function (extra) {
    list.push({
      y: extra.y,
      draw: function (ctx) {
        ctx.save();
        if (SF.drawExtra && SF.drawExtra(ctx, extra)) {
          ctx.restore();
          return;
        }
        if (extra.kind === "bench" && window.Art && Art.sprite) {
          Art.sprite(ctx, "bench", extra.x, extra.y, { scale: 1 });
        } else if (extra.kind === "bench") {
          ctx.fillStyle = "#6a5348";
          ctx.fillRect(extra.x - 14, extra.y - 4, 28, 6);
          ctx.fillRect(extra.x - 12, extra.y - 10, 4, 8);
          ctx.fillRect(extra.x + 8, extra.y - 10, 4, 8);
        } else if (window.Art && Art.sprite) {
          Art.sprite(ctx, "stones", extra.x, extra.y, { scale: 1 });
        } else {
          ctx.fillStyle = "#8a6860";
          ctx.beginPath();
          ctx.arc(extra.x, extra.y, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#ffb15a";
          ctx.fillRect(extra.x - 1, extra.y - 10, 2, 8);
        }
        ctx.restore();
      }
    });
  });
  SF.activePickups().forEach(function (item) {
    if (item.kind === "shard" && SF.state && SF.state.player && SF.dist(SF.state.player.x, SF.state.player.y, item.x, item.y) > 96) return;
    list.push({ y: item.y, draw: function (ctx) { SF.drawPickup(ctx, item, false); } });
  });
  list.push({ y: SF.LAMP.y, draw: function (ctx) { SF.drawLampCrystal(ctx, lit); } });
  SF.NPCS.forEach(function (n) {
    if (SF.npcHidden && SF.npcHidden(n)) return;
    var nx = n.x;
    var ny = n.y;
    if (n.id === "cantor" && SF.cantorWorldPos) {
      var spot = SF.cantorWorldPos();
      if (spot) {
        nx = spot.x;
        ny = spot.y;
      }
    }
    list.push({
      y: ny,
      draw: function (ctx) {
        SF.drawShadow(ctx, nx, ny, 10);
        var drewActor = SF.drawActor && SF.drawActor(ctx, n, nx, ny);
        if (!drewActor) {
          if (n.id === "maren") SF.drawMaren(ctx, nx, ny);
          else if (n.id === "kestrel") SF.drawKestrel(ctx, nx, ny);
          else if (n.id === "tamsin") SF.drawTamsin(ctx, nx, ny);
          else if (n.id === "hesk") SF.drawHesk(ctx, nx, ny);
          else if (n.id === "ilsa") SF.drawIlsa(ctx, nx, ny);
          else SF.drawCantor(ctx, nx, ny);
        }
        var walking = n.id === "cantor" && s.approach && s.approach.kind === "cantor";
        if (walking || (s.mode === "play" && SF.dist(s.player.x, s.player.y, nx, ny) < 90)) {
          ctx.save();
          ctx.font = "600 12px Palatino, Georgia, serif";
          ctx.textAlign = "center";
          ctx.fillStyle = "#fff8ee";
          ctx.fillText(n.name, nx, ny - 34);
          ctx.restore();
        }
      }
    });
  });
  s.enemies.forEach(function (e) {
    if (!e.alive && e.dying <= 0) return;
    list.push({
      y: e.y,
      draw: function (ctx) {
        ctx.save();
        if (e.dying > 0) ctx.globalAlpha = Math.max(0, e.dying / 0.45);
        SF.drawShadow(ctx, e.x, e.y, e.r);
        var foeSprite = SF.foeSprite ? SF.foeSprite(e) : null;
        var bigFoe = e.boss || e.kind === "maw" || e.kind === "tidewyrm";
        var foeScale = (window.Art && Art.fieldScale) ? Art.fieldScale(foeSprite || "wayfarer") : 1;
        var drewFoe = foeSprite && SF.tryArtSprite && SF.tryArtSprite(ctx, foeSprite, e.x, e.y, { scale: foeScale });
        if (!drewFoe) {
          if (e.kind === "wisp") SF.drawWisp(ctx, e);
          else if (e.kind === "brumekin") SF.drawBrume(ctx, e);
          else if (e.kind === "choirling") SF.drawChoir(ctx, e);
          else if (SF.drawWorldFoe && SF.drawWorldFoe(ctx, e)) {}
          else if (SF.drawFoe) SF.drawFoe(ctx, e);
        }
        SF.drawHpPips(ctx, e);
        ctx.restore();
      }
    });
  });
  var p = s.player;
  list.push({
    y: p.y,
    draw: function (ctx) {
      var alpha = 1;
      if (p.iFrames > 0 && !(SF.calm && SF.calm())) alpha = 0.84;
      if (!SF.walkable(p.x, p.y)) alpha *= 0.7;
      var sink = SF.walkable(p.x, p.y) ? 0 : Math.min(10, p.fall * 36);
      s.ghosts.forEach(function (g) {
        SF.drawWayfarer(ctx, g.x, g.y, g.fx, g.fy, g.a, p.shardstep);
      });
      SF.drawShadow(ctx, p.x, p.y, 11);
      ctx.save();
      ctx.strokeStyle = "rgba(185, 248, 255, 0.9)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y + 4, 10, 4, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      SF.drawWayfarer(ctx, p.x, p.y + sink, p.fx, p.fy, alpha, p.shardstep);
      var palm = SF.palmAmt ? SF.palmAmt(s) : 0;
      if (palm > 0 && SF.blobs) {
        var hand = SF.palmPoint(p);
        ctx.save();
        ctx.globalAlpha = 0.4 + palm * 0.6;
        ctx.drawImage(SF.blobs.cyan, hand.x - 11, hand.y - 11, 22, 22);
        ctx.drawImage(SF.blobs.gold, hand.x - 6, hand.y - 6, 12, 12);
        ctx.restore();
      }
      if (p.swinging) {
        var ang = Math.atan2(p.fy, p.fx);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.strokeStyle = "rgba(255, 248, 220, 0.9)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, 28, ang - 1.0, ang + 1.0);
        ctx.stroke();
        ctx.restore();
      }
    }
  });
  list.sort(function (a, b) { return a.y - b.y; });
  return list;
};

SF.goalPrecise = function (goal) {
  return !goal || goal.kind !== "shard" || goal.precise !== false;
};

SF.drawGuide = function (ctx, s) {
  if (!s || s.mode !== "play" || !SF.objectivePoint) return;
  var goal = SF.objectivePoint(s);
  if (!goal || !SF.goalPrecise(goal)) return;
  var p = s.player;
  var dx = goal.x - p.x;
  var dy = goal.y - p.y;
  var d = Math.hypot(dx, dy) || 1;
  if (d > 70) {
    var ang = Math.atan2(dy, dx);
    ctx.save();
    ctx.translate(p.x + Math.cos(ang) * 28, p.y + Math.sin(ang) * 28);
    ctx.rotate(ang);
    ctx.fillStyle = "rgba(255, 211, 122, 0.95)";
    ctx.strokeStyle = "rgba(20, 10, 30, 0.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(9, 0);
    ctx.lineTo(-7, 5);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-7, -5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  if (d > 40) SF.drawBobber(ctx, goal.x, goal.y);
};

SF.drawEdgeArrow = function (ctx, w, h, s) {
  if (!s || s.mode !== "play" || !SF.objectivePoint) return;
  var goal = SF.objectivePoint(s);
  if (!goal) return;
  var sensed = goal.kind === "shard" && goal.precise === false;
  var zoom = SF.zoom || 1;
  var sx = (goal.x - s.camX) * zoom + w / 2;
  var sy = (goal.y - s.camY) * zoom + h / 2;
  var left = 28;
  var right = w - 28;
  var top = 88;
  var bottom = h - 150;
  if (!sensed && sx > left && sx < right && sy > top && sy < bottom) return;
  var cx = w / 2;
  var cy = h / 2;
  var dx = sx - cx;
  var dy = sy - cy;
  if (!dx && !dy) return;
  var t = Infinity;
  if (dx > 0) t = Math.min(t, (right - cx) / dx);
  else if (dx < 0) t = Math.min(t, (left - cx) / dx);
  if (dy > 0) t = Math.min(t, (bottom - cy) / dy);
  else if (dy < 0) t = Math.min(t, (top - cy) / dy);
  if (!isFinite(t) || t < 0) t = 1;
  ctx.save();
  ctx.translate(cx + dx * t, cy + dy * t);
  ctx.rotate(Math.atan2(dy, dx));
  if (sensed) ctx.globalAlpha = 0.55 + Math.sin((SF.anim || 0) * 5) * 0.4;
  ctx.fillStyle = sensed ? "#9af6ff" : "#ffd37a";
  ctx.strokeStyle = "rgba(20, 10, 30, 0.7)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(12, 0);
  ctx.lineTo(-8, 8);
  ctx.lineTo(-3, 0);
  ctx.lineTo(-8, -8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
};

SF.drawFx = function (ctx, s) {
  s.projectiles.forEach(function (shot) {
    ctx.drawImage(SF.blobs.violet, shot.x - 10, shot.y - 10, 20, 20);
    ctx.fillStyle = "#f6e9ff";
    ctx.beginPath();
    ctx.arc(shot.x, shot.y, 3, 0, Math.PI * 2);
    ctx.fill();
  });
  s.particles.forEach(function (part) {
    ctx.globalAlpha = Math.max(0, part.life / part.max);
    ctx.fillStyle = part.color;
    ctx.beginPath();
    ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  if (s.ring) {
    var u = 1 - s.ring.life / 0.9;
    ctx.save();
    ctx.globalAlpha = Math.max(0, s.ring.life);
    ctx.strokeStyle = "#ffe7a8";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(s.ring.x, s.ring.y, 12 + u * s.ring.max, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  ctx.save();
  ctx.font = "700 13px Palatino, Georgia, serif";
  ctx.textAlign = "center";
  s.floaters.forEach(function (f) {
    ctx.globalAlpha = Math.max(0, f.life / 0.75);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
  });
  ctx.restore();
  ctx.globalAlpha = 1;
  SF.drawGuide(ctx, s);

  var near = null;
  if (s.mode === "play") near = SF.nearestInteract();
  if (near) {
    var nx = near.kind === "lamp" ? SF.LAMP.x : near.ref.x;
    var ny = near.kind === "lamp" ? SF.LAMP.y : near.ref.y;
    var calm = SF.calm && SF.calm();
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = "#fff4d2";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(nx, ny, calm ? 20 : (19 + Math.sin(SF.anim * 1.6) * 1), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  if (SF.drawGrappleFx) SF.drawGrappleFx(ctx, s);
};

SF.drawVignette = function (ctx, w, h, s) {
  var lit = SF.lampIsLit ? SF.lampIsLit(s) : !!(s.flags && s.flags.lampLit);
  var cinder = SF.islandId === "cinderveil";
  var key = (SF.islandId || "emberhold") + (lit ? "1" : "0") + ":" + w + "x" + h;
  if (SF._vigKey !== key) {
    var sheet = document.createElement("canvas");
    sheet.width = Math.max(1, Math.round(w * 0.5));
    sheet.height = Math.max(1, Math.round(h * 0.5));
    var gctx = sheet.getContext("2d");
    var g = gctx.createRadialGradient(sheet.width / 2, sheet.height / 2, Math.min(sheet.width, sheet.height) * 0.35, sheet.width / 2, sheet.height / 2, Math.max(sheet.width, sheet.height) * 0.72);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, cinder ? (lit ? "rgba(48,18,8,0.30)" : "rgba(28,10,8,0.5)") : (lit ? "rgba(20,8,40,0.28)" : "rgba(12,6,28,0.48)"));
    gctx.fillStyle = g;
    gctx.fillRect(0, 0, sheet.width, sheet.height);
    SF._vig = sheet;
    SF._vigKey = key;
  }
  ctx.drawImage(SF._vig, 0, 0, w, h);
};

SF.draw = function () {
  var canvas = SF.view;
  var ctx = SF.ctx;
  var s = SF.state;
  if (!canvas || !ctx || !s || !SF.blobs) return;
  var w = SF.viewW;
  var h = SF.viewH;
  var dpr = SF.dpr;
  if (!w || !h) return;
  if (s.mode === "title" && SF.drawTitleScene) {
    SF.drawTitleScene(ctx, w, h, dpr);
    return;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.globalAlpha = 1;
  if ((s.mode === "voyage" || s.voyageTalk) && SF.drawVoyage) {
    SF.drawVoyage(ctx, w, h, s);
    SF.drawVignette(ctx, w, h, s);
    return;
  }
  SF.drawSky(ctx, w, h, s);
  var zoom = SF.zoomFor(w, h);
  SF.zoom = zoom;
  var shake = (SF.calm && SF.calm()) ? 0 : Math.min(2.2, s.shake || 0);
  var sx = Math.sin(SF.anim * 24) * shake;
  var sy = Math.cos(SF.anim * 19) * shake;
  var pxScale = Math.max(1, Math.round(dpr * zoom));
  var camX = Math.round(s.camX);
  var camY = Math.round(s.camY);
  ctx.setTransform(
    pxScale,
    0,
    0,
    pxScale,
    Math.round(dpr * (w / 2 + sx) - camX * pxScale),
    Math.round(dpr * (h / 2 + sy) - camY * pxScale)
  );
  ctx.imageSmoothingEnabled = false;
  SF.drawClouds(ctx, s);
  SF.drawTerrain(ctx, s);
  if (SF.drawCinderCracks) SF.drawCinderCracks(ctx);
  SF.entityList(s).forEach(function (ent) { ent.draw(ctx); });
  SF.drawFx(ctx, s);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.globalAlpha = 1;
  ctx.imageSmoothingEnabled = true;
  SF.drawVignette(ctx, w, h, s);
  SF.drawEdgeArrow(ctx, w, h, s);
  SF.drawMap();
};

SF.drawMap = function () {
  var canvas = SF.map;
  var s = SF.state;
  if (!canvas || !s || s.mode === "title") return;
  if (!SF._mapCtx || SF._mapCtx.canvas !== canvas) SF._mapCtx = canvas.getContext("2d");
  var ctx = SF._mapCtx;
  var w = canvas.width;
  var h = canvas.height;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, w, h);
  var minX = Infinity;
  var minY = Infinity;
  var maxX = -Infinity;
  var maxY = -Infinity;
  function mapBound(c) {
    var f = SF.foot(c);
    minX = Math.min(minX, f.x - f.rx);
    minY = Math.min(minY, f.y - f.ry);
    maxX = Math.max(maxX, f.x + f.rx);
    maxY = Math.max(maxY, f.y + f.ry);
  }
  SF.WALK.circles.forEach(mapBound);
  (SF.WALK.rects || []).forEach(mapBound);
  var pad = 16;
  var scale = Math.min((w - pad * 2) / (maxX - minX), (h - pad * 2) / (maxY - minY));
  function mx(x) { return pad + (x - minX) * scale; }
  function my(y) { return pad + (y - minY) * scale; }
  ctx.fillStyle = "rgba(18, 12, 36, 0.2)";
  ctx.fillRect(0, 0, w, h);
  var mapColors = {
    ember: "#5cba78",
    perch: "#73cbb4",
    cinder: "#e0b15a",
    span: "#b88870",
    quay: "#8d8680",
    ash: "#a89890",
    vault: "#6e4038",
    scar: "#c45a48",
    ridge: "#7eb8c8",
    salt: "#5ec4b0",
    shore: "#e0c07a",
    wreck: "#5c6560",
    wyrm: "#1e4e58",
    hs: "#c4a070",
    road: "#b89070",
    gull: "#a8a49c",
    drift: "#8a74b0"
  };
  Object.keys(mapColors).forEach(function (name) {
    var group = SF.groups[name];
    if (!group || !group.length) return;
    ctx.beginPath();
    group.forEach(function (c) {
      var f = SF.foot(c);
      if (f.rect && c.w != null) {
        ctx.rect(mx(c.x), my(c.y), c.w * scale, c.h * scale);
        return;
      }
      ctx.moveTo(mx(f.x + f.rx), my(f.y));
      if (ctx.ellipse) ctx.ellipse(mx(f.x), my(f.y), Math.max(1, f.rx * scale), Math.max(1, f.ry * scale), 0, 0, Math.PI * 2);
      else ctx.arc(mx(f.x), my(f.y), Math.max(1, Math.min(f.rx, f.ry) * scale), 0, Math.PI * 2);
    });
    ctx.fillStyle = mapColors[name];
    ctx.fill();
  });
  SF.activePickups().forEach(function (item) {
    if (item.kind !== "cog") return;
    ctx.fillStyle = "#ffb15a";
    ctx.fillRect(mx(item.x) - 1.5, my(item.y) - 1.5, 3, 3);
  });
  s.enemies.forEach(function (e) {
    if (!e.alive) return;
    if (e.kind !== "maw" && e.kind !== "tidewyrm") return;
    ctx.fillStyle = "rgba(255,120,140,0.9)";
    ctx.beginPath();
    ctx.arc(mx(e.x), my(e.y), 2, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = (SF.lampIsLit ? SF.lampIsLit(s) : s.flags.lampLit) ? "#ffe7a8" : "#c9b6e8";
  ctx.fillRect(mx(SF.LAMP.x) - 2, my(SF.LAMP.y) - 2, 4, 4);
  var goal = SF.objectivePoint(s);
  if (goal && SF.goalPrecise(goal)) {
    ctx.globalAlpha = (SF.calm && SF.calm()) ? 0.92 : (0.8 + Math.sin(SF.anim * 1.4) * 0.12);
    ctx.fillStyle = "#ffd37a";
    ctx.beginPath();
    ctx.arc(mx(goal.x), my(goal.y), 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (goal && s.player) {
    var px = mx(s.player.x);
    var py = my(s.player.y);
    var gx = mx(goal.x) - px;
    var gy = my(goal.y) - py;
    var glen = Math.hypot(gx, gy) || 1;
    var tick = Math.min(12, glen * 0.35);
    ctx.globalAlpha = 0.55 + Math.sin((SF.anim || 0) * 5) * 0.35;
    ctx.fillStyle = "#9af6ff";
    ctx.beginPath();
    ctx.moveTo(px + gx / glen * (tick + 4), py + gy / glen * (tick + 4));
    ctx.lineTo(px + gx / glen * tick - gy / glen * 3, py + gy / glen * tick + gx / glen * 3);
    ctx.lineTo(px + gx / glen * tick + gy / glen * 3, py + gy / glen * tick - gx / glen * 3);
    ctx.closePath();
    ctx.fill();
  }
  if (s.discovered && s.discovered.vault && SF.islandId === "cinderveil") {
    var heart = null;
    SF.WALK.circles.forEach(function (c) { if (c.id === "vault-heart") heart = c; });
    if (heart) {
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "#ffb15a";
      ctx.lineWidth = 1;
      ctx.strokeRect(mx(heart.x) - 3, my(heart.y) - 3, 6, 6);
    }
  }
  if (s.discovered.hollow || s.flags.metCantor || s.flags.cinderLit) {
    var cantor = null;
    SF.NPCS.forEach(function (n) { if (n.id === "cantor") cantor = n; });
    if (cantor && !(SF.npcHidden && SF.npcHidden(cantor))) {
      var lived = SF.cantorWorldPos && SF.cantorWorldPos();
      var cx = lived ? lived.x : cantor.x;
      var cy = lived ? lived.y : cantor.y;
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#e6c56a";
      ctx.fillRect(mx(cx) - 1.5, my(cy) - 1.5, 3, 3);
    }
  }
  ctx.globalAlpha = 1;
  var p = s.player;
  ctx.save();
  ctx.translate(mx(p.x), my(p.y));
  ctx.rotate(Math.atan2(p.fy, p.fx));
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.moveTo(5, 0);
  ctx.lineTo(-3, 3);
  ctx.lineTo(-3, -3);
  ctx.fill();
  ctx.restore();
};
