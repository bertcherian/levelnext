// ─── Strategic Thinking Intelligence (STI) ─────────────────────────────────
// Module 6 of LevelNext — The Leadership Intelligence Platform
// 10 dimensions · 30 questions · 4 score bands · 4 archetypes

export const STI_MODULE_ID = "STI" as const;

// ─── Dimensions ──────────────────────────────────────────────────────────────

export interface StiDimension {
  id: string;
  label: string;
  shortLabel: string;
  definition: string;
  highScorer: string;
  lowScorer: string;
  tooltip: string;
}

export const STI_DIMENSIONS: StiDimension[] = [
  {
    id: "strategic_clarity",
    label: "Strategic Clarity",
    shortLabel: "Clarity",
    definition:
      "The ability to define what truly matters, separate signal from noise, and articulate a clear strategic direction.",
    highScorer:
      "Demonstrates clarity of direction, focus, and intent — can answer 'where are we going?' with precision.",
    lowScorer:
      "May be busy, reactive, vague, or pulled into too many priorities without a clear north star.",
    tooltip:
      "Measures whether you can cut through noise, define what truly matters, and articulate a clear strategic direction for your team or function.",
  },
  {
    id: "business_acumen",
    label: "Business Acumen",
    shortLabel: "Acumen",
    definition:
      "The ability to understand how the business creates value, makes money, competes, grows, and sustains performance.",
    highScorer:
      "Connects decisions to business outcomes — revenue, cost, margin, customer value, and competitive advantage.",
    lowScorer:
      "May think mainly from a functional or activity-based lens rather than an enterprise value lens.",
    tooltip:
      "Assesses how well you connect your decisions and recommendations to real business outcomes — revenue, margin, customer value, and competitive position.",
  },
  {
    id: "systems_thinking",
    label: "Systems Thinking",
    shortLabel: "Systems",
    definition:
      "The ability to see interdependencies across functions, teams, processes, customers, technology, culture, and external forces.",
    highScorer:
      "Sees patterns, linkages, unintended consequences, and systemic leverage points beyond silos.",
    lowScorer:
      "May solve local problems while creating larger organisational issues by missing second-order effects.",
    tooltip:
      "Measures whether you think beyond your own silo, understand how decisions ripple across the organisation, and anticipate second-order consequences.",
  },
  {
    id: "long_term_orientation",
    label: "Long-Term Orientation",
    shortLabel: "Long-Term",
    definition:
      "The ability to balance immediate execution with future readiness and avoid being trapped in short-term firefighting.",
    highScorer:
      "Protects time and resources for future capability while managing current execution demands.",
    lowScorer:
      "Consumed by operational urgency and may sacrifice long-term value for short-term relief.",
    tooltip:
      "Assesses whether you can think beyond the quarter, anticipate future capability needs, and protect space for strategic work amid execution pressure.",
  },
  {
    id: "market_external_awareness",
    label: "Market & External Awareness",
    shortLabel: "External",
    definition:
      "The ability to track shifts in customers, competitors, technology, regulation, talent, and macro trends.",
    highScorer:
      "Brings an outside-in perspective — connects external change to internal strategic choices.",
    lowScorer:
      "Operates mainly from internal assumptions and current organisational routines, missing external signals.",
    tooltip:
      "Measures how well you track and connect external shifts — market, customer, technology, competitor — to the strategic choices you make internally.",
  },
  {
    id: "insight_generation",
    label: "Insight Generation",
    shortLabel: "Insight",
    definition:
      "The ability to convert data, observations, conversations, and experience into meaningful strategic insights.",
    highScorer:
      "Generates insight, not just information — notices patterns and frames implications others may miss.",
    lowScorer:
      "May collect data without producing strategic interpretation or asking the questions that reframe the problem.",
    tooltip:
      "Assesses whether you can turn data and observations into strategic insight — identifying what others miss and asking questions that reframe the problem.",
  },
  {
    id: "strategic_prioritisation",
    label: "Strategic Prioritisation",
    shortLabel: "Prioritisation",
    definition:
      "The ability to make choices about what to do, what not to do, and where to allocate attention, resources, and leadership energy.",
    highScorer:
      "Disciplined about strategic choices — makes clear trade-offs under pressure.",
    lowScorer:
      "Allows everything to become important, creating dilution, overload, and reduced strategic impact.",
    tooltip:
      "Measures whether you can make real trade-offs — choosing what not to do as deliberately as what to do — and protect your team from strategic dilution.",
  },
  {
    id: "scenario_thinking",
    label: "Scenario Thinking & Risk Anticipation",
    shortLabel: "Scenarios",
    definition:
      "The ability to imagine multiple possible futures, identify risks early, and prepare options before events force action.",
    highScorer:
      "Thinks in options and probabilities — prepares contingencies before disruption arrives.",
    lowScorer:
      "Assumes the current path will continue and is surprised by predictable disruption.",
    tooltip:
      "Assesses whether you think in multiple futures, sense risks early, and build options before circumstances force reactive decisions.",
  },
  {
    id: "innovation_opportunity",
    label: "Innovation & Opportunity Orientation",
    shortLabel: "Innovation",
    definition:
      "The ability to spot new possibilities, challenge assumptions, and create future value through new products, processes, or business models.",
    highScorer:
      "Actively searches for new value — imagines what could be different, not just what can be optimised.",
    lowScorer:
      "May over-protect the current model and resist experimentation that could create future advantage.",
    tooltip:
      "Measures whether you actively look for new ways to create value — challenging assumptions and supporting experiments — rather than only optimising what exists.",
  },
  {
    id: "strategic_communication",
    label: "Strategic Communication & Alignment",
    shortLabel: "Communication",
    definition:
      "The ability to translate strategy into a compelling narrative that others understand, believe in, and act on.",
    highScorer:
      "Makes strategy understandable and actionable — aligns stakeholders and connects execution to enterprise priorities.",
    lowScorer:
      "May have good ideas but fail to mobilise others due to complexity, jargon, or poor stakeholder alignment.",
    tooltip:
      "Assesses whether you can simplify complexity, align stakeholders, and connect your team's daily work to the larger strategic direction.",
  },
];

