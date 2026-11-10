"use client";

import { useEffect, useState } from "react";
import { getWindow, type WindowStatus } from "@/lib/admissions";

const date = (value: string) => new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });

/** A small live line inside the existing hero, never a second admissions section. */
export default function ApplicationWindowCue() {
  const [window, setWindow] = useState<WindowStatus | null>(null);

  useEffect(() => {
    let current = true;
    getWindow().then((status) => { if (current) setWindow(status); }).catch(() => {});
    return () => { current = false; };
  }, []);

  if (window?.state === "open" && window.window) return <p aria-live="polite">Applications are open until {date(window.window.closes_at)}.</p>;
  if (window?.next_opens_at) return <p aria-live="polite">The next application window opens {date(window.next_opens_at)}.</p>;
  return <p>Applications open in monthly windows.</p>;
}
