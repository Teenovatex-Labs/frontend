import { NextResponse, type NextRequest } from "next/server";
import { resolveHost } from "@/lib/hosts";

// All host-to-surface routing lives in the registry in src/lib/hosts.ts.
export function middleware(req: NextRequest) {
  const hostname = req.headers.get("host") ?? "";
  const { pathname, search } = req.nextUrl;
  const action = resolveHost(hostname, pathname, search);

  if (action.type === "redirect") return NextResponse.redirect(new URL(action.to, req.url), action.status);
  if (action.type === "rewrite") return NextResponse.rewrite(new URL(action.to, req.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|assets/|doodles/|founders/|story/|.*\\..*).*)"],
};
