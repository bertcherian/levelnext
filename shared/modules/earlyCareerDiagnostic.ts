import {
  EARLY_CAREER_CAPABILITIES,
  type EarlyCareerCapabilityId,
  type EarlyCareerStageId,
} from "./earlyCareerData";

export const EARLY_CAREER_DIAGNOSTIC_DISCLAIMER =
  "This is a private developmental reflection, not a performance rating or an employment decision tool. Individual answers and private coaching are not shared with a manager or HR.";

export type EarlyCareerDiagnosticQuestion = {
  id: string;
  capabilityId: EarlyCareerCapabilityId;
  prompt: string;
};

export const EARLY_CAREER_DIAGNOSTIC_QUESTIONS: EarlyCareerDiagnosticQuestion[] = [
  { id: "ec_ownership_1", capabilityId: "ownership_reliability", prompt: "When I take on work, I clarify the outcome, owner, and deadline before I begin." },
  { id: "ec_ownership_2", capabilityId: "ownership_reliability", prompt: "I raise progress, risks, or blockers before they become urgent for others." },
  { id: "ec_ownership_3", capabilityId: "ownership_reliability", prompt: "I close the loop by confirming when a task is complete and what happened." },
  { id: "ec_communication_1", capabilityId: "communication", prompt: "I make my updates clear enough that another person can quickly understand the point and next step." },
  { id: "ec_communication_2", capabilityId: "communication", prompt: "I adapt the amount of detail and tone to the person and situation." },
  { id: "ec_communication_3", capabilityId: "communication", prompt: "I ask clarifying questions when I do not understand an expectation or decision." },
  { id: "ec_collaboration_1", capabilityId: "collaboration", prompt: "I make space to understand another person's view before I add my own." },
  { id: "ec_collaboration_2", capabilityId: "collaboration", prompt: "I follow through on the agreements I make with colleagues." },
  { id: "ec_collaboration_3", capabilityId: "collaboration", prompt: "I can receive different views or feedback without becoming defensive." },
  { id: "ec_manager_1", capabilityId: "manager_partnership", prompt: "I know what my manager currently expects me to prioritise." },
  { id: "ec_manager_2", capabilityId: "manager_partnership", prompt: "I give my manager enough context to support me without asking them to solve everything." },
  { id: "ec_manager_3", capabilityId: "manager_partnership", prompt: "I use one-to-ones to clarify support, feedback, and next steps." },
  { id: "ec_navigation_1", capabilityId: "organisational_navigation", prompt: "I can identify the people or teams whose input affects my work." },
  { id: "ec_navigation_2", capabilityId: "organisational_navigation", prompt: "I understand when to make a decision, seek input, or escalate." },
  { id: "ec_navigation_3", capabilityId: "organisational_navigation", prompt: "I build working relationships before I urgently need help." },
  { id: "ec_learning_1", capabilityId: "learning_agility", prompt: "I turn feedback into one specific behaviour I can test." },
  { id: "ec_learning_2", capabilityId: "learning_agility", prompt: "I notice what worked, what did not, and what I will change next time." },
  { id: "ec_learning_3", capabilityId: "learning_agility", prompt: "I seek learning opportunities that connect directly to my current work." },
  { id: "ec_judgment_1", capabilityId: "professional_judgment", prompt: "When the answer is not obvious, I consider consequences before I act." },
  { id: "ec_judgment_2", capabilityId: "professional_judgment", prompt: "I know when to take initiative and when to check an assumption with someone more experienced." },
  { id: "ec_judgment_3", capabilityId: "professional_judgment", prompt: "I can distinguish a small problem I can solve from a risk that needs wider attention." },
  { id: "ec_value_1", capabilityId: "value_creation", prompt: "I can explain how my work helps a customer, colleague, team, or business outcome." },
  { id: "ec_value_2", capabilityId: "value_creation", prompt: "I look for small ways to improve a process, hand-off, or customer experience." },
  { id: "ec_value_3", capabilityId: "value_creation", prompt: "I can connect today's tasks to a larger team priority." },
];

