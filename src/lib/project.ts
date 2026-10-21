import { mapMeta } from "./map";
import type { CatRecord, PublicCat, WorldSnapshot, WorldState } from "./types";

function round(n: number): number {
  return Math.round(n * 10) / 10;
}

export function toPublic(cat: CatRecord): PublicCat {
  return {
    id: cat.id,
    name: cat.name,
    description: cat.description,
    color: cat.color,
    pattern: cat.pattern,
    x: round(cat.x),
    y: round(cat.y),
    targetX: cat.targetX == null ? null : round(cat.targetX),
    targetY: cat.targetY == null ? null : round(cat.targetY),
    dir: cat.dir,
    state: cat.state,
    task: cat.task,
    pose: cat.pose,
    goal: cat.goal,
    moving: cat.state === "idle" && cat.targetX != null,
    demo: cat.demo,
    lastHeartbeat: cat.lastHeartbeat,
    createdAt: cat.createdAt,
  };
}

export function snapshot(state: WorldState, since: number): WorldSnapshot {
  const messages =
    since > 0 ? state.messages.filter((message) => message.createdAt > since) : state.messages.slice(-50);
  return {
    version: 1,
    now: state.lastTick,
    map: mapMeta(),
    cats: state.cats.map(toPublic),
    messages,
  };
}
