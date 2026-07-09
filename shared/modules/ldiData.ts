/**
 * Leadership Derailment Intelligence (LDI) Diagnostic
 * "The hidden patterns that stall strong leaders — finally measured."
 *
 * 10 dimensions × 3 questions = 30 questions
 * 5-point Likert: 1 = Rarely true → 5 = Consistently true
 * Reverse-scored questions: Q2, Q5, Q8, Q11, Q14, Q17, Q20, Q23, Q26, Q29
 * Dimension score: sum of 3 (after reverse scoring) → range 3–15 → normalised to 0–100
 * Overall score: average of 10 dimension scores (equal weighting)
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LdiDimension {
  id: string;
  name: string;
  shortName: string;
  definition: string;
  whyItMatters: string;
  highRiskBehaviors: string[];
}

export interface LdiQuestion {
  id: number;
  dimensionId: string;
  text: string;
  reverseScored: boolean;
}

export interface LdiRiskBand {
  id: string;
  label: string;
  range: [number, number];
  description: string;
  implication: string;
}

export interface LdiArchetype {
  id: string;
  name: string;
  tagline: string;
  description: string;
  strengths: string[];
  risks: string[];
  developmentFocus: string;
  /** Overall score range that typically produces this archetype */
  scoreRange: [number, number];
  /** Dimension IDs that, when low, strongly suggest this archetype */
  triggerDimensions: string[];
}

export interface LdiDerivedOutput {
  dimensionId: string;
  dimensionName: string;
  score: number;
  riskBand: string;
}

export interface LdiScoreResult {
  overallScore: number;
  riskBand: string;
  riskBandDescription: string;
  archetypeId: string;
  archetypeLabel: string;
  archetypeTagline: string;
  archetypeStrengths: string[];
  archetypeRisks: string[];
  archetypeDevelopmentFocus: string;
  dimensionScores: Record<string, number>;
  dimensionRiskBands: Record<string, string>;
  topDerailmentRisks: LdiDerivedOutput[];
  topStabilizers: LdiDerivedOutput[];
  edgeScore: number;
  zoneLabel: string;
  zoneDescription: string;
  strongestDimension: string;
  weakestDimension: string;
}

// ─── Dimensions ───────────────────────────────────────────────────────────────

