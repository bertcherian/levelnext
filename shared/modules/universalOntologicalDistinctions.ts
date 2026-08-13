export const ONTOLOGY_GAPS = ["capability", "judgment", "self_leadership", "observer", "environment_system", "mixed"] as const;
export const ONTOLOGY_DEPTHS = ["D1_answer", "D2_practice", "D3_reflection", "D4_reframe", "D5_observer_shift"] as const;
export type OntologyGap = typeof ONTOLOGY_GAPS[number];
export type OntologyDepth = typeof ONTOLOGY_DEPTHS[number];

export type OntologicalDistinction = { id: string; label: string; inquiry: string; guardrail: string };
export const UNIVERSAL_ONTOLOGICAL_DISTINCTIONS: OntologicalDistinction[] = [
  ["OD-01", "Assertion vs Assessment", "What specifically happened that led you to that conclusion?", "An assessment can be well grounded; do not invalidate it simply because it is an interpretation."],
  ["OD-02", "Observer", "How might someone else interpret the same situation?", "Do not assume a fixed observer pattern from one event."],
  ["OD-03", "Responsibility vs Victimhood", "Given what you cannot change, what remains available to you?", "Never deny structural constraints, discrimination, coercion, or real power asymmetries."],
  ["OD-04", "Complaint vs Commitment", "What does your frustration tell you about what matters to you here?", "Do not treat a complaint as a flaw; locate the value underneath it."],
  ["OD-05", "Request vs Expectation", "What exactly did you ask them to do, and what did they agree to?", "Do not presume a request was absent without checking."],
  ["OD-06", "Promise and Commitment", "Who promised what, to whom, by when, and under what conditions?", "Do not reduce complex coordination to individual blame."],
  ["OD-07", "Trust", "What specifically is not trusted: sincerity, competence, reliability, care, or judgment?", "Do not convert a specific trust concern into global distrust."],
  ["OD-08", "Breakdown", "What has this breakdown made visible that was previously invisible?", "Do not manufacture a lesson before immediate harm is addressed."],
  ["OD-09", "Possibility vs Prediction", "What do you know will happen, and what are you predicting?", "Do not replace realism with forced optimism."],
  ["OD-10", "Listening", "What are you listening for, and what might you therefore be missing?", "Do not assume misunderstanding without evidence."],
  ["OD-11", "Identity vs Behaviour", "Is this a permanent identity, or a pattern you currently tend to enact?", "Respect identity; do not pathologise normal preferences."],
  ["OD-12", "Story vs Event", "If we removed the interpretation for a moment, what actually happened?", "Do not deny underlying events while examining the story."],
  ["OD-13", "Control vs Influence vs Acceptance", "What can you control, influence, or accept for now?", "Do not fabricate control where constraints are genuine."],
  ["OD-14", "Intention vs Impact", "I understand your intention. What impact do you think it had?", "Negative impact does not prove negative intent."],
  ["OD-15", "Choice vs Inevitability", "What other choices existed, even if none were attractive?", "Do not fabricate choice where meaningful coercion exists."],
  ["OD-16", "Fact vs Explanation", "What do you know, and what are you inferring?", "Do not claim knowledge of another person’s motives."],
  ["OD-17", "Certainty vs Curiosity", "What might you be missing?", "Do not challenge certainty simply to appear clever."],
  ["OD-18", "Being Right vs Being Effective", "What matters more here: proving the point or changing the outcome?", "Do not require people to abandon legitimate principles."],
  ["OD-19", "Standards vs Perfection", "What level of quality does this situation actually require?", "Do not confuse high standards with perfectionism without evidence."],
  ["OD-20", "Care vs Control", "Are you helping them become more capable, or making yourself increasingly necessary?", "Do not discourage needed support or safety intervention."],
  ["OD-21", "Authenticity vs Unfiltered Expression", "How can you say what is true while taking responsibility for impact?", "Authenticity is not a licence for harm."],
  ["OD-22", "Courage vs Recklessness", "How can you act despite discomfort while accounting for consequences?", "Do not romanticise risk-taking."],
  ["OD-23", "Acceptance vs Resignation", "If this is the reality for now, what can you still choose?", "Acceptance is not surrendering agency."],
  ["OD-24", "Ambition vs Contribution", "How might your growth and the value you create both matter here?", "Neither ambition nor contribution is inherently superior."],
  ["OD-25", "Success vs Learning", "What would make this worthwhile even if the outcome is not what you hope?", "Do not make failure acceptable when material harm is foreseeable."],
].map(([id, label, inquiry, guardrail]) => ({ id, label, inquiry, guardrail }));

export type OntologyReasoningInput = { situation: string; observedBehaviour?: string; evidence?: string[]; careerStage?: string; context?: string; powerDynamics?: string };
export type OntologyReasoning = { primaryGap: OntologyGap; primaryDistinctionId?: string; secondaryDistinctionId?: string; evidence: string[]; counterEvidence: string[]; confidence: "low" | "moderate" | "high"; observerHypothesis: string; alternativeExplanations: string[]; recommendedDepth: OntologyDepth; reflectionQuestion: string; microExperiment: string; successSignal: string; doNotSurface: string[] };

export function getDistinction(id?: string) { return UNIVERSAL_ONTOLOGICAL_DISTINCTIONS.find((item) => item.id === id); }
export function buildUodlCoachDirective() {
  return `UNIVERSAL ONTOLOGICAL DISTINCTION LIBRARY (UODL): Quietly distinguish event → observer → interpretation → way of being → action → result. First determine whether the primary gap is capability, judgment, self-leadership, observer, environment/system, or mixed. Never use ontology when a simple answer or practice would solve the problem. Select at most one or two distinctions, verify evidence and alternative explanations, and use the shallowest useful depth (D1 answer through D5 observer shift). Ask natural language questions, never ontology jargon. Treat motives as hypotheses, not facts; do not diagnose, moralise, shame, force disclosure, or reframe discrimination, harassment, coercion, or structural constraints as mindset. Separate observation, interpretation, intention, behaviour, and impact. The purpose is more effective choice, action, and impact—not insight for its own sake.`;
}

export function createOntologyFallback(input: OntologyReasoningInput): OntologyReasoning {
  const distinction = getDistinction("OD-12")!;
  return { primaryGap: "mixed", primaryDistinctionId: distinction.id, evidence: input.evidence?.length ? input.evidence : [input.observedBehaviour ?? "One self-reported workplace account."], counterEvidence: [], confidence: "low", observerHypothesis: "One possibility worth exploring is whether the current story about the event is narrowing the actions that feel available.", alternativeExplanations: ["The situation may involve a capability gap, a missing request, or a genuine structural constraint."], recommendedDepth: "D3_reflection", reflectionQuestion: distinction.inquiry, microExperiment: "Before the next comparable moment, write two observable facts, one interpretation, and one question you could ask before acting.", successSignal: "The person can name an observation separately from the meaning they assigned to it and identify one proportionate next action.", doNotSurface: [] };
}
