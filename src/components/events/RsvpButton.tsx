"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { eventsApi, type EventItem } from "@/lib/services";
import { useToast } from "@/components/ui/Toast";
import EventTicket from "./EventTicket";

export default function RsvpButton({ event, over = false }: { event: EventItem; over?: boolean }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [ticket, setTicket] = useState<"new" | "saved" | null>(null);
  const mutation = useMutation({
    mutationFn: (going: boolean) => (going ? eventsApi.cancel(event.id) : eventsApi.rsvp(event.id)),
    onSuccess: (_r, wasGoing) => {
      if (wasGoing) { setTicket(null); toast.success("Spot cancelled."); }
      else setTicket("new");
      void qc.invalidateQueries({ queryKey: ["events"] });
      void qc.invalidateQueries({ queryKey: ["inbox"] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "That didn't work. Try again."),
  });

  if (over && !event.has_rsvped) return null;
  if (event.has_rsvped) {
    return (
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn" onClick={() => setTicket("saved")}>View ticket</button>
        {!over && <button type="button" className="btn-secondary" disabled={mutation.isPending} onClick={() => mutation.mutate(true)}>
          {mutation.isPending ? "Saving…" : "Cancel RSVP"}
        </button>}
        {ticket && <EventTicket event={event} celebrate={ticket === "new"} onClose={() => setTicket(null)} />}
      </div>
    );
  }
  return (
    <>
      <button className="btn disabled:opacity-60" disabled={mutation.isPending || event.is_full} onClick={() => mutation.mutate(false)}>
        {event.is_full ? "Full" : mutation.isPending ? "Saving…" : "I'm in"}
      </button>
      {ticket && <EventTicket event={event} celebrate={ticket === "new"} onClose={() => setTicket(null)} />}
    </>
  );
}
