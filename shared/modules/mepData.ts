/**
 * Manager Effectiveness Platform — Diagnostic Data
 *
 * 10 scientifically-grounded management diagnostics.
 * Each uses a 5-point Likert scale (1 = Never, 5 = Always).
 * Scores are normalised to 0–100.
 *
 * Diagnostic codes:
 *   MEI  — Manager Effectiveness Index (flagship, 10 dimensions)
 *   DI   — Delegation Intelligence
 *   FI   — Feedback Intelligence
 *   CI_C — Coaching Intelligence
 *   THI  — Team Health Intelligence
 *   EXI  — Execution Intelligence
 *   CNFI — Conflict Intelligence
 *   O1I  — One-on-One Intelligence
 *   TCI  — Team Communication Intelligence
 *   OWI  — Ownership Intelligence
 */

export interface MepQuestion {
  id: string;
  text: string;
  dimensionId: string;
  reversed?: boolean; // if true, score is (6 - raw) before averaging
}

export interface MepDimension {
  id: string;
  label: string;
  description: string;
}

export interface MepDiagnostic {
  code: string;
  title: string;
  tagline: string;
  description: string;
  icon: string; // emoji
  estimatedMinutes: number;
  dimensions: MepDimension[];
  questions: MepQuestion[];
  zones: { min: number; max: number; label: string; color: string; description: string }[];
}

// ─── Zone definitions (shared across all diagnostics) ────────────────────────
const STANDARD_ZONES = [
  { min: 0, max: 39, label: "Developing", color: "#ef4444", description: "Significant growth opportunity — foundational skills need attention" },
  { min: 40, max: 59, label: "Building", color: "#f97316", description: "Progressing — key behaviours are emerging but inconsistent" },
  { min: 60, max: 74, label: "Effective", color: "#eab308", description: "Solid performance — consistently applying good management practices" },
  { min: 75, max: 89, label: "Strong", color: "#22c55e", description: "High effectiveness — a role model in most areas" },
  { min: 90, max: 100, label: "Exceptional", color: "#6366f1", description: "Mastery level — consistently exceptional across all dimensions" },
];

// ─── MEI — Manager Effectiveness Index ───────────────────────────────────────
const MEI_DIMENSIONS: MepDimension[] = [
  { id: "goal_clarity", label: "Goal Clarity", description: "Setting clear, measurable goals for the team" },
  { id: "planning", label: "Planning", description: "Structuring work and anticipating obstacles" },
  { id: "delegation", label: "Delegation", description: "Assigning work with appropriate authority" },
  { id: "accountability", label: "Accountability", description: "Holding self and team to commitments" },
  { id: "coaching", label: "Coaching", description: "Developing people through questions and feedback" },
  { id: "communication", label: "Communication", description: "Communicating clearly and listening actively" },
  { id: "decision_making", label: "Decision Making", description: "Making timely, well-reasoned decisions" },
  { id: "execution", label: "Execution", description: "Driving results and following through" },
  { id: "team_leadership", label: "Team Leadership", description: "Building cohesion, trust, and team culture" },
  { id: "stakeholder_mgmt", label: "Stakeholder Management", description: "Managing up, across, and outward effectively" },
];

