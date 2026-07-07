// ─── GCC Readiness Platform — Assessment Data ─────────────────────────────────
// 5 modules × 30 questions each = 150 total questions
// Likert scale: 1 (Strongly Disagree) → 5 (Strongly Agree)

export type QuestionType = "likert" | "maturity" | "forced_choice";

export interface Question {
  id: string;
  text: string;
  subdimension: string;
  type: QuestionType;
  reverseScored?: boolean; // If true, score = 6 - answer
}

export interface Module {
  id: string;
  name: string;
  coreQuestion: string;
  description: string;
  subdimensions: string[];
  questions: Question[];
  outputMetrics: string[];
}

// ─── MODULE 1: STRATEGIC INFLUENCE ────────────────────────────────────────────

const strategicInfluenceModule: Module = {
  id: "strategic_influence",
  name: "Strategic Influence",
  coreQuestion: "Is the GCC shaping enterprise outcomes — or merely executing tasks?",
  description:
    "Evaluates the GCC's capacity to influence enterprise strategy, earn stakeholder trust, and operate as a genuine business partner rather than a delivery arm.",
  subdimensions: [
    "Executive Presence",
    "Enterprise Alignment",
    "Stakeholder Influence",
    "Global Leadership Trust",
    "Strategic Contribution",
    "Business Understanding",
    "Influence Without Authority",
    "Internal Brand Equity",
  ],
  outputMetrics: [
    "Strategic Influence Score",
    "Enterprise Trust Score",
    "Influence Heatmap",
    "Executive Influence Maturity Level",
  ],
  questions: [
    {
      id: "si_01",
      text: "GCC leaders regularly participate in enterprise-level strategic planning discussions, not just execution reviews.",
      subdimension: "Executive Presence",
      type: "likert",
    },
    {
      id: "si_02",
      text: "The GCC head has direct access to and credibility with the global C-suite, not just regional or functional heads.",
      subdimension: "Executive Presence",
      type: "likert",
    },
    {
      id: "si_03",
      text: "GCC leadership proactively shapes business decisions rather than waiting for direction from the parent enterprise.",
      subdimension: "Executive Presence",
      type: "likert",
    },
    {
      id: "si_04",
      text: "Enterprise stakeholders view the GCC as a strategic asset, not a cost-reduction mechanism.",
      subdimension: "Enterprise Alignment",
      type: "likert",
    },
    {
      id: "si_05",
      text: "The GCC's annual objectives are directly derived from and visible in the enterprise's strategic priorities.",
      subdimension: "Enterprise Alignment",
      type: "likert",
    },
    {
      id: "si_06",
      text: "When enterprise strategy shifts, the GCC adapts its roadmap within weeks, not quarters.",
      subdimension: "Enterprise Alignment",
      type: "likert",
    },
    {
      id: "si_07",
      text: "GCC leaders can influence decisions in global forums without relying on positional authority.",
      subdimension: "Stakeholder Influence",
      type: "likert",
    },
    {
      id: "si_08",
      text: "Key enterprise stakeholders proactively seek the GCC's input before making decisions that affect the GCC.",
      subdimension: "Stakeholder Influence",
      type: "likert",
    },
    {
      id: "si_09",
      text: "The GCC has a defined stakeholder engagement strategy that goes beyond quarterly business reviews.",
      subdimension: "Stakeholder Influence",
      type: "likert",
    },
    {
      id: "si_10",
      text: "Global leadership trusts the GCC to own and deliver complex, high-stakes initiatives end-to-end.",
      subdimension: "Global Leadership Trust",
      type: "likert",
    },
    {
      id: "si_11",
      text: "The GCC has a track record of delivering on commitments that has earned it expanded scope over time.",
      subdimension: "Global Leadership Trust",
      type: "likert",
    },
    {
      id: "si_12",
      text: "Trust between the GCC and global leadership is based on demonstrated capability, not just relationship management.",
      subdimension: "Global Leadership Trust",
      type: "likert",
    },
    {
      id: "si_13",
      text: "The GCC can articulate its contribution to enterprise revenue, growth, or competitive advantage in concrete terms.",
      subdimension: "Strategic Contribution",
      type: "likert",
    },
    {
      id: "si_14",
      text: "The GCC has originated at least one enterprise-level initiative in the past 18 months that was adopted globally.",
      subdimension: "Strategic Contribution",
      type: "likert",
    },
    {
      id: "si_15",
      text: "GCC leaders understand the enterprise's competitive landscape and can connect their work to market outcomes.",
      subdimension: "Business Understanding",
      type: "likert",
    },
    {
      id: "si_16",
      text: "GCC teams understand how their work connects to customer outcomes, not just internal process metrics.",
      subdimension: "Business Understanding",
      type: "likert",
    },
    {
      id: "si_17",
      text: "GCC leaders regularly consume and discuss external market intelligence relevant to the enterprise's industry.",
      subdimension: "Business Understanding",
      type: "likert",
    },
    {
      id: "si_18",
      text: "GCC leaders can drive outcomes in cross-functional global teams where they have no direct reporting authority.",
      subdimension: "Influence Without Authority",
      type: "likert",
    },
    {
      id: "si_19",
      text: "The GCC has built coalitions with peer functions (finance, product, legal) that amplify its strategic influence.",
      subdimension: "Influence Without Authority",
      type: "likert",
    },
    {
      id: "si_20",
      text: "When the GCC disagrees with enterprise direction, it has constructive mechanisms to raise and resolve the conflict.",
      subdimension: "Influence Without Authority",
      type: "likert",
    },
    {
      id: "si_21",
      text: "The GCC has a clear, differentiated narrative about its value that is consistently communicated across the enterprise.",
      subdimension: "Internal Brand Equity",
      type: "likert",
    },
    {
      id: "si_22",
      text: "Top talent across the enterprise actively seeks to work with or transfer to the GCC.",
      subdimension: "Internal Brand Equity",
      type: "likert",
    },
    {
      id: "si_23",
      text: "The GCC's achievements are regularly highlighted in enterprise-wide communications and leadership forums.",
      subdimension: "Internal Brand Equity",
      type: "likert",
    },
    {
      id: "si_24",
      text: "The GCC is perceived as a career-enhancing destination, not a career plateau, by high-potential employees.",
      subdimension: "Internal Brand Equity",
      type: "likert",
    },
    {
      id: "si_25",
      text: "The GCC has a formal mechanism to measure and track its strategic influence with enterprise stakeholders.",
      subdimension: "Executive Presence",
      type: "likert",
    },
    {
      id: "si_26",
      text: "GCC leaders are invited to represent the enterprise externally (industry forums, analyst briefings, partnerships).",
      subdimension: "Strategic Contribution",
      type: "likert",
    },
    {
      id: "si_27",
      text: "The GCC's budget allocation reflects its strategic importance, not just its headcount cost.",
      subdimension: "Enterprise Alignment",
      type: "likert",
    },
    {
      id: "si_28",
      text: "Cross-cultural communication barriers rarely impede the GCC's ability to influence global stakeholders.",
      subdimension: "Global Leadership Trust",
      type: "likert",
    },
    {
      id: "si_29",
      text: "The GCC has a documented strategic roadmap that is co-owned with enterprise leadership, not just internally managed.",
      subdimension: "Strategic Contribution",
      type: "likert",
    },
    {
      id: "si_30",
      text: "The GCC's influence has expanded in scope and depth over the past two years, not contracted.",
      subdimension: "Enterprise Alignment",
      type: "likert",
    },
  ],
};

