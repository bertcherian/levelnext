import { describe, expect, it } from "vitest";
import {
  careerStages,
  defaultStageIndex,
  getCareerStage,
  getPersonalisationAnswer,
  intelligenceCore,
  intelligenceLoop,
  personalisationLevels,
  personalisationAnswers,
} from "./landingData";

describe("LevelNext landing page content model", () => {
  it("presents the professional journey in the intended progression", () => {
    expect(careerStages.map((stage) => stage.name)).toEqual([
      "Launch",
      "Professional",
      "Manager",
      "Leader",
    ]);
    expect(careerStages.every((stage) => stage.href.startsWith("/"))).toBe(true);
    expect(getCareerStage(defaultStageIndex).name).toBe("Professional");
    expect(getCareerStage(-1).name).toBe("Professional");
    expect(careerStages.map((stage) => stage.audience)).toEqual([
      "Freshers & Early Career",
      "Individual contributors",
      "Managers & People Leaders",
      "Strategic & Business Leaders",
    ]);
    expect(careerStages.map((stage) => stage.href)).toEqual([
      "/launch/home",
      "/pe/assessment",
      "/manager/diagnostics",
      "/diagnostics/lii",
    ]);
    expect(careerStages.map((stage) => stage.pipelineMicrocopy)).toEqual([
      expect.stringMatching(/first 90 days/i),
      expect.stringMatching(/everyday work/i),
      expect.stringMatching(/team performance/i),
      expect.stringMatching(/organisational complexity/i),
    ]);
    expect(careerStages.every((stage) => stage.ctaLabel.startsWith("Start your"))).toBe(true);
  });

  it("uses a closed intelligence loop from diagnosis through adaptation", () => {
    expect(intelligenceLoop).toEqual([
      "Diagnose",
      "Understand",
      "Recommend",
      "Practice",
      "Act",
      "Measure",
      "Adapt",
    ]);
    expect(intelligenceCore).toContain("AI coaching");
    expect(intelligenceCore).toContain("Outcomes");
  });

  it("changes the recommended question for the same project challenge at each level", () => {
    const responses = Object.keys(personalisationAnswers).map((level) =>
      getPersonalisationAnswer(level as keyof typeof personalisationAnswers),
    );

    expect(new Set(responses).size).toBe(3);
    expect(personalisationLevels).toEqual(["Professional", "Manager", "Leader"]);
    expect(getPersonalisationAnswer("Professional")).toMatch(/take ownership/i);
    expect(getPersonalisationAnswer("Manager")).toMatch(/team/i);
    expect(getPersonalisationAnswer("Leader")).toMatch(/systemic/i);
  });
});
