import {
  Brain,
  CalendarHeart,
  Dumbbell,
  HeartHandshake,
  HeartPulse,
  House,
  MessageCircleHeart,
  Salad,
  Settings,
  Sprout,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";

export interface Tab {
  label: string;
  href: string;
}

export interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  tabs?: Tab[];
  /** Extra paths that count as this item. */
  also?: string[];
}

export const TODAY_TABS: Tab[] = [
  { label: "Today", href: "/app" },
  { label: "Checklist", href: "/app/checklist" },
];

export const HEALTH_TABS: Tab[] = [
  { label: "Health check", href: "/app/health" },
  { label: "My reports", href: "/app/reports" },
  { label: "Sugar and body", href: "/app/logs" },
  { label: "Doctor summary", href: "/app/report" },
];

export const CARE_TABS: Tab[] = [
  { label: "Contraception", href: "/app/care" },
  { label: "Screenings", href: "/app/screenings" },
  { label: "Pain diary", href: "/app/pain" },
  { label: "Intimate health", href: "/app/intimate" },
  { label: "Talk to an expert", href: "/app/expert" },
];

export const SETTINGS_TABS: Tab[] = [
  { label: "Settings", href: "/app/settings" },
  { label: "Privacy", href: "/app/privacy" },
  { label: "Recommend", href: "/app/recommend" },
];

/** The 11 menu items. Labels for Companion and My stage are filled in per profile. */
export const NAV: NavItem[] = [
  { key: "today", label: "Today", href: "/app", icon: House, tabs: TODAY_TABS },
  { key: "cycle", label: "Cycle", href: "/app/cycle", icon: CalendarHeart },
  { key: "nourish", label: "Nourish", href: "/app/nourish", icon: Salad },
  { key: "move", label: "Move", href: "/app/move", icon: Dumbbell },
  { key: "mind", label: "Mind", href: "/app/mind", icon: Brain },
  { key: "companion", label: "Bestie", href: "/app/companion", icon: MessageCircleHeart },
  { key: "stage", label: "My stage", href: "/app/stage", icon: Sprout, also: ["/app/pregnancy", "/app/birth-plan"] },
  { key: "health", label: "Health", href: "/app/health", icon: Stethoscope, tabs: HEALTH_TABS },
  { key: "care", label: "Care", href: "/app/care", icon: HeartPulse, tabs: CARE_TABS, also: ["/app/contraception"] },
  { key: "circle", label: "Circle", href: "/app/circle", icon: HeartHandshake },
  { key: "settings", label: "Settings", href: "/app/settings", icon: Settings, tabs: SETTINGS_TABS },
];

function samePath(a: string, b: string) {
  return a === b || a === `${b}/`;
}

/** Which menu item a path belongs to. */
export function navItemFor(pathname: string): NavItem | undefined {
  return NAV.find(
    (n) =>
      samePath(pathname, n.href) ||
      n.tabs?.some((t) => samePath(pathname, t.href)) ||
      n.also?.some((p) => pathname.startsWith(p)) ||
      (n.href !== "/app" && pathname.startsWith(`${n.href}/`)),
  );
}

export function activeTab(pathname: string): { tabs: Tab[]; current: Tab } | undefined {
  const item = navItemFor(pathname);
  if (!item?.tabs) return undefined;
  const current = item.tabs.find((t) => samePath(pathname, t.href));
  return current ? { tabs: item.tabs, current } : undefined;
}

/** Bottom bar on phones. */
export const BOTTOM_KEYS = ["today", "cycle", "nourish", "companion"] as const;
