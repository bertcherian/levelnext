import { invokeLLM } from "./_core/llm";
import {
  SELF_LEADERSHIP_DIMENSIONS,
  type SelfLeadershipAnalysis,
  type SelfLeadershipAnalysisInput,
  buildSelfLeadershipAnalysisSystemPrompt,
  createSelfLeadershipFallback,
} from "../shared/modules/selfLeadershipIntelligence";

function contentToString(content: unknown) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map((part: any) => part?.text ?? "").join("");
  return "";
}

function isAnalysis(value: unknown): value is SelfLeadershipAnalysis {
  const candidate = value as Partial<SelfLeadershipAnalysis> | null;
  return Boolean(
    candidate &&
    typeof candidate.situation === "string" &&
    typeof candidate.observedBehaviour === "string" &&
    ["knowing", "seeing", "choosing", "mixed"].includes(candidate.diagnosticLens ?? "") &&
    candidate.selfLeadershipSignal &&
    SELF_LEADERSHIP_DIMENSIONS.includes(candidate.selfLeadershipSignal.primaryDimension as any) &&
    ["low", "moderate", "high"].includes(candidate.selfLeadershipSignal.confidence ?? "") &&
    candidate.mirror,
  );
}

export type SelfLeadershipAnalysisOutcome = {
  analysis: SelfLeadershipAnalysis;
  mode: "model" | "fallback";
  modelId: string | null;
};

const SELF_LEADERSHIP_SCHEMA = {
  type: "object",
  properties: {
    situation: { type: "string" },
    observedBehaviour: { type: "string" },
    diagnosticLens: { type: "string", enum: ["knowing", "seeing", "choosing", "mixed"] },
    capabilitySignal: { type: "string" },
    judgmentSignal: { type: "string" },
    selfLeadershipSignal: {
      type: "object",
      properties: {
        primaryDimension: { type: "string", enum: ["self_awareness", "authenticity", "courage", "responsibility", "other_centredness", "integrity"] },
        observation: { type: "string" },
        evidence: { type: "array", items: { type: "string" } },
        confidence: { type: "string", enum: ["low", "moderate", "high"] },
      },
      required: ["primaryDimension", "observation", "evidence", "confidence"],
      additionalProperties: false,
    },
    developmentalHypothesis: { type: "string" },
    reflectionQuestion: { type: "string" },
    nextChoice: { type: "string" },
    microExperiment: { type: "string" },
    followUpSignal: { type: "string" },
    mirror: {
      type: "object",
      properties: {
        whatWeAreNoticing: { type: "string" },
        whyItMayMatter: { type: "string" },
        questionToConsider: { type: "string" },
        experiment: { type: "string" },
      },
      required: ["whatWeAreNoticing", "whyItMayMatter", "questionToConsider", "experiment"],
      additionalProperties: false,
    },
  },
  required: ["situation", "observedBehaviour", "diagnosticLens", "capabilitySignal", "judgmentSignal", "selfLeadershipSignal", "developmentalHypothesis", "reflectionQuestion", "nextChoice", "microExperiment", "followUpSignal", "mirror"],
  additionalProperties: false,
} as const;

function capUnsupportedConfidence(input: SelfLeadershipAnalysisInput, analysis: SelfLeadershipAnalysis): SelfLeadershipAnalysis {
  const evidenceCount = input.evidence?.filter(Boolean).length ?? 0;
  if (evidenceCount < 2 && analysis.selfLeadershipSignal.confidence === "high") {
    return { ...analysis, selfLeadershipSignal: { ...analysis.selfLeadershipSignal, confidence: "low" } };
  }
  return analysis;
}

export async function analyseSelfLeadershipWithMetadata(input: SelfLeadershipAnalysisInput): Promise<SelfLeadershipAnalysisOutcome> {
  try {
    const context = [
      `Situation: ${input.situation}`,
      input.observedBehaviour ? `Observed behaviour: ${input.observedBehaviour}` : "",
      input.role ? `Role: ${input.role}` : "",
      input.organisationalContext ? `Organisational context: ${input.organisationalContext}` : "",
      input.authorityLevel ? `Authority level: ${input.authorityLevel}` : "",
      input.stakeholders ? `Stakeholders: ${input.stakeholders}` : "",
      input.consequences ? `Consequences: ${input.consequences}` : "",
      input.availableInformation ? `Available information: ${input.availableInformation}` : "",
      input.culturalContext ? `Cultural context: ${input.culturalContext}` : "",
      input.powerDynamics ? `Power dynamics: ${input.powerDynamics}` : "",
      input.evidence?.length ? `Evidence supplied: ${input.evidence.map((item, index) => `${index + 1}. ${item}`).join(" ")}` : "",
    ].filter(Boolean).join("\n");

    const response = await invokeLLM({
      model: "claude-sonnet-4-6",
      messages: [
        { role: "system", content: buildSelfLeadershipAnalysisSystemPrompt(input) },
        { role: "user", content: context },
      ],
      maxTokens: 1400,
      response_format: { type: "json_schema", json_schema: { name: "self_leadership_analysis", strict: true, schema: SELF_LEADERSHIP_SCHEMA } },
    });
    const parsed = JSON.parse(contentToString(response.choices[0]?.message?.content));
    if (isAnalysis(parsed)) return { analysis: capUnsupportedConfidence(input, parsed), mode: "model", modelId: "claude-sonnet-4-6" };
  } catch {
    // The deterministic, privacy-safe fallback lets every Guide continue without a model response.
  }
  return { analysis: createSelfLeadershipFallback(input), mode: "fallback", modelId: null };
}

export async function analyseSelfLeadership(input: SelfLeadershipAnalysisInput): Promise<SelfLeadershipAnalysis> {
  return (await analyseSelfLeadershipWithMetadata(input)).analysis;
}
