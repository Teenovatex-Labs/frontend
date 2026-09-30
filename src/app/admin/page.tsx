"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/services";
import { keys } from "@/lib/labs";
import StatTile from "@/components/ui/StatTile";
import Skeleton from "@/components/ui/Skeleton";

export default function AdminOverview() {
  const stats = useQuery({ queryKey: keys.admin("stats"), queryFn: adminApi.stats, refetchInterval: 60_000 });
  const s = stats.data;
  return (
    <>
      <h1 className="text-[32px] tracking-[-0.03em] md:text-[44px]">Overview</h1>
      {stats.isPending ? (
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">{[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-28 w-full" />)}</div>
      ) : stats.isError || !s ? (
        <p className="mt-6 text-muted">Couldn&rsquo;t load the numbers.</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
          <Link href="/admin/reports"><StatTile label="Open reports" value={s.open_reports} tone={s.open_reports ? "pink" : "cream"} hint={s.open_reports ? "Needs a look" : "All clear"} /></Link>
          <Link href="/admin/members"><StatTile label="Members" value={s.users} tone="yellow" hint={`${s.new_users_7d} joined this week`} /></Link>
          <StatTile label="Labs" value={s.labs} tone="white" />
          <StatTile label="Posts" value={s.posts} tone="white" />
          <Link href="/admin/members"><StatTile label="Paused accounts" value={s.suspended} tone="cream" /></Link>
        </div>
      )}
    </>
  );
}