// ─── Questions ───────────────────────────────────────────────────────────────

export interface StiQuestion {
  id: string;
  dimensionId: string;
  text: string;
  reverseScore?: boolean;
}

export const STI_QUESTIONS: StiQuestion[] = [
  // Strategic Clarity (Q1–3)
  {
    id: "sti_q1",
    dimensionId: "strategic_clarity",
    text: "I can identify the few strategic choices that matter most, even when many issues compete for attention.",
  },
  {
    id: "sti_q2",
    dimensionId: "strategic_clarity",
    text: "I regularly clarify what my team or function should stop doing so that we can focus on higher-value priorities.",
  },
  {
    id: "sti_q3",
    dimensionId: "strategic_clarity",
    text: "I can explain the strategic direction of my area in a simple and compelling way.",
  },

  // Business Acumen (Q4–6)
  {
    id: "sti_q4",
    dimensionId: "business_acumen",
    text: "I connect my decisions to business outcomes such as revenue, cost, margin, customer value, or risk.",
  },
  {
    id: "sti_q5",
    dimensionId: "business_acumen",
    text: "I understand how my function contributes to the larger business model and competitive position of the organisation.",
  },
  {
    id: "sti_q6",
    dimensionId: "business_acumen",
    text: "I consider financial, customer, and operational trade-offs before recommending major decisions.",
  },

  // Systems Thinking (Q7–9)
  {
    id: "sti_q7",
    dimensionId: "systems_thinking",
    text: "I look beyond my own function to understand how decisions affect other teams, customers, and the wider organisation.",
  },
  {
    id: "sti_q8",
    dimensionId: "systems_thinking",
    text: "I actively consider second-order consequences before implementing important changes.",
  },
  {
    id: "sti_q9",
    dimensionId: "systems_thinking",
    text: "I can identify the underlying patterns or system issues behind recurring problems.",
  },

  // Long-Term Orientation (Q10–12)
  {
    id: "sti_q10",
    dimensionId: "long_term_orientation",
    text: "I protect time for future-focused thinking, even when current execution pressures are high.",
  },
  {
    id: "sti_q11",
    dimensionId: "long_term_orientation",
    text: "I consider what capabilities my team or function will need 12–24 months from now.",
  },
  {
    id: "sti_q12",
    dimensionId: "long_term_orientation",
    text: "I avoid solving today's problems in ways that create larger problems for the future.",
  },

  // Market & External Awareness (Q13–15)
  {
    id: "sti_q13",
    dimensionId: "market_external_awareness",
    text: "I regularly track external shifts that could affect our business, customers, industry, or function.",
  },
  {
    id: "sti_q14",
    dimensionId: "market_external_awareness",
    text: "I bring outside-in perspectives into internal planning and decision-making conversations.",
  },
  {
    id: "sti_q15",
    dimensionId: "market_external_awareness",
    text: "I challenge internal assumptions when market, customer, technology, or competitive realities are changing.",
  },

  // Insight Generation (Q16–18)
  {
    id: "sti_q16",
    dimensionId: "insight_generation",
    text: "I convert data, observations, and conversations into clear strategic implications.",
  },
  {
    id: "sti_q17",
    dimensionId: "insight_generation",
    text: "I notice patterns or weak signals that others may miss.",
  },
  {
    id: "sti_q18",
    dimensionId: "insight_generation",
    text: "I ask questions that help people reframe the problem rather than only solve the obvious issue.",
  },

  // Strategic Prioritisation (Q19–21)
  {
    id: "sti_q19",
    dimensionId: "strategic_prioritisation",
    text: "I make clear trade-offs when resources, time, or leadership attention are limited.",
  },
  {
    id: "sti_q20",
    dimensionId: "strategic_prioritisation",
    text: "I prevent my team from treating every task or request as equally important.",
  },
  {
    id: "sti_q21",
    dimensionId: "strategic_prioritisation",
    text: "I can distinguish between urgent activity and strategically important work.",
  },

  // Scenario Thinking & Risk Anticipation (Q22–24)
  {
    id: "sti_q22",
    dimensionId: "scenario_thinking",
    text: "I consider multiple possible future scenarios before committing to important plans.",
  },
  {
    id: "sti_q23",
    dimensionId: "scenario_thinking",
    text: "I identify risks early enough to create options rather than react under pressure.",
  },
  {
    id: "sti_q24",
    dimensionId: "scenario_thinking",
    text: "I prepare contingency plans for critical initiatives or decisions.",
  },

  // Innovation & Opportunity Orientation (Q25–27)
  {
    id: "sti_q25",
    dimensionId: "innovation_opportunity",
    text: "I actively look for new ways to create value beyond improving current processes.",
  },
  {
    id: "sti_q26",
    dimensionId: "innovation_opportunity",
    text: "I challenge existing assumptions about how work, products, services, or business models should operate.",
  },
  {
    id: "sti_q27",
    dimensionId: "innovation_opportunity",
    text: "I support experiments that may create future advantage, even when outcomes are uncertain.",
  },

  // Strategic Communication & Alignment (Q28–30)
  {
    id: "sti_q28",
    dimensionId: "strategic_communication",
    text: "I translate complex strategic ideas into messages that stakeholders can understand and act on.",
  },
  {
    id: "sti_q29",
    dimensionId: "strategic_communication",
    text: "I align key stakeholders before pushing important strategic recommendations forward.",
  },
  {
    id: "sti_q30",
    dimensionId: "strategic_communication",
    text: "I connect my team's day-to-day work to larger enterprise priorities.",
  },
];

