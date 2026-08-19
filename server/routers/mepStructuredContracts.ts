import { z } from "zod";

export const DIAGNOSTIC_ANALYSIS_FALLBACK = {};
export const PLAYBOOK_FALLBACK = {};
export const COMMITMENT_SUGGESTIONS_FALLBACK = { suggestions: [] as Array<{ category: string; title: string; why: string }> };

export const diagnosticAnalysisSchema = z.object({
  headline: z.string().optional(),
  strengths: z.array(z.object({ title: z.string(), description: z.string() })).optional(),
  risks: z.array(z.object({ title: z.string(), description: z.string() })).optional(),
  blindSpots: z.array(z.object({ title: z.string(), description: z.string() })).optional(),
  behaviouralObservations: z.array(z.string()).optional(),
  learningPath: z.array(z.object({
    priority: z.number(),
    focus: z.string(),
    action: z.string(),
    timeframe: z.string(),
    successSignal: z.string(),
  })).optional(),
  coachQuestion: z.string().optional(),
});

// Playbook types intentionally carry specialised fields. The common contract is
// validated here while type-specific content remains preserved for existing UI.
export const playbookSchema = z.object({
  playbookType: z.string().optional(),
  headline: z.string().optional(),
  diagnosis: z.string().optional(),
  immediateActions: z.array(z.object({ action: z.string(), detail: z.string() })).optional(),
  conversationScript: z.object({
    opening: z.string(),
    keyPoints: z.array(z.string()),
    closing: z.string(),
  }).optional(),
  whatToAvoid: z.array(z.string()).optional(),
  coachingQuestion: z.string().optional(),
}).passthrough();

export const dailyBriefSchema = z.object({
  greeting: z.string(),
  dayTheme: z.string(),
  priorityFocus: z.string(),
  teamPulseItems: z.array(z.object({ type: z.string(), person: z.string(), note: z.string() })),
  managementChallenge: z.string(),
  reflectionQuestion: z.string(),
  learningRecommendation: z.object({ topic: z.string(), why: z.string(), action: z.string() }),
  commitmentReminder: z.string().nullable(),
});

export const practiceFeedbackSchema = z.object({
  overallRating: z.number().min(1).max(5),
  headline: z.string(),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  keyMoment: z.string(),
  nextPractice: z.string(),
  coachingInsight: z.string(),
});

export const teamMemberInsightSchema = z.object({
  summary: z.string(),
  strengths: z.array(z.string()),
  watchOuts: z.array(z.string()),
  recommendedActions: z.array(z.string()),
  evidenceBoundary: z.string(),
});

export const commitmentSuggestionsSchema = z.object({
  suggestions: z.array(z.object({ category: z.string(), title: z.string(), why: z.string() })),
});

export const DAILY_BRIEF_FALLBACK = {
  greeting: "Good morning. Ready to lead well today?",
  dayTheme: "Intentional Leadership",
  priorityFocus: "Have one meaningful coaching conversation with a team member today.",
  teamPulseItems: [] as Array<{ type: string; person: string; note: string }>,
  managementChallenge: "Before your first meeting, write down the one thing your team needs most from you today.",
  reflectionQuestion: "What would make today a great day of management for you?",
  learningRecommendation: { topic: "Delegation", why: "A key growth area", action: "Identify one task to delegate today" },
  commitmentReminder: null,
};

export const PRACTICE_FEEDBACK_FALLBACK = {
  overallRating: 3,
  headline: "Practice session completed.",
  strengths: [] as string[],
  improvements: [] as string[],
  keyMoment: "",
  nextPractice: "",
  coachingInsight: "",
};

export const TEAM_MEMBER_INSIGHT_FALLBACK = {
  summary: "",
  strengths: [] as string[],
  watchOuts: [] as string[],
  recommendedActions: [] as string[],
  evidenceBoundary: "This coaching lens should be validated in conversation with the team member.",
};
