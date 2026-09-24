import Link from "next/link";
import { InstagramIcon } from "@animateicons/react/lucide/instagram-icon";
import { XIcon } from "@animateicons/react/lucide/x-icon";
import { LinkedinIcon } from "@animateicons/react/lucide/linkedin-icon";
import WhatsappIcon from "./icons/WhatsappIcon";

const SOCIALS = [
  { href: "https://www.instagram.com/teenovatexlabs/", label: "Instagram", Icon: InstagramIcon },
  { href: "https://x.com/teenovatex40605", label: "X", Icon: XIcon },
  { href: "https://chat.whatsapp.com/HYphvnsGa4PAnoPxReTpHW", label: "WhatsApp", Icon: WhatsappIcon },
  { href: "https://www.linkedin.com/company/teenovatex-labs/", label: "LinkedIn", Icon: LinkedinIcon },
];

export default function Footer() {
  return (
    <footer className="wrap">
      <div className="grid gap-8 py-10 md:grid-cols-3 md:items-start md:gap-10">
        <Link href="/" aria-label="TeenovateX home" className="flex items-center">
          <img src="/assets/logo-long5.svg" alt="TeenovateX" className="h-9 w-auto" />
        </Link>

        <p className="text-sm text-muted">
          A global tech community.
          <br />
          Built for teenagers.
        </p>

        <div className="flex items-center gap-5 md:justify-end">
          <a href="mailto:hello@teenovatex.com" className="text-sm hover:text-rose">
            Say hello ↗︎
          </a>
          {SOCIALS.map(({ href, label, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="text-ink transition-colors hover:text-rose"
            >
              <Icon size={20} />
            </a>
          ))}
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
