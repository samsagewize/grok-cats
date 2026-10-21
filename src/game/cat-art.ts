import type { Dir } from "@/lib/types";

export const CAT_W = 24;
export const CAT_H = 24;
export const CAT_ANCHOR_X = 12;
export const CAT_ANCHOR_Y = 20;

export type Anim = "idle" | "walk" | "sit" | "work" | "sleep";

function blank(): string[][] {
  return Array.from({ length: CAT_H }, () => Array.from({ length: CAT_W }, () => "."));
}

function put(grid: string[][], x: number, y: number, ch: string, force = false) {
  const px = Math.round(x);
  const py = Math.round(y);
  if (px < 0 || py < 0 || px >= CAT_W || py >= CAT_H) return;
  if (!force && grid[py][px] !== ".") return;
  grid[py][px] = ch;
}

function fill(grid: string[][], cx: number, cy: number, rx: number, ry: number, ch: string, force = false) {
  for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) {
    for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
      const dx = (x + 0.5 - cx) / rx;
      const dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) put(grid, x, y, ch, force);
    }
  }
}

function ear(grid: string[][], cx: number, cy: number) {
  put(grid, cx, cy, "f", true);
  put(grid, cx - 1, cy + 1, "f", true);
  put(grid, cx, cy + 1, "i", true);
  put(grid, cx + 1, cy + 1, "f", true);
  put(grid, cx - 2, cy + 2, "f", true);
  put(grid, cx - 1, cy + 2, "i", true);
  put(grid, cx, cy + 2, "i", true);
  put(grid, cx + 1, cy + 2, "i", true);
  put(grid, cx + 2, cy + 2, "f", true);
}

function outline(grid: string[][]) {
  const marks: [number, number][] = [];
  for (let y = 0; y < CAT_H; y++) {
    for (let x = 0; x < CAT_W; x++) {
      if (grid[y][x] !== ".") continue;
      let touch = false;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= CAT_W || ny >= CAT_H) continue;
        if (grid[ny][nx] !== ".") touch = true;
      }
      if (touch) marks.push([x, y]);
    }
  }
  for (const [x, y] of marks) grid[y][x] = "o";
}

function eye(grid: string[][], x: number, y: number, closed: boolean) {
  if (closed) {
    put(grid, x - 1, y, "o", true);
    put(grid, x, y, "o", true);
    put(grid, x + 1, y, "o", true);
    return;
  }
  put(grid, x - 1, y, "w", true);
  put(grid, x, y, "p", true);
  put(grid, x + 1, y, "w", true);
}

function paw(grid: string[][], x: number, y: number) {
  put(grid, x, y, "f", true);
  put(grid, x + 1, y, "f", true);
  put(grid, x, y + 1, "f", true);
  put(grid, x + 1, y + 1, "f", true);
}

function laptop(grid: string[][], frame: number) {
  for (let y = 16; y <= 20; y++) {
    for (let x = 7; x <= 16; x++) {
      const edge = x === 7 || x === 16 || y === 16 || y === 20;
      const screen = y < 19;
      put(grid, x, y, edge ? "o" : screen ? "s" : "l", true);
    }
  }
  put(grid, frame % 2 === 0 ? 10 : 13, 19, "g", true);
  put(grid, 11, 18, "f", true);
  put(grid, 12, 18, "f", true);
}

function mirror(rows: string[]): string[] {
  return rows.map((row) => [...row].reverse().join(""));
}

export function catGrid(dir: Dir, pose: Anim, frame: number): string[] {
  if (dir === "w") return mirror(catGrid("e", pose, frame));
  const grid = blank();
  const sitting = pose === "sit" || pose === "work" || pose === "sleep";
  const side = dir === "e";
  const drop = sitting ? 1 : 0;

  const tail = side
    ? [
        [8, 16],
        [7, 15],
        [6, 14],
        [5, 13],
        [5, 12],
      ]
    : [
        [7, 16],
        [6, 15],
        [5, 14],
        [4, 13],
        [4, 12],
        [5, 11],
      ];
  for (const [x, y] of tail) put(grid, x, y + drop, "f", true);

  if (sitting) fill(grid, side ? 13 : 12, 16, side ? 4.3 : 5.5, 3.5, "f");
  else fill(grid, side ? 13 : 12, 15, side ? 4.2 : 5.1, 3.8, "f");

  if (dir === "s") fill(grid, 12, sitting ? 16.4 : 15.6, 2.7, 2, "b", true);
  if (side) fill(grid, 14.6, sitting ? 16.2 : 15.4, 1.7, 1.5, "b", true);

  const headX = side ? 14.2 : 12;
  const headY = sitting ? 10.2 : 8.6;
  fill(grid, headX, headY, side ? 3.5 : 4.2, 3.4, "f");

  if (!side) {
    ear(grid, 8, 4);
    ear(grid, 15, 4);
  } else {
    ear(grid, 12, 4);
    ear(grid, 16, 6);
  }

  const closed = pose === "sleep" || (pose === "idle" && frame === 1);
  if (dir === "s") {
    eye(grid, 10, sitting ? 10 : 9, closed);
    eye(grid, 14, sitting ? 10 : 9, closed);
    put(grid, 12, sitting ? 12 : 11, "n", true);
    put(grid, 8, sitting ? 11 : 10, "o", true);
    put(grid, 9, sitting ? 11 : 10, "o", true);
    put(grid, 15, sitting ? 11 : 10, "o", true);
    put(grid, 16, sitting ? 11 : 10, "o", true);
    put(grid, 9, (sitting ? 11 : 10) + 1, "k", true);
    put(grid, 15, (sitting ? 11 : 10) + 1, "k", true);
  } else if (dir === "n") {
    put(grid, 10, 8, "d", true);
    put(grid, 12, 7, "d", true);
    put(grid, 14, 8, "d", true);
  } else {
    eye(grid, 15, sitting ? 10 : 9, closed);
    put(grid, 17, sitting ? 11 : 10, "n", true);
    put(grid, 18, sitting ? 11 : 10, "o", true);
    put(grid, 14, sitting ? 11 : 10, "k", true);
  }

  if (!sitting) {
    const spread = pose === "walk" ? [0, 1, 0, -1][frame % 4] : 0;
    if (side) {
      paw(grid, 12 - spread, 18);
      paw(grid, 15 + spread, 18);
    } else {
      paw(grid, 9 - spread, 18);
      paw(grid, 13 + spread, 18);
    }
  } else if (pose !== "work") {
    paw(grid, side ? 12 : 9, 18);
    paw(grid, side ? 15 : 13, 18);
  }

  if (pose === "work") laptop(grid, frame);
  outline(grid);
  return grid.map((row) => row.join(""));
}
