export const MANAGER_ALTITUDE_QUESTIONS = [
  {
    id: "scope",
    title: "What is most true of your role today?",
    prompt: "Choose the description that feels closest to your current responsibility.",
    options: [
      { value: "own_work", label: "I mainly deliver through my own work", score: 1 },
      { value: "lead_team", label: "I lead a small team and own their outcomes", score: 2 },
      { value: "lead_managers", label: "I lead managers or a larger function", score: 3 },
      { value: "lead_system", label: "I lead across teams, functions, or a business system", score: 4 },
    ],
  },
  {
    id: "current_pattern",
    title: "Where does your time go when pressure rises?",
    prompt: "Think about the pattern you fall back into when the work gets demanding.",
    options: [
      { value: "doing", label: "I take work back or solve it myself", score: 1 },
      { value: "directing", label: "I give answers and closely steer execution", score: 2 },
      { value: "coaching", label: "I coach people to think and act for themselves", score: 3 },
      { value: "multiplying", label: "I shape the system so good decisions travel without me", score: 4 },
    ],
  },
  {
    id: "growth_edge",
    title: "What would create the most leverage for you next?",
    prompt: "Pick the development edge that would change your effectiveness most immediately.",
    options: [
      { value: "delegation", label: "Transfer ownership without taking it back", score: 1 },
      { value: "feedback", label: "Make feedback and accountability conversations land", score: 2 },
      { value: "influence", label: "Influence stakeholders and align across boundaries", score: 3 },
      { value: "strategic_capacity", label: "Create more space for strategic thinking and system leadership", score: 4 },
    ],
  },
  {
    id: "confidence",
    title: "How ready do you feel to change one leadership habit?",
    prompt: "There is no right answer. This helps calibrate the first move, not judge you.",
    options: [
      { value: "not_yet", label: "I know something needs to shift, but I feel unsure", score: 1 },
      { value: "curious", label: "I am curious and willing to try a small experiment", score: 2 },
      { value: "ready", label: "I am ready to practise a different response", score: 3 },
      { value: "committed", label: "I am committed to applying this in real work", score: 4 },
    ],
  },
] as const;

export type ManagerAltitudeQuestionId = (typeof MANAGER_ALTITUDE_QUESTIONS)[number]["id"];
export type ManagerAltitudeAnswer = {
  scope: (typeof MANAGER_ALTITUDE_QUESTIONS)[0]["options"][number]["value"];
  current_pattern: (typeof MANAGER_ALTITUDE_QUESTIONS)[1]["options"][number]["value"];
  growth_edge: (typeof MANAGER_ALTITUDE_QUESTIONS)[2]["options"][number]["value"];
  confidence: (typeof MANAGER_ALTITUDE_QUESTIONS)[3]["options"][number]["value"];
};

export type ManagerDevelopmentAltitude = "foundation" | "building" | "scaling" | "multiplying";

export type ManagerAltitudeResult = {
  altitude: ManagerDevelopmentAltitude;
  label: string;
  score: number;
  focus: string;
  explanation: string;
};

const ALTITUDE_META: Record<ManagerDevelopmentAltitude, { label: string; focus: string; explanation: string }> = {
  foundation: {
    label: "Building the foundation",
    focus: "Make one leadership response more deliberate and repeatable.",
    explanation: "Your first LevelNext move is to create a clear, observable leadership habit in the moments that currently pull you back into doing.",
  },
  building: {
    label: "Building leadership altitude",
    focus: "Shift from directing the work to creating ownership around it.",
    explanation: "You have a base to build on. The next step is to practise the conversations and choices that help other people carry more of the outcome.",
  },
  scaling: {
    label: "Scaling your influence",
    focus: "Lead through alignment, coaching, and cross-boundary influence.",
    explanation: "Your next leverage point is less about knowing what to do and more about helping good decisions travel across people, priorities, and stakeholders.",
  },
  multiplying: {
    label: "Multiplying leadership",
    focus: "Create the conditions for capability and strategic capacity to compound.",
    explanation: "Your starting point is system leadership: protect strategic capacity, develop other leaders, and make the operating rhythm work without constant personal intervention.",
  },
};

export function deriveManagerDevelopmentAltitude(answers: ManagerAltitudeAnswer): ManagerAltitudeResult {
  const questionIds = Object.keys(answers) as ManagerAltitudeQuestionId[];
  const totalScore = questionIds.reduce((sum, questionId) => {
    const question = MANAGER_ALTITUDE_QUESTIONS.find((item) => item.id === questionId);
    const option = question?.options.find((item) => item.value === answers[questionId as keyof ManagerAltitudeAnswer]);
    return sum + (option?.score ?? 0);
  }, 0);
  const score = Math.round((totalScore / (MANAGER_ALTITUDE_QUESTIONS.length * 4)) * 100);
  const altitude: ManagerDevelopmentAltitude = score <= 37 ? "foundation" : score <= 62 ? "building" : score <= 81 ? "scaling" : "multiplying";
  const meta = ALTITUDE_META[altitude];
  return { altitude, label: meta.label, score, focus: meta.focus, explanation: meta.explanation };
}

export const MANAGER_ALTITUDE_OPTIONS = MANAGER_ALTITUDE_QUESTIONS.map((question) => question.options.map((option) => option.value));
