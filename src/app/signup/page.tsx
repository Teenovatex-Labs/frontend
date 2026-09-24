import { redirect } from "next/navigation";

// /signup lives at /auth?mode=signup now (a single page that swaps between
// login and signup with an animated transition). This keeps old links and
// bookmarks working.
export default function SignupRedirect() {
  redirect("/auth?mode=signup");
}
