"use strict";

// One job: own which scene is active and route between scenes. The scene
// is the existing state.mode string (title, play, cutscene, dialogue,
// voyage, battle, results, pause, fieldmenu, sailmenu, shop, inn, notice,
// hand, chest). Every mode change in js/ goes through go(). draw() picks the
// screen that paints this frame (battle, title, or the field; the voyage
// stays a field layer) and calls that screen's own drawer. notePaint()
// stamps the first frame an overlay was painted, for the press gate.
// The router paints nothing itself and owns no art.
// The constructor is published as a counted SF.SceneRouter assign in
// js/main.js. Game.init creates the one instance as game.scenes.
(function () {
  var SceneRouter = window.SF && window.SF.SceneRouter;
  if (typeof SceneRouter !== "function") {
    throw new Error("SceneRouter constructor missing");
  }

  // How many recent transitions to keep for QA.
  SceneRouter.HISTORY = 16;

  // Overlays whose first paint is stamped. A press that went down before
  // that stamp is not a press on the overlay.
  SceneRouter.PAINT_OVERLAYS = [
    "sailmenu", "dialogue", "shop", "inn", "notice", "hand", "fieldmenu", "chest", "pause"
  ];

  SceneRouter.prototype.init = function () {
    this.game = null;
    this._attached = false;
    this.history = [];
    this.changes = 0;
    // Was SF._paintedOverlay / SF._overlayPaintAt in js/main.js.
    this.paintedKey = null;
    this.paintAt = 0;
    return this;
  };

  // Single attach point. Game.init calls it once with the Game root.
  SceneRouter.prototype.attach = function (game) {
    if (!game || this._attached) return this;
    this.game = game;
    this._attached = true;
    return this;
  };

  SceneRouter.prototype.host = function () {
    if (!this.game) throw new Error("SceneRouter is not attached to the Game root");
    return this.game;
  };

  SceneRouter.prototype.current = function () {
    var s = this.host().state;
    return s ? s.mode : null;
  };

  SceneRouter.prototype.is = function (name) {
    return this.current() === name;
  };

  // The one write of state.mode. target defaults to the live game state;
  // a caller that is building a state before it goes live (a loaded save)
  // passes that state.
  SceneRouter.prototype.go = function (name, target) {
    var s = target || this.host().state;
    if (!s) throw new Error("SceneRouter has no state to route");
    if (typeof name !== "string" || !name) throw new Error("SceneRouter scene must be a name");
    var from = s.mode;
    s.mode = name;
    this.changes += 1;
    this.history.push({ from: from, to: name });
    if (this.history.length > SceneRouter.HISTORY) this.history.shift();
    return name;
  };

  // Which screen paints for this state: "battle", "title", or "field".
  SceneRouter.prototype.screenFor = function (s) {
    var sf = window.SF;
    if (s && s.battle && (s.mode === "battle" || s.mode === "results")) return "battle";
    if (s && s.mode === "title" && sf.drawTitleScene) return "title";
    return "field";
  };

  // Draw the active screen. Each screen keeps its own drawer; the router
  // only picks one. A missing drawer throws instead of painting nothing.
  SceneRouter.prototype.draw = function () {
    var game = this.host();
    var sf = window.SF;
    var s = game.state;
    var screen = this.screenFor(s);
    if (screen === "battle") {
      if (!game.view || !game.ctx) return screen;
      if (typeof sf.drawBattle !== "function") throw new Error("battle drawer missing");
      sf.drawBattle(game.ctx, sf.viewW || 1, sf.viewH || 1, sf.dpr || 1);
      return screen;
    }
    if (screen === "title") {
      if (!game.view || !game.ctx || !s || !sf.blobs) return screen;
      if (!sf.viewW || !sf.viewH) return screen;
      sf.drawTitleScene(game.ctx, sf.viewW, sf.viewH, sf.dpr);
      return screen;
    }
    if (typeof sf.drawField !== "function") throw new Error("field drawer missing");
    sf.drawField();
    return screen;
  };

  // Stamp the moment an overlay is first painted. Returning to the field
  // does not move the stamp, so a Stay click is not thrown out for being
  // older than the play frame. The overlay key itself is kept by the press
  // gate in js/input.js (SF._overlayKey).
  SceneRouter.prototype.notePaint = function () {
    var key = window.SF._overlayKey;
    if (key == null) return this;
    if (key === this.paintedKey) return this;
    var prev = this.paintedKey;
    this.paintedKey = key;
    if (prev == null) return this;
    var mode = String(key).split("|")[0];
    var extra = String(key).indexOf("|") >= 0;
    if (!extra && SceneRouter.PAINT_OVERLAYS.indexOf(mode) < 0) return this;
    this.paintAt = performance.now();
    return this;
  };
})();
