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
    <div role="group" aria-label={label} id={group} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          aria-pressed={value === o.id}
          className={`rounded-full border border-ink px-3.5 py-1.5 text-sm font-semibold transition-all ${
            value === o.id ? "bg-ink text-cream shadow-[3px_3px_0_var(--pink)]" : "hover:-translate-y-0.5 hover:bg-yellow"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