const MEI_QUESTIONS: MepQuestion[] = [
  // Goal Clarity
  { id: "mei_gc1", text: "I set clear, specific goals for each team member at the start of every quarter.", dimensionId: "goal_clarity" },
  { id: "mei_gc2", text: "My team can articulate exactly what success looks like for their work.", dimensionId: "goal_clarity" },
  { id: "mei_gc3", text: "I regularly connect individual tasks to broader team and organisational goals.", dimensionId: "goal_clarity" },
  // Planning
  { id: "mei_pl1", text: "I plan work in advance and anticipate potential blockers before they arise.", dimensionId: "planning" },
  { id: "mei_pl2", text: "I ensure my team has the resources and clarity they need before starting major work.", dimensionId: "planning" },
  { id: "mei_pl3", text: "I adjust plans proactively when circumstances change.", dimensionId: "planning" },
  // Delegation
  { id: "mei_de1", text: "I delegate meaningful work — not just tasks — to develop my team.", dimensionId: "delegation" },
  { id: "mei_de2", text: "When I delegate, I clearly define the outcome, not just the activity.", dimensionId: "delegation" },
  { id: "mei_de3", text: "I resist the urge to take back work once I have delegated it.", dimensionId: "delegation" },
  // Accountability
  { id: "mei_ac1", text: "I follow up on commitments consistently without micromanaging.", dimensionId: "accountability" },
  { id: "mei_ac2", text: "I address missed commitments directly and promptly.", dimensionId: "accountability" },
  { id: "mei_ac3", text: "I hold myself to the same standards I expect from my team.", dimensionId: "accountability" },
  // Coaching
  { id: "mei_co1", text: "I regularly have developmental conversations with each team member.", dimensionId: "coaching" },
  { id: "mei_co2", text: "I ask questions to help people solve problems rather than giving answers.", dimensionId: "coaching" },
  { id: "mei_co3", text: "I give specific, actionable feedback after key events.", dimensionId: "coaching" },
  // Communication
  { id: "mei_cm1", text: "I communicate decisions and context clearly so my team understands the 'why'.", dimensionId: "communication" },
  { id: "mei_cm2", text: "I listen actively and make people feel genuinely heard.", dimensionId: "communication" },
  { id: "mei_cm3", text: "I adapt my communication style to the needs of different team members.", dimensionId: "communication" },
  // Decision Making
  { id: "mei_dm1", text: "I make decisions in a timely manner — I don't let indecision create bottlenecks.", dimensionId: "decision_making" },
  { id: "mei_dm2", text: "I involve the right people in decisions without over-consulting.", dimensionId: "decision_making" },
  { id: "mei_dm3", text: "I revisit and adjust decisions when new information emerges.", dimensionId: "decision_making" },
  // Execution
  { id: "mei_ex1", text: "My team consistently delivers on its commitments.", dimensionId: "execution" },
  { id: "mei_ex2", text: "I remove blockers quickly so my team can maintain momentum.", dimensionId: "execution" },
  { id: "mei_ex3", text: "I track progress on key priorities without creating unnecessary overhead.", dimensionId: "execution" },
  // Team Leadership
  { id: "mei_tl1", text: "My team has a strong sense of trust and psychological safety.", dimensionId: "team_leadership" },
  { id: "mei_tl2", text: "I actively build team culture and cohesion.", dimensionId: "team_leadership" },
  { id: "mei_tl3", text: "I recognise and celebrate team wins consistently.", dimensionId: "team_leadership" },
  // Stakeholder Management
  { id: "mei_sm1", text: "I proactively manage the expectations of my manager and key stakeholders.", dimensionId: "stakeholder_mgmt" },
  { id: "mei_sm2", text: "I build strong working relationships across functions.", dimensionId: "stakeholder_mgmt" },
  { id: "mei_sm3", text: "I represent my team's work and needs effectively to senior leadership.", dimensionId: "stakeholder_mgmt" },
];

// ─── DI — Delegation Intelligence ────────────────────────────────────────────
const DI_DIMENSIONS: MepDimension[] = [
  { id: "trust", label: "Trust", description: "Trusting team members to own work" },
  { id: "task_selection", label: "Task Selection", description: "Choosing the right tasks to delegate" },
  { id: "clear_outcomes", label: "Clear Outcomes", description: "Defining success before delegating" },
  { id: "followup_rhythm", label: "Follow-up Rhythm", description: "Checking in without micromanaging" },
  { id: "empowerment", label: "Empowerment", description: "Giving authority alongside responsibility" },
  { id: "ownership_transfer", label: "Ownership Transfer", description: "Fully releasing ownership once delegated" },
];

