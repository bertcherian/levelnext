/**
 * Executive Communication Intelligence Judgement Specification (ECI-JS)
 *
 * Version: 1.0
 * Platform: LevelNext Intelligence Core
 * Status: Master Judgement Specification
 *
 * This module is the canonical source of truth for how the Intelligence Core
 * reasons about executive communication. It defines:
 *   - Universal score bands
 *   - Behavioural interpretation framework per sub-dimension
 *   - Single-dimension judgement rules
 *   - Cross-dimensional judgement rules
 *   - Executive communication archetypes
 *   - Promotion readiness rules
 *   - Coaching intervention library
 *   - Practice scenario library
 *   - Executive risk catalogue
 *   - Outcome measurement framework
 *   - AI reasoning examples
 *   - Validation test cases
 *
 * Reused across the rule engine (seeding), the recommendation engine
 * (generating interventions), and the user-facing /intelligence page
 * (rendering judgements and development pathways).
 */

// ═══════════════════════════════════════════════════════════════════════════════
// 1. UNIVERSAL SCORE BANDS
// ═══════════════════════════════════════════════════════════════════════════════

export type ScoreBand = {
  id: string;
  label: string;
  min: number;
  max: number;
  meaning: string;
};

export const ECI_SCORE_BANDS: ScoreBand[] = [
  { id: "exceptional", label: "Exceptional", min: 90, max: 100, meaning: "Enterprise role model; capable of mentoring others." },
  { id: "advanced", label: "Advanced", min: 80, max: 89, meaning: "Strong capability with only minor refinement needed." },
  { id: "proficient", label: "Proficient", min: 70, max: 79, meaning: "Reliable and effective in most executive contexts." },
  { id: "developing", label: "Developing", min: 60, max: 69, meaning: "Functional but inconsistent; improvement needed for higher leadership impact." },
  { id: "at_risk", label: "At Risk", min: 50, max: 59, meaning: "Capability is limiting effectiveness in important situations." },
  { id: "critical", label: "Critical Development Area", min: 0, max: 49, meaning: "Significant weakness requiring targeted intervention." },
];

