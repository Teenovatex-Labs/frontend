import type { ReactNode } from "react";

const TONES = { yellow: "bg-yellow", pink: "bg-pink", cream: "bg-cream", white: "bg-white" } as const;

export default function StatTile({
  label,
  value,
  hint,
  tone = "cream",
  className = "",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: keyof typeof TONES;
  className?: string;
}) {
  return (
    <div className={`${TONES[tone]} border border-ink p-5 shadow-[5px_5px_0_var(--ink)] transition-transform hover:-translate-y-1 md:p-6 ${className}`}>
      <p className="eyebrow text-ink/60">{label}</p>
      <p className="mt-3 text-[40px] font-semibold leading-none tracking-[-0.05em] tabular-nums md:text-[44px]">{value}</p>
      {hint && <p className="mt-2 text-xs text-ink/60">{hint}</p>}
    </div>
  );
}
