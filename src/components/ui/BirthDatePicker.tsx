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
  const [draft, setDraft] = useState({ y: thisYear - 15, mo: 6, d: 15 });
  const cur = parsed ?? draft;

  const update = (next: { y: number; mo: number; d: number }) => {
    const d = Math.min(next.d, daysIn(next.y, next.mo)); // 31 Jan -> Feb becomes 28 or 29
    const fixed = { ...next, d };
    setDraft(fixed);
    onChange(`${fixed.y}-${pad(fixed.mo)}-${pad(fixed.d)}`);
  };

  return (
    <div className="space-y-3">
      <WheelPicker label="Year you were born" unit="year" min={thisYear - 80} max={thisYear} majorEvery={5} value={cur.y} onChange={(y) => update({ ...cur, y })} />
      <WheelPicker label="Month" unit={MONTHS[cur.mo - 1]} min={1} max={12} majorEvery={3} value={cur.mo} onChange={(mo) => update({ ...cur, mo })} />
      <WheelPicker label="Day" unit="day of the month" min={1} max={daysIn(cur.y, cur.mo)} majorEvery={5} value={Math.min(cur.d, daysIn(cur.y, cur.mo))} onChange={(d) => update({ ...cur, d })} />
      {error && <p role="alert" className="text-sm font-bold text-rose">{error}</p>}
    </div>
  );
}
