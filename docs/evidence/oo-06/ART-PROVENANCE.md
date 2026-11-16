# OO-06 batch 3 art provenance

Wired 16 November 2026, America/New_York (pair 3 delivery: saltmere_shore and saltmere_wreck).

## Source

- Box path: `/workspace/shardfall-art/battle-backdrops-v1/`
- Kit files: `shardfall/battle/backdrops/<id>/v1/{sky,far,mid,floor}.png`
- Pack manifest: `/workspace/shardfall-art/battle-backdrops-v1/manifest.json`
- Per-id manifests with sha256: `shardfall/battle/backdrops/<id>/v1/manifest.json`
- Provenance log: `PROVENANCE.json`, notes: `SOURCE.md`
- Status: draft-v1, art made 2026-11-16. The pack itself was not committed or pushed (no art-repo commit sha).
- Repo researched when the plates were made: `awsumbtech/shardfall@b771565`
- Generator: GenerateImage (Grok Bot built-in), then mechanical cleanup (unfake downscale, chroma-key, palette lock, horizon shift). PixelLab not used. No Kenmi pixels or screenshots.
- Batch 3 used 12 GenerateImage calls (gens 31-42): 8 shipped layers, 2 rejected (shore sky, wreck floor), 2 style-lock composites. Config `tools/build-config-b3.json`.
- Batch 1 and batch 2 files already on main were checked byte-identical to GAM's copies (sha256 unchanged).

## In-game copies

Copied to `assets/battle/backdrops/<id>/v1/`. Each sha256 matched both the pack `PROVENANCE.json` and the per-id GAM manifest. Every plate is 480×270. Sky is opaque RGB (PNG color type 2). Far, mid, and floor are RGBA (color type 6) and use transparency.

| File | sha256 |
|---|---|
| saltmere_shore/v1/sky.png | a98cf909a539f08caca760e7271ef46c95ebccbfe74246cca5ea5bdbaa4c1a7f |
| saltmere_shore/v1/far.png | e47108283ef68a9d8c7d67d3653a1c91209db2874ed15179492986e5dbe97ca8 |
| saltmere_shore/v1/mid.png | b8b609f78eebc906eb2f2745fd6de984fee53b4468f96c9be741640038cb57e4 |
| saltmere_shore/v1/floor.png | 511cac7c852838f4278467db17bc12b57f508150222ee91c95e1d7bd1b7344bc |
| saltmere_wreck/v1/sky.png | 56c59cf84ec70be4e775a3edff55d3e553b43c1c8ab1d1be214441f1cd8b5436 |
| saltmere_wreck/v1/far.png | e75e4d7860536d66f39a4f8b8e44369cc2e416e1ccbbceda4ee3bfb547bcd968 |
| saltmere_wreck/v1/mid.png | 5d74b672a65b56118ed916076922d4edd0213748e7c585c66d510a2abab87c36 |
| saltmere_wreck/v1/floor.png | df1fb1b4f97c2a15007b6ffbe22878f43b04732af7d1ff7a6a339e15b244190a |
