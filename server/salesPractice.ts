import { invokeLLM, safeJsonParse } from "./_core/llm";
import type { CommercialJudgment, SalesPracticeDebrief, SalesPracticeMessage, SalesPracticeScenario } from "../shared/modules/salesIntelligence";

const scenarioFallback: SalesPracticeScenario = {
  buyerRole: "Buyer stakeholder",
  buyerStance: "Professional and cautious",
  openingLine: "I am open to understanding your view. What are you proposing?",
  challenge: "The buyer asks for direct evidence before agreeing to a next step.",
  successSignal: "A mutually clear next step tests the most consequential assumption.",
  evidenceBoundary: "This rehearsal uses only the seller-provided situation and should not be treated as a prediction of a real buyer.",
};

const debriefFallback: SalesPracticeDebrief = {
  strengths: ["You created space to make the commercial issue discussable."],
  tryNext: ["Ask one direct question that tests the most consequential assumption before proposing a solution."],
  evidenceQuestion: "What buyer evidence would change your next move?",
  keyTakeaway: "Use the rehearsal to test your approach, not to predict the buyer.",
  evidenceBoundary: "This debrief comments on the practice transcript, not the real buyer or account.",
};

const scenarioSchema = {
  type: "object", additionalProperties: false,
  properties: {
    buyerRole: { type: "string" }, buyerStance: { type: "string" }, openingLine: { type: "string" },
    challenge: { type: "string" }, successSignal: { type: "string" }, evidenceBoundary: { type: "string" },
  },
  required: ["buyerRole", "buyerStance", "openingLine", "challenge", "successSignal", "evidenceBoundary"],
};

const debriefSchema = {
  type: "object", additionalProperties: false,
  properties: {
    strengths: { type: "array", items: { type: "string" } }, tryNext: { type: "array", items: { type: "string" } },
    evidenceQuestion: { type: "string" }, keyTakeaway: { type: "string" }, evidenceBoundary: { type: "string" },
  },
  required: ["strengths", "tryNext", "evidenceQuestion", "keyTakeaway", "evidenceBoundary"],
};

function textOf(content: unknown, fallback: string) {
  return typeof content === "string" && content.trim() ? content.trim() : fallback;
}

export async function createSalesPracticeScenario(input: { buyerRole: string; objective?: string; rawSituation: string; desiredOutcome?: string; judgment?: CommercialJudgment | null }) {
  try {
    const result = await invokeLLM({
      model: "gpt-5-mini", maxTokens: 900,
      messages: [
        { role: "system", content: "You design ethical sales conversation rehearsals. Use only seller-provided context. Do not invent company facts, buyer motives, authority, budget, competitor claims, or timeline. The user is the SELLER. The AI will play the BUYER. Create a concise, realistic buyer stance that tests the seller's stated commercial constraint. This is rehearsal, not a prediction of the real buyer. Return JSON only." },
        { role: "user", content: `Situation:\n${input.rawSituation}\n\nDesired outcome: ${input.desiredOutcome || "Not provided"}\nPrimary constraint: ${input.judgment?.primaryConstraint || "Not yet assessed"}\nRecommended next move: ${input.judgment?.recommendedNextMove || "Ask a clarifying question"}\nBuyer role to rehearse: ${input.buyerRole}\nSeller objective for practice: ${input.objective || "Test a constructive next step"}` },
      ],
      outputSchema: { name: "sales_practice_scenario", strict: true, schema: scenarioSchema },
    });
    const parsed = safeJsonParse<SalesPracticeScenario>(textOf(result.choices[0]?.message.content, "{}"), scenarioFallback, "salesPractice.createScenario");
    return { ...scenarioFallback, ...parsed, buyerRole: input.buyerRole };
  } catch (error) {
    console.error("[Sales Practice] Scenario generation failed:", error);
    return { ...scenarioFallback, buyerRole: input.buyerRole };
  }
}

export async function continueSalesPractice(input: { scenario: SalesPracticeScenario; objective?: string | null; messages: SalesPracticeMessage[]; sellerMessage: string }) {
  try {
    const result = await invokeLLM({
      model: "gpt-5-mini", maxTokens: 600,
      messages: [
        { role: "system", content: `You are role-playing the BUYER in a private sales rehearsal. The USER is always the SELLER. You are the ${input.scenario.buyerRole}, never the seller or a sales coach. Buyer stance: ${input.scenario.buyerStance}. Challenge: ${input.scenario.challenge}. Seller practice objective: ${input.objective || "Test a constructive next step"}. Rules: react to the seller's words; do not invent account facts; do not predict the real buyer; do not give coaching feedback; be commercially professional; keep each response to 1–3 sentences.` },
        ...input.messages.map((message) => ({ role: message.role === "seller" ? "user" as const : "assistant" as const, content: message.content })),
        { role: "user", content: input.sellerMessage },
      ],
    });
    return textOf(result.choices[0]?.message.content, "I understand. What evidence would make this a useful next step for us?");
  } catch (error) {
    console.error("[Sales Practice] Buyer reply failed:", error);
    return "I understand. What evidence would make this a useful next step for us?";
  }
}

export async function debriefSalesPractice(input: { scenario: SalesPracticeScenario; objective?: string | null; messages: SalesPracticeMessage[] }) {
  const sellerTurns = input.messages.filter((message) => message.role === "seller").map((message) => message.content).join("\n\n");
  try {
    const result = await invokeLLM({
      model: "gpt-5-mini", maxTokens: 900,
      messages: [
        { role: "system", content: "You are an ethical sales coach debriefing a private rehearsal. Assess only what the seller actually said in the supplied transcript. Do not diagnose, score the person, or make claims about the real buyer. Identify specific strengths, one or two practical experiments for the next attempt, and one evidence-seeking question. Return concise JSON only." },
        { role: "user", content: `Practice objective: ${input.objective || "Not provided"}\nBuyer rehearsal: ${input.scenario.buyerRole}\nSuccess signal: ${input.scenario.successSignal}\n\nSeller turns:\n${sellerTurns || "No seller turns recorded."}` },
      ],
      outputSchema: { name: "sales_practice_debrief", strict: true, schema: debriefSchema },
    });
    const parsed = safeJsonParse<SalesPracticeDebrief>(textOf(result.choices[0]?.message.content, "{}"), debriefFallback, "salesPractice.debrief");
    return { ...debriefFallback, ...parsed, strengths: parsed.strengths.slice(0, 3), tryNext: parsed.tryNext.slice(0, 3) };
  } catch (error) {
    console.error("[Sales Practice] Debrief failed:", error);
    return debriefFallback;
  }
}
