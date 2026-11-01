# Shardfall — living design doc

**Current build:** v0.4, Act 1 rebuilt. PC first, landscape, 640×360 scaled in whole steps. Fights are turn-based random encounters. No enemies walk the field except set pieces (the Cinder Maw, and later the Tidewyrm). Act 1 is solo. After it, the sail chart reaches Saltmere, Gullrock, the Drift Market, and Lowgate under Highspire. Act 2's spoken lines are not in the game yet. The shared build notes are in `docs/v0.3-spec.md`. Act 1's gameplay is `docs/gameplay-act1.md`. The island shapes are `docs/island-plan-v2.md`. Act 1's names and dialogue ids stay in `docs/v0.2-spec.md`.
**Play:** https://awsumbtech.github.io/shardfall/ once the Pages workflow has run on `main`.

This is the document to update when the world or a system changes. If a rule in code and a sentence here disagree, fix them in the same change. Player-facing notes live in `CHANGELOG.md` and in the in-game "What's new" panel. This file can spoil secrets.

## Pillars

- **A PC game first, a phone game second.** Landscape on both. The picture is 640×360 and scales by whole integers. Keyboard and mouse are the primary controls. A touch overlay appears only on a touch device. A phone held upright asks you to turn it sideways. There is no portrait mode. 60fps, no page scroll, no pinch zoom.
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

Sky-shards are pieces of the broken sky. They power lamps, sails, and — in the Wayfarer's case — a hand. A shard fused to the hand at the moment of waking. It dashes. After Tamsin fits the hook, it grapples.

Shards stay hidden until Maren points at the lamp and the shard in the hand answers (`shard_sense`). Before that beat they are not on the ground, not in a fight's reward, and not on the minimap. After it, the hand pulses within ten tiles and a shard glints within six. The minimap never marks shards. Secret shards (the alcove, the Cold Nook) stay dark until their hint.

Shards you carry charge the hand. Lighting a lamp spends the charge. Emberhold's great lamp wants five. Cinderveil's wants three. Spare shards after the next unlit lamp is paid for buy a few changes to the hand: a longer dash, a quicker hook, a brighter strike, a deeper heart, and a harder singe once Shardstep is awake. The upgrade menu will not spend shards the next lamp still needs.

### Regions

Emberhold is the starter drift. Cinderveil is the ash island west of it, reached on Kestrel's skiff. After Act 1, the sail chart also opens Saltmere, Gullrock, the Drift Market, and Highspire's gate town, Lowgate. The city gate itself stays locked until Saltmere's lamp is lit (`saltmere_lamp` = `lit`). Even then the gate does not open. The line on it is "Story continues in Act 2".

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

**Cinderveil** is the second island: ash-grey grass, ember cracks, a teal rim on Lowmoor Quay. Tamsin Reed works a hook in her workshop. Brother Hesk mutters about the Choir. The Ashfields hold three cogs and a Cold Nook. Warden Ilsa stands on Ilsa's Cliff, reached on foot from the Ashfields. Two hooked gaps — wider than Shardstep — lead from her cliff to the Vault Ledge and then the Ember Vault, and only after she says the gap is yours. The Cinder Maw is the one foe you can see on the map. It feeds on the core. The hurt lamp on the ridge takes three shards. The ridge path opens after the Maw. The Cantor is there after, with Spare, Listen, or Refuse. The words are in `docs/script/act1.md`. Lowmoor has a shop, and the quay has a bunk where you can rest.

**The sail chart** is the world map. Emberhold and Cinderveil open once the skiff is ready. Saltmere, Gullrock, the Drift Market, and Lowgate open after Act 1. A crossing is a short scene. Every third one can be boarded (`sea_hush_raiders`, on the deck). Act 1 is fought alone. When the act ends, Kestrel and Tamsin join. Each join is a banner, once.

**Saltmere** is a fishing town on stilts. Quinn's Hooks is the shop. The Stilthouse is the inn. The Shore is east, with saltwisps, stormgulls, and a mixed fight. The Holdfast, the sunken wreck, sits under the west pier. The gap is wider than a dash and short enough for the hook. A side rock and the Tidewyrm arena are two more hooks. After the Tidewyrm, the lamp house can take the feed, and the lamp holds.

**Gullrock** is a bare rock. One chest, and one hard fight if you go for it.

**The Drift Market** is a raft with no lamp. Sile Voss sells rare stock, including the gale charm and the tide ward.

**Lowgate** is the town under Highspire. Dorrie Fen keeps the shop. Maud Keel keeps the Switchback inn. Ellis Ward is in town. Warden Brant stands at the gate. The switchback has a Choir patrol and a sentinel. Past the gate there is no road.

People added for Act 2, each with one placeholder line until the script is approved:

| Node | Speaker | Where |
| --- | --- | --- |
| `saltmere.harbormaster` | Brenna Holt | Saltmere pier |
| `saltmere.innkeeper` | Osric Pell | the Stilthouse |
| `saltmere.shopkeeper` | Nessa Quinn | Quinn's Hooks |
| `saltmere.sera` | Sera Dunne | the lamp house |
| `saltmere.kids` | Pip and Lark | the docks |
| `saltmere.jory` | Jory Hale | the docks |
| `highspire.captain` | Warden Brant | the gate |
| `highspire.shopkeeper` | Dorrie Fen | Lowgate shop |
| `highspire.innkeeper` | Maud Keel | the Switchback |
| `highspire.ellis` | Ellis Ward | Lowgate |
| `driftmarket.voss` | Sile Voss | Drift Market |

