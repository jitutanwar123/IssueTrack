import dotenv from "dotenv";
import express from "express";
import mysql from "mysql2";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import multer from "multer";
import { buildTicketPdf } from "./utils/pdf.js";
import {
  CATEGORY_OPTIONS,
  CTM_PLANT_ASSIGNMENTS,
  SERVICE_OPTIONS_BY_PORTAL,
  STAFF_ASSIGNMENTS,
  SUB_CATEGORIES_BY_CATEGORY,
  getServiceOptions,
} from "../client/src/utils/ticketTaxonomy.js";
import { PLANTS } from "./utils/plants.js";

// Ticket ID prefixes — defined here to avoid cross-package import caching issues
// Incident → SR, Service Request → SR, Change Request → CR
const SERVICE_PREFIXES = {
  "Incident":        "SR",
  "Service Request": "SR",
  "Change Request":  "CR",
};

function toMySQLDateTime(value) {
  if (!value) return null;
  return value.replace("T", " ").slice(0, 19);
}

import {
  sendNewTicketToAdmin,
  sendTicketConfirmationToUser,
  sendStatusUpdateToUser,
  sendAdminCommentToUser,
  sendUserCommentToAdmin,
  sendResolutionToUser,
  sendTicketAssignedToAssignee,
  sendTicketTransferredToAssignee,
  sendAdminCreatedTicketToAdmin,
  sendSubBranchResolutionToAdmin,
} from "./emailService.js";

dotenv.config();
const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
  "http://localhost:5173",
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (Render health checks, curl, etc.) and allowed origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  multipleStatements: true,
  ssl: {
    ca: fs.readFileSync(path.join(__dirname, "certs", "aiven-ca.pem")),
    rejectUnauthorized: true,
  },
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
    return;
  }
  console.log("✅ MySQL Connected");

  // ─── Auto-migration: add resolution columns if they don't exist ──
  // Run as 3 separate statements; duplicate-column errors (1060) are silently ignored
  const migrationCols = [
    "ALTER TABLE tickets ADD COLUMN resolved_at DATETIME DEFAULT NULL",
    "ALTER TABLE tickets ADD COLUMN resolution_note TEXT DEFAULT NULL",
    "ALTER TABLE tickets ADD COLUMN resolved_by VARCHAR(255) DEFAULT NULL",
    // Attachment support
    "ALTER TABLE tickets ADD COLUMN attachment_name VARCHAR(255) DEFAULT NULL",
    "ALTER TABLE tickets ADD COLUMN attachment_mime VARCHAR(100) DEFAULT NULL",
    "ALTER TABLE tickets ADD COLUMN attachment_data LONGBLOB DEFAULT NULL",
    // IT Staff portal role support
    "ALTER TABLE users ADD COLUMN department VARCHAR(100) DEFAULT NULL",
    "ALTER TABLE users ADD COLUMN plant VARCHAR(150) DEFAULT NULL",
    "ALTER TABLE tickets ADD COLUMN plant VARCHAR(150) DEFAULT NULL",
    // Expand portal_role to support it_staff
    "ALTER TABLE users MODIFY COLUMN portal_role ENUM('admin','user','it_staff') DEFAULT 'user'",
    // Speed up staff queue lookups
    "ALTER TABLE tickets ADD INDEX idx_tickets_assigned_created (assigned_to, created_at)",
    "ALTER TABLE tickets ADD COLUMN request_source VARCHAR(50) DEFAULT NULL",
    "ALTER TABLE tickets ADD COLUMN raised_by_staff VARCHAR(255) DEFAULT NULL",
    "ALTER TABLE ticket_status_history ADD COLUMN event_type VARCHAR(50) DEFAULT 'status'",
    "ALTER TABLE ticket_status_history ADD COLUMN actor_email VARCHAR(255) DEFAULT NULL",
    "ALTER TABLE ticket_status_history ADD COLUMN actor_role VARCHAR(50) DEFAULT NULL",
    "ALTER TABLE ticket_status_history ADD COLUMN field_name VARCHAR(100) DEFAULT NULL",
    "ALTER TABLE ticket_status_history ADD COLUMN from_value TEXT DEFAULT NULL",
    "ALTER TABLE ticket_status_history ADD COLUMN to_value TEXT DEFAULT NULL",
  ];
  migrationCols.forEach((sql) => {
    db.query(sql, (migErr) => {
      if (migErr && migErr.errno !== 1060 && migErr.errno !== 1061) {
        // errno 1060 = "Duplicate column name" — column already exists, that's fine
        // errno 1061 = "Duplicate key name" — index already exists, that's fine
        // Other MODIFY errors are also silently handled (e.g. column already correct type)
        if (!migErr.message?.includes("Duplicate column") && !migErr.message?.includes("Duplicate key") && migErr.errno !== 1060 && migErr.errno !== 1061) {
          console.warn("⚠️  Migration warning:", migErr.message);
        }
      }
    });
  });
  console.log("✅ Migration queued (resolved_at, resolution_note, resolved_by, attachment columns, it_staff role)");

  (async () => {
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS ticket_sequences (
          service VARCHAR(50) PRIMARY KEY,
          prefix VARCHAR(10) NOT NULL,
          last_sequence BIGINT NOT NULL DEFAULT 26000000,
          sequence_year CHAR(2) DEFAULT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      await query(`ALTER TABLE ticket_sequences ADD COLUMN sequence_year CHAR(2) DEFAULT NULL`).catch((err) => {
        if (err?.errno !== 1060) {
          console.warn("⚠️ ticket_sequences migration warning:", err.message);
        }
      });

      await query(`
        CREATE TABLE IF NOT EXISTS ticket_services (
          service VARCHAR(50) PRIMARY KEY,
          display_order INT NOT NULL DEFAULT 0
        )
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS ticket_categories (
          category VARCHAR(100) PRIMARY KEY,
          display_order INT NOT NULL DEFAULT 0
        )
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS ticket_sub_categories (
          id INT AUTO_INCREMENT PRIMARY KEY,
          category VARCHAR(100) NOT NULL,
          sub_category VARCHAR(100) NOT NULL,
          display_order INT NOT NULL DEFAULT 0,
          UNIQUE KEY unique_category_sub_category (category, sub_category)
        )
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS staff_assignment (
          id INT AUTO_INCREMENT PRIMARY KEY,
          category VARCHAR(100) NOT NULL,
          sub_category VARCHAR(100) NOT NULL,
          staff_name VARCHAR(255) NOT NULL,
          staff_email VARCHAR(255) NOT NULL,
          display_order INT NOT NULL DEFAULT 0,
          UNIQUE KEY unique_staff_assignment (category, sub_category, staff_email)
        )
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS ctm_plant_assignment (
          plant_code VARCHAR(20) PRIMARY KEY,
          plant_name VARCHAR(255) NOT NULL,
          staff_name VARCHAR(255) DEFAULT NULL,
          staff_email VARCHAR(255) DEFAULT NULL,
          display_order INT NOT NULL DEFAULT 0
        )
      `);

      for (const [service, prefix] of Object.entries(SERVICE_PREFIXES)) {
        await query(
          `INSERT INTO ticket_sequences (service, prefix, last_sequence, sequence_year)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             prefix = VALUES(prefix)`,
          [service, prefix, CURRENT_TICKET_BASE, ""]
        );
      }

      for (const [index, service] of getServiceOptions("staff").entries()) {
        await query(
          `INSERT INTO ticket_services (service, display_order)
           VALUES (?, ?)
           ON DUPLICATE KEY UPDATE display_order = VALUES(display_order)`,
          [service, index]
        );
      }

      for (const [index, category] of CATEGORY_OPTIONS.entries()) {
        await query(
          `INSERT INTO ticket_categories (category, display_order)
           VALUES (?, ?)
           ON DUPLICATE KEY UPDATE display_order = VALUES(display_order)`,
          [category, index]
        );
      }

      for (const [category, subCategories] of Object.entries(SUB_CATEGORIES_BY_CATEGORY)) {
        for (const [index, subCategory] of subCategories.entries()) {
          await query(
            `INSERT INTO ticket_sub_categories (category, sub_category, display_order)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE display_order = VALUES(display_order)`,
            [category, subCategory, index]
          );
        }
      }

      for (const [index, assignment] of STAFF_ASSIGNMENTS.entries()) {
        await query(
          `INSERT INTO staff_assignment (category, sub_category, staff_name, staff_email, display_order)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE display_order = VALUES(display_order), staff_name = VALUES(staff_name)`,
          [assignment.category, assignment.sub_category, assignment.name, assignment.email, index]
        );
      }

      for (const [index, assignment] of CTM_PLANT_ASSIGNMENTS.entries()) {
        await query(
          `INSERT INTO ctm_plant_assignment (plant_code, plant_name, staff_name, staff_email, display_order)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE plant_name = VALUES(plant_name), staff_name = VALUES(staff_name), staff_email = VALUES(staff_email), display_order = VALUES(display_order)`,
          [assignment.plant_code, assignment.plant_name, assignment.staff_name, assignment.staff_email, index]
        );
      }

      await syncVirajStaffAccounts();

      // ── One-time migration: rename legacy INC*/SR26*/CR26* ticket IDs ────
      try {
        // Tickets whose IDs don't match the new clean format (PREFIX + exactly 6 digits)
        const legacyTickets = await query(
          `SELECT id, ticket_id, service FROM tickets
           WHERE ticket_id NOT REGEXP '^(SR|CR)[0-9]{6}$'
           ORDER BY id ASC`
        );
        if (legacyTickets.length > 0) {
          // Count existing clean-format SR and CR tickets to continue from
          const srCountRows = await query(
            `SELECT COUNT(*) AS cnt FROM tickets WHERE ticket_id REGEXP '^SR[0-9]{6}$'`
          );
          const crCountRows = await query(
            `SELECT COUNT(*) AS cnt FROM tickets WHERE ticket_id REGEXP '^CR[0-9]{6}$'`
          );
          let srCounter = Number(srCountRows[0]?.cnt || 0);
          let crCounter = Number(crCountRows[0]?.cnt || 0);

          for (const row of legacyTickets) {
            const isChangeRequest = String(row.service || "").toLowerCase().includes("change");
            let newId;
            if (isChangeRequest) {
              crCounter += 1;
              newId = `CR${String(crCounter).padStart(6, "0")}`;
            } else {
              srCounter += 1;
              newId = `SR${String(srCounter).padStart(6, "0")}`;
            }
            await query(`UPDATE tickets SET ticket_id = ? WHERE id = ?`, [newId, row.id]);
            console.log(`✅ Renamed legacy ticket ${row.ticket_id} → ${newId}`);
          }

          // Reset sequence counters to match actual ticket counts
          const finalSrRows = await query(
            `SELECT COUNT(*) AS cnt FROM tickets WHERE ticket_id REGEXP '^SR[0-9]{6}$'`
          );
          const finalCrRows = await query(
            `SELECT COUNT(*) AS cnt FROM tickets WHERE ticket_id REGEXP '^CR[0-9]{6}$'`
          );
          const finalSr = Number(finalSrRows[0]?.cnt || 0);
          const finalCr = Number(finalCrRows[0]?.cnt || 0);

          await query(
            `UPDATE ticket_sequences SET last_sequence = ? WHERE service IN ('Incident', 'Service Request')`,
            [finalSr]
          );
          await query(
            `UPDATE ticket_sequences SET last_sequence = ? WHERE service = 'Change Request'`,
            [finalCr]
          );
          console.log(`✅ Sequences reset — SR: ${finalSr}, CR: ${finalCr}`);
        }
      } catch (migErr) {
        console.warn("⚠️ Ticket ID migration warning:", migErr.message);
      }
      // ─────────────────────────────────────────────────────────────────────


      console.log("✅ Ticket lookup tables seeded");
    } catch (bootstrapErr) {
      console.warn("⚠️ Ticket lookup bootstrap warning:", bootstrapErr.message);
    }
  })();

});

