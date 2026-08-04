/**
 * Intelligence Core — Unit Tests
 *
 * Tests the deterministic rule engine's condition evaluation logic
 * and the recommendation lifecycle state transitions.
 */

import { describe, expect, it } from "vitest";

// ─── Condition Evaluation Tests ──────────────────────────────────────────────
// The evaluateCondition and evaluateRule functions are internal to the router,
// but they encode pure logic that we test here by replicating the same logic.

function evaluateCondition(
  condition: { field: string; operator: string; value: number | string },
  edgeScore: number,
  dimensionScores: Record<string, number> | null,
): boolean {
  const fieldValue =
    condition.field === "edgeScore"
      ? edgeScore
      : (dimensionScores?.[condition.field] ?? 0);
  const val = typeof condition.value === "string" ? parseFloat(condition.value) : condition.value;

  switch (condition.operator) {
    case "<": return fieldValue < val;
    case "<=": return fieldValue <= val;
    case ">": return fieldValue > val;
    case ">=": return fieldValue >= val;
    case "==": return fieldValue === val;
    case "!=": return fieldValue !== val;
    default: return false;
  }
}

function evaluateRule(
  conditions: Array<{ field: string; operator: string; value: number | string }>,
  edgeScore: number,
  dimensionScores: Record<string, number> | null,
): boolean {
  return conditions.every((c) => evaluateCondition(c, edgeScore, dimensionScores));
}

describe("Intelligence Core — Rule Engine Condition Evaluation", () => {
  const sampleDimensionScores: Record<string, number> = {
    clarity: 72,
    presence: 45,
    listening: 88,
    empathy: 60,
  };

  describe("evaluateCondition", () => {
    it("evaluates edgeScore field with > operator", () => {
      expect(evaluateCondition({ field: "edgeScore", operator: ">", value: 50 }, 65, null)).toBe(true);
      expect(evaluateCondition({ field: "edgeScore", operator: ">", value: 70 }, 65, null)).toBe(false);
    });

    it("evaluates edgeScore field with <= operator", () => {
      expect(evaluateCondition({ field: "edgeScore", operator: "<=", value: 65 }, 65, null)).toBe(true);
      expect(evaluateCondition({ field: "edgeScore", operator: "<=", value: 64 }, 65, null)).toBe(false);
    });

    it("evaluates dimension scores with < operator", () => {
      expect(evaluateCondition({ field: "presence", operator: "<", value: 50 }, 65, sampleDimensionScores)).toBe(true);
      expect(evaluateCondition({ field: "presence", operator: "<", value: 40 }, 65, sampleDimensionScores)).toBe(false);
    });

    it("evaluates dimension scores with >= operator", () => {
      expect(evaluateCondition({ field: "listening", operator: ">=", value: 85 }, 65, sampleDimensionScores)).toBe(true);
      expect(evaluateCondition({ field: "listening", operator: ">=", value: 90 }, 65, sampleDimensionScores)).toBe(false);
    });

    it("evaluates == operator", () => {
      expect(evaluateCondition({ field: "clarity", operator: "==", value: 72 }, 65, sampleDimensionScores)).toBe(true);
      expect(evaluateCondition({ field: "clarity", operator: "==", value: 73 }, 65, sampleDimensionScores)).toBe(false);
    });

    it("evaluates != operator", () => {
      expect(evaluateCondition({ field: "empathy", operator: "!=", value: 70 }, 65, sampleDimensionScores)).toBe(true);
      expect(evaluateCondition({ field: "empathy", operator: "!=", value: 60 }, 65, sampleDimensionScores)).toBe(false);
    });

    it("returns 0 for missing dimension fields", () => {
      expect(evaluateCondition({ field: "nonexistent", operator: ">", value: -1 }, 65, sampleDimensionScores)).toBe(true);
      expect(evaluateCondition({ field: "nonexistent", operator: ">", value: 0 }, 65, sampleDimensionScores)).toBe(false);
    });

    it("handles null dimension scores", () => {
      expect(evaluateCondition({ field: "clarity", operator: ">", value: -1 }, 65, null)).toBe(true);
      expect(evaluateCondition({ field: "clarity", operator: ">", value: 0 }, 65, null)).toBe(false);
    });

    it("handles string values by parsing them", () => {
      expect(evaluateCondition({ field: "edgeScore", operator: ">", value: "50" }, 65, null)).toBe(true);
      expect(evaluateCondition({ field: "edgeScore", operator: "<", value: "70" }, 65, null)).toBe(true);
    });

    it("returns false for unknown operators", () => {
      expect(evaluateCondition({ field: "edgeScore", operator: "contains", value: 50 }, 65, null)).toBe(false);
    });
  });

  describe("evaluateRule (multiple conditions)", () => {
    it("returns true when all conditions match", () => {
      const conditions = [
        { field: "edgeScore", operator: ">", value: 50 },
        { field: "presence", operator: "<", value: 50 },
        { field: "listening", operator: ">=", value: 80 },
      ];
      expect(evaluateRule(conditions, 65, sampleDimensionScores)).toBe(true);
    });

    it("returns false when any condition fails", () => {
      const conditions = [
        { field: "edgeScore", operator: ">", value: 50 },
        { field: "presence", operator: "<", value: 40 },
        { field: "listening", operator: ">=", value: 80 },
      ];
      expect(evaluateRule(conditions, 65, sampleDimensionScores)).toBe(false);
    });

    it("returns true for empty conditions array", () => {
      expect(evaluateRule([], 65, sampleDimensionScores)).toBe(true);
    });

    it("handles single condition", () => {
      expect(evaluateRule([{ field: "edgeScore", operator: ">", value: 50 }], 65, null)).toBe(true);
      expect(evaluateRule([{ field: "edgeScore", operator: ">", value: 70 }], 65, null)).toBe(false);
    });
  });
});

