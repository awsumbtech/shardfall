# OO-02 object gate

Step OO-02. Structure only: the running game still draws and plays the way it does on main. Opacity and fade are not part of VisualObject. That ruling is still open. ChoiceBox is not used as a window skin here.

## VisualObject

1. **Owner.** Game. A visual joins the tree by attaching to a parent. When that parent is the Game root, attach records it there.

2. **One job and lifecycle.** Draw one loaded image, or one rectangle of an atlas frame, at a position, an anchor, and a z-order. Lifecycle is attach, then update, then draw, then detach. update does not move or paint.

3. **File and attach point.** `js/core/visual-object.js`. The only attach point is `attach(parent)`.

4. **What it does not change.** The frame loop does not call it, so nothing on screen changes. A missing or unloaded image does not paint, and it does not fall back to code-drawn art. There is no opacity, fade, tint, or filter. The missing-asset hook is `SF.VisualObject.missingAsset`: assign an already loaded image there. Until that image is set, a missing asset only writes a console error. It does not read ChoiceBox or any window skin.

## Game

1. **Owner.** None. Game is the root. `SF.boot` creates the one instance after the title state exists. The art gallery still returns before that.

2. **One job and lifecycle.** Hold a live reference to the existing SF state, and register child objects. Created once at boot and not destroyed. Children still use attach, update, draw, and detach. Game can walk the children in z-order. The frame loop does not call that walk yet.

3. **File and attach point.** `js/core/game.js`. The only attach point is `attach(parent)`, called from `SF.boot` as `new SF.Game().attach(window)`. A child's `attach` is what calls `register`. That is the parent's list, not a second attach point.

4. **What it does not change.** `window.SF` stays the same object, as the compatibility alias. `game.state` is that bag's `SF.state`, not a copy, and writing `game.state` writes `SF.state`. Boot does not change mode, input, drawing, or the version. ChoiceBox is not involved.
