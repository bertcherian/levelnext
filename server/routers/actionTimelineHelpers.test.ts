import { describe, expect, it } from "vitest";
import { isOpenTimelineAction, sortActionTimeline } from "./actionTimelineHelpers";

const day = (dayOfMonth: number) => new Date(`2026-08-${String(dayOfMonth).padStart(2, "0")}T09:00:00.000Z`);

describe("action timeline helpers", () => {
  it("puts open actions before completed history and orders open items by the next relevant date", () => {
    const actions = sortActionTimeline([
      { id: "completed", status: "complete", dueDate: null, completedAt: day(9), createdAt: day(1) },
      { id: "later", status: "pending", dueDate: day(18), completedAt: null, createdAt: day(2) },
      { id: "next", status: "in_progress", dueDate: day(12), completedAt: null, createdAt: day(3) },
    ]);

    expect(actions.map((action) => action.id)).toEqual(["next", "later", "completed"]);
  });

  it("recognises the actionable mission and commitment states", () => {
    expect(isOpenTimelineAction({ status: "pending", dueDate: null, completedAt: null, createdAt: day(1) })).toBe(true);
    expect(isOpenTimelineAction({ status: "postponed", dueDate: null, completedAt: null, createdAt: day(1) })).toBe(true);
    expect(isOpenTimelineAction({ status: "done_well", dueDate: null, completedAt: null, createdAt: day(1) })).toBe(false);
  });
});
