"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AddPasswordPrompt from "./AddPasswordPrompt";
import SigningIn from "@/components/auth/SigningIn";
import AppShell from "./AppShell";

export default function AppGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/auth?mode=login");
  }, [loading, user, router]);

  if (loading || !user) {
    return <SigningIn label="Loading your space" />;
  }

  return (
    <AppShell>
      <AddPasswordPrompt />
      {children}
    </AppShell>
  );
}
