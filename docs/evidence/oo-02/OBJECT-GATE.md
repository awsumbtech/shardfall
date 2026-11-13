# OO-02 object gate

Step OO-02 / 2a, v0.4.35. Structure only: the running game still draws and plays the way it does on main. Opacity and fade are not part of VisualObject. That ruling is still open. ChoiceBox is not used as a window skin here.

`docs/OO-MIGRATION.md` step 2a is `VisualObject` + the `Game` root. SceneRouter is step 2b, a later PR (Chief of Staff call applying Brian's standing rules, Nov 13 9:02 AM ET, not Brian's own words). It is not in this tree, and nothing here routes field vs battle.

Features frozen; no art changes.

## VisualObject

1. **Owner.** Game. A visual joins the tree by attaching to a parent. When that parent is the Game root, attach records it there.

2. **One job and lifecycle.** Draw one loaded image, or one rectangle of an atlas frame, at a position, an anchor, and a z-order. Lifecycle is attach, then update, then draw, then detach. update does not move or paint. Construction goes through `init`. Helpers `num`, `imageSize`, `rectOf`, `resolveAsset`, and `anchorOffset` are statics on `VisualObject`, not free functions.

3. **File and attach point.** `js/core/visual-object.js`. The only attach point is `attach(parent)`. The constructor is published as a counted `SF.VisualObject = function VisualObject` assign in `js/main.js`. This file attaches methods and statics and has zero `SF.*` sites.

4. **What it does not change.** The frame loop does not call it, so nothing on screen changes. There is no opacity, fade, tint, or filter. It does not read ChoiceBox or any window skin. When an image is missing, `SF.VisualObject.missingAsset` is the hook for a real authored placeholder image, and a console error is also logged. It never falls back to code art. The placeholder art does not exist yet, so the hook stays, defaults to null, and currently logs only (open item for Game Art & Motion). Chief of Staff call applying Brian's standing rules (Nov 13 9:02 AM ET), not Brian's own words.

## Game

1. **Owner.** None. Game is the root. `SF.boot` creates the one instance after the title state exists. The art gallery still returns before that. Boot and resize throw `Error("Game root is missing")` if the constructor or the instance is missing; they do not return silently.

2. **One job and lifecycle.** The composition root: hold a live reference to the existing SF state, own the canvas and viewport bootstrap, run the frame loop, and register child objects. Created once at boot and not destroyed. Children still use attach, update, draw, and detach. Game can walk the children in z-order. The page frame loop (`startLoop`) still calls the existing `SF.update` / `SF.draw` path and does not walk VisualObject children yet. The per-frame work lives on `Game.prototype.frame`; `startLoop` only schedules it.

3. **File and attach point.** `js/core/game.js`. The only attach point is `attach(parent)`, called from `SF.boot` as `SF.game = new SF.Game(); SF.game.attach(window)`. `attach` does not write `SF.game`. A child's `attach` is what calls `register`. That is the parent's list, not a second attach point. The constructor is published as a counted `SF.Game = function Game` assign in `js/main.js`. `SF.game` is also a counted assign there. This file attaches methods and has zero `SF.*` sites. The page calls `SF.boot()` after the core scripts load.

4. **What it does not change.** `window.SF` stays the same object, as the compatibility alias. `game.state` is that bag's `SF.state`, not a copy, and writing `game.state` writes `SF.state` through a counted `SF.state =` in `js/main.js`. Boot does not change mode, input, drawing, or the play loop's behavior. ChoiceBox is not involved. The v0.4.35 strings refresh the shell cache.

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
| (frame loop) | local `frame()` in `SF.boot` | `Game.prototype.startLoop` + `Game.prototype.frame` | The page loop itself. |

`SF.resize` and `SF.boot` stay as functions in `js/main.js`. `SF.viewW`, `SF.viewH`, `SF.dpr`, and `SF.zoom` stay on the bag for this PR (many draw-layer readers and other assignment sites). `SF.state` also stays on the bag; `game.state` is a live reference to it. Those remaining shims and their removal steps are in `docs/OO-MIGRATION.md` Part E, Other notes.

