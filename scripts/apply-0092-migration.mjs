import mysql from "mysql2/promise";
import fs from "node:fs";
import dotenv from "dotenv";

dotenv.config();

const migrationPath = new URL("../drizzle/0092_freezing_dazzler.sql", import.meta.url);
const sql = fs.readFileSync(migrationPath, "utf8");
const statements = sql
  .split("--> statement-breakpoint")
  .map((statement) => statement.trim())
  .filter(Boolean);

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  for (const statement of statements) {
    await connection.query(statement);
  }
  console.log(`Applied ${statements.length} migration statements.`);
} finally {
  await connection.end();
}
