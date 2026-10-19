"use strict";

var SF = window.SF || {};
window.SF = SF;

SF.boot = function () {
  SF.reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  SF.view = document.getElementById("view");
  SF.map = document.getElementById("minimap");
  SF.ctx = SF.view.getContext("2d", { alpha: false, desynchronized: true }) || SF.view.getContext("2d");
  SF.buildWorld();
  SF.cacheSprites();
  SF.sfx.loadMute();
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
    SF.resize();
    SF.draw();
    SF.syncUI();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
};

SF.resize = function () {
  var canvas = SF.view;
  if (!canvas) return;
  var rect = canvas.getBoundingClientRect();
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var w = Math.max(1, Math.round(rect.width));
  var h = Math.max(1, Math.round(rect.height));
  var bw = Math.round(w * dpr);
  var bh = Math.round(h * dpr);
  SF.dpr = dpr;
  SF.viewW = w;
  SF.viewH = h;
  if (canvas.width !== bw || canvas.height !== bh) {
    canvas.width = bw;
    canvas.height = bh;
  }
  var map = SF.map;
  if (map) {
    var mw = Math.max(1, Math.round(map.clientWidth || 108));
    var mh = Math.max(1, Math.round(map.clientHeight || 108));
    var mbw = Math.round(mw * dpr);
    var mbh = Math.round(mh * dpr);
    if (map.width !== mbw || map.height !== mbh) {
      map.width = mbw;
      map.height = mbh;
    }
  }
};

SF.boot();
