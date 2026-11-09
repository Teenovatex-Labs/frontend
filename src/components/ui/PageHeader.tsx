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
    <header className="flex flex-wrap items-end justify-between gap-4 md:gap-5">
      <div>
        <p className="eyebrow text-rose">{eyebrow}</p>
        <h1 className="mt-3 text-[clamp(37px,10vw,48px)] leading-[.99] tracking-[-.045em] md:text-[56px] md:leading-[1.05]">
          {title} {accent && <span className="font-serif font-normal italic">{accent}</span>}
        </h1>
        {children && <p className="mt-3 max-w-[520px] text-sm leading-relaxed text-muted md:text-base">{children}</p>}
      </div>
      {action}
    </header>
  );
}
