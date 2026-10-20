# Shardfall — Act 2: The Wider Hush

*Script draft v1, for Brian's review. Document only. Nothing in this file is spoken in the game until you approve it.*

## Story so far / Act 2 summary

### Story so far

A hundred years ago the Heartshard cracked. The world is islands over a cloud sea called the Hush. Anything that falls in can come back as a Hushborn. Lamps built from sky-shards keep them off the islands that still have a keeper.

The Wayfarer woke on Emberhold with no memory and a shard grown into one hand. Old Maren asked for five sky-shards. The Wayfarer relit her lamp. Kestrel Vane then sailed them on the *Quickmercy* to Cinderveil, whose lamp had gone dark. Tamsin Reed fitted a grapple to the shard. Brother Hesk, a Choir deserter, said the Hollow Choir had lured a Cinder Maw onto the island's core. Warden Ilsa let the Wayfarer cross into the Ember Vault. The Wayfarer beat the Maw and relit Cinderveil's lamp.

The Cantor, who leads the Choir, said the Maw was a test and asked for the shard. The Wayfarer told them to leave, or heard them out, or refused. Kestrel cast off for Highspire, where the last Lanternwright council sits. If you listened, the Cantor said Saltmere's lamp would fail before the full moon, and that they would not have to touch it.

### Act 2, in short

Kestrel stops being only the ride, and Tamsin makes the boat before it hits the wind lane. On the way to Highspire they see Saltmere's lamp skipping and dock at a fishing town on stilts. Harbormaster Holt is packing boats. Lamp keeper Sera Dunne is in bed, sick from the mist in the Sunken Wreck, and the lamp is starving because something is on the core cable under that wreck.

Pip, Lark, and the fisher Jory have all seen a long shape under the hull. Down in the wreck, the shape is a Tidewyrm. What the Choir did about it depends on the answer you gave the Cantor: they watched, they lured it, or they tried to crack the housing and ran. The party kills the wyrm, Tamsin reconnects the feed, and the lamp steadies. Sera is clear that the core is still wearing out.

The Choir is already moving on Highspire. The party sails to Lowgate, climbs the switchback, and stops at a shut gate. The council will not open it while Choir people are in the city. That is as far as this act plays.

### People

Returning, and how they talk:

- **The Wayfarer.** Still speaks only by choosing a reply. The battle barks at the end are the one exception, and they are optional.
- **Kestrel Vane** (she/her). Blunt, funny, practical. She says "mate" when she's being friendly or telling you off. She talks about the boat, the money, and her friends.
- **Tamsin Reed.** Excited, and already on her next sentence. She explains machines, then explains the explanation.
- **The Cantor.** Not on screen. Their orders are in the wreck, in the same polite voice as Act 1.

New:

- **Brenna Holt**, harbormaster. Loud, busy, gives orders. Old friends with Kestrel.
- **Osric Pell**, keeper of the Stilthouse inn. Feeds people first. Repeats himself when he's worried.
- **Nessa Quinn**, at Quinn's Hooks. Prices, stock, and no tab.
- **Sera Dunne**, lamp keeper. Sick, short of breath, precise. Hates being fussed over.
- **Pip** and **Lark**, dock kids. Pip talks big. Lark corrects him and is usually right.
- **Jory Hale**, fisher. Slow, concrete, embarrassed that the kids were braver than he was.
- **Warden Brant**, at Highspire's gate. Says the rule, then the reason, if you ask.
- **Dorrie Fen**, Lowgate shop. Sells to people going up a dangerous road.
- **Maud Keel**, the Switchback inn. Very few words.
- **Ellis Ward**, not a Choir member. His brother Tom died when Pebblewick fell, lamp still lit. He talks about that, not about fate.
- **Sile Voss**, Drift Market. Starts a sales pitch, then says the plain version.

### Act 2 beats

1. Just off Lowmoor, Kestrel joins the fights. Tamsin hails the boat and comes aboard.
2. Saltmere's lamp is visible from the lane, failing. You dock. (If you listened, this is the island the Cantor named. Otherwise you find it by looking.)
3. Holt, Osric, Nessa, the kids, and Jory each know a piece. Sera knows the job: go into the Sunken Wreck and get whatever it is off the core feed.
4. Tamsin talks you through the grapple. A dry cabin holds the Choir's next move.
5. You fight the Tidewyrm, reconnect the feed, and the lamp holds. The core is still cracked.
6. Optional: Gullrock, and Sile Voss on the Drift Market.
7. Lowgate will sell you gear and a bed either way. Brant will not open the gate before Saltmere is safe.
8. After the lamp, you climb the switchback. The gate stays shut. Play stops there.

### Flags this act reads

From Act 1:

- `cantor_choice` = `spare` | `listen` | `refuse`. Changes the sail-in, the proof in the wreck, what Sera says about it, Ellis, and the gate.
- `hesk_mood` = `steady` | `pressed`. Changes what you can say about the cabin. If you never spoke to Hesk, the flag is unset and those replies stay hidden.
- `sail_answer` = `yes` | `ask` | `cantor`. One extra line from Kestrel as you leave Cinderveil, and a callback if you warned her about the mask.
- `met_cantor` = `true`. You have met the Cantor on Emberhold, not only on the ridge. Changes a cabin line and a gate line.

If a save somehow has no `cantor_choice`, play the `spare` proof and the discovery version of the sail-in, and do not mention a promise.

### Flags and events this act sets

- `party_kestrel` = `true`. Kestrel fights with you. Banner: "Kestrel joined the party." If the sail to Cinderveil already set this, do not show the banner again.
- `party_tamsin` = `true`. Tamsin is aboard. Banner: "Tamsin joined the party." If the grapple gift already set this, do not show the banner again.
- `asked_holt` = `boats` | `lamp`. What you asked the harbormaster first.
- `kids_told` = `true`. Pip and Lark have told you about the shape.
- `jory_told` = `true`. Jory has told you about the net.
- `sera_job` = `true`. Sera has sent you into the wreck.
- `found_proof` = `true`. You have read what the Choir left.
- `tidewyrm_dead` = `true`.
- `saltmere_lamp` = `lit`. The feed is reconnected and the lamp is steady.
- `ellis_talked` = `true`.
- `gate_waiting` = `true`. The act's last scene has played.
- `met_voss` = `true`.
- `gullrock_landed` = `true`.

Events, for other lanes to hook. These are not spoken.

- `party_kestrel`, `party_tamsin`
- `quest_saltmere` — tracker: "Talk to Sera Dunne, at the lamp house."
- `quest_wreck` — "Get whatever is on the core off it. Sunken Wreck, west pier."
- `boss_tidewyrm`
- `saltmere_lamp_lit`
- `quest_highspire` — "Sail to Highspire. The gate is above Lowgate."
- `inn_rest` — full heal, save, field enemies come back
- `act2_end` — the gate stays locked

You can talk to Saltmere in any order. Sera is the one who starts the wreck. Gullrock and the Drift Market can be sailed to any time after you leave Cinderveil. Highspire's town can be visited early. The gate scene that ends the act waits until `saltmere_lamp = lit`.

---

## Leaving Cinderveil

`cinderveil.depart.kestrel`

*A minute off Lowmoor Quay. Cinderveil's lamp burns orange behind the stern. Kestrel has the tiller. The rail is cold.*

**KESTREL VANE** *(if `cantor_choice = spare`)*: We're off. I'm not going to spend the whole trip on what you said to that mask. I'll spend a little of it. You let them walk. I'll live with it if you will.

**KESTREL VANE** *(if `cantor_choice = listen`)*: Highspire first, like I said at the quay. I want a Lanternwright who isn't wearing a mask to tell me if Saltmere's really dying. Maren's too far to ask, and she's got her own lamp to watch.

**KESTREL VANE** *(if `cantor_choice = refuse`)*: You told them no. Good. Don't get comfortable. If they meant that goodbye, they'll be on the next dock we use.

**KESTREL VANE** *(if `sail_answer = yes`)*: Back on Emberhold you didn't ask me much. You said let's go. I liked that. Keep a hand on the rail anyway.

**KESTREL VANE** *(if `sail_answer = ask`)*: You asked what was waiting on Cinderveil. Ash, Hushborn, bad tea. I was right, and I didn't enjoy it. I don't have a guess for Highspire yet.

**KESTREL VANE** *(if `sail_answer = cantor`)*: You told me about the mask in Whisper Hollow. I said don't buy it. I'm still saying that.

**KESTREL VANE:** New rule. On Cinderveil I stayed with the boat while you walked into a cave. I'm not doing that again.

**KESTREL VANE:** Something comes at you, I get a shot at it. That's me joining up. You still haven't paid me, so I'm also keeping you where I can see you.

- "Glad you're here." → `cinderveil.depart.kestrel_glad`
- "You can still stay with the boat." → `cinderveil.depart.kestrel_boat`

`cinderveil.depart.kestrel_glad`

**KESTREL VANE:** Don't get soft about it, mate. Watch the water.

*When the scene ends: banner "Kestrel joined the party." Sets `party_kestrel`.*

`cinderveil.depart.kestrel_boat`

**KESTREL VANE:** I can stay with the boat and still shoot. I'm talented. You're not leaving me behind, though. I decided that part already.

*When the scene ends: banner "Kestrel joined the party." Sets `party_kestrel`.*

### Tamsin makes the boat

`cinderveil.depart.hail`

*Before the skiff picks up the lane, someone on the quay is shouting and waving a crate.*

**TAMSIN REED:** Wait! Don't get in the lane! I have the spare spring and the good clamps and I quit! I didn't quit. There's nobody left to quit to!

