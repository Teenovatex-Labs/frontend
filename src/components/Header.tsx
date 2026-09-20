const NAV_LINKS = [
  { href: "#about", label: "The community" },
  { href: "#explore", label: "The features" },
  { href: "#people", label: "Our people" },
  { href: "#join", label: "Join us" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-cream/90 backdrop-blur">
      <div className="wrap flex h-20 items-center justify-between">
        <a href="#" className="text-lg font-semibold tracking-tight">
          t<span className="text-rose">×</span>teenovatex
          <span className="font-normal text-muted">LABS</span>
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ink transition-colors hover:text-rose"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <a
          href="#join"
          className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-rose"
        >
          Join us
        </a>
      </div>
    </header>
  );
}
