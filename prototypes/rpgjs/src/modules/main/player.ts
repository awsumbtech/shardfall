import type { RpgPlayer, RpgPlayerHooks } from "@rpgjs/server";
import { bridgeGui } from "../../gui-bridge.ts";
import { publish } from "../../readout.ts";
import { resolveSpriteSheet } from "../../sprites.ts";

async function graphicIfPresent(entity: { setGraphic: (id: string) => void }, id: string) {
  const sheet = await resolveSpriteSheet(id);
  if (!sheet) return;
  entity.setGraphic(id);
}

// maren marker in the tmj is the point at 1088, 288.
// The player starts two tiles south of that point so a short walk reaches it.
// The wake checkpoint (848, 1040) is left unused; it is a long walk from Maren.
const START = { x: 1088, y: 320 };

export const player: RpgPlayerHooks = {
  async onConnected(player: RpgPlayer) {
    player.name = "Wayfarer";
    bridgeGui(player);
    player.setHitbox(16, 16);
    await graphicIfPresent(player, "wayfarer");
    try {
      const ok = await player.changeMap("emberhold", START);
      publish(player, ok ? "map" : "map rejected");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      publish(player, `map error: ${message}`);
      console.error(error);
    }
    window.setInterval(() => publish(player), 200);
    (window as unknown as { __spike?: unknown }).__spike = { player };
  },
  onLoad(player: RpgPlayer) {
    publish(player, "loaded");
  },
  onInput(player: RpgPlayer, input: { action?: string }) {
    if (input?.action === "escape") player.callMainMenu();
  },
};
