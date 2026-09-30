"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { communityApi } from "@/lib/services";
import { keys } from "@/lib/labs";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";

const TONES = ["bg-yellow", "bg-pink", "bg-cream", "bg-white"];

export default function CommunityPage() {
  const spaces = useQuery({ queryKey: keys.spaces, queryFn: communityApi.spaces });
  return (
    <main className="mx-auto w-full max-w-[900px] px-5 py-10 md:px-10 md:py-14">
      <PageHeader eyebrow="Community" title="Talk to" accent="other builders.">
        Ask for help, share what you made, and cheer each other on. Be kind: everyone here is a teenager like you.
      </PageHeader>
      <div className="mt-8">
        {spaces.isPending ? (
          <div className="grid gap-6 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-36 w-full" />)}
          </div>
        ) : spaces.isError ? (
          <EmptyState title="That didn't load." action={<button className="btn-secondary" onClick={() => spaces.refetch()}>Try again</button>} />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {spaces.data.spaces.map((s, i) => (
              <Link key={s.id} href={`/community/${s.slug}`} className={`flex flex-col border border-ink p-6 shadow-[5px_5px_0_var(--ink)] transition-transform hover:-translate-y-1 ${TONES[i % TONES.length]}`}>
                <h2 className="text-[24px] leading-tight tracking-[-0.03em]">{s.name}</h2>
                <p className="mt-2 flex-1 text-sm text-ink/70">{s.description}</p>
                <p className="mt-4 text-xs text-ink/60">{s.post_count} post{s.post_count === 1 ? "" : "s"}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
