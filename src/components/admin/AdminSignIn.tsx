"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";

// The front door of the admin console. Staff only, so there is no sign-up, no Google button and no
// member marketing here. Whether the account is really staff is decided by the server.
export default function AdminSignIn() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email.trim(), password, false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-cream px-5 py-16">
      <form onSubmit={submit} className="w-full max-w-[400px] border border-ink bg-white p-7 shadow-[6px_6px_0_var(--ink)]">
        <p className="font-semibold tracking-tight">
          TeenovateX <span className="font-serif font-normal italic text-rose">Admin</span>
        </p>
        <h1 className="mt-5 text-[30px] leading-tight tracking-[-0.03em]">Team sign in</h1>
        <p className="mt-2 text-sm text-muted">For moderators and admins only.</p>

        <label className="mt-6 block text-sm font-medium">
          Email
          <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 w-full rounded-md border border-ink bg-white px-3 py-2.5 text-[15px]" />
        </label>
        <label className="mt-4 block text-sm font-medium">
          Password
          <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5 w-full rounded-md border border-ink bg-white px-3 py-2.5 text-[15px]" />
        </label>

        {error && <p role="alert" className="mt-4 text-sm text-rose">{error}</p>}
        <button type="submit" disabled={busy || !email || !password} className="btn mt-6 w-full disabled:opacity-60">
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <p className="mt-5 text-xs text-muted">Not on the team? The member app is at app.teenovatex.org.</p>
      </form>
    </main>
  );
}
