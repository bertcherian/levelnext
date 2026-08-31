import mysql from "mysql2/promise";

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const token = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
const email = `engineering-demo-proof-${token}@example.invalid`;
const dedupeKey = `engineering_demo:${email}`;

try {
  await connection.beginTransaction();
  await connection.execute(
    `INSERT INTO lead_captures
      (email, name, company, source, moduleCode, consentAt, consentTextVersion, demoDedupeKey)
     VALUES (?, ?, ?, 'engineering_demo', 'ei_demo', NOW(), 'demo_contact_v1', ?)`,
    [email, "Rollback-only verification", "LevelNext internal verification", dedupeKey],
  );

  let duplicateRejected = false;
  try {
    await connection.execute(
      `INSERT INTO lead_captures
        (email, name, company, source, moduleCode, consentAt, consentTextVersion, demoDedupeKey)
       VALUES (?, ?, ?, 'engineering_demo', 'ei_demo', NOW(), 'demo_contact_v1', ?)`,
      [email, "Rollback-only verification", "LevelNext internal verification", dedupeKey],
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    duplicateRejected = message.includes("Duplicate") || message.includes("1062");
  }

  const [rows] = await connection.execute(
    "SELECT COUNT(*) AS count FROM lead_captures WHERE demoDedupeKey = ?",
    [dedupeKey],
  );
  const count = Number(rows[0]?.count ?? 0);
  if (!duplicateRejected || count !== 1) {
    throw new Error(`Demo lead deduplication verification failed: duplicateRejected=${duplicateRejected}, count=${count}`);
  }

  console.log(JSON.stringify({ ok: true, duplicateRejected, count, persistedRows: 0, mode: "rollback_only" }));
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await connection.rollback().catch(() => undefined);
  await connection.end();
}
