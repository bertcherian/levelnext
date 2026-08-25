import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./AdminParticipantSearch.tsx", import.meta.url), "utf8");

describe("AdminParticipantSearch actions", () => {
  it("provides tenant-context, enrolment, and organisation-context controls for each searchable participant", () => {
    expect(source).toContain("View org");
    expect(source).toContain("Enrolments");
    expect(source).toContain("Org context");
    expect(source).toContain("setTenantId(participant.tenantId)");
    expect(source).toContain("getTenantScopedAdminHref");
  });
});
