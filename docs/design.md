# Shardfall — living design doc

**Current build:** v0.1, Emberhold.
**Play:** https://awsumbtech.github.io/shardfall/ once the Pages workflow has run on `main`.

This is the document to update when the world or a system changes. If a rule in code and a sentence here disagree, fix them in the same change. Player-facing notes live in `CHANGELOG.md` and in the in-game "What's new in v0.1" panel. This file can spoil secrets.

## Pillars

- **A phone game first.** One thumb on a stick, the other on Strike, Dash, and Talk. It has to feel good in portrait and in landscape, at 60fps, with no page scroll and no pinch zoom.
- **A place, not a level.** Emberhold is small, but it has a hill, a scar, a dock, a broken span, and a ledge you can miss.
- **Light that pushes the cloud back.** Relighting a lamp is the verb of the game. Combat and errands exist so the lamp can catch.
- **Polite strange.** The Hushborn are dangerous. The people are specific. The Cantor is frightening because the manners are perfect.
- **No ads, no accounts, no build step.** Plain HTML, CSS, and JavaScript. Art and sound are drawn and synthesized in the page. Nothing is fetched from the network.

## World bible

### The breaking

A century ago the sky cracked. The land did not flood and it did not burn. It came apart. What had been countryside is now a drift of islands over a cloud sea called the Hush. People still live on the ones with lamps. The charts call the gaps weather. The people who sail them call the gaps roads.

No one in v0.1 agrees why the sky opened. Maren treats it as a fact she has been tending for a long time. Kestrel treats it as geography. The Hollow Choir treats it as a memory that should be allowed to finish.

### The Hush

The Hush is the cloud sea under the islands. It glows. It is not water, and it does not hold a person. Step off an edge and it lets you fall, then the shard in the Wayfarer's hand flares and hauls them back. That rescue is not kindness from the Hush. It is the hand refusing to be dropped.

The Hushborn are cloud that learned a shape and a grudge. They are drawn to fallen sky-shards the way moths are drawn to a lamp, and they carry shards in their cores. Strike the core and the shape forgets how to hold.

Relighting a lamp does not destroy the Hush. It pushes it back. Grass remembers green. The small path-lamps catch. The wisps on that island come apart. Heavier things crack and stay, wounded, until someone finishes them.

### Shards

Sky-shards are pieces of the broken sky. They power lamps, sails, and — in the Wayfarer's case — a hand. A shard fused to the hand at the moment of waking. In v0.1 it can dash. The fiction, already promised, is that it will grapple later.

Shards are also the offering a lamp eats. Emberhold's great lamp wants five. Spare shards stay in the hand as a count. They are not a shop yet.

### Regions

v0.1 is one drift, three bits of land you can walk, and one name you cannot sail to yet.

```
        Whisper Hollow (secret ledge)
                 |
  Maren's Grove — Emberhold meadow — Lamp Hill ~~dash~~ Cinderstep
                 |                                  |
              The Scar                         The Wrong Sky
                 |
              The Dock
                 |
            rope bridge
                 |
            Vane's Perch
                 |
            the Quickmercy
```

**Emberhold** is the starter island. Warm grass, a terracotta cliff, a path from the waking stones up to the lamp and down to the dock. Old Maren keeps a cottage on the hill. The Scar is where the meadow tore; a marker there says not to follow the lights down.

**The Broken Span** is the east edge of the lamp hill. Two stone piers remain. The gap between them is cloud. A full dash from the lip of the near pier lands on the far pier. A walk, or a dash started too far back, falls. After the lamp, Shardstep is long enough to make the same hop from the middle of the near pier. Fallen planks hang in the gap. They are not a path.

**Cinderstep** is the islet past the span. The grass is the color of old coins. A Choirling keeps the landing. Standing stones face back toward Emberhold's lamp — "the wrong sky," in Kestrel's phrase. Behind them, north, a nub of rock called the Wrong Sky holds a shard the minimap will not mark until Kestrel has mentioned the stones or the Wayfarer has already landed.

**Vane's Perch** is south of the dock, across a rope bridge. Kestrel Vane is patching the Quickmercy, a sky-skiff with a shard-lit sail. Her nameplate is readable. The bridge is the safe way between islands. The span is the one that asks for nerve.

**Whisper Hollow** is west of Maren's grove, along a narrower ledge. It is on the map as land, and easy to walk past. The air there is blue. The Cantor stands in it and does not fight. A heartblossom grows off to the side.

**Cinderveil** is not in this build. Kestrel's name for a tear in the west, under the bright fracture. The lamp on Emberhold has to be lit before he will call the wind real. The hull is not ready. Leaving is a v0.2 problem.

### Factions

