"use client";

import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { labsDeepApi } from "@/lib/services";
import { keys } from "@/lib/labs";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" }) : null);

export default function Milestones({ lab, isTeam }: { lab: string; isTeam: boolean }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const q = useQuery({ queryKey: keys.milestones(lab), queryFn: () => labsDeepApi.milestones(lab) });
  const refresh = () => qc.invalidateQueries({ queryKey: keys.milestones(lab) });
  const fail = (e: unknown) => toast.error(e instanceof ApiError ? e.message : "That didn't work. Try again.");

  const add = useMutation({
    mutationFn: () => labsDeepApi.addMilestone(lab, { title: title.trim(), due_at: due ? new Date(`${due}T23:59:00`).toISOString() : null }),
    onSuccess: () => { setTitle(""); setDue(""); void refresh(); },
    onError: fail,
  });
  const toggle = useMutation({ mutationFn: (v: { id: string; done: boolean }) => labsDeepApi.updateMilestone(lab, v.id, { done: v.done }), onSuccess: () => { void refresh(); void qc.invalidateQueries({ queryKey: keys.labs }); }, onError: fail });
  const remove = useMutation({ mutationFn: (id: string) => labsDeepApi.deleteMilestone(lab, id), onSuccess: () => void refresh(), onError: fail });

  const items = q.data?.milestones ?? [];
  const doneCount = items.filter((m) => m.done).length;
  const pct = items.length ? Math.round((doneCount / items.length) * 100) : 0;

  if (!isTeam && !q.isPending && items.length === 0) return null;

  return (
    <section className="mt-10" aria-label="Milestones">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[22px] tracking-[-0.02em]">Milestones</h2>
        {items.length > 0 && <span className="text-sm text-muted">{doneCount} of {items.length} done</span>}
      </div>
      {items.length > 0 && (
        <div className="mt-3 h-2 overflow-hidden rounded-full border border-ink bg-cream" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Milestone progress">
          <div className="h-full bg-pink transition-[width] duration-500" style={{ width: `${pct}%` }} />
        </div>
      )}
      {q.isPending ? (
        <Skeleton className="mt-4 h-16 w-full" />
      ) : (
        <ul className="mt-4 space-y-2">
          {items.map((m) => (
            <li key={m.id} className="flex items-center gap-3 border border-line bg-white px-4 py-3">
              {isTeam ? (
                <input type="checkbox" checked={m.done} onChange={(e) => toggle.mutate({ id: m.id, done: e.target.checked })} aria-label={`Mark "${m.title}" ${m.done ? "not done" : "done"}`} className="h-4 w-4 accent-[var(--rose)]" />
              ) : (
                <span aria-hidden="true" className={`grid h-5 w-5 place-items-center rounded-full border border-ink text-[11px] ${m.done ? "bg-pink" : "bg-cream"}`}>{m.done ? "✓" : ""}</span>
              )}
              <span className={`flex-1 ${m.done ? "text-muted line-through" : ""}`}>{m.title}</span>
              {m.due_at && <span className={`text-xs ${!m.done && new Date(m.due_at) < new Date() ? "font-semibold text-rose" : "text-muted"}`}>{when(m.due_at)}</span>}
              {isTeam && <button type="button" onClick={() => remove.mutate(m.id)} aria-label={`Delete "${m.title}"`} className="text-ink/70 hover:text-ink">×</button>}
            </li>
          ))}
        </ul>
      )}
      {isTeam && (
        <form onSubmit={(e: FormEvent) => { e.preventDefault(); if (title.trim().length >= 2) add.mutate(); }} className="mt-4 flex flex-wrap gap-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Add a milestone, like “Launch the beta”" aria-label="New milestone" maxLength={140} className="min-w-[200px] flex-1 rounded-md border border-ink bg-cream px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose" />
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)} aria-label="Due date" className="rounded-md border border-ink bg-cream px-3 py-2 text-sm" />
          <button type="submit" className="btn-secondary btn-sm" disabled={add.isPending || title.trim().length < 2}>Add</button>
        </form>
      )}
    </section>
  );
}
