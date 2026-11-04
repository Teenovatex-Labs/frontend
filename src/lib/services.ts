import { request, type LevelInfo, type UserProfile } from "@/lib/api";

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
  setCover: (id: string, file: File) => {
    const form = new FormData();
    form.append("cover_image", file);
    return request<{ cover_url: string }>(`/projects/${id}/cover`, { method: "PUT", body: form }, { auth: true, activity: "Uploading your cover" });
  },
  clearCover: (id: string) => request<{ cover_url: null }>(`/projects/${id}/cover`, { method: "DELETE" }, { auth: true, activity: false }),
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
  breakdown: { votes_received: number; posts_tagged: number; streak_bonus: number; lessons: number };
  activity: { description: string; points: number; timestamp: string }[];
};

export const seasonBoardApi = {
  list: () => request<{ items: { id: string; number: number; name: string; is_current: boolean }[] }>("/seasons", {}, authed),
  board: (id: string) => request<{ season: { id: string; name: string }; leaderboard: LeaderboardEntry[] }>(`/seasons/${id}/leaderboard`, {}, authed),
};

export const pointsApi = {
  leaderboard: (page = 1, limit = 20, period: "all" | "week" = "all") =>
    request<{ leaderboard: LeaderboardEntry[] }>(`/leaderboard${qs({ page, limit, period })}`, {}, authed),
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

export type Honor = { id: string; slug: string; name: string; description: string; criteria_text: string; tier: "standard" | "high" | "top"; image_url: string | null; fallback_url: string | null; awarded_at: string; featured: boolean };

export type PublicProfile =
  | { private: true; username: string; avatar_url: string | null }
  | (Pick<UserProfile, "id" | "username" | "full_name" | "avatar_url" | "bio" | "points" | "streak" | "social_links" | "created_at"> & {
      private: false;
      rank: number;
      level: LevelInfo;
      badges: EarnedBadge[];
      honors: Honor[];
      lab_count: number;
    });

export const peopleApi = {
  get: (username: string) => request<PublicProfile>(`/users/${encodeURIComponent(username)}`, {}, authed),
  labs: (username: string) => request<{ projects: Lab[] }>(`/users/${encodeURIComponent(username)}/projects`, {}, authed),
  setFeaturedBadges: (award_ids: string[]) => request<{ featured: string[] }>("/users/me/badges/featured", { method: "PATCH", body: json({ award_ids }) }, write()),
};

export type NotificationSettings = { email_notifications: boolean; vote_alerts: boolean; contest_updates: boolean; public_profile?: boolean; ai_chat?: boolean };
export type SessionInfo = {
  id: string;
  device_info: string | null;
  device: { label: string; browser: string; os: string; kind: "phone" | "tablet" | "computer" | "unknown" };
  ip: string | null;
  location: string | null;
  last_active: string;
  created_at: string;
};

export const accountApi = {
  update: (data: { full_name?: string; bio?: string; timezone?: string; social_links?: Record<string, string> }) =>
    request<unknown>("/users/me", { method: "PATCH", body: JSON.stringify(data) }, { auth: true, activity: "Saving your profile" }),
  notifications: (data: Partial<NotificationSettings>) =>
    request<unknown>("/settings/notifications", { method: "PATCH", body: JSON.stringify(data) }, { auth: true, activity: "Saving your settings" }),
  sessions: () => request<SessionInfo[]>("/settings/sessions", {}, authed),
  currentSession: (refresh_token: string) =>
    request<{ id: string | null }>("/settings/sessions/current", { method: "POST", body: JSON.stringify({ refresh_token }) }, authed),
  revokeOtherSessions: (refresh_token: string) =>
    request<{ count: number }>("/settings/sessions/revoke-others", { method: "POST", body: JSON.stringify({ refresh_token }) }, { auth: true, activity: "Signing out your other devices" }),
  revokeSession: (id: string) => request<unknown>(`/settings/sessions/${id}`, { method: "DELETE" }, { auth: true, activity: "Signing that device out" }),
  deleteAccount: (data: { password?: string; id_token?: string }) =>
    request<{ message: string }>("/settings/account", { method: "DELETE", body: JSON.stringify(data) }, { auth: true, activity: "Deleting your account" }),
};

export type EventItem = {
  id: string;
  title: string;
  description: string;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  cover_url: string | null;
  capacity: number | null;
  rsvp_count: number;
  has_rsvped: boolean;
  is_full: boolean;
};

export const eventsApi = {
  list: (when: "upcoming" | "past" = "upcoming") => request<{ events: EventItem[] }>(`/events${qs({ when })}`, {}, authed),
  get: (id: string) => request<EventItem>(`/events/${id}`, {}, authed),
  rsvp: (id: string) => request<{ rsvp_count: number }>(`/events/${id}/rsvp`, { method: "POST" }, { auth: true, activity: "Saving your spot" }),
  cancel: (id: string) => request<{ rsvp_count: number }>(`/events/${id}/rsvp`, { method: "DELETE" }, { auth: true, activity: "Cancelling your spot" }),
};

export type TrackSummary = { id: string; slug: string; title: string; description: string; lesson_count: number; minutes: number; completed_count: number };
export type LessonSummary = { id: string; slug: string; title: string; summary: string; minutes: number; completed: boolean };
export type TrackDetail = { id: string; slug: string; title: string; description: string; lessons: LessonSummary[] };
export type LessonDetail = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  minutes: number;
  completed: boolean;
  track: { slug: string; title: string };
  prev: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
};

