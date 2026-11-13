# OO-02 object gate

Step OO-02, v0.4.35. Structure only: the running game still draws and plays the way it does on main. Opacity and fade are not part of VisualObject. That ruling is still open. ChoiceBox is not used as a window skin here.

`docs/OO-MIGRATION.md` step 2 lists `VisualObject` + `Game` root + `SceneRouter` (`js/core/`). This PR ships VisualObject and the Game root only. SceneRouter is deferred to a later PR. It is not in this tree, and nothing here routes field vs battle.

Features frozen; no art changes.

## VisualObject

1. **Owner.** Game. A visual joins the tree by attaching to a parent. When that parent is the Game root, attach records it there.

2. **One job and lifecycle.** Draw one loaded image, or one rectangle of an atlas frame, at a position, an anchor, and a z-order. Lifecycle is attach, then update, then draw, then detach. update does not move or paint.

3. **File and attach point.** `js/core/visual-object.js`. The only attach point is `attach(parent)`.

4. **What it does not change.** The frame loop does not call it, so nothing on screen changes. A missing or unloaded image does not paint, and it does not fall back to code-drawn art. There is no opacity, fade, tint, or filter. The missing-asset hook is `SF.VisualObject.missingAsset`: assign an already loaded image there. Until that image is set, a missing asset only writes a console error. It does not read ChoiceBox or any window skin.

## Game

1. **Owner.** None. Game is the root. `SF.boot` creates the one instance after the title state exists. The art gallery still returns before that.

2. **One job and lifecycle.** Hold a live reference to the existing SF state, and register child objects. Created once at boot and not destroyed. Children still use attach, update, draw, and detach. Game can walk the children in z-order. The frame loop does not call that walk yet.

3. **File and attach point.** `js/core/game.js`. The only attach point is `attach(parent)`, called from `SF.boot` as `new SF.Game().attach(window)`. A child's `attach` is what calls `register`. That is the parent's list, not a second attach point.

4. **What it does not change.** `window.SF` stays the same object, as the compatibility alias. `game.state` is that bag's `SF.state`, not a copy, and writing `game.state` writes `SF.state`. Boot does not change mode, input, drawing, or the play loop. ChoiceBox is not involved. The v0.4.35 strings refresh the shell cache.

## Audit

`node tools/oo-audit.mjs --against-ref origin/main` fails on a real count rise. The baseline was not raised. `tools/oo-audit.mjs`, `tools/oo-audit-tamper.mjs`, `tools/oo-audit-allow.json`, and `.github/workflows/ci.yml` were not edited.

| Signal | origin/main (v0.4.34) | OO-02 working tree (v0.4.35) |
|---|---|---|
| Visual call sites | 4044 | 4044 (unchanged) |
| Leaked window names | 166 | 166 (unchanged) |
| SF members assigned | 684 distinct (908 sites) | 686 distinct (910 sites) |
| SF functions defined in more than one file | 44 | 44 (unchanged) |
| **OO-AUDIT remaining** | **5162** | **5164** |

The two new sites are the constructors published on the compatibility bag: `SF.VisualObject = VisualObject` in `js/core/visual-object.js` and `SF.Game = Game` in `js/core/game.js`. VisualObject's `ctx.drawImage` is not a visual call site; `drawImage` is in the audit's skip list (real bitmap/atlas blits, not code-drawn primitives).

`node tools/oo-audit-tamper.mjs` passes. Official `node tools/smoke.mjs` exits at the embedded audit because of that rise. The rest of smoke, including `oo02 ok`, passed in a local run that recorded the audit failure and continued; that skip is not in the committed `tools/smoke.mjs`. Evidence: `docs/evidence/oo-02/oo-audit-output.txt`, `docs/evidence/oo-02/tamper-output.txt`, `docs/evidence/oo-02/smoke-output.txt`.
