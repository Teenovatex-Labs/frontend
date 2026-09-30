"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  alfredController,
  type AlfredNoticeKind,
  type AlfredSnapshot,
  type AlfredTaskHandle,
  type AlfredTaskState,
} from "@/lib/alfred";
import { interpret, type Intent } from "@/lib/alfred-intents";
import { TOUR, tourKey } from "@/lib/alfred-tour";
import { run } from "@/lib/alfred-commands";
import { inboxApi, petApi } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { keys } from "@/lib/labs";
import { useAuth } from "@/context/AuthContext";

type AlfredContextValue = AlfredSnapshot & {
  /** True while a typed command is being carried out. */
  busy: boolean;
  resolveConsent: (approved: boolean, always?: boolean) => void;
  nextTour: () => void;
  skipTour: () => void;
  startTour: () => void;
  yo: () => void;
  send: (text: string) => Promise<void>;
  closeChat: () => void;
  setHover: (value: boolean) => void;
  setDragging: (value: boolean) => void;
  setMinimized: (value: boolean) => void;
  beginTask: (message: string, state?: AlfredTaskState) => AlfredTaskHandle;
  notify: (message: string, kind?: AlfredNoticeKind) => void;
};

const AlfredContext = createContext<AlfredContextValue | undefined>(undefined);
let activeProviders = 0;
let cleanupGeneration = 0;

export function AlfredProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(alfredController.subscribe, alfredController.getSnapshot, alfredController.getServerSnapshot);
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const sessionUser = useRef<string | null | undefined>(undefined);
  const lastUnread = useRef<number | null>(null);

  // The controller is a singleton, so only tear it down when the last provider goes away.
  useEffect(() => {
    activeProviders += 1;
    cleanupGeneration += 1;
    return () => {
      activeProviders -= 1;
      const generation = ++cleanupGeneration;
      queueMicrotask(() => {
        if (activeProviders === 0 && cleanupGeneration === generation) alfredController.resetSession();
      });
    };
  }, []);

  // A different member signing in must not inherit the last one's chat or permissions.
  useEffect(() => {
    if (loading) return;
    const next = user?.id ?? null;
    if (sessionUser.current !== undefined && sessionUser.current !== next) alfredController.resetSession();
    sessionUser.current = next;
    lastUnread.current = null;
  }, [loading, user?.id]);

  useEffect(() => {
    const sync = () => alfredController.setOffline(!navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  // He tells you about new notifications. The count is polled quietly and shared with the sidebar badge.
  const unread = useQuery({
    queryKey: keys.unread,
    queryFn: inboxApi.unread,
    enabled: !!user,
    refetchInterval: 60_000,
  });
  const unreadCount = unread.data?.unread;
  useEffect(() => {
    if (unreadCount === undefined) return;
    const previous = lastUnread.current;
    lastUnread.current = unreadCount;
    if (previous === null || unreadCount <= previous) return; // the first reading is just a baseline
    void inboxApi
      .list()
      .then((items) => {
        const newest = items.find((n) => !n.read);
        if (newest) alfredController.notify(newest.message, "info");
        void qc.invalidateQueries({ queryKey: keys.inbox });
      })
      .catch(() => {});
  }, [unreadCount, qc]);

  const markTourDone = useCallback(() => {
    if (!user) return;
    try {
      window.localStorage.setItem(tourKey(user.id), "1");
    } catch {
      // The tour may show again on another visit; that's harmless.
    }
  }, [user]);

  // First visit: Alfred offers to show the member around, once.
  useEffect(() => {
    if (loading || !user || !user.age_confirmed || !user.username_set) return;
    let seen = false;
    try {
      seen = window.localStorage.getItem(tourKey(user.id)) === "1";
    } catch {
      seen = true; // can't remember it, so don't pester
    }
    if (seen) return;
    const t = window.setTimeout(() => alfredController.startTour(TOUR), 1800);
    return () => window.clearTimeout(t);
  }, [loading, user]);

  const send = useCallback(
    async (text: string) => {
      const clean = text.trim();
      if (!clean || !user) return;
      alfredController.hear(clean);
      setBusy(true);
      const task = alfredController.beginTask("Working on it", "thinking");
      try {
        const ctx = {
          me: { username: user.username, points: user.points, streak: user.streak, rank: user.rank, level: user.level },
          navigate: (path: string) => router.push(path),
          ask: (input: { title: string; message: string; actionId?: string }) => alfredController.requestConsent(input),
          signOut: logout,
          startTour: () => alfredController.startTour(TOUR),
          changed: () => {
            void qc.invalidateQueries();
          },
        };
        const intent = interpret(clean);

        if (intent.kind !== "unknown") {
          alfredController.say(await run(intent, ctx));
        } else if (!user.settings?.ai_chat) {
          alfredController.say("I didn't catch that one. Try “help” to see what I can do. If you'd like me to understand more, you can turn on Alfred's AI in Settings.");
        } else {
          // Not a command he knows: ask the AI brain what the member means. Whatever it suggests is
          // one of a short fixed list, and anything that changes something still asks first.
          try {
            const thought = await petApi.brain(clean, pathname);
            alfredController.say(thought.reply);
            const suggested = thought.intent as Intent | null;
            if (suggested) {
              const done = await run(suggested, ctx);
              if (suggested.kind !== "go") alfredController.say(done);
            }
          } catch (e) {
            alfredController.say(e instanceof ApiError ? e.message : "I couldn't think that through just now. Try one of my quick commands.");
          }
        }
      } catch {
        alfredController.say("Something went wrong on my end. Try that again?");
      } finally {
        // The reply in the chat is the feedback, so no separate "All done" bubble.
        task.cancel();
        setBusy(false);
      }
    },
    [user, router, pathname, logout, qc]
  );

  const value = useMemo<AlfredContextValue>(
    () => ({
      ...snapshot,
      busy,
      resolveConsent: (approved, always) => alfredController.resolveConsent(approved, always),
      nextTour: () => {
        const step = alfredController.nextTour();
        if (step?.path) router.push(step.path);
        if (!step) markTourDone();
      },
      skipTour: () => {
        alfredController.endTour();
        markTourDone();
      },
      startTour: () => alfredController.startTour(TOUR),
      yo: () => alfredController.yo(),
      send,
      closeChat: () => alfredController.setChatOpen(false),
      setHover: (v) => alfredController.setHover(v),
      setDragging: (v) => alfredController.setDragging(v),
      setMinimized: (v) => alfredController.setMinimized(v),
      beginTask: (m, s) => alfredController.beginTask(m, s),
      notify: (m, k) => alfredController.notify(m, k),
    }),
    [snapshot, busy, send, router, markTourDone]
  );

  return <AlfredContext.Provider value={value}>{children}</AlfredContext.Provider>;
}

export function useAlfred(): AlfredContextValue {
  const context = useContext(AlfredContext);
  if (!context) throw new Error("useAlfred must be used within an AlfredProvider");
  return context;
}
