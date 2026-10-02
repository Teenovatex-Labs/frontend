// A collectible badge: a coloured medal with a symbol, dimmed until it is earned.
const TONES = ["bg-yellow", "bg-pink", "bg-cream"];

export default function Badge({ title, description, symbol, earned = true, index = 0 }: { title: string; description: string; symbol: string; earned?: boolean; index?: number }) {
  return (
    <div className={`flex items-center gap-3 border p-3 ${earned ? "border-ink bg-white shadow-[3px_3px_0_var(--ink)]" : "border-line bg-cream/60"}`} title={description}>
      <span aria-hidden="true" className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border text-[15px] font-semibold ${earned ? `border-ink ${TONES[index % TONES.length]}` : "border-line bg-white text-muted"}`}>
        {symbol}
      </span>
      <span className="min-w-0">
        <span className={`block text-sm font-medium ${earned ? "" : "text-muted"}`}>{title}</span>
        <span className="block text-xs text-muted">{earned ? description : `Locked: ${description.toLowerCase()}`}</span>
      </span>
    </div>
  );
}
