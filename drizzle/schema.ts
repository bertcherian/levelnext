import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  float,
  json,
  boolean,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  // Leadership Graph: cumulative cross-diagnostic intelligence profile
  leadershipGraph: json("leadershipGraph").$type<LeadershipGraph>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Tenants (Organisations) ──────────────────────────────────────────────────
export const tenants = mysqlTable("tenants", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  industry: varchar("industry", { length: 100 }),
  size: varchar("size", { length: 50 }),
  hq: varchar("hq", { length: 100 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  inviteCode: varchar("inviteCode", { length: 32 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = typeof tenants.$inferInsert;

// ─── Tenant Users (Membership) ────────────────────────────────────────────────
export const tenantUsers = mysqlTable("tenant_users", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull().references(() => tenants.id),
  userId: int("userId").notNull().references(() => users.id),
  role: mysqlEnum("role", ["owner", "admin", "member"]).default("member").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type TenantUser = typeof tenantUsers.$inferSelect;
export type InsertTenantUser = typeof tenantUsers.$inferInsert;

// ─── Assessment Sessions ──────────────────────────────────────────────────────
export const assessmentSessions = mysqlTable("assessment_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id),
  tenantId: int("tenantId").references(() => tenants.id),
  moduleType: mysqlEnum("moduleType", ["ECI", "TII", "LII", "GCC", "LDI", "STI"]).notNull(),
  status: mysqlEnum("status", ["in_progress", "completed", "abandoned"]).default("in_progress").notNull(),
  // Partial responses saved for resume
  responses: json("responses").$type<Record<string, number>>(),
  currentQuestionIndex: int("currentQuestionIndex").default(0).notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type AssessmentSession = typeof assessmentSessions.$inferSelect;
export type InsertAssessmentSession = typeof assessmentSessions.$inferInsert;

// ─── Unified Reports ──────────────────────────────────────────────────────────
export const reports = mysqlTable("reports", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").references(() => assessmentSessions.id),
  userId: int("userId").references(() => users.id),
  tenantId: int("tenantId").references(() => tenants.id),
  slug: varchar("slug", { length: 100 }).unique(),
  // Which diagnostic module generated this report
  moduleType: mysqlEnum("moduleType", ["ECI", "TII", "LII", "GCC", "LDI", "STI"]).notNull(),
  participantName: varchar("participantName", { length: 255 }).notNull(),
  participantEmail: varchar("participantEmail", { length: 320 }).notNull(),
  participantRole: varchar("participantRole", { length: 255 }),
  organisation: varchar("organisation", { length: 255 }),
  // Composite Edge score (0–100) — the unified metric across all modules
  edgeScore: float("edgeScore").notNull(),
  // Module-specific zone / band label
  zone: varchar("zone", { length: 100 }),
  // Archetype assigned by this module
  archetype: varchar("archetype", { length: 100 }),
  // Raw dimension / pillar / module scores as JSON
  dimensionScores: json("dimensionScores").$type<Record<string, number>>(),
  // Raw question responses
  responses: json("responses").$type<Record<string, number>>(),
  // LLM-generated structured analysis
  llmAnalysis: json("llmAnalysis"),
  // PDF report
  pdfUrl: text("pdfUrl"),
  pdfKey: text("pdfKey"),
  emailSent: boolean("emailSent").default(false).notNull(),
  isDemo: boolean("isDemo").default(false).notNull(),
  // PDF import provenance
  sourceType: mysqlEnum("sourceType", ["in_app", "pdf_import"]).default("in_app").notNull(),
  sourceFileUrl: text("sourceFileUrl"),
  sourceFileKey: text("sourceFileKey"),
  extractionConfidence: float("extractionConfidence"),
  originalReportDate: varchar("originalReportDate", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;

// ─── Guide Conversations ──────────────────────────────────────────────────────
export const guideConversations = mysqlTable("guide_conversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  messages: json("messages").$type<GuideMessage[]>().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type GuideConversation = typeof guideConversations.$inferSelect;

// ─── Daily Missions ───────────────────────────────────────────────────────────
export const dailyMissions = mysqlTable("daily_missions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  moduleType: mysqlEnum("moduleType", ["ECI", "TII", "LII", "GCC", "LDI", "STI", "GENERAL"]).notNull().default("GENERAL"),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  status: mysqlEnum("status", ["pending", "in_progress", "complete"]).default("pending").notNull(),
  dueDate: timestamp("dueDate"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type DailyMission = typeof dailyMissions.$inferSelect;

// ─── Leadership Graph Type ────────────────────────────────────────────────────
export type LeadershipGraph = {
  // Composite Edge score (0–100) across all completed modules
  compositeEdge?: number;
  // Per-module Edge scores
  moduleEdges?: {
    ECI?: number;
    TII?: number;
    LII?: number;
    GCC?: number;
    LDI?: number;
    STI?: number;
  };
  // Per-module archetypes
  archetypes?: {
    ECI?: string;
    TII?: string;
    LII?: string;
    GCC?: string;
    LDI?: string;
    STI?: string;
  };
  // Per-module zones
  zones?: {
    ECI?: string;
    TII?: string;
    LII?: string;
    GCC?: string;
    LDI?: string;
    STI?: string;
  };
  // Key strengths aggregated across modules
  strengths?: string[];
  // Key growth opportunities aggregated across modules
  growthOpportunities?: string[];
  // Completed module types
  completedModules?: ("ECI" | "TII" | "LII" | "GCC" | "LDI" | "STI")[];
  // Last updated timestamp
  lastUpdated?: string;
  // Full per-module data (stored after each diagnostic completion)
  modules?: {
    LDI?: {
      edgeScore?: number;
      zone?: string;
      zoneLabel?: string;
      archetype?: string;
      archetypeLabel?: string;
      archetypeTagline?: string;
      archetypeStrengths?: string[];
      archetypeRisks?: string[];
      dimensionScores?: Record<string, number>;
      topDerailmentRisks?: Array<{ dimensionId: string; dimensionName: string; score: number; riskBand: string }>;
      topStabilizers?: Array<{ dimensionId: string; dimensionName: string; score: number; riskBand: string }>;
      completedAt?: string;
    };
    ECI?: {
      edgeScore?: number;
      zone?: string;
      zoneLabel?: string;
      archetype?: string;
      archetypeLabel?: string;
      archetypeDescription?: string;
      archetypeStrengths?: string[];
      archetypeRisks?: string[];
      dimensionScores?: Record<string, number>;
      completedAt?: string;
    };
    LII?: {
      edgeScore?: number;
      zone?: string;
      zoneLabel?: string;
      archetype?: string;
      archetypeLabel?: string;
      archetypeTagline?: string;
      strengths?: string[];
      growthEdges?: string[];
      dimensionScores?: Record<string, number>;
      completedAt?: string;
    };
    GCC?: {
      edgeScore?: number;
      zone?: string;
      zoneLabel?: string;
      archetype?: string;
      archetypeLabel?: string;
      archetypeDescription?: string;
      archetypeStrengths?: string[];
      archetypeRisks?: string[];
      dimensionScores?: Record<string, number>;
      completedAt?: string;
    };
    TII?: {
      edgeScore?: number;
      zone?: string;
      zoneLabel?: string;
      archetype?: string;
      archetypeLabel?: string;
      archetypeTagline?: string;
      archetypeDescription?: string;
      archetypeStrengths?: string[];
      archetypeRisks?: string[];
      dimensionScores?: Record<string, number>;
      completedAt?: string;
    };
    STI?: {
      edgeScore?: number;
      zone?: string;
      zoneLabel?: string;
      archetype?: string;
      archetypeLabel?: string;
      archetypeDescription?: string;
      archetypeStrengths?: string[];
      archetypeRisks?: string[];
      dimensionScores?: Record<string, number>;
      topDevelopmentAreas?: Array<{ dimensionId: string; dimensionName: string; pct: number }>;
      completedAt?: string;
    };
  };
};

// ─── Guide Message Type ───────────────────────────────────────────────────────
export type GuideMessage = {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

// ─── Practice Coach Types ─────────────────────────────────────────────────────
export type PracticeScenario = {
  conversationType: string;
  userRole: string;
  avatarRole: string;
  relationship: string;
  context: string;
  stakes: string;
  desiredOutcome: string;
  avatarPersonality: string;
  difficultyLevel: "Easy" | "Medium" | "Hard" | "Executive";
  successCriteria: string;
  category: string;
};

export type PracticeMessage = {
  role: "user" | "avatar" | "coach";
  content: string;
  timestamp: string;
};

export type DimensionScore = {
  dimension: string;
  score: number; // 1-5
  comment: string;
};

export type PracticeFeedback = {
  overallScore: number; // 0-100
  dimensionScores: DimensionScore[];
  whatWorked: string;
  whatDidNotWork: string;
  missedOpportunities: string;
  strongerPhrases: string[];
  whereConversationShifted: string;
  whatOtherPersonHeard: string;
  oneBehaviourToImprove: string;
  recommendedNextAttempt: string;
  suggestedRealWorldAction: string;
};

// ─── Practice Sessions ────────────────────────────────────────────────────────
export const practiceSessions = mysqlTable("practice_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  issueText: text("issueText").notNull(),
  scenario: json("scenario").$type<PracticeScenario>(),
  coachingTranscript: json("coachingTranscript").$type<PracticeMessage[]>(),
  status: varchar("status", { length: 50 }).default("setup").notNull(), // setup | coaching | roleplay | feedback | complete
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Practice Attempts ────────────────────────────────────────────────────────
export const practiceAttempts = mysqlTable("practice_attempts", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull().references(() => practiceSessions.id),
  userId: int("userId").notNull().references(() => users.id),
  attemptNumber: int("attemptNumber").default(1).notNull(),
  transcript: json("transcript").$type<PracticeMessage[]>().notNull(),
  feedback: json("feedback").$type<PracticeFeedback>(),
  overallScore: int("overallScore"),
  userReflection: text("userReflection"),
  actionCommitment: text("actionCommitment"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Leadership Memory ────────────────────────────────────────────────────────
export type LeadershipMemoryEntry = {
  recurringIssues: string[];
  commonStakeholders: string[];
  avoidedConversations: string[];
  communicationStrengths: string[];
  communicationGaps: string[];
  blindSpots: string[];
  growthTheme: string;
  practiceCount: number;
  lastUpdated: string;
};

export const leadershipMemory = mysqlTable("leadership_memory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  memory: json("memory").$type<LeadershipMemoryEntry>(),
  aiSummary: text("aiSummary"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Before-Meeting Briefs ────────────────────────────────────────────────────
export type BeforeMeetingBriefData = {
  realObjective: string;
  conversationBeneathConversation: string;
  first60Seconds: string;
  keyMessage: string;
  likelyPushback: string[];
  bestResponses: string[];
  whatNotToSay: string[];
  strongAsk: string;
  howToClose: string;
  readinessScore: number;
  readinessAfter?: number;
};

export const beforeMeetingBriefs = mysqlTable("before_meeting_briefs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  meetingWith: varchar("meetingWith", { length: 255 }).notNull(),
  purpose: text("purpose").notNull(),
  desiredOutcome: text("desiredOutcome"),
  currentIssue: text("currentIssue"),
  stakes: varchar("stakes", { length: 100 }),
  possibleResistance: text("possibleResistance"),
  brief: json("brief").$type<BeforeMeetingBriefData>(),
  readinessBefore: int("readinessBefore"),
  readinessAfter: int("readinessAfter"),
  practiceSessionId: int("practiceSessionId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── After-Meeting Debriefs ───────────────────────────────────────────────────
export type AfterMeetingDebriefData = {
  whatHappened: string;
  whatOtherPersonHeard: string;
  whereConversationShifted: string;
  whatYouHandledWell: string;
  whatYouMissed: string;
  possibleBlindSpot: string;
  recoveryMove: string;
  suggestedFollowUpMessage: string;
  recommendedPractice: string;
  growthProfileUpdate: string;
};

export const afterMeetingDebriefs = mysqlTable("after_meeting_debriefs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  conversationContext: text("conversationContext").notNull(),
  debriefTranscript: json("debriefTranscript").$type<Array<{role: string; content: string}>>(),
  debriefReport: json("debriefReport").$type<AfterMeetingDebriefData>(),
  followUpMessage: text("followUpMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Improved Messages (Say It Better) ───────────────────────────────────────
export type ImprovedMessageData = {
  original: string;
  diplomatic: string;
  direct: string;
  executive: string;
  toneAssessment: string;
  clarityScore: number;
  executivePresenceScore: number;
  whatChanged: string;
  shorterVersion?: string;
};

export const improvedMessages = mysqlTable("improved_messages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  originalText: text("originalText").notNull(),
  context: varchar("context", { length: 255 }),
  result: json("result").$type<ImprovedMessageData>(),
  savedVersion: varchar("savedVersion", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Conversation Scripts ─────────────────────────────────────────────────────
export type ConversationScriptData = {
  scriptType: string;
  openingLine: string;
  context: string;
  observation: string;
  businessImpact: string;
  yourConcern: string;
  questionInvitation: string;
  clearAsk: string;
  likelyResistance: string;
  responseToResistance: string;
  closeWithCommitment: string;
  followUpNote: string;
};

export const conversationScripts = mysqlTable("conversation_scripts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  scriptType: varchar("scriptType", { length: 100 }).notNull(),
  situationContext: text("situationContext").notNull(),
  script: json("script").$type<ConversationScriptData>(),
  savedAt: timestamp("savedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Commitments ─────────────────────────────────────────────────────────────
export const commitments = mysqlTable("commitments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  text: text("text").notNull(),
  dueDate: timestamp("dueDate"),
  sourceType: varchar("sourceType", { length: 50 }), // coaching | roleplay | debrief | brief | manual
  sourceId: int("sourceId"),
  status: varchar("status", { length: 50 }).default("pending").notNull(), // pending | done_well | done_partial | done_poorly | avoided | postponed
  outcome: text("outcome"),
  aiRecommendation: text("aiRecommendation"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Readiness Scores ─────────────────────────────────────────────────────────
export const readinessScores = mysqlTable("readiness_scores", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  context: varchar("context", { length: 255 }).notNull(),
  scoreBefore: int("scoreBefore").notNull(),
  scoreAfter: int("scoreAfter"),
  sourceType: varchar("sourceType", { length: 50 }), // brief | coaching | roleplay
  sourceId: int("sourceId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Coach Briefs (Human Coach Sharing) ──────────────────────────────────────
export type CoachBriefData = {
  currentIssue: string;
  leaderDesiredOutcome: string;
  aiObservedPattern: string;
  possibleBlindSpot: string;
  practiceCompleted: string;
  scoresAndImprovements: string;
  commitmentsMade: string[];
  suggestedCoachingQuestions: string[];
  followUpItems: string[];
};

export const coachBriefs = mysqlTable("coach_briefs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  shareLevel: varchar("shareLevel", { length: 50 }).default("summary").notNull(), // summary | transcript | feedback | growth | selected
  brief: json("brief").$type<CoachBriefData>(),
  sharedAt: timestamp("sharedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Privacy Settings ─────────────────────────────────────────────────────────
export const privacySettings = mysqlTable("privacy_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  shareWithCoach: varchar("shareWithCoach", { length: 50 }).default("nothing").notNull(), // nothing | summary | transcript | feedback | growth | selected
  shareWithOrg: boolean("shareWithOrg").default(false).notNull(),
  allowAggregateAnalytics: boolean("allowAggregateAnalytics").default(true).notNull(),
  coachEmail: varchar("coachEmail", { length: 255 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Guide Sessions (for unlock gate tracking) ───────────────────────────────
// A guide session is counted each time the user sends a message in a new
// conversation day. We track the module context so gates are module-specific.
export const guideSessions = mysqlTable("guide_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  // Which diagnostic module this session is attributed to (most recently completed)
  moduleType: mysqlEnum("moduleType", ["ECI", "TII", "LII", "GCC", "LDI", "STI", "GENERAL"]).notNull().default("GENERAL"),
  // The guide conversation this session belongs to
  conversationId: int("conversationId").references(() => guideConversations.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type GuideSession = typeof guideSessions.$inferSelect;

// ─── Diagnostic Unlock Progress ───────────────────────────────────────────────
// Tracks the three-layer unlock gate for each user/module pair.
// One row per (userId, toModule) — the module they are trying to unlock.
export const diagnosticUnlockProgress = mysqlTable("diagnostic_unlock_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  tenantId: int("tenantId").references(() => tenants.id),
  // The module that was just completed (the prerequisite)
  fromModule: mysqlEnum("fromModule", ["ECI", "TII", "LII", "GCC", "LDI", "STI"]).notNull(),
  // The module being unlocked
  toModule: mysqlEnum("toModule", ["ECI", "TII", "LII", "GCC", "LDI", "STI"]).notNull(),
  // When the fromModule diagnostic was completed (starts the 21-day clock)
  fromCompletedAt: timestamp("fromCompletedAt").notNull(),
  // Layer 1: time gate — 21 days from fromCompletedAt
  timegatePassedAt: timestamp("timegatePassedAt"),
  // Layer 2: action gate progress
  missionsCompleted: int("missionsCompleted").default(0).notNull(),   // target: 5
  guideSessionsCompleted: int("guideSessionsCompleted").default(0).notNull(), // target: 3
  commitmentSet: boolean("commitmentSet").default(false).notNull(),   // target: 1
  // The lowest-scoring dimension from the fromModule report (focus area)
  focusDimension: varchar("focusDimension", { length: 255 }),
  // Layer 3: when all gates passed and narrative was surfaced
  allGatesPassedAt: timestamp("allGatesPassedAt"),
  narrativeShown: boolean("narrativeShown").default(false).notNull(),
  // When the toModule was actually unlocked (all gates satisfied)
  unlockedAt: timestamp("unlockedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type DiagnosticUnlockProgress = typeof diagnosticUnlockProgress.$inferSelect;

// ─── Conversation Intelligence (ChatGPT / AI Import) ────────────────────────
// Stores LLM-synthesised leadership themes extracted from a leader's AI
// conversation export. Raw files are NEVER stored — only the approved synthesis.
export type ConversationIntelligenceTheme = {
  id: string;           // slug e.g. "avoidance_of_conflict"
  title: string;        // e.g. "Avoidance of Direct Conflict"
  description: string;  // 2-3 sentence synthesis
  frequency: "high" | "medium" | "low"; // how often it appeared
  evidenceCount: number; // number of conversations that surfaced this theme
  category: "challenge" | "strength" | "pattern" | "goal";
};

export type ConversationIntelligenceSummary = {
  totalConversations: number;       // total conversations in the export
  leadershipConversations: number;  // filtered to leadership-relevant ones
  dateRange: { from: string; to: string };
  overallSynthesis: string;         // 3-4 sentence executive summary
  themes: ConversationIntelligenceTheme[];
  importedAt: string;
  sourceApp: "chatgpt" | "claude" | "text_paste" | "other";
};

export const conversationIntelligence = mysqlTable("conversation_intelligence", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  sourceApp: mysqlEnum("sourceApp", ["chatgpt", "claude", "text_paste", "other"]).notNull().default("chatgpt"),
  summary: json("summary").$type<ConversationIntelligenceSummary>(),
  // Individual approved themes stored as JSON array
  themes: json("themes").$type<ConversationIntelligenceTheme[]>(),
  // Metadata
  totalConversations: int("totalConversations"),
  leadershipConversations: int("leadershipConversations"),
  dateRangeFrom: varchar("dateRangeFrom", { length: 50 }),
  dateRangeTo: varchar("dateRangeTo", { length: 50 }),
  // Raw file is NEVER stored — deleted immediately after processing
  // This flag confirms deletion occurred
  rawFileDeleted: boolean("rawFileDeleted").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ConversationIntelligence = typeof conversationIntelligence.$inferSelect;
export type InsertConversationIntelligence = typeof conversationIntelligence.$inferInsert;

// ─── 30-Day Growth Plans ──────────────────────────────────────────────────────
export type GrowthPlanData = {
  growthTheme: string;
  whyItMatters: string;
  currentPattern: string;
  targetBehaviour: string;
  week1: string;
  week2: string;
  week3: string;
  week4: string;
  realWorldActions: string[];
  recommendedRolePlays: string[];
  recommendedDrills: string[];
  reflectionQuestions: string[];
  successIndicators: string[];
};

export const growthPlans = mysqlTable("growth_plans", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  plan: json("plan").$type<GrowthPlanData>(),
  isActive: boolean("isActive").default(true).notNull(),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Prior Assessments (MBTI, DISC, Hogan, Gallup, 360, etc.) ────────────────
// Stores LLM-synthesised leadership themes extracted from third-party assessment
// reports. Raw PDF files are NEVER stored — only the approved synthesis.
export type PriorAssessmentTheme = {
  id: string;           // slug e.g. "high_conscientiousness"
  title: string;        // e.g. "High Conscientiousness"
  description: string;  // 2-3 sentence synthesis
  category: "strength" | "challenge" | "pattern" | "blind_spot" | "growth_area";
  relevance: "high" | "medium" | "low";
};

export type PriorAssessmentData = {
  assessmentType: string;       // e.g. "MBTI", "DISC", "Hogan", "Gallup", "360"
  assessmentLabel: string;      // human-readable e.g. "Myers-Briggs Type Indicator"
  participantName: string;
  reportDate: string;
  overallSummary: string;       // 3-4 sentence executive synthesis
  keyResult: string;            // e.g. "INTJ", "High D / Low S", "Achiever"
  themes: PriorAssessmentTheme[];
  coachingContext: string;      // How this relates to leadership development
  importedAt: string;
};

export const priorAssessments = mysqlTable("prior_assessments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  assessmentType: varchar("assessmentType", { length: 100 }).notNull(), // MBTI | DISC | Hogan | Gallup | 360 | Other
  assessmentLabel: varchar("assessmentLabel", { length: 255 }).notNull(),
  data: json("data").$type<PriorAssessmentData>(),
  themes: json("themes").$type<PriorAssessmentTheme[]>(),
  // Raw file is NEVER stored — deleted immediately after processing
  rawFileDeleted: boolean("rawFileDeleted").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PriorAssessment = typeof priorAssessments.$inferSelect;
export type InsertPriorAssessment = typeof priorAssessments.$inferInsert;

// ─── Enterprise Onboarding: Company Context Layer ─────────────────────────────

export type OrgSetupRoute = "upload" | "build" | "standard";
export type WizardStatus = "in_progress" | "completed" | "activated";
export type ApprovalStatus = "pending" | "approved" | "rejected" | "needs_review";
export type ConfidentialityLevel = "general" | "internal" | "confidential" | "restricted" | "executive";
export type CompetencyCategory = "leading_self" | "leading_others" | "leading_teams" | "leading_business" | "leading_transformation" | "custom";
export type PriorityRank = "critical" | "high" | "medium" | "emerging";

export type OrgValue = {
  id: string;
  name: string;
  shortDefinition: string;
  fullDescription: string;
  positiveBehaviours: string[];
  negativeBehaviours: string[];
  approvalStatus: ApprovalStatus;
  sourceType: "manual" | "ai_extracted" | "url_extracted";
};

export type OrgCompetency = {
  id: string;
  name: string;
  category: CompetencyCategory;
  shortDefinition: string;
  fullDefinition: string;
  positiveBehaviours: string[];
  riskBehaviours: string[];
  approvalStatus: ApprovalStatus;
  sourceType: "manual" | "ai_extracted" | "url_extracted";
  levelnextMapping?: string; // mapped LevelNext universal capability
  mappingType?: "direct" | "partial" | "composite" | "custom" | "unmapped";
};

export type OrgStrategicPriority = {
  id: string;
  title: string;
  description: string;
  rank: PriorityRank;
  sponsor?: string;
  targetDate?: string;
  requiredCapabilities: string[];
  approvalStatus: ApprovalStatus;
  sourceType: "manual" | "ai_extracted";
};

export type OrgTerminology = {
  id: string;
  preferredTerm: string;
  definition: string;
  alternativeTerms: string[];
  prohibitedTerms: string[];
};

export type OrgBranding = {
  primaryColor: string;
  logoUrl?: string;
  preferredLanguage: string; // e.g. "British English"
  terminology: OrgTerminology[];
};

export type OrgApplicationSettings = {
  useInDiagnostics: boolean;
  useInAICoaching: boolean;
  useInSimulations: boolean;
  useInReports: boolean;
  useInDashboards: boolean;
  managerCanSeeGoals: boolean;
  managerCanSeeProgress: boolean;
  hrCanSeeAggregates: boolean;
};

// Main organisation record (extended from tenants)
export const organisations = mysqlTable("organisations", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull().references(() => tenants.id).unique(),
  // Company profile
  legalName: varchar("legalName", { length: 255 }).notNull(),
  displayName: varchar("displayName", { length: 255 }),
  website: varchar("website", { length: 500 }),
  logoUrl: varchar("logoUrl", { length: 1000 }),
  industry: varchar("industry", { length: 100 }),
  subIndustry: varchar("subIndustry", { length: 100 }),
  companySize: varchar("companySize", { length: 50 }),
  employeeCount: varchar("employeeCount", { length: 50 }),
  hq: varchar("hq", { length: 100 }),
  countries: json("countries").$type<string[]>(),
  primaryLanguage: varchar("primaryLanguage", { length: 50 }),
  description: text("description"),
  isGcc: boolean("isGcc").default(false),
  // Mission / Vision / Purpose
  missionStatement: text("missionStatement"),
  visionStatement: text("visionStatement"),
  purposeStatement: text("purposeStatement"),
  missionSourceType: varchar("missionSourceType", { length: 30 }), // manual | url_extracted | doc_extracted
  // Values, competencies, priorities stored as JSON arrays
  values: json("values").$type<OrgValue[]>(),
  competencies: json("competencies").$type<OrgCompetency[]>(),
  strategicPriorities: json("strategicPriorities").$type<OrgStrategicPriority[]>(),
  // Branding & terminology
  branding: json("branding").$type<OrgBranding>(),
  // Platform application settings
  applicationSettings: json("applicationSettings").$type<OrgApplicationSettings>(),
  // Wizard state
  setupRoute: mysqlEnum("setupRoute", ["upload", "build", "standard"]),
  wizardStep: int("wizardStep").default(1),
  wizardStatus: mysqlEnum("wizardStatus", ["in_progress", "completed", "activated"]).default("in_progress"),
  contextActivated: boolean("contextActivated").default(false),
  activatedAt: timestamp("activatedAt"),
  createdBy: int("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Organisation = typeof organisations.$inferSelect;
export type InsertOrganisation = typeof organisations.$inferInsert;

// Uploaded documents for AI extraction
export type DocProcessingStatus = "uploaded" | "processing" | "extracted" | "needs_review" | "approved" | "rejected";

export const orgDocuments = mysqlTable("org_documents", {
  id: int("id").autoincrement().primaryKey(),
  organisationId: int("organisationId").notNull().references(() => organisations.id),
  title: varchar("title", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 1000 }),
  fileKey: varchar("fileKey", { length: 500 }),
  fileName: varchar("fileName", { length: 255 }),
  fileSize: int("fileSize"),
  mimeType: varchar("mimeType", { length: 100 }),
  confidentiality: mysqlEnum("confidentiality", ["general", "internal", "confidential", "restricted", "executive"]).default("internal"),
  processingStatus: mysqlEnum("processingStatus", ["uploaded", "processing", "extracted", "needs_review", "approved", "rejected"]).default("uploaded"),
  // Permissions
  useInAICoaching: boolean("useInAICoaching").default(true),
  useInDiagnostics: boolean("useInDiagnostics").default(true),
  useInReports: boolean("useInReports").default(true),
  useInSimulations: boolean("useInSimulations").default(false),
  // Extracted content (raw JSON from AI)
  extractedContent: json("extractedContent"),
  uploadedBy: int("uploadedBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type OrgDocument = typeof orgDocuments.$inferSelect;
export type InsertOrgDocument = typeof orgDocuments.$inferInsert;

// Pending invitations for team setup
export const orgInvitations = mysqlTable("org_invitations", {
  id: int("id").autoincrement().primaryKey(),
  organisationId: int("organisationId").notNull().references(() => organisations.id),
  email: varchar("email", { length: 320 }).notNull(),
  role: mysqlEnum("role", ["owner", "admin", "member"]).default("member").notNull(),
  invitedBy: int("invitedBy").references(() => users.id),
  status: mysqlEnum("status", ["pending", "accepted", "expired"]).default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type OrgInvitation = typeof orgInvitations.$inferSelect;
export type InsertOrgInvitation = typeof orgInvitations.$inferInsert;
