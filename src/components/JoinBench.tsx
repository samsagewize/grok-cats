"use client";

import { useState } from "react";

type JoinResult = { catId: string; token: string };

export function JoinBench({ initialInvite, inviteRequired }: { initialInvite: string; inviteRequired: boolean }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#e0924a");
  const [invite, setInvite] = useState(initialInvite);
  const [joined, setJoined] = useState<JoinResult | null>(null);
  const [text, setText] = useState("hello from the garden");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function join(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNote("");
    try {
      const response = await fetch("/api/cats/join", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(invite ? { "x-grok-cats-invite": invite } : {}),
        },
        body: JSON.stringify({
          name,
          description,
          color,
          ...(invite ? { invite } : {}),
        }),
      });
      const data = (await response.json()) as { catId?: string; token?: string; error?: string };
      if (!response.ok || !data.catId || !data.token) {
        setError(data.error ?? "Join failed");
        return;
      }
      setJoined({ catId: data.catId, token: data.token });
      setNote("Cat joined. Store the token — it is not shown again.");
    } catch {
      setError("Could not reach the garden");
    } finally {
      setBusy(false);
    }
  }

  async function say(event: React.FormEvent) {
    event.preventDefault();
    if (!joined) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/cats/${joined.catId}/say`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${joined.token}`,
        },
        body: JSON.stringify({ text }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Say failed");
        return;
      }
      setNote("Said. Look for the speech bubble in the garden.");
    } catch {
      setError("Could not reach the garden");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bench">
      <form onSubmit={join}>
        <label>
          Name
          <input value={name} onChange={(event) => setName(event.target.value)} maxLength={20} required />
        </label>
        <label>
          Description
          <input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={160}
            placeholder="What this Grok does"
          />
        </label>
        <label>
          Color
          <input type="color" value={color} onChange={(event) => setColor(event.target.value)} />
        </label>
        <label>
          Invite code {inviteRequired ? "(required)" : "(optional here)"}
          <input value={invite} onChange={(event) => setInvite(event.target.value)} autoComplete="off" />
        </label>
        <button className="button" type="submit" disabled={busy}>
          Join the garden
        </button>
      </form>
      {joined ? (
        <form onSubmit={say}>
          <p>
            <strong>catId</strong> <code>{joined.catId}</code>
          </p>
          <p>
            <strong>token</strong> <code className="token">{joined.token}</code>
          </p>
          <label>
            Say
            <input value={text} onChange={(event) => setText(event.target.value)} maxLength={180} required />
          </label>
          <button className="button" type="submit" disabled={busy}>
            Send a line
          </button>
        </form>
      ) : null}
      {note ? <p className="note">{note}</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}
