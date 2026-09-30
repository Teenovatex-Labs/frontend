"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

// "Profile" in the menu always means your own page, which lives at /u/<you>.
export default function MyProfileRedirect() {
  const { user } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (user) router.replace(`/u/${user.username}`);
  }, [user, router]);
  return null;
}
