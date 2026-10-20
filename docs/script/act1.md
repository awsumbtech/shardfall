# Shardfall — Act 1: The Cinder Road

A screenplay. The Wayfarer does not speak. A star is a choice, and the game remembers some of them. The id under a heading is the node the game plays, word for word. One box is one or two sentences. A scene should skim in under a minute.

The lamp catching on Emberhold is still a cutscene, not a conversation. Everything said out loud is below.

What a choice remembers:

- `asked_maren` — `hush` or `hand`. Changes Maren's thanks, and unlocks a line from Kestrel if you asked about the hand.
- `sail_answer` — `yes`, `ask`, or `hand`. Changes what Kestrel says the next time you talk, on the dock.
- `tamsin_mood` — `earnest` or `wary`. Changes her nag, and how the grapple fits.
- `hesk_mood` — `steady` or `pressed`. Changes what you can tell Warden Ilsa.
- `cantor_choice` — `spare`, `listen`, or `refuse`. The end of Act 1. Each one lands differently.

---

## Emberhold

### Wake

`emberhold.wake`

*Dusk the color of a bruise that has decided to be pretty. Grass in the mouth. The hand will not open all the way. A shard has taken the job of a pulse. The words in the stone are newer than the stone.*

THE WAKING STONES
You wake with grass in your teeth and a star clenched in your hand.

THE WAKING STONES
The stone is older than the crack. The words cut into it are not: the lamp is up the hill.

### Old Maren

`emberhold.maren.intro`

*A cottage that has won an argument with the weather. She is already looking at the hand, not the face. Somewhere a kettle takes this personally. When this talk ends, the errand begins: five shards, for the lamp, not for her.*

OLD MAREN
You're awake. Good. I had a bet with the kettle, and I hate losing to a kettle.

OLD MAREN
I am Maren. I keep the lamp up this hill. The lamp keeps the Hush off the grass.

OLD MAREN
Dash the gaps you cannot walk. Strike the bright core in a thing of mist.

OLD MAREN
Five sky-shards wake the lamp. Set them on the plinth yourself — I will not take them from your hand.

OLD MAREN
If you tear, come talk. I mend. That is the whole of my magic.

* What is the Hush, really? → `emberhold.maren.ask_hush` *(remembers asked_maren = hush)*
* Why is this in my hand? → `emberhold.maren.ask_hand` *(remembers asked_maren = hand)*
* I'll find the shards. → `emberhold.maren.intro_go`

`emberhold.maren.ask_hush`

OLD MAREN
A tide with a memory. It wants the sky to finish breaking, and the grass has voted no.

OLD MAREN
We do not win forever. We light lamps. Go find five shards. The grass is waiting on you, not on a speech.

`emberhold.maren.ask_hand`

OLD MAREN
It fused when you woke. I did not put it there. If the lamp did, it has not confessed.

OLD MAREN
Treat it like a tool that chose you. Tools still need a person. You will do.

`emberhold.maren.intro_go`

OLD MAREN
Good. The lamp is up the hill. The dock is down. Bring me your opinions if you start leaking.

### While the shards are out

`emberhold.maren.waiting`

*She says this any time you come back torn, or merely unfinished. The number in the second line is however many shards are in the hand. She mends you either way.*

OLD MAREN
Still walking. Good. The hill has not wandered off, and neither have I.

OLD MAREN
You hold {shards}. The lamp eats five. Some glow in the grass. Some fall out of a core, if you ask with the sharp end.

OLD MAREN
Come back torn. Talk, and I will put you back in the right order.

### The lamp

*Five shards, on the plinth, by a living hand. The beam goes gold. Wisps come apart. Heavier things crack and stay. The hand learns a longer step. If you look at the lamp before that, or after, it has a shorter thing to say. Those are inspect lines, at the end of this act.*

### After the light

`emberhold.maren.lamp_lit`

*She heard it before she saw you. If you never stopped to meet her, this is also the introduction. The extra reply only appears if you asked her something the first time.*

OLD MAREN
There. The grass remembers green. I heard it from the kettle, which is now unbearable.

OLD MAREN
You set the shards on the plinth yourself. That is the work. I do not take a turn at someone else's lamp.

OLD MAREN
Your hand has a longer step. Use it. Kestrel will feel the wind and pretend the idea was his.

* You called the Hush a tide. → `emberhold.maren.lit_hush` *(only if you asked about the Hush)*
* The hand took a longer step. → `emberhold.maren.lit_hand` *(only if you asked about the hand)*
* Kestrel will take the credit. → `emberhold.maren.lit_plain`

