"use client";

import { useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { admissionsAdminApi } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

/**
 * Evidence organised by rubric criterion: quotes checked against the real answers, what is missing, and (only once the reviewer
 * has saved their own review) Alfred's suggested rating. It never rates anyone itself.
 */
export default function EvidencePanel({ id, weights, reviewedAt }: { id: string; weights?: Record<string, number>; reviewedAt: string | null }) {
  const toast = useToast();
  const evidence = useMutation({
    mutationFn: () => admissionsAdminApi.evidence(id),
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "That didn't work."),
  });

  // Once the reviewer saves their own review, load again so suggested ratings can appear.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (evidence.data) evidence.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewedAt]);

  const d = evidence.data;
  return (
    <section className="rounded-md border border-ink bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-bold">Evidence by criterion</h2>
        <button onClick={() => evidence.mutate()} disabled={evidence.isPending} className="btn-secondary text-xs disabled:opacity-60">
          {evidence.isPending ? "Reading…" : d ? "Refresh" : "Gather evidence"}
        </button>
      </div>
      {!d && !evidence.isPending && <p className="mt-2 text-sm text-muted">Quotes from the answers for each criterion, and what is missing. Suggested ratings appear after you save your own review.</p>}
      {d && (
        <>
          <p className="mt-2 text-xs text-muted">{d.notice}</p>
          {d.suggestions_hidden_until_review && <p className="mt-2 rounded-md border border-ink bg-yellow/30 p-2 text-xs">Suggested ratings appear once you have saved your own review.</p>}
          <div className="mt-3 flex flex-col gap-4">
            {d.criteria.map((c) => (
              <div key={c.criterion} className="text-sm">
                <p className="flex flex-wrap items-center gap-2 font-semibold">
                  {c.title}
                  {weights?.[c.criterion] ? <span className="text-xs font-normal text-muted">({weights[c.criterion]}%)</span> : null}
                  {c.suggested_rating !== null && <span className="rounded-full bg-pink px-2 py-0.5 text-[11px] font-medium">Alfred suggests {c.suggested_rating}/5</span>}
                  {c.evidence.length === 0 && <span className="rounded-full bg-line px-2 py-0.5 text-[11px] font-medium">No evidence found</span>}
                </p>
                {c.evidence.map((e, i) => (
                  <blockquote key={i} className="mt-1 border-l-2 border-ink pl-3 text-muted">&ldquo;{e.quote}&rdquo; <span className="text-xs">· answer to question {e.position}</span></blockquote>
                ))}
                {c.explanation && <p className="mt-1">{c.explanation}</p>}
                {c.gap && <p className="mt-1 text-xs text-muted">Missing: {c.gap}</p>}
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
