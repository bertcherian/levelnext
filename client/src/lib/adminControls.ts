import type { LucideIcon } from "lucide-react";
import { Building2, LayoutDashboard, Link2, Upload, UserCog, Globe } from "lucide-react";

export type AdministratorControl = {
  label: string;
  href: string;
  icon: LucideIcon;
};

/**
 * Controls available only to platform administrators. Product shells use this
 * catalogue to keep the administrator experience consistent without exposing
 * management capabilities to participants.
 */
export const ADMINISTRATOR_CONTROLS: AdministratorControl[] = [
  { label: "Admin Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Organisation Setup", href: "/enterprise-onboarding", icon: Building2 },
  { label: "Organisation Context", href: "/admin/org-context", icon: Globe },
  { label: "Manage Invites", href: "/admin/invites", icon: Link2 },
  { label: "Import Participants", href: "/admin/participants/import", icon: Upload },
  { label: "Product Enrollments", href: "/admin/enrollments", icon: UserCog },
];

export function isPlatformAdministrator(role: string | null | undefined) {
  return role === "admin";
}
