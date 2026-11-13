"use strict";

// MapLayer: the corner map of the drift.

SF.drawMap = function () {
  var canvas = SF.game && SF.game.map;
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

SF.MapLayer = {
  draw: function () { SF.drawMap(); }
};
