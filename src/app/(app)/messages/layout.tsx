"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { messagesApi } from "@/lib/services";
import { keys, timeAgo } from "@/lib/labs";
import Avatar from "@/components/ui/Avatar";
import Skeleton from "@/components/ui/Skeleton";

// Two panes on a big screen (list + open chat). On a phone only one shows at a time.
export default function MessagesLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const inThread = pathname !== "/messages";
  const list = useQuery({ queryKey: keys.inboxChats, queryFn: messagesApi.list, refetchInterval: 15_000 });

  return (
    <div className="mx-auto flex h-[calc(100svh-0px)] w-full max-w-[1100px] gap-0 px-0 md:px-6 md:py-6 lg:h-screen">
      <aside className={`${inThread ? "hidden md:flex" : "flex"} w-full flex-col border-ink bg-cream md:w-[320px] md:shrink-0 md:border md:bg-white`} aria-label="Conversations">
        <h1 className="border-b border-ink px-5 py-4 text-[24px] tracking-[-0.03em]">Messages</h1>
        <div className="flex-1 overflow-y-auto">
          {list.isPending ? (
            <div className="space-y-2 p-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : list.isError ? (
            <p className="p-5 text-sm text-muted">Couldn&rsquo;t load your chats.</p>
          ) : list.data.conversations.length === 0 ? (
            <div className="p-5 text-sm text-muted">
              <p className="font-medium text-ink">No chats yet.</p>
              <p className="mt-2">You can message someone once you follow each other. Find people in <Link className="underline underline-offset-4" href="/leaderboard">the leaderboard</Link> or on a lab you like.</p>
            </div>
          ) : (
            <ul>
              {list.data.conversations.map((c) => {
                const active = pathname === `/messages/${c.id}`;
                return (
                  <li key={c.id}>
                    <Link href={`/messages/${c.id}`} className={`flex items-center gap-3 border-b border-line px-4 py-3 transition-colors ${active ? "bg-yellow" : "hover:bg-yellow/40"}`}>
                      <Avatar name={c.with.username} src={c.with.avatar_url} size={44} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className={`truncate ${c.unread ? "font-semibold" : "font-medium"}`}>@{c.with.username}</span>
                          {c.last_message && <span className="shrink-0 text-[11px] text-muted">{timeAgo(c.last_message.created_at)}</span>}
                        </span>
                        <span className={`block truncate text-sm ${c.unread ? "text-ink" : "text-muted"}`}>
                          {c.last_message ? `${c.last_message.from_me ? "You: " : ""}${c.last_message.body}` : "Say hi"}
                        </span>
                      </span>
                      {c.unread > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-pink px-1.5 text-[11px] font-semibold tabular-nums">{c.unread}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>
      <section className={`${inThread ? "flex" : "hidden md:flex"} min-w-0 flex-1 flex-col md:border-y md:border-r md:border-ink`}>{children}</section>
    </div>
  );
}
