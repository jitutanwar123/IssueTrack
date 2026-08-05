import { NavLink } from "react-router-dom";
import virajLogo from "../viraaj.webp";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { plantLabel } from "../utils/plants.js";

const NAV = [
  {
    to: "/user/dashboard",
    label: "Dashboard",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[17px] w-[17px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    to: "/user/my-tickets",
    label: "My Tickets",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[17px] w-[17px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 7a2 2 0 0 0 2 2 2 2 0 0 1 0 4 2 2 0 0 0-2 2v2h16v-2a2 2 0 0 0-2-2 2 2 0 0 1 0-4 2 2 0 0 0 2-2V5H4Z" />
      </svg>
    ),
  },
  {
    to: "/user/create-ticket",
    label: "Create Ticket",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[17px] w-[17px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v8M8 12h8" />
      </svg>
    ),
  },
  {
    to: "/user/profile",
    label: "My Profile",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[17px] w-[17px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="7" r="4" />
        <path d="M5 21v-1a7 7 0 0 1 14 0v1" />
      </svg>
    ),
  },
];

export function UserSidebar({ open, onClose }) {
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const initials = user?.name
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";

  const subtitle = user?.plant ? plantLabel(user.plant) : user?.department || "User";

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
          fixed left-0 top-0 z-50 flex h-screen flex-col overflow-y-auto
          transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
        style={{
          width: "var(--sidebar-width-fixed, 15.5rem)",
          background: "linear-gradient(180deg, #07090f 0%, #0a0f1c 55%, #060910 100%)",
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
              background: "rgba(6,182,212,0.1)",
              border: "1px solid rgba(6,182,212,0.18)",
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full shrink-0"
              style={{ background: "#22d3ee", boxShadow: "0 0 6px rgba(34,211,238,0.55)" }}
            />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "#67e8f9" }}>
              User Support Portal
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto">
          <p className="sidebar-section-label mt-2 mb-2">Navigation</p>
          <div className="space-y-0.5">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className="relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200"
                style={({ isActive }) => ({
                  background: isActive ? "rgba(6,182,212,0.13)" : "transparent",
                  color: isActive ? "#ffffff" : "rgba(140,153,180,0.85)",
                })}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] rounded-r-full"
                        style={{ background: "#22d3ee" }}
                      />
                    )}
                    <span style={{ color: isActive ? "#22d3ee" : "inherit" }}>
                      {item.icon}
                    </span>
                    <span className="leading-none">{item.label}</span>
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
                style={{ background: "linear-gradient(135deg, #0e7490, #0891b2)" }}
              >
                {initials}
              </div>
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate text-[13px] font-semibold text-white">{user?.name || "User"}</div>
                <div className="truncate text-[10px] font-medium" style={{ color: "rgba(140,153,180,0.7)" }}>{subtitle}</div>
              </div>
              <button
                onClick={logout}
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