const DI_QUESTIONS: MepQuestion[] = [
  { id: "di_t1", text: "I trust my team members to handle important work without constant oversight.", dimensionId: "trust" },
  { id: "di_t2", text: "I believe most of my team is capable of more than they are currently doing.", dimensionId: "trust" },
  { id: "di_ts1", text: "I deliberately choose tasks that will stretch and develop my team members.", dimensionId: "task_selection" },
  { id: "di_ts2", text: "I identify which tasks only I can do and delegate everything else.", dimensionId: "task_selection" },
  { id: "di_co1", text: "Before delegating, I clearly define what a successful outcome looks like.", dimensionId: "clear_outcomes" },
  { id: "di_co2", text: "I ensure the person I delegate to understands the context and importance of the work.", dimensionId: "clear_outcomes" },
  { id: "di_fr1", text: "I establish a check-in rhythm upfront when I delegate, rather than ad-hoc.", dimensionId: "followup_rhythm" },
  { id: "di_fr2", text: "I ask for progress updates at agreed intervals rather than whenever I feel anxious.", dimensionId: "followup_rhythm" },
  { id: "di_em1", text: "When I delegate, I give the person the authority they need to make decisions.", dimensionId: "empowerment" },
  { id: "di_em2", text: "I defend my team's decisions to stakeholders rather than second-guessing them.", dimensionId: "empowerment" },
  { id: "di_ot1", text: "Once I delegate, I resist the urge to take the work back even if it's done differently.", dimensionId: "ownership_transfer" },
  { id: "di_ot2", text: "My team members feel genuine ownership over their work, not just execution.", dimensionId: "ownership_transfer" },
];

// ─── FI — Feedback Intelligence ──────────────────────────────────────────────
const FI_DIMENSIONS: MepDimension[] = [
  { id: "courage", label: "Courage", description: "Willingness to give difficult feedback" },
  { id: "timeliness", label: "Timeliness", description: "Giving feedback close to the event" },
  { id: "specificity", label: "Specificity", description: "Feedback that is concrete and actionable" },
  { id: "positive_reinforcement", label: "Positive Reinforcement", description: "Recognising and reinforcing good work" },
  { id: "difficult_conversations", label: "Difficult Conversations", description: "Addressing performance and behaviour issues" },
  { id: "developmental_feedback", label: "Developmental Feedback", description: "Feedback focused on growth" },
];

const FI_QUESTIONS: MepQuestion[] = [
  { id: "fi_c1", text: "I give honest feedback even when it might be uncomfortable for the recipient.", dimensionId: "courage" },
  { id: "fi_c2", text: "I address performance issues directly rather than hoping they resolve themselves.", dimensionId: "courage" },
  { id: "fi_ti1", text: "I give feedback as close to the event as possible, not weeks later.", dimensionId: "timeliness" },
  { id: "fi_ti2", text: "I don't save feedback for performance reviews — I give it in the moment.", dimensionId: "timeliness" },
  { id: "fi_sp1", text: "My feedback includes specific examples, not vague generalisations.", dimensionId: "specificity" },
  { id: "fi_sp2", text: "I describe the impact of behaviour, not just the behaviour itself.", dimensionId: "specificity" },
  { id: "fi_pr1", text: "I regularly recognise and celebrate good work, not just correct mistakes.", dimensionId: "positive_reinforcement" },
  { id: "fi_pr2", text: "My team members feel genuinely appreciated for their contributions.", dimensionId: "positive_reinforcement" },
  { id: "fi_dc1", text: "I address conflict and underperformance promptly rather than avoiding it.", dimensionId: "difficult_conversations" },
  { id: "fi_dc2", text: "I can have difficult conversations while maintaining the relationship.", dimensionId: "difficult_conversations" },
  { id: "fi_df1", text: "My feedback focuses on how someone can grow, not just what went wrong.", dimensionId: "developmental_feedback" },
  { id: "fi_df2", text: "I co-create development plans with team members rather than prescribing them.", dimensionId: "developmental_feedback" },
];

// ─── CI_C — Coaching Intelligence ────────────────────────────────────────────
const CI_C_DIMENSIONS: MepDimension[] = [
  { id: "listening", label: "Listening", description: "Deep, attentive listening" },
  { id: "curiosity", label: "Curiosity", description: "Genuine interest in the other person's perspective" },
  { id: "powerful_questions", label: "Powerful Questions", description: "Questions that provoke insight" },
  { id: "reflection", label: "Reflection", description: "Creating space for self-discovery" },
  { id: "development_planning", label: "Development Planning", description: "Structured growth conversations" },
  { id: "empowerment_coach", label: "Empowerment", description: "Building confidence and capability" },
];

