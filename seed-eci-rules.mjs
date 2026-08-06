/**
 * Seed ECI Judgment Rules into the Intelligence Core database.
 *
 * This script inserts:
 *   1. Single-dimension rules (10 sub-dimensions × 3 score bands = 30 rules)
 *   2. Cross-dimensional rules (6 rules)
 *   3. Promotion readiness rules (7 rules)
 *
 * Each rule creates a judgment_rule record and an active judgment_rule_version.
 * The script is idempotent — it upserts by rule_code.
 */

import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

// ── Rule definitions ──────────────────────────────────────────────────────────

const SINGLE_DIMENSION_RULES = [
  // Strategic Clarity & Brevity
  {
    ruleCode: "ECI_SD_SC_LOW",
    displayName: "Strategic Clarity — Critical Gap",
    description: "Strategic Clarity & Brevity score below 50 — excessive detail, insufficient strategic framing.",
    moduleType: "ECI",
    dimensionId: "strategic_clarity",
    priority: 85,
    conditions: [{ field: "strategic_clarity", operator: "<", value: 50 }],
    recommendationTitle: "Develop Strategic Clarity and Brevity in Executive Communication",
    recommendationDescription: "Your communication includes excessive detail and insufficient strategic framing. Practice distilling complex ideas into concise, high-impact messages. Focus on communicating impact and risk, not just activity and effort.",
    recommendationType: "single_dimension_clarity",
    actionCheckInDays: 7,
    outcomeCheckInDays: 30,
    explanationTemplate: "Strategic Clarity score of {score} indicates a critical development area. Senior stakeholders struggle to extract key messages from your communication.",
  },
  {
    ruleCode: "ECI_SD_SC_MOD",
    displayName: "Strategic Clarity — Moderate",
    description: "Strategic Clarity & Brevity score 50-69 — clear in familiar contexts but verbose in high-stakes.",
    moduleType: "ECI",
    dimensionId: "strategic_clarity",
    priority: 60,
    conditions: [{ field: "strategic_clarity", operator: ">=", value: 50 }, { field: "strategic_clarity", operator: "<", value: 70 }],
    recommendationTitle: "Sharpen Strategic Clarity for High-Stakes Communication",
    recommendationDescription: "You communicate clearly in familiar contexts but struggle to distil complexity in high-stakes situations. Practice tailoring message depth to audience seniority and prioritising what matters most.",
    recommendationType: "single_dimension_clarity",
    actionCheckInDays: 14,
    outcomeCheckInDays: 45,
    explanationTemplate: "Strategic Clarity score of {score} indicates moderate capability. Focus on high-stakes communication precision.",
  },
  // Executive Framing & Prioritisation
  {
    ruleCode: "ECI_SD_EF_LOW",
    displayName: "Executive Framing — Critical Gap",
    description: "Executive Framing score below 50 — raises problems without recommendations, frames operationally.",
    moduleType: "ECI",
    dimensionId: "executive_framing",
    priority: 85,
    conditions: [{ field: "executive_framing", operator: "<", value: 50 }],
    recommendationTitle: "Develop Executive Framing and Recommendation-First Communication",
    recommendationDescription: "You raise problems without recommendations and frame issues at an operational rather than strategic level. Practice coming with a recommended course of action and reframing local challenges as enterprise priorities.",
    recommendationType: "single_dimension_framing",
    actionCheckInDays: 7,
    outcomeCheckInDays: 30,
    explanationTemplate: "Executive Framing score of {score} indicates a critical gap. Senior leaders expect recommendations, not just analysis.",
  },
  // Gravitas & Composure
  {
    ruleCode: "ECI_SD_GC_LOW",
    displayName: "Gravitas & Composure — Critical Gap",
    description: "Gravitas score below 50 — lacks composure under pressure, becomes defensive in senior forums.",
    moduleType: "ECI",
    dimensionId: "gravitas_composure",
    priority: 88,
    conditions: [{ field: "gravitas_composure", operator: "<", value: 50 }],
    recommendationTitle: "Develop Executive Presence and Composure Under Pressure",
    recommendationDescription: "You lack composure under pressure, becoming defensive or reactive in senior forums. Practice executive simulation, composure under fire exercises, and body language awareness in high-stakes settings.",
    recommendationType: "single_dimension_presence",
    actionCheckInDays: 7,
    outcomeCheckInDays: 30,
    explanationTemplate: "Gravitas & Composure score of {score} indicates a critical gap. Executive presence is essential for senior forums.",
  },
  // Confidence & Authority
  {
    ruleCode: "ECI_SD_CA_LOW",
    displayName: "Confidence & Authority — Critical Gap",
    description: "Confidence & Authority score below 50 — hesitates to take ownership, uses qualifying language.",
    moduleType: "ECI",
    dimensionId: "confidence_authority",
    priority: 90,
    conditions: [{ field: "confidence_authority", operator: "<", value: 50 }],
    recommendationTitle: "Develop Executive Authority and Opinion-First Communication",
    recommendationDescription: "You hesitate to take ownership of recommendations and communicate with insufficient executive authority. Practice opinion-first communication drills, recommendation-before-evidence framework, and authority language coaching.",
    recommendationType: "single_dimension_authority",
    actionCheckInDays: 7,
    outcomeCheckInDays: 30,
    explanationTemplate: "Confidence & Authority score of {score} indicates a critical gap. Qualifying language and deferred decisions undermine executive credibility.",
  },
  // Stakeholder Influence & Persuasion
  {
    ruleCode: "ECI_SD_SI_LOW",
    displayName: "Stakeholder Influence — Critical Gap",
    description: "Stakeholder Influence score below 50 — struggles to influence beyond direct authority, relies on escalation.",
    moduleType: "ECI",
    dimensionId: "stakeholder_influence",
    priority: 82,
    conditions: [{ field: "stakeholder_influence", operator: "<", value: 50 }],
    recommendationTitle: "Develop Cross-Functional Influence and Persuasion Skills",
    recommendationDescription: "You struggle to influence beyond your direct authority and rely on escalation rather than persuasion. Practice shifting resistant stakeholders through dialogue, building coalitions, and managing resistance directly.",
    recommendationType: "single_dimension_influence",
    actionCheckInDays: 7,
    outcomeCheckInDays: 30,
    explanationTemplate: "Stakeholder Influence score of {score} indicates a critical gap. Cross-functional influence is essential for enterprise leadership.",
  },
  // Political Intelligence & Navigation
  {
    ruleCode: "ECI_SD_PI_LOW",
    displayName: "Political Intelligence — Critical Gap",
    description: "Political Intelligence score below 50 — surprised by political dynamics, misses stakeholder mapping.",
    moduleType: "ECI",
    dimensionId: "political_intelligence",
    priority: 82,
    conditions: [{ field: "political_intelligence", operator: "<", value: 50 }],
    recommendationTitle: "Develop Political Intelligence and Organisational Navigation",
    recommendationDescription: "You are often surprised by political dynamics that others anticipated. Practice stakeholder mapping, anticipation drills, and coalition building before major decisions.",
    recommendationType: "single_dimension_political",
    actionCheckInDays: 7,
    outcomeCheckInDays: 30,
    explanationTemplate: "Political Intelligence score of {score} indicates a critical gap. Political blind spots limit enterprise leadership potential.",
  },
  // Storytelling & Vision Communication
  {
    ruleCode: "ECI_SD_SV_LOW",
    displayName: "Storytelling & Vision — Critical Gap",
    description: "Storytelling score below 50 — relies on data only, no narrative, cannot create emotional buy-in.",
    moduleType: "ECI",
    dimensionId: "storytelling_vision",
    priority: 78,
    conditions: [{ field: "storytelling_vision", operator: "<", value: 50 }],
    recommendationTitle: "Develop Storytelling and Vision Communication Capability",
    recommendationDescription: "You rely primarily on data and facts, rarely using narrative or storytelling. Practice crafting compelling narratives, integrating data with story, and communicating the 'why' before the 'what'.",
    recommendationType: "single_dimension_storytelling",
    actionCheckInDays: 14,
    outcomeCheckInDays: 45,
    explanationTemplate: "Storytelling score of {score} indicates a critical gap. Without narrative capability, you are seen as an analyst, not a visionary.",
  },
  // Executive Visibility & Thought Leadership
  {
    ruleCode: "ECI_SD_EV_LOW",
    displayName: "Executive Visibility — Critical Gap",
    description: "Executive Visibility score below 50 — contributions invisible to global leadership, focuses on execution not visibility.",
    moduleType: "ECI",
    dimensionId: "executive_visibility",
    priority: 80,
    conditions: [{ field: "executive_visibility", operator: "<", value: 50 }],
    recommendationTitle: "Build Executive Visibility and Thought Leadership",
    recommendationDescription: "Your contributions are invisible to global leadership. Practice proactively sharing insights, building your executive brand, and creating opportunities for strategic visibility.",
    recommendationType: "single_dimension_visibility",
    actionCheckInDays: 14,
    outcomeCheckInDays: 45,
    explanationTemplate: "Executive Visibility score of {score} indicates a critical gap. Your capability is being underestimated due to low visibility.",
  },
  // Accountability & Delegation Conversations
  {
    ruleCode: "ECI_SD_AC_LOW",
    displayName: "Accountability Conversations — Critical Gap",
    description: "Accountability Conversations score below 50 — avoids difficult conversations, allows broken commitments.",
    moduleType: "ECI",
    dimensionId: "accountability_conversations",
    priority: 75,
    conditions: [{ field: "accountability_conversations", operator: "<", value: 50 }],
    recommendationTitle: "Develop Direct Accountability Conversation Skills",
    recommendationDescription: "You avoid difficult accountability conversations, allowing broken commitments to persist. Practice the SBI framework, address issues immediately and specifically, and delegate with precision.",
    recommendationType: "single_dimension_accountability",
    actionCheckInDays: 7,
    outcomeCheckInDays: 30,
    explanationTemplate: "Accountability score of {score} indicates a critical gap. Avoiding difficult conversations erodes team performance.",
  },
  // Trust Creation & Alignment Conversations
  {
    ruleCode: "ECI_SD_TA_LOW",
    displayName: "Trust & Alignment — Critical Gap",
    description: "Trust Creation score below 50 — jumps to solutions, misses exploratory conversations, low psychological safety.",
    moduleType: "ECI",
    dimensionId: "trust_alignment",
    priority: 75,
    conditions: [{ field: "trust_alignment", operator: "<", value: 50 }],
    recommendationTitle: "Develop Trust-Building and Deep Listening Skills",
    recommendationDescription: "You jump to solutions quickly, missing the exploratory conversations that build trust. Practice listening to understand (not to respond), creating psychological safety, and slowing down for deep dialogue.",
    recommendationType: "single_dimension_trust",
    actionCheckInDays: 14,
    outcomeCheckInDays: 45,
    explanationTemplate: "Trust Creation score of {score} indicates a critical gap. Without trust, team engagement and innovation suffer.",
  },
];

