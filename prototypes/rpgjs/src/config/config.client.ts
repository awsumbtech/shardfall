import { provideClientGlobalConfig, provideClientModules, withMobile } from "@rpgjs/client";
import { provideTiledMap } from "@rpgjs/tiledmap/client";
import { provideMain } from "../modules/main/index.ts";
import { marenSheet, resolveSpriteSheet, wayfarerSheet } from "../sprites.ts";

export default {
  providers: [
    provideTiledMap({ basePath: "map" }),
    provideClientGlobalConfig(),
    provideMain(),
    provideClientModules([
      withMobile({
        enabled: "always",
        buttons: { action: true, back: true, dash: true },
      }),
      {
        spritesheets: [wayfarerSheet(), marenSheet()],
        spritesheetResolver: resolveSpriteSheet,
        engine: {
          onStart(engine: any) {
            (window as unknown as { __engine?: unknown }).__engine = engine;
            window.setInterval(() => {
              const el = document.getElementById("readout");
              if (!el) return;
              const players = engine.sceneMap?.players?.() || {};
              const events = engine.sceneMap?.events?.() || {};
              el.dataset.players = String(Object.keys(players).length);
              el.dataset.events = String(Object.keys(events).length);
            }, 500);
          },
        },
      },
    ]),
  ],
};
