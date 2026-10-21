import { createHash, timingSafeEqual } from "node:crypto";

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function tokenMatches(token: string, hash: string): boolean {
  const got = createHash("sha256").update(token).digest();
  const expected = Buffer.from(hash, "hex");
  if (expected.length !== got.length) return false;
  return timingSafeEqual(got, expected);
}

export function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(\S+)$/i.exec(header.trim());
  return match?.[1] ?? null;
}

export function inviteFrom(request: Request, body: Record<string, unknown>): string {
  const header = request.headers.get("x-grok-cats-invite") ?? request.headers.get("x-invite-code") ?? "";
  const fromBody = typeof body.invite === "string" ? body.invite : "";
  return (fromBody || header).trim();
}

export function checkInvite(provided: string): { ok: true } | { ok: false; error: string } {
  const expected = process.env.GROK_CATS_INVITE_CODE;
  if (!expected) return { ok: true };
  if (!provided) return { ok: false, error: "Invite code required" };
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return { ok: false, error: "Invalid invite code" };
  }
  return { ok: true };
}
