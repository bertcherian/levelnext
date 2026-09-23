import { describe, expect, it } from "vitest";
import { deriveManagerDevelopmentAltitude, MANAGER_ALTITUDE_QUESTIONS } from "./managerAltitude";

describe("Manager development altitude intake", () => {
  it("defines exactly four calibration questions", () => {
    expect(MANAGER_ALTITUDE_QUESTIONS).toHaveLength(4);
    expect(MANAGER_ALTITUDE_QUESTIONS.map((q) => q.id)).toEqual([
      "scope",
      "current_pattern",
      "growth_edge",
      "confidence",
    ]);
  });

  it("derives foundation altitude for early doing responses", () => {
    const result = deriveManagerDevelopmentAltitude({
      scope: "own_work",
      current_pattern: "doing",
      growth_edge: "delegation",
      confidence: "not_yet",
    });
    expect(result.altitude).toBe("foundation");
    expect(result.score).toBeLessThanOrEqual(37);
    expect(result.focus).toContain("Make one leadership response more deliberate");
  });

  it("derives building altitude for small team directing patterns", () => {
    const result = deriveManagerDevelopmentAltitude({
      scope: "lead_team",
      current_pattern: "directing",
      growth_edge: "feedback",
      confidence: "curious",
    });
    expect(result.altitude).toBe("building");
    expect(result.score).toBeGreaterThan(37);
    expect(result.score).toBeLessThanOrEqual(62);
  });

  it("derives multiplying altitude for system-level leaders", () => {
    const result = deriveManagerDevelopmentAltitude({
      scope: "lead_system",
      current_pattern: "multiplying",
      growth_edge: "strategic_capacity",
      confidence: "committed",
    });
    expect(result.altitude).toBe("multiplying");
    expect(result.score).toBe(100);
    expect(result.label).toBe("Multiplying leadership");
  });
});