export const learnApi = {
  tracks: () => request<{ tracks: TrackSummary[] }>("/learn/tracks", {}, authed),
  track: (slug: string) => request<TrackDetail>(`/learn/tracks/${slug}`, {}, authed),
  lesson: (track: string, lesson: string) => request<LessonDetail>(`/learn/tracks/${track}/lessons/${lesson}`, {}, authed),
  complete: (lessonId: string) =>
    request<{ completed: boolean; points_awarded: number }>(`/learn/lessons/${lessonId}/complete`, { method: "POST" }, { auth: true, activity: "Saving your progress" }),
};

// --- community -----------------------------------------------------------------------------

export type Space = { id: string; slug: string; name: string; description: string; post_count: number };
export type PostAuthor = { username: string; avatar_url: string | null };
export type PostSummary = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  comment_count: number;
  reaction_count: number;
  author: PostAuthor;
  space?: { slug: string; name: string };
  has_reacted: boolean;
};
export type CommentItem = { id: string; body: string; created_at: string; author: PostAuthor };
export type PostDetail = PostSummary & { comments: CommentItem[] };
export type Feed = { space: { slug: string; name: string; description: string }; posts: PostSummary[]; total: number; page: number; pages: number };

export const communityApi = {
  spaces: () => request<{ spaces: Space[] }>("/community/spaces", {}, authed),
  feed: (slug: string, page = 1) => request<Feed>(`/community/spaces/${slug}/posts${qs({ page })}`, {}, authed),
  post: (id: string) => request<PostDetail>(`/community/posts/${id}`, {}, authed),
  createPost: (slug: string, data: { title: string; body: string }) =>
    request<PostSummary>(`/community/spaces/${slug}/posts`, { method: "POST", body: JSON.stringify(data) }, { auth: true, activity: "Posting" }),
  deletePost: (id: string) => request<unknown>(`/community/posts/${id}`, { method: "DELETE" }, { auth: true, activity: "Deleting your post" }),
  comment: (id: string, body: string) =>
    request<CommentItem>(`/community/posts/${id}/comments`, { method: "POST", body: JSON.stringify({ body }) }, { auth: true, activity: "Posting your comment" }),
  deleteComment: (id: string) => request<unknown>(`/community/comments/${id}`, { method: "DELETE" }, authed),
  react: (id: string, on: boolean) =>
    request<{ reaction_count: number; has_reacted: boolean }>(`/community/posts/${id}/react`, { method: on ? "POST" : "DELETE" }, authed),
};

// --- safety --------------------------------------------------------------------------------

export type ReportTarget = "post" | "comment" | "lab" | "user" | "message";
export type ReportReason = "bullying" | "inappropriate" | "spam" | "personal_info" | "self_harm" | "unsafe_contact" | "other";

export const REPORT_REASONS: { value: ReportReason; label: string; hint: string }[] = [
  { value: "bullying", label: "Bullying or unkind", hint: "Picking on someone, insults, harassment" },
  { value: "inappropriate", label: "Not appropriate for teens", hint: "Content that doesn't belong here" },
  { value: "unsafe_contact", label: "Makes me feel unsafe", hint: "Asking to talk elsewhere, pressure, or anything that feels off" },
  { value: "personal_info", label: "Shares personal details", hint: "Phone numbers, addresses, or private info" },
  { value: "self_harm", label: "Someone may be hurting themselves", hint: "We treat these first and reach out with care" },
  { value: "spam", label: "Spam or scam", hint: "Ads, junk, or links that look suspicious" },
  { value: "other", label: "Something else", hint: "Tell us in your own words" },
];

export const safetyApi = {
  report: (data: { target_type: ReportTarget; target_id: string; reason: ReportReason; details?: string }) =>
    request<{ message: string }>("/reports", { method: "POST", body: JSON.stringify(data) }, { auth: true, activity: "Sending your report" }),
  block: (username: string) =>
    request<{ message: string }>(`/blocks/${encodeURIComponent(username)}`, { method: "POST" }, { auth: true, activity: "Blocking" }),
  unblock: (username: string) =>
    request<{ message: string }>(`/blocks/${encodeURIComponent(username)}`, { method: "DELETE" }, { auth: true, activity: "Unblocking" }),
  blocks: () => request<{ blocks: { username: string; avatar_url: string | null; blocked_at: string }[] }>("/blocks", {}, authed),
};

// --- admin ---------------------------------------------------------------------------------

export type Paged<T> = { items: T[]; total: number; page: number; pages: number };
export type AdminReport = {
  id: string;
  target_type: string;
  target_id: string;
  reason: ReportReason;
  details: string | null;
  status: "open" | "actioned" | "dismissed";
  created_at: string;
  handled_at: string | null;
  note: string | null;
  reporter: string;
  target: { exists: boolean; title?: string; excerpt?: string; author?: string; hidden?: boolean; slug?: string };
  reports_on_target: number;
  reports_on_member: number;
  target_user_id: string | null;
};
export type AdminUser = {
  id: string;
  username: string;
  full_name: string;
  email: string;
  role: "member" | "mentor" | "moderator" | "admin";
  points: number;
  created_at: string;
  suspended_until: string | null;
  suspended_reason: string | null;
  reports_against: number;
};
export type AuditItem = { id: string; actor: string | null; action: string; target_type: string | null; target_id: string | null; meta: unknown; created_at: string };

