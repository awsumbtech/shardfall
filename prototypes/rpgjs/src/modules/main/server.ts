import { defineModule } from "@rpgjs/common";
import type { RpgServer } from "@rpgjs/server";
import { Maren } from "./event.ts";
import { player } from "./player.ts";

export default defineModule<RpgServer>({
  player,
  maps: [
    {
      id: "emberhold",
      // x and y are omitted so the loader can take the maren point object.
      events: [
        {
          id: "maren",
          // The maren point in the tmj is 1088, 288. Setting it here as well:
          // leaving x and y empty did not put the event on the client scene.
          x: 1088,
          y: 288,
          event: Maren(),
        },
      ],
    },
  ],
});
