# OO-05 batch 2 art provenance

Wired 16 November 2026, America/New_York (pair 2 delivery: cinderveil_ash and ember_vault).

## Source

- Box path: `/workspace/shardfall-art/battle-backdrops-v1/`
- Kit files: `shardfall/battle/backdrops/<id>/v1/{sky,far,mid,floor}.png`
- Pack manifest: `/workspace/shardfall-art/battle-backdrops-v1/manifest.json` (batch field: `emberhold-meadow-scar + cinderveil-ash-ember-vault`)
- Per-id manifests with sha256: `shardfall/battle/backdrops/<id>/v1/manifest.json`
- Provenance log: `PROVENANCE.json`, notes: `SOURCE.md`
- Status: draft-v1, art made 2026-11-16. The pack itself was not committed or pushed (no art-repo commit sha).
- Repo researched when the plates were made: `awsumbtech/shardfall@b771565`
- Generator: GenerateImage (Grok Bot built-in), then mechanical cleanup (unfake downscale, chroma-key, palette lock, horizon shift). PixelLab not used. No Kenmi pixels or screenshots.
- Batch 2 used 17 GenerateImage calls (gens 14-30): 8 shipped layers, 7 rejected, 2 style-lock composites. Config `tools/build-config-b2.json`.
- Batch 1 files on main were checked byte-identical to GAM's copies (sha256 unchanged).

## In-game copies

Copied to `assets/battle/backdrops/<id>/v1/`. Each sha256 matched both the pack `PROVENANCE.json` and the per-id GAM manifest. Every plate is 480×270. Sky is opaque RGB (PNG color type 2). Far, mid, and floor are RGBA (color type 6) and use transparency.

| File | sha256 |
|---|---|
| cinderveil_ash/v1/sky.png | 0490701e660b79cc95fe503020f3f85955f49f8c64b5e29f84b9ab2474a6964e |
| cinderveil_ash/v1/far.png | 79abb9a6e345ca7d977b055c1fa0997b53ed8f39ab17c527e2876a95d28a81ec |
| cinderveil_ash/v1/mid.png | bac30abc96a82543411b54e0d7dbd98c14d1ae7e5ad4aab6a06198ed06f18946 |
| cinderveil_ash/v1/floor.png | cd8c821d4c25917e44dd93042c73b00ab410ae1c8df057b7fec228cfbbd1f7ce |
| ember_vault/v1/sky.png | 5d3d132f39c70984205554c9f765ecc54ebb444cfebfe33ac8a7a481268b5c10 |
| ember_vault/v1/far.png | 2e28a178fe666bd1b92041b133c5802efd7f9c42db4dc85a7a8cf88139d63bf3 |
| ember_vault/v1/mid.png | 57e44af4fc36e0a3b0d2b66a0ff450338a569c7ddf4611a3cba74bb68ceb9a68 |
| ember_vault/v1/floor.png | bf4f8c5d37727930caa5c9e363929177e7a849ebcf99a3a3506d880d84a16834 |
