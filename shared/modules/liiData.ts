// ─── LII Diagnostic Data ─────────────────────────────────────────────────────
// All 10 dimensions, 30 questions, archetypes, scoring bands, and development advice

export const LII_DIMENSIONS = [
  {
    id: "trust_capital",
    name: "Trust Capital",
    shortName: "Trust",
    definition:
      "The degree to which others trust your judgment, intent, reliability and consistency when stakes are high.",
    whyItMatters:
      "Without trust capital, every interaction requires proof and verification. High trust capital reduces friction, accelerates decision-making, and allows leaders to influence based on credibility rather than positional authority.",
    questionIds: [1, 12, 21],
    scoring: {
      excellent: "Exemplary trust capital. You are viewed as a highly credible and reliable leader. People rarely question your motives and trust your judgment implicitly. Your consistency under pressure is a genuine competitive advantage.",
      good: "Strong trust capital. You are generally seen as reliable and fair, though there may be occasional inconsistencies or specific stakeholder groups where trust could be deeper.",
      developing: "Developing trust capital. Trust may be conditional or transactional. Stakeholders might require more verification or question your alignment with their interests during high-stress situations.",
      atRisk: "Significant trust deficit. Your influence is likely severely limited by a lack of perceived reliability, fairness, or consistent principles. Rebuilding credibility is an urgent priority.",
    },
    development: {
      strengths: "High credibility, predictability, and fairness across stakeholder groups.",
      blindSpots: "Assuming trust is universal; failing to explicitly communicate the principles behind difficult decisions.",
      practicalActions: "Explicitly state the 'why' behind your decisions. Proactively manage expectations when commitments must change. Create a personal 'operating principles' document and share it with key stakeholders.",
      coachingQuestion: "How can you make your decision-making principles more visible to those who don't work with you daily?",
    },
  },
  {
    id: "stakeholder_alignment",
    name: "Stakeholder Alignment",
    shortName: "Alignment",
    definition:
      "The ability to bring people with different agendas, constraints and incentives around a shared direction.",
    whyItMatters:
      "Complex organizational goals require cross-functional cooperation. Leaders who can align disparate stakeholders create momentum and shared ownership, preventing initiatives from stalling due to conflicting priorities.",
    questionIds: [3, 11, 22],
    scoring: {
      excellent: "Masterful alignment capability. You consistently bridge silos, resolve competing priorities, and forge shared ownership across diverse stakeholder groups. You are the person others call when alignment breaks down.",
      good: "Effective alignment. You successfully navigate most stakeholder dynamics, though highly entrenched conflicts or complex cross-functional issues may still pose challenges.",
      developing: "Inconsistent alignment. You may struggle to move stakeholders past their functional silos or fail to uncover the underlying interests driving their positions.",
      atRisk: "Poor alignment skills. Initiatives likely stall due to unresolved stakeholder friction or lack of shared ownership. You may rely too heavily on authority rather than consensus.",
    },
    development: {
      strengths: "Ability to synthesize differing viewpoints and forge common ground across organizational boundaries.",
      blindSpots: "Over-indexing on consensus at the expense of speed; missing subtle, unspoken stakeholder incentives.",
      practicalActions: "Map stakeholder incentives before major initiatives. Practice articulating the 'win' for each key player. Run a stakeholder interest analysis before your next cross-functional meeting.",
      coachingQuestion: "Where are you currently mistaking compliance for genuine alignment?",
    },
  },
  {
    id: "decision_influence",
    name: "Decision Influence",
    shortName: "Decision",
    definition:
      "The ability to shape important decisions before they are finalised through framing, reasoning and credibility.",
    whyItMatters:
      "The most critical decisions are often shaped before the formal meeting. Leaders who influence decisions early ensure their perspectives are integrated into the core strategy rather than treated as afterthoughts.",
    questionIds: [2, 13, 23],
    scoring: {
      excellent: "Exceptional decision influence. You proactively shape the narrative, frame the strategic context, and significantly impact outcomes before formal decisions are made. Senior leaders seek your perspective before committing.",
      good: "Solid decision influence. You effectively contribute to decision-making, though you may occasionally miss opportunities to frame the issue early or influence key stakeholders pre-meeting.",
      developing: "Reactive decision influence. You tend to react to decisions rather than shape them. Your framing may lack the strategic elevation required to shift executive thinking.",
      atRisk: "Minimal decision influence. You are likely excluded from critical decision-making processes or fail to impact outcomes when you are included. Your recommendations may be frequently dismissed.",
    },
    development: {
      strengths: "Strategic framing, proactive engagement, and compelling reasoning that shifts how others see options.",
      blindSpots: "Over-relying on logic while ignoring emotional or political factors; failing to socialize ideas early enough.",
      practicalActions: "Identify the 'meeting before the meeting' for your next major initiative. Pre-wire key stakeholders with your framing at least 48 hours before the formal decision point.",
      coachingQuestion: "How can you elevate your framing to connect more directly with the strategic priorities of your senior stakeholders?",
    },
  },
  {
    id: "coalition_building",
    name: "Coalition Building",
    shortName: "Coalition",
    definition:
      "The ability to build informal support networks, champions and alliances across functions and levels.",
    whyItMatters:
      "Formal authority is rarely sufficient for driving complex change. Coalitions provide the necessary informal power, resources, and advocacy to overcome organizational resistance and accelerate execution.",
    questionIds: [4, 14, 24],
    scoring: {
      excellent: "Outstanding coalition builder. You possess a robust, proactive network of champions and allies who advocate for your initiatives and provide critical support even when you are not in the room.",
      good: "Competent coalition builder. You maintain good relationships and can build support when needed, but may underinvest in cultivating networks proactively outside your immediate sphere.",
      developing: "Transactional coalition building. You likely only build relationships when you need something, resulting in weak alliances that may not withstand organizational pressure.",
      atRisk: "Isolated operator. You lack the necessary informal networks to drive cross-functional initiatives, making you overly reliant on formal authority or siloed execution.",
    },
    development: {
      strengths: "Proactive relationship management, network mapping, and cultivating champions across the organization.",
      blindSpots: "Focusing only on visible leaders while ignoring quiet influencers; failing to maintain relationships post-initiative.",
      practicalActions: "Map your critical network. Identify three cross-functional relationships to invest in this quarter without an immediate ask. Schedule a 'no agenda' coffee with someone outside your function.",
      coachingQuestion: "Who are the quiet influencers in your organization, and how can you build mutually beneficial relationships with them before you need their support?",
    },
  },
  {
    id: "organizational_navigation",
    name: "Organizational Navigation",
    shortName: "Navigation",
    definition:
      "The ability to understand formal structures, informal power, timing and organisational dynamics without becoming political or manipulative.",
    whyItMatters:
      "Organizations are complex ecosystems. Leaders who can read the unspoken dynamics, power structures, and timing can advance initiatives smoothly, avoiding political landmines and unnecessary friction.",
    questionIds: [5, 15, 25],
    scoring: {
      excellent: "Astute organizational navigator. You possess exceptional political intelligence, seamlessly reading the informal dynamics and timing your interventions perfectly to maximize impact without compromising integrity.",
      good: "Proficient navigator. You generally understand the organizational landscape, though you may occasionally misread complex political dynamics or misjudge the timing of sensitive issues.",
      developing: "Clumsy navigation. You may frequently encounter unexpected resistance due to a lack of awareness regarding informal power structures or poor timing in raising critical issues.",
      atRisk: "Politically blind. You likely operate based solely on the formal org chart, frequently stepping on political landmines and failing to grasp the underlying dynamics driving organizational behavior.",
    },
    development: {
      strengths: "Political intelligence, situational awareness, and strategic timing that advances initiatives without creating unnecessary friction.",
      blindSpots: "Becoming overly cynical or manipulative; over-analyzing dynamics at the expense of action.",
      practicalActions: "Before launching your next initiative, map the informal power dynamics. Identify who really holds influence over the outcome, regardless of title. Ask: who needs to say yes, who can say no, and who needs to feel heard?",
      coachingQuestion: "How can you improve your read of the informal organization without compromising your authenticity or integrity?",
    },
  },
  {
    id: "inspirational_leadership",
    name: "Inspirational Leadership",
    shortName: "Inspiration",
    definition:
      "The ability to make people willingly commit effort, ownership and energy beyond compliance with instructions.",
    whyItMatters:
      "Compliance yields minimum viable performance. Inspiration unlocks discretionary effort, creativity, and resilience, enabling teams to achieve extraordinary results even in challenging environments.",
    questionIds: [6, 16, 26],
    scoring: {
      excellent: "Highly inspirational leader. You consistently connect work to a compelling purpose, generating deep commitment, high discretionary effort, and genuine ownership from your teams. People follow you by choice.",
      good: "Effective motivator. You successfully engage your teams and create a positive environment, though you may occasionally struggle to connect routine execution to a broader, inspiring purpose.",
      developing: "Transactional leader. You likely rely on formal authority or incentives to drive performance, resulting in compliance rather than true ownership or discretionary effort.",
      atRisk: "Demotivating presence. Your leadership style may actively drain energy and commitment, leading to minimal compliance, low morale, and high turnover.",
    },
    development: {
      strengths: "Purpose-driven communication, fostering genuine ownership, and generating enthusiasm that outlasts the initial announcement.",
      blindSpots: "Assuming your purpose resonates with everyone; failing to connect the 'why' to the daily 'what' for each individual.",
      practicalActions: "Explicitly connect the next major project to the broader organizational purpose and the individual values of your team members. Ask each person: 'What part of this work matters most to you?'",
      coachingQuestion: "How can you shift your leadership approach from driving compliance to fostering genuine ownership that persists without your direct involvement?",
    },
  },
  {
    id: "change_mobilization",
    name: "Change Mobilization",
    shortName: "Change",
    definition:
      "The ability to create urgency, commitment, adoption and momentum for change across stakeholders.",
    whyItMatters:
      "Change initiatives frequently fail due to inertia and resistance. Leaders who can mobilize change overcome these forces, translating strategic intent into sustained, widespread adoption.",
    questionIds: [7, 17, 27],
    scoring: {
      excellent: "Exceptional change catalyst. You masterfully overcome inertia, drive deep commitment, and sustain momentum through the difficult middle phases of complex change initiatives. You understand that logic alone never drives adoption.",
      good: "Capable change driver. You successfully initiate change and gain initial agreement, but may struggle to sustain momentum or address deep-seated emotional resistance over time.",
      developing: "Ineffective change agent. You likely rely too heavily on logic and communication plans, failing to address the underlying fears and fatigue that stall adoption.",
      atRisk: "Change blocker. Your approach to change may inadvertently increase resistance or fail to generate the necessary urgency, leading to stalled or failed initiatives.",
    },
    development: {
      strengths: "Driving adoption, addressing emotional resistance, and sustaining momentum through the 'messy middle' of change.",
      blindSpots: "Underestimating change fatigue; assuming intellectual agreement equals behavioral commitment.",
      practicalActions: "Identify a stalled change initiative. Map the emotional resistance (fear, fatigue, loss of control) and design specific interventions to address each barrier directly rather than repeating the logic.",
      coachingQuestion: "How can you better support your team through the 'messy middle' of change when initial excitement fades and resistance hardens?",
    },
  },
  {
    id: "conflict_resistance",
    name: "Conflict & Resistance Management",
    shortName: "Conflict",
    definition:
      "The ability to influence constructively when people disagree, resist, negotiate or defend competing priorities.",
    whyItMatters:
      "Conflict is inevitable in complex organizations. Leaders who manage resistance constructively transform friction into better decisions, rather than allowing it to damage relationships or stall progress.",
    questionIds: [8, 18, 28],
    scoring: {
      excellent: "Masterful conflict navigator. You lean into constructive tension, expertly surfacing disagreements early, exploring resistance with curiosity, and maintaining strong relationships even during intense debates.",
      good: "Competent conflict manager. You handle disagreements well, though you may occasionally avoid difficult conversations or push too hard when faced with unexpected resistance.",
      developing: "Avoidant or aggressive conflict style. You likely either avoid necessary friction, leading to passive resistance, or overpower opposition, damaging relationships and trust.",
      atRisk: "Destructive conflict handler. Your approach to disagreement likely escalates tension, creates toxic dynamics, and fundamentally undermines your ability to influence others.",
    },
    development: {
      strengths: "Curiosity under pressure, emotional regulation, and the ability to hold firm on outcomes while staying constructive with people.",
      blindSpots: "Viewing resistance as a personal attack; prioritizing harmony over necessary debate that improves the outcome.",
      practicalActions: "Next time you face resistance, pause and ask two clarifying questions to explore the concern before defending your position. Practice the phrase: 'Help me understand what's driving your concern.'",
      coachingQuestion: "How can you reframe resistance not as an obstacle to overcome, but as valuable data that could improve your initiative?",
    },
  },
  {
    id: "adaptive_influence",
    name: "Adaptive Influence",
    shortName: "Adaptive",
    definition:
      "The flexibility to adapt influence approach based on the person, context, level, power dynamics and decision stage.",
    whyItMatters:
      "A single influence style rarely works across all situations. Adaptive leaders read the context and the individual, deploying the most effective approach—whether data-driven, relational, or visionary—to achieve the desired outcome.",
    questionIds: [9, 19, 29],
    scoring: {
      excellent: "Highly adaptive influencer. You possess a versatile repertoire of influence styles, seamlessly adjusting your approach based on the specific needs of the stakeholder and the context. You are equally effective with the CEO and the front-line team.",
      good: "Flexible influencer. You can adapt your style in most situations, though you may still over-rely on your preferred approach when under stress or facing highly complex dynamics.",
      developing: "Rigid influence style. You likely rely on a limited set of influence tactics (e.g., only logic or only relationships), struggling to connect with stakeholders who require a different approach.",
      atRisk: "One-dimensional influencer. Your inability to adapt your style severely limits your effectiveness across different levels and personalities, leading to frequent miscommunications and failed influence attempts.",
    },
    development: {
      strengths: "Versatility, contextual awareness, and behavioral flexibility that makes you effective across a wide range of stakeholders.",
      blindSpots: "Losing authenticity while adapting; failing to recognize when your default style is ineffective until significant damage is done.",
      practicalActions: "Identify a stakeholder you consistently struggle to influence. Analyze their preferred style (data, vision, relationship, challenge) and consciously design your next interaction around their needs, not your comfort.",
      coachingQuestion: "What is your default influence style under pressure, and how might it be systematically limiting your effectiveness with certain stakeholders?",
    },
  },
  {
    id: "leadership_reputation",
    name: "Leadership Reputation",
    shortName: "Reputation",
    definition:
      "The long-term credibility and organisational pull created by your pattern of behaviour, impact and relationships.",
    whyItMatters:
      "A strong reputation precedes you, making every influence attempt easier. Leaders with high organizational pull are sought out for their expertise and judgment, creating a virtuous cycle of increasing influence.",
    questionIds: [10, 20, 30],
    scoring: {
      excellent: "Exceptional leadership reputation. You possess immense organizational pull. Your track record of impact and collaboration makes you a highly sought-after advisor and a powerful force for positive outcomes across the enterprise.",
      good: "Strong reputation. You are respected and valued, though your influence may be localized to specific functions or you may still be building your profile across the broader enterprise.",
      developing: "Developing or mixed reputation. Your impact may be inconsistent, or you may be known for technical expertise rather than leadership influence. You may lack the necessary 'pull' to drive cross-functional initiatives.",
      atRisk: "Damaged or non-existent reputation. Your track record may be characterized by poor collaboration, low impact, or inconsistent behavior, severely limiting your ability to influence anyone beyond your direct reports.",
    },
    development: {
      strengths: "Organizational pull, trusted advisor status, and consistent high impact that creates a virtuous cycle of increasing influence.",
      blindSpots: "Resting on past successes; failing to actively manage and evolve your leadership brand as the organization changes.",
      practicalActions: "Conduct a brief 'reputation audit' with three trusted peers. Ask them what leadership qualities you are most known for, and identify one area for intentional growth. Then act on it visibly.",
      coachingQuestion: "How does your current leadership reputation align with the influence required to achieve your long-term career and organizational goals?",
    },
  },
];

