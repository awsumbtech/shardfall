# Shardfall `assets/` inventory

This folder holds image files loaded by the game. Atlas tilesets stay in `assets/atlas/` (gitignored vendor art) and are not listed here.

## UI — ChoiceBox (test art, not approved to ship)

| File | Size | Role |
| --- | --- | --- |
| `assets/ui/choicebox-panel.png` | 48×48, 9-slice insets 16 | Choice panel frame |
| `assets/ui/choice-cursor.png` | 24×24 | Selection cursor |

Provenance: Game Art & Motion, awsumbtech/game-art PR #7 @ `04e5165` (`art/shardfall-choicebox-ui-v0.1.0`, path `shardfall/ui/choicebox/v0.1.0/`). Version 0.1.0. No PixelLab spend. Test art for draft PR awsumbtech/shardfall#53. Not approved to ship.

SHA-256 and CSS notes are in `assets/ui/CHOICEBOX-ASSETS.md`.

## Battle backdrops — Emberhold meadow and scar (v1, batch 1)

Four 480×270 plates per area (sky opaque RGB; far, mid, and floor RGBA with alpha). Horizon at plate Y 124. Wired as `emberhold_meadow` and `emberhold_scar` in `js/data/battle-backdrops.js`.

| File | Size | Role |
| --- | --- | --- |
| `assets/battle/backdrops/emberhold_meadow/v1/sky.png` | 480×270, opaque | Meadow sky |
| `assets/battle/backdrops/emberhold_meadow/v1/far.png` | 480×270, alpha | Meadow far |
| `assets/battle/backdrops/emberhold_meadow/v1/mid.png` | 480×270, alpha | Meadow mid |
| `assets/battle/backdrops/emberhold_meadow/v1/floor.png` | 480×270, alpha | Meadow floor |
| `assets/battle/backdrops/emberhold_scar/v1/sky.png` | 480×270, opaque | Scar sky |
| `assets/battle/backdrops/emberhold_scar/v1/far.png` | 480×270, alpha | Scar far |
| `assets/battle/backdrops/emberhold_scar/v1/mid.png` | 480×270, alpha | Scar mid |
| `assets/battle/backdrops/emberhold_scar/v1/floor.png` | 480×270, alpha | Scar floor |

Provenance, sha256, and kit paths: `docs/evidence/oo-04/ART-PROVENANCE.md`. GAM batch 1, 16 November 2026, America/New_York. Batch 1 of 8 catalog areas. See also the Cinderveil ash and Ember Vault plates below.

## Battle backdrops — Cinderveil ash and Ember Vault (v1, batch 2)

Four 480×270 plates per area (sky opaque RGB; far, mid, and floor RGBA with alpha). Horizon at plate Y 124. Wired as `cinderveil_ash` and `ember_vault` in `js/data/battle-backdrops.js`.

| File | Size | Role |
| --- | --- | --- |
| `assets/battle/backdrops/cinderveil_ash/v1/sky.png` | 480×270, opaque | Ash fields sky |
| `assets/battle/backdrops/cinderveil_ash/v1/far.png` | 480×270, alpha | Ash fields far |
| `assets/battle/backdrops/cinderveil_ash/v1/mid.png` | 480×270, alpha | Ash fields mid |
| `assets/battle/backdrops/cinderveil_ash/v1/floor.png` | 480×270, alpha | Ash fields floor |
| `assets/battle/backdrops/ember_vault/v1/sky.png` | 480×270, opaque | Ember Vault sky |
| `assets/battle/backdrops/ember_vault/v1/far.png` | 480×270, alpha | Ember Vault far |
| `assets/battle/backdrops/ember_vault/v1/mid.png` | 480×270, alpha | Ember Vault mid |
| `assets/battle/backdrops/ember_vault/v1/floor.png` | 480×270, alpha | Ember Vault floor |

Provenance, sha256, and kit paths: `docs/evidence/oo-05/ART-PROVENANCE.md`. GAM batch 2, 16 November 2026, America/New_York. Batch 2 of 8 catalog areas. See also the Saltmere shore and wreck plates below.

## Battle backdrops — Saltmere shore and wreck (v1, batch 3)

