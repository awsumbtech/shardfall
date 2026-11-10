import type { EventDefinition, RpgPlayer } from "@rpgjs/server";
import { coords, publish } from "../../readout.ts";
import { resolveSpriteSheet } from "../../sprites.ts";

const SLOT = 0;

// TEMP lines stand in for the Shardfall Script bot. Tone-neutral on purpose.
export function Maren(): EventDefinition {
  return {
    name: "maren",
    async onInit() {
      this.setHitbox(16, 16);
      const sheet = await resolveSpriteSheet("npc-maren");
      if (sheet) this.setGraphic("npc-maren");
    },
    async onAction(player: RpgPlayer) {
      const here = coords(player);
      await player.showText("TEMP: Someone is standing on the path.", {
        typewriterEffect: false,
      });
      const choice = await player.showChoices(
        `TEMP: Now at ${here.x}, ${here.y}. Keep this place, or walk on?`,
        [
          { text: "TEMP: Keep this place", value: "save" },
          { text: "TEMP: Return to the kept place", value: "load" },
          { text: "TEMP: Walk on", value: "leave" },
        ],
        { typewriterEffect: false },
      );
      if (!choice) return;
      if (choice.value === "save") {
        const spot = coords(player);
        // Client prediction is the position on screen. Copy it into the
        // server player before the snapshot so the slot matches the walk.
        player.teleport({ x: spot.x, y: spot.y });
        player.setVariable("keptX", spot.x);
        player.setVariable("keptY", spot.y);
        const saved = await player.save(SLOT);
        publish(player, saved ? "saved" : "save failed");
        return;
      }
      if (choice.value === "load") {
        const loaded = await player.load(SLOT, { reason: "load", source: "maren" }, { changeMap: true });
        publish(player, loaded.ok ? "loaded" : "empty slot");
      }
    },
  };
}
