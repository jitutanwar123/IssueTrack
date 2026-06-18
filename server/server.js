import dotenv from "dotenv";
import express from "express";
import mysql from "mysql2";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import multer from "multer";

import {
  sendNewTicketToAdmin,
  sendTicketConfirmationToUser,
  sendStatusUpdateToUser,
  sendAdminCommentToUser,
  sendUserCommentToAdmin,
} from "./emailService.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
    return;
  }
  console.log("✅ MySQL Connected");
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
  const rows = await query("SELECT COUNT(*) as cnt FROM tickets");
  const count = (rows[0]?.cnt || 0) + 1;
  return `INC${String(count).padStart(5, "0")}`;
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

// CURRENT USER
app.get("/api/auth/me", authenticateJWT, (req, res) => {
  res.json({ user: req.user });
});

// GET ALL TICKETS
app.get("/api/tickets", (req, res) => {
  const { search, status, priority, category, assignee } = req.query;
  let sql = "SELECT * FROM tickets WHERE 1=1";
  let params = [];

  if (search) { sql += " AND title LIKE ?"; params.push(`%${search}%`); }
  if (status) { sql += " AND status = ?"; params.push(status); }
  if (priority) { sql += " AND priority = ?"; params.push(priority); }
  if (category) { sql += " AND category = ?"; params.push(category); }
  if (assignee) { sql += " AND assigned_to = ?"; params.push(assignee); }

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json({
      data: results,
      pagination: { page: 1, limit: results.length, total: results.length, totalPages: 1 },
    });
  });
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
  const { title, description, priority, status, ...rest } = req.body;
  const sql = "INSERT INTO tickets(title, description, priority, status) VALUES (?, ?, ?, ?)";
  db.query(sql, [title, description, priority, status], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ success: true, data: { id: result.insertId } });
  });
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

// REPORT SUMMARY
app.get("/api/reports/summary", (req, res) => {
  db.query("SELECT * FROM tickets", (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json({
      totalTicketsLast24Hours: rows.length,
      unassignedTickets: rows.filter((t) => !t.assigned_to).length,
      incidentTickets: rows.filter((t) => t.category === "Incident").length,
      serviceRequestTickets: rows.filter((t) => t.category === "Service Request").length,
      p1Incidents: rows.filter((t) => t.priority === "P1" && t.category === "Incident").length,
      pendingBreachTickets: rows.filter((t) => t.status !== "Closed").length,
      activeAgeing: [{ bucket: "0-30 Days", count: rows.length }],
      activeByCategory: [
        { name: "Incident", value: rows.filter((t) => t.category === "Incident").length },
        { name: "Service Request", value: rows.filter((t) => t.category === "Service Request").length },
      ],
      resolverBreakdown: [{ name: "Unassigned", value: rows.filter((t) => !t.assigned_to).length }],
    });
  });
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
  db.query("SELECT * FROM users", (err, results) => {
    if (err) return res.status(500).json(err);
    res.json({ data: results });
  });
});

app.post("/api/users", (req, res) => {
  const { name, email, username, password, role, team, status, avatar_color } = req.body;
  const sql = `INSERT INTO users (name,email,username,password,role,team,status,avatar_color) VALUES (?,?,?,?,?,?,?,?)`;
  db.query(sql, [name, email, username, password, role, team, status, avatar_color], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ success: true, id: result.insertId });
  });
});

app.put("/api/users/:id", (req, res) => {
  const { id } = req.params;
  const { name, email, username, password, role, team, status, avatar_color } = req.body;
  const sql = `UPDATE users SET name=?,email=?,username=?,password=?,role=?,team=?,status=?,avatar_color=? WHERE id=?`;
  db.query(sql, [name, email, username, password, role, team, status, avatar_color, id], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ success: true, affectedRows: result.affectedRows });
  });
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
  res.status(200).json({ message: "PDF endpoint - configure as needed" });
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

    const sql = `INSERT INTO tickets
      (ticket_id, title, description, category, sub_category, priority, status,
       customer_name, requester_email, phone, department, user_email)
      VALUES (?,?,?,?,?,?,'Open',?,?,?,?,?)`;

    const result = await query(sql, [
      ticketId, title, description, category, sub_category || null, priority,
      user.name, user.email, user.phone || null, user.department || null, user.email,
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

app.listen(process.env.PORT || 5000, () => {
  console.log("🚀 Server running on port 5000");
});