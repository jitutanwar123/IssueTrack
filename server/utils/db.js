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
  if (count("tickets") > 0) return;

  const users = db.prepare("SELECT id, name FROM users ORDER BY id").all();
  const byName = Object.fromEntries(users.map((user) => [user.name, user]));
  const seed = [
    {
      ticket_id: "SRN269020",
      title: "Email outage affecting finance team",
      description: "Users cannot send external emails after the gateway update.",
      category: "Incident",
      sub_category: "Email",
      priority: "P1",
      status: "Open",
      customer_name: "Finance Department",
      requester_email: "finance.lead@welspun.com",
      phone: "9990011001",
      department: "Finance",
      requested_by: "Amit Sharma",
      assigned_to: "Neha Verma",
      expected_closure_date: daysAgo(-1),
      response_time: 15,
      resolution_time: 0,
      location: "Mumbai",
      workstream: "Messaging",
      workgroup: "Email Support",
      service: "Corporate Email",
      created_by: "Amit Sharma",
      last_modified_by: "Amit Sharma",
      created_at: hoursAgo(3),
      updated_at: hoursAgo(1),
    },
    {
      ticket_id: "SRN269021",
      title: "SAP login reset for procurement",
      description: "Reset access for new procurement joiners.",
      category: "Service Request",
      sub_category: "Access Request",
      priority: "P3",
      status: "Assigned",
      customer_name: "Procurement",
      requester_email: "procurement@welspun.com",
      phone: "9990011002",
      department: "Procurement",
      requested_by: "Priya Nair",
      assigned_to: "Rahul Mehta",
      expected_closure_date: daysAgo(-2),
      response_time: 25,
      resolution_time: 0,
      location: "Anjar",
      workstream: "ERP",
      workgroup: "SAP",
      service: "SAP Support",
      created_by: "Amit Sharma",
      last_modified_by: "Rahul Mehta",
      created_at: daysAgo(1.3),
      updated_at: hoursAgo(10),
    },
    {
      ticket_id: "SRN269022",
      title: "VPN gateway latency complaints",
      description: "Remote sites report intermittent latency.",
      category: "Incident",
      sub_category: "Network",
      priority: "P2",
      status: "Work In Progress",
      customer_name: "Regional Sales",
      requester_email: "sales.ops@welspun.com",
      phone: "9990011003",
      department: "Sales",
      requested_by: "Rahul Mehta",
      assigned_to: "Neha Verma",
      expected_closure_date: hoursAgo(-18),
      response_time: 12,
      resolution_time: 0,
      location: "Kolkata",
      workstream: "Network",
      workgroup: "Connectivity",
      service: "VPN",
      created_by: "Amit Sharma",
      last_modified_by: "Neha Verma",
      created_at: daysAgo(2.8),
      updated_at: hoursAgo(8),
    },
    {
      ticket_id: "SRN269023",
      title: "Laptop replacement for warehouse supervisor",
      description: "Device warranty expired and battery health is low.",
      category: "Service Request",
      sub_category: "Hardware",
      priority: "P4",
      status: "Closed",
      customer_name: "Warehouse Ops",
      requester_email: "warehouse@welspun.com",
      phone: "9990011004",
      department: "Operations",
      requested_by: "Neha Verma",
      assigned_to: "Sanjay Kumar",
      expected_closure_date: daysAgo(-5),
      actual_closure_date: daysAgo(1),
      response_time: 20,
      resolution_time: 4140,
      location: "Vapi",
      workstream: "End User",
      workgroup: "Hardware",
      service: "Device Support",
      created_by: "Amit Sharma",
      last_modified_by: "Sanjay Kumar",
      created_at: daysAgo(4.8),
      updated_at: daysAgo(1),
      closed_at: daysAgo(1),
    },
    {
      ticket_id: "SRN269024",
      title: "Change request for firewall policy",
      description: "Add inbound rule for partner integration.",
      category: "Change",
      sub_category: "Security",
      priority: "P2",
      status: "On Hold - Change",
      customer_name: "Integration Team",
      requester_email: "integration@welspun.com",
      phone: "9990011005",
      department: "IT",
      requested_by: "Priya Nair",
      assigned_to: "Rahul Mehta",
      expected_closure_date: daysAgo(-3),
      response_time: 30,
      resolution_time: 0,
      location: "Bhopal",
      workstream: "Security",
      workgroup: "Firewall",
      service: "Network Security",
      created_by: "Amit Sharma",
      last_modified_by: "Rahul Mehta",
      created_at: daysAgo(7.6),
      updated_at: hoursAgo(5),
    },
    {
      ticket_id: "SRN269025",
      title: "HR portal password unlock",
      description: "Multiple users locked out after failed attempts.",
      category: "Service Request",
      sub_category: "Access Request",
      priority: "P3",
      status: "Resolved",
      customer_name: "HR Shared Services",
      requester_email: "hr.shared@welspun.com",
      phone: "9990011006",
      department: "HR",
      requested_by: "Amit Sharma",
      assigned_to: "Neha Verma",
      expected_closure_date: daysAgo(-2),
      actual_closure_date: hoursAgo(20),
      response_time: 10,
      resolution_time: 1840,
      location: "Mumbai",
      workstream: "Applications",
      workgroup: "HRIS",
      service: "HR Portal",
      created_by: "Amit Sharma",
      last_modified_by: "Neha Verma",
      created_at: daysAgo(2.5),
      updated_at: hoursAgo(20),
      closed_at: hoursAgo(20),
    },
    {
      ticket_id: "SRN269026",
      title: "SAP interface job failing",
      description: "Nightly integration stopped after API credential rotation.",
      category: "Problem",
      sub_category: "Integration",
      priority: "P1",
      status: "Pending",
      customer_name: "Plant IT",
      requester_email: "plantit@welspun.com",
      phone: "9990011007",
      department: "Manufacturing",
      requested_by: "Rahul Mehta",
      assigned_to: "Sanjay Kumar",
      expected_closure_date: hoursAgo(-6),
      response_time: 18,
      resolution_time: 0,
      location: "Anjar",
      workstream: "ERP",
      workgroup: "Middleware",
      service: "SAP Interface",
      created_by: "Amit Sharma",
      last_modified_by: "Sanjay Kumar",
      created_at: daysAgo(1.8),
      updated_at: hoursAgo(4),
    },
    {
      ticket_id: "SRN269027",
      title: "Printer issue at reception",
      description: "Reception printer is showing a paper jam alert.",
      category: "Incident",
      sub_category: "Hardware",
      priority: "P4",
      status: "Open",
      customer_name: "Administration",
      requester_email: "admin.support@welspun.com",
      phone: "9990011008",
      department: "Admin",
      requested_by: "Priya Nair",
      assigned_to: "",
      expected_closure_date: daysAgo(-1),
      response_time: 5,
      resolution_time: 0,
      location: "Mumbai",
      workstream: "End User",
      workgroup: "Print Services",
      service: "Printing",
      created_by: "Amit Sharma",
      last_modified_by: "Amit Sharma",
      created_at: hoursAgo(14),
      updated_at: hoursAgo(2),
    },
    {
      ticket_id: "SRN269028",
      title: "New employee onboarding access",
      description: "Create accounts and assign baseline access for 12 users.",
      category: "Service Request",
      sub_category: "User Provisioning",
      priority: "P2",
      status: "Assigned",
      customer_name: "L&D",
      requester_email: "lnd@welspun.com",
      phone: "9990011009",
      department: "HR",
      requested_by: "Neha Verma",
      assigned_to: "Sanjay Kumar",
      expected_closure_date: daysAgo(-4),
      response_time: 22,
      resolution_time: 0,
      location: "Vapi",
      workstream: "Identity",
      workgroup: "IAM",
      service: "User Provisioning",
      created_by: "Amit Sharma",
      last_modified_by: "Sanjay Kumar",
      created_at: daysAgo(5.2),
      updated_at: hoursAgo(12),
    },
    {
      ticket_id: "SRN269029",
      title: "Broken screen in conference room",
      description: "Conference room display flickers and is unusable.",
      category: "Incident",
      sub_category: "AV",
      priority: "P3",
      status: "On Hold - Infra",
      customer_name: "Corporate Services",
      requester_email: "corp.services@welspun.com",
      phone: "9990011010",
      department: "Admin",
      requested_by: "Amit Sharma",
      assigned_to: "Rahul Mehta",
      expected_closure_date: daysAgo(-6),
      response_time: 16,
      resolution_time: 0,
      location: "Bhopal",
      workstream: "Facilities",
      workgroup: "AV Support",
      service: "Conference AV",
      created_by: "Amit Sharma",
      last_modified_by: "Rahul Mehta",
      created_at: daysAgo(6.4),
      updated_at: hoursAgo(6),
    },
    {
      ticket_id: "SRN269030",
      title: "Access removal for resigned employee",
      description: "Disable accounts and collect hardware.",
      category: "Service Request",
      sub_category: "Access Request",
      priority: "P2",
      status: "Closed",
      customer_name: "People Ops",
      requester_email: "people.ops@welspun.com",
      phone: "9990011011",
      department: "HR",
      requested_by: "Rahul Mehta",
      assigned_to: "Neha Verma",
      expected_closure_date: daysAgo(-2),
      actual_closure_date: hoursAgo(3),
      response_time: 12,
      resolution_time: 1560,
      location: "Anjar",
      workstream: "Identity",
      workgroup: "IAM",
      service: "Access Management",
      created_by: "Amit Sharma",
      last_modified_by: "Neha Verma",
      created_at: daysAgo(3.4),
      updated_at: hoursAgo(3),
      closed_at: hoursAgo(3),
    },
    {
      ticket_id: "SRN269031",
      title: "Database backup alert",
      description: "Backup failed on one of the non-prod databases.",
      category: "Incident",
      sub_category: "Database",
      priority: "P1",
      status: "Pending",
      customer_name: "Data Platform",
      requester_email: "data.platform@welspun.com",
      phone: "9990011012",
      department: "IT",
      requested_by: "Priya Nair",
      assigned_to: "",
      expected_closure_date: hoursAgo(-2),
      response_time: 8,
      resolution_time: 0,
      location: "Mumbai",
      workstream: "Data",
      workgroup: "DBA",
      service: "Database Ops",
      created_by: "Amit Sharma",
      last_modified_by: "Amit Sharma",
      created_at: hoursAgo(26),
      updated_at: hoursAgo(2),
    },
    {
      ticket_id: "SRN269032",
      title: "Laptop antivirus update request",
      description: "Run antivirus update across designer workstations.",
      category: "Service Request",
      sub_category: "Software",
      priority: "P4",
      status: "Work In Progress",
      customer_name: "Design Studio",
      requester_email: "design.studio@welspun.com",
      phone: "9990011013",
      department: "Marketing",
      requested_by: "Sanjay Kumar",
      assigned_to: "Rahul Mehta",
      expected_closure_date: daysAgo(-1),
      response_time: 14,
      resolution_time: 0,
      location: "Kolkata",
      workstream: "Endpoint",
      workgroup: "Security Tools",
      service: "Endpoint Protection",
      created_by: "Amit Sharma",
      last_modified_by: "Rahul Mehta",
      created_at: daysAgo(1.1),
      updated_at: hoursAgo(7),
    },
    {
      ticket_id: "SRN269033",
      title: "Change window approval pending",
      description: "Awaiting CAB approval for production deployment.",
      category: "Change",
      sub_category: "Release",
      priority: "P3",
      status: "On Hold - Change",
      customer_name: "Apps Release",
      requester_email: "release.mgr@welspun.com",
      phone: "9990011014",
      department: "IT",
      requested_by: "Amit Sharma",
      assigned_to: "Neha Verma",
      expected_closure_date: daysAgo(-5),
      response_time: 18,
      resolution_time: 0,
      location: "Mumbai",
      workstream: "Release",
      workgroup: "CAB",
      service: "Change Management",
      created_by: "Amit Sharma",
      last_modified_by: "Neha Verma",
      created_at: daysAgo(8.4),
      updated_at: hoursAgo(9),
    },
  ];

  const insert = db.prepare(`
    INSERT INTO tickets (
      ticket_id, title, description, category, sub_category, priority, status, customer_name,
      requester_email, phone, department, requested_by, requested_by_id, assigned_to, assigned_to_id,
      expected_closure_date, actual_closure_date, response_time, resolution_time, location,
      workstream, workgroup, service, created_by, created_by_id, last_modified_by, last_modified_by_id,
      created_at, updated_at, closed_at
    ) VALUES (
      @ticket_id, @title, @description, @category, @sub_category, @priority, @status, @customer_name,
      @requester_email, @phone, @department, @requested_by, @requested_by_id, @assigned_to, @assigned_to_id,
      @expected_closure_date, @actual_closure_date, @response_time, @resolution_time, @location,
      @workstream, @workgroup, @service, @created_by, @created_by_id, @last_modified_by, @last_modified_by_id,
      @created_at, @updated_at, @closed_at
    )
  `);

  const eventInsert = db.prepare(`
    INSERT INTO ticket_events (ticket_id, actor_id, actor_name, action, field, from_value, to_value, created_at)
    VALUES (@ticket_id, @actor_id, @actor_name, @action, @field, @from_value, @to_value, @created_at)
  `);

  const commentInsert = db.prepare(`
    INSERT INTO comments (ticket_id, author_id, author_name, body, created_at)
    VALUES (@ticket_id, @author_id, @author_name, @body, @created_at)
  `);

  const now = new Date().toISOString();

  const resolveUser = (name) => byName[name] || null;

  for (const ticket of seed) {
    const creator = resolveUser(ticket.created_by);
    const modifier = resolveUser(ticket.last_modified_by);
    const assignee = resolveUser(ticket.assigned_to);
    const requester = resolveUser(ticket.requested_by);

    insert.run({
      ...ticket,
      requested_by_id: requester?.id || null,
      assigned_to_id: assignee?.id || null,
      created_by_id: creator?.id || null,
      last_modified_by_id: modifier?.id || null,
    });

    eventInsert.run({
      ticket_id: ticket.ticket_id,
      actor_id: creator?.id || null,
      actor_name: ticket.created_by,
      action: "created ticket",
      field: "status",
      from_value: "",
      to_value: ticket.status,
      created_at: ticket.created_at,
    });

    if (ticket.status !== "Open") {
      eventInsert.run({
        ticket_id: ticket.ticket_id,
        actor_id: modifier?.id || null,
        actor_name: ticket.last_modified_by,
        action: "updated status",
        field: "status",
        from_value: "Open",
        to_value: ticket.status,
        created_at: ticket.updated_at,
      });
    }

    if (ticket.status === "Closed" || ticket.status === "Resolved") {
      commentInsert.run({
        ticket_id: ticket.ticket_id,
        author_id: modifier?.id || null,
        author_name: ticket.last_modified_by,
        body: "Issue resolved and closure shared with requester.",
        created_at: now,
      });
    }
  }
}

seedUsers();
seedTickets();

export function getDb() {
  return db;
}
