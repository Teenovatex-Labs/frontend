"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { membershipAdminApi, type MembershipStatus } from "@/lib/services";
import { keys, timeAgo } from "@/lib/labs";
import { ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import Skeleton from "@/components/ui/Skeleton";
import Dialog from "@/components/ui/Dialog";
import Tabs from "@/components/ui/Tabs";

const STATUS_TONE: Record<string, string> = {
  onboarding: "bg-cream", active: "bg-yellow", on_leave: "bg-pink/40", inactive: "bg-pink/30", alumni: "bg-line", removed: "bg-line",
};

export default function MembershipAdminPage() {
  const [tab, setTab] = useState<"members" | "inactivity" | "reviews">("members");
  const qc = useQueryClient();
  const toast = useToast();
  const fail = (e: unknown) => toast.error(e instanceof ApiError ? e.message : "That didn't work.");
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin"] });

  const [statusFilter, setStatusFilter] = useState("");
  const members = useQuery({ queryKey: keys.admin("members-status", statusFilter), queryFn: () => membershipAdminApi.members(statusFilter || undefined), enabled: tab === "members" });
  const inactivity = useQuery({ queryKey: keys.admin("inactivity"), queryFn: () => membershipAdminApi.inactivity(), enabled: tab === "inactivity" });
  const reviews = useQuery({ queryKey: keys.admin("inactivity-reviews"), queryFn: membershipAdminApi.reviews, enabled: tab === "reviews" });

  const [changing, setChanging] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<MembershipStatus>("active");
  const [reason, setReason] = useState("");
  const setStatus = useMutation({
    mutationFn: () => membershipAdminApi.setStatus(changing!, { status: newStatus, reason }),
    onSuccess: () => { toast.success("Status updated."); setChanging(null); setReason(""); void refresh(); },
    onError: fail,
  });

  const [starting, setStarting] = useState<string | null>(null);
  const [startReason, setStartReason] = useState("");
  const startReview = useMutation({
    mutationFn: () => membershipAdminApi.startReview(starting!, { reason: startReason }),
    onSuccess: () => { toast.success("Review started."); setStarting(null); setStartReason(""); void refresh(); },
    onError: fail,
  });

  const [deciding, setDeciding] = useState<{ id: string; userId: string } | null>(null);
  const [decision, setDecision] = useState<"active" | "on_leave" | "alumni" | "removed">("active");
  const [decideReason, setDecideReason] = useState("");
  const decideReview = useMutation({
    mutationFn: () => membershipAdminApi.decideReview(deciding!.userId, { decision, reason: decideReason }),
    onSuccess: () => { toast.success("Decided."); setDeciding(null); setDecideReason(""); void refresh(); },
    onError: fail,
  });

  return (
    <>
      <h1 className="text-[32px] tracking-[-0.03em] md:text-[44px]">Membership</h1>
      <div className="mt-5">
        <Tabs label="View" value={tab} onChange={setTab} options={[{ id: "members", label: "Members" }, { id: "inactivity", label: "Inactivity candidates" }, { id: "reviews", label: "Open reviews" }]} />
      </div>

      {tab === "members" && (
        <div className="mt-6">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="mb-4 rounded-md border border-ink bg-white px-3 py-2 text-sm">
            <option value="">All statuses</option>
            {["onboarding", "active", "on_leave", "inactive", "alumni", "removed"].map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
          </select>
          {members.isPending ? <Skeleton className="h-64 w-full" /> : (
            <div className="overflow-x-auto border border-ink bg-white">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="border-b border-ink bg-yellow text-xs uppercase tracking-wide"><tr><th className="px-4 py-3">Member</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Last seen</th><th className="px-4 py-3" /></tr></thead>
                <tbody className="divide-y divide-line">
                  {members.data?.items.map((m) => (
                    <tr key={m.id}>
                      <td className="px-4 py-3 font-medium">@{m.username}</td>
                      <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[11px] ${STATUS_TONE[m.membership_status]}`}>{m.membership_status.replace("_", " ")}</span></td>
                      <td className="px-4 py-3 text-muted">{m.last_login_at ? timeAgo(m.last_login_at) : "never"}</td>
                      <td className="px-4 py-3 text-right"><button onClick={() => { setChanging(m.id); setNewStatus(m.membership_status); }} className="font-semibold underline underline-offset-4">Change</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "inactivity" && (
        <div className="mt-6">
          {inactivity.isPending ? <Skeleton className="h-64 w-full" /> : (
            <div className="flex flex-col gap-2">
              {inactivity.data?.items.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-md border border-ink bg-white p-3.5">
                  <div><p className="font-medium">@{c.username}</p><p className="text-xs text-muted">Last seen {timeAgo(c.last_seen)}</p></div>
                  {c.under_review ? <span className="text-xs text-muted">Already under review</span> : (
                    <button onClick={() => setStarting(c.id)} className="btn-secondary text-xs">Start review</button>
                  )}
                </div>
              ))}
              {inactivity.data?.items.length === 0 && <p className="text-muted">No inactive members right now.</p>}
            </div>
          )}
        </div>
      )}

      {tab === "reviews" && (
        <div className="mt-6">
          {reviews.isPending ? <Skeleton className="h-64 w-full" /> : (
            <div className="flex flex-col gap-2">
              {reviews.data?.items.map((r) => (
                <div key={r.id} className="rounded-md border border-ink bg-white p-3.5">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">@{r.username} {r.overdue && <span className="ml-1 rounded-full bg-pink px-2 py-0.5 text-[11px]">overdue</span>}</p>
                    <button onClick={() => setDeciding({ id: r.id, userId: r.user_id })} className="btn-secondary text-xs">Decide</button>
                  </div>
                  <p className="mt-1 text-sm text-muted">Reason: {r.reason}</p>
                  {r.member_response && <p className="mt-1 text-sm">Response: {r.member_response}</p>}
                </div>
              ))}
              {reviews.data?.items.length === 0 && <p className="text-muted">No open reviews.</p>}
            </div>
          )}
        </div>
      )}

      <Dialog open={!!changing} onClose={() => setChanging(null)} title="Change membership status">
        <form onSubmit={(e) => { e.preventDefault(); setStatus.mutate(); }} className="flex flex-col gap-3">
          <select value={newStatus} onChange={(e) => setNewStatus(e.target.value as MembershipStatus)} className="rounded-md border border-ink bg-white px-3 py-2">
            {["onboarding", "active", "on_leave", "inactive", "alumni", "removed"].map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
          </select>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (required)" rows={2} className="rounded-md border border-ink bg-white px-3 py-2 text-sm" />
          <div className="flex gap-3">
            <button type="button" className="btn-secondary" onClick={() => setChanging(null)}>Cancel</button>
            <button type="submit" disabled={setStatus.isPending || reason.trim().length < 5} className="btn disabled:opacity-60">Save</button>
          </div>
        </form>
      </Dialog>

      <Dialog open={!!starting} onClose={() => setStarting(null)} title="Start an inactivity review">
        <form onSubmit={(e) => { e.preventDefault(); startReview.mutate(); }} className="flex flex-col gap-3">
          <textarea value={startReason} onChange={(e) => setStartReason(e.target.value)} placeholder="Why (required)" rows={2} className="rounded-md border border-ink bg-white px-3 py-2 text-sm" />
          <div className="flex gap-3">
            <button type="button" className="btn-secondary" onClick={() => setStarting(null)}>Cancel</button>
            <button type="submit" disabled={startReview.isPending || startReason.trim().length < 5} className="btn disabled:opacity-60">Start</button>
          </div>
        </form>
      </Dialog>

      <Dialog open={!!deciding} onClose={() => setDeciding(null)} title="Decide this review">
        <form onSubmit={(e) => { e.preventDefault(); decideReview.mutate(); }} className="flex flex-col gap-3">
          <select value={decision} onChange={(e) => setDecision(e.target.value as typeof decision)} className="rounded-md border border-ink bg-white px-3 py-2">
            <option value="active">Stay active</option>
            <option value="on_leave">On leave</option>
            <option value="alumni">Alumni</option>
            <option value="removed">Removed</option>
          </select>
          <textarea value={decideReason} onChange={(e) => setDecideReason(e.target.value)} placeholder={decision === "removed" ? "Reason (at least 20 characters)" : "Reason"} rows={2} className="rounded-md border border-ink bg-white px-3 py-2 text-sm" />
          <div className="flex gap-3">
            <button type="button" className="btn-secondary" onClick={() => setDeciding(null)}>Cancel</button>
            <button type="submit" disabled={decideReview.isPending || decideReason.trim().length < (decision === "removed" ? 20 : 5)} className="btn disabled:opacity-60">Confirm</button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
