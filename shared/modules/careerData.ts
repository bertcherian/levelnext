// ─── Career Intelligence — Shared Data & Scoring Engine ──────────────────────
// Six diagnostics covering the full career intelligence landscape for
// mid- and senior-level professionals navigating growth or transition.
//
// Module codes: CPI | CRS | CMK | CST | CAO | AIR
// Journey:      Discover → Position → Prepare → Activate → Transition

// ─── Shared Types ─────────────────────────────────────────────────────────────

export type CiDimension = {
  id: string;
  moduleCode: string;
  label: string;
  description: string;
  weight: number;
};

export type CiQuestion = {
  id: string;
  dimensionId: string;
  moduleCode: string;
  text: string;
  reverseScored?: boolean;
};

export type CiZone = {
  id: string;
  label: string;
  range: [number, number];
  color: string;
  description: string;
  implication: string;
};

export type CiArchetype = {
  id: string;
  moduleCode: string;
  label: string;
  description: string;
  strengths: string[];
  risks: string[];
  icon: string;
};

export type CiModuleMeta = {
  code: string;
  label: string;
  tagline: string;
  description: string;
  journeyStage: string;
  color: string;
  icon: string;
};

// ─── Module Metadata ──────────────────────────────────────────────────────────

export const CI_MODULES: CiModuleMeta[] = [
  {
    code: "CPI",
    label: "Career Positioning Intelligence",
    tagline: "Know exactly where you stand — and where you should be.",
    description: "Measures how clearly and compellingly you have defined your professional identity, value proposition, and market positioning.",
    journeyStage: "Discover",
    color: "#D4AF37",
    icon: "🎯",
  },
  {
    code: "CRS",
    label: "Career Resilience Intelligence",
    tagline: "Bounce forward, not just back.",
    description: "Assesses your capacity to navigate setbacks, adapt to disruption, and sustain momentum through career transitions and uncertainty.",
    journeyStage: "Discover",
    color: "#3B82F6",
    icon: "🛡️",
  },
  {
    code: "CMK",
    label: "Career Marketability Intelligence",
    tagline: "How visible and valuable are you to the market?",
    description: "Evaluates the strength of your professional brand, network capital, and external visibility to decision-makers and opportunities.",
    journeyStage: "Position",
    color: "#22C55E",
    icon: "📡",
  },
  {
    code: "CST",
    label: "Career Strategy Intelligence",
    tagline: "Are you playing the long game — or just reacting?",
    description: "Measures the clarity, intentionality, and execution discipline of your career strategy over a 3–5 year horizon.",
    journeyStage: "Prepare",
    color: "#F59E0B",
    icon: "🗺️",
  },
  {
    code: "CAO",
    label: "Career Optionality Intelligence",
    tagline: "How many doors are open to you right now?",
    description: "Assesses the breadth and depth of your career options — across roles, industries, geographies, and work models.",
    journeyStage: "Activate",
    color: "#8B5CF6",
    icon: "🔑",
  },
  {
    code: "AIR",
    label: "AI Readiness Intelligence",
    tagline: "Are you leading AI — or being replaced by it?",
    description: "Evaluates your readiness to work effectively alongside AI: your AI literacy, workflow integration, and strategic positioning in an AI-augmented world.",
    journeyStage: "Activate",
    color: "#EC4899",
    icon: "🤖",
  },
];

// ─── CPI: Career Positioning Intelligence ─────────────────────────────────────
// Mega-prompt specification: 6 dimensions × 5 questions = 30 questions
// Scoring: 0–100, 5 bands, 7 archetypes

export const CPI_DIMENSIONS: CiDimension[] = [
  {
    id: "executive_value_proposition",
    moduleCode: "CPI",
    label: "Executive Value Proposition",
    description: "Measures whether you can clearly explain the unique value you create — your clarity, differentiation, commercial impact, business contribution, and executive maturity.",
    weight: 0.20,
  },
  {
    id: "executive_narrative",
    moduleCode: "CPI",
    label: "Executive Narrative",
    description: "Measures how well you tell the story of your career — coherence, progression, achievement framing, influence stories, and memorable communication.",
    weight: 0.18,
  },
  {
    id: "professional_credibility",
    moduleCode: "CPI",
    label: "Professional Credibility",
    description: "Measures whether others immediately perceive executive capability — through expertise, judgement, confidence, trust, and consistency.",
    weight: 0.18,
  },
  {
    id: "market_visibility",
    moduleCode: "CPI",
    label: "Market Visibility",
    description: "Measures how visible you are in your target market — LinkedIn presence, networking, referrals, thought leadership, and internal visibility.",
    weight: 0.18,
  },
  {
    id: "differentiation",
    moduleCode: "CPI",
    label: "Differentiation",
    description: "Measures whether you stand out — through specialist expertise, unique experience, innovation, versatility, and executive brand.",
    weight: 0.14,
  },
  {
    id: "future_positioning",
    moduleCode: "CPI",
    label: "Future Positioning",
    description: "Measures preparation for the next role rather than success in the current one — future skills, AI readiness, business breadth, strategic thinking, and continuous reinvention.",
    weight: 0.12,
  },
];

export const CPI_QUESTIONS: CiQuestion[] = [
  // Dimension 1: Executive Value Proposition (5 questions)
  { id: "cpi_evp_1", dimensionId: "executive_value_proposition", moduleCode: "CPI", text: "In the last six months, I have articulated my professional value proposition clearly to at least one senior decision-maker." },
  { id: "cpi_evp_2", dimensionId: "executive_value_proposition", moduleCode: "CPI", text: "I can name the specific business problem I solve better than most people at my level." },
  { id: "cpi_evp_3", dimensionId: "executive_value_proposition", moduleCode: "CPI", text: "When asked 'why should we choose you?', I respond with evidence-backed specificity rather than general statements." },
  { id: "cpi_evp_4", dimensionId: "executive_value_proposition", moduleCode: "CPI", text: "I find it difficult to explain what makes me commercially different from other strong candidates at my level.", reverseScored: true },
  { id: "cpi_evp_5", dimensionId: "executive_value_proposition", moduleCode: "CPI", text: "In the last six months, I have updated my value proposition to reflect new outcomes I have delivered." },
  // Dimension 2: Executive Narrative (5 questions)
  { id: "cpi_en_1", dimensionId: "executive_narrative", moduleCode: "CPI", text: "My career story has a clear, logical thread — each role builds on the last in a way that makes sense to others." },
  { id: "cpi_en_2", dimensionId: "executive_narrative", moduleCode: "CPI", text: "In the last six months, I have told my career story in a way that visibly engaged a senior audience." },
  { id: "cpi_en_3", dimensionId: "executive_narrative", moduleCode: "CPI", text: "I struggle to explain certain career transitions or gaps in a way that strengthens rather than weakens my story.", reverseScored: true },
  { id: "cpi_en_4", dimensionId: "executive_narrative", moduleCode: "CPI", text: "My LinkedIn profile, CV, and verbal introduction tell a consistent, coherent story about who I am and where I am going." },
  { id: "cpi_en_5", dimensionId: "executive_narrative", moduleCode: "CPI", text: "I frame my career achievements in terms of business impact and outcomes, not just activities and responsibilities." },
  // Dimension 3: Professional Credibility (5 questions)
  { id: "cpi_pc_1", dimensionId: "professional_credibility", moduleCode: "CPI", text: "Senior leaders and peers consistently seek my input on important decisions in my domain." },
  { id: "cpi_pc_2", dimensionId: "professional_credibility", moduleCode: "CPI", text: "In the last six months, I have been introduced or referred to someone based on my professional reputation." },
  { id: "cpi_pc_3", dimensionId: "professional_credibility", moduleCode: "CPI", text: "I sometimes feel that my expertise is not fully recognised by the people who matter most to my career.", reverseScored: true },
  { id: "cpi_pc_4", dimensionId: "professional_credibility", moduleCode: "CPI", text: "I demonstrate consistent judgement and follow-through, which has built trust with key stakeholders." },
  { id: "cpi_pc_5", dimensionId: "professional_credibility", moduleCode: "CPI", text: "My professional reputation is consistent — people who know me in different contexts describe me in similar terms." },
  // Dimension 4: Market Visibility (5 questions)
  { id: "cpi_mv_1", dimensionId: "market_visibility", moduleCode: "CPI", text: "In the last six months, I have been approached by a recruiter, headhunter, or external opportunity without actively applying." },
  { id: "cpi_mv_2", dimensionId: "market_visibility", moduleCode: "CPI", text: "My LinkedIn profile accurately reflects my current level, expertise, and career ambitions." },
  { id: "cpi_mv_3", dimensionId: "market_visibility", moduleCode: "CPI", text: "I am largely invisible to decision-makers and talent networks outside my current organisation.", reverseScored: true },
  { id: "cpi_mv_4", dimensionId: "market_visibility", moduleCode: "CPI", text: "In the last six months, I have shared a perspective, insight, or piece of content that reached people beyond my immediate team." },
  { id: "cpi_mv_5", dimensionId: "market_visibility", moduleCode: "CPI", text: "I have a deliberate strategy for building and maintaining visibility with people who influence career opportunities in my field." },
  // Dimension 5: Differentiation (5 questions)
  { id: "cpi_df_1", dimensionId: "differentiation", moduleCode: "CPI", text: "I can name two or three things that genuinely differentiate me from others with similar experience and title." },
  { id: "cpi_df_2", dimensionId: "differentiation", moduleCode: "CPI", text: "In the last six months, someone has described me in a way that captured what makes me distinctive." },
  { id: "cpi_df_3", dimensionId: "differentiation", moduleCode: "CPI", text: "I blend in with peers at my level rather than standing out in a memorable way.", reverseScored: true },
  { id: "cpi_df_4", dimensionId: "differentiation", moduleCode: "CPI", text: "I have a deliberate executive brand — a consistent set of qualities and values I am known for across contexts." },
  { id: "cpi_df_5", dimensionId: "differentiation", moduleCode: "CPI", text: "My unique combination of experience, expertise, and perspective is difficult to replicate." },
  // Dimension 6: Future Positioning (5 questions)
  { id: "cpi_fp_1", dimensionId: "future_positioning", moduleCode: "CPI", text: "In the last six months, I have deliberately developed a skill or perspective that prepares me for my next role, not just my current one." },
  { id: "cpi_fp_2", dimensionId: "future_positioning", moduleCode: "CPI", text: "I have a clear picture of the role or level I am positioning myself for in the next 18–36 months." },
  { id: "cpi_fp_3", dimensionId: "future_positioning", moduleCode: "CPI", text: "I am primarily focused on performing well in my current role rather than positioning for the next one.", reverseScored: true },
  { id: "cpi_fp_4", dimensionId: "future_positioning", moduleCode: "CPI", text: "I understand how AI and emerging technologies are reshaping my function, and I am actively building relevant capabilities." },
  { id: "cpi_fp_5", dimensionId: "future_positioning", moduleCode: "CPI", text: "I regularly seek exposure to business areas, industries, or perspectives outside my current domain to broaden my strategic relevance." },
];

