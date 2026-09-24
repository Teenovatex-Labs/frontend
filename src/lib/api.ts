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
};

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

function setTokens(tokens: { access_token: string; refresh_token?: string }) {
  accessToken = tokens.access_token;
  if (tokens.refresh_token && typeof window !== "undefined") {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
  }
}

function clearTokens() {
  accessToken = null;
  if (typeof window !== "undefined") window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}

async function tryRefresh(): Promise<boolean> {
  const refresh_token = getRefreshToken();
  if (!refresh_token) return false;

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token }),
  });
  if (!res.ok) return false;

  const data = (await res.json()) as { access_token: string };
  accessToken = data.access_token;
  return true;
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  opts: { auth?: boolean; retry?: boolean } = {}
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (opts.auth && accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });

  if (res.status === 401 && opts.auth && opts.retry !== false) {
    const refreshed = await tryRefresh();
    if (refreshed) return request<T>(path, init, { ...opts, retry: false });
  }

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(body?.error ?? "Something went wrong", body?.code ?? "UNKNOWN", res.status);
  }
  return body as T;
}

export const authApi = {
  register: async (data: { full_name: string; username: string; email: string; password: string }) => {
    const result = await request<AuthResponse & { message: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
    setTokens(result);
    return result;
  },

  login: async (data: { email: string; password: string }) => {
    const result = await request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
    setTokens(result);
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
    } finally {
      clearTokens();
    }
  },

  me: () => request<UserProfile>("/users/me", {}, { auth: true }),

  // Restores a session on page load from the persisted refresh token
  // (access tokens only ever live in memory, so they don't survive a reload).
  bootstrapFromRefreshToken: () => tryRefresh(),
};
