import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string };

export default function FormField({ label, error, id, name, ...props }: Props) {
  const fieldId = id ?? name;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={fieldId}
        name={name}
        {...props}
        className="rounded-md border border-ink bg-cream px-4 py-3 text-[15px] outline-none transition-shadow focus:ring-2 focus:ring-rose"
      />
      {error && <p className="text-xs text-rose">{error}</p>}
    </div>
  );
}