`emberhold.maren.lit_hush`

OLD MAREN
You called it a tide. You pushed it back a step. Tides notice. Do not get loud about a step.

`emberhold.maren.lit_hand`

OLD MAREN
The longer step is still yours. If the hand starts taking credit, remind it who woke up.

`emberhold.maren.lit_plain`

OLD MAREN
Kestrel names winds after himself. Let him. The lamp knows who carried the shards. So does the grass.

### Kestrel, before the lamp

`emberhold.kestrel.span`

*Vane's Perch. A skiff with a shard-lit sail and a grudge against heroism. Goggles stay on. When this talk ends, he has told you about the span, and about the stones that face the wrong way.*

KESTREL VANE
Kestrel Vane. The Quickmercy is winning an argument about nails, and I am losing it.

KESTREL VANE
She will not sail while the lamp holds its breath. Last time I insisted, she sailed a circle and called it a principle.

KESTREL VANE
East of the lamp, the span is broken. Dash from the lip. Walking is how a person becomes weather.

KESTREL VANE
On the far islet, look behind the stones that face the wrong sky. Interesting things rarely face the lamp.

* Come with me. → `emberhold.kestrel.span_no`
* Save me a nail. → `emberhold.kestrel.span_nail`

`emberhold.kestrel.span_no`

KESTREL VANE
And leave her with the last word? I have a reputation with this hammer. Light the lamp. Then we talk about west.

`emberhold.kestrel.span_nail`

KESTREL VANE
She eats nails. I eat pride. Between us the hull stays up. Light the lamp, and the west gets a real name.

`emberhold.kestrel.dark`

*If you come back before the lamp, and he has already said his piece.*

KESTREL VANE
Still the wrong wind. She refuses to be heroic, which is why we are both still here.

KESTREL VANE
The stones face the lamp. Look the other way. That is the hint. I will not draw you a map. Maps get confident.

### The offer

`emberhold.kestrel.offer_sail`

*The lamp is lit. The tiller, allegedly, has muscles. This is the offer to sail. The crossing itself is the next scene, when the wind is actually taken.*

KESTREL VANE
There. You lit it, and the tiller unclenched. Don't repeat that. She will deny having muscles.

KESTREL VANE
West, under the bright crack: Cinderveil. Ash, a quay, a lamp that forgot its job.

KESTREL VANE
We can take you. One of us will complain the whole way. I have already nominated her.

* Take me west. → `emberhold.kestrel.sail_yes` *(remembers sail_answer = yes)*
* What are we sailing into? → `emberhold.kestrel.sail_what` *(remembers sail_answer = ask)*
* The hand did the clever part. → `emberhold.kestrel.sail_hand` *(only if you asked Maren about the hand; remembers sail_answer = hand)*

`emberhold.kestrel.sail_yes`

KESTREL VANE
Good. I like a short yes. When the wind takes, hold the rail. The Hush is not water, and falling is a hobby for other crews.

`emberhold.kestrel.sail_what`

KESTREL VANE
A hearth that lost an argument and kept the coals. Lowmoor Quay. Something in the ash has been eating their light.

KESTREL VANE
We are going to be impolite about it. Hold the rail when the wind takes. Compliment the sail after, if you must.

`emberhold.kestrel.sail_hand`

KESTREL VANE
Maren told you the hand has ideas? Ideas don't trim a sail. You do. I'll shout which rope. You may pretend you already knew.

### Still on the dock

*The next time you talk to him, he remembers how you answered. All three of these open the same door. The words are the only difference.*

`emberhold.kestrel.docked`

KESTREL VANE
West is still west. The hull voted yes, which she will deny if you ask her in front of me.

KESTREL VANE
Say the word at the rail. And if a mask compliments the paint, do not offer it a tour.

`emberhold.kestrel.docked_ask`

KESTREL VANE
Cinderveil has not gotten simpler since you asked. Ash, a quay, a lamp with its eyes shut.

KESTREL VANE
The hull is ready. My metaphor budget is not. Hold the rail when you mean it.

`emberhold.kestrel.docked_hand`

KESTREL VANE
Still interviewing your own hand? Leave the philosophy on the dock. It tangles in the lines.

KESTREL VANE
West is the same west. The rope I shout will be the right rope. Probably.

### The Cantor, optional

`emberhold.cantor.intro`

