"use client";

import { useEffect, useState, type ReactNode } from "react";
import { LottieSlot } from "./LottieSlot";
import { emitMoment } from "@/lib/prompts";

const SEEN_PREFIX = "tx-seen:";

/** True the first time `key` is asked about in this browser. Storage can be blocked, in which case it is never "new" so nothing nags. */
export function useFirstTime(key: string | null) {
  const [first, setFirst] = useState(false);
  useEffect(() => {
    if (!key) return;
    try {
      if (!localStorage.getItem(SEEN_PREFIX + key)) setFirst(true);
    } catch {
      /* private mode: stay quiet */
    }
  }, [key]);
  const markSeen = () => {
    try {
      if (key) localStorage.setItem(SEEN_PREFIX + key, "1");
    } catch {
      /* ignore */
    }
    setFirst(false);
  };
  return [first, markSeen] as const;
}

/** A small "something good happened" card: one animation, one line, one way out. */
export default function CelebrationCard({
  lottie,
  title,
  children,
  onClose,
  closeLabel = "Nice",
  className = "",
}: {
  lottie: string;
  title: ReactNode;
  children?: ReactNode;
  onClose: () => void;
  closeLabel?: string;
  className?: string;
}) {
  useEffect(() => emitMoment("celebrate"), []);
  return (
    <div role="status" className={`flex items-center gap-4 border-2 border-ink bg-yellow/40 p-3 shadow-[3px_3px_0_var(--ink)] ${className}`}>
      <LottieSlot src={lottie} label="" loop={false} className="h-24 w-24 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{title}</p>
        {children && <p className="text-xs text-muted">{children}</p>}
      </div>
      <button type="button" onClick={onClose} className="text-sm underline underline-offset-4">{closeLabel}</button>
    </div>
  );
}
