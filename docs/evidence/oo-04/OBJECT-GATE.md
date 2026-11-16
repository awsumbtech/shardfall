# OO-04 object gate

Step OO-04 / 2c. Pure infrastructure: the running game still draws today's code-drawn battle backdrops until an area is marked ready. Features frozen. No new visuals, no tints, no fades, no version bump (stays v0.4.36 until art lands).

## BattleBackdrop

1. **Owner object.** The battle screen. `Game.init` (`js/core/game.js:39-42`) builds the one instance as `game.battleBackdrop` and throws `Error("BattleBackdrop missing")` if the constructor did not load. It does not attach it. There is no `SF.battleBackdrop`; readers go through `SF.game.battleBackdrop`.

2. **One job and lifecycle.** Draw one real four-layer image backdrop per battle area from a manifest, or keep today's existing backdrop path until that area is marked ready.
   - The manifest maps each of the 8 area ids to four 480×270 layer paths (sky, far, mid, floor), the kit directory `shardfall/battle/backdrops/<id>/v1/`, the in-game directory `assets/battle/backdrops/<id>/v1/`, plate horizon Y 124, and optional parallax hints 0 / 0.15 / 0.4 / 1.0. No area is marked `ready` in this branch.
   - `draw(ctx, areaId, w, h, t)` (`js/battle/battle-backdrop.js:229`) blits the four loaded layers when the area is ready. It cover-fits at a uniform integer scale (`fit()`, `:104`) so plate Y 124 lands on the canvas horizon (`canvasHorizon()`, `:97`, the same seam as `js/art/scenes.js:74-76` and `js/battle/stage.js:208-211`). Designed for the 844×390 landscape target; other aspect ratios use the same cover rule. No uneven stretch, no tints, no gradients, no code-drawn stand-in.
   - Until the area is ready, `draw` calls the existing `BattleGfx.paintBg` fallback (today's `Art.battleBg` path). A ready area with a missing manifest entry, layer path, or layer image throws.
   - Lifecycle: created in `Game.init`, attached once by the battle screen, lives as long as the Game root. It is never destroyed. A second attach is ignored.

3. **File and attach point.** `js/battle/battle-backdrop.js`. The only attach point is `attach(game)` (`:150`), called once from `SF.drawBattle` (`js/battle/draw.js:17`). The constructor is a counted one-line `SF.BattleBackdrop = function BattleBackdrop` assign in `js/main.js:19`, like `SF.Game`, `SF.VisualObject`, and `SF.SceneRouter`. The object file attaches methods and statics through `window.SF.BattleBackdrop`, throws if it is missing, and has zero `SF.*` sites. Helpers are on the class (`IDS`, `LAYERS`, `MANIFEST`, `fit`, `canvasHorizon`); there are no free functions. `index.html` loads it after `js/core/scene-router.js` and before `SF.boot()`; `sw.js` precaches it.

4. **What it does not change.** No visuals on this branch: every area stays on today's `Art.battleBg` path (and the S14 gradient fallback in `BattleGfx.paintBg` is not deleted). Old art is not removed. No new code-drawn fallback is added. Parallax hints are stored only; this object does not apply a drift (that is step 25, `BackdropDrift`). Battle actors, HUD, floor placement, and gameplay are unchanged. Version stays v0.4.36.

## Manifest and delivery (for Game Art & Motion)

Each area is four 480×270 PNGs, nearest-neighbour. Sky is opaque; far, mid, and floor have alpha. Horizon seam at plate Y 124.

| Area id | Kit directory | In-game files |
|---|---|---|
| emberhold_meadow | `shardfall/battle/backdrops/emberhold_meadow/v1/` | `assets/battle/backdrops/emberhold_meadow/v1/{sky,far,mid,floor}.png` |
| emberhold_scar | `shardfall/battle/backdrops/emberhold_scar/v1/` | `assets/battle/backdrops/emberhold_scar/v1/{sky,far,mid,floor}.png` |
| cinderveil_ash | `shardfall/battle/backdrops/cinderveil_ash/v1/` | `assets/battle/backdrops/cinderveil_ash/v1/{sky,far,mid,floor}.png` |
| ember_vault | `shardfall/battle/backdrops/ember_vault/v1/` | `assets/battle/backdrops/ember_vault/v1/{sky,far,mid,floor}.png` |
| saltmere_shore | `shardfall/battle/backdrops/saltmere_shore/v1/` | `assets/battle/backdrops/saltmere_shore/v1/{sky,far,mid,floor}.png` |
| saltmere_wreck | `shardfall/battle/backdrops/saltmere_wreck/v1/` | `assets/battle/backdrops/saltmere_wreck/v1/{sky,far,mid,floor}.png` |
| highspire_road | `shardfall/battle/backdrops/highspire_road/v1/` | `assets/battle/backdrops/highspire_road/v1/{sky,far,mid,floor}.png` |
| hush_deck | `shardfall/battle/backdrops/hush_deck/v1/` | `assets/battle/backdrops/hush_deck/v1/{sky,far,mid,floor}.png` |

First batch: emberhold_meadow, emberhold_scar. When a batch is wired, set that row's `ready` flag and load the four layer images; the object cover-fits them. This PR does not open until that first batch is in.

## Battle area → backdrop id

Encounter `bg` in `js/data/encounters.js`, zone `bg` in `js/content/maps/v2layout.js`, and spawn overrides. An unknown id resolves to `emberhold_meadow`, matching today's `Art.battleBg`. Start uses `opts.bg || enc.bg || "emberhold_meadow"` (`js/battle/battle.js:374`).

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

- `tools/battle-backdrop-check.mjs` (run by `tools/smoke.mjs`) boots the real page and checks load, 8×4 paths, kit directories, parallax hints, cover-fit on 844×390 (scale 2, plate Y 124 on the horizon) plus 640×360 / 390×844 / 375×667, encounter → id picks, fallback on unready areas, and throws for a ready area with a missing manifest entry or missing layer images.
- `runOo04Checks` in `tools/smoke.mjs` covers the static rules: no `SF.*` sites or free helpers in the object file, no code-drawn primitives, constructor shell in `js/main.js`, single attach in `js/battle/draw.js`, script order, and precache. It also unit-tests fit, fallback, throws, and that a new Game builds an unattached instance.

## Not in this branch

Art files, a version bump, a PR, and `BackdropDrift`. The PR opens once GAM's first passed backdrop batch is wired in.

## Batch 1 wired (v0.4.37)

On 16 November 2026, America/New_York, GAM delivered emberhold_meadow and emberhold_scar. Those two manifest rows are now `ready: true` (data only). The other six areas stay on today's `Art.battleBg` path. Version is v0.4.37. Shots and provenance are in this folder.

## Catalog is data, not object source (Brian's bar)

The per-area catalog moved out of `js/battle/battle-backdrop.js` into `js/data/battle-backdrops.js`, the same classic-script pattern as `js/data/encounters.js` and the other `js/data/*` files. Runtime JSON loading would be awkward for the vm harnesses and for `IDS` / `entry` / `resolveId`, which are synchronous.

`BattleBackdrop.adopt()` is the only reader. The object file has no area id list, ready flags, layer paths, parallax, z, or horizon literals. An unknown id falls back to `defaultId` from that data file (`emberhold_meadow` today).

`sw.js` precaches ready layer art by `importScripts("js/data/battle-backdrops.js")` and appending `data.precache`. A new backdrop is art files plus a data-file entry. It does not need a `sw.js` edit. The data file itself is listed once in `SHELL` and `index.html`, like the other `js/data` scripts.
