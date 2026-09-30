"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { votesApi } from "@/lib/services";
import { keys } from "@/lib/labs";
import { useToast } from "@/components/ui/Toast";

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
      <path d="M12 21s-7.5-4.6-9.5-9.2C1.2 8.6 3 5.5 6.2 5.5c2 0 3.4 1.1 5.8 3.3 2.4-2.2 3.8-3.3 5.8-3.3 3.2 0 5 3.1 3.7 6.3C19.5 16.4 12 21 12 21z" />
    </svg>
  );
}

// Votes are per day: you can take yours back today, and vote again tomorrow.
export default function VoteButton({
  labId,
  count,
  voted,
  own = false,
}: {
  labId: string;
  count: number;
  voted: boolean;
  own?: boolean;
}) {
  const qc = useQueryClient();
  const toast = useToast();
  const [state, setState] = useState({ voted, count });
  // Re-sync when fresh data arrives from the server (a refetch, a different page).
  const [seen, setSeen] = useState({ voted, count });
  if (seen.voted !== voted || seen.count !== count) {
    setSeen({ voted, count });
    setState({ voted, count });
  }

  const mutation = useMutation({
    // The action is fixed by the caller: the optimistic update below re-renders before the
    // request is built, so reading `state` here would send the opposite of what was clicked.
    mutationFn: (wasVoted: boolean) => (wasVoted ? votesApi.remove(labId) : votesApi.cast(labId)),
    onMutate: (wasVoted) => {
      const before = state;
      setState({ voted: !wasVoted, count: before.count + (wasVoted ? -1 : 1) });
      return { before };
    },
    onSuccess: (result, wasVoted) => {
      setState({ voted: !wasVoted, count: result.new_vote_count });
      void qc.invalidateQueries({ queryKey: keys.dailyVotes });
      void qc.invalidateQueries({ queryKey: keys.labs });
    },
    onError: (err, _v, ctx) => {
      if (ctx) setState(ctx.before);
      toast.error(err instanceof ApiError ? err.message : "Couldn't save your vote. Try again.");
    },
  });

  return (
    <button
      type="button"
      onClick={() => mutation.mutate(state.voted)}
      disabled={mutation.isPending}
      aria-pressed={state.voted}
      aria-label={state.voted ? "Remove your vote" : "Vote for this lab"}
      title={own ? "You can vote for your own lab, but it won't earn points" : undefined}
      className={`inline-flex items-center gap-2 rounded-full border border-ink px-3.5 py-1.5 text-sm font-semibold tabular-nums transition-all active:scale-95 disabled:opacity-70 ${
        state.voted ? "bg-pink shadow-[3px_3px_0_var(--ink)]" : "bg-cream hover:-translate-y-0.5 hover:bg-yellow"
      }`}
    >
      <Heart filled={state.voted} />
      {state.count}
    </button>
  );
}
