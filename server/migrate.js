import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

const db = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

console.log("✅ Connected. Running migrations...");
   // Create base tables first
await db.execute(`CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  hashed_password VARCHAR(255),
  phone VARCHAR(20) DEFAULT NULL,
  department VARCHAR(100) DEFAULT NULL,
  portal_role ENUM('admin','user') DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

await db.execute(`CREATE TABLE IF NOT EXISTS tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id VARCHAR(50) DEFAULT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(100) DEFAULT 'open',
  priority VARCHAR(50) DEFAULT 'medium',
  department VARCHAR(100) DEFAULT NULL,
  user_email VARCHAR(255) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  resolved_at DATETIME DEFAULT NULL
)`);

console.log("✅ Base tables ready.");

// Helper: check if column exists
async function columnExists(table, column) {
  const [rows] = await db.execute(
    `SELECT COUNT(*) as cnt FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [process.env.DB_NAME, table, column]
  );
  return rows[0].cnt > 0;
}

// Add column only if not exists
async function addColumn(table, column, definition) {
  const exists = await columnExists(table, column);
  if (exists) {
    console.log(`ℹ️  Column ${table}.${column} already exists, skipping.`);
    return;
  }
  await db.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  console.log(`✅ Added column ${table}.${column}`);
}

// Run alterations
await addColumn("users", "phone", "VARCHAR(20) DEFAULT NULL");
await addColumn("users", "department", "VARCHAR(100) DEFAULT NULL");
await addColumn("users", "hashed_password", "VARCHAR(255) DEFAULT NULL");
await addColumn("users", "portal_role", "ENUM('admin','user') DEFAULT 'user'");
await addColumn("tickets", "user_email", "VARCHAR(255) DEFAULT NULL");
await addColumn("tickets", "ticket_id", "VARCHAR(50) DEFAULT NULL");

// Create tables
const createStatements = [
  `CREATE TABLE IF NOT EXISTS ticket_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    author_name VARCHAR(255) NOT NULL,
    author_email VARCHAR(255) DEFAULT NULL,
    author_role ENUM('admin','user') DEFAULT 'admin',
    body TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS ticket_status_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    event_type VARCHAR(50) DEFAULT 'status',
    changed_by VARCHAR(255) DEFAULT NULL,
    actor_email VARCHAR(255) DEFAULT NULL,
    actor_role VARCHAR(50) DEFAULT NULL,
    field_name VARCHAR(100) DEFAULT NULL,
    from_status VARCHAR(100) DEFAULT NULL,
    to_status VARCHAR(100) NOT NULL,
    from_value TEXT DEFAULT NULL,
    to_value TEXT DEFAULT NULL,
    note TEXT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
  )`,
];

for (const sql of createStatements) {
  try {
    await db.execute(sql);
    console.log("✅ Table created (or already exists):", sql.match(/TABLE IF NOT EXISTS (\w+)/)?.[1]);
  } catch (err) {
    console.warn("⚠️  Error creating table:", err.message);
  }
}

await db.end();
console.log("✅ Migration complete.");
