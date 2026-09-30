"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { adminContentApi } from "@/lib/services";
import { keys } from "@/lib/labs";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

export default function LearnAdmin() {
  const qc = useQueryClient();
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const tracks = useQuery({ queryKey: keys.admin("learn"), queryFn: adminContentApi.tracks });
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin"] }).then(() => qc.invalidateQueries({ queryKey: ["learn"] }));
  const fail = (e: unknown) => toast.error(e instanceof ApiError ? e.message : "That didn't work.");

  const create = useMutation({
    mutationFn: () => adminContentApi.createTrack({ slug: slugify(title), title: title.trim(), description: description.trim(), published: false }),
    onSuccess: () => { setTitle(""); setDescription(""); setError(null); toast.success("Track created (hidden until you publish it)."); void refresh(); },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Couldn't create that."),
  });
  const toggle = useMutation({ mutationFn: (v: { id: string; published: boolean }) => adminContentApi.updateTrack(v.id, { published: v.published }), onSuccess: () => void refresh(), onError: fail });
  const remove = useMutation({ mutationFn: adminContentApi.deleteTrack, onSuccess: () => void refresh(), onError: fail });
  const removeLesson = useMutation({ mutationFn: adminContentApi.deleteLesson, onSuccess: () => void refresh(), onError: fail });
  const move = useMutation({ mutationFn: (v: { id: string; position: number }) => adminContentApi.updateLesson(v.id, { position: v.position }), onSuccess: () => void refresh(), onError: fail });

  return (
    <>
      <h1 className="text-[32px] tracking-[-0.03em] md:text-[44px]">Learn</h1>
      <p className="mt-2 text-sm text-muted">Tracks and lessons members see in Learn. New tracks start hidden; publish when they&rsquo;re ready. Editing a lesson keeps everyone&rsquo;s progress.</p>

      <form onSubmit={(e: FormEvent) => { e.preventDefault(); setError(null); create.mutate(); }} className="mt-6 grid max-w-[640px] gap-3 border border-ink bg-white p-5">
        <label className="text-sm font-medium">New track title<input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} className="mt-1.5 w-full rounded-md border border-ink bg-cream px-3 py-2" /></label>
        <label className="text-sm font-medium">What it covers<textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} maxLength={500} className="mt-1.5 w-full rounded-md border border-ink bg-cream px-3 py-2 text-sm" /></label>
        {error && <p role="alert" className="text-sm text-rose">{error}</p>}
        <button type="submit" className="btn self-start disabled:opacity-60" disabled={create.isPending || title.trim().length < 2 || description.trim().length < 5}>Create track</button>
      </form>

      <div className="mt-8 space-y-5">
        {tracks.isPending ? <Skeleton className="h-40 w-full" /> : !tracks.data || tracks.data.tracks.length === 0 ? <EmptyState title="No tracks yet." /> : tracks.data.tracks.map((t) => (
          <section key={t.id} className="border border-ink bg-white p-5">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-[20px] tracking-[-0.02em]">{t.title}</h2>
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${t.published ? "bg-pink" : "bg-line"}`}>{t.published ? "Published" : "Hidden"}</span>
              <span className="ml-auto flex gap-4 text-sm">
                <button className="underline underline-offset-4" onClick={() => toggle.mutate({ id: t.id, published: !t.published })}>{t.published ? "Hide" : "Publish"}</button>
                <button className="text-rose underline underline-offset-4" onClick={() => { if (confirm(`Delete "${t.title}" and all its lessons? Members' progress on them is lost.`)) remove.mutate(t.id); }}>Delete</button>
              </span>
            </div>
            <p className="mt-1 text-sm text-muted">{t.description}</p>
            <ol className="mt-4 divide-y divide-line border border-line">
              {t.lessons.map((l, i) => (
                <li key={l.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5 text-sm">
                  <span className="w-5 text-muted tabular-nums">{i + 1}</span>
                  <span className="min-w-0 flex-1"><span className="font-medium">{l.title}</span> <span className="text-xs text-muted">{l.minutes} min</span></span>
                  <button className="text-muted hover:text-ink disabled:opacity-30" disabled={i === 0} onClick={() => move.mutate({ id: l.id, position: i - 1 })} aria-label={`Move ${l.title} up`}>↑</button>
                  <button className="text-muted hover:text-ink disabled:opacity-30" disabled={i === t.lessons.length - 1} onClick={() => move.mutate({ id: l.id, position: i + 1 })} aria-label={`Move ${l.title} down`}>↓</button>
                  <Link href={`/admin/learn/${l.id}`} className="underline underline-offset-4">Edit</Link>
                  <button className="text-rose underline underline-offset-4" onClick={() => { if (confirm(`Delete "${l.title}"?`)) removeLesson.mutate(l.id); }}>Delete</button>
                </li>
              ))}
            </ol>
            <Link href={`/admin/learn/new?track=${t.id}`} className="btn-secondary btn-sm mt-4 inline-flex">Add a lesson</Link>
          </section>
        ))}
      </div>
    </>
  );
}
