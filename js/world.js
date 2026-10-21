"use strict";

// World layer for v0.3: sail chart, islands, chests, shops, inns,
// field encounters. Map numbers live in js/content/maps/.
var SF = window.SF || {};
window.SF = SF;

SF.ACTOR_SPRITE = {
  maren: "maren",
  kestrel: "kestrel",
  tamsin: "tamsin",
  hesk: "hesk",
  ilsa: "ilsa",
  cantor: "cantor"
};

SF.itemInfo = function (id) {
  var src = SF.itemById ? SF.itemById(id) : (SF.ITEMS && SF.ITEMS[id]);
  if (!src) return { id: id, name: id, price: 0, sell: 0, desc: "" };
  return src;
};

SF.destinationById = function (id) {
  var i, list = SF.DESTINATIONS || [];
  for (i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
  return null;
};

SF.destinationOpen = function (id) {
  var d = SF.destinationById(id);
  var flags = (SF.state && SF.state.flags) || {};
  if (!d) return !!(SF.ISLANDS && SF.ISLANDS[id] && flags.sailUnlocked);
  if (!flags.sailUnlocked) return false;
  if (d.unlock === "soon" || d.unlock === "hold") return false;
  if (d.unlock === "act1") return !!flags.act1;
  return true;
};

SF.destinationLockText = function (id) {
  var d = SF.destinationById(id);
  var flags = (SF.state && SF.state.flags) || {};
  if (!flags.sailUnlocked) return "The skiff is not ready.";
  if (d && (d.unlock === "soon" || d.unlock === "hold")) return "Coming soon";
  if (d && d.unlock === "act1" && !flags.act1) return "That island opens after Act 1.";
  return "That route is not open.";
};

SF.healParty = function (fraction) {
  var s = SF.state;
  if (!s) return;
  var full = fraction == null || fraction >= 1;
  if (s.party && s.party.members && SF.activeParty && SF.memberStats) {
    SF.activeParty(s).forEach(function (id) {
      var m = s.party.members[id];
      var st = SF.memberStats(s, id);
      if (!m || !st) return;
      m.hp = full ? st.maxHp : Math.max(1, Math.ceil(st.maxHp * fraction));
      m.sp = full ? st.maxSp : Math.max(0, Math.ceil((st.maxSp || 0) * fraction));
    });
    var way = s.party.members.wayfarer;
    if (way) s.player.hp = way.hp;
    if (SF.syncFieldVitals) SF.syncFieldVitals(s);
  } else if (s.player) {
    s.player.hp = full ? s.player.maxHp : Math.max(1, Math.ceil(s.player.maxHp * fraction));
  }
};

SF.respawnFieldEnemies = function () {};

SF.restAtInn = function (spot) {
  var s = SF.state;
  if (!s) return;
  SF.healParty(1);
  SF.respawnFieldEnemies();
  var x = spot && spot.x != null ? spot.x : s.player.x;
  var y = spot && spot.y != null ? spot.y : s.player.y;
  s.lastRest = { island: SF.islandId, x: x, y: y };
  if (SF.rememberCheckpoint) SF.rememberCheckpoint(x, y, { kind: "inn", quiet: true, raw: true });
  else s.checkpoint = { x: x, y: y, island: SF.islandId, kind: "inn" };
  s.mode = "play";
  SF.pushToast("Rested. Heart is full. The journey is saved.", 2.2);
  if (SF.saveGame) SF.saveGame();
};

SF.chestSummary = function (chest) {
  var rows = SF.chestRows(chest);
  if (!rows.length) return "Empty.";
  return rows.map(function (row) { return row.line; }).join(" ");
};

SF.chestRows = function (chest) {
  var rows = [];
  if (!chest) return rows;
  (chest.items || []).forEach(function (it) {
    var info = SF.itemInfo(it.id);
    var n = it.n || 1;
    var desc = info.desc || "";
    var line = "Found: " + info.name + " \u00d7" + n + ".";
    if (desc) line += " " + desc;
    if (info.users && info.users.indexOf("wayfarer") < 0 && info.users.indexOf("kestrel") >= 0) {
      line += " Kestrel can use this.";
    }
    rows.push({
      kind: "item",
      id: it.id,
      name: info.name,
      n: n,
      desc: desc,
      line: line
    });
  });
  if (chest.marks) {
    rows.push({
      kind: "marks",
      id: "marks",
      name: "marks",
      n: chest.marks,
      desc: "Spend them in shops.",
      line: "Found: " + chest.marks + " marks. Spend them in shops."
    });
  }
  return rows;
};

SF.openChest = function (chest) {
  var s = SF.state;
  if (!s || !chest) return;
  if (s.picked[chest.id]) {
    SF.pushToast("Empty.", 1.2);
    return;
  }
  var rows = SF.chestRows(chest);
  s.picked[chest.id] = true;
  (chest.items || []).forEach(function (it) { SF.giveItem(it.id, it.n || 1); });
  if (chest.marks) s.gold = (s.gold || 0) + chest.marks;
  s.chestAnim = { id: chest.id, start: Date.now(), dur: 480 };
  if (!rows.length) {
    SF.pushToast("Empty.", 1.2);
  } else {
    s.chestLoot = { id: chest.id, rows: rows };
    SF.releaseHolds();
    s.mode = "chest";
    // The tap that opened the chest is still finishing (its click lands ~100ms
    // later on the new overlay). Ignore input briefly and require a fresh press.
    s.chestOpenAt = Date.now();
    s.chestArmed = false;
    if (SF.inputState) SF.inputState.interactEdge = false;
  }
  if (window.Sfx) Sfx.play("pickup");
  if (SF.saveGame) SF.saveGame({ silent: true });
};

SF.closeChest = function () {
  var s = SF.state;
  if (!s || s.mode !== "chest") return;
  s.mode = "play";
  s.chestLoot = null;
  s.chestArmed = false;
  if (SF.inputState) SF.inputState.interactEdge = false;
};

SF.CHEST_LOCK_MS = 300;
SF.chestLocked = function () {
  var s = SF.state;
  return !s || Date.now() - (s.chestOpenAt || 0) < SF.CHEST_LOCK_MS;
};

SF.chestOpenT = function (id) {
  var s = SF.state;
  if (!s || !s.picked || !s.picked[id]) return 0;
  if (SF.reduceMotion) return 1;
  var anim = s.chestAnim;
  if (!anim || anim.id !== id || !(anim.dur > 0)) return 1;
  var t = (Date.now() - anim.start) / anim.dur;
  if (t >= 1) return 1;
  if (t <= 0) return 0;
  return 1 - Math.pow(1 - t, 3);
};

SF.openShop = function (shop) {
  var s = SF.state;
  if (!s || !shop) return;
  SF.releaseHolds();
  s.shop = shop;
  s.mode = "shop";
};

SF.shopStockId = function (row) {
  return row && row.id ? row.id : row;
};

SF.shopOffers = function (id) {
  var shop = SF.state && SF.state.shop;
  if (!shop) return false;
  var i, stock = shop.stock || [];
  for (i = 0; i < stock.length; i++) if (SF.shopStockId(stock[i]) === id) return true;
  return false;
};

SF.buyFromShop = function (id) {
  if (!SF.shopOffers(id)) return false;
  if (!SF.shopBuy(id)) {
    SF.pushToast("Not enough marks.", 1.4);
    return false;
  }
  if (window.Sfx) Sfx.play("ui");
  SF.pushToast("Bought " + SF.itemInfo(id).name + ".", 1.2);
  return true;
};

SF.sellToShop = function (id) {
  var s = SF.state;
  if (!s || !s.shop) return false;
  var it = SF.itemInfo(id);
  if (!SF.shopSell(id)) return false;
  if (window.Sfx) Sfx.play("ui");
  SF.pushToast("Sold " + it.name + " for " + (it.sell || 0) + " marks.", 1.2);
  return true;
};

SF.openInn = function (inn) {
  var s = SF.state;
  if (!s || !inn) return;
  SF.releaseHolds();
  s.inn = inn;
  s.mode = "inn";
};

SF.raiseWorldEvent = function (name) {
  var list = SF._dlgListeners && SF._dlgListeners[name];
  if (!list) return;
  var i;
  for (i = 0; i < list.length; i++) list[i](name);
};

SF.lightSaltmereLamp = function () {
  var s = SF.state;
  if (!s) return false;
  if (!s.flags) s.flags = {};
  if (s.flags.saltmere_lamp === "lit") return false;
  s.flags.saltmere_lamp = "lit";
  SF.pushBanner("The lamp holds.", "");
  SF.raiseWorldEvent("saltmere_lamp_lit");
  if (SF.saveGame) SF.saveGame({ silent: true });
  return true;
};

SF.showNotice = function (title, text) {
  var s = SF.state;
  if (!s) return;
  SF.releaseHolds();
  s.notice = { title: title || "Notice", text: text || "" };
  s.mode = "notice";
};

SF.closeWorldPanel = function () {
  var s = SF.state;
  if (!s) return;
  if (s.mode === "chest") {
    SF.closeChest();
    return;
  }
  if (s.mode === "shop" || s.mode === "inn" || s.mode === "notice" || s.mode === "sailmenu") s.mode = "play";
};

SF.maybeSeaFight = function (s) {
  if (!s || !s.voyage || s.voyage.talk || !SF.Battle || !SF.Battle.start) return false;
  var chance = SF.seaFightChance;
  var fight = chance != null ? chance >= 1 : ((s.voyageCount || 0) % 3 === 0);
  if (!fight) return false;
  s.voyage.paused = true;
  s.mode = "play";
  var ok = SF.Battle.start("sea_hush_raiders", {
    boss: false,
    canFlee: true,
    fixed: true,
    zoneLevel: 6,
    bg: "hush_deck",
    onWin: function () {
      if (!s.voyage) return;
      s.voyage.paused = false;
      s.mode = "voyage";
      if (window.Music) Music.play("sail");
    },
    onLose: function () {
      s.voyage = null;
      s.voyageTalk = false;
    }
  });
  if (!ok && s.voyage) {
    s.voyage.paused = false;
    s.mode = "voyage";
  }
  return !!ok;
};

SF.foeSprite = function (e) {
  var look = SF.FOE_LOOK && SF.FOE_LOOK[e.kind];
  return look ? look.sprite : null;
};

SF.tryArtSprite = function (ctx, id, x, y, opts) {
  if (!id || !window.Art || typeof Art.sprite !== "function") return false;
  var o = {
    frame: opts && opts.frame != null ? opts.frame : 0,
    facing: opts && opts.facing != null ? opts.facing : "down",
    scale: opts && opts.scale != null ? opts.scale : 1,
    pose: (opts && opts.pose) || "walk"
  };
  if (SF.calm && SF.calm() && o.pose === "walk") o.frame = 0;
  try {
    Art.sprite(ctx, id, x, y, o);
    return true;
  } catch (err) {
    return false;
  }
};

SF.drawVillager = function (ctx, x, y, tunic, skin) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = tunic || "#3e6e78";
  ctx.beginPath();
  ctx.ellipse(0, 4, 8, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = skin || "#f0c7a4";
  ctx.beginPath();
  ctx.arc(0, -8, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

(function () {
  var pixelActor = SF.drawActor;
  SF.drawActor = function (ctx, n, x, y, fx, fy, moving, alpha, phase) {
    if (typeof n === "string") {
      return pixelActor ? pixelActor(ctx, n, x, y, fx, fy, moving, alpha, phase) : false;
    }
    var sprite = (n && n.sprite) || (n && SF.ACTOR_SPRITE[n.id]);
    if (!sprite) return false;
    var calm = SF.calm && SF.calm();
    var cast = window.Art && Art.fieldCast && Art.fieldCast[sprite];
    var frame = calm ? 0 : Math.floor((SF.anim || 0) * (cast ? 2 : 4)) % (cast ? 2 : 4);
    var pose = cast ? "stand" : "walk";
    var facing = "down";
    var p = SF.state && SF.state.player;
    if (p && x != null && y != null) {
      var dx = p.x - x;
      var dy = p.y - y;
      if (Math.abs(dx) > 18 || Math.abs(dy) > 18) {
        facing = Math.abs(dx) >= Math.abs(dy) ? (dx < 0 ? "left" : "right") : (dy < 0 ? "up" : "down");
      }
    }
    if (SF.tryArtSprite(ctx, sprite, x, y, { frame: frame, facing: facing, scale: 1, pose: pose })) return true;
    if (n && n.sprite) {
      var tint = n.sprite === "villager_b" ? "#6a5348" : "#2f6a68";
      SF.drawVillager(ctx, x, y, tint, "#f0c7a4");
      return true;
    }
    return false;
  };
})();

SF.drawWorldFoe = function (ctx, e) {
  var look = SF.FOE_LOOK && SF.FOE_LOOK[e.kind];
  if (!look || !look.body) return false;
  ctx.save();
  ctx.fillStyle = look.body;
  ctx.beginPath();
  ctx.ellipse(e.x, e.y, e.r + (look.big ? 6 : 0), e.r, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = look.core || "#fff";
  ctx.beginPath();
  ctx.arc(e.x, e.y, Math.max(3, e.r * 0.28), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  return true;
};

SF.drawWorldProp = function (ctx, prop) {
  var k = prop.kind;
  if (k === "hut") {
    var sc = prop.s || 1;
    ctx.save();
    ctx.scale(sc, sc);
    ctx.fillStyle = "#8a5a3c";
    ctx.fillRect(-16, 2, 32, 14);
    ctx.fillStyle = "#c46a55";
    ctx.beginPath();
    ctx.moveTo(-20, 4);
    ctx.lineTo(0, -16);
    ctx.lineTo(20, 4);
    ctx.fill();
    ctx.fillStyle = "#6b3a32";
    ctx.fillRect(-4, 6, 8, 10);
    ctx.restore();
    return true;
  }
  if (k === "stilt") {
    ctx.strokeStyle = "#6b4030";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-8, 16);
    ctx.lineTo(-8, -4);
    ctx.moveTo(8, 18);
    ctx.lineTo(8, -2);
    ctx.moveTo(-12, -2);
    ctx.lineTo(12, -2);
    ctx.stroke();
    return true;
  }
  if (k === "stall") {
    ctx.fillStyle = "#c4a070";
    ctx.fillRect(-16, 2, 32, 8);
    ctx.fillStyle = "#e7d2b4";
    ctx.beginPath();
    ctx.moveTo(-18, 2);
    ctx.lineTo(0, -12);
    ctx.lineTo(18, 2);
    ctx.fill();
    return true;
  }
  if (k === "wreckhull") {
    ctx.fillStyle = "#4a4038";
    ctx.beginPath();
    ctx.ellipse(0, 6, 28, 12, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#8a5a3c";
    ctx.fillRect(-4, -16, 4, 18);
    ctx.strokeStyle = "#d9cfc4";
    ctx.beginPath();
    ctx.moveTo(-16, 4);
    ctx.lineTo(8, -2);
    ctx.stroke();
    return true;
  }
  if (k === "gatearch") {
    ctx.fillStyle = "#d9cfc4";
    ctx.fillRect(-22, -6, 8, 24);
    ctx.fillRect(14, -6, 8, 24);
    ctx.fillRect(-22, -14, 44, 8);
    ctx.fillStyle = "#6b3a32";
    ctx.fillRect(-8, -4, 16, 18);
    return true;
  }
  if (k === "raft") {
    ctx.fillStyle = "#8a5a3c";
    ctx.fillRect(-40, 4, 80, 10);
    ctx.fillStyle = "#6b3e2c";
    ctx.fillRect(-40, 8, 80, 3);
    return true;
  }
  if (k === "signpost") {
    ctx.fillStyle = "#6b4030";
    ctx.fillRect(-2, -2, 4, 16);
    ctx.fillStyle = "#e7d2b4";
    ctx.fillRect(-10, -14, 20, 12);
    return true;
  }
  return false;
};

SF.drawChestFallback = function (ctx, extra, u) {
  ctx.save();
  ctx.fillStyle = "#6b3e2c";
  ctx.fillRect(extra.x - 10, extra.y - 6, 20, 12);
  ctx.fillStyle = "#c4552a";
  ctx.fillRect(extra.x - 10, extra.y - 6, 20, 4);
  if (u > 0) {
    ctx.fillStyle = "#ffd37a";
    ctx.globalAlpha = Math.min(1, u);
    ctx.fillRect(extra.x - 5, extra.y - 4, 10, 4);
  }
  var lift = (u || 0) * 7;
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#e7b56a";
  ctx.fillRect(extra.x - 10, extra.y - 10 - lift, 20, 4);
  ctx.restore();
};

SF.drawChest = function (ctx, extra) {
  var u = SF.chestOpenT(extra.id);
  if (u <= 0) {
    if (!SF.tryArtSprite(ctx, "chest", extra.x, extra.y, { scale: 1 })) SF.drawChestFallback(ctx, extra, 0);
    return;
  }
  if (u >= 1) {
    if (!SF.tryArtSprite(ctx, "chest_open", extra.x, extra.y, { scale: 1 })) SF.drawChestFallback(ctx, extra, 1);
    return;
  }
  var closed = window.Art && Art.frameOf ? Art.frameOf("chest", "walk", "down", 0) : null;
  if (!closed || !closed.width) {
    SF.drawChestFallback(ctx, extra, u);
    return;
  }
  var scale = 1;
  var ax = closed._ax != null ? closed._ax : 8;
  var ay = closed._ay != null ? closed._ay : 12;
  var dx = extra.x - ax * scale;
  var dy = extra.y - ay * scale;
  var lidH = 7;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    closed,
    0, lidH, closed.width, Math.max(1, closed.height - lidH),
    dx, dy + lidH * scale, closed.width * scale, Math.max(1, closed.height - lidH) * scale
  );
  var hingeX = dx + closed.width * scale * 0.5;
  var hingeY = dy + lidH * scale;
  var lift = u * 6 * scale;
  var sy = Math.max(0.22, 1 - u * 0.72);
  ctx.translate(hingeX, hingeY - lift);
  ctx.scale(1, sy);
  ctx.drawImage(
    closed,
    0, 0, closed.width, lidH,
    -closed.width * scale * 0.5, -lidH * scale, closed.width * scale, lidH * scale
  );
  ctx.restore();
  if (u > 0.2) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, (u - 0.2) * 1.6);
    ctx.fillStyle = "#ffd37a";
    ctx.fillRect(extra.x - 4, extra.y - 7, 3, 2);
    ctx.fillStyle = "#fff6d0";
    ctx.fillRect(extra.x + 1, extra.y - 7, 2, 2);
    ctx.restore();
  }
};

SF.drawExtra = function (ctx, extra) {
  if (extra.kind === "chest") {
    SF.drawChest(ctx, extra);
    return true;
  }
  if (extra.kind === "shop") {
    if (!SF.tryArtSprite(ctx, "sign", extra.x, extra.y - 10, { scale: 1 })) {
      ctx.save();
      ctx.translate(extra.x, extra.y);
      SF.drawWorldProp(ctx, { kind: "stall" });
      ctx.restore();
    }
    return true;
  }
  if (extra.kind === "inn") {
    if (!SF.tryArtSprite(ctx, "inn", extra.x, extra.y, { scale: 1 })) {
      ctx.save();
      ctx.fillStyle = "#ffd37a";
      ctx.beginPath();
      ctx.arc(extra.x, extra.y - 16, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#6b4030";
      ctx.fillRect(extra.x - 2, extra.y - 12, 4, 16);
      ctx.restore();
    }
    return true;
  }
  if (extra.kind === "skiff") {
    if (!SF.tryArtSprite(ctx, "skiff", extra.x, extra.y, { scale: 1 })) return false;
    return true;
  }
  if (extra.kind === "gate") {
    if (!SF.tryArtSprite(ctx, "sign", extra.x, extra.y, { scale: 1 })) {
      ctx.save();
      ctx.translate(extra.x, extra.y);
      SF.drawWorldProp(ctx, { kind: "signpost" });
      ctx.restore();
    }
    return true;
  }
  if (extra.kind === "sign") {
    if (!SF.tryArtSprite(ctx, "signpost", extra.x, extra.y, { scale: 1 })) {
      ctx.save();
      ctx.translate(extra.x, extra.y);
      SF.drawWorldProp(ctx, { kind: "signpost" });
      ctx.restore();
    }
    return true;
  }
  return false;
};

SF.solidList = function () {
  var out = [];
  (SF.NPCS || []).forEach(function (n) {
    if (SF.npcHidden && SF.npcHidden(n)) return;
    var x = n.x;
    var y = n.y;
    if (n.id === "cantor" && SF.cantorWorldPos) {
      var spot = SF.cantorWorldPos();
      if (spot) {
        x = spot.x;
        y = spot.y;
      }
    }
    out.push({ x: x, y: y, r: 22, kind: "npc" });
  });
  if (SF.LAMP) out.push({ x: SF.LAMP.x, y: SF.LAMP.y, r: 18, kind: "lamp" });
  (SF.HOOKS || []).forEach(function (hook) {
    if (SF.hookLive && !SF.hookLive(hook)) return;
    out.push({ x: hook.x, y: hook.y, r: 14, kind: "post" });
  });
  (SF.EXTRAS || []).forEach(function (extra) {
    if (extra.kind === "checkpoint") out.push({ x: extra.x, y: extra.y, r: 16, kind: "post" });
  });
  return out;
};

SF._hitsSolid = function (x, y, ox, oy) {
  var list = SF.solidList();
  var i, solid, dx, dy, odx, ody, r;
  for (i = 0; i < list.length; i++) {
    solid = list[i];
    r = solid.r;
    dx = x - solid.x;
    dy = y - solid.y;
    if (dx * dx + dy * dy >= r * r) continue;
    if (ox != null && oy != null) {
      odx = ox - solid.x;
      ody = oy - solid.y;
      if (odx * odx + ody * ody < r * r) continue;
    }
    return true;
  }
  return false;
};

SF.occupied = function (x, y, ox, oy) {
  return SF._hitsSolid(x, y, ox, oy);
};

SF.blocksFoot = function (x, y) {
  return SF._hitsSolid(x, y, null, null);
};

SF.footFree = function (x, y, ox, oy) {
  if (!SF.walkable(x, y)) return false;
  if (SF.occupied(x, y, ox, oy)) return false;
  return true;
};

SF.standClear = function (x, y) {
  var dirs = [[0, 0], [0, 26], [0, -26], [26, 0], [-26, 0], [18, 18], [-18, 18], [18, -18], [-18, -18]];
  var i, nx, ny;
  for (i = 0; i < dirs.length; i++) {
    nx = x + dirs[i][0];
    ny = y + dirs[i][1];
    if (SF.walkable(nx, ny) && !SF.blocksFoot(nx, ny)) return { x: nx, y: ny };
  }
  return { x: x, y: y };
};

SF.rememberCheckpoint = function (x, y, opts) {
  var s = SF.state;
  if (!s || x == null || y == null) return;
  opts = opts || {};
  var island = opts.island || SF.islandId || s.island || "emberhold";
  var spot = opts.raw ? { x: x, y: y } : SF.standClear(x, y);
  var rec = { x: spot.x, y: spot.y, island: island, kind: opts.kind || "post" };
  if (!s.checkpoints) s.checkpoints = {};
  s.checkpoints[island] = rec;
  if (island === SF.islandId) s.checkpoint = rec;
  if (!opts.quiet) {
    SF.pushToast("Checkpoint. The vault stone has you.", 2.2);
    if (SF.saveGame) SF.saveGame({ silent: true });
  }
};

SF.checkpointHere = function () {
  var s = SF.state;
  var island = SF.islandId || (s && s.island) || "emberhold";
  var rec = s && s.checkpoints && s.checkpoints[island];
  if (rec && rec.x != null && rec.island === island) {
    var clear = SF.standClear(rec.x, rec.y);
    if (clear.x !== rec.x || clear.y !== rec.y) {
      rec = { x: clear.x, y: clear.y, island: island, kind: rec.kind || "post" };
      s.checkpoints[island] = rec;
      if (s.checkpoint && s.checkpoint.island === island) s.checkpoint = rec;
    }
    return rec;
  }
  if (s && s.checkpoint && s.checkpoint.island === island && s.checkpoint.x != null) {
    var stood = SF.standClear(s.checkpoint.x, s.checkpoint.y);
    return { x: stood.x, y: stood.y, island: island, kind: s.checkpoint.kind || "post" };
  }
  if (island === "emberhold" && SF.WAKE) return { x: SF.WAKE.x, y: SF.WAKE.y, island: island, kind: "wake" };
  if (SF.LAMP) {
    var lamp = SF.standClear(SF.LAMP.x, SF.LAMP.y);
    return { x: lamp.x, y: lamp.y, island: island, kind: "lamp" };
  }
  var dock = SF.DOCKS && SF.DOCKS[island];
  if (dock) return { x: dock.x, y: dock.y, island: island, kind: "dock" };
  return { x: s.player.x, y: s.player.y, island: island, kind: "wake" };
};

SF.placeAtCheckpoint = function (s) {
  if (!s) return;
  var spot = SF.checkpointHere();
  if (!s.checkpoints) s.checkpoints = {};
  if (s.checkpoint && s.checkpoint.island && s.checkpoint.island !== (spot.island || SF.islandId) && !s.checkpoints[s.checkpoint.island]) {
    s.checkpoints[s.checkpoint.island] = s.checkpoint;
  }
  var p = s.player;
  p.x = spot.x;
  p.y = spot.y;
  p.safeX = spot.x;
  p.safeY = spot.y;
  p.px = spot.x;
  p.py = spot.y;
  p.fall = 0;
  p.dashT = 0;
  p.grappleT = 0;
  p.hx = 0;
  p.hy = 0;
  s.camX = spot.x;
  s.camY = spot.y;
  if (!s.checkpoints) s.checkpoints = {};
  s.checkpoints[spot.island || SF.islandId] = spot;
  s.checkpoint = spot;
};

SF.dropToast = function (s, text) {
  if (!s) return;
  if (s.toast && s.toast.text === text) s.toast = null;
  if (s.toasts) s.toasts = s.toasts.filter(function (row) { return row.text !== text; });
};

SF.worldNode = function (who) {
  var i;
  for (i = 0; i < (SF.NPCS || []).length; i++) {
    if (SF.NPCS[i].id === who && SF.NPCS[i].node) return SF.NPCS[i].node;
  }
  return "";
};

if (SF.dialogueRouters) SF.dialogueRouters.push(SF.worldNode);

(function wireWorld() {
  var baseAction = SF.actionFor;
  SF.actionFor = function (s, near) {
    if (near && near.kind === "lamp" && SF.islandId !== "emberhold" && SF.islandId !== "cinderveil") {
      return { label: "Inspect", name: "the lamp", prompt: "Inspect — the lamp" };
    }
    if (near && near.ref) {
      if (near.kind === "shop") return { label: "Shop", name: near.ref.name, prompt: "Shop — " + near.ref.name };
      if (near.kind === "inn") return { label: "Rest", name: near.ref.name, prompt: "Rest — " + near.ref.name };
      if (near.kind === "chest") {
        var opened = s && s.picked && s.picked[near.ref.id];
        return { label: opened ? "Empty" : "Open", name: "chest", prompt: (opened ? "Empty" : "Open") + " — chest" };
      }
      if (near.kind === "skiff") return { label: "Sail", name: near.ref.name, prompt: "Sail — " + near.ref.name };
      if (near.kind === "gate" || near.kind === "sign") {
        return { label: "Read", name: near.ref.name, prompt: "Read — " + near.ref.name };
      }
    }
    return baseAction(s, near);
  };

  var baseInteract = SF.tryInteract;
  SF.tryInteract = function () {
    var s = SF.state;
    if (!s || s.mode !== "play") return baseInteract();
    var near = SF.nearestInteract();
    if (near && near.kind === "lamp" && SF.islandId === "saltmere") {
      if (s.flags && s.flags.saltmere_lamp === "lit") {
        SF.showNotice("Lamp", "The lamp holds.");
      } else if (s.flags && (s.flags.tidewyrm_dead || s.flags.tidewyrmDead)) {
        SF.lightSaltmereLamp();
      } else {
        SF.showNotice("Lamp", "The lamp is dim.");
      }
      return;
    }
    if (near && near.kind === "lamp" && SF.islandId !== "emberhold" && SF.islandId !== "cinderveil") {
      var pack = SF.ISLANDS[SF.islandId];
      SF.showNotice("Lamp", (pack && pack.lampNote) || "The lamp is dim.");
      return;
    }
    if (!near || !near.ref) return baseInteract();
    if (near.kind === "shop") return SF.openShop(near.ref);
    if (near.kind === "inn") return SF.openInn(near.ref);
    if (near.kind === "chest") return SF.openChest(near.ref);
    if (near.kind === "skiff") {
      if (SF.openSailMenu) SF.openSailMenu();
      return;
    }
    if (near.kind === "gate") {
      var openGate = s.flags && s.flags.saltmere_lamp === "lit";
      var gateText = openGate ? (near.ref.text || "") : (near.ref.lockedText || "The gate is shut.");
      SF.showNotice(near.ref.title || near.ref.name, gateText);
      return;
    }
    if (near.kind === "sign") {
      SF.showNotice(near.ref.title || near.ref.name, near.ref.text || "");
      return;
    }
    return baseInteract();
  };

  var baseLampLit = SF.lampIsLit;
  SF.lampIsLit = function (s) {
    if (SF.islandId === "emberhold") return !!(s && s.flags && s.flags.lampLit);
    if (SF.islandId === "cinderveil") return !!(s && s.flags && s.flags.cinderLit);
    if (SF.islandId === "saltmere") {
      if (s && s.flags && s.flags.saltmere_lamp === "lit") return true;
      if (s && s !== SF.state && s.flags && s.flags.lampLit) return true;
      return false;
    }
    return false;
  };
  SF._lampIsLitBase = baseLampLit;

  var baseLoad = SF.loadEnemies;
  SF.loadEnemies = function () {
    if (baseLoad) baseLoad();
    var s = SF.state;
    if (!s || !s.enemies) return;
    if (s.flags.tidewyrmDead || s.flags.tidewyrm_dead) {
      s.flags.tidewyrmDead = true;
      s.flags.tidewyrm_dead = true;
      s.enemies.forEach(function (e) {
        if (e.kind === "tidewyrm") {
          e.alive = false;
          e.hp = 0;
        }
      });
    }
  };

  var baseSnap = SF.snapshotEnemies;
  SF.snapshotEnemies = function () {
    if (baseSnap) baseSnap();
    var s = SF.state;
    if (!s || !s.enemySave || !s.enemies) return;
    var rows = s.enemySave[SF.islandId] || [];
    var byId = {};
    s.enemies.forEach(function (e) {
      var kind = SF.KINDS[e.kind];
      byId[e.id] = !!(e.boss || (kind && kind.boss));
    });
    rows.forEach(function (row) {
      if (byId[row.id]) row.boss = true;
    });
  };

  var baseVoyage = SF.startVoyage;
  SF.startVoyage = function (island) {
    var s = SF.state;
    if (s && SF.destinationOpen && SF.ISLANDS[island] && !SF.destinationOpen(island)) {
      SF.pushToast(SF.destinationLockText(island), 1.8);
      return;
    }
    if (baseVoyage) baseVoyage(island);
    s = SF.state;
    if (!s || (!s.voyage && !s.voyageTalk)) return;
    s.voyageCount = (s.voyageCount || 0) + 1;
    if (s.voyage) s.voyage.count = s.voyageCount;
  };

  var baseUpdate = SF.update;
  SF.update = function (dt) {
    var s = SF.state;
    if (s && s.voyage && s.voyage.paused && s.mode === "play" && !s.battle) {
      s.voyage.paused = false;
      s.mode = "voyage";
      if (window.Music) Music.play("sail");
    }
    if (baseUpdate) baseUpdate(dt);
  };

  if (SF.touchFoe) {
    var baseTouch = SF.touchFoe;
    SF.touchFoe = function (e) {
      var s = SF.state;
      if (!s || s.mode !== "play" || !e || !e.alive || e.dying > 0 || e.dormant) return false;
      if (s.touchCd > 0) return false;
      if (e.kind === "maw" && !s.flags.mawFight) return false;
      var id = e.encounter || (SF.encounterForSpawn && SF.encounterForSpawn(e));
      if (!id || !SF.ENCOUNTERS || !SF.ENCOUNTERS[id] || !SF.Battle || !SF.Battle.start) {
        return baseTouch(e);
      }
      var enc = SF.ENCOUNTERS[id];
      var boss = !!(enc.boss || e.boss || e.kind === "maw" || e.kind === "tidewyrm");
      return SF.Battle.start(id, {
        fieldId: e.id,
        boss: boss,
        canFlee: !boss && enc.canFlee !== false,
        bg: e.bg || enc.bg,
        onWin: function () {
          if (id !== "boss_tidewyrm") return;
          s.flags.tidewyrmDead = true;
          s.flags.tidewyrm_dead = true;
          SF.pushBanner("The Tidewyrm is defeated.", "");
        }
      });
    };
  }

  SF.updateVoyage = function (dt) {
    var s = SF.state;
    if (!s || !s.voyage || s.voyage.paused || s.mode === "battle") return;
    s.voyage.t += dt;
    if (!s.voyage.talk && !s.voyage.seaChecked && s.voyage.t > 1.1) {
      s.voyage.seaChecked = true;
      if (SF.maybeSeaFight(s)) return;
    }
    if (s.voyage && !s.voyage.talk && s.voyage.t > 3.2 && SF.finishVoyage) SF.finishVoyage();
  };

  if (SF.Battle && SF.Battle.applyLoss && !SF.Battle._lossWrapped) {
    var baseLoss = SF.Battle.applyLoss;
    SF.Battle._lossWrapped = true;
    SF.Battle.applyLoss = function (s) {
      if (!s) return;
      var island = SF.islandId;
      var spot = SF.checkpointHere();
      s.checkpoint = { x: spot.x, y: spot.y, island: island, kind: spot.kind || "lamp" };
      var bannerCount = s.banners ? s.banners.length : 0;
      var priorBanner = s.banner;
      baseLoss(s);
      SF.dropToast(s, "Back to the waking stones. The party is at half HP.");
      SF.dropToast(s, "Back to the last lamp. The party is at half HP.");
      var p = s.player;
      p.x = spot.x;
      p.y = spot.y;
      p.safeX = spot.x;
      p.safeY = spot.y;
      p.px = spot.x;
      p.py = spot.y;
      p.fall = 0;
      s.camX = spot.x;
      s.camY = spot.y;
      if (!s.checkpoints) s.checkpoints = {};
      s.checkpoints[island] = spot;
      s.checkpoint = spot;
      if (s.banners && s.banners.length > bannerCount) s.banners.length = bannerCount;
      if (s.banner !== priorBanner) s.banner = priorBanner;
      var nearWake = island === "emberhold" && SF.WAKE && SF.dist(spot.x, spot.y, SF.WAKE.x, SF.WAKE.y) < 72;
      SF.pushToast(nearWake ? "Back to the waking stones. The party is at half HP." : "Back to the last lamp. The party is at half HP.");
    };
  }

  var baseCoach = SF.coachLine;
  SF.coachLine = function (s) {
    var line = baseCoach ? baseCoach(s) : "";
    if (SF.islandId !== "emberhold" && line && (line.indexOf("span") !== -1 || line.indexOf("Dash from the lip") !== -1)) return "";
    if (line && SF.touchPrimary && SF.touchPrimary() && SF.presentCoach) line = SF.presentCoach(line);
    return line;
  };

})();

SF.auditWorld = function () {
  var issues = [];
  var prev = SF.islandId;
  var dash = SF.DASH_SPEED * SF.DASH_TIME;
  function checkPack(id) {
    SF.mountIsland(id);
    var pack = SF.ISLANDS[id];
    function check(label, x, y) {
      if (!SF.walkable(x, y)) issues.push(id + " " + label + " not walkable (" + x + "," + y + ")");
    }
    check("dock", SF.DOCKS[id].x, SF.DOCKS[id].y);
    check("lamp", SF.LAMP.x, SF.LAMP.y);
    SF.NPCS.forEach(function (n) { check(n.id, n.x, n.y); });
    SF.SPAWNS.forEach(function (sp) { check(sp.id, sp.x, sp.y); });
    (SF.EXTRAS || []).forEach(function (ex) { check(ex.id, ex.x, ex.y); });
    (SF.HOOKS || []).forEach(function (h) { check(h.id, h.x, h.y); });
    if (pack && pack.lampNote == null && id !== "emberhold" && id !== "cinderveil") {
      issues.push(id + " missing lampNote");
    }
  }
  ["saltmere", "highspire", "gullrock", "drift"].forEach(checkPack);
  SF.mountIsland("saltmere");
  SF.samplePath("saltmere town", [
    SF.DOCKS.saltmere,
    { x: 0, y: 40 },
    { x: -200, y: 30 }
  ], issues);
  SF.samplePath("saltmere shore", [
    { x: 0, y: 40 },
    { x: 200, y: 70 },
    { x: 340, y: 90 }
  ], issues);
  if (SF.walkable(-325, 30)) issues.push("saltmere wreck gap can be walked");
  if (SF.walkable(-590, 100)) issues.push("saltmere islet gap can be walked");
  if (SF.walkable(-630, 30)) issues.push("saltmere arena gap can be walked");
  var lip = { x: -242, y: 30 };
  var deck = { x: -412, y: 30 };
  if (SF.dist(lip.x, lip.y, deck.x, deck.y) <= dash) issues.push("saltmere wreck gap is short enough to dash");
  if (SF.dist(lip.x, lip.y, deck.x, deck.y) > SF.GRAPPLE_RANGE) issues.push("saltmere wreck hook is out of range");
  if (SF.dist(-537, 67, -670, 151) <= dash) issues.push("saltmere islet gap is short enough to dash");
  if (SF.dist(-537, 67, -670, 151) > SF.GRAPPLE_RANGE) issues.push("saltmere islet hook is out of range");
  if (SF.dist(-548, 30, -712, 30) <= dash) issues.push("saltmere arena gap is short enough to dash");
  if (SF.dist(-548, 30, -712, 30) > SF.GRAPPLE_RANGE) issues.push("saltmere arena hook is out of range");
  SF.mountIsland("highspire");
  SF.samplePath("highspire road", [
    SF.DOCKS.highspire,
    { x: 0, y: 240 },
    { x: 0, y: 70 },
    { x: 100, y: -10 },
    { x: 40, y: -90 },
    { x: 110, y: -180 },
    { x: 40, y: -310 },
    { x: 40, y: -390 }
  ], issues);
  var gate = null;
  (SF.EXTRAS || []).forEach(function (ex) { if (ex.id === "hs-gate-sign") gate = ex; });
  if (!gate || gate.text !== "Story continues in Act 2") issues.push("highspire gate text missing");
  if (!gate || gate.lockedText !== "The gate is shut.") issues.push("highspire gate locked text missing");
  ["saltmere", "gullrock", "drift", "highspire"].forEach(function (id) {
    var dest = SF.destinationById(id);
    if (!dest || dest.unlock !== "soon") issues.push(id + " is not marked coming soon");
  });
  if (SF.state) {
    var heldFlags = SF.state.flags;
    SF.state.flags = Object.assign({}, heldFlags, { sailUnlocked: true, act1: true });
    ["saltmere", "gullrock", "drift", "highspire"].forEach(function (id) {
      if (SF.destinationOpen(id)) issues.push(id + " is sailable during the hold");
      if (SF.destinationLockText(id) !== "Coming soon") issues.push(id + " lock text is not Coming soon");
    });
    SF.state.flags = heldFlags;
  }
  if (SF.walkable(40, -460)) issues.push("past the highspire gate is walkable");
  ["emberhold", "cinderveil"].forEach(function (id) {
    SF.mountIsland(id);
    (SF.EXTRAS || []).forEach(function (ex) {
      if (!SF.walkable(ex.x, ex.y)) issues.push(id + " " + ex.id + " not walkable");
    });
  });
  var seen = {};
  function noteItems(list) {
    (list || []).forEach(function (it) { seen[it.id] = true; });
  }
  Object.keys(SF.ISLANDS).forEach(function (id) {
    var extras = SF.ISLANDS[id].extras || [];
    extras.forEach(function (ex) {
      if (ex.stock) noteItems(ex.stock);
      if (ex.items) noteItems(ex.items);
    });
  });
  [
    "tonic", "hi_tonic", "ether", "phoenix_shard", "smoke_bomb", "ember_salt", "tide_vial", "gale_powder", "shard_dust",
    "shard_focus", "knife", "coil_tool", "ember_knife", "tide_edge", "gale_pistol", "shard_rod", "spark_wrench", "choir_blade",
    "cloth_wrap", "ash_coat", "quay_coat", "vault_plate", "salt_cloak",
    "speed_charm", "heart_charm", "mage_charm", "thief_charm"
  ].forEach(function (id) {
    if (!seen[id]) issues.push("item id missing from map data: " + id);
    if (SF.ITEMS && !SF.ITEMS[id]) issues.push("item id missing from the catalog: " + id);
  });
  SF.mountIsland(prev || "emberhold");
  return issues;
};

SF.CHART_BIOME = {
  emberhold: "grass",
  cinderveil: "ash",
  gullrock: "stone",
  drift: "drift",
  saltmere: "salt",
  highspire: "hs"
};

SF.keeperPortrait = function (name) {
  var n = String(name || "").toLowerCase();
  if (n.indexOf("quinn") !== -1) return "nessa";
  if (n.indexOf("stilt") !== -1) return "osric";
  if (n.indexOf("lowgate") !== -1) return "dorrie";
  if (n.indexOf("switchback") !== -1) return "maud";
  if (n.indexOf("drift") !== -1) return "sile";
  if (n.indexOf("maren") !== -1) return "maren";
  if (n.indexOf("lowmoor") !== -1) return "villager_b";
  if (n.indexOf("quay") !== -1) return "kestrel";
  return "villager_a";
};

SF.paintKeeper = function (canvas, id) {
  if (!canvas || !window.Art || !Art.portrait) return;
  if (canvas.width !== 64) {
    canvas.width = 64;
    canvas.height = 64;
  }
  var g = canvas.getContext("2d");
  if (!g) return;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, 64, 64);
  Art.portrait(g, id, 0, 0, 64);
};

SF.ensureKeeper = function (panel, id) {
  var slot = document.getElementById(id);
  if (slot) return slot;
  if (!panel) return null;
  var card = panel.querySelector(".card");
  if (!card) return null;
  var row = document.createElement("div");
  row.className = "keeper-row";
  slot = document.createElement("canvas");
  slot.id = id;
  slot.className = "keeper-face";
  slot.width = 64;
  slot.height = 64;
  row.appendChild(slot);
  var title = card.querySelector("h2");
  if (title) row.appendChild(title);
  card.insertBefore(row, card.firstChild);
  return slot;
};

SF.syncSailChart = function () {
  var root = document.getElementById("sail-chart");
  var list = document.getElementById("sail-list");
  var routes = document.getElementById("sail-routes");
  if (!root || !list || !SF.state) return;
  var sig = SF.islandId + ":" + (SF.state.flags.sailUnlocked ? 1 : 0) + ":" + (SF.state.flags.act1 ? 1 : 0);
  if (root.dataset.sig === sig) return;
  root.dataset.sig = sig;
  root.innerHTML = "";
  list.innerHTML = "";
  if (routes) {
    var svg = "";
    (SF.SAIL_ROUTES || []).forEach(function (pair) {
      var a = SF.destinationById(pair[0]);
      var b = SF.destinationById(pair[1]);
      if (!a || !b) return;
      svg += "<line x1=\"" + a.x + "\" y1=\"" + a.y + "\" x2=\"" + b.x + "\" y2=\"" + b.y + "\"></line>";
    });
    routes.innerHTML = svg;
  }
  (SF.DESTINATIONS || []).forEach(function (d) {
    var open = SF.destinationOpen(d.id);
    var here = SF.islandId === d.id;
    var pin = document.createElement("button");
    pin.type = "button";
    pin.className = "chart-isle" + (here ? " here" : "") + (open ? "" : " locked");
    pin.style.left = d.x + "%";
    pin.style.top = d.y + "%";
    if (window.Art && Art.islandCard) {
      var card = Art.islandCard(SF.CHART_BIOME[d.id] || "grass", 36);
      var cv = document.createElement("canvas");
      cv.className = "chart-card";
      cv.width = card.width;
      cv.height = card.height;
      cv.getContext("2d").drawImage(card, 0, 0);
      pin.appendChild(cv);
    }
    var lab = document.createElement("span");
    lab.textContent = d.short || d.name;
    pin.appendChild(lab);
    pin.disabled = !open || here;
    pin.dataset.sail = d.id;
    root.appendChild(pin);
    var row = document.createElement("button");
    row.type = "button";
    row.dataset.sail = d.id;
    row.disabled = !open || here;
    var note = here ? "Here" : (open ? "Sail" : ((d.unlock === "soon" || d.unlock === "hold") ? "Coming soon" : (d.unlock === "act1" ? "After Act 1" : "Locked")));
    row.textContent = d.name + " — " + note;
    list.appendChild(row);
  });
};

SF.syncShopUI = function () {
  var panel = document.getElementById("shop");
  if (!panel) return;
  var s = SF.state;
  panel.hidden = !s || s.mode !== "shop";
  if (!s || s.mode !== "shop" || !s.shop) return;
  var shop = s.shop;
  document.getElementById("shop-title").textContent = shop.title || shop.name || "Shop";
  SF.paintKeeper(SF.ensureKeeper(panel, "shop-face"), SF.keeperPortrait(shop.name || shop.title));
  document.getElementById("shop-gold").textContent = "Marks: " + (s.gold || 0);
  var list = document.getElementById("shop-list");
  var owned = [];
  if (s.inventory && !Array.isArray(s.inventory)) owned = Object.keys(s.inventory);
  else if (Array.isArray(s.inventory)) {
    s.inventory.forEach(function (it) {
      var key = it && it.id ? it.id : it;
      if (owned.indexOf(key) < 0) owned.push(key);
    });
  }
  var sig = (s.gold || 0) + "|" + (shop.stock || []).map(SF.shopStockId).join(",") + "|" + owned.join(",");
  if (list.dataset.sig === sig) return;
  list.dataset.sig = sig;
  list.innerHTML = "";
  (shop.stock || []).forEach(function (row) {
    var id = SF.shopStockId(row);
    var info = SF.itemInfo(id);
    var btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "Buy " + info.name + " — " + info.price + " marks";
    btn.disabled = (s.gold || 0) < info.price;
    btn.addEventListener("click", function () { SF.buyFromShop(id); SF.syncShopUI(); });
    list.appendChild(btn);
  });
  if (!owned.length) {
    var empty = document.createElement("p");
    empty.className = "fine";
    empty.textContent = "Nothing to sell.";
    list.appendChild(empty);
    return;
  }
  owned.forEach(function (id) {
    var info = SF.itemInfo(id);
    var btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "Sell " + info.name + " (" + SF.itemCount(id) + ") — " + (info.sell || 0) + " marks";
    btn.addEventListener("click", function () { SF.sellToShop(id); SF.syncShopUI(); });
    list.appendChild(btn);
  });
};

SF.syncInnUI = function () {
  var panel = document.getElementById("inn");
  if (!panel) return;
  var s = SF.state;
  panel.hidden = !s || s.mode !== "inn";
  if (!s || s.mode !== "inn" || !s.inn) return;
  document.getElementById("inn-title").textContent = s.inn.title || "Inn";
  SF.paintKeeper(SF.ensureKeeper(panel, "inn-face"), SF.keeperPortrait(s.inn.name || s.inn.title));
  document.getElementById("inn-copy").textContent = s.inn.blurb || "Rest here?";
};

SF.syncNoticeUI = function () {
  var panel = document.getElementById("notice");
  if (!panel) return;
  var s = SF.state;
  panel.hidden = !s || s.mode !== "notice";
  if (!s || s.mode !== "notice" || !s.notice) return;
  document.getElementById("notice-title").textContent = s.notice.title || "Notice";
  document.getElementById("notice-copy").textContent = s.notice.text || "";
};

SF.paintLootIcon = function (canvas, row) {
  if (!canvas || !canvas.getContext) return;
  var g = canvas.getContext("2d");
  var kind = "pouch";
  var info = row && row.kind !== "marks" ? SF.itemInfo(row.id) : null;
  if (row && row.kind === "marks") kind = "coin";
  else if (info && info.slot === "weapon") kind = "blade";
  else if (info && info.slot === "armor") kind = "armor";
  else if (info && info.slot === "charm") kind = "charm";
  else if (info && info.flee) kind = "bomb";
  else if (info && info.revive) kind = "gem";
  else if (info && info.sp && !info.hp) kind = "flask";
  else if (info && info.hp) kind = "bottle";
  else if (info && info.dmg) kind = "vial";
  g.clearRect(0, 0, canvas.width, canvas.height);
  g.imageSmoothingEnabled = false;
  g.save();
  g.scale(canvas.width / 16, canvas.height / 16);
  function px(x, y, w, h, color) {
    g.fillStyle = color;
    g.fillRect(x, y, w, h);
  }
  px(0, 0, 16, 16, "#10245c");
  if (kind === "bottle") {
    px(7, 2, 2, 3, "#d8c4a4");
    px(5, 5, 6, 8, "#c4552a");
    px(6, 6, 2, 5, "#ffb15a");
    px(5, 12, 6, 1, "#8a3030");
  } else if (kind === "flask") {
    px(7, 2, 2, 3, "#d8e8f0");
    px(5, 5, 6, 8, "#3aa0c8");
    px(6, 7, 4, 4, "#9ae6ff");
    px(5, 12, 6, 1, "#1a5870");
  } else if (kind === "vial") {
    px(7, 2, 2, 2, "#d8c4a4");
    px(5, 4, 6, 9, "#3c8a58");
    px(6, 6, 2, 5, "#b6f0c0");
  } else if (kind === "bomb") {
    px(8, 2, 2, 2, "#6b4030");
    px(9, 1, 2, 2, "#ffd37a");
    px(4, 5, 8, 8, "#2a2428");
    px(6, 7, 2, 2, "#8a9098");
  } else if (kind === "gem") {
    px(7, 2, 2, 2, "#fff6d0");
    px(5, 4, 6, 3, "#7ef0ff");
    px(4, 7, 8, 3, "#3ec8e0");
    px(6, 10, 4, 3, "#1a7890");
  } else if (kind === "blade") {
    px(4, 3, 2, 8, "#d8dde4");
    px(3, 2, 2, 2, "#f4f7fb");
    px(5, 11, 4, 2, "#8a5a3c");
    px(4, 13, 6, 1, "#c4552a");
  } else if (kind === "armor") {
    px(4, 3, 8, 3, "#8ec8f0");
    px(3, 6, 10, 6, "#2458a8");
    px(5, 7, 6, 3, "#8a6a48");
    px(4, 12, 3, 2, "#6b3e2c");
    px(9, 12, 3, 2, "#6b3e2c");
  } else if (kind === "charm") {
    px(5, 4, 6, 6, "#ffd37a");
    px(7, 6, 2, 2, "#10245c");
    px(7, 11, 2, 3, "#e7b56a");
  } else if (kind === "coin") {
    px(4, 3, 8, 10, "#e7b56a");
    px(6, 5, 4, 6, "#ffd37a");
    px(7, 6, 2, 4, "#8a5a20");
  } else {
    px(4, 5, 8, 7, "#8a5a3c");
    px(5, 3, 6, 3, "#c4844c");
    px(7, 8, 2, 2, "#ffd37a");
  }
  g.restore();
};

SF.syncChestUI = function () {
  var panel = document.getElementById("chest");
  if (!panel) return;
  var s = SF.state;
  var open = !!(s && s.mode === "chest" && s.chestLoot);
  panel.hidden = !open;
  if (!open) return;
  var list = document.getElementById("chest-list");
  if (!list) return;
  var rows = s.chestLoot.rows || [];
  var sig = rows.map(function (row) { return row.line; }).join("\n");
  if (list.dataset.sig === sig) return;
  list.dataset.sig = sig;
  list.innerHTML = "";
  rows.forEach(function (row) {
    var item = document.createElement("div");
    item.className = "loot-row";
    var icon = document.createElement("canvas");
    icon.className = "loot-icon";
    icon.width = 32;
    icon.height = 32;
    icon.setAttribute("aria-hidden", "true");
    SF.paintLootIcon(icon, row);
    var text = document.createElement("p");
    text.className = "loot-line";
    text.textContent = row.line;
    item.appendChild(icon);
    item.appendChild(text);
    list.appendChild(item);
  });
};

SF.bindWorldUI = function () {
  var sail = document.getElementById("sail");
  if (sail) {
    sail.addEventListener("click", function (e) {
      var btn = e.target.closest ? e.target.closest("[data-sail]") : null;
      if (!btn || !SF.state) return;
      if (btn.dataset.sail === "close") {
        SF.closeWorldPanel();
        if (SF.syncUI) SF.syncUI();
        return;
      }
      if (btn.disabled) return;
      if (SF.emit) SF.emit("ui");
      SF.startVoyage(btn.dataset.sail);
      if (SF.syncUI) SF.syncUI();
    });
  }
  var shopClose = document.getElementById("shop-close");
  if (shopClose) shopClose.addEventListener("click", function () { SF.closeWorldPanel(); if (SF.syncUI) SF.syncUI(); });
  var innYes = document.getElementById("inn-yes");
  if (innYes) innYes.addEventListener("click", function () {
    var inn = SF.state && SF.state.inn;
    SF.restAtInn(inn);
    if (SF.syncUI) SF.syncUI();
  });
  var innNo = document.getElementById("inn-no");
  if (innNo) innNo.addEventListener("click", function () { SF.closeWorldPanel(); if (SF.syncUI) SF.syncUI(); });
  var noticeClose = document.getElementById("notice-close");
  if (noticeClose) noticeClose.addEventListener("click", function () { SF.closeWorldPanel(); if (SF.syncUI) SF.syncUI(); });
  var chest = document.getElementById("chest");
  if (chest) {
    // Only a press that starts on the popup after the lockout can close it.
    chest.addEventListener("pointerdown", function () {
      if (!SF.state || SF.state.mode !== "chest") return;
      SF.state.chestArmed = !SF.chestLocked();
    });
    chest.addEventListener("click", function () {
      if (!SF.state || SF.state.mode !== "chest") return;
      if (!SF.state.chestArmed || SF.chestLocked()) return;
      SF.closeChest();
      if (SF.syncUI) SF.syncUI();
    });
  }
};

if (SF.bindUI) {
  SF._worldBind = SF.bindUI;
  SF.bindUI = function () {
    SF._worldBind();
    SF.bindWorldUI();
  };
}

if (SF.syncUI) {
  SF._worldSync = SF.syncUI;
  SF.syncUI = function () {
    SF._worldSync();
    if (typeof document === "undefined") return;
    if (SF.state && SF.state.mode === "sailmenu") SF.syncSailChart();
    SF.syncShopUI();
    SF.syncInnUI();
    SF.syncNoticeUI();
    SF.syncChestUI();
  };
}

