export const CTDM_DISCLAIMER =
  "This is a developmental diagnostic of decision practices. It is not a validated psychometric or intelligence test and must not be used for selection, promotion, performance ranking, disciplinary action, or claims about fixed traits.";

export const CTDM_RESPONSE_SCALE = [
  { value: 1, label: "Rarely or never" },
  { value: 2, label: "Occasionally" },
  { value: 3, label: "Sometimes" },
  { value: 4, label: "Usually" },
  { value: 5, label: "Consistently" },
  { value: 0, label: "N/A — insufficient opportunity to observe or apply" },
] as const;

export const CTDM_ENVIRONMENT_SCALE = [
  { value: 1, label: "Strongly untrue here" },
  { value: 2, label: "Mostly untrue here" },
  { value: 3, label: "Mixed or inconsistent" },
  { value: 4, label: "Mostly true here" },
  { value: 5, label: "Strongly true here" },
  { value: 0, label: "N/A — unable to assess" },
] as const;

export type CriticalThinkingDimensionId =
  | "frame"
  | "question"
  | "evidence"
  | "options"
  | "challenge"
  | "decide"
  | "learn";

export type CriticalThinkingDimension = {
  id: CriticalThinkingDimensionId;
  label: string;
  definition: string;
  subFactors: string[];
  risks: string[];
  individualPractice: string;
  teamPractice: string;
  leaderBehaviour: string;
  reusableTool: string;
  reflectionQuestion: string;
  feedback: {
    strong: string;
    moderate: string;
    priority: string;
  };
};

export const CTDM_DIMENSIONS: CriticalThinkingDimension[] = [
  {
    id: "frame",
    label: "FRAME",
    definition: "Define the real decision, outcome, owner, boundaries, constraints, and relevant stakeholder perspectives before solving it.",
    subFactors: ["problem versus symptom", "decision rights", "outcome and scope", "stakeholder perspective", "reframing"],
    risks: ["loaded framing", "solution jumping", "assumed constraints"],
    individualPractice: "Before an important decision, write one sentence naming the decision, owner, desired outcome, and boundary.",
    teamPractice: "Start consequential meetings with a shared decision statement before discussing solutions.",
    leaderBehaviour: "Ask what decision is actually required before approving an answer or recommendation.",
    reusableTool: "Problem-framing questions",
    reflectionQuestion: "What changed when I defined the decision rather than the symptom?",
    feedback: {
      strong: "You tend to make the decision visible before moving into solution mode, which reduces the risk of solving the wrong problem.",
      moderate: "You recognise the value of clarity, but may benefit from making decision ownership and boundaries explicit more consistently.",
      priority: "Build a short framing pause into important decisions: decision, owner, outcome, scope, constraints, and stakeholder impact.",
    },
  },
  {
    id: "question",
    label: "QUESTION",
    definition: "Surface, prioritise, and test the assumptions that shape a decision.",
    subFactors: ["fact versus interpretation", "assumption discovery", "consequence and uncertainty", "testability", "updating"],
    risks: ["shared assumptions", "outdated constraints", "unexamined beliefs"],
    individualPractice: "For one current decision, list three assumptions and mark which would be most costly if wrong.",
    teamPractice: "Use the question, ‘What would have to be true?’ before committing to a recommendation.",
    leaderBehaviour: "Invite the team to identify which assumption would most change the decision if it proved false.",
    reusableTool: "Assumption map / What would have to be true?",
    reflectionQuestion: "Which belief was treated as fact, and how could it be tested?",
    feedback: {
      strong: "You are likely to make hidden assumptions discussable and revisit them when conditions move.",
      moderate: "You question some assumptions, but may need a more deliberate routine for prioritising and testing the consequential ones.",
      priority: "Convert one key assumption into a testable statement and agree what evidence would update the view.",
    },
  },
  {
    id: "evidence",
    label: "EVIDENCE",
    definition: "Assess the relevance, reliability, recency, limits, and decision value of available evidence.",
    subFactors: ["source quality", "sample and perspective", "alternative explanations", "disconfirming evidence", "value of information"],
    risks: ["confirmation bias", "anecdotes", "correlation mistaken for causation", "weak samples"],
    individualPractice: "Run a five-minute evidence audit: source, recency, representativeness, missing view, and what would change the decision.",
    teamPractice: "Ask one person to state the strongest evidence against the leading interpretation.",
    leaderBehaviour: "Reward proportionate evidence gathering and ask what additional information would materially change the choice.",
    reusableTool: "Evidence audit and disconfirming-evidence threshold",
    reflectionQuestion: "What evidence did I give too much weight, and what relevant evidence was missing?",
    feedback: {
      strong: "You tend to distinguish the signal from its interpretation and look for evidence that could change your view.",
      moderate: "You use evidence, but may improve by checking whether it is representative and by looking more actively for alternatives.",
      priority: "Before your next recommendation, name the evidence that would disconfirm it and decide whether obtaining it is proportionate.",
    },
  },
  {
    id: "options",
    label: "OPTIONS",
    definition: "Generate materially different paths, including staged, reversible, hybrid, and status-quo choices before evaluation.",
    subFactors: ["alternative generation", "false binary avoidance", "reversibility", "opportunity cost", "second-order effects"],
    risks: ["premature closure", "default bias", "false binaries", "lost optionality"],
    individualPractice: "Require three materially different options, including one staged or reversible option, before evaluating a preferred path.",
    teamPractice: "Separate option generation from option evaluation for the first ten minutes of a decision discussion.",
    leaderBehaviour: "Ask what a pilot, sequence, segmentation, hybrid, or deliberate wait would make possible.",
    reusableTool: "Option-generation prompts and reversibility matrix",
    reflectionQuestion: "Which future choice would this option preserve or close?",
    feedback: {
      strong: "You appear to avoid collapsing complex choices into an artificial either-or decision.",
      moderate: "You can generate alternatives, but may benefit from making reversibility and opportunity cost more explicit.",
      priority: "Add a staged option and a ‘do nothing for now’ option before selecting the preferred path.",
    },
  },
  {
    id: "challenge",
    label: "CHALLENGE",
    definition: "Stress-test a developing judgment through constructive dissent, failure-path analysis, and safeguards.",
    subFactors: ["dissent", "premortem", "counterevidence", "hierarchy awareness", "risk safeguards"],
    risks: ["groupthink", "authority bias", "defensiveness", "token challenge"],
    individualPractice: "Ask a trusted colleague to make the strongest case against your current recommendation before commitment.",
    teamPractice: "Use a short premortem: imagine the choice failed six months from now and identify likely failure paths.",
    leaderBehaviour: "Invite dissent before stating a preferred answer and respond to challenge with curiosity rather than penalty.",
    reusableTool: "Premortem / devil’s advocate / red team",
    reflectionQuestion: "Whose concern did I not hear, and what safeguard could address it?",
    feedback: {
      strong: "You make constructive challenge part of the decision process and translate risks into sensible safeguards.",
      moderate: "You welcome some challenge, but could make dissent less dependent on confidence, hierarchy, or timing.",
      priority: "Use a premortem before the next high-consequence decision and assign ownership to its top safeguard.",
    },
  },
  {
    id: "decide",
    label: "DECIDE",
    definition: "Make a proportionate, defensible choice with explicit criteria, trade-offs, confidence, accountability, and review triggers.",
    subFactors: ["criteria", "trade-offs", "stakes and speed", "reversibility", "accountability and communication"],
    risks: ["analysis paralysis", "hidden trade-offs", "false certainty", "unclear decision rights"],
    individualPractice: "State the decision criteria and one non-negotiable trade-off before comparing options.",
    teamPractice: "Use a short criteria matrix for consequential choices, then record the owner, confidence range, and review trigger.",
    leaderBehaviour: "Match deliberation time to stakes and reversibility, then clarify who decides and why.",
    reusableTool: "Decision-criteria matrix and confidence range",
    reflectionQuestion: "Was the chosen speed proportionate to the stakes, reversibility, and cost of delay?",
    feedback: {
      strong: "You tend to make trade-offs and accountability visible rather than waiting for artificial certainty.",
      moderate: "You reach decisions, but may gain value from clearer criteria, confidence ranges, or review triggers.",
      priority: "For the next important choice, define criteria before evaluating options and state the confidence range with one review trigger.",
    },
  },
  {
    id: "learn",
    label: "LEARN",
    definition: "Review decisions against their assumptions and predictions, separating decision quality from outcome and updating future practice.",
    subFactors: ["decision record", "predictions", "review trigger", "outcome versus process", "shared learning"],
    risks: ["hindsight bias", "outcome bias", "blame", "repeated errors"],
    individualPractice: "Keep a one-page decision journal: rationale, assumptions, confidence, prediction, review date, and lesson.",
    teamPractice: "Hold brief non-blaming decision reviews that compare what was expected with what occurred.",
    leaderBehaviour: "Praise sound process as well as positive results and model revising a decision when evidence changes.",
    reusableTool: "Decision journal and decision review",
    reflectionQuestion: "What did the outcome teach me about my reasoning rather than about my worth or competence?",
    feedback: {
      strong: "You are likely to preserve the reasoning trail and use outcomes to update future judgment without relying on hindsight.",
      moderate: "You reflect after decisions, but may make learning more reliable by recording predictions and review triggers in advance.",
      priority: "Record one upcoming decision with its rationale, confidence, and prediction; revisit it on a pre-agreed date.",
    },
  },
];