export const adminApi = {
  stats: () => request<{ users: number; new_users_7d: number; labs: number; posts: number; open_reports: number; suspended: number }>("/admin/stats", {}, authed),
  reports: (status: "open" | "actioned" | "dismissed", page = 1) => request<Paged<AdminReport>>(`/admin/reports${qs({ status, page })}`, {}, authed),
  resolve: (id: string, data: { action: "dismiss" | "warn" | "remove" | "suspend"; note?: string; days?: number }) =>
    request<{ message: string }>(`/admin/reports/${id}/resolve`, { method: "POST", body: JSON.stringify(data) }, { auth: true, activity: false }),
  users: (search: string, page = 1) => request<Paged<AdminUser>>(`/admin/users${qs({ search, page })}`, {}, authed),
  suspend: (id: string, data: { days: number; reason: string }) =>
    request<unknown>(`/admin/users/${id}/suspend`, { method: "POST", body: JSON.stringify(data) }, { auth: true, activity: false }),
  unsuspend: (id: string) => request<unknown>(`/admin/users/${id}/unsuspend`, { method: "POST" }, { auth: true, activity: false }),
  setRole: (id: string, role: AdminUser["role"]) =>
    request<unknown>(`/admin/users/${id}/role`, { method: "POST", body: JSON.stringify({ role }) }, { auth: true, activity: false }),
  audit: (page = 1) => request<Paged<AuditItem>>(`/admin/audit${qs({ page })}`, {}, authed),
};

// --- messages ------------------------------------------------------------------------------

export type ChatPartner = { username: string; avatar_url: string | null; group?: boolean; lab_slug?: string; member_count?: number };
export type ConversationSummary = {
  id: string;
  with: ChatPartner;
  last_message: { body: string; from_me: boolean; created_at: string; from_name?: string } | null;
  unread: number;
  updated_at: string;
  can_message: boolean;
};
export type ChatImageInfo = { id: string; status: "pending" | "approved" | "rejected"; width: number; height: number };
export type ChatMessage = { id: string; body: string; created_at: string; from_me: boolean; from_name?: string; support?: string; image?: ChatImageInfo | null };
export type Thread = {
  with: ChatPartner;
  can_message: boolean;
  other_last_read_at: string | null;
  has_more: boolean;
  messages: ChatMessage[];
};

export const messagesApi = {
  list: () => request<{ conversations: ConversationSummary[] }>("/messages/conversations", {}, authed),
  unread: () => request<{ unread: number }>("/messages/unread-count", {}, authed),
  open: (username: string) =>
    request<{ id: string; with: { username: string; avatar_url: string | null } }>(
      "/messages/conversations",
      { method: "POST", body: JSON.stringify({ username }) },
      { auth: true, activity: "Opening the chat" }
    ),
  thread: (id: string, params: { after?: string; before?: string } = {}) => request<Thread>(`/messages/conversations/${id}${qs(params)}`, {}, authed),
  send: (id: string, body: string) =>
    request<ChatMessage>(`/messages/conversations/${id}/messages`, { method: "POST", body: JSON.stringify({ body }) }, { auth: true, activity: false }),
  sendImage: (id: string, file: File, caption: string) => {
    const form = new FormData();
    form.append("image", file);
    form.append("body", caption);
    return request<ChatMessage>(`/messages/conversations/${id}/images`, { method: "POST", body: form }, { auth: true, activity: "Sending your image" });
  },
  imageLink: (imageId: string) => request<{ url: string; status: "pending" | "approved" | "rejected" }>(`/messages/images/${imageId}`, {}, authed),
  openLabChat: (lab: string) => request<{ id: string }>(`/projects/${lab}/chat`, { method: "POST" }, { auth: true, activity: "Opening the team chat" }),
  unsend: (messageId: string) => request<unknown>(`/messages/messages/${messageId}`, { method: "DELETE" }, authed),
};

// --- labs, deeper ---------------------------------------------------------------------------

export type LabUpdateItem = { id: string; title: string; body: string; created_at: string; author: PostAuthor | null };
export type TaskStatus = "backlog" | "in_progress" | "testing" | "done";
export const TASK_COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: "backlog", label: "Backlog" },
  { id: "in_progress", label: "In progress" },
  { id: "testing", label: "Testing" },
  { id: "done", label: "Done" },
];
export type TaskItem = { id: string; title: string; notes: string | null; status: TaskStatus; position: number; assignee: string | null; due_at: string | null; created_at: string; done_at: string | null };
export type Milestone = { id: string; title: string; due_at: string | null; done: boolean; done_at: string | null };
export type TeamInfo = {
  members: { username: string; avatar_url: string | null; role: "owner" | "member" }[];
  my_role: "owner" | "member" | null;
  my_request: { status: "pending" | "accepted" | "declined" } | null;
  requests: { id: string; message: string | null; created_at: string; user: PostAuthor }[];
};
export type MyTask = { id: string; title: string; status: TaskStatus; due_at: string | null; assigned_to_me: boolean; lab: { name: string; slug: string } };

const json = (data: unknown) => JSON.stringify(data);
const write = (activity: string | false = false) => ({ auth: true, activity }) as const;

