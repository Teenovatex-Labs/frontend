"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ApiError } from "@/lib/api";
import { getApplicantToken, getWindow, requestReminder, setApplicantToken, type WindowStatus } from "@/lib/admissions";
import dynamic from "next/dynamic";

const StartApplyForm = dynamic(() => import("@/components/apply/StartApplyForm"), { loading: () => <p className="text-sm text-muted">Loading…</p> });
const ApplicationPortal = dynamic(() => import("@/components/apply/ApplicationPortal"), { loading: () => <p className="text-sm text-muted">Loading…</p> });

function ApplyContent() {
  const params = useSearchParams();
  const urlToken = params.get("token");
  const [token, setToken] = useState<string | null>(null);
  const [windowStatus, setWindowStatus] = useState<WindowStatus | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (urlToken) {
      setApplicantToken(urlToken);
      setToken(urlToken);
    } else {
      setToken(getApplicantToken());
    }
  }, [urlToken]);

  useEffect(() => {
    if (token) return;
    setLoadFailed(false);
    getWindow().then(setWindowStatus).catch(() => setLoadFailed(true));
  }, [token, attempt]);

  return (
    <>
      <Header />
      <main className="wrap max-w-[640px] py-14">
        <p className="eyebrow text-rose">Admissions</p>
        <h1 className="mt-2 text-[34px] leading-[1.1] tracking-[-0.03em] md:text-[42px]">
          Apply to <span className="font-serif italic font-medium text-rose">TeenovateX.</span>
        </h1>
        <p className="mt-3 text-muted">
          A short form, a chat with Alfred, and anything you want to show us. Takes about 15 minutes.
        </p>

        <div className="mt-8">
          {token ? (
            <ApplicationPortal token={token} />
          ) : loadFailed ? (
            <div className="rounded-md border border-ink bg-pink/20 p-6 text-center">
              <h2 className="text-xl font-bold">We couldn&apos;t reach the server.</h2>
              <p className="mt-2 text-sm text-muted">Check your connection and try again. If it keeps happening, email hello@teenovatex.org.</p>
              <button type="button" onClick={() => setAttempt((n) => n + 1)} className="btn-secondary mt-4 text-sm">Try again</button>
            </div>
          ) : windowStatus === null ? (
            <p className="text-sm text-muted">Loading…</p>
          ) : windowStatus.state === "open" ? (
            <StartApplyForm />
          ) : (
            <ClosedNotice nextOpensAt={windowStatus.next_opens_at} />
          )}
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          Already applied?{" "}
          <Link href="/apply/status" className="font-semibold text-ink underline underline-offset-4">
            Find your application
          </Link>
        </p>
      </main>
      <Footer />
    </>
  );
}

function ClosedNotice({ nextOpensAt }: { nextOpensAt: string | null }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remind = async () => {
    if (!email.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await requestReminder(email.trim());
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-md border border-ink bg-pink/20 p-6 text-center">
      <h2 className="text-xl font-bold">Applications are closed right now.</h2>
      {nextOpensAt && (
        <p className="mt-2 text-sm text-muted">The next window opens {new Date(nextOpensAt).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}.</p>
      )}
      {sent ? (
        <p className="mt-3 text-sm font-medium">We'll email you when applications open.</p>
      ) : (
        <div className="mt-4 flex justify-center gap-2">
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email" className="w-56 rounded-md border border-ink bg-cream px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose" />
          <button type="button" onClick={remind} disabled={busy} className="btn-secondary text-sm disabled:opacity-60">Notify me</button>
        </div>
      )}
      {error && <p className="mt-2 text-sm text-rose">{error}</p>}
    </div>
  );
}

export default function ApplyPage() {
  return (
    <Suspense fallback={null}>
      <ApplyContent />
    </Suspense>
  );
}
