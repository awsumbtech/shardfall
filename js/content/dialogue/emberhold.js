"use strict";

(function () {
  var SF = window.SF || {};
  window.SF = SF;
  var nodes = SF.dialogueNodes || {};
  SF.dialogueNodes = nodes;

  function add(node) {
    nodes[node.id] = node;
  }

  add({
    id: "emberhold.wake",
    speaker: "The Waking Stones",
    portrait: "stones",
    lines: [
      "You wake with grass in your teeth and a star clenched in your hand.",
      "The stone is older than the crack. The words cut into it are not: the lamp is up the hill."
    ]
  });

  add({
    id: "emberhold.maren.intro",
    speaker: "Old Maren",
    portrait: "maren",
    onEnd: "meet_maren",
    lines: [
      "You're awake. Good. I had a bet with the kettle, and I hate losing to a kettle.",
      "I am Maren. I keep the lamp up this hill. The lamp keeps the Hush off the grass.",
      "Dash the gaps you cannot walk. Strike the bright core in a thing of mist.",
      "Five sky-shards wake the lamp. Set them on the plinth yourself — I will not take them from your hand.",
      "If you tear, come talk. I mend. That is the whole of my magic."
    ],
    choices: [
      { text: "What is the Hush, really?", next: "emberhold.maren.ask_hush", setFlags: { asked_maren: "hush" } },
      { text: "Why is this in my hand?", next: "emberhold.maren.ask_hand", setFlags: { asked_maren: "hand" } },
      { text: "I'll find the shards.", next: "emberhold.maren.intro_go" }
    ]
  });

  add({
    id: "emberhold.maren.ask_hush",
    speaker: "Old Maren",
    portrait: "maren",
    lines: [
      "A tide with a memory. It wants the sky to finish breaking, and the grass has voted no.",
      "We do not win forever. We light lamps. Go find five shards. The grass is waiting on you, not on a speech."
    ]
  });

  add({
    id: "emberhold.maren.ask_hand",
    speaker: "Old Maren",
    portrait: "maren",
    lines: [
      "It fused when you woke. I did not put it there. If the lamp did, it has not confessed.",
      "Treat it like a tool that chose you. Tools still need a person. You will do."
    ]
  });

  add({
    id: "emberhold.maren.intro_go",
    speaker: "Old Maren",
    portrait: "maren",
    lines: [
      "Good. The lamp is up the hill. The dock is down. Bring me your opinions if you start leaking."
    ]
  });

  add({
    id: "emberhold.maren.waiting",
    speaker: "Old Maren",
    portrait: "maren",
    onEnd: "maren_mend",
    lines: [
      "Still walking. Good. The hill has not wandered off, and neither have I.",
      "You hold {shards}. The lamp eats five. Some glow in the grass. Some fall out of a core, if you ask with the sharp end.",
      "Come back torn. Talk, and I will put you back in the right order."
    ]
  });

  add({
    id: "emberhold.maren.lamp_lit",
    speaker: "Old Maren",
    portrait: "maren",
    onEnd: "quest_lamp_done",
    lines: [
      "There. The grass remembers green. I heard it from the kettle, which is now unbearable.",
      "You set the shards on the plinth yourself. That is the work. I do not take a turn at someone else's lamp.",
      "Your hand has a longer step. Use it. Kestrel will feel the wind and pretend the idea was his."
    ],
    choices: [
      { text: "You called the Hush a tide.", next: "emberhold.maren.lit_hush", requires: { asked_maren: "hush" } },
      { text: "The hand took a longer step.", next: "emberhold.maren.lit_hand", requires: { asked_maren: "hand" } },
      { text: "Kestrel will take the credit.", next: "emberhold.maren.lit_plain" }
    ]
  });

  add({
    id: "emberhold.maren.lit_hush",
    speaker: "Old Maren",
    portrait: "maren",
    lines: [
      "You called it a tide. You pushed it back a step. Tides notice. Do not get loud about a step."
    ]
  });

  add({
    id: "emberhold.maren.lit_hand",
    speaker: "Old Maren",
    portrait: "maren",
    lines: [
      "The longer step is still yours. If the hand starts taking credit, remind it who woke up."
    ]
  });

  add({
    id: "emberhold.maren.lit_plain",
    speaker: "Old Maren",
    portrait: "maren",
    lines: [
      "Kestrel names winds after himself. Let him. The lamp knows who carried the shards. So does the grass."
    ]
  });

  add({
    id: "emberhold.kestrel.span",
    speaker: "Kestrel Vane",
    portrait: "kestrel",
    onEnd: "kestrel_hint",
    lines: [
      "Kestrel Vane. The Quickmercy is winning an argument about nails, and I am losing it.",
      "She will not sail while the lamp holds its breath. Last time I insisted, she sailed a circle and called it a principle.",
      "East of the lamp, the span is broken. Dash from the lip. Walking is how a person becomes weather.",
      "On the far islet, look behind the stones that face the wrong sky. Interesting things rarely face the lamp."
    ],
    choices: [
      { text: "Come with me.", next: "emberhold.kestrel.span_no" },
      { text: "Save me a nail.", next: "emberhold.kestrel.span_nail" }
    ]
  });

  add({
    id: "emberhold.kestrel.span_no",
    speaker: "Kestrel Vane",
    portrait: "kestrel",
    lines: [
      "And leave her with the last word? I have a reputation with this hammer. Light the lamp. Then we talk about west."
    ]
  });

  add({
    id: "emberhold.kestrel.span_nail",
    speaker: "Kestrel Vane",
    portrait: "kestrel",
    lines: [
      "She eats nails. I eat pride. Between us the hull stays up. Light the lamp, and the west gets a real name."
    ]
  });

  add({
    id: "emberhold.kestrel.dark",
    speaker: "Kestrel Vane",
    portrait: "kestrel",
    lines: [
      "Still the wrong wind. She refuses to be heroic, which is why we are both still here.",
      "The stones face the lamp. Look the other way. That is the hint. I will not draw you a map. Maps get confident."
    ]
  });

  add({
    id: "emberhold.kestrel.offer_sail",
    speaker: "Kestrel Vane",
    portrait: "kestrel",
    onEnd: "open_sail_menu",
    lines: [
      "There. You lit it, and the tiller unclenched. Don't repeat that. She will deny having muscles.",
      "West, under the bright crack: Cinderveil. Ash, a quay, a lamp that forgot its job.",
      "We can take you. One of us will complain the whole way. I have already nominated her."
    ],
    choices: [
      { text: "Take me west.", next: "emberhold.kestrel.sail_yes", setFlags: { sail_answer: "yes" } },
      { text: "What are we sailing into?", next: "emberhold.kestrel.sail_what", setFlags: { sail_answer: "ask" } },
      { text: "The hand did the clever part.", next: "emberhold.kestrel.sail_hand", setFlags: { sail_answer: "hand" }, requires: { asked_maren: "hand" } }
    ]
  });

  add({
    id: "emberhold.kestrel.sail_yes",
    speaker: "Kestrel Vane",
    portrait: "kestrel",
    lines: [
      "Good. I like a short yes. When the wind takes, hold the rail. The Hush is not water, and falling is a hobby for other crews."
    ]
  });

  add({
    id: "emberhold.kestrel.sail_what",
    speaker: "Kestrel Vane",
    portrait: "kestrel",
    lines: [
      "A hearth that lost an argument and kept the coals. Lowmoor Quay. Something in the ash has been eating their light.",
      "We are going to be impolite about it. Hold the rail when the wind takes. Compliment the sail after, if you must."
    ]
  });

  add({
    id: "emberhold.kestrel.sail_hand",
    speaker: "Kestrel Vane",
    portrait: "kestrel",
    lines: [
      "Maren told you the hand has ideas? Ideas don't trim a sail. You do. I'll shout which rope. You may pretend you already knew."
    ]
  });

  add({
    id: "emberhold.kestrel.docked",
    speaker: "Kestrel Vane",
    portrait: "kestrel",
    onEnd: "open_sail_menu",
    lines: [
      "West is still west. The hull voted yes, which she will deny if you ask her in front of me.",
      "Say the word at the rail. And if a mask compliments the paint, do not offer it a tour."
    ]
  });

  add({
    id: "emberhold.kestrel.docked_ask",
    speaker: "Kestrel Vane",
    portrait: "kestrel",
    onEnd: "open_sail_menu",
    lines: [
      "Cinderveil has not gotten simpler since you asked. Ash, a quay, a lamp with its eyes shut.",
      "The hull is ready. My metaphor budget is not. Hold the rail when you mean it."
    ]
  });

  add({
    id: "emberhold.kestrel.docked_hand",
    speaker: "Kestrel Vane",
    portrait: "kestrel",
    onEnd: "open_sail_menu",
    lines: [
      "Still interviewing your own hand? Leave the philosophy on the dock. It tangles in the lines.",
      "West is the same west. The rope I shout will be the right rope. Probably."
    ]
  });

  add({
    id: "emberhold.cantor.intro",
    speaker: "The Cantor",
    portrait: "cantor",
    onEnd: "meet_cantor",
    lines: [
      "Wayfarer. A pulse, in a shard, on a hill. How stubborn of you both.",
      "Maren keeps a lamp against a tide. We are what the tide remembers. The Hollow Choir, if you need a name for the manners.",
      "I will not spoil her grass. Mention to the sailor that the patches are admired. I do not wait on docks.",
      "We keep a door. Not on this island. Not while you are still enjoying being kind."
    ]
  });

  add({
    id: "emberhold.cantor.again",
    speaker: "The Cantor",
    portrait: "cantor",
    lines: [
      "Still listening. You are still mending. I find it touching, which I will deny if asked in company.",
      "Kindness is not nothing. It is only not the end. The grass is having a good day. Do not waste it on me."
    ]
  });

  add({
    id: "inspect.waking_stones",
    speaker: "Waking Stones",
    portrait: "stones",
    lines: [
      "Fell in the first night. Rose with a shard for a pulse.",
      "Under that, newer, a careful hand: If you wake, the lamp is up the hill. Talk to Old Maren."
    ]
  });

  add({
    id: "inspect.scar",
    speaker: "The Scar",
    portrait: "scar",
    lines: [
      "Here the meadow tore. Do not follow the lights down.",
      "Smaller, almost worn off: The lights are weather that learned a grudge. — M."
    ]
  });

  add({
    id: "inspect.quickmercy",
    speaker: "Nameplate",
    portrait: "ship",
    lines: [
      "QUICKMERCY. The letters are polished. The dents have been kept, like arguments she won.",
      "Along the keel, scratched and then half scratched out: she bites."
    ]
  });

  add({
    id: "inspect.lamp_cold",
    speaker: "Great Lamp",
    portrait: "lamp",
    lines: [
      "A violet quiet. It wants sky-shards. It will not pick them out of the grass itself.",
      "Old Maren is down the hill. She will not carry them either. The hill is full of principles."
    ]
  });

  add({
    id: "inspect.lamp_hungry",
    speaker: "Great Lamp",
    portrait: "lamp",
    lines: [
      "It is awake enough to be hungry. You hold {shards}. It eats five, from a living hand, on the plinth."
    ]
  });

  add({
    id: "inspect.lamp_lit",
    speaker: "Great Lamp",
    portrait: "lamp",
    lines: [
      "Gold, and a long breath. The little path-lamps have caught. The Hush has been asked to wait outside."
    ]
  });

  add({
    id: "inspect.wrong_sky",
    speaker: "The Wrong Sky",
    portrait: "stones",
    lines: [
      "Standing stones, all facing Emberhold's lamp, as if the light owed them an explanation.",
      "Behind them the sky is the same sky. It does not seem to know it has been called wrong."
    ]
  });

  add({
    id: "inspect.heartblossom",
    speaker: "Heartblossom",
    portrait: "blossom",
    lines: [
      "A blossom the color of a healed scrape. It smells like rain that changed its mind."
    ]
  });

  add({
    id: "inspect.rope_bridge",
    speaker: "Rope Bridge",
    portrait: "bridge",
    lines: [
      "Rope, plank, and a sign someone nailed upside down on purpose.",
      "THE OTHER WAY IS FASTER. THE OTHER WAY IS A MISTAKE."
    ]
  });

  add({
    id: "inspect.span_planks",
    speaker: "Fallen Planks",
    portrait: "bridge",
    lines: [
      "Planks hung in the gap, going nowhere on purpose. They are not a path. They are a warning with grain."
    ]
  });

  add({
    id: "inspect.sail_patch",
    speaker: "The Sail",
    portrait: "ship",
    lines: [
      "A patch in slightly the wrong yellow. Threaded along the hem: she chose this color. Do not fix it. — K.V."
    ]
  });

  add({
    id: "bark.maren.kettle",
    speaker: "Old Maren",
    portrait: "maren",
    lines: [
      "The kettle says you'll be late. I told it to mind its water."
    ]
  });

  add({
    id: "bark.maren.grass",
    speaker: "Old Maren",
    portrait: "maren",
    lines: [
      "Grass is up. That's the whole report. I like a short report."
    ]
  });

  add({
    id: "bark.kestrel.nail",
    speaker: "Kestrel Vane",
    portrait: "kestrel",
    lines: [
      "If you hand me that nail, hand me the right one. She can tell. I cannot, and I live with the shame."
    ]
  });

  add({
    id: "bark.kestrel.scarf",
    speaker: "Kestrel Vane",
    portrait: "kestrel",
    lines: [
      "Scarf stays on. Goggles stay on. Heroics stay off until the lamp says otherwise."
    ]
  });

  add({
    id: "bark.cantor.hem",
    speaker: "The Cantor",
    portrait: "cantor",
    lines: [
      "Lovely wind. Do not waste a compliment on me. I already kept it."
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
      if (f.lampLit && f.sail_answer === "ask") return "emberhold.kestrel.docked_ask";
      if (f.lampLit && f.sail_answer === "hand") return "emberhold.kestrel.docked_hand";
      if (f.lampLit) return "emberhold.kestrel.docked";
      if (!f.kestrelHint) return "emberhold.kestrel.span";
      return "emberhold.kestrel.dark";
    }
    if (who === "cantor") {
      if (!f.metCantor) return "emberhold.cantor.intro";
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
