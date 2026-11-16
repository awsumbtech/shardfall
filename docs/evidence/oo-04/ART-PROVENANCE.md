# OO-04 batch 1 art provenance

Wired 16 November 2026, America/New_York (11:50 AM ET delivery).

## Source

- Box path: `/workspace/shardfall-art/battle-backdrops-v1/`
- Kit files: `shardfall/battle/backdrops/<id>/v1/{sky,far,mid,floor}.png`
- Pack manifest: `/workspace/shardfall-art/battle-backdrops-v1/manifest.json`
- Per-id manifests with sha256: `shardfall/battle/backdrops/<id>/v1/manifest.json`
- Provenance log: `PROVENANCE.json`, generate log: `gen-log.jsonl`, notes: `SOURCE.md`
- Status: draft-v1, art made 2026-11-16. The pack itself was not committed or pushed (no art-repo commit sha).
- Repo researched when the plates were made: `awsumbtech/shardfall@b771565`
- Generator: GenerateImage (Grok Bot built-in), then mechanical cleanup (crop, scale, keying, unfake.js to 1x, palette lock). PixelLab not used. No Kenmi pixels or screenshots.

## In-game copies

Copied to `assets/battle/backdrops/<id>/v1/`. Each sha256 matched the per-id GAM manifest. Every plate is 480×270. Sky is opaque RGB (PNG color type 2). Far, mid, and floor are RGBA (color type 6) and use transparency.

| File | sha256 |
|---|---|
| emberhold_meadow/v1/sky.png | 684f73b78959c7a4af08385c8e574c2bc5f2579bef94b9764879b6d17dd37891 |
| emberhold_meadow/v1/far.png | 18cd0fe37717e9bcabde07feb886855cd37b1b59b3316482ff9e56e2f35633f9 |
| emberhold_meadow/v1/mid.png | 3482793d6f2ee4651a6635662f23852937d7887571d2b13d5b749c02d1513a6d |
| emberhold_meadow/v1/floor.png | add5324b16837044742e48f6560687d99bbe4a3970dfaee493036df82315f352 |
| emberhold_scar/v1/sky.png | fe413bffdfcf4c682db2a55270b5aa8cd9b345a0105ea8dbefc501e92f502298 |
| emberhold_scar/v1/far.png | 128a9a209e206c15f4ca788fd7744efe0aea75021788039117d132fc750923a3 |
| emberhold_scar/v1/mid.png | 3ea1a7bf9fe393560d70000c8e6aba4df2cb3393052f70a0f82a80a2012c04fe |
| emberhold_scar/v1/floor.png | 05f8893194dc0ad50ea551d6e95c648320158b204a8a3a4d89c47b711679e80f |
