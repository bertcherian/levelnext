import { invokeLLM } from "./_core/llm";
import {
  ONTOLOGY_DEPTHS,
  ONTOLOGY_GAPS,
  UNIVERSAL_ONTOLOGICAL_DISTINCTIONS,
  buildUodlCoachDirective,
  createOntologyFallback,
  type OntologyReasoning,
  type OntologyReasoningInput,
} from "../shared/modules/universalOntologicalDistinctions";

function contentToString(content: unknown) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map((part: any) => part?.text ?? "").join("");
  return "";
}

function isOntologyReasoning(value: unknown): value is OntologyReasoning {
  const candidate = value as Partial<OntologyReasoning> | null;
  return Boolean(candidate && ONTOLOGY_GAPS.includes(candidate.primaryGap as any) && ONTOLOGY_DEPTHS.includes(candidate.recommendedDepth as any) && ["low", "moderate", "high"].includes(candidate.confidence ?? "") && typeof candidate.reflectionQuestion === "string" && typeof candidate.microExperiment === "string");
}

export async function analyseOntology(input: OntologyReasoningInput): Promise<OntologyReasoning> {
  try {
    const distinctionCatalog = UNIVERSAL_ONTOLOGICAL_DISTINCTIONS.map((item) => `${item.id} ${item.label}: ${item.inquiry}`).join("\n");
    const response = await invokeLLM({
      model: "claude-sonnet-4-6",
      maxTokens: 1200,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: `${buildUodlCoachDirective()}\n\nReturn JSON only with primaryGap, primaryDistinctionId, secondaryDistinctionId, evidence, counterEvidence, confidence, observerHypothesis, alternativeExplanations, recommendedDepth, reflectionQuestion, microExperiment, successSignal, and doNotSurface. Use at most two distinctions. Put internal-only hypotheses in doNotSurface; never make unsupported assumptions.\n\nAVAILABLE DISTINCTIONS:\n${distinctionCatalog}` },
        { role: "user", content: [`Situation: ${input.situation}`, input.observedBehaviour ? `Observed behaviour: ${input.observedBehaviour}` : "", input.context ? `Context: ${input.context}` : "", input.powerDynamics ? `Power dynamics: ${input.powerDynamics}` : "", input.evidence?.length ? `Evidence: ${input.evidence.join(" | ")}` : ""].filter(Boolean).join("\n") },
      ],
    });
    const parsed = JSON.parse(contentToString(response.choices[0]?.message?.content));
    if (isOntologyReasoning(parsed)) return parsed;
  } catch { /* deterministic fallback keeps coaching flows available */ }
  return createOntologyFallback(input);
}
