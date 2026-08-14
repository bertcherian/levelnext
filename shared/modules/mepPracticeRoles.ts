export type MepPracticeRoleProfile = {
  userRoleLabel: string;
  rolePlayAs: string;
  counterpartRoleLabel: string;
  characterDescription: string;
  roleInstruction: string;
  openingPerspective: string;
};

const EMPLOYEE_PERSONALITIES: Record<string, string> = {
  realistic: "a realistic, thoughtful team member",
  resistant: "a defensive team member who pushes back respectfully",
  emotional: "an emotionally invested team member who becomes upset easily",
  passive: "a quiet, disengaged team member who gives minimal responses",
  aggressive: "an assertive team member who challenges assumptions directly",
};

const SENIOR_LEADER_PERSONALITIES: Record<string, string> = {
  realistic: "a realistic, moderately busy senior leader who values concise, well-reasoned updates",
  resistant: "a sceptical senior leader who tests the manager's assumptions and evidence",
  emotional: "a senior leader under pressure who reacts strongly to difficult news",
  passive: "a distracted senior leader who offers limited signals and expects the manager to create clarity",
  aggressive: "a demanding senior leader who challenges the manager directly while expecting composure",
};

/**
 * Defines a stable role contract for every MEP practice session. The human is
 * always a manager/leader. In Managing Upwards, the AI is specifically the
 * manager's own senior leader—not a member of the manager's team.
 */
export function getMepPracticeRole(
  scenarioId: string,
  personality = "realistic",
): MepPracticeRoleProfile {
  if (scenarioId === "managing_upwards") {
    return {
      userRoleLabel: "You are the manager, speaking to your own manager",
      rolePlayAs: "Your Manager",
      counterpartRoleLabel: "Senior Manager",
      characterDescription: SENIOR_LEADER_PERSONALITIES[personality] ?? SENIOR_LEADER_PERSONALITIES.realistic,
      roleInstruction: `IMPORTANT ROLE ASSIGNMENT:
- The USER (the human) is a MANAGER reporting to you.
- YOU (the AI) are the user's own MANAGER / SENIOR LEADER.
- The user is practising how to manage upwards: giving you a difficult update, seeking a decision, or pushing back constructively.
- React as the senior leader. Never speak as the user's direct report and never give the manager's lines.`,
      openingPerspective: "the senior leader's perspective, inviting the manager to begin their update",
    };
  }

  return {
    userRoleLabel: "You are the manager",
    rolePlayAs: "Team Member",
    counterpartRoleLabel: "Team Member",
    characterDescription: EMPLOYEE_PERSONALITIES[personality] ?? EMPLOYEE_PERSONALITIES.realistic,
    roleInstruction: `IMPORTANT ROLE ASSIGNMENT:
- The USER (the human) is the MANAGER / LEADER.
- YOU (the AI) are the manager's TEAM MEMBER or relevant stakeholder.
- React to the manager naturally. Never speak as the manager and never give the manager's lines.`,
    openingPerspective: "the team member's or stakeholder's perspective",
  };
}
