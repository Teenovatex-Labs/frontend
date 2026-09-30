"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { REPORT_REASONS, safetyApi, type ReportReason, type ReportTarget } from "@/lib/services";
import Dialog from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";

// The one report flow used everywhere: labs, posts, comments and members.
export function ReportDialog({ open, onClose, targetType, targetId, what }: { open: boolean; onClose: () => void; targetType: ReportTarget; targetId: string; what: string }) {
  const toast = useToast();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");
  const [done, setDone] = useState(false);

  const send = useMutation({
    mutationFn: () => safetyApi.report({ target_type: targetType, target_id: targetId, reason: reason!, details: details.trim() || undefined }),
    onSuccess: () => setDone(true),
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Couldn't send that. Try again."),
  });

  const close = () => {
    onClose();
    // Reset after the dialog has faded so it doesn't flash.
    setTimeout(() => {
      setReason(null);
      setDetails("");
      setDone(false);
    }, 200);
  };

  return (
    <Dialog open={open} onClose={close} title={done ? "Thank you" : `Report ${what}`}>
      {done ? (
        <div>
          <p className="text-sm text-muted">A moderator will take a look. Your report is private, and the person you reported won&rsquo;t know it was you.</p>
          <p className="mt-3 text-sm text-muted">If you ever feel unsafe, tell a parent, teacher or someone you trust.</p>
          <button className="btn mt-6" onClick={close}>Done</button>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (reason) send.mutate();
          }}
        >
          <p className="text-sm text-muted">What&rsquo;s wrong? Pick the closest one.</p>
          <fieldset className="mt-3 space-y-2">
            <legend className="sr-only">Reason</legend>
            {REPORT_REASONS.map((r) => (
              <label key={r.value} className={`flex cursor-pointer items-start gap-3 border p-3 text-sm transition-colors ${reason === r.value ? "border-ink bg-yellow" : "border-line hover:border-ink"}`}>
                <input type="radio" name="reason" value={r.value} checked={reason === r.value} onChange={() => setReason(r.value)} className="mt-1 accent-[var(--rose)]" />
                <span>
                  <span className="block font-medium">{r.label}</span>
                  <span className="block text-xs text-muted">{r.hint}</span>
                </span>
              </label>
            ))}
          </fieldset>
          <label className="mt-4 block text-sm font-medium" htmlFor="report-details">Anything else we should know? (optional)</label>
          <textarea
            id="report-details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            maxLength={1000}
            rows={3}
            className="mt-1.5 w-full rounded-md border border-ink bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose"
          />
          <div className="mt-5 flex gap-3">
            <button type="button" className="btn-secondary" onClick={close}>Cancel</button>
            <button type="submit" className="btn disabled:opacity-60" disabled={!reason || send.isPending}>
              {send.isPending ? "Sending…" : "Send report"}
            </button>
          </div>
        </form>
      )}
    </Dialog>
  );
}

// A small "Report" text button that opens the dialog.
export default function ReportButton({ targetType, targetId, what, className = "" }: { targetType: ReportTarget; targetId: string; what: string; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`text-xs text-muted underline underline-offset-4 hover:text-rose ${className}`}>
        Report
      </button>
      <ReportDialog open={open} onClose={() => setOpen(false)} targetType={targetType} targetId={targetId} what={what} />
    </>
  );
}
