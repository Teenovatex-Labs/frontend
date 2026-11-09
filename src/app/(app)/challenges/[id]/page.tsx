"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { challengesApi, type ChallengeEntry } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { keys } from "@/lib/labs";
import Avatar from "@/components/ui/Avatar";
import Dialog from "@/components/ui/Dialog";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import CelebrationCard, { useFirstTime } from "@/components/ui/CelebrationCard";
import { useToast } from "@/components/ui/Toast";

const when = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
const ordinal = (n: number) => (n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`);
const field = "w-full rounded-md border border-ink bg-white px-3 py-2 text-sm";

export default function ChallengePage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const toast = useToast();
  const fail = (e: unknown) => toast.error(e instanceof ApiError ? e.message : "That didn't work.");
  const c = useQuery({ queryKey: keys.challenge(id), queryFn: () => challengesApi.get(id) });
  const refresh = () => { void qc.invalidateQueries({ queryKey: keys.challenge(id) }); void qc.invalidateQueries({ queryKey: keys.challenges }); };

  const placed = c.data && c.data.results_published && c.data.my_results.length > 0 ? c.data.my_results[0].place : null;
  const [showResult, markResultSeen] = useFirstTime(placed ? `challenge:${id}` : null);

  const [editing, setEditing] = useState<ChallengeEntry | "new" | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [links, setLinks] = useState("");
  const openForm = (e: ChallengeEntry | "new") => {
    setEditing(e);
    setTitle(e === "new" ? "" : e.title);
    setBody(e === "new" ? "" : e.body);
    setLinks(e === "new" ? "" : e.links.join("\n"));
  };
  const save = useMutation({
    mutationFn: () => {
      const ls = links.split("\n").map((l) => l.trim()).filter(Boolean);
      return editing === "new" ? challengesApi.submit(id, { title, body, links: ls }) : challengesApi.edit((editing as ChallengeEntry).id, { title, body, links: ls });
    },
    onSuccess: () => { toast.success("Entry saved."); setEditing(null); refresh(); },
    onError: fail,
  });
  const withdraw = useMutation({
    mutationFn: (entryId: string) => challengesApi.withdraw(entryId),
    onSuccess: () => { toast.success("Entry withdrawn."); refresh(); },
    onError: fail,
  });

  if (c.isPending) return <main className="mx-auto w-full max-w-[760px] px-5 py-10 md:px-10"><Skeleton className="h-64 w-full" /></main>;
  if (c.isError) {
    return (
      <main className="mx-auto w-full max-w-[760px] px-5 py-14 md:px-10">
        <EmptyState title="We couldn't find that challenge." action={<Link href="/challenges" className="btn-secondary">All challenges</Link>} />
      </main>
    );
  }
  const ch = c.data;
  const live = ch.my_entries.filter((e) => e.status !== "withdrawn");
  const canEnter = ch.accepting_entries && live.filter((e) => e.status === "submitted").length < ch.entry_limit;
  const placeOf = (entryId: string) => ch.my_results.find((r) => r.entry_id === entryId)?.place;

  return (
    <main className="mx-auto w-full max-w-[760px] px-5 py-10 md:px-10 md:py-14">
      <Link href="/challenges" className="text-sm underline underline-offset-4">All challenges</Link>
      <p className="eyebrow mt-4 text-rose">{ch.kind} challenge</p>
      <h1 className="mt-2 text-[34px] leading-[1.1] tracking-[-0.03em] md:text-[44px]">{ch.title}</h1>
      <p className="mt-2 text-sm text-muted">Entries {when(ch.starts_at)} to {when(ch.ends_at)}</p>
      <p className="mt-5 whitespace-pre-wrap text-lg">{ch.description}</p>

      {showResult && placed && (
        <CelebrationCard className="mt-6" lottie="/lottie/challenge-complete.json" title={`Results are in: you placed ${ordinal(placed)}.`} onClose={markResultSeen}>
          {ch.title}
        </CelebrationCard>
      )}

      <h2 className="mt-8 text-xl font-bold">Rules</h2>
      <p className="mt-2 whitespace-pre-wrap text-sm">{ch.rules}</p>
      <h2 className="mt-8 text-xl font-bold">How it's judged</h2>
      <ul className="mt-2 flex flex-wrap gap-2 text-sm">
        {ch.criteria.map((k) => <li key={k.name} className="rounded-full border border-ink bg-white px-3 py-1">{k.name} <span className="text-muted">×{k.weight}</span></li>)}
      </ul>

      {ch.results_published && ch.podium.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold">Winners</h2>
          <ol className="mt-3 flex flex-col gap-2">
            {ch.podium.map((p, i) => (
              <li key={i} className="flex items-center gap-3 border border-ink bg-yellow/40 p-3">
                <span className="w-10 font-bold">{ordinal(p.place)}</span>
                {p.username && <Avatar name={p.username} src={p.avatar_url} size={32} />}
                <span className="text-sm">
                  {p.username ? <Link href={`/u/${p.username}`} className="font-medium underline underline-offset-4">@{p.username}</Link> : "Member"}
                  <span className="text-muted"> · {p.entry_title}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Your {ch.entry_limit === 1 ? "entry" : "entries"}</h2>
          {canEnter && <button onClick={() => openForm("new")} className="btn text-sm">Enter</button>}
        </div>
        {live.length === 0 ? (
          <p className="mt-3 text-sm text-muted">{ch.accepting_entries ? "You haven't entered yet." : "You didn't enter this one."}</p>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {live.map((e) => (
              <article key={e.id} className="border border-ink bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold">{e.title}</h3>
                  <span className="rounded-full bg-cream px-2 py-0.5 text-[11px]">{placeOf(e.id) ? `placed ${ordinal(placeOf(e.id)!)}` : e.status}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm">{e.body}</p>
                {e.links.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-3 text-sm">
                    {e.links.map((l) => <li key={l}><a href={l} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">{new URL(l).hostname} ↗︎</a></li>)}
                  </ul>
                )}
                {e.status === "submitted" && ch.status !== "closed" && (
                  <div className="mt-3 flex gap-3 text-sm">
                    {ch.accepting_entries && <button onClick={() => openForm(e)} className="underline underline-offset-4">Edit</button>}
                    <button onClick={() => withdraw.mutate(e.id)} disabled={withdraw.isPending} className="text-muted underline underline-offset-4">Withdraw</button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <Dialog open={!!editing} onClose={() => setEditing(null)} title={editing === "new" ? "Enter this challenge" : "Edit your entry"}>
        <form onSubmit={(ev) => { ev.preventDefault(); save.mutate(); }} className="flex flex-col gap-3">
          <input value={title} onChange={(ev) => setTitle(ev.target.value)} placeholder="Title" required minLength={3} maxLength={100} className={field} />
          <textarea value={body} onChange={(ev) => setBody(ev.target.value)} placeholder="Tell the judges about your work" required minLength={10} maxLength={4000} rows={6} className={field} />
          <textarea value={links} onChange={(ev) => setLinks(ev.target.value)} placeholder={"Links, one per line (https:// only, up to 5)"} rows={3} className={field} />
          <div className="flex gap-3">
            <button type="button" className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
            <button type="submit" disabled={save.isPending} className="btn disabled:opacity-60">{save.isPending ? "Saving…" : "Submit"}</button>
          </div>
        </form>
      </Dialog>
    </main>
  );
}
