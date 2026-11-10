"use client";

import Link from "next/link";
import type { ComponentType, RefAttributes } from "react";
import { InstagramIcon } from "@animateicons/react/lucide/instagram-icon";
import { TwitterIcon } from "@animateicons/react/lucide/twitter-icon";
import { LinkedinIcon } from "@animateicons/react/lucide/linkedin-icon";
import type { IconHandle } from "@animateicons/react";
import useIconHover from "@/lib/useIconHover";
import { appUrl } from "@/lib/hosts";
import Reveal from "@/components/Reveal";

type AnimatedIconProps = { size?: number; className?: string };

const SOCIALS: {
  href: string;
  label: string;
  Icon: ComponentType<AnimatedIconProps & RefAttributes<IconHandle>>;
}[] = [
  { href: "https://www.instagram.com/teenovatexlabs/", label: "Instagram", Icon: InstagramIcon },
  { href: "https://x.com/teenovatex40605", label: "X", Icon: TwitterIcon },
  { href: "https://www.linkedin.com/company/teenovatex-labs/", label: "LinkedIn", Icon: LinkedinIcon },
];

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Explore",
    links: [
      { label: "About", href: "/#about" },
      { label: "What we do", href: "/#explore" },
      { label: "The team", href: "/#people" },
      { label: "Our story", href: "/story" },
      { label: "Donate", href: "/#donate" },
    ],
  },
  {
    title: "Join in",
    links: [
      { label: "Apply to join", href: "/apply" },
      { label: "Check my application", href: "/apply/status" },
      { label: "Log in", href: appUrl("/auth?mode=login") },
    ],
  },
  {
    title: "Work with us",
    links: [
      { label: "Mentor a team", href: "/contact?topic=mentor" },
      { label: "Sponsor an event", href: "/contact?topic=sponsor" },
      { label: "Partner with us", href: "/contact?topic=partner" },
      { label: "Say hello", href: "/contact" },
    ],
  },
];

/**
 * `merged` puts the footer on the same yellow band as the call to action above it (landing page);
 * the wrapper paints the background. Without it the footer stands on its own cream band.
 */
export default function Footer({ merged = false }: { merged?: boolean }) {
  return (
    <footer className={merged ? "relative" : "relative overflow-hidden border-t border-ink bg-yellow"}>
      <div className="wrap relative">
        <div className={merged ? "border-t border-ink/25" : ""} />

        <div className="grid gap-8 py-8 sm:py-10 md:grid-cols-[1.5fr_1fr_1fr_1fr] md:gap-10 md:py-16">
          <Reveal from="left" distance={40}>
            <Link href="/" aria-label="TeenovateX home" className="inline-flex items-center">
              <img src="/assets/logo-long5.svg" alt="TeenovateX" className="h-8 w-auto md:h-10" />
            </Link>
            <p className="mt-3 max-w-[300px] font-serif text-xl italic leading-[1.2] text-ink sm:text-[22px] md:mt-5 md:text-[26px] md:leading-[1.15]">
              A global tech community, built for teenagers.
            </p>
            <span className="mt-3 inline-block -rotate-2 bg-pink px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.08em] md:mt-5 md:px-3 md:py-1 md:text-xs">
              Made by teens, for teens
            </span>
            <div className="mt-4 flex items-center gap-2.5 md:mt-7 md:gap-3">
              {SOCIALS.map(({ href, label, Icon }) => (
                <SocialLink key={label} href={href} label={label} icon={Icon} />
              ))}
            </div>
          </Reveal>

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:contents">
            {COLUMNS.map((col, i) => (
              <Reveal key={col.title} from="up" delay={0.08 * (i + 1)} distance={40}>
                <p className="eyebrow text-rose">{col.title}</p>
                <ul className="mt-3 space-y-2 md:mt-5 md:space-y-3">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        className="group inline-flex items-center gap-1.5 text-sm font-medium text-ink md:text-[15px]"
                      >
                        <span className="bg-gradient-to-r from-rose to-rose bg-[length:0%_2px] bg-left-bottom bg-no-repeat transition-[background-size,color] duration-300 group-hover:bg-[length:100%_2px] group-hover:text-rose">
                          {l.label}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
        </div>
      </div>

      <div className="relative border-t border-ink bg-ink text-cream">
        <div className="wrap flex flex-col items-center justify-between gap-3 py-4 text-center text-xs sm:flex-row sm:text-left sm:py-5">
          <span className="text-cream/80">
            © 2026 TeenovateX Labs. Fiscally sponsored by Hack Club, a 501(c)(3) nonprofit.
          </span>
          <div className="flex items-center gap-4 sm:gap-5">
            <Link href="/privacy-policy" className="hover:text-pink">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="hover:text-pink">
              Terms of Service
            </Link>
            <a
              href="#"
              aria-label="Back to top"
              className="grid h-7 w-7 place-items-center rounded-full border border-cream/40 text-xs transition-colors hover:border-pink hover:bg-pink hover:text-ink sm:h-8 sm:w-8 sm:text-sm"
            >
              ↑
            </a>
          </div>
        </div>
      </div>
    </footer>
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
      className="grid h-9 w-9 place-items-center rounded-full border border-ink bg-cream text-ink transition-all duration-200 hover:-translate-y-0.5 hover:bg-pink sm:h-11 sm:w-11"
    >
      <Icon ref={ref} size={18} />
    </a>
  );
}