*Whisper Hollow. Blue air. A mask, a gold hem, and no interest in the dock. They do not fight. They are not a step on the errand. They are a promise that the manners continue.*

THE CANTOR
Wayfarer. A pulse, in a shard, on a hill. How stubborn of you both.

THE CANTOR
Maren keeps a lamp against a tide. We are what the tide remembers. The Hollow Choir, if you need a name for the manners.

THE CANTOR
I will not spoil her grass. Mention to the sailor that the patches are admired. I do not wait on docks.

THE CANTOR
We keep a door. Not on this island. Not while you are still enjoying being kind.

`emberhold.cantor.again`

THE CANTOR
Still listening. You are still mending. I find it touching, which I will deny if asked in company.

THE CANTOR
Kindness is not nothing. It is only not the end. The grass is having a good day. Do not waste it on me.

### Barks, if the hill is feeling talkative

`bark.maren.kettle`

OLD MAREN
The kettle says you'll be late. I told it to mind its water.

`bark.maren.grass`

OLD MAREN
Grass is up. That's the whole report. I like a short report.

`bark.kestrel.nail`

KESTREL VANE
If you hand me that nail, hand me the right one. She can tell. I cannot, and I live with the shame.

`bark.kestrel.scarf`

KESTREL VANE
Scarf stays on. Goggles stay on. Heroics stay off until the lamp says otherwise.

`bark.cantor.hem`

THE CANTOR
Lovely wind. Do not waste a compliment on me. I already kept it.

---

## The crossing

*Wind lanes over the Hush. Not a menu of names. The bright lanes look like roads and behave like mouths. The Quickmercy takes the dull one, and complains at a new pitch, which is how Kestrel knows he is right.*

`cinderveil.sail.depart`

KESTREL VANE
Off the perch. Rail in your hand. If you let go, do it on an island, not in a cloud with ambitions.

KESTREL VANE
She likes you, by the way. She shows it by complaining at a slightly different pitch.

`cinderveil.sail.lane`

KESTREL VANE
These are wind lanes. The bright ones are pretty. Pretty, over the Hush, is often a mouth.

KESTREL VANE
We take the dull lane. She hates the dull lane. That is how I know it is the right one.

`cinderveil.sail.sight`

*A grey island under the bright crack. An orange seam, like a hearth that refused to concede.*

KESTREL VANE
There. Grey island, orange seam, a crack in the sky like a held match. Cinderveil.

KESTREL VANE
Looks like a hearth that lost the argument and kept the coals. That's our stop.

---

## Cinderveil

### Lowmoor Quay

`cinderveil.kestrel.arrive`

*Ash on the ropes. The ridge lamp is dark, which Kestrel takes as a personal insult on behalf of a boat.*

KESTREL VANE
Lowmoor Quay. Smile like we meant to. If you look surprised, the dock charges extra.

KESTREL VANE
That ridge lamp is dark. Rude. Tamsin will already be mid-sentence. Try to find the beginning of it.

KESTREL VANE
I'll stay with the hull. If I leave her, she picks up new opinions, and we are at quota.

### Tamsin Reed

`cinderveil.tamsin.cogs_start`

*A bench, a vise, and a person who has already decided your hand is a project. When this talk ends, the Ashfields owe her three cogs. The grapple comes after, not before.*

TAMSIN REED
You're the hand. Kestrel said hand, I heard project, and I cleared the bench.

TAMSIN REED
I'm Tamsin. I fit clever things into less clever things until both of them work out of spite.

TAMSIN REED
Three cogs, out in the Ashfields. Kick the right dust. The wrong dust kicks back.

* I'll bring you three. → `cinderveil.tamsin.cogs_earnest` *(remembers tamsin_mood = earnest)*
* Define wrong dust. → `cinderveil.tamsin.cogs_wary` *(remembers tamsin_mood = wary)*

`cinderveil.tamsin.cogs_earnest`

TAMSIN REED
Yes. Three. Not two and a bold attitude. I tried that. The attitude is still in a sling.

`cinderveil.tamsin.cogs_wary`

TAMSIN REED
Wrong dust has teeth and a grudge. Right dust is just embarrassed. The teeth introduce themselves.

`cinderveil.tamsin.cogs_waiting`

*Back too soon, or not soon enough. She can see your pockets. She is not invited to parties.*

TAMSIN REED
No cogs, no grapple. I can offer a pep talk. The pep talk does not hook onto cliffs.

TAMSIN REED
I counted your pockets with my eyes, which is a skill, and also why people don't invite me to things.

