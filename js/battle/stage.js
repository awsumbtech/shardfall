"use strict";

// BattleStage: backdrop, standing actors, hit flash, and the impact effects.

(function () {
function formationCells(n, zone, cols) {
  if (!(cols > 0)) cols = n <= 1 ? 1 : 2;
  cols = Math.max(1, Math.min(n, cols));
  var rows = Math.ceil(n / cols);
  var gapX = n > 1 ? 10 : 0;
  var gapY = rows > 1 ? 8 : 0;
  var cellW = (zone.w - gapX * (cols - 1)) / cols;
  var cellH = (zone.h - gapY * (rows - 1)) / rows;
  var cells = [];
  var i, row, rowCount, rowW, rowX, col;
  for (i = 0; i < n; i++) {
    row = Math.floor(i / cols);
    col = i - row * cols;
    rowCount = row === rows - 1 ? n - row * cols : cols;
    rowW = rowCount * cellW + (rowCount - 1) * gapX;
    rowX = zone.x + (zone.w - rowW) / 2;
    cells.push({
      x: rowX + col * (cellW + gapX),
      y: zone.y + row * (cellH + gapY),
      w: cellW,
      h: cellH
    });
  }
  return cells;
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w - 0.5 && a.x + a.w > b.x + 0.5 && a.y < b.y + b.h - 0.5 && a.y + a.h > b.y + 0.5;
}

function labelBox(cell, cx, top, labelH) {
  if (!labelH) return { x: cell.x, y: top, w: cell.w, h: 0 };
  var labelW = Math.max(36, cell.w - 4);
  var labelX = cell.x + 2;
  return { x: labelX, y: top - labelH, w: labelW, h: labelH };
}

function placeActors(actors, zone, side, groundY, foeCap) {
  var n = actors.length;
  if (!n || !zone || zone.w < 8 || zone.h < 8) return [];
  var labelH = side === "foe" ? 40 : 0;
  var cells = formationCells(n, zone, side === "party" ? n : 0);
  var placed = [];
  var i, actor, cell, scale, src, sw, sh, ax, ay, cx, feet, top, hit;
  var tallest = 0;
  var specs = [];
  for (i = 0; i < n; i++) {
    actor = actors[i];
    cell = cells[i];
    scale = SF.BattleGfx.battleScale(actor, n, zone.h, cell.w, Math.min(cell.h, zone.h), labelH);
    src = SF.BattleGfx.sourceSize(actor.sprite, side === "party" ? "left" : "right");
    sh = src.h * scale;
    if (sh > tallest) tallest = sh;
    specs.push({ actor: actor, cell: cell, scale: scale, src: src, sh: sh });
  }
  if (side === "party" && specs.length) {
    var tallSrc = specs[0].src.h;
    for (i = 1; i < specs.length; i++) if (specs[i].src.h > tallSrc) tallSrc = specs[i].src.h;
    var shared = SF.BattleGfx.partyBattleScale(tallSrc, foeCap || 0);
    var fitAll = shared;
    for (i = 0; i < specs.length; i++) {
      var cellW = Math.max(16, specs[i].cell.w - 4);
      var cellH = Math.max(16, specs[i].cell.h - 4);
      var fit = fitAll;
      while (fit > 1 && (fit * specs[i].src.w > cellW || fit * specs[i].src.h > cellH)) fit -= 1;
      if (fit < fitAll) fitAll = fit;
    }
    tallest = 0;
    for (i = 0; i < specs.length; i++) {
      specs[i].scale = fitAll;
      specs[i].sh = specs[i].src.h * fitAll;
      if (specs[i].sh > tallest) tallest = specs[i].sh;
    }
  }
  var minFeet = zone.y + labelH + tallest + 4;
  var maxFeet = zone.y + zone.h - 6;
  var feetLine = maxFeet;
  if (groundY) feetLine = Math.min(maxFeet, Math.max(minFeet, groundY));
  for (i = 0; i < n; i++) {
    actor = specs[i].actor;
    cell = specs[i].cell;
    scale = specs[i].scale;
    src = specs[i].src;
    sw = src.w * scale;
    sh = specs[i].sh;
    ax = src.ax * scale;
    ay = src.ay * scale;
    cx = cell.x + cell.w / 2;
    if (cx - ax < cell.x + 2) cx = cell.x + 2 + ax;
    if (cx - ax + sw > cell.x + cell.w - 2) cx = cell.x + cell.w - 2 - (sw - ax);
    feet = feetLine;
    top = feet - ay;
    if (labelH && top - labelH < zone.y + 2) {
      var shift = zone.y + 2 - (top - labelH);
      feet += shift;
      top += shift;
    }
    hit = { x: cx - ax, y: top, w: sw, h: sh };
    placed.push({
      actor: actor,
      scale: scale,
      src: src,
      x: cx,
      feet: feet,
      hit: hit,
      label: labelBox(cell, cx, top, labelH)
    });
  }
  var guard = 0;
  while (guard < 8) {
    var overlap = false;
    for (i = 0; i < placed.length; i++) {
      var j;
      for (j = i + 1; j < placed.length; j++) {
        if (rectsOverlap(placed[i].hit, placed[j].hit)) overlap = true;
      }
    }
    if (!overlap) break;
    guard += 1;
    for (i = 0; i < placed.length; i++) {
      var prevScale = placed[i].scale;
      placed[i].scale = Math.max(1, Math.round(prevScale * 0.82));
      if (placed[i].scale >= prevScale) placed[i].scale = Math.max(1, prevScale - 1);
      src = placed[i].src;
      scale = placed[i].scale;
      sw = src.w * scale;
      sh = src.h * scale;
      ax = src.ax * scale;
      ay = src.ay * scale;
      feet = placed[i].feet;
      top = feet - ay;
      placed[i].hit = { x: placed[i].x - ax, y: top, w: sw, h: sh };
      placed[i].label = labelBox(cells[i], placed[i].x, top, labelH);
    }
  }
  return placed;
}

// A soft ground shadow pins every fighter to the battle floor. It stays on
// the floor line even when the sprite lunges, hops, or recoils.
function drawGroundShadow(ctx, spot, dx, alpha) {
  // Stepped (pixel-art) ellipse: flat bands, no anti-aliased edge.
  // A boss plants a wider, heavier shadow so the bulk reads as weight.
  var boss = spot.actor && (spot.actor.boss || spot.actor.sprite === "cinder_maw" || spot.actor.sprite === "tidewyrm");
  var w = Math.max(12, Math.round(spot.hit.w * (boss ? 0.92 : 0.62)));
  var band = boss ? 4 : 3;
  var rows = boss ? [0.48, 0.74, 1, 0.74, 0.48] : [0.62, 1, 0.62];
  var cx = Math.round(spot.x + dx);
  var cy = Math.round(spot.feet);
  ctx.save();
  ctx.globalAlpha = alpha == null ? 1 : alpha;
  ctx.fillStyle = boss ? "rgba(8, 4, 16, 0.42)" : "rgba(10, 6, 24, 0.30)";
  var i, rw, top;
  top = cy - Math.floor(rows.length / 2) * band;
  for (i = 0; i < rows.length; i++) {
    rw = Math.round(w * rows[i] / 2) * 2;
    ctx.fillRect(cx - rw / 2, top + i * band, rw, band);
  }
  ctx.restore();
}

function drawFoeLabel(ctx, spot, battle) {
  var f = spot.actor;
  var box = spot.label;
  var hp = f.hp + "/" + f.maxHp;
  var tag = "";
  if (f.core) tag = "Core";
  else if (f.revealed && f.weak) tag = SF.BattleHud.weakLabel(f.weak);
  var name = SF.BattleGfx.pickFitting(ctx, SF.BattleGfx.labelChoices(f, battle, true), Math.max(8, box.w - 2), 14, 11);
  ctx.save();
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.font = "700 " + name.size + "px system-ui, sans-serif";
  var nameW = ctx.measureText(name.text).width;
  ctx.font = "700 13px system-ui, sans-serif";
  var hpW = ctx.measureText(hp).width;
  var tagW = tag ? ctx.measureText(tag).width : 0;
  var lineW = hpW + (tag && hpW + 8 + tagW <= box.w - 2 ? 8 + tagW : 0);
  var plateW = Math.min(box.w, Math.max(nameW, lineW, 36) + 10);
  var plateX = Math.round(box.x - 4);
  var plateY = Math.round(box.y - 2);
  ctx.fillStyle = "rgba(8, 6, 16, 0.78)";
  ctx.fillRect(plateX, plateY, Math.round(plateW + 6), 40);
  ctx.beginPath();
  ctx.rect(box.x, box.y, box.w, box.h);
  ctx.clip();
  ctx.fillStyle = "#f6f2ea";
  ctx.font = "700 " + name.size + "px system-ui, sans-serif";
  ctx.fillText(name.text, box.x, box.y + 1);
  ctx.font = "700 13px system-ui, sans-serif";
  ctx.fillStyle = "#ffd5dc";
  ctx.fillText(hp, box.x, box.y + 18);
  if (tag && hpW + 8 + tagW <= box.w - 2) {
    ctx.fillStyle = "#ffd37a";
    ctx.fillText(tag, box.x + hpW + 8, box.y + 18);
  }
  ctx.restore();
  SF.BattleGfx.bar(ctx, box.x, box.y + 33, plateW, 4, f.maxHp ? f.hp / f.maxHp : 0, f.alive ? "#e15b6a" : "#665");
}

// The battle plate paints its floor from the same horizon as scenes.js.
// Feet go on the near floor, below that seam, and never up in the sky band.
function backdropFloor(canvasW, canvasH, stage) {
  var portrait = canvasH > canvasW;
  var horizon = Math.round(canvasH * (portrait ? 0.47 : 0.46));
  var span = Math.max(1, canvasH - horizon);
  var near = horizon + Math.round(span * 0.62);
  var low = stage.y + stage.h - 8;
  var feet = Math.min(near, low);
  if (feet <= horizon && low > horizon + 8) feet = low;
  feet = Math.max(stage.y + 16, Math.min(low, feet));
  return { horizon: horizon, feet: Math.round(feet) };
}

function fitStandingHeight(spots, minTop) {
  var i, spot, src, scale, ay, top;
  for (i = 0; i < spots.length; i++) {
    spot = spots[i];
    src = spot.src;
    scale = spot.scale;
    while (scale > 1 && spot.feet - src.ay * scale < minTop) scale -= 1;
    ay = src.ay * scale;
    top = spot.feet - ay;
    spot.scale = scale;
    spot.hit.x = spot.x - src.ax * scale;
    spot.hit.y = top;
    spot.hit.w = src.w * scale;
    spot.hit.h = src.h * scale;
  }
}

function plantFeet(spots, feet) {
  var i, spot, src, scale, ax, ay;
  for (i = 0; i < spots.length; i++) {
    spot = spots[i];
    src = spot.src;
    scale = spot.scale;
    ax = src.ax * scale;
    ay = src.ay * scale;
    spot.feet = feet;
    spot.hit.x = spot.x - ax;
    spot.hit.y = feet - ay;
    spot.hit.w = src.w * scale;
    spot.hit.h = src.h * scale;
    if (spot.label && spot.label.h) spot.label.y = spot.hit.y - spot.label.h;
  }
}

function clampBox(box, bounds) {
  if (box.x < bounds.left) box.x = bounds.left;
  if (box.y < bounds.top) box.y = bounds.top;
  if (box.x + box.w > bounds.right) box.x = Math.max(bounds.left, bounds.right - box.w);
  if (box.y + box.h > bounds.bottom) box.y = Math.max(bounds.top, bounds.bottom - box.h);
}

// Plates sit just under the feet and the shadow. They stay on screen,
// clear of each other, and clear of the command dock.
function seatFoeLabels(spots, view) {
  var placed = [];
  var screen = view.screen;
  spots.forEach(function (spot) {
    if (!spot.label || !spot.label.h) return;
    var box = spot.label;
    box.h = 40;
    box.w = Math.max(72, Math.min(box.w || 96, 140));
    box.x = Math.round(spot.x - box.w / 2);
    box.y = Math.round(spot.feet + 8);
    clampBox(box, screen);
    var guard = 0;
    while (view.dock && rectsOverlap(box, view.dock) && guard < 10) {
      guard += 1;
      if (box.x + box.w > view.dock.x && box.x < view.dock.x + view.dock.w) {
        box.x = view.dock.x - box.w - 6;
      } else {
        box.y = view.dock.y - box.h - 6;
      }
      clampBox(box, screen);
    }
    placed.forEach(function (other) {
      var n = 0;
      while (rectsOverlap(box, other) && n < 8) {
        n += 1;
        if (spot.x >= other.x + other.w / 2) box.x = other.x + other.w + 6;
        else box.x = other.x - box.w - 6;
        clampBox(box, screen);
      }
    });
    if (box.y < spot.feet + 2) box.y = spot.feet + 2;
    clampBox(box, screen);
    placed.push({ x: box.x, y: box.y, w: box.w, h: box.h, feet: spot.feet, id: spot.actor.id });
  });
  SF.Battle.foePlates = placed;
}

function softHitTint() {
  if (SF.reduceFlash) return true;
  if (SF.reduceMotion) return true;
  if (SF.BattleFeel && SF.BattleFeel.prefersReducedMotion && SF.BattleFeel.prefersReducedMotion()) return true;
  return false;
}

function hitFlashAlpha(b, actor) {
  if (!b.art || !b.art.flash || b.art.flash.indexOf(actor.id) < 0) return 0;
  // Reduce flashing, or reduced motion, fades a 0.35 tint over ~100ms.
  // Elapsed time, not frame count.
  if (softHitTint()) {
    var dur = SF.BattleFeel && SF.BattleFeel.FLASH_TINT_MS != null ? SF.BattleFeel.FLASH_TINT_MS : 100;
    if (!b.art.flashAt) b.art.flashAt = {};
    if (b.art.flashAt[actor.id] == null) {
      b.art.flashAt[actor.id] = SF.BattleFeel && SF.BattleFeel.now ? SF.BattleFeel.now() : Date.now();
    }
    var elapsed = (SF.BattleFeel && SF.BattleFeel.now ? SF.BattleFeel.now() : Date.now()) - b.art.flashAt[actor.id];
    if (elapsed >= dur) return 0;
    var base = SF.BattleFeel && SF.BattleFeel.FLASH_TINT != null ? SF.BattleFeel.FLASH_TINT : 0.35;
    return base * (1 - elapsed / dur);
  }
  if (b.hitPause > 0) return 0.78;
  var p = SF.BattleGfx.animP(b);
  if (p > 0.28) return 0;
  return 0.78 * (1 - p / 0.28);
}

function drawHitFlash(ctx, b, actor, spot, nudge) {
  var alpha = hitFlashAlpha(b, actor);
  if (!(alpha > 0)) return;
  var cx = Math.round(spot.x + nudge.x);
  var cy = Math.round(spot.hit.y + spot.hit.h * 0.42 + nudge.y);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#fff";
  if (softHitTint()) {
    var bw = Math.max(8, Math.round(spot.hit.w * 0.5));
    var bh = Math.max(8, Math.round(spot.hit.h * 0.42));
    ctx.fillRect(cx - Math.round(bw / 2), cy - Math.round(bh / 2), bw, bh);
  } else {
    var s = Math.max(6, Math.round(Math.min(spot.hit.w, spot.hit.h) * 0.16));
    ctx.fillRect(cx - s, cy - Math.round(s / 2), s * 2, s);
    ctx.fillRect(cx - Math.round(s / 2), cy - s, s, s * 2);
  }
  ctx.restore();
}

function drawStage(ctx, b, foes, party, stage, canvasW, canvasH, dock) {
  if (!stage) return;
  var split = party.length > 1 ? 0.56 : 0.62;
  var foeZone = {
    x: stage.x + 4,
    y: stage.y + 2,
    w: Math.max(40, Math.round(stage.w * split) - 8),
    h: Math.max(40, stage.h - 4)
  };
  var partyZone = {
    x: foeZone.x + foeZone.w + 8,
    y: stage.y + 2,
    w: Math.max(40, stage.x + stage.w - (foeZone.x + foeZone.w + 12)),
    h: foeZone.h
  };
  var floor = backdropFloor(canvasW || stage.w, canvasH || (stage.y + stage.h), stage);
  var groundY = floor.feet;
  var foeSpots = placeActors(foes, foeZone, "foe", groundY);
  var foeCap = 0;
  var smallCap = 0;
  foeSpots.forEach(function (spot) {
    var h = spot.src.h * spot.scale;
    if (!(h > 0)) return;
    if (!foeCap || h < foeCap) foeCap = h;
    if (!SF.BattleGfx.isBoss(spot.actor) && (!smallCap || h < smallCap)) smallCap = h;
  });
  // Boss-only fights have no wisp to measure. Use the meadow wisp height
  // so the party keeps the same scale and the same gaps as a normal battle.
  var partyRef = smallCap || SF.BattleGfx.meadowFoeHeight(foeZone.w, foeZone.h);
  var partySpots = placeActors(party, partyZone, "party", groundY, partyRef);
  plantFeet(foeSpots, groundY);
  plantFeet(partySpots, groundY);
  fitStandingHeight(partySpots, stage.y + 4);
  seatFoeLabels(foeSpots, {
    screen: {
      left: 4,
      top: 4,
      right: Math.max(40, (canvasW || stage.w) - 4),
      bottom: Math.max(40, (canvasH || (stage.y + stage.h)) - 4)
    },
    dock: dock
  });
  SF.Battle.partyBoxes = partySpots.map(function (spot) {
    return {
      id: spot.actor.id,
      alive: spot.actor.alive,
      x: spot.hit.x,
      y: spot.hit.y,
      w: spot.hit.w,
      h: spot.hit.h,
      feet: spot.feet
    };
  });
  SF.Battle.stand = {
    horizon: floor.horizon,
    floor: groundY,
    feet: partySpots.map(function (spot) { return spot.feet; }),
    bg: b.bg
  };
  var aiming = b.phase === "target";
  var aimFoe = aiming && b.aim !== "ally";
  var aimAlly = aiming && b.aim === "ally";
  var spots = [];
  foeSpots.forEach(function (spot) {
    var f = spot.actor;
    var nudge = SF.BattleGfx.actorNudge(b, f);
    var pose = SF.BattleGfx.battlePose(b, f);
    var canTap = aimFoe && f.alive;
    if (!f.alive && b.phase === "result") return;
    drawGroundShadow(ctx, spot, nudge.x, !f.alive ? 0.35 : (aiming && !canTap ? 0.4 : 1));
    ctx.save();
    if (!f.alive) ctx.globalAlpha = 0.35;
    else if (aiming && !canTap) ctx.globalAlpha = 0.4;
    SF.BattleGfx.drawSprite(ctx, f.sprite, spot.x + nudge.x, spot.feet + nudge.y, spot.scale, pose, "right");
    ctx.restore();
    drawHitFlash(ctx, b, f, spot, nudge);
    drawFoeLabel(ctx, spot, b);
    if (canTap) {
      var foePick = 0;
      foes.forEach(function (other) { if (other.alive && other !== f && foes.indexOf(other) < foes.indexOf(f)) foePick += 1; });
      var foeOn = foePick === (b.sel || 0);
      ctx.save();
      ctx.strokeStyle = foeOn ? "#ffd37a" : "rgba(255, 211, 122, 0.45)";
      ctx.lineWidth = foeOn ? 4 : 2;
      ctx.strokeRect(Math.round(spot.hit.x) - 2, Math.round(spot.hit.y) - 2, Math.round(spot.hit.w) + 4, Math.round(spot.hit.h) + 4);
      ctx.restore();
      SF.BattleGfx.addHit("foe:" + f.id, spot.hit.x, spot.hit.y, spot.hit.w, spot.hit.h);
    }
    spots.push({
      actor: f,
      x: spot.x + nudge.x,
      y: spot.feet + nudge.y,
      top: spot.hit.y + nudge.y
    });
  });
  partySpots.forEach(function (spot) {
    var a = spot.actor;
    var nudge = SF.BattleGfx.actorNudge(b, a);
    var pose = SF.BattleGfx.battlePose(b, a);
    // Victory used to lift the hero 10px for the whole results screen, which
    // left him hovering over the floor. The victory pose already raises the arm.
    drawGroundShadow(ctx, spot, nudge.x, a.alive ? 1 : 0.35);
    ctx.save();
    if (!a.alive) ctx.globalAlpha = 0.35;
    SF.BattleGfx.drawSprite(ctx, a.sprite, spot.x + nudge.x, spot.feet + nudge.y, spot.scale, pose, "left");
    ctx.restore();
    drawHitFlash(ctx, b, a, spot, nudge);
    if (aimAlly && a.alive) {
      var allyPick = 0;
      party.forEach(function (other) {
        if (other.alive && party.indexOf(other) < party.indexOf(a)) allyPick += 1;
      });
      var allyOn = allyPick === (b.sel || 0);
      ctx.save();
      ctx.strokeStyle = allyOn ? "#ffd37a" : "rgba(255, 211, 122, 0.45)";
      ctx.lineWidth = allyOn ? 4 : 2;
      ctx.strokeRect(Math.round(spot.hit.x) - 2, Math.round(spot.hit.y) - 2, Math.round(spot.hit.w) + 4, Math.round(spot.hit.h) + 4);
      ctx.restore();
      SF.BattleGfx.addHit("ally:" + a.id, spot.hit.x, spot.hit.y, spot.hit.w, spot.hit.h);
    }
    spots.push({
      actor: a,
      x: spot.x + nudge.x,
      y: spot.feet + nudge.y,
      top: spot.hit.y + nudge.y
    });
  });
  drawBattleFx(ctx, b, spots);
}

var FX = {
  ember: ["#e07a30", "#ffb15a", "#a33a18"],
  tide: ["#2a9aa8", "#7ee0d8", "#1a5c78"],
  gale: ["#d7e2b8", "#8ec8a0", "#c8b07a"],
  shard: ["#3ec8e8", "#7ee7ff", "#2a6ad4"]
};

function drawElement(ctx, element, x, y, p, calm) {
  var cols = FX[element];
  if (!cols) return;
  var n = calm ? 7 : 10;
  var i, ang, rad, px, py, col;
  for (i = 0; i < n; i++) {
    ang = (i / n) * Math.PI * 2 + (calm ? 0.6 : p * 1.1);
    rad = 16 + (i % 3) * 10 + (calm ? 12 : p * 28);
    px = Math.round(x + Math.cos(ang) * rad);
    py = Math.round(y - Math.sin(Math.abs(ang)) * rad * 0.55 - (calm ? 6 : p * 14));
    col = cols[i % cols.length];
    ctx.fillStyle = col;
    if (element === "gale") ctx.fillRect(px, py, 12, 3);
    else if (element === "tide") ctx.fillRect(px, py, 4, 9);
    else if (element === "shard") {
      ctx.fillRect(px, py, 5, 5);
      ctx.fillRect(px - 3, py + 2, 11, 2);
    } else ctx.fillRect(px, py, 6, 6);
  }
}

function drawBattleFx(ctx, b, spots) {
  var art = b.art;
  if (!art || !spots) return;
  if (b.phase === "result") return;
  var p = SF.BattleGfx.animP(b);
  if (!p) return;
  var calm = SF.calm && SF.calm();
  var byId = {};
  spots.forEach(function (spot) { byId[spot.actor.id] = spot; });
  function bodyY(spot) {
    var top = spot.top == null ? spot.y - 80 : spot.top;
    return Math.round(top + (spot.y - top) * 0.42);
  }
  if (art.element && art.hurt && art.hurt.length) {
    art.hurt.forEach(function (id) {
      var spot = byId[id];
      if (spot) drawElement(ctx, art.element, spot.x, bodyY(spot), p, calm);
    });
  }
  if (b.phase === "result") return;
  // The sprite box has empty sky above the drawn body. Anchor callouts
  // on the body so the number sits on the target, not in the trees.
  function calloutBody(spot) {
    var feet = spot.y;
    var top = spot.top == null ? feet - 64 : spot.top;
    return top + (feet - top) * 0.42;
  }
  function paintCallout(text, x, y, fill, size) {
    ctx.font = "700 " + size + "px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillStyle = "rgba(12, 8, 20, 0.92)";
    ctx.fillText(text, x - 1, y);
    ctx.fillText(text, x + 1, y);
    ctx.fillText(text, x, y - 1);
    ctx.fillText(text, x, y + 1);
    ctx.fillStyle = fill;
    ctx.fillText(text, x, y);
  }
  var seenTag = {};
  (art.tags || []).forEach(function (tag) {
    if (!tag || seenTag[tag.id]) return;
    seenTag[tag.id] = true;
    var spot = byId[tag.id];
    if (!spot) return;
    var body = calloutBody(spot);
    var rise = calm ? 2 : Math.round(2 + 10 * p);
    var alpha = calm ? 1 : (p > 0.82 ? Math.max(0, 1 - (p - 0.82) / 0.18) : 1);
    var numSize = calm ? 34 : 40;
    ctx.save();
    ctx.globalAlpha = alpha;
    paintCallout(tag.text, spot.x, body - 6 - rise - numSize, tag.text === "WEAK" ? "#ffd37a" : "#b9d6ff", calm ? 16 : 18);
    ctx.restore();
  });
  (art.pops || []).forEach(function (pop, index) {
    var spot = byId[pop.id];
    if (!spot) return;
    var rise = calm ? 2 : Math.round(2 + 12 * p);
    var alpha = calm ? 1 : (p > 0.78 ? Math.max(0, 1 - (p - 0.78) / 0.22) : 1);
    var body = calloutBody(spot);
    var size = calm ? 34 : (p < 0.16 ? 46 : 40);
    var stack = pop.heal ? 0 : index * 6;
    ctx.save();
    ctx.globalAlpha = alpha;
    paintCallout((pop.heal ? "+" : "") + pop.text, spot.x, body - 4 - rise - stack, pop.heal ? "#7dffa8" : "#ffd37a", size);
    ctx.restore();
  });
}
  SF.BattleStage = {
    formationCells: formationCells,
    rectsOverlap: rectsOverlap,
    labelBox: labelBox,
    placeActors: placeActors,
    drawGroundShadow: drawGroundShadow,
    drawFoeLabel: drawFoeLabel,
    backdropFloor: backdropFloor,
    fitStandingHeight: fitStandingHeight,
    plantFeet: plantFeet,
    clampBox: clampBox,
    seatFoeLabels: seatFoeLabels,
    softHitTint: softHitTint,
    hitFlashAlpha: hitFlashAlpha,
    drawHitFlash: drawHitFlash,
    drawStage: drawStage,
    drawElement: drawElement,
    drawBattleFx: drawBattleFx
  };
})();
