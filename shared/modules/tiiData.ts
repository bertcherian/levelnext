/**
 * Leadership Time Intelligence (TII) Diagnostic
 * "Your calendar reveals your leadership system."
 *
 * 5 dimensions × 6 questions = 30 questions
 * 5-point Likert: 1 = Rarely true of me → 5 = Consistently true of me
 * Dimension score: sum of 6 questions (6–30) → converted to percentage (0–100)
 * Overall score: average of 5 dimension percentages (0–100)
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TiiDimension {
  id: string;
  name: string;
  shortName: string;
  definition: string;
  whyItMatters: string;
  strongPerformance: string;
  weakPerformance: string;
  leadershipRisk: string;
}

export interface TiiQuestion {
  id: number;
  dimensionId: string;
  text: string;
}

export interface TiiZone {
  id: string;
  label: string;
  range: [number, number]; // percentage range
  description: string;
  implication: string;
}

export interface TiiArchetype {
  id: string;
  name: string;
  tagline: string;
  description: string;
  strengths: string[];
  risks: string[];
  developmentFocus: string;
  triggerDimensions: string[]; // low-scoring dimensions that trigger this archetype
}

// ─── Dimensions ───────────────────────────────────────────────────────────────

export const TII_DIMENSIONS: TiiDimension[] = [
  {
    id: "priority_clarity",
    name: "Priority Clarity",
    shortName: "Priority Clarity",
    definition:
      "The leader's ability to identify, protect, and act on the highest-value priorities instead of being driven by urgency, noise, or other people's agendas.",
    whyItMatters:
      "Without priority clarity, a leader's time becomes a shared resource claimed by whoever asks loudest. Strategic intent never converts to focused execution.",
    strongPerformance:
      "Knows the three things that matter most this quarter. Trades off low-value work deliberately. Calendar reflects business priorities, not inbox pressure.",
    weakPerformance:
      "Treats everything as urgent. Struggles to say 'this matters most.' Spreads attention across too many initiatives and delivers on none fully.",
    leadershipRisk:
      "Strategic drift, missed commitments, and a reputation for being busy but not impactful.",
  },
  {
    id: "focus_deep_work",
    name: "Focus & Deep Work",
    shortName: "Focus & Deep Work",
    definition:
      "The leader's ability to protect uninterrupted thinking time for complex work, strategic reflection, problem-solving, preparation, and high-quality decision-making.",
    whyItMatters:
      "Senior leadership requires sustained cognitive effort. Decisions made in fragmented attention are lower quality. Strategic thinking cannot happen in five-minute windows between meetings.",
    strongPerformance:
      "Blocks deep work time weekly. Prepares before important conversations. Manages digital distractions. Thinks before reacting.",
    weakPerformance:
      "Operates in constant reactive mode. No protected thinking time. Meetings fill every hour. Decisions made on the fly without adequate reflection.",
    leadershipRisk:
      "Poor decision quality, reactive leadership, inability to think strategically, and eventual burnout from cognitive overload.",
  },
  {
    id: "execution_discipline",
    name: "Execution Discipline",
    shortName: "Execution Discipline",
    definition:
      "The leader's ability to convert priorities into committed action, maintain momentum, follow through on decisions, and complete what matters.",
    whyItMatters:
      "Clarity without execution is just intention. Leaders who cannot close loops create confusion, erode trust, and become bottlenecks to their own teams.",
    strongPerformance:
      "Plans weekly. Tracks commitments. Closes open loops. Maintains execution rhythm even under pressure. Reliable on follow-through.",
    weakPerformance:
      "Starts many things, finishes few. Commitments drift. No weekly planning rhythm. Progress reviews are rare or absent.",
    leadershipRisk:
      "Team disengagement, stakeholder frustration, and a reputation for starting strong but not delivering.",
  },
  {
    id: "delegation_letting_go",
    name: "Delegation & Letting Go",
    shortName: "Delegation",
    definition:
      "The leader's ability to create leverage through others by delegating ownership, resisting over-control, and building team capability.",
    whyItMatters:
      "A leader who cannot delegate becomes the ceiling of their team's performance. Leverage — not personal effort — is the primary mechanism of senior leadership impact.",
    strongPerformance:
      "Delegates outcomes, not just tasks. Trusts the team to find their own path. Creates decision rights. Coaches instead of rescuing. Builds capability.",
    weakPerformance:
      "Personally carries too much. Rescues the team too quickly. Struggles to let go of work they used to own. Micromanages under pressure.",
    leadershipRisk:
      "Becoming the bottleneck. Team capability stagnates. Leader burns out carrying what the team should own.",
  },
  {
    id: "boundary_management",
    name: "Boundary Management",
    shortName: "Boundary Management",
    definition:
      "The leader's ability to protect strategic time, renegotiate unreasonable demands, say no respectfully, and prevent constant availability from destroying effectiveness.",
    whyItMatters:
      "Without boundaries, a leader's calendar is controlled by other people's urgencies. Constant availability signals poor prioritisation and invites more interruption.",
    strongPerformance:
      "Says no constructively. Renegotiates deadlines without drama. Manages stakeholder expectations proactively. Protects personal and strategic time.",
    weakPerformance:
      "Cannot say no. Overcommits consistently. Always available. Calendar is controlled by others. Burnout risk is high.",
    leadershipRisk:
      "Burnout, resentment, declining performance quality, and a reputation for being reactive rather than strategic.",
  },
];

// ─── Questions ────────────────────────────────────────────────────────────────

export const TII_QUESTIONS: TiiQuestion[] = [
  // Dimension 1: Priority Clarity (Q1–Q6)
  {
    id: 1,
    dimensionId: "priority_clarity",
    text: "I can clearly name the two or three priorities that will create the most strategic value for my organisation this quarter.",
  },
  {
    id: 2,
    dimensionId: "priority_clarity",
    text: "When I look at my calendar for the past two weeks, it reflects my stated strategic priorities rather than other people's agendas.",
  },
  {
    id: 3,
    dimensionId: "priority_clarity",
    text: "I actively decide what to stop doing or deprioritise when new demands arrive, rather than simply adding them to my list.",
  },
  {
    id: 4,
    dimensionId: "priority_clarity",
    text: "I distinguish between what is genuinely important and what merely feels urgent, and I act accordingly.",
  },
  {
    id: 5,
    dimensionId: "priority_clarity",
    text: "I am comfortable saying 'this matters most right now' and protecting that priority even when stakeholders push for something else.",
  },
  {
    id: 6,
    dimensionId: "priority_clarity",
    text: "I regularly evaluate the opportunity cost of how I spend my time — what I am giving up by saying yes to one thing.",
  },

  // Dimension 2: Focus & Deep Work (Q7–Q12)
  {
    id: 7,
    dimensionId: "focus_deep_work",
    text: "I protect at least two to three hours of uninterrupted thinking time each week for complex work or strategic reflection.",
  },
  {
    id: 8,
    dimensionId: "focus_deep_work",
    text: "I prepare adequately before important conversations, decisions, or presentations rather than going in unprepared.",
  },
  {
    id: 9,
    dimensionId: "focus_deep_work",
    text: "I manage digital distractions — notifications, messages, email — so they do not fragment my attention during focused work.",
  },
  {
    id: 10,
    dimensionId: "focus_deep_work",
    text: "I have periods in my week where I am genuinely not in back-to-back meetings and can think without interruption.",
  },
  {
    id: 11,
    dimensionId: "focus_deep_work",
    text: "When I face a complex problem, I give myself time to think it through rather than reacting immediately.",
  },
  {
    id: 12,
    dimensionId: "focus_deep_work",
    text: "I am able to step away from operational noise long enough to think about the bigger picture and longer-term direction.",
  },

  // Dimension 3: Execution Discipline (Q13–Q18)
  {
    id: 13,
    dimensionId: "execution_discipline",
    text: "I have a consistent weekly planning practice where I translate priorities into specific actions for the week ahead.",
  },
  {
    id: 14,
    dimensionId: "execution_discipline",
    text: "When I make a commitment — to myself or others — I follow through on it reliably.",
  },
  {
    id: 15,
    dimensionId: "execution_discipline",
    text: "I track my open commitments and review them regularly to ensure nothing important falls through the cracks.",
  },
  {
    id: 16,
    dimensionId: "execution_discipline",
    text: "I close loops on decisions and actions rather than leaving them in a state of perpetual 'in progress'.",
  },
  {
    id: 17,
    dimensionId: "execution_discipline",
    text: "I maintain my execution rhythm even during high-pressure periods, rather than abandoning planning when things get busy.",
  },
  {
    id: 18,
    dimensionId: "execution_discipline",
    text: "I review my progress against priorities at least once a week and adjust my approach based on what I observe.",
  },

  // Dimension 4: Delegation & Letting Go (Q19–Q24)
  {
    id: 19,
    dimensionId: "delegation_letting_go",
    text: "I delegate ownership of outcomes, not just tasks — I give people the 'what' and let them determine the 'how'.",
  },
  {
    id: 20,
    dimensionId: "delegation_letting_go",
    text: "I resist the urge to step in and rescue my team when they face difficulty; I coach them through it instead.",
  },
  {
    id: 21,
    dimensionId: "delegation_letting_go",
    text: "I have created clear decision rights so my team can make decisions without needing my approval for everything.",
  },
  {
    id: 22,
    dimensionId: "delegation_letting_go",
    text: "I am comfortable with team members doing things differently from how I would do them, as long as the outcome is achieved.",
  },
  {
    id: 23,
    dimensionId: "delegation_letting_go",
    text: "I actively invest time in building my team's capability so they can take on more, rather than simply doing the work myself.",
  },
  {
    id: 24,
    dimensionId: "delegation_letting_go",
    text: "I have successfully let go of work I used to own personally and transferred genuine ownership to others.",
  },

  // Dimension 5: Boundary Management (Q25–Q30)
  {
    id: 25,
    dimensionId: "boundary_management",
    text: "I can say no to requests — from peers, stakeholders, or my manager — when they conflict with my highest priorities.",
  },
  {
    id: 26,
    dimensionId: "boundary_management",
    text: "I renegotiate deadlines or scope when demands are unreasonable, rather than silently absorbing the overload.",
  },
  {
    id: 27,
    dimensionId: "boundary_management",
    text: "I manage stakeholder expectations proactively — I communicate constraints before they become problems.",
  },
  {
    id: 28,
    dimensionId: "boundary_management",
    text: "I protect time for strategic work and personal recovery — I do not allow my calendar to be entirely consumed by others' requests.",
  },
  {
    id: 29,
    dimensionId: "boundary_management",
    text: "I am not constantly available to everyone at all times — I have established norms about when and how I can be reached.",
  },
  {
    id: 30,
    dimensionId: "boundary_management",
    text: "I avoid overcommitting by being honest about my capacity before agreeing to new responsibilities.",
  },
];

// ─── Score Zones ──────────────────────────────────────────────────────────────

export const TII_ZONES: TiiZone[] = [
  {
    id: "strategic_time_leader",
    label: "Strategic Time Leader",
    range: [85, 100],
    description:
      "You use time as a strategic asset. You are clear on what matters, protect focus, execute reliably, delegate effectively, and manage boundaries with maturity.",
    implication:
      "Your leadership operating system is working. The opportunity now is to help your team develop the same time intelligence — and to push into even more strategic territory.",
  },
  {
    id: "effective_but_stretched",
    label: "Effective but Stretched",
    range: [70, 84],
    description:
      "You are generally effective but may still lose time to reactive demands, overcommitment, inconsistent focus, or insufficient delegation.",
    implication:
      "You have the foundations. The work now is to identify the one or two dimensions that are leaking your leadership energy and address them with targeted discipline.",
  },
  {
    id: "reactive_leader",
    label: "Reactive Leader",
    range: [55, 69],
    description:
      "You are capable but frequently pulled into urgency, interruptions, incomplete execution, and excessive personal involvement.",
    implication:
      "Your time is being consumed rather than invested. A structured reset — starting with priority clarity and calendar design — will create significant leverage quickly.",
  },
  {
    id: "overloaded_operator",
    label: "Overloaded Operator",
    range: [40, 54],
    description:
      "You are busy, stretched, and at risk of becoming the bottleneck. Your calendar is likely controlled by other people's priorities.",
    implication:
      "This is a critical inflection point. Without deliberate change, the pattern will intensify. The 30-day plan in this report is designed to help you reclaim control.",
  },
  {
    id: "time_system_breakdown",
    label: "Time System Breakdown",
    range: [0, 39],
    description:
      "Your current operating system is unsustainable. There is a high risk of burnout, missed priorities, stakeholder frustration, and poor leadership leverage.",
    implication:
      "This report is an urgent signal. The good news: every dimension here is learnable and changeable. The work begins with awareness — which you now have.",
  },
];

// ─── Archetypes ───────────────────────────────────────────────────────────────

export const TII_ARCHETYPES: TiiArchetype[] = [
  {
    id: "strategic_time_leader",
    name: "Strategic Time Leader",
    tagline: "Time as a strategic asset",
    description:
      "You have built a leadership operating system that converts intent into impact. Your calendar reflects your priorities, your team operates with genuine ownership, and you protect the thinking time that strategic leadership demands.",
    strengths: [
      "Clear on highest-value priorities",
      "Protects deep work and reflection time",
      "Delegates outcomes with genuine trust",
      "Manages boundaries with maturity and confidence",
    ],
    risks: [
      "May set standards others struggle to meet",
      "Risk of under-investing in team development if execution is too smooth",
    ],
    developmentFocus:
      "Extend your time intelligence to your team. Coach others to develop the same operating discipline you have built.",
    triggerDimensions: [],
  },
  {
    id: "firefighting_leader",
    name: "The Firefighting Leader",
    tagline: "High effort, low strategic leverage",
    description:
      "You work hard and execute with intensity, but your energy is consumed by urgency rather than directed by priority. You are often the first to respond to a crisis and the last to protect strategic time. Your effort is real — but the return on that effort is lower than it should be.",
    strengths: [
      "High energy and responsiveness",
      "Strong sense of accountability",
      "Team trusts you to show up under pressure",
    ],
    risks: [
      "Strategic priorities are consistently deprioritised",
      "Weak boundaries invite more firefighting",
      "Burnout risk is high",
      "Reputation for busyness rather than strategic impact",
    ],
    developmentFocus:
      "Priority Clarity and Boundary Management. Start by defining the three things that matter most and protecting time for them before the week fills up.",
    triggerDimensions: ["priority_clarity", "boundary_management"],
  },
  {
    id: "bottleneck_leader",
    name: "The Bottleneck Leader",
    tagline: "Strong ownership, weak leverage",
    description:
      "You carry a disproportionate share of the work. You are deeply responsible and highly capable — which is exactly why you struggle to let go. Your team is capable, but they are not being given the ownership they need to grow. You are the ceiling of your team's performance.",
    strengths: [
      "Deep sense of ownership and accountability",
      "High standards and strong execution",
      "Trusted by stakeholders for reliability",
    ],
    risks: [
      "Team capability stagnates",
      "You become the single point of failure",
      "Burnout from carrying what others should own",
      "Team disengagement from lack of autonomy",
    ],
    developmentFocus:
      "Delegation & Letting Go. Begin by identifying three decisions your team can make without you and transferring that ownership explicitly.",
    triggerDimensions: ["delegation_letting_go"],
  },
  {
    id: "scattered_strategist",
    name: "The Scattered Strategist",
    tagline: "Strong ideas, weak execution",
    description:
      "You think strategically and generate strong ideas, but the translation from insight to sustained execution is where things break down. You start many initiatives, but follow-through is inconsistent. Your team respects your vision but is sometimes frustrated by the lack of closure.",
    strengths: [
      "Strategic thinking and big-picture perspective",
      "Generates valuable ideas and direction",
      "Comfortable with ambiguity and complexity",
    ],
    risks: [
      "Commitments drift without a tracking system",
      "Team loses confidence in follow-through",
      "Strategic initiatives stall mid-execution",
      "Reputation for starting strong but not finishing",
    ],
    developmentFocus:
      "Execution Discipline. Build a weekly planning rhythm and a simple commitment-tracking system. The goal is not more effort — it is more closure.",
    triggerDimensions: ["execution_discipline", "focus_deep_work"],
  },
  {
    id: "always_available_leader",
    name: "The Always-Available Leader",
    tagline: "Constant responsiveness, high burnout risk",
    description:
      "You are accessible to everyone at all times. You respond quickly, rarely say no, and absorb demands without renegotiating. This feels like service — but it is actually a pattern that erodes your effectiveness, signals poor prioritisation, and invites more interruption.",
    strengths: [
      "Highly responsive and trusted by the team",
      "Strong relationship capital",
      "Seen as approachable and supportive",
    ],
    risks: [
      "Calendar is controlled by others",
      "No time for strategic thinking or deep work",
      "Burnout from constant availability",
      "Teaches others that your time has no boundaries",
    ],
    developmentFocus:
      "Boundary Management. Start by establishing one non-negotiable protected block per week and communicating it clearly to your team and stakeholders.",
    triggerDimensions: ["boundary_management", "focus_deep_work"],
  },
  {
    id: "productive_operator",
    name: "The Productive Operator",
    tagline: "Strong execution, limited strategic leverage",
    description:
      "You get things done. Your execution is reliable, your follow-through is strong, and your team knows you deliver. But your time is invested primarily in operational execution rather than strategic prioritisation and leadership leverage. You are productive — but not yet operating at the strategic altitude your role requires.",
    strengths: [
      "Reliable execution and strong follow-through",
      "Consistent delivery under pressure",
      "Trusted for getting things done",
    ],
    risks: [
      "Operating below strategic altitude",
      "Insufficient delegation limits team growth",
      "Strategic priorities may be under-served",
      "Risk of being seen as a strong operator but not a strategic leader",
    ],
    developmentFocus:
      "Priority Clarity and Delegation. Shift from doing to directing. Identify what only you can do strategically, and delegate the rest with genuine ownership transfer.",
    triggerDimensions: ["priority_clarity", "delegation_letting_go"],
  },
];

// ─── Scoring Functions ────────────────────────────────────────────────────────

/**
 * Compute a single dimension score as a percentage (0–100)
 * Raw score = sum of 6 questions (range: 6–30)
 * Percentage = (raw - 6) / 24 * 100
 */
