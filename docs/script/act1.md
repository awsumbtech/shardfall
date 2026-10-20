# Shardfall — Act 1: The Cinder Road

*Script draft v2, for Brian's review.*

## Story summary

**The setting.** A hundred years ago, in the Sundering, the Heartshard that held the sky together cracked, and the world broke into floating islands over the Hush, a glowing cloud sea. Anything that falls into the Hush comes back as a Hushborn, a monster made of cloud and hunger. The Lanternwrights built great lamps from fallen sky-shards to keep the Hush off each island. Now the lamps are failing, few Lanternwrights are left, and the Hollow Choir says that's for the best: the sky should finish falling so the world can start over.

**Characters**

- **The Wayfarer.** The player. No memory, and a piece of the Heartshard fused into one hand. Speaks only through reply choices.
- **Old Maren.** Emberhold's lamp-keeper. Warm, practical, tired, and alone at the job for years.
- **Kestrel Vane.** A fast-talking Driftborn sky-sailor (she/her) who loves her patched skiff, the *Quickmercy*. Brave, but she likes getting paid.
- **Tamsin Reed.** A young tinkerer on Cinderveil. Excited, nerdy, always three sentences ahead of herself.
- **Brother Hesk.** A frightened Choir deserter who apologizes constantly and knows what they've done.
- **Warden Ilsa.** A Lanternwright soldier guarding the Ember Vault. Blunt and dutiful, and slow to trust.
- **The Cantor.** Leader of the Hollow Choir. Calm, polite, and sure they're the good guy. Wants the Wayfarer's shard, given freely.
- **The Cinder Maw.** A huge Hushborn eating Cinderveil's core. A boss, not a speaker.

**Act 1 beats**

1. The Wayfarer wakes at the Waking Stones. Maren explains the Hush and the lamps. Emberhold's lamp is nearly out, so she asks for 5 sky-shards.
2. Kestrel won't sail while the lamp is failing. She sends the Wayfarer across the broken span (dash) to find more shards.
3. Optional: the Cantor, in Whisper Hollow, is friendly, curious about the hand, and plants doubt.
4. The lamp is relit, and the hand learns Shardstep, a longer dash. A shaken Maren reports that Cinderveil's lamp went dark a week ago. Kestrel offers to sail there.
5. The crossing: Kestrel explains the Driftborn and the danger of the Hush.
6. At Lowmoor Quay on Cinderveil, Tamsin offers to fit a Grapple to the shard if the Wayfarer brings her 3 cogs from the Ashfields.
7. Brother Hesk reveals that the Choir lured a Cinder Maw into the Ember Vault to eat the island's core, as a test for the shard-bearer.
8. Warden Ilsa lets the Wayfarer attempt the Vault crossing once they have the Grapple.
9. Boss fight: the Cinder Maw.
10. The Wayfarer relights Cinderveil's lamp, and Ilsa admits she misjudged them.
11. The Cantor admits the Maw was a test and asks for the shard, or for the Wayfarer to join. The Wayfarer chooses Spare, Listen, or Refuse. Kestrel closes the act, bound for the Lanternwrights at Highspire.

**Flags used in this act**

- `asked_maren` = `hush` | `hand`. Changes one of Maren's lines after the lamp is lit.
- `met_cantor` = `true`. Set when you meet the Cantor in Whisper Hollow. Unlocks a reply for Kestrel and changes the Cantor's greeting on Cinderveil.
- `sail_answer` = `yes` | `ask` | `cantor`. Changes Kestrel's line if you talk to her again before sailing.
- `hesk_mood` = `steady` | `pressed`. Decides how much Hesk tells you, and what you can tell Ilsa.
- `cantor_choice` = `spare` | `listen` | `refuse`. The end of the act.

---

## Emberhold

### The Waking Stones

`emberhold.wake`

*Dusk. You wake in a ring of standing stones with no memory of your name. A sliver of glowing blue crystal has grown into your right palm.*

*Down the hill, smoke rises from a cottage chimney. Up on the ridge, a great lamp flickers weakly.*

*When the scene ends, the player can move, and a prompt teaches Dash.*

### Old Maren

`emberhold.maren.intro`

