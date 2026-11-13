# Sprite sheets

The committed sheets are the PixelDoll v0.2 prototype exports. Do not draw stand-ins, and do not commit the Kenmi atlas or the source zips.

| File | Owns | Grid |
| --- | --- | --- |
| `wayfarer-outfitB.png` | player graphic `wayfarer` | 112px cells, 8 columns × 4 rows (896×448). Rows are S, E, N, W. Eight walk frames per row. Stand is the first frame of the facing row. |
| `npc-maren.png` | event graphic `npc-maren` | 80×80, one south-facing stand. |

`src/sprites.ts` registers those grids. Scale is 0.5 so the Wayfarer reads at about one 16px tile wide and two tiles tall.

`src/tiled/images/fx-tiles.png` and `src/tiled/images/meta-tiles.png` are copies of the real `art/fx-tiles.png` and `art/meta-tiles.png` already in the repo. Every other tileset image the map names is listed in `src/tiled/manifest.json` and is not created.
