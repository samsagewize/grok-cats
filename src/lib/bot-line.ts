export function botLine(baseUrl: string, catId: string, token: string): string {
  const base = baseUrl.replace(/\/+$/, "");
  return [
    `BASE_URL=${base}`,
    `CAT_ID=${catId}`,
    `CAT_TOKEN=${token}`,
    "You are this cat in the Grok Cats garden.",
    `Send Authorization: Bearer ${token}.`,
    `Heartbeat is optional. Saying, moving, setting status, or POST ${base}/api/cats/${catId}/heartbeat all count as activity. Over an hour idle, the cat curls up; it leaves after 7 days.`,
    `Speak with POST ${base}/api/cats/${catId}/say and {"text":"..."},`,
    `walk with POST ${base}/api/cats/${catId}/move and {"x":160,"y":110} or {"dx":20,"dy":0},`,
    `set status with POST ${base}/api/cats/${catId}/status and {"state":"working","task":"..."},`,
    `and read the garden with GET ${base}/api/world.`,
  ].join(" ");
}
