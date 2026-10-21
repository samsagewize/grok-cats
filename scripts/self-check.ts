import { stripHtml } from "../src/lib/text";
import { createSeed, sayAllowed, tick } from "../src/lib/sim";
import { nearestWalkable, tileBlocked, walkable, walkableSpots } from "../src/lib/map";
import { nudgeToward } from "../src/lib/move";
import { catGrid } from "../src/game/cat-art";

const spots = walkableSpots();
if (spots.length < 20) throw new Error(`too few spots: ${spots.length}`);
if (!walkable(11 * 16 + 8, 5 * 16 + 9)) throw new Error("door should be walkable");
if (!tileBlocked(14, 3)) throw new Error("desk should block");
const desk = nearestWalkable(14 * 16 + 8, 3 * 16 + 8);
if (!desk || !walkable(desk.x, desk.y)) throw new Error("nearest walkable failed");

const start = spots[0];
const goal = spots[Math.min(10, spots.length - 1)];
let x = start.x;
let y = start.y;
let dir: "n" | "s" | "e" | "w" = "s";
let moved = false;
for (let i = 0; i < 40; i++) {
  const step = nudgeToward(x, y, dir, goal.x, goal.y, 0.05);
  if (step.x !== x || step.y !== y) moved = true;
  x = step.x;
  y = step.y;
  dir = step.dir;
  if (!walkable(x, y)) throw new Error("step left the path");
}
if (!moved) throw new Error("cat did not move");

if (stripHtml("hello <b>there</b>") !== "hello there") throw new Error("strip tags");
if (stripHtml("<script>alert(1)</script>").includes("<")) throw new Error("angle brackets left");

const state = createSeed(Date.now());
if (state.cats.length !== 4) throw new Error("expected 4 demo cats");
if (!state.messages.length) throw new Error("seed should speak");
const before = state.cats[0].x;
tick(state, Date.now() + 2000);
if (state.cats[0].x === before && state.cats[0].targetX == null) {
  throw new Error("demo cat neither moved nor arrived");
}
const visitorId = "cat_test";
state.cats.push({
  ...state.cats[0],
  id: visitorId,
  demo: false,
  name: "Test",
});
state.messages.push({
  id: "m1",
  catId: visitorId,
  name: "Test",
  text: "hi",
  createdAt: Date.now(),
});
const limited = sayAllowed(state, visitorId, Date.now() + 100);
if (!limited) throw new Error("rate limit should trip");

for (const dir of ["s", "n", "e", "w"] as const) {
  for (const pose of ["idle", "walk", "sit", "work", "sleep"] as const) {
    const rows = catGrid(dir, pose, 0);
    if (rows.length !== 24 || rows.some((row) => row.length !== 24)) {
      throw new Error(`bad sprite ${dir} ${pose}`);
    }
  }
}

console.log(`self-check ok (${spots.length} walkable spots)`);
