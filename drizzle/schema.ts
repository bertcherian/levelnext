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
  index,
  uniqueIndex,
  foreignKey,
} from "drizzle-orm/mysql-core";
import type { SelfLeadershipAnalysis, SelfLeadershipCareerStage, SelfLeadershipConfidence, SelfLeadershipDimension } from "../shared/modules/selfLeadershipIntelligence";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  whatsappNumber: varchar("whatsappNumber", { length: 32 }),
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

// ─── Client Error Events ──────────────────────────────────────────────────────
// Stores only categorical client load failures and query-free application routes.
// User content, error messages, and request payloads are intentionally excluded.
export const clientErrorEvents = mysqlTable(
  "client_error_events",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id),
    eventType: mysqlEnum("eventType", ["lazy_chunk_load_failure", "render_failure"]).notNull(),
    route: varchar("route", { length: 255 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    index("client_error_events_created_idx").on(table.createdAt),
    index("client_error_events_type_created_idx").on(table.eventType, table.createdAt),
  ],
);

// ─── AI Suggestion Feedback ───────────────────────────────────────────────────
// Stores a user-owned snapshot of a flagged AI card so product owners can inspect
// quality issues without retaining the entire dashboard state.
export const aiSuggestionFeedback = mysqlTable(
  "ai_suggestion_feedback",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id),
    surface: varchar("surface", { length: 100 }).notNull(),
    contentKey: varchar("contentKey", { length: 160 }),
    suggestionKind: varchar("suggestionKind", { length: 100 }).notNull(),
    reason: mysqlEnum("reason", ["helpful", "malformed", "unhelpful"]).notNull(),
    contentSnapshot: text("contentSnapshot").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    index("ai_suggestion_feedback_user_created_idx").on(table.userId, table.createdAt),
    index("ai_suggestion_feedback_surface_created_idx").on(table.surface, table.createdAt),
  ],
);
export type AiSuggestionFeedback = typeof aiSuggestionFeedback.$inferSelect;

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

// ─── Critical Thinking in Decision Making Diagnostic ───────────────────────────
// The CTDM tables intentionally remain separate from the legacy generic assessment
// tables because this developmental instrument has mixed response types, explicit
// privacy controls, campaign reporting thresholds, and standalone score components.
export const ctdmCampaigns = mysqlTable(
  "ctdm_campaigns",
  {
    id: int("id").autoincrement().primaryKey(),
    tenantId: int("tenantId").notNull().references(() => tenants.id),
    name: varchar("name", { length: 255 }).notNull(),
    reportingGroup: varchar("reportingGroup", { length: 255 }).notNull(),
    targetAudience: text("targetAudience"),
    targetRoles: text("targetRoles"),
    industryContext: varchar("industryContext", { length: 150 }),
    geographicContext: varchar("geographicContext", { length: 150 }),
    intendedUse: varchar("intendedUse", { length: 120 }),
    administrationFormat: varchar("administrationFormat", { length: 80 }).default("online").notNull(),
    readingLevel: varchar("readingLevel", { length: 100 }).default("professional workplace English").notNull(),
    reportingMode: mysqlEnum("reportingMode", ["individual", "team", "both"]).default("both").notNull(),
    minTeamSize: int("minTeamSize").default(5).notNull(),
    namedReportAccess: boolean("namedReportAccess").default(false).notNull(),
    consentStatement: text("consentStatement"),
    retentionDays: int("retentionDays").default(365).notNull(),
    status: mysqlEnum("status", ["draft", "active", "closed", "archived"]).default("draft").notNull(),
    startsAt: timestamp("startsAt"),
    closesAt: timestamp("closesAt"),
    createdByUserId: int("createdByUserId").notNull().references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("ctdm_campaigns_tenant_status_idx").on(table.tenantId, table.status),
    index("ctdm_campaigns_creator_idx").on(table.createdByUserId),
  ],
);
export type CtdmCampaign = typeof ctdmCampaigns.$inferSelect;

export const ctdmParticipants = mysqlTable(
  "ctdm_participants",
  {
    id: int("id").autoincrement().primaryKey(),
    campaignId: int("campaignId").notNull().references(() => ctdmCampaigns.id),
    tenantId: int("tenantId").notNull().references(() => tenants.id),
    userId: int("userId").references(() => users.id),
    email: varchar("email", { length: 320 }),
    displayName: varchar("displayName", { length: 255 }),
    participantRole: varchar("participantRole", { length: 255 }),
    status: mysqlEnum("status", ["invited", "in_progress", "completed", "withdrawn"]).default("invited").notNull(),
    consentAt: timestamp("consentAt"),
    invitedAt: timestamp("invitedAt").defaultNow().notNull(),
    completedAt: timestamp("completedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    uniqueIndex("ctdm_participants_campaign_user_unique").on(table.campaignId, table.userId),
    uniqueIndex("ctdm_participants_campaign_email_unique").on(table.campaignId, table.email),
    index("ctdm_participants_tenant_status_idx").on(table.tenantId, table.status),
  ],
);
export type CtdmParticipant = typeof ctdmParticipants.$inferSelect;

export const ctdmAssessments = mysqlTable(
  "ctdm_assessments",
  {
    id: int("id").autoincrement().primaryKey(),
    campaignId: int("campaignId").notNull().references(() => ctdmCampaigns.id),
    tenantId: int("tenantId").notNull().references(() => tenants.id),
    participantId: int("participantId").notNull().references(() => ctdmParticipants.id),
    userId: int("userId").notNull().references(() => users.id),
    status: mysqlEnum("status", ["in_progress", "completed", "withdrawn"]).default("in_progress").notNull(),
    currentSection: mysqlEnum("currentSection", ["profile", "behaviour", "scenarios", "environment", "reflection", "complete"]).default("profile").notNull(),
    behaviourResponses: json("behaviourResponses").$type<Record<string, number>>(),
    scenarioResponses: json("scenarioResponses").$type<Record<string, { optionId: string; confidence: number }>>(),
    environmentResponses: json("environmentResponses").$type<Record<string, number>>(),
    reflections: json("reflections").$type<Record<string, string>>(),
    startedAt: timestamp("startedAt").defaultNow().notNull(),
    completedAt: timestamp("completedAt"),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    uniqueIndex("ctdm_assessments_participant_unique").on(table.participantId),
    index("ctdm_assessments_tenant_status_idx").on(table.tenantId, table.status),
    index("ctdm_assessments_user_campaign_idx").on(table.userId, table.campaignId),
  ],
);
export type CtdmAssessment = typeof ctdmAssessments.$inferSelect;

export const ctdmReports = mysqlTable(
  "ctdm_reports",
  {
    id: int("id").autoincrement().primaryKey(),
    campaignId: int("campaignId").notNull().references(() => ctdmCampaigns.id),
    tenantId: int("tenantId").notNull().references(() => tenants.id),
    participantId: int("participantId").notNull().references(() => ctdmParticipants.id),
    assessmentId: int("assessmentId").notNull().references(() => ctdmAssessments.id),
    userId: int("userId").notNull().references(() => users.id),
    scoreSnapshot: json("scoreSnapshot").$type<Record<string, unknown>>().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    uniqueIndex("ctdm_reports_assessment_unique").on(table.assessmentId),
    index("ctdm_reports_tenant_campaign_idx").on(table.tenantId, table.campaignId),
    index("ctdm_reports_user_idx").on(table.userId),
  ],
);
export type CtdmReport = typeof ctdmReports.$inferSelect;

export const ctdmAdminAudit = mysqlTable(
  "ctdm_admin_audit",
  {
    id: int("id").autoincrement().primaryKey(),
    tenantId: int("tenantId").notNull().references(() => tenants.id),
    actorUserId: int("actorUserId").notNull().references(() => users.id),
    action: varchar("action", { length: 120 }).notNull(),
    targetType: varchar("targetType", { length: 80 }).notNull(),
    targetId: int("targetId"),
    metadata: json("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [index("ctdm_admin_audit_tenant_created_idx").on(table.tenantId, table.createdAt)],
);
export type CtdmAdminAudit = typeof ctdmAdminAudit.$inferSelect;

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
  shareGuidedMirrorAggregateThemes: boolean("shareGuidedMirrorAggregateThemes").default(false).notNull(),
  guidedMirrorAggregateConsentAt: timestamp("guidedMirrorAggregateConsentAt"),
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
  tenantId: int("tenantId").references(() => tenants.id),
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
  requestedName: varchar("requestedName", { length: 255 }), // name verified when the recipient redeems the link
  requestedOrganisation: varchar("requestedOrganisation", { length: 120 }), // prefill for first-time enterprise setup
  requestedWhatsappNumber: varchar("requestedWhatsappNumber", { length: 32 }), // optional contact captured at signup
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
  company: varchar("company", { length: 255 }),
  jobTitle: varchar("jobTitle", { length: 200 }),
  enquiry: text("enquiry"),
  source: varchar("source", { length: 64 }).default("sample_report").notNull(), // e.g. sample_report, landing_cta
  moduleCode: varchar("moduleCode", { length: 16 }), // which sample PDF they requested
  consentAt: timestamp("consentAt"),
  consentTextVersion: varchar("consentTextVersion", { length: 32 }),
  demoDedupeKey: varchar("demoDedupeKey", { length: 384 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("lead_captures_demo_dedupe_uq").on(table.demoDedupeKey),
]);
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
  extractionSources: json("extractionSources").$type<Partial<Record<"companyName" | "mission" | "vision" | "northStar" | "strategicGoals" | "values", { snippet: string; sourceUrl: string }>>>(),
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
  characterStyle: text("characterStyle"),
  voice: varchar("voice", { length: 20 }).default("onyx"),
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

// ─── Mission Reflections ──────────────────────────────────────────────────────
// A reflection is optional and private to the learner. One editable reflection is
// retained per completed mission so the post-completion prompt cannot duplicate data.
export const launchMissionReflections = mysqlTable(
  "launch_mission_reflections",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id),
    missionId: varchar("missionId", { length: 100 }).notNull(),
    missionDate: varchar("missionDate", { length: 10 }).notNull(),
    missionTitle: varchar("missionTitle", { length: 255 }).notNull(),
    reflectionText: text("reflectionText").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    uniqueMissionReflection: uniqueIndex("launch_mission_reflection_unique").on(
      table.userId,
      table.missionId,
    ),
  }),
);
export type LaunchMissionReflection = typeof launchMissionReflections.$inferSelect;

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

