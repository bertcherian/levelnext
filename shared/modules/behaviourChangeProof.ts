import { z } from "zod";
export { anonymisePracticeText, safePracticeWarnings } from "./proofSafety";
import { anonymisePracticeText } from "./proofSafety";

export const PROOF_BEHAVIOURS = [
  "Difficult conversations",
  "Timely feedback",
  "Ownership and accountability",
  "Delegation",
  "Stakeholder influence",
  "Execution discipline",
  "Senior-leader communication",
] as const;
export type ProofBehaviour = (typeof PROOF_BEHAVIOURS)[number];

export const PROOF_MOMENTUM_STATES = ["flowing", "slowing", "stalled", "blocked", "disengaged"] as const;
export type ProofMomentumState = (typeof PROOF_MOMENTUM_STATES)[number];

export const PROOF_ACCESS_LANES = ["instant", "corporate_browser", "enterprise"] as const;
export type ProofAccessLane = (typeof PROOF_ACCESS_LANES)[number];
export const PROOF_HEALTH_STATES = ["green", "amber", "red"] as const;
export type ProofHealthState = (typeof PROOF_HEALTH_STATES)[number];

export const proofParticipantInputSchema = z.object({
  email: z.string().email(),
  name: z.string().trim().max(160).optional(),
});

export const proofPreviewSchema = z.object({
  problem: z.string().trim().min(12).max(1000),
});

export const proofCreatePilotSchema = z.object({
  name: z.string().trim().min(3).max(160),
  companyContext: z.string().trim().max(255).optional(),
  organisation: z.string().trim().max(255).optional(),
  sponsorName: z.string().trim().max(160).optional(),
  businessProblem: z.string().trim().min(12).max(1000),
  whyItMatters: z.string().trim().min(8).max(600).optional(),
  targetBehaviours: z.array(z.string().trim().min(2).max(120)).min(1).max(3),
  observableActions: z.array(z.string().trim().min(2).max(240)).min(1).max(6),
  businessSignals: z.array(z.string().trim().min(2).max(240)).min(1).max(6),
  cohortSize: z.number().int().min(1).max(10000).default(10),
  accessLane: z.enum(PROOF_ACCESS_LANES).default("instant"),
  pilotStartDate: z.string().trim().max(40).optional(),
  baselineMethod: z.string().trim().max(120).default("participant baseline + sponsor pulse"),
  nudgeCadence: z.string().trim().max(120).default("one useful action every 2–3 days"),
  observerPulse: z.string().trim().max(120).default("Day 15 and Day 30 observer pulse"),
});

export const proofInviteSchema = z.object({
  pilotId: z.number().int().positive(),
  participants: z.array(proofParticipantInputSchema).min(1).max(100),
  origin: z.string().url().optional(),
});

export const proofPilotIdSchema = z.object({ pilotId: z.number().int().positive() });
export const proofTokenSchema = z.object({ token: z.string().trim().min(16).max(128) });

export const proofBaselineSchema = z.object({
  token: z.string().trim().min(16).max(128),
  currentSituation: z.string().trim().min(8).max(500),
  desiredMovement: z.string().trim().min(8).max(500),
});

export const proofRepSchema = z.object({
  token: z.string().trim().min(16).max(128),
  practiceRole: z.string().trim().min(2).max(120),
  completed: z.boolean().default(true),
});

export const proofRealWorkSchema = z.object({
  token: z.string().trim().min(16).max(128),
  situationType: z.string().trim().min(2).max(160),
  actionTaken: z.string().trim().min(8).max(500),
  outcomeSignal: z.string().trim().max(500).optional(),
});

export const proofObserverPulseSchema = z.object({
  token: z.string().trim().min(16).max(128),
  movement: z.enum(["not_yet", "early_signal", "consistent_signal"]),
});

export const proofDailyActionSchema = z.object({
  token: z.string().trim().min(16).max(128),
  completed: z.boolean(),
  barrier: z.string().trim().max(400).optional(),
});

export const proofAccessIssueSchema = z.object({
  token: z.string().trim().min(16).max(128),
  issue: z.string().trim().min(4).max(255),
});