**Lanternwrights** keep the shard-lamps. They are few, practical, and tired in the way of people who have been right for a long time. Maren is the only one on Emberhold. Their creed, as she lives it: the lamp eats, the grass stays, you do the work with your own hand.

**Driftborn** are nomad sky-sailors. They know routes the charts still call cloud. They name ships the way other people name cousins. Kestrel is one sailor and one skiff, not an ambassador. Reputation with the Driftborn is a later system; in v0.1 he is a person with a hammer.

**The Hollow Choir** wants the sky fully broken. They are not, in this build, a horde. They are a voice. The Cantor is masked, oddly polite, and in no hurry. Choirlings — the ranged Hushborn — wear a cracked echo of that same mask. The Choir's door is not open in v0.1. The Cantor says so, and means it.

### Characters

**The Wayfarer** is the player. Silent. They woke on the stones with a shard for a pulse. The waking-stone inscription is newer than the rock: "If you wake, the lamp is up the hill." No chosen name in v0.1. See open questions.

**Old Maren** keeps Emberhold's great lamp. Lanternwright. Short sentences, warm hands, no patience for being handed the shards. She wants the Wayfarer to set them on the plinth. Talk to her and she mends you to full heart. She is the quest, the heal, and the thank-you.

**Kestrel Vane** is a Driftborn sky-sailor. Teal coat, yellow scarf, goggles he does not take off for conversation. He talks about the Quickmercy as if she argues back. He will not sail while the lamp is holding its breath. He is the one who tells you to dash the span, and to look behind the stones. After the lamp, he names Cinderveil and refuses to cast off today.

**The Cantor** is the masked voice of the Hollow Choir. Tall, gold hem, no feet worth mentioning. They admire the patches on the Quickmercy and will not wait on the dock. Finding them is optional. They do not join the quest and they do not attack. They are a promise that the Choir is a faction, not a monster type.

**The Quickmercy** is a patched sky-skiff. Not a character with lines. She is parked on Vane's Perch so the next voyage has a hull to point at.

## Systems

### Exploration

The camera is top-down and follows the Wayfarer, a little ahead of their facing. Zoom is based on the short side of the screen so a phone in either orientation shows the same amount of island and the same size of person.

Land is a union of circles, plus one rectangle for the rope bridge. Walking slides along an edge and cannot leave. Dashing can. Off the land, the Hush holds you for a moment. If the dash ends in cloud, the hand hauls you back to the last safe ground and the fall costs a little heart. If that would drop you, you wake at the stones instead, with a bit more than half a heart, and you do not lose shards.

The minimap shows the whole drift, the Wayfarer, living Hushborn, unspent shards, and the lamp. The alcove shard stays off the map until Kestrel's hint or a landing on the span's far side. The Cantor stays off it until Whisper Hollow has been entered. A gold pulse marks the current errand: Maren, the lamp once five shards are in hand, then Kestrel.

Shards on the ground are picked up by walking over them. People, inscriptions, and the lamp want the Talk button (or E). The button renames itself: Talk, Read, Lamp, Light, Listen. It pulses when something is in reach.

Points of interest in v0.1:

- The Waking Stones, where you start, with an inscription.
- Maren's cottage and the great lamp, up the hill.
- A shard in the meadow and a shard in the grove.
- The Scar, a brumekin, and a warning cut into stone.
- The broken span and the dash to Cinderstep.
- The Wrong Sky, behind the standing stones.
- The rope bridge, Vane's Perch, the Quickmercy, and her nameplate.
- Whisper Hollow.

### Combat

Real-time. The Wayfarer swings a short arc in the direction they are facing. Hits flash, shove, and show a number. A tiny pause sells the connect. Dash is a burst with a sliver of invulnerability and a cooldown drawn on the button. After the lamp, the dash is Shardstep: longer, sooner, and it singes anything it crosses.

Three Hushborn:

| | Heart | Strike | Notes |
| --- | --- | --- | --- |
| Wisp | 18 | 5 | Fast, close, no shard. Three on Emberhold, none of them on top of the waking stones. The lamp unmakes the ones still up. |
| Brumekin | 50 | 9 | Slow. Winds up, then lunges. Drops a shard. One in the Scar, one on the lip of the span — not in Maren's dooryard. |
| Choirling | 32 | 7 | Keeps distance and throws a violet note. Drops a shard. One on Cinderstep. |

Getting hit shoves the Wayfarer and grants a short invulnerability. Heart starts at 40. A lethal blow does not end the journey: the shard hauls you to the waking stones with a bit more than half a heart. Nothing already collected is lost. Hushborn that have been killed stay killed, and that fact is saved. They do not patrol back to life when you reload.

Maren heals on every conversation. Two heartblossoms (meadow, and the hollow) heal a chunk, or deepen max heart if you are already full.

