"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { announcementsApi } from "@/lib/services";
import { keys } from "@/lib/labs";

const KEY = "tx_dismissed_announcements";
const read = (): string[] => {
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
};

// The newest team announcement the member hasn't closed yet. Closing it is remembered on this device.
export default function AnnouncementBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState<string[]>(() => (typeof window === "undefined" ? [] : read()));
  const q = useQuery({ queryKey: keys.announcements, queryFn: announcementsApi.active, enabled: !!user, staleTime: 5 * 60_000 });
  const item = q.data?.announcements.find((a) => !dismissed.includes(a.id));
  if (!item) return null;

  const close = () => {
    const next = [...dismissed, item.id].slice(-30);
    setDismissed(next);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // The banner just comes back next visit.
    }
  };

  return (
    <div role="region" aria-label="Announcement" className="flex items-start gap-3 border-b border-ink bg-yellow px-5 py-3 text-sm">
      <p className="flex-1">
        <strong>{item.title}</strong> <span className="text-ink/80">{item.body}</span>{" "}
        {item.link && <Link href={item.link} className="font-semibold underline underline-offset-4">See more</Link>}
      </p>
      <button type="button" onClick={close} aria-label="Dismiss announcement" className="text-lg leading-none text-ink/60 hover:text-ink">×</button>
    </div>
  );
}
