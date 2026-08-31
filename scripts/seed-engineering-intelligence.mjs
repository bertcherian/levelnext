import mysql from "mysql2/promise";

function requiredEnv(name) {
  const value = process.env[name];
  if (!value || !/^\d+$/.test(value)) throw new Error(`${name} must be a positive numeric environment variable.`);
  return Number(value);
}

function answerFor(index) {
  return [4, 3, 4, 3, 4, 3, 4, 4, 3, 4, 5, 4][index] ?? 3;
}

const QUESTION_CODES = [
  "self_reflection", "self_followthrough", "collaboration_listening", "collaboration_alignment",
  "problem_framing", "problem_experimentation", "systems_tradeoffs", "systems_leverage",
  "business_context", "business_influence", "ai_verification", "ai_responsibility",
];
const tenantId = requiredEnv("ENGINEERING_TENANT_ID");
const participantUserId = requiredEnv("ENGINEERING_PARTICIPANT_USER_ID");
const partnerUserId = requiredEnv("ENGINEERING_PARTNER_USER_ID");
const dryRun = process.env.ENGINEERING_SEED_DRY_RUN === "true";
const verifyIdempotency = process.env.ENGINEERING_SEED_VERIFY_IDEMPOTENCY === "true";
const connection = await mysql.createConnection(process.env.DATABASE_URL);

async function requireMembership(userId, label) {
  const [rows] = await connection.execute(
    "SELECT tu.userId, u.role FROM tenant_users tu INNER JOIN users u ON u.id = tu.userId WHERE tu.tenantId = ? AND tu.userId = ? LIMIT 1",
    [tenantId, userId],
  );
  if (!rows.length) throw new Error(`${label} user ${userId} is not a member of tenant ${tenantId}.`);
  return rows[0];
}

async function seedFixture() {
  await connection.execute(
    `INSERT INTO ei_engineer_profiles (tenantId, userId, roleTitle, discipline, engineeringLevel, aspiration)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE roleTitle = VALUES(roleTitle), discipline = VALUES(discipline), engineeringLevel = VALUES(engineeringLevel), aspiration = VALUES(aspiration)`,
    [tenantId, participantUserId, "Senior Software Engineer", "Platform engineering", "Senior", "Build greater cross-team systems impact"],
  );

  const [sessionRows] = await connection.execute(
    "SELECT id FROM ei_diagnostic_sessions WHERE tenantId = ? AND userId = ? AND diagnosticVersion = ? ORDER BY id DESC LIMIT 1",
    [tenantId, participantUserId, "engineering_mvp_seed_v1"],
  );
  let sessionId = sessionRows[0]?.id;
  if (!sessionId) {
    const [inserted] = await connection.execute(
      "INSERT INTO ei_diagnostic_sessions (tenantId, userId, diagnosticVersion, status, currentQuestionIndex, completedAt) VALUES (?, ?, ?, 'completed', ?, NOW())",
      [tenantId, participantUserId, "engineering_mvp_seed_v1", QUESTION_CODES.length - 1],
    );
    sessionId = inserted.insertId;
  }

  for (const [index, questionCode] of QUESTION_CODES.entries()) {
    await connection.execute(
      `INSERT INTO ei_diagnostic_responses (sessionId, tenantId, userId, questionCode, answerValue)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE answerValue = VALUES(answerValue), answeredAt = NOW()`,
      [sessionId, tenantId, participantUserId, questionCode, answerFor(index)],
    );
  }

  const engineScores = { self: 70, collaboration: 70, problem: 70, systems: 80, business: 70, human_ai_judgment: 90 };
  const growthEdge = { engine: "self", statement: "Build greater range in self-leadership through one practical workplace experiment." };
  await connection.execute(
    `INSERT INTO ei_diagnostic_results (sessionId, tenantId, userId, diagnosticVersion, engineScores, impactRadius, impactPattern, growthEdge, scoringMethodVersion)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE engineScores = VALUES(engineScores), impactRadius = VALUES(impactRadius), impactPattern = VALUES(impactPattern), growthEdge = VALUES(growthEdge), scoringMethodVersion = VALUES(scoringMethodVersion)`,
    [sessionId, tenantId, participantUserId, "engineering_mvp_seed_v1", JSON.stringify(engineScores), "organisation", "Judicious augmenter", JSON.stringify(growthEdge), "deterministic_mvp_v1"],
  );

  const [resultRows] = await connection.execute("SELECT id FROM ei_diagnostic_results WHERE sessionId = ? LIMIT 1", [sessionId]);
  const resultId = resultRows[0].id;
  const [missionRows] = await connection.execute("SELECT id FROM ei_missions WHERE sourceResultId = ? LIMIT 1", [resultId]);
  let missionId = missionRows[0]?.id;
  if (!missionId) {
    const [inserted] = await connection.execute(
      `INSERT INTO ei_missions (tenantId, userId, sourceResultId, title, description, status, dueAt, partnerVisible)
       VALUES (?, ?, ?, ?, ?, 'accepted', DATE_ADD(NOW(), INTERVAL 7 DAY), true)`,
      [tenantId, participantUserId, resultId, "Test a clearer architecture decision", "Before the next architecture discussion, ask one evidence-seeking question before committing to a design direction."],
    );
    missionId = inserted.insertId;
  }

  await connection.execute(
    `INSERT INTO ei_partner_assignments (tenantId, partnerUserId, participantUserId, status)
     VALUES (?, ?, ?, 'active') ON DUPLICATE KEY UPDATE assignedAt = assignedAt`,
    [tenantId, partnerUserId, participantUserId],
  );

  const seedDedupeKey = `seed:${tenantId}:${partnerUserId}:${participantUserId}:architecture-mission`;
  await connection.execute(
    `INSERT INTO ei_partner_nudges (tenantId, partnerUserId, participantUserId, missionId, reasonCode, objective, whyNow, suggestedQuestion, recommendedChannel, effort, urgency, priorityScore, permittedContextKeys, dedupeKey)
     VALUES (?, ?, ?, ?, 'mission_due', ?, ?, ?, 'in_app', 'low', 'medium', 70, ?, ?)
     ON DUPLICATE KEY UPDATE objective = VALUES(objective), whyNow = VALUES(whyNow), suggestedQuestion = VALUES(suggestedQuestion), updatedAt = NOW()`,
    [tenantId, partnerUserId, participantUserId, missionId, "Offer a brief, participant-led coaching check-in.", "A participant-shared Mission is active and approaching its focus window.", "What would make your next step on this architecture decision feel more workable this week?", JSON.stringify(["participant_name", "shared_mission"]), seedDedupeKey],
  );
  return { sessionId, resultId, missionId, seedDedupeKey };
}