const CI_C_QUESTIONS: MepQuestion[] = [
  { id: "cic_l1", text: "When someone is talking to me, I give them my full, undivided attention.", dimensionId: "listening" },
  { id: "cic_l2", text: "I listen to understand, not to formulate my response.", dimensionId: "listening" },
  { id: "cic_cu1", text: "I am genuinely curious about what my team members think and feel.", dimensionId: "curiosity" },
  { id: "cic_cu2", text: "I ask about the person's perspective before offering my own.", dimensionId: "curiosity" },
  { id: "cic_pq1", text: "I ask open questions that help people think more deeply about their challenges.", dimensionId: "powerful_questions" },
  { id: "cic_pq2", text: "My questions often lead to breakthroughs or new perspectives for the other person.", dimensionId: "powerful_questions" },
  { id: "cic_r1", text: "I create space for people to reflect rather than filling every silence.", dimensionId: "reflection" },
  { id: "cic_r2", text: "I encourage people to draw their own conclusions rather than giving them answers.", dimensionId: "reflection" },
  { id: "cic_dp1", text: "I have regular, structured development conversations with each team member.", dimensionId: "development_planning" },
  { id: "cic_dp2", text: "Each person on my team has a clear development plan they own.", dimensionId: "development_planning" },
  { id: "cic_em1", text: "My coaching builds people's confidence and capability over time.", dimensionId: "empowerment_coach" },
  { id: "cic_em2", text: "People leave conversations with me feeling more capable, not more dependent.", dimensionId: "empowerment_coach" },
];

// ─── THI — Team Health Intelligence ──────────────────────────────────────────
const THI_DIMENSIONS: MepDimension[] = [
  { id: "trust_team", label: "Trust", description: "Team members trust each other" },
  { id: "psych_safety", label: "Psychological Safety", description: "People feel safe to speak up" },
  { id: "collaboration", label: "Collaboration", description: "Team works well together" },
  { id: "accountability_team", label: "Accountability", description: "Team holds each other accountable" },
  { id: "motivation", label: "Motivation", description: "Team is energised and engaged" },
  { id: "workload_balance", label: "Workload Balance", description: "Work is distributed fairly" },
  { id: "communication_quality", label: "Communication Quality", description: "Team communicates openly" },
];

const THI_QUESTIONS: MepQuestion[] = [
  { id: "thi_tr1", text: "My team members trust each other to do their part without constant checking.", dimensionId: "trust_team" },
  { id: "thi_tr2", text: "There is a strong sense of reliability and follow-through in my team.", dimensionId: "trust_team" },
  { id: "thi_ps1", text: "People on my team feel safe to raise concerns, disagree, and take risks.", dimensionId: "psych_safety" },
  { id: "thi_ps2", text: "Team members speak up about problems early rather than hiding them.", dimensionId: "psych_safety" },
  { id: "thi_co1", text: "My team collaborates effectively across different workstreams.", dimensionId: "collaboration" },
  { id: "thi_co2", text: "People on my team help each other succeed, not just focus on their own work.", dimensionId: "collaboration" },
  { id: "thi_ac1", text: "My team holds each other accountable without me having to intervene.", dimensionId: "accountability_team" },
  { id: "thi_ac2", text: "Missed commitments are addressed directly within the team.", dimensionId: "accountability_team" },
  { id: "thi_mo1", text: "My team is genuinely motivated and energised about their work.", dimensionId: "motivation" },
  { id: "thi_mo2", text: "Team members bring discretionary effort — they go beyond the minimum.", dimensionId: "motivation" },
  { id: "thi_wb1", text: "Workload is distributed fairly across the team.", dimensionId: "workload_balance" },
  { id: "thi_wb2", text: "I actively monitor for signs of burnout and address them early.", dimensionId: "workload_balance" },
  { id: "thi_cq1", text: "Communication in my team is open, direct, and constructive.", dimensionId: "communication_quality" },
  { id: "thi_cq2", text: "Important information flows freely within the team without silos.", dimensionId: "communication_quality" },
];

// ─── EXI — Execution Intelligence ────────────────────────────────────────────
const EXI_DIMENSIONS: MepDimension[] = [
  { id: "planning_ex", label: "Planning", description: "Translating goals into executable plans" },
  { id: "prioritization", label: "Prioritisation", description: "Focusing on what matters most" },
  { id: "meeting_discipline", label: "Meeting Discipline", description: "Running effective, purposeful meetings" },
  { id: "followthrough", label: "Follow-through", description: "Completing what is started" },
  { id: "risk_management", label: "Risk Management", description: "Anticipating and mitigating risks" },
  { id: "delivery_consistency", label: "Delivery Consistency", description: "Reliable, predictable delivery" },
];

