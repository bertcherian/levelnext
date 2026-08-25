import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const projectFile = (name: string) => readFileSync(new URL(name, import.meta.url), "utf8");

describe("administrator control rollout", () => {
  it("gates Manager Effectiveness, Professional Effectiveness, and Early Career controls through the shared admin predicate", () => {
    for (const file of ["MEPLayout.tsx", "PELayout.tsx", "EarlyCareerLayout.tsx"]) {
      const source = projectFile(`./${file}`);
      expect(source).toContain('from "@/lib/adminControls"');
      expect(source).toContain("isPlatformAdministrator(user?.role)");
      expect(source).toContain("ADMINISTRATOR_CONTROLS");
    }
  });

  it("gates Launch controls and restores the shared desktop role-navigation section", () => {
    const launch = projectFile("./LaunchDarkLayout.tsx");
    expect(launch).toContain("isPlatformAdministrator(user?.role)");
    expect(launch).toContain("ADMINISTRATOR_CONTROLS.map");
    const careerAccess = projectFile("./CareerAccessLayout.tsx");
    expect(careerAccess).toContain("isPlatformAdministrator(user?.role)");
    expect(careerAccess).toContain("ADMINISTRATOR_CONTROLS.map");
    expect(projectFile("./PlatformLayout.tsx")).toContain('<RoleNavigationByRole role={user.role} isNavActive={isNavActive} compact />');
  });
});
