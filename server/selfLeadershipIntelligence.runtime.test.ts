import { beforeEach, describe, expect, it, vi } from "vitest";

const invokeLLM = vi.fn();
vi.mock("./_core/llm", () => ({ invokeLLM }));

const modelAnalysis = {
  situation: "I did not question an unsupported architecture assumption in the review.",
  observedBehaviour: "I agreed and raised my concern only after the meeting.",
  diagnosticLens: "choosing",
  capabilitySignal: "No capability gap is established from this one situation.",
  judgmentSignal: "The available information suggests a concern was visible but not voiced in the forum.",
  selfLeadershipSignal: {
    primaryDimension: "courage",
    observation: "The concern was deferred rather than tested in the meeting.",
    evidence: ["One first-person account."],
    confidence: "high",
  },
  developmentalHypothesis: "One possibility worth exploring is whether the pace or power dynamic narrowed the available choices.",
  reflectionQuestion: "What did the conversation need from you that was difficult to offer at the time?",
  nextChoice: "Name the concern and ask one clarifying question in the next comparable review.",
  microExperiment: "In your next review, ask one evidence-seeking question before agreeing to a material assumption.",
  followUpSignal: "Notice whether the concern is raised while the decision can still change.",
  mirror: {
    whatWeAreNoticing: "A material concern was held until after the review.",
    whyItMayMatter: "The decision may proceed without the benefit of your perspective.",
    questionToConsider: "What did the conversation need from you?",
    experiment: "Ask one evidence-seeking question before agreeing.",
  },
};

describe("analyseSelfLeadershipWithMetadata", () => {
  beforeEach(() => vi.resetAllMocks());

  it("uses strict structured output and caps unsupported high confidence", async () => {
    invokeLLM.mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify(modelAnalysis) } }] });
    const { analyseSelfLeadershipWithMetadata } = await import("./selfLeadershipIntelligence");

    const result = await analyseSelfLeadershipWithMetadata({
      situation: modelAnalysis.situation,
      observedBehaviour: modelAnalysis.observedBehaviour,
      careerStage: "manager",
      evidence: ["One first-person account."],
    });

    expect(result.mode).toBe("model");
    expect(result.analysis.selfLeadershipSignal.confidence).toBe("low");
    expect(invokeLLM.mock.calls[0]?.[0]?.response_format).toMatchObject({ type: "json_schema" });
  });

  it("returns the safe deterministic fallback when structured model output is malformed", async () => {
    invokeLLM.mockResolvedValueOnce({ choices: [{ message: { content: "not valid json" } }] });
    const { analyseSelfLeadershipWithMetadata } = await import("./selfLeadershipIntelligence");

    const result = await analyseSelfLeadershipWithMetadata({
      situation: modelAnalysis.situation,
      careerStage: "manager",
    });

    expect(result.mode).toBe("fallback");
    expect(result.analysis.selfLeadershipSignal.confidence).toBe("low");
    expect(result.analysis.developmentalHypothesis).toMatch(/^One possibility worth exploring/);
  });
});