export const EARLY_CAREER_RESPONSE_SCALE = [
  { value: 1, label: "Rarely true for me" },
  { value: 2, label: "Occasionally true" },
  { value: 3, label: "Usually true" },
  { value: 4, label: "Consistently true" },
  { value: 5, label: "A clear strength today" },
] as const;

export type EarlyCareerDiagnosticBand = {
  label: string;
  description: string;
};

export function getEarlyCareerDiagnosticBand(score: number): EarlyCareerDiagnosticBand {
  if (score < 50) return { label: "Building the foundations", description: "Focus on a few repeatable habits that make work clearer and more reliable." };
  if (score < 65) return { label: "Finding your rhythm", description: "Build consistency by applying your strengths in everyday workplace moments." };
  if (score < 80) return { label: "Building confidence", description: "Use targeted practice to handle more ambiguity, relationships, and judgement." };
  return { label: "Ready for broader contribution", description: "Keep stretching your contribution while strengthening the habits that already work." };
}

export function scoreEarlyCareerCapability(responses: Record<string, number>, capabilityId: EarlyCareerCapabilityId): number {
  const values = EARLY_CAREER_DIAGNOSTIC_QUESTIONS
    .filter((question) => question.capabilityId === capabilityId)
    .map((question) => responses[question.id])
    .filter((value): value is number => typeof value === "number" && value >= 1 && value <= 5);
  if (values.length === 0) return 0;
  return Math.round((values.reduce((total, value) => total + value, 0) / values.length) * 20);
}

export function scoreEarlyCareerDiagnostic(responses: Record<string, number>) {
  const capabilityScores = Object.fromEntries(
    EARLY_CAREER_CAPABILITIES.map((capability) => [capability.id, scoreEarlyCareerCapability(responses, capability.id)])
  ) as Record<EarlyCareerCapabilityId, number>;
  const overallScore = Math.round(
    Object.values(capabilityScores).reduce((total, score) => total + score, 0) / EARLY_CAREER_CAPABILITIES.length
  );
  const recommendedCapability = EARLY_CAREER_CAPABILITIES.reduce((lowest, capability) =>
    capabilityScores[capability.id] < capabilityScores[lowest.id] ? capability : lowest
  ).id;
  return { overallScore, capabilityScores, recommendedCapability, band: getEarlyCareerDiagnosticBand(overallScore) };
}

export const EARLY_CAREER_CAPABILITY_ACTIONS: Record<EarlyCareerCapabilityId, {
  title: string;
  rationale: string;
  action: string;
  timeMinutes: number;
  reflectionPrompt: string;
}> = {
  ownership_reliability: {
    title: "Make one commitment visible",
    rationale: "Reliable delivery grows when expectations, progress, and risks are made visible early.",
    action: "Choose one active task and send a three-line update: outcome, current status, and the next decision or risk.",
    timeMinutes: 7,
    reflectionPrompt: "What changed because you communicated before someone needed to ask?",
  },
  communication: {
    title: "Clarify before you commit",
    rationale: "Clear communication starts by confirming the outcome and audience before adding detail.",
    action: "In your next ambiguous conversation, ask: “What would a useful outcome look like, and what detail matters most?”",
    timeMinutes: 5,
    reflectionPrompt: "What became clearer once you asked the question?",
  },
  collaboration: {
    title: "Listen for the working agreement",
    rationale: "Collaboration improves when you surface another person's context before offering your own solution.",
    action: "In one meeting, ask a clarifying question first and confirm the agreed next step before you leave.",
    timeMinutes: 5,
    reflectionPrompt: "What did you understand differently after listening first?",
  },
  manager_partnership: {
    title: "Clarify what good looks like",
    rationale: "A strong manager partnership is built through short, prepared conversations about priorities and support.",
    action: "Use your next one-to-one to ask which two outcomes matter most this week and what support would be useful.",
    timeMinutes: 10,
    reflectionPrompt: "Which expectation or support route is clearer now?",
  },
  organisational_navigation: {
    title: "Map one dependency early",
    rationale: "Navigation becomes easier when decision owners and hand-offs are understood before work is blocked.",
    action: "Identify one dependency for a current task, find its decision owner, and make an early contact.",
    timeMinutes: 10,
    reflectionPrompt: "Which dependency did you clarify and what is the next hand-off?",
  },
  learning_agility: {
    title: "Turn feedback into an experiment",
    rationale: "Growth accelerates when feedback becomes a small behaviour you can test and reflect on.",
    action: "Ask for one specific piece of feedback and choose one behaviour to practise in your next comparable situation.",
    timeMinutes: 10,
    reflectionPrompt: "What will you repeat, refine, or stop after the experiment?",
  },
  professional_judgment: {
    title: "Pause for options and consequences",
    rationale: "Professional judgement develops through small decisions made with an explicit view of risks and stakeholders.",
    action: "Before one uncertain decision, write down two options, the likely consequence of each, and who should be consulted.",
    timeMinutes: 8,
    reflectionPrompt: "What did considering the consequence change about your decision?",
  },
  value_creation: {
    title: "Connect a task to its outcome",
    rationale: "Value creation becomes visible when day-to-day work is linked to the customer, team, or business result it enables.",
    action: "Choose one task and state in one sentence whose outcome it supports and how you will know it helped.",
    timeMinutes: 5,
    reflectionPrompt: "What outcome did you connect your work to?",
  },
};