export function computeTiiDimensionScore(
  responses: Record<string, number>,
  dimensionId: string
): number {
  const questions = TII_QUESTIONS.filter((q) => q.dimensionId === dimensionId);
  if (questions.length === 0) return 0;
  const raw = questions.reduce(
    (sum, q) => sum + (responses[String(q.id)] ?? 3),
    0
  );
  return Math.round(((raw - questions.length) / (questions.length * 4)) * 100);
}

/**
 * Compute all dimension scores
 */
export function computeAllTiiDimensionScores(
  responses: Record<string, number>
): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const dim of TII_DIMENSIONS) {
    scores[dim.id] = computeTiiDimensionScore(responses, dim.id);
  }
  return scores;
}

/**
 * Compute the overall TII score (0–100) as the average of all dimension scores
 */
export function computeTiiScore(
  dimensionScores: Record<string, number>
): number {
  const values = Object.values(dimensionScores);
  if (values.length === 0) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

/**
 * Get the TII Zone for a given overall score
 */
export function getTiiZone(score: number): TiiZone {
  for (const zone of TII_ZONES) {
    if (score >= zone.range[0] && score <= zone.range[1]) return zone;
  }
  return TII_ZONES[TII_ZONES.length - 1];
}

/**
 * Assign a TII archetype based on dimension scores and overall score
 */
export function assignTiiArchetype(
  dimensionScores: Record<string, number>,
  overallScore: number
): TiiArchetype {
  const pc = dimensionScores["priority_clarity"] ?? 0;
  const fd = dimensionScores["focus_deep_work"] ?? 0;
  const ed = dimensionScores["execution_discipline"] ?? 0;
  const dl = dimensionScores["delegation_letting_go"] ?? 0;
  const bm = dimensionScores["boundary_management"] ?? 0;

  // Strategic Time Leader: strong across all dimensions
  if (overallScore >= 80 && pc >= 75 && dl >= 70 && bm >= 70) {
    return TII_ARCHETYPES.find((a) => a.id === "strategic_time_leader")!;
  }

  // Bottleneck Leader: delegation is the primary weakness
  if (dl < 55 && (pc >= 60 || ed >= 60)) {
    return TII_ARCHETYPES.find((a) => a.id === "bottleneck_leader")!;
  }

  // Firefighting Leader: low priority clarity + low boundaries
  if (pc < 58 && bm < 58) {
    return TII_ARCHETYPES.find((a) => a.id === "firefighting_leader")!;
  }

  // Always-Available Leader: boundary management is the primary weakness
  if (bm < 52 && fd < 58) {
    return TII_ARCHETYPES.find((a) => a.id === "always_available_leader")!;
  }

  // Scattered Strategist: weak execution + weak focus
  if (ed < 58 && fd < 60) {
    return TII_ARCHETYPES.find((a) => a.id === "scattered_strategist")!;
  }

  // Productive Operator: good execution but weak strategic altitude
  if (ed >= 65 && pc < 62 && dl < 62) {
    return TII_ARCHETYPES.find((a) => a.id === "productive_operator")!;
  }

  // Default: firefighting leader for lower overall scores, productive operator for mid-range
  if (overallScore < 55) {
    return TII_ARCHETYPES.find((a) => a.id === "firefighting_leader")!;
  }
  return TII_ARCHETYPES.find((a) => a.id === "productive_operator")!;
}

/**
 * Full scoring function — returns all data needed for the report
 */
export function scoreTii(responses: Record<string, number>) {
  const dimensionScores = computeAllTiiDimensionScores(responses);
  const overallScore = computeTiiScore(dimensionScores);
  const zone = getTiiZone(overallScore);
  const archetype = assignTiiArchetype(dimensionScores, overallScore);

  // Identify strongest and weakest dimensions
  const sorted = Object.entries(dimensionScores).sort(([, a], [, b]) => b - a);
  const strongestDimId = sorted[0]?.[0] ?? "";
  const weakestDimId = sorted[sorted.length - 1]?.[0] ?? "";
  const strongestDim = TII_DIMENSIONS.find((d) => d.id === strongestDimId);
  const weakestDim = TII_DIMENSIONS.find((d) => d.id === weakestDimId);

  return {
    edgeScore: overallScore,
    dimensionScores,
    zone: zone.id,
    zoneLabel: zone.label,
    zoneDescription: zone.description,
    zoneImplication: zone.implication,
    archetype: archetype.id,
    archetypeLabel: archetype.name,
    archetypeTagline: archetype.tagline,
    archetypeDescription: archetype.description,
    archetypeStrengths: archetype.strengths,
    archetypeRisks: archetype.risks,
    archetypeDevelopmentFocus: archetype.developmentFocus,
    strongestDimension: strongestDim?.name ?? "",
    weakestDimension: weakestDim?.name ?? "",
  };
}
