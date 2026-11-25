# Loop audit cut: auto-target when one foe is left (v0.4.42)

## Object gate
1. **Owner object.** `SF.BattleFeel` (`js/battle/feel.js`) owns the setting `AUTO_TARGET_SOLE_FOE`. `SF.Battle` input (`js/battle/input.js`) owns the one place that opens a target prompt, now `beginAim`.
2. **Single responsibility and lifecycle.** `beginAim(b, aim)` has one job: when a foe-aimed command is chosen, either open the target prompt or, if exactly one foe is alive and the flag is on, act on that foe now. It keeps no state and runs once per command. The flag is plain data, read on each command, set at page load.
3. **Where it lives / attach point.** Flag: `SF.BattleFeel.AUTO_TARGET_SOLE_FOE` in `js/battle/feel.js`. Helper: a local function in the `js/battle/input.js` IIFE, called from the three branches of `SF.Battle.activate` that used to set `b.phase = "target"` (Attack, foe skills, foe items). No new file, no new `SF.*` member, no new global.
4. **What it does NOT change.** Damage, turn order, AI, rewards, XP, gold, encounter rate or any balance number. Which foe is hit (there is only one). Ally targeting (Tonic and heals still ask). Fights with two or more foes (still ask). The command menu, readouts, flee, result screen. Visuals: no art, tint, flash or code-drawn pixel is added. Save format.

Known edge: in a one-foe fight you can no longer back out of an Attack at the target step, because that step is gone. Set the flag to `false` to restore it.

## Proof (real touch taps, DSF3 844x390, same RNG seed, same bot reaction times)
One Brumekin fight, started identically on `main` (v0.4.41) and on this branch. See `TIMINGS.md` and the two strips in this folder.
