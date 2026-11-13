"use strict";

// FieldDraw runs the field layers in the order the picture has always used. The paint lives in js/draw/.

SF.draw = function () {
  var game = SF.game;
  var canvas = game && game.view;
  var ctx = game && game.ctx;
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
  ctx.globalCompositeOperation = "source-over";
  ctx.imageSmoothingEnabled = true;
  if (ctx.filter) ctx.filter = "none";
  // A resized canvas drops its gradient. Reusing the old one shifts sky
  // samples by a shade. The stops themselves stay the code-art palette.
  if (SF._skyCanvas !== canvas || SF._skyDpr !== dpr) {
    SF._skyKey = "";
    SF._skyCanvas = canvas;
    SF._skyDpr = dpr;
  }
  if ((s.mode === "voyage" || s.voyageTalk) && SF.drawVoyage) {
    SF.drawVoyage(ctx, w, h, s);
    SF.EffectLayer.vignette(ctx, w, h, s);
    return;
  }
  SF.SkyLayer.draw(ctx, w, h, s);
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
  SF.SkyLayer.clouds(ctx, s);
  SF.TerrainLayer.draw(ctx, s);
  if (SF.SkyLayer && SF.SkyLayer.hush) SF.SkyLayer.hush(ctx);
  if (SF.drawCinderCracks) SF.drawCinderCracks(ctx);
  SF.EntityLayer.list(s).forEach(function (ent) { ent.draw(ctx); });
  SF.EffectLayer.fx(ctx, s);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.globalAlpha = 1;
  ctx.imageSmoothingEnabled = true;
  SF.EffectLayer.vignette(ctx, w, h, s);
  SF.GuideLayer.edge(ctx, w, h, s);
  if (SF.EffectLayer && SF.EffectLayer.wash) SF.EffectLayer.wash(ctx, w, h);
  SF.MapLayer.draw();
};

SF.flushSheets = function () {
  if (SF.draw) SF.draw();
};
