"use strict";

var SF = window.SF || {};
window.SF = SF;

(function () {
  var pack = SF.ISLANDS.cinderveil;

  pack.walk.circles.push({
    id: "market",
    name: "Lowmoor Market",
    group: "quay",
    x: 90,
    y: 55,
    r: 48
  });

  pack.paths.push([20, 40, 90, 55]);

  pack.extras.push(
    {
      id: "lowmoor-shop",
      kind: "shop",
      name: "Lowmoor shop",
      title: "Lowmoor shop",
      x: 100,
      y: 60,
      stock: [
        { id: "tonic" },
        { id: "ether" },
        { id: "ember_salt" },
        { id: "smoke_bomb" },
        { id: "coil_tool" },
        { id: "ember_knife" },
        { id: "ash_coat" }
      ]
    },
    {
      id: "quay-bunk",
      kind: "inn",
      name: "the quay bunk",
      title: "Quay bunk",
      x: -50,
      y: 40,
      blurb: "Rest here? Heart returns to full, and the journey is saved."
    },
    {
      id: "chest-ash",
      kind: "chest",
      name: "chest",
      x: 330,
      y: 80,
      items: [{ id: "hi_tonic", n: 1 }]
    },
    {
      id: "chest-vault",
      kind: "chest",
      name: "chest",
      x: 980,
      y: -40,
      items: [
        { id: "phoenix_shard", n: 1 },
        { id: "quay_coat", n: 1 }
      ]
    }
  );

  pack.props.push(
    { kind: "stall", x: 108, y: 48 },
    { kind: "hut", x: -70, y: 20, s: 0.85 }
  );

  var bg = {
    "ashmite-west": ["cv_ashlings", "cinderveil_ash"],
    "ashmite-north": ["cv_ashlings", "cinderveil_ash"],
    "soot-east": ["cv_mixed", "cinderveil_ash"],
    "brute-cog": ["cv_cinderhound", "cinderveil_ash"],
    "brute-yard": ["cv_mixed", "ember_vault"],
    maw: ["boss_cinder_maw", "ember_vault"]
  };
  pack.spawns.forEach(function (sp) {
    if (!bg[sp.id]) return;
    sp.encounter = bg[sp.id][0];
    sp.bg = bg[sp.id][1];
    if (sp.id === "maw") sp.boss = true;
  });
})();
