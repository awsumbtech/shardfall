# OO-07 in-game shots

All four are 844×390 CSS pixels at deviceScaleFactor 3 (2532×1170 bitmaps). Also saved under `/workspace/oo-evidence/`.

## highspire_road — `hs_choir_patrol`

`docs/evidence/oo-07/oo-07-highspire-844x390.png` (also `/workspace/oo-evidence/oo-07-highspire-844x390.png`)

Started the way the game starts this fight: field choir-patrol spawns are stripped in `js/content/maps/v2layout.js` (only bosses stay as world foes), so a Highspire road walk rolls the encounter (`SF.noteTravel` → `SF.rollEncounter` on `hs-road-2`, `bg: "highspire_road"`). The painted road is clearly showing: a cobbled stone floor with dirt at the rims, a stone marker and blank signpost on the left, a grey rocky ridge, snow-capped violet peaks in a cloud sea, a slender pale spire on the far left, and a wind-swept peach-and-violet dusk sky. Two Choir Soldiers and the Wayfarer stand on the cobbles, feet on the standing lane. Pixels are sharp. Nothing is cut off. The log says "Choir Patrol."

## hush_deck — `sea_hush_raiders`

`docs/evidence/oo-07/oo-07-hush-844x390.png` (also `/workspace/oo-evidence/oo-07-hush-844x390.png`)

Started the way the game starts this fight: `SF.seaFightChance = 1`, `SF.startVoyage("cinderveil")`, then `SF.updateVoyage` until `maybeSeaFight` at `js/world.js:320` opens the battle with `bg: "hush_deck"`. The painted deck is clearly showing and reads as a ship: wooden plank floor, a rail with balusters, a rope coil and lantern on the left, and a misty violet cloud-sea under a calm cloud sky. Two Hush Raiders and the Wayfarer stand on the planks. The mast and rigging that belong on the right sit mostly under the command panel, as designed; a sliver of timber is visible at the panel's top-right edge. Pixels are sharp. The log shows a Hush Raider hit landed before the shutter (Wayfarer 30/54); that does not hide the backdrop or the HUD.

## saltmere_wreck v2 — `sm_drowned`

`docs/evidence/oo-07/oo-07-wreck-844x390.png` (also `/workspace/oo-evidence/oo-07-wreck-844x390.png`)

Catalog version is v2 (`battle` bg `saltmere_wreck`, dir `assets/battle/backdrops/saltmere_wreck/v2/`). Compared with the v1 wreck shot from OO-06, this now reads as a shipwreck in the visible mid band: a broken ribbed hull and snapped posts stand at the waterline, clearly left of the menu, with the familiar floor planks in the lower right. The right-hand continuation of the hull still runs under the command panel, but what remains visible is enough. Sky, sea, and the left sand are unchanged from v1 (those plates are byte-identical copies). Two Drowned and the Wayfarer stand on the sand. Pixels are sharp.

## Tidewyrm on saltmere_wreck v2 — field start

`docs/evidence/oo-07/oo-07-tidewyrm-844x390.png` (also `/workspace/oo-evidence/oo-07-tidewyrm-844x390.png`)

Same v2 wreck backdrop (`battle.bg` was `saltmere_wreck` from the spawn override). The Tidewyrm is a large teal serpent on the open left sand. That boss area is still calm: low dunes only, no tall wreckage crowding the body, and the serpent reads clearly against the tan floor and the purple sea. The new mid-plate wreck (ribs and posts) is visible to the right of the beast, still left of the menu. The Flee slot correctly says "Cannot flee." The log shows "Tidewyrm attacks." but the Wayfarer is still at 54/54; that does not hide the foe or the backdrop.
