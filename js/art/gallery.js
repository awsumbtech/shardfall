"use strict";

// ?gallery (or #gallery) draws every sprite, portrait, and battle background.
(function () {
  Art.wantsGallery = function () {
    try {
      var u = new URL(window.location.href);
      if (u.searchParams.has("gallery")) return true;
      if ((u.hash || "").toLowerCase().indexOf("gallery") !== -1) return true;
    } catch (err) { /* ignore */ }
    return false;
  };

  function cell(canvas, caption) {
    var wrap = document.createElement("figure");
    wrap.className = "g-cell";
    canvas.className = "g-pix";
    wrap.appendChild(canvas);
    var cap = document.createElement("figcaption");
    cap.textContent = caption;
    wrap.appendChild(cap);
    return wrap;
  }

  function scaled(id, pose, facing, frame, scale) {
    var src = Art.frameOf(id, pose, facing, frame || 0);
    var sc = scale || 4;
    var c = document.createElement("canvas");
    c.width = Math.max(1, src.width * sc);
    c.height = Math.max(1, src.height * sc);
    var g = c.getContext("2d");
    g.imageSmoothingEnabled = false;
    g.drawImage(src, 0, 0, c.width, c.height);
    return c;
  }

  function portrait(id, size) {
    var src = Art.portraitCanvas(id);
    var sc = size || 96;
    var c = document.createElement("canvas");
    c.width = sc;
    c.height = sc;
    var g = c.getContext("2d");
    g.imageSmoothingEnabled = false;
    g.drawImage(src, 0, 0, sc, sc);
    return c;
  }

  function section(root, title) {
    var h = document.createElement("h2");
    h.textContent = title;
    root.appendChild(h);
    var row = document.createElement("div");
    row.className = "g-row";
    root.appendChild(row);
    return row;
  }

  Art.openGallery = function () {
    if (Art.preload) Art.preload();
    document.body.classList.add("gallery-on");
    document.documentElement.classList.add("gallery-on");
    var root = document.getElementById("sf-gallery");
    if (!root) {
      root = document.createElement("div");
      root.id = "sf-gallery";
      document.body.appendChild(root);
    }
    root.textContent = "";
    var h1 = document.createElement("h1");
    h1.textContent = "Shardfall sprite gallery";
    root.appendChild(h1);
    var note = document.createElement("p");
    note.className = "g-note";
    note.textContent = "Field walk frames, then battle idle, attack, hurt, and cast. Open this page with ?gallery.";
    root.appendChild(note);

    var people = ["wayfarer", "kestrel", "tamsin", "maren", "hesk", "ilsa", "cantor", "villager_a", "villager_b", "brenna", "osric", "nessa", "sera", "pip", "lark", "jory", "brant", "dorrie", "maud", "ellis", "sile"];
    var foes = ["wisp", "brumekin", "choirling", "ashling", "cinderhound", "cinder_maw", "saltwisp", "drowned", "stormgull", "tidewyrm", "choir_soldier", "sentinel", "hush_raider", "sootwing"];
    var props = ["chest", "chest_open", "lamp_cold", "lamp_lit", "shard", "skiff", "cog", "sign", "tree", "rock", "cottage", "workshop", "stones", "ruin", "flower", "blossom", "hut", "stilt", "stall", "wreckhull", "gatearch", "raft", "signpost", "inn"];
    var dirs = ["down", "left", "right", "up"];

    function actorBlock(id) {
      var block = document.createElement("div");
      block.className = "g-actor";
      var name = document.createElement("h3");
      name.textContent = id;
      block.appendChild(name);
      var row = document.createElement("div");
      row.className = "g-row";
      var d, f;
      for (d = 0; d < dirs.length; d++) {
        for (f = 0; f < 4; f++) row.appendChild(cell(scaled(id, "walk", dirs[d], f, 3), dirs[d] + " " + f));
      }
      ["idle", "attack", "hurt", "cast", "victory"].forEach(function (pose) {
        row.appendChild(cell(scaled(id, pose, "right", 0, 3), pose));
      });
      block.appendChild(row);
      return block;
    }

    var peopleHead = document.createElement("h2");
    peopleHead.textContent = "People";
    root.appendChild(peopleHead);
    var host = root;
    people.forEach(function (id) { host.appendChild(actorBlock(id)); });
    var foeHead = document.createElement("h2");
    foeHead.textContent = "Enemies";
    host.appendChild(foeHead);
    foes.forEach(function (id) { host.appendChild(actorBlock(id)); });

    var propRow = section(host, "Props");
    props.forEach(function (id) {
      propRow.appendChild(cell(scaled(id, "walk", "down", 0, 3), id));
    });

    var faceRow = section(host, "Portraits");
    Art.portraitIds().forEach(function (id) {
      faceRow.appendChild(cell(portrait(id, 96), id));
    });

    var bgHead = document.createElement("h2");
    bgHead.textContent = "Battle backgrounds";
    host.appendChild(bgHead);
    var bgRow = document.createElement("div");
    bgRow.className = "g-bgs";
    host.appendChild(bgRow);
    var bgs = Art.BG_IDS || [];
    bgs.forEach(function (id) {
      var c = document.createElement("canvas");
      c.width = 180;
      c.height = 280;
      var g = c.getContext("2d");
      Art.battleBg(g, id, 180, 280, 0);
      var fig = cell(c, id);
      fig.className = "g-bg";
      bgRow.appendChild(fig);
    });

    var winHead = document.createElement("h2");
    winHead.textContent = "Window";
    host.appendChild(winHead);
    var win = document.createElement("canvas");
    win.width = 280;
    win.height = 96;
    var wg = win.getContext("2d");
    Art.window(wg, 8, 8, 264, 80, { title: "Menu" });
    wg.font = "16px Palatino, Georgia, serif";
    wg.fillStyle = "#f6f2ea";
    wg.fillText("Attack", 28, 46);
    host.appendChild(win);

    if (!Art.calm()) {
      var tick = 0;
      setInterval(function () {
        tick += 0.25;
        var nodes = bgRow.querySelectorAll("canvas");
        var i;
        for (i = 0; i < nodes.length; i++) {
          var g2 = nodes[i].getContext("2d");
          Art.battleBg(g2, bgs[i], nodes[i].width, nodes[i].height, tick);
        }
      }, 250);
    }
  };
})();
