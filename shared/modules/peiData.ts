/**
 * Professional Effectiveness Intelligence — Diagnostic Data
 *
 * The Professional Effectiveness Index (PEI) is a 30-question assessment
 * across 6 dimensions of professional effectiveness:
 *
 *   1. Strategic Clarity — thinking strategically, seeing the big picture
 *   2. Execution Discipline — turning plans into results consistently
 *   3. Communication Impact — communicating with clarity and influence
 *   4. Relationship Intelligence — building and leveraging relationships
 *   5. Adaptive Thinking — learning, unlearning, and navigating ambiguity
 *   6. Leadership Presence — projecting confidence, credibility, and trust
 *
 * Each dimension has 5 questions on a 5-point Likert scale.
 * Scores are normalised to 0–100.
 */

export interface PeiQuestion {
  id: string;
  text: string;
  dimensionId: string;
  reversed?: boolean;
}

export interface PeiDimension {
  id: string;
  label: string;
  description: string;
}

export interface PeiZone {
  min: number;
  max: number;
  label: string;
  color: string;
  description: string;
}

export const PEI_DIMENSIONS: PeiDimension[] = [
  {
    id: "strategic_clarity",
    label: "Strategic Clarity",
    description: "Your ability to see the big picture, connect dots across the business, and think strategically about your role and contributions.",
  },
  {
    id: "execution_discipline",
    label: "Execution Discipline",
    description: "Your ability to turn plans into results, follow through on commitments, and maintain high standards of delivery.",
  },
  {
    id: "communication_impact",
    label: "Communication Impact",
    description: "Your ability to communicate with clarity, influence stakeholders, and make your ideas heard and understood.",
  },
  {
    id: "relationship_intelligence",
    label: "Relationship Intelligence",
    description: "Your ability to build, nurture, and leverage professional relationships across and beyond your organisation.",
  },
  {
    id: "adaptive_thinking",
    label: "Adaptive Thinking",
    description: "Your ability to learn quickly, navigate ambiguity, challenge assumptions, and adapt your approach as circumstances change.",
  },
  {
    id: "leadership_presence",
    label: "Leadership Presence",
    description: "Your ability to project confidence, credibility, and trust — how others experience you as a leader and professional.",
  },
];

export const PEI_QUESTIONS: PeiQuestion[] = [
  // Strategic Clarity (5 questions)
  { id: "pei_sc1", text: "I clearly understand how my work connects to the broader business strategy and goals.", dimensionId: "strategic_clarity" },
  { id: "pei_sc2", text: "I regularly think beyond my immediate tasks to consider the bigger picture and long-term implications.", dimensionId: "strategic_clarity" },
  { id: "pei_sc3", text: "I can articulate what success looks like for my role and how it contributes to organisational outcomes.", dimensionId: "strategic_clarity" },
  { id: "pei_sc4", text: "I proactively identify opportunities and risks that others may not see.", dimensionId: "strategic_clarity" },
  { id: "pei_sc5", text: "I make decisions that align with the strategic direction, even when under pressure to do otherwise.", dimensionId: "strategic_clarity" },

  // Execution Discipline (5 questions)
  { id: "pei_ed1", text: "I consistently deliver on my commitments, even when circumstances are challenging.", dimensionId: "execution_discipline" },
  { id: "pei_ed2", text: "I break complex goals into clear, actionable steps with realistic timelines.", dimensionId: "execution_discipline" },
  { id: "pei_ed3", text: "I hold myself and others to high standards of quality and timeliness.", dimensionId: "execution_discipline" },
  { id: "pei_ed4", text: "When I encounter obstacles, I find ways around them rather than losing momentum.", dimensionId: "execution_discipline" },
  { id: "pei_ed5", text: "I follow through on every commitment I make — no loose ends.", dimensionId: "execution_discipline" },

  // Communication Impact (5 questions)
  { id: "pei_ci1", text: "I can communicate complex ideas simply and clearly to any audience.", dimensionId: "communication_impact" },
  { id: "pei_ci2", text: "I adjust my communication style based on who I am speaking with and what they need to hear.", dimensionId: "communication_impact" },
  { id: "pei_ci3", text: "My ideas are heard and taken seriously in meetings and discussions.", dimensionId: "communication_impact" },
  { id: "pei_ci4", text: "I can influence decisions and outcomes through how I present information and arguments.", dimensionId: "communication_impact" },
  { id: "pei_ci5", text: "I listen actively and make others feel genuinely heard before responding.", dimensionId: "communication_impact" },

  // Relationship Intelligence (5 questions)
  { id: "pei_ri1", text: "I have a strong network of professional relationships that I actively maintain.", dimensionId: "relationship_intelligence" },
  { id: "pei_ri2", text: "I invest time in building relationships before I need them.", dimensionId: "relationship_intelligence" },
  { id: "pei_ri3", text: "I can navigate difficult interpersonal situations with grace and effectiveness.", dimensionId: "relationship_intelligence" },
  { id: "pei_ri4", text: "I am known as someone who collaborates well across teams and functions.", dimensionId: "relationship_intelligence" },
  { id: "pei_ri5", text: "I actively help others succeed, even when there is no direct benefit to me.", dimensionId: "relationship_intelligence" },

  // Adaptive Thinking (5 questions)
  { id: "pei_at1", text: "I learn new concepts and skills quickly, even in unfamiliar domains.", dimensionId: "adaptive_thinking" },
  { id: "pei_at2", text: "I am comfortable with ambiguity and can make progress without having all the answers.", dimensionId: "adaptive_thinking" },
  { id: "pei_at3", text: "I regularly challenge my own assumptions and seek out perspectives that differ from mine.", dimensionId: "adaptive_thinking" },
  { id: "pei_at4", text: "When something isn't working, I pivot quickly rather than persisting with a failing approach.", dimensionId: "adaptive_thinking" },
  { id: "pei_at5", text: "I see failure as a learning opportunity and extract lessons from setbacks.", dimensionId: "adaptive_thinking" },

  // Leadership Presence (5 questions)
  { id: "pei_lp1", text: "I project confidence and credibility in high-stakes situations.", dimensionId: "leadership_presence" },
  { id: "pei_lp2", text: "Others trust my judgment and seek me out for advice or perspective.", dimensionId: "leadership_presence" },
  { id: "pei_lp3", text: "I remain calm and composed under pressure, even when others are not.", dimensionId: "leadership_presence" },
  { id: "pei_lp4", text: "I take ownership of outcomes — both successes and failures — without deflecting.", dimensionId: "leadership_presence" },
  { id: "pei_lp5", text: "I inspire confidence in others about the direction and the plan.", dimensionId: "leadership_presence" },
];

