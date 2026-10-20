# Shardfall

A personal, ad-free, non-commercial pseudo open-world RPG for the browser. A century ago the sky cracked. The land broke into floating islands over the Hush, a glowing cloud sea. You are a Wayfarer who wakes on Emberhold with a shard fused into your hand.

**Play:** [https://awsumbtech.github.io/shardfall/](https://awsumbtech.github.io/shardfall/)

The live site updates when the Pages workflow runs on `main`. It does not deploy from a pull request.

## v0.4 — Act 1, rebuilt

Play on a computer, in a wide window. The picture is 640×360 and scales by whole numbers. A phone in portrait asks you to turn it sideways. Touch buttons appear on a touch screen.

Fights are random encounters. There is no Fight button. Shards stay hidden until Maren shows you the lamp.

Install it from the field menu (More, then Install), or from the browser's install icon. An installed copy opens full screen and plays offline.

## v0.2 — Act 1: The Cinder Road

The Quickmercy sails. Cinderveil is open: Lowmoor Quay, the Ashfields, and the Ember Vault.
Tamsin fits a grapple to your hand. Hook the gaps, pull the small things, and haul yourself at the big ones.
Three cogs, Ilsa's trial, then the Cinder Maw. Spare shards buy a few changes to the hand. The Cantor waits at the end.
The title opens on a cloud sea. Emberhold, the crossing, Cinderveil, and the Maw each have a theme.
Music and effects have their own volume. Haptics can be turned off. The same Reduce flashing switch lives in Settings.

## v0.1.1 — Steady light

The screen stays steady. Flashes are softer, and Reduce flashing is on until you turn it off.
Your next step stays on screen. The button changes to Talk, Place shards, or Inspect when you are close enough.
A marker points the way. The first minute teaches the buttons once, and a missed gap says to try Dash.

## v0.1 — Emberhold

Emberhold is awake: wander the isle, dash across the broken span to Cinderstep, and cross the rope bridge to Kestrel's skiff.
Strike the Hushborn, gather five sky-shards, and relight Maren's great lamp.
Your reward is Shardstep — a farther, faster dash — and a rumor of the next island, Cinderveil.

## Controls

Keyboard and mouse come first. On a touch screen the stick, Dash, Hook, and Talk sit on the glass. The page does not scroll or zoom.

| | Keyboard and mouse | Touch | Gamepad |
| --- | --- | --- | --- |
| Move | WASD or arrow keys | Virtual stick | Stick or d-pad |
| Dash | Shift or K | Dash | X |
| Hook | G, or hold right-click | Hook, hold and release | RB |
| Talk, confirm | Space, Enter, E, or click | Talk | A |
| Cancel | Esc or right-click | — | B |
| Menu | Tab or Esc | Pause | Start |
| Mute | M | Speaker button | — |

Dash across the broken span. Walking it drops you into the Hush, and the shard hauls you back.

## Run it locally

The game is plain HTML, CSS, and JavaScript. There is no build step and no network assets.

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080/`. A local server is the reliable way to play; some browsers block parts of the page from a `file://` address.

```bash
node tools/smoke.mjs
```

That checks the island layout, a strike, the lamp quest, and a save/load round-trip. It does not need a browser.

## Save

The journey is stored in this browser under `localStorage` (`shardfall.v1`). It autosaves, and the pause menu can Save, Load, or Reset. Reset erases only this browser's save.

## Docs

The living design doc is [docs/design.md](docs/design.md). Player-facing notes are in [CHANGELOG.md](CHANGELOG.md).
