export type PersonalizedMission = {
  id: string;
  title: string;
  description: string;
  xp: number;
  missionArea: "Brand" | "Research" | "Network" | "Interview" | "Skills";
  status: "pending";
  contextKey: string;
};

type RoleProfile = {
  id: string;
  label: string;
  artifact: string;
  contact: string;
  capability: string;
  interviewLens: string;
  aliases?: string[];
};

type IndustryProfile = {
  id: string;
  label: string;
  priorities: string;
  aliases?: string[];
};

export const LAUNCH_ROLE_PROFILES: RoleProfile[] = [
  { id: "software_engineer", label: "Software Engineer", artifact: "technical portfolio case study", contact: "software engineering leader", capability: "software delivery and system design", interviewLens: "technical judgement", aliases: ["software engineer"] },
  { id: "product_manager", label: "Product Manager", artifact: "product case study", contact: "product leader", capability: "product discovery and prioritisation", interviewLens: "product judgement", aliases: ["product manager"] },
  { id: "data_analyst", label: "Data Analyst / Scientist", artifact: "analysis portfolio piece", contact: "data and analytics leader", capability: "analysis, insight generation, and storytelling", interviewLens: "analytical judgement", aliases: ["data analyst", "data scientist", "data analyst scientist"] },
  { id: "designer", label: "UX / Product Designer", artifact: "design case study", contact: "design leader", capability: "user research and product design", interviewLens: "design judgement", aliases: ["ux designer", "product designer", "ux product designer"] },
  { id: "marketing", label: "Marketing & Growth", artifact: "campaign or growth brief", contact: "marketing or growth leader", capability: "audience insight and growth strategy", interviewLens: "commercial creativity", aliases: ["marketing", "marketing growth"] },
  { id: "sales", label: "Sales & Business Dev", artifact: "account or partnership plan", contact: "sales or business development leader", capability: "pipeline development and commercial conversations", interviewLens: "commercial judgement", aliases: ["sales", "business development", "sales business dev"] },
  { id: "finance", label: "Finance & Accounting", artifact: "financial model or commercial analysis", contact: "finance leader", capability: "financial analysis, forecasting, and commercial insight", interviewLens: "financial and commercial judgement", aliases: ["finance", "accounting", "finance accounting"] },
  { id: "operations", label: "Operations & Strategy", artifact: "process-improvement case", contact: "operations or strategy leader", capability: "operating improvement and strategic execution", interviewLens: "operating judgement", aliases: ["operations", "strategy", "operations strategy"] },
  { id: "hr_people", label: "HR & People Ops", artifact: "people strategy brief", contact: "HR or people leader", capability: "talent, culture, and people operations", interviewLens: "people judgement", aliases: ["hr", "people ops", "hr people ops"] },
  { id: "consulting", label: "Consulting & Advisory", artifact: "client problem-solving case", contact: "consulting or advisory leader", capability: "structured problem solving and stakeholder advice", interviewLens: "client and problem-solving judgement", aliases: ["consulting", "advisory", "consulting advisory"] },
  { id: "other", label: "Your Target Role", artifact: "career proof-of-work sample", contact: "professional in your target role", capability: "the most relevant capabilities for your chosen path", interviewLens: "role-specific judgement", aliases: ["other", "something else"] },
];

export const LAUNCH_INDUSTRY_PROFILES: IndustryProfile[] = [
  { id: "tech", label: "Tech & Software", priorities: "product innovation, customer value, and digital scale", aliases: ["technology", "tech software"] },
  { id: "fintech", label: "Fintech & Banking", priorities: "customer trust, risk, regulation, and financial innovation", aliases: ["finance banking", "fintech banking"] },
  { id: "healthcare", label: "Healthcare & Pharma", priorities: "patient impact, regulation, evidence, and operational reliability", aliases: ["healthcare pharma"] },
  { id: "ecommerce", label: "E-commerce & Retail", priorities: "customer experience, merchandising, demand, and conversion", aliases: ["e commerce", "ecommerce retail"] },
  { id: "consulting", label: "Consulting & Services", priorities: "client outcomes, delivery quality, and advisory impact", aliases: ["consulting services"] },
  { id: "media", label: "Media & Entertainment", priorities: "audience growth, content economics, and digital distribution", aliases: ["media entertainment"] },
  { id: "manufacturing", label: "Manufacturing & Infra", priorities: "quality, efficiency, supply resilience, and capital discipline", aliases: ["manufacturing infra"] },
  { id: "education", label: "Education & EdTech", priorities: "learner outcomes, engagement, and accessible delivery", aliases: ["education", "education edtech"] },
  { id: "startup", label: "Early-stage Startup", priorities: "rapid learning, customer traction, and focused execution", aliases: ["startup", "early stage startup"] },
  { id: "other", label: "Your Target Industry", priorities: "the commercial and customer priorities that matter in your chosen industry", aliases: ["other"] },
];

