"use strict";

// DrawDeps is how field painters, the battle screen, and the world layer reach
// art and audio. Those modules publish Art, SF.Sfx, and SF.Music.
// Kept window hook: data.js still publishes window.SF for the QA tools
// (field-qa, menu-fit, smoke, and the other browser checks). This file does not.

SF.DrawDeps = {
  art: function () {
    return typeof Art !== "undefined" ? Art : null;
  },
  sfx: function () {
    return SF.Sfx || null;
  },
  music: function () {
    return SF.Music || null;
  }
};
