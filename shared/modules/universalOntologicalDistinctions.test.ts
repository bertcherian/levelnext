import { describe, expect, it } from "vitest";
import { UNIVERSAL_ONTOLOGICAL_DISTINCTIONS, buildUodlCoachDirective, createOntologyFallback } from "./universalOntologicalDistinctions";

describe("Universal Ontological Distinction Library", () => {
  it("contains the complete 25-distinction library with a natural-language inquiry and guardrail for each", () => {
    expect(UNIVERSAL_ONTOLOGICAL_DISTINCTIONS).toHaveLength(25);
    expect(UNIVERSAL_ONTOLOGICAL_DISTINCTIONS.map((item) => item.id)).toEqual(Array.from({ length: 25 }, (_, index) => `OD-${String(index + 1).padStart(2, "0")}`));
    expect(UNIVERSAL_ONTOLOGICAL_DISTINCTIONS.every((item) => item.inquiry.length > 10 && item.guardrail.length > 15)).toBe(true);
  });

  it("keeps ontology reasoning evidence-based, shallowest-useful, and non-moralising", () => {
    const directive = buildUodlCoachDirective();
    const fallback = createOntologyFallback({ situation: "A manager assumes silence means agreement in a planning meeting." });
    expect(directive).toContain("shallowest useful depth");
    expect(directive).toContain("Treat motives as hypotheses");
    expect(fallback.confidence).toBe("low");
    expect(fallback.primaryDistinctionId).toBe("OD-12");
    expect(fallback.microExperiment).toContain("observable facts");
  });
});