export const labsDeepApi = {
  updates: (lab: string, page = 1) => request<{ updates: LabUpdateItem[]; total: number; page: number; pages: number }>(`/projects/${lab}/updates${qs({ page })}`, {}, authed),
  postUpdate: (lab: string, data: { title: string; body: string }) => request<LabUpdateItem>(`/projects/${lab}/updates`, { method: "POST", body: json(data) }, write("Posting your update")),
  deleteUpdate: (lab: string, id: string) => request<unknown>(`/projects/${lab}/updates/${id}`, { method: "DELETE" }, write()),

  board: (lab: string) => request<{ columns: Record<TaskStatus, TaskItem[]> }>(`/projects/${lab}/board`, {}, authed),
  addTask: (lab: string, data: { title: string; status?: TaskStatus; due_at?: string | null; assignee?: string | null; notes?: string }) =>
    request<TaskItem>(`/projects/${lab}/tasks`, { method: "POST", body: json(data) }, write()),
  updateTask: (lab: string, id: string, data: Partial<{ title: string; notes: string | null; status: TaskStatus; position: number; due_at: string | null; assignee: string | null }>) =>
    request<TaskItem>(`/projects/${lab}/tasks/${id}`, { method: "PATCH", body: json(data) }, write()),
  deleteTask: (lab: string, id: string) => request<unknown>(`/projects/${lab}/tasks/${id}`, { method: "DELETE" }, write()),
  myTasks: () => request<{ tasks: MyTask[] }>("/projects/mine/tasks", {}, authed),

  milestones: (lab: string) => request<{ milestones: Milestone[] }>(`/projects/${lab}/milestones`, {}, authed),
  addMilestone: (lab: string, data: { title: string; due_at?: string | null }) => request<Milestone>(`/projects/${lab}/milestones`, { method: "POST", body: json(data) }, write()),
  updateMilestone: (lab: string, id: string, data: Partial<{ title: string; due_at: string | null; done: boolean }>) =>
    request<Milestone>(`/projects/${lab}/milestones/${id}`, { method: "PATCH", body: json(data) }, write()),
  deleteMilestone: (lab: string, id: string) => request<unknown>(`/projects/${lab}/milestones/${id}`, { method: "DELETE" }, write()),

  team: (lab: string) => request<TeamInfo>(`/projects/${lab}/team`, {}, authed),
  join: (lab: string, message?: string) => request<{ message: string }>(`/projects/${lab}/join`, { method: "POST", body: json({ message }) }, write("Sending your request")),
  answer: (lab: string, requestId: string, accept: boolean) =>
    request<{ message: string }>(`/projects/${lab}/requests/${requestId}/${accept ? "accept" : "decline"}`, { method: "POST" }, write()),
  removeMember: (lab: string, username: string) => request<{ message: string }>(`/projects/${lab}/members/${encodeURIComponent(username)}`, { method: "DELETE" }, write()),
};

// --- Alfred's brain -------------------------------------------------------------------------

export type PetStatus = { available: boolean; enabled_by_member: boolean; remaining_today: number; daily_limit: number; tour_done: boolean };

export const petApi = {
  status: () => request<PetStatus>("/pet/status", {}, authed),
  tourDone: () => request<{ tour_done: boolean }>("/pet/tour-done", { method: "POST" }, authed),
  // What the member typed, plus the page they are on. Nothing else is sent.
  brain: (text: string, page: string, history: { from: "you" | "alfred"; text: string }[] = []) =>
    request<{ reply: string; intent: unknown; remaining_today: number }>("/pet/brain", { method: "POST", body: json({ text, page, history }) }, { auth: true, activity: false }),

  // What Alfred did for the member, and taking it back.
  actions: () => request<{ actions: PetActionItem[]; undo_window_minutes: number }>("/pet/actions", {}, authed),
  logAction: (data: { kind: "vote" | "readall"; summary: string; payload: Record<string, unknown> }) =>
    request<PetActionItem>("/pet/actions", { method: "POST", body: json(data) }, { auth: true, activity: false }),
  undo: (id: string) => request<{ message: string }>(`/pet/actions/${id}/undo`, { method: "POST" }, { auth: true, activity: false }),

  // Things the member asked Alfred to remember.
  memories: () => request<{ memories: { id: string; text: string; created_at: string }[]; max: number }>("/pet/memory", {}, authed),
  addMemory: (text: string) => request<{ id: string; text: string }>("/pet/memory", { method: "POST", body: json({ text }) }, { auth: true, activity: false }),
  forget: (id: string) => request<unknown>(`/pet/memory/${id}`, { method: "DELETE" }, { auth: true, activity: false }),
  forgetAll: () => request<{ forgotten: number }>("/pet/memory", { method: "DELETE" }, { auth: true, activity: false }),
};

export type PetActionItem = { id: string; kind: string; summary: string; created_at: string; undone: boolean; can_undo: boolean };

// --- announcements and event management -----------------------------------------------------

export type AnnouncementItem = { id: string; title: string; body: string; link: string | null; created_at: string; expires_at?: string | null };

export const announcementsApi = {
  active: () => request<{ announcements: AnnouncementItem[] }>("/announcements", {}, authed),
  all: () => request<{ announcements: AnnouncementItem[] }>("/announcements/all", {}, authed),
  create: (data: { title: string; body: string; link?: string; expires_at?: string }) =>
    request<AnnouncementItem>("/announcements", { method: "POST", body: json(data) }, { auth: true, activity: false }),
  remove: (id: string) => request<unknown>(`/announcements/${id}`, { method: "DELETE" }, { auth: true, activity: false }),
};

export type EventInput = { title: string; description: string; starts_at: string; ends_at?: string; location?: string; capacity?: number };