// ─── User Preferences (theme, avatar, notifications, accessibility) ───────────
export const launchUserPreferences = mysqlTable("launch_user_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  accentColor: varchar("accentColor", { length: 20 }).notNull().default("cyan"),
  avatar: varchar("avatar", { length: 255 }).notNull().default("🚀"),
  notifyDailyMissions: boolean("notifyDailyMissions").default(true).notNull(),
  notifyStreaks: boolean("notifyStreaks").default(true).notNull(),
  notifyAchievements: boolean("notifyAchievements").default(true).notNull(),
  notifyReminders: boolean("notifyReminders").default(true).notNull(),
  reducedMotion: boolean("reducedMotion").default(false).notNull(),
  highContrast: boolean("highContrast").default(false).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type LaunchUserPreferences = typeof launchUserPreferences.$inferSelect;

// ─── Weekly Peer Challenges ───────────────────────────────────────────────────
export const launchWeeklyChallenges = mysqlTable("launch_weekly_challenges", {
  id: int("id").autoincrement().primaryKey(),
  weekKey: varchar("weekKey", { length: 10 }).notNull().unique(),
  startsAt: timestamp("startsAt").notNull(),
  endsAt: timestamp("endsAt").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  goalType: mysqlEnum("goalType", ["daily_missions"]).notNull().default("daily_missions"),
  goalTarget: int("goalTarget").notNull().default(5),
  xpBonus: int("xpBonus").notNull().default(100),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type LaunchWeeklyChallenge = typeof launchWeeklyChallenges.$inferSelect;

export const launchChallengeEnrollments = mysqlTable(
  "launch_challenge_enrollments",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id),
    challengeId: int("challengeId").notNull().references(() => launchWeeklyChallenges.id),
    progress: int("progress").notNull().default(0),
    status: mysqlEnum("status", ["active", "completed"]).notNull().default("active"),
    joinedAt: timestamp("joinedAt").defaultNow().notNull(),
    completedAt: timestamp("completedAt"),
  },
  (table) => ({
    uniqueChallengeEnrollment: uniqueIndex("launch_challenge_enrollment_unique").on(
      table.challengeId,
      table.userId,
    ),
  }),
);
export type LaunchChallengeEnrollment = typeof launchChallengeEnrollments.$inferSelect;

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

// ═══════════════════════════════════════════════════════════════════════════════
// PROFESSIONAL EFFECTIVENESS INTELLIGENCE (PEI)
// ═══════════════════════════════════════════════════════════════════════════════

// ─── PEI User Profiles ───────────────────────────────────────────────────────
export const peProfiles = mysqlTable("pe_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id).unique(),
  // Role & context
  currentRole: varchar("currentRole", { length: 255 }),
  targetRole: varchar("targetRole", { length: 255 }),
  experienceYears: int("experienceYears"),
  department: varchar("department", { length: 255 }),
  // Career goals
  careerGoals: json("careerGoals").$type<string[]>(),
  developmentFocus: json("developmentFocus").$type<string[]>(),
  // Voice preference
  voiceProvider: varchar("voiceProvider", { length: 50 }).default("openai"), // openai | sarvam
  voiceId: varchar("voiceId", { length: 50 }).default("nova"),
  voiceLanguage: varchar("voiceLanguage", { length: 10 }).default("en"),
  // Onboarding
  onboardingComplete: boolean("onboardingComplete").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PeProfile = typeof peProfiles.$inferSelect;
export type InsertPeProfile = typeof peProfiles.$inferInsert;

// ─── PEI Calendar Integrations ────────────────────────────────────────────────
export const peCalendarIntegrations = mysqlTable("pe_calendar_integrations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  provider: varchar("provider", { length: 20 }).notNull(), // google | outlook
  accessToken: text("accessToken").notNull(),
  refreshToken: text("refreshToken"),
  expiresAt: timestamp("expiresAt"),
  lastSyncAt: timestamp("lastSyncAt"),
  syncStatus: varchar("syncStatus", { length: 20 }).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PeCalendarIntegration = typeof peCalendarIntegrations.$inferSelect;

// ─── PEI Calendar Events ──────────────────────────────────────────────────────
export const peCalendarEvents = mysqlTable("pe_calendar_events", {
  id: int("id").autoincrement().primaryKey(),
  integrationId: int("integrationId").notNull().references(() => peCalendarIntegrations.id),
  externalEventId: varchar("externalEventId", { length: 255 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  startTime: timestamp("startTime").notNull(),
  endTime: timestamp("endTime").notNull(),
  attendees: json("attendees").$type<Array<{ name: string; email: string }>>(),
  meetingLink: varchar("meetingLink", { length: 1000 }),
  isHighStakes: boolean("isHighStakes").default(false).notNull(),
  prepSuggestionSent: boolean("prepSuggestionSent").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PeCalendarEvent = typeof peCalendarEvents.$inferSelect;

// ─── PEI Assessment Sessions ──────────────────────────────────────────────────
export const peAssessmentSessions = mysqlTable("pe_assessment_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  status: mysqlEnum("status", ["in_progress", "completed", "abandoned"]).default("in_progress").notNull(),
  responses: json("responses").$type<Record<string, number>>(),
  currentQuestionIndex: int("currentQuestionIndex").default(0).notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PeAssessmentSession = typeof peAssessmentSessions.$inferSelect;

// ─── PEI Assessment Results ───────────────────────────────────────────────────
export const peAssessmentResults = mysqlTable("pe_assessment_results", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  sessionId: int("sessionId").references(() => peAssessmentSessions.id),
  // Overall PEI score (0-100)
  overallScore: float("overallScore").notNull(),
  zone: varchar("zone", { length: 50 }).notNull(),
  // Per-dimension scores
  dimensionScores: json("dimensionScores").$type<Record<string, number>>().notNull(),
  // LLM-generated analysis
  llmAnalysis: json("llmAnalysis"),
  // 90-day development plan
  developmentPlan: json("developmentPlan").$type<{
    focusAreas: Array<{ dimension: string; goal: string; actions: string[]; timeline: string }>;
    weeklyMilestones: Array<{ week: number; milestone: string }>;
    successIndicators: string[];
  }>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PeAssessmentResult = typeof peAssessmentResults.$inferSelect;

// ─── PEI Daily Briefs ──────────────────────────────────────────────────────────
export const peDailyBriefs = mysqlTable("pe_daily_briefs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  briefDate: varchar("briefDate", { length: 10 }).notNull(),
  brief: json("brief").$type<{
    greeting: string;
    dayTheme: string;
    priorityFocus: string;
    calendarItems: Array<{ title: string; time: string; isHighStakes: boolean; prepSuggestion?: string }>;
    developmentSuggestion: { topic: string; why: string; action: string };
    reflectionQuestion: string;
    commitmentReminder: string | null;
    coachingNudge: string;
  }>().notNull(),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
});
export type PeDailyBrief = typeof peDailyBriefs.$inferSelect;

// ─── PEI Coach Sessions ───────────────────────────────────────────────────────
export const peCoachSessions = mysqlTable("pe_coach_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  title: varchar("title", { length: 255 }),
  context: text("context"), // what the user wants to discuss
  status: varchar("status", { length: 20 }).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PeCoachSession = typeof peCoachSessions.$inferSelect;

// ─── PEI Coach Messages ───────────────────────────────────────────────────────
export const peCoachMessages = mysqlTable("pe_coach_messages", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull().references(() => peCoachSessions.id),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PeCoachMessage = typeof peCoachMessages.$inferSelect;

// ─── PEI Practice Sessions ─────────────────────────────────────────────────────
export const pePracticeSessions = mysqlTable("pe_practice_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  scenario: varchar("scenario", { length: 255 }).notNull(),
  scenarioType: varchar("scenarioType", { length: 100 }),
  counterpartPersonality: varchar("counterpartPersonality", { length: 100 }),
  messages: json("messages").$type<Array<{ role: string; content: string; timestamp: string }>>().default([]),
  coachingFeedback: json("coachingFeedback").$type<{
    overallRating: number;
    headline: string;
    strengths: string[];
    improvements: string[];
    keyMoment: string;
    nextPractice: string;
    coachingInsight: string;
  }>(),
  status: mysqlEnum("status", ["active", "completed"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PePracticeSession = typeof pePracticeSessions.$inferSelect;

// ─── PEI Commitments ──────────────────────────────────────────────────────────
export const peCommitments = mysqlTable("pe_commitments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  text: text("text").notNull(),
  dueDate: timestamp("dueDate"),
  sourceType: varchar("sourceType", { length: 50 }).default("manual").notNull(),
  sourceId: int("sourceId"),
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  outcome: text("outcome"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PeCommitment = typeof peCommitments.$inferSelect;

// ─── PEI Team Metrics (Manager Dashboard) ─────────────────────────────────────
export const peTeamMetrics = mysqlTable("pe_team_metrics", {
  id: int("id").autoincrement().primaryKey(),
  managerId: int("managerId").notNull().references(() => users.id),
  tenantId: int("tenantId").references(() => tenants.id),
  teamAdoptionRate: float("teamAdoptionRate").default(0).notNull(),
  avgSessionDuration: float("avgSessionDuration").default(0).notNull(),
  assessmentCompletionRate: float("assessmentCompletionRate").default(0).notNull(),
  practiceEngagementRate: float("practiceEngagementRate").default(0).notNull(),
  developmentFocusAreas: json("developmentFocusAreas").$type<string[]>(),
  trendData: json("trendData"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PeTeamMetric = typeof peTeamMetrics.$inferSelect;

// ═══════════════════════════════════════════════════════════════════════════════
// INTELLIGENCE CORE — Phase 1 Schema
// ═══════════════════════════════════════════════════════════════════════════════

// ─── IC: Diagnostic Instances ─────────────────────────────────────────────────
// Immutable record of a completed diagnostic, linking to the existing reports table
export const icDiagnosticInstances = mysqlTable("ic_diagnostic_instances", {
  id: int("id").autoincrement().primaryKey(),
  reportId: int("reportId").notNull().references(() => reports.id),
  tenantId: int("tenantId").references(() => tenants.id),
  userId: int("userId").references(() => users.id),
  moduleType: varchar("moduleType", { length: 20 }).notNull(),
  edgeScore: float("edgeScore").notNull(),
  dimensionScores: json("dimensionScores").$type<Record<string, number>>(),
  archetype: varchar("archetype", { length: 100 }),
  zone: varchar("zone", { length: 100 }),
  completedAt: timestamp("completedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type IcDiagnosticInstance = typeof icDiagnosticInstances.$inferSelect;

// ─── IC: Judgment Rules ─────────────────────────────────────────────────────────
// Registry of deterministic rules that produce recommendations
export const icJudgmentRules = mysqlTable("ic_judgment_rules", {
  id: int("id").autoincrement().primaryKey(),
  ruleCode: varchar("ruleCode", { length: 120 }).notNull().unique(),
  displayName: varchar("displayName", { length: 255 }).notNull(),
  description: text("description"),
  moduleType: varchar("moduleType", { length: 20 }).notNull(),
  dimensionId: varchar("dimensionId", { length: 100 }),
  priority: int("priority").default(50).notNull(),
  status: mysqlEnum("status", ["draft", "tested", "reviewed", "approved", "active", "retired"]).default("draft").notNull(),
  approvedBy: int("approvedBy").references(() => users.id),
  approvedAt: timestamp("approvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type IcJudgmentRule = typeof icJudgmentRules.$inferSelect;

// ─── IC: Judgment Rule Versions ─────────────────────────────────────────────────
// Versioned rule logic — conditions, thresholds, and recommendation templates
export const icJudgmentRuleVersions = mysqlTable("ic_judgment_rule_versions", {
  id: int("id").autoincrement().primaryKey(),
  ruleId: int("ruleId").notNull().references(() => icJudgmentRules.id),
  version: int("version").notNull(),
  // JSON conditions: { field, operator, value }[]
  conditions: json("conditions").$type<Array<{ field: string; operator: string; value: number | string }>>().notNull(),
  // Recommendation template
  recommendationTitle: varchar("recommendationTitle", { length: 255 }).notNull(),
  recommendationDescription: text("recommendationDescription").notNull(),
  recommendationType: varchar("recommendationType", { length: 100 }).notNull(),
  // Follow-up timing
  actionCheckInDays: int("actionCheckInDays").default(7).notNull(),
  outcomeCheckInDays: int("outcomeCheckInDays").default(30).notNull(),
  // Conflict handling
  mutexGroup: varchar("mutexGroup", { length: 100 }),
  maxRecommendations: int("maxRecommendations").default(3).notNull(),
  // Explanation
  explanationTemplate: text("explanationTemplate"),
  status: mysqlEnum("status", ["draft", "active", "superseded"]).default("draft").notNull(),
  effectiveFrom: timestamp("effectiveFrom"),
  effectiveTo: timestamp("effectiveTo"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type IcJudgmentRuleVersion = typeof icJudgmentRuleVersions.$inferSelect;

// ─── IC: Judgment Executions ───────────────────────────────────────────────────
// Immutable record of a rule execution against a diagnostic instance
export const icJudgmentExecutions = mysqlTable("ic_judgment_executions", {
  id: int("id").autoincrement().primaryKey(),
  diagnosticInstanceId: int("diagnosticInstanceId").notNull().references(() => icDiagnosticInstances.id),
  ruleVersionId: int("ruleVersionId").notNull().references(() => icJudgmentRuleVersions.id),
  tenantId: int("tenantId").references(() => tenants.id),
  userId: int("userId").references(() => users.id),
  // Input snapshot
  inputSnapshot: json("inputSnapshot").$type<Record<string, unknown>>().notNull(),
  // Execution result
  matched: boolean("matched").notNull(),
  outputSnapshot: json("outputSnapshot").$type<Record<string, unknown>>(),
  // Confidence
  inputConfidence: float("inputConfidence"),
  ruleApplicability: float("ruleApplicability"),
  // Lineage
  traceId: varchar("traceId", { length: 80 }),
  executedAt: timestamp("executedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type IcJudgmentExecution = typeof icJudgmentExecutions.$inferSelect;

// ─── IC: Recommendations ────────────────────────────────────────────────────────
// First-class recommendation records generated by the judgment engine
export const icRecommendations = mysqlTable("ic_recommendations", {
  id: int("id").autoincrement().primaryKey(),
  diagnosticInstanceId: int("diagnosticInstanceId").notNull().references(() => icDiagnosticInstances.id),
  judgmentExecutionId: int("judgmentExecutionId").notNull().references(() => icJudgmentExecutions.id),
  ruleId: int("ruleId").notNull().references(() => icJudgmentRules.id),
  ruleVersionId: int("ruleVersionId").notNull().references(() => icJudgmentRuleVersions.id),
  tenantId: int("tenantId").references(() => tenants.id),
  userId: int("userId").notNull().references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  recommendationType: varchar("recommendationType", { length: 100 }).notNull(),
  priority: int("priority").default(50).notNull(),
  explanation: text("explanation"),
  status: mysqlEnum("status", ["generated", "presented", "accepted", "rejected", "deferred", "superseded"]).default("generated").notNull(),
  presentedAt: timestamp("presentedAt"),
  decidedAt: timestamp("decidedAt"),
  decisionReasonCode: varchar("decisionReasonCode", { length: 100 }),
  decisionReasonText: text("decisionReasonText"),
  idempotencyKey: varchar("idempotencyKey", { length: 120 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type IcRecommendation = typeof icRecommendations.$inferSelect;

// ─── IC: Recommendation Actions ─────────────────────────────────────────────────
// Action commitments made by users based on recommendations
export const icRecommendationActions = mysqlTable("ic_recommendation_actions", {
  id: int("id").autoincrement().primaryKey(),
  recommendationId: int("recommendationId").notNull().references(() => icRecommendations.id),
  tenantId: int("tenantId").references(() => tenants.id),
  userId: int("userId").notNull().references(() => users.id),
  actionTypeCode: varchar("actionTypeCode", { length: 100 }).notNull(),
  actionDescription: text("actionDescription").notNull(),
  status: mysqlEnum("status", ["planned", "in_progress", "completed", "cancelled"]).default("planned").notNull(),
  plannedStartAt: timestamp("plannedStartAt"),
  plannedCompleteAt: timestamp("plannedCompleteAt"),
  completedAt: timestamp("completedAt"),
  completionNotes: text("completionNotes"),
  version: int("version").default(1).notNull(),
  idempotencyKey: varchar("idempotencyKey", { length: 120 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type IcRecommendationAction = typeof icRecommendationActions.$inferSelect;

// ─── IC: Outcome Observations ───────────────────────────────────────────────────
// Records of outcomes observed after actions were taken
export const icOutcomeObservations = mysqlTable("ic_outcome_observations", {
  id: int("id").autoincrement().primaryKey(),
  actionId: int("actionId").notNull().references(() => icRecommendationActions.id),
  recommendationId: int("recommendationId").notNull().references(() => icRecommendations.id),
  tenantId: int("tenantId").references(() => tenants.id),
  userId: int("userId").notNull().references(() => users.id),
  observationRound: int("observationRound").default(1).notNull(),
  impactLevel: mysqlEnum("impactLevel", ["none", "minimal", "moderate", "significant", "transformative"]).notNull(),
  recommendationValue: mysqlEnum("recommendationValue", ["not_helpful", "slightly_helpful", "helpful", "very_helpful", "essential"]).notNull(),
  causalConfidence: mysqlEnum("causalConfidence", ["low", "medium", "high"]).default("medium").notNull(),
  outcomeSummary: text("outcomeSummary"),
  measurementMethodCode: varchar("measurementMethodCode", { length: 100 }),
  observedAt: timestamp("observedAt").defaultNow().notNull(),
  idempotencyKey: varchar("idempotencyKey", { length: 120 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type IcOutcomeObservation = typeof icOutcomeObservations.$inferSelect;

// ─── IC: Outcome Metrics ────────────────────────────────────────────────────────
// Normalized quantitative metrics for outcome observations
export const icOutcomeMetrics = mysqlTable("ic_outcome_metrics", {
  id: int("id").autoincrement().primaryKey(),
  outcomeObservationId: int("outcomeObservationId").notNull().references(() => icOutcomeObservations.id),
  metricCode: varchar("metricCode", { length: 120 }).notNull(),
  baselineValue: float("baselineValue"),
  resultValue: float("resultValue"),
  unitCode: varchar("unitCode", { length: 40 }),
  baselineDate: timestamp("baselineDate"),
  resultDate: timestamp("resultDate"),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type IcOutcomeMetric = typeof icOutcomeMetrics.$inferSelect;

// ─── IC: Outcome Evidence ───────────────────────────────────────────────────────
// Evidence classification for outcome observations
export const icOutcomeEvidence = mysqlTable("ic_outcome_evidence", {
  id: int("id").autoincrement().primaryKey(),
  outcomeObservationId: int("outcomeObservationId").notNull().references(() => icOutcomeObservations.id),
  evidenceSource: mysqlEnum("evidenceSource", ["self_report", "manager_confirmation", "coach_observation", "system_metric", "uploaded_document", "hr_validation"]).notNull(),
  verificationStatus: mysqlEnum("verificationStatus", ["unverified", "pending", "verified", "disputed", "rejected"]).default("unverified").notNull(),
  evidenceReference: varchar("evidenceReference", { length: 500 }),
  verifiedBy: int("verifiedBy").references(() => users.id),
  verifiedAt: timestamp("verifiedAt"),
  verificationNotes: text("verificationNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type IcOutcomeEvidence = typeof icOutcomeEvidence.$inferSelect;

// ─── IC: Processing Permissions ─────────────────────────────────────────────────
// Current projection of permissions for a processing purpose
export const icProcessingPermissions = mysqlTable("ic_processing_permissions", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull().references(() => tenants.id),
  scopeType: mysqlEnum("scopeType", ["organization", "individual"]).notNull(),
  scopeSubjectId: int("scopeSubjectId").notNull(),
  purposeCode: varchar("purposeCode", { length: 120 }).notNull(),
  status: mysqlEnum("status", ["pending", "granted", "revoked", "expired"]).default("pending").notNull(),
  policyVersion: varchar("policyVersion", { length: 40 }),
  legalBasisCode: varchar("legalBasisCode", { length: 80 }),
  effectiveFrom: timestamp("effectiveFrom"),
  effectiveTo: timestamp("effectiveTo"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type IcProcessingPermission = typeof icProcessingPermissions.$inferSelect;

// ─── IC: Permission Events ──────────────────────────────────────────────────────
// Append-only permission ledger
export const icPermissionEvents = mysqlTable("ic_permission_events", {
  id: int("id").autoincrement().primaryKey(),
  permissionId: int("permissionId").references(() => icProcessingPermissions.id),
  tenantId: int("tenantId").notNull().references(() => tenants.id),
  scopeType: varchar("scopeType", { length: 40 }).notNull(),
  scopeSubjectId: int("scopeSubjectId").notNull(),
  purposeCode: varchar("purposeCode", { length: 120 }).notNull(),
  eventType: mysqlEnum("eventType", ["requested", "granted", "revoked", "expired", "deletion_requested", "processing_excluded"]).notNull(),
  policyVersion: varchar("policyVersion", { length: 40 }),
  reason: text("reason"),
  actorUserId: int("actorUserId").references(() => users.id),
  occurredAt: timestamp("occurredAt").defaultNow().notNull(),
  requestIpHash: varchar("requestIpHash", { length: 100 }),
  userAgentClass: varchar("userAgentClass", { length: 120 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type IcPermissionEvent = typeof icPermissionEvents.$inferSelect;

// ─── IC: Audit Events ───────────────────────────────────────────────────────────
// Immutable security and business audit log
export const icAuditEvents = mysqlTable("ic_audit_events", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").references(() => tenants.id),
  actorUserId: int("actorUserId").references(() => users.id),
  subjectUserId: int("subjectUserId").references(() => users.id),
  eventType: varchar("eventType", { length: 120 }).notNull(),
  resourceType: varchar("resourceType", { length: 80 }),
  resourceId: int("resourceId"),
  processingPurpose: varchar("processingPurpose", { length: 120 }),
  authorizationResult: mysqlEnum("authorizationResult", ["allowed", "denied", "not_applicable"]).default("not_applicable").notNull(),
  traceId: varchar("traceId", { length: 80 }),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  occurredAt: timestamp("occurredAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type IcAuditEvent = typeof icAuditEvents.$inferSelect;

// ─── IC: Outbox Events (history-only; publisher deprecated) ─────────────────────
// Retained for historical observability. Do not create new rows or infer delivery
// from existing status values unless a verified downstream consumer is introduced.
export const icOutboxEvents = mysqlTable("ic_outbox_events", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").references(() => tenants.id),
  eventType: varchar("eventType", { length: 120 }).notNull(),
  aggregateType: varchar("aggregateType", { length: 80 }),
  aggregateId: int("aggregateId"),
  payload: json("payload").$type<Record<string, unknown>>(),
  status: mysqlEnum("status", ["pending", "processing", "published", "failed", "dead_letter"]).default("pending").notNull(),
  attemptCount: int("attemptCount").default(0).notNull(),
  availableAt: timestamp("availableAt").defaultNow().notNull(),
  publishedAt: timestamp("publishedAt"),
  lastError: text("lastError"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type IcOutboxEvent = typeof icOutboxEvents.$inferSelect;

// ─── Intelligence Core: Practice Scenario Progress ─────────────────────────────
export const icPracticeProgress = mysqlTable("ic_practice_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  diagnosticInstanceId: int("diagnosticInstanceId").notNull(),
  scenarioId: varchar("scenarioId", { length: 120 }).notNull(),
  dimensionId: varchar("dimensionId", { length: 80 }).notNull(),
  completed: boolean("completed").default(false).notNull(),
  completedAt: timestamp("completedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type IcPracticeProgress = typeof icPracticeProgress.$inferSelect;
export type InsertIcPracticeProgress = typeof icPracticeProgress.$inferInsert;

// ─── Intelligence Core: Private Self-Leadership Mirrors ───────────────────────
// Individual-owned coaching reflections. These records must not be surfaced in
// organisational reporting without an explicit, purpose-specific consent flow.
export const icSelfLeadershipMirrors = mysqlTable("ic_self_leadership_mirrors", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").references(() => tenants.id),
  userId: int("userId").notNull().references(() => users.id),
  sourceApp: varchar("sourceApp", { length: 80 }).notNull(),
  careerStage: mysqlEnum("careerStage", ["early_career", "professional", "manager", "leader", "cxo"]).notNull().$type<SelfLeadershipCareerStage>(),
  primaryDimension: mysqlEnum("primaryDimension", ["self_awareness", "authenticity", "courage", "responsibility", "other_centredness", "integrity"]).notNull().$type<SelfLeadershipDimension>(),
  confidence: mysqlEnum("confidence", ["low", "moderate", "high"]).notNull().$type<SelfLeadershipConfidence>(),
  situation: text("situation").notNull(),
  observedBehaviour: text("observedBehaviour"),
  analysis: json("analysis").$type<SelfLeadershipAnalysis>().notNull(),
  relevance: mysqlEnum("relevance", ["up", "down"]),
  feedbackReason: varchar("feedbackReason", { length: 120 }),
  experimentStatus: mysqlEnum("experimentStatus", ["not_started", "attempted"]).default("not_started").notNull(),
  ontologyPrimaryDistinctionId: varchar("ontologyPrimaryDistinctionId", { length: 64 }),
  ontologySecondaryDistinctionId: varchar("ontologySecondaryDistinctionId", { length: 64 }),
  feedbackNote: text("feedbackNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("ic_sl_mirrors_user_created_idx").on(table.userId, table.createdAt),
]);
export type IcSelfLeadershipMirror = typeof icSelfLeadershipMirrors.$inferSelect;
export type InsertIcSelfLeadershipMirror = typeof icSelfLeadershipMirrors.$inferInsert;

// ─── Executive Intelligence: Private Executive Context & Decisions ────────────
// These records are user-owned. They never become sponsor, HR, or coach content
// without a separate explicit permission model.
export const executiveProfiles = mysqlTable("executive_profiles", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").references(() => tenants.id),
  userId: int("userId").notNull().references(() => users.id).unique(),
  roleTitle: varchar("roleTitle", { length: 180 }),
  roleType: varchar("roleType", { length: 80 }),
  businessName: varchar("businessName", { length: 180 }),
  businessDescription: text("businessDescription"),
  geography: varchar("geography", { length: 160 }),
  scopeDescription: text("scopeDescription"),
  mandateStatement: text("mandateStatement"),
  transitionMode: varchar("transitionMode", { length: 40 }).default("executive_performance").notNull(),
  runAttention: int("runAttention").default(0).notNull(),
  transformAttention: int("transformAttention").default(0).notNull(),
  buildAttention: int("buildAttention").default(0).notNull(),
  stakeholderSummary: text("stakeholderSummary"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ExecutiveProfile = typeof executiveProfiles.$inferSelect;

export const executiveMandates = mysqlTable("executive_mandates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id).unique(),
  priorities: json("priorities").$type<import("../shared/modules/executiveIntelligence").ExecutivePriority[]>().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ExecutiveMandate = typeof executiveMandates.$inferSelect;

export const executiveDecisionJournal = mysqlTable("executive_decision_journal", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  decision: text("decision").notNull(),
  context: text("context").notNull(),
  assumptions: json("assumptions").$type<string[]>(),
  options: json("options").$type<string[]>(),
  tradeOffs: text("tradeOffs"),
  stakeholders: text("stakeholders"),
  expectedOutcome: text("expectedOutcome"),
  confidence: int("confidence"),
  reviewDate: timestamp("reviewDate"),
  reviewStatus: mysqlEnum("reviewStatus", ["pending", "working", "mixed", "not_working"]).default("pending").notNull(),
  actualOutcome: text("actualOutcome"),
  learning: text("learning"),
  nextTimeChange: text("nextTimeChange"),
  reviewedAt: timestamp("reviewedAt"),
  analysis: json("analysis").$type<import("../shared/modules/executiveIntelligence").ExecutiveSituationAnalysis>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("executive_decisions_user_created_idx").on(table.userId, table.createdAt)]);
export type ExecutiveDecisionJournalEntry = typeof executiveDecisionJournal.$inferSelect;

export const executiveDecisionReviewReminderSettings = mysqlTable("executive_decision_review_reminder_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id).unique(),
  enabled: boolean("enabled").default(false).notNull(),
  localDayOfWeek: int("localDayOfWeek").default(1).notNull(),
  localHour: int("localHour").default(9).notNull(),
  timeZone: varchar("timeZone", { length: 80 }).default("UTC").notNull(),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  lastReminderAt: timestamp("lastReminderAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("executive_decision_review_task_idx").on(table.scheduleCronTaskUid)]);
export type ExecutiveDecisionReviewReminderSetting = typeof executiveDecisionReviewReminderSettings.$inferSelect;

// ─── Intelligence Core: User-controlled Guided Mirror reminders ───────────────
export const icGuidedMirrorReminderSettings = mysqlTable("ic_guided_mirror_reminder_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id).unique(),
  enabled: boolean("enabled").default(false).notNull(),
  dayOfWeek: int("dayOfWeek").default(1).notNull(),
  hourUtc: int("hourUtc").default(3).notNull(),
  localDayOfWeek: int("localDayOfWeek").default(1).notNull(),
  localHour: int("localHour").default(9).notNull(),
  timeZone: varchar("timeZone", { length: 80 }).default("UTC").notNull(),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  lastReminderAt: timestamp("lastReminderAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("ic_gm_reminder_task_idx").on(table.scheduleCronTaskUid)]);
export type IcGuidedMirrorReminderSettings = typeof icGuidedMirrorReminderSettings.$inferSelect;

// ─── Early Career Intelligence ───────────────────────────────────────────────
// The canonical domain key for this corporate product is `early_career`.
// `ECI` remains reserved for Executive Communication Intelligence.
export const earlyCareerCohorts = mysqlTable("early_career_cohorts", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull().references(() => tenants.id),
  name: varchar("name", { length: 160 }).notNull(),
  description: text("description"),
  managerUserId: int("managerUserId").notNull().references(() => users.id),
  createdByUserId: int("createdByUserId").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("early_career_cohorts_tenant_manager_idx").on(table.tenantId, table.managerUserId)]);
export type EarlyCareerCohort = typeof earlyCareerCohorts.$inferSelect;
export type InsertEarlyCareerCohort = typeof earlyCareerCohorts.$inferInsert;

export const earlyCareerProfiles = mysqlTable(
  "early_career_profiles",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id),
    tenantId: int("tenantId").references(() => tenants.id),
    managerUserId: int("managerUserId").references(() => users.id),
    cohortId: int("cohortId").references(() => earlyCareerCohorts.id),
    joiningDate: timestamp("joiningDate"),
    roleTitle: varchar("roleTitle", { length: 255 }),
    functionName: varchar("functionName", { length: 150 }),
    teamName: varchar("teamName", { length: 150 }),
    journeyStage: mysqlEnum("journeyStage", [
      "orient",
      "deliver",
      "connect",
      "navigate",
      "grow",
      "contribute",
      "accelerate",
    ]).default("orient").notNull(),
    onboardingComplete: boolean("onboardingComplete").default(false).notNull(),
    privacyAcknowledgedAt: timestamp("privacyAcknowledgedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [uniqueIndex("early_career_profiles_user_unique").on(table.userId)]
);
export type EarlyCareerProfile = typeof earlyCareerProfiles.$inferSelect;
export type InsertEarlyCareerProfile = typeof earlyCareerProfiles.$inferInsert;

// Employee actions may remain private or be explicitly shared with a manager.
export const earlyCareerCommitments = mysqlTable("early_career_commitments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  tenantId: int("tenantId").references(() => tenants.id),
  createdByUserId: int("createdByUserId").references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  journeyStage: varchar("journeyStage", { length: 40 }).notNull(),
  capabilityId: varchar("capabilityId", { length: 80 }).notNull(),
  dueDate: timestamp("dueDate"),
  status: mysqlEnum("status", ["planned", "in_progress", "completed", "cancelled"]).default("planned").notNull(),
  sharingScope: mysqlEnum("sharingScope", ["private", "employee_and_manager"]).default("private").notNull(),
  outcome: text("outcome"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type EarlyCareerCommitment = typeof earlyCareerCommitments.$inferSelect;
export type InsertEarlyCareerCommitment = typeof earlyCareerCommitments.$inferInsert;

// Evidence records are intentionally separate from completion states so growth is
// not reduced to a single activity checkbox.
export const earlyCareerEvidence = mysqlTable("early_career_evidence", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  tenantId: int("tenantId").references(() => tenants.id),
  commitmentId: int("commitmentId").references(() => earlyCareerCommitments.id),
  capabilityId: varchar("capabilityId", { length: 80 }).notNull(),
  evidenceType: mysqlEnum("evidenceType", ["self_report", "shared_commitment", "practice", "manager_confirmation"]).notNull(),
  privacyScope: mysqlEnum("privacyScope", ["private", "employee_and_manager"]).default("private").notNull(),
  summary: text("summary").notNull(),
  occurredAt: timestamp("occurredAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type EarlyCareerEvidence = typeof earlyCareerEvidence.$inferSelect;
export type InsertEarlyCareerEvidence = typeof earlyCareerEvidence.$inferInsert;

// Manager nudges contain only manager-visible, approved developmental context.
// They must never contain private coaching conversations or raw diagnostic answers.
export const earlyCareerManagerNudges = mysqlTable("early_career_manager_nudges", {
  id: int("id").autoincrement().primaryKey(),
  managerUserId: int("managerUserId").notNull().references(() => users.id),
  employeeUserId: int("employeeUserId").notNull().references(() => users.id),
  tenantId: int("tenantId").references(() => tenants.id),
  nudgeCode: varchar("nudgeCode", { length: 120 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  rationale: text("rationale").notNull(),
  conversationObjective: text("conversationObjective").notNull(),
  suggestedQuestions: json("suggestedQuestions").$type<string[]>().notNull(),
  privacyBoundary: text("privacyBoundary").notNull(),
  status: mysqlEnum("status", ["suggested", "accepted", "dismissed", "completed"]).default("suggested").notNull(),
  scheduledFor: timestamp("scheduledFor"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type EarlyCareerManagerNudge = typeof earlyCareerManagerNudges.$inferSelect;
export type InsertEarlyCareerManagerNudge = typeof earlyCareerManagerNudges.$inferInsert;

// Diagnostic answers are employee-private. Only derived cohort-level aggregates
// may be surfaced to HR when the configured minimum cohort threshold is met.
export const earlyCareerDiagnosticSessions = mysqlTable("early_career_diagnostic_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  tenantId: int("tenantId").references(() => tenants.id),
  responses: json("responses").$type<Record<string, number>>().notNull(),
  currentQuestionIndex: int("currentQuestionIndex").notNull().default(0),
  status: mysqlEnum("status", ["in_progress", "completed"]).notNull().default("in_progress"),
  consentedAt: timestamp("consentedAt").notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type EarlyCareerDiagnosticSession = typeof earlyCareerDiagnosticSessions.$inferSelect;
export type InsertEarlyCareerDiagnosticSession = typeof earlyCareerDiagnosticSessions.$inferInsert;

export const earlyCareerDiagnosticResults = mysqlTable("early_career_diagnostic_results", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull().references(() => earlyCareerDiagnosticSessions.id),
  userId: int("userId").notNull().references(() => users.id),
  tenantId: int("tenantId").references(() => tenants.id),
  overallScore: float("overallScore").notNull(),
  capabilityScores: json("capabilityScores").$type<Record<string, number>>().notNull(),
  developmentalBand: varchar("developmentalBand", { length: 100 }).notNull(),
  recommendedCapabilityId: varchar("recommendedCapabilityId", { length: 80 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type EarlyCareerDiagnosticResult = typeof earlyCareerDiagnosticResults.$inferSelect;
export type InsertEarlyCareerDiagnosticResult = typeof earlyCareerDiagnosticResults.$inferInsert;

// AI Coach sessions and messages are private to the employee and are never
// included in Manager Companion or HR cohort queries.
export const earlyCareerCoachSessions = mysqlTable("early_career_coach_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  tenantId: int("tenantId").references(() => tenants.id),
  title: varchar("title", { length: 160 }).notNull(),
  startingContext: text("startingContext"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type EarlyCareerCoachSession = typeof earlyCareerCoachSessions.$inferSelect;
export type InsertEarlyCareerCoachSession = typeof earlyCareerCoachSessions.$inferInsert;

export const earlyCareerCoachMessages = mysqlTable("early_career_coach_messages", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull().references(() => earlyCareerCoachSessions.id),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type EarlyCareerCoachMessage = typeof earlyCareerCoachMessages.$inferSelect;
export type InsertEarlyCareerCoachMessage = typeof earlyCareerCoachMessages.$inferInsert;

// Reusable workplace situations are private to the employee and are never
// included in manager or HR views.
export const earlyCareerSavedPracticeScenarios = mysqlTable("early_career_saved_practice_scenarios", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  tenantId: int("tenantId").references(() => tenants.id),
  title: varchar("title", { length: 160 }).notNull(),
  context: text("context").notNull(),
  counterpartRole: varchar("counterpartRole", { length: 120 }).notNull(),
  objective: text("objective"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("early_career_saved_practice_user_updated_idx").on(table.userId, table.updatedAt)]);
export type EarlyCareerSavedPracticeScenario = typeof earlyCareerSavedPracticeScenarios.$inferSelect;
export type InsertEarlyCareerSavedPracticeScenario = typeof earlyCareerSavedPracticeScenarios.$inferInsert;

export const earlyCareerPracticeSessions = mysqlTable("early_career_practice_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  tenantId: int("tenantId").references(() => tenants.id),
  scenarioId: varchar("scenarioId", { length: 100 }).notNull(),
  scenarioTitle: varchar("scenarioTitle", { length: 255 }).notNull(),
  // Custom scenario inputs remain part of the employee's private practice record.
  customContext: text("customContext"),
  customCounterpartRole: varchar("customCounterpartRole", { length: 120 }),
  customObjective: text("customObjective"),
  difficulty: mysqlEnum("difficulty", ["guided", "realistic", "stretch"]).notNull().default("realistic"),
  messages: json("messages").$type<Array<{ role: "user" | "counterpart"; content: string; timestamp: string }>>().notNull(),
  status: mysqlEnum("status", ["active", "completed"]).notNull().default("active"),
  feedback: json("feedback").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type EarlyCareerPracticeSession = typeof earlyCareerPracticeSessions.$inferSelect;
export type InsertEarlyCareerPracticeSession = typeof earlyCareerPracticeSessions.$inferInsert;

// Organisation owners control nudge eligibility. Nudge delivery records never
// include raw diagnostic answers or private coach/practice content.
export const earlyCareerNudgeConfigs = mysqlTable(
  "early_career_nudge_configs",
  {
    id: int("id").autoincrement().primaryKey(),
    tenantId: int("tenantId").notNull().references(() => tenants.id),
    enabled: boolean("enabled").notNull().default(false),
    audience: mysqlEnum("audience", ["employees", "managers"]).notNull(),
    cadence: mysqlEnum("cadence", ["weekly", "fortnightly", "monthly"]).notNull().default("weekly"),
    journeyStage: varchar("journeyStage", { length: 40 }).notNull().default("all"),
    dayOfWeek: int("dayOfWeek").notNull().default(1),
    hourUtc: int("hourUtc").notNull().default(8),
    scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
    cadenceAnchorAt: timestamp("cadenceAnchorAt"),
    createdByUserId: int("createdByUserId").notNull().references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    uniqueIndex("early_career_nudge_tenant_audience_unique").on(table.tenantId, table.audience),
    index("early_career_nudge_schedule_task_uid_idx").on(table.scheduleCronTaskUid),
  ]
);
export type EarlyCareerNudgeConfig = typeof earlyCareerNudgeConfigs.$inferSelect;
export type InsertEarlyCareerNudgeConfig = typeof earlyCareerNudgeConfigs.$inferInsert;

export const earlyCareerNudgeDeliveries = mysqlTable("early_career_nudge_deliveries", {
  id: int("id").autoincrement().primaryKey(),
  configId: int("configId").notNull().references(() => earlyCareerNudgeConfigs.id),
  recipientUserId: int("recipientUserId").notNull().references(() => users.id),
  employeeUserId: int("employeeUserId").references(() => users.id),
  tenantId: int("tenantId").notNull().references(() => tenants.id),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  cadenceWindowKey: varchar("cadenceWindowKey", { length: 64 }).notNull(),
  status: mysqlEnum("status", ["created", "read", "dismissed"]).notNull().default("created"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("early_career_nudge_delivery_window_unique").on(table.configId, table.recipientUserId, table.cadenceWindowKey),
  index("early_career_nudge_delivery_config_window_idx").on(table.configId, table.cadenceWindowKey),
]);
export type EarlyCareerNudgeDelivery = typeof earlyCareerNudgeDeliveries.$inferSelect;
export type InsertEarlyCareerNudgeDelivery = typeof earlyCareerNudgeDeliveries.$inferInsert;

// ─── Sales Intelligence: System of Judgment ───────────────────────────────────
// Seller-owned commercial context is intentionally separated from the CRM record.
// It captures the quality of thinking, evidence, commitments, and learning around
// real commercial work; it does not replace the opportunity system of record.
export type SalesEvidenceCategory = "fact" | "evidence" | "interpretation" | "assumption" | "hope";
export type SalesConfidence = "low" | "moderate" | "high";
export type SalesJudgment = {
  whatIsHappening: string;
  whatWeKnow: string[];
  whatWeAreAssuming: string[];
  whatMattersMost: string;
  primaryConstraint: string;
  constraintEvidence: string[];
  confidence: SalesConfidence;
  missingInformation: string[];
  recommendedNextMove: string;
  alternativeMove: string;
  whatWouldChangeJudgment: string;
  practicePrompt: string;
};

export const salesSituations = mysqlTable("sales_situations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  accountName: varchar("accountName", { length: 255 }),
  rawSituation: text("rawSituation").notNull(),
  desiredOutcome: text("desiredOutcome"),
  status: mysqlEnum("status", ["active", "committed", "reflected", "archived"]).default("active").notNull(),
  judgment: json("judgment").$type<SalesJudgment>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("sales_situations_user_updated_idx").on(table.userId, table.updatedAt)]);
export type SalesSituation = typeof salesSituations.$inferSelect;
export type InsertSalesSituation = typeof salesSituations.$inferInsert;

export const salesClaims = mysqlTable("sales_claims", {
  id: int("id").autoincrement().primaryKey(),
  situationId: int("situationId").notNull().references(() => salesSituations.id),
  userId: int("userId").notNull().references(() => users.id),
  category: mysqlEnum("category", ["fact", "evidence", "interpretation", "assumption", "hope"]).notNull(),
  statement: text("statement").notNull(),
  confidence: mysqlEnum("confidence", ["low", "moderate", "high"]).default("low").notNull(),
  source: varchar("source", { length: 255 }).default("seller narrative").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("sales_claims_situation_idx").on(table.situationId), index("sales_claims_user_idx").on(table.userId)]);
export type SalesClaim = typeof salesClaims.$inferSelect;

export const salesCommitments = mysqlTable("sales_commitments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  situationId: int("situationId").notNull().references(() => salesSituations.id),
  action: text("action").notNull(),
  stakeholder: varchar("stakeholder", { length: 255 }),
  intendedBehaviour: text("intendedBehaviour"),
  dueDate: timestamp("dueDate"),
  status: mysqlEnum("status", ["pending", "completed", "not_done"]).default("pending").notNull(),
  reflection: text("reflection"),
  outcome: text("outcome"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("sales_commitments_user_status_idx").on(table.userId, table.status), index("sales_commitments_situation_idx").on(table.situationId)]);
export type SalesCommitment = typeof salesCommitments.$inferSelect;

export type SalesPracticeMessage = { role: "seller" | "buyer"; content: string; timestamp: number };
export type SalesPracticeScenario = { buyerRole: string; buyerStance: string; openingLine: string; challenge: string; successSignal: string; evidenceBoundary: string };
export type SalesPracticeDebrief = { strengths: string[]; tryNext: string[]; evidenceQuestion: string; keyTakeaway: string; evidenceBoundary: string };

// A seller-owned rehearsal is a private learning artefact, not a call recording or performance record.
export const salesPracticeSessions = mysqlTable("sales_practice_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  situationId: int("situationId").notNull().references(() => salesSituations.id),
  buyerRole: varchar("buyerRole", { length: 255 }).notNull(),
  objective: text("objective"),
  scenario: json("scenario").$type<SalesPracticeScenario>(),
  messages: json("messages").$type<SalesPracticeMessage[]>(),
  debrief: json("debrief").$type<SalesPracticeDebrief>(),
  status: mysqlEnum("status", ["active", "completed"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("sales_practice_sessions_user_updated_idx").on(table.userId, table.updatedAt), index("sales_practice_sessions_situation_idx").on(table.situationId)]);
export type SalesPracticeSession = typeof salesPracticeSessions.$inferSelect;

// ─── Model Evaluation Workspace ───────────────────────────────────────────────
// Admin-only evaluation records. Prompts and outputs are stored intentionally for
// quality review and must not contain personal client or employee data.
export type ModelEvaluationUsage = {
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
};

export type ModelEvaluationScores = {
  clarity: number;
  usefulness: number;
  leadershipTone: number;
};

export const modelEvaluations = mysqlTable(
  "model_evaluations",
  {
    id: int("id").autoincrement().primaryKey(),
    createdByUserId: int("createdByUserId").notNull().references(() => users.id),
    systemPrompt: text("systemPrompt").notNull(),
    userPrompt: text("userPrompt").notNull(),
    maxTokens: int("maxTokens").notNull(),
    temperature: float("temperature").notNull(),
    status: mysqlEnum("status", ["completed", "partial"]).notNull(),
    claudeModel: varchar("claudeModel", { length: 100 }).notNull(),
    claudeResponse: text("claudeResponse"),
    claudeError: text("claudeError"),
    claudeLatencyMs: int("claudeLatencyMs"),
    claudeUsage: json("claudeUsage").$type<ModelEvaluationUsage>(),
    qwenModel: varchar("qwenModel", { length: 100 }).notNull(),
    qwenResponse: text("qwenResponse"),
    qwenError: text("qwenError"),
    qwenLatencyMs: int("qwenLatencyMs"),
    qwenUsage: json("qwenUsage").$type<ModelEvaluationUsage>(),
    preferredModel: mysqlEnum("preferredModel", ["claude", "qwen", "tie", "neither"]),
    reviewScores: json("reviewScores").$type<ModelEvaluationScores>(),
    reviewerNote: text("reviewerNote"),
    reviewedByUserId: int("reviewedByUserId").references(() => users.id),
    reviewedAt: timestamp("reviewedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("model_evaluations_created_idx").on(table.createdAt),
    index("model_evaluations_creator_idx").on(table.createdByUserId),
  ]
);

export type ModelEvaluation = typeof modelEvaluations.$inferSelect;
export type InsertModelEvaluation = typeof modelEvaluations.$inferInsert;

// ─── Engineering Intelligence ───────────────────────────────────────────────
// This product namespace keeps developmental diagnostic, Mission, Partner, and
// agent-operability data distinct from generic LevelNext assessments. Private
// Self-Leadership reflections continue to use icSelfLeadershipMirrors.
export const eiDiagnosticSessions = mysqlTable("ei_diagnostic_sessions", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull().references(() => tenants.id),
  userId: int("userId").notNull().references(() => users.id),
  diagnosticVersion: varchar("diagnosticVersion", { length: 80 }).notNull(),
  status: mysqlEnum("status", ["in_progress", "completed", "abandoned"]).default("in_progress").notNull(),
  currentQuestionIndex: int("currentQuestionIndex").default(0).notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("ei_diagnostic_sessions_owner_idx").on(table.tenantId, table.userId, table.status),
]);
export type EiDiagnosticSession = typeof eiDiagnosticSessions.$inferSelect;

export const eiDiagnosticResponses = mysqlTable("ei_diagnostic_responses", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull().references(() => eiDiagnosticSessions.id),
  tenantId: int("tenantId").notNull().references(() => tenants.id),
  userId: int("userId").notNull().references(() => users.id),
  questionCode: varchar("questionCode", { length: 120 }).notNull(),
  answerValue: int("answerValue").notNull(),
  answeredAt: timestamp("answeredAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("ei_diagnostic_responses_session_question_uq").on(table.sessionId, table.questionCode),
  index("ei_diagnostic_responses_owner_idx").on(table.tenantId, table.userId, table.createdAt),
]);
export type EiDiagnosticResponse = typeof eiDiagnosticResponses.$inferSelect;

export const eiDiagnosticResults = mysqlTable("ei_diagnostic_results", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull().references(() => eiDiagnosticSessions.id),
  tenantId: int("tenantId").notNull().references(() => tenants.id),
  userId: int("userId").notNull().references(() => users.id),
  diagnosticVersion: varchar("diagnosticVersion", { length: 80 }).notNull(),
  engineScores: json("engineScores").$type<Record<string, number>>().notNull(),
  impactRadius: mysqlEnum("impactRadius", ["self", "team", "system", "organisation"]).notNull(),
  impactPattern: varchar("impactPattern", { length: 160 }).notNull(),
  growthEdge: json("growthEdge").$type<{ engine: string; statement: string }>().notNull(),
  scoringMethodVersion: varchar("scoringMethodVersion", { length: 80 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("ei_diagnostic_results_session_uq").on(table.sessionId),
  index("ei_diagnostic_results_owner_idx").on(table.tenantId, table.userId, table.createdAt),
]);
export type EiDiagnosticResult = typeof eiDiagnosticResults.$inferSelect;

export const eiEngineerProfiles = mysqlTable("ei_engineer_profiles", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull().references(() => tenants.id),
  userId: int("userId").notNull().references(() => users.id),
  roleTitle: varchar("roleTitle", { length: 180 }),
  discipline: varchar("discipline", { length: 120 }),
  engineeringLevel: varchar("engineeringLevel", { length: 120 }),
  aspiration: varchar("aspiration", { length: 180 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("ei_engineer_profiles_owner_uq").on(table.tenantId, table.userId),
]);
export type EiEngineerProfile = typeof eiEngineerProfiles.$inferSelect;

export const eiAgentRuns = mysqlTable("ei_agent_runs", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").references(() => tenants.id),
  actorUserId: int("actorUserId").references(() => users.id),
  subjectUserId: int("subjectUserId").references(() => users.id),
  agentCode: varchar("agentCode", { length: 100 }).notNull(),
  purposeCode: varchar("purposeCode", { length: 120 }).notNull(),
  triggerType: varchar("triggerType", { length: 80 }).notNull(),
  status: mysqlEnum("status", ["running", "succeeded", "fallback", "failed", "denied"]).default("running").notNull(),
  inputManifest: json("inputManifest").$type<Record<string, unknown>>().notNull(),
  modelId: varchar("modelId", { length: 120 }),
  traceId: varchar("traceId", { length: 100 }).notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("ei_agent_runs_agent_created_idx").on(table.tenantId, table.agentCode, table.createdAt),
]);
export type EiAgentRun = typeof eiAgentRuns.$inferSelect;

export const eiMissions = mysqlTable("ei_missions", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull().references(() => tenants.id),
  userId: int("userId").notNull().references(() => users.id),
  sourceResultId: int("sourceResultId").references(() => eiDiagnosticResults.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  status: mysqlEnum("status", ["recommended", "accepted", "preparing", "ready_to_act", "attempted", "complete", "deferred", "declined"]).default("recommended").notNull(),
  dueAt: timestamp("dueAt"),
  acceptedAt: timestamp("acceptedAt"),
  attemptedAt: timestamp("attemptedAt"),
  completedAt: timestamp("completedAt"),
  partnerVisible: boolean("partnerVisible").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("ei_missions_owner_status_idx").on(table.tenantId, table.userId, table.status),
  index("ei_missions_visible_queue_idx").on(table.tenantId, table.partnerVisible, table.updatedAt),
]);
export type EiMission = typeof eiMissions.$inferSelect;

export const eiPartnerAssignments = mysqlTable("ei_partner_assignments", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull().references(() => tenants.id),
  partnerUserId: int("partnerUserId").notNull().references(() => users.id),
  participantUserId: int("participantUserId").notNull().references(() => users.id),
  status: mysqlEnum("status", ["active", "paused", "ended"]).default("active").notNull(),
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("ei_partner_assignments_pair_status_uq").on(table.tenantId, table.partnerUserId, table.participantUserId, table.status),
  index("ei_partner_assignments_partner_idx").on(table.tenantId, table.partnerUserId, table.status),
]);
export type EiPartnerAssignment = typeof eiPartnerAssignments.$inferSelect;

export const eiPartnerCheckIns = mysqlTable("ei_partner_check_ins", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull().references(() => tenants.id),
  partnerUserId: int("partnerUserId").notNull().references(() => users.id),
  participantUserId: int("participantUserId").notNull().references(() => users.id),
  nudgeId: int("nudgeId"),
  channel: mysqlEnum("channel", ["in_app", "call", "voice_note", "email", "in_person"]).notNull(),
  summaryShared: text("summaryShared").notNull(),
  nextStep: text("nextStep"),
  followUpAt: timestamp("followUpAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("ei_partner_check_ins_partner_idx").on(table.tenantId, table.partnerUserId, table.createdAt),
  index("ei_partner_check_ins_participant_idx").on(table.tenantId, table.participantUserId, table.createdAt),
]);
export type EiPartnerCheckIn = typeof eiPartnerCheckIns.$inferSelect;

export const eiPartnerNudges = mysqlTable("ei_partner_nudges", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull().references(() => tenants.id),
  partnerUserId: int("partnerUserId").notNull().references(() => users.id),
  participantUserId: int("participantUserId").notNull().references(() => users.id),
  missionId: int("missionId").notNull().references(() => eiMissions.id),
  agentRunId: int("agentRunId").references(() => eiAgentRuns.id),
  reasonCode: mysqlEnum("reasonCode", ["mission_due", "mission_stalled", "follow_up_due", "celebration"]).notNull(),
  objective: text("objective").notNull(),
  whyNow: text("whyNow").notNull(),
  suggestedQuestion: text("suggestedQuestion").notNull(),
  recommendedChannel: mysqlEnum("recommendedChannel", ["in_app", "call", "voice_note", "email"]).notNull(),
  effort: mysqlEnum("effort", ["low", "medium", "high"]).notNull(),
  urgency: mysqlEnum("urgency", ["low", "medium", "high", "critical"]).notNull(),
  priorityScore: int("priorityScore").notNull(),
  permittedContextKeys: json("permittedContextKeys").$type<string[]>().notNull(),
  status: mysqlEnum("status", ["pending", "opened", "contacted", "completed", "snoozed", "skipped", "dismissed"]).default("pending").notNull(),
  dedupeKey: varchar("dedupeKey", { length: 180 }).notNull(),
  snoozedUntil: timestamp("snoozedUntil"),
  openedAt: timestamp("openedAt"),
  contactedAt: timestamp("contactedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("ei_partner_nudges_dedupe_uq").on(table.dedupeKey),
  index("ei_partner_nudges_queue_idx").on(table.tenantId, table.partnerUserId, table.status, table.priorityScore),
]);
export type EiPartnerNudge = typeof eiPartnerNudges.$inferSelect;

export const eiPromptVersions = mysqlTable("ei_prompt_versions", {
  id: int("id").autoincrement().primaryKey(),
  agentCode: mysqlEnum("agentCode", ["self_leadership_intelligence", "success_partner_nudges"]).notNull(),
  versionLabel: varchar("versionLabel", { length: 120 }).notNull(),
  modelId: varchar("modelId", { length: 120 }).notNull(),
  promptHash: varchar("promptHash", { length: 100 }).notNull(),
  status: mysqlEnum("status", ["draft", "candidate", "approved", "retired"]).default("draft").notNull(),
  createdByUserId: int("createdByUserId").references(() => users.id),
  approvedByUserId: int("approvedByUserId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("ei_prompt_versions_agent_version_uq").on(table.agentCode, table.versionLabel),
  index("ei_prompt_versions_agent_status_idx").on(table.agentCode, table.status),
  foreignKey({ columns: [table.createdByUserId], foreignColumns: [users.id], name: "ei_prompt_versions_created_by_fk" }),
  foreignKey({ columns: [table.approvedByUserId], foreignColumns: [users.id], name: "ei_prompt_versions_approved_by_fk" }),
]);
export type EiPromptVersion = typeof eiPromptVersions.$inferSelect;

export const eiPromptEvaluationRuns = mysqlTable("ei_prompt_evaluation_runs", {
  id: int("id").autoincrement().primaryKey(),
  promptVersionId: int("promptVersionId").notNull().references(() => eiPromptVersions.id),
  agentCode: mysqlEnum("agentCode", ["self_leadership_intelligence", "success_partner_nudges"]).notNull(),
  caseCode: varchar("caseCode", { length: 120 }).notNull(),
  status: mysqlEnum("status", ["passed", "failed", "blocked"]).notNull(),
  score: int("score").notNull(),
  evidence: json("evidence").$type<Record<string, unknown>>().notNull(),
  failureReasons: json("failureReasons").$type<string[]>().notNull(),
  runByUserId: int("runByUserId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("ei_prompt_eval_runs_version_idx").on(table.promptVersionId, table.createdAt),
  index("ei_prompt_eval_runs_agent_status_idx").on(table.agentCode, table.status, table.createdAt),
  foreignKey({ columns: [table.promptVersionId], foreignColumns: [eiPromptVersions.id], name: "ei_prompt_eval_runs_version_fk" }),
  foreignKey({ columns: [table.runByUserId], foreignColumns: [users.id], name: "ei_prompt_eval_runs_run_by_fk" }),
]);
export type EiPromptEvaluationRun = typeof eiPromptEvaluationRuns.$inferSelect;

// ═══════════════════════════════════════════════════════════════════════════════
// NARRATIVE INTELLIGENCE™ — Shared Development Intelligence Schema
// ═══════════════════════════════════════════════════════════════════════════════

export const niOperatingProfiles = mysqlTable(
  "ni_operating_profiles",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id),
    tenantId: int("tenantId").references(() => tenants.id),
    currentRole: varchar("currentRole", { length: 180 }),
    currentRoleTransition: varchar("currentRoleTransition", { length: 180 }),
    fromIdentity: varchar("fromIdentity", { length: 180 }),
    toIdentity: varchar("toIdentity", { length: 180 }),
    emergingAssumption: text("emergingAssumption"),
    commitments: json("commitments").$type<string[]>(),
    futureSelfNarrative: text("futureSelfNarrative"),
    status: mysqlEnum("status", ["onboarding", "active", "completed", "refreshed"]).default("active").notNull(),
    currentWeek: int("currentWeek").default(1).notNull(),
    completedWeeks: json("completedWeeks").$type<number[]>(),
    activeNarrativeCount: int("activeNarrativeCount").default(0).notNull(),
    experimentCount: int("experimentCount").default(0).notNull(),
    evidenceCount: int("evidenceCount").default(0).notNull(),
    lastActivityAt: timestamp("lastActivityAt").defaultNow().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    uniqueIndex("ni_profiles_user_uq").on(table.userId),
    index("ni_profiles_tenant_user_idx").on(table.tenantId, table.userId),
  ]
);
export type NiOperatingProfile = typeof niOperatingProfiles.$inferSelect;
export type InsertNiOperatingProfile = typeof niOperatingProfiles.$inferInsert;

export const niNarratives = mysqlTable(
  "ni_narratives",
  {
    id: int("id").autoincrement().primaryKey(),
    profileId: int("profileId").notNull().references(() => niOperatingProfiles.id),
    userId: int("userId").notNull().references(() => users.id),
    tenantId: int("tenantId").references(() => tenants.id),
    category: mysqlEnum("category", ["self", "relational", "work_world", "future"]).notNull(),
    statement: text("statement").notNull(),
    status: mysqlEnum("status", ["keep", "expand", "test", "retire", "create"]).default("test").notNull(),
    sourceModule: varchar("sourceModule", { length: 50 }).default("mep").notNull(),
    participantResonance: mysqlEnum("participantResonance", [
      "strongly_resonates",
      "partly_resonates",
      "does_not_resonate",
      "explore",
      "edit",
      "dismiss",
    ]).default("explore").notNull(),
    participantReflection: text("participantReflection"),
    historicalStrength: text("historicalStrength"),
    currentCost: text("currentCost"),
    emergingAssumption: text("emergingAssumption"),
    convictionScore: int("convictionScore"),
    isHighPriority: boolean("isHighPriority").default(false).notNull(),
    factDescription: text("factDescription"),
    storyInterpretation: text("storyInterpretation"),
    predictionMade: text("predictionMade"),
    evidenceFor: json("evidenceFor").$type<string[]>(),
    evidenceAgainst: json("evidenceAgainst").$type<string[]>(),
    exceptionHunt: text("exceptionHunt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("ni_narratives_profile_idx").on(table.profileId, table.status),
    index("ni_narratives_user_idx").on(table.userId, table.status),
  ]
);
export type NiNarrative = typeof niNarratives.$inferSelect;
export type InsertNiNarrative = typeof niNarratives.$inferInsert;

export const niExperiments = mysqlTable(
  "ni_experiments",
  {
    id: int("id").autoincrement().primaryKey(),
    profileId: int("profileId").notNull().references(() => niOperatingProfiles.id),
    narrativeId: int("narrativeId").notNull().references(() => niNarratives.id),
    userId: int("userId").notNull().references(() => users.id),
    tenantId: int("tenantId").references(() => tenants.id),
    title: varchar("title", { length: 255 }).notNull(),
    contextSituation: text("contextSituation").notNull(),
    oldAssumption: text("oldAssumption").notNull(),
    alternativeHypothesis: text("alternativeHypothesis").notNull(),
    behaviourToTest: text("behaviourToTest").notNull(),
    predictedOutcome: text("predictedOutcome").notNull(),
    predictedProbability: int("predictedProbability").default(70).notNull(),
    experimentType: mysqlEnum("experimentType", ["real_world", "simulator", "practice"]).default("real_world").notNull(),
    status: mysqlEnum("status", ["planned", "in_progress", "completed", "cancelled"]).default("planned").notNull(),
    targetDate: timestamp("targetDate"),
    actualOutcome: text("actualOutcome"),
    whatRealityTaught: text("whatRealityTaught"),
    narrativeImpact: mysqlEnum("narrativeImpact", [
      "strongly_challenged",
      "partly_challenged",
      "confirmed_old",
      "inconclusive",
    ]),
    convictionShiftOld: int("convictionShiftOld"),
    convictionShiftEmerging: int("convictionShiftEmerging"),
    completedAt: timestamp("completedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("ni_experiments_user_status_idx").on(table.userId, table.status),
    index("ni_experiments_narrative_idx").on(table.narrativeId),
  ]
);
export type NiExperiment = typeof niExperiments.$inferSelect;
export type InsertNiExperiment = typeof niExperiments.$inferInsert;

export const niEvidence = mysqlTable(
  "ni_evidence",
  {
    id: int("id").autoincrement().primaryKey(),
    profileId: int("profileId").notNull().references(() => niOperatingProfiles.id),
    narrativeId: int("narrativeId").references(() => niNarratives.id),
    experimentId: int("experimentId").references(() => niExperiments.id),
    userId: int("userId").notNull().references(() => users.id),
    tenantId: int("tenantId").references(() => tenants.id),
    sourceType: mysqlEnum("sourceType", [
      "self_report",
      "simulator_behaviour",
      "practice_attempt",
      "real_world_outcome",
      "stakeholder_feedback",
    ]).notNull(),
    sourceReferenceId: int("sourceReferenceId"),
    situation: text("situation").notNull(),
    trigger: varchar("trigger", { length: 255 }),
    oldPrediction: text("oldPrediction"),
    actionTaken: text("actionTaken").notNull(),
    outcome: text("outcome").notNull(),
    learning: text("learning").notNull(),
    identityImplication: text("identityImplication"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    index("ni_evidence_profile_idx").on(table.profileId, table.sourceType),
    index("ni_evidence_user_idx").on(table.userId, table.createdAt),
  ]
);
export type NiEvidence = typeof niEvidence.$inferSelect;
export type InsertNiEvidence = typeof niEvidence.$inferInsert;

export const niResetLogs = mysqlTable(
  "ni_reset_logs",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id),
    tenantId: int("tenantId").references(() => tenants.id),
    triggerSituation: text("triggerSituation").notNull(),
    noticeStory: text("noticeStory").notNull(),
    separateFacts: text("separateFacts").notNull(),
    alternativeView: text("alternativeView").notNull(),
    chosenAssumption: text("chosenAssumption").notNull(),
    immediateAction: text("immediateAction").notNull(),
    savedAsEvidence: boolean("savedAsEvidence").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    index("ni_reset_user_idx").on(table.userId, table.createdAt),
  ]
);
export type NiResetLog = typeof niResetLogs.$inferSelect;
export type InsertNiResetLog = typeof niResetLogs.$inferInsert;

export const niSharingGrants = mysqlTable(
  "ni_sharing_grants",
  {
    id: int("id").autoincrement().primaryKey(),
    profileId: int("profileId").notNull().references(() => niOperatingProfiles.id),
    userId: int("userId").notNull().references(() => users.id),
    tenantId: int("tenantId").references(() => tenants.id),
    recipientRole: mysqlEnum("recipientRole", ["success_partner", "coach", "manager"]).notNull(),
    recipientUserId: int("recipientUserId").references(() => users.id),
    shareNextChapter: boolean("shareNextChapter").default(true).notNull(),
    shareBehaviours: boolean("shareBehaviours").default(true).notNull(),
    shareExperimentCount: boolean("shareExperimentCount").default(true).notNull(),
    shareEvidenceSummary: boolean("shareEvidenceSummary").default(true).notNull(),
    shareSupportRequest: text("shareSupportRequest"),
    status: mysqlEnum("status", ["active", "revoked"]).default("active").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("ni_sharing_user_idx").on(table.userId, table.status),
    index("ni_sharing_recipient_idx").on(table.recipientUserId, table.status),
  ]
);
export type NiSharingGrant = typeof niSharingGrants.$inferSelect;
export type InsertNiSharingGrant = typeof niSharingGrants.$inferInsert;
