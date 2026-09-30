"use client";

import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import { categoryLabel } from "@/lib/labs";
import type { Lab } from "@/lib/services";
import VoteButton from "./VoteButton";

const COVER_TONES = ["bg-pink", "bg-yellow", "bg-cream"];

export function LabCover({ lab, className = "" }: { lab: Pick<Lab, "name" | "cover_url">; className?: string }) {
  if (lab.cover_url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={lab.cover_url} alt="" className={`w-full object-cover ${className}`} />;
  }
  const tone = COVER_TONES[[...lab.name].reduce((n, c) => n + c.charCodeAt(0), 0) % COVER_TONES.length];
  return (
    <div aria-hidden="true" className={`flex w-full items-center justify-center ${tone} ${className}`}>
      <span className="font-serif text-[64px] font-normal italic leading-none text-ink/70">{lab.name.charAt(0).toUpperCase()}</span>
    </div>
  );
}

export default function LabCard({ lab, mine = false }: { lab: Lab; mine?: boolean }) {
  return (
    <article className="flex flex-col border border-ink bg-white shadow-[5px_5px_0_var(--ink)] transition-transform hover:-translate-y-1">
      <Link href={`/labs/${lab.slug}`} className="block border-b border-ink">
        <LabCover lab={lab} className="aspect-[16/10]" />
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <p className="eyebrow text-rose">{categoryLabel(lab.category)}</p>
        <h3 className="mt-1.5 text-[20px] leading-tight tracking-[-0.02em]">
          <Link href={`/labs/${lab.slug}`} className="hover:underline">
            {lab.name}
          </Link>
        </h3>
        <p className="mt-1.5 line-clamp-2 flex-1 text-sm text-muted">{lab.short_description}</p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <Link href={`/u/${lab.user.username}`} className="flex min-w-0 items-center gap-2 text-sm hover:underline">
            <Avatar name={lab.user.username} src={lab.user.avatar_url} size={26} />
            <span className="truncate">@{lab.user.username}</span>
          </Link>
          <VoteButton labId={lab.id} count={lab.vote_count} voted={!!lab.has_voted_today} own={mine} />
        </div>
      </div>
    </article>
  );
}
