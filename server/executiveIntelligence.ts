import { invokeLLM } from "./_core/llm";
import {
  EXECUTIVE_INTELLIGENCES,
  type ExecutiveContext,
  type ExecutivePriority,
  type ExecutiveSituationAnalysis,
  buildExecutiveCoachDirective,
  createExecutiveAnalysisFallback,
} from "../shared/modules/executiveIntelligence";

function extractContent(content: unknown) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map((part: any) => part?.text ?? "").join("");
  return "";
}

function isExecutiveAnalysis(value: unknown): value is ExecutiveSituationAnalysis {
  const candidate = value as Partial<ExecutiveSituationAnalysis> | null;
  return Boolean(
    candidate &&
    typeof candidate.framing === "string" &&
    EXECUTIVE_INTELLIGENCES.some((item) => item.id === candidate.primaryIntelligence) &&
    Array.isArray(candidate.attentionItems) && candidate.attentionItems.length <= 3 &&
    typeof candidate.nextBestAction === "string" &&
    ["low", "moderate", "high"].includes(candidate.confidence ?? ""),
  );
}

export async function analyseExecutiveSituation(input: {
  situation: string;
  desiredOutcome?: string;
  stakes?: string;
  mode?: "prepare" | "think" | "challenge" | "debrief";
  context?: ExecutiveContext;
  priorities?: ExecutivePriority[];
}): Promise<ExecutiveSituationAnalysis> {
  const context = input.context ? JSON.stringify(input.context) : "Not yet established";
  const priorities = input.priorities?.map((priority) => `${priority.area}: ${priority.title}`).join("; ") || "Not yet established";
  const modeGuidance = {
    prepare: "Prepare for a consequential meeting or conversation. Clarify the desired business movement, stakeholder interests, the decision or commitment sought, and the one question that must be asked.",
    think: "Open the situation before solutioning. Identify what is known, what is interpreted, and which decision or framing may be premature.",
    challenge: "Challenge the current decision constructively. Test assumptions, options, trade-offs, unintended consequences, and reversibility without taking the decision away from the executive.",
    debrief: "Debrief an event that has already happened. Separate event, interpretation, action, impact, and learning; preserve useful learning without treating outcome as proof of decision quality.",
  }[input.mode ?? "think"];
  const prompt = `${buildExecutiveCoachDirective()}\n\nExecutive action mode: ${input.mode ?? "think"}. ${modeGuidance}\n\nExecutive context: ${context}\nMandate priorities: ${priorities}\nSituation: ${input.situation}\nDesired outcome: ${input.desiredOutcome ?? "Not supplied"}\nStakes: ${input.stakes ?? "Not supplied"}\n\nReturn JSON only with: framing, primaryIntelligence, attentionItems (maximum 3 objects with category,title,question,urgency), notice, interpretation, assumptions (array), alternativeOptions (array), tradeOff, stakeholderLens, decisionQuality, outcomeQuality, evidenceLevel (signal|repeated_signal|emerging_pattern|established_pattern), ontologicalDistinction (optional object label,inquiry,whyUseful), nextBestAction, confidence (low|moderate|high). Do not use false precision or claim motive as fact.`;
  try {
    const response = await invokeLLM({
      model: "claude-sonnet-4-6",
      messages: [{ role: "user", content: prompt }],
      maxTokens: 1800,
      response_format: { type: "json_object" },
    });
    const parsed = JSON.parse(extractContent(response.choices[0]?.message?.content));
    if (isExecutiveAnalysis(parsed)) return parsed;
  } catch {
    // Private, deterministic fallback maintains an executive's workflow if analysis is unavailable.
  }
  return createExecutiveAnalysisFallback(input);
}
