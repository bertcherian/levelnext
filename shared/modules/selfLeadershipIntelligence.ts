import { buildUodlCoachDirective, createOntologyFallback, type OntologyReasoning } from "./universalOntologicalDistinctions";

export const SELF_LEADERSHIP_DIMENSIONS = [
  "self_awareness",
  "authenticity",
  "courage",
  "responsibility",
  "other_centredness",
  "integrity",
] as const;

export const SELF_LEADERSHIP_CAREER_STAGES = [
  "early_career",
  "professional",
  "manager",
  "leader",
  "cxo",
] as const;

export type SelfLeadershipDimension = typeof SELF_LEADERSHIP_DIMENSIONS[number];
export type SelfLeadershipCareerStage = typeof SELF_LEADERSHIP_CAREER_STAGES[number];
export type SelfLeadershipConfidence = "low" | "moderate" | "high";
export type SelfLeadershipDiagnosticLens = "knowing" | "seeing" | "choosing" | "mixed";

export type SelfLeadershipAnalysisInput = {
  situation: string;
  observedBehaviour?: string;
  careerStage: SelfLeadershipCareerStage;
  role?: string;
  organisationalContext?: string;
  authorityLevel?: string;
  stakeholders?: string;
  consequences?: string;
  availableInformation?: string;
  culturalContext?: string;
  powerDynamics?: string;
  evidence?: string[];
  sourceApp?: string;
};

export type SelfLeadershipAnalysis = {
  situation: string;
  observedBehaviour: string;
  diagnosticLens: SelfLeadershipDiagnosticLens;
  capabilitySignal: string;
  judgmentSignal: string;
  selfLeadershipSignal: {
    primaryDimension: SelfLeadershipDimension;
    observation: string;
    evidence: string[];
    confidence: SelfLeadershipConfidence;
  };
  developmentalHypothesis: string;
  reflectionQuestion: string;
  nextChoice: string;
  microExperiment: string;
  followUpSignal: string;
  ontology?: OntologyReasoning;
  mirror: {
    whatWeAreNoticing: string;
    whyItMayMatter: string;
    questionToConsider: string;
    experiment: string;
  };
};

export const SELF_LEADERSHIP_EXAMPLE_INPUT: SelfLeadershipAnalysisInput = {
  situation: "A finance manager noticed an optimistic revenue assumption during a cross-functional planning meeting but agreed publicly and raised the concern only after the meeting.",
  observedBehaviour: "They chose not to test the assumption in the meeting even though they recognised the commercial risk.",
  careerStage: "manager",
  role: "Finance Manager",
  organisationalContext: "Cross-functional annual planning with a strong deadline focus.",
  stakeholders: "Commercial lead, operations lead, and finance team.",
  consequences: "The plan may be approved on an untested assumption, creating avoidable downstream pressure.",
  powerDynamics: "The commercial lead has more influence in the planning forum.",
  evidence: ["One first-person account of the meeting.", "The concern was raised after the formal discussion rather than during it."],
  sourceApp: "intelligence_core_example",
};

const STAGE_FOCUS: Record<SelfLeadershipCareerStage, string> = {
  early_career: "ownership, dependability, learning from mistakes, asking for help, speaking up appropriately, professional integrity, and consideration for colleagues",
  professional: "increasing ownership, constructive challenge, stakeholder awareness, accountability, expertise without ego, reliability, and influence without authority",
  manager: "fairness, difficult conversations, delegation, emotional regulation, developing others, accountability, and proportionate use of authority",
  leader: "leadership shadow, candour, organisational courage, psychological safety, consistency, stewardship, and responsibility for culture",
  cxo: "stewardship, power, enterprise responsibility, ethical judgement, difficult trade-offs, institutional trust, and courage under pressure",
};

export function getSelfLeadershipStageFocus(stage: SelfLeadershipCareerStage) {
  return STAGE_FOCUS[stage];
}

export function buildSelfLeadershipGuideDirective(stage: SelfLeadershipCareerStage) {
  return `SELF-LEADERSHIP INTELLIGENCE LENS:\nUse this shared LevelNext lens when a workplace situation involves how the person is choosing to show up. Calibrate your expectations to a ${stage.replace(/_/g, " ")} context, with particular attention to ${getSelfLeadershipStageFocus(stage)}.\n\nBefore offering a technique, distinguish whether the constraint is a KNOWING problem (capability), a SEEING problem (judgement), a CHOOSING problem (self-leadership), or mixed. Analyse observable behaviour and context, not personality or character. Treat motives such as fear, avoidance, approval-seeking, control, or defensiveness only as hypotheses to explore—not facts.\n\nUse the six dimensions only when relevant: self-awareness, authenticity, courage, responsibility, other-centredness, and integrity. Separate intention, behaviour, and impact. Do not moralise, diagnose, rank personal worth, or make sweeping claims from one incident. Low-confidence observations must be framed as curious questions. Keep reflections private to the individual, and end with one proportionate, observable micro-experiment.\n\n${buildUodlCoachDirective()}`;
}

