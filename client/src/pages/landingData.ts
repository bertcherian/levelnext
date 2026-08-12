export type CareerStage = {
  key: string;
  number: string;
  name: string;
  shortName: string;
  journeyLabel: string;
  tagline: string;
  audience: string;
  description: string;
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
    tagline: "Your first 1,000 days shape what comes next.",
    audience: "Early Career Professionals",
    description:
      "Help early-career talent learn how work works, build professional confidence and turn their first 1,000 days into visible growth.",
    pipelineMicrocopy: "Build workplace confidence, capability and habits from day one.",
    ctaLabel: "Start your Early Career journey",
    href: "/early-career",
    focus: ["Workplace confidence", "Professional habits", "Visible growth"],
  },
  {
    key: "professional",
    number: "02",
    name: "Professional Intelligence",
    shortName: "Professional",
    journeyLabel: "Become exceptional at your work.",
    tagline: "Become exceptional at getting work done.",
    audience: "Individual contributors",
    description:
      "Understand the capabilities that matter most, see where work is getting stuck and build the behaviours that increase your effectiveness.",
    pipelineMicrocopy: "Diagnose the habits that make everyday work flow.",
    ctaLabel: "Start your PEI diagnostic",
    href: "/pe/assessment",
    focus: ["Ownership", "Execution", "Influence"],
  },
  {
    key: "manager",
    number: "03",
    name: "Manager Effectiveness",
    shortName: "Manager",
    journeyLabel: "Succeed through others.",
    tagline: "Your job changed. Did the way you work?",
    audience: "Managers & People Leaders",
    description:
      "Make the shift from individual output to team performance—by learning to enable, coach and create accountability through others.",
    pipelineMicrocopy: "Turn individual output into accountable team performance.",
    ctaLabel: "Start your Manager diagnostic",
    href: "/manager/diagnostics",
    focus: ["Coaching", "Delegation", "Team performance"],
  },
  {
    key: "leader",
    number: "04",
    name: "Leader Intelligence",
    shortName: "Leader",
    journeyLabel: "Succeed through the organisation.",
    tagline: "Leadership begins where authority stops being enough.",
    audience: "Strategic & Business Leaders",
    description:
      "Navigate complexity, influence across boundaries and create outcomes through an organisation—not just a team.",
    pipelineMicrocopy: "Lead across priorities, functions and organisational complexity.",
    ctaLabel: "Start your Leadership diagnostic",
    href: "/diagnostics/lii",
    focus: ["Strategic thinking", "Enterprise influence", "Complexity"],
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
