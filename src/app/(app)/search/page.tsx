"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { searchApi } from "@/lib/services";
import { categoryLabel, keys } from "@/lib/labs";
import { eventDay } from "@/lib/dates";
import PageHeader from "@/components/ui/PageHeader";
import Avatar from "@/components/ui/Avatar";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="eyebrow text-rose">{title}</h2>
      <ul className="mt-3 divide-y divide-line border border-ink bg-white">{children}</ul>
    </section>
  );
}
const row = "block px-4 py-3 hover:bg-yellow/40";

function SearchInner() {
  const params = useSearchParams();
  const router = useRouter();
  const initial = params.get("q") ?? "";
  const [input, setInput] = useState(initial);
  const [q, setQ] = useState(initial.trim());

  // Wait for a pause in typing, and keep the address bar in step so a search can be shared.
  useEffect(() => {
    const t = window.setTimeout(() => {
      const next = input.trim();
      setQ(next);
      router.replace(next ? `/search?q=${encodeURIComponent(next)}` : "/search");
    }, 300);
    return () => window.clearTimeout(t);
  }, [input, router]);

  const results = useQuery({ queryKey: keys.search(q), queryFn: () => searchApi.find(q), enabled: q.length >= 2 });
  const r = results.data;
  const total = r ? r.labs.length + r.people.length + r.posts.length + r.lessons.length + r.events.length : 0;

  return (
    <main className="mx-auto w-full max-w-[760px] px-5 py-10 md:px-10 md:py-14">
      <PageHeader eyebrow="Search" title="Find" accent="anything." />
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        autoFocus
        placeholder="Labs, people, posts, lessons, events"
        aria-label="Search"
        className="mt-6 w-full rounded-md border border-ink bg-white px-4 py-3 text-[16px] outline-none focus:ring-2 focus:ring-rose"
      />

      {q.length < 2 ? (
        <p className="mt-6 text-sm text-muted">Type at least two letters.</p>
      ) : results.isPending ? (
        <div className="mt-8 space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : results.isError ? (
        <div className="mt-8"><EmptyState title="That didn't load." action={<button className="btn-secondary" onClick={() => results.refetch()}>Try again</button>} /></div>
      ) : total === 0 ? (
        <div className="mt-8"><EmptyState title={`Nothing for “${q}”.`}>Try a different word, or check the spelling.</EmptyState></div>
      ) : (
        <>
          {r!.labs.length > 0 && (
            <Group title="Labs">
              {r!.labs.map((l) => (
                <li key={l.id}><Link href={`/labs/${l.slug}`} className={row}><span className="font-medium">{l.name}</span> <span className="text-xs text-muted">{categoryLabel(l.category)} · @{l.user.username} · ♥ {l.vote_count}</span><span className="block text-sm text-muted">{l.short_description}</span></Link></li>
              ))}
            </Group>
          )}
          {r!.people.length > 0 && (
            <Group title="People">
              {r!.people.map((p) => (
                <li key={p.username}><Link href={`/u/${p.username}`} className={`${row} flex items-center gap-3`}><Avatar name={p.username} src={p.avatar_url} size={36} /><span><span className="font-medium">{p.full_name}</span> <span className="text-sm text-muted">@{p.username}</span></span></Link></li>
              ))}
            </Group>
          )}
          {r!.posts.length > 0 && (
            <Group title="Community">
              {r!.posts.map((p) => (
                <li key={p.id}><Link href={`/community/posts/${p.id}`} className={row}><span className="font-medium">{p.title}</span> <span className="text-xs text-muted">{p.space.name} · @{p.author}</span><span className="block truncate text-sm text-muted">{p.excerpt}</span></Link></li>
              ))}
            </Group>
          )}
          {r!.lessons.length > 0 && (
            <Group title="Lessons">
              {r!.lessons.map((l) => (
                <li key={`${l.track.slug}/${l.slug}`}><Link href={`/learn/${l.track.slug}/${l.slug}`} className={row}><span className="font-medium">{l.title}</span> <span className="text-xs text-muted">{l.track.title}</span><span className="block text-sm text-muted">{l.summary}</span></Link></li>
              ))}
            </Group>
          )}
          {r!.events.length > 0 && (
            <Group title="Events">
              {r!.events.map((e) => (
                <li key={e.id}><Link href={`/events/${e.id}`} className={row}><span className="font-medium">{e.title}</span> <span className="text-xs text-muted">{eventDay(e.starts_at)}{e.location ? ` · ${e.location}` : ""}</span></Link></li>
              ))}
            </Group>
          )}
        </>
      )}
    </main>
  );
}

// useSearchParams must sit under a Suspense boundary for the page to build.
export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchInner />
    </Suspense>
  );
}
