"use client";

import { useAuth } from "@/context/AuthContext";

// Shown to a member whose account is paused: they can read everything but not post or vote.
export default function SuspensionBanner() {
  const { user } = useAuth();
  if (!user?.suspended_until || new Date(user.suspended_until).getTime() <= Date.now()) return null;
  const until = new Date(user.suspended_until).toLocaleDateString(undefined, { day: "numeric", month: "long" });
  return (
    <div role="status" className="border-b border-ink bg-pink px-5 py-3 text-center text-sm">
      <strong>Your account is paused until {until}.</strong> You can still read and explore, but you can&rsquo;t post, comment or vote for now.
      {user.suspended_reason ? ` Reason: ${user.suspended_reason}` : ""}
    </div>
  );
}