**OLD MAREN:** Oh, you're up. You've been lying out on those stones since yesterday. I'm Maren.

**OLD MAREN:** Do you know your name? No? That's all right. I'll call you Wayfarer till it comes back to you.

**OLD MAREN:** Let me see that hand. I've handled sky-shards all my life, and I've never seen one grow into a person.

**OLD MAREN:** Now, the lamp up the hill keeps the Hush off this island, and it's nearly out. The Hushborn are already coming up past the Scar at night.

*Maren points up the hill. The camera pans to the lamp on the ridge. The shard in your palm flares bright, and the lamp flickers brighter for a moment in answer. The camera pans back. Your palm keeps tingling, and you can tell which way other shards are.*

**OLD MAREN:** Did you see that? The lamp brightened when your hand did.

**OLD MAREN:** It needs five sky-shards. My knees won't get me out to where they fall anymore. Will you find them and set them in the lamp?

- "What's the Hush?" → `emberhold.maren.ask_hush` *(sets `asked_maren = hush`)*
- "What is this thing in my hand?" → `emberhold.maren.ask_hand` *(sets `asked_maren = hand`)*
- "I'll get them." → `emberhold.maren.intro_go`

`emberhold.maren.ask_hush`

**OLD MAREN:** The cloud sea under the islands. A hundred years ago the Heartshard cracked, the sky broke apart, and everything underneath went into the Hush.

**OLD MAREN:** Whatever falls in comes back as Hushborn, made of cloud and hunger. A lit lamp is the only thing they won't cross.

*Continues to `emberhold.maren.intro_go`.*

`emberhold.maren.ask_hand`

**OLD MAREN:** I wish I knew. It looks like a sky-shard, but it's brighter than any I've held.

**OLD MAREN:** While you were asleep, the lamp flared every time your hand twitched. Whatever that is, the lamp knows it.

*Continues to `emberhold.maren.intro_go`.*

`emberhold.maren.intro_go`

**OLD MAREN:** Shards glow, so they're easy to spot. Some Hushborn carry them too. Hit the bright spot in the middle and they'll drop them.

**OLD MAREN:** Where the path's broken, run and jump. Folk holding a shard can leap farther than they should, and yours is part of you.

**OLD MAREN:** If you get hurt, come back and I'll patch you up. And say hello to Kestrel at the dock.

*When the scene ends, the quest "Five Shards for the Lamp" begins. Shards out on the island can now be sensed and picked up (`shard_sense`).*

### Maren, while you're still searching

`emberhold.maren.waiting`

**OLD MAREN:** There you are. Sit and let me look at you. You've got {shards} so far, and the lamp needs five.

**OLD MAREN:** If the hill's picked clean, try the far side of the broken span, east of the lamp. Be careful out there.

*When the scene ends, the Wayfarer's health is restored.*

### Kestrel, before the lamp

`emberhold.kestrel.span`

*Vane's Perch, a small dock at the island's edge. A woman in flight goggles is hammering a patch onto a little skiff that's mostly patches already.*

**KESTREL VANE:** Hey, it's the sleeper! Kestrel Vane. And this beauty's the *Quickmercy*, fastest skiff on the wind. Ignore the patches.

**KESTREL VANE:** Yes, a sailor sitting on a dock. With the lamp this low, Hushborn come up into the wind lanes. I'm not taking her out till it's lit.

**KESTREL VANE:** Maren's got you hunting shards? East of the lamp, the old stone span's broken. Too far to jump on foot, but I hear that hand does tricks.

**KESTREL VANE:** On the far side, check behind the standing stones. Shards pile up back there, out of the wind.

- "Come with me." → `emberhold.kestrel.span_no`
- "What's in it for you?" → `emberhold.kestrel.span_pay`

`emberhold.kestrel.span_no`

**KESTREL VANE:** Me, on foot? No thanks, mate. Light that lamp and I'll take you anywhere the wind goes.

`emberhold.kestrel.span_pay`

**KESTREL VANE:** Honestly? No lamp, no sailing. No sailing, no paying work. You light it, I eat this month.

*When the scene ends, the broken span is marked on the map.*

`emberhold.kestrel.dark`

*If you come back before the lamp is lit.*

