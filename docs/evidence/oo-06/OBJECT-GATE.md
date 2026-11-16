# OO-06 Object gate

Same owner as OO-04 and OO-05. No object, service-worker logic, or tools change.

- Owner: `BattleBackdrop` in `js/battle/battle-backdrop.js`
- Job: draw a battle backdrop from catalog data (`SF.BattleBackdropData` published by `js/data/battle-backdrops.js`)
- This step: mark `saltmere_shore` and `saltmere_wreck` ready in that data file, and add their eight art plates. The object, `sw.js` precache path, and `tools/` were not edited. `sw.js` only had the cache name bumped to `shardfall-v0.4.39` as part of the version bump.
- Proof: a new ready area appears in the catalog-built precache (24 plates, no `sw.js` path edit) and in-game shots of `sm_saltwisps`, `sm_drowned`, and the Tidewyrm field start (spawn `bg` override to `saltmere_wreck`) show the painted plates.