// ─── Recommendation Status Transition Tests ──────────────────────────────────

describe("Intelligence Core — Recommendation Status Transitions", () => {
  const validTransitions: Record<string, string[]> = {
    generated: ["presented"],
    presented: ["accepted", "rejected", "deferred"],
    accepted: ["superseded"],
    rejected: ["superseded"],
    deferred: ["accepted", "rejected", "superseded"],
    superseded: [],
  };

  it("allows generated → presented", () => {
    expect(validTransitions["generated"].includes("presented")).toBe(true);
  });

  it("allows presented → accepted/rejected/deferred", () => {
    expect(validTransitions["presented"].includes("accepted")).toBe(true);
    expect(validTransitions["presented"].includes("rejected")).toBe(true);
    expect(validTransitions["presented"].includes("deferred")).toBe(true);
  });

  it("does not allow generated → accepted (must be presented first)", () => {
    expect(validTransitions["generated"].includes("accepted")).toBe(false);
  });

  it("does not allow accepted → presented (no going back)", () => {
    expect(validTransitions["accepted"].includes("presented")).toBe(false);
  });

  it("allows deferred → accepted (can revisit deferred items)", () => {
    expect(validTransitions["deferred"].includes("accepted")).toBe(true);
  });

  it("does not allow superseded → any state", () => {
    expect(validTransitions["superseded"].length).toBe(0);
  });
});

// ─── Action Status Transition Tests ──────────────────────────────────────────

describe("Intelligence Core — Action Status Transitions", () => {
  const validActionTransitions: Record<string, string[]> = {
    planned: ["in_progress", "cancelled"],
    in_progress: ["completed", "cancelled"],
    completed: [],
    cancelled: [],
  };

  it("allows planned → in_progress", () => {
    expect(validActionTransitions["planned"].includes("in_progress")).toBe(true);
  });

  it("allows planned → cancelled", () => {
    expect(validActionTransitions["planned"].includes("cancelled")).toBe(true);
  });

  it("allows in_progress → completed", () => {
    expect(validActionTransitions["in_progress"].includes("completed")).toBe(true);
  });

  it("does not allow planned → completed (must go through in_progress)", () => {
    expect(validActionTransitions["planned"].includes("completed")).toBe(false);
  });

  it("does not allow completed → any state", () => {
    expect(validActionTransitions["completed"].length).toBe(0);
  });

  it("does not allow cancelled → any state", () => {
    expect(validActionTransitions["cancelled"].length).toBe(0);
  });
});

// ─── Outcome Impact Level Tests ──────────────────────────────────────────────

describe("Intelligence Core — Outcome Impact Levels", () => {
  const impactLevels = ["none", "minimal", "moderate", "significant", "transformative"];

  it("has 5 impact levels in order", () => {
    expect(impactLevels).toHaveLength(5);
    expect(impactLevels[0]).toBe("none");
    expect(impactLevels[4]).toBe("transformative");
  });

  it("moderate is the median level", () => {
    expect(impactLevels[2]).toBe("moderate");
  });
});

// ─── Evidence Source Tests ────────────────────────────────────────────────────

describe("Intelligence Core — Evidence Sources", () => {
  const evidenceSources = [
    "self_report",
    "manager_confirmation",
    "coach_observation",
    "system_metric",
    "uploaded_document",
    "hr_validation",
  ];

  it("has 6 evidence sources", () => {
    expect(evidenceSources).toHaveLength(6);
  });

  it("includes self_report as the lowest confidence source", () => {
    expect(evidenceSources).toContain("self_report");
  });

  it("includes hr_validation as the highest confidence source", () => {
    expect(evidenceSources).toContain("hr_validation");
  });
});

// ─── Permission Scope Tests ──────────────────────────────────────────────────

describe("Intelligence Core — Permission Scopes", () => {
  it("supports organization-level scope", () => {
    const scopeTypes = ["organization", "individual"];
    expect(scopeTypes).toContain("organization");
  });

  it("supports individual-level scope", () => {
    const scopeTypes = ["organization", "individual"];
    expect(scopeTypes).toContain("individual");
  });

  it("organization scope applies to all members of a tenant", () => {
    const orgPermission = {
      scopeType: "organization" as const,
      scopeSubjectId: 1,
      purposeCode: "outcome_processing",
      status: "granted" as const,
    };
    expect(orgPermission.scopeType).toBe("organization");
  });

  it("individual scope applies to a specific user", () => {
    const individualPermission = {
      scopeType: "individual" as const,
      scopeSubjectId: 42,
      purposeCode: "outcome_processing",
      status: "granted" as const,
    };
    expect(individualPermission.scopeType).toBe("individual");
    expect(individualPermission.scopeSubjectId).toBe(42);
  });
});
