"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { EventItem } from "@/lib/services";
import { eventTime } from "@/lib/dates";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

// A month at a glance. Weeks start on Monday. Events appear on the day they start, in the viewer's time zone.
export default function MonthCalendar({ events }: { events: EventItem[] }) {
  const today = new Date();
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const cells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const lead = (first.getDay() + 6) % 7; // blank cells before the 1st so it lands on the right weekday
    const days = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    return [...Array.from({ length: lead }, () => null), ...Array.from({ length: days }, (_, i) => new Date(cursor.getFullYear(), cursor.getMonth(), i + 1))];
  }, [cursor]);

  const shift = (n: number) => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + n, 1));
  const label = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-[22px] tracking-[-0.02em]" aria-live="polite">{label}</h2>
        <div className="flex gap-2">
          <button type="button" className="btn-secondary btn-sm" onClick={() => shift(-1)} aria-label="Previous month">←</button>
          <button type="button" className="btn-secondary btn-sm" onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}>Today</button>
          <button type="button" className="btn-secondary btn-sm" onClick={() => shift(1)} aria-label="Next month">→</button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 border-l border-t border-ink bg-white text-xs" role="grid" aria-label={label}>
        {WEEKDAYS.map((d) => (
          <div key={d} role="columnheader" className="border-b border-r border-ink bg-yellow px-2 py-1.5 font-semibold">{d}</div>
        ))}
        {cells.map((day, i) => {
          const todays = day ? events.filter((e) => sameDay(new Date(e.starts_at), day)) : [];
          const isToday = day ? sameDay(day, today) : false;
          return (
            <div key={i} role="gridcell" className={`min-h-[84px] border-b border-r border-ink p-1.5 ${day ? "" : "bg-cream/60"}`}>
              {day && (
                <>
                  <span className={`grid h-6 w-6 place-items-center rounded-full text-[11px] tabular-nums ${isToday ? "bg-pink font-semibold" : "text-muted"}`} aria-label={day.toDateString()}>{day.getDate()}</span>
                  <ul className="mt-1 space-y-1">
                    {todays.slice(0, 3).map((e) => (
                      <li key={e.id}>
                        <Link href={`/events/${e.id}`} className="block truncate rounded bg-pink/60 px-1.5 py-0.5 text-[11px] font-medium hover:bg-yellow" title={`${e.title}, ${eventTime(e.starts_at)}`}>
                          {eventTime(e.starts_at)} {e.title}
                        </Link>
                      </li>
                    ))}
                    {todays.length > 3 && <li className="px-1 text-[11px] text-muted">+{todays.length - 3} more</li>}
                  </ul>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
