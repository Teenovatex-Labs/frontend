"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-muted">Loading…</p>
      </main>
    );
  }

  return (
    <main className="wrap flex min-h-screen flex-col justify-center gap-6 py-16">
      <p className="eyebrow text-rose">This is a placeholder</p>
      <h1 className="text-[38px] leading-[1.1] tracking-[-0.03em] md:text-[54px]">
        Hey {user.full_name} <span className="font-serif italic font-normal">👋</span>
      </h1>
      <p className="max-w-md text-muted">
        You&rsquo;re signed in as <strong className="text-ink">@{user.username}</strong>. The real
        dashboard is still being designed &mdash; this page just proves the login/signup/Google
        auth loop works end to end.
      </p>

      <div className="mt-4 flex items-center gap-6">
        <button
          type="button"
          onClick={async () => {
            await logout();
            router.push("/");
          }}
          className="btn"
        >
          Log out
        </button>
        <Link href="/" className="text-sm font-semibold underline underline-offset-4">
          Back to home
        </Link>
      </div>
    </main>
  );
}
