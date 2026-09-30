"use client";

import { useState, type FormEvent } from "react";

import { Button, Field, Notice, inputClass } from "@/components/studio/ui";

export function SignInForm({ destination, expired }: { destination: string; expired: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/studio/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: form.get("username"), password: form.get("password") }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setError(body.detail ?? "Those details didn't work.");
        setBusy(false);
        return;
      }
      // A full load, so every Studio page starts from the new session.
      window.location.assign(destination);
    } catch {
      setError("The Studio couldn't be reached. Check your connection and try again.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      {expired && !error ? (
        <Notice tone="info">Your session ended. Sign in again to carry on.</Notice>
      ) : null}
      {error ? <Notice tone="danger">{error}</Notice> : null}
      <Field label="Account name" htmlFor="username">
        <input
          id="username"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          autoFocus
          className={inputClass}
        />
      </Field>
      <Field label="Password" htmlFor="password">
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </Field>
      <Button type="submit" variant="primary" busy={busy} className="w-full">
        Sign in
      </Button>
    </form>
  );
}