// ─── MODULE 2: OPERATING EXCELLENCE ───────────────────────────────────────────

const operatingExcellenceModule: Module = {
  id: "operating_excellence",
  name: "Operating Excellence",
  coreQuestion: "Is operational excellence systemic — or personality-dependent?",
  description:
    "Assesses whether the GCC's delivery reliability, governance discipline, and execution consistency are embedded in systems and culture, or dependent on a few key individuals.",
  subdimensions: [
    "Governance Rhythm",
    "Escalation Dependency",
    "Decision Speed",
    "Execution Discipline",
    "Delivery Predictability",
    "Ownership Culture",
    "Cross-Functional Alignment",
    "Risk Management",
  ],
  outputMetrics: [
    "Operational Stability Score",
    "Execution Maturity Index",
    "Governance Effectiveness Score",
    "Delivery Risk Heatmap",
  ],
  questions: [
    {
      id: "oe_01",
      text: "The GCC has a consistent governance cadence (weekly, monthly, quarterly reviews) that is rarely cancelled or deprioritised.",
      subdimension: "Governance Rhythm",
      type: "likert",
    },
    {
      id: "oe_02",
      text: "Governance meetings produce clear decisions and accountable owners, not just status updates.",
      subdimension: "Governance Rhythm",
      type: "likert",
    },
    {
      id: "oe_03",
      text: "The GCC's governance structure is documented, understood, and followed by all leaders.",
      subdimension: "Governance Rhythm",
      type: "likert",
    },
    {
      id: "oe_04",
      text: "Issues are resolved at the lowest appropriate level; escalation to senior leadership is the exception, not the norm.",
      subdimension: "Escalation Dependency",
      type: "likert",
    },
    {
      id: "oe_05",
      text: "The GCC has clear escalation criteria that prevent both under-escalation (surprises) and over-escalation (noise).",
      subdimension: "Escalation Dependency",
      type: "likert",
    },
    {
      id: "oe_06",
      text: "When key leaders are absent, operations continue without significant disruption or decision paralysis.",
      subdimension: "Escalation Dependency",
      type: "likert",
    },
    {
      id: "oe_07",
      text: "Decisions that should take days are not taking weeks due to unclear ownership or excessive approval layers.",
      subdimension: "Decision Speed",
      type: "likert",
    },
    {
      id: "oe_08",
      text: "The GCC has a defined decision rights framework that is consistently applied across functions.",
      subdimension: "Decision Speed",
      type: "likert",
    },
    {
      id: "oe_09",
      text: "Leaders are empowered to make decisions within their scope without seeking unnecessary upward approval.",
      subdimension: "Decision Speed",
      type: "likert",
    },
    {
      id: "oe_10",
      text: "Commitments made in planning cycles are delivered on time at a rate above 80%.",
      subdimension: "Execution Discipline",
      type: "likert",
    },
    {
      id: "oe_11",
      text: "When commitments are at risk, early warning signals are raised proactively, not disclosed at the deadline.",
      subdimension: "Execution Discipline",
      type: "likert",
    },
    {
      id: "oe_12",
      text: "Post-delivery retrospectives are conducted systematically and their learnings are applied to future cycles.",
      subdimension: "Execution Discipline",
      type: "likert",
    },
    {
      id: "oe_13",
      text: "Enterprise stakeholders can reliably predict GCC delivery outcomes based on the GCC's track record.",
      subdimension: "Delivery Predictability",
      type: "likert",
    },
    {
      id: "oe_14",
      text: "The GCC's delivery metrics are transparent, consistently measured, and shared with enterprise stakeholders.",
      subdimension: "Delivery Predictability",
      type: "likert",
    },
    {
      id: "oe_15",
      text: "Scope creep, requirement changes, and dependency failures are managed proactively, not reactively.",
      subdimension: "Delivery Predictability",
      type: "likert",
    },
    {
      id: "oe_16",
      text: "Accountability for outcomes is clear and personal — leaders do not deflect ownership to teams or circumstances.",
      subdimension: "Ownership Culture",
      type: "likert",
    },
    {
      id: "oe_17",
      text: "When things go wrong, the GCC conducts honest root-cause analysis and implements systemic fixes.",
      subdimension: "Ownership Culture",
      type: "likert",
    },
    {
      id: "oe_18",
      text: "High-performing individuals are recognised and rewarded; low performance is addressed directly, not tolerated.",
      subdimension: "Ownership Culture",
      type: "likert",
    },
    {
      id: "oe_19",
      text: "Cross-functional handoffs between teams within the GCC are smooth and rarely cause delivery delays.",
      subdimension: "Cross-Functional Alignment",
      type: "likert",
    },
    {
      id: "oe_20",
      text: "Teams across the GCC share a common understanding of priorities and do not work at cross-purposes.",
      subdimension: "Cross-Functional Alignment",
      type: "likert",
    },
    {
      id: "oe_21",
      text: "Collaboration between the GCC and enterprise counterparts is structured and productive, not ad hoc.",
      subdimension: "Cross-Functional Alignment",
      type: "likert",
    },
    {
      id: "oe_22",
      text: "The GCC has a formal risk register that is actively maintained and reviewed at governance forums.",
      subdimension: "Risk Management",
      type: "likert",
    },
    {
      id: "oe_23",
      text: "Operational risks (talent, technology, compliance, geopolitical) are identified and mitigated before they become crises.",
      subdimension: "Risk Management",
      type: "likert",
    },
    {
      id: "oe_24",
      text: "The GCC has tested business continuity plans that have been validated, not just documented.",
      subdimension: "Risk Management",
      type: "likert",
    },
    {
      id: "oe_25",
      text: "Process documentation is current, accessible, and used — not outdated artefacts stored in shared drives.",
      subdimension: "Governance Rhythm",
      type: "likert",
    },
    {
      id: "oe_26",
      text: "The GCC measures operational efficiency through leading indicators, not just lagging delivery metrics.",
      subdimension: "Delivery Predictability",
      type: "likert",
    },
    {
      id: "oe_27",
      text: "Meeting effectiveness is actively managed — meetings have clear agendas, end with decisions, and are not recurring without purpose.",
      subdimension: "Governance Rhythm",
      type: "likert",
    },
    {
      id: "oe_28",
      text: "The GCC's operational model can scale to 2x headcount without requiring a complete structural redesign.",
      subdimension: "Execution Discipline",
      type: "likert",
    },
    {
      id: "oe_29",
      text: "Compliance obligations (regulatory, contractual, security) are managed proactively with zero tolerance for systemic failures.",
      subdimension: "Risk Management",
      type: "likert",
    },
    {
      id: "oe_30",
      text: "The GCC has a defined operating model that is reviewed and updated at least annually.",
      subdimension: "Ownership Culture",
      type: "likert",
    },
  ],
};

