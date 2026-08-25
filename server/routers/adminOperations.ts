import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, inArray, like, or } from "drizzle-orm";
import { z } from "zod";
import { products, tenantUsers, tenants, userProductEnrollments, users } from "../../drizzle/schema";
import { getDb } from "../db";
import { adminProcedure, router } from "../_core/trpc";

export function normaliseParticipantSearchQuery(query: string) {
  return query.trim().replace(/[%_]/g, "").slice(0, 100);
}

async function assertTenantExists(tenantId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  const [tenant] = await db.select({ id: tenants.id }).from(tenants).where(eq(tenants.id, tenantId)).limit(1);
  if (!tenant) throw new TRPCError({ code: "NOT_FOUND", message: "Organisation not found" });
  return db;
}

export const adminOperationsRouter = router({
  listOrganisations: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const organisations = await db.select().from(tenants).orderBy(tenants.name);
    const rows = await Promise.all(organisations.map(async (tenant) => {
      const [memberRow] = await db.select({ total: count() }).from(tenantUsers).where(eq(tenantUsers.tenantId, tenant.id));
      return { id: tenant.id, name: tenant.name, industry: tenant.industry, memberCount: memberRow?.total ?? 0 };
    }));
    return rows;
  }),

  getQuickMetrics: adminProcedure
    .input(z.object({ tenantId: z.number().int().positive().nullable().optional() }).optional())
    .query(async ({ input }) => {
      const selectedTenantId = input?.tenantId ?? null;
      const db = selectedTenantId ? await assertTenantExists(selectedTenantId) : await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [[organisationRow], [participantRow], [enrollmentRow]] = await Promise.all([
        db.select({ total: count() }).from(tenants),
        selectedTenantId
          ? db.select({ total: count() }).from(tenantUsers).where(eq(tenantUsers.tenantId, selectedTenantId))
          : db.select({ total: count() }).from(users),
        selectedTenantId
          ? db.select({ total: count() }).from(userProductEnrollments).innerJoin(tenantUsers, eq(userProductEnrollments.userId, tenantUsers.userId)).where(and(eq(tenantUsers.tenantId, selectedTenantId), eq(userProductEnrollments.isActive, true)))
          : db.select({ total: count() }).from(userProductEnrollments).where(eq(userProductEnrollments.isActive, true)),
      ]);
      return {
        organisationCount: organisationRow?.total ?? 0,
        participantCount: participantRow?.total ?? 0,
        activeEnrollmentCount: enrollmentRow?.total ?? 0,
        scope: selectedTenantId ? "organisation" : "all_organisations",
      };
    }),

  searchParticipants: adminProcedure
    .input(z.object({ query: z.string().max(120).default(""), tenantId: z.number().int().positive().nullable().optional(), limit: z.number().int().min(1).max(50).default(25) }))
    .query(async ({ input }) => {
      const db = input.tenantId ? await assertTenantExists(input.tenantId) : await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const search = normaliseParticipantSearchQuery(input.query);
      const queryFilter = search
        ? or(like(users.name, `%${search}%`), like(users.email, `%${search}%`))
        : undefined;
      const filters = [queryFilter];
      if (input.tenantId) filters.push(eq(tenantUsers.tenantId, input.tenantId));
      const participantRows = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          lastSignedIn: users.lastSignedIn,
          tenantId: tenants.id,
          organisation: tenants.name,
          membershipRole: tenantUsers.role,
        })
        .from(users)
        .leftJoin(tenantUsers, eq(users.id, tenantUsers.userId))
        .leftJoin(tenants, eq(tenantUsers.tenantId, tenants.id))
        .where(and(...filters.filter(Boolean) as any))
        .orderBy(desc(users.lastSignedIn))
        .limit(input.limit);
      const ids = participantRows.map((row) => row.id);
      const enrollmentRows = ids.length
        ? await db.select({ userId: userProductEnrollments.userId, productId: products.id, productName: products.name }).from(userProductEnrollments).innerJoin(products, eq(userProductEnrollments.productId, products.id)).where(and(inArray(userProductEnrollments.userId, ids), eq(userProductEnrollments.isActive, true)))
        : [];
      const enrolmentsByUser = new Map<number, Array<{ id: string; name: string }>>();
      enrollmentRows.forEach((row) => {
        const list = enrolmentsByUser.get(row.userId) ?? [];
        list.push({ id: row.productId, name: row.productName });
        enrolmentsByUser.set(row.userId, list);
      });
      return participantRows.map((row) => ({ ...row, enrolments: enrolmentsByUser.get(row.id) ?? [] }));
    }),
});
