# OO-06 in-game shots

Taken 16 November 2026, America/New_York. Viewport 844×390, deviceScaleFactor 3 (2532×1170 PNG). Local site, chrome-headless-shell-1248. Fighters and the command HUD are visible in all three. Shore and wreck fights were started with `SF.Battle.start`. The Tidewyrm fight was started the way the game does: `SF.mountIsland("saltmere")`, `SF.makeEnemies()`, then `SF.touchFoe` on the `sm-tidewyrm` spawn, whose `bg` overrides the encounter row (`saltmere_shore`) to `saltmere_wreck`.

## saltmere_shore — `sm_saltwisps`

`docs/evidence/oo-06/oo-06-shore-844x390.png` (also `/workspace/oo-evidence/oo-06-shore-844x390.png`)

The painted shore is clearly showing: warm rippled sand with salt streaks, a rope fence on wooden posts, dune grass, a lilac sea, and a peach dusk sky. Two Saltwisps and the Wayfarer stand on the sand, feet on the standing lane, waterline above them. Nothing is cut off. Pixels are sharp. The log shows a Saltwisp hit landed before the shutter (Wayfarer 36/54); that does not hide the backdrop or the HUD.

## saltmere_wreck — `sm_drowned`

`docs/evidence/oo-06/oo-06-wreck-844x390.png` (also `/workspace/oo-evidence/oo-06-wreck-844x390.png`)

The painted wreck beach is clearly showing, and it is distinct from the shore plate: no fence on the left, a broken timber at the waterline, and wreck planks in the lower right. Two Drowned and the Wayfarer stand on the sand, feet below the horizon. Pixels are sharp. The larger mid-layer wreck structure sits mostly under the command panel, as expected on this layout. What remains visible — the floor planks, the horizon timber just left of the menu, and a sliver of wreckage along the panel's left edge — still reads as a shipwreck rather than a bare beach, but the hull itself is largely hidden.

## Tidewyrm on saltmere_wreck — field start

`docs/evidence/oo-06/oo-06-tidewyrm-844x390.png` (also `/workspace/oo-evidence/oo-06-tidewyrm-844x390.png`)

Same wreck backdrop as the Drowned fight (`battle.bg` was `saltmere_wreck` from the spawn override). The Tidewyrm is a large teal serpent on the open left sand. It reads clearly against the calm tan floor and the purple sea; the body is not lost in the backdrop. The Wayfarer stands to the right. The Flee slot correctly says "Cannot flee." The same wreck cues (planks, horizon timber) are visible, again with most of the mid-layer hull under the menu. The log shows "Tidewyrm attacks." but the Wayfarer is still at 54/54; that does not hide the foe or the backdrop.
