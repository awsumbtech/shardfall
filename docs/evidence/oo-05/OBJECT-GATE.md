# OO-05 Object gate

Same owner as OO-04. No object or service-worker logic change.

- Owner: `BattleBackdrop` in `js/battle/battle-backdrop.js`
- Job: draw a battle backdrop from catalog data (`SF.BattleBackdropData` published by `js/data/battle-backdrops.js`)
- This step: mark `cinderveil_ash` and `ember_vault` ready in that data file, and add their eight art plates. The object and `sw.js` precache path were not edited. `sw.js` only had the cache name bumped to `shardfall-v0.4.38` as part of the version bump.
- Proof: a new ready area appears in the catalog-built precache (16 plates, no `sw.js` path edit) and in-game shots of `cv_ash1` / `cv_hounds` show the painted plates.

The smoke and battle-backdrop-check harnesses now read ready and unready ids, the unready probe, and the expected version from `SF.BattleBackdropData` and from `SF.VERSION` / the `sw.js` cache name. A committed future-pair proof flips one remaining unready id to ready in a temp site (art copied, data row only, no tools edit) and the checks must pass.
