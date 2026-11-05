"use strict";

// Act 1 meat pass. Spoken lines are the approved wording, copied as written.
// One module owns the new scene nodes. Routers for townsfolk live with the towns.
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

  function say(speaker, portrait, text) {
    return { text: text, speaker: speaker, portrait: portrait };
  }

  add({
    id: "emberhold.dell.intro",
    speaker: "Bram Tolley",
    portrait: "bram",
    onEnd: "meet_bram",
    reopenChoices: "dellIntroHeard",
    lines: [
      narr("Bram is nailing a board across a window. Wren sits on the step with a goat on a rope."),
      say("Bram Tolley", "bram", "You're the one off the stones. Maren said you'd be by."),
      say("Bram Tolley", "bram", "I'm Bram. This is Wren. Don't mind the hammering. I board up the back windows when the lamp gets low."),
      say("Wren", "wren", "He does it every night now."),
      say("Bram Tolley", "bram", "Two of my goats went missing near the Scar last week. Wren keeps this one on a rope.")
    ],
    choices: [
      { text: "I'm getting shards for the lamp.", next: "emberhold.dell.shards", setFlags: { dell_heard_shards: true }, unless: { dell_heard_shards: true } },
      { text: "Why not leave the island?", next: "emberhold.dell.leave", setFlags: { dell_heard_leave: true }, unless: { dell_heard_leave: true } }
    ]
  });

  add({
    id: "emberhold.dell.shards",
    speaker: "Bram Tolley",
    portrait: "bram",
    next: "emberhold.dell.intro",
    lines: [
      "Good. Maren can't do it on her own anymore, and the rest of us don't know a shard from a bit of glass.",
      "If you get it lit, come back. I'll take the boards down, and Wren can take the goat off that rope."
    ]
  });

  add({
    id: "emberhold.dell.leave",
    speaker: "Bram Tolley",
    portrait: "bram",
    next: "emberhold.dell.intro",
    lines: [
      "And go where? Every island's got a lamp, and every lamp's getting old.",
      "My family's been on this hill for five generations. We'll stay till it's lit or till it's gone."
    ]
  });

  add({
    id: "emberhold.dell.boards",
    speaker: "Bram Tolley",
    portrait: "bram",
    lines: [
      "I board up the back windows when the lamp gets low."
    ]
  });

  add({
    id: "emberhold.dell.after",
    speaker: "Bram Tolley",
    portrait: "bram",
    onEnd: "bram_gift",
    lines: [
      narr("The boards are off the windows. Wren is chasing the goat, no rope."),
      say("Bram Tolley", "bram", "Look at that. First night in a month I slept straight through."),
      say("Wren", "wren", "Thank you for the lamp!"),
      say("Bram Tolley", "bram", "Here. It's not much. Maren says you'll be off on Kestrel's boat.")
    ]
  });

  add({
    id: "emberhold.dell.slept",
    speaker: "Bram Tolley",
    portrait: "bram",
    lines: [
      "Look at that. First night in a month I slept straight through."
    ]
  });

  add({
    id: "emberhold.wren.thanks",
    speaker: "Wren",
    portrait: "wren",
    lines: [
      "Thank you for the lamp!"
    ]
  });

  add({
    id: "emberhold.wren.hand",
    speaker: "Wren",
    portrait: "wren",
    lines: [
      "Is your hand hot? Can I touch it? Just a bit?"
    ]
  });

  add({
    id: "emberhold.maren.evening",
    speaker: "Old Maren",
    portrait: "maren",
    onEnd: "maren_evening",
    reopenChoices: "marenEveningHeard",
    lines: [
      narr("Maren has a kettle on. Two cups. She's sitting for the first time since you met her."),
      "Sit down a minute. You've been running all day, and so have I.",
      "I lit that lamp for forty years, and I never once saw it burn like that. I keep looking out the window to check it's still there.",
      "You'll go to Cinderveil tomorrow. I'm glad you're going. I'm also not, if that makes sense."
    ],
    choices: [
      { text: "How many islands have fallen?", next: "emberhold.maren.fallen", setFlags: { asked_fallen: true }, requires: { met_cantor: true }, unless: { asked_fallen: true } },
      { text: "Tell me about the Lanternwrights.", next: "emberhold.maren.order", setFlags: { asked_order: true }, unless: { asked_order: true } },
      { text: "I'll come back.", next: "emberhold.maren.evening_end" }
    ]
  });

  add({
    id: "emberhold.maren.fallen",
    speaker: "Old Maren",
    portrait: "maren",
    next: "emberhold.maren.evening",
    lines: [
      narr("Maren puts her cup down."),
      "Who asked you to ask me that? The one in the mask?",
      "Seven. Seven islands in my lifetime. I watched Thornwick go from this hill when I was twenty. The lamp went out, and three days later it was gone.",
      "Every one of them fell because its lamp went out, and nobody came to light it. Not because lamps don't work.",
      "The Choir counts the islands that fell. They never count the ones that are still up."
    ]
  });

  add({
    id: "emberhold.maren.order",
    speaker: "Old Maren",
    portrait: "maren",
    next: "emberhold.maren.evening",
    lines: [
      "There used to be hundreds of us. Every island had two or three.",
      "Now it's me here, a handful on Cinderveil, and the Order at Highspire. Young folk don't want to spend their life hauling shards up a hill. I don't blame them."
    ]
  });

  add({
    id: "emberhold.maren.evening_end",
    speaker: "Old Maren",
    portrait: "maren",
    lines: [
      "You'd better. And bring Kestrel back in one piece. She acts like she doesn't need looking after."
    ]
  });

  add({
    id: "cinderveil.sail.trust",
    speaker: "Kestrel Vane",
    portrait: "kestrel",
    onEnd: "kestrel_trust",
    lines: [
      narr("Kestrel ties off a line and sits on a crate across from you. She pushes her goggles up for the first time.", "ship"),
      "Can I tell you something? I don't take passengers. Cargo, yes. People, almost never.",
      "Two years back I took a man to Saltmere. Paid well, nice manners. Halfway there he tried to throw me over the side and keep the boat.",
      "Driftborn don't have land. We have boats and each other. So we're careful who we let aboard."
    ],
    choices: [
      { text: "Why let me on, then?", next: "cinderveil.sail.trust_why" },
      { text: "What happened to the man?", next: "cinderveil.sail.trust_man" }
    ]
  });

  add({
    id: "cinderveil.sail.trust_why",
    speaker: "Kestrel Vane",
    portrait: "kestrel",
    next: "cinderveil.sail.sight",
    lines: [
      "You lit Maren's lamp and didn't ask for a thing. Nobody does that.",
      "And you could've taken the *Quickmercy* any night I was asleep on the dock. You didn't.",
      "Right. Back to work. Cinderveil's close."
    ]
  });

  add({
    id: "cinderveil.sail.trust_man",
    speaker: "Kestrel Vane",
    portrait: "kestrel",
    next: "cinderveil.sail.sight",
    lines: [
      "I'm still here and he's not. I don't talk about the rest.",
      "Anyway. You're fine. I've decided.",
      "Right. Back to work. Cinderveil's close."
    ]
  });

  add({
    id: "cinderveil.quay.street",
    speaker: "Ada Fenn",
    portrait: "ada",
    onEnd: "quay_street_seen",
    lines: [
      narr("Bell Square. A woman is shoving a crate against a door. A boy holds a lantern. An old man stands by the bell with the rope in his hands."),
      say("Ada Fenn", "ada", "Corin, get the other side. Push."),
      say("Corin Fenn", "corin", "Mum, it's the middle of the day."),
      say("Ada Fenn", "ada", "They came up to Harlow's door in the middle of the day on Tuesday. Push."),
      narr("She sees you."),
      say("Ada Fenn", "ada", "Who are you? You came off a boat? Is anyone coming to fix the lamp? Is the Order coming?")
    ],
    choices: [
      { text: "I'm here to help.", next: "cinderveil.quay.help" },
      { text: "What happened here?", next: "cinderveil.quay.what" }
    ]
  });

  add({
    id: "cinderveil.quay.help",
    speaker: "Ada Fenn",
    portrait: "ada",
    lines: [
      "One person. Right.",
      "Sorry. I'm not angry with you. It's been a week and nobody's come.",
      say("Old Tobin", "tobin", "I ring this bell when they come up from the water. I rang it eleven times last night."),
      say("Ada Fenn", "ada", "If you want to help, find Tamsin Reed. She's the only one still working on anything.")
    ]
  });

  add({
    id: "cinderveil.quay.what",
    speaker: "Ada Fenn",
    portrait: "ada",
    lines: [
      "The lamp went out a week ago. Same night, something started shaking the ground under the ridge.",
      "Warden Ilsa closed the Vault and won't say why. Half the town's packed up and gone on whatever boats would take them.",
      say("Old Tobin", "tobin", "I ring this bell when they come up from the water. I rang it eleven times last night."),
      say("Ada Fenn", "ada", "If you want to help, find Tamsin Reed. She's the only one still working on anything.")
    ]
  });

  add({
    id: "cinderveil.hesk.why",
    speaker: "Brother Hesk",
    portrait: "hesk",
    lines: [
      "Because I helped bring it here. I carried the burning shards. Sorry. I'm sorry.",
      "I can't fight it. You can. Telling you is the one useful thing I can do."
    ]
  });

  add({
    id: "cinderveil.hesk.safe",
    speaker: "Brother Hesk",
    portrait: "hesk",
    lines: [
      "No. They'll find me eventually. They always find people who leave.",
      "But Warden Ilsa knows I'm here, and she hasn't thrown me off the island. That's something."
    ]
  });

  add({
    id: "cinderveil.hesk.more",
    speaker: "Brother Hesk",
    portrait: "hesk",
    onEnd: "hesk_more_heard",
    lines: [
      "I joined three years ago. My island's lamp was failing, and the Choir said they'd take care of us. They fed us. Nobody else did.",
      "At first it was just meetings, and talking about the sky. Then they started leading Hushborn places.",
      "When they took the Maw to Cinderveil, I knew people lived here. I left that night."
    ],
    choices: [
      { text: "Why tell me?", next: "cinderveil.hesk.why" },
      { text: "Are you safe here?", next: "cinderveil.hesk.safe" }
    ]
  });

  add({
    id: "cinderveil.hesk.after",
    speaker: "Brother Hesk",
    portrait: "hesk",
    onEnd: "hesk_after",
    lines: [
      "You're going in. Please be careful. It hits hard and it doesn't get tired.",
      "I'll be here. I'm not going anywhere. Where would I go?"
    ]
  });

  add({
    id: "cinderveil.ilsa.doubt",
    speaker: "Warden Ilsa",
    portrait: "ilsa",
    onEnd: "ilsa_doubt",
    lines: [
      "Stop there. This cliff is closed.",
      "You're not from Cinderveil. A week ago the Choir walked a Hushborn past my post while I slept. Now a stranger turns up with a glowing hand. You can see why I'm not pleased."
    ],
    choices: [
      { text: "I'm not with the Choir.", next: "cinderveil.ilsa.doubt_choir" },
      { text: "I lit Emberhold's lamp.", next: "cinderveil.ilsa.doubt_lamp" }
    ]
  });

  add({
    id: "cinderveil.ilsa.doubt_choir",
    speaker: "Warden Ilsa",
    portrait: "ilsa",
    lines: [
      "That's what a Choir spy would say. Maybe you aren't. I don't know you, so I'm not taking your word for it.",
      "The bridge is burned. No way across, no crossing. If you find a way, come back and we'll talk."
    ]
  });

  add({
    id: "cinderveil.ilsa.doubt_lamp",
    speaker: "Warden Ilsa",
    portrait: "ilsa",
    lines: [
      "I saw a bright light to the east a few nights ago. Maybe that was you. Maybe it was a fire.",
      "Lighting a lamp is one thing. The Vault is another.",
      "The bridge is burned. No way across, no crossing. If you find a way, come back and we'll talk."
    ]
  });

  add({
    id: "cinderveil.cantor.quay",
    speaker: "The Cantor",
    portrait: "cantor",
    onEnd: "cantor_quay_met",
    lines: [
      { text: "Hello again. You found Tamsin. She's very clever.", speaker: "The Cantor", portrait: "cantor", requires: { met_cantor: true } },
      { text: "Hello. I'm the Cantor, of the Hollow Choir. Please don't run off. I only want to talk.", speaker: "The Cantor", portrait: "cantor", unless: { met_cantor: true } },
      "You're going to the Vault. I won't stop you. I'd only ask you to look carefully at the core while you're in there.",
      "Look at how worn it is. Then decide how much the lamp above it can really do."
    ],
    choices: [
      { text: "Did the Choir put something in there?", next: "cinderveil.cantor.quay_ask" },
      { text: "Leave these people alone.", next: "cinderveil.cantor.quay_warn" }
    ]
  });

  add({
    id: "cinderveil.cantor.quay_ask",
    speaker: "The Cantor",
    portrait: "cantor",
    lines: [
      "I'll answer that honestly when you come out. You have my word.",
      narr("The Cantor walks off into the mist.", "cantor")
    ]
  });

  add({
    id: "cinderveil.cantor.quay_warn",
    speaker: "The Cantor",
    portrait: "cantor",
    lines: [
      "I'm not here for them. I'm here for you. Good luck, Wayfarer. I mean it.",
      narr("The Cantor walks off into the mist.", "cantor")
    ]
  });

  function flag(name) {
    SF.onDialogueEvent(name, function () {
      var s = SF.state;
      if (!s) return;
      if (!s.flags) s.flags = {};
      s.flags[name] = true;
    });
  }

  flag("meet_bram");
  flag("kestrel_trust");
  flag("quay_street_seen");
  flag("hesk_more_heard");
  flag("hesk_after");
  flag("ilsa_doubt");

  SF.onDialogueEvent("meet_bram", function () {
    var s = SF.state;
    if (!s || !s.flags) return;
    s.flags.met_bram = true;
  });

  SF.onDialogueEvent("bram_gift", function () {
    var s = SF.state;
    if (!s) return;
    if (!s.flags) s.flags = {};
    s.flags.met_bram = true;
    if (s.flags.bram_thanked) return;
    s.flags.bram_thanked = true;
    if (SF.giveItem) {
      SF.giveItem("tonic", 1);
      SF.giveItem("heartblossom", 1);
    }
    if (SF.pushToast) SF.pushToast("Bram gives you a Tonic and a Heartblossom.", 2.2);
    if (SF.saveGame) SF.saveGame({ silent: true });
  });

  SF.onDialogueEvent("maren_evening", function () {
    var s = SF.state;
    if (!s) return;
    if (!s.flags) s.flags = {};
    s.flags.maren_evening = true;
    s.flags.asked_fallen = !!s.flags.asked_fallen;
    if (SF.healParty) SF.healParty(1);
    else if (s.player) s.player.hp = s.player.maxHp;
    if (SF.saveGame) SF.saveGame({ silent: true });
  });

  SF.onDialogueEvent("kestrel_trust", function () {
    var s = SF.state;
    if (!s || !s.flags) return;
    s.flags.kestrel_trust = true;
  });

  SF.onDialogueEvent("cantor_quay_met", function () {
    var s = SF.state;
    if (!s) return;
    if (!s.flags) s.flags = {};
    s.flags.met_cantor = true;
    s.flags.metCantor = true;
    s.flags.cantor_quay = true;
    if (SF.saveGame) SF.saveGame({ silent: true });
  });
})();
