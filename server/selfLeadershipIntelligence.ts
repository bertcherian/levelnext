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

export async function analyseSelfLeadership(input: SelfLeadershipAnalysisInput): Promise<SelfLeadershipAnalysis> {
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
      response_format: { type: "json_object" },
    });
    const parsed = JSON.parse(contentToString(response.choices[0]?.message?.content));
    if (isAnalysis(parsed)) return parsed;
  } catch {
    // The deterministic, privacy-safe fallback lets every Guide continue without a model response.
  }
  return createSelfLeadershipFallback(input);
}
