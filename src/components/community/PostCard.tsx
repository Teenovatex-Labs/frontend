import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import { timeAgo } from "@/lib/labs";
import RichText from "@/components/ui/RichText";
import type { PostSummary } from "@/lib/services";

export default function PostCard({ post, showSpace = false }: { post: PostSummary; showSpace?: boolean }) {
  return (
    <article className="border border-ink bg-white p-5 shadow-[4px_4px_0_var(--ink)] transition-transform hover:-translate-y-0.5">
      <div className="flex items-center gap-2 text-xs text-muted">
        <Avatar name={post.author.username} src={post.author.avatar_url} size={22} />
        <Link href={`/u/${post.author.username}`} className="font-medium text-ink hover:underline">@{post.author.username}</Link>
        <span>· {timeAgo(post.created_at)}</span>
        {showSpace && post.space && <span>· {post.space.name}</span>}
      </div>
      <h3 className="mt-2 text-[20px] leading-tight tracking-[-0.02em]">
        <Link href={`/community/posts/${post.id}`} className="hover:underline">{post.title}</Link>
      </h3>
      <p className="mt-1.5 whitespace-pre-line text-sm text-muted"><RichText text={post.body} /></p>
      <p className="mt-3 text-xs text-ink/75">
        ♥ {post.reaction_count} · {post.comment_count} comment{post.comment_count === 1 ? "" : "s"}
      </p>
    </article>
  );
}