### Factions

**Lanternwrights** keep the shard-lamps. They are few, practical, and tired in the way of people who have been right for a long time. Maren is the only one on Emberhold. Their creed, as she lives it: the lamp eats, the grass stays, you do the work with your own hand.

**Driftborn** are nomad sky-sailors. They know routes the charts still call cloud. They name ships the way other people name cousins. Kestrel is one sailor and one skiff, not an ambassador. Reputation with the Driftborn is a later system; in v0.1 she is a person with a hammer.

**The Hollow Choir** wants the sky fully broken. They are not, in this build, a horde. They are a voice. The Cantor is masked, oddly polite, and in no hurry. Choirlings — the ranged Hushborn — wear a cracked echo of that same mask. The Choir's door is not open in v0.1. The Cantor says so, and means it.

### Characters

**The Wayfarer** is the player. Silent. They woke on the stones with a shard for a pulse. The waking-stone inscription is newer than the rock: "If you wake, the lamp is up the hill." No chosen name in v0.1. See open questions.

**Old Maren** keeps Emberhold's great lamp. Lanternwright. Short sentences, warm hands, no patience for being handed the shards. She wants the Wayfarer to set them on the plinth. Talk to her and she mends you to full heart. She is the quest, the heal, and the thank-you.

**Kestrel Vane** is a Driftborn sky-sailor (she/her). Teal coat, yellow scarf, goggles she does not take off for conversation. She talks about the Quickmercy as if the skiff argues back. She will not sail while the lamp is holding its breath. She is the one who tells you to dash the span, and to look behind the stones. After the lamp, she names Cinderveil and offers the crossing. What you answer is remembered the next time you talk to her on the dock.

**The Cantor** is the masked voice of the Hollow Choir. Tall, gold hem, no feet worth mentioning. They admire the patches on the Quickmercy and will not wait on the dock. Finding them is optional. They do not join the quest and they do not attack. They are a promise that the Choir is a faction, not a monster type.

**The Quickmercy** is a patched sky-skiff. Not a character with lines. She is parked on Vane's Perch so the next voyage has a hull to point at.

## Systems

### Exploration

The camera is top-down and follows the Wayfarer, a little ahead of their facing, and it stops at the island edge. The picture is 640×360. Wider screens show more to the sides. The height stays 360. The hero is 24×38 pixels, about a tenth of that height, drawn 1:1 with the 16-pixel tiles.

Land is a union of circles, plus one rectangle for the rope bridge. Walking slides along an edge and cannot leave. Dashing can. Off the land, the Hush holds you for a moment. If the dash ends in cloud, the hand hauls you back to the last safe ground and the fall costs a little heart. If that would drop you, you wake at the stones instead, with a bit more than half a heart, and you do not lose shards.

The minimap shows the whole drift, the Wayfarer, the lamp, and the current errand. It does not show shards. It does not show field Hushborn, because they are not on the map. The Cantor stays off it until Whisper Hollow has been entered. A gold pulse marks the current errand: Maren, the lamp once the hand is fully charged, then Kestrel.

Shards on the ground can be picked up only after `shard_sense`, and only once they are glinting (within six tiles). A banner says which shard that was, out of five, while Emberhold's lamp is still dark. People, inscriptions, and the lamp want E, Enter, Space, or a click. Within reach the prompt renames itself: Talk, Place shards, or Inspect, and a gold line names the target ("Talk — Old Maren"). A little farther out, the press says to walk closer.

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

Fights are turn-based, on their own screen. The field is still real time: walk, dash, and the hook. There is no swing and no Fight button. Nothing hunts you on the grass. A step counter rolls a fight from the region's table (`Battle.start(formation, { bg })`). Safe ground never rolls. The first ten steps after a fight, a load, or entering a region are free. A lit lamp cuts that island's random fights to about a third, and Lamp Hill becomes safe. The Scar stays at its own rate. Bosses and the Cinderstep choirling are fixed fights. You cannot flee those. A random fight can be fled. Losing returns the party to the last checkpoint at half HP. Marks, items, and XP stay.

The turn order is a strip at the top. Speed fills a gauge. The actor who fills it acts, then waits again. Defend holds the defender's gauge so a living foe can act while Guard is up. The commands are Attack, Skill, Item, Defend, and Flee, in large buttons along the bottom. Tap a foe or a party portrait to aim. The log is plain: "Kestrel attacks!", "Wisp is defeated.", "Level up!". A solo fight uses a short strip and does not repeat "You" for every upcoming turn.

Combat is split into single-purpose modules under `js/battle/`. The rules emit typed events. The screen subscribes. It does not discover a hit by comparing HP.

| Module | Object | Job |
| --- | --- | --- |
| `events.js` | BattleEvents | Pub/sub. `hit`, `crit-ready`, `weak`, `resist`, `kill`, `phase`, `heal`, `turn-start`, `hit-pause`. |
| `state.js` | BattleState | Builds party and foe actors. No rules. |
| `timeline.js` | Timeline | Charge-time gauge, the next actor, the 8-deep forecast. Same numbers as before. |
| `formula.js` | Formula | Damage, guard, weakness, and resist. A pure function. Same numbers. |
| `resolver.js` | ActionResolver | Applies Attack, Skill, Item, Defend, and Flee, then emits the events. |
| `ai.js` | EnemyAI | Today's foe script: a skill every third turn, aimed at the lowest HP. |
| `rewards.js` | Rewards | XP, marks, drops, stolen goods, and the carrier shard. |
| `feel.js` | BattleFeel | Readout length and the hit-pause option. |
| `renderer.js` | BattleRenderer | Listens, and records pops, tags, the flash, and the pause. |
| `draw.js` | BattleUI | Draws the strip, the stage, the commands, and the result card from that record. |
| `battle.js` | Battle | `Battle.start` and the field hooks the rest of the game already calls. |

