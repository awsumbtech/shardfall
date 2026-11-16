# OO-07 Object gate

Same owner as OO-04 through OO-06. The game change is data plus art only. `sw.js` only had the cache name bumped to `shardfall-v0.4.40` as part of the version bump. The object file was not edited.

- Owner: `BattleBackdrop` in `js/battle/battle-backdrop.js`
- Job: draw a battle backdrop from catalog data (`SF.BattleBackdropData` published by `js/data/battle-backdrops.js`)
- This step: mark `highspire_road` and `hush_deck` ready in that data file, add their eight art plates, and point `saltmere_wreck` at plate version v2 via a catalog `versions` map (`versions.saltmere_wreck = "v2"`). Per-area `dir` / `kit` / `version` come from that map, falling back to the default `"v1"`. Precache is still `data.precache`, built only from each ready area's active layer paths, so v1 wreck files stay in the repo for provenance but are not precached.
- Version bump of art is data-only in the game: the object already reads `row.dir` / layer paths, and `sw.js` already concatenates `data.precache`. No object or precache-path edit was required.
- Tools edits (minimal, two reasons):
  1. Every catalog area is now ready, so the flip-unready future-pair child has nothing to flip. Unready loops already no-op on an empty list (no special all-ready branch). The ninth-entry fresh-boot stays the proof that a new area is a data row plus art. The previous "future-pair proof skipped" log was removed so that case is not a disabled check.
  2. Smoke and `battle-backdrop-check` were hard-coding `/v1/` in path and kit assertions. That is a test-harness gap, not a game gap: a catalog version bump would have failed the tools (or, for "file exists", would have checked the retired v1 files). They now read `dir` / `kit` / `version` from the catalog. Donor plate copies use the donor's active version.
- Proof: the catalog-built precache has 32 active plates (8 areas × 4 layers, wreck at v2, no `sw.js` path edit). In-game shots of `hs_choir_patrol` (Highspire field start), `sea_hush_raiders` (voyage `maybeSeaFight` at `js/world.js:320`), `sm_drowned`, and the Tidewyrm field start show the painted plates, with wreck/Tidewyrm on v2.
