import { Animation, Direction } from "@rpgjs/common";

// 16px tiles. The south stand's opaque body is 30×63 inside the 112 cell.
// Half scale draws that body at 15×31.5 px: about 1 tile wide and 2 tiles tall.
export const WORLD_SCALE = 0.5;

// wayfarer-outfitB.png is 896×448, 8×4 cells of 112.
// Rows are S, E, N, W. The opaque sole of the south stand is y=89, x center 56.
// The 80×80 body pivot (40, 75) centered in the cell is (56, 91).
const WAYFARER_CELL = 112;
const WAYFARER_FOOT: [number, number] = [56 / WAYFARER_CELL, 90 / WAYFARER_CELL];
const WALK_FRAMES = 8;
const FRAME_TIME = 8;

// npc-maren.png is 80×80, one south-facing stand. Opaque sole is (39, 74).
const MAREN_SIZE = 80;
const MAREN_FOOT: [number, number] = [39 / MAREN_SIZE, 74 / MAREN_SIZE];

const WAYFARER_ROW: Record<string, number> = {
  [Direction.Down]: 0,
  [Direction.Right]: 1,
  [Direction.Up]: 2,
  [Direction.Left]: 3,
};

function frames(row: number, count: number) {
  const timeline = [];
  for (let column = 0; column < count; column += 1) {
    timeline.push({
      time: column * FRAME_TIME,
      frameX: column,
      frameY: row,
    });
  }
  timeline.push({ time: count * FRAME_TIME });
  return timeline;
}

function directionFrames(walkColumns: number) {
  return {
    [Animation.Stand]: {
      animations: ({ direction }: { direction: string }) => {
        const row = WAYFARER_ROW[direction] ?? 0;
        return [[{ time: 0, frameX: 0, frameY: row }]];
      },
    },
    [Animation.Walk]: {
      animations: ({ direction }: { direction: string }) => {
        const row = WAYFARER_ROW[direction] ?? 0;
        return [frames(row, walkColumns)];
      },
    },
  };
}

export function wayfarerSheet() {
  return {
    id: "wayfarer",
    image: "wayfarer-outfitB.png",
    width: 896,
    height: 448,
    framesWidth: 8,
    framesHeight: 4,
    rectWidth: WAYFARER_CELL,
    rectHeight: WAYFARER_CELL,
    scale: [WORLD_SCALE, WORLD_SCALE],
    anchor: WAYFARER_FOOT,
    // Local offset so the foot sits on the bottom center of the 16px hitbox.
    x: 8,
    y: 16,
    textures: directionFrames(WALK_FRAMES),
  };
}

export function marenSheet() {
  return {
    id: "npc-maren",
    image: "npc-maren.png",
    width: MAREN_SIZE,
    height: MAREN_SIZE,
    framesWidth: 1,
    framesHeight: 1,
    rectWidth: MAREN_SIZE,
    rectHeight: MAREN_SIZE,
    scale: [WORLD_SCALE, WORLD_SCALE],
    anchor: MAREN_FOOT,
    x: 8,
    y: 16,
    textures: {
      [Animation.Stand]: {
        animations: () => [[{ time: 0, frameX: 0, frameY: 0 }]],
      },
      [Animation.Walk]: {
        animations: () => [[{ time: 0, frameX: 0, frameY: 0 }]],
      },
    },
  };
}

const SHEETS: Record<string, ReturnType<typeof wayfarerSheet>> = {
  wayfarer: wayfarerSheet(),
  "npc-maren": marenSheet(),
};

export function resolveSpriteSheet(id: string) {
  return SHEETS[id];
}
