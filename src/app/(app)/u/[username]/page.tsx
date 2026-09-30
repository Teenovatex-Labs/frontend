"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import { peopleApi } from "@/lib/services";
import { keys } from "@/lib/labs";
import Avatar from "@/components/ui/Avatar";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import StatTile from "@/components/ui/StatTile";
import { useToast } from "@/components/ui/Toast";
import LabCard from "@/components/labs/LabCard";
import { LabGridSkeleton } from "@/components/labs/LabGrid";

export default function PersonPage() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const qc = useQueryClient();
  const toast = useToast();

  const person = useQuery({ queryKey: keys.person(username), queryFn: () => peopleApi.get(username) });
  const isMe = user?.username === username;
  const isPublic = person.data && !person.data.private;
  const labs = useQuery({
    queryKey: [...keys.person(username), "labs"],
    queryFn: () => peopleApi.labs(username),
    enabled: !!isPublic,
  });

  const follow = useMutation({
    mutationFn: (following: boolean) => (following ? peopleApi.unfollow(username) : peopleApi.follow(username)),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.person(username) }),
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "That didn't work. Try again."),
  });

  if (person.isPending) {
    return (
      <main className="mx-auto w-full max-w-[960px] space-y-6 px-5 py-10 md:px-10 md:py-14">
        <div className="flex items-center gap-5">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-3">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-24 w-full" />
      </main>
    );
  }
  if (person.isError) {
    const missing = person.error instanceof ApiError && person.error.status === 404;
    return (
      <main className="mx-auto w-full max-w-[960px] px-5 py-14 md:px-10">
        <EmptyState title={missing ? "We couldn't find that Teenovator." : "That didn't load."} action={<Link href="/leaderboard" className="btn-secondary">See the leaderboard</Link>}>
          {missing ? "Check the spelling of the username." : "Check your connection and try again."}
        </EmptyState>
      </main>
    );
  }

  const p = person.data;
  if (p.private) {
    return (
      <main className="mx-auto w-full max-w-[960px] px-5 py-14 md:px-10">
        <div className="flex items-center gap-5">
          <Avatar name={p.username} src={p.avatar_url} size={80} />
          <div>
            <h1 className="text-[32px] leading-tight">@{p.username}</h1>
            <p className="mt-1 text-muted">This profile is private.</p>
          </div>
        </div>
      </main>
    );
  }

  const links = Object.entries(p.social_links ?? {}).filter(([, v]) => v);

  return (
    <main className="mx-auto w-full max-w-[960px] px-5 py-10 md:px-10 md:py-14">
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div className="flex items-center gap-5">
          <Avatar name={p.username} src={p.avatar_url} size={96} />
          <div>
            <h1 className="text-[32px] leading-tight tracking-[-0.03em] md:text-[44px]">{p.full_name}</h1>
            <p className="mt-1 text-muted">
              @{p.username} · Joined {new Date(p.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
        {isMe ? (
          <Link href="/settings" className="btn-secondary">Edit profile</Link>
        ) : (
          <button className={p.is_following ? "btn-secondary" : "btn"} disabled={follow.isPending} onClick={() => follow.mutate(p.is_following)}>
            {p.is_following ? "Following" : "Follow"}
          </button>
        )}
      </div>

      {p.bio && <p className="mt-6 max-w-[560px] text-lg">{p.bio}</p>}
      {links.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-3 text-sm">
          {links.map(([name, href]) => (
            <li key={name}>
              <a href={href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-rose">
                {name.charAt(0).toUpperCase() + name.slice(1)} ↗︎
              </a>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatTile label="Points" value={p.points.toLocaleString()} tone="yellow" />
        <StatTile label="Day streak" value={p.streak} tone="pink" />
        <StatTile label="Rank" value={`#${p.rank}`} />
        <StatTile label="Followers" value={p.followers} hint={`${p.following} following`} tone="white" />
      </div>

      <h2 className="mt-12 text-[26px] tracking-[-0.03em]">
        Labs <span className="font-serif font-normal italic">({p.lab_count})</span>
      </h2>
      <div className="mt-5">
        {labs.isPending ? (
          <LabGridSkeleton count={3} />
        ) : !labs.data || labs.data.projects.length === 0 ? (
          <EmptyState title={isMe ? "You haven't started a lab yet." : "No labs yet."} action={isMe ? <Link href="/labs/new" className="btn">Start a lab</Link> : undefined} />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {labs.data.projects.map((lab) => (
              <LabCard key={lab.id} lab={lab} mine={isMe} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
