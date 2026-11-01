# PR 5 — Emberhold props → Kenmi (preview mapping)

Box-only. Kenmi source root: `/workspace/kenmi/shardfall-assets/vendor/kenmi/Cute_Fantasy/` (private).
Regions are `[x, y, w, h]` in the sheet; anchor `[ax, ay]` is the foot pixel inside that rect and lands on `prop.x, prop.y`.
Every sprite is drawn at **scale 1** (1 world px = 1 Kenmi px), the same as the Kenmi tiles and the Kenmi hero.
Positions, `block` radii, collision tiles and `nudgeProps` are unchanged. Only the draw changes.
Variant choice reuses `Art.fieldProp`'s hash, so every instance keeps its current variant slot and the same tufts stay thinned out.
`flip` means a hash-based horizontal mirror for variety.

## Props (204 instances on Emberhold, tiles mode)

| Kind (count) | Art id (instances) | Kenmi sheet | Region | Anchor | Notes |
|---|---|---|---|---|---|
| tree (42) | tree_oak (4), tree_broad (5) | Trees/Big_Oak_Tree.png | [64,0,64,80] | [32,63] | baked soft shadow, flip, canopy fade kept |
| | tree_oak_b (5), tree_broad_b (3) | Trees/Medium_Oak_Tree.png | [32,0,32,48] | [16,31] | |
| | tree_pine (6) | Trees/Big_Spruce_tree.png | [64,0,64,80] | [32,63] | |
| | tree_pine_b (3) | Trees/Medium_Spruce_Tree.png | [32,0,32,48] | [16,31] | |
| | tree_birch (7) | Trees/Big_Fruit_Tree.png (fruitless frame) | [32,0,32,64] | [15,47] | Kenmi birch is autumn yellow, so a green tree stands in. See trade-offs |
| | tree_birch_b (7) | Trees/Medium_Fruit_Tree.png | [32,0,32,64] | [15,47] | |
| | tree_apple (2) | Crops/Apple_Tree.png | [0,0,32,64] | [15,47] | red apples |
| bush (43) | bush (24) | Outdoor decoration/Outdoor_Decor.png | [80,80,16,16] | [8,14] | round |
| | bush_b (19) | Outdoor_Decor.png | [80,144,16,16] | [8,14] | leafy |
| rock (11) | rock (7) | Outdoor_Decor.png | [96,96,16,16] | [8,13] | |
| | rock_b (4) | Outdoor_Decor.png | [48,96,16,16] | [8,13] | rock in grass |
| stump (4) | stump | Outdoor_Decor.png | [16,96,16,16] | [8,13] | |
| log (4) | log | Outdoor_Decor.png | [64,112,32,16] | [16,13] | |
| tuft (54) | tuft (7), tuft_b (7), tuft_bloom (1); 39 not drawn (same thinning as today) | Outdoor_Decor.png | [32,32,16,16] / [0,32,16,16] / [96,32,16,16] | [8,13] | |
| flower (32) | flower (11) pink | Outdoor_Decor.png | [48,16,16,16] | [8,12] | the colour picks the id, same rule as today |
| | flower_gold (13) | Outdoor_Decor.png | [48,32,16,16] | [8,12] | |
| | blossom (8) | Outdoor_Decor.png | [48,0,16,16] | [8,12] | |
| | flower_tide (0 here) | Outdoor_Decor.png | [0,0,16,16] | [8,12] | |
| fence_up (8) | fence strip | Outdoor decoration/Fences.png | rail column x 0..16 (cap 0..12, rail 16..48 repeat, foot 48..62) | per-instance span | each instance draws its own 26.7px span, so y-sorting stays per post |
| cottage (1) | cottage | Buildings/Buildings/Houses/Wood/House_1_Wood_Base_Red.png | [0,0,96,128] | [48,112] | chimney smoke becomes Buildings/House_Decor/Chimney_smoke_Anim.png (5×32px frames) at (+20,−92) |
| stake (2) | lamp_cold | Outdoor decoration/Lanter_Posts.png | [0,144,16,48] | [8,46] | the glass is recoloured cool grey once at load (Kenmi only ships lit posts) |
| | lamp_lit | Lanter_Posts.png | [0,144,16,48] ×6 frames, dx 16 | [8,46] | flicker at 6 fps; frame 0 when reduceMotion |
| airship (1) | skiff | **GAP: keeps code art** | — | — | Boat.png [0,0,48,48] tested: a 40px rowboat, no mast or sail, water baked in. See gaps |
| stones (2) | stones | **GAP: keeps code art** | — | — | waking stones (848,992), wrong-sky (2240,144) |

## Extras

| Extra | Kenmi | Region | Anchor | Notes |
|---|---|---|---|---|
| chest ×3 (orchard, meadow, perch) | Buildings/House_Decor/Chest_Anim.png | closed [0,0,16,16]; opening frames 0–3; open [48,0,16,16] | [8,13] | replaces the lid-squash animation with Kenmi frames 0→3 |
| inn / ember-hearth (1216,320) | **GAP: keeps code art** | — | — | Kenmi has no hearth or brazier |

## Gaps (code art kept, or an art-bot request)
1. **Skiff / airship**: keep code art. Art-bot request: a Kenmi-style sky-skiff about 64×48 with mast, sail and hull, matching Boat.png's palette.
2. **Waking stones / wrong-sky stones**: keep code art. Art-bot request: 3-stone standing set, 16×32 per stone, Kenmi rock palette (Outdoor_Decor big rock [64,176,32,32] as the style reference).
3. **Ember-hearth (inn)**: keep code art. Art-bot request: small hearth or brazier, 16×32, lit and unlit.
4. **Great Lamp (1616,192)** and **hook posts** (1856,448), (2016,560): not SF.PROPS. They stay code art in this PR. A Lanter_Posts big variant could stand in later.
5. **TEXTS marks** (wake-stone, scar-stone, hull, wrong-sky, heartblossom, rope-bridge, span-planks, sail-patch) and **signs**: unchanged.
6. **Rope bridge / dock decks**: already ground tiles (kenmi.tile.bridge). Not touched.
7. **NPCs** (Maren, Kestrel, Cantor): PR 6.
