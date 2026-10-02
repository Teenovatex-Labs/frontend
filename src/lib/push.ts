// Browser side of web push: register the service worker, ask permission, subscribe this device.
import { request } from "@/lib/api";

const authed = { auth: true, activity: false } as const;

export const pushApi = {
  key: () => request<{ enabled: boolean; key: string | null }>("/push/key", {}, authed),
  subscribe: (sub: PushSubscriptionJSON) =>
    request<unknown>("/push/subscribe", { method: "POST", body: JSON.stringify(sub) }, { auth: true, activity: "Turning on notifications" }),
  unsubscribe: (endpoint: string) =>
    request<unknown>("/push/unsubscribe", { method: "POST", body: JSON.stringify({ endpoint }) }, { auth: true, activity: "Turning off notifications" }),
};

export const pushSupported = () =>
  typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

export async function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js");
  } catch {
    return null;
  }
}

const toKey = (base64: string) => {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

export async function currentSubscription() {
  const reg = await registerServiceWorker();
  return reg ? reg.pushManager.getSubscription() : null;
}

export async function enablePush(): Promise<"on" | "denied" | "unavailable"> {
  const { enabled, key } = await pushApi.key();
  const reg = await registerServiceWorker();
  if (!enabled || !key || !reg) return "unavailable";
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return "denied";
  const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toKey(key) }));
  await pushApi.subscribe(sub.toJSON());
  return "on";
}

export async function disablePush() {
  const sub = await currentSubscription();
  if (!sub) return;
  await pushApi.unsubscribe(sub.endpoint).catch(() => {});
  await sub.unsubscribe();
}