const JWT_SECRET = process.env.JWT_SECRET || "viraj_jwt_secret_change_me";
const STAFF_DEFAULT_PASSWORD = "Viraj@123";
const CURRENT_TICKET_BASE = 0;
const VIRAJ_STAFF_ROSTER = [
  { name: "Subodh Kumar", email: "Subodh.Kumar@viraj.com", role: "SAP Consultant", team: "SAP Application", department: "IT" },
  { name: "Saurabh Kulkarni", email: "Saurabh.Kulkarni@viraj.com", role: "SAP Consultant", team: "SAP Application", department: "IT" },
  { name: "Rupesh Pawade", email: "rupesh.pawade@viraj.com", role: "SAP Consultant", team: "SAP Application", department: "IT" },
  { name: "Sharad Desai", email: "sharad.desai@viraj.com", role: "SAP Consultant", team: "SAP Application", department: "IT" },
  { name: "Jayesh Meher", email: "Jayesh.Meher@viraj.com", role: "SAP Consultant", team: "SAP Application", department: "IT" },
  { name: "Sanjay Garhpandey", email: "Sanjay.Garhpandey@viraj.com", role: "SAP Technical Consultant", team: "SAP Application", department: "IT" },
  { name: "Sanjay Dash", email: "Sanjay.Dash@viraj.com", role: "SAP Technical Consultant", team: "SAP Application", department: "IT" },
  { name: "Harshad Bari", email: "Harshad.Bari@viraj.com", role: "SAP Basis Analyst", team: "SAP Application", department: "IT" },
  { name: "Komal Kalgamwala", email: "sap.mm@viraj.com", role: "SAP MDM Analyst", team: "SAP Application", department: "IT" },
  { name: "Helpdesk Team", email: "Helpdesk@viraj.com", role: "Help Desk Engineer", team: "Help Desk", department: "IT" },
  { name: "Amol Chaudhari", email: "a.chaudhari@viraj.com", role: "Help Desk Engineer", team: "Help Desk", department: "IT" },
  { name: "Vikas Tandel", email: "Vikas.Tandel@viraj.com", role: "Network Administrator", team: "Network", department: "IT" },
  { name: "Yogesh Ule", email: "helpdesk@vaishnoyard.com", role: "Help Desk Engineer", team: "Help Desk", department: "IT" },
  { name: "Kapil Sankhe", email: "kapil.sankhe@viraj.com", role: "Help Desk Engineer", team: "Help Desk", department: "IT" },
  { name: "Roshan Cerejo", email: "Roshan.Cerejo@viraj.com", role: "Help Desk Engineer", team: "Help Desk", department: "IT" },
  { name: "Amol Chaugule", email: "Amol.Chaugule@viraj.com", role: "Help Desk Engineer", team: "Help Desk", department: "IT" },
  { name: "Akhilesh Shukla", email: "Akhilesh.Sukla@viraj.com", role: "Plant IT Coordinator", team: "CTM", department: "IT" },
  { name: "Abhijeet Nalawade", email: "Sap.Pp@viraj.com", role: "Plant IT Coordinator", team: "CTM", department: "IT" },
  { name: "Yogesh Gaikwad", email: "Yogesh.Gaikwad@viraj.com", role: "Plant IT Coordinator", team: "CTM", department: "IT" },
  { name: "Mohan Patel", email: "Mohan.Patel@viraj.com", role: "Plant IT Coordinator", team: "CTM", department: "IT" },
  { name: "Yogendrasingh Rathore", email: "Yogendrasingh.Rathore@viraj.com", role: "Plant IT Coordinator", team: "CTM", department: "IT" },
  { name: "Sachin Bansode", email: "sachin.bansode@viraj.com", role: "Plant IT Coordinator", team: "CTM", department: "IT" },
  { name: "Krishna Kasvekar", email: "Krishna.Kasvekar@viraj.com", role: "Plant IT Coordinator", team: "CTM", department: "IT" },
];