`SF.Game`, `SF.VisualObject`, and `SF.game` are still the public names. They are literal counted assigns in `js/main.js` so the new core files do not add a per-file SF assignment. The per-file ratchet treats a new file as 0, so an `SF.Game =` site in `js/core/game.js` would fail `--against-ref origin/main` even when the totals fall. `SF.defineGame`, `SF.defineVisualObject`, `function bag()`, and `host.game = this` were removed. This is not a computed key, alias, or scanner-gap trick.

## Findings to fix (items 1–8)

| # | Finding (at `b263b18`) | Fix |
|---|---|---|
| 1 | `SF.defineGame` / `SF.defineVisualObject` in `js/main.js:9-13`; `host.game = this` in `js/core/game.js:61` | Removed the define* shims and the host alias. Literal counted assigns: `SF.VisualObject` (`js/main.js:10`), `SF.Game` (`js/main.js:13`), `SF.game` (`js/main.js:114`). `attach` no longer publishes the root. |
| 2 | Free helpers `num`, `imageSize`, `rectOf`, `resolveAsset`, `anchorOffset` in `js/core/visual-object.js:9-57`; `function bag()` in `js/core/game.js:29` | Statics on `VisualObject` (`js/core/visual-object.js:12`, `:16`, `:26`, `:43`, `:60`). `bag()` removed. Constructors call `init` (`VisualObject.prototype.init`, `Game.prototype.init` at `js/core/game.js:15`). The loop body is `Game.prototype.frame` (`js/core/game.js:99`); `startLoop` (`js/core/game.js:89`) only schedules a local `tick`. |
| 3 | Doc step 2 mixed VisualObject+Game with SceneRouter | Step 2 split into 2a (this PR) and 2b (SceneRouter, later). Downstream "Depends on 2" cells retargeted to 2a. |
| 4 | B1 counts were stale; no shim-removal table | B1 refreshed to the live audit (676 members / 900 sites; cinder 85, world 79, menu/field 58, ui 49, terrain 48, dialogue leaked 30, audio leaked 5). Shim table in Part E Other notes, each with a removal step. |
| 5 | `if (!game) return` at `js/main.js:93` and `:116` | Both sites throw `Error("Game root is missing")` (`js/main.js:112`, `:118`, and resize `:141`). |
| 6 | Constructors published through uncounted shims | Counted publication in `js/main.js` documented (Part E Other notes item 1). Core files stay at zero `SF.*` sites. |
| 7 | Remaining bag compatibility was not listed with removal steps | Shim table: `window.SF` bag (shrinks until the facade is gone); `game.state` write-through (step 10 GameState); `SF.boot` / `SF.resize` (step 10 GameLoop, step 39 Viewport); `SF.viewW` / `viewH` / `dpr` / `zoom` (step 39 Viewport). |
| 8 | Boot and resize failed open | Fail-closed: missing Game constructor or instance throws. Documented in Part E Other notes item 3. |

## Audit

`node tools/oo-audit.mjs --against-ref origin/main` passes. The baseline was lowered with `node tools/oo-audit.mjs --write-baseline`. `tools/oo-audit.mjs`, `tools/oo-audit-tamper.mjs`, `tools/oo-audit-allow.json`, and `.github/workflows/ci.yml` were not edited.

| Signal | origin/main (v0.4.34) | OO-02 working tree (v0.4.35) |
|---|---|---|
| Visual call sites | 4044 | 4044 (unchanged) |
| Leaked window names | 166 | 166 (unchanged) |
| SF members assigned | 684 distinct (908 sites) | 676 distinct (900 sites) |
| SF functions defined in more than one file | 44 | 44 (unchanged) |
| **OO-AUDIT remaining** | **5162** | **5154** |

`js/main.js` went 34 members / 38 sites on origin/main to 26 members / 30 sites. VisualObject's `ctx.drawImage` is not a visual call site; `drawImage` is in the audit's skip list. `js/core/game.js` and `js/core/visual-object.js` have zero `SF.*` sites.

`node tools/oo-audit-tamper.mjs` passes. Official `node tools/smoke.mjs` passes, including `oo02 ok`. Evidence: `docs/evidence/oo-02/oo-audit-output.txt`, `docs/evidence/oo-02/tamper-output.txt`, `docs/evidence/oo-02/smoke-output.txt`.
