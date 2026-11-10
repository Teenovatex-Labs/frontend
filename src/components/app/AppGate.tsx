"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AddPasswordPrompt from "./AddPasswordPrompt";
import SigningIn from "@/components/auth/SigningIn";
import AppShell from "./AppShell";
import SetupGate from "./SetupGate";
import SuspensionBanner from "@/components/safety/SuspensionBanner";
import AnnouncementBanner from "@/components/announcements/AnnouncementBanner";
import { usersApi } from "@/lib/api";
import { browserTimezone } from "@/lib/age";
import { registerServiceWorker } from "@/lib/push";
import { captureInstallEvent } from "@/lib/installPrompt";

export default function AppGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace("/auth?mode=login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!loading && user?.membership_status === "onboarding" && pathname !== "/welcome") router.replace("/welcome");
  }, [loading, user, pathname, router]);

  // The service worker makes the installed app open offline and lets notifications show up.
  useEffect(() => {
    void registerServiceWorker();
    captureInstallEvent();
  }, []);

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
  if (user.membership_status === "onboarding" && pathname !== "/welcome") return <SigningIn label="Taking you to your first week" />;

  return (
    <AppShell>
      <SuspensionBanner />
      <AnnouncementBanner />
      <AddPasswordPrompt />
      {children}
    </AppShell>
  );
}
