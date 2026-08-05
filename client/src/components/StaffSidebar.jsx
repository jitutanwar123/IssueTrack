import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import virajLogo from "../viraaj.webp";

const NAV = [
  {
    to: "/staff/dashboard",
    label: "My Tickets",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[17px] w-[17px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    to: "/staff/create-ticket",
    label: "Create Ticket",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[17px] w-[17px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v8M8 12h8" />
      </svg>
    ),
  },
  {
    to: "/staff/history",
    label: "Resolved History",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[17px] w-[17px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    to: "/staff/reports",
    label: "My Reports",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[17px] w-[17px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
];

export function StaffSidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/staff-login");
  }

  const initials = user?.name
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "IT";

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col overflow-y-auto
          transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
        style={{
          width: "var(--sidebar-width-fixed, 15.5rem)",
          background: "linear-gradient(180deg, #07090f 0%, #0a0b18 55%, #060810 100%)",
          borderRight: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center px-5 py-[18px]"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
        >
          <img src={virajLogo} alt="Viraj Profiles" className="h-8 w-auto object-contain" />
        </div>

        {/* Portal badge */}
        <div className="px-4 pt-4 pb-2">
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2"
            style={{
              background: "rgba(124,58,237,0.1)",
              border: "1px solid rgba(124,58,237,0.2)",
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full shrink-0"
              style={{ background: "#a78bfa", boxShadow: "0 0 6px rgba(167,139,250,0.6)" }}
            />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "#c4b5fd" }}>
              IT Staff Panel
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto">
          <p className="sidebar-section-label mt-2 mb-2">Workspace</p>
          <div className="space-y-0.5">
            {NAV.map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={onClose}
                className="relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200"
                style={({ isActive }) => ({
                  background: isActive ? "rgba(124,58,237,0.15)" : "transparent",
                  color: isActive ? "#ffffff" : "rgba(140,153,180,0.85)",
                })}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] rounded-r-full"
                        style={{ background: "#a78bfa" }}
                      />
                    )}
                    <span style={{ color: isActive ? "#a78bfa" : "inherit" }}>{icon}</span>
                    <span className="leading-none">{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Bottom */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          {/* Theme toggle */}
          <div className="px-3 pt-3 pb-2">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200 hover:bg-white/[0.06]"
              style={{
                color: "rgba(140,153,180,0.9)",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {theme === "dark" ? (
                <>
                  <svg viewBox="0 0 24 24" className="h-4 w-4 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="5" />
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                  </svg>
                  Light Mode
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                  Dark Mode
                </>
              )}
            </button>
          </div>

          {/* User card */}
          <div className="px-3 pt-1 pb-4">
            <div
              className="flex items-center gap-3 rounded-xl p-2.5"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white"
                style={{ background: user?.avatar_color || "linear-gradient(135deg, #5b21b6, #7c3aed)" }}
              >
                {initials}
              </div>
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate text-[13px] font-semibold text-white">{user?.name || "IT Staff"}</div>
                <div className="truncate text-[10px] font-medium" style={{ color: "rgba(140,153,180,0.7)" }}>{user?.role || "IT Staff"}</div>
              </div>
              <button
                onClick={handleLogout}
                title="Sign out"
                className="shrink-0 flex items-center justify-center h-7 w-7 rounded-lg transition-all duration-150 hover:bg-red-500/15"
                style={{ color: "rgba(140,153,180,0.6)" }}
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