export type BehaviourItem = {
  id: string;
  dimensionId: CriticalThinkingDimensionId;
  subFactor: string;
  wording: string;
  reverseScored?: boolean;
  biasSafeguard?: boolean;
  intellectualHabit?: boolean;
  rationale: string;
  interpretationRisk?: string;
};

export const CTDM_BEHAVIOUR_ITEMS: BehaviourItem[] = [
  { id: "ctdm_b01", dimensionId: "frame", subFactor: "decision definition", wording: "Before I work on an important issue, I state the decision that needs to be made.", rationale: "Assesses explicit decision definition.", interpretationRisk: "May need adaptation where decisions are highly procedural." },
  { id: "ctdm_b02", dimensionId: "frame", subFactor: "outcome and ownership", wording: "I clarify who will decide and what a useful outcome should achieve.", rationale: "Assesses decision rights and intended outcome.", interpretationRisk: "Authority may be formally assigned in some roles." },
  { id: "ctdm_b03", dimensionId: "frame", subFactor: "constraints", wording: "I check whether a stated constraint is real, current, and within the decision boundary.", intellectualHabit: true, rationale: "Assesses scrutiny of constraints without assuming they are invalid.", interpretationRisk: "Not all participants can challenge organisational constraints." },
  { id: "ctdm_b04", dimensionId: "frame", subFactor: "solution jumping", wording: "I move into a familiar solution before checking whether the issue has been framed accurately.", reverseScored: true, rationale: "Assesses premature solution focus.", interpretationRisk: "A familiar solution can be appropriate for low-stakes recurring work." },
  { id: "ctdm_b05", dimensionId: "question", subFactor: "fact and assumption", wording: "I separate what is known from what is assumed when a decision is uncertain.", rationale: "Assesses recognition of assumptions.", interpretationRisk: "Requires enough decision context to apply." },
  { id: "ctdm_b06", dimensionId: "question", subFactor: "assumption test", wording: "I ask what would have to be true for a preferred option to work.", biasSafeguard: true, rationale: "Assesses testable assumption practice.", interpretationRisk: "Should not be read as a requirement for lengthy analysis." },
  { id: "ctdm_b07", dimensionId: "question", subFactor: "assumption priority", wording: "I focus first on assumptions that are both uncertain and consequential.", rationale: "Assesses proportionate prioritisation.", interpretationRisk: "People may need support to estimate consequences." },
  { id: "ctdm_b08", dimensionId: "question", subFactor: "updating", wording: "Once a team has agreed an explanation, I find it hard to revisit the assumptions behind it.", reverseScored: true, intellectualHabit: true, rationale: "Assesses willingness to revise a shared view.", interpretationRisk: "A stable decision can sometimes be appropriate after review." },
  { id: "ctdm_b09", dimensionId: "evidence", subFactor: "source quality", wording: "I check whether evidence is relevant, reliable, recent, and representative enough for the decision.", rationale: "Assesses evidence-quality judgment.", interpretationRisk: "Information access differs across roles." },
  { id: "ctdm_b10", dimensionId: "evidence", subFactor: "observation and interpretation", wording: "I distinguish an observation from the interpretation I place on it.", intellectualHabit: true, rationale: "Assesses precision in reasoning and language.", interpretationRisk: "Wording may require translation care." },
  { id: "ctdm_b11", dimensionId: "evidence", subFactor: "alternative explanations", wording: "I look for a plausible explanation other than the one that first seems most likely.", biasSafeguard: true, rationale: "Assesses counter-confirmation practice.", interpretationRisk: "Not every decision warrants multiple explanations." },
  { id: "ctdm_b12", dimensionId: "evidence", subFactor: "anecdote weight", wording: "A vivid recent example can influence my view more than broader evidence.", reverseScored: true, biasSafeguard: true, rationale: "Assesses availability and anecdote risk.", interpretationRisk: "Anecdotes can signal a valuable issue requiring follow-up." },
  { id: "ctdm_b13", dimensionId: "options", subFactor: "alternative generation", wording: "Before evaluating a preferred path, I generate more than one materially different option.", rationale: "Assesses option generation before evaluation.", interpretationRisk: "For low-stakes routine decisions, this may be inefficient." },
  { id: "ctdm_b14", dimensionId: "options", subFactor: "reversibility", wording: "I consider whether a pilot, sequence, or smaller commitment would preserve future choices.", rationale: "Assesses reversible or staged thinking.", interpretationRisk: "Pilots may not be feasible in every context." },
  { id: "ctdm_b15", dimensionId: "options", subFactor: "opportunity cost", wording: "I consider what another option would make possible or prevent later.", rationale: "Assesses opportunity cost and optionality.", interpretationRisk: "Long-term implications are uncertain, not predictable." },
  { id: "ctdm_b16", dimensionId: "options", subFactor: "false binary", wording: "When two strong views emerge, I usually treat the choice as one option or the other.", reverseScored: true, rationale: "Assesses false-binary tendency.", interpretationRisk: "Some choices are genuinely binary." },
  { id: "ctdm_b17", dimensionId: "challenge", subFactor: "independent view", wording: "Before group estimates are discussed, I form or invite an independent view.", biasSafeguard: true, rationale: "Assesses anchoring countermeasure.", interpretationRisk: "May require facilitation in highly hierarchical settings." },
  { id: "ctdm_b18", dimensionId: "challenge", subFactor: "constructive dissent", wording: "I invite a credible case against a preferred recommendation before commitment.", biasSafeguard: true, intellectualHabit: true, rationale: "Assesses productive dissent and disconfirmation.", interpretationRisk: "Challenge must be psychologically safe to be useful." },
  { id: "ctdm_b19", dimensionId: "challenge", subFactor: "failure paths", wording: "I use likely failure paths to design safeguards, thresholds, or early-warning triggers.", rationale: "Assesses translation of challenge into action.", interpretationRisk: "Not every decision requires formal risk analysis." },
  { id: "ctdm_b20", dimensionId: "challenge", subFactor: "response to dissent", wording: "I become less open to input after I have publicly supported a decision.", reverseScored: true, biasSafeguard: true, intellectualHabit: true, rationale: "Assesses escalation-of-commitment risk.", interpretationRisk: "Self-report cannot confirm behaviour under genuine pressure." },
  { id: "ctdm_b21", dimensionId: "decide", subFactor: "criteria", wording: "I define the criteria that matter before comparing important options.", rationale: "Assesses criteria before option evaluation.", interpretationRisk: "Criteria can emerge during exploration and still need review." },
  { id: "ctdm_b22", dimensionId: "decide", subFactor: "trade-offs", wording: "I make the main trade-off visible rather than presenting a choice as cost-free.", intellectualHabit: true, rationale: "Assesses honest trade-off communication.", interpretationRisk: "Some details may be commercially sensitive." },
  { id: "ctdm_b23", dimensionId: "decide", subFactor: "proportionate speed", wording: "I adjust the speed and depth of my decision process to the stakes, reversibility, and cost of delay.", rationale: "Assesses proportionate decision effort.", interpretationRisk: "Individuals may have limited control over timelines." },
  { id: "ctdm_b24", dimensionId: "decide", subFactor: "certainty", wording: "I delay a decision because I am waiting for certainty that the situation cannot provide.", reverseScored: true, intellectualHabit: true, rationale: "Assesses artificial-certainty and delay risk.", interpretationRisk: "Delay can be prudent if new information is imminent and consequential." },
  { id: "ctdm_b25", dimensionId: "learn", subFactor: "decision record", wording: "For consequential decisions, I record the rationale, key assumptions, and what I expect to happen.", rationale: "Assesses decision-journal practice.", interpretationRisk: "A short record is enough; this is not a documentation-volume measure." },
  { id: "ctdm_b26", dimensionId: "learn", subFactor: "review trigger", wording: "I set a review date or trigger when evidence could reasonably change the decision.", rationale: "Assesses active updating process.", interpretationRisk: "Not all decisions need a scheduled review." },
  { id: "ctdm_b27", dimensionId: "learn", subFactor: "process and outcome", wording: "When an outcome is positive, I still examine whether the reasoning was sound.", biasSafeguard: true, rationale: "Assesses outcome-bias countermeasure.", interpretationRisk: "Requires a culture that permits reflection on success." },
  { id: "ctdm_b28", dimensionId: "learn", subFactor: "hindsight", wording: "After an outcome is known, I tend to see the result as more predictable than it was at the time.", reverseScored: true, biasSafeguard: true, rationale: "Assesses hindsight-bias awareness through behaviour.", interpretationRisk: "Participants may not notice this tendency without a written prediction." },
];

