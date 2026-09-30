import { alfredController } from "@/lib/alfred";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
const REFRESH_TOKEN_KEY = "tx_refresh_token";

let accessToken: string | null = null;

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(message: string, code: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export type AuthUser = { id: string; username: string; avatar_url?: string | null; email?: string };
export type AuthResponse = { access_token: string; refresh_token: string; user: AuthUser };
export type UserProfile = {
  id: string;
  username: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  points: number;
  rank?: number;
  streak: number;
  social_links: Record<string, string> | null;
  created_at: string;
  // Whether the account has a password set / is linked to Google — not
  // mutually exclusive. A Google-only account (has_google, !has_password)
  // is the one that should be prompted to add a password.
  has_password: boolean;
  has_google: boolean;
  // YYYY-MM-DD, or null for an account that hasn't confirmed its age yet.
  birth_date: string | null;
  age_confirmed: boolean;
  // False for a Google sign-up that hasn't picked a username yet (it has a placeholder).
  username_set: boolean;
  timezone: string | null;
  role: "member" | "mentor" | "moderator" | "admin";
  suspended_until: string | null;
  suspended_reason: string | null;
  settings: { email_notifications: boolean; vote_alerts: boolean; contest_updates: boolean; public_profile: boolean } | null;
};

// "Remember me" decides *where* the refresh token lives: localStorage
// survives closing the browser (a returning visit skips the login form
// entirely), sessionStorage clears the moment the tab/browser closes. Both
// are checked on read so a token written under either policy is honored.
function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY) ?? window.sessionStorage.getItem(REFRESH_TOKEN_KEY);
}

function setTokens(tokens: { access_token: string; refresh_token?: string }, remember = true) {
  accessToken = tokens.access_token;
  if (tokens.refresh_token && typeof window !== "undefined") {
    const store = remember ? window.localStorage : window.sessionStorage;
    const other = remember ? window.sessionStorage : window.localStorage;
    store.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
    other.removeItem(REFRESH_TOKEN_KEY);
  }
}

function clearTokens() {
  accessToken = null;
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
    window.sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

async function tryRefresh(): Promise<boolean> {
  const refresh_token = getRefreshToken();
  if (!refresh_token) return false;

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token }),
    });
    if (!res.ok) return false;

    const data = (await res.json()) as { access_token: string };
    accessToken = data.access_token;
    return true;
  } catch {
    // API unreachable: treat as "not signed in" so AuthProvider still
    // finishes loading instead of hanging on an unhandled rejection.
    return false;
  }
}

// Alfred only reacts to work you can feel: a write (or anything explicitly labelled) that is still
// going after a moment. Quick calls and background reads never make him move.
const ACTIVITY_DELAY_MS = 700;

export async function request<T>(
  path: string,
  init: RequestInit = {},
  opts: { auth?: boolean; retry?: boolean; activity?: string | false } = {}
): Promise<T> {
  const method = (init.method ?? "GET").toUpperCase();
  const label = opts.activity === false ? null : opts.activity ?? (method === "GET" ? null : apiActivityLabel(path, method));

  let task: ReturnType<typeof alfredController.beginTask> | null = null;
  const timer = label ? setTimeout(() => (task = alfredController.beginTask(label)), ACTIVITY_DELAY_MS) : undefined;
  try {
    const result = await performRequest<T>(path, init, opts);
    clearTimeout(timer);
    (task as ReturnType<typeof alfredController.beginTask> | null)?.done();
    return result;
  } catch (error) {
    clearTimeout(timer);
    // A failure is worth showing even if it came back quickly, but only for things he was tracking.
    const failing = task ?? (label ? alfredController.beginTask(label) : null);
    failing?.fail(error instanceof ApiError ? error.message : "I couldn’t reach the service.");
    throw error;
  }
}

async function performRequest<T>(
  path: string,
  init: RequestInit,
  opts: { auth?: boolean; retry?: boolean; activity?: string | false }
): Promise<T> {
  const headers = new Headers(init.headers);
  // FormData sets its own multipart boundary; forcing JSON here would break uploads.
  if (!(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (opts.auth && accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });

  if (res.status === 401 && opts.auth && opts.retry !== false) {
    const refreshed = await tryRefresh();
    if (refreshed) return performRequest<T>(path, init, { ...opts, retry: false });
  }

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(body?.error ?? "Something went wrong", body?.code ?? "UNKNOWN", res.status);
  }
  return body as T;
}