`crit-ready` is on the bus for a later timing window. Nothing emits it yet, because a hit is still not a crit.

A hit shows a large number above the target, and a WEAK or RESIST tag when the formula said so. The number does not sit on the name. Foe names sit on the lower body, below the sky line, so they do not cover the trees. The target flashes white and takes a small knockback. Reduce flashing skips the white flash and holds the knockback still. The hit-pause hook freezes the battle for about 60ms. `prefers-reduced-motion` skips that freeze and still emits `hit-pause` with `ms: 0`. Readouts last 0.55s. They were 1.05s, or 0.70s with Reduce flashing. A tap skips one. Holding the screen, a confirm key, or the A button past a short moment fast-forwards. The victory card is the result, the marks, and a level line. It is not a scrolling list of every stat.

The party holds up to three. Through Act 1 the Wayfarer fights alone, including the Cinder Maw, and a solo fight shows one wide party card under the turn strip. Kestrel joins when `party_kestrel` is set. Tamsin joins when `party_tamsin` is set. Act 2 departure scenes set those flags after `act1_end`. The first sail and the grapple gift do not. If `act1_end` is reached and either flag is missing, both are set, and the banners read "Kestrel joined the party." and "Tamsin joined the party." The same happens for a save that is already past the end of Act 1. No new spoken lines. XP from a win goes to every member who has joined. A member who joins later starts at the Wayfarer's level.

Stats are HP, SP, Attack, Defense, Magic, and Speed. Elements are Ember, Tide, Gale, and Shard. One hit, or Scan, shows a foe's weakness. A weakness deals more. A resist deals less. The Cinder Maw is one target: its core. At about 60% HP the log says "The core flares." At about 30% it says "The core is open." The core is weak to Shard and resists Ember. Winning still runs the old Maw events: the cracked core, then the vault lamp, then the Cantor.

Random formations and the encounter they start are in `js/data/encounters.js`. The Cinder Maw is `boss_cinder_maw`. It is the Act 1 foe you can see, and the fight starts from `boss_start` after you inspect it. A loss there returns you to the Vault Ledge.

Saltmere, Highspire, and the skiff use `sm_saltwisps`, `sm_drowned`, `sm_gulls`, `sm_mixed`, `boss_tidewyrm`, `hs_choir_patrol`, `hs_sentinel`, and `sea_hush_raiders`. WORLD can set `spawn.encounter` to any of these ids. Background ids are `emberhold_meadow`, `emberhold_scar`, `cinderveil_ash`, `ember_vault`, `saltmere_shore`, `saltmere_wreck`, `highspire_road`, and `hush_deck`.

`Music.play("battle")` plays for a normal fight and `Music.play("boss")` for a boss. A win plays the `fanfare` effect. Hits pulse haptics. Reduce flashing keeps the core glow steady and skips shake.

A fall off the island still hauls the Wayfarer back. It is not a battle loss. Maren, on a conversation, fills the party's HP and SP. Sky-shards from fights come from a carrier formation, the first win in that region, and only after `shard_sense`. The reward line says "Sky-shard". You cannot farm them.

### Progression

Levels run from 1 to 30. The XP to reach the next level is `18 + 4.2×L + 0.55×L²`, rounded, and summed. A normal Act 1 that fights the foes on the road is about level 5 after Emberhold and about level 8 at the Maw. Each member has their own growth. A level-up fills that member's HP and SP and shows the stat changes. New skills arrive at set levels, six each by level 20. The Wayfarer learns Shard Bolt, Scan, Mend, Lampflare, Shard Ward, and Skybreak. Kestrel learns Quickshot, Steal, Twin Cut, Gale Shot, Smoke Step, and Killing Shot. Tamsin learns Spark Coil, Patch Up, Overclock, Tonic Spray, Tide Filter, and Field Kit.

Marks are the coins (`state.gold`). Shops call `SF.shopBuy(id)` and `SF.shopSell(id)` with ids from `js/data/items.js`. The pack starts with 4 Tonics and 2 Ethers. Gear has three slots: Weapon, Armor, Charm. The menu shows the numbers, such as "Attack +6". The pause button opens that menu: Party, Skills, Items, Equip, Save, Settings.

A v0.2 save (and a v0.1 save) loads on the v0.4 curve. Old XP is kept and scaled by 1.25, then read on the new curve. A v0.3 save keeps its party, pack, and marks. A journey still inside Act 1 stays a party of one. A save already past `act1_end` gains Kestrel and Tamsin, with the join banners, if those flags were missing. The pack starts with a few tonics so the road is not empty. Saves store `party`, `inventory`, `gold`, and `known`. A save from before the new islands is set down on the nearest safe spot for that point in the story. A journey past Maren's introduction gains `shard_sense`.

Shardstep is still the lamp's reward, and spare shards still buy hand changes at Tamsin's bench. Bright Edge adds 3 Attack. Deep Heart adds 14 HP. Those numbers are part of the Wayfarer's battle stats.

### NPCs and the quest

One quest: **relight Emberhold's lamp.**

