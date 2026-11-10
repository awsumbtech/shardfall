import { Animation, Direction } from "@rpgjs/common";

// Wayfarer grid from art/atlas.config.json: 64px cells, 6 frames.
// Rows: idle down, idle side, idle up, walk down, walk side, walk up.
// RPG-JS RMSpritesheet maps down/left/right/up onto the first four rows, so
// this descriptor points walk at rows 3-5 instead. Left and right share the
// single side row. The files themselves are not in the repo yet.
export const SHEET = {
  cell: 64,
  columns: 6,
  rows: 6,
  width: 384,
  height: 384,
};

const SLOTS: Record<string, string> = {
  wayfarer: "wayfarer-outfitB.png",
  "npc-maren": "npc-maren.png",
};

const resolved = new Map<string, Promise<ReturnType<typeof spritesheetFor> | undefined>>();

const ROW: Record<string, { stand: number; walk: number }> = {
  [Direction.Down]: { stand: 0, walk: 3 },
  [Direction.Left]: { stand: 1, walk: 4 },
  [Direction.Right]: { stand: 1, walk: 4 },
  [Direction.Up]: { stand: 2, walk: 5 },
};

function walkFrames(row: number) {
  const frames = [];
  for (let column = 0; column < SHEET.columns; column += 1) {
    frames.push({ time: column * 10, frameX: column, frameY: row });
  }
  frames.push({ time: SHEET.columns * 10 });
  return frames;
}

export function spritesheetFor(id: string, image: string) {
  return {
    id,
    image,
    width: SHEET.width,
    height: SHEET.height,
    framesWidth: SHEET.columns,
    framesHeight: SHEET.rows,
    textures: {
      [Animation.Stand]: {
        animations: ({ direction }: { direction: string }) => {
          const row = ROW[direction]?.stand ?? 0;
          return [[{ time: 0, frameX: 0, frameY: row }]];
        },
      },
      [Animation.Walk]: {
        animations: ({ direction }: { direction: string }) => {
          const row = ROW[direction]?.walk ?? 3;
          return [walkFrames(row)];
        },
      },
    },
  };
}

export function resolveSpriteSheet(id: string) {
  const image = SLOTS[id];
  if (!image) return undefined;
  const cached = resolved.get(id);
  if (cached) return cached;
  const pending = fetch(image, { method: "HEAD" })
    .then((response) => response.ok ? spritesheetFor(id, image) : undefined)
    .catch(() => undefined);
  resolved.set(id, pending);
  return pending;
}
