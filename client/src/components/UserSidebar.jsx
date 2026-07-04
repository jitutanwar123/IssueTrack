import { NavLink } from "react-router-dom";
import virajLogo from "../viraaj.webp";
import { useAuth } from "../context/AuthContext.jsx";
import { plantLabel } from "../utils/plants.js";

const navItems = [
  { to: "/user/dashboard",     label: "Dashboard",     icon: "grid"   },
  { to: "/user/my-tickets",    label: "My Tickets",    icon: "ticket" },
  { to: "/user/create-ticket", label: "Create Ticket", icon: "plus"   },
  { to: "/user/profile",       label: "My Profile",    icon: "user"   },
];

function Icon({ name }) {
  const cls = "h-4 w-4 shrink-0";
  switch (name) {
    case "grid":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    case "ticket":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 7a2 2 0 0 0 2 2 2 2 0 0 1 0 4 2 2 0 0 0-2 2v2h16v-2a2 2 0 0 0-2-2 2 2 0 0 1 0-4 2 2 0 0 0 2-2V5H4Z" />
        </svg>
      );
    case "plus":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v8M8 12h8" />
        </svg>
      );
    case "user":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="7" r="4" />
          <path d="M5 21v-1a7 7 0 0 1 14 0v1" />
        </svg>
      );
    default: return null;
  }
}

export function UserSidebar() {
  const { logout, user } = useAuth();

  return (
    <aside
      className="fixed left-0 top-0 z-50 flex h-screen flex-col overflow-y-auto"
      style={{
        width: "var(--sidebar-width, 15rem)",
        background: "linear-gradient(180deg, #0b1220 0%, #111827 100%)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Logo */}
      <div className="px-5 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <img src={virajLogo} alt="Viraj Profiles" className="w-full max-w-[160px] h-auto object-contain" />
      </div>

      {/* Portal badge */}
      <div className="px-4 pt-4 pb-2">
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300">User Support Portal</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        <p className="sidebar-section-label mt-2 mb-1.5">Navigation</p>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive ? "text-white" : "hover:text-white"
              }`
            }
            style={({ isActive }) => ({
              background: isActive ? "rgba(6,182,212,0.15)" : "transparent",
              color: isActive ? "#ffffff" : "rgba(148,163,184,0.85)",
            })}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r"
                    style={{ background: "#22d3ee" }}
                  />
                )}
                <span style={{ color: isActive ? "#22d3ee" : "inherit" }}>
                  <Icon name={item.icon} />
                </span>
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="px-4 py-4 space-y-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        {user?.name && (
          <div className="flex items-center gap-3 px-2">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ background: "linear-gradient(135deg, #334155, #475569)" }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 leading-tight">
              <div className="truncate text-sm font-semibold text-white">{user.name}</div>
              <div className="text-[10px]" style={{ color: "rgba(148,163,184,0.66)" }}>
                {user.plant ? plantLabel(user.plant) : user.department || "User"}
              </div>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200 hover:text-white"
          style={{
            background: "rgba(255,255,255,0.04)",
            color: "rgba(226,232,240,0.72)",
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
