"use client";

import Link from "next/link";
import type { ComponentType, RefAttributes } from "react";
import { InstagramIcon } from "@animateicons/react/lucide/instagram-icon";
import { TwitterIcon } from "@animateicons/react/lucide/twitter-icon";
import { LinkedinIcon } from "@animateicons/react/lucide/linkedin-icon";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import type { IconHandle } from "@animateicons/react";
import useIconHover from "@/lib/useIconHover";
import { appUrl } from "@/lib/hosts";

type AnimatedIconProps = { size?: number; className?: string };

const SOCIALS: {
  href: string;
  label: string;
  Icon: ComponentType<AnimatedIconProps & RefAttributes<IconHandle>>;
}[] = [
  { href: "https://www.instagram.com/teenovatexlabs/", label: "Instagram", Icon: InstagramIcon },
  { href: "https://x.com/teenovatex40605", label: "X", Icon: TwitterIcon },
  { href: "https://chat.whatsapp.com/HYphvnsGa4PAnoPxReTpHW", label: "WhatsApp", Icon: WhatsAppIcon },
  { href: "https://www.linkedin.com/company/teenovatex-labs/", label: "LinkedIn", Icon: LinkedinIcon },
];

const EXPLORE = [
  { href: "/#about", label: "About" },
  { href: "/#explore", label: "What we do" },
  { href: "/#people", label: "Team" },
  { href: "/#story", label: "Story" },
];

const GET_INVOLVED = [
  { href: appUrl("/auth?mode=signup"), label: "Become a Teenovator" },
  { href: "/#donate", label: "Donate" },
  { href: "/contact", label: "Mentor or partner" },
  { href: "/contact", label: "Say hello" },
];

/** `merged` drops the top rule so the footer continues the yellow Join band above it. */
export default function Footer({ merged = false }: { merged?: boolean }) {
  return (
    <footer className={`relative overflow-hidden bg-yellow ${merged ? "" : "border-t border-ink"}`}>
      <div className="wrap relative">
        <div className={`grid grid-cols-2 gap-x-6 gap-y-10 pb-12 md:grid-cols-[1.5fr_1fr_1fr_auto] md:gap-14 ${merged ? "border-t border-ink/20 pt-12" : "pt-14"}`}>
          <div className="col-span-2 md:col-span-1">
            <Link href="/" aria-label="TeenovateX home" className="inline-flex items-center">
              <img src="/assets/logo-long5.svg" alt="TeenovateX" className="h-9 w-auto" />
            </Link>
            <p className="mt-5 max-w-[300px] text-base leading-snug">
              A global tech community for teenagers, run with them, not for them.
            </p>
            <span className="mt-6 inline-block -rotate-2 bg-pink px-3 py-1 text-sm font-semibold tracking-tight">
              Built for teenagers.
            </span>
          </div>

          <FooterColumn title="Explore" links={EXPLORE} />
          <FooterColumn title="Get involved" links={GET_INVOLVED} />

          <div className="col-span-2 md:col-span-1">
            <p className="eyebrow text-rose">Follow along</p>
            <div className="mt-4 grid grid-cols-4 gap-2 md:grid-cols-2">
              {SOCIALS.map(({ href, label, Icon }) => (
                <SocialLink key={label} href={href} label={label} icon={Icon} />
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-ink py-5 text-xs">
          <span className="font-medium">© 2026 TeenovateX Labs</span>
          <Link href="/privacy-policy" className="underline-offset-4 hover:text-rose hover:underline">
            Privacy Policy
          </Link>
          <Link href="/terms-of-service" className="underline-offset-4 hover:text-rose hover:underline">
            Terms of Service
          </Link>
          <a
            href="#"
            className="ml-auto inline-flex items-center gap-2 rounded-full border border-ink px-4 py-1.5 font-semibold transition-colors hover:bg-ink hover:text-yellow"
          >
            Back to top <span aria-hidden="true">↑</span>
          </a>
        </div>
      </div>

      <p
        aria-hidden="true"
        className="wrap pointer-events-none select-none whitespace-nowrap text-center text-[17.5vw] font-semibold leading-[0.78] tracking-[-0.06em] text-ink md:text-[min(15.2vw,230px)]"
        style={{ height: "0.72em", overflow: "hidden" }}
      >
        Teenovate<span className="text-rose">X</span>
      </p>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <nav aria-label={title}>
      <p className="eyebrow text-rose">{title}</p>
      <ul className="mt-4 grid gap-2.5 p-0">
        {links.map((l) => (
          <li key={l.label} className="list-none">
            <Link href={l.href} className="group inline-flex items-center gap-1.5 text-base font-medium">
              <span className="underline-offset-4 group-hover:underline">{l.label}</span>
              <span aria-hidden="true" className="-translate-x-1 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100">
                ↗︎
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function SocialLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: ComponentType<AnimatedIconProps & RefAttributes<IconHandle>>;
}) {
  const { ref, onMouseEnter, onMouseLeave } = useIconHover();
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="flex h-12 w-12 items-center justify-center rounded-lg border border-ink bg-cream text-ink transition-colors hover:bg-pink"
    >
      <Icon ref={ref} size={20} />
    </a>
  );
}
