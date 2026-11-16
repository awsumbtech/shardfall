# OO-04 in-game shots (v0.4.37)

Taken 16 November 2026, America/New_York, with `/tmp/shot/s.mjs` and cached `chrome-headless-shell-1248`. Viewport 844×390, `deviceScaleFactor` 3 (files are 2532×1170). `Battle.instant` was left off. After New Game and dialogue skip, `SF.Battle.start("em_wisps")` and `SF.Battle.start("em_brumekin")`. Both fights reported `phase: "menu"`, `hasArt: true`, `layersReady: true`.

Copies:

- `/workspace/oo-evidence/oo-04-meadow-844x390.png`
- `/workspace/oo-evidence/oo-04-scar-844x390.png`
- `docs/evidence/oo-04/oo-04-meadow-844x390.png`
- `docs/evidence/oo-04/oo-04-scar-844x390.png`

## Meadow (`em_wisps` / emberhold_meadow)

The painted four-layer plate is clearly on screen: peach sky bands, purple midground ridges, hanging grass islets, the left oak and pine, and the dithered green floor. This is not the old gradient-stripe fallback. Two wisps and the Wayfarer are visible, with the turn strip, party card, battle log, command buttons, and foe HP plates all up. The shot landed mid-exchange (log: "Wisp 2 attacks! Wayfarer takes 6 damage.", HP 42/54).

The mid/floor seam sits on the canvas horizon (css y 179, image y 537), matching plate Y 124 at scale 2. Fighters' feet are on the near floor below that seam (about css y 310, `backdropFloor` in `js/battle/stage.js:206-217`), which is where GAM's own 844×390 fighter preview plants its placeholders. Pixels are sharp (integer scale 2, no visible smoothing or uneven stretch). Cover-fit crops 58 css pixels on the left and right; the battle HUD covers the right-hand tree and the third hanging islet that appear in GAM's clean preview. That is layout, not a broken blit.

## Scar (`em_brumekin` / emberhold_scar)

The painted scar plate is clearly on screen: banded dusk sky, hanging burnt islets, the left peak, the stone arch, purple mid clouds, and the dark near floor. One Brumekin and the Wayfarer are visible, with the full HUD (HP 54/54, log "Brumekin."). Same horizon / near-floor relationship as the meadow, and the same sharp integer-scale blit. The crescent moon and some stars from GAM's clean preview sit in the top of the sky plate and are hidden by the combination of the cover-fit top crop (69 css px) and the turn strip. The mid, arch, peak, and floor read clearly and line up with GAM's preview.
