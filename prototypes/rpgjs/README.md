# RPG-JS Emberhold spike

Not for shipping. Do not merge. Do not deploy this to GitHub Pages.

This folder is a standalone RPG-JS v5 client. It loads a generated TMX of `maps/emberhold.tmj` (a copy of `js/content/maps/emberhold.tmj`). The main game is untouched.

```bash
cd prototypes/rpgjs
pnpm install
pnpm build
pnpm preview
```

`pnpm build` writes `dist/`. npm 10 can crash while resolving this tree; pnpm 10 installed it. See `FINDINGS.md`.

Open the preview and walk with the arrow keys. Space talks. The on-screen stick is RPG-JS's mobile controls, forced on so a desktop browser shows them. Maren is the point named `maren` on the map. The choice can keep the current place or return to it. Slot storage is `localStorage` key `shardfall-rpgjs-spike`.

Sprite sheets are slots, not files. See `assets/README.md`. What carried, what broke, and what is worth borrowing is in `FINDINGS.md`.
