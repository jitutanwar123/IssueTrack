import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { api } from "../utils/api.js";

const TicketContext = createContext(null);

const defaultFilters = {
  status: "",
  priority: "",
  category: "",
  assignee: "",
  plant: "",
  from: "",
  to: "",
  search: "",
};

const defaultDashboardFilters = {
  category: "",
  sub_category: "",
  service: "",
  plant: "",
};

export function TicketProvider({ children }) {
  const { pathname } = useLocation();
  const [tickets, setTickets] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [ticketFilters, setTicketFilters] = useState(defaultFilters);
  const [dashboardFilters, setDashboardFilters] = useState(defaultDashboardFilters);
  const [summary, setSummary] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [error, setError] = useState("");

  // ── In-flight guards — prevent stacked concurrent auto-refreshes ──────────
  const fetchingTickets = useRef(false);
  const fetchingSummary = useRef(false);

  const dashboardQuery = useMemo(() => dashboardFilters, [dashboardFilters]);
  const listQuery = useMemo(() => ticketFilters, [ticketFilters]);
  const shouldLoadAdminData =
    !pathname.startsWith("/user") &&
    !pathname.startsWith("/staff") &&
    !["/login", "/user-login", "/staff-login", "/register"].includes(pathname);

  async function loadTickets(overrides = {}) {
    setLoadingTickets(true);
    setError("");
    try {
      // Always send the current limit so the server doesn't default to 25
      const response = await api.tickets({
        limit: pagination.limit,
        ...ticketFilters,
        ...overrides,
      });
      setTickets(response.data);
      setPagination(response.pagination);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoadingTickets(false);
    }
  }

  async function loadSummary() {
    if (fetchingSummary.current) return;
    fetchingSummary.current = true;
    setLoadingSummary(true);
    try {
      const response = await api.reportSummary(dashboardFilters);
      setSummary({
        totalTicketsLast24Hours: response.totalTicketsLast24Hours || 0,
        unassignedTickets:       response.unassignedTickets || 0,
        incidentTickets:         response.incidentTickets || 0,
        serviceRequestTickets:   response.serviceRequestTickets || 0,
        p1Incidents:             response.p1Incidents || 0,
        pendingBreachTickets:    response.pendingBreachTickets || 0,
        activeAgeing:            response.activeAgeing || [],
        activeByCategory:        response.activeByCategory || [],
        resolverBreakdown:       response.resolverBreakdown || [],
      });
      return response;
    } catch (err) {
      throw err;
    } finally {
      fetchingSummary.current = false;
      setLoadingSummary(false);
    }
  }
  async function loadReports(params = {}) {
  console.log("LOAD REPORTS CALLED", params);

  return api.reportDetail(params);
}

  async function createTicket(payload) {
  console.log("Creating ticket:", payload);

  const response = await api.createTicket(payload);

  console.log("Create response:", response);

  await Promise.all([loadTickets(), loadSummary()]);

  return response.data;
}

  async function updateTicket(id, payload) {
    const response = await api.updateTicket(id, payload);
    await Promise.all([loadTickets(), loadSummary()]);
    return response.data;
  }

  async function removeTicket(id) {
  console.log("REMOVE TICKET ID:", id);

  if (!id) {
    throw new Error("Ticket ID is undefined");
  }

  const response = await api.deleteTicket(id);

  await Promise.all([
    loadTickets(),
    loadSummary(),
  ]);

  return response;
}


  // ── Initial load ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!shouldLoadAdminData) return;
    // loadTickets() is intentionally omitted here — the listQuery effect below
    // fires on mount and handles the initial fetch, avoiding a duplicate request.
    loadSummary().catch(() => {});

    // Auto-refresh SUMMARY only every 60 s (tickets are large; reload on user action)
    const interval = setInterval(() => {
      if (!fetchingSummary.current) loadSummary().catch(() => {});
    }, 60_000);
    return () => clearInterval(interval);
  }, [shouldLoadAdminData]);

  // ── Reload ticket list whenever filters change ───────────────────────────────
  useEffect(() => {
    if (!shouldLoadAdminData) return;
    loadTickets().catch(() => {});
  }, [shouldLoadAdminData, JSON.stringify(listQuery)]);

  // ── Reload summary whenever dashboard filters change ────────────────────────
  useEffect(() => {
    if (!shouldLoadAdminData) return;
    loadSummary().catch(() => {});
  }, [shouldLoadAdminData, JSON.stringify(dashboardQuery)]);

  const value = {
    tickets,
    pagination,
    summary,
    reportData,
    loadingTickets,
    loadingSummary,
    error,
    ticketFilters,
    dashboardFilters,
    setTicketFilters: (updates) =>
      setTicketFilters((current) => ({
        ...current,
        ...updates,
        page: updates.page ?? current.page ?? 1,
      })),
    setDashboardFilters: (updates) => setDashboardFilters((current) => ({ ...current, ...updates })),
    refreshTickets: loadTickets,
    refreshSummary: loadSummary,
    loadReports,
    createTicket,
    updateTicket,
    removeTicket,
  };

  return <TicketContext.Provider value={value}>{children}</TicketContext.Provider>;
}

export function useTickets() {
  const context = useContext(TicketContext);
  if (!context) throw new Error("useTickets must be used inside TicketProvider");
  return context;
}
