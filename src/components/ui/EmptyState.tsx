import type { ReactNode } from "react";
import { LottieSlot } from "./LottieSlot";

// What a list says when there is nothing in it yet. Friendly, and points to a next step.
export default function EmptyState({
  title,
  children,
  action,
  animated = true,
}: {
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  /** Show the idle ghost. Turn off for tight spaces. */
  animated?: boolean;
}) {
  return (
    <div className="border border-dashed border-ink px-6 py-12 text-center">
      {animated && (
        <LottieSlot src="/lottie/empty.json" label="" className="mx-auto mb-2 h-36 w-36" />
      )}
      <p className="font-serif text-[26px] italic leading-tight">{title}</p>
      {children && <p className="mx-auto mt-3 max-w-[420px] text-sm text-muted">{children}</p>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
