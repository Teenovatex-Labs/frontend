import Link from "next/link";

export default function TeenovatorsPage() {
  return (
    <main className="wrap flex min-h-screen flex-col justify-center gap-6 py-16">
      <p className="eyebrow text-rose">This is a placeholder</p>
      <h1 className="text-[38px] leading-[1.1] tracking-[-0.03em] md:text-[54px]">
        The Teenovators <span className="font-serif italic font-normal">are coming.</span>
      </h1>
      <p className="max-w-md text-muted">
        A showcase of what our members are building &mdash; project highlights, milestones
        and the people behind them &mdash; is on its way. For now, meet the core team in
        the orbit above.
      </p>

      <div className="mt-4 flex items-center gap-6">
        <Link href="/#people" className="btn">
          Back to the team <span>↑</span>
        </Link>
        <Link href="/" className="text-sm font-semibold underline underline-offset-4">
          Back to home
        </Link>
      </div>
    </main>
  );
}
