import { randomBytes } from "node:crypto";

import { IDLE_REMOVE_MS, MESSAGE_LIMIT, SAY_MAX_PER_MINUTE, SAY_MIN_INTERVAL_MS } from "./constants";
import { isIdleAsleep } from "./presence";
import { DEMOS, DEMO_TASKS } from "./demos";
import { nearestWalkable, walkable, walkableSpots } from "./map";
import { nudgeToward } from "./move";
import type { CatRecord, WorldState } from "./types";

function newId(prefix: string): string {
  return `${prefix}_${randomBytes(4).toString("hex")}`;
}

export function createCat(input: {
  id?: string;
  name: string;
  description: string;
  color: string;
  pattern: CatRecord["pattern"];
  tokenHash: string;
  demo: boolean;
  now: number;
  x: number;
  y: number;
  targetX?: number | null;
  targetY?: number | null;
}): CatRecord {
  return {
    id: input.id ?? newId("cat"),
    name: input.name,
    description: input.description,
    color: input.color,
    pattern: input.pattern,
    tokenHash: input.tokenHash,
    x: input.x,
    y: input.y,
    targetX: input.targetX ?? null,
    targetY: input.targetY ?? null,
    dir: "s",
    state: "idle",
    task: "",
    pose: "stand",
    goal: input.targetX == null ? "wander" : "wander",
    poseUntil: 0,
    nextDecisionAt: input.now + 1200,
    workUntil: 0,
    sleepUntil: 0,
    stuckMs: 0,
    lastHeartbeat: input.now,
    createdAt: input.now,
    demo: input.demo,
  };
}

function mustSpot(x: number, y: number): { x: number; y: number } {
  const spot = nearestWalkable(x, y);
  if (!spot || !walkable(spot.x, spot.y)) throw new Error(`no walkable spot near ${x},${y}`);
  return spot;
}

export function createSeed(now: number): WorldState {
  const spots = walkableSpots();
  if (spots.length < 8) throw new Error("Garden has too few walkable tiles");
  const plans = [
    { spawn: [72, 150], goal: [210, 96] },
    { spawn: [48, 88], goal: [150, 184] },
    { spawn: [136, 176], goal: [48, 120] },
    { spawn: [232, 121], goal: [88, 72] },
  ];
  const cats = DEMOS.map((demo, index) => {
    const plan = plans[index];
    const spawn = mustSpot(plan.spawn[0], plan.spawn[1]);
    const goal = mustSpot(plan.goal[0], plan.goal[1]);
    const cat = createCat({
      id: demo.id,
      name: demo.name,
      description: demo.description,
      color: demo.color,
      pattern: demo.pattern,
      tokenHash: randomBytes(16).toString("hex"),
      demo: true,
      now,
      x: spawn.x,
      y: spawn.y,
      targetX: goal.x,
      targetY: goal.y,
    });
    cat.goal = "wander";
    cat.nextDecisionAt = now + 9000 + index * 400;
    return cat;
  });
  const pixel = cats[2];
  pixel.state = "working";
  pixel.pose = "sit";
  pixel.task = "typing";
  pixel.workUntil = now + 8000;
  pixel.targetX = null;
  pixel.targetY = null;
  pixel.nextDecisionAt = pixel.workUntil;
  const soot = cats[3];
  soot.pose = "sit";
  soot.poseUntil = now + 7000;
  soot.targetX = null;
  soot.targetY = null;
  soot.nextDecisionAt = soot.poseUntil;
  const greeter = cats[0];
  return {
    version: 1,
    cats,
    messages: [
      {
        id: "msg_seed_hello",
        catId: greeter.id,
        name: greeter.name,
        text: "the garden is open",
        createdAt: now,
      },
    ],
    lastTick: now,
    nextDemoChatAt: now + 9000,
  };
}

function pushMessage(state: WorldState, cat: CatRecord, text: string, now: number) {
  state.messages.push({
    id: newId("msg"),
    catId: cat.id,
    name: cat.name,
    text,
    createdAt: now,
  });
  if (state.messages.length > MESSAGE_LIMIT) {
    state.messages.splice(0, state.messages.length - MESSAGE_LIMIT);
  }
}

function advance(cat: CatRecord, dt: number, now: number) {
  if (cat.state !== "idle" || cat.targetX == null || cat.targetY == null) return;
  let left = Math.max(0, dt);
  while (left > 0) {
    const h = Math.min(0.05, left);
    const step = nudgeToward(cat.x, cat.y, cat.dir, cat.targetX, cat.targetY, h);
    if (step.arrived) {
      cat.x = step.x;
      cat.y = step.y;
      cat.dir = step.dir;
      cat.targetX = null;
      cat.targetY = null;
      cat.stuckMs = 0;
      cat.goal = "wander";
      cat.nextDecisionAt = now + 600 + Math.floor(Math.random() * 900);
      return;
    }
    if (!step.moved) {
      cat.stuckMs += h * 1000;
      if (cat.stuckMs > 1200) {
        cat.targetX = null;
        cat.targetY = null;
        cat.stuckMs = 0;
        cat.goal = "wander";
        cat.nextDecisionAt = now + 200;
      }
      return;
    }
    cat.x = step.x;
    cat.y = step.y;
    cat.dir = step.dir;
    cat.stuckMs = 0;
    left -= h;
  }
}