function apiActivityLabel(path: string, method: string): string {
  const labels: Record<string, string> = {
    "/auth/register": "Creating your account",
    "/auth/verify-email": "Verifying your email",
    "/auth/resend-verification": "Resending your code",
    "/auth/login": "Signing in",
    "/auth/google": "Signing in with Google",
    "/auth/logout": "Signing out",
    "/auth/forgot-password": "Sending a reset code",
    "/auth/verify-reset-code": "Checking your reset code",
    "/auth/reset-password": "Updating your password",
    "/users/me": "Loading your profile",
    "/settings/password": "Updating your password",
    "/contact": "Sending your message",
  };
  if (path === "/notifications" && method === "GET") return "Checking your updates";
  return labels[path] ?? "Working on your request";
}

export const authApi = {
  // No tokens yet — the account exists but is unverified until the code
  // from verifyEmail() is confirmed.
  register: (data: {
    full_name: string;
    username: string;
    email: string;
    password: string;
    birth_date: string;
    timezone?: string;
  }) =>
    request<{ message: string; email: string; require_verification: boolean }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  verifyEmail: async (data: { email: string; code: string }) => {
    const result = await request<AuthResponse>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify(data),
    });
    setTokens(result);
    return result;
  },

  resendVerification: (email: string) =>
    request<{ message: string }>("/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  login: async (data: { email: string; password: string }, remember = true) => {
    const result = await request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
    setTokens(result, remember);
    return result;
  },

  google: async (id_token: string) => {
    const result = await request<AuthResponse>("/auth/google", {
      method: "POST",
      body: JSON.stringify({ id_token }),
    });
    setTokens(result);
    return result;
  },

  logout: async () => {
    const refresh_token = getRefreshToken();
    try {
      await request("/auth/logout", { method: "POST", body: JSON.stringify({ refresh_token }) }, { auth: true });
    } catch {
      // Best-effort: the point of logging out is that the browser forgets
      // the session. If the access token was already expired/invalid (or
      // the server call fails for any other reason), there's nothing left
      // worth doing server-side that should block clearing local state —
      // an already-dead session doesn't need to be told it's dead.
    } finally {
      clearTokens();
    }
  },

  forgotPassword: (email: string) =>
    request<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  verifyResetCode: (data: { email: string; code: string }) =>
    request<{ token: string }>("/auth/verify-reset-code", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  resetPassword: (data: { token: string; new_password: string }) =>
    request<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  me: () => request<UserProfile>("/users/me", {}, { auth: true }),

  // Restores a session on page load from the persisted refresh token
  // (access tokens only ever live in memory, so they don't survive a reload).
  bootstrapFromRefreshToken: () => tryRefresh(),
};

export const settingsApi = {
  // Also doubles as "add a password": omit current_password when the
  // account doesn't have one yet (has_password === false) — the backend
  // only requires/checks it when a password_hash already exists.
  setPassword: (data: { current_password?: string; new_password: string }) =>
    request<{ message: string }>(
      "/settings/password",
      { method: "PATCH", body: JSON.stringify(data) },
      { auth: true }
    ),
};

export const contactApi = {
  // `website` is a honeypot — always empty for real people.
  send: (data: { name: string; email: string; topic: string; message: string; website?: string }) =>
    request<{ message: string }>("/contact", { method: "POST", body: JSON.stringify(data) }),
};

export type AppNotification = {
  id: string;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
};

export const notificationsApi = {
  list: () => request<AppNotification[]>("/notifications", {}, { auth: true, activity: false }),
};

export const usersApi = {
  // Age can be set once. Under 13 the account is deleted server-side and the
  // response carries `account_removed: true` (surfaced as ApiError code AGE_TOO_YOUNG).
  setBirthDate: (birth_date: string) =>
    request<{ message?: string }>(
      "/users/me/birth-date",
      { method: "POST", body: JSON.stringify({ birth_date }) },
      { auth: true }
    ),

  setUsername: (username: string) =>
    request<{ username: string }>(
      "/users/me/username",
      { method: "POST", body: JSON.stringify({ username }) },
      { auth: true }
    ),

  updateMe: (data: { timezone?: string }) =>
    request<unknown>("/users/me", { method: "PATCH", body: JSON.stringify(data) }, { auth: true, activity: false }),
};

export const uploadsApi = {
  avatar: (file: File) => {
    const form = new FormData();
    form.append("avatar", file);
    return request<{ avatar_url: string }>(
      "/users/me/avatar",
      { method: "POST", body: form },
      { auth: true, activity: "Uploading your photo" }
    );
  },
};
