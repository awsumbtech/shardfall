# Shardfall

A personal, ad-free, non-commercial pseudo open-world RPG for the browser. A century ago the sky cracked. The land broke into floating islands over the Hush, a glowing cloud sea. You are a Wayfarer who wakes on Emberhold with a shard fused into your hand.

**Play:** [https://awsumbtech.github.io/shardfall/](https://awsumbtech.github.io/shardfall/)

The live site updates when the Pages workflow runs on `main`. It does not deploy from a pull request.

## v0.1.1 — Steady light

The screen stays steady. Flashes are softer, and Reduce flashing is on until you turn it off.
Your next step stays on screen. The button changes to Talk, Place shards, or Inspect when you are close enough.
A marker points the way. The first minute teaches the buttons once, and a missed gap says to try Dash.

## v0.1 — Emberhold

Emberhold is awake: wander the isle, dash across the broken span to Cinderstep, and cross the rope bridge to Kestrel's skiff.
Strike the Hushborn, gather five sky-shards, and relight Maren's great lamp.
Your reward is Shardstep — a farther, faster dash — and a rumor of the next island, Cinderveil.

## Controls

The game is built for a phone in Chrome, in portrait or landscape. The page does not scroll or zoom.

| | Phone | Keyboard |
| --- | --- | --- |
| Move | Virtual stick, lower left | WASD or arrow keys |
| Strike | Blade button, lower right | J or Z |
| Dash | Dash button | K or Space |
| Talk, inspect, place shards | The button on the upper right. It renames itself | E or Enter |
| Pause | Pause button | Esc |
| Mute | Speaker button | M |

On screen, Strike, Dash, and Talk sit under your right thumb. Dash across the broken span; walking it drops you into the Hush, and the shard hauls you back. Hold Strike to keep swinging.

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
