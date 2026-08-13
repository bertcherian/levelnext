import { describe, expect, it } from "vitest";
import { aggregateCoachMirrorTrends, aggregateSelfLeadershipProgress, buildGuidedMirrorExperimentUpdate, buildGuidedMirrorFeedbackUpdate } from "./selfLeadershipMirrorHelpers";

describe("Guided Mirror behavioural helpers", () => {
  it("keeps a relevance rating and optional note scoped to the selected private mirror", () => {
    expect(buildGuidedMirrorFeedbackUpdate("up", "The experiment felt practical.")).toEqual({ relevance: "up", feedbackNote: "The experiment felt practical.", feedbackReason: null });
    expect(buildGuidedMirrorFeedbackUpdate("down")).toEqual({ relevance: "down", feedbackNote: null, feedbackReason: null });
    expect(buildGuidedMirrorFeedbackUpdate("down", undefined, "not_actionable")).toEqual({ relevance: "down", feedbackNote: null, feedbackReason: "not_actionable" });
  });

  it("captures an experiment attempt without changing the reflection content", () => {
    expect(buildGuidedMirrorExperimentUpdate("attempted")).toEqual({ experimentStatus: "attempted" });
  });

  it("aggregates only the supplied learner records across every dimension", () => {
    const dimensions = aggregateSelfLeadershipProgress([
      { primaryDimension: "courage", relevance: "up", experimentStatus: "attempted" },
      { primaryDimension: "courage", relevance: "down", experimentStatus: "not_started" },
      { primaryDimension: "integrity", relevance: null, experimentStatus: "not_started" },
    ]);
    const courage = dimensions.find((dimension) => dimension.id === "courage");
    const integrity = dimensions.find((dimension) => dimension.id === "integrity");
    const awareness = dimensions.find((dimension) => dimension.id === "self_awareness");

    expect(courage).toMatchObject({ reflections: 2, experimentsAttempted: 1, relevanceSignals: 1, progressLabel: "Experimenting" });
    expect(integrity).toMatchObject({ reflections: 1, experimentsAttempted: 0, progressLabel: "Noticing" });
    expect(awareness).toMatchObject({ reflections: 0, progressLabel: "Start noticing" });
  });

  it("compares 30-day and 90-day cohort trends only when both windows meet the five-signal threshold", () => {
    const now = new Date("2026-08-31T00:00:00.000Z");
    const makeSignals = (current: number, previous: number) => [
      ...Array.from({ length: current }, () => ({ dimension: "courage", distinctionId: "OD-22", createdAt: new Date("2026-08-20T00:00:00.000Z") })),
      ...Array.from({ length: previous }, () => ({ dimension: "courage", distinctionId: "OD-22", createdAt: new Date("2026-07-20T00:00:00.000Z") })),
    ];
    expect(aggregateCoachMirrorTrends(makeSignals(6, 5), 30, now)).toMatchObject([{ currentCount: 6, previousCount: 5, change: 1, direction: "up" }]);
    expect(aggregateCoachMirrorTrends(makeSignals(5, 6), 30, now)).toMatchObject([{ change: -1, direction: "down" }]);
    expect(aggregateCoachMirrorTrends(makeSignals(5, 5), 30, now)).toMatchObject([{ change: 0, direction: "steady" }]);
    expect(aggregateCoachMirrorTrends(makeSignals(4, 6), 30, now)).toEqual([]);
    expect(aggregateCoachMirrorTrends(makeSignals(6, 5), 90, now)).toEqual([]);
  });

  it("returns a positive 90-day comparison with the complete aggregate counts and direction", () => {
    const now = new Date("2026-08-31T00:00:00.000Z");
    const signals = [
      ...Array.from({ length: 7 }, () => ({ dimension: "integrity", distinctionId: "OD-14", createdAt: new Date("2026-06-20T00:00:00.000Z") })),
      ...Array.from({ length: 5 }, () => ({ dimension: "integrity", distinctionId: "OD-14", createdAt: new Date("2026-03-20T00:00:00.000Z") })),
    ];
    expect(aggregateCoachMirrorTrends(signals, 90, now)).toEqual([expect.objectContaining({ currentCount: 7, previousCount: 5, change: 2, direction: "up" })]);
  });
});
