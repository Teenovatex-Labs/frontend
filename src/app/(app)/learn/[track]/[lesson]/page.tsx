"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { learnApi } from "@/lib/services";
import { keys } from "@/lib/labs";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import LessonBody from "@/components/learn/LessonBody";

export default function LessonPage() {
  const { track, lesson } = useParams<{ track: string; lesson: string }>();
  const qc = useQueryClient();
  const toast = useToast();
  const q = useQuery({ queryKey: keys.lesson(track, lesson), queryFn: () => learnApi.lesson(track, lesson) });

  const complete = useMutation({
    mutationFn: (id: string) => learnApi.complete(id),
    onSuccess: (r) => {
      toast.success(r.points_awarded > 0 ? `Lesson finished! +${r.points_awarded} points` : "Already finished. Nice.");
      void qc.invalidateQueries({ queryKey: ["learn"] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Couldn't save that. Try again."),
  });

  if (q.isPending) {
    return (
      <main className="mx-auto w-full max-w-[680px] space-y-4 px-5 py-10 md:px-10 md:py-14">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </main>
    );
  }
  if (q.isError) {
    const missing = q.error instanceof ApiError && q.error.status === 404;
    return (
      <main className="mx-auto w-full max-w-[680px] px-5 py-14 md:px-10">
        <EmptyState title={missing ? "We couldn't find that lesson." : "That didn't load."} action={<Link href={`/learn/${track}`} className="btn-secondary">Back to the track</Link>} />
      </main>
    );
  }

  const l = q.data;
  return (
    <main className="mx-auto w-full max-w-[680px] px-5 py-10 md:px-10 md:py-14">
      <Link href={`/learn/${l.track.slug}`} className="text-sm text-muted underline underline-offset-4 hover:text-ink">
        ← {l.track.title}
      </Link>
      <p className="eyebrow mt-6 text-rose">{l.minutes} min read</p>
      <h1 className="mt-2 text-[34px] leading-[1.08] md:text-[46px]">{l.title}</h1>
      <p className="mt-3 text-lg text-muted">{l.summary}</p>

      <div className="mt-8">
        <LessonBody body={l.body} />
      </div>

      <div className="mt-12 border-t border-line pt-6">
        {l.completed ? (
          <p className="font-medium">✓ You finished this lesson.</p>
        ) : (
          <button className="btn disabled:opacity-60" disabled={complete.isPending} onClick={() => complete.mutate(l.id)}>
            {complete.isPending ? "Saving…" : "I finished this lesson"} <span aria-hidden="true">✓</span>
          </button>
        )}
        <div className="mt-6 flex items-center justify-between gap-4 text-sm">
          {l.prev ? <Link href={`/learn/${l.track.slug}/${l.prev.slug}`} className="underline underline-offset-4 hover:text-rose">← {l.prev.title}</Link> : <span />}
          {l.next ? (
            <Link href={`/learn/${l.track.slug}/${l.next.slug}`} className="underline underline-offset-4 hover:text-rose">{l.next.title} →</Link>
          ) : (
            <Link href={`/learn/${l.track.slug}`} className="underline underline-offset-4 hover:text-rose">Back to the track →</Link>
          )}
        </div>
      </div>
    </main>
  );
}
