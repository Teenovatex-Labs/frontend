"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { labsDeepApi } from "@/lib/services";
import { keys, timeAgo } from "@/lib/labs";
import Avatar from "@/components/ui/Avatar";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import FormField from "@/components/FormField";
import TextAreaField from "@/components/TextAreaField";
import { useToast } from "@/components/ui/Toast";

export default function UpdatesTab({ lab, isTeam, isOwner, me }: { lab: string; isTeam: boolean; isOwner: boolean; me?: string }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  const q = useInfiniteQuery({
    queryKey: keys.updates(lab),
    queryFn: ({ pageParam }) => labsDeepApi.updates(lab, pageParam),
    initialPageParam: 1,
    getNextPageParam: (l) => (l.page < l.pages ? l.page + 1 : undefined),
  });
  const post = useMutation({
    mutationFn: () => labsDeepApi.postUpdate(lab, { title: title.trim(), body: body.trim() }),
    onSuccess: () => { setTitle(""); setBody(""); setOpen(false); setError(null); toast.success("Update posted."); void qc.invalidateQueries({ queryKey: keys.updates(lab) }); },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Couldn't post that. Try again."),
  });
  const del = useMutation({ mutationFn: (id: string) => labsDeepApi.deleteUpdate(lab, id), onSuccess: () => void qc.invalidateQueries({ queryKey: keys.updates(lab) }), onError: () => toast.error("Couldn't delete that.") });

  const items = q.data?.pages.flatMap((p) => p.updates) ?? [];

  return (
    <div>
      {isTeam && (
        <div className="mb-6">
          {!open ? (
            <button className="btn" onClick={() => setOpen(true)}>Post an update</button>
          ) : (
            <form onSubmit={(e: FormEvent) => { e.preventDefault(); setError(null); if (title.trim().length < 3 || body.trim().length < 3) return setError("Add a title and a few words about what changed."); post.mutate(); }} noValidate className="flex flex-col gap-4 border border-ink bg-white p-5 shadow-[5px_5px_0_var(--ink)]">
              <FormField label="What's the update?" name="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} autoFocus />
              <TextAreaField label="Tell the story" name="body" rows={5} maxLength={4000} value={body} onChange={(e) => setBody(e.target.value)} />
              {error && <p role="alert" className="rounded-md border border-rose bg-rose/[0.08] px-4 py-2.5 text-sm text-rose">{error}</p>}
              <div className="flex gap-3">
                <button type="submit" className="btn disabled:opacity-60" disabled={post.isPending}>{post.isPending ? "Posting…" : "Post"}</button>
                <button type="button" className="btn-secondary" onClick={() => { setOpen(false); setError(null); }}>Cancel</button>
              </div>
            </form>
          )}
        </div>
      )}

      {q.isPending ? (
        <div className="space-y-4">{[0, 1].map((i) => <Skeleton key={i} className="h-28 w-full" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState title="No updates yet.">{isTeam ? "Share what you worked on. Build logs are how people follow along." : "Check back to see how this lab is coming along."}</EmptyState>
      ) : (
        <ol className="space-y-5 border-l-2 border-ink pl-5">
          {items.map((u) => (
            <li key={u.id} className="relative">
              <span aria-hidden="true" className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full border-2 border-ink bg-pink" />
              <div className="flex items-center gap-2 text-xs text-muted">
                {u.author && <><Avatar name={u.author.username} src={u.author.avatar_url} size={20} /><Link href={`/u/${u.author.username}`} className="font-medium text-ink hover:underline">@{u.author.username}</Link></>}
                <span>· {timeAgo(u.created_at)}</span>
                {(isOwner || u.author?.username === me) && <button type="button" onClick={() => del.mutate(u.id)} className="ml-auto text-rose underline underline-offset-4">Delete</button>}
              </div>
              <h3 className="mt-1 text-[19px] tracking-[-0.02em]">{u.title}</h3>
              <p className="mt-1 whitespace-pre-line text-[15px] text-muted">{u.body}</p>
            </li>
          ))}
        </ol>
      )}
      {q.hasNextPage && <div className="mt-6 flex justify-center"><button className="btn-secondary" onClick={() => q.fetchNextPage()} disabled={q.isFetchingNextPage}>Older updates</button></div>}
    </div>
  );
}
