import dotenv from "dotenv";
import express from "express";
import mysql from "mysql2";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import multer from "multer";
import { buildTicketPdf } from "./utils/pdf.js";

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
  sendAdminCreatedTicketToAdmin,
} from "./emailService.js";

dotenv.config();
const app = express();

const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  multipleStatements: true,
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
  ];
  migrationCols.forEach((sql) => {
    db.query(sql, (migErr) => {
      if (migErr && migErr.errno !== 1060) {
        // errno 1060 = "Duplicate column name" — column already exists, that's fine
        console.warn("⚠️  Migration warning:", migErr.message);
      }
    });
  });
  console.log("✅ Migration queued (resolved_at, resolution_note, resolved_by, attachment columns)");

});

const JWT_SECRET = process.env.JWT_SECRET || "viraj_jwt_secret_change_me";

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

function requireUser(req, res, next) {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  next();
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

// ─── Helper: auto-generate ticket ID ────────────────────────────
async function generateTicketId() {
  const rows = await query("SELECT MAX(id) as maxId FROM tickets");
  const next = (rows[0]?.maxId || 0) + 1;
  return `INC${next}`;
}

app.get("/", (req, res) => {
  res.send("Server Running");
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
  const { name, email, password, phone, department } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required" });
  }
  try {
    const existing = await query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }
    const hashed = await bcrypt.hash(password, 10);
    await query(
      `INSERT INTO users (name, email, username, hashed_password, phone, department, portal_role, role, status, avatar_color)
       VALUES (?, ?, ?, ?, ?, ?, 'user', 'User', 'Active', '#00bcd4')`,
      [name, email, email, hashed, phone || null, department || null]
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
    const rows = await query("SELECT id,name,email,role,portal_role,department,phone,status,team,avatar_color FROM users WHERE id = ?", [req.user.id]);
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
  const { search, status, priority, category, assignee, location, sub_category, service, workgroup, customer_name } = req.query;

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

  const dataSql  = `SELECT * FROM tickets ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  const countSql = `SELECT COUNT(*) AS total FROM tickets ${whereSql}`;

  // Run both queries in parallel using the promise-based interface
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

// NEXT TICKET ID — MUST be before /:id to avoid Express param capture
app.get("/api/tickets/next-id", async (req, res) => {
  try {
    const id = await generateTicketId();
    res.json({ ticket_id: id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET SINGLE TICKET (admin — includes comments + timeline)
app.get("/api/tickets/:id", (req, res) => {
  const { id } = req.params;
  db.query("SELECT * FROM tickets WHERE id = ?", [id], async (err, results) => {
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

      const historyRows = await query(
        "SELECT * FROM ticket_status_history WHERE ticket_id = ? ORDER BY created_at ASC",
        [id]
      ).catch(() => []);
      timeline = historyRows.map((h) => ({
        id: h.id,
        type: "status_change",
        actor_name: h.changed_by || "Admin",
        action: "changed status",
        from_value: h.from_status,
        to_value: h.to_status,
        body: h.note,
        created_at: h.created_at,
      }));
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
    response_time, resolution_time, location, workstream, workgroup, service,
  } = req.body;

  try {
    const ticketId = await generateTicketId();
    const sql = `INSERT INTO tickets
      (ticket_id, title, description, category, sub_category, priority, status,
       customer_name, requester_email, phone, department,
       requested_by, assigned_to,
       expected_closure_date, actual_closure_date,
       response_time, resolution_time, location, workstream, workgroup, service)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
    const result = await query(sql, [
      ticketId, title, description, category || null, sub_category || null,
      priority, status || "Open",
      customer_name || null, requester_email || null, phone || null, department || null,
      requested_by || null, assigned_to || null,
      expected_closure_date || null, actual_closure_date || null,
      response_time || 0, resolution_time || 0,
      location || null, workstream || null, workgroup || null, service || null,
    ]);

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
  const oldRows = await query("SELECT * FROM tickets WHERE id = ?", [id]).catch(() => []);
  const oldTicket = oldRows[0];

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
      query(
        "INSERT INTO ticket_status_history (ticket_id, changed_by, from_status, to_status) VALUES (?,?,?,?)",
        [id, "Admin", oldTicket.status, status]
      ).catch(() => {});
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
  const { location, category, sub_category, service, workgroup, customer } = req.query;

  // Build a reusable filter clause on top of WHERE 1=1
  const filterClauses = [];
  const filterParams  = [];
  if (location)    { filterClauses.push("location = ?");      filterParams.push(location); }
  if (category)    { filterClauses.push("category = ?");      filterParams.push(category); }
  if (sub_category){ filterClauses.push("sub_category = ?");  filterParams.push(sub_category); }
  if (service)     { filterClauses.push("service = ?");       filterParams.push(service); }
  if (workgroup)   { filterClauses.push("workgroup = ?");     filterParams.push(workgroup); }
  if (customer)    { filterClauses.push("customer_name = ?"); filterParams.push(customer); }

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
      q(`SELECT COUNT(*) AS n FROM tickets ${baseWhere} AND (assigned_to IS NULL OR assigned_to = '') AND status NOT IN ('Closed','Cancelled')`),
      // Incident count
      q(`SELECT COUNT(*) AS n FROM tickets ${baseWhere} AND category = 'Incident'`),
      // Service Request count
      q(`SELECT COUNT(*) AS n FROM tickets ${baseWhere} AND category = 'Service Request'`),
      // P1 Incidents
      q(`SELECT COUNT(*) AS n FROM tickets ${baseWhere} AND priority = 'P1' AND category = 'Incident'`),
      // Pending-breach: active tickets (not closed/cancelled)
      q(`SELECT COUNT(*) AS n FROM tickets ${baseWhere} AND status NOT IN ('Closed','Cancelled')`),
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
         ${baseWhere} AND status NOT IN ('Closed','Cancelled')
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

app.get("/api/reports/ageing", (req, res) => { res.json({ data: [] }); });

app.get("/api/reports/detail", (req, res) => {
  const { from, to } = req.query;
  let sql = "SELECT * FROM tickets";
  let params = [];
  if (from && to) { sql += " WHERE DATE(created_at) BETWEEN ? AND ?"; params.push(from, to); }
  db.query(sql, params, (err, rows) => {
    if (err) return res.status(500).json(err);
    const statusMap = {};
    const priorityMap = {};
    rows.forEach((t) => {
      const s = t.status || "Unknown"; const p = t.priority || "Unknown";
      statusMap[s] = (statusMap[s] || 0) + 1;
      priorityMap[p] = (priorityMap[p] || 0) + 1;
    });
    res.json({
      data: {
        byStatus: Object.entries(statusMap).map(([name, value]) => ({ name, value })),
        byPriority: Object.entries(priorityMap).map(([name, value]) => ({ name, value })),
        resolvedPerDay: [],
        avgResolutionByAssignee: [],
      },
    });
  });
});

// USERS CRUD
app.get("/api/users", (req, res) => {
  // Never return password/hashed_password columns
  db.query(
    "SELECT id, name, email, username, role, team, status, avatar_color, department, phone, portal_role FROM users",
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json({ data: results });
    }
  );
});

app.post("/api/users", async (req, res) => {
  const { name, email, username, password, role, team, status, avatar_color } = req.body;
  if (!name || !email || !username || !password) {
    return res.status(400).json({ message: "Name, email, username, and password are required" });
  }
  try {
    const hashed = await bcrypt.hash(password, 10);
    const sql = `INSERT INTO users (name,email,username,hashed_password,role,team,status,avatar_color) VALUES (?,?,?,?,?,?,?,?)`;
    const result = await query(sql, [name, email, username, hashed, role, team, status || "Available", avatar_color || "#0f172a"]);
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "A user with this email or username already exists" });
    res.status(500).json({ message: err.message });
  }
});

