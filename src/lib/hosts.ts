// The landing site (teenovatex.org) and the signed-in app (app.teenovatex.org)
// are different origins, so a link from one to the other must be absolute.
// Both env vars are empty everywhere except production (and previews that opt
// in), which keeps local dev and preview deploys working on a single origin.
const trim = (s: string) => s.replace(/\/$/, "");

export const APP_ORIGIN = trim(process.env.NEXT_PUBLIC_APP_ORIGIN ?? "");
export const SITE_ORIGIN = trim(process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "");

export const appUrl = (path: string) => `${APP_ORIGIN}${path}`;
export const siteUrl = (path: string) => `${SITE_ORIGIN}${path}`;

// ---------------------------------------------------------------------------
// Host registry. One Next.js project serves every audience; each audience
// ("surface") gets its own subdomain and a route prefix inside the app/ folder.
// Adding a surface means adding one row here and (when its pages exist) setting
// `enabled: true`. Nothing in middleware.ts needs to change.
// This file has no Next or React imports so `node --test` can run it.
// ---------------------------------------------------------------------------

export const ROOT_DOMAIN = "teenovatex.org";

export type SurfaceId = "landing" | "app" | "admin" | "tutor" | "partner";

export interface Surface {
  id: SurfaceId;
  /** Exact hostnames (landing) or the subdomain label (everything else). */
  hosts: string[];
  /** Route folder this host serves, or "" when the host serves the root. */
  prefix: string;
  /** Roles whose home is this surface. */
  roles: string[];
  /** False until the pages exist; a disabled surface is never routed to. */
  enabled: boolean;
}

export const SURFACES: Surface[] = [
  { id: "landing", hosts: [ROOT_DOMAIN, `www.${ROOT_DOMAIN}`], prefix: "", roles: [], enabled: true },
  { id: "app", hosts: ["app"], prefix: "", roles: ["member", "mentor"], enabled: true },
  { id: "admin", hosts: ["admin"], prefix: "/admin", roles: ["moderator", "admin"], enabled: true },
  // Placeholders. Flip `enabled` in the issue that builds the host shell
  // (frontend #27 for tutors, #34 for partners).
  { id: "tutor", hosts: ["tutors"], prefix: "/tutor", roles: ["tutor"], enabled: false },
  { id: "partner", hosts: ["partners"], prefix: "/partner", roles: ["partner"], enabled: false },
];

// Public pages the landing host serves itself instead of sending to the app host.
const LANDING_OWN = /^\/(apply|consent)(\/|$)/;
// Pages that move to the app host when opened on the landing host.
const LANDING_TO_APP = /^\/(home|auth|login|signup)(\/|$)/;
// Sign-in screens exist on every host (tokens are stored per origin).
const SHARED = /^\/(auth|login)(\/|$)/;

export type HostAction =
  | { type: "next" }
  | { type: "redirect"; to: string; status: 307 | 308 }
  | { type: "rewrite"; to: string };

/** Which surface a hostname belongs to; null for localhost, previews, unknown hosts. */
export function surfaceForHost(hostname: string): Surface | null {
  const host = hostname.toLowerCase().split(":")[0];
  for (const s of SURFACES) {
    if (s.id === "landing") {
      if (s.hosts.includes(host)) return s;
    } else if (s.enabled && host.startsWith(`${s.hosts[0]}.`)) {
      return s;
    }
  }
  return null;
}

/** Absolute origin of a surface in production. */
export const originOf = (s: Surface) =>
  s.id === "landing" ? `https://${ROOT_DOMAIN}` : `https://${s.hosts[0]}.${ROOT_DOMAIN}`;

/**
 * Decide what to do with a request. `search` includes the leading "?".
 * Localhost and Vercel previews never match a surface, so they stay
 * single-origin and path-based exactly as before.
 */
export function resolveHost(hostname: string, pathname: string, search = ""): HostAction {
  const surface = surfaceForHost(hostname);
  const app = SURFACES.find((s) => s.id === "app")!;

  // /dashboard was renamed /home; keep old links working on every host.
  if (/^\/dashboard(\/|$)/.test(pathname)) {
    const moved = pathname.replace(/^\/dashboard/, "/home") + search;
    return surface?.id === "landing"
      ? { type: "redirect", to: originOf(app) + moved, status: 308 }
      : { type: "redirect", to: moved, status: 308 };
  }

  if (surface?.id === "landing") {
    if (LANDING_OWN.test(pathname)) return { type: "next" };
    if (LANDING_TO_APP.test(pathname)) {
      return { type: "redirect", to: originOf(app) + pathname + search, status: 308 };
    }
    return { type: "next" };
  }

  if (surface?.id === "app") {
    if (pathname === "/") return { type: "redirect", to: "/home" + search, status: 307 };
    // A path that belongs to another enabled surface goes to that surface's host.
    for (const other of SURFACES) {
      if (other.enabled && other.prefix && (pathname === other.prefix || pathname.startsWith(other.prefix + "/"))) {
        return { type: "redirect", to: originOf(other) + pathname + search, status: 307 };
      }
    }
    return { type: "next" };
  }

  if (surface && surface.prefix) {
    if (SHARED.test(pathname)) return { type: "next" };
    // Already prefixed (existing in-app links such as /admin/applications).
    if (pathname === surface.prefix || pathname.startsWith(surface.prefix + "/")) return { type: "next" };
    return { type: "rewrite", to: surface.prefix + (pathname === "/" ? "" : pathname) + search };
  }

  return { type: "next" };
}