Four 480×270 plates per area (sky opaque RGB; far, mid, and floor RGBA with alpha). Horizon at plate Y 124. Wired as `saltmere_shore` and `saltmere_wreck` in `js/data/battle-backdrops.js`.

| File | Size | Role |
| --- | --- | --- |
| `assets/battle/backdrops/saltmere_shore/v1/sky.png` | 480×270, opaque | Saltmere shore sky |
| `assets/battle/backdrops/saltmere_shore/v1/far.png` | 480×270, alpha | Saltmere shore far |
| `assets/battle/backdrops/saltmere_shore/v1/mid.png` | 480×270, alpha | Saltmere shore mid |
| `assets/battle/backdrops/saltmere_shore/v1/floor.png` | 480×270, alpha | Saltmere shore floor |
| `assets/battle/backdrops/saltmere_wreck/v1/sky.png` | 480×270, opaque | Saltmere wreck sky |
| `assets/battle/backdrops/saltmere_wreck/v1/far.png` | 480×270, alpha | Saltmere wreck far |
| `assets/battle/backdrops/saltmere_wreck/v1/mid.png` | 480×270, alpha | Saltmere wreck mid |
| `assets/battle/backdrops/saltmere_wreck/v1/floor.png` | 480×270, alpha | Saltmere wreck floor |

Provenance, sha256, and kit paths: `docs/evidence/oo-06/ART-PROVENANCE.md`. GAM batch 3, 16 November 2026, America/New_York. See also the Highspire road, Hush deck, and Saltmere wreck v2 plates below.

## Battle backdrops — Highspire road and Hush deck (v1, batch 4)

Four 480×270 plates per area (sky opaque RGB; far, mid, and floor RGBA with alpha). Horizon at plate Y 124. Wired as `highspire_road` and `hush_deck` in `js/data/battle-backdrops.js`. All 8 catalog areas now have painted plates.

| File | Size | Role |
| --- | --- | --- |
| `assets/battle/backdrops/highspire_road/v1/sky.png` | 480×270, opaque | Highspire road sky |
| `assets/battle/backdrops/highspire_road/v1/far.png` | 480×270, alpha | Highspire road far |
| `assets/battle/backdrops/highspire_road/v1/mid.png` | 480×270, alpha | Highspire road mid |
| `assets/battle/backdrops/highspire_road/v1/floor.png` | 480×270, alpha | Highspire road floor |
| `assets/battle/backdrops/hush_deck/v1/sky.png` | 480×270, opaque | Hush deck sky |
| `assets/battle/backdrops/hush_deck/v1/far.png` | 480×270, alpha | Hush deck far |
| `assets/battle/backdrops/hush_deck/v1/mid.png` | 480×270, alpha | Hush deck mid |
| `assets/battle/backdrops/hush_deck/v1/floor.png` | 480×270, alpha | Hush deck floor |

Provenance, sha256, and kit paths: `docs/evidence/oo-07/ART-PROVENANCE.md`. GAM batch 4, 16 November 2026, America/New_York.

## Battle backdrops — Saltmere wreck v2 (mid only)

The catalog points `saltmere_wreck` at v2 (`versions.saltmere_wreck = "v2"` in `js/data/battle-backdrops.js`). Only `mid.png` is new. Sky, far, and floor are byte-identical copies of v1. The v1 directory is kept in the repo (referenced in earlier provenance); `data.precache` lists only the active v2 paths.

| File | Size | Role |
| --- | --- | --- |
| `assets/battle/backdrops/saltmere_wreck/v2/sky.png` | 480×270, opaque | Wreck sky (copy of v1) |
| `assets/battle/backdrops/saltmere_wreck/v2/far.png` | 480×270, alpha | Wreck far (copy of v1) |
| `assets/battle/backdrops/saltmere_wreck/v2/mid.png` | 480×270, alpha | Wreck mid (new; clearer hull) |
| `assets/battle/backdrops/saltmere_wreck/v2/floor.png` | 480×270, alpha | Wreck floor (copy of v1) |

Provenance and sha256: `docs/evidence/oo-07/ART-PROVENANCE.md`. GAM wreck-v2, 16 November 2026, America/New_York.
