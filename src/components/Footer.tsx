export default function Footer() {
  return (
    <footer className="wrap">
      <div className="grid gap-8 py-10 md:grid-cols-3 md:items-start md:gap-10">
        <a href="#" className="flex items-center gap-2.5">
          <span className="text-[42px] leading-none tracking-[-0.19em] pr-2">
            t<span className="text-[38px] text-rose">×</span>
          </span>
          <span className="font-bold text-2xl tracking-tight">
            teenovate<span className="text-rose">x</span>
            <small className="mt-0.5 block text-[10px] font-semibold tracking-[0.3em]">
              LABS
            </small>
          </span>
        </a>

        <p className="text-sm text-muted">
          A global tech community.
          <br />
          Built for teenagers.
        </p>

        <div className="flex gap-6 text-sm md:justify-end">
          <a href="mailto:hello@teenovatex.com" className="hover:text-rose">
            Say hello ↗︎
          </a>
          <a
            href="https://www.instagram.com/teenovatexlabs/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-rose"
          >
            Instagram ↗︎
          </a>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line py-5 text-xs text-muted">
        <span>© 2026 TeenovateX Labs</span>
        <a href="#" className="ml-auto">
          Back to top ↑
        </a>
      </div>
    </footer>
  );
}