// ─── MODULE 3: LEADERSHIP & TALENT ────────────────────────────────────────────

const leadershipTalentModule: Module = {
  id: "leadership_talent",
  name: "Leadership & Talent",
  coreQuestion: "Can the GCC leadership bench scale enterprise complexity?",
  description:
    "Examines the depth, sustainability, and scalability of the GCC's leadership pipeline, talent retention mechanisms, and organisational health indicators.",
  subdimensions: [
    "Leadership Scalability",
    "Talent Sustainability",
    "Coaching Culture",
    "Manager Effectiveness",
    "Internal Mobility",
    "Learning Velocity",
    "Psychological Safety",
    "Leadership Readiness",
  ],
  outputMetrics: [
    "Leadership Scalability Index",
    "Talent Sustainability Score",
    "Burnout Risk Meter",
    "Succession Readiness Index",
  ],
  questions: [
    {
      id: "lt_01",
      text: "The GCC has identified successors for all critical leadership roles who are ready to step up within 12 months.",
      subdimension: "Leadership Scalability",
      type: "likert",
    },
    {
      id: "lt_02",
      text: "Leadership capability development is treated as a strategic priority with dedicated investment, not a discretionary activity.",
      subdimension: "Leadership Scalability",
      type: "likert",
    },
    {
      id: "lt_03",
      text: "The GCC's leadership bench can absorb a 30% expansion in scope without requiring external senior hires.",
      subdimension: "Leadership Scalability",
      type: "likert",
    },
    {
      id: "lt_04",
      text: "Voluntary attrition among top-quartile performers is below the industry benchmark for the GCC's sector.",
      subdimension: "Talent Sustainability",
      type: "likert",
    },
    {
      id: "lt_05",
      text: "The GCC has a compelling employee value proposition that is differentiated from competitors in the local talent market.",
      subdimension: "Talent Sustainability",
      type: "likert",
    },
    {
      id: "lt_06",
      text: "Talent retention risks are identified proactively through structured stay interviews and flight-risk analysis.",
      subdimension: "Talent Sustainability",
      type: "likert",
    },
    {
      id: "lt_07",
      text: "Managers in the GCC spend meaningful time coaching their teams, not just managing tasks and deadlines.",
      subdimension: "Coaching Culture",
      type: "likert",
    },
    {
      id: "lt_08",
      text: "Coaching and mentoring are embedded in the performance management cycle, not offered as optional add-ons.",
      subdimension: "Coaching Culture",
      type: "likert",
    },
    {
      id: "lt_09",
      text: "Senior leaders in the GCC are actively developing the next generation of leaders, not just managing current performance.",
      subdimension: "Coaching Culture",
      type: "likert",
    },
    {
      id: "lt_10",
      text: "Managers in the GCC are assessed on their team's development outcomes, not just delivery metrics.",
      subdimension: "Manager Effectiveness",
      type: "likert",
    },
    {
      id: "lt_11",
      text: "Poor management practices are identified and addressed systematically, not tolerated because of individual delivery performance.",
      subdimension: "Manager Effectiveness",
      type: "likert",
    },
    {
      id: "lt_12",
      text: "The GCC has a clear definition of what 'good management' looks like and trains managers against that standard.",
      subdimension: "Manager Effectiveness",
      type: "likert",
    },
    {
      id: "lt_13",
      text: "High-potential employees have visible, accessible career pathways within the GCC and the broader enterprise.",
      subdimension: "Internal Mobility",
      type: "likert",
    },
    {
      id: "lt_14",
      text: "Internal mobility (lateral moves, project rotations, cross-functional assignments) is actively encouraged and facilitated.",
      subdimension: "Internal Mobility",
      type: "likert",
    },
    {
      id: "lt_15",
      text: "The GCC tracks and celebrates internal promotions and mobility as a key talent health metric.",
      subdimension: "Internal Mobility",
      type: "likert",
    },
    {
      id: "lt_16",
      text: "The GCC has a structured learning architecture that connects individual development to business capability needs.",
      subdimension: "Learning Velocity",
      type: "likert",
    },
    {
      id: "lt_17",
      text: "Learning and upskilling initiatives are measured for business impact, not just completion rates.",
      subdimension: "Learning Velocity",
      type: "likert",
    },
    {
      id: "lt_18",
      text: "The GCC's workforce can acquire new skills at the pace required by enterprise transformation demands.",
      subdimension: "Learning Velocity",
      type: "likert",
    },
    {
      id: "lt_19",
      text: "Employees in the GCC can raise concerns, challenge decisions, and share bad news without fear of negative consequences.",
      subdimension: "Psychological Safety",
      type: "likert",
    },
    {
      id: "lt_20",
      text: "Dissenting views are genuinely considered in decision-making, not performatively acknowledged and ignored.",
      subdimension: "Psychological Safety",
      type: "likert",
    },
    {
      id: "lt_21",
      text: "The GCC's culture actively prevents the suppression of problems until they become crises.",
      subdimension: "Psychological Safety",
      type: "likert",
    },
    {
      id: "lt_22",
      text: "The GCC has a formal leadership readiness programme for high-potential employees identified for senior roles.",
      subdimension: "Leadership Readiness",
      type: "likert",
    },
    {
      id: "lt_23",
      text: "Leaders in the GCC are assessed against enterprise-level leadership competencies, not just functional expertise.",
      subdimension: "Leadership Readiness",
      type: "likert",
    },
    {
      id: "lt_24",
      text: "The GCC's leadership team reflects the diversity of thought and background required to navigate global complexity.",
      subdimension: "Leadership Readiness",
      type: "likert",
    },
    {
      id: "lt_25",
      text: "Burnout indicators (excessive overtime, high sick leave, declining engagement scores) are monitored and acted upon.",
      subdimension: "Talent Sustainability",
      type: "likert",
    },
    {
      id: "lt_26",
      text: "The GCC's workload distribution is managed to prevent chronic overload on a small group of critical individuals.",
      subdimension: "Talent Sustainability",
      type: "likert",
    },
    {
      id: "lt_27",
      text: "The GCC conducts structured talent reviews at least twice a year that result in concrete development and retention actions.",
      subdimension: "Leadership Scalability",
      type: "likert",
    },
    {
      id: "lt_28",
      text: "GCC leaders have the cultural intelligence to lead diverse, cross-geography teams effectively.",
      subdimension: "Leadership Readiness",
      type: "likert",
    },
    {
      id: "lt_29",
      text: "The GCC's people strategy is co-created with enterprise HR and reflects both local market realities and global standards.",
      subdimension: "Manager Effectiveness",
      type: "likert",
    },
    {
      id: "lt_30",
      text: "Employee engagement scores in the GCC are at or above the enterprise average and are improving year-on-year.",
      subdimension: "Psychological Safety",
      type: "likert",
    },
  ],
};