1. **Awaken.** The tracker says "Talk to Old Maren, up the hill." A gold arrow at your feet, a marker on her, and an edge arrow when she is offscreen all point the same way. Talking to her is required. When she points at the lamp, the hand learns `shard_sense`, the quest moves to Gather, and the hand meter reads 0/5. There is no path that skips her and still lights the lamp.
2. **Gather.** The tracker counts, "Find 5 sky-shards (2/5)". The hand pulses within ten tiles of a shard, and the shard glints within six. Shards are never drawn on the minimap. The alcove shard stays dark until Kestrel's tip. At five it changes to "Bring them to the lamp — Place shards."
3. **Light.** With five or more, Place shards on the lamp plays a short lighting. You can skip it. The lamp catches, five shards are spent, Lamp Hill goes quiet, and Shardstep awakens. The tracker points at Kestrel: "Talk to Kestrel on Vane's Perch."
4. **The hook.** Kestrel, after the lamp, names Cinderveil and offers the Quickmercy. The offer ends by dispatching `open_sail_menu`, which opens the sail menu. The first crossing is the sail scene. The tracker reads "Sail to Cinderveil."

The first minute teaches one thing at a time, and only until you have done it: move, then Talk when someone is in reach, Dash before the lesson expires and again at the broken span. Those lessons are saved with the journey. A Continue from an older save does not restart the move lesson if you have already been walking. Walking off an edge, including a short dash that misses the span, says "The gap is too wide. Try Dash." Dash on cooldown says so.

The Cantor is not a step. Inscriptions are not steps. Kestrel before the lamp is a hint, not a gate: you can dash the span without her.

Dialogue is a bottom panel: a name, a drawn face or a color badge, and one or two sentences. Tap, E, Enter, or Space finishes a line that is still arriving, then advances. Each new line blips in that speaker's pitch. While letters are still arriving, the same voice ticks every few characters. With Reduce flashing on, or when the system asks for less motion, the line arrives whole, the caret does not blink, and that line is a single blip. Choices are large buttons. A choice can set `state.flags`, and a later choice can require those flags. Flags are saved with the journey. When a conversation closes, each node's `onEnd` is dispatched in order (`SF.onDialogueEvent`, or the window event `sf:dialogue`) so gameplay can hook it. `startDialogue(id)` starts a node. An unknown id plays one placeholder line and does not throw. The Act 1 script is `docs/script/act1.md`; the nodes are `js/content/dialogue/`. Nothing hunts you while you are reading, paused, or watching the lamp catch.

### Save

`localStorage` key `shardfall.v1`. One slot. The save stores place, facing, the party, the pack, marks, shards in hand, which pickups are gone, where dropped shards fell, which set-piece foes are down, quest stage, story flags, discoveries, and time on the Hush. Foe positions reset to their homes on load so a reload cannot leave one inside a wall. A save from before v0.4 migrates onto the new islands. A save from a future version number is ignored.

The game autosaves about every eight seconds, on a pickup, a kill, the end of a conversation, the lamp, a level, and when the page hides or you pause. The pause menu can Save, Load, or Reset. Reset deletes only `shardfall.v1` and returns to the title. New Game asks before it replaces a save. Continue is hidden when there is nothing to continue. Mute (`shardfall.mute`) and Reduce flashing (`shardfall.reduceFlash`) are separate keys so they survive Reset. Reduce flashing defaults to on. Unset means on.

A save from a future version number is ignored rather than half-applied. v0.4 writes `v: 4` and still reads `v: 1`, `v: 2`, and `v: 3`. A v0.1 journey that already lit the lamp, or that had reached `hooked`, unlocks the skiff. Quest names stay as they were. A gather save stays a gather save. Mute, Reduce flashing, music volume, effects volume, haptics, and the Fewer/Normal/More encounter setting stay on their own keys.

`node tools/smoke.mjs` rebuilds the island rules, a battle, Maren's first talk, the lighting, a dash from the lip, the Maw, and a save round-trip. It does not open a browser.

## Art direction

16-bit, SNES-era, in the neighborhood of Final Fantasy VI and Chrono Trigger. Every sprite, portrait, tile, and battle background is a palette-indexed pixel grid drawn in code, rasterized once to an offscreen canvas, and blitted with nearest-neighbor scaling onto whole device pixels. Nothing is downloaded. The dusk sky stays a smooth gradient: indigo up high, peach at the cloud line, and a thin crack of light that never quite sets. Lamp glow, the island's soft shadow on the Hush, and the vignette stay smooth. Pixel art does not.

`?gallery` (or `#gallery`) opens a review page of every sprite, portrait, and battle background. It does not start the game loop.

### Who is who

People are drawn large enough to read on a phone (about 17×26 source pixels, drawn at field scale 2). Feet sit on the baseline so they sort with the ground.

