"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { ApiError, uploadsApi } from "@/lib/api";
import { messagesApi, peopleApi, rewardsApi, safetyApi } from "@/lib/services";
import Badge from "@/components/ui/Badge";
import ReportButton from "@/components/safety/ReportDialog";
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
  const { user, refreshUser } = useAuth();
  const qc = useQueryClient();
  const router = useRouter();
  const toast = useToast();

  const person = useQuery({ queryKey: keys.person(username), queryFn: () => peopleApi.get(username) });
  const isMe = user?.username === username;
  const isPublic = person.data && !person.data.private;
  const labs = useQuery({
    queryKey: [...keys.person(username), "labs"],
    queryFn: () => peopleApi.labs(username),
    enabled: !!isPublic,
  });

  const myBadges = useQuery({ queryKey: keys.badges, queryFn: rewardsApi.badges, enabled: isMe });

  const photo = useMutation({
    mutationFn: (f: File) => uploadsApi.avatar(f),
    onSuccess: async () => {
      await refreshUser();
      await qc.invalidateQueries({ queryKey: keys.person(username) });
      toast.success("Photo updated.");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Couldn't upload that photo."),
  });
  const pickPhoto = (f?: File) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) return toast.error("That needs to be an image.");
    if (f.size > 5 * 1024 * 1024) return toast.error("Keep photos under 5MB.");
    photo.mutate(f);
  };

  const message = useMutation({
    mutationFn: () => messagesApi.open(username),
    onSuccess: (c) => router.push(`/messages/${c.id}`),
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Couldn't open the chat."),
  });

  const block = useMutation({
    mutationFn: () => safetyApi.block(username),
    onSuccess: async (r) => {
      toast.success(r.message);
      await qc.invalidateQueries();
    },
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
          <div className="flex flex-col items-center gap-2">
            <Avatar name={p.username} src={p.avatar_url} size={96} />
            {isMe && (
              <label className="cursor-pointer text-xs underline underline-offset-4 hover:text-rose">
                {photo.isPending ? "Uploading…" : p.avatar_url ? "Change photo" : "Add a photo"}
                <input type="file" accept="image/*" className="sr-only" disabled={photo.isPending} onChange={(e) => { pickPhoto(e.target.files?.[0]); e.target.value = ""; }} />
              </label>
            )}
          </div>
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
          <div className="flex flex-col items-end gap-2">
            <button className="btn" disabled={message.isPending} onClick={() => message.mutate()}>Message</button>
            <span className="flex items-center gap-3">
              <ReportButton targetType="user" targetId={p.username} what={`@${p.username}`} />
              <button type="button" onClick={() => block.mutate()} disabled={block.isPending} className="text-xs text-muted underline underline-offset-4 hover:text-rose">
                Block
              </button>
            </span>
          </div>
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
        <StatTile label="Level" value={p.level.level} hint={p.level.title} tone="yellow" />
        <StatTile label="Points" value={p.points.toLocaleString()} hint={`#${p.rank} overall`} tone="pink" />
        <StatTile label="Day streak" value={p.streak} />
        <StatTile label="Labs" value={p.lab_count} tone="white" />
      </div>

      <h2 className="mt-12 text-[26px] tracking-[-0.03em]">
        Badges <span className="font-serif font-normal italic">({p.badges.length})</span>
      </h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {isMe && myBadges.data
          ? myBadges.data.badges.map((b, i) => <Badge key={b.key} title={b.title} description={b.description} symbol={b.symbol} earned={b.earned} index={i} />)
          : p.badges.length === 0
            ? <p className="text-sm text-muted sm:col-span-2">No badges yet.</p>
            : p.badges.map((b, i) => <Badge key={b.key} title={b.title} description={b.description} symbol={b.symbol} index={i} />)}
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
