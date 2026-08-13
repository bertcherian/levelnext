import { describe, expect, it } from "vitest";
import { aggregateSelfLeadershipProgress, buildGuidedMirrorExperimentUpdate, buildGuidedMirrorFeedbackUpdate } from "./selfLeadershipMirrorHelpers";

describe("Guided Mirror behavioural helpers", () => {
  it("keeps a relevance rating and optional note scoped to the selected private mirror", () => {
    expect(buildGuidedMirrorFeedbackUpdate("up", "The experiment felt practical.")).toEqual({ relevance: "up", feedbackNote: "The experiment felt practical." });
    expect(buildGuidedMirrorFeedbackUpdate("down")).toEqual({ relevance: "down", feedbackNote: null });
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
});
