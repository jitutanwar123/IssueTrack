import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const NAV = [
  {
    to: "/staff/dashboard",
    label: "My Tickets",
    icon: (
      <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    to: "/staff/history",
    label: "Resolved History",
    icon: (
      <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    to: "/staff/reports",
    label: "My Reports",
    icon: (
      <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
];

export function StaffSidebar() {
  const { user, logout } = useAuth();
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
    <aside
      className="fixed inset-y-0 left-0 z-30 flex flex-col overflow-y-auto"
      style={{
        width: "var(--sidebar-width, 15rem)",
        background: "linear-gradient(180deg, #0f172a 0%, #111827 100%)",
        borderRight: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* Logo / Branding */}
      <div
        className="flex items-center gap-3 px-5 py-5"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white"
          style={{ background: "linear-gradient(135deg, #7c3aed, #8b5cf6)" }}
        >
          IT
        </div>
        <div className="leading-tight">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: "rgba(148,163,184,0.8)" }}>
            Viraj Profiles
          </div>
          <div className="text-sm font-bold text-white">Staff Portal</div>
        </div>
      </div>

      {/* Portal badge */}
      <div className="px-4 pt-4 pb-2">
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2"
          style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.22)" }}
        >
          <span className="h-1.5 w-1.5 rounded-full animate-pulse-slow" style={{ background: "#a78bfa" }} />
          <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "#a78bfa" }}>
            IT Staff Panel
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        <p className="sidebar-section-label mt-2 mb-1.5">Workspace</p>
        {NAV.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive ? "text-white" : "hover:text-white"
              }`
            }
            style={({ isActive }) => ({
              background: isActive ? "rgba(124,58,237,0.18)" : "transparent",
              color: isActive ? "#ffffff" : "rgba(148,163,184,0.85)",
            })}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r"
                    style={{ background: "#a78bfa" }}
                  />
                )}
                <span style={{ color: isActive ? "#a78bfa" : "inherit" }}>{icon}</span>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="px-4 py-4 space-y-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-3 px-2">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ background: user?.avatar_color || "linear-gradient(135deg, #7c3aed, #8b5cf6)" }}
          >
            {initials}
          </div>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-sm font-semibold text-white">{user?.name}</div>
            <div className="truncate text-[10px]" style={{ color: "rgba(148,163,184,0.82)" }}>
              {user?.role || "IT Staff"}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200 hover:text-white"
          style={{
            background: "rgba(255,255,255,0.04)",
            color: "rgba(148,163,184,0.7)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
