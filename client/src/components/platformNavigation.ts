import {
  Activity,
  BarChart3,
  BookOpen,
  Briefcase,
  ClipboardList,
  Globe,
  Home,
  LayoutGrid,
  Lightbulb,
  MessageSquare,
  Settings,
  Zap,
} from "lucide-react";

export type PlatformNavItem = {
  label: string;
  icon: React.ElementType;
  href: string;
  badgeKey?: string;
};

export const CI_SEARCH_INDEX: { term: string; label: string; href: string }[] = [
  { term: "opportunities executive opportunity", label: "Opportunities", href: "/career/market-intel" },
  { term: "signals radar hiring expansion", label: "Radar Signals", href: "/career/market-intel" },
  { term: "relationships relationship graph contacts network", label: "Relationship Graph", href: "/career/market-intel" },
  { term: "access paths target organisations company", label: "Access Paths", href: "/career/market-intel" },
  { term: "outreach engine linkedin brand content", label: "Outreach Engine", href: "/career/market-intel" },
  { term: "resume makeover cv rewrite", label: "Resume Makeover", href: "/career/prepare" },
  { term: "interview prep mock questions", label: "Interview Prep", href: "/career/prepare" },
  { term: "negotiation salary offer compensation", label: "Negotiation Intelligence", href: "/career/prepare" },
  { term: "progress journey tracker completion", label: "Journey Progress", href: "/career/journey" },
  { term: "growth profile leadership scores", label: "Growth Profile", href: "/career/journey" },
];

export const CI_NAV_TOOLTIPS: Record<string, { description: string; subItems: string[] }> = {
  "/career": { description: "Your career transition dashboard", subItems: ["Edge Score", "Daily coach prompt", "Quick diagnostics"] },
  "/diagnostics": { description: "Run career intelligence assessments", subItems: ["Career Positioning", "Resilience", "Marketability", "+ 4 more"] },
  "/guide": { description: "AI coaching chat for career questions", subItems: ["Ask anything", "Personalised advice", "Unlock insights"] },
  "/practice": { description: "Role-play practice with AI feedback", subItems: ["Difficult conversations", "Executive presence", "Debrief & score"] },
  "/career/market-intel": { description: "Find and access your next opportunity", subItems: ["Opportunities", "Radar Signals", "Relationships", "Access Paths", "Outreach"] },
  "/career/prepare": { description: "Get ready to win the role", subItems: ["Resume Makeover", "Interview Prep", "Negotiation"] },
  "/career/journey": { description: "Track your progress and growth", subItems: ["Journey Progress", "Growth Profile"] },
  "/settings": { description: "Account and platform settings", subItems: [] },
};

export const CI_NAV_ITEMS: PlatformNavItem[] = [
  { label: "Career Home", icon: Briefcase, href: "/career" },
  { label: "Diagnostics", icon: LayoutGrid, href: "/diagnostics" },
  { label: "Guide", icon: MessageSquare, href: "/guide", badgeKey: "guide" },
  { label: "Practice", icon: Zap, href: "/practice" },
  { label: "Market Intel", icon: Globe, href: "/career/market-intel" },
  { label: "Prepare", icon: ClipboardList, href: "/career/prepare" },
  { label: "My Journey", icon: BarChart3, href: "/career/journey" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

export const MEP_NAV_ITEMS: PlatformNavItem[] = [
  { label: "Manager Home", icon: Home, href: "/manager" },
  { label: "Diagnostics", icon: LayoutGrid, href: "/manager/diagnostics" },
  { label: "Manager Guide", icon: MessageSquare, href: "/manager/guide" },
  { label: "Playbook", icon: BookOpen, href: "/manager/playbook" },
  { label: "Daily Brief", icon: Lightbulb, href: "/manager/brief" },
  { label: "Practice Partner", icon: Zap, href: "/manager/practice" },
  { label: "Commitments", icon: Activity, href: "/manager/commitments" },
  { label: "Settings", icon: Settings, href: "/settings" },
];
