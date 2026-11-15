# OO-03 object gate

Step OO-03 / 2b, v0.4.36. Pure refactor: the running game draws and plays the way it does on main (v0.4.35). Features frozen. No art, no new visuals, no tints, no fades.

## SceneRouter

1. **Owner object.** The `Game` root. `Game.init` (`js/core/game.js:34-37`) builds the one router as `game.scenes` and attaches it to itself. It throws `Error("SceneRouter missing")` if the constructor did not load. There is no `SF.scenes`; readers go through `SF.game.scenes`.

2. **One job and lifecycle.** Own which scene is active and route between scenes. The scene is the existing `state.mode` string (title, play, cutscene, dialogue, voyage, battle, results, pause, fieldmenu, sailmenu, shop, inn, notice, hand, chest).
   - `go(name[, state])` (`js/core/scene-router.js:64`) is the one write of `state.mode` in `js/`. All 45 former direct writes in 9 files call it. It keeps a bounded transition history (16) for QA.
   - `current()` / `is(name)` read the active scene.
   - `screenFor(state)` / `draw()` (`:77`, `:86`) pick the screen that paints this frame (battle, title, or field) and call that screen's own drawer. The router paints nothing itself.
   - `notePaint()` (`:112`) stamps the first frame an overlay scene was painted, for the press gate.
   - Lifecycle: created in `Game.init`, attached once, lives as long as the Game root. It is never destroyed.

3. **File and attach point.** `js/core/scene-router.js`. The only attach point is `attach(game)`, called once from `Game.init`; a second attach is ignored (smoke checks it). The constructor is a counted one-line `SF.SceneRouter = function SceneRouter` assign in `js/main.js:16`, like `SF.Game` and `SF.VisualObject`. The router file attaches methods and statics through `window.SF.SceneRouter`, throws if it is missing, and has zero `SF.*` sites. Helpers are on the class (`SceneRouter.HISTORY`, `SceneRouter.PAINT_OVERLAYS`); there are no free functions. `index.html` loads it after `js/core/game.js` and before `SF.boot()`; `sw.js` precaches it.

4. **What it does not change.** No visuals, no gameplay changes, no art. Each screen keeps its drawer: `SF.drawField` (the old field draw in `js/draw.js`, renamed), `SF.drawBattle`, and `SF.drawTitleScene`. The voyage stays a field layer. The guards are the same as before: battle paints only when `state.battle` is set and the mode is battle or results; title paints only when `drawTitleScene` exists, with the same canvas, blobs, and size guards. Pause/resume rules (`pausedFrom`), dialogue, battle, and menu logic are unchanged; only their mode writes go through `go()`. Missing drawers and a missing router throw instead of painting nothing.

## Moved off the SF bag

| Was | Now |
|---|---|
| `SF.draw` in `js/draw.js` + `SF.draw` wrapper with `var baseDraw` in `js/battle/draw.js` | `game.scenes.draw()` picks the screen; field draw renamed `SF.drawField` |
| `SF.BattleUI` / `SF.Battle.UI` (only used by that wrapper) | removed; the router calls `SF.drawBattle` |
| title branch inside the field draw | `SceneRouter.screenFor` / `draw` |
| `SF.noteOverlayPaint`, `SF._paintedOverlay`, `SF._overlayPaintAt` (`js/main.js`, `js/input.js`) | `game.scenes.notePaint()`, `game.scenes.paintedKey`, `game.scenes.paintAt` |
| 45 direct `state.mode =` writes | `SF.game.scenes.go(name[, state])` |

Remaining shims and their removal steps are in `docs/OO-MIGRATION.md` Part E, Other notes.

## Tests

- `tools/scene-router-check.mjs` (run by `tools/smoke.mjs`) boots the real page and walks title → field → battle → field. The router history must read `title>play play>dialogue dialogue>play` and then `play>battle battle>play`. Only the matching screen may paint at each step. It fails if `SF.draw` still exists. A mutation that put back one direct `s.mode = "battle"` write made it fail (`battle history was battle>play`).
- `runOo03Checks` in `tools/smoke.mjs` covers the static rules: no `.mode =` write in `js/` outside the router, no `SF.*` assign or free helper in the router file, no `SF.draw` patch chain, script order, and precache. It also unit-tests the router: single attach, throws when unattached or given no name or no state, screen picks for title/play/voyage/battle/results, a bounded history, and a throw when a drawer is missing.
- The vm harnesses that run game code without the page boot now build the same Game root first: `tools/smoke.mjs`, `tools/shard-check.mjs`, `tools/battle-parity.mjs`, and `tools/feel-smoke.mjs`. The page does this in `SF.boot`.

## Screenshots (844x390, deviceScaleFactor 3, local static server, no atlas on disk)

- `oo-03-v0.4.36-title-844x390.png`: title.
- `oo-03-v0.4.36-field-844x390.png`: field after New Game and the wake dialogue.

Each was compared with the same shot of main (v0.4.35), taken with the same script. They match by eye. The small pixel differences come from the drifting clouds and motes and from the version text.
