import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import Landing from "./Landing";
import EngineeringDemo from "./EngineeringDemo";

vi.mock("@/lib/trpc", () => ({
  trpc: {
    leads: {
      captureDemoLead: {
        useMutation: () => ({ mutateAsync: vi.fn(), isPending: false, error: null }),
      },
    },
  },
}));

describe("LevelNext public demo pathway", () => {
  it("keeps the LevelNext logo visible and provides a public demo link", () => {
    const page = renderToStaticMarkup(createElement(Landing));
    expect(page).toContain('src="/logo.png"');
    expect(page).toContain('href="/demo"');
    expect(page).toContain("View the demo");
    expect(page).toContain("What would a LevelNext pilot");
    expect(page).toContain("Case studies &amp; outcomes");
  });

  it("renders a product walkthrough without creating or displaying personal participant data", () => {
    const page = renderToStaticMarkup(createElement(EngineeringDemo));
    expect(page).toContain("Interactive product walkthrough");
    expect(page).toContain("Engineering Impact Diagnostic");
    expect(page).toContain("Operating Profile");
    expect(page).toContain("Partner support");
    expect(page).toContain("It contains no personal data");
    expect(page).toContain('href="/engineering/diagnostic"');
    expect(page).toContain("Narrated walkthrough");
    expect(page).toContain("Request a conversation");
    expect(page).toContain("Submitting this form does not create a LevelNext participant account.");
    expect(page).toContain("I agree that Meta Results may contact me about this LevelNext demo or pilot.");
  });
});
