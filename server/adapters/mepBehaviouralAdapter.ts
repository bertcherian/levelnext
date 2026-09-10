/**
 * Manager Effectiveness Platform (MEP) Behavioural Intelligence Adapter
 *
 * Translates manager diagnostic findings, dimension pressure points, and 1-on-1
 * challenges into grounded Behavioural Intelligence Moments & Moves.
 */

import { CreateBehaviouralMomentInput } from "../../shared/modules/behaviouralIntelligence";

export type MepDiagnosticContext = {
  diagnosticCode: string; // "MEI" | "DI" | "FI" | "CI_C" | "THI" | "EXI" | "CNFI" | "O1I" | "TCI" | "OWI" | "PST" | "PFM" | "CFI"
  dimensionId: string;
  dimensionLabel: string;
  score?: number;
  reportId?: number;
};

export const MEP_DIMENSION_MOMENT_PROMPTS: Record<
  string,
  {
    defaultSituation: string;
    desiredOutcome: string;
    observedBehaviour: string;
    recommendedMoveCode: string;
  }
> = {
  // Delegation
  delegation: {
    defaultSituation: "I have several critical deliverables and a capable team, but I find myself hesitating to hand over full ownership because I worry about speed or rework.",
    desiredOutcome: "Empower my direct reports to own meaningful work while keeping appropriate visibility without micromanaging.",
    observedBehaviour: "I assigned the task but kept checking daily and made the final decisions myself.",
    recommendedMoveCode: "MOVE-03_DELEGATE_OUTCOME_NOT_METHOD",
  },
  task_selection: {
    defaultSituation: "I default to keeping complex work on my own plate instead of using it as a deliberate development opportunity for my team.",
    desiredOutcome: "Select and assign stretch opportunities that grow team members' capabilities.",
    observedBehaviour: "Did not delegate the cross-functional presentation because it felt too high-stakes.",
    recommendedMoveCode: "MOVE-03_DELEGATE_OUTCOME_NOT_METHOD",
  },
  // Feedback
  courage: {
    defaultSituation: "A team member consistently submits work that needs substantial clean-up, but I avoid giving direct, uncomfortable feedback to prevent damaging the relationship.",
    desiredOutcome: "Address performance standards directly, honestly, and supportively close to the event.",
    observedBehaviour: "Cleaned up the slides myself over the weekend instead of having the feedback conversation on Friday.",
    recommendedMoveCode: "MOVE-02_SEPARATE_FACT_FROM_INTERPRETATION",
  },
  difficult_conversations: {
    defaultSituation: "Friction between two team members is slowing down execution, but I have been hoping they will work it out on their own.",
    desiredOutcome: "Facilitate a constructive alignment conversation that establishes clear agreements.",
    observedBehaviour: "Acknowledged the tension in 1:1s but did not bring the parties together to resolve it.",
    recommendedMoveCode: "MOVE-05_DECLARE_BREAKDOWN_CONSTRUCTIVELY",
  },
  // Accountability
  accountability: {
    defaultSituation: "Deadlines slipped on a project commitment and I accepted vague assurances rather than holding the owner to a clear standard.",
    desiredOutcome: "Create shared accountability where missed commitments are addressed directly and professionally.",
    observedBehaviour: "Did not follow up on the missing spec until a stakeholder complained.",
    recommendedMoveCode: "MOVE-04_CONVERT_COMPLAINT_TO_REQUEST",
  },
  // Stakeholder Management & Alignment
  stakeholder_mgmt: {
    defaultSituation: "A key stakeholder challenged our team's timeline in an executive meeting and I reacted defensively instead of exploring their underlying concern.",
    desiredOutcome: "Navigate cross-functional pushback with executive presence and collaborative problem-solving.",
    observedBehaviour: "Defended our timeline with technical details instead of addressing the stakeholder's commercial pressure.",
    recommendedMoveCode: "MOVE-01_CLARIFYING_QUESTION_BEFORE_VIEW",
  },
  // One-on-One
  coaching_1on1: {
    defaultSituation: "My 1:1s frequently devolve into operational status updates rather than developmental coaching and capability building.",
    desiredOutcome: "Transform 1:1s into high-value conversations that unlock independent problem-solving.",
    observedBehaviour: "Spent 45 out of 50 minutes discussing ticket status and deadlines.",
    recommendedMoveCode: "MOVE-01_CLARIFYING_QUESTION_BEFORE_VIEW",
  },
};

export function buildMepBehaviouralMomentInput(
  context: MepDiagnosticContext,
  customSituation?: string
): CreateBehaviouralMomentInput {
  const promptTemplate =
    MEP_DIMENSION_MOMENT_PROMPTS[context.dimensionId] ?? {
      defaultSituation: `In my role as a manager, I am encountering friction in ${context.dimensionLabel} when coordinating with my team and stakeholders.`,
      desiredOutcome: `Strengthen my management practice in ${context.dimensionLabel} to achieve higher team trust and reliable execution.`,
      observedBehaviour: `Noticeable inconsistency under deadline pressure.`,
      recommendedMoveCode: "MOVE-01_CLARIFYING_QUESTION_BEFORE_VIEW",
    };

  return {
    sourceApp: "mep",
    sourceEntityType: "diagnostic_result",
    sourceEntityId: context.reportId,
    moduleType: context.diagnosticCode,
    situation: customSituation?.trim() || promptTemplate.defaultSituation,
    desiredOutcome: promptTemplate.desiredOutcome,
    observedBehaviour: promptTemplate.observedBehaviour,
    role: "Manager",
    careerStage: "manager",
    authorityLevel: "Team Lead / Engineering Manager",
    stakeholders: "Direct reports, cross-functional peers, and functional manager",
    organisationalContext: "Fast-moving operating cadence with delivery expectations",
    evidence: [],
    diagnosticContext: {
      reportId: context.reportId,
      edgeScore: context.score,
      dimensionScores: context.dimensionId && context.score !== undefined ? { [context.dimensionId]: context.score } : undefined,
    },
  };
}
