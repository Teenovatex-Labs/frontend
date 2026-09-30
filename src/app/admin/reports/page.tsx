"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { adminApi, REPORT_REASONS, type AdminReport } from "@/lib/services";
import { keys, timeAgo } from "@/lib/labs";
import Tabs from "@/components/ui/Tabs";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import Dialog from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";

type Action = "dismiss" | "warn" | "remove" | "suspend";
const label = (reason: string) => REPORT_REASONS.find((r) => r.value === reason)?.label ?? reason;

function ReportCard({ r, onAct }: { r: AdminReport; onAct: (r: AdminReport, a: Action) => void }) {
  const urgent = r.reason === "self_harm";
  const canRemove = r.target_type !== "user";
  return (
    <li className={`border p-5 ${urgent ? "border-rose bg-pink/30" : "border-ink bg-white"}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        <span className={`rounded-full px-2.5 py-0.5 font-semibold ${urgent ? "bg-rose text-white" : "bg-yellow text-ink"}`}>{label(r.reason)}</span>
        <span>{r.target_type}</span>
        <span>reported by @{r.reporter}</span>
        <span>{timeAgo(r.created_at)}</span>
        {r.reports_on_target > 1 && <span className="font-semibold text-rose">{r.reports_on_target} reports on this</span>}
        {r.reports_on_member > 1 && <span className="font-semibold text-rose">{r.reports_on_member} against this member</span>}
      </div>
      {urgent && <p className="mt-2 text-sm font-medium text-rose">Please check in with this member kindly. Someone may need support.</p>}

      <div className="mt-3 border-l-2 border-ink pl-4">
        {r.target.exists ? (
          <>
            {r.target.title && <p className="font-medium">{r.target.title}</p>}
            {r.target.excerpt && <p className="mt-1 whitespace-pre-line text-sm text-muted">{r.target.excerpt}</p>}
            {r.target.author && <p className="mt-1 text-xs text-muted">by @{r.target.author}{r.target.hidden ? " · already hidden" : ""}</p>}
          </>
        ) : (
          <p className="text-sm text-muted">This content no longer exists.</p>
        )}
      </div>
      {r.details && <p className="mt-3 text-sm"><span className="text-muted">Their note: </span>{r.details}</p>}

      {r.status === "open" ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="btn-secondary btn-sm" onClick={() => onAct(r, "dismiss")}>Dismiss</button>
          <button className="btn-secondary btn-sm" onClick={() => onAct(r, "warn")}>Warn</button>
          {canRemove && <button className="btn-secondary btn-sm" onClick={() => onAct(r, "remove")}>Remove content</button>}
          <button className="btn btn-sm" onClick={() => onAct(r, "suspend")}>Suspend member</button>
        </div>
      ) : (
        <p className="mt-3 text-xs text-muted">{r.status === "dismissed" ? "Dismissed" : "Action taken"} {r.handled_at ? timeAgo(r.handled_at) : ""}{r.note ? ` · ${r.note}` : ""}</p>
      )}
    </li>
  );
}

export default function ReportsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [status, setStatus] = useState<"open" | "actioned" | "dismissed">("open");
  const [target, setTarget] = useState<{ report: AdminReport; action: Action } | null>(null);
  const [note, setNote] = useState("");
  const [days, setDays] = useState(3);

  const reports = useQuery({ queryKey: keys.admin("reports", status), queryFn: () => adminApi.reports(status), refetchInterval: status === "open" ? 30_000 : false });

  const resolve = useMutation({
    mutationFn: () => adminApi.resolve(target!.report.id, { action: target!.action, note: note.trim() || undefined, days: target!.action === "suspend" ? days : undefined }),
    onSuccess: () => {
      toast.success("Done.");
      setTarget(null);
      setNote("");
      void qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "That didn't work."),
  });

  const verbs: Record<Action, string> = { dismiss: "Dismiss this report", warn: "Warn the member", remove: "Remove this content", suspend: "Suspend the member" };

  return (
    <>
      <h1 className="text-[32px] tracking-[-0.03em] md:text-[44px]">Reports</h1>
      <div className="mt-5">
        <Tabs label="Status" value={status} onChange={setStatus} options={[{ id: "open", label: "Open" }, { id: "actioned", label: "Actioned" }, { id: "dismissed", label: "Dismissed" }]} />
      </div>
      <div className="mt-6">
        {reports.isPending ? (
          <div className="space-y-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-40 w-full" />)}</div>
        ) : reports.isError ? (
          <EmptyState title="That didn't load." action={<button className="btn-secondary" onClick={() => reports.refetch()}>Try again</button>} />
        ) : reports.data.items.length === 0 ? (
          <EmptyState title={status === "open" ? "The queue is clear." : "Nothing here."}>{status === "open" ? "Nobody needs anything from us right now." : undefined}</EmptyState>
        ) : (
          <ul className="space-y-4">{reports.data.items.map((r) => <ReportCard key={r.id} r={r} onAct={(report, action) => setTarget({ report, action })} />)}</ul>
        )}
      </div>

      <Dialog open={!!target} onClose={() => setTarget(null)} title={target ? verbs[target.action] : ""}>
        <form onSubmit={(e) => { e.preventDefault(); resolve.mutate(); }} className="space-y-4">
          {target?.action === "suspend" && (
            <label className="block text-sm font-medium">
              For how many days?
              <input type="number" min={1} max={365} value={days} onChange={(e) => setDays(Math.max(1, Number(e.target.value) || 1))} className="mt-1.5 w-28 rounded-md border border-ink bg-white px-3 py-2" />
            </label>
          )}
          <label className="block text-sm font-medium">
            {target?.action === "dismiss" ? "Note (optional)" : "What should the member be told? (optional)"}
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={1000} className="mt-1.5 w-full rounded-md border border-ink bg-white px-3 py-2 text-sm" />
          </label>
          {target?.action === "suspend" && (
            <p className="text-xs text-muted">They can still read but can&rsquo;t post, comment or vote. They&rsquo;ll get a notification.</p>
          )}
          <div className="flex gap-3">
            <button type="button" className="btn-secondary" onClick={() => setTarget(null)}>Cancel</button>
            <button type="submit" className="btn disabled:opacity-60" disabled={resolve.isPending}>{resolve.isPending ? "Working…" : "Confirm"}</button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