export const CPI_ZONES: CiZone[] = [
  {
    id: "immediate_repositioning",
    label: "Immediate Repositioning Needed",
    range: [0, 59],
    color: "#EF4444",
    description: "Your positioning is unclear, inconsistent, or invisible to the market.",
    implication: "You are likely being overlooked for opportunities that match your actual capability. Immediate, focused work on your value proposition, narrative, and visibility is needed before the gap widens further.",
  },
  {
    id: "career_drift",
    label: "Career Drift Emerging",
    range: [60, 69],
    color: "#F59E0B",
    description: "You have some positioning elements in place, but they lack sharpness, consistency, or market reach.",
    implication: "You are visible but not memorable. Without deliberate action, your career trajectory will plateau. Sharpening your differentiation and narrative will significantly improve how decision-makers perceive you.",
  },
  {
    id: "solid_underleveraged",
    label: "Solid but Underleveraged",
    range: [70, 79],
    color: "#3B82F6",
    description: "You have a reasonably clear professional identity and can articulate your value, but you are not fully capitalising on it.",
    implication: "You are competitive. Focused work on differentiation, market visibility, and future positioning will move you from good to exceptional — and unlock opportunities you are currently not being considered for.",
  },
  {
    id: "strong_market_position",
    label: "Strong Market Position",
    range: [80, 89],
    color: "#22C55E",
    description: "You have a strong, differentiated positioning that resonates with your target market.",
    implication: "You are well-positioned and attracting the right attention. Your focus should be on amplifying your visibility, deepening your future positioning, and ensuring your brand evolves ahead of market shifts.",
  },
  {
    id: "exceptional_positioning",
    label: "Exceptional Executive Positioning",
    range: [90, 100],
    color: "#D4AF37",
    description: "Your positioning is exceptional — clear, differentiated, market-validated, and future-ready.",
    implication: "You attract opportunities rather than chasing them. Your work is to maintain this edge, continue reinventing ahead of the market, and leverage your positioning to create strategic optionality.",
  },
];

export const CPI_ARCHETYPES: CiArchetype[] = [
  {
    id: "the_hidden_expert",
    moduleCode: "CPI",
    label: "The Hidden Expert",
    description: "You possess deep expertise and deliver exceptional results, but your value is largely invisible outside your immediate circle. Decision-makers who could accelerate your career simply do not know you exist. Your positioning gap is not capability — it is visibility and narrative.",
    strengths: ["Deep technical or functional credibility", "Strong delivery track record", "Trusted by those who work with you directly"],
    risks: ["Overlooked for promotions and stretch roles", "Dependent on internal sponsors who may leave", "Vulnerable in restructuring or market downturns"],
    icon: "🔍",
  },
  {
    id: "the_reliable_operator",
    moduleCode: "CPI",
    label: "The Reliable Operator",
    description: "You are known for getting things done consistently and reliably. Leaders trust you to execute. However, your positioning is defined by dependability rather than strategic impact — which limits how high you can go. You are seen as essential but not yet executive.",
    strengths: ["High trust with current leadership", "Strong execution reputation", "Consistent and dependable"],
    risks: ["Positioned as a doer, not a strategist", "Passed over for senior roles requiring vision", "Narrative focused on activities rather than outcomes"],
    icon: "⚙️",
  },
  {
    id: "the_trusted_leader",
    moduleCode: "CPI",
    label: "The Trusted Leader",
    description: "You have built genuine credibility and trust with senior stakeholders. People follow you and advocate for you. Your positioning is strong internally, but you may not yet have the external visibility or future-readiness that would make you magnetic to the broader market.",
    strengths: ["Strong internal brand and sponsorship", "Credible leadership presence", "Respected across functions"],
    risks: ["Limited external market visibility", "May be seen as organisation-specific rather than portable", "Future positioning may lag behind current performance"],
    icon: "🤝",
  },
  {
    id: "the_emerging_executive",
    moduleCode: "CPI",
    label: "The Emerging Executive",
    description: "You are on the right trajectory and showing the early signals of executive presence — but your positioning is still developing. Your narrative is not yet fully formed, your differentiation is not sharp enough, and your market visibility is limited. You have the raw material; now you need the architecture.",
    strengths: ["Strong growth trajectory", "High potential recognised internally", "Hungry to develop and improve"],
    risks: ["Narrative lacks executive maturity", "Differentiation not yet clear or memorable", "May be outpaced by peers with stronger positioning"],
    icon: "🌱",
  },
  {
    id: "the_strategic_builder",
    moduleCode: "CPI",
    label: "The Strategic Builder",
    description: "You are known for creating things — teams, functions, capabilities, or markets. Your narrative is built around growth and transformation. You attract organisations that need to build something new, and your positioning is strongest in contexts of change and ambiguity.",
    strengths: ["Compelling 0-to-1 narrative", "Highly valued in growth and transformation contexts", "Strong differentiation through unique build experience"],
    risks: ["Less competitive in steady-state or optimisation roles", "Needs to demonstrate scale and sustainability", "May be perceived as restless or unable to maintain"],
    icon: "🏗️",
  },
  {
    id: "the_industry_influencer",
    moduleCode: "CPI",
    label: "The Industry Influencer",
    description: "You have built a visible presence beyond your organisation. You are known in your industry, your perspective is sought, and your name opens doors. Your positioning is proactive rather than reactive — you shape how the market perceives your domain, not just yourself.",
    strengths: ["Strong external brand and thought leadership", "Attracts inbound opportunities", "High referral and recommendation rate"],
    risks: ["Must continuously produce valuable perspectives to maintain relevance", "Risk of brand becoming broader than depth", "Needs to ensure internal credibility matches external profile"],
    icon: "📡",
  },
  {
    id: "the_transformational_executive",
    moduleCode: "CPI",
    label: "The Transformational Executive",
    description: "You are operating at the highest level of career positioning. Your value proposition is clear, your narrative is compelling, your credibility is established, your visibility is strategic, and you are actively preparing for the next stage of your career. You attract opportunities; you do not chase them.",
    strengths: ["Exceptional clarity of value and differentiation", "Strong market visibility and inbound opportunities", "Future-ready and continuously reinventing"],
    risks: ["Must guard against complacency", "Positioning requires ongoing maintenance as markets shift", "Risk of over-commitment to current identity as the market evolves"],
    icon: "🚀",
  },
];