export const LDI_DIMENSIONS: LdiDimension[] = [
  {
    id: "self_awareness",
    name: "Self-Awareness",
    shortName: "Self-Awareness",
    definition:
      "The leader's ability to accurately understand how their behavior, communication, style, and decisions affect others — especially under pressure.",
    whyItMatters:
      "Low self-awareness is one of the biggest derailers because leaders repeat blind spots, misread their impact, and get surprised by feedback they should have seen coming.",
    highRiskBehaviors: [
      "Blind to personal impact",
      "Surprised by negative feedback",
      "Repeats patterns despite consequences",
      "Overestimates strengths and underestimates risks",
    ],
  },
  {
    id: "emotional_regulation",
    name: "Emotional Regulation Under Pressure",
    shortName: "Emotional Regulation",
    definition:
      "The leader's ability to stay composed, constructive, and steady when facing pressure, ambiguity, setbacks, or conflict.",
    whyItMatters:
      "Leaders often derail not because they lack capability, but because pressure exposes volatility, impatience, withdrawal, or emotional inconsistency.",
    highRiskBehaviors: [
      "Visible frustration or impatience",
      "Reactive behavior under stress",
      "Emotional spillover into team climate",
      "People avoid bringing difficult issues",
    ],
  },
  {
    id: "humility_vs_defensiveness",
    name: "Humility vs Defensiveness",
    shortName: "Humility",
    definition:
      "The leader's willingness to listen, be challenged, learn, and revise their view without becoming defensive, dismissive, or ego-driven.",
    whyItMatters:
      "As leaders become more senior, defensiveness destroys learning agility, peer trust, and followership.",
    highRiskBehaviors: [
      "Difficulty being challenged",
      "Needing to be right",
      "Dismissing opposing views too quickly",
      "Taking disagreement personally",
    ],
  },
  {
    id: "trust_relationship_building",
    name: "Trust & Relationship Building",
    shortName: "Trust & Relationships",
    definition:
      "The leader's ability to build credibility, trust, openness, and strong working relationships with team members, peers, and stakeholders.",
    whyItMatters:
      "Leaders who are seen as transactional, self-protective, or hard to trust gradually lose influence and followership.",
    highRiskBehaviors: [
      "Low trust from peers or team",
      "Weak followership",
      "People do not speak openly",
      "Relationships are functional but not strong",
    ],
  },
  {
    id: "stakeholder_management",
    name: "Stakeholder Management & Organizational Navigation",
    shortName: "Stakeholder Navigation",
    definition:
      "The leader's ability to read organizational dynamics, align stakeholders, manage sponsors, and move work through a complex system.",
    whyItMatters:
      "Many strong leaders do not fail because their ideas are weak — they fail because they cannot build alignment, manage power dynamics, or navigate the organization effectively.",
    highRiskBehaviors: [
      "Poor upward management",
      "Gets blindsided by stakeholder resistance",
      "Fails to align key players early",
      "Good ideas die in the system",
    ],
  },
  {
    id: "strategic_thinking",
    name: "Strategic Thinking",
    shortName: "Strategic Thinking",
    definition:
      "The leader's ability to think beyond immediate execution, connect work to business outcomes, anticipate consequences, and make higher-level trade-offs.",
    whyItMatters:
      "Leaders derail when they remain operationally competent but fail to become strategically useful.",
    highRiskBehaviors: [
      "Overly tactical focus",
      "Weak big-picture orientation",
      "Poor prioritization",
      "Misses second-order consequences",
    ],
  },
  {
    id: "decision_making_ambiguity",
    name: "Decision-Making Under Ambiguity",
    shortName: "Decision-Making",
    definition:
      "The leader's ability to make sound, timely decisions when information is incomplete, priorities conflict, or the path forward is uncertain.",
    whyItMatters:
      "Senior leadership requires judgment under uncertainty. Leaders derail when they freeze, delay, reverse too often, or leave teams unclear.",
    highRiskBehaviors: [
      "Analysis paralysis",
      "Delayed decisions",
      "Inconsistent calls",
      "Teams unclear on priorities or ownership",
    ],
  },
  {
    id: "accountability_courage",
    name: "Accountability & Leadership Courage",
    shortName: "Accountability",
    definition:
      "The leader's willingness to own outcomes, confront underperformance, take difficult positions, and address uncomfortable issues directly.",
    whyItMatters:
      "Leaders derail when they become explainers rather than owners, or when they avoid hard calls and hard conversations.",
    highRiskBehaviors: [
      "Blame shifting",
      "Soft accountability",
      "Avoiding difficult conversations",
      "Low follow-through on tough issues",
    ],
  },
  {
    id: "delegation_team_development",
    name: "Delegation & Team Development",
    shortName: "Delegation & Growth",
    definition:
      "The leader's ability to scale through others by delegating effectively, building capability, coaching talent, and avoiding becoming the bottleneck.",
    whyItMatters:
      "What gets many leaders promoted — personal competence and control — becomes what derails them at scale.",
    highRiskBehaviors: [
      "Micromanagement",
      "Decision bottleneck",
      "Weak bench strength",
      "Team overdependence on leader",
    ],
  },
  {
    id: "executive_communication",
    name: "Executive Communication & Presence",
    shortName: "Executive Communication",
    definition:
      "The leader's ability to communicate with clarity, brevity, confidence, and influence in ways that create trust and executive credibility.",
    whyItMatters:
      "Leaders often derail because their capability does not translate into leadership signal. Their ideas do not land, their influence is weaker than it should be, and they are not perceived at the next level.",
    highRiskBehaviors: [
      "Rambling or over-explaining",
      "Weak executive presence",
      "Poor framing with senior stakeholders",
      "Low influence despite strong ideas",
    ],
  },
];

