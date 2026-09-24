"use client";

import Link from "next/link";
import type { ComponentType, RefAttributes } from "react";
import { InstagramIcon } from "@animateicons/react/lucide/instagram-icon";
import { TwitterIcon } from "@animateicons/react/lucide/twitter-icon";
import { LinkedinIcon } from "@animateicons/react/lucide/linkedin-icon";
import { MessageCircleIcon } from "@animateicons/react/lucide/message-circle-icon";
import type { IconHandle } from "@animateicons/react";
import useIconHover from "@/lib/useIconHover";

type AnimatedIconProps = { size?: number; className?: string };

const SOCIALS: {
  href: string;
  label: string;
  Icon: ComponentType<AnimatedIconProps & RefAttributes<IconHandle>>;
}[] = [
  { href: "https://www.instagram.com/teenovatexlabs/", label: "Instagram", Icon: InstagramIcon },
  { href: "https://x.com/teenovatex40605", label: "X", Icon: TwitterIcon },
  { href: "https://chat.whatsapp.com/HYphvnsGa4PAnoPxReTpHW", label: "WhatsApp", Icon: MessageCircleIcon },
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
            <SocialLink key={label} href={href} label={label} icon={Icon} />
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
      className="text-ink transition-colors hover:text-rose"
    >
      <Icon ref={ref} size={20} />
    </a>
  );
}