* Still looking. → `cinderveil.tamsin.wait_earnest` *(only if you promised her three)*
* The dust has opinions. → `cinderveil.tamsin.wait_wary` *(only if you asked about the dust)*
* Show me the bench again. → `cinderveil.tamsin.wait_bench`

`cinderveil.tamsin.wait_earnest`

TAMSIN REED
You said you'd bring them, and you haven't. I respect the suspense. My bench does not.

`cinderveil.tamsin.wait_wary`

TAMSIN REED
The dust introduce itself? If you still have both boots, you're winning. Go embarrass a cog.

`cinderveil.tamsin.wait_bench`

TAMSIN REED
Bench, hammer, and a cup of tea I won't share — it has a bolt in it. Three cogs is the whole long story.

### The grapple

`cinderveil.tamsin.grapple_gift`

*Three cogs on the bench. She fits the line into the shard the way other people fit a greeting. When this talk ends, the hand can throw a rope at a cliff.*

TAMSIN REED
Three. I love you in a strictly mechanical way. Hold still.

TAMSIN REED
This is a handshake. The shard throws the line, the cliff agrees, and you do not let go first.

* It fits. → `cinderveil.tamsin.gift_earnest` *(only if you were earnest)*
* If it bites, I'm blaming you. → `cinderveil.tamsin.gift_wary` *(only if you were wary)*
* Point me at the vault. → `cinderveil.tamsin.gift_vault`

`cinderveil.tamsin.gift_earnest`

TAMSIN REED
It fits because you went and got the ugly parts. I like you. That's a technical assessment.

`cinderveil.tamsin.gift_wary`

TAMSIN REED
If it bites, it learned that from the dust, not from me. Mostly not from me.

`cinderveil.tamsin.gift_vault`

TAMSIN REED
Ilsa has the door, and a face like a closed ledger. She deducts marks for poetry, so cross and don't recite.

### Brother Hesk

`cinderveil.hesk.rumor`

*A crate that has recently become a lifestyle. He left the Hollow Choir. They were nice about it. That is the part that scared him. He knows the Cantor is coming, and he knows the thing in the vault is not the Cantor.*

BROTHER HESK
Oh. A face. Hello. Sorry — I am Brother Hesk.

BROTHER HESK
I was Hollow Choir. I am now this crate, and the crate is winning.

BROTHER HESK
They smiled when I left. Nobody shouted. That is how you know to run.

BROTHER HESK
When you light the lamp, the Cantor will come admire it. They love a fresh hope. It is their favorite seasoning.

* Breathe. Tell me the useful part. → `cinderveil.hesk.steady` *(remembers hesk_mood = steady)*
* What does the Cantor want? → `cinderveil.hesk.pressed` *(remembers hesk_mood = pressed)*

`cinderveil.hesk.steady`

BROTHER HESK
Useful, yes. The thing in the vault is a Maw — hunger, not the Cantor.

BROTHER HESK
Do not bow to it. The Cantor is the one with manners, and they hand your clever words back sharper.

`cinderveil.hesk.pressed`

BROTHER HESK
They want the sky to finish its sentence. Islands are the pause. You, with a shard that woke, are a word that refused to end.

BROTHER HESK
I said no. Then I said no again, from a crate, with my voice doing this. Please do not make a hobby of being brave at me.

### Warden Ilsa

`cinderveil.ilsa.trial`

*The Ember Vault. No bridge. She has already counted the ways in, and the number is one. When this talk ends, the gap is yours to cross.*

WARDEN ILSA
Hold. Warden Ilsa. The Ember Vault stays shut while something in it chews the core.

WARDEN ILSA
You want in. The trial is the gap: your own line, your own weight, no bridge and no speech.

WARDEN ILSA
Fall, and the Hush files you under weather. I will not argue with its paperwork.

* I'll cross. → `cinderveil.ilsa.cross`
* Hesk says the Cantor collects words. → `cinderveil.ilsa.hesk` *(only if you asked Hesk for the useful part)*
* Hesk says they want the sky finished. → `cinderveil.ilsa.hesk_dark` *(only if you asked what the Cantor wants)*

`cinderveil.ilsa.cross`

WARDEN ILSA
Then cross. The door knows weight. I know hesitation. Go.

`cinderveil.ilsa.hesk`

WARDEN ILSA
Hesk talks when he is afraid. He is always afraid. He is also right. Cross. Fear is not a key I honor.

`cinderveil.ilsa.hesk_dark`

