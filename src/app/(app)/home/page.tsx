"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { eventsApi, inboxApi, labsApi, labsDeepApi, learnApi, votesApi } from "@/lib/services";
import { keys, timeAgo } from "@/lib/labs";
import { eventDay, eventTime } from "@/lib/dates";
import StatTile from "@/components/ui/StatTile";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";

function Panel({ title, href, cta, children }: { title: string; href: string; cta: string; children: React.ReactNode }) {
  return (
    <Card className="flex flex-col p-5 md:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[20px] tracking-[-0.02em]">{title}</h2>
        <Link href={href} className="text-sm text-rose underline underline-offset-4 hover:text-ink">
          {cta}
        </Link>
      </div>
      <div className="mt-4 flex-1">{children}</div>
    </Card>
  );
}

const Loading = () => (
  <div className="space-y-3" aria-busy="true">
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-10 w-3/4" />
  </div>
);

const Nothing = ({ children }: { children: React.ReactNode }) => <p className="text-sm text-muted">{children}</p>;

export default function HomePage() {
  const { user } = useAuth();
  const votes = useQuery({ queryKey: keys.dailyVotes, queryFn: votesApi.daily, enabled: !!user });
  const events = useQuery({ queryKey: keys.events("upcoming"), queryFn: () => eventsApi.list("upcoming"), enabled: !!user });
  const mine = useQuery({ queryKey: keys.myLabs, queryFn: labsApi.mine, enabled: !!user });
  const inbox = useQuery({ queryKey: keys.inbox, queryFn: inboxApi.list, enabled: !!user });
  const tasks = useQuery({ queryKey: keys.myTasks, queryFn: labsDeepApi.myTasks, enabled: !!user });
  const tracks = useQuery({ queryKey: keys.tracks, queryFn: learnApi.tracks, enabled: !!user });

  if (!user) return null;

  const first = user.full_name.split(" ")[0];
  const track = tracks.data?.tracks.find((t) => t.completed_count > 0 && t.completed_count < t.lesson_count) ?? tracks.data?.tracks.find((t) => t.completed_count === 0);
  const remaining = votes.data?.votes_remaining;

  return (
    <main className="mx-auto w-full max-w-[1080px] px-5 py-10 md:px-10 md:py-16">
      <p className="eyebrow text-rose">Home</p>
      <h1 className="mt-4 text-[40px] leading-[1.05] md:text-[64px]">
        Hey <span className="font-serif font-normal italic">{first}.</span>
      </h1>
      <p className="mt-4 max-w-[520px] text-muted">
        {user.streak > 1 ? `${user.streak} days in a row. Keep it going.` : "Good to see you. Here's what's happening."}
      </p>

      <div className="mt-10 grid gap-5 sm:grid-cols-3">
        <StatTile label="Points" value={user.points.toLocaleString()} tone="yellow" />
        <StatTile label="Day streak" value={user.streak} tone="pink" className="sm:rotate-1" />
        <StatTile label="Rank" value={user.rank ? `#${user.rank}` : "Unranked"} className="sm:-rotate-1" />
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <Panel title="Today" href="/labs" cta="Explore labs">
          {votes.isPending ? (
            <Loading />
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex gap-1.5" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <span key={i} className={`h-8 w-8 rounded-full border border-ink ${i < (remaining ?? 0) ? "bg-pink" : "bg-cream"}`} />
                ))}
              </div>
              <p className="text-sm">
                <strong>{remaining ?? 0}</strong> of 3 votes left today.{" "}
                <span className="text-muted">{remaining === 0 ? "They come back tomorrow." : "Back a lab you love."}</span>
              </p>
            </div>
          )}
        </Panel>

        <Panel title="Up next" href="/labs/mine" cta="My labs">
          {tasks.isPending ? (
            <Loading />
          ) : tasks.data && tasks.data.tasks.length > 0 ? (
            <ul className="space-y-3">
              {tasks.data.tasks.slice(0, 4).map((t) => {
                const late = !!t.due_at && new Date(t.due_at) < new Date();
                return (
                  <li key={t.id}>
                    <Link href={`/labs/${t.lab.slug}?tab=board`} className="block hover:underline">
                      <span className="font-medium">{t.title}</span>
                      <span className="block text-sm text-muted">
                        {t.lab.name}
                        {t.due_at && <span className={late ? "font-semibold text-rose" : ""}> · due {new Date(t.due_at).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</span>}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Nothing>No open tasks. Plan your next step on a lab&rsquo;s Board.</Nothing>
          )}
        </Panel>

        <Panel title="Keep learning" href="/learn" cta="All tracks">
          {tracks.isPending ? (
            <Loading />
          ) : track ? (
            <Link href={`/learn/${track.slug}`} className="block hover:underline">
              <p className="font-medium">{track.title}</p>
              <p className="mt-1 text-sm text-muted">
                {track.completed_count === 0 ? `${track.lesson_count} short lessons` : `${track.completed_count} of ${track.lesson_count} done`}
              </p>
            </Link>
          ) : (
            <Nothing>You&rsquo;ve finished every track. Nice.</Nothing>
          )}
        </Panel>

        <Panel title="Coming up" href="/events" cta="All events">
          {events.isPending ? (
            <Loading />
          ) : events.data && events.data.events.length > 0 ? (
            <ul className="space-y-3">
              {events.data.events.slice(0, 2).map((e) => (
                <li key={e.id}>
                  <Link href={`/events/${e.id}`} className="block hover:underline">
                    <span className="font-medium">{e.title}</span>
                    <span className="block text-sm text-muted">
                      {eventDay(e.starts_at)} · {eventTime(e.starts_at)}
                      {e.has_rsvped ? " · you're going" : ""}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Nothing>Nothing on the calendar yet.</Nothing>
          )}
        </Panel>

        <Panel title="Your labs" href="/labs/mine" cta="See all">
          {mine.isPending ? (
            <Loading />
          ) : mine.data && mine.data.projects.length > 0 ? (
            <ul className="space-y-3">
              {mine.data.projects.slice(0, 3).map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3">
                  <Link href={`/labs/${l.slug}`} className="min-w-0 truncate font-medium hover:underline">{l.name}</Link>
                  <span className="shrink-0 text-sm text-muted">♥ {l.vote_count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div>
              <Nothing>You haven&rsquo;t started a lab yet.</Nothing>
              <Link href="/labs/new" className="btn btn-sm mt-3 inline-flex">Start one</Link>
            </div>
          )}
        </Panel>

        <Panel title="What's new" href="/notifications" cta="All notifications">
          {inbox.isPending ? (
            <Loading />
          ) : inbox.data && inbox.data.length > 0 ? (
            <ul className="space-y-3">
              {inbox.data.slice(0, 3).map((n) => (
                <li key={n.id} className="text-sm">
                  <span className={n.read ? "text-muted" : "font-medium"}>{n.message}</span>
                  <span className="ml-2 text-xs text-ink/40">{timeAgo(n.created_at)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <Nothing>All quiet for now.</Nothing>
          )}
        </Panel>
      </div>
    </main>
  );
}
