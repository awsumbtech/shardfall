# OO-02 object gate

Step OO-02, v0.4.35. Structure only: the running game still draws and plays the way it does on main. Opacity and fade are not part of VisualObject. That ruling is still open. ChoiceBox is not used as a window skin here.

`docs/OO-MIGRATION.md` step 2 is `VisualObject` + the `Game` root. SceneRouter is step 2b, a later PR (Chief of Staff call applying Brian's standing rules, Nov 13 9:02 AM ET, not Brian's own words). It is not in this tree, and nothing here routes field vs battle.

Features frozen; no art changes.

## VisualObject

1. **Owner.** Game. A visual joins the tree by attaching to a parent. When that parent is the Game root, attach records it there.

2. **One job and lifecycle.** Draw one loaded image, or one rectangle of an atlas frame, at a position, an anchor, and a z-order. Lifecycle is attach, then update, then draw, then detach. update does not move or paint.

3. **File and attach point.** `js/core/visual-object.js`. The only attach point is `attach(parent)`. The constructor is published as `SF.VisualObject` from `js/main.js` through `SF.defineVisualObject`.

4. **What it does not change.** The frame loop does not call it, so nothing on screen changes. There is no opacity, fade, tint, or filter. It does not read ChoiceBox or any window skin. When an image is missing, `SF.VisualObject.missingAsset` is the hook for a real authored placeholder image, and a console error is also logged. It never falls back to code art. The placeholder art does not exist yet, so the hook stays, defaults to null, and currently logs only (open item for Game Art & Motion). Chief of Staff call applying Brian's standing rules (Nov 13 9:02 AM ET), not Brian's own words.

## Game

1. **Owner.** None. Game is the root. `SF.boot` creates the one instance after the title state exists. The art gallery still returns before that.

2. **One job and lifecycle.** The composition root: hold a live reference to the existing SF state, own the canvas and viewport bootstrap, run the frame loop, and register child objects. Created once at boot and not destroyed. Children still use attach, update, draw, and detach. Game can walk the children in z-order. The page frame loop (`startLoop`) still calls the existing `SF.update` / `SF.draw` path and does not walk VisualObject children yet.

3. **File and attach point.** `js/core/game.js`. The only attach point is `attach(parent)`, called from `SF.boot` as `new SF.Game().attach(window)`. A child's `attach` is what calls `register`. That is the parent's list, not a second attach point. The constructor is published as `SF.Game` from `js/main.js` through `SF.defineGame`. The page calls `SF.boot()` after the core scripts load.

4. **What it does not change.** `window.SF` stays the same object, as the compatibility alias. `game.state` is that bag's `SF.state`, not a copy, and writing `game.state` writes `SF.state`. Boot does not change mode, input, drawing, or the play loop's behavior. ChoiceBox is not involved. The v0.4.35 strings refresh the shell cache.

## Members moved onto Game

Each of these left `SF.*` and is now a field on the Game instance. Readers go through `SF.game`.

| Member | Was | Now | Why |
|---|---|---|---|
| `view` | `SF.view` in `js/main.js` boot | `game.view` | Canvas bootstrap. Readers: `js/draw.js`, `js/battle/draw.js`, `js/main.js` resize, `tools/field-qa.mjs`. |
| `map` | `SF.map` in `js/main.js` boot | `game.map` | Minimap canvas. Readers: `js/draw/minimap.js`, `js/main.js` resize. |
| `ctx` | `SF.ctx` in `js/main.js` boot | `game.ctx` | Drawing context. Readers: `js/draw.js`, `js/battle/draw.js`, `tools/field-qa.mjs`. |
| `portraitLock` | `SF.portraitLock` in resize / frame | `game.portraitLock` | Frame loop / resize. |
| `_resizeTick` | `SF._resizeTick` in the frame loop | `game._resizeTick` | Frame loop. |
| `resizeWrites` | `SF.resizeWrites` in resize | `game.resizeWrites` | Resize counter. |
| `BASE_W` | `SF.BASE_W` | `game.BASE_W` | Viewport constant, used by resize. |
| `BASE_H` | `SF.BASE_H` | `game.BASE_H` | Viewport constant, used by resize. |
| `ASPECT_MIN` | `SF.ASPECT_MIN` | `game.ASPECT_MIN` | Viewport constant, used by resize. |
| `ASPECT_MAX` | `SF.ASPECT_MAX` | `game.ASPECT_MAX` | Viewport constant, used by resize. |
| `pixelScale` | `SF.pixelScale` in resize | `game.pixelScale` | Viewport scale from resize. |
| (frame loop) | local `frame()` in `SF.boot` | `Game.prototype.startLoop` | The page loop itself. |

`SF.resize` and `SF.boot` stay as functions in `js/main.js`. `SF.viewW`, `SF.viewH`, `SF.dpr`, and `SF.zoom` stay on the bag for this PR (many draw-layer readers and other assignment sites). `SF.state` also stays on the bag; `game.state` is a live reference to it.

`SF.Game` and `SF.VisualObject` are still the public names. They are assigned in `js/main.js` (`SF.defineGame` / `SF.defineVisualObject`) so the new core files do not add a per-file SF assignment. The per-file ratchet treats a new file as 0, so an `SF.Game =` site in `js/core/game.js` would fail `--against-ref origin/main` even when the totals fall. This is not a computed key, alias, or scanner-gap trick.

## Audit

`node tools/oo-audit.mjs --against-ref origin/main` passes. The baseline was lowered with `node tools/oo-audit.mjs --write-baseline`. `tools/oo-audit.mjs`, `tools/oo-audit-tamper.mjs`, `tools/oo-audit-allow.json`, and `.github/workflows/ci.yml` were not edited.

| Signal | origin/main (v0.4.34) | OO-02 working tree (v0.4.35) |
|---|---|---|
| Visual call sites | 4044 | 4044 (unchanged) |
| Leaked window names | 166 | 166 (unchanged) |
| SF members assigned | 684 distinct (908 sites) | 677 distinct (900 sites) |
| SF functions defined in more than one file | 44 | 44 (unchanged) |
| **OO-AUDIT remaining** | **5162** | **5154** |

`js/main.js` went 34 members / 38 sites to 27 members / 30 sites. VisualObject's `ctx.drawImage` is not a visual call site; `drawImage` is in the audit's skip list.

`node tools/oo-audit-tamper.mjs` passes. Official `node tools/smoke.mjs` passes, including `oo02 ok`. Evidence: `docs/evidence/oo-02/oo-audit-output.txt`, `docs/evidence/oo-02/tamper-output.txt`, `docs/evidence/oo-02/smoke-output.txt`.
