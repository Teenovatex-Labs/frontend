"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import { shrinkImage } from "@/lib/image";
import { labsApi, labsDeepApi } from "@/lib/services";
import { categoryLabel, keys, timeAgo } from "@/lib/labs";
import Avatar from "@/components/ui/Avatar";
import Dialog from "@/components/ui/Dialog";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { LabCover } from "@/components/labs/LabCard";
import VoteButton from "@/components/labs/VoteButton";
import ReportButton from "@/components/safety/ReportDialog";
import Tabs from "@/components/ui/Tabs";
import Milestones from "@/components/labs/Milestones";
import UpdatesTab from "@/components/labs/UpdatesTab";
import BoardTab from "@/components/labs/BoardTab";
import TeamTab from "@/components/labs/TeamTab";

type Tab = "overview" | "updates" | "board" | "team";

export default function LabPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);

  const lab = useQuery({ queryKey: keys.lab(slug), queryFn: () => labsApi.get(slug) });
  const team = useQuery({ queryKey: keys.team(slug), queryFn: () => labsDeepApi.team(slug) });
  const [tab, setTab] = useState<Tab>("overview");
  // Notifications deep-link with ?tab=board, so honour it once the page is on screen.
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get("tab");
    if (wanted === "updates" || wanted === "board" || wanted === "team") setTab(wanted);
  }, []);

  const cover = useMutation({
    mutationFn: async (file: File | null) => {
      if (file) await labsApi.setCover(lab.data!.id, await shrinkImage(file, 1600));
      else await labsApi.clearCover(lab.data!.id);
    },
    onSuccess: (_r, file) => {
      toast.success(file ? "Cover updated." : "Cover removed.");
      void qc.invalidateQueries({ queryKey: keys.labs });
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Couldn't change the cover. Try again."),
  });
  const pickCover = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("That needs to be an image.");
    if (file.size > 25 * 1024 * 1024) return toast.error("That image is too large. Try a smaller one.");
    cover.mutate(file);
  };

  const remove = useMutation({
    mutationFn: (id: string) => labsApi.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.labs });
      toast.success("Lab deleted.");
      router.replace("/labs/mine");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Couldn't delete that. Try again."),
  });

  if (lab.isPending) {
    return (
      <main className="mx-auto w-full max-w-[880px] space-y-5 px-5 py-10 md:px-10 md:py-14">
        <Skeleton className="aspect-[16/8] w-full rounded-none" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </main>
    );
  }
  if (lab.isError) {
    const missing = lab.error instanceof ApiError && lab.error.status === 404;
    return (
      <main className="mx-auto w-full max-w-[880px] px-5 py-14 md:px-10">
        <EmptyState
          title={missing ? "We couldn't find that lab." : "That didn't load."}
          action={<Link href="/labs" className="btn-secondary">Back to labs</Link>}
        >
          {missing ? "It may have been renamed or removed." : "Check your connection and try again."}
        </EmptyState>
      </main>
    );
  }

  const data = lab.data;
  const isOwner = user?.username === data.user.username;
  const isTeam = team.data?.my_role != null;
  const links = [
    { label: "Try the demo", href: data.demo_url },
    { label: "See the code", href: data.github_url },
    { label: "The post on X", href: data.tx_post_url },
  ].filter((l): l is { label: string; href: string } => !!l.href);

  return (
    <main className="mx-auto w-full max-w-[880px] px-5 py-10 md:px-10 md:py-14">
      <Link href="/labs" className="text-sm text-muted underline underline-offset-4 hover:text-ink">
        ← All labs
      </Link>

      <div className="mt-5 overflow-hidden border border-ink shadow-[6px_6px_0_var(--ink)]">
        <LabCover lab={data} className="aspect-[16/8]" />
      </div>
      {isOwner && (
        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
          <label className="cursor-pointer underline underline-offset-4 hover:text-rose">
            {cover.isPending ? "Uploading…" : data.cover_url ? "Change cover" : "Add a cover"}
            <input type="file" accept="image/*" className="sr-only" disabled={cover.isPending} onChange={(e) => { pickCover(e.target.files?.[0]); e.target.value = ""; }} />
          </label>
          {data.cover_url && <button type="button" className="text-muted underline underline-offset-4 hover:text-rose" disabled={cover.isPending} onClick={() => cover.mutate(null)}>Remove cover</button>}
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow text-rose">{categoryLabel(data.category)}</p>
          <h1 className="mt-2 text-[36px] leading-[1.05] md:text-[52px]">{data.name}</h1>
        </div>
        <VoteButton labId={data.id} count={data.vote_count} voted={!!data.has_voted_today} own={isOwner} />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
        <Link href={`/u/${data.user.username}`} className="flex items-center gap-2 text-ink hover:underline">
          <Avatar name={data.user.username} src={data.user.avatar_url} size={28} />@{data.user.username}
        </Link>
        <span>Started {timeAgo(data.created_at)}</span>
      </div>

      <div className="mt-8">
        <Tabs
          label="Sections"
          value={tab}
          onChange={setTab}
          options={[
            { id: "overview", label: "Overview" },
            { id: "updates", label: "Updates" },
            ...(isTeam ? [{ id: "board" as const, label: "Board" }] : []),
            { id: "team", label: `Team${team.data ? ` (${team.data.members.length})` : ""}` },
          ]}
        />
      </div>

      <div className="mt-6">
        {tab === "overview" && (
          <div>
      <p className="text-lg">{data.short_description}</p>
      <p className="mt-4 whitespace-pre-line text-muted">{data.description}</p>

      {data.tags.length > 0 && (
        <ul className="mt-6 flex flex-wrap gap-2">
          {data.tags.map((t) => (
            <li key={t} className="rounded-full border border-ink bg-cream px-3 py-1 text-xs font-semibold">
              #{t}
            </li>
          ))}
        </ul>
      )}

      {links.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-3">
          {links.map((l) => (
            <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className="btn-secondary">
              {l.label} <span aria-hidden="true">↗︎</span>
            </a>
          ))}
        </div>
      )}

            <Milestones lab={data.id} isTeam={isTeam} />
          </div>
        )}
        {tab === "updates" && <UpdatesTab lab={data.id} isTeam={isTeam} isOwner={isOwner} me={user?.username} />}
        {tab === "board" && isTeam && team.data && <BoardTab lab={data.id} team={team.data.members} />}
        {tab === "team" && <TeamTab lab={data.id} me={user?.username} />}
      </div>

      {!isOwner && (
        <div className="mt-12 border-t border-line pt-6">
          <ReportButton targetType="lab" targetId={data.id} what="this lab" />
        </div>
      )}

      {isOwner && (
        <div className="mt-12 border-t border-line pt-6">
          <button type="button" onClick={() => setConfirming(true)} className="text-sm text-rose underline underline-offset-4">
            Delete this lab
          </button>
        </div>
      )}

      <Dialog open={confirming} onClose={() => setConfirming(false)} title="Delete this lab?">
        <p className="text-sm text-muted">
          &ldquo;{data.name}&rdquo; and its votes will be gone for good. This can&rsquo;t be undone.
        </p>
        <div className="mt-6 flex gap-3">
          <button type="button" className="btn-secondary" onClick={() => setConfirming(false)}>
            Keep it
          </button>
          <button type="button" className="btn" disabled={remove.isPending} onClick={() => remove.mutate(data.id)}>
            {remove.isPending ? "Deleting…" : "Delete it"}
          </button>
        </div>
      </Dialog>
    </main>
  );
}
