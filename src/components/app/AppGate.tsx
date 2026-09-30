"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AddPasswordPrompt from "./AddPasswordPrompt";
import SigningIn from "@/components/auth/SigningIn";
import AppShell from "./AppShell";
import SetupGate from "./SetupGate";
import SuspensionBanner from "@/components/safety/SuspensionBanner";
import AnnouncementBanner from "@/components/announcements/AnnouncementBanner";
import { usersApi } from "@/lib/api";
import { browserTimezone } from "@/lib/age";

export default function AppGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/auth?mode=login");
  }, [loading, user, router]);

  // Streaks and deadlines run on the member's own clock, so save it once.
  const needsTimezone = !!user && user.age_confirmed && user.username_set && !user.timezone;
  useEffect(() => {
    const timezone = browserTimezone();
    if (needsTimezone && timezone) void usersApi.updateMe({ timezone }).catch(() => {});
  }, [needsTimezone]);

  if (loading || !user) {
    return <SigningIn label="Loading your space" />;
  }

  if (!user.age_confirmed || !user.username_set) return <SetupGate />;

  return (
    <AppShell>
      <SuspensionBanner />
      <AnnouncementBanner />
      <AddPasswordPrompt />
      {children}
    </AppShell>
  );
}
