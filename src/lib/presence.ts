import { IDLE_SLEEP_MS } from "./constants";

export function isIdleAsleep(cat: { demo: boolean; lastHeartbeat: number }, now: number): boolean {
  return !cat.demo && now - cat.lastHeartbeat > IDLE_SLEEP_MS;
}
