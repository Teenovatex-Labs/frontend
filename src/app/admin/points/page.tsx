"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { pointRulesApi, seasonsApi } from "@/lib/services";
import { keys } from "@/lib/labs";
import { ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import Skeleton from "@/components/ui/Skeleton";
import Dialog from "@/components/ui/Dialog";

export default function PointsAdminPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const fail = (e: unknown) => toast.error(e instanceof ApiError ? e.message : "That didn't work.");

  const rules = useQuery({ queryKey: keys.admin("point-rules"), queryFn: pointRulesApi.list });
  const seasons = useQuery({ queryKey: keys.admin("seasons"), queryFn: seasonsApi.list });

  const [editing, setEditing] = useState<string | null>(null);
  const [points, setPoints] = useState("");
  const [cap, setCap] = useState("");
  const update = useMutation({
    mutationFn: () => pointRulesApi.update(editing!, { points: points === "" ? undefined : Number(points), daily_cap: cap === "" ? null : Number(cap) }),
    onSuccess: () => { toast.success("Saved."); setEditing(null); void qc.invalidateQueries({ queryKey: keys.admin("point-rules") }); },
    onError: fail,
  });
  const reset = useMutation({
    mutationFn: (key: string) => pointRulesApi.reset(key),
    onSuccess: () => { toast.success("Reset to default."); void qc.invalidateQueries({ queryKey: keys.admin("point-rules") }); },
    onError: fail,
  });

  const [startingSeason, setStartingSeason] = useState(false);
  const [seasonName, setSeasonName] = useState("");
  const startSeason = useMutation({
    mutationFn: () => seasonsApi.start({ confirm: true, name: seasonName || undefined }),
    onSuccess: (r) => { toast.success(`Season ${r.ended.number} archived (${r.archived_members} members). Season ${r.current.number} has begun.`); setStartingSeason(false); setSeasonName(""); void qc.invalidateQueries({ queryKey: keys.admin("seasons") }); },
    onError: fail,
  });

  return (
    <>
      <h1 className="text-[32px] tracking-[-0.03em] md:text-[44px]">Points</h1>

      <section className="mt-6">
        <h2 className="font-bold">Point rules</h2>
        {rules.isPending ? <Skeleton className="mt-3 h-64 w-full" /> : (
          <div className="mt-3 overflow-x-auto border border-ink bg-white">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="border-b border-ink bg-yellow text-xs uppercase tracking-wide"><tr><th className="px-4 py-3">Action</th><th className="px-4 py-3">Points</th><th className="px-4 py-3">Daily cap</th><th className="px-4 py-3" /></tr></thead>
              <tbody className="divide-y divide-line">
                {rules.data?.items.map((r) => (
                  <tr key={r.key}>
                    <td className="px-4 py-3"><p className="font-medium">{r.key.replace(/_/g, " ")}</p><p className="text-xs text-muted">{r.description}</p></td>
                    <td className="px-4 py-3 tabular-nums">{r.points}</td>
                    <td className="px-4 py-3 tabular-nums">{r.daily_cap ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => { setEditing(r.key); setPoints(String(r.points)); setCap(r.daily_cap === null ? "" : String(r.daily_cap)); }} className="mr-3 font-semibold underline underline-offset-4">Edit</button>
                      {r.customised && <button onClick={() => reset.mutate(r.key)} className="text-muted underline underline-offset-4">Reset</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Seasons</h2>
          <button onClick={() => setStartingSeason(true)} className="btn-secondary text-sm">Start new season</button>
        </div>
        {seasons.isPending ? <Skeleton className="mt-3 h-40 w-full" /> : (
          <div className="mt-3 flex flex-col gap-2">
            {seasons.data?.items.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-md border border-ink bg-white p-3.5">
                <p className="font-medium">{s.name} {s.is_current && <span className="ml-2 rounded-full bg-yellow px-2 py-0.5 text-[11px]">current</span>}</p>
                <p className="text-sm text-muted">{new Date(s.starts_at).toLocaleDateString()} {s.ends_at ? `– ${new Date(s.ends_at).toLocaleDateString()}` : ""}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <Dialog open={!!editing} onClose={() => setEditing(null)} title={`Edit ${editing?.replace(/_/g, " ") ?? ""}`}>
        <form onSubmit={(e) => { e.preventDefault(); update.mutate(); }} className="flex flex-col gap-3">
          <label className="text-sm font-medium">Points
            <input type="number" step="0.01" min="0" value={points} onChange={(e) => setPoints(e.target.value)} className="mt-1 w-full rounded-md border border-ink bg-white px-3 py-2" />
          </label>
          <label className="text-sm font-medium">Daily cap (blank = none)
            <input type="number" step="0.01" min="0" value={cap} onChange={(e) => setCap(e.target.value)} className="mt-1 w-full rounded-md border border-ink bg-white px-3 py-2" />
          </label>
          <div className="flex gap-3">
            <button type="button" className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
            <button type="submit" disabled={update.isPending} className="btn disabled:opacity-60">Save</button>
          </div>
        </form>
      </Dialog>

      <Dialog open={startingSeason} onClose={() => setStartingSeason(false)} title="Start a new season">
        <p className="text-sm text-muted">Archives everyone&rsquo;s current total and resets points to 0. This cannot be undone.</p>
        <input value={seasonName} onChange={(e) => setSeasonName(e.target.value)} placeholder="Season name (optional)" className="mt-3 w-full rounded-md border border-ink bg-white px-3 py-2 text-sm" />
        <div className="mt-4 flex gap-3">
          <button className="btn-secondary" onClick={() => setStartingSeason(false)}>Cancel</button>
          <button className="btn disabled:opacity-60" disabled={startSeason.isPending} onClick={() => startSeason.mutate()}>{startSeason.isPending ? "Starting…" : "Start season"}</button>
        </div>
      </Dialog>
    </>
  );
}