// ─── CRS: Career Resilience Intelligence ──────────────────────────────────────

export const CRS_DIMENSIONS: CiDimension[] = [
  { id: "adversity_response", moduleCode: "CRS", label: "Adversity Response", description: "How you respond to career setbacks, failures, and unexpected disruptions", weight: 0.25 },
  { id: "adaptability", moduleCode: "CRS", label: "Adaptability & Flexibility", description: "Your ability to adjust your plans, skills, and approach as circumstances change", weight: 0.20 },
  { id: "emotional_regulation", moduleCode: "CRS", label: "Emotional Regulation Under Pressure", description: "Your capacity to manage anxiety, uncertainty, and career stress without derailing", weight: 0.20 },
  { id: "recovery_speed", moduleCode: "CRS", label: "Recovery Speed", description: "How quickly you regain momentum and forward motion after a career disruption", weight: 0.20 },
  { id: "future_orientation", moduleCode: "CRS", label: "Future Orientation", description: "Your ability to maintain a long-term perspective and stay focused on what is ahead", weight: 0.15 },
];

export const CRS_QUESTIONS: CiQuestion[] = [
  // Adversity Response (6 questions)
  { id: "crs_ar_1", dimensionId: "adversity_response", moduleCode: "CRS", text: "When I face a significant career setback, I look for the learning before looking for someone to blame." },
  { id: "crs_ar_2", dimensionId: "adversity_response", moduleCode: "CRS", text: "I have turned at least one major career disappointment into a meaningful advantage." },
  { id: "crs_ar_3", dimensionId: "adversity_response", moduleCode: "CRS", text: "Career setbacks tend to derail me for longer than they should.", reverseScored: true },
  { id: "crs_ar_4", dimensionId: "adversity_response", moduleCode: "CRS", text: "I approach career challenges with curiosity rather than fear." },
  { id: "crs_ar_5", dimensionId: "adversity_response", moduleCode: "CRS", text: "I have a clear framework for how I process and respond to professional failure." },
  { id: "crs_ar_6", dimensionId: "adversity_response", moduleCode: "CRS", text: "I tend to catastrophise when things go wrong in my career.", reverseScored: true },
  // Adaptability (5 questions)
  { id: "crs_ad_1", dimensionId: "adaptability", moduleCode: "CRS", text: "I am comfortable changing direction when new information suggests my original plan was wrong." },
  { id: "crs_ad_2", dimensionId: "adaptability", moduleCode: "CRS", text: "I actively build new skills before they become urgently needed." },
  { id: "crs_ad_3", dimensionId: "adaptability", moduleCode: "CRS", text: "I find it difficult to let go of career plans even when circumstances have changed.", reverseScored: true },
  { id: "crs_ad_4", dimensionId: "adaptability", moduleCode: "CRS", text: "I have successfully made at least one significant career pivot that required learning entirely new skills." },
  { id: "crs_ad_5", dimensionId: "adaptability", moduleCode: "CRS", text: "I treat career disruption as an opportunity to explore options I might not have considered otherwise." },
  // Emotional Regulation (5 questions)
  { id: "crs_er_1", dimensionId: "emotional_regulation", moduleCode: "CRS", text: "I can remain calm and strategic during periods of career uncertainty." },
  { id: "crs_er_2", dimensionId: "emotional_regulation", moduleCode: "CRS", text: "Career anxiety rarely prevents me from taking the actions I know I need to take." },
  { id: "crs_er_3", dimensionId: "emotional_regulation", moduleCode: "CRS", text: "I have healthy routines that help me manage the emotional weight of career transitions." },
  { id: "crs_er_4", dimensionId: "emotional_regulation", moduleCode: "CRS", text: "I often let fear of failure stop me from pursuing career opportunities.", reverseScored: true },
  { id: "crs_er_5", dimensionId: "emotional_regulation", moduleCode: "CRS", text: "I can separate my professional identity from my current role or title." },
  // Recovery Speed (5 questions)
  { id: "crs_rs_1", dimensionId: "recovery_speed", moduleCode: "CRS", text: "After a career disappointment, I am back in action within days rather than weeks." },
  { id: "crs_rs_2", dimensionId: "recovery_speed", moduleCode: "CRS", text: "I have a clear support system that helps me recover quickly from professional setbacks." },
  { id: "crs_rs_3", dimensionId: "recovery_speed", moduleCode: "CRS", text: "I tend to dwell on career failures longer than is productive.", reverseScored: true },
  { id: "crs_rs_4", dimensionId: "recovery_speed", moduleCode: "CRS", text: "I know exactly what actions help me rebuild momentum after a setback." },
  { id: "crs_rs_5", dimensionId: "recovery_speed", moduleCode: "CRS", text: "I have bounced back from at least one career disruption stronger than I was before." },
  // Future Orientation (4 questions)
  { id: "crs_fo_1", dimensionId: "future_orientation", moduleCode: "CRS", text: "Even during difficult career periods, I maintain a clear vision of where I am heading." },
  { id: "crs_fo_2", dimensionId: "future_orientation", moduleCode: "CRS", text: "I spend more energy on what I can control than on what I cannot." },
  { id: "crs_fo_3", dimensionId: "future_orientation", moduleCode: "CRS", text: "I get stuck ruminating on past career decisions rather than focusing on what is next.", reverseScored: true },
  { id: "crs_fo_4", dimensionId: "future_orientation", moduleCode: "CRS", text: "I regularly remind myself of the long-term trajectory I am on, even when short-term progress is slow." },
];

export const CRS_ZONES: CiZone[] = [
  { id: "fragile", label: "Fragile", range: [0, 39], color: "#EF4444", description: "Career disruptions significantly derail your progress and wellbeing.", implication: "Building resilience foundations — emotional regulation, support systems, and recovery practices — is your most urgent career investment." },
  { id: "developing", label: "Developing", range: [40, 59], color: "#F59E0B", description: "You have some resilience but it is inconsistent under sustained pressure.", implication: "You recover eventually but lose significant time and momentum. Targeted work on your adversity response and recovery speed will compound over time." },
  { id: "steady", label: "Steady", range: [60, 74], color: "#3B82F6", description: "You handle most career disruptions with reasonable composure and recover within a reasonable timeframe.", implication: "You are resilient enough to navigate most challenges. Developing greater adaptability and future orientation will unlock the next level." },
  { id: "resilient", label: "Resilient", range: [75, 89], color: "#22C55E", description: "You navigate career disruptions with confidence and recover quickly.", implication: "You are a model of career resilience. Your focus should be on helping others build similar capacity and ensuring your resilience extends to larger-scale disruptions." },
  { id: "antifragile", label: "Antifragile", range: [90, 100], color: "#D4AF37", description: "You do not just survive disruption — you grow stronger because of it.", implication: "You are in a rare category. Career disruptions are growth accelerators for you. Your challenge is to channel this capacity strategically rather than seeking disruption for its own sake." },
];

export const CRS_ARCHETYPES: CiArchetype[] = [
  { id: "the_phoenix", moduleCode: "CRS", label: "The Phoenix", description: "You rise from setbacks with renewed energy and clarity. Disruption is your growth engine.", strengths: ["Rapid recovery", "Growth mindset", "Inspiring to others in difficulty"], risks: ["May underestimate the emotional cost of disruption", "Can appear dismissive of others' struggles", "Needs to build recovery systems not just rely on willpower"], icon: "🔥" },
  { id: "the_navigator", moduleCode: "CRS", label: "The Navigator", description: "You maintain strategic clarity even in turbulent conditions. You adapt the route without losing sight of the destination.", strengths: ["Calm under pressure", "Strategic adaptability", "Long-term perspective"], risks: ["May suppress emotions rather than process them", "Can appear detached", "Needs to acknowledge uncertainty openly"], icon: "🧭" },
  { id: "the_learner", moduleCode: "CRS", label: "The Learner", description: "You extract insight from every setback and use it to build new capability.", strengths: ["Continuous improvement mindset", "Strong self-awareness", "Builds transferable skills"], risks: ["May over-analyse before acting", "Can get stuck in reflection mode", "Needs to balance learning with momentum"], icon: "📚" },
  { id: "the_survivor", moduleCode: "CRS", label: "The Survivor", description: "You endure career challenges through determination and persistence, even when the path is hard.", strengths: ["High tolerance for difficulty", "Persistence", "Reliable under sustained pressure"], risks: ["Resilience is reactive rather than proactive", "May not build forward-looking strategies", "Risk of burnout without recovery practices"], icon: "⚓" },
  { id: "the_rebuilder", moduleCode: "CRS", label: "The Rebuilder", description: "You are at your best when rebuilding from a disrupted state — creating new structures and paths.", strengths: ["Strong in transition contexts", "Creative problem-solver", "Comfortable with ambiguity"], risks: ["May struggle in stable environments", "Needs disruption to feel engaged", "Recovery can be slow before momentum builds"], icon: "🔧" },
];

