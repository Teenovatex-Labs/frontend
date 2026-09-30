// Where to send someone once they are signed in. A page that needs a sign-in can send people to
// /auth?next=/somewhere and they come back to it. Only same-site paths are honoured, so a crafted
// link can never bounce a member to another website.
export function safeNext(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("://") || value.includes("\\")) return "/home";
  if (/^\/(auth|login|signup)(\/|\?|$)/.test(value)) return "/home";
  return value;
}

export const landingPath = (): string =>
  typeof window === "undefined" ? "/home" : safeNext(new URLSearchParams(window.location.search).get("next"));
