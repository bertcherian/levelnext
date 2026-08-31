import mysql from "mysql2/promise";

const tenantId = Number(process.env.ENGINEERING_PILOT_TENANT_ID ?? "1");
const participantEmail = (process.env.ENGINEERING_PILOT_EMAIL ?? "engineering.pilot@levelnext.test").toLowerCase();
const participantName = process.env.ENGINEERING_PILOT_NAME ?? "Engineering Pilot Participant";
const partnerUserId = Number(process.env.ENGINEERING_PILOT_PARTNER_USER_ID ?? "1");
const dryRun = process.env.ENGINEERING_PILOT_DRY_RUN !== "false";
const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
  if (!Number.isInteger(tenantId) || tenantId <= 0) throw new Error("ENGINEERING_PILOT_TENANT_ID must be a positive integer.");
  if (!Number.isInteger(partnerUserId) || partnerUserId <= 0) throw new Error("ENGINEERING_PILOT_PARTNER_USER_ID must be a positive integer.");
  if (!participantEmail.endsWith(".test")) throw new Error("The pilot participant must use a non-production .test email address.");

  const [tenantRows] = await connection.execute("SELECT id, name FROM tenants WHERE id = ? LIMIT 1", [tenantId]);
  if (!tenantRows.length) throw new Error(`Tenant ${tenantId} does not exist.`);
  const [partnerRows] = await connection.execute("SELECT u.id, u.role FROM users u INNER JOIN tenant_users tu ON tu.userId = u.id WHERE u.id = ? AND tu.tenantId = ? LIMIT 1", [partnerUserId, tenantId]);
  if (!partnerRows.length || !["success_partner", "admin"].includes(partnerRows[0].role)) throw new Error("The pilot Partner must belong to the tenant and hold success_partner or admin role.");

  await connection.beginTransaction();
  const openId = `engineering-pilot:${participantEmail}`;
  await connection.execute(
    `INSERT INTO users (openId, name, email, loginMethod, role, lastSignedIn)
     VALUES (?, ?, ?, 'pilot_fixture', 'user', NOW())
     ON DUPLICATE KEY UPDATE name = VALUES(name), email = VALUES(email), loginMethod = VALUES(loginMethod), role = 'user'`,
    [openId, participantName, participantEmail],
  );
  const [userRows] = await connection.execute("SELECT id FROM users WHERE openId = ? LIMIT 1", [openId]);
  const participantUserId = userRows[0].id;
  await connection.execute(
    `INSERT INTO tenant_users (tenantId, userId, role) VALUES (?, ?, 'member')
     ON DUPLICATE KEY UPDATE role = VALUES(role)`,
    [tenantId, participantUserId],
  );
  await connection.execute(
    `INSERT INTO ei_engineer_profiles (tenantId, userId, roleTitle, discipline, engineeringLevel, aspiration)
     VALUES (?, ?, 'Pilot Software Engineer', 'Engineering Intelligence pilot', 'Pilot', 'Validate the participant walkthrough safely')
     ON DUPLICATE KEY UPDATE roleTitle = VALUES(roleTitle), discipline = VALUES(discipline), engineeringLevel = VALUES(engineeringLevel), aspiration = VALUES(aspiration)`,
    [tenantId, participantUserId],
  );
  await connection.execute(
    `INSERT INTO ei_partner_assignments (tenantId, partnerUserId, participantUserId, status)
     VALUES (?, ?, ?, 'active') ON DUPLICATE KEY UPDATE assignedAt = assignedAt`,
    [tenantId, partnerUserId, participantUserId],
  );

  const [counts] = await connection.execute(
    `SELECT
      (SELECT COUNT(*) FROM users WHERE openId = ?) AS pilotUsers,
      (SELECT COUNT(*) FROM tenant_users WHERE tenantId = ? AND userId = ?) AS memberships,
      (SELECT COUNT(*) FROM ei_engineer_profiles WHERE tenantId = ? AND userId = ?) AS profiles,
      (SELECT COUNT(*) FROM ei_partner_assignments WHERE tenantId = ? AND partnerUserId = ? AND participantUserId = ? AND status = 'active') AS assignments`,
    [openId, tenantId, participantUserId, tenantId, participantUserId, tenantId, partnerUserId, participantUserId],
  );
  const expected = { pilotUsers: 1, memberships: 1, profiles: 1, assignments: 1 };
  const actual = Object.fromEntries(Object.entries(counts[0]).map(([key, value]) => [key, Number(value)]));
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`Pilot fixture verification failed: ${JSON.stringify({ actual, expected })}`);

  if (dryRun) await connection.rollback();
  else await connection.commit();
  console.log(JSON.stringify({ ok: true, dryRun, tenantId, tenantName: tenantRows[0].name, participantEmail, participantUserId, partnerUserId, verifiedCounts: actual, nextStep: dryRun ? "Run with ENGINEERING_PILOT_DRY_RUN=false to persist the dedicated test participant." : "Sign in as the dedicated pilot participant and open /engineering/diagnostic." }, null, 2));
} catch (error) {
  await connection.rollback();
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await connection.end();
}
