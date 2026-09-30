"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { openStream } from "@/lib/api";
import { keys } from "@/lib/labs";

type LiveEvent = { type: "message"; conversation_id: string } | { type: "notification" };

// Keeps one live connection open while the member is here, so a new message or notification shows up
// the moment it happens. If the connection drops it reconnects with a growing pause, and the normal
// polling elsewhere in the app keeps things fresh in the meantime. Renders nothing.
export default function LiveUpdates() {
  const { user } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (!user) return;
    const stop = new AbortController();
    let delay = 1_000;

    const handle = (e: LiveEvent) => {
      if (e.type === "notification") {
        void qc.invalidateQueries({ queryKey: keys.inbox });
        void qc.invalidateQueries({ queryKey: keys.unread });
      } else if (e.type === "message") {
        void qc.invalidateQueries({ queryKey: keys.inboxChats });
        void qc.invalidateQueries({ queryKey: keys.unreadChats });
        void qc.invalidateQueries({ queryKey: keys.thread(e.conversation_id) });
      }
    };

    (async () => {
      while (!stop.signal.aborted) {
        try {
          const res = await openStream("/realtime", stop.signal);
          if (res.ok && res.body) {
            delay = 1_000; // a good connection resets the backoff
            const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
            let buffer = "";
            for (;;) {
              const { value, done } = await reader.read();
              if (done) break;
              buffer += value;
              const lines = buffer.split("\n");
              buffer = lines.pop() ?? "";
              for (const line of lines) {
                if (!line.startsWith("data: ")) continue;
                try {
                  handle(JSON.parse(line.slice(6)) as LiveEvent);
                } catch {
                  // A malformed line is skipped; the next one is fine.
                }
              }
            }
          }
        } catch {
          if (stop.signal.aborted) return;
        }
        await new Promise((r) => setTimeout(r, delay));
        delay = Math.min(delay * 2, 30_000);
      }
    })();

    return () => stop.abort();
  }, [user?.id, qc]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
