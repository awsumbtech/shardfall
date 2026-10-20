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
    id: "cinderveil.sail.depart",
    speaker: "Kestrel Vane",
    portrait: "kestrel",
    next: "cinderveil.sail.lane",
    lines: [
      "Off the perch. Rail in your hand. If you let go, do it on an island, not in a cloud with ambitions.",
      "She likes you, by the way. She shows it by complaining at a slightly different pitch."
    ]
  });

  add({
    id: "cinderveil.sail.lane",
    speaker: "Kestrel Vane",
    portrait: "kestrel",
    next: "cinderveil.sail.sight",
    lines: [
      "These are wind lanes. The bright ones are pretty. Pretty, over the Hush, is often a mouth.",
      "We take the dull lane. She hates the dull lane. That is how I know it is the right one."
    ]
  });

  add({
    id: "cinderveil.sail.sight",
    speaker: "Kestrel Vane",
    portrait: "kestrel",
    next: "cinderveil.kestrel.arrive",
    lines: [
      "There. Grey island, orange seam, a crack in the sky like a held match. Cinderveil.",
      "Looks like a hearth that lost the argument and kept the coals. That's our stop."
    ]
  });

  add({
    id: "cinderveil.kestrel.arrive",
    speaker: "Kestrel Vane",
    portrait: "kestrel",
    lines: [
      "Lowmoor Quay. Smile like we meant to. If you look surprised, the dock charges extra.",
      "That ridge lamp is dark. Rude. Tamsin will already be mid-sentence. Try to find the beginning of it.",
      "I'll stay with the hull. If I leave her, she picks up new opinions, and we are at quota."
    ]
  });

  add({
    id: "cinderveil.tamsin.cogs_start",
    speaker: "Tamsin Reed",
    portrait: "tamsin",
    onEnd: "quest_cogs_start",
    lines: [
      "You're the hand. Kestrel said hand, I heard project, and I cleared the bench.",
      "I'm Tamsin. I fit clever things into less clever things until both of them work out of spite.",
      "Three cogs, out in the Ashfields. Kick the right dust. The wrong dust kicks back."
    ],
    choices: [
      { text: "I'll bring you three.", next: "cinderveil.tamsin.cogs_earnest", setFlags: { tamsin_mood: "earnest" } },
      { text: "Define wrong dust.", next: "cinderveil.tamsin.cogs_wary", setFlags: { tamsin_mood: "wary" } }
    ]
  });

  add({
    id: "cinderveil.tamsin.cogs_earnest",
    speaker: "Tamsin Reed",
    portrait: "tamsin",
    lines: [
      "Yes. Three. Not two and a bold attitude. I tried that. The attitude is still in a sling."
    ]
  });

  add({
    id: "cinderveil.tamsin.cogs_wary",
    speaker: "Tamsin Reed",
    portrait: "tamsin",
    lines: [
      "Wrong dust has teeth and a grudge. Right dust is just embarrassed. The teeth introduce themselves."
    ]
  });

  add({
    id: "cinderveil.tamsin.cogs_waiting",
    speaker: "Tamsin Reed",
    portrait: "tamsin",
    lines: [
      "No cogs, no grapple. I can offer a pep talk. The pep talk does not hook onto cliffs.",
      "I counted your pockets with my eyes, which is a skill, and also why people don't invite me to things."
    ],
    choices: [
      { text: "Still looking.", next: "cinderveil.tamsin.wait_earnest", requires: { tamsin_mood: "earnest" } },
      { text: "The dust has opinions.", next: "cinderveil.tamsin.wait_wary", requires: { tamsin_mood: "wary" } },
      { text: "Show me the bench again.", next: "cinderveil.tamsin.wait_bench" }
    ]
  });

  add({
    id: "cinderveil.tamsin.wait_earnest",
    speaker: "Tamsin Reed",
    portrait: "tamsin",
    lines: [
      "You said you'd bring them, and you haven't. I respect the suspense. My bench does not."
    ]
  });

  add({
    id: "cinderveil.tamsin.wait_wary",
    speaker: "Tamsin Reed",
    portrait: "tamsin",
    lines: [
      "The dust introduce itself? If you still have both boots, you're winning. Go embarrass a cog."
    ]
  });

  add({
    id: "cinderveil.tamsin.wait_bench",
    speaker: "Tamsin Reed",
    portrait: "tamsin",
    lines: [
      "Bench, hammer, and a cup of tea I won't share — it has a bolt in it. Three cogs is the whole long story."
    ]
  });

  add({
    id: "cinderveil.tamsin.grapple_gift",
    speaker: "Tamsin Reed",
    portrait: "tamsin",
    onEnd: "grant_grapple",
    lines: [
      "Three. I love you in a strictly mechanical way. Hold still.",
      "This is a handshake. The shard throws the line, the cliff agrees, and you do not let go first."
    ],
    choices: [
      { text: "It fits.", next: "cinderveil.tamsin.gift_earnest", requires: { tamsin_mood: "earnest" } },
      { text: "If it bites, I'm blaming you.", next: "cinderveil.tamsin.gift_wary", requires: { tamsin_mood: "wary" } },
      { text: "Point me at the vault.", next: "cinderveil.tamsin.gift_vault" }
    ]
  });

  add({
    id: "cinderveil.tamsin.gift_earnest",
    speaker: "Tamsin Reed",
    portrait: "tamsin",
    lines: [
      "It fits because you went and got the ugly parts. I like you. That's a technical assessment."
    ]
  });

  add({
    id: "cinderveil.tamsin.gift_wary",
    speaker: "Tamsin Reed",
    portrait: "tamsin",
    lines: [
      "If it bites, it learned that from the dust, not from me. Mostly not from me."
    ]
  });

  add({
    id: "cinderveil.tamsin.gift_vault",
    speaker: "Tamsin Reed",
    portrait: "tamsin",
    lines: [
      "Ilsa has the door, and a face like a closed ledger. She deducts marks for poetry, so cross and don't recite."
    ]
  });

  add({
    id: "cinderveil.hesk.rumor",
    speaker: "Brother Hesk",
    portrait: "hesk",
    lines: [
      "Oh. A face. Hello. Sorry — I am Brother Hesk.",
      "I was Hollow Choir. I am now this crate, and the crate is winning.",
      "They smiled when I left. Nobody shouted. That is how you know to run.",
      "When you light the lamp, the Cantor will come admire it. They love a fresh hope. It is their favorite seasoning."
    ],
    choices: [
      { text: "Breathe. Tell me the useful part.", next: "cinderveil.hesk.steady", setFlags: { hesk_mood: "steady" } },
      { text: "What does the Cantor want?", next: "cinderveil.hesk.pressed", setFlags: { hesk_mood: "pressed" } }
    ]
  });

  add({
    id: "cinderveil.hesk.steady",
    speaker: "Brother Hesk",
    portrait: "hesk",
    lines: [
      "Useful, yes. The thing in the vault is a Maw — hunger, not the Cantor.",
      "Do not bow to it. The Cantor is the one with manners, and they hand your clever words back sharper."
    ]
  });

  add({
    id: "cinderveil.hesk.pressed",
    speaker: "Brother Hesk",
    portrait: "hesk",
    lines: [
      "They want the sky to finish its sentence. Islands are the pause. You, with a shard that woke, are a word that refused to end.",
      "I said no. Then I said no again, from a crate, with my voice doing this. Please do not make a hobby of being brave at me."
    ]
  });

  add({
    id: "cinderveil.ilsa.trial",
    speaker: "Warden Ilsa",
    portrait: "ilsa",
    onEnd: "vault_open",
    lines: [
      "Hold. Warden Ilsa. The Ember Vault stays shut while something in it chews the core.",
      "You want in. The trial is the gap: your own line, your own weight, no bridge and no speech.",
      "Fall, and the Hush files you under weather. I will not argue with its paperwork."
    ],
    choices: [
      { text: "I'll cross.", next: "cinderveil.ilsa.cross" },
      { text: "Hesk says the Cantor collects words.", next: "cinderveil.ilsa.hesk", requires: { hesk_mood: "steady" } },
      { text: "Hesk says they want the sky finished.", next: "cinderveil.ilsa.hesk_dark", requires: { hesk_mood: "pressed" } }
    ]
  });

  add({
    id: "cinderveil.ilsa.cross",
    speaker: "Warden Ilsa",
    portrait: "ilsa",
    lines: [
      "Then cross. The door knows weight. I know hesitation. Go."
    ]
  });

  add({
    id: "cinderveil.ilsa.hesk",
    speaker: "Warden Ilsa",
    portrait: "ilsa",
    lines: [
      "Hesk talks when he is afraid. He is always afraid. He is also right. Cross. Fear is not a key I honor."
    ]
  });

  add({
    id: "cinderveil.ilsa.hesk_dark",
    speaker: "Warden Ilsa",
    portrait: "ilsa",
    lines: [
      "A finished sky. I have heard the sermon. I kept the door anyway. You keep your feet. That is the whole trial."
    ]
  });

  add({
    id: "cinderveil.maw.prefight",
    speaker: "The Cinder Maw",
    portrait: "maw",
    onEnd: "boss_start",
    lines: [
      "Ash inhales. The vault's core-light gutters in a throat that should not have learned how.",
      "It turns. A seed burns in the chest. That seed is the island, borrowed. Strike that.",
      "The teeth are only weather. Kestrel would call this a bad room, and he would be late."
    ]
  });

  add({
    id: "cinderveil.maw.defeated",
    speaker: "The Cinder Maw",
    portrait: "maw",
    lines: [
      "The shape forgets the grudge. Ash lies down. The seed sits in the quiet, small and deeply offended.",
      "It will be a lamp again if you ask with shards. Cores are bad at gratitude. Ask anyway."
    ]
  });

  add({
    id: "cinderveil.lamp.relit",
    speaker: "Cinderveil's Lamp",
    portrait: "lamp",
    onEnd: "quest_cinder_lamp_done",
    lines: [
      "You set the shards on the hurt core. It takes them the way a fever breaks: all at once, and then the room is different.",
      "Orange comes back into the ash. Down at Lowmoor, the little lamps agree, one by one.",
      "For a breath the Hush steps off the quay. Someone behind you clears a throat, as if the dark were a parlor."
    ]
  });

  add({
    id: "cinderveil.cantor.confront",
    speaker: "The Cantor",
    portrait: "cantor",
    onEnd: "act1_end",
    lines: [
      "Wayfarer. You lit another one. If this is a hobby, it is an expensive one, and I am terribly fond of it.",
      "The Maw was a stomach. I am a sentence. You may interrupt. Most guests apologize instead.",
      "Come along, hear the ending, or refuse. Only one of those is yours."
    ],
    choices: [
      { text: "Spare them.", next: "cinderveil.cantor.spare", setFlags: { cantor_choice: "spare" } },
      { text: "Listen.", next: "cinderveil.cantor.listen", setFlags: { cantor_choice: "listen" } },
      { text: "Refuse.", next: "cinderveil.cantor.refuse", setFlags: { cantor_choice: "refuse" } }
    ]
  });

  add({
    id: "cinderveil.cantor.spare",
    speaker: "The Cantor",
    portrait: "cantor",
    next: "cinderveil.kestrel.epilogue_spare",
    lines: [
      "Spare. You put the knife down and left me the conversation. How like a person who keeps a lamp.",
      "I accept the delay. Tell the brother who fled that I remain polite. He will know which of us that frightens."
    ]
  });

  add({
    id: "cinderveil.cantor.listen",
    speaker: "The Cantor",
    portrait: "cantor",
    next: "cinderveil.kestrel.epilogue_listen",
    lines: [
      "Then hear it once, cleanly. The sky is mid-sentence. We would like a period. Islands are the comma.",
      "The shard in your hand has refused that period since you woke. I dress well for waiting."
    ]
  });

  add({
    id: "cinderveil.cantor.refuse",
    speaker: "The Cantor",
    portrait: "cantor",
    next: "cinderveil.kestrel.epilogue_refuse",
    lines: [
      "No is a complete sentence. I did tell the others you might. They hoped I was being modest.",
      "Keep the lamp, the sailor, and the hand that will not finish the sentence. When the sky does it anyway, hold a rail."
    ]
  });

  add({
    id: "cinderveil.kestrel.epilogue_spare",
    speaker: "Kestrel Vane",
    portrait: "kestrel",
    lines: [
      "You let the mask walk. I would have introduced a wrench. Wrenches are a kind of theology. Next time, vote wrench."
    ]
  });

  add({
    id: "cinderveil.kestrel.epilogue_listen",
    speaker: "Kestrel Vane",
    portrait: "kestrel",
    lines: [
      "You let them finish. Brave. I'll be over here, not making eye contact with the sky. Get on the boat when your ears stop ringing."
    ]
  });

  add({
    id: "cinderveil.kestrel.epilogue_refuse",
    speaker: "Kestrel Vane",
    portrait: "kestrel",
    lines: [
      "No. Excellent. No is a hull. It keeps the weather on the outside. Welcome aboard. Don't track ash onto the ash."
    ]
  });

  add({
    id: "inspect.lowmoor_sign",
    speaker: "Quay Sign",
    portrait: "sign",
    lines: [
      "LOWMOOR QUAY. ASH IS FREE. OPINIONS ARE NOT. PLEASE DO NOT FEED THE HUSH.",
      "Under that, quicker: Tamsin, the bench is not a suggestion box. Stop leaving cogs in the suggestion box."
    ]
  });

  add({
    id: "inspect.tamsin_bench",
    speaker: "Tamsin's Bench",
    portrait: "crate",
    lines: [
      "A bench, a vise, and a teacup with a bolt in it. The bolt has been winning for some time.",
      "Chalked on the wood: THREE COGS. NOT TWO. NOT A PROMISE."
    ]
  });

  add({
    id: "inspect.ash_cog",
    speaker: "Ash Cog",
    portrait: "ash",
    lines: [
      "A cog in the ash, warm as a coin someone was ashamed of. It ticks once, like it recognized you and regrets it."
    ]
  });

  add({
    id: "inspect.vault_seal",
    speaker: "Vault Seal",
    portrait: "vault",
    lines: [
      "EMBER VAULT. LANTERNWRIGHT SEAL. Under the wax, Ilsa's hand: If you can read this, you are too close. Good."
    ]
  });

  add({
    id: "inspect.cinder_core",
    speaker: "Cinder Core",
    portrait: "core",
    lines: [
      "The island's heart, dim as a coal under a story. Something has been breathing through it."
    ]
  });

  add({
    id: "inspect.maw_tooth",
    speaker: "A Tooth",
    portrait: "maw",
    lines: [
      "A tooth in the ash, if clouds had teeth. It is still warm. It does not deserve to be."
    ]
  });

  add({
    id: "inspect.choir_crate",
    speaker: "Hesk's Crate",
    portrait: "crate",
    lines: [
      "A crate, a blanket, three polite pamphlets, and a note: I am not here. — H.",
      "The note is here. Hesk is also here. The pamphlets are sorry about both facts."
    ]
  });

  add({
    id: "inspect.ilsa_order",
    speaker: "Posted Orders",
    portrait: "sign",
    lines: [
      "No bridges. No speeches. No feeding the vault. If the vault asks, that counts as feeding."
    ]
  });

  add({
    id: "inspect.quay_bell",
    speaker: "Quay Bell",
    portrait: "bell",
    lines: [
      "A quay bell stuffed with ash so it cannot ring. Someone was tired of news. The news came anyway."
    ]
  });

  add({
    id: "inspect.ember_path",
    speaker: "Ash Path",
    portrait: "ash",
    lines: [
      "Stakes along an ash path, unlit. They look embarrassed, which is a lot of work for a stick."
    ]
  });

  add({
    id: "bark.tamsin.bench",
    speaker: "Tamsin Reed",
    portrait: "tamsin",
    lines: [
      "Don't touch the cup. The cup is structural."
    ]
  });

  add({
    id: "bark.tamsin.dust",
    speaker: "Tamsin Reed",
    portrait: "tamsin",
    lines: [
      "If the ash squeaks, squeak back. Dominance. I read it in a pamphlet Hesk will not admit is his."
    ]
  });

  add({
    id: "bark.hesk.crate",
    speaker: "Brother Hesk",
    portrait: "hesk",
    lines: [
      "I am not hiding. The crate is hiding. I am inspecting the crate from the inside."
    ]
  });

  add({
    id: "bark.hesk.sorry",
    speaker: "Brother Hesk",
    portrait: "hesk",
    lines: [
      "Sorry. That one was for earlier. I save them up, and then they leak."
    ]
  });

  add({
    id: "bark.ilsa.post",
    speaker: "Warden Ilsa",
    portrait: "ilsa",
    lines: [
      "If you are lost, you are not. The gap is that way. So is the mistake."
    ]
  });

  add({
    id: "bark.ilsa.count",
    speaker: "Warden Ilsa",
    portrait: "ilsa",
    lines: [
      "One way in. It is the hard way. I already counted."
    ]
  });

  add({
    id: "bark.quay.ash",
    speaker: "Lowmoor",
    portrait: "ash",
    lines: [
      "A gull made of cinders lands, remembers it is not a gull, and leaves."
    ]
  });

  add({
    id: "bark.maw.breath",
    speaker: "The Ember Vault",
    portrait: "maw",
    lines: [
      "Something in the vault exhales. The ash on the floor leans toward it, eager and stupid."
    ]
  });
})();