// ─── CMK: Career Marketability Intelligence ────────────────────────────────────

export const CMK_DIMENSIONS: CiDimension[] = [
  { id: "professional_brand", moduleCode: "CMK", label: "Professional Brand Strength", description: "The clarity, consistency, and impact of your professional brand across channels", weight: 0.25 },
  { id: "network_capital", moduleCode: "CMK", label: "Network Capital", description: "The depth, breadth, and quality of your professional network and its ability to generate opportunities", weight: 0.25 },
  { id: "digital_presence", moduleCode: "CMK", label: "Digital Presence & Visibility", description: "Your visibility and credibility in digital professional spaces, particularly LinkedIn", weight: 0.20 },
  { id: "thought_leadership", moduleCode: "CMK", label: "Thought Leadership", description: "Your ability to contribute ideas, insights, and perspectives that are valued by your professional community", weight: 0.15 },
  { id: "market_intelligence", moduleCode: "CMK", label: "Market Intelligence", description: "How well you understand the market for your skills, including demand signals, salary benchmarks, and emerging opportunities", weight: 0.15 },
];

export const CMK_QUESTIONS: CiQuestion[] = [
  // Professional Brand (6 questions)
  { id: "cmk_pb_1", dimensionId: "professional_brand", moduleCode: "CMK", text: "People in my professional network can clearly articulate what I am known for." },
  { id: "cmk_pb_2", dimensionId: "professional_brand", moduleCode: "CMK", text: "My professional brand is consistent across my CV, LinkedIn, and in-person introductions." },
  { id: "cmk_pb_3", dimensionId: "professional_brand", moduleCode: "CMK", text: "I actively manage how I am perceived in my professional community." },
  { id: "cmk_pb_4", dimensionId: "professional_brand", moduleCode: "CMK", text: "I am often the first person that comes to mind when opportunities in my area arise." },
  { id: "cmk_pb_5", dimensionId: "professional_brand", moduleCode: "CMK", text: "My professional brand feels vague or undefined even to me.", reverseScored: true },
  { id: "cmk_pb_6", dimensionId: "professional_brand", moduleCode: "CMK", text: "I receive unsolicited approaches from recruiters or organisations for roles that match my profile." },
  // Network Capital (6 questions)
  { id: "cmk_nc_1", dimensionId: "network_capital", moduleCode: "CMK", text: "I have strong relationships with senior leaders who can open doors for me." },
  { id: "cmk_nc_2", dimensionId: "network_capital", moduleCode: "CMK", text: "I invest time in building relationships before I need them." },
  { id: "cmk_nc_3", dimensionId: "network_capital", moduleCode: "CMK", text: "My network spans multiple industries and functions, not just my current employer." },
  { id: "cmk_nc_4", dimensionId: "network_capital", moduleCode: "CMK", text: "I find networking uncomfortable and avoid it when possible.", reverseScored: true },
  { id: "cmk_nc_5", dimensionId: "network_capital", moduleCode: "CMK", text: "I have a clear strategy for who I want to add to my network and why." },
  { id: "cmk_nc_6", dimensionId: "network_capital", moduleCode: "CMK", text: "People in my network actively refer opportunities, introductions, and information to me." },
  // Digital Presence (5 questions)
  { id: "cmk_dp_1", dimensionId: "digital_presence", moduleCode: "CMK", text: "My LinkedIn profile clearly communicates my value proposition and is optimised for my target market." },
  { id: "cmk_dp_2", dimensionId: "digital_presence", moduleCode: "CMK", text: "I am active on LinkedIn in a way that builds my professional credibility." },
  { id: "cmk_dp_3", dimensionId: "digital_presence", moduleCode: "CMK", text: "My digital presence is weak or outdated.", reverseScored: true },
  { id: "cmk_dp_4", dimensionId: "digital_presence", moduleCode: "CMK", text: "I have received positive feedback or opportunities as a direct result of my LinkedIn activity." },
  { id: "cmk_dp_5", dimensionId: "digital_presence", moduleCode: "CMK", text: "A recruiter searching for someone with my profile would find me easily." },
  // Thought Leadership (4 questions)
  { id: "cmk_tl_1", dimensionId: "thought_leadership", moduleCode: "CMK", text: "I regularly share insights, perspectives, or ideas that others in my field find valuable." },
  { id: "cmk_tl_2", dimensionId: "thought_leadership", moduleCode: "CMK", text: "I have been invited to speak, write, or contribute expertise in a professional forum." },
  { id: "cmk_tl_3", dimensionId: "thought_leadership", moduleCode: "CMK", text: "I do not share my professional perspectives publicly because I am not sure they are valuable enough.", reverseScored: true },
  { id: "cmk_tl_4", dimensionId: "thought_leadership", moduleCode: "CMK", text: "I am building a reputation as someone who has a distinctive point of view in my domain." },
  // Market Intelligence (4 questions)
  { id: "cmk_mi_1", dimensionId: "market_intelligence", moduleCode: "CMK", text: "I know what my skills are worth in the current market and whether I am being paid fairly." },
  { id: "cmk_mi_2", dimensionId: "market_intelligence", moduleCode: "CMK", text: "I track trends in my industry and understand which skills are increasing or decreasing in demand." },
  { id: "cmk_mi_3", dimensionId: "market_intelligence", moduleCode: "CMK", text: "I am out of touch with what the market currently values in professionals at my level.", reverseScored: true },
  { id: "cmk_mi_4", dimensionId: "market_intelligence", moduleCode: "CMK", text: "I know which organisations are growing in my space and would value my profile." },
];

export const CMK_ZONES: CiZone[] = [
  { id: "invisible", label: "Invisible", range: [0, 39], color: "#EF4444", description: "You are largely unknown outside your immediate organisation.", implication: "Opportunities are passing you by because the market does not know you exist. Building your brand and network is your highest-leverage career investment right now." },
  { id: "local", label: "Locally Known", range: [40, 59], color: "#F59E0B", description: "You are known within your organisation but have limited external visibility.", implication: "You are dependent on your current employer for opportunities. Expanding your external profile will significantly increase your career optionality." },
  { id: "visible", label: "Visible", range: [60, 74], color: "#3B82F6", description: "You have a reasonable external profile and a functional professional network.", implication: "You are on the radar. Sharpening your brand and deepening your network relationships will move you from visible to sought-after." },
  { id: "sought_after", label: "Sought After", range: [75, 89], color: "#22C55E", description: "The market knows who you are and you receive inbound opportunities.", implication: "You have strong marketability. Your focus should be on selectivity — choosing the right opportunities rather than pursuing all of them." },
  { id: "magnetic", label: "Magnetic", range: [90, 100], color: "#D4AF37", description: "You attract exceptional opportunities without actively searching.", implication: "You are in the top tier of professional marketability. Your challenge is to maintain this position as the market evolves and to use your platform to lift others." },
];

export const CMK_ARCHETYPES: CiArchetype[] = [
  { id: "the_influencer", moduleCode: "CMK", label: "The Influencer", description: "Your professional brand generates inbound attention. People seek you out.", strengths: ["High visibility", "Strong thought leadership", "Attracts premium opportunities"], risks: ["Brand maintenance requires ongoing effort", "Can create unrealistic expectations", "Needs substance behind the visibility"], icon: "📢" },
  { id: "the_networker", moduleCode: "CMK", label: "The Networker", description: "Your network is your most powerful career asset. You open doors through relationships.", strengths: ["Access to hidden opportunities", "Strong referral pipeline", "Trusted by senior leaders"], risks: ["Network can atrophy without maintenance", "May rely too heavily on relationships over skills", "Needs to ensure network is diverse not just deep"], icon: "🕸️" },
  { id: "the_expert", moduleCode: "CMK", label: "The Expert", description: "Your marketability comes from deep, recognised expertise in a specific domain.", strengths: ["High credibility", "Premium positioning", "Sought for specialist roles"], risks: ["Narrow opportunity set", "Vulnerable to domain disruption", "Needs to translate expertise into broader value"], icon: "🔬" },
  { id: "the_insider", moduleCode: "CMK", label: "The Insider", description: "You are well-known within your organisation but have limited external visibility.", strengths: ["Strong internal reputation", "Trusted by current leadership", "Stable in current context"], risks: ["Highly dependent on current employer", "Vulnerable to organisational change", "Low external optionality"], icon: "🏢" },
  { id: "the_emerging_voice", moduleCode: "CMK", label: "The Emerging Voice", description: "You are building your external profile and beginning to gain recognition.", strengths: ["Growing momentum", "Fresh perspective", "Increasing visibility"], risks: ["Not yet well-known enough to attract premium opportunities", "Needs consistent investment in brand building", "Risk of inconsistency"], icon: "🌱" },
];

