"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { communityApi } from "@/lib/services";
import { keys } from "@/lib/labs";
import FormField from "@/components/FormField";
import TextAreaField from "@/components/TextAreaField";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import PostCard from "@/components/community/PostCard";
import { useToast } from "@/components/ui/Toast";

export default function SpacePage() {
  const { space } = useParams<{ space: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  const feed = useInfiniteQuery({
    queryKey: keys.feed(space),
    queryFn: ({ pageParam }) => communityApi.feed(space, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.pages ? last.page + 1 : undefined),
  });

  const create = useMutation({
    mutationFn: () => communityApi.createPost(space, { title: title.trim(), body: body.trim() }),
    onSuccess: (post) => {
      void qc.invalidateQueries({ queryKey: ["community"] });
      toast.success("Posted!");
      router.push(`/community/posts/${post.id}`);
    },
    // A filter refusal is explained in plain words; show it right where they are writing.
    onError: (e) => setError(e instanceof ApiError ? e.message : "Couldn't post that. Try again."),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (title.trim().length < 3) return setError("Give your post a title (3+ characters).");
    if (body.trim().length < 3) return setError("Write a little more.");
    create.mutate();
  };

  const posts = feed.data?.pages.flatMap((p) => p.posts) ?? [];
  const info = feed.data?.pages[0]?.space;
  const missing = feed.error instanceof ApiError && feed.error.status === 404;

  return (
    <main className="mx-auto w-full max-w-[760px] px-5 py-10 md:px-10 md:py-14">
      <Link href="/community" className="text-sm text-muted underline underline-offset-4 hover:text-ink">← All spaces</Link>
      {missing ? (
        <div className="mt-8"><EmptyState title="We couldn't find that space." /></div>
      ) : (
        <>
          <h1 className="mt-5 text-[36px] leading-[1.05] md:text-[52px]">{info?.name ?? <Skeleton className="h-12 w-64" />}</h1>
          {info && <p className="mt-2 max-w-[520px] text-muted">{info.description}</p>}

          <div className="mt-6">
            {!composing ? (
              <button className="btn" onClick={() => setComposing(true)}>New post <span aria-hidden="true">↗︎</span></button>
            ) : (
              <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4 border border-ink bg-white p-5 shadow-[5px_5px_0_var(--ink)]">
                <FormField label="Title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} autoFocus />
                <TextAreaField label="What do you want to say?" name="body" rows={5} maxLength={5000} value={body} onChange={(e) => setBody(e.target.value)} />
                <p className="text-xs text-muted">Keep phone numbers, emails and addresses private, and keep it kind.</p>
                {error && <p role="alert" className="rounded-md border border-rose bg-rose/[0.08] px-4 py-2.5 text-sm text-rose">{error}</p>}
                <div className="flex gap-3">
                  <button type="submit" className="btn disabled:opacity-60" disabled={create.isPending}>{create.isPending ? "Posting…" : "Post it"}</button>
                  <button type="button" className="btn-secondary" onClick={() => { setComposing(false); setError(null); }}>Cancel</button>
                </div>
              </form>
            )}
          </div>

          <div className="mt-8 space-y-5">
            {feed.isPending ? (
              [0, 1, 2].map((i) => <Skeleton key={i} className="h-32 w-full" />)
            ) : feed.isError ? (
              <EmptyState title="That didn't load." action={<button className="btn-secondary" onClick={() => feed.refetch()}>Try again</button>} />
            ) : posts.length === 0 ? (
              <EmptyState title="Nothing here yet. Start the conversation." />
            ) : (
              <>
                {posts.map((p) => <PostCard key={p.id} post={p} />)}
                {feed.hasNextPage && (
                  <div className="flex justify-center pt-2">
                    <button className="btn-secondary" disabled={feed.isFetchingNextPage} onClick={() => feed.fetchNextPage()}>
                      {feed.isFetchingNextPage ? "Loading…" : "Show more"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </main>
  );
}
