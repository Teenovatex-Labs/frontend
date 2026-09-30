import { NextResponse, type NextRequest } from "next/server";

// One Next.js project serves three origins:
//   teenovatex.org        the landing site
//   app.teenovatex.org    the signed-in app (and its auth screens)
//   admin.teenovatex.org  reserved for the admin console
// Only the production landing hosts redirect across origins, so localhost and
// Vercel preview URLs keep working as a single origin.
const SITE_HOSTS = new Set(["teenovatex.org", "www.teenovatex.org"]);
const APP_ORIGIN = "https://app.teenovatex.org";
const APP_PATHS = /^\/(home|auth|login|signup)(\/|$)/;

export function middleware(req: NextRequest) {
  const hostname = (req.headers.get("host") ?? "").toLowerCase().split(":")[0];
  const { pathname, search } = req.nextUrl;

  // /dashboard was renamed /home; keep old links working on every host.
  if (/^\/dashboard(\/|$)/.test(pathname)) {
    const moved = pathname.replace(/^\/dashboard/, "/home");
    return SITE_HOSTS.has(hostname)
      ? NextResponse.redirect(`${APP_ORIGIN}${moved}${search}`, 308)
      : NextResponse.redirect(new URL(`${moved}${search}`, req.url), 308);
  }

  if (SITE_HOSTS.has(hostname) && APP_PATHS.test(pathname)) {
    return NextResponse.redirect(`${APP_ORIGIN}${pathname}${search}`, 308);
  }

  if (hostname.startsWith("app.") && pathname === "/") {
    return NextResponse.redirect(new URL("/home", req.url), 307);
  }

  if (hostname.startsWith("admin.") && pathname === "/") {
    return NextResponse.rewrite(new URL("/admin", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|assets/|doodles/|founders/|story/|.*\\..*).*)"],
};
