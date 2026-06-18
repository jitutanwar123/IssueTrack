import { getDb } from "../utils/db.js";

const db = getDb();

export function listComments(ticketId) {
  return db.prepare(`
    SELECT id, ticket_id, author_id, author_name, body, created_at
    FROM comments
    WHERE ticket_id = ?
    ORDER BY datetime(created_at) ASC, id ASC
  `).all(ticketId);
}

export function createComment(ticketId, data) {
  const result = db.prepare(`
    INSERT INTO comments (ticket_id, author_id, author_name, body, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    ticketId,
    data.author_id || null,
    data.author_name,
    data.body,
    data.created_at || new Date().toISOString()
  );

  return db.prepare("SELECT id, ticket_id, author_id, author_name, body, created_at FROM comments WHERE id = ?").get(result.lastInsertRowid);
}
