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
import {
  alfredController,
  type AlfredActivityState,
  type AlfredNoticeKind,
  type AlfredSnapshot,
  type AlfredTaskHandle,
  type AlfredTaskState,
} from "@/lib/alfred";
import { notificationsApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type AlfredContextValue = AlfredSnapshot & {
  resolveConsent: (approved: boolean) => void;
  wake: () => void;
  play: () => void;
  greet: () => void;
  beginTask: (message: string, state?: AlfredTaskState) => AlfredTaskHandle;
  requestConsent: (input: { title: string; message: string }) => Promise<boolean>;
  notify: (message: string, kind?: AlfredNoticeKind) => void;
  setActivity: (state: AlfredActivityState, message?: string) => void;
  setMinimized: (value: boolean) => void;
  setHidden: (value: boolean) => void;
};

const AlfredContext = createContext<AlfredContextValue | undefined>(undefined);
let activeAlfredProviders = 0;
let providerCleanupGeneration = 0;

export function AlfredProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(
    alfredController.subscribe,
    alfredController.getSnapshot,
    alfredController.getServerSnapshot
  );
  const { user, loading } = useAuth();
  const [visible, setVisible] = useState(true);
  const seenNotificationIds = useRef<Set<string> | null>(null);
  const sessionUserId = useRef<string | null | undefined>(undefined);
  const lastPresenceAt = useRef(0);

  useEffect(() => {
    activeAlfredProviders += 1;
    providerCleanupGeneration += 1;
    return () => {
      activeAlfredProviders -= 1;
      const generation = ++providerCleanupGeneration;
      queueMicrotask(() => {
        if (activeAlfredProviders === 0 && providerCleanupGeneration === generation) {
          alfredController.resetSession();
        }
      });
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    const nextUserId = user?.id ?? null;
    if (sessionUserId.current !== undefined && sessionUserId.current !== nextUserId) {
      alfredController.resetSession();
    }
    sessionUserId.current = nextUserId;
    seenNotificationIds.current = null;
  }, [loading, user?.id]);

  useEffect(() => {
    const syncVisibility = () => {
      const isVisible = document.visibilityState === "visible";
      setVisible(isVisible);
      alfredController.setVisible(isVisible);
    };
    const syncMotion = () => alfredController.setReducedMotion(
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
    );
    const syncOnline = () => alfredController.setOffline(!navigator.onLine);
    const notePresence = () => {
      const now = Date.now();
      if (now - lastPresenceAt.current < 1_000) return;
      lastPresenceAt.current = now;
      alfredController.notePresence();
    };

    syncVisibility();
    syncMotion();
    syncOnline();
    document.addEventListener("visibilitychange", syncVisibility);
    window.addEventListener("online", syncOnline);
    window.addEventListener("offline", syncOnline);
    window.addEventListener("pointerdown", notePresence, { passive: true });
    window.addEventListener("keydown", notePresence);
    window.addEventListener("scroll", notePresence, { passive: true });
    const motionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    motionQuery?.addEventListener?.("change", syncMotion);
    alfredController.greet();

    return () => {
      document.removeEventListener("visibilitychange", syncVisibility);
      window.removeEventListener("online", syncOnline);
      window.removeEventListener("offline", syncOnline);
      window.removeEventListener("pointerdown", notePresence);
      window.removeEventListener("keydown", notePresence);
      window.removeEventListener("scroll", notePresence);
      motionQuery?.removeEventListener?.("change", syncMotion);
    };
  }, []);

  useEffect(() => {
    if (loading || !user || !visible) return;
    let disposed = false;
    let inFlight = false;
    const poll = async () => {
      if (disposed || inFlight || document.visibilityState !== "visible" || !navigator.onLine) return;
      inFlight = true;
      try {
        const notifications = await notificationsApi.list();
        if (disposed) return;
        const currentIds = new Set(notifications.map((notification) => notification.id));
        const previousIds = seenNotificationIds.current;
        seenNotificationIds.current = currentIds;
        if (previousIds) {
          const newest = notifications.find((notification) => !previousIds.has(notification.id));
          if (newest) alfredController.notify(newest.message, "info");
        }
      } catch {
        // Notifications are optional; failed background checks do not interrupt app work.
      } finally {
        inFlight = false;
      }
    };
    void poll();
    const timer = window.setInterval(() => void poll(), 60_000);
    return () => {
      disposed = true;
      window.clearInterval(timer);
    };
  }, [loading, user?.id, visible]);

  const resolveConsent = useCallback((approved: boolean) => alfredController.resolveConsent(approved), []);
  const wake = useCallback(() => alfredController.wake(), []);
  const play = useCallback(() => alfredController.play(), []);
  const greet = useCallback(() => alfredController.greet(), []);
  const beginTask = useCallback((message: string, state?: AlfredTaskState) => alfredController.beginTask(message, state), []);
  const requestConsent = useCallback((input: { title: string; message: string }) => alfredController.requestConsent(input), []);
  const notify = useCallback((message: string, kind?: AlfredNoticeKind) => alfredController.notify(message, kind), []);
  const setActivity = useCallback((state: AlfredActivityState, message?: string) => alfredController.setActivity(state, message), []);
  const setMinimized = useCallback((value: boolean) => alfredController.setMinimized(value), []);
  const setHidden = useCallback((value: boolean) => alfredController.setHidden(value), []);

  const value = useMemo<AlfredContextValue>(() => ({
    ...snapshot,
    resolveConsent,
    wake,
    play,
    greet,
    beginTask,
    requestConsent,
    notify,
    setActivity,
    setMinimized,
    setHidden,
  }), [snapshot, resolveConsent, wake, play, greet, beginTask, requestConsent, notify, setActivity, setMinimized, setHidden]);

  return <AlfredContext.Provider value={value}>{children}</AlfredContext.Provider>;
}

export function useAlfred(): AlfredContextValue {
  const context = useContext(AlfredContext);
  if (!context) throw new Error("useAlfred must be used within an AlfredProvider");
  return context;
}
