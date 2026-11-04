"use strict";

// PropLayer: field props and the code-art fallback when a sheet is missing.

SF.drawPropArt = function (ctx, prop, lit) {
  if (!SF.DrawDeps.art() || !SF.DrawDeps.art().sprite) return false;
  var id = prop.kind;
  var scale = 2;
  if (id === "airship") id = "skiff";
  else if (id === "cottage" && SF.islandId === "cinderveil") id = "workshop";
  else if (id === "stake") id = lit ? "lamp_lit" : "lamp_cold";
  else if (id === "flower") {
    var c = prop.c || "";
    id = (c.indexOf("9af") !== -1 || c.indexOf("c8be") !== -1) ? "flower_tide" : (c.indexOf("ffb") !== -1 || c.indexOf("ffe") !== -1 || c.indexOf("e7a") !== -1 ? "flower_gold" : ((c.indexOf("c6b6") !== -1 || c.indexOf("d8c6") !== -1) ? "blossom" : "flower"));
  } else if (SF.DrawDeps.art().fieldProp) {
    id = SF.DrawDeps.art().fieldProp(prop, SF.islandId);
    if (!id) return true;
  } else if (id === "tree" && (SF.islandId === "cinderveil")) id = "tree_dead";
  else if (id === "bush" && (SF.islandId === "cinderveil")) id = "bush_dead";
  else if (id === "rock" && (SF.islandId === "cinderveil")) id = "basalt";
  else if (id === "tuft" && (SF.islandId === "cinderveil")) id = "tuft_dead";
  if (!SF.DrawDeps.art()._makers[id]) return false;
  var sc = SF.DrawDeps.art().fieldScale ? SF.DrawDeps.art().fieldScale(id) : 1;
  var boat = id === "skiff" && SF.sceneActorNudge ? SF.sceneActorNudge("skiff") : null;
  var water = id === "skiff" && SF.islandId === "cinderveil" ? (SF.SKIFF_DROP || 32) : 0;
  SF.DrawDeps.art().sprite(ctx, id, prop.x + (boat ? boat.x : 0), prop.y + water + (boat ? boat.y : 0), { scale: sc, frame: 0, facing: "down" });
  if (prop.kind === "cottage") {
    var t = SF.reduceMotion ? 0.35 : (SF.anim || 0);
    var sx = prop.x + 30;
    var sy = prop.y - 86;
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
  if (prop.spin) {
    ctx.save();
    ctx.translate(prop.x, prop.y);
    ctx.rotate(prop.spin);
    ctx.translate(-prop.x, -prop.y);
  }
  var drewArt = SF.drawPropArt(ctx, prop, lit);
  if (prop.spin) ctx.restore();
  if (drewArt) return;
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

SF.PropLayer = {
  art: function (ctx, prop, lit) { return SF.drawPropArt(ctx, prop, lit); },
  draw: function (ctx, prop, lit) { SF.drawProp(ctx, prop, lit); }
};
