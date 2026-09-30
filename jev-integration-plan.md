# LevelNext Jev Integration Strategy

## A. Existing state

LevelNext already separates deterministic behaviour-change logic from generative AI. Pilotlab release gates, proof-pilot health, consent, evidence boundaries, and next-best-action rules are deterministic. Text generation and simulations use the platform-managed Forge gateway, with a limited OpenRouter Qwen comparison route in the admin model evaluator.

There was no Jev integration, no Jev credential, and no provider-neutral decision audit layer in the application. The live Forge catalog currently provides GPT, Claude, and Gemini models; Jev is a separate TypeSafe API at `https://api.typesafe.ai/v1/systemone`.

## B. Target state

The long-term target is a LevelNext Intelligence Fabric:

- Tier 0: no AI.
- Tier 1: deterministic rules.
- Tier 2: typed Jev decisions.
- Tier 3–5: approved open-weight and frontier generation models.
- Tier 6: human judgement.

The Fabric should choose the least expensive and least intrusive intelligence that clears the quality, privacy, latency, and safety requirements for a task. Jev should classify, score, prioritise, and route; it should not generate coaching text. Deterministic policy remains responsible for permissions, consent, data export, escalation, and whether a recommendation is acted upon.

## C. Gap

The remaining strategic gaps are production calibration, model cost/latency telemetry across every AI call, a full context compiler for each feature, organisation-specific provider policies, and validated open-weight/private deployment options. Those require evidence and enterprise policy decisions; they are deliberately not switched on by this slice.

## D. Now — implemented

This release adds:

1. A shared Intelligence Fabric contract with tiers, decision classes, maturity levels, privacy classes, requirements, and a replaceable model registry.
2. An optional TypeSafe Jev adapter using the official typed `state + questions` API, with bounded retries for 429/529/5xx responses and secret-safe errors.
3. A policy gateway that blocks external processing for sensitive context and falls back to deterministic LevelNext rules when Jev is not configured, disabled, slow, or unavailable.
4. Privacy-aware context minimisation before external decisions and an audit log that stores decision metadata, context field names, outcome, confidence, latency, and token usage without storing raw participant reflections.
5. An admin-only Intelligence Fabric console route for provider status, registry review, and controlled decision experiments.

Jev remains D0/D1-style experimental infrastructure. It is not automatically used in participant workflows and is not production-approved.

## E. Next

After a secure `TYPESAFE_API_KEY` is configured, run shadow comparisons against deterministic next-best-action decisions using approved, non-sensitive pilot context. Measure agreement, calibration, false positives, false negatives, latency, provider errors, and downstream intervention outcomes. Promote a decision class only after human review and evidence meet its maturity gate.

Then add task-specific context compilers and route only bounded decisions such as pilot intervention selection, engagement-risk classification, and difficulty classification. Generation remains with the existing Forge or an approved open-weight provider.

## F. Not yet

Do not route private participant reflections, sensitive HR data, or consent-restricted content to Jev. Do not let Jev control authentication, authorisation, consent, security, sponsor visibility, or evidence claims. Do not hard-code Jev as the only decision provider, replace deterministic gates with confidence scores, or claim cost savings before real usage and provider pricing are measured.

## Acceptance criteria

- Jev integration is optional and the app remains functional without its key.
- External Jev calls are disabled unless explicitly allowed and the context is standard privacy class.
- Typed Jev responses are captured as structured answers, not parsed prose.
- Every decision attempt is auditable without persisting raw sensitive context.
- Deterministic fallback is available for provider failure or missing configuration.
- Admins can inspect provider status and decision history; participants do not see provider names or routing details.
