"use client";

import { useEffect } from "react";
import { reportBrowserError } from "@/lib/monitor";

// Shown when a page crashes. The error goes to the team (if alerts are on); the member gets a calm way out.
export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    reportBrowserError(error);
  }, [error]);

  return (
    <main className="grid min-h-[60vh] place-items-center px-6 py-16 text-center">
      <div>
        <p className="eyebrow text-rose">Something broke</p>
        <h1 className="mt-3 text-[32px] tracking-[-0.03em] md:text-[44px]">
          That wasn&rsquo;t supposed to <span className="font-serif font-normal italic">happen.</span>
        </h1>
        <p className="mx-auto mt-3 max-w-[420px] text-muted">The team has been told. Try again, and if it keeps happening, come back in a few minutes.</p>
        <div className="mt-6 flex justify-center gap-3">
          <button type="button" className="btn" onClick={reset}>Try again</button>
          <a href="/home" className="btn-secondary">Go home</a>
        </div>
      </div>
    </main>
  );
}
