"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ApiError } from "@/lib/api";
import { answerOffer, getOffer, type OfferView } from "@/lib/admissions";

function OfferContent() {
  const token = useSearchParams().get("token");
  const [offer, setOffer] = useState<OfferView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<null | boolean>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("This link is missing its code. Open the link from your email again.");
      return;
    }
    getOffer(token).then(setOffer).catch((err) => setError(err instanceof ApiError ? err.message : "We couldn't load this offer."));
  }, [token]);

  const answer = async (accept: boolean) => {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      await answerOffer(token, accept);
      setDone(accept);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Header />
      <main className="wrap max-w-[560px] py-14">
        <p className="eyebrow text-rose">Waitlist</p>
        <h1 className="mt-2 text-[32px] leading-[1.1] tracking-[-0.03em]">A place has opened up.</h1>
        <div className="mt-6 rounded-md border border-ink bg-pink/20 p-6">
          {error && !offer ? (
            <p className="text-sm text-rose">{error}</p>
          ) : !offer ? (
            <p className="text-sm text-muted">Loading…</p>
          ) : done !== null ? (
            <p className="font-semibold">{done ? "Wonderful. Check your inbox for your invitation to create an account." : "Thanks for letting us know. We have passed the place on."}</p>
          ) : offer.state === "pending" ? (
            <>
              <p>Hi {offer.first_name}, we would like to offer you a place in TeenovateX.</p>
              {offer.expires_at && <p className="mt-2 text-sm text-muted">Please answer by {new Date(offer.expires_at).toLocaleString()}. After that, the place goes to the next person.</p>}
              {error && <p className="mt-3 text-sm text-rose">{error}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => answer(true)} disabled={busy} className="btn disabled:opacity-60">Yes, I want the place</button>
                <button type="button" onClick={() => answer(false)} disabled={busy} className="btn-secondary disabled:opacity-60">No, thank you</button>
              </div>
            </>
          ) : offer.state === "expired" ? (
            <p>This offer has expired and the place has gone to the next person. You can reapply in a later window.</p>
          ) : (
            <p>You have already answered this offer ({offer.state}).</p>
          )}
        </div>
        <p className="mt-6 text-center text-sm text-muted">
          Questions? <Link href="/apply/status" className="font-semibold text-ink underline underline-offset-4">Find your application</Link>
        </p>
      </main>
      <Footer />
    </>
  );
}

export default function OfferPage() {
  return (
    <Suspense fallback={null}>
      <OfferContent />
    </Suspense>
  );
}
