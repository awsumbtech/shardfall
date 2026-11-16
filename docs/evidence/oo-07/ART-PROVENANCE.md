# OO-07 batch 4 art provenance (and Saltmere wreck v2)

Wired 16 November 2026, America/New_York (pair 4 delivery: highspire_road and hush_deck, plus a Saltmere wreck mid-plate revision).

## Source

- Box path: `/workspace/shardfall-art/battle-backdrops-v1/`
- Kit files: `shardfall/battle/backdrops/<id>/<version>/{sky,far,mid,floor}.png`
- Pack manifest: `/workspace/shardfall-art/battle-backdrops-v1/manifest.json`
- Per-id manifests with sha256: `shardfall/battle/backdrops/<id>/<version>/manifest.json`
- Provenance log: `PROVENANCE.json`, notes: `SOURCE.md`
- Status: draft-v1 / draft-v2, art made 2026-11-16. The pack itself was not committed or pushed (no art-repo commit sha).
- Repo researched when the plates were made: `awsumbtech/shardfall@b771565`
- Generator: GenerateImage (Grok Bot built-in), then mechanical cleanup (unfake downscale, chroma-key, palette lock, horizon shift). PixelLab not used. No Kenmi pixels or screenshots.
- Batch 4 used 13 GenerateImage calls (gens 43-55): 8 shipped layers, 3 rejected (road mid, deck floor, and an optional calmer road-sky reroll that did not ship), 2 style-lock composites. Config `tools/build-config-b4.json`.
- Batches 1–3 files already on main were checked byte-identical to GAM's copies (sha256 unchanged).

## In-game copies (batch 4)

Copied to `assets/battle/backdrops/<id>/v1/`. Each sha256 matched both the pack `PROVENANCE.json` and the per-id GAM manifest. Every plate is 480×270. Sky is opaque RGB (PNG color type 2). Far, mid, and floor are RGBA (color type 6) and use transparency.

| File | sha256 |
|---|---|
| highspire_road/v1/sky.png | 0c4df875495c9d13c186ab1b83c011302cf680a6e830a08045bf2b6733aca5f3 |
| highspire_road/v1/far.png | b10b8961531752b1e8194d33977c5b60a43e2500d7ad2c52656a57f0c3447d61 |
| highspire_road/v1/mid.png | 3119ebbcfa4a5e27ad2b91936bdaabeef840772d31f06015d8d12c977e2f2d41 |
| highspire_road/v1/floor.png | eb418b6782efcf7c475223d4e543ffb8a55fd03e5d78174f8d873c2bce97732b |
| hush_deck/v1/sky.png | 249e525575ba8a915a63b607c16580c5a12dedb9fa29a096f973b8f5f9f765b8 |
| hush_deck/v1/far.png | 2a6ca151230f028756f6fd3fda5e7a72467b0be7ecfbbe38b1d5ba2e2d4d0399 |
| hush_deck/v1/mid.png | 4795be82cf2eda69d57d9def940498c1d265bda57151a840cf7e601191f545b7 |
| hush_deck/v1/floor.png | e68471a96f568a42ebd4e855cac231c45e49e92cb97d34a9c9c8422c4e2b62d1 |

## Saltmere wreck v2

GAM delivered `shardfall/battle/backdrops/saltmere_wreck/v2/`. Only `mid.png` is new (gen 56). Sky, far, and floor are byte-identical copies of v1 (`copy_of: ../v1/...` in the v2 manifest; sha256 unchanged). v1 stays in the repo because earlier provenance and the composition notes reference it. The catalog points this area at v2 with `versions.saltmere_wreck = "v2"` in `js/data/battle-backdrops.js`. `data.precache` is built from each ready area's active `row.layers[].path`, so it lists only the four v2 paths for this area, not the retired v1 copies.

GAM's note: the new mid plate was composited from two of their own generations. The painted content is the v1 mid.png (gen 39) with its old hull above the ridge removed (`x>=212`, `y<121` cleared; `x<212` and rows `y>=121` kept), then gen 56 laid over it at `x>=150` only. That keeps `x<150` identical to v1 and keeps the v1 ridge across the full width at y121–126. A reroll (gen 57) was rejected (ribs too small and too far right, mostly under the menu); the first try ships, repositioned. Build: `tools/build-wreck-v2.py` + `tools/build-config-wreck-v2.json`.

| File | sha256 | Notes |
|---|---|---|
| saltmere_wreck/v2/sky.png | 56c59cf84ec70be4e775a3edff55d3e553b43c1c8ab1d1be214441f1cd8b5436 | copy of v1 |
| saltmere_wreck/v2/far.png | e75e4d7860536d66f39a4f8b8e44369cc2e416e1ccbbceda4ee3bfb547bcd968 | copy of v1 |
| saltmere_wreck/v2/mid.png | 99ef90f042d6f4ec670018035cde96f555f7a09b3467d8362f59b1d4813c4542 | new (gen 56 composited over gen 39) |
| saltmere_wreck/v2/floor.png | df1fb1b4f97c2a15007b6ffbe22878f43b04732af7d1ff7a6a339e15b244190a | copy of v1 |