// ─── Score Bands ─────────────────────────────────────────────────────────────

export interface StiBand {
  id: string;
  label: string;
  minPct: number;
  maxPct: number;
  description: string;
  coachingNote: string;
  color: string;
}

export const STI_BANDS: StiBand[] = [
  {
    id: "strategic_shaper",
    label: "Strategic Shaper",
    minPct: 85,
    maxPct: 100,
    description:
      "This leader demonstrates strong strategic thinking capability. They are able to see beyond immediate execution, make clear choices, connect business realities to future possibilities, and align stakeholders around direction.",
    coachingNote:
      "Your strategic thinking is a genuine leadership asset. The focus now is on applying it at greater scale — influencing enterprise-level decisions, developing strategic thinking in your team, and ensuring your clarity translates into sustained organisational momentum.",
    color: "#16a34a",
  },
  {
    id: "strategic_contributor",
    label: "Strategic Contributor",
    minPct: 70,
    maxPct: 84,
    description:
      "This leader shows good strategic capability but may still have gaps in consistency, influence, long-term thinking, or enterprise-level perspective. They can contribute meaningfully to strategy but may need to strengthen one or two critical dimensions.",
    coachingNote:
      "You have real strategic instincts. The development opportunity is in the dimensions where you are inconsistent — particularly under pressure, when execution demands crowd out strategic thinking. Closing those gaps will significantly increase your leadership impact.",
    color: "#2563eb",
  },
  {
    id: "emerging_strategic_leader",
    label: "Emerging Strategic Leader",
    minPct: 55,
    maxPct: 69,
    description:
      "This leader has some strategic instincts but may still be operating largely from an execution, functional, or reactive mindset. They need to build stronger habits of prioritisation, external awareness, systems thinking, and strategic communication.",
    coachingNote:
      "You are at a critical transition point — from operational excellence to strategic leadership. The habits you build now will determine whether you grow into a strategic leader or remain an excellent executor. The diagnostic shows you exactly where to focus.",
    color: "#d97706",
  },
  {
    id: "execution_heavy_leader",
    label: "Execution-Heavy Leader",
    minPct: 0,
    maxPct: 54,
    description:
      "This leader may be strong in delivery but is likely underdeveloped in strategic thinking. They may be overly consumed by immediate tasks, unclear trade-offs, internal pressures, and short-term problem-solving.",
    coachingNote:
      "Execution strength is valuable — but at your level, it is not enough. The diagnostic reveals specific thinking patterns that are limiting your strategic impact. This is not about working harder. It is about thinking differently about where you spend your leadership attention.",
    color: "#dc2626",
  },
];

