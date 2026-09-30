import type { IconSvgElement } from "@hugeicons/react";
import {
  Award01Icon,
  FavouriteIcon,
  Home01Icon,
  Notification03Icon,
  Rocket01Icon,
  UserAdd01Icon,
  UserGroupIcon,
  WhatsappIcon,
} from "@hugeicons/core-free-icons";

export type NavLeaf = {
  id: string;
  label: string;
  /** Internal path. Leave out (with `soon`) for pages that don't exist yet. */
  href?: string;
  external?: string;
  soon?: boolean;
};

export type NavItem = NavLeaf & { icon: IconSvgElement; children?: NavLeaf[] };

export const MAIN: NavItem[] = [
  { id: "home", label: "Home", href: "/home", icon: Home01Icon },
  {
    id: "projects",
    label: "Projects",
    icon: Rocket01Icon,
    soon: true,
    children: [
      { id: "showcase", label: "Showcase", soon: true },
      { id: "my-projects", label: "My projects", soon: true },
      { id: "collabs", label: "Collabs", soon: true },
    ],
  },
  {
    id: "community",
    label: "Community",
    icon: UserGroupIcon,
    soon: true,
    children: [
      { id: "forums", label: "Forums", soon: true },
      { id: "mentorship", label: "Mentorship", soon: true },
      { id: "events", label: "Events", soon: true },
    ],
  },
  { id: "leaderboard", label: "Leaderboard", icon: Award01Icon, soon: true },
  { id: "notifications", label: "Notifications", icon: Notification03Icon, soon: true },
];

export const LINKS: NavItem[] = [
  {
    id: "whatsapp",
    label: "WhatsApp community",
    icon: WhatsappIcon,
    external: "https://chat.whatsapp.com/HYphvnsGa4PAnoPxReTpHW",
  },
  {
    id: "support",
    label: "Support us",
    icon: FavouriteIcon,
    external: "https://hcb.hackclub.com/donations/start/teenovatex-labs?utm_source=app.teenovatex.org",
  },
  { id: "core-team", label: "Join the core team", icon: UserAdd01Icon, external: "https://teenovatex.fillout.com/cftm" },
];