const CROSS_DIMENSIONAL_RULES = [
  {
    ruleCode: "ECI_XCD_001",
    displayName: "High Expertise, Low Presence",
    description: "Strategic clarity is strong but executive presence is insufficient. Expertise is masked by low authority.",
    moduleType: "ECI",
    dimensionId: null,
    priority: 90,
    conditions: [
      { field: "confidence_authority", operator: "<", value: 50 },
      { field: "gravitas_composure", operator: "<", value: 60 },
      { field: "strategic_clarity", operator: ">", value: 75 },
    ],
    recommendationTitle: "Develop Executive Presence to Match Your Strategic Capability",
    recommendationDescription: "Your strategic thinking is strong, but your communication lacks the authority and presence needed for enterprise leadership. Focus on opinion-first communication drills, authority language coaching, and executive simulation practice.",
    recommendationType: "cross_dimensional_presence_gap",
    actionCheckInDays: 7,
    outcomeCheckInDays: 30,
    explanationTemplate: "High strategic clarity ({strategic_clarity}) but low confidence ({confidence_authority}) and gravitas ({gravitas_composure}). Expertise is masked by insufficient executive presence.",
  },
  {
    ruleCode: "ECI_XCD_002",
    displayName: "Operational Expert",
    description: "Trusted operator but not a visionary leader. Influence is transactional, not transformational.",
    moduleType: "ECI",
    dimensionId: null,
    priority: 85,
    conditions: [
      { field: "storytelling_vision", operator: "<", value: 50 },
      { field: "executive_framing", operator: "<", value: 60 },
      { field: "stakeholder_influence", operator: ">", value: 70 },
    ],
    recommendationTitle: "Develop Narrative and Vision Communication Capability",
    recommendationDescription: "You are trusted as an operator but not yet seen as a visionary leader. Develop storytelling skills, integrate data with narrative, and practice communicating the 'why' before the 'what' to inspire strategic action.",
    recommendationType: "cross_dimensional_vision_gap",
    actionCheckInDays: 14,
    outcomeCheckInDays: 45,
    explanationTemplate: "Strong influence ({stakeholder_influence}) but weak storytelling ({storytelling_vision}) and framing ({executive_framing}). Trusted operator, not yet a visionary.",
  },
  {
    ruleCode: "ECI_XCD_003",
    displayName: "Hidden Executive",
    description: "Capability exceeds reputation. Primary development priority is visibility, not skill.",
    moduleType: "ECI",
    dimensionId: null,
    priority: 88,
    conditions: [
      { field: "strategic_clarity", operator: ">", value: 75 },
      { field: "gravitas_composure", operator: ">", value: 75 },
      { field: "stakeholder_influence", operator: ">", value: 75 },
      { field: "executive_visibility", operator: "<", value: 60 },
    ],
    recommendationTitle: "Increase Executive Visibility to Match Your Capability",
    recommendationDescription: "Your communication capability exceeds your visibility. Your primary development priority is not skill but exposure. Proactively share insights with global leadership, build your executive brand, and create opportunities for strategic visibility.",
    recommendationType: "cross_dimensional_visibility_gap",
    actionCheckInDays: 14,
    outcomeCheckInDays: 45,
    explanationTemplate: "All pillars strong (Clarity {strategic_clarity}, Gravitas {gravitas_composure}, Influence {stakeholder_influence}) but visibility is low ({executive_visibility}). Capability exceeds reputation.",
  },
  {
    ruleCode: "ECI_XCD_004",
    displayName: "Political Blind Spot",
    description: "Persuades individuals but fails to build organisational coalitions.",
    moduleType: "ECI",
    dimensionId: null,
    priority: 82,
    conditions: [
      { field: "stakeholder_influence", operator: ">", value: 80 },
      { field: "political_intelligence", operator: "<", value: 55 },
    ],
    recommendationTitle: "Develop Political Intelligence to Complement Your Influence Skills",
    recommendationDescription: "You persuade individuals effectively but miss broader organisational dynamics. Develop political intelligence by mapping informal influence networks, anticipating stakeholder reactions, and building coalitions before major decisions.",
    recommendationType: "cross_dimensional_political_gap",
    actionCheckInDays: 7,
    outcomeCheckInDays: 30,
    explanationTemplate: "Strong individual influence ({stakeholder_influence}) but weak political intelligence ({political_intelligence}). Persuades individuals, misses systemic dynamics.",
  },
  {
    ruleCode: "ECI_XCD_005",
    displayName: "Invisible Expert",
    description: "Deep expertise invisible to senior leadership due to low visibility and insufficient authority.",
    moduleType: "ECI",
    dimensionId: null,
    priority: 87,
    conditions: [
      { field: "strategic_clarity", operator: ">", value: 70 },
      { field: "executive_visibility", operator: "<", value: 50 },
      { field: "confidence_authority", operator: "<", value: 60 },
    ],
    recommendationTitle: "Build Executive Visibility and Communication Authority",
    recommendationDescription: "Your expertise is not visible to senior leadership. Build your executive brand by proactively sharing insights, speaking up in leadership forums, and developing opinion-first communication that commands attention.",
    recommendationType: "cross_dimensional_invisible_expert",
    actionCheckInDays: 14,
    outcomeCheckInDays: 45,
    explanationTemplate: "Good strategic clarity ({strategic_clarity}) but low visibility ({executive_visibility}) and authority ({confidence_authority}). Expertise is invisible.",
  },
  {
    ruleCode: "ECI_XCD_006",
    displayName: "Executive Presence Gap",
    description: "Influences through relationships rather than presence. Trusted personally but doesn't command authority.",
    moduleType: "ECI",
    dimensionId: null,
    priority: 80,
    conditions: [
      { field: "gravitas_composure", operator: "<", value: 55 },
      { field: "confidence_authority", operator: "<", value: 55 },
      { field: "stakeholder_influence", operator: ">", value: 65 },
    ],
    recommendationTitle: "Develop Executive Presence for Senior Leadership Forums",
    recommendationDescription: "You influence through relationships but don't yet command authority in senior forums. Develop gravitas through executive simulation practice, composure under pressure training, and authority language coaching.",
    recommendationType: "cross_dimensional_presence_gap",
    actionCheckInDays: 7,
    outcomeCheckInDays: 30,
    explanationTemplate: "Good influence ({stakeholder_influence}) but low gravitas ({gravitas_composure}) and authority ({confidence_authority}). Influences through relationships, not presence.",
  },
];

