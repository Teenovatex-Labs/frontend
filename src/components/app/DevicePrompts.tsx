"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { LottieSlot } from "@/components/ui/LottieSlot";
import { currentSubscription, enablePush, pushSupported } from "@/lib/push";
import { canShowPrompt, PROMPT_RULES, recordPrompt, type PromptHistory, type PromptKind } from "@/lib/device-prompts";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

const read = (key: string): PromptHistory | null => {
  try { return JSON.parse(localStorage.getItem(key) || "null") as PromptHistory | null; } catch { return null; }
};
const save = (key: string, history: PromptHistory) => {
  try { localStorage.setItem(key, JSON.stringify(history)); } catch { /* prompts are optional */ }
};

export default function DevicePrompts() {
  const { user } = useAuth();
  const reduced = useReducedMotion();
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [kind, setKind] = useState<PromptKind | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  const [pushOn, setPushOn] = useState(false);

  useEffect(() => {
    const isInstalled = () => window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(isInstalled());
    setIos(/iPad|iPhone|iPod/.test(navigator.userAgent));
    const refresh = () => {
      if (isInstalled()) setInstalled(true);
      void currentSubscription().then((sub) => setPushOn(!!sub)).catch(() => {});
    };
    refresh();
    const before = (event: Event) => { event.preventDefault(); setInstallEvent(event as InstallEvent); };
    const done = () => { setInstalled(true); setKind(null); };
    window.addEventListener("beforeinstallprompt", before);
    window.addEventListener("appinstalled", done);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { window.removeEventListener("beforeinstallprompt", before); window.removeEventListener("appinstalled", done); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, []);

  useEffect(() => {
    if ((kind === "install" && installed) || (kind === "notifications" && (pushOn || (typeof Notification !== "undefined" && Notification.permission !== "default")))) setKind(null);
  }, [kind, installed, pushOn]);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    const sessionKey = `tx-device-prompt-session:${user.id}`;
    const choose = async () => {
      if (cancelled || document.visibilityState !== "visible" || kind) return;
      try { if (sessionStorage.getItem(sessionKey)) return; } catch { return; }
      const now = Date.now();
      const installKey = `tx-device-prompt:${user.id}:install`;
      const notificationKey = `tx-device-prompt:${user.id}:notifications`;
      if (!installed && (installEvent || ios) && canShowPrompt("install", read(installKey), now)) {
        save(installKey, recordPrompt(read(installKey), now));
        try { sessionStorage.setItem(sessionKey, "1"); } catch { return; }
        setKind("install");
      } else if (pushSupported() && Notification.permission === "default" && !pushOn &&
        canShowPrompt("notifications", read(notificationKey), now)) {
        // Don't ask for browser permission until the member explicitly chooses to.
        const sub = await currentSubscription().catch(() => null);
        if (cancelled || sub) return;
        save(notificationKey, recordPrompt(read(notificationKey), now));
        try { sessionStorage.setItem(sessionKey, "1"); } catch { return; }
        setKind("notifications");
      }
    };
    const installEligible = !installed && (installEvent || ios) &&
      canShowPrompt("install", read(`tx-device-prompt:${user.id}:install`), Date.now());
    const delay = installEligible ? PROMPT_RULES.install.delay : PROMPT_RULES.notifications.delay;
    const timer = window.setTimeout(() => void choose(), delay);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [user?.id, installEvent, installed, ios, pushOn, kind]);

  const dismiss = () => {
    if (kind && user) {
      const key = `tx-device-prompt:${user.id}:${kind}`;
      save(key, { ...(read(key) ?? { shown: 1, last: Date.now() }), dismissed: true });
    }
    setKind(null);
    setMessage("");
  };

  const act = async () => {
    if (!kind) return;
    setBusy(true);
    setMessage("");
    try {
      if (kind === "install") {
        if (installEvent) {
          await installEvent.prompt();
          const choice = await installEvent.userChoice;
          setInstallEvent(null);
          if (choice.outcome === "accepted") { setInstalled(true); dismiss(); }
          else dismiss();
        } else setMessage("In Safari, tap Share, then Add to Home Screen.");
      } else {
        const result = await enablePush();
        if (result === "on") { setPushOn(true); dismiss(); }
        else if (result === "denied") dismiss();
        else setMessage("Notifications aren't available right now. You can try again in Settings.");
      }
    } catch { setMessage("That didn't work. You can try again in Settings."); }
    finally { setBusy(false); }
  };

  return <AnimatePresence>
    {kind && <motion.aside
      key={kind}
      role="dialog"
      aria-label={kind === "install" ? "Install TeenovateX" : "Turn on notifications"}
      initial={reduced ? false : { opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduced ? undefined : { opacity: 0, y: 16, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 350, damping: 32 }}
      className="fixed bottom-4 left-4 right-4 z-[70] mx-auto max-w-[390px] border-2 border-ink bg-cream p-4 shadow-[7px_7px_0_var(--ink)] sm:left-auto sm:right-6 sm:mx-0"
    >
      <div className="flex items-start gap-3">
        <LottieSlot src={kind === "install" ? "/lottie/accepted.json" : "/lottie/empty-notifications.json"} label="" className="h-16 w-16 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold leading-tight">{kind === "install" ? "Take TeenovateX with you" : "Want a heads-up?"}</p>
          <p className="mt-1 text-sm text-muted">{kind === "install" ? "Add this space to your home screen for a quicker way back." : "Get updates about your messages, projects and deadlines on this device."}</p>
        </div>
        <button type="button" onClick={dismiss} aria-label="Dismiss prompt" className="-mt-1 p-1 text-xl leading-none">×</button>
      </div>
      {message && <p role="status" className="mt-3 text-sm">{message}</p>}
      <div className="mt-4 flex items-center gap-3">
        {kind === "install" && ios && !installEvent && message ?
          <button type="button" className="btn btn-sm" onClick={() => { setInstalled(true); dismiss(); }}>I've added it</button> :
          <button type="button" className="btn btn-sm" disabled={busy} onClick={() => void act()}>{busy ? "One moment…" : kind === "install" ? "Add to home screen" : "Turn on notifications"}</button>}
        <button type="button" className="text-sm underline underline-offset-4" onClick={dismiss}>No thanks</button>
      </div>
    </motion.aside>}
  </AnimatePresence>;
}
