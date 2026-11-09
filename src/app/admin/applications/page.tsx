"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { admissionsAdminApi, type ApplicationStatus } from "@/lib/services";
import { keys, timeAgo } from "@/lib/labs";
import StatTile from "@/components/ui/StatTile";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";

const STATUS_FILTERS: { value: ApplicationStatus | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under review" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "waitlisted", label: "Waitlisted" },
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
];

const STATUS_TONE: Record<string, string> = {
  submitted: "bg-cream", under_review: "bg-yellow", shortlisted: "bg-pink/60", waitlisted: "bg-pink/30",
  accepted: "bg-yellow", declined: "bg-line", withdrawn: "bg-line",
};

export default function ApplicationsDashboard() {
  const [status, setStatus] = useState<ApplicationStatus | "">("");
  const [claimed, setClaimed] = useState<"" | "mine" | "none">("");
  const [page, setPage] = useState(1);
  // Rehearsals stay out of the real queue and counts unless asked for.
  const [includeTest, setIncludeTest] = useState(false);
  const inc = includeTest ? ("1" as const) : undefined;

  const stats = useQuery({ queryKey: keys.admin("applications-stats", inc), queryFn: () => admissionsAdminApi.stats(undefined, inc), refetchInterval: 60_000 });
  const list = useQuery({
    queryKey: keys.admin("applications", { status, claimed, page, inc }),
    queryFn: () => admissionsAdminApi.list({ status: status || undefined, claimed: claimed || undefined, page, include_test: inc }),
  });

  const counts = stats.data?.counts ?? {};

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-[32px] tracking-[-0.03em] md:text-[44px]">Applications</h1>
        <div className="flex gap-2">
          <Link href="/admin/applications/history" className="btn-secondary text-sm">History</Link>
          <Link href="/admin/applications/windows" className="btn-secondary text-sm">Windows</Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatTile label="Unclaimed" value={stats.data?.unclaimed ?? 0} tone={stats.data?.unclaimed ? "pink" : "cream"} />
        <StatTile label="Submitted" value={counts.submitted ?? 0} tone="yellow" />
        <StatTile label="Under review" value={counts.under_review ?? 0} tone="white" />
        <StatTile label="Accepted" value={counts.accepted ?? 0} tone="white" />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => { setStatus(f.value); setPage(1); }}
            className={`rounded-full border border-ink px-3.5 py-1.5 text-sm font-semibold transition-colors ${status === f.value ? "bg-ink text-cream" : "hover:bg-yellow"}`}
          >
            {f.label}
          </button>
        ))}
        <span className="mx-1 h-6 w-px bg-line" />
        <label className="flex items-center gap-2 rounded-full border border-ink px-3.5 py-1.5 text-sm font-semibold">
          <input type="checkbox" checked={includeTest} onChange={(e) => { setIncludeTest(e.target.checked); setPage(1); }} />
          Include test applications
        </label>
        <span className="mx-1 h-6 w-px bg-line" />
        {(["", "mine", "none"] as const).map((c) => (
          <button
            key={c}
            onClick={() => { setClaimed(c); setPage(1); }}
            className={`rounded-full border border-ink px-3.5 py-1.5 text-sm font-semibold transition-colors ${claimed === c ? "bg-ink text-cream" : "hover:bg-yellow"}`}
          >
            {c === "" ? "Any claim" : c === "mine" ? "Claimed by me" : "Unclaimed"}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {list.isPending ? (
          <Skeleton className="h-64 w-full" />
        ) : list.isError ? (
          <EmptyState title="That didn't load." />
        ) : list.data.items.length === 0 ? (
          <EmptyState title="No applications match." />
        ) : (
          <div className="overflow-x-auto border border-ink bg-white">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-ink bg-yellow text-xs uppercase tracking-wide">
                <tr><th className="px-4 py-3">Applicant</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Age</th><th className="px-4 py-3">Country</th><th className="px-4 py-3">Submitted</th><th className="px-4 py-3" /></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {list.data.items.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-3"><p className="font-medium">{a.full_name}{a.is_test && <span className="ml-2 rounded-full bg-ink px-2 py-0.5 text-[10px] font-bold text-cream">TEST</span>}</p><p className="text-xs text-muted">{a.reference}</p></td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[11px] ${STATUS_TONE[a.status] ?? "bg-cream"}`}>{a.status.replace("_", " ")}</span></td>
                    <td className="px-4 py-3 tabular-nums">{a.age}</td>
                    <td className="px-4 py-3">{a.country}</td>
                    <td className="px-4 py-3 text-muted">{a.submitted_at ? timeAgo(a.submitted_at) : "—"}</td>
                    <td className="px-4 py-3 text-right"><Link href={`/admin/applications/${a.id}`} className="font-semibold text-ink underline underline-offset-4">Review</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {list.data.pages > 1 && (
              <div className="flex items-center justify-between border-t border-ink px-4 py-3 text-sm">
                <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="disabled:opacity-40">← Previous</button>
                <span className="text-muted">Page {list.data.page} of {list.data.pages}</span>
                <button disabled={page >= list.data.pages} onClick={() => setPage((p) => p + 1)} className="disabled:opacity-40">Next →</button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
