export type CareerStage = {
  key: string;
  number: string;
  name: string;
  shortName: string;
  journeyLabel: string;
  tagline: string;
  audience: string;
  description: string;
  buyerOutcome: string;
  pipelineMicrocopy: string;
  ctaLabel: string;
  href: string;
  focus: string[];
};

export const careerStages: CareerStage[] = [
  {
    key: "early-career",
    number: "01",
    name: "Early Career Intelligence",
    shortName: "Early Career",
    journeyLabel: "Build your first 1,000 days with intent.",
    tagline: "Turn early potential into role-ready capability.",
    audience: "Early Career Professionals",
    description:
      "Give early-career cohorts a shared operating language, practical work habits and visible progress—so they become dependable contributors sooner.",
    buyerOutcome: "Shorten the path from joining to reliable contribution.",
    pipelineMicrocopy: "Accelerate role readiness with common work standards and clear development signals.",
    ctaLabel: "Start your Early Career journey",
    href: "/early-career",
    focus: ["Role readiness", "Cohort confidence", "Visible progress"],
  },
  {
    key: "professional",
    number: "02",
    name: "Professional Intelligence",
    shortName: "Professional",
    journeyLabel: "Become exceptional at your work.",
    tagline: "Make execution more reliable across the work that matters.",
    audience: "Individual contributors",
    description:
      "Help critical individual contributors take ownership, communicate risk early and move work forward with less manager intervention.",
    buyerOutcome: "Reduce avoidable delivery friction in the work your business depends on.",
    pipelineMicrocopy: "Strengthen ownership, execution and cross-functional follow-through.",
    ctaLabel: "Start your PEI diagnostic",
    href: "/pe/assessment",
    focus: ["Execution reliability", "Risk visibility", "Follow-through"],
  },
  {
    key: "manager",
    number: "03",
    name: "Manager Effectiveness",
    shortName: "Manager",
    journeyLabel: "Succeed through others.",
    tagline: "Turn managerial intent into accountable team performance.",
    audience: "Managers & People Leaders",
    description:
      "Equip managers to create coaching routines, clearer delegation and earlier performance conversations across their teams.",
    buyerOutcome: "Lift team accountability without adding another management programme.",
    pipelineMicrocopy: "Build coaching, delegation and accountability into the manager’s operating rhythm.",
    ctaLabel: "Start your Manager diagnostic",
    href: "/manager/diagnostics",
    focus: ["Coaching cadence", "Delegation clarity", "Team accountability"],
  },
  {
    key: "leader",
    number: "04",
    name: "Leader Intelligence",
    shortName: "Leader",
    journeyLabel: "Succeed through the organisation.",
    tagline: "Build the alignment required to execute through complexity.",
    audience: "Strategic & Business Leaders",
    description:
      "Develop leaders who align functions around strategic choices, improve decision quality and mobilise enterprise-wide action.",
    buyerOutcome: "Increase your organisation’s capacity to execute the decisions that matter most.",
    pipelineMicrocopy: "Strengthen strategic alignment, enterprise influence and execution across boundaries.",
    ctaLabel: "Start your Leadership diagnostic",
    href: "/home",
    focus: ["Strategic alignment", "Decision quality", "Enterprise execution"],
  },
];

export const defaultStageIndex = 1;

export function getCareerStage(index: number) {
  return careerStages[index] ?? careerStages[defaultStageIndex];
}

export const intelligenceLoop = [
  "Diagnose",
  "Understand",
  "Recommend",
  "Practice",
  "Act",
  "Measure",
  "Adapt",
];

export const intelligenceCore = [
  "Diagnostics",
  "Judgement",
  "Recommendations",
  "AI coaching",
  "Simulations",
  "Actions",
  "Outcomes",
  "Learning",
];

export const personalisationAnswers = {
  Professional:
    "How do I take ownership, communicate risk and get the work back on track?",
  Manager:
    "How do I diagnose what’s blocking the team, delegate effectively and restore accountability?",
  Leader:
    "What systemic issue is causing the failure, who needs to align and what organisational decision needs to be made?",
} as const;

export type PersonalisationLevel = keyof typeof personalisationAnswers;

export const personalisationLevels = Object.keys(
  personalisationAnswers,
) as PersonalisationLevel[];

export function getPersonalisationAnswer(level: PersonalisationLevel) {
  return personalisationAnswers[level];
}
