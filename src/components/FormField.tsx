import { useState, type InputHTMLAttributes } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ViewIcon, ViewOffIcon } from "@hugeicons/core-free-icons";

type Props = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string };

export default function FormField({ label, error, id, name, type, ...props }: Props) {
  const fieldId = id ?? name;
  const isPassword = type === "password";
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <input
          id={fieldId}
          name={name}
          type={isPassword && revealed ? "text" : type}
          {...props}
          className={`w-full rounded-md border border-ink bg-cream px-4 py-3 text-[15px] outline-none transition-shadow focus:ring-2 focus:ring-rose ${isPassword ? "pr-11" : ""}`}
        />
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
      </div>
      {error && <p className="text-xs text-rose">{error}</p>}
    </div>
  );
}