const EXI_QUESTIONS: MepQuestion[] = [
  { id: "exi_pl1", text: "I translate goals into clear, actionable plans with owners and timelines.", dimensionId: "planning_ex" },
  { id: "exi_pl2", text: "My team always knows what the plan is and their role in it.", dimensionId: "planning_ex" },
  { id: "exi_pr1", text: "I ruthlessly prioritise the most important work and say no to distractions.", dimensionId: "prioritization" },
  { id: "exi_pr2", text: "My team spends the majority of their time on high-impact work.", dimensionId: "prioritization" },
  { id: "exi_md1", text: "My meetings have clear agendas, start on time, and end with decisions and actions.", dimensionId: "meeting_discipline" },
  { id: "exi_md2", text: "I regularly audit my team's meeting load and eliminate unnecessary meetings.", dimensionId: "meeting_discipline" },
  { id: "exi_ft1", text: "I follow up on action items consistently and ensure nothing falls through the cracks.", dimensionId: "followthrough" },
  { id: "exi_ft2", text: "My team has a strong culture of completing what they commit to.", dimensionId: "followthrough" },
  { id: "exi_rm1", text: "I proactively identify risks to delivery and address them before they become problems.", dimensionId: "risk_management" },
  { id: "exi_rm2", text: "I escalate risks early rather than hoping they resolve themselves.", dimensionId: "risk_management" },
  { id: "exi_dc1", text: "My team consistently delivers on its commitments to stakeholders.", dimensionId: "delivery_consistency" },
  { id: "exi_dc2", text: "Stakeholders can rely on my team to deliver what we promise, when we promise it.", dimensionId: "delivery_consistency" },
];

// ─── CNFI — Conflict Intelligence ────────────────────────────────────────────
const CNFI_DIMENSIONS: MepDimension[] = [
  { id: "emotional_regulation", label: "Emotional Regulation", description: "Staying calm under pressure" },
  { id: "assertiveness", label: "Assertiveness", description: "Standing firm while remaining respectful" },
  { id: "negotiation", label: "Negotiation", description: "Finding mutually acceptable solutions" },
  { id: "resolution", label: "Resolution", description: "Reaching clear, lasting agreements" },
  { id: "fairness", label: "Fairness", description: "Being perceived as fair by all parties" },
  { id: "recovery", label: "Recovery", description: "Restoring relationships after conflict" },
];

const CNFI_QUESTIONS: MepQuestion[] = [
  { id: "cnfi_er1", text: "I remain calm and composed in tense or confrontational situations.", dimensionId: "emotional_regulation" },
  { id: "cnfi_er2", text: "I don't let my emotions drive my responses during conflict.", dimensionId: "emotional_regulation" },
  { id: "cnfi_as1", text: "I can hold my position firmly while remaining respectful and open.", dimensionId: "assertiveness" },
  { id: "cnfi_as2", text: "I address conflict directly rather than avoiding or accommodating.", dimensionId: "assertiveness" },
  { id: "cnfi_ne1", text: "I look for solutions that work for all parties, not just my preferred outcome.", dimensionId: "negotiation" },
  { id: "cnfi_ne2", text: "I understand what the other party truly needs, not just what they're asking for.", dimensionId: "negotiation" },
  { id: "cnfi_re1", text: "Conflicts in my team are resolved with clear agreements and follow-up.", dimensionId: "resolution" },
  { id: "cnfi_re2", text: "I don't let conflicts fester — I address them until they are genuinely resolved.", dimensionId: "resolution" },
  { id: "cnfi_fa1", text: "My team members perceive me as fair and impartial in conflict situations.", dimensionId: "fairness" },
  { id: "cnfi_fa2", text: "I apply consistent standards when resolving disputes.", dimensionId: "fairness" },
  { id: "cnfi_rc1", text: "After a conflict, I actively work to restore the relationship.", dimensionId: "recovery" },
  { id: "cnfi_rc2", text: "Relationships in my team recover quickly after disagreements.", dimensionId: "recovery" },
];