export type EnvironmentItem = {
  id: string;
  category: "team climate" | "leadership behaviour" | "information access" | "decision governance" | "learning and reward";
  wording: string;
  rationale: string;
};

export const CTDM_ENVIRONMENT_ITEMS: EnvironmentItem[] = [
  { id: "ctdm_e01", category: "team climate", wording: "People can raise a well-reasoned concern here without being dismissed or penalised.", rationale: "Psychological safety for challenge." },
  { id: "ctdm_e02", category: "team climate", wording: "Views from people with less formal authority are actively invited before important decisions are closed.", rationale: "Hierarchy-sensitive inclusion." },
  { id: "ctdm_e03", category: "leadership behaviour", wording: "Leaders explain the key trade-offs behind consequential decisions.", rationale: "Models transparent decision reasoning." },
  { id: "ctdm_e04", category: "leadership behaviour", wording: "Leaders are willing to revisit a decision when meaningful new evidence appears.", rationale: "Models updating rather than rigidity." },
  { id: "ctdm_e05", category: "information access", wording: "The people making a decision can usually access relevant information in time to use it.", rationale: "Decision-relevant evidence access." },
  { id: "ctdm_e06", category: "information access", wording: "Different customer, operational, or stakeholder perspectives are available when they could affect a decision.", rationale: "Perspective diversity." },
  { id: "ctdm_e07", category: "decision governance", wording: "For important work, it is clear who recommends, who decides, and who is accountable for follow-through.", rationale: "Decision-right clarity." },
  { id: "ctdm_e08", category: "decision governance", wording: "The time available for a decision is usually proportionate to its stakes and reversibility.", rationale: "Proportionate deliberation conditions." },
  { id: "ctdm_e09", category: "learning and reward", wording: "After important decisions, this organisation reviews reasoning and assumptions as well as the outcome.", rationale: "Process learning." },
  { id: "ctdm_e10", category: "learning and reward", wording: "People are recognised for surfacing risks or revising a view when evidence changes.", rationale: "Reward signal for decision quality." },
];

export const CTDM_REFLECTIVE_QUESTIONS = [
  { id: "ctdm_r01", prompt: "Without naming confidential people or organisations, describe a recent decision you handled well. What did you do that helped?" },
  { id: "ctdm_r02", prompt: "What recurring difficulty tends to affect your decision process when stakes, uncertainty, or social pressure rise?" },
  { id: "ctdm_r03", prompt: "Which one decision practice would you most like to strengthen over the next 30 days, and in what type of decision?" },
] as const;

export type ScenarioOption = {
  id: string;
  label: string;
  score: number;
  rationale: string;
  demonstrated: string[];
};

