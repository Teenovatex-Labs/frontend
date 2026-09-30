"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { eventsApi, type EventItem } from "@/lib/services";
import { useToast } from "@/components/ui/Toast";

export default function RsvpButton({ event, over = false }: { event: EventItem; over?: boolean }) {
  const qc = useQueryClient();
  const toast = useToast();
  const mutation = useMutation({
    mutationFn: (going: boolean) => (going ? eventsApi.cancel(event.id) : eventsApi.rsvp(event.id)),
    onSuccess: (_r, wasGoing) => {
      toast.success(wasGoing ? "Spot cancelled." : "You're on the list!");
      void qc.invalidateQueries({ queryKey: ["events"] });
      void qc.invalidateQueries({ queryKey: ["inbox"] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "That didn't work. Try again."),
  });

  if (over) return null;
  if (event.has_rsvped) {
    return (
      <button className="btn-secondary" disabled={mutation.isPending} onClick={() => mutation.mutate(true)}>
        {mutation.isPending ? "Saving…" : "You're going · Cancel"}
      </button>
    );
  }
  return (
    <button className="btn disabled:opacity-60" disabled={mutation.isPending || event.is_full} onClick={() => mutation.mutate(false)}>
      {event.is_full ? "Full" : mutation.isPending ? "Saving…" : "I'm in"}
    </button>
  );
}