// ─── O1I — One-on-One Intelligence ───────────────────────────────────────────
const O1I_DIMENSIONS: MepDimension[] = [
  { id: "preparation_1on1", label: "Preparation", description: "Coming prepared to 1:1s" },
  { id: "listening_1on1", label: "Listening", description: "Truly hearing the team member" },
  { id: "coaching_1on1", label: "Coaching", description: "Developing through 1:1 conversations" },
  { id: "recognition_1on1", label: "Recognition", description: "Acknowledging contributions" },
  { id: "career_discussions", label: "Career Discussions", description: "Talking about growth and future" },
  { id: "accountability_1on1", label: "Accountability", description: "Tracking commitments from 1:1s" },
];

const O1I_QUESTIONS: MepQuestion[] = [
  { id: "o1i_pr1", text: "I prepare for 1:1s in advance — I know what I want to discuss and what I want to learn.", dimensionId: "preparation_1on1" },
  { id: "o1i_pr2", text: "My 1:1s have a consistent structure that makes them productive.", dimensionId: "preparation_1on1" },
  { id: "o1i_li1", text: "In 1:1s, I listen more than I talk.", dimensionId: "listening_1on1" },
  { id: "o1i_li2", text: "My team members feel genuinely heard in our 1:1 conversations.", dimensionId: "listening_1on1" },
  { id: "o1i_co1", text: "I use 1:1s to develop my team members, not just to get status updates.", dimensionId: "coaching_1on1" },
  { id: "o1i_co2", text: "People leave our 1:1s with more clarity and capability than when they arrived.", dimensionId: "coaching_1on1" },
  { id: "o1i_re1", text: "I regularly recognise individual contributions in 1:1s.", dimensionId: "recognition_1on1" },
  { id: "o1i_re2", text: "My team members feel valued and appreciated after our 1:1s.", dimensionId: "recognition_1on1" },
  { id: "o1i_cd1", text: "I have regular conversations about each team member's career aspirations and growth.", dimensionId: "career_discussions" },
  { id: "o1i_cd2", text: "I actively help team members progress toward their career goals.", dimensionId: "career_discussions" },
  { id: "o1i_ac1", text: "I track commitments made in 1:1s and follow up on them.", dimensionId: "accountability_1on1" },
  { id: "o1i_ac2", text: "My 1:1s consistently produce clear actions that are followed through.", dimensionId: "accountability_1on1" },
];

// ─── TCI — Team Communication Intelligence ───────────────────────────────────
const TCI_DIMENSIONS: MepDimension[] = [
  { id: "clarity_comm", label: "Clarity", description: "Communicating with precision" },
  { id: "active_listening_team", label: "Active Listening", description: "Listening to understand" },
  { id: "alignment", label: "Alignment", description: "Ensuring shared understanding" },
  { id: "meeting_effectiveness", label: "Meeting Effectiveness", description: "Productive, purposeful meetings" },
  { id: "written_communication", label: "Written Communication", description: "Clear written communication" },
  { id: "transparency", label: "Transparency", description: "Sharing context and information openly" },
];

const TCI_QUESTIONS: MepQuestion[] = [
  { id: "tci_cl1", text: "My communications are clear, concise, and easy to act on.", dimensionId: "clarity_comm" },
  { id: "tci_cl2", text: "I check for understanding after important communications.", dimensionId: "clarity_comm" },
  { id: "tci_al1", text: "I listen actively and make people feel heard in team conversations.", dimensionId: "active_listening_team" },
  { id: "tci_al2", text: "I encourage quieter team members to contribute in group settings.", dimensionId: "active_listening_team" },
  { id: "tci_ag1", text: "After important decisions, I ensure everyone understands what was decided and why.", dimensionId: "alignment" },
  { id: "tci_ag2", text: "My team rarely misaligns on priorities or direction.", dimensionId: "alignment" },
  { id: "tci_me1", text: "My team meetings are focused, productive, and end with clear outcomes.", dimensionId: "meeting_effectiveness" },
  { id: "tci_me2", text: "People leave my meetings knowing exactly what they need to do next.", dimensionId: "meeting_effectiveness" },
  { id: "tci_wc1", text: "My written communications (emails, messages, docs) are clear and well-structured.", dimensionId: "written_communication" },
  { id: "tci_wc2", text: "I choose the right communication channel for the right message.", dimensionId: "written_communication" },
  { id: "tci_tr1", text: "I proactively share context and information my team needs to do their best work.", dimensionId: "transparency" },
  { id: "tci_tr2", text: "My team doesn't feel left in the dark about decisions that affect them.", dimensionId: "transparency" },
];