// ─── JWT Middleware ──────────────────────────────────────────────
function authenticateJWT(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const token = auth.slice(7);
  // Support old demo-token for backwards compatibility during transition
  if (token === "demo-token") {
    req.user = { id: 1, name: "Admin", role: "admin", portal_role: "admin" };
    return next();
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

function requireAdmin(req, res, next) {
  const role = req.user?.role || "";
  const portalRole = req.user?.portal_role || "";
  const isAdmin =
    portalRole === "admin" ||
    role === "admin" ||
    role === "Admin" ||
    role === "Administrator";
  if (!isAdmin) return res.status(403).json({ message: "Admin access required" });
  next();
}

// Allow IT staff OR admin (staff can only access their own tickets)
function requireStaff(req, res, next) {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  const pr = req.user?.portal_role || "";
  const role = req.user?.role || "";
  const ok =
    pr === "it_staff" ||
    pr === "admin" ||
    role === "admin" ||
    role === "Admin" ||
    role === "Administrator";
  if (!ok) return res.status(403).json({ message: "Staff access required" });
  next();
}

function requireUser(req, res, next) {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  next();
}

function isClosedStatus(status) {
  return String(status || "").toLowerCase() === "closed";
}

function normalizeStatus(value = "") {
  return String(value || "").trim().toLowerCase();
}

function isStaffWorkStage(status = "") {
  const value = normalizeStatus(status);
  return value === "work in progress" || value.startsWith("on hold");
}

function canMoveToFinalStaffStatus(currentStatus = "", nextStatus = "") {
  const current = normalizeStatus(currentStatus);
  const next = normalizeStatus(nextStatus);
  if (next === "closed") return current === "resolved";
  if (next === "resolved" || next === "reject") return isStaffWorkStage(currentStatus);
  return true;
}

function normalizeService(service, portal = "user") {
  const allowed = getServiceOptions(portal);
  if (allowed.includes(service)) return service;
  return portal === "staff" ? null : allowed[0];
}

async function loadTicketLookups() {
  const [
    serviceRows,
    categoryRows,
    subCategoryRows,
    staffRows,
    ctmRows,
  ] = await Promise.all([
    query("SELECT service, display_order FROM ticket_services ORDER BY display_order ASC, service ASC"),
    query("SELECT category, display_order FROM ticket_categories ORDER BY display_order ASC, category ASC"),
    query("SELECT category, sub_category, display_order FROM ticket_sub_categories ORDER BY category ASC, display_order ASC, sub_category ASC"),
    query("SELECT category, sub_category, staff_name, staff_email, display_order FROM staff_assignment ORDER BY category ASC, sub_category ASC, display_order ASC, staff_name ASC"),
    query("SELECT plant_code, plant_name, staff_name, staff_email, display_order FROM ctm_plant_assignment ORDER BY display_order ASC, plant_code ASC"),
  ]);

  const servicesByPortal = {
    user: serviceRows.map((row) => row.service).filter((service) => SERVICE_OPTIONS_BY_PORTAL.user.includes(service)),
    staff: serviceRows.map((row) => row.service).filter((service) => SERVICE_OPTIONS_BY_PORTAL.staff.includes(service)),
  };

  return {
    servicesByPortal,
    categories: categoryRows.map((row) => row.category),
    subCategoriesByCategory: subCategoryRows.reduce((acc, row) => {
      if (!acc[row.category]) acc[row.category] = [];
      acc[row.category].push(row.sub_category);
      return acc;
    }, {}),
    staffAssignments: staffRows.map((row) => ({
      category: row.category,
      sub_category: row.sub_category,
      name: row.staff_name,
      email: row.staff_email,
    })),
    ctmPlantAssignments: ctmRows.map((row) => ({
      plant_code: row.plant_code,
      plant_name: row.plant_name,
      name: row.staff_name,
      email: row.staff_email,
    })),
    plants: PLANTS,
  };
}

async function loadAssignableStaffFromDb(category, subCategory, plant) {
  if (!category || !subCategory) return [];

  if (category === "SAP Application" && subCategory === "CTM") {
    const rows = await query(
      `SELECT plant_code, plant_name, staff_name, staff_email
       FROM ctm_plant_assignment
       WHERE plant_code = ? AND staff_name IS NOT NULL AND staff_name != ''
       LIMIT 1`,
      [String(plant || "")]
    );
    return rows.map((row) => ({
      name: row.staff_name,
      email: row.staff_email,
      plant_code: row.plant_code,
      plant_name: row.plant_name,
    }));
  }

  const rows = await query(
    `SELECT staff_name, staff_email
     FROM staff_assignment
     WHERE category = ? AND sub_category = ?
     ORDER BY display_order ASC, staff_name ASC`,
    [category, subCategory]
  );
  return rows.map((row) => ({
    name: row.staff_name,
    email: row.staff_email,
  }));
}

async function generateTicketId(service = "Incident") {
  const normalizedService = normalizeService(service, "staff") || "Incident";
  const prefix = SERVICE_PREFIXES[normalizedService] || SERVICE_PREFIXES.Incident;

  const currentRows = await query(
    `SELECT prefix, last_sequence
     FROM ticket_sequences
     WHERE service = ?
     LIMIT 1`,
    [normalizedService]
  );

  if (currentRows.length === 0) {
    await query(
      `INSERT INTO ticket_sequences (service, prefix, last_sequence, sequence_year)
       VALUES (?, ?, ?, ?)`,
      [normalizedService, prefix, 0, ""]
    );
  } else if (String(currentRows[0].prefix || "") !== prefix) {
    // Prefix changed (e.g. INC → SR) — update prefix but keep counter
    await query(
      `UPDATE ticket_sequences SET prefix = ? WHERE service = ?`,
      [prefix, normalizedService]
    );
  }

  await query(
    `UPDATE ticket_sequences
       SET last_sequence = LAST_INSERT_ID(last_sequence + 1)
     WHERE service = ?`,
    [normalizedService]
  );
  const rows = await query("SELECT LAST_INSERT_ID() AS seq");
  const seq = rows[0]?.seq || 1;
  return `${prefix}${String(seq).padStart(6, "0")}`;
}

function validateTicketInputs({ service, category, sub_category, plant, portal = "user" }) {
  const errors = [];
  const allowedServices = getServiceOptions(portal);
  const normalizedService = allowedServices.includes(service) ? service : (portal === "user" ? allowedServices[0] : null);
  if (!normalizedService) {
    errors.push(`Service must be one of: ${allowedServices.join(", ")}`);
  }
  if (!CATEGORY_OPTIONS.includes(category)) {
    errors.push(`Category must be one of: ${CATEGORY_OPTIONS.join(", ")}`);
  }
  const subCategories = SUB_CATEGORIES_BY_CATEGORY[category] || [];
  if (!subCategories.includes(sub_category)) {
    errors.push(`Sub-category must match the selected category`);
  }
  if (!plant) {
    errors.push("Plant is required");
  }
  return {
    ok: errors.length === 0,
    errors,
    service: normalizedService || allowedServices[0] || "Incident",
  };
}

async function syncVirajStaffAccounts() {
  const passwordHash = await bcrypt.hash(STAFF_DEFAULT_PASSWORD, 10);
  const allowedEmails = new Set(VIRAJ_STAFF_ROSTER.map((person) => person.email.toLowerCase()));

  for (const staff of VIRAJ_STAFF_ROSTER) {
    await query(
      `INSERT INTO users (name, email, username, hashed_password, phone, department, plant, portal_role, role, status, avatar_color)
       VALUES (?, ?, ?, ?, NULL, ?, NULL, 'it_staff', ?, 'Available', ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         username = VALUES(username),
         hashed_password = VALUES(hashed_password),
         department = VALUES(department),
         portal_role = VALUES(portal_role),
         role = VALUES(role),
         status = VALUES(status),
         avatar_color = VALUES(avatar_color)`,
      [
        staff.name,
        staff.email,
        staff.email,
        passwordHash,
        staff.department || "IT",
        staff.role || "Help Desk Engineer",
        staff.avatar_color || "#0f172a",
      ]
    );
  }

  await query(
    `DELETE FROM users
     WHERE portal_role = 'it_staff'
       AND LOWER(email) NOT IN (${Array.from(allowedEmails).map(() => "?").join(", ") || "''"})`,
    Array.from(allowedEmails)
  ).catch((err) => {
    console.warn("⚠️ Staff cleanup warning:", err.message);
  });
}

// ─── Helper: query as promise ────────────────────────────────────
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
}

function asActivityValue(value) {
  if (value === undefined || value === null || value === "") return null;
  return String(value);
}

function inferActivityType(row = {}) {
  const raw = String(row.event_type || row.type || "").toLowerCase();
  if (raw) return raw;
  if (row.field_name === "assigned_to") return "assignment";
  if (row.field_name === "status" || row.from_status || row.to_status) return "status";
  if (row.note && !row.to_status && !row.to_value) return "note";
  return "update";
}

function mapTicketActivity(row = {}) {
  const eventType = inferActivityType(row);
  const fromValue = row.from_value ?? row.from_status ?? null;
  const toValue = row.to_value ?? row.to_status ?? null;
  return {
    id: row.id,
    type: eventType,
    event_type: eventType,
    actor_name: row.actor_name || row.changed_by || "System",
    actor_email: row.actor_email || null,
    actor_role: row.actor_role || null,
    field_name: row.field_name || null,
    from_value: fromValue,
    to_value: toValue,
    from_status: row.from_status || null,
    to_status: row.to_status || null,
    note: row.note || null,
    created_at: row.created_at,
  };
}

async function logTicketActivity(ticketId, payload = {}) {
  const {
    eventType = "status",
    actorName = null,
    actorEmail = null,
    actorRole = null,
    fieldName = null,
    fromValue = null,
    toValue = null,
    fromStatus = null,
    toStatus = null,
    note = null,
  } = payload;

  return query(
    `INSERT INTO ticket_status_history
      (ticket_id, event_type, changed_by, actor_email, actor_role, field_name, from_status, to_status, from_value, to_value, note)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [
      ticketId,
      eventType,
      actorName,
      actorEmail,
      actorRole,
      fieldName,
      fromStatus,
      toStatus,
      fromValue,
      toValue,
      note,
    ]
  );
}

async function loadTicketActivity(ticketId) {
  const rows = await query(
    "SELECT * FROM ticket_status_history WHERE ticket_id = ? ORDER BY created_at ASC, id ASC",
    [ticketId]
  ).catch(() => []);
  return rows.map(mapTicketActivity);
}

async function autoCloseResolvedTickets() {
  try {
    const rows = await query(
      `SELECT ${TICKET_SLIM_COLUMNS}
       FROM tickets
       WHERE status = 'Resolved'
         AND resolved_at IS NOT NULL
         AND resolved_at <= DATE_SUB(NOW(), INTERVAL 7 DAY)`
    );

    for (const ticket of rows) {
      const closedBy = "System";
      await query(
        `UPDATE tickets
           SET status = 'Closed',
               actual_closure_date = NOW(),
               updated_at = NOW()
         WHERE id = ?`,
        [ticket.id]
      );

      await logTicketActivity(ticket.id, {
        eventType: "closure",
        actorName: closedBy,
        actorEmail: null,
        actorRole: "system",
        fieldName: "status",
        fromStatus: "Resolved",
        toStatus: "Closed",
        note: "Automatically closed 7 days after resolution.",
      }).catch(() => {});

      const updatedRows = await query(`SELECT ${TICKET_SLIM_COLUMNS} FROM tickets WHERE id = ?`, [ticket.id]).catch(() => []);
      const updatedTicket = updatedRows[0] || { ...ticket, status: "Closed" };

      await sendStatusUpdateToUser(
        updatedTicket,
        "Closed",
        "This ticket was automatically closed 7 days after resolution."
      ).catch(() => {});
    }

    if (rows.length) {
      console.log(`✅ Auto-closed ${rows.length} resolved ticket(s) after 7 days.`);
    }
  } catch (err) {
    console.error("❌ Auto-close job failed:", err.message);
  }
}

const TICKET_SLIM_COLUMNS = `
  id, ticket_id, title, description, category, sub_category, priority, status,
  customer_name, requester_email, phone, department, user_email, requested_by,
  assigned_to, location, workstream, workgroup, service, plant,
  expected_closure_date, actual_closure_date, response_time, resolution_time,
  resolved_at, resolution_note, resolved_by, created_at, updated_at,
  attachment_name, attachment_mime
`;

app.get("/", (req, res) => {
  res.send("Server Running");
});

// ─── Email diagnostics endpoint (Railway debug) ──────────────────
app.get("/api/test-email", async (req, res) => {
  const brevoKey  = process.env.BREVO_API_KEY;
  const fromEmail = process.env.BREVO_FROM_EMAIL;
  const adminEmail= process.env.ADMIN_EMAIL;

  const config = {
    BREVO_API_KEY:    brevoKey   ? "✅ set (hidden)"    : "❌ NOT SET",
    BREVO_FROM_EMAIL: fromEmail  ? `✅ ${fromEmail}`    : "❌ NOT SET",
    ADMIN_EMAIL:      adminEmail ? `✅ ${adminEmail}`   : "❌ NOT SET",
  };

  if (!brevoKey || !fromEmail) {
    return res.status(500).json({
      success: false,
      message: "BREVO_API_KEY must be set and a verified Brevo sender must exist (BREVO_FROM_EMAIL or ADMIN_EMAIL).",
      config,
    });
  }

  try {
    const to = adminEmail || fromEmail;
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept":       "application/json",
        "content-type": "application/json",
        "api-key":      brevoKey,
      },
      body: JSON.stringify({
        sender:      { name: "Viraj IT Support", email: fromEmail },
        to:          [{ email: to }],
        subject:     "✅ Railway Email Test — IssueTrack (Brevo)",
        htmlContent: `<div style="font-family:sans-serif;padding:20px;max-width:500px">
          <h2 style="color:#22c55e">Email is working! ✅</h2>
          <p>Your Railway deployment can send emails via Brevo to <strong>any</strong> recipient.</p>
          <p style="color:#666;font-size:12px">Sent at: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>
        </div>`,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`Brevo ${response.status}: ${data.message || JSON.stringify(data)}`);

    res.json({
      success: true,
      message: `✅ Test email sent to ${to} via Brevo`,
      messageId: data.messageId,
      config,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: `❌ Brevo Error: ${err.message}`,
      config,
      hint: err.message.includes("401") || err.message.includes("unauthorized")
        ? "BREVO_API_KEY is invalid. Get one at https://app.brevo.com/settings/keys/api"
        : err.message.includes("sender")
        ? "BREVO_FROM_EMAIL is not verified in Brevo. Go to Senders & IPs → verify the email."
        : "Check Railway env vars and redeploy.",
    });
  }
});

// ════════════════════════════════════════════════════════════════
// EXISTING ADMIN ROUTES (unchanged)
// ════════════════════════════════════════════════════════════════

// LOGIN (upgraded with real JWT + role)
app.post("/api/auth/login", (req, res) => {
  const { username, password, email } = req.body;
  const loginField = username || email;
  console.log("LOGIN ATTEMPT:", loginField);

  // Try username-based login first (admin), then email-based (user portal)
  db.query(
    "SELECT * FROM users WHERE (username = ? OR email = ?)",
    [loginField, loginField],
    async (err, results) => {
      if (err) return res.status(500).json(err);
      if (results.length === 0) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      const user = results[0];

      // Check password — support both plain-text (legacy admin) and bcrypt (new users)
      let passwordMatch = false;
      if (user.hashed_password) {
        passwordMatch = await bcrypt.compare(password, user.hashed_password);
      } else {
        // Legacy plain-text check
        passwordMatch = user.password === password;
      }

      if (!passwordMatch) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      const portalRole = user.portal_role || (user.role === "Administrator" || user.role === "admin" ? "admin" : "user");

      const token = jwt.sign(
        {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          portal_role: portalRole,
          department: user.department,
          plant: user.plant,
          phone: user.phone,
        },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          portal_role: portalRole,
          department: user.department,
          plant: user.plant,
          phone: user.phone,
          status: user.status || "Available",
          team: user.team || "",
          avatar_color: user.avatar_color || "#0f172a",
        },
      });
    }
  );
});

// REGISTER (new users)
app.post("/api/auth/register", async (req, res) => {
  const { name, email, password, phone, department, plant } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required" });
  }
  try {
    // ── Block staff-reserved emails ──────────────────────────────────────────
    const staffEmails = new Set(VIRAJ_STAFF_ROSTER.map((p) => p.email.toLowerCase()));
    if (staffEmails.has(email.toLowerCase())) {
      return res.status(403).json({
        message: "This email address is reserved for IT staff and cannot be used to create a user account.",
      });
    }
    // Also block if the email is already registered as an IT staff account in the DB
    const staffInDb = await query(
      "SELECT id FROM users WHERE LOWER(email) = LOWER(?) AND portal_role = 'it_staff'",
      [email]
    );
    if (staffInDb.length > 0) {
      return res.status(403).json({
        message: "This email address is reserved for IT staff and cannot be used to create a user account.",
      });
    }
    // ── Duplicate check ──────────────────────────────────────────────────────
    const existing = await query("SELECT id FROM users WHERE LOWER(email) = LOWER(?)", [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }
    const hashed = await bcrypt.hash(password, 10);
    await query(
      `INSERT INTO users (name, email, username, hashed_password, phone, department, plant, portal_role, role, status, avatar_color)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'user', 'User', 'Active', '#00bcd4')`,
      [name, email, email, hashed, phone || null, department || null, plant || null]
    );
    res.json({ success: true, message: "Account created successfully. Please log in." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
});

// CURRENT USER — fetch live from DB so status/team changes reflect immediately
app.get("/api/auth/me", authenticateJWT, async (req, res) => {
  try {
    const rows = await query("SELECT id,name,email,role,portal_role,department,plant,phone,status,team,avatar_color FROM users WHERE id = ?", [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ message: "User not found" });
    const u = rows[0];
    res.json({
      user: {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        portal_role: u.portal_role || req.user.portal_role,
        department: u.department,
        plant: u.plant,
        phone: u.phone,
        status: u.status || "Available",
        team: u.team || "",
        avatar_color: u.avatar_color || "#0f172a",
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET ALL TICKETS (paginated)
app.get("/api/tickets", (req, res) => {
  const { search, status, priority, category, assignee, location, sub_category, service, workgroup, customer_name, plant } = req.query;

  // ── Pagination ────────────────────────────────────────────────
  const page  = Math.max(1, parseInt(req.query.page,  10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
  const offset = (page - 1) * limit;

  let whereSql = "WHERE 1=1";
  let params = [];

  if (search)       { whereSql += " AND (title LIKE ? OR ticket_id LIKE ?)"; params.push(`%${search}%`, `%${search}%`); }
  if (status)       { whereSql += " AND status = ?";           params.push(status); }
  if (priority)     { whereSql += " AND priority = ?";         params.push(priority); }
  if (category)     { whereSql += " AND category = ?";         params.push(category); }
  if (assignee)     { whereSql += " AND assigned_to = ?";      params.push(assignee); }
  if (location)     { whereSql += " AND location = ?";         params.push(location); }
  if (sub_category) { whereSql += " AND sub_category = ?";     params.push(sub_category); }
  if (service)      { whereSql += " AND service = ?";          params.push(service); }
  if (workgroup)    { whereSql += " AND workgroup = ?";        params.push(workgroup); }
  if (customer_name){ whereSql += " AND customer_name = ?";    params.push(customer_name); }
  if (plant)        { whereSql += " AND plant = ?";            params.push(plant); }

  const dataSql  = `SELECT ${TICKET_SLIM_COLUMNS} FROM tickets ${whereSql} ORDER BY created_at ASC LIMIT ? OFFSET ?`;
  const countSql = `SELECT COUNT(*) AS total FROM tickets ${whereSql}`;

  Promise.all([
    db.promise().query(dataSql,  [...params, limit, offset]),
    db.promise().query(countSql, params),
  ])
    .then(([[dataRows], [countRows]]) => {
      const total      = countRows[0]?.total ?? 0;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      res.json({
        data: dataRows,
        pagination: { page, limit, total, totalPages },
      });
    })
    .catch((err) => res.status(500).json({ message: err.message }));
});

// ONE-TIME ADMIN FIX: rename legacy INC*/SR26*/CR26* ticket IDs to clean SR/CR 6-digit format
app.get("/api/admin/fix-ticket-ids", authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const legacyTickets = await query(
      `SELECT id, ticket_id, service FROM tickets WHERE ticket_id NOT REGEXP '^(SR|CR)[0-9]{6}$' ORDER BY id ASC`
    );
    if (legacyTickets.length === 0) {
      return res.json({ message: "All ticket IDs are already correct.", renamed: [] });
    }
    const srCountRows = await query(`SELECT COUNT(*) AS cnt FROM tickets WHERE ticket_id REGEXP '^SR[0-9]{6}$'`);
    const crCountRows = await query(`SELECT COUNT(*) AS cnt FROM tickets WHERE ticket_id REGEXP '^CR[0-9]{6}$'`);
    let srCounter = Number(srCountRows[0]?.cnt || 0);
    let crCounter = Number(crCountRows[0]?.cnt || 0);
    const renamed = [];
    for (const row of legacyTickets) {
      const isChange = String(row.service || "").toLowerCase().includes("change");
      const newId = isChange
        ? `CR${String(++crCounter).padStart(6, "0")}`
        : `SR${String(++srCounter).padStart(6, "0")}`;
      await query(`UPDATE tickets SET ticket_id = ? WHERE id = ?`, [newId, row.id]);
      renamed.push({ from: row.ticket_id, to: newId });
    }
    const finalSr = (await query(`SELECT COUNT(*) AS cnt FROM tickets WHERE ticket_id REGEXP '^SR[0-9]{6}$'`))[0]?.cnt || 0;
    const finalCr = (await query(`SELECT COUNT(*) AS cnt FROM tickets WHERE ticket_id REGEXP '^CR[0-9]{6}$'`))[0]?.cnt || 0;
    await query(`UPDATE ticket_sequences SET last_sequence = ? WHERE service IN ('Incident', 'Service Request')`, [finalSr]);
    await query(`UPDATE ticket_sequences SET last_sequence = ? WHERE service = 'Change Request'`, [finalCr]);
    res.json({ message: `Fixed ${renamed.length} ticket(s). SR counter → ${finalSr}, CR counter → ${finalCr}`, renamed });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// NEXT TICKET ID — MUST be before /:id to avoid Express param capture
app.get("/api/tickets/next-id", async (req, res) => {
  try {
    const requestedService = req.query.service || "Incident";
    const id = await generateTicketId(requestedService);
    res.json({ ticket_id: id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET SINGLE TICKET (admin — includes comments + timeline)
app.get("/api/tickets/:id", (req, res) => {
  const { id } = req.params;
  db.query(`SELECT ${TICKET_SLIM_COLUMNS} FROM tickets WHERE id = ?`, [id], async (err, results) => {
    if (err) return res.status(500).json(err);
    if (results.length === 0) return res.status(404).json({ message: "Ticket not found" });

    const ticket = results[0];
    let comments = [];
    let timeline = [];

    try {
      // Try ticket_comments table first, fallback to comments
      const commentRows = await query(
        "SELECT * FROM ticket_comments WHERE ticket_id = ? ORDER BY created_at ASC",
        [id]
      ).catch(() => []);
      comments = commentRows.map((c) => ({
        id: c.id,
        author_name: c.author_name,
        body: c.body,
        created_at: c.created_at,
        author_role: c.author_role,
      }));

      timeline = await loadTicketActivity(id);
    } catch (_) {}

    res.json({ data: ticket, comments, timeline });
  });
});

// CREATE TICKET (admin)
app.post("/api/tickets", async (req, res) => {
  const {
    title, description, category, sub_category, priority, status,
    customer_name, requester_email, phone, department,
    requested_by, assigned_to, requested_by_id, assigned_to_id,
    expected_closure_date, actual_closure_date,
    response_time, resolution_time, location, workstream, workgroup, service, plant,
  } = req.body;

  try {
    if (!priority) {
      return res.status(400).json({ message: "Priority is required" });
    }
    const ticketId = await generateTicketId(service || "Incident");
    const sql = `INSERT INTO tickets
      (ticket_id, title, description, category, sub_category, priority, status,
       customer_name, requester_email, phone, department,
       requested_by, assigned_to,
       expected_closure_date, actual_closure_date,
       response_time, resolution_time, location, workstream, workgroup, service, plant)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
    const result = await query(sql, [
      ticketId, title, description, category || null, sub_category || null,
      priority, status || "Open",
      customer_name || null, requester_email || null, phone || null, department || null,
      requested_by || null, assigned_to || null,
      expected_closure_date || null, actual_closure_date || null,
      response_time || 0, resolution_time || 0,
      location || null, workstream || null, workgroup || null, service || null, plant || null,
    ]);

    await logTicketActivity(result.insertId, {
      eventType: "created",
      actorName: requested_by || "Admin",
      actorEmail: requester_email || null,
      actorRole: "admin",
      fieldName: "ticket",
      toStatus: status || "Open",
      note: "Ticket created from admin portal",
    }).catch(() => {});

    if (assigned_to) {
      await logTicketActivity(result.insertId, {
        eventType: "assignment",
        actorName: requested_by || "Admin",
        actorEmail: requester_email || null,
        actorRole: "admin",
        fieldName: "assigned_to",
        toValue: assigned_to,
        note: "Initial assignment",
      }).catch(() => {});
    }

    // Build ticket object for email notifications
    const newTicket = {
      id: result.insertId,
      ticket_id: ticketId,
      title, description, category, sub_category, priority,
      status: status || "Open",
      customer_name: customer_name || null,
      requester_email: requester_email || null,
      phone: phone || null,
      department: department || null,
      assigned_to: assigned_to || null,
      location: location || null,
      plant: plant || null,
      created_at: new Date(),
    };

    console.log(`📧 Admin created ticket ${ticketId} — sending email notifications...`);

    // 1. Notify the admin inbox that a ticket was created
    sendAdminCreatedTicketToAdmin(newTicket)
      .then(() => console.log(`✅ Admin creation email sent for ${ticketId}`))
      .catch((e) => console.error(`❌ Admin creation email error:`, e.message));

    // 2. If a requester email was provided, send them a confirmation
    if (requester_email) {
      sendTicketConfirmationToUser(newTicket)
        .then(() => console.log(`✅ Requester confirmation email sent to ${requester_email} for ${ticketId}`))
        .catch((e) => console.error(`❌ Requester email error:`, e.message));
    }

    // 3. If assigned_to is set, look up that user's email and notify them
    if (assigned_to) {
      query("SELECT email FROM users WHERE name = ? LIMIT 1", [assigned_to])
        .then((rows) => {
          const assigneeEmail = rows[0]?.email;
          if (assigneeEmail) {
            return sendTicketAssignedToAssignee(newTicket, assigneeEmail)
              .then(() => console.log(`✅ Assignment email sent to ${assigneeEmail} for ${ticketId}`))
              .catch((e) => console.error(`❌ Assignment email error:`, e.message));
          } else {
            console.warn(`⚠️ Could not find email for assigned user "${assigned_to}"`);
          }
        })
        .catch((e) => console.error(`❌ User lookup error for assignment email:`, e.message));
    }

    res.json({ success: true, data: { id: result.insertId, ticket_id: ticketId } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE TICKET (admin — triggers status email if status changed)
app.put("/api/tickets/:id", async (req, res) => {
  const { id } = req.params;
  const {
    title, description, category, sub_category, priority, status,
    customer_name, requester_email, phone, department,
    requested_by, assigned_to, requested_by_id, assigned_to_id,
    expected_closure_date, actual_closure_date,
    response_time, resolution_time, location, workstream, workgroup, service,
  } = req.body;

  // Get old ticket for status comparison
  const oldRows = await query(`SELECT ${TICKET_SLIM_COLUMNS} FROM tickets WHERE id = ?`, [id]).catch(() => []);
  const oldTicket = oldRows[0];

  if (isClosedStatus(oldTicket?.status)) {
    return res.status(409).json({ message: "Closed tickets are read-only" });
  }

  const sql = `UPDATE tickets SET
    title=?, description=?, category=?, sub_category=?, priority=?, status=?,
    customer_name=?, requester_email=?, phone=?, department=?,
    requested_by=?, assigned_to=?,
    expected_closure_date=?, actual_closure_date=?,
    response_time=?, resolution_time=?, location=?, workstream=?, workgroup=?, service=?
    WHERE id=?`;

  db.query(sql, [
    title, description, category, sub_category, priority, status,
    customer_name, requester_email, phone, department,
    requested_by, assigned_to,
    expected_closure_date || null, actual_closure_date || null,
    response_time || 0, resolution_time || 0, location, workstream, workgroup, service,
    id,
  ], async (err, result) => {
    if (err) return res.status(500).json(err);

    // If status changed, email user + record history
    if (oldTicket && status && oldTicket.status !== status) {
      const updatedTicket = { ...oldTicket, ...req.body };
      sendStatusUpdateToUser(updatedTicket, status, null).catch(() => {});
      logTicketActivity(id, {
        eventType: status === "Resolved" ? "resolution" : status === "Closed" ? "closure" : "status",
        actorName: "Admin",
        actorEmail: null,
        actorRole: "admin",
        fieldName: "status",
        fromStatus: oldTicket.status,
        toStatus: status,
      }).catch(() => {});
    }

    // If assigned_to changed, look up new assignee email and notify them
    const oldAssigned = oldTicket?.assigned_to || "";
    const newAssigned = assigned_to || "";
    if (newAssigned && newAssigned !== oldAssigned) {
      query("SELECT email FROM users WHERE name = ? LIMIT 1", [newAssigned])
        .then((rows) => {
          const assigneeEmail = rows[0]?.email;
          if (assigneeEmail) {
            const updatedTicket = { ...oldTicket, ...req.body, assigned_to: newAssigned };
            return sendTicketAssignedToAssignee(updatedTicket, assigneeEmail)
              .then(() => console.log(`✅ Assignment email sent to ${assigneeEmail} (update) for ticket #${id}`))
              .catch((e) => console.error(`❌ Assignment email error on update:`, e.message));
          }
        })
        .catch(() => {});
    }

    res.json({ success: true, affectedRows: result.affectedRows });
  });
});

// DELETE TICKET
app.delete("/api/tickets/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM tickets WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Ticket not found" });
    res.json({ success: true, message: "Ticket deleted successfully" });
  });
});

