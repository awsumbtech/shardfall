# Emberhold tile map

Emberhold's ground is a hand-edited layout, not a live trace of the old circles.

- `emberhold.spec.json` is the layout: land boxes, terraces, paths, stairs, the rope bridge, and markers. Coordinates are tile rects, half-open, the same 16px grid as `js/content/maps/v2layout.js`.
- `python3 -m ehmap.build` (run from `tools/`, with `ASSETS_DIR` pointing at the private art repo) rebuilds the map. It needs Python, numpy, and Pillow. Low ash uses `DIM` in `build.py` (RGB scale 0.6, alpha unchanged). Do not commit a darkened sheet.
- The game reads `js/content/maps/emberhold.tmj`. That file is indices only. Copy a fresh build over it after you change the spec. Sheet paths in the `.tmj` stay relative (`vendor/kenmi/...`, `art/fx-tiles.png`, `art/meta-tiles.png`).
- `node tools/ehmap/ground-frames.mjs` rewrites the ground entries in `art/atlas.config.json` from the GIDs the `.tmj` actually uses, including the dim factor on the low-ash sheet.
- `art/fx-tiles.png` and `art/meta-tiles.png` are our translucent shadow and meta tiles. Kenmi pixels stay in the private art repo.
- `js/content/maps/props-preview.json` is the guide for where code-art trees sit. Kenmi prop sprites are a later change.
