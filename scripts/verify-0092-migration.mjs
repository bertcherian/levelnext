import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await connection.query("SHOW TABLES LIKE 'ei_work_diary_entries'");
  console.log(JSON.stringify(rows));
} finally {
  await connection.end();
}