### Progression

Experience comes from Hushborn. Thresholds are 24, 70, and 110.

- Level 2: +10 heart, filled.
- Level 3: +2 strike, +8 heart, filled.
- Level 4: +2 strike, +12 heart, filled.

A full clear of the six Hushborn is exactly level 4 (wisps 10 each, brumekin 24 each, the Choirling 32). The lamp's shockwave grants experience for the wisps it unmakes, so lighting early can level you.

The quest reward is not a level. It is Shardstep, on the hand itself. Spare shards and the two blossoms are the only other permanent gains. There is no shop and no second weapon.

### NPCs and the quest

One quest: **relight Emberhold's lamp.**

1. **Awaken.** The tracker says to find someone who knows the shard. Maren, if you speak to her first, tells you the lamp wants five shards and that your hand should set them down. Talking to her moves the quest to Gather. You can ignore her, collect five, and light the lamp anyway. She has a different thank-you if you do.
2. **Gather.** Shards in the meadow, the grove, and the Wrong Sky, plus the cores of both brumekin and the Choirling. That is six. The lamp eats five. The minimap marks the ones it is willing to spoil.
3. **Light.** With five or more, Talk on the lamp plays a short lighting. You can skip it. The lamp catches, five shards are spent, wisps come apart, heavier Hushborn crack, and Shardstep awakens. The tracker points at Kestrel.
4. **The hook.** Kestrel, after the lamp, names Cinderveil and will not leave today. The tracker then reads: "Cinderveil waits on the western wind."

The Cantor is not a step. Inscriptions are not steps. Kestrel before the lamp is a hint, not a gate: you can dash the span without him.

Dialogue is a bottom panel. Tap, E, Enter, or Space advances it. Nothing hunts you while you are reading, paused, or watching the lamp catch.

### Save

`localStorage` key `shardfall.v1`. One slot. The save stores place, facing, heart, level, strike, shards in hand, which pickups are gone, where dropped shards fell, which Hushborn are dead and how hurt the living ones are, quest stage, story flags, discoveries, and time on the Hush. Enemy positions reset to their homes on load so a reload cannot leave one inside a wall. Mid-fight damage is kept.

The game autosaves about every eight seconds, on a pickup, a kill, the end of a conversation, the lamp, a level, and when the page hides or you pause. The pause menu can Save, Load, or Reset. Reset deletes only `shardfall.v1` and returns to the title. New Game asks before it replaces a save. Continue is hidden when there is nothing to continue. Mute is a separate key (`shardfall.mute`) so it survives Reset.

A save from a future version number is ignored rather than half-applied. v0.1 writes `v: 1`.

`node tools/smoke.mjs` rebuilds the island rules, a strike, Maren's first talk, the lighting, a dash from the lip, and a save round-trip. It does not open a browser.

## Art direction

Stylized and colorful. No textures, no spritesheets, no downloads. Everything is canvas shapes, a handful of cached soft glows, and system fonts (a serif for the story, a round sans for the buttons).

The sky is a dusk gradient: indigo up high, peach at the cloud line, with a thin crack of light that never quite sets. Clouds are large, slow, and slightly behind the camera so the sea feels deeper than the islands. Islands have a cliff of terracotta under the grass, a pale rim on the sunward edge, and a soft shadow on the Hush. Emberhold is green. Cinderstep is coin-gold. Vane's Perch is teal, like shallow water that forgot it was cloud. Whisper Hollow is the same island with a blue wash.

Glow is the language. Shards are cyan diamonds. The unlit lamp is a dim violet crystal. The lit lamp is gold, with a beam and a wash over the grass, and the little stakes along the path catch. The hand-shard is the Wayfarer's brightest point. Hushborn are soft bodies with a hard core: wisps violet, brumekin amber and horned, Choirlings tall with a cracked mask.

UI is dark glass and gold hairlines, large round buttons, a heart bar and a thin experience bar. The title sits at the bottom of the portrait screen so the lamp hill shows above it. In landscape the title is a panel on the left.

If `prefers-reduced-motion` is set, screen shake is off and the talk-button pulse stops. The game itself still moves; it is a game.

## Audio

WebAudio only, after the first tap or key. A quiet set of tones: swing, hit, hurt, dash, pickup, the lamp's chord, a level, a dialogue tick. There is no music bed in v0.1. Mute is the speaker button or M, and it is remembered.

## Controls and the phone

Tested against a 412×915 CSS viewport, portrait and landscape, which is the class of size Brian's Samsung S25 Ultra uses in Chrome.

