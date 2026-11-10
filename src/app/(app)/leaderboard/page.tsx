"use client";

import Link from "next/link";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { pointsApi, seasonBoardApi, type LeaderboardEntry } from "@/lib/services";
import { keys } from "@/lib/labs";
import PageHeader from "@/components/ui/PageHeader";
import Tabs from "@/components/ui/Tabs";
import Avatar from "@/components/ui/Avatar";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";

const PAGE = 20;
const MEDALS = ["bg-yellow", "bg-pink", "bg-cream"];

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<"all" | "week" | "past">("week");
  const board = useInfiniteQuery({
    queryKey: [...keys.leaderboard, period],
    queryFn: ({ pageParam }) => pointsApi.leaderboard(pageParam, PAGE, period === "past" ? "all" : period),
    enabled: period !== "past",
    initialPageParam: 1,
    getNextPageParam: (last, all) => (last.leaderboard.length === PAGE ? all.length + 1 : undefined),
  });
  const rows = board.data?.pages.flatMap((p) => p.leaderboard) ?? [];

  return (
    <main className="mx-auto w-full max-w-[760px] px-5 py-10 md:px-10 md:py-14">
      <PageHeader eyebrow="Leaderboard" title="Who&rsquo;s" accent="on top.">
        Points come from votes on your labs, finishing lessons and showing up every day.
      </PageHeader>

      <div className="mt-6">
        <Tabs label="Time range" value={period} onChange={setPeriod} options={[{ id: "week", label: "This week" }, { id: "all", label: "This season" }, { id: "past", label: "Past seasons" }]} />
        {period === "week" && <p className="mt-2 text-xs text-muted">A fresh race every week: points from the last 7 days. Anyone can climb it.</p>}
      </div>

      <div className="mt-8">
        {period === "past" ? <PastSeasons me={user?.username} /> : board.isPending ? (
          <div className="space-y-3" aria-busy="true">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : board.isError ? (
          <EmptyState title="That didn't load." action={<button className="btn-secondary" onClick={() => board.refetch()}>Try again</button>} />
        ) : rows.length === 0 ? (
          <EmptyState title={period === "week" ? "A fresh week. Nobody's scored yet." : "Nobody's on the board yet."}>Earn the first points and you&rsquo;ll be number one.</EmptyState>
        ) : (
          <>
            <ol className="space-y-3">
              {rows.map((r) => {
                const me = r.username === user?.username;
                return (
                  <li key={r.username}>
                    <Link
                      href={`/u/${r.username}`}
                      className={`flex items-center gap-4 rounded-[18px] border border-ink p-3 pr-5 shadow-[4px_4px_0_var(--ink)] transition-transform hover:-translate-y-0.5 ${me ? "bg-yellow" : "bg-white"}`}
                    >
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink text-sm font-semibold tabular-nums ${MEDALS[r.rank - 1] ?? "bg-cream"}`}
                      >
                        {r.rank}
                      </span>
                      <Avatar name={r.username} src={r.avatar_url} size={40} />
                      <span className="min-w-0 flex-1 truncate font-medium">
                        @{r.username}
                        {me && <span className="ml-2 text-xs font-normal text-ink/75">(you)</span>}
                      </span>
                      <span className="text-right">
                        <span className="block text-lg font-semibold tabular-nums">{r.points.toLocaleString()}</span>
                        <span className="block text-[11px] uppercase tracking-wide text-ink/70">points</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
            {board.hasNextPage && (
              <div className="mt-8 flex justify-center">
                <button className="btn-secondary" disabled={board.isFetchingNextPage} onClick={() => board.fetchNextPage()}>
                  {board.isFetchingNextPage ? "Loading…" : "Show more"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function PastSeasons({ me }: { me?: string }) {
  const [picked, setPicked] = useState<string | null>(null);
  const seasons = useQuery({ queryKey: ["seasons", "list"], queryFn: seasonBoardApi.list });
  const finished = seasons.data?.items.filter((s) => !s.is_current) ?? [];
  const id = picked ?? finished[0]?.id ?? null;
  const board = useQuery({ queryKey: ["seasons", "board", id], queryFn: () => seasonBoardApi.board(id!), enabled: !!id });

  if (seasons.isPending) return <Skeleton className="h-40 w-full" />;
  if (finished.length === 0) return <EmptyState title="No finished seasons yet.">When a season ends, its final standings are kept here.</EmptyState>;
  const rows: LeaderboardEntry[] = board.data?.leaderboard ?? [];
  return (
    <div>
      <select value={id ?? ""} onChange={(e) => setPicked(e.target.value)} aria-label="Season" className="rounded-md border border-ink bg-white px-3 py-2 text-sm">
        {finished.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      {board.isPending ? <Skeleton className="mt-4 h-40 w-full" /> : rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted">Nobody finished with points in this season.</p>
      ) : (
        <ol className="mt-4 space-y-3">
          {rows.map((r) => (
            <li key={r.username}>
              <Link href={`/u/${r.username}`} className={`flex items-center gap-4 rounded-[18px] border border-ink p-3 pr-5 ${r.username === me ? "bg-yellow" : "bg-white"}`}>
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink text-sm font-semibold tabular-nums ${MEDALS[r.rank - 1] ?? "bg-cream"}`}>{r.rank}</span>
                <Avatar name={r.username} src={r.avatar_url} size={40} />
                <span className="min-w-0 flex-1 truncate font-medium">@{r.username}</span>
                <span className="text-lg font-semibold tabular-nums">{r.points.toLocaleString()}</span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
