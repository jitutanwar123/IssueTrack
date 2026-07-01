import { useAuth } from "../context/AuthContext.jsx";
import { getInitials } from "../utils/helpers.js";

function statusStyle(status) {
  switch ((status || "").toLowerCase()) {
    case "available": return { dot: "#10b981", label: "Available", ring: "rgba(16,185,129,0.15)", text: "#059669" };
    case "busy":      return { dot: "#f59e0b", label: "Busy",      ring: "rgba(245,158,11,0.15)",  text: "#d97706" };
    case "away":      return { dot: "#f97316", label: "Away",      ring: "rgba(249,115,22,0.15)",  text: "#ea580c" };
    case "offline":   return { dot: "#94a3b8", label: "Offline",   ring: "rgba(148,163,184,0.15)", text: "#64748b" };
    default:          return { dot: "#06b6d4", label: status,      ring: "rgba(6,182,212,0.15)",   text: "#0891b2" };
  }
}

export function Header() {
  const { user, logout } = useAuth();
  const status = user?.status || "Available";
  const { dot, ring, text } = statusStyle(status);

  return (
    <header
      className="sticky top-0 z-20"
      style={{
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(226,232,240,0.8)",
        height: "var(--header-h, 4rem)",
      }}
    >
      <div className="flex h-full items-center justify-between px-6 lg:px-8">
        {/* Left: breadcrumb / title */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Viraj Profiles Limited
          </p>
          <h1 className="text-base font-bold text-slate-900 leading-tight">
            Ticket Tracking Command Center
          </h1>
        </div>

        {/* Right: status + user */}
        <div className="flex items-center gap-3">
          {/* Status pill */}
          <div
            className="hidden md:flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold"
            style={{ background: ring, color: text, border: `1px solid ${ring}` }}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: dot, boxShadow: `0 0 0 3px ${ring}` }} />
            {status}
          </div>

          {/* Divider */}
          <div className="hidden md:block h-6 w-px bg-slate-200" />

          {/* User card */}
          <div
            className="flex items-center gap-3 rounded-xl px-3 py-2"
            style={{ border: "1px solid #e2e8f0", background: "#f8fafc" }}
          >
            {/* Avatar */}
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ background: "linear-gradient(135deg, #1e40af, #2563eb)" }}
            >
              {getInitials(user?.name || "U")}
            </div>
            <div className="hidden sm:block leading-tight">
              <div className="text-sm font-semibold text-slate-900">{user?.name}</div>
              <div className="text-[11px] text-slate-500 font-medium">{user?.role}</div>
            </div>

            {/* Divider */}
            <div className="h-5 w-px bg-slate-200" />

            {/* Logout button */}
            <button
              onClick={logout}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-all duration-150 hover:bg-slate-200 hover:text-slate-900"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