- The page is `position: fixed`, `touch-action: none`, and it cancels touchmove so the browser does not scroll, pull-to-refresh, or bounce.
- The viewport meta locks scale and requests the safe area. The stick, buttons, and panels pad with `env(safe-area-inset-*)`.
- The stick's grab area is the whole lower-left. The knob travels inside a fixed base. Analog tilt scales speed.
- Strike, Dash, and Talk are separate pointers, so a thumb can hold the stick and tap Strike in the same moment. Strike repeats on a cooldown while held. Dash and Talk fire once per press.
- Canvas backing-store pixel ratio is capped at 2. Glows are pre-drawn images, not per-frame blurs.
- Switching apps or unfocusing the tab pauses and saves, so a pocket does not eat the run.

Keyboard exists for a desk. The on-screen buttons stay visible there too.

## v0.1 content lock

In the build, and not negotiable without a doc edit:

- Emberhold, the span, Cinderstep, the rope bridge, Vane's Perch, Whisper Hollow.
- Wisp, Brumekin, Choirling.
- Maren, Kestrel, the Cantor, three inscriptions.
- The lamp quest, five shards, Shardstep, the Cinderveil hook.
- Levels 1–4, two blossoms, one save slot, title / continue / new game / reset, the v0.1 note.
- No second island, no grapple, no inventory screen, no faction meters.

## Roadmap

These are intentions, not promises. Each one should stay fun in a short sitting and still be a phone game.

### v0.2 — The western wind

Leave Emberhold. A short voyage on the Quickmercy: wind lanes over the Hush, not a menu. Land at Cinderveil, a larger island with its own unlit lamp. The hand learns to grapple, which is how the new island is shaped (gaps, wrecks, a mast). Driftborn camp. Spare shards start to buy a small choice: a longer singe, a kinder heal, a brighter lamp-sense. Kestrel has more than one conversation.

### v0.3 — Convoy

A Driftborn flotilla. One set-piece that is not a fight: escort or race a sister skiff across a storm gap. Reputation with Lanternwrights and Driftborn becomes a visible thing, still light. A lamp-well under an island: tighter rooms, the same combat, a brumekin that has learned the corridors. The atlas of sailed routes starts here.

### v0.4 — The polite dark

The Hollow Choir's island. The Cantor is a host. You can interrupt a rite, walk away, or hear it out. No one is eaten on screen; the horror stays in the manners and in what the rite would do to the crack. Choirlings arrive in groups. A new Hushborn sings a slow pulse you have to dash through. The sky-crack is brighter from this island than from Emberhold.

### v0.5 — Archipelago

Several lamps, and an overworld that is still a cloud sea rather than a menu of names. Each lamp you relight changes the color of the Hush nearby. One large island carries a Hushborn the size of a chapel, built from the same rules as a brumekin and a Choirling, not a new game. More than one save slot. The hand-shard finally answers, a little, about what it wants. That answer should be playable, not a paragraph.

## Open questions

These are for Brian. v0.1 picked an answer so the build could exist. None of them are load-bearing if he wants the other one.

1. **The Wayfarer's name.** Silent, and unnamed, for now. A name you type once on the title would be easy. A fixed name he likes would also be easy.
2. **Cinderveil.** That is the hook's name for the next island. It can change before v0.2 without hurting this build.
3. **How hard the Hush bites.** Death and a missed dash currently give you back, minus a little heart. A harsher version could keep a shard, or fray the lamp, or cost time. The gentle version is what is built.
4. **The Cantor.** Rival, tragic ally, or a third route you can actually walk in v0.4. v0.1 only promises that they are polite and that they are not done.
5. **Art.** Stay procedural, which keeps the game a single folder with no assets, or move to drawn sprites once the islands multiply.
6. **The hand.** One gift at a time (dash, then grapple), or a small build you spend shards on. v0.1 is one gift. v0.2's note above leans toward a few choices. Worth deciding before those choices exist.
7. **How much they talk.** Maren and Kestrel are short on purpose. If he wants them chattier, the dialogue panel already supports more lines.
8. **Sound.** On after the first tap, quiet, and easy to mute. It can default to muted if the phone speaker is the wrong call.

## Tinkering

Code map, if a section above needs a change:

| | |
| --- | --- |
| `js/data.js` | Island shape, spawns, dialogue, colors of the rules |
| `js/sim.js` | Movement, combat, quest, the dash gap's actual behavior |
| `js/draw.js` | How the drift looks |
| `js/ui.js`, `css/style.css` | Buttons, panels, safe areas |
| `js/save.js` | The v1 save shape |
| `js/input.js` | Stick, buttons, keys, the no-scroll guards |
| `js/audio.js` | Tones |
| `.github/workflows/pages.yml` | The Pages deploy |

`SF.audit()` returns a list of layout problems (a pickup off the grass, a dash from the lip that misses, a ledge you cannot walk). The smoke script runs it.
