import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../_core/context";
import { ENV } from "../_core/env";

const { invokeLLM } = vi.hoisted(() => ({
  invokeLLM: vi.fn(),
}));

vi.mock("../_core/llm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../_core/llm")>();
  return { ...actual, invokeLLM };
});

import { requestTts, simulatorRouter } from "./simulator";

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

describe("simulator voice-provider boundary", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("aborts a provider request that exceeds the voice-preview timeout", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn((_url: string, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
    }));
    vi.stubGlobal("fetch", fetchMock);

    const requestResult = requestTts("https://voice.example.test", { method: "POST" }).then(
      () => null,
      (error) => error,
    );
    await actAdvanceTime(12_000);

    await expect(requestResult).resolves.toMatchObject({ code: "TIMEOUT" });
    expect(fetchMock).toHaveBeenCalledWith("https://voice.example.test", expect.objectContaining({ signal: expect.any(AbortSignal) }));
  });
});

describe("simulatorRouter.tts", () => {
  const originalOpenAiApiKey = ENV.openAiApiKey;
  const originalSarvamApiKey = ENV.sarvamApiKey;

  beforeEach(() => {
    ENV.openAiApiKey = "test-openai-key";
    ENV.sarvamApiKey = "test-sarvam-key";
  });

  afterEach(() => {
    ENV.openAiApiKey = originalOpenAiApiKey;
    ENV.sarvamApiKey = originalSarvamApiKey;
    vi.unstubAllGlobals();
  });

  it("returns Sarvam WAV audio for an Indian English voice", async () => {
    const json = vi.fn().mockResolvedValue({ audios: ["sarvam-base64-audio"] });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json });
    vi.stubGlobal("fetch", fetchMock);

    const caller = simulatorRouter.createCaller(createAuthContext());
    await expect(caller.tts({ text: "Hello from LevelNext", voice: "shubh" })).resolves.toEqual({
      audioBase64: "sarvam-base64-audio",
      mimeType: "audio/wav",
    });
    expect(fetchMock).toHaveBeenCalledWith("https://api.sarvam.ai/text-to-speech", expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({ "api-subscription-key": "test-sarvam-key" }),
    }));
  });

  it("returns OpenAI MP3 audio for an international English voice", async () => {
    const arrayBuffer = vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]).buffer);
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, arrayBuffer });
    vi.stubGlobal("fetch", fetchMock);

    const caller = simulatorRouter.createCaller(createAuthContext());
    await expect(caller.tts({ text: "Hello from LevelNext", voice: "nova" })).resolves.toEqual({
      audioBase64: Buffer.from([1, 2, 3]).toString("base64"),
      mimeType: "audio/mpeg",
    });
    expect(fetchMock).toHaveBeenCalledWith("https://api.openai.com/v1/audio/speech", expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({ Authorization: "Bearer test-openai-key" }),
    }));
  });
});

async function actAdvanceTime(milliseconds: number) {
  await vi.advanceTimersByTimeAsync(milliseconds);
}
