import { json, options, readBody } from "@/server/http";
import { parseSay, sayAsCat } from "@/server/world-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function OPTIONS() {
  return options();
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await readBody(request);
  if (!body.ok) return body.response;
  const text = parseSay(body.value);
  if (!text.ok) return json({ error: text.error }, 400);
  const result = await sayAsCat(id, request, text.value);
  if (!result.ok) {
    return json({ error: result.error }, result.status, result.status === 429 ? { "retry-after": "2" } : undefined);
  }
  return json({ ok: true, message: result.message });
}
