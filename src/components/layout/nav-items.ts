import { Camera, FileText, Gift, House, MapPin, Settings, User, type LucideIcon } from "lucide-react";
import { t } from "@/lib/i18n/messages";

export type NavItem = {
  href: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  /** Path prefix that marks this item active (defaults to href). */
  match?: string;
  /** Shown in the mobile bottom bar. */
  mobile: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: t.nav.dashboard, shortLabel: t.nav.home, icon: House, mobile: true },
  { href: "/bins", label: t.nav.bins, shortLabel: "Bins", icon: MapPin, mobile: true },
  { href: "/recycle/capture", label: t.nav.recycle, shortLabel: "Recycle", icon: Camera, match: "/recycle", mobile: true },
  { href: "/history", label: t.nav.history, shortLabel: t.nav.history, icon: FileText, mobile: true },
  { href: "/rewards", label: t.nav.rewards, shortLabel: t.nav.rewards, icon: Gift, mobile: true },
  { href: "/profile", label: t.nav.profile, shortLabel: t.nav.profile, icon: User, mobile: false },
  { href: "/settings", label: t.nav.settings, shortLabel: t.nav.settings, icon: Settings, mobile: false },
];

export function isNavActive(pathname: string, item: NavItem): boolean {
  const base = item.match ?? item.href;
  return pathname === base || pathname.startsWith(`${base}/`);
}
