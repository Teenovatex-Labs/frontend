"use client";

import { useAuth } from "@/context/AuthContext";

export default function HomePage() {
  const { user } = useAuth();
  if (!user) return null;

  const first = user.full_name.split(" ")[0];
  const stats = [
    { label: "Points", value: user.points.toLocaleString(), tone: "bg-yellow" },
    { label: "Day streak", value: String(user.streak), tone: "bg-pink" },
    { label: "Rank", value: user.rank ? `#${user.rank}` : "Unranked", tone: "bg-cream" },
  ];

  return (
    <main className="mx-auto w-full max-w-[1080px] px-5 py-10 md:px-10 md:py-16">
      <p className="eyebrow text-rose">Home</p>
      <h1 className="mt-4 text-[40px] leading-[1.05] md:text-[64px]">
        Hey <span className="font-serif font-normal italic">{first}.</span>
      </h1>
      <p className="mt-4 max-w-[480px] text-muted">
        You&rsquo;re signed in as <strong className="text-ink">@{user.username}</strong>. Your space is
        taking shape, and everything you earn shows up here first.
      </p>

      <div className="mt-10 grid gap-5 sm:grid-cols-3">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={`${s.tone} border border-ink p-6 shadow-[5px_5px_0_var(--ink)] transition-transform hover:-translate-y-1 ${
              i === 1 ? "sm:rotate-1" : i === 2 ? "sm:-rotate-1" : ""
            }`}
          >
            <p className="eyebrow text-ink/60">{s.label}</p>
            <p className="mt-3 text-[44px] font-semibold leading-none tracking-[-0.05em] tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 border border-dashed border-ink p-6 md:p-8">
        <p className="eyebrow text-rose">What&rsquo;s next</p>
        <p className="mt-3 font-serif text-[26px] italic leading-tight">Labs, Community and the Leaderboard are on their way.</p>
        <p className="mt-3 max-w-[520px] text-sm text-muted">
          They&rsquo;re already in the sidebar, marked <span className="font-semibold text-ink">Soon</span>, and will
          light up as they ship.
        </p>
      </div>
    </main>
  );
}
