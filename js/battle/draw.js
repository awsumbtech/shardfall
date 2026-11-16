"use strict";

// BattleDraw runs the battle layers in the order the screen has always used. The SceneRouter
// (js/core/scene-router.js, SF.game.scenes) picks this screen while a fight is up.

SF.drawBattle = function (ctx, w, h, dpr) {
  var s = SF.state;
  var b = s && s.battle;
  if (!ctx || !b || !w || !h) return;
  dpr = dpr || 1;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
  SF.Battle.hits = [];
  var game = SF.game;
  var backdrop = game && game.battleBackdrop;
  if (!backdrop) throw new Error("BattleBackdrop missing");
  backdrop.attach(game);
  backdrop.draw(ctx, b.bg, w, h, b.t || 0);
  var foes = b.actors.filter(function (a) { return a.side === "foe"; });
  var party = b.actors.filter(function (a) { return a.side === "party"; });
  var lay = SF.BattleHud.layoutBattle(w, h, b.phase, party.length);
  if (b.phase !== "result") SF.BattleHud.drawStrip(ctx, b, lay.strip.x, lay.strip.y, lay.strip.w, lay.strip.h);
  SF.BattleStage.drawStage(ctx, b, foes, party, lay.stage, w, h, lay.commands || lay.dock || null);
  if (b.phase === "result") {
    SF.BattleHud.drawResult(ctx, b, lay.result);
    return;
  }
  if (lay.card) SF.BattleHud.drawPartyCards(ctx, b, party, lay.card.x, lay.card.y, lay.card.w, lay.card.h);
  if (lay.log) SF.BattleHud.drawLog(ctx, b, lay.log.x, lay.log.y, lay.log.w, lay.log.h);
  if (b.phase === "target" && lay.prompt) SF.BattleHud.drawAimLine(ctx, b, lay.prompt);
  if ((b.phase === "menu" || b.phase === "target") && lay.commands) SF.BattleHud.drawCommands(ctx, b, lay.commands);
  if (b.phase === "skills" && lay.dock) SF.BattleHud.drawSkillList(ctx, b, lay.dock);
  if (b.phase === "items" && lay.dock) SF.BattleHud.drawItemList(ctx, b, lay.dock);
  if (b.phase === "readout") SF.BattleGfx.addHit("skip", 0, 0, w, h);
};

SF.BattleInput.bindBattlePointer();
if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", SF.BattleInput.bindBattlePointer);
}
