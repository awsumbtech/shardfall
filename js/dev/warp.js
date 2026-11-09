"use strict";

// DevWarp jumps to a place or starts a fight from the content already loaded.
// The lists are built from SF.ISLANDS, SF.ENCOUNTERS, and their spawns.
// It adds no controls unless the address has ?dev=1.
var SF = window.SF || {};
window.SF = SF;

SF.DevWarp = {
  owner: "DevWarp",
  _attached: false,
  _dev: false,

  attach: function () {
    if (SF.DevWarp._attached) return;
    SF.DevWarp._attached = true;
    if (!SF.TuningConfig || !SF.TuningConfig.devOn || !SF.TuningConfig.devOn()) return;
    SF.DevWarp._dev = true;
    if (!SF.TuningDrawer || !SF.TuningDrawer.addTab) return;
    SF.TuningDrawer.addTab("warp", "Warp", function (host) {
      SF.DevWarp.fill(host);
    });
  },

  places: function () {
    var islands = [];
    var towns = [];
    var bosses = [];
    var fights = [];
    var seenTown = {};
    var packs = SF.ISLANDS || {};
    var id, pack, walk, list, i, shape, name, spawns, spawn, enc, fightsById;
    for (id in packs) {
      if (!Object.prototype.hasOwnProperty.call(packs, id)) continue;
      pack = packs[id] || {};
      islands.push({
        id: id,
        name: id,
        x: SF.DevWarp._spotX(id, pack),
        y: SF.DevWarp._spotY(id, pack)
      });
      walk = pack.walk || {};
      list = (walk.circles || []).concat(walk.rects || []);
      for (i = 0; i < list.length; i++) {
        shape = list[i];
        name = shape && shape.name;
        if (!name || String(shape.id || "").indexOf("green-") === 0) continue;
        if (seenTown[id + "|" + name]) continue;
        seenTown[id + "|" + name] = true;
        towns.push({
          id: shape.id || name,
          name: name,
          island: id,
          x: shape.w != null ? shape.x + shape.w / 2 : shape.x,
          y: shape.h != null ? shape.y + shape.h / 2 : shape.y
        });
      }
      spawns = pack.spawns || [];
      for (i = 0; i < spawns.length; i++) {
        spawn = spawns[i];
        if (!spawn || !spawn.boss) continue;
        bosses.push({
          id: spawn.id || spawn.kind,
          name: spawn.kind || spawn.id,
          island: id,
          x: spawn.x,
          y: spawn.y,
          encounter: spawn.encounter || ""
        });
      }
    }
    fightsById = SF.ENCOUNTERS || {};
    for (id in fightsById) {
      if (!Object.prototype.hasOwnProperty.call(fightsById, id)) continue;
      enc = fightsById[id];
      fights.push({ id: id, name: (enc && enc.name) || id, boss: !!(enc && enc.boss), bg: (enc && enc.bg) || "" });
    }
    fights.sort(function (a, b) { return a.name < b.name ? -1 : a.name > b.name ? 1 : 0; });
    return { islands: islands, towns: towns, bosses: bosses, fights: fights };
  },

  _spotX: function (id, pack) {
    if (SF.DOCKS && SF.DOCKS[id]) return SF.DOCKS[id].x;
    if (pack.wake) return pack.wake.x;
    return 0;
  },

  _spotY: function (id, pack) {
    if (SF.DOCKS && SF.DOCKS[id]) return SF.DOCKS[id].y;
    if (pack.wake) return pack.wake.y;
    return 0;
  },

  place: function (island, x, y) {
    if (!SF.DevWarp._dev || !SF.state) return false;
    if (SF.mountIsland) SF.mountIsland(island);
    var s = SF.state;
    var p = s.player;
    s.mode = "play";
    s.battle = null;
    s.island = SF.islandId || island;
    if (p) {
      p.x = x;
      p.y = y;
      p.px = x;
      p.py = y;
      p.safeX = x;
      p.safeY = y;
    }
    s.camX = x;
    s.camY = y;
    if (SF.syncUI) SF.syncUI();
    return true;
  },

  goIsland: function (id) {
    var places = SF.DevWarp.places().islands;
    var i;
    for (i = 0; i < places.length; i++) {
      if (places[i].id === id) return SF.DevWarp.place(id, places[i].x, places[i].y);
    }
    return false;
  },

  goTown: function (island, name) {
    var towns = SF.DevWarp.places().towns;
    var i;
    for (i = 0; i < towns.length; i++) {
      if (towns[i].island === island && towns[i].name === name) {
        return SF.DevWarp.place(island, towns[i].x, towns[i].y);
      }
    }
    return false;
  },

  goBoss: function (id) {
    var bosses = SF.DevWarp.places().bosses;
    var i;
    for (i = 0; i < bosses.length; i++) {
      if (bosses[i].id === id) return SF.DevWarp.place(bosses[i].island, bosses[i].x, bosses[i].y);
    }
    return false;
  },

  startFight: function (id) {
    if (!SF.DevWarp._dev || !SF.state || !SF.Battle || !SF.Battle.start) return false;
    var enc = SF.ENCOUNTERS && SF.ENCOUNTERS[id];
    if (!enc) return false;
    SF.state.mode = "play";
    return !!SF.Battle.start(id, { bg: enc.bg, boss: !!enc.boss });
  },

  fill: function (host) {
    var places = SF.DevWarp.places();
    SF.DevWarp._section(host, "Islands", places.islands, function (row) {
      return SF.DevWarp.goIsland(row.id);
    });
    SF.DevWarp._section(host, "Towns", places.towns, function (row) {
      return SF.DevWarp.goTown(row.island, row.name);
    });
    SF.DevWarp._section(host, "Bosses", places.bosses, function (row) {
      return SF.DevWarp.goBoss(row.id);
    });
    SF.DevWarp._section(host, "Formations", places.fights, function (row) {
      return SF.DevWarp.startFight(row.id);
    });
  },

  _section: function (host, title, rows, go) {
    var head = document.createElement("p");
    var i, button, row;
    head.className = "tune-name";
    head.textContent = title;
    host.appendChild(head);
    for (i = 0; i < rows.length; i++) {
      row = rows[i];
      button = document.createElement("button");
      button.className = "tune-bool";
      button.setAttribute("type", "button");
      button.setAttribute("id", "tune-warp-" + SF.DevWarp._slug(title) + "-" + SF.DevWarp._slug(row.id || row.name));
      button.textContent = row.name || row.id;
      button.addEventListener("click", (function (picked) {
        return function () { go(picked); };
      })(row));
      host.appendChild(button);
    }
  },

  _slug: function (text) {
    return String(text || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }
};
