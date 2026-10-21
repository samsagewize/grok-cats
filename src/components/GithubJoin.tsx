"use client";

import { useState, useTransition } from "react";

import { saveGithubCat, signOutGithub, type SaveGithubCatResult } from "@/server/github-actions";

const SWATCHES = ["#e07a3d", "#e0924a", "#6cba7a", "#8eb7d6", "#c986b8", "#f0d36a", "#d4656a", "#4a3b38"];

export function GithubJoin({
  login,
  avatarUrl,
  suggestedName,
  existing,
}: {
  login: string;
  avatarUrl: string;
  suggestedName: string;
  existing: { id: string; name: string; color: string } | null;
}) {
  const [name, setName] = useState(existing?.name || suggestedName);
  const [color, setColor] = useState(existing?.color || SWATCHES[0]);
  const [result, setResult] = useState<SaveGithubCatResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setCopied(false);
    startTransition(async () => {
      setResult(await saveGithubCat(formData));
    });
  }

  async function copy(line: string) {
    try {
      await navigator.clipboard.writeText(line);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="bench github-card">
      <div className="who">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" width={36} height={36} />
        ) : (
          <span className="avatar-fallback" aria-hidden>
            {login.slice(0, 1).toUpperCase()}
          </span>
        )}
        <div>
          <p className="eyebrow">Signed in</p>
          <h2>@{login}</h2>
        </div>
      </div>
      <form action={signOutGithub}>
        <button className="ghost" type="submit">
          Sign out
        </button>
      </form>
      <p>
        {existing
          ? `This GitHub account already has ${existing.name}. Saving keeps that same cat and rotates its token, so the previous token stops working.`
          : "Pick a name and a coat color. Saving creates your cat and a token for your Grok bot."}
      </p>
      <form action={onSubmit}>
        <label>
          Cat name
          <input
            name="name"
            value={name}
            maxLength={20}
            required
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <fieldset className="swatches">
          <legend>Color</legend>
          {SWATCHES.map((swatch) => (
            <label key={swatch} className={color === swatch ? "swatch on" : "swatch"}>
              <input
                type="radio"
                name="color"
                value={swatch}
                checked={color === swatch}
                onChange={() => setColor(swatch)}
              />
              <span style={{ background: swatch }} />
            </label>
          ))}
        </fieldset>
        <button className="button" type="submit" disabled={pending}>
          {pending ? "Saving…" : existing ? "Rotate token for my bot" : "Create my cat"}
        </button>
      </form>
      {result && !result.ok ? <p className="error">{result.error}</p> : null}
      {result && result.ok ? (
        <div className="instruction-block">
          <p className="note">
            {result.created ? "Your cat is in the garden." : "Token rotated. Paste this new line into your Grok bot."}{" "}
            One line, with the garden URL and this cat&apos;s token.
          </p>
          <p className="instruction">{result.line}</p>
          <button className="ghost" type="button" onClick={() => copy(result.line)}>
            {copied ? "Copied" : "Copy line"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
