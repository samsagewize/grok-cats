import { randomBytes } from "node:crypto";

import { MAX_VISITORS } from "@/lib/constants";
import { colorFromId, patternFromId } from "@/lib/color";
import { applyGithubAdoption } from "@/lib/github-cat";
import { nearestWalkable, walkableSpots } from "@/lib/map";
import { snapshot } from "@/lib/project";
import { createCat, noteActivity, pushMessage, sayAllowed } from "@/lib/sim";
import type { CatRecord, WorldSnapshot, WorldState } from "@/lib/types";
import { cleanStatus, cleanTask, cleanText } from "@/lib/text";
import { bearerToken, hashToken, tokenMatches } from "@/server/auth";
import { updateState } from "@/server/store";

type Fail = { ok: false; status: number; error: string };
type CatAuth = { ok: true; cat: CatRecord } | Fail;

function authorize(state: WorldState, id: string, request: Request): CatAuth {
  const cat = state.cats.find((item) => item.id === id);
  if (!cat) return { ok: false, status: 404, error: "Cat not found" };
  if (cat.demo) return { ok: false, status: 403, error: "This cat cannot be controlled" };
  const token = bearerToken(request);
  if (!token) return { ok: false, status: 401, error: "Missing bearer token" };
  if (!tokenMatches(token, cat.tokenHash)) return { ok: false, status: 401, error: "Invalid token" };
  return { ok: true, cat };
}

function finite(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || Math.abs(value) > 5000) return null;
  return value;
}

export function readWorld(since: number): Promise<WorldSnapshot> {
  return updateState((state) => snapshot(state, since));
}

export function joinCat(input: {
  name: string;
  description: string;
  color?: string;
}): Promise<{ ok: true; status: 201; catId: string; token: string } | Fail> {
  return updateState((state) => {
    const visitors = state.cats.filter((cat) => !cat.demo).length;
    if (visitors >= MAX_VISITORS) return { ok: false, status: 403, error: "The garden is full" };
    const now = Date.now();
    let id = "";
    do {
      id = `cat_${randomBytes(4).toString("hex")}`;
    } while (state.cats.some((cat) => cat.id === id));
    const spots = walkableSpots();
    const spawn = spots[Math.floor(Math.random() * spots.length)];
    let goal = spots[Math.floor(Math.random() * spots.length)];
    if (spots.length > 1) {
      while (goal.x === spawn.x && goal.y === spawn.y) {
        goal = spots[Math.floor(Math.random() * spots.length)];
      }
    }
    const token = randomBytes(24).toString("base64url");
    const cat = createCat({
      id,
      name: input.name,
      description: input.description,
      color: input.color ?? colorFromId(id),
      pattern: patternFromId(id),
      tokenHash: hashToken(token),
      demo: false,
      now,
      x: spawn.x,
      y: spawn.y,
      targetX: goal.x,
      targetY: goal.y,
    });
    cat.goal = "wander";
    state.cats.push(cat);
    return { ok: true, status: 201, catId: id, token };
  });
}

export function githubCatFor(
  githubId: string,
): Promise<{ id: string; name: string; color: string } | null> {
  return updateState((state) => {
    const cat = state.cats.find((item) => !item.demo && item.githubId === githubId);
    if (!cat) return null;
    return { id: cat.id, name: cat.name, color: cat.color };
  });
}

export function adoptGithubCat(input: {
  githubId: string;
  githubLogin: string;
  avatarUrl: string;
  name: string;
  color?: string;
}): Promise<{ ok: true; status: 200 | 201; catId: string; token: string; created: boolean } | Fail> {
  const token = randomBytes(24).toString("base64url");
  return updateState((state) => {
    const spots = walkableSpots();
    if (!spots.length) return { ok: false, status: 500, error: "The garden has no open ground" };
    const spawn = spots[Math.floor(Math.random() * spots.length)];
    let goal = spots[Math.floor(Math.random() * spots.length)];
    if (spots.length > 1) {
      while (goal.x === spawn.x && goal.y === spawn.y) {
        goal = spots[Math.floor(Math.random() * spots.length)];
      }
    }
    let id = "";
    do {
      id = `cat_${randomBytes(4).toString("hex")}`;
    } while (state.cats.some((cat) => cat.id === id));
    const applied = applyGithubAdoption(state, {
      githubId: input.githubId,
      githubLogin: input.githubLogin,
      avatarUrl: input.avatarUrl,
      name: input.name,
      description: `Signed in with GitHub as @${input.githubLogin}`,
      color: input.color,
      tokenHash: hashToken(token),
      now: Date.now(),
      id,
      spawn,
      goal,
    });
    if (!applied.ok) return { ok: false, status: 403, error: applied.error };
    return {
      ok: true,
      status: applied.created ? 201 : 200,
      catId: applied.catId,
      token,
      created: applied.created,
    };
  });
}

