import { getDb } from "../utils/db.js";
import { ageInDays, ageingBucket, createTicketId } from "../utils/helpers.js";

const db = getDb();

function mapTicket(row) {
  if (!row) return null;
  return {
    id: row.id,
    ticket_id: row.ticket_id,
    title: row.title,
    description: row.description,
    category: row.category,
    sub_category: row.sub_category,
    priority: row.priority,
    status: row.status,
    customer_name: row.customer_name,
    requester_email: row.requester_email,
    phone: row.phone,
    department: row.department,
    requested_by: row.requested_by,
    requested_by_id: row.requested_by_id,
    assigned_to: row.assigned_to,
    assigned_to_id: row.assigned_to_id,
    assigned_to_name: row.assigned_to_name || row.assigned_to || "Unassigned",
    expected_closure_date: row.expected_closure_date,
    actual_closure_date: row.actual_closure_date,
    response_time: row.response_time,
    resolution_time: row.resolution_time,
    location: row.location,
    workstream: row.workstream,
    workgroup: row.workgroup,
    service: row.service,
    created_by: row.created_by,
    created_by_id: row.created_by_id,
    last_modified_by: row.last_modified_by,
    last_modified_by_id: row.last_modified_by_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    closed_at: row.closed_at,
    age_days: ageInDays(row.created_at),
    ageing_bucket: ageingBucket(ageInDays(row.created_at)),
  };
}

function buildFilters(filters = {}) {
  const clauses = [];
  const params = [];

  if (filters.status) {
    clauses.push("t.status = ?");
    params.push(filters.status);
  }
  if (filters.priority) {
    clauses.push("t.priority = ?");
    params.push(filters.priority);
  }
  if (filters.category) {
    clauses.push("t.category = ?");
    params.push(filters.category);
  }
  if (filters.assignee) {
    clauses.push("t.assigned_to_id = ?");
    params.push(Number(filters.assignee));
  }
  if (filters.location) {
    clauses.push("t.location = ?");
    params.push(filters.location);
  }
  if (filters.workgroup) {
    clauses.push("t.workgroup = ?");
    params.push(filters.workgroup);
  }
  if (filters.customer) {
    clauses.push("t.customer_name = ?");
    params.push(filters.customer);
  }
  if (filters.sub_category) {
    clauses.push("t.sub_category = ?");
    params.push(filters.sub_category);
  }
  if (filters.service) {
    clauses.push("t.service = ?");
    params.push(filters.service);
  }
  if (filters.search) {
    const term = `%${filters.search}%`;
    clauses.push(`(
      t.ticket_id LIKE ? OR t.title LIKE ? OR t.description LIKE ? OR t.customer_name LIKE ? OR
      t.requester_email LIKE ? OR t.assigned_to LIKE ? OR t.requested_by LIKE ?
    )`);
    params.push(term, term, term, term, term, term, term);
  }
  if (filters.from) {
    clauses.push("datetime(t.created_at) >= datetime(?)");
    params.push(filters.from);
  }
  if (filters.to) {
    clauses.push("datetime(t.created_at) <= datetime(?)");
    params.push(filters.to);
  }

  return { clauses, params };
}