**KESTREL VANE:** That's Tamsin. I'm turning around. Grab a line. I'm not fishing both of you out.

*The* Quickmercy *bumps the quay again. Tamsin dumps the crate on the deck and climbs after it.*

**TAMSIN REED:** Hi. Sorry. Hi. The grapple's still on your wrist, and the safety sticks when it's cold.

**TAMSIN REED:** Cinderveil's core has a crack I can fit a nail in. If the next island's core is cracking, I want to measure it. Also, Kestrel still has my good coil.

**TAMSIN REED:** Also, I'm not staying here. The quay's empty and I was talking to the kettle.

- "Get on." → `cinderveil.depart.tamsin_yes`
- "Is the grapple going to fail?" → `cinderveil.depart.tamsin_grapple`

`cinderveil.depart.tamsin_yes`

**TAMSIN REED:** Yes. Thank you. I'll sit. There's no room to sit. I'll hold the crate.

**KESTREL VANE:** Crate under the seat. Feet off the new patch.

*When the scene ends: banner "Tamsin joined the party." Sets `party_tamsin`. The skiff leaves Lowmoor for good.*

`cinderveil.depart.tamsin_grapple`

**TAMSIN REED:** Fail is a big word. It sticks. If it sticks over a gap, you hang there until somebody hits the release by your thumb, and the somebody is me.

**TAMSIN REED:** So I should be nearby. That's the argument.

**KESTREL VANE:** She's aboard. Crate under the seat. We're going.

*When the scene ends: banner "Tamsin joined the party." Sets `party_tamsin`. The skiff leaves Lowmoor for good.*

---

## Saltmere, sighted

`saltmere.sail.sight`

*The lane bends. A town on tall stilts comes up out of the cloud. Its lamp should be a steady white. It flares orange, goes dim, and flares again.*

**KESTREL VANE:** That's Saltmere. Stilts, nets, people I drink with. That lamp shouldn't skip like that.

**KESTREL VANE** *(if `cantor_choice = listen`)*: The Cantor named this place. Full moon's a few days off. I'm not using those days to go look at a council. We're going in.

**KESTREL VANE** *(if `cantor_choice = spare` or `refuse`)*: I didn't need a mask to tell me to stop. I can see the lamp from here. Highspire can wait a day.

**TAMSIN REED:** If a lamp's skipping, either the cable's loose or the core's putting out less. Those are different problems. They look the same from up here, which is rude of them. I have to see the housing.

- "Take us in." → `saltmere.sail.dock`
- "How long can a lamp skip?" → `saltmere.sail.howlong`

`saltmere.sail.howlong`

**KESTREL VANE:** Hours. Sometimes a night. Then it's dark, and the Hush comes up between the stilts. I've seen the empty ones. We're not adding to the list.

*Continues to `saltmere.sail.dock`.*

`saltmere.sail.dock`

**KESTREL VANE:** Lines ready. The gap between the boat and the pier moves. Step when I say, not when you feel brave.

*When the scene ends, you are on Saltmere's pier. Sets `quest_saltmere`.*

### If something boards on a crossing

`sea.raiders.board`

*Now and then, Hushborn get a hand on the rail. This can happen on any sail.*

**KESTREL VANE:** Boarders. On my deck. Get them off, mate. If you put a hole in the rail, I will be upset about the rail.

**TAMSIN REED:** They're wet and they're sparking. Both of those are bad next to the coil. I'll stand in the middle. Nobody throw one at me.

*When the scene ends, the fight `sea_hush_raiders` starts.*

`sea.raiders.done`

**KESTREL VANE:** Count the patches when you get a second. If there's a new hole, I want to know before the wind does.

---

## Saltmere

*A fishing town on stilts. Planks shift. Nets hang under the walkways. The lamp on the high platform keeps missing its beat. Three boats on the far rail, out of the wind, are half full of crates. People are out, but they are not working. They are waiting.*

### Harbormaster Holt

`saltmere.harbormaster.intro`

*A woman in a salt-stiff coat is counting crates onto a boat and shouting at a deckhand at the same time.*

**HARBORMASTER HOLT:** Vane! That boat's still more patch than hull. You, with the hand. I'm Brenna Holt. Harbormaster. Holt is enough.

**HARBORMASTER HOLT:** The lamp's been skipping for four days. I sent word up the lane a week ago, when it first went weak. Nobody came. Then you did.

**KESTREL VANE:** Holt. Where do you want us?

**HARBORMASTER HOLT:** Lamp house. Sera Dunne keeps it. She's sick, she's awake, and she won't let me put anyone else on that lamp. Talk to her before you touch it.

- "Why are the boats loaded?" → `saltmere.harbormaster.boats` *(sets `asked_holt = boats`)*
- "What's wrong with the lamp?" → `saltmere.harbormaster.lamp` *(sets `asked_holt = lamp`)*
- "I'll talk to Sera." → `saltmere.harbormaster.go`

`saltmere.harbormaster.boats`

**HARBORMASTER HOLT:** Because if the lamp dies tonight, we run. Three boats. That's not the whole town. Sera says if we leave, nobody's here to light it again, and the island goes, boats or not.

**HARBORMASTER HOLT:** She's not wrong. She's also too sick to be the only one deciding. Go hear it from her.

*Continues to `saltmere.harbormaster.go`.*

`saltmere.harbormaster.lamp`

**HARBORMASTER HOLT:** It skips. That's the part I can see. The why is Sera's job, and she's in bed, and the bed is up the stair with the blue door. I keep the pier. She keeps us in the sky. Go.

*Continues to `saltmere.harbormaster.go`.*

`saltmere.harbormaster.go`

**HARBORMASTER HOLT:** West pier is the wreck. Stay off it until Sera says otherwise. And if you see Pip and Lark out there, send them home. They don't listen to me before noon.

*When the scene ends, the lamp house is marked.*

`saltmere.harbormaster.waiting`

*If you talk to her again before the lamp is steady.*

**HARBORMASTER HOLT:** Sera. Blue door. I can't leave this pier. People keep trying to load their chickens and their aunt in the same crate.

**HARBORMASTER HOLT** *(if `asked_holt = boats`)*: And yes, the boats stay loaded. I'm not unpacking on a hope.

`saltmere.harbormaster.after`

*After `saltmere_lamp = lit`.*

**HARBORMASTER HOLT:** I'm taking the crates off. Don't congratulate me. If that lamp blinks again tonight, the crates go straight back on.

**HARBORMASTER HOLT:** Two people in grey robes left in a skiff while you were under the wreck. They asked where the shard-hand was. I told them you were buying eel. They went east, toward Highspire.

**HARBORMASTER HOLT** *(if `cantor_choice = spare`)*: They were polite. You get polite after somebody lets you walk away. I didn't like them.

**HARBORMASTER HOLT** *(if `cantor_choice = listen`)*: One of them said the moon would do the work if you didn't. The moon's still not full, and the lamp's up. They looked annoyed. Good.

**HARBORMASTER HOLT** *(if `cantor_choice = refuse`)*: They didn't wave. People who mean you harm and people who are late look the same from a pier. I watched them until they were small.

**KESTREL VANE:** East is Highspire. Then that's our next dock. After you've yelled at your chickens.

*When the scene ends: `quest_highspire`.*

### Osric Pell, the Stilthouse

`saltmere.innkeeper.intro`

*The inn is one warm room over the water. A big man is stirring a pot like it insulted him.*

**OSRIC PELL:** In, in. Shut the hatch. I'm Osric. This is the Stilthouse. There's a bed, and there's stew, and the stew is eel. I say that first so we can stay friends.

- "I need a bed." → `saltmere.innkeeper.rest`
- "How's Sera?" → `saltmere.innkeeper.sera`
- "Just passing." → `saltmere.innkeeper.leave`

`saltmere.innkeeper.rest`

**OSRIC PELL:** Two marks. You sleep, you wake up mended, and I watch the door. If you were hurt, that part's gone by morning.

**OSRIC PELL:** The things on the shore come back, though. They always do, if you sleep long enough. Brenna says it's the mist. I say it's rude. Both, probably.

- "Here's two marks." → `saltmere.innkeeper.sleep` *(only if you can pay)*
- "I don't have two marks." → `saltmere.innkeeper.broke`

`saltmere.innkeeper.sleep`

**OSRIC PELL:** Bed's through the curtain. Don't thank the stew. It knows what it is.

*When the scene ends: `inn_rest`.*

`saltmere.innkeeper.broke`

**OSRIC PELL:** Two marks is the price even if I like your face. Nessa buys things. Sell her something that isn't nailed down and come back. I'll keep the bed.

`saltmere.innkeeper.sera`

**OSRIC PELL:** She's sick from the wreck, not from a story. She went down the stair, breathed that mist, and came up coughing. I took the ladder away so she can't go back down.

**OSRIC PELL:** She called me three different names and then asked for more soup. She's eating. That's the good part. The cough is the bad part. Go easy, and don't let her get up.

`saltmere.innkeeper.leave`

**OSRIC PELL:** Hatch sticks. Lift it, don't fight it.

`saltmere.innkeeper.again`

**OSRIC PELL:** Stew's still eel. The bed's still two marks. Sera's still angry about the ladder. Nothing's new, except whatever you came in to tell me, and you don't have to.

`saltmere.innkeeper.after`

*After the lamp is steady.*

**OSRIC PELL:** I heard it catch. I was stirring, and the spoon stopped skipping in the pot. That's not science. That's a man with a spoon. Sit down anyway. Winning doesn't dry your coat.

### Nessa Quinn, Quinn's Hooks

`saltmere.shopkeeper.intro`

