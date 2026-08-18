# AI Data-Use Audit Notes

## Active LevelNext routes

LevelNext sends user content through two active inference paths: the Manus-managed model gateway (`server/_core/llm.ts`) used by the app’s Claude/OpenAI/Gemini model calls, and the OpenRouter Qwen3-30B-A3B comparison helper (`server/_core/openRouter.ts`). The Fireworks helper is present but is not imported by any active feature.

The unused Fireworks helper has now also been explicitly disabled in code. Any future call fails before a network request is made, and the error directs maintainers to the privacy-enforced OpenRouter route.

## Provider findings

| Provider path | Training posture | Retention posture | Enforceable application control |
|---|---|---|---|
| Manus-managed Claude routes | Anthropic states that commercial inputs and outputs are **not used to train models by default**. Explicit feedback or opt-in can change this. | The current API documentation describes feature-specific retention and offers organisation-level Zero Data Retention (ZDR) by arrangement. | LevelNext calls a managed gateway rather than a directly administered Anthropic organisation, so the application cannot unilaterally enable Anthropic ZDR. LevelNext does not submit provider feedback from the app. |
| Manus-managed OpenAI routes | OpenAI states that API inputs and outputs are **not used to train or improve models by default**. Explicit opt-in can change this. | OpenAI documents default abuse-monitoring retention of up to 30 days, with approved organisation-level ZDR/Modified Abuse Monitoring controls. | LevelNext calls a managed gateway rather than a directly administered OpenAI organisation, so the application cannot unilaterally enable OpenAI ZDR. It uses stateless chat-completion-style requests and does not submit provider feedback from the app. |
| OpenRouter Qwen path | OpenRouter does not retain prompt/response content unless an account opts into logging or OpenRouter use of inputs/outputs. It documents endpoint-level policies for downstream providers. | OpenRouter supports Zero Data Retention endpoint routing per request. | Enforced in code: every Qwen request now sends `provider: { "data_collection": "deny", "zdr": true }`. This blocks endpoints that may store or train on content and requires a ZDR endpoint. |

## Official sources

1. [Anthropic API and data retention](https://platform.claude.com/docs/en/manage-claude/api-and-data-retention) — states retained data is never used for model training without express permission and explains ZDR eligibility.
2. [Anthropic commercial training policy](https://privacy.claude.com/en/articles/7996868-is-my-data-used-for-model-training) — confirms commercial/API inputs and outputs are not used for training by default, while explicit feedback can permit use.
3. [OpenRouter data collection](https://openrouter.ai/docs/guides/privacy/data-collection) — describes opt-in prompt logging and use-of-inputs/outputs settings.
4. [OpenRouter Zero Data Retention](https://openrouter.ai/docs/guides/features/zdr) — documents per-request `provider.zdr: true`.
5. [OpenRouter provider routing](https://openrouter.ai/docs/guides/routing/provider-selection) — documents `provider.data_collection: "deny"`.
6. [OpenAI API data controls](https://developers.openai.com/api/docs/guides/your-data) — confirms API content is not used for training by default and documents retention controls.
7. [OpenAI business data privacy](https://openai.com/business-data/) — confirms API inputs and outputs are not used for model training by default.

## Residual boundary

The LevelNext application can enforce OpenRouter’s documented per-request controls, and it has disabled the unapproved Fireworks route. For calls sent through the Manus-managed gateway, the underlying commercial-provider policies state no default training use, but account-level ZDR/Modified Abuse Monitoring settings belong to the managed gateway account. The application cannot claim or configure those account-level retention arrangements itself.
