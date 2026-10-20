"use strict";

(function () {
  var SF = window.SF || {};
  window.SF = SF;
  var nodes = SF.dialogueNodes || {};
  SF.dialogueNodes = nodes;

  // One placeholder line each. STORY replaces these. No other spoken lines.
  function pending(id, speaker, portrait) {
    nodes[id] = {
      id: id,
      speaker: speaker,
      portrait: portrait,
      lines: ["(Script pending)"]
    };
  }

  pending("saltmere.harbormaster", "Brenna Holt", "brenna");
  pending("saltmere.innkeeper", "Osric Pell", "osric");
  pending("saltmere.shopkeeper", "Nessa Quinn", "nessa");
  pending("saltmere.sera", "Sera Dunne", "sera");
  pending("saltmere.kids", "Pip and Lark", "pip_lark");
  pending("saltmere.jory", "Jory Hale", "jory");
  pending("highspire.captain", "Warden Brant", "brant");
  pending("highspire.shopkeeper", "Dorrie Fen", "dorrie");
  pending("highspire.innkeeper", "Maud Keel", "maud");
  pending("highspire.ellis", "Ellis Ward", "ellis");
  pending("driftmarket.voss", "Sile Voss", "sile");
})();
