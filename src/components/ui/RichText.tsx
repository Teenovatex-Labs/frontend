import { Fragment } from "react";
import Link from "next/link";

// Plain text where @username becomes a link to that member. Nothing else is interpreted, so member
// text can never inject markup; links and formatting are deliberately not supported.
const MENTION = /(^|[^\w@])@([a-zA-Z0-9_]{3,30})\b/g;

export default function RichText({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(MENTION)) {
    const start = m.index! + m[1]!.length;
    if (start > last) parts.push(<Fragment key={`t${last}`}>{text.slice(last, start)}</Fragment>);
    parts.push(
      <Link key={`m${start}`} href={`/u/${m[2]}`} className="font-medium text-rose hover:underline">
        @{m[2]}
      </Link>
    );
    last = start + 1 + m[2]!.length;
  }
  if (last < text.length) parts.push(<Fragment key={`t${last}`}>{text.slice(last)}</Fragment>);
  return <>{parts}</>;
}