**KESTREL VANE:** Still dark up there. The span's east of the lamp. Get a running start and dash right at the edge.

**KESTREL VANE:** And check behind those stones.

*When the scene ends, nothing changes.*

### Whisper Hollow (optional)

`emberhold.cantor.intro`

*Whisper Hollow, a misty dip in the hills. A tall figure in a pale mask and gold-trimmed robes sits on a rock, as if they've been expecting you.*

**THE CANTOR:** Hello. Please don't be alarmed. I'm called the Cantor, and I lead the Hollow Choir. You may hear unkind things about us.

**THE CANTOR:** May I see your hand? Remarkable. That's a piece of the Heartshard, you know. The very thing that broke the sky.

**THE CANTOR:** Maren will tell you the lamps are saving us. Ask her how many islands have fallen in her lifetime, lamps and all.

- "What does the Choir want?" → `emberhold.cantor.want`
- "Stay away from Maren." → `emberhold.cantor.warn`

`emberhold.cantor.want`

**THE CANTOR:** For the suffering to stop. The sky has been falling for a hundred years. We'd like it to finish, so the world can begin again.

**THE CANTOR:** Light her lamp. I won't stop you. Just keep an open mind.

`emberhold.cantor.warn`

**THE CANTOR:** Of course. I have nothing against her. She's a good woman, doing her best with what she was taught.

*When the scene ends, sets `met_cantor = true`.*

`emberhold.cantor.again`

**THE CANTOR:** Hello again. Did you ask Maren about the fallen islands?

**THE CANTOR:** She'll know the number. She's watched them go out from that hill. I'll be here if you want to talk.

*When the scene ends, nothing changes.*

### The lamp is lit (cutscene)

*No dialogue node. You set five shards on the plinth. As your hand comes near, the shard in your palm burns hot, and the lamp flares gold all at once, far brighter than it should. The Hushborn on the hill scatter. Light runs from the lamp back into your hand, and your next dash carries you twice as far. You've learned Shardstep.*

### Maren, after the light

`emberhold.maren.lamp_lit`

*Maren has climbed the hill. She's out of breath, looking from the lamp to you and back.*

**OLD MAREN:** I saw that from the garden. Shards don't do that. That lamp hasn't burned so bright since I was a girl.

**OLD MAREN:** Your hand lit up before the lamp did. I don't know what you are, love, but I'm glad you came.

**OLD MAREN** *(if `asked_maren = hush`)*: You asked me about the Hush. Look, it's pulling back from the cliffs. That's your doing.

**OLD MAREN** *(if `asked_maren = hand`)*: You asked what that shard was. I still can't tell you. But I think the lamps could.

**OLD MAREN:** There's something else. Cinderveil's lamp, out west, went dark a week ago. No one's heard a word from them since.

**OLD MAREN:** The Lanternwrights there would never let it go out. Something's wrong. Kestrel can take you.

*When the scene ends: `quest_lamp_done`. Kestrel's offer unlocks at the dock.*

### Kestrel's offer

`emberhold.kestrel.offer_sail`

**KESTREL VANE:** You did it! I saw that from down here. Looked like a second sunrise.

**KESTREL VANE:** Maren tell you about Cinderveil? I run cargo there. A week dark means they're in real trouble.

**KESTREL VANE:** I'll take you. Free this trip, since you lit my lamp. After that I charge like anybody else.

- "Let's go." → `emberhold.kestrel.sail_yes` *(sets `sail_answer = yes`)*
- "What's waiting for us there?" → `emberhold.kestrel.sail_what` *(sets `sail_answer = ask`)*
- "I met someone in a mask, in Whisper Hollow." → `emberhold.kestrel.sail_cantor` *(only if `met_cantor`; sets `sail_answer = cantor`)*

`emberhold.kestrel.sail_yes`

**KESTREL VANE:** That's what I like to hear. Climb aboard when you're ready.

`emberhold.kestrel.sail_what`

**KESTREL VANE:** Cinderveil's a mining island. Ash on everything. Lowmoor Quay's the town: good people, awful tea.

**KESTREL VANE:** With the lamp out, there'll be Hushborn on the ridge. Bring that hand.

