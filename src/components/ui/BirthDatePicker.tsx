"use client";

import { useMemo, useState } from "react";
import WheelPicker from "./WheelPicker";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const daysIn = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).getUTCDate();
const pad = (n: number) => String(n).padStart(2, "0");

type Props = {
  /** YYYY-MM-DD, or "" until the member has chosen. The wheels start near the middle of the teen years but nothing is set until they move one. */
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

/** Year, month and day as three ruler wheels. The date is only reported once the member has moved a wheel. */
export default function BirthDatePicker({ value, onChange, error }: Props) {
  const thisYear = new Date().getFullYear();
  const parsed = useMemo(() => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    return m ? { y: Number(m[1]), mo: Number(m[2]), d: Number(m[3]) } : null;
  }, [value]);
  const [draft, setDraft] = useState({ y: thisYear - 16, mo: 6, d: 15 });
  const [active, setActive] = useState<0 | 1 | 2>(0);
  const cur = parsed ?? draft;

  const update = (next: { y: number; mo: number; d: number }) => {
    const d = Math.min(next.d, daysIn(next.y, next.mo)); // 31 Jan -> Feb becomes 28 or 29
    const fixed = { ...next, d };
    setDraft(fixed);
    onChange(`${fixed.y}-${pad(fixed.mo)}-${pad(fixed.d)}`);
  };

  return (
    <div>
      <div className="mb-2 grid grid-cols-3 gap-2" role="tablist" aria-label="Date of birth wheels">
        {(["Year", "Month", "Day"] as const).map((label, index) => (
          <button
            key={label}
            type="button"
            role="tab"
            aria-selected={active === index}
            onClick={() => setActive(index as 0 | 1 | 2)}
            className={`rounded-t-xl border border-ink px-2 py-2 text-center text-xs font-bold transition-colors ${active === index ? "bg-ink text-cream" : "bg-cream text-ink hover:bg-pink/30"}`}
          >
            <span className="block text-[10px] uppercase tracking-wide opacity-70">{label}</span>
            <span className="block truncate text-base">{index === 0 ? cur.y : index === 1 ? MONTHS[cur.mo - 1] : cur.d}</span>
          </button>
        ))}
      </div>
      <div role="tabpanel" aria-label={`${["Year", "Month", "Day"][active]} wheel`}>
        {active === 0 && <WheelPicker compact label="Year you were born" unit="year" min={thisYear - 70} max={thisYear - 10} majorEvery={5} value={cur.y} onChange={(y) => update({ ...cur, y })} />}
        {active === 1 && <WheelPicker compact label="Month" unit={MONTHS[cur.mo - 1]} min={1} max={12} majorEvery={3} value={cur.mo} onChange={(mo) => update({ ...cur, mo })} />}
        {active === 2 && <WheelPicker compact label="Day" unit="day of the month" min={1} max={daysIn(cur.y, cur.mo)} majorEvery={5} value={Math.min(cur.d, daysIn(cur.y, cur.mo))} onChange={(d) => update({ ...cur, d })} />}
      </div>
      {error && <p role="alert" className="text-sm font-bold text-rose">{error}</p>}
    </div>
  );
}
