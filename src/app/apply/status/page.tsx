"use client";

import { useState, type FormEvent } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FormField from "@/components/FormField";
import { ApiError } from "@/lib/api";
import { lookupApplication } from "@/lib/admissions";

export default function ApplyStatusPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await lookupApplication(email.trim());
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Header />
      <main className="wrap max-w-[480px] py-14">
        <p className="eyebrow text-rose">Admissions</p>
        <h1 className="mt-2 text-[32px] leading-[1.1] tracking-[-0.03em]">Find your application</h1>
        <p className="mt-3 text-muted">Lost your link? Enter the email you applied with and we'll send a fresh one.</p>

        {sent ? (
          <div className="mt-6 rounded-md border border-ink bg-pink/20 p-5 text-center">
            <p className="font-semibold">Check your inbox.</p>
            <p className="mt-1 text-sm text-muted">If that email has an application or account, we've sent you a link.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-3.5">
            <FormField label="Email" type="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
            {error && <p className="text-sm text-rose">{error}</p>}
            <button type="submit" disabled={busy} className="btn justify-center disabled:opacity-60">
              {busy ? "Sending…" : "Send my link"}
            </button>
          </form>
        )}
      </main>
      <Footer />
    </>
  );
}
