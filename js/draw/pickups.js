"use strict";

// PickupLayer: shards, cogs, blooms, the lamp crystal, and the bobber.

SF.drawPickup = function (ctx, item, hiddenIcon) {
  var bob = Math.sin(SF.anim * 3 + item.x) * 3;
  var x = item.x;
  var y = item.y + bob;
  if (SF.DrawDeps.art() && SF.DrawDeps.art().sprite && (item.kind === "shard" || item.kind === "cog" || item.kind === "bloom")) {
    var pid = item.kind === "cog" ? "cog" : (item.kind === "bloom" ? "blossom" : "shard");
    var bobY = (SF.calm && SF.calm()) ? 0 : Math.sin(SF.anim * 2 + item.x) * 2;
    SF.DrawDeps.art().sprite(ctx, pid, x, y + bobY - bob, { scale: SF.DrawDeps.art().fieldScale(pid), anchor: "center" });
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
  var crystalY = y - ((SF.DrawDeps.art() && SF.DrawDeps.art().lampCrystalDy) || 34);
  var flare = SF.lampFlareAmt ? SF.lampFlareAmt(SF.state) : 0;
  var showLit = lit || flare > 0.35;
  if (SF.DrawDeps.art() && SF.DrawDeps.art().sprite) {
    if ((showLit || flare > 0) && SF.blobs) {
      ctx.save();
      ctx.globalAlpha = showLit ? 0.9 : 0.35 + flare * 0.6;
      var bloom = showLit ? 72 : 40 + flare * 36;
      ctx.drawImage(SF.blobs.gold, x - bloom / 2, crystalY - bloom / 2, bloom, bloom);
      ctx.restore();
    }
    var lampId = showLit ? "great_lamp_lit" : "great_lamp";
    if (!SF.DrawDeps.art()._makers[lampId]) lampId = showLit ? "lamp_lit" : "lamp_cold";
    SF.DrawDeps.art().sprite(ctx, lampId, x, y + 10, { scale: SF.DrawDeps.art().fieldScale(lampId) });
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

SF.drawBobber = function (ctx, x, y, lift) {
  var bob = (SF.calm && SF.calm()) ? 0 : Math.sin(SF.anim * 2) * 2;
  var rise = lift == null ? 28 : lift;
  ctx.save();
  ctx.translate(x, y - rise + bob);
  ctx.fillStyle = "#ffd37a";
  ctx.beginPath();
  ctx.moveTo(0, -5);
  ctx.lineTo(4, 0);
  ctx.lineTo(0, 5);
  ctx.lineTo(-4, 0);
  ctx.fill();
  ctx.restore();
};

SF.PickupLayer = {
  draw: function (ctx, item, hiddenIcon) { SF.drawPickup(ctx, item, hiddenIcon); },
  lamp: function (ctx, lit) { SF.drawLampCrystal(ctx, lit); },
  bobber: function (ctx, x, y, lift) { SF.drawBobber(ctx, x, y, lift); }
};
