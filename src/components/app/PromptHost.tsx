"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { BellRingIcon, SmartPhone01Icon } from "@hugeicons/core-free-icons";
import { useAuth } from "@/context/AuthContext";
import { useAlfred } from "@/context/AlfredContext";
import { useToast } from "@/components/ui/Toast";
import { LottieSlot } from "@/components/ui/LottieSlot";
import { currentSubscription, enablePush, pushApi, pushSupported } from "@/lib/push";
import { isStandalone, runInstall, useInstallEvent, useJustInstalled } from "@/lib/installPrompt";
import {
  MOMENT_EVENT,
  RULES,
  decide,
  detectPlatform,
  isBusyRoute,
  loadState,
  momentDelay,
  recordDismiss,
  recordDone,
  recordGuideSeen,
  recordIgnored,
  recordNever,
  recordShown,
  recordVisit,
  saveState,
  type Context,
  type Moment,
  type Platform,
  type PromptKind,
  type PromptState,
} from "@/lib/prompts";

const SESSION_VISIT = "tx_prompt_visit";
const SESSION_SHOWN = "tx_prompt_shown";

const session = {
  get(k: string) {
    try {
      return window.sessionStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set(k: string) {
    try {
      window.sessionStorage.setItem(k, "1");
    } catch {
      /* without session storage the in-memory flag below still holds for this page load */
    }
  },
};

const isEditable = (el: Element | null) => !!el && (el.matches("input, textarea, select, [contenteditable=''], [contenteditable='true']") || !!el.closest("[contenteditable='true']"));

/**
 * Asks signed-in members to install the app and to turn on notifications, at moments that make sense.
 * The timing rules live in lib/prompts.ts and are explained in docs/prompts.md. Renders at most one card.
 */
export default function PromptHost() {
  const { user } = useAuth();
  const alfred = useAlfred();
  const toast = useToast();
  const reduce = useReducedMotion();
  const pathname = usePathname();
  const installEvent = useInstallEvent();
  const justInstalled = useJustInstalled();

  const [shown, setShown] = useState<PromptKind | null>(null);
  const [guide, setGuide] = useState(false);
  const [pushReady, setPushReady] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const userId = user?.id ?? null;
  const state = useRef<PromptState | null>(null);
  const shownRef = useRef<PromptKind | null>(null);
  const sessionShown = useRef(false);
  const card = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const platform = useRef<Platform>("other");
  // Latest values for callbacks that run from timers.
  const live = useRef({ alfredBusy: false, pathname, installEvent, pushReady, subscribed, justInstalled });
  live.current = {
    alfredBusy: alfred.chatOpen || alfred.busy || !!alfred.consent || !!alfred.tour,
    pathname,
    installEvent,
    pushReady,
    subscribed,
    justInstalled,
  };

  const persist = useCallback(
    (next: PromptState) => {
      state.current = next;
      if (userId) saveState(userId, next);
    },
    [userId],
  );

  // Load this member's history and count the visit (once per browser session).
  useEffect(() => {
    if (!userId) return;
    platform.current = detectPlatform(navigator.userAgent, navigator.platform, navigator.maxTouchPoints);
    let s = loadState(userId);
    if (!session.get(SESSION_VISIT)) {
      s = recordVisit(s);
      session.set(SESSION_VISIT);
    }
    if (isStandalone()) s = recordDone(s, "install");
    persist(s);
    sessionShown.current = session.get(SESSION_SHOWN) === "1";
  }, [userId, persist]);

  // Installed through the browser's own UI: never ask again.
  useEffect(() => {
    if (justInstalled && state.current) persist(recordDone(state.current, "install"));
  }, [justInstalled, persist]);

  // Is a notification prompt even possible here? Checked quietly, and only once visits make it relevant.
  useEffect(() => {
    if (!userId || !pushSupported() || Notification.permission !== "default") return;
    if ((state.current?.visits ?? 0) < RULES.minVisits.notify) return;
    let cancelled = false;
    void (async () => {
      const [key, sub] = await Promise.all([pushApi.key().catch(() => null), currentSubscription().catch(() => null)]);
      if (cancelled) return;
      setPushReady(!!key?.enabled && !!key.key);
      setSubscribed(!!sub);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const busyNow = useCallback(() => {
    if (document.visibilityState !== "visible") return true;
    if (isBusyRoute(live.current.pathname)) return true;
    if (live.current.alfredBusy) return true;
    if (isEditable(document.activeElement)) return true;
    // Any open dialog, menu drawer or similar modal owns the screen.
    return !!document.querySelector("[role='dialog'][aria-modal='true'], [role='alertdialog']");
  }, []);

  const context = useCallback(
    (moment: Moment): Context => ({
      moment,
      sessionShown: sessionShown.current,
      busy: busyNow(),
      platform: platform.current,
      standalone: isStandalone(),
      canInstall: !!live.current.installEvent,
      pushSupported: pushSupported(),
      pushReady: live.current.pushReady,
      permission: typeof Notification === "undefined" ? "unsupported" : Notification.permission,
      subscribed: live.current.subscribed,
      hour: new Date().getHours(),
    }),
    [busyNow],
  );

  const tryShow = useCallback(
    (moment: Moment) => {
      const s = state.current;
      if (!s || shownRef.current) return;
      const now = Date.now();
      const kind = decide(s, context(moment), now);
      if (!kind) return;
      sessionShown.current = true;
      session.set(SESSION_SHOWN);
      shownRef.current = kind;
      setGuide(false);
      setShown(kind);
      persist(recordShown(s, kind, now));
    },
    [context, persist],
  );

  // Moments: a completed action or a celebration anywhere in the app, then a calm dwell on a page.
  useEffect(() => {
    if (!userId) return;
    const onMoment = (e: Event) => {
      const kind = (e as CustomEvent<"action" | "celebrate">).detail;
      const id = window.setTimeout(() => tryShow(kind), momentDelay(kind));
      timers.current.push(id);
    };
    window.addEventListener(MOMENT_EVENT, onMoment);
    return () => {
      window.removeEventListener(MOMENT_EVENT, onMoment);
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [userId, tryShow]);

  useEffect(() => {
    if (!userId) return;
    let tries = 0;
    let id = 0;
    const arm = () => {
      id = window.setTimeout(() => {
        tryShow("dwell");
        // One more look if the member was typing or in a dialog when the timer fired.
        if (++tries < 2 && !shownRef.current) arm();
      }, RULES.dwellMs);
    };
    arm();
    return () => window.clearTimeout(id);
  }, [userId, pathname, tryShow]);

  const close = useCallback((next: (s: PromptState, kind: PromptKind) => PromptState) => {
    const kind = shownRef.current;
    if (!kind || !state.current) return;
    persist(next(state.current, kind));
    shownRef.current = null;
    setShown(null);
    setGuide(false);
  }, [persist]);

  const notNow = useCallback(() => close((s, k) => recordDismiss(s, k, Date.now())), [close]);
  const never = () => close((s, k) => recordNever(s, k));

  // An untouched card retracts by itself; hovering or focusing it pauses that. Typing elsewhere dismisses it politely.
  useEffect(() => {
    if (!shown) return;
    let id = 0;
    const retract = () => close((s, k) => recordIgnored(s, k, Date.now()));
    const arm = () => {
      window.clearTimeout(id);
      id = window.setTimeout(retract, guide ? RULES.ignoreRetractMs * 3 : RULES.ignoreRetractMs);
    };
    const el = card.current;
    const pause = () => window.clearTimeout(id);
    const onFocusIn = (e: FocusEvent) => {
      if (el && !el.contains(e.target as Node) && isEditable(e.target as Element)) retract();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && notNow();
    arm();
    el?.addEventListener("pointerenter", pause);
    el?.addEventListener("pointerleave", arm);
    el?.addEventListener("focusin", pause);
    el?.addEventListener("focusout", arm);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(id);
      el?.removeEventListener("pointerenter", pause);
      el?.removeEventListener("pointerleave", arm);
      el?.removeEventListener("focusin", pause);
      el?.removeEventListener("focusout", arm);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("keydown", onKey);
    };
  }, [shown, guide, close, notNow]);

  const accept = async () => {
    if (shown === "install") {
      if (platform.current === "ios" && !installEvent) {
        setGuide(true);
        return;
      }
      const r = await runInstall();
      if (r === "accepted") close((s, k) => recordDone(s, k));
      else if (r === "dismissed") notNow();
      else close((s, k) => recordIgnored(s, k, Date.now()));
    } else if (shown === "notify") {
      try {
        const r = await enablePush();
        if (r === "on") {
          close((s, k) => recordDone(s, k));
          toast.success("Notifications are on for this device.");
        } else if (r === "denied") {
          // Closing the browser's own box leaves permission at "default": that is a "not now", not a "no".
          if (Notification.permission === "denied") {
            close((s, k) => recordDone(s, k));
            toast.error("Notifications are blocked in your browser settings.");
          } else notNow();
        } else {
          close((s, k) => recordIgnored(s, k, Date.now()));
          toast.error("Notifications aren't available right now.");
        }
      } catch {
        close((s, k) => recordIgnored(s, k, Date.now()));
        toast.error("Couldn't turn notifications on. Try again later in Settings.");
      }
    }
  };

  const guideDone = () => close((s, k) => recordGuideSeen(s, k, Date.now()));

  const copy =
    shown === "install"
      ? { lottie: "/lottie/install-app.json", title: "Keep TeenovateX on your home screen", body: "Opens like any other app, one tap away. No app store and nothing big to download.", cta: platform.current === "ios" && !installEvent ? "Show me how" : "Install" }
      : { lottie: "/lottie/notify-bell.json", title: "Want a nudge when it matters?", body: "Messages, votes and deadlines, and only things that are about you. Your browser will ask you to confirm next. Turn it off any time in Settings.", cta: "Turn on notifications" };

  return (
    <AnimatePresence>
      {shown && (
        <motion.div
          ref={card}
          key={shown}
          role="region"
          aria-label={shown === "install" ? "Install the app" : "Turn on notifications"}
          initial={reduce ? false : { opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          style={{ bottom: "calc(12px + env(safe-area-inset-bottom))" }}
          className="fixed inset-x-3 z-[60] border border-ink bg-cream p-4 shadow-[6px_6px_0_var(--pink)] sm:inset-x-auto sm:right-24 sm:w-[400px]"
        >
          <button type="button" onClick={notNow} aria-label="Close" className="absolute right-2 top-2 grid h-8 w-8 place-items-center text-lg text-ink/70 hover:text-ink">
            ×
          </button>
          {guide ? (
            <div>
              <h2 className="pr-8 text-[19px] leading-tight tracking-[-0.03em]">Add TeenovateX to your home screen</h2>
              <ol className="mt-3 flex flex-col gap-2.5 text-sm">
                <li className="flex items-center gap-3"><Step n={1} />Tap the <ShareGlyph /> Share button at the bottom or top of your browser.</li>
                <li className="flex items-center gap-3"><Step n={2} />Scroll down and tap <b>Add to Home Screen</b>.</li>
                <li className="flex items-center gap-3"><Step n={3} />Tap <b>Add</b>. Then open TeenovateX from your home screen.</li>
              </ol>
              <p className="mt-3 text-xs text-muted">Once it is on your home screen you can also turn on notifications.</p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <button type="button" className="btn btn-sm" onClick={guideDone}>Got it</button>
                <button type="button" className="text-xs underline underline-offset-4 text-muted" onClick={never}>Don&apos;t ask again</button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <LottieSlot
                src={copy.lottie}
                label=""
                eager
                allowSlowConnection
                className="h-20 w-20 shrink-0 sm:h-24 sm:w-24"
                fallback={
                  <motion.span
                    aria-hidden="true"
                    animate={reduce ? undefined : shown === "install" ? { y: [0, -5, 0], rotate: [-5, 2, -5] } : { rotate: [-9, 9, -7, 7, 0] }}
                    transition={reduce ? undefined : { duration: shown === "install" ? 2.4 : 2, repeat: Infinity, repeatDelay: 0.7, ease: "easeInOut" }}
                    className={`grid h-16 w-16 place-items-center rounded-[18px] border-2 border-ink shadow-[3px_3px_0_var(--ink)] ${shown === "install" ? "bg-yellow" : "bg-pink"}`}
                  >
                    <HugeiconsIcon icon={shown === "install" ? SmartPhone01Icon : BellRingIcon} size={35} strokeWidth={1.8} />
                  </motion.span>
                }
              />
              <div className="min-w-0 flex-1 pr-6">
                <h2 className="text-[19px] leading-tight tracking-[-0.03em]">{copy.title}</h2>
                <p className="mt-1.5 text-sm text-muted">{copy.body}</p>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <button type="button" className="btn btn-sm" onClick={() => void accept()}>{copy.cta}</button>
                  <button type="button" className="btn-secondary btn-sm" onClick={notNow}>Not now</button>
                </div>
                <button type="button" className="mt-2.5 text-xs text-muted underline underline-offset-4" onClick={never}>Don&apos;t ask again</button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Step({ n }: { n: number }) {
  return <span aria-hidden="true" className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-ink bg-yellow text-xs font-semibold">{n}</span>;
}

function ShareGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="inline h-4 w-4 align-[-3px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 15V3M8 7l4-4 4 4M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" />
    </svg>
  );
}