// ─── CST: Career Strategy Intelligence ────────────────────────────────────────

export const CST_DIMENSIONS: CiDimension[] = [
  { id: "strategic_clarity", moduleCode: "CST", label: "Strategic Career Clarity", description: "The clarity and specificity of your 3–5 year career vision and goals", weight: 0.25 },
  { id: "planning_discipline", moduleCode: "CST", label: "Planning & Execution Discipline", description: "Your ability to translate career goals into concrete plans and execute them consistently", weight: 0.25 },
  { id: "opportunity_sensing", moduleCode: "CST", label: "Opportunity Sensing", description: "Your ability to identify, evaluate, and pursue the right career opportunities at the right time", weight: 0.20 },
  { id: "stakeholder_strategy", moduleCode: "CST", label: "Stakeholder Strategy", description: "How deliberately you manage relationships with sponsors, mentors, and key decision-makers", weight: 0.15 },
  { id: "risk_management", moduleCode: "CST", label: "Career Risk Management", description: "Your ability to identify and manage the risks that could derail your career trajectory", weight: 0.15 },
];

export const CST_QUESTIONS: CiQuestion[] = [
  // Strategic Clarity (6 questions)
  { id: "cst_sc_1", dimensionId: "strategic_clarity", moduleCode: "CST", text: "I have a clear picture of where I want to be professionally in 3–5 years." },
  { id: "cst_sc_2", dimensionId: "strategic_clarity", moduleCode: "CST", text: "My career goals are specific enough that I would know if I was on track or off track." },
  { id: "cst_sc_3", dimensionId: "strategic_clarity", moduleCode: "CST", text: "I have articulated my career vision to at least one trusted advisor who can hold me accountable." },
  { id: "cst_sc_4", dimensionId: "strategic_clarity", moduleCode: "CST", text: "I am unclear about what I want from my career beyond the next 12 months.", reverseScored: true },
  { id: "cst_sc_5", dimensionId: "strategic_clarity", moduleCode: "CST", text: "My career decisions are guided by a consistent long-term strategy rather than short-term opportunities." },
  { id: "cst_sc_6", dimensionId: "strategic_clarity", moduleCode: "CST", text: "I can explain how my current role serves my 5-year career strategy." },
  // Planning & Execution (6 questions)
  { id: "cst_pe_1", dimensionId: "planning_discipline", moduleCode: "CST", text: "I have a written career development plan that I review regularly." },
  { id: "cst_pe_2", dimensionId: "planning_discipline", moduleCode: "CST", text: "I consistently take the actions I have committed to for my career development." },
  { id: "cst_pe_3", dimensionId: "planning_discipline", moduleCode: "CST", text: "I set aside dedicated time each month to work on my career strategy." },
  { id: "cst_pe_4", dimensionId: "planning_discipline", moduleCode: "CST", text: "I often have good career intentions but fail to follow through on them.", reverseScored: true },
  { id: "cst_pe_5", dimensionId: "planning_discipline", moduleCode: "CST", text: "I track my progress against career milestones and adjust my plan when needed." },
  { id: "cst_pe_6", dimensionId: "planning_discipline", moduleCode: "CST", text: "I am disciplined about investing in my development even when work is busy." },
  // Opportunity Sensing (5 questions)
  { id: "cst_os_1", dimensionId: "opportunity_sensing", moduleCode: "CST", text: "I can quickly assess whether a career opportunity is aligned with my long-term strategy." },
  { id: "cst_os_2", dimensionId: "opportunity_sensing", moduleCode: "CST", text: "I have a clear framework for evaluating career opportunities beyond just title and compensation." },
  { id: "cst_os_3", dimensionId: "opportunity_sensing", moduleCode: "CST", text: "I often say yes to opportunities that feel good in the moment but do not advance my strategy.", reverseScored: true },
  { id: "cst_os_4", dimensionId: "opportunity_sensing", moduleCode: "CST", text: "I am good at identifying emerging opportunities before they become obvious to others." },
  { id: "cst_os_5", dimensionId: "opportunity_sensing", moduleCode: "CST", text: "I know when to pursue an opportunity aggressively and when to wait for a better one." },
  // Stakeholder Strategy (4 questions)
  { id: "cst_ss_1", dimensionId: "stakeholder_strategy", moduleCode: "CST", text: "I have at least one senior sponsor who actively advocates for my career advancement." },
  { id: "cst_ss_2", dimensionId: "stakeholder_strategy", moduleCode: "CST", text: "I am deliberate about which relationships I invest in for my career development." },
  { id: "cst_ss_3", dimensionId: "stakeholder_strategy", moduleCode: "CST", text: "I leave my career advancement largely to chance or to my manager's goodwill.", reverseScored: true },
  { id: "cst_ss_4", dimensionId: "stakeholder_strategy", moduleCode: "CST", text: "I regularly update key stakeholders on my goals and progress." },
  // Risk Management (4 questions)
  { id: "cst_rm_1", dimensionId: "risk_management", moduleCode: "CST", text: "I have identified the key risks that could derail my career trajectory." },
  { id: "cst_rm_2", dimensionId: "risk_management", moduleCode: "CST", text: "I take deliberate steps to reduce my career concentration risk (e.g. single employer, single skill set)." },
  { id: "cst_rm_3", dimensionId: "risk_management", moduleCode: "CST", text: "I rarely think about what could go wrong with my career until it actually does.", reverseScored: true },
  { id: "cst_rm_4", dimensionId: "risk_management", moduleCode: "CST", text: "I have a contingency plan for if my current role or organisation changes significantly." },
];

export const CST_ZONES: CiZone[] = [
  { id: "reactive", label: "Reactive", range: [0, 39], color: "#EF4444", description: "Your career is driven by circumstances rather than strategy.", implication: "You are at the mercy of external events. Building even a basic career strategy will immediately improve your trajectory and reduce career anxiety." },
  { id: "opportunistic", label: "Opportunistic", range: [40, 59], color: "#F59E0B", description: "You respond to good opportunities but lack a consistent strategic framework.", implication: "You are making progress but not as efficiently as you could. A clear 3-year strategy will help you say no to the wrong opportunities and yes to the right ones." },
  { id: "intentional", label: "Intentional", range: [60, 74], color: "#3B82F6", description: "You have a career strategy and generally follow it.", implication: "You are ahead of most professionals. Sharpening your execution discipline and stakeholder strategy will accelerate your progress significantly." },
  { id: "strategic", label: "Strategic", range: [75, 89], color: "#22C55E", description: "You operate with a clear, well-executed career strategy.", implication: "You are playing the long game effectively. Your focus should be on staying ahead of market shifts and ensuring your strategy evolves as you grow." },
  { id: "masterful", label: "Masterful", range: [90, 100], color: "#D4AF37", description: "Your career strategy is sophisticated, adaptive, and consistently executed.", implication: "You are in the top tier of career strategists. Your challenge is to ensure your strategy remains ambitious enough and that you are helping others develop similar capability." },
];

export const CST_ARCHETYPES: CiArchetype[] = [
  { id: "the_chess_player", moduleCode: "CST", label: "The Chess Player", description: "You think several moves ahead. Your career decisions are calculated, deliberate, and long-term.", strengths: ["Long-term thinking", "Excellent opportunity evaluation", "Rarely caught off-guard"], risks: ["Can over-plan and under-execute", "May miss spontaneous opportunities", "Needs to balance strategy with agility"], icon: "♟️" },
  { id: "the_opportunist", moduleCode: "CST", label: "The Opportunist", description: "You are excellent at spotting and seizing opportunities. Your career moves fast when conditions are right.", strengths: ["High adaptability", "Fast mover", "Comfortable with ambiguity"], risks: ["Lacks consistent strategic direction", "Can appear unfocused", "Needs to develop a longer-term framework"], icon: "🦅" },
  { id: "the_architect", moduleCode: "CST", label: "The Architect", description: "You design your career with precision — clear goals, structured plans, and disciplined execution.", strengths: ["Excellent planning and execution", "Clear milestones", "Reliable progress"], risks: ["Can be rigid when plans need to change", "May undervalue serendipity", "Needs to build in flexibility"], icon: "📐" },
  { id: "the_drifter", moduleCode: "CST", label: "The Drifter", description: "Your career has been shaped more by circumstance than intention. You are capable but under-directed.", strengths: ["Open to diverse experiences", "Adaptable", "Often has broad exposure"], risks: ["Lacks career momentum", "Vulnerable to being overlooked", "Needs to build strategic intentionality urgently"], icon: "🌊" },
  { id: "the_climber", moduleCode: "CST", label: "The Climber", description: "You are ambitious and driven, with a clear focus on advancement. Your career strategy is primarily vertical.", strengths: ["High ambition", "Clear progression goals", "Strong performance orientation"], risks: ["May sacrifice breadth for vertical speed", "Can neglect relationship capital", "Needs to balance climbing with building"], icon: "🧗" },
];