// ─── Questions ────────────────────────────────────────────────────────────────

export const LDI_QUESTIONS: LdiQuestion[] = [
  // DIMENSION 1: Self-Awareness
  {
    id: 1,
    dimensionId: "self_awareness",
    text: "I actively notice how my tone, style, and behavior affect others in meetings and high-stakes situations.",
    reverseScored: false,
  },
  {
    id: 2,
    dimensionId: "self_awareness",
    text: "I am often surprised when others interpret my intentions or behavior differently from how I meant them.",
    reverseScored: true,
  },
  {
    id: 3,
    dimensionId: "self_awareness",
    text: "When I receive difficult feedback, I can usually identify the pattern behind it rather than dismissing it as a one-off.",
    reverseScored: false,
  },

  // DIMENSION 2: Emotional Regulation Under Pressure
  {
    id: 4,
    dimensionId: "emotional_regulation",
    text: "Even when under significant pressure, I remain calm enough for others to bring me bad news or opposing views.",
    reverseScored: false,
  },
  {
    id: 5,
    dimensionId: "emotional_regulation",
    text: "Stress sometimes makes me sharper in output but harder for others to work with.",
    reverseScored: true,
  },
  {
    id: 6,
    dimensionId: "emotional_regulation",
    text: "In tense situations, I can pause, regulate myself, and respond rather than react.",
    reverseScored: false,
  },

  // DIMENSION 3: Humility vs Defensiveness
  {
    id: 7,
    dimensionId: "humility_vs_defensiveness",
    text: "I can be challenged strongly on my ideas without becoming defensive or dismissive.",
    reverseScored: false,
  },
  {
    id: 8,
    dimensionId: "humility_vs_defensiveness",
    text: "When someone questions my judgment, I sometimes focus more on defending my position than understanding their concern.",
    reverseScored: true,
  },
  {
    id: 9,
    dimensionId: "humility_vs_defensiveness",
    text: "I deliberately create room for others to disagree with me, especially when I have positional authority.",
    reverseScored: false,
  },

  // DIMENSION 4: Trust & Relationship Building
  {
    id: 10,
    dimensionId: "trust_relationship_building",
    text: "People who work closely with me would say I create trust rather than caution in the relationship.",
    reverseScored: false,
  },
  {
    id: 11,
    dimensionId: "trust_relationship_building",
    text: "Important working relationships tend to weaken when there is disagreement, pressure, or conflicting priorities.",
    reverseScored: true,
  },
  {
    id: 12,
    dimensionId: "trust_relationship_building",
    text: "I invest in relationships before I need support, alignment, or cooperation from people.",
    reverseScored: false,
  },

  // DIMENSION 5: Stakeholder Management & Organizational Navigation
  {
    id: 13,
    dimensionId: "stakeholder_management",
    text: "Before driving an important initiative, I map who needs to be aligned, influenced, or pre-briefed.",
    reverseScored: false,
  },
  {
    id: 14,
    dimensionId: "stakeholder_management",
    text: "I sometimes assume that a strong idea or strong performance should be enough to carry a decision through the system.",
    reverseScored: true,
  },
  {
    id: 15,
    dimensionId: "stakeholder_management",
    text: "I actively manage relationships upward, sideways, and across functions rather than only within my own team.",
    reverseScored: false,
  },

  // DIMENSION 6: Strategic Thinking
  {
    id: 16,
    dimensionId: "strategic_thinking",
    text: "I regularly connect team priorities and decisions to broader business outcomes, not just immediate deliverables.",
    reverseScored: false,
  },
  {
    id: 17,
    dimensionId: "strategic_thinking",
    text: "I sometimes stay too deep in execution details and miss the larger strategic implications of the work.",
    reverseScored: true,
  },
  {
    id: 18,
    dimensionId: "strategic_thinking",
    text: "When evaluating decisions, I consider second-order consequences, trade-offs, and long-term implications.",
    reverseScored: false,
  },

  // DIMENSION 7: Decision-Making Under Ambiguity
  {
    id: 19,
    dimensionId: "decision_making_ambiguity",
    text: "I can make timely decisions even when the available information is incomplete.",
    reverseScored: false,
  },
  {
    id: 20,
    dimensionId: "decision_making_ambiguity",
    text: "In ambiguous situations, I sometimes delay decisions longer than is useful because I want more certainty.",
    reverseScored: true,
  },
  {
    id: 21,
    dimensionId: "decision_making_ambiguity",
    text: "My team usually has clarity on where I stand, what I have decided, and what happens next.",
    reverseScored: false,
  },

  // DIMENSION 8: Accountability & Leadership Courage
  {
    id: 22,
    dimensionId: "accountability_courage",
    text: "When results fall short, I focus first on what I could have owned or handled differently.",
    reverseScored: false,
  },
  {
    id: 23,
    dimensionId: "accountability_courage",
    text: "I sometimes delay difficult performance or accountability conversations longer than I should.",
    reverseScored: true,
  },
  {
    id: 24,
    dimensionId: "accountability_courage",
    text: "I am willing to take a clear position on difficult issues even when it may create short-term discomfort.",
    reverseScored: false,
  },

  // DIMENSION 9: Delegation & Team Development
  {
    id: 25,
    dimensionId: "delegation_team_development",
    text: "I deliberately hand over meaningful ownership, not just tasks, to grow capability in my team.",
    reverseScored: false,
  },
  {
    id: 26,
    dimensionId: "delegation_team_development",
    text: "I often stay too involved because I believe quality, speed, or reliability will drop if I let go.",
    reverseScored: true,
  },
  {
    id: 27,
    dimensionId: "delegation_team_development",
    text: "My team is becoming more capable and independent over time, not more dependent on me.",
    reverseScored: false,
  },

  // DIMENSION 10: Executive Communication & Presence
  {
    id: 28,
    dimensionId: "executive_communication",
    text: "In senior-level conversations, I can communicate my point clearly, crisply, and with enough authority to influence the room.",
    reverseScored: false,
  },
  {
    id: 29,
    dimensionId: "executive_communication",
    text: "I sometimes lose influence because I over-explain, bury the main point, or fail to frame the issue at the right altitude.",
    reverseScored: true,
  },
  {
    id: 30,
    dimensionId: "executive_communication",
    text: "Senior stakeholders generally leave conversations with a clear sense of my thinking, judgment, and recommendation.",
    reverseScored: false,
  },
];