export function listTickets(filters = {}) {
  const page = Math.max(1, Number(filters.page || 1));
  const limit = Math.max(1, Math.min(100, Number(filters.limit || 10)));
  const offset = (page - 1) * limit;
  const { clauses, params } = buildFilters(filters);
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  const rows = db.prepare(`
    SELECT
      t.*,
      COALESCE(u.name, t.assigned_to) AS assigned_to_name
    FROM tickets t
    LEFT JOIN users u ON u.id = t.assigned_to_id
    ${where}
    ORDER BY datetime(t.updated_at) DESC, t.id DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  const total = db.prepare(`
    SELECT COUNT(*) AS count
    FROM tickets t
    ${where}
  `).get(...params).count;

  return {
    data: rows.map(mapTicket),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export function getTicketById(ticketId) {
  return mapTicket(
    db.prepare(`
      SELECT
        t.*,
        COALESCE(u.name, t.assigned_to) AS assigned_to_name
      FROM tickets t
      LEFT JOIN users u ON u.id = t.assigned_to_id
      WHERE t.ticket_id = ?
    `).get(ticketId)
  );
}

export function getTicketEvents(ticketId) {
  return db.prepare(`
    SELECT id, ticket_id, actor_id, actor_name, action, field, from_value, to_value, created_at
    FROM ticket_events
    WHERE ticket_id = ?
    ORDER BY datetime(created_at) ASC, id ASC
  `).all(ticketId);
}

export function addTicketEvent(ticketId, data) {
  db.prepare(`
    INSERT INTO ticket_events (ticket_id, actor_id, actor_name, action, field, from_value, to_value, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    ticketId,
    data.actor_id || null,
    data.actor_name,
    data.action,
    data.field || "",
    data.from_value || "",
    data.to_value || "",
    data.created_at || new Date().toISOString()
  );
}

export function createTicket(data, actor = {}) {
  const existing = new Set(db.prepare("SELECT ticket_id FROM tickets").all().map((row) => row.ticket_id));
  const ticketId = data.ticket_id || createTicketId(existing);
  const now = new Date().toISOString();
  const result = db.prepare(`
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
  `).run({
    ticket_id: ticketId,
    title: data.title || "Untitled ticket",
    description: data.description || "",
    category: data.category || "Incident",
    sub_category: data.sub_category || "",
    priority: data.priority || "P3",
    status: data.status || "Open",
    customer_name: data.customer_name || "",
    requester_email: data.requester_email || "",
    phone: data.phone || "",
    department: data.department || "",
    requested_by: data.requested_by || "",
    requested_by_id: data.requested_by_id || null,
    assigned_to: data.assigned_to || "",
    assigned_to_id: data.assigned_to_id || null,
    expected_closure_date: data.expected_closure_date || "",
    actual_closure_date: data.actual_closure_date || "",
    response_time: Number(data.response_time || 0),
    resolution_time: Number(data.resolution_time || 0),
    location: data.location || "",
    workstream: data.workstream || "",
    workgroup: data.workgroup || "",
    service: data.service || "",
    created_by: actor.name || data.created_by || "System",
    created_by_id: actor.id || data.created_by_id || null,
    last_modified_by: actor.name || data.last_modified_by || "System",
    last_modified_by_id: actor.id || data.last_modified_by_id || null,
    created_at: data.created_at || now,
    updated_at: data.updated_at || now,
    closed_at: data.closed_at || "",
  });

  addTicketEvent(ticketId, {
    actor_id: actor.id || null,
    actor_name: actor.name || "System",
    action: "created ticket",
    field: "status",
    from_value: "",
    to_value: data.status || "Open",
    created_at: data.created_at || now,
  });

  return getTicketById(ticketId) || { ticket_id: ticketId, id: result.lastInsertRowid };
}

export function updateTicket(ticketId, data, actor = {}) {
  const current = db.prepare(`
    SELECT * FROM tickets WHERE ticket_id = ?
  `).get(ticketId);
  if (!current) return null;

  const next = {
    title: data.title ?? current.title,
    description: data.description ?? current.description,
    category: data.category ?? current.category,
    sub_category: data.sub_category ?? current.sub_category,
    priority: data.priority ?? current.priority,
    status: data.status ?? current.status,
    customer_name: data.customer_name ?? current.customer_name,
    requester_email: data.requester_email ?? current.requester_email,
    phone: data.phone ?? current.phone,
    department: data.department ?? current.department,
    requested_by: data.requested_by ?? current.requested_by,
    requested_by_id: data.requested_by_id ?? current.requested_by_id,
    assigned_to: data.assigned_to ?? current.assigned_to,
    assigned_to_id: data.assigned_to_id ?? current.assigned_to_id,
    expected_closure_date: data.expected_closure_date ?? current.expected_closure_date,
    actual_closure_date: data.actual_closure_date ?? current.actual_closure_date,
    response_time: data.response_time ?? current.response_time,
    resolution_time: data.resolution_time ?? current.resolution_time,
    location: data.location ?? current.location,
    workstream: data.workstream ?? current.workstream,
    workgroup: data.workgroup ?? current.workgroup,
    service: data.service ?? current.service,
    last_modified_by: actor.name || data.last_modified_by || current.last_modified_by,
    last_modified_by_id: actor.id || data.last_modified_by_id || current.last_modified_by_id,
    updated_at: new Date().toISOString(),
    closed_at: data.closed_at ?? current.closed_at,
  };

  const changedFields = [];
  for (const field of [
    "title",
    "description",
    "category",
    "sub_category",
    "priority",
    "status",
    "customer_name",
    "requester_email",
    "phone",
    "department",
    "requested_by",
    "assigned_to",
    "expected_closure_date",
    "actual_closure_date",
    "response_time",
    "resolution_time",
    "location",
    "workstream",
    "workgroup",
    "service",
  ]) {
    if (String(current[field] ?? "") !== String(next[field] ?? "")) {
      changedFields.push(field);
    }
  }

  db.prepare(`
    UPDATE tickets
    SET
      title = ?, description = ?, category = ?, sub_category = ?, priority = ?, status = ?,
      customer_name = ?, requester_email = ?, phone = ?, department = ?, requested_by = ?,
      requested_by_id = ?, assigned_to = ?, assigned_to_id = ?, expected_closure_date = ?,
      actual_closure_date = ?, response_time = ?, resolution_time = ?, location = ?, workstream = ?,
      workgroup = ?, service = ?, last_modified_by = ?, last_modified_by_id = ?, updated_at = ?, closed_at = ?
    WHERE ticket_id = ?
  `).run(
    next.title,
    next.description,
    next.category,
    next.sub_category,
    next.priority,
    next.status,
    next.customer_name,
    next.requester_email,
    next.phone,
    next.department,
    next.requested_by,
    next.requested_by_id,
    next.assigned_to,
    next.assigned_to_id,
    next.expected_closure_date,
    next.actual_closure_date,
    Number(next.response_time || 0),
    Number(next.resolution_time || 0),
    next.location,
    next.workstream,
    next.workgroup,
    next.service,
    next.last_modified_by,
    next.last_modified_by_id,
    next.updated_at,
    next.closed_at,
    ticketId
  );

  for (const field of changedFields) {
    addTicketEvent(ticketId, {
      actor_id: actor.id || null,
      actor_name: actor.name || next.last_modified_by || "System",
      action: "updated",
      field,
      from_value: current[field] ?? "",
      to_value: next[field] ?? "",
      created_at: next.updated_at,
    });
  }

  if (current.status !== next.status) {
    addTicketEvent(ticketId, {
      actor_id: actor.id || null,
      actor_name: actor.name || next.last_modified_by || "System",
      action: "changed status",
      field: "status",
      from_value: current.status,
      to_value: next.status,
      created_at: next.updated_at,
    });
  }

  return getTicketById(ticketId);
}

export function deleteTicket(ticketId) {
  const result = db.prepare("DELETE FROM tickets WHERE ticket_id = ?").run(ticketId);
  return result.changes > 0;
}

export function getTicketTimeline(ticketId) {
  const events = getTicketEvents(ticketId).map((event) => ({ ...event, type: "event" }));
  const comments = db.prepare(`
    SELECT id, ticket_id, author_id, author_name, body, created_at
    FROM comments
    WHERE ticket_id = ?
    ORDER BY datetime(created_at) ASC, id ASC
  `).all(ticketId).map((comment) => ({
    ...comment,
    type: "comment",
    action: "commented",
    field: "comment",
    from_value: "",
    to_value: comment.body,
    actor_name: comment.author_name,
    actor_id: comment.author_id,
  }));

  return [...events, ...comments].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
}

export function getAllTickets(filters = {}) {
  const { clauses, params } = buildFilters(filters);
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  return db.prepare(`
    SELECT
      t.*,
      COALESCE(u.name, t.assigned_to) AS assigned_to_name
    FROM tickets t
    LEFT JOIN users u ON u.id = t.assigned_to_id
    ${where}
  `).all(...params).map(mapTicket);
}

export function getCategoryCounts(filters = {}) {
  const tickets = getAllTickets(filters);
  const counts = new Map();
  for (const ticket of tickets) {
    const key = ticket.category || "Uncategorized";
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
}

export function getAgeingBuckets(filters = {}) {
  const { clauses, params } = buildFilters(filters);
  const activeWhere = clauses.length
    ? `WHERE (${clauses.join(" AND ")}) AND t.status NOT IN ('Closed','Cancelled')`
    : `WHERE t.status NOT IN ('Closed','Cancelled')`;

  const rows = db.prepare(`
    SELECT
      CASE
        WHEN CAST((julianday('now') - julianday(t.created_at)) AS INTEGER) <= 1 THEN '0-1 Day'
        WHEN CAST((julianday('now') - julianday(t.created_at)) AS INTEGER) <= 3 THEN '2-3 Days'
        WHEN CAST((julianday('now') - julianday(t.created_at)) AS INTEGER) <= 5 THEN '4-5 Days'
        WHEN CAST((julianday('now') - julianday(t.created_at)) AS INTEGER) <= 10 THEN '6-10 Days'
        WHEN CAST((julianday('now') - julianday(t.created_at)) AS INTEGER) <= 20 THEN '11-20 Days'
        ELSE '21+ Days'
      END AS bucket,
      COUNT(*) AS count
    FROM tickets t
    ${activeWhere}
    GROUP BY bucket
  `).all(...params);

  const order = ["0-1 Day","2-3 Days","4-5 Days","6-10 Days","11-20 Days","21+ Days"];
  const map = Object.fromEntries(rows.map(r => [r.bucket, r.count]));
  return order.map(bucket => ({ bucket, count: map[bucket] || 0 }));
}

export function getCategoryCounts(filters = {}) {
  const { clauses, params } = buildFilters(filters);
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  return db.prepare(`
    SELECT COALESCE(t.category, 'Uncategorized') AS name, COUNT(*) AS value
    FROM tickets t
    ${where}
    GROUP BY t.category
    ORDER BY value DESC
  `).all(...params);
}

export function getResolverCounts(filters = {}) {
  const { clauses, params } = buildFilters(filters);
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  return db.prepare(`
    SELECT COALESCE(u.name, t.assigned_to, 'Unassigned') AS name, COUNT(*) AS value
    FROM tickets t
    LEFT JOIN users u ON u.id = t.assigned_to_id
    ${where}
    GROUP BY name
    ORDER BY value DESC
    LIMIT 10
  `).all(...params);
}

export function getSummaryStats(filters = {}) {
  const { clauses, params } = buildFilters(filters);
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const activeWhere = clauses.length
    ? `WHERE (${clauses.join(" AND ")}) AND t.status NOT IN ('Closed','Cancelled')`
    : `WHERE t.status NOT IN ('Closed','Cancelled')`;

  const now = new Date().toISOString();
  const since24h = new Date(Date.now() - 86_400_000).toISOString();

  const totalLast24h = db.prepare(`
    SELECT COUNT(*) AS c FROM tickets t
    ${where ? where + " AND" : "WHERE"} datetime(t.created_at) >= datetime(?)
  `).get(...params, since24h).c;

  const unassigned = db.prepare(`
    SELECT COUNT(*) AS c FROM tickets t
    ${activeWhere}
    AND (t.assigned_to_id IS NULL OR t.assigned_to_id = '')
    AND (t.assigned_to IS NULL OR t.assigned_to = '')
  `).get(...params).c;

  const incidents = db.prepare(`
    SELECT COUNT(*) AS c FROM tickets t
    ${where ? where + " AND" : "WHERE"} t.category = 'Incident'
  `).get(...params).c;

  const serviceRequests = db.prepare(`
    SELECT COUNT(*) AS c FROM tickets t
    ${where ? where + " AND" : "WHERE"} t.category = 'Service Request'
  `).get(...params).c;

  const p1Incidents = db.prepare(`
    SELECT COUNT(*) AS c FROM tickets t
    ${where ? where + " AND" : "WHERE"} t.category = 'Incident' AND t.priority = 'P1'
  `).get(...params).c;

  const pendingBreach = db.prepare(`
    SELECT COUNT(*) AS c FROM tickets t
    ${activeWhere}
    AND t.expected_closure_date != ''
    AND t.expected_closure_date IS NOT NULL
    AND datetime(t.expected_closure_date) < datetime(?)
    AND t.status IN ('Pending','Open','Assigned','Work In Progress')
  `).get(...params, now).c;

  const totalTickets = db.prepare(`SELECT COUNT(*) AS c FROM tickets t ${where}`).get(...params).c;
  const activeTickets = db.prepare(`SELECT COUNT(*) AS c FROM tickets t ${activeWhere}`).get(...params).c;

  return {
    totalTicketsLast24Hours: totalLast24h,
    unassignedTickets:       unassigned,
    incidentTickets:         incidents,
    serviceRequestTickets:   serviceRequests,
    p1Incidents,
    pendingBreachTickets:    pendingBreach,
    activeAgeing:            getAgeingBuckets(filters),
    activeByCategory:        getCategoryCounts(filters),
    resolverBreakdown:       getResolverCounts(filters),
    totalTickets,
    activeTickets,
  };
}

export function getReportData(filters = {}) {
  const tickets = getAllTickets(filters);
  const resolvedTickets = tickets.filter((ticket) => ["Closed", "Resolved"].includes(ticket.status) && ticket.actual_closure_date);
  const byStatus = tickets.reduce((acc, ticket) => {
    acc[ticket.status] = (acc[ticket.status] || 0) + 1;
    return acc;
  }, {});
  const byPriority = tickets.reduce((acc, ticket) => {
    acc[ticket.priority] = (acc[ticket.priority] || 0) + 1;
    return acc;
  }, {});

  const resolvedPerDay = resolvedTickets.reduce((acc, ticket) => {
    const key = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
    }).format(new Date(ticket.actual_closure_date));
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const resolutionByAssignee = new Map();
  for (const ticket of resolvedTickets) {
    const key = ticket.assigned_to_name || ticket.assigned_to || "Unassigned";
    const minutes = Number(ticket.resolution_time || 0) || Math.max(1, Math.round((new Date(ticket.actual_closure_date) - new Date(ticket.created_at)) / 60000));
    const current = resolutionByAssignee.get(key) || { total: 0, count: 0 };
    current.total += minutes;
    current.count += 1;
    resolutionByAssignee.set(key, current);
  }

  return {
    byStatus: Object.entries(byStatus).map(([name, value]) => ({ name, value })),
    byPriority: Object.entries(byPriority).map(([name, value]) => ({ name, value })),
    resolvedPerDay: Object.entries(resolvedPerDay).map(([name, value]) => ({ name, value })),
    avgResolutionByAssignee: Array.from(resolutionByAssignee.entries()).map(([name, value]) => ({
      name,
      value: Math.round(value.total / value.count),
    })),
  };
}
