type Instrument = {
  behaviourItems: ReadonlyArray<{ id: string }>;
  scenarios: ReadonlyArray<{ id: string }>;
  environmentItems: ReadonlyArray<{ id: string }>;
  reflectiveQuestions: ReadonlyArray<{ id: string }>;
};

type Responses = {
  behaviour: Record<string, number>;
  scenarios: Record<string, { optionId: string; confidence: number }>;
  environment: Record<string, number>;
  reflections: Record<string, string>;
};

export function getCriticalThinkingProgress(instrument: Instrument, responses: Responses) {
  const completed = [
    instrument.behaviourItems.filter((item) => (responses.behaviour[item.id] ?? 0) >= 1).length,
    instrument.scenarios.filter((scenario) => Boolean(responses.scenarios[scenario.id]?.optionId)).length,
    instrument.environmentItems.filter((item) => (responses.environment[item.id] ?? 0) >= 1).length,
    instrument.reflectiveQuestions.filter((item) => (responses.reflections[item.id] ?? "").trim().length >= 3).length,
  ].reduce((total, count) => total + count, 0);
  const total = instrument.behaviourItems.length + instrument.scenarios.length + instrument.environmentItems.length + instrument.reflectiveQuestions.length;
  return { completed, total, remaining: Math.max(0, total - completed), percent: total ? Math.round((completed / total) * 100) : 0 };
}
