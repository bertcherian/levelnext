import { describe, expect, it } from "vitest";
import { getMepPracticeRole } from "./mepPracticeRoles";

describe("getMepPracticeRole", () => {
  it("makes the AI the manager's own senior leader for Managing Upwards", () => {
    const role = getMepPracticeRole("managing_upwards");

    expect(role.rolePlayAs).toBe("Your Manager");
    expect(role.counterpartRoleLabel).toBe("Senior Manager");
    expect(role.userRoleLabel).toContain("speaking to your own manager");
    expect(role.roleInstruction).toContain("USER (the human) is a MANAGER reporting to you");
    expect(role.roleInstruction).toContain("AI) are the user's own MANAGER / SENIOR LEADER");
  });

  it("keeps standard management sessions focused on a team member or stakeholder", () => {
    const role = getMepPracticeRole("feedback", "resistant");

    expect(role.rolePlayAs).toBe("Team Member");
    expect(role.counterpartRoleLabel).toBe("Team Member");
    expect(role.characterDescription).toContain("team member");
  });
});
