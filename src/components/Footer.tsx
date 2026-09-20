export default function Footer() {
  return (
    <footer className="wrap flex flex-col items-center gap-6 py-16 text-center md:flex-row md:justify-between md:text-left">
      <div>
        <p className="text-lg font-semibold tracking-tight">
          t<span className="text-rose">×</span>teenovatex
          <span className="font-normal text-muted">LABS</span>
        </p>
        <p className="mt-1 text-sm text-muted">
          A youth-led tech community. Build with us.
        </p>
      </div>

      <div className="flex flex-col items-center gap-2 text-sm text-muted md:items-end">
        <a href="mailto:hello@teenovatex.com" className="hover:text-rose">
          hello@teenovatex.com
        </a>
        <a
          href="https://instagram.com/teenovatex"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-rose"
        >
          @teenovatex
        </a>
      </div>
    </footer>
  );
}