*Hooks, tins, and folded nets, all labeled. The woman behind the board does not look up until the door shuts.*

**NESSA QUINN:** You're letting the mist in. I'm Nessa Quinn. If you're buying, the prices are on the board. I didn't write them small. The supply skiff didn't come, so this is what I've got.

- "Let me see." → `saltmere.shopkeeper.buy`
- "I'll sell." → `saltmere.shopkeeper.sell`
- "Any news?" → `saltmere.shopkeeper.rumor`
- "That's all." → `saltmere.shopkeeper.leave`

`saltmere.shopkeeper.buy`

**NESSA QUINN:** Tonic closes a cut. Hi-tonic closes a worse one. Ether's for when you're too tired to do the clever thing.

**NESSA QUINN:** Ember salt goes on a blade, not in food. There's a knife that won't rust by Thursday, and a charm I took off a dead gull and washed.

**NESSA QUINN:** I don't do tabs. Not this week.

*When the scene ends, the shop opens.*

`saltmere.shopkeeper.sell`

**NESSA QUINN:** Put it on the cloth. I'll tell you what it's worth. I won't go up if you sigh at me, and I won't go down if I like you.

*When the scene ends, the sell list opens.*

`saltmere.shopkeeper.broke`

**NESSA QUINN:** That's short. Put something back. I'm not a charity and I'm not a tab.

`saltmere.shopkeeper.rumor`

**NESSA QUINN:** Second bell, there was a splash under the west pier that wasn't a net. Jory came in after with half his gear and wouldn't look at anyone.

**NESSA QUINN:** Pip and Lark have been telling the truth since yesterday. The adults are busy being embarrassed about it. That's the news. It doesn't change the prices.

`saltmere.shopkeeper.leave`

**NESSA QUINN:** Shut the door all the way. The tins swell if the mist gets in.

`saltmere.shopkeeper.again`

**NESSA QUINN:** Board's the same. If you need a speech, Osric's got stew and opinions. I've got hooks.

`saltmere.shopkeeper.after`

*After the lamp is steady.*

**NESSA QUINN:** I'll order stock like there's a next week. Don't wait around for a hero discount. Fair price, same as this morning.

**NESSA QUINN:** Jory says his tab on the spare knife is paid. It's yours if you want it. I'm not wrapping it.

*When the scene ends, if you don't already have Jory's knife, it goes into your pack. Once.*

### Sera Dunne

`saltmere.sera.intro`

*The lamp house is one room under the platform. Sera Dunne is in a chair, not the bed, with a blanket on her shoulders and a bucket by her boot. She is maybe fifty, and she looks furious about all of it. The lamp above the roof flares, dims, flares.*

**SERA DUNNE:** Don't hover in the door. I can talk. I can't shout. I'm Sera. If Holt sent you, you're the one who lit Cinderveil. Show me the hand. All right. That's a real one.

**SERA DUNNE:** I'm not cursed. I went down into the wreck to tighten the feed, I breathed the mist, and it sat down in my chest. Osric stole my ladder. I'm going to forgive him later. Not today.

- "What's wrong with the lamp?" → `saltmere.sera.lamp`
- "How sick are you?" → `saltmere.sera.sick`
- "The kids saw something under the wreck." → `saltmere.sera.kids` *(only if `kids_told`)*
- "Jory's net got taken." → `saltmere.sera.jory` *(only if `jory_told`)*

`saltmere.sera.sick`

**SERA DUNNE:** Sick enough that the stair wins. Not sick enough to hand my lamp to a stranger without instructions. Ask me about the lamp. That's the useful question.

*Returns to the choices on `saltmere.sera.intro`.*

`saltmere.sera.kids`

**SERA DUNNE:** Pip exaggerates. Lark doesn't. If she said long, with one light, something big is on the housing.

**SERA DUNNE:** Ask me about the lamp. I'll tell you what that something is. The book on the sill can wait until after.

*Returns to the choices.*

`saltmere.sera.jory`

**SERA DUNNE:** Jory doesn't scare easy, and he hates looking foolish. If he lost a net under the wreck, something down there is big enough to pull. That fits. Listen about the lamp anyway.

*Returns to the choices.*

`saltmere.sera.lamp`

**SERA DUNNE:** Saltmere's lamp doesn't eat loose shards the way Emberhold's does. There's a crystal under the town. That's the core.

**SERA DUNNE:** A copper feed runs from the crystal up to the lamp. The lamp's a lens. The core's the fuel. The feed's the rope between them.

**SERA DUNNE:** The core sits in a housing under the Sunken Wreck. The wreck was a barge, the *Holdfast*. She sank against the housing forty years ago.

**SERA DUNNE:** We kept the hull as a roof. The stairs were inside the hull. The stairs are in the Hush now.

**SERA DUNNE:** Something is on that feed. The lamp skips because the copper's being pulled off the crystal.

**SERA DUNNE:** You go down, you get it off, and you put the copper back on the clamp. Tamsin looks like she owns tools. She can do the clamp. You do the getting-it-off.

**TAMSIN REED:** I do own tools. I can do the clamp. If I can't, I'll say so before I make it worse.

**SERA DUNNE:** West pier. Walk the top deck. The stairs are gone, so you grapple the hook with the red paint. Not the rusty ones. Most of them are rusty. The red one is paint.

**SERA DUNNE:** Don't touch the blue crystals in the hold. They're loose, and they cut.

**SERA DUNNE:** If it's a Tidewyrm, it's a long Hushborn. The bright line under the jaw is the part that matters. Hit that.

**SERA DUNNE:** Then the clamp. Then come back and tell me the lamp's steady. I'll already know if you're lying.

- "I'll go down." → `saltmere.sera.send`
- "Holt wants to run." → `saltmere.sera.boats`

`saltmere.sera.boats`

**SERA DUNNE:** Half the boats will make the lane if we drop. Half won't, depending on which side they start from. I'm not picking the half. Fix the feed. Argue with me after, if you still want to.

*Continues to `saltmere.sera.send`.*

`saltmere.sera.send`

**SERA DUNNE:** Take the book if you want the picture. And tell Osric I'm still angry about the ladder. He'll feel loved.

*When the scene ends: `sera_job`, `quest_wreck`. The Sunken Wreck is marked.*

`saltmere.sera.waiting`

*Before the wyrm is dead.*

**SERA DUNNE:** Red hook. Blue crystals cut. Bright line, if it's a wyrm. I don't have a second speech. I have a cough.

`saltmere.sera.done`

*You come back after the feed is on. She is standing, badly, one hand on the chair.*

**SERA DUNNE:** It caught. I felt it in the floor. Don't look at me like I'm about to drop. I'm going to cough, and then I'm going to check that girl's clamps.

**TAMSIN REED:** The clamps are good. I used two. The book said one. Two is better if you have two. I had two.

**SERA DUNNE:** The book is right, and you got lucky. Leave both. I'm not climbing down there to take one off and be clever.

**SERA DUNNE:** Come out and look at the lamp with me. I want you to see what "fixed" means here, so nobody tells you it's as bright as Emberhold.

*Continues to `saltmere.lamp.relit`.*

### Pip and Lark

`saltmere.kids.intro`

*Two kids sit on a coil of rope under the east walk, where Holt told them not to be. The bigger one has a bucket. The smaller one has the actual crabs, in her hands, because the bucket is empty.*

**PIP:** You're the shard-hand. Brenna said. I'm Pip. This is Lark. We saw it. She says I have to let her talk or I'll get it wrong, and I won't, but she's going to interrupt anyway.

**LARK:** You were going to say it was bigger than the town.

**PIP:** It was huge. It was under the wreck. Lights on it. Like lanterns. We were crabbing. We're allowed to crab.

**LARK:** We're not allowed on the west pier. We were on the east pier. We could see under the hull from there. It was longer than Jory's skiff. It wasn't lights. It was one light, moving.

**PIP:** One light is still a light. We told Brenna. She said go home. Jory said we were making it up, and then he came back with his net all torn and wouldn't talk to us.

- "I believe you." → `saltmere.kids.believe`
- "Stay off the wreck." → `saltmere.kids.warn`

`saltmere.kids.believe`

**LARK:** Good. It's one light. Remember that part when Pip tells it later.

**PIP:** I was going to say one light. Eventually.

*When the scene ends: `kids_told`.*

`saltmere.kids.warn`

**PIP:** We know. East pier only. We can see it from the east pier anyway, so that's a bad rule.

**LARK:** We'll stay off the wreck. You shouldn't, though. Somebody has to go. The grownups are all loading boxes.

*When the scene ends: `kids_told`.*

`saltmere.kids.again`

**PIP:** We already told you. West side, under the hull. Huge.

**LARK:** Longer than the skiff. One light. He's going to add a second head if you let him keep talking.

`saltmere.kids.after`

*After the wyrm is dead.*

**PIP:** Is it gone? Don't do a long story. Just say if it's gone.

- "It's gone." → `saltmere.kids.gone`
- "One light, under its jaw. You were right." → `saltmere.kids.light`

`saltmere.kids.gone`

**PIP:** Good. I didn't actually want to be right. Don't tell Brenna I said that.

**LARK:** She already knows. You get loud when you're scared.

`saltmere.kids.light`

**LARK:** That's what I said. One light.

**PIP:** I said lights, which is almost one. It's gone, though. You can both stop looking at me.

### Jory Hale

`saltmere.jory.intro`

*A fisher sits on an upturned bucket, wrapping a cut across his palm. Half a net lies beside him. The other half is somewhere under the pier.*

