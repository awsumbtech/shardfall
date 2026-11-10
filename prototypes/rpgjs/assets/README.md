# Sprite-sheet slots

These files are not in the tree. Drop the real sheets on these paths. Do not draw stand-ins, and do not commit the Kenmi atlas.

| File | Owns | Expected grid, until a real sheet says otherwise |
| --- | --- | --- |
| `wayfarer-outfitB.png` | player graphic `wayfarer` | 64×64 cells, 6 columns × 6 rows (384×384). Rows, from `art/atlas.config.json`: idle down, idle side, idle up, walk down, walk side, walk up. Six frames each. |
| `npc-maren.png` | event graphic `npc-maren` | Same grid is registered so a matching sheet would animate. Change `src/sprites.ts` if the real NPC sheet is different. |

A missing file is the intended state. The game still loads the map, walks, talks, and saves. The graphic is simply absent.

`src/tiled/images/fx-tiles.png` and `src/tiled/images/meta-tiles.png` are copies of the real `art/fx-tiles.png` and `art/meta-tiles.png` already in the repo. Every other tileset image the map names is listed in `src/tiled/manifest.json` and is not created.