// ─── CAO: Career Optionality Intelligence ─────────────────────────────────────

export const CAO_DIMENSIONS: CiDimension[] = [
  { id: "role_breadth", moduleCode: "CAO", label: "Role & Function Breadth", description: "The range of roles and functions you are credibly qualified for beyond your current position", weight: 0.20 },
  { id: "industry_transferability", moduleCode: "CAO", label: "Industry Transferability", description: "How easily your skills and experience translate across different industries", weight: 0.20 },
  { id: "geographic_mobility", moduleCode: "CAO", label: "Geographic & Work Model Flexibility", description: "Your ability and willingness to work in different locations or work models", weight: 0.15 },
  { id: "financial_runway", moduleCode: "CAO", label: "Financial Runway", description: "The financial buffer that gives you the freedom to make deliberate career choices rather than urgent ones", weight: 0.25 },
  { id: "portfolio_readiness", moduleCode: "CAO", label: "Portfolio Career Readiness", description: "Your readiness to build a portfolio of income streams beyond a single employer", weight: 0.20 },
];

export const CAO_QUESTIONS: CiQuestion[] = [
  // Role Breadth (5 questions)
  { id: "cao_rb_1", dimensionId: "role_breadth", moduleCode: "CAO", text: "I can credibly apply for at least three different types of senior roles based on my current experience." },
  { id: "cao_rb_2", dimensionId: "role_breadth", moduleCode: "CAO", text: "I have experience across multiple functions that makes me competitive for cross-functional leadership roles." },
  { id: "cao_rb_3", dimensionId: "role_breadth", moduleCode: "CAO", text: "My career options feel narrow — I am only competitive for one type of role.", reverseScored: true },
  { id: "cao_rb_4", dimensionId: "role_breadth", moduleCode: "CAO", text: "I have deliberately built experiences that expand the range of roles I can credibly pursue." },
  { id: "cao_rb_5", dimensionId: "role_breadth", moduleCode: "CAO", text: "I regularly assess whether my current role is expanding or narrowing my future options." },
  // Industry Transferability (5 questions)
  { id: "cao_it_1", dimensionId: "industry_transferability", moduleCode: "CAO", text: "My skills and experience are valued across multiple industries, not just the one I am currently in." },
  { id: "cao_it_2", dimensionId: "industry_transferability", moduleCode: "CAO", text: "I can articulate how my expertise translates to a different industry context." },
  { id: "cao_it_3", dimensionId: "industry_transferability", moduleCode: "CAO", text: "I am deeply specialised in one industry and would struggle to move to another.", reverseScored: true },
  { id: "cao_it_4", dimensionId: "industry_transferability", moduleCode: "CAO", text: "I have successfully moved between industries at least once in my career." },
  { id: "cao_it_5", dimensionId: "industry_transferability", moduleCode: "CAO", text: "I actively follow trends in adjacent industries to identify transferable opportunities." },
  // Geographic Mobility (4 questions)
  { id: "cao_gm_1", dimensionId: "geographic_mobility", moduleCode: "CAO", text: "I am open to working in different geographies if the right opportunity arises." },
  { id: "cao_gm_2", dimensionId: "geographic_mobility", moduleCode: "CAO", text: "I am comfortable working in hybrid or fully remote models, which expands my opportunity set." },
  { id: "cao_gm_3", dimensionId: "geographic_mobility", moduleCode: "CAO", text: "Geographic constraints significantly limit my career options.", reverseScored: true },
  { id: "cao_gm_4", dimensionId: "geographic_mobility", moduleCode: "CAO", text: "I have a clear understanding of how my geographic preferences affect my career optionality." },
  // Financial Runway (6 questions)
  { id: "cao_fr_1", dimensionId: "financial_runway", moduleCode: "CAO", text: "I have sufficient financial reserves to make a deliberate career transition without urgency." },
  { id: "cao_fr_2", dimensionId: "financial_runway", moduleCode: "CAO", text: "Financial pressure does not force me to accept career opportunities that are not right for me." },
  { id: "cao_fr_3", dimensionId: "financial_runway", moduleCode: "CAO", text: "I have actively built financial buffers to give myself career freedom." },
  { id: "cao_fr_4", dimensionId: "financial_runway", moduleCode: "CAO", text: "I feel financially trapped in my current role and cannot afford to leave.", reverseScored: true },
  { id: "cao_fr_5", dimensionId: "financial_runway", moduleCode: "CAO", text: "I know exactly how many months of runway I have if I were to leave my current role today." },
  { id: "cao_fr_6", dimensionId: "financial_runway", moduleCode: "CAO", text: "I treat financial independence as a career strategy, not just a personal finance goal." },
  // Portfolio Readiness (5 questions)
  { id: "cao_pr_1", dimensionId: "portfolio_readiness", moduleCode: "CAO", text: "I have income streams or could develop them beyond my primary employment." },
  { id: "cao_pr_2", dimensionId: "portfolio_readiness", moduleCode: "CAO", text: "I have skills or expertise that I could monetise independently if needed." },
  { id: "cao_pr_3", dimensionId: "portfolio_readiness", moduleCode: "CAO", text: "The idea of building a portfolio career feels completely out of reach for me.", reverseScored: true },
  { id: "cao_pr_4", dimensionId: "portfolio_readiness", moduleCode: "CAO", text: "I have explored advisory, consulting, or board roles as part of my career portfolio." },
  { id: "cao_pr_5", dimensionId: "portfolio_readiness", moduleCode: "CAO", text: "I am actively building assets (IP, reputation, relationships) that could support a portfolio career." },
];

export const CAO_ZONES: CiZone[] = [
  { id: "constrained", label: "Constrained", range: [0, 39], color: "#EF4444", description: "Your career options are significantly limited by skills, geography, finances, or positioning.", implication: "You have low career freedom. Expanding your options is urgent — start with the dimension where you have the most leverage." },
  { id: "limited", label: "Limited", range: [40, 59], color: "#F59E0B", description: "You have some career options but they are narrower than they should be at your level.", implication: "You are not trapped but your options are fewer than your capability deserves. Deliberate work on transferability and financial runway will open new doors." },
  { id: "open", label: "Open", range: [60, 74], color: "#3B82F6", description: "You have a reasonable range of career options and some financial flexibility.", implication: "You are in a good position. Building portfolio readiness and deepening industry transferability will give you even greater freedom." },
  { id: "expansive", label: "Expansive", range: [75, 89], color: "#22C55E", description: "You have broad career options and the financial and professional freedom to be selective.", implication: "You have strong optionality. Your focus should be on choosing the right opportunities rather than accumulating more options." },
  { id: "sovereign", label: "Sovereign", range: [90, 100], color: "#D4AF37", description: "You have exceptional career freedom — multiple options, financial independence, and a portfolio of assets.", implication: "You have achieved career sovereignty. Your challenge is to use this freedom wisely and to help others build similar optionality." },
];