export const proofSecurityReviewSchema = z.object({ pilotId: z.number().int().positive() });

export type ProofDailyAction = {
  day: number;
  title: string;
  prompt: string;
  durationMinutes: number;
};

export type ProofCreatePilotInput = z.infer<typeof proofCreatePilotSchema>;
export type ProofParticipantInput = z.infer<typeof proofParticipantInputSchema>;
export type ProofPreview = ReturnType<typeof recommendPilot>;

const RECOMMENDATION_RULES: Array<{
  keywords: string[];
  behaviours: ProofBehaviour[];
  causes: string[];
  actions: string[];
  signals: string[];
}> = [
  {
    keywords: ["difficult", "conversation", "performance", "feedback", "avoid", "conflict"],
    behaviours: ["Difficult conversations", "Timely feedback", "Ownership and accountability"],
    causes: ["The moment is being postponed until the cost of delay grows.", "The manager may be protecting relationship comfort instead of naming the outcome.", "Expectations and consequences may not be explicit enough."],
    actions: ["Name the observable situation within two working days.", "Open with the impact and the outcome needed.", "Agree one specific next action and date."],
    signals: ["Time from situation identified to conversation opened", "Specificity of agreed next action", "Observer pulse on clarity and follow-through"],
  },
  {
    keywords: ["delegate", "delegation", "ownership", "operational", "escalat", "micromanage"],
    behaviours: ["Delegation", "Ownership and accountability", "Execution discipline"],
    causes: ["The manager may be carrying work that should sit with the team.", "Delegation may transfer tasks without transferring outcome ownership.", "Escalation may be rewarded faster than learning or accountability."],
    actions: ["Transfer one outcome, not only a task.", "Define decision rights and a visible success measure.", "Review progress without taking the work back."],
    signals: ["Number of outcomes owned by team members", "Reduced upward escalation", "Observer pulse on ownership clarity"],
  },
  {
    keywords: ["stakeholder", "influence", "senior", "executive", "communication", "alignment"],
    behaviours: ["Stakeholder influence", "Senior-leader communication", "Execution discipline"],
    causes: ["The message may be optimized for completeness rather than decision movement.", "Stakeholders may not share the same outcome frame.", "The ask, trade-off, or decision boundary may be unclear."],
    actions: ["Lead with the decision or outcome required.", "Make one trade-off explicit.", "Close with a clear ask and owner."],
    signals: ["Decision or commitment reached", "Clarity of ask in observer pulse", "Time from issue raised to decision"],
  },
  {
    keywords: ["execution", "slow", "delivery", "deadline", "accountability", "rework"],
    behaviours: ["Execution discipline", "Ownership and accountability", "Timely feedback"],
    causes: ["Work may be moving without a shared definition of done.", "Risks may be surfaced too late for useful intervention.", "Accountability may be diffuse across handoffs."],
    actions: ["State the outcome and owner before work starts.", "Surface one risk early with a proposed response.", "Close the loop on the agreed delivery date."],
    signals: ["Time to surface and resolve a risk", "Fewer reopened or reworked items", "Observer pulse on ownership"],
  },
];

const DEFAULT_RULE = RECOMMENDATION_RULES[0];

export function recommendPilot(problem: string) {
  const normalized = problem.toLowerCase();
  const rule = RECOMMENDATION_RULES.find((candidate) => candidate.keywords.some((keyword) => normalized.includes(keyword))) ?? DEFAULT_RULE;
  return {
    businessProblem: problem.trim(),
    likelyCauses: rule.causes,
    targetBehaviours: rule.behaviours,
    observableActions: rule.actions,
    businessSignals: rule.signals,
    defaults: {
      durationDays: 30,
      baselineMethod: "participant baseline + sponsor pulse",
      nudgeCadence: "one useful action every 2–3 days",
      observerPulse: "Day 15 and Day 30 observer pulse",
      cohortSize: "10–20 people",
    },
  };
}

