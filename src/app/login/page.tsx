import { redirect } from "next/navigation";

// /login lives at /auth?mode=login now (a single page that swaps between
// login and signup with an animated transition). This keeps old links and
// bookmarks working.
export default function LoginRedirect() {
  redirect("/auth?mode=login");
}
