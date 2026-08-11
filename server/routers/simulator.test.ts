import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../_core/context";

const { invokeLLM } = vi.hoisted(() => ({
  invokeLLM: vi.fn(),
}));

vi.mock("../_core/llm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../_core/llm")>();
  return { ...actual, invokeLLM };
});

import { simulatorRouter } from "./simulator";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "simulator-test-user",
    email: "simulator-test@example.com",
    name: "Test Manager",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("simulatorRouter.inferScenario", () => {
  const scenarioResponse = {
    choices: [{
      message: {
        content: `A scenario that can be safely parsed follows:\n\n\`\`\`json
{
  "conversationType": "Managerial Accountability Conversation",
  "stakeholder": "A relevant stakeholder",
  "objective": "Reach clear agreement on the next practical step.",
  "expectedChallenge": "The stakeholder may initially be defensive or hesitant.",
  "difficulty": 3,
  "estimatedMinutes": 6,
  "characterName": "Alex",
  "characterStyle": "Thoughtful, direct, and initially cautious.",
  "followUpQuestion": null
}
\`\`\``,
      },
    }],
  };

  const commonScenarios = [
    ["leadership", "Influencing a sceptical board member"],
    ["leadership", "Delivering difficult feedback to a peer"],
    ["leadership", "Navigating a politically charged decision"],
    ["leadership", "Presenting a strategy under pressure"],
    ["leadership", "Managing a high-performing but difficult team member"],
    ["manager", "Accountability conversation with an underperformer"],
    ["manager", "Managing up on a priority conflict"],
    ["manager", "Cross-team conflict with another manager"],
    ["manager", "Giving feedback to a defensive team member"],
    ["manager", "Asking for resources from my VP"],
    ["career", "Salary negotiation with a new employer"],
    ["career", "Explaining a career gap confidently"],
    ["career", "Pitching myself for a role in a new industry"],
    ["career", "Asking for a promotion"],
    ["career", "Stakeholder influence as a new hire"],
    ["young", "My first performance review conversation"],
    ["young", "Asking my manager for feedback"],
    ["young", "Presenting an idea to senior leadership"],
    ["young", "Handling a conflict with a peer"],
    ["young", "Asking for a stretch assignment"],
  ] as const;

  beforeEach(() => {
    invokeLLM.mockReset();
    invokeLLM.mockResolvedValue(scenarioResponse);
  });

  it("returns a scenario for the built-in manager accountability prompt when the LLM includes a preamble", async () => {
    invokeLLM.mockResolvedValueOnce({
      choices: [{
        message: {
          content: `Here is the practice scenario:\n\n\`\`\`json
{
  "conversationType": "Accountability Conversation",
  "stakeholder": "Rohan, an underperforming direct report",
  "objective": "Address the performance gap and agree on a measurable recovery plan.",
  "expectedChallenge": "Rohan may attribute missed commitments to workload and competing priorities.",
  "difficulty": 3,
  "estimatedMinutes": 6,
  "characterName": "Rohan",
  "characterStyle": "Defensive initially, but receptive to clear expectations and specific evidence.",
  "followUpQuestion": null
}
\`\`\``,
        },
      }],
    });

    const caller = simulatorRouter.createCaller(createAuthContext());
    const scenario = await caller.inferScenario({
      platform: "manager",
      prompt: "Accountability conversation with an underperformer",
    });

    expect(scenario).toMatchObject({
      conversationType: "Accountability Conversation",
      stakeholder: "Rohan, an underperforming direct report",
      characterName: "Rohan",
      difficulty: 3,
      estimatedMinutes: 6,
      followUpQuestion: null,
    });
    expect(invokeLLM).toHaveBeenCalledWith(expect.objectContaining({
      model: "claude-haiku-4-5",
      maxTokens: 500,
      response_format: expect.objectContaining({ type: "json_schema" }),
    }));
  });

  it.each(commonScenarios)("generates a valid scenario for the %s preset: %s", async (platform, prompt) => {
    const caller = simulatorRouter.createCaller(createAuthContext());

    const scenario = await caller.inferScenario({ platform, prompt });

    expect(scenario).toMatchObject({
      conversationType: "Managerial Accountability Conversation",
      stakeholder: "A relevant stakeholder",
      difficulty: 3,
      estimatedMinutes: 6,
      characterName: "Alex",
    });
    expect(invokeLLM).toHaveBeenCalledWith(expect.objectContaining({
      model: "claude-haiku-4-5",
      response_format: expect.objectContaining({ type: "json_schema" }),
    }));
  });
});
