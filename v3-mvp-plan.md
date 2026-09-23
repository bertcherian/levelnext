# LevelNext V3 MVP Implementation Blueprint

## Slice

Build the first additive V3 vertical slice for Manager Effectiveness: a situation-first participant entry point, private situation persistence, deterministic routing across the ten initial Manager Effectiveness situations, an explainable decision record, and handoff into existing Coach, Practice Partner, Simulator, or Diagnostics surfaces.

## Reuse decisions

The slice reuses the existing MEP access gate and persistent sidebar, existing Manager Coach, Manager Practice Partner, voice simulator, and diagnostic routes, and the existing tRPC + Drizzle stack. It does not replace Manager Home, the current Coach, or the existing simulator.

## Data boundary

Situation text and the resulting decision are participant-private. No enterprise or Success Partner query will consume these tables in this slice. Each decision records the selected route, confidence, alternatives, evidence basis, decision method, model version, escalation flag, and trace ID so the model-independent Decision Gateway can be introduced later without rewriting the participant experience.

## Deterministic routing

The first router uses a reviewed keyword/phrase registry for ten Manager Effectiveness situations: delegation, difficult feedback, underperformance, stakeholder challenge, conflict, executive communication, coaching, accountability, priority management, and managing upward. Ambiguous or low-signal input falls back to Coach with a lower confidence score and an explicit clarification prompt.

Intent modes are participant-selected and include talk_it_through, perspective, decide, prepare, practice, challenge, teach, and listen. The routing result is a decision contract, not an identity label. It may recommend a Coach, Practice Partner, Simulator, Diagnostic, or listening/clarification path.

## UI behavior

The new `/manager/today` route is authenticated through the existing MEP gate and rendered inside the existing MEP layout. It presents “What are you dealing with today?” with text input, eight optional intent modes, example situations, loading/error/empty states, and an explainable route card. It links into existing destinations with URL parameters where supported. Manager Home gains a prominent entry card to the new route; current functionality remains unchanged.

## Validation

Add pure routing tests for high-signal, ambiguous, intent-sensitive, and unsafe/empty inputs; a UI regression test for the Today entry experience; typecheck; focused Vitest; full build; and browser screenshots for `/manager/today` and `/manager` once the dev server is healthy. Save a WebDev checkpoint only after all gates pass.

## Deferred after this slice

The next phases are the canonical Participant State projection, shared Human Intelligence/posture contract, universal Decision Gateway abstraction, graph nodes/edges, canonical commitments/evidence, Practice-to-Commitment handoff, and shadow-mode comparison against existing LLM and human judgment. Those are intentionally not coupled into this first slice.
