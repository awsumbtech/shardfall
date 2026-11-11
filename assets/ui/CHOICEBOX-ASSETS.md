# ChoiceBox image slots

ChoiceBox loads each file below as its own image. The code does not draw the panel, the cursor, or button chrome. These two files are empty slots (0 bytes) until the art supplier replaces them. Keep the file names.

The dialogue panel in `css/style.css` is gradients and borders, not a PNG, so it is not reused. The repo has no dialogue-panel or button PNG.

## `assets/ui/choicebox-panel.png`

- Role: the choice panel frame, as a 9-slice.
- Pixel size: 48 × 48.
- 9-slice insets: 16 px left, 16 px top, 16 px right, 16 px bottom.
- Corners: 16 × 16, unstretched.
- Edges: the 16 px strips between the corners stretch along each side.
- Center: the inner 16 × 16 fills the panel.
- After the file loads as a real image, ChoiceBox applies it with CSS `border-image-slice: 16 fill` and a 16 px border width. That border is the slice of this PNG. It is not drawn when the file is missing or empty.
- The laid-out box stays inside a 390 × 844 viewport and an 844 × 390 viewport.

## `assets/ui/choice-cursor.png`

- Role: the selection cursor, shown on the highlighted choice.
- Pixel size: 24 × 24.
- Not a 9-slice. Displayed at 24 × 24 CSS pixels inside the row.
- Each choice row is at least 44 px tall and 44 px wide.

## Buttons

Choice rows are text. There is no button PNG because there is no button chrome. A later button skin has to be its own PNG.
