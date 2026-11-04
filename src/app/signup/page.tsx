import { redirect } from "next/navigation";

// /signup lives at /auth?mode=signup now. Query params (the emailed `invite` link) must survive the hop.
export default async function SignupRedirect({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = new URLSearchParams({ mode: "signup" });
  for (const [k, v] of Object.entries(await searchParams)) if (typeof v === "string" && k !== "mode") params.set(k, v);
  redirect(`/auth?${params.toString()}`);
}
