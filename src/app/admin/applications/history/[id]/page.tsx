"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { historyApi } from "@/lib/services";
import { keys } from "@/lib/labs";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";

const FILTERS = ["", "submitted", "under_review", "shortlisted", "waitlisted", "accepted", "declined", "withdrawn", "draft"] as const;
const TONE: Record<string, string> = {
  submitted: "bg-cream", under_review: "bg-yellow", shortlisted: "bg-pink/60", waitlisted: "bg-pink/30",
  accepted: "bg-yellow", declined: "bg-line", withdrawn: "bg-line", draft: "bg-cream",
};
const label = (s: string) => s.replace(/_/g, " ");
const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—");

export default function WindowRecordPage() {
  const { id } = useParams<{ id: string }>();
  const [status, setStatus] = useState<string>("");
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const detail = useQuery({
    queryKey: keys.admin("admissions-history", id, { status, q, page }),
    queryFn: () => historyApi.applicants(id, { status: status || undefined, q: q || undefined, page }),
  });
  const w = detail.data?.window;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-[28px] tracking-[-0.03em] md:text-[40px]">
          {w ? `${fmt(w.opens_at)} – ${fmt(w.closes_at)}` : "Window record"}
          {w?.is_test && <span className="ml-3 rounded-full bg-ink px-2 py-0.5 align-middle text-xs font-bold text-cream">TEST</span>}
        </h1>
        <Link href="/admin/applications/history" className="btn-secondary text-sm">All windows</Link>
      </div>
      {w && (
        <p className="mt-1 text-sm text-muted">
          {w.state} · decisions {w.released ? "released" : `due ${fmt(w.decisions_publish_at)}`}
          {w.note ? ` · ${w.note}` : ""}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => { setStatus(f); setPage(1); }}
            className={`rounded-full border border-ink px-3.5 py-1.5 text-sm font-semibold transition-colors ${status === f ? "bg-ink text-cream" : "hover:bg-yellow"}`}
          >
            {f === "" ? "All submitted" : label(f)}
            {f === "draft" && detail.data ? ` (${detail.data.drafts})` : ""}
          </button>
        ))}
        <form onSubmit={(e) => { e.preventDefault(); setQ(search.trim()); setPage(1); }} className="ml-auto flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, reference or country"
            aria-label="Search this window"
            className="rounded-md border border-ink bg-white px-3 py-1.5 text-sm"
          />
          <button type="submit" className="btn-secondary text-sm">Search</button>
        </form>
      </div>

      <div className="mt-6">
        {detail.isPending ? (
          <Skeleton className="h-64 w-full" />
        ) : detail.isError ? (
          <EmptyState title="That didn't load." />
        ) : detail.data.items.length === 0 ? (
          <EmptyState title="Nobody matches." />
        ) : (
          <div className="overflow-x-auto border border-ink bg-white">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="border-b border-ink bg-yellow text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3">Applicant</th>
                  <th className="px-4 py-3">Outcome</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3">Submission</th>
                  <th className="px-4 py-3">Review</th>
                  <th className="px-4 py-3">After</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line align-top">
                {detail.data.items.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{a.full_name}</p>
                      <p className="text-xs text-muted">{a.reference} · {a.age} · {a.country}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] ${TONE[a.status] ?? "bg-cream"}`}>{label(a.status)}</span>
                      {a.outcome_released === false && <p className="mt-1 text-xs text-muted">Not released: applicant still sees &ldquo;{label(a.applicant_sees)}&rdquo;</p>}
                      {a.decided_at && <p className="mt-1 text-xs text-muted">Decided {fmt(a.decided_at)}{a.decided_by ? ` by ${a.decided_by}` : ""}</p>}
                    </td>
                    <td className="px-4 py-3 text-muted">{fmt(a.submitted_at)}</td>
                    <td className="px-4 py-3 text-muted">
                      {a.questions} Alfred question{a.questions === 1 ? "" : "s"}
                      <br />
                      {a.files} file{a.files === 1 ? "" : "s"}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {a.reviewer ? `Reviewer ${a.reviewer}` : "Unclaimed"}
                      <br />
                      {a.reviews} review{a.reviews === 1 ? "" : "s"}{a.average_score !== null ? ` · avg ${a.average_score}` : ""}
                      {a.interview_invited && <><br />Invited to a call</>}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {a.joined ? "Joined" : a.status === "accepted" ? "Not joined yet" : "—"}
                      {a.guardian && <><br />Guardian: {label(a.guardian)}</>}
                      {a.waitlist_offer && <><br />Offer: {a.waitlist_offer}</>}
                      {a.delete_on && <><br />Deleted on {fmt(a.delete_on)}</>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {a.status !== "draft" && <Link href={`/admin/applications/${a.id}`} className="font-semibold text-ink underline underline-offset-4">Open</Link>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {detail.data.pages > 1 && (
              <div className="flex items-center justify-between border-t border-ink px-4 py-3 text-sm">
                <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="disabled:opacity-40">← Previous</button>
                <span className="text-muted">Page {detail.data.page} of {detail.data.pages} · {detail.data.total} people</span>
                <button disabled={page >= detail.data.pages} onClick={() => setPage((p) => p + 1)} className="disabled:opacity-40">Next →</button>
              </div>
            )}
          </div>
        )}
      </div>
      <p className="mt-3 text-xs text-muted">Open shows the full submission (answers, Alfred interview, files, reviews). Each time you open one it is logged.</p>
    </>
  );
}
