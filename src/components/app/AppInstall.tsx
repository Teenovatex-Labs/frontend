"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { currentSubscription, disablePush, enablePush, pushSupported, registerServiceWorker } from "@/lib/push";
import { useToast } from "@/components/ui/Toast";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

// Settings card: put TeenovateX on the home screen, and get notifications on this device.
export default function AppInstallSection() {
  const toast = useToast();
  const [install, setInstall] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [supported, setSupported] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    void registerServiceWorker();
    setSupported(pushSupported());
    setBlocked(typeof Notification !== "undefined" && Notification.permission === "denied");
    setInstalled(window.matchMedia("(display-mode: standalone)").matches);
    void currentSubscription().then((s) => setOn(!!s));
    const before = (e: Event) => {
      e.preventDefault();
      setInstall(e as InstallEvent);
    };
    const done = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", before);
    window.addEventListener("appinstalled", done);
    return () => {
      window.removeEventListener("beforeinstallprompt", before);
      window.removeEventListener("appinstalled", done);
    };
  }, []);

  const toggle = async () => {
    setBusy(true);
    try {
      if (on) {
        await disablePush();
        setOn(false);
        toast.success("Notifications are off on this device.");
      } else {
        const r = await enablePush();
        if (r === "on") {
          setOn(true);
          toast.success("Notifications are on for this device.");
        } else if (r === "denied") {
          setBlocked(true);
          toast.error("Notifications are blocked in your browser settings.");
        } else toast.error("Notifications aren't available right now.");
      }
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Couldn't change that. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="border border-ink bg-white p-6 shadow-[4px_4px_0_var(--ink)]">
      <h2 className="text-[22px] tracking-[-0.03em]">App &amp; notifications</h2>
      <p className="mt-1 text-sm text-muted">Install TeenovateX on your phone or computer, and hear about votes, messages and deadlines.</p>

      <div className="mt-5 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm">
            <span className="block font-medium">Install the app</span>
            <span className="block text-muted">{installed ? "You're using the installed app." : install ? "Opens like any other app." : "In your browser menu, choose “Add to Home screen” or “Install”."}</span>
          </span>
          {!installed && install && (
            <button type="button" className="btn-secondary btn-sm" onClick={() => void install.prompt().then(() => setInstall(null))}>Install</button>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-line pt-4">
          <span className="text-sm">
            <span className="block font-medium">Notifications on this device</span>
            <span className="block text-muted">
              {!supported ? "This browser can't show notifications." : blocked ? "Blocked. Allow notifications for this site in your browser settings." : on ? "On. We only send things that are about you." : "Off."}
            </span>
          </span>
          {supported && !blocked && (
            <button type="button" className={on ? "btn-secondary btn-sm" : "btn btn-sm"} onClick={() => void toggle()} disabled={busy}>
              {busy ? "…" : on ? "Turn off" : "Turn on"}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
