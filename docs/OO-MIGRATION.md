# Shardfall OO migration: inventory and conversion order

## Audit gate

`tools/oo-audit.mjs` is the machine check for this order. It counts code-drawn visual call sites in `js/`, `css/`, and `index.html` (canvas drawing, including `clip()` and `ctx["fillRect"]`, CSS gradients, box-shadow, clip-path, and filter, and JS assignments that install a gradient, box-shadow, or clip-path through `style.background`, `style.boxShadow`, or `style.cssText`), plus non-object signals: top-level names leaked onto `window`, `SF.*` assignment sites, and `SF` functions defined in more than one file. Diagnostics listed in A13 stay out through `tools/oo-audit-allow.json`. Each allowlist entry cites the doc row and a reason. Scroll-fade masks (Part E item 10) are allowlisted with them.

Run it from the repo root:

```bash
node tools/oo-audit.mjs
node tools/oo-audit.mjs --against-ref origin/main
node tools/oo-audit.mjs --write-baseline
```

`node tools/smoke.mjs` runs the audit and `tools/oo-audit-tamper.mjs` (`OoAuditTamper`). On a pull request, `.github/workflows/ci.yml` fetches `main` and runs `node tools/oo-audit.mjs --against-ref origin/main`. That mode loads `git show <ref>:tools/oo-baseline.json` and fails if any per-file or per-category count in the working baseline or in the live counts is above that ref. A ref that has no baseline file yet is the first baseline and is allowed. When `origin/main` already contains `tools/oo-audit.mjs`, CI also runs that copy against the pull-request tree (`git show origin/main:tools/oo-audit.mjs` into a temp file, then `--against-ref origin/main`), so the pull request cannot weaken the script it is judged by. The first run is allowed only after `git rev-parse --verify origin/main` succeeds and `git ls-tree --name-only origin/main tools/oo-audit.mjs` is empty. Any other git error fails the step. A pull request can still edit `.github/workflows/ci.yml` itself. That is a GitHub `pull_request` limit: the workflow that runs is the one in the pull request. Reviewers must treat any change to `ci.yml` or `tools/oo-audit.mjs` as a gate change that needs explicit sign-off. The Pages workflow still runs the plain audit before a `main` deploy. The existing `tools/check-site.mjs` steps are unchanged.

A bracket whose text is a drawing method is counted (`ctx["fillRect"]` and `` ctx[`fillRect`] ``). `ctx[name]` is a known gap when `name` is a variable. `style.clipPath` and `setProperty("clip-path")` are counted when the property name is a string literal that installs a path, shadow, or gradient. `setProperty(name, ...)` is a known gap when `name` is not a string literal.

The committed baseline is `tools/oo-baseline.json` (v0.4.34):

| Signal | Count |
|---|---|
| Visual call sites | 4044 |
| Leaked window names | 166 |
| SF members assigned | 684 distinct (908 sites) |
| SF functions defined in more than one file | 44 |
| **OO-AUDIT remaining** | **5162** |

`OO-AUDIT` total = visual + leaked names + SF assignment sites + multi-file SF functions. The goal is `OO-AUDIT: 0 remaining`.

Rule: each conversion PR must lower the count and update the baseline (`node tools/oo-audit.mjs --write-baseline`). A count that rises fails the audit. A count that falls still passes, and the tool prints a hint to rewrite the baseline. `--write-baseline` will not record a rise.

Status: draft for `docs/OO-MIGRATION.md`. The inventory below is a read-only audit of the game. PR 1 adds this gate and leaves play and pictures unchanged.

