import { invokeLLM, safeJsonParse } from "./_core/llm";
import type { CommercialJudgment } from "../shared/modules/salesIntelligence";

const FALLBACK_JUDGMENT: CommercialJudgment = {
  whatIsHappening: "A live commercial situation has been captured for examination.",
  whatWeKnow: [], whatWeAreAssuming: [], whatMattersMost: "Separate direct evidence from interpretation before choosing the next move.",
  primaryConstraint: "Insufficient verified commercial context", constraintEvidence: [], confidence: "low",
  missingInformation: ["What direct customer evidence would change the decision?"],
  recommendedNextMove: "Ask one clarifying customer question that tests the most consequential assumption.",
  alternativeMove: "Pause irreversible commercial concessions until the assumption is tested.",
  whatWouldChangeJudgment: "Direct customer evidence about decision ownership, urgency, or value.",
  practicePrompt: "Practice asking one direct, evidence-seeking question with calm commercial curiosity.",
};

const judgmentSchema = {
  type: "object", additionalProperties: false,
  properties: {
    whatIsHappening: { type: "string" }, whatWeKnow: { type: "array", items: { type: "string" } },
    whatWeAreAssuming: { type: "array", items: { type: "string" } }, whatMattersMost: { type: "string" },
    primaryConstraint: { type: "string" }, constraintEvidence: { type: "array", items: { type: "string" } },
    confidence: { type: "string", enum: ["low", "moderate", "high"] }, missingInformation: { type: "array", items: { type: "string" } },
    recommendedNextMove: { type: "string" }, alternativeMove: { type: "string" },
    whatWouldChangeJudgment: { type: "string" }, practicePrompt: { type: "string" },
  },
  required: ["whatIsHappening", "whatWeKnow", "whatWeAreAssuming", "whatMattersMost", "primaryConstraint", "constraintEvidence", "confidence", "missingInformation", "recommendedNextMove", "alternativeMove", "whatWouldChangeJudgment", "practicePrompt"],
};

export async function analyzeCommercialSituation(input: { situation: string; desiredOutcome?: string; accountName?: string }): Promise<CommercialJudgment> {
  try {
    const result = await invokeLLM({
      model: "gpt-5-mini", maxTokens: 1800,
      messages: [
        { role: "system", content: "You are LevelNext Sales Intelligence, a commercially rigorous coach. Reason only from the seller-provided narrative. Never invent customer facts, stakeholder roles, business value, competitor claims, or timelines. Separate observation/evidence from interpretation and assumption. If evidence is thin, say so and ask what would materially change judgment. Recommend one highest-leverage, ethical next move; never encourage deception, false urgency, or manipulation. Return concise JSON only." },
        { role: "user", content: `Commercial situation:\n${input.situation}\n\nDesired outcome: ${input.desiredOutcome || "Not provided"}\nAccount: ${input.accountName || "Not provided"}` },
      ],
      outputSchema: { name: "commercial_judgment", strict: true, schema: judgmentSchema },
    });
    const content = result.choices[0]?.message.content;
    if (typeof content !== "string") return { ...FALLBACK_JUDGMENT, whatWeKnow: [input.situation] };
    const judgment = safeJsonParse<CommercialJudgment>(content, FALLBACK_JUDGMENT, "salesIntelligence.analyzeCommercialSituation");
    return { ...FALLBACK_JUDGMENT, ...judgment, whatWeKnow: judgment.whatWeKnow.slice(0, 5), whatWeAreAssuming: judgment.whatWeAreAssuming.slice(0, 5), missingInformation: judgment.missingInformation.slice(0, 4), constraintEvidence: judgment.constraintEvidence.slice(0, 4) };
  } catch (error) {
    console.error("[Sales Intelligence] Commercial analysis failed:", error);
    return { ...FALLBACK_JUDGMENT, whatWeKnow: [input.situation] };
  }
}
