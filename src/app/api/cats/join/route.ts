import { json, options, readBody } from "@/server/http";
import { checkInvite, inviteFrom } from "@/server/auth";
import { joinCat } from "@/server/world-service";
import { cleanColor, cleanDescription, cleanName } from "@/lib/text";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function OPTIONS() {
  return options();
}

export async function POST(request: Request) {
  const body = await readBody(request);
  if (!body.ok) return body.response;
  const invite = checkInvite(inviteFrom(request, body.value));
  if (!invite.ok) return json({ error: invite.error }, 401);
  const name = cleanName(body.value.name);
  if (!name) return json({ error: "Name is required (1–20 characters)" }, 400);
  const description = cleanDescription(body.value.description);
  if (!description.ok) return json({ error: description.error }, 400);
  const color = cleanColor(body.value.color);
  if (!color.ok) return json({ error: color.error }, 400);
  const result = await joinCat({ name, description: description.value, color: color.value });
  if (!result.ok) return json({ error: result.error }, result.status);
  return json({ catId: result.catId, token: result.token }, 201);
}