// ─── Risk Bands ───────────────────────────────────────────────────────────────

export const LDI_RISK_BANDS: LdiRiskBand[] = [
  {
    id: "low",
    label: "Low Derailment Risk",
    range: [85, 100],
    description:
      "The leader currently shows strong patterns of self-management, judgment, influence, and scale. There may still be specific watch-outs, but overall derailment risk is low.",
    implication:
      "Ready for larger leadership scope. Focus on sustaining strengths and identifying the next growth edge.",
  },
  {
    id: "moderate_low",
    label: "Moderate-Low Risk",
    range: [70, 84],
    description:
      "The leader is broadly effective, but there are visible pressure points that could become more costly at the next level or under sustained pressure.",
    implication:
      "Targeted development on 1–2 dimensions will meaningfully increase next-level readiness.",
  },
  {
    id: "moderate",
    label: "Moderate Risk",
    range: [55, 69],
    description:
      "There are meaningful derailment patterns present. The leader is likely effective in some contexts, but these patterns are already constraining influence, trust, scale, or promotability.",
    implication:
      "Structured coaching or development intervention recommended. These patterns will intensify under greater scope.",
  },
  {
    id: "high",
    label: "High Risk",
    range: [40, 54],
    description:
      "Multiple derailment patterns are active. Without intervention, these behaviors are likely damaging effectiveness, leadership reputation, team climate, or next-level readiness.",
    implication:
      "Priority intervention required. A coaching engagement focused on the top 3 derailment dimensions is strongly recommended.",
  },
  {
    id: "critical",
    label: "Critical Derailment Risk",
    range: [0, 39],
    description:
      "The leader is at significant risk of trust erosion, stalled growth, leadership failure, or serious role underperformance unless corrective work happens quickly.",
    implication:
      "Immediate structured intervention required. Consider executive coaching, 360-degree feedback, and sponsor-supported development plan.",
  },
];