// ─── OWI — Ownership Intelligence ────────────────────────────────────────────
const OWI_DIMENSIONS: MepDimension[] = [
  { id: "initiative", label: "Initiative", description: "Acting without being asked" },
  { id: "accountability_own", label: "Accountability", description: "Taking responsibility for outcomes" },
  { id: "reliability", label: "Reliability", description: "Consistently delivering on commitments" },
  { id: "problem_ownership", label: "Problem Ownership", description: "Owning problems end-to-end" },
  { id: "continuous_improvement", label: "Continuous Improvement", description: "Always looking to improve" },
  { id: "proactive_behaviour", label: "Proactive Behaviour", description: "Anticipating needs and acting ahead" },
];

const OWI_QUESTIONS: MepQuestion[] = [
  { id: "owi_in1", text: "I take initiative on important issues without waiting to be asked.", dimensionId: "initiative" },
  { id: "owi_in2", text: "I create opportunities rather than waiting for them to appear.", dimensionId: "initiative" },
  { id: "owi_ac1", text: "I take full responsibility for outcomes — I don't blame circumstances or others.", dimensionId: "accountability_own" },
  { id: "owi_ac2", text: "When things go wrong, I focus on what I can do differently, not who to blame.", dimensionId: "accountability_own" },
  { id: "owi_re1", text: "People can count on me to deliver what I commit to.", dimensionId: "reliability" },
  { id: "owi_re2", text: "I communicate proactively when I'm at risk of missing a commitment.", dimensionId: "reliability" },
  { id: "owi_po1", text: "When I identify a problem, I own it end-to-end until it's resolved.", dimensionId: "problem_ownership" },
  { id: "owi_po2", text: "I don't pass problems up the chain without first attempting to solve them.", dimensionId: "problem_ownership" },
  { id: "owi_ci1", text: "I regularly look for ways to improve how my team works.", dimensionId: "continuous_improvement" },
  { id: "owi_ci2", text: "I create a culture where continuous improvement is expected and celebrated.", dimensionId: "continuous_improvement" },
  { id: "owi_pb1", text: "I anticipate what's coming and prepare my team in advance.", dimensionId: "proactive_behaviour" },
  { id: "owi_pb2", text: "I surface risks and opportunities before they become obvious.", dimensionId: "proactive_behaviour" },
];

