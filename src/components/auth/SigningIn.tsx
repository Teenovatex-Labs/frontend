"use client";

import { useEffect, useState } from "react";
import { LottieSlot } from "@/components/ui/LottieSlot";

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
      <LottieSlot
        src="/lottie/loading-ghost.json"
        label=""
        poster="/assets/logo-nobg.svg"
        className="h-44 w-44"
      />

      <div>
        <p className="font-serif text-[30px] italic leading-tight">{label}</p>
        <p key={hint} className="mt-2 text-sm text-muted motion-safe:animate-[fade-up_0.4s_ease-out]">
          {HINTS[hint]}
        </p>
      </div>
    </div>
  );
}
