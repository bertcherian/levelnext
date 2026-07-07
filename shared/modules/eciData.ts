// ─── Executive Communication Intelligence — Shared Data & Scoring Engine ──────

export type EciPillar = {
  id: string;
  label: string;
  description: string;
  color: string;
  dimensions: EciDimension[];
};

export type EciDimension = {
  id: string;
  pillarId: string;
  label: string;
  description: string;
  weight: number; // relative weight within pillar
};

export type EciQuestion = {
  id: string;
  dimensionId: string;
  pillarId: string;
  text: string;
  reverseScored?: boolean;
};

export type EciZone = {
  id: string;
  label: string;
  range: [number, number];
  color: string;
  description: string;
  implication: string;
};

export type EciArchetype = {
  id: string;
  label: string;
  description: string;
  strengths: string[];
  risks: string[];
  icon: string;
};

// ─── 5 Pillars with 10 Dimensions (2 per pillar) ─────────────────────────────

export const ECI_PILLARS: EciPillar[] = [
  {
    id: "strategic_communication",
    label: "Strategic Communication",
    description: "The ability to communicate with clarity, brevity, and strategic intent — translating complex ideas into executive-level insight.",
    color: "#D4AF37",
    dimensions: [
      {
        id: "strategic_clarity",
        pillarId: "strategic_communication",
        label: "Strategic Clarity & Brevity",
        description: "Ability to distil complex thinking into clear, concise, high-impact messages",
        weight: 0.5,
      },
      {
        id: "executive_framing",
        pillarId: "strategic_communication",
        label: "Executive Framing & Prioritisation",
        description: "Ability to frame recommendations strategically and communicate what matters most",
        weight: 0.5,
      },
    ],
  },
  {
    id: "executive_presence",
    label: "Executive Presence",
    description: "The gravitas, composure, and authority that senior leaders project in high-stakes communication environments.",
    color: "#3B82F6",
    dimensions: [
      {
        id: "gravitas_composure",
        pillarId: "executive_presence",
        label: "Gravitas & Composure",
        description: "Projecting calm authority and confidence under pressure in senior forums",
        weight: 0.5,
      },
      {
        id: "confidence_authority",
        pillarId: "executive_presence",
        label: "Confidence & Authority",
        description: "Commanding presence in boardrooms, leadership meetings, and global calls",
        weight: 0.5,
      },
    ],
  },
  {
    id: "influence_stakeholder",
    label: "Influence & Stakeholder Alignment",
    description: "The capacity to persuade, align, and navigate complex stakeholder ecosystems without relying on positional authority.",
    color: "#22C55E",
    dimensions: [
      {
        id: "stakeholder_influence",
        pillarId: "influence_stakeholder",
        label: "Stakeholder Influence & Persuasion",
        description: "Ability to influence laterally, manage resistance, and build cross-functional alignment",
        weight: 0.5,
      },
      {
        id: "political_intelligence",
        pillarId: "influence_stakeholder",
        label: "Political Intelligence & Navigation",
        description: "Reading organisational dynamics, managing competing agendas, and navigating matrix complexity",
        weight: 0.5,
      },
    ],
  },
  {
    id: "narrative_visibility",
    label: "Executive Narrative & Visibility",
    description: "The ability to create compelling narratives, build executive brand, and maintain strategic visibility in leadership ecosystems.",
    color: "#F59E0B",
    dimensions: [
      {
        id: "storytelling_vision",
        pillarId: "narrative_visibility",
        label: "Storytelling & Vision Communication",
        description: "Crafting compelling narratives that inspire, align, and drive strategic action",
        weight: 0.5,
      },
      {
        id: "executive_visibility",
        pillarId: "narrative_visibility",
        label: "Executive Visibility & Thought Leadership",
        description: "Building strategic presence in leadership forums, HQ interactions, and industry conversations",
        weight: 0.5,
      },
    ],
  },
  {
    id: "conversational_leadership",
    label: "Conversational Leadership",
    description: "The mastery of high-stakes conversations — creating accountability, coaching, aligning, and building trust through dialogue.",
    color: "#A855F7",
    dimensions: [
      {
        id: "accountability_conversations",
        pillarId: "conversational_leadership",
        label: "Accountability & Delegation Conversations",
        description: "Creating clear commitments, managing accountability, and delegating with precision",
        weight: 0.5,
      },
      {
        id: "trust_alignment",
        pillarId: "conversational_leadership",
        label: "Trust Creation & Alignment Conversations",
        description: "Building trust through listening, coaching, and resolving tension in leadership dialogue",
        weight: 0.5,
      },
    ],
  },
];