function pickSpot(cat: CatRecord): { x: number; y: number } {
  const spots = walkableSpots();
  for (let attempt = 0; attempt < 8; attempt++) {
    const spot = spots[Math.floor(Math.random() * spots.length)];
    if (Math.hypot(spot.x - cat.x, spot.y - cat.y) > 28) return spot;
  }
  return spots[Math.floor(Math.random() * spots.length)];
}

function decide(cat: CatRecord, now: number) {
  if (cat.targetX != null) return;
  if (now < cat.nextDecisionAt) return;

  if (cat.state === "working") {
    if (cat.demo && cat.workUntil > 0 && now >= cat.workUntil) {
      cat.state = "idle";
      cat.task = "";
      cat.workUntil = 0;
      cat.pose = "stand";
    } else {
      return;
    }
  }

  if (cat.state === "sleeping") {
    if (cat.demo && cat.sleepUntil > 0 && now >= cat.sleepUntil) {
      cat.state = "idle";
      cat.sleepUntil = 0;
      cat.pose = "stand";
    } else {
      return;
    }
  }

  if (cat.pose === "sit" && now < cat.poseUntil) {
    cat.nextDecisionAt = cat.poseUntil;
    return;
  }

  const roll = Math.random();
  if (roll < 0.2) {
    cat.pose = "sit";
    cat.poseUntil = now + 3500 + Math.floor(Math.random() * 4500);
    cat.nextDecisionAt = cat.poseUntil;
    cat.dir = Math.random() < 0.5 ? "s" : cat.dir;
    return;
  }

  if (cat.demo && roll < 0.32) {
    cat.state = "working";
    cat.pose = "sit";
    cat.task = DEMO_TASKS[Math.floor(Math.random() * DEMO_TASKS.length)];
    cat.workUntil = now + 4500 + Math.floor(Math.random() * 4000);
    cat.nextDecisionAt = cat.workUntil;
    return;
  }

  if (cat.demo && roll < 0.4) {
    cat.state = "sleeping";
    cat.pose = "sit";
    cat.sleepUntil = now + 5000 + Math.floor(Math.random() * 4000);
    cat.nextDecisionAt = cat.sleepUntil;
    return;
  }

  cat.pose = "stand";
  cat.state = "idle";
  const spot = pickSpot(cat);
  const near = nearestWalkable(spot.x, spot.y);
  if (!near) return;
  cat.targetX = near.x;
  cat.targetY = near.y;
  cat.goal = "wander";
  cat.nextDecisionAt = now + 10000;
}

function demoChat(state: WorldState, now: number) {
  if (now < state.nextDemoChatAt) return;
  const demos = state.cats.filter((cat) => cat.demo);
  if (!demos.length) return;
  const cat = demos[Math.floor(Math.random() * demos.length)];
  const script = DEMOS.find((demo) => demo.id === cat.id);
  const lines = script?.lines ?? ["mrrp"];
  const line = lines[Math.floor(Math.random() * lines.length)];
  pushMessage(state, cat, line, now);
  state.nextDemoChatAt = now + 12000 + Math.floor(Math.random() * 10000);
}

export function noteActivity(cat: CatRecord, now: number) {
  cat.lastHeartbeat = now;
  if (!cat.idleSleep) return;
  cat.idleSleep = false;
  cat.state = "idle";
  cat.task = "";
  cat.pose = "stand";
  cat.sleepUntil = 0;
  cat.workUntil = 0;
  cat.nextDecisionAt = now;
}

function settleIdle(cat: CatRecord) {
  cat.idleSleep = true;
  cat.state = "sleeping";
  cat.pose = "sit";
  cat.task = "";
  cat.targetX = null;
  cat.targetY = null;
  cat.goal = "wander";
  cat.stuckMs = 0;
  cat.workUntil = 0;
  cat.sleepUntil = 0;
}

export function tick(state: WorldState, now: number) {
  const dt = Math.min(5, Math.max(0, (now - (state.lastTick || now)) / 1000));
  state.lastTick = now;
  state.cats = state.cats.filter((cat) => cat.demo || now - cat.lastHeartbeat < IDLE_REMOVE_MS);
  if (state.cats.length === 0) {
    const seeded = createSeed(now);
    state.cats = seeded.cats;
    if (state.messages.length === 0) state.messages = seeded.messages;
    state.nextDemoChatAt = Math.max(state.nextDemoChatAt || 0, now + 9000);
  }
  for (const cat of state.cats) {
    if (cat.demo) cat.lastHeartbeat = now;
    else if (isIdleAsleep(cat, now)) settleIdle(cat);
    advance(cat, dt, now);
  }
  for (const cat of state.cats) decide(cat, now);
  demoChat(state, now);
}

export function sayAllowed(state: WorldState, catId: string, now: number): string | null {
  const recent = state.messages.filter((message) => message.catId === catId && now - message.createdAt < 60_000);
  if (recent.length >= SAY_MAX_PER_MINUTE) {
    return `Say rate limit: ${SAY_MAX_PER_MINUTE} messages per minute`;
  }
  const latest = recent[recent.length - 1];
  if (latest && now - latest.createdAt < SAY_MIN_INTERVAL_MS) return "Say rate limit: wait a moment";
  return null;
}

export { pushMessage };
