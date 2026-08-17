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
      "Early Career Intelligence",
      "Professional Intelligence",
      "Manager Effectiveness",
      "Leader Intelligence",
      "Executive Intelligence",
    ]);
    expect(careerStages.every((stage) => stage.href.startsWith("/"))).toBe(true);
    expect(getCareerStage(defaultStageIndex).name).toBe("Professional Intelligence");
    expect(getCareerStage(-1).name).toBe("Professional Intelligence");
    expect(careerStages.map((stage) => stage.audience)).toEqual([
      "Early Career Professionals",
      "Individual contributors",
      "Managers & People Leaders",
      "Strategic & Business Leaders",
      "Executives & Senior Enterprise Leaders",
    ]);
    expect(careerStages.map((stage) => stage.href)).toEqual([
      "/early-career",
      "/pe/assessment",
      "/manager/diagnostics",
      "/home",
      "/executive",
    ]);
    expect(careerStages.map((stage) => stage.pipelineMicrocopy)).toEqual([
      expect.stringMatching(/role readiness/i),
      expect.stringMatching(/execution/i),
      expect.stringMatching(/accountability/i),
      expect.stringMatching(/strategic alignment/i),
      expect.stringMatching(/mandate clarity/i),
    ]);
    expect(careerStages.map((stage) => stage.buyerOutcome)).toEqual([
      expect.stringMatching(/reliable contribution/i),
      expect.stringMatching(/delivery friction/i),
      expect.stringMatching(/team accountability/i),
      expect.stringMatching(/capacity to execute/i),
      expect.stringMatching(/decision-making/i),
    ]);
    expect(careerStages.slice(0, 4).every((stage) => stage.ctaLabel.startsWith("Start your"))).toBe(true);
    expect(careerStages[4]?.ctaLabel).toBe("Explore Executive Intelligence");
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