export type CriticalThinkingScenario = {
  id: string;
  title: string;
  context: string;
  text: string;
  dimensions: CriticalThinkingDimensionId[];
  embeddedRisks: string[];
  reversibility: string;
  delayCost: string;
  options: ScenarioOption[];
  facilitatorNote: string;
};

export const CTDM_SCENARIOS: CriticalThinkingScenario[] = [
  {
    id: "ctdm_s01", title: "A launch date under pressure", context: "Product or service launch", dimensions: ["frame", "evidence", "options", "decide"], reversibility: "Partly reversible; public trust effects are harder to reverse.", delayCost: "A two-week delay may affect a contracted customer commitment.", embeddedRisks: ["sunk-cost thinking", "authority pressure", "availability bias"],
    text: "Your team is due to launch a new client portal in ten days. A senior sponsor has already mentioned the date publicly. Internal testing is strong, but a pilot with three customers found one severe workflow failure and two confusing steps. The pilot group is small and includes a customer with an unusually complex process. Engineering says a fix is possible in two weeks; sales says postponement could put a renewal at risk. You need to recommend a path tomorrow.",
    options: [
      { id: "a", label: "Keep the full launch date because the pilot is too small to outweigh the sponsor’s commitment.", score: 1, rationale: "Dismisses relevant risk and treats limited evidence as no evidence.", demonstrated: ["misses evidence quality", "misses reversibility"] },
      { id: "b", label: "Delay the entire launch until every issue is resolved and no customer could be confused.", score: 3, rationale: "Protects quality but sets an unrealistic certainty threshold and does not test a proportionate alternative.", demonstrated: ["acknowledges risk", "misses proportionate decision speed"] },
      { id: "c", label: "Release only to low-complexity customers, fix the severe workflow, set adoption triggers, and explain the staged recommendation to the sponsor and sales lead.", score: 5, rationale: "Balances evidence limits, customer impact, reversibility, and delay cost with explicit safeguards.", demonstrated: ["staged option", "criteria", "review triggers"] },
      { id: "d", label: "Ask the sponsor to decide immediately because the commercial consequence is their responsibility.", score: 2, rationale: "Clarifies escalation but abandons the team’s responsibility to present a reasoned recommendation.", demonstrated: ["partial decision-right clarity", "misses analysis"] },
      { id: "e", label: "Run more pilot interviews for a week, then decide whether to launch on the original date.", score: 4, rationale: "Improves evidence, but may not be the fastest route to a defensible decision; it is reasonable if the new sample can materially resolve uncertainty quickly.", demonstrated: ["evidence gathering", "conditional value of information"] },
    ], facilitatorNote: "Discuss why C is strongest while E can be defensible if the added evidence is available before the commitment point and changes the release decision." },
  {
    id: "ctdm_s02", title: "A familiar candidate", context: "Hiring or promotion", dimensions: ["question", "evidence", "challenge", "decide"], reversibility: "Moderately reversible; a poor appointment has team and trust consequences.", delayCost: "The role has been vacant for three months and the team is stretched.", embeddedRisks: ["halo effect", "authority bias", "confirmation bias"],
    text: "A director strongly favours a well-liked internal candidate for a team-lead role, citing their reliability and institutional knowledge. Two panel members note that the candidate has not led people before and that the role requires handling difficult cross-functional priorities. External applicants have more directly relevant experience but would need time to learn the business. The director asks the panel to move quickly so the team can stabilise.",
    options: [
      { id: "a", label: "Recommend the internal candidate because a director’s confidence and business knowledge should carry the most weight.", score: 1, rationale: "Overweights authority and familiarity without testing role-relevant evidence.", demonstrated: ["misses decision criteria", "authority bias"] },
      { id: "b", label: "Reject all candidates and restart the search to avoid making a difficult trade-off.", score: 2, rationale: "Avoids a decision without showing why existing evidence is insufficient.", demonstrated: ["misses cost of delay"] },
      { id: "c", label: "Define role-critical criteria, use a structured work simulation, gather comparable evidence for finalists, and decide with a named probation and support plan.", score: 5, rationale: "Tests the consequential assumption with relevant evidence while respecting urgency and reversibility.", demonstrated: ["criteria", "evidence", "safeguards"] },
      { id: "d", label: "Choose the external applicant with the longest leadership history because experience is safer.", score: 2, rationale: "Uses a single convenient proxy and ignores organisational context and role fit.", demonstrated: ["misses trade-offs"] },
      { id: "e", label: "Appoint the internal candidate for an acting period while using agreed outcomes and feedback to confirm the permanent decision.", score: 4, rationale: "A reasonable staged option if governance permits and success measures are explicit; it can still create perceived unfairness if evidence for others is not comparable.", demonstrated: ["reversibility", "review trigger"] },
    ], facilitatorNote: "Explore how C and E differ in fairness, feasibility, and evidence quality." },
  {
    id: "ctdm_s03", title: "The budget cut", context: "Budget allocation", dimensions: ["frame", "options", "challenge", "decide"], reversibility: "Mixed; cutting capability-building may have longer-term effects.", delayCost: "A budget recommendation is due by end of day to protect quarterly cash targets.", embeddedRisks: ["recency bias", "false binary", "political pressure"],
    text: "Your function must reduce discretionary spend by 12% this quarter. Finance has suggested a simple cut to travel and learning budgets because those lines are visible and controllable. Managers say the proposed learning cut would pause a required capability programme just as a new system is being introduced. Travel includes both low-value conferences and site visits needed for operational improvement. The CFO wants one number today, not a long debate.",
    options: [
      { id: "a", label: "Accept the proposed cuts because finance owns the overall target and the lines are easy to reduce.", score: 1, rationale: "Treats a convenient framing as the decision and ignores differentiated consequences.", demonstrated: ["misses framing", "misses options"] },
      { id: "b", label: "Protect all learning and travel spend because investment should not be cut during change.", score: 2, rationale: "States a principle but avoids the required trade-off.", demonstrated: ["misses decision accountability"] },
      { id: "c", label: "Segment spend by value and reversibility, protect system-critical learning and necessary site visits, pause low-value travel, and propose a review trigger if savings fall short.", score: 5, rationale: "Reframes a line-item cut into a value and risk decision with a credible contingency.", demonstrated: ["segmentation", "trade-offs", "safeguards"] },
      { id: "d", label: "Request a week of detailed analysis before making any recommendation.", score: 3, rationale: "Could improve precision but may ignore the real timing constraint; viable only if a short extension is possible.", demonstrated: ["evidence", "misses urgency"] },
      { id: "e", label: "Split the required cut equally across every discretionary category to show fairness.", score: 2, rationale: "Uses a simple rule that may be fair in appearance but disregards differing value and consequence.", demonstrated: ["misses criteria"] },
    ], facilitatorNote: "The scenario tests whether the participant can provide a decision-ready recommendation rather than only ask for more analysis." },
  {
    id: "ctdm_s04", title: "A demanding customer", context: "Customer or client decision", dimensions: ["frame", "question", "options", "decide"], reversibility: "A one-off exception may establish a precedent.", delayCost: "The customer expects an answer within 24 hours and threatens to reduce spend.", embeddedRisks: ["loss aversion", "anchoring", "single-customer overreaction"],
    text: "A long-standing customer asks for a pricing exception that would reduce margin below your usual threshold. The account manager says the customer is strategically important and may expand internationally. Finance notes that similar exceptions have become informal precedents. You have limited information about the expansion plan, but the customer’s renewal is in six weeks.",
    options: [
      { id: "a", label: "Grant the exception immediately to protect the relationship and revisit margin later.", score: 1, rationale: "Lets short-term loss aversion override criteria and precedent risk.", demonstrated: ["misses trade-offs", "misses safeguards"] },
      { id: "b", label: "Refuse the exception because policy must be applied identically in every case.", score: 3, rationale: "Protects governance but may treat a policy as an unquestionable constraint without exploring legitimate alternatives.", demonstrated: ["clear boundary", "misses options"] },
      { id: "c", label: "Clarify the decision objective and evidence behind expansion, compare a time-bound conditional concession with non-price value options, and set approval and review conditions.", score: 5, rationale: "Tests the key assumption, creates alternatives, and makes precedent safeguards explicit.", demonstrated: ["assumption testing", "hybrid options", "criteria"] },
      { id: "d", label: "Ask the account manager to negotiate harder before deciding whether a concession is necessary.", score: 3, rationale: "May improve the position but does not establish the decision criteria or desired commercial outcome.", demonstrated: ["partial option exploration"] },
      { id: "e", label: "Offer the same exception to all similar customers so no one feels disadvantaged.", score: 1, rationale: "Magnifies a potentially weak decision without assessing value or precedent.", demonstrated: ["misses segmentation"] },
    ], facilitatorNote: "A defensible response should distinguish customer value, pricing policy, decision authority, and evidence for the claimed upside." },
  {
    id: "ctdm_s05", title: "An operational incident", context: "Operational incident", dimensions: ["evidence", "challenge", "decide", "learn"], reversibility: "Immediate containment is reversible; customer harm may not be.", delayCost: "Further incidents can occur every hour until the cause is contained.", embeddedRisks: ["availability bias", "premature causal attribution", "blame pressure"],
    text: "A fulfilment error has affected several orders this morning. A senior manager believes a new vendor process is the cause because the vendor changed last week. Operations data shows errors across two sites, including one that still uses the old vendor. Customer support wants a clear explanation for affected customers within two hours. The incident team is divided between immediately reversing the vendor change and first isolating the failure path.",
    options: [
      { id: "a", label: "Reverse the vendor change immediately and tell customers the cause has been identified.", score: 1, rationale: "Acts on an attractive explanation despite contradictory evidence and communicates unjustified certainty.", demonstrated: ["premature attribution"] },
      { id: "b", label: "Wait for a complete root-cause analysis before changing any process or communicating externally.", score: 2, rationale: "Protects accuracy but fails the need for proportionate containment and communication.", demonstrated: ["misses delay cost"] },
      { id: "c", label: "Contain the affected workflow, test the leading failure paths across both sites, give customers a factual update without claiming a cause, and schedule a decision review after the incident.", score: 5, rationale: "Separates containment from causal certainty and preserves learning.", demonstrated: ["proportionate action", "evidence", "learning"] },
      { id: "d", label: "Ask the senior manager to choose a cause so the team can act with one message.", score: 1, rationale: "Substitutes hierarchy for evidence.", demonstrated: ["authority bias"] },
      { id: "e", label: "Run the old and new vendor processes in parallel for the rest of the day, then compare error rates before acting further.", score: 4, rationale: "Can be a strong experiment if safe and operationally feasible, though it may be too slow if current harm continues.", demonstrated: ["controlled comparison", "conditional safeguards"] },
    ], facilitatorNote: "Assess the distinction between a containment action and a final causal explanation." },
  {
    id: "ctdm_s06", title: "A strategic investment", context: "Strategic investment", dimensions: ["question", "evidence", "options", "challenge"], reversibility: "Initial investment can be staged; a full multi-year commitment reduces flexibility.", delayCost: "Waiting six months may allow competitors to establish a position.", embeddedRisks: ["bandwagon effect", "overconfidence", "confirmation bias"],
    text: "Your executive team is considering a significant investment in an AI-enabled service because three competitors have announced similar moves. The business case projects rapid adoption based mainly on analyst forecasts and a small number of enthusiastic customer interviews. The technology team warns that implementation will require scarce data and change capacity. The CEO asks whether the company should commit the full budget this quarter.",
    options: [
      { id: "a", label: "Commit the full budget now because competitors’ moves show the market has already validated the opportunity.", score: 1, rationale: "Confuses competitor action with proof of fit and ignores execution constraints.", demonstrated: ["bandwagon effect"] },
      { id: "b", label: "Reject the investment until a market study can prove demand with certainty.", score: 2, rationale: "Sets an unrealistic standard and may surrender strategic optionality.", demonstrated: ["misses uncertainty management"] },
      { id: "c", label: "Test the demand and delivery assumptions through a defined pilot, compare a staged commitment with partnership or wait options, and agree evidence thresholds for scaling.", score: 5, rationale: "Makes core assumptions explicit, preserves flexibility, and sets a decision rule for investment.", demonstrated: ["assumptions", "staged options", "thresholds"] },
      { id: "d", label: "Ask each executive to state whether they support the investment, then follow the majority view.", score: 2, rationale: "Creates apparent participation without evidence or challenge discipline.", demonstrated: ["misses criteria"] },
      { id: "e", label: "Fund a limited technical prototype only, because capability building is useful regardless of market demand.", score: 4, rationale: "A defensible option if learning value and cost are modest, although it can under-test customer demand.", demonstrated: ["reversible learning", "partial evidence"] },
    ], facilitatorNote: "More data is not automatically better; test whether the next evidence step could change the scale decision." },
  {
    id: "ctdm_s07", title: "Continue, pause, or stop?", context: "Project continuation or termination", dimensions: ["frame", "challenge", "decide", "learn"], reversibility: "Stopping releases resources but may lose a partially built capability.", delayCost: "Continuing consumes another quarter of scarce specialist capacity.", embeddedRisks: ["sunk-cost thinking", "escalation of commitment", "political ownership"],
    text: "A transformation project is six months behind plan and has spent 70% of its budget. The project sponsor argues that stopping now would waste what has already been invested. A review shows that the original benefits case assumed a process volume that has since declined. The project team believes parts of the work could still be valuable if narrowed. The board needs a recommendation before the next funding cycle.",
    options: [
      { id: "a", label: "Continue exactly as planned because most of the budget has already been spent.", score: 1, rationale: "Treats sunk cost as a reason to continue rather than evaluating future value and alternatives.", demonstrated: ["sunk-cost thinking"] },
      { id: "b", label: "Cancel immediately to demonstrate financial discipline.", score: 3, rationale: "Avoids escalation but does not test whether a narrower option has positive forward-looking value.", demonstrated: ["recognises risk", "misses options"] },
      { id: "c", label: "Reframe around future value, compare stop, narrow, and redesign options against explicit criteria, invite an independent challenge, and record the decision rationale and review trigger.", score: 5, rationale: "Separates past investment from future value and creates a disciplined recommendation.", demonstrated: ["reframing", "independent challenge", "learning"] },
      { id: "d", label: "Ask the original sponsor to decide because they understand the project better than anyone else.", score: 2, rationale: "Relevant expertise matters, but the sponsor may be exposed to escalation and needs an independent challenge.", demonstrated: ["partial expertise recognition"] },
      { id: "e", label: "Pause the project for a quarter while collecting more stakeholder opinions.", score: 3, rationale: "Can create space for review but may impose a hidden delay cost unless the purpose, evidence, and decision date are clear.", demonstrated: ["conditional review"] },
    ], facilitatorNote: "This scenario distinguishes forward-looking value from justification of past investment." },
  {
    id: "ctdm_s08", title: "A policy change with uneven impact", context: "Policy or process change", dimensions: ["frame", "evidence", "options", "challenge"], reversibility: "The policy can be piloted but may affect trust if introduced unevenly.", delayCost: "The current process is creating avoidable compliance risk each month.", embeddedRisks: ["groupthink", "representativeness", "status quo bias"],
    text: "A central team proposes a new approval policy to reduce compliance risk. The design was tested with headquarters-based managers, who found it straightforward. Regional teams say the new process could delay urgent customer work because their decision paths differ. The compliance lead says exceptions will undermine the policy, while regional leaders say a uniform rollout will create workarounds. You are asked to advise on implementation.",
    options: [
      { id: "a", label: "Roll out the standard policy everywhere because a single process is easier to govern.", score: 2, rationale: "Values consistency but does not test whether the pilot represented affected contexts or whether risk can be managed through design.", demonstrated: ["partial governance", "representativeness risk"] },
      { id: "b", label: "Let each region keep its current process because local leaders understand their customers best.", score: 2, rationale: "Respects local context but may abandon the compliance objective.", demonstrated: ["misses shared outcome"] },
      { id: "c", label: "Clarify the non-negotiable compliance outcome, analyse where regional workflows differ, pilot a common core with defined local pathways, and use adoption and risk data to decide on scale-up.", score: 5, rationale: "Frames the real objective and creates a governed hybrid option with learning.", demonstrated: ["reframing", "segmentation", "pilot"] },
      { id: "d", label: "Ask the compliance lead and regional heads to negotiate a compromise in a single meeting.", score: 3, rationale: "May surface interests, but a compromise alone is not evidence that the resulting design manages risk or workflow impact.", demonstrated: ["stakeholder input", "misses evidence"] },
      { id: "e", label: "Delay the change until every region has provided detailed feedback.", score: 3, rationale: "Improves participation but can be disproportionate if an urgent compliance risk remains unaddressed.", demonstrated: ["participation", "misses delay safeguard"] },
    ], facilitatorNote: "Explore the difference between standardising outcomes and standardising every process step." },
];

