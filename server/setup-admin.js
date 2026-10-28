/**
 * setup-admin.js
 *
 * One-time script to create (or reset) the master admin account in the
 * Aiven MySQL database. Run this locally or on Render via a one-off job:
 *
 *   node server/setup-admin.js
 *
 * It is idempotent — running it multiple times is safe.
 */

import dotenv from "dotenv";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BCRYPT_ROUNDS = 8;

// ─── Admin credentials (change these to what you want to log in with) ────────
const ADMIN_NAME     = "Jatin Singh Tanwar";
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL || "jatinsinghtanwar783@gmail.com";
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "#Jatin@123";  // ← the password you are trying to use
// ─────────────────────────────────────────────────────────────────────────────

const certPath = path.join(__dirname, "certs", "aiven-ca.pem");
const sslConfig = fs.existsSync(certPath)
  ? { ca: fs.readFileSync(certPath), rejectUnauthorized: true }
  : undefined;

const db = await mysql.createConnection({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port:     Number(process.env.DB_PORT) || 3306,
  ssl:      sslConfig,
  multipleStatements: false,
});

console.log("✅ Connected to Aiven MySQL");

// ── Ensure required columns exist ────────────────────────────────────────────
async function addColumnIfMissing(table, column, definition) {
  const [rows] = await db.execute(
    `SELECT COUNT(*) AS cnt
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [process.env.DB_NAME, table, column]
  );
  if (rows[0].cnt === 0) {
    await db.execute(`ALTER TABLE \`${table}\` ADD COLUMN ${column} ${definition}`);
    console.log(`  ✅ Added ${table}.${column}`);
  }
}

// These must exist before we can INSERT the admin row
await addColumnIfMissing("users", "username",           "VARCHAR(255) DEFAULT NULL");
await addColumnIfMissing("users", "role",               "VARCHAR(100) DEFAULT 'user'");
await addColumnIfMissing("users", "team",               "VARCHAR(100) DEFAULT NULL");
await addColumnIfMissing("users", "status",             "VARCHAR(50) DEFAULT 'Available'");
await addColumnIfMissing("users", "avatar_color",       "VARCHAR(20) DEFAULT '#0f172a'");
await addColumnIfMissing("users", "portal_role",        "ENUM('admin','user','it_staff') DEFAULT 'user'");
await addColumnIfMissing("users", "email_verified",     "TINYINT(1) NOT NULL DEFAULT 1");
await addColumnIfMissing("users", "login_otp_hash",     "VARCHAR(255) DEFAULT NULL");
await addColumnIfMissing("users", "login_otp_expires_at","DATETIME DEFAULT NULL");
await addColumnIfMissing("users", "reset_otp_hash",     "VARCHAR(255) DEFAULT NULL");
await addColumnIfMissing("users", "reset_otp_expires_at","DATETIME DEFAULT NULL");
await addColumnIfMissing("users", "reset_otp_sent_at",  "DATETIME DEFAULT NULL");

// ── Upsert the admin user ─────────────────────────────────────────────────────
const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_ROUNDS);

await db.execute(
  `INSERT INTO users
     (name, email, username, hashed_password, role, team, status, avatar_color, portal_role, email_verified)
   VALUES (?, ?, ?, ?, 'Administrator', '', 'Available', '#0f172a', 'admin', 1)
   ON DUPLICATE KEY UPDATE
     name            = VALUES(name),
     username        = VALUES(username),
     hashed_password = VALUES(hashed_password),
     role            = VALUES(role),
     portal_role     = VALUES(portal_role),
     email_verified  = 1,
     login_otp_hash  = NULL,
     login_otp_expires_at = NULL`,
  [ADMIN_NAME, ADMIN_EMAIL, ADMIN_USERNAME, passwordHash]
);

console.log(`✅ Admin user upserted: ${ADMIN_EMAIL}`);

// ── Verify ────────────────────────────────────────────────────────────────────
const [check] = await db.execute(
  "SELECT id, name, email, username, role, portal_role, email_verified FROM users WHERE LOWER(email) = LOWER(?)",
  [ADMIN_EMAIL]
);
console.table(check);

await db.end();
console.log("✅ Done. You can now log in with:");
console.log(`   Email:    ${ADMIN_EMAIL}`);
console.log(`   Password: ${ADMIN_PASSWORD}`);
