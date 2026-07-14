/**
 * Navigation Intelligence™ (NII) Diagnostic
 * "How you navigate complex organizations."
 *
 * 10 dimensions × 3 questions = 30 questions
 * 5-point Likert: 1 = Strongly Disagree → 5 = Strongly Agree
 * Reverse-scored questions: Q3, Q6, Q9, Q12, Q15, Q18, Q21, Q24, Q27, Q30
 * Dimension score: sum of 3 (after reverse scoring) → range 3–15 → normalised to 0–100
 * Overall NII score: average of 10 dimension scores (equal weighting)
 * Maturity Model: Observer → Connector → Navigator → Strategist → Architect
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NiiDimension {
  id: string;
  name: string;
  shortName: string;
  definition: string;
  whyItMatters: string;
  keyBehaviors: string[];
}

export interface NiiQuestion {
  id: number;
  dimensionId: string;
  text: string;
  reverseScored: boolean;
}

export interface NiiZone {
  id: string;
  label: string;
  range: [number, number];
  description: string;
  implication: string;
  color: string;
}

export interface NiiMaturityLevel {
  id: string;
  level: number;
  name: string;
  tagline: string;
  description: string;
  scoreRange: [number, number];
  developmentFocus: string;
}

export interface NiiArchetype {
  id: string;
  name: string;
  tagline: string;
  description: string;
  strengths: string[];
  risks: string[];
  developmentFocus: string;
  scoreRange: [number, number];
  triggerDimensions: string[];
}

export interface NiiScoreResult {
  overallScore: number;
  zoneId: string;
  zoneLabel: string;
  zoneDescription: string;
  maturityLevelId: string;
  maturityLevelName: string;
  maturityLevelNumber: number;
  maturityTagline: string;
  archetypeId: string;
  archetypeLabel: string;
  archetypeTagline: string;
  archetypeStrengths: string[];
  archetypeRisks: string[];
  archetypeDevelopmentFocus: string;
  dimensionScores: Record<string, number>;
  topStrengths: Array<{ dimensionId: string; dimensionName: string; score: number }>;
  developmentPriorities: Array<{ dimensionId: string; dimensionName: string; score: number }>;
  strongestDimension: string;
  weakestDimension: string;
  edgeScore: number;
}

// ─── Dimensions ───────────────────────────────────────────────────────────────

export const NII_DIMENSIONS: NiiDimension[] = [
  {
    id: "org_awareness",
    name: "Organizational Awareness",
    shortName: "Org Awareness",
    definition: "The ability to accurately read how the organization really works — beyond the org chart.",
    whyItMatters:
      "Leaders who understand formal structures, informal networks, hidden norms, and decision pathways move initiatives forward faster and with less resistance.",
    keyBehaviors: [
      "Maps informal influence networks, not just reporting lines",
      "Understands unwritten rules and cultural norms",
      "Tracks how decisions actually get made vs. how they should be made",
      "Reads organizational history and its effect on current dynamics",
    ],
  },
  {
    id: "stakeholder_nav",
    name: "Stakeholder Navigation",
    shortName: "Stakeholder Nav",
    definition: "The ability to identify, sequence, and effectively engage the full ecosystem of stakeholders needed to advance important work.",
    whyItMatters:
      "Most initiatives fail not because of poor ideas but because the right people were not engaged in the right sequence. Stakeholder navigation is the difference between proposals that die and proposals that get funded.",
    keyBehaviors: [
      "Identifies decision makers, sponsors, influencers, gatekeepers, and hidden blockers",
      "Sequences stakeholder engagement strategically",
      "Converts skeptics into supporters or at least neutralizes opposition",
      "Builds stakeholder maps before launching major initiatives",
    ],
  },
  {
    id: "relationship_capital",
    name: "Relationship Capital",
    shortName: "Rel. Capital",
    definition: "The depth, breadth, and quality of professional relationships built over time — before they are needed.",
    whyItMatters:
      "The strongest leaders build relationships before they need them. Relationship capital is the organizational currency that enables trust, collaboration, and influence across functions and levels.",
    keyBehaviors: [
      "Invests in relationships outside immediate team and function",
      "Builds trust through reliability, integrity, and reciprocity",
      "Maintains a broad network across the organization",
      "Is accessible and responsive to colleagues at all levels",
    ],
  },
  {
    id: "political_nav",
    name: "Political Navigation",
    shortName: "Political Nav",
    definition: "The ability to ethically read and navigate organizational politics — managing competing agendas, understanding power, and working across silos without compromising integrity.",
    whyItMatters:
      "Every organization has politics. Leaders who ignore them get blindsided. Leaders who master ethical political navigation advance important work while strengthening trust and relationships.",
    keyBehaviors: [
      "Reads competing agendas and navigates them without taking sides unnecessarily",
      "Understands power dynamics and works with them ethically",
      "Avoids unnecessary conflict while not avoiding necessary confrontation",
      "Builds alliances across silos and functions",
    ],
  },
  {
    id: "decision_pathway",
    name: "Decision Pathway Intelligence",
    shortName: "Decision Pathways",
    definition: "Understanding how decisions actually get made — including formal approvals, informal sign-offs, sequencing, and the role of executive sponsorship.",
    whyItMatters:
      "Many smart leaders waste months pursuing the wrong decision pathway. Decision Pathway Intelligence ensures proposals reach the right people in the right order at the right moment.",
    keyBehaviors: [
      "Maps the real decision pathway before investing in a proposal",
      "Identifies who has formal authority vs. who has informal veto power",
      "Sequences approvals to build momentum rather than trigger resistance",
      "Secures executive sponsorship before formal submission",
    ],
  },
  {
    id: "enterprise_alignment",
    name: "Enterprise Alignment",
    shortName: "Enterprise Align",
    definition: "The ability to connect work to enterprise priorities, support executive strategy, and think beyond one's own function.",
    whyItMatters:
      "Leaders who frame their work in terms of enterprise value rather than functional interest gain broader support, greater resources, and faster approvals.",
    keyBehaviors: [
      "Frames proposals in terms of enterprise priorities, not functional needs",
      "Actively supports executive strategy even when it creates local friction",
      "Balances functional and enterprise needs without compromising either",
      "Manages upward effectively by understanding executive priorities",
    ],
  },
  {
    id: "coalition_building",
    name: "Coalition Building",
    shortName: "Coalition Bldg",
    definition: "The ability to bring people together, build shared ownership, generate alignment, and create momentum behind important initiatives.",
    whyItMatters:
      "No leader succeeds alone. Coalition building transforms individual effort into collective momentum, converting resistance into support and isolated initiatives into enterprise movements.",
    keyBehaviors: [
      "Builds coalitions before launching major initiatives",
      "Creates shared ownership rather than compliance",
      "Manages resistance by understanding its source and addressing it directly",
      "Develops partnerships across functions and geographies",
    ],
  },
  {
    id: "reputation_credibility",
    name: "Reputation & Credibility",
    shortName: "Reputation",
    definition: "The professional brand, reliability, integrity, and executive confidence that enable a leader to influence through credibility rather than authority.",
    whyItMatters:
      "Credibility is the foundation of organizational influence. Leaders with strong reputations get the benefit of the doubt, attract sponsorship, and move initiatives forward with less friction.",
    keyBehaviors: [
      "Consistently delivers on commitments — large and small",
      "Is known for integrity and transparency across the organization",
      "Maintains visibility at the right levels without self-promotion",
      "Builds executive confidence through reliability and sound judgment",
    ],
  },
  {
    id: "timing_judgment",
    name: "Timing & Strategic Judgment",
    shortName: "Timing & Judgment",
    definition: "Knowing when to act, when to wait, which battles to choose, and how to sequence initiatives for maximum impact.",
    whyItMatters:
      "Timing often determines success more than the quality of the idea itself. Strategic judgment separates leaders who consistently move important work forward from those who are perpetually blocked.",
    keyBehaviors: [
      "Reads organizational readiness before launching major initiatives",
      "Chooses battles strategically — not every hill is worth defending",
      "Sequences initiatives to build momentum rather than create overload",
      "Anticipates resistance and addresses it before it becomes a blocker",
    ],
  },
  {
    id: "ethical_nav",
    name: "Ethical Leadership Navigation",
    shortName: "Ethical Nav",
    definition: "Navigating organizational complexity with integrity, transparency, fairness, and courage — developing others while preserving trust.",
    whyItMatters:
      "This dimension ensures Navigation Intelligence develops ethical leaders rather than political operators. Long-term organizational success requires leaders who navigate with integrity, not manipulation.",
    keyBehaviors: [
      "Navigates organizational dynamics without compromising personal values",
      "Is transparent about motives and methods even when it is uncomfortable",
      "Shows courage in raising difficult issues through appropriate channels",
      "Develops others' navigation capabilities rather than hoarding organizational knowledge",
    ],
  },
];

// ─── Questions ────────────────────────────────────────────────────────────────

export const NII_QUESTIONS: NiiQuestion[] = [
  // 1. Organizational Awareness
  {
    id: 1,
    dimensionId: "org_awareness",
    text: "When I join a new team or initiative, I actively map the informal influence networks — not just the reporting lines — before making major moves.",
    reverseScored: false,
  },
  {
    id: 2,
    dimensionId: "org_awareness",
    text: "I can identify the unwritten rules and cultural norms that shape how decisions are actually made in my organization.",
    reverseScored: false,
  },
  {
    id: 3,
    dimensionId: "org_awareness",
    text: "I often find myself surprised by how decisions get made in my organization — the process rarely matches what I expected.",
    reverseScored: true,
  },

  // 2. Stakeholder Navigation
  {
    id: 4,
    dimensionId: "stakeholder_nav",
    text: "When proposing a major initiative, I identify who needs to be engaged, in what sequence, and why — before the formal process begins.",
    reverseScored: false,
  },
  {
    id: 5,
    dimensionId: "stakeholder_nav",
    text: "I proactively identify hidden blockers and skeptics early, and address their concerns before they become obstacles.",
    reverseScored: false,
  },
  {
    id: 6,
    dimensionId: "stakeholder_nav",
    text: "I tend to focus on the decision makers and overlook the influencers and gatekeepers who shape their thinking.",
    reverseScored: true,
  },

  // 3. Relationship Capital
  {
    id: 7,
    dimensionId: "relationship_capital",
    text: "I invest time in building relationships with colleagues outside my immediate team and function — even when there is no immediate project need.",
    reverseScored: false,
  },
  {
    id: 8,
    dimensionId: "relationship_capital",
    text: "People across the organization trust me to follow through on commitments and handle sensitive information with discretion.",
    reverseScored: false,
  },
  {
    id: 9,
    dimensionId: "relationship_capital",
    text: "I find it difficult to maintain relationships with colleagues outside my immediate work circle due to competing priorities.",
    reverseScored: true,
  },

  // 4. Political Navigation
  {
    id: 10,
    dimensionId: "political_nav",
    text: "I can read competing agendas in my organization and navigate them without unnecessarily taking sides or creating enemies.",
    reverseScored: false,
  },
  {
    id: 11,
    dimensionId: "political_nav",
    text: "I understand where power actually sits in my organization — including informal power — and work with it ethically to advance important work.",
    reverseScored: false,
  },
  {
    id: 12,
    dimensionId: "political_nav",
    text: "I avoid organizational politics entirely — I prefer to let the quality of my work speak for itself.",
    reverseScored: true,
  },

  // 5. Decision Pathway Intelligence
  {
    id: 13,
    dimensionId: "decision_pathway",
    text: "Before investing significant effort in a proposal, I map the actual decision pathway — including informal sign-offs and executive sponsorship requirements.",
    reverseScored: false,
  },
  {
    id: 14,
    dimensionId: "decision_pathway",
    text: "I sequence my approvals strategically to build momentum rather than triggering resistance by going to the wrong person first.",
    reverseScored: false,
  },
  {
    id: 15,
    dimensionId: "decision_pathway",
    text: "I have had important proposals stall or fail because I did not fully understand how decisions were made in my organization.",
    reverseScored: true,
  },

  // 6. Enterprise Alignment
  {
    id: 16,
    dimensionId: "enterprise_alignment",
    text: "I consistently frame my team's work in terms of enterprise priorities and executive strategy — not just functional deliverables.",
    reverseScored: false,
  },
  {
    id: 17,
    dimensionId: "enterprise_alignment",
    text: "I actively support enterprise-wide initiatives even when they create short-term friction or resource pressure for my own function.",
    reverseScored: false,
  },
  {
    id: 18,
    dimensionId: "enterprise_alignment",
    text: "I primarily focus on my own function's goals and leave enterprise strategy to senior leadership.",
    reverseScored: true,
  },

  // 7. Coalition Building
  {
    id: 19,
    dimensionId: "coalition_building",
    text: "Before launching major initiatives, I build a coalition of supporters who have a genuine stake in the outcome — not just formal endorsement.",
    reverseScored: false,
  },
  {
    id: 20,
    dimensionId: "coalition_building",
    text: "I am effective at converting skeptics and resistors into partners by understanding their concerns and finding genuine common ground.",
    reverseScored: false,
  },
  {
    id: 21,
    dimensionId: "coalition_building",
    text: "I find it difficult to build broad support for initiatives — people tend to protect their own priorities rather than align around shared goals.",
    reverseScored: true,
  },

  // 8. Reputation & Credibility
  {
    id: 22,
    dimensionId: "reputation_credibility",
    text: "I am known across the organization for consistently delivering on commitments — even small ones — which means my word carries weight.",
    reverseScored: false,
  },
  {
    id: 23,
    dimensionId: "reputation_credibility",
    text: "Senior leaders in my organization trust my judgment and actively seek my perspective on important decisions.",
    reverseScored: false,
  },
  {
    id: 24,
    dimensionId: "reputation_credibility",
    text: "I am not well known outside my immediate team and function — my visibility in the broader organization is limited.",
    reverseScored: true,
  },

  // 9. Timing & Strategic Judgment
  {
    id: 25,
    dimensionId: "timing_judgment",
    text: "I read organizational readiness before launching major initiatives — I know when the timing is right and when to wait.",
    reverseScored: false,
  },
  {
    id: 26,
    dimensionId: "timing_judgment",
    text: "I choose my battles carefully — I invest my political capital in the initiatives that matter most and let smaller issues go.",
    reverseScored: false,
  },
  {
    id: 27,
    dimensionId: "timing_judgment",
    text: "I have pushed important initiatives forward at the wrong time and faced more resistance than the idea deserved.",
    reverseScored: true,
  },

  // 10. Ethical Leadership Navigation
  {
    id: 28,
    dimensionId: "ethical_nav",
    text: "I navigate organizational complexity without compromising my values — I find ways to advance important work that I would be comfortable defending publicly.",
    reverseScored: false,
  },
  {
    id: 29,
    dimensionId: "ethical_nav",
    text: "I actively develop others' ability to navigate the organization effectively — I share my knowledge of how things work rather than keeping it as a personal advantage.",
    reverseScored: false,
  },
  {
    id: 30,
    dimensionId: "ethical_nav",
    text: "I sometimes use organizational knowledge and relationships in ways that benefit my position more than the broader organization.",
    reverseScored: true,
  },
];

// ─── Score Zones ──────────────────────────────────────────────────────────────

export const NII_ZONES: NiiZone[] = [
  {
    id: "exceptional",
    label: "Exceptional Navigator",
    range: [85, 100],
    description:
      "You operate with exceptional organizational intelligence. You consistently move important work forward while strengthening trust, alignment, and long-term relationships across the enterprise.",
    implication:
      "You are ready for enterprise-wide leadership roles. Your navigation capability is a strategic differentiator. Focus on developing this capability in others.",
    color: "#16a34a",
  },
  {
    id: "strategic",
    label: "Strategic Navigator",
    range: [70, 84],
    description:
      "You navigate complex organizations with skill and intentionality. You understand how the organization works, build strong relationships, and advance important initiatives effectively.",
    implication:
      "You are performing at a high level. Targeted development in your lower dimensions will unlock the next level of organizational impact.",
    color: "#2563eb",
  },
  {
    id: "developing",
    label: "Developing Navigator",
    range: [55, 69],
    description:
      "You have solid navigation instincts and are developing the skills to move important work forward consistently. Some areas of organizational complexity still create friction for you.",
    implication:
      "Focused development in two or three key dimensions will significantly accelerate your organizational effectiveness.",
    color: "#d97706",
  },
  {
    id: "reactive",
    label: "Reactive Navigator",
    range: [40, 54],
    description:
      "You navigate organizational complexity reactively — responding to events rather than shaping them. Important initiatives frequently stall or take longer than they should.",
    implication:
      "Building foundational navigation capabilities — particularly organizational awareness, stakeholder navigation, and relationship capital — will create immediate impact.",
    color: "#ea580c",
  },
  {
    id: "at_risk",
    label: "At Risk",
    range: [0, 39],
    description:
      "Significant gaps in organizational navigation are creating real friction for your leadership effectiveness. Important work is stalling, relationships may be under strain, and your organizational impact is limited.",
    implication:
      "Urgent development focus is needed. Working with an executive coach on navigation fundamentals will create significant career impact.",
    color: "#dc2626",
  },
];

// ─── Maturity Model ───────────────────────────────────────────────────────────

export const NII_MATURITY_LEVELS: NiiMaturityLevel[] = [
  {
    id: "observer",
    level: 1,
    name: "Observer",
    tagline: "Understands parts of the organization but often reacts to events.",
    description:
      "You are developing your organizational awareness and beginning to see how the organization really works. You navigate primarily within your own function and respond to organizational dynamics rather than shaping them.",
    scoreRange: [0, 39],
    developmentFocus:
      "Build foundational organizational awareness. Map informal networks. Invest in relationships outside your immediate team.",
  },
  {
    id: "connector",
    level: 2,
    name: "Connector",
    tagline: "Builds relationships and begins to navigate across functions.",
    description:
      "You are building cross-functional relationships and developing the ability to navigate beyond your immediate function. You are beginning to understand stakeholder dynamics and decision pathways.",
    scoreRange: [40, 54],
    developmentFocus:
      "Deepen stakeholder navigation skills. Build relationship capital proactively. Develop political navigation with integrity.",
  },
  {
    id: "navigator",
    level: 3,
    name: "Navigator",
    tagline: "Consistently aligns stakeholders and advances initiatives effectively.",
    description:
      "You navigate complex organizations with skill and consistency. You understand how decisions get made, build strong coalitions, and advance important work while maintaining trust and integrity.",
    scoreRange: [55, 69],
    developmentFocus:
      "Strengthen enterprise alignment. Develop timing and strategic judgment. Build reputation at senior levels.",
  },
  {
    id: "strategist",
    level: 4,
    name: "Strategist",
    tagline: "Anticipates organizational dynamics and shapes outcomes across the enterprise.",
    description:
      "You operate with strategic organizational intelligence. You anticipate dynamics before they emerge, shape decision pathways, and consistently advance enterprise-level initiatives with broad support.",
    scoreRange: [70, 84],
    developmentFocus:
      "Develop enterprise-wide influence. Build the next generation of navigators. Shape organizational culture and decision ecosystems.",
  },
  {
    id: "architect",
    level: 5,
    name: "Architect",
    tagline: "Influences the organization's direction, culture, and decision ecosystem.",
    description:
      "You operate at the highest level of Navigation Intelligence. You shape how the organization thinks, decides, and moves. You develop other leaders' navigation capabilities and leave the organization stronger than you found it.",
    scoreRange: [85, 100],
    developmentFocus:
      "Lead organizational transformation. Build navigation capability across the leadership pipeline. Influence industry and ecosystem dynamics.",
  },
];

// ─── Archetypes ───────────────────────────────────────────────────────────────

export const NII_ARCHETYPES: NiiArchetype[] = [
  {
    id: "organizational_architect",
    name: "The Organizational Architect",
    tagline: "You shape how the organization works, not just how you work within it.",
    description:
      "You combine exceptional organizational awareness, enterprise alignment, and coalition building to create systemic change. You understand the organization as a living system and influence it at the structural level.",
    strengths: [
      "Sees organizational patterns others miss",
      "Builds enterprise-wide coalitions with genuine shared ownership",
      "Shapes decision ecosystems rather than just navigating them",
      "Develops other leaders' navigation capabilities",
    ],
    risks: [
      "May become so focused on systemic change that tactical execution suffers",
      "Can overestimate others' readiness for organizational complexity",
      "Risk of being perceived as political rather than principled if not grounded in ethical navigation",
    ],
    developmentFocus: "Ground systemic thinking in practical execution. Develop others deliberately. Maintain ethical clarity as influence grows.",
    scoreRange: [85, 100],
    triggerDimensions: ["org_awareness", "enterprise_alignment", "coalition_building"],
  },
  {
    id: "ethical_strategist",
    name: "The Ethical Strategist",
    tagline: "You advance important work with integrity — and people know it.",
    description:
      "You combine strong ethical navigation, reputation and credibility, and political navigation to create influence that is trusted at every level. People follow your lead because they trust your motives.",
    strengths: [
      "Trusted by senior leaders and peers alike",
      "Navigates organizational politics without compromising values",
      "Builds lasting credibility through consistent integrity",
      "Creates psychological safety in complex stakeholder environments",
    ],
    risks: [
      "May avoid necessary political engagement out of excessive caution",
      "Can be too principled in environments that require pragmatic compromise",
      "Risk of being overlooked in highly political organizations if visibility is not actively managed",
    ],
    developmentFocus: "Develop political navigation courage. Build visibility at senior levels. Engage organizational dynamics more proactively.",
    scoreRange: [70, 100],
    triggerDimensions: ["ethical_nav", "reputation_credibility", "political_nav"],
  },
  {
    id: "coalition_builder",
    name: "The Coalition Builder",
    tagline: "You turn isolated initiatives into organizational movements.",
    description:
      "You excel at bringing people together, creating shared ownership, and generating momentum behind important work. Your ability to convert skeptics into supporters is a distinctive organizational capability.",
    strengths: [
      "Builds genuine coalitions — not just compliance",
      "Converts resistance into partnership",
      "Creates shared ownership that sustains momentum",
      "Develops cross-functional partnerships that outlast individual initiatives",
    ],
    risks: [
      "May spend too much time building consensus and not enough time moving forward",
      "Can over-invest in stakeholder engagement when decisive action is needed",
      "Risk of coalition fragmentation if enterprise alignment is not maintained",
    ],
    developmentFocus: "Develop decision pathway intelligence. Balance coalition building with decisive action. Strengthen enterprise alignment.",
    scoreRange: [65, 100],
    triggerDimensions: ["coalition_building", "stakeholder_nav", "relationship_capital"],
  },
  {
    id: "strategic_navigator",
    name: "The Strategic Navigator",
    tagline: "You know when to move, when to wait, and which battles to fight.",
    description:
      "You combine exceptional timing and strategic judgment with decision pathway intelligence to advance important work with precision. You rarely waste effort on the wrong initiative at the wrong time.",
    strengths: [
      "Reads organizational readiness with precision",
      "Sequences initiatives for maximum impact",
      "Chooses battles strategically and wins them",
      "Anticipates resistance before it emerges",
    ],
    risks: [
      "May be perceived as overly cautious or slow by peers who prefer speed over precision",
      "Can over-analyze timing at the expense of momentum",
      "Risk of missing windows of opportunity by waiting for perfect conditions",
    ],
    developmentFocus: "Develop coalition building to accelerate momentum. Strengthen relationship capital to expand influence. Build enterprise alignment.",
    scoreRange: [65, 100],
    triggerDimensions: ["timing_judgment", "decision_pathway", "political_nav"],
  },
  {
    id: "relationship_navigator",
    name: "The Relationship Navigator",
    tagline: "Your network is your most powerful organizational asset.",
    description:
      "You have built exceptional relationship capital and reputation across the organization. People trust you, seek your perspective, and support your initiatives because of the investment you have made in them over time.",
    strengths: [
      "Trusted across functions, levels, and geographies",
      "Relationship capital creates access and influence that others cannot replicate",
      "Reputation for integrity and reliability opens doors",
      "Network provides early intelligence on organizational dynamics",
    ],
    risks: [
      "May rely too heavily on relationships and underinvest in formal organizational navigation skills",
      "Can be reluctant to use relationship capital on controversial initiatives",
      "Risk of relationship network becoming an echo chamber rather than a source of diverse perspective",
    ],
    developmentFocus: "Develop decision pathway intelligence. Strengthen enterprise alignment. Build political navigation skills to complement relationship strength.",
    scoreRange: [60, 100],
    triggerDimensions: ["relationship_capital", "reputation_credibility", "coalition_building"],
  },
  {
    id: "developing_navigator",
    name: "The Developing Navigator",
    tagline: "You have strong instincts — now build the skills to match.",
    description:
      "You have solid leadership capabilities and are developing the organizational navigation skills to match your technical and functional expertise. You navigate effectively within your function but face friction when operating across the broader organization.",
    strengths: [
      "Strong functional expertise that provides credibility",
      "Developing awareness of organizational dynamics",
      "Genuine commitment to ethical leadership",
      "Growing network within immediate function",
    ],
    risks: [
      "Important cross-functional initiatives may stall due to navigation gaps",
      "May be overlooked for enterprise leadership roles despite strong functional performance",
      "Risk of frustration when good ideas face organizational resistance",
    ],
    developmentFocus:
      "Build organizational awareness and stakeholder navigation as foundational priorities. Invest in cross-functional relationships. Develop political navigation with integrity.",
    scoreRange: [40, 64],
    triggerDimensions: ["org_awareness", "stakeholder_nav", "political_nav"],
  },
  {
    id: "reactive_navigator",
    name: "The Reactive Navigator",
    tagline: "You respond to organizational complexity — but rarely shape it.",
    description:
      "You navigate organizational dynamics primarily in response to events rather than anticipating and shaping them. Important initiatives frequently take longer than they should, and organizational resistance catches you off guard.",
    strengths: [
      "Responds effectively to immediate organizational challenges",
      "Genuine motivation to advance important work",
      "Developing awareness of organizational dynamics",
    ],
    risks: [
      "Initiatives stall due to insufficient stakeholder preparation",
      "Organizational resistance is often unexpected and difficult to manage",
      "Career progression may be limited by navigation gaps despite strong technical performance",
    ],
    developmentFocus:
      "Prioritize organizational awareness and decision pathway intelligence. Build relationship capital proactively. Develop stakeholder navigation skills.",
    scoreRange: [25, 54],
    triggerDimensions: ["timing_judgment", "decision_pathway", "stakeholder_nav"],
  },
];

// ─── Scoring Engine ───────────────────────────────────────────────────────────

function getNiiZone(score: number): NiiZone {
  return (
    NII_ZONES.find((z) => score >= z.range[0] && score <= z.range[1]) ??
    NII_ZONES[NII_ZONES.length - 1]
  );
}

function getNiiMaturityLevel(score: number): NiiMaturityLevel {
  return (
    NII_MATURITY_LEVELS.find((m) => score >= m.scoreRange[0] && score <= m.scoreRange[1]) ??
    NII_MATURITY_LEVELS[0]
  );
}

function getNiiArchetype(
  overallScore: number,
  dimensionScores: Record<string, number>
): NiiArchetype {
  if (overallScore >= 85) {
    return NII_ARCHETYPES.find((a) => a.id === "organizational_architect")!;
  }

  // Find the top 3 dimensions
  const sorted = Object.entries(dimensionScores).sort((a, b) => b[1] - a[1]);
  const topDims = sorted.slice(0, 3).map(([id]) => id);

  // Check for ethical_strategist: ethical_nav + reputation_credibility both high
  if (
    (dimensionScores["ethical_nav"] ?? 0) >= 75 &&
    (dimensionScores["reputation_credibility"] ?? 0) >= 75
  ) {
    return NII_ARCHETYPES.find((a) => a.id === "ethical_strategist")!;
  }

  // Check for coalition_builder: coalition_building + stakeholder_nav both high
  if (
    (dimensionScores["coalition_building"] ?? 0) >= 75 &&
    (dimensionScores["stakeholder_nav"] ?? 0) >= 70
  ) {
    return NII_ARCHETYPES.find((a) => a.id === "coalition_builder")!;
  }

  // Check for strategic_navigator: timing_judgment + decision_pathway both high
  if (
    (dimensionScores["timing_judgment"] ?? 0) >= 75 &&
    (dimensionScores["decision_pathway"] ?? 0) >= 70
  ) {
    return NII_ARCHETYPES.find((a) => a.id === "strategic_navigator")!;
  }

  // Check for relationship_navigator: relationship_capital + reputation_credibility both high
  if (
    (dimensionScores["relationship_capital"] ?? 0) >= 75 &&
    (dimensionScores["reputation_credibility"] ?? 0) >= 70
  ) {
    return NII_ARCHETYPES.find((a) => a.id === "relationship_navigator")!;
  }

  // Score-based fallback
  if (overallScore >= 55) {
    return NII_ARCHETYPES.find((a) => a.id === "developing_navigator")!;
  }

  return NII_ARCHETYPES.find((a) => a.id === "reactive_navigator")!;
}

export function scoreNii(responses: Record<string, number>): NiiScoreResult {
  const dimensionScores: Record<string, number> = {};

  for (const dim of NII_DIMENSIONS) {
    const dimQuestions = NII_QUESTIONS.filter((q) => q.dimensionId === dim.id);
    let rawSum = 0;
    for (const q of dimQuestions) {
      const raw = responses[String(q.id)] ?? 3;
      rawSum += q.reverseScored ? 6 - raw : raw;
    }
    // Normalise 3–15 → 0–100
    dimensionScores[dim.id] = Math.round(((rawSum - 3) / 12) * 100);
  }

  const overallScore = Math.round(
    Object.values(dimensionScores).reduce((a, b) => a + b, 0) / NII_DIMENSIONS.length
  );

  const zone = getNiiZone(overallScore);
  const maturity = getNiiMaturityLevel(overallScore);
  const archetype = getNiiArchetype(overallScore, dimensionScores);

  const sortedDims = NII_DIMENSIONS.map((d) => ({
    dimensionId: d.id,
    dimensionName: d.name,
    score: dimensionScores[d.id] ?? 0,
  })).sort((a, b) => b.score - a.score);

  const topStrengths = sortedDims.slice(0, 3);
  const developmentPriorities = [...sortedDims].sort((a, b) => a.score - b.score).slice(0, 3);

  return {
    overallScore,
    zoneId: zone.id,
    zoneLabel: zone.label,
    zoneDescription: zone.description,
    maturityLevelId: maturity.id,
    maturityLevelName: maturity.name,
    maturityLevelNumber: maturity.level,
    maturityTagline: maturity.tagline,
    archetypeId: archetype.id,
    archetypeLabel: archetype.name,
    archetypeTagline: archetype.tagline,
    archetypeStrengths: archetype.strengths,
    archetypeRisks: archetype.risks,
    archetypeDevelopmentFocus: archetype.developmentFocus,
    dimensionScores,
    topStrengths,
    developmentPriorities,
    strongestDimension: sortedDims[0]?.dimensionId ?? "",
    weakestDimension: sortedDims[sortedDims.length - 1]?.dimensionId ?? "",
    edgeScore: overallScore,
  };
}
