"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { inboxApi, type Notification } from "@/lib/services";
import { keys, timeAgo } from "@/lib/labs";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

const ICONS: Record<string, string> = { vote: "♥", follow: "＋", event: "◷", system: "•" };

export default function NotificationsPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const toast = useToast();
  const inbox = useQuery({ queryKey: keys.inbox, queryFn: inboxApi.list });

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: keys.inbox });
    void qc.invalidateQueries({ queryKey: keys.unread });
  };
  const fail = () => toast.error("That didn't work. Try again.");

  const readOne = useMutation({ mutationFn: inboxApi.read, onSuccess: refresh, onError: fail });
  const readAll = useMutation({ mutationFn: inboxApi.readAll, onSuccess: refresh, onError: fail });
  const remove = useMutation({ mutationFn: inboxApi.remove, onSuccess: refresh, onError: fail });

  const open = (n: Notification) => {
    if (!n.read) readOne.mutate(n.id);
    if (n.link) router.push(n.link);
  };
  const unread = inbox.data?.filter((n) => !n.read).length ?? 0;

  return (
    <main className="mx-auto w-full max-w-[720px] px-5 py-10 md:px-10 md:py-14">
      <PageHeader
        eyebrow="Notifications"
        title="What&rsquo;s"
        accent="new."
        action={
          unread > 0 ? (
            <button className="btn-secondary btn-sm" onClick={() => readAll.mutate()} disabled={readAll.isPending}>
              Mark all read
            </button>
          ) : undefined
        }
      >
        Votes, follows and event updates show up here.
      </PageHeader>

      <div className="mt-8">
        {inbox.isPending ? (
          <div className="space-y-3" aria-busy="true">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : inbox.isError ? (
          <EmptyState title="That didn't load." action={<button className="btn-secondary" onClick={() => inbox.refetch()}>Try again</button>} />
        ) : inbox.data.length === 0 ? (
          <EmptyState title="All quiet." action={<Link href="/labs" className="btn-secondary">Explore labs</Link>}>
            When someone votes for your lab or follows you, you&rsquo;ll see it here.
          </EmptyState>
        ) : (
          <ul className="space-y-3">
            {inbox.data.map((n) => (
              <li key={n.id} className={`flex items-start gap-3 border border-ink p-4 shadow-[4px_4px_0_var(--ink)] ${n.read ? "bg-cream" : "bg-white"}`}>
                <span aria-hidden="true" className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-ink text-sm ${n.read ? "bg-cream" : "bg-pink"}`}>
                  {ICONS[n.type] ?? ICONS.system}
                </span>
                <button type="button" onClick={() => open(n)} className="min-w-0 flex-1 text-left">
                  <span className={`block text-[15px] ${n.read ? "text-muted" : "font-medium"}`}>{n.message}</span>
                  <span className="mt-1 block text-xs text-ink/70">{timeAgo(n.created_at)}</span>
                </button>
                <button
                  type="button"
                  onClick={() => remove.mutate(n.id)}
                  aria-label="Delete notification"
                  className="text-ink/70 hover:text-ink"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
