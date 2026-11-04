"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { challengesAdminApi } from "@/lib/services";
import { keys } from "@/lib/labs";
import { ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import Dialog from "@/components/ui/Dialog";

export default function JudgePage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const toast = useToast();
  const fail = (e: unknown) => toast.error(e instanceof ApiError ? e.message : "That didn't work.");
  const refresh = () => { void qc.invalidateQueries({ queryKey: keys.admin("challenge-entries", id) }); void qc.invalidateQueries({ queryKey: keys.admin("challenge-standings", id) }); void qc.invalidateQueries({ queryKey: keys.admin("challenges") }); };

  const challenges = useQuery({ queryKey: keys.admin("challenges"), queryFn: challengesAdminApi.list });
  const challenge = challenges.data?.items.find((c) => c.id === id);
  const entries = useQuery({ queryKey: keys.admin("challenge-entries", id), queryFn: () => challengesAdminApi.entries(id) });
  const standings = useQuery({ queryKey: keys.admin("challenge-standings", id), queryFn: () => challengesAdminApi.standings(id) });

  const [scoring, setScoring] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [note, setNote] = useState("");
  const entry = entries.data?.items.find((e) => e.id === scoring);
  const startScoring = (eid: string) => {
    const e = entries.data!.items.find((x) => x.id === eid)!;
    setScoring(eid);
    setScores(e.my_score?.scores ?? Object.fromEntries(entries.data!.criteria.map((c) => [c.name, 5])));
    setNote(e.my_score?.note ?? "");
  };
  const score = useMutation({
    mutationFn: () => challengesAdminApi.score(id, scoring!, { scores, note: note.trim() || undefined }),
    onSuccess: (r) => { toast.success(`Scored ${r.total.toFixed(2)}.`); setScoring(null); refresh(); },
    onError: fail,
  });

  const [dqFor, setDqFor] = useState<string | null>(null);
  const [dqReason, setDqReason] = useState("");
  const dq = useMutation({
    mutationFn: () => challengesAdminApi.disqualify(id, dqFor!, dqReason),
    onSuccess: () => { toast.success("Entry disqualified."); setDqFor(null); setDqReason(""); refresh(); },
    onError: fail,
  });

  const [publishing, setPublishing] = useState(false);
  const publish = useMutation({
    mutationFn: () => challengesAdminApi.publish(id),
    onSuccess: () => { toast.success("Results published."); setPublishing(false); refresh(); },
    onError: (e) => { setPublishing(false); fail(e); },
  });

  const judging = challenge?.status === "judging";
  const unscored = standings.data?.unscored_entries ?? 0;

  return (
    <>
      <Link href="/admin/challenges" className="text-sm underline underline-offset-4">All challenges</Link>
      <h1 className="mt-2 text-[32px] tracking-[-0.03em] md:text-[44px]">{challenge?.title ?? "Judging"}</h1>
      {challenge && <p className="mt-1 text-sm text-muted">{challenge.status}{challenge.results_published ? " · results published" : ""}</p>}

      <section className="mt-6">
        <h2 className="font-bold">Standings</h2>
        {standings.isPending ? <Skeleton className="mt-3 h-24 w-full" /> : standings.data?.items.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Nothing scored yet.</p>
        ) : (
          <ol className="mt-3 flex flex-col gap-2">
            {standings.data?.items.map((s) => (
              <li key={s.entry_id} className="flex items-center justify-between rounded-md border border-ink bg-white p-3 text-sm">
                <span><span className="mr-2 font-bold tabular-nums">{s.place}.</span>{s.title}</span>
                <span className="tabular-nums text-muted">{s.average.toFixed(2)} avg · {s.judges} {s.judges === 1 ? "judge" : "judges"}</span>
              </li>
            ))}
          </ol>
        )}
        {judging && (
          <div className="mt-3">
            <button className="btn text-sm disabled:opacity-60" disabled={unscored > 0 || standings.data?.items.length === 0} onClick={() => setPublishing(true)}>Publish results</button>
            {unscored > 0 && <p className="mt-2 text-xs text-muted">{unscored} {unscored === 1 ? "entry has" : "entries have"} no score yet.</p>}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-bold">Entries</h2>
        {entries.isPending ? <Skeleton className="mt-3 h-40 w-full" /> : entries.isError ? (
          <EmptyState title="Entries aren't available yet.">{entries.error instanceof ApiError ? entries.error.message : "Try again shortly."}</EmptyState>
        ) : entries.data.items.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No entries.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {entries.data.items.map((e) => (
              <article key={e.id} className="rounded-md border border-ink bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="font-semibold">{e.title}</h3>
                  {e.my_score && <span className="rounded-full bg-yellow px-2 py-0.5 text-[11px]">your score {e.my_score.total.toFixed(2)}</span>}
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm">{e.body}</p>
                {e.links.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-3 text-sm">
                    {e.links.map((l) => <li key={l}><a href={l} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">{new URL(l).hostname} ↗︎</a></li>)}
                  </ul>
                )}
                {judging && (
                  <div className="mt-3 flex gap-2">
                    {e.own_entry ? <p className="text-xs text-muted">This is your own entry, so you can't score it.</p> : <button onClick={() => startScoring(e.id)} className="btn text-xs">{e.my_score ? "Change score" : "Score"}</button>}
                    <button onClick={() => setDqFor(e.id)} className="btn-secondary text-xs">Disqualify</button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <Dialog open={!!scoring} onClose={() => setScoring(null)} title={`Score: ${entry?.title ?? ""}`}>
        <form onSubmit={(ev) => { ev.preventDefault(); score.mutate(); }} className="flex flex-col gap-3">
          {entries.data?.criteria.map((c) => (
            <label key={c.name} className="text-sm font-medium">
              {c.name} <span className="text-muted">(weight {c.weight})</span>: <span className="tabular-nums">{scores[c.name] ?? 0}</span>
              <input type="range" min={0} max={10} step={1} value={scores[c.name] ?? 0} onChange={(ev) => setScores((s) => ({ ...s, [c.name]: Number(ev.target.value) }))} className="mt-1 w-full" />
            </label>
          ))}
          <textarea value={note} onChange={(ev) => setNote(ev.target.value)} maxLength={500} rows={2} placeholder="Note (optional)" className="rounded-md border border-ink bg-white px-3 py-2 text-sm" />
          <div className="flex gap-3">
            <button type="button" className="btn-secondary" onClick={() => setScoring(null)}>Cancel</button>
            <button type="submit" disabled={score.isPending} className="btn disabled:opacity-60">Save score</button>
          </div>
        </form>
      </Dialog>

      <Dialog open={!!dqFor} onClose={() => setDqFor(null)} title="Disqualify this entry">
        <textarea value={dqReason} onChange={(ev) => setDqReason(ev.target.value)} rows={2} placeholder="Reason (required)" className="w-full rounded-md border border-ink bg-white px-3 py-2 text-sm" />
        <div className="mt-4 flex gap-3">
          <button className="btn-secondary" onClick={() => setDqFor(null)}>Cancel</button>
          <button className="btn disabled:opacity-60" disabled={dqReason.trim().length < 5 || dq.isPending} onClick={() => dq.mutate()}>Disqualify</button>
        </div>
      </Dialog>

      <Dialog open={publishing} onClose={() => setPublishing(false)} title="Publish results?">
        <p className="text-sm text-muted">This closes the challenge, awards prize points to the top three and the badge to first place, and tells everyone who entered. It cannot be undone.</p>
        <div className="mt-4 flex gap-3">
          <button className="btn-secondary" onClick={() => setPublishing(false)}>Cancel</button>
          <button className="btn disabled:opacity-60" disabled={publish.isPending} onClick={() => publish.mutate()}>{publish.isPending ? "Publishing…" : "Publish"}</button>
        </div>
      </Dialog>
    </>
  );
}