- **Wayfarer.** Short dark hair, blue coat, a cyan shard glowing in the right hand.
- **Kestrel Vane** (she/her). Ponytail, teal captain's coat, yellow scarf, goggles, a pistol at the hip.
- **Tamsin Reed.** Young, freckled, orange vest over a cream shirt, a tool belt, a wrench in hand.
- **Old Maren.** White bun, shawl, long skirt, a staff.
- **Warden Ilsa.** Broad, helmeted, armored, spear.
- **Brother Hesk.** Choir hood and robe, a pale stole.
- **The Cantor.** Pale mask, void robe, gold hem, no feet.
- Villagers, Choirlings, and the later party-facing foes (saltwisp, drowned, stormgull, tidewyrm, choir soldier, sentinel, hush raider) each have their own silhouette and palette.
- **Brenna Holt.** Harbormaster. Teal coat, dark cap, a coil of rope.
- **Osric Pell.** Inn keeper at the Stilthouse. White hair, apron, a mug.
- **Nessa Quinn.** Shopkeeper. Sand vest, tool belt, a hook.
- **Sera Dunne.** Lamp keeper. Pale, a shawl, a small lantern.
- **Pip.** Dock kid. Green cap.
- **Lark.** Dock kid. Red scarf and skirt. The shared line uses a portrait of both.
- **Jory Hale.** Fisher. Oilskin coat and a net.
- **Warden Brant.** Stone helm, gold plume, a spear. Not Ilsa's red plume.
- **Dorrie Fen.** Lowgate shopkeeper. Grey bun, brown apron.
- **Maud Keel.** Inn keeper at the Switchback. Broad, gold apron, a mug.
- **Ellis Ward.** Young townsman in a blue coat.
- **Sile Voss.** Drift Market trader. Wide violet hat, gold satchel.

### Calling the art

`window.Art` is the contract. The battle screen calls these. If a script runs before the art files, check `window.Art` and fall back.

```js
Art.sprite(ctx, id, x, y, { frame, facing, scale, pose, anchor, fx, fy });
Art.portrait(ctx, id, x, y, size);
Art.battleBg(ctx, bgId, w, h, t);
Art.window(ctx, x, y, w, h, opts);
Art.tile(ctx, name, x, y, scale);
Art.preload();
```

`Art.sprite` puts the feet on `(x, y)`. `scale` defaults to `Art.defaultScale(id)` (2 for people and most foes; the Cinder Maw and the Tidewyrm default to 2 and use `Art.fieldScale` 1 on the map so they stay large without covering a quay). `anchor: "center"` or `"top"` overrides the feet.

`facing` is `"down"`, `"up"`, `"left"`, or `"right"`. `"n" "s" "e" "w"`, `0–3`, and `"side"` are accepted. `fx` / `fy` pick a facing when `facing` is omitted.

`pose: "walk"` is the field cycle: four directions, four frames (0 and 2 are the contact poses, 1 and 3 step). A numeric `frame` is that walk index. `pose` `"idle"`, `"attack"`, `"hurt"`, `"cast"`, or `"victory"` is the side-view battle frame (two frames, facing left or right). A string `frame` (`"idle"`, `"attack"`, `"hurt"`, `"cast"`, `"victory"`, `"walk"`) is treated as the pose, so `Art.sprite(ctx, "kestrel", x, y, { frame: "attack" })` is a battle swing. On the map the Cinder Maw and the Tidewyrm keep their smaller walk sprites. In a fight those two use a taller battle sprite: the Maw is a reared furnace-mouth, the Tidewyrm a stacked coil with its head high. Hurt closes the Maw and dims both cores. Victory lifts a person and raises their weapon.

Sprite ids: `wayfarer`, `kestrel`, `tamsin`, `maren`, `hesk`, `ilsa`, `cantor`, `villager_a`, `villager_b`, `brenna`, `osric`, `nessa`, `sera`, `pip`, `lark`, `jory`, `brant`, `dorrie`, `maud`, `ellis`, `sile`, `wisp`, `brumekin`, `choirling`, `ashling`, `cinderhound`, `cinder_maw`, `saltwisp`, `drowned`, `stormgull`, `tidewyrm`, `choir_soldier`, `sentinel`, `hush_raider`, `chest`, `chest_open`, `lamp_cold`, `lamp_lit`, `shard`, `skiff`, `cog`, `sign`. The field also uses `sootwing`, `tree`, `tree_bare`, `rock`, `cottage`, `workshop`, `stones`, `ruin`, `plank`, `flower`, `flower_gold`, `flower_tide`, `blossom`, `bench`, `bell`, `hut`, `stilt`, `stall`, `wreckhull`, `gatearch`, `raft`, `signpost`, `inn`, and `tile_*` pattern names. An unknown id draws an 8×8 magenta checker and does not warn.

`Art.portrait(ctx, id, x, y, size)` draws a square face for dialogue, menus, and the battle turn strip. Named people have portraits, including the Wider Hush cast and `pip_lark` for the shared dock-kid line. Every foe has one too: `wisp`, `brumekin`, `choirling`, `ashling`, `sootwing`, `cinderhound`, `cinder_maw`, `saltwisp`, `drowned`, `stormgull`, `tidewyrm`, `choir_soldier`, `sentinel`, `hush_raider`. So do the inscription badges (`stones`, `lamp`, `ship`, `scar`, `core`, `sign`, `crate`, `ash`, `blossom`, `bridge`, `vault`, `bell`, `hush`). Unknown ids use a generic face. `Art.portraitIds()` lists them. A dialogue node can set `portrait`. If it does not, the speaker name still picks a face for the people above.

`Art.battleBg(ctx, bgId, w, h, t)` fills the rectangle at the current origin, from `(0, 0)` to `(w, h)`, clipped to that box. Ids: `emberhold_meadow`, `emberhold_scar`, `cinderveil_ash`, `ember_vault`, `saltmere_shore`, `saltmere_wreck`, `highspire_road`, `hush_deck`. An unknown id uses the meadow. `t` is seconds. Clouds drift slowly unless `Art.calm()` is true, which it is when Reduce flashing is on (the default) or the system asks for less motion.

