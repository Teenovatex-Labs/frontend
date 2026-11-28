// Roles and permissions, mirroring the backend's src/lib/permissions.ts.
// Screens ask "can this user do X?" with `can()`, never `role === "..."`, so a new role or
// permission is a change here instead of across every screen.
// The API is the source of truth: `can()` reads the `permissions` array it returns on login,
// refresh and /users/me. The static map below is only a fallback for when that array is
// missing (loading, logged out, or an older response). It never grants access by itself;
// the API enforces every permission again.
// This file has no Next/React imports and no "@/" aliases so `node --test` can run it.

export const ROLES = ["member", "mentor", "tutor", "partner", "moderator", "admin"] as const;
export type Role = (typeof ROLES)[number];

const STAFF_PERMISSIONS = [
  "staff.access",
  "reports.read",
  "reports.resolve",
  "users.read",
  "users.suspend",
  "audit.read",
  "attachments.review",
  "events.manage",
  "announcements.manage",
  "learn.manage",
  "analytics.read",
] as const;

const ADMIN_ONLY_PERMISSIONS = [
  "users.set_role",
  "settings.manage",
  "applications.review",
  "applications.window",
  "membership.manage",
  "points.manage",
  "badges.manage",
  "badges.award",
  "challenges.manage",
  "challenges.judge",
  "pairing.manage",
] as const;

export type Permission = (typeof STAFF_PERMISSIONS)[number] | (typeof ADMIN_ONLY_PERMISSIONS)[number];

export const FALLBACK_PERMISSIONS: Record<Role, readonly Permission[]> = {
  member: [],
  mentor: [],
  tutor: [],
  partner: [],
  moderator: STAFF_PERMISSIONS,
  admin: [...STAFF_PERMISSIONS, ...ADMIN_ONLY_PERMISSIONS],
};

/** The part of a user that permission checks need. `UserProfile` satisfies it. */
export interface RoleHolder {
  role: string;
  permissions?: readonly string[] | null;
}

const isRole = (r: unknown): r is Role => typeof r === "string" && (ROLES as readonly string[]).includes(r);

/** Moderators and admins: the people who may open the admin console. */
export function isStaff(role: string | null | undefined): boolean {
  return role === "moderator" || role === "admin";
}

/**
 * Whether the user holds a permission. Uses the API's `permissions` array when present;
 * otherwise falls back to the static map for the user's role. No user means no.
 */
export function can(user: RoleHolder | null | undefined, permission: Permission): boolean {
  if (!user) return false;
  if (Array.isArray(user.permissions)) return user.permissions.includes(permission);
  return isRole(user.role) ? FALLBACK_PERMISSIONS[user.role].includes(permission) : false;
}
