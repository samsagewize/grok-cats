import { MAX_VISITORS } from "./constants";
import { colorFromId, patternFromId } from "./color";
import { safeAvatar, safeGithubId, safeGithubLogin } from "./github";
import { createCat } from "./sim";
import type { WorldState } from "./types";

export type GithubAdoption = {
  githubId: string;
  githubLogin: string;
  avatarUrl: string;
  name: string;
  description: string;
  color?: string;
  tokenHash: string;
  now: number;
  id: string;
  spawn: { x: number; y: number };
  goal: { x: number; y: number };
};

export function applyGithubAdoption(
  state: WorldState,
  input: GithubAdoption,
): { ok: true; catId: string; created: boolean } | { ok: false; error: string } {
  const githubId = safeGithubId(input.githubId);
  const githubLogin = safeGithubLogin(input.githubLogin);
  if (!githubId || !githubLogin) return { ok: false, error: "GitHub account is missing a username" };
  const avatarUrl = safeAvatar(input.avatarUrl);
  const existing = state.cats.find((cat) => !cat.demo && cat.githubId === githubId);
  if (existing) {
    existing.name = input.name;
    existing.description = input.description;
    if (input.color) existing.color = input.color;
    existing.githubId = githubId;
    existing.githubLogin = githubLogin;
    if (avatarUrl) existing.avatarUrl = avatarUrl;
    existing.tokenHash = input.tokenHash;
    existing.lastHeartbeat = input.now;
    return { ok: true, catId: existing.id, created: false };
  }
  const visitors = state.cats.filter((cat) => !cat.demo).length;
  if (visitors >= MAX_VISITORS) return { ok: false, error: "The garden is full" };
  const cat = createCat({
    id: input.id,
    name: input.name,
    description: input.description,
    color: input.color ?? colorFromId(input.id),
    pattern: patternFromId(input.id),
    tokenHash: input.tokenHash,
    demo: false,
    now: input.now,
    x: input.spawn.x,
    y: input.spawn.y,
    targetX: input.goal.x,
    targetY: input.goal.y,
  });
  cat.goal = "wander";
  cat.githubId = githubId;
  cat.githubLogin = githubLogin;
  cat.avatarUrl = avatarUrl;
  state.cats.push(cat);
  return { ok: true, catId: cat.id, created: true };
}
