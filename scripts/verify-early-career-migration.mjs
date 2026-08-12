import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required for migration verification.");

const sourceRoot = process.cwd();
const migrationSql = await readFile(join(sourceRoot, "drizzle", "0056_nebulous_the_fallen.sql"), "utf8");
const migrationFolder = await mkdtemp(join(tmpdir(), "early-career-migration-"));
const metaFolder = join(migrationFolder, "meta");
const verificationProductId = "early_career_verify";
const verificationLedger = "__early_career_verify_migrations";

// The verification runs the exact production migration through Drizzle, but with
// a temporary table/product namespace. This prevents test DDL from touching
// live Early Career records while still proving the migration path and ledger.
const replacementPairs = [
  ["early_career_manager_nudges", "ec_verify_nudges"],
  ["early_career_commitments", "ec_verify_commitments"],
  ["early_career_evidence", "ec_verify_evidence"],
  ["early_career_profiles", "ec_verify_profiles"],
  ["early_career_intelligence", verificationProductId],
  ["EARLY_CAREER'", "EARLY_CAREER_VERIFY'"],
  ["ec_ev_commitment_fk", "verify_ev_commitment_fk"],
  ["ec_mn_manager_fk", "verify_mn_manager_fk"],
  ["ec_mn_employee_fk", "verify_mn_employee_fk"],
  ["ec_mn_tenant_fk", "verify_mn_tenant_fk"],
  ["ec_profile_user_fk", "verify_profile_user_fk"],
  ["ec_profile_tenant_fk", "verify_profile_tenant_fk"],
  ["ec_profile_manager_fk", "verify_profile_manager_fk"],
];
const verificationSql = replacementPairs.reduce((sql, [from, to]) => sql.replaceAll(from, to), migrationSql);
const verificationHash = createHash("sha256").update(verificationSql).digest("hex");
const verifyConnection = await mysql.createConnection({ uri: databaseUrl, multipleStatements: true });

try {
  await mkdir(metaFolder);
  await writeFile(join(migrationFolder, "0000_verify_early_career.sql"), verificationSql);
  await writeFile(
    join(metaFolder, "_journal.json"),
    JSON.stringify(
      {
        version: "7",
        dialect: "mysql",
        entries: [{ idx: 0, version: "5", when: 1786528328115, tag: "0000_verify_early_career", breakpoints: true }],
      },
      null,
      2
    )
  );

  const migrationDb = drizzle(verifyConnection);
  await migrate(migrationDb, { migrationsFolder: migrationFolder, migrationsTable: verificationLedger });

  const [tables] = await verifyConnection.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name IN ('ec_verify_profiles', 'ec_verify_commitments', 'ec_verify_evidence', 'ec_verify_nudges') ORDER BY table_name"
  );
  const [indexes] = await verifyConnection.query("SHOW INDEX FROM ec_verify_profiles");
  const [products] = await verifyConnection.query("SELECT id FROM products WHERE id = 'early_career_verify'");
  const [modules] = await verifyConnection.query("SELECT moduleCode FROM product_modules WHERE productId = 'early_career_verify' AND moduleCode = 'EARLY_CAREER_VERIFY'");
  const [ledger] = await verifyConnection.query(`SELECT hash FROM \`${verificationLedger}\``);

  const expectedTables = ["ec_verify_commitments", "ec_verify_evidence", "ec_verify_nudges", "ec_verify_profiles"];
  if (tables.length !== expectedTables.length || expectedTables.some((name, index) => tables[index].table_name !== name)) {
    throw new Error(`Expected verification tables were not created: ${JSON.stringify(tables)}`);
  }
  if (!indexes.some((index) => index.Key_name === "ec_verify_profiles_user_unique" && index.Non_unique === 0)) {
    throw new Error("The unique Early Career profile index was not created.");
  }
  if (products.length !== 1 || modules.length !== 1) {
    throw new Error("The Early Career product seed was not applied.");
  }
  if (!ledger.some((entry) => entry.hash === verificationHash)) {
    throw new Error("Drizzle did not record the Early Career migration in the verification ledger.");
  }

  console.log("Early Career migration verification passed: standard Drizzle migration, schema, product seed, index, and ledger are valid.");
} finally {
  await verifyConnection.query(`DROP TABLE IF EXISTS \`ec_verify_nudges\`, \`ec_verify_evidence\`, \`ec_verify_commitments\`, \`ec_verify_profiles\`, \`${verificationLedger}\``);
  await verifyConnection.query("DELETE FROM product_modules WHERE productId = ?", [verificationProductId]);
  await verifyConnection.query("DELETE FROM products WHERE id = ?", [verificationProductId]);
  await verifyConnection.end();
  await rm(migrationFolder, { recursive: true, force: true });
}
