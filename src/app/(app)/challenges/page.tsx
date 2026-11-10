"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { challengesApi } from "@/lib/services";
import { keys } from "@/lib/labs";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";

const day = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });

export default function ChallengesPage() {
  const list = useQuery({ queryKey: keys.challenges, queryFn: challengesApi.list });
  return (
    <main className="mx-auto w-full max-w-[960px] px-5 py-10 md:px-10 md:py-14">
      <PageHeader eyebrow="Compete" title="Challenges" accent="for makers.">Enter your best work, get scored by judges, and win points and badges.</PageHeader>
      <div className="mt-8">
        {list.isPending ? <Skeleton className="h-48 w-full" /> : list.isError ? (
          <EmptyState title="That didn't load.">Check your connection and try again.</EmptyState>
        ) : list.data.items.length === 0 ? (
          <EmptyState title="No challenges right now.">Check back soon.</EmptyState>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {list.data.items.map((c) => (
              <Link key={c.id} href={`/challenges/${c.id}`} className="group flex min-h-[196px] flex-col gap-2 rounded-[22px] border border-ink bg-white p-5 shadow-[3px_3px_0_var(--ink)] transition-transform hover:-translate-y-0.5">
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="rounded-full bg-cream px-2 py-0.5">{c.kind}</span>
                  <span className={`rounded-full px-2 py-0.5 ${c.accepting_entries ? "bg-yellow" : "bg-line"}`}>
                    {c.accepting_entries ? "open for entries" : c.status === "closed" ? "results out" : c.status === "judging" ? "judging" : "closed"}
                  </span>
                </div>
                <h2 className="flex items-start justify-between gap-2 text-xl font-bold">{c.title}<span aria-hidden="true" className="shrink-0 text-rose transition-transform group-hover:translate-x-1">↗</span></h2>
                <p className="line-clamp-2 text-sm text-muted">{c.description}</p>
                <p className="mt-auto text-xs text-muted">{day(c.starts_at)} to {day(c.ends_at)}{c.my_entries > 0 ? ` · you've entered` : ""}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