The battle screen is a side view on that background. Enemies stand on the left, facing right. The party stands on the right, facing left. Sprites are large enough to fill that stage on a phone: a solo party member is about three times the old battle scale, small foes (wisps, ashlings) are scaled up until the body reads, and a pair is staggered in depth so both stay big. The Cinder Maw and the Tidewyrm use their tall battle sprites and take most of the left half. Feet sit on a shared ground line just above the party card; a second foe stands higher, further back. An attack steps the actor toward the other side. A hit knocks the target back a short way. Ember, Tide, Gale, and Shard draw a cluster of colored pixels on the target's body (blocks, drops, streaks, diamonds), and a damage number rises off the sprite. Reduce flashing holds those motions to one still pose and a steady number, with no white flash and no strobe. A win lifts the party into `pose: "victory"` above the reward window. Pass `pose: "idle" | "attack" | "hurt" | "cast" | "victory"` (or a string `frame` of the same name). A numeric `frame` without a pose is the field walk cycle, which is the wrong picture for a fight. The turn strip, the log, the commands, and the field menu use `Art.window` (and the same blue CSS on the DOM menu). The party card and the turn strip use `Art.portrait`, including a foe icon for every enemy. On the field, the objective and the hint share one window. Each hint fades after the first time it is shown.

`Art.window(ctx, x, y, w, h, opts)` paints a Final Fantasy-style window: deep blue, cream outer border, light-blue inner line. It returns the content rectangle `{ x, y, w, h }`. `opts.title` draws a gold label and pushes the content rect down. DOM menus use the same chrome in CSS (`.panel`, `.card`, `#dialogue`, `#toast`, the corner buttons).

`Art.tile` stamps one terrain cell. `Art.fillPattern(ctx, name)` fills the current path with a repeating tile. Terrain names: `grass`, `grass_light`, `cliff`, `shore`, `gold`, `ash`, `stone`, `vault`, `path`, `cobble`, `plank`, `dock`, `pier`, `sand`, `hold`, `wood`, plus the `_light` variants the islands use for a sunward rim.

`Art.spriteSize(id, pose, facing)` returns `{ w, h, ax, ay }` in source pixels. `Art.ids()` lists sprite ids. Call `Art.preload()` once after boot; the game already does.

### The drift

Islands are still unions of circles. The cliff is terracotta pixel stone, the top is a tileset: Emberhold grass, Cinderstep coin-gold, Vane's Perch a teal shore, the span pale stone, Lowmoor cobble, the Ashfields ash, the vault dark rock. Saltmere is dock planks over a pier, the shore is sand, the Holdfast is dark hold timber, Lowgate is cobble, the switchback is a path, Gullrock is stone, and the Drift Market is plank. Paths are stamped tile, not a stroked line. Trees, rocks, cottages, the workshop, lamps, the skiff, stilts, huts, stalls, the wreck hull, the Lowgate arch, and the market raft are sprites. The sail chart, the shop, and the inn use the same blue window, with a pixel island on each chart pin and the keeper's portrait on the shop and the inn. The Hush under the islands is the same cloud sea, now stamped from pixel clouds that drift behind the camera. Reduce flashing holds the lamp steady, skips decorative bobbing, and leaves the walk cycle running while someone is actually moving. Hits do not blink the Wayfarer. A hit is a small warm spark and, unless Reduce flashing is on, a faint red edge. Shake is off when Reduce flashing is on. The canvas backing store is still reallocated only when the CSS size changes by more than a pixel.

The title is that same sky, with pixel island cards, and the menus sit in the blue window chrome. Zoom snaps so device pixels times zoom is an integer, which is what keeps the sprites crisp at 412×915.

## Audio

WebAudio only, created on the first tap or key. A short silent buffer plays inside that gesture so a phone will actually start the context. Mute is the speaker button or M. Music volume, effects volume, haptics, and Reduce flashing are separate settings, remembered on their own keys so Reset does not clear them: `shardfall.musicVol`, `shardfall.sfxVol`, `shardfall.haptics`, plus the existing `shardfall.mute` and `shardfall.reduceFlash`. Haptics default on. Volumes default to 0.75 music and 0.8 effects, on a 0–1 scale (`setVolume` also accepts 0–100).

Hiding the page suspends the audio context. Showing it resumes, if audio was already unlocked. The journey still pauses and saves when the page hides.

### Music

`Music.play(name)` crossfades (about 1.2 seconds) to a procedural loop. Names: `title`, `emberhold`, `cinderveil`, `sail`, `battle`, `boss`. Anything else is ignored. `Music.current()` is the theme now playing or the one just requested. `Music.stop()` fades out. `Music.setVolume(v)` is the music slider.

```js
Music.play("cinderveil");
Music.current();
Music.setVolume(0.8);
```

The loops are synthesized in the page: a calm hopeful Emberhold, an ashy driving Cinderveil, an open sailing tune, a tense but listenable boss bed, and a slow title. They are built to return to their first chord, so the seam is a breath rather than a click.

The feel loop calls `Music.play("title")` while the title is up. Leaving the title calls `Music.play("emberhold")` only when the current theme is still `title` or empty. A later `Music.play("cinderveil")`, `Music.play("sail")`, or `Music.play("boss")` sticks, including through the pause menu, until the next call. Returning to the title always comes back to `title`. Call `Music.play` when a voyage, an island, or a fight begins, and again after a load if the Wayfarer is already there.

### Effects