export const PEI_ZONES: PeiZone[] = [
  { min: 0, max: 39, label: "Emerging", color: "#ef4444", description: "Foundational growth stage — significant opportunity to develop core professional effectiveness capabilities" },
  { min: 40, max: 59, label: "Developing", color: "#f97316", description: "Building momentum — key behaviours are emerging but not yet consistent" },
  { min: 60, max: 74, label: "Effective", color: "#eab308", description: "Solid performance — consistently applying effective professional practices" },
  { min: 75, max: 89, label: "Strong", color: "#22c55e", description: "High effectiveness — a role model in most areas of professional effectiveness" },
  { min: 90, max: 100, label: "Exceptional", color: "#6366f1", description: "Mastery level — consistently exceptional across all dimensions of professional effectiveness" },
];

export function getZone(score: number): PeiZone {
  return PEI_ZONES.find((z) => score >= z.min && score <= z.max) ?? PEI_ZONES[0];
}

export function scoreDimension(responses: Record<string, number>, dimensionId: string): number {
  const dimQuestions = PEI_QUESTIONS.filter((q) => q.dimensionId === dimensionId);
  if (dimQuestions.length === 0) return 0;
  let total = 0;
  let count = 0;
  for (const q of dimQuestions) {
    const raw = responses[q.id];
    if (raw === undefined || raw === null) continue;
    const adjusted = q.reversed ? 6 - raw : raw;
    total += adjusted;
    count++;
  }
  if (count === 0) return 0;
  const avg = total / count;
  return Math.round(((avg - 1) / 4) * 100);
}

export function scoreOverall(responses: Record<string, number>): number {
  let total = 0;
  let count = 0;
  for (const dim of PEI_DIMENSIONS) {
    const dimScore = scoreDimension(responses, dim.id);
    total += dimScore;
    count++;
  }
  return count > 0 ? Math.round(total / count) : 0;
}

export function scoreAllDimensions(responses: Record<string, number>): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const dim of PEI_DIMENSIONS) {
    scores[dim.id] = scoreDimension(responses, dim.id);
  }
  return scores;
}

export const PEI_PRACTICE_SCENARIOS = [
  { id: "executive_presentation", label: "Executive Presentation", icon: "📊", description: "Present a strategic proposal to senior leadership and handle tough questions" },
  { id: "difficult_peer", label: "Difficult Peer Conversation", icon: "🤝", description: "Address a conflict with a peer who is blocking your work" },
  { id: "managing_up", label: "Managing Up", icon: "⬆️", description: "Push back on your manager's direction without damaging the relationship" },
  { id: "stakeholder_buyin", label: "Stakeholder Buy-In", icon: "🎯", description: "Persuade a skeptical stakeholder to support your initiative" },
  { id: "performance_review", label: "Performance Review", icon: "📝", description: "Deliver a balanced performance review to a direct report" },
  { id: "salary_negotiation", label: "Salary Negotiation", icon: "💰", description: "Negotiate your compensation package with confidence" },
  { id: "team_alignment", label: "Team Alignment", icon: "🧭", description: "Align a divided team on a controversial decision" },
  { id: "client_escalation", label: "Client Escalation", icon: "🔥", description: "Handle an angry client escalation with composure" },
  { id: "delegation", label: "Delegation Conversation", icon: "📋", description: "Delegate a high-stakes project to a team member effectively" },
  { id: "feedback_resistance", label: "Giving Difficult Feedback", icon: "💬", description: "Give honest developmental feedback to a defensive colleague" },
  { id: "career_conversation", label: "Career Conversation", icon: "🗺️", description: "Have a career development conversation with your manager" },
  { id: "cross_functional", label: "Cross-Functional Influence", icon: "🔗", description: "Influence outcomes across teams where you have no authority" },
];

export const PEI_COACH_STARTERS = [
  { label: "I have a high-stakes meeting tomorrow and need to prepare", icon: "🎯" },
  { label: "I'm struggling to influence a key stakeholder", icon: "🤝" },
  { label: "I need to have a difficult conversation with a colleague", icon: "💬" },
  { label: "I want to improve my executive presence", icon: "👔" },
  { label: "I'm feeling stuck in my career and need direction", icon: "🧭" },
  { label: "I need to delegate more effectively", icon: "📋" },
  { label: "I want to communicate more impactfully", icon: "📢" },
  { label: "I need to build better relationships at work", icon: "🔗" },
];
