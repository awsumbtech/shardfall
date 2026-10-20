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
  if (d.unlock === "act1") return !!flags.act1;
  return true;
};

SF.destinationLockText = function (id) {
  var d = SF.destinationById(id);
  var flags = (SF.state && SF.state.flags) || {};
  if (!flags.sailUnlocked) return "The skiff is not ready.";
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

SF.respawnFieldEnemies = function () {
  var s = SF.state;
  if (!s) return;
  if (SF.snapshotEnemies) SF.snapshotEnemies();
  var save = s.enemySave || {};
  Object.keys(save).forEach(function (isle) {
    save[isle] = (save[isle] || []).filter(function (row) {
      return row.boss && row.alive === false;
    });
  });
  if (SF.loadEnemies) SF.loadEnemies();
};

SF.restAtInn = function (spot) {
  var s = SF.state;
  if (!s) return;
  SF.healParty(1);
  SF.respawnFieldEnemies();
  var x = spot && spot.x != null ? spot.x : s.player.x;
  var y = spot && spot.y != null ? spot.y : s.player.y;
  s.lastRest = { island: SF.islandId, x: x, y: y };
  s.checkpoint = { x: x, y: y, island: SF.islandId };
  s.mode = "play";
  SF.pushToast("Rested. Field enemies are back on the roads.", 2.2);
  if (SF.saveGame) SF.saveGame();
};

SF.chestSummary = function (chest) {
  var parts = [];
  (chest.items || []).forEach(function (it) {
    var info = SF.itemInfo(it.id);
    parts.push((it.n && it.n > 1 ? it.n + " " : "") + info.name);
  });
  if (chest.marks) parts.push(chest.marks + " marks");
  return parts.length ? parts.join(", ") : "Empty.";
};

SF.openChest = function (chest) {
  var s = SF.state;
  if (!s || !chest) return;
  if (s.picked[chest.id]) {
    SF.pushToast("Empty.", 1.2);
    return;
  }
  s.picked[chest.id] = true;
  (chest.items || []).forEach(function (it) { SF.giveItem(it.id, it.n || 1); });
  if (chest.marks) s.gold = (s.gold || 0) + chest.marks;
  SF.pushBanner("Chest", SF.chestSummary(chest), 2.4);
  if (window.Sfx) Sfx.play("pickup");
  if (SF.saveGame) SF.saveGame({ silent: true });
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
    scale: opts && opts.scale != null ? opts.scale : 2,
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
    var frame = (SF.calm && SF.calm()) ? 0 : Math.floor((SF.anim || 0) * 4) % 4;
    var facing = "down";
    var p = SF.state && SF.state.player;
    if (p && x != null && y != null) {
      var dx = p.x - x;
      var dy = p.y - y;
      if (Math.abs(dx) > 18 || Math.abs(dy) > 18) {
        facing = Math.abs(dx) >= Math.abs(dy) ? (dx < 0 ? "left" : "right") : (dy < 0 ? "up" : "down");
      }
    }
    if (SF.tryArtSprite(ctx, sprite, x, y, { frame: frame, facing: facing, scale: 2, pose: "walk" })) return true;
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

SF.drawExtra = function (ctx, extra) {
  var s = SF.state;
  if (extra.kind === "chest") {
    var open = s && s.picked && s.picked[extra.id];
    var sprite = open ? "chest_open" : "chest";
    if (!SF.tryArtSprite(ctx, sprite, extra.x, extra.y, { scale: 2 })) {
      ctx.save();
      ctx.fillStyle = open ? "#8a6a48" : "#c4552a";
      ctx.fillRect(extra.x - 10, extra.y - 8, 20, 14);
      ctx.fillStyle = "#ffd37a";
      ctx.fillRect(extra.x - 10, extra.y - 8, 20, 4);
      ctx.restore();
    }
    return true;
  }
  if (extra.kind === "shop") {
    if (!SF.tryArtSprite(ctx, "sign", extra.x, extra.y - 10, { scale: 2 })) {
      ctx.save();
      ctx.translate(extra.x, extra.y);
      SF.drawWorldProp(ctx, { kind: "stall" });
      ctx.restore();
    }
    return true;
  }
  if (extra.kind === "inn") {
    if (!SF.tryArtSprite(ctx, "inn", extra.x, extra.y, { scale: 2 })) {
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
    if (!SF.tryArtSprite(ctx, "skiff", extra.x, extra.y, { scale: 2 })) return false;
    return true;
  }
  if (extra.kind === "gate") {
    if (!SF.tryArtSprite(ctx, "sign", extra.x, extra.y, { scale: 2 })) {
      ctx.save();
      ctx.translate(extra.x, extra.y);
      SF.drawWorldProp(ctx, { kind: "signpost" });
      ctx.restore();
    }
    return true;
  }
  if (extra.kind === "sign") {
    if (!SF.tryArtSprite(ctx, "signpost", extra.x, extra.y, { scale: 2 })) {
      ctx.save();
      ctx.translate(extra.x, extra.y);
      SF.drawWorldProp(ctx, { kind: "signpost" });
      ctx.restore();
    }
    return true;
  }
  return false;
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
    if (!dest || dest.unlock !== "act1") issues.push(id + " does not wait for Act 1");
  });
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
    var note = here ? "Here" : (open ? "Sail" : (d.unlock === "act1" ? "After Act 1" : "Locked"));
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
  };
}

