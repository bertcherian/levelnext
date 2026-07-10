import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { organisations, orgDocuments, orgInvitations, tenants, tenantUsers } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { storagePut } from "../storage";
import type {
  OrgValue,
  OrgCompetency,
  OrgStrategicPriority,
  OrgBranding,
  OrgApplicationSettings,
} from "../../drizzle/schema";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

// ─── AI: Extract company context from URL / text ──────────────────────────────
async function extractCompanyContext(input: string, inputType: "url" | "text"): Promise<{
  missionStatement?: string;
  visionStatement?: string;
  purposeStatement?: string;
  description?: string;
  values: OrgValue[];
  competencies: OrgCompetency[];
  strategicPriorities: OrgStrategicPriority[];
  industry?: string;
  sourceType: "url_extracted" | "doc_extracted";
}> {
  const contextNote = inputType === "url"
    ? `This text was fetched from the company's public website (${input.slice(0, 200)}).`
    : "This text was extracted from an uploaded company document.";

  const prompt = `You are an expert leadership development consultant and organisational analyst.
${contextNote}

Analyse the following content and extract structured company context for a leadership development platform.

Return a JSON object with exactly this structure:
{
  "missionStatement": "extracted mission statement or null",
  "visionStatement": "extracted vision statement or null",
  "purposeStatement": "extracted purpose or why statement or null",
  "description": "2-3 sentence company description based on what you found or null",
  "industry": "inferred industry sector or null",
  "values": [
    {
      "id": "snake_case_id",
      "name": "Value Name",
      "shortDefinition": "one sentence definition",
      "fullDescription": "2-3 sentence description of what this value means in practice",
      "positiveBehaviours": ["behaviour 1", "behaviour 2", "behaviour 3"],
      "negativeBehaviours": ["behaviour 1", "behaviour 2"],
      "approvalStatus": "pending",
      "sourceType": "${inputType === "url" ? "url_extracted" : "doc_extracted"}"
    }
  ],
  "competencies": [
    {
      "id": "snake_case_id",
      "name": "Competency Name",
      "category": "leading_self | leading_others | leading_teams | leading_business | leading_transformation | custom",
      "shortDefinition": "one sentence definition",
      "fullDefinition": "2-3 sentence full definition",
      "positiveBehaviours": ["behaviour 1", "behaviour 2"],
      "riskBehaviours": ["risk behaviour 1"],
      "approvalStatus": "pending",
      "sourceType": "${inputType === "url" ? "url_extracted" : "doc_extracted"}"
    }
  ],
  "strategicPriorities": [
    {
      "id": "snake_case_id",
      "title": "Priority Title",
      "description": "description of this strategic priority",
      "rank": "critical | high | medium | emerging",
      "requiredCapabilities": ["capability 1", "capability 2"],
      "approvalStatus": "pending",
      "sourceType": "ai_extracted"
    }
  ]
}

Rules:
- Only extract what is genuinely present in the content. Do not invent.
- If mission/vision/purpose is not found, return null for those fields.
- Extract 2-6 values if present, otherwise return empty array.
- Extract 2-6 leadership competencies or principles if present, otherwise return empty array.
- Extract 1-4 strategic priorities if clearly stated, otherwise return empty array.
- All extracted items must have approvalStatus: "pending" — nothing is auto-approved.
- Keep language close to the company's own wording.

Content to analyse:
${input.slice(0, 12000)}`;

  const result = await invokeLLM({
    
    messages: [{ role: "user", content: prompt }],
    responseFormat: { type: "json_object" },
    
  });

  try {
    const parsed = JSON.parse(result.choices[0].message.content as string);
    return {
      ...parsed,
      sourceType: inputType === "url" ? "url_extracted" : "doc_extracted",
    };
  } catch {
    return {
      values: [],
      competencies: [],
      strategicPriorities: [],
      sourceType: inputType === "url" ? "url_extracted" : "doc_extracted",
    };
  }
}

// ─── AI: Extract from uploaded document text ──────────────────────────────────
async function extractFromDocument(text: string, category: string): Promise<{
  values: OrgValue[];
  competencies: OrgCompetency[];
  strategicPriorities: OrgStrategicPriority[];
  summary: string;
}> {
  const prompt = `You are an expert leadership development consultant analysing a company document.
Document category: ${category}

Extract structured leadership context from this document. Return JSON:
{
  "summary": "2-3 sentence summary of what this document contains",
  "values": [...same structure as before, empty array if none found],
  "competencies": [...same structure as before, empty array if none found],
  "strategicPriorities": [...same structure as before, empty array if none found]
}

All extracted items must have approvalStatus: "pending" and sourceType: "doc_extracted".
Only extract what is genuinely present. Do not invent.

Document text:
${text.slice(0, 10000)}`;

  const result = await invokeLLM({
    
    messages: [{ role: "user", content: prompt }],
    responseFormat: { type: "json_object" },
    
  });

  try {
    return JSON.parse(result.choices[0].message.content as string);
  } catch {
    return { values: [], competencies: [], strategicPriorities: [], summary: "" };
  }
}