// ─── Archetypes ───────────────────────────────────────────────────────────────

export const LDI_ARCHETYPES: LdiArchetype[] = [
  {
    id: "trusted_scaler",
    name: "The Trusted Scaler",
    tagline: "Strong trust, judgment, and scale — ready for the next level.",
    description:
      "You demonstrate strong patterns across self-management, stakeholder trust, strategic judgment, and the ability to scale through others. Your derailment risk is low. The question is not whether you can lead at the next level — it is whether you are actively positioning yourself for it.",
    strengths: [
      "High trust from peers, team, and stakeholders",
      "Sound judgment under pressure and ambiguity",
      "Scales effectively through delegation and team development",
      "Strong executive communication and presence",
    ],
    risks: [
      "May underestimate the political complexity of larger roles",
      "Could become complacent if not actively stretched",
      "Watch-outs may be subtle but still present in specific dimensions",
    ],
    developmentFocus:
      "Identify the one or two dimensions that are not yet at their ceiling. Invest in strategic visibility and sponsor relationships to accelerate next-level readiness.",
    scoreRange: [80, 100],
    triggerDimensions: [],
  },
  {
    id: "strong_performer_at_risk",
    name: "The Strong Performer at Risk of Stall",
    tagline: "Capable and credible — but something is quietly capping the ceiling.",
    description:
      "You are performing well and are broadly respected. But there are specific patterns — most likely in communication, stakeholder management, or strategic visibility — that are quietly limiting your influence and promotability. You may not feel the ceiling yet, but others are already noticing.",
    strengths: [
      "Strong execution and delivery track record",
      "Credible within your function or team",
      "Good relationships with immediate stakeholders",
    ],
    risks: [
      "Leadership signal may not be reaching senior stakeholders",
      "Strategic framing may be weaker than execution capability",
      "Stakeholder alignment may be reactive rather than proactive",
    ],
    developmentFocus:
      "Invest in executive communication, strategic framing, and proactive stakeholder management. Make your thinking visible at the right altitude.",
    scoreRange: [65, 84],
    triggerDimensions: ["executive_communication", "stakeholder_management", "strategic_thinking"],
  },
  {
    id: "overloaded_expert",
    name: "The Overloaded Expert Leader",
    tagline: "Strong on execution — but becoming the bottleneck.",
    description:
      "You are highly capable and deeply invested in quality. But your instinct to stay close to the work — to own, control, and deliver — is becoming a constraint on your team's growth and your own leadership scale. You are likely the most technically capable person in the room, and that is exactly the problem.",
    strengths: [
      "High personal accountability and ownership",
      "Deep subject matter expertise",
      "Strong execution discipline",
    ],
    risks: [
      "Team is dependent on you rather than growing independently",
      "You are the decision bottleneck on too many issues",
      "Strategic thinking time is crowded out by operational involvement",
    ],
    developmentFocus:
      "Practise delegating decision rights, not just tasks. Create deliberate space for your team to fail and learn. Shift from being the best individual contributor to being the best developer of contributors.",
    scoreRange: [55, 79],
    triggerDimensions: ["delegation_team_development", "strategic_thinking"],
  },
  {
    id: "politically_underpowered",
    name: "The Politically Underpowered Leader",
    tagline: "Capable and well-intentioned — but the system is not working for you.",
    description:
      "You have strong capability and good intent, but you are underinvesting in the organizational and political dimensions of leadership. Good ideas are not enough. You need sponsors, aligned stakeholders, and the ability to navigate the system. Without these, your impact will remain smaller than your capability.",
    strengths: [
      "Strong technical or functional expertise",
      "Good intent and genuine commitment to outcomes",
      "Often well-liked within immediate team",
    ],
    risks: [
      "Initiatives stall or get blocked by stakeholders who were not pre-aligned",
      "Visibility with senior leadership is lower than it should be",
      "Decisions and ideas do not move through the organization effectively",
    ],
    developmentFocus:
      "Build a deliberate stakeholder map. Pre-wire key conversations before formal meetings. Invest in upward and lateral relationships before you need them.",
    scoreRange: [50, 74],
    triggerDimensions: ["stakeholder_management", "executive_communication"],
  },
  {
    id: "reactive_high_achiever",
    name: "The Reactive High-Achiever",
    tagline: "Delivers results — but under pressure, the cracks are showing.",
    description:
      "You are a high-achiever who gets things done. But pressure is revealing patterns that are beginning to cost you. Emotional volatility, defensiveness, or trust erosion may be emerging as visible risks — especially in your most important relationships. The higher you go, the more these patterns will be amplified.",
    strengths: [
      "Strong drive and results orientation",
      "High personal standards",
      "Capable of sustained high performance",
    ],
    risks: [
      "Emotional regulation under pressure is a visible risk",
      "Defensiveness may be damaging peer and upward relationships",
      "People may be managing around you rather than engaging directly",
    ],
    developmentFocus:
      "Build emotional regulation practices — especially in high-stakes situations. Seek feedback on how you show up under pressure. Invest in the relationships that are most at risk.",
    scoreRange: [50, 74],
    triggerDimensions: ["emotional_regulation", "humility_vs_defensiveness", "self_awareness"],
  },
  {
    id: "invisible_successor",
    name: "The Invisible Successor",
    tagline: "Strong capability — but not yet visible at the right level.",
    description:
      "You have the capability to lead at a higher level, but you are not yet projecting it. Your executive communication, strategic framing, or leadership signal may not be reaching the people who make decisions about your future. You may be doing excellent work that is not landing at the right altitude.",
    strengths: [
      "Strong underlying capability and judgment",
      "Reliable and consistent performer",
      "Good relationships within immediate scope",
    ],
    risks: [
      "Not perceived as ready for the next level by senior stakeholders",
      "Executive communication may be too detailed or too operational",
      "Strategic thinking may not be visible in how you communicate",
    ],
    developmentFocus:
      "Focus on executive communication and strategic projection. Practice framing your work in business terms. Build visibility with senior stakeholders through deliberate communication choices.",
    scoreRange: [55, 74],
    triggerDimensions: ["executive_communication", "strategic_thinking", "stakeholder_management"],
  },
  {
    id: "friction_creator",
    name: "The Friction-Creating Leader",
    tagline: "Creating more resistance than you realize.",
    description:
      "Trust, defensiveness, emotional reactivity, or low self-awareness are actively undermining your effectiveness and your relationships. You may be delivering results, but the cost — in team climate, peer trust, and stakeholder confidence — is higher than it should be. These patterns are likely visible to others before they are visible to you.",
    strengths: [
      "Often strong on technical delivery",
      "High personal standards",
      "May have strong loyalty from a small inner circle",
    ],
    risks: [
      "Trust is eroding with peers, team, or stakeholders",
      "Emotional volatility or defensiveness is creating friction",
      "Self-awareness gap means the leader may not see the impact",
      "Relationships are becoming transactional or avoidant",
    ],
    developmentFocus:
      "Prioritize self-awareness and emotional regulation. Seek direct feedback from trusted peers. Invest in repairing the most important relationships. Consider a structured 360-degree feedback process.",
    scoreRange: [35, 64],
    triggerDimensions: [
      "self_awareness",
      "emotional_regulation",
      "humility_vs_defensiveness",
      "trust_relationship_building",
    ],
  },
  {
    id: "at_risk_senior_leader",
    name: "The At-Risk Senior Leader",
    tagline: "Multiple derailment patterns active — structured intervention needed.",
    description:
      "Multiple derailment patterns are active across self-management, trust, influence, and scale. The cumulative effect of these patterns is likely already visible in your leadership reputation, team climate, and stakeholder confidence. Without structured intervention, the risk of significant leadership setback is real.",
    strengths: [
      "Likely has a strong track record in earlier roles",
      "May still have pockets of strong performance",
      "Often has genuine commitment to improvement when confronted with evidence",
    ],
    risks: [
      "Trust and credibility may already be damaged in key relationships",
      "Multiple dimensions are constraining effectiveness simultaneously",
      "Without intervention, patterns will intensify under greater scope or pressure",
    ],
    developmentFocus:
      "Engage a structured executive coaching program. Prioritize the top 3 derailment dimensions. Involve a sponsor or manager in the development plan. Consider a 360-degree feedback process to surface blind spots.",
    scoreRange: [0, 54],
    triggerDimensions: [],
  },
];

