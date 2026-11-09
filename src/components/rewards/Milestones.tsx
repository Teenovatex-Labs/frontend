"use client";

import { useEffect, useState } from "react";
import CelebrationCard from "@/components/ui/CelebrationCard";

type Snapshot = { points: number; level: number; rank: number | null };
type Moment = { lottie: string; title: string; detail?: string };

const KEY = (id: string) => `tx-stats:${id}`;

function read(id: string): Snapshot | null {
  try {
    const raw = localStorage.getItem(KEY(id));
    return raw ? (JSON.parse(raw) as Snapshot) : null;
  } catch {
    return null;
  }
}

/**
 * Compares today's points, level and rank with what this browser saw last time and, if something
 * went up, shows one celebration (level beats rank beats points). The first visit only records a
 * baseline, so nobody is congratulated for what they already had.
 */
export default function Milestones({ userId, points, level, levelTitle, rank }: { userId: string; points: number; level: number; levelTitle: string; rank: number | null }) {
  const [moment, setMoment] = useState<Moment | null>(null);

  useEffect(() => {
    const before = read(userId);
    const now: Snapshot = { points, level, rank };
    try {
      localStorage.setItem(KEY(userId), JSON.stringify(now));
    } catch {
      return;
    }
    if (!before) return;
    if (level > before.level) setMoment({ lottie: "/lottie/level-up.json", title: `Level ${level}: ${levelTitle}`, detail: "You levelled up." });
    else if (rank !== null && before.rank !== null && rank < before.rank) setMoment({ lottie: "/lottie/rank-up.json", title: `You climbed to #${rank}`, detail: `Up from #${before.rank} on the leaderboard.` });
    else if (points > before.points) setMoment({ lottie: "/lottie/points-earned.json", title: `+${(points - before.points).toLocaleString()} points`, detail: "Since you were last here." });
  }, [userId, points, level, levelTitle, rank]);

  if (!moment) return null;
  return (
    <CelebrationCard className="mt-6" lottie={moment.lottie} title={moment.title} onClose={() => setMoment(null)}>
      {moment.detail}
    </CelebrationCard>
  );
}
