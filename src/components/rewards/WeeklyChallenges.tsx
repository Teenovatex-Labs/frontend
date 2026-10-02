"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { alfredController } from "@/lib/alfred";
import { rewardsApi } from "@/lib/services";
import { keys } from "@/lib/labs";
import { useAuth } from "@/context/AuthContext";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

const daysLeft = (iso: string) => {
  const d = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
  return d <= 1 ? "resets today" : `${d} days left`;
};

// This week's three goals. Finish one, claim it; claim all three for a bonus.
export default function WeeklyChallenges() {
  const { refreshUser } = useAuth();
  const qc = useQueryClient();
  const toast = useToast();
  const weekly = useQuery({ queryKey: keys.weekly, queryFn: rewardsApi.weekly, refetchOnWindowFocus: true });

  const claim = useMutation({
    mutationFn: (key: string) => rewardsApi.claimWeekly(key),
    onSuccess: async (r, key) => {
      toast.success(`+${r.points_awarded} points`);
      if (key === "bonus") alfredController.celebrate("All three this week. Legend.");
      await Promise.all([qc.invalidateQueries({ queryKey: keys.weekly }), qc.invalidateQueries({ queryKey: keys.inbox }), refreshUser()]);
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Couldn't claim that. Try again."),
  });

  if (weekly.isPending) return <Skeleton className="h-32 w-full" />;
  if (weekly.isError) return <p className="text-sm text-muted">Couldn&rsquo;t load this week&rsquo;s challenges.</p>;
  const w = weekly.data;
  const done = w.challenges.filter((c) => c.claimed).length;

  return (
    <div>
      <p className="text-xs text-muted">
        {done} of 3 claimed · {daysLeft(w.resets_at)}
      </p>
      <ul className="mt-3 divide-y divide-line">
        {w.challenges.map((c) => {
          const pct = Math.round((c.progress / c.goal) * 100);
          return (
            <li key={c.key} className="flex items-center gap-4 py-3">
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{c.title}</span>
                <span className="block text-xs text-muted">{c.description}</span>
                <span className="mt-2 block h-1.5 overflow-hidden rounded-full border border-ink bg-cream" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${c.title} progress`}>
                  <span className="block h-full bg-pink transition-[width] duration-500" style={{ width: `${pct}%` }} />
                </span>
                <span className="mt-1 block text-[11px] text-muted">{c.progress} of {c.goal} · {c.points} points</span>
              </span>
              {c.claimed ? (
                <span className="shrink-0 text-sm font-medium">✓ Claimed</span>
              ) : (
                <button className="btn btn-sm shrink-0 disabled:opacity-50" disabled={!c.complete || claim.isPending} onClick={() => claim.mutate(c.key)}>
                  {c.complete ? "Claim" : "Not yet"}
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-ink pt-3">
        <span className="text-sm">
          <span className="font-medium">Finish all three</span>
          <span className="block text-xs text-muted">Bonus {w.bonus.points} points</span>
        </span>
        {w.bonus.claimed ? (
          <span className="text-sm font-medium">✓ Claimed</span>
        ) : (
          <button className="btn btn-sm disabled:opacity-50" disabled={!w.bonus.available || claim.isPending} onClick={() => claim.mutate("bonus")}>
            {w.bonus.available ? "Claim bonus" : "Keep going"}
          </button>
        )}
      </div>
    </div>
  );
}