export const eventAdminApi = {
  create: (data: EventInput) => request<EventItem>("/events", { method: "POST", body: json(data) }, { auth: true, activity: false }),
  update: (id: string, data: Partial<EventInput>) => request<EventItem>(`/events/${id}`, { method: "PATCH", body: json(data) }, { auth: true, activity: false }),
  remove: (id: string) => request<unknown>(`/events/${id}`, { method: "DELETE" }, { auth: true, activity: false }),
};

// --- rewards --------------------------------------------------------------------------------

export type EarnedBadge = { key: string; title: string; description: string; symbol: string; awarded_at: string };
export type BadgeStatus = { key: string; title: string; description: string; symbol: string; earned: boolean; awarded_at: string | null };
export type Quest = { key: string; title: string; description: string; goal: number; points: number; progress: number; complete: boolean; claimed: boolean; resets_at: string };

export type WeeklyChallenge = { key: string; title: string; description: string; goal: number; points: number; progress: number; complete: boolean; claimed: boolean };
export type Weekly = { week: string; challenges: WeeklyChallenge[]; bonus: { points: number; available: boolean; claimed: boolean }; resets_at: string };

export const rewardsApi = {
  weekly: () => request<Weekly>("/rewards/weekly", {}, authed),
  claimWeekly: (key: string) => request<{ claimed: boolean; points_awarded: number }>(`/rewards/weekly/${encodeURIComponent(key)}/claim`, { method: "POST" }, { auth: true, activity: false }),
  badges: () => request<{ badges: BadgeStatus[] }>("/rewards/badges", {}, authed),
  quest: () => request<Quest>("/rewards/quest", {}, authed),
  claim: () => request<{ claimed: boolean; points_awarded: number }>("/rewards/quest/claim", { method: "POST" }, { auth: true, activity: false }),
};

// --- search ---------------------------------------------------------------------------------

export type SearchResults = {
  q: string;
  labs: { id: string; name: string; slug: string; short_description: string; category: string; vote_count: number; user: { username: string } }[];
  people: { username: string; full_name: string; avatar_url: string | null; points: number }[];
  posts: { id: string; title: string; excerpt: string; created_at: string; space: { name: string; slug: string }; author: string }[];
  lessons: { slug: string; title: string; summary: string; track: { slug: string; title: string } }[];
  events: { id: string; title: string; starts_at: string; location: string | null }[];
};

export const searchApi = { find: (q: string) => request<SearchResults>(`/search${qs({ q })}`, {}, authed) };

// --- admin: analytics and Learn content -------------------------------------------------------

export type DayPoint = { day: string; count: number };
export type Analytics = {
  days: number;
  signups: DayPoint[];
  active_members: DayPoint[];
  labs_started: DayPoint[];
  posts: DayPoint[];
  messages: DayPoint[];
  votes: DayPoint[];
  adoption: { users: number; started_a_lab_pct: number; voted_pct: number; finished_a_lesson_pct: number; posted_or_commented_pct: number };
};
export type AdminTrack = { id: string; slug: string; title: string; description: string; published: boolean; position: number; lessons: { id: string; slug: string; title: string; summary: string; minutes: number; position: number }[] };
export type AdminLesson = { id: string; track_id: string; slug: string; title: string; summary: string; body: string; minutes: number; position: number };

export const adminContentApi = {
  analytics: (days = 30) => request<Analytics>(`/admin/analytics${qs({ days })}`, {}, authed),
  tracks: () => request<{ tracks: AdminTrack[] }>("/admin/learn/tracks", {}, authed),
  lesson: (id: string) => request<AdminLesson>(`/admin/learn/lessons/${id}`, {}, authed),
  createTrack: (data: { slug: string; title: string; description: string; published?: boolean }) => request<AdminTrack>("/admin/learn/tracks", { method: "POST", body: json(data) }, write()),
  updateTrack: (id: string, data: Partial<{ slug: string; title: string; description: string; published: boolean; position: number }>) => request<AdminTrack>(`/admin/learn/tracks/${id}`, { method: "PATCH", body: json(data) }, write()),
  deleteTrack: (id: string) => request<unknown>(`/admin/learn/tracks/${id}`, { method: "DELETE" }, write()),
  createLesson: (trackId: string, data: { slug: string; title: string; summary: string; body: string; minutes?: number }) => request<AdminLesson>(`/admin/learn/tracks/${trackId}/lessons`, { method: "POST", body: json(data) }, write()),
  updateLesson: (id: string, data: Partial<{ slug: string; title: string; summary: string; body: string; minutes: number; position: number }>) => request<AdminLesson>(`/admin/learn/lessons/${id}`, { method: "PATCH", body: json(data) }, write()),
  deleteLesson: (id: string) => request<unknown>(`/admin/learn/lessons/${id}`, { method: "DELETE" }, write()),
};

export type ReviewImage = {
  id: string;
  status: "pending" | "approved" | "rejected";
  url: string;
  width: number;
  height: number;
  caption: string;
  lab: { name: string; slug: string } | null;
  sender: { id: string; username: string; avatar_url: string | null; created_at: string };
  escalated: boolean;
  created_at: string;
};
export const imageReviewApi = {
  list: (status: "pending" | "approved" | "rejected" = "pending") => request<{ attachments: ReviewImage[] }>(`/admin/attachments${qs({ status })}`, {}, authed),
  review: (id: string, data: { action: "approve" | "reject"; note?: string; escalate?: boolean; suspend_days?: number }) =>
    request<{ message: string }>(`/admin/attachments/${id}/review`, { method: "POST", body: json(data) }, { auth: true, activity: false }),
};

