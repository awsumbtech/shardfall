# Shardfall: Act 1 Gameplay Design

**For Brian to approve.** Gameplay first; the maps get built to fit this afterwards.

- The approved script (`docs/script/act1.md`) is canon. Nothing here adds or changes spoken lines.
- Anything that would need new lines is marked **script change needed**.

**Brian's decisions (Oct 20) — all 5 questions resolved, see section 7:**
- Shards appear when **Maren shows you the lamp and your shard reacts** (stage-direction script change, pending approval).
- **No fight cap.** Grinding just stops paying off (XP drops fast past each zone's level). See 3b.
- **Shards charge your hand; the lamp takes the charge.** Emberhold 5, Cinderveil 3. See 4b.
- Lit lamp cuts that island's fights to ~1/3. Confirmed.
- Phone held upright shows "turn sideways". Confirmed.

---

## 1. Platform

**PC first, phone second.** It's played in landscape on both.

### Screen and scale
- **Game picture is 640 × 360 pixels** (16:9) and gets scaled up in whole steps:
  - ×2 = 1280×720
  - ×3 = 1920×1080
  - ×4 = 2560×1440
  - ×6 = 4K
- **Wider screens** (ultrawide, phones) show a bit more to the sides. The height always stays 360.
- **Your S25 in landscape** is 1440 px tall, which is exactly ×4. That gives sharp pixels.
- **Phone held upright:** shows "Turn your phone sideways" and pauses. There's no portrait mode. *(Confirmed.)*
- **Tile:** 16 px. The screen shows **40 × 22 tiles** (wider on wide screens).
- **Hero:** 24×38 px, about **10% of screen height**. That's the same as a SNES Final Fantasy hero.
- **Buildings:** 3–4 hero heights. **Trees:** about 2. **Great Lamp:** 4–5.
- The camera follows the hero and stops at the island edge.

### Controls

| Action | Keyboard | Mouse | Gamepad (nice-to-have) | Touch (only shown on touch devices) |
|---|---|---|---|---|
| Move | WASD / arrows | — | Left stick / D-pad | Left stick |
| Talk / inspect / confirm | E, Enter, Space | Click | A | Talk button / tap |
| Back / cancel | Esc, Backspace | Right-click | B | Back button |
| Dash | Shift or K | — | X | Dash button |
| Grapple (after Tamsin) | G (hold to aim, release) | Hold right-click to aim | RB | Hook button |
| Menu | Esc or Tab | Menu icon | Start | Menu button |
| Battle commands | Arrows + Enter, or 1–5 | Click | D-pad + A | Tap |
| Skip text faster | Enter / Space | Click | A | Tap |
| Mute | M | Speaker icon | — | Speaker icon |

- **Removed: the Fight button.** With no enemies on the map, there's nothing to start a fight with.
- **Touch overlay** shows only on a touch device. It hides when a key or gamepad is used.

---

## 2. Core loop

Like a classic SNES Final Fantasy:

**explore → random fights → level up and buy gear → story beat → new tool → new area (or a shortcut back)**

- Every story beat either gives a tool or opens a place.
- Every tool opens a gap or route you saw earlier but couldn't use.
- Inns and Maren heal you and save the game.

---

## 3. Random encounters

**No enemies on the field.** Fights start at random as you walk. Bosses and story fights are the only planned ones.

### How it works
- **Step** = 1 tile (16 px) walked. A dash counts its distance as steps.
- Each region has an **average steps per fight**.
- **Grace period:** after a fight, a load, or entering a region, the first **10 steps** never trigger a fight.
- After that, each step rolls `1 / average`. **Standing still never triggers a fight.**
- **Battle background** comes from the region (meadow, scar, ash, vault).
- **Safe zones** never roll (marked SAFE below).

### Lamp rule (lore: "A lit lamp is the only thing they won't cross") — confirmed
- **Before Maren's first talk:** no fights anywhere except the Scar. You're still waking up.
- **Lamp lit on an island:** that island's fight rate drops to about 1/3 (avg steps ×3). Lamp Hill becomes SAFE. The Scar stays normal, since that's where they climb up.

### Zones and formations

**Emberhold**

| Region | Avg steps | Formations (weight) |
|---|---|---|
| The Meadow | 40 | 1 wisp* (40), 2 wisps (50), brumekin (10) |
| Maren's Grove | 35 | 2 wisps (60), 1 wisp* (30), brumekin (10) |
| The Scar | 25 | brumekin (50), 2 wisps (30), brumekin + wisp* (20) |
| Dock trail | 45 | 1 wisp* (60), 2 wisps (40) |
| Lamp Hill (before lit) | 40 | 2 wisps (70), brumekin (30) |
| Broken Span lip / Cinderstep | 30 | brumekin (40), 2 wisps (30), choirling (30) |
| West Ledge | 35 | 2 wisps (100) |

**Cinderveil**

| Region | Avg steps | Formations (weight) |
|---|---|---|
| The Ashfields | 30 | 2 ashlings (45), 1 ashling* (20), ash + hound (25), cinderhound (10) |
| Cold Nook | 30 | 2 ashlings (50), ash + hound (50) |
| Ilsa's Cliff trail | 35 | ash + hound (50), cinderhound (50) |
| Vault (outside the Maw's chamber) | 25 | cinderhound (40), ash + hound (40), 2 hounds* (20) |

*\* = new formation. It reuses existing foes, so it's a data change only.*

### Fixed fights (planned, not random)
- **Cinderstep landing:** first arrival triggers a choirling fight. It carries a shard.
- **The Cinder Maw:**
  1. Inspect the Maw (`cinderveil.maw.prefight`).
  2. That fires `boss_start`, which starts the boss fight.
  3. You can't flee.
  4. If you lose, you go back to the Vault Ledge checkpoint at half HP (as now).
  - The Maw is the one enemy **you can see on the map**, as a set piece.
- **Sea crossing:** a deck fight on every 3rd crossing (as now).

### Fleeing
- Flee works in random fights. Chance is 45% ± speed difference, between 25% and 90% (as now).
- A Smoke Bomb always works.
- No fleeing from bosses or fixed fights.

### Setting
**Encounters: Fewer (×0.5) / Normal / More (×1.5).** It goes in Settings.

### Code that has to change (today the Hushborn walk around on the map)
**Remove:**
- Field enemy spawns, field AI chasing, touching a foe to start a fight, the field strike, the Fight button
- Field enemy save/respawn (`enemySave`, `respawnFieldEnemies`), and "field enemies come back" in the inn text
- Field kill drops (`killEnemy` → `drops`)

**Add:**
- Region zone table
- Step counter in the field update
- `Battle.start(formation, { bg })` on a hit
- Safe-zone and lamp checks
- Grace steps
- The setting

**Move:** shard drops into battle rewards (see section 4).

**Keep:** the Maw as a field set piece, and the sea fights.

---

## 3b. Levels and XP (no fight cap) — resolved

**Fights never run out.** Grinding is allowed; it just stops being worth it.

### The rule
- Every zone has a **zone level** (table below).
- **gap = your level − zone level.** Each party member uses their own level.
- XP from a random fight = **base XP × gap factor**:

| gap | factor |
|---|---|
| 2+ below zone | ×1.25 (catch-up) |
| 1 below, or equal | ×1 |
| +1 | ×0.5 |
| +2 | ×0.25 |
| +3 | ×0.1 |
| +4 or more | 1 XP flat |

```
f = gap <= -2 ? 1.25 : gap <= 0 ? 1 : [0.5, 0.25, 0.1][gap - 1]
xp = gap >= 4 ? 1 : Math.max(1, Math.round(base * f))
```

- **Bosses and fixed fights:** full XP, no factor.
- **Marks (money):** not scaled. Shops are small, so farming money doesn't break anything.

### Level curve
Keep today's curve (`js/data/party.js`). XP to reach each level (total):

| Lv | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|
| XP | 23 | 52 | 88 | 132 | 185 | 248 | 322 | 409 | 509 |

### Base XP (about half of today's)

| Formation | XP | Formation | XP |
|---|---|---|---|
| 1 wisp | 6 | 1 ashling | 9 |
| 2 wisps | 11 | 2 ashlings | 14 |
| brumekin | 16 | ash + hound | 18 |
| brumekin + wisp | 20 | cinderhound | 21 |
| choirling (fixed) | 20 | 2 hounds | 28 |
| sea raiders | 30 | **Cinder Maw** | 90 |

### Zone levels and targets

| Island | Zone → level | You should be |
|---|---|---|
| Emberhold | Meadow 3, Grove 3, Dock trail 3, West Ledge 4, Lamp Hill 4, Scar 5, Cinderstep 5 | **Lv 5** when you light the lamp |
| Sea | deck fight 6 | — |
| Cinderveil | Ashfields 7, Cold Nook 7, Ilsa's Cliff 8, Vault 8 | **Lv 8–9** at the Maw, ~Lv 9–10 after it (tune in playtest) |

### What grinding gets you (example: Scar, zone 5, brumekin 16 XP)
- Lv 6: 8 XP a fight → ~8 fights to Lv 7.
- Lv 7: 4 XP → ~19 fights to Lv 8.
- Lv 8: 2 XP → ~45 fights to Lv 9.
- Lv 9+: 1 XP → pointless.
- So a player who grinds ends up 1–2 levels ahead at most. That's a fair reward, not a break.

---

## 4. Progression: tools and shards

### Tools and abilities in Act 1 order

| # | Tool / ability | How you get it (script) | What it opens |
|---|---|---|---|
| 1 | **Dash** | Right after `emberhold.wake` ("a prompt teaches Dash") | Short gaps. The **Broken Span** (Maren: "run and jump"; Kestrel: "dash right at the edge"). |
| 2 | **Shard sense** | Maren points at the lamp; your shard flares and the lamp answers (`emberhold.maren.intro`, **script change**: stage direction, see `script-change-lamp-reveal.md`) | Shards show up in the world, and fights can drop them. |
| 3 | **The alcove tip** | Kestrel: "check behind the standing stones" | The hidden shard behind the Cinderstep stones |
| 4 | **Shardstep** (longer dash) | Lighting Emberhold's lamp (cutscene) | Wider gaps, including revisit spots on Emberhold. Kestrel's offer leads to the **sail**. |
| 5 | **The Quickmercy** (sailing) | `emberhold.kestrel.offer_sail` → `open_sail_menu` | Cinderveil |
| 6 | **Cog sight** | Tamsin's `quest_cogs_start` | The 3 cogs show up in the Ashfields. Same rule as shards: hidden until you know what to look for. |
| 7 | **Grapple** | Tamsin's `grant_grapple` (3 cogs) | Hook points; Ilsa's trial |
| 8 | **Vault access** | Ilsa's `vault_open` | The two hook gaps leading to the Vault door |
| 9 | **Ridge path** | Maw defeated ("the path up to the ridge opens") | Cinderveil's lamp, the Cantor scene, and a shortcut back down to the quay |

The **Hand upgrades** stay as they are. They're bought with **spare** shards (see 4b).

### Shards: hidden until you know
- **Before the lamp reveal** (Maren pointing at the lamp), shards don't exist on screen: no glint, nothing on the minimap, can't be picked up. No carrier fights either.
- **After it,** the shard in your hand senses nearby shards:
  - **Within 10 tiles:** the hand pulses (HUD icon plus a soft chime).
  - **Within 6 tiles:** the shard glints on the ground and can be picked up.
  - **The minimap never shows shards.** Today it does, so that changes.
- **Secret shards** (the alcove, the Cold Nook) don't glint until their hint fires (Kestrel's tip; for the Nook, Tamsin's cog quest has started).
- **Shards from fights:** some formations carry one ("Some Hushborn carry them too").
  - The carrier shows a bright core in battle.
  - Beating it adds **"Sky-shard"** to the victory rewards.
  - It only drops **the first time you win in that region**, so you can't farm it.

### Shard sources

| Island | Source | Needs |
|---|---|---|
| Emberhold | Meadow (ground) | Maren's talk |
| Emberhold | Grove (ground) | Maren's talk |
| Emberhold | Scar brumekin (first win) | Maren's talk |
| Emberhold | Cinderstep choirling (fixed fight) | Dash |
| Emberhold | Alcove behind the stones (secret) | Dash + Kestrel's tip |
| **Emberhold total: 5, which lights the lamp** | | |
| Emberhold, revisit | Ledge beyond a wide gap (spare) | Shardstep |
| Emberhold, revisit | Under the Broken Span on a hook point (spare) | Grapple (after Cinderveil) |
| Cinderveil | Tamsin's workshop (ground) | Arrival |
| Cinderveil | Ashfields cinderhound (first win) | — |
| Cinderveil | Vault cinderhound (first win) **new** | Vault access |
| **Cinderveil total on the main path: 3, which lights its lamp** | | |
| Cinderveil, spare | Cold Nook (secret) | Cog quest started |
| Cinderveil, spare | Ashfields ledge on a hook point | Grapple |

- **Going back is optional.** The rewards are spare shards for Hand upgrades and the fights along the way.
- The sail chart already opens both islands once the skiff is ready.

---

## 4b. Hand charge and lamps — resolved

**Shards you carry charge your hand. Lighting a lamp spends the charge.**

- **HUD meter:** `Hand ✦✦✦◇◇ 3/5` — pips toward the current island's unlit lamp.
  - Pips fill as you pick up shards. Full meter = the hand glows and the lamp quest marker appears.
  - After that island's lamp is lit, the meter shows **`✦ 2 spare`** instead.
- **Lamp costs:**
  - **Emberhold: 5** (script: "It needs five sky-shards").
  - **Cinderveil: 3** (matches today's code). No script change: "You press your hand to the cold lamp" already works.
- **Not enough charge:** the lamp won't take it. Toast: "The lamp needs 5. You have 3." (exists today).
- **Spare shards buy Hand upgrades** (costs 2–3, unchanged: Long Step, Quick Hook, Bright Edge, Deep Heart, Singe Line).
  - **Rule:** the upgrade menu can't spend shards you need for the next unlit lamp. Those show as "Saved for the lamp."
- **Spares in Act 1:** 4 (Emberhold Shardstep ledge, under the Broken Span, Cold Nook, Ashfields hook ledge). Enough for 2 upgrades.
- **Balance knobs:** lamp cost, number of main-path sources, upgrade cost. Change one at a time.

---

## 5. Story beats → gameplay

| # | Beat (script id) | Where | Player does | Opens / gates |
|---|---|---|---|---|
| 1 | Wake (`emberhold.wake`) | Waking Stones | Learns to move and dash | No fights except the Scar |
| 2 | Maren's intro (`emberhold.maren.intro*`) | Maren's cottage (lamp in view) | Talks; watches the shard react to the lamp; picks a reply | **Shard sense**, quest "Five Shards", Hand meter 0/5, fights everywhere, Maren heals |
| 3 | Hunt | Meadow, Grove, Scar | Explores and fights | 3 shards. ~8 fights. |
| 4 | Kestrel, before the lamp (`emberhold.kestrel.span`) | Vane's Perch | Talks | Span marked on the map; **alcove tip** |
| 5 | Optional: the Cantor (`emberhold.cantor.intro`) | Whisper Hollow | Talks | `met_cantor` (an extra reply later) |
| 6 | Cross the span | Broken Span → Cinderstep | Dashes, fixed choirling fight, alcove | Shards 4–5 |
| 7 | Lamp lit (cutscene) | Lamp Hill | Hand meter full; places the 5 shards | **Shardstep**. Emberhold fights drop to 1/3. |
| 8 | Maren after the light (`emberhold.maren.lamp_lit`) | Lamp Hill | Talks | Quest moves to Kestrel |
| 9 | Kestrel's offer (`emberhold.kestrel.offer_sail`) | Vane's Perch | Picks a reply | **Sail** |
| 10 | The crossing (`cinderveil.sail.*`) | At sea | Watches; maybe a deck fight | Arrives at Cinderveil |
| 11 | Arrival (`cinderveil.kestrel.arrive`) | Lowmoor Quay | Talks | Tamsin's bench marked |
| 12 | Tamsin (`cinderveil.tamsin.cogs_start`) | Workshop | Talks | **Cog sight**; Cold Nook shard can now glint |
| 13 | Hesk (`cinderveil.hesk.rumor`) | Crates by the water | Talks, picks a mood | Vault marked; extra Ilsa replies |
| 14 | Cogs | Ashfields | Explores and fights | 3 cogs. ~6–8 fights. |
| 15 | Grapple gift (`cinderveil.tamsin.grapple_gift`) | Workshop | Talks | **Grapple** |
| 16 | Ilsa's trial (`cinderveil.ilsa.trial`) | Ilsa's Cliff (on foot) | Talks | **Vault access** |
| 17 | Hook gaps | Burned Bridge → Vault Ledge → Vault door | Grapples twice, fights in the Vault | Checkpoint on the Vault Ledge; Vault carrier shard (3/3) |
| 18 | The Cinder Maw (`cinderveil.maw.*`) | Ember Vault | Boss fight | **Ridge path** |
| 19 | Lamp relit (`cinderveil.lamp.relit`) | Ridge | Presses hand to the lamp (spends 3) | Cinderveil fights drop to 1/3 |
| 20 | The Cantor (`cinderveil.cantor.*`) | Ridge | Picks Spare / Listen / Refuse | `act1_end` |
| 21 | Epilogue (`cinderveil.kestrel.epilogue_*`) | Lowmoor Quay, via the ridge path down | Talks | Party joins; on to Act 2 |

Gameplay-only events (no lines): the Cinderstep choirling fight, the Vault carrier, revisit shards, and lamp-lit fight rates.

**Script change needed (1):** the lamp-reveal stage direction in Maren's intro. Exact text: `script-change-lamp-reveal.md`.

---

## 6. What the maps need (this drives the next layout)

**Sizing rule:** plan for **~35 steps (tiles) walked per fight** and **~45–60 s per fight**.

- **Emberhold:** ~12 fights, **20–25 min**.
- **Cinderveil:** ~16 fights, **30–40 min**.
- A region's size comes from how much walking it needs to give its fights, counting the trip back.

### Emberhold

| Region | Safe? | Fights on a normal run | Walking needed | Rough size | Gates / notes |
|---|---|---|---|---|---|
| Waking Stones area | SAFE until Maren | 0 | short | ~16×16 | Start |
| Maren's cottage + garden | SAFE | 0 | — | ~24×20 | Heal, inn, save |
| The Meadow (hub) | zone | 3 | ~120 tiles | ~40×36 | All trails meet here |
| Maren's Grove | zone | 2 | ~70 | ~24×36 | Shard. Leads to the ledge. |
| West Ledge → Whisper Hollow | ledge zone, Hollow SAFE | 1 | ~40 | ledge 4 tiles wide; hollow ~16×16 | Optional; the Cantor |
| The Scar | zone (high rate) | 2 | ~50 | ~30×30 | Shard carrier. Revisit ledge (Shardstep). |
| Dock trail | zone | 1 | ~45 | ~20×20 | Rope bridge |
| Vane's Perch | SAFE | 0 | — | ~28×16 | Kestrel, skiff |
| Lamp Hill | zone, SAFE once lit | 1 | ~40 | ~30×28 | Lamp at the top. The span starts here. |
| Broken Span → Cinderstep | zone + fixed fight | 2 | ~60 | span gap **3 tiles** (dash); islet ~22×22 | Alcove behind the stones. Grapple shard under the span (revisit). |

**Gates:** dash (span), Shardstep (one wider ledge for revisiting), grapple (one hook point for revisiting). No locked doors.

### Cinderveil

| Region | Safe? | Fights on a normal run | Walking needed | Rough size | Gates / notes |
|---|---|---|---|---|---|
| Lowmoor Quay | SAFE (town) | 0 | — | ~60×24 | Pier, shop, inn, Tamsin, Hesk |
| The Ashfields | zone | 6–7 | ~210 | ~50×48 | 3 cog carts spread far apart. Hook ledge (revisit). |
| Cold Nook | zone | 1 | ~30 | ~14×14 | Secret shard |
| Ilsa's Cliff trail | zone | 2 | ~70 | ~30×26 | Reachable on foot |
| Burned Bridge + Vault Ledge | Ledge SAFE (checkpoint) | 0 | — | 2 hook gaps (wider than Shardstep); ledge ~28×8 | Ilsa must OK it |
| Ember Vault (outside the chamber) | zone (high rate) | 3 | ~75 | ~40×20 | — |
| Maw chamber | boss | 1 boss | — | ~1 screen | Maw set piece |
| Ridge + path down | SAFE (story, lamp) | 0 | — | ridge ~40×24, path down to the Ashfields | Opens after the Maw; shortcut home |

**Backtracking:** Quay ↔ Ashfields twice (cogs, then grapple), and the ridge path for the trip home. Keep the Quay–Ashfields walk under ~60 tiles so it doesn't drag.

---

## 7. Questions for Brian — all resolved (Oct 20)

1. **When shards appear** → When Maren shows you the lamp and your shard reacts. Stage-direction script change proposed (`script-change-lamp-reveal.md`).
2. **How many fights** → ~12 / ~16 on a normal run is fine, but **no cap**. Grinding fades out through XP (section 3b).
3. **Cinderveil's lamp** → Keep a shard cost. Shards charge the hand; lamps spend it. Emberhold 5, Cinderveil 3 (section 4b).
4. **Lamp rule** → Yes, ~1/3 fights after lighting.
5. **Phone upright** → Yes, "turn sideways" prompt.

---

### Other notes
- **Inn text** loses "field enemies come back." That's UI text, not script.
- **design.md** needs updates: no field enemies, PC-first, Ilsa on foot, shards hidden until the lamp reveal, Maren required, no "skip Maren" path.
- **Map layouts** built from this doc: `island-plan-v2.md`.
