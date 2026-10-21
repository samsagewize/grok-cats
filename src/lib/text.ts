import { DESCRIPTION_MAX, NAME_MAX, SAY_MAX_LEN, TASK_MAX } from "./constants";

export function stripHtml(input: string): string {
  return input
    .replace(/<\s*br\s*\/?\s*>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/[<>]/g, "")
    .replace(/&(?:amp|lt|gt|quot|#39|nbsp);/gi, (ent) => {
      const key = ent.toLowerCase();
      if (key === "&amp;") return "&";
      if (key === "&quot;") return '"';
      if (key === "&#39;") return "'";
      if (key === "&nbsp;") return " ";
      return "";
    })
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function cleanName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const name = stripHtml(raw).slice(0, NAME_MAX).trim();
  if (!name || name.length > NAME_MAX) return null;
  if (!/[\p{L}\p{N}]/u.test(name)) return null;
  return name;
}

export function cleanDescription(raw: unknown): { ok: true; value: string } | { ok: false; error: string } {
  if (raw == null) return { ok: true, value: "" };
  if (typeof raw !== "string") return { ok: false, error: "Description must be a string" };
  const value = stripHtml(raw);
  if (value.length > DESCRIPTION_MAX) {
    return { ok: false, error: `Description exceeds ${DESCRIPTION_MAX} characters` };
  }
  return { ok: true, value };
}

export function cleanColor(raw: unknown): { ok: true; value?: string } | { ok: false; error: string } {
  if (raw == null || raw === "") return { ok: true, value: undefined };
  if (typeof raw !== "string" || !/^#[0-9a-fA-F]{6}$/.test(raw.trim())) {
    return { ok: false, error: "Color must be a #rrggbb hex string" };
  }
  return { ok: true, value: raw.trim().toLowerCase() };
}

export function cleanText(raw: unknown): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof raw !== "string") return { ok: false, error: "Text must be a string" };
  const text = stripHtml(raw);
  if (!text) return { ok: false, error: "Text is empty" };
  if (text.length > SAY_MAX_LEN) {
    return { ok: false, error: `Text exceeds ${SAY_MAX_LEN} characters` };
  }
  return { ok: true, value: text };
}

export function cleanTask(raw: unknown): { ok: true; value: string } | { ok: false; error: string } {
  if (raw == null || raw === "") return { ok: true, value: "" };
  if (typeof raw !== "string") return { ok: false, error: "Task must be a string" };
  const task = stripHtml(raw);
  if (task.length > TASK_MAX) return { ok: false, error: `Task exceeds ${TASK_MAX} characters` };
  return { ok: true, value: task };
}

export function cleanStatus(raw: unknown): "idle" | "working" | "sleeping" | null {
  if (raw === "idle" || raw === "working" || raw === "sleeping") return raw;
  return null;
}
