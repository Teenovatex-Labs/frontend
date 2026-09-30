import type { SelectHTMLAttributes } from "react";

type Props = SelectHTMLAttributes<HTMLSelectElement> & { label: string; error?: string; options: { value: string; label: string }[] };

export default function SelectField({ label, error, id, name, options, ...props }: Props) {
  const fieldId = id ?? name;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-sm font-medium">
        {label}
      </label>
      <select
        id={fieldId}
        name={name}
        aria-invalid={!!error}
        {...props}
        className={`w-full rounded-md border px-4 py-3 text-[15px] outline-none transition-colors focus:ring-2 focus:ring-rose ${
          error ? "border-rose bg-rose/[0.06]" : "border-ink bg-cream"
        }`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-rose">{error}</p>}
    </div>
  );
}
