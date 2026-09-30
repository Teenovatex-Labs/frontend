"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { learnApi } from "@/lib/services";
import { keys } from "@/lib/labs";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";

export default function LearnPage() {
  const tracks = useQuery({ queryKey: keys.tracks, queryFn: learnApi.tracks });

  return (
    <main className="mx-auto w-full max-w-[860px] px-5 py-10 md:px-10 md:py-14">
      <PageHeader eyebrow="Learn" title="Get" accent="better at it.">
        Short lessons written for teens who want to build. Finish a lesson, earn 5 points.
      </PageHeader>

      <div className="mt-8">
        {tracks.isPending ? (
          <div className="grid gap-6 sm:grid-cols-2" aria-busy="true">
            {[0, 1].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : tracks.isError ? (
          <EmptyState title="That didn't load." action={<button className="btn-secondary" onClick={() => tracks.refetch()}>Try again</button>} />
        ) : tracks.data.tracks.length === 0 ? (
          <EmptyState title="Lessons are on the way.">We&rsquo;re writing the first tracks now.</EmptyState>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {tracks.data.tracks.map((t, i) => {
              const pct = t.lesson_count ? Math.round((t.completed_count / t.lesson_count) * 100) : 0;
              return (
                <Link
                  key={t.id}
                  href={`/learn/${t.slug}`}
                  className={`flex flex-col border border-ink p-6 shadow-[5px_5px_0_var(--ink)] transition-transform hover:-translate-y-1 ${i % 2 ? "bg-pink" : "bg-yellow"}`}
                >
                  <p className="eyebrow text-ink/60">
                    {t.lesson_count} lessons · about {t.minutes} min
                  </p>
                  <h2 className="mt-3 text-[26px] leading-tight tracking-[-0.03em]">{t.title}</h2>
                  <p className="mt-2 flex-1 text-sm text-ink/70">{t.description}</p>
                  <div className="mt-5">
                    <div className="h-2 overflow-hidden rounded-full border border-ink bg-cream" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Your progress">
                      <div className="h-full bg-ink transition-[width] duration-500" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-1.5 text-xs text-ink/60">
                      {t.completed_count === 0 ? "Not started" : t.completed_count === t.lesson_count ? "Finished!" : `${t.completed_count} of ${t.lesson_count} done`}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