`emberhold.kestrel.sail_cantor`

**KESTREL VANE:** Gold trim? Very polite? That's the Cantor. They lead the Hollow Choir. Half the Driftborn won't dock anywhere they've been.

**KESTREL VANE:** They want the sky to finish falling. Whatever they told you, don't buy it.

*When the scene ends (after any reply): `open_sail_menu`.*

`emberhold.kestrel.docked`

*If you talk to Kestrel again before setting sail.*

**KESTREL VANE:** Ready? Cinderveil's half a day west. Just say the word.

**KESTREL VANE** *(if `sail_answer = ask`)*: Still ash, still Hushborn, still awful tea. Nothing's changed.

**KESTREL VANE** *(if `sail_answer = cantor`)*: And if that mask turns up again, walk the other way.

*When the scene ends, the sail menu opens again.*

### Barks

`bark.maren.scar` — **OLD MAREN:** Stay away from the Scar after dark. That's where they climb up.

---

## The crossing

`cinderveil.sail.depart`

**KESTREL VANE:** Lines off! Grab the rail and keep a hand on it. One rule on my boat: nobody goes over the side.

**KESTREL VANE:** I'm Driftborn. When the sky broke, my great-grandparents' island went into the Hush. They were out fishing, so they lived.

**KESTREL VANE:** We've lived on the wind ever since. Cargo, fishing, never settling anywhere.

*When the scene ends, the skiff picks up speed.*

`cinderveil.sail.lane`

*The skiff slides into a current of moving air. Faint streaks of light run ahead of it.*

**KESTREL VANE:** This is a wind lane. Stay in one and you fly. Drift out and you start sinking toward the Hush.

**KESTREL VANE:** See those lights down there, moving? Hushborn. When a lamp goes out, they rise and follow boats. I lost two friends that way last spring.

**KESTREL VANE:** So yes, I sat on the dock. I like being brave. I like being alive more.

*When the scene ends, the crossing continues.*

`cinderveil.sail.sight`

*A grey island rises out of the cloud. Smoke drifts over its ridge. The lamp on top is dark.*

**KESTREL VANE:** That's Cinderveil. You can usually see that lamp from an hour out.

**KESTREL VANE:** Hold on. I'm bringing us in to Lowmoor Quay.

*When the scene ends, the skiff docks.*

---

## Cinderveil

### Lowmoor Quay

`cinderveil.kestrel.arrive`

*Lowmoor Quay. Ash covers everything. The shutters are nailed closed, and the few people outside hurry past with their heads down.*

**KESTREL VANE:** This is grim. Last time I was here, there was music on this dock.

**KESTREL VANE:** Go find Tamsin Reed. She's got a workbench by the warehouse. If anyone knows what's going on, it's her, and she'll tell you all of it.

**KESTREL VANE:** I'll stay with the *Quickmercy*. People get desperate when the lamp's out, and she's our only way home.

*When the scene ends, Tamsin's bench is marked on the map.*

### Tamsin Reed

`cinderveil.tamsin.cogs_start`

**TAMSIN REED:** Oh! Is that it? Is that the shard? Kestrel said, but I thought she was joking, she jokes a lot. Sorry. Hi. I'm Tamsin.

**TAMSIN REED:** Okay, idea. I built a grapple line, but nothing I have can power it. A raw shard could. *Your* shard could!

**TAMSIN REED:** You'd hook onto ledges and pull yourself across gaps. I just need three cogs to finish it. The old mine carts in the Ashfields are full of them, north of the quay.

- "I'll find them." → `cinderveil.tamsin.cogs_yes`
- "Why would I need a grapple?" → `cinderveil.tamsin.cogs_why`

`cinderveil.tamsin.cogs_yes`

**TAMSIN REED:** Yes! Watch out for Hushborn out there. They've gotten really bold. Knocking-on-doors bold.

`cinderveil.tamsin.cogs_why`

**TAMSIN REED:** Because of the Ember Vault! It's the cave under the ridge where the island's core is. The core keeps Cinderveil in the air, and the lamp runs off it.

**TAMSIN REED:** Something got in there, and the lamp died the same night. The bridge burned too, so a grapple's the only way across.