function normalizePreference(value: string | null | undefined) {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function resolveProfile<T extends { id: string; label: string; aliases?: string[] }>(value: string | null | undefined, profiles: T[], fallback: T) {
  const normalized = normalizePreference(value);
  return profiles.find((profile) => [profile.id, profile.label, ...(profile.aliases ?? [])]
    .map(normalizePreference)
    .includes(normalized)) ?? fallback;
}

export function resolveLaunchRole(value: string | null | undefined) {
  return resolveProfile(value, LAUNCH_ROLE_PROFILES, LAUNCH_ROLE_PROFILES.at(-1)!);
}

export function resolveLaunchIndustry(value: string | null | undefined) {
  return resolveProfile(value, LAUNCH_INDUSTRY_PROFILES, LAUNCH_INDUSTRY_PROFILES.at(-1)!);
}

export function createLaunchMissionContextKey(targetRole: string | null | undefined, targetIndustry: string | null | undefined) {
  const role = resolveLaunchRole(targetRole);
  const industry = resolveLaunchIndustry(targetIndustry);
  return `${role.id}:${industry.id}`;
}

export function shouldRefreshPendingMissions(
  missions: Array<{ contextKey?: string; status?: "pending" | "complete" }> | undefined,
  contextKey: string | null,
) {
  return Boolean(
    contextKey && missions?.every((mission) => mission.status !== "complete") && missions.some((mission) => mission.contextKey !== contextKey),
  );
}

function stableIndex(input: string, modulus: number) {
  const hash = Array.from(input).reduce((total, character) => ((total * 31) + character.charCodeAt(0)) >>> 0, 17);
  return hash % modulus;
}

export function createPersonalizedDailyMissions({
  targetRole,
  targetIndustry,
  date,
}: {
  targetRole: string | null | undefined;
  targetIndustry: string | null | undefined;
  date: string;
}): PersonalizedMission[] {
  const role = resolveLaunchRole(targetRole);
  const industry = resolveLaunchIndustry(targetIndustry);
  const contextKey = createLaunchMissionContextKey(targetRole, targetIndustry);
  const blueprints = [
    {
      title: `Map ${industry.label} priorities for your ${role.label} search`,
      description: `Spend 20 minutes identifying two current ${industry.label} priorities around ${industry.priorities}. Write one sentence on how a ${role.label} can create value against each priority.`,
      xp: 25,
      missionArea: "Research" as const,
    },
    {
      title: `Build a ${role.artifact} for ${industry.label}`,
      description: `Create a concise ${role.artifact} that addresses a realistic ${industry.label} challenge for a ${role.label}. Make your ${role.capability} visible through one clear decision, insight, or outcome.`,
      xp: 35,
      missionArea: "Skills" as const,
    },
    {
      title: `Connect with a ${role.contact} in ${industry.label}`,
      description: `Find one ${role.contact} working in ${industry.label} whose path is relevant to a ${role.label}. Send a personalised note that references their work and asks one specific question about ${industry.priorities}.`,
      xp: 30,
      missionArea: "Network" as const,
    },
    {
      title: `Translate your experience for ${industry.label}`,
      description: `Rewrite one LinkedIn or resume bullet to show ${role.capability} for a ${role.label} in the language of ${industry.label}. Lead with the outcome, then name the evidence that supports it.`,
      xp: 30,
      missionArea: "Brand" as const,
    },
    {
      title: `Prepare a ${role.interviewLens} story for ${industry.label}`,
      description: `Use STAR to prepare one example that demonstrates ${role.interviewLens} in a ${industry.label} context. Keep the result measurable and connect it to ${industry.priorities}.`,
      xp: 30,
      missionArea: "Interview" as const,
    },
  ];
  const start = stableIndex(`${contextKey}:${date}`, blueprints.length);
  return Array.from({ length: 3 }, (_, index) => {
    const blueprint = blueprints[(start + index) % blueprints.length]!;
    return {
      id: `m${index + 1}_${Date.now()}`,
      ...blueprint,
      status: "pending",
      contextKey,
    };
  });
}
