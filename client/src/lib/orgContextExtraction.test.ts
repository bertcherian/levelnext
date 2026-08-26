import { describe, expect, it } from "vitest";
import { mergeWebsiteExtraction, normaliseWebsiteUrl, populatedExtractionFieldCount } from "./orgContextExtraction";

describe("Organisation Context website extraction form mapping", () => {
  it("populates blank form fields from a successful extraction", () => {
    expect(mergeWebsiteExtraction(
      { companyName: "", mission: "", vision: "", northStar: "", strategicGoals: [""], values: [""] },
      { companyName: "Park Controls", mission: "Engineer safer systems", strategicGoals: ["Grow service delivery"], values: ["Safety"] },
    )).toMatchObject({ companyName: "Park Controls", mission: "Engineer safer systems", strategicGoals: ["Grow service delivery"], values: ["Safety"] });
  });

  it("keeps an administrator's in-progress content when extraction does not provide a replacement", () => {
    const current = { companyName: "Park Controls", mission: "Existing mission", vision: "", northStar: "", strategicGoals: ["Existing goal"], values: ["Trust"] };
    expect(mergeWebsiteExtraction(current, { vision: "A safer future", values: ["Safety"] })).toEqual({ ...current, vision: "A safer future" });
  });

  it("reports no populated fields for malformed or empty extraction output", () => {
    expect(populatedExtractionFieldCount({})).toBe(0);
  });

  it("normalises a scheme-less company domain before the extraction request", () => {
    expect(normaliseWebsiteUrl("www.parkcontrols.com")).toBe("https://www.parkcontrols.com/");
    expect(normaliseWebsiteUrl("not a website")).toBeUndefined();
  });
});
