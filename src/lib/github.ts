export function safeGithubLogin(login: string | undefined): string {
  if (!login) return "";
  return /^[A-Za-z0-9-]{1,39}$/.test(login) ? login : "";
}

export function safeAvatar(url: string | undefined): string {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" || parsed.hostname !== "avatars.githubusercontent.com") return "";
    if (parsed.username || parsed.password) return "";
    return parsed.toString().slice(0, 300);
  } catch {
    return "";
  }
}

export function safeGithubId(id: string | undefined): string {
  if (!id || !/^\d{1,20}$/.test(id)) return "";
  return id;
}