// REPORT SUMMARY — uses SQL aggregates instead of loading all rows into JS
app.get("/api/reports/summary", async (req, res) => {
  const { location, category, sub_category, service, workgroup, customer, plant, status, priority, assigned } = req.query;

  // Build a reusable filter clause on top of WHERE 1=1
  const filterClauses = [];
  const filterParams  = [];
  if (location)    { filterClauses.push("location = ?");      filterParams.push(location); }
  if (category)    { filterClauses.push("category = ?");      filterParams.push(category); }
  if (sub_category){ filterClauses.push("sub_category = ?");  filterParams.push(sub_category); }
  if (service)     { filterClauses.push("service = ?");       filterParams.push(service); }
  if (workgroup)   { filterClauses.push("workgroup = ?");     filterParams.push(workgroup); }
  if (customer)    { filterClauses.push("customer_name = ?"); filterParams.push(customer); }
  if (plant)       { filterClauses.push("plant = ?");         filterParams.push(plant); }
  if (status)      { filterClauses.push("status = ?");        filterParams.push(status); }
  if (priority)    { filterClauses.push("priority = ?");     filterParams.push(priority); }
  if (assigned === "assigned") {
    filterClauses.push("((assigned_to_id IS NOT NULL AND assigned_to_id != '') OR (assigned_to IS NOT NULL AND assigned_to != ''))");
  }
  if (assigned === "unassigned") {
    filterClauses.push("((assigned_to_id IS NULL OR assigned_to_id = '') AND (assigned_to IS NULL OR assigned_to = ''))");
  }

  // Safe: all extra conditions are AND-appended to WHERE 1=1
  const baseWhere = filterClauses.length
    ? `WHERE 1=1 AND ${filterClauses.join(" AND ")}`
    : "WHERE 1=1";

  const q = (sql, p = filterParams) => db.promise().query(sql, p).then(([rows]) => rows);

  try {
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 19).replace("T", " ");

    const [
      totalLast24h,
      unassigned,
      incidents,
      serviceRequests,
      p1Incidents,
      pendingBreach,
      ageingRows,
      categoryRows,
      resolverRows,
    ] = await Promise.all([
      // Total tickets created in last 24 h
      q(`SELECT COUNT(*) AS n FROM tickets ${baseWhere} AND created_at >= ?`,
        [...filterParams, yesterday]),
      // Unassigned active tickets
      q(`SELECT COUNT(*) AS n FROM tickets ${baseWhere} AND (assigned_to IS NULL OR assigned_to = '') AND status NOT IN ('Closed','Cancelled','Reject')`),
      // Incident count
      q(`SELECT COUNT(*) AS n FROM tickets ${baseWhere} AND category = 'Incident'`),
      // Service Request count
      q(`SELECT COUNT(*) AS n FROM tickets ${baseWhere} AND category = 'Service Request'`),
      // P1 Incidents
      q(`SELECT COUNT(*) AS n FROM tickets ${baseWhere} AND priority = 'P1' AND category = 'Incident'`),
      // Pending-breach: active tickets (not closed/cancelled)
      q(`SELECT COUNT(*) AS n FROM tickets ${baseWhere} AND status NOT IN ('Closed','Cancelled','Reject')`),
      // Ageing buckets (active tickets only) using SQL CASE
      q(`SELECT
           CASE
             WHEN DATEDIFF(NOW(), created_at) <= 7  THEN '0-7 Days'
             WHEN DATEDIFF(NOW(), created_at) <= 30 THEN '8-30 Days'
             WHEN DATEDIFF(NOW(), created_at) <= 60 THEN '31-60 Days'
             ELSE '60+ Days'
           END AS bucket,
           COUNT(*) AS count
         FROM tickets
         ${baseWhere} AND status NOT IN ('Closed','Cancelled','Reject')
         GROUP BY bucket`),
      // Category breakdown
      q(`SELECT COALESCE(category,'Uncategorised') AS name, COUNT(*) AS value
         FROM tickets ${baseWhere}
         GROUP BY name`),
      // Resolver breakdown (top 10)
      q(`SELECT COALESCE(NULLIF(assigned_to,''),'Unassigned') AS name, COUNT(*) AS value
         FROM tickets ${baseWhere}
         GROUP BY name
         ORDER BY value DESC
         LIMIT 10`),
    ]);

    // Guarantee ordering for ageing buckets
    const ageOrder = ["0-7 Days", "8-30 Days", "31-60 Days", "60+ Days"];
    const ageMap   = Object.fromEntries(ageingRows.map((r) => [r.bucket, Number(r.count)]));
    const activeAgeing = ageOrder.map((bucket) => ({ bucket, count: ageMap[bucket] ?? 0 }));

    res.json({
      totalTicketsLast24Hours: totalLast24h[0]?.n ?? 0,
      unassignedTickets:       unassigned[0]?.n ?? 0,
      incidentTickets:         incidents[0]?.n ?? 0,
      serviceRequestTickets:   serviceRequests[0]?.n ?? 0,
      p1Incidents:             p1Incidents[0]?.n ?? 0,
      pendingBreachTickets:    pendingBreach[0]?.n ?? 0,
      activeAgeing,
      activeByCategory: categoryRows.map((r) => ({ name: r.name, value: Number(r.value) })),
      resolverBreakdown: resolverRows.map((r) => ({ name: r.name, value: Number(r.value) })),
    });
  } catch (err) {
    console.error("Summary error:", err);
    res.status(500).json({ message: err.message });
  }
});

