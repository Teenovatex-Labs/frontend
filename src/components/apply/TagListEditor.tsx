"use client";

import { useState, type KeyboardEvent } from "react";
import { XIcon } from "@animateicons/react/lucide/x-icon";

const MAX_ITEMS = 16;

/** A simple "type and press Enter" list of short tags, e.g. interests or skills. */
export default function TagListEditor({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const v = draft.trim();
    if (!v || value.length >= MAX_ITEMS || value.includes(v)) return;
    onChange([...value, v]);
    setDraft("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add();
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex flex-wrap gap-2 rounded-md border border-ink bg-cream p-2.5">
        {value.map((item) => (
          <span key={item} className="flex items-center gap-1 rounded-full border border-ink bg-white px-2.5 py-1 text-sm">
            {item}
            <button type="button" onClick={() => onChange(value.filter((v) => v !== item))} aria-label={`Remove ${item}`} className="text-muted hover:text-rose">
              <XIcon size={12} />
            </button>
          </span>
        ))}
        {value.length < MAX_ITEMS && (
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={add}
            placeholder={placeholder}
            className="min-w-[120px] flex-1 bg-transparent px-1 py-1 text-sm outline-none"
          />
        )}
      </div>
    </div>
  );
}
