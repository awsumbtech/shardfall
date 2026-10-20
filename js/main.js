"use strict";

var SF = window.SF || {};
window.SF = SF;

SF.boot = function () {
  if (window.Art && Art.wantsGallery && Art.wantsGallery()) {
    Art.openGallery();
    return;
  }
  SF.view = document.getElementById("view");
  SF.map = document.getElementById("minimap");
  SF.ctx = SF.view.getContext("2d", { alpha: false }) || SF.view.getContext("2d");
  SF.buildWorld();
  SF.cacheSprites();
  if (window.Art && Art.preload) Art.preload();
  SF.sfx.loadMute();
  if (SF.loadCalm) SF.loadCalm();
  SF.state = SF.fresh();
  SF.state.mode = "title";
  SF.bindInput();
  SF.bindUI();
  SF.resize();
  window.addEventListener("resize", SF.resize);
  if (window.visualViewport) window.visualViewport.addEventListener("resize", SF.resize);
  window.addEventListener("orientationchange", SF.resize);
  SF.syncUI();
  var last = performance.now();
  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (SF.portraitLock) {
      SF.draw();
      SF.syncUI();
      requestAnimationFrame(frame);
      return;
    }
    SF.update(dt);
    if (SF.feel) {
      try { SF.feel(dt); } catch (err) { /* a sound cue must not stop the frame */ }
    }
    SF._resizeTick = (SF._resizeTick || 0) + 1;
    if (SF._resizeTick % 30 === 0) SF.resize();
    SF.draw();
    SF.syncUI();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  }
};

SF.resizeWrites = 0;

SF.BASE_W = 640;
SF.BASE_H = 360;

SF.resize = function () {
  var canvas = SF.view;
  if (!canvas) return;
  var vv = window.visualViewport;
  var cssW = Math.max(1, Math.round(vv && vv.width ? vv.width : window.innerWidth));
  var cssH = Math.max(1, Math.round(vv && vv.height ? vv.height : window.innerHeight));
  var dpr = Math.min(window.devicePixelRatio || 1, 3);
  var devW = cssW * dpr;
  var devH = cssH * dpr;
  var upright = cssH > cssW * 1.12 && cssW <= 900;
  document.body.dataset.portrait = upright ? "1" : "0";
  SF.portraitLock = upright;
  var scale = Math.max(1, Math.floor(devH / SF.BASE_H));
  if (SF.debugOverview) scale = 1;
  var logicalH = SF.debugOverview ? Math.max(SF.BASE_H, Math.floor(devH)) : SF.BASE_H;
  var logicalW = Math.max(SF.BASE_W, Math.floor(devW / scale));
  if (SF.debugOverview) logicalW = Math.max(SF.BASE_W, Math.floor(devW));
  var cssCanvasW = logicalW * scale / dpr;
  var cssCanvasH = logicalH * scale / dpr;
  var app = document.getElementById("app");
  if (app) {
    app.style.left = Math.round((cssW - cssCanvasW) / 2) + "px";
    app.style.top = Math.round((cssH - cssCanvasH) / 2) + "px";
    app.style.width = cssCanvasW + "px";
    app.style.height = cssCanvasH + "px";
    app.style.right = "auto";
    app.style.bottom = "auto";
  }
  var bw = Math.round(logicalW * scale);
  var bh = Math.round(logicalH * scale);
  if (canvas.width !== bw || canvas.height !== bh) {
    canvas.width = bw;
    canvas.height = bh;
    SF.resizeWrites += 1;
  }
  SF._bw = bw;
  SF._bh = bh;
  SF._cssW = cssW;
  SF._cssH = cssH;
  SF.dpr = scale;
  SF.pixelScale = scale;
  SF.viewW = logicalW;
  SF.viewH = logicalH;
  SF.zoom = 1;
  if (SF.touchPrimary) document.body.dataset.touch = SF.touchPrimary() ? "1" : "0";

  var map = SF.map;
  if (!map || map.clientWidth < 8 || map.clientHeight < 8) return;
  var mw = Math.round(map.clientWidth);
  var mh = Math.round(map.clientHeight);
  var mbw = Math.round(mw * dpr);
  var mbh = Math.round(mh * dpr);
  var mapFirst = !SF._mbw;
  var mapMoved = mapFirst || Math.abs(mbw - SF._mbw) >= 4 || Math.abs(mbh - SF._mbh) >= 4;
  if (mapMoved && (map.width !== mbw || map.height !== mbh)) {
    map.width = mbw;
    map.height = mbh;
    SF._mbw = mbw;
    SF._mbh = mbh;
  }
};

SF.boot();
