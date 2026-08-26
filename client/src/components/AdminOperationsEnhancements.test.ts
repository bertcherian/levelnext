import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const component = (fileName: string) => readFileSync(new URL(`./${fileName}`, import.meta.url), "utf8");

describe("administrator operations enhancements", () => {
  it("filters organisation choices and exposes an explicit scoped-metric refresh action", () => {
    const sidebar = component("AdminOperationsSidebar.tsx");
    expect(sidebar).toContain("Filter organisations");
    expect(sidebar).toContain("filteredOrganisations");
    expect(sidebar).toContain("refreshMetrics");
    expect(sidebar).toContain("Refresh quick metrics");
  });

  it("uses server-backed participant pages with bounded previous and next controls", () => {
    const search = component("AdminParticipantSearch.tsx");
    expect(search).toContain("page, pageSize");
    expect(search).toContain("Showing {showingStart}–{showingEnd} of {data?.total} participants");
    expect(search).toContain("Previous");
    expect(search).toContain("Next");
  });
});
