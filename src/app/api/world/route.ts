import type { NextRequest } from "next/server";

import { json, options } from "@/server/http";
import { readWorld } from "@/server/world-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function OPTIONS() {
  return options();
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("since");
  const parsed = raw == null ? 0 : Number(raw);
  const since = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  const world = await readWorld(since);
  return json(world);
}
