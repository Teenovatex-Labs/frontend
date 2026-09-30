import { useEffect, useRef, useState, type TextareaHTMLAttributes } from "react";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string; maxLength: number };

export default function TextAreaField({ label, error, id, name, value, maxLength, ...props }: Props) {
  const fieldId = id ?? name;
  const length = String(value ?? "").length;

  // Same trick as FormField: remount the shaking wrapper on each new error
  // so the animation replays even for an identical message.
  const [shakeKey, setShakeKey] = useState(0);
  const prevError = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (error) setShakeKey((k) => k + 1);
    prevError.current = error;
  }, [error]);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <label htmlFor={fieldId} className="text-sm font-medium">
          {label}
        </label>
        <span className={`text-xs tabular-nums ${length > maxLength * 0.9 ? "text-rose" : "text-muted"}`}>
          {length} / {maxLength}
        </span>
      </div>
      <div className="relative">
        <div key={shakeKey} className={error ? "step-shake" : ""}>
          <textarea
            id={fieldId}
            name={name}
            value={value}
            maxLength={maxLength}
            aria-invalid={!!error}
            {...props}
            className={`w-full resize-none rounded-md border px-4 py-3 text-[15px] leading-[1.7] outline-none transition-colors focus:ring-2 focus:ring-rose ${
              error ? "border-rose bg-rose/[0.06]" : "border-ink bg-cream"
            }`}
          />
        </div>
        {error && (
          <div key={`bubble-${shakeKey}`} className="error-pop absolute left-0 top-[calc(100%+9px)] z-20 max-w-full">
            <span className="absolute -top-[5px] left-4 h-[9px] w-[9px] rotate-45 rounded-[2px] bg-rose" />
            <p className="relative rounded-md bg-rose px-3 py-1.5 text-xs font-medium text-cream shadow-[0_4px_14px_rgba(141,53,91,0.35)]">
              {error}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