export const CAO_ARCHETYPES: CiArchetype[] = [
  { id: "the_free_agent", moduleCode: "CAO", label: "The Free Agent", description: "You have built the financial and professional freedom to choose your work on your own terms.", strengths: ["Maximum career freedom", "Strong negotiating position", "Can afford to wait for the right opportunity"], risks: ["Can become complacent", "May lose urgency and drive", "Needs to stay relevant in a changing market"], icon: "🦋" },
  { id: "the_portfolio_builder", moduleCode: "CAO", label: "The Portfolio Builder", description: "You are actively building multiple income streams and career assets beyond your primary role.", strengths: ["Diversified career risk", "Multiple income streams", "Building long-term independence"], risks: ["Can spread too thin", "Primary role may suffer", "Needs clear prioritisation"], icon: "🎨" },
  { id: "the_specialist_at_risk", moduleCode: "CAO", label: "The Specialist at Risk", description: "Your deep expertise is valuable but your options are narrow. You are vulnerable to disruption.", strengths: ["High value in current domain", "Strong expertise", "Premium positioning in niche"], risks: ["Low transferability", "Vulnerable to domain disruption", "Needs to urgently broaden options"], icon: "⚠️" },
  { id: "the_deliberate_mover", moduleCode: "CAO", label: "The Deliberate Mover", description: "You have built enough optionality to make career moves on your own timeline rather than out of necessity.", strengths: ["Strong negotiating position", "Not desperate for any single opportunity", "Can evaluate options carefully"], risks: ["May move too slowly", "Can miss time-sensitive opportunities", "Needs to maintain market momentum"], icon: "🎯" },
  { id: "the_trapped_performer", moduleCode: "CAO", label: "The Trapped Performer", description: "You are performing well but feel constrained — financially, geographically, or by a narrow skill set.", strengths: ["High performance in current role", "Valued by current employer", "Stable income"], risks: ["Low career freedom", "Vulnerable to organisational change", "Needs to build optionality urgently"], icon: "🔒" },
];

// ─── AIR: AI Readiness Intelligence ───────────────────────────────────────────

export const AIR_DIMENSIONS: CiDimension[] = [
  { id: "ai_literacy", moduleCode: "AIR", label: "AI Literacy & Understanding", description: "Your foundational understanding of how AI works, its capabilities, and its limitations", weight: 0.20 },
  { id: "ai_workflow", moduleCode: "AIR", label: "AI Workflow Integration", description: "How effectively you use AI tools to enhance your productivity and output quality", weight: 0.25 },
  { id: "ai_strategy", moduleCode: "AIR", label: "AI Strategic Positioning", description: "How deliberately you are positioning yourself in relation to AI — as a leader, not a laggard", weight: 0.20 },
  { id: "human_differentiation", moduleCode: "AIR", label: "Human Differentiation", description: "Your ability to identify and develop the distinctly human capabilities that AI cannot replicate", weight: 0.20 },
  { id: "ai_mindset", moduleCode: "AIR", label: "AI Mindset & Adaptability", description: "Your openness to AI-driven change and your ability to learn and adapt as AI evolves", weight: 0.15 },
];

export const AIR_QUESTIONS: CiQuestion[] = [
  // AI Literacy (5 questions)
  { id: "air_al_1", dimensionId: "ai_literacy", moduleCode: "AIR", text: "I can explain how large language models work at a conceptual level without needing to be technical." },
  { id: "air_al_2", dimensionId: "ai_literacy", moduleCode: "AIR", text: "I understand the difference between what AI can and cannot do reliably in a professional context." },
  { id: "air_al_3", dimensionId: "ai_literacy", moduleCode: "AIR", text: "I am confused by most AI-related discussions and feel left behind.", reverseScored: true },
  { id: "air_al_4", dimensionId: "ai_literacy", moduleCode: "AIR", text: "I follow developments in AI closely enough to understand their implications for my field." },
  { id: "air_al_5", dimensionId: "ai_literacy", moduleCode: "AIR", text: "I can have an informed conversation about AI strategy with senior leaders in my organisation." },
  // AI Workflow Integration (6 questions)
  { id: "air_aw_1", dimensionId: "ai_workflow", moduleCode: "AIR", text: "I use AI tools daily to enhance the quality or speed of my professional work." },
  { id: "air_aw_2", dimensionId: "ai_workflow", moduleCode: "AIR", text: "I have developed effective prompting skills that allow me to get high-quality outputs from AI tools." },
  { id: "air_aw_3", dimensionId: "ai_workflow", moduleCode: "AIR", text: "I have identified specific tasks in my role where AI can save me significant time." },
  { id: "air_aw_4", dimensionId: "ai_workflow", moduleCode: "AIR", text: "I rarely use AI tools in my day-to-day work.", reverseScored: true },
  { id: "air_aw_5", dimensionId: "ai_workflow", moduleCode: "AIR", text: "I have experimented with multiple AI tools and know which ones are most valuable for my work." },
  { id: "air_aw_6", dimensionId: "ai_workflow", moduleCode: "AIR", text: "I am more productive because of AI than I was 12 months ago." },
  // AI Strategic Positioning (5 questions)
  { id: "air_as_1", dimensionId: "ai_strategy", moduleCode: "AIR", text: "I have a clear view of how AI will affect my role and industry over the next 3–5 years." },
  { id: "air_as_2", dimensionId: "ai_strategy", moduleCode: "AIR", text: "I am deliberately building skills and positioning that will be valuable in an AI-augmented world." },
  { id: "air_as_3", dimensionId: "ai_strategy", moduleCode: "AIR", text: "I am worried that AI will make my current skills obsolete.", reverseScored: true },
  { id: "air_as_4", dimensionId: "ai_strategy", moduleCode: "AIR", text: "I see AI as an opportunity to amplify my impact rather than a threat to my career." },
  { id: "air_as_5", dimensionId: "ai_strategy", moduleCode: "AIR", text: "I am known in my organisation as someone who leads on AI adoption rather than follows." },
  // Human Differentiation (5 questions)
  { id: "air_hd_1", dimensionId: "human_differentiation", moduleCode: "AIR", text: "I have identified the specific human capabilities I bring that AI cannot replicate." },
  { id: "air_hd_2", dimensionId: "human_differentiation", moduleCode: "AIR", text: "I am actively developing skills like complex judgment, empathy, and creative synthesis that AI struggles with." },
  { id: "air_hd_3", dimensionId: "human_differentiation", moduleCode: "AIR", text: "I am unsure what my unique value is in a world where AI can do much of what I currently do.", reverseScored: true },
  { id: "air_hd_4", dimensionId: "human_differentiation", moduleCode: "AIR", text: "I invest in developing my distinctly human capabilities as deliberately as I invest in technical skills." },
  { id: "air_hd_5", dimensionId: "human_differentiation", moduleCode: "AIR", text: "I can articulate why a human — specifically me — is irreplaceable in my current role." },
  // AI Mindset (4 questions)
  { id: "air_am_1", dimensionId: "ai_mindset", moduleCode: "AIR", text: "I approach AI-driven change with curiosity and openness rather than anxiety." },
  { id: "air_am_2", dimensionId: "ai_mindset", moduleCode: "AIR", text: "I am comfortable experimenting with new AI tools even when I am not sure how to use them." },
  { id: "air_am_3", dimensionId: "ai_mindset", moduleCode: "AIR", text: "I feel threatened by how quickly AI is changing my field.", reverseScored: true },
  { id: "air_am_4", dimensionId: "ai_mindset", moduleCode: "AIR", text: "I believe that my ability to learn and adapt is more important than my current knowledge of AI." },
];

export const AIR_ZONES: CiZone[] = [
  { id: "at_risk", label: "At Risk", range: [0, 39], color: "#EF4444", description: "You are significantly behind the curve on AI readiness.", implication: "Your career is at risk of disruption. Immediate investment in AI literacy and workflow integration is not optional — it is urgent." },
  { id: "catching_up", label: "Catching Up", range: [40, 59], color: "#F59E0B", description: "You are aware of AI but have not yet integrated it meaningfully into your work or strategy.", implication: "You are behind where you need to be. Accelerating your AI workflow integration and strategic positioning in the next 6 months will be critical." },
  { id: "adapting", label: "Adapting", range: [60, 74], color: "#3B82F6", description: "You are using AI tools and beginning to think strategically about your positioning.", implication: "You are on the right track. Deepening your human differentiation strategy and AI strategic positioning will move you from adapting to leading." },
  { id: "leading", label: "Leading", range: [75, 89], color: "#22C55E", description: "You are ahead of most professionals in your AI readiness and are actively leveraging AI as an advantage.", implication: "You are well-positioned for an AI-augmented world. Your focus should be on staying ahead of the curve and helping your organisation build AI capability." },
  { id: "pioneering", label: "Pioneering", range: [90, 100], color: "#D4AF37", description: "You are at the frontier of AI readiness — using AI strategically, leading adoption, and clearly differentiated.", implication: "You are in the top tier of AI-ready professionals. Your challenge is to translate this advantage into tangible career and business outcomes." },
];

