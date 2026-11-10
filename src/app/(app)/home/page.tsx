"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import Milestones from "@/components/rewards/Milestones";
import { eventsApi, inboxApi, labsApi, labsDeepApi, learnApi, votesApi } from "@/lib/services";
import { keys, timeAgo } from "@/lib/labs";
import { eventDay, eventTime } from "@/lib/dates";
import StatTile from "@/components/ui/StatTile";
import QuestCard from "@/components/rewards/QuestCard";
import WeeklyChallenges from "@/components/rewards/WeeklyChallenges";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";

function Panel({ title, href, cta, children }: { title: string; href: string; cta: string; children: React.ReactNode }) {
  return (
    <Card className="tx-home-panel flex flex-col p-5 md:p-6">
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
  const isNewMember = user.membership_status === "active" && Date.now() - new Date(user.created_at).getTime() < 14 * 24 * 60 * 60 * 1000;

  return (
    <main className="tx-home mx-auto w-full max-w-[1080px] px-4 py-6 sm:px-5 md:px-10 md:py-16">
      <div className="flex items-center justify-between gap-3 md:block">
        <p className="eyebrow text-rose">Your world at TX</p>
        <span className="rounded-full border border-ink bg-yellow px-3 py-1 text-[10px] font-bold uppercase tracking-wider md:hidden">Keep creating ✦</span>
      </div>
      <h1 className="mt-4 text-[clamp(43px,11vw,64px)] leading-[.98] tracking-[-.055em] md:text-[64px]">
        Hey <span className="font-serif font-normal italic">{first}.</span>
      </h1>
      <p className="mt-3 max-w-[520px] text-sm text-muted md:mt-4 md:text-base">
        {user.streak > 1 ? `${user.streak} days in a row. Keep it going.` : "Good to see you. Here's what's happening."}
      </p>

      {isNewMember && (
        <div className="mt-6 rounded-[20px] border border-ink bg-pink p-5 shadow-[4px_4px_0_var(--ink)] md:flex md:items-center md:justify-between md:gap-6 md:p-6">
          <div>
            <p className="eyebrow text-rose">Your first chapter</p>
            <h2 className="mt-1 text-2xl tracking-tight">You belong here. Start anywhere.</h2>
            <p className="mt-2 max-w-[560px] text-sm">Say hello to the community, explore what people are building, or follow an idea of your own. There is no perfect first move.</p>
          </div>
          <div className="mt-4 flex shrink-0 flex-wrap gap-2 md:mt-0">
            <Link href="/community" className="btn btn-sm">Meet your crew</Link>
            <Link href="/labs" className="btn-secondary btn-sm">Explore labs</Link>
          </div>
        </div>
      )}

      <div className="mt-5 md:hidden">
        <Link href="/labs" className="group flex min-h-[162px] flex-col justify-between overflow-hidden rounded-[24px] border-2 border-ink bg-ink p-5 text-cream shadow-[5px_6px_0_var(--pink)]">
          <div className="flex items-start justify-between"><span className="text-[11px] font-semibold uppercase tracking-[.17em] text-pink">Your next big thing</span><span aria-hidden="true" className="text-3xl text-pink transition-transform group-hover:-rotate-12">✳</span></div>
          <div className="flex items-end justify-between gap-3"><div><p className="font-serif text-[34px] italic leading-none">Make your mark.</p><p className="mt-2 text-xs text-cream/75">Discover ideas. Build yours. Find your crew.</p></div><span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-yellow text-xl text-ink">↗</span></div>
        </Link>
      </div>

      <Milestones userId={user.id} points={user.points} level={user.level.level} levelTitle={user.level.title} rank={user.rank ?? null} />

      <div className="mt-6 grid grid-cols-3 gap-2 md:hidden" aria-label="Your progress at a glance">
        <div className="flex min-h-[106px] flex-col justify-between rounded-[19px] border border-ink bg-yellow p-3 shadow-[3px_3px_0_var(--ink)]"><span className="text-[10px] font-bold uppercase tracking-wider">Points</span><strong className="text-[clamp(23px,7vw,32px)] leading-none">{user.points.toLocaleString()}</strong></div>
        <div className="flex min-h-[106px] flex-col justify-between rounded-[19px] border border-ink bg-pink p-3 shadow-[3px_3px_0_var(--ink)]"><span className="text-[10px] font-bold uppercase tracking-wider">Day streak</span><strong className="text-[clamp(23px,7vw,32px)] leading-none">{user.streak} <span className="text-lg" aria-hidden="true">✦</span></strong></div>
        <div className="flex min-h-[106px] flex-col justify-between rounded-[19px] border border-ink bg-white p-3 shadow-[3px_3px_0_var(--ink)]"><span className="text-[10px] font-bold uppercase tracking-wider">Rank</span><strong className="text-[clamp(20px,6vw,32px)] leading-none">{user.rank ? `#${user.rank}` : "—"}</strong></div>
      </div>

      <div className="mt-10 hidden gap-5 md:grid md:grid-cols-3">
        <StatTile label="Points" value={user.points.toLocaleString()} tone="yellow" />
        <StatTile
          label="Day streak"
          value={user.streak}
          tone="pink"
          className="sm:rotate-1"
          hint={user.streak_freezes > 0 ? `${user.streak_freezes} streak freeze${user.streak_freezes === 1 ? "" : "s"} saved` : "Earn a freeze every 7 days"}
        />
        <StatTile label="Rank" value={user.rank ? `#${user.rank}` : "Unranked"} className="sm:-rotate-1" />
      </div>

      <div className="mt-6 rounded-[20px] border border-ink bg-white p-4 shadow-[4px_4px_0_var(--ink)] md:mt-5 md:rounded-none md:p-5 md:shadow-[5px_5px_0_var(--ink)]">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-lg">
            Level {user.level.level}: <span className="font-serif italic">{user.level.title}</span>
          </p>
          <p className="text-xs text-muted">
            {user.level.next_at ? `${user.level.next_at - user.points} points to the next level` : "You've reached the top level"}
          </p>
        </div>
        <div className="mt-2.5 h-2.5 overflow-hidden rounded-full border border-ink bg-cream" role="progressbar" aria-valuenow={Math.round(user.level.progress * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Progress to the next level">
          <div className="h-full bg-yellow transition-[width] duration-700" style={{ width: `${Math.round(user.level.progress * 100)}%` }} />
        </div>
      </div>

      <div className="mt-8 grid gap-5 md:mt-10 md:grid-cols-2 md:gap-6">
        <Panel title="Today's quest" href="/labs" cta="Explore labs">
          <QuestCard />
        </Panel>

        <div className="md:col-span-2">
          <Panel title="This week's challenges" href="/labs" cta="Explore labs">
            <WeeklyChallenges />
          </Panel>
        </div>

        <Panel title="Votes today" href="/labs" cta="Explore labs">
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
                  <span className="ml-2 text-xs text-ink/70">{timeAgo(n.created_at)}</span>
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
