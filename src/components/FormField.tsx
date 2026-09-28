import { useEffect, useRef, useState, type InputHTMLAttributes } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ViewIcon, ViewOffIcon } from "@hugeicons/core-free-icons";

type Props = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string };

export default function FormField({ label, error, id, name, type, ...props }: Props) {
  const fieldId = id ?? name;
  const isPassword = type === "password";
  const [revealed, setRevealed] = useState(false);

  // Retriggers the shake every time a *new* error lands on this field —
  // including the same message twice in a row (e.g. wrong password again) —
  // by remounting the shaking wrapper via `key`. A plain className toggle
  // wouldn't restart a CSS animation that's already at rest.
  const [shakeKey, setShakeKey] = useState(0);
  const prevError = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (error) setShakeKey((k) => k + 1);
    prevError.current = error;
  }, [error]);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <div key={shakeKey} className={error ? "step-shake" : ""}>
          <input
            id={fieldId}
            name={name}
            type={isPassword && revealed ? "text" : type}
            aria-invalid={!!error}
            {...props}
            className={`w-full rounded-md border px-4 py-3 text-[15px] outline-none transition-colors focus:ring-2 focus:ring-rose ${
              error ? "border-rose bg-rose/[0.06]" : "border-ink bg-cream"
            } ${isPassword ? "pr-11" : ""}`}
          />
        </div>
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            aria-label={revealed ? "Hide password" : "Show password"}
            aria-pressed={revealed}
            tabIndex={-1}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted transition-colors hover:text-ink"
          >
            <HugeiconsIcon icon={revealed ? ViewOffIcon : ViewIcon} size={18} />
          </button>
        )}
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
