import NextAuth, { type NextAuthResult } from "next-auth";
import GitHub from "next-auth/providers/github";

import { safeAvatar, safeGithubId, safeGithubLogin } from "@/lib/github";

export type GithubIdentity = {
  githubId: string;
  githubLogin: string;
  avatarUrl: string;
};

declare module "next-auth" {
  interface Session {
    githubId?: string;
    githubLogin?: string;
    avatarUrl?: string;
  }
}

function present(name: string): boolean {
  return Boolean(process.env[name]?.trim());
}

export function githubAuthConfigured(): boolean {
  return present("AUTH_GITHUB_ID") && present("AUTH_GITHUB_SECRET") && present("AUTH_SECRET");
}

let kit: NextAuthResult | null = null;

export function getAuth(): NextAuthResult | null {
  if (!githubAuthConfigured()) return null;
  if (kit) return kit;
  kit = NextAuth({
    trustHost: true,
    secret: process.env.AUTH_SECRET,
    session: { strategy: "jwt" },
    pages: { error: "/join" },
    providers: [
      GitHub({
        clientId: process.env.AUTH_GITHUB_ID,
        clientSecret: process.env.AUTH_GITHUB_SECRET,
        authorization: { params: { scope: "read:user" } },
        profile(profile) {
          const login = typeof profile.login === "string" ? profile.login : "";
          return {
            id: String(profile.id),
            name: login || String(profile.id),
            email: profile.email,
            image: typeof profile.avatar_url === "string" ? profile.avatar_url : undefined,
          };
        },
      }),
    ],
    callbacks: {
      async jwt({ token, user, account }) {
        if (account?.provider === "github" && account.providerAccountId) {
          token.githubId = String(account.providerAccountId);
        }
        if (typeof user?.name === "string" && user.name) token.githubLogin = user.name;
        if (typeof user?.image === "string" && user.image) token.avatarUrl = user.image;
        return token;
      },
      async session({ session, token }) {
        session.githubId = typeof token.githubId === "string" ? token.githubId : "";
        session.githubLogin = typeof token.githubLogin === "string" ? token.githubLogin : "";
        session.avatarUrl = typeof token.avatarUrl === "string" ? token.avatarUrl : "";
        return session;
      },
    },
  });
  return kit;
}

export async function currentGithub(): Promise<GithubIdentity | null> {
  const auth = getAuth();
  if (!auth) return null;
  const session = await auth.auth();
  const githubId = safeGithubId(session?.githubId);
  const githubLogin = safeGithubLogin(session?.githubLogin);
  if (!githubId || !githubLogin) return null;
  return { githubId, githubLogin, avatarUrl: safeAvatar(session?.avatarUrl) };
}
