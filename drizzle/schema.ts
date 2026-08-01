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
  role: mysqlEnum("role", ["user", "admin", "success_partner"]).default("user").notNull(),
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
  moduleType: mysqlEnum("moduleType", ["ECI", "TII", "LII", "GCC", "LDI", "STI", "NII", "CPI", "CRS", "CMK", "CST", "CAO", "AIR"]).notNull(),
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
  moduleType: mysqlEnum("moduleType", ["ECI", "TII", "LII", "GCC", "LDI", "STI", "NII", "CPI", "CRS", "CMK", "CST", "CAO", "AIR"]).notNull(),
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
  moduleType: mysqlEnum("moduleType", ["ECI", "TII", "LII", "GCC", "LDI", "STI", "NII", "GENERAL", "CPI", "CRS", "CMK", "CST", "CAO", "AIR"]).notNull().default("GENERAL"),
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
    NII?: number;
  };
  // Per-module archetypes
  archetypes?: {
    ECI?: string;
    TII?: string;
    LII?: string;
    GCC?: string;
    LDI?: string;
    STI?: string;
    NII?: string;
  };
  // Per-module zones
  zones?: {
    ECI?: string;
    TII?: string;
    LII?: string;
    GCC?: string;
    LDI?: string;
    STI?: string;
    NII?: string;
  };
  // Key strengths aggregated across modules
  strengths?: string[];
  // Key growth opportunities aggregated across modules
  growthOpportunities?: string[];
  // Completed module types
  completedModules?: ("ECI" | "TII" | "LII" | "GCC" | "LDI" | "STI" | "NII")[];
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
    NII?: {
      edgeScore?: number;
      zone?: string;
      zoneLabel?: string;
      maturityLevelId?: string;
      maturityLevelName?: string;
      maturityLevelNumber?: number;
      archetype?: string;
      archetypeLabel?: string;
      archetypeTagline?: string;
      archetypeStrengths?: string[];
      archetypeRisks?: string[];
      dimensionScores?: Record<string, number>;
      topStrengths?: Array<{ dimensionId: string; dimensionName: string; score: number }>;
      developmentPriorities?: Array<{ dimensionId: string; dimensionName: string; score: number }>;
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

// ─── Coaching Summary Data (Ontological fields) ──────────────────────────────
export type CoachingSummaryData = {
  realIssue?: string;
  leadershipGap?: string;
  behaviourToStrengthen?: string;
  conversationNeeded?: string;
  recommendedApproach?: string;
  suggestedOpeningLines?: string[];
  likelyResistance?: string;
  howToHandleResistance?: string;
  recommendedSimulation?: string;
  commitmentSuggestion?: string;
  diagnosticLink?: string;
  dominantNarrative?: string;
  ontologicalDistinction?: string;
  reframedNarrative?: string;
  moodCheck?: string;
};

// ─── Practice Sessions ────────────────────────────────────────────────────────
export const practiceSessions = mysqlTable("practice_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  issueText: text("issueText").notNull(),
  scenario: json("scenario").$type<PracticeScenario>(),
  coachingTranscript: json("coachingTranscript").$type<PracticeMessage[]>(),
  coachingSummaryData: json("coachingSummaryData").$type<CoachingSummaryData>(),
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
  difficulty: varchar("difficulty", { length: 20 }).default("Medium"),
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
  momentumMode: boolean("momentumMode").default(false).notNull(),
  weeklyEmailEnabled: boolean("weeklyEmailEnabled").default(true).notNull(),
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
  nextPracticeGoal?: string;  // Personalised goal for the user's next practice session
  nextPracticeScenario?: string; // Specific scenario to practice next
  observerShift?: string; // What observer shift would most help in the next conversation
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
  moduleType: mysqlEnum("moduleType", ["ECI", "TII", "LII", "GCC", "LDI", "STI", "NII", "GENERAL", "CPI", "CRS", "CMK", "CST", "CAO", "AIR"]).notNull().default("GENERAL"),
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
  fromModule: mysqlEnum("fromModule", ["ECI", "TII", "LII", "GCC", "LDI", "STI", "NII", "CPI", "CRS", "CMK", "CST", "CAO", "AIR"]).notNull(),
  // The module being unlocked
  toModule: mysqlEnum("toModule", ["ECI", "TII", "LII", "GCC", "LDI", "STI", "NII", "CPI", "CRS", "CMK", "CST", "CAO", "AIR"]).notNull(),
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

// ─── Pilot Applications ───────────────────────────────────────────────────────
export const pilotApplications = mysqlTable("pilot_applications", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  company: varchar("company", { length: 255 }).notNull(),
  companyUrl: varchar("companyUrl", { length: 500 }),
  teamSize: varchar("teamSize", { length: 50 }),
  message: text("message"),
  status: mysqlEnum("status", ["new", "contacted", "booked", "declined"]).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PilotApplication = typeof pilotApplications.$inferSelect;
export type InsertPilotApplication = typeof pilotApplications.$inferInsert;

// ─── Platform Invites (Magic Links) ──────────────────────────────────────────
export const platformInvites = mysqlTable("platform_invites", {
  id: int("id").autoincrement().primaryKey(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  email: varchar("email", { length: 320 }).notNull(),
  name: varchar("name", { length: 255 }),
  invitedBy: int("invitedBy").references(() => users.id),
  pilotApplicationId: int("pilotApplicationId").references(() => pilotApplications.id),
  status: mysqlEnum("status", ["pending", "accepted", "expired"]).default("pending").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  acceptedAt: timestamp("acceptedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PlatformInvite = typeof platformInvites.$inferSelect;
export type InsertPlatformInvite = typeof platformInvites.$inferInsert;

// ─── Momentum Partner Calls ───────────────────────────────────────────────────
// Tracks fortnightly accountability calls between a Momentum Partner and a leader
export const momentumPartnerCalls = mysqlTable("momentum_partner_calls", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  // Scheduled date for the call (fortnightly cadence)
  scheduledAt: timestamp("scheduledAt").notNull(),
  // Actual call date (set when logged)
  calledAt: timestamp("calledAt"),
  // The commitment being tracked (copied from commitments table at call creation)
  commitmentText: text("commitmentText"),
  commitmentId: int("commitmentId").references(() => commitments.id),
  // Outcome logged by Momentum Partner after the call
  outcome: mysqlEnum("outcome", ["implemented", "partial", "not_implemented", "no_show"]),
  // Confidence level the leader expressed (1–5)
  leaderConfidence: int("leaderConfidence"),
  // Notes from the call (what the leader said, specific examples given)
  callNotes: text("callNotes"),
  // Blocker mentioned by the leader
  blockerMentioned: text("blockerMentioned"),
  // Whether to escalate to Executive Coach
  escalateToCoach: boolean("escalateToCoach").default(false).notNull(),
  // AI-generated opening script for the Momentum Partner
  suggestedOpening: text("suggestedOpening"),
  // Status of the call record
  status: mysqlEnum("status", ["scheduled", "completed", "missed"]).default("scheduled").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MomentumPartnerCall = typeof momentumPartnerCalls.$inferSelect;
export type InsertMomentumPartnerCall = typeof momentumPartnerCalls.$inferInsert;

// ─── Products ─────────────────────────────────────────────────────────────────
// Defines each intelligence product (e.g. Leadership Intelligence, Career Intelligence)
export const products = mysqlTable("products", {
  id: varchar("id", { length: 50 }).primaryKey(), // e.g. 'leadership_intelligence'
  name: varchar("name", { length: 255 }).notNull(), // e.g. 'Leadership Intelligence'
  tagline: varchar("tagline", { length: 255 }), // e.g. 'Know your edge. Grow it.'
  coachRole: varchar("coachRole", { length: 100 }).notNull(), // e.g. 'Executive Leadership Coach'
  coachName: varchar("coachName", { length: 100 }).notNull().default("Guide"), // e.g. 'Guide'
  coachPrompt: text("coachPrompt").notNull(), // Full system prompt for the AI Guide
  practiceCoachPrompt: text("practiceCoachPrompt"), // Override for Practice Coach
  primaryOutcomes: json("primaryOutcomes").$type<string[]>(), // e.g. ['Career clarity', 'Market positioning']
  journeyStages: json("journeyStages").$type<string[]>(), // e.g. ['Discover', 'Position', 'Prepare']
  accentColor: varchar("accentColor", { length: 50 }).default("var(--color-ln-yellow)"), // CSS color
  isActive: boolean("isActive").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// ─── Product Modules ──────────────────────────────────────────────────────────
// Defines the diagnostic sequence for each product
export const productModules = mysqlTable("product_modules", {
  id: int("id").autoincrement().primaryKey(),
  productId: varchar("productId", { length: 50 }).notNull().references(() => products.id),
  moduleCode: varchar("moduleCode", { length: 20 }).notNull(), // e.g. 'ECI', 'CPI'
  moduleName: varchar("moduleName", { length: 255 }).notNull(), // e.g. 'Executive Communication Intelligence'
  moduleDescription: text("moduleDescription"),
  sequenceOrder: int("sequenceOrder").notNull(), // 1-based position in the product journey
  isEntryPoint: boolean("isEntryPoint").default(false).notNull(), // true for the first module (always unlocked)
  prerequisiteCode: varchar("prerequisiteCode", { length: 20 }), // module code that must be completed first
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ProductModule = typeof productModules.$inferSelect;
export type InsertProductModule = typeof productModules.$inferInsert;

// ─── User Product Enrollments ─────────────────────────────────────────────────
// Links users to one or more products; tracks their active product
export const userProductEnrollments = mysqlTable("user_product_enrollments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  productId: varchar("productId", { length: 50 }).notNull().references(() => products.id),
  enrolledAt: timestamp("enrolledAt").defaultNow().notNull(),
  enrolledBy: int("enrolledBy").references(() => users.id), // admin who enrolled them
  isActive: boolean("isActive").default(true).notNull(),
  // The last time this user switched to this product (used to restore active product on login)
  lastActiveAt: timestamp("lastActiveAt").defaultNow().notNull(),
});
export type UserProductEnrollment = typeof userProductEnrollments.$inferSelect;
export type InsertUserProductEnrollment = typeof userProductEnrollments.$inferInsert;

// ─── Magic Link Tokens ────────────────────────────────────────────────────────
// One-time email authentication tokens — allows clients to sign in without a Manus account
export const magicLinkTokens = mysqlTable("magic_link_tokens", {
  id: int("id").autoincrement().primaryKey(),
  token: varchar("token", { length: 128 }).notNull().unique(),
  email: varchar("email", { length: 320 }).notNull(),
  userId: int("userId").references(() => users.id), // set after first use (user created)
  inviteToken: varchar("inviteToken", { length: 64 }), // platform invite token to auto-accept
  returnTo: varchar("returnTo", { length: 255 }), // post-login redirect path (e.g. /career, /manager)
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type MagicLinkToken = typeof magicLinkTokens.$inferSelect;
export type InsertMagicLinkToken = typeof magicLinkTokens.$inferInsert;

// ─── Lead Captures (Landing Page Email Capture) ───────────────────────────────
// Stores email addresses captured from the landing page sample report lead magnet
export const leadCaptures = mysqlTable("lead_captures", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  name: varchar("name", { length: 200 }),
  source: varchar("source", { length: 64 }).default("sample_report").notNull(), // e.g. sample_report, landing_cta
  moduleCode: varchar("moduleCode", { length: 16 }), // which sample PDF they requested
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type LeadCapture = typeof leadCaptures.$inferSelect;
export type InsertLeadCapture = typeof leadCaptures.$inferInsert;

// ─── Leader Playbook ──────────────────────────────────────────────────────────
// playbook_sessions: one row per leader situation the user brings to the Playbook
export const playbookSessions = mysqlTable("playbook_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  // Raw situation text entered by the leader
  situationText: text("situationText").notNull(),
  // LLM classification output (JSON)
  classification: json("classification"),
  // Primary playbook type (e.g. "Managing Up", "Customer Escalation")
  playbookType: varchar("playbookType", { length: 100 }),
  // Full 13-section playbook content (JSON)
  playbookContent: json("playbookContent"),
  // Whether the leader has marked the conversation as done (triggers reflection prompt)
  conversationDone: boolean("conversationDone").default(false).notNull(),
  // Checklist completion state (JSON)
  checklistState: json("checklistState"),
  // Script edits saved by the leader (JSON)
  scriptEdits: json("scriptEdits"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PlaybookSession = typeof playbookSessions.$inferSelect;
export type InsertPlaybookSession = typeof playbookSessions.$inferInsert;

// playbook_reflections: post-meeting reflection linked to a session
export const playbookReflections = mysqlTable("playbook_reflections", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull().references(() => playbookSessions.id),
  userId: int("userId").notNull().references(() => users.id),
  whatHappened: text("whatHappened"),
  whatSurprised: text("whatSurprised"),
  whatWorked: text("whatWorked"),
  whatDidnt: text("whatDidnt"),
  whatToChange: text("whatToChange"),
  // Overall outcome: win / partial / loss / unclear
  outcome: varchar("outcome", { length: 20 }),
  // LLM-generated reflection insight
  reflectionInsight: text("reflectionInsight"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PlaybookReflection = typeof playbookReflections.$inferSelect;
export type InsertPlaybookReflection = typeof playbookReflections.$inferInsert;

// playbook_patterns: aggregated pattern intelligence per user
export const playbookPatterns = mysqlTable("playbook_patterns", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id).unique(),
  // Situation frequency map (JSON: { "Managing Up": 5, "Difficult Feedback": 3, ... })
  situationFrequency: json("situationFrequency"),
  // Competency signals (JSON: { "Executive Communication": { count: 5, avgOutcome: 0.7 }, ... })
  competencySignals: json("competencySignals"),
  // Avoided situations (JSON: string[])
  avoidedSituations: json("avoidedSituations"),
  // Recurring challenges (JSON: string[])
  recurringChallenges: json("recurringChallenges"),
  totalSessions: int("totalSessions").default(0).notNull(),
  totalReflections: int("totalReflections").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PlaybookPattern = typeof playbookPatterns.$inferSelect;
export type InsertPlaybookPattern = typeof playbookPatterns.$inferInsert;

// ─── Career Access Intelligence™ ─────────────────────────────────────────────

// career_profiles: the leader's full career intake (Career Graph foundation)
export const careerProfiles = mysqlTable("career_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id).unique(),
  // Section 1: Role & Destination
  targetRole: varchar("targetRole", { length: 200 }),
  targetRoleType: varchar("targetRoleType", { length: 100 }), // CXO | VP | GM | Board | Fractional | Founder
  problemsToSolve: text("problemsToSolve"),
  legacyStatement: text("legacyStatement"),
  // Section 2: Industry & Company Preferences
  targetIndustries: json("targetIndustries").$type<string[]>(),
  avoidIndustries: json("avoidIndustries").$type<string[]>(),
  targetCompanyTypes: json("targetCompanyTypes").$type<string[]>(), // MNC | GCC | Startup | PE | Family | Board | Advisory
  dreamCompanies: json("dreamCompanies").$type<string[]>(),
  targetGeographies: json("targetGeographies").$type<string[]>(),
  // Section 3: Compensation & Lifestyle
  targetCompensationMin: int("targetCompensationMin"), // in lakhs INR or USD thousands
  targetCompensationMax: int("targetCompensationMax"),
  compensationCurrency: varchar("compensationCurrency", { length: 10 }).default("INR"),
  preferredWorkStyle: varchar("preferredWorkStyle", { length: 50 }), // onsite | hybrid | remote | flexible
  lifestyleStatement: text("lifestyleStatement"),
  familyConstraints: text("familyConstraints"),
  // Section 4: Values & Motivation
  coreValues: json("coreValues").$type<string[]>(),
  careerMotivation: text("careerMotivation"), // What drives you most right now
  riskAppetite: varchar("riskAppetite", { length: 20 }), // low | medium | high
  // Section 5: Professional Assets
  linkedinUrl: varchar("linkedinUrl", { length: 500 }),
  resumeUrl: varchar("resumeUrl", { length: 500 }),
  careerHistory: text("careerHistory"), // brief narrative of career arc
  keyAchievements: text("keyAchievements"),
  awardsAndRecognition: text("awardsAndRecognition"),
  speakingHistory: text("speakingHistory"),
  publications: text("publications"), // articles, books, patents
  industryExpertise: json("industryExpertise").$type<string[]>(),
  // Meta
  completionPct: int("completionPct").default(0).notNull(), // 0-100
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CareerProfile = typeof careerProfiles.$inferSelect;
export type InsertCareerProfile = typeof careerProfiles.$inferInsert;

// career_strategy_statements: AI-generated career strategy from the profile
export const careerStrategyStatements = mysqlTable("career_strategy_statements", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  // The full AI-generated strategy (JSON)
  strategyData: json("strategyData").$type<{
    headline: string;           // e.g. "Building access to PE-backed CFO roles in APAC FinTech"
    positioningStatement: string; // 2-3 sentence executive positioning
    uniqueValueProposition: string; // What makes this leader distinctively valuable
    targetOpportunityTypes: string[]; // Top 3 opportunity types to pursue
    primaryNarrative: string;   // The story to tell in every conversation
    keyStrengths: string[];     // Top 5 strengths to lead with
    credibilityGaps: string[];  // 2-3 gaps to address proactively
    timeHorizon: string;        // e.g. "3-6 months for VP roles, 12-18 months for CXO"
    northStarStatement: string; // The one-sentence career north star
    immediateActions: string[]; // Top 3 actions to take in the next 30 days
  }>(),
  // Which profile version generated this (for versioning)
  profileVersion: int("profileVersion").default(1).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CareerStrategyStatement = typeof careerStrategyStatements.$inferSelect;

// opportunity_universe: AI-generated scored list of target organisations
export const opportunityUniverse = mysqlTable("opportunity_universe", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  // Organisation details
  companyName: varchar("companyName", { length: 200 }).notNull(),
  companyType: varchar("companyType", { length: 50 }).notNull(), // Dream | Likely | Emerging | GCC | PE | FamilyBusiness | Consulting | Board | Advisory | Fractional | OperatingPartner
  industry: varchar("industry", { length: 100 }),
  geography: varchar("geography", { length: 100 }),
  description: text("description"), // Why this company is relevant
  // 10-dimension scores (1-10 each)
  scoreFit: int("scoreFit"),
  scoreGrowth: int("scoreGrowth"),
  scoreLearning: int("scoreLearning"),
  scoreInfluence: int("scoreInfluence"),
  scoreCompensation: int("scoreCompensation"),
  scoreLeadershipCulture: int("scoreLeadershipCulture"),
  scoreInnovation: int("scoreInnovation"),
  scoreStability: int("scoreStability"),
  scoreCareerAcceleration: int("scoreCareerAcceleration"),
  scorePurposeAlignment: int("scorePurposeAlignment"),
  // Composite score (average of 10 dimensions)
  compositeScore: int("compositeScore"),
  // AI reasoning
  whyThisCompany: text("whyThisCompany"),
  potentialRole: varchar("potentialRole", { length: 200 }),
  hiddenOpportunitySignal: text("hiddenOpportunitySignal"), // e.g. "Series B raised, likely scaling leadership team"
  // User actions
  status: varchar("status", { length: 30 }).default("identified").notNull(), // identified | researching | targeting | active | paused | removed
  userNotes: text("userNotes"),
  // Batch tracking (each AI generation creates a batch)
  batchId: int("batchId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type OpportunityUniverse = typeof opportunityUniverse.$inferSelect;
export type InsertOpportunityUniverse = typeof opportunityUniverse.$inferInsert;

// ─────────────────────────────────────────────────────────────────────────────
// CAREER ACCESS INTELLIGENCE — SPRINT 2
// ─────────────────────────────────────────────────────────────────────────────

// relationship_contacts: the user's living Relationship Graph
export const relationshipContacts = mysqlTable("relationship_contacts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  name: varchar("name", { length: 200 }).notNull(),
  currentTitle: varchar("currentTitle", { length: 200 }),
  currentCompany: varchar("currentCompany", { length: 200 }),
  industry: varchar("industry", { length: 100 }),
  geography: varchar("geography", { length: 100 }),
  linkedinUrl: varchar("linkedinUrl", { length: 500 }),
  email: varchar("email", { length: 200 }),
  phone: varchar("phone", { length: 50 }),
  relationshipType: varchar("relationshipType", { length: 50 }).notNull(),
  howWeKnowEachOther: text("howWeKnowEachOther"),
  sharedHistory: text("sharedHistory"),
  scoreTrust: int("scoreTrust"),
  scoreInfluence: int("scoreInfluence"),
  scoreAccessibility: int("scoreAccessibility"),
  scoreRecency: int("scoreRecency"),
  scoreWarmth: int("scoreWarmth"),
  scoreStrategicValue: int("scoreStrategicValue"),
  scoreLikelihoodToHelp: int("scoreLikelihoodToHelp"),
  compositeScore: int("compositeScore"),
  recommendedAction: varchar("recommendedAction", { length: 50 }),
  recommendedActionReason: text("recommendedActionReason"),
  nextActionDue: timestamp("nextActionDue"),
  lastContactDate: timestamp("lastContactDate"),
  contactFrequencyDays: int("contactFrequencyDays").default(90),
  notes: text("notes"),
  linkedOpportunityIds: json("linkedOpportunityIds").$type<number[]>().default([]),
  isKeyConnector: boolean("isKeyConnector").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type RelationshipContact = typeof relationshipContacts.$inferSelect;
export type InsertRelationshipContact = typeof relationshipContacts.$inferInsert;

// access_paths: AI-generated access strategies for each target organisation
export const accessPaths = mysqlTable("access_paths", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  opportunityId: int("opportunityId").notNull().references(() => opportunityUniverse.id),
  companyName: varchar("companyName", { length: 200 }).notNull(),
  targetRole: varchar("targetRole", { length: 200 }),
  decisionMakers: json("decisionMakers").$type<Array<{
    name: string; title: string; linkedinUrl?: string; whyTheyMatter: string;
  }>>().default([]),
  bestPath: json("bestPath").$type<{
    description: string; steps: string[]; keyContact?: string;
    estimatedTimeWeeks: number; confidenceScore: number;
  }>(),
  alternativePath: json("alternativePath").$type<{
    description: string; steps: string[]; keyContact?: string;
    estimatedTimeWeeks: number; confidenceScore: number;
  }>(),
  fastestPath: json("fastestPath").$type<{
    description: string; steps: string[]; keyContact?: string;
    estimatedTimeWeeks: number; confidenceScore: number;
  }>(),
  safestPath: json("safestPath").$type<{
    description: string; steps: string[]; keyContact?: string;
    estimatedTimeWeeks: number; confidenceScore: number;
  }>(),
  highestProbabilityPath: json("highestProbabilityPath").$type<{
    description: string; steps: string[]; keyContact?: string;
    estimatedTimeWeeks: number; confidenceScore: number;
  }>(),
  mutualConnections: json("mutualConnections").$type<Array<{
    contactName: string; connectionType: string;
    strengthOfLink: string; suggestedAsk: string;
  }>>().default([]),
  warmIntroRequest: text("warmIntroRequest"),
  directOutreachEmail: text("directOutreachEmail"),
  linkedinMessage: text("linkedinMessage"),
  overallAccessScore: int("overallAccessScore"),
  primaryBarrier: text("primaryBarrier"),
  keyInsight: text("keyInsight"),
  status: varchar("status", { length: 30 }).default("not_started").notNull(),
  userNotes: text("userNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type AccessPath = typeof accessPaths.$inferSelect;
export type InsertAccessPath = typeof accessPaths.$inferInsert;

// ─── Sprint 3: Outreach Engine ────────────────────────────────────────────────

// brand_strategies: AI-generated personal brand strategy for the leader
export const brandStrategies = mysqlTable("brand_strategies", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  // LinkedIn presence
  linkedinHeadline: text("linkedinHeadline"),
  linkedinSummary: text("linkedinSummary"),
  linkedinAboutSection: text("linkedinAboutSection"),
  // Brand positioning
  brandStatement: text("brandStatement"),
  uniqueValueProposition: text("uniqueValueProposition"),
  targetAudience: text("targetAudience"),
  // Thought leadership pillars
  thoughtLeadershipPillars: json("thoughtLeadershipPillars").$type<Array<{
    pillar: string;
    description: string;
    contentIdeas: string[];
    hashtags: string[];
  }>>().default([]),
  // Content calendar (4-week plan)
  contentCalendar: json("contentCalendar").$type<Array<{
    week: number;
    contentType: string;
    topic: string;
    hook: string;
    format: string;
    callToAction: string;
  }>>().default([]),
  // Visibility plan
  visibilityPlan: json("visibilityPlan").$type<{
    shortTerm: string[];
    mediumTerm: string[];
    longTerm: string[];
    keyPlatforms: string[];
    networkingEvents: string[];
    speakingOpportunities: string[];
  }>(),
  // Narrative assets
  careerNarrative: text("careerNarrative"),
  elevatorPitch: text("elevatorPitch"),
  executiveBio: text("executiveBio"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type BrandStrategy = typeof brandStrategies.$inferSelect;
export type InsertBrandStrategy = typeof brandStrategies.$inferInsert;

// outreach_drafts: per-contact outreach messages and conversation prep
export const outreachDrafts = mysqlTable("outreach_drafts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  contactId: int("contactId").references(() => relationshipContacts.id),
  contactName: varchar("contactName", { length: 200 }).notNull(),
  contactTitle: varchar("contactTitle", { length: 200 }),
  contactCompany: varchar("contactCompany", { length: 200 }),
  outreachGoal: varchar("outreachGoal", { length: 100 }),
  // Message drafts
  linkedinMessage: text("linkedinMessage"),
  emailSubject: text("emailSubject"),
  emailBody: text("emailBody"),
  warmIntroRequest: text("warmIntroRequest"),
  followUpMessage: text("followUpMessage"),
  // Conversation prep
  meetingAgenda: json("meetingAgenda").$type<string[]>().default([]),
  talkingPoints: json("talkingPoints").$type<string[]>().default([]),
  questionsToAsk: json("questionsToAsk").$type<string[]>().default([]),
  thingsToAvoid: json("thingsToAvoid").$type<string[]>().default([]),
  desiredOutcome: text("desiredOutcome"),
  followUpPlan: text("followUpPlan"),
  // Status tracking
  status: varchar("status", { length: 30 }).default("draft").notNull(),
  sentAt: timestamp("sentAt"),
  responseReceived: boolean("responseReceived").default(false),
  userNotes: text("userNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type OutreachDraft = typeof outreachDrafts.$inferSelect;
export type InsertOutreachDraft = typeof outreachDrafts.$inferInsert;


// ─── Career Access Score Snapshots ──────────────────────────────────────────
// Tracks the 12-dimension Career Access Score™ over time
export const careerAccessScoreSnapshots = mysqlTable("career_access_score_snapshots", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  // 12 dimensions (0-100 each)
  scoreStrategyClarity: int("scoreStrategyClarity"),       // How clear and specific is the career strategy
  scorePositioningStrength: int("scorePositioningStrength"), // Strength of executive positioning
  scoreOpportunityPipeline: int("scoreOpportunityPipeline"), // Pipeline size and quality
  scoreRelationshipCapital: int("scoreRelationshipCapital"), // Relationship graph strength
  scoreAccessPathQuality: int("scoreAccessPathQuality"),   // Quality of access paths to targets
  scoreVisibilityPresence: int("scoreVisibilityPresence"),  // Brand and online presence
  scoreNarrativeReadiness: int("scoreNarrativeReadiness"),  // How ready the career narrative is
  scoreMarketTiming: int("scoreMarketTiming"),              // Market conditions for the target role
  scoreCredentialFit: int("scoreCredentialFit"),            // How well credentials match targets
  scoreNetworkDensity: int("scoreNetworkDensity"),          // Network density in target sectors
  scoreOutreachMomentum: int("scoreOutreachMomentum"),      // Active outreach and follow-up activity
  scoreConfidenceReadiness: int("scoreConfidenceReadiness"), // Confidence and interview readiness
  // Composite score (weighted average)
  compositeScore: int("compositeScore"),
  // AI-generated narrative for this snapshot
  narrative: text("narrative"),
  // Top 3 actions to improve the score
  topActions: json("topActions").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CareerAccessScoreSnapshot = typeof careerAccessScoreSnapshots.$inferSelect;
export type InsertCareerAccessScoreSnapshot = typeof careerAccessScoreSnapshots.$inferInsert;

// ─── Career Access Chief of Staff Briefings ───────────────────────────────────
export const careerAccessBriefings = mysqlTable("career_access_briefings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  briefDate: varchar("briefDate", { length: 10 }).notNull(), // YYYY-MM-DD
  // AI-generated briefing content
  brief: json("brief").$type<{
    greeting: string;
    pipelineHealth: string;
    todaysPriorityAction: string;
    followUpsDue: Array<{ company: string; action: string; daysOverdue: number }>;
    momentumSignal: string;
    weeklyOutlook: string;
    coachingNudge: string;
  }>(),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
});
export type CareerAccessBriefing = typeof careerAccessBriefings.$inferSelect;
export type InsertCareerAccessBriefing = typeof careerAccessBriefings.$inferInsert;

// ─── Manager Effectiveness Platform ──────────────────────────────────────────

// Stores completed diagnostic results for each MEP diagnostic
export const mepDiagnosticResults = mysqlTable("mep_diagnostic_results", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  // Diagnostic code: MEI, DI, FI, CI_COACH, THI, EXI, CONFI, O1I, TCI, OWI
  diagnosticCode: varchar("diagnosticCode", { length: 20 }).notNull(),
  // Raw responses: { questionId: score (1-5) }
  responses: json("responses").$type<Record<string, number>>().notNull(),
  // Computed dimension scores: { dimensionId: score (0-100) }
  dimensionScores: json("dimensionScores").$type<Record<string, number>>().notNull(),
  // Overall score 0-100
  overallScore: float("overallScore").notNull(),
  // Zone label: e.g. "Developing", "Effective", "Exceptional"
  zone: varchar("zone", { length: 50 }),
  // AI-generated analysis (strengths, risks, blind spots, learning path)
  llmAnalysis: json("llmAnalysis").$type<Record<string, any>>(),
  completedAt: timestamp("completedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type MepDiagnosticResult = typeof mepDiagnosticResults.$inferSelect;
export type InsertMepDiagnosticResult = typeof mepDiagnosticResults.$inferInsert;

// Manager Guide — chat sessions
export const managerGuideSessions = mysqlTable("manager_guide_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ManagerGuideSession = typeof managerGuideSessions.$inferSelect;

// Manager Guide — individual messages
export type ManagerGuideMessageRole = "user" | "assistant";
export type ManagerGuideMessageContent = { role: ManagerGuideMessageRole; content: string; timestamp: string };
export const managerGuideMessages = mysqlTable("manager_guide_messages", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ManagerGuideMessage = typeof managerGuideMessages.$inferSelect;

// Manager Playbook — situation → structured AI playbook sessions
export const managerPlaybookSessions = mysqlTable("manager_playbook_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  situation: text("situation").notNull(),
  situationType: varchar("situationType", { length: 100 }),
  // AI-generated playbook: { diagnosis, possibleCauses, framework, conversationGuide, questions, actionPlan, commonMistakes, followUpPlan, learningResources }
  playbook: json("playbook").$type<Record<string, any>>(),
  // User reflection after using the play: { whatHappened, whatWorked, whatDidnt, outcome, reflectionInsight }
  reflection: json("reflection").$type<Record<string, any>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ManagerPlaybookSession = typeof managerPlaybookSessions.$inferSelect;

// Behaviour Change Engine — commitments + check-ins
export const behaviourCommitments = mysqlTable("behaviour_commitments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  commitment: text("commitment").notNull(),
  // Source diagnostic that triggered this commitment
  sourceDiagnostic: varchar("sourceDiagnostic", { length: 20 }),
  targetDate: timestamp("targetDate"),
  status: mysqlEnum("status", ["active", "completed", "abandoned"]).default("active").notNull(),
  // Check-in history: [{ date, done, howItWent, whatHappened, whatLearned, aiCoaching }]
  checkIns: json("checkIns").$type<Array<Record<string, any>>>().default([]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type BehaviourCommitment = typeof behaviourCommitments.$inferSelect;

// Daily Management Brief — one per user per day
export const mepDailyBriefs = mysqlTable("mep_daily_briefs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  briefDate: varchar("briefDate", { length: 10 }).notNull(), // YYYY-MM-DD
  // AI-generated brief content
  brief: json("brief").$type<Record<string, any>>(),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
});
export type MepDailyBrief = typeof mepDailyBriefs.$inferSelect;

// MEP Practice Partner — role-play sessions
export const mepPracticeSessions = mysqlTable("mep_practice_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  scenario: varchar("scenario", { length: 255 }).notNull(),
  scenarioType: varchar("scenarioType", { length: 100 }),
  // Personality of the AI counterpart
  counterpartPersonality: varchar("counterpartPersonality", { length: 100 }),
  // Full conversation: [{ role, content, timestamp }]
  messages: json("messages").$type<Array<Record<string, any>>>().default([]),
  // AI coaching feedback at end of session
  coachingFeedback: json("coachingFeedback").$type<Record<string, any>>(),
  status: mysqlEnum("status", ["active", "completed"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MepPracticeSession = typeof mepPracticeSessions.$inferSelect;

// ── MEP Layer 6: Team Intelligence ───────────────────────────────────────────
export const managerTeamMembers = mysqlTable("manager_team_members", {
  id: int("id").primaryKey().autoincrement(),
  userId: varchar("userId", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 255 }),
  notes: text("notes"),
  lastInsight: json("lastInsight").$type<Record<string, any>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ManagerTeamMember = typeof managerTeamMembers.$inferSelect;

// ─── Executive Opportunity System — Career Access Intelligence™ Phase 1 ──────

// Career Access Profile: goals, target roles, industries, resume, LinkedIn, preferences
export const careerAccessProfiles = mysqlTable("career_access_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  // Career goals and aspirations
  currentRole: varchar("currentRole", { length: 255 }),
  targetRole: varchar("targetRole", { length: 255 }),
  targetIndustries: json("targetIndustries").$type<string[]>(),
  targetCompanySize: varchar("targetCompanySize", { length: 100 }),
  targetLocation: varchar("targetLocation", { length: 255 }),
  // Assets
  resumeUrl: text("resumeUrl"),
  linkedInUrl: text("linkedInUrl"),
  // Preferences
  openToRelocation: boolean("openToRelocation").default(false),
  timelineMonths: int("timelineMonths"),
  salaryExpectation: varchar("salaryExpectation", { length: 100 }),
  // Additional context
  keyStrengths: json("keyStrengths").$type<string[]>(),
  notableAchievements: text("notableAchievements"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CareerAccessProfile = typeof careerAccessProfiles.$inferSelect;
export type InsertCareerAccessProfile = typeof careerAccessProfiles.$inferInsert;

// Career Strategy: AI-generated positioning and narrative
export const careerStrategies = mysqlTable("career_strategies", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  // Core strategy elements
  strategyStatement: text("strategyStatement"),
  valueProposition: text("valueProposition"),
  careerNarrative: text("careerNarrative"),
  positioningCanvas: json("positioningCanvas").$type<{
    uniqueStrengths: string[];
    targetProblem: string;
    differentiator: string;
    proofPoints: string[];
    callToAction: string;
  }>(),
  decisionCriteria: json("decisionCriteria").$type<string[]>(),
  // Generation metadata
  generatedAt: timestamp("generatedAt"),
  version: int("version").default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CareerStrategy = typeof careerStrategies.$inferSelect;
export type InsertCareerStrategy = typeof careerStrategies.$inferInsert;

// Opportunity Pipeline: CRM for target companies and roles
export const opportunityPipeline = mysqlTable("opportunity_pipeline", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  // Company and role
  company: varchar("company", { length: 255 }).notNull(),
  role: varchar("role", { length: 255 }),
  industry: varchar("industry", { length: 100 }),
  // Pipeline stage
  stage: mysqlEnum("stage", ["radar", "targeting", "engaging", "interviewing", "offer", "closed_won", "closed_lost"]).default("radar").notNull(),
  probability: int("probability").default(0), // 0-100
  // Relationship and access
  keyContact: varchar("keyContact", { length: 255 }),
  relationshipStrength: mysqlEnum("relationshipStrength", ["none", "weak", "moderate", "strong"]).default("none"),
  accessPath: varchar("accessPath", { length: 255 }),
  // Activity tracking
  nextAction: text("nextAction"),
  nextActionDate: timestamp("nextActionDate"),
  lastActivityDate: timestamp("lastActivityDate"),
  notes: text("notes"),
  // AI-generated context
  whyThisCompany: text("whyThisCompany"),
  aiSuggested: boolean("aiSuggested").default(false),
  dismissed: boolean("dismissed").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type OpportunityPipelineItem = typeof opportunityPipeline.$inferSelect;
export type InsertOpportunityPipelineItem = typeof opportunityPipeline.$inferInsert;

// Opportunity Radar Signals: AI-detected signals about target companies
export const opportunityRadarSignals = mysqlTable("opportunity_radar_signals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  opportunityId: int("opportunityId").references(() => opportunityPipeline.id),
  signalType: mysqlEnum("signalType", ["hiring", "expansion", "leadership_change", "funding", "product_launch", "partnership", "award"]).notNull(),
  company: varchar("company", { length: 255 }).notNull(),
  description: text("description").notNull(),
  recommendedAction: text("recommendedAction"),
  urgency: mysqlEnum("urgency", ["low", "medium", "high"]).default("medium"),
  dismissed: boolean("dismissed").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type OpportunityRadarSignal = typeof opportunityRadarSignals.$inferSelect;
export type InsertOpportunityRadarSignal = typeof opportunityRadarSignals.$inferInsert;


// Interview Prep Sessions: AI-generated interview preparation per role/company
export const interviewPrepSessions = mysqlTable("interview_prep_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  targetRole: varchar("targetRole", { length: 255 }).notNull(),
  targetCompany: varchar("targetCompany", { length: 255 }).notNull(),
  interviewType: varchar("interviewType", { length: 50 }).default("behavioral").notNull(),
  jobDescription: text("jobDescription"),
  yourBackground: text("yourBackground"),
  prepData: json("prepData"), // Full AI-generated prep: roleResearch, likelyQuestions, suggestedAnswers, storyBank, keyMessages, questionsToAsk
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type InterviewPrepSession = typeof interviewPrepSessions.$inferSelect;
export type InsertInterviewPrepSession = typeof interviewPrepSessions.$inferInsert;

// Negotiation Sessions: AI-powered offer analysis and negotiation strategy
export const negotiationSessions = mysqlTable("negotiation_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  role: varchar("role", { length: 255 }).notNull(),
  company: varchar("company", { length: 255 }).notNull(),
  offeredSalary: varchar("offeredSalary", { length: 50 }),
  offeredBonus: varchar("offeredBonus", { length: 100 }),
  offeredEquity: varchar("offeredEquity", { length: 100 }),
  otherBenefits: text("otherBenefits"),
  currentSalary: varchar("currentSalary", { length: 50 }),
  targetSalary: varchar("targetSalary", { length: 50 }),
  marketContext: text("marketContext"),
  yourLeverage: text("yourLeverage"),
  strategyData: json("strategyData"), // Full AI-generated strategy: offerAnalysis, strategy, counterOfferScripts, decisionFramework
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type NegotiationSession = typeof negotiationSessions.$inferSelect;
export type InsertNegotiationSession = typeof negotiationSessions.$inferInsert;

// ─── Organisation Intelligence Waitlist ───────────────────────────────────────
export const orgIntelligenceWaitlist = mysqlTable("org_intelligence_waitlist", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  name: varchar("name", { length: 255 }),
  orgName: varchar("orgName", { length: 255 }),
  role: varchar("role", { length: 255 }),
  useCase: text("useCase"), // What they want to use it for
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type OrgIntelligenceWaitlist = typeof orgIntelligenceWaitlist.$inferSelect;
export type InsertOrgIntelligenceWaitlist = typeof orgIntelligenceWaitlist.$inferInsert;

// ─── Coaches ──────────────────────────────────────────────────────────────────
// External executive coaches who can view their assigned clients' data
export const coaches = mysqlTable("coaches", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id).unique(), // linked user account
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  bio: text("bio"),
  specialisation: varchar("specialisation", { length: 255 }), // e.g. "Executive Leadership, GCC Leaders"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Coach = typeof coaches.$inferSelect;
export type InsertCoach = typeof coaches.$inferInsert;

// ─── Coach Assignments ────────────────────────────────────────────────────────
// Maps a coach to their assigned client leaders
export const coachAssignments = mysqlTable("coach_assignments", {
  id: int("id").autoincrement().primaryKey(),
  coachId: int("coachId").notNull().references(() => coaches.id),
  clientUserId: int("clientUserId").notNull().references(() => users.id),
  notes: text("notes"), // admin notes about this coaching relationship
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
  assignedBy: int("assignedBy").references(() => users.id), // admin who created the assignment
  isActive: boolean("isActive").default(true).notNull(),
});
export type CoachAssignment = typeof coachAssignments.$inferSelect;
export type InsertCoachAssignment = typeof coachAssignments.$inferInsert;

// ─── Next Chapter — Identity & Leadership OS ──────────────────────────────────

// next_chapter_profiles: tracks each user's progress through the 6-stage / 16-module journey
export const nextChapterProfiles = mysqlTable("next_chapter_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id).unique(),
  // Current position in the journey
  currentStage: int("currentStage").default(1).notNull(), // 1–6 (Discover, Design, Build, Practice, Lead, Reflect)
  currentModule: int("currentModule").default(1).notNull(), // 1–16
  // JSON array of completed module numbers, e.g. [1, 2, 3]
  completedModules: json("completedModules").$type<number[]>().default([]),
  // Whether the user has completed the full journey at least once
  journeyCompleted: boolean("journeyCompleted").default(false).notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  lastActiveAt: timestamp("lastActiveAt").defaultNow().onUpdateNow().notNull(),
});
export type NextChapterProfile = typeof nextChapterProfiles.$inferSelect;
export type InsertNextChapterProfile = typeof nextChapterProfiles.$inferInsert;

// next_chapter_deliverables: one row per generated deliverable per module
export const nextChapterDeliverables = mysqlTable("next_chapter_deliverables", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  moduleNumber: int("moduleNumber").notNull(), // 1–16
  // Deliverable type label, e.g. "Current Identity Profile", "Future Leadership Context Map"
  deliverableType: varchar("deliverableType", { length: 100 }).notNull(),
  // Full structured content as JSON (flexible per module)
  content: json("content").$type<Record<string, any>>().notNull(),
  // Version counter — incremented when a module is revisited and regenerated
  version: int("version").default(1).notNull(),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
});
export type NextChapterDeliverable = typeof nextChapterDeliverables.$inferSelect;
export type InsertNextChapterDeliverable = typeof nextChapterDeliverables.$inferInsert;

// next_chapter_messages: individual chat messages per user session
export const nextChapterMessages = mysqlTable("next_chapter_messages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  // Session identifier — a new UUID is created each time the user starts a fresh conversation
  sessionId: varchar("sessionId", { length: 64 }).notNull(),
  // Which module this message belongs to (1–16)
  moduleNumber: int("moduleNumber").notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type NextChapterMessage = typeof nextChapterMessages.$inferSelect;
export type InsertNextChapterMessage = typeof nextChapterMessages.$inferInsert;

// identity_experiments: weekly behavioural experiments generated at each stage
export const identityExperiments = mysqlTable("identity_experiments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  moduleNumber: int("moduleNumber").notNull(), // module that generated this experiment
  // The experiment description
  experiment: text("experiment").notNull(),
  // User's reflection after completing the experiment
  reflection: text("reflection"),
  // Whether the user has marked this experiment as done
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type IdentityExperiment = typeof identityExperiments.$inferSelect;
export type InsertIdentityExperiment = typeof identityExperiments.$inferInsert;

// ─── Next Chapter — Experiment Commitments (Phase 1) ─────────────────────────
// Tracks when a user acknowledges a module's micro-experiment and their reflection
export const nextChapterExperimentCommitments = mysqlTable("next_chapter_experiment_commitments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  moduleNumber: int("moduleNumber").notNull(),
  experiment: text("experiment").notNull(),
  // When the user acknowledged the experiment ("I'll do it")
  acknowledgedAt: timestamp("acknowledgedAt").defaultNow().notNull(),
  // User's reflection note after running the experiment
  reflectionNote: text("reflectionNote"),
  // Whether the user has submitted a reflection
  reflectedAt: timestamp("reflectedAt"),
});
export type NextChapterExperimentCommitment = typeof nextChapterExperimentCommitments.$inferSelect;
export type InsertNextChapterExperimentCommitment = typeof nextChapterExperimentCommitments.$inferInsert;

// ─── Next Chapter — Identity Clarity Assessments (Phase 2) ───────────────────
// Pre/post identity assessment measuring 5 dimensions at baseline and after each stage
export const identityAssessments = mysqlTable("identity_assessments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  // "baseline" (before Module 1) or "stage_end" (after completing a stage)
  assessmentType: mysqlEnum("assessmentType", ["baseline", "stage_end"]).notNull(),
  // Stage number for stage_end assessments (1–6); null for baseline
  stageNumber: int("stageNumber"),
  // JSON object with 5 dimension scores (1–10 each)
  // { leadershipIdentityClarity, futureSelfVividness, narrativeCoherence, identityBehaviourAlignment, transitionReadiness }
  scores: json("scores").$type<{
    leadershipIdentityClarity: number;
    futureSelfVividness: number;
    narrativeCoherence: number;
    identityBehaviourAlignment: number;
    transitionReadiness: number;
  }>().notNull(),
  completedAt: timestamp("completedAt").defaultNow().notNull(),
});
export type IdentityAssessment = typeof identityAssessments.$inferSelect;
export type InsertIdentityAssessment = typeof identityAssessments.$inferInsert;

// ─── LSOS: Leadership Success Operating System ────────────────────────────────

export const lsosMissions = mysqlTable("lsos_missions", {
  id: int("id").autoincrement().primaryKey(),
  spId: int("spId").notNull().references(() => users.id),
  managerId: int("managerId").notNull().references(() => users.id),
  objective: text("objective").notNull(),
  whySelected: text("whySelected").notNull(),
  expectedImpact: varchar("expectedImpact", { length: 255 }).notNull(),
  effort: mysqlEnum("effort", ["low", "medium", "high"]).notNull().default("medium"),
  urgency: mysqlEnum("urgency", ["low", "medium", "high", "critical"]).notNull().default("medium"),
  recommendedConversation: text("recommendedConversation"),
  likelihoodOfSuccess: int("likelihoodOfSuccess"),
  riskIfIgnored: text("riskIfIgnored"),
  channel: mysqlEnum("channel", ["call", "whatsapp", "email", "voice_note", "in_person"]).notNull().default("call"),
  followUpDate: timestamp("followUpDate"),
  priorityScore: int("priorityScore").notNull().default(50),
  missionType: mysqlEnum("missionType", ["quick_win", "recovery", "celebration", "stretch", "re_engagement", "escalation"]).notNull().default("quick_win"),
  status: mysqlEnum("status", ["pending", "completed", "skipped", "snoozed"]).notNull().default("pending"),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});
export type LsosMission = typeof lsosMissions.$inferSelect;
export type InsertLsosMission = typeof lsosMissions.$inferInsert;

export const lsosDailyBriefs = mysqlTable("lsos_daily_briefs", {
  id: int("id").autoincrement().primaryKey(),
  spId: int("spId").notNull().references(() => users.id),
  briefDate: varchar("briefDate", { length: 10 }).notNull(),
  narrative: text("narrative").notNull(),
  celebrationsJson: json("celebrationsJson").$type<Array<{ managerId: number; managerName: string; reason: string }>>(),
  risksJson: json("risksJson").$type<Array<{ managerId: number; managerName: string; risk: string; severity: "low" | "medium" | "high" }>>(),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
});
export type LsosDailyBrief = typeof lsosDailyBriefs.$inferSelect;
export type InsertLsosDailyBrief = typeof lsosDailyBriefs.$inferInsert;

// ── Outplacement Enquiries ────────────────────────────────────────────────────
export const outplacementEnquiries = mysqlTable("outplacement_enquiries", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  organisation: varchar("organisation", { length: 300 }).notNull(),
  email: varchar("email", { length: 300 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  cohortSize: varchar("cohortSize", { length: 50 }),
  message: text("message"),
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
});
export type OutplacementEnquiry = typeof outplacementEnquiries.$inferSelect;
export type InsertOutplacementEnquiry = typeof outplacementEnquiries.$inferInsert;

// ── SP Assignments ────────────────────────────────────────────────────────────
export const spAssignments = mysqlTable("sp_assignments", {
  id: int("id").autoincrement().primaryKey(),
  spUserId: int("spUserId").notNull().references(() => users.id),
  managedUserId: int("managedUserId").notNull().references(() => users.id),
  tenantId: int("tenantId").references(() => tenants.id),
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
  assignedBy: int("assignedBy").references(() => users.id),
});
export type SpAssignment = typeof spAssignments.$inferSelect;
export type InsertSpAssignment = typeof spAssignments.$inferInsert;

// ─── MEP Leader Documents ─────────────────────────────────────────────────────
// Stores metadata for documents uploaded by leaders (Work Goals, IDP, Assessments, Other)
// Raw files are stored in S3; only metadata is persisted here.
export type MepDocType = "work_goals" | "idp" | "prior_assessment" | "other";

export const mepLeaderDocuments = mysqlTable("mep_leader_documents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  tenantId: int("tenantId").references(() => tenants.id),
  docType: mysqlEnum("docType", ["work_goals", "idp", "prior_assessment", "other"]).notNull().default("other"),
  fileName: varchar("fileName", { length: 500 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 2000 }).notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  fileSizeBytes: int("fileSizeBytes"),
  mimeType: varchar("mimeType", { length: 100 }),
  notes: text("notes"),
  extractedObjectives: json("extractedObjectives").$type<{ objective: string; category: string; priority: "high" | "medium" | "low" }[]>(),
  extractedAt: timestamp("extractedAt"),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type MepLeaderDocument = typeof mepLeaderDocuments.$inferSelect;
export type InsertMepLeaderDocument = typeof mepLeaderDocuments.$inferInsert;

// ─── Org Context ──────────────────────────────────────────────────────────────
// Stores organisation-level context set by the tenant admin (mission, vision, goals, etc.)
export const orgContext = mysqlTable("org_context", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull().references(() => tenants.id).unique(),
  websiteUrl: varchar("websiteUrl", { length: 500 }),
  companyName: varchar("companyName", { length: 255 }),
  mission: text("mission"),
  vision: text("vision"),
  northStar: text("northStar"),
  strategicGoals: json("strategicGoals").$type<string[]>(),
  values: json("values").$type<string[]>(),
  rawScrapedText: text("rawScrapedText"),
  scrapedAt: timestamp("scrapedAt"),
  logoUrl: varchar("logoUrl", { length: 1000 }),
  leadershipFrameworks: json("leadershipFrameworks").$type<Array<{ name: string; description: string; competencies: string[] }>>(),
  lastUpdatedBy: int("lastUpdatedBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type OrgContext = typeof orgContext.$inferSelect;
export type InsertOrgContext = typeof orgContext.$inferInsert;

// ─── Resume Makeover ──────────────────────────────────────────────────────────
// One active resume per user; each AI rewrite creates a new version row.
export const userResumes = mysqlTable("user_resumes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  version: int("version").notNull().default(1),
  isActive: boolean("isActive").notNull().default(true),
  // Original upload
  originalFileName: varchar("originalFileName", { length: 255 }),
  originalFileUrl: varchar("originalFileUrl", { length: 1000 }),
  originalFileKey: varchar("originalFileKey", { length: 500 }),
  extractedText: text("extractedText"),
  // ATS analysis (deterministic rule-based)
  atsScore: int("atsScore"),
  atsBreakdown: json("atsBreakdown").$type<Record<string, { score: number; max: number; passed: boolean; note: string }>>(),
  // Career quality analysis (LLM-driven)
  careerQualityScore: int("careerQualityScore"),
  qualityBreakdown: json("qualityBreakdown").$type<{
    dimensions: Array<{ id: string; label: string; score: number; max: number; callouts: Array<{ quote: string; suggestion: string }> }>;
    headline: string;
    topStrengths: string[];
    topImprovements: string[];
  }>(),
  // Rewrite
  targetJobDescription: text("targetJobDescription"),
  rewrittenText: text("rewrittenText"),
  rewrittenHtml: text("rewrittenHtml"),
  rewrittenFileUrl: varchar("rewrittenFileUrl", { length: 1000 }),
  rewrittenFileKey: varchar("rewrittenFileKey", { length: 500 }),
  rewrittenAt: timestamp("rewrittenAt"),
  // Post-rewrite scores (to show before/after comparison)
  rewrittenAtsScore: int("rewrittenAtsScore"),
  rewrittenQualityScore: int("rewrittenQualityScore"),
  // Cover letter
  coverLetterHtml: text("coverLetterHtml"),
  coverLetterGeneratedAt: timestamp("coverLetterGeneratedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type UserResume = typeof userResumes.$inferSelect;
export type InsertUserResume = typeof userResumes.$inferInsert;

// ── Simulation Engine ─────────────────────────────────────────────────────────────
export const simSessions = mysqlTable("sim_sessions", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("userId").notNull().references(() => users.id),
  platform: varchar("platform", { length: 50 }).notNull(), // leadership | manager | career | young
  // Scenario (AI-inferred)
  userPrompt: text("userPrompt").notNull(),
  conversationType: varchar("conversationType", { length: 100 }),
  stakeholder: varchar("stakeholder", { length: 100 }),
  objective: text("objective"),
  expectedChallenge: text("expectedChallenge"),
  difficulty: int("difficulty").default(3), // 1-5
  estimatedMinutes: int("estimatedMinutes").default(6),
  characterName: varchar("characterName", { length: 100 }),
  characterStyle: varchar("characterStyle", { length: 100 }),
  // Conversation
  messages: json("messages").$type<Array<{ role: "user" | "assistant"; content: string; timestamp: number }>>().default([]),
  // Debrief
  status: varchar("status", { length: 20 }).default("active"), // active | completed
  overallScore: int("overallScore"),
  behaviourScores: json("behaviourScores").$type<Array<{ label: string; score: number; max: number }>>(),
  strengths: json("strengths").$type<string[]>(),
  improvements: json("improvements").$type<string[]>(),
  coachingInsights: json("coachingInsights").$type<Array<{ moment: string; tryInstead: string }>>(),
  keyTakeaway: text("keyTakeaway"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});
export type SimSession = typeof simSessions.$inferSelect;
export type InsertSimSession = typeof simSessions.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// LAUNCH INTELLIGENCE — Phase 1 Schema
// ═══════════════════════════════════════════════════════════════════════════════

// ─── XP Ledger ────────────────────────────────────────────────────────────────
export const launchXpLedger = mysqlTable("launch_xp_ledger", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  xpEarned: int("xpEarned").notNull(),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type LaunchXpLedger = typeof launchXpLedger.$inferSelect;

// ─── User Progress ────────────────────────────────────────────────────────────
export const launchUserProgress = mysqlTable("launch_user_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  totalXp: int("totalXp").notNull().default(0),
  currentLevel: varchar("currentLevel", { length: 50 }).notNull().default("Explorer"),
  currentStreak: int("currentStreak").notNull().default(0),
  longestStreak: int("longestStreak").notNull().default(0),
  lastActiveDate: varchar("lastActiveDate", { length: 10 }),
  employabilityScores: json("employabilityScores").$type<Record<string, number>>(),
  compositeScore: float("compositeScore").default(0),
  targetRole: varchar("targetRole", { length: 255 }),
  targetIndustry: varchar("targetIndustry", { length: 255 }),
  experienceLevel: varchar("experienceLevel", { length: 50 }),
  onboardingComplete: boolean("onboardingComplete").default(false).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type LaunchUserProgress = typeof launchUserProgress.$inferSelect;

// ─── Daily Momentum Engine ────────────────────────────────────────────────────
export const launchDailyMissions = mysqlTable("launch_daily_missions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  date: varchar("date", { length: 10 }).notNull(),
  missions: json("missions").$type<Array<{
    id: string;
    title: string;
    description: string;
    xp: number;
    missionArea: string;
    status: "pending" | "complete";
    completedAt?: string;
  }>>().notNull(),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
});
export type LaunchDailyMissions = typeof launchDailyMissions.$inferSelect;

// ─── Achievements ─────────────────────────────────────────────────────────────
export const launchAchievements = mysqlTable("launch_achievements", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 10 }),
  xpBonus: int("xpBonus").default(0).notNull(),
});
export type LaunchAchievement = typeof launchAchievements.$inferSelect;

export const launchUserAchievements = mysqlTable("launch_user_achievements", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  achievementCode: varchar("achievementCode", { length: 100 }).notNull(),
  earnedAt: timestamp("earnedAt").defaultNow().notNull(),
});
export type LaunchUserAchievement = typeof launchUserAchievements.$inferSelect;

// ─── Community Wins ───────────────────────────────────────────────────────────
export const launchCommunityWins = mysqlTable("launch_community_wins", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  winType: mysqlEnum("winType", ["first_interview", "resume_complete", "offer_received", "streak_7", "first_application", "custom"]).notNull(),
  message: text("message"),
  isAnonymous: boolean("isAnonymous").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type LaunchCommunityWin = typeof launchCommunityWins.$inferSelect;

// ─── Career Compass (Mission 1) ───────────────────────────────────────────────
export const launchCareerCompass = mysqlTable("launch_career_compass", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  strengthsResponses: json("strengthsResponses").$type<Array<{ questionId: string; answer: string }>>(),
  interestResponses: json("interestResponses").$type<Array<{ questionId: string; answer: string }>>(),
  workStyleResponses: json("workStyleResponses").$type<Array<{ questionId: string; answer: string }>>(),
  valuesResponses: json("valuesResponses").$type<Array<{ questionId: string; answer: string }>>(),
  strengthsScore: float("strengthsScore"),
  interestScore: float("interestScore"),
  workStyleScore: float("workStyleScore"),
  valuesScore: float("valuesScore"),
  primaryDirection: varchar("primaryDirection", { length: 255 }),
  secondaryDirection: varchar("secondaryDirection", { length: 255 }),
  tertiaryDirection: varchar("tertiaryDirection", { length: 255 }),
  directionCardJson: json("directionCardJson").$type<Record<string, unknown>>(),
  llmNarrative: text("llmNarrative"),
  status: mysqlEnum("ccStatus", ["in_progress", "completed"]).default("in_progress").notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type LaunchCareerCompass = typeof launchCareerCompass.$inferSelect;

// ─── Story Builder / Brand Kit (Mission 2) ────────────────────────────────────
export const launchBrandKit = mysqlTable("launch_brand_kit", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  originStory: text("originStory"),
  originStoryRefined: text("originStoryRefined"),
  valueProposition: text("valueProposition"),
  valuePropositionRefined: text("valuePropositionRefined"),
  elevatorPitch30: text("elevatorPitch30"),
  elevatorPitch60: text("elevatorPitch60"),
  linkedinAbout: text("linkedinAbout"),
  linkedinHeadline: varchar("linkedinHeadline", { length: 220 }),
  professionalBio: text("professionalBio"),
  originStoryComplete: boolean("originStoryComplete").default(false).notNull(),
  valuePropositionComplete: boolean("valuePropositionComplete").default(false).notNull(),
  elevatorPitchComplete: boolean("elevatorPitchComplete").default(false).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type LaunchBrandKit = typeof launchBrandKit.$inferSelect;

// ─── Skill Sprint (Mission 3) ─────────────────────────────────────────────────
export const launchSkillSprint = mysqlTable("launch_skill_sprint", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  moduleId: varchar("moduleId", { length: 50 }).notNull(),
  moduleTitle: varchar("moduleTitle", { length: 150 }).notNull(),
  category: varchar("category", { length: 80 }).notNull(),
  status: mysqlEnum("ssStatus", ["not_started", "in_progress", "completed"]).default("not_started").notNull(),
  challengeResponse: text("challengeResponse"),
  challengeFeedback: text("challengeFeedback"),
  challengeScore: int("challengeScore"),
  xpEarned: int("xpEarned").default(0).notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type LaunchSkillSprint = typeof launchSkillSprint.$inferSelect;

// ─── Application Tracker ──────────────────────────────────────────────────────
export const launchApplications = mysqlTable("launch_applications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  companyName: varchar("companyName", { length: 200 }).notNull(),
  roleName: varchar("roleName", { length: 200 }).notNull(),
  jobUrl: text("jobUrl"),
  location: varchar("location", { length: 150 }),
  salaryRange: varchar("salaryRange", { length: 100 }),
  status: mysqlEnum("appStatus", [
    "wishlist",
    "applied",
    "phone_screen",
    "interview",
    "offer",
    "rejected",
    "withdrawn",
  ]).default("wishlist").notNull(),
  appliedAt: timestamp("appliedAt"),
  nextActionDate: timestamp("nextActionDate"),
  nextActionNote: varchar("nextActionNote", { length: 500 }),
  notes: text("notes"),
  contactName: varchar("contactName", { length: 150 }),
  contactRole: varchar("contactRole", { length: 150 }),
  contactLinkedin: text("contactLinkedin"),
  excitement: int("excitement").default(3),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type LaunchApplication = typeof launchApplications.$inferSelect;

// ─── Interview Intelligence (Mission 5) ───────────────────────────────────────
export const launchInterviewSessions = mysqlTable("launch_interview_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  interviewType: mysqlEnum("interviewType", ["hr", "behavioural", "technical", "case", "presentation"]).notNull(),
  targetRole: varchar("targetRole", { length: 255 }),
  targetCompany: varchar("targetCompany", { length: 255 }),
  difficulty: mysqlEnum("interviewDifficulty", ["beginner", "intermediate", "advanced"]).default("beginner").notNull(),
  messages: json("messages").$type<Array<{ role: string; content: string; timestamp: string; questionIndex?: number }>>().notNull(),
  overallScore: int("overallScore"),
  dimensionScores: json("dimensionScores").$type<Record<string, number>>(),
  feedback: json("feedback").$type<{ strengths: string[]; improvements: string[]; nextSteps: string[] }>(),
  xpEarned: int("xpEarned").default(0).notNull(),
  status: mysqlEnum("interviewStatus", ["in_progress", "completed"]).default("in_progress").notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type LaunchInterviewSession = typeof launchInterviewSessions.$inferSelect;

// ─── Negotiation Simulator ────────────────────────────────────────────────────
export const launchNegotiationSessions = mysqlTable("launch_negotiation_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  scenarioId: varchar("scenarioId", { length: 100 }).notNull(),
  scenarioTitle: varchar("scenarioTitle", { length: 255 }).notNull(),
  targetRole: varchar("targetRole", { length: 255 }),
  targetCompany: varchar("targetCompany", { length: 255 }),
  initialOffer: varchar("initialOffer", { length: 100 }),
  messages: json("messages").$type<Array<{ role: string; content: string; timestamp: string }>>().notNull(),
  finalOutcome: varchar("finalOutcome", { length: 255 }),
  outcomeScore: int("outcomeScore"),
  feedback: json("feedback").$type<{ strengths: string[]; improvements: string[]; tactics: string[] }>(),
  xpEarned: int("xpEarned").default(0).notNull(),
  status: mysqlEnum("negotiationStatus", ["in_progress", "completed"]).default("in_progress").notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type LaunchNegotiationSession = typeof launchNegotiationSessions.$inferSelect;

// ─── Application Reminders ────────────────────────────────────────────────────
export const launchApplicationReminders = mysqlTable("launch_application_reminders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  applicationId: int("applicationId").notNull().references(() => launchApplications.id, { onDelete: "cascade" }),
  reminderType: mysqlEnum("reminderType", ["interview", "follow_up", "deadline", "assessment", "other"]).default("other").notNull(),
  reminderDate: timestamp("reminderDate").notNull(),
  note: varchar("note", { length: 500 }),
  isDone: boolean("isDone").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type LaunchApplicationReminder = typeof launchApplicationReminders.$inferSelect;

// ─── XP History (for dashboard charts) ───────────────────────────────────────
export const launchXpHistory = mysqlTable("launch_xp_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  xpAmount: int("xpAmount").notNull(),
  source: varchar("source", { length: 100 }).notNull(),
  recordedDate: varchar("recordedDate", { length: 10 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type LaunchXpHistory = typeof launchXpHistory.$inferSelect;
