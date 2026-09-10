export interface AcademySeedKnowledge {
  objectType: "thesis" | "product_family" | "product" | "engine" | "golden_journey" | "misconception";
  slug: string;
  title: string;
  summary: string;
  disclosureBand: "need_now" | "recognize" | "later";
  productCode?: string;
  roleRelevance: string[];
  content: Record<string, unknown>;
}

export const ACADEMY_SEED_KNOWLEDGE: AcademySeedKnowledge[] = [
  {
    objectType: "thesis",
    slug: "levelnext-change-thesis",
    title: "The LevelNext Change Loop",
    summary: "Work changes when people see their reality clearly, practise high-stakes moments safely, and produce observable evidence in real work.",
    disclosureBand: "need_now",
    roleRelevance: ["all"],
    content: {
      howToUnderstand: "Use this section as the 'why' behind every LevelNext product. If you remember only one idea, remember that insight becomes useful only when it changes a real moment at work.",
      definitions: {
        "Change loop": "The repeatable path from seeing a gap to practising and proving a new behaviour.",
        "Real-work evidence": "An observable change in a meeting, decision, conversation, or commitment—not a completed lesson.",
      },
      tooltips: {
        corePrinciple: "The sequence LevelNext uses to turn insight into action.",
        whyWorkshopFails: "The reason awareness alone does not reliably change behaviour under pressure.",
      },
      corePrinciple: "Diagnose → Understand → Practise → Act → Reflect → Evidence → Adapt",
      whyWorkshopFails: "Workshops transfer conceptual awareness. Under pressure, professionals default to legacy emotional habits unless they have rehearsed the specific move and made accountability visible.",
      outcome: "Capability becomes visible in the work rather than remaining trapped in a feedback report.",
    },
  },
  {
    objectType: "product_family",
    slug: "product-family-leadership-core",
    title: "Leadership & Transition Intelligence",
    summary: "Diagnostics, practice, and behavioural moves tailored to the exact transition stage of the individual.",
    disclosureBand: "need_now",
    roleRelevance: ["all"],
    content: {
      howToUnderstand: "Read this as the LevelNext progression map. Start with the person's transition stage, then choose the product that addresses the behavioural demands of that stage—not the most senior-sounding product.",
      definitions: {
        "Transition stage": "The shift in scope, identity, and expectations a person is navigating, such as becoming a manager or enterprise leader.",
        "Product family": "A group of connected LevelNext experiences designed for a specific leadership or career transition.",
        "Behavioural move": "A small, observable action or phrase that changes what happens in a high-stakes moment.",
      },
      tooltips: {
        tiers: "Each card represents a transition audience and the most relevant starting experience.",
        targetPersonas: "The people most likely to benefit from this tier—not a restriction on who may use it.",
        primaryDerailers: "Predictable overused strengths or avoidance patterns that can block progress at this transition.",
        recommendedBehaviouralMoves: "Specific behaviours to practise after the diagnostic identifies a gap.",
      },
      tiers: [
        {
          code: "early_career",
          label: "Early Career Intelligence",
          focus: "First critical years of ownership, communication, and risk visibility",
          route: "/early-career",
          primaryDerailers: ["Waiting for permission", "Hiding uncertainty until the deadline", "Confusing activity with ownership"],
          targetPersonas: ["Early-career professionals", "Graduate hires", "Individual contributors in their first major role"],
          recommendedBehaviouralMoves: ["Make the first clear ask", "Surface risk before it becomes urgent", "Close the loop with an evidence update"],
          howToUse: "Start here when the person is building professional judgement and visibility for the first time.",
        },
        {
          code: "pe",
          label: "Professional Intelligence (PEI)",
          focus: "Critical individual contributors moving work forward with less manager intervention",
          route: "/pe",
          primaryDerailers: ["Over-relying on technical expertise", "Solving alone instead of influencing", "Escalating problems without a recommendation"],
          targetPersonas: ["Experienced individual contributors", "Project and functional specialists", "Professionals preparing for broader scope"],
          recommendedBehaviouralMoves: ["Frame the decision before giving the detail", "Make a recommendation with trade-offs", "Build the stakeholder relationship before the ask"],
          howToUse: "Choose PEI when the person must move from dependable execution to visible judgement and influence.",
        },
        {
          code: "mep",
          label: "Manager Effectiveness (MEP)",
          focus: "First-time and scaling managers shifting from doing to enabling, delegation, and coaching",
          route: "/manager",
          primaryDerailers: ["Rescuing instead of delegating", "Avoiding accountability conversations", "Becoming the team's bottleneck"],
          targetPersonas: ["First-time managers", "Engineering and functional managers", "Managers scaling from one team to several"],
          recommendedBehaviouralMoves: ["Contract clarity before escalation", "Ask before advising", "Delegate the outcome—not just the task"],
          howToUse: "Use MEP when performance depends on how the manager creates ownership in other people.",
        },
        {
          code: "ldi",
          label: "Leader Intelligence (LDI / LII)",
          focus: "Senior leaders shaping strategic influence, enterprise alignment, and derailment resilience",
          route: "/li-report/LDI/demo",
          primaryDerailers: ["Driving outcomes directly when coalition is required", "Being strategically right but relationally isolated", "Under-communicating the narrative behind a decision"],
          targetPersonas: ["Directors and business-unit heads", "GCC and enterprise leaders", "Senior leaders in cross-functional transformation"],
          recommendedBehaviouralMoves: ["Build the coalition before the decision forum", "Name the enterprise trade-off", "Create dissent that remains safe to act on"],
          howToUse: "Choose LDI when the leader's impact depends on enterprise influence, not only functional authority.",
        },
        {
          code: "executive",
          label: "Executive Intelligence (ECI)",
          focus: "Board-level presence, high-stakes communication, and executive decision outcomes",
          route: "/executive",
          primaryDerailers: ["Over-explaining instead of landing the decision", "Using certainty to cover unresolved risk", "Treating executive communication as presentation rather than influence"],
          targetPersonas: ["Executives and C-suite leaders", "Board-facing functional heads", "Leaders entering enterprise-wide visibility"],
          recommendedBehaviouralMoves: ["Lead with the decision and its consequence", "Make the risk discussable", "Turn the narrative into a clear stakeholder commitment"],
          howToUse: "Use ECI when communication quality directly affects executive trust, decisions, and enterprise momentum.",
        },
      ],
    },
  },
  {
    objectType: "product",
    slug: "product-mep",
    title: "Manager Effectiveness Platform (MEP)",
    summary: "Turns managerial capability gaps into targeted behavioural moves, voice simulator rehearsals, and real-work commitments.",
    disclosureBand: "need_now",
    productCode: "MEP",
    roleRelevance: ["all"],
    content: {
      howToUnderstand: "Think of MEP as a manager's operating layer: it helps the manager notice the moment where ownership breaks down, practise a better response, and carry that response into the next conversation.",
      definitions: {
        "Manager effectiveness": "The ability to create clarity, ownership, feedback, and progress through other people.",
        "Practice partner": "The guided AI role-play that lets a manager rehearse a difficult conversation before the real meeting.",
      },
      tooltips: {
        keyComponents: "These are the connected experiences that move a manager from diagnosis to evidence.",
        whyLayer: "The underlying behavioural reason the product matters—not just a feature description.",
      },
      whoItIsFor: "First-time managers, engineering managers, and people leaders stepping into team accountability.",
      problemSolved: "Managers get promoted for functional excellence, then struggle with delegation, feedback avoidance, and priority drag.",
      userExperience: "Role-context diagnostic → Behavioural breakthrough moment → Move selection → Voice simulation rehearsal → Real-work commitment → Team evidence.",
      route: "/manager",
      keyComponents: ["Manager Diagnostics", "Behavioural Move Studio", "Voice Practice Simulator", "Manager Brief", "Team Commitments"],
      whyLayer: "A manager does not fail from lack of intention; they fail at the micro-moment of a difficult conversation. Rehearsing verbatim phrases builds muscle memory before the meeting.",
    },
  },
  {
    objectType: "product",
    slug: "product-ldi",
    title: "Leader Derailment Intelligence (LDI / LII)",
    summary: "Exposes derailment risks, blind spots, and enterprise leverage points before they impact reputation or scale.",
    disclosureBand: "need_now",
    productCode: "LDI",
    roleRelevance: ["all"],
    content: {
      howToUnderstand: "LDI is not a scorecard to admire. Read it as an early-warning system: it shows where a leader's familiar strength may become a liability at enterprise scale and what to practise next.",
      definitions: {
        "Derailer": "A strength, habit, or emotional pattern that becomes counterproductive when the context or scale changes.",
        "Enterprise leverage": "The ability to create outcomes through alignment, narrative, and influence beyond one's direct reporting line.",
      },
      tooltips: {
        keyComponents: "The surfaces that turn a leadership diagnostic into reflection, practice, and action.",
        whyLayer: "The leadership context that explains why the same behaviour can help in one role and derail in another.",
      },
      whoItIsFor: "Directors, Business Unit heads, and senior leaders carrying cross-functional scope.",
      problemSolved: "Leaders stall when their historic strength (e.g. driving results directly) becomes a derailer in an executive ecosystem requiring coalition and narrative alignment.",
      userExperience: "Diagnostic assessment → Strategic scorecards → Derailment risk radar → Guided Mirror reflection → Breakthrough Behavioural Move → Sponsor progress heatmap.",
      route: "/li-report/LDI/demo",
      keyComponents: ["Leadership Graph", "Derailment Archetypes", "Strategic Communicator Scorecard", "Behavioural Breakthrough Studio"],
      whyLayer: "Executive failure is rarely technical; it is nearly always relational, political, or narrative. LDI makes the hidden edge visible before a derailment occurs.",
    },
  },
  {
    objectType: "engine",
    slug: "engine-behavioural-intelligence",
    title: "Behavioural Intelligence Engine™",
    summary: "The shared core engine across LevelNext that turns diagnostic insight into observable behavioural moves, voice rehearsal, and anonymized aggregate progress.",
    disclosureBand: "need_now",
    roleRelevance: ["all"],
    content: {
      howToUnderstand: "This is the shared engine underneath multiple LevelNext applications. It is the bridge between 'I understand my gap' and 'I behaved differently in a real moment'.",
      definitions: {
        "Behavioural moment": "A specific workplace interaction where a different response could change the outcome.",
        "Evidence ledger": "A private record of practice, commitments, and reflections that shows movement over time.",
      },
      tooltips: {
        stages: "The reusable sequence every connected application can use to turn insight into practice.",
        privacyGuarantee: "The rule that protects individual moments while allowing safe aggregate sponsor insight.",
      },
      layer: "Core Platform Engine",
      stages: ["Moment Capture", "Breakthrough Analysis", "Behavioural Moves", "Practice Links", "Actions & Evidence", "Reflections"],
      privacyGuarantee: "HR sponsors view aggregate heatmaps only when cohorts meet or exceed 5 contributors. Individual reflections and moments remain private.",
      connectedProducts: ["Manager Effectiveness", "Leader Intelligence", "Early Career Intelligence", "Executive Intelligence"],
    },
  },
  {
    objectType: "golden_journey",
    slug: "golden-journey-first-time-manager",
    title: "Golden Journey: The First-Time Manager",
    summary: "How an engineering lead avoids a difficult performance conversation, discovers the blind spot in MEP, rehearses the move in the voice simulator, and completes the real meeting.",
    disclosureBand: "need_now",
    productCode: "MEP",
    roleRelevance: ["all"],
    content: {
      howToUnderstand: "Follow this story in sequence. It demonstrates how a LevelNext user moves from a hidden workplace tension to a diagnostic insight, a rehearsed phrase, and an observable commitment.",
      definitions: {
        "Golden journey": "A representative end-to-end story showing how a person experiences LevelNext in the flow of work.",
        "Breakthrough moment": "The point where the person can name the behaviour that is blocking progress and choose a different move.",
      },
      tooltips: {
        breakthroughMoment: "The diagnostic-to-practice handoff—the most important transition in the story.",
        realWorkShift: "The evidence that the learning reached an actual workplace conversation or decision.",
      },
      protagonist: "Aarav, Senior Lead transitioning to Engineering Manager",
      tension: "Avoids confronting a senior individual contributor missing sprints, fearing friction.",
      breakthroughMoment: "MEP diagnostic highlights Accountability Avoidance. Behavioural Intelligence proposes Move: 'Contracting Clarity Before Escalation'.",
      rehearsal: "Aarav practices verbatim phrasing in the LevelNext Voice Simulator with immediate spoken encouragement.",
      realWorkShift: "Conducts the 1:1 on Thursday; commits an evidence record showing agreement on revised sprint commitments.",
    },
  },
  {
    objectType: "misconception",
    slug: "misconception-feature-dump",
    title: "Misconception: LevelNext is a Content Library / LMS",
    summary: "LevelNext is not a library of courses to complete; it is an intelligence and practice loop embedded directly in workplace moments.",
    disclosureBand: "need_now",
    roleRelevance: ["all"],
    content: {
      howToUnderstand: "Use this section when explaining the difference between LevelNext and conventional learning platforms. Lead with the workplace problem and behaviour change, not the feature list.",
      definitions: {
        "Feature dump": "Listing capabilities without explaining the problem, user, or behaviour each capability changes.",
        "Embedded practice": "Rehearsal connected to a real upcoming conversation, decision, or commitment.",
      },
      tooltips: {
        triggerPhrases: "Words that often signal someone is interpreting LevelNext as passive courseware.",
        correction: "The concise explanation that repositions LevelNext as an intelligence and action platform.",
      },
      triggerPhrases: ["LMS", "online courses", "video modules", "learning catalogue"],
      correction: "LevelNext provides context-aware diagnostics, behavioural move generation, AI voice rehearsal, and real-work evidence. It measures change in the work, not video watch-time.",
    },
  },
];
