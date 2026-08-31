import { beforeEach, describe, expect, it, vi } from "vitest";

const getDb = vi.fn();
vi.mock("../db", () => ({ getDb }));

function makeDb() {
  const values = vi.fn(async () => undefined);
  return {
    insert: vi.fn(() => ({ values })),
    values,
  };
}

describe("leads.captureDemoLead", () => {
  beforeEach(() => vi.resetAllMocks());

  it("requires affirmative contact consent before accepting a public demo enquiry", async () => {
    const db = makeDb();
    getDb.mockResolvedValue(db);
    const { leadsRouter } = await import("./leads");

    await expect(leadsRouter.createCaller({} as any).captureDemoLead({
      name: "Asha Rao",
      email: "asha@example.com",
      company: "Example Engineering",
      consent: false,
    } as any)).rejects.toMatchObject({ code: "BAD_REQUEST" });

    expect(db.insert).not.toHaveBeenCalled();
  });

  it("stores a consented demo lead with a dedicated source and consent record", async () => {
    const db = makeDb();
    getDb.mockResolvedValue(db);
    const { leadsRouter } = await import("./leads");

    await expect(leadsRouter.createCaller({} as any).captureDemoLead({
      name: "  Asha Rao  ",
      email: "ASHA@EXAMPLE.COM",
      company: "  Example Engineering  ",
      jobTitle: "VP Engineering",
      enquiry: "I would like to understand a leadership pilot.",
      consent: true,
    })).resolves.toEqual({ success: true });

    expect(db.values).toHaveBeenCalledWith(expect.objectContaining({
      name: "Asha Rao",
      email: "asha@example.com",
      company: "Example Engineering",
      source: "engineering_demo",
      moduleCode: "ei_demo",
      demoDedupeKey: "engineering_demo:asha@example.com",
      consentTextVersion: "demo_contact_v1",
      consentAt: expect.any(Date),
    }));
  });

  it("treats a duplicate email as a successful repeat request without exposing contact data", async () => {
    const db = makeDb();
    db.values.mockRejectedValueOnce(new Error("Duplicate entry"));
    getDb.mockResolvedValue(db);
    const { leadsRouter } = await import("./leads");

    await expect(leadsRouter.createCaller({} as any).captureDemoLead({
      name: "Asha Rao",
      email: "asha@example.com",
      company: "Example Engineering",
      consent: true,
    })).resolves.toEqual({ success: true, duplicate: true });
  });
});