export function deriveMomentumState(input: { participants: number; baselineCompleted: number; firstReps: number; realWorkApplications: number; lastActivityAt?: Date | null }): ProofMomentumState {
  if (!input.participants) return "blocked";
  if (input.lastActivityAt && Date.now() - input.lastActivityAt.getTime() > 7 * 24 * 60 * 60 * 1000) return "disengaged";
  if (input.realWorkApplications > 0 && input.realWorkApplications >= Math.max(1, Math.ceil(input.participants / 2))) return "flowing";
  if (input.firstReps > 0) return "slowing";
  if (input.baselineCompleted > 0) return "stalled";
  return "blocked";
}

export function deriveEvidenceStrength(input: { system: number; behavioural: number; human: number; businessSignal: number }): "insufficient" | "early_signal" | "emerging_pattern" | "corroborated_movement" {
  const total = input.system + input.behavioural + input.human + input.businessSignal;
  if (input.human > 0 && input.behavioural > 0 && input.businessSignal > 0) return "corroborated_movement";
  if (total >= 4 && input.behavioural > 0) return "emerging_pattern";
  if (total > 0) return "early_signal";
  return "insufficient";
}

export function nextBestPilotAction(input: { participants: number; baselineCompleted: number; firstReps: number; realWorkApplications: number; day: number }) {
  if (input.participants === 0) return { key: "invite", label: "Invite your pilot participants", detail: "Paste 10–20 people so the proof can begin." };
  if (input.baselineCompleted < input.participants) return { key: "baseline", label: "Get participants to complete the baseline", detail: "The baseline makes later movement interpretable." };
  if (input.firstReps === 0) return { key: "practice", label: "Create the first Behaviour Rep", detail: "Participants should practise a live situation before the next real moment." };
  if (input.realWorkApplications === 0) return { key: "application", label: "Capture a real-work application", detail: "The proof is about what people do differently at work." };
  if (input.day >= 30) return { key: "review", label: "Review what changed in 30 days", detail: "Use the evidence mix to decide whether to continue or expand." };
  return { key: "observe", label: "Review the next useful action", detail: "Keep the loop moving without over-nudging participants." };
}

export function getProofDailyAction(day: number, behaviours: string[]): ProofDailyAction {
  const focus = behaviours[day % Math.max(1, behaviours.length)] ?? "the target behaviour";
  if (day <= 2) return { day, title: "Name one live moment", prompt: `Where today could you practise ${focus.toLowerCase()}? Keep the situation anonymous and specific.`, durationMinutes: 3 };
  if (day <= 7) return { day, title: "Practise the opening", prompt: `Take 90 seconds to rehearse how you will start a ${focus.toLowerCase()} moment.`, durationMinutes: 4 };
  if (day <= 14) return { day, title: "Try one small experiment", prompt: `Use ${focus.toLowerCase()} in one real conversation or handoff, then note what happened.`, durationMinutes: 5 };
  if (day <= 21) return { day, title: "Raise the difficulty", prompt: `Choose a slightly harder ${focus.toLowerCase()} moment and make the outcome explicit.`, durationMinutes: 6 };
  if (day <= 27) return { day, title: "Repeat what works", prompt: `Repeat the behaviour in a second context and look for a concrete signal of movement.`, durationMinutes: 4 };
  return { day, title: "Prepare your proof reflection", prompt: `Compare your starting point with what you now do differently. Keep names, clients, and confidential details out.`, durationMinutes: 5 };
}

export function derivePilotHealth(input: { participants: number; baselineCompleted: number; firstReps: number; realWorkApplications: number; observerPulses: number; securityFriction: number; day: number }): { state: ProofHealthState; label: string; action: string } {
  if (input.securityFriction > 0 || (input.day >= 7 && input.baselineCompleted === 0)) return { state: "red", label: "Pilot validity at risk", action: "Resolve access or activation friction before interpreting evidence." };
  const activationRate = input.participants ? input.baselineCompleted / input.participants : 0;
  const actionRate = input.participants ? input.realWorkApplications / input.participants : 0;
  if (activationRate >= 0.7 && actionRate >= 0.4) return { state: "green", label: "Pilot progressing well", action: "Keep the loop moving and prepare the midpoint or Day-30 review." };
  return { state: "amber", label: "Intervention required", action: "Use contextual prompts to move the next missing activation step." };
}
