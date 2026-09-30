import type { DayPoint } from "@/lib/services";

// A small bar chart drawn with plain elements. Screen readers get the numbers as a list.
export default function BarChart({ title, points, tone = "bg-pink" }: { title: string; points: DayPoint[]; tone?: string }) {
  const max = Math.max(1, ...points.map((p) => p.count));
  const total = points.reduce((n, p) => n + p.count, 0);
  return (
    <figure className="border border-ink bg-white p-4">
      <figcaption className="flex items-baseline justify-between gap-2">
        <span className="font-medium">{title}</span>
        <span className="text-sm tabular-nums text-muted">{total.toLocaleString()} total</span>
      </figcaption>
      <div className="mt-4 flex h-28 items-end gap-[3px]" aria-hidden="true">
        {points.map((p) => (
          <div key={p.day} className="group relative flex h-full flex-1 items-end" title={`${p.day}: ${p.count}`}>
            <div className={`w-full rounded-t-sm ${tone} ${p.count === 0 ? "opacity-30" : ""}`} style={{ height: `${Math.max(p.count === 0 ? 3 : 6, (p.count / max) * 100)}%` }} />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-muted" aria-hidden="true">
        <span>{points[0]?.day.slice(5)}</span>
        <span>{points.at(-1)?.day.slice(5)}</span>
      </div>
      <ul className="sr-only">{points.map((p) => <li key={p.day}>{p.day}: {p.count}</li>)}</ul>
    </figure>
  );
}
