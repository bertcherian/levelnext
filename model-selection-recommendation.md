# Open-Weight Model Recommendation for LevelNext

## Recommendation

For the closest practical equivalent to **Claude Haiku’s fast, token-efficient role**, use **Qwen3-30B-A3B** as the first open-weight model to evaluate. It is an Apache 2.0–licensed mixture-of-experts model with **30.5B total parameters but only 3.3B activated per token**. It has an explicit non-thinking mode for fast conversational and structured-generation work, plus an optional thinking mode for selected harder tasks. This is the best fit for the large set of short, high-frequency LevelNext workloads that currently use Claude Haiku.[1]

> Qwen3-30B-A3B is the correct answer for **speed and compute efficiency**. It is not a blanket Claude Sonnet replacement.

No open-weight model currently gives an assured one-for-one match for both **Claude Sonnet-level judgement** and **Claude Haiku-level interactive latency**. The highest-capability alternatives are large enough that model-loading, KV-cache, routing, and provider queueing become material. For LevelNext’s report-generation and strategic-analysis tier, retain Claude Sonnet while running an A/B evaluation of a managed **GLM-5.2** or **Qwen3.5-397B-A17B** endpoint. GLM-5.2 is MIT-licensed and has approximately 40B active parameters, but its roughly 744B total footprint places it in a very different serving class.[2]

## What this means for the existing platform

The current server code explicitly selects Claude Haiku in **62** call sites and Claude Sonnet in **14** call sites. This is already a sensible two-tier design. The open-weight adoption should preserve the distinction rather than attempt a single-model replacement.

| LevelNext workload tier | Current model pattern | Recommended open-weight candidate | Reason | Adoption decision |
| --- | --- | --- | --- | --- |
| Short coaching replies, summaries, next-step suggestions, lightweight structured JSON | Claude Haiku | **Qwen3-30B-A3B** | Its 3.3B activated-parameter MoE path and non-thinking mode prioritise throughput and avoid unnecessary reasoning-token generation. | Pilot first. |
| Higher-stakes diagnostic reports, executive analysis, strategic narratives | Claude Sonnet | **GLM-5.2** or Qwen3.5-397B-A17B | Both are capable open-weight reasoning candidates, but are large managed-inference workloads rather than low-latency small models. | A/B test before any routing change. |
| Multimodal, very-long-context analysis | Claude/Gemini-class hosted service | Qwen3.5-27B only if its quality validates | The 27B model is Apache 2.0, supports vision, and has 262K native context; it is a practical deployment candidate but is dense, so it is not the lowest-compute option. | Use only for a defined multimodal use case. |

## Models not recommended for the default fast path

Kimi K3, MiniMax M3, DeepSeek-V3.2, and GLM-5.2 are impressive open-weight models, but they store hundreds of billions to trillions of parameters. Their active-parameter efficiency does **not** make them inexpensive or reliably Haiku-fast per request. They make sense through a managed provider for demanding report or agent workflows; they do not make sense as the default model for every coaching interaction.[2] [3] [4]

## Implementation implication

LevelNext runs on a managed autoscaling Node environment and currently sends requests only through its built-in LLM gateway. It should **not self-host** even the smaller Qwen model in this environment. A production adoption would require a managed Qwen-compatible inference endpoint, a server-side provider adapter, a secret for that endpoint, a model-routing policy, and an evaluation set of anonymised LevelNext prompts. These changes should be gated by an A/B test covering response quality, JSON validity, time-to-first-token, output tokens per answer, and cost per completed coaching flow.

## References

[1] [Qwen3-30B-A3B Model Card](https://huggingface.co/Qwen/Qwen3-30B-A3B)

[2] [GLM-5.2 Official Release](https://z.ai/blog/glm-5.2)

[3] [Qwen3.5-27B Model Card](https://huggingface.co/Qwen/Qwen3.5-27B)

[4] [DeepSeek-V3-0324 Official Release](https://api-docs.deepseek.com/news/news250325/)
