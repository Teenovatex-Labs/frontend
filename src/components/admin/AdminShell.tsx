"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { adminApi } from "@/lib/services";
import { keys } from "@/lib/labs";
import SigningIn from "@/components/auth/SigningIn";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/members", label: "Members" },
  { href: "/admin/audit", label: "Audit log" },
];

// Everything under /admin: moderators and admins only. The API enforces the same rule, so this
// gate is about showing the right screen, not about security.
export default function AdminShell({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isStaff = user?.role === "moderator" || user?.role === "admin";

  useEffect(() => {
    if (!loading && !user) router.replace("/auth?mode=login&next=/admin");
  }, [loading, user, router]);

  const stats = useQuery({ queryKey: keys.admin("stats"), queryFn: adminApi.stats, enabled: isStaff, refetchInterval: 60_000 });

  if (loading || !user) return <SigningIn label="Checking your access" />;

  if (!isStaff) {
    return (
      <main className="wrap flex min-h-screen flex-col justify-center gap-4 py-16">
        <p className="eyebrow text-rose">Admin</p>
        <h1 className="text-[36px] md:text-[48px]">
          This area is for <span className="font-serif font-normal italic">the team.</span>
        </h1>
        <p className="max-w-[440px] text-muted">You&rsquo;re signed in as @{user.username}, which doesn&rsquo;t have moderator access.</p>
        <div className="flex gap-3">
          <Link href="/home" className="btn">Go to the app</Link>
          <button className="btn-secondary" onClick={() => void logout()}>Sign out</button>
        </div>
      </main>
    );
  }

  const open = stats.data?.open_reports ?? 0;
  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-ink bg-white">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3 md:px-10">
          <span className="font-semibold tracking-tight">TeenovateX <span className="font-serif font-normal italic text-rose">Admin</span></span>
          <nav className="flex flex-wrap gap-1" aria-label="Admin sections">
            {NAV.map((n) => {
              const active = n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href);
              return (
                <Link key={n.href} href={n.href} aria-current={active ? "page" : undefined} className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${active ? "bg-ink text-cream" : "hover:bg-yellow"}`}>
                  {n.label}
                  {n.href === "/admin/reports" && open > 0 && <span className="ml-2 rounded-full bg-pink px-1.5 py-0.5 text-[11px] text-ink">{open}</span>}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-4 text-sm">
            <span className="text-muted">@{user.username} · {user.role}</span>
            <Link href="/home" className="underline underline-offset-4 hover:text-rose">App</Link>
            <button onClick={() => void logout()} className="underline underline-offset-4 hover:text-rose">Sign out</button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-[1100px] px-5 py-8 md:px-10 md:py-10">{children}</div>
    </div>
  );
}
