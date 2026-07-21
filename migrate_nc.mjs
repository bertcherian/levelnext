import { createConnection } from 'mysql2/promise';

const url = process.env.DATABASE_URL;
const conn = await createConnection(url);

// TiDB doesn't support DEFAULT (expression) for json columns — use DEFAULT NULL
const sqls = [
  // next_chapter_profiles — note: no DEFAULT ('[]') for json in TiDB
  `CREATE TABLE IF NOT EXISTS next_chapter_profiles (
    id int AUTO_INCREMENT NOT NULL,
    userId int NOT NULL,
    currentStage int NOT NULL DEFAULT 1,
    currentModule int NOT NULL DEFAULT 1,
    completedModules json,
    journeyCompleted boolean NOT NULL DEFAULT false,
    startedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lastActiveAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT next_chapter_profiles_id PRIMARY KEY(id),
    CONSTRAINT next_chapter_profiles_userId_unique UNIQUE(userId)
  )`,
];

for (const sql of sqls) {
  try {
    await conn.execute(sql);
    console.log('OK:', sql.substring(0, 60).replace(/\n/g, ' '));
  } catch (e) {
    console.log('ERR:', e.message.substring(0, 120));
  }
}

// FK for next_chapter_profiles
try {
  await conn.execute(
    `ALTER TABLE next_chapter_profiles ADD CONSTRAINT nc_profiles_user_fk FOREIGN KEY (userId) REFERENCES users(id)`
  );
  console.log('FK next_chapter_profiles OK');
} catch (e) {
  console.log('FK skip:', e.message.substring(0, 80));
}

await conn.end();
console.log('Done');
