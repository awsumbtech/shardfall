import { defineConfig } from "vite";
import { rpgjs, tiledMapFolderPlugin } from "@rpgjs/vite";
import startServer from "./src/server.ts";

// Spike only. base is relative so a preview is not glued to the site root.
// The Tiled plugin still publishes maps at /map, which preview serves from dist.
export default defineConfig({
  base: "./",
  // A missing Kenmi sheet must 404. The default SPA fallback would serve
  // index.html for those URLs and hide the missing-asset state.
  appType: "mpa",
  publicDir: "assets",
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  optimizeDeps: {
    include: ["pixi.js > @xmldom/xmldom"],
  },
  plugins: [
    tiledMapFolderPlugin({
      sourceFolder: "./src/tiled",
      publicPath: "/map",
      buildOutputPath: "map",
    }),
    ...rpgjs({
      server: startServer,
    }),
  ],
});
