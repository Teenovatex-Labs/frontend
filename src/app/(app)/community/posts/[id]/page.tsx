"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import { communityApi } from "@/lib/services";
import { keys, timeAgo } from "@/lib/labs";
import Avatar from "@/components/ui/Avatar";
import Dialog from "@/components/ui/Dialog";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import ReportButton from "@/components/safety/ReportDialog";
import RichText from "@/components/ui/RichText";
import { useToast } from "@/components/ui/Toast";

export default function PostPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const post = useQuery({ queryKey: keys.post(id), queryFn: () => communityApi.post(id) });
  const refresh = () => qc.invalidateQueries({ queryKey: ["community"] });

  const react = useMutation({
    mutationFn: (on: boolean) => communityApi.react(id, on),
    onSuccess: refresh,
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "That didn't work."),
  });
  const send = useMutation({
    mutationFn: () => communityApi.comment(id, comment.trim()),
    onSuccess: () => {
      setComment("");
      setCommentError(null);
      void refresh();
    },
    onError: (e) => setCommentError(e instanceof ApiError ? e.message : "Couldn't post that. Try again."),
  });
  const removeComment = useMutation({ mutationFn: communityApi.deleteComment, onSuccess: refresh, onError: () => toast.error("Couldn't delete that.") });
  const removePost = useMutation({
    mutationFn: () => communityApi.deletePost(id),
    onSuccess: () => {
      void refresh();
      toast.success("Post deleted.");
      router.replace("/community");
    },
    onError: () => toast.error("Couldn't delete that."),
  });

  if (post.isPending) {
    return (
      <main className="mx-auto w-full max-w-[720px] space-y-4 px-5 py-10 md:px-10 md:py-14">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-24 w-full" />
      </main>
    );
  }
  if (post.isError) {
    const gone = post.error instanceof ApiError && post.error.status === 404;
    return (
      <main className="mx-auto w-full max-w-[720px] px-5 py-14 md:px-10">
        <EmptyState title={gone ? "That post isn't here any more." : "That didn't load."} action={<Link href="/community" className="btn-secondary">Back to Community</Link>} />
      </main>
    );
  }

  const p = post.data;
  const mine = user?.username === p.author.username;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setCommentError(null);
    send.mutate();
  };

  return (
    <main className="mx-auto w-full max-w-[720px] px-5 py-10 md:px-10 md:py-14">
      {p.space && <Link href={`/community/${p.space.slug}`} className="text-sm text-muted underline underline-offset-4 hover:text-ink">← {p.space.name}</Link>}
      <h1 className="mt-5 text-[32px] leading-[1.1] md:text-[44px]">{p.title}</h1>
      <div className="mt-3 flex items-center gap-2 text-sm text-muted">
        <Avatar name={p.author.username} src={p.author.avatar_url} size={26} />
        <Link href={`/u/${p.author.username}`} className="font-medium text-ink hover:underline">@{p.author.username}</Link>
        <span>· {timeAgo(p.created_at)}</span>
      </div>
      <p className="mt-6 whitespace-pre-line text-[17px] leading-relaxed"><RichText text={p.body} /></p>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={() => react.mutate(!p.has_reacted)}
          disabled={react.isPending}
          aria-pressed={p.has_reacted}
          className={`inline-flex items-center gap-2 rounded-full border border-ink px-3.5 py-1.5 text-sm font-semibold tabular-nums transition-all active:scale-95 ${p.has_reacted ? "bg-pink shadow-[3px_3px_0_var(--ink)]" : "bg-cream hover:bg-yellow"}`}
        >
          ♥ {p.reaction_count}
        </button>
        {mine ? (
          <button type="button" onClick={() => setConfirmDelete(true)} className="text-xs text-rose underline underline-offset-4">Delete</button>
        ) : (
          <ReportButton targetType="post" targetId={p.id} what="this post" />
        )}
      </div>

      <h2 className="mt-10 text-[22px] tracking-[-0.02em]">{p.comment_count} comment{p.comment_count === 1 ? "" : "s"}</h2>
      <ul className="mt-4 space-y-4">
        {p.comments.map((c) => (
          <li key={c.id} className="border border-line bg-white p-4">
            <div className="flex items-center gap-2 text-xs text-muted">
              <Avatar name={c.author.username} src={c.author.avatar_url} size={20} />
              <Link href={`/u/${c.author.username}`} className="font-medium text-ink hover:underline">@{c.author.username}</Link>
              <span>· {timeAgo(c.created_at)}</span>
              <span className="ml-auto">
                {c.author.username === user?.username ? (
                  <button type="button" onClick={() => removeComment.mutate(c.id)} className="text-rose underline underline-offset-4">Delete</button>
                ) : (
                  <ReportButton targetType="comment" targetId={c.id} what="this comment" />
                )}
              </span>
            </div>
            <p className="mt-2 whitespace-pre-line text-[15px]"><RichText text={c.body} /></p>
          </li>
        ))}
      </ul>

      <form onSubmit={submit} className="mt-6">
        <label htmlFor="comment" className="text-sm font-medium">Add a comment</label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={2000}
          rows={3}
          className="mt-1.5 w-full rounded-md border border-ink bg-white px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-rose"
        />
        {commentError && <p role="alert" className="mt-2 rounded-md border border-rose bg-rose/[0.08] px-4 py-2.5 text-sm text-rose">{commentError}</p>}
        <button type="submit" className="btn mt-3 disabled:opacity-60" disabled={send.isPending || !comment.trim()}>{send.isPending ? "Posting…" : "Comment"}</button>
      </form>

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete this post?">
        <p className="text-sm text-muted">It and its comments will be gone for good.</p>
        <div className="mt-6 flex gap-3">
          <button className="btn-secondary" onClick={() => setConfirmDelete(false)}>Keep it</button>
          <button className="btn" disabled={removePost.isPending} onClick={() => removePost.mutate()}>{removePost.isPending ? "Deleting…" : "Delete it"}</button>
        </div>
      </Dialog>
    </main>
  );
}