**JORY HALE:** If you're here for fish, the fish are gone. I'm Jory. That's my net. Was. Something took it from below and I held on too long, which is why the hand looks like this.

**JORY HALE:** It's not water down there. It looks like water from up here. It's the Hush. I know the difference. I'm telling you what it did, not what I think it is.

- "What did you see?" → `saltmere.jory.saw`
- "The kids saw it too." → `saltmere.jory.kids` *(only if `kids_told`)*

`saltmere.jory.saw`

**JORY HALE:** A bulge under the wreck, and my skiff gone off her line. The *Little Hale*. I tied her at the wreck mooring last night. This morning the line went straight down.

**JORY HALE:** I told Pip he was lying, because I wanted him to be. That was a bad thing to say to a boy who was already scared.

**JORY HALE:** If you're going under there, the mooring's on the west side. Don't stand where the deck dips. It dips into the mist.

*When the scene ends: `jory_told`.*

`saltmere.jory.kids`

**JORY HALE:** Lark said one light. Pip said it was a monster out of a story. I believe Lark.

**JORY HALE:** I told that boy he was lying because I wanted him to be. I'm going to apologize where they can both hear it.

**JORY HALE:** My skiff's down there too. The *Little Hale*. West mooring, line goes straight into the mist. Don't stand where the deck dips.

*When the scene ends: `jory_told`.*

`saltmere.jory.again`

**JORY HALE:** West mooring. Don't stand on the dip. I've only got the one hand that's working, so I'm a poor rescue.

`saltmere.jory.after`

*After the lamp is steady.*

**JORY HALE:** The *Little Hale* is still on the line. Full of salt. I'll haul her up.

**JORY HALE:** I had a spare knife on Nessa's tab. I told her it's paid, and it's yours. I've got six. A person doesn't need six. Don't argue with a man who's embarrassed. Just take the knife.

### Kestrel and Tamsin, in town

`saltmere.kestrel.town`

*Before the lamp is steady.*

**KESTREL VANE:** I'll keep the *Quickmercy* ready and I'll come down the wreck with you. Both. I'm not picking.

**KESTREL VANE:** If Holt says load the kids, we load the kids, and the wyrm waits. She hasn't said it. Don't go looking for that job before she does.

**KESTREL VANE** *(if `sail_answer = cantor`)*: And if you see grey robes, you tell me. You were good about the mask once. Do it again.

`saltmere.tamsin.town`

**TAMSIN REED:** I looked at the lamp from the pier. It's not the glass. The glass is fine. It's the input.

**TAMSIN REED:** Low input looks like a dying lamp. That's a bad way to design a lamp. I'll say that to Sera if she wants. Kindly. I'll be kind.

**TAMSIN REED:** Ember salt sparks on a blade. Don't eat it. I always have to say that part, because people hear "salt."

`saltmere.kestrel.after`

**KESTREL VANE:** Lamp's holding. I'm still sleeping in my boots. Holt saw robes going east. We follow them after you've eaten, mate.

`saltmere.tamsin.after`

**TAMSIN REED:** I want to measure the crack before we go. Sera said I could look and not touch. I can do not-touch. I can do it for a whole minute. Maybe two.

---

## The Sunken Wreck

`saltmere.wreck.too_early`

*If you walk the west pier before `sera_job`.*

**TAMSIN REED:** I want to go in. I want to be clear that I want to go in. We don't know if we're looking for a loose clamp or a bite mark, and Sera does.

**TAMSIN REED:** Get the instructions. Then we can do the dangerous part. I'm in favor of that part too. Just after.

**KESTREL VANE:** What she said. Less of it. Sera first.

`saltmere.wreck.enter`

*The *Holdfast* lies on her side between the pilings, hull above the mist, deck tilted. Rope, chain, and old iron. A stairwell in the middle goes down into grey cloud and does not come back up as stairs.*

**TAMSIN REED:** Okay. Top deck, we can walk. Where the stairs were, we can't. See the hook with the actual red paint? Aim the reel at that. The shard pulls you.

**TAMSIN REED:** If it sticks, there's a lever by your thumb. Hit the lever. Don't hit it the second we leave the deck, or you'll just fall.

**TAMSIN REED:** Blue crystals in the hold are scrap from the old housing. They're sharp. Walk around them. I know they look like loot. They're loot that cuts. We can be rich later.

**KESTREL VANE:** I'll go last, so if you stick I can shoot the lever off. That's a joke. I'll hit it with the knife handle. Mostly a joke.

*When the scene ends, the wreck can be climbed.*

`saltmere.wreck.mast`

*A fallen mast bridges a gap over the mist. Another red hook sits on the far bit of deck, and a chest sits past it.*

**TAMSIN REED:** Same trick. Hook, pull, and don't look down. The chest over there is extra, and I want the extra, because chests in wrecks are how I get clamps.

**KESTREL VANE:** Chests in wrecks are also how people get stuck. We're opening it. I want the clamps too.

`saltmere.wreck.cabin`

*Above the waterline, a cabin door is shut and recently oiled. Inside: a dry blanket, a cold lantern, and no dust on the bench.*

**TAMSIN REED:** Somebody slept here this week. The hinge is new. Rust doesn't take a week off, so a person did this.

*The scene continues as `saltmere.wreck.proof_listen`, `saltmere.wreck.proof_spare`, or `saltmere.wreck.proof_refuse`, matching `cantor_choice`.*

`saltmere.wreck.proof_listen`

*A logbook, weighted with a cup. No cut bolts. No burned shards. Just the book, and a view of the housing through a cracked window.*

**TAMSIN REED:** Nobody filed anything. They wrote it down and watched. The handwriting's neat. You don't write that neatly if you're rushing. They had time.

*The latest pages, in the Cantor's tidy hand:*

*Saltmere. Day one. The core is cracked on the north face. The lamp is down to a weak white. Do not touch it. I told the bearer the truth. Let them see it.*

*Day four. A tidewyrm is on the housing. Still do not touch it. If the lamp fails, the bearer will have seen a town fall. That is what I asked them to see. If the bearer saves the town, go to Highspire ahead of them. The council is the next conversation. Be there first.*

**KESTREL VANE** *(if `met_cantor` and `sail_answer = cantor`)*: You spotted this mask on Emberhold, and I told you not to buy the speech. This is the part I was worried about. They told you a true thing and then sat here hoping the town would prove it.

**KESTREL VANE** *(if `met_cantor` and `sail_answer` is not `cantor`)*: You've talked to them before, on Emberhold, and you didn't lead with that. Fine. Next time, tell me on the boat. They weren't lying about the crack. They were waiting for it to kill people. That's the part I care about.

**KESTREL VANE** *(if not `met_cantor`)*: So the mask wasn't bluffing about the core. They also sat in a dry room and waited for my friends to fall off the sky. I'm taking that page up the hill.

- "Hesk said they lure Hushborn with burning shards." → `saltmere.wreck.hesk_steady` *(only if `hesk_mood = steady`)*
- "Hesk said the Choir leads them in. He wouldn't say how." → `saltmere.wreck.hesk_pressed` *(only if `hesk_mood = pressed`)*
- "They just watched." → `saltmere.wreck.cabin_onward`

`saltmere.wreck.proof_spare`

*A ring of burned-out shards on the grating outside, spaced like somebody measured. A short note is stuck in a joint with a knife.*

**TAMSIN REED:** Those shards were stacked in a ring and burned down. A nest isn't evenly spaced. People space things evenly when they're following instructions. I hate that I can see the instructions.

*The note:*

*Cinderveil is to be left alone. I gave my word. Saltmere was not part of that word. Lead the wyrm onto the housing with burning shards, the same way as the Maw. Do not be seen. If the bearer saves this town too, the core is still dying. They will see the crack either way.*

**KESTREL VANE** *(if `met_cantor`)*: There it is. Polite on the ridge, and a loophole with a knife in it down here. You met them. You know they talk like a guest. Guests don't bait a monster onto a town.

**KESTREL VANE** *(if not `met_cantor`)*: They left Cinderveil alone, like they said they would, and they baited this town instead. The note's proud of that. I'm not.

- "Hesk said they lure Hushborn with burning shards." → `saltmere.wreck.hesk_steady` *(only if `hesk_mood = steady`)*
- "Hesk said the Choir leads them in. He wouldn't say how." → `saltmere.wreck.hesk_pressed` *(only if `hesk_mood = pressed`)*
- "They used a loophole." → `saltmere.wreck.cabin_onward`

`saltmere.wreck.proof_refuse`

*Four housing bolts, all filed from the same side, none of them all the way through. A cracked grey mask on the grating. A wet note.*

**TAMSIN REED:** Same file, same side, none of them finished. Somebody ran in the middle. The tool's still on the step. People don't leave a good file unless something else is already in the room.

*The note, ink run, still readable:*

*The bearer refused me. Stop asking. Cut the housing bolts and let the mist in. A falling island is a hard place to keep hold of a shard. If the wyrm comes up before you finish, leave. The wyrm will do the rest.*

**KESTREL VANE** *(if `sail_answer = cantor`)*: You told me about the mask, and you told the mask no. They heard you. This note is them hearing you. I'm glad you said no. I'm also glad we got here before the file did.

**KESTREL VANE** *(if `met_cantor` and `sail_answer` is not `cantor`)*: You said no on the ridge. They stopped asking and started cutting. You've also heard the polite version, back on Emberhold. Same voice. They dropped it once you wouldn't go along.

**KESTREL VANE** *(if not `met_cantor`)*: You said no on the ridge. They stopped asking and started cutting bolts. That's what "no" got us. I'm glad we got here before they finished.

