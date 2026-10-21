import { CAT_SPEED } from "./constants";
import { walkable } from "./map";
import type { Dir } from "./types";

export type Step = {
  x: number;
  y: number;
  dir: Dir;
  arrived: boolean;
  moved: boolean;
};

function face(dir: Dir, dx: number, dy: number): Dir {
  if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05) return dir;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? "e" : "w";
  return dy > 0 ? "s" : "n";
}

/** One collision-aware step toward a point. Does not clear the caller's target. */
export function nudgeToward(
  x: number,
  y: number,
  dir: Dir,
  tx: number,
  ty: number,
  dt: number,
): Step {
  const dist = Math.hypot(tx - x, ty - y);
  if (dist <= 1.25) {
    if (walkable(tx, ty)) return { x: tx, y: ty, dir, arrived: true, moved: dist > 0.05 };
    return { x, y, dir, arrived: true, moved: false };
  }
  const h = Math.max(0, Math.min(dt, 0.05));
  const step = Math.min(CAT_SPEED * h, dist);
  const ux = (tx - x) / dist;
  const uy = (ty - y) / dist;
  const options: [number, number][] = [
    [x + ux * step, y + uy * step],
    [x + ux * step, y],
    [x, y + uy * step],
    [x - uy * step, y + ux * step],
    [x + uy * step, y - ux * step],
  ];
  for (const [nx, ny] of options) {
    if (!walkable(nx, ny)) continue;
    return { x: nx, y: ny, dir: face(dir, nx - x, ny - y), arrived: false, moved: true };
  }
  return { x, y, dir, arrived: false, moved: false };
}
