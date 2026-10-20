"use strict";

(function () {
  var SF = window.SF || {};
  window.SF = SF;
  var nodes = SF.dialogueNodes || {};
  SF.dialogueNodes = nodes;

  // One placeholder line each. STORY replaces these. No other spoken lines.
  function pending(id, speaker) {
    nodes[id] = {
      id: id,
      speaker: speaker,
      lines: ["(Script pending)"]
    };
  }

  pending("saltmere.harbormaster", "Brenna Holt");
  pending("saltmere.innkeeper", "Osric Pell");
  pending("saltmere.shopkeeper", "Nessa Quinn");
  pending("saltmere.sera", "Sera Dunne");
  pending("saltmere.kids", "Pip and Lark");
  pending("saltmere.jory", "Jory Hale");
  pending("highspire.captain", "Warden Brant");
  pending("highspire.shopkeeper", "Dorrie Fen");
  pending("highspire.innkeeper", "Maud Keel");
  pending("highspire.ellis", "Ellis Ward");
  pending("driftmarket.voss", "Sile Voss");
})();
