"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { adminContentApi } from "@/lib/services";
import { keys } from "@/lib/labs";
import LessonBody from "@/components/learn/LessonBody";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

// One page for both: /admin/learn/new?track=<id> adds a lesson, /admin/learn/<lesson id> edits one.
export default function LessonEditor() {
  const { id } = useParams<{ id: string }>();
  const creating = id === "new";
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const [trackId, setTrackId] = useState<string | null>(null);
  const [f, setF] = useState({ title: "", slug: "", summary: "", minutes: "5", body: "" });
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (creating) setTrackId(new URLSearchParams(window.location.search).get("track"));
  }, [creating]);

  const lesson = useQuery({ queryKey: keys.admin("lesson", id), queryFn: () => adminContentApi.lesson(id), enabled: !creating });
  useEffect(() => {
    if (lesson.data) setF({ title: lesson.data.title, slug: lesson.data.slug, summary: lesson.data.summary, minutes: String(lesson.data.minutes), body: lesson.data.body });
  }, [lesson.data]);

  const save = useMutation({
    mutationFn: () => {
      const data = { title: f.title.trim(), slug: f.slug, summary: f.summary.trim(), body: f.body, minutes: Number(f.minutes) || 5 };
      return creating ? adminContentApi.createLesson(trackId!, data) : adminContentApi.updateLesson(id, data);
    },
    onSuccess: () => {
      toast.success("Saved.");
      void qc.invalidateQueries({ queryKey: ["admin"] });
      void qc.invalidateQueries({ queryKey: ["learn"] });
      router.push("/admin/learn");
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Couldn't save that."),
  });

  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => {
    const value = e.target.value;
    setF((s) => ({ ...s, [k]: value, ...(k === "title" && creating && !slugTouched ? { slug: slugify(value) } : {}) }));
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (creating && !trackId) return setError("Open this from a track's “Add a lesson” button.");
    save.mutate();
  };

  if (!creating && lesson.isPending) return <Skeleton className="h-96 w-full" />;
  if (!creating && lesson.isError) return <p className="text-muted">Couldn&rsquo;t load that lesson. <Link href="/admin/learn" className="underline">Back</Link></p>;

  return (
    <>
      <Link href="/admin/learn" className="text-sm text-muted underline underline-offset-4 hover:text-ink">← Learn</Link>
      <h1 className="mt-4 text-[32px] tracking-[-0.03em] md:text-[40px]">{creating ? "New lesson" : "Edit lesson"}</h1>

      <form onSubmit={submit} className="mt-6 grid gap-8 lg:grid-cols-2">
        <div className="grid content-start gap-4">
          <label className="text-sm font-medium">Title<input value={f.title} onChange={set("title")} maxLength={120} className="mt-1.5 w-full rounded-md border border-ink bg-white px-3 py-2" /></label>
          <label className="text-sm font-medium">Web address (lowercase, dashes)
            <input value={f.slug} onChange={(e) => { setSlugTouched(true); set("slug")(e); }} maxLength={60} className="mt-1.5 w-full rounded-md border border-ink bg-white px-3 py-2 font-mono text-sm" />
          </label>
          <label className="text-sm font-medium">One-line summary<input value={f.summary} onChange={set("summary")} maxLength={200} className="mt-1.5 w-full rounded-md border border-ink bg-white px-3 py-2" /></label>
          <label className="text-sm font-medium">Minutes to read<input type="number" min={1} max={120} value={f.minutes} onChange={set("minutes")} className="mt-1.5 w-24 rounded-md border border-ink bg-white px-3 py-2" /></label>
          <label className="text-sm font-medium">The lesson
            <textarea value={f.body} onChange={set("body")} rows={18} maxLength={20000} className="mt-1.5 w-full rounded-md border border-ink bg-white px-3 py-2 font-mono text-[13px] leading-relaxed" />
          </label>
          <p className="text-xs text-muted">Formatting: <code>## Heading</code>, <code>- bullet</code>, <code>**bold**</code>, four spaces to indent a code block, a blank line between paragraphs.</p>
          {error && <p role="alert" className="text-sm text-rose">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" className="btn disabled:opacity-60" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save lesson"}</button>
            <Link href="/admin/learn" className="btn-secondary">Cancel</Link>
          </div>
        </div>

        <div>
          <p className="eyebrow text-rose">Preview, as members see it</p>
          <div className="mt-3 border border-ink bg-cream p-6">
            <h2 className="text-[30px] leading-[1.1]">{f.title || "Lesson title"}</h2>
            <p className="mt-2 text-muted">{f.summary}</p>
            <div className="mt-6"><LessonBody body={f.body || "Start writing to see it here."} /></div>
          </div>
        </div>
      </form>
    </>
  );
}