- "Hesk said they lure Hushborn with burning shards." → `saltmere.wreck.hesk_steady` *(only if `hesk_mood = steady`)*
- "Hesk said the Choir leads them in. He wouldn't say how." → `saltmere.wreck.hesk_pressed` *(only if `hesk_mood = pressed`)*
- "They tried to drop the town." → `saltmere.wreck.cabin_onward`

`saltmere.wreck.hesk_steady`

**KESTREL VANE** *(if `cantor_choice = spare`)*: Then this ring is that trick. Hesk wasn't guessing. Same lure, new island. He told you they'd be kind after. The note's the kindness. I don't want it.

**KESTREL VANE** *(if `cantor_choice = listen`)*: No lure in this cabin. They watched, which is the other trick. Hesk told you the loud one. This is the quiet one. I like the loud one better. You can shoot the loud one.

**KESTREL VANE** *(if `cantor_choice = refuse`)*: Hesk said they lure them. Here they didn't bother. They cut a gap in the housing and the wyrm came up through it. They didn't have to lead it.

*Continues to `saltmere.wreck.cabin_onward`.*

`saltmere.wreck.hesk_pressed`

**KESTREL VANE:** He wouldn't say how. He still said the Choir put the Maw on Cinderveil. Same people, and now there's a wyrm on Saltmere. I don't need the diagram. I need it off that crystal.

*Continues to `saltmere.wreck.cabin_onward`.*

`saltmere.wreck.cabin_onward`

**KESTREL VANE:** Wyrm first, if it's still on the crystal. Then the clamp. Then Holt. Then Highspire, and we read this note out to whoever's in charge.

**TAMSIN REED:** The core's through that hatch. I can hear something scraping copper. Copper shouldn't scrape. That's the sound of a bad day with a specific cause.

*When the scene ends: `found_proof`.*

### The Tidewyrm

`saltmere.tidewyrm.prefight`

*The housing is a stone bowl under the hull. In it, Saltmere's core: a pale crystal, smaller than Cinderveil's, with a real crack along the north face. A copper cable hangs off its side, teeth marks in the soft metal.*

*Wrapped around the crystal is a long Hushborn, cloud and hard salt, too big for the bowl. One bright line burns under its jaw. Sera called that the place to hit. She called the whole animal a Tidewyrm.*

**TAMSIN REED:** There. Bright line, under the jaw. Same idea as the Maw. Hit the bright part. I'll get to the clamp when it isn't chewing the clamp.

**KESTREL VANE:** It's on my friends' town. Get it off. I'll take the jaw if you two take whatever else it has. It has a lot of else.

*When the scene ends: `boss_tidewyrm`. The fight cannot be fled.*

`saltmere.tidewyrm.defeated`

*The Tidewyrm comes apart into mist and a fall of dry salt. The core is still cracked. It is still glowing. The feed is off.*

**TAMSIN REED:** Hold this. Not the crystal, the clamp. The crystal's hot in a "don't grab it" way, not a magic-words way. I just need you to hold the copper still while I seat it.

**TAMSIN REED:** There. It's on. It's on with two clamps, and I'm not taking one off, Sera can yell at me upstairs where the air is better.

**KESTREL VANE:** Up. I don't trust a dead thing that didn't leave a body. Salt isn't a body. We're leaving.

*When the scene ends: `tidewyrm_dead`. The way back to the lamp house is clear.*

### The lamp, steady

`saltmere.lamp.relit`

*On the platform, the lamp's glass is ordinary and a bit dirty. The light inside stops skipping. It settles to a steady white. Not gold. Not Emberhold. Down between the stilts, the mist pulls back a few feet and stays there.*

**SERA DUNNE:** That's fixed. That's not saved forever. Look at it. White and steady is what this core can do. Emberhold had a healthier crystal and shards to spare. Ours is old. It's been getting smaller my whole job.

**SERA DUNNE:** It'll keep the Hush off the pilings. It will not do that forever. Cores wear down. That's true, and it's still not a reason to let a town drop while the lamp can be on.

**SERA DUNNE** *(if `cantor_choice = listen`)*: You said their leader put a date on us. Before the full moon. The core doesn't care what the moon is doing. If you'd come next week, they might have got lucky. They didn't. You can tell them the lamp's white.

**SERA DUNNE** *(if `cantor_choice = spare`)*: And if they lured that thing here and called it fair because they only promised to leave Cinderveil alone, that's a mean little promise. They kept the words. They don't get the town.

**SERA DUNNE** *(if `cantor_choice = refuse`)*: If they were cutting the housing, they wanted the mist to finish the job so they could say the island just failed. It didn't. The feed's back on. Tell the council that, in those words.

- "The Choir left proof in the cabin." → `saltmere.sera.proof` *(only if `found_proof`)*
- "Will you be all right?" → `saltmere.sera.alright`
- "We're going to Highspire." → `saltmere.sera.highspire`

`saltmere.sera.proof`

**SERA DUNNE:** Holt should hear it from you, in plain words. I'll write my own copy for the council. Dates, the crack, the feed, no speeches. If they want a speech they can come and look at the lamp.

*Sets `found_proof` if it wasn't already. Continues to `saltmere.sera.highspire`.*

`saltmere.sera.alright`

**SERA DUNNE:** I'll cough for a week and I'll shout at Osric for a year. Go to Highspire. I can't leave this lamp to go argue with a council, and somebody should.

*Continues to `saltmere.sera.highspire`.*

`saltmere.sera.highspire`

**SERA DUNNE:** Tell them Sera Dunne says the lamp is holding and the core is not healed. If they have a keeper to spare, I won't turn one down. They don't.

**SERA DUNNE:** So tell them the truth, and don't let a person in a mask tell it first.

*When the scene ends: `saltmere_lamp = lit`, `saltmere_lamp_lit`, `quest_highspire`.*

---

## Gullrock

*Optional. A bare rock on the chart, no lamp, no dock worth the name.*

`gullrock.kestrel.land`

**KESTREL VANE:** I hate this rock, mate. No lamp, no pier, gulls that aren't birds. People drop things while they're running, which is why there's usually a chest in the nests. Don't feed them. Don't wave. Get what you came for.

*When the scene ends: `gullrock_landed`. The stormgulls on the rock will fight if you go for the chest.*

`gullrock.kestrel.done`

*After the nest is clear.*

**KESTREL VANE:** Good. Take it and get on the boat. I'm already itchy. If you want to sightsee, sightsee somewhere with a railing.

`bark.tamsin.gullrock`

**TAMSIN REED:** Those aren't feathers. That's salt stuck in a shape that learned to fly. I have so many questions and none of them are worth getting bitten for.

---

## The Drift Market

*Optional. A barge lashed to a buoy, painted all over with prices. A sign reads DRIFT MARKET. NO LAMP. NO REFUNDS. DON'T LEAN ON THE RED CRATE.*

`driftmarket.voss.intro`

**SILE VOSS:** Sile Voss. One barge, no lamp, decent corks. Don't lean on the red crate. Fireworks and bad corks. If it fell off a boat and didn't sink, I sell it.

**SILE VOSS:** I was going to call you friend. Friend is a shop word. You're a customer. Hello. Look around.

- "Show me the good stuff." → `driftmarket.voss.buy`
- "I'll sell." → `driftmarket.voss.sell`
- "What's the news?" → `driftmarket.voss.rumor`
- "Not today." → `driftmarket.voss.leave`

`driftmarket.voss.buy`

**SILE VOSS:** A Phoenix Shard gets somebody up if they go all the way down. I've never had to test mine on a person I liked. Forty marks.

**SILE VOSS:** There's a coil charm Tamsin will try to steal with her eyes, and a coat that keeps the mist off.

**TAMSIN REED:** I'm not stealing. I'm looking. Looking isn't free, apparently. Forty is a lot. The charm's still very good. I'm going to stop talking before I cost us forty marks.

*When the scene ends, the shop opens. Sets `met_voss`.*

`driftmarket.voss.sell`

**SILE VOSS:** I'll buy it if I can sell it to someone who isn't you. That's the whole test. Put it down.

*When the scene ends, the sell list opens.*

`driftmarket.voss.broke`

**SILE VOSS:** You're short. I'm not insulted. I'm also not handing it over. Come back with the difference, or with something I want more.

`driftmarket.voss.rumor`

**SILE VOSS** *(if `saltmere_lamp` is not `lit`)*: Saltmere's lamp is skipping. I don't dock there when it skips. I'm brave in a shop and a coward in mist. It's a good system. You can have it.

**SILE VOSS** *(if `saltmere_lamp = lit`)*: You steadied Saltmere. That's bad for panic-buying, so you've hurt my week, and you're also my favorite customer until someone spends more. Both are true. Have a look.

**SILE VOSS:** Grey robes bought rope off me yesterday and wouldn't say which island. They paid fairly. I still didn't like the way they counted the rope. Like they needed a length, not a coil.

`driftmarket.voss.leave`

**SILE VOSS:** Watch the gap on the way off. I don't do rescues. I do rope, and the rope is for sale.

`driftmarket.voss.again`

**SILE VOSS:** Still no refunds. The red crate is still not a chair. You'd be surprised how often I have to say both.

---

## Lowgate

*The town under Highspire. Stone houses, a switchback road, and a gate at the top that you can see from the pier. The city's lamps burn in rows above the wall. Closer up, the gate is shut, and the guards are actually guarding.*

`highspire.sail.arrive`

**KESTREL VANE:** Lowgate. They don't let skiffs up top. We walk from here, when we walk. Pier fee's included if you look like trouble, and we look like trouble, so let me talk if there's a clipboard.