// ─── Router ───────────────────────────────────────────────────────────────────
export const enterpriseOnboardingRouter = router({

  // Get the user's organisation (if any)
  getMyOrganisation: protectedProcedure.query(async ({ ctx }) => {
    const db = (await getDb())!;
    // Find tenant where user is owner/admin
    const membership = await db
      .select()
      .from(tenantUsers)
      .where(and(eq(tenantUsers.userId, ctx.user.id)))
      .limit(1);

    if (!membership.length) return null;

    const org = await db
      .select()
      .from(organisations)
      .where(eq(organisations.tenantId, membership[0].tenantId))
      .limit(1);

    if (!org.length) return null;
    return org[0];
  }),

  // Create or resume organisation wizard
  createOrganisation: protectedProcedure
    .input(z.object({
      legalName: z.string().min(1),
      setupRoute: z.enum(["upload", "build", "standard"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;

      // Find or create tenant
      let tenantId: number;
      const existingMembership = await db
        .select()
        .from(tenantUsers)
        .where(eq(tenantUsers.userId, ctx.user.id))
        .limit(1);

      if (existingMembership.length) {
        tenantId = existingMembership[0].tenantId;
      } else {
        const slug = input.legalName.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 50) + "-" + generateId();
        const inviteCode = generateId() + generateId();
        const [newTenant] = await db.insert(tenants).values({
          name: input.legalName,
          slug,
          inviteCode,
        });
        tenantId = (newTenant as any).insertId;
        await db.insert(tenantUsers).values({
          tenantId,
          userId: ctx.user.id,
          role: "owner",
        });
      }

      // Check if org already exists
      const existing = await db
        .select()
        .from(organisations)
        .where(eq(organisations.tenantId, tenantId))
        .limit(1);

      if (existing.length) return existing[0];

      // Create new org
      const [result] = await db.insert(organisations).values({
        tenantId,
        legalName: input.legalName,
        displayName: input.legalName,
        setupRoute: input.setupRoute,
        wizardStep: 1,
        wizardStatus: "in_progress",
        createdBy: ctx.user.id,
        values: [],
        competencies: [],
        strategicPriorities: [],
        applicationSettings: {
          useInDiagnostics: true,
          useInAICoaching: true,
          useInSimulations: true,
          useInReports: true,
          useInDashboards: true,
          managerCanSeeGoals: true,
          managerCanSeeProgress: true,
          hrCanSeeAggregates: true,
        },
      });

      const orgId = (result as any).insertId;
      const [org] = await db.select().from(organisations).where(eq(organisations.id, orgId));
      return org;
    }),

  // Save wizard progress (called on every step)
  saveWizardStep: protectedProcedure
    .input(z.object({
      organisationId: z.number(),
      wizardStep: z.number(),
      data: z.object({
        legalName: z.string().optional(),
        displayName: z.string().optional(),
        website: z.string().optional(),
        logoUrl: z.string().optional(),
        industry: z.string().optional(),
        subIndustry: z.string().optional(),
        companySize: z.string().optional(),
        employeeCount: z.string().optional(),
        hq: z.string().optional(),
        countries: z.array(z.string()).optional(),
        primaryLanguage: z.string().optional(),
        description: z.string().optional(),
        isGcc: z.boolean().optional(),
        missionStatement: z.string().optional(),
        visionStatement: z.string().optional(),
        purposeStatement: z.string().optional(),
        missionSourceType: z.string().optional(),
        values: z.array(z.any()).optional(),
        competencies: z.array(z.any()).optional(),
        strategicPriorities: z.array(z.any()).optional(),
        branding: z.any().optional(),
        applicationSettings: z.any().optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      await db
        .update(organisations)
        .set({ ...input.data, wizardStep: input.wizardStep, updatedAt: new Date() })
        .where(and(eq(organisations.id, input.organisationId), eq(organisations.createdBy, ctx.user.id)));
      return { success: true };
    }),

  // Fetch company context from URL
  fetchFromUrl: protectedProcedure
    .input(z.object({
      url: z.string().url(),
      organisationId: z.number(),
    }))
    .mutation(async ({ input }) => {
      // Fetch the URL content
      let pageText = "";
      try {
        const response = await fetch(input.url, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; LevelNext/1.0)" },
          signal: AbortSignal.timeout(10000),
        });
        const html = await response.text();
        // Strip HTML tags for text extraction
        pageText = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
      } catch {
        return { success: false, error: "Could not fetch the URL. Please check the address and try again." };
      }

      if (!pageText || pageText.length < 100) {
        return { success: false, error: "The page did not return enough content to analyse." };
      }

      const extracted = await extractCompanyContext(pageText, "url");
      return { success: true, extracted };
    }),

  // Upload and extract from document (base64)
  uploadDocument: protectedProcedure
    .input(z.object({
      organisationId: z.number(),
      fileBase64: z.string(),
      fileName: z.string(),
      mimeType: z.string(),
      category: z.string(),
      title: z.string(),
      confidentiality: z.enum(["general", "internal", "confidential", "restricted", "executive"]).default("internal"),
      useInAICoaching: z.boolean().default(true),
      useInDiagnostics: z.boolean().default(true),
      useInReports: z.boolean().default(true),
      useInSimulations: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;

      // Upload file to S3
      const fileBuffer = Buffer.from(input.fileBase64, "base64");
      const fileKey = `org-docs/${input.organisationId}/${Date.now()}-${input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { url } = await storagePut(fileKey, fileBuffer, input.mimeType);

      // Insert document record
      const [result] = await db.insert(orgDocuments).values({
        organisationId: input.organisationId,
        title: input.title,
        category: input.category,
        fileUrl: url,
        fileKey,
        fileName: input.fileName,
        fileSize: fileBuffer.length,
        mimeType: input.mimeType,
        confidentiality: input.confidentiality,
        processingStatus: "processing",
        useInAICoaching: input.useInAICoaching,
        useInDiagnostics: input.useInDiagnostics,
        useInReports: input.useInReports,
        useInSimulations: input.useInSimulations,
        uploadedBy: ctx.user.id,
      });
      const docId = (result as any).insertId;

      // Extract text from PDF/DOCX (base64 → text via simple extraction)
      let extractedText = "";
      if (input.mimeType === "application/pdf" || input.fileName.endsWith(".pdf")) {
        // For PDFs we use the base64 content as text extraction source
        // In production this would use pdf-parse; for now extract readable text
        extractedText = Buffer.from(input.fileBase64, "base64").toString("utf-8").replace(/[^\x20-\x7E\n]/g, " ").trim();
      } else {
        extractedText = Buffer.from(input.fileBase64, "base64").toString("utf-8");
      }

      // Run AI extraction
      const extracted = await extractFromDocument(extractedText, input.category);

      // Update document with extracted content
      await db
        .update(orgDocuments)
        .set({
          processingStatus: "needs_review",
          extractedContent: extracted,
          updatedAt: new Date(),
        })
        .where(eq(orgDocuments.id, docId));

      const [doc] = await db.select().from(orgDocuments).where(eq(orgDocuments.id, docId));
      return { success: true, document: doc, extracted };
    }),

  // Get documents for an organisation
  getDocuments: protectedProcedure
    .input(z.object({ organisationId: z.number() }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      return db
        .select()
        .from(orgDocuments)
        .where(eq(orgDocuments.organisationId, input.organisationId));
    }),

  // Approve/reject a document
  updateDocumentStatus: protectedProcedure
    .input(z.object({
      documentId: z.number(),
      status: z.enum(["approved", "rejected", "needs_review"]),
    }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      await db
        .update(orgDocuments)
        .set({ processingStatus: input.status, updatedAt: new Date() })
        .where(eq(orgDocuments.id, input.documentId));
      return { success: true };
    }),

  // Invite team members
  inviteMembers: protectedProcedure
    .input(z.object({
      organisationId: z.number(),
      invitations: z.array(z.object({
        email: z.string().email(),
        role: z.enum(["owner", "admin", "member"]).default("member"),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const rows = input.invitations.map((inv) => ({
        organisationId: input.organisationId,
        email: inv.email,
        role: inv.role,
        invitedBy: ctx.user.id,
        status: "pending" as const,
      }));
      if (rows.length > 0) {
        await db.insert(orgInvitations).values(rows);
      }
      return { success: true, count: rows.length };
    }),

  // Get invitations
  getInvitations: protectedProcedure
    .input(z.object({ organisationId: z.number() }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      return db
        .select()
        .from(orgInvitations)
        .where(eq(orgInvitations.organisationId, input.organisationId));
    }),

  // Activate company context
  activateContext: protectedProcedure
    .input(z.object({ organisationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      await db
        .update(organisations)
        .set({
          contextActivated: true,
          wizardStatus: "activated",
          activatedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(and(eq(organisations.id, input.organisationId), eq(organisations.createdBy, ctx.user.id)));
      return { success: true };
    }),
});
