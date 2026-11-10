"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { adminApi, admissionsAdminApi } from "@/lib/services";
import { useAuth } from "@/context/AuthContext";
import { keys } from "@/lib/labs";
import StatTile from "@/components/ui/StatTile";
import Skeleton from "@/components/ui/Skeleton";

export default function AdminOverview() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const stats = useQuery({ queryKey: keys.admin("stats"), queryFn: adminApi.stats, refetchInterval: 60_000 });
  const admissions = useQuery({ queryKey: keys.admin("applications-stats"), queryFn: () => admissionsAdminApi.stats(), enabled: isAdmin, refetchInterval: 60_000 });
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
      {isAdmin && <section className="mt-10 rounded-[20px] border border-ink bg-white p-5 shadow-[5px_5px_0_var(--ink)] md:p-7" aria-labelledby="admissions-heading">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow text-rose">Admissions</p>
            <h2 id="admissions-heading" className="mt-1 text-2xl tracking-tight">The human review queue</h2>
            <p className="mt-2 max-w-[560px] text-sm text-muted">Alfred gathers each applicant&rsquo;s story. Reviewers read the evidence and make the decision.</p>
          </div>
          <Link href="/admin/applications" className="btn btn-sm">Review applications</Link>
        </div>
        {admissions.isPending ? <Skeleton className="mt-5 h-20 w-full" /> : admissions.isError ? (
          <p className="mt-5 text-sm text-muted">Admissions numbers are temporarily unavailable.</p>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Link href="/admin/applications" className="rounded-[14px] border border-ink bg-pink p-4"><span className="block text-xs font-semibold uppercase tracking-wider">Unclaimed</span><strong className="mt-2 block text-3xl">{admissions.data?.unclaimed ?? 0}</strong></Link>
            <Link href="/admin/applications" className="rounded-[14px] border border-ink bg-yellow p-4"><span className="block text-xs font-semibold uppercase tracking-wider">Submitted</span><strong className="mt-2 block text-3xl">{admissions.data?.counts.submitted ?? 0}</strong></Link>
            <Link href="/admin/applications" className="rounded-[14px] border border-ink bg-cream p-4"><span className="block text-xs font-semibold uppercase tracking-wider">Under review</span><strong className="mt-2 block text-3xl">{admissions.data?.counts.under_review ?? 0}</strong></Link>
          </div>
        )}
        <Link href="/admin/applications/windows" className="mt-5 inline-block text-sm font-semibold text-rose underline underline-offset-4">Manage application windows</Link>
      </section>}
    </>
  );
}