**TAMSIN REED:** Their lamps are on a ring main. I can tell from here. Don't ask me not to tell you.

**TAMSIN REED:** A ring main means if one lamp goes out, the others feed it. Saltmere doesn't have that. Saltmere has a cable and a clamp. I put the clamp on.

### Warden Brant, before Saltmere is safe

`highspire.captain.early`

*Only if `saltmere_lamp` is not `lit`. He stands at the foot of the gate stair, not at the bar. Armor like Ilsa's, cleaner, with ink on the fingers.*

**WARDEN BRANT:** Warden Brant, Lanternwright Order. The gate is shut. Ilsa's letter got here before you did, so I know the hand and I know Cinderveil.

**WARDEN BRANT:** The council's first question was Saltmere. Their lamp is failing and we have no keeper to send. Maren can't leave Emberhold. Ilsa can't leave the vault. I can't leave this gate.

**WARDEN BRANT:** You go and see to that town. Then I can put you on the list. I'm not walking a shard-hand in to argue while a pier full of people is still waiting to find out if they fall.

**KESTREL VANE:** That's the lamp we saw. Fine. We do Saltmere, then we come back and bother you properly.

**WARDEN BRANT:** Bother me when the lamp is steady. Lowgate can sell you what you need. The road up is open. The door at the top is not.

*When the scene ends, nothing about the gate changes.*

`highspire.captain.early_again`

**WARDEN BRANT:** Saltmere first. I don't have a softer version of that. I do have a gate that stays shut.

### Dorrie Fen

`highspire.shopkeeper.intro`

**DORRIE FEN:** Dorrie Fen. If it belongs in a Lanternwright kit, I sell it. If it doesn't, the Drift Market has it, and you didn't hear that from me.

**DORRIE FEN:** You're kitted for islands. The switchback has people in armor, and it has sentinels. Buy the tonic before you buy the charm. A charm won't stop either of them. I've watched travelers learn that the expensive way.

- "Show me the kit." → `highspire.shopkeeper.buy`
- "I'll sell." → `highspire.shopkeeper.sell`
- "What's a sentinel?" → `highspire.shopkeeper.sentinel`
- "That's all." → `highspire.shopkeeper.leave`

`highspire.shopkeeper.buy`

**DORRIE FEN:** Tonics, ether, a coat with an actual Defense number on the tag, and a charm that won't do the coat's job. The tag says what the number is. Read the tag. I wrote the tag.

*When the scene ends, the shop opens.*

`highspire.shopkeeper.sell`

**DORRIE FEN:** I'll buy gear the Order can use. I won't buy oddities. Voss buys oddities. I'm not insulting your oddities. I'm telling you where they go.

*When the scene ends, the sell list opens.*

`highspire.shopkeeper.broke`

**DORRIE FEN:** You're short. The price isn't a suggestion. Put one thing back and we can still be polite about it.

`highspire.shopkeeper.sentinel`

**DORRIE FEN:** The Order built them to stand on roads and check a seal. Tall, armored, slow until they aren't.

**DORRIE FEN:** The Choir's been pulling seals. A sentinel with no seal hits whatever's in front of it. That includes you. Don't stand in front of it.

**TAMSIN REED:** I can tell you how the seal used to work. Later. While we're not in front of it. She already said the useful part.

`highspire.shopkeeper.leave`

**DORRIE FEN:** If you're going up today, buy before the road, not halfway up it. I don't deliver.

`highspire.shopkeeper.again`

**DORRIE FEN:** Tonic first. That's still the advice. It'll be the advice tomorrow, too.

### Maud Keel, the Switchback

`highspire.innkeeper.intro`

*A narrow inn built into the first turn of the road. The keeper is already putting a key on the counter, as if she saw you decide outside.*

**MAUD KEEL:** Maud Keel. The Switchback. Bed's three marks. That's more than Saltmere, because the hill costs more. Don't ask me how a hill costs more.

**MAUD KEEL:** You want the room or the talk? I do the room well.

- "The room." → `highspire.innkeeper.rest`
- "Just a question." → `highspire.innkeeper.talk`
- "Never mind." → `highspire.innkeeper.leave`

`highspire.innkeeper.rest`

**MAUD KEEL:** Three marks. Top of the stair, room with the blue sill. You wake up mended. Keep your own papers in the chest. I don't read them and I don't watch them.

**MAUD KEEL:** Sleep doesn't clear the road. If something was on the switchback at dusk, assume it's there at dawn.

- "Here's three marks." → `highspire.innkeeper.sleep` *(only if you can pay)*
- "That's too much for me." → `highspire.innkeeper.broke`

`highspire.innkeeper.sleep`

**MAUD KEEL:** Stair's steep. The bed isn't. Good night.

*When the scene ends: `inn_rest`.*

`highspire.innkeeper.broke`

**MAUD KEEL:** Then it's not your bed tonight. Dorrie buys gear. The bench outside is free and terrible. Ellis is usually on it. He doesn't charge.

`highspire.innkeeper.talk`

**MAUD KEEL:** Gate's shut. Council's arguing. Choir people are already inside, which is why the arguing is loud. I sell beds to both sides and I don't repeat what they say in their sleep.

**MAUD KEEL** *(if `saltmere_lamp = lit`)*: Your harbormaster's word got here. Lamp's holding. Brant will pretend he isn't relieved. He is.

**MAUD KEEL** *(if `saltmere_lamp` is not `lit`)*: If you're the ones Brant sent to Saltmere, go soon. The hill's full of people making a story out of a town they don't live in.

`highspire.innkeeper.leave`

**MAUD KEEL:** Door sticks at the top. Lift.

`highspire.innkeeper.again`

**MAUD KEEL:** Three marks. Blue sill. Road's still there in the morning. So are you, if you were careful.

### Ellis Ward

`highspire.ellis.intro`

*A man mending a net on the inn bench, even though Lowgate is not a fishing town. He keeps his eyes on the knots.*

**ELLIS WARD:** You're the one with the shard. I'm Ellis Ward. I mend nets when there are nets. There aren't, here. I mend them anyway. It keeps my hands busy so my mouth doesn't start.

**ELLIS WARD:** My brother Tom kept the lamp on Pebblewick. Small island, east of here. It's not on the chart anymore.

**ELLIS WARD:** The lamp was lit. I was on a supply run. When I came back, the island wasn't there. The glow under the cloud lasted a minute. Then it didn't.

- "I'm sorry about Tom." → `highspire.ellis.sorry`
- "A lit lamp still matters." → `highspire.ellis.lamp`
- "Are you with the Choir?" → `highspire.ellis.choir`

`highspire.ellis.sorry`

**ELLIS WARD:** Thank you. It doesn't fix it. I know it doesn't. I just don't like saying his name to people who change the subject. You didn't. All right.

*Continues to `highspire.ellis.rest`.*

`highspire.ellis.lamp`

**ELLIS WARD:** A lit lamp matters to people still on a rock. It didn't matter to Tom. Both of those are true. I don't know what to do with both.

**ELLIS WARD:** If you've got an answer, don't make it a speech. Tell me the job, if there is one.

*Continues to `highspire.ellis.rest`.*

`highspire.ellis.choir`

**ELLIS WARD:** No. If I was sent, I'd be worse at this. Brant already asked, twice. I told the Choir to get off my step when they came through last month.

**ELLIS WARD:** Then I didn't sleep. Their paper says let the sky fall and start the world again. I didn't keep the paper. I also couldn't laugh at them. Tom's lamp was lit. That's the part I can't get past.

*Continues to `highspire.ellis.rest`.*

`highspire.ellis.rest`

**ELLIS WARD** *(if `cantor_choice = listen`)*: A skiff crew said you heard the Cantor out. Crews get stories wrong. If they got this one right, don't let anybody use Tom as the example in the room. He hated being an example. He liked the lamp. Those aren't the same.

**ELLIS WARD** *(if `cantor_choice = spare`)*: You let them walk on Cinderveil. They walked in here after, polite as a clerk. Polite is how they talked Tom's neighbors into waiting one more day to load the boats. One more day was the whole island.

**ELLIS WARD** *(if `cantor_choice = refuse`)*: You told them no. Some people on this hill will like you for that. Some won't. I haven't decided what I think. I'm not joining them while I decide.

**ELLIS WARD** *(if `met_cantor`)*: You've heard the Cantor in person, then. Not just on the ridge. On Emberhold too, if the gossip's right. Tom's neighbors said the person who talked to them never raised their voice. That's the part I don't trust.

**ELLIS WARD:** They want the council to keep you out. I'm telling you that even though I half agree with the doubt.

**ELLIS WARD:** I don't want a fight in this street. Brant's at the gate. He'll give you the rule. I'm just telling you what I heard.

*When the scene ends: `ellis_talked`.*

`highspire.ellis.again`

**ELLIS WARD:** I've said the part about Tom. I don't need to say it every time you walk past. The gate's still shut. The net's still got a hole in it. One of those I can fix.

`highspire.ellis.saltmere`

*If you talk to him again after `saltmere_lamp = lit`, once.*

**ELLIS WARD:** Holt's word came up the hill. Saltmere's holding. Good. That's people still on their pier.

**ELLIS WARD:** If you tell the council about Tom, say he kept his lamp. He was a keeper. Then tell them what you came to tell them.

---

## The switchback

`highspire.road.enter`

*The road climbs in long turns. Posts mark the edge. The drop is the Hush. A few travelers are coming down. Nobody is singing.*

**TAMSIN REED:** The sign says switchback, and the road is a switchback, so the sign is right. That's a nice change from lamps that lie about being fine.

