import { describe, expect, it, vi } from "vitest";
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
});