// ─── MODULE 4: INNOVATION & AI ─────────────────────────────────────────────────

const innovationAiModule: Module = {
  id: "innovation_ai",
  name: "Innovation & AI",
  coreQuestion: "Will AI and innovation elevate the GCC — or expose its weaknesses?",
  description:
    "Measures the GCC's AI adoption maturity, innovation culture, automation capability, and readiness to compete in an AI-accelerated enterprise environment.",
  subdimensions: [
    "AI Leadership",
    "Innovation Culture",
    "Automation Maturity",
    "Product Thinking",
    "Experimentation Velocity",
    "AI Governance",
    "Digital Fluency",
    "Future Readiness",
  ],
  outputMetrics: [
    "AI Readiness Index",
    "Innovation Capability Score",
    "Automation Maturity Level",
    "Future Risk Assessment",
  ],
  questions: [
    {
      id: "ia_01",
      text: "The GCC has a designated AI/innovation leader with the authority and budget to drive transformation.",
      subdimension: "AI Leadership",
      type: "likert",
    },
    {
      id: "ia_02",
      text: "GCC leadership can articulate a clear AI strategy that is aligned with enterprise transformation priorities.",
      subdimension: "AI Leadership",
      type: "likert",
    },
    {
      id: "ia_03",
      text: "AI initiatives in the GCC are sponsored at the CXO level, not delegated entirely to technical teams.",
      subdimension: "AI Leadership",
      type: "likert",
    },
    {
      id: "ia_04",
      text: "The GCC has a culture where new ideas are regularly surfaced, evaluated, and acted upon — not just discussed.",
      subdimension: "Innovation Culture",
      type: "likert",
    },
    {
      id: "ia_05",
      text: "Innovation is a structured activity with dedicated time, resources, and accountability — not a side project.",
      subdimension: "Innovation Culture",
      type: "likert",
    },
    {
      id: "ia_06",
      text: "The GCC has delivered at least two innovations in the past 12 months that created measurable enterprise value.",
      subdimension: "Innovation Culture",
      type: "likert",
    },
    {
      id: "ia_07",
      text: "The GCC has automated repetitive, high-volume processes to a degree that has materially reduced manual effort.",
      subdimension: "Automation Maturity",
      type: "likert",
    },
    {
      id: "ia_08",
      text: "Automation initiatives are governed by a centre of excellence that prevents fragmented, redundant tooling.",
      subdimension: "Automation Maturity",
      type: "likert",
    },
    {
      id: "ia_09",
      text: "The GCC has a roadmap for advancing from task automation to intelligent process automation and AI-augmented workflows.",
      subdimension: "Automation Maturity",
      type: "likert",
    },
    {
      id: "ia_10",
      text: "GCC teams approach their work with a product mindset — focusing on outcomes and user value, not just feature delivery.",
      subdimension: "Product Thinking",
      type: "likert",
    },
    {
      id: "ia_11",
      text: "The GCC has product managers or equivalent roles who own outcomes, not just coordinate delivery.",
      subdimension: "Product Thinking",
      type: "likert",
    },
    {
      id: "ia_12",
      text: "The GCC measures success by business outcomes (adoption, efficiency, revenue impact), not just delivery velocity.",
      subdimension: "Product Thinking",
      type: "likert",
    },
    {
      id: "ia_13",
      text: "The GCC runs structured experiments (A/B tests, pilots, proof-of-concepts) before committing to full-scale implementation.",
      subdimension: "Experimentation Velocity",
      type: "likert",
    },
    {
      id: "ia_14",
      text: "Failed experiments are treated as learning investments, not failures that damage careers.",
      subdimension: "Experimentation Velocity",
      type: "likert",
    },
    {
      id: "ia_15",
      text: "The GCC can move from idea to working prototype in weeks, not months.",
      subdimension: "Experimentation Velocity",
      type: "likert",
    },
    {
      id: "ia_16",
      text: "The GCC has a formal AI governance framework covering data privacy, model risk, bias, and ethical use.",
      subdimension: "AI Governance",
      type: "likert",
    },
    {
      id: "ia_17",
      text: "AI models deployed by the GCC are monitored for performance degradation, bias, and unintended consequences.",
      subdimension: "AI Governance",
      type: "likert",
    },
    {
      id: "ia_18",
      text: "The GCC complies with enterprise AI policies and relevant regulatory requirements in all markets it serves.",
      subdimension: "AI Governance",
      type: "likert",
    },
    {
      id: "ia_19",
      text: "The majority of GCC employees have the digital literacy required to work effectively with AI-augmented tools.",
      subdimension: "Digital Fluency",
      type: "likert",
    },
    {
      id: "ia_20",
      text: "GCC leaders are personally fluent in AI concepts and can evaluate AI proposals without relying entirely on technical experts.",
      subdimension: "Digital Fluency",
      type: "likert",
    },
    {
      id: "ia_21",
      text: "The GCC has a structured digital upskilling programme that is keeping pace with the rate of technology change.",
      subdimension: "Digital Fluency",
      type: "likert",
    },
    {
      id: "ia_22",
      text: "The GCC has assessed which of its current roles are at risk of automation and has a plan to reskill affected employees.",
      subdimension: "Future Readiness",
      type: "likert",
    },
    {
      id: "ia_23",
      text: "The GCC's technology infrastructure can support the AI and automation ambitions in its 3-year roadmap.",
      subdimension: "Future Readiness",
      type: "likert",
    },
    {
      id: "ia_24",
      text: "The GCC is actively building AI capabilities that will be difficult for competitors to replicate quickly.",
      subdimension: "Future Readiness",
      type: "likert",
    },
    {
      id: "ia_25",
      text: "The GCC has partnerships with AI vendors, academic institutions, or startups that accelerate its innovation agenda.",
      subdimension: "Innovation Culture",
      type: "likert",
    },
    {
      id: "ia_26",
      text: "Data quality and data governance in the GCC are sufficient to support reliable AI model training and deployment.",
      subdimension: "AI Governance",
      type: "likert",
    },
    {
      id: "ia_27",
      text: "The GCC tracks AI ROI and can demonstrate measurable business value from its AI investments.",
      subdimension: "AI Leadership",
      type: "likert",
    },
    {
      id: "ia_28",
      text: "Human-AI collaboration models are being actively designed and tested, not left to emerge organically.",
      subdimension: "Automation Maturity",
      type: "likert",
    },
    {
      id: "ia_29",
      text: "The GCC's innovation pipeline has a healthy mix of incremental improvements and transformational bets.",
      subdimension: "Experimentation Velocity",
      type: "likert",
    },
    {
      id: "ia_30",
      text: "The GCC is positioned to be a net contributor of AI capability to the enterprise, not just a consumer of enterprise AI tools.",
      subdimension: "Future Readiness",
      type: "likert",
    },
  ],
};

