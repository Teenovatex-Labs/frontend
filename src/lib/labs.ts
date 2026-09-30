export const LAB_CATEGORIES = [
  { value: "web", label: "Web" },
  { value: "mobile", label: "Mobile" },
  { value: "ai", label: "AI" },
  { value: "game", label: "Games" },
  { value: "hardware", label: "Hardware" },
  { value: "design", label: "Design" },
  { value: "other", label: "Other" },
] as const;

export const categoryLabel = (value: string) =>
  LAB_CATEGORIES.find((c) => c.value === value)?.label ?? value.charAt(0).toUpperCase() + value.slice(1);

// Query keys live in one place so a mutation can refresh exactly what it changed.
export const keys = {
  labs: ["labs"] as const,
  labList: (filters: object) => ["labs", "list", filters] as const,
  lab: (idOrSlug: string) => ["labs", "detail", idOrSlug] as const,
  myLabs: ["labs", "mine"] as const,
  categories: ["labs", "categories"] as const,
  dailyVotes: ["votes", "daily"] as const,
  leaderboard: ["leaderboard"] as const,
  points: ["points"] as const,
  inbox: ["inbox"] as const,
  unread: ["inbox", "unread"] as const,
  person: (username: string) => ["people", username] as const,
  sessions: ["sessions"] as const,
  inboxChats: ["messages", "list"] as const,
  thread: (id: string) => ["messages", "thread", id] as const,
  unreadChats: ["messages", "unread"] as const,
  spaces: ["community", "spaces"] as const,
  feed: (slug: string) => ["community", "feed", slug] as const,
  post: (id: string) => ["community", "post", id] as const,
  blocks: ["blocks"] as const,
  admin: (part: string, ...rest: unknown[]) => ["admin", part, ...rest] as const,
  events: (when: string) => ["events", when] as const,
  event: (id: string) => ["events", "detail", id] as const,
  tracks: ["learn", "tracks"] as const,
  track: (slug: string) => ["learn", "track", slug] as const,
  lesson: (track: string, lesson: string) => ["learn", "lesson", track, lesson] as const,
};

export const timeAgo = (iso: string, now = Date.now()) => {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};
