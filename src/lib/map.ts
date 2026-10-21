import { COLS, ROWS, TILE, WORLD_H, WORLD_W } from "./constants";

export type TileName = "grass" | "flower" | "path" | "wood" | "rug" | "hedge" | "wall";

export type Prop = {
  kind: "desk" | "plant" | "cushion";
  x: number;
  y: number;
  w: number;
  h: number;
  sortY: number;
  variant: number;
};

type Built = {
  tiles: TileName[];
  blocked: boolean[];
  props: Prop[];
};

function build(): Built {
  const tiles: TileName[] = Array.from({ length: COLS * ROWS }, () => "grass");
  const blocked = Array.from({ length: COLS * ROWS }, () => false);
  const props: Prop[] = [];

  const set = (tx: number, ty: number, tile: TileName, block = false) => {
    if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) {
      throw new Error(`tile out of bounds ${tx},${ty}`);
    }
    const i = ty * COLS + tx;
    tiles[i] = tile;
    blocked[i] = block;
  };

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1) set(x, y, "hedge", true);
    }
  }

  const hx = 11;
  const hy = 2;
  const hw = 7;
  const hh = 7;
  for (let y = hy; y < hy + hh; y++) {
    for (let x = hx; x < hx + hw; x++) {
      const edge = x === hx || y === hy || x === hx + hw - 1 || y === hy + hh - 1;
      set(x, y, edge ? "wall" : "wood", edge);
    }
  }
  set(hx, hy + 3, "path", false);

  for (let y = hy + 1; y <= hy + 2; y++) {
    for (let x = hx + 2; x <= hx + 4; x++) set(x, y, "wood", true);
  }
  props.push({
    kind: "desk",
    x: (hx + 2) * TILE,
    y: (hy + 1) * TILE,
    w: TILE * 3,
    h: TILE * 2,
    sortY: (hy + 3) * TILE,
    variant: 0,
  });

  for (let y = hy + 4; y <= hy + 5; y++) {
    for (let x = hx + 2; x <= hx + 4; x++) set(x, y, "rug", false);
  }
  props.push({
    kind: "cushion",
    x: (hx + 3) * TILE + 1,
    y: (hy + 5) * TILE + 4,
    w: 14,
    h: 10,
    sortY: (hy + 6) * TILE - 1,
    variant: 0,
  });

  const plants: [number, number][] = [
    [3, 3],
    [6, 6],
    [4, 11],
    [6, 9],
    [18, 10],
  ];
  plants.forEach(([x, y], variant) => {
    set(x, y, "grass", true);
    props.push({
      kind: "plant",
      x: x * TILE,
      y: y * TILE,
      w: TILE,
      h: TILE,
      sortY: (y + 1) * TILE,
      variant,
    });
  });

  const path: [number, number][] = [
    [10, 5],
    [10, 6],
    [9, 6],
    [9, 7],
    [8, 7],
    [8, 8],
    [8, 9],
    [8, 10],
    [8, 11],
    [8, 12],
  ];
  for (const [x, y] of path) set(x, y, "path", false);

  const flowers: [number, number][] = [
    [2, 2],
    [5, 4],
    [2, 9],
    [15, 11],
    [5, 12],
    [18, 3],
    [2, 6],
    [16, 12],
  ];
  for (const [x, y] of flowers) {
    const i = y * COLS + x;
    if (!blocked[i] && tiles[i] === "grass") tiles[i] = "flower";
  }

  return { tiles, blocked, props };
}

const MAP = build();

export function getTiles(): TileName[] {
  return MAP.tiles;
}

export function getProps(): Prop[] {
  return MAP.props;
}

export function tileBlocked(tx: number, ty: number): boolean {
  if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return true;
  return MAP.blocked[ty * COLS + tx];
}

export function tileAt(tx: number, ty: number): TileName {
  if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return "hedge";
  return MAP.tiles[ty * COLS + tx];
}

function pixelBlocked(px: number, py: number): boolean {
  if (px < 1 || py < 1 || px >= WORLD_W - 1 || py >= WORLD_H - 1) return true;
  return tileBlocked(Math.floor(px / TILE), Math.floor(py / TILE));
}

/** Feet can stand here without clipping a wall, hedge, desk, or pot. */
export function walkable(x: number, y: number): boolean {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
  const samples: [number, number][] = [
    [x, y],
    [x - 3, y],
    [x + 3, y],
    [x, y - 2],
  ];
  return samples.every(([px, py]) => !pixelBlocked(px, py));
}

let spotsCache: { x: number; y: number }[] | null = null;

export function walkableSpots(): { x: number; y: number }[] {
  if (spotsCache) return spotsCache;
  const spots: { x: number; y: number }[] = [];
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      const x = tx * TILE + TILE / 2;
      const y = ty * TILE + TILE / 2 + 1;
      if (walkable(x, y)) spots.push({ x, y });
    }
  }
  spotsCache = spots;
  return spots;
}

export function nearestWalkable(x: number, y: number): { x: number; y: number } | null {
  if (walkable(x, y)) return { x: Math.round(x), y: Math.round(y) };
  for (let radius = 4; radius <= 48; radius += 4) {
    for (let step = 0; step < 16; step++) {
      const angle = (step / 16) * Math.PI * 2;
      const nx = x + Math.cos(angle) * radius;
      const ny = y + Math.sin(angle) * radius;
      if (walkable(nx, ny)) return { x: Math.round(nx), y: Math.round(ny) };
    }
  }
  return null;
}

export function blockedGrid(): number[] {
  const grid: number[] = [];
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      const x = tx * TILE + TILE / 2;
      const y = ty * TILE + TILE / 2 + 1;
      grid.push(walkable(x, y) ? 0 : 1);
    }
  }
  return grid;
}

export function mapMeta() {
  return {
    width: WORLD_W,
    height: WORLD_H,
    tile: TILE,
    cols: COLS,
    rows: ROWS,
    blocked: blockedGrid(),
  };
}
