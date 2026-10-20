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
    id: "emberhold.wake",
    speaker: "Narration",
    portrait: "stones",
    lines: [
      narr("Dusk. You wake in a ring of standing stones with no memory of your name. A sliver of glowing blue crystal has grown into your right palm.", "stones"),
      narr("Down the hill, smoke rises from a cottage chimney. Up on the ridge, a great lamp flickers weakly.", "lamp")
    ]
  });

  add({
    id: "emberhold.maren.intro",
    speaker: "Old Maren",
    portrait: "maren",
    onEnd: "meet_maren",
    lines: [
      "Oh, you're up. You've been lying out on those stones since yesterday. I'm Maren.",
      "Do you know your name? No? That's all right. I'll call you Wayfarer till it comes back to you.",
      "Let me see that hand. I've handled sky-shards all my life, and I've never seen one grow into a person.",
      "Now, the lamp up the hill keeps the Hush off this island, and it's nearly out. The Hushborn are already coming up past the Scar at night.",
      narr("Maren points up the hill. The camera pans to the lamp on the ridge. The shard in your palm flares bright, and the lamp flickers brighter for a moment in answer. The camera pans back. Your palm keeps tingling, and you can tell which way other shards are.", "lamp"),
      "Did you see that? The lamp brightened when your hand did.",
      "It needs five sky-shards. My knees won't get me out to where they fall anymore. Will you find them and set them in the lamp?"
    ],
    choices: [
      { text: "What's the Hush?", next: "emberhold.maren.ask_hush", setFlags: { asked_maren: "hush" } },
      { text: "What is this thing in my hand?", next: "emberhold.maren.ask_hand", setFlags: { asked_maren: "hand" } },
      { text: "I'll get them.", next: "emberhold.maren.intro_go" }
    ]
  });

  add({
    id: "emberhold.maren.ask_hush",
    speaker: "Old Maren",
    portrait: "maren",
    next: "emberhold.maren.intro_go",
    lines: [
      "The cloud sea under the islands. A hundred years ago the Heartshard cracked, the sky broke apart, and everything underneath went into the Hush.",
      "Whatever falls in comes back as Hushborn, made of cloud and hunger. A lit lamp is the only thing they won't cross."
    ]
  });

  add({
    id: "emberhold.maren.ask_hand",
    speaker: "Old Maren",
    portrait: "maren",
    next: "emberhold.maren.intro_go",
    lines: [
      "I wish I knew. It looks like a sky-shard, but it's brighter than any I've held.",
      "While you were asleep, the lamp flared every time your hand twitched. Whatever that is, the lamp knows it."
    ]
  });

  add({
    id: "emberhold.maren.intro_go",
    speaker: "Old Maren",
    portrait: "maren",
    lines: [
      "Shards glow, so they're easy to spot. Some Hushborn carry them too. Hit the bright spot in the middle and they'll drop them.",
      "Where the path's broken, run and jump. Folk holding a shard can leap farther than they should, and yours is part of you.",
      "If you get hurt, come back and I'll patch you up. And say hello to Kestrel at the dock."
    ]
  });

  add({
    id: "emberhold.maren.waiting",
    speaker: "Old Maren",
    portrait: "maren",
    onEnd: "maren_mend",
    lines: [
      "There you are. Sit and let me look at you. You've got {shards} so far, and the lamp needs five.",
      "If the hill's picked clean, try the far side of the broken span, east of the lamp. Be careful out there."
    ]
  });

  add({
    id: "emberhold.maren.lamp_lit",
    speaker: "Old Maren",
    portrait: "maren",
    onEnd: "quest_lamp_done",
    lines: [
      narr("Maren has climbed the hill. She's out of breath, looking from the lamp to you and back.", "maren"),
      "I saw that from the garden. Shards don't do that. That lamp hasn't burned so bright since I was a girl.",
      "Your hand lit up before the lamp did. I don't know what you are, love, but I'm glad you came.",
      { text: "You asked me about the Hush. Look, it's pulling back from the cliffs. That's your doing.", requires: { asked_maren: "hush" } },
      { text: "You asked what that shard was. I still can't tell you. But I think the lamps could.", requires: { asked_maren: "hand" } },
      "There's something else. Cinderveil's lamp, out west, went dark a week ago. No one's heard a word from them since.",
      "The Lanternwrights there would never let it go out. Something's wrong. Kestrel can take you."
    ]
  });

  add({
    id: "emberhold.kestrel.span",
    speaker: "Kestrel Vane",
    portrait: "kestrel",
    onEnd: "kestrel_hint",
    lines: [
      narr("Vane's Perch, a small dock at the island's edge. A woman in flight goggles is hammering a patch onto a little skiff that's mostly patches already.", "ship"),
      "Hey, it's the sleeper! Kestrel Vane. And this beauty's the *Quickmercy*, fastest skiff on the wind. Ignore the patches.",
      "Yes, a sailor sitting on a dock. With the lamp this low, Hushborn come up into the wind lanes. I'm not taking her out till it's lit.",
      "Maren's got you hunting shards? East of the lamp, the old stone span's broken. Too far to jump on foot, but I hear that hand does tricks.",
      "On the far side, check behind the standing stones. Shards pile up back there, out of the wind."
    ],
    choices: [
      { text: "Come with me.", next: "emberhold.kestrel.span_no" },
      { text: "What's in it for you?", next: "emberhold.kestrel.span_pay" }
    ]
  });

  add({
    id: "emberhold.kestrel.span_no",
    speaker: "Kestrel Vane",
    portrait: "kestrel",
    lines: [
      "Me, on foot? No thanks, mate. Light that lamp and I'll take you anywhere the wind goes."
    ]
  });

  add({
    id: "emberhold.kestrel.span_pay",
    speaker: "Kestrel Vane",
    portrait: "kestrel",
    lines: [
      "Honestly? No lamp, no sailing. No sailing, no paying work. You light it, I eat this month."
    ]
  });

  add({
    id: "emberhold.kestrel.dark",
    speaker: "Kestrel Vane",
    portrait: "kestrel",
    lines: [
      "Still dark up there. The span's east of the lamp. Get a running start and dash right at the edge.",
      "And check behind those stones."
    ]
  });

  add({
    id: "emberhold.cantor.intro",
    speaker: "The Cantor",
    portrait: "cantor",
    onEnd: "meet_cantor",
    lines: [
      narr("Whisper Hollow, a misty dip in the hills. A tall figure in a pale mask and gold-trimmed robes sits on a rock, as if they've been expecting you.", "cantor"),
      "Hello. Please don't be alarmed. I'm called the Cantor, and I lead the Hollow Choir. You may hear unkind things about us.",
      "May I see your hand? Remarkable. That's a piece of the Heartshard, you know. The very thing that broke the sky.",
      "Maren will tell you the lamps are saving us. Ask her how many islands have fallen in her lifetime, lamps and all."
    ],
    choices: [
      { text: "What does the Choir want?", next: "emberhold.cantor.want" },
      { text: "Stay away from Maren.", next: "emberhold.cantor.warn" }
    ]
  });

  add({
    id: "emberhold.cantor.want",
    speaker: "The Cantor",
    portrait: "cantor",
    lines: [
      "For the suffering to stop. The sky has been falling for a hundred years. We'd like it to finish, so the world can begin again.",
      "Light her lamp. I won't stop you. Just keep an open mind."
    ]
  });

  add({
    id: "emberhold.cantor.warn",
    speaker: "The Cantor",
    portrait: "cantor",
    lines: [
      "Of course. I have nothing against her. She's a good woman, doing her best with what she was taught."
    ]
  });

  add({
    id: "emberhold.cantor.again",
    speaker: "The Cantor",
    portrait: "cantor",
    lines: [
      "Hello again. Did you ask Maren about the fallen islands?",
      "She'll know the number. She's watched them go out from that hill. I'll be here if you want to talk."
    ]
  });

  add({
    id: "emberhold.kestrel.offer_sail",
    speaker: "Kestrel Vane",
    portrait: "kestrel",
    onEnd: "open_sail_menu",
    lines: [
      "You did it! I saw that from down here. Looked like a second sunrise.",
      "Maren tell you about Cinderveil? I run cargo there. A week dark means they're in real trouble.",
      "I'll take you. Free this trip, since you lit my lamp. After that I charge like anybody else."
    ],
    choices: [
      { text: "Let's go.", next: "emberhold.kestrel.sail_yes", setFlags: { sail_answer: "yes" } },
      { text: "What's waiting for us there?", next: "emberhold.kestrel.sail_what", setFlags: { sail_answer: "ask" } },
      { text: "I met someone in a mask, in Whisper Hollow.", next: "emberhold.kestrel.sail_cantor", setFlags: { sail_answer: "cantor" }, requires: { met_cantor: true } }
    ]
  });

  add({
    id: "emberhold.kestrel.sail_yes",
    speaker: "Kestrel Vane",
    portrait: "kestrel",
    lines: [
      "That's what I like to hear. Climb aboard when you're ready."
    ]
  });

  add({
    id: "emberhold.kestrel.sail_what",
    speaker: "Kestrel Vane",
    portrait: "kestrel",
    lines: [
      "Cinderveil's a mining island. Ash on everything. Lowmoor Quay's the town: good people, awful tea.",
      "With the lamp out, there'll be Hushborn on the ridge. Bring that hand."
    ]
  });

  add({
    id: "emberhold.kestrel.sail_cantor",
    speaker: "Kestrel Vane",
    portrait: "kestrel",
    lines: [
      "Gold trim? Very polite? That's the Cantor. They lead the Hollow Choir. Half the Driftborn won't dock anywhere they've been.",
      "They want the sky to finish falling. Whatever they told you, don't buy it."
    ]
  });

  add({
    id: "emberhold.kestrel.docked",
    speaker: "Kestrel Vane",
    portrait: "kestrel",
    onEnd: "open_sail_menu",
    lines: [
      "Ready? Cinderveil's half a day west. Just say the word.",
      { text: "Still ash, still Hushborn, still awful tea. Nothing's changed.", requires: { sail_answer: "ask" } },
      { text: "And if that mask turns up again, walk the other way.", requires: { sail_answer: "cantor" } }
    ]
  });

  add({
    id: "bark.maren.scar",
    speaker: "Old Maren",
    portrait: "maren",
    lines: [
      "Stay away from the Scar after dark. That's where they climb up."
    ]
  });

  add({
    id: "inspect.waking_stones",
    speaker: "Waking Stones",
    portrait: "stones",
    lines: [
      "A ring of old standing stones. The grass in the middle is flattened in the shape of a person. That was you."
    ]
  });

  add({
    id: "inspect.scar",
    speaker: "The Scar",
    portrait: "scar",
    lines: [
      "A long tear in the meadow where the ground drops into the Hush. A sign reads: KEEP BACK AFTER DARK. —M."
    ]
  });

  add({
    id: "inspect.quickmercy",
    speaker: "The Quickmercy",
    portrait: "ship",
    lines: [
      "The name is hand-painted on the bow, and the paint is fresh. There are more patches than original wood."
    ]
  });

  add({
    id: "inspect.lamp_cold",
    speaker: "Great Lamp",
    portrait: "lamp",
    lines: [
      "Emberhold's lamp. The glass is cold, and the light inside barely flickers. The plinth has five empty sockets."
    ]
  });

  add({
    id: "inspect.lamp_hungry",
    speaker: "Great Lamp",
    portrait: "lamp",
    lines: [
      "The light brightens a little as your hand comes near. You have {shards} of 5 shards."
    ]
  });

  add({
    id: "inspect.lamp_lit",
    speaker: "Great Lamp",
    portrait: "lamp",
    lines: [
      "A steady gold light. The mist has backed away from the cliffs."
    ]
  });

  add({
    id: "inspect.wrong_sky",
    speaker: "Standing Stones",
    portrait: "stones",
    lines: [
      "A row of stones, all facing the lamp. Dirt and leaves have piled up behind them, out of the wind."
    ]
  });

  add({
    id: "inspect.heartblossom",
    speaker: "Heartblossom",
    portrait: "blossom",
    lines: [
      "A small red flower that only grows near lamps. Maren uses it for burns."
    ]
  });

  add({
    id: "inspect.rope_bridge",
    speaker: "Rope Bridge",
    portrait: "bridge",
    lines: [
      "A sign reads: ONE AT A TIME. Someone has scratched underneath: OR NONE."
    ]
  });

  add({
    id: "inspect.span_planks",
    speaker: "Broken Span",
    portrait: "bridge",
    lines: [
      "What's left of the old stone span. The gap is too wide to cross on foot."
    ]
  });

  add({
    id: "inspect.sail_patch",
    speaker: "Sail Patch",
    portrait: "ship",
    lines: [
      "A bright yellow patch, neatly stitched. Along the seam: K.V. FIXED THIS. DON'T TOUCH."
    ]
  });

  SF.emberholdNode = function (who, s) {
    var f = (s && s.flags) || {};
    if (who === "maren") {
      if (f.lampLit) return "emberhold.maren.lamp_lit";
      if (!f.metMaren) return "emberhold.maren.intro";
      return "emberhold.maren.waiting";
    }
    if (who === "kestrel") {
      if (f.lampLit && !f.kestrelAfter) return "emberhold.kestrel.offer_sail";
      if (f.lampLit) return "emberhold.kestrel.docked";
      if (!f.kestrelHint) return "emberhold.kestrel.span";
      return "emberhold.kestrel.dark";
    }
    if (who === "cantor") {
      if (!f.met_cantor) return "emberhold.cantor.intro";
      return "emberhold.cantor.again";
    }
    return "";
  };

  SF.dialogueRouters = SF.dialogueRouters || [];
  SF.dialogueRouters.push(SF.emberholdNode);

  SF.emberholdLampNode = function (s) {
    var f = (s && s.flags) || {};
    if (f.lampLit) return "inspect.lamp_lit";
    if (s && s.quest === "awaken") return "inspect.lamp_cold";
    return "inspect.lamp_hungry";
  };
})();
