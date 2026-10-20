"use strict";

var SF = window.SF || {};
window.SF = SF;

SF.boot = function () {
  SF.view = document.getElementById("view");
  SF.map = document.getElementById("minimap");
  SF.ctx = SF.view.getContext("2d", { alpha: false }) || SF.view.getContext("2d");
  SF.buildWorld();
  SF.cacheSprites();
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
};

SF.resizeWrites = 0;

SF.resize = function () {
  var canvas = SF.view;
  if (!canvas) return;
  var rect = canvas.getBoundingClientRect();
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var w = Math.max(1, Math.round(rect.width));
  var h = Math.max(1, Math.round(rect.height));
  var bw = Math.round(w * dpr);
  var bh = Math.round(h * dpr);
  var first = !SF._cssW;
  var cssMoved = first || Math.abs(w - SF._cssW) >= 2 || Math.abs(h - SF._cssH) >= 2;
  var bufMoved = first || Math.abs(bw - SF._bw) >= 4 || Math.abs(bh - SF._bh) >= 4;
  if (cssMoved || bufMoved) {
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
      SF.resizeWrites += 1;
    }
    SF._bw = bw;
    SF._bh = bh;
    SF._cssW = w;
    SF._cssH = h;
  }
  SF.dpr = dpr;
  SF.viewW = SF._cssW || w;
  SF.viewH = SF._cssH || h;

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
