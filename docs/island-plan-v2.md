# Island layouts v2 (built from the gameplay doc)

**For Brian to approve.** No repo changes. Maps: `emberhold-map-v2.png`, `cinderveil-map-v2.png`.
Built from `gameplay-act1.md`. The gameplay came first; the maps are sized to fit it.

---

## Scale (same on both islands)
- **Screen:** 640×360, landscape. **16 px tiles → 40×22 tiles on screen.** The white box on each map is one screen.
- **Hero:** 24×38 px = 1.5×2.4 tiles, ~10% of screen height.
- **House:** 3–4 hero heights. **Tree:** ~2. **Great Lamp:** 4–5.
- **Fights:** random, nothing on the map. ~35 steps (tiles) per fight on average.

## How the size was picked
- Target fights × 35 steps = walking the route needs.
- **Emberhold:** ~12 fights → ~420 steps. Route on the map ≈ 435 steps. ✔
- **Cinderveil:** ~16 fights → ~560 steps. Route on the map ≈ 580 steps (two trips to the Ashfields). ✔
- Safe areas (towns, Maren, Perch) add space but no fights.

## Map key
- **Colour = fight rate.** Blue = SAFE. Yellow → red = more fights. Dark red = boss.
- **Hatched** = becomes safe or opens later (lamp lit / Maw beaten).
- **Diamond with ?** = hidden shard. **Pink** = needed for the lamp. **Cyan** = spare.
- **Dashed lines** = gates. White = Dash. Cyan = Shardstep. Orange = Grapple. Grey = rubble (story).
- **Yellow numbers** = route order.

---

## Emberhold — 150×104 tiles (≈ 3.8 × 4.7 screens)

| Region | Rate | Fights | Size (tiles) | What's there |
|---|---|---|---|---|
| Waking Stones | SAFE until Maren | 0 | 18×18 | Start. Dash tutorial. |
| Maren's cottage | SAFE | 0 | 26×18 | Maren, heal, save. **Lamp in view (lamp reveal).** |
| The Meadow (hub) | 1 / 40 | ~3 | 44×40 | All trails meet. Shard (main). |
| Maren's Grove | 1 / 35 | ~2 | 28×42 | Shard (main). Trail to the West Ledge. |
| West Ledge | 1 / 35 | ~1 | 23×4 | Narrow cliff path. |
| Whisper Hollow | SAFE | 0 | 18×18 | Optional. The Cantor. |
| The Scar | 1 / 25 | ~2 | 32×32 | Carrier fight (main shard). Shardstep ledge (spare). |
| Dock trail + rope bridge | 1 / 45 | ~1 | 18×23 | Down to the Perch. |
| Vane's Perch | SAFE | 0 | 34×15 | Kestrel, skiff. |
| Lamp Hill | 1 / 40 → SAFE when lit | ~1 | 34×34 | Great Lamp. Span starts here. Hook ledge below (spare). |
| Cinderstep | 1 / 30 | ~2 + fixed | 24×26 | Choirling fight (main shard). Alcove behind stones (main shard, needs Kestrel's tip). |

**Gates**
- **Dash, 3-tile gap:** Broken Span → Cinderstep. Main path.
- **Shardstep, 5-tile gap:** Scar → small ledge. Spare shard. Open right after the lamp.
- **Grapple:** Lamp Hill → ledge under the span. Spare shard. Come back after Cinderveil.

**Route**
1. Wake at the Waking Stones.
2. Maren. She points at the lamp; your shard reacts. Shards now exist. Hand 0/5.
3. Meadow shard. 4. Grove shard. 5. Scar carrier fight.
6. Kestrel at the Perch (span + alcove tip). *(opt: Cantor in Whisper Hollow)*
7. Lamp Hill → dash the span. 8. Cinderstep: choirling + alcove. Hand 5/5.
9. Light the lamp → Shardstep. Fights drop to 1/3. 10. Kestrel → sail.

**Changes from v1:** island is wider than tall (landscape). Maren's cottage moved under Lamp Hill so the lamp fits on one screen with her. Field enemies gone; regions colored by fight rate instead. Shardstep and hook spots added for revisits.

---

## Cinderveil — 156×108 tiles (≈ 3.9 × 4.9 screens)

| Region | Rate | Fights | Size (tiles) | What's there |
|---|---|---|---|---|
| Lowmoor Quay (town) | SAFE | 0 | 66×20 + pier | Kestrel, Tamsin's workshop (main shard), shop, inn, Hesk. One screen covers most of town. |
| The Ashfields | 1 / 30 | ~6–7 | 56×52 | 3 cogs far apart (hidden until Tamsin). Hound carrier (main shard). |
| Cold Nook | 1 / 30 | ~1 | 16×16 | Secret shard (spare). Glints once the cog quest starts. |
| Hook ledge (NW) | 1 / 30 | 0 | 12×12 | Spare shard. Grapple. |
| Ilsa's Cliff | 1 / 35 | ~2 | 34×28 | Ilsa. Reached on foot from the Ashfields. |
| Vault Ledge | SAFE | 0 | 28×8 | Checkpoint (respawn if the Maw wins). |
| Ember Vault | 1 / 25 | ~3 | 40×20 | Vault carrier (main shard, **new**). |
| Maw chamber | BOSS | 1 | ~1 screen | The Cinder Maw (the only enemy you see on the map). |
| The Ridge | SAFE, opens after Maw | 0 | 48×24 | Cinderveil lamp (costs 3), the Cantor. Path down to the Ashfields. |

**Gates**
- **Hook 1 (Burned Bridge, 8 tiles):** Ilsa's Cliff → Vault Ledge. Needs Ilsa's OK.
- **Hook 2 (8 tiles):** Vault Ledge → Vault.
- **Hook (spare):** Ashfields → NW ledge.
- **Rubble (story):** Vault ↔ Ridge, and Ridge → Ashfields. Both open when the Maw dies.

**Route**
1. Kestrel at the pier. 2. Tamsin: cog quest. 3. Hesk: Vault rumor.
4. Ashfields: 3 cogs + carrier shard. 5. Back to Tamsin: grapple.
6. Ilsa's trial. 7. Hook 1 → Vault Ledge. 8. Hook 2 → Vault fights + carrier.
9. Cinder Maw. 10. Ridge: lamp (3 shards) + Cantor. 11. Path down → Kestrel epilogue.

**Backtracking:** Quay ↔ Ashfields twice. That walk is ~25 tiles, so it doesn't drag.

---

## Shards at a glance

| Island | Needed for the lamp | Spare |
|---|---|---|
| Emberhold | Meadow, Grove, Scar carrier, Cinderstep choirling, Alcove = **5** | Shardstep ledge, under-span hook ledge |
| Cinderveil | Workshop, Ashfields carrier, Vault carrier = **3** | Cold Nook, NW hook ledge |

All hidden until the lamp reveal. Then: hand pulses within 10 tiles, shard glints within 6. Never on the minimap.

## Open for later (not blocking)
- Exact tile art per region comes after Brian approves these shapes.
- Rates and sizes get tuned in playtest with the step counter.