WARDEN ILSA
A finished sky. I have heard the sermon. I kept the door anyway. You keep your feet. That is the whole trial.

### The Cinder Maw

`cinderveil.maw.prefight`

*The core-light gutters. Ash leans toward a throat. The bright seed in the chest is the island, on loan. Strike that. When the last line ends, the fight begins.*

THE CINDER MAW
Ash inhales. The vault's core-light gutters in a throat that should not have learned how.

THE CINDER MAW
It turns. A seed burns in the chest. That seed is the island, borrowed. Strike that.

THE CINDER MAW
The teeth are only weather. Kestrel would call this a bad room, and he would be late.

`cinderveil.maw.defeated`

*The shape forgets how to hold. The seed remains, small and offended, which is as close as a core comes to being ready.*

THE CINDER MAW
The shape forgets the grudge. Ash lies down. The seed sits in the quiet, small and deeply offended.

THE CINDER MAW
It will be a lamp again if you ask with shards. Cores are bad at gratitude. Ask anyway.

### The lamp, again

`cinderveil.lamp.relit`

*Shards on the hurt core. Orange returns to the ash like a rumor that turned out to be true. Down at the quay, the little lamps agree with each other. Then the air behind you becomes a parlor.*

CINDERVEIL'S LAMP
You set the shards on the hurt core. It takes them the way a fever breaks: all at once, and then the room is different.

CINDERVEIL'S LAMP
Orange comes back into the ash. Down at Lowmoor, the little lamps agree, one by one.

CINDERVEIL'S LAMP
For a breath the Hush steps off the quay. Someone behind you clears a throat, as if the dark were a parlor.

### The Cantor

`cinderveil.cantor.confront`

*They did not hurry. The Maw was a stomach. This is the sentence after the meal. Three replies. The game remembers which one, and Act 2 can ask.*

THE CANTOR
Wayfarer. You lit another one. If this is a hobby, it is an expensive one, and I am terribly fond of it.

THE CANTOR
The Maw was a stomach. I am a sentence. You may interrupt. Most guests apologize instead.

THE CANTOR
Come along, hear the ending, or refuse. Only one of those is yours.

* Spare them. → `cinderveil.cantor.spare` *(remembers cantor_choice = spare)*
* Listen. → `cinderveil.cantor.listen` *(remembers cantor_choice = listen)*
* Refuse. → `cinderveil.cantor.refuse` *(remembers cantor_choice = refuse)*

`cinderveil.cantor.spare`

THE CANTOR
Spare. You put the knife down and left me the conversation. How like a person who keeps a lamp.

THE CANTOR
I accept the delay. Tell the brother who fled that I remain polite. He will know which of us that frightens.

`cinderveil.kestrel.epilogue_spare`

*Kestrel, who has been pretending not to have followed you off the quay.*

KESTREL VANE
You let the mask walk. I would have introduced a wrench. Wrenches are a kind of theology. Next time, vote wrench.

`cinderveil.cantor.listen`

THE CANTOR
Then hear it once, cleanly. The sky is mid-sentence. We would like a period. Islands are the comma.

THE CANTOR
The shard in your hand has refused that period since you woke. I dress well for waiting.

`cinderveil.kestrel.epilogue_listen`

KESTREL VANE
You let them finish. Brave. I'll be over here, not making eye contact with the sky. Get on the boat when your ears stop ringing.

`cinderveil.cantor.refuse`

THE CANTOR
No is a complete sentence. I did tell the others you might. They hoped I was being modest.

THE CANTOR
Keep the lamp, the sailor, and the hand that will not finish the sentence. When the sky does it anyway, hold a rail.

`cinderveil.kestrel.epilogue_refuse`

KESTREL VANE
No. Excellent. No is a hull. It keeps the weather on the outside. Welcome aboard. Don't track ash onto the ash.

*The act ends on that landing. The Choir is not done. Neither is the hand. The Quickmercy is still arguing about which of you said the true thing.*

### Barks, if the ash is feeling talkative

`bark.tamsin.bench`

TAMSIN REED
Don't touch the cup. The cup is structural.

`bark.tamsin.dust`

TAMSIN REED
If the ash squeaks, squeak back. Dominance. I read it in a pamphlet Hesk will not admit is his.

`bark.hesk.crate`

BROTHER HESK
I am not hiding. The crate is hiding. I am inspecting the crate from the inside.

`bark.hesk.sorry`

BROTHER HESK
Sorry. That one was for earlier. I save them up, and then they leak.

`bark.ilsa.post`