// ─── MODULE 5: ENTERPRISE ALIGNMENT ───────────────────────────────────────────

const enterpriseAlignmentModule: Module = {
  id: "enterprise_alignment",
  name: "Enterprise Alignment",
  coreQuestion: "Is the GCC strategically aligned to enterprise priorities?",
  description:
    "Evaluates the depth of the GCC's integration with enterprise strategy, KPI coherence, funding confidence, and cross-geography coordination effectiveness.",
  subdimensions: [
    "Strategic Alignment",
    "KPI Coherence",
    "Enterprise Integration",
    "Funding Confidence",
    "Transformation Readiness",
    "Communication Clarity",
    "Business Context Awareness",
    "Cross-Regional Coordination",
  ],
  outputMetrics: [
    "Enterprise Alignment Score",
    "Strategic Coherence Index",
    "Organisational Synchronisation Score",
    "Alignment Risk Map",
  ],
  questions: [
    {
      id: "ea_01",
      text: "The GCC's strategic priorities are directly traceable to the enterprise's 3-year strategy, with no material gaps.",
      subdimension: "Strategic Alignment",
      type: "likert",
    },
    {
      id: "ea_02",
      text: "The GCC's leadership team can articulate the enterprise's top three strategic priorities without prompting.",
      subdimension: "Strategic Alignment",
      type: "likert",
    },
    {
      id: "ea_03",
      text: "When enterprise strategy is updated, the GCC's plans are revised within one planning cycle.",
      subdimension: "Strategic Alignment",
      type: "likert",
    },
    {
      id: "ea_04",
      text: "The GCC's KPIs are directly derived from enterprise-level metrics, not independently constructed.",
      subdimension: "KPI Coherence",
      type: "likert",
    },
    {
      id: "ea_05",
      text: "There are no material conflicts between the GCC's local KPIs and the enterprise's global performance metrics.",
      subdimension: "KPI Coherence",
      type: "likert",
    },
    {
      id: "ea_06",
      text: "KPI performance is reported to enterprise stakeholders in a format they find useful and actionable.",
      subdimension: "KPI Coherence",
      type: "likert",
    },
    {
      id: "ea_07",
      text: "The GCC is deeply integrated into enterprise planning, budgeting, and resource allocation processes.",
      subdimension: "Enterprise Integration",
      type: "likert",
    },
    {
      id: "ea_08",
      text: "Enterprise functions (finance, legal, HR, IT) treat the GCC as an integrated business unit, not an offshore vendor.",
      subdimension: "Enterprise Integration",
      type: "likert",
    },
    {
      id: "ea_09",
      text: "The GCC has formal representation in enterprise governance bodies (steering committees, leadership councils).",
      subdimension: "Enterprise Integration",
      type: "likert",
    },
    {
      id: "ea_10",
      text: "Enterprise leadership has committed to multi-year funding for the GCC's strategic initiatives, not just annual budget cycles.",
      subdimension: "Funding Confidence",
      type: "likert",
    },
    {
      id: "ea_11",
      text: "The GCC's budget is protected from arbitrary cuts when enterprise-wide cost reduction programmes are initiated.",
      subdimension: "Funding Confidence",
      type: "likert",
    },
    {
      id: "ea_12",
      text: "The GCC has a clear business case for its strategic investments that enterprise leadership endorses.",
      subdimension: "Funding Confidence",
      type: "likert",
    },
    {
      id: "ea_13",
      text: "The GCC is positioned to absorb and execute enterprise transformation mandates without structural disruption.",
      subdimension: "Transformation Readiness",
      type: "likert",
    },
    {
      id: "ea_14",
      text: "The GCC has successfully executed at least one major enterprise transformation initiative in the past two years.",
      subdimension: "Transformation Readiness",
      type: "likert",
    },
    {
      id: "ea_15",
      text: "Change management capability within the GCC is sufficient to manage the human side of transformation at scale.",
      subdimension: "Transformation Readiness",
      type: "likert",
    },
    {
      id: "ea_16",
      text: "Communication between the GCC and enterprise stakeholders is structured, timely, and rarely creates misalignment.",
      subdimension: "Communication Clarity",
      type: "likert",
    },
    {
      id: "ea_17",
      text: "The GCC has a formal communication strategy for managing enterprise stakeholder expectations.",
      subdimension: "Communication Clarity",
      type: "likert",
    },
    {
      id: "ea_18",
      text: "Bad news travels up quickly in the GCC — enterprise stakeholders are rarely surprised by problems.",
      subdimension: "Communication Clarity",
      type: "likert",
    },
    {
      id: "ea_19",
      text: "GCC teams understand the enterprise's competitive position, customer segments, and market dynamics.",
      subdimension: "Business Context Awareness",
      type: "likert",
    },
    {
      id: "ea_20",
      text: "GCC leaders can connect their operational decisions to enterprise commercial outcomes.",
      subdimension: "Business Context Awareness",
      type: "likert",
    },
    {
      id: "ea_21",
      text: "The GCC invests in building business acumen across its workforce, not just technical and functional skills.",
      subdimension: "Business Context Awareness",
      type: "likert",
    },
    {
      id: "ea_22",
      text: "Cross-geography coordination between the GCC and enterprise counterparts is effective and low-friction.",
      subdimension: "Cross-Regional Coordination",
      type: "likert",
    },
    {
      id: "ea_23",
      text: "Time zone, cultural, and communication differences are managed proactively, not treated as unavoidable friction.",
      subdimension: "Cross-Regional Coordination",
      type: "likert",
    },
    {
      id: "ea_24",
      text: "The GCC has a clear model for how it coordinates with regional and global enterprise teams on shared initiatives.",
      subdimension: "Cross-Regional Coordination",
      type: "likert",
    },
    {
      id: "ea_25",
      text: "Enterprise leadership's confidence in the GCC has increased over the past two years, as evidenced by expanded scope.",
      subdimension: "Funding Confidence",
      type: "likert",
    },
    {
      id: "ea_26",
      text: "The GCC's transformation agenda is co-owned with enterprise leadership, not driven unilaterally by the GCC.",
      subdimension: "Transformation Readiness",
      type: "likert",
    },
    {
      id: "ea_27",
      text: "The GCC has a formal mechanism to surface and resolve strategic misalignments with the enterprise before they escalate.",
      subdimension: "Strategic Alignment",
      type: "likert",
    },
    {
      id: "ea_28",
      text: "The GCC's organisational design is aligned to enterprise structure, enabling clean accountability and coordination.",
      subdimension: "Enterprise Integration",
      type: "likert",
    },
    {
      id: "ea_29",
      text: "The GCC's performance review cycle is synchronised with the enterprise's planning and review calendar.",
      subdimension: "KPI Coherence",
      type: "likert",
    },
    {
      id: "ea_30",
      text: "The GCC is seen by enterprise leadership as a partner in navigating uncertainty, not a liability to be managed.",
      subdimension: "Strategic Alignment",
      type: "likert",
    },
  ],
};