// ─── Navigation dimensions (merged from NII — 5 most differentiated) ──────────

const LII_NAVIGATION_DIMENSIONS = [
  {
    id: "political_navigation",
    name: "Political Navigation",
    shortName: "Political Nav",
    definition: "The ability to ethically read and navigate organizational politics — managing competing agendas, understanding power, and working across silos without compromising integrity.",
    whyItMatters: "Every organization has politics. Leaders who ignore them get blindsided. Leaders who master ethical political navigation advance important work while strengthening trust and relationships.",
    questionIds: [31, 32],
    scoring: {
      excellent: "Masterful political navigator. You read competing agendas, understand informal power, and advance important work ethically without creating unnecessary enemies.",
      good: "Competent political navigator. You generally read organizational dynamics well, though complex multi-stakeholder situations may still catch you off guard.",
      developing: "Developing political awareness. You may be surprised by organizational resistance or find yourself on the wrong side of informal power dynamics.",
      atRisk: "Politically blind. You likely ignore organizational politics entirely, which means important initiatives stall or fail for reasons that have nothing to do with their merit.",
    },
    development: {
      strengths: "Reading competing agendas and navigating them with integrity.",
      blindSpots: "Assuming that good ideas win on merit alone; avoiding all politics rather than navigating them ethically.",
      practicalActions: "Before your next major initiative, map the competing agendas. Identify who benefits, who loses, and who has informal veto power. Design your engagement strategy accordingly.",
      coachingQuestion: "Where are you currently letting organizational politics block important work that you could be navigating more skillfully?",
    },
  },
  {
    id: "decision_pathway",
    name: "Decision Pathway Intelligence",
    shortName: "Decision Pathways",
    definition: "Understanding how decisions actually get made — including formal approvals, informal sign-offs, sequencing, and the role of executive sponsorship.",
    whyItMatters: "Many smart leaders waste months pursuing the wrong decision pathway. Decision Pathway Intelligence ensures proposals reach the right people in the right order at the right moment.",
    questionIds: [33, 34],
    scoring: {
      excellent: "Expert decision pathway navigator. You map the real decision pathway before investing in a proposal and secure executive sponsorship before formal submission.",
      good: "Solid decision pathway awareness. You generally understand how decisions get made, though you occasionally miss informal sign-offs or misjudge sequencing.",
      developing: "Inconsistent decision pathway navigation. You may invest significant effort in proposals that stall because you did not understand the real approval process.",
      atRisk: "Decision pathway blind spot. Important proposals frequently stall or fail because you are pursuing the wrong pathway or missing key informal approvals.",
    },
    development: {
      strengths: "Mapping real decision pathways and sequencing approvals to build momentum.",
      blindSpots: "Assuming formal processes reflect how decisions actually get made; skipping informal pre-wiring.",
      practicalActions: "For your next major proposal, map the actual decision pathway: who has formal authority, who has informal veto power, and what sequence of conversations needs to happen before the formal submission.",
      coachingQuestion: "Where have you recently invested significant effort in a proposal that stalled — and what did you learn about the real decision pathway?",
    },
  },
  {
    id: "timing_judgment",
    name: "Timing & Strategic Judgment",
    shortName: "Timing & Judgment",
    definition: "Knowing when to act, when to wait, which battles to choose, and how to sequence initiatives for maximum impact.",
    whyItMatters: "Timing often determines success more than the quality of the idea itself. Strategic judgment separates leaders who consistently move important work forward from those who are perpetually blocked.",
    questionIds: [35, 36],
    scoring: {
      excellent: "Exceptional strategic timing. You read organizational readiness accurately, choose battles wisely, and sequence initiatives to build momentum rather than create overload.",
      good: "Good strategic timing. You generally read the room well, though you occasionally push initiatives at the wrong moment or invest political capital in the wrong battles.",
      developing: "Developing timing awareness. You may push important initiatives forward when the organization is not ready, or hold back when the window is open.",
      atRisk: "Poor strategic timing. You frequently face more resistance than your ideas deserve because you are launching at the wrong moment or fighting the wrong battles.",
    },
    development: {
      strengths: "Reading organizational readiness and choosing the right moment to act.",
      blindSpots: "Impatience that pushes initiatives before the organization is ready; or excessive caution that misses open windows.",
      practicalActions: "Before your next major initiative, assess organizational readiness: Is the leadership team aligned? Is there bandwidth? Is there a recent win or crisis that creates an opening? Time your launch accordingly.",
      coachingQuestion: "Where are you currently pushing an initiative that the organization is not yet ready for — and what would it take to create the conditions for success first?",
    },
  },
  {
    id: "org_awareness",
    name: "Organizational Awareness",
    shortName: "Org Awareness",
    definition: "The ability to accurately read how the organization really works — beyond the org chart.",
    whyItMatters: "Leaders who understand formal structures, informal networks, hidden norms, and decision pathways move initiatives forward faster and with less resistance.",
    questionIds: [37, 38],
    scoring: {
      excellent: "Exceptional organizational reader. You map informal influence networks, understand unwritten rules, and track how decisions actually get made vs. how they should be made.",
      good: "Strong organizational awareness. You generally read the organization well, though you may occasionally miss subtle informal dynamics or cultural norms.",
      developing: "Developing organizational awareness. You may be surprised by how decisions get made or find yourself navigating based on the formal org chart rather than the real one.",
      atRisk: "Limited organizational awareness. You primarily operate based on formal structures and are frequently surprised by how things actually work in practice.",
    },
    development: {
      strengths: "Reading informal influence networks and understanding the unwritten rules of organizational life.",
      blindSpots: "Assuming the formal org chart reflects how influence actually flows; missing the informal networks that shape decisions.",
      practicalActions: "Map the informal influence network for your most important current initiative. Who are the real decision-makers, influencers, and gatekeepers — regardless of title?",
      coachingQuestion: "How well do you really understand the informal organization — and what would you discover if you mapped it honestly?",
    },
  },
  {
    id: "ethical_navigation",
    name: "Ethical Leadership Navigation",
    shortName: "Ethical Nav",
    definition: "Navigating organizational complexity with integrity, transparency, fairness, and courage — developing others while preserving trust.",
    whyItMatters: "Long-term organizational success requires leaders who navigate with integrity, not manipulation. This dimension ensures influence capability develops ethical leaders rather than political operators.",
    questionIds: [39, 40],
    scoring: {
      excellent: "Exemplary ethical navigator. You navigate organizational complexity without compromising your values and actively develop others' navigation capabilities.",
      good: "Strong ethical navigation. You generally maintain integrity under organizational pressure, though you may occasionally rationalize shortcuts that compromise your standards.",
      developing: "Developing ethical navigation. You may find organizational pressure testing your values in ways that are not always comfortable.",
      atRisk: "Ethical navigation risk. You may be using organizational knowledge and relationships in ways that benefit your position more than the broader organization.",
    },
    development: {
      strengths: "Navigating organizational dynamics without compromising personal values.",
      blindSpots: "Rationalizing political behavior as 'just how organizations work'; failing to develop others' navigation capabilities.",
      practicalActions: "Identify one recent situation where you navigated organizational dynamics in a way you would not be comfortable defending publicly. What would you do differently?",
      coachingQuestion: "Where is organizational pressure currently testing your values — and how are you choosing to respond?",
    },
  },
];

