"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { pairingApi } from "@/lib/services";
import { keys } from "@/lib/labs";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";

export default function PairingPage() {
  const mine = useQuery({ queryKey: keys.pairings, queryFn: pairingApi.mine });
  return (
    <main className="mx-auto w-full max-w-[760px] px-5 py-10 md:px-10 md:py-14">
      <PageHeader eyebrow="Together" title="Your" accent="pairing.">The team matches members who can help each other grow. Your partner and goal show up here.</PageHeader>
      <div className="mt-8">
        {mine.isPending ? <Skeleton className="h-40 w-full" /> : mine.isError ? (
          <EmptyState title="That didn't load.">Check your connection and try again.</EmptyState>
        ) : mine.data.items.length === 0 ? (
          <EmptyState title="No pairing right now.">If the team finds a good match, you'll get a notification.</EmptyState>
        ) : (
          <div className="flex flex-col gap-4">
            {mine.data.items.map((p) => (
              <article key={p.id} className="border border-ink bg-white p-5 shadow-[3px_3px_0_var(--ink)]">
                <p className="text-sm text-muted">Paired with</p>
                <p className="text-xl font-bold">
                  {p.partners.map((x, i) => (
                    <span key={x.username}>{i > 0 && " and "}<Link href={`/u/${x.username}`} className="underline underline-offset-4">@{x.username}</Link></span>
                  ))}
                </p>
                <p className="mt-3 text-sm font-medium">Goal</p>
                <p className="text-sm">{p.goal}</p>
                <p className="mt-3 text-xs text-muted">Runs until {new Date(p.ends_on).toLocaleDateString(undefined, { dateStyle: "medium" })}{p.supervised ? " · a team member is supervising" : ""}</p>
                {p.conversation_id && <Link href={`/messages/${p.conversation_id}`} className="btn mt-4 inline-block text-sm">Open chat</Link>}
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