const ALL_RULES = [...SINGLE_DIMENSION_RULES, ...CROSS_DIMENSIONAL_RULES];

// ── Seed function ─────────────────────────────────────────────────────────────

async function seed() {
  const conn = await mysql.createConnection(DATABASE_URL);
  console.log("Connected to database. Seeding ECI judgment rules...");

  let inserted = 0;
  let updated = 0;

  for (const rule of ALL_RULES) {
    // Check if rule exists by ruleCode
    const [existing] = await conn.execute(
      "SELECT id FROM ic_judgment_rules WHERE ruleCode = ?",
      [rule.ruleCode]
    );

    let ruleId;

    if (existing.length > 0) {
      // Update existing rule
      ruleId = existing[0].id;
      await conn.execute(
        `UPDATE ic_judgment_rules SET
          displayName = ?, description = ?, moduleType = ?, dimensionId = ?,
          priority = ?, status = 'active', updatedAt = NOW()
        WHERE id = ?`,
        [
          rule.displayName,
          rule.description ?? null,
          rule.moduleType,
          rule.dimensionId ?? null,
          rule.priority,
          ruleId,
        ]
      );
      updated++;
    } else {
      // Insert new rule
      const [result] = await conn.execute(
        `INSERT INTO ic_judgment_rules
          (ruleCode, displayName, description, moduleType, dimensionId, priority, status)
        VALUES (?, ?, ?, ?, ?, ?, 'active')`,
        [
          rule.ruleCode,
          rule.displayName,
          rule.description ?? null,
          rule.moduleType,
          rule.dimensionId ?? null,
          rule.priority,
        ]
      );
      ruleId = result.insertId;
      inserted++;
    }

    // Deactivate previous versions for this rule
    await conn.execute(
      "UPDATE ic_judgment_rule_versions SET status = 'superseded' WHERE ruleId = ? AND status = 'active'",
      [ruleId]
    );

      // Insert new active version
    await conn.execute(
      `INSERT INTO ic_judgment_rule_versions
        (ruleId, version, conditions, recommendationTitle, recommendationDescription,
         recommendationType, actionCheckInDays, outcomeCheckInDays, explanationTemplate, status)
      VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [
        ruleId,
        JSON.stringify(rule.conditions),
        rule.recommendationTitle,
        rule.recommendationDescription,
        rule.recommendationType,
        rule.actionCheckInDays,
        rule.outcomeCheckInDays,
        rule.explanationTemplate ?? null,
      ]
    );
  }

  console.log(`Seeding complete: ${inserted} new rules inserted, ${updated} rules updated.`);
  console.log(`Total ECI rules active: ${ALL_RULES.length}`);

  await conn.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