// ─── 60+ GCC-Specific Scenario-Based Questions ───────────────────────────────

export const ECI_QUESTIONS: EciQuestion[] = [
  // PILLAR 1: Strategic Communication
  {
    id: "sc_01",
    dimensionId: "strategic_clarity",
    pillarId: "strategic_communication",
    text: "When presenting to a senior leader, I can distil a complex initiative into a concise brief without losing critical context.",
  },
  {
    id: "sc_02",
    dimensionId: "strategic_clarity",
    pillarId: "strategic_communication",
    text: "When asked for a project update, I communicate impact and risk — not just activity and effort.",
  },
  {
    id: "sc_05",
    dimensionId: "strategic_clarity",
    pillarId: "strategic_communication",
    text: "I find myself over-explaining technical details when communicating with senior business stakeholders.",
    reverseScored: true,
  },
  {
    id: "ef_01",
    dimensionId: "executive_framing",
    pillarId: "strategic_communication",
    text: "When I raise a problem with leadership, I always come with a recommended course of action, not just the issue.",
  },
  {
    id: "ef_03",
    dimensionId: "executive_framing",
    pillarId: "strategic_communication",
    text: "I can reframe a local execution challenge as a strategic risk that senior leadership should care about.",
  },
  {
    id: "ef_05",
    dimensionId: "executive_framing",
    pillarId: "strategic_communication",
    text: "I struggle to decide what to leave out when communicating with senior leaders — I tend to include too much.",
    reverseScored: true,
  },

  // PILLAR 2: Executive Presence
  {
    id: "gc_01",
    dimensionId: "gravitas_composure",
    pillarId: "executive_presence",
    text: "When challenged or questioned by a senior leader, I respond with calm confidence rather than becoming defensive.",
  },
  {
    id: "gc_02",
    dimensionId: "gravitas_composure",
    pillarId: "executive_presence",
    text: "In high-pressure situations — escalations, leadership reviews — my communication remains measured and authoritative.",
  },
  {
    id: "gc_05",
    dimensionId: "gravitas_composure",
    pillarId: "executive_presence",
    text: "I tend to hedge my statements or add unnecessary qualifiers when speaking to very senior leaders.",
    reverseScored: true,
  },
  {
    id: "ca_01",
    dimensionId: "confidence_authority",
    pillarId: "executive_presence",
    text: "I speak up proactively in leadership forums, even when I am the most junior person in the room.",
  },
  {
    id: "ca_02",
    dimensionId: "confidence_authority",
    pillarId: "executive_presence",
    text: "When I disagree with a senior stakeholder's position, I can articulate my perspective clearly without being aggressive or passive.",
  },
  {
    id: "ca_05",
    dimensionId: "confidence_authority",
    pillarId: "executive_presence",
    text: "I often wait for others to speak first in senior meetings before sharing my own perspective.",
    reverseScored: true,
  },

  // PILLAR 3: Influence & Stakeholder Alignment
  {
    id: "si_01",
    dimensionId: "stakeholder_influence",
    pillarId: "influence_stakeholder",
    text: "I can get a cross-functional initiative approved and resourced without relying on my manager to escalate on my behalf.",
  },
  {
    id: "si_02",
    dimensionId: "stakeholder_influence",
    pillarId: "influence_stakeholder",
    text: "When a peer or lateral stakeholder resists my proposal, I can shift their position through dialogue — not escalation.",
  },
  {
    id: "si_05",
    dimensionId: "stakeholder_influence",
    pillarId: "influence_stakeholder",
    text: "I find it difficult to influence people who do not report to me, especially in a matrix organisation.",
    reverseScored: true,
  },
  {
    id: "pi_01",
    dimensionId: "political_intelligence",
    pillarId: "influence_stakeholder",
    text: "I can read the unspoken dynamics in a leadership meeting and adjust my communication strategy in real time.",
  },
  {
    id: "pi_02",
    dimensionId: "political_intelligence",
    pillarId: "influence_stakeholder",
    text: "I understand which stakeholders need to be consulted, informed, or influenced before a major decision is made.",
  },
  {
    id: "pi_05",
    dimensionId: "political_intelligence",
    pillarId: "influence_stakeholder",
    text: "I am often surprised by political dynamics that others seem to have anticipated.",
    reverseScored: true,
  },

  // PILLAR 4: Executive Narrative & Visibility
  {
    id: "sv_01",
    dimensionId: "storytelling_vision",
    pillarId: "narrative_visibility",
    text: "When communicating a change initiative, I can craft a narrative that creates emotional buy-in — not just logical understanding.",
  },
  {
    id: "sv_04",
    dimensionId: "storytelling_vision",
    pillarId: "narrative_visibility",
    text: "I use data and stories together — the data proves the point, the story makes it stick.",
  },
  {
    id: "sv_05",
    dimensionId: "storytelling_vision",
    pillarId: "narrative_visibility",
    text: "I rely primarily on data and facts in my presentations — I rarely use narrative or storytelling techniques.",
    reverseScored: true,
  },
  {
    id: "ev_01",
    dimensionId: "executive_visibility",
    pillarId: "narrative_visibility",
    text: "Senior leaders know my name and associate me with specific strategic contributions — not just my role title.",
  },
  {
    id: "ev_02",
    dimensionId: "executive_visibility",
    pillarId: "narrative_visibility",
    text: "I proactively create opportunities to share insights and perspectives with global leadership beyond my immediate responsibilities.",
  },
  {
    id: "ev_05",
    dimensionId: "executive_visibility",
    pillarId: "narrative_visibility",
    text: "I feel that my contributions are often invisible to global leadership because I focus on execution rather than visibility.",
    reverseScored: true,
  },

  // PILLAR 5: Conversational Leadership
  {
    id: "ac_02",
    dimensionId: "accountability_conversations",
    pillarId: "conversational_leadership",
    text: "I can have a direct performance conversation with a team member without damaging the relationship.",
  },
  {
    id: "ac_03",
    dimensionId: "accountability_conversations",
    pillarId: "conversational_leadership",
    text: "When a commitment is broken, I address it immediately and specifically — not in a general or passive way.",
  },
  {
    id: "ac_05",
    dimensionId: "accountability_conversations",
    pillarId: "conversational_leadership",
    text: "I tend to avoid difficult accountability conversations because I worry about damaging team morale.",
    reverseScored: true,
  },
  {
    id: "ta_01",
    dimensionId: "trust_alignment",
    pillarId: "conversational_leadership",
    text: "People on my team feel psychologically safe to raise concerns, share bad news, and challenge my thinking.",
  },
  {
    id: "ta_02",
    dimensionId: "trust_alignment",
    pillarId: "conversational_leadership",
    text: "I listen to understand — not to respond. I regularly reflect back what I have heard before offering my perspective.",
  },
  {
    id: "ta_05",
    dimensionId: "trust_alignment",
    pillarId: "conversational_leadership",
    text: "I find it difficult to slow down enough to have deep, exploratory conversations — I tend to jump to solutions quickly.",
    reverseScored: true,
  },
];

