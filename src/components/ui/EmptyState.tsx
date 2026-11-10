import type { ReactNode } from "react";
import { LottieSlot } from "./LottieSlot";
import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon } from "@hugeicons/core-free-icons";

// What a list says when there is nothing in it yet. Friendly, and points to a next step.
export default function EmptyState({
  title,
  children,
  action,
  animated = true,
  lottie = "/lottie/empty.json",
}: {
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  /** Show the idle ghost. Turn off for tight spaces. */
  animated?: boolean;
  /** Which animation to show. Defaults to the idle ghost. */
  lottie?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-[24px] border-2 border-ink bg-white px-6 py-12 text-center shadow-[5px_5px_0_var(--pink)]">
      <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full border-[18px] border-pink/30" />
      {animated && (
        <LottieSlot src={lottie} label="" className="mx-auto mb-2 h-36 w-36" fallback={<span className="grid h-20 w-20 -rotate-6 place-items-center rounded-[20px] border-2 border-ink bg-yellow shadow-[3px_3px_0_var(--ink)]"><HugeiconsIcon icon={SparklesIcon} size={34} strokeWidth={1.7} /></span>} />
      )}
      <p className="font-serif text-[26px] italic leading-tight">{title}</p>
      {children && <p className="mx-auto mt-3 max-w-[420px] text-sm text-muted">{children}</p>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
