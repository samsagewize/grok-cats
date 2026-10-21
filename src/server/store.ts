import { LOCK_KEY, STATE_KEY } from "@/lib/constants";
import { createSeed, tick } from "@/lib/sim";
import type { WorldState } from "@/lib/types";

type RedisConfig = { url: string; token: string };

let memory: WorldState | null = null;
let chain: Promise<unknown> = Promise.resolve();
let redisDown = false;

function redisConfig(): RedisConfig | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url: url.replace(/\/$/, ""), token };
}

async function redisCommand(...args: (string | number)[]): Promise<unknown> {
  const cfg = redisConfig();
  if (!cfg) throw new Error("redis not configured");
  const response = await fetch(cfg.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`redis ${response.status}`);
  const data = (await response.json()) as { result?: unknown; error?: string };
  if (data.error) throw new Error(data.error);
  return data.result;
}

function parseState(raw: string): WorldState | null {
  try {
    const data = JSON.parse(raw) as WorldState;
    if (!data || data.version !== 1 || !Array.isArray(data.cats) || !Array.isArray(data.messages)) return null;
    return data;
  } catch {
    return null;
  }
}

async function load(): Promise<WorldState> {
  if (redisConfig() && !redisDown) {
    try {
      const raw = await redisCommand("GET", STATE_KEY);
      if (typeof raw === "string" && raw) {
        const parsed = parseState(raw);
        if (parsed) {
          memory = parsed;
          return parsed;
        }
      }
    } catch (error) {
      redisDown = true;
      console.error("grok-cats redis unavailable, using memory", error);
    }
  }
  if (!memory) memory = createSeed(Date.now());
  return memory;
}

async function save(state: WorldState) {
  memory = state;
  if (!redisConfig() || redisDown) return;
  try {
    await redisCommand("SET", STATE_KEY, JSON.stringify(state));
  } catch (error) {
    redisDown = true;
    console.error("grok-cats redis write failed, using memory", error);
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function updateState<T>(mutator: (state: WorldState) => T): Promise<T> {
  const run = chain.then(async () => {
    let locked = false;
    try {
      if (redisConfig() && !redisDown) {
        for (let attempt = 0; attempt < 12; attempt++) {
          const result = await redisCommand("SET", LOCK_KEY, "1", "NX", "EX", "3");
          if (result === "OK") {
            locked = true;
            break;
          }
          await delay(40 + attempt * 25);
        }
      }
      const state = structuredClone(await load());
      tick(state, Date.now());
      const result = mutator(state);
      await save(state);
      return result;
    } finally {
      if (locked) await redisCommand("DEL", LOCK_KEY).catch(() => undefined);
    }
  });
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}
