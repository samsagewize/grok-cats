"use server";

import { headers } from "next/headers";

import { currentGithub, getAuth } from "@/auth";
import { botLine } from "@/lib/bot-line";
import { cleanColor, cleanName } from "@/lib/text";
import { adoptGithubCat } from "@/server/world-service";

export async function signInWithGithub(): Promise<void> {
  const auth = getAuth();
  if (!auth) return;
  await auth.signIn("github", { redirectTo: "/join" });
}

export async function signOutGithub(): Promise<void> {
  const auth = getAuth();
  if (!auth) return;
  await auth.signOut({ redirectTo: "/join" });
}

export type SaveGithubCatResult =
  | { ok: true; line: string; catId: string; created: boolean }
  | { ok: false; error: string };

export async function saveGithubCat(formData: FormData): Promise<SaveGithubCatResult> {
  const user = await currentGithub();
  if (!user) return { ok: false, error: "Sign in with GitHub first" };
  const name = cleanName(formData.get("name"));
  if (!name) return { ok: false, error: "Name is required (1–20 characters)" };
  const color = cleanColor(formData.get("color"));
  if (!color.ok) return { ok: false, error: color.error };
  const result = await adoptGithubCat({
    githubId: user.githubId,
    githubLogin: user.githubLogin,
    avatarUrl: user.avatarUrl,
    name,
    color: color.value,
  });
  if (!result.ok) return { ok: false, error: result.error };
  const line = botLine(await requestBaseUrl(), result.catId, result.token);
  return { ok: true, line, catId: result.catId, created: result.created };
}

async function requestBaseUrl(): Promise<string> {
  const configured = process.env.AUTH_URL?.trim().replace(/\/+$/, "");
  if (configured && /^https?:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(configured)) return configured;
  const headerStore = await headers();
  const rawHost = (headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "grok-cats.vercel.app")
    .split(",")[0]
    .trim()
    .toLowerCase();
  if (!/^[a-z0-9.-]+(?::\d+)?$/.test(rawHost)) return "https://grok-cats.vercel.app";
  const proto = (headerStore.get("x-forwarded-proto") ?? "").split(",")[0].trim().toLowerCase();
  const https = proto === "https" || (!proto && !rawHost.startsWith("localhost") && !rawHost.startsWith("127.0.0.1"));
  return `${https ? "https" : "http"}://${rawHost}`;
}
