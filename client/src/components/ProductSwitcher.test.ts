import { describe, expect, it } from "vitest";
import { PRODUCT_CONFIG } from "./ProductSwitcher";

describe("ProductSwitcher platform catalogue", () => {
  it("lists Professional Effectiveness as the fifth platform and routes to its home", () => {
    expect(Object.keys(PRODUCT_CONFIG)).toEqual([
      "leadership_intelligence",
      "career_intelligence",
      "manager_effectiveness",
      "launch_intelligence",
      "professional_effectiveness",
    ]);

    expect(PRODUCT_CONFIG.professional_effectiveness).toMatchObject({
      label: "Professional Effectiveness",
      shortLabel: "Professional",
      description: "Elevate your professional impact",
      homeRoute: "/pe",
    });
  });
});
