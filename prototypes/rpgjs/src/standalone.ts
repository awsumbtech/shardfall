import { provideRpg, startGame } from "@rpgjs/client";
import { mergeConfig } from "@signe/di";
import "@rpgjs/ui-css/index.css";
import "@rpgjs/ui-css/theme-default.css";
import configClient from "./config/config.client.ts";
import startServer from "./server.ts";

startGame(mergeConfig(configClient, {
  providers: [provideRpg(startServer)],
}));

window.addEventListener("keydown", (event) => {
  const el = document.getElementById("readout");
  if (el) el.dataset.key = `${event.key}:${event.keyCode}`;
});
