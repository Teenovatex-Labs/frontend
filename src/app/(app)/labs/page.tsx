"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import PageHeader from "@/components/ui/PageHeader";
import Tabs from "@/components/ui/Tabs";
import EmptyState from "@/components/ui/EmptyState";
import LabCard from "@/components/labs/LabCard";
import { LabGridSkeleton } from "@/components/labs/LabGrid";
import { keys, categoryLabel } from "@/lib/labs";
import { labsApi, type LabSort } from "@/lib/services";

const SORTS: { id: LabSort; label: string }[] = [
  { id: "trending", label: "Trending" },
  { id: "newest", label: "Newest" },
  { id: "votes", label: "Most loved" },
];

export default function ShowcasePage() {
  const [sort, setSort] = useState<LabSort>("trending");
  const [category, setCategory] = useState("");
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");

  // Wait for a pause in typing before asking the server.
  useEffect(() => {
    const t = window.setTimeout(() => setSearch(input.trim()), 300);
    return () => window.clearTimeout(t);
  }, [input]);

  const categories = useQuery({ queryKey: keys.categories, queryFn: labsApi.categories });
  const filters = { sort, category: category || undefined, search: search || undefined, limit: 12 };
  const list = useInfiniteQuery({
    queryKey: keys.labList(filters),
    queryFn: ({ pageParam }) => labsApi.list({ ...filters, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.pages ? last.page + 1 : undefined),
  });

  const labs = list.data?.pages.flatMap((p) => p.projects) ?? [];
  const catOptions = [{ id: "", label: "All" }, ...(categories.data?.categories ?? []).map((c) => ({ id: c.name, label: `${categoryLabel(c.name)} ${c.count}` }))];

  return (
    <main className="mx-auto w-full max-w-[1120px] px-5 py-10 md:px-10 md:py-14">
      <PageHeader
        eyebrow="Labs"
        title="What teens are"
        accent="building."
        action={
          <Link href="/labs/new" className="btn">
            Start a lab <span aria-hidden="true">↗︎</span>
          </Link>
        }
      >
        Browse what other Teenovators are making, vote for the ones you love (three votes a day), and start your own.
      </PageHeader>

      <div className="mt-8 flex flex-col gap-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search labs"
          aria-label="Search labs"
          className="w-full max-w-[420px] rounded-md border border-ink bg-cream px-4 py-2.5 text-[15px] outline-none focus:ring-2 focus:ring-rose"
        />
        <Tabs label="Sort labs" options={SORTS} value={sort} onChange={setSort} />
        {catOptions.length > 1 && <Tabs label="Filter by category" options={catOptions} value={category} onChange={setCategory} />}
      </div>

      <div className="mt-8">
        {list.isPending ? (
          <LabGridSkeleton />
        ) : list.isError ? (
          <EmptyState title="That didn't load." action={<button className="btn-secondary" onClick={() => list.refetch()}>Try again</button>}>
            Check your connection and give it another go.
          </EmptyState>
        ) : labs.length === 0 ? (
          <EmptyState
            title={search || category ? "Nothing matches yet." : "No labs yet. Be the first."}
            action={<Link href="/labs/new" className="btn">Start a lab</Link>}
          >
            {search || category ? "Try a different search or category." : "Every big thing started as one small lab."}
          </EmptyState>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {labs.map((lab) => (
                <LabCard key={lab.id} lab={lab} />
              ))}
            </div>
            {list.hasNextPage && (
              <div className="mt-10 flex justify-center">
                <button className="btn-secondary" disabled={list.isFetchingNextPage} onClick={() => list.fetchNextPage()}>
                  {list.isFetchingNextPage ? "Loading…" : "Show more"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