// ─── Diagnostic registry ──────────────────────────────────────────────────────
export const MEP_DIAGNOSTICS: MepDiagnostic[] = [
  {
    code: "MEI",
    title: "Manager Effectiveness Index",
    tagline: "Your complete management effectiveness profile",
    description: "The flagship diagnostic — measures your effectiveness across 10 core management dimensions to give you a complete picture of your management impact.",
    icon: "🎯",
    estimatedMinutes: 12,
    dimensions: MEI_DIMENSIONS,
    questions: MEI_QUESTIONS,
    zones: STANDARD_ZONES,
  },
  {
    code: "DI",
    title: "Delegation Intelligence",
    tagline: "How well do you let go and empower others?",
    description: "Measures your ability to delegate effectively — from trust and task selection to empowerment and full ownership transfer.",
    icon: "🤝",
    estimatedMinutes: 8,
    dimensions: DI_DIMENSIONS,
    questions: DI_QUESTIONS,
    zones: STANDARD_ZONES,
  },
  {
    code: "FI",
    title: "Feedback Intelligence",
    tagline: "How effectively do you give feedback that changes behaviour?",
    description: "Assesses your feedback quality across courage, timeliness, specificity, and your ability to have difficult developmental conversations.",
    icon: "💬",
    estimatedMinutes: 8,
    dimensions: FI_DIMENSIONS,
    questions: FI_QUESTIONS,
    zones: STANDARD_ZONES,
  },
  {
    code: "CI_C",
    title: "Coaching Intelligence",
    tagline: "How well do you develop people through coaching?",
    description: "Measures your coaching effectiveness — listening depth, curiosity, powerful questions, and your ability to build capability in others.",
    icon: "🧠",
    estimatedMinutes: 8,
    dimensions: CI_C_DIMENSIONS,
    questions: CI_C_QUESTIONS,
    zones: STANDARD_ZONES,
  },
  {
    code: "THI",
    title: "Team Health Intelligence",
    tagline: "How healthy is your team?",
    description: "Assesses the health of your team across trust, psychological safety, collaboration, motivation, and workload balance.",
    icon: "💪",
    estimatedMinutes: 10,
    dimensions: THI_DIMENSIONS,
    questions: THI_QUESTIONS,
    zones: STANDARD_ZONES,
  },
  {
    code: "EXI",
    title: "Execution Intelligence",
    tagline: "How reliably does your team deliver?",
    description: "Measures your execution effectiveness — planning, prioritisation, meeting discipline, follow-through, and delivery consistency.",
    icon: "⚡",
    estimatedMinutes: 8,
    dimensions: EXI_DIMENSIONS,
    questions: EXI_QUESTIONS,
    zones: STANDARD_ZONES,
  },
  {
    code: "CNFI",
    title: "Conflict Intelligence",
    tagline: "How effectively do you navigate conflict?",
    description: "Assesses your ability to manage conflict constructively — emotional regulation, assertiveness, negotiation, and relationship recovery.",
    icon: "🛡️",
    estimatedMinutes: 8,
    dimensions: CNFI_DIMENSIONS,
    questions: CNFI_QUESTIONS,
    zones: STANDARD_ZONES,
  },
  {
    code: "O1I",
    title: "One-on-One Intelligence",
    tagline: "How effective are your 1:1 conversations?",
    description: "Measures the quality of your one-on-one meetings — preparation, listening, coaching, recognition, career development, and accountability.",
    icon: "🗣️",
    estimatedMinutes: 8,
    dimensions: O1I_DIMENSIONS,
    questions: O1I_QUESTIONS,
    zones: STANDARD_ZONES,
  },
  {
    code: "TCI",
    title: "Team Communication Intelligence",
    tagline: "How clearly and effectively do you communicate?",
    description: "Assesses your team communication across clarity, active listening, alignment, meeting effectiveness, written communication, and transparency.",
    icon: "📡",
    estimatedMinutes: 8,
    dimensions: TCI_DIMENSIONS,
    questions: TCI_QUESTIONS,
    zones: STANDARD_ZONES,
  },
  {
    code: "OWI",
    title: "Ownership Intelligence",
    tagline: "How strong is your ownership culture?",
    description: "Measures ownership behaviours — initiative, accountability, reliability, problem ownership, continuous improvement, and proactive behaviour.",
    icon: "🏆",
    estimatedMinutes: 8,
    dimensions: OWI_DIMENSIONS,
    questions: OWI_QUESTIONS,
    zones: STANDARD_ZONES,
  },
];

export function getMepDiagnostic(code: string): MepDiagnostic | undefined {
  return MEP_DIAGNOSTICS.find((d) => d.code === code);
}

/**
 * Score a diagnostic submission.
 * Returns dimension scores (0–100) and overall score (0–100).
 */
export function scoreMepDiagnostic(
  diagnostic: MepDiagnostic,
  responses: Record<string, number>
): { dimensionScores: Record<string, number>; overallScore: number; zone: string } {
  const dimensionScores: Record<string, number> = {};

  for (const dim of diagnostic.dimensions) {
    const dimQuestions = diagnostic.questions.filter((q) => q.dimensionId === dim.id);
    if (dimQuestions.length === 0) continue;

    const total = dimQuestions.reduce((sum, q) => {
      const raw = responses[q.id] ?? 3;
      const score = q.reversed ? 6 - raw : raw;
      return sum + score;
    }, 0);

    const avg = total / dimQuestions.length; // 1–5
    dimensionScores[dim.id] = Math.round(((avg - 1) / 4) * 100); // normalise to 0–100
  }

  const dimValues = Object.values(dimensionScores);
  const overallScore = dimValues.length > 0
    ? Math.round(dimValues.reduce((a, b) => a + b, 0) / dimValues.length)
    : 0;

  const zone = diagnostic.zones.find((z) => overallScore >= z.min && overallScore <= z.max)?.label ?? "Developing";

  return { dimensionScores, overallScore, zone };
}