// ─── Scoring Engine ───────────────────────────────────────────────────────────

export interface StiDimensionScore {
  dimensionId: string;
  label: string;
  shortLabel: string;
  rawScore: number;
  maxScore: number;
  pct: number;
  band: string;
  bandColor: string;
  interpretation: string;
}

export interface StiResult {
  totalRaw: number;
  maxRaw: number;
  overallPct: number;
  band: StiBand;
  dimensions: StiDimensionScore[];
  topStrengths: StiDimensionScore[];
  topDevelopmentAreas: StiDimensionScore[];
}

function getDimensionBand(pct: number): { band: string; color: string } {
  if (pct >= 85) return { band: "Strength", color: "#16a34a" };
  if (pct >= 70) return { band: "Developing", color: "#2563eb" };
  if (pct >= 55) return { band: "Emerging", color: "#d97706" };
  return { band: "Risk Area", color: "#dc2626" };
}

function getDimensionInterpretation(dim: StiDimension, pct: number): string {
  if (pct >= 85) return dim.highScorer;
  if (pct >= 55) return `Showing some ${dim.shortLabel.toLowerCase()} capability with room to strengthen consistency.`;
  return dim.lowScorer;
}

export function scoreSti(answers: Record<string, number>): StiResult {
  const dimensionScores: StiDimensionScore[] = STI_DIMENSIONS.map((dim) => {
    const dimQuestions = STI_QUESTIONS.filter((q) => q.dimensionId === dim.id);
    const rawScore = dimQuestions.reduce((sum, q) => {
      const val = answers[q.id] ?? 3;
      return sum + (q.reverseScore ? 6 - val : val);
    }, 0);
    const maxScore = dimQuestions.length * 5;
    const pct = Math.round((rawScore / maxScore) * 100);
    const { band, color } = getDimensionBand(pct);
    return {
      dimensionId: dim.id,
      label: dim.label,
      shortLabel: dim.shortLabel,
      rawScore,
      maxScore,
      pct,
      band,
      bandColor: color,
      interpretation: getDimensionInterpretation(dim, pct),
    };
  });

  const totalRaw = dimensionScores.reduce((s, d) => s + d.rawScore, 0);
  const maxRaw = STI_QUESTIONS.length * 5; // 150
  const overallPct = Math.round((totalRaw / maxRaw) * 100);

  const band =
    STI_BANDS.find((b) => overallPct >= b.minPct && overallPct <= b.maxPct) ??
    STI_BANDS[STI_BANDS.length - 1];

  const sorted = [...dimensionScores].sort((a, b) => b.pct - a.pct);
  const topStrengths = sorted.slice(0, 3);
  const topDevelopmentAreas = [...dimensionScores]
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 3);

  return {
    totalRaw,
    maxRaw,
    overallPct,
    band,
    dimensions: dimensionScores,
    topStrengths,
    topDevelopmentAreas,
  };
}

// ─── Personalisation Logic ────────────────────────────────────────────────────

export function getStiPersonalisationInsights(result: StiResult): string[] {
  const insights: string[] = [];
  const dimMap = Object.fromEntries(result.dimensions.map((d) => [d.dimensionId, d.pct]));

  if ((dimMap.strategic_clarity ?? 0) >= 70 && (dimMap.strategic_communication ?? 0) < 55) {
    insights.push(
      "The leader appears to have clear thinking but may not yet be translating that clarity into stakeholder alignment."
    );
  }
  if ((dimMap.business_acumen ?? 0) < 55) {
    insights.push(
      "The leader may be thinking from a functional excellence lens rather than an enterprise value lens."
    );
  }
  if ((dimMap.systems_thinking ?? 0) < 55) {
    insights.push(
      "The leader may be solving visible problems without fully addressing interdependencies or root causes."
    );
  }
  if ((dimMap.strategic_prioritisation ?? 0) < 55) {
    insights.push(
      "The leader may be carrying too many priorities, which can dilute focus and reduce strategic impact."
    );
  }
  if ((dimMap.market_external_awareness ?? 0) < 55) {
    insights.push(
      "The leader may be too internally focused and could miss shifts in customer, market, technology, or competitor realities."
    );
  }
  if ((dimMap.innovation_opportunity ?? 0) < 55) {
    insights.push(
      "The leader may be optimising the present but not sufficiently creating future options."
    );
  }
  if ((dimMap.scenario_thinking ?? 0) < 55) {
    insights.push(
      "The leader may be vulnerable to disruption because they are not preparing for multiple possible futures."
    );
  }
  if ((dimMap.strategic_communication ?? 0) >= 70) {
    insights.push(
      "The leader is likely able to make strategy understandable and mobilise others around direction."
    );
  }
  return insights;
}
