import { describe, expect, it } from "vitest";
import { normaliseParticipantSearchQuery } from "./adminOperations";

describe("normaliseParticipantSearchQuery", () => {
  it("trims input and removes SQL wildcard characters before participant search", () => {
    expect(normaliseParticipantSearchQuery("  care%_metaresults.com  ")).toBe("caremetaresults.com");
  });
});