export type ApplicationStatus = "submitted" | "under_review" | "shortlisted" | "waitlisted" | "accepted" | "declined" | "withdrawn";
export type ApplicationSummary = {
  id: string;
  reference: string;
  status: ApplicationStatus;
  full_name: string;
  age: number;
  country: string;
  submitted_at: string | null;
  claimed_by: string | null;
  window_id: string;
};
export type ApplicationAnswer = { id: string; position: number; question: string; source: string; criterion: string | null; answer: string };
export type ApplicationAttachment = { id: string; kind: "image" | "link"; url: string; filename: string | null; scan_status: string };
export type ApplicationClarification = { id: string; question: string; response: string | null; status: "open" | "answered"; due_at: string };
export type ApplicationReview = { id: string; reviewer_id: string; kind: "first" | "second"; scores: Record<string, number | null>; weighted_score: number | null; recommendation: string; note: string | null; submitted_at: string | null };
export type ApplicationDetail = ApplicationSummary & {
  email: string; whatsapp: string; city: string; school: string | null; education_level: string;
  interests: string[]; skill_level: string | null; skill_level_note: string | null;
  current_skills: string[]; learning_goals: string[];
  portfolio_url: string | null; github_url: string | null; linkedin_url: string | null;
  second_reviewer_id: string | null; decided_by: string | null; decision_note: string | null;
  answers: ApplicationAnswer[]; attachments: ApplicationAttachment[]; clarifications: ApplicationClarification[];
  reviews: ApplicationReview[]; reviews_disagree: boolean | null; criteria: string[];
  rubric?: ApplicationRubric;
};
export type ApplicationRubric = {
  weights: Record<string, number>;
  criteria: Record<string, { title: string; lookFor: string; examples: string[]; notThis: string }>;
  ratings: { rating: number; label: string; meaning: string }[];
  insufficient_evidence: string;
};

export type CriterionEvidence = {
  criterion: string;
  title: string;
  evidence: { position: number; quote: string }[];
  explanation: string;
  gap: string | null;
  suggested_rating: number | null;
};
export type ApplicationEvidence = {
  criteria: CriterionEvidence[];
  suggestions_visible: boolean;
  suggestions_hidden_until_review: boolean;
  machine_written: true;
  notice: string;
};

export const admissionsAdminApi = {
  list: (filters: { status?: string; window_id?: string; claimed?: "mine" | "none"; page?: number }) =>
    request<Paged<ApplicationSummary>>(`/admin/applications${qs(filters)}`, {}, authed),
  stats: (window_id?: string) => request<{ counts: Record<string, number>; unclaimed: number }>(`/admin/applications/stats${qs({ window_id })}`, {}, authed),
  get: (id: string) => request<ApplicationDetail>(`/admin/applications/${id}`, {}, authed),
  evidence: (id: string) => request<ApplicationEvidence>(`/admin/applications/${id}/evidence`, { method: "POST" }, write()),
  summarise: (id: string) => request<{ summary: string; machine_written: true; notice: string }>(`/admin/applications/${id}/summary`, { method: "POST" }, write()),
  claim: (id: string) => request<{ message: string }>(`/admin/applications/${id}/claim`, { method: "POST" }, write()),
  review: (id: string, data: { scores: Record<string, number | null>; recommendation: string; note?: string | null }) =>
    request<{ id: string; weighted_score: number | null; message: string }>(`/admin/applications/${id}/review`, { method: "POST", body: json(data) }, write()),
  assignSecondReviewer: (id: string, reviewer_id: string) =>
    request<{ message: string }>(`/admin/applications/${id}/second-review`, { method: "POST", body: json({ reviewer_id }) }, write()),
  decide: (id: string, data: { decision: string; note?: string | null; feedback?: string | null }) =>
    request<{ message: string }>(`/admin/applications/${id}/decision`, { method: "POST", body: json(data) }, write()),
  reverse: (id: string, data: { decision: string; reason: string }) =>
    request<{ message: string }>(`/admin/applications/${id}/reverse`, { method: "POST", body: json(data) }, write()),
  askClarification: (id: string, question: string) =>
    request<{ id: string; due_at: string }>(`/admin/applications/${id}/clarification`, { method: "POST", body: json({ question }) }, write()),
  reviewerLink: (id: string, attId: string) => request<{ url: string }>(`/admin/applications/${id}/attachments/${attId}/link`, {}, authed),
};

export type Cohort = {
  id: string;
  opens_at: string;
  closes_at: string;
  decisions_publish_at: string;
  target_size: number | null;
  note: string | null;
  state: "upcoming" | "open" | "closed";
  released: boolean;
  applications?: Record<string, number>;
};
export const cohortsApi = {
  list: () => request<{ items: Cohort[] }>("/admin/cohorts", {}, authed),
  create: (data: { opens_at: string; closes_at: string; decisions_publish_at: string; target_size?: number | null; note?: string | null }) =>
    request<Cohort>("/admin/cohorts", { method: "POST", body: json(data) }, write()),
  update: (id: string, data: Partial<{ opens_at: string; closes_at: string; decisions_publish_at: string; target_size: number | null; note: string | null }>) =>
    request<Cohort>(`/admin/cohorts/${id}`, { method: "PATCH", body: json(data) }, write()),
  release: (id: string, allow_undecided?: boolean) =>
    request<{ released: number; invited: number; still_under_review: number }>(`/admin/cohorts/${id}/release`, { method: "POST", body: json({ allow_undecided }) }, write()),
};

