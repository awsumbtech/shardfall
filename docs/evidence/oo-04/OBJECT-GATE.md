# OO-04 object gate

Step OO-04 / 2c, v0.4.37. `BattleBackdrop` owns one four-layer real-art backdrop per battle area. Features frozen except OO conversion. emberhold_meadow and emberhold_scar are marked ready as data entries; the other six areas stay on today's `Art.battleBg` path.

## BattleBackdrop

1. **Owner object.** The battle screen. `Game.init` (`js/core/game.js:41-43`) builds the one instance as `game.battleBackdrop`, throws `Error("BattleBackdrop missing")` if the constructor did not load, and calls `loadReady()` so ready areas prefetch their plates. It does not attach the instance. There is no `SF.battleBackdrop`; readers go through `SF.game.battleBackdrop`.

2. **One job and lifecycle.** Draw one real four-layer image backdrop per battle area from the catalog, or keep today's existing backdrop path until that area is marked ready.
   - The catalog is `SF.BattleBackdropData`, filled by `js/data/battle-backdrops.js` and published through the counted assign `SF.BattleBackdropData = SF.BattleBackdropData || {}` in `js/main.js:25`. It maps each area id to four 480×270 layer paths (sky, far, mid, floor), kit directory `shardfall/battle/backdrops/<id>/v1/`, in-game directory `assets/battle/backdrops/<id>/v1/`, plate horizon Y 124, parallax / z per layer, a `ready` flag, and `defaultId` (`emberhold_meadow` in `js/data/battle-backdrops.js:67`). `BattleBackdrop.adopt()` (`js/battle/battle-backdrop.js:32`) is the only reader. An unknown id falls back to that `defaultId` (`resolveId`, `:80-81`).
   - `draw(ctx, areaId, w, h, t)` (`js/battle/battle-backdrop.js:264`) blits the four loaded layers when the area is ready. It cover-fits at a uniform integer scale (`fit()`, `:98`) so plate Y 124 lands on the canvas horizon (`canvasHorizon()`, `:91`, the same seam as `js/art/scenes.js:74-76` and `js/battle/stage.js:208-211`). Designed for the 844×390 landscape target; other aspect ratios use the same cover rule. No uneven stretch, no tints, no gradients, no code-drawn stand-in.
   - Until the area is ready, `draw` calls the existing `BattleGfx.paintBg` fallback (today's `Art.battleBg` path). A ready area with a missing catalog entry, layer path, or layer image throws. A ready-but-not-yet-loaded frame uses the fallback for that frame only.
   - Lifecycle: created in `Game.init`, attached once by the battle screen, lives as long as the Game root. It is never destroyed. A second attach is ignored.

3. **File and attach point.** `js/battle/battle-backdrop.js`. The only attach point is `attach(game)` (`:146`), called once from `SF.drawBattle` (`js/battle/draw.js:17`). The constructor is a counted one-line `SF.BattleBackdrop = function BattleBackdrop` assign in `js/main.js:19`, like `SF.Game`, `SF.VisualObject`, and `SF.SceneRouter`. The object file attaches methods and statics through `window.SF.BattleBackdrop`, throws if it is missing, and has zero `SF.*` sites. Helpers are on the class (`IDS`, `LAYERS`, `MANIFEST`, `fit`, `canvasHorizon`); there are no free functions. `index.html` loads the catalog with the other `js/data` scripts, then this file after `js/core/scene-router.js` and before `SF.boot()`. `sw.js` precaches the object file and, on install, `importScripts("js/data/battle-backdrops.js")` (`sw.js:151`) to append `SF.BattleBackdropData.precache`. A new area is a data-file row plus art; it does not need a `sw.js` edit. `.github/workflows/pages.yml:49-50` copies only `assets/battle/` (and `assets/ui/`) into `_site`, not the rest of `assets/`.

4. **What it does not change.** The other six areas stay on today's `Art.battleBg` path. S14 (`BattleGfx.paintBg`) is not deleted (step 25). Parallax hints are stored only; this object does not apply a drift (that is step 25, `BackdropDrift`). Battle actors, HUD, floor placement, and gameplay are unchanged. Version is v0.4.37.

## Manifest and delivery (for Game Art & Motion)

Each area is four 480×270 PNGs, nearest-neighbour. Sky is opaque; far, mid, and floor have alpha. Horizon seam at plate Y 124. Add a new area by appending an id and a ready flag in `js/data/battle-backdrops.js` and placing the four plates under `assets/battle/backdrops/<id>/v1/`.

| Area id | Kit directory | In-game files | Ready |
|---|---|---|---|
| emberhold_meadow | `shardfall/battle/backdrops/emberhold_meadow/v1/` | `assets/battle/backdrops/emberhold_meadow/v1/{sky,far,mid,floor}.png` | yes (batch 1) |
| emberhold_scar | `shardfall/battle/backdrops/emberhold_scar/v1/` | `assets/battle/backdrops/emberhold_scar/v1/{sky,far,mid,floor}.png` | yes (batch 1) |
| cinderveil_ash | `shardfall/battle/backdrops/cinderveil_ash/v1/` | `assets/battle/backdrops/cinderveil_ash/v1/{sky,far,mid,floor}.png` | no |
| ember_vault | `shardfall/battle/backdrops/ember_vault/v1/` | `assets/battle/backdrops/ember_vault/v1/{sky,far,mid,floor}.png` | no |
| saltmere_shore | `shardfall/battle/backdrops/saltmere_shore/v1/` | `assets/battle/backdrops/saltmere_shore/v1/{sky,far,mid,floor}.png` | no |
| saltmere_wreck | `shardfall/battle/backdrops/saltmere_wreck/v1/` | `assets/battle/backdrops/saltmere_wreck/v1/{sky,far,mid,floor}.png` | no |
| highspire_road | `shardfall/battle/backdrops/highspire_road/v1/` | `assets/battle/backdrops/highspire_road/v1/{sky,far,mid,floor}.png` | no |
| hush_deck | `shardfall/battle/backdrops/hush_deck/v1/` | `assets/battle/backdrops/hush_deck/v1/{sky,far,mid,floor}.png` | no |

Batch 1 (16 November 2026, America/New_York): emberhold_meadow and emberhold_scar. Provenance and sha256s: `ART-PROVENANCE.md`. Inventory: `assets/ASSETS.md`.

## Battle area → backdrop id

Encounter `bg` in `js/data/encounters.js`, zone `bg` in `js/content/maps/v2layout.js`, and spawn overrides. An unknown id resolves to the catalog `defaultId` (`emberhold_meadow`), matching today's `Art.battleBg`. Start uses `opts.bg || enc.bg || "emberhold_meadow"` (`js/battle/battle.js:374`).

| Backdrop id | Where it is used |
|---|---|
| emberhold_meadow | Encounters `em_wisp1`, `em_wisps`, `em_choirling`. Emberhold zones wake, wake-path, grove, meadow, hill, lip, dock, rope, hookledge, west. Spawns wisp-meadow, wisp-grove, wisp-dock, choir-cinder. Default if a fight has no bg. |
| emberhold_scar | Encounters `em_brumekin`, `em_brume_wisp`. Zones scar, cinder, ledge. Spawns brume-scar, brume-span. |
| cinderveil_ash | Encounters `cv_ash1`, `cv_ashlings`, `cv_cinderhound`, `cv_mixed`. Zones ash, ash-link, nook, nw, cliff. Spawns ashmite-west, ashmite-north, soot-east, brute-cog. |
| ember_vault | Encounters `cv_hounds`, `boss_cinder_maw`. Zone vault. Spawn brute-yard, maw. Cinder Maw start in `js/cinder.js:654`. |
| saltmere_shore | Encounters `sm_saltwisps`, `sm_gulls`, `sm_mixed`, `boss_tidewyrm` (encounter default). Zones sm-shore, sm-shore-link. Most Saltmere and Gullrock shore spawns. |
| saltmere_wreck | Encounters `sm_drowned`. Zones sm-deck, sm-hold, sm-islet. Spawns sm-drowned and the Tidewyrm spawn (`bg: "saltmere_wreck"` overrides the encounter default). |
| highspire_road | Encounters `hs_choir_patrol`, `hs_sentinel`. Zones hs-road-1..4. All Highspire spawns. |
| hush_deck | Encounter `sea_hush_raiders`. Sea fight in `js/world.js:320`. |

## Tests

- `tools/battle-backdrop-check.mjs` (run by `tools/smoke.mjs`) boots the real page and checks load, catalog paths, kit directories, parallax hints, cover-fit on 844×390 (scale 2, plate Y 124 on the horizon) plus 640×360 / 390×844 / 375×667, encounter → id picks, fallback on unready areas, and throws for a ready area with a missing catalog entry or missing layer images. It then boots a fresh page from a temp copy of the site whose only changes are a patched data file with a ninth ready row (`oo04_fixture`) and copies of the meadow plates under that id, and asserts that a fight with that `bg` blits those plates. No test-side `adopt` or `setLayers`, and no edits to the object or `sw.js`.
- `runOo04Checks` in `tools/smoke.mjs` covers the static rules: no `SF.*` sites or free helpers in the object file, no code-drawn primitives, constructor shell and `SF.BattleBackdropData` in `js/main.js`, single attach in `js/battle/draw.js`, script order, catalog-driven precache (no PNG literals in `sw.js`), fit, fallback, throws, and that a new Game builds an unattached instance.
- `tools/check-site.mjs` requires every catalog precache path in `_site`, allows `assets/battle/` next to `assets/ui/` and `assets/atlas/`, and still blocks Kenmi and every other `assets/` path. `.github/workflows/pages.yml` copies only `assets/ui/` and `assets/battle/`.
