import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { getInitials } from "../utils/helpers.js";
import { plantLabel } from "../utils/plants.js";

function statusStyle(status) {
  switch ((status || "").toLowerCase()) {
    case "available": return { dot: "#10b981", label: "Available", bg: "rgba(16,185,129,0.08)", text: "#059669", border: "rgba(16,185,129,0.2)" };
    case "busy":      return { dot: "#f59e0b", label: "Busy",      bg: "rgba(245,158,11,0.08)",  text: "#d97706", border: "rgba(245,158,11,0.2)" };
    case "away":      return { dot: "#f97316", label: "Away",      bg: "rgba(249,115,22,0.08)",  text: "#ea580c", border: "rgba(249,115,22,0.2)" };
    case "offline":   return { dot: "#94a3b8", label: "Offline",   bg: "rgba(148,163,184,0.08)", text: "#64748b", border: "rgba(148,163,184,0.2)" };
    default:          return { dot: "#3b82f6", label: status,      bg: "rgba(59,130,246,0.08)",  text: "#2563eb", border: "rgba(59,130,246,0.2)" };
  }
}

export function Header({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const status = user?.status || "Available";
  const { dot, bg, text, border, label } = statusStyle(status);

  return (
    <header
      className="fixed z-20"
      style={{
        top: 0,
        left: "var(--sidebar-width, 15.5rem)",
        right: 0,
        background: theme === "dark"
          ? "rgba(10,13,20,0.92)"
          : "rgba(255,255,255,0.94)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: theme === "dark"
          ? "1px solid rgba(31,37,53,0.9)"
          : "1px solid rgba(215,225,238,0.9)",
        height: "var(--header-h, 4rem)",
        boxShadow: theme === "dark"
          ? "0 1px 0 rgba(0,0,0,0.4)"
          : "0 1px 0 rgba(215,225,238,0.5)",
      }}
    >
      <div className="flex h-full items-center justify-between px-4 sm:px-6">
        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            id="admin-menu-btn"
            onClick={onMenuClick}
            className="flex md:hidden items-center justify-center h-9 w-9 rounded-xl border bg-white shadow-sm transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
            style={{ borderColor: "#d8e1ed" }}
            aria-label="Open menu"
          >
            <svg viewBox="0 0 24 24" className="h-[17px] w-[17px] text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500 leading-none mb-0.5">
              Viraj Profiles Limited
            </p>
            <h1 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 leading-tight tracking-[-0.01em]">
              IT Ticket Command Center
            </h1>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            id="admin-theme-toggle"
            onClick={toggleTheme}
            className="flex items-center justify-center h-9 w-9 rounded-xl border bg-white shadow-sm transition-all hover:bg-slate-50 dark:border-slate-700/80 dark:bg-slate-800/80 dark:hover:bg-slate-700/80"
            style={{ borderColor: "#d8e1ed" }}
            aria-label="Toggle theme"
            title={theme === "dark" ? "Light Mode" : "Dark Mode"}
          >
            {theme === "dark" ? (
              <svg viewBox="0 0 24 24" className="h-[15px] w-[15px] text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-[15px] w-[15px] text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          {/* Status pill */}
          <div
            className="hidden md:flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold"
            style={{ background: bg, color: text, border: `1px solid ${border}` }}
          >
            <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: dot }} />
            {label}
          </div>

          {/* Divider */}
          <div className="hidden md:block h-6 w-px mx-1" style={{ background: "#dce8f0" }} />

          {/* User card */}
          <div
            className="flex items-center gap-2.5 rounded-xl border bg-white px-3 py-2 dark:border-slate-700/80 dark:bg-slate-800/80"
            style={{ borderColor: "#d8e1ed", boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}
          >
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white"
              style={{ background: "linear-gradient(135deg, #1d4ed8, #2563eb)" }}
            >
              {getInitials(user?.name || "A")}
            </div>
            <div className="hidden sm:block leading-tight">
              <div className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 leading-none mb-0.5">{user?.name}</div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-none">
                {user?.role}{user?.plant ? ` · ${plantLabel(user.plant)}` : ""}
              </div>
            </div>

            <div className="h-5 w-px mx-0.5" style={{ background: "#e2eaf4" }} />

            <button
              onClick={logout}
              title="Sign out"
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 transition-all duration-150 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
