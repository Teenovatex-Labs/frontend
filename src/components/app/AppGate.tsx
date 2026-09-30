"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AddPasswordPrompt from "./AddPasswordPrompt";
import AppShell from "./AppShell";

export default function AppGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/auth?mode=login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <img src="/assets/logo-nobg.svg" alt="" className="h-14 w-14 animate-pulse" />
        <span className="sr-only">Loading</span>
      </main>
    );
  }

  return (
    <AppShell>
      <AddPasswordPrompt />
      {children}
    </AppShell>
  );
}