export const LII_DIMENSIONS_EXTENDED = [...LII_DIMENSIONS, ...LII_NAVIGATION_DIMENSIONS];

// ─── 40 Questions (2 per navigation dimension added; original 30 kept) ─────────
// questionIds in dimensions array reference these 1-indexed IDs

export const LII_QUESTIONS = [
  // Trust Capital (1, 12, 21)
  { id: 1, text: "I consistently keep commitments even when priorities shift or pressure increases.", dimensionId: "trust_capital" },
  { id: 2, text: "I influence the direction of important decisions before the final meeting happens.", dimensionId: "decision_influence" },
  { id: 3, text: "I identify the real interests behind stakeholder positions before trying to create alignment.", dimensionId: "stakeholder_alignment" },
  { id: 4, text: "I build support for important ideas before I need formal approval.", dimensionId: "coalition_building" },
  { id: 5, text: "I can read how influence actually works in my organisation beyond the formal hierarchy.", dimensionId: "organizational_navigation" },
  { id: 6, text: "People commit discretionary effort to priorities I lead because they see meaning in the work.", dimensionId: "inspirational_leadership" },
  { id: 7, text: "I can move people from intellectual agreement to real commitment during change.", dimensionId: "change_mobilization" },
  { id: 8, text: "I surface disagreement early enough for it to become useful rather than destructive.", dimensionId: "conflict_resistance" },
  { id: 9, text: "I adjust my influence approach depending on whether someone needs data, reassurance, involvement or challenge.", dimensionId: "adaptive_influence" },
  { id: 10, text: "People seek my input on important issues even when I am not formally accountable for them.", dimensionId: "leadership_reputation" },
  { id: 11, text: "I help groups move from individual priorities to shared ownership of an outcome.", dimensionId: "stakeholder_alignment" },
  { id: 12, text: "Stakeholders trust that I represent issues fairly, even when I have a strong point of view.", dimensionId: "trust_capital" },
  { id: 13, text: "I frame issues in a way that helps senior stakeholders see what is really at stake.", dimensionId: "decision_influence" },
  { id: 14, text: "I know which people can become champions, blockers or quiet influencers for my priorities.", dimensionId: "coalition_building" },
  { id: 15, text: "I choose the right timing and forum for raising sensitive or high-impact issues.", dimensionId: "organizational_navigation" },
  { id: 16, text: "I connect day-to-day execution to a larger purpose that people can believe in.", dimensionId: "inspirational_leadership" },
  { id: 17, text: "I actively address inertia, fear or fatigue instead of assuming that logic will drive adoption.", dimensionId: "change_mobilization" },
  { id: 18, text: "When people resist my ideas, I explore the concern before pushing harder.", dimensionId: "conflict_resistance" },
  { id: 19, text: "I can influence upward, sideways and downward without using the same style in every situation.", dimensionId: "adaptive_influence" },
  { id: 20, text: "My reputation helps my ideas get a fair hearing with senior or cross-functional stakeholders.", dimensionId: "leadership_reputation" },
  { id: 21, text: "People can predict the principles I will use when making difficult trade-offs.", dimensionId: "trust_capital" },
  { id: 22, text: "When stakeholders disagree, I can usually clarify the common goal without oversimplifying the tension.", dimensionId: "stakeholder_alignment" },
  { id: 23, text: "My recommendations change how decision-makers think about options, risks and trade-offs.", dimensionId: "decision_influence" },
  { id: 24, text: "I invest in cross-functional relationships before there is an urgent need.", dimensionId: "coalition_building" },
  { id: 25, text: "I understand which stakeholders need to be engaged privately before a public decision is sought.", dimensionId: "organizational_navigation" },
  { id: 26, text: "My leadership creates ownership rather than mere compliance.", dimensionId: "inspirational_leadership" },
  { id: 27, text: "I sustain momentum after the initial excitement of a change initiative fades.", dimensionId: "change_mobilization" },
  { id: 28, text: "I can hold firm on outcomes while staying constructive with people who disagree.", dimensionId: "conflict_resistance" },
  { id: 29, text: "I notice when my preferred influence style is not working and change approach quickly.", dimensionId: "adaptive_influence" },
  { id: 30, text: "I am seen as someone who increases the quality of decisions and collaboration around me.", dimensionId: "leadership_reputation" },
  // Navigation dimensions (merged from NII)
  { id: 31, text: "I can read competing agendas in my organization and navigate them without unnecessarily taking sides or creating enemies.", dimensionId: "political_navigation" },
  { id: 32, text: "I understand where power actually sits in my organization — including informal power — and work with it ethically to advance important work.", dimensionId: "political_navigation" },
  { id: 33, text: "Before investing significant effort in a proposal, I map the actual decision pathway — including informal sign-offs and executive sponsorship requirements.", dimensionId: "decision_pathway" },
  { id: 34, text: "I sequence my approvals strategically to build momentum rather than triggering resistance by going to the wrong person first.", dimensionId: "decision_pathway" },
  { id: 35, text: "I read organizational readiness before launching major initiatives — I know when the timing is right and when to wait.", dimensionId: "timing_judgment" },
  { id: 36, text: "I choose my battles carefully — I invest my political capital in the initiatives that matter most and let smaller issues go.", dimensionId: "timing_judgment" },
  { id: 37, text: "When I join a new team or initiative, I actively map the informal influence networks — not just the reporting lines — before making major moves.", dimensionId: "org_awareness" },
  { id: 38, text: "I can identify the unwritten rules and cultural norms that shape how decisions are actually made in my organization.", dimensionId: "org_awareness" },
  { id: 39, text: "I navigate organizational complexity without compromising my values — I find ways to advance important work that I would be comfortable defending publicly.", dimensionId: "ethical_navigation" },
  { id: 40, text: "I actively develop others' ability to navigate the organization effectively — I share my knowledge of how things work rather than keeping it as a personal advantage.", dimensionId: "ethical_navigation" },
];