export function getEarlyCareerDevelopmentGuidance(capabilityId: EarlyCareerCapabilityId) {
  const capability = EARLY_CAREER_CAPABILITIES.find((item) => item.id === capabilityId) ?? EARLY_CAREER_CAPABILITIES[0];
  return { capabilityId, capabilityName: capability.name, ...EARLY_CAREER_CAPABILITY_ACTIONS[capabilityId] };
}

export const EARLY_CAREER_PRACTICE_SCENARIOS: Array<{
  id: string;
  title: string;
  capabilityId: EarlyCareerCapabilityId;
  stageId: EarlyCareerStageId;
  situation: string;
  counterpartRole: string;
  objective: string;
}> = [
  { id: "clarify_ambiguous_work", title: "Clarify an ambiguous ask", capabilityId: "communication", stageId: "orient", situation: "Your manager asks you to improve a weekly report but has not explained what needs to change.", counterpartRole: "busy manager", objective: "Clarify success, scope, and a sensible next update without sounding passive." },
  { id: "proactive_update", title: "Give a proactive progress update", capabilityId: "ownership_reliability", stageId: "deliver", situation: "A dependency is likely to delay your work by two days.", counterpartRole: "manager", objective: "Share the risk early, show ownership, and propose a practical next step." },
  { id: "receive_feedback", title: "Respond well to feedback", capabilityId: "learning_agility", stageId: "grow", situation: "A senior colleague says your meeting update was too detailed and hard to follow.", counterpartRole: "senior colleague", objective: "Seek specifics, respond constructively, and agree one behaviour to practise." },
  { id: "request_support", title: "Ask for support with confidence", capabilityId: "manager_partnership", stageId: "connect", situation: "You are unsure how to prioritise two urgent requests from different stakeholders.", counterpartRole: "manager", objective: "Bring context, explain your thinking, and agree an appropriate decision." },
  { id: "navigate_dependency", title: "Navigate a cross-team dependency", capabilityId: "organisational_navigation", stageId: "navigate", situation: "Another team owns an approval your project needs, but you do not know the decision path.", counterpartRole: "cross-functional colleague", objective: "Build rapport, clarify the process, and agree the next hand-off." },
  { id: "suggest_improvement", title: "Suggest a practical improvement", capabilityId: "value_creation", stageId: "contribute", situation: "You notice a repetitive hand-off that creates avoidable delays for colleagues.", counterpartRole: "team lead", objective: "Present the observed issue, propose a small test, and connect it to a useful outcome." },
];

export const EARLY_CAREER_COACH_STARTERS = [
  "Help me prepare for a conversation with my manager.",
  "I am unsure how to handle this workplace situation.",
  "Turn feedback I received into a small experiment.",
  "Help me choose one action that will move my work forward this week.",
] as const;
