// The landing site (teenovatex.org) and the signed-in app (app.teenovatex.org)
// are different origins, so a link from one to the other must be absolute.
// Both env vars are empty everywhere except production (and previews that opt
// in), which keeps local dev and preview deploys working on a single origin.
const trim = (s: string) => s.replace(/\/$/, "");

export const APP_ORIGIN = trim(process.env.NEXT_PUBLIC_APP_ORIGIN ?? "");
export const SITE_ORIGIN = trim(process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "");

export const appUrl = (path: string) => `${APP_ORIGIN}${path}`;
export const siteUrl = (path: string) => `${SITE_ORIGIN}${path}`;
