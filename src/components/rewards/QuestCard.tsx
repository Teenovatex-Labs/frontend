"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { alfredController } from "@/lib/alfred";
import { rewardsApi } from "@/lib/services";
import { keys } from "@/lib/labs";
import { useAuth } from "@/context/AuthContext";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

// Today's small goal. Finish it, claim 5 points, and Alfred cheers.
export default function QuestCard() {
  const { refreshUser } = useAuth();
  const qc = useQueryClient();
  const toast = useToast();
  const quest = useQuery({ queryKey: keys.quest, queryFn: rewardsApi.quest, refetchOnWindowFocus: true });

  const claim = useMutation({
    mutationFn: rewardsApi.claim,
    onSuccess: async (r) => {
      toast.success(`Quest complete! +${r.points_awarded} points`);
      alfredController.celebrate("Quest complete! Nice one.");
      await Promise.all([qc.invalidateQueries({ queryKey: keys.quest }), qc.invalidateQueries({ queryKey: keys.inbox }), refreshUser()]);
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Couldn't claim that. Try again."),
  });

  if (quest.isPending) return <Skeleton className="h-16 w-full" />;
  if (quest.isError) return <p className="text-sm text-muted">Couldn&rsquo;t load today&rsquo;s quest.</p>;
  const q = quest.data;
  const pct = Math.round((q.progress / q.goal) * 100);

  return (
    <div>
      <p className="font-medium">{q.title}</p>
      <p className="mt-0.5 text-sm text-muted">{q.description}</p>
      <div className="mt-3 h-2 overflow-hidden rounded-full border border-ink bg-cream" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Quest progress">
        <div className="h-full bg-pink transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-xs text-muted">{q.progress} of {q.goal} · {q.points} points</span>
        {q.claimed ? (
          <span className="text-sm font-medium">✓ Claimed</span>
        ) : (
          <button className="btn btn-sm disabled:opacity-50" disabled={!q.complete || claim.isPending} onClick={() => claim.mutate()}>
            {claim.isPending ? "Claiming…" : q.complete ? "Claim reward" : "Not yet"}
          </button>
        )}
      </div>
    </div>
  );
}
