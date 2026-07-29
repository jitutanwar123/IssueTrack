import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { getInitials } from "../utils/helpers.js";
import { plantLabel } from "../utils/plants.js";

function statusStyle(status) {
  switch ((status || "").toLowerCase()) {
    case "available": return { dot: "#10b981", label: "Available", ring: "rgba(16,185,129,0.15)", text: "#059669" };
    case "busy":      return { dot: "#f59e0b", label: "Busy",      ring: "rgba(245,158,11,0.15)",  text: "#d97706" };
    case "away":      return { dot: "#f97316", label: "Away",      ring: "rgba(249,115,22,0.15)",  text: "#ea580c" };
    case "offline":   return { dot: "#94a3b8", label: "Offline",   ring: "rgba(148,163,184,0.15)", text: "#64748b" };
    default:          return { dot: "#06b6d4", label: status,      ring: "rgba(6,182,212,0.15)",   text: "#0891b2" };
  }
}

export function Header({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const status = user?.status || "Available";
  const { dot, ring, text } = statusStyle(status);

  return (
    <header
      className="fixed z-20 dark:border-slate-700/80"
      style={{
        top: 0,
        left: "var(--sidebar-width, 15rem)",
        right: 0,
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(226,232,240,0.8)",
        height: "var(--header-h, 4rem)",
      }}
    >
      <style>{`
        [data-theme="dark"] header {
          background: rgba(13,17,23,0.92) !important;
          border-bottom-color: rgba(48,54,61,0.8) !important;
        }
      `}</style>
      <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: hamburger (mobile) + breadcrumb */}
        <div className="flex items-center gap-3">
          {/* Hamburger — only visible on mobile */}
          <button
            id="admin-menu-btn"
            onClick={onMenuClick}
            className="flex md:hidden items-center justify-center h-9 w-9 rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
            aria-label="Open menu"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
              Viraj Profiles Limited
            </p>
            <h1 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 leading-tight">
              Ticket Tracking Command Center
            </h1>
          </div>
        </div>

        {/* Right: dark mode toggle + status + user */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Dark Mode Toggle */}
          <button
            id="admin-theme-toggle"
            onClick={toggleTheme}
            className="flex items-center justify-center h-9 w-9 rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Light Mode" : "Dark Mode"}
          >
            {theme === "dark" ? (
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          {/* Status pill */}
          <div
            className="hidden md:flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold"
            style={{ background: "rgba(248,250,252,0.95)", color: text, border: "1px solid rgba(226,232,240,0.9)" }}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: dot, boxShadow: `0 0 0 3px ${ring}` }} />
            {status}
          </div>

          {/* Divider */}
          <div className="hidden md:block h-6 w-px bg-slate-200 dark:bg-slate-700" />

          {/* User card */}
          <div className="flex items-center gap-2 sm:gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-soft dark:border-slate-700 dark:bg-slate-800">
            {/* Avatar */}
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ background: "linear-gradient(135deg, #334155, #475569)" }}
            >
              {getInitials(user?.name || "U")}
            </div>
            <div className="hidden sm:block leading-tight">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user?.name}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {user?.role}{user?.plant ? ` · ${plantLabel(user.plant)}` : ""}
              </div>
            </div>

            {/* Divider */}
            <div className="h-5 w-px bg-slate-200 dark:bg-slate-700" />

            {/* Logout button */}
            <button
              onClick={logout}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 transition-all duration-150 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-700 dark:hover:text-slate-100"
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
