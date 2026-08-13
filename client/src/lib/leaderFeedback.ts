export type ImmediateDiagnosticResult = {
  edgeScore: number;
  archetype: string;
  archetypeLabel?: string;
  archetypeTagline?: string;
  zone: string;
  zoneLabel?: string;
  zoneImplication?: string;
  archetypeRisks?: string[];
  dimensionScores?: Record<string, number>;
};

function humanise(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

export function getImmediateResultSummary(result: ImmediateDiagnosticResult, moduleLabel: string) {
  const dimensions = Object.entries(result.dimensionScores ?? {});
  const [lowestDimension] = [...dimensions].sort(([, scoreA], [, scoreB]) => scoreA - scoreB);
  const profile = result.archetypeLabel ?? humanise(result.archetype);
  const zone = result.zoneLabel ?? humanise(result.zone);
  const growthFocus = lowestDimension
    ? humanise(lowestDimension[0])
    : result.archetypeRisks?.[0] ?? "your most useful growth edge";

  return {
    score: Math.round(result.edgeScore),
    profile,
    zone,
    growthFocus,
    headline: `Your ${moduleLabel} snapshot is ready.`,
    meaning: result.archetypeTagline ?? result.zoneImplication ?? `You now have a clearer starting point for your ${moduleLabel.toLowerCase()}.`,
    commitment: `In my next meaningful leadership conversation, I will deliberately strengthen ${growthFocus.toLowerCase()}.`,
  };
}
