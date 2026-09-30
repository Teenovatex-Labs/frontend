"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/services";
import { keys, timeAgo } from "@/lib/labs";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";

const PLAIN: Record<string, string> = {
  "report.dismiss": "dismissed a report",
  "report.warn": "warned a member",
  "report.remove": "removed content",
  "report.suspend": "suspended a member",
  "user.suspend": "suspended a member",
  "user.unsuspend": "unsuspended a member",
  "user.role": "changed a role",
  "filter.self_harm": "was shown support after writing something worrying",
};

export default function AuditPage() {
  const log = useInfiniteQuery({
    queryKey: keys.admin("audit"),
    queryFn: ({ pageParam }) => adminApi.audit(pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.pages ? last.page + 1 : undefined),
  });
  const items = log.data?.pages.flatMap((p) => p.items) ?? [];
  return (
    <>
      <h1 className="text-[32px] tracking-[-0.03em] md:text-[44px]">Audit log</h1>
      <p className="mt-2 text-sm text-muted">Every moderator action, in order. Nobody can edit or delete these.</p>
      <div className="mt-6">
        {log.isPending ? (
          <Skeleton className="h-64 w-full" />
        ) : log.isError ? (
          <EmptyState title="That didn't load." />
        ) : items.length === 0 ? (
          <EmptyState title="Nothing yet." />
        ) : (
          <>
            <ul className="divide-y divide-line border border-ink bg-white">
              {items.map((i) => (
                <li key={i.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3 text-sm">
                  <span className="text-xs text-muted tabular-nums">{new Date(i.created_at).toLocaleString()}</span>
                  <span><strong>@{i.actor ?? "system"}</strong> {PLAIN[i.action] ?? i.action}</span>
                  {i.target_type && <span className="text-xs text-muted">({i.target_type} {i.target_id?.slice(0, 8)})</span>}
                  <span className="text-xs text-muted">{timeAgo(i.created_at)}</span>
                </li>
              ))}
            </ul>
            {log.hasNextPage && <div className="mt-6 flex justify-center"><button className="btn-secondary" onClick={() => log.fetchNextPage()} disabled={log.isFetchingNextPage}>Show more</button></div>}
          </>
        )}
      </div>
    </>
  );
}
