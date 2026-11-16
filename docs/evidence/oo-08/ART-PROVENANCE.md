# OO-08 Act 1 battle foe sheet provenance

Wired 16 November 2026, America/New_York.

## Source

- Box path: `/workspace/shardfall-art/battle-foes-v1/`
- Kit files: `shardfall/battle/foes/<id>/v1/{<id>.png, manifest.json, PROVENANCE.json, SHA256SUMS}`
- Pack index: `/workspace/shardfall-art/battle-foes-v1/manifest.json`
- Status: all 7 passed. Generator: PixelLab (subscription generations, Brian approved 14 November 2026) via the user-pixellab connector. No Kenmi or third-party art as input or reference.
- Layout (every foe): one row per animation (idle, attack, hurt, death, cast), frames left to right, unused cells transparent. Foes face right. Alpha is 0 or 255 only. Pivot is the feet centre; for the fliers (wisp, sootwing) the pivot is the shadow point and `hover_px` is 8. No white flash and no baked shadow in the sheets. Hurt is a drawn recoil pose. `cinder_maw` has no core-overlay rows. The wisp death row's last cell is empty.

## In-game copies

Copied to `assets/battle/foes/<id>/v1/` and verified against each `SHA256SUMS`. Six ids are marked ready and precached. The sootwing sheet stays in `assets/battle/foes/sootwing/v1/` with its manifest, provenance, and `SHA256SUMS`, but it is not marked ready and is not in `data.precache`. It is waiting on a sootwing `SF.FOES` row and encounter, which needs Brian's decision because features are frozen.

| File | sha256 |
|---|---|
| wisp/v1/wisp.png | 3932b538f1f34295203633973d63e759e1da435ccf8702df2b7b3829554ae569 |
| brumekin/v1/brumekin.png | b41bdc5f65b0340ddbcbc6ab203b7bd4986b7c384089d9d6720538e1e392376c |
| sootwing/v1/sootwing.png | 5d780d6d97cd4c4147267d993296ed532715ccea6bcf07031f35b9f43111398e |
| cinderhound/v1/cinderhound.png | fd5440bd32fb0a527e8dff52c804a79324daa105113d880507011c0e5cfd31eb |
| choirling/v1/choirling.png | af080009f82ca1c50077383ab4412e507e1f09b03555d10f04f4de0f7eb20816 |
| ashling/v1/ashling.png | ba3bedacd02d84ddeccdf86b070e09eae5f18f66f6c2b35cd816c69261aad9b2 |
| cinder_maw/v1/cinder_maw.png | 89eb6340d9e03ff386347541b42ede56d7b113291e33a8c6f4de8579f84ccedf |

Cell sizes: normal foes 64×64 pivot 32,60; cinderhound 80×64 pivot 40,60; cinder_maw 160×128 pivot 80,124. Drawn at a whole 2×.