`Sfx.play(name, opts)` plays a short synthesized effect. `Sfx.setVolume(v)` is the effects slider. Unknown names do nothing. `opts.speaker` picks the dialogue pitch; if it is omitted, a `blip` uses the open conversation's speaker. Known voices (Old Maren, Kestrel Vane, the Cantor, Tamsin Reed, Brother Hesk, Warden Ilsa, the Cinder Maw, plus the stones and the lamp) have their own pitch. Any other name is hashed onto a scale, so a new speaker still sounds distinct.

| name | when |
| --- | --- |
| `footstep` | walking. The feel loop plays this from movement. |
| `whoosh` | the swing starts. `SF.emit("swing")` maps here. |
| `impact` | a strike connects. `SF.emit("hit")` maps here. |
| `dash` | dash |
| `grapple` | the hook is thrown |
| `latch` | the hook catches |
| `pull` | the reel starts |
| `pickup` | a shard or a blossom |
| `lamp` | a lamp relights. Slow swell. |
| `blip` | a line of dialogue, in that speaker's pitch. `SF.emit("talk")` maps here. The dialogue engine calls it when a line starts, and again every few letters while the line is arriving. |
| `ui` | a button |
| `hurt` | the Wayfarer is hit |
| `death` | the shard hauls them back to the stones |
| `enemyHurt` | a Hushborn flinches, when it should sound different from the weapon impact |
| `enemyDeath` | a Hushborn comes apart. The feel loop plays one of these when any foe dies, including several at once. |
| `roar` | the Cinder Maw, when the fight begins |
| `level` | a level |
| `fanfare` | a battle is won |

`SF.emit(name)` still accepts the v0.1 names (`swing`, `hit`, `hurt`, `dash`, `pickup`, `lamp`, `talk`, `death`, `level`, `ui`).

### Haptics

`Haptics.pulse(pattern)` calls `navigator.vibrate` when the toggle is on and the phone supports it. Patterns are short. `Sfx.play` already pulses on `impact` (12ms), `hurt` (18ms), `pickup` (10ms), and `lamp` (12ms, a gap, 16ms). `Haptics.setEnabled(false)` is the settings toggle and is remembered.

## Controls

PC first. The picture is 640×360, scaled by an integer so 1280×720 is ×2 and 1920×1080 is ×3. Keyboard and mouse are primary. A gamepad works if one is connected. The touch overlay is drawn only on a touch device, and it hides once a key or a gamepad is used. A phone held upright shows "Turn your phone sideways" and pauses.

| Action | Keyboard | Mouse | Gamepad | Touch |
| --- | --- | --- | --- | --- |
| Move | WASD / arrows | — | Left stick / D-pad | Left stick |
| Talk / confirm | E, Enter, Space | Click | A | Talk / tap |
| Back | Esc, Backspace | Right-click | B | Back |
| Dash | Shift or K | — | X | Dash |
| Grapple | G, hold and release | Hold right-click | RB | Hook |
| Menu | Esc or Tab | Menu icon | Start | Menu |
| Mute | M | Speaker icon | — | Speaker |

Tested at 1280×720, 1920×1080, and a phone-sized landscape viewport. Upright phones get the rotate prompt.

- The page is `position: fixed`, `touch-action: none`, and it cancels touchmove so the browser does not scroll, pull-to-refresh, or bounce.
- The viewport meta locks scale and requests the safe area. The stick, buttons, and panels pad with `env(safe-area-inset-*)`.
- The stick's grab area is the whole lower-left. The knob travels inside a fixed base. Analog tilt scales speed.
- Dash and Talk are separate pointers on a touch device, so a thumb can hold the stick and tap Dash. There is no Fight button. In battle, the commands sit in the landscape frame: foes and the party on the left, the log and the commands on the right.
- Canvas backing-store pixel ratio is capped at 2. Glows are pre-drawn images, not per-frame blurs. The context is not desynchronized. Resize ignores one-pixel jitter so the bitmap is not cleared in a loop. Islands, their shadows, the bridge, and the ground specks are painted once into a world sheet and the camera copies the visible slice, including a margin for shake. The sheet is rebuilt when the lamp is lit or the walk map changes, so a later island is included. Clouds are painted once into a softer sheet, then the view drifts across it. Sky and vignette gradients are cached. At 412×915 CSS pixels with a device pixel ratio of 3.5, play holds a frame.
- Reduce flashing sits on the title screen, in the pause menu, and in Settings. All three are the same switch (`shardfall.reduceFlash`). It is on by default. It turns off shake, the hurt vignette, hit sparks, the invulnerability fade, and the pulsing ready-light, and a line of dialogue arrives whole. The objective marker stays, held still.
- Switching apps or unfocusing the tab pauses and saves, so a pocket does not eat the run.

Keyboard and mouse are the desk controls. The on-screen buttons stay hidden there.

## v0.1 content lock

In the build, and not negotiable without a doc edit:

- Emberhold, the span, Cinderstep, the rope bridge, Vane's Perch, Whisper Hollow.
- Wisp, Brumekin, Choirling.
- Maren, Kestrel, the Cantor, three inscriptions.
- The lamp quest, five shards, Shardstep, the Cinderveil hook.
- Levels 1–4, two blossoms, one save slot, title / continue / new game / reset, Reduce flashing, the v0.1.1 note.
- No second island, no grapple, no inventory screen, no faction meters.

That lock is the v0.1 build. v0.2 adds Cinderveil, the grapple, the hand menu, and the Cinder Maw. Faction meters are still later.

