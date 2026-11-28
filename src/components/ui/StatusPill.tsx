// A small rounded label for the state of a row: a report, an application, a member.
// Not the collectible `Badge` (that is a medal with a symbol).
//
// Usage:
//   <StatusPill status="pending" />            // known status: tone and label picked for you ("pending")
//   <StatusPill status="on_leave" />           // underscores become spaces ("on leave")
//   <StatusPill tone="danger">Banned</StatusPill>  // any text with an explicit tone
//
// Tones use brand tokens only. Unknown statuses fall back to "neutral".

export type StatusTone = "neutral" | "positive" | "attention" | "danger" | "muted";

const TONE_CLASS: Record<StatusTone, string> = {
  neutral: "bg-cream", // waiting or new: nothing to celebrate or fix yet
  positive: "bg-yellow", // done, approved, live
  attention: "bg-pink/40", // needs someone to look at it
  danger: "bg-rose text-cream", // blocked or punished
  muted: "bg-line", // finished and out of the way
};

// Statuses used across the admin console. Add a line here when a new screen needs one.
const STATUS_TONE: Record<string, StatusTone> = {
  // reports and moderation
  open: "attention",
  actioned: "positive",
  dismissed: "muted",
  // reviews and applications
  pending: "neutral",
  approved: "positive",
  accepted: "positive",
  declined: "muted",
  // members
  suspended: "danger",
  onboarding: "neutral",
  active: "positive",
  on_leave: "attention",
  inactive: "attention",
  alumni: "muted",
  removed: "muted",
};

type Props =
  | { status: string; tone?: StatusTone; children?: undefined; className?: string }
  | { status?: undefined; tone: StatusTone; children: React.ReactNode; className?: string };

export default function StatusPill({ status, tone, children, className = "" }: Props) {
  const t = tone ?? (status ? STATUS_TONE[status] : undefined) ?? "neutral";
  const label = children ?? status?.replaceAll("_", " ");
  return (
    <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] ${TONE_CLASS[t]} ${className}`}>
      {label}
    </span>
  );
}
