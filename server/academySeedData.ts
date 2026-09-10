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
      tiers: [
        { code: "early_career", label: "Early Career Intelligence", focus: "First critical years of ownership, communication, and risk visibility" },
        { code: "pe", label: "Professional Intelligence (PEI)", focus: "Critical individual contributors moving work forward with less manager intervention" },
        { code: "mep", label: "Manager Effectiveness (MEP)", focus: "First-time and scaling managers shifting from doing to enabling, delegation, and coaching" },
        { code: "ldi", label: "Leader Intelligence (LDI / LII)", focus: "Senior leaders shaping strategic influence, enterprise alignment, and derailment resilience" },
        { code: "executive", label: "Executive Intelligence (ECI)", focus: "Board-level presence, high-stakes communication, and executive decision outcomes" },
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
      whoItIsFor: "First-time managers, engineering managers, and people leaders stepping into team accountability.",
      problemSolved: "Managers get promoted for functional excellence, then struggle with delegation, feedback avoidance, and priority drag.",
      userExperience: "Role-context diagnostic → Behavioural breakthrough moment → Move selection → Voice simulation rehearsal → Real-work commitment → Team evidence.",
      route: "/manager-effectiveness",
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
      triggerPhrases: ["LMS", "online courses", "video modules", "learning catalogue"],
      correction: "LevelNext provides context-aware diagnostics, behavioural move generation, AI voice rehearsal, and real-work evidence. It measures change in the work, not video watch-time.",
    },
  },
];