**KESTREL VANE:** Choir patrols use this. Armor and a face, that's a person. A mask with nothing in it worth grabbing, that's a Hushborn. I'll shoot the right one. If I ever don't, yell.

**TAMSIN REED:** Please shoot the right one. I'd like that to be a habit and not a hope.

`bark.tamsin.sentinel`

*The first time a sentinel blocks the road.*

**TAMSIN REED:** Gate sentinel. The Order built them to check seals. Somebody pulled this one's seal, so now it checks people by hitting them. I can explain the seal later. We're running later. We're running now.

**KESTREL VANE:** Tall, slow, then not slow. Go for the joint. Don't stand in the swing. I feel like I've said that before and yet here we are.

`bark.kestrel.patrol`

**KESTREL VANE:** Patrol. If they want a talk, they can start with not pointing those at my face. They won't. Get ready.

---

## The gate

`highspire.captain.gate`

*Only once `saltmere_lamp = lit`. Brant is at the shut gate. Ilsa's letter is in his hand, and a second note on harbormaster paper.*

**WARDEN BRANT:** Holt says the lamp is holding. Ilsa says you walked the vault. That's two islands and one hand. The council wants you in the room.

**WARDEN BRANT:** Not tonight. The gate stays shut. Choir speakers are already in the city. Two councilors want you kept out until they've heard the Cantor in person.

**WARDEN BRANT:** I don't open this door on my own say-so. If I did, it wouldn't be a council. It would be me with a key.

**KESTREL VANE:** So we wait at the door. I've waited in worse places. Those places had worse stew, too. Maud's is fine. Don't tell her I said fine.

**TAMSIN REED:** I can draw the crack for them. I measured it. I measured it twice. People with gates like numbers. I have numbers.

**TAMSIN REED:** I also have opinions about their ring main. I'll keep those until somebody asks. They might not ask.

- "We'll wait." → `highspire.captain.wait`
- "The Choir was at Saltmere." → `highspire.captain.choir` *(only if `found_proof`)*
- "Ellis says they want you to keep us out." → `highspire.captain.ellis` *(only if `ellis_talked`)*

`highspire.captain.wait`

**WARDEN BRANT:** Then wait in Lowgate, not on this step. When the council decides, someone comes down the stair.

**WARDEN BRANT:** If they decide against you, I'll come down myself and say it to your face. You won't hear it from a notice.

*Continues to `highspire.captain.close`.*

`highspire.captain.choir`

**WARDEN BRANT** *(if `cantor_choice = spare`)*: A robed woman came through yesterday with a letter that said Cinderveil was under truce. Your truce, from the sound of it. You let them walk, and they walked here. I'll put the wreck note in front of the council next to her letter. They can read both.

**WARDEN BRANT** *(if `cantor_choice = listen`)*: Someone's been telling the council Saltmere would fall before the moon. It didn't. Two of them were angry about that. I don't know what to do with a person who's angry a town is still up. Bring Sera's statement written. People up here retell things until the story's easier.

**WARDEN BRANT** *(if `cantor_choice = refuse`)*: Two Choir skiffs tried the gate at dawn. We turned them off. They'll try a door that isn't a gate next, which is why the city is in the mood it's in. If they cut bolts at Saltmere, the council needs that more than it needs another speech about the sky.

*Continues to `highspire.captain.close`.*

`highspire.captain.ellis`

**WARDEN BRANT:** Ellis told you the truth. He isn't Choir. He's a man who lost a brother and won't pretend the lamp saved him. I still open and shut this gate by order, not by Ellis's grief, and not by mine.

**WARDEN BRANT:** Tell the council about Pebblewick if you want. Say it fairly. Tom Ward kept his lamp. The island fell anyway. That's true. Saltmere's lamp is also true. Tell them both.

*Continues to `highspire.captain.close`.*

`highspire.captain.close`

**WARDEN BRANT** *(if `met_cantor`)*: One more thing. The speakers inside asked for you by a meeting, not just by the hand. They said, the one who talked with the Cantor in Whisper Hollow. So someone on Emberhold has been talking to them. I'm telling you so it isn't a surprise in the room.

**WARDEN BRANT** *(if not `met_cantor`)*: They asked for the shard-hand from Emberhold. They don't have a better name. Neither do we. Wayfarer will do until you pick one.

**WARDEN BRANT:** Lowgate can keep you. The road up is as far as you go. The city starts on the other side of this door, and the door is shut.

**KESTREL VANE** *(if `cantor_choice = spare`)*: You gave them a walk on Cinderveil. They used it. Next time they ask, I'm in the room. I'm not good in rooms. I'll do it anyway.

**KESTREL VANE** *(if `cantor_choice = listen`)*: They told you the truth about the core, and they left a town to die as the proof. You got there first. If the council starts repeating that moon date, tell them the lamp is white.

**KESTREL VANE** *(if `cantor_choice = refuse`)*: You said no, and they brought files and skiffs. I'm still glad you said it. Get some sleep. Be ready to say it again in the morning, to people with nicer chairs.

*The gate does not open. Above it, Highspire's lamps burn in a ring. The playable part of Act 2 stops here.*

*When the scene ends: `gate_waiting`, `act2_end`.*

`highspire.captain.again`

*If you talk to him after the ending.*

**WARDEN BRANT:** Still shut. I'll send down when there's an answer. Standing on this step doesn't speed the council up. I wish it did. I've tried it.

`highspire.kestrel.waiting`

**KESTREL VANE:** We wait. You eat. Tamsin draws her crack. I oil the gun, and I don't pick a fight with a guard who's right. If you need me, I'm at the boat. Lowgate's small. Yell.

`highspire.tamsin.waiting`

**TAMSIN REED:** I started a diagram of the core, and then one of the sentinel seal, and then I remembered Brant didn't ask for that.

**TAMSIN REED:** I'll do the core. I'll label it. Councils like labels.

---

## Sailing, when you pick a destination

*One line, as the chart closes. Not a scene.*

`sail.pick.saltmere` — **KESTREL VANE:** Saltmere. Mind the gap at the pier. It widens when the mist shifts. Step when I say.

`sail.pick.highspire` — **KESTREL VANE:** Highspire. We tie up at Lowgate. Nobody flies a skiff over that wall. I asked, once, years ago. They were not charmed.

`sail.pick.gullrock` — **KESTREL VANE:** Gullrock. I'm already annoyed and we're not even there.

`sail.pick.drift` — **KESTREL VANE:** Drift Market. Voss will talk. Don't buy the first thing he puts in your hand. The second thing is also a trap. Look at the third thing.

`sail.pick.emberhold` — **KESTREL VANE:** Emberhold. Maren's all right or the lamp wouldn't be up. We can wave and keep going, unless you need her to look at that hand.

`sail.pick.cinderveil` — **KESTREL VANE:** Lowmoor. Lamp should still be orange. Don't expect a crowd. Tamsin talked to the kettle, remember. The kettle's not coming out.

---

## Battle lines

*Not conversations. After a normal win, one living party member says one of their lines, picked at random. On a level-up, that character says one of theirs. The Wayfarer has no other spoken lines in this act. Cut these four if you want them fully silent. Kestrel and Tamsin cover the screen either way.*

### Victory

`bark.victory.kestrel.1` — **KESTREL VANE:** Down. Shake the salt off and keep walking.

`bark.victory.kestrel.2` — **KESTREL VANE:** Ha. That one flinched. I like it when they flinch.

`bark.victory.kestrel.3` — **KESTREL VANE:** Stay off my boat, and stay off the town. Too late for you.

`bark.victory.kestrel.4` — **KESTREL VANE:** That's done. I'm checking the gun anyway. Don't read into it.

`bark.victory.tamsin.1` — **TAMSIN REED:** It fell over. I had a second plan and I didn't need it. I'm a little sad about the second plan. I'm mostly glad.

`bark.victory.tamsin.2` — **TAMSIN REED:** Don't step on the sparks. They're not hot. They're probably not hot. Walk around them.

`bark.victory.tamsin.3` — **TAMSIN REED:** The coil stuns them if you time it, and I timed it. Did you see? You were busy. I'll tell you later. You saw.

`bark.victory.tamsin.4` — **TAMSIN REED:** I'm fine. My hands are shaking. That's leftover. It's also a little bit fear. Both. Moving on.

`bark.victory.wayfarer.1` — **WAYFARER:** It's down.

`bark.victory.wayfarer.2` — **WAYFARER:** Everyone all right?

`bark.victory.wayfarer.3` — **WAYFARER:** Keep going.

`bark.victory.wayfarer.4` — **WAYFARER:** That one's finished.

### Level-up

`bark.level.kestrel.1` — **KESTREL VANE:** Oh, I'm quicker. Good. I was going to pretend I wasn't tired.

`bark.level.kestrel.2` — **KESTREL VANE:** New shot. I'll try it on something that isn't the sail.

`bark.level.kestrel.3` — **KESTREL VANE:** If I get much better at this, I'm charging you properly. Danger pay. Smile when I say it. I am smiling.

`bark.level.kestrel.4` — **KESTREL VANE:** Felt that. In a good way. Don't make it weird, mate.

`bark.level.tamsin.1` — **TAMSIN REED:** Wait. I understand the coil better. I already understood it. Now I understand it more. That's allowed.

`bark.level.tamsin.2` — **TAMSIN REED:** Leveling up is just learning. I like learning. I like it less when the teacher is trying to bite me.

`bark.level.tamsin.3` — **TAMSIN REED:** I can patch a cut faster now. Please don't test that on purpose. I'll be cross. I'll still patch it.

`bark.level.tamsin.4` — **TAMSIN REED:** New idea for the grapple. After the fight. I need a pencil. I'll remember it. I will not remember it. Does anyone have a pencil.

