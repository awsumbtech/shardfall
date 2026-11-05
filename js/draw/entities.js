"use strict";

// EntityLayer: the y-sorted list of everything that stands on the island.

SF.entityList = function (s) {
  var list = [];
  if (SF.DrawDeps.art() && SF.DrawDeps.art().landmarkDraws) {
    SF.DrawDeps.art().landmarkDraws().forEach(function (item) { list.push(item); });
  }
  var lit = SF.lampIsLit ? SF.lampIsLit(s) : !!s.flags.lampLit;
  var propList = SF.PROPS || [];
  if (SF.propGrid && SF.worldSource === "tiles" && SF.viewW > 32 && SF.viewH > 32 && s && SF.viewRect) {
    var propView = SF.viewRect(160);
    propList = SF.propGrid.near(propView.l, propView.t, propView.r, propView.b);
  }
  propList.forEach(function (prop) {
    if (prop.dense && SF.worldSource !== "tiles") return;
    list.push({ y: prop.y, draw: function (ctx) { SF.drawProp(ctx, prop, lit); } });
  });
  (SF.TEXTS || []).forEach(function (mark) {
    var id = mark.id || "";
    var sid = "";
    if (id === "vault-seal" || id === "maw-mouth") sid = "";
    else if (id === "sail-patch") sid = "sign";
    else if (/sign|order/i.test(id) || /sign/i.test(mark.speaker || "")) sid = "sign";
    else if (/bell/i.test(id)) sid = "bell";
    else if (/cog/i.test(id)) sid = "cog";
    else if (/crate/i.test(id)) sid = "crate";
    else if (/blossom|flower/i.test(id)) sid = "flower";
    else if (/plank|bridge|hull|span/i.test(id)) sid = "plank";
    else sid = "stones";
    if (!sid || !SF.DrawDeps.art()) return;
    var crowded = false;
    (SF.PROPS || []).forEach(function (prop) {
      if (Math.hypot(prop.x - mark.x, prop.y - mark.y) < 12) crowded = true;
    });
    if (crowded) return;
    list.push({
      y: mark.y,
      draw: function (ctx) { SF.DrawDeps.art().sprite(ctx, sid, mark.x, mark.y, { scale: 1 }); }
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
        if (extra.kind === "bench" && SF.DrawDeps.art() && SF.DrawDeps.art().sprite) {
          SF.DrawDeps.art().sprite(ctx, "bench", extra.x, extra.y, { scale: 1 });
        } else if (extra.kind === "bench") {
          ctx.fillStyle = "#6a5348";
          ctx.fillRect(extra.x - 14, extra.y - 4, 28, 6);
          ctx.fillRect(extra.x - 12, extra.y - 10, 4, 8);
          ctx.fillRect(extra.x + 8, extra.y - 10, 4, 8);
        } else if (SF.DrawDeps.art() && SF.DrawDeps.art().sprite) {
          SF.DrawDeps.art().sprite(ctx, "stones", extra.x, extra.y, { scale: 1 });
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
    var feet = SF.actorFeet ? SF.actorFeet(n) : null;
    var nx = feet ? feet.x : n.x;
    var ny = feet ? feet.y : n.y;
    var ilsaWalking = n.id === "ilsa" && SF.ilsaWalking && SF.ilsaWalking();
    list.push({
      y: ny,
      draw: function (ctx) {
        var ride = n.id === "kestrel" && SF.sceneActorNudge ? SF.sceneActorNudge("kestrel") : null;
        ctx.save();
        if (ride) ctx.translate(ride.x, ride.y);
        var aboard = n.id === "kestrel" && SF.boatBoard && SF.boatBoard() > 0.45;
        SF.drawShadow(ctx, nx, ny, aboard ? 5 : 10, aboard ? 0 : 1);
        var drewActor = SF.drawActor && SF.drawActor(ctx, n, nx, ny, null, null, ilsaWalking);
        if (!drewActor) {
          if (n.id === "maren") SF.drawMaren(ctx, nx, ny);
          else if (n.id === "kestrel") SF.drawKestrel(ctx, nx, ny);
          else if (n.id === "tamsin") SF.drawTamsin(ctx, nx, ny);
          else if (n.id === "hesk") SF.drawHesk(ctx, nx, ny);
          else if (n.id === "ilsa") SF.drawIlsa(ctx, nx, ny);
          else SF.drawCantor(ctx, nx, ny);
        }
        var walking = n.id === "cantor" && s.approach && s.approach.kind === "cantor";
        var nameDist = SF.dist(s.player.x, s.player.y, nx, ny);
        if (walking || (s.mode === "play" && nameDist < 90)) {
          var alpha = SF.markAlpha ? SF.markAlpha(n.id, nameDist) : 1;
          if (alpha > 0.02) {
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.font = "600 12px \"Avenir Next\", \"Segoe UI\", system-ui, sans-serif";
            ctx.textAlign = "center";
            ctx.fillStyle = "#fff8ee";
            ctx.fillText(n.name, nx, ny - 34);
            ctx.restore();
          }
        }
        ctx.restore();
      }
    });
  });
  s.enemies.forEach(function (e) {
    if (!e.alive && e.dying <= 0 && !e.ash) return;
    list.push({
      y: e.y,
      draw: function (ctx) {
        ctx.save();
        if (e.ash && SF.drawMawAsh) {
          var ashU = e.ash.dur <= 0 ? 1 : Math.max(0, Math.min(1, e.ash.t / e.ash.dur));
          ctx.globalAlpha = Math.max(0, 1 - ashU);
          SF.drawShadow(ctx, e.x, e.y, e.kind === "maw" ? 13 : e.r);
          ctx.globalAlpha = 1;
          var ashFace = "down";
          if (s.player) {
            var adx = s.player.x - e.x;
            var ady = s.player.y - e.y;
            if (Math.abs(adx) > 18 || Math.abs(ady) > 18) {
              ashFace = Math.abs(adx) >= Math.abs(ady) ? (adx < 0 ? "left" : "right") : (ady < 0 ? "up" : "down");
            }
          }
          SF.drawMawAsh(ctx, e, ashFace);
          ctx.restore();
          return;
        }
        if (e.dying > 0) ctx.globalAlpha = Math.max(0, e.dying / 0.45);
        SF.drawShadow(ctx, e.x, e.y, e.kind === "maw" ? 13 : e.r);
        var foeSprite = SF.foeSprite ? SF.foeSprite(e) : null;
        var foeScale = (SF.DrawDeps.art() && SF.DrawDeps.art().fieldScale) ? SF.DrawDeps.art().fieldScale(foeSprite || "wayfarer") : 1;
        var foeFrame = (SF.calm && SF.calm()) ? 0 : Math.floor((SF.anim || 0) * 4) % 4;
        var foeFacing = "down";
        if (s.player) {
          var fdx = s.player.x - e.x;
          var fdy = s.player.y - e.y;
          if (Math.abs(fdx) > 18 || Math.abs(fdy) > 18) {
            foeFacing = Math.abs(fdx) >= Math.abs(fdy) ? (fdx < 0 ? "left" : "right") : (fdy < 0 ? "up" : "down");
          }
        }
        var drewFoe = foeSprite && SF.tryArtSprite && SF.tryArtSprite(ctx, foeSprite, e.x, e.y, {
          scale: foeScale,
          frame: foeFrame,
          facing: foeFacing,
          pose: "walk"
        });
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
  (SF.HOOKS || []).forEach(function (hook) {
    if (SF.hookLive && !SF.hookLive(hook)) return;
    list.push({
      y: hook.y,
      draw: function (ctx) {
        if (SF.drawHookPost) SF.drawHookPost(ctx, hook);
      }
    });
  });
  var p = s.player;
  var heroSort = p.y;
  if (SF.rampFrontY) {
    var frontY = SF.rampFrontY(p.x, p.y);
    if (frontY != null && frontY > heroSort) heroSort = frontY + 0.5;
  }
  list.push({
    y: heroSort + 0.01,
    draw: function (ctx) {
      var ride = SF.sceneActorNudge ? SF.sceneActorNudge("player") : null;
      ctx.save();
      if (ride) ctx.translate(ride.x, ride.y);
      var alpha = 1;
      if (p.iFrames > 0 && !(SF.calm && SF.calm())) alpha = 0.84;
      if (!SF.walkable(p.x, p.y)) alpha *= 0.7;
      var sink = SF.walkable(p.x, p.y) ? 0 : Math.min(10, p.fall * 36);
      s.ghosts.forEach(function (g) {
        SF.drawWayfarer(ctx, g.x, g.y, g.fx, g.fy, g.a, p.shardstep);
      });
      var aboardHero = SF.boatBoard && SF.boatBoard() > 0.45;
      var kenmi = !aboardHero && SF.kenmiFoot && SF.kenmiFoot();
      var ringR = kenmi ? 7 : 11;
      SF.drawShadow(ctx, p.x, p.y, aboardHero ? 5 : ringR, aboardHero ? 0 : 1);
      ctx.save();
      ctx.strokeStyle = "rgba(185, 248, 255, 0.9)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y + 1, ringR, ringR * 0.45, 0, 0, Math.PI * 2);
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
      ctx.restore();
    }
  });
  if (SF._tileGroundOn && SF.tileMap && SF.tileRenderer) {
    SF.tileMap.faces.forEach(function (cell) {
      list.push({
        y: cell.sort,
        draw: function (ctx) { SF.tileRenderer.drawCells(ctx, SF.tileMap, [cell]); }
      });
    });
    SF.tileMap.overlay.forEach(function (cell) {
      list.push({
        y: cell.sort,
        draw: function (ctx) { SF.tileRenderer.drawCells(ctx, SF.tileMap, [cell]); }
      });
    });
  }
  if (SF.TERRACES && SF._terrain && !SF._tileGroundOn) {
    SF._terraceList().forEach(function (t) {
      if (!t.block) return;
      list.push({
        y: (SF.terraceSouthLip && (SF.terraceSouthLip(t, t.x), t._southBase)) || (t.y + t.ry + t.block),
        draw: function (ctx) { SF.drawTerraceFront(ctx, t); }
      });
    });
  }
  list.sort(function (a, b) { return a.y - b.y; });
  return list;
};

SF.EntityLayer = {
  list: function (s) { return SF.entityList(s); }
};