*When the scene ends (after either reply): `quest_cogs_start`.*

`cinderveil.tamsin.cogs_waiting`

**TAMSIN REED:** Any luck? No, I can tell. You're not clinking.

**TAMSIN REED:** Try the tipped-over carts in the Ashfields. The cogs roll out and get buried.

*When the scene ends, nothing changes.*

`cinderveil.tamsin.grapple_gift`

**TAMSIN REED:** Three! You got all three! Okay, hold out your hand. This won't hurt. It might tingle. Probably just tingle.

*Tamsin clamps a small brass reel to your wrist and threads its line into the shard. The shard pulses, and the reel hums.*

**TAMSIN REED:** Done! Aim at a hook point and the shard does the rest. Just don't let go over the Hush.

**TAMSIN REED:** Now go show Warden Ilsa. She said nobody goes near the Vault without a way across. Now you've got one.

*When the scene ends: `grant_grapple`.*

### Brother Hesk

`cinderveil.hesk.rumor`

*Behind a stack of crates by the water, a thin man in a torn grey robe flinches when you come close.*

**BROTHER HESK:** Oh! Sorry. Sorry, I thought you were... never mind. Please don't tell anyone I'm here.

**BROTHER HESK:** I'm H-Hesk. Brother Hesk. I was in the Hollow Choir. I left. They don't really let people leave.

**BROTHER HESK:** You're the one with the shard, aren't you? Then you should know. The thing in the Ember Vault... the Choir put it there.

- "Take your time. Tell me everything." → `cinderveil.hesk.steady` *(sets `hesk_mood = steady`)*
- "Get to the point." → `cinderveil.hesk.pressed` *(sets `hesk_mood = pressed`)*

`cinderveil.hesk.steady`

**BROTHER HESK:** Th-thank you. Sorry. It's a Cinder Maw, a huge Hushborn. They lured it up from the Hush with burning shards and led it into the Vault.

**BROTHER HESK:** It's eating the island's core. That's why the lamp died. When the core's gone, Cinderveil falls.

**BROTHER HESK:** And it's a test. For you. The Cantor wanted to see what the shard-bearer would do. They knew you'd come.

**BROTHER HESK:** If you beat it, the Cantor will come to you, and they'll be kind. Please remember I warned you.

`cinderveil.hesk.pressed`

**BROTHER HESK:** S-sorry! There's a Cinder Maw in the Vault, eating the core. If it finishes, the island falls.

**BROTHER HESK:** The Choir led it there. That's all. I'm sorry, I can't... please, just go.

*When the scene ends, the Ember Vault is marked on the map.*

### Warden Ilsa

`cinderveil.ilsa.trial`

*Plays only once you have the Grapple. On a cliff above a wide chasm, a woman in scarred Lanternwright armor stands guard. The Vault door glows on the far side.*

**WARDEN ILSA:** Halt. Warden Ilsa, Lanternwright Order. That's a grapple. Tamsin's?

**WARDEN ILSA:** Something in the Vault is eating the core. The bridge burned. My orders are to hold this cliff.

**WARDEN ILSA:** I can't cross. You might. Make it over and the Vault is yours. Fall, and nobody comes for you.