// ─── Full ticket export endpoint (no pagination, used by Excel export) ───────
app.get("/api/reports/export", authenticateJWT, (req, res) => {
  const { from, to, category, assignee, status, priority, plant } = req.query;
  const conditions = [];
  const params = [];
  if (from)     { conditions.push("DATE(created_at) >= ?"); params.push(from); }
  if (to)       { conditions.push("DATE(created_at) <= ?"); params.push(to); }
  if (category) { conditions.push("category = ?");          params.push(category); }
  if (status)   { conditions.push("status = ?");            params.push(status); }
  if (priority) { conditions.push("priority = ?");          params.push(priority); }
  if (plant)    { conditions.push("plant = ?");             params.push(plant); }
  if (assignee) { conditions.push("(assigned_to LIKE ? OR assigned_to_name LIKE ?)"); params.push(`%${assignee}%`, `%${assignee}%`); }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const cols = `ticket_id, title, category, sub_category, priority, status,
    customer_name, requester_email, phone, location,
    assigned_to, department, plant, workstream, workgroup, service,
    response_time, resolution_time,
    expected_closure_date, actual_closure_date,
    created_at, updated_at`;
  db.query(`SELECT ${cols} FROM tickets ${where} ORDER BY created_at DESC`, params, (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json({ data: rows });
  });
});

app.get("/api/reports/ageing", (req, res) => { res.json({ data: [] }); });

app.get("/api/reports/detail", (req, res) => {
  const { from, to, category, assignee, plant } = req.query;

  // Build WHERE clauses dynamically for all filters
  const conditions = [];
  const params = [];

  if (from) { conditions.push("DATE(created_at) >= ?"); params.push(from); }
  if (to)   { conditions.push("DATE(created_at) <= ?"); params.push(to); }
  if (category) { conditions.push("category = ?"); params.push(category); }
  if (plant) { conditions.push("plant = ?"); params.push(plant); }
  if (assignee) { conditions.push("(assigned_to LIKE ? OR assigned_to_name LIKE ?)"); params.push(`%${assignee}%`, `%${assignee}%`); }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const sql = `SELECT ${TICKET_SLIM_COLUMNS} FROM tickets ${where}`;

  db.query(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });

    // ── 1. Tickets by Status ───────────────────────────────────────
    const statusMap = {};
    const priorityMap = {};
    const resolvedPerDayMap = {};
    const resolutionMap = {};

    rows.forEach((t) => {
      // Status count
      const s = t.status || "Unknown";
      statusMap[s] = (statusMap[s] || 0) + 1;

      // Priority count
      const p = t.priority || "Unknown";
      priorityMap[p] = (priorityMap[p] || 0) + 1;

      // Resolved per day — only closed/resolved tickets with a closure date
      if (["Closed", "Resolved"].includes(t.status) && t.actual_closure_date) {
        const day = new Date(t.actual_closure_date).toLocaleDateString("en-GB", {
          day: "2-digit", month: "short", timeZone: "Asia/Kolkata",
        });
        resolvedPerDayMap[day] = (resolvedPerDayMap[day] || 0) + 1;
      }

      // Avg resolution time per assignee — closed/resolved tickets with a closure date
      if (["Closed", "Resolved"].includes(t.status) && t.actual_closure_date) {
        const key = t.assigned_to_name || t.assigned_to || "Unassigned";
        const minutes = Number(t.resolution_time || 0) ||
          Math.max(1, Math.round(
            (new Date(t.actual_closure_date) - new Date(t.created_at)) / 60000
          ));
        if (!resolutionMap[key]) resolutionMap[key] = { total: 0, count: 0 };
        resolutionMap[key].total += minutes;
        resolutionMap[key].count += 1;
      }
    });

    res.json({
      data: {
        byStatus: Object.entries(statusMap).map(([name, value]) => ({ name, value })),
        byPriority: Object.entries(priorityMap).map(([name, value]) => ({ name, value })),
        resolvedPerDay: Object.entries(resolvedPerDayMap).map(([name, value]) => ({ name, value })),
        avgResolutionByAssignee: Object.entries(resolutionMap).map(([name, { total, count }]) => ({
          name,
          value: Math.round(total / count),
        })),
      },
    });
  });
});

// USERS CRUD
app.get("/api/users", (req, res) => {
  // Never return password/hashed_password columns
  db.query(
    "SELECT id, name, email, username, role, team, status, avatar_color, department, plant, phone, portal_role FROM users",
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json({ data: results });
    }
  );
});

app.post("/api/users", async (req, res) => {
  const { name, email, username, password, role, team, status, avatar_color, portal_role, department, plant } = req.body;
  if (!name || !email || !username || !password) {
    return res.status(400).json({ message: "Name, email, username, and password are required" });
  }
  try {
    // ── Block staff-reserved emails (unless creating an it_staff account) ────
    const resolvedPortalRole = portal_role || (role === "Administrator" || role === "Admin" || role === "admin" ? "admin" : "user");
    if (resolvedPortalRole !== "it_staff") {
      const staffEmails = new Set(VIRAJ_STAFF_ROSTER.map((p) => p.email.toLowerCase()));
      if (staffEmails.has(email.toLowerCase())) {
        return res.status(403).json({
          message: "This email address belongs to an IT staff member and cannot be assigned to a regular user account.",
        });
      }
      // Also check the DB for any existing it_staff row with this email
      const staffInDb = await query(
        "SELECT id FROM users WHERE LOWER(email) = LOWER(?) AND portal_role = 'it_staff'",
        [email]
      );
      if (staffInDb.length > 0) {
        return res.status(403).json({
          message: "This email address belongs to an IT staff member and cannot be assigned to a regular user account.",
        });
      }
    }
    const hashed = await bcrypt.hash(password, 10);
    const sql = `INSERT INTO users (name,email,username,hashed_password,role,team,status,avatar_color,portal_role,department,plant) VALUES (?,?,?,?,?,?,?,?,?,?,?)`;
    const result = await query(sql, [name, email, username, hashed, role, team, status || "Available", avatar_color || "#0f172a", resolvedPortalRole, department || null, plant || null]);
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "A user with this email or username already exists" });
    res.status(500).json({ message: err.message });
  }
});

app.put("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email, username, password, role, team, status, avatar_color, portal_role, department, plant } = req.body;
  console.log("[PUT /api/users/:id] id:", id, "body:", { name, email, username, role, team, status, avatar_color, portal_role, department, plant, hasPassword: !!(password && password.trim()) });
  const resolvedPortalRole = portal_role || (role === "Administrator" || role === "Admin" || role === "admin" ? "admin" : "user");
  try {
    let result;
    if (password && password.trim()) {
      // Update including new hashed password
      const hashed = await bcrypt.hash(password, 10);
      result = await query(
        `UPDATE users SET name=?,email=?,username=?,hashed_password=?,role=?,team=?,status=?,avatar_color=?,portal_role=?,department=?,plant=? WHERE id=?`,
        [name, email, username, hashed, role, team, status, avatar_color, resolvedPortalRole, department || null, plant || null, id]
      );
    } else {
      // Update without touching the password
      result = await query(
        `UPDATE users SET name=?,email=?,username=?,role=?,team=?,status=?,avatar_color=?,portal_role=?,department=?,plant=? WHERE id=?`,
        [name, email, username, role, team, status, avatar_color, resolvedPortalRole, department || null, plant || null, id]
      );
    }
    console.log("[PUT /api/users/:id] affectedRows:", result.affectedRows);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found. No rows updated." });
    }
    res.json({ success: true });
  } catch (err) {
    console.error("[PUT /api/users/:id] error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

app.delete("/api/users/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM users WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.affectedRows === 0) return res.status(404).json({ message: "User not found" });
    res.json({ success: true, message: "User deleted successfully" });
  });
});

// TICKET COMMENTS (legacy endpoint kept for existing admin TicketDetail)
app.get("/api/tickets/:id/comments", async (req, res) => {
  const { id } = req.params;
  const rows = await query(
    "SELECT * FROM ticket_comments WHERE ticket_id = ? ORDER BY created_at ASC",
    [id]
  ).catch(() => []);
  res.json({ data: rows });
});