export type OnboardingStep = { key: string; title: string; required: boolean; link: string | null; done: boolean; self_reported: boolean };
export type OnboardingState = { status: string; due_at: string | null; overdue: boolean; steps: OnboardingStep[]; complete: boolean };
export const onboardingApi = {
  get: () => request<OnboardingState>("/onboarding", {}, authed),
  confirmStep: (step: string) => request<OnboardingState>(`/onboarding/steps/${step}`, { method: "POST" }, write()),
  extend: (id: string, data: { days: number; reason: string }) =>
    request<{ onboarding_due_at: string }>(`/admin/onboarding/${id}/extend`, { method: "POST", body: json(data) }, write()),
};

export type MembershipStatus = "onboarding" | "active" | "on_leave" | "inactive" | "alumni" | "removed";
export type MemberRow = { id: string; username: string; membership_status: MembershipStatus; status_changed_at: string; last_login_at: string | null };
export type InactivityCandidate = { id: string; username: string; status: MembershipStatus; last_seen: string; under_review: boolean };
export type InactivityReview = { id: string; user_id: string; username: string; reason: string; response_due_at: string; overdue: boolean; member_response: string | null; responded_at: string | null };

export const membershipAdminApi = {
  members: (status?: string) => request<{ items: MemberRow[] }>(`/admin/members${qs({ status })}`, {}, authed),
  inactivity: (days?: number) => request<{ days: number; items: InactivityCandidate[] }>(`/admin/members/inactivity${qs({ days })}`, {}, authed),
  setStatus: (id: string, data: { status: MembershipStatus; reason: string }) =>
    request<{ status: string }>(`/admin/members/${id}/status`, { method: "POST", body: json(data) }, write()),
  reviews: () => request<{ items: InactivityReview[] }>("/admin/inactivity-reviews", {}, authed),
  startReview: (id: string, data: { reason: string; days?: number }) =>
    request<{ id: string; response_due_at: string }>(`/admin/members/${id}/inactivity-review`, { method: "POST", body: json(data) }, write()),
  decideReview: (id: string, data: { decision: "active" | "on_leave" | "alumni" | "removed"; reason: string }) =>
    request<{ decision: string }>(`/admin/members/${id}/inactivity-review/decide`, { method: "POST", body: json(data) }, write()),
};

export const membershipApi = {
  myReview: () => request<{ review: { id: string; response_due_at: string; responded: boolean } | null }>("/membership/review", {}, authed),
  respond: (message: string) => request<{ ok: boolean }>("/membership/review/respond", { method: "POST", body: json({ message }) }, write()),
};

export type BadgeTier = "standard" | "high" | "top";
export type BadgeDefinition = {
  id: string; slug: string; name: string; description: string; tier: BadgeTier; criteria_text: string;
  image_kind: string | null; image_url: string | null; fallback_url: string | null; active: boolean; repeatable: boolean; awards: number;
};

export const badgesAdminApi = {
  list: () => request<{ items: BadgeDefinition[] }>("/admin/badges", {}, authed),
  create: (data: { slug: string; name: string; description: string; tier?: BadgeTier; criteria_text: string; repeatable?: boolean }) =>
    request<BadgeDefinition>("/admin/badges", { method: "POST", body: json(data) }, write()),
  update: (id: string, data: Partial<{ name: string; description: string; tier: BadgeTier; criteria_text: string; active: boolean; repeatable: boolean }>) =>
    request<BadgeDefinition>(`/admin/badges/${id}`, { method: "PATCH", body: json(data) }, write()),
  uploadImage: (id: string, file: File) => {
    const form = new FormData();
    form.append("image", file);
    return request<BadgeDefinition>(`/admin/badges/${id}/image`, { method: "POST", body: form }, write());
  },
  award: (id: string, data: { user_id: string; reason: string; challenge_id?: string }) =>
    request<{ id: string; badge: BadgeDefinition; awarded_at: string }>(`/admin/badges/${id}/award`, { method: "POST", body: json(data) }, write()),
  revoke: (awardId: string, reason: string) =>
    request<{ revoked: boolean }>(`/admin/badge-awards/${awardId}/revoke`, { method: "POST", body: json({ reason }) }, write()),
};

export type PointRule = { key: string; points: number; daily_cap: number | null; description: string; customised: boolean };
export type Season = { id: string; number: number; name: string; starts_at: string; ends_at: string | null; is_current: boolean; archived_members?: number };

export const pointRulesApi = {
  list: () => request<{ items: PointRule[] }>("/admin/point-rules", {}, authed),
  update: (key: string, data: { points?: number; daily_cap?: number | null }) =>
    request<PointRule>(`/admin/point-rules/${key}`, { method: "PATCH", body: json(data) }, write()),
  reset: (key: string) => request<PointRule>(`/admin/point-rules/${key}`, { method: "PATCH", body: json({ reset: true }) }, write()),
};

export const seasonsApi = {
  list: () => request<{ items: Season[] }>("/admin/seasons", {}, authed),
  totals: (id: string) => request<{ items: { rank: number; username: string; points: number }[] }>(`/admin/seasons/${id}/totals`, {}, authed),
  start: (data: { confirm: true; name?: string }) =>
    request<{ ended: Season; current: Season; archived_members: number }>("/admin/seasons/start", { method: "POST", body: json(data) }, write()),
};

