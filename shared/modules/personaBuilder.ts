import { z } from "zod";

export const PERSONA_INTERVENTIONS = [
  "persona",
  "skill",
  "information",
  "state",
  "context",
  "simulation",
  "more_information",
] as const;
export type PersonaIntervention = (typeof PERSONA_INTERVENTIONS)[number];

export const PERSONA_JOURNEY_STAGES = [
  "discovery",
  "pattern",
  "commitment",
  "persona",
  "rep",
  "evidence",
  "completed",
] as const;
export type PersonaJourneyStage = (typeof PERSONA_JOURNEY_STAGES)[number];

export const PERSONA_PROVENANCE_KINDS = [
  "user_stated",
  "ai_observed",
  "ai_hypothesis",
  "user_confirmed",
  "third_party_reported",
  "outcome_evidence",
] as const;
export type PersonaProvenanceKind = (typeof PERSONA_PROVENANCE_KINDS)[number];

export const personaProvenanceSchema = z.object({
  kind: z.enum(PERSONA_PROVENANCE_KINDS),
  sourceType: z.string().trim().min(1).max(80),
  sourceId: z.number().int().positive().optional(),
  confidence: z.enum(["low", "moderate", "high"]).optional(),
  limitations: z.array(z.string().trim().min(1).max(300)).max(6).default([]),
  createdAt: z.string(),
});
export type PersonaProvenance = z.infer<typeof personaProvenanceSchema>;

export const personaPatternSchema = z.object({
  currentObserver: z.string().trim().min(5).max(500),
  possiblePattern: z.string().trim().min(5).max(800),
  facts: z.array(z.string().trim().min(2).max(500)).min(1).max(6),
  alternatives: z.array(z.string().trim().min(5).max(500)).min(1).max(4),
  gapType: z.enum(["identity", "state", "skill", "information", "behavior", "context", "power", "mixed"]),
  intervention: z.enum(PERSONA_INTERVENTIONS),
  rationale: z.string().trim().min(5).max(800),
  safetyNote: z.string().trim().max(500).default("Treat this as a working hypothesis and adapt it to the context."),
});
export type PersonaPattern = z.infer<typeof personaPatternSchema>;

export const personaCandidateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  purpose: z.string().trim().min(5).max(300),
  observer: z.string().trim().min(5).max(400),
  commitments: z.array(z.string().trim().min(3).max(240)).min(1).max(4),
  powers: z.array(z.string().trim().min(2).max(80)).min(1).max(5),
  signatureBehaviors: z.array(z.string().trim().min(3).max(240)).min(1).max(5),
  underPressure: z.string().trim().min(5).max(300),
  signatureMove: z.string().trim().min(5).max(300),
  shadow: z.string().trim().min(5).max(240),
  activationPhrase: z.string().trim().min(2).max(120),
  contextBoundaries: z.array(z.string().trim().min(3).max(240)).min(1).max(4),
});
export type PersonaCandidate = z.infer<typeof personaCandidateSchema>;

export const personaRepContentSchema = z.object({
  instruction: z.string().trim().min(5).max(400),
  trigger: z.string().trim().min(5).max(240),
  successSignal: z.string().trim().min(5).max(400),
  fallbackIfUnsafe: z.string().trim().min(5).max(400),
  difficulty: z.number().int().min(1).max(5),
});
export type PersonaRepContent = z.infer<typeof personaRepContentSchema>;

export const startPersonaJourneySchema = z.object({
  situation: z.string().trim().min(12).max(3000),
  desiredOutcome: z.string().trim().min(8).max(1200),
  role: z.string().trim().max(180).optional(),
  sourceApp: z.string().trim().min(2).max(80).default("persona_builder"),
});
export type StartPersonaJourneyInput = z.infer<typeof startPersonaJourneySchema>;

export const addPersonaEpisodeSchema = z.object({
  journeyId: z.number().int().positive(),
  episodeText: z.string().trim().min(20).max(5000),
});
export type AddPersonaEpisodeInput = z.infer<typeof addPersonaEpisodeSchema>;

export const analysePersonaPatternSchema = z.object({
  journeyId: z.number().int().positive(),
});

export const createPersonaCommitmentSchema = z.object({
  journeyId: z.number().int().positive(),
  statement: z.string().trim().min(5).max(400),
  observableBehavior: z.string().trim().min(5).max(500),
});

export const selectPersonaSchema = z.object({
  journeyId: z.number().int().positive(),
  candidateIndex: z.number().int().min(0).max(2),
});

export const createPersonaRepSchema = z.object({
  journeyId: z.number().int().positive(),
});