// ─── All Modules Export ────────────────────────────────────────────────────────

export const GCC_MODULES: Module[] = [
  strategicInfluenceModule,
  operatingExcellenceModule,
  leadershipTalentModule,
  innovationAiModule,
  enterpriseAlignmentModule,
];

export const GCC_MODULE_MAP: Record<string, Module> = Object.fromEntries(
  GCC_MODULES.map((m) => [m.id, m])
);

// ─── Scoring Engine ────────────────────────────────────────────────────────────

/**
 * Compute a module score from aggregated answers.
 * answers: { questionId → average answer (1–5) across all respondents }
 * Returns 0–100 score.
 */
export function computeModuleScore(
  moduleId: string,
  answers: Record<string, number>
): number {
  const module = GCC_MODULE_MAP[moduleId];
  if (!module) return 0;

  const scores: number[] = [];
  for (const question of module.questions) {
    const raw = answers[question.id];
    if (raw === undefined || raw === null) continue;
    const normalised = question.reverseScored
      ? ((6 - raw - 1) / 4) * 100
      : ((raw - 1) / 4) * 100;
    scores.push(normalised);
  }

  if (scores.length === 0) return 0;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

/**
 * Compute the composite GCC Readiness Score from all module scores.
 * moduleScores: { moduleId → 0–100 score }
 * Returns 0–100 composite score.
 */
export function computeGccReadinessScore(
  moduleScores: Record<string, number>
): number {
  const scores = Object.values(moduleScores);
  if (scores.length === 0) return 0;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

/**
 * Aggregate multiple respondents' answers per question.
 * responses: array of { questionId → answer } per respondent
 * Returns { questionId → average answer }
 */
export function aggregateResponses(
  responses: Record<string, number>[]
): Record<string, number> {
  const totals: Record<string, number> = {};
  const counts: Record<string, number> = {};

  for (const response of responses) {
    for (const [qId, answer] of Object.entries(response)) {
      totals[qId] = (totals[qId] ?? 0) + answer;
      counts[qId] = (counts[qId] ?? 0) + 1;
    }
  }

  const averages: Record<string, number> = {};
  for (const qId of Object.keys(totals)) {
    averages[qId] = totals[qId]! / counts[qId]!;
  }
  return averages;
}

// ─── Readiness Zones ───────────────────────────────────────────────────────────

export type ReadinessZone = {
  id: string;
  label: string;
  range: [number, number];
  colour: string;
  hexColour: string;
  message: string;
};

export const READINESS_ZONES: ReadinessZone[] = [
  {
    id: "critical",
    label: "Operationally Fragile",
    range: [0, 39],
    colour: "red",
    hexColour: "#EF4444",
    message:
      "The GCC is operating with fundamental structural weaknesses. Without urgent intervention across multiple dimensions, it faces significant risk of losing enterprise confidence, talent, and strategic relevance. This is not a performance management issue — it is a transformation imperative.",
  },
  {
    id: "developing",
    label: "Developing Capability",
    range: [40, 54],
    colour: "orange",
    hexColour: "#F97316",
    message:
      "The GCC has pockets of capability but lacks the systemic consistency required for enterprise-grade performance. Progress is personality-dependent rather than process-driven. Without deliberate structural investment, current gains will not compound.",
  },
  {
    id: "emerging",
    label: "Emerging Readiness",
    range: [55, 69],
    colour: "amber",
    hexColour: "#F59E0B",
    message:
      "The GCC is building credible foundations but has not yet achieved the reliability and strategic influence required to be considered enterprise-critical. Key gaps exist that, if unaddressed, will constrain the GCC's ability to scale and deepen its enterprise mandate.",
  },
  {
    id: "capable",
    label: "Enterprise Capable",
    range: [70, 84],
    colour: "blue",
    hexColour: "#3B82F6",
    message:
      "The GCC is operating at a level that earns enterprise trust and delivers consistent value. The challenge now is to move from reliable execution to strategic indispensability — a transition that requires deliberate investment in influence, innovation, and leadership depth.",
  },
  {
    id: "strategic",
    label: "Strategically Indispensable",
    range: [85, 100],
    colour: "green",
    hexColour: "#22C55E",
    message:
      "The GCC is operating at the frontier of what a world-class capability centre can achieve. It is shaping enterprise outcomes, not just supporting them. The imperative now is to sustain this position, deepen competitive differentiation, and export capability to the broader enterprise.",
  },
];

export function getReadinessZone(score: number): ReadinessZone {
  return (
    READINESS_ZONES.find((z) => score >= z.range[0] && score <= z.range[1]) ??
    READINESS_ZONES[0]!
  );
}

// ─── GCC Archetypes ────────────────────────────────────────────────────────────

export type GccArchetype = {
  id: string;
  label: string;
  description: string;
  typicalProfile: string;
  primaryStrength: string;
  primaryRisk: string;
};

export const GCC_ARCHETYPES: GccArchetype[] = [
  {
    id: "delivery_engine",
    label: "Delivery Engine",
    description:
      "Operationally reliable but strategically constrained. Excels at execution but has not yet earned the mandate to shape enterprise direction.",
    typicalProfile: "High Operating Excellence, Low Strategic Influence",
    primaryStrength: "Delivery predictability and governance discipline",
    primaryRisk: "Commoditisation risk as enterprise expectations evolve",
  },
  {
    id: "efficient_executor",
    label: "Efficient Executor",
    description:
      "Optimised for cost efficiency and process compliance. Valued for reliability but not yet positioned as a strategic asset.",
    typicalProfile: "High Operating Excellence, Low Innovation & AI",
    primaryStrength: "Cost efficiency and process maturity",
    primaryRisk: "Automation and offshoring displacement",
  },
  {
    id: "scaling_gcc",
    label: "Scaling GCC",
    description:
      "Growing rapidly in scope and headcount but organisational systems and leadership depth are not keeping pace with scale.",
    typicalProfile: "High Enterprise Alignment, Low Leadership & Talent",
    primaryStrength: "Enterprise mandate and growth trajectory",
    primaryRisk: "Leadership bottlenecks and cultural fragmentation",
  },
  {
    id: "enterprise_contributor",
    label: "Enterprise Contributor",
    description:
      "A trusted partner that consistently delivers on enterprise commitments and is beginning to shape strategic conversations.",
    typicalProfile: "Balanced scores across all modules, 60–74 overall",
    primaryStrength: "Consistent delivery and growing stakeholder trust",
    primaryRisk: "Plateau risk without deliberate investment in differentiation",
  },
  {
    id: "innovation_hub",
    label: "Innovation Hub",
    description:
      "A centre of innovation and experimentation that is driving enterprise-level capability advancement through AI and new ways of working.",
    typicalProfile: "High Innovation & AI, Moderate Operating Excellence",
    primaryStrength: "AI adoption and innovation culture",
    primaryRisk: "Execution inconsistency undermining innovation credibility",
  },
  {
    id: "strategic_partner",
    label: "Strategic Partner",
    description:
      "A GCC that has earned the right to co-create enterprise strategy. Trusted, influential, and operating with significant autonomy.",
    typicalProfile: "High Strategic Influence, High Enterprise Alignment",
    primaryStrength: "Enterprise trust and strategic co-ownership",
    primaryRisk: "Dependency on a small number of senior relationship holders",
  },
  {
    id: "ai_accelerated_gcc",
    label: "AI-Accelerated GCC",
    description:
      "An AI-native organisation that is systematically deploying intelligent automation and human-AI collaboration at scale.",
    typicalProfile: "High Innovation & AI, High Operating Excellence",
    primaryStrength: "AI maturity and automation-driven productivity",
    primaryRisk: "Governance and ethical AI risks at scale",
  },
  {
    id: "enterprise_growth_engine",
    label: "Enterprise Growth Engine",
    description:
      "The highest-performing GCC archetype. Strategically indispensable, operationally excellent, AI-ready, and leadership-deep.",
    typicalProfile: "High scores across all five modules, 85+ overall",
    primaryStrength: "Comprehensive enterprise readiness across all dimensions",
    primaryRisk: "Sustaining excellence and avoiding complacency at scale",
  },
];

/**
 * Assign a GCC Archetype based on module scores and overall score.
 */
export function assignArchetype(
  moduleScores: Record<string, number>,
  overallScore: number
): GccArchetype {
  const si = moduleScores["strategic_influence"] ?? 0;
  const oe = moduleScores["operating_excellence"] ?? 0;
  const lt = moduleScores["leadership_talent"] ?? 0;
  const ia = moduleScores["innovation_ai"] ?? 0;
  const ea = moduleScores["enterprise_alignment"] ?? 0;

  // Enterprise Growth Engine: top performer
  if (overallScore >= 85) {
    return GCC_ARCHETYPES.find((a) => a.id === "enterprise_growth_engine")!;
  }

  // AI-Accelerated GCC: high AI + high OE
  if (ia >= 75 && oe >= 70) {
    return GCC_ARCHETYPES.find((a) => a.id === "ai_accelerated_gcc")!;
  }

  // Strategic Partner: high SI + high EA
  if (si >= 75 && ea >= 70) {
    return GCC_ARCHETYPES.find((a) => a.id === "strategic_partner")!;
  }

  // Innovation Hub: high AI, moderate OE
  if (ia >= 70 && oe < 70) {
    return GCC_ARCHETYPES.find((a) => a.id === "innovation_hub")!;
  }

  // Scaling GCC: high EA, low LT
  if (ea >= 70 && lt < 55) {
    return GCC_ARCHETYPES.find((a) => a.id === "scaling_gcc")!;
  }

  // Efficient Executor: high OE, low IA
  if (oe >= 70 && ia < 50) {
    return GCC_ARCHETYPES.find((a) => a.id === "efficient_executor")!;
  }

  // Delivery Engine: high OE, low SI
  if (oe >= 65 && si < 55) {
    return GCC_ARCHETYPES.find((a) => a.id === "delivery_engine")!;
  }

  // Default: Enterprise Contributor
  return GCC_ARCHETYPES.find((a) => a.id === "enterprise_contributor")!;
}

export const GCC_ARCHETYPE_MAP: Record<string, GccArchetype> = Object.fromEntries(
  GCC_ARCHETYPES.map((a) => [a.id, a])
);