`bark.level.wayfarer.1` — **WAYFARER:** I can hit harder.

`bark.level.wayfarer.2` — **WAYFARER:** The hand kept up.

`bark.level.wayfarer.3` — **WAYFARER:** I've got more left.

`bark.level.wayfarer.4` — **WAYFARER:** I'll take it.

---

## Things you can look at

*Inspect text. The bold label is the object. Nobody is speaking, except where a sign has words on it.*

### Saltmere

`inspect.saltmere_sign` — **PIER SIGN:** SALTMERE. STILTS HOLD. LAMP WEAK. DO NOT SWIM. THERE IS NO WATER.

`inspect.saltmere_lamp_weak` — **SALTMERE'S LAMP:** The glass is dirty and ordinary. The light inside flares, dims, and flares again. You can hear a faint tick, like metal tapping metal, somewhere under the platform.

`inspect.saltmere_lamp_lit` — **SALTMERE'S LAMP:** A steady white light. Not as bright as Emberhold. The mist has moved back from the pilings and stopped there.

`inspect.sera_house` — **LAMP HOUSE:** One room, a chair, a bucket, a blanket, and a view of the lamp through a hatch in the roof. The bed is made. Nobody is using it.

`inspect.keepers_book` — **KEEPER'S BOOK:** Salt-stained. The useful line is underlined: "TIDEWYRM: A LONG HUSHBORN. COMES UP WHEN THE CORE CRACKS. BITES THE COPPER FEED. THE LAMP FAILS AFTER THAT. HIT THE BRIGHT LINE UNDER THE JAW."

`inspect.stilts` — **STILTS:** Tree-trunk pilings, tarred and lashed, older than the houses. The mist moves between them.

`inspect.evacuation_boats` — **THREE BOATS:** Half loaded with blankets, tools, and a crate of chickens. This is not the whole town. It's what fits in three boats.

`inspect.stilthouse` — **THE STILTHOUSE:** Osric's inn. The sign is a painted eel. The hatch sticks if you pull it wrong.

`inspect.quinn_shop` — **QUINN'S HOOKS:** The price board is in large letters. A note at the bottom: SUPPLY SKIFF LATE. WHAT'S ON THE WALL IS WHAT THERE IS.

`inspect.kids_rope` — **ROPE COIL:** Where Pip and Lark sit when they're not supposed to be on the west pier. The crab bucket is empty. Lark has the crabs.

`inspect.jory_net` — **JORY'S NET:** Half a net, cut clean through, as if something bit it and pulled. The rest is gone.

`inspect.jory_mooring` — **WEST MOORING:** A line goes down into the mist and stays tight. Jory says the *Little Hale* is on the other end.

`inspect.saltmere_bell` — **STORM BELL:** The town bell. The rope is new. The old one snapped sometime in the last few days. People have been ringing it.

### The Sunken Wreck

`inspect.holdfast` — **THE HOLDFAST:** The barge's name is still on the bow, in flaking paint. She sank against the core housing and stayed. The town uses her as a roof.

`inspect.wreck_stair` — **FALLEN STAIR:** The first three steps are here. The rest aren't. Grey mist fills the hole. It is not smoke, and it is not water.

`inspect.red_hook` — **RED HOOK:** Paint, not rust. This is the one Sera meant. The reel seats on it with a click you can feel in your wrist.

`inspect.blue_crystal` — **BLUE CRYSTALS:** Scrap from an older housing. Bright, loose, and sharp enough to open a boot. Tamsin was right. They are not worth it.

`inspect.feed_cable` — **COPPER FEED:** A thick copper cable running from the core toward the town above. Where the wyrm had it, the metal is chewed and bright.

`inspect.saltmere_core` — **SALTMERE'S CORE:** Smaller than Cinderveil's crystal, and cracked on the north face. It is still holding the island up. It is doing it with less than it used to have.

`inspect.choir_cabin` — **DRY CABIN:** Oiled hinge, dry blanket, cold lantern. Somebody slept here and left in a hurry, or left because the job was done. The bench has no dust.

`inspect.choir_note_listen` — **WATCH LOG:** The Cantor's day notes. They saw the crack, saw the wyrm, and told their people not to touch either. The last line sends them to Highspire ahead of you.

`inspect.choir_note_spare` — **KNIFE NOTE:** A short order. Cinderveil is to be left alone. Saltmere was not in the promise. Lead the wyrm up with burning shards. Don't be seen.

`inspect.choir_note_refuse` — **WET NOTE:** The bearer refused. Stop asking. Cut the bolts. Let the mist in. If the wyrm shows up early, leave, and let it finish.

`inspect.burned_ring` — **BURNED SHARDS:** A ring of spent shards on the grating, spaced too evenly to be a nest. This is only here if the Choir lured the wyrm.

`inspect.cut_bolts` — **FILED BOLTS:** Four bolts on the housing, each started with a file, none finished. A good file lies on the step. This is only here if they tried to open the housing.

`inspect.tidewyrm_salt` — **WYRM SALT:** A drift of hard salt where the Tidewyrm came apart. It crunches underfoot and doesn't melt. There is no body.

`inspect.wreck_chest` — **WRECK CHEST:** Someone's stash of clamps, a few marks, and a tonic that is, surprisingly, still corked.

### Lowgate and the road

`inspect.lowgate_sign` — **LOWGATE SIGN:** LOWGATE. GATE TOWNSHIP OF HIGHSPIRE. NO SKIFFS ABOVE THE WALL. THE COUNCIL IS IN SESSION.

`inspect.switchback_sign` — **ROAD SIGN:** SWITCHBACK. STAY ON THE MARKED SIDE. THE OTHER SIDE IS THE HUSH.

`inspect.highspire_gate` — **HIGHSPIRE GATE:** Iron, shut, and watched. Through the bars you can see a paved street and more lamps. You cannot see the council. You can hear people arguing, faintly, and not the words.

`inspect.ilsa_letter` — **ILSA'S LETTER:** In Brant's hand when he talks to you. What you can read of it: the vault, the Maw, the lamp, and a last line. "The hand is real. Hear them out. —Warden Ilsa."

`inspect.holt_note` — **HOLT'S NOTE:** Harbormaster paper, after the lamp. "Saltmere holding. White and steady. Core still cracked. Sera Dunne will not leave her post. Send a keeper if you have one. You don't. —Holt."

`inspect.council_notice` — **POSTED NOTICE:** THE GATE IS CLOSED WHILE THE COUNCIL SITS. TRAVELERS MAY USE LOWGATE. DO NOT BLOCK THE STAIR. —WARDEN BRANT

`inspect.fen_shop` — **FEN'S SUPPLY:** Tags on every coat, with a Defense number written by hand. A tray of tonics is closer to the door than the charms are.

`inspect.switchback_inn` — **THE SWITCHBACK:** Maud's inn, built into the first turn so nobody has to climb to go to bed. The key tags are painted with a blue sill.

`inspect.ellis_bench` — **ELLIS'S BENCH:** A half-mended net, a needle, and no fish. Under the bench, a folded pamphlet. The top line reads: LET THE SKY FALL. LET THE WORLD BEGIN AGAIN. He said he didn't keep it. He kept it where he doesn't have to see it.

`inspect.sentinel_seal` — **BROKEN SEAL:** On the road, where a sentinel stood. A lead disc, snapped in half. The stamp was the Lanternwright crest. Someone pried it out on purpose.

`inspect.gate_lamps` — **THE RING OF LAMPS:** Highspire's lamps, seen from below. If one dims, the ones beside it brighten. Tamsin says that's a ring main. From here it just looks like the city is still awake.

### Gullrock and the Drift Market

`inspect.gullrock_sign` — **PAINTED BOARD:** GULLROCK. NO DOCK. NO LAMP. IF YOU LAND, TAKE WHAT YOU CAME FOR AND GO. The paint is old. The rock still has no lamp.

`inspect.gull_nest` — **STORMGULL NEST:** Salt, bone, and bits of metal. The gulls are Hushborn that learned wings. They do not want you here.

`inspect.gullrock_chest` — **NEST CHEST:** A traveler's chest dragged into the nest. The lock is already broken.

`inspect.drift_sign` — **BARGE SIGN:** DRIFT MARKET. NO LAMP. NO REFUNDS. DON'T LEAN ON THE RED CRATE.

`inspect.red_crate` — **RED CRATE:** Fireworks, bad corks, and a second sign that says DON'T. Voss means it. The crate is warm.

`inspect.voss_scales` — **VOSS'S SCALES:** A scale, chained to the mast so nobody walks off with it. The weights are marked in marks.

---

## Notes for the other lanes

These are not lines.

- Spoken dialogue stays out of the game until Brian approves this file. Placeholder nodes can keep the id and the single line "(Script pending)."
- Names, if WORLD needs a list: Brenna Holt, Osric Pell, Nessa Quinn, Sera Dunne, Pip, Lark, Jory Hale, Warden Brant, Dorrie Fen, Maud Keel, Ellis Ward, Sile Voss. The barge in the wreck is the *Holdfast*. The fallen island Ellis talks about is Pebblewick. The gate town is Lowgate. Inns: the Stilthouse, the Switchback. Shops: Quinn's Hooks, Fen's Supply.
- The spec's lock text "Story continues in Act 2" is a placeholder, not a line anyone says. The gate scene above is the stop.
- Join banners are plain: "Kestrel joined the party." and "Tamsin joined the party." Do not play them twice if the flag is already set.
- Shop and inn menus are systems. The lines here are only what the keeper says. Item stats stay in the item list.