async function getFixtureCounts(seed) {
  const [[session]] = await connection.execute("SELECT COUNT(*) AS count FROM ei_diagnostic_sessions WHERE id = ?", [seed.sessionId]);
  const [[responses]] = await connection.execute("SELECT COUNT(*) AS count FROM ei_diagnostic_responses WHERE sessionId = ?", [seed.sessionId]);
  const [[result]] = await connection.execute("SELECT COUNT(*) AS count FROM ei_diagnostic_results WHERE sessionId = ?", [seed.sessionId]);
  const [[mission]] = await connection.execute("SELECT COUNT(*) AS count FROM ei_missions WHERE sourceResultId = ?", [seed.resultId]);
  const [[assignment]] = await connection.execute("SELECT COUNT(*) AS count FROM ei_partner_assignments WHERE tenantId = ? AND partnerUserId = ? AND participantUserId = ? AND status = 'active'", [tenantId, partnerUserId, participantUserId]);
  const [[nudge]] = await connection.execute("SELECT COUNT(*) AS count FROM ei_partner_nudges WHERE dedupeKey = ?", [seed.seedDedupeKey]);
  return { session: Number(session.count), responses: Number(responses.count), result: Number(result.count), mission: Number(mission.count), assignment: Number(assignment.count), nudge: Number(nudge.count) };
}

try {
  const [tenant] = await connection.execute("SELECT id FROM tenants WHERE id = ? LIMIT 1", [tenantId]);
  if (!tenant.length) throw new Error(`Tenant ${tenantId} does not exist.`);
  await requireMembership(participantUserId, "Participant");
  const partner = await requireMembership(partnerUserId, "Success Partner");
  if (!["success_partner", "admin"].includes(partner.role)) throw new Error(`Partner user ${partnerUserId} must have success_partner or admin role.`);

  await connection.beginTransaction();
  const firstPass = await seedFixture();
  let idempotency = null;
  if (verifyIdempotency) {
    const before = await getFixtureCounts(firstPass);
    const secondPass = await seedFixture();
    const after = await getFixtureCounts(secondPass);
    const expected = { session: 1, responses: QUESTION_CODES.length, result: 1, mission: 1, assignment: 1, nudge: 1 };
    if (JSON.stringify(before) !== JSON.stringify(expected) || JSON.stringify(after) !== JSON.stringify(expected)) {
      throw new Error(`Seed idempotency assertion failed: ${JSON.stringify({ before, after, expected })}`);
    }
    idempotency = { verified: true, before, after };
  }

  const rollbackOnly = dryRun || verifyIdempotency;
  if (rollbackOnly) await connection.rollback();
  else await connection.commit();
  console.log(JSON.stringify({ ok: true, rollbackOnly, tenantId, participantUserId, partnerUserId, ...firstPass, seededQuestionCount: QUESTION_CODES.length, idempotency }, null, 2));
} catch (error) {
  await connection.rollback();
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await connection.end();
}
