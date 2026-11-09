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
import Reveal from "@/components/Reveal";

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

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Explore",
    links: [
      { label: "About", href: "/#about" },
      { label: "What we do", href: "/#explore" },
      { label: "The team", href: "/#people" },
      { label: "Our story", href: "/#story" },
      { label: "Donate", href: "/#donate" },
    ],
  },
  {
    title: "Join in",
    links: [
      { label: "Become a Teenovator", href: appUrl("/auth?mode=signup") },
      { label: "Log in", href: appUrl("/auth?mode=login") },
      { label: "Apply to join", href: "/apply" },
      { label: "Check my application", href: "/apply/status" },
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

        <div className="grid gap-12 py-14 md:grid-cols-[1.5fr_1fr_1fr_1fr] md:gap-10 md:py-16">
          <Reveal from="left" distance={40}>
            <Link href="/" aria-label="TeenovateX home" className="inline-flex items-center">
              <img src="/assets/logo-long5.svg" alt="TeenovateX" className="h-10 w-auto" />
            </Link>
            <p className="mt-5 max-w-[300px] font-serif text-[26px] italic leading-[1.15] text-ink">
              A global tech community, built for teenagers.
            </p>
            <span className="mt-5 inline-block -rotate-2 bg-pink px-3 py-1 text-xs font-bold uppercase tracking-[0.08em]">
              Made by teens, for teens
            </span>
            <div className="mt-7 flex items-center gap-3">
              {SOCIALS.map(({ href, label, Icon }) => (
                <SocialLink key={label} href={href} label={label} icon={Icon} />
              ))}
            </div>
          </Reveal>

          {COLUMNS.map((col, i) => (
            <Reveal key={col.title} from="up" delay={0.08 * (i + 1)} distance={40}>
              <p className="eyebrow text-rose">{col.title}</p>
              <ul className="mt-5 space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="group inline-flex items-center gap-1.5 text-[15px] font-medium text-ink"
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

      <div className="relative border-t border-ink bg-ink text-cream">
        <div className="wrap flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-5 text-xs">
          <span>
            © 2026 TeenovateX Labs. Fiscally sponsored by Hack Club, a 501(c)(3) nonprofit.
          </span>
          <div className="ml-auto flex items-center gap-5">
            <Link href="/privacy-policy" className="hover:text-pink">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="hover:text-pink">
              Terms of Service
            </Link>
            <a
              href="#"
              aria-label="Back to top"
              className="grid h-8 w-8 place-items-center rounded-full border border-cream/40 text-sm transition-colors hover:border-pink hover:bg-pink hover:text-ink"
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
      className="grid h-11 w-11 place-items-center rounded-full border border-ink bg-cream text-ink transition-all duration-200 hover:-translate-y-0.5 hover:bg-pink"
    >
      <Icon ref={ref} size={20} />
    </a>
  );
}
