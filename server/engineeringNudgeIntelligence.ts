import { invokeLLM } from "./_core/llm";
import {
  deterministicPartnerNudge,
  type PartnerNudgeCandidate,
  type PartnerNudgeDraft,
} from "../shared/modules/engineeringIntelligence";

const NUDGE_MODEL = "gpt-5-mini";

function contentToString(content: unknown) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map((item: any) => item?.text ?? "").join("");
  return "";
}

function isDraft(value: unknown, candidates: PartnerNudgeCandidate[]): value is PartnerNudgeDraft {
  const item = value as Partial<PartnerNudgeDraft> | null;
  const candidate = candidates.find((entry) => entry.participantId === item?.participantId && entry.reasonCode === item?.reasonCode);
  return Boolean(
    item && candidate && typeof item.objective === "string" && typeof item.whyNow === "string" &&
    typeof item.suggestedQuestion === "string" && ["in_app", "call", "voice_note", "email"].includes(item.recommendedChannel ?? "") &&
    ["low", "medium", "high"].includes(item.effort ?? "") && ["low", "medium", "high", "critical"].includes(item.urgency ?? "") &&
    typeof item.priorityScore === "number",
  );
}

export async function draftPartnerNudges(candidates: PartnerNudgeCandidate[]) {
  if (candidates.length === 0) return { drafts: [], mode: "deterministic" as const, modelId: null };

  const fallback = candidates.map(deterministicPartnerNudge);
  const permittedCandidates = candidates.map(({ participantId, participantName, missionId, missionTitle, missionStatus, reasonCode, priorityScore, dueAt, lastUpdatedAt, followUpAt }) => ({
    participantId,
    participantName,
    missionId,
    missionTitle,
    missionStatus,
    reasonCode,
    priorityScore,
    dueAt,
    lastUpdatedAt,
    followUpAt,
  }));
  try {
    const response = await invokeLLM({
      model: NUDGE_MODEL,
      messages: [
        {
          role: "system",
          content: "You are the LevelNext Engineering Intelligence Success Partner Coach. Draft respectful, concise coaching nudges for a human Success Partner. Use only the permitted participant and mission facts supplied. You are not a surveillance system, manager, therapist, diagnostic engine, or employee-ranking tool. Do not infer motivation, performance, personality, commitment, mental state, or private circumstances. Do not mention login activity, private reflections, private coaching, diagnostics, source-code productivity, or any data outside the supplied candidates. Prioritise the stated workflow reason, write one invitational question the Success Partner can edit, and return JSON only.",
        },
        {
          role: "user",
          content: `Today’s permitted nudge candidates are:\n${JSON.stringify(permittedCandidates)}\n\nReturn one nudge object per candidate. Keep whyNow grounded in the supplied facts and the suggestedQuestion to one sentence.`,
        },
      ],
      maxTokens: 1400,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "partner_nudge_batch",
          strict: true,
          schema: {
            type: "object",
            properties: {
              nudges: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    participantId: { type: "integer" },
                    reasonCode: { type: "string", enum: ["mission_due", "mission_stalled", "follow_up_due", "celebration"] },
                    objective: { type: "string" },
                    whyNow: { type: "string" },
                    suggestedQuestion: { type: "string" },
                    recommendedChannel: { type: "string", enum: ["in_app", "call", "voice_note", "email"] },
                    effort: { type: "string", enum: ["low", "medium", "high"] },
                    urgency: { type: "string", enum: ["low", "medium", "high", "critical"] },
                    priorityScore: { type: "integer", minimum: 0, maximum: 100 },
                  },
                  required: ["participantId", "reasonCode", "objective", "whyNow", "suggestedQuestion", "recommendedChannel", "effort", "urgency", "priorityScore"],
                  additionalProperties: false,
                },
              },
            },
            required: ["nudges"],
            additionalProperties: false,
          },
        },
      },
    });
    const parsed = JSON.parse(contentToString(response.choices[0]?.message?.content)) as { nudges?: unknown[] };
    const valid = (parsed.nudges ?? []).filter((item) => isDraft(item, candidates)) as PartnerNudgeDraft[];
    if (valid.length === candidates.length) {
      return {
        drafts: valid.map((draft) => {
          const candidate = candidates.find((entry) => entry.participantId === draft.participantId && entry.reasonCode === draft.reasonCode)!;
          return { ...draft, priorityScore: candidate.priorityScore };
        }),
        mode: "model" as const,
        modelId: NUDGE_MODEL,
      };
    }
  } catch {
    // A deterministic, privacy-constrained nudge remains available when the model is unavailable.
  }
  return { drafts: fallback, mode: "deterministic" as const, modelId: null };
}
