import mysql from "mysql2/promise";

const conn = await mysql.createConnection(process.env.DATABASE_URL);

try {
  // Insert the manager_effectiveness product
  await conn.execute(`
    INSERT INTO products (id, name, tagline, coachRole, coachName, coachPrompt, accentColor, isActive, sortOrder)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, 3)
    ON DUPLICATE KEY UPDATE name = VALUES(name), tagline = VALUES(tagline)
  `, [
    "manager_effectiveness",
    "Manager Effectiveness",
    "Lead better. Every day.",
    "Management Effectiveness Coach",
    "Manager Guide",
    "You are an expert management effectiveness coach. You help managers and team leads build practical management skills, lead their teams with confidence, and create high-performing team cultures. Be direct, practical, and warm.",
    "#34d399",
  ]);
  console.log("✓ manager_effectiveness product inserted/updated");

  // Enroll admin user (id=1) in manager_effectiveness
  await conn.execute(`
    INSERT INTO user_product_enrollments (userId, productId, enrolledAt, isActive, lastActiveAt)
    VALUES (1, 'manager_effectiveness', NOW(), 1, NOW())
    ON DUPLICATE KEY UPDATE isActive = 1
  `);
  console.log("✓ Admin user enrolled in manager_effectiveness");

} catch (err) {
  console.error("Error:", err.message);
} finally {
  await conn.end();
}