app.put("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email, username, password, role, team, status, avatar_color } = req.body;
  console.log("[PUT /api/users/:id] id:", id, "body:", { name, email, username, role, team, status, avatar_color, hasPassword: !!(password && password.trim()) });
  try {
    let result;
    if (password && password.trim()) {
      // Update including new hashed password
      const hashed = await bcrypt.hash(password, 10);
      result = await query(
        `UPDATE users SET name=?,email=?,username=?,hashed_password=?,role=?,team=?,status=?,avatar_color=? WHERE id=?`,
        [name, email, username, hashed, role, team, status, avatar_color, id]
      );
    } else {
      // Update without touching the password
      result = await query(
        `UPDATE users SET name=?,email=?,username=?,role=?,team=?,status=?,avatar_color=? WHERE id=?`,
        [name, email, username, role, team, status, avatar_color, id]
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
    const result = await query(
      "INSERT INTO ticket_comments (ticket_id, author_name, author_email, author_role, body) VALUES (?,?,?,?,?)",
      [id, authorName, req.user?.email || null, authorRole, body]
    );

    // Email trigger: admin comment → notify user
    if (authorRole === "admin") {
      const ticketRows = await query("SELECT * FROM tickets WHERE id = ?", [id]).catch(() => []);
      if (ticketRows[0]) {
        sendAdminCommentToUser(ticketRows[0], body).catch(() => {});
      }
    }

    res.json({ success: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PDF download stub (keep existing)
app.get("/api/tickets/:id/pdf", authenticateJWT, async (req, res) => {
  try {
    const rows = await query("SELECT * FROM tickets WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: "Ticket not found" });

    const ticket = rows[0];
    const comments = await query(
      "SELECT * FROM ticket_comments WHERE ticket_id = ? ORDER BY created_at ASC",
      [req.params.id]
    ).catch(() => []);
    const timeline = await query(
      "SELECT * FROM ticket_status_history WHERE ticket_id = ? ORDER BY created_at ASC",
      [req.params.id]
    ).catch(() => []);

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

  let sql = "SELECT * FROM tickets WHERE (requester_email = ? OR user_email = ?)";
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

// CREATE TICKET (user — triggers emails)
app.post("/api/user/tickets", authenticateJWT, requireUser, upload.single("attachment"), async (req, res) => {
  const user = req.user;
  const { title, description, category, sub_category, priority } = req.body;

  if (!title || !category || !priority) {
    return res.status(400).json({ message: "Title, category, and priority are required" });
  }

  try {
    const ticketId = await generateTicketId();

    // Handle optional file attachment
    const attachmentName = req.file ? req.file.originalname : null;
    const attachmentMime = req.file ? req.file.mimetype : null;
    const attachmentData = req.file ? req.file.buffer : null;

    const sql = `INSERT INTO tickets
      (ticket_id, title, description, category, sub_category, priority, status,
       customer_name, requester_email, phone, department, user_email,
       attachment_name, attachment_mime, attachment_data)
      VALUES (?,?,?,?,?,?,'Open',?,?,?,?,?,?,?,?)`;

    const result = await query(sql, [
      ticketId, title, description, category, sub_category || null, priority,
      user.name, user.email, user.phone || null, user.department || null, user.email,
      attachmentName, attachmentMime, attachmentData,
    ]);

    const newTicket = {
      id: result.insertId,
      ticket_id: ticketId,
      title, description, category, sub_category, priority,
      status: "Open",
      customer_name: user.name,
      requester_email: user.email,
      phone: user.phone,
      department: user.department,
      created_at: new Date(),
      attachment_name: attachmentName,
      attachment_mime: attachmentMime,
      attachment_data: attachmentData, // Buffer — email service uses this to attach the file
    };

    // Status history
    await query(
      "INSERT INTO ticket_status_history (ticket_id, changed_by, from_status, to_status) VALUES (?,?,?,?)",
      [result.insertId, user.name, null, "Open"]
    ).catch(() => {});

    // Send emails async (don't block response)
    console.log(`📧 Sending emails for ticket ${ticketId} to admin and user ${user.email}`);
    sendNewTicketToAdmin(newTicket)
      .then(() => console.log(`✅ Admin email sent for ${ticketId}`))
      .catch((e) => console.error(`❌ Admin email error:`, e.message));
    sendTicketConfirmationToUser(newTicket)
      .then(() => console.log(`✅ User email sent to ${user.email} for ${ticketId}`))
      .catch((e) => console.error(`❌ User email error:`, e.message));

    res.json({ success: true, data: newTicket });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
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
      "SELECT * FROM tickets WHERE id = ? AND (requester_email = ? OR user_email = ?)",
      [id, email, email]
    );
    if (rows.length === 0) return res.status(404).json({ message: "Ticket not found" });

    const ticket = rows[0];
    const comments = await query(
      "SELECT * FROM ticket_comments WHERE ticket_id = ? ORDER BY created_at ASC",
      [id]
    ).catch(() => []);
    const history = await query(
      "SELECT * FROM ticket_status_history WHERE ticket_id = ? ORDER BY created_at ASC",
      [id]
    ).catch(() => []);

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
      "SELECT * FROM tickets WHERE id = ? AND (requester_email = ? OR user_email = ?)",
      [id, user.email, user.email]
    );
    if (rows.length === 0) return res.status(404).json({ message: "Ticket not found" });

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
    const oldRows = await query("SELECT * FROM tickets WHERE id = ?", [id]);
    if (oldRows.length === 0) return res.status(404).json({ message: "Ticket not found" });

    const oldTicket = oldRows[0];
    await query("UPDATE tickets SET status = ?, updated_at = NOW() WHERE id = ?", [status, id]);

    // Record history
    await query(
      "INSERT INTO ticket_status_history (ticket_id, changed_by, from_status, to_status, note) VALUES (?,?,?,?,?)",
      [id, req.user?.name || "Admin", oldTicket.status, status, note || null]
    ).catch(() => {});

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
    const rows = await query("SELECT * FROM tickets WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ message: "Ticket not found" });

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
    const rows = await query("SELECT * FROM tickets WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ message: "Ticket not found" });

    const oldTicket = rows[0];

    if (oldTicket.status === "Resolved") {
      return res.status(409).json({ message: "Ticket is already resolved" });
    }

    const resolvedByName = resolvedBy?.trim() || req.user?.name || "Admin";

    // Update ticket in DB
    await query(
      `UPDATE tickets
         SET status        = 'Resolved',
             resolved_at   = NOW(),
             resolution_note = ?,
             resolved_by   = ?,
             updated_at    = NOW()
       WHERE id = ?`,
      [resolutionNote.trim(), resolvedByName, id]
    );

    // Record status history
    await query(
      `INSERT INTO ticket_status_history
         (ticket_id, changed_by, from_status, to_status, note)
       VALUES (?, ?, ?, 'Resolved', ?)`,
      [id, resolvedByName, oldTicket.status, resolutionNote.trim()]
    ).catch(() => {});

    // Fetch updated ticket for email
    const updatedRows = await query("SELECT * FROM tickets WHERE id = ?", [id]).catch(() => []);
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

app.listen(process.env.PORT || 5000, () => {
  console.log("🚀 Server running on port 5000");
});