export type ScenarioResponse = { optionId: string; confidence: number };
export type CtdmAssessmentResponses = {
  behaviour: Record<string, number | undefined>;
  scenarios: Record<string, ScenarioResponse | undefined>;
  environment: Record<string, number | undefined>;
  reflections: Record<string, string | undefined>;
};

function normaliseFivePoint(average: number): number {
  return Math.round(((average - 1) / 4) * 100);
}

function average(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

export function scoreCriticalThinkingDiagnostic(responses: CtdmAssessmentResponses) {
  const dimensionScores: Partial<Record<CriticalThinkingDimensionId, number>> = {};
  const answeredCounts: Partial<Record<CriticalThinkingDimensionId, number>> = {};
  for (const dimension of CTDM_DIMENSIONS) {
    const values = CTDM_BEHAVIOUR_ITEMS.filter((item) => item.dimensionId === dimension.id)
      .map((item) => {
        const raw = responses.behaviour[item.id];
        if (typeof raw !== "number" || raw < 1 || raw > 5) return undefined;
        return item.reverseScored ? 6 - raw : raw;
      })
      .filter((value): value is number => typeof value === "number");
    answeredCounts[dimension.id] = values.length;
    if (values.length >= 3) dimensionScores[dimension.id] = normaliseFivePoint(average(values) ?? 1);
  }

  const behaviouralScore = average(Object.values(dimensionScores).filter((score): score is number => typeof score === "number"));
  const biasValues = CTDM_BEHAVIOUR_ITEMS.filter((item) => item.biasSafeguard).map((item) => {
    const raw = responses.behaviour[item.id];
    if (typeof raw !== "number" || raw < 1 || raw > 5) return undefined;
    return item.reverseScored ? 6 - raw : raw;
  }).filter((value): value is number => typeof value === "number");
  const habitValues = CTDM_BEHAVIOUR_ITEMS.filter((item) => item.intellectualHabit).map((item) => {
    const raw = responses.behaviour[item.id];
    if (typeof raw !== "number" || raw < 1 || raw > 5) return undefined;
    return item.reverseScored ? 6 - raw : raw;
  }).filter((value): value is number => typeof value === "number");
  const scenarioScores = CTDM_SCENARIOS.map((scenario) => {
    const response = responses.scenarios[scenario.id];
    const option = response ? scenario.options.find((candidate) => candidate.id === response.optionId) : undefined;
    return option ? normaliseFivePoint(option.score) : undefined;
  }).filter((value): value is number => typeof value === "number");
  const confidences = CTDM_SCENARIOS.map((scenario) => responses.scenarios[scenario.id]?.confidence)
    .filter((value): value is number => typeof value === "number" && value >= 0 && value <= 100);
  const environmentValues = CTDM_ENVIRONMENT_ITEMS.map((item) => responses.environment[item.id])
    .filter((value): value is number => typeof value === "number" && value >= 1 && value <= 5);
  const appliedJudgmentScore = average(scenarioScores);
  const meanConfidence = average(confidences);
  const environmentScore = average(environmentValues.map((value) => normaliseFivePoint(value)));
  const calibrationGap = appliedJudgmentScore !== null && meanConfidence !== null ? Math.round(meanConfidence - appliedJudgmentScore) : null;
  const calibration = getConfidenceCalibration(appliedJudgmentScore, calibrationGap);
  const environmentBand = environmentScore === null ? null : environmentScore < 45 ? "Constraining" : environmentScore < 75 ? "Mixed" : "Enabling";

  const rankedDimensions = CTDM_DIMENSIONS
    .map((dimension) => ({ dimension, score: dimensionScores[dimension.id] }))
    .filter((entry): entry is { dimension: CriticalThinkingDimension; score: number } => typeof entry.score === "number")
    .sort((a, b) => b.score - a.score);

  return {
    dimensionScores,
    answeredCounts,
    behaviouralScore: behaviouralScore === null ? null : Math.round(behaviouralScore),
    appliedJudgmentScore: appliedJudgmentScore === null ? null : Math.round(appliedJudgmentScore),
    biasManagementScore: biasValues.length >= 6 ? normaliseFivePoint(average(biasValues) ?? 1) : null,
    intellectualHabitsScore: habitValues.length >= 5 ? normaliseFivePoint(average(habitValues) ?? 1) : null,
    environmentScore: environmentScore === null ? null : Math.round(environmentScore),
    environmentBand,
    scenarioCount: scenarioScores.length,
    meanConfidence: meanConfidence === null ? null : Math.round(meanConfidence),
    calibrationGap,
    calibration,
    strengths: rankedDimensions.slice(0, 2).map((entry) => entry.dimension.id),
    priorities: rankedDimensions.slice(-2).reverse().map((entry) => entry.dimension.id),
    interpretation: getSelfReportScenarioInterpretation(behaviouralScore, appliedJudgmentScore),
  };
}

export function getConfidenceCalibration(appliedJudgmentScore: number | null, calibrationGap: number | null) {
  if (appliedJudgmentScore === null || calibrationGap === null) return { label: "Insufficient data", description: "Complete scenario choices and confidence ratings to see a calibration observation." };
  const strongJudgment = appliedJudgmentScore >= 60;
  if (strongJudgment && calibrationGap >= -15 && calibrationGap <= 15) return { label: "Strong judgment with appropriately high confidence", description: "Your scenario choices and stated confidence are broadly aligned in this brief sample." };
  if (strongJudgment && calibrationGap < -15) return { label: "Strong judgment with underconfidence", description: "Your scenario choices were stronger than your expressed confidence suggests. Treat this as a prompt to inspect, not inflate, confidence." };
  if (!strongJudgment && calibrationGap <= 15) return { label: "Weak judgment with appropriate uncertainty", description: "Your uncertainty is a useful signal. Focus on strengthening the decision practices that would improve future choices." };
  return { label: "Weak judgment with overconfidence", description: "Your confidence was materially higher than this brief scenario sample supports. Use disconfirming evidence and review triggers before commitment." };
}

export function getSelfReportScenarioInterpretation(behaviouralScore: number | null, appliedJudgmentScore: number | null) {
  if (behaviouralScore === null || appliedJudgmentScore === null) return "Complete both behavioural and scenario components to compare reported practice with applied judgment.";
  const behaviouralStrong = behaviouralScore >= 60;
  const scenarioStrong = appliedJudgmentScore >= 60;
  if (behaviouralStrong && scenarioStrong) return "Your reported practices and scenario choices both indicate useful decision discipline. Focus on applying it proportionately under pressure.";
  if (behaviouralStrong && !scenarioStrong) return "Your reported practices are stronger than this scenario sample. Explore where pressure, trade-offs, or context make the process harder to apply.";
  if (!behaviouralStrong && scenarioStrong) return "Your scenario choices are stronger than your reported consistency. Identify the conditions and routines that help you use this judgment more reliably.";
  return "Both components point to a developmental opportunity. Choose one decision routine to practise in a live, proportionate setting.";
}

export const CTDM_PROFICIENCY_LEVELS = ["Reactive", "Emerging", "Disciplined", "Adaptive", "Enabling"] as const;
export type CtdmProficiencyLevel = typeof CTDM_PROFICIENCY_LEVELS[number];

export const CTDM_PROFICIENCY_MATRIX: Record<CriticalThinkingDimensionId, Record<CtdmProficiencyLevel, string>> = {
  frame: { Reactive: "Acts on the first stated problem or authority view.", Emerging: "Clarifies parts of the issue but may leave owner or scope implicit.", Disciplined: "Defines decision, outcome, owner, scope, and constraints for important work.", Adaptive: "Reframes decisions to fit stakeholders, uncertainty, and decision rights.", Enabling: "Creates shared framing routines that improve team decision quality." },
  question: { Reactive: "Treats familiar beliefs and constraints as facts.", Emerging: "Notices some assumptions when prompted.", Disciplined: "Surfaces, prioritises, and tests consequential assumptions.", Adaptive: "Updates assumptions as conditions change and adjusts the inquiry.", Enabling: "Builds team habits that make safe challenge of assumptions routine." },
  evidence: { Reactive: "Relies on urgency, anecdote, or the most available information.", Emerging: "Checks evidence selectively.", Disciplined: "Assesses evidence quality and seeks relevant alternatives.", Adaptive: "Balances value of information with timing, uncertainty, and stakes.", Enabling: "Improves how teams access, interpret, and challenge evidence." },
  options: { Reactive: "Defaults to precedent or a familiar binary.", Emerging: "Generates alternatives inconsistently.", Disciplined: "Creates materially different options before evaluation.", Adaptive: "Uses pilots, sequencing, and reversibility to preserve choice.", Enabling: "Designs team routines that increase strategic optionality." },
  challenge: { Reactive: "Avoids or dismisses dissent under pressure.", Emerging: "Accepts challenge when it is easy or familiar.", Disciplined: "Invites counterevidence and examines likely failure paths.", Adaptive: "Adjusts challenge methods to hierarchy, risk, and decision stage.", Enabling: "Creates psychological safety and safeguards that make dissent useful." },
  decide: { Reactive: "Relies on urgency, intuition, precedent, or authority.", Emerging: "Uses some criteria but trade-offs remain implicit.", Disciplined: "Uses explicit criteria, trade-offs, accountability, and review triggers.", Adaptive: "Matches speed and depth to stakes, uncertainty, reversibility, and delay.", Enabling: "Improves governance and decision discipline across teams." },
  learn: { Reactive: "Judges decisions mainly by the outcome after it is known.", Emerging: "Reflects informally but records little.", Disciplined: "Records rationale, predictions, and review points for consequential decisions.", Adaptive: "Uses outcomes and uncertainty to update future judgment without blame.", Enabling: "Builds learning reviews that improve the wider system." },
};

export const CTDM_GOVERNANCE = {
  appropriateUse: "Self-development, facilitated workshops, coaching, team development, and leadership development.",
  prohibitedUse: ["clinical assessment", "intelligence measurement", "employee selection", "promotion decisions", "disciplinary action", "performance ranking", "claims about immutable traits"],
  safeguards: ["Obtain informed consent and explain the developmental purpose before participation.", "Collect only information necessary for the diagnostic and avoid confidential operational detail in reflections.", "Keep individual results private to the participant unless they choose to share them.", "Use tenant-configured retention periods and provide participant access to their own results.", "Show team reporting only for groups of five or more and never rank or publicly compare individuals.", "Use human interpretation for development conversations; a brief diagnostic cannot establish a complete capability profile.", "Review language, accessibility, cultural context, and role relevance before wider use."],
  validationRoadmap: [
    { stage: "Construct-definition review", evidence: "Map items to the seven dimensions and cross-cutting constructs with 3–5 internal reviewers." },
    { stage: "Expert review", evidence: "Use 6–10 decision science, learning, organisational psychology, and practitioner experts." },
    { stage: "Cognitive interviews", evidence: "Interview 10–15 participants across target roles to check comprehension, retrieval, judgement, and response processes." },
    { stage: "Usability pilot", evidence: "Test completion, accessibility, timing, and report comprehension with roughly 20–40 users." },
    { stage: "Field pilot", evidence: "Collect 100–200 early cases for item distribution, missingness, and initial item-total patterns." },
    { stage: "Scale study", evidence: "Seek 300–500+ cases where feasible for internal consistency, factor exploration, self-report/scenario comparison, and subgroup review." },
    { stage: "Factor evidence", evidence: "Treat common rules such as 5–10 participants per item and at least 200 cases as exploratory guidance, not strict guarantees; use a separate holdout sample for confirmatory work where possible." },
    { stage: "Stability and validity", evidence: "Use 100+ retest participants over roughly 2–4 weeks where practical; examine convergent, discriminant, and only defensible criterion evidence." },
    { stage: "Fairness and norms", evidence: "Assess measurement invariance and adverse impact across meaningful groups only when sample sizes and ethical use support it; develop norms only after adequate representative data exists." },
    { stage: "Ongoing monitoring", evidence: "Monitor item performance, completion patterns, accessibility feedback, scenario functioning, and unintended consequences over time." },
  ],
  qualityAudit: ["Items are single-principal-construct by design, though local role and cultural adaptation should be cognitively tested.", "Self-report items retain social-desirability risk; scenario choices and reflective discussion provide complementary—not definitive—evidence.", "Scenario options are intentionally plausible and context-sensitive; no response is presented as universally correct outside the scenario conditions.", "Scores are transparent developmental signals, not validated cut scores; internal consistency alone would not establish validity.", "Reading-level and cultural-language adaptation must be reviewed before deployment outside the intended workplace audience."],
};

export const CTDM_PARTICIPANT_REPORT_SPEC = {
  sections: [
    "Developmental purpose and appropriate-use reminder",
    "Seven-dimension capability profile with relative strengths and priorities",
    "Applied-judgment result from scenario choices",
    "Confidence-calibration observation, explicitly limited by the eight-scenario sample",
    "Separate bias-management and intellectual-habits developmental signals",
    "Separate decision-environment result and Constraining / Mixed / Enabling observation",
    "Two demonstrated strengths and two development priorities",
    "Dimension-specific practice, team routine, leader behaviour, reusable tool, and reflection question",
    "Thirty-day plan with a weekly practice rhythm and participant reflection prompts",
    "Limitations and developmental-use reminder",
  ],
  dataFields: ["dimensionScores", "appliedJudgmentScore", "meanConfidence", "calibration", "biasManagementScore", "intellectualHabitsScore", "environmentScore", "environmentBand", "strengths", "priorities", "reflections", "completedAt"],
  privacyRule: "A participant can view only their own individual report. Tenant administrators see individual data only when explicit tenant policy and participant consent permit it; otherwise, they see aggregates only.",
};

export const CTDM_TEAM_REPORT_SPEC = {
  minimumGroupSize: 5,
  sections: [
    "Eligible participant count and completion rate",
    "Average and distribution by core dimension",
    "Variation indicator for each dimension; do not show named individual scores",
    "Self-report versus scenario-performance gap at aggregate level",
    "Confidence-calibration pattern across the eligible group",
    "Shared strengths and development priorities",
    "Decision-environment enablers and constraints",
    "Potential hierarchy-suppression indicators from environment items",
    "Suggested team routines connected to the lowest aggregate dimensions",
    "Anonymity and non-ranking guidance",
  ],
  aggregationRule: "Withhold the report unless at least five completed participants belong to the same configured reporting group. Suppress small subgroups and free-text content that could identify individuals.",
  caution: "Team reports support development discussion, not employee ranking, evaluation, or talent decisions.",
};

export const CTDM_TENANT_ADMIN_SPEC = {
  configuration: [
    "Audience, role/seniority, industry, geography, intended use, administration mode, reading level, and report type",
    "Campaign name, reporting group, start/end dates, team-report minimum of five or higher, and data-retention period",
    "Participant privacy policy, consent statement, and whether admins may view named reports or aggregate insights only",
    "Tenant branding additions while preserving LevelNext core logo, navy, chrome yellow, ivory, and charcoal system",
  ],
  permissions: [
    { role: "Platform admin", access: "Create and manage tenants, review all tenant configurations, manage platform-level governance, and view operational completion metrics." },
    { role: "Tenant owner", access: "Configure tenant campaigns, assign tenant administrators, issue access invitations, view permitted reports and eligible aggregates." },
    { role: "Tenant admin", access: "Manage campaigns and participants within their tenant, monitor completion, and view only policy-permitted named reports or anonymised aggregates." },
    { role: "Participant", access: "Start, resume, complete, and view only their own diagnostic and development plan." },
  ],
  workflows: [
    "Create a tenant-scoped campaign from the standard instrument and set its context, policy, and reporting configuration.",
    "Invite or enrol participants; each invitation resolves to its tenant and campaign and cannot be used outside that scope.",
    "Save a participant’s responses privately, calculate separate result components at submission, and present the individual report.",
    "Allow tenant administrators to monitor invited, in-progress, and complete counts without exposing individual answers by default.",
    "Generate a team report only after the configured anonymity threshold is met; never provide rank ordering or small-cell disclosure.",
    "Archive or delete campaign data according to the configured retention rule and record administrative changes for audit.",
  ],
  persistence: [
    "ctdm_campaigns: tenantId, name, reportingGroup, context fields, privacy policy, minTeamSize, start/end, retention, status, createdBy.",
    "ctdm_participants: campaignId, userId or invitedEmail, display fields, consentAt, status, invitedAt, completedAt.",
    "ctdm_responses: campaignId, participantId, behaviour/scenario/environment/reflection JSON, current section, timestamps.",
    "ctdm_reports: campaignId, participantId, score snapshot JSON, report narrative, completedAt; tenant-scoped indexes.",
    "ctdm_admin_audit: tenantId, actorUserId, action, target type/id, timestamp, non-sensitive metadata.",
  ],
  apiContracts: [
    "campaigns.list/create/update/close — tenant-scoped, owner/admin guarded.",
    "participants.list/invite/remove — tenant-scoped, owner/admin guarded.",
    "assessment.start/save/submit/getMyReport — participant ownership and campaign membership guarded.",
    "admin.dashboard/getAggregateReport — tenant-scoped and minimum-group-size guarded.",
    "platform.tenants.list/create — platform-admin guarded.",
  ],
};
