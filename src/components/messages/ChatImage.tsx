"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { messagesApi } from "@/lib/services";

// One image in a team chat. Everyone but the sender sees a placeholder until a moderator approves it.
export default function ChatImage({ id, width, height, mine }: { id: string; width: number; height: number; mine: boolean }) {
  const link = useQuery({
    queryKey: ["chat-image", id],
    queryFn: () => messagesApi.imageLink(id),
    retry: false,
    staleTime: 10 * 60_000,
    // While it is still waiting for a moderator, check back so it appears without a refresh.
    refetchInterval: (q) => (q.state.error instanceof ApiError && q.state.error.code === "NOT_APPROVED") || q.state.data?.status === "pending" ? 15_000 : false,
  });

  const box = { aspectRatio: `${width} / ${height}`, maxWidth: Math.min(width, 320) };

  if (link.isError) {
    const code = link.error instanceof ApiError ? link.error.code : undefined;
    return (
      <div style={box} className="grid min-h-[96px] w-full place-items-center rounded-xl border border-dashed border-ink/40 bg-cream p-3 text-center text-xs text-muted">
        {code === "NOT_APPROVED" ? "An image is waiting for a moderator to check it." : code === "REMOVED" || code === "NOT_FOUND" ? "This image was removed." : "Couldn't load this image."}
      </div>
    );
  }
  if (!link.data) return <div style={box} className="w-full animate-pulse rounded-xl bg-cream" aria-label="Loading image" />;

  return (
    <figure style={{ maxWidth: box.maxWidth }} className="w-full">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={link.data.url} alt="Image shared in the team chat" width={width} height={height} loading="lazy" className="w-full rounded-xl border border-ink bg-cream object-cover" />
      {mine && link.data.status === "pending" && <figcaption className="mt-1 text-[11px] text-muted">Waiting for a moderator. Only you can see this for now.</figcaption>}
    </figure>
  );
}
