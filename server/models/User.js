import { getDb } from "../utils/db.js";
import { hashPassword, verifyPassword } from "../utils/auth.js";

const db = getDb();

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    username: row.username,
    role: row.role,
    team: row.team,
    status: row.status,
    avatar_color: row.avatar_color,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function listUsers({ search = "" } = {}) {
  const query = search
    ? db.prepare(`
        SELECT id, name, email, username, role, team, status, avatar_color, created_at, updated_at
        FROM users
        WHERE name LIKE ? OR email LIKE ? OR username LIKE ? OR team LIKE ?
        ORDER BY name ASC
      `).all(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`)
    : db.prepare(`
        SELECT id, name, email, username, role, team, status, avatar_color, created_at, updated_at
        FROM users
        ORDER BY name ASC
      `).all();
  return query.map(mapUser);
}

export function getUserById(id) {
  return mapUser(
    db.prepare(`
      SELECT id, name, email, username, role, team, status, avatar_color, created_at, updated_at
      FROM users
      WHERE id = ?
    `).get(id)
  );
}

export function getUserByUsername(username) {
  return db.prepare("SELECT * FROM users WHERE username = ?").get(username);
}

export function createUser(data) {
  const now = new Date().toISOString();
  const passwordHash = hashPassword(data.password || "agent123");
  const result = db.prepare(`
    INSERT INTO users (name, email, username, password_hash, role, team, status, avatar_color, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.name,
    data.email,
    data.username,
    passwordHash,
    data.role || "Agent",
    data.team || "",
    data.status || "Available",
    data.avatar_color || "#0f172a",
    now,
    now
  );
  return getUserById(result.lastInsertRowid);
}

export function updateUser(id, data) {
  const current = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
  if (!current) return null;
  const next = {
    name: data.name ?? current.name,
    email: data.email ?? current.email,
    username: data.username ?? current.username,
    role: data.role ?? current.role,
    team: data.team ?? current.team,
    status: data.status ?? current.status,
    avatar_color: data.avatar_color ?? current.avatar_color,
    password_hash: data.password ? hashPassword(data.password) : current.password_hash,
  };
  db.prepare(`
    UPDATE users
    SET name = ?, email = ?, username = ?, role = ?, team = ?, status = ?, avatar_color = ?, password_hash = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    next.name,
    next.email,
    next.username,
    next.role,
    next.team,
    next.status,
    next.avatar_color,
    next.password_hash,
    id
  );
  return getUserById(id);
}

export function deleteUser(id) {
  const result = db.prepare("DELETE FROM users WHERE id = ?").run(id);
  return result.changes > 0;
}

export function authenticateUser(username, password) {
  const user = getUserByUsername(username);
  if (!user) return null;
  if (!verifyPassword(password, user.password_hash)) return null;
  return mapUser(user);
}
