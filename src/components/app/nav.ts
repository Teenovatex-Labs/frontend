import type { ComponentType, RefAttributes } from "react";
import type { IconHandle } from "@animateicons/react";
import { BookOpenIcon } from "@animateicons/react/lucide/book-open-icon";
import { BellIcon } from "@animateicons/react/lucide/bell-icon";
import { ChartBarIncreasingIcon } from "@animateicons/react/lucide/chart-bar-increasing-icon";
import { HeartIcon } from "@animateicons/react/lucide/heart-icon";
import { HouseIcon } from "@animateicons/react/lucide/house-icon";
import { MessageCircleIcon } from "@animateicons/react/lucide/message-circle-icon";
import { RocketIcon } from "@animateicons/react/lucide/rocket-icon";
import { UserPlusIcon } from "@animateicons/react/lucide/user-plus-icon";
import { UsersIcon } from "@animateicons/react/lucide/users-icon";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";

export type AnimatedIcon = ComponentType<{ size?: number; className?: string } & RefAttributes<IconHandle>>;

export type NavLeaf = {
  id: string;
  label: string;
  /** Internal path. Leave out (with `soon`) for pages that don't exist yet. */
  href?: string;
  external?: string;
  soon?: boolean;
};

export type NavItem = NavLeaf & { icon: AnimatedIcon; children?: NavLeaf[] };

export const MAIN: NavItem[] = [
  { id: "home", label: "Home", href: "/home", icon: HouseIcon },
  {
    id: "projects",
    label: "Labs",
    icon: RocketIcon,
    children: [
      { id: "showcase", label: "Showcase", href: "/labs" },
      { id: "my-projects", label: "My labs", href: "/labs/mine" },
      { id: "collabs", label: "Collabs", soon: true },
    ],
  },
  {
    id: "community",
    label: "Community",
    icon: UsersIcon,
    children: [
      { id: "forums", label: "Forums", soon: true },
      { id: "mentorship", label: "Mentorship", soon: true },
      { id: "events", label: "Events", href: "/events" },
    ],
  },
  { id: "learn", label: "Learn", href: "/learn", icon: BookOpenIcon },
  { id: "messages", label: "Messages", icon: MessageCircleIcon, soon: true },
  { id: "leaderboard", label: "Leaderboard", href: "/leaderboard", icon: ChartBarIncreasingIcon },
  { id: "notifications", label: "Notifications", href: "/notifications", icon: BellIcon },
];

export const LINKS: NavItem[] = [
  {
    id: "whatsapp",
    label: "WhatsApp community",
    icon: WhatsAppIcon,
    external: "https://chat.whatsapp.com/HYphvnsGa4PAnoPxReTpHW",
  },
  {
    id: "support",
    label: "Support us",
    icon: HeartIcon,
    external: "https://hcb.hackclub.com/donations/start/teenovatex-labs?utm_source=app.teenovatex.org",
  },
  { id: "core-team", label: "Join the core team", icon: UserPlusIcon, external: "https://teenovatex.fillout.com/cftm" },
];
