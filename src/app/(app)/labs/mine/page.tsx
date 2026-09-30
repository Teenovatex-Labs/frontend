"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import LabCard from "@/components/labs/LabCard";
import { LabGridSkeleton } from "@/components/labs/LabGrid";
import { keys } from "@/lib/labs";
import { labsApi } from "@/lib/services";

export default function MyLabsPage() {
  const mine = useQuery({ queryKey: keys.myLabs, queryFn: labsApi.mine });

  return (
    <main className="mx-auto w-full max-w-[1120px] px-5 py-10 md:px-10 md:py-14">
      <PageHeader
        eyebrow="Labs"
        title="My"
        accent="labs."
        action={<Link href="/labs/new" className="btn">Start a lab <span aria-hidden="true">↗︎</span></Link>}
      >
        Everything you&rsquo;ve started, in one place.
      </PageHeader>

      <div className="mt-8">
        {mine.isPending ? (
          <LabGridSkeleton count={3} />
        ) : mine.isError ? (
          <EmptyState title="That didn't load." action={<button className="btn-secondary" onClick={() => mine.refetch()}>Try again</button>} />
        ) : mine.data.projects.length === 0 ? (
          <EmptyState title="Your first lab starts here." action={<Link href="/labs/new" className="btn">Start a lab</Link>}>
            A lab is anything you&rsquo;re making: an app, a game, a design, a robot. Share it, get votes, earn points.
          </EmptyState>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {mine.data.projects.map((lab) => (
              <LabCard key={lab.id} lab={lab} mine />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
