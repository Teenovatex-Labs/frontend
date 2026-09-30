const opts = (tz?: string): Intl.DateTimeFormatOptions => ({ timeZone: tz });

/** "Sat, 14 Mar" in the viewer's own time zone. */
export const eventDay = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", ...opts() });

/** "6:30 PM" in the viewer's own time zone. */
export const eventTime = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", ...opts() });

/** "in 3 days", "tomorrow", "starting soon", "happening now", or "" once it is over. */
export const startsIn = (start: string, end: string | null, now = Date.now()) => {
  const s = new Date(start).getTime();
  const e = end ? new Date(end).getTime() : s + 3 * 60 * 60 * 1000;
  if (now >= s && now <= e) return "Happening now";
  if (now > e) return "";
  const mins = Math.round((s - now) / 60000);
  if (mins < 60) return "Starting soon";
  const hours = Math.round(mins / 60);
  if (hours < 24) return `In ${hours}h`;
  const days = Math.round(hours / 24);
  return days === 1 ? "Tomorrow" : `In ${days} days`;
};
