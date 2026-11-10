import type { ReactNode } from "react";

// The top of every app page: a small label, a big serif-accented title, and an optional action.
export default function PageHeader({
  eyebrow,
  title,
  accent,
  children,
  action,
}: {
  eyebrow: string;
  title: ReactNode;
  accent?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="tx-page-hero relative isolate flex flex-wrap items-end justify-between gap-6 overflow-hidden rounded-[28px] border-2 border-ink bg-ink px-6 py-8 text-cream shadow-[7px_7px_0_var(--pink)] sm:px-8 md:min-h-[230px] md:gap-8 md:px-10 md:py-10">
      <div aria-hidden="true" className="pointer-events-none absolute -right-14 -top-28 -z-10 h-64 w-64 rounded-full border-[32px] border-pink/20 md:right-8 md:h-80 md:w-80" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 right-20 -z-10 h-56 w-56 rounded-full border-[26px] border-yellow/15" />
      <div className="relative max-w-[680px]">
        <p className="text-[10px] font-bold uppercase tracking-[.2em] text-pink sm:text-[11px]">{eyebrow} <span className="ml-1 text-cream/40">/ TeenovateX</span></p>
        <h1 className="mt-4 text-[clamp(39px,9vw,64px)] leading-[.98] tracking-[-.055em]">
          {title} {accent && <span className="font-serif font-normal italic text-yellow">{accent}</span>}
        </h1>
        {children && <p className="mt-4 max-w-[520px] text-sm leading-relaxed text-cream/75 md:text-base">{children}</p>}
      </div>
      {action && <div className="tx-page-hero-action relative shrink-0">{action}</div>}
    </header>
  );
}
