import { redirect } from "next/navigation";

// Older application emails linked to /apply/resume?token=…; the portal lives at /apply.
export default async function Resume({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  redirect(token ? `/apply?token=${encodeURIComponent(token)}` : "/apply");
}