// ─── Scoring Engine ───────────────────────────────────────────────────────────

/**
 * Apply reverse scoring: 1→5, 2→4, 3→3, 4→2, 5→1
 */
function reverseScore(raw: number): number {
  return 6 - raw;
}

/**
 * Compute a single dimension score (0–100) from 3 question responses.
 * Applies reverse scoring where flagged.
 */
function computeLdiDimensionScore(
  dimensionId: string,
  responses: Record<string, number>
): number {
  const questions = LDI_QUESTIONS.filter((q) => q.dimensionId === dimensionId);
  let rawSum = 0;
  for (const q of questions) {
    const raw = responses[String(q.id)] ?? 3;
    rawSum += q.reverseScored ? reverseScore(raw) : raw;
  }
  // Normalise: min=3, max=15 → 0–100
  return Math.round(((rawSum - 3) / 12) * 100);
}

/**
 * Compute all 10 dimension scores.
 */
function computeAllLdiDimensionScores(
  responses: Record<string, number>
): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const dim of LDI_DIMENSIONS) {
    scores[dim.id] = computeLdiDimensionScore(dim.id, responses);
  }
  return scores;
}

/**
 * Map a score (0–100) to a risk band label.
 */
export function getLdiRiskBand(score: number): string {
  if (score >= 85) return "Low Derailment Risk";
  if (score >= 70) return "Moderate-Low Risk";
  if (score >= 55) return "Moderate Risk";
  if (score >= 40) return "High Risk";
  return "Critical Derailment Risk";
}

