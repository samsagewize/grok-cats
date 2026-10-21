import { NextResponse } from "next/server";

const CORS: Record<string, string> = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type, authorization, x-grok-cats-invite, x-invite-code",
  "cache-control": "no-store",
};

export function json(data: unknown, status = 200, extra?: Record<string, string>) {
  return NextResponse.json(data, { status, headers: { ...CORS, ...extra } });
}

export function options() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function readBody(
  request: Request,
): Promise<{ ok: true; value: Record<string, unknown> } | { ok: false; response: Response }> {
  const raw = await request.text();
  if (raw.length > 8000) return { ok: false, response: json({ error: "Body too large" }, 413) };
  if (!raw.trim()) return { ok: true, value: {} };
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return { ok: false, response: json({ error: "Expected a JSON object" }, 400) };
    }
    return { ok: true, value: value as Record<string, unknown> };
  } catch {
    return { ok: false, response: json({ error: "Invalid JSON" }, 400) };
  }
}