// ─── 5 Communication Zones ────────────────────────────────────────────────────

export const ECI_ZONES: EciZone[] = [
  {
    id: "emerging_voice",
    label: "Emerging Voice",
    range: [0, 39],
    color: "#EF4444",
    description: "Communication patterns are limiting leadership effectiveness and career progression.",
    implication: "Significant communication gaps are creating invisible barriers to influence, visibility, and executive trust. Immediate focused intervention is recommended.",
  },
  {
    id: "developing_communicator",
    label: "Developing Communicator",
    range: [40, 54],
    color: "#F97316",
    description: "Foundational communication capability exists but strategic dimensions require deliberate development.",
    implication: "Core communication skills are functional but executive-level influence, presence, and narrative capability need structured development to unlock the next leadership level.",
  },
  {
    id: "capable_executive",
    label: "Capable Executive",
    range: [55, 64],
    color: "#F59E0B",
    description: "Solid executive communication across most dimensions with identifiable growth opportunities.",
    implication: "Competent executive communicator with clear leverage points for advancement. Targeted development in 2–3 dimensions will accelerate leadership impact significantly.",
  },
  {
    id: "strong_influencer",
    label: "Strong Influencer",
    range: [65, 79],
    color: "#3B82F6",
    description: "High-performing executive communicator with strong influence and stakeholder management capability.",
    implication: "Demonstrating executive communication maturity. Focus on mastering the remaining dimensions to achieve strategic communicator status and maximum leadership leverage.",
  },
  {
    id: "strategic_communicator",
    label: "Strategic Communicator",
    range: [80, 100],
    color: "#22C55E",
    description: "Elite executive communication intelligence — a strategic asset for organisational leadership.",
    implication: "Operating at the highest level of executive communication. Communication is a genuine competitive advantage. Focus on sustaining this edge and developing others.",
  },
];

// ─── 8 Communication Archetypes ───────────────────────────────────────────────

