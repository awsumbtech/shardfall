"use strict";

(function () {
  var SF = window.SF || {};
  window.SF = SF;
  var nodes = SF.dialogueNodes || {};
  SF.dialogueNodes = nodes;

  function add(node) {
    nodes[node.id] = node;
  }

  function narr(text, portrait) {
    return { text: text, narration: true, portrait: portrait || "hush" };
  }

  add({
    id: "cinderveil.sail.depart",
    speaker: "Kestrel Vane",
    portrait: "kestrel",
    next: "cinderveil.sail.lane",
    lines: [
      "Lines off! Grab the rail and keep a hand on it. One rule on my boat: nobody goes over the side.",
      "I'm Driftborn. When the sky broke, my great-grandparents' island went into the Hush. They were out fishing, so they lived.",
      "We've lived on the wind ever since. Cargo, fishing, never settling anywhere."
    ]
  });

  add({
    id: "cinderveil.sail.lane",
    speaker: "Kestrel Vane",
    portrait: "kestrel",
    next: "cinderveil.sail.sight",
    lines: [
      narr("The skiff slides into a current of moving air. Faint streaks of light run ahead of it.", "ship"),
      "This is a wind lane. Stay in one and you fly. Drift out and you start sinking toward the Hush.",
      "See those lights down there, moving? Hushborn. When a lamp goes out, they rise and follow boats. I lost two friends that way last spring.",
      "That's why I stayed on the dock while the lamp was out. I like being brave. I like being alive more."
    ]
  });

  add({
    id: "cinderveil.sail.sight",
    speaker: "Kestrel Vane",
    portrait: "kestrel",
    next: "cinderveil.kestrel.arrive",
    lines: [
      narr("A grey island rises out of the cloud. Smoke drifts over its ridge. The lamp on top is dark.", "ash"),
      "That's Cinderveil. You can usually see that lamp from an hour out.",
      "Hold on. I'm bringing us in to Lowmoor Quay."
    ]
  });

  add({
    id: "cinderveil.kestrel.arrive",
    speaker: "Kestrel Vane",
    portrait: "kestrel",
    onEnd: "cinder_land",
    lines: [
      narr("Lowmoor Quay. Ash covers everything. The shutters are nailed closed, and the few people outside hurry past with their heads down.", "ash"),
      "This is grim. Last time I was here, there was music on this dock.",
      "Go find Tamsin Reed. She's got a workbench by the warehouse. If anyone knows what's going on, it's her, and she'll tell you all of it.",
      "I'll stay with the *Quickmercy*. People get desperate when the lamp's out, and she's our only way home."
    ]
  });

  add({
    id: "cinderveil.tamsin.cogs_start",
    speaker: "Tamsin Reed",
    portrait: "tamsin",
    onEnd: "quest_cogs_start",
    lines: [
      "Oh! Is that it? Is that the shard? Kestrel said, but I thought she was joking, she jokes a lot. Sorry. Hi. I'm Tamsin.",
      "Okay, idea. I built a grapple line, but nothing I have can power it. A raw shard could. *Your* shard could!",
      "You'd hook onto ledges and pull yourself across gaps. I just need three cogs to finish it. The old mine carts in the Ashfields are full of them, north of the quay."
    ],
    choices: [
      { text: "I'll find them.", next: "cinderveil.tamsin.cogs_yes" },
      { text: "Why would I need a grapple?", next: "cinderveil.tamsin.cogs_why" }
    ]
  });

  add({
    id: "cinderveil.tamsin.cogs_yes",
    speaker: "Tamsin Reed",
    portrait: "tamsin",
    lines: [
      "Yes! Watch out for Hushborn out there. They've gotten really bold. Knocking-on-doors bold."
    ]
  });

  add({
    id: "cinderveil.tamsin.cogs_why",
    speaker: "Tamsin Reed",
    portrait: "tamsin",
    lines: [
      "Because of the Ember Vault! It's the cave under the ridge where the island's core is. The core keeps Cinderveil in the air, and the lamp runs off it.",
      "Something got in there, and the lamp died the same night. The bridge burned too, so a grapple's the only way across."
    ]
  });

  add({
    id: "cinderveil.tamsin.cogs_waiting",
    speaker: "Tamsin Reed",
    portrait: "tamsin",
    lines: [
      "Any luck? No, I can tell. You're not clinking.",
      "Try the tipped-over carts in the Ashfields. The cogs roll out and get buried."
    ]
  });

  add({
    id: "cinderveil.tamsin.grapple_gift",
    speaker: "Tamsin Reed",
    portrait: "tamsin",
    onEnd: "grant_grapple",
    lines: [
      "Three! You got all three! Okay, hold out your hand. This won't hurt. It might tingle. Probably just tingle.",
      narr("Tamsin clamps a small brass reel to your wrist and threads its line into the shard. The shard pulses, and the reel hums.", "tamsin"),
      "Done! Aim at a hook point and the shard does the rest. Just don't let go over the Hush.",
      "Now go show Warden Ilsa. She said nobody goes near the Vault without a way across. Now you've got one."
    ]
  });

  add({
    id: "cinderveil.hesk.rumor",
    speaker: "Brother Hesk",
    portrait: "hesk",
    onEnd: "meet_hesk",
    lines: [
      narr("Behind a stack of crates by the water, a thin man in a torn grey robe flinches when you come close.", "hesk"),
      "Oh! Sorry. Sorry, I thought you were... never mind. Please don't tell anyone I'm here.",
      "I'm H-Hesk. Brother Hesk. I was in the Hollow Choir. I left. They don't really let people leave.",
      "You're the one with the shard, aren't you? Then you should know. The thing in the Ember Vault... the Choir put it there."
    ],
    choices: [
      { text: "Take your time. Tell me everything.", next: "cinderveil.hesk.steady", setFlags: { hesk_mood: "steady" } },
      { text: "Get to the point.", next: "cinderveil.hesk.pressed", setFlags: { hesk_mood: "pressed" } }
    ]
  });

  add({
    id: "cinderveil.hesk.steady",
    speaker: "Brother Hesk",
    portrait: "hesk",
    lines: [
      "Th-thank you. Sorry. It's a Cinder Maw, a huge Hushborn. They lured it up from the Hush with burning shards and led it into the Vault.",
      "It's eating the island's core. That's why the lamp died. When the core's gone, Cinderveil falls.",
      "And it's a test. For you. The Cantor wanted to see what the shard-bearer would do. They knew you'd come.",
      "If you beat it, the Cantor will come to you, and they'll be kind. Please remember I warned you."
    ]
  });

  add({
    id: "cinderveil.hesk.pressed",
    speaker: "Brother Hesk",
    portrait: "hesk",
    lines: [
      "S-sorry! There's a Cinder Maw in the Vault, eating the core. If it finishes, the island falls.",
      "The Choir led it there. That's all. I'm sorry, I can't... please, just go."
    ]
  });

  add({
    id: "cinderveil.ilsa.trial",
    speaker: "Warden Ilsa",
    portrait: "ilsa",
    onEnd: "vault_open",
    lines: [
      narr("On a cliff above a wide chasm, a woman in scarred Lanternwright armor stands guard. The Vault door glows on the far side.", "ilsa"),
      "Halt. Warden Ilsa, Lanternwright Order. That's a grapple. Tamsin's?",
      "Something in the Vault is eating the core. The bridge burned. My orders are to hold this cliff.",
      "I can't cross. You might. Make it over and the Vault is yours. Fall, and nobody comes for you."
    ],
    choices: [
      { text: "Understood.", next: "cinderveil.ilsa.cross" },
      { text: "Hesk says the Choir put the Maw there.", next: "cinderveil.ilsa.hesk", requires: { metHesk: true } },
      { text: "Hesk says it's a test. For me.", next: "cinderveil.ilsa.test", requires: { hesk_mood: "steady" } }
    ]
  });

  add({
    id: "cinderveil.ilsa.cross",
    speaker: "Warden Ilsa",
    portrait: "ilsa",
    lines: [
      "Good. Go."
    ]
  });

  add({
    id: "cinderveil.ilsa.hesk",
    speaker: "Warden Ilsa",
    portrait: "ilsa",
    lines: [
      "The deserter. He told me too, after two days of apologizing. I believe him. It doesn't change the job."
    ]
  });

  add({
    id: "cinderveil.ilsa.test",
    speaker: "Warden Ilsa",
    portrait: "ilsa",
    lines: [
      "Then pass it. Go."
    ]
  });

  add({
    id: "cinderveil.maw.prefight",
    speaker: "Narration",
    portrait: "maw",
    onEnd: "boss_start",
    lines: [
      narr("The Ember Vault. The island's core, a crystal the size of a house, glows a weak orange. Wrapped around it, chewing, is an enormous shape of grey cloud and live embers.", "maw"),
      narr("It turns toward you. A bright point of light pulses in the middle of its chest.", "maw")
    ]
  });

  add({
    id: "cinderveil.maw.defeated",
    speaker: "Narration",
    portrait: "maw",
    lines: [
      narr("The Cinder Maw comes apart into drifting ash. The core is cracked and dim, but whole.", "maw"),
      narr("The shard in your hand pulls toward the ridge above, where the lamp is waiting.", "lamp")
    ]
  });

  add({
    id: "cinderveil.lamp.relit",
    speaker: "Warden Ilsa",
    portrait: "ilsa",
    onEnd: "quest_cinder_lamp_done",
    lines: [
      narr("You press your hand to the cold lamp on the ridge. The shard burns hot, and orange light climbs the glass, then pours out across the island.", "lamp"),
      narr("Down at Lowmoor, lights come on in window after window. The Hush pulls back from the shore.", "lamp"),
      "I watched from the cliff. That was well done. I was wrong about you.",
      "I'm sending word to the Order at Highspire. They'll want to see that hand."
    ]
  });

  add({
    id: "cinderveil.cantor.confront",
    speaker: "The Cantor",
    portrait: "cantor",
    onEnd: "act1_end",
    lines: [
      narr("A figure in a pale mask walks up the ridge path, alone and unhurried. Ilsa reaches for her sword. The Cantor raises both open hands.", "cantor"),
      { text: "Hello again, Wayfarer. You lit Maren's lamp, and now this one. I hoped you would.", requires: { met_cantor: true } },
      { text: "Hello, Wayfarer. I'm the Cantor, of the Hollow Choir. I've wanted to meet you for some time.", unless: { met_cantor: true } },
      "I owe you honesty, so here it is. The Maw was ours. I needed to know if the shard chose you, or just landed on you.",
      "It chose you. The lamps have never answered anyone the way they answer you.",
      "The sky has been dying for a hundred years, one island at a time. Each lamp you light buys a few years of fear. Then it goes out, and the people go down with it.",
      "That shard is the last of the Heartshard. With it, we could let the sky come down all at once, gently, and let the world start over.",
      "I won't take it from you. Give it to me, or better yet, come with us. What do you say?"
    ],
    choices: [
      { text: "Just go. Leave Cinderveil alone.", next: "cinderveil.cantor.spare", setFlags: { cantor_choice: "spare" } },
      { text: "Tell me the rest.", next: "cinderveil.cantor.listen", setFlags: { cantor_choice: "listen" } },
      { text: "No. I'm keeping the lamps lit.", next: "cinderveil.cantor.refuse", setFlags: { cantor_choice: "refuse" } }
    ]
  });

  add({
    id: "cinderveil.cantor.spare",
    speaker: "The Cantor",
    portrait: "cantor",
    next: "cinderveil.cantor.leave",
    lines: [
      "That's fair. You've had a long day, and I've given you a lot to think about.",
      "The Choir will leave Cinderveil alone. You have my word. When you're ready to talk, we'll find you."
    ]
  });

  add({
    id: "cinderveil.cantor.listen",
    speaker: "The Cantor",
    portrait: "cantor",
    next: "cinderveil.cantor.leave",
    lines: [
      "Thank you. Most people have stopped me by now.",
      "Ask yourself why this lamp failed so fast. The lamps draw on the island cores, and every core is running down. The Maw only sped this one up.",
      "Saltmere's core is nearly spent. Its lamp will go dark before the next full moon, and I won't have to lift a finger. Go and see for yourself.",
      "When you've watched a whole island fall, come and find me. I think you'll understand then."
    ]
  });

  add({
    id: "cinderveil.cantor.refuse",
    speaker: "The Cantor",
    portrait: "cantor",
    next: "cinderveil.cantor.leave",
    lines: [
      "I'm sorry to hear that. I mean it.",
      "Then I'll stop asking. Wherever you go, the Choir will be there, and sooner or later that shard comes with us.",
      "Goodbye, Wayfarer. Light as many lamps as you like."
    ]
  });

  add({
    id: "cinderveil.cantor.leave",
    speaker: "Narration",
    portrait: "cantor",
    onEnd: "act1_end",
    lines: [
      narr("The Cantor then walks down the path and is gone.", "cantor")
    ]
  });

  add({
    id: "cinderveil.kestrel.epilogue_spare",
    speaker: "Kestrel Vane",
    portrait: "kestrel",
    next: "cinderveil.act1.finale",
    onEnd: "epilogue_done",
    lines: [
      narr("Back at Lowmoor Quay, Kestrel is waiting at the gangplank.", "ship"),
      "Ilsa told me. You just let them walk off? Your call, mate. I'll be sleeping with one eye open.",
      "She says the Lanternwrights want you at Highspire. Good news is they pay. Let's go."
    ]
  });

  add({
    id: "cinderveil.kestrel.epilogue_listen",
    speaker: "Kestrel Vane",
    portrait: "kestrel",
    next: "cinderveil.act1.finale",
    onEnd: "epilogue_done",
    lines: [
      narr("Back at Lowmoor Quay, Kestrel is waiting at the gangplank.", "ship"),
      "Saltmere? I've got friends on Saltmere. If that mask is right about the full moon, we haven't got long.",
      "Highspire first. The Lanternwrights are the only ones who can tell us if it's true. Get aboard."
    ]
  });

  add({
    id: "cinderveil.kestrel.epilogue_refuse",
    speaker: "Kestrel Vane",
    portrait: "kestrel",
    next: "cinderveil.act1.finale",
    onEnd: "epilogue_done",
    lines: [
      narr("Back at Lowmoor Quay, Kestrel is waiting at the gangplank.", "ship"),
      "You told the Cantor no, to their face? Bravest thing I've seen all year. Maybe also the dumbest.",
      "Ilsa says the Order wants you at Highspire. Let's get there before the Choir does."
    ]
  });

  add({
    id: "cinderveil.act1.finale",
    speaker: "Narration",
    portrait: "ship",
    lines: [
      narr("The *Quickmercy* pulls away from the quay. Behind it, Cinderveil's lamp burns orange. Ahead lies Highspire, and the last of the Lanternwrights. End of Act 1.", "ship")
    ]
  });

  add({
    id: "bark.tamsin.bench",
    speaker: "Tamsin Reed",
    portrait: "tamsin",
    lines: [
      "Don't touch the tea! There's a bolt soaking in it. It's a long story. It's actually a short story."
    ]
  });

  add({
    id: "bark.hesk.crate",
    speaker: "Brother Hesk",
    portrait: "hesk",
    lines: [
      "I'm not hiding. I'm... yes, I'm hiding. Sorry."
    ]
  });

  add({
    id: "bark.ilsa.no_grapple",
    speaker: "Warden Ilsa",
    portrait: "ilsa",
    lines: [
      "No way across, no crossing. Come back when you can reach the far side."
    ]
  });

  add({
    id: "inspect.lowmoor_sign",
    speaker: "Quay Sign",
    portrait: "sign",
    lines: [
      "LOWMOOR QUAY. Chalked underneath: LAMP OUT. STAY INSIDE AFTER DARK."
    ]
  });

  add({
    id: "inspect.tamsin_bench",
    speaker: "Tamsin's Bench",
    portrait: "crate",
    lines: [
      "Springs, wire, half-built gadgets, and a cold cup of tea. A note on the vise says NEED 3 COGS!!!"
    ]
  });

  add({
    id: "inspect.ash_cog",
    speaker: "Cog",
    portrait: "ash",
    lines: [
      "A brass cog half-buried in ash, still in good shape. Tamsin will want this."
    ]
  });

  add({
    id: "inspect.vault_seal",
    speaker: "Vault Door",
    portrait: "vault",
    lines: [
      "A heavy iron door stamped with the Lanternwright crest. It's warm to the touch."
    ]
  });

  add({
    id: "inspect.cinder_core",
    speaker: "Cinderveil's Core",
    portrait: "core",
    lines: [
      "The crystal that holds the island up. Deep bite marks run across its surface."
    ]
  });

  add({
    id: "inspect.cinder_lamp",
    speaker: "Cinderveil's Lamp",
    portrait: "lamp",
    lines: [
      "Cinderveil's lamp. The glass is cold and dark."
    ]
  });

  add({
    id: "inspect.maw_tooth",
    speaker: "Maw Tooth",
    portrait: "maw",
    lines: [
      "A tooth as long as your arm, made of hardened ash. It crumbles when you touch it."
    ]
  });

  add({
    id: "inspect.choir_crate",
    speaker: "Hesk's Hideout",
    portrait: "crate",
    lines: [
      "A blanket, half a loaf of bread, and a stack of Choir pamphlets. The top one reads: LET THE SKY FALL. LET THE WORLD BEGIN AGAIN."
    ]
  });

  add({
    id: "inspect.ilsa_order",
    speaker: "Posted Order",
    portrait: "sign",
    lines: [
      "THE EMBER VAULT IS CLOSED BY ORDER OF THE LANTERNWRIGHTS. NO EXCEPTIONS. —WARDEN ILSA"
    ]
  });

  add({
    id: "inspect.quay_bell",
    speaker: "Quay Bell",
    portrait: "bell",
    lines: [
      "The town's warning bell. The rope is frayed from being rung so often."
    ]
  });

  add({
    id: "inspect.ember_path",
    speaker: "Path Lamps",
    portrait: "lamp",
    lines: [
      "A row of small lamps leading up the ridge, all dark."
    ]
  });
})();