export function buildSelfLeadershipAnalysisSystemPrompt(input: SelfLeadershipAnalysisInput) {
  return `You are the Self-Leadership Intelligence Engine within LevelNext Intelligence Core. Produce development intelligence for one private workplace situation.\n\n${buildSelfLeadershipGuideDirective(input.careerStage)}\n\nReturn JSON only. The "developmentalHypothesis" must be phrased as a hypothesis (for example, "One possibility worth exploring is...") and never as a fact about motive or character. Confidence must reflect evidence quality: low for one ambiguous or self-reported signal, moderate for several related signals, high only for repeated evidence across situations or sources. A single incident is evidence, not necessarily a pattern. The micro-experiment must be specific, observable, proportionate, and practicable within days.\n\nUse exactly this schema:\n{"situation":"string","observedBehaviour":"string","diagnosticLens":"knowing|seeing|choosing|mixed","capabilitySignal":"string","judgmentSignal":"string","selfLeadershipSignal":{"primaryDimension":"self_awareness|authenticity|courage|responsibility|other_centredness|integrity","observation":"string","evidence":["string"],"confidence":"low|moderate|high"},"developmentalHypothesis":"string","reflectionQuestion":"string","nextChoice":"string","microExperiment":"string","followUpSignal":"string","ontology":{"primaryGap":"capability|judgment|self_leadership|observer|environment_system|mixed","primaryDistinctionId":"OD-01..OD-25 or null","secondaryDistinctionId":"OD-01..OD-25 or null","evidence":["string"],"counterEvidence":["string"],"confidence":"low|moderate|high","observerHypothesis":"string","alternativeExplanations":["string"],"recommendedDepth":"D1_answer|D2_practice|D3_reflection|D4_reframe|D5_observer_shift","reflectionQuestion":"string","microExperiment":"string","successSignal":"string","doNotSurface":["string"]},"mirror":{"whatWeAreNoticing":"string","whyItMayMatter":"string","questionToConsider":"string","experiment":"string"}}`;
}

export function createSelfLeadershipFallback(input: SelfLeadershipAnalysisInput): SelfLeadershipAnalysis {
  const observedBehaviour = input.observedBehaviour?.trim() || "The available account describes a workplace response, but does not yet establish a recurring pattern.";
  const evidence = input.evidence?.filter(Boolean).slice(0, 4) ?? [];
  const sourceEvidence = evidence.length > 0 ? evidence : [observedBehaviour];
  const observation = `The current account suggests an opportunity to pause and examine how the response affected others and the intended outcome.`;
  const reflectionQuestion = "What did you most want to protect in that moment, and what did the situation need from you as well?";
  const microExperiment = "Before your next comparable conversation, name the outcome you want for both the work and the relationship, then ask one clarifying question before stating your view.";

  return {
    situation: input.situation,
    observedBehaviour,
    diagnosticLens: "mixed",
    capabilitySignal: "The available information does not establish whether a skill or technique was missing; explore this before assuming a capability gap.",
    judgmentSignal: "Consider whether the situation, stakeholder needs, trade-offs, and likely impact were fully visible at the time of the response.",
    selfLeadershipSignal: {
      primaryDimension: "self_awareness",
      observation,
      evidence: sourceEvidence,
      confidence: "low",
    },
    developmentalHypothesis: "One possibility worth exploring is whether discomfort, speed, or an untested assumption narrowed the range of choices available in the moment.",
    reflectionQuestion,
    nextChoice: "Choose a response that names the concern while also checking your understanding of the other person’s perspective.",
    microExperiment,
    followUpSignal: "Notice whether the person pauses, asks a clarifying question, states their perspective clearly, and observes the impact before adjusting.",
    ontology: createOntologyFallback({ situation: input.situation, observedBehaviour, evidence: sourceEvidence, careerStage: input.careerStage, context: input.organisationalContext, powerDynamics: input.powerDynamics }),
    mirror: {
      whatWeAreNoticing: observation,
      whyItMayMatter: "A more deliberate response can improve both the decision quality and the trust available for the next conversation.",
      questionToConsider: reflectionQuestion,
      experiment: microExperiment,
    },
  };
}
