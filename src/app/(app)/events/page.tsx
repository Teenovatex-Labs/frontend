"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { eventsApi } from "@/lib/services";
import { keys } from "@/lib/labs";
import { eventDay, eventTime, startsIn } from "@/lib/dates";
import PageHeader from "@/components/ui/PageHeader";
import Tabs from "@/components/ui/Tabs";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import RsvpButton from "@/components/events/RsvpButton";

export default function EventsPage() {
  const [when, setWhen] = useState<"upcoming" | "past">("upcoming");
  const events = useQuery({ queryKey: keys.events(when), queryFn: () => eventsApi.list(when) });

  return (
    <main className="mx-auto w-full max-w-[860px] px-5 py-10 md:px-10 md:py-14">
      <PageHeader eyebrow="Community" title="Come" accent="hang out.">
        Lab nights, workshops and meetups. Save your spot and we&rsquo;ll remind you.
      </PageHeader>

      <div className="mt-8">
        <Tabs
          label="When"
          options={[
            { id: "upcoming", label: "Upcoming" },
            { id: "past", label: "Past" },
          ]}
          value={when}
          onChange={setWhen}
        />
      </div>

      <div className="mt-8">
        {events.isPending ? (
          <div className="space-y-4" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : events.isError ? (
          <EmptyState title="That didn't load." action={<button className="btn-secondary" onClick={() => events.refetch()}>Try again</button>} />
        ) : events.data.events.length === 0 ? (
          <EmptyState title={when === "upcoming" ? "Nothing on the calendar yet." : "No past events."}>
            {when === "upcoming" ? "New events are added all the time. Check back soon." : "Once events have happened they'll be listed here."}
          </EmptyState>
        ) : (
          <ul className="space-y-5">
            {events.data.events.map((e) => {
              const soon = startsIn(e.starts_at, e.ends_at);
              return (
                <li key={e.id} className="flex flex-col gap-4 border border-ink bg-white p-5 shadow-[5px_5px_0_var(--ink)] sm:flex-row sm:items-center">
                  <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center border border-ink bg-yellow text-center">
                    <span className="text-[11px] font-semibold uppercase tracking-wide">
                      {new Date(e.starts_at).toLocaleDateString(undefined, { month: "short" })}
                    </span>
                    <span className="text-[32px] font-semibold leading-none tabular-nums">{new Date(e.starts_at).getDate()}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    {soon && <p className="eyebrow text-rose">{soon}</p>}
                    <h2 className="text-[22px] leading-tight tracking-[-0.02em]">
                      <Link href={`/events/${e.id}`} className="hover:underline">{e.title}</Link>
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                      {eventDay(e.starts_at)} · {eventTime(e.starts_at)}
                      {e.location ? ` · ${e.location}` : ""} · {e.rsvp_count} going
                    </p>
                  </div>
                  <RsvpButton event={e} over={when === "past"} />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