export function getScoreBand(score: number): ScoreBand {
  return ECI_SCORE_BANDS.find(b => score >= b.min && score <= b.max) ?? ECI_SCORE_BANDS[5];
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. BEHAVIOURAL INTERPRETATION FRAMEWORK
// ═══════════════════════════════════════════════════════════════════════════════

export type BehaviouralInterpretation = {
  dimensionId: string;
  dimensionLabel: string;
  band: "high" | "moderate" | "low";
  scoreRange: string;
  judgement: string;
  observableBehaviours: string[];
  executivePerception: string;
  organisationalConsequences: string;
  careerConsequences: string;
};

export const ECI_BEHAVIOURAL_INTERPRETATIONS: BehaviouralInterpretation[] = [
  // ── Strategic Clarity & Brevity ──
  {
    dimensionId: "strategic_clarity",
    dimensionLabel: "Strategic Clarity & Brevity",
    band: "low",
    scoreRange: "Below 50",
    judgement: "The leader communicates with excessive detail and insufficient strategic framing, making it difficult for senior audiences to extract key messages.",
    observableBehaviours: [
      "Over-explains technical details when communicating with senior stakeholders",
      "Struggles to decide what to leave out — includes too much information",
      "Communicates activity and effort rather than impact and risk",
      "Takes too long to get to the point in leadership updates",
    ],
    executivePerception: "Viewed as a capable operator but not a strategic communicator. Senior leaders may bypass this person for high-stakes updates.",
    organisationalConsequences: "Slower decision-making due to information overload. Leadership meetings lose focus when this person presents.",
    careerConsequences: "May be seen as technically competent but not ready for roles requiring executive-level communication.",
  },
  {
    dimensionId: "strategic_clarity",
    dimensionLabel: "Strategic Clarity & Brevity",
    band: "moderate",
    scoreRange: "50–69",
    judgement: "The leader communicates clearly in familiar contexts but struggles to distil complexity in high-stakes or cross-functional situations.",
    observableBehaviours: [
      "Clear in written updates but verbose in live presentations",
      "Effective with immediate team but less so with senior leadership",
      "Inconsistent in prioritising what matters most",
    ],
    executivePerception: "Seen as reliable for operational communication but not yet a strategic voice in leadership forums.",
    organisationalConsequences: "Messages are understood but don't always drive action. Some strategic insights are lost in delivery.",
    careerConsequences: "On track for functional leadership but may plateau without sharper executive communication.",
  },
  {
    dimensionId: "strategic_clarity",
    dimensionLabel: "Strategic Clarity & Brevity",
    band: "high",
    scoreRange: "70+",
    judgement: "The leader distils complex thinking into clear, concise, high-impact messages that drive executive decisions.",
    observableBehaviours: [
      "Communicates impact and risk — not just activity and effort",
      "Tailors message depth to audience seniority",
      "Comes with recommendations, not just analysis",
      "Uses frameworks and analogies to make complex ideas accessible",
    ],
    executivePerception: "Trusted to represent the function in executive forums. Seen as a strategic communicator.",
    organisationalConsequences: "Faster, better-informed decisions. Leadership meetings are more productive when this person contributes.",
    careerConsequences: "Strong candidate for enterprise leadership roles requiring cross-functional influence.",
  },

  // ── Executive Framing & Prioritisation ──
  {
    dimensionId: "executive_framing",
    dimensionLabel: "Executive Framing & Prioritisation",
    band: "low",
    scoreRange: "Below 50",
    judgement: "The leader raises problems without recommendations and frames issues at an operational rather than strategic level.",
    observableBehaviours: [
      "Presents options without a clear recommendation",
      "Frames issues as operational problems rather than strategic risks",
      "Fails to reframe local challenges as enterprise priorities",
      "Misses opportunities to connect day-to-day work to strategic narrative",
    ],
    executivePerception: "Viewed as a problem-raiser rather than a problem-solver. Senior leaders may stop seeking input.",
    organisationalConsequences: "Leadership spends time framing issues instead of deciding. Strategic alignment is delayed.",
    careerConsequences: "Risk of being seen as a capable executor but not a strategic thinker. Promotion to enterprise roles is blocked.",
  },
  {
    dimensionId: "executive_framing",
    dimensionLabel: "Executive Framing & Prioritisation",
    band: "moderate",
    scoreRange: "50–69",
    judgement: "The leader can frame strategically in familiar domains but struggles to reframe cross-functional or enterprise-level issues.",
    observableBehaviours: [
      "Strong framing within own function but weaker across boundaries",
      "Sometimes defaults to operational framing under time pressure",
    ],
    executivePerception: "Seen as a solid functional leader with potential for broader scope. Needs more exposure to enterprise framing.",
    organisationalConsequences: "Functional alignment is strong but cross-functional initiatives may lack strategic framing.",
    careerConsequences: "Ready for larger functional scope. Enterprise roles require further development in strategic framing.",
  },
  {
    dimensionId: "executive_framing",
    dimensionLabel: "Executive Framing & Prioritisation",
    band: "high",
    scoreRange: "70+",
    judgement: "The leader consistently frames issues strategically, comes with recommendations, and connects local execution to enterprise priorities.",
    observableBehaviours: [
      "Always comes with a recommended course of action",
      "Reframes local execution challenges as strategic risks leadership should care about",
      "Prioritises what matters most — and says what doesn't matter",
    ],
    executivePerception: "Seen as a strategic partner. Senior leaders seek this person's perspective on cross-functional issues.",
    organisationalConsequences: "Faster strategic alignment. Leadership trusts this person to frame complex decisions.",
    careerConsequences: "Strong candidate for enterprise leadership and strategic roles.",
  },

  // ── Gravitas & Composure ──
  {
    dimensionId: "gravitas_composure",
    dimensionLabel: "Gravitas & Composure",
    band: "low",
    scoreRange: "Below 50",
    judgement: "The leader lacks composure under pressure, becoming defensive or reactive in senior forums, undermining executive credibility.",
    observableBehaviours: [
      "Becomes defensive when challenged by senior leaders",
      "Communication becomes rushed or flustered under pressure",
      "Hedges statements or adds unnecessary qualifiers with senior leaders",
      "Body language signals anxiety in high-stakes settings",
    ],
    executivePerception: "Viewed as not yet ready for high-stakes executive forums. Senior leaders may not trust this person in crisis situations.",
    organisationalConsequences: "Leadership meetings become tense. Stakeholders lose confidence in this person's ability to handle pressure.",
    careerConsequences: "Executive presence gap blocks promotion to enterprise roles. May be bypassed for board-level exposure.",
  },
  {
    dimensionId: "gravitas_composure",
    dimensionLabel: "Gravitas & Composure",
    band: "moderate",
    scoreRange: "50–69",
    judgement: "The leader maintains composure in familiar settings but shows signs of pressure in unfamiliar or high-stakes environments.",
    observableBehaviours: [
      "Composed with own team but less so with senior leadership",
      "Occasionally hedges statements under questioning",
      "Recovers well but initial reactions reveal pressure",
    ],
    executivePerception: "Seen as developing executive presence. Needs more exposure to high-stakes forums.",
    organisationalConsequences: "Generally effective but may not be the first choice for crisis or board-level communication.",
    careerConsequences: "On track for senior functional roles. Enterprise roles require stronger composure under pressure.",
  },
  {
    dimensionId: "gravitas_composure",
    dimensionLabel: "Gravitas & Composure",
    band: "high",
    scoreRange: "70+",
    judgement: "The leader projects calm authority and confidence under pressure, commanding respect in the most senior forums.",
    observableBehaviours: [
      "Responds with calm confidence when challenged",
      "Communication remains measured and authoritative in escalations and leadership reviews",
      "Maintains gravitas even when delivering difficult messages",
    ],
    executivePerception: "Seen as an executive who can handle any forum. Trusted with board-level communication and crisis management.",
    organisationalConsequences: "Stabilises high-pressure situations. Leadership trusts this person to represent the organisation.",
    careerConsequences: "Strong candidate for enterprise leadership, board engagement, and crisis management roles.",
  },

  // ── Confidence & Authority ──
  {
    dimensionId: "confidence_authority",
    dimensionLabel: "Confidence & Authority",
    band: "low",
    scoreRange: "Below 50",
    judgement: "The leader hesitates to take ownership of recommendations and communicates with insufficient executive authority.",
    observableBehaviours: [
      "Frequent qualifying language ('maybe', 'perhaps', 'I think')",
      "Defers decisions unnecessarily",
      "Presents options without recommendations",
      "Avoids challenging senior stakeholders",
      "Waits for others to speak first in senior meetings",
    ],
    executivePerception: "Viewed as technically capable but not ready for enterprise leadership. Senior leaders may not seek this person's opinion.",
    organisationalConsequences: "Slower decision-making. Reduced executive confidence. Lower influence in strategic discussions.",
    careerConsequences: "May be viewed as technically capable but not ready for enterprise leadership. Promotion risk due to authority gap.",
  },
  {
    dimensionId: "confidence_authority",
    dimensionLabel: "Confidence & Authority",
    band: "moderate",
    scoreRange: "50–69",
    judgement: "The leader can communicate with authority in familiar settings but becomes less assertive in senior or unfamiliar forums.",
    observableBehaviours: [
      "Assertive with own team but less so with senior leadership",
      "Occasionally defers to others when they should own the recommendation",
      "Speaks up in small groups but is quieter in large forums",
    ],
    executivePerception: "Seen as capable but needing more executive confidence. Has potential with targeted development.",
    organisationalConsequences: "Good influence within function but limited impact in cross-functional strategic discussions.",
    careerConsequences: "Ready for larger functional scope. Enterprise roles require stronger authority in senior forums.",
  },
  {
    dimensionId: "confidence_authority",
    dimensionLabel: "Confidence & Authority",
    band: "high",
    scoreRange: "70+",
    judgement: "The leader commands attention with opinion-first communication, takes ownership of recommendations, and challenges senior stakeholders when needed.",
    observableBehaviours: [
      "Speaks up proactively in leadership forums",
      "Articulates disagreement clearly without being aggressive or passive",
      "Presents recommendations before evidence",
      "Owns decisions and stands behind them",
    ],
    executivePerception: "Seen as an authoritative voice. Senior leaders respect this person's opinions and seek them out.",
    organisationalConsequences: "Faster, better decisions. This person's input carries weight in strategic discussions.",
    careerConsequences: "Strong candidate for enterprise leadership and roles requiring executive authority.",
  },

  // ── Stakeholder Influence & Persuasion ──
  {
    dimensionId: "stakeholder_influence",
    dimensionLabel: "Stakeholder Influence & Persuasion",
    band: "low",
    scoreRange: "Below 50",
    judgement: "The leader struggles to influence beyond their direct authority, relying on escalation rather than persuasion.",
    observableBehaviours: [
      "Finds it difficult to influence people who do not report to them",
      "Relies on manager to escalate on their behalf",
      "Unable to shift a peer's position through dialogue",
      "Avoids resistance rather than addressing it",
    ],
    executivePerception: "Viewed as effective within their team but limited in cross-functional influence. Not yet ready for matrix leadership.",
    organisationalConsequences: "Cross-functional initiatives stall. Decisions require escalation when they shouldn't.",
    careerConsequences: "Limited to functional roles. Enterprise and matrix leadership roles require stronger influence capability.",
  },
  {
    dimensionId: "stakeholder_influence",
    dimensionLabel: "Stakeholder Influence & Persuasion",
    band: "moderate",
    scoreRange: "50–69",
    judgement: "The leader can influence in familiar stakeholder relationships but struggles with complex or resistant stakeholders.",
    observableBehaviours: [
      "Effective with allies but less so with sceptics",
      "Influence works in one-on-one but not in group settings",
      "Sometimes defaults to positional authority rather than persuasion",
    ],
    executivePerception: "Seen as a capable influencer with room to grow. Needs more skill in managing resistance.",
    organisationalConsequences: "Most initiatives progress but some require escalation. Stakeholder management is inconsistent.",
    careerConsequences: "Ready for larger functional scope. Matrix and enterprise roles require broader influence capability.",
  },
  {
    dimensionId: "stakeholder_influence",
    dimensionLabel: "Stakeholder Influence & Persuasion",
    band: "high",
    scoreRange: "70+",
    judgement: "The leader influences cross-functional initiatives without positional authority, shifting resistant stakeholders through dialogue.",
    observableBehaviours: [
      "Gets cross-functional initiatives approved without escalation",
      "Shifts resistant peers through dialogue — not positional power",
      "Builds coalitions across the matrix",
      "Manages resistance directly and effectively",
    ],
    executivePerception: "Seen as a natural influencer. Senior leaders trust this person to drive cross-functional alignment.",
    organisationalConsequences: "Faster cross-functional alignment. Fewer escalations. Initiatives move through persuasion, not authority.",
    careerConsequences: "Strong candidate for matrix leadership, enterprise roles, and cross-functional strategic positions.",
  },

  // ── Political Intelligence & Navigation ──
  {
    dimensionId: "political_intelligence",
    dimensionLabel: "Political Intelligence & Navigation",
    band: "low",
    scoreRange: "Below 50",
    judgement: "The leader is often surprised by political dynamics that others anticipated, leading to misaligned initiatives and stakeholder friction.",
    observableBehaviours: [
      "Often surprised by political dynamics others seem to have anticipated",
      "Doesn't know which stakeholders to consult before major decisions",
      "Misreads the unspoken dynamics in leadership meetings",
      "Focuses on the merit of the argument and ignores the political context",
    ],
    executivePerception: "Viewed as naive about organisational dynamics. Senior leaders may not trust this person with politically sensitive initiatives.",
    organisationalConsequences: "Initiatives fail due to political misalignment. Stakeholder friction increases. Good ideas die from poor navigation.",
    careerConsequences: "Political blind spot limits enterprise leadership potential. May be bypassed for roles requiring organisational navigation.",
  },
  {
    dimensionId: "political_intelligence",
    dimensionLabel: "Political Intelligence & Navigation",
    band: "moderate",
    scoreRange: "50–69",
    judgement: "The leader reads obvious political dynamics but misses subtle or emerging patterns.",
    observableBehaviours: [
      "Understands formal stakeholder maps but misses informal influence networks",
      "Sometimes surprised by resistance that others anticipated",
      "Reads individual dynamics but struggles with systemic patterns",
    ],
    executivePerception: "Seen as politically aware but not yet politically agile. Needs more experience with complex organisational dynamics.",
    organisationalConsequences: "Most initiatives navigate well but some hit unexpected political resistance.",
    careerConsequences: "Ready for functional leadership. Enterprise roles require sharper political intelligence.",
  },
  {
    dimensionId: "political_intelligence",
    dimensionLabel: "Political Intelligence & Navigation",
    band: "high",
    scoreRange: "70+",
    judgement: "The leader reads unspoken dynamics in real time, anticipates political risks, and navigates complex matrix organisations with skill.",
    observableBehaviours: [
      "Reads the unspoken dynamics in leadership meetings and adjusts in real time",
      "Knows which stakeholders to consult, inform, or influence before major decisions",
      "Anticipates political risks and builds coalitions proactively",
      "Navigates competing agendas without compromising integrity",
    ],
    executivePerception: "Seen as politically intelligent and organisationally savvy. Trusted with sensitive initiatives and complex stakeholder environments.",
    organisationalConsequences: "Initiatives navigate political complexity smoothly. Fewer surprises. Stakeholder alignment is proactive, not reactive.",
    careerConsequences: "Strong candidate for enterprise leadership, change management, and politically complex roles.",
  },

  // ── Storytelling & Vision Communication ──
  {
    dimensionId: "storytelling_vision",
    dimensionLabel: "Storytelling & Vision Communication",
    band: "low",
    scoreRange: "Below 50",
    judgement: "The leader relies primarily on data and facts, rarely using narrative or storytelling, limiting emotional buy-in and strategic resonance.",
    observableBehaviours: [
      "Relies on data and facts — rarely uses narrative or storytelling",
      "Presentations are informative but not inspiring",
      "Struggles to create emotional buy-in for change initiatives",
      "Communicates the 'what' but not the 'why'",
    ],
    executivePerception: "Viewed as a competent analyst but not a visionary leader. Senior leaders may not feel inspired by this person's communication.",
    organisationalConsequences: "Strategic initiatives lack emotional commitment. Change management is harder. Vision doesn't cascade through the organisation.",
    careerConsequences: "May be seen as an operational leader but not a transformational one. Enterprise roles requiring vision communication are blocked.",
  },
  {
    dimensionId: "storytelling_vision",
    dimensionLabel: "Storytelling & Vision Communication",
    band: "moderate",
    scoreRange: "50–69",
    judgement: "The leader uses stories occasionally but doesn't yet integrate narrative and data into a compelling strategic vision.",
    observableBehaviours: [
      "Uses stories in informal settings but not in formal presentations",
      "Data and story are separate, not integrated",
      "Vision communication is clear but not emotionally resonant",
    ],
    executivePerception: "Seen as a clear communicator with potential for stronger vision communication. Needs more practice with narrative craft.",
    organisationalConsequences: "Messages are understood but don't always inspire action. Vision is communicated but doesn't always stick.",
    careerConsequences: "On track for senior functional roles. Enterprise and transformation roles require stronger narrative capability.",
  },
  {
    dimensionId: "storytelling_vision",
    dimensionLabel: "Storytelling & Vision Communication",
    band: "high",
    scoreRange: "70+",
    judgement: "The leader crafts compelling narratives that inspire, align, and drive strategic action, combining data and story masterfully.",
    observableBehaviours: [
      "Crafts narratives that create emotional buy-in — not just logical understanding",
      "Uses data and stories together — the data proves the point, the story makes it stick",
      "Communicates the 'why' before the 'what'",
      "Vision cascades through the organisation through memorable stories",
    ],
    executivePerception: "Seen as a visionary communicator. Senior leaders are inspired by this person's strategic narrative.",
    organisationalConsequences: "Strategic initiatives gain emotional commitment. Change management is smoother. Vision cascades effectively.",
    careerConsequences: "Strong candidate for enterprise leadership, transformation roles, and CEO-track positions.",
  },

  // ── Executive Visibility & Thought Leadership ──
  {
    dimensionId: "executive_visibility",
    dimensionLabel: "Executive Visibility & Thought Leadership",
    band: "low",
    scoreRange: "Below 50",
    judgement: "The leader's contributions are invisible to global leadership. They focus on execution rather than visibility, limiting career trajectory.",
    observableBehaviours: [
      "Contributions are invisible to global leadership",
      "Focuses on execution rather than visibility",
      "Rarely shares insights beyond immediate responsibilities",
      "Senior leaders don't know this person's name or strategic contributions",
    ],
    executivePerception: "Viewed as a reliable executor but not a strategic voice. Senior leaders may not consider this person for enterprise roles.",
    organisationalConsequences: "Good work goes unnoticed. The organisation underestimates this leader's true value. Career opportunities are limited.",
    careerConsequences: "Promotions stall despite strong performance. The leader is underestimated. Career trajectory plateaus.",
  },
  {
    dimensionId: "executive_visibility",
    dimensionLabel: "Executive Visibility & Thought Leadership",
    band: "moderate",
    scoreRange: "50–69",
    judgement: "The leader has some visibility but is not yet a recognised strategic voice in broader leadership forums.",
    observableBehaviours: [
      "Known within own function but not across the enterprise",
      "Occasionally shares insights but not proactively",
      "Visibility is inconsistent across leadership levels",
    ],
    executivePerception: "Seen as capable with potential for greater visibility. Needs to build a stronger executive brand.",
    organisationalConsequences: "Contributions are recognised within function but not at enterprise level.",
    careerConsequences: "Ready for larger functional scope. Enterprise roles require stronger visibility and thought leadership.",
  },
  {
    dimensionId: "executive_visibility",
    dimensionLabel: "Executive Visibility & Thought Leadership",
    band: "high",
    scoreRange: "70+",
    judgement: "The leader is a recognised strategic voice with strong executive brand, proactively sharing insights with global leadership.",
    observableBehaviours: [
      "Senior leaders know this person's name and associate them with specific strategic contributions",
      "Proactively creates opportunities to share insights with global leadership",
      "Builds strategic presence in leadership forums, HQ interactions, and industry conversations",
      "Thought leadership extends beyond the organisation",
    ],
    executivePerception: "Seen as a strategic leader and thought leader. Senior leaders seek this person's perspective.",
    organisationalConsequences: "The organisation benefits from this person's strategic visibility. Talent is recognised and retained.",
    careerConsequences: "Strong candidate for enterprise leadership, CEO-track roles, and external board positions.",
  },

  // ── Accountability & Delegation Conversations ──
  {
    dimensionId: "accountability_conversations",
    dimensionLabel: "Accountability & Delegation Conversations",
    band: "low",
    scoreRange: "Below 50",
    judgement: "The leader avoids difficult accountability conversations, allowing broken commitments to persist and eroding team performance.",
    observableBehaviours: [
      "Avoids difficult accountability conversations due to fear of damaging team morale",
      "Broken commitments are not addressed immediately or specifically",
      "Performance issues are managed passively rather than directly",
      "Delegation is vague, leading to missed expectations",
    ],
    executivePerception: "Viewed as a nice leader but not an effective one. Senior leaders may question this person's ability to drive performance.",
    organisationalConsequences: "Team performance declines. Broken commitments become normal. Accountability culture is weak.",
    careerConsequences: "May be seen as a good person but not a strong leader. Enterprise roles requiring performance management are blocked.",
  },
  {
    dimensionId: "accountability_conversations",
    dimensionLabel: "Accountability & Delegation Conversations",
    band: "moderate",
    scoreRange: "50–69",
    judgement: "The leader can have direct conversations but sometimes delays or softens them, creating inconsistency in accountability.",
    observableBehaviours: [
      "Addresses issues eventually but not always immediately",
      "Direct in some situations but avoids in others",
      "Delegation is mostly clear but occasionally vague under time pressure",
    ],
    executivePerception: "Seen as a capable leader with some inconsistency in holding people accountable.",
    organisationalConsequences: "Accountability is present but inconsistent. Some performance issues persist longer than they should.",
    careerConsequences: "Ready for larger team scope. Enterprise roles require more consistent accountability leadership.",
  },
  {
    dimensionId: "accountability_conversations",
    dimensionLabel: "Accountability & Delegation Conversations",
    band: "high",
    scoreRange: "70+",
    judgement: "The leader has direct performance conversations without damaging relationships, addressing issues immediately and specifically.",
    observableBehaviours: [
      "Has direct performance conversations without damaging the relationship",
      "Addresses broken commitments immediately and specifically",
      "Delegates with precision — clear expectations, outcomes, and timelines",
      "Creates a culture of accountability without fear",
    ],
    executivePerception: "Seen as a strong leader who drives performance while maintaining trust. Trusted with larger, more complex teams.",
    organisationalConsequences: "High-performance culture. Commitments are kept. Team operates with clarity and accountability.",
    careerConsequences: "Strong candidate for enterprise leadership and roles requiring large-scale performance management.",
  },

  // ── Trust Creation & Alignment Conversations ──
  {
    dimensionId: "trust_alignment",
    dimensionLabel: "Trust Creation & Alignment Conversations",
    band: "low",
    scoreRange: "Below 50",
    judgement: "The leader jumps to solutions quickly, missing the exploratory conversations that build trust and alignment.",
    observableBehaviours: [
      "Jumps to solutions without deep listening",
      "Finds it difficult to slow down for exploratory conversations",
      "Team members don't feel psychologically safe raising concerns",
      "Listens to respond rather than to understand",
    ],
    executivePerception: "Viewed as results-oriented but not a trusted leader. Senior leaders may not see this person as a culture builder.",
    organisationalConsequences: "Team engagement is lower. Bad news is hidden. Innovation is stifled. Trust is transactional.",
    careerConsequences: "May be seen as effective in the short term but not a sustainable leader. Culture-building roles are blocked.",
  },
  {
    dimensionId: "trust_alignment",
    dimensionLabel: "Trust Creation & Alignment Conversations",
    band: "moderate",
    scoreRange: "50–69",
    judgement: "The leader builds trust in familiar relationships but struggles to create psychological safety in larger or more diverse teams.",
    observableBehaviours: [
      "Trust is strong with immediate team but weaker with extended teams",
      "Listens well in one-on-one but less so in group settings",
      "Sometimes rushes to solutions under time pressure",
    ],
    executivePerception: "Seen as a trusted leader within their team with potential for broader culture-building impact.",
    organisationalConsequences: "Trust is present within the team but doesn't scale across the organisation.",
    careerConsequences: "Ready for larger team scope. Enterprise roles require broader trust-building capability.",
  },
  {
    dimensionId: "trust_alignment",
    dimensionLabel: "Trust Creation & Alignment Conversations",
    band: "high",
    scoreRange: "70+",
    judgement: "The leader creates psychological safety, listens to understand, and builds deep trust that enables alignment and innovation.",
    observableBehaviours: [
      "People feel psychologically safe to raise concerns, share bad news, and challenge thinking",
      "Listens to understand — not to respond. Reflects back before offering perspective",
      "Builds trust through consistent, empathetic, and honest dialogue",
      "Creates alignment through conversation, not just instruction",
    ],
    executivePerception: "Seen as a trusted, culture-building leader. Senior leaders trust this person with complex team and organisational dynamics.",
    organisationalConsequences: "High trust, high engagement, high innovation. Bad news travels fast. Teams are aligned and committed.",
    careerConsequences: "Strong candidate for enterprise leadership, culture transformation, and CEO-track roles.",
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// 3. CROSS-DIMENSIONAL JUDGEMENT RULES
// ═══════════════════════════════════════════════════════════════════════════════

export type CrossDimensionalRule = {
  id: string;
  ruleCode: string;
  displayName: string;
  conditions: Array<{ field: string; operator: string; value: number }>;
  inference: string;
  developmentPriority: string;
  recommendationTitle: string;
  recommendationDescription: string;
  recommendationType: string;
  priority: number;
};

export const ECI_CROSS_DIMENSIONAL_RULES: CrossDimensionalRule[] = [
  {
    id: "xcd_high_expertise_low_presence",
    ruleCode: "ECI_XCD_001",
    displayName: "High Expertise, Low Presence",
    conditions: [
      { field: "confidence_authority", operator: "<", value: 50 },
      { field: "gravitas_composure", operator: "<", value: 60 },
      { field: "strategic_clarity", operator: ">", value: 75 },
    ],
    inference: "Strong thinking exists but is not communicated with sufficient authority. The leader's expertise is masked by insufficient executive presence.",
    developmentPriority: "Executive Presence → Confidence & Authority → Strategic Framing",
    recommendationTitle: "Develop Executive Presence to Match Your Strategic Capability",
    recommendationDescription: "Your strategic thinking is strong, but your communication lacks the authority and presence needed for enterprise leadership. Focus on opinion-first communication drills, authority language coaching, and executive simulation practice.",
    recommendationType: "cross_dimensional_presence_gap",
    priority: 90,
  },
  {
    id: "xcd_operational_expert",
    ruleCode: "ECI_XCD_002",
    displayName: "Operational Expert",
    conditions: [
      { field: "storytelling_vision", operator: "<", value: 50 },
      { field: "executive_framing", operator: "<", value: 60 },
      { field: "stakeholder_influence", operator: ">", value: 70 },
    ],
    inference: "Trusted operator but unlikely to be viewed as a visionary leader. Influence is transactional rather than transformational.",
    developmentPriority: "Storytelling → Strategic Framing → Vision Communication",
    recommendationTitle: "Develop Narrative and Vision Communication Capability",
    recommendationDescription: "You are trusted as an operator but not yet seen as a visionary leader. Develop storytelling skills, integrate data with narrative, and practice communicating the 'why' before the 'what' to inspire strategic action.",
    recommendationType: "cross_dimensional_vision_gap",
    priority: 85,
  },
  {
    id: "xcd_hidden_executive",
    ruleCode: "ECI_XCD_003",
    displayName: "Hidden Executive",
    conditions: [
      { field: "strategic_clarity", operator: ">", value: 75 },
      { field: "gravitas_composure", operator: ">", value: 75 },
      { field: "stakeholder_influence", operator: ">", value: 75 },
      { field: "executive_visibility", operator: "<", value: 60 },
    ],
    inference: "Capability exceeds reputation. Primary development priority is visibility, not skill. The organisation is underestimating this leader.",
    developmentPriority: "Executive Visibility → Thought Leadership → Strategic Exposure",
    recommendationTitle: "Increase Executive Visibility to Match Your Capability",
    recommendationDescription: "Your communication capability exceeds your visibility. Your primary development priority is not skill but exposure. Proactively share insights with global leadership, build your executive brand, and create opportunities for strategic visibility.",
    recommendationType: "cross_dimensional_visibility_gap",
    priority: 88,
  },
  {
    id: "xcd_political_blind_spot",
    ruleCode: "ECI_XCD_004",
    displayName: "Political Blind Spot",
    conditions: [
      { field: "stakeholder_influence", operator: ">", value: 80 },
      { field: "political_intelligence", operator: "<", value: 55 },
    ],
    inference: "Persuades individuals but fails to build organisational coalitions. Strong one-on-one but misses systemic political dynamics.",
    developmentPriority: "Political Intelligence → Stakeholder Mapping → Coalition Building",
    recommendationTitle: "Develop Political Intelligence to Complement Your Influence Skills",
    recommendationDescription: "You persuade individuals effectively but miss broader organisational dynamics. Develop political intelligence by mapping informal influence networks, anticipating stakeholder reactions, and building coalitions before major decisions.",
    recommendationType: "cross_dimensional_political_gap",
    priority: 82,
  },
  {
    id: "xcd_invisible_expert",
    ruleCode: "ECI_XCD_005",
    displayName: "Invisible Expert",
    conditions: [
      { field: "strategic_clarity", operator: ">", value: 70 },
      { field: "executive_visibility", operator: "<", value: 50 },
      { field: "confidence_authority", operator: "<", value: 60 },
    ],
    inference: "Deep expertise is invisible to senior leadership due to low visibility and insufficient authority in communication. Career trajectory is at risk.",
    developmentPriority: "Visibility → Authority → Strategic Exposure",
    recommendationTitle: "Build Executive Visibility and Communication Authority",
    recommendationDescription: "Your expertise is not visible to senior leadership. Build your executive brand by proactively sharing insights, speaking up in leadership forums, and developing opinion-first communication that commands attention.",
    recommendationType: "cross_dimensional_invisible_expert",
    priority: 87,
  },
  {
    id: "xcd_presence_gap",
    ruleCode: "ECI_XCD_006",
    displayName: "Executive Presence Gap",
    conditions: [
      { field: "gravitas_composure", operator: "<", value: 55 },
      { field: "confidence_authority", operator: "<", value: 55 },
      { field: "stakeholder_influence", operator: ">", value: 65 },
    ],
    inference: "Influences through relationships rather than presence. Trusted personally but doesn't command authority in senior forums.",
    developmentPriority: "Gravitas → Authority → Composure Under Pressure",
    recommendationTitle: "Develop Executive Presence for Senior Leadership Forums",
    recommendationDescription: "You influence through relationships but don't yet command authority in senior forums. Develop gravitas through executive simulation practice, composure under pressure training, and authority language coaching.",
    recommendationType: "cross_dimensional_presence_gap",
    priority: 80,
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// 4. EXECUTIVE COMMUNICATION ARCHETYPES (Extended)
// ═══════════════════════════════════════════════════════════════════════════════

export type ExtendedArchetype = {
  id: string;
  label: string;
  description: string;
  coreStrengths: string[];
  blindSpots: string[];
  executiveRisks: string[];
  developmentPriorities: string[];
  idealEnvironments: string[];
  promotionRisks: string[];
};

export const ECI_EXTENDED_ARCHETYPES: ExtendedArchetype[] = [
  {
    id: "trusted_integrator",
    label: "Trusted Integrator",
    description: "A connector who builds trust across functions and geographies through consistent, reliable, and empathetic communication.",
    coreStrengths: ["Exceptional trust-building", "Creates psychological safety", "Strong accountability conversations"],
    blindSpots: ["May lack strategic sharpness", "Executive presence needs strengthening", "Visibility in senior forums limited"],
    executiveRisks: ["May be seen as a good person but not a strong leader", "Promotion may stall without stronger strategic voice"],
    developmentPriorities: ["Strategic framing", "Executive presence", "Visibility in senior forums"],
    idealEnvironments: ["Matrix organisations", "Cross-functional transformation", "Culture change initiatives"],
    promotionRisks: ["Plateau risk without stronger strategic communication", "May be bypassed for enterprise roles"],
  },
  {
    id: "strategic_visionary",
    label: "Strategic Visionary",
    description: "A compelling storyteller and vision communicator who creates emotional resonance and strategic alignment through powerful narrative.",
    coreStrengths: ["Exceptional storytelling and vision communication", "Strong executive brand and visibility", "Creates inspiration and alignment"],
    blindSpots: ["May over-rely on narrative at the expense of precision", "Accountability conversations may be softer than needed", "Execution follow-through communication can be inconsistent"],
    executiveRisks: ["May be seen as inspiring but not rigorous", "Execution gaps may undermine credibility"],
    developmentPriorities: ["Accountability conversations", "Data-driven communication", "Execution follow-through"],
    idealEnvironments: ["Transformation initiatives", "Change management", "Vision-driven organisations"],
    promotionRisks: ["May plateau if execution communication doesn't match vision"],
  },
  {
    id: "executive_operator",
    label: "Executive Operator",
    description: "A highly capable executor who communicates primarily in technical and operational language. Strategic communication and executive presence are underdeveloped.",
    coreStrengths: ["Precise, accurate communication", "Strong credibility with technical peers", "Reliable delivery"],
    blindSpots: ["Limited executive visibility", "Struggles to influence business stakeholders", "Career ceiling approaching"],
    executiveRisks: ["May be seen as a technical expert but not a business leader", "Promotion to enterprise roles is blocked"],
    developmentPriorities: ["Strategic framing", "Executive presence", "Storytelling and vision communication"],
    idealEnvironments: ["Technical organisations", "Operations-focused roles", "Delivery-focused teams"],
    promotionRisks: ["Career ceiling without strategic communication development"],
  },
  {
    id: "analytical_specialist",
    label: "Analytical Specialist",
    description: "A deep technical expert whose communication is data-rich but lacks narrative, presence, and strategic framing.",
    coreStrengths: ["Deep domain credibility", "Rigorous, data-driven communication", "Trusted for technical accuracy"],
    blindSpots: ["Low executive presence", "Limited storytelling capability", "Invisible to senior leadership"],
    executiveRisks: ["Viewed as a technical resource, not a leader", "Promotion stalls despite expertise"],
    developmentPriorities: ["Executive presence", "Storytelling", "Strategic visibility"],
    idealEnvironments: ["Research and development", "Technical strategy", "Specialist consulting"],
    promotionRisks: ["Plateau at senior specialist level without communication development"],
  },
  {
    id: "quiet_influencer",
    label: "Quiet Influencer",
    description: "A leader who influences through relationships and trust rather than authority and visibility. Effective but underestimated.",
    coreStrengths: ["Strong one-on-one influence", "Builds durable trust", "Effective in small group settings"],
    blindSpots: ["Low visibility in large forums", "Limited executive presence", "Influence doesn't scale"],
    executiveRisks: ["Underestimated by senior leadership", "Promotion may be slower than capability warrants"],
    developmentPriorities: ["Executive visibility", "Large forum presence", "Thought leadership"],
    idealEnvironments: ["Relationship-driven cultures", "Matrix organisations", "Behind-the-scenes influence roles"],
    promotionRisks: ["Slower promotion trajectory despite strong capability"],
  },
  {
    id: "inspirational_catalyst",
    label: "Inspirational Catalyst",
    description: "A compelling communicator who inspires action through emotional resonance and powerful narrative. Strong in vision and weak in accountability.",
    coreStrengths: ["Exceptional storytelling", "Creates emotional buy-in", "Strong executive visibility"],
    blindSpots: ["Accountability conversations may be avoided", "May lack precision in data-driven contexts", "Execution follow-through is inconsistent"],
    executiveRisks: ["May be seen as inspiring but not effective", "Performance management may be weak"],
    developmentPriorities: ["Accountability conversations", "Data-driven communication", "Execution discipline"],
    idealEnvironments: ["Transformation initiatives", "Vision-driven organisations", "Change leadership"],
    promotionRisks: ["May plateau if accountability and execution don't match inspiration"],
  },
  {
    id: "political_navigator",
    label: "Political Navigator",
    description: "A skilled navigator of complex stakeholder ecosystems with strong political intelligence and relationship capital.",
    coreStrengths: ["Exceptional stakeholder management", "Navigates organisational complexity with ease", "Builds durable coalitions"],
    blindSpots: ["May avoid necessary directness", "Can be perceived as consensus-dependent", "Slow to take bold positions"],
    executiveRisks: ["May be seen as political rather than principled", "Decision-making may be slower than needed"],
    developmentPriorities: ["Direct communication", "Bold positioning", "Opinion-first communication"],
    idealEnvironments: ["Complex matrix organisations", "Politically sensitive environments", "Multi-stakeholder initiatives"],
    promotionRisks: ["May be seen as a diplomat but not a driver"],
  },
  {
    id: "transformational_communicator",
    label: "Transformational Communicator",
    description: "A rare executive communicator who combines strategic clarity, stakeholder mastery, and compelling narrative to drive transformational change.",
    coreStrengths: ["Creates alignment across complex stakeholder ecosystems", "Communicates with authority and strategic intent", "Builds executive trust rapidly"],
    blindSpots: ["May move too fast for consensus-driven cultures", "Can be perceived as politically savvy rather than authentic"],
    executiveRisks: ["May struggle in slow-moving cultures", "Authenticity may be questioned"],
    developmentPriorities: ["Authentic communication", "Patience in consensus cultures", "Sustaining momentum"],
    idealEnvironments: ["Transformation initiatives", "Turnaround situations", "High-velocity organisations"],
    promotionRisks: ["Strong candidate for CEO-track and transformation roles"],
  },
  {
    id: "technical_authority",
    label: "Technical Authority",
    description: "A deep expert who commands respect through technical credibility but lacks the narrative and political skills for enterprise leadership.",
    coreStrengths: ["Deep technical credibility", "Precise communication", "Trusted for expertise"],
    blindSpots: ["Limited political intelligence", "Weak storytelling", "Low executive visibility"],
    executiveRisks: ["Viewed as a technical resource, not a strategic leader", "Career ceiling at senior specialist level"],
    developmentPriorities: ["Political intelligence", "Storytelling", "Executive visibility"],
    idealEnvironments: ["Technical organisations", "R&D", "Specialist leadership roles"],
    promotionRisks: ["Plateau without political and narrative development"],
  },
  {
    id: "enterprise_statesperson",
    label: "Enterprise Statesperson",
    description: "An elite executive communicator who combines all dimensions — strategic clarity, presence, influence, narrative, and conversational leadership — at the highest level.",
    coreStrengths: ["Mastery across all communication dimensions", "Exceptional executive presence", "Builds trust and drives action at enterprise scale"],
    blindSpots: ["May be perceived as too polished", "Can struggle with highly technical audiences"],
    executiveRisks: ["May be seen as too good to be true", "Authenticity may be questioned"],
    developmentPriorities: ["Mentoring others", "Sustaining the edge", "Developing the next generation"],
    idealEnvironments: ["Enterprise leadership", "CEO and board-level roles", "Industry thought leadership"],
    promotionRisks: ["Strong candidate for the highest executive roles"],
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// 5. PROMOTION READINESS RULES
// ═══════════════════════════════════════════════════════════════════════════════

export type PromotionReadinessRule = {
  id: string;
  label: string;
  conditions: Array<{ field: string; operator: string; value: number }>;
  readinessAssessment: string;
  developmentFocus: string;
};

export const ECI_PROMOTION_READINESS_RULES: PromotionReadinessRule[] = [
  {
    id: "pr_enterprise_ready",
    label: "Ready for Enterprise Leadership",
    conditions: [
      { field: "strategic_clarity", operator: ">=", value: 75 },
      { field: "gravitas_composure", operator: ">=", value: 75 },
      { field: "stakeholder_influence", operator: ">=", value: 75 },
      { field: "executive_visibility", operator: ">=", value: 70 },
    ],
    readinessAssessment: "This leader is ready for enterprise leadership roles. Communication capability is sufficient for board-level engagement and cross-functional strategic influence.",
    developmentFocus: "Sustain the edge. Focus on mentoring others and building the next generation of communicators.",
  },
  {
    id: "pr_larger_functional",
    label: "Ready for Larger Functional Scope",
    conditions: [
      { field: "strategic_clarity", operator: ">=", value: 65 },
      { field: "stakeholder_influence", operator: ">=", value: 65 },
      { field: "gravitas_composure", operator: ">=", value: 60 },
    ],
    readinessAssessment: "This leader is ready for larger functional scope. Communication is effective for senior functional leadership.",
    developmentFocus: "Develop executive presence and visibility for enterprise-level roles.",
  },
  {
    id: "pr_operator_needs_presence",
    label: "Strong Operator; Needs Executive Presence",
    conditions: [
      { field: "strategic_clarity", operator: ">=", value: 70 },
      { field: "gravitas_composure", operator: "<", value: 60 },
      { field: "confidence_authority", operator: "<", value: 60 },
    ],
    readinessAssessment: "Strong operator with solid strategic thinking but executive presence gap. Not yet ready for enterprise leadership.",
    developmentFocus: "Executive presence development — gravitas, composure, and authority in senior forums.",
  },
  {
    id: "pr_high_potential_needs_visibility",
    label: "High Potential; Requires Visibility",
    conditions: [
      { field: "strategic_clarity", operator: ">=", value: 70 },
      { field: "stakeholder_influence", operator: ">=", value: 70 },
      { field: "executive_visibility", operator: "<", value: 60 },
    ],
    readinessAssessment: "High-potential leader whose capability exceeds visibility. Career trajectory is limited by exposure, not skill.",
    developmentFocus: "Executive visibility — thought leadership, strategic exposure, and building executive brand.",
  },
  {
    id: "pr_influence_gap_risk",
    label: "Promotion Risk Due to Influence Gaps",
    conditions: [
      { field: "stakeholder_influence", operator: "<", value: 55 },
      { field: "political_intelligence", operator: "<", value: 55 },
    ],
    readinessAssessment: "Promotion risk due to influence and political intelligence gaps. Not yet ready for matrix or enterprise leadership.",
    developmentFocus: "Stakeholder influence and political intelligence development before promotion.",
  },
  {
    id: "pr_plateau_risk",
    label: "Plateau Risk",
    conditions: [
      { field: "executive_visibility", operator: "<", value: 55 },
      { field: "storytelling_vision", operator: "<", value: 55 },
    ],
    readinessAssessment: "Plateau risk. Without stronger visibility and narrative capability, career trajectory will slow.",
    developmentFocus: "Visibility and storytelling development to break through the plateau.",
  },
  {
    id: "pr_board_ready",
    label: "Board-Ready Communicator",
    conditions: [
      { field: "strategic_clarity", operator: ">=", value: 80 },
      { field: "gravitas_composure", operator: ">=", value: 80 },
      { field: "stakeholder_influence", operator: ">=", value: 80 },
      { field: "storytelling_vision", operator: ">=", value: 75 },
    ],
    readinessAssessment: "Board-ready communicator. This leader can engage effectively at board level and represent the organisation externally.",
    developmentFocus: "Sustain excellence. Focus on external thought leadership and industry influence.",
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// 6. COACHING INTERVENTION LIBRARY
// ═══════════════════════════════════════════════════════════════════════════════

export type CoachingIntervention = {
  id: string;
  objective: string;
  practiceExercises: string[];
  aiSimulations: string[];
  reflectionQuestions: string[];
  momentumPartnerPrompts: string[];
  suggestedDurationWeeks: number;
  successMetrics: string[];
};

export const ECI_COACHING_INTERVENTIONS: Record<string, CoachingIntervention> = {
  authority_language_coaching: {
    id: "authority_language_coaching",
    objective: "Replace qualifying language with opinion-first, authoritative communication.",
    practiceExercises: [
      "Opinion-first communication drills: state your recommendation before evidence",
      "Record and review: identify every qualifying word in a 5-minute presentation",
      "Practice starting sentences with 'I recommend' instead of 'I think maybe'",
      "Executive simulation: present a recommendation to a resistant senior leader",
    ],
    aiSimulations: [
      "Present an unpopular recommendation to the executive committee",
      "Challenge a senior stakeholder's position respectfully but firmly",
      "Deliver a decisive update to the board without hedging",
    ],
    reflectionQuestions: [
      "When did I hedge my language this week, and what was I afraid of?",
      "What would have happened if I had stated my recommendation first?",
      "How did my qualifying language affect the senior leader's perception of me?",
    ],
    momentumPartnerPrompts: [
      "Ask: What recommendation did you lead with this week?",
      "Ask: Where did you catch yourself hedging, and what did you do?",
      "Ask: How did speaking first (instead of waiting) change the dynamic?",
    ],
    suggestedDurationWeeks: 4,
    successMetrics: [
      "Zero qualifying language in executive presentations",
      "Recommendation stated within first 30 seconds of update",
      "Self-reported confidence in senior forums increased",
    ],
  },
  storytelling_development: {
    id: "storytelling_development",
    objective: "Develop narrative capability to create emotional buy-in and strategic resonance.",
    practiceExercises: [
      "Story spine exercise: craft a 2-minute story about a strategic initiative",
      "Data-story integration: take a data slide and add a narrative overlay",
      "Vision communication: write and deliver a 5-minute vision speech",
      "Story bank: collect 10 personal stories that illustrate strategic themes",
    ],
    aiSimulations: [
      "Communicate a change initiative to a sceptical team using narrative",
      "Deliver a vision speech at an all-hands meeting",
      "Present a strategic transformation story to the board",
    ],
    reflectionQuestions: [
      "What story did I tell this week, and what action did it drive?",
      "How did the audience react differently to data vs. story?",
      "What narrative would make my next presentation more compelling?",
    ],
    momentumPartnerPrompts: [
      "Ask: What story did you tell this week?",
      "Ask: How did the story change the audience's response?",
      "Ask: What story would make your next presentation more memorable?",
    ],
    suggestedDurationWeeks: 6,
    successMetrics: [
      "Stories used in at least 50% of presentations",
      "Audience engagement (questions, follow-up) increased after narrative",
      "Self-reported confidence in vision communication improved",
    ],
  },
  political_intelligence_development: {
    id: "political_intelligence_development",
    objective: "Develop political intelligence to navigate complex stakeholder ecosystems.",
    practiceExercises: [
      "Stakeholder mapping exercise: map formal and informal influence networks",
      "Anticipation drill: before a major decision, predict each stakeholder's reaction",
      "Coalition building: identify and engage 3 stakeholders before the next decision",
      "Power dynamics analysis: analyse a recent decision and the political dynamics that shaped it",
    ],
    aiSimulations: [
      "Influence a resistant stakeholder in a one-on-one conversation",
      "Navigate competing agendas in an executive committee meeting",
      "Build a coalition for a cross-functional initiative",
    ],
    reflectionQuestions: [
      "What political dynamic surprised me this week, and what should I have anticipated?",
      "Who should I have consulted before the last major decision?",
      "What informal influence network am I missing?",
    ],
    momentumPartnerPrompts: [
      "Ask: What stakeholder did you map this week?",
      "Ask: What political dynamic did you anticipate and prepare for?",
      "Ask: Who did you engage before the decision, and how did it change the outcome?",
    ],
    suggestedDurationWeeks: 6,
    successMetrics: [
      "Stakeholder map completed and maintained",
      "No surprises in major decisions (all stakeholders pre-engaged)",
      "Cross-functional initiatives progress without escalation",
    ],
  },
  visibility_building: {
    id: "visibility_building",
    objective: "Build executive visibility and thought leadership to match capability.",
    practiceExercises: [
      "Insight sharing: proactively share one strategic insight with global leadership each week",
      "Executive brand exercise: define and communicate 3 strategic contributions you want to be known for",
      "Forum participation: speak up at least once in every leadership forum",
      "Thought leadership: write one short insight piece per month for internal distribution",
    ],
    aiSimulations: [
      "Present a strategic insight at a global leadership town hall",
      "Represent your function in a cross-functional strategic review",
      "Deliver an executive update to the board",
    ],
    reflectionQuestions: [
      "What insight did I share with senior leadership this week?",
      "Who now knows my name and what strategic contribution do they associate with me?",
      "What opportunity did I create for visibility this week?",
    ],
    momentumPartnerPrompts: [
      "Ask: What insight did you share with global leadership this week?",
      "Ask: Who now knows your name and for what?",
      "Ask: What visibility opportunity did you create or accept this week?",
    ],
    suggestedDurationWeeks: 8,
    successMetrics: [
      "Senior leaders can name 3 strategic contributions",
      "Proactive insight sharing at least weekly",
      "Invited to at least 2 cross-functional strategic forums",
    ],
  },
  accountability_conversation_coaching: {
    id: "accountability_conversation_coaching",
    objective: "Develop direct accountability conversation skills without damaging relationships.",
    practiceExercises: [
      "SBI framework practice: Situation-Behaviour-Impact for difficult conversations",
      "Role-play: address a broken commitment immediately and specifically",
      "Delegation precision exercise: define outcome, timeline, and check-in for each delegation",
      "Difficult conversation rehearsal: prepare and practice one conversation per week",
    ],
    aiSimulations: [
      "Address a team member's repeated missed deadlines",
      "Have a direct performance conversation without damaging the relationship",
      "Delegate a complex task with precision and clarity",
    ],
    reflectionQuestions: [
      "What accountability conversation did I avoid this week, and what was the cost?",
      "How did addressing the issue immediately change the outcome?",
      "What delegation was vague, and how could I have been more precise?",
    ],
    momentumPartnerPrompts: [
      "Ask: What accountability conversation did you have this week?",
      "Ask: How did you address the broken commitment — immediately or later?",
      "Ask: What delegation could have been more precise?",
    ],
    suggestedDurationWeeks: 4,
    successMetrics: [
      "All broken commitments addressed within 24 hours",
      "Team accountability score improved",
      "Delegation clarity rated 4+ out of 5 by team members",
    ],
  },
  executive_presence_development: {
    id: "executive_presence_development",
    objective: "Develop gravitas, composure, and authority in high-stakes executive forums.",
    practiceExercises: [
      "Composure under fire: practice responding to challenging questions without defensiveness",
      "Executive simulation: present to a simulated board with challenging questions",
      "Body language awareness: record and review non-verbal signals in high-stakes settings",
      "Pause and pace: practice strategic pausing and measured pacing in responses",
    ],
    aiSimulations: [
      "Present to a hostile board with challenging questions",
      "Handle a crisis escalation in a leadership review",
      "Deliver difficult news to senior leadership with composure",
    ],
    reflectionQuestions: [
      "When did I lose composure this week, and what triggered it?",
      "How did my body language change under pressure?",
      "What would I do differently in the next high-stakes forum?",
    ],
    momentumPartnerPrompts: [
      "Ask: How did you maintain composure under pressure this week?",
      "Ask: What triggered you, and how did you recover?",
      "Ask: What would you do differently in the next high-stakes forum?",
    ],
    suggestedDurationWeeks: 6,
    successMetrics: [
      "No defensive reactions in executive forums",
      "Self-reported composure under pressure rated 4+ out of 5",
      "Senior leaders report increased confidence in this leader's executive presence",
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 7. PRACTICE SCENARIO LIBRARY
// ═══════════════════════════════════════════════════════════════════════════════

export type PracticeScenario = {
  id: string;
  dimensionId: string;
  scenario: string;
  difficulty: "intermediate" | "advanced" | "executive";
};

export const ECI_PRACTICE_SCENARIOS: PracticeScenario[] = [
  // Political Intelligence
  { id: "ps_pi_01", dimensionId: "political_intelligence", scenario: "Influencing a resistant stakeholder who blocks your initiative", difficulty: "advanced" },
  { id: "ps_pi_02", dimensionId: "political_intelligence", scenario: "Managing competing agendas in an executive committee meeting", difficulty: "executive" },
  { id: "ps_pi_03", dimensionId: "political_intelligence", scenario: "Presenting an unpopular recommendation to the leadership team", difficulty: "advanced" },
  { id: "ps_pi_04", dimensionId: "political_intelligence", scenario: "Navigating a board review discussion with conflicting priorities", difficulty: "executive" },
  { id: "ps_pi_05", dimensionId: "political_intelligence", scenario: "Building a coalition for a cross-functional transformation initiative", difficulty: "executive" },

  // Confidence & Authority
  { id: "ps_ca_01", dimensionId: "confidence_authority", scenario: "Presenting a recommendation to the executive committee", difficulty: "advanced" },
  { id: "ps_ca_02", dimensionId: "confidence_authority", scenario: "Challenging a senior stakeholder's position respectfully", difficulty: "executive" },
  { id: "ps_ca_03", dimensionId: "confidence_authority", scenario: "Speaking first in a senior leadership meeting", difficulty: "intermediate" },
  { id: "ps_ca_04", dimensionId: "confidence_authority", scenario: "Owning a decision and defending it under questioning", difficulty: "advanced" },

  // Storytelling & Vision
  { id: "ps_sv_01", dimensionId: "storytelling_vision", scenario: "Communicating a change initiative to a sceptical team", difficulty: "advanced" },
  { id: "ps_sv_02", dimensionId: "storytelling_vision", scenario: "Delivering a vision speech at an all-hands meeting", difficulty: "executive" },
  { id: "ps_sv_03", dimensionId: "storytelling_vision", scenario: "Presenting a strategic transformation story to the board", difficulty: "executive" },

  // Executive Visibility
  { id: "ps_ev_01", dimensionId: "executive_visibility", scenario: "Presenting a strategic insight at a global leadership town hall", difficulty: "executive" },
  { id: "ps_ev_02", dimensionId: "executive_visibility", scenario: "Representing your function in a cross-functional strategic review", difficulty: "advanced" },
  { id: "ps_ev_03", dimensionId: "executive_visibility", scenario: "Delivering an executive update to the board", difficulty: "executive" },

  // Accountability Conversations
  { id: "ps_ac_01", dimensionId: "accountability_conversations", scenario: "Addressing a team member's repeated missed deadlines", difficulty: "intermediate" },
  { id: "ps_ac_02", dimensionId: "accountability_conversations", scenario: "Having a direct performance conversation without damaging the relationship", difficulty: "advanced" },
  { id: "ps_ac_03", dimensionId: "accountability_conversations", scenario: "Delegating a complex task with precision and clarity", difficulty: "intermediate" },

  // Gravitas & Composure
  { id: "ps_gc_01", dimensionId: "gravitas_composure", scenario: "Presenting to a hostile board with challenging questions", difficulty: "executive" },
  { id: "ps_gc_02", dimensionId: "gravitas_composure", scenario: "Handling a crisis escalation in a leadership review", difficulty: "executive" },
  { id: "ps_gc_03", dimensionId: "gravitas_composure", scenario: "Delivering difficult news to senior leadership with composure", difficulty: "advanced" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// 8. EXECUTIVE RISK CATALOGUE
// ═══════════════════════════════════════════════════════════════════════════════

export type ExecutiveRisk = {
  id: string;
  label: string;
  behaviouralIndicators: string[];
  triggerConditions: string[];
  businessConsequences: string[];
  coachingPriorities: string[];
};

export const ECI_EXECUTIVE_RISKS: ExecutiveRisk[] = [
  {
    id: "invisible_expert",
    label: "Invisible Expert",
    behaviouralIndicators: ["Deep expertise not visible to senior leadership", "Focuses on execution not visibility", "Rarely speaks up in senior forums"],
    triggerConditions: ["Strategic Clarity > 70", "Executive Visibility < 50", "Confidence & Authority < 60"],
    businessConsequences: ["Organisation underestimates this leader's value", "Good work goes unnoticed", "Career opportunities are limited"],
    coachingPriorities: ["Visibility building", "Authority language coaching", "Executive brand development"],
  },
  {
    id: "overloaded_communicator",
    label: "Overloaded Communicator",
    behaviouralIndicators: ["Over-explains in senior forums", "Includes too much detail", "Struggles to prioritise what to leave out"],
    triggerConditions: ["Strategic Clarity < 50", "Executive Framing < 60"],
    businessConsequences: ["Slower decision-making", "Leadership meetings lose focus", "Key messages are lost in noise"],
    coachingPriorities: ["Strategic clarity and brevity", "Executive framing", "Message prioritisation"],
  },
  {
    id: "technical_translator",
    label: "Technical Translator",
    behaviouralIndicators: ["Communicates in technical language", "Struggles to translate for business audiences", "Data-rich but narrative-poor"],
    triggerConditions: ["Storytelling < 50", "Strategic Framing < 60", "Strategic Clarity > 65"],
    businessConsequences: ["Business stakeholders don't engage", "Strategic insights are lost in technical detail", "Influence is limited to technical peers"],
    coachingPriorities: ["Storytelling development", "Strategic framing", "Audience-tailored communication"],
  },
  {
    id: "vision_deficit",
    label: "Vision Deficit",
    behaviouralIndicators: ["Communicates the 'what' but not the 'why'", "No narrative or story", "Presentations are informative but not inspiring"],
    triggerConditions: ["Storytelling < 50", "Executive Visibility < 55"],
    businessConsequences: ["Strategic initiatives lack emotional commitment", "Change management is harder", "Vision doesn't cascade"],
    coachingPriorities: ["Storytelling development", "Vision communication", "Strategic narrative crafting"],
  },
  {
    id: "executive_presence_gap",
    label: "Executive Presence Gap",
    behaviouralIndicators: ["Becomes defensive under challenge", "Hedges statements with senior leaders", "Body language signals anxiety"],
    triggerConditions: ["Gravitas < 55", "Confidence & Authority < 55"],
    businessConsequences: ["Senior leaders don't trust this person in high-stakes forums", "Executive credibility is undermined", "Crisis management capability is questioned"],
    coachingPriorities: ["Executive presence development", "Composure under pressure", "Authority language coaching"],
  },
  {
    id: "political_isolation",
    label: "Political Isolation",
    behaviouralIndicators: ["Surprised by political dynamics", "Doesn't know who to consult before decisions", "Focuses on merit, ignores context"],
    triggerConditions: ["Political Intelligence < 55", "Stakeholder Influence > 65"],
    businessConsequences: ["Initiatives fail due to political misalignment", "Good ideas die from poor navigation", "Stakeholder friction increases"],
    coachingPriorities: ["Political intelligence development", "Stakeholder mapping", "Coalition building"],
  },
  {
    id: "micromanager_communicator",
    label: "Micromanager Communicator",
    behaviouralIndicators: ["Vague delegation with excessive follow-up", "Detailed instructions without outcomes", "Difficulty letting go of execution"],
    triggerConditions: ["Accountability Conversations < 55", "Strategic Clarity < 60"],
    businessConsequences: ["Team disengages", "Scalability is limited", "Leader becomes a bottleneck"],
    coachingPriorities: ["Delegation precision", "Outcome-based communication", "Trust building"],
  },
  {
    id: "storytelling_deficit",
    label: "Storytelling Deficit",
    behaviouralIndicators: ["Relies on data and facts only", "No narrative in presentations", "Cannot create emotional buy-in"],
    triggerConditions: ["Storytelling < 50"],
    businessConsequences: ["Presentations are informative but not persuasive", "Change initiatives lack momentum", "Vision doesn't resonate"],
    coachingPriorities: ["Storytelling development", "Narrative structure", "Data-story integration"],
  },
  {
    id: "authority_gap",
    label: "Authority Gap",
    behaviouralIndicators: ["Qualifying language", "Defers decisions unnecessarily", "Presents options without recommendations"],
    triggerConditions: ["Confidence & Authority < 50"],
    businessConsequences: ["Slower decision-making", "Reduced executive confidence", "Lower influence in strategic discussions"],
    coachingPriorities: ["Authority language coaching", "Opinion-first communication", "Executive simulation practice"],
  },
  {
    id: "consensus_seeker",
    label: "Consensus Seeker",
    behaviouralIndicators: ["Avoids taking bold positions", "Waits for consensus before acting", "Slow to commit to a direction"],
    triggerConditions: ["Confidence & Authority < 60", "Political Intelligence > 70"],
    businessConsequences: ["Decision-making is slower than needed", "Bold initiatives are diluted", "Leader is seen as risk-averse"],
    coachingPriorities: ["Opinion-first communication", "Bold positioning", "Decision ownership"],
  },
  {
    id: "detail_overload",
    label: "Detail Overload",
    behaviouralIndicators: ["Includes too much information", "Cannot prioritise what to leave out", "Over-explains technical details"],
    triggerConditions: ["Strategic Clarity < 55", "Executive Framing < 60"],
    businessConsequences: ["Senior audiences tune out", "Key messages are buried", "Meetings are unproductive"],
    coachingPriorities: ["Strategic clarity and brevity", "Message prioritisation", "Executive-level communication"],
  },
  {
    id: "reactive_communicator",
    label: "Reactive Communicator",
    behaviouralIndicators: ["Responds rather than initiates", "Communication is reactive not proactive", "Doesn't create visibility opportunities"],
    triggerConditions: ["Executive Visibility < 55", "Strategic Clarity < 60"],
    businessConsequences: ["Visibility is low", "Strategic contributions go unnoticed", "Career trajectory slows"],
    coachingPriorities: ["Visibility building", "Proactive communication", "Strategic insight sharing"],
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// 9. OUTCOME MEASUREMENT FRAMEWORK
// ═══════════════════════════════════════════════════════════════════════════════

export const ECI_OUTCOME_DOMAINS = [
  { id: "executive_confidence", label: "Increased Executive Confidence", description: "Self-reported and observed confidence in senior forums" },
  { id: "meeting_influence", label: "Greater Influence in Leadership Meetings", description: "Degree to which the leader shapes decisions in senior forums" },
  { id: "presentation_effectiveness", label: "Improved Presentation Effectiveness", description: "Quality and impact of executive presentations" },
  { id: "stakeholder_alignment_speed", label: "Faster Stakeholder Alignment", description: "Time to achieve cross-functional alignment on initiatives" },
  { id: "promotion_readiness", label: "Better Promotion Readiness", description: "Readiness for enterprise leadership roles" },
  { id: "thought_leadership", label: "Stronger Thought Leadership", description: "Recognition as a strategic voice inside and outside the organisation" },
  { id: "strategic_visibility", label: "Increased Strategic Visibility", description: "Visibility to global leadership and recognition for strategic contributions" },
  { id: "team_engagement", label: "Higher Team Engagement", description: "Team engagement and psychological safety scores" },
  { id: "cross_functional_collaboration", label: "Improved Cross-Functional Collaboration", description: "Effectiveness of cross-functional initiatives and relationships" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// 10. AI REASONING EXAMPLES
// ═══════════════════════════════════════════════════════════════════════════════

export type ReasoningExample = {
  id: string;
  inputScores: Record<string, number>;
  reasoning: string[];
  primaryJudgement: string;
  developmentPriority: string;
};

export const ECI_REASONING_EXAMPLES: ReasoningExample[] = [
  {
    id: "re_001",
    inputScores: {
      strategic_clarity: 82,
      executive_framing: 78,
      gravitas_composure: 55,
      confidence_authority: 48,
      stakeholder_influence: 71,
      political_intelligence: 65,
      storytelling_vision: 42,
      executive_visibility: 82,
      accountability_conversations: 68,
      trust_alignment: 72,
    },
    reasoning: [
      "1. Executive Presence is below threshold (Gravitas 55, Confidence 48).",
      "2. Narrative capability is significantly underdeveloped (Storytelling 42).",
      "3. Visibility exceeds communication impact (Visibility 82 vs Presence 51).",
      "4. Technical credibility is established (Strategic Clarity 82).",
      "5. Executive influence is constrained by authority and narrative rather than expertise.",
    ],
    primaryJudgement: "Recognised expert whose communication style limits perception as a strategic leader.",
    developmentPriority: "Executive Presence → Storytelling → Vision Communication",
  },
  {
    id: "re_002",
    inputScores: {
      strategic_clarity: 75,
      executive_framing: 72,
      gravitas_composure: 78,
      confidence_authority: 80,
      stakeholder_influence: 82,
      political_intelligence: 48,
      storytelling_vision: 65,
      executive_visibility: 70,
      accountability_conversations: 75,
      trust_alignment: 78,
    },
    reasoning: [
      "1. Strong executive presence and influence (Gravitas 78, Confidence 80, Influence 82).",
      "2. Political Intelligence is a significant blind spot (48).",
      "3. Persuades individuals but fails to build organisational coalitions.",
      "4. Storytelling is moderate but not yet a strategic asset (65).",
      "5. Overall capability is strong but political blind spot creates enterprise leadership risk.",
    ],
    primaryJudgement: "Persuasive leader with a political blind spot that limits organisational influence.",
    developmentPriority: "Political Intelligence → Coalition Building → Stakeholder Mapping",
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// 11. VALIDATION TEST CASES
// ═══════════════════════════════════════════════════════════════════════════════

export type ValidationTestCase = {
  id: string;
  label: string;
  inputScores: Record<string, number>;
  expectedTriggeredRules: string[];
  expectedJudgement: string;
  recommendedInterventions: string[];
  expectedOutcomeMeasures: string[];
};

export const ECI_VALIDATION_CASES: ValidationTestCase[] = [
  {
    id: "vtc_001",
    label: "High Expertise, Low Presence",
    inputScores: {
      strategic_clarity: 85,
      executive_framing: 80,
      gravitas_composure: 52,
      confidence_authority: 45,
      stakeholder_influence: 68,
      political_intelligence: 60,
      storytelling_vision: 55,
      executive_visibility: 72,
      accountability_conversations: 70,
      trust_alignment: 65,
    },
    expectedTriggeredRules: ["ECI_XCD_001", "pr_operator_needs_presence"],
    expectedJudgement: "Strong thinking exists but is not communicated with sufficient authority.",
    recommendedInterventions: ["authority_language_coaching", "executive_presence_development"],
    expectedOutcomeMeasures: ["executive_confidence", "meeting_influence", "presentation_effectiveness"],
  },
  {
    id: "vtc_002",
    label: "Hidden Executive",
    inputScores: {
      strategic_clarity: 82,
      executive_framing: 78,
      gravitas_composure: 80,
      confidence_authority: 78,
      stakeholder_influence: 80,
      political_intelligence: 75,
      storytelling_vision: 72,
      executive_visibility: 52,
      accountability_conversations: 78,
      trust_alignment: 80,
    },
    expectedTriggeredRules: ["ECI_XCD_003", "pr_high_potential_needs_visibility"],
    expectedJudgement: "Capability exceeds reputation. Primary development priority is visibility, not skill.",
    recommendedInterventions: ["visibility_building"],
    expectedOutcomeMeasures: ["strategic_visibility", "thought_leadership", "promotion_readiness"],
  },
  {
    id: "vtc_003",
    label: "Political Blind Spot",
    inputScores: {
      strategic_clarity: 70,
      executive_framing: 68,
      gravitas_composure: 72,
      confidence_authority: 75,
      stakeholder_influence: 85,
      political_intelligence: 48,
      storytelling_vision: 60,
      executive_visibility: 65,
      accountability_conversations: 70,
      trust_alignment: 68,
    },
    expectedTriggeredRules: ["ECI_XCD_004", "pr_influence_gap_risk"],
    expectedJudgement: "Persuades individuals but fails to build organisational coalitions.",
    recommendedInterventions: ["political_intelligence_development"],
    expectedOutcomeMeasures: ["stakeholder_alignment_speed", "cross_functional_collaboration"],
  },
];
