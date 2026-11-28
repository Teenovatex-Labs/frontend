import type { ButtonHTMLAttributes } from "react";

// The site's button, wrapping the `.btn` classes in globals.css so screens stop repeating
// `className="btn disabled:opacity-60"` and the "Saving…" label swap.
// Rules (README, "Design system: buttons"): at most one primary per view; text links inside
// sentences stay links; chips and filters are not buttons.
//
// Usage:
//   <Button type="submit" loading={save.isPending} loadingLabel="Saving…">Save</Button>
//   <Button variant="secondary" size="sm" onClick={close}>Cancel</Button>
//   <Button variant="secondary" surface="dark">Donate</Button>       // on the ink band
//   <Button icon aria-label="Back"><BackIcon /></Button>             // square, icon only
//
// `type` defaults to "button" so a Button inside a form never submits by accident;
// pass type="submit" for the form's main action.

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
  size?: "md" | "sm";
  /** Square icon-only button. Give it an aria-label. */
  icon?: boolean;
  /** Secondary buttons on the ink ("dark") or yellow band, where the default yellow would vanish. */
  surface?: "default" | "dark" | "yellow";
  /** Disables the button and shows `loadingLabel` while an action runs. */
  loading?: boolean;
  loadingLabel?: string;
};

export default function Button({
  variant = "primary",
  size = "md",
  icon = false,
  surface = "default",
  loading = false,
  loadingLabel,
  type = "button",
  disabled,
  className = "",
  children,
  ...props
}: Props) {
  const classes = [
    variant === "primary" ? "btn" : "btn-secondary",
    size === "sm" && "btn-sm",
    icon && "btn-icon",
    variant === "secondary" && surface === "dark" && "on-dark",
    variant === "secondary" && surface === "yellow" && "on-yellow",
    "disabled:opacity-60",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type={type} disabled={disabled || loading} aria-busy={loading || undefined} className={classes} {...props}>
      {loading && loadingLabel ? loadingLabel : children}
    </button>
  );
}
