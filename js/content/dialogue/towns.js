"use strict";

// Town voices from the approved towns plan. A sample line is the whole part
// when no other line was written. Shop and inn keepers open their counters
// after that line.
(function () {
  var SF = window.SF || {};
  window.SF = SF;
  var nodes = SF.dialogueNodes || {};
  SF.dialogueNodes = nodes;

  function add(node) {
    nodes[node.id] = node;
  }

  function narr(text, portrait) {
    return { text: text, narration: true, portrait: portrait || "sign" };
  }

  add({
    id: "emberhold.pell.larder",
    speaker: "Ina Pell",
    portrait: "pell",
    onEnd: "open_pell",
    lines: ["Tonics are twenty marks. I don't haggle, so don't try."]
  });

  add({
    id: "emberhold.hale.smithy",
    speaker: "Dagan Hale",
    portrait: "hale",
    onEnd: "open_hale",
    lines: ["That blade's good. It'll be better when I'm done with it."]
  });

  add({
    id: "emberhold.sefa.bench",
    speaker: "Old Sefa",
    portrait: "sefa",
    lines: ["I carried shards up that hill for Maren for thirty years. My back says I'm done."]
  });

  add({
    id: "cinderveil.ada.bark",
    speaker: "Ada Fenn",
    portrait: "ada",
    lines: ["It's been a week and nobody's come."]
  });

  add({
    id: "cinderveil.corin.bark",
    speaker: "Corin Fenn",
    portrait: "corin",
    lines: ["Mum says stay in. I've been in for a week."]
  });

  add({
    id: "cinderveil.tobin.bark",
    speaker: "Old Tobin",
    portrait: "tobin",
    lines: ["I rang it eleven times last night."]
  });

  add({
    id: "cinderveil.marta.goods",
    speaker: "Marta Ashcroft",
    portrait: "marta",
    onEnd: "open_ashcroft",
    lines: ["No boats, no stock. Buy it now, there won't be more."]
  });

  add({
    id: "cinderveil.jem.cup",
    speaker: "Jem Rook",
    portrait: "jem",
    onEnd: "open_cinder_cup",
    lines: ["You're my first guest in four days. Take any room you like."]
  });

  add({
    id: "cinderveil.nell.fish",
    speaker: "Nell Garrow",
    portrait: "nell",
    lines: ["Boats won't come in with the lamp out. Hushborn follow them."]
  });

  add({
    id: "inspect.lampfoot_board",
    speaker: "Notice Board",
    portrait: "sign",
    lines: [narr("{quest}")]
  });

  add({
    id: "inspect.shrine_thornwick",
    speaker: "Old Shrine",
    portrait: "stones",
    lines: [narr("A small Lanternwright shrine. A lamp list is carved in the stone, the names of islands that fell, including Thornwick.")]
  });

  add({
    id: "inspect.long_stair",
    speaker: "Long Stair",
    portrait: "ash",
    lines: [narr("Ash on every step, and a child's chalk drawing of the lamp.")]
  });

  add({
    id: "inspect.duty_roster",
    speaker: "Duty Roster",
    portrait: "sign",
    lines: [narr("Ilsa's posted order is nailed beside a duty roster. Most of the names are crossed off.")]
  });

  add({
    id: "inspect.ash_gate",
    speaker: "Ashfields Gate",
    portrait: "sign",
    lines: [narr("The north edge of Upper Town. The Ashfields start on the far side of this gate.")]
  });

  function extraById(id) {
    var list = SF.EXTRAS || [];
    var i;
    for (i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    var islands = SF.ISLANDS || {};
    var key;
    for (key in islands) {
      if (!Object.prototype.hasOwnProperty.call(islands, key)) continue;
      list = islands[key].extras || [];
      for (i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    }
    return null;
  }

  function openExtra(eventName, placeId, kind) {
    SF.onDialogueEvent(eventName, function () {
      var place = extraById(placeId);
      if (!place) return;
      if (kind === "inn" && SF.openInn) SF.openInn(place);
      else if (SF.openShop) SF.openShop(place);
    });
  }

  openExtra("open_pell", "pell-larder", "shop");
  openExtra("open_hale", "hale-smithy", "shop");
  openExtra("open_ashcroft", "lowmoor-shop", "shop");
  openExtra("open_cinder_cup", "quay-bunk", "inn");

  SF.townNode = function (who, s) {
    var f = (s && s.flags) || {};
    if (who === "bram") {
      if (!f.metMaren && !f.lampLit) return "";
      if (f.lampLit && !f.bram_thanked) return "emberhold.dell.after";
      if (f.lampLit) return "emberhold.dell.slept";
      if (!f.met_bram) return "emberhold.dell.intro";
      return "emberhold.dell.boards";
    }
    if (who === "wren") {
      if (!f.metMaren && !f.lampLit) return "";
      if (f.lampLit && f.bram_thanked) return "emberhold.wren.hand";
      if (f.lampLit) return "emberhold.wren.thanks";
      if (!f.met_bram) return "emberhold.dell.intro";
      return "emberhold.wren.hand";
    }
    if (who === "pell") return "emberhold.pell.larder";
    if (who === "hale") return "emberhold.hale.smithy";
    if (who === "sefa") return "emberhold.sefa.bench";
    if (who === "ada") return f.quay_street_seen ? "cinderveil.ada.bark" : "cinderveil.quay.street";
    if (who === "corin") return f.quay_street_seen ? "cinderveil.corin.bark" : "cinderveil.quay.street";
    if (who === "tobin") return f.quay_street_seen ? "cinderveil.tobin.bark" : "cinderveil.quay.street";
    if (who === "marta") return "cinderveil.marta.goods";
    if (who === "jem") return "cinderveil.jem.cup";
    if (who === "nell") return "cinderveil.nell.fish";
    if (who === "cantor_quay") return "cinderveil.cantor.quay";
    return "";
  };

  SF.dialogueRouters = SF.dialogueRouters || [];
  SF.dialogueRouters.push(SF.townNode);

  SF.onTownZone = function (s, zone) {
    if (!s || s.mode !== "play" || !zone || !SF.startDialogue) return;
    var f = s.flags || {};
    if (SF.islandId === "cinderveil" && zone.id === "bell" && f.metCinderKestrel && !f.quay_street_seen) {
      SF.startDialogue("cinderveil.quay.street");
    }
  };
})();