export const AIR_ARCHETYPES: CiArchetype[] = [
  { id: "the_ai_leader", moduleCode: "AIR", label: "The AI Leader", description: "You are driving AI adoption in your organisation and are known as a forward-thinking leader.", strengths: ["High strategic visibility", "Future-proof positioning", "Attracts AI-forward organisations"], risks: ["May move faster than the organisation can absorb", "Needs to balance innovation with execution", "Must maintain human connection"], icon: "🚀" },
  { id: "the_ai_integrator", moduleCode: "AIR", label: "The AI Integrator", description: "You use AI effectively in your daily work and are building a competitive advantage through AI-augmented productivity.", strengths: ["High personal productivity", "Practical AI skills", "Competitive in AI-augmented roles"], risks: ["May not be visible as an AI leader", "Needs to translate personal use into organisational impact", "Risk of tool dependency"], icon: "⚙️" },
  { id: "the_human_anchor", moduleCode: "AIR", label: "The Human Anchor", description: "You have strong distinctly human capabilities — judgment, empathy, creativity — and are positioning these as your AI-era advantage.", strengths: ["Clear human differentiation", "High trust with stakeholders", "Irreplaceable in relationship-intensive roles"], risks: ["May underinvest in AI literacy", "Could be perceived as resistant to change", "Needs to combine human skills with AI fluency"], icon: "🧠" },
  { id: "the_ai_anxious", moduleCode: "AIR", label: "The AI Anxious", description: "You are concerned about AI's impact on your career but have not yet converted that concern into action.", strengths: ["Aware of the risk", "Motivated to change", "Open to learning"], risks: ["Anxiety may paralyse rather than motivate", "Falling further behind while waiting", "Needs to convert awareness into action immediately"], icon: "😰" },
  { id: "the_ai_agnostic", moduleCode: "AIR", label: "The AI Agnostic", description: "You are largely unaware of or disengaged from the AI transformation happening in your field.", strengths: ["Not distracted by AI hype", "Focused on core work"], risks: ["Significant career risk in the medium term", "Being overtaken by AI-ready peers", "Needs urgent AI literacy investment"], icon: "😶" },
];

// ─── Shared Scoring Engine ─────────────────────────────────────────────────────

const ALL_DIMENSIONS: Record<string, CiDimension[]> = {
  CPI: CPI_DIMENSIONS,
  CRS: CRS_DIMENSIONS,
  CMK: CMK_DIMENSIONS,
  CST: CST_DIMENSIONS,
  CAO: CAO_DIMENSIONS,
  AIR: AIR_DIMENSIONS,
};

const ALL_QUESTIONS: Record<string, CiQuestion[]> = {
  CPI: CPI_QUESTIONS,
  CRS: CRS_QUESTIONS,
  CMK: CMK_QUESTIONS,
  CST: CST_QUESTIONS,
  CAO: CAO_QUESTIONS,
  AIR: AIR_QUESTIONS,
};

const ALL_ZONES: Record<string, CiZone[]> = {
  CPI: CPI_ZONES,
  CRS: CRS_ZONES,
  CMK: CMK_ZONES,
  CST: CST_ZONES,
  CAO: CAO_ZONES,
  AIR: AIR_ZONES,
};

const ALL_ARCHETYPES: Record<string, CiArchetype[]> = {
  CPI: CPI_ARCHETYPES,
  CRS: CRS_ARCHETYPES,
  CMK: CMK_ARCHETYPES,
  CST: CST_ARCHETYPES,
  CAO: CAO_ARCHETYPES,
  AIR: AIR_ARCHETYPES,
};

export function getCiQuestions(moduleCode: string): CiQuestion[] {
  return ALL_QUESTIONS[moduleCode] ?? [];
}

export function getCiDimensions(moduleCode: string): CiDimension[] {
  return ALL_DIMENSIONS[moduleCode] ?? [];
}

export function getCiZone(moduleCode: string, score: number): CiZone {
  const zones = ALL_ZONES[moduleCode] ?? CPI_ZONES;
  return zones.find((z) => score >= z.range[0] && score <= z.range[1]) ?? zones[zones.length - 1];
}

export function getCiModule(moduleCode: string): CiModuleMeta | undefined {
  return CI_MODULES.find((m) => m.code === moduleCode);
}

export type CiScoreResult = {
  edgeScore: number;
  dimensionScores: Record<string, number>;
  zone: string;
  zoneLabel: string;
  zoneDescription: string;
  zoneImplication: string;
  archetypeId: string;
  archetypeLabel: string;
};

export function scoreCiModule(moduleCode: string, responses: Record<string, number>): CiScoreResult {
  const dimensions = ALL_DIMENSIONS[moduleCode] ?? [];
  const questions = ALL_QUESTIONS[moduleCode] ?? [];
  const archetypes = ALL_ARCHETYPES[moduleCode] ?? [];

  // Compute raw dimension scores (1–5 scale)
  const dimensionScores: Record<string, number> = {};
  for (const dim of dimensions) {
    const dimQuestions = questions.filter((q) => q.dimensionId === dim.id);
    if (dimQuestions.length === 0) continue;
    let total = 0;
    for (const q of dimQuestions) {
      const raw = responses[q.id] ?? 3;
      total += q.reverseScored ? 6 - raw : raw;
    }
    dimensionScores[dim.id] = total / dimQuestions.length;
  }

  // Compute weighted overall score (normalised to 0–100)
  let weightedSum = 0;
  let totalWeight = 0;
  for (const dim of dimensions) {
    const raw = dimensionScores[dim.id] ?? 3;
    weightedSum += raw * dim.weight;
    totalWeight += dim.weight;
  }
  const rawOverall = totalWeight > 0 ? weightedSum / totalWeight : 3;
  const edgeScore = Math.round(((rawOverall - 1) / 4) * 100);

  // Normalise dimension scores to 0–100
  const normalisedDimensionScores: Record<string, number> = {};
  for (const [dimId, raw] of Object.entries(dimensionScores)) {
    normalisedDimensionScores[dimId] = Math.round(((raw - 1) / 4) * 100);
  }

  // Get zone
  const zone = getCiZone(moduleCode, edgeScore);

  // Assign archetype based on dimension profile
  let bestArchetype = archetypes[0];
  if (archetypes.length > 1) {
    // Use edgeScore bands to assign archetype
    if (edgeScore >= 85) bestArchetype = archetypes[0];
    else if (edgeScore >= 70) bestArchetype = archetypes[1];
    else if (edgeScore >= 55) bestArchetype = archetypes[2];
    else if (edgeScore >= 40) bestArchetype = archetypes[3];
    else bestArchetype = archetypes[4] ?? archetypes[archetypes.length - 1];
  }

  return {
    edgeScore,
    dimensionScores: normalisedDimensionScores,
    zone: zone.id,
    zoneLabel: zone.label,
    zoneDescription: zone.description,
    zoneImplication: zone.implication,
    archetypeId: bestArchetype.id,
    archetypeLabel: bestArchetype.label,
  };
}

// ─── CI Module Labels (for display) ───────────────────────────────────────────

export const CI_MODULE_LABELS: Record<string, string> = {
  CPI: "Career Positioning Intelligence",
  CRS: "Career Resilience Intelligence",
  CMK: "Career Marketability Intelligence",
  CST: "Career Strategy Intelligence",
  CAO: "Career Optionality Intelligence",
  AIR: "AI Readiness Intelligence",
};

export const CI_DIMENSION_LABELS: Record<string, Record<string, string>> = {
  CPI: {
    value_proposition: "Value Proposition Clarity",
    professional_identity: "Professional Identity Strength",
    positioning_differentiation: "Positioning & Differentiation",
    narrative_coherence: "Career Narrative Coherence",
    target_market_clarity: "Target Market Clarity",
  },
  CRS: {
    adversity_response: "Adversity Response",
    adaptability: "Adaptability & Flexibility",
    emotional_regulation: "Emotional Regulation Under Pressure",
    recovery_speed: "Recovery Speed",
    future_orientation: "Future Orientation",
  },
  CMK: {
    professional_brand: "Professional Brand Strength",
    network_capital: "Network Capital",
    digital_presence: "Digital Presence & Visibility",
    thought_leadership: "Thought Leadership",
    market_intelligence: "Market Intelligence",
  },
  CST: {
    strategic_clarity: "Strategic Career Clarity",
    planning_discipline: "Planning & Execution Discipline",
    opportunity_sensing: "Opportunity Sensing",
    stakeholder_strategy: "Stakeholder Strategy",
    risk_management: "Career Risk Management",
  },
  CAO: {
    role_breadth: "Role & Function Breadth",
    industry_transferability: "Industry Transferability",
    geographic_mobility: "Geographic & Work Model Flexibility",
    financial_runway: "Financial Runway",
    portfolio_readiness: "Portfolio Career Readiness",
  },
  AIR: {
    ai_literacy: "AI Literacy & Understanding",
    ai_workflow: "AI Workflow Integration",
    ai_strategy: "AI Strategic Positioning",
    human_differentiation: "Human Differentiation",
    ai_mindset: "AI Mindset & Adaptability",
  },
};
