"use client";

import { useEffect, useState } from "react";

const HINTS = ["Making sure it's really you", "Warming up your space", "Almost there"];

/** Full-screen "you're being signed in" moment. Used while a Google or email
 * sign-in resolves and again while the app loads, so the two feel like one
 * continuous wait instead of a blank pause. */
export default function SigningIn({ label = "Signing you in" }: { label?: string }) {
  const [hint, setHint] = useState(0);

  useEffect(() => {
    const t = window.setInterval(() => setHint((h) => (h + 1) % HINTS.length), 1800);
    return () => window.clearInterval(t);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-7 bg-cream px-6 text-center"
    >
      <div className="relative h-32 w-32">
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full motion-safe:animate-[spin_3.2s_linear_infinite]" aria-hidden="true">
          <circle cx="50" cy="50" r="47" fill="none" stroke="var(--pink)" strokeWidth="3" strokeDasharray="0.1 8.6" strokeLinecap="round" />
        </svg>
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 h-full w-full motion-safe:animate-[spin_5s_linear_infinite] motion-safe:[animation-direction:reverse]"
          aria-hidden="true"
        >
          <circle cx="50" cy="50" r="38" fill="none" stroke="var(--rose)" strokeWidth="2.5" strokeDasharray="0.1 11" strokeLinecap="round" />
        </svg>
        <img src="/assets/logo-nobg.svg" alt="" className="absolute inset-0 m-auto h-14 w-14 motion-safe:animate-pulse" />
      </div>

      <div>
        <p className="font-serif text-[30px] italic leading-tight">{label}</p>
        <p key={hint} className="mt-2 text-sm text-muted motion-safe:animate-[fade-up_0.4s_ease-out]">
          {HINTS[hint]}
        </p>
      </div>
    </div>
  );
}