- Source: `awsumbtech/shardfall` main @ `e519f5ec34f68ab5f90210541cc6da3546d20ab0` (v0.4.33, merge of PR #54, 2026-11-12 8:07 PM ET).
- Order (Brian, 11:56 PM ET, Nov 12, via Chief of Staff): convert all of Shardfall to objects with real image art before any feature, dialogue or wording work. "Not just art, all of it object oriented."
- Live atlas checked: `https://awsumbtech.github.io/shardfall/assets/atlas/manifest.json` has 96 entries (Kenmi hero, Emberhold tiles, Emberhold props, smoke, `ground.fx`).

## Rules this doc measures against

1. **One object per visual.** Every character, NPC, foe, prop, effect, flash, UI piece, screen and system is its own class or object, in its own file, with one job, one attach point (`attach(parent)`), and a clear lifecycle (`create → attach → update(dt) → draw(ctx) → destroy`).
2. **Real image art only.** An object draws a PNG sprite or sheet (PixelLab/PixelDoll, AI-generated, Kenmi, or sheets from Game Art & Motion). Banned as art: canvas `fillRect`/`arc`/paths/gradients/shadows, per-pixel painting (`putImageData`, palette grids), CSS gradients/box-shadow/clip-path/masks/conic shapes, tints, recolors, filter or composite tricks, and white flashes.
3. **Not art:** plain text (names, damage numbers, logs), layout boxes, and diagnostics (listed separately in A13).
4. **Process:** one PR per object group, PR Verifier PASS, then merge and deploy. Stop the line on BLOCK/HOLD/failing. One open item at a time.

## Method

- Grep (all of `js/`, `css/style.css`, `index.html`, `tools/`): `getContext, fillRect, strokeRect, arc(, beginPath, lineTo, bezierCurveTo, quadraticCurveTo, create(Linear|Radial)Gradient, shadowBlur, shadowColor, globalCompositeOperation, .filter =, globalAlpha, putImageData, createImageData, OffscreenCanvas, ellipse(, .fill(), .stroke(), createPattern`, plus CSS `gradient(, box-shadow, clip-path, text-shadow, filter:, conic, mask, ::before/::after`, plus `tint|recolor|flash`.
- Sprite ids were enumerated by loading `js/art/*.js` in Node: **126 code-drawn sprite ids** (`Art.ids()`), **51 code-drawn portraits** (`Art.portraitIds()`), **8 battle backdrops** (`Art.BG_IDS`).
- Function line ranges come from a brace matcher over each file; every `file:line` below is from grep output or a file opened during the audit.

## Headline findings

1. **Almost all art is code.** `js/art/` (core, actors, characters, props, buildings, world, scenes; ~6,900 lines) is a palette-grid pixel painter. It draws every character, foe, portrait, prop, building, ground tile and battle backdrop. `js/assets/registry.js:3-4` says it outright: "A key with no loaded image returns the code-drawn sprite from js/art."
2. **Real art today covers only:** the field hero paper-doll (`kenmi.hero.*`), Emberhold ground tiles (`kenmi.tile.*`), 75 Emberhold prop keys (`kenmi.prop.*`, smoke included), and the ChoiceBox panel and cursor (`assets/ui/`). Kenmi is wired for Emberhold only (`js/props/decorlayer.js:10-11`, `js/draw/terrain.js:973-975`). Every other island, all battles, all portraits and all NPCs are code art.
3. **There are two fallback layers under the code art.** Primitive canvas drawings (`SF.drawMaren`, `SF.drawProp`, `SF.drawWorldFoe`, and others) run when `Art` is missing. Both layers have to go.
4. **Flashes and tints still on main:** battle white hit box (`js/battle/stage.js:300-346`), field foe hurt bloom (`js/draw/actors.js:487-498`), baked hurt white-out (`js/art/actors.js:1377-1384`), CSS red hurt vignette (`css/style.css:125-132`), runtime cold-lamp recolor of a Kenmi sprite (`js/props/renderer.js:17-45`).
5. **Structure:** `tools/oo-audit.mjs` counts 684 distinct `SF.*` members, 908 assignment sites, 44 `SF` functions defined in more than one file, and 166 leaked window names. The hand pass had said 39 multi-file functions and ten files. The ten files are the ones that leak the most names (`js/dialogue.js`, `js/music.js`, `js/ui/choice-box.js`, `js/sfx.js`, `js/menu/field.js`, `js/title.js`, `js/feel.js`, `js/art/core.js`, `js/audio.js`, `js/ui.js`). The 166 is every top-level `var` and `function`, plus a top-level `window.Name =`, in every classic script, including `var SF` once per file. The 44 includes those 39 and the `SF[name] = wrapped` list in `js/input.js`.

## Counts

| Category | Rows |
|---|---|
| character | 3 |
| character (foe) | 14 |
| NPC | 19 |
| prop | 15 |
| prop (building) | 19 |
| terrain | 5 |
| effect | 19 |
| effect (alpha) | 1 |
| flash | 4 |
| flash/tint | 1 |
| sky-lighting | 9 |
| sky-lighting (backdrop) | 8 |
| UI | 23 |
| **Total artwork rows** | **140** |
| Diagnostic (separate, not artwork) | 7 |

Rows = one visual each. Sprite ids folded into a row are listed in that row.

## Part A: code-drawn visuals

### A0. The code-art engine (delete last, PR 41)

| Piece | file:line | Note |
|---|---|---|
| Palette + grid painter (`Art.spr/plot/fill/outline/mirror/raster`) | `js/art/core.js:1-423` | `Art.raster` writes pixels with `putImageData` (`js/art/core.js:186-209`) |
| Chibi person painter | `js/art/characters.js:14-635`; `js/art/actors.js:23-1024` | Shared by P and N rows |
| Foe painter (`eGrid`, `ePaint`, `eBake`) | `js/art/actors.js:1229-1552` | Shared by F rows |
| Prop painter helpers | `js/art/props.js:14-162`, `js/art/buildings.js:15-260` | Shared by D and B rows |
| Code bridge in the asset pipeline | `js/assets/registry.js:96` (`codeCanvas`), `js/assets/renderer.js:32-37` (`drawCode`), `js/art/props.js:965-984` (`Art.sprite` wrapper) | |
| Icons build from code art | `tools/make-icons.mjs:1-20` | |

### A1. Party characters

| # | Visual | What it looks like | file:line | Category | Owner object (file) | Real art needed | Existing coverage |
|---|---|---|---|---|---|---|---|
| P1 | Wayfarer (hero) | Chibi hero; field walk/idle, battle poses, 64px portrait | js/art/characters.js:637-641, 441-618, 741-768; js/art/actors.js:1026-1033, 832-1023; js/draw/actors.js:130-156 (blue-ellipse fallback) | character | `HeroSprite` (battle + field) in `js/actors/hero-sprite.js`; portrait via `Portrait` in `js/ui/portrait.js` | Battle sheet facing right: idle 2f, attack 2-4f, cast 2f, hurt 2f, victory 2f, ko 1f (cell ~36x38 native, battle x2-3); portrait 64x64 | Field: Kenmi paper-doll (`kenmi.hero.*`, live). Battle + portrait: none |
| P2 | Kestrel (party) | Teal-scarf ranger; field + battle + portrait | js/art/characters.js:642-646; js/art/actors.js:1034-1041; js/draw/actors.js:197-227 (fallback) | character | `CharacterSprite` in `js/actors/character-sprite.js` + `Portrait` | Field 4-dir idle 2f / walk 4f (24x34); battle clips as P1; portrait 64x64 | none |
| P3 | Tamsin (party) | Wrench mechanic; field + battle + portrait | js/art/characters.js:647-650; js/art/actors.js:1042-1049; js/draw/actors.js:267-288 (fallback) | character | `CharacterSprite` + `Portrait` | as P2 | none |

### A2. NPCs

| # | Visual | What it looks like | file:line | Category | Owner object (file) | Real art needed | Existing coverage |
|---|---|---|---|---|---|---|---|
| N1 | maren | Chibi townsperson; field idle/walk + dialogue portrait | js/art/characters.js:651-655; js/art/actors.js:1050-1057; js/draw/actors.js:163-195 (fallback) | NPC | `CharacterSprite("maren")` + `Portrait` | Field 4-dir idle 2f / walk 4f (~24x34); portrait 64x64 | none |
| N2 | hesk | Chibi townsperson; field idle/walk + dialogue portrait | js/art/characters.js:656-660; js/art/actors.js:1058-1065; js/draw/actors.js:290-308 (fallback) | NPC | `CharacterSprite("hesk")` + `Portrait` | Field 4-dir idle 2f / walk 4f (~24x34); portrait 64x64 | none |
| N3 | ilsa | Chibi townsperson; field idle/walk + dialogue portrait | js/art/characters.js:661-665; js/art/actors.js:1066-1074; js/draw/actors.js:310-332 (fallback) | NPC | `CharacterSprite("ilsa")` + `Portrait` | Field 4-dir idle 2f / walk 4f (~24x34); portrait 64x64 | none |
| N4 | cantor | Chibi townsperson; field idle/walk + dialogue portrait | js/art/characters.js:666-670; js/art/actors.js:1075-1083; js/draw/actors.js:229-265 (incl. orbiting motes) (fallback) | NPC | `CharacterSprite("cantor")` + `Portrait` | Field 4-dir idle 2f / walk 4f (~24x34); portrait 64x64 | none |
| N5 | villager_a | Chibi townsperson; field idle/walk + dialogue portrait | js/art/characters.js:671-674; js/art/actors.js:1084-1091; js/world.js:362-374, 401-405 (fallback) | NPC | `CharacterSprite("villager_a")` + `Portrait` | Field 4-dir idle 2f / walk 4f (~24x34); portrait 64x64 | none |
| N6 | villager_b | Chibi townsperson; field idle/walk + dialogue portrait | js/art/characters.js:675-678; js/art/actors.js:1092-1099; js/world.js:362-374, 401-405 (fallback) | NPC | `CharacterSprite("villager_b")` + `Portrait` | Field 4-dir idle 2f / walk 4f (~24x34); portrait 64x64 | none |
| N7 | brenna | Chibi townsperson; field idle/walk + dialogue portrait | js/art/characters.js:679-682; js/art/actors.js:1100-1107 | NPC | `CharacterSprite("brenna")` + `Portrait` | Field 4-dir idle 2f / walk 4f (~24x34); portrait 64x64 | none |
| N8 | osric | Chibi townsperson; field idle/walk + dialogue portrait | js/art/characters.js:683-686; js/art/actors.js:1108-1115 | NPC | `CharacterSprite("osric")` + `Portrait` | Field 4-dir idle 2f / walk 4f (~24x34); portrait 64x64 | none |
| N9 | nessa | Chibi townsperson; field idle/walk + dialogue portrait | js/art/characters.js:687-690; js/art/actors.js:1116-1123 | NPC | `CharacterSprite("nessa")` + `Portrait` | Field 4-dir idle 2f / walk 4f (~24x34); portrait 64x64 | none |
| N10 | sera | Chibi townsperson; field idle/walk + dialogue portrait | js/art/characters.js:691-695; js/art/actors.js:1124-1131 | NPC | `CharacterSprite("sera")` + `Portrait` | Field 4-dir idle 2f / walk 4f (~24x34); portrait 64x64 | none |
| N11 | pip | Chibi townsperson; field idle/walk + dialogue portrait | js/art/characters.js:696-699; js/art/actors.js:1132-1139 | NPC | `CharacterSprite("pip")` + `Portrait` | Field 4-dir idle 2f / walk 4f (~24x34); portrait 64x64 | none |
| N12 | lark | Chibi townsperson; field idle/walk + dialogue portrait | js/art/characters.js:700-704; js/art/actors.js:1140-1147 | NPC | `CharacterSprite("lark")` + `Portrait` | Field 4-dir idle 2f / walk 4f (~24x34); portrait 64x64 | none |
| N13 | jory | Chibi townsperson; field idle/walk + dialogue portrait | js/art/characters.js:705-709; js/art/actors.js:1148-1155 | NPC | `CharacterSprite("jory")` + `Portrait` | Field 4-dir idle 2f / walk 4f (~24x34); portrait 64x64 | none |
| N14 | brant | Chibi townsperson; field idle/walk + dialogue portrait | js/art/characters.js:710-714; js/art/actors.js:1156-1164 | NPC | `CharacterSprite("brant")` + `Portrait` | Field 4-dir idle 2f / walk 4f (~24x34); portrait 64x64 | none |
| N15 | dorrie | Chibi townsperson; field idle/walk + dialogue portrait | js/art/characters.js:715-718; js/art/actors.js:1165-1172 | NPC | `CharacterSprite("dorrie")` + `Portrait` | Field 4-dir idle 2f / walk 4f (~24x34); portrait 64x64 | none |
| N16 | maud | Chibi townsperson; field idle/walk + dialogue portrait | js/art/characters.js:719-722; js/art/actors.js:1173-1180 | NPC | `CharacterSprite("maud")` + `Portrait` | Field 4-dir idle 2f / walk 4f (~24x34); portrait 64x64 | none |
| N17 | ellis | Chibi townsperson; field idle/walk + dialogue portrait | js/art/characters.js:723-726; js/art/actors.js:1181-1188 | NPC | `CharacterSprite("ellis")` + `Portrait` | Field 4-dir idle 2f / walk 4f (~24x34); portrait 64x64 | none |
| N18 | sile | Chibi townsperson; field idle/walk + dialogue portrait | js/art/characters.js:727-731; js/art/actors.js:1189-1195 | NPC | `CharacterSprite("sile")` + `Portrait` | Field 4-dir idle 2f / walk 4f (~24x34); portrait 64x64 | none |
| N19 | pip_lark duo portrait | Two kids in one portrait | js/art/actors.js:1196-1223 | NPC | `Portrait("pip_lark")` | Portrait 64x64 | none |

### A3. Foes

| # | Visual | What it looks like | file:line | Category | Owner object (file) | Real art needed | Existing coverage |
|---|---|---|---|---|---|---|---|
| F1 | wisp | Foe: field token + battle poses + bestiary portrait | js/art/actors.js:1554-1595 (painter), 2196-2200 (register), 2224 (portrait); js/draw/actors.js:365-385 (field fallback) | character (foe) | `FoeSprite` in `js/actors/foe-sprite.js` (one instance per foe id, data-driven) | Field 4-dir idle/walk 2-4f; battle idle/attack/cast/hurt/death rows; portrait 64x64 | game-art `shardfall/foes/wisp` (procedural) |
| F2 | saltwisp | Foe: field token + battle poses + bestiary portrait | js/art/actors.js:1597-1627 (painter), 2201 (register), 2225 (portrait); js/world.js:410-424 (field fallback) | character (foe) | `FoeSprite` in `js/actors/foe-sprite.js` (one instance per foe id, data-driven) | Field 4-dir idle/walk 2-4f; battle idle/attack/cast/hurt/death rows; portrait 64x64 | none |
| F3 | brumekin | Foe: field token + battle poses + bestiary portrait | js/art/actors.js:1629-1664 (painter), 2202 (register), 2226 (portrait); js/draw/actors.js:387-433 (field fallback) | character (foe) | `FoeSprite` in `js/actors/foe-sprite.js` (one instance per foe id, data-driven) | Field 4-dir idle/walk 2-4f; battle idle/attack/cast/hurt/death rows; portrait 64x64 | game-art `foes/brumekin` (procedural) |
| F4 | ashling (field kind `ashmite`) | Foe: field token + battle poses + bestiary portrait | js/art/actors.js:1666-1707 (painter), 2203 (register), 2227 (portrait); js/grapple.js:362-374 (field fallback) | character (foe) | `FoeSprite` in `js/actors/foe-sprite.js` (one instance per foe id, data-driven) | Field 4-dir idle/walk 2-4f; battle idle/attack/cast/hurt/death rows; portrait 64x64 | game-art `foes/ashmite` (procedural; name differs) |
| F5 | choirling | Foe: field token + battle poses + bestiary portrait | js/art/actors.js:1709-1745 (painter), 2204 (register), 2228 (portrait); js/draw/actors.js:435-485 (field fallback) | character (foe) | `FoeSprite` in `js/actors/foe-sprite.js` (one instance per foe id, data-driven) | Field 4-dir idle/walk 2-4f; battle idle/attack/cast/hurt/death rows; portrait 64x64 | game-art `foes/choirling` (procedural) |
| F6 | choir_soldier | Foe: field token + battle poses + bestiary portrait | js/art/actors.js:1747-1782 (painter), 2205 (register), 2229 (portrait); js/world.js:410-424 (field fallback) | character (foe) | `FoeSprite` in `js/actors/foe-sprite.js` (one instance per foe id, data-driven) | Field 4-dir idle/walk 2-4f; battle idle/attack/cast/hurt/death rows; portrait 64x64 | none |
| F7 | hush_raider | Foe: field token + battle poses + bestiary portrait | js/art/actors.js:1784-1814 (painter), 2206 (register), 2230 (portrait); js/world.js:410-424 (field fallback) | character (foe) | `FoeSprite` in `js/actors/foe-sprite.js` (one instance per foe id, data-driven) | Field 4-dir idle/walk 2-4f; battle idle/attack/cast/hurt/death rows; portrait 64x64 | none |
| F8 | drowned | Foe: field token + battle poses + bestiary portrait | js/art/actors.js:1816-1855 (painter), 2207 (register), 2231 (portrait); js/world.js:410-424 (field fallback) | character (foe) | `FoeSprite` in `js/actors/foe-sprite.js` (one instance per foe id, data-driven) | Field 4-dir idle/walk 2-4f; battle idle/attack/cast/hurt/death rows; portrait 64x64 | none |
| F9 | cinderhound (field kind `cinderbrute`) | Foe: field token + battle poses + bestiary portrait | js/art/actors.js:1857-1893 (painter), 2208 (register), 2232 (portrait); js/grapple.js:400-421 (field fallback) | character (foe) | `FoeSprite` in `js/actors/foe-sprite.js` (one instance per foe id, data-driven) | Field 4-dir idle/walk 2-4f; battle idle/attack/cast/hurt/death rows; portrait 64x64 | game-art `foes/cinderbrute` (procedural; name differs) |
| F10 | stormgull | Foe: field token + battle poses + bestiary portrait | js/art/actors.js:1895-1924 (painter), 2209 (register), 2233 (portrait); js/world.js:410-424 (field fallback) | character (foe) | `FoeSprite` in `js/actors/foe-sprite.js` (one instance per foe id, data-driven) | Field 4-dir idle/walk 2-4f; battle idle/attack/cast/hurt/death rows; portrait 64x64 | none |
| F11 | sentinel | Foe: field token + battle poses + bestiary portrait | js/art/actors.js:1926-1956 (painter), 2210 (register), 2234 (portrait); js/world.js:410-424 (field fallback) | character (foe) | `FoeSprite` in `js/actors/foe-sprite.js` (one instance per foe id, data-driven) | Field 4-dir idle/walk 2-4f; battle idle/attack/cast/hurt/death rows; portrait 64x64 | none |
| F12 | sootwing | Foe: field token + battle poses + bestiary portrait | js/art/actors.js:2155-2173 (painter), 2211 (register), 2235 (portrait); js/grapple.js:376-398 (field fallback) | character (foe) | `FoeSprite` in `js/actors/foe-sprite.js` (one instance per foe id, data-driven) | Field 4-dir idle/walk 2-4f; battle idle/attack/cast/hurt/death rows; portrait 64x64 | game-art `foes/sootwing` (procedural) |
| F13 | cinder_maw (boss) | Foe: field token + battle poses + bestiary portrait | js/art/actors.js:1959-2076 (painter), 2213-2217 (register), 2236, 2238 (portrait); js/grapple.js:442-483 (field fallback) | character (foe) | `FoeSprite` in `js/actors/foe-sprite.js` (one instance per foe id, data-driven) | Field 4-dir idle/walk 2-4f; battle idle/attack/cast/hurt/death rows; portrait 64x64 | game-art `foes/cinder_maw` + `cinder_maw_core` (procedural) |
| F14 | tidewyrm (boss) | Foe: field token + battle poses + bestiary portrait | js/art/actors.js:2078-2153 (painter), 2218-2222 (register), 2237 (portrait); js/world.js:410-424 (field fallback) | character (foe) | `FoeSprite` in `js/actors/foe-sprite.js` (one instance per foe id, data-driven) | Field 4-dir idle/walk 2-4f; battle idle/attack/cast/hurt/death rows; portrait 64x64 | none |

### A4. Foe hurt, death and telegraph visuals

| # | Visual | What it looks like | file:line | Category | Owner object (file) | Real art needed | Existing coverage |
|---|---|---|---|---|---|---|---|
| X1 | Field foe hurt flash | White/rose bloom on a hit foe | js/draw/actors.js:487-498 (calls 367, 384, 398, 432, 447, 484); js/grapple.js:353, 373, 397, 420, 482 | flash | Removed; foe plays its `hurt` clip via `FoeSprite`; impact uses `HitSpark` in `js/fx/hit-spark.js` | Per-foe hurt clip (in F-rows) + hit spark sheet | game-art `fx/hit_spark` (procedural); PR49 blocked |
| X2 | Battle foe hurt white-out | Every foe pixel set to `C.lite` on odd hurt frame | js/art/actors.js:1377-1384, 1425 | flash | Removed; `FoeSprite` hurt clip | Real hurt frames per foe | none |
| X3 | KO dissolve | Checker holes punched in a KO'd foe | js/art/actors.js:1385-1395, 1424 | effect | Removed; foe `death` clip | Death clip 4f per foe | game-art foe sheets have death rows |
| X4 | Field death fade | Dying foe fades via globalAlpha | js/draw/entities.js:142 | effect | `FoeSprite` death clip | Death clip | partial (game-art) |
| X5 | Maw ash crumble | Boss turns to ash, alpha fade | js/draw/actors.js:511-543; js/draw/entities.js:125-140 | effect | `CinderMaw` death clip in `js/actors/cinder-maw.js` | Maw death/crumble clip 6f | game-art `cinder_maw` death row |
| X6 | Foe telegraphs | Red wind-up ring, violet dashed aim line, maw slam ring / charge line | js/draw/actors.js:389-397, 424-430, 437-446, 474-483; js/grapple.js:331-360, 423-440, 459-474 | effect | `FoeTell` in `js/fx/foe-tell.js` | Ring sheet (expanding 6f), aim-arrow segment, slam target mark | game-art `fx/intent_icons` (partial) |
| X7 | Foe HP pips / Maw HP bar | Thin bars over foes | js/draw/actors.js:500-509; js/grapple.js:476-481 | UI | `HpBar` in `js/ui/hp-bar.js` | Bar frame + fill 9-slice (small) | none |

### A5. Field and battle effects

| # | Visual | What it looks like | file:line | Category | Owner object (file) | Real art needed | Existing coverage |
|---|---|---|---|---|---|---|---|
| E1 | Glow blobs (8 cached radial gradients) | Soft cyan/gold/rose/violet glows, cloud/mist/dusk/shadow puffs | js/draw/field.js:31-55; used at js/draw/effects.js:7, actors.js:189, 239, 373, 404, 453, props.js:171, pickups.js:30, 43, 91, 118, 121, entities.js:218-219, sky.js:30, terrain.js:958, grapple.js:574, js/assets/crystal.js:84-85 | effect | `GlowSprite` in `js/fx/glow-sprite.js` | Glow sprites 16/32/64 px x4 colours (+ optional 4f pulse); cloud/mist puffs 128-256 px | none |
| E2 | Foot shadows | Dark ellipse under actors; banded rect shadow in battle | js/draw/actors.js:5-12; js/battle/stage.js:146-165; js/draw/terrain.js:958 | effect | `FootShadow` in `js/fx/foot-shadow.js` | Shadow sprites S/M/L (e.g. 16x6, 24x8, 48x14) | Kenmi `ground.fx` shadow tiles (in-house `art/fx-tiles.png`) cover tile shadows only |
| E3 | Hero foot ring | Cyan ellipse ring under the hero | js/draw/entities.js:205-211 | effect | `HeroMarker` in `js/fx/hero-marker.js` | Ring sprite 24x12 (2f pulse) | none |
| E4 | Hero swing arc | Cream arc stroke on attack | js/draw/entities.js:222-232 | effect | `SlashTrail` in `js/fx/slash-trail.js` (PR49) | Slash sheet 4-6f, 4 directions | game-art `fx/slash` (procedural); PR49 blocked on source sprites |
| E5 | Palm glow | Cyan+gold glow at the hero's hand | js/draw/entities.js:213-221 | effect | `PalmGlow` in `js/fx/palm-glow.js` | Glow 22px 4f | none |
| E6 | Dash afterimages + i-frame alpha | Translucent hero copies; 0.84 alpha while invulnerable | js/draw/entities.js:195, 198-200 | effect | `DashTrail` in `js/fx/dash-trail.js` | Afterimage frames (or dust puff sheet) for the dash | none |
| E7 | Hand crystal | Pixel shard + glow in the hero's hand | js/assets/crystal.js:81-118 | effect | `HandCrystal` (exists) draws a sprite instead of fillRect | Crystal 6x8 sprite 2f + glow | none |
| E8 | Field projectiles | Violet glow + white core | js/draw/effects.js:6-12 | effect | `Projectile` in `js/fx/projectile.js` | Projectile sheet 12-20 px 4f | none |
| E9 | Particles / bursts / ash | Coloured squares and circles | js/draw/effects.js:13-27; js/sim.js:195-236 (spawn API, 16 call sites) | effect | `ParticleSystem` in `js/fx/particles.js` emitting `Particle` sprites | Spark, ember, ash, dust, shard-bit sheets (4-6f each, 4-8 px) | game-art `fx/sparks`, `break_burst`, `streak_burst` (procedural) |
| E10 | Shock ring | Gold expanding ring | js/draw/effects.js:28-38 | effect | `ShockRing` in `js/fx/shock-ring.js` | Ring sheet 6f | game-art `fx/guard_ring` may fit (procedural) |
| E11 | Chimney smoke puffs (code) | Three grey circles rising from the cottage | js/draw/props.js:27-41 | effect | `ChimneySmoke` (PropRenderer.drawSmoke already uses Kenmi `smoke` on Emberhold) | Smoke sheet for non-Kenmi buildings | Kenmi `kenmi.prop.smoke` (Emberhold only) |
| E12 | Grapple FX | Pools, rope line, aim line, target ring | js/grapple.js:517-557 | effect | `GrappleRope` + `AshPool` in `js/fx/grapple-rope.js`, `js/fx/ash-pool.js` | Rope segment tile, hook head, pool sheet 4f, target reticle | none |
| E13 | Battle element bursts | Coloured squares/bars per element (gale/tide/shard/ember) | js/battle/stage.js:485-504 | effect | `ElementBurst` in `js/fx/element-burst.js` | 4 element sheets 6f | game-art `fx/sparks` element tints (procedural) |
| E14 | Battle motion overlay | Drifting cloud bits / embers over backdrops | js/art/scenes.js:674-714 | effect | `BackdropDrift` in `js/battle/backdrop-drift.js` | Cloud wisp + ember sprites 4f | none |
| E15 | Shard counter pulse | Text-shadow glow on #shards | css/style.css:1416-1419 | effect | `HandMeter` widget (CSS class swaps a sprite) | Glow frame sprite | none |

### A6. Flashes, tints and alpha tricks

| # | Visual | What it looks like | file:line | Category | Owner object (file) | Real art needed | Existing coverage |
|---|---|---|---|---|---|---|---|
| L1 | Battle hit flash | White box or plus-shape over the struck actor | js/battle/stage.js:300-346; js/battle/feel.js:25-28 | flash | `HitFlash` in `js/fx/hit-flash.js` (PR49) | HitFlash source sprites (replacement source, not derived white frames) | PR49 BLOCKED: waiting on replacement source sprites |
| L2 | Player hurt vignette | Red radial-gradient full-screen flash | css/style.css:125-132 | flash | `HurtVignette` in `js/ui/hurt-vignette.js` | Full-screen vignette PNG (9-slice or 4 corner pieces) | none |
| L3 | Cold lamp recolor | Kenmi lamp pixels desaturated to blue at runtime | js/props/renderer.js:17-45, 95-121, 135-138, 274; js/props/catalog.js:1063-1075 | flash/tint | Real `lamp_cold` frame drawn by `PropRenderer` | Unlit lamp frame matching Kenmi lamp | none (needs a real cold frame) |
| L4 | Canopy see-through | Tree canopy alpha 0.4 when hero is under it | js/props/renderer.js:47-60, 145; js/art/props.js:948-984 | effect (alpha) | `PropRenderer` (needs ruling: occlusion fade vs. banned alpha look) | None if ruled allowed; else canopy-cutaway frames | n/a |

### A7. Pickups and small world objects

| # | Visual | What it looks like | file:line | Category | Owner object (file) | Real art needed | Existing coverage |
|---|---|---|---|---|---|---|---|
| K1 | Shard / cog / bloom pickups | Glowing shard, brass cog, blossom; bob + glow | js/art/world.js:51-89; js/art/props.js:511-524, 856; js/draw/pickups.js:5-49 | prop | `Pickup` in `js/world/pickup.js` | Shard 16x16 idle 4f, cog 16x16, bloom 16x16 + glow | Kenmi `blossom` (Emberhold); shard/cog none |
| K2 | Great-lamp crystal | Crystal diamond on the lamp; flare, bloom, ring | js/draw/pickups.js:80-143 | prop | `LampCrystal` in `js/world/lamp-crystal.js` | Crystal cold/lit/flare clips 4f each + ring | none |
| K3 | Grapple hook post | Brown post + knob | js/grapple.js:504-515 | prop | `HookPost` in `js/world/hook-post.js` | Post sprite 16x24 (idle/live) | none |
| K4 | Cinder cracks decal | Glowing crack lines on the Maw arena | js/grapple.js:485-502 | terrain | `ArenaDecal` in `js/world/arena-decal.js` | Crack decal PNG | none |

### A8. Natural props (js/art/props.js)

| # | Visual | What it looks like | file:line | Category | Owner object (file) | Real art needed | Existing coverage |
|---|---|---|---|---|---|---|---|
| D1 | Living trees | tree_oak, tree, tree_oak_b, tree_broad(_b), tree_birch(_b), tree_pine(_b), tree_apple, tree_grove (11) | js/art/props.js:163-258, 827-840 | prop | `Prop` instances drawn by `PropRenderer` (exists) via `PropRegistry` rows | One sprite per id, per island biome (variants incl. burnt/charred/dead) | Kenmi oak/broad/birch/pine/apple (Emberhold only); tree_grove, tree alias none |
| D2 | Dead / bare trees | tree_dead, tree_dead_lean, tree_dead_snap, tree_bare (4) | js/art/props.js:259-361, 841-844 | prop | `Prop` instances drawn by `PropRenderer` (exists) via `PropRegistry` rows | One sprite per id, per island biome (variants incl. burnt/charred/dead) | none |
| D3 | Bushes | bush, bush_b, bush_dead (3) | js/art/props.js:362-389, 845-847 | prop | `Prop` instances drawn by `PropRenderer` (exists) via `PropRegistry` rows | One sprite per id, per island biome (variants incl. burnt/charred/dead) | Kenmi bush, bush_b (Emberhold); bush_dead none |
| D4 | Grass tufts | tuft, tuft_bloom, tuft_b, tuft_dead, tuft_dead_b (5) | js/art/props.js:390-451, 848-852 | prop | `Prop` instances drawn by `PropRenderer` (exists) via `PropRegistry` rows | One sprite per id, per island biome (variants incl. burnt/charred/dead) | Kenmi tuft, tuft_b, tuft_bloom (Emberhold); dead none |
| D5 | Flowers | flower, flower_gold, flower_tide, blossom (4) | js/art/props.js:452-524, 853-856 | prop | `Prop` instances drawn by `PropRenderer` (exists) via `PropRegistry` rows | One sprite per id, per island biome (variants incl. burnt/charred/dead) | Kenmi all 4 (Emberhold) |
| D6 | Rocks / basalt | rock, rock_b, basalt, basalt_b (4) | js/art/props.js:525-595, 860-863 | prop | `Prop` instances drawn by `PropRenderer` (exists) via `PropRegistry` rows | One sprite per id, per island biome (variants incl. burnt/charred/dead) | Kenmi rock, rock_b (Emberhold); basalt none |
| D7 | Logs / stumps | log, log_char, stump, stump_char (4) | js/art/props.js:596-648, 864-867 | prop | `Prop` instances drawn by `PropRenderer` (exists) via `PropRegistry` rows | One sprite per id, per island biome (variants incl. burnt/charred/dead) | Kenmi log, stump (Emberhold); charred none |
| D8 | Crate / barrel | crate, barrel (2) | js/art/props.js:649-670, 803-826, 859, 868 | prop | `Prop` instances drawn by `PropRenderer` (exists) via `PropRegistry` rows | One sprite per id, per island biome (variants incl. burnt/charred/dead) | none |
| D9 | Fences | fence, fence_burnt, fence_up, fence_burnt_up (4) | js/art/props.js:671-730, 869-872 | prop | `Prop` instances drawn by `PropRenderer` (exists) via `PropRegistry` rows | One sprite per id, per island biome (variants incl. burnt/charred/dead) | Kenmi fence via `FenceStrip` (Emberhold); burnt none |
| D10 | Signs / stones | signpost, sign, stones (3) | js/art/props.js:731-750, 873; js/art/world.js:90-112 | prop | `Prop` instances drawn by `PropRenderer` (exists) via `PropRegistry` rows | One sprite per id, per island biome (variants incl. burnt/charred/dead) | none |
| D11 | Chests | chest, chest_open (2; registered twice) | js/art/props.js:751-802, 857-858; js/art/world.js:25-50; js/world.js:509-577 (fallback + lid anim) | prop | `Prop` instances drawn by `PropRenderer` (exists) via `PropRegistry` rows | One sprite per id, per island biome (variants incl. burnt/charred/dead) | Kenmi chest, chest_open (Emberhold) |
| D12 | Primitive prop fallbacks | Circles/rects for tree, rock, flower, cottage, airship sail (gradient), hut, ruins, bench, stones | js/draw/props.js:46-186; js/world.js:426-507, 579-629; js/draw/entities.js:50-68 | prop | Delete once D/B rows have sprites | n/a | n/a |

### A9. Buildings and structures (js/art/buildings.js)

| # | Visual | What it looks like | file:line | Category | Owner object (file) | Real art needed | Existing coverage |
|---|---|---|---|---|---|---|---|
| B1 | Path lamp lit/cold | lamp_lit, lamp_cold | js/art/buildings.js:447-472, 985-986 | prop (building) | `Prop` / `Building` rows in `PropRegistry`, drawn by `PropRenderer` | Building sprite(s) 1:1 field scale; lit/unlit or open/closed frames where the code has them | Kenmi lamp_lit/lamp_cold (cold via recolor L3) |
| B2 | Great lamp | great_lamp, great_lamp_lit | js/art/buildings.js:371-446, 987-988 | prop (building) | `Prop` / `Building` rows in `PropRegistry`, drawn by `PropRenderer` | Building sprite(s) 1:1 field scale; lit/unlit or open/closed frames where the code has them | none |
| B3 | Cottage / workshop | cottage, workshop | js/art/buildings.js:101-362, 989-990 | prop (building) | `Prop` / `Building` rows in `PropRegistry`, drawn by `PropRenderer` | Building sprite(s) 1:1 field scale; lit/unlit or open/closed frames where the code has them | Kenmi cottage (Emberhold); workshop none |
| B4 | Hut | hut | js/art/buildings.js:473-506, 991 | prop (building) | `Prop` / `Building` rows in `PropRegistry`, drawn by `PropRenderer` | Building sprite(s) 1:1 field scale; lit/unlit or open/closed frames where the code has them | none |
| B5 | Skiff | skiff | js/art/buildings.js:507-562, 992 | prop (building) | `Prop` / `Building` rows in `PropRegistry`, drawn by `PropRenderer` | Building sprite(s) 1:1 field scale; lit/unlit or open/closed frames where the code has them | none |
| B6 | Stilt house | stilt | js/art/buildings.js:563-591, 993 | prop (building) | `Prop` / `Building` rows in `PropRegistry`, drawn by `PropRenderer` | Building sprite(s) 1:1 field scale; lit/unlit or open/closed frames where the code has them | none |
| B7 | Market stall | stall | js/art/buildings.js:592-632, 994 | prop (building) | `Prop` / `Building` rows in `PropRegistry`, drawn by `PropRenderer` | Building sprite(s) 1:1 field scale; lit/unlit or open/closed frames where the code has them | none |
| B8 | Raft | raft | js/art/buildings.js:633-659, 995 | prop (building) | `Prop` / `Building` rows in `PropRegistry`, drawn by `PropRenderer` | Building sprite(s) 1:1 field scale; lit/unlit or open/closed frames where the code has them | none |
| B9 | Wreck hull | wreckhull | js/art/buildings.js:660-679, 996 | prop (building) | `Prop` / `Building` rows in `PropRegistry`, drawn by `PropRenderer` | Building sprite(s) 1:1 field scale; lit/unlit or open/closed frames where the code has them | none |
| B10 | Gate arch | gatearch | js/art/buildings.js:680-701, 997 | prop (building) | `Prop` / `Building` rows in `PropRegistry`, drawn by `PropRenderer` | Building sprite(s) 1:1 field scale; lit/unlit or open/closed frames where the code has them | none |
| B11 | Ruin | ruin | js/art/buildings.js:702-737, 998 | prop (building) | `Prop` / `Building` rows in `PropRegistry`, drawn by `PropRenderer` | Building sprite(s) 1:1 field scale; lit/unlit or open/closed frames where the code has them | none |
| B12 | Lair | lair | js/art/buildings.js:738-773, 999 | prop (building) | `Prop` / `Building` rows in `PropRegistry`, drawn by `PropRenderer` | Building sprite(s) 1:1 field scale; lit/unlit or open/closed frames where the code has them | none |
| B13 | Vault door | vault_door | js/art/buildings.js:774-807, 1000 | prop (building) | `Prop` / `Building` rows in `PropRegistry`, drawn by `PropRenderer` | Building sprite(s) 1:1 field scale; lit/unlit or open/closed frames where the code has them | none |
| B14 | Bench | bench | js/art/buildings.js:808-822, 1001 | prop (building) | `Prop` / `Building` rows in `PropRegistry`, drawn by `PropRenderer` | Building sprite(s) 1:1 field scale; lit/unlit or open/closed frames where the code has them | none |
| B15 | Fallen plank | plank | js/art/buildings.js:823-838, 1002 | prop (building) | `Prop` / `Building` rows in `PropRegistry`, drawn by `PropRenderer` | Building sprite(s) 1:1 field scale; lit/unlit or open/closed frames where the code has them | none |
| B16 | Inn lantern | inn | js/art/buildings.js:839-872, 1003 | prop (building) | `Prop` / `Building` rows in `PropRegistry`, drawn by `PropRenderer` | Building sprite(s) 1:1 field scale; lit/unlit or open/closed frames where the code has them | none |
| B17 | Quay bell | bell | js/art/buildings.js:873-889, 1006 | prop (building) | `Prop` / `Building` rows in `PropRegistry`, drawn by `PropRenderer` | Building sprite(s) 1:1 field scale; lit/unlit or open/closed frames where the code has them | none |
| B18 | Rope bridge | Art.ropeBridge | js/art/buildings.js:890-931, 966-973; js/draw/terrain.js:1043-1057 | prop (building) | `Prop` / `Building` rows in `PropRegistry`, drawn by `PropRenderer` | Building sprite(s) 1:1 field scale; lit/unlit or open/closed frames where the code has them | Kenmi `tile.bridge` (Emberhold) |
| B19 | Dock deck | Art.dockDeck | js/art/buildings.js:933-963, 976-983 | prop (building) | `Prop` / `Building` rows in `PropRegistry`, drawn by `PropRenderer` | Building sprite(s) 1:1 field scale; lit/unlit or open/closed frames where the code has them | none |

### A10. Terrain

| # | Visual | What it looks like | file:line | Category | Owner object (file) | Real art needed | Existing coverage |
|---|---|---|---|---|---|---|---|
| T1 | Code ground tiles (24) | tile_grass/_light/_dark, cliff, shore(_light), gold(_light), ash(_light/_rock/_ember), stone(_light), vault, path, cobble, plank, dock, pier, sand, hold, wood | js/art/world.js:113-211 (registrations 189-211), 213-228 | terrain | `TileSet` per biome loaded by `TileMapRenderer` (exists) | Tilesets per biome: Cinderveil ash, Saltmere shore/dock, Highspire stone, Gullrock, Drift, towns (16px autotile sets) | Kenmi tiles cover Emberhold only |
| T2 | Procedural island ground | Per-pixel painted grass, rock faces, paths, details, blob shadows (non-Emberhold islands) | js/draw/terrain.js:13-190, 236-262, 264-466, 468-675, 677-900, 902-969, 983-1041 | terrain | Delete; every island becomes a `TmjMap` drawn by `TileMapRenderer` | Tiled maps + tilesets per island (see T1) | Emberhold covered (TMJ + Kenmi) |
| T3 | Terrace fronts | Cliff face strips under terraces | js/draw/terrain.js:192-228 | terrain | Cliff tiles in the island `TmjMap` | Cliff-face autotiles per biome | Emberhold covered |
| T4 | Drift group dress | Specks and blob groups that shape a drift island | js/draw/field.js:57-128 | terrain | `TmjMap` layers | Drift tileset | none |

### A11. Sky, lighting and backdrops

| # | Visual | What it looks like | file:line | Category | Owner object (file) | Real art needed | Existing coverage |
|---|---|---|---|---|---|---|---|
| S1 | Field sky + light rays | Vertical gradient per island/lit state; faint ray strokes | js/draw/sky.js:5-49 | sky-lighting | `SkyBackdrop` in `js/world/sky-backdrop.js` | Sky plate per island (dusk + lit), 2 x 7 islands, ~640x360 tileable; ray overlay | none |
| S2 | Cloud sheet | Drifting soft clouds (blob stamps) | js/draw/sky.js:51-185 | sky-lighting | `CloudLayer` in `js/world/cloud-layer.js` | Cloud layer PNG (tileable, parallax x2) | none |
| S3 | Hush lip | Misty cloud-sea edge under islands (shadowBlur + destination-out) | js/draw/sky.js:187-268 | sky-lighting | `HushEdge` in `js/world/hush-edge.js` | Cloud-edge autotile strip or per-island edge PNG | none |
| S4 | Vignette | Radial-gradient darkening | js/draw/effects.js:76-94 | sky-lighting | `Vignette` in `js/fx/vignette.js` | Vignette overlay PNG | none |
| S5 | Scene wash / fade veil | Full-screen colour fill fade | js/draw/effects.js:96-105 | sky-lighting | `ScreenFade` in `js/fx/screen-fade.js` (needs ruling: plain fade vs. art) | Optional transition sheet | n/a |
| S6 | Battle backdrop `emberhold_meadow` | Layered pixel plate: sky bands, islets, hush, midground, floor | js/art/scenes.js:452-463 (shared helpers 13-445, plate 661-670, Art.battleBg 716-734, extendFloor 738-761) | sky-lighting (backdrop) | `BattleBackdrop("emberhold_meadow")` in `js/battle/battle-backdrop.js` | Layered backdrop PNGs (sky, far, mid, floor) ~480x270 | none |
| S7 | Battle backdrop `emberhold_scar` | Layered pixel plate: sky bands, islets, hush, midground, floor | js/art/scenes.js:465-485 (shared helpers 13-445, plate 661-670, Art.battleBg 716-734, extendFloor 738-761) | sky-lighting (backdrop) | `BattleBackdrop("emberhold_scar")` in `js/battle/battle-backdrop.js` | Layered backdrop PNGs (sky, far, mid, floor) ~480x270 | none |
| S8 | Battle backdrop `cinderveil_ash` | Layered pixel plate: sky bands, islets, hush, midground, floor | js/art/scenes.js:487-510 (shared helpers 13-445, plate 661-670, Art.battleBg 716-734, extendFloor 738-761) | sky-lighting (backdrop) | `BattleBackdrop("cinderveil_ash")` in `js/battle/battle-backdrop.js` | Layered backdrop PNGs (sky, far, mid, floor) ~480x270 | none |
| S9 | Battle backdrop `ember_vault` | Layered pixel plate: sky bands, islets, hush, midground, floor | js/art/scenes.js:512-524 (shared helpers 13-445, plate 661-670, Art.battleBg 716-734, extendFloor 738-761) | sky-lighting (backdrop) | `BattleBackdrop("ember_vault")` in `js/battle/battle-backdrop.js` | Layered backdrop PNGs (sky, far, mid, floor) ~480x270 | none |
| S10 | Battle backdrop `saltmere_shore` | Layered pixel plate: sky bands, islets, hush, midground, floor | js/art/scenes.js:526-567 (shared helpers 13-445, plate 661-670, Art.battleBg 716-734, extendFloor 738-761) | sky-lighting (backdrop) | `BattleBackdrop("saltmere_shore")` in `js/battle/battle-backdrop.js` | Layered backdrop PNGs (sky, far, mid, floor) ~480x270 | none |
| S11 | Battle backdrop `saltmere_wreck` | Layered pixel plate: sky bands, islets, hush, midground, floor | js/art/scenes.js:569-596 (shared helpers 13-445, plate 661-670, Art.battleBg 716-734, extendFloor 738-761) | sky-lighting (backdrop) | `BattleBackdrop("saltmere_wreck")` in `js/battle/battle-backdrop.js` | Layered backdrop PNGs (sky, far, mid, floor) ~480x270 | none |
| S12 | Battle backdrop `highspire_road` | Layered pixel plate: sky bands, islets, hush, midground, floor | js/art/scenes.js:598-612 (shared helpers 13-445, plate 661-670, Art.battleBg 716-734, extendFloor 738-761) | sky-lighting (backdrop) | `BattleBackdrop("highspire_road")` in `js/battle/battle-backdrop.js` | Layered backdrop PNGs (sky, far, mid, floor) ~480x270 | none |
| S13 | Battle backdrop `hush_deck` | Layered pixel plate: sky bands, islets, hush, midground, floor | js/art/scenes.js:614-644 (shared helpers 13-445, plate 661-670, Art.battleBg 716-734, extendFloor 738-761) | sky-lighting (backdrop) | `BattleBackdrop("hush_deck")` in `js/battle/battle-backdrop.js` | Layered backdrop PNGs (sky, far, mid, floor) ~480x270 | none |
| S14 | Battle backdrop fallback | Gradient + rect stripes | js/battle/gfx.js:62-91 | sky-lighting | Delete after S6-S13 | n/a | n/a |
| S15 | Title scene | Gradient sky, ray strokes, ellipse islands, glow motes | js/title.js:8-175 | sky-lighting | `TitleBackdrop` in `js/ui/title-backdrop.js` | Title key art: sky, 3 floating islands, motes sheet | none |
| S16 | Voyage scene | Gradient sea/sky, rect boat, cloud blobs | js/grapple.js:559-602 | sky-lighting | `VoyageScene` in `js/world/voyage-scene.js` | Sea/sky plate, skiff sailing sheet 4f, clouds | none |
| S17 | Title / landscape overlays (CSS) | Gradient overlays on the title screen | css/style.css:799-804, 1158 | sky-lighting | `TitleBackdrop` | Part of S15 | none |

### A12. UI art

| # | Visual | What it looks like | file:line | Category | Owner object (file) | Real art needed | Existing coverage |
|---|---|---|---|---|---|---|---|
| U1 | DOM window chrome | Blue gradient panels with inset borders (dialogue, toast, cards, corner buttons, skip, banner, map frame, endcard) | css/style.css:147-164, 283-297, 350-362, 364-373, 1434-1443 | UI | `UiSkin` in `js/ui/ui-skin.js` (9-slice border-image, like ChoiceBox) | Window 9-slice 48x48 (insets 16) | `assets/ui/choicebox-panel.png` is in use as ChoiceBox test art; the asset ledger still says not approved to ship (a ledger update is a separate, frozen follow-up); reuse as the window skin is PENDING Brian |
| U2 | Canvas window skin | Code-painted 24x24 9-slice used by battle HUD | js/art/scenes.js:764-827; js/battle/gfx.js:36-60 | UI | `UiSkin.drawWindow()` (same PNG as U1) | Same as U1 | as U1 |
| U3 | DOM buttons | Gradient buttons, pressed/selected states | css/style.css:443-458, 497-504, 633-669, 752-763, 843-858, 1125-1139, 1539-1552, 1562-1567 | UI | `UiButton` skin classes in `js/ui/ui-skin.js` | Button 9-slice: normal/pressed/selected/disabled | none |
| U4 | Battle canvas buttons + lists | Command buttons, list panels, chevrons, scroll cues | js/battle/gfx.js:308-331; js/battle/hud.js:328-352, 361-392, 394-487 | UI | `BattleMenu` in `js/battle/battle-menu.js` using `UiSkin` | Button 9-slice (U3), chevron 16x16 | none |
| U5 | Battle HUD panels | Turn strip portrait frames, party cards, log, aim line, result card, stat bars | js/battle/hud.js:156-196, 198-216, 218-274, 284-301, 312-326, 545-619; js/battle/gfx.js:291-296 | UI | `BattleHud` widgets: `TurnStrip`, `PartyCard`, `BattleLog`, `ResultCard` | Portrait frame 9-slice, HP/SP bar frame + fill | none |
| U6 | Foe name plate + target bracket | Dark plate with name; gold stroke rect around tappable foe | js/battle/stage.js:167-204, 429-433, 461-465 | UI | `TargetCursor` in `js/battle/target-cursor.js` | Name plate 9-slice; target bracket corners 4f pulse | `assets/ui/choice-cursor.png` style could extend |
| U7 | Virtual stick + knob | Translucent circle with inset rings; pale knob | css/style.css:403-426 | UI | `Stick` in `js/input/stick.js` | Stick base 128x128, knob 56x56 (idle/pressed) | none |
| U8 | Action buttons + cooldown rings | Attack/dash/grapple buttons; conic-gradient cooldown wipe; ready pulse glow | css/style.css:485-494, 497-504, 507-516, 519, 526-533 | UI | `ActionButton` in `js/input/action-button.js` | Button faces 4 kinds (idle/pressed/ready), cooldown sheet 12f | none |
| U9 | Inline SVG button icons | Speaker, pause, back, talk, dash arrow, grapple hook | index.html:43, 46, 71, 75, 79, 83 | UI | `Icon` sprites via `UiSkin` | 6 icons 32x32 (2 states for mute) | none |
| U10 | HP bar | Pink-to-gold gradient fill | css/style.css:187-193 | UI | `HpBar` (shared with X7) | Bar frame + fill | none |
| U11 | Slider thumb | Radial-gradient gold knob | css/style.css:951-960 | UI | `UiSkin` | Thumb 26x26 | none |
| U12 | Title mark + wordmark | SVG diamond with drop-shadow; h1 text-shadow logo | index.html:179; css/style.css:817, 819-831 | UI | `TitleLogo` in `js/ui/title-logo.js` | Logo PNG (wordmark + crystal) | none |
| U13 | Typing caret | CSS ::after caret on typing line | css/style.css:604-613 | UI | `DialogueBox` caret sprite | Caret 8x8 2f | none |
| U14 | Dialogue portrait frame + legacy faces | Rounded clip + gold stroke; 64px face/badge painters | js/dialogue.js:526-534, 575-909; css/style.css:557-567 | UI | `Portrait` in `js/ui/portrait.js` | Portrait frame 72x72 | none |
| U15 | Icon portraits (14) | stones, lamp, ship, scar, core, sign, crate, ash, blossom, bridge, vault, bell, hush, unknown badges | js/art/actors.js:2240-2348 | UI | `Portrait` (icon kind) | 14 badge portraits 32x32 (shown 64) | none |
| U16 | Loot / item icons (10) | pouch, coin, blade, armor, charm, bomb, gem, flask, bottle, vial | js/world.js:1329-1401 | UI | `ItemIcon` in `js/ui/item-icon.js` | 10 icons 16x16 | none |
| U17 | Keeper + field-menu faces | Code portraits blitted into shop/menu canvases | js/world.js:1142-1187; js/menu/field.js:73-89; css/style.css:771-780, 1115-1123 | UI | `Portrait` reused | (portraits from P/N rows) | none |
| U18 | Sail chart | Island cards (pattern blobs), chart sky gradient, route SVG, isle tiles | js/world.js:1189-1249; js/art/world.js:230-305; css/style.css:691-749; index.html:107 | UI | `SailChart` in `js/ui/sail-chart.js` | Chart background, island card art x7, route dash tile, 'here' marker | none |
| U19 | Minimap | Shapes for land, pickups, foes, lamp, goal, heart, hero arrow | js/draw/minimap.js:5-142 | UI | `Minimap` in `js/ui/minimap.js` | Baked map image per island + icon set 8x8 (hero, foe, chest, lamp, goal, heart) | none |
| U20 | Quest marks / edge arrow / bobber / interact ring | Diamonds, arrows, bobbing marker, talk ring | js/draw/guides.js:104-148, 159-198; js/draw/pickups.js:145-158; js/draw/effects.js:52-73 | UI | `GuideMarker` in `js/ui/guide-marker.js` | Quest diamond 4f, edge arrow, bobber 4f, interact ring 2f | none |
| U21 | Battle sprite / portrait placeholders | Grey boxes with eyes when no sprite | js/battle/gfx.js:235-289 | UI | Delete after P/F rows | n/a | n/a |
| U22 | PWA icons | Home-screen icons rasterized from code hero/shard | tools/make-icons.mjs; icons/*.png, icons/icon.svg | UI | Static asset (no runtime object) | icon 192/512/maskable 512/apple 180 + SVG | none |

### A13. Diagnostics (not artwork, listed separately)

| Diagnostic / dev visual | file:line | Plan |
|---|---|---|
| Art gallery (?gallery) | js/art/gallery.js:1-181; css/style.css:1312-1324 | Remove with the code-art engine, or keep as a sheet viewer over real PNGs |
| Missing-sprite placeholder | js/art/core.js:241-252 | Keep as a dev-only magenta placeholder |
| Debug camera / overview (no drawing) | js/sim.js:1454-1456, 1476; js/main.js:148, 162 | Not art |
| Prop contact page | tools/prop-contact.html | Dev tool |
| QA renderers that rasterize code art | tools/character-sheet.mjs, tools/battle-sheet.mjs, tools/field-qa.mjs, tools/sky-mask.mjs, tools/smoke.mjs | Retarget to PNGs as rows convert |
| Props hand-off prototypes | tools/props-handoff/kenmi-dense.js, tools/props-handoff/registry-prototype.js | Dev tool |
| Meta tiles | art/meta-tiles.png (96x16) | Collision meta, confirm never drawn |

## Part B: non-object code paths

### B0. What is already object-shaped (keep; tighten)

| Object | File | Notes |
|---|---|---|
| `ChoiceBox` | `js/ui/choice-box.js` | Real art (9-slice PNG). Leaks 18 top-level names (`SPEC`, `cssText`, `openBox`, ...) because the file has no IIFE. |
| `AssetLoader`, `AssetManifest`, `AssetRegistry`, `SpriteSheet`, `Animator`, `SpriteRenderer`, `LayeredSprite`, `HandCrystal` | `js/assets/*.js` | One job each. `AssetRegistry.codeCanvas` (`js/assets/registry.js:96`) and `SpriteRenderer.drawCode` (`js/assets/renderer.js:32`) are the code-art bridge to delete. |
| `PropRegistry`, `PropRenderer`, `FenceStrip`, `PropGrid`, `RectFootprint` | `js/props/*.js` | Good shape. `recolorCold` is a banned tint (L3). |
| `TmjMap`, `TileMapRenderer` | `js/tiles/tmjmap.js`, `js/tiles/renderer.js` | Good shape; extend to every island. |
| `BattleEvents`, `BattleFormula`, `BattleState`, `BattleTimeline`, `EnemyAI`, `BattleRewards`, `BattleFeel`, `ActionResolver`, `BattleRenderer` | `js/battle/*.js` | Singleton object literals, one job each. Acceptable. |
| `Music`, `Haptics`, `Sfx` | `js/music.js`, `js/haptics.js`, `js/sfx.js` | Objects exist, but files leak 20 / 2 / 12 top-level names. |

### B1. Loose globals and patch chains

| Problem | file:line | Proposed owner (file) | One job | Lifecycle |
|---|---|---|---|---|
| ~684 `SF.*` members on one global bag | every file; worst: `js/cinder.js` (83), `js/world.js` (78), `js/sim.js` (60), `js/menu/field.js` (49), `js/ui.js` (48), `js/draw/terrain.js` (47), `js/data.js` (41) | `Game` composition root in `js/core/game.js`; `window.SF` stays a read-only facade for QA tools (`js/draw/deps.js:5-6` says the tools need it) | Build and hold the object graph | created once in `boot`, never destroyed |
| `SF.state` is a plain bag built in one 115-line function, then patched by battle | `js/sim.js:52-166`; `js/battle/battle.js:537-546` | `GameState` in `js/core/game-state.js` | Hold save-able state; no behaviour | `GameState.fresh()` / `fromSave()` / `toSave()` |
| `SF.update` patched 3 times | `js/sim.js:1512-1586`, `js/world.js:929-938`, `js/battle/battle.js:587-606` | `GameLoop` in `js/core/game-loop.js` with an ordered `systems[]` list | Tick systems in order | `start()`, `stop()` |
| `SF.syncUI` patched 3 times | `js/ui.js:377-599`, `js/world.js:1490-1499`, `js/menu/field.js:434-442` | each widget owns `sync(state)`; `UiRoot` in `js/ui/ui-root.js` calls them | Fan out one sync | per frame |
| `SF.bindUI` 2x, `SF.pauseGame` 2x | `js/ui.js:131-325`, `js/world.js:1482-1485`; `js/ui.js:56-65`, `js/menu/field.js:419-432` | each widget binds its own DOM in `attach()` | | |
| Interaction chain: `actionFor`, `tryInteract`, `coachLine` (3x), `objectivePoint`, `secretVisible`, `questText` | `js/sim.js:827-851, 900-916, 940-996, 883-898, 277-284`; `js/world.js:808-867, 1011-1017`; `js/cinder.js:515-546`; `js/data.js:250-258` | `Interactor` in `js/world/interactor.js`; `Objective` in `js/quest/objective.js`; quest providers registered per island | Pick the nearest action and run it / answer the current goal | attached per island mount |
| Island chain: `mountIsland` (3x), `lampIsLit`, `loadEnemies`, `snapshotEnemies`, `startVoyage`, `updateVoyage`, `npcHidden` | `js/cinder.js:113-129, 145-190, 245-286`; `js/props/decorlayer.js:128`; `js/tiles/adopt.js:509`; `js/world.js:869-977`; `js/content/maps/towns.js:272-280` | `IslandRegistry` in `js/world/island-registry.js` + `Island` objects; `Voyage` in `js/world/voyage.js` | Mount/unmount one island's objects | `mount(id)` / `unmount()` |
| Walk test defined 6x, zone test 4x | `SF.walkable`: `js/data.js:212`, `js/content/maps/v2layout.js:92, 825`, `js/content/maps/towns.js:293`, `js/tiles/adopt.js:87`, `js/vaultgate.js:50`; `SF.zoneAt`: `js/data.js:227`, `js/content/maps/v2layout.js:103`, `js/tiles/adopt.js:96`, `js/vaultgate.js:55` | `Walkability` in `js/world/walkability.js` composed of layers (`TileLayer`, `TownWalls`, `VaultGate`, `ShapeLayer`) | Answer "can a foot stand here" | rebuilt on island mount |
| Battle patches field functions | `js/battle/battle.js:535-651` (`fresh`, `makeEnemies`, `updateEnemy`, `damageEnemy`, `killEnemy`, `startSwing`, `applySwing`, `dashSing`, `update`, `updatePlayer`, `consumeAttack`, `buyUpgrade`) | `BattleBridge` in `js/battle/battle-bridge.js` subscribing to field events | Start a battle from field contact | installed once |
| `SF.drawActor` 2x, `SF.drawPropArt` 2x, `SF.drawChest` 2x, `SF.draw` 2x | `js/draw/actors.js:100`, `js/world.js:377-407`; `js/draw/props.js:5`, `js/props/decorlayer.js:112-116`; `js/world.js:527`, `js/props/decorlayer.js:119-123`; `js/draw.js:5`, `js/battle/draw.js:32-46` | visual objects (Part A owners); `SceneRouter` in `js/core/scene-router.js` picks field vs battle | | |
| Leaked top-level names (classic scripts, no IIFE) | `js/dialogue.js` (28), `js/music.js` (20), `js/ui/choice-box.js` (18), `js/sfx.js` (12), `js/menu/field.js` (12), `js/title.js` (8), `js/feel.js` (8), `js/art/core.js` (6), `js/audio.js` (4), `js/ui.js` (4) | wrap each file; export one object | | |

### B2. God-files and their split

| God-file (LOC) | Section (file:line) | Proposed owner object (file) | One job | Lifecycle |
|---|---|---|---|---|
| `js/sim.js` (1657) | 6-50 | `FoeSpawner` (`js/world/foe-spawner.js`) | Build field foes from spawns | per island mount |
| | 52-166 | `GameState` (`js/core/game-state.js`) | Fresh state | once / on new game |
| | 168-180, 188-193 | `NoticeQueue` (`js/ui/notice-queue.js`) | Toasts, banners, hints | update(dt) |
| | 182-186, 1432-1487 | `Camera` (`js/world/camera.js`) | Follow, shake, bounds | update(dt) |
| | 195-236, 1282-1305 | `ParticleSystem` (`js/fx/particles.js`) | Spawn/age particles, floaters, ghosts | update(dt), draw |
| | 238-258 | `Progression` (`js/rules/progression.js`) | XP to level | on XP gain |
| | 260-284, 1047-1093 | `PickupSet` + `Pickup` (`js/world/pickup.js`) | Collect pickups | per island |
| | 286-371, 402-433 | `FieldCombat` (`js/hero/field-combat.js`) | Swing, damage, hurt | update(dt) |
| | 373-400 | `FallRescue` (`js/hero/fall-rescue.js`) | Rescue the hero from the sky | on fall |
| | 435-710 | `Dash` (`js/hero/dash.js`) | Dash rules, landing, holds | update(dt) |
| | 765-851, 918-996 | `Interactor` (`js/world/interactor.js`) | Nearest action + run it | update(dt) |
| | 855-916 | `Objective` (`js/quest/objective.js`) | Current goal + coach line | on flag change |
| | 998-1045 | `Cutscene` (`js/scene/cutscene.js`) | Play/skip a cutscene | start/finish |
| | 1095-1251 | `FoeBrain` (`js/actors/foe-brain.js`) per `FieldFoe` | Steer one foe | update(dt) |
| | 1307-1430 | `Hero` (`js/hero/hero.js`) | Move the hero | update(dt) |
| | 1253-1280, 1489-1586 | `GameLoop` systems | Tick order | start/stop |
| | 1588-1657 | `WorldAudit` (`tools/` or `js/dev/world-audit.js`) | QA audit | dev only |
| `js/world.js` (1501) | 16-45 | `Destinations` (`js/world/destinations.js`) | Island unlocks | static |
| | 47-125, 263-269, 1307-1317 | `Inn` + `InnPanel` (`js/world/inn.js`, `js/ui/inn-panel.js`) | Rest/heal | open/close |
| | 127-220, 1403-1433 | `Chest` + `ChestPanel` | Open a chest, show loot | open/close |
| | 222-261, 1251-1305 | `Shop` + `ShopPanel` | Buy/sell | open/close |
| | 271-306, 1319-1327 | `WorldEvents` + `NoticePanel` | Raise events, show notices | |
| | 308-337 | `SeaEncounter` (`js/world/sea-encounter.js`) | Roll a sea fight | on voyage |
| | 339-629 | Part A visual owners (actors, foes, props, chests, extras) | | |
| | 631-720 | `Collision` (`js/world/collision.js`) | Solids, feet, occupancy | per island |
| | 722-789 | `Checkpoint` (`js/world/checkpoint.js`) | Remember/place at checkpoint | |
| | 982-1008 | `BattleBridge` (`SF.Battle.applyLoss` lives here today) | Apply a loss | |
| | 1021-1131 | `WorldAudit` | QA | dev only |
| | 1142-1249, 1329-1401 | `Portrait`, `SailChart`, `ItemIcon` (Part A U16-U18) | | |
| | 1435-1499 | each panel's `attach()` | | |
| `js/cinder.js` (1175) | 8-112 | `IslandRegistry` data | Island records | static |
| | 113-293 | `Voyage` (`js/world/voyage.js`) | Travel between islands | start/finish |
| | 295-304 | `Checkpoint` | | |
| | 306-356 | `HandShop` (`js/world/hand-shop.js`) | Upgrade purchase | open/close |
| | 358-546 | `CinderQuest` (`js/quest/cinder-quest.js`) | Cinderveil goals | per island |
| | 557-720 | `cinderNode` routing → dialogue content (`js/content/dialogue/cinderveil.js`) | | |
| | 722-774 | `CantorActor` (`js/actors/cantor-actor.js`) | Park/approach/walk Cantor | scene |
| | 776-885 | `IlsaActor` (`js/actors/ilsa-actor.js`) | Ilsa's ridge walk | scene |
| | 887-1175 | `Act1Epilogue` (`js/scene/act1-epilogue.js`) | Quay, depart, act card, epilogue | scene |
| `js/dialogue.js` (1049) | 36-149, 161-175 | `DialogueScript` (`js/dialogue/dialogue-script.js`) | Filter lines/choices by flags | pure |
| | 30-34, 177-194 | `DialogueEvents` | Fire `onEnd` events | |
| | 213-524 | `DialogueRunner` (`js/dialogue/dialogue-runner.js`) | Step a conversation | start → finish |
| | 454-498 | delete (legacy choice input; `ChoiceBox` owns input) | | |
| | 526-909 | `Portrait` (`js/ui/portrait.js`) | Draw one portrait | attach to a canvas |
| | 911-980 | `DialogueBox` (`js/ui/dialogue-box.js`) | Paint the dialogue DOM | open/close |
| | 982-1014 | `EndCard` (`js/ui/end-card.js`) | Show/dismiss the act card | |
| `js/ui.js` (636) | 10-54, 148-195 | `SettingsPanel` (`js/ui/settings-panel.js`) | Settings | open/close |
| | 56-75 | `PauseMenu` (`js/ui/pause-menu.js`) | Pause/resume | |
| | 77-86 | `NewsPanel` | Patch notes | |
| | 88-100 | `ConfirmModal` | Yes/no | |
| | 102-129 | `TitleScreen` (`js/ui/title-screen.js`) | New/continue | |
| | 131-325 | each widget's `attach()` | | |
| | 339-375 | `CoachHint`, `PlaceBanner` | | |
| | 377-599 | each widget's `sync()` | | |
| | 601-618 | `ScrollFade` | | |
| `js/input.js` (614) | 21-54 | `GamepadInput` (`js/input/gamepad.js`) | Poll the pad | update |
| | 56-142 | `MoveInput` | Read move + consume actions | update |
| | 144-316 (stick, buttons, keys) | `Stick`, `ActionButton`, `KeyboardInput` | | attach/detach |
| | 373-545 | `PressGate` (`js/input/press-gate.js`) | Swallow stale presses on overlays | |
| `js/main.js` (219) | 27-73 | `AssetBoot` | Load atlases/maps | once |
| | 75-121 | `GameLoop` | RAF loop | start |
| | 131-217 | `Viewport` (`js/core/viewport.js`) | Size + rotate gate | on resize |
| `js/grapple.js` (602) | 12-168 | `Grapple` (`js/hero/grapple.js`) | Fire/step the hook | update |
| | 170-329 | `CinderMaw` (`js/actors/cinder-maw.js`) | Boss behaviour | spawn → death |
| | 331-602 | Part A owners | | |
| `js/menu/field.js` (447) | 12-442 | `FieldMenu` (`js/ui/field-menu.js`) | Equip/use items | open/close |
| `js/draw/terrain.js` (1062) | all | delete with T2 (procedural ground) | | |
| `js/content/maps/v2layout.js` (1432) | 92-859 | `EmberholdLayout` (`js/world/layouts/emberhold.js`) | Shapes, routes, terraces | per island |
| | 993-1107 | `EncounterTable` (`js/rules/encounter-table.js`) | Encounter rates/rolls | |
| | 1141-1205 | `HandMeter` / `CarrierAim` | | |
| | 1213-1432 | `WorldAudit` | QA | dev only |
| `js/data.js` (259) | 186-258 | `MathUtil` (`clamp`, `dist`, `mulberry32`) + `Walkability` | | |
| `js/draw/*.js` layers | `SF.SkyLayer` etc. are facades over `SF.drawX` functions | each layer becomes a container that owns its child objects (`SkyBackdrop`, `EntityList`, ...) | Order children | attach per scene |


## Part C: conversion order (both lists, one PR per object group)

Rules: one open PR at a time; PR Verifier PASS, merge and deploy before the next. Steps marked **(no art)** need no new art and are safe to start now. **(art: …)** means the PR is parked until Game Art & Motion delivers. Each PR ships with a smoke check that fails if the converted visual draws a canvas primitive or CSS art again.

| # | PR (object group) | Covers | Depends on | Art |
|---|---|---|---|---|
| 1 | `oo-audit` ratchet: `tools/oo-audit.mjs` + smoke hook + baseline from this doc. Fails if any file's draw-API, CSS-art, `SF.*` or leaked-global count goes up. PR Verifier then has a machine check for "no code-drawn visuals remain" (baseline reaches 0). | A, B | none | (no art) |
| 2 | `VisualObject` contract + `Game` root + `SceneRouter` (`js/core/`) | B1 | 1 | (no art) |
| 3 | Wrap leaked top-level scripts (dialogue, music, choice-box, sfx, menu/field, title, feel, art/core, audio, ui) | B1 | 1 | (no art) |
| 4 | `UiSkin` windows: DOM 9-slice + canvas `drawWindow` | U1, U2 | 2 | PENDING: reusing `choicebox-panel.png` as the window skin. Nothing may depend on that reuse |
| 5 | `UiButton` + `Icon` + slider thumb + caret | U3, U9, U11, U13 | 4 | art: button 9-slice, 6 icons, thumb, caret |
| 6 | `GlowSprite` (replaces `SF.blobs`) | E1 | 2 | art: 4 glows + 3 puffs |
| 7 | `FootShadow` + `HeroMarker` | E2, E3 | 6 | art: shadows S/M/L, ring |
| 8 | `HpBar` | U10, X7, bars in U5 | 4 | art: bar frame + fill |
| 9 | `HurtVignette` + `Vignette` (+ ruling on `ScreenFade`) | L2, S4, S5 | 2 | art: vignette PNGs |
| 10 | `GameState` + `GameLoop` systems list (removes the `SF.update` chain) | B1, B2 sim/main | 2 | (no art) |
| 11 | `Hero`, `Dash`, `FieldCombat`, `FallRescue` out of `sim.js` | B2 sim | 10 | (no art) |
| 12 | Hero FX: `PalmGlow`, `DashTrail`, `HandCrystal` sprite | E5, E6, E7 | 11 | art: palm glow, dash trail, crystal |
| 13 | **PR49**: `SlashTrail` + `HitFlash` | E4, L1, part of X1 | 11 | **BLOCKED**: waiting on replacement source sprites; no derived white frames, no generic burst |
| 14 | Input split: `GamepadInput`, `KeyboardInput`, `PressGate`, `Stick`, `ActionButton` | B2 input, U7, U8 | 5 | art: stick, knob, 4 button faces, cooldown sheet |
| 15 | `Pickup`, `LampCrystal`, `GuideMarker` | K1, K2, U20 | 6 | art: shard, cog, lamp crystal, marks |
| 16 | Real `lamp_cold` frame (delete `recolorCold`) + canopy ruling | L3, L4 | none | art: cold lamp frame |
| 17 | `FieldFoe`, `FoeBrain`, `FoeSpawner`, `CinderMaw` extraction | B2 sim/grapple | 10 | (no art) |
| 18 | `FoeSprite` for the 7 Act 1 field foes; hurt/death clips replace X1-X5 | F1, F3, F4, F5, F9, F12, F13, X1-X5 | 17 (+13 for the impact spark) | art: regenerate the 7 foe sheets. Procedural game-art sheets are not real art |
| 19 | `FoeTell`, `Projectile`, `ParticleSystem`, `ShockRing` | X6, E8, E9, E10 | 17 | art: tells, projectile, particles, ring |
| 20 | Dialogue split: `DialogueScript`, `DialogueRunner`, `DialogueBox`, `EndCard`, `Portrait` | B2 dialogue, U14 | 3 | art: portrait frame |
| 21 | Party: `CharacterSprite` + hero battle sheet + portraits | P1, P2, P3 | 20 | art: 3 party battle sheets, Kestrel/Tamsin field, 3 portraits |
| 22 | `cinder.js` split: `Voyage`, `HandShop`, `CinderQuest`, `CantorActor`, `IlsaActor`, `Act1Epilogue` | B2 cinder | 10 | (no art) |
| 23 | Act 1 NPCs | N1-N6 | 21, 22 | art: 6 NPC field sheets + portraits |
| 24 | Town NPCs + pip_lark + icon portraits + item icons + keeper/menu faces | N7-N19, U15, U16, U17 | 23 | art: 12 NPCs, duo portrait, 14 badges, 10 item icons |
| 25 | `BattleBackdrop` x8 + `BackdropDrift` | S6-S14, E14 | 2 | art: 8 layered backdrops |
| 26 | Remaining foes + `ElementBurst` | F2, F6, F7, F8, F10, F11, F14, E13 | 18 | art: 7 foes, 4 element bursts |
| 27 | `BattleHud` widgets, `TargetCursor`, `BattleMenu`, `BattleBridge`; delete placeholders | U4, U5, U6, U21, B1 battle patch | 4, 8 | art: portrait frame, target bracket, name plate |
| 28 | `ui.js` split: `SettingsPanel`, `PauseMenu`, `ConfirmModal`, `NewsPanel`, `TitleScreen`, `CoachHint`, `PlaceBanner`, `UiRoot` | B2 ui | 4 | (no art) |
| 29 | `world.js` split: `Shop`, `Inn`, `Chest`, `NoticePanel`, `SeaEncounter`, `Checkpoint`, `Collision` | B2 world | 28 | (no art) |
| 30 | `IslandRegistry` + `Walkability` + `EmberholdLayout`/`EncounterTable` out of content | B1 island/walk chains, B2 v2layout | 29 | (no art) |
| 31 | Cinderveil as a `TmjMap`: tiles, props, buildings | T1-T3 (Cinderveil), D-rows, B-rows used there | 30 | art: Cinderveil tileset + burnt/dead prop variants + workshop, vault door, lair, great lamp |
| 32-35 | Saltmere, Highspire, Gullrock + Drift, Towns (one PR each) | T1-T4, D/B rows per island, D12 | 31 | art: one tileset + props per island |
| 36 | `SkyBackdrop`, `CloudLayer`, `HushEdge` | S1-S3 | 30 | art: sky plates, cloud layer, hush edge |
| 37 | `TitleBackdrop`, `TitleLogo`, `VoyageScene` | S15-S17, U12 | 36 | art: title key art, logo, voyage scene |
| 38 | `Minimap`, `SailChart`, `ChimneySmoke`, `HookPost`, `ArenaDecal`, `GrappleRope`, `HandMeter` glow | U18, U19, E11, E12, E15, K3, K4 | 30 | art: map icons, chart art, smoke, post, decal, rope |
| 39 | `FieldMenu`, `Viewport`, `AssetBoot`, audio objects | B2 menu/main/audio | 28 | (no art) |
| 40 | PWA icons from real art | U22 | 21 | art: icon set |
| 41 | Delete `js/art/*`, `AssetRegistry.codeCanvas`, `SpriteRenderer.drawCode`, all primitive fallbacks; retarget gallery/QA tools; audit baseline = 0 | everything | all | none |

Smallest, highest-visibility first: #4 (`UiSkin`) can ship with art that already exists, and every screen shows it. #1-#3 and the (no art) steps can run while Game Art & Motion works on the art.

## Part D: art asks for Game Art & Motion (in PR order)

1. **UI kit** (PR 4-9, 14): window 9-slice (reusing `choicebox-panel.png` is PENDING; nothing may depend on that reuse); button 9-slice (normal/pressed/selected/disabled); 6 icons 32x32 (speaker on/off, pause, back, talk, dash, grapple); slider thumb 26x26; caret 8x8 2f; stick base 128x128 + knob 56x56; 4 action-button faces (idle/pressed/ready); cooldown wipe 12f; HP/SP bar frame + fill; hurt vignette + plain vignette PNGs.
2. **Glow and shadow** (PR 6-7): glow sprites 16/32/64 px in cyan, gold, rose and violet; cloud/mist/dusk puffs 128-256 px; foot shadows S/M/L; hero foot ring 2f.
3. **Hero FX** (PR 12-13): palm glow 4f, dash trail/afterimage, hand crystal 2f; PR49 HitFlash + SlashTrail **replacement source sprites** (already requested).
4. **Pickups** (PR 15-16): shard 16x16 idle 4f, cog, lamp crystal cold/lit/flare 4f each, quest diamond 4f, edge arrow, bobber 4f, interact ring 2f, real unlit Kenmi-style path lamp frame.
5. **Field foes** (PR 18-19, 26): 14 foes; field 4-dir idle/walk + battle idle/attack/cast/hurt/death, portrait 64x64. Regenerate every sheet. The procedural game-art foe and fx sheets are not real art (names differ where a procedural file exists: code `ashling` = file `ashmite`, code `cinderhound` = file `cinderbrute`). No sheet yet for saltwisp, choir_soldier, hush_raider, drowned, stormgull, sentinel, tidewyrm. Also telegraph ring 6f, aim arrow, slam mark, projectile 4f, spark/ember/ash/dust particles, shock ring 6f, 4 element bursts 6f.
6. **Cast** (PR 21-24): Wayfarer battle sheet + portrait; Kestrel and Tamsin field 4-dir + battle + portrait; 18 NPC field sheets (4-dir idle 2f / walk 4f) + portraits; pip_lark duo portrait; 14 icon badges; 10 item icons 16x16; portrait frame.
7. **Battle** (PR 25-27): 8 layered backdrops (sky/far/mid/floor, ~480x270): emberhold_meadow, emberhold_scar, cinderveil_ash, ember_vault, saltmere_shore, saltmere_wreck, highspire_road, hush_deck; backdrop drift sprites; target bracket 4f; foe name plate 9-slice.
8. **World** (PR 31-35): tilesets and Tiled maps for Cinderveil, Saltmere, Highspire, Gullrock, Drift and towns; prop variants (dead/burnt/charred trees, bush_dead, tuft_dead, basalt, charred log/stump, burnt fences, crate, barrel, signpost, sign, stones); 19 buildings (great lamp unlit/lit, workshop, hut, skiff, stilt, stall, raft, wreck hull, gate arch, ruin, lair, vault door, bench, plank, inn lantern, quay bell, rope bridge, dock deck).
9. **Sky and screens** (PR 36-38, 40): sky plates per island (dusk + lit), cloud layer, hush edge, title key art + logo, voyage scene + sailing skiff 4f, minimap icons 8x8 + per-island map image, sail-chart background + 7 island cards, chimney smoke, hook post, arena cracks decal, rope segment + hook head, ash pool 4f, PWA icon set.

## Part E: open questions and uncertainties

v0.4.34 belongs to OO-01. PR #50 renumbers when it resumes.

### Settled (Brian's standing rules)

1. **Procedural sprite sheets (E.1, step 18).** The game-art foe and fx sheets (`shardfall/foes`, `shardfall/fx`) are not real art. Regenerate them. Step 18 does not ship those procedural sheets.
2. **`art/fx-tiles.png` (E.2).** Treat it the same way unless it is shown to be authored or generated art. Regenerate it. It is the 64×16 translucent shadow strip used as `ground.fx`. Its provenance is not recorded beyond `tools/ehmap/README.md:9`.
3. **Missing Kenmi atlas (E.4).** If the Kenmi atlas is missing, show a real placeholder image plus an error, and never fall back to code art. The atlas still depends on the deploy key (`.github/workflows/pages.yml`).

### Pending

Nothing may depend on these until Brian rules.

1. **Alpha used as a look (E.3, L4). PENDING.** Canopy see-through (L4), death fades (X4), i-frame alpha (E6), and scene fade (S5). Nothing may depend on whether these are allowed transparency or banned tricks.
2. **ChoiceBox panel as the window skin (step 4). PENDING.** Reusing `assets/ui/choicebox-panel.png` for `UiSkin`. Nothing may depend on that reuse.

### Other notes

5. `js/art/buildings.js` is not in `index.html`. `js/art/world.js:308-312` injects it with `document.write`.
6. `chest`/`chest_open` are registered twice (`js/art/world.js:25-50` and `js/art/props.js:857-858`). The later `props.js` registration wins.
7. Sootwing field look mismatch: `SF.FOE_LOOK.sootwing.sprite = "ashling"` (`js/content/maps/kinds.js:22`) and `SF.KIND_SPRITE.sootwing = "sootwing"` (`js/draw/actors.js:339`).
8. Function ranges come from a brace matcher. Character/foe data ranges run from one registration to the next. Spot checks matched the files.
9. The Nov 9 coded-art inventory was not found on disk (`/workspace/pr49-51-review/` holds only REVIEW.md and FX-ASSET-SPEC) or in this session's records, so it could not be cross-checked.
10. Not counted as art: canvas text (names, damage numbers, logs), `text-shadow` on text, scroll-fade masks (`css/style.css:1516-1528`).
