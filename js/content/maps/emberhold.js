"use strict";

var SF = window.SF || {};
window.SF = SF;

// Emberhold growth: a named orchard already inside the meadow, chests, a hearth.
// Pushed onto the live pack arrays so the v0.2 layout stays put.
(function () {
  var pack = SF.ISLANDS.emberhold;

  pack.walk.circles.push({
    id: "orchard",
    name: "The Orchard",
    group: "ember",
    x: -90,
    y: -80,
    r: 54
  });

  pack.paths.push([-20, 10, -90, -40, -90, -80]);

  pack.extras.push(
    {
      id: "chest-orchard",
      kind: "chest",
      name: "chest",
      x: -90,
      y: -90,
      items: [
        { id: "tonic", n: 1 },
        { id: "cloth_wrap", n: 1 },
        { id: "knife", n: 1 }
      ],
      marks: 20
    },
    {
      id: "chest-meadow",
      kind: "chest",
      name: "chest",
      x: 40,
      y: -70,
      items: [{ id: "ether", n: 1 }]
    },
    {
      id: "chest-perch",
      kind: "chest",
      name: "chest",
      x: 70,
      y: 530,
      items: [{ id: "smoke_bomb", n: 1 }]
    },
    {
      id: "ember-hearth",
      kind: "inn",
      name: "Maren's hearth",
      x: 100,
      y: -130,
      title: "Maren's hearth",
      blurb: "Rest here? Heart returns to full, and the journey is saved."
    }
  );

  pack.props.push(
    { kind: "hut", x: -110, y: -100, s: 0.8 },
    { kind: "flower", x: -70, y: -60, c: "#ffd0e8" }
  );

  var bg = {
    "wisp-meadow": ["em_wisps", "emberhold_meadow"],
    "wisp-grove": ["em_wisps", "emberhold_meadow"],
    "wisp-dock": ["em_wisps", "emberhold_meadow"],
    "brume-scar": ["em_brumekin", "emberhold_scar"],
    "brume-span": ["em_brumekin", "emberhold_scar"],
    "choir-cinder": ["em_choirling", "emberhold_meadow"]
  };
  pack.spawns.forEach(function (sp) {
    if (!bg[sp.id]) return;
    sp.encounter = bg[sp.id][0];
    sp.bg = bg[sp.id][1];
  });
})();