/**
 * Map a score to a risk band id.
 */
export function getLdiRiskBandId(score: number): string {
  if (score >= 85) return "low";
  if (score >= 70) return "moderate_low";
  if (score >= 55) return "moderate";
  if (score >= 40) return "high";
  return "critical";
}

/**
 * Assign the best-fit archetype based on overall score and dimension pattern.
 */
function assignLdiArchetype(
  overallScore: number,
  dimensionScores: Record<string, number>
): LdiArchetype {
  // Sort dimensions by score ascending (lowest first = highest risk)
  const sorted = Object.entries(dimensionScores).sort(([, a], [, b]) => a - b);
  const lowestDims = sorted.slice(0, 3).map(([id]) => id);

  // Critical / high risk → At-Risk Senior Leader
  if (overallScore < 40) return LDI_ARCHETYPES.find((a) => a.id === "at_risk_senior_leader")!;

  // High risk with trust/self-awareness/emotional issues → Friction Creator
  if (
    overallScore < 60 &&
    lowestDims.some((d) =>
      ["self_awareness", "emotional_regulation", "humility_vs_defensiveness", "trust_relationship_building"].includes(d)
    )
  ) {
    return LDI_ARCHETYPES.find((a) => a.id === "friction_creator")!;
  }

  // High risk with delegation/strategic issues → Overloaded Expert
  if (
    overallScore < 65 &&
    lowestDims.some((d) => ["delegation_team_development", "strategic_thinking"].includes(d))
  ) {
    return LDI_ARCHETYPES.find((a) => a.id === "overloaded_expert")!;
  }

  // Moderate risk with stakeholder/communication issues → Politically Underpowered
  if (
    overallScore < 70 &&
    lowestDims.some((d) => ["stakeholder_management", "executive_communication"].includes(d))
  ) {
    return LDI_ARCHETYPES.find((a) => a.id === "politically_underpowered")!;
  }

  // Moderate risk with emotional/defensive issues → Reactive High-Achiever
  if (
    overallScore < 70 &&
    lowestDims.some((d) =>
      ["emotional_regulation", "humility_vs_defensiveness", "self_awareness"].includes(d)
    )
  ) {
    return LDI_ARCHETYPES.find((a) => a.id === "reactive_high_achiever")!;
  }

  // Moderate-low with communication/strategic visibility issues → Invisible Successor
  if (
    overallScore < 78 &&
    lowestDims.some((d) =>
      ["executive_communication", "strategic_thinking", "stakeholder_management"].includes(d)
    )
  ) {
    return LDI_ARCHETYPES.find((a) => a.id === "invisible_successor")!;
  }

  // Moderate-low with execution/delegation issues → Strong Performer at Risk
  if (overallScore < 82) {
    return LDI_ARCHETYPES.find((a) => a.id === "strong_performer_at_risk")!;
  }

  // High overall → Trusted Scaler
  return LDI_ARCHETYPES.find((a) => a.id === "trusted_scaler")!;
}

