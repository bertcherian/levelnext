import mysql2 from "mysql2/promise";

const url = process.env.DATABASE_URL;
const conn = await mysql2.createConnection(url);

try {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS \`brand_strategies\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`userId\` int NOT NULL,
      \`linkedinHeadline\` text,
      \`linkedinSummary\` text,
      \`linkedinAboutSection\` text,
      \`brandStatement\` text,
      \`uniqueValueProposition\` text,
      \`targetAudience\` text,
      \`thoughtLeadershipPillars\` json,
      \`contentCalendar\` json,
      \`visibilityPlan\` json,
      \`careerNarrative\` text,
      \`elevatorPitch\` text,
      \`executiveBio\` text,
      \`createdAt\` timestamp NOT NULL DEFAULT (now()),
      \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT \`brand_strategies_id\` PRIMARY KEY(\`id\`)
    )
  `);
  console.log("✓ brand_strategies table created");

  await conn.query(`
    CREATE TABLE IF NOT EXISTS \`outreach_drafts\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`userId\` int NOT NULL,
      \`contactId\` int,
      \`contactName\` varchar(200) NOT NULL,
      \`contactTitle\` varchar(200),
      \`contactCompany\` varchar(200),
      \`outreachGoal\` varchar(100),
      \`linkedinMessage\` text,
      \`emailSubject\` text,
      \`emailBody\` text,
      \`warmIntroRequest\` text,
      \`followUpMessage\` text,
      \`meetingAgenda\` json,
      \`talkingPoints\` json,
      \`questionsToAsk\` json,
      \`thingsToAvoid\` json,
      \`desiredOutcome\` text,
      \`followUpPlan\` text,
      \`status\` varchar(30) NOT NULL DEFAULT 'draft',
      \`sentAt\` timestamp,
      \`responseReceived\` boolean DEFAULT false,
      \`userNotes\` text,
      \`createdAt\` timestamp NOT NULL DEFAULT (now()),
      \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT \`outreach_drafts_id\` PRIMARY KEY(\`id\`)
    )
  `);
  console.log("✓ outreach_drafts table created");

} finally {
  await conn.end();
}