export function sayAsCat(
  id: string,
  request: Request,
  text: string,
): Promise<{ ok: true; status: 200; message: WorldSnapshot["messages"][number] } | Fail> {
  return updateState((state) => {
    const auth = authorize(state, id, request);
    if (!auth.ok) return auth;
    const now = Date.now();
    noteActivity(auth.cat, now);
    const limited = sayAllowed(state, id, now);
    if (limited) return { ok: false, status: 429, error: limited };
    pushMessage(state, auth.cat, text, now);
    const message = state.messages[state.messages.length - 1];
    return { ok: true, status: 200, message };
  });
}

export function setStatus(
  id: string,
  request: Request,
  body: Record<string, unknown>,
): Promise<{ ok: true; status: 200; state: "idle" | "working" | "sleeping"; task: string } | Fail> {
  const status = cleanStatus(body.state);
  if (!status) return Promise.resolve({ ok: false, status: 400, error: "State must be idle, working, or sleeping" });
  const task = cleanTask(body.task);
  if (!task.ok) return Promise.resolve({ ok: false, status: 400, error: task.error });
  return updateState((state) => {
    const auth = authorize(state, id, request);
    if (!auth.ok) return auth;
    const cat = auth.cat;
    const now = Date.now();
    noteActivity(cat, now);
    cat.state = status;
    cat.targetX = null;
    cat.targetY = null;
    cat.stuckMs = 0;
    cat.goal = "wander";
    if (status === "idle") {
      cat.task = "";
      cat.pose = "stand";
      cat.workUntil = 0;
      cat.sleepUntil = 0;
      cat.goal = "wander";
      cat.nextDecisionAt = now;
    } else if (status === "working") {
      cat.task = task.value;
      cat.pose = "sit";
      cat.workUntil = 0;
      cat.sleepUntil = 0;
    } else {
      cat.task = "";
      cat.pose = "sit";
      cat.sleepUntil = 0;
      cat.workUntil = 0;
    }
    return { ok: true, status: 200, state: cat.state, task: cat.task };
  });
}

export function heartbeat(
  id: string,
  request: Request,
): Promise<{ ok: true; status: 200; lastHeartbeat: number } | Fail> {
  return updateState((state) => {
    const auth = authorize(state, id, request);
    if (!auth.ok) return auth;
    noteActivity(auth.cat, Date.now());
    return { ok: true, status: 200, lastHeartbeat: auth.cat.lastHeartbeat };
  });
}

export function moveCat(
  id: string,
  request: Request,
  body: Record<string, unknown>,
): Promise<{ ok: true; status: 200; x: number; y: number; targetX: number; targetY: number } | Fail> {
  const hasX = body.x != null;
  const hasY = body.y != null;
  const hasDx = body.dx != null;
  const hasDy = body.dy != null;
  const absolute = hasX || hasY;
  const relative = hasDx || hasDy;
  if (!absolute && !relative) {
    return Promise.resolve({ ok: false, status: 400, error: "Provide x and y, or dx and dy" });
  }
  if (absolute && (!hasX || !hasY)) {
    return Promise.resolve({ ok: false, status: 400, error: "Absolute moves need both x and y" });
  }
  const x = absolute ? finite(body.x) : 0;
  const y = absolute ? finite(body.y) : 0;
  const dx = !absolute && hasDx ? finite(body.dx) : 0;
  const dy = !absolute && hasDy ? finite(body.dy) : 0;
  if (x == null || y == null || dx == null || dy == null) {
    return Promise.resolve({ ok: false, status: 400, error: "Coordinates must be finite numbers" });
  }
  return updateState((state) => {
    const auth = authorize(state, id, request);
    if (!auth.ok) return auth;
    const cat = auth.cat;
    noteActivity(cat, Date.now());
    const destX = absolute ? x : cat.x + (dx ?? 0);
    const destY = absolute ? y : cat.y + (dy ?? 0);
    const spot = nearestWalkable(destX, destY);
    if (!spot) return { ok: false, status: 400, error: "That spot is outside the garden" };
    cat.targetX = spot.x;
    cat.targetY = spot.y;
    cat.goal = "travel";
    cat.state = "idle";
    cat.task = "";
    cat.pose = "stand";
    cat.workUntil = 0;
    cat.sleepUntil = 0;
    cat.stuckMs = 0;
    cat.nextDecisionAt = Date.now() + 60_000;
    return {
      ok: true,
      status: 200,
      x: Math.round(cat.x * 10) / 10,
      y: Math.round(cat.y * 10) / 10,
      targetX: spot.x,
      targetY: spot.y,
    };
  });
}

export function parseSay(body: Record<string, unknown>) {
  return cleanText(body.text);
}
