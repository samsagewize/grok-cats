import { json, options, readBody } from "@/server/http";
import { heartbeat } from "@/server/world-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function OPTIONS() {
  return options();
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = await readBody(request);
    if (!body.ok) return body.response;
  }
  const result = await heartbeat(id, request);
  if (!result.ok) return json({ error: result.error }, result.status);
  return json({ ok: true, lastHeartbeat: result.lastHeartbeat });
}
