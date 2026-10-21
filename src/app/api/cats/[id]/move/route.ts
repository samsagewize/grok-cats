import { json, options, readBody } from "@/server/http";
import { moveCat } from "@/server/world-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function OPTIONS() {
  return options();
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await readBody(request);
  if (!body.ok) return body.response;
  const result = await moveCat(id, request, body.value);
  if (!result.ok) return json({ error: result.error }, result.status);
  return json({
    ok: true,
    x: result.x,
    y: result.y,
    targetX: result.targetX,
    targetY: result.targetY,
  });
}
