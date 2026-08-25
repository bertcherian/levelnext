export type CriticalThinkingTenantRole = "owner" | "admin" | "member";

export function isCriticalThinkingTenantAdmin(role: unknown): role is "owner" | "admin" {
  return role === "owner" || role === "admin";
}

export function canShowCriticalThinkingTeamReport(completedParticipants: number, minimumGroupSize: number): boolean {
  return Number.isInteger(completedParticipants)
    && Number.isInteger(minimumGroupSize)
    && minimumGroupSize >= 5
    && completedParticipants >= minimumGroupSize;
}
