/**
 * Leader Derailment Intelligence (LDI) Behavioural Intelligence Adapter
 *
 * "The hidden patterns that stall strong leaders — converted into actionable behavioural moves."
 *
 * Crucial guardrail:
 * Derailers are NEVER treated as immutable psychological traits or permanent labels.
 * They are pressure-induced behavioural habits that can be disrupted through calibrated moves.
 */

import { CreateBehaviouralMomentInput } from "../../shared/modules/behaviouralIntelligence";

export type LdiDiagnosticContext = {
  dimensionId: string;
  dimensionName: string;
  score?: number;
  riskBand?: string;
  archetypeId?: string;
  archetypeLabel?: string;
  reportId?: number;
};

export const LDI_DIMENSION_MOMENT_PROMPTS: Record<
  string,
  {
    defaultSituation: string;
    desiredOutcome: string;
    observedBehaviour: string;
    recommendedMoveCode: string;
  }
> = {
  self_awareness: {
    defaultSituation: "In high-stakes executive forums, I am sometimes surprised by how sharply others react to my communication style or body language.",
    desiredOutcome: "Develop real-time attunement to my impact in the room so my intent matches how I am experienced.",
    observedBehaviour: "Pushed an agenda firmly without noticing the growing silence and resistance in the room.",
    recommendedMoveCode: "MOVE-01_CLARIFYING_QUESTION_BEFORE_VIEW",
  },
  emotional_regulation: {
    defaultSituation: "When faced with sudden setbacks or conflicting priorities, I notice irritation or impatience showing up in my tone and pace.",
    desiredOutcome: "Maintain composure and steady presence so colleagues and team feel safe bringing bad news or dissenting views.",
    observedBehaviour: "Sharply interrupted a team member during a project review when metrics slipped.",
    recommendedMoveCode: "MOVE-02_SEPARATE_FACT_FROM_INTERPRETATION",
  },
  humility_vs_defensiveness: {
    defaultSituation: "When senior peers or executives question my technical proposal, my instinct is to defend my ground rather than exploring their underlying reservation.",
    desiredOutcome: "Welcome pushback with curiosity while holding conviction, increasing collaborative credibility.",
    observedBehaviour: "Offered three immediate counter-arguments before the stakeholder finished speaking.",
    recommendedMoveCode: "MOVE-01_CLARIFYING_QUESTION_BEFORE_VIEW",
  },
  trust_relationship_building: {
    defaultSituation: "Working relationships with cross-functional counterparts have become purely transactional, causing friction whenever unexpected alignment is needed.",
    desiredOutcome: "Build durable relational trust and peer followership that withstands organisational tension.",
    observedBehaviour: "Only reached out to the commercial lead when an escalation was imminent.",
    recommendedMoveCode: "MOVE-04_CONVERT_COMPLAINT_TO_REQUEST",
  },
  stakeholder_management: {
    defaultSituation: "An important strategic initiative stalled because key executive stakeholders were not pre-aligned before the formal decision forum.",
    desiredOutcome: "Proactively map and pre-wire stakeholders so complex decisions move smoothly through the system.",
    observedBehaviour: "Assumed the merits of the proposal alone would guarantee executive approval.",
    recommendedMoveCode: "MOVE-01_CLARIFYING_QUESTION_BEFORE_VIEW",
  },
  strategic_thinking: {
    defaultSituation: "I spend excessive time managing operational escalations, leaving little room to connect current decisions to longer-term enterprise trade-offs.",
    desiredOutcome: "Elevate my contribution from tactical delivery to strategic impact and second-order consequence anticipation.",
    observedBehaviour: "Spent most of the strategy offsite debating quarterly deliverables rather than market positioning.",
    recommendedMoveCode: "MOVE-06_EXECUTIVE_RECOMMENDATION_FIRST",
  },
  decision_making_ambiguity: {
    defaultSituation: "When operating with incomplete information, I tend to delay decisions in search of certainty, creating bottlenecks for my team.",
    desiredOutcome: "Make timely, well-reasoned decisions under ambiguity with clear assumptions and reversible checkpoints.",
    observedBehaviour: "Delayed approving the vendor architecture for three weeks waiting for additional data.",
    recommendedMoveCode: "MOVE-05_DECLARE_BREAKDOWN_CONSTRUCTIVELY",
  },
  accountability_courage: {
    defaultSituation: "I have delayed addressing underperformance in a key contributor because I dread the personal discomfort of a confrontation.",
    desiredOutcome: "Address standards with leadership courage, clarity, and genuine developmental care.",
    observedBehaviour: "Postponed the critical performance review twice in the last quarter.",
    recommendedMoveCode: "MOVE-02_SEPARATE_FACT_FROM_INTERPRETATION",
  },
  delegation_team_development: {
    defaultSituation: "Because I have deep functional expertise, I stay too close to the work and become the ultimate decision bottleneck.",
    desiredOutcome: "Scale my leadership by transferring decision rights and coaching the next tier of talent.",
    observedBehaviour: "Personally reviewed and approved every customer-facing proposal.",
    recommendedMoveCode: "MOVE-03_DELEGATE_OUTCOME_NOT_METHOD",
  },
  executive_communication: {
    defaultSituation: "In briefings with CXOs and board members, I tend to provide too much technical background and bury the core business recommendation.",
    desiredOutcome: "Communicate with brevity, executive authority, and clear trade-off framing at the right altitude.",
    observedBehaviour: "Took 15 minutes of a 20-minute meeting presenting methodology before reaching the recommendation.",
    recommendedMoveCode: "MOVE-06_EXECUTIVE_RECOMMENDATION_FIRST",
  },
};

export function buildLdiBehaviouralMomentInput(
  context: LdiDiagnosticContext,
  customSituation?: string
): CreateBehaviouralMomentInput {
  const promptTemplate =
    LDI_DIMENSION_MOMENT_PROMPTS[context.dimensionId] ?? {
      defaultSituation: `In my executive role, I am navigating pressure around ${context.dimensionName} that impacts organizational momentum and trust.`,
      desiredOutcome: `Strengthen executive capacity in ${context.dimensionName} to lead with clarity, resilience, and scale.`,
      observedBehaviour: `Inconsistency under high-stakes enterprise conditions.`,
      recommendedMoveCode: "MOVE-01_CLARIFYING_QUESTION_BEFORE_VIEW",
    };

  return {
    sourceApp: "leader_intelligence",
    sourceEntityType: "ldi_diagnostic_result",
    sourceEntityId: context.reportId,
    moduleType: "LDI",
    situation: customSituation?.trim() || promptTemplate.defaultSituation,
    desiredOutcome: promptTemplate.desiredOutcome,
    observedBehaviour: promptTemplate.observedBehaviour,
    role: "Senior Leader / Director / VP",
    careerStage: "leader",
    authorityLevel: "Senior Leadership / Business Unit Head",
    stakeholders: "Executive team, board, peer VPs, and extended organization",
    organisationalContext: "Enterprise scale with multi-stakeholder scrutiny and strategic ambiguity",
    powerDynamics: "High-stakes executive accountability with lateral influence requirements",
    evidence: [],
    diagnosticContext: {
      reportId: context.reportId,
      edgeScore: context.score,
      archetype: context.archetypeLabel,
      zone: context.riskBand,
      dimensionScores: context.dimensionId && context.score !== undefined ? { [context.dimensionId]: context.score } : undefined,
    },
  };
}