app.post("/api/tickets/:id/comments", authenticateJWT, async (req, res) => {
  const { id } = req.params;
  const { body } = req.body;
  const authorName = req.user?.name || "Admin";
  const authorRole = req.user?.portal_role || "admin";

  try {
    const ticketRows = await query(`SELECT ${TICKET_SLIM_COLUMNS} FROM tickets WHERE id = ?`, [id]).catch(() => []);
    if (ticketRows.length === 0) return res.status(404).json({ message: "Ticket not found" });
    if (isClosedStatus(ticketRows[0]?.status)) {
      return res.status(409).json({ message: "Closed tickets are read-only" });
    }

    const result = await query(
      "INSERT INTO ticket_comments (ticket_id, author_name, author_email, author_role, body) VALUES (?,?,?,?,?)",
      [id, authorName, req.user?.email || null, authorRole, body]
    );

    // Email trigger: admin comment → notify user
    if (authorRole === "admin") {
      sendAdminCommentToUser(ticketRows[0], body).catch(() => {});
    }

    res.json({ success: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PDF download stub (keep existing)
app.get("/api/tickets/:id/pdf", authenticateJWT, async (req, res) => {
  try {
    const rows = await query(`SELECT ${TICKET_SLIM_COLUMNS} FROM tickets WHERE id = ?`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: "Ticket not found" });

    const ticket = rows[0];
    const comments = await query(
      "SELECT * FROM ticket_comments WHERE ticket_id = ? ORDER BY created_at ASC",
      [req.params.id]
    ).catch(() => []);
    const timeline = await loadTicketActivity(req.params.id);

    const pdf = await buildTicketPdf(ticket, comments, timeline);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${ticket.ticket_id}.pdf"`);
    res.send(pdf);
  } catch (err) {
    console.error("PDF error:", err);
    res.status(500).json({ message: err.message });
  }
});

// ════════════════════════════════════════════════════════════════
// NEW: USER PORTAL ROUTES
// ════════════════════════════════════════════════════════════════

// GET USER'S TICKETS
app.get("/api/user/tickets", authenticateJWT, requireUser, async (req, res) => {
  const email = req.user.email;
  const { status, priority } = req.query;

  let sql = `SELECT ${TICKET_SLIM_COLUMNS} FROM tickets WHERE (requester_email = ? OR user_email = ?)`;
  let params = [email, email];

  if (status) { sql += " AND status = ?"; params.push(status); }
  if (priority) { sql += " AND priority = ?"; params.push(priority); }
  sql += " ORDER BY created_at DESC";

  try {
    const rows = await query(sql, params);
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET USER DASHBOARD SNAPSHOT — counts plus recent tickets only
app.get("/api/user/dashboard", authenticateJWT, requireUser, async (req, res) => {
  const email = req.user.email;
  const recentLimit = Math.min(10, Math.max(1, parseInt(req.query.recentLimit, 10) || 5));

  try {
    const [summaryRows, recentRows] = await Promise.all([
      query(
        `SELECT
           COUNT(*) AS total,
           SUM(CASE WHEN status = 'Open' THEN 1 ELSE 0 END) AS open,
           SUM(CASE WHEN status IN ('Assigned', 'In Progress', 'Work In Progress') THEN 1 ELSE 0 END) AS inProgress,
           SUM(CASE WHEN status LIKE '%Hold%' OR status LIKE '%Pending%' THEN 1 ELSE 0 END) AS onHold,
           SUM(CASE WHEN status IN ('Resolved', 'Closed') THEN 1 ELSE 0 END) AS resolved
         FROM tickets
         WHERE (requester_email = ? OR user_email = ?)`,
        [email, email]
      ),
      query(
        `SELECT ${TICKET_SLIM_COLUMNS}
         FROM tickets
         WHERE (requester_email = ? OR user_email = ?)
         ORDER BY created_at DESC
         LIMIT ?`,
        [email, email, recentLimit]
      ),
    ]);

    const summary = summaryRows[0] || {};
    res.json({
      data: {
        summary: {
          total: Number(summary.total || 0),
          open: Number(summary.open || 0),
          inProgress: Number(summary.inProgress || 0),
          onHold: Number(summary.onHold || 0),
          resolved: Number(summary.resolved || 0),
        },
        recentTickets: recentRows,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CREATE TICKET (user — triggers emails)
// GET: Public list of IT staff members — used by user portal Assign To dropdown
app.get("/api/staff/members", authenticateJWT, async (req, res) => {
  try {
    const rows = await query(
      "SELECT id, name, email, role, department, plant FROM users WHERE portal_role = 'it_staff' ORDER BY role, name",
      []
    );
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/ticket-metadata", authenticateJWT, async (req, res) => {
  try {
    const metadata = await loadTicketLookups();
    res.json({ data: metadata });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST: Staff transfer/reassign ticket to another staff member
app.post("/api/staff/tickets/:id/transfer", authenticateJWT, requireStaff, async (req, res) => {
  const { id } = req.params;
  const { assigneeId, note } = req.body;

  if (!assigneeId) {
    return res.status(400).json({ message: "Target staff member is required" });
  }

  try {
    const actorName = req.user.name;
    const isAdmin = req.user?.portal_role === "admin" || req.user?.role === "Administrator" || req.user?.role === "admin";

    const currentRows = isAdmin
      ? await query(`SELECT ${TICKET_SLIM_COLUMNS} FROM tickets WHERE id = ?`, [id])
      : await query(`SELECT ${TICKET_SLIM_COLUMNS} FROM tickets WHERE id = ? AND assigned_to = ?`, [id, actorName]);

    if (currentRows.length === 0) {
      return res.status(404).json({ message: "Ticket not found or not assigned to you" });
    }

    const currentTicket = currentRows[0];
    if (isClosedStatus(currentTicket?.status)) {
      return res.status(409).json({ message: "Closed tickets are read-only" });
    }
    const targetRows = await query(
      "SELECT id, name, email FROM users WHERE id = ? AND portal_role = 'it_staff' LIMIT 1",
      [assigneeId]
    );

    if (targetRows.length === 0) {
      return res.status(404).json({ message: "Target staff member not found" });
    }

    const target = targetRows[0];
    if (String(currentTicket.assigned_to || "") === String(target.name || "")) {
      return res.status(409).json({ message: "Ticket is already assigned to that staff member" });
    }

    await query(
      `UPDATE tickets
       SET assigned_to = ?, updated_at = NOW()
       WHERE id = ?`,
      [target.name, id]
    );

    await logTicketActivity(id, {
      eventType: "assignment",
      actorName,
      actorEmail: req.user?.email || null,
      actorRole: req.user?.portal_role || req.user?.role || null,
      fieldName: "assigned_to",
      fromValue: currentTicket.assigned_to || "Unassigned",
      toValue: target.name,
      note: note?.trim() ? note.trim() : `Transferred by ${actorName}`,
    }).catch(() => {});

    const updatedRows = await query(`SELECT ${TICKET_SLIM_COLUMNS} FROM tickets WHERE id = ?`, [id]);
    const updatedTicket = updatedRows[0] || { ...currentTicket, assigned_to: target.name };

    sendTicketTransferredToAssignee(updatedTicket, target.email, actorName)
      .then(() => console.log(`✅ Transfer email sent to ${target.email} for ticket #${id}`))
      .catch((e) => console.error(`❌ Transfer email error:`, e.message));

    res.json({ success: true, message: "Ticket transferred successfully", data: updatedTicket });
  } catch (err) {
    console.error("Transfer error:", err);
    res.status(500).json({ message: err.message });
  }
});

async function createPortalTicket(req, res, portal) {
  const user = req.user;
  const {
    title, description, service, category, sub_category, priority, assigned_to, plant,
    // Staff-on-behalf fields (only used when portal === "staff")
    requester_name, requester_email: bodyRequesterEmail, requester_phone, requester_cisco_number,
    request_source,
    // Staff mode: 'on_behalf' (create for a user) | 'self' (staff's own issue)
    staff_mode,
  } = req.body;

  if (!title || !category || !priority) {
    return res.status(400).json({ message: "Title, category, and priority are required" });
  }

  const validation = validateTicketInputs({ service, category, sub_category, plant, portal });
  if (!validation.ok) {
    return res.status(400).json({ message: validation.errors[0] });
  }

  const normalizedService = validation.service;
  const selectedPlant = plant || user.plant || null;
  const allowedAssignments = await loadAssignableStaffFromDb(category, sub_category, selectedPlant).catch(() => []);
  const allowedNames = allowedAssignments.map((item) => item.name || item.staff_name).filter(Boolean);
  const manualAssignee = String(assigned_to || "").trim();
  let finalAssignee = manualAssignee || "";

  if (manualAssignee && !allowedNames.includes(manualAssignee)) {
    return res.status(400).json({ message: "Selected assignee is not valid for the chosen sub-category" });
  }

  if (!finalAssignee && allowedNames.length === 1) {
    finalAssignee = allowedNames[0];
  }

  if (category === "SAP Application" && sub_category === "CTM") {
    const ctmAssignment = allowedAssignments[0] || null;
    if (ctmAssignment?.staff_name) {
      finalAssignee = ctmAssignment.staff_name;
    } else if (ctmAssignment?.name) {
      finalAssignee = ctmAssignment.name;
    } else {
      finalAssignee = "";
    }
  }

  // For staff portal: use the submitted requester info (not the staff's own info)
  const isStaffPortal = portal === "staff";
  // 'self' = staff raising ticket for own issue; 'on_behalf' = staff raising for another user
  const resolvedStaffMode = isStaffPortal ? (staff_mode || "on_behalf") : null;
  const isSelfTicket = resolvedStaffMode === "self";

  let customerName, customerEmail, customerPhone, raisedByStaff, finalRequestSource;

  if (isStaffPortal) {
    if (isSelfTicket) {
      // Staff is raising a ticket for their own issue — use their own info as the requester
      customerName = user.name;
      customerEmail = user.email;
      customerPhone = user.phone || null;
      raisedByStaff = null; // Not "on behalf" — it's their own ticket
      finalRequestSource = null;
    } else {
      // On behalf of another user — use submitted requester fields
      customerName  = requester_name   || user.name;
      customerEmail = bodyRequesterEmail || user.email;
      customerPhone = requester_phone  || user.phone || null;
      raisedByStaff = user.name; // The staff member who created this
      finalRequestSource = request_source || null;
    }
  } else {
    // Regular user portal
    customerName  = user.name;
    customerEmail = user.email;
    customerPhone = user.phone || null;
    raisedByStaff = null;
    finalRequestSource = null;
  }

  try {
    const ticketId = await generateTicketId(normalizedService);

    const attachmentName = req.file ? req.file.originalname : null;
    const attachmentMime = req.file ? req.file.mimetype : null;
    const attachmentData = req.file ? req.file.buffer : null;

    const sql = `INSERT INTO tickets
      (ticket_id, title, description, category, sub_category, priority, status,
       customer_name, requester_email, phone, department, user_email, plant,
       assigned_to, service, attachment_name, attachment_mime, attachment_data,
       request_source, raised_by_staff)
      VALUES (?,?,?,?,?,?,'Open',?,?,?,?,?,?,?,?,?,?,?,?,?)`;

    const result = await query(sql, [
      ticketId,
      title,
      description,
      category,
      sub_category || null,
      priority,
      customerName,
      customerEmail,
      customerPhone,
      user.department || null,
      customerEmail,
      selectedPlant,
      finalAssignee || null,
      normalizedService,
      attachmentName,
      attachmentMime,
      attachmentData,
      finalRequestSource,
      raisedByStaff,
    ]);

    await logTicketActivity(result.insertId, {
      eventType: "created",
      actorName: user.name,
      actorEmail: user.email || null,
      actorRole: user.portal_role || user.role || null,
      fieldName: "ticket",
      toStatus: "Open",
      note: `Ticket created via ${isStaffPortal ? "staff" : "user"} portal`,
    }).catch(() => {});

    if (finalAssignee) {
      await logTicketActivity(result.insertId, {
        eventType: "assignment",
        actorName: user.name,
        actorEmail: user.email || null,
        actorRole: user.portal_role || user.role || null,
        fieldName: "assigned_to",
        toValue: finalAssignee,
        note: isStaffPortal && !isSelfTicket ? "Initial assignment on behalf of a user" : "Initial assignment",
      }).catch(() => {});
    }

    const newTicket = {
      id: result.insertId,
      ticket_id: ticketId,
      title,
      description,
      category,
      sub_category,
      priority,
      service: normalizedService,
      status: "Open",
      customer_name: customerName,
      requester_email: customerEmail,
      phone: customerPhone,
      department: user.department,
      plant: selectedPlant,
      assigned_to: finalAssignee || null,
      created_at: new Date(),
      attachment_name: attachmentName,
      attachment_mime: attachmentMime,
      attachment_data: attachmentData,
      request_source: finalRequestSource,
      raised_by_staff: raisedByStaff,
    };

    // For staff portal, send confirmation to the requester's email (not staff's)
    const confirmationRecipient = customerEmail;
    console.log(`📧 Sending confirmation email to ${confirmationRecipient} for ticket ${ticketId}`);
    const emailJobs = [
      sendTicketConfirmationToUser(newTicket).then(() => {
        console.log(`✅ Confirmation email sent to ${confirmationRecipient} for ${ticketId}`);
      }),
    ];

    if (finalAssignee) {
      try {
        // First try to find email from users table by name
        let assigneeEmail = null;
        const userRows = await query("SELECT email FROM users WHERE name = ? LIMIT 1", [finalAssignee]);
        assigneeEmail = userRows[0]?.email || null;

        // If not found in users table, try staff_assignment table
        if (!assigneeEmail) {
          const staffRows = await query(
            "SELECT staff_email FROM staff_assignment WHERE staff_name = ? LIMIT 1",
            [finalAssignee]
          );
          assigneeEmail = staffRows[0]?.staff_email || null;
        }

        if (assigneeEmail) {
          emailJobs.push(
            sendTicketAssignedToAssignee(newTicket, assigneeEmail, raisedByStaff).then(() => {
              console.log(`✅ Assignment email sent to ${assigneeEmail} for ticket ${ticketId}`);
            })
          );
        } else {
          console.warn(`⚠️ Could not find email for assigned user "${finalAssignee}" — checked users + staff_assignment tables`);
        }
      } catch (lookupErr) {
        console.error(`❌ User lookup error for assignment email:`, lookupErr.message);
      }
    }

    const emailResults = await Promise.allSettled(emailJobs);
    for (const resultItem of emailResults) {
      if (resultItem.status === "rejected") {
        console.error(`❌ Ticket email failed:`, resultItem.reason?.message || resultItem.reason);
      }
    }

    res.json({ success: true, data: newTicket });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
}

app.post("/api/user/tickets", authenticateJWT, requireUser, upload.single("attachment"), async (req, res) => {
  return createPortalTicket(req, res, "user");
});

app.post("/api/staff/tickets", authenticateJWT, requireStaff, upload.single("attachment"), async (req, res) => {
  return createPortalTicket(req, res, "staff");
});

// SERVE TICKET ATTACHMENT — accepts token via header OR ?token= query param (for browser links)
app.get("/api/tickets/:id/attachment", async (req, res) => {
  try {
    // Accept JWT from Authorization header OR ?token= query param
    let token = req.query.token || "";
    if (!token) {
      const auth = req.headers.authorization || "";
      if (auth.startsWith("Bearer ")) token = auth.slice(7);
    }
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    try {
      jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const rows = await query(
      "SELECT attachment_name, attachment_mime, attachment_data FROM tickets WHERE id = ?",
      [req.params.id]
    );
    const ticket = rows[0];
    if (!ticket || !ticket.attachment_data) {
      return res.status(404).json({ message: "No attachment found" });
    }
    res.setHeader("Content-Type", ticket.attachment_mime || "application/octet-stream");
    res.setHeader("Content-Disposition", `inline; filename="${ticket.attachment_name || "attachment"}"`);
    res.send(ticket.attachment_data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// GET SINGLE USER TICKET
app.get("/api/user/tickets/:id", authenticateJWT, requireUser, async (req, res) => {
  const { id } = req.params;
  const email = req.user.email;

  try {
    const rows = await query(
      `SELECT ${TICKET_SLIM_COLUMNS}
       FROM tickets
       WHERE id = ? AND (requester_email = ? OR user_email = ?)`,
      [id, email, email]
    );
    if (rows.length === 0) return res.status(404).json({ message: "Ticket not found" });

    const ticket = rows[0];
    const comments = await query(
      "SELECT * FROM ticket_comments WHERE ticket_id = ? ORDER BY created_at ASC",
      [id]
    ).catch(() => []);
    const history = await loadTicketActivity(id);

    res.json({ data: ticket, comments, timeline: history });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// USER ADDS FOLLOW-UP COMMENT
app.post("/api/user/tickets/:id/comment", authenticateJWT, requireUser, async (req, res) => {
  const { id } = req.params;
  const { body } = req.body;
  const user = req.user;

  if (!body?.trim()) return res.status(400).json({ message: "Comment cannot be empty" });

  try {
    // Verify ticket belongs to user
    const rows = await query(
      `SELECT ${TICKET_SLIM_COLUMNS}
       FROM tickets
       WHERE id = ? AND (requester_email = ? OR user_email = ?)`,
      [id, user.email, user.email]
    );
    if (rows.length === 0) return res.status(404).json({ message: "Ticket not found" });
    if (isClosedStatus(rows[0]?.status)) {
      return res.status(409).json({ message: "Closed tickets are read-only" });
    }

    await query(
      "INSERT INTO ticket_comments (ticket_id, author_name, author_email, author_role, body) VALUES (?,?,?,?,?)",
      [id, user.name, user.email, "user", body.trim()]
    );

    // Email admin
    sendUserCommentToAdmin(rows[0], body.trim(), user.name).catch(() => {});

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ════════════════════════════════════════════════════════════════
// NEW: ADMIN STATUS/COMMENT ROUTES (with email triggers)
// ════════════════════════════════════════════════════════════════

// ADMIN UPDATE STATUS
app.patch("/api/admin/tickets/:id/status", authenticateJWT, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;

  try {
    const oldRows = await query(`SELECT ${TICKET_SLIM_COLUMNS} FROM tickets WHERE id = ?`, [id]);
    if (oldRows.length === 0) return res.status(404).json({ message: "Ticket not found" });

    const oldTicket = oldRows[0];
    if (isClosedStatus(oldTicket?.status)) {
      return res.status(409).json({ message: "Closed tickets are read-only" });
    }
    const nextSql =
      status === "Resolved"
        ? "UPDATE tickets SET status = ?, resolved_at = NOW(), actual_closure_date = NOW(), updated_at = NOW() WHERE id = ?"
        : status === "Closed"
          ? "UPDATE tickets SET status = ?, actual_closure_date = NOW(), updated_at = NOW() WHERE id = ?"
          : "UPDATE tickets SET status = ?, updated_at = NOW() WHERE id = ?";
    await query(nextSql, [status, id]);

    // Record history
    await logTicketActivity(id, {
      eventType: "status",
      actorName: req.user?.name || "Admin",
      actorEmail: req.user?.email || null,
      actorRole: req.user?.portal_role || req.user?.role || "admin",
      fieldName: "status",
      fromStatus: oldTicket.status,
      toStatus: status,
      note: note || null,
    }).catch(() => {});

    // Email user
    sendStatusUpdateToUser({ ...oldTicket, status }, status, note || null).catch(() => {});

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ADMIN ADD COMMENT (with email)
app.post("/api/admin/tickets/:id/comment", authenticateJWT, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { body } = req.body;

  if (!body?.trim()) return res.status(400).json({ message: "Comment cannot be empty" });

  try {
    const rows = await query(`SELECT ${TICKET_SLIM_COLUMNS} FROM tickets WHERE id = ?`, [id]);
    if (rows.length === 0) return res.status(404).json({ message: "Ticket not found" });
    if (isClosedStatus(rows[0]?.status)) {
      return res.status(409).json({ message: "Closed tickets are read-only" });
    }

    await query(
      "INSERT INTO ticket_comments (ticket_id, author_name, author_email, author_role, body) VALUES (?,?,?,?,?)",
      [id, req.user?.name || "Admin", req.user?.email || null, "admin", body.trim()]
    );

    // Email user
    sendAdminCommentToUser(rows[0], body.trim()).catch(() => {});

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ════════════════════════════════════════════════════════════════
// RESOLVE TICKET (admin — updates status, saves resolution, emails user)
// ════════════════════════════════════════════════════════════════
app.put("/api/tickets/:id/resolve", authenticateJWT, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { resolvedBy, resolutionNote, department } = req.body;

  if (!resolutionNote?.trim()) {
    return res.status(400).json({ message: "Resolution note is required" });
  }

  try {
    // Fetch existing ticket
    const rows = await query(`SELECT ${TICKET_SLIM_COLUMNS} FROM tickets WHERE id = ?`, [id]);
    if (rows.length === 0) return res.status(404).json({ message: "Ticket not found" });

    const oldTicket = rows[0];

    if (isClosedStatus(oldTicket?.status)) {
      return res.status(409).json({ message: "Closed tickets are read-only" });
    }
    if (oldTicket.status === "Resolved") {
      return res.status(409).json({ message: "Ticket is already resolved" });
    }

    const resolvedByName = resolvedBy?.trim() || req.user?.name || "Admin";

    // Update ticket in DB
    await query(
      `UPDATE tickets
         SET status            = 'Resolved',
             resolved_at       = NOW(),
             actual_closure_date = NOW(),
             resolution_note   = ?,
             resolved_by       = ?,
             updated_at        = NOW()
       WHERE id = ?`,
      [resolutionNote.trim(), resolvedByName, id]
    );

    // Record status history
    await logTicketActivity(id, {
      eventType: "resolution",
      actorName: resolvedByName,
      actorEmail: req.user?.email || null,
      actorRole: req.user?.portal_role || req.user?.role || "admin",
      fieldName: "status",
      fromStatus: oldTicket.status,
      toStatus: "Resolved",
      note: resolutionNote.trim(),
    }).catch(() => {});

    // Fetch updated ticket for email
    const updatedRows = await query(`SELECT ${TICKET_SLIM_COLUMNS} FROM tickets WHERE id = ?`, [id]).catch(() => []);
    const updatedTicket = updatedRows[0] || { ...oldTicket, status: "Resolved" };

    // Send resolution email to user (non-blocking)
    sendResolutionToUser(updatedTicket, resolvedByName, resolutionNote.trim())
      .then(() => console.log(`✅ Resolution email sent for ticket #${id}`))
      .catch((e) => console.error(`❌ Resolution email error:`, e.message));

    res.json({ success: true, message: "Ticket resolved successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// ════════════════════════════════════════════════════════════════
// IT STAFF PORTAL ROUTES
// ════════════════════════════════════════════════════════════════

// GET: Staff's assigned tickets (only tickets where assigned_to = logged-in staff name)
app.get("/api/staff/tickets", authenticateJWT, requireStaff, async (req, res) => {
  try {
    const staffName = req.user.name;
    const { status, priority, search } = req.query;
    let sql = `SELECT ${TICKET_SLIM_COLUMNS} FROM tickets WHERE assigned_to = ?`;
    const params = [staffName];
    if (status)   { sql += " AND status = ?";                            params.push(status); }
    if (priority) { sql += " AND priority = ?";                          params.push(priority); }
    if (search)   { sql += " AND (title LIKE ? OR ticket_id LIKE ?)";    params.push(`%${search}%`, `%${search}%`); }
    sql += " ORDER BY created_at DESC";
    const rows = await query(sql, params);
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH: Staff updates ticket status on assigned ticket
app.patch("/api/staff/tickets/:id/status", authenticateJWT, requireStaff, async (req, res) => {
  const { id } = req.params;
  const { status, note = "", resolutionNote = "" } = req.body || {};

  if (!status) {
    return res.status(400).json({ message: "Status is required" });
  }

  try {
    const staffName = req.user.name;
    const isAdmin = req.user?.portal_role === "admin" || req.user?.role === "Administrator" || req.user?.role === "admin";

    const rows = isAdmin
      ? await query(`SELECT ${TICKET_SLIM_COLUMNS} FROM tickets WHERE id = ?`, [id])
      : await query(`SELECT ${TICKET_SLIM_COLUMNS} FROM tickets WHERE id = ? AND assigned_to = ?`, [id, staffName]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Ticket not found or not assigned to you" });
    }

    const current = rows[0];
    if (isClosedStatus(current?.status)) {
      return res.status(409).json({ message: "Closed tickets are read-only" });
    }
    if ((current.status || "") === status) {
      return res.status(409).json({ message: "Ticket already has that status" });
    }
    if (!current.assigned_to && status !== "Open") {
      return res.status(409).json({ message: "Assign the ticket first before changing it to an active workflow status." });
    }
    if (!canMoveToFinalStaffStatus(current.status, status)) {
      return res.status(409).json({
        message:
          status === "Closed"
            ? "You can close this ticket only after it has been resolved."
            : "Move the ticket to Work In Progress or On Hold before resolving or rejecting it.",
      });
    }

    const cleanNote = (resolutionNote || note || "").trim();

    if (status === "Resolved") {
      await query(
        `UPDATE tickets
           SET status = ?, resolved_at = NOW(), actual_closure_date = NOW(), resolved_by = ?, resolution_note = ?, updated_at = NOW()
         WHERE id = ?`,
        [status, staffName, cleanNote || current.resolution_note || "", id]
      );
    } else if (status === "Closed") {
      await query(
        `UPDATE tickets
           SET status = ?, actual_closure_date = NOW(), updated_at = NOW()
         WHERE id = ?`,
        [status, id]
      );
    } else {
      await query(
        `UPDATE tickets
           SET status = ?, updated_at = NOW()
         WHERE id = ?`,
        [status, id]
      );
    }

    await logTicketActivity(id, {
      eventType: status === "Resolved" ? "resolution" : status === "Closed" ? "closure" : "status",
      actorName: staffName,
      actorEmail: req.user?.email || null,
      actorRole: req.user?.portal_role || req.user?.role || null,
      fieldName: "status",
      fromStatus: current.status || "Unknown",
      toStatus: status,
      note: cleanNote || null,
    }).catch(() => {});

    const updatedRows = await query(`SELECT ${TICKET_SLIM_COLUMNS} FROM tickets WHERE id = ?`, [id]).catch(() => []);
    const updatedTicket = updatedRows[0] || { ...current, status };

    if (status === "Resolved") {
      sendResolutionToUser(updatedTicket, staffName, cleanNote || "Resolved by staff")
        .then(() => console.log(`✅ Staff resolution email sent for ticket #${id}`))
        .catch((e) => console.error(`❌ Staff resolution email error:`, e.message));
    } else {
      sendStatusUpdateToUser(updatedTicket, status, cleanNote || null)
        .then(() => console.log(`✅ Staff status update email sent for ticket #${id}`))
        .catch((e) => console.error(`❌ Staff status email error:`, e.message));
    }

    res.json({ success: true, data: updatedTicket });
  } catch (err) {
    console.error("Staff status update error:", err);
    res.status(500).json({ message: err.message });
  }
});

// GET: Staff's resolved ticket history (count + list)
app.get("/api/staff/resolved-history", authenticateJWT, requireStaff, async (req, res) => {
  try {
    const staffName = req.user.name;
    const rows = await query(
      `SELECT id, ticket_id, title, category, priority, resolved_at, resolution_note, customer_name
       FROM tickets
       WHERE resolved_by = ? AND status = 'Resolved'
       ORDER BY resolved_at DESC`,
      [staffName]
    );
    res.json({ data: rows, count: rows.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET: Staff personal reports — only their assigned tickets
app.get("/api/staff/reports", authenticateJWT, requireStaff, async (req, res) => {
  try {
    const staffName = req.user.name;
    const { from, to } = req.query;

    const conditions = ["assigned_to = ?"];
    const params = [staffName];
    if (from) { conditions.push("DATE(created_at) >= ?"); params.push(from); }
    if (to)   { conditions.push("DATE(created_at) <= ?"); params.push(to); }

    const where = `WHERE ${conditions.join(" AND ")}`;
    const rows  = await query(`SELECT ${TICKET_SLIM_COLUMNS} FROM tickets ${where} ORDER BY created_at DESC`, params);

    // ── Summary counts ──────────────────────────────────────────────
    const total      = rows.length;
    const open       = rows.filter(t => t.status === "Open").length;
    const inProgress = rows.filter(t => t.status === "Work In Progress" || t.status === "In Progress" || t.status === "Assigned").length;
    const resolved   = rows.filter(t => t.status === "Resolved").length;
    const closed     = rows.filter(t => t.status === "Closed").length;

    // ── By Status chart ─────────────────────────────────────────────
    const statusMap = {};
    rows.forEach(t => { const s = t.status || "Unknown"; statusMap[s] = (statusMap[s] || 0) + 1; });

    // ── By Priority chart ───────────────────────────────────────────
    const priorityMap = {};
    rows.forEach(t => { const p = t.priority || "Unknown"; priorityMap[p] = (priorityMap[p] || 0) + 1; });

    // ── Resolved per month (last 6 months) ─────────────────────────
    const resolvedRows = rows.filter(t => ["Resolved", "Closed"].includes(t.status) && t.actual_closure_date);
    const monthMap = {};
    resolvedRows.forEach(t => {
      const d = new Date(t.actual_closure_date);
      const key = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit", timeZone: "Asia/Kolkata" });
      monthMap[key] = (monthMap[key] || 0) + 1;
    });

    // ── Avg resolution time ─────────────────────────────────────────
    let totalMinutes = 0, countMinutes = 0;
    resolvedRows.forEach(t => {
      const mins = Number(t.resolution_time || 0) ||
        Math.max(1, Math.round((new Date(t.actual_closure_date) - new Date(t.created_at)) / 60000));
      totalMinutes += mins;
      countMinutes++;
    });
    const avgResolutionMinutes = countMinutes > 0 ? Math.round(totalMinutes / countMinutes) : 0;

    // ── Category breakdown ──────────────────────────────────────────
    const categoryMap = {};
    rows.forEach(t => { const c = t.category || "Unknown"; categoryMap[c] = (categoryMap[c] || 0) + 1; });

    res.json({
      data: {
        summary: { total, open, inProgress, resolved, closed, avgResolutionMinutes },
        byStatus:      Object.entries(statusMap).map(([name, value]) => ({ name, value })),
        byPriority:    Object.entries(priorityMap).map(([name, value]) => ({ name, value })),
        byCategory:    Object.entries(categoryMap).map(([name, value]) => ({ name, value })),
        resolvedPerMonth: Object.entries(monthMap).map(([name, value]) => ({ name, value })),
        tickets: rows.map(t => ({
          ticket_id: t.ticket_id,
          title: t.title,
          category: t.category,
          priority: t.priority,
          status: t.status,
          customer_name: t.customer_name,
          created_at: t.created_at,
          actual_closure_date: t.actual_closure_date,
          resolved_at: t.resolved_at,
          closed_at: t.closed_at,
          updated_at: t.updated_at,
          resolution_time: t.resolution_time,
        })),
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET: Single assigned ticket for staff
app.get("/api/staff/tickets/:id", authenticateJWT, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const staffName = req.user.name;
    // Admin can view any ticket; staff can only view assigned ones
    const isAdmin = req.user?.portal_role === "admin" || req.user?.role === "Administrator" || req.user?.role === "admin";
    const rows = isAdmin
      ? await query(`SELECT ${TICKET_SLIM_COLUMNS} FROM tickets WHERE id = ?`, [id])
      : await query(`SELECT ${TICKET_SLIM_COLUMNS} FROM tickets WHERE id = ? AND assigned_to = ?`, [id, staffName]);
    if (rows.length === 0) return res.status(404).json({ message: "Ticket not found or not assigned to you" });
    const ticket = rows[0];
    const comments = await query(
      "SELECT * FROM ticket_comments WHERE ticket_id = ? ORDER BY created_at ASC", [id]
    ).catch(() => []);
    const timeline = await loadTicketActivity(id);
    res.json({ data: ticket, comments, timeline });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT: Staff resolves their assigned ticket — emails user + admin
app.put("/api/staff/tickets/:id/resolve", authenticateJWT, requireStaff, async (req, res) => {
  const { id } = req.params;
  const { resolutionNote } = req.body;
  if (!resolutionNote?.trim()) {
    return res.status(400).json({ message: "Resolution note is required" });
  }
  try {
    const staffName = req.user.name;
    const isAdmin = req.user?.portal_role === "admin" || req.user?.role === "Administrator" || req.user?.role === "admin";
    const rows = isAdmin
      ? await query(`SELECT ${TICKET_SLIM_COLUMNS} FROM tickets WHERE id = ?`, [id])
      : await query(`SELECT ${TICKET_SLIM_COLUMNS} FROM tickets WHERE id = ? AND assigned_to = ?`, [id, staffName]);
    if (rows.length === 0) return res.status(404).json({ message: "Ticket not found or not assigned to you" });
    const oldTicket = rows[0];
    if (isClosedStatus(oldTicket?.status)) {
      return res.status(409).json({ message: "Closed tickets are read-only" });
    }
    if (oldTicket.status === "Resolved") {
      return res.status(409).json({ message: "Ticket is already resolved" });
    }
    if (!isStaffWorkStage(oldTicket.status)) {
      return res.status(409).json({
        message: "Please move the ticket to Work In Progress or On Hold before resolving it.",
      });
    }
    await query(
      `UPDATE tickets SET status='Resolved', resolved_at=NOW(), resolution_note=?, resolved_by=?, updated_at=NOW() WHERE id=?`,
      [resolutionNote.trim(), staffName, id]
    );
    await logTicketActivity(id, {
      eventType: "resolution",
      actorName: staffName,
      actorEmail: req.user?.email || null,
      actorRole: req.user?.portal_role || req.user?.role || null,
      fieldName: "status",
      fromStatus: oldTicket.status,
      toStatus: "Resolved",
      note: resolutionNote.trim(),
    }).catch(() => {});
    const updatedRows = await query(`SELECT ${TICKET_SLIM_COLUMNS} FROM tickets WHERE id = ?`, [id]).catch(() => []);
    const updatedTicket = updatedRows[0] || { ...oldTicket, status: "Resolved" };
    // Email user: your ticket has been resolved
    sendResolutionToUser(updatedTicket, staffName, resolutionNote.trim())
      .then(() => console.log(`✅ Resolution email sent to user for ticket #${id}`))
      .catch((e) => console.error(`❌ User resolution email error:`, e.message));
    // Email admin: sub-branch has resolved a ticket
    sendSubBranchResolutionToAdmin(updatedTicket, staffName, resolutionNote.trim())
      .then(() => console.log(`✅ Sub-branch resolution notification sent to admin for ticket #${id}`))
      .catch((e) => console.error(`❌ Admin resolution notification error:`, e.message));
    res.json({ success: true, message: "Ticket resolved successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// POST: Staff adds comment to their assigned ticket
app.post("/api/staff/tickets/:id/comment", authenticateJWT, requireStaff, async (req, res) => {
  const { id } = req.params;
  const { body } = req.body;
  if (!body?.trim()) return res.status(400).json({ message: "Comment cannot be empty" });
  try {
    const staffName = req.user.name;
    const isAdmin = req.user?.portal_role === "admin" || req.user?.role === "Administrator";
    const rows = isAdmin
      ? await query(`SELECT ${TICKET_SLIM_COLUMNS} FROM tickets WHERE id = ?`, [id])
      : await query(`SELECT ${TICKET_SLIM_COLUMNS} FROM tickets WHERE id = ? AND assigned_to = ?`, [id, staffName]);
    if (rows.length === 0) return res.status(404).json({ message: "Ticket not found or not assigned to you" });
    if (isClosedStatus(rows[0]?.status)) {
      return res.status(409).json({ message: "Closed tickets are read-only" });
    }
    await query(
      "INSERT INTO ticket_comments (ticket_id, author_name, author_email, author_role, body) VALUES (?,?,?,?,?)",
      [id, staffName, req.user?.email || null, "admin", body.trim()]
    );
    sendAdminCommentToUser(rows[0], body.trim()).catch(() => {});
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.listen(process.env.PORT || 5000, () => {
  console.log("🚀 Server running on port 5000");
});

const AUTO_CLOSE_INTERVAL_MS = 30 * 60 * 1000;
setTimeout(() => {
  autoCloseResolvedTickets().catch((err) => {
    console.error("❌ Auto-close scheduler error:", err.message);
  });
  setInterval(() => {
    autoCloseResolvedTickets().catch((err) => {
      console.error("❌ Auto-close scheduler error:", err.message);
    });
  }, AUTO_CLOSE_INTERVAL_MS);
}, 5000);
