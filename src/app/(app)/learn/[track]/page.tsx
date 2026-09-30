"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { learnApi } from "@/lib/services";
import { keys } from "@/lib/labs";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";

export default function TrackPage() {
  const { track } = useParams<{ track: string }>();
  const q = useQuery({ queryKey: keys.track(track), queryFn: () => learnApi.track(track) });

  if (q.isPending) {
    return (
      <main className="mx-auto w-full max-w-[760px] space-y-4 px-5 py-10 md:px-10 md:py-14">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </main>
    );
  }
  if (q.isError) {
    const missing = q.error instanceof ApiError && q.error.status === 404;
    return (
      <main className="mx-auto w-full max-w-[760px] px-5 py-14 md:px-10">
        <EmptyState title={missing ? "We couldn't find that track." : "That didn't load."} action={<Link href="/learn" className="btn-secondary">All tracks</Link>} />
      </main>
    );
  }

  const t = q.data;
  const next = t.lessons.find((l) => !l.completed) ?? t.lessons[0];
  const done = t.lessons.filter((l) => l.completed).length;

  return (
    <main className="mx-auto w-full max-w-[760px] px-5 py-10 md:px-10 md:py-14">
      <Link href="/learn" className="text-sm text-muted underline underline-offset-4 hover:text-ink">← All tracks</Link>
      <h1 className="mt-5 text-[36px] leading-[1.05] md:text-[52px]">{t.title}</h1>
      <p className="mt-3 max-w-[520px] text-muted">{t.description}</p>
      {next && (
        <Link href={`/learn/${t.slug}/${next.slug}`} className="btn mt-6 inline-flex">
          {done === 0 ? "Start the first lesson" : done === t.lessons.length ? "Read it again" : "Keep going"} <span aria-hidden="true">↗︎</span>
        </Link>
      )}

      <ol className="mt-10 space-y-4">
        {t.lessons.map((l, i) => (
          <li key={l.id}>
            <Link
              href={`/learn/${t.slug}/${l.slug}`}
              className="flex items-center gap-4 border border-ink bg-white p-4 shadow-[4px_4px_0_var(--ink)] transition-transform hover:-translate-y-0.5"
            >
              <span
                aria-hidden="true"
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border border-ink text-sm font-semibold ${l.completed ? "bg-pink" : "bg-cream"}`}
              >
                {l.completed ? "✓" : i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{l.title}</span>
                <span className="block text-sm text-muted">{l.summary}</span>
              </span>
              <span className="shrink-0 text-xs text-muted">{l.minutes} min</span>
            </Link>
          </li>
        ))}
      </ol>
    </main>
  );
}