export type ChallengeKind = "weekly" | "monthly" | "special";
export type ChallengeStatus = "draft" | "open" | "judging" | "closed";
export type ChallengeCriterion = { name: string; weight: number };
export type Challenge = {
  id: string; title: string; description: string; rules: string; kind: ChallengeKind; status: ChallengeStatus;
  starts_at: string; ends_at: string; judging_ends_at: string; criteria: ChallengeCriterion[];
  badge_id: string | null; entry_limit: number; results_published: boolean;
};
export type ChallengeEntry = { id: string; title: string; body: string; links: string[]; status: string; submitted_at: string };
export type ChallengeInput = {
  title: string; description: string; rules: string; kind: ChallengeKind; starts_at: string; ends_at: string; judging_ends_at: string;
  criteria: ChallengeCriterion[]; badge_id?: string | null; entry_limit?: number;
};

export const challengesApi = {
  list: () => request<{ items: (Challenge & { my_entries: number; accepting_entries: boolean })[] }>("/challenges", {}, authed),
  get: (id: string) =>
    request<Challenge & {
      accepting_entries: boolean; my_entries: ChallengeEntry[]; my_results: { entry_id: string; place: number }[];
      podium: { place: number; username: string | null; avatar_url: string | null; entry_title: string }[];
    }>(`/challenges/${id}`, {}, authed),
  submit: (id: string, data: { title: string; body: string; links?: string[] }) =>
    request<ChallengeEntry>(`/challenges/${id}/entries`, { method: "POST", body: json(data) }, write()),
  edit: (entryId: string, data: { title?: string; body?: string; links?: string[] }) =>
    request<ChallengeEntry>(`/challenges/entries/${entryId}`, { method: "PATCH", body: json(data) }, write()),
  withdraw: (entryId: string) => request<{ ok: boolean }>(`/challenges/entries/${entryId}`, { method: "DELETE" }, write()),
};

export const challengesAdminApi = {
  list: () => request<{ items: (Challenge & { entries: number })[] }>("/admin/challenges", {}, authed),
  create: (data: ChallengeInput) => request<Challenge>("/admin/challenges", { method: "POST", body: json(data) }, write()),
  update: (id: string, data: Partial<ChallengeInput>) => request<Challenge>(`/admin/challenges/${id}`, { method: "PATCH", body: json(data) }, write()),
  advance: (id: string, to: "open" | "judging") => request<Challenge>(`/admin/challenges/${id}/status`, { method: "POST", body: json({ to }) }, write()),
  disqualify: (id: string, entryId: string, reason: string) =>
    request<{ ok: boolean }>(`/admin/challenges/${id}/entries/${entryId}/disqualify`, { method: "POST", body: json({ reason }) }, write()),
  entries: (id: string) =>
    request<{
      criteria: ChallengeCriterion[];
      items: { id: string; title: string; body: string; links: string[]; own_entry: boolean; my_score: { scores: Record<string, number>; total: number; note: string | null } | null }[];
    }>(`/admin/challenges/${id}/entries`, {}, authed),
  standings: (id: string) =>
    request<{ unscored_entries: number; items: { entry_id: string; title: string; place: number; average: number; judges: number }[] }>(`/admin/challenges/${id}/standings`, {}, authed),
  score: (id: string, entryId: string, data: { scores: Record<string, number>; note?: string }) =>
    request<{ total: number }>(`/admin/challenges/${id}/entries/${entryId}/score`, { method: "PUT", body: json(data) }, write()),
  publish: (id: string) => request<{ published?: boolean; already_published?: boolean }>(`/admin/challenges/${id}/publish-results`, { method: "POST" }, write()),
};

export type PairingStatus = "proposed" | "active" | "closed" | "cancelled";
export type Pairing = {
  id: string; kind: "pair" | "trio"; goal: string; rationale: string | null; status: PairingStatus; supervised: boolean;
  supervisor_id: string | null; starts_on: string | null; ends_on: string; created_by: string; approved_by: string | null;
  second_approved_by: string | null; closed_reason: string | null; members: { id: string; username: string }[];
};
export type PairingSuggestion = {
  id: string; username: string; band: string; score: number;
  shared_interests: string[]; shared_skills: string[]; they_can_help_with: string[]; you_can_help_with: string[];
};

export const pairingAdminApi = {
  list: (status?: PairingStatus) => request<{ items: Pairing[] }>(`/admin/pairings${status ? `?status=${status}` : ""}`, {}, authed),
  suggestions: (memberId: string) =>
    request<{ member: { id: string; username: string; band: string }; items: PairingSuggestion[] }>(`/admin/pairing/suggestions?member_id=${memberId}`, {}, authed),
  create: (data: { member_ids: string[]; goal: string; rationale?: string; ends_on: string; supervisor_id?: string }) =>
    request<Pairing>("/admin/pairings", { method: "POST", body: json(data) }, write()),
  approve: (id: string) => request<Pairing>(`/admin/pairings/${id}/approve`, { method: "POST" }, write()),
  close: (id: string, reason: string) => request<Pairing>(`/admin/pairings/${id}/close`, { method: "POST", body: json({ reason }) }, write()),
  setClearance: (memberId: string, cleared: boolean, note?: string) =>
    request<{ cleared: boolean }>(`/admin/members/${memberId}/safeguarding-clearance`, { method: "POST", body: json({ cleared, note }) }, write()),
};

export const pairingApi = {
  mine: () =>
    request<{ items: { id: string; goal: string; ends_on: string; supervised: boolean; partners: { username: string }[]; conversation_id: string | null }[] }>("/pairings/mine", {}, authed),
};
