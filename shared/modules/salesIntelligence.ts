export const SALES_EVIDENCE_CATEGORIES = ["fact", "evidence", "interpretation", "assumption", "hope"] as const;
export const SALES_CONFIDENCE_LEVELS = ["low", "moderate", "high"] as const;

export type SalesEvidenceCategory = typeof SALES_EVIDENCE_CATEGORIES[number];
export type SalesConfidence = typeof SALES_CONFIDENCE_LEVELS[number];

export type CommercialJudgment = {
  whatIsHappening: string;
  whatWeKnow: string[];
  whatWeAreAssuming: string[];
  whatMattersMost: string;
  primaryConstraint: string;
  constraintEvidence: string[];
  confidence: SalesConfidence;
  missingInformation: string[];
  recommendedNextMove: string;
  alternativeMove: string;
  whatWouldChangeJudgment: string;
  practicePrompt: string;
};

export type SalesPracticeMessage = { role: "seller" | "buyer"; content: string; timestamp: number };

export type SalesPracticeScenario = {
  buyerRole: string;
  buyerStance: string;
  openingLine: string;
  challenge: string;
  successSignal: string;
  evidenceBoundary: string;
};

export type SalesPracticeDebrief = {
  strengths: string[];
  tryNext: string[];
  evidenceQuestion: string;
  keyTakeaway: string;
  evidenceBoundary: string;
};

export const COMMERCIAL_CONSTRAINTS = [
  "Weak business problem", "Insufficient urgency", "No compelling event", "Poor economic-buyer access",
  "Weak champion", "Single-threaded relationship", "Poor differentiation", "Unquantified value",
  "Strong incumbent", "Procurement pressure", "Internal politics", "Implementation risk",
  "Weak customer commitment", "Seller avoidance", "Premature proposal", "Poor qualification",
] as const;
