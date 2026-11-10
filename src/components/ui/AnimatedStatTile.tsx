"use client";

import type { ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Award01Icon, FireIcon, SparklesIcon } from "@hugeicons/core-free-icons";
import { LottieSlot } from "./LottieSlot";

const TONES = { yellow: "bg-yellow", pink: "bg-pink", cream: "bg-cream", white: "bg-white" } as const;
const ANIMATIONS = {
  points: { src: "/lottie/points-earned.json", icon: SparklesIcon },
  rank: { src: "/lottie/rank-up.json", icon: Award01Icon },
  streak: { src: "/lottie/streak-flame.json", icon: FireIcon },
} as const;

export default function AnimatedStatTile({
  label,
  value,
  hint,
  tone = "cream",
  animation,
  compact = false,
  className = "",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: keyof typeof TONES;
  animation?: keyof typeof ANIMATIONS;
  compact?: boolean;
  className?: string;
}) {
  const art = animation ? ANIMATIONS[animation] : null;
  return (
    <div className={`${TONES[tone]} relative overflow-hidden rounded-[20px] border border-ink shadow-[5px_5px_0_var(--ink)] transition-transform hover:-translate-y-1 md:rounded-[22px] ${compact ? "min-h-[124px] p-3 md:min-h-[178px] md:p-6" : "min-h-[155px] p-5 md:p-6"} ${className}`}>
      {art && <div className={`pointer-events-none absolute ${compact ? "right-0 top-5 h-14 w-14 md:right-2 md:top-3 md:h-24 md:w-24" : "right-2 top-2 h-20 w-20 md:right-3 md:top-2 md:h-24 md:w-24"}`}><LottieSlot src={art.src} label="" loop={false} allowSlowConnection className="h-full w-full" fallback={<span className="grid h-11 w-11 place-items-center rounded-full border border-ink/40 bg-white/60 md:h-14 md:w-14"><HugeiconsIcon icon={art.icon} size={27} strokeWidth={1.7} /></span>} /></div>}
      <p className={`relative z-10 font-bold uppercase tracking-[.1em] text-ink/75 ${compact ? "text-[10px] md:text-xs" : "text-xs"}`}>{label}</p>
      <p className={`relative z-10 font-semibold leading-none tracking-[-0.05em] tabular-nums ${compact ? "mt-12 text-[clamp(24px,7vw,32px)] md:mt-14 md:text-[44px]" : "mt-12 text-[40px] md:text-[44px]"}`}>{value}</p>
      {hint && <p className={`relative z-10 mt-2 text-xs text-ink/75 ${compact ? "hidden md:block" : ""}`}>{hint}</p>}
    </div>
  );
}