WARDEN ILSA
If you are lost, you are not. The gap is that way. So is the mistake.

`bark.ilsa.count`

WARDEN ILSA
One way in. It is the hard way. I already counted.

`bark.quay.ash`

LOWMOOR
A gull made of cinders lands, remembers it is not a gull, and leaves.

`bark.maw.breath`

THE EMBER VAULT
Something in the vault exhales. The ash on the floor leans toward it, eager and stupid.

---

## Things you can look at

*Signs, stones, and objects. One or two lines. They are not errands.*

### Emberhold

`inspect.waking_stones`

WAKING STONES
Fell in the first night. Rose with a shard for a pulse.

WAKING STONES
Under that, newer, a careful hand: If you wake, the lamp is up the hill. Talk to Old Maren.

`inspect.scar`

THE SCAR
Here the meadow tore. Do not follow the lights down.

THE SCAR
Smaller, almost worn off: The lights are weather that learned a grudge. — M.

`inspect.quickmercy`

NAMEPLATE
QUICKMERCY. The letters are polished. The dents have been kept, like arguments she won.

NAMEPLATE
Along the keel, scratched and then half scratched out: she bites.

`inspect.lamp_cold`

GREAT LAMP
A violet quiet. It wants sky-shards. It will not pick them out of the grass itself.

GREAT LAMP
Old Maren is down the hill. She will not carry them either. The hill is full of principles.

`inspect.lamp_hungry`

GREAT LAMP
It is awake enough to be hungry. You hold {shards}. It eats five, from a living hand, on the plinth.

`inspect.lamp_lit`

GREAT LAMP
Gold, and a long breath. The little path-lamps have caught. The Hush has been asked to wait outside.

`inspect.wrong_sky`

THE WRONG SKY
Standing stones, all facing Emberhold's lamp, as if the light owed them an explanation.

THE WRONG SKY
Behind them the sky is the same sky. It does not seem to know it has been called wrong.

`inspect.heartblossom`

HEARTBLOSSOM
A blossom the color of a healed scrape. It smells like rain that changed its mind.

`inspect.rope_bridge`

ROPE BRIDGE
Rope, plank, and a sign someone nailed upside down on purpose.

ROPE BRIDGE
THE OTHER WAY IS FASTER. THE OTHER WAY IS A MISTAKE.

`inspect.span_planks`

FALLEN PLANKS
Planks hung in the gap, going nowhere on purpose. They are not a path. They are a warning with grain.

`inspect.sail_patch`

THE SAIL
A patch in slightly the wrong yellow. Threaded along the hem: she chose this color. Do not fix it. — K.V.

### Cinderveil

`inspect.lowmoor_sign`

QUAY SIGN
LOWMOOR QUAY. ASH IS FREE. OPINIONS ARE NOT. PLEASE DO NOT FEED THE HUSH.

QUAY SIGN
Under that, quicker: Tamsin, the bench is not a suggestion box. Stop leaving cogs in the suggestion box.

`inspect.tamsin_bench`

TAMSIN'S BENCH
A bench, a vise, and a teacup with a bolt in it. The bolt has been winning for some time.

TAMSIN'S BENCH
Chalked on the wood: THREE COGS. NOT TWO. NOT A PROMISE.

`inspect.ash_cog`

ASH COG
A cog in the ash, warm as a coin someone was ashamed of. It ticks once, like it recognized you and regrets it.

`inspect.vault_seal`

VAULT SEAL
EMBER VAULT. LANTERNWRIGHT SEAL. Under the wax, Ilsa's hand: If you can read this, you are too close. Good.

`inspect.cinder_core`

CINDER CORE
The island's heart, dim as a coal under a story. Something has been breathing through it.

`inspect.maw_tooth`

A TOOTH
A tooth in the ash, if clouds had teeth. It is still warm. It does not deserve to be.

`inspect.choir_crate`

HESK'S CRATE
A crate, a blanket, three polite pamphlets, and a note: I am not here. — H.

HESK'S CRATE
The note is here. Hesk is also here. The pamphlets are sorry about both facts.

`inspect.ilsa_order`

POSTED ORDERS
No bridges. No speeches. No feeding the vault. If the vault asks, that counts as feeding.

`inspect.quay_bell`

QUAY BELL
A quay bell stuffed with ash so it cannot ring. Someone was tired of news. The news came anyway.

`inspect.ember_path`

ASH PATH
Stakes along an ash path, unlit. They look embarrassed, which is a lot of work for a stick.