// ─── Influence Archetypes ─────────────────────────────────────────────────────

export const LII_ARCHETYPES = [
  {
    id: "executive_multiplier",
    name: "Executive Multiplier",
    tagline: "You elevate everyone around you.",
    description:
      "You possess a highly balanced and exceptional influence profile. You not only drive outstanding outcomes yourself, but you systematically elevate the quality of decisions, collaboration, and capability across the entire organization. Senior leaders seek you out. Cross-functional teams want you involved. Your influence is both broad and deep, operating effectively at every level and in every direction. You are the rare leader who makes the whole organization smarter and more effective simply by being present.",
    color: "#D4AF37",
    minOverallScore: 4.5,
  },
  {
    id: "trusted_integrator",
    name: "Trusted Integrator",
    tagline: "You are the glue that holds complex initiatives together.",
    description:
      "You excel at building deep trust and aligning diverse stakeholders. Your credibility and fairness are your most powerful assets. When conflict arises or silos form, you are the person others call to restore alignment and shared purpose. You operate with exceptional integrity and your commitments are never in doubt. Your development edge is learning to translate this trust into proactive decision influence — shaping outcomes before the formal meeting, not just after the damage is done.",
    color: "#4A90D9",
    minOverallScore: 0,
    topDimensions: ["trust_capital", "stakeholder_alignment"],
  },
  {
    id: "strategic_influencer",
    name: "Strategic Influencer",
    tagline: "You shape outcomes before the room assembles.",
    description:
      "You are a master of framing and decision influence. You understand that the most important conversations happen before the formal meeting, and you consistently ensure your perspective is integrated into the core strategy. You are highly credible with senior stakeholders and your recommendations genuinely shift how decision-makers think about options and risks. Your development edge is building the coalition infrastructure to sustain your influence when you are not personally in the room.",
    color: "#7B68EE",
    minOverallScore: 0,
    topDimensions: ["decision_influence", "organizational_navigation"],
  },
  {
    id: "coalition_builder",
    name: "Coalition Builder",
    tagline: "Your network is your competitive advantage.",
    description:
      "Your strength lies in your network. You proactively cultivate champions and allies, leveraging informal power to drive cross-functional execution and overcome organizational silos. You invest in relationships before you need them, and as a result, your initiatives move faster and face less resistance than those of your peers. Your development edge is learning to translate these relationships into sharper decision influence — using your network not just to execute, but to shape the strategic agenda.",
    color: "#20B2AA",
    minOverallScore: 0,
    topDimensions: ["coalition_building", "stakeholder_alignment"],
  },
  {
    id: "change_catalyst",
    name: "Change Catalyst",
    tagline: "You turn inertia into momentum.",
    description:
      "You possess a unique and rare ability to mobilize organizations. You understand that change fails not because of poor strategy, but because of unaddressed human resistance. You overcome inertia, address emotional barriers, and sustain momentum through the difficult phases of complex transformations. People commit to change under your leadership not because they have to, but because you make them believe it is possible. Your development edge is building the long-term trust capital and reputation that makes your change leadership stick beyond any single initiative.",
    color: "#FF6B6B",
    minOverallScore: 0,
    topDimensions: ["change_mobilization", "inspirational_leadership"],
  },
  {
    id: "organizational_navigator",
    name: "Organisational Navigator",
    tagline: "You read the room before it assembles.",
    description:
      "You possess exceptional political intelligence. You read the unspoken dynamics, time your interventions perfectly, and advance initiatives smoothly while avoiding political landmines. You understand that organizations run on informal power as much as formal authority, and you navigate both with sophistication and integrity. Your development edge is ensuring that your organizational intelligence is matched by an equally strong inspirational presence — so that people follow you not just because you are smart about the system, but because they are genuinely inspired by your leadership.",
    color: "#FF8C42",
    minOverallScore: 0,
    topDimensions: ["organizational_navigation", "coalition_building"],
  },
  {
    id: "relationship_builder",
    name: "Relationship Builder",
    tagline: "People trust you instinctively.",
    description:
      "You excel at interpersonal connection and creating genuine warmth and trust in your relationships. People feel seen, heard, and valued when they work with you. Your development edge is learning to leverage these exceptional relationships to drive hard strategic outcomes and manage constructive conflict. The risk for leaders like you is that the desire to maintain harmony can prevent the necessary friction that leads to better decisions. Your relationships are a powerful asset — the next step is deploying them with greater strategic intentionality.",
    color: "#98D8C8",
    minOverallScore: 0,
    topDimensions: ["trust_capital", "inspirational_leadership"],
  },
  {
    id: "quiet_expert",
    name: "Quiet Expert",
    tagline: "Your expertise commands respect — now let it command rooms.",
    description:
      "Your influence stems primarily from your deep technical or domain expertise. You are highly credible within your area of knowledge and people trust your judgment on matters within your domain. Your development edge is learning to translate this expertise into broader strategic influence and stakeholder alignment. The transition from expert to executive influencer requires a different skill set — one that is less about knowing the right answer and more about shaping how others think about the question.",
    color: "#B0C4DE",
    minOverallScore: 0,
    topDimensions: ["trust_capital", "decision_influence"],
  },
  {
    id: "emerging_influencer",
    name: "Emerging Influencer",
    tagline: "Your influence potential is significant — and largely untapped.",
    description:
      "You are building your influence capabilities and show genuine promise in specific areas. You have the raw material to become a highly effective leader, but need to develop a more versatile repertoire of influence styles, a broader network, and greater organizational awareness to maximize your impact. This diagnostic has identified your specific development priorities. The leaders who act on this kind of insight early are the ones who make the most significant leadership leaps in the next 12–24 months.",
    color: "#90EE90",
    minOverallScore: 0,
    topDimensions: [],
  },
  {
    id: "authority_dependent",
    name: "Authority-Dependent Leader",
    tagline: "Your title is working harder than it should.",
    description:
      "You rely heavily on your formal title and positional power to drive outcomes. When your authority is clear, you can be effective. But in matrixed environments, cross-functional initiatives, or situations where you need to influence without a reporting line, your effectiveness drops significantly. Developing informal influence skills is not optional at the executive level — it is the difference between a leader who is effective in their current role and one who is ready for significantly greater responsibility.",
    color: "#CD853F",
    minOverallScore: 0,
    topDimensions: [],
  },
];

// ─── Scoring helpers ──────────────────────────────────────────────────────────

export function getScoreBand(score: number): "excellent" | "good" | "developing" | "atRisk" {
  if (score >= 4.5) return "excellent";
  if (score >= 3.5) return "good";
  if (score >= 2.5) return "developing";
  return "atRisk";
}

export function getScoreBandLabel(score: number): string {
  const band = getScoreBand(score);
  return {
    excellent: "Exceptional (4.5–5.0)",
    good: "Strong (3.5–4.4)",
    developing: "Developing (2.5–3.4)",
    atRisk: "At Risk (Below 2.5)",
  }[band];
}

export function getScoreBandColor(score: number): string {
  const band = getScoreBand(score);
  return {
    excellent: "#D4AF37",
    good: "#4A90D9",
    developing: "#FF8C42",
    atRisk: "#E74C3C",
  }[band];
}

export type LIIDimension = typeof LII_DIMENSIONS_EXTENDED[number];
export type LIIQuestion = typeof LII_QUESTIONS[number];
export type LIIArchetype = typeof LII_ARCHETYPES[number];
