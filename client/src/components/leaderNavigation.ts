import type { ElementType } from "react";
import {
  Activity,
  BookOpen,
  Building2,
  Home,
  LayoutGrid,
  Lightbulb,
  MessageSquare,
  Settings,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";

export type LeaderNavigationItem = {
  label: string;
  icon: ElementType;
  href: string;
  badgeKey?: "guide";
};

export type LeaderNavigationGroup = {
  label: "Leadership" | "Resources" | "Workspace";
  items: LeaderNavigationItem[];
};

const LEADERSHIP_ITEMS: LeaderNavigationItem[] = [
  { label: "Home", icon: Home, href: "/home" },
  { label: "Guide", icon: MessageSquare, href: "/guide", badgeKey: "guide" },
  { label: "Practice", icon: Zap, href: "/practice" },
  { label: "My Edge", icon: TrendingUp, href: "/my-edge" },
  { label: "Growth", icon: Activity, href: "/growth-profile" },
  { label: "Diagnostics", icon: LayoutGrid, href: "/diagnostics" },
];

const EXPLORE_ITEMS: LeaderNavigationItem[] = [
  { label: "Insights & Reports", icon: Lightbulb, href: "/insights" },
  { label: "Playbook", icon: BookOpen, href: "/playbook" },
  { label: "Next Chapter", icon: Sparkles, href: "/next-chapter" },
];

const WORKSPACE_ITEMS: LeaderNavigationItem[] = [
  { label: "Organisation", icon: Building2, href: "/organisation" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

/**
 * Secondary experiences remain accessible, but the primary path stays focused
 * on the leadership loop: understand, prepare, practise, grow, and measure.
 */
export function getLeaderNavigationGroups(isTenantAdmin: boolean): LeaderNavigationGroup[] {
  const workspaceItems = WORKSPACE_ITEMS.filter(
    (item) => item.href !== "/organisation" || isTenantAdmin,
  );

  const groups: LeaderNavigationGroup[] = [
    { label: "Leadership", items: LEADERSHIP_ITEMS },
    { label: "Resources", items: EXPLORE_ITEMS },
    { label: "Workspace", items: workspaceItems },
  ];

  return groups.filter((group) => group.items.length > 0);
}

export const LEADER_BOTTOM_TABS: Array<LeaderNavigationItem | { label: "More"; icon: ElementType; href: null }> = [
  { label: "Home", icon: Home, href: "/home" },
  { label: "Guide", icon: MessageSquare, href: "/guide", badgeKey: "guide" },
  { label: "Practice", icon: Zap, href: "/practice" },
  { label: "Growth", icon: Activity, href: "/growth-profile" },
  { label: "More", icon: Sparkles, href: null },
];
