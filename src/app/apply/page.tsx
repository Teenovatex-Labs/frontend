"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TestBanner from "@/components/apply/TestBanner";
import { ApiError } from "@/lib/api";
import { getApplicantToken, getWindow, requestReminder, setApplicantToken, type WindowStatus } from "@/lib/admissions";
import dynamic from "next/dynamic";

const StartApplyForm = dynamic(() => import("@/components/apply/StartApplyForm"), { loading: () => <p className="text-sm text-muted">Loading…</p> });
const ApplicationPortal = dynamic(() => import("@/components/apply/ApplicationPortal"), { loading: () => <p className="text-sm text-muted">Loading…</p> });

function ApplyContent() {
  const params = useSearchParams();
  const urlToken = params.get("token");
  // A private test link (?test=KEY) opens the rehearsal window instead of the real one.
  const testKey = params.get("test");
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
    getWindow(testKey).then(setWindowStatus).catch(() => setLoadFailed(true));
  }, [token, attempt, testKey]);

  return (
    <>
      <Header />
      <main className={`wrap py-14 ${token ? "max-w-[920px]" : "max-w-[640px]"}`}>
        <p className="eyebrow text-rose">Admissions</p>
        <h1 className="mt-2 text-[34px] leading-[1.1] tracking-[-0.03em] md:text-[42px]">
          Apply to <span className="font-serif italic font-medium text-rose">TeenovateX.</span>
        </h1>
        <p className="mt-3 text-muted">
          Tell us a little about yourself, then meet Alfred. He follows your answers and asks questions that fit you. No portfolio or previous project is required; most people finish in about 15 minutes.
        </p>
        <p className="mt-2 text-sm text-muted">Alfred helps us understand your curiosity. People review every application and make the final decision.</p>

        <div className="mt-8">
          {(testKey || windowStatus?.window?.is_test) && !token && <TestBanner />}
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
            <StartApplyForm testKey={testKey} />
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

function Countdown({ to }: { to: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  const ms = new Date(to).getTime() - now;
  if (!(ms > 0)) return null;
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const parts = [[d, "days"], [h, "hours"], [m, "minutes"]] as const;
  return (
    <div className="mt-4 flex justify-center gap-2" role="timer" aria-label={`Applications open in ${d} days, ${h} hours, ${m} minutes`}>
      {parts.map(([n, label]) => (
        <div key={label} className="min-w-[64px] rounded-md border border-ink bg-cream px-3 py-2">
          <p className="font-display text-2xl leading-none tabular-nums">{n}</p>
          <p className="mt-1 text-[11px] uppercase tracking-wide text-muted">{label}</p>
        </div>
      ))}
    </div>
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
      {nextOpensAt && <Countdown to={nextOpensAt} />}
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