export const ECI_ARCHETYPES: EciArchetype[] = [
  {
    id: "strategic_influencer",
    label: "Strategic Influencer",
    description: "A rare executive communicator who combines strategic clarity, stakeholder mastery, and compelling narrative to drive decisions and shape organisational direction.",
    strengths: ["Creates alignment across complex stakeholder ecosystems", "Communicates with authority and strategic intent", "Builds executive trust rapidly"],
    risks: ["May move too fast for consensus-driven cultures", "Can be perceived as politically savvy rather than authentic"],
    icon: "⚡",
  },
  {
    id: "invisible_expert",
    label: "Invisible Expert",
    description: "Deep technical and functional expertise that is not translating into executive visibility or strategic influence. The organisation underestimates this leader's true value.",
    strengths: ["Deep domain credibility", "Trusted for technical accuracy", "Reliable execution"],
    risks: ["Invisible to global leadership", "Promotions stall despite strong performance", "Influence limited to immediate team"],
    icon: "🔍",
  },
  {
    id: "executive_diplomat",
    label: "Executive Diplomat",
    description: "A skilled navigator of complex stakeholder ecosystems with strong political intelligence and relationship capital. Builds trust through careful, measured communication.",
    strengths: ["Exceptional stakeholder management", "Navigates organisational complexity with ease", "Builds durable relationships"],
    risks: ["May avoid necessary directness", "Can be perceived as consensus-dependent", "Slow to take bold positions"],
    icon: "🤝",
  },
  {
    id: "technical_operator",
    label: "Technical Operator",
    description: "A highly capable executor who communicates primarily in technical and operational language. Strategic communication and executive presence are underdeveloped.",
    strengths: ["Precise, accurate communication", "Strong credibility with technical peers", "Reliable delivery"],
    risks: ["Limited executive visibility", "Struggles to influence business stakeholders", "Career ceiling approaching"],
    icon: "⚙️",
  },
  {
    id: "trusted_integrator",
    label: "Trusted Integrator",
    description: "A connector who builds trust across functions and geographies through consistent, reliable, and empathetic communication. Strong in conversational leadership.",
    strengths: ["Exceptional trust-building", "Creates psychological safety", "Strong accountability conversations"],
    risks: ["May lack strategic sharpness", "Executive presence needs strengthening", "Visibility in senior forums limited"],
    icon: "🔗",
  },
  {
    id: "defensive_specialist",
    label: "Defensive Specialist",
    description: "A technically strong leader whose communication becomes guarded or reactive under pressure, limiting influence and creating stakeholder friction.",
    strengths: ["Strong subject matter expertise", "Detailed and accurate in communication", "Committed to quality"],
    risks: ["Defensive communication under challenge", "Stakeholder friction in high-pressure situations", "Low executive trust signals"],
    icon: "🛡️",
  },
  {
    id: "emerging_executive_voice",
    label: "Emerging Executive Voice",
    description: "A high-potential leader developing executive communication capability. Strong in some dimensions with clear, identifiable growth edges that coaching can accelerate.",
    strengths: ["Strong growth trajectory", "Self-aware about communication gaps", "Coachable and development-oriented"],
    risks: ["Inconsistent executive presence", "Influence capability still developing", "Visibility in global forums limited"],
    icon: "🌱",
  },
  {
    id: "narrative_leader",
    label: "Narrative Leader",
    description: "A compelling storyteller and vision communicator who creates emotional resonance and strategic alignment through powerful narrative. Strong executive brand.",
    strengths: ["Exceptional storytelling and vision communication", "Strong executive brand and visibility", "Creates inspiration and alignment"],
    risks: ["May over-rely on narrative at the expense of precision", "Accountability conversations may be softer than needed", "Execution follow-through communication can be inconsistent"],
    icon: "📖",
  },
];

// ─── Pillar Weights ───────────────────────────────────────────────────────────

export const PILLAR_WEIGHTS: Record<string, number> = {
  strategic_communication: 0.22,
  executive_presence: 0.20,
  influence_stakeholder: 0.22,
  narrative_visibility: 0.18,
  conversational_leadership: 0.18,
};

// ─── Scoring Engine ───────────────────────────────────────────────────────────

/**
 * Compute a dimension score (0–100) from raw Likert responses (1–5)
 */
export function computeDimensionScore(
  responses: Record<string, number>,
  dimensionId: string
): number {
  const questions = ECI_QUESTIONS.filter((q) => q.dimensionId === dimensionId);
  if (questions.length === 0) return 0;

  let total = 0;
  let count = 0;

  for (const q of questions) {
    const raw = responses[q.id];
    if (raw === undefined || raw === null) continue;
    const score = q.reverseScored ? 6 - raw : raw;
    total += score;
    count++;
  }

  if (count === 0) return 0;
  const avg = total / count; // 1–5
  return Math.round(((avg - 1) / 4) * 100);
}

/**
 * Compute a pillar score (0–100) as weighted average of its dimension scores
 */
