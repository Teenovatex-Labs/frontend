"use client";

import { useSyncExternalStore } from "react";

// Chromium hands over its install prompt once per page load, so it is caught here and shared between
// the timed prompt and the Settings card instead of each listening on its own.
export type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

let current: InstallEvent | null = null;
let installed = false;
let started = false;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());
const subscribe = (f: () => void) => {
  subs.add(f);
  return () => void subs.delete(f);
};

export function captureInstallEvent() {
  if (started || typeof window === "undefined") return;
  started = true;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    current = e as InstallEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    current = null;
    installed = true;
    emit();
  });
}

export const useInstallEvent = () => useSyncExternalStore(subscribe, () => current, () => null);
export const useJustInstalled = () => useSyncExternalStore(subscribe, () => installed, () => false);

/** Shows the browser's install dialog. The event is single-use, so it is dropped afterwards. */
export async function runInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
  const e = current;
  if (!e) return "unavailable";
  current = null;
  emit();
  try {
    await e.prompt();
    return (await e.userChoice).outcome;
  } catch {
    return "unavailable";
  }
}

export const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
