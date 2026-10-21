import type { NextRequest } from "next/server";

import { getAuth, githubAuthConfigured } from "@/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function missing(): Response {
  return new Response("GitHub sign-in is not configured", { status: 404 });
}

export function GET(request: NextRequest) {
  if (!githubAuthConfigured()) return missing();
  const auth = getAuth();
  if (!auth) return missing();
  return auth.handlers.GET(request);
}

export function POST(request: NextRequest) {
  if (!githubAuthConfigured()) return missing();
  const auth = getAuth();
  if (!auth) return missing();
  return auth.handlers.POST(request);
}