export function computePillarScore(
  responses: Record<string, number>,
  pillarId: string
): number {
  const pillar = ECI_PILLARS.find((p) => p.id === pillarId);
  if (!pillar) return 0;

  let weightedSum = 0;
  let totalWeight = 0;

  for (const dim of pillar.dimensions) {
    const score = computeDimensionScore(responses, dim.id);
    weightedSum += score * dim.weight;
    totalWeight += dim.weight;
  }

  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
}

/**
 * Compute the overall ECI Score (0–100) as weighted average of pillar scores
 */
export function computeEciScore(pillarScores: Record<string, number>): number {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const [pillarId, weight] of Object.entries(PILLAR_WEIGHTS)) {
    const score = pillarScores[pillarId] ?? 0;
    weightedSum += score * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
}

/**
 * Compute all pillar scores from raw responses
 */
export function computeAllPillarScores(
  responses: Record<string, number>
): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const pillar of ECI_PILLARS) {
    scores[pillar.id] = computePillarScore(responses, pillar.id);
  }
  return scores;
}

/**
 * Compute all dimension scores from raw responses
 */
export function computeAllDimensionScores(
  responses: Record<string, number>
): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const pillar of ECI_PILLARS) {
    for (const dim of pillar.dimensions) {
      scores[dim.id] = computeDimensionScore(responses, dim.id);
    }
  }
  return scores;
}

/**
 * Get the Communication Zone for a given ECI score
 */
export function getEciZone(score: number): EciZone {
  for (const zone of ECI_ZONES) {
    if (score >= zone.range[0] && score <= zone.range[1]) return zone;
  }
  return ECI_ZONES[ECI_ZONES.length - 1];
}

/**
 * Assign an archetype based on pillar scores and overall score
 */
export function assignEciArchetype(
  pillarScores: Record<string, number>,
  overallScore: number
): EciArchetype {
  const sc = pillarScores["strategic_communication"] ?? 0;
  const ep = pillarScores["executive_presence"] ?? 0;
  const is = pillarScores["influence_stakeholder"] ?? 0;
  const nv = pillarScores["narrative_visibility"] ?? 0;
  const cl = pillarScores["conversational_leadership"] ?? 0;

  // Strategic Influencer: high across all, especially influence + strategic
  if (overallScore >= 78 && sc >= 75 && is >= 75) {
    return ECI_ARCHETYPES.find((a) => a.id === "strategic_influencer")!;
  }

  // Narrative Leader: high narrative + presence, moderate others
  if (nv >= 78 && ep >= 65) {
    return ECI_ARCHETYPES.find((a) => a.id === "narrative_leader")!;
  }

  // Executive Diplomat: high influence + political, moderate presence
  if (is >= 75 && ep >= 60 && sc < 70) {
    return ECI_ARCHETYPES.find((a) => a.id === "executive_diplomat")!;
  }

  // Trusted Integrator: high conversational + influence, lower presence/narrative
  if (cl >= 72 && is >= 65 && nv < 65) {
    return ECI_ARCHETYPES.find((a) => a.id === "trusted_integrator")!;
  }

  // Invisible Expert: high strategic but low visibility + influence
  if (sc >= 68 && nv < 55 && is < 58) {
    return ECI_ARCHETYPES.find((a) => a.id === "invisible_expert")!;
  }

  // Technical Operator: low presence + narrative + influence, higher strategic
  if (sc >= 55 && ep < 55 && nv < 50 && is < 55) {
    return ECI_ARCHETYPES.find((a) => a.id === "technical_operator")!;
  }

  // Defensive Specialist: low presence under pressure indicator
  if (ep < 52 && is < 55 && overallScore < 60) {
    return ECI_ARCHETYPES.find((a) => a.id === "defensive_specialist")!;
  }

  // Emerging Executive Voice: default for developing scores
  return ECI_ARCHETYPES.find((a) => a.id === "emerging_executive_voice")!;
}

// ─── Helper: Get all dimensions flat ─────────────────────────────────────────
export function getAllDimensions(): EciDimension[] {
  return ECI_PILLARS.flatMap((p) => p.dimensions);
}

// ─── Helper: Get questions by pillar ─────────────────────────────────────────
export function getQuestionsByPillar(pillarId: string): EciQuestion[] {
  return ECI_QUESTIONS.filter((q) => q.pillarId === pillarId);
}

// ─── Helper: Get questions by dimension ──────────────────────────────────────
export function getQuestionsByDimension(dimensionId: string): EciQuestion[] {
  return ECI_QUESTIONS.filter((q) => q.dimensionId === dimensionId);
}
