# ChoiceBox image slots

ChoiceBox loads each file below as its own image. The code does not draw the panel, the cursor, or button chrome. Keep the file names.

The dialogue panel in `css/style.css` is gradients and borders, not a PNG, so it is not reused. The repo has no dialogue-panel or button PNG.

## Provenance (test art, not approved to ship)

These two PNGs are Game Art & Motion test art for the ChoiceBox spike (draft PR awsumbtech/shardfall#53). They are not approved to ship.

- Source: awsumbtech/game-art PR #7, branch `art/shardfall-choicebox-ui-v0.1.0`, commit `04e5165`, path `shardfall/ui/choicebox/v0.1.0/`.
- Version: 0.1.0 (panel-b + cursor-b).
- SHA-256: `choicebox-panel.png` `2859572c01d05658e73e98aba1c7b570d4da5b392d8c5660e66c4545faae14e8`; `choice-cursor.png` `9af85875d6b9e951a21eff110bb66566197ae8fc72cdc5ec5ed1615851a6f746`.
- No PixelLab spend. Generated with Grok Bot built-in image generation, then cleaned with unfake.js and assembled as a 9-slice / 24×24 cursor. No Kenmi / Cute Fantasy / shardfall-assets pixels were used as reference or input.

If a file is missing, empty, or fails to load, ChoiceBox does not insert a broken-image icon. The `Empty: …` notice is the fallback for that case.

## `assets/ui/choicebox-panel.png`

- Role: the choice panel frame, as a 9-slice.
- Pixel size: 48 × 48, RGBA.
- 9-slice insets: 16 px left, 16 px top, 16 px right, 16 px bottom.
- Corners: 16 × 16, unstretched.
- Edges: the 16 px strips between the corners stretch along each side.
- Center: the inner 16 × 16 fills the panel (flat `#1a428b`).
- After the file loads as a real image, ChoiceBox applies it with CSS `border-image-slice: 16 fill` and a 16 px border width, plus `image-rendering: pixelated`. That border is the slice of this PNG. It is not drawn when the file is missing or empty.
- The laid-out box stays inside a 390 × 844 viewport and an 844 × 390 viewport.

## `assets/ui/choice-cursor.png`

- Role: the selection cursor, shown on the highlighted choice.
- Pixel size: 24 × 24, RGBA.
- Not a 9-slice. Displayed at 24 × 24 CSS pixels inside the row.
- Each choice row is at least 44 px tall and 44 px wide.

## Buttons

Choice rows are text. There is no button PNG because there is no button chrome. A later button skin has to be its own PNG.
