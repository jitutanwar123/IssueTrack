import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { hashPassword } from "./auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverRoot = path.resolve(__dirname, "..");
const dataDir = path.join(serverRoot, "data");
const dbPath = path.join(dataDir, "tickets.db");

fs.mkdirSync(dataDir, { recursive: true });

export const db = new DatabaseSync(dbPath);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Agent',
    team TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'Available',
    avatar_color TEXT DEFAULT '#0f172a',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT NOT NULL,
    sub_category TEXT DEFAULT '',
    priority TEXT NOT NULL,
    status TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    requester_email TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    department TEXT DEFAULT '',
    requested_by TEXT DEFAULT '',
    requested_by_id INTEGER,
    assigned_to TEXT DEFAULT '',
    assigned_to_id INTEGER,
    expected_closure_date TEXT DEFAULT '',
    actual_closure_date TEXT DEFAULT '',
    response_time INTEGER DEFAULT 0,
    resolution_time INTEGER DEFAULT 0,
    location TEXT DEFAULT '',
    workstream TEXT DEFAULT '',
    workgroup TEXT DEFAULT '',
    service TEXT DEFAULT '',
    created_by TEXT DEFAULT '',
    created_by_id INTEGER,
    last_modified_by TEXT DEFAULT '',
    last_modified_by_id INTEGER,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at TEXT DEFAULT '',
    FOREIGN KEY (requested_by_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_to_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (last_modified_by_id) REFERENCES users(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id TEXT NOT NULL,
    author_id INTEGER,
    author_name TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (ticket_id) REFERENCES tickets(ticket_id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS ticket_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id TEXT NOT NULL,
    actor_id INTEGER,
    actor_name TEXT NOT NULL,
    action TEXT NOT NULL,
    field TEXT DEFAULT '',
    from_value TEXT DEFAULT '',
    to_value TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (ticket_id) REFERENCES tickets(ticket_id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
  CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
  CREATE INDEX IF NOT EXISTS idx_tickets_category ON tickets(category);
  CREATE INDEX IF NOT EXISTS idx_tickets_assigned ON tickets(assigned_to_id);
  CREATE INDEX IF NOT EXISTS idx_comments_ticket ON comments(ticket_id);
  CREATE INDEX IF NOT EXISTS idx_events_ticket ON ticket_events(ticket_id);
`);

function count(table) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count;
}

function daysAgo(days) {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

function hoursAgo(hours) {
  return new Date(Date.now() - hours * 3_600_000).toISOString();
}

function seedUsers() {
  if (count("users") > 0) return;

  const users = [
    {
      name: "Amit Sharma",
      email: "admin@welserve.local",
      username: "admin",
      password: "admin123",
      role: "Admin",
      team: "Platform",
      status: "Available",
      avatar_color: "#0f766e",
    },
    {
      name: "Neha Verma",
      email: "agent1@welserve.local",
      username: "agent1",
      password: "agent123",
      role: "Agent",
      team: "Network",
      status: "Available",
      avatar_color: "#1d4ed8",
    },
    {
      name: "Rahul Mehta",
      email: "agent2@welserve.local",
      username: "agent2",
      password: "agent123",
      role: "Agent",
      team: "Infrastructure",
      status: "Busy",
      avatar_color: "#7c3aed",
    },
    {
      name: "Priya Nair",
      email: "viewer@welserve.local",
      username: "viewer",
      password: "viewer123",
      role: "Viewer",
      team: "Operations",
      status: "Available",
      avatar_color: "#475569",
    },
    {
      name: "Sanjay Kumar",
      email: "sanjay.kumar@welserve.local",
      username: "sanjayk",
      password: "agent123",
      role: "Agent",
      team: "Applications",
      status: "Available",
      avatar_color: "#dc2626",
    },
  ];

  const insert = db.prepare(`
    INSERT INTO users (name, email, username, password_hash, role, team, status, avatar_color, created_at, updated_at)
    VALUES (@name, @email, @username, @password_hash, @role, @team, @status, @avatar_color, @created_at, @updated_at)
  `);

  const now = new Date().toISOString();
  for (const user of users) {
    insert.run({
      name: user.name,
      email: user.email,
      username: user.username,
      password_hash: hashPassword(user.password),
      role: user.role,
      team: user.team,
      status: user.status,
      avatar_color: user.avatar_color,
      created_at: now,
      updated_at: now,
    });
  }
}

function seedTickets() {
  return;
}

seedUsers();
if (process.env.SEED_DEMO_TICKETS === "true") {
  seedTickets();
}

export function getDb() {
  return db;
}