- "Understood." → `cinderveil.ilsa.cross`
- "Hesk says the Choir put the Maw there." → `cinderveil.ilsa.hesk` *(only if you've talked to Hesk)*
- "Hesk says it's a test. For me." → `cinderveil.ilsa.test` *(only if `hesk_mood = steady`)*

`cinderveil.ilsa.cross`

**WARDEN ILSA:** Good. Go.

`cinderveil.ilsa.hesk`

**WARDEN ILSA:** The deserter. He told me too, after two days of apologizing. I believe him. It doesn't change the job.

`cinderveil.ilsa.test`

**WARDEN ILSA:** Then pass it. Go.

*When the scene ends: `vault_open`.*

### The Cinder Maw

`cinderveil.maw.prefight`

*The Ember Vault. The island's core, a crystal the size of a house, glows a weak orange. Wrapped around it, chewing, is an enormous shape of grey cloud and live embers.*

*It turns toward you. A bright point of light pulses in the middle of its chest. That's where to hit it.*

*When the scene ends: `boss_start`.*

`cinderveil.maw.defeated`

*The Cinder Maw comes apart into drifting ash. The core is cracked and dim, but whole.*

*The shard in your hand pulls toward the ridge above, where the lamp is waiting.*

*When the scene ends, the path up to the ridge opens.*

### The lamp, relit

`cinderveil.lamp.relit`

*You press your hand to the cold lamp on the ridge. The shard burns hot, and orange light climbs the glass, then pours out across the island.*

*Down at Lowmoor, lights come on in window after window. The Hush pulls back from the shore.*

**WARDEN ILSA:** I watched from the cliff. That was well done. I was wrong about you.

**WARDEN ILSA:** I'm sending word to the Order at Highspire. They'll want to see that hand.

*When the scene ends: `quest_cinder_lamp_done`. Footsteps on the ridge path.*

### The Cantor

`cinderveil.cantor.confront`

*A figure in a pale mask walks up the ridge path, alone and unhurried. Ilsa reaches for her sword. The Cantor raises both open hands.*

**THE CANTOR** *(if `met_cantor`)*: Hello again, Wayfarer. You lit Maren's lamp, and now this one. I hoped you would.

**THE CANTOR** *(if not `met_cantor`)*: Hello, Wayfarer. I'm the Cantor, of the Hollow Choir. I've wanted to meet you for some time.

**THE CANTOR:** I owe you honesty, so here it is. The Maw was ours. I needed to know if the shard chose you, or just landed on you.

**THE CANTOR:** It chose you. The lamps have never answered anyone the way they answer you.

**THE CANTOR:** The sky has been dying for a hundred years, one island at a time. Each lamp you light buys a few years of fear. Then it goes out, and the people go down with it.

**THE CANTOR:** That shard is the last of the Heartshard. With it, we could let the sky come down all at once, gently, and let the world start over.

**THE CANTOR:** I won't take it from you. Give it to me, or better yet, come with us. What do you say?

- "Just go. Leave Cinderveil alone." → `cinderveil.cantor.spare` *(sets `cantor_choice = spare`)*
- "Tell me the rest." → `cinderveil.cantor.listen` *(sets `cantor_choice = listen`)*
- "No. I'm keeping the lamps lit." → `cinderveil.cantor.refuse` *(sets `cantor_choice = refuse`)*

`cinderveil.cantor.spare`

**THE CANTOR:** That's fair. You've had a long day, and I've given you a lot to think about.

**THE CANTOR:** The Choir will leave Cinderveil alone. You have my word. When you're ready to talk, we'll find you.

`cinderveil.cantor.listen`

**THE CANTOR:** Thank you. Most people have stopped me by now.

**THE CANTOR:** Ask yourself why this lamp failed so fast. The lamps draw on the island cores, and every core is running down. The Maw only sped this one up.

**THE CANTOR:** Saltmere's core is nearly spent. Its lamp will go dark before the next full moon, and I won't have to lift a finger. Go and see for yourself.

**THE CANTOR:** When you've watched a whole island fall, come and find me. I think you'll understand then.

`cinderveil.cantor.refuse`

**THE CANTOR:** I'm sorry to hear that. I mean it.

**THE CANTOR:** Then I'll stop asking. Wherever you go, the Choir will be there, and sooner or later that shard comes with us.

**THE CANTOR:** Goodbye, Wayfarer. Light as many lamps as you like.

*Whichever reply you choose, the Cantor then walks down the path and is gone. When the scene ends: `act1_end`, and the matching Kestrel epilogue plays.*

### Epilogues

*Back at Lowmoor Quay, Kestrel is waiting at the gangplank.*

`cinderveil.kestrel.epilogue_spare`

**KESTREL VANE:** Ilsa told me. You just let them walk off? Your call, mate. I'll be sleeping with one eye open.

**KESTREL VANE:** She says the Lanternwrights want you at Highspire. Good news is they pay. Let's go.

`cinderveil.kestrel.epilogue_listen`

**KESTREL VANE:** Saltmere? I've got friends on Saltmere. If that mask is right about the full moon, we haven't got long.

**KESTREL VANE:** Highspire first. The Lanternwrights are the only ones who can tell us if it's true. Get aboard.

`cinderveil.kestrel.epilogue_refuse`

**KESTREL VANE:** You told the Cantor no, to their face? Bravest thing I've seen all year. Maybe also the dumbest.

**KESTREL VANE:** Ilsa says the Order wants you at Highspire. Let's get there before the Choir does.

*The* Quickmercy *pulls away from the quay. Behind it, Cinderveil's lamp burns orange. Ahead lies Highspire, and the last of the Lanternwrights. End of Act 1.*

### Barks

`bark.tamsin.bench` — **TAMSIN REED:** Don't touch the tea! There's a bolt soaking in it. It's a long story. It's actually a short story.

`bark.hesk.crate` — **BROTHER HESK:** I'm not hiding. I'm... yes, I'm hiding. Sorry.

`bark.ilsa.no_grapple` — **WARDEN ILSA:** No way across, no crossing. Come back when you can reach the far side.

---

## Things you can look at

*Inspect text. The bold label names the object; nobody is speaking.*

### Emberhold

`inspect.waking_stones` — **WAKING STONES:** A ring of old standing stones. The grass in the middle is flattened in the shape of a person. That was you.

`inspect.scar` — **THE SCAR:** A long tear in the meadow where the ground drops into the Hush. A sign reads: KEEP BACK AFTER DARK. —M.

`inspect.quickmercy` — **THE QUICKMERCY:** The name is hand-painted on the bow, and the paint is fresh. There are more patches than original wood.

`inspect.lamp_cold` — **GREAT LAMP:** Emberhold's lamp. The glass is cold, and the light inside barely flickers. The plinth has five empty sockets.

`inspect.lamp_hungry` — **GREAT LAMP:** The light brightens a little as your hand comes near. You have {shards} of 5 shards.

`inspect.lamp_lit` — **GREAT LAMP:** A steady gold light. The mist has backed away from the cliffs.

`inspect.wrong_sky` — **STANDING STONES:** A row of stones, all facing the lamp. Dirt and leaves have piled up behind them, out of the wind.

`inspect.heartblossom` — **HEARTBLOSSOM:** A small red flower that only grows near lamps. Maren uses it for burns.

`inspect.rope_bridge` — **ROPE BRIDGE:** A sign reads: ONE AT A TIME. Someone has scratched underneath: OR NONE.

`inspect.span_planks` — **BROKEN SPAN:** What's left of the old stone span. The gap is too wide to cross on foot.

`inspect.sail_patch` — **SAIL PATCH:** A bright yellow patch, neatly stitched. Along the seam: K.V. FIXED THIS. DON'T TOUCH.

### Cinderveil

`inspect.lowmoor_sign` — **QUAY SIGN:** LOWMOOR QUAY. Chalked underneath: LAMP OUT. STAY INSIDE AFTER DARK.

`inspect.tamsin_bench` — **TAMSIN'S BENCH:** Springs, wire, half-built gadgets, and a cold cup of tea. A note on the vise says NEED 3 COGS!!!

`inspect.ash_cog` — **COG:** A brass cog half-buried in ash, still in good shape. Tamsin will want this.

`inspect.vault_seal` — **VAULT DOOR:** A heavy iron door stamped with the Lanternwright crest. It's warm to the touch.

`inspect.cinder_core` — **CINDERVEIL'S CORE:** The crystal that holds the island up. Deep bite marks run across its surface.

`inspect.maw_tooth` — **MAW TOOTH:** A tooth as long as your arm, made of hardened ash. It crumbles when you touch it.

`inspect.choir_crate` — **HESK'S HIDEOUT:** A blanket, half a loaf of bread, and a stack of Choir pamphlets. The top one reads: LET THE SKY FALL. LET THE WORLD BEGIN AGAIN.

`inspect.ilsa_order` — **POSTED ORDER:** THE EMBER VAULT IS CLOSED BY ORDER OF THE LANTERNWRIGHTS. NO EXCEPTIONS. —WARDEN ILSA

`inspect.quay_bell` — **QUAY BELL:** The town's warning bell. The rope is frayed from being rung so often.

`inspect.ember_path` — **PATH LAMPS:** A row of small lamps leading up the ridge, all dark.
