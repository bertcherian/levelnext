export type TechGapCostInputs = {
  teamSize: number;
  annualFullyLoadedCost: number;
  weeklyFrictionHours: number;
  workingWeeks: number;
  addressableImprovementPercent: number;
};

export type TechGapCostResult = {
  annualFrictionExposure: number;
  addressableExposure: number;
  capacityDays: number;
};

/**
 * Produces an illustrative planning exposure, not a forecast, ROI claim, or
 * promise of savings. The calculation makes its time and cost assumptions
 * explicit so B2B buyers can adjust them for their own operating context.
 */
export function calculateTechGapCost(inputs: TechGapCostInputs): TechGapCostResult {
  const teamSize = Math.max(0, inputs.teamSize);
  const annualFullyLoadedCost = Math.max(0, inputs.annualFullyLoadedCost);
  const weeklyFrictionHours = Math.max(0, inputs.weeklyFrictionHours);
  const workingWeeks = Math.max(0, inputs.workingWeeks);
  const improvementRate = Math.min(100, Math.max(0, inputs.addressableImprovementPercent)) / 100;
  const annualFrictionExposure = teamSize * annualFullyLoadedCost * (weeklyFrictionHours / 40) * (workingWeeks / 48);
  const capacityDays = teamSize * weeklyFrictionHours * workingWeeks / 8;
  return {
    annualFrictionExposure: Math.round(annualFrictionExposure),
    addressableExposure: Math.round(annualFrictionExposure * improvementRate),
    capacityDays: Math.round(capacityDays),
  };
}
