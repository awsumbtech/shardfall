"use strict";

var SF = window.SF || {};
window.SF = SF;

// Stamp the moment an overlay is first painted. A press that went down
// before that stamp is not a press on the overlay. Returning to the field
// does not move the stamp, so a Stay click is not thrown out for being
// older than the play frame.
SF.noteOverlayPaint = function () {
  var key = SF._overlayKey;
  if (key == null) return;
  if (key === SF._paintedOverlay) return;
  var prev = SF._paintedOverlay;
  SF._paintedOverlay = key;
  if (prev == null) return;
  var mode = String(key).split("|")[0];
  var extra = String(key).indexOf("|") >= 0;
  if (!extra && mode !== "sailmenu" && mode !== "dialogue" && mode !== "shop" &&
      mode !== "inn" && mode !== "notice" && mode !== "hand" && mode !== "fieldmenu" &&
      mode !== "chest" && mode !== "pause") return;
  SF._overlayPaintAt = performance.now();
};

// Build the asset registry before the first frame. A missing manifest or
// a failed atlas load leaves every key on the code-drawn art.
SF.prepareAssets = function () {
  if (!SF.AssetRegistry || !SF.SpriteRenderer) return null;
  if (SF.assets && SF.spriteRenderer) return SF.assets;
  var registry = new SF.AssetRegistry(SF.AssetManifest ? new SF.AssetManifest() : null);
  SF.assets = registry;
  SF.spriteRenderer = new SF.SpriteRenderer(registry);
  if (SF.Animator && !SF.animator) SF.animator = new SF.Animator();
  if (SF.prepareTileSet) {
    try { SF.prepareTileSet(); } catch (err) { /* missing tiles keep the code ground */ }
  }
  if (!SF.AssetManifest || typeof SF.AssetManifest.load !== "function") return registry;
  SF.AssetManifest.load(SF.AssetManifest.URL).then(function (loaded) {
    registry.setManifest(loaded || new SF.AssetManifest());
    var paths = loaded && loaded.atlasList ? loaded.atlasList() : [];
    if (!paths.length || !SF.AssetLoader || typeof SF.AssetLoader.images !== "function") return null;
    return SF.AssetLoader.images(paths);
  }).then(function (images) {
    if (images) registry.noteImages(images);
  }).catch(function () {});
  return registry;
};

SF.boot = function () {
  if (window.Art && Art.wantsGallery && Art.wantsGallery()) {
    Art.openGallery();
    return;
  }
  try { SF.prepareAssets(); } catch (err) { /* missing art must not stop boot */ }
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
      if (SF.noteOverlayPaint) SF.noteOverlayPaint();
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
    if (SF.noteOverlayPaint) SF.noteOverlayPaint();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
};

SF.resizeWrites = 0;

SF.BASE_W = 640;
SF.BASE_H = 360;

SF.ASPECT_MIN = 4 / 3;
SF.ASPECT_MAX = 21 / 9;

SF.resize = function () {
  var canvas = SF.view;
  if (!canvas) return;
  var vv = window.visualViewport;
  var cssW = Math.max(1, Math.round(vv && vv.width ? vv.width : window.innerWidth));
  var cssH = Math.max(1, Math.round(vv && vv.height ? vv.height : window.innerHeight));
  var dpr = Math.min(window.devicePixelRatio || 1, 3);
  var upright = cssH > cssW * 1.12 && cssW <= 900;
  document.body.dataset.portrait = upright ? "1" : "0";
  SF.portraitLock = upright;
  var scale = 1;
  var logicalW = cssW;
  var logicalH = cssH;
  if (upright) {
    scale = 1;
    logicalW = cssW;
    logicalH = cssH;
  } else if (SF.debugOverview) {
    scale = 1;
    logicalW = Math.max(SF.BASE_W, cssW);
    logicalH = Math.max(SF.BASE_H, cssH);
  } else if (cssH < SF.BASE_H) {
    scale = cssH / SF.BASE_H;
    if (!(scale > 0)) scale = 1;
    logicalW = Math.max(1, Math.floor(cssW / scale));
    logicalH = Math.max(1, Math.floor(cssH / scale));
  } else {
    scale = Math.max(1, Math.floor(cssH / SF.BASE_H));
    logicalW = Math.max(1, Math.floor(cssW / scale));
    logicalH = Math.max(1, Math.floor(cssH / scale));
  }
  if (!upright && !SF.debugOverview) {
    if (logicalW / logicalH > SF.ASPECT_MAX) logicalW = Math.max(1, Math.floor(logicalH * SF.ASPECT_MAX));
    else if (logicalW / logicalH < SF.ASPECT_MIN) logicalH = Math.max(1, Math.floor(logicalW / SF.ASPECT_MIN));
  }
  var frameW = logicalW * scale;
  var frameH = logicalH * scale;
  var app = document.getElementById("app");
  if (app) {
    app.style.left = Math.round((cssW - frameW) / 2) + "px";
    app.style.top = Math.round((cssH - frameH) / 2) + "px";
    app.style.width = frameW + "px";
    app.style.height = frameH + "px";
    app.style.right = "auto";
    app.style.bottom = "auto";
    app.style.setProperty("--sf-scale", String(scale));
  }
  var chrome = document.getElementById("chrome");
  if (chrome) {
    chrome.style.width = logicalW + "px";
    chrome.style.height = logicalH + "px";
    chrome.dataset.stack = logicalW < 760 ? "1" : "0";
  }
  var back = scale * dpr;
  var bw = Math.max(1, Math.round(logicalW * back));
  var bh = Math.max(1, Math.round(logicalH * back));
  if (canvas.width !== bw || canvas.height !== bh) {
    canvas.width = bw;
    canvas.height = bh;
    SF.resizeWrites += 1;
  }
  SF._bw = bw;
  SF._bh = bh;
  SF._cssW = cssW;
  SF._cssH = cssH;
  SF.dpr = back;
  SF.pixelScale = scale;
  SF.viewW = logicalW;
  SF.viewH = logicalH;
  SF.zoom = 1;
  if (SF.touchPrimary) document.body.dataset.touch = SF.touchPrimary() ? "1" : "0";

  var map = SF.map;
  if (!map) return;
  var mapRect = map.getBoundingClientRect();
  if (mapRect.width < 8 || mapRect.height < 8) return;
  var mbw = Math.max(1, Math.round(mapRect.width * dpr));
  var mbh = Math.max(1, Math.round(mapRect.height * dpr));
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
