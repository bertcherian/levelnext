export const EARLY_CAREER_DOMAIN_KEY = "early_career" as const;
export const EXECUTIVE_COMMUNICATION_LEGACY_CODE = "ECI" as const;
export const EARLY_CAREER_PRODUCT_ID = "early_career_intelligence" as const;
export const EARLY_CAREER_MODULE_CODE = "EARLY_CAREER" as const;

export const EARLY_CAREER_STAGES = [
  {
    id: "orient",
    name: "Orient",
    transition: "Outsider → Insider",
    question: "How does this place actually work?",
    description: "Understand your role, team, norms, people, and how work gets done.",
  },
  {
    id: "deliver",
    name: "Deliver",
    transition: "Learner → Reliable Contributor",
    question: "Can people depend on me?",
    description: "Clarify commitments, communicate progress, surface risks early, and close loops.",
  },
  {
    id: "connect",
    name: "Connect",
    transition: "Individual Performer → Effective Team Member",
    question: "How do I work effectively with others?",
    description: "Listen, collaborate, contribute in meetings, and handle feedback constructively.",
  },
  {
    id: "navigate",
    name: "Navigate",
    transition: "Task Taker → Organisational Player",
    question: "How do I get things done through the organisation?",
    description: "Map dependencies, decision paths, stakeholders, and appropriate escalation routes.",
  },
  {
    id: "grow",
    name: "Grow",
    transition: "Feedback Receiver → Self-Developer",
    question: "How do I get better faster?",
    description: "Turn feedback into experiments, reflection, and repeated practice.",
  },
  {
    id: "contribute",
    name: "Contribute",
    transition: "Task Executor → Value Creator",
    question: "How can I create more value?",
    description: "Connect work to customers, outcomes, improvement opportunities, and business priorities.",
  },
  {
    id: "accelerate",
    name: "Accelerate",
    transition: "Employee → Career Owner",
    question: "Where can I go from here?",
    description: "Build reputation, readiness, internal relationships, and career direction.",
  },
] as const;

export type EarlyCareerStageId = (typeof EARLY_CAREER_STAGES)[number]["id"];

export const EARLY_CAREER_CAPABILITIES = [
  { id: "ownership_reliability", name: "Ownership & Reliability", question: "Can I be trusted to deliver?" },
  { id: "communication", name: "Communication", question: "Can I communicate clearly and appropriately?" },
  { id: "collaboration", name: "Collaboration", question: "Can I work effectively with others?" },
  { id: "manager_partnership", name: "Manager Partnership", question: "Can I establish an effective working relationship with my manager?" },
  { id: "organisational_navigation", name: "Organisational Navigation", question: "Can I understand and navigate the organisation?" },
  { id: "learning_agility", name: "Learning Agility", question: "Can I learn, adapt, and improve?" },
  { id: "professional_judgment", name: "Professional Judgment", question: "Can I make sensible decisions when there is no obvious answer?" },
  { id: "value_creation", name: "Value Creation", question: "Do I understand how my work contributes to larger outcomes?" },
] as const;

export type EarlyCareerCapabilityId = (typeof EARLY_CAREER_CAPABILITIES)[number]["id"];

export type EarlyCareerNextMove = {
  id: string;
  stage: EarlyCareerStageId;
  capabilityId: EarlyCareerCapabilityId;
  title: string;
  description: string;
  timeMinutes: number;
  evidencePrompt: string;
};

export const EARLY_CAREER_NEXT_MOVES: Record<EarlyCareerStageId, EarlyCareerNextMove> = {
  orient: {
    id: "orient_role_map",
    stage: "orient",
    capabilityId: "manager_partnership",
    title: "Clarify what good looks like",
    description: "Ask your manager which two outcomes would make the next two weeks feel successful.",
    timeMinutes: 10,
    evidencePrompt: "What became clearer about your role or priorities?",
  },
  deliver: {
    id: "deliver_proactive_update",
    stage: "deliver",
    capabilityId: "ownership_reliability",
    title: "Keep your manager informed",
    description: "Send a concise project update before your manager needs to ask for one.",
    timeMinutes: 7,
    evidencePrompt: "What did you communicate early, and what changed as a result?",
  },
  connect: {
    id: "connect_listen_first",
    stage: "connect",
    capabilityId: "collaboration",
    title: "Strengthen one working relationship",
    description: "In your next meeting, ask one clarifying question before offering your own view.",
    timeMinutes: 5,
    evidencePrompt: "What did you learn by listening first?",
  },
  navigate: {
    id: "navigate_dependency_map",
    stage: "navigate",
    capabilityId: "organisational_navigation",
    title: "Map a dependency before it becomes a blocker",
    description: "Identify one decision owner or dependency that affects your current work and contact them early.",
    timeMinutes: 10,
    evidencePrompt: "Which dependency did you clarify, and what is the next decision?",
  },
  grow: {
    id: "grow_feedback_experiment",
    stage: "grow",
    capabilityId: "learning_agility",
    title: "Turn feedback into a small experiment",
    description: "Ask for one piece of feedback and choose one behaviour to practise this week.",
    timeMinutes: 10,
    evidencePrompt: "What feedback did you test, and what will you repeat or change?",
  },
  contribute: {
    id: "contribute_outcome_link",
    stage: "contribute",
    capabilityId: "value_creation",
    title: "Connect a task to a bigger outcome",
    description: "Name the customer, team, or business outcome your current work is intended to improve.",
    timeMinutes: 5,
    evidencePrompt: "What outcome did you connect your work to?",
  },
  accelerate: {
    id: "accelerate_stretch_case",
    stage: "accelerate",
    capabilityId: "professional_judgment",
    title: "Make a case for your next stretch",
    description: "Gather one piece of readiness evidence and propose a bounded stretch assignment.",
    timeMinutes: 15,
    evidencePrompt: "What readiness evidence did you share, and what next step was agreed?",
  },
};

export function getEarlyCareerStage(stageId: EarlyCareerStageId) {
  return EARLY_CAREER_STAGES.find((stage) => stage.id === stageId) ?? EARLY_CAREER_STAGES[0];
}

export function getEarlyCareerNextMove(stageId: EarlyCareerStageId): EarlyCareerNextMove {
  return EARLY_CAREER_NEXT_MOVES[stageId];
}

export function getEarlyCareerManagerNudge(stageId: EarlyCareerStageId) {
  const stage = getEarlyCareerStage(stageId);
  const nextMove = getEarlyCareerNextMove(stageId);
  return {
    code: `EARLY_CAREER.${stageId.toUpperCase()}.CHECK_IN`,
    title: `Support the ${stage.name} transition`,
    rationale: `The employee is currently in ${stage.name}: ${stage.transition}. A short conversation can make the next workplace action clearer and easier to follow through on.`,
    objective: `Help the employee clarify the conditions for success around: ${nextMove.title}.`,
    questions: [
      "What feels clear, and what still feels ambiguous in your current work?",
      `What would make the next week feel successful as you work on “${nextMove.title}”?`,
      "What support, context, or connection would make progress easier?",
    ],
    privacyBoundary:
      "This guidance uses manager-visible profile and shared-commitment context only. It does not use private AI coaching conversations, reflections, or raw diagnostic answers.",
  };
}
