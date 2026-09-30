"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminContentApi } from "@/lib/services";
import { keys } from "@/lib/labs";
import BarChart from "@/components/admin/BarChart";
import StatTile from "@/components/ui/StatTile";
import Tabs from "@/components/ui/Tabs";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";

export default function AnalyticsPage() {
  const [days, setDays] = useState<"7" | "30" | "90">("30");
  const q = useQuery({ queryKey: keys.admin("analytics", days), queryFn: () => adminContentApi.analytics(Number(days)) });
  const a = q.data;

  return (
    <>
      <h1 className="text-[32px] tracking-[-0.03em] md:text-[44px]">Analytics</h1>
      <div className="mt-5"><Tabs label="Range" value={days} onChange={setDays} options={[{ id: "7", label: "7 days" }, { id: "30", label: "30 days" }, { id: "90", label: "90 days" }]} /></div>

      {q.isPending ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-44 w-full" />)}</div>
      ) : q.isError || !a ? (
        <div className="mt-6"><EmptyState title="That didn't load." /></div>
      ) : (
        <>
          <h2 className="mt-8 text-[20px] tracking-[-0.02em]">What members actually use</h2>
          <p className="mt-1 text-sm text-muted">Out of {a.adoption.users} members, how many have done each thing at least once.</p>
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatTile label="Started a lab" value={`${a.adoption.started_a_lab_pct}%`} tone="yellow" />
            <StatTile label="Voted" value={`${a.adoption.voted_pct}%`} tone="pink" />
            <StatTile label="Finished a lesson" value={`${a.adoption.finished_a_lesson_pct}%`} tone="cream" />
            <StatTile label="Posted or commented" value={`${a.adoption.posted_or_commented_pct}%`} tone="white" />
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <BarChart title="New members" points={a.signups} tone="bg-yellow" />
            <BarChart title="Active members" points={a.active_members} />
            <BarChart title="Labs started" points={a.labs_started} tone="bg-yellow" />
            <BarChart title="Votes" points={a.votes} />
            <BarChart title="Community posts" points={a.posts} tone="bg-yellow" />
            <BarChart title="Messages sent" points={a.messages} />
          </div>
          <p className="mt-6 text-xs text-muted">Counts only, never anyone&rsquo;s messages. Days are in UTC.</p>
        </>
      )}
    </>
  );
}
