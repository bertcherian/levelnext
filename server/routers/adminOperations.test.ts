import { describe, expect, it } from "vitest";
import { getParticipantSearchOffset, getScopedOrganisationCount, normaliseParticipantSearchQuery } from "./adminOperations";

describe("normaliseParticipantSearchQuery", () => {
  it("trims input and removes SQL wildcard characters before participant search", () => {
    expect(normaliseParticipantSearchQuery("  care%_metaresults.com  ")).toBe("caremetaresults.com");
  });
});

describe("getScopedOrganisationCount", () => {
  it("reports one organisation when a specific client workspace is active", () => {
    expect(getScopedOrganisationCount(12, 7)).toBe(1);
    expect(getScopedOrganisationCount(12, null)).toBe(12);
  });
});

describe("getParticipantSearchOffset", () => {
  it("calculates bounded page offsets for server-backed search pagination", () => {
    expect(getParticipantSearchOffset(1, 10)).toBe(0);
    expect(getParticipantSearchOffset(3, 10)).toBe(20);
    expect(getParticipantSearchOffset(0, 10)).toBe(0);
  });
});
