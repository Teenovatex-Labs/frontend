"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { challengesAdminApi, type Challenge, type ChallengeCriterion, type ChallengeKind } from "@/lib/services";
import { keys } from "@/lib/labs";
import { ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import Dialog from "@/components/ui/Dialog";

const KINDS: ChallengeKind[] = ["weekly", "monthly", "special"];
const field = "mt-1 w-full rounded-md border border-ink bg-white px-3 py-2 text-sm";
const toLocal = (iso: string) => {
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const fmt = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

type Form = {
  title: string; description: string; rules: string; kind: ChallengeKind; starts_at: string; ends_at: string; judging_ends_at: string;
  entry_limit: string; criteria: { name: string; weight: string }[];
};
const blank: Form = {
  title: "", description: "", rules: "", kind: "weekly", starts_at: "", ends_at: "", judging_ends_at: "", entry_limit: "1",
  criteria: [{ name: "Creativity", weight: "3" }, { name: "Execution", weight: "3" }, { name: "Impact", weight: "2" }],
};

export default function ChallengesAdminPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const fail = (e: unknown) => toast.error(e instanceof ApiError ? e.message : "That didn't work.");
  const refresh = () => qc.invalidateQueries({ queryKey: keys.admin("challenges") });
  const list = useQuery({ queryKey: keys.admin("challenges"), queryFn: challengesAdminApi.list });

  const [editing, setEditing] = useState<Challenge | "new" | null>(null);
  const [form, setForm] = useState<Form>(blank);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const locked = editing !== null && editing !== "new" && editing.status !== "draft";

  const open = (c: Challenge | "new") => {
    setEditing(c);
    setForm(c === "new" ? blank : {
      title: c.title, description: c.description, rules: c.rules, kind: c.kind, starts_at: toLocal(c.starts_at), ends_at: toLocal(c.ends_at),
      judging_ends_at: toLocal(c.judging_ends_at), entry_limit: String(c.entry_limit),
      criteria: c.criteria.map((x) => ({ name: x.name, weight: String(x.weight) })),
    });
  };

  const save = useMutation({
    mutationFn: () => {
      const criteria: ChallengeCriterion[] = form.criteria.filter((c) => c.name.trim()).map((c) => ({ name: c.name.trim(), weight: Number(c.weight) }));
      const dates = { starts_at: new Date(form.starts_at).toISOString(), ends_at: new Date(form.ends_at).toISOString(), judging_ends_at: new Date(form.judging_ends_at).toISOString() };
      const base = { title: form.title, description: form.description, kind: form.kind, ...dates };
      if (editing === "new") return challengesAdminApi.create({ ...base, rules: form.rules, criteria, entry_limit: Number(form.entry_limit) });
      if (locked) return challengesAdminApi.update((editing as Challenge).id, base);
      return challengesAdminApi.update((editing as Challenge).id, { ...base, rules: form.rules, criteria, entry_limit: Number(form.entry_limit) });
    },
    onSuccess: () => { toast.success("Saved."); setEditing(null); void refresh(); },
    onError: fail,
  });

  const advance = useMutation({
    mutationFn: (v: { id: string; to: "open" | "judging" }) => challengesAdminApi.advance(v.id, v.to),
    onSuccess: () => { toast.success("Updated."); void refresh(); },
    onError: fail,
  });
  const [confirming, setConfirming] = useState<{ c: Challenge; to: "open" | "judging" } | null>(null);

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-[32px] tracking-[-0.03em] md:text-[44px]">Challenges</h1>
        <button onClick={() => open("new")} className="btn text-sm">New challenge</button>
      </div>

      <div className="mt-6">
        {list.isPending ? <Skeleton className="h-64 w-full" /> : list.data?.items.length === 0 ? (
          <EmptyState title="No challenges yet." />
        ) : (
          <div className="flex flex-col gap-3">
            {list.data?.items.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-ink bg-white p-4">
                <div>
                  <p className="font-semibold">
                    {c.title} <span className="ml-1 rounded-full bg-cream px-2 py-0.5 text-[11px]">{c.kind}</span>{" "}
                    <span className="rounded-full bg-yellow px-2 py-0.5 text-[11px]">{c.status}</span>
                  </p>
                  <p className="text-sm text-muted">{fmt(c.starts_at)} to {fmt(c.ends_at)} · {c.entries} {c.entries === 1 ? "entry" : "entries"}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {c.status !== "closed" && <button onClick={() => open(c)} className="btn-secondary text-xs">Edit</button>}
                  {c.status === "draft" && <button onClick={() => setConfirming({ c, to: "open" })} className="btn text-xs">Open for entries</button>}
                  {c.status === "open" && <button onClick={() => setConfirming({ c, to: "judging" })} className="btn text-xs">Start judging</button>}
                  {(c.status === "judging" || c.status === "closed") && <Link href={`/admin/challenges/${c.id}`} className="btn text-xs">{c.status === "judging" ? "Judge" : "Results"}</Link>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!editing} onClose={() => setEditing(null)} title={editing === "new" ? "New challenge" : "Edit challenge"}>
        <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto pr-1">
          {locked && <p className="rounded-md bg-yellow/40 p-2 text-xs">Once a challenge is open, only the wording and dates can change.</p>}
          <label className="text-sm font-medium">Title<input value={form.title} onChange={(e) => set("title", e.target.value)} required minLength={3} maxLength={100} className={field} /></label>
          <label className="text-sm font-medium">Description<textarea value={form.description} onChange={(e) => set("description", e.target.value)} required minLength={10} maxLength={1500} rows={3} className={field} /></label>
          {!locked && <label className="text-sm font-medium">Rules<textarea value={form.rules} onChange={(e) => set("rules", e.target.value)} required minLength={10} maxLength={3000} rows={3} className={field} /></label>}
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm font-medium">Kind
              <select value={form.kind} onChange={(e) => set("kind", e.target.value as ChallengeKind)} className={field}>{KINDS.map((k) => <option key={k} value={k}>{k}</option>)}</select>
            </label>
            {!locked && <label className="text-sm font-medium">Entries each<input type="number" min={1} max={5} value={form.entry_limit} onChange={(e) => set("entry_limit", e.target.value)} className={field} /></label>}
          </div>
          <label className="text-sm font-medium">Opens<input type="datetime-local" value={form.starts_at} onChange={(e) => set("starts_at", e.target.value)} required className={field} /></label>
          <label className="text-sm font-medium">Entries close<input type="datetime-local" value={form.ends_at} onChange={(e) => set("ends_at", e.target.value)} required className={field} /></label>
          <label className="text-sm font-medium">Judging finishes<input type="datetime-local" value={form.judging_ends_at} onChange={(e) => set("judging_ends_at", e.target.value)} required className={field} /></label>
          {!locked && (
            <fieldset className="flex flex-col gap-2">
              <legend className="text-sm font-medium">Judging criteria (weight 1 to 10)</legend>
              {form.criteria.map((c, i) => (
                <div key={i} className="flex gap-2">
                  <input value={c.name} onChange={(e) => set("criteria", form.criteria.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} placeholder="Name" className="w-full rounded-md border border-ink bg-white px-3 py-2 text-sm" />
                  <input type="number" min={1} max={10} value={c.weight} onChange={(e) => set("criteria", form.criteria.map((x, j) => (j === i ? { ...x, weight: e.target.value } : x)))} className="w-20 rounded-md border border-ink bg-white px-3 py-2 text-sm" />
                  {form.criteria.length > 1 && <button type="button" onClick={() => set("criteria", form.criteria.filter((_, j) => j !== i))} className="text-sm text-muted underline">Remove</button>}
                </div>
              ))}
              {form.criteria.length < 8 && <button type="button" onClick={() => set("criteria", [...form.criteria, { name: "", weight: "1" }])} className="self-start text-sm underline underline-offset-4">Add criterion</button>}
            </fieldset>
          )}
          <div className="flex gap-3">
            <button type="button" className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
            <button type="submit" disabled={save.isPending} className="btn disabled:opacity-60">Save</button>
          </div>
        </form>
      </Dialog>

      <Dialog open={!!confirming} onClose={() => setConfirming(null)} title={confirming?.to === "open" ? "Open for entries?" : "Start judging?"}>
        <p className="text-sm text-muted">
          {confirming?.to === "open"
            ? "Criteria, rules and the entry limit lock once a challenge is open."
            : "Entries close and judges can start scoring. This cannot be undone."}
        </p>
        <div className="mt-4 flex gap-3">
          <button className="btn-secondary" onClick={() => setConfirming(null)}>Cancel</button>
          <button className="btn disabled:opacity-60" disabled={advance.isPending} onClick={() => { advance.mutate({ id: confirming!.c.id, to: confirming!.to }); setConfirming(null); }}>Confirm</button>
        </div>
      </Dialog>
    </>
  );
}
