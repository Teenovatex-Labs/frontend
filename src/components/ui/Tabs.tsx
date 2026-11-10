"use client";

import { useId } from "react";

export type TabOption<T extends string> = { id: T; label: string };

// Pill tabs (same look as the contact topics). Controlled: the parent owns the value.
export default function Tabs<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: TabOption<T>[];
  value: T;
  onChange: (id: T) => void;
  label: string;
}) {
  const group = useId();
  return (
    <div role="group" aria-label={label} id={group} className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 py-1 sm:mx-0 sm:flex-wrap sm:px-0">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          aria-pressed={value === o.id}
          className={`min-h-11 shrink-0 snap-start rounded-full border border-ink px-4 py-2 text-sm font-semibold transition-[transform,background-color,box-shadow] duration-200 active:scale-[.96] ${
            value === o.id ? "bg-ink text-cream shadow-[3px_3px_0_var(--pink)]" : "hover:-translate-y-0.5 hover:bg-yellow"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
