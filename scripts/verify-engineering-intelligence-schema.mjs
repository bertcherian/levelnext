import mysql from "mysql2/promise";

const REQUIRED_TABLES = {
  ei_agent_runs: ["id", "tenantId", "agentCode", "purposeCode", "status", "inputManifest", "traceId"],
  ei_diagnostic_sessions: ["id", "tenantId", "userId", "diagnosticVersion", "status", "currentQuestionIndex"],
  ei_diagnostic_responses: ["id", "sessionId", "tenantId", "userId", "questionCode", "answerValue"],
  ei_diagnostic_results: ["id", "sessionId", "tenantId", "userId", "engineScores", "impactRadius", "growthEdge"],
  ei_engineer_profiles: ["id", "tenantId", "userId", "roleTitle", "discipline", "engineeringLevel"],
  ei_missions: ["id", "tenantId", "userId", "title", "status", "partnerVisible"],
  ei_partner_assignments: ["id", "tenantId", "partnerUserId", "participantUserId", "status"],
  ei_partner_check_ins: ["id", "tenantId", "partnerUserId", "participantUserId", "summaryShared"],
  ei_partner_nudges: ["id", "tenantId", "partnerUserId", "participantUserId", "missionId", "dedupeKey", "status"],
};

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await connection.execute(
    `SELECT table_name AS tableName, column_name AS columnName
     FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name IN (${Object.keys(REQUIRED_TABLES).map(() => "?").join(",")})`,
    Object.keys(REQUIRED_TABLES),
  );
  const found = new Map();
  for (const row of rows) {
    if (!found.has(row.tableName)) found.set(row.tableName, new Set());
    found.get(row.tableName).add(row.columnName);
  }
  const missing = Object.entries(REQUIRED_TABLES).flatMap(([table, columns]) => columns
    .filter((column) => !found.get(table)?.has(column))
    .map((column) => `${table}.${column}`));
  if (missing.length) throw new Error(`Engineering Intelligence schema is incomplete: ${missing.join(", ")}`);
  console.log(JSON.stringify({ ok: true, verifiedTables: Object.keys(REQUIRED_TABLES), schema: "engineering_intelligence_mvp_v1" }, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await connection.end();
}
