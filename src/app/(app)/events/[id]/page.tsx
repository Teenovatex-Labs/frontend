"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { eventsApi } from "@/lib/services";
import { keys } from "@/lib/labs";
import { eventDay, eventTime, startsIn } from "@/lib/dates";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import RsvpButton from "@/components/events/RsvpButton";

export default function EventPage() {
  const { id } = useParams<{ id: string }>();
  const event = useQuery({ queryKey: keys.event(id), queryFn: () => eventsApi.get(id) });

  if (event.isPending) {
    return (
      <main className="mx-auto w-full max-w-[760px] space-y-4 px-5 py-10 md:px-10 md:py-14">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-32 w-full" />
      </main>
    );
  }
  if (event.isError) {
    const missing = event.error instanceof ApiError && event.error.status === 404;
    return (
      <main className="mx-auto w-full max-w-[760px] px-5 py-14 md:px-10">
        <EmptyState title={missing ? "We couldn't find that event." : "That didn't load."} action={<Link href="/events" className="btn-secondary">All events</Link>} />
      </main>
    );
  }

  const e = event.data;
  const status = startsIn(e.starts_at, e.ends_at);
  const over = status === "";

  return (
    <main className="mx-auto w-full max-w-[760px] px-5 py-10 md:px-10 md:py-14">
      <Link href="/events" className="text-sm text-muted underline underline-offset-4 hover:text-ink">← All events</Link>
      {status && <p className="eyebrow mt-6 text-rose">{status}</p>}
      <h1 className="mt-2 text-[36px] leading-[1.05] md:text-[52px]">{e.title}</h1>
      <p className="mt-4 text-muted">
        {eventDay(e.starts_at)} · {eventTime(e.starts_at)}
        {e.ends_at ? ` to ${eventTime(e.ends_at)}` : ""}
      </p>
      {e.location && (
        <p className="mt-1 text-muted">
          {/^https?:\/\//.test(e.location) ? (
            <a href={e.location} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-rose">Join link ↗︎</a>
          ) : (
            e.location
          )}
        </p>
      )}
      <p className="mt-6 whitespace-pre-line text-lg">{e.description}</p>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <RsvpButton event={e} over={over} />
        <span className="text-sm text-muted">
          {e.rsvp_count} going{e.capacity ? ` · ${Math.max(0, e.capacity - e.rsvp_count)} spots left` : ""}
        </span>
      </div>
    </main>
  );
}
