"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { historyApi, type WindowHistory } from "@/lib/services";
import { keys } from "@/lib/labs";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";

const fmt = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

function Figure({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div title={hint}>
      <p className="text-xl font-bold tabular-nums">{value}</p>
      <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
    </div>
  );
}

function WindowCard({ w }: { w: WindowHistory }) {
  return (
    <Link href={`/admin/applications/history/${w.id}`} className="block rounded-md border border-ink bg-white p-4 transition-colors hover:bg-cream">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold">
          {fmt(w.opens_at)} – {fmt(w.closes_at)}
          <span className={`ml-2 rounded-full px-2 py-0.5 text-[11px] ${w.state === "open" ? "bg-yellow" : w.state === "upcoming" ? "bg-cream" : "bg-line"}`}>{w.state}</span>
          {w.released && <span className="ml-1 rounded-full bg-pink/60 px-2 py-0.5 text-[11px]">released</span>}
          {w.is_test && <span className="ml-1 rounded-full bg-ink px-2 py-0.5 text-[11px] font-bold text-cream">TEST</span>}
        </p>
        <span className="text-sm font-semibold underline underline-offset-4">Open record</span>
      </div>
      {w.note && <p className="mt-1 text-sm text-muted">{w.note}</p>}
      <div className="mt-4 grid grid-cols-3 gap-4 sm:grid-cols-5 lg:grid-cols-9">
        <Figure label="Started" value={w.started} hint="Everyone who started, including drafts" />
        <Figure label="Submitted" value={w.submitted} />
        <Figure label="Accepted" value={w.accepted} />
        <Figure label="Waitlisted" value={w.waitlisted} />
        <Figure label="Declined" value={w.declined} />
        <Figure label="Undecided" value={w.undecided} />
        <Figure label="Withdrawn" value={w.withdrawn} />
        <Figure label="Joined" value={w.joined} hint="Accepted applicants who created their account" />
        <Figure label="Deleted" value={w.deleted} hint="Records already removed under the retention rules" />
      </div>
    </Link>
  );
}

export default function AdmissionsHistoryPage() {
  const [includeTest, setIncludeTest] = useState(false);
  const history = useQuery({ queryKey: keys.admin("admissions-history", includeTest), queryFn: () => historyApi.windows(includeTest) });

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-[32px] tracking-[-0.03em] md:text-[44px]">Window history</h1>
        <div className="flex gap-2">
          <Link href="/admin/applications" className="btn-secondary text-sm">Applications</Link>
          <Link href="/admin/applications/windows" className="btn-secondary text-sm">Windows</Link>
        </div>
      </div>
      <p className="mt-2 max-w-[60ch] text-sm text-muted">
        Every intake, who applied and how it ended. This holds young people&rsquo;s details, so it is for admins only and opening a window is logged.
        Declined applications are deleted six months after the decision and then drop out of these lists; the Deleted column counts them.
      </p>

      <label className="mt-4 inline-flex items-center gap-2 rounded-full border border-ink px-3.5 py-1.5 text-sm font-semibold">
        <input type="checkbox" checked={includeTest} onChange={(e) => setIncludeTest(e.target.checked)} />
        Show test windows
      </label>

      <div className="mt-6 flex flex-col gap-3">
        {history.isPending ? (
          <Skeleton className="h-48 w-full" />
        ) : history.isError ? (
          <EmptyState title="That didn't load." />
        ) : history.data.items.length === 0 ? (
          <EmptyState title="No windows yet." />
        ) : (
          history.data.items.map((w) => <WindowCard key={w.id} w={w} />)
        )}
      </div>
    </>
  );
}
