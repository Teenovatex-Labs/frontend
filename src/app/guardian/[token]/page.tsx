import { redirect } from "next/navigation";

// Older guardian emails linked to /guardian/<token>; the confirmation page is /consent/<token>.
export default async function Guardian({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  redirect(`/consent/${encodeURIComponent(token)}`);
}
