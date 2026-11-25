# Before / after timings: Attack with one foe

Harness: Playwright + CDP, real `Input.dispatchTouchEvent` taps, 844x390, deviceScaleFactor 3, landscape touch.
Fight: `em_brumekin` (one foe), started the same way each time, `Math.random` seeded (seeds 1-4), bot waits 350 ms after the menu appears and 700 ms on the result panel on both sides.
Origins: `main` at d2e183d served locally (v0.4.41) vs this branch served locally.
Times are page-clock seconds from the first battle frame. Seed 1 of each side was also screencast for the strips. Seeds 2-4 on the branch side ran the same battle code before the version string was bumped, so they report 0.4.41.

| seed | taps before | taps after | to Victory panel before | after | to field before | after |
|---|---|---|---|---|---|---|
| 1 | 11 | 6 | 7.85 s | 5.94 s | 8.70 s | 6.79 s |
| 2 | 11 | 6 | 7.92 s | 5.91 s | 8.77 s | 6.76 s |
| 3 | 11 | 6 | 7.92 s | 5.91 s | 8.79 s | 6.76 s |
| 4 | 11 | 6 | 7.94 s | 5.93 s | n/a | n/a |
| mean | 11 | 6 | 7.91 s | 5.92 s | 8.77 s | 6.78 s |

Result: 5 taps and about 2.0 s removed from a 5-round one-foe fight, one tap and about 0.4 s per Attack. Nothing else in the fight moved.

Strips (16 frames, seconds from battle start): `fight-BEFORE-main-v0.4.41-brumekin-dsf3.png`, `fight-AFTER-pr-v0.4.42-brumekin-dsf3.png`. After the cut no frame shows the "Tap a foe" prompt.

## Checks
- `node tools/smoke.mjs`: pass (new "auto-target ok": sole foe acts at once, two foes still ask, flag off asks; proved to fail with the flag off).
- `node tools/oo-audit.mjs`: 5142 remaining. `--against-ref origin/main`: pass, counts within origin/main.
- rg over the added lines for canvas draw calls, gradients, shadows, filters, tint, flash: no matches.
- `check-site --assemble --workflow`: pass. feel-smoke, battle-backdrop-check, battle-foe-check, menu-fit, tap-leak, scene-router-check, stick-two-finger, shard-check: pass.
- `tools/pwa-check.mjs`: unavailable (needs the `playwright` package, which is not installed here; same on main).
