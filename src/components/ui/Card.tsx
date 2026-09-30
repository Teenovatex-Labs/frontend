import type { HTMLAttributes } from "react";

type Tone = "cream" | "white" | "yellow" | "pink";
const TONES: Record<Tone, string> = { cream: "bg-cream", white: "bg-white", yellow: "bg-yellow", pink: "bg-pink" };

// The app's basic surface: an ink outline with a hard offset shadow.
export default function Card({
  tone = "white",
  lift = false,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement> & { tone?: Tone; lift?: boolean }) {
  return (
    <div
      {...props}
      className={`border border-ink shadow-[5px_5px_0_var(--ink)] ${TONES[tone]} ${
        lift ? "transition-transform hover:-translate-y-1" : ""
      } ${className}`}
    />
  );
}
