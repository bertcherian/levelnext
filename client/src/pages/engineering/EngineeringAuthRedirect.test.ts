import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sources = {
  diagnostic: readFileSync("client/src/pages/engineering/EngineeringDiagnostic.tsx", "utf8"),
  profile: readFileSync("client/src/pages/engineering/EngineeringOperatingProfile.tsx", "utf8"),
  partner: readFileSync("client/src/pages/engineering/EngineeringPartnerWorkspace.tsx", "utf8"),
  provisioning: readFileSync("client/src/pages/engineering/EngineeringAdminProvisioning.tsx", "utf8"),
  evaluation: readFileSync("client/src/pages/engineering/EngineeringPromptEvaluation.tsx", "utf8"),
};

describe("Tech Intelligence authentication redirects", () => {
  it("preserves the intended destination for anonymous users", () => {
    expect(sources.diagnostic).toContain("/login?returnTo=%2Fengineering%2Fdiagnostic");
    expect(sources.profile).toContain("/login?returnTo=%2Fengineering%2Fprofile");
    expect(sources.partner).toContain("/login?returnTo=%2Fengineering%2Fpartner");
    expect(sources.provisioning).toContain("/login?returnTo=%2Fengineering%2Fadmin%2Fprovisioning");
    expect(sources.evaluation).toContain("/login?returnTo=%2Fengineering%2Fadmin%2Fprompt-evaluation");
    for (const source of Object.values(sources)) expect(source).not.toContain('navigate("/")');
  });
});