export const recordPersonaCheckinSchema = z.object({
  repId: z.number().int().positive(),
  opportunityStatus: z.enum(["arose", "did_not_arise", "unclear"]),
  executionStatus: z.enum(["yes", "partly", "no", "not_applicable"]),
  reflection: z.string().trim().max(2000).optional().default(""),
  outcome: z.string().trim().max(2000).optional().default(""),
});

export type PersonaCheckinInput = z.infer<typeof recordPersonaCheckinSchema>;

export const personaJourneyStatusSchema = z.enum(["active", "paused", "completed", "abandoned"]);
export const personaIntegrationStatusSchema = z.enum([
  "scaffold_needed",
  "scaffold_can_be_activated",
  "less_activation_needed",
  "increasingly_natural",
  "integrated",
]);

export function chooseFallbackIntervention(text: string): PersonaIntervention {
  const lower = text.toLowerCase();
  if (/(retaliat|unsafe|power dynamic|authority|politic|consequence)/.test(lower)) return "context";
  if (/(don't know how|do not know how|method|skill|technique|process)/.test(lower)) return "skill";
  if (/(not enough information|more information|unclear facts|need data)/.test(lower)) return "information";
  if (/(panic|anxious|overwhelmed|freeze|nervous)/.test(lower)) return "state";
  return "persona";
}

export function deriveNextPersonaAction(
  opportunityStatus: PersonaCheckinInput["opportunityStatus"],
  executionStatus: PersonaCheckinInput["executionStatus"],
): "keep_rep" | "repeat_with_adjustment" | "increase_difficulty" | "simplify_and_practice" {
  if (opportunityStatus !== "arose") return "keep_rep";
  if (executionStatus === "yes") return "increase_difficulty";
  if (executionStatus === "partly") return "repeat_with_adjustment";
  return "simplify_and_practice";
}

export const PERSONA_PATTERN_FALLBACK: PersonaPattern = {
  currentObserver: "This situation may be carrying more meaning than the observable facts alone support.",
  possiblePattern: "Under pressure, the current response may narrow the available behavioural choices.",
  facts: ["A real workplace situation was described and needs further observation."],
  alternatives: [
    "The moment may be an opportunity to test the thinking rather than prove personal competence.",
    "The current response may be a useful protection that needs a more flexible option in this context.",
  ],
  gapType: "mixed",
  intervention: "persona",
  rationale: "A small, observable experiment is the safest way to learn what this Moment requires.",
  safetyNote: "This is an exploratory hypothesis, not a diagnosis or objective fact.",
};

export const PERSONA_CANDIDATE_FALLBACKS: PersonaCandidate[] = [
  {
    name: "The Clarifier",
    purpose: "Create shared understanding before reacting.",
    observer: "A difficult moment is information about what needs to become clear.",
    commitments: ["Clarity over assumption."],
    powers: ["Curiosity", "Composure"],
    signatureBehaviors: ["Ask one clarifying question before explaining."],
    underPressure: "Slow down and make the assumption visible.",
    signatureMove: "Ask → Listen → Name the decision.",
    shadow: "Questions can become avoidance.",
    activationPhrase: "Make it clear.",
    contextBoundaries: ["Do not use questions to delay a necessary decision."],
  },
  {
    name: "The Contributor",
    purpose: "Bring a useful point of view without over-proving.",
    observer: "The work improves when the relevant contribution is made visible.",
    commitments: ["Contribution over proving."],
    powers: ["Perspective", "Courage"],
    signatureBehaviors: ["State the recommendation early and name the trade-off."],
    underPressure: "Return to the outcome and the evidence.",
    signatureMove: "Frame → Position → Recommend.",
    shadow: "Directness can become premature certainty.",
    activationPhrase: "Make the contribution.",
    contextBoundaries: ["Do not ignore missing information or legitimate authority."],
  },
  {
    name: "The Steward",
    purpose: "Protect the outcome while preserving the relationship and context.",
    observer: "Responsible leadership includes reading consequences before acting.",
    commitments: ["Purpose over self-protection."],
    powers: ["Judgment", "Care"],
    signatureBehaviors: ["Name the risk, ask for alignment, and agree the next step."],
    underPressure: "Choose the safest useful action rather than forcing confrontation.",
    signatureMove: "Notice → Name → Next step.",
    shadow: "Care can become over-accommodation.",
    activationPhrase: "Protect what matters.",
    contextBoundaries: ["Do not use care to hide a material disagreement."],
  },
];

export const PERSONA_REP_FALLBACK: PersonaRepContent = {
  instruction: "Ask one clarifying question before explaining or defending your position.",
  trigger: "The next time someone challenges, interrupts, or questions your recommendation.",
  successSignal: "The assumption or concern becomes clearer before you provide your explanation.",
  fallbackIfUnsafe: "Write down the question and request a safer follow-up conversation instead of confronting the person in public.",
  difficulty: 1,
};