/**
 * Main scoring function — takes raw responses (keyed by question id string)
 * and returns the full LdiScoreResult.
 */
export function scoreLdi(responses: Record<string, number>): LdiScoreResult {
  const dimensionScores = computeAllLdiDimensionScores(responses);

  // Overall score = average of 10 dimension scores (equal weighting)
  const overallScore = Math.round(
    Object.values(dimensionScores).reduce((sum, s) => sum + s, 0) / LDI_DIMENSIONS.length
  );

  const riskBand = getLdiRiskBand(overallScore);
  const riskBandObj = LDI_RISK_BANDS.find((b) => b.label === riskBand) ?? LDI_RISK_BANDS[2];

  const archetype = assignLdiArchetype(overallScore, dimensionScores);

  // Dimension risk bands
  const dimensionRiskBands: Record<string, string> = {};
  for (const [id, score] of Object.entries(dimensionScores)) {
    dimensionRiskBands[id] = getLdiRiskBand(score);
  }

  // Sort dimensions for derived outputs
  const sortedByScore = LDI_DIMENSIONS.map((d) => ({
    dimensionId: d.id,
    dimensionName: d.shortName,
    score: dimensionScores[d.id],
    riskBand: dimensionRiskBands[d.id],
  })).sort((a, b) => a.score - b.score);

  const topDerailmentRisks = sortedByScore.slice(0, 3);
  const topStabilizers = sortedByScore.slice(-3).reverse();

  const weakestDimension =
    LDI_DIMENSIONS.find((d) => d.id === sortedByScore[0].dimensionId)?.name ?? "";
  const strongestDimension =
    LDI_DIMENSIONS.find((d) => d.id === sortedByScore[sortedByScore.length - 1].dimensionId)?.name ?? "";

  return {
    overallScore,
    riskBand,
    riskBandDescription: riskBandObj.description,
    archetypeId: archetype.id,
    archetypeLabel: archetype.name,
    archetypeTagline: archetype.tagline,
    archetypeStrengths: archetype.strengths,
    archetypeRisks: archetype.risks,
    archetypeDevelopmentFocus: archetype.developmentFocus,
    dimensionScores,
    dimensionRiskBands,
    topDerailmentRisks,
    topStabilizers,
    edgeScore: overallScore,
    zoneLabel: riskBand,
    zoneDescription: riskBandObj.description,
    strongestDimension,
    weakestDimension,
  };
}
