import { describe, expect, it } from "vitest";
import { getTenantScopedAdminHref } from "./adminTenantSelection";

describe("getTenantScopedAdminHref", () => {
  it("propagates active organisation context to administrator destinations", () => {
    expect(getTenantScopedAdminHref("/admin/enrollments", 12)).toBe("/admin/enrollments?tenant=12");
    expect(getTenantScopedAdminHref("/admin/invites?status=pending", 12)).toBe("/admin/invites?status=pending&tenant=12");
  });

  it("leaves destinations unchanged for all-organisations scope", () => {
    expect(getTenantScopedAdminHref("/admin", null)).toBe("/admin");
  });
});
