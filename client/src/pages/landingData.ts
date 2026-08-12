export type CareerStage = {
  number: string;
  name: string;
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
    number: "01",
    name: "Launch",
    tagline: "Welcome to work.",
    audience: "Freshers & Early Career",
    description:
      "College taught you how to get the job. LevelNext helps you succeed in it—with the confidence, communication and judgement work asks for.",
    pipelineMicrocopy: "Build confidence for your first 90 days at work.",
    ctaLabel: "Start your Launch journey",
    href: "/launch/home",
    focus: ["Workplace confidence", "Professional judgement", "Communication"],
  },
  {
    number: "02",
    name: "Professional",
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
    number: "03",
    name: "Manager",
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
    number: "04",
    name: "Leader",
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
