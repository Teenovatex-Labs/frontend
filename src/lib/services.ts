import { request, type UserProfile } from "@/lib/api";

// Typed wrappers over the REST API. Shapes mirror the backend controllers; when a
// response changes there, change it here and the compiler shows every screen it touches.

export type Builder = { username: string; avatar_url: string | null };

export type Lab = {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  description: string;
  category: string;
  cover_url: string | null;
  demo_url: string | null;
  github_url: string | null;
  tx_post_url: string | null;
  tags: string[];
  vote_count: number;
  created_at: string;
  updated_at: string;
  user: Builder & { full_name?: string };
  has_voted_today?: boolean;
};

export type LabList = { projects: Lab[]; total: number; page: number; pages: number };
export type LabSort = "newest" | "votes" | "trending";
export type LabFilters = { page?: number; limit?: number; sort?: LabSort; category?: string; search?: string };

const qs = (params: Record<string, string | number | undefined>) => {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") q.set(k, String(v));
  const out = q.toString();
  return out ? `?${out}` : "";
};

const authed = { auth: true, activity: false } as const;

export const labsApi = {
  list: (f: LabFilters = {}) => request<LabList>(`/projects${qs({ ...f })}`, {}, authed),
  mine: () => request<{ projects: Lab[]; total: number }>("/projects/mine", {}, authed),
  categories: () => request<{ categories: { name: string; count: number }[] }>("/projects/categories", {}, authed),
  get: (idOrSlug: string) => request<Lab>(`/projects/${encodeURIComponent(idOrSlug)}`, {}, authed),

  create: (data: FormData) =>
    request<{ id: string; name: string; slug: string; vote_count: number }>(
      "/projects",
      { method: "POST", body: data },
      { auth: true, activity: "Launching your lab" }
    ),

  update: (id: string, data: Partial<Pick<Lab, "name" | "short_description" | "description" | "category" | "demo_url" | "github_url" | "tags">>) =>
    request<Lab>(`/projects/${id}`, { method: "PATCH", body: JSON.stringify(data) }, { auth: true, activity: "Saving your lab" }),
  remove: (id: string) =>
    request<{ message: string }>(`/projects/${id}`, { method: "DELETE" }, { auth: true, activity: "Deleting your lab" }),
};

export type VoteResult = { new_vote_count: number; points_awarded?: number; votes_remaining_today?: number };
export type DailyVotes = { votes_used_today: number; votes_remaining: number; resets_at: string };

export const votesApi = {
  cast: (labId: string) =>
    request<VoteResult>(`/projects/${labId}/vote`, { method: "POST" }, { auth: true, activity: "Casting your vote" }),
  remove: (labId: string) =>
    request<VoteResult>(`/projects/${labId}/vote`, { method: "DELETE" }, { auth: true, activity: "Removing your vote" }),
  daily: () => request<DailyVotes>("/votes/my-daily-status", {}, authed),
};

export type LeaderboardEntry = { rank: number; username: string; avatar_url: string | null; points: number; vote_count: number };
export type PointsSummary = {
  total_points: number;
  breakdown: { votes_received: number; posts_tagged: number; streak_bonus: number };
  activity: { description: string; points: number; timestamp: string }[];
};

export const pointsApi = {
  leaderboard: (page = 1, limit = 20) =>
    request<{ leaderboard: LeaderboardEntry[] }>(`/leaderboard${qs({ page, limit })}`, {}, authed),
  mine: () => request<PointsSummary>("/points/me", {}, authed),
};

export type Notification = {
  id: string;
  type: string;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
};

export const inboxApi = {
  list: () => request<Notification[]>("/notifications", {}, authed),
  unread: () => request<{ unread: number }>("/notifications/unread-count", {}, authed),
  read: (id: string) => request<unknown>(`/notifications/${id}/read`, { method: "PATCH" }, authed),
  readAll: () => request<unknown>("/notifications/read-all", { method: "PATCH" }, { auth: true, activity: "Marking everything read" }),
  remove: (id: string) => request<unknown>(`/notifications/${id}`, { method: "DELETE" }, authed),
};

export type PublicProfile = Pick<
  UserProfile,
  "id" | "username" | "full_name" | "avatar_url" | "bio" | "points" | "streak" | "social_links" | "created_at"
> & { followers?: number; following?: number; is_following?: boolean };

export const peopleApi = {
  get: (username: string) => request<PublicProfile>(`/users/${encodeURIComponent(username)}`, {}, authed),
  labs: (username: string) => request<{ projects: Lab[] }>(`/users/${encodeURIComponent(username)}/projects`, {}, authed),
  follow: (username: string) =>
    request<{ message: string }>(`/users/${encodeURIComponent(username)}/follow`, { method: "POST" }, { auth: true, activity: "Following" }),
  unfollow: (username: string) =>
    request<{ message: string }>(`/users/${encodeURIComponent(username)}/follow`, { method: "DELETE" }, { auth: true, activity: "Unfollowing" }),
};

export type NotificationSettings = { email_notifications: boolean; vote_alerts: boolean; contest_updates: boolean; public_profile?: boolean };
export type SessionInfo = { id: string; device_info: string | null; ip: string | null; last_active: string; created_at: string; current?: boolean };

export const accountApi = {
  update: (data: { full_name?: string; bio?: string; timezone?: string; social_links?: Record<string, string> }) =>
    request<unknown>("/users/me", { method: "PATCH", body: JSON.stringify(data) }, { auth: true, activity: "Saving your profile" }),
  notifications: (data: Partial<NotificationSettings>) =>
    request<unknown>("/settings/notifications", { method: "PATCH", body: JSON.stringify(data) }, { auth: true, activity: "Saving your settings" }),
  sessions: () => request<SessionInfo[]>("/settings/sessions", {}, authed),
  revokeSession: (id: string) => request<unknown>(`/settings/sessions/${id}`, { method: "DELETE" }, { auth: true, activity: "Signing that device out" }),
  deleteAccount: (data: { password?: string; id_token?: string }) =>
    request<{ message: string }>("/settings/account", { method: "DELETE", body: JSON.stringify(data) }, { auth: true, activity: "Deleting your account" }),
};
