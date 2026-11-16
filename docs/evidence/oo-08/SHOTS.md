# OO-08 in-game shots

Taken 16 November 2026, about 3:28 PM America/New_York, from a local server of this branch, 844×390 CSS, `deviceScaleFactor` 3 (2532×1170 PNGs), service worker disabled. Files live in this folder and in `/workspace/oo-evidence/`.

Starts: `em_wisps`, `em_brumekin`, `em_choirling`, `cv_ash1`, `cv_cinderhound`, and the Cinder Maw boss start at `js/cinder.js:648-654`. There is no sootwing fight shot: the sootwing sheet is delivered but not marked ready, and no game encounter lists a sootwing (`soot-east` / `KIND_ENCOUNTER.sootwing` start `cv_mixed`). Wiring that fight needs Brian's decision because features are frozen.

Also: `oo-08-wisp-attack-844x390.png` (dart frame) and `oo-08-brumekin-hurt-844x390.png` (recoil, no white flash). Contact sheet: `oo-08-foes-6.png`.

## Assessments

- **wisp** (`em_wisps`): two stars hover above the meadow with a floor shadow under each; they face the hero (right). Pixels are sharp. Labels sit on the ground. The menu log already shows a prior wisp hit (speed), which is existing battle timing, not a sheet issue.
- **wisp attack**: left wisp is on a mid-dart frame (lean + motes), still hovering, still facing the hero. No code flash.
- **brumekin** (`em_brumekin`): feet planted on the scar, facing the hero, sharp, label under the feet.
- **brumekin hurt**: drawn recoil (eyes shut, lean back), knocked slightly left by the existing `actorNudge`. No white plus or tint.
- **choirling** (`em_choirling`): feet on the meadow, hooded figure facing the hero, sharp.
- **ashling** (`cv_ash1`): feet on the ash, facing the hero, sharp. The ashling had already taken a turn (hero at 46/54).
- **cinderhound** (`cv_cinderhound`): quadruped, feet on the ash, head toward the hero, sharp.
- **cinder_maw** (boss start, `ember_vault`): feet planted on the vault floor, facing the hero, sharp. The 2× 160×128 sheet is much larger than the hero, as specified. The crest comes close to the turn strip but is not clipped by it (a sliver of vault remains above the horn). The right-hand command panel does not overlap the boss. The chest core is visible in the sheet's idle art; the `Core` tag still comes from data. There is no separate core-overlay row.

All six ready foes still show the existing code-drawn `drawGroundShadow` under them (not its own object; left in place, reported as a gap).