## Roadmap

These are intentions, not promises. Each one should stay fun in a short sitting and still be a phone game.

### v0.2 — Act 1: The Cinder Road

Act 1. Sail the Quickmercy between Emberhold and Cinderveil, with a short voyage you can skip. Lowmoor Quay, the Ashfields, the Ember Vault. The hand hooks: hold, aim, release. Small Hushborn are pulled in. Big ones pull you. Spare shards buy five hand changes. The quest is Tamsin's three cogs, Ilsa's trial, the Cinder Maw, the vault lamp, and the Cantor's choice. Dialogue prose is data (`startDialogue(id)`); the ids and events are in `docs/v0.2-spec.md`.

### v0.3 — The Wider Hush

This build. Fights are turn-based. Act 1 is the Wayfarer alone: a turn-order strip, skills, items, gear, marks, and levels to 30, about level 8 at the Cinder Maw. Kestrel and Tamsin join after the act ends. The Maw is a phased battle against its core. The sail chart, Saltmere and the Holdfast, Gullrock, the Drift Market, and Lowgate under a shut gate are in the world. Chests, shops, and inns are on the islands. Spoken Act 2 is still a document, not dialogue in the game. A Driftborn convoy is later.

### v0.4 — The polite dark

The Hollow Choir's island. The Cantor is a host. You can interrupt a rite, walk away, or hear it out. No one is eaten on screen; the horror stays in the manners and in what the rite would do to the crack. Choirlings arrive in groups. A new Hushborn sings a slow pulse you have to dash through. The sky-crack is brighter from this island than from Emberhold.

### v0.5 — Archipelago

Several lamps, and an overworld that is still a cloud sea rather than a menu of names. Each lamp you relight changes the color of the Hush nearby. One large island carries a Hushborn the size of a chapel, built from the same rules as a brumekin and a Choirling, not a new game. More than one save slot. The hand-shard finally answers, a little, about what it wants. That answer should be playable, not a paragraph.

## Open questions

These are for Brian. v0.1 picked an answer so the build could exist. None of them are load-bearing if he wants the other one.

1. **The Wayfarer's name.** Silent, and unnamed, for now. A name you type once on the title would be easy. A fixed name he likes would also be easy.
2. **Cinderveil.** The name stayed. Act 1 lands there.
3. **How hard the Hush bites.** Death and a missed dash currently give you back, minus a little heart. A harsher version could keep a shard, or fray the lamp, or cost time. The gentle version is what is built.
4. **The Cantor.** Rival, tragic ally, or a third route you can actually walk in v0.4. v0.1 only promises that they are polite and that they are not done.
5. **Art.** v0.3 draws the sprites in code (palette grids, no downloaded images). A later pass can redraw individual characters without changing `Art.sprite`.
6. **The hand.** Dash, then the grapple, then five shard purchases. That is the v0.2 answer.
7. **How much they talk.** Act 1 is a full script now, still one or two sentences a box. If a scene runs long on the phone, cut a line before adding one.
8. **Sound.** On after the first tap, with separate music and effects sliders, and easy to mute. Haptics start on, for a hit, a shard, and the lamp. It can still default to muted if the phone speaker is the wrong call.

## Tinkering

Code map, if a section above needs a change:

| | |
| --- | --- |
| `js/data.js` | Emberhold shape, spawns, hand upgrades |
| `js/content/dialogue/` | Act 1's lines, and Act 2 placeholders |
| `js/content/maps/` | Sail chart and island packs |
| `js/world.js` | Chart, chests, shops, inns, field fights |
| `js/dialogue.js` | The conversation panel, portraits, choices, flags |
| `js/cinder.js` | Cinderveil, travel, the hand menu, quest markers |
| `js/grapple.js` | The hook, the Maw, ash foes |
| `js/sim.js` | Movement, quest, the dash gap. Contact calls `Battle.start` |
| `js/battle/` | Events, timeline, formula, resolver, foe AI, rewards, and the battle screen |
| `js/data/party.js`, `enemies.js`, `skills.js`, `items.js`, `encounters.js` | Party, foes, skills, items, encounter ids |
| `js/menu/field.js` | Field menu: party, skills, items, equip |
| `js/art/core.js` | Palette, `Art.sprite`, portraits, integer blit |
| `js/art/actors.js` | People, foes, battle poses |
| `js/art/world.js` | Tiles, props, the Hush clouds |
| `js/art/scenes.js` | Battle backgrounds, `Art.window` |
| `js/art/gallery.js` | `?gallery` review page |
| `js/draw.js` | How the drift looks |
| `js/ui.js`, `css/style.css` | Buttons, panels, safe areas |
| `js/save.js` | The v2 save, and v1 reads |
| `js/input.js` | Stick, buttons, keys, the no-scroll guards |
| `js/audio.js` | Shared context, unlock, mute, volumes, visibility |
| `js/music.js` | `Music.play` loops and crossfades |
| `js/sfx.js` | `Sfx.play` |
| `js/haptics.js` | Short `navigator.vibrate` patterns |
| `js/title.js` | Title cloud sea |
| `js/feel.js` | Which theme, footsteps, foe-death cue |
| `.github/workflows/pages.yml` | The Pages deploy |

`SF.audit()` returns a list of layout problems (a pickup off the grass, a dash from the lip that misses, a ledge you cannot walk). `SF.auditCinder()` checks the quay, the two hooked gaps, and that the vault brute cannot see the dock. The smoke script runs both, then the Act 1 chain.
