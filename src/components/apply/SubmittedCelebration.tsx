"use client";

import { LottieSlot } from "@/components/ui/LottieSlot";

const COLORS = ["bg-yellow", "bg-pink", "bg-rose", "bg-ink"];

/** Confetti pieces are decided once by index, so the burst looks scattered but never re-randomises on re-render. */
const PIECES = Array.from({ length: 28 }, (_, i) => ({
  left: (i * 37) % 100,
  delay: ((i * 53) % 90) / 100,
  duration: 1.8 + ((i * 29) % 12) / 10,
  size: 6 + ((i * 11) % 6),
  color: COLORS[i % COLORS.length],
  rotate: (i * 47) % 360,
}));

/** Shown right after a successful submit. The words matter more than the animation: submitting is not acceptance. */
export default function SubmittedCelebration({ name, reference, decisionDate }: { name: string; reference: string; decisionDate: string }) {
  const first = name.trim().split(/\s+/)[0] || "there";
  const date = new Date(decisionDate).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
  return (
    <section aria-live="polite" className="relative overflow-hidden rounded-md border border-ink bg-yellow/40 p-6 text-center">
      <div aria-hidden className="confetti pointer-events-none absolute inset-0">
        {PIECES.map((p, i) => (
          <span
            key={i}
            className={`confetti-piece absolute top-0 block rounded-[2px] ${p.color}`}
            style={{ left: `${p.left}%`, width: p.size, height: p.size * 1.6, animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s`, transform: `rotate(${p.rotate}deg)` }}
          />
        ))}
      </div>
      <div className="relative">
        <LottieSlot src="/lottie/success.json" label="" loop={false} className="mx-auto h-28 w-28" />
        <h2 className="mt-1 text-2xl font-bold">You did it, {first}!</h2>
        <p className="mt-2 text-[15px]">Your application is in. Alfred is very proud of you.</p>
        <p className="mt-3 inline-block rounded-md border border-ink bg-cream px-3 py-1.5 text-sm font-semibold">Reference {reference}</p>
        <p className="mx-auto mt-4 max-w-[440px] rounded-md border border-ink bg-white p-3 text-sm">
          <strong>Submitting is not an acceptance.</strong> Reviewers will read your application, and results are released together on <strong>{date}</strong>. We&apos;ll email you.
        </p>
        <p className="mt-3 text-sm text-muted">You can still edit your answers until a reviewer starts on your application.</p>
      </div>
    </section>
  );
}